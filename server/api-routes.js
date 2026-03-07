import { getHistory, getHistoryById, addHistory, getStatistics, getFilament, addFilament, updateFilament, deleteFilament, getErrors, acknowledgeError, deleteError, acknowledgeAllErrors, getPrinters, addPrinter, updatePrinter, deletePrinter, addWaste, deleteWaste, getWasteStats, getWasteHistory, getMaintenanceStatus, addMaintenanceEvent, getMaintenanceLog, getMaintenanceSchedule, upsertMaintenanceSchedule, getActiveNozzleSession, retireNozzleSession, createNozzleSession, getTelemetry, getComponentWear, getFirmwareHistory, getXcamEvents, getXcamStats, getAmsTrayLifetime, getDemoPrinterIds, purgeDemoData, getNotificationLog, getUpdateHistory, getModelLink, setModelLink, deleteModelLink, getRecentModelLinks, getVendors, addVendor, updateVendor, deleteVendor, getFilamentProfiles, getFilamentProfile, addFilamentProfile, updateFilamentProfile, deleteFilamentProfile, getSpools, getSpool, addSpool, updateSpool, deleteSpool, archiveSpool, useSpoolWeight, assignSpoolToSlot, getSpoolUsageLog, getLocations, addLocation, updateLocation, deleteLocation, getInventoryStats, searchSpools, duplicateSpool, measureSpoolWeight, getAllSpoolsForExport, getAllFilamentProfilesForExport, getAllVendorsForExport, findSimilarColors, getDistinctMaterials, getDistinctLotNumbers, getDistinctArticleNumbers, getInventorySetting, setInventorySetting, getAllInventorySettings, importSpools, importFilamentProfiles, importVendors, getFieldSchemas, addFieldSchema, deleteFieldSchema, lengthToWeight, getDryingSessions, getActiveDryingSessions, startDryingSession, completeDryingSession, deleteDryingSession, getDryingPresets, getDryingPreset, upsertDryingPreset, deleteDryingPreset, getSpoolsDryingStatus, getUsagePredictions, getRestockSuggestions, estimatePrintCost, createQueue, getQueues, getQueue, updateQueue, deleteQueue, addQueueItem, getQueueItem, updateQueueItem, deleteQueueItem, reorderQueueItems, getActiveQueueItems, addQueueLog, getQueueLog, getNextPendingItem, getTags, createTag, updateTag, deleteTag, assignTag, unassignTag, getEntityTags, getEntitiesByTag, getNfcMappings, lookupNfcTag, linkNfcTag, unlinkNfcTag, updateNfcScan, checkoutSpool, checkinSpool, getCheckedOutSpools, getCheckoutLog, addSpoolEvent, getSpoolTimeline, getSpoolPrintStats, estimateFilamentFromHistory, backfillFilamentUsage, syncSpoolWeightsFromLog, getRecentSpoolEvents, bulkDeleteSpools, bulkArchiveSpools, bulkRelocateSpools, bulkMarkDried, bulkEditSpools, bulkAssignTag, bulkUnassignTag, bulkDeleteProfiles, bulkEditProfiles, bulkDeleteVendors, bulkStartDrying, getSpoolsForExportByIds, toggleSpoolFavorite, batchAddSpools, createSharedPalette, getSharedPalette, deleteSharedPalette, getSharedPaletteSpools, getMacros, getMacro, addMacro, updateMacro, deleteMacro, getWebhookConfigs, getWebhookConfig, addWebhookConfig, updateWebhookConfig, deleteWebhookConfig, getActiveWebhooks, addWebhookDelivery, updateWebhookDelivery, getWebhookDeliveries, savePrintCost, getPrintCost, getCostReport, getCostSummary, getCostStatistics, estimatePrintCostAdvanced, getMaterials, getMaterial, getMaterialByName, updateMaterial, addMaterial, getHardwareItems, getHardwareItem, addHardwareItem, updateHardwareItem, deleteHardwareItem, assignHardware, unassignHardware, getHardwareForPrinter, getHardwareAssignments, getRoles, getRole, addRole, updateRole, deleteRole, getUsers, getUser, addUser, updateUser, deleteUser, getApiKeys, addApiKey, deleteApiKey, deactivateApiKey, getEcommerceConfigs, getEcommerceConfig, addEcommerceConfig, updateEcommerceConfig, deleteEcommerceConfig, getEcommerceOrders, getEcommerceOrder, addEcommerceOrder, updateEcommerceOrder, getTimelapseRecordings, getTimelapseRecording, deleteTimelapseRecording, getPushSubscriptions, addPushSubscription, deletePushSubscription, getCommunityFilaments, getCommunityFilament, searchCommunityByColor, getCommunityManufacturers, getCommunityMaterials, addCommunityFilament, updateCommunityFilament, deleteCommunityFilament, getCommunityFilamentStats, getOwnedCommunityIds, upsertCommunityFilament, clearCommunityFilaments, getCommunityFilamentCategories, getBrandDefaults, getBrandDefault, upsertBrandDefault, deleteBrandDefault, getCustomFieldDefs, getCustomFieldDef, addCustomFieldDef, updateCustomFieldDef, deleteCustomFieldDef, getCustomFieldValues, setCustomFieldValue, deleteCustomFieldValues, getPrinterGroups, getPrinterGroup, addPrinterGroup, updatePrinterGroup, deletePrinterGroup, addPrinterToGroup, removePrinterFromGroup, getGroupMembers, getPrinterGroupsForPrinter, getProjects, getProject, addProject, updateProject, deleteProject, getProjectPrints, addProjectPrint, updateProjectPrint, deleteProjectPrint, getExportTemplates, getExportTemplate, addExportTemplate, deleteExportTemplate, getUserQuota, upsertUserQuota, addUserTransaction, getUserTransactions, getFailureDetections, getFailureDetection, addFailureDetection, acknowledgeFailureDetection, deleteFailureDetection, getPriceHistory, addPriceEntry, getLowestPrice, getPriceStats, getPriceAlerts, getPriceAlert, addPriceAlert, updatePriceAlert, deletePriceAlert, checkPriceAlerts, triggerPriceAlert, getBuildPlates, getBuildPlate, addBuildPlate, updateBuildPlate, deleteBuildPlate, incrementBuildPlatePrintCount, getDryerModels, getDryerModel, addDryerModel, updateDryerModel, deleteDryerModel, getStorageConditions, getLatestStorageCondition, addStorageCondition, deleteStorageCondition, getCourses, getCourse, addCourse, updateCourse, deleteCourse, getCourseProgress, upsertCourseProgress, getUserCourseProgress, getAllCoursesWithProgress, searchSpoolsByColor, generateSpoolName, getEcomFees, getEcomFeesSummary, getEcomFeesTotal, getKbPrinters, getKbPrinter, addKbPrinter, updateKbPrinter, deleteKbPrinter, getKbAccessories, getKbAccessory, addKbAccessory, updateKbAccessory, deleteKbAccessory, getKbFilaments, getKbFilament, addKbFilament, updateKbFilament, deleteKbFilament, getKbProfiles, getKbProfile, addKbProfile, updateKbProfile, deleteKbProfile, searchKb, getKbStats, getKbTags, addKbTag, deleteKbTag, seedKbData, addBedMesh, getBedMeshHistory, getLatestBedMesh, deleteBedMesh, createFilamentChange, updateFilamentChange, getActiveFilamentChange, getFilamentChangeHistory, shareFilamentProfile, rateCommunityFilament, getCommunityFilamentRatings, submitTdVote, getTdVotes, importCommunityToInventory, mergeSpools, getFifoSpool, getCompatibilityMatrix, addCompatibilityRule, updateCompatibilityRule, deleteCompatibilityRule, getTemperatureGuide, matchPrinterForFilament, autoTrashEmptySpools, getRecentProfiles, getLocationAlerts, getSpoolBySlot, addLayerPause, getLayerPauses, getActiveLayerPauses, deleteLayerPause, deactivateLayerPauses, refillSpool, recalculateAllCosts, getHardwareStats, deduplicateHmsErrors } from './database.js';
import { createBackup, listBackups } from './backup.js';
import { saveConfig, config } from './config.js';
import { getThumbnail, getModel } from './thumbnail-service.js';
import { lookupHmsCode, getHmsWikiUrl } from './print-tracker.js';
import { parse3mf, parseGcode } from './file-parser.js';
import https from 'node:https';
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import { readFileSync, existsSync, statSync, createReadStream, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isAuthEnabled, isMultiUser, validateCredentials, createSession, destroySession, getSessionToken, validateSession, hashPassword, validateApiKey, generateApiKey, hasPermission, validateCredentialsDB, getSessionUser, requirePermission } from './auth.js';
import { getSlicerStatus, getSlicerProfiles, saveUploadedFile, sliceFile, uploadToPrinter, cleanupJob, getJobFilePath } from './slicer-service.js';
import { buildPauseCommand, buildResumeCommand, buildGcodeMultiLine, buildFilamentUnloadSequence, buildFilamentLoadSequence, buildAmsTrayChangeCommand } from './mqtt-commands.js';
import { getSlicerJobs as dbGetSlicerJobs, getSlicerJob as dbGetSlicerJob, deleteSlicerJob as dbDeleteSlicerJob, getSlicerJobByFilename } from './database.js';
import { readFileSync as _readPkg } from 'node:fs';

