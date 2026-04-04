// E-Commerce Premium License Manager
// Validates licenses against GeekTech.no API (POST /api/license/verify).
// Auto-deactivates after 30 days without successful check-in.

import { request as httpsRequest } from 'node:https';
import { request as httpRequest } from 'node:http';
import {
  getEcomLicense, setEcomLicense,
  addEcomFee, getUnreportedFees, markFeesReported, getEcomFeesTotal, getEcomFeesSummary
} from './database.js';
import { createLogger } from './logger.js';

const log = createLogger('ecom');

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;      // 7 days grace period for offline use
const DEACTIVATE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days — auto-deactivate if no check-in
const REVALIDATE_INTERVAL_MS = 24 * 60 * 60 * 1000;  // check in daily
let FEE_PCT = 5.0; // default, overridden by geektech.no response (fee_pct field)
const GEEKTECH_API = 'https://geektech.no/api';

// ── HTTP helpers ──

function _httpPost(urlStr, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const isHttps = url.protocol === 'https:';
    const reqFn = isHttps ? httpsRequest : httpRequest;
    const payload = JSON.stringify(body);
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    };
    const req = reqFn(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data: { valid: false, error: 'Invalid JSON response from server' } }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error('Request timeout')));
    req.write(payload);
    req.end();
  });
}

async function _getNetworkInfo() {
  try {
    const os = await import('node:os');
    const nets = (os.default || os).networkInterfaces();
    const ifaces = Object.values(nets).flat().filter(n => !n.internal);
    return {
      ip: ifaces.find(n => n.family === 'IPv4')?.address || null,
      mac: ifaces.find(n => n.mac && n.mac !== '00:00:00:00:00:00')?.mac?.toUpperCase() || null
    };
  } catch { return { ip: null, mac: null }; }
}

// ── Integrity check — hash critical files to detect tampering ──

const INTEGRITY_FILES = [
  'server/ecom-license.js',
  'server/api-routes.js',
  'server/index.js'
];

async function _computeIntegrity(rootDir) {
  try {
    const { createHash } = await import('node:crypto');
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const hashes = {};
    for (const f of INTEGRITY_FILES) {
      try {
        const content = readFileSync(join(rootDir, f), 'utf8');
        hashes[f] = createHash('sha256').update(content).digest('hex').substring(0, 16);
      } catch { hashes[f] = 'missing'; }
    }
    // Combined fingerprint
    const combined = createHash('sha256').update(Object.values(hashes).join(':')).digest('hex').substring(0, 24);
    return { files: hashes, fingerprint: combined };
  } catch { return { files: {}, fingerprint: 'error' }; }
}

// ── License Manager ──

export class EcomLicenseManager {
  constructor() {
    this._license = null;
    this._interval = null;
    this._integrity = null;
    this._rootDir = null;
  }

  async init() {
    this._license = getEcomLicense();
    const { join } = await import('node:path');
    this._rootDir = join(import.meta.dirname, '..');

    if (!this._license) {
      log.info('No license configured');
      return;
    }

    // Compute file integrity hashes on startup
    this._integrity = await _computeIntegrity(this._rootDir);
    log.info('Integrity fingerprint: ' + this._integrity.fingerprint);

    // Validate on startup if we have a key
    if (this._license.license_key) {
      try { await this.validate(); }
      catch (e) { log.warn('Startup validation failed: ' + e.message); }
    }

    // Daily: revalidate license + integrity check
    this._interval = setInterval(() => {
      this._revalidate().catch(e => log.warn('Revalidation failed: ' + e.message));
      this._checkIntegrity().catch(() => {});
    }, REVALIDATE_INTERVAL_MS);

    // Also revalidate 30s after startup (non-blocking)
    setTimeout(() => this._revalidate().catch(() => {}), 30000);

    log.info('Initialized (status: ' + (this._license.status || 'inactive') + ')');
  }

  shutdown() {
    if (this._interval) clearInterval(this._interval);
  }

  // ── Integrity check — detect if license-critical files have been modified ──

