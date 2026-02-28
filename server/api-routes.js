import { getHistory, addHistory, getStatistics, getFilament, addFilament, updateFilament, deleteFilament, getErrors, getPrinters, addPrinter, updatePrinter, deletePrinter, addWaste, getWasteStats, getWasteHistory, getMaintenanceStatus, addMaintenanceEvent, getMaintenanceLog, getMaintenanceSchedule, upsertMaintenanceSchedule, getActiveNozzleSession, retireNozzleSession, createNozzleSession, getTelemetry, getComponentWear, getFirmwareHistory, getXcamEvents, getXcamStats, getAmsTrayLifetime, getDemoPrinterIds, purgeDemoData, getNotificationLog, getUpdateHistory } from './database.js';
import { saveConfig, config } from './config.js';
import { getThumbnail, getModel } from './thumbnail-service.js';
import https from 'node:https';
import { isAuthEnabled, isMultiUser, validateCredentials, createSession, destroySession, getSessionToken, validateSession } from './auth.js';

let _broadcastFn = null;
let _onPrinterRemoved = null;
let _onPrinterAdded = null;
let _onPrinterUpdated = null;
let _onDemoPurge = null;
let _notifier = null;
let _updater = null;
let _hub = null;
let _guard = null;

export function setGuard(guard) {
  _guard = guard;
}

export function setNotifier(notifier) {
  _notifier = notifier;
}

export function setUpdater(updater) {
  _updater = updater;
}

export function setHub(hub) {
  _hub = hub;
}

export function setApiBroadcast(fn) {
  _broadcastFn = fn;
}

export function setOnPrinterRemoved(fn) {
  _onPrinterRemoved = fn;
}

export function setOnPrinterAdded(fn) {
  _onPrinterAdded = fn;
}

export function setOnPrinterUpdated(fn) {
  _onPrinterUpdated = fn;
}

export function setOnDemoPurge(fn) {
  _onDemoPurge = fn;
}

export async function handleAuthApiRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  try {
    // GET /api/auth/status
    if (method === 'GET' && path === '/api/auth/status') {
      const enabled = isAuthEnabled();
      const token = getSessionToken(req);
      const authenticated = enabled ? validateSession(token) : true;
      const requiresUsername = isMultiUser() || !!(config.auth?.username);
      return sendJson(res, { enabled, authenticated, requiresUsername });
    }

    // POST /api/auth/login
    if (method === 'POST' && path === '/api/auth/login') {
      if (!isAuthEnabled()) {
        return sendJson(res, { ok: true });
      }
      return readBody(req, (body) => {
        const { password, username } = body;
        if (!validateCredentials(password, username)) {
          return sendJson(res, { error: 'Invalid credentials' }, 401);
        }
        const token = createSession(username);
        const maxAge = (config.auth?.sessionDurationHours || 24) * 3600;
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Set-Cookie': `bambu_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`
        });
        res.end(JSON.stringify({ ok: true }));
      });
    }

    // POST /api/auth/logout
    if (method === 'POST' && path === '/api/auth/logout') {
      const token = getSessionToken(req);
      if (token) destroySession(token);
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Set-Cookie': 'bambu_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'
      });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    sendJson(res, { error: 'Not found' }, 404);
  } catch (e) {
    console.error('[auth-api] Error:', e.message);
    sendJson(res, { error: 'Server error' }, 500);
  }
}

function broadcastPrinterMeta() {
  if (_broadcastFn) {
    _broadcastFn('printer_meta_update', { printers: getPrinters() });
  }
}

