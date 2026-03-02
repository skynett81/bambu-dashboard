import { getHistory, addHistory, getStatistics, getFilament, addFilament, updateFilament, deleteFilament, getErrors, acknowledgeError, deleteError, acknowledgeAllErrors, getPrinters, addPrinter, updatePrinter, deletePrinter, addWaste, getWasteStats, getWasteHistory, getMaintenanceStatus, addMaintenanceEvent, getMaintenanceLog, getMaintenanceSchedule, upsertMaintenanceSchedule, getActiveNozzleSession, retireNozzleSession, createNozzleSession, getTelemetry, getComponentWear, getFirmwareHistory, getXcamEvents, getXcamStats, getAmsTrayLifetime, getDemoPrinterIds, purgeDemoData, getNotificationLog, getUpdateHistory, getModelLink, setModelLink, deleteModelLink, getRecentModelLinks, getVendors, addVendor, updateVendor, deleteVendor, getFilamentProfiles, getFilamentProfile, addFilamentProfile, updateFilamentProfile, deleteFilamentProfile, getSpools, getSpool, addSpool, updateSpool, deleteSpool, archiveSpool, useSpoolWeight, assignSpoolToSlot, getSpoolUsageLog, getLocations, addLocation, updateLocation, deleteLocation, getInventoryStats, searchSpools, duplicateSpool, measureSpoolWeight, getAllSpoolsForExport, getAllFilamentProfilesForExport, getAllVendorsForExport, findSimilarColors, getDistinctMaterials, getDistinctLotNumbers, getDistinctArticleNumbers, getInventorySetting, setInventorySetting, getAllInventorySettings, importSpools, importFilamentProfiles, importVendors, getFieldSchemas, addFieldSchema, deleteFieldSchema, lengthToWeight, getDryingSessions, getActiveDryingSessions, startDryingSession, completeDryingSession, deleteDryingSession, getDryingPresets, getDryingPreset, upsertDryingPreset, deleteDryingPreset, getSpoolsDryingStatus, getUsagePredictions, estimatePrintCost, createQueue, getQueues, getQueue, updateQueue, deleteQueue, addQueueItem, getQueueItem, updateQueueItem, deleteQueueItem, reorderQueueItems, getActiveQueueItems, addQueueLog, getQueueLog, getNextPendingItem, getTags, createTag, deleteTag, assignTag, unassignTag, getEntityTags, getNfcMappings, lookupNfcTag, linkNfcTag, unlinkNfcTag, updateNfcScan, checkoutSpool, checkinSpool, getCheckedOutSpools, getCheckoutLog, addSpoolEvent, getSpoolTimeline, getRecentSpoolEvents, bulkDeleteSpools, bulkArchiveSpools, bulkRelocateSpools, bulkMarkDried, getMacros, getMacro, addMacro, updateMacro, deleteMacro, getWebhookConfigs, getWebhookConfig, addWebhookConfig, updateWebhookConfig, deleteWebhookConfig, getActiveWebhooks, addWebhookDelivery, updateWebhookDelivery, getWebhookDeliveries, savePrintCost, getPrintCost, getCostReport, getCostSummary, estimatePrintCostAdvanced, getMaterials, getMaterial, getMaterialByName, updateMaterial, addMaterial, getHardwareItems, getHardwareItem, addHardwareItem, updateHardwareItem, deleteHardwareItem, assignHardware, unassignHardware, getHardwareForPrinter, getHardwareAssignments, getRoles, getRole, addRole, updateRole, deleteRole, getUsers, getUser, addUser, updateUser, deleteUser, getApiKeys, addApiKey, deleteApiKey, deactivateApiKey, getEcommerceConfigs, getEcommerceConfig, addEcommerceConfig, updateEcommerceConfig, deleteEcommerceConfig, getEcommerceOrders, getEcommerceOrder, addEcommerceOrder, updateEcommerceOrder, getTimelapseRecordings, getTimelapseRecording, deleteTimelapseRecording, getPushSubscriptions, addPushSubscription, deletePushSubscription, getCommunityFilaments, getCommunityFilament, searchCommunityByColor, getCommunityManufacturers, getCommunityMaterials, addCommunityFilament, updateCommunityFilament, deleteCommunityFilament, getBrandDefaults, getBrandDefault, upsertBrandDefault, deleteBrandDefault, getCustomFieldDefs, getCustomFieldDef, addCustomFieldDef, updateCustomFieldDef, deleteCustomFieldDef, getCustomFieldValues, setCustomFieldValue, deleteCustomFieldValues, getPrinterGroups, getPrinterGroup, addPrinterGroup, updatePrinterGroup, deletePrinterGroup, addPrinterToGroup, removePrinterFromGroup, getGroupMembers, getPrinterGroupsForPrinter, getProjects, getProject, addProject, updateProject, deleteProject, getProjectPrints, addProjectPrint, updateProjectPrint, deleteProjectPrint, getExportTemplates, getExportTemplate, addExportTemplate, deleteExportTemplate, getUserQuota, upsertUserQuota, addUserTransaction, getUserTransactions, getFailureDetections, getFailureDetection, addFailureDetection, acknowledgeFailureDetection, deleteFailureDetection, getPriceHistory, addPriceEntry, getLowestPrice, getPriceStats, getBuildPlates, getBuildPlate, addBuildPlate, updateBuildPlate, deleteBuildPlate, incrementBuildPlatePrintCount, getDryerModels, getDryerModel, addDryerModel, updateDryerModel, deleteDryerModel, getStorageConditions, getLatestStorageCondition, addStorageCondition, deleteStorageCondition, getCourses, getCourse, addCourse, updateCourse, deleteCourse, getCourseProgress, upsertCourseProgress, getUserCourseProgress, getAllCoursesWithProgress, searchSpoolsByColor, generateSpoolName, getEcomFees, getEcomFeesSummary, getEcomFeesTotal, getKbPrinters, getKbPrinter, addKbPrinter, updateKbPrinter, deleteKbPrinter, getKbAccessories, getKbAccessory, addKbAccessory, updateKbAccessory, deleteKbAccessory, getKbFilaments, getKbFilament, addKbFilament, updateKbFilament, deleteKbFilament, getKbProfiles, getKbProfile, addKbProfile, updateKbProfile, deleteKbProfile, searchKb, getKbStats, getKbTags, addKbTag, deleteKbTag, seedKbData } from './database.js';
import { createBackup, listBackups } from './backup.js';
import { saveConfig, config } from './config.js';
import { getThumbnail, getModel } from './thumbnail-service.js';
import { lookupHmsCode, getHmsWikiUrl } from './print-tracker.js';
import https from 'node:https';
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import { readFileSync, existsSync, statSync, createReadStream } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isAuthEnabled, isMultiUser, validateCredentials, createSession, destroySession, getSessionToken, validateSession, hashPassword, validateApiKey, generateApiKey, hasPermission, validateCredentialsDB, getSessionUser } from './auth.js';

// ---- Login rate limiter ----
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const _loginAttempts = new Map(); // ip -> { count, firstAttempt }

function checkLoginRate(ip) {
  const now = Date.now();
  const entry = _loginAttempts.get(ip);
  if (!entry || now - entry.firstAttempt > LOGIN_WINDOW_MS) {
    _loginAttempts.set(ip, { count: 1, firstAttempt: now });
    return true;
  }
  entry.count++;
  return entry.count <= LOGIN_MAX_ATTEMPTS;
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of _loginAttempts) {
    if (now - entry.firstAttempt > LOGIN_WINDOW_MS) _loginAttempts.delete(ip);
  }
}, 5 * 60 * 1000);

let _broadcastFn = null;
let _onPrinterRemoved = null;
let _onPrinterAdded = null;
let _onPrinterUpdated = null;
let _onDemoPurge = null;
let _notifier = null;
let _updater = null;
let _hub = null;
let _guard = null;
let _queueManager = null;
let _timelapseService = null;
let _ecomLicense = null;

// SpoolmanDB community database cache
const _spoolmanDbCache = { manufacturers: null, all: null };

function _loadSpoolmanDb() {
  if (_spoolmanDbCache.all) return _spoolmanDbCache;
  try {
    const raw = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'spoolmandb.json'), 'utf8');
    _spoolmanDbCache.all = JSON.parse(raw);
    const mfgSet = new Set();
    for (const f of _spoolmanDbCache.all) mfgSet.add(f.manufacturer);
    _spoolmanDbCache.manufacturers = [...mfgSet].sort().map(name => ({ id: name, name }));
  } catch {
    _spoolmanDbCache.all = [];
    _spoolmanDbCache.manufacturers = [];
  }
  return _spoolmanDbCache;
}

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

export function setQueueManager(qm) {
  _queueManager = qm;
}

export function setTimelapseService(tl) {
  _timelapseService = tl;
}

export function setEcomLicense(mgr) {
  _ecomLicense = mgr;
}