  async _checkIntegrity() {
    if (!this._integrity || !this._rootDir) return;
    const current = await _computeIntegrity(this._rootDir);
    if (current.fingerprint !== this._integrity.fingerprint) {
      log.warn('Integrity change detected — files modified since startup');
      log.warn('  Startup: ' + this._integrity.fingerprint + ' Current: ' + current.fingerprint);
      for (const f of INTEGRITY_FILES) {
        if (this._integrity.files[f] !== current.files[f]) {
          log.warn('  Changed: ' + f);
        }
      }
      // Report to geektech.no on next check-in
      this._integrityChanged = true;
      this._integrity = current; // update baseline so we don't report every cycle
    }
  }

  // ── Check-in with geektech.no ──

  async _revalidate() {
    if (!this._license?.license_key) return;
    try {
      const result = await this.validate(true);
      if (result.valid) {
        log.info('Check-in OK (verify #' + (this._license.verify_count || 0) + ')');
      } else {
        log.warn('Check-in failed: ' + (result.error || result.code || 'unknown'));
      }
    } catch (e) {
      log.warn('Check-in error: ' + e.message);
    }
  }

  // ── Status checks ──

  isActive() {
    if (!this._license) return false;
    if (this._license.status !== 'active') return false;

    // Check expiry
    if (this._license.expires_at && new Date(this._license.expires_at) < new Date()) {
      log.warn('License expired at ' + this._license.expires_at);
      setEcomLicense({ status: 'expired' });
      this._license.status = 'expired';
      return false;
    }

    // Auto-deactivate if no successful check-in for 30 days
    if (this._license.last_validated) {
      const elapsed = Date.now() - new Date(this._license.last_validated).getTime();
      if (elapsed > DEACTIVATE_TTL_MS) {
        const days = Math.round(elapsed / 86400000);
        log.warn('Auto-deactivated — no check-in for ' + days + ' days. Contact geektech.no to reactivate.');
        setEcomLicense({ status: 'deactivated' });
        this._license.status = 'deactivated';
        return false;
      }
      if (elapsed > CACHE_TTL_MS) {
        const daysLeft = Math.round((DEACTIVATE_TTL_MS - elapsed) / 86400000);
        log.warn('Warning — last check-in ' + Math.round(elapsed / 86400000) + ' days ago. ' + daysLeft + ' days until auto-deactivation.');
      }
    }

    return true;
  }

  getStatus() {
    this._license = getEcomLicense();
    const fees = getEcomFeesTotal();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthSummary = getEcomFeesSummary(monthStart);
    const lastCheck = this._license?.last_validated ? new Date(this._license.last_validated).getTime() : null;
    const elapsed = lastCheck ? Date.now() - lastCheck : null;

    return {
      active: this.isActive(),
      status: this._license?.status || 'inactive',
      license_key: this._license?.license_key ? this._license.license_key.substring(0, 8) + '...' : null,
      holder: this._license?.holder_name || null,
      plan: this._license?.plan || null,
      email: this._license?.geektech_email || null,
      domain: this._license?.domain || null,
      phone: this._license?.phone || null,
      max_printers: this._license?.max_printers || 1,
      license_type: this._license?.license_type || 'none',
      allowed_ips: this._license?.allowed_ips || null,
      allowed_macs: this._license?.allowed_macs || null,
      verify_count: this._license?.verify_count || 0,
      is_pinned: this._license?.is_pinned || 0,
      expires_at: this._license?.expires_at || null,
      last_validated: this._license?.last_validated || null,
      days_since_checkin: elapsed != null ? Math.round(elapsed / 86400000) : null,
      days_until_deactivation: elapsed != null ? Math.max(0, Math.round((DEACTIVATE_TTL_MS - elapsed) / 86400000)) : null,
      instance_id: this._license?.instance_id || null,
      features: (() => { try { return JSON.parse(this._license?.features || '[]'); } catch { return []; } })(),
      fee_pct: FEE_PCT,
      provider: 'geektech.no',
      fees_pending: fees?.pending_count || 0,
      fees_pending_total: fees?.pending_total || 0,
      fees_this_month: monthSummary?.[0]?.total_fees || 0,
      orders_this_month: monthSummary?.[0]?.order_count || 0,
      currency: monthSummary?.[0]?.currency || 'NOK'
    };
  }