export async function handleApiRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  try {
    // ---- Printers ----
    if (method === 'GET' && path === '/api/printers') {
      return sendJson(res, getPrinters());
    }

    if (method === 'POST' && path === '/api/printers') {
      return readBody(req, (body) => {
        body.id = body.id || body.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        addPrinter(body);
        if (_onPrinterAdded) _onPrinterAdded(body);
        broadcastPrinterMeta();
        sendJson(res, { ok: true, id: body.id }, 201);
      });
    }

    const printerMatch = path.match(/^\/api\/printers\/([a-zA-Z0-9_-]+)$/);
    if (printerMatch && method === 'PUT') {
      return readBody(req, (body) => {
        const id = printerMatch[1];
        updatePrinter(id, body);
        if (_onPrinterUpdated) _onPrinterUpdated(id, { ...body, id });
        broadcastPrinterMeta();
        sendJson(res, { ok: true });
      });
    }

    if (printerMatch && method === 'DELETE') {
      const id = printerMatch[1];
      deletePrinter(id);
      if (_onPrinterRemoved) _onPrinterRemoved(id);
      broadcastPrinterMeta();
      return sendJson(res, { ok: true });
    }

    // ---- History ----
    if (method === 'GET' && path === '/api/history') {
      const limit = parseInt(url.searchParams.get('limit')) || 50;
      const offset = parseInt(url.searchParams.get('offset')) || 0;
      const printerId = url.searchParams.get('printer_id') || null;
      return sendJson(res, getHistory(limit, offset, printerId));
    }

    // ---- CSV Export ----
    if (method === 'GET' && path === '/api/history/export') {
      const printerId = url.searchParams.get('printer_id') || null;
      const rows = getHistory(10000, 0, printerId);

      const header = 'Dato;Filnavn;Status;Varighet (s);Filament (g);Type;Farge;Lag;Notater\n';
      const csv = header + rows.map(r =>
        `${r.started_at};${r.filename || ''};${r.status || ''};${r.duration_seconds || ''};${r.filament_used_g || ''};${r.filament_type || ''};${r.filament_color || ''};${r.layer_count || ''};${(r.notes || '').replace(/;/g, ',')}`
      ).join('\n');

      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="utskriftshistorikk.csv"'
      });
      res.end(csv);
      return;
    }

    // ---- Statistics ----
    if (method === 'GET' && path === '/api/statistics') {
      const printerId = url.searchParams.get('printer_id') || null;
      return sendJson(res, getStatistics(printerId));
    }

    // ---- Filament ----
    if (method === 'GET' && path === '/api/filament') {
      const printerId = url.searchParams.get('printer_id') || null;
      return sendJson(res, getFilament(printerId));
    }

    if (method === 'POST' && path === '/api/filament') {
      return readBody(req, (body) => {
        addFilament(body);
        sendJson(res, { ok: true }, 201);
      });
    }

    const filamentMatch = path.match(/^\/api\/filament\/(\d+)$/);
    if (filamentMatch && method === 'PUT') {
      return readBody(req, (body) => {
        updateFilament(parseInt(filamentMatch[1]), body);
        sendJson(res, { ok: true });
      });
    }

    if (filamentMatch && method === 'DELETE') {
      deleteFilament(parseInt(filamentMatch[1]));
      return sendJson(res, { ok: true });
    }

    // ---- Waste ----
    if (method === 'GET' && path === '/api/waste/stats') {
      const printerId = url.searchParams.get('printer_id') || null;
      return sendJson(res, getWasteStats(printerId));
    }

    if (method === 'GET' && path === '/api/waste/history') {
      const limit = parseInt(url.searchParams.get('limit')) || 50;
      const printerId = url.searchParams.get('printer_id') || null;
      return sendJson(res, getWasteHistory(limit, printerId));
    }

    if (method === 'POST' && path === '/api/waste') {
      return readBody(req, (body) => {
        if (!body.waste_g || body.waste_g <= 0) {
          return sendJson(res, { error: 'waste_g required' }, 400);
        }
        addWaste({
          printer_id: body.printer_id || null,
          waste_g: body.waste_g,
          reason: body.reason || 'manual',
          notes: body.notes || null
        });
        sendJson(res, { ok: true }, 201);
      });
    }

    // ---- Maintenance ----
    if (method === 'GET' && path === '/api/maintenance/status') {
      const printerId = url.searchParams.get('printer_id');
      if (!printerId) return sendJson(res, { error: 'printer_id required' }, 400);
      return sendJson(res, getMaintenanceStatus(printerId));
    }

    if (method === 'GET' && path === '/api/maintenance/log') {
      const printerId = url.searchParams.get('printer_id') || null;
      const limit = parseInt(url.searchParams.get('limit')) || 50;
      return sendJson(res, getMaintenanceLog(printerId, limit));
    }

    if (method === 'POST' && path === '/api/maintenance/log') {
      return readBody(req, (body) => {
        if (!body.component || !body.action) {
          return sendJson(res, { error: 'component and action required' }, 400);
        }
        addMaintenanceEvent(body);
        sendJson(res, { ok: true }, 201);
      });
    }

    if (method === 'GET' && path === '/api/maintenance/schedule') {
      const printerId = url.searchParams.get('printer_id');
      if (!printerId) return sendJson(res, { error: 'printer_id required' }, 400);
      return sendJson(res, getMaintenanceSchedule(printerId));
    }

    if (method === 'PUT' && path === '/api/maintenance/schedule') {
      return readBody(req, (body) => {
        if (!body.printer_id || !body.component || !body.interval_hours) {
          return sendJson(res, { error: 'printer_id, component, interval_hours required' }, 400);
        }
        upsertMaintenanceSchedule(body.printer_id, body.component, body.interval_hours, body.label || body.component);
        sendJson(res, { ok: true });
      });
    }

    if (method === 'POST' && path === '/api/maintenance/nozzle-change') {
      return readBody(req, (body) => {
        if (!body.printer_id || !body.nozzle_type || !body.nozzle_diameter) {
          return sendJson(res, { error: 'printer_id, nozzle_type, nozzle_diameter required' }, 400);
        }
        const active = getActiveNozzleSession(body.printer_id);
        if (active) retireNozzleSession(active.id);
        createNozzleSession(body.printer_id, body.nozzle_type, body.nozzle_diameter);
        addMaintenanceEvent({
          printer_id: body.printer_id, component: 'nozzle', action: 'replaced',
          notes: body.notes || null, nozzle_type: body.nozzle_type, nozzle_diameter: body.nozzle_diameter
        });
        sendJson(res, { ok: true }, 201);
      });
    }

    // ---- Errors ----
    if (method === 'GET' && path === '/api/errors') {
      const limit = parseInt(url.searchParams.get('limit')) || 50;
      const printerId = url.searchParams.get('printer_id') || null;
      return sendJson(res, getErrors(limit, printerId));
    }

    // ---- Telemetry ----
    if (method === 'GET' && path === '/api/telemetry') {
      const printerId = url.searchParams.get('printer_id');
      if (!printerId) return sendJson(res, { error: 'printer_id required' }, 400);
      const from = url.searchParams.get('from') || new Date(Date.now() - 3600000).toISOString();
      const to = url.searchParams.get('to') || new Date().toISOString();
      const resolution = url.searchParams.get('resolution') || '1m';
      return sendJson(res, getTelemetry(printerId, from, to, resolution));
    }

    // ---- Component Wear ----
    if (method === 'GET' && path === '/api/wear') {
      const printerId = url.searchParams.get('printer_id');
      if (!printerId) return sendJson(res, { error: 'printer_id required' }, 400);
      return sendJson(res, getComponentWear(printerId));
    }

    // ---- Firmware History ----
    if (method === 'GET' && path === '/api/firmware') {
      const printerId = url.searchParams.get('printer_id');
      if (!printerId) return sendJson(res, { error: 'printer_id required' }, 400);
      return sendJson(res, getFirmwareHistory(printerId));
    }

    // ---- XCam Events ----
    if (method === 'GET' && path === '/api/xcam/events') {
      const printerId = url.searchParams.get('printer_id') || null;
      const limit = parseInt(url.searchParams.get('limit')) || 50;
      return sendJson(res, getXcamEvents(printerId, limit));
    }

    if (method === 'GET' && path === '/api/xcam/stats') {
      const printerId = url.searchParams.get('printer_id') || null;
      return sendJson(res, getXcamStats(printerId));
    }

    // ---- AMS Tray Lifetime ----
    if (method === 'GET' && path === '/api/ams/lifetime') {
      const printerId = url.searchParams.get('printer_id');
      if (!printerId) return sendJson(res, { error: 'printer_id required' }, 400);
      return sendJson(res, getAmsTrayLifetime(printerId));
    }

    // ---- Print Guard / Protection ----
    if (method === 'GET' && path === '/api/protection/settings') {
      const printerId = url.searchParams.get('printer_id');
      if (!printerId) return sendJson(res, { error: 'printer_id required' }, 400);
      if (!_guard) return sendJson(res, { error: 'Guard not initialized' }, 500);
      return sendJson(res, _guard.getSettings(printerId) || { printer_id: printerId, enabled: 1, spaghetti_action: 'pause', first_layer_action: 'notify', foreign_object_action: 'pause', nozzle_clump_action: 'pause', cooldown_seconds: 60, auto_resume: 0 });
    }

    if (method === 'PUT' && path === '/api/protection/settings') {
      if (!_guard) return sendJson(res, { error: 'Guard not initialized' }, 500);
      return readBody(req, (body) => {
        if (!body.printer_id) return sendJson(res, { error: 'printer_id required' }, 400);
        _guard.updateSettings(body.printer_id, body);
        return sendJson(res, { ok: true });
      });
    }

    if (method === 'GET' && path === '/api/protection/status') {
      const printerId = url.searchParams.get('printer_id') || null;
      if (!_guard) return sendJson(res, { error: 'Guard not initialized' }, 500);
      if (printerId) {
        return sendJson(res, _guard.getStatus(printerId));
      }
      return sendJson(res, { alerts: _guard.getAllActiveAlerts() });
    }

    if (method === 'GET' && path === '/api/protection/log') {
      const printerId = url.searchParams.get('printer_id') || null;
      const limit = parseInt(url.searchParams.get('limit')) || 50;
      if (!_guard) return sendJson(res, { error: 'Guard not initialized' }, 500);
      return sendJson(res, _guard.getLog(printerId, limit));
    }

    if (method === 'POST' && path === '/api/protection/resolve') {
      if (!_guard) return sendJson(res, { error: 'Guard not initialized' }, 500);
      return readBody(req, (body) => {
        if (!body.logId) return sendJson(res, { error: 'logId required' }, 400);
        _guard.resolve(body.logId);
        return sendJson(res, { ok: true });
      });
    }

    if (method === 'POST' && path === '/api/protection/test') {
      if (!_guard) return sendJson(res, { error: 'Guard not initialized' }, 500);
      return readBody(req, (body) => {
        const printerId = body.printer_id;
        const eventType = body.event_type || 'spaghetti_detected';
        if (!printerId) return sendJson(res, { error: 'printer_id required' }, 400);
        _guard.handleEvent(printerId, eventType, null);
        return sendJson(res, { ok: true });
      });
    }

    // ---- Demo data ----
    if (method === 'GET' && path === '/api/demo/status') {
      const ids = getDemoPrinterIds();
      return sendJson(res, { hasDemo: ids.length > 0, printerIds: ids });
    }

    if (method === 'DELETE' && path === '/api/demo') {
      const result = purgeDemoData();
      if (result.printerIds) {
        // Stop mock printers and clean up hub meta
        if (_onDemoPurge) _onDemoPurge(result.printerIds);
        for (const id of result.printerIds) {
          if (_onPrinterRemoved) _onPrinterRemoved(id);
        }
        broadcastPrinterMeta();
      }
      return sendJson(res, result);
    }

    // ---- Auth Config ----
    if (method === 'GET' && path === '/api/auth/config') {
      const ac = structuredClone(config.auth || {});
      // Mask passwords
      if (ac.password) ac.password = '***';
      if (ac.users) {
        ac.users = ac.users.map(u => ({ username: u.username, password: '***' }));
      }
      ac.envManaged = !!(process.env.BAMBU_AUTH_PASSWORD);
      return sendJson(res, ac);
    }

    if (method === 'PUT' && path === '/api/auth/config') {
      if (process.env.BAMBU_AUTH_PASSWORD) {
        return sendJson(res, { error: 'Auth is managed via environment variables' }, 400);
      }
      return readBody(req, (body) => {
        // Handle users array — preserve masked passwords
        if (Array.isArray(body.users)) {
          const existingUsers = config.auth?.users || [];
          body.users = body.users
            .filter(u => u.username && u.username.trim())
            .map(u => {
              if (u.password === '***') {
                const existing = existingUsers.find(e => e.username === u.username);
                return { username: u.username.trim(), password: existing?.password || '' };
              }
              return { username: u.username.trim(), password: u.password || '' };
            })
            .filter(u => u.password); // Remove users with no password
        }

        // Legacy single-user: preserve existing password if masked
        if (body.password === '***') body.password = config.auth?.password || '';

        // If no users and no password, disable auth
        const hasUsers = body.users?.length > 0;
        const hasPassword = !!body.password;
        if (!hasUsers && !hasPassword) body.enabled = false;

        config.auth = { ...config.auth, ...body };
        saveConfig({ auth: config.auth });
        console.log(`[auth] Config updated: enabled=${config.auth.enabled}, users=${config.auth.users?.length || 0}`);
        sendJson(res, { ok: true });
      });
    }

    // ---- Notifications ----
    if (method === 'GET' && path === '/api/notifications/config') {
      const nc = structuredClone(config.notifications || {});
      // Mask sensitive fields
      if (nc.channels?.telegram?.botToken) nc.channels.telegram.botToken = '***';
      if (nc.channels?.email?.pass) nc.channels.email.pass = '***';
      if (nc.channels?.ntfy?.token && nc.channels.ntfy.token) nc.channels.ntfy.token = '***';
      if (nc.channels?.pushover?.apiToken) nc.channels.pushover.apiToken = '***';
      return sendJson(res, nc);
    }

    if (method === 'PUT' && path === '/api/notifications/config') {
      return readBody(req, (body) => {
        // Preserve existing secrets if masked
        const current = config.notifications || {};
        if (body.channels?.telegram?.botToken === '***') body.channels.telegram.botToken = current.channels?.telegram?.botToken || '';
        if (body.channels?.email?.pass === '***') body.channels.email.pass = current.channels?.email?.pass || '';
        if (body.channels?.ntfy?.token === '***') body.channels.ntfy.token = current.channels?.ntfy?.token || '';
        if (body.channels?.pushover?.apiToken === '***') body.channels.pushover.apiToken = current.channels?.pushover?.apiToken || '';

        saveConfig({ notifications: body });
        config.notifications = body;
        if (_notifier) _notifier.reloadConfig(body);
        sendJson(res, { ok: true });
      });
    }

    if (method === 'POST' && path === '/api/notifications/test') {
      return readBody(req, async (body) => {
        if (!body.channel || !body.config) {
          return sendJson(res, { error: 'channel and config required' }, 400);
        }
        if (!_notifier) return sendJson(res, { error: 'Notifier not initialized' }, 500);
        try {
          await _notifier.testChannel(body.channel, body.config);
          sendJson(res, { ok: true });
        } catch (err) {
          sendJson(res, { error: err.message }, 400);
        }
      });
    }

    if (method === 'GET' && path === '/api/notifications/log') {
      const limit = parseInt(url.searchParams.get('limit')) || 50;
      const offset = parseInt(url.searchParams.get('offset')) || 0;
      return sendJson(res, getNotificationLog(limit, offset));
    }

    // ---- Update ----
    if (method === 'GET' && path === '/api/update/status') {
      if (!_updater) return sendJson(res, { error: 'Updater not initialized' }, 500);
      return sendJson(res, _updater.getStatus());
    }

    if (method === 'POST' && path === '/api/update/check') {
      if (!_updater) return sendJson(res, { error: 'Updater not initialized' }, 500);
      try {
        const status = await _updater.checkForUpdate(true);
        return sendJson(res, status);
      } catch (err) {
        return sendJson(res, { error: err.message }, 500);
      }
    }

    if (method === 'POST' && path === '/api/update/apply') {
      if (!_updater) return sendJson(res, { error: 'Updater not initialized' }, 500);
      try {
        const result = await _updater.applyUpdate();
        return sendJson(res, result);
      } catch (err) {
        const status = err.message.includes('print') ? 409 : 400;
        return sendJson(res, { error: err.message }, status);
      }
    }

    if (method === 'GET' && path === '/api/update/history') {
      const limit = parseInt(url.searchParams.get('limit')) || 20;
      return sendJson(res, getUpdateHistory(limit));
    }

    // ---- Telemetry stats (proxy to Cloudflare Worker) ----
    if (method === 'GET' && path === '/api/telemetry/stats') {
      try {
        const resp = await fetch('https://telemetry.geektech.no/stats', {
          signal: AbortSignal.timeout(5000)
        });
        const data = await resp.json();
        return sendJson(res, data);
      } catch {
        return sendJson(res, { error: 'Telemetry unavailable' }, 502);
      }
    }

    // ---- MakerWorld ----
    const mwMatch = path.match(/^\/api\/makerworld\/(\d+)$/);
    if (mwMatch && method === 'GET') {
      const designId = mwMatch[1];
      return handleMakerWorldFetch(designId, res);
    }

    // ---- 3D Model ----
    const modelMatch = path.match(/^\/api\/model\/([a-zA-Z0-9_-]+)$/);
    if (modelMatch && method === 'GET') {
      const id = modelMatch[1];
      try {
        const model = await getModel(id, _hub);
        if (!model) return sendJson(res, null, 404);
        return sendJson(res, model);
      } catch (err) {
        console.warn('[api] Model error:', err.message);
        return sendJson(res, { error: 'Model error' }, 500);
      }
    }

    // ---- Thumbnail ----
    const thumbMatch = path.match(/^\/api\/thumbnail\/([a-zA-Z0-9_-]+)$/);
    if (thumbMatch && method === 'GET') {
      const id = thumbMatch[1];
      try {
        const result = await getThumbnail(id, _hub);
        if (!result) {
          res.writeHead(404);
          res.end();
          return;
        }
        res.writeHead(200, {
          'Content-Type': result.contentType,
          'Content-Length': result.buffer.length,
          'Cache-Control': 'private, max-age=60'
        });
        res.end(result.buffer);
      } catch (err) {
        console.warn('[api] Thumbnail error:', err.message);
        res.writeHead(500);
        res.end();
      }
      return;
    }

    // 404
    sendJson(res, { error: 'Ikke funnet' }, 404);

  } catch (e) {
    console.error('[api] Feil:', e.message);
    sendJson(res, { error: 'Serverfeil' }, 500);
  }
}