function _broadcastInventory(action, entity, data) {
  if (_broadcastFn) _broadcastFn('inventory_update', { action, entity, ...data, ts: Date.now() });
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
      const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
      if (!checkLoginRate(clientIp)) {
        return sendJson(res, { error: 'Too many login attempts. Try again later.' }, 429);
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
      const printers = getPrinters().map(p => ({
        ...p,
        accessCode: p.accessCode ? '***' : ''
      }));
      return sendJson(res, printers);
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
        // Preserve existing access code if masked
        if (body.accessCode === '***') {
          const existing = getPrinters().find(p => p.id === id);
          body.accessCode = existing?.accessCode || '';
        }
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
    if (method === 'POST' && path === '/api/errors/acknowledge-all') {
      return readBody(req, (body) => {
        acknowledgeAllErrors(body?.printer_id || null);
        return sendJson(res, { ok: true });
      });
    }
    const errorMatch = path.match(/^\/api\/errors\/(\d+)$/);
    if (errorMatch && method === 'PATCH') {
      acknowledgeError(parseInt(errorMatch[1]));
      return sendJson(res, { ok: true });
    }
    if (errorMatch && method === 'DELETE') {
      deleteError(parseInt(errorMatch[1]));
      return sendJson(res, { ok: true });
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
      return sendJson(res, _guard.getSettings(printerId) || {
        printer_id: printerId, enabled: 1,
        spaghetti_action: 'pause', first_layer_action: 'notify', foreign_object_action: 'pause', nozzle_clump_action: 'pause',
        temp_deviation_action: 'notify', filament_runout_action: 'notify', print_error_action: 'notify',
        fan_failure_action: 'notify', print_stall_action: 'notify',
        cooldown_seconds: 60, auto_resume: 0,
        temp_deviation_threshold: 15, filament_low_pct: 5, stall_minutes: 10
      });
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
        // Handle users array — preserve masked passwords, hash new ones
        if (Array.isArray(body.users)) {
          const existingUsers = config.auth?.users || [];
          body.users = body.users
            .filter(u => u.username && u.username.trim())
            .map(u => {
              if (u.password === '***') {
                const existing = existingUsers.find(e => e.username === u.username);
                return { username: u.username.trim(), password: existing?.password || '' };
              }
              // Hash new plaintext passwords
              const pw = u.password || '';
              return { username: u.username.trim(), password: pw ? hashPassword(pw) : '' };
            })
            .filter(u => u.password); // Remove users with no password
        }

        // Legacy single-user: preserve existing password if masked, hash new ones
        if (body.password === '***') {
          body.password = config.auth?.password || '';
        } else if (body.password && !body.password.startsWith('scrypt:')) {
          body.password = hashPassword(body.password);
        }

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

    // ---- Printables ----
    const printablesMatch = path.match(/^\/api\/printables\/(\d+)$/);
    if (printablesMatch && method === 'GET') {
      return handlePrintablesFetch(printablesMatch[1], res);
    }

    // ---- Thingiverse ----
    const thingiverseMatch = path.match(/^\/api\/thingiverse\/(\d+)$/);
    if (thingiverseMatch && method === 'GET') {
      return handleThingiverseFetch(thingiverseMatch[1], res);
    }

    // ---- Model Search ----
    if (method === 'GET' && path === '/api/model-search') {
      const q = url.searchParams.get('q');
      const source = url.searchParams.get('source') || 'all';
      if (!q || q.length < 2) return sendJson(res, { error: 'Query too short' }, 400);
      return handleModelSearch(q, source, res);
    }

    // ---- Model Link CRUD ----
    const mlMatch = path.match(/^\/api\/model-link\/([a-zA-Z0-9_-]+)$/);
    if (mlMatch) {
      const printerId = mlMatch[1];
      const filename = url.searchParams.get('filename');

      if (method === 'GET') {
        if (!filename) return sendJson(res, { error: 'filename required' }, 400);
        const link = getModelLink(printerId, filename);
        if (link && link.print_settings && typeof link.print_settings === 'string') {
          try { link.print_settings = JSON.parse(link.print_settings); } catch (_) {}
        }
        return sendJson(res, link || null);
      }

      if (method === 'PUT') {
        return readBody(req, (body) => {
          if (!body.filename || !body.source || !body.source_id) {
            return sendJson(res, { error: 'filename, source, source_id required' }, 400);
          }
          setModelLink({ printer_id: printerId, ...body });
          return sendJson(res, { ok: true });
        });
      }

      if (method === 'DELETE') {
        if (!filename) return sendJson(res, { error: 'filename required' }, 400);
        deleteModelLink(printerId, filename);
        return sendJson(res, { ok: true });
      }
    }

    // ---- Recent Model Links ----
    if (method === 'GET' && path === '/api/model-links/recent') {
      return sendJson(res, getRecentModelLinks(20));
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

    // ---- HMS Codes ----
    if (method === 'GET' && path === '/api/hms-codes') {
      try {
        const { readFileSync } = await import('node:fs');
        const { fileURLToPath } = await import('node:url');
        const { dirname, join } = await import('node:path');
        const __dir = dirname(fileURLToPath(import.meta.url));
        const codes = JSON.parse(readFileSync(join(__dir, 'hms-codes.json'), 'utf8'));
        return sendJson(res, codes);
      } catch { return sendJson(res, {}); }
    }

    const hmsMatch = path.match(/^\/api\/hms-codes\/([a-zA-Z0-9_-]+)$/);
    if (hmsMatch && method === 'GET') {
      const code = hmsMatch[1];
      const description = lookupHmsCode(code);
      const wikiUrl = getHmsWikiUrl(code);
      return sendJson(res, { code, description: description || null, wiki_url: wikiUrl });
    }

    // ---- Inventory: Vendors ----
    if (method === 'GET' && path === '/api/inventory/vendors') {
      const filters = {};
      if (url.searchParams.get('limit')) filters.limit = parseInt(url.searchParams.get('limit'));
      if (url.searchParams.get('offset')) filters.offset = parseInt(url.searchParams.get('offset'));
      if (filters.limit) {
        const result = getVendors(filters);
        res.writeHead(200, { 'Content-Type': 'application/json', 'X-Total-Count': String(result.total) });
        return res.end(JSON.stringify(result.rows));
      }
      return sendJson(res, getVendors());
    }
    if (method === 'POST' && path === '/api/inventory/vendors') {
      return readBody(req, (body) => {
        if (!body.name) return sendJson(res, { error: 'name required' }, 400);
        try {
          const vendor = addVendor(body);
          _broadcastInventory('created', 'vendor', { id: vendor.id });
          sendJson(res, vendor, 201);
        } catch (e) { sendJson(res, { error: e.message }, 409); }
      });
    }
    const vendorMatch = path.match(/^\/api\/inventory\/vendors\/(\d+)$/);
    if (vendorMatch && method === 'PUT') {
      return readBody(req, (body) => {
        if (!body.name) return sendJson(res, { error: 'name required' }, 400);
        updateVendor(parseInt(vendorMatch[1]), body);
        _broadcastInventory('updated', 'vendor', { id: parseInt(vendorMatch[1]) });
        sendJson(res, { ok: true });
      });
    }
    if (vendorMatch && method === 'DELETE') {
      deleteVendor(parseInt(vendorMatch[1]));
      _broadcastInventory('deleted', 'vendor', { id: parseInt(vendorMatch[1]) });
      return sendJson(res, { ok: true });
    }

    // ---- Inventory: Filament Profiles ----
    if (method === 'GET' && path === '/api/inventory/filaments') {
      const filters = {};
      if (url.searchParams.get('vendor_id')) filters.vendor_id = parseInt(url.searchParams.get('vendor_id'));
      if (url.searchParams.get('material')) filters.material = url.searchParams.get('material');
      if (url.searchParams.get('limit')) filters.limit = parseInt(url.searchParams.get('limit'));
      if (url.searchParams.get('offset')) filters.offset = parseInt(url.searchParams.get('offset'));
      if (filters.limit) {
        const result = getFilamentProfiles(filters);
        res.writeHead(200, { 'Content-Type': 'application/json', 'X-Total-Count': String(result.total) });
        return res.end(JSON.stringify(result.rows));
      }
      return sendJson(res, getFilamentProfiles(filters));
    }
    const fpMatch = path.match(/^\/api\/inventory\/filaments\/(\d+)$/);
    if (fpMatch && method === 'GET') {
      const profile = getFilamentProfile(parseInt(fpMatch[1]));
      if (!profile) return sendJson(res, { error: 'Not found' }, 404);
      return sendJson(res, profile);
    }
    if (method === 'POST' && path === '/api/inventory/filaments') {
      return readBody(req, (body) => {
        if (!body.name || !body.material) return sendJson(res, { error: 'name and material required' }, 400);
        const result = addFilamentProfile(body);
        _broadcastInventory('created', 'profile', { id: result.id });
        sendJson(res, result, 201);
      });
    }
    if (fpMatch && method === 'PUT') {
      return readBody(req, (body) => {
        if (!body.name || !body.material) return sendJson(res, { error: 'name and material required' }, 400);
        updateFilamentProfile(parseInt(fpMatch[1]), body);
        _broadcastInventory('updated', 'profile', { id: parseInt(fpMatch[1]) });
        sendJson(res, { ok: true });
      });
    }
    if (fpMatch && method === 'DELETE') {
      deleteFilamentProfile(parseInt(fpMatch[1]));
      _broadcastInventory('deleted', 'profile', { id: parseInt(fpMatch[1]) });
      return sendJson(res, { ok: true });
    }

    // ---- Inventory: Spools ----
    if (method === 'GET' && path === '/api/inventory/spools') {
      const filters = {};
      if (url.searchParams.has('archived')) { const av = url.searchParams.get('archived'); filters.archived = av === '1' || av === 'true'; }
      if (url.searchParams.get('material')) filters.material = url.searchParams.get('material');
      if (url.searchParams.get('vendor_id')) filters.vendor_id = parseInt(url.searchParams.get('vendor_id'));
      if (url.searchParams.get('location')) filters.location = url.searchParams.get('location');
      if (url.searchParams.get('printer_id')) filters.printer_id = url.searchParams.get('printer_id');
      if (url.searchParams.get('limit')) filters.limit = parseInt(url.searchParams.get('limit'));
      if (url.searchParams.get('offset')) filters.offset = parseInt(url.searchParams.get('offset'));
      const result = getSpools(filters);
      res.writeHead(200, { 'Content-Type': 'application/json', 'X-Total-Count': String(result.total) });
      return res.end(JSON.stringify(result.rows));
    }
    const spoolMatch = path.match(/^\/api\/inventory\/spools\/(\d+)$/);
    if (spoolMatch && method === 'GET') {
      const spool = getSpool(parseInt(spoolMatch[1]));
      if (!spool) return sendJson(res, { error: 'Not found' }, 404);
      return sendJson(res, spool);
    }
    if (method === 'POST' && path === '/api/inventory/spools') {
      return readBody(req, (body) => {
        const result = addSpool(body);
        _broadcastInventory('created', 'spool', { id: result.id });
        sendJson(res, result, 201);
      });
    }
    if (spoolMatch && method === 'PUT') {
      return readBody(req, (body) => {
        updateSpool(parseInt(spoolMatch[1]), body);
        _broadcastInventory('updated', 'spool', { id: parseInt(spoolMatch[1]) });
        sendJson(res, { ok: true });
      });
    }
    if (spoolMatch && method === 'DELETE') {
      deleteSpool(parseInt(spoolMatch[1]));
      _broadcastInventory('deleted', 'spool', { id: parseInt(spoolMatch[1]) });
      return sendJson(res, { ok: true });
    }

    // Spool actions
    const spoolUseMatch = path.match(/^\/api\/inventory\/spools\/(\d+)\/use$/);
    if (spoolUseMatch && method === 'POST') {
      return readBody(req, (body) => {
        let weightG = body.weight_g;
        if (!weightG && body.use_length) {
          const spool = getSpool(parseInt(spoolUseMatch[1]));
          if (!spool) return sendJson(res, { error: 'Not found' }, 404);
          weightG = lengthToWeight(body.use_length, spool.density, spool.diameter);
          if (!weightG) return sendJson(res, { error: 'Cannot convert length: missing density/diameter on profile' }, 400);
        }
        if (!weightG) return sendJson(res, { error: 'weight_g or use_length required' }, 400);
        useSpoolWeight(parseInt(spoolUseMatch[1]), weightG, body.source || 'manual', null, body.printer_id || null);
        _broadcastInventory('used', 'spool', { id: parseInt(spoolUseMatch[1]) });
        sendJson(res, { ok: true });
      });
    }
    const spoolArchiveMatch = path.match(/^\/api\/inventory\/spools\/(\d+)\/archive$/);
    if (spoolArchiveMatch && method === 'PUT') {
      return readBody(req, (body) => {
        archiveSpool(parseInt(spoolArchiveMatch[1]), body.archived !== false);
        _broadcastInventory('archived', 'spool', { id: parseInt(spoolArchiveMatch[1]) });
        sendJson(res, { ok: true });
      });
    }
    const spoolAssignMatch = path.match(/^\/api\/inventory\/spools\/(\d+)\/assign$/);
    if (spoolAssignMatch && method === 'PUT') {
      return readBody(req, (body) => {
        assignSpoolToSlot(parseInt(spoolAssignMatch[1]), body.printer_id || null, body.ams_unit ?? null, body.ams_tray ?? null);
        _broadcastInventory('assigned', 'spool', { id: parseInt(spoolAssignMatch[1]) });
        sendJson(res, { ok: true });
      });
    }

    // ---- Inventory: Usage Log ----
    if (method === 'GET' && path === '/api/inventory/usage') {
      const filters = {};
      if (url.searchParams.get('spool_id')) filters.spool_id = parseInt(url.searchParams.get('spool_id'));
      if (url.searchParams.get('printer_id')) filters.printer_id = url.searchParams.get('printer_id');
      filters.limit = parseInt(url.searchParams.get('limit') || '100');
      return sendJson(res, getSpoolUsageLog(filters));
    }

    // ---- Inventory: Locations ----
    if (method === 'GET' && path === '/api/inventory/locations') {
      return sendJson(res, getLocations());
    }
    if (method === 'POST' && path === '/api/inventory/locations') {
      return readBody(req, (body) => {
        if (!body.name) return sendJson(res, { error: 'name required' }, 400);
        try {
          const loc = addLocation(body);
          sendJson(res, loc, 201);
        } catch (e) { sendJson(res, { error: e.message }, 409); }
      });
    }
    const locMatch = path.match(/^\/api\/inventory\/locations\/(\d+)$/);
    if (locMatch && (method === 'PATCH' || method === 'PUT')) {
      return readBody(req, (body) => {
        if (!body.name) return sendJson(res, { error: 'name required' }, 400);
        const result = updateLocation(parseInt(locMatch[1]), body);
        if (!result) return sendJson(res, { error: 'Not found' }, 404);
        sendJson(res, { ok: true, ...result });
      });
    }
    if (locMatch && method === 'DELETE') {
      deleteLocation(parseInt(locMatch[1]));
      return sendJson(res, { ok: true });
    }

    // ---- Inventory: Stats ----
    if (method === 'GET' && path === '/api/inventory/stats') {
      return sendJson(res, getInventoryStats());
    }

    // ---- Inventory: Search ----
    if (method === 'GET' && path === '/api/inventory/search') {
      const q = url.searchParams.get('q');
      if (!q || q.length < 2) return sendJson(res, { error: 'Query too short' }, 400);
      const limit = parseInt(url.searchParams.get('limit')) || 50;
      const offset = parseInt(url.searchParams.get('offset')) || 0;
      const result = searchSpools(q, limit, offset);
      res.writeHead(200, { 'Content-Type': 'application/json', 'X-Total-Count': String(result.total) });
      return res.end(JSON.stringify(result.rows));
    }

    // ---- Inventory: Duplicate Spool ----
    const spoolDuplicateMatch = path.match(/^\/api\/inventory\/spools\/(\d+)\/duplicate$/);
    if (spoolDuplicateMatch && method === 'POST') {
      const result = duplicateSpool(parseInt(spoolDuplicateMatch[1]));
      if (!result) return sendJson(res, { error: 'Not found' }, 404);
      return sendJson(res, result, 201);
    }

    // ---- Inventory: Measure Weight ----
    const spoolMeasureMatch = path.match(/^\/api\/inventory\/spools\/(\d+)\/measure$/);
    if (spoolMeasureMatch && method === 'POST') {
      return readBody(req, (body) => {
        if (!body.gross_weight_g || body.gross_weight_g <= 0) return sendJson(res, { error: 'gross_weight_g required' }, 400);
        const result = measureSpoolWeight(parseInt(spoolMeasureMatch[1]), body.gross_weight_g);
        if (!result) return sendJson(res, { error: 'Not found' }, 404);
        sendJson(res, result);
      });
    }

    // ---- Inventory: Export ----
    if (method === 'GET' && path === '/api/inventory/export/spools') {
      const format = url.searchParams.get('format') || 'csv';
      const rows = getAllSpoolsForExport();
      if (format === 'json') {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="spools.json"' });
        return res.end(JSON.stringify(rows, null, 2));
      }
      const header = 'ID;Profile;Material;Vendor;Color;Remaining (g);Used (g);Initial (g);Cost;Location;Lot Number;Printer;Remaining (m);Created\n';
      const csv = '\uFEFF' + header + rows.map(r =>
        `${r.id};${(r.profile_name || '').replace(/;/g, ',')};${r.material || ''};${(r.vendor_name || '').replace(/;/g, ',')};${r.color_name || ''};${r.remaining_weight_g || 0};${r.used_weight_g || 0};${r.initial_weight_g || 0};${r.cost || ''};${(r.location || '').replace(/;/g, ',')};${r.lot_number || ''};${r.printer_id || ''};${r.remaining_length_m || ''};${r.created_at || ''}`
      ).join('\n');
      res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="spools.csv"' });
      return res.end(csv);
    }
    if (method === 'GET' && path === '/api/inventory/export/filaments') {
      const format = url.searchParams.get('format') || 'csv';
      const rows = getAllFilamentProfilesForExport();
      if (format === 'json') {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="filaments.json"' });
        return res.end(JSON.stringify(rows, null, 2));
      }
      const header = 'ID;Name;Material;Vendor;Color;Color Hex;Density;Diameter;Spool Weight;Article Number;Price\n';
      const csv = '\uFEFF' + header + rows.map(r =>
        `${r.id};${(r.name || '').replace(/;/g, ',')};${r.material || ''};${(r.vendor_name || '').replace(/;/g, ',')};${r.color_name || ''};${r.color_hex || ''};${r.density};${r.diameter};${r.spool_weight_g};${r.article_number || ''};${r.price || ''}`
      ).join('\n');
      res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="filaments.csv"' });
      return res.end(csv);
    }
    if (method === 'GET' && path === '/api/inventory/export/vendors') {
      const format = url.searchParams.get('format') || 'csv';
      const rows = getAllVendorsForExport();
      if (format === 'json') {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="vendors.json"' });
        return res.end(JSON.stringify(rows, null, 2));
      }
      const header = 'ID;Name;Website;Empty Spool Weight\n';
      const csv = '\uFEFF' + header + rows.map(r =>
        `${r.id};${(r.name || '').replace(/;/g, ',')};${r.website || ''};${r.empty_spool_weight_g || ''}`
      ).join('\n');
      res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="vendors.csv"' });
      return res.end(csv);
    }

    // ---- Inventory: Color Similarity ----
    if (method === 'GET' && path === '/api/inventory/colors/similar') {
      const hex = (url.searchParams.get('hex') || '').replace('#', '');
      if (!hex || hex.length < 6) return sendJson(res, { error: 'hex required (6 chars)' }, 400);
      const maxDe = parseFloat(url.searchParams.get('max_delta_e')) || 30;
      return sendJson(res, findSimilarColors(hex, maxDe));
    }

    // ---- Inventory: QR Data ----
    const spoolQrMatch = path.match(/^\/api\/inventory\/spools\/(\d+)\/qr$/);
    if (spoolQrMatch && method === 'GET') {
      const spool = getSpool(parseInt(spoolQrMatch[1]));
      if (!spool) return sendJson(res, { error: 'Not found' }, 404);
      const host = req.headers.host || 'localhost:3000';
      const proto = req.socket.encrypted ? 'https' : 'http';
      return sendJson(res, {
        qr_data: `${proto}://${host}/#filament/spool/${spool.id}`,
        spool_id: spool.id,
        label: {
          name: spool.profile_name || spool.material || '--',
          vendor: spool.vendor_name || '',
          material: spool.material || '',
          color: spool.color_name || '',
          color_hex: spool.color_hex || '',
          weight: spool.initial_weight_g,
          lot_number: spool.lot_number || '',
          article_number: spool.article_number || ''
        }
      });
    }

    // ---- Inventory: Distinct value lists ----
    if (method === 'GET' && path === '/api/inventory/materials') {
      return sendJson(res, getDistinctMaterials());
    }
    if (method === 'GET' && path === '/api/inventory/lot-numbers') {
      return sendJson(res, getDistinctLotNumbers());
    }
    if (method === 'GET' && path === '/api/inventory/article-numbers') {
      return sendJson(res, getDistinctArticleNumbers());
    }

    // ---- Inventory: Settings ----
    if (method === 'GET' && path === '/api/inventory/settings') {
      return sendJson(res, getAllInventorySettings());
    }
    const settingMatch = path.match(/^\/api\/inventory\/settings\/([a-zA-Z0-9_.-]+)$/);
    if (settingMatch) {
      const key = settingMatch[1];
      if (method === 'GET') return sendJson(res, { key, value: getInventorySetting(key) });
      if (method === 'POST') return readBody(req, (body) => { setInventorySetting(key, body.value); sendJson(res, { ok: true }); });
    }

    // ---- Inventory: Import ----
    if (method === 'POST' && path === '/api/inventory/import/spools') {
      return readBody(req, (body) => {
        if (!Array.isArray(body)) return sendJson(res, { error: 'Expected array' }, 400);
        const count = importSpools(body);
        _broadcastInventory('import', 'spool', { count });
        sendJson(res, { imported: count }, 201);
      });
    }
    if (method === 'POST' && path === '/api/inventory/import/filaments') {
      return readBody(req, (body) => {
        if (!Array.isArray(body)) return sendJson(res, { error: 'Expected array' }, 400);
        const count = importFilamentProfiles(body);
        _broadcastInventory('import', 'profile', { count });
        sendJson(res, { imported: count }, 201);
      });
    }
    if (method === 'POST' && path === '/api/inventory/import/vendors') {
      return readBody(req, (body) => {
        if (!Array.isArray(body)) return sendJson(res, { error: 'Expected array' }, 400);
        const count = importVendors(body);
        _broadcastInventory('import', 'vendor', { count });
        sendJson(res, { imported: count }, 201);
      });
    }

    // ---- Inventory: Custom Field Schemas ----
    const fieldMatch = path.match(/^\/api\/inventory\/fields\/(vendor|filament|spool)(?:\/([a-zA-Z0-9_.-]+))?$/);
    if (fieldMatch) {
      const entityType = fieldMatch[1];
      const fieldKey = fieldMatch[2];
      if (method === 'GET' && !fieldKey) return sendJson(res, getFieldSchemas(entityType));
      if (method === 'POST' && fieldKey) {
        return readBody(req, (body) => {
          try {
            const schema = addFieldSchema(entityType, fieldKey, body);
            sendJson(res, schema, 201);
          } catch (e) { sendJson(res, { error: e.message }, 409); }
        });
      }
      if (method === 'DELETE' && fieldKey) {
        deleteFieldSchema(entityType, fieldKey);
        return sendJson(res, { ok: true });
      }
    }

    // ---- Info & Health ----
    if (method === 'GET' && path === '/api/info') {
      return sendJson(res, { name: 'Bambu Dashboard', version: _updater?.currentVersion || 'unknown', uptime: process.uptime() });
    }
    if (method === 'GET' && path === '/api/health') {
      return sendJson(res, { status: 'ok', timestamp: new Date().toISOString() });
    }

    // ---- Inventory: SpoolmanDB Community Database ----
    if (method === 'GET' && path === '/api/inventory/spoolmandb/manufacturers') {
      const data = _loadSpoolmanDb();
      return sendJson(res, data.manufacturers || []);
    }
    if (method === 'GET' && path === '/api/inventory/spoolmandb/filaments') {
      const data = _loadSpoolmanDb();
      const mfg = url.searchParams.get('manufacturer');
      let filaments = data.all || [];
      if (mfg) filaments = filaments.filter(f => f.manufacturer === mfg);
      const mat = url.searchParams.get('material');
      if (mat) filaments = filaments.filter(f => f.material === mat);
      return sendJson(res, filaments);
    }
    if (method === 'GET' && path === '/api/inventory/spoolmandb/materials') {
      const data = _loadSpoolmanDb();
      const matSet = new Set();
      for (const f of (data.all || [])) if (f.material) matSet.add(f.material);
      return sendJson(res, [...matSet].sort());
    }
    if (method === 'POST' && path === '/api/inventory/spoolmandb/import') {
      return readBody(req, (body) => {
        // body is a flat filament object from _fetchSpoolmanDbManufacturer
        let vendorId = null;
        const mfgName = body.manufacturer;
        if (mfgName) {
          const existing = getVendors().find(v => v.name.toLowerCase() === mfgName.toLowerCase());
          if (existing) { vendorId = existing.id; }
          else {
            try {
              const v = addVendor({ name: mfgName });
              vendorId = v.id;
            } catch { vendorId = getVendors().find(v => v.name.toLowerCase() === mfgName.toLowerCase())?.id || null; }
          }
        }
        const profile = addFilamentProfile({
          vendor_id: vendorId,
          name: body.name || `${mfgName || ''} ${body.material || 'PLA'}`.trim(),
          material: body.material || 'PLA',
          color_name: body.color_name || null,
          color_hex: body.color_hex || null,
          density: body.density || 1.24,
          diameter: body.diameter || 1.75,
          spool_weight_g: body.weight || 1000,
          nozzle_temp_min: body.extruder_temp ? body.extruder_temp - 10 : null,
          nozzle_temp_max: body.extruder_temp || null,
          bed_temp_min: body.bed_temp ? body.bed_temp - 10 : null,
          bed_temp_max: body.bed_temp || null,
          external_id: body.id || null,
          weights: body.spool_weight ? [{ weight: body.weight || 1000, spool_weight: body.spool_weight, spool_type: 'plastic' }] : null,
          price: body.price || null
        });
        _broadcastInventory('add', 'profile', { id: profile.id });
        sendJson(res, { ok: true, profile_id: profile.id, vendor_id: vendorId }, 201);
      });
    }

    // ---- Inventory: Drying Management ----
    if (method === 'GET' && path === '/api/inventory/drying/sessions') {
      const filters = {};
      if (url.searchParams.get('spool_id')) filters.spool_id = parseInt(url.searchParams.get('spool_id'));
      if (url.searchParams.has('active')) filters.active = url.searchParams.get('active') === '1';
      if (url.searchParams.get('limit')) filters.limit = parseInt(url.searchParams.get('limit'));
      return sendJson(res, getDryingSessions(filters));
    }
    if (method === 'GET' && path === '/api/inventory/drying/sessions/active') {
      return sendJson(res, getActiveDryingSessions());
    }
    if (method === 'POST' && path === '/api/inventory/drying/sessions') {
      return readBody(req, (body) => {
        if (!body.spool_id || !body.duration_minutes) return sendJson(res, { error: 'spool_id and duration_minutes required' }, 400);
        const result = startDryingSession(body);
        _broadcastInventory('drying_started', 'drying_session', { id: result.id, spool_id: body.spool_id });
        sendJson(res, result, 201);
      });
    }
    const dryingCompleteMatch = path.match(/^\/api\/inventory\/drying\/sessions\/(\d+)\/complete$/);
    if (dryingCompleteMatch && method === 'PUT') {
      return readBody(req, (body) => {
        completeDryingSession(parseInt(dryingCompleteMatch[1]), body.humidity_after || null);
        _broadcastInventory('drying_completed', 'drying_session', { id: parseInt(dryingCompleteMatch[1]) });
        sendJson(res, { ok: true });
      });
    }
    const dryingDeleteMatch = path.match(/^\/api\/inventory\/drying\/sessions\/(\d+)$/);
    if (dryingDeleteMatch && method === 'DELETE') {
      deleteDryingSession(parseInt(dryingDeleteMatch[1]));
      return sendJson(res, { ok: true });
    }

    if (method === 'GET' && path === '/api/inventory/drying/presets') {
      return sendJson(res, getDryingPresets());
    }
    const dryingPresetMatch = path.match(/^\/api\/inventory\/drying\/presets\/(.+)$/);
    if (dryingPresetMatch && method === 'GET') {
      const preset = getDryingPreset(decodeURIComponent(dryingPresetMatch[1]));
      if (!preset) return sendJson(res, { error: 'Not found' }, 404);
      return sendJson(res, preset);
    }
    if (dryingPresetMatch && method === 'PUT') {
      return readBody(req, (body) => {
        if (!body.temperature || !body.duration_minutes) return sendJson(res, { error: 'temperature and duration_minutes required' }, 400);
        upsertDryingPreset(decodeURIComponent(dryingPresetMatch[1]), body);
        _broadcastInventory('updated', 'drying_preset', { material: decodeURIComponent(dryingPresetMatch[1]) });
        sendJson(res, { ok: true });
      });
    }
    if (dryingPresetMatch && method === 'DELETE') {
      deleteDryingPreset(decodeURIComponent(dryingPresetMatch[1]));
      return sendJson(res, { ok: true });
    }

    if (method === 'GET' && path === '/api/inventory/drying/status') {
      return sendJson(res, getSpoolsDryingStatus());
    }

    // ---- Inventory: Predictions ----
    if (method === 'GET' && path === '/api/inventory/predictions') {
      return sendJson(res, getUsagePredictions());
    }

    // ---- Inventory: Cost Estimate ----
    if (method === 'GET' && path === '/api/inventory/cost-estimate') {
      const filamentG = parseFloat(url.searchParams.get('filament_g') || '0');
      const durationS = parseInt(url.searchParams.get('duration_s') || '0');
      const spoolId = url.searchParams.get('spool_id') ? parseInt(url.searchParams.get('spool_id')) : null;
      return sendJson(res, estimatePrintCost(filamentG, durationS, spoolId));
    }

    // ---- Prometheus Metrics ----
    if (method === 'GET' && (path === '/api/metrics' || path === '/metrics')) {
      const stats = getInventoryStats();
      const printers = getPrinters();
      let m = '';
      m += '# HELP bambu_spools_total Total number of active spools\n# TYPE bambu_spools_total gauge\n';
      m += `bambu_spools_total ${stats.total_spools}\n`;
      m += '# HELP bambu_filament_remaining_grams Total remaining filament in grams\n# TYPE bambu_filament_remaining_grams gauge\n';
      m += `bambu_filament_remaining_grams ${stats.total_remaining_g}\n`;
      m += '# HELP bambu_filament_used_grams Total used filament in grams\n# TYPE bambu_filament_used_grams gauge\n';
      m += `bambu_filament_used_grams ${stats.total_used_g}\n`;
      m += '# HELP bambu_low_stock_count Spools below 20%\n# TYPE bambu_low_stock_count gauge\n';
      m += `bambu_low_stock_count ${stats.low_stock_count}\n`;
      m += '# HELP bambu_inventory_cost_total Total inventory cost\n# TYPE bambu_inventory_cost_total gauge\n';
      m += `bambu_inventory_cost_total ${stats.total_cost}\n`;
      m += '# HELP bambu_usage_30d_grams Filament used in last 30 days\n# TYPE bambu_usage_30d_grams gauge\n';
      m += `bambu_usage_30d_grams ${stats.usage_last_30d_g}\n`;
      m += '# HELP bambu_filament_by_material_grams Remaining filament by material\n# TYPE bambu_filament_by_material_grams gauge\n';
      for (const mt of stats.by_material) m += `bambu_filament_by_material_grams{material="${(mt.material || 'unknown').replace(/"/g, '')}"} ${mt.remaining_g}\n`;
      m += '# HELP bambu_printers_total Total configured printers\n# TYPE bambu_printers_total gauge\n';
      m += `bambu_printers_total ${printers.length}\n`;
      res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' });
      return res.end(m);
    }

    // ---- Database Backup ----
    if (method === 'POST' && path === '/api/backup') {
      try {
        const result = createBackup('manual');
        return sendJson(res, { ok: true, ...result });
      } catch (e) { return sendJson(res, { error: e.message }, 500); }
    }
    if (method === 'GET' && path === '/api/backup/list') {
      return sendJson(res, listBackups());
    }

    // ---- Spoolman ----
    if (method === 'GET' && path === '/api/spoolman/spools') {
      if (!config.spoolman?.enabled || !config.spoolman?.url) {
        return sendJson(res, { error: 'Spoolman not configured' }, 400);
      }
      try {
        const resp = await fetch(`${config.spoolman.url}/api/v1/spool`, { signal: AbortSignal.timeout(5000) });
        const data = await resp.json();
        return sendJson(res, data);
      } catch (e) { return sendJson(res, { error: e.message }, 502); }
    }

    if (method === 'POST' && path === '/api/spoolman/use') {
      if (!config.spoolman?.enabled || !config.spoolman?.url) {
        return sendJson(res, { error: 'Spoolman not configured' }, 400);
      }
      return readBody(req, async (body) => {
        if (!body.id || !body.weight) return sendJson(res, { error: 'id and weight required' }, 400);
        try {
          const resp = await fetch(`${config.spoolman.url}/api/v1/spool/${body.id}/use`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ use_weight: body.weight }),
            signal: AbortSignal.timeout(5000)
          });
          const data = await resp.json();
          return sendJson(res, data);
        } catch (e) { return sendJson(res, { error: e.message }, 502); }
      });
    }

    if (method === 'GET' && path === '/api/spoolman/test') {
      const testUrl = url.searchParams.get('url') || config.spoolman?.url;
      if (!testUrl) return sendJson(res, { error: 'URL required' }, 400);
      try {
        const resp = await fetch(`${testUrl}/api/v1/info`, { signal: AbortSignal.timeout(5000) });
        const data = await resp.json();
        return sendJson(res, { ok: true, version: data.version || null });
      } catch (e) { return sendJson(res, { ok: false, error: e.message }); }
    }

    if (method === 'PUT' && path === '/api/spoolman/config') {
      return readBody(req, (body) => {
        config.spoolman = { enabled: !!body.enabled, url: (body.url || '').replace(/\/+$/, '') };
        saveConfig({ spoolman: config.spoolman });
        return sendJson(res, { ok: true });
      });
    }

    // ---- Print Queue ----

    if (method === 'GET' && path === '/api/queue') {
      const status = url.searchParams.get('status') || null;
      return sendJson(res, getQueues(status));
    }

    if (method === 'POST' && path === '/api/queue') {
      return readBody(req, (body) => {
        if (!body.name) return sendJson(res, { error: 'Name required' }, 400);
        const id = createQueue(body);
        addQueueLog(id, null, null, 'queue_created', body.name);
        if (_broadcastFn) _broadcastFn('queue_update', { action: 'queue_changed' });
        return sendJson(res, { ok: true, id }, 201);
      });
    }

    const queueMatch = path.match(/^\/api\/queue\/(\d+)$/);
    if (queueMatch) {
      const queueId = parseInt(queueMatch[1]);
      if (method === 'GET') {
        const queue = getQueue(queueId);
        if (!queue) return sendJson(res, { error: 'Not found' }, 404);
        return sendJson(res, queue);
      }
      if (method === 'PUT') {
        return readBody(req, (body) => {
          updateQueue(queueId, body);
          if (_broadcastFn) _broadcastFn('queue_update', { action: 'queue_changed', queueId });
          return sendJson(res, { ok: true });
        });
      }
      if (method === 'DELETE') {
        deleteQueue(queueId);
        if (_broadcastFn) _broadcastFn('queue_update', { action: 'queue_changed', queueId });
        return sendJson(res, { ok: true });
      }
    }

    const queuePauseMatch = path.match(/^\/api\/queue\/(\d+)\/pause$/);
    if (queuePauseMatch && method === 'POST') {
      const queueId = parseInt(queuePauseMatch[1]);
      updateQueue(queueId, { status: 'paused' });
      addQueueLog(queueId, null, null, 'queue_paused', null);
      if (_broadcastFn) _broadcastFn('queue_update', { action: 'queue_changed', queueId });
      return sendJson(res, { ok: true });
    }

    const queueResumeMatch = path.match(/^\/api\/queue\/(\d+)\/resume$/);
    if (queueResumeMatch && method === 'POST') {
      const queueId = parseInt(queueResumeMatch[1]);
      updateQueue(queueId, { status: 'active' });
      addQueueLog(queueId, null, null, 'queue_resumed', null);
      if (_broadcastFn) _broadcastFn('queue_update', { action: 'queue_changed', queueId });
      return sendJson(res, { ok: true });
    }

    const queueItemsMatch = path.match(/^\/api\/queue\/(\d+)\/items$/);
    if (queueItemsMatch) {
      const queueId = parseInt(queueItemsMatch[1]);
      if (method === 'GET') {
        const queue = getQueue(queueId);
        if (!queue) return sendJson(res, { error: 'Not found' }, 404);
        return sendJson(res, queue.items || []);
      }
      if (method === 'POST') {
        return readBody(req, (body) => {
          if (!body.filename) return sendJson(res, { error: 'Filename required' }, 400);
          const id = addQueueItem(queueId, body);
          addQueueLog(queueId, id, null, 'item_added', body.filename);
          if (_broadcastFn) _broadcastFn('queue_update', { action: 'queue_changed', queueId });
          return sendJson(res, { ok: true, id }, 201);
        });
      }
    }

    const queueBatchAddMatch = path.match(/^\/api\/queue\/(\d+)\/batch-add$/);
    if (queueBatchAddMatch && method === 'POST') {
      const queueId = parseInt(queueBatchAddMatch[1]);
      return readBody(req, (body) => {
        const items = body.items || [];
        const ids = [];
        for (const item of items) {
          if (!item.filename) continue;
          const id = addQueueItem(queueId, item);
          addQueueLog(queueId, id, null, 'item_added', item.filename);
          ids.push(id);
        }
        if (_broadcastFn) _broadcastFn('queue_update', { action: 'queue_changed', queueId });
        return sendJson(res, { ok: true, ids }, 201);
      });
    }

    const queueReorderMatch = path.match(/^\/api\/queue\/(\d+)\/reorder$/);
    if (queueReorderMatch && method === 'POST') {
      const queueId = parseInt(queueReorderMatch[1]);
      return readBody(req, (body) => {
        if (!Array.isArray(body.item_ids)) return sendJson(res, { error: 'item_ids array required' }, 400);
        reorderQueueItems(queueId, body.item_ids);
        if (_broadcastFn) _broadcastFn('queue_update', { action: 'queue_changed', queueId });
        return sendJson(res, { ok: true });
      });
    }

    const queueMultiStartMatch = path.match(/^\/api\/queue\/(\d+)\/multi-start$/);
    if (queueMultiStartMatch && method === 'POST') {
      const queueId = parseInt(queueMultiStartMatch[1]);
      return readBody(req, (body) => {
        const printerIds = body.printer_ids || [];
        const filename = body.filename;
        if (!filename || printerIds.length === 0) return sendJson(res, { error: 'filename and printer_ids required' }, 400);
        const ids = [];
        for (let i = 0; i < printerIds.length; i++) {
          const id = addQueueItem(queueId, { filename, printer_id: printerIds[i], priority: body.priority || 0, sort_order: i + 1 });
          addQueueLog(queueId, id, printerIds[i], 'item_added', `Multi-print: ${filename}`);
          ids.push(id);
        }
        if (_broadcastFn) _broadcastFn('queue_update', { action: 'queue_changed', queueId });
        return sendJson(res, { ok: true, ids }, 201);
      });
    }

    const itemMatch = path.match(/^\/api\/queue\/items\/(\d+)$/);
    if (itemMatch) {
      const itemId = parseInt(itemMatch[1]);
      if (method === 'PUT') {
        return readBody(req, (body) => {
          updateQueueItem(itemId, body);
          const item = getQueueItem(itemId);
          if (_broadcastFn) _broadcastFn('queue_update', { action: 'queue_changed', queueId: item?.queue_id });
          return sendJson(res, { ok: true });
        });
      }
      if (method === 'DELETE') {
        const item = getQueueItem(itemId);
        deleteQueueItem(itemId);
        if (_broadcastFn) _broadcastFn('queue_update', { action: 'queue_changed', queueId: item?.queue_id });
        return sendJson(res, { ok: true });
      }
    }

    const itemSkipMatch = path.match(/^\/api\/queue\/items\/(\d+)\/skip$/);
    if (itemSkipMatch && method === 'POST') {
      const itemId = parseInt(itemSkipMatch[1]);
      const item = getQueueItem(itemId);
      if (item) {
        updateQueueItem(itemId, { status: 'skipped', completed_at: new Date().toISOString() });
        addQueueLog(item.queue_id, itemId, null, 'item_skipped', null);
        if (_broadcastFn) _broadcastFn('queue_update', { action: 'queue_changed', queueId: item.queue_id });
      }
      return sendJson(res, { ok: true });
    }

    if (method === 'GET' && path === '/api/queue/log') {
      const queueId = url.searchParams.get('queue_id') ? parseInt(url.searchParams.get('queue_id')) : null;
      const limit = parseInt(url.searchParams.get('limit') || '50');
      return sendJson(res, getQueueLog(queueId, limit));
    }

    if (method === 'GET' && path === '/api/queue/active') {
      return sendJson(res, getActiveQueueItems());
    }

    if (method === 'POST' && path === '/api/queue/dispatch') {
      if (_queueManager) _queueManager.forceDispatch();
      return sendJson(res, { ok: true });
    }

    // ---- Tags ----

    if (method === 'GET' && path === '/api/tags') {
      const category = url.searchParams.get('category') || null;
      return sendJson(res, getTags(category));
    }

    if (method === 'POST' && path === '/api/tags') {
      return readBody(req, (body) => {
        if (!body.name) return sendJson(res, { error: 'Name required' }, 400);
        try {
          const id = createTag(body.name, body.category, body.color);
          return sendJson(res, { ok: true, id }, 201);
        } catch (e) {
          return sendJson(res, { error: 'Tag already exists' }, 409);
        }
      });
    }

    const tagDeleteMatch = path.match(/^\/api\/tags\/(\d+)$/);
    if (tagDeleteMatch && method === 'DELETE') {
      deleteTag(parseInt(tagDeleteMatch[1]));
      return sendJson(res, { ok: true });
    }

    if (method === 'POST' && path === '/api/tags/assign') {
      return readBody(req, (body) => {
        if (!body.entity_type || !body.entity_id || !body.tag_id) return sendJson(res, { error: 'entity_type, entity_id, tag_id required' }, 400);
        assignTag(body.entity_type, body.entity_id, body.tag_id);
        return sendJson(res, { ok: true });
      });
    }

    if (method === 'DELETE' && path === '/api/tags/unassign') {
      return readBody(req, (body) => {
        if (!body.entity_type || !body.entity_id || !body.tag_id) return sendJson(res, { error: 'entity_type, entity_id, tag_id required' }, 400);
        unassignTag(body.entity_type, body.entity_id, body.tag_id);
        return sendJson(res, { ok: true });
      });
    }

    const entityTagsMatch = path.match(/^\/api\/tags\/entity\/([a-z_]+)\/(\d+)$/);
    if (entityTagsMatch && method === 'GET') {
      return sendJson(res, getEntityTags(entityTagsMatch[1], parseInt(entityTagsMatch[2])));
    }

    // ---- NFC ----
    if (method === 'GET' && path === '/api/nfc/mappings') {
      return sendJson(res, getNfcMappings());
    }

    const nfcLookupMatch = path.match(/^\/api\/nfc\/lookup\/(.+)$/);
    if (nfcLookupMatch && method === 'GET') {
      const tag = lookupNfcTag(decodeURIComponent(nfcLookupMatch[1]));
      if (!tag) return sendJson(res, { error: 'Tag not found' }, 404);
      updateNfcScan(decodeURIComponent(nfcLookupMatch[1]));
      return sendJson(res, tag);
    }

    if (method === 'POST' && path === '/api/nfc/link') {
      return readBody(req, (body) => {
        if (!body.tag_uid || !body.spool_id) return sendJson(res, { error: 'tag_uid and spool_id required' }, 400);
        try {
          const id = linkNfcTag(body.tag_uid, body.spool_id, body.standard, body.data ? JSON.stringify(body.data) : null);
          return sendJson(res, { ok: true, id });
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      });
    }

    const nfcUnlinkMatch = path.match(/^\/api\/nfc\/link\/(.+)$/);
    if (nfcUnlinkMatch && method === 'DELETE') {
      unlinkNfcTag(decodeURIComponent(nfcUnlinkMatch[1]));
      return sendJson(res, { ok: true });
    }

    // ---- Spool Checkout ----
    const checkoutMatch = path.match(/^\/api\/inventory\/spools\/(\d+)\/(checkout|checkin)$/);
    if (checkoutMatch && method === 'POST') {
      return readBody(req, (body) => {
        const spoolId = parseInt(checkoutMatch[1]);
        if (checkoutMatch[2] === 'checkout') {
          checkoutSpool(spoolId, body.actor, body.from_location);
        } else {
          checkinSpool(spoolId, body.actor, body.to_location);
        }
        return sendJson(res, { ok: true });
      });
    }

    if (method === 'GET' && path === '/api/inventory/checked-out') {
      return sendJson(res, getCheckedOutSpools());
    }

    const checkoutLogMatch = path.match(/^\/api\/inventory\/spools\/(\d+)\/checkout-log$/);
    if (checkoutLogMatch && method === 'GET') {
      return sendJson(res, getCheckoutLog(parseInt(checkoutLogMatch[1])));
    }

    // ---- Spool Timeline ----
    const timelineMatch = path.match(/^\/api\/inventory\/spools\/(\d+)\/timeline$/);
    if (timelineMatch && method === 'GET') {
      return sendJson(res, getSpoolTimeline(parseInt(timelineMatch[1])));
    }

    if (method === 'GET' && path === '/api/inventory/events') {
      const url = new URL(req.url, 'http://localhost');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      return sendJson(res, getRecentSpoolEvents(limit));
    }

    // ---- Bulk Operations ----
    if (method === 'POST' && path === '/api/inventory/spools/bulk') {
      return readBody(req, (body) => {
        if (!body.action || !Array.isArray(body.spool_ids) || body.spool_ids.length === 0) {
          return sendJson(res, { error: 'action and spool_ids[] required' }, 400);
        }
        const ids = body.spool_ids.map(Number);
        switch (body.action) {
          case 'delete': bulkDeleteSpools(ids); break;
          case 'archive': bulkArchiveSpools(ids); break;
          case 'relocate':
            if (!body.location) return sendJson(res, { error: 'location required for relocate' }, 400);
            bulkRelocateSpools(ids, body.location);
            break;
          case 'mark_dried': bulkMarkDried(ids); break;
          default: return sendJson(res, { error: 'Unknown action: ' + body.action }, 400);
        }
        return sendJson(res, { ok: true, count: ids.length });
      });
    }

    // ---- Swatch/Color Card Labels ----
    const swatchMatch = path.match(/^\/api\/inventory\/spools\/(\d+)\/label$/);
    if (swatchMatch && method === 'GET') {
      const spool = getSpool(parseInt(swatchMatch[1]));
      if (!spool) return sendJson(res, { error: 'Spool not found' }, 404);
      const url = new URL(req.url, 'http://localhost');
      const format = url.searchParams.get('format') || 'swatch_40x30';
      return sendJson(res, { spool, format });
    }

    if (method === 'POST' && path === '/api/inventory/labels/batch') {
      return readBody(req, (body) => {
        if (!Array.isArray(body.spool_ids)) return sendJson(res, { error: 'spool_ids[] required' }, 400);
        const spools = body.spool_ids.map(id => getSpool(Number(id))).filter(Boolean);
        return sendJson(res, { spools, format: body.format || 'swatch_40x30' });
      });
    }

    if (method === 'GET' && path === '/api/inventory/color-card') {
      const result = getSpools({ archived: false });
      const allSpools = result.rows || [];
      const grouped = {};
      for (const s of allSpools) {
        const mat = s.material || 'Unknown';
        if (!grouped[mat]) grouped[mat] = [];
        grouped[mat].push({ id: s.id, name: s.profile_name || s.material, color_hex: s.color_hex, vendor_name: s.vendor_name, color_name: s.color_name });
      }
      return sendJson(res, grouped);
    }

    // ---- SD Card Files ----
    const filesMatch = path.match(/^\/api\/printers\/([a-zA-Z0-9_-]+)\/files$/);
    if (filesMatch && method === 'GET') {
      const printer = getPrinters().find(p => p.id === filesMatch[1]);
      if (!printer || !printer.ip || !printer.accessCode) return sendJson(res, { error: 'Printer not found or no access code' }, 400);
      try {
        const files = await listPrinterFiles(printer.ip, printer.accessCode);
        return sendJson(res, files);
      } catch (e) { return sendJson(res, { error: e.message }, 500); }
    }

    const fileDeleteMatch = path.match(/^\/api\/printers\/([a-zA-Z0-9_-]+)\/files\/(.+)$/);
    if (fileDeleteMatch && method === 'DELETE') {
      const printer = getPrinters().find(p => p.id === fileDeleteMatch[1]);
      if (!printer || !printer.ip || !printer.accessCode) return sendJson(res, { error: 'Printer not found' }, 400);
      try {
        await deletePrinterFile(printer.ip, printer.accessCode, decodeURIComponent(fileDeleteMatch[2]));
        return sendJson(res, { ok: true });
      } catch (e) { return sendJson(res, { error: e.message }, 500); }
    }

    const filePrintMatch = path.match(/^\/api\/printers\/([a-zA-Z0-9_-]+)\/files\/print$/);
    if (filePrintMatch && method === 'POST') {
      return readBody(req, (body) => {
        if (!body.filename) return sendJson(res, { error: 'filename required' }, 400);
        // Send print command via WebSocket to client which forwards to MQTT
        if (_broadcastFn) {
          _broadcastFn({ type: 'command', printerId: filePrintMatch[1], command: { action: 'print_file', filename: body.filename, plate_id: body.plate_id } });
        }
        return sendJson(res, { ok: true });
      });
    }

    // ---- G-Code Macros ----
    if (method === 'GET' && path === '/api/macros') {
      const url = new URL(req.url, 'http://localhost');
      const category = url.searchParams.get('category');
      return sendJson(res, getMacros(category));
    }

    if (method === 'POST' && path === '/api/macros') {
      return readBody(req, (body) => {
        if (!body.name || !body.gcode) return sendJson(res, { error: 'name and gcode required' }, 400);
        const id = addMacro(body);
        return sendJson(res, { ok: true, id }, 201);
      });
    }

    const macroMatch = path.match(/^\/api\/macros\/(\d+)$/);
    if (macroMatch && method === 'GET') {
      const macro = getMacro(parseInt(macroMatch[1]));
      if (!macro) return sendJson(res, { error: 'Macro not found' }, 404);
      return sendJson(res, macro);
    }

    if (macroMatch && method === 'PUT') {
      return readBody(req, (body) => {
        updateMacro(parseInt(macroMatch[1]), body);
        return sendJson(res, { ok: true });
      });
    }

    if (macroMatch && method === 'DELETE') {
      deleteMacro(parseInt(macroMatch[1]));
      return sendJson(res, { ok: true });
    }

    const macroRunMatch = path.match(/^\/api\/macros\/(\d+)\/run$/);
    if (macroRunMatch && method === 'POST') {
      return readBody(req, (body) => {
        const macro = getMacro(parseInt(macroRunMatch[1]));
        if (!macro) return sendJson(res, { error: 'Macro not found' }, 404);
        if (!body.printer_id) return sendJson(res, { error: 'printer_id required' }, 400);
        // Send each gcode line via broadcast to the printer
        const lines = macro.gcode.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith(';'));
        for (const line of lines) {
          if (_broadcastFn) {
            _broadcastFn({ type: 'command', printerId: body.printer_id, command: { action: 'gcode', gcode: line } });
          }
        }
        return sendJson(res, { ok: true, lines_sent: lines.length });
      });
    }

    // ---- Outgoing Webhooks ----
    if (method === 'GET' && path === '/api/webhooks') {
      return sendJson(res, getWebhookConfigs());
    }

    if (method === 'POST' && path === '/api/webhooks') {
      return readBody(req, (body) => {
        if (!body.name || !body.url) return sendJson(res, { error: 'name and url required' }, 400);
        try {
          const id = addWebhookConfig(body);
          return sendJson(res, { ok: true, id }, 201);
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      });
    }

    const webhookMatch = path.match(/^\/api\/webhooks\/(\d+)$/);
    if (webhookMatch && method === 'GET') {
      const wh = getWebhookConfig(parseInt(webhookMatch[1]));
      if (!wh) return sendJson(res, { error: 'Webhook not found' }, 404);
      return sendJson(res, wh);
    }

    if (webhookMatch && method === 'PUT') {
      return readBody(req, (body) => {
        try {
          updateWebhookConfig(parseInt(webhookMatch[1]), body);
          return sendJson(res, { ok: true });
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      });
    }

    if (webhookMatch && method === 'DELETE') {
      deleteWebhookConfig(parseInt(webhookMatch[1]));
      return sendJson(res, { ok: true });
    }

    const webhookTestMatch = path.match(/^\/api\/webhooks\/(\d+)\/test$/);
    if (webhookTestMatch && method === 'POST') {
      const wh = getWebhookConfig(parseInt(webhookTestMatch[1]));
      if (!wh) return sendJson(res, { error: 'Webhook not found' }, 404);
      try {
        const payload = JSON.stringify({ event: 'test', title: 'Webhook Test', message: 'This is a test from Bambu Dashboard', timestamp: new Date().toISOString(), data: {} });
        const deliveryId = addWebhookDelivery({ webhook_id: wh.id, event_type: 'test', payload, status: 'pending' });
        // Fire and forget — the webhook dispatcher will handle retry
        _dispatchWebhook(wh, payload, deliveryId).catch(() => {});
        return sendJson(res, { ok: true, delivery_id: deliveryId });
      } catch (e) { return sendJson(res, { error: e.message }, 500); }
    }

    const webhookDeliveriesMatch = path.match(/^\/api\/webhooks\/(\d+)\/deliveries$/);
    if (webhookDeliveriesMatch && method === 'GET') {
      return sendJson(res, getWebhookDeliveries(parseInt(webhookDeliveriesMatch[1])));
    }

    // ---- Print Cost ----
    const costMatch = path.match(/^\/api\/cost\/(\d+)$/);
    if (costMatch && method === 'GET') {
      const cost = getPrintCost(parseInt(costMatch[1]));
      if (!cost) return sendJson(res, { error: 'No cost data for this print' }, 404);
      return sendJson(res, cost);
    }

    if (method === 'GET' && path === '/api/cost/report') {
      const u = new URL(req.url, 'http://localhost');
      return sendJson(res, getCostReport(u.searchParams.get('from'), u.searchParams.get('to')));
    }

    if (method === 'GET' && path === '/api/cost/summary') {
      const u = new URL(req.url, 'http://localhost');
      return sendJson(res, getCostSummary(u.searchParams.get('from'), u.searchParams.get('to')));
    }

    const costCalcMatch = path.match(/^\/api\/cost\/estimate$/);
    if (costCalcMatch && method === 'POST') {
      return readBody(req, (body) => {
        const result = estimatePrintCostAdvanced(body.filament_g || 0, body.duration_seconds || 0, body.spool_id || null);
        return sendJson(res, result);
      });
    }

    // ---- Material Reference ----
    if (method === 'GET' && path === '/api/materials') {
      return sendJson(res, getMaterials());
    }

    if (method === 'POST' && path === '/api/materials') {
      return readBody(req, (body) => {
        if (!body.material) return sendJson(res, { error: 'material name required' }, 400);
        try {
          const id = addMaterial(body);
          return sendJson(res, { ok: true, id }, 201);
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      });
    }

    const materialMatch = path.match(/^\/api\/materials\/(\d+)$/);
    if (materialMatch && method === 'GET') {
      const mat = getMaterial(parseInt(materialMatch[1]));
      if (!mat) return sendJson(res, { error: 'Material not found' }, 404);
      return sendJson(res, mat);
    }

    if (materialMatch && method === 'PUT') {
      return readBody(req, (body) => {
        try {
          updateMaterial(parseInt(materialMatch[1]), body);
          return sendJson(res, { ok: true });
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      });
    }

    const materialLookupMatch = path.match(/^\/api\/materials\/lookup\/(.+)$/);
    if (materialLookupMatch && method === 'GET') {
      const mat = getMaterialByName(decodeURIComponent(materialLookupMatch[1]));
      if (!mat) return sendJson(res, { error: 'Material not found' }, 404);
      return sendJson(res, mat);
    }

    // ---- Hardware Database ----
    if (method === 'GET' && path === '/api/hardware') {
      const u = new URL(req.url, 'http://localhost');
      const category = u.searchParams.get('category');
      return sendJson(res, getHardwareItems(category));
    }

    if (method === 'POST' && path === '/api/hardware') {
      return readBody(req, (body) => {
        if (!body.category || !body.name) return sendJson(res, { error: 'category and name required' }, 400);
        try {
          const id = addHardwareItem(body);
          return sendJson(res, { ok: true, id }, 201);
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      });
    }

    const hwMatch = path.match(/^\/api\/hardware\/(\d+)$/);
    if (hwMatch && method === 'GET') {
      const item = getHardwareItem(parseInt(hwMatch[1]));
      if (!item) return sendJson(res, { error: 'Hardware not found' }, 404);
      return sendJson(res, item);
    }

    if (hwMatch && method === 'PUT') {
      return readBody(req, (body) => {
        try {
          updateHardwareItem(parseInt(hwMatch[1]), body);
          return sendJson(res, { ok: true });
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      });
    }

    if (hwMatch && method === 'DELETE') {
      deleteHardwareItem(parseInt(hwMatch[1]));
      return sendJson(res, { ok: true });
    }

    const hwAssignMatch = path.match(/^\/api\/hardware\/(\d+)\/assign$/);
    if (hwAssignMatch && method === 'POST') {
      return readBody(req, (body) => {
        if (!body.printer_id) return sendJson(res, { error: 'printer_id required' }, 400);
        try {
          assignHardware(parseInt(hwAssignMatch[1]), body.printer_id);
          return sendJson(res, { ok: true });
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      });
    }

    const hwUnassignMatch = path.match(/^\/api\/hardware\/(\d+)\/unassign$/);
    if (hwUnassignMatch && method === 'POST') {
      return readBody(req, (body) => {
        if (!body.printer_id) return sendJson(res, { error: 'printer_id required' }, 400);
        try {
          unassignHardware(parseInt(hwUnassignMatch[1]), body.printer_id);
          return sendJson(res, { ok: true });
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      });
    }

    const hwPrinterMatch = path.match(/^\/api\/hardware\/printer\/([a-zA-Z0-9_-]+)$/);
    if (hwPrinterMatch && method === 'GET') {
      return sendJson(res, getHardwareForPrinter(hwPrinterMatch[1]));
    }

    const hwAssignmentsMatch = path.match(/^\/api\/hardware\/(\d+)\/assignments$/);
    if (hwAssignmentsMatch && method === 'GET') {
      return sendJson(res, getHardwareAssignments(parseInt(hwAssignmentsMatch[1])));
    }

    // ---- User Roles ----
    if (method === 'GET' && path === '/api/roles') {
      return sendJson(res, getRoles());
    }

    if (method === 'POST' && path === '/api/roles') {
      return readBody(req, (body) => {
        if (!body.name) return sendJson(res, { error: 'name required' }, 400);
        try {
          const id = addRole(body);
          return sendJson(res, { ok: true, id }, 201);
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      });
    }

    const roleMatch = path.match(/^\/api\/roles\/(\d+)$/);
    if (roleMatch && method === 'GET') {
      const role = getRole(parseInt(roleMatch[1]));
      if (!role) return sendJson(res, { error: 'Role not found' }, 404);
      return sendJson(res, role);
    }

    if (roleMatch && method === 'PUT') {
      return readBody(req, (body) => {
        try {
          updateRole(parseInt(roleMatch[1]), body);
          return sendJson(res, { ok: true });
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      });
    }

    if (roleMatch && method === 'DELETE') {
      deleteRole(parseInt(roleMatch[1]));
      return sendJson(res, { ok: true });
    }

    // ---- Users Management ----
    if (method === 'GET' && path === '/api/users') {
      const users = getUsers().map(u => ({ ...u, password_hash: undefined }));
      return sendJson(res, users);
    }

    if (method === 'POST' && path === '/api/users') {
      return readBody(req, (body) => {
        if (!body.username || !body.password) return sendJson(res, { error: 'username and password required' }, 400);
        try {
          const id = addUser({
            username: body.username,
            password_hash: hashPassword(body.password),
            role_id: body.role_id || null,
            display_name: body.display_name || null
          });
          return sendJson(res, { ok: true, id }, 201);
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      });
    }

    const userMatch = path.match(/^\/api\/users\/(\d+)$/);
    if (userMatch && method === 'GET') {
      const user = getUser(parseInt(userMatch[1]));
      if (!user) return sendJson(res, { error: 'User not found' }, 404);
      return sendJson(res, { ...user, password_hash: undefined });
    }

    if (userMatch && method === 'PUT') {
      return readBody(req, (body) => {
        try {
          const updates = {};
          if (body.username) updates.username = body.username;
          if (body.display_name !== undefined) updates.display_name = body.display_name;
          if (body.role_id !== undefined) updates.role_id = body.role_id;
          if (body.password) updates.password_hash = hashPassword(body.password);
          updateUser(parseInt(userMatch[1]), updates);
          return sendJson(res, { ok: true });
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      });
    }

    if (userMatch && method === 'DELETE') {
      deleteUser(parseInt(userMatch[1]));
      return sendJson(res, { ok: true });
    }

    // ---- API Keys ----
    if (method === 'GET' && path === '/api/keys') {
      return sendJson(res, getApiKeys());
    }

    if (method === 'POST' && path === '/api/keys') {
      return readBody(req, (body) => {
        if (!body.name) return sendJson(res, { error: 'name required' }, 400);
        try {
          const { key, hash, prefix } = generateApiKey();
          const id = addApiKey({
            name: body.name,
            key_hash: hash,
            key_prefix: prefix,
            permissions: body.permissions || ['*'],
            user_id: body.user_id || null,
            expires_at: body.expires_at || null
          });
          // Return full key only on creation
          return sendJson(res, { ok: true, id, key, prefix }, 201);
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      });
    }

    const keyMatch = path.match(/^\/api\/keys\/(\d+)$/);
    if (keyMatch && method === 'DELETE') {
      deleteApiKey(parseInt(keyMatch[1]));
      return sendJson(res, { ok: true });
    }

    const keyDeactivateMatch = path.match(/^\/api\/keys\/(\d+)\/deactivate$/);
    if (keyDeactivateMatch && method === 'POST') {
      deactivateApiKey(parseInt(keyDeactivateMatch[1]));
      return sendJson(res, { ok: true });
    }

    // ---- E-Commerce License ----
    if (method === 'GET' && path === '/api/ecommerce/license') {
      return sendJson(res, _ecomLicense ? _ecomLicense.getStatus() : { active: false, status: 'inactive' });
    }

    if (method === 'POST' && path === '/api/ecommerce/license/activate') {
      return readBody(req, async (body) => {
        if (!body.license_key) return sendJson(res, { error: 'license_key required' }, 400);
        if (!_ecomLicense) return sendJson(res, { error: 'License manager not initialized' }, 500);
        try {
          const result = await _ecomLicense.activate(body.license_key, body.email);
          return sendJson(res, result);
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      });
    }

    if (method === 'POST' && path === '/api/ecommerce/license/deactivate') {
      if (!_ecomLicense) return sendJson(res, { error: 'License manager not initialized' }, 500);
      return sendJson(res, _ecomLicense.deactivate());
    }

    if (method === 'POST' && path === '/api/ecommerce/license/validate') {
      if (!_ecomLicense) return sendJson(res, { error: 'License manager not initialized' }, 500);
      try {
        const result = await _ecomLicense.validate(true);
        return sendJson(res, result);
      } catch (e) { return sendJson(res, { error: e.message }, 500); }
    }

    if (method === 'GET' && path === '/api/ecommerce/fees') {
      const from = url.searchParams.get('from');
      const to = url.searchParams.get('to');
      return sendJson(res, {
        summary: getEcomFeesSummary(from, to),
        total: getEcomFeesTotal(),
        fees: getEcomFees()
      });
    }

    if (method === 'POST' && path === '/api/ecommerce/fees/report') {
      if (!_ecomLicense) return sendJson(res, { error: 'License manager not initialized' }, 500);
      try {
        const result = await _ecomLicense.reportFees();
        return sendJson(res, result);
      } catch (e) { return sendJson(res, { error: e.message }, 500); }
    }

    // ---- E-Commerce ----
    if (method === 'GET' && path === '/api/ecommerce/configs') {
      return sendJson(res, getEcommerceConfigs());
    }

    if (method === 'POST' && path === '/api/ecommerce/configs') {
      if (_ecomLicense && !_ecomLicense.isActive()) return sendJson(res, { error: 'Active e-commerce license required' }, 403);
      return readBody(req, (body) => {
        if (!body.name) return sendJson(res, { error: 'name required' }, 400);
        try {
          const id = addEcommerceConfig(body);
          return sendJson(res, { ok: true, id }, 201);
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      });
    }

    const ecomConfigMatch = path.match(/^\/api\/ecommerce\/configs\/(\d+)$/);
    if (ecomConfigMatch) {
      const id = parseInt(ecomConfigMatch[1]);
      if (method === 'GET') return sendJson(res, getEcommerceConfig(id) || { error: 'Not found' });
      if (method === 'PUT') {
        if (_ecomLicense && !_ecomLicense.isActive()) return sendJson(res, { error: 'Active e-commerce license required' }, 403);
        return readBody(req, (body) => { updateEcommerceConfig(id, body); sendJson(res, { ok: true }); });
      }
      if (method === 'DELETE') {
        if (_ecomLicense && !_ecomLicense.isActive()) return sendJson(res, { error: 'Active e-commerce license required' }, 403);
        deleteEcommerceConfig(id); return sendJson(res, { ok: true });
      }
    }

    if (method === 'GET' && path === '/api/ecommerce/orders') {
      const configId = url.searchParams.get('config_id');
      return sendJson(res, getEcommerceOrders(configId ? parseInt(configId) : null));
    }

    const ecomOrderMatch = path.match(/^\/api\/ecommerce\/orders\/(\d+)$/);
    if (ecomOrderMatch) {
      const id = parseInt(ecomOrderMatch[1]);
      if (method === 'GET') return sendJson(res, getEcommerceOrder(id) || { error: 'Not found' });
      if (method === 'PUT') return readBody(req, (body) => { updateEcommerceOrder(id, body); sendJson(res, { ok: true }); });
    }

    const ecomFulfillMatch = path.match(/^\/api\/ecommerce\/orders\/(\d+)\/fulfill$/);
    if (ecomFulfillMatch && method === 'POST') {
      const id = parseInt(ecomFulfillMatch[1]);
      updateEcommerceOrder(id, { status: 'fulfilled', fulfilled_at: new Date().toISOString() });
      return sendJson(res, { ok: true });
    }

    // E-Commerce webhook receiver (public endpoint for platforms)
    const ecomWebhookMatch = path.match(/^\/api\/ecommerce\/webhook\/(\d+)$/);
    if (ecomWebhookMatch && method === 'POST') {
      const configId = parseInt(ecomWebhookMatch[1]);
      if (_ecomLicense && !_ecomLicense.isActive()) return sendJson(res, { error: 'Active e-commerce license required' }, 403);
      return _readRawBody(req, (rawBody) => {
        const ecomConfig = getEcommerceConfig(configId);
        if (!ecomConfig || !ecomConfig.active) return sendJson(res, { error: 'Not found' }, 404);

        // Verify HMAC signature if secret configured
        if (ecomConfig.webhook_secret) {
          const sig = req.headers['x-shopify-hmac-sha256'] || req.headers['x-wc-webhook-signature'] || req.headers['x-webhook-signature'] || '';
          const expected = createHmac('sha256', ecomConfig.webhook_secret).update(rawBody).digest('base64');
          try {
            if (!sig || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
              return sendJson(res, { error: 'Invalid signature' }, 401);
            }
          } catch { return sendJson(res, { error: 'Invalid signature' }, 401); }
        }

        let body;
        try { body = JSON.parse(rawBody); } catch { return sendJson(res, { error: 'Invalid JSON' }, 400); }

        // Parse order from different platforms
        const order = _parseEcommerceOrder(ecomConfig.platform, body);
        if (!order) return sendJson(res, { error: 'Could not parse order' }, 400);

        const orderId = addEcommerceOrder({
          config_id: configId,
          order_id: order.orderId,
          platform_order_id: order.platformOrderId,
          customer_name: order.customerName,
          items: order.items,
          status: 'received'
        });

        // Track 5% transaction fee
        if (_ecomLicense && order.orderTotal > 0) {
          _ecomLicense.addOrderFee(orderId, configId, order.orderTotal, order.currency || 'NOK');
        }

        // Auto-queue if enabled
        if (ecomConfig.auto_queue && ecomConfig.target_queue_id && _queueManager) {
          const mapping = typeof ecomConfig.sku_to_file_mapping === 'string' ? JSON.parse(ecomConfig.sku_to_file_mapping) : (ecomConfig.sku_to_file_mapping || {});
          const queueItemIds = [];
          for (const item of order.items) {
            const filename = mapping[item.sku] || mapping[item.name];
            if (filename) {
              for (let c = 0; c < (item.quantity || 1); c++) {
                try {
                  const qiId = addQueueItem({ queue_id: ecomConfig.target_queue_id, filename, notes: `Order #${order.orderId} — ${item.name}` });
                  queueItemIds.push(qiId);
                } catch (_) {}
              }
            }
          }
          if (queueItemIds.length > 0) {
            updateEcommerceOrder(orderId, { status: 'queued', queue_item_ids: queueItemIds });
          }
        }

        return sendJson(res, { ok: true, order_id: orderId }, 201);
      });
    }

    // ---- Timelapse ----
    if (method === 'GET' && path === '/api/timelapse') {
      const printerId = url.searchParams.get('printer_id');
      return sendJson(res, getTimelapseRecordings(printerId));
    }

    const timelapseIdMatch = path.match(/^\/api\/timelapse\/(\d+)$/);
    if (timelapseIdMatch) {
      const id = parseInt(timelapseIdMatch[1]);
      if (method === 'GET') return sendJson(res, getTimelapseRecording(id) || { error: 'Not found' });
      if (method === 'DELETE') {
        const rec = getTimelapseRecording(id);
        if (rec && rec.file_path) { try { const { unlinkSync: ul } = await import('node:fs'); ul(rec.file_path); } catch (_) {} }
        deleteTimelapseRecording(id);
        return sendJson(res, { ok: true });
      }
    }

    // Serve timelapse video file
    const timelapseVideoMatch = path.match(/^\/api\/timelapse\/(\d+)\/video$/);
    if (timelapseVideoMatch && method === 'GET') {
      const id = parseInt(timelapseVideoMatch[1]);
      const rec = getTimelapseRecording(id);
      if (!rec || !rec.file_path || !existsSync(rec.file_path)) return sendJson(res, { error: 'Video not found' }, 404);
      const stat = statSync(rec.file_path);
      res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Content-Length': stat.size,
        'Content-Disposition': `inline; filename="${rec.filename || 'timelapse'}.mp4"`
      });
      createReadStream(rec.file_path).pipe(res);
      return;
    }

    if (method === 'GET' && path === '/api/timelapse/active') {
      if (!_timelapseService) return sendJson(res, []);
      return sendJson(res, _timelapseService.getActiveRecordings());
    }

    // ---- Push Subscriptions ----
    if (method === 'POST' && path === '/api/push/subscribe') {
      return readBody(req, (body) => {
        if (!body.endpoint) return sendJson(res, { error: 'endpoint required' }, 400);
        const id = addPushSubscription({
          endpoint: body.endpoint,
          keys_p256dh: body.keys?.p256dh || null,
          keys_auth: body.keys?.auth || null,
          user_agent: req.headers['user-agent'] || null
        });
        return sendJson(res, { ok: true, id }, 201);
      });
    }

    if (method === 'POST' && path === '/api/push/unsubscribe') {
      return readBody(req, (body) => {
        if (!body.endpoint) return sendJson(res, { error: 'endpoint required' }, 400);
        deletePushSubscription(body.endpoint);
        return sendJson(res, { ok: true });
      });
    }

    if (method === 'GET' && path === '/api/push/vapid-key') {
      const vapidPublicKey = getInventorySetting('vapid_public_key');
      return sendJson(res, { key: vapidPublicKey || null });
    }

    // ---- Community Filaments ----
    if (method === 'GET' && path === '/api/community-filaments') {
      const filters = {};
      if (url.searchParams.get('manufacturer')) filters.manufacturer = url.searchParams.get('manufacturer');
      if (url.searchParams.get('material')) filters.material = url.searchParams.get('material');
      if (url.searchParams.get('search')) filters.search = url.searchParams.get('search');
      if (url.searchParams.get('limit')) filters.limit = parseInt(url.searchParams.get('limit'));
      if (url.searchParams.get('offset')) filters.offset = parseInt(url.searchParams.get('offset'));
      return sendJson(res, getCommunityFilaments(filters));
    }

    if (method === 'GET' && path === '/api/community-filaments/manufacturers') {
      return sendJson(res, getCommunityManufacturers());
    }

    if (method === 'GET' && path === '/api/community-filaments/materials') {
      return sendJson(res, getCommunityMaterials());
    }

    if (method === 'GET' && path === '/api/community-filaments/color-search') {
      const hex = (url.searchParams.get('hex') || '').replace('#', '');
      const tolerance = parseInt(url.searchParams.get('tolerance') || '30');
      if (!hex || hex.length < 6) return sendJson(res, { error: 'hex parameter required (6 chars)' }, 400);
      return sendJson(res, searchCommunityByColor(hex, tolerance));
    }

    const cfMatch = path.match(/^\/api\/community-filaments\/(\d+)$/);
    if (cfMatch && method === 'GET') {
      const cf = getCommunityFilament(parseInt(cfMatch[1]));
      if (!cf) return sendJson(res, { error: 'Not found' }, 404);
      return sendJson(res, cf);
    }

    if (method === 'POST' && path === '/api/community-filaments') {
      return readBody(req, (body) => {
        if (!body.manufacturer || !body.material) return sendJson(res, { error: 'manufacturer and material required' }, 400);
        const id = addCommunityFilament(body);
        sendJson(res, { ok: true, id }, 201);
      });
    }

    if (cfMatch && method === 'PUT') {
      return readBody(req, (body) => {
        updateCommunityFilament(parseInt(cfMatch[1]), body);
        sendJson(res, { ok: true });
      });
    }

    if (cfMatch && method === 'DELETE') {
      deleteCommunityFilament(parseInt(cfMatch[1]));
      return sendJson(res, { ok: true });
    }

    // ---- Brand Defaults ----
    if (method === 'GET' && path === '/api/brand-defaults') {
      const manufacturer = url.searchParams.get('manufacturer');
      return sendJson(res, getBrandDefaults(manufacturer || null));
    }

    const bdMatch = path.match(/^\/api\/brand-defaults\/(\d+)$/);
    if (bdMatch && method === 'GET') {
      const bd = getBrandDefault(parseInt(bdMatch[1]));
      if (!bd) return sendJson(res, { error: 'Not found' }, 404);
      return sendJson(res, bd);
    }

    if (method === 'POST' && path === '/api/brand-defaults') {
      return readBody(req, (body) => {
        if (!body.manufacturer) return sendJson(res, { error: 'manufacturer required' }, 400);
        const id = upsertBrandDefault(body);
        sendJson(res, { ok: true, id }, 201);
      });
    }

    if (bdMatch && method === 'DELETE') {
      deleteBrandDefault(parseInt(bdMatch[1]));
      return sendJson(res, { ok: true });
    }

    // ---- Custom Fields ----
    if (method === 'GET' && path === '/api/custom-fields') {
      const entityType = url.searchParams.get('entity_type');
      return sendJson(res, getCustomFieldDefs(entityType || null));
    }

    const cfdMatch = path.match(/^\/api\/custom-fields\/(\d+)$/);
    if (cfdMatch && method === 'GET') {
      const cf = getCustomFieldDef(parseInt(cfdMatch[1]));
      if (!cf) return sendJson(res, { error: 'Not found' }, 404);
      return sendJson(res, cf);
    }

    if (method === 'POST' && path === '/api/custom-fields') {
      return readBody(req, (body) => {
        if (!body.entity_type || !body.field_name || !body.field_label) return sendJson(res, { error: 'entity_type, field_name, field_label required' }, 400);
        const id = addCustomFieldDef(body);
        sendJson(res, { ok: true, id }, 201);
      });
    }

    if (cfdMatch && method === 'PUT') {
      return readBody(req, (body) => {
        updateCustomFieldDef(parseInt(cfdMatch[1]), body);
        sendJson(res, { ok: true });
      });
    }

    if (cfdMatch && method === 'DELETE') {
      deleteCustomFieldDef(parseInt(cfdMatch[1]));
      return sendJson(res, { ok: true });
    }

    const cfvMatch = path.match(/^\/api\/custom-fields\/values\/([a-z_]+)\/(\d+)$/);
    if (cfvMatch && method === 'GET') {
      return sendJson(res, getCustomFieldValues(cfvMatch[1], parseInt(cfvMatch[2])));
    }

    if (method === 'POST' && path === '/api/custom-fields/values') {
      return readBody(req, (body) => {
        if (!body.field_id || !body.entity_type || !body.entity_id) return sendJson(res, { error: 'field_id, entity_type, entity_id required' }, 400);
        setCustomFieldValue(body.field_id, body.entity_type, body.entity_id, body.value || null);
        sendJson(res, { ok: true });
      });
    }

    // ---- Printer Groups ----
    if (method === 'GET' && path === '/api/printer-groups') {
      const groups = getPrinterGroups();
      for (const g of groups) g.members = getGroupMembers(g.id);
      return sendJson(res, groups);
    }

    const pgMatch = path.match(/^\/api\/printer-groups\/(\d+)$/);
    if (pgMatch && method === 'GET') {
      const g = getPrinterGroup(parseInt(pgMatch[1]));
      if (!g) return sendJson(res, { error: 'Not found' }, 404);
      g.members = getGroupMembers(g.id);
      return sendJson(res, g);
    }

    if (method === 'POST' && path === '/api/printer-groups') {
      return readBody(req, (body) => {
        if (!body.name) return sendJson(res, { error: 'name required' }, 400);
        const id = addPrinterGroup(body);
        sendJson(res, { ok: true, id }, 201);
      });
    }

    if (pgMatch && method === 'PUT') {
      return readBody(req, (body) => {
        updatePrinterGroup(parseInt(pgMatch[1]), body);
        sendJson(res, { ok: true });
      });
    }

    if (pgMatch && method === 'DELETE') {
      deletePrinterGroup(parseInt(pgMatch[1]));
      return sendJson(res, { ok: true });
    }

    const pgMemberMatch = path.match(/^\/api\/printer-groups\/(\d+)\/members$/);
    if (pgMemberMatch && method === 'POST') {
      return readBody(req, (body) => {
        if (!body.printer_id) return sendJson(res, { error: 'printer_id required' }, 400);
        addPrinterToGroup(parseInt(pgMemberMatch[1]), body.printer_id);
        sendJson(res, { ok: true });
      });
    }

    const pgMemberDelMatch = path.match(/^\/api\/printer-groups\/(\d+)\/members\/([a-zA-Z0-9_-]+)$/);
    if (pgMemberDelMatch && method === 'DELETE') {
      removePrinterFromGroup(parseInt(pgMemberDelMatch[1]), pgMemberDelMatch[2]);
      return sendJson(res, { ok: true });
    }

    if (method === 'GET' && path.match(/^\/api\/printers\/[a-zA-Z0-9_-]+\/groups$/)) {
      const pid = path.split('/')[3];
      return sendJson(res, getPrinterGroupsForPrinter(pid));
    }

    // ---- Projects ----
    if (method === 'GET' && path === '/api/projects') {
      const status = url.searchParams.get('status');
      return sendJson(res, getProjects(status || null));
    }

    const projMatch = path.match(/^\/api\/projects\/(\d+)$/);
    if (projMatch && method === 'GET') {
      const p = getProject(parseInt(projMatch[1]));
      if (!p) return sendJson(res, { error: 'Not found' }, 404);
      p.prints = getProjectPrints(p.id);
      return sendJson(res, p);
    }

    if (method === 'POST' && path === '/api/projects') {
      return readBody(req, (body) => {
        if (!body.name) return sendJson(res, { error: 'name required' }, 400);
        const id = addProject(body);
        sendJson(res, { ok: true, id }, 201);
      });
    }

    if (projMatch && method === 'PUT') {
      return readBody(req, (body) => {
        updateProject(parseInt(projMatch[1]), body);
        sendJson(res, { ok: true });
      });
    }

    if (projMatch && method === 'DELETE') {
      deleteProject(parseInt(projMatch[1]));
      return sendJson(res, { ok: true });
    }

    const projPrintMatch = path.match(/^\/api\/projects\/(\d+)\/prints$/);
    if (projPrintMatch && method === 'GET') {
      return sendJson(res, getProjectPrints(parseInt(projPrintMatch[1])));
    }

    if (projPrintMatch && method === 'POST') {
      return readBody(req, (body) => {
        body.project_id = parseInt(projPrintMatch[1]);
        const id = addProjectPrint(body);
        sendJson(res, { ok: true, id }, 201);
      });
    }

    const projPrintItemMatch = path.match(/^\/api\/projects\/prints\/(\d+)$/);
    if (projPrintItemMatch && method === 'PUT') {
      return readBody(req, (body) => {
        updateProjectPrint(parseInt(projPrintItemMatch[1]), body);
        sendJson(res, { ok: true });
      });
    }

    if (projPrintItemMatch && method === 'DELETE') {
      deleteProjectPrint(parseInt(projPrintItemMatch[1]));
      return sendJson(res, { ok: true });
    }

    // ---- Export ----
    if (method === 'GET' && path === '/api/export/templates') {
      const entityType = url.searchParams.get('entity_type');
      return sendJson(res, getExportTemplates(entityType || null));
    }

    if (method === 'POST' && path === '/api/export/templates') {
      return readBody(req, (body) => {
        if (!body.name || !body.entity_type || !body.columns) return sendJson(res, { error: 'name, entity_type, columns required' }, 400);
        const id = addExportTemplate(body);
        sendJson(res, { ok: true, id }, 201);
      });
    }

    const etMatch = path.match(/^\/api\/export\/templates\/(\d+)$/);
    if (etMatch && method === 'DELETE') {
      deleteExportTemplate(parseInt(etMatch[1]));
      return sendJson(res, { ok: true });
    }

    if (method === 'GET' && path === '/api/export/spools') {
      const format = url.searchParams.get('format') || 'csv';
      const data = getAllSpoolsForExport();
      if (format === 'json') return sendJson(res, data);
      // CSV
      if (data.length === 0) { res.writeHead(200, { 'Content-Type': 'text/csv' }); return res.end(''); }
      const keys = Object.keys(data[0]);
      const csv = [keys.join(','), ...data.map(row => keys.map(k => { const v = row[k]; return v === null || v === undefined ? '' : `"${String(v).replace(/"/g, '""')}"`; }).join(','))].join('\n');
      res.writeHead(200, { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="spools.csv"' });
      return res.end(csv);
    }

    if (method === 'GET' && path === '/api/export/filament-profiles') {
      const format = url.searchParams.get('format') || 'csv';
      const data = getAllFilamentProfilesForExport();
      if (format === 'json') return sendJson(res, data);
      if (data.length === 0) { res.writeHead(200, { 'Content-Type': 'text/csv' }); return res.end(''); }
      const keys = Object.keys(data[0]);
      const csv = [keys.join(','), ...data.map(row => keys.map(k => { const v = row[k]; return v === null || v === undefined ? '' : `"${String(v).replace(/"/g, '""')}"`; }).join(','))].join('\n');
      res.writeHead(200, { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="filament_profiles.csv"' });
      return res.end(csv);
    }

    if (method === 'GET' && path === '/api/export/vendors') {
      const format = url.searchParams.get('format') || 'csv';
      const data = getAllVendorsForExport();
      if (format === 'json') return sendJson(res, data);
      if (data.length === 0) { res.writeHead(200, { 'Content-Type': 'text/csv' }); return res.end(''); }
      const keys = Object.keys(data[0]);
      const csv = [keys.join(','), ...data.map(row => keys.map(k => { const v = row[k]; return v === null || v === undefined ? '' : `"${String(v).replace(/"/g, '""')}"`; }).join(','))].join('\n');
      res.writeHead(200, { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="vendors.csv"' });
      return res.end(csv);
    }

    if (method === 'GET' && path === '/api/export/history') {
      const format = url.searchParams.get('format') || 'csv';
      const limit = parseInt(url.searchParams.get('limit') || '1000');
      const data = getHistory(null, limit);
      if (format === 'json') return sendJson(res, data);
      if (data.length === 0) { res.writeHead(200, { 'Content-Type': 'text/csv' }); return res.end(''); }
      const keys = Object.keys(data[0]);
      const csv = [keys.join(','), ...data.map(row => keys.map(k => { const v = row[k]; return v === null || v === undefined ? '' : `"${String(v).replace(/"/g, '""')}"`; }).join(','))].join('\n');
      res.writeHead(200, { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="print_history.csv"' });
      return res.end(csv);
    }

    // ---- User Quotas ----
    const uqMatch = path.match(/^\/api\/users\/(\d+)\/quota$/);
    if (uqMatch && method === 'GET') {
      return sendJson(res, getUserQuota(parseInt(uqMatch[1])) || { balance: 0 });
    }

    if (uqMatch && method === 'PUT') {
      return readBody(req, (body) => {
        try {
          upsertUserQuota(parseInt(uqMatch[1]), body);
          sendJson(res, { ok: true });
        } catch (e) { sendJson(res, { error: e.message }, 400); }
      });
    }

    const utMatch = path.match(/^\/api\/users\/(\d+)\/transactions$/);
    if (utMatch && method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '50');
      return sendJson(res, getUserTransactions(parseInt(utMatch[1]), limit));
    }

    if (utMatch && method === 'POST') {
      return readBody(req, (body) => {
        body.user_id = parseInt(utMatch[1]);
        if (!body.type || !body.amount) return sendJson(res, { error: 'type and amount required' }, 400);
        try {
          const id = addUserTransaction(body);
          sendJson(res, { ok: true, id }, 201);
        } catch (e) { sendJson(res, { error: e.message }, 400); }
      });
    }

    // ---- Failure Detection ----
    if (method === 'GET' && path === '/api/failure-detections') {
      const printerId = url.searchParams.get('printer_id');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      return sendJson(res, getFailureDetections(printerId || null, limit));
    }

    const fdMatch = path.match(/^\/api\/failure-detections\/(\d+)$/);
    if (fdMatch && method === 'GET') {
      const d = getFailureDetection(parseInt(fdMatch[1]));
      if (!d) return sendJson(res, { error: 'Not found' }, 404);
      return sendJson(res, d);
    }

    if (fdMatch && method === 'DELETE') {
      deleteFailureDetection(parseInt(fdMatch[1]));
      return sendJson(res, { ok: true });
    }

    const fdAckMatch = path.match(/^\/api\/failure-detections\/(\d+)\/acknowledge$/);
    if (fdAckMatch && method === 'POST') {
      acknowledgeFailureDetection(parseInt(fdAckMatch[1]));
      return sendJson(res, { ok: true });
    }

    // ---- Price History ----
    const phMatch = path.match(/^\/api\/price-history\/(\d+)$/);
    if (phMatch && method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '100');
      return sendJson(res, getPriceHistory(parseInt(phMatch[1]), limit));
    }

    if (method === 'POST' && path === '/api/price-history') {
      return readBody(req, (body) => {
        if (!body.filament_profile_id || !body.price) return sendJson(res, { error: 'filament_profile_id and price required' }, 400);
        try {
          const id = addPriceEntry(body);
          sendJson(res, { ok: true, id }, 201);
        } catch (e) { sendJson(res, { error: e.message }, 400); }
      });
    }

    const phStatsMatch = path.match(/^\/api\/price-history\/(\d+)\/stats$/);
    if (phStatsMatch && method === 'GET') {
      return sendJson(res, getPriceStats(parseInt(phStatsMatch[1])) || {});
    }

    // ---- Hex Color Search ----
    if (method === 'GET' && path === '/api/inventory/color-search') {
      const hex = (url.searchParams.get('hex') || '').replace('#', '');
      const tolerance = parseInt(url.searchParams.get('tolerance') || '30');
      if (!hex || hex.length < 6) return sendJson(res, { error: 'hex parameter required (6 chars)' }, 400);
      return sendJson(res, searchSpoolsByColor(hex, tolerance));
    }

    // ---- Build Plates ----
    if (method === 'GET' && path === '/api/build-plates') {
      const printerId = url.searchParams.get('printer_id');
      return sendJson(res, getBuildPlates(printerId || null));
    }

    const bpMatch = path.match(/^\/api\/build-plates\/(\d+)$/);
    if (bpMatch && method === 'GET') {
      const bp = getBuildPlate(parseInt(bpMatch[1]));
      if (!bp) return sendJson(res, { error: 'Not found' }, 404);
      return sendJson(res, bp);
    }

    if (method === 'POST' && path === '/api/build-plates') {
      return readBody(req, (body) => {
        if (!body.printer_id || !body.name) return sendJson(res, { error: 'printer_id and name required' }, 400);
        const id = addBuildPlate(body);
        sendJson(res, { ok: true, id }, 201);
      });
    }

    if (bpMatch && method === 'PUT') {
      return readBody(req, (body) => {
        updateBuildPlate(parseInt(bpMatch[1]), body);
        sendJson(res, { ok: true });
      });
    }

    if (bpMatch && method === 'DELETE') {
      deleteBuildPlate(parseInt(bpMatch[1]));
      return sendJson(res, { ok: true });
    }

    // ---- Dryer Models ----
    if (method === 'GET' && path === '/api/dryer-models') {
      return sendJson(res, getDryerModels());
    }

    const dmMatch = path.match(/^\/api\/dryer-models\/(\d+)$/);
    if (dmMatch && method === 'GET') {
      const dm = getDryerModel(parseInt(dmMatch[1]));
      if (!dm) return sendJson(res, { error: 'Not found' }, 404);
      return sendJson(res, dm);
    }

    if (method === 'POST' && path === '/api/dryer-models') {
      return readBody(req, (body) => {
        if (!body.brand || !body.model) return sendJson(res, { error: 'brand and model required' }, 400);
        const id = addDryerModel(body);
        sendJson(res, { ok: true, id }, 201);
      });
    }

    if (dmMatch && method === 'PUT') {
      return readBody(req, (body) => {
        updateDryerModel(parseInt(dmMatch[1]), body);
        sendJson(res, { ok: true });
      });
    }

    if (dmMatch && method === 'DELETE') {
      deleteDryerModel(parseInt(dmMatch[1]));
      return sendJson(res, { ok: true });
    }

    // ---- Storage Conditions ----
    const scMatch = path.match(/^\/api\/storage-conditions\/(\d+)$/);
    if (scMatch && method === 'GET') {
      return sendJson(res, getStorageConditions(parseInt(scMatch[1])));
    }

    if (method === 'POST' && path === '/api/storage-conditions') {
      return readBody(req, (body) => {
        if (!body.spool_id) return sendJson(res, { error: 'spool_id required' }, 400);
        try {
          const id = addStorageCondition(body);
          sendJson(res, { ok: true, id }, 201);
        } catch (e) { sendJson(res, { error: e.message }, 400); }
      });
    }

    const scDelMatch = path.match(/^\/api\/storage-conditions\/entry\/(\d+)$/);
    if (scDelMatch && method === 'DELETE') {
      deleteStorageCondition(parseInt(scDelMatch[1]));
      return sendJson(res, { ok: true });
    }

    // ---- Courses ----
    if (method === 'GET' && path === '/api/courses') {
      const category = url.searchParams.get('category');
      return sendJson(res, getCourses(category || null));
    }

    if (method === 'GET' && path === '/api/courses/with-progress') {
      const userId = parseInt(url.searchParams.get('user_id') || '0');
      return sendJson(res, getAllCoursesWithProgress(userId));
    }

    const courseMatch = path.match(/^\/api\/courses\/(\d+)$/);
    if (courseMatch && method === 'GET') {
      const c = getCourse(parseInt(courseMatch[1]));
      if (!c) return sendJson(res, { error: 'Not found' }, 404);
      return sendJson(res, c);
    }

    if (method === 'POST' && path === '/api/courses') {
      return readBody(req, (body) => {
        if (!body.title) return sendJson(res, { error: 'title required' }, 400);
        const id = addCourse(body);
        sendJson(res, { ok: true, id }, 201);
      });
    }

    if (courseMatch && method === 'PUT') {
      return readBody(req, (body) => {
        updateCourse(parseInt(courseMatch[1]), body);
        sendJson(res, { ok: true });
      });
    }

    if (courseMatch && method === 'DELETE') {
      deleteCourse(parseInt(courseMatch[1]));
      return sendJson(res, { ok: true });
    }

    const cpMatch = path.match(/^\/api\/courses\/(\d+)\/progress$/);
    if (cpMatch && method === 'GET') {
      const userId = parseInt(url.searchParams.get('user_id') || '0');
      return sendJson(res, getCourseProgress(parseInt(cpMatch[1]), userId) || { status: 'not_started' });
    }

    if (cpMatch && method === 'POST') {
      return readBody(req, (body) => {
        const userId = body.user_id || 0;
        upsertCourseProgress(parseInt(cpMatch[1]), userId, body);
        sendJson(res, { ok: true });
      });
    }

    if (method === 'GET' && path === '/api/courses/user-progress') {
      const userId = parseInt(url.searchParams.get('user_id') || '0');
      return sendJson(res, getUserCourseProgress(userId));
    }

    // ---- Knowledge Base ----
    if (method === 'GET' && path === '/api/kb/stats') {
      return sendJson(res, getKbStats());
    }
    if (method === 'GET' && path === '/api/kb/search') {
      const q = url.searchParams.get('q') || '';
      if (!q) return sendJson(res, []);
      return sendJson(res, searchKb(q));
    }
    if (method === 'POST' && path === '/api/kb/seed') {
      seedKbData();
      return sendJson(res, { ok: true });
    }

    // KB Printers
    if (method === 'GET' && path === '/api/kb/printers') {
      return sendJson(res, getKbPrinters());
    }
    const kbPrinterMatch = path.match(/^\/api\/kb\/printers\/(\d+)$/);
    if (kbPrinterMatch && method === 'GET') {
      const item = getKbPrinter(parseInt(kbPrinterMatch[1]));
      if (!item) return sendJson(res, { error: 'Not found' }, 404);
      return sendJson(res, item);
    }
    if (method === 'POST' && path === '/api/kb/printers') {
      return readBody(req, (body) => {
        if (!body.model || !body.full_name) return sendJson(res, { error: 'model and full_name required' }, 400);
        const id = addKbPrinter(body);
        sendJson(res, { ok: true, id }, 201);
      });
    }
    if (kbPrinterMatch && method === 'PUT') {
      return readBody(req, (body) => { updateKbPrinter(parseInt(kbPrinterMatch[1]), body); sendJson(res, { ok: true }); });
    }
    if (kbPrinterMatch && method === 'DELETE') {
      deleteKbPrinter(parseInt(kbPrinterMatch[1]));
      return sendJson(res, { ok: true });
    }

    // KB Accessories
    if (method === 'GET' && path === '/api/kb/accessories') {
      const cat = url.searchParams.get('category') || null;
      return sendJson(res, getKbAccessories(cat));
    }
    const kbAccMatch = path.match(/^\/api\/kb\/accessories\/(\d+)$/);
    if (kbAccMatch && method === 'GET') {
      const item = getKbAccessory(parseInt(kbAccMatch[1]));
      if (!item) return sendJson(res, { error: 'Not found' }, 404);
      return sendJson(res, item);
    }
    if (method === 'POST' && path === '/api/kb/accessories') {
      return readBody(req, (body) => {
        if (!body.name) return sendJson(res, { error: 'name required' }, 400);
        const id = addKbAccessory(body);
        sendJson(res, { ok: true, id }, 201);
      });
    }
    if (kbAccMatch && method === 'PUT') {
      return readBody(req, (body) => { updateKbAccessory(parseInt(kbAccMatch[1]), body); sendJson(res, { ok: true }); });
    }
    if (kbAccMatch && method === 'DELETE') {
      deleteKbAccessory(parseInt(kbAccMatch[1]));
      return sendJson(res, { ok: true });
    }

    // KB Filaments
    if (method === 'GET' && path === '/api/kb/filaments') {
      const mat = url.searchParams.get('material') || null;
      const brand = url.searchParams.get('brand') || null;
      return sendJson(res, getKbFilaments(mat, brand));
    }
    const kbFilMatch = path.match(/^\/api\/kb\/filaments\/(\d+)$/);
    if (kbFilMatch && method === 'GET') {
      const item = getKbFilament(parseInt(kbFilMatch[1]));
      if (!item) return sendJson(res, { error: 'Not found' }, 404);
      return sendJson(res, item);
    }
    if (method === 'POST' && path === '/api/kb/filaments') {
      return readBody(req, (body) => {
        if (!body.material) return sendJson(res, { error: 'material required' }, 400);
        const id = addKbFilament(body);
        sendJson(res, { ok: true, id }, 201);
      });
    }
    if (kbFilMatch && method === 'PUT') {
      return readBody(req, (body) => { updateKbFilament(parseInt(kbFilMatch[1]), body); sendJson(res, { ok: true }); });
    }
    if (kbFilMatch && method === 'DELETE') {
      deleteKbFilament(parseInt(kbFilMatch[1]));
      return sendJson(res, { ok: true });
    }

    // KB Profiles
    if (method === 'GET' && path === '/api/kb/profiles') {
      const printer = url.searchParams.get('printer') || null;
      const mat = url.searchParams.get('material') || null;
      return sendJson(res, getKbProfiles(printer, mat));
    }
    const kbProfMatch = path.match(/^\/api\/kb\/profiles\/(\d+)$/);
    if (kbProfMatch && method === 'GET') {
      const item = getKbProfile(parseInt(kbProfMatch[1]));
      if (!item) return sendJson(res, { error: 'Not found' }, 404);
      return sendJson(res, item);
    }
    if (method === 'POST' && path === '/api/kb/profiles') {
      return readBody(req, (body) => {
        if (!body.name) return sendJson(res, { error: 'name required' }, 400);
        const id = addKbProfile(body);
        sendJson(res, { ok: true, id }, 201);
      });
    }
    if (kbProfMatch && method === 'PUT') {
      return readBody(req, (body) => { updateKbProfile(parseInt(kbProfMatch[1]), body); sendJson(res, { ok: true }); });
    }
    if (kbProfMatch && method === 'DELETE') {
      deleteKbProfile(parseInt(kbProfMatch[1]));
      return sendJson(res, { ok: true });
    }

    // KB Tags
    if (method === 'GET' && path === '/api/kb/tags') {
      const type = url.searchParams.get('entity_type');
      const eid = parseInt(url.searchParams.get('entity_id'));
      if (!type || isNaN(eid)) return sendJson(res, { error: 'entity_type and entity_id required' }, 400);
      return sendJson(res, getKbTags(type, eid));
    }
    if (method === 'POST' && path === '/api/kb/tags') {
      return readBody(req, (body) => {
        if (!body.entity_type || !body.entity_id || !body.tag) return sendJson(res, { error: 'entity_type, entity_id, tag required' }, 400);
        const id = addKbTag(body.entity_type, body.entity_id, body.tag);
        sendJson(res, { ok: true, id }, 201);
      });
    }
    const kbTagMatch = path.match(/^\/api\/kb\/tags\/(\d+)$/);
    if (kbTagMatch && method === 'DELETE') {
      deleteKbTag(parseInt(kbTagMatch[1]));
      return sendJson(res, { ok: true });
    }

    // ---- Auto-Generated Spool Name ----
    const autoNameMatch = path.match(/^\/api\/inventory\/auto-name\/(\d+)$/);
    if (autoNameMatch && method === 'GET') {
      return sendJson(res, { name: generateSpoolName(parseInt(autoNameMatch[1])) });
    }

    // ---- Hub/Kiosk Settings ----
    if (method === 'GET' && path === '/api/hub/settings') {
      return sendJson(res, {
        hub_mode: getInventorySetting('hub_mode') === '1',
        kiosk_mode: getInventorySetting('kiosk_mode') === '1',
        kiosk_panels: (getInventorySetting('kiosk_panels') || 'dashboard,queue').split(','),
        hub_refresh_interval: parseInt(getInventorySetting('hub_refresh_interval') || '30')
      });
    }

    if (method === 'PUT' && path === '/api/hub/settings') {
      return readBody(req, (body) => {
        if (body.hub_mode !== undefined) setInventorySetting('hub_mode', body.hub_mode ? '1' : '0');
        if (body.kiosk_mode !== undefined) setInventorySetting('kiosk_mode', body.kiosk_mode ? '1' : '0');
        if (body.kiosk_panels !== undefined) setInventorySetting('kiosk_panels', Array.isArray(body.kiosk_panels) ? body.kiosk_panels.join(',') : body.kiosk_panels);
        if (body.hub_refresh_interval !== undefined) setInventorySetting('hub_refresh_interval', String(body.hub_refresh_interval));
        sendJson(res, { ok: true });
      });
    }

    // ---- TOTP 2FA ----
    if (method === 'POST' && path === '/api/auth/totp/setup') {
      return readBody(req, (body) => {
        const secret = _generateTotpSecret(randomBytes(20));
        const user = getSessionUser(req);
        if (!user) return sendJson(res, { error: 'Not authenticated' }, 401);
        updateUser(user.id, { totp_secret: secret });
        const issuer = 'BambuDashboard';
        const otpauth = `otpauth://totp/${issuer}:${encodeURIComponent(user.username)}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
        sendJson(res, { secret, otpauth });
      });
    }

    if (method === 'POST' && path === '/api/auth/totp/verify') {
      return readBody(req, (body) => {
        const user = getSessionUser(req);
        if (!user) return sendJson(res, { error: 'Not authenticated' }, 401);
        if (!body.code) return sendJson(res, { error: 'code required' }, 400);
        const dbUser = getUser(user.id);
        if (!dbUser || !dbUser.totp_secret) return sendJson(res, { error: 'TOTP not set up' }, 400);
        const valid = _verifyTotp(dbUser.totp_secret, body.code);
        if (!valid) return sendJson(res, { error: 'Invalid code' }, 400);
        // Generate backup codes
        const backupCodes = Array.from({ length: 8 }, () => randomBytes(4).toString('hex'));
        updateUser(user.id, { totp_enabled: 1, totp_backup_codes: JSON.stringify(backupCodes) });
        sendJson(res, { ok: true, backup_codes: backupCodes });
      });
    }

    if (method === 'POST' && path === '/api/auth/totp/disable') {
      return readBody(req, (body) => {
        const user = getSessionUser(req);
        if (!user) return sendJson(res, { error: 'Not authenticated' }, 401);
        updateUser(user.id, { totp_enabled: 0, totp_secret: null, totp_backup_codes: null });
        sendJson(res, { ok: true });
      });
    }

    // ---- Staggered Start ----
    if (method === 'POST' && path === '/api/printer-groups/staggered-start') {
      return readBody(req, (body) => {
        if (!body.group_id || !body.filename) return sendJson(res, { error: 'group_id and filename required' }, 400);
        const group = getPrinterGroup(body.group_id);
        if (!group) return sendJson(res, { error: 'Group not found' }, 404);
        const members = getGroupMembers(group.id);
        const delay = group.stagger_delay_s || body.delay_seconds || 30;
        const results = [];
        for (let i = 0; i < members.length; i++) {
          results.push({ printer_id: members[i].printer_id, delay_s: i * delay, start_order: i + 1 });
        }
        sendJson(res, { group: group.name, filename: body.filename, schedule: results });
      });
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

const MAX_BODY_SIZE = 1024 * 1024; // 1 MB

function readBody(req, callback) {
  let body = '';
  let size = 0;
  req.on('data', chunk => {
    size += chunk.length;
    if (size > MAX_BODY_SIZE) {
      req.destroy();
      return;
    }
    body += chunk;
  });
  req.on('end', () => {
    if (size > MAX_BODY_SIZE) return;
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch (e) {
      parsed = {};
    }
    callback(parsed);
  });
}

// Raw body reader (for HMAC signature verification)
function _readRawBody(req, callback) {
  let body = '';
  let size = 0;
  req.on('data', chunk => {
    size += chunk.length;
    if (size > MAX_BODY_SIZE) { req.destroy(); return; }
    body += chunk;
  });
  req.on('end', () => {
    if (size > MAX_BODY_SIZE) return;
    callback(body);
  });
}

// Parse order from different e-commerce platforms
function _parseEcommerceOrder(platform, body) {
  try {
    if (platform === 'shopify') {
      const items = (body.line_items || []).map(li => ({ sku: li.sku || '', name: li.title || li.name || '', quantity: li.quantity || 1, price: parseFloat(li.price) || 0 }));
      const orderTotal = parseFloat(body.total_price) || items.reduce((s, i) => s + i.price * i.quantity, 0);
      return {
        orderId: String(body.order_number || body.id || ''),
        platformOrderId: String(body.id || ''),
        customerName: body.customer ? `${body.customer.first_name || ''} ${body.customer.last_name || ''}`.trim() : (body.email || ''),
        items,
        orderTotal,
        currency: body.currency || 'NOK'
      };
    }
    if (platform === 'woocommerce') {
      const items = (body.line_items || []).map(li => ({ sku: li.sku || '', name: li.name || '', quantity: li.quantity || 1, price: parseFloat(li.total) / (li.quantity || 1) || 0 }));
      const orderTotal = parseFloat(body.total) || items.reduce((s, i) => s + (parseFloat(i.price) * i.quantity), 0);
      return {
        orderId: String(body.number || body.id || ''),
        platformOrderId: String(body.id || ''),
        customerName: body.billing ? `${body.billing.first_name || ''} ${body.billing.last_name || ''}`.trim() : '',
        items,
        orderTotal,
        currency: body.currency || 'NOK'
      };
    }
    // Generic / custom
    const items = (body.items || body.line_items || []).map(li => ({ sku: li.sku || '', name: li.name || li.title || '', quantity: li.quantity || 1, price: parseFloat(li.price) || 0 }));
    const orderTotal = parseFloat(body.total) || parseFloat(body.order_total) || items.reduce((s, i) => s + i.price * i.quantity, 0);
    return {
      orderId: String(body.order_id || body.id || Date.now()),
      platformOrderId: String(body.platform_order_id || body.id || ''),
      customerName: body.customer_name || body.customer || '',
      items,
      orderTotal,
      currency: body.currency || 'NOK'
    };
  } catch { return null; }
}

// ---- SD Card File Operations (FTPS) ----

async function _getFtp() {
  try { return await import('basic-ftp'); } catch { return null; }
}

async function listPrinterFiles(ip, accessCode) {
  const ftp = await _getFtp();
  if (!ftp) throw new Error('basic-ftp not installed');
  const client = new ftp.Client();
  client.ftp.verbose = false;
  try {
    await client.access({ host: ip, port: 990, user: 'bblp', password: accessCode, secure: 'implicit', secureOptions: { rejectUnauthorized: false } });
    const items = [];
    const paths = ['/sdcard/', '/cache/'];
    for (const basePath of paths) {
      try {
        const list = await client.list(basePath);
        for (const item of list) {
          if (item.name.endsWith('.3mf') || item.name.endsWith('.gcode') || item.name.endsWith('.gcode.3mf')) {
            items.push({
              name: item.name,
              path: basePath + item.name,
              size: item.size || 0,
              date: item.modifiedAt ? item.modifiedAt.toISOString() : null,
              type: item.isDirectory ? 'directory' : 'file'
            });
          }
        }
      } catch (_) { /* path might not exist */ }
    }
    return items;
  } finally { client.close(); }
}

async function deletePrinterFile(ip, accessCode, filePath) {
  const ftp = await _getFtp();
  if (!ftp) throw new Error('basic-ftp not installed');
  const client = new ftp.Client();
  client.ftp.verbose = false;
  try {
    await client.access({ host: ip, port: 990, user: 'bblp', password: accessCode, secure: 'implicit', secureOptions: { rejectUnauthorized: false } });
    await client.remove(filePath);
  } finally { client.close(); }
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

    // Extract print settings from instance/profile data
    const printSettings = {};
    if (instance.printProfile) {
      const pp = instance.printProfile;
      if (pp.resolution) printSettings.resolution = pp.resolution;
      if (pp.infill) printSettings.infill = pp.infill;
      if (pp.supports != null) printSettings.supports = pp.supports ? 'Yes' : 'No';
      if (pp.rafts != null) printSettings.rafts = pp.rafts ? 'Yes' : 'No';
    }
    if (json.filamentType) printSettings.filament = json.filamentType;

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
      category: json.categoryName || json.tags?.[0] || null,
      print_settings: Object.keys(printSettings).length ? printSettings : null,
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

function fetchHtml(url, timeout) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml'
      },
      timeout,
      maxHeaderSize: 32768
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchHtml(res.headers.location, timeout).then(resolve, reject);
      }
      if (res.statusCode !== 200) { res.resume(); reject(new Error(`HTTP ${res.statusCode}`)); return; }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// ---- Printables proxy ----

const _printablesCache = new Map();

async function handlePrintablesFetch(id, res) {
  const cached = _printablesCache.get(id);
  if (cached && Date.now() - cached.ts < MW_CACHE_TTL) {
    return sendJson(res, cached.data);
  }

  const url = `https://www.printables.com/model/${id}`;

  try {
    const html = await fetchHtml(url, 8000);

    // OG tags — Printables uses name= instead of property=
    const og = (name) => {
      const m = html.match(new RegExp(`<meta\\s+(?:property|name)=["']og:${name}["']\\s+content=["']([^"']+)["']`, 'i'))
        || html.match(new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+(?:property|name)=["']og:${name}["']`, 'i'));
      return m ? m[1] : null;
    };

    // JSON-LD structured data
    let ld = {};
    const ldMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/s);
    if (ldMatch) { try { ld = JSON.parse(ldMatch[1]); } catch {} }

    const ogTitle = og('title');
    const title = ld.name || (ogTitle ? ogTitle.replace(/\s*\|.*$/, '') : null) || `Printables #${id}`;
    const image = ld.image?.url || og('image') || null;
    const description = (ld.description || og('description') || '').substring(0, 500);

    // Designer from title (pattern: "Title by Designer | ...")
    let designer = null;
    if (ogTitle) {
      const byMatch = ogTitle.match(/by\s+(.+?)\s*\|/i);
      if (byMatch) designer = byMatch[1].trim();
    }

    const printSettings = {};
    if (ld.material) printSettings.filament = ld.material;
    if (ld.weight?.value) printSettings.weight = `${ld.weight.value}${ld.weight.unitCode || 'g'}`;

    const category = null;

    const data = {
      title,
      image,
      description,
      url,
      designer,
      likes: ld.aggregateRating?.ratingCount || 0,
      downloads: 0,
      category,
      print_settings: Object.keys(printSettings).length ? printSettings : null,
      source: 'printables',
      fallback: false
    };

    _printablesCache.set(id, { data, ts: Date.now() });
    sendJson(res, data);
  } catch {
    const fallback = { url, source: 'printables', fallback: true };
    _printablesCache.set(id, { data: fallback, ts: Date.now() });
    sendJson(res, fallback);
  }
}

// ---- Thingiverse proxy ----

const _thingiverseCache = new Map();

async function handleThingiverseFetch(id, res) {
  const cached = _thingiverseCache.get(id);
  if (cached && Date.now() - cached.ts < MW_CACHE_TTL) {
    return sendJson(res, cached.data);
  }

  const url = `https://www.thingiverse.com/thing:${id}`;

  try {
    const apiUrl = `https://api.thingiverse.com/things/${id}`;
    const headers = { 'Accept': 'application/json' };
    if (process.env.THINGIVERSE_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.THINGIVERSE_API_KEY}`;
    }
    const json = await fetchJson(apiUrl, 8000);

    // Extract print settings from Thingiverse details
    const printSettings = {};
    if (json.details_parts) {
      for (const part of (Array.isArray(json.details_parts) ? json.details_parts : [])) {
        if (part.type === 'print_settings' && part.data) {
          for (const [k, v] of Object.entries(part.data)) {
            if (v) printSettings[k] = String(v);
          }
        }
      }
    }
    // Common Thingiverse fields
    if (json.print_settings) {
      const ps = json.print_settings;
      if (ps.printer_brand) printSettings.printer = ps.printer_brand;
      if (ps.printer_model) printSettings.printer_model = ps.printer_model;
      if (ps.rafts) printSettings.rafts = ps.rafts;
      if (ps.supports) printSettings.supports = ps.supports;
      if (ps.resolution) printSettings.resolution = ps.resolution;
      if (ps.infill) printSettings.infill = ps.infill;
      if (ps.filament_brand) printSettings.filament = `${ps.filament_brand} ${ps.filament_color || ''}`.trim();
    }

    const data = {
      title: json.name || `Thingiverse #${id}`,
      image: json.thumbnail || null,
      description: (json.description || '').replace(/<[^>]*>/g, '').substring(0, 500),
      url,
      designer: json.creator?.name || null,
      likes: json.like_count || 0,
      downloads: json.download_count || 0,
      category: json.category?.name || (json.tags?.[0]?.name) || null,
      print_settings: Object.keys(printSettings).length ? printSettings : null,
      source: 'thingiverse',
      fallback: false
    };
    _thingiverseCache.set(id, { data, ts: Date.now() });
    sendJson(res, data);
  } catch {
    // Fallback: scrape OG meta
    try {
      const html = await fetchHtml(url, 8000);
      const og = (name) => {
        const m = html.match(new RegExp(`<meta\\s+property=["']og:${name}["']\\s+content=["']([^"']+)["']`, 'i'));
        return m ? m[1] : null;
      };
      const data = {
        title: og('title') || `Thingiverse #${id}`,
        image: og('image') || null,
        url,
        designer: null,
        likes: 0,
        downloads: 0,
        source: 'thingiverse',
        fallback: true
      };
      _thingiverseCache.set(id, { data, ts: Date.now() });
      sendJson(res, data);
    } catch {
      const fallback = { url, source: 'thingiverse', fallback: true };
      _thingiverseCache.set(id, { data: fallback, ts: Date.now() });
      sendJson(res, fallback);
    }
  }
}

// ---- Model Search ----

async function handleModelSearch(query, source, res) {
  const encodedQuery = encodeURIComponent(query);
  const searches = [];

  if (source === 'all' || source === 'makerworld') {
    searches.push(searchMakerWorld(encodedQuery).catch(() => []));
  }
  if (source === 'all' || source === 'printables') {
    searches.push(searchPrintables(encodedQuery).catch(() => []));
  }
  if (source === 'all' || source === 'thingiverse') {
    searches.push(searchThingiverse(encodedQuery).catch(() => []));
  }

  const results = (await Promise.all(searches)).flat();
  sendJson(res, results);
}

async function searchMakerWorld(query) {
  try {
    const json = await fetchJson(`https://api.bambulab.com/v1/design-service/design/search?keyword=${query}&limit=5`, 8000);
    if (json.code && json.code !== 200) return []; // API error
    const hits = json.hits || json.designs || [];
    return hits.slice(0, 5).map(d => ({
      source: 'makerworld',
      source_id: String(d.id || d.designId),
      title: d.titleTranslated || d.title || 'Untitled',
      image: d.coverUrl || d.cover || null,
      url: `https://makerworld.com/en/models/${d.id || d.designId}`,
      designer: d.designCreator?.name || null,
      likes: d.likeCount || 0,
      downloads: d.downloadCount || 0
    }));
  } catch { return []; }
}

async function searchPrintables(query) {
  try {
    const html = await fetchHtml(`https://www.printables.com/search/models?q=${query}`, 8000);

    // Build image map: model ID → thumbnail URL
    const imgMap = {};
    const imgRegex = /https:\/\/media\.printables\.com\/media\/prints\/(\d+)\/images\/[^"'\s]+thumbs\/inside\/320x240\/[^"'\s]+/g;
    let im;
    while ((im = imgRegex.exec(html)) !== null) {
      if (!imgMap[im[1]]) imgMap[im[1]] = im[0];
    }

    const results = [];
    const regex = /href="\/model\/(\d+)-([^"]+)"/g;
    let match;
    while ((match = regex.exec(html)) !== null && results.length < 5) {
      const id = match[1];
      const slug = match[2].replace(/-/g, ' ');
      if (!results.find(r => r.source_id === id)) {
        results.push({
          source: 'printables',
          source_id: id,
          title: slug.charAt(0).toUpperCase() + slug.slice(1),
          image: imgMap[id] || null,
          url: `https://www.printables.com/model/${id}`,
          designer: null,
          likes: 0,
          downloads: 0
        });
      }
    }
    return results;
  } catch { return []; }
}

async function searchThingiverse(query) {
  try {
    const json = await fetchJson(`https://api.thingiverse.com/search/${query}?type=things&per_page=5`, 8000);
    const hits = json.hits || [];
    return hits.slice(0, 5).map(d => ({
      source: 'thingiverse',
      source_id: String(d.id),
      title: d.name || 'Untitled',
      image: d.thumbnail || null,
      url: `https://www.thingiverse.com/thing:${d.id}`,
      designer: d.creator?.name || null,
      likes: d.like_count || 0,
      downloads: d.download_count || 0
    }));
  } catch { return []; }
}

// ---- TOTP Helpers ----

function _generateTotpSecret(buffer) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const byte of buffer) bits += byte.toString(2).padStart(8, '0');
  let secret = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) secret += alphabet[parseInt(bits.substring(i, i + 5), 2)];
  return secret;
}

function _verifyTotp(secret, code, window = 1) {
  const epoch = Math.floor(Date.now() / 1000);
  // Decode base32 secret
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const c of secret.toUpperCase()) {
    const idx = alphabet.indexOf(c);
    if (idx >= 0) bits += idx.toString(2).padStart(5, '0');
  }
  const keyBytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) keyBytes.push(parseInt(bits.substring(i, i + 8), 2));
  const key = Buffer.from(keyBytes);

  for (let i = -window; i <= window; i++) {
    const counter = Math.floor(epoch / 30) + i;
    const buf = Buffer.alloc(8);
    buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
    buf.writeUInt32BE(counter & 0xFFFFFFFF, 4);
    const h = createHmac('sha1', key).update(buf).digest();
    const offset = h[h.length - 1] & 0x0F;
    const otp = ((h[offset] & 0x7F) << 24 | h[offset + 1] << 16 | h[offset + 2] << 8 | h[offset + 3]) % 1000000;
    if (String(otp).padStart(6, '0') === String(code).padStart(6, '0')) return true;
  }
  return false;
}

// ---- Webhook Dispatcher ----

async function _dispatchWebhook(whConfig, payload, deliveryId) {
  const url = new URL(whConfig.url);
  const isHttps = url.protocol === 'https:';
  const reqModule = isHttps ? (await import('node:https')).default : (await import('node:http')).default;

  const headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'User-Agent': 'BambuDashboard-Webhook/1.0',
    ...(typeof whConfig.headers === 'string' ? JSON.parse(whConfig.headers) : (whConfig.headers || {}))
  };

  if (whConfig.secret) {
    headers['X-Webhook-Signature'] = 'sha256=' + createHmac('sha256', whConfig.secret).update(payload).digest('hex');
  }

  return new Promise((resolve) => {
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers,
      rejectUnauthorized: true
    };

    const req = reqModule.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const success = res.statusCode >= 200 && res.statusCode < 300;
        try {
          updateWebhookDelivery(deliveryId, {
            status: success ? 'sent' : 'failed',
            attempts: 1,
            last_attempt: new Date().toISOString(),
            response_code: res.statusCode,
            response_body: data.substring(0, 500)
          });
        } catch (_) {}
        resolve(success);
      });
    });

    req.on('error', (err) => {
      try {
        updateWebhookDelivery(deliveryId, {
          status: 'failed',
          attempts: 1,
          last_attempt: new Date().toISOString(),
          response_body: err.message
        });
      } catch (_) {}
      resolve(false);
    });

    req.setTimeout(10000, () => { req.destroy(); });
    req.write(payload);
    req.end();
  });
}

// Dispatch webhooks for notification events
export function dispatchWebhooksForEvent(eventType, title, message, data) {
  try {
    const webhooks = getActiveWebhooks();
    for (const wh of webhooks) {
      const events = typeof wh.events === 'string' ? JSON.parse(wh.events) : (wh.events || []);
      if (events.length > 0 && !events.includes(eventType) && !events.includes('*')) continue;

      let payload;
      if (wh.template === 'discord') {
        const colors = { print_started: 3447003, print_finished: 3066993, print_failed: 15158332, print_cancelled: 15844367, printer_error: 15158332, test: 10181046 };
        payload = JSON.stringify({
          embeds: [{ title, description: message, color: colors[eventType] || 9807270, timestamp: new Date().toISOString(), footer: { text: 'Bambu Dashboard' } }]
        });
      } else if (wh.template === 'slack') {
        payload = JSON.stringify({
          text: `*${title}*\n${message}`
        });
      } else {
        payload = JSON.stringify({
          event: eventType, title, message,
          timestamp: new Date().toISOString(),
          data: data || {}
        });
      }

      const deliveryId = addWebhookDelivery({ webhook_id: wh.id, event_type: eventType, payload, status: 'pending' });
      _dispatchWebhook(wh, payload, deliveryId).catch(() => {});
    }
  } catch (e) {
    console.error('[webhook] Dispatch error:', e.message);
  }
}