  // ── Validate against GeekTech.no API ──
  // Only endpoint: POST /api/license/verify
  // Request:  { license_key, domain, ip_address, mac_address }
  // Response: { valid, message, code, branding, license? }

  async validate(forceOnline = false) {
    this._license = getEcomLicense();
    if (!this._license?.license_key) return { valid: false, error: 'No license key' };

    // Use cache if fresh enough (unless forced)
    if (!forceOnline && this._license.cached_response && this._license.last_validated) {
      const cacheAge = Date.now() - new Date(this._license.last_validated).getTime();
      if (cacheAge < CACHE_TTL_MS) {
        try {
          const cached = JSON.parse(this._license.cached_response);
          if (cached.valid) return cached;
        } catch { /* invalid cache, continue to online */ }
      }
    }

    // Online: POST to geektech.no/api/license/verify
    const apiUrl = this._license.geektech_api_url || GEEKTECH_API;
    const net = await _getNetworkInfo();

    try {
      // Build payload — includes integrity data for call-home
      const payload = {
        license_key: this._license.license_key,
        domain: this._license.domain || null,
        ip_address: net.ip,
        mac_address: net.mac,
        instance_id: this._license.instance_id || null,
        app_version: null,
        integrity: this._integrity ? {
          fingerprint: this._integrity.fingerprint,
          files: this._integrity.files,
          tampered: !!this._integrityChanged
        } : null
      };

      // Add app version
      try {
        const { readFileSync } = await import('node:fs');
        const { join } = await import('node:path');
        const pkg = JSON.parse(readFileSync(join(this._rootDir || '.', 'package.json'), 'utf8'));
        payload.app_version = pkg.version;
      } catch {}

      // Clear tamper flag after reporting
      if (this._integrityChanged) this._integrityChanged = false;

      const { status, data } = await _httpPost(`${apiUrl}/license/verify`, payload);

      if (status >= 200 && status < 300 && data.valid) {
        // Check if server flagged integrity issue
        if (data.integrity_action === 'deactivate') {
          log.error('License deactivated by geektech.no — code tampering detected');
          setEcomLicense({ status: 'deactivated', cached_response: JSON.stringify(data) });
          this._license = getEcomLicense();
          return { valid: false, error: 'License deactivated by server — contact geektech.no', code: 'integrity_violation' };
        }

        // Success — update local state from geektech.no response
        const lic = data.license || {};
        const count = (this._license.verify_count || 0) + 1;

        // Update fee percentage from server (geektech.no controls this)
        if (data.fee_pct != null) FEE_PCT = data.fee_pct;

        setEcomLicense({
          status: 'active',
          holder_name: data.holder || data.customer_name || lic.customer_name || null,
          plan: data.plan || lic.plan || null,
          features: JSON.stringify(data.features || lic.features || []),
          max_printers: data.max_printers || data.max_units || lic.max_printers || null,
          license_type: data.license_type || lic.lock_type || this._license.license_type || 'none',
          allowed_ips: lic.allowed_ips || data.allowed_ips || null,
          allowed_macs: lic.allowed_macs || data.allowed_macs || null,
          domain: lic.domain || this._license.domain || null,
          expires_at: lic.expires_at || data.expires_at || null,
          last_validated: new Date().toISOString(),
          verify_count: count,
          cached_response: JSON.stringify(data)
        });
        this._license = getEcomLicense();
        log.info('License verified: plan=' + (data.plan || 'unknown') + ' features=' + (data.features || []).join(',') + ' fee=' + FEE_PCT + '%');
        return data;
      } else {
        // Server returned invalid/inactive/expired
        const code = data.code || '';
        let newStatus = 'invalid';
        if (code === 'license_inactive' || code === 'license_deactivated') newStatus = 'deactivated';
        else if (code === 'license_expired' || data.error?.includes('expired')) newStatus = 'expired';

        setEcomLicense({
          status: newStatus,
          last_validated: new Date().toISOString(),
          cached_response: JSON.stringify(data)
        });
        this._license = getEcomLicense();
        return { valid: false, error: data.error || data.message || 'License not valid', code };
      }
    } catch (e) {
      log.error('Verification failed: ' + e.message);
      // Network error — use cache if available and not too old
      if (this._license.cached_response) {
        try {
          const cached = JSON.parse(this._license.cached_response);
          if (cached.valid) return { ...cached, offline: true };
        } catch { /* invalid cache */ }
      }
      return { valid: false, error: 'Cannot reach geektech.no: ' + e.message };
    }
  }

