// E-Commerce Premium License Manager
// Validates licenses against GeekTech.no API with 7-day offline cache.
// Tracks 5% transaction fees and reports them daily.

import { request as httpsRequest } from 'node:https';
import { request as httpRequest } from 'node:http';
import {
  getEcomLicense, setEcomLicense,
  addEcomFee, getUnreportedFees, markFeesReported, getEcomFeesTotal, getEcomFeesSummary
} from './database.js';
import { createLogger } from './logger.js';

const log = createLogger('ecom');

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const FEE_PCT = 5.0;

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
        catch { resolve({ status: res.statusCode, data: {} }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error('Request timeout')));
    req.write(payload);
    req.end();
  });
}

function _httpGet(urlStr) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const isHttps = url.protocol === 'https:';
    const reqFn = isHttps ? httpsRequest : httpRequest;
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    };
    const req = reqFn(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data: {} }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error('Request timeout')));
    req.end();
  });
}

export class EcomLicenseManager {
  constructor() {
    this._license = null;
    this._reportInterval = null;
  }

  async init() {
    this._license = getEcomLicense();
    if (!this._license) {
      console.log('[ecom-license] No license table found');
      return;
    }
    // If there's a license key, try hybrid validation
    if (this._license.license_key) {
      try {
        await this.validate();
      } catch (e) {
        console.log('[ecom-license] Validation error during init:', e.message);
      }
    }
    // Start daily fee reporting
    this._reportInterval = setInterval(() => this.reportFees().catch(e => log.warn('Fee reporting failed', e.message)), 24 * 60 * 60 * 1000);
    console.log('[ecom-license] Initialized (status: ' + (this._license.status || 'inactive') + ')');
  }

  shutdown() {
    if (this._reportInterval) clearInterval(this._reportInterval);
  }

  isActive() {
    if (!this._license) return false;
    if (this._license.status !== 'active') return false;
    if (this._license.expires_at && new Date(this._license.expires_at) < new Date()) {
      setEcomLicense({ status: 'expired' });
      this._license.status = 'expired';
      return false;
    }
    return true;
  }

  getStatus() {
    this._license = getEcomLicense();
    const fees = getEcomFeesTotal();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthSummary = getEcomFeesSummary(monthStart);
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
      is_pinned: this._license?.is_pinned || 0,
      expires_at: this._license?.expires_at || null,
      last_validated: this._license?.last_validated || null,
      instance_id: this._license?.instance_id || null,
      provider: 'geektech.no',
      fees_pending: fees?.pending_count || 0,
      fees_pending_total: fees?.pending_total || 0,
      fees_this_month: monthSummary?.[0]?.total_fees || 0,
      orders_this_month: monthSummary?.[0]?.order_count || 0,
      currency: monthSummary?.[0]?.currency || 'NOK'
    };
  }

  async validate(forceOnline = false) {
    this._license = getEcomLicense();
    if (!this._license?.license_key) return { valid: false, error: 'No license key' };

    // Check cache first (unless forced)
    if (!forceOnline && this._license.cached_response && this._license.last_validated) {
      const cacheAge = Date.now() - new Date(this._license.last_validated).getTime();
      if (cacheAge < CACHE_TTL_MS) {
        try {
          const cached = JSON.parse(this._license.cached_response);
          if (cached.valid) return cached;
        } catch { /* invalid cache, revalidate */ }
      }
    }

    // Online validation
    const apiUrl = this._license.geektech_api_url || 'https://geektech.no/api';
    try {
      // GeekTech API: POST /api/license/verify
      // Sender license_key, domain og ip_address
      const os = await import('node:os');
      const nets = os.networkInterfaces();
      const ipAddress = Object.values(nets).flat().find(n => n.family === 'IPv4' && !n.internal)?.address || null;

      const { status, data } = await _httpPost(`${apiUrl}/license/verify`, {
        license_key: this._license.license_key,
        domain: this._license.domain || null,
        ip_address: ipAddress
      });

      if (status >= 200 && status < 300 && data.valid) {
        setEcomLicense({
          status: 'active',
          holder_name: data.holder || null,
          plan: data.plan || null,
          features: JSON.stringify(data.features || []),
          max_printers: data.max_printers || data.units || 1,
          expires_at: data.expires_at || null,
          last_validated: new Date().toISOString(),
          cached_response: JSON.stringify(data)
        });
        this._license = getEcomLicense();
        return data;
      } else {
        const newStatus = data.error === 'License expired' ? 'expired' : 'invalid';
        setEcomLicense({ status: newStatus, last_validated: new Date().toISOString(), cached_response: JSON.stringify(data) });
        this._license = getEcomLicense();
        return { valid: false, error: data.error || 'Invalid license' };
      }
    } catch (e) {
      // Network error — use cached if available
      if (this._license.cached_response) {
        try {
          const cached = JSON.parse(this._license.cached_response);
          if (cached.valid) return { ...cached, offline: true };
        } catch { /* invalid cache */ }
      }
      return { valid: false, error: 'Cannot reach license server: ' + e.message };
    }
  }

  async activate(licenseKey, email, domain, phone) {
    // Lisensnøkkel må være 32 tegn hex
    if (!licenseKey || !/^[0-9a-fA-F]{32}$/.test(licenseKey.replace(/-/g, ''))) {
      return { valid: false, error: 'Lisensnøkkel må være 32 tegn hex (fra geektech.no)' };
    }

    setEcomLicense({
      license_key: licenseKey.replace(/-/g, ''),
      geektech_email: email || null,
      domain: domain || null,
      phone: phone || null,
      status: 'inactive'
    });
    this._license = getEcomLicense();
    const result = await this.validate(true);
    return result;
  }

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

  async reportFees() {
    if (!this.isActive()) return { ok: false, error: 'License not active' };

    const unreported = getUnreportedFees();
    if (!unreported.length) return { ok: true, accepted: 0 };

    const apiUrl = this._license.geektech_api_url || 'https://geektech.no/api';
    const orders = unreported.map(f => ({
      order_id: f.platform_order_id || String(f.order_id),
      platform: f.platform || 'custom',
      total_amount: f.order_total,
      currency: f.currency,
      fee_amount: f.fee_amount,
      items_count: 1,
      fulfilled_at: f.created_at
    }));

    try {
      const { status, data } = await _httpPost(`${apiUrl}/ecommerce/report`, {
        license_key: this._license.license_key,
        instance_id: this._license.instance_id,
        orders
      });

      if (status >= 200 && status < 300 && data.ok) {
        markFeesReported(unreported.map(f => f.id));
        setEcomLicense({ last_report_at: new Date().toISOString() });
        this._license = getEcomLicense();
        return { ok: true, accepted: data.accepted || unreported.length, balance_due: data.balance_due };
      }
      return { ok: false, error: data.error || 'Report failed' };
    } catch (e) {
      return { ok: false, error: 'Cannot reach server: ' + e.message };
    }
  }
}