function sendJson(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function readBody(req, callback) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      callback(JSON.parse(body));
    } catch (e) {
      callback({});
    }
  });
}

// ---- MakerWorld proxy ----

const _mwCache = new Map();
const MW_CACHE_TTL = 3600000; // 1 hour

async function handleMakerWorldFetch(designId, res) {
  const cached = _mwCache.get(designId);
  if (cached && Date.now() - cached.ts < MW_CACHE_TTL) {
    return sendJson(res, cached.data);
  }

  const mwUrl = `https://makerworld.com/en/models/${designId}`;
  const apiUrl = `https://api.bambulab.com/v1/design-service/design/${designId}`;

  try {
    const json = await fetchJson(apiUrl, 5000);
    const creator = json.designCreator || {};
    const instance = (json.instances || [])[0] || {};
    const data = {
      title: json.titleTranslated || json.title || null,
      image: json.coverUrl || instance.cover || null,
      description: (json.summaryTranslated || json.summary || '').replace(/<[^>]*>/g, ''),
      url: mwUrl,
      designer: creator.name || null,
      designerAvatar: creator.avatar || null,
      likes: json.likeCount || 0,
      downloads: json.downloadCount || 0,
      prints: json.printCount || 0,
      fallback: false
    };
    _mwCache.set(designId, { data, ts: Date.now() });
    sendJson(res, data);
  } catch {
    const fallback = { url: mwUrl, fallback: true };
    _mwCache.set(designId, { data: fallback, ts: Date.now() });
    sendJson(res, fallback);
  }
}

function fetchJson(url, timeout) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'Accept': 'application/json' },
      timeout
    }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Invalid JSON')); }
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}