  // ── Activate a new license key ──
  // Stores key locally, then validates against geektech.no

  async activate(licenseKey, email, domain, phone) {
    if (!licenseKey) return { valid: false, error: 'License key required' };

    // Strip dashes/spaces, uppercase
    const cleanKey = licenseKey.replace(/[-\s]/g, '').toUpperCase();

    // Accept any hex key that geektech.no accepts (currently 32 chars)
    if (!/^[0-9A-F]+$/.test(cleanKey)) {
      return { valid: false, error: 'License key must be hexadecimal characters' };
    }

    // Store and validate
    setEcomLicense({
      license_key: cleanKey,
      geektech_email: email || null,
      domain: domain || null,
      phone: phone || null,
      status: 'inactive'
    });
    this._license = getEcomLicense();
    return await this.validate(true);
  }

  // ── Deactivate (local only — removes key) ──

  deactivate() {
    setEcomLicense({
      license_key: null,
      geektech_email: null,
      status: 'inactive',
      holder_name: null,
      plan: null,
      features: '[]',
      expires_at: null,
      last_validated: null,
      cached_response: null
    });
    this._license = getEcomLicense();
    return { ok: true };
  }

  // ── Fee tracking ──

  addOrderFee(orderId, configId, orderTotal, currency = 'NOK') {
    if (!orderTotal || orderTotal <= 0) return null;
    const feeAmount = Math.round(orderTotal * (FEE_PCT / 100) * 100) / 100;
    return addEcomFee({
      order_id: orderId,
      ecom_config_id: configId,
      order_total: orderTotal,
      fee_pct: FEE_PCT,
      fee_amount: feeAmount,
      currency
    });
  }

  // Fee reporting — included in the daily verify call payload
  // GeekTech.no may not have a separate reporting endpoint,
  // so fees are tracked locally and can be reported when available
  async reportFees() {
    if (!this.isActive()) return { ok: false, error: 'License not active' };
    const unreported = getUnreportedFees();
    if (!unreported.length) return { ok: true, accepted: 0 };

    // Try to report via verify call with fees attached
    const apiUrl = this._license.geektech_api_url || GEEKTECH_API;
    const net = await _getNetworkInfo();

    try {
      const { status, data } = await _httpPost(`${apiUrl}/license/verify`, {
        license_key: this._license.license_key,
        domain: this._license.domain || null,
        ip_address: net.ip,
        mac_address: net.mac,
        report_fees: unreported.map(f => ({
          order_id: f.platform_order_id || String(f.order_id),
          total: f.order_total,
          fee: f.fee_amount,
          currency: f.currency,
          date: f.created_at
        }))
      });

      if (status >= 200 && status < 300 && (data.valid || data.fees_accepted)) {
        markFeesReported(unreported.map(f => f.id));
        log.info('Reported ' + unreported.length + ' fees to geektech.no');
        return { ok: true, accepted: unreported.length };
      }
      return { ok: false, error: data.error || 'Report not accepted' };
    } catch (e) {
      return { ok: false, error: 'Cannot reach geektech.no: ' + e.message };
    }
  }
}