// API version from package.json
const _pkgVersion = (() => { try { return JSON.parse(_readPkg(join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json'), 'utf-8')).version; } catch { return '0.0.0'; } })();

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

// ---- General API rate limiter ----
const API_RATE_MAX = 200;           // max requests per window
const API_RATE_WINDOW_MS = 60_000;  // 1 minute window
const _apiRates = new Map();        // ip -> { count, windowStart }

function checkApiRate(ip) {
  const now = Date.now();
  const entry = _apiRates.get(ip);
  if (!entry || now - entry.windowStart > API_RATE_WINDOW_MS) {
    _apiRates.set(ip, { count: 1, windowStart: now });
    return true;
  }
  entry.count++;
  return entry.count <= API_RATE_MAX;
}

function getApiRateHeaders(ip) {
  const entry = _apiRates.get(ip);
  if (!entry) return { 'X-RateLimit-Limit': API_RATE_MAX, 'X-RateLimit-Remaining': API_RATE_MAX };
  const remaining = Math.max(0, API_RATE_MAX - entry.count);
  const reset = Math.ceil((entry.windowStart + API_RATE_WINDOW_MS - Date.now()) / 1000);
  return { 'X-RateLimit-Limit': API_RATE_MAX, 'X-RateLimit-Remaining': remaining, 'X-RateLimit-Reset': Math.max(0, reset) };
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of _apiRates) {
    if (now - entry.windowStart > API_RATE_WINDOW_MS) _apiRates.delete(ip);
  }
}, 60_000);

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
let _printerManager = null;
let _failureDetector = null;
let _discovery = null;
let _testMqttConnection = null;
let _bambuCloud = null;

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

// ---- Permission enforcement ----

// Map route patterns to required permissions for write operations
// GET routes require 'view' (all roles have this). Write routes are gated by category.
function getRoutePermission(method, path) {
  if (method === 'GET') return 'view';

  // Admin-only routes
  if (path.startsWith('/api/users') || path.startsWith('/api/roles') || path.startsWith('/api/keys')) return 'admin';
  if (path === '/api/auth/config' || path.startsWith('/api/auth/totp')) return 'admin';
  if (path === '/api/community-filaments/seed' || path === '/api/kb/seed') return 'admin';
  if (path === '/api/update/apply') return 'admin';
  if (path === '/api/demo') return 'admin';
  if (path === '/api/hub/settings') return 'admin';

  // Print routes
  if (path.match(/^\/api\/printers\/[^/]+\/files\/print$/)) return 'print';
  if (path === '/api/printer-groups/staggered-start') return 'print';
  if (path.startsWith('/api/slicer/')) return 'print';

  // Queue routes
  if (path.startsWith('/api/queue')) return 'queue';

  // Control routes (printer management, maintenance, protection)
  if (path.startsWith('/api/discovery')) return 'admin';
  if (path.startsWith('/api/bambu-cloud')) return 'admin';
  if (path === '/api/printers' && method === 'POST') return 'admin';
  if (path.match(/^\/api\/printers\/[^/]+$/) && (method === 'PUT' || method === 'DELETE')) return 'controls';
  if (path.startsWith('/api/maintenance') || path.startsWith('/api/protection')) return 'controls';
  if (path === '/api/waste') return 'controls';
  if (path.match(/^\/api\/printers\/[^/]+\/files/)) return 'controls';

  // Filament/inventory routes
  if (path.startsWith('/api/filament') || path.startsWith('/api/inventory')) return 'filament';
  if (path.startsWith('/api/community-filaments')) return 'filament';
  if (path.startsWith('/api/brand-defaults') || path.startsWith('/api/custom-fields')) return 'filament';
  if (path.startsWith('/api/price-history') || path.startsWith('/api/price-alerts') || path.startsWith('/api/build-plates')) return 'filament';
  if (path.startsWith('/api/dryer-models') || path.startsWith('/api/storage-conditions')) return 'filament';
  if (path.startsWith('/api/tags') || path.startsWith('/api/nfc')) return 'filament';
  if (path.startsWith('/api/palette')) return 'filament';
  if (path.startsWith('/api/spoolman')) return 'filament';

  // Macro routes
  if (path.startsWith('/api/macros')) return 'macros';

  // Config routes (notifications, webhooks, hardware, materials, groups, ecommerce)
  if (path.startsWith('/api/notifications') || path.startsWith('/api/webhooks')) return 'admin';
  if (path.startsWith('/api/hardware') || path.startsWith('/api/materials')) return 'admin';
  if (path.startsWith('/api/printer-groups')) return 'admin';
  if (path.startsWith('/api/ecommerce')) return 'admin';
  if (path.startsWith('/api/export')) return 'admin';
  if (path.startsWith('/api/courses') || path.startsWith('/api/kb')) return 'admin';
  if (path === '/api/backup') return 'admin';
  if (path.startsWith('/api/timelapse') && method === 'DELETE') return 'admin';
  if (path.startsWith('/api/model-link')) return 'controls';

  // Push subscriptions — allow for all authenticated users
  if (path.startsWith('/api/push')) return 'view';

  // Default: require view for GET, admin for everything else
  return method === 'GET' ? 'view' : 'admin';
}

function requirePerm(req, res, permission) {
  if (!requirePermission(req, permission)) {
    sendJson(res, { error: 'Forbidden', required: permission }, 403);
    return false;
  }
  return true;
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

export function setPrinterManager(pm) {
  _printerManager = pm;
}

export function setFailureDetector(fd) {
  _failureDetector = fd;
}

export function setDiscovery(discovery, testFn) {
  _discovery = discovery;
  _testMqttConnection = testFn;
}

export function setBambuCloud(cloud) {
  _bambuCloud = cloud;
}

function _mapCloudStatus(task) {
  const s = task.status;
  if (s == null) return null;
  // Cloud uses failedType to indicate actual failure
  if (task.failedType && task.failedType > 0) return 'failed';
  // Status 0 = in progress, skip
  if (s === 0) return null;
  // Status 2+ with endTime = completed print
  if (s >= 1 && task.endTime) return 'completed';
  return null;
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
      let user = null;
      if (authenticated && token) {
        const session = getSessionUser(token);
        if (session) {
          user = {
            username: session.username,
            displayName: session.displayName || session.username,
            roleName: session.roleName || 'admin',
            permissions: session.permissions || ['*']
          };
        }
      }
      return sendJson(res, { enabled, authenticated, requiresUsername, user });
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
        // Try DB-backed auth first (returns user object with role/permissions)
        const dbUser = validateCredentialsDB(username, password);
        if (dbUser) {
          const token = createSession(dbUser);
          const maxAge = (config.auth?.sessionDurationHours || 24) * 3600;
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Set-Cookie': `bambu_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`
          });
          return res.end(JSON.stringify({ ok: true }));
        }
        // Fall back to config-based auth (legacy single-user, gets full admin permissions)
        if (!validateCredentials(password, username)) {
          return sendJson(res, { error: 'Invalid credentials' }, 401);
        }
        const token = createSession({ username: username || 'admin', permissions: ['*'] });
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

  // General API rate limiting
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (!checkApiRate(clientIp)) {
    const headers = getApiRateHeaders(clientIp);
    res.writeHead(429, { 'Content-Type': 'application/json', ...headers });
    res.end(JSON.stringify({ error: 'Too many requests', retry_after: headers['X-RateLimit-Reset'] }));
    return;
  }
  // Attach rate limit headers to response
  const rateHeaders = getApiRateHeaders(clientIp);
  for (const [k, v] of Object.entries(rateHeaders)) res.setHeader(k, v);

  // Centralized permission check for all API routes
  if (isAuthEnabled()) {
    const perm = getRoutePermission(method, path);
    if (!requirePerm(req, res, perm)) return;
  }

  try {
    // ---- API Documentation ----
    if (method === 'GET' && path === '/api/docs') {
      return sendJson(res, _getApiDocs());
    }

    // ---- Printers ----
    // ---- Printer Discovery ----
    if (method === 'GET' && path === '/api/discovery/scan') {
      if (!_discovery) return sendJson(res, { error: 'Discovery not available' }, 503);
      try {
        const found = await _discovery.scan();
        const existing = getPrinters().map(p => p.serial);
        const printers = found.map(p => ({
          ...p,
          alreadyAdded: existing.includes(p.serial)
        }));
        return sendJson(res, { printers, total: found.length });
      } catch (e) {
        return sendJson(res, { error: e.message }, 500);
      }
    }

    if (method === 'GET' && path === '/api/discovery/status') {
      if (!_discovery) return sendJson(res, { scanning: false, printers: [] });
      return sendJson(res, { scanning: _discovery.isScanning(), printers: _discovery.getCached() });
    }

    if (method === 'POST' && path === '/api/discovery/test') {
      if (!_testMqttConnection) return sendJson(res, { error: 'Test not available' }, 503);
      return readBody(req, async (body) => {
        const { ip, serial, accessCode } = body;
        if (!ip || !accessCode) return sendJson(res, { error: 'ip and accessCode required' }, 400);
        try {
          const result = await _testMqttConnection(ip, serial || '', accessCode);
          sendJson(res, result);
        } catch (e) {
          sendJson(res, { ok: false, error: e.message });
        }
      });
    }

    // ---- Bambu Lab Cloud ----
    if (method === 'GET' && path === '/api/bambu-cloud/status') {
      if (!_bambuCloud) return sendJson(res, { authenticated: false });
      return sendJson(res, _bambuCloud.getStatus());
    }

    if (method === 'POST' && path === '/api/bambu-cloud/login') {
      if (!_bambuCloud) return sendJson(res, { error: 'Cloud not available' }, 503);
      return readBody(req, async (body) => {
        const { email, password } = body;
        if (!email || !password) return sendJson(res, { error: 'Email and password required' }, 400);
        try {
          const result = await _bambuCloud.login(email, password);
          sendJson(res, result);
        } catch (e) {
          sendJson(res, { error: e.message }, 401);
        }
      });
    }

    if (method === 'POST' && path === '/api/bambu-cloud/verify') {
      if (!_bambuCloud) return sendJson(res, { error: 'Cloud not available' }, 503);
      return readBody(req, async (body) => {
        const { email, code } = body;
        if (!email || !code) return sendJson(res, { error: 'Email and code required' }, 400);
        try {
          const result = await _bambuCloud.verify(email, code);
          sendJson(res, result);
        } catch (e) {
          sendJson(res, { error: e.message }, 401);
        }
      });
    }

    if (method === 'GET' && path === '/api/bambu-cloud/printers') {
      if (!_bambuCloud) return sendJson(res, { error: 'Cloud not available' }, 503);
      if (!_bambuCloud.isAuthenticated()) return sendJson(res, { error: 'Not authenticated' }, 401);
      try {
        // Fetch cloud printers and run SSDP scan in parallel
        const [cloudPrinters, localPrinters] = await Promise.all([
          _bambuCloud.getPrinters(),
          _discovery ? _discovery.scan(3000) : []
        ]);
        // Build serial→IP lookup from SSDP results
        const localBySerial = new Map();
        for (const lp of localPrinters) localBySerial.set(lp.serial, lp);

        const existing = getPrinters().map(p => p.serial);
        const printers = cloudPrinters.map(p => {
          const local = localBySerial.get(p.serial);
          return {
            ...p,
            ip: local?.ip || p.ip || '',
            localModel: local?.model || '',
            alreadyAdded: existing.includes(p.serial)
          };
        });
        sendJson(res, { printers });
      } catch (e) {
        sendJson(res, { error: e.message }, 500);
      }
      return;
    }

    if (method === 'GET' && path === '/api/bambu-cloud/tasks') {
      if (!_bambuCloud || !_bambuCloud.isAuthenticated()) return sendJson(res, { error: 'Not authenticated' }, 401);
      try {
        const tasks = await _bambuCloud.getTaskHistory();
        return sendJson(res, { tasks, count: tasks.length });
      } catch (e) {
        return sendJson(res, { error: e.message }, 500);
      }
    }

    if (method === 'POST' && path === '/api/bambu-cloud/import-history') {
      if (!_bambuCloud || !_bambuCloud.isAuthenticated()) return sendJson(res, { error: 'Not authenticated' }, 401);
      try {
        const tasks = await _bambuCloud.getTaskHistory();
        const imported = [];
        for (const task of tasks) {
          const designName = task.designTitle || '';
          const taskTitle = task.title || '';
          const filename = designName && taskTitle && designName !== taskTitle
            ? `${designName} — ${taskTitle}` : designName || taskTitle || task.name || 'Unknown';
          const status = _mapCloudStatus(task);
          if (!status) continue;

          // Check for duplicates by cloud task id or filename + startTime
          const devId = task.deviceId || task.dev_id || '';
          const existingPrinter = getPrinters().find(p => p.serial === devId);
          const printerId = existingPrinter?.id || null;
          const existing = getHistory(100, 0, printerId);
          const startTime = task.startTime || task.start_time;
          const startDate = startTime ? new Date(typeof startTime === 'number' ? startTime * 1000 : startTime).toISOString() : new Date().toISOString();
          if (existing.some(h => h.started_at === startDate || (h.filename === filename && h.notes?.includes('Cloud')))) continue;

          const endTime = task.endTime || task.end_time;
          const endDate = endTime ? new Date(typeof endTime === 'number' ? endTime * 1000 : endTime).toISOString() : startDate;
          const duration = task.costTime || null;

          // Extract filament info from AMS mapping
          const ams0 = task.amsDetailMapping?.[0];
          const filamentColor = ams0?.sourceColor?.substring(0, 6) || null;

          const record = {
            printer_id: printerId,
            started_at: startDate,
            finished_at: endDate,
            filename,
            status,
            duration_seconds: duration,
            filament_used_g: task.weight ? parseFloat(task.weight) : null,
            filament_type: ams0?.filamentType || null,
            filament_color: filamentColor,
            layer_count: null,
            notes: 'Imported from Bambu Lab Cloud',
            color_changes: task.amsDetailMapping?.length > 1 ? task.amsDetailMapping.length - 1 : 0,
            waste_g: 0,
            nozzle_type: null,
            nozzle_diameter: null,
            speed_level: null,
            bed_target: null,
            nozzle_target: null,
            max_nozzle_temp: null,
            max_bed_temp: null,
            filament_brand: null,
            ams_units_used: task.amsDetailMapping?.length || null,
            tray_id: ams0 ? String(ams0.slotId) : null
          };

          try {
            addHistory(record);
            imported.push({ filename, status, printer_id: printerId, started_at: startDate });
          } catch (e) {
            console.error('[cloud-import] Failed to add:', filename, e.message);
          }
        }
        return sendJson(res, { ok: true, imported, count: imported.length }, 201);
      } catch (e) {
        return sendJson(res, { error: e.message }, 500);
      }
    }

    if (method === 'POST' && path === '/api/bambu-cloud/logout') {
      if (_bambuCloud) _bambuCloud.logout();
      return sendJson(res, { ok: true });
    }

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
      const format = url.searchParams.get('format') || 'csv';
      const rows = getHistory(10000, 0, printerId);

      if (format === 'json') {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': 'attachment; filename="print-history.json"'
        });
        res.end(JSON.stringify(rows, null, 2));
        return;
      }

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
      const from = url.searchParams.get('from') || null;
      const to = url.searchParams.get('to') || null;
      return sendJson(res, getStatistics(printerId, from, to));
    }

    if (method === 'GET' && path === '/api/statistics/costs') {
      const printerId = url.searchParams.get('printer_id') || null;
      const from = url.searchParams.get('from') || null;
      const to = url.searchParams.get('to') || null;
      return sendJson(res, getCostStatistics(printerId, from, to));
    }

    if (method === 'POST' && path === '/api/statistics/costs/recalculate') {
      const result = recalculateAllCosts();
      return sendJson(res, result);
    }

    if (method === 'GET' && path === '/api/statistics/hardware') {
      const printerId = url.searchParams.get('printer_id') || null;
      return sendJson(res, getHardwareStats(printerId));
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

    if (method === 'DELETE' && path.startsWith('/api/waste/')) {
      const id = parseInt(path.split('/')[3]);
      if (!id) return sendJson(res, { error: 'Invalid id' }, 400);
      deleteWaste(id);
      return sendJson(res, { ok: true });
    }

    if (method === 'GET' && path === '/api/waste/export') {
      const printerId = url.searchParams.get('printer_id') || null;
      const stats = getWasteStats(printerId);
      const rows = stats.recent || [];
      let csv = 'Date,Printer,Weight (g),Color Changes,Type,Notes\n';
      for (const r of rows) {
        const date = r.timestamp || '';
        const printer = (r.printer_id || '').replace(/"/g, '""');
        const notes = (r.notes || '').replace(/"/g, '""');
        csv += `"${date}","${printer}",${r.waste_g},${r.color_changes || 0},"${r.reason}","${notes}"\n`;
      }
      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="waste-export.csv"'
      });
      res.end(csv);
      return;
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
    if (method === 'POST' && path === '/api/errors/deduplicate-hms') {
      const removed = deduplicateHmsErrors();
      return sendJson(res, { ok: true, removed });
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

    // ---- Cloud image proxy (locally cached thumbnails) ----
    const cloudImgMatch = path.match(/^\/api\/cloud-image\/(\d+)$/);
    if (cloudImgMatch && method === 'GET') {
      const imgPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'thumbnails', `${cloudImgMatch[1]}.png`);
      if (existsSync(imgPath)) {
        res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' });
        return createReadStream(imgPath).pipe(res);
      }
      return sendJson(res, { error: 'Not found' }, 404);
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

    // ---- History thumbnail ----
    const histThumbMatch = path.match(/^\/api\/history\/(\d+)\/thumbnail$/);
    if (histThumbMatch && method === 'GET') {
      const histId = histThumbMatch[1];
      const thumbDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'history-thumbnails');
      // Try cached file first (PNG then SVG)
      for (const ext of ['png', 'svg']) {
        const thumbPath = join(thumbDir, `${histId}.${ext}`);
        if (existsSync(thumbPath)) {
          const ct = ext === 'svg' ? 'image/svg+xml' : 'image/png';
          res.writeHead(200, { 'Content-Type': ct, 'Cache-Control': 'public, max-age=86400' });
          return createReadStream(thumbPath).pipe(res);
        }
      }
      // On-demand: try Bambu Cloud tasks (cover images), then FTPS
      try {
        const row = getHistoryById(parseInt(histId));
        if (row) {
          // 1) Try Bambu Cloud task matching by title/filename
          if (_bambuCloud && _bambuCloud.isAuthenticated()) {
            try {
              const tasks = await _bambuCloud.getTaskHistory();
              const taskList = tasks.tasks || tasks;
              if (Array.isArray(taskList)) {
                const fn = (row.filename || '').toLowerCase().trim();
                const match = taskList.find(t => {
                  const tt = (t.title || '').toLowerCase().trim();
                  const dt = (t.designTitle || '').toLowerCase().trim();
                  return tt === fn || dt === fn || fn.includes(tt) || fn.includes(dt) || tt.includes(fn) || dt.includes(fn);
                });
                if (match && match.cover) {
                  // Download cover image and cache it
                  const imgBuf = await new Promise((resolve) => {
                    https.get(match.cover, { timeout: 10000 }, (imgRes) => {
                      if (imgRes.statusCode !== 200) { imgRes.resume(); return resolve(null); }
                      const chunks = [];
                      imgRes.on('data', c => chunks.push(c));
                      imgRes.on('end', () => resolve(Buffer.concat(chunks)));
                      imgRes.on('error', () => resolve(null));
                    }).on('error', () => resolve(null));
                  });
                  if (imgBuf && imgBuf.length > 100) {
                    try { mkdirSync(thumbDir, { recursive: true }); writeFileSync(join(thumbDir, `${histId}.png`), imgBuf); } catch {}
                    res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': imgBuf.length, 'Cache-Control': 'public, max-age=86400' });
                    res.end(imgBuf);
                    return;
                  }
                }
              }
            } catch (e) {
              console.warn('[api] Cloud thumb fetch error:', e.message);
            }
          }

          // 2) Fallback: try FTPS from printer
          const printers = getPrinters();
          const printer = printers.find(p => p.id === row.printer_id);
          const ac = printer?.accessCode || printer?.access_code;
          if (printer && printer.ip && ac) {
            const { fetchHistoryThumbnail } = await import('./thumbnail-service.js');
            const candidates = [];
            if (row.gcode_file) candidates.push(row.gcode_file);
            if (row.filename) {
              const base = row.filename.replace(/\.(3mf|gcode)$/i, '');
              candidates.push(`/sdcard/${base}.gcode`);
              candidates.push(`/cache/${base}.gcode`);
            }
            for (const gcodePath of candidates) {
              try {
                const png = await fetchHistoryThumbnail(printer.ip, ac, gcodePath);
                if (png) {
                  try { mkdirSync(thumbDir, { recursive: true }); writeFileSync(join(thumbDir, `${histId}.png`), png); } catch {}
                  res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': png.length, 'Cache-Control': 'public, max-age=86400' });
                  res.end(png);
                  return;
                }
              } catch {}
            }
          }
        }
      } catch (e) {
        console.warn('[api] History thumb error:', e.message);
      }
      res.writeHead(404);
      res.end();
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
      if (url.searchParams.get('tag_id')) filters.tag_id = parseInt(url.searchParams.get('tag_id'));
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
        if (body.used_weight_g_add) {
          const addG = parseFloat(body.used_weight_g_add);
          if (addG > 0) useSpoolWeight(parseInt(spoolMatch[1]), addG, 'manual');
          delete body.used_weight_g_add;
          if (Object.keys(body).length === 0) { _broadcastInventory('updated', 'spool', { id: parseInt(spoolMatch[1]) }); return sendJson(res, { ok: true }); }
        }
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
    const spoolRefillMatch = path.match(/^\/api\/inventory\/spools\/(\d+)\/refill$/);
    if (spoolRefillMatch && method === 'POST') {
      return readBody(req, (body) => {
        const newWeight = parseFloat(body.new_weight_g);
        if (!newWeight || newWeight <= 0) return sendJson(res, { error: 'new_weight_g required (positive number)' }, 400);
        const result = refillSpool(parseInt(spoolRefillMatch[1]), newWeight);
        if (!result) return sendJson(res, { error: 'Spool not found' }, 404);
        _broadcastInventory('refilled', 'spool', { id: parseInt(spoolRefillMatch[1]) });
        sendJson(res, result);
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

    const spoolFavMatch = path.match(/^\/api\/inventory\/spools\/(\d+)\/favorite$/);
    if (spoolFavMatch && method === 'POST') {
      const id = parseInt(spoolFavMatch[1]);
      const isFavorite = toggleSpoolFavorite(id);
      _broadcastInventory('updated', 'spool', { id });
      return sendJson(res, { ok: true, is_favorite: isFavorite });
    }

    if (method === 'POST' && path === '/api/inventory/spools/batch-add') {
      return readBody(req, (body) => {
        const count = Math.min(Math.max(parseInt(body.count) || 1, 1), 50);
        const data = { ...body };
        delete data.count;
        const ids = batchAddSpools(data, count);
        _broadcastInventory('created', 'spool', { ids });
        return sendJson(res, { ok: true, ids, count: ids.length }, 201);
      });
    }

    // ---- Import spools from AMS ----
    if (method === 'POST' && path === '/api/inventory/import-ams') {
      const imported = [];
      if (!_printerManager) return sendJson(res, { error: 'No printer manager' }, 500);

      for (const [printerId, entry] of _printerManager.printers) {
        if (!entry.live || !entry.client) continue;
        const state = entry.client.state;
        const amsData = state?.ams;
        if (!amsData?.ams) continue;

        for (const unit of amsData.ams) {
          const trays = unit.tray;
          if (!trays) continue;
          for (const tray of trays) {
            if (!tray || !tray.tray_type) continue;
            const amsUnit = parseInt(unit.id) || 0;
            const trayId = parseInt(tray.id) || 0;

            // If spool already linked to this slot, just ensure NFC tag is linked
            const existing = getSpoolBySlot(printerId, amsUnit, trayId);
            if (existing) {
              const tagUid = tray.tag_uid;
              if (tagUid && tagUid !== '0000000000000000') {
                const nfcEntry = lookupNfcTag(tagUid);
                if (!nfcEntry) {
                  linkNfcTag(tagUid, existing.id, 'bambu', JSON.stringify({
                    tray_uuid: tray.tray_uuid || null,
                    tray_id_name: tray.tray_id_name || null,
                    source: 'ams-import'
                  }));
                  imported.push({
                    spool_id: existing.id, printer_id: printerId, ams_unit: amsUnit,
                    tray_id: trayId, material: tray.tray_type, color: tray.tray_color?.substring(0, 6),
                    tag_uid: tagUid, nfc_linked: true, remain_pct: tray.remain
                  });
                }
              }
              continue;
            }

            // Find or create vendor "Bambu Lab"
            let vendors = getVendors();
            let vendor = vendors.find(v => v.name === 'Bambu Lab');
            if (!vendor) {
              vendor = addVendor({ name: 'Bambu Lab', website: 'https://bambulab.com' });
            }

            // Color hex (strip alpha)
            const colorHex = tray.tray_color ? tray.tray_color.substring(0, 6) : null;
            const brand = tray.tray_sub_brands || tray.tray_type;
            const profileName = `${brand}${colorHex ? '' : ''}`;

            // Find or create filament profile
            const profiles = getFilamentProfiles();
            let profile = profiles.find(p =>
              p.vendor_id === vendor.id &&
              p.material === tray.tray_type &&
              p.color_hex?.toLowerCase() === colorHex?.toLowerCase()
            );
            if (!profile) {
              profile = addFilamentProfile({
                vendor_id: vendor.id,
                name: profileName,
                material: tray.tray_type,
                color_name: tray.tray_id_name || null,
                color_hex: colorHex,
                diameter: tray.tray_diameter ? parseFloat(tray.tray_diameter) : 1.75,
                spool_weight_g: tray.tray_weight ? parseInt(tray.tray_weight) : 1000,
                nozzle_temp_min: tray.nozzle_temp_min ? parseInt(tray.nozzle_temp_min) : null,
                nozzle_temp_max: tray.nozzle_temp_max ? parseInt(tray.nozzle_temp_max) : null
              });
            }

            // Create spool
            const initialWeight = tray.tray_weight ? parseInt(tray.tray_weight) : 1000;
            const remainPct = tray.remain >= 0 ? tray.remain : 100;
            const remainWeight = Math.round(initialWeight * remainPct / 100);

            const spool = addSpool({
              filament_profile_id: profile.id,
              initial_weight_g: initialWeight,
              remaining_weight_g: remainWeight,
              used_weight_g: initialWeight - remainWeight,
              printer_id: printerId,
              ams_unit: amsUnit,
              ams_tray: trayId,
              comment: `Imported from AMS${amsUnit + 1} slot ${trayId + 1}`
            });

            // Link NFC/RFID tag if present on the spool
            const tagUid = tray.tag_uid;
            if (tagUid && tagUid !== '0000000000000000') {
              linkNfcTag(tagUid, spool.id, 'bambu', JSON.stringify({
                tray_uuid: tray.tray_uuid || null,
                tray_id_name: tray.tray_id_name || null,
                source: 'ams-import'
              }));
            }

            imported.push({
              spool_id: spool.id,
              printer_id: printerId,
              ams_unit: amsUnit,
              tray_id: trayId,
              material: tray.tray_type,
              color: colorHex,
              brand: brand,
              tag_uid: tagUid || null,
              remain_pct: remainPct
            });
          }
        }
      }

      if (imported.length > 0) _broadcastInventory('created', 'spool', { count: imported.length });
      return sendJson(res, { ok: true, imported, count: imported.length }, 201);
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

    // ---- Filament Matching ----
    if (method === 'GET' && path === '/api/inventory/match-printer') {
      const material = url.searchParams.get('material');
      const colorHex = url.searchParams.get('color_hex');
      const minWeight = parseFloat(url.searchParams.get('min_weight_g') || '0');
      return sendJson(res, matchPrinterForFilament(material, colorHex, minWeight));
    }

    // ---- Temperature Guide ----
    if (method === 'GET' && path === '/api/inventory/temperature-guide') {
      return sendJson(res, getTemperatureGuide());
    }

    // ---- Filament Compatibility Matrix ----
    if (method === 'GET' && path === '/api/inventory/compatibility') {
      const material = url.searchParams.get('material');
      return sendJson(res, getCompatibilityMatrix(material || null));
    }
    const compatMatch = path.match(/^\/api\/inventory\/compatibility\/(\d+)$/);
    if (method === 'POST' && path === '/api/inventory/compatibility') {
      return readBody(req, (body) => {
        if (!body.material) return sendJson(res, { error: 'material required' }, 400);
        const result = addCompatibilityRule(body);
        sendJson(res, result, 201);
      });
    }
    if (compatMatch && method === 'PUT') {
      return readBody(req, (body) => {
        if (!body.material) return sendJson(res, { error: 'material required' }, 400);
        updateCompatibilityRule(parseInt(compatMatch[1]), body);
        sendJson(res, { ok: true });
      });
    }
    if (compatMatch && method === 'DELETE') {
      deleteCompatibilityRule(parseInt(compatMatch[1]));
      return sendJson(res, { ok: true });
    }

    // ---- Inventory: FIFO Spool Suggestion ----
    if (method === 'GET' && path === '/api/inventory/spools/fifo') {
      const material = url.searchParams.get('material');
      const colorHex = url.searchParams.get('color_hex');
      const profileId = url.searchParams.get('profile_id') ? parseInt(url.searchParams.get('profile_id')) : null;
      return sendJson(res, getFifoSpool(material, colorHex, profileId));
    }

    // ---- Inventory: Duplicate Spool ----
    const spoolDuplicateMatch = path.match(/^\/api\/inventory\/spools\/(\d+)\/duplicate$/);
    if (spoolDuplicateMatch && method === 'POST') {
      const result = duplicateSpool(parseInt(spoolDuplicateMatch[1]));
      if (!result) return sendJson(res, { error: 'Not found' }, 404);
      return sendJson(res, result, 201);
    }

    // ---- Inventory: Merge Spools ----
    if (method === 'POST' && path === '/api/inventory/spools/merge') {
      return readBody(req, (body) => {
        if (!body.target_id || !Array.isArray(body.source_ids) || body.source_ids.length === 0) {
          return sendJson(res, { error: 'target_id and source_ids[] required' }, 400);
        }
        const targetId = Number(body.target_id);
        const sourceIds = body.source_ids.map(Number).filter(id => id !== targetId);
        if (sourceIds.length === 0) return sendJson(res, { error: 'source_ids must differ from target_id' }, 400);
        const result = mergeSpools(targetId, sourceIds, body.actor || null);
        if (!result) return sendJson(res, { error: 'Target spool not found' }, 404);
        _broadcastInventory('spool_merged', { target_id: targetId, source_ids: sourceIds });
        sendJson(res, result);
      });
    }

    // ---- Inventory: Measure Weight ----
    const spoolMeasureMatch = path.match(/^\/api\/inventory\/spools\/(\d+)\/measure$/);
    if (spoolMeasureMatch && method === 'POST') {
      return readBody(req, (body) => {
        if (!body.gross_weight_g || body.gross_weight_g <= 0) return sendJson(res, { error: 'gross_weight_g required' }, 400);
        const spoolId = parseInt(spoolMeasureMatch[1]);
        const result = measureSpoolWeight(spoolId, body.gross_weight_g);
        if (!result) return sendJson(res, { error: 'Not found' }, 404);
        if (_broadcastFn) _broadcastFn('spool_weight_synced', { spoolId, weight: result.net_filament_g, source: 'manual_measure' });
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
          color_name: spool.color_name || '',
          color_hex: spool.color_hex || '',
          weight: spool.initial_weight_g,
          spool_weight_g: spool.initial_weight_g,
          remaining_weight_g: spool.remaining_weight_g,
          lot_number: spool.lot_number || '',
          article_number: spool.article_number || '',
          short_id: spool.short_id || ''
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

    if (method === 'GET' && path === '/api/inventory/restock') {
      const days = parseInt(url.searchParams.get('days') || '30');
      return sendJson(res, getRestockSuggestions(days));
    }

    // ---- Inventory: Cost Estimate ----
    if (method === 'GET' && path === '/api/inventory/cost-estimate') {
      const filamentG = parseFloat(url.searchParams.get('filament_g') || '0');
      const durationS = parseInt(url.searchParams.get('duration_s') || '0');
      const spoolId = url.searchParams.get('spool_id') ? parseInt(url.searchParams.get('spool_id')) : null;
      const printerId = url.searchParams.get('printer_id') || null;
      return sendJson(res, estimatePrintCost(filamentG, durationS, spoolId, printerId));
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
          // Auto-fill estimates from slicer_jobs if not provided
          if (!body.estimated_filament_g || !body.estimated_duration_s) {
            const slicerJob = getSlicerJobByFilename(body.filename);
            if (slicerJob) {
              if (!body.estimated_filament_g && slicerJob.estimated_filament_g) body.estimated_filament_g = slicerJob.estimated_filament_g;
              if (!body.estimated_duration_s && slicerJob.estimated_time_s) body.estimated_duration_s = slicerJob.estimated_time_s;
            }
          }
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

    const tagIdMatch = path.match(/^\/api\/tags\/(\d+)$/);
    if (tagIdMatch && method === 'PUT') {
      return readBody(req, (body) => {
        if (!body.name) return sendJson(res, { error: 'Name required' }, 400);
        try {
          updateTag(parseInt(tagIdMatch[1]), body.name, body.category, body.color);
          return sendJson(res, { ok: true });
        } catch (e) {
          return sendJson(res, { error: 'Tag name already exists' }, 409);
        }
      });
    }

    if (tagIdMatch && method === 'DELETE') {
      deleteTag(parseInt(tagIdMatch[1]));
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

    // Auto-AMS: scan NFC tag and auto-assign spool to AMS slot
    if (method === 'POST' && path === '/api/nfc/scan') {
      return readBody(req, (body) => {
        if (!body.tag_uid) return sendJson(res, { error: 'tag_uid required' }, 400);
        const mapping = lookupNfcTag(body.tag_uid);
        if (!mapping) return sendJson(res, { error: 'Unknown NFC tag', tag_uid: body.tag_uid }, 404);
        updateNfcScan(body.tag_uid);
        const result = { spool_id: mapping.spool_id, spool_name: mapping.spool_name, material: mapping.material, color_hex: mapping.color_hex, vendor_name: mapping.vendor_name };
        // Auto-assign to AMS slot if printer_id and slot info provided
        if (body.printer_id && body.ams_unit != null && body.ams_tray != null) {
          assignSpoolToSlot(mapping.spool_id, body.printer_id, body.ams_unit, body.ams_tray);
          result.assigned = true;
          result.printer_id = body.printer_id;
          result.ams_unit = body.ams_unit;
          result.ams_tray = body.ams_tray;
          if (_broadcastFn) _broadcastFn('spool_assigned', { spool_id: mapping.spool_id, printer_id: body.printer_id, ams_unit: body.ams_unit, ams_tray: body.ams_tray });
        }
        return sendJson(res, result);
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

    const printStatsMatch = path.match(/^\/api\/inventory\/spools\/(\d+)\/print-stats$/);
    if (printStatsMatch && method === 'GET') {
      const stats = getSpoolPrintStats(parseInt(printStatsMatch[1]));
      if (!stats) return sendJson(res, { error: 'Spool not found' }, 404);
      return sendJson(res, stats);
    }

    if (method === 'GET' && path === '/api/inventory/estimate-usage') {
      return sendJson(res, estimateFilamentFromHistory());
    }

    if (method === 'POST' && path === '/api/inventory/backfill-usage') {
      const result = backfillFilamentUsage();
      // Auto-sync spool weights from log after backfill
      const synced = syncSpoolWeightsFromLog();
      result.synced_spools = synced;
      return sendJson(res, result);
    }

    if (method === 'POST' && path === '/api/inventory/sync-weights') {
      return sendJson(res, syncSpoolWeightsFromLog());
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
          case 'edit':
            if (!body.fields || typeof body.fields !== 'object') return sendJson(res, { error: 'fields object required' }, 400);
            bulkEditSpools(ids, body.fields);
            break;
          case 'tag': {
            if (!body.tag_id) return sendJson(res, { error: 'tag_id required' }, 400);
            const tagAction = body.tag_action || 'assign';
            if (tagAction === 'unassign') bulkUnassignTag(body.tag_id, 'spool', ids);
            else bulkAssignTag(body.tag_id, 'spool', ids);
            break;
          }
          case 'start_drying': {
            const sessionIds = bulkStartDrying(ids, {
              temperature: body.temperature, duration_minutes: body.duration_minutes,
              method: body.method, notes: body.notes
            });
            return sendJson(res, { ok: true, count: ids.length, session_ids: sessionIds });
          }
          case 'export': {
            const spools = getSpoolsForExportByIds(ids);
            const format = body.format || 'json';
            if (format === 'csv') {
              if (spools.length === 0) return sendJson(res, { error: 'No spools found' }, 404);
              const keys = Object.keys(spools[0]);
              const csv = [keys.join(','), ...spools.map(s => keys.map(k => {
                const v = s[k]; return v == null ? '' : typeof v === 'string' && (v.includes(',') || v.includes('"')) ? `"${v.replace(/"/g, '""')}"` : v;
              }).join(','))].join('\n');
              res.writeHead(200, { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="spools-export.csv"' });
              return res.end(csv);
            }
            return sendJson(res, spools);
          }
          default: return sendJson(res, { error: 'Unknown action: ' + body.action }, 400);
        }
        _broadcastInventory('bulk_update', { entity: 'spool', action: body.action, count: ids.length });
        return sendJson(res, { ok: true, count: ids.length });
      });
    }

    // Bulk profile operations
    if (method === 'POST' && path === '/api/inventory/profiles/bulk') {
      return readBody(req, (body) => {
        if (!body.action || !Array.isArray(body.profile_ids) || body.profile_ids.length === 0) {
          return sendJson(res, { error: 'action and profile_ids[] required' }, 400);
        }
        const ids = body.profile_ids.map(Number);
        switch (body.action) {
          case 'delete': bulkDeleteProfiles(ids); break;
          case 'edit':
            if (!body.fields || typeof body.fields !== 'object') return sendJson(res, { error: 'fields object required' }, 400);
            bulkEditProfiles(ids, body.fields);
            break;
          default: return sendJson(res, { error: 'Unknown action: ' + body.action }, 400);
        }
        _broadcastInventory('bulk_update', { entity: 'profile', action: body.action, count: ids.length });
        return sendJson(res, { ok: true, count: ids.length });
      });
    }

    // Bulk vendor operations
    if (method === 'POST' && path === '/api/inventory/vendors/bulk') {
      return readBody(req, (body) => {
        if (!body.action || !Array.isArray(body.vendor_ids) || body.vendor_ids.length === 0) {
          return sendJson(res, { error: 'action and vendor_ids[] required' }, 400);
        }
        const ids = body.vendor_ids.map(Number);
        switch (body.action) {
          case 'delete':
            try { bulkDeleteVendors(ids); } catch (e) { return sendJson(res, { error: e.message }, 409); }
            break;
          default: return sendJson(res, { error: 'Unknown action: ' + body.action }, 400);
        }
        _broadcastInventory('bulk_update', { entity: 'vendor', action: body.action, count: ids.length });
        return sendJson(res, { ok: true, count: ids.length });
      });
    }

    // Bulk tag assignment
    if (method === 'POST' && path === '/api/tags/bulk-assign') {
      return readBody(req, (body) => {
        if (!body.tag_id || !body.entity_type || !Array.isArray(body.entity_ids) || body.entity_ids.length === 0) {
          return sendJson(res, { error: 'tag_id, entity_type, and entity_ids[] required' }, 400);
        }
        const ids = body.entity_ids.map(Number);
        const action = body.action || 'assign';
        const count = action === 'unassign'
          ? bulkUnassignTag(body.tag_id, body.entity_type, ids)
          : bulkAssignTag(body.tag_id, body.entity_type, ids);
        return sendJson(res, { ok: true, count });
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

    // ---- Shared Palettes ----
    if (method === 'POST' && path === '/api/inventory/palette/share') {
      return readBody(req, (body) => {
        const token = createSharedPalette(body.title, body.filters);
        return sendJson(res, { ok: true, token, url: `/palette/${token}` }, 201);
      });
    }
    const paletteMatch = path.match(/^\/api\/palette\/([a-z0-9]+)$/);
    if (paletteMatch && method === 'GET') {
      const palette = getSharedPalette(paletteMatch[1]);
      if (!palette) return sendJson(res, { error: 'Not found' }, 404);
      const filters = palette.filters ? JSON.parse(palette.filters) : {};
      const spools = getSharedPaletteSpools(filters);
      return sendJson(res, { palette, spools });
    }
    if (paletteMatch && method === 'DELETE') {
      deleteSharedPalette(paletteMatch[1]);
      return sendJson(res, { ok: true });
    }
    const paletteHtmlMatch = path.match(/^\/palette\/([a-z0-9]+)$/);
    if (paletteHtmlMatch && method === 'GET') {
      const palette = getSharedPalette(paletteHtmlMatch[1]);
      if (!palette) { res.writeHead(404); return res.end('Palette not found'); }
      const filters = palette.filters ? JSON.parse(palette.filters) : {};
      const spools = getSharedPaletteSpools(filters);
      const grouped = {};
      for (const s of spools) {
        const mat = s.material || 'Other';
        if (!grouped[mat]) grouped[mat] = [];
        grouped[mat].push(s);
      }
      let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <title>${palette.title || 'Filament Palette'}</title>
        <style>
          body{font-family:system-ui,sans-serif;margin:0;padding:20px;background:#1a1a2e;color:#e0e0e0}
          h1{font-size:1.4rem;margin:0 0 16px}h2{font-size:1rem;margin:16px 0 8px;color:#888}
          .palette-grid{display:flex;flex-wrap:wrap;gap:8px}
          .swatch{width:60px;height:60px;border-radius:8px;display:flex;align-items:flex-end;justify-content:center;font-size:0.6rem;padding:4px;text-shadow:0 1px 2px rgba(0,0,0,.8);border:1px solid rgba(255,255,255,.1)}
          .meta{font-size:0.75rem;color:#888;margin-top:16px}
        </style></head><body>
        <h1>${palette.title || 'Filament Palette'}</h1>`;
      for (const [mat, items] of Object.entries(grouped)) {
        html += `<h2>${mat} (${items.length})</h2><div class="palette-grid">`;
        for (const s of items) {
          const hex = s.color_hex || '#666';
          html += `<div class="swatch" style="background:${hex}" title="${s.profile_name || ''} — ${s.vendor_name || ''}">${s.color_name || ''}</div>`;
        }
        html += '</div>';
      }
      html += `<p class="meta">Shared from Bambu Dashboard · ${spools.length} colors · Viewed ${palette.view_count} times</p></body></html>`;
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
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

    // ---- Cloud Slicer ----
    if (method === 'GET' && path === '/api/slicer/status') {
      return sendJson(res, getSlicerStatus());
    }

    if (method === 'GET' && path === '/api/slicer/profiles') {
      return sendJson(res, getSlicerProfiles());
    }

    if (method === 'GET' && path === '/api/slicer/jobs') {
      const limit = parseInt(url.searchParams.get('limit')) || 50;
      return sendJson(res, dbGetSlicerJobs(limit));
    }

    const slicerJobMatch = path.match(/^\/api\/slicer\/jobs\/(\d+)$/);
    if (slicerJobMatch && method === 'GET') {
      const job = dbGetSlicerJob(parseInt(slicerJobMatch[1]));
      if (!job) return sendJson(res, { error: 'Job not found' }, 404);
      return sendJson(res, job);
    }

    if (slicerJobMatch && method === 'DELETE') {
      const id = parseInt(slicerJobMatch[1]);
      cleanupJob(id);
      dbDeleteSlicerJob(id);
      return sendJson(res, { ok: true });
    }

    // Upload file (binary body, filename in query param)
    if (method === 'POST' && path === '/api/slicer/upload') {
      const filename = url.searchParams.get('filename');
      const printerId = url.searchParams.get('printer_id') || null;
      const autoQueue = url.searchParams.get('auto_queue') === '1';
      const quality = url.searchParams.get('quality') || null;
      const profile = url.searchParams.get('profile') || null;
      if (!filename) return sendJson(res, { error: 'filename query param required' }, 400);
      return readBinaryBody(req, (buffer) => {
        try {
          const result = saveUploadedFile(filename, buffer, printerId, autoQueue);
          sendJson(res, result, 201);
          // Auto-slice if needed
          if (result.needsSlicing) {
            sliceFile(result.jobId, { quality, profile }).catch(e => console.error('[slicer] Slice failed:', e.message));
          }
        } catch (e) { sendJson(res, { error: e.message }, 500); }
      });
    }

    // Trigger slicing for a pending job
    const sliceMatch = path.match(/^\/api\/slicer\/jobs\/(\d+)\/slice$/);
    if (sliceMatch && method === 'POST') {
      return readBody(req, async (body) => {
        const id = parseInt(sliceMatch[1]);
        try {
          const result = await sliceFile(id, { quality: body.quality, profile: body.profile, layerHeight: body.layer_height });
          return sendJson(res, result);
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      });
    }

    // Upload sliced file to printer via FTPS
    const uploadMatch = path.match(/^\/api\/slicer\/jobs\/(\d+)\/upload-to-printer$/);
    if (uploadMatch && method === 'POST') {
      return readBody(req, async (body) => {
        const id = parseInt(uploadMatch[1]);
        const printerId = body.printer_id;
        if (!printerId) return sendJson(res, { error: 'printer_id required' }, 400);
        const printer = getPrinters().find(p => p.id === printerId);
        if (!printer || !printer.ip || !printer.accessCode) return sendJson(res, { error: 'Printer not found or no access code' }, 400);
        try {
          const result = await uploadToPrinter(id, printer.ip, printer.accessCode);
          sendJson(res, result);
        } catch (e) { sendJson(res, { error: e.message }, 500); }
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
        const result = estimatePrintCostAdvanced(body.filament_g || 0, body.duration_seconds || 0, body.spool_id || null, body.printer_id || null);
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
      if (url.searchParams.get('material_type')) filters.material_type = url.searchParams.get('material_type');
      if (url.searchParams.get('category')) filters.category = url.searchParams.get('category');
      if (url.searchParams.get('search')) filters.search = url.searchParams.get('search');
      if (url.searchParams.get('has_k_value')) filters.has_k_value = true;
      if (url.searchParams.get('has_td')) filters.has_td = true;
      if (url.searchParams.get('temp_min')) filters.temp_min = parseInt(url.searchParams.get('temp_min'));
      if (url.searchParams.get('temp_max')) filters.temp_max = parseInt(url.searchParams.get('temp_max'));
      if (url.searchParams.get('sort')) filters.sort = url.searchParams.get('sort');
      if (url.searchParams.get('sort_dir')) filters.sort_dir = url.searchParams.get('sort_dir');
      if (url.searchParams.get('limit')) filters.limit = parseInt(url.searchParams.get('limit'));
      if (url.searchParams.get('offset')) filters.offset = parseInt(url.searchParams.get('offset'));
      const result = getCommunityFilaments(filters);
      const owned_ids = getOwnedCommunityIds();
      if (result.rows) { result.owned_ids = owned_ids; } else { return sendJson(res, { rows: result, total: result.length, owned_ids }); }
      return sendJson(res, result);
    }

    if (method === 'GET' && path === '/api/community-filaments/stats') {
      return sendJson(res, getCommunityFilamentStats());
    }

    if (method === 'GET' && path === '/api/community-filaments/categories') {
      return sendJson(res, getCommunityFilamentCategories());
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

    if (method === 'POST' && path === '/api/community-filaments/import-to-inventory') {
      return readBody(req, (body) => {
        const cf = getCommunityFilament(body.id);
        if (!cf) return sendJson(res, { error: 'Not found' }, 404);
        let vendorId = null;
        if (cf.manufacturer) {
          const existing = getVendors().find(v => v.name.toLowerCase() === cf.manufacturer.toLowerCase());
          vendorId = existing ? existing.id : addVendor({ name: cf.manufacturer }).id;
        }
        const profile = addFilamentProfile({
          vendor_id: vendorId,
          name: cf.name || `${cf.manufacturer} ${cf.material}`,
          material: cf.material,
          color_name: cf.color_name,
          color_hex: cf.color_hex,
          density: cf.density || 1.24,
          diameter: cf.diameter || 1.75,
          spool_weight_g: cf.weight || 1000,
          nozzle_temp_min: cf.extruder_temp ? cf.extruder_temp - 10 : null,
          nozzle_temp_max: cf.extruder_temp,
          bed_temp_min: cf.bed_temp ? cf.bed_temp - 10 : null,
          bed_temp_max: cf.bed_temp,
          pressure_advance_k: cf.pressure_advance_k,
          max_volumetric_speed: cf.max_volumetric_speed,
          retraction_distance: cf.retraction_distance,
          retraction_speed: cf.retraction_speed,
          cooling_fan_speed: cf.fan_speed_max,
          transmission_distance: cf.td_value,
          price: cf.price
        });
        if (body.create_spool) {
          addSpool({ filament_profile_id: profile.id, initial_weight_g: cf.weight || 1000, remaining_weight_g: cf.weight || 1000, cost: cf.price });
        }
        sendJson(res, { ok: true, profile_id: profile.id, vendor_id: vendorId }, 201);
      });
    }

    if (method === 'POST' && path === '/api/community-filaments/seed') {
      return readBody(req, async (body) => {
        try {
          const { seedFilamentDatabase } = await import('./seed-filament-db.js');
          const result = await seedFilamentDatabase();
          sendJson(res, result);
        } catch (e) {
          sendJson(res, { error: e.message }, 500);
        }
      });
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

    // ---- Slicer Profile Export ----
    const slicerExportMatch = path.match(/^\/api\/inventory\/filaments\/(\d+)\/slicer-export$/);
    if (slicerExportMatch && method === 'GET') {
      const profile = getFilamentProfile(parseInt(slicerExportMatch[1]));
      if (!profile) return sendJson(res, { error: 'Not found' }, 404);
      const format = url.searchParams.get('format') || 'orcaslicer';
      const name = `${profile.vendor_name || 'Custom'} ${profile.name} ${profile.material}`.trim();
      if (format === 'prusaslicer') {
        const ini = [
          `# PrusaSlicer filament profile`,
          `# Generated by Bambu Dashboard`,
          `[filament:${name}]`,
          `filament_type = ${profile.material}`,
          `filament_colour = #${(profile.color_hex || 'FFFFFF').replace('#', '')}`,
          `filament_density = ${profile.density || 1.24}`,
          `filament_diameter = ${profile.diameter || 1.75}`,
          `filament_cost = ${profile.price || 0}`,
          `filament_spool_weight = ${profile.spool_weight_g || 0}`,
          profile.nozzle_temp_min ? `temperature = ${profile.nozzle_temp_max || profile.nozzle_temp_min}` : '',
          profile.nozzle_temp_min ? `first_layer_temperature = ${profile.nozzle_temp_min}` : '',
          profile.bed_temp_min ? `bed_temperature = ${profile.bed_temp_max || profile.bed_temp_min}` : '',
          profile.bed_temp_min ? `first_layer_bed_temperature = ${profile.bed_temp_min}` : '',
          profile.retraction_distance ? `retract_length = ${profile.retraction_distance}` : '',
          profile.retraction_speed ? `retract_speed = ${profile.retraction_speed}` : '',
          profile.cooling_fan_speed != null ? `max_fan_speed = ${profile.cooling_fan_speed}` : '',
          profile.pressure_advance_k ? `pressure_advance = ${profile.pressure_advance_k}` : '',
          profile.max_volumetric_speed ? `filament_max_volumetric_speed = ${profile.max_volumetric_speed}` : '',
        ].filter(Boolean).join('\n');
        res.writeHead(200, { 'Content-Type': 'text/plain', 'Content-Disposition': `attachment; filename="${name.replace(/[^a-zA-Z0-9 _-]/g, '')}.ini"` });
        return res.end(ini);
      }
      // OrcaSlicer JSON format
      const orca = {
        type: 'filament',
        name: name,
        from: 'Bambu Dashboard',
        filament_id: [String(profile.id)],
        setting_id: '',
        filament_type: [profile.material],
        filament_colour: [`#${(profile.color_hex || 'FFFFFF').replace('#', '')}`],
        filament_density: [String(profile.density || 1.24)],
        filament_diameter: [String(profile.diameter || 1.75)],
        filament_cost: [String(profile.price || 0)],
        nozzle_temperature: [String(profile.nozzle_temp_max || profile.nozzle_temp_min || 200)],
        nozzle_temperature_initial_layer: [String(profile.nozzle_temp_min || 200)],
        bed_temperature: [String(profile.bed_temp_max || profile.bed_temp_min || 60)],
        bed_temperature_initial_layer: [String(profile.bed_temp_min || 60)],
        filament_max_volumetric_speed: [String(profile.max_volumetric_speed || 0)],
        filament_retraction_length: profile.retraction_distance ? [String(profile.retraction_distance)] : undefined,
        filament_retraction_speed: profile.retraction_speed ? [String(profile.retraction_speed)] : undefined,
        fan_max_speed: profile.cooling_fan_speed != null ? [String(profile.cooling_fan_speed)] : undefined,
        pressure_advance: profile.pressure_advance_k ? [String(profile.pressure_advance_k)] : undefined,
      };
      Object.keys(orca).forEach(k => orca[k] === undefined && delete orca[k]);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="${name.replace(/[^a-zA-Z0-9 _-]/g, '')}.json"` });
      return res.end(JSON.stringify(orca, null, 2));
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
          // Check for triggered price alerts
          const triggered = checkPriceAlerts();
          for (const alert of triggered) {
            triggerPriceAlert(alert.id);
            if (_notifier) {
              _notifier.notify('filament_low_stock', {
                title: `Price drop: ${alert.profile_name}`,
                message: `${alert.profile_name} (${alert.material}) dropped to ${alert.latest_price} ${alert.currency || ''} — target was ${alert.target_price}`,
                printerName: 'Price Alert'
              });
            }
          }
          sendJson(res, { ok: true, id, alerts_triggered: triggered.length }, 201);
        } catch (e) { sendJson(res, { error: e.message }, 400); }
      });
    }

    const phStatsMatch = path.match(/^\/api\/price-history\/(\d+)\/stats$/);
    if (phStatsMatch && method === 'GET') {
      return sendJson(res, getPriceStats(parseInt(phStatsMatch[1])) || {});
    }

    // ---- Price Alerts ----
    if (method === 'GET' && path === '/api/price-alerts') {
      return sendJson(res, getPriceAlerts());
    }

    if (method === 'POST' && path === '/api/price-alerts') {
      return readBody(req, (body) => {
        if (!body.filament_profile_id || !body.target_price) return sendJson(res, { error: 'filament_profile_id and target_price required' }, 400);
        const id = addPriceAlert(body);
        return sendJson(res, { ok: true, id }, 201);
      });
    }

    const paMatch = path.match(/^\/api\/price-alerts\/(\d+)$/);
    if (paMatch && method === 'PUT') {
      return readBody(req, (body) => {
        updatePriceAlert(parseInt(paMatch[1]), body);
        return sendJson(res, { ok: true });
      });
    }

    if (paMatch && method === 'DELETE') {
      deletePriceAlert(parseInt(paMatch[1]));
      return sendJson(res, { ok: true });
    }

    // ---- Hex Color Search ----
    if (method === 'GET' && path === '/api/inventory/color-search') {
      const hex = (url.searchParams.get('hex') || '').replace('#', '');
      const tolerance = parseInt(url.searchParams.get('tolerance') || '30');
      if (!hex || hex.length < 6) return sendJson(res, { error: 'hex parameter required (6 chars)' }, 400);
      return sendJson(res, searchSpoolsByColor(hex, tolerance));
    }

    // ---- Auto-trash empty spools ----
    if (method === 'POST' && path === '/api/inventory/auto-trash') {
      if (!hasPermission(sessionUser, 'filament')) return sendJson(res, { error: 'Forbidden' }, 403);
      const deleted = autoTrashEmptySpools();
      return sendJson(res, { deleted });
    }

    // ---- Recent profiles (for quick-create) ----
    if (method === 'GET' && path === '/api/inventory/recent-profiles') {
      const limit = parseInt(url.searchParams.get('limit') || '5');
      return sendJson(res, getRecentProfiles(limit));
    }

    // ---- Location alerts ----
    if (method === 'GET' && path === '/api/inventory/location-alerts') {
      return sendJson(res, getLocationAlerts());
    }

    // ---- Bambu Lab store link ----
    if (method === 'GET' && path === '/api/inventory/store-link') {
      const material = url.searchParams.get('material') || '';
      const color = url.searchParams.get('color') || '';
      const searchQuery = [material, color].filter(Boolean).join(' ');
      return sendJson(res, {
        bambu_store: `https://store.bambulab.com/collections/filament?q=${encodeURIComponent(searchQuery)}`,
        amazon: `https://www.amazon.com/s?k=bambu+lab+${encodeURIComponent(searchQuery)}+filament`,
        search_query: searchQuery
      });
    }

    // ---- AI-powered inventory insights ----
    if (method === 'GET' && path === '/api/inventory/insights') {
      try {
        const predictions = getUsagePredictions();
        const restock = getRestockSuggestions(30);
        const stats = getInventoryStats();
        const insights = [];

        // Low stock warnings
        const lowStock = predictions.per_spool.filter(s => s.needs_reorder);
        if (lowStock.length > 0) {
          insights.push({
            type: 'warning',
            title: 'Low Stock Alert',
            message: `${lowStock.length} spool(s) will run out within 14 days at current usage rate.`,
            items: lowStock.slice(0, 5).map(s => `${s.profile_name || s.material} - ${s.days_until_empty} days remaining`)
          });
        }

        // Restock suggestions
        const urgentRestock = restock.filter(r => r.urgency === 'high' || r.urgency === 'medium');
        if (urgentRestock.length > 0) {
          insights.push({
            type: 'restock',
            title: 'Restock Recommendations',
            message: `${urgentRestock.length} filament(s) should be reordered based on usage patterns.`,
            items: urgentRestock.slice(0, 5).map(r => `${r.profile_name} (${r.vendor_name || '?'}) - ${r.recommended_spools || 1} spool(s)`)
          });
        }

        // Usage patterns
        if (predictions.by_material.length > 0) {
          const topMaterial = predictions.by_material[0];
          insights.push({
            type: 'info',
            title: 'Top Material Usage',
            message: `${topMaterial.material || 'Unknown'} is your most used material (${Math.round(topMaterial.total_used_g)}g in 90 days, avg ${topMaterial.avg_daily_g}g/day).`,
            items: predictions.by_material.slice(0, 3).map(m => `${m.material}: ${Math.round(m.total_used_g)}g total`)
          });
        }

        // Cost optimization
        if (stats.total_spools > 0 && stats.total_cost > 0) {
          const avgCostPerKg = (stats.total_cost / (stats.total_weight_g / 1000)).toFixed(2);
          insights.push({
            type: 'info',
            title: 'Cost Overview',
            message: `Average cost: ${avgCostPerKg}/kg across ${stats.total_spools} active spools. Total inventory value: ${stats.total_cost.toFixed(2)}.`
          });
        }

        // Dormant spools (not used in 60+ days)
        const dormant = predictions.per_spool.filter(s => s.avg_daily_g === 0 && s.remaining_weight_g > 100);
        if (dormant.length > 0) {
          insights.push({
            type: 'suggestion',
            title: 'Dormant Spools',
            message: `${dormant.length} spool(s) haven't been used in 90+ days but still have significant filament remaining.`,
            items: dormant.slice(0, 5).map(s => `${s.profile_name || s.material} - ${Math.round(s.remaining_weight_g)}g remaining`)
          });
        }

        return sendJson(res, { insights });
      } catch (e) { return sendJson(res, { insights: [], error: e.message }); }
    }

    // ---- 3MF / Gcode file analysis ----
    if (method === 'POST' && path === '/api/inventory/analyze-file') {
      return readBinaryBody(req, (buffer) => {
        try {
          const contentType = req.headers['content-type'] || '';
          const filename = url.searchParams.get('filename') || '';
          let result;
          if (filename.endsWith('.3mf') || contentType.includes('3mf')) {
            result = parse3mf(buffer);
          } else if (filename.endsWith('.gcode') || filename.endsWith('.g') || contentType.includes('gcode')) {
            result = parseGcode(buffer);
          } else {
            return sendJson(res, { error: 'Unsupported file type. Use .3mf or .gcode' }, 400);
          }
          return sendJson(res, result);
        } catch (e) {
          return sendJson(res, { error: 'Failed to parse file: ' + e.message }, 500);
        }
      });
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

    // ---- Print Labels (HTML page) ----
    if (method === 'GET' && path === '/print/labels') {
      const ids = (url.searchParams.get('ids') || '').split(',').map(Number).filter(Boolean);
      const format = url.searchParams.get('format') || 'thermal_40x30';
      if (ids.length === 0) { res.writeHead(400, { 'Content-Type': 'text/plain' }); return res.end('No spool IDs'); }
      const spools = ids.map(id => getSpool(id)).filter(Boolean);
      if (spools.length === 0) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('No spools found'); }
      const host = req.headers.host || 'localhost:3000';
      const proto = req.socket?.encrypted ? 'https' : 'http';
      const FORMATS = {
        thermal_40x30: { width: '40mm', height: '30mm', pageSize: 'auto' },
        thermal_50x30: { width: '50mm', height: '30mm', pageSize: 'auto' },
        a4_grid_3x8:  { width: '63.5mm', height: '33.9mm', pageSize: 'A4' },
        a4_grid_2x7:  { width: '99.1mm', height: '38.1mm', pageSize: 'A4' },
      };
      const fmt = FORMATS[format] || FORMATS.thermal_40x30;
      const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      let labels = '';
      for (const s of spools) {
        const color = s.color_hex ? '#' + s.color_hex.replace('#','') : '#888';
        labels += `<div class="label"><div class="label-qr" id="qr-${s.id}"></div><div class="label-info">
          <div class="label-name">${esc(s.profile_name || s.material || '--')}</div>
          <div>${esc(s.vendor_name || '')}</div>
          <div><span class="cdot" style="background:${color}"></span> ${esc(s.color_name || '')}</div>
          ${s.lot_number ? `<div>Lot: ${esc(s.lot_number)}</div>` : ''}
          <div>${Math.round(s.initial_weight_g || 1000)}g</div>
        </div></div>`;
      }
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Spool Labels</title>
<script src="/js/lib/qrcode-generator.js"><\/script>
<style>@page{size:${fmt.pageSize};margin:5mm}*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif}
.grid{display:flex;flex-wrap:wrap;gap:0}.label{width:${fmt.width};height:${fmt.height};border:0.5px dashed #ccc;padding:2mm;display:flex;gap:2mm;page-break-inside:avoid;overflow:hidden}
.label-qr{flex:0 0 auto;display:flex;align-items:center}.label-qr svg{width:${parseInt(fmt.height)-6}mm;height:${parseInt(fmt.height)-6}mm}
.label-info{flex:1;display:flex;flex-direction:column;justify-content:center;font-size:7pt;line-height:1.3;overflow:hidden}
.label-name{font-weight:700;font-size:8pt}.cdot{width:8px;height:8px;border-radius:50%;display:inline-block;border:0.5px solid #999}
@media print{.label{border:none}.no-print{display:none}}</style></head><body>
<div class="no-print" style="padding:10px;background:#f5f5f5;margin-bottom:10px"><button onclick="window.print()">Print</button> <span>${spools.length} labels (${format})</span></div>
<div class="grid">${labels}</div>
<script>document.querySelectorAll('[id^="qr-"]').forEach(el=>{const id=el.id.replace('qr-','');try{const q=qrcode(0,'M');q.addData('${proto}://${host}/#filament/spool/'+id);q.make();el.innerHTML=q.createSvgTag(3,2)}catch(e){el.textContent='QR'}})<\/script></body></html>`;
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }

    // ---- ZPL Label Generation (direct thermal printers) ----
    if (method === 'GET' && path === '/api/inventory/label-zpl') {
      const spoolId = parseInt(url.searchParams.get('spool_id'));
      if (!spoolId) return sendJson(res, { error: 'spool_id required' }, 400);
      const spool = getSpool(spoolId);
      if (!spool) return sendJson(res, { error: 'Spool not found' }, 404);
      const host = req.headers.host || 'localhost:3443';
      const proto = req.socket?.encrypted ? 'https' : 'http';
      const qrData = `${proto}://${host}/#filament/spool/${spool.id}`;
      const name = (spool.profile_name || spool.material || 'Spool').substring(0, 30);
      const vendor = (spool.vendor_name || '').substring(0, 25);
      const color = (spool.color_name || '').substring(0, 20);
      const weight = `${Math.round(spool.initial_weight_g || 1000)}g`;
      const shortId = spool.short_id || String(spool.id);
      // Generate ZPL for 40x30mm label (320x240 dots at 8 dots/mm)
      const zpl = `^XA
^CF0,22
^FO160,20^FD${name}^FS
^CF0,18
^FO160,50^FD${vendor}^FS
^FO160,75^FD${color}^FS
^FO160,100^FD${weight}^FS
^FO160,125^FD#${shortId}^FS
^FO20,20^BQN,2,4^FDMA,${qrData}^FS
^XZ`;
      const dymoDsl = `<?xml version="1.0" encoding="utf-8"?>
<DieCutLabel Version="8.0" Name="FilamentLabel">
  <PaperOrientation>Landscape</PaperOrientation>
  <Id>Address</Id>
  <PaperName>30252 Address</PaperName>
  <DrawCommands>
    <RoundRectangle X="0" Y="0" Width="1581" Height="522" Rx="10" Ry="10"/>
  </DrawCommands>
  <ObjectInfo>
    <TextObject>
      <Name>Name</Name>
      <ForeColor Alpha="255" Red="0" Green="0" Blue="0"/>
      <BackColor Alpha="0" Red="255" Green="255" Blue="255"/>
      <LinkedObjectName/>
      <Rotation>Rotation0</Rotation>
      <IsMirrored>False</IsMirrored>
      <IsVariable>False</IsVariable>
      <TextFitMode>ShrinkToFit</TextFitMode>
      <Font Family="Arial" Size="14" Bold="True"/>
      <Bounds X="350" Y="20" Width="1200" Height="60"/>
      <Text>${name}</Text>
    </TextObject>
    <TextObject>
      <Name>Vendor</Name>
      <Font Family="Arial" Size="10" Bold="False"/>
      <Bounds X="350" Y="85" Width="1200" Height="40"/>
      <Text>${vendor} — ${color}</Text>
    </TextObject>
    <TextObject>
      <Name>Weight</Name>
      <Font Family="Arial" Size="10" Bold="False"/>
      <Bounds X="350" Y="130" Width="1200" Height="40"/>
      <Text>${weight} #${shortId}</Text>
    </TextObject>
    <BarcodeObject>
      <Name>QR</Name>
      <Type>QRCode</Type>
      <Bounds X="20" Y="20" Width="300" Height="300"/>
      <Text>${qrData}</Text>
      <ErrorCorrection>Medium</ErrorCorrection>
    </BarcodeObject>
  </ObjectInfo>
</DieCutLabel>`;
      // ESC/POS receipt printer format
      const escpos = [
        '\x1B\x40',          // Initialize
        '\x1B\x61\x01',      // Center align
        '\x1D\x6B\x31',      // QR code (simplified — printer may need raw QR commands)
        '\x1B\x21\x10',      // Double height
        name,
        '\x0A',
        '\x1B\x21\x00',      // Normal
        `${vendor} - ${color}`,
        '\x0A',
        `${weight}  #${shortId}`,
        '\x0A',
        '\x1B\x61\x00',      // Left align
        '\x1D\x56\x41\x03'   // Cut paper
      ].join('');
      return sendJson(res, { zpl: zpl.trim(), dymo_xml: dymoDsl.trim(), escpos, spool_id: spool.id, short_id: shortId });
    }

    // ---- Bed Mesh Data ----
    const bedMeshMatch = path.match(/^\/api\/printers\/([^/]+)\/bed-mesh$/);
    if (bedMeshMatch && method === 'GET') {
      const pid = bedMeshMatch[1];
      return sendJson(res, { latest: getLatestBedMesh(pid), history: getBedMeshHistory(pid, 10) });
    }
    if (bedMeshMatch && method === 'POST') {
      return readBody(req, (body) => {
        const pid = bedMeshMatch[1];
        if (!body.mesh_data || !Array.isArray(body.mesh_data)) return sendJson(res, { error: 'mesh_data (2D array) required' }, 400);
        const flat = body.mesh_data.flat();
        const mean = flat.reduce((s, v) => s + v, 0) / flat.length;
        const stats = {
          rows: body.mesh_data.length, cols: body.mesh_data[0]?.length || 0,
          zMin: Math.min(...flat), zMax: Math.max(...flat), zMean: mean,
          zStdDev: Math.sqrt(flat.reduce((s, v) => s + (v - mean) ** 2, 0) / flat.length),
          source: body.source || 'manual'
        };
        const id = addBedMesh(pid, body.mesh_data, stats);
        sendJson(res, { id, stats }, 201);
      });
    }
    const bedMeshDelMatch = path.match(/^\/api\/printers\/([^/]+)\/bed-mesh\/(\d+)$/);
    if (bedMeshDelMatch && method === 'DELETE') {
      deleteBedMesh(parseInt(bedMeshDelMatch[2]));
      return sendJson(res, { ok: true });
    }

    // ---- Bed Check AI ----
    const bedCheckMatch = path.match(/^\/api\/printers\/([^/]+)\/bed-check$/);
    if (bedCheckMatch && method === 'POST') {
      const pid = bedCheckMatch[1];
      const printer = _printerManager?.printers?.get(pid);
      if (!printer?.config?.ip) return sendJson(res, { error: 'Printer not found or no IP' }, 404);
      const result = await _failureDetector.checkBedClear(pid, printer.config.ip, printer.config.access_code);
      return sendJson(res, result);
    }
    const baselineMatch = path.match(/^\/api\/printers\/([^/]+)\/bed-check\/baseline$/);
    if (baselineMatch && method === 'POST') {
      const pid = baselineMatch[1];
      const printer = _printerManager?.printers?.get(pid);
      if (!printer?.config?.ip) return sendJson(res, { error: 'Printer not found or no IP' }, 404);
      const result = await _failureDetector.captureBaseline(pid, printer.config.ip, printer.config.access_code);
      return sendJson(res, result);
    }

    // ---- Layer Pauses ----
    const layerPauseMatch = path.match(/^\/api\/printers\/([^/]+)\/layer-pauses$/);
    if (layerPauseMatch && method === 'GET') {
      return sendJson(res, getLayerPauses(layerPauseMatch[1]));
    }
    if (layerPauseMatch && method === 'POST') {
      return readBody(req, (body) => {
        const pid = layerPauseMatch[1];
        if (!body.layer_numbers || !Array.isArray(body.layer_numbers) || body.layer_numbers.length === 0) {
          return sendJson(res, { error: 'layer_numbers (non-empty array of integers) required' }, 400);
        }
        const layers = body.layer_numbers.map(n => parseInt(n)).filter(n => n > 0);
        if (layers.length === 0) return sendJson(res, { error: 'At least one valid layer number required' }, 400);
        const id = addLayerPause(pid, layers, body.reason || null);
        sendJson(res, { id, printer_id: pid, layer_numbers: layers }, 201);
      });
    }
    const layerPauseDelMatch = path.match(/^\/api\/printers\/([^/]+)\/layer-pauses\/(\d+)$/);
    if (layerPauseDelMatch && method === 'DELETE') {
      deleteLayerPause(parseInt(layerPauseDelMatch[2]));
      return sendJson(res, { ok: true });
    }

    // ---- Smart Filament Changer ----
    const changeFilMatch = path.match(/^\/api\/printers\/([^/]+)\/change-filament$/);
    if (changeFilMatch && method === 'GET') {
      const pid = changeFilMatch[1];
      return sendJson(res, { active: getActiveFilamentChange(pid), history: getFilamentChangeHistory(pid) });
    }
    if (changeFilMatch && method === 'POST') {
      return readBody(req, (body) => {
        const pid = changeFilMatch[1];
        const printer = _printerManager?.printers?.get(pid);
        if (!printer?.client) return sendJson(res, { error: 'Printer not connected' }, 400);
        const { from_spool_id, to_spool_id, ams_unit, ams_tray, step } = body;
        if (step === 'start') {
          const id = createFilamentChange(pid, from_spool_id, to_spool_id, ams_unit, ams_tray);
          const isAms = ams_unit !== undefined && ams_tray !== undefined;
          if (isAms) {
            printer.client.sendCommand(buildAmsTrayChangeCommand(ams_unit * 4 + ams_tray));
            updateFilamentChange(id, { current_step: 'ams_changing' });
          } else {
            printer.client.sendCommand(buildPauseCommand());
            updateFilamentChange(id, { current_step: 'paused' });
          }
          return sendJson(res, { id, status: 'in_progress' }, 201);
        }
        if (step === 'unload') {
          const active = getActiveFilamentChange(pid);
          if (!active) return sendJson(res, { error: 'No active change' }, 400);
          const cmds = buildGcodeMultiLine(buildFilamentUnloadSequence(body.temp || 220));
          for (const cmd of cmds) printer.client.sendCommand(cmd);
          updateFilamentChange(active.id, { current_step: 'unloading' });
          return sendJson(res, { step: 'unloading' });
        }
        if (step === 'load') {
          const active = getActiveFilamentChange(pid);
          if (!active) return sendJson(res, { error: 'No active change' }, 400);
          const cmds = buildGcodeMultiLine(buildFilamentLoadSequence(body.temp || 220, body.purge_length || 30));
          for (const cmd of cmds) printer.client.sendCommand(cmd);
          if (active.to_spool_id) assignSpoolToSlot(active.to_spool_id, pid, active.ams_unit || 0, active.ams_tray || 0);
          updateFilamentChange(active.id, { current_step: 'loading' });
          return sendJson(res, { step: 'loading' });
        }
        if (step === 'resume') {
          const active = getActiveFilamentChange(pid);
          if (!active) return sendJson(res, { error: 'No active change' }, 400);
          printer.client.sendCommand(buildResumeCommand());
          updateFilamentChange(active.id, { status: 'completed', current_step: 'done', completed_at: new Date().toISOString() });
          return sendJson(res, { step: 'completed' });
        }
        return sendJson(res, { error: 'Invalid step (start|unload|load|resume)' }, 400);
      });
    }

    // ---- External Price Check ----
    if (method === 'POST' && path === '/api/inventory/price-check') {
      return readBody(req, async (body) => {
        if (!body.url) return sendJson(res, { error: 'url required' }, 400);
        const { extractPriceFromUrl } = await import('./price-checker.js');
        const result = await extractPriceFromUrl(body.url);
        if (result.price !== null && body.profile_id) {
          addPriceEntry({ filament_profile_id: body.profile_id, vendor_id: body.vendor_id || null, price: result.price, currency: result.currency || 'USD', source_url: body.url });
        }
        return sendJson(res, result);
      });
    }

    // ---- Community Sharing ----
    if (method === 'POST' && path === '/api/community-filaments/share') {
      return readBody(req, (body) => {
        if (!body.profile_id) return sendJson(res, { error: 'profile_id required' }, 400);
        const user = req._user;
        const id = shareFilamentProfile(body.profile_id, user?.username || 'anonymous');
        if (!id) return sendJson(res, { error: 'Profile not found or already shared' }, 400);
        if (_broadcastFn) _broadcastFn('community_update', { action: 'shared', id });
        sendJson(res, { id }, 201);
      });
    }
    const cfRateMatch = path.match(/^\/api\/community-filaments\/(\d+)\/rate$/);
    if (cfRateMatch && method === 'POST') {
      return readBody(req, (body) => {
        const id = parseInt(cfRateMatch[1]);
        if (!body.rating || body.rating < 1 || body.rating > 5) return sendJson(res, { error: 'rating (1-5) required' }, 400);
        const user = req._user;
        const result = rateCommunityFilament(id, user?.username || 'default', body.rating, body.comment);
        sendJson(res, result);
      });
    }
    const cfRatingsMatch = path.match(/^\/api\/community-filaments\/(\d+)\/ratings$/);
    if (cfRatingsMatch && method === 'GET') {
      return sendJson(res, getCommunityFilamentRatings(parseInt(cfRatingsMatch[1])));
    }
    const cfTdVoteMatch = path.match(/^\/api\/community-filaments\/(\d+)\/td-vote$/);
    if (cfTdVoteMatch && method === 'POST') {
      return readBody(req, (body) => {
        const id = parseInt(cfTdVoteMatch[1]);
        if (!body.td_value || body.td_value <= 0) return sendJson(res, { error: 'td_value required (positive number)' }, 400);
        const user = req._user;
        const result = submitTdVote(id, user?.username || 'default', parseFloat(body.td_value));
        sendJson(res, result);
      });
    }
    const cfTdVotesMatch = path.match(/^\/api\/community-filaments\/(\d+)\/td-votes$/);
    if (cfTdVotesMatch && method === 'GET') {
      return sendJson(res, getTdVotes(parseInt(cfTdVotesMatch[1])));
    }
    const cfImportMatch = path.match(/^\/api\/community-filaments\/(\d+)\/import$/);
    if (cfImportMatch && method === 'POST') {
      return readBody(req, (body) => {
        const profileId = importCommunityToInventory(parseInt(cfImportMatch[1]), body.vendor_id);
        if (!profileId) return sendJson(res, { error: 'Community filament not found' }, 404);
        if (_broadcastFn) _broadcastFn('inventory_update', { action: 'add', entity: 'profile', id: profileId });
        sendJson(res, { profile_id: profileId }, 201);
      });
    }

    // 404
    sendJson(res, { error: 'Ikke funnet' }, 404);

  } catch (e) {
    console.error('[api] Feil:', e.message);
    sendJson(res, { error: 'Serverfeil' }, 500);
  }
}

function _getApiDocs() {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Bambu Dashboard API',
      version: _pkgVersion,
      description: 'REST API for Bambu Dashboard — a self-hosted 3D printer management system.'
    },
    servers: [{ url: '/api', description: 'Relative API base' }],
    security: [{ session: [] }, { apiKey: [] }],
    components: {
      securitySchemes: {
        session: { type: 'apiKey', in: 'cookie', name: 'session' },
        apiKey: { type: 'apiKey', in: 'header', name: 'X-API-Key' }
      }
    },
    tags: [
      { name: 'Auth', description: 'Authentication & sessions' },
      { name: 'Printers', description: 'Printer management & control' },
      { name: 'History', description: 'Print history & statistics' },
      { name: 'Inventory', description: 'Spool inventory management' },
      { name: 'Filament', description: 'Legacy filament CRUD' },
      { name: 'Profiles', description: 'Filament profiles & vendors' },
      { name: 'Tags', description: 'Tagging system for spools' },
      { name: 'Drying', description: 'Drying sessions & presets' },
      { name: 'Queue', description: 'Print queue management' },
      { name: 'Maintenance', description: 'Printer maintenance tracking' },
      { name: 'Notifications', description: 'Notification configuration' },
      { name: 'Webhooks', description: 'Webhook management & delivery' },
      { name: 'Users', description: 'User & role management (admin)' },
      { name: 'Hardware', description: 'Hardware inventory' },
      { name: 'Materials', description: 'Material database' },
      { name: 'Ecommerce', description: 'E-commerce integration' },
      { name: 'Slicer', description: 'Cloud slicer service' },
      { name: 'NFC', description: 'NFC tag mapping' },
      { name: 'Community', description: 'Community filament database' },
      { name: 'Timelapse', description: 'Timelapse recordings' },
      { name: 'System', description: 'Settings, backup, update' }
    ],
    endpoints: [
      // Auth
      { method: 'GET', path: '/api/auth/status', tag: 'Auth', summary: 'Get auth status', permission: null },
      { method: 'POST', path: '/api/auth/login', tag: 'Auth', summary: 'Login with credentials', permission: null },
      { method: 'POST', path: '/api/auth/logout', tag: 'Auth', summary: 'Logout / destroy session', permission: null },
      { method: 'GET', path: '/api/auth/config', tag: 'Auth', summary: 'Get auth configuration', permission: 'admin' },
      { method: 'PUT', path: '/api/auth/config', tag: 'Auth', summary: 'Update auth configuration', permission: 'admin' },
      // Discovery
      { method: 'GET', path: '/api/discovery/scan', tag: 'Discovery', summary: 'Scan for printers on local network (SSDP)', permission: 'admin' },
      { method: 'GET', path: '/api/discovery/status', tag: 'Discovery', summary: 'Get discovery scan status and cached results', permission: 'admin' },
      { method: 'POST', path: '/api/discovery/test', tag: 'Discovery', summary: 'Test MQTT connection to a printer', permission: 'admin' },
      // Bambu Cloud
      { method: 'GET', path: '/api/bambu-cloud/status', tag: 'Bambu Cloud', summary: 'Get cloud authentication status', permission: 'admin' },
      { method: 'POST', path: '/api/bambu-cloud/login', tag: 'Bambu Cloud', summary: 'Login with Bambu Lab account (triggers 2FA)', permission: 'admin' },
      { method: 'POST', path: '/api/bambu-cloud/verify', tag: 'Bambu Cloud', summary: 'Verify 2FA code', permission: 'admin' },
      { method: 'GET', path: '/api/bambu-cloud/printers', tag: 'Bambu Cloud', summary: 'List printers from Bambu Lab account', permission: 'admin' },
      { method: 'POST', path: '/api/bambu-cloud/logout', tag: 'Bambu Cloud', summary: 'Logout from Bambu Lab cloud', permission: 'admin' },
      // Printers
      { method: 'GET', path: '/api/printers', tag: 'Printers', summary: 'List all printers', permission: 'view' },
      { method: 'POST', path: '/api/printers', tag: 'Printers', summary: 'Add a printer', permission: 'admin' },
      { method: 'GET', path: '/api/printers/:id', tag: 'Printers', summary: 'Get printer details', permission: 'view' },
      { method: 'PUT', path: '/api/printers/:id', tag: 'Printers', summary: 'Update printer', permission: 'controls' },
      { method: 'DELETE', path: '/api/printers/:id', tag: 'Printers', summary: 'Delete printer', permission: 'controls' },
      { method: 'GET', path: '/api/printers/:id/files', tag: 'Printers', summary: 'List files on printer SD', permission: 'view' },
      { method: 'POST', path: '/api/printers/:id/files/print', tag: 'Printers', summary: 'Start printing a file', permission: 'print' },
      { method: 'GET', path: '/api/printers/:id/camera', tag: 'Printers', summary: 'Get camera snapshot', permission: 'view' },
      // History & Stats
      { method: 'GET', path: '/api/history', tag: 'History', summary: 'Get print history (paginated)', permission: 'view' },
      { method: 'GET', path: '/api/history/export', tag: 'History', summary: 'Export history as CSV', permission: 'view' },
      { method: 'GET', path: '/api/statistics', tag: 'History', summary: 'Get print statistics (supports from/to date params)', permission: 'view' },
      { method: 'GET', path: '/api/statistics/costs', tag: 'History', summary: 'Get cost statistics breakdown', permission: 'view' },
      { method: 'GET', path: '/api/statistics/hardware', tag: 'History', summary: 'Get hardware statistics (maintenance, nozzles, build plates, firmware)', permission: 'view' },
      { method: 'GET', path: '/api/telemetry', tag: 'History', summary: 'Get telemetry data', permission: 'view' },
      { method: 'GET', path: '/api/wear', tag: 'History', summary: 'Get component wear data', permission: 'view' },
      { method: 'GET', path: '/api/errors', tag: 'History', summary: 'Get printer errors', permission: 'view' },
      // Inventory (Spools)
      { method: 'GET', path: '/api/inventory/spools', tag: 'Inventory', summary: 'List spools (filterable)', permission: 'view' },
      { method: 'POST', path: '/api/inventory/spools', tag: 'Inventory', summary: 'Create a spool', permission: 'filament' },
      { method: 'GET', path: '/api/inventory/spools/:id', tag: 'Inventory', summary: 'Get spool details', permission: 'view' },
      { method: 'PUT', path: '/api/inventory/spools/:id', tag: 'Inventory', summary: 'Update spool', permission: 'filament' },
      { method: 'DELETE', path: '/api/inventory/spools/:id', tag: 'Inventory', summary: 'Delete spool', permission: 'filament' },
      { method: 'POST', path: '/api/inventory/spools/:id/archive', tag: 'Inventory', summary: 'Archive a spool', permission: 'filament' },
      { method: 'POST', path: '/api/inventory/spools/:id/use', tag: 'Inventory', summary: 'Record spool weight usage', permission: 'filament' },
      { method: 'POST', path: '/api/inventory/spools/:id/duplicate', tag: 'Inventory', summary: 'Duplicate a spool', permission: 'filament' },
      { method: 'POST', path: '/api/inventory/spools/merge', tag: 'Inventory', summary: 'Merge multiple spools into one', permission: 'filament' },
      { method: 'GET', path: '/api/inventory/spools/fifo', tag: 'Inventory', summary: 'Get FIFO spool suggestions (oldest first)', permission: 'view' },
      { method: 'POST', path: '/api/inventory/spools/:id/measure', tag: 'Inventory', summary: 'Measure spool weight', permission: 'filament' },
      { method: 'POST', path: '/api/inventory/spools/:id/favorite', tag: 'Inventory', summary: 'Toggle spool favorite', permission: 'filament' },
      { method: 'GET', path: '/api/inventory/spools/:id/timeline', tag: 'Inventory', summary: 'Get spool event timeline', permission: 'view' },
      { method: 'GET', path: '/api/inventory/spools/:id/print-stats', tag: 'Inventory', summary: 'Get spool print usage statistics with cost breakdown', permission: 'view' },
      { method: 'GET', path: '/api/inventory/stats', tag: 'Inventory', summary: 'Get inventory statistics', permission: 'view' },
      { method: 'GET', path: '/api/inventory/search', tag: 'Inventory', summary: 'Search spools', permission: 'view' },
      { method: 'GET', path: '/api/inventory/export', tag: 'Inventory', summary: 'Export all spools', permission: 'view' },
      { method: 'POST', path: '/api/inventory/import', tag: 'Inventory', summary: 'Import spools from JSON/CSV', permission: 'filament' },
      { method: 'POST', path: '/api/inventory/spools/bulk', tag: 'Inventory', summary: 'Bulk spool operations', permission: 'filament' },
      { method: 'POST', path: '/api/inventory/spools/batch', tag: 'Inventory', summary: 'Batch add spools', permission: 'filament' },
      // Locations
      { method: 'GET', path: '/api/inventory/locations', tag: 'Inventory', summary: 'List storage locations', permission: 'view' },
      { method: 'POST', path: '/api/inventory/locations', tag: 'Inventory', summary: 'Create location', permission: 'filament' },
      { method: 'PUT', path: '/api/inventory/locations/:id', tag: 'Inventory', summary: 'Update location', permission: 'filament' },
      { method: 'DELETE', path: '/api/inventory/locations/:id', tag: 'Inventory', summary: 'Delete location', permission: 'filament' },
      // Settings
      { method: 'GET', path: '/api/inventory/settings', tag: 'System', summary: 'Get all inventory settings', permission: 'view' },
      { method: 'GET', path: '/api/inventory/settings/:key', tag: 'System', summary: 'Get a single setting', permission: 'view' },
      { method: 'PUT', path: '/api/inventory/settings/:key', tag: 'System', summary: 'Update a setting', permission: 'filament' },
      // Profiles & Vendors
      { method: 'GET', path: '/api/filament-profiles', tag: 'Profiles', summary: 'List filament profiles', permission: 'view' },
      { method: 'POST', path: '/api/filament-profiles', tag: 'Profiles', summary: 'Create filament profile', permission: 'filament' },
      { method: 'GET', path: '/api/filament-profiles/:id', tag: 'Profiles', summary: 'Get profile details', permission: 'view' },
      { method: 'PUT', path: '/api/filament-profiles/:id', tag: 'Profiles', summary: 'Update profile', permission: 'filament' },
      { method: 'DELETE', path: '/api/filament-profiles/:id', tag: 'Profiles', summary: 'Delete profile', permission: 'filament' },
      { method: 'POST', path: '/api/filament-profiles/bulk', tag: 'Profiles', summary: 'Bulk profile operations', permission: 'filament' },
      { method: 'GET', path: '/api/vendors', tag: 'Profiles', summary: 'List vendors', permission: 'view' },
      { method: 'POST', path: '/api/vendors', tag: 'Profiles', summary: 'Create vendor', permission: 'filament' },
      { method: 'PUT', path: '/api/vendors/:id', tag: 'Profiles', summary: 'Update vendor', permission: 'filament' },
      { method: 'DELETE', path: '/api/vendors/:id', tag: 'Profiles', summary: 'Delete vendor', permission: 'filament' },
      { method: 'POST', path: '/api/vendors/bulk', tag: 'Profiles', summary: 'Bulk vendor operations', permission: 'filament' },
      // Tags
      { method: 'GET', path: '/api/tags', tag: 'Tags', summary: 'List all tags', permission: 'view' },
      { method: 'POST', path: '/api/tags', tag: 'Tags', summary: 'Create tag', permission: 'filament' },
      { method: 'PUT', path: '/api/tags/:id', tag: 'Tags', summary: 'Update tag', permission: 'filament' },
      { method: 'DELETE', path: '/api/tags/:id', tag: 'Tags', summary: 'Delete tag', permission: 'filament' },
      { method: 'POST', path: '/api/tags/assign', tag: 'Tags', summary: 'Assign tag to entity', permission: 'filament' },
      { method: 'POST', path: '/api/tags/unassign', tag: 'Tags', summary: 'Remove tag from entity', permission: 'filament' },
      { method: 'POST', path: '/api/tags/bulk-assign', tag: 'Tags', summary: 'Bulk assign tags', permission: 'filament' },
      // Drying
      { method: 'GET', path: '/api/inventory/drying', tag: 'Drying', summary: 'Get drying sessions', permission: 'view' },
      { method: 'GET', path: '/api/inventory/drying/active', tag: 'Drying', summary: 'Get active drying sessions', permission: 'view' },
      { method: 'POST', path: '/api/inventory/drying', tag: 'Drying', summary: 'Start drying session', permission: 'filament' },
      { method: 'POST', path: '/api/inventory/drying/:id/complete', tag: 'Drying', summary: 'Complete drying session', permission: 'filament' },
      { method: 'DELETE', path: '/api/inventory/drying/:id', tag: 'Drying', summary: 'Delete drying session', permission: 'filament' },
      { method: 'GET', path: '/api/inventory/drying/presets', tag: 'Drying', summary: 'List drying presets', permission: 'view' },
      { method: 'POST', path: '/api/inventory/drying/presets', tag: 'Drying', summary: 'Create/update drying preset', permission: 'filament' },
      { method: 'DELETE', path: '/api/inventory/drying/presets/:id', tag: 'Drying', summary: 'Delete drying preset', permission: 'filament' },
      // Queue
      { method: 'GET', path: '/api/queues', tag: 'Queue', summary: 'List print queues', permission: 'view' },
      { method: 'POST', path: '/api/queues', tag: 'Queue', summary: 'Create print queue', permission: 'queue' },
      { method: 'GET', path: '/api/queues/:id', tag: 'Queue', summary: 'Get queue details', permission: 'view' },
      { method: 'PUT', path: '/api/queues/:id', tag: 'Queue', summary: 'Update queue', permission: 'queue' },
      { method: 'DELETE', path: '/api/queues/:id', tag: 'Queue', summary: 'Delete queue', permission: 'queue' },
      { method: 'POST', path: '/api/queues/:id/items', tag: 'Queue', summary: 'Add item to queue', permission: 'queue' },
      { method: 'PUT', path: '/api/queues/:queueId/items/:id', tag: 'Queue', summary: 'Update queue item', permission: 'queue' },
      { method: 'DELETE', path: '/api/queues/:queueId/items/:id', tag: 'Queue', summary: 'Remove queue item', permission: 'queue' },
      { method: 'POST', path: '/api/queues/:id/reorder', tag: 'Queue', summary: 'Reorder queue items', permission: 'queue' },
      // Maintenance
      { method: 'GET', path: '/api/maintenance/status', tag: 'Maintenance', summary: 'Get maintenance status', permission: 'view' },
      { method: 'GET', path: '/api/maintenance/log', tag: 'Maintenance', summary: 'Get maintenance log', permission: 'view' },
      { method: 'POST', path: '/api/maintenance/log', tag: 'Maintenance', summary: 'Add maintenance event', permission: 'controls' },
      { method: 'GET', path: '/api/maintenance/schedule', tag: 'Maintenance', summary: 'Get maintenance schedule', permission: 'view' },
      { method: 'PUT', path: '/api/maintenance/schedule', tag: 'Maintenance', summary: 'Update maintenance schedule', permission: 'controls' },
      // Notifications
      { method: 'GET', path: '/api/notifications/config', tag: 'Notifications', summary: 'Get notification config', permission: 'admin' },
      { method: 'PUT', path: '/api/notifications/config', tag: 'Notifications', summary: 'Update notification config', permission: 'admin' },
      { method: 'POST', path: '/api/notifications/test', tag: 'Notifications', summary: 'Send test notification', permission: 'admin' },
      { method: 'GET', path: '/api/notifications/log', tag: 'Notifications', summary: 'Get notification log', permission: 'view' },
      // Webhooks
      { method: 'GET', path: '/api/webhooks', tag: 'Webhooks', summary: 'List webhook configs', permission: 'admin' },
      { method: 'POST', path: '/api/webhooks', tag: 'Webhooks', summary: 'Create webhook config', permission: 'admin' },
      { method: 'PUT', path: '/api/webhooks/:id', tag: 'Webhooks', summary: 'Update webhook config', permission: 'admin' },
      { method: 'DELETE', path: '/api/webhooks/:id', tag: 'Webhooks', summary: 'Delete webhook config', permission: 'admin' },
      // Users & Roles
      { method: 'GET', path: '/api/users', tag: 'Users', summary: 'List users', permission: 'admin' },
      { method: 'POST', path: '/api/users', tag: 'Users', summary: 'Create user', permission: 'admin' },
      { method: 'PUT', path: '/api/users/:id', tag: 'Users', summary: 'Update user', permission: 'admin' },
      { method: 'DELETE', path: '/api/users/:id', tag: 'Users', summary: 'Delete user', permission: 'admin' },
      { method: 'GET', path: '/api/roles', tag: 'Users', summary: 'List roles', permission: 'admin' },
      { method: 'POST', path: '/api/roles', tag: 'Users', summary: 'Create role', permission: 'admin' },
      { method: 'PUT', path: '/api/roles/:id', tag: 'Users', summary: 'Update role', permission: 'admin' },
      { method: 'DELETE', path: '/api/roles/:id', tag: 'Users', summary: 'Delete role', permission: 'admin' },
      { method: 'GET', path: '/api/keys', tag: 'Users', summary: 'List API keys', permission: 'admin' },
      { method: 'POST', path: '/api/keys', tag: 'Users', summary: 'Create API key', permission: 'admin' },
      { method: 'DELETE', path: '/api/keys/:id', tag: 'Users', summary: 'Delete API key', permission: 'admin' },
      // Hardware
      { method: 'GET', path: '/api/hardware', tag: 'Hardware', summary: 'List hardware items', permission: 'view' },
      { method: 'POST', path: '/api/hardware', tag: 'Hardware', summary: 'Add hardware item', permission: 'admin' },
      { method: 'PUT', path: '/api/hardware/:id', tag: 'Hardware', summary: 'Update hardware item', permission: 'admin' },
      { method: 'DELETE', path: '/api/hardware/:id', tag: 'Hardware', summary: 'Delete hardware item', permission: 'admin' },
      // Materials
      { method: 'GET', path: '/api/materials', tag: 'Materials', summary: 'List materials', permission: 'view' },
      { method: 'POST', path: '/api/materials', tag: 'Materials', summary: 'Add material', permission: 'admin' },
      { method: 'PUT', path: '/api/materials/:id', tag: 'Materials', summary: 'Update material', permission: 'admin' },
      // NFC
      { method: 'GET', path: '/api/nfc/mappings', tag: 'NFC', summary: 'List NFC tag mappings', permission: 'view' },
      { method: 'POST', path: '/api/nfc/link', tag: 'NFC', summary: 'Link NFC tag to spool', permission: 'filament' },
      { method: 'POST', path: '/api/nfc/unlink', tag: 'NFC', summary: 'Unlink NFC tag', permission: 'filament' },
      { method: 'GET', path: '/api/nfc/lookup/:uid', tag: 'NFC', summary: 'Lookup spool by NFC UID', permission: 'view' },
      { method: 'POST', path: '/api/nfc/scan', tag: 'NFC', summary: 'Scan NFC tag + auto-assign to AMS slot', permission: 'filament' },
      // Community
      { method: 'GET', path: '/api/community-filaments', tag: 'Community', summary: 'List community filaments', permission: 'view' },
      { method: 'GET', path: '/api/community-filaments/search', tag: 'Community', summary: 'Search community by color', permission: 'view' },
      { method: 'POST', path: '/api/community-filaments/seed', tag: 'Community', summary: 'Seed community database', permission: 'admin' },
      // Ecommerce
      { method: 'GET', path: '/api/ecommerce/configs', tag: 'Ecommerce', summary: 'List e-commerce configs', permission: 'admin' },
      { method: 'POST', path: '/api/ecommerce/configs', tag: 'Ecommerce', summary: 'Create e-commerce config', permission: 'admin' },
      { method: 'GET', path: '/api/ecommerce/orders', tag: 'Ecommerce', summary: 'List orders', permission: 'view' },
      // Slicer
      { method: 'GET', path: '/api/slicer/status', tag: 'Slicer', summary: 'Get slicer status + quality presets', permission: 'view' },
      { method: 'GET', path: '/api/slicer/profiles', tag: 'Slicer', summary: 'List detected slicer profiles', permission: 'view' },
      { method: 'POST', path: '/api/slicer/upload', tag: 'Slicer', summary: 'Upload file for slicing (query: quality, profile)', permission: 'print' },
      { method: 'POST', path: '/api/slicer/jobs/:id/slice', tag: 'Slicer', summary: 'Slice job (body: quality, profile, layer_height)', permission: 'print' },
      { method: 'GET', path: '/api/slicer/jobs', tag: 'Slicer', summary: 'List slicer jobs', permission: 'view' },
      // Timelapse
      { method: 'GET', path: '/api/timelapse', tag: 'Timelapse', summary: 'List timelapse recordings', permission: 'view' },
      { method: 'GET', path: '/api/timelapse/:id', tag: 'Timelapse', summary: 'Get timelapse recording', permission: 'view' },
      { method: 'DELETE', path: '/api/timelapse/:id', tag: 'Timelapse', summary: 'Delete timelapse recording', permission: 'admin' },
      // System
      { method: 'GET', path: '/api/update/status', tag: 'System', summary: 'Get update status', permission: 'view' },
      { method: 'POST', path: '/api/update/check', tag: 'System', summary: 'Check for updates', permission: 'admin' },
      { method: 'POST', path: '/api/update/apply', tag: 'System', summary: 'Apply update', permission: 'admin' },
      { method: 'POST', path: '/api/backup', tag: 'System', summary: 'Create backup', permission: 'admin' },
      { method: 'GET', path: '/api/backup/list', tag: 'System', summary: 'List backups', permission: 'admin' },
      { method: 'GET', path: '/api/docs', tag: 'System', summary: 'This API documentation', permission: 'view' },
      // Filament (legacy)
      { method: 'GET', path: '/api/filament', tag: 'Filament', summary: 'List filament records', permission: 'view' },
      { method: 'POST', path: '/api/filament', tag: 'Filament', summary: 'Add filament record', permission: 'filament' },
      { method: 'PUT', path: '/api/filament/:id', tag: 'Filament', summary: 'Update filament record', permission: 'filament' },
      { method: 'DELETE', path: '/api/filament/:id', tag: 'Filament', summary: 'Delete filament record', permission: 'filament' },
      // Waste
      { method: 'GET', path: '/api/waste/stats', tag: 'History', summary: 'Get waste statistics', permission: 'view' },
      { method: 'GET', path: '/api/waste/history', tag: 'History', summary: 'Get waste history', permission: 'view' },
      { method: 'POST', path: '/api/waste', tag: 'History', summary: 'Record waste entry', permission: 'controls' },
      // Printer Groups
      { method: 'GET', path: '/api/printer-groups', tag: 'Printers', summary: 'List printer groups', permission: 'view' },
      { method: 'POST', path: '/api/printer-groups', tag: 'Printers', summary: 'Create printer group', permission: 'admin' },
      { method: 'PUT', path: '/api/printer-groups/:id', tag: 'Printers', summary: 'Update printer group', permission: 'admin' },
      { method: 'DELETE', path: '/api/printer-groups/:id', tag: 'Printers', summary: 'Delete printer group', permission: 'admin' },
      // Cost
      { method: 'POST', path: '/api/inventory/cost/estimate', tag: 'Inventory', summary: 'Estimate print cost', permission: 'view' },
      { method: 'GET', path: '/api/inventory/cost/report', tag: 'Inventory', summary: 'Get cost report', permission: 'view' },
      { method: 'GET', path: '/api/inventory/restock', tag: 'Inventory', summary: 'Get restock suggestions (query: days=30)', permission: 'view' },
      { method: 'GET', path: '/api/inventory/predictions', tag: 'Inventory', summary: 'Get usage predictions', permission: 'view' },
      // Protection
      { method: 'GET', path: '/api/protection/settings', tag: 'Printers', summary: 'Get protection settings', permission: 'view' },
      { method: 'PUT', path: '/api/protection/settings', tag: 'Printers', summary: 'Update protection settings', permission: 'controls' },
      // Macros
      { method: 'GET', path: '/api/macros', tag: 'System', summary: 'List macros', permission: 'view' },
      { method: 'POST', path: '/api/macros', tag: 'System', summary: 'Create macro', permission: 'macros' },
      { method: 'PUT', path: '/api/macros/:id', tag: 'System', summary: 'Update macro', permission: 'macros' },
      { method: 'DELETE', path: '/api/macros/:id', tag: 'System', summary: 'Delete macro', permission: 'macros' },
      // Custom Fields
      { method: 'GET', path: '/api/custom-fields', tag: 'System', summary: 'List custom field definitions', permission: 'view' },
      { method: 'POST', path: '/api/custom-fields', tag: 'System', summary: 'Create custom field', permission: 'filament' },
      { method: 'PUT', path: '/api/custom-fields/:id', tag: 'System', summary: 'Update custom field', permission: 'filament' },
      { method: 'DELETE', path: '/api/custom-fields/:id', tag: 'System', summary: 'Delete custom field', permission: 'filament' },
      // Shared Palette
      { method: 'POST', path: '/api/palette/share', tag: 'Inventory', summary: 'Create shared palette link', permission: 'filament' },
      { method: 'GET', path: '/api/palette/:token', tag: 'Inventory', summary: 'Get shared palette', permission: 'view' },
      // Build Plates
      { method: 'GET', path: '/api/build-plates', tag: 'Hardware', summary: 'List build plates', permission: 'view' },
      { method: 'POST', path: '/api/build-plates', tag: 'Hardware', summary: 'Add build plate', permission: 'filament' },
      { method: 'PUT', path: '/api/build-plates/:id', tag: 'Hardware', summary: 'Update build plate', permission: 'filament' },
      { method: 'DELETE', path: '/api/build-plates/:id', tag: 'Hardware', summary: 'Delete build plate', permission: 'filament' },
      // Dryer Models
      { method: 'GET', path: '/api/dryer-models', tag: 'Hardware', summary: 'List dryer models', permission: 'view' },
      { method: 'POST', path: '/api/dryer-models', tag: 'Hardware', summary: 'Add dryer model', permission: 'filament' },
      { method: 'PUT', path: '/api/dryer-models/:id', tag: 'Hardware', summary: 'Update dryer model', permission: 'filament' },
      { method: 'DELETE', path: '/api/dryer-models/:id', tag: 'Hardware', summary: 'Delete dryer model', permission: 'filament' },
      // Price History
      { method: 'GET', path: '/api/price-history', tag: 'Inventory', summary: 'Get price history', permission: 'view' },
      { method: 'POST', path: '/api/price-history', tag: 'Inventory', summary: 'Add price entry (triggers alerts)', permission: 'filament' },
      { method: 'GET', path: '/api/price-alerts', tag: 'Inventory', summary: 'List price alerts', permission: 'view' },
      { method: 'POST', path: '/api/price-alerts', tag: 'Inventory', summary: 'Create price alert', permission: 'filament' },
      { method: 'PUT', path: '/api/price-alerts/:id', tag: 'Inventory', summary: 'Update price alert', permission: 'filament' },
      { method: 'DELETE', path: '/api/price-alerts/:id', tag: 'Inventory', summary: 'Delete price alert', permission: 'filament' },
      // Failure Detection
      { method: 'GET', path: '/api/failure-detections', tag: 'Printers', summary: 'List AI failure detections', permission: 'view' },
      { method: 'POST', path: '/api/failure-detections/:id/acknowledge', tag: 'Printers', summary: 'Acknowledge failure detection', permission: 'controls' },
    ],
    rateLimit: { requests: API_RATE_MAX, window: `${API_RATE_WINDOW_MS / 1000}s`, headers: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'] }
  };
}

function sendJson(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'X-API-Version': _pkgVersion });
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

// Binary body reader (for file uploads, 100 MB limit)
const MAX_UPLOAD_SIZE = 100 * 1024 * 1024;
function readBinaryBody(req, callback) {
  const chunks = [];
  let size = 0;
  req.on('data', chunk => {
    size += chunk.length;
    if (size > MAX_UPLOAD_SIZE) { req.destroy(); return; }
    chunks.push(chunk);
  });
  req.on('end', () => {
    if (size > MAX_UPLOAD_SIZE) return;
    callback(Buffer.concat(chunks));
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
    // Fallback: try Bambu Cloud task API (project_id matches task id)
    if (_bambuCloud?.isAuthenticated()) {
      try {
        const tasks = await _bambuCloud.getTaskHistory();
        const task = tasks.find(t => String(t.id) === String(designId));
        if (task?.cover) {
          // Download image locally so we don't depend on expiring S3 signed URLs
          const localImage = await _cacheCloudImage(designId, task.cover);
          const data = {
            title: task.designTitle || task.title || null,
            image: localImage || task.cover,
            description: task.title || '',
            url: mwUrl,
            designer: null,
            designerAvatar: null,
            likes: 0, downloads: 0, prints: 0,
            category: null,
            print_settings: null,
            fallback: false,
            estimated_weight_g: task.weight || null,
            estimated_time_s: task.costTime || null,
            filament_type: task.amsDetailMapping?.[0]?.filamentType || null
          };
          _mwCache.set(designId, { data, ts: Date.now() });
          return sendJson(res, data);
        }
      } catch {}
    }
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

function _cacheCloudImage(designId, url) {
  const thumbDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'thumbnails');
  const filePath = join(thumbDir, `${designId}.png`);
  if (existsSync(filePath)) return Promise.resolve(`/api/cloud-image/${designId}`);
  return new Promise((resolve) => {
    try { mkdirSync(thumbDir, { recursive: true }); } catch {}
    const req = https.get(url, { timeout: 10000 }, (res) => {
      if (res.statusCode !== 200) { res.resume(); return resolve(null); }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { writeFileSync(filePath, Buffer.concat(chunks)); resolve(`/api/cloud-image/${designId}`); }
        catch { resolve(null); }
      });
      res.on('error', () => resolve(null));
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
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
