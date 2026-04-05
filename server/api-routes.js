import { getHistory, getHistoryById, addHistory, updateHistoryNotes, getStatistics, getFilament, addFilament, updateFilament, deleteFilament, getErrors, acknowledgeError, deleteError, acknowledgeAllErrors, getPrinters, addPrinter, updatePrinter, deletePrinter, addWaste, deleteWaste, getWasteStats, getWasteHistory, getMaintenanceStatus, addMaintenanceEvent, getMaintenanceLog, getMaintenanceSchedule, upsertMaintenanceSchedule, getActiveNozzleSession, retireNozzleSession, createNozzleSession, getTelemetry, getComponentWear, getFirmwareHistory, getXcamEvents, getXcamStats, getAmsTrayLifetime, getDemoPrinterIds, purgeDemoData, getNotificationLog, getUpdateHistory, getModelLink, setModelLink, deleteModelLink, getRecentModelLinks, getVendors, addVendor, updateVendor, deleteVendor, getFilamentProfiles, getFilamentProfile, addFilamentProfile, updateFilamentProfile, deleteFilamentProfile, getSpools, getSpool, addSpool, updateSpool, deleteSpool, archiveSpool, useSpoolWeight, assignSpoolToSlot, getSpoolUsageLog, getLocations, addLocation, updateLocation, deleteLocation, getInventoryStats, searchSpools, duplicateSpool, measureSpoolWeight, getAllSpoolsForExport, getAllFilamentProfilesForExport, getAllVendorsForExport, findSimilarColors, getDistinctMaterials, getDistinctLotNumbers, getDistinctArticleNumbers, getInventorySetting, setInventorySetting, getAllInventorySettings, importSpools, importFilamentProfiles, importVendors, getFieldSchemas, addFieldSchema, deleteFieldSchema, lengthToWeight, getDryingSessions, getActiveDryingSessions, startDryingSession, completeDryingSession, deleteDryingSession, getDryingPresets, getDryingPreset, upsertDryingPreset, deleteDryingPreset, getSpoolsDryingStatus, getUsagePredictions, getRestockSuggestions, estimatePrintCost, createQueue, getQueues, getQueue, updateQueue, deleteQueue, addQueueItem, getQueueItem, updateQueueItem, deleteQueueItem, reorderQueueItems, getActiveQueueItems, addQueueLog, getQueueLog, getNextPendingItem, getTags, createTag, updateTag, deleteTag, assignTag, unassignTag, getEntityTags, getEntitiesByTag, getNfcMappings, lookupNfcTag, linkNfcTag, unlinkNfcTag, updateNfcScan, checkoutSpool, checkinSpool, getCheckedOutSpools, getCheckoutLog, addSpoolEvent, getSpoolTimeline, getSpoolPrintStats, estimateFilamentFromHistory, backfillFilamentUsage, syncSpoolWeightsFromLog, getRecentSpoolEvents, bulkDeleteSpools, bulkArchiveSpools, bulkRelocateSpools, bulkMarkDried, bulkEditSpools, bulkAssignTag, bulkUnassignTag, bulkDeleteProfiles, bulkEditProfiles, bulkDeleteVendors, bulkStartDrying, getSpoolsForExportByIds, toggleSpoolFavorite, batchAddSpools, createSharedPalette, getSharedPalette, deleteSharedPalette, getSharedPaletteSpools, getMacros, getMacro, addMacro, updateMacro, deleteMacro, getWebhookConfigs, getWebhookConfig, addWebhookConfig, updateWebhookConfig, deleteWebhookConfig, getActiveWebhooks, addWebhookDelivery, updateWebhookDelivery, getWebhookDeliveries, savePrintCost, getPrintCost, getCostReport, getCostSummary, getCostStatistics, estimatePrintCostAdvanced, getMaterials, getMaterial, getMaterialByName, updateMaterial, addMaterial, getHardwareItems, getHardwareItem, addHardwareItem, updateHardwareItem, deleteHardwareItem, assignHardware, unassignHardware, getHardwareForPrinter, getHardwareAssignments, getRoles, getRole, addRole, updateRole, deleteRole, getUsers, getUser, addUser, updateUser, deleteUser, getApiKeys, addApiKey, deleteApiKey, deactivateApiKey, getEcommerceConfigs, getEcommerceConfig, addEcommerceConfig, updateEcommerceConfig, deleteEcommerceConfig, getEcommerceOrders, getEcommerceOrder, addEcommerceOrder, updateEcommerceOrder, getTimelapseRecordings, getTimelapseRecording, deleteTimelapseRecording, getPushSubscriptions, addPushSubscription, deletePushSubscription, getCommunityFilaments, getCommunityFilament, searchCommunityByColor, getCommunityManufacturers, getCommunityMaterials, addCommunityFilament, updateCommunityFilament, deleteCommunityFilament, getCommunityFilamentStats, getOwnedCommunityIds, upsertCommunityFilament, clearCommunityFilaments, getCommunityFilamentCategories, getBrandDefaults, getBrandDefault, upsertBrandDefault, deleteBrandDefault, getCustomFieldDefs, getCustomFieldDef, addCustomFieldDef, updateCustomFieldDef, deleteCustomFieldDef, getCustomFieldValues, setCustomFieldValue, deleteCustomFieldValues, getPrinterGroups, getPrinterGroup, addPrinterGroup, updatePrinterGroup, deletePrinterGroup, addPrinterToGroup, removePrinterFromGroup, getGroupMembers, getPrinterGroupsForPrinter, getProjects, getProject, addProject, updateProject, deleteProject, getProjectPrints, addProjectPrint, updateProjectPrint, deleteProjectPrint, getExportTemplates, getExportTemplate, addExportTemplate, deleteExportTemplate, getUserQuota, upsertUserQuota, addUserTransaction, getUserTransactions, getFailureDetections, getFailureDetection, addFailureDetection, acknowledgeFailureDetection, deleteFailureDetection, getPriceHistory, addPriceEntry, getLowestPrice, getPriceStats, getPriceAlerts, getPriceAlert, addPriceAlert, updatePriceAlert, deletePriceAlert, checkPriceAlerts, triggerPriceAlert, getBuildPlates, getBuildPlate, addBuildPlate, updateBuildPlate, deleteBuildPlate, incrementBuildPlatePrintCount, getDryerModels, getDryerModel, addDryerModel, updateDryerModel, deleteDryerModel, getStorageConditions, getLatestStorageCondition, addStorageCondition, deleteStorageCondition, getCourses, getCourse, addCourse, updateCourse, deleteCourse, getCourseProgress, upsertCourseProgress, getUserCourseProgress, getAllCoursesWithProgress, searchSpoolsByColor, generateSpoolName, getEcomFees, getEcomFeesSummary, getEcomFeesTotal, getKbPrinters, getKbPrinter, addKbPrinter, updateKbPrinter, deleteKbPrinter, getKbAccessories, getKbAccessory, addKbAccessory, updateKbAccessory, deleteKbAccessory, getKbFilaments, getKbFilament, addKbFilament, updateKbFilament, deleteKbFilament, getKbProfiles, getKbProfile, addKbProfile, updateKbProfile, deleteKbProfile, searchKb, getKbStats, getKbTags, addKbTag, deleteKbTag, seedKbData, addBedMesh, getBedMeshHistory, getLatestBedMesh, deleteBedMesh, createFilamentChange, updateFilamentChange, getActiveFilamentChange, getFilamentChangeHistory, shareFilamentProfile, rateCommunityFilament, getCommunityFilamentRatings, submitTdVote, getTdVotes, importCommunityToInventory, mergeSpools, getFifoSpool, getCompatibilityMatrix, addCompatibilityRule, updateCompatibilityRule, deleteCompatibilityRule, getTemperatureGuide, matchPrinterForFilament, autoTrashEmptySpools, getRecentProfiles, getLocationAlerts, getSpoolBySlot, addLayerPause, getLayerPauses, getActiveLayerPauses, deleteLayerPause, deactivateLayerPauses, refillSpool, recalculateAllCosts, getHardwareStats, deduplicateHmsErrors, backfillWaste, getDailyActivity, getActivityStreaks, acknowledgeWearAlert, addMaintenanceCost, getMaintenanceCosts, getTotalMaintenanceCost, getProjectWithDetails, generateShareToken, getProjectByShareToken, createInvoice, getInvoice, getProjectInvoices, updateInvoiceStatus, addTimelineEvent, getProjectTimeline, getProjectCostSummary, getOverdueProjects, getProjectDashboard, getPlugins, getPlugin, getPluginById, registerPlugin, updatePluginEnabled, removePlugin, getPluginState, setPluginState, getPluginSettings, setPluginSettings, getProfiles, getProfileById, addProfile, updateProfile, deleteProfile, incrementProfileUse, addFilamentUsageSnapshot, getFilamentUsageHistory, getFilamentUsageTrend, getSpoolByTrayIdName, getPurchasedSpools, addPurchasedSpool, updatePurchasedSpool, deletePurchasedSpool, importPurchasedSpools, linkPurchasedToSpool, autoMatchTrayToSpool, autoCreateSpoolFromTray, correctRemainWeight, aggregateDailyFilamentUsage, backfillDailyUsage, getDailyFilamentUsage, getFilamentConsumptionSummary, getFilamentConsumptionByPrinter, getFilamentWeeklyTrend, updateConsumptionRates, getConsumptionRates, getSpoolDepletionForecast, getWasteAnalysis, getMaterialEfficiency, checkSpoolDepletionThresholds, getSpoolDepletionEvents, markDepletionNotified, getFilamentCostAnalysis, getExpiredSpools, getExpiringSpools, getMaterialSubstitutions, addMaterialSubstitution, deleteMaterialSubstitution, findSubstitutesForMaterial, getRalColors, findClosestRal, getStorageAlerts, getSpoolmanPerSpoolMetrics, getSpoolCoreWeights, addSpoolCoreWeight, getBambuFilamentCodes, lookupBambuCode, getSpoolKCalibrations, upsertSpoolKCalibration, getBestKValue, recordWeighing, getFilamentAccuracyStats, saveFilamentEstimate, getBambuVariants, lookupBambuVariant, lookupBambuByProductCode, enrichTrayWithVariant, getBambuMaterialNames, getBambuColorsByMaterial, linkScreenshotToPrint, getScreenshotsForPrint, addMqttDebugEntry, getMqttDebugLog, clearMqttDebugLog, checkFirmwareUpdate, setMaintenanceMode, getMaintenanceModePrinters, getActivityLog, reviewPrint, getUnreviewedPrints } from './database.js';
import { getCrmCustomers, getCrmCustomer, createCrmCustomer, updateCrmCustomer, deleteCrmCustomer, getCrmOrders, getCrmOrder, createCrmOrder, updateCrmOrder, updateCrmOrderStatus, createCrmOrderFromHistory, addCrmOrderItem, updateCrmOrderItem, removeCrmOrderItem, createCrmInvoice, getCrmInvoice, getCrmInvoices, updateCrmInvoiceStatus, getCrmDashboard, getCrmSettings, updateCrmSettings } from './database.js';
import { generateInvoiceHtml } from './crm-invoice.js';
import { createBackup, listBackups, restoreBackup, uploadBackup } from './backup.js';
import { saveConfig, config, DATA_DIR } from './config.js';
import { getThumbnail, getModel } from './thumbnail-service.js';
import { lookupHmsCode, getHmsWikiUrl } from './print-tracker.js';
import { parse3mf, parseGcode } from './file-parser.js';
import https from 'node:https';
import { inflateRawSync } from 'node:zlib';
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import { readFileSync, existsSync, statSync, createReadStream, writeFileSync, mkdirSync, unlinkSync, readdirSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isAuthEnabled, isMultiUser, validateCredentials, createSession, destroySession, getSessionToken, validateSession, hashPassword, validateApiKey, generateApiKey, hasPermission, validateCredentialsDB, getSessionUser, requirePermission } from './auth.js';
import { getSlicerStatus, getSlicerProfiles, saveUploadedFile, sliceFile, uploadToPrinter, cleanupJob, getJobFilePath } from './slicer-service.js';
import { buildPauseCommand, buildResumeCommand, buildGcodeMultiLine, buildFilamentUnloadSequence, buildFilamentLoadSequence, buildAmsTrayChangeCommand } from './mqtt-commands.js';
import { getSlicerJobs as dbGetSlicerJobs, getSlicerJob as dbGetSlicerJob, deleteSlicerJob as dbDeleteSlicerJob, getSlicerJobByFilename } from './database.js';
import * as _energy from './energy-service.js';
import * as _power from './power-monitor.js';
import { getMilestones, getMilestoneFile, getArchivedMilestones, getArchivedMilestoneFile } from './milestone-service.js';
import { generateReport, sendReportEmail, restartReportService } from './report-service.js';
import { restartHaDiscovery, getHaDiscoveryStatus } from './ha-discovery.js';
import { getRemoteNodeStates, restartRemoteNodes, testRemoteNode } from './remote-nodes.js';
import { getRemoteNodes, getRemoteNode, addRemoteNode, updateRemoteNode, deleteRemoteNode, getScheduledPrints, getScheduledPrint, addScheduledPrint, updateScheduledPrint, deleteScheduledPrint, getFileLibrary, getFileLibraryItem, addFileLibraryItem, updateFileLibraryItem, deleteFileLibraryItem, getFileLibraryCategories, incrementFileLibraryPrintCount, getWidgetLayouts, getActiveWidgetLayout, saveWidgetLayout, setActiveWidgetLayout, deleteWidgetLayout, getTimeTracking, addTimeTracking, getTimeTrackingStats, saveCostEstimate, getCostEstimates, getCostEstimate, deleteCostEstimate, getScreenshots, getScreenshotById, addScreenshot, deleteScreenshot, deleteScreenshotsBulk } from './database.js';
import { readFileSync as _readPkg } from 'node:fs';
import { createLogger } from './logger.js';
import { withBreaker, getAllBreakerStatus } from './circuit-breaker.js';
import { validate } from './validate.js';
import * as _filamentMaterials from './filament-materials.js';
const log = createLogger('api');

// ---- Validation schemas ----
// model is now free-text (maxLength 100) — no enum restriction for multi-brand support
const PRINTER_TYPES = ['bambu', 'moonraker', 'klipper', 'prusalink', 'creality', 'elegoo', 'anker', 'voron', 'ratrig', 'qidi'];

const PRINTER_SCHEMA = {
  name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
  ip: { type: 'string', pattern: /^\d{1,3}(\.\d{1,3}){3}$/ },
  serial: { type: 'string', maxLength: 200 },
  access_code: { type: 'string', maxLength: 200 },
  model: { type: 'string', maxLength: 100 },
  type: { type: 'string', enum: PRINTER_TYPES }
};

const PRINTER_UPDATE_SCHEMA = {
  name: { type: 'string', minLength: 1, maxLength: 100 },
  ip: { type: 'string', pattern: /^\d{1,3}(\.\d{1,3}){3}$/ },
  serial: { type: 'string', maxLength: 200 },
  access_code: { type: 'string', maxLength: 200 },
  model: { type: 'string', maxLength: 100 },
  type: { type: 'string', enum: PRINTER_TYPES }
};

const PROFILE_SCHEMA = {
  name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
  filament_type: { type: 'string', maxLength: 50 },
  nozzle_temp: { type: 'number', min: 0, max: 500 },
  bed_temp: { type: 'number', min: 0, max: 150 },
  speed: { type: 'number', min: 0 }
};

const WEBHOOK_SCHEMA = {
  name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
  url: { type: 'url', required: true },
  events: { type: 'string' }
};

// Server start time (ISO)
const _serverStartTime = new Date().toISOString();

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
let _wearPrediction = null;
let _materialRecommender = null;
let _errorPatternAnalyzer = null;
let _pluginManager = null;

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
  if (path.startsWith('/api/network')) return 'admin';
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
  if (path.startsWith('/api/backup')) return 'admin';
  if (path.startsWith('/api/timelapse') && method === 'DELETE') return 'admin';
  if (path.startsWith('/api/plugins') && method !== 'GET') return 'admin';
  if (path.startsWith('/api/remote-nodes') || path.startsWith('/api/ha-discovery')) return 'admin';
  if (path.startsWith('/api/scheduler') && (method === 'POST' || method === 'PUT' || method === 'DELETE')) return 'controls';
  if (path.startsWith('/api/library') && (method === 'POST' || method === 'PUT' || method === 'DELETE')) return 'controls';
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

export function setWearPrediction(wp) {
  _wearPrediction = wp;
}

export function setMaterialRecommender(mr) {
  _materialRecommender = mr;
}

export function setErrorPatternAnalyzer(epa) {
  _errorPatternAnalyzer = epa;
}

export function setPluginManager(pm) {
  _pluginManager = pm;
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
      return readBody(req, res, (body) => {
        const { password, username } = body;
        // Try DB-backed auth first (returns user object with role/permissions)
        const dbUser = validateCredentialsDB(username, password);
        if (dbUser) {
          const token = createSession(dbUser);
          const maxAge = (config.auth?.sessionDurationHours || 24) * 3600;
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Set-Cookie': `bambu_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${config.server?.forceHttps !== false ? '; Secure' : ''}`
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
          'Set-Cookie': `bambu_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${config.server?.forceHttps !== false ? '; Secure' : ''}`
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
    log.error('Auth-api error: ' + e.message);
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

  // Public shared project status — always accessible, no auth required
  const sharedMatch = path.match(/^\/api\/shared\/([a-f0-9-]+)$/);
  if (method === 'GET' && sharedMatch) {
    const project = getProjectByShareToken(sharedMatch[1]);
    if (!project) return sendJson(res, { error: 'Not found' }, 404);
    return sendJson(res, {
      name: project.name,
      status: project.status,
      description: project.description,
      deadline: project.deadline,
      customer_name: project.customer_name,
      prints: (project.prints || []).map(p => ({
        filename: p.print_filename || p.filename,
        status: p.print_status || p.status,
        filament_used_g: p.filament_used_g
      })),
      total_prints: project.total_prints,
      completed_prints: project.completed_prints
    });
  }

  // Public status endpoint — always accessible, no auth required
  if (method === 'GET' && path === '/api/status/public') {
    const enabled = getInventorySetting('public_status_enabled');
    if (enabled !== '1' && enabled !== 'true') return sendJson(res, { error: 'Public status page is disabled' }, 403);
    return sendJson(res, _getPublicStatus());
  }

  // Health check — no auth required (useful for monitoring tools and Docker health checks)
  if (method === 'GET' && path === '/api/health') {
    const health = {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      version: _pkgVersion,
      node: process.version,
      timestamp: new Date().toISOString()
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(health));
    return;
  }

  // Prometheus-compatible metrics endpoint — no auth required
  if (method === 'GET' && path === '/api/metrics') {
    const metrics = _collectMetrics();
    res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' });
    res.end(metrics);
    return;
  }

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
        // Combined scan: Bambu SSDP + Moonraker HTTP probing
        const found = await _discovery.scanAll();
        const existing = getPrinters();
        const existingSerials = existing.map(p => p.serial);
        const existingIps = existing.map(p => p.ip);
        const printers = found.map(p => ({
          ...p,
          alreadyAdded: existingSerials.includes(p.serial) || existingIps.includes(p.ip)
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
      return readBody(req, res, async (body) => {
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

    // ---- Network Settings ----

    if (method === 'GET' && path === '/api/network/settings') {
      const net = config.network || {};
      const subnets = _printerManager?._getLocalSubnets() || [];
      return sendJson(res, {
        extraSubnets: net.extraSubnets || [],
        rediscoveryIntervalSeconds: net.rediscoveryIntervalSeconds || 60,
        scanTimeoutMs: net.scanTimeoutMs || 5000,
        detectedSubnets: subnets.filter(s => !(net.extraSubnets || []).some(e => e.replace(/\/\d+$/, '').startsWith(s.replace(/\.0$/, ''))))
      });
    }

    if (method === 'PUT' && path === '/api/network/settings') {
      return readBody(req, res, (body) => {
        const updates = {};
        if (Array.isArray(body.extraSubnets)) {
          updates.extraSubnets = body.extraSubnets.filter(s => typeof s === 'string' && s.trim()).map(s => s.trim());
        }
        if (typeof body.rediscoveryIntervalSeconds === 'number' && body.rediscoveryIntervalSeconds >= 10) {
          updates.rediscoveryIntervalSeconds = body.rediscoveryIntervalSeconds;
        }
        if (typeof body.scanTimeoutMs === 'number' && body.scanTimeoutMs >= 1000) {
          updates.scanTimeoutMs = body.scanTimeoutMs;
        }
        config.network = { ...(config.network || {}), ...updates };
        saveConfig({ network: config.network });
        sendJson(res, { ok: true, network: config.network });
      });
    }

    if (method === 'POST' && path === '/api/network/scan') {
      // Full network scan: SSDP for Bambu + Moonraker scan on all subnets
      try {
        const results = { bambu: [], moonraker: [] };

        // SSDP scan for Bambu printers
        if (_discovery) {
          const found = await _discovery.scan(config.network?.scanTimeoutMs || 5000);
          const existing = getPrinters().map(p => p.serial);
          results.bambu = found.map(p => ({ ...p, alreadyAdded: existing.includes(p.serial) }));
        }

        // Moonraker scan on all known subnets
        if (_printerManager) {
          const subnets = _printerManager._getLocalSubnets();
          const existingIps = getPrinters().map(p => p.ip);
          for (const subnet of subnets) {
            const found = await _printerManager._scanSubnetForMoonraker(subnet, { port: 80 }, true);
            for (const printer of found) {
              results.moonraker.push({
                ...printer,
                alreadyAdded: existingIps.includes(printer.ip)
              });
            }
          }
        }

        return sendJson(res, results);
      } catch (e) {
        return sendJson(res, { error: e.message }, 500);
      }
    }

    // ---- Bambu Lab Cloud ----
    if (method === 'GET' && path === '/api/bambu-cloud/status') {
      if (!_bambuCloud) return sendJson(res, { authenticated: false });
      return sendJson(res, _bambuCloud.getStatus());
    }

    if (method === 'POST' && path === '/api/bambu-cloud/login') {
      if (!_bambuCloud) return sendJson(res, { error: 'Cloud not available' }, 503);
      return readBody(req, res, async (body) => {
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
      return readBody(req, res, async (body) => {
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
            log.error('Cloud-import failed to add: ' + filename + ' ' + e.message);
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

    if (method === 'POST' && path === '/api/bambu-cloud/refresh-token') {
      if (!_bambuCloud) return sendJson(res, { error: 'Cloud not available' }, 503);
      try {
        const result = await _bambuCloud.refreshToken();
        return sendJson(res, result);
      } catch (e) {
        return sendJson(res, { error: e.message }, 401);
      }
    }

    if (method === 'GET' && path === '/api/bambu-cloud/printer-status') {
      if (!_bambuCloud || !_bambuCloud.isAuthenticated()) return sendJson(res, { error: 'Not authenticated' }, 401);
      try {
        const data = await _bambuCloud.getPrinterStatus();
        return sendJson(res, data);
      } catch (e) {
        return sendJson(res, { error: e.message }, 500);
      }
    }

    if (method === 'GET' && path === '/api/bambu-cloud/device-version') {
      if (!_bambuCloud || !_bambuCloud.isAuthenticated()) return sendJson(res, { error: 'Not authenticated' }, 401);
      try {
        const data = await _bambuCloud.getDeviceVersion();
        return sendJson(res, data);
      } catch (e) {
        return sendJson(res, { error: e.message }, 500);
      }
    }

    if (method === 'PATCH' && path === '/api/bambu-cloud/device-info') {
      if (!_bambuCloud || !_bambuCloud.isAuthenticated()) return sendJson(res, { error: 'Not authenticated' }, 401);
      return readBody(req, res, async (body) => {
        try {
          const data = await _bambuCloud.updateDeviceInfo(body);
          sendJson(res, data);
        } catch (e) {
          sendJson(res, { error: e.message }, 500);
        }
      });
    }

    if (method === 'GET' && path.startsWith('/api/bambu-cloud/task/')) {
      if (!_bambuCloud || !_bambuCloud.isAuthenticated()) return sendJson(res, { error: 'Not authenticated' }, 401);
      const taskId = path.split('/api/bambu-cloud/task/')[1];
      if (!taskId) return sendJson(res, { error: 'Task ID required' }, 400);
      try {
        const data = await _bambuCloud.getTask(taskId);
        return sendJson(res, data);
      } catch (e) {
        return sendJson(res, { error: e.message }, 500);
      }
    }

    if (method === 'GET' && path === '/api/bambu-cloud/notification') {
      if (!_bambuCloud || !_bambuCloud.isAuthenticated()) return sendJson(res, { error: 'Not authenticated' }, 401);
      try {
        const data = await _bambuCloud.getNotification();
        return sendJson(res, data);
      } catch (e) {
        return sendJson(res, { error: e.message }, 500);
      }
    }

    if (method === 'GET' && path === '/api/bambu-cloud/projects') {
      if (!_bambuCloud || !_bambuCloud.isAuthenticated()) return sendJson(res, { error: 'Not authenticated' }, 401);
      try {
        const data = await _bambuCloud.getProjects();
        return sendJson(res, data);
      } catch (e) {
        return sendJson(res, { error: e.message }, 500);
      }
    }

    if (method === 'GET' && path.startsWith('/api/bambu-cloud/project/')) {
      if (!_bambuCloud || !_bambuCloud.isAuthenticated()) return sendJson(res, { error: 'Not authenticated' }, 401);
      const projectId = path.split('/api/bambu-cloud/project/')[1];
      if (!projectId) return sendJson(res, { error: 'Project ID required' }, 400);
      try {
        const data = await _bambuCloud.getProject(projectId);
        return sendJson(res, data);
      } catch (e) {
        return sendJson(res, { error: e.message }, 500);
      }
    }

    if (method === 'GET' && path === '/api/bambu-cloud/messages') {
      if (!_bambuCloud || !_bambuCloud.isAuthenticated()) return sendJson(res, { error: 'Not authenticated' }, 401);
      const params = new URL(req.url, 'http://localhost').searchParams;
      try {
        const data = await _bambuCloud.getMessages(
          params.get('type') || 'all',
          parseInt(params.get('limit')) || 20,
          parseInt(params.get('offset')) || 0
        );
        return sendJson(res, data);
      } catch (e) {
        return sendJson(res, { error: e.message }, 500);
      }
    }

    if (method === 'GET' && path === '/api/bambu-cloud/message-count') {
      if (!_bambuCloud || !_bambuCloud.isAuthenticated()) return sendJson(res, { error: 'Not authenticated' }, 401);
      try {
        const data = await _bambuCloud.getMessageCount();
        return sendJson(res, data);
      } catch (e) {
        return sendJson(res, { error: e.message }, 500);
      }
    }

    if (method === 'POST' && path === '/api/bambu-cloud/messages/read') {
      if (!_bambuCloud || !_bambuCloud.isAuthenticated()) return sendJson(res, { error: 'Not authenticated' }, 401);
      return readBody(req, res, async (body) => {
        try {
          const data = await _bambuCloud.markMessagesRead(body.messageIds || []);
          sendJson(res, data);
        } catch (e) {
          sendJson(res, { error: e.message }, 500);
        }
      });
    }

    if (method === 'GET' && path === '/api/bambu-cloud/slicer-settings') {
      if (!_bambuCloud || !_bambuCloud.isAuthenticated()) return sendJson(res, { error: 'Not authenticated' }, 401);
      try {
        const data = await _bambuCloud.getSlicerSettings();
        return sendJson(res, data);
      } catch (e) {
        return sendJson(res, { error: e.message }, 500);
      }
    }

    if (method === 'GET' && path.startsWith('/api/bambu-cloud/slicer-setting/')) {
      if (!_bambuCloud || !_bambuCloud.isAuthenticated()) return sendJson(res, { error: 'Not authenticated' }, 401);
      const settingId = path.split('/api/bambu-cloud/slicer-setting/')[1];
      if (!settingId) return sendJson(res, { error: 'Setting ID required' }, 400);
      try {
        const data = await _bambuCloud.getSlicerSetting(settingId);
        return sendJson(res, data);
      } catch (e) {
        return sendJson(res, { error: e.message }, 500);
      }
    }

    if (method === 'GET' && path === '/api/bambu-cloud/design-search') {
      if (!_bambuCloud || !_bambuCloud.isAuthenticated()) return sendJson(res, { error: 'Not authenticated' }, 401);
      const params = new URL(req.url, 'http://localhost').searchParams;
      const query = params.get('q');
      if (!query) return sendJson(res, { error: 'Query parameter "q" required' }, 400);
      try {
        const data = await _bambuCloud.searchDesigns(
          query,
          parseInt(params.get('limit')) || 20,
          parseInt(params.get('offset')) || 0
        );
        return sendJson(res, data);
      } catch (e) {
        return sendJson(res, { error: e.message }, 500);
      }
    }

    if (method === 'GET' && path.startsWith('/api/bambu-cloud/design/')) {
      if (!_bambuCloud || !_bambuCloud.isAuthenticated()) return sendJson(res, { error: 'Not authenticated' }, 401);
      const parts = path.split('/');
      const designId = parts[4];
      if (!designId) return sendJson(res, { error: 'Design ID required' }, 400);
      try {
        // /api/bambu-cloud/design/:id/3mf
        if (parts[5] === '3mf') {
          const data = await _bambuCloud.getDesign3mf(designId);
          return sendJson(res, data);
        }
        const data = await _bambuCloud.getDesign(designId);
        return sendJson(res, data);
      } catch (e) {
        return sendJson(res, { error: e.message }, 500);
      }
    }

    // ---- Cloud File Upload & Print ----

    if (method === 'POST' && path === '/api/bambu-cloud/upload') {
      if (!_bambuCloud || !_bambuCloud.isAuthenticated()) return sendJson(res, { error: 'Not authenticated' }, 401);
      const params = new URL(req.url, 'http://localhost').searchParams;
      const filename = params.get('filename');
      if (!filename) return sendJson(res, { error: 'Filename required (?filename=)' }, 400);
      // Collect raw body
      const chunks = [];
      req.on('data', c => chunks.push(c));
      req.on('end', async () => {
        try {
          const buf = Buffer.concat(chunks);
          if (buf.length === 0) return sendJson(res, { error: 'Tom fil' }, 400);
          const result = await _bambuCloud.uploadFileToCloud(filename, buf);
          sendJson(res, result, 201);
        } catch (e) {
          sendJson(res, { error: e.message }, 500);
        }
      });
      return;
    }

    if (method === 'GET' && path === '/api/bambu-cloud/upload-url') {
      if (!_bambuCloud || !_bambuCloud.isAuthenticated()) return sendJson(res, { error: 'Not authenticated' }, 401);
      const params = new URL(req.url, 'http://localhost').searchParams;
      const filename = params.get('filename');
      if (!filename) return sendJson(res, { error: 'Filename required' }, 400);
      try {
        const data = await _bambuCloud.getUploadUrl(filename);
        return sendJson(res, data);
      } catch (e) {
        return sendJson(res, { error: e.message }, 500);
      }
    }

    if (method === 'POST' && path === '/api/bambu-cloud/cloud-print') {
      if (!_bambuCloud || !_bambuCloud.isAuthenticated()) return sendJson(res, { error: 'Not authenticated' }, 401);
      return readBody(req, res, async (body) => {
        const { device_id, filename, url, settings } = body;
        if (!device_id || !filename) return sendJson(res, { error: 'device_id and filename required' }, 400);
        try {
          const data = await _bambuCloud.startCloudPrint(device_id, filename, url, settings || {});
          sendJson(res, data);
        } catch (e) {
          sendJson(res, { error: e.message }, 500);
        }
      });
    }

    if (method === 'POST' && path === '/api/bambu-cloud/create-task') {
      if (!_bambuCloud || !_bambuCloud.isAuthenticated()) return sendJson(res, { error: 'Not authenticated' }, 401);
      return readBody(req, res, async (body) => {
        try {
          const data = await _bambuCloud.createTask(body);
          sendJson(res, data, 201);
        } catch (e) {
          sendJson(res, { error: e.message }, 500);
        }
      });
    }

    // ---- Device Binding ----

    if (method === 'POST' && path === '/api/bambu-cloud/bind') {
      if (!_bambuCloud || !_bambuCloud.isAuthenticated()) return sendJson(res, { error: 'Not authenticated' }, 401);
      return readBody(req, res, async (body) => {
        const { device_id, access_code } = body;
        if (!device_id || !access_code) return sendJson(res, { error: 'device_id and access_code required' }, 400);
        try {
          const data = await _bambuCloud.bindDevice(device_id, access_code);
          sendJson(res, data);
        } catch (e) {
          sendJson(res, { error: e.message }, 500);
        }
      });
    }

    if (method === 'DELETE' && path === '/api/bambu-cloud/bind') {
      if (!_bambuCloud || !_bambuCloud.isAuthenticated()) return sendJson(res, { error: 'Not authenticated' }, 401);
      const params = new URL(req.url, 'http://localhost').searchParams;
      const deviceId = params.get('device_id');
      if (!deviceId) return sendJson(res, { error: 'device_id required' }, 400);
      try {
        const data = await _bambuCloud.unbindDevice(deviceId);
        return sendJson(res, data);
      } catch (e) {
        return sendJson(res, { error: e.message }, 500);
      }
    }

    // ---- Cloud Video & Profile ----

    if (method === 'GET' && path === '/api/bambu-cloud/video-url') {
      if (!_bambuCloud || !_bambuCloud.isAuthenticated()) return sendJson(res, { error: 'Not authenticated' }, 401);
      const params = new URL(req.url, 'http://localhost').searchParams;
      const deviceId = params.get('device_id');
      if (!deviceId) return sendJson(res, { error: 'device_id required' }, 400);
      try {
        const data = await _bambuCloud.getCloudVideoUrl(deviceId);
        return sendJson(res, data);
      } catch (e) {
        return sendJson(res, { error: e.message }, 500);
      }
    }

    if (method === 'GET' && path === '/api/bambu-cloud/profile') {
      if (!_bambuCloud || !_bambuCloud.isAuthenticated()) return sendJson(res, { error: 'Not authenticated' }, 401);
      try {
        const data = await _bambuCloud.getUserProfile();
        return sendJson(res, data);
      } catch (e) {
        return sendJson(res, { error: e.message }, 500);
      }
    }

    if (method === 'PUT' && path === '/api/bambu-cloud/profile') {
      if (!_bambuCloud || !_bambuCloud.isAuthenticated()) return sendJson(res, { error: 'Not authenticated' }, 401);
      return readBody(req, res, async (body) => {
        try {
          const data = await _bambuCloud.updateUserProfile(body);
          sendJson(res, data);
        } catch (e) {
          sendJson(res, { error: e.message }, 500);
        }
      });
    }

    if (method === 'GET' && path === '/api/bambu-cloud/preferences') {
      if (!_bambuCloud || !_bambuCloud.isAuthenticated()) return sendJson(res, { error: 'Not authenticated' }, 401);
      try {
        const data = await _bambuCloud.getUserPreferences();
        return sendJson(res, data);
      } catch (e) {
        return sendJson(res, { error: e.message }, 500);
      }
    }

    if (method === 'GET' && path === '/api/bambu-cloud/files') {
      if (!_bambuCloud || !_bambuCloud.isAuthenticated()) return sendJson(res, { error: 'Not authenticated' }, 401);
      const params = new URL(req.url, 'http://localhost').searchParams;
      try {
        const data = await _bambuCloud.getCloudFiles(
          parseInt(params.get('limit')) || 50,
          parseInt(params.get('offset')) || 0
        );
        return sendJson(res, data);
      } catch (e) {
        return sendJson(res, { error: e.message }, 500);
      }
    }

    if (method === 'POST' && path === '/api/bambu-cloud/send-code') {
      if (!_bambuCloud) return sendJson(res, { error: 'Cloud not available' }, 503);
      return readBody(req, res, async (body) => {
        const { email } = body;
        if (!email) return sendJson(res, { error: 'Email required' }, 400);
        try {
          const data = await _bambuCloud.sendVerificationEmail(email);
          sendJson(res, data);
        } catch (e) {
          sendJson(res, { error: e.message }, 500);
        }
      });
    }

    // ---- Filament Usage History ----

    if (method === 'GET' && path === '/api/filament-tracker/usage-history') {
      const params = new URL(req.url, 'http://localhost').searchParams;
      const data = getFilamentUsageHistory({
        printer_id: params.get('printer_id'),
        tray_id_name: params.get('tray_id_name'),
        spool_id: params.get('spool_id') ? parseInt(params.get('spool_id')) : null,
        from: params.get('from'),
        to: params.get('to'),
        limit: parseInt(params.get('limit')) || 500,
      });
      return sendJson(res, data);
    }

    if (method === 'GET' && path === '/api/filament-tracker/usage-trend') {
      const params = new URL(req.url, 'http://localhost').searchParams;
      const trayIdName = params.get('tray_id_name');
      if (!trayIdName) return sendJson(res, { error: 'tray_id_name required' }, 400);
      const data = getFilamentUsageTrend(trayIdName, parseInt(params.get('days')) || 30);
      return sendJson(res, data);
    }

    if (method === 'GET' && path === '/api/filament-tracker/spool-by-tray') {
      const params = new URL(req.url, 'http://localhost').searchParams;
      const trayIdName = params.get('tray_id_name');
      if (!trayIdName) return sendJson(res, { error: 'tray_id_name required' }, 400);
      const spool = getSpoolByTrayIdName(trayIdName);
      return sendJson(res, spool || { error: 'No spool matched' }, spool ? 200 : 404);
    }

    // ---- Purchased Spools ----

    if (method === 'GET' && path === '/api/filament-tracker/purchased') {
      return sendJson(res, getPurchasedSpools());
    }

    if (method === 'POST' && path === '/api/filament-tracker/purchased') {
      return readBody(req, res, (body) => {
        if (!body.name) return sendJson(res, { error: 'Name required' }, 400);
        const result = addPurchasedSpool(body);
        _broadcastInventory('created', 'purchased_spool', result);
        sendJson(res, result, 201);
      });
    }

    if (method === 'PUT' && path.startsWith('/api/filament-tracker/purchased/')) {
      const id = parseInt(path.split('/').pop());
      if (!id) return sendJson(res, { error: 'Invalid ID' }, 400);
      return readBody(req, res, (body) => {
        if (!body.name) return sendJson(res, { error: 'Name required' }, 400);
        updatePurchasedSpool(id, body);
        _broadcastInventory('updated', 'purchased_spool', { id });
        sendJson(res, { ok: true });
      });
    }

    if (method === 'DELETE' && path.startsWith('/api/filament-tracker/purchased/')) {
      const id = parseInt(path.split('/').pop());
      if (!id) return sendJson(res, { error: 'Invalid ID' }, 400);
      deletePurchasedSpool(id);
      _broadcastInventory('deleted', 'purchased_spool', { id });
      return sendJson(res, { ok: true });
    }

    if (method === 'POST' && path === '/api/filament-tracker/purchased/import') {
      return readBody(req, res, (body) => {
        const spools = body.spools || body;
        if (!Array.isArray(spools)) return sendJson(res, { error: 'Array of spools required' }, 400);
        const result = importPurchasedSpools(spools);
        _broadcastInventory('imported', 'purchased_spool', result);
        sendJson(res, result, 201);
      });
    }

    if (method === 'POST' && path === '/api/filament-tracker/purchased/link') {
      return readBody(req, res, (body) => {
        const { purchased_id, spool_id } = body;
        if (!purchased_id || !spool_id) return sendJson(res, { error: 'purchased_id and spool_id required' }, 400);
        linkPurchasedToSpool(purchased_id, spool_id);
        _broadcastInventory('linked', 'purchased_spool', { purchased_id, spool_id });
        sendJson(res, { ok: true });
      });
    }

    // ---- Filament Analytics ----

    if (method === 'GET' && path === '/api/filament-analytics/consumption') {
      const params = new URL(req.url, 'http://localhost').searchParams;
      const days = parseInt(params.get('days')) || 30;
      return sendJson(res, getFilamentConsumptionSummary(days));
    }

    if (method === 'GET' && path === '/api/filament-analytics/consumption-by-printer') {
      const params = new URL(req.url, 'http://localhost').searchParams;
      return sendJson(res, getFilamentConsumptionByPrinter(parseInt(params.get('days')) || 30));
    }

    if (method === 'GET' && path === '/api/filament-analytics/daily') {
      const params = new URL(req.url, 'http://localhost').searchParams;
      return sendJson(res, getDailyFilamentUsage({
        from: params.get('from'),
        to: params.get('to'),
        material: params.get('material'),
        printer_id: params.get('printer_id'),
        brand: params.get('brand'),
        limit: parseInt(params.get('limit')) || 365,
      }));
    }

    if (method === 'GET' && path === '/api/filament-analytics/weekly-trend') {
      const params = new URL(req.url, 'http://localhost').searchParams;
      return sendJson(res, getFilamentWeeklyTrend(parseInt(params.get('weeks')) || 12));
    }

    if (method === 'GET' && path === '/api/filament-analytics/consumption-rates') {
      return sendJson(res, getConsumptionRates());
    }

    if (method === 'GET' && path === '/api/filament-analytics/depletion-forecast') {
      return sendJson(res, getSpoolDepletionForecast());
    }

    if (method === 'GET' && path === '/api/filament-analytics/waste') {
      const params = new URL(req.url, 'http://localhost').searchParams;
      return sendJson(res, getWasteAnalysis(parseInt(params.get('days')) || 30));
    }

    if (method === 'GET' && path === '/api/filament-analytics/material-efficiency') {
      const params = new URL(req.url, 'http://localhost').searchParams;
      return sendJson(res, getMaterialEfficiency(parseInt(params.get('days')) || 30));
    }

    if (method === 'GET' && path === '/api/filament-analytics/cost') {
      return sendJson(res, getFilamentCostAnalysis());
    }

    if (method === 'GET' && path === '/api/filament-analytics/depletion-events') {
      const params = new URL(req.url, 'http://localhost').searchParams;
      const spoolId = params.get('spool_id') ? parseInt(params.get('spool_id')) : null;
      return sendJson(res, getSpoolDepletionEvents(spoolId));
    }

    if (method === 'POST' && path === '/api/filament-analytics/recalculate') {
      try {
        const daily = backfillDailyUsage(90);
        const rates = updateConsumptionRates();
        return sendJson(res, { ok: true, daily_rows: daily, rate_rows: rates });
      } catch (e) {
        return sendJson(res, { error: e.message }, 500);
      }
    }

    if (method === 'POST' && path === '/api/filament-analytics/auto-match') {
      return readBody(req, res, (body) => {
        const { tray_color, tray_type, tray_sub_brands, tray_weight, printer_id, ams_unit, tray_id } = body;
        if (!printer_id) return sendJson(res, { error: 'printer_id required' }, 400);
        const spool = autoMatchTrayToSpool(tray_color, tray_type, tray_sub_brands, tray_weight, printer_id, ams_unit ?? 0, tray_id ?? 0);
        return sendJson(res, spool || { matched: false }, spool ? 200 : 404);
      });
    }

    if (method === 'POST' && path === '/api/filament-analytics/auto-create-spool') {
      return readBody(req, res, (body) => {
        const { tray, printer_id, ams_unit, tray_id } = body;
        if (!tray || !printer_id) return sendJson(res, { error: 'tray and printer_id required' }, 400);
        const result = autoCreateSpoolFromTray(tray, printer_id, ams_unit ?? 0, tray_id ?? 0);
        _broadcastInventory('created', 'spool', result);
        sendJson(res, result, 201);
      });
    }

    // ---- Expiry & Substitution ----

    if (method === 'GET' && path === '/api/filament-analytics/expired') {
      return sendJson(res, getExpiredSpools());
    }

    if (method === 'GET' && path === '/api/filament-analytics/expiring') {
      const params = new URL(req.url, 'http://localhost').searchParams;
      return sendJson(res, getExpiringSpools(parseInt(params.get('days')) || 30));
    }

    if (method === 'GET' && path === '/api/filament-analytics/substitutions') {
      const params = new URL(req.url, 'http://localhost').searchParams;
      return sendJson(res, getMaterialSubstitutions(params.get('material') || null));
    }

    if (method === 'POST' && path === '/api/filament-analytics/substitutions') {
      return readBody(req, res, (body) => {
        if (!body.material || !body.substitute_material) return sendJson(res, { error: 'material and substitute_material required' }, 400);
        addMaterialSubstitution(body);
        sendJson(res, { ok: true }, 201);
      });
    }

    if (method === 'DELETE' && path.startsWith('/api/filament-analytics/substitutions/')) {
      const id = parseInt(path.split('/').pop());
      if (!id) return sendJson(res, { error: 'Invalid ID' }, 400);
      deleteMaterialSubstitution(id);
      return sendJson(res, { ok: true });
    }

    if (method === 'GET' && path === '/api/filament-analytics/find-substitutes') {
      const params = new URL(req.url, 'http://localhost').searchParams;
      const material = params.get('material');
      if (!material) return sendJson(res, { error: 'material required' }, 400);
      return sendJson(res, findSubstitutesForMaterial(material));
    }

    // ---- RAL/Color ----

    if (method === 'GET' && path === '/api/filament-analytics/ral-colors') {
      return sendJson(res, getRalColors());
    }

    if (method === 'GET' && path === '/api/filament-analytics/closest-ral') {
      const params = new URL(req.url, 'http://localhost').searchParams;
      const hex = params.get('hex');
      if (!hex) return sendJson(res, { error: 'hex required' }, 400);
      const result = findClosestRal(hex);
      return sendJson(res, result || { error: 'No match' }, result ? 200 : 404);
    }

    // ---- Storage Alerts ----

    if (method === 'GET' && path === '/api/filament-analytics/storage-alerts') {
      return sendJson(res, getStorageAlerts());
    }

    // ---- Spool Core Weights & Bambu Codes ----

    if (method === 'GET' && path === '/api/filament-analytics/core-weights') {
      const params = new URL(req.url, 'http://localhost').searchParams;
      return sendJson(res, getSpoolCoreWeights(params.get('search') || null));
    }

    if (method === 'POST' && path === '/api/filament-analytics/core-weights') {
      return readBody(req, res, (body) => {
        if (!body.brand_name || !body.weight_g) return sendJson(res, { error: 'brand_name and weight_g required' }, 400);
        addSpoolCoreWeight(body.brand_name, body.weight_g, body.spool_type);
        sendJson(res, { ok: true }, 201);
      });
    }

    if (method === 'GET' && path === '/api/filament-analytics/bambu-codes') {
      const params = new URL(req.url, 'http://localhost').searchParams;
      return sendJson(res, getBambuFilamentCodes(params.get('material') || null));
    }

    if (method === 'GET' && path.startsWith('/api/filament-analytics/bambu-code/')) {
      const code = path.split('/api/filament-analytics/bambu-code/')[1];
      const result = lookupBambuCode(code);
      return sendJson(res, result || { error: 'Code not found' }, result ? 200 : 404);
    }

    // ---- K-factor Calibrations ----

    if (method === 'GET' && path.startsWith('/api/filament-analytics/k-calibrations/')) {
      const spoolId = parseInt(path.split('/').pop());
      if (!spoolId) return sendJson(res, { error: 'Invalid spool ID' }, 400);
      return sendJson(res, getSpoolKCalibrations(spoolId));
    }

    if (method === 'POST' && path === '/api/filament-analytics/k-calibrations') {
      return readBody(req, res, (body) => {
        if (!body.spool_id || !body.printer_id || body.k_value == null) {
          return sendJson(res, { error: 'spool_id, printer_id, and k_value required' }, 400);
        }
        upsertSpoolKCalibration(body);
        sendJson(res, { ok: true }, 201);
      });
    }

    if (method === 'GET' && path === '/api/filament-analytics/best-k') {
      const params = new URL(req.url, 'http://localhost').searchParams;
      const spoolId = parseInt(params.get('spool_id'));
      const printerId = params.get('printer_id');
      if (!spoolId || !printerId) return sendJson(res, { error: 'spool_id and printer_id required' }, 400);
      const k = getBestKValue(spoolId, printerId,
        parseFloat(params.get('nozzle_diameter')) || 0.4,
        params.get('nozzle_type') || 'standard');
      return sendJson(res, { k_value: k });
    }

    // ---- Enhanced Weighing ----

    if (method === 'POST' && path === '/api/filament-analytics/weigh') {
      return readBody(req, res, (body) => {
        if (!body.spool_id || body.gross_weight_g == null) {
          return sendJson(res, { error: 'spool_id and gross_weight_g required' }, 400);
        }
        try {
          const result = recordWeighing(body.spool_id, body.gross_weight_g);
          if (!result) return sendJson(res, { error: 'Spool not found' }, 404);
          _broadcastInventory('weighed', 'spool', { spool_id: body.spool_id, ...result });
          sendJson(res, result);
        } catch (e) {
          sendJson(res, { error: e.message }, 500);
        }
      });
    }

    // ---- Filament Estimation Accuracy ----

    if (method === 'GET' && path === '/api/filament-analytics/accuracy') {
      return sendJson(res, getFilamentAccuracyStats());
    }

    // ---- Bambu Lab RFID Variant Database ----

    if (method === 'GET' && path === '/api/bambu/variants') {
      const params = new URL(req.url, 'http://localhost').searchParams;
      return sendJson(res, getBambuVariants({
        material_id: params.get('material_id'),
        material_name: params.get('material_name'),
        search: params.get('search'),
      }));
    }

    if (method === 'GET' && path.startsWith('/api/bambu/variant/')) {
      const variantId = decodeURIComponent(path.split('/api/bambu/variant/')[1]);
      const result = lookupBambuVariant(variantId);
      return sendJson(res, result || { error: 'Variant not found' }, result ? 200 : 404);
    }

    if (method === 'GET' && path.startsWith('/api/bambu/product/')) {
      const code = path.split('/api/bambu/product/')[1];
      const result = lookupBambuByProductCode(code);
      return sendJson(res, result || { error: 'Product code not found' }, result ? 200 : 404);
    }

    if (method === 'GET' && path === '/api/bambu/enrich-tray') {
      const params = new URL(req.url, 'http://localhost').searchParams;
      const trayIdName = params.get('tray_id_name');
      if (!trayIdName) return sendJson(res, { error: 'tray_id_name required' }, 400);
      const result = enrichTrayWithVariant(trayIdName);
      return sendJson(res, result || { error: 'No match' }, result ? 200 : 404);
    }

    if (method === 'GET' && path === '/api/bambu/materials') {
      return sendJson(res, getBambuMaterialNames());
    }

    if (method === 'GET' && path === '/api/bambu/colors') {
      const params = new URL(req.url, 'http://localhost').searchParams;
      const materialName = params.get('material_name');
      if (!materialName) return sendJson(res, { error: 'material_name required' }, 400);
      return sendJson(res, getBambuColorsByMaterial(materialName));
    }

    // ---- Print Stage Codes ----
    if (method === 'GET' && path === '/api/bambu/print-stages') {
      // Returns all 36 stage codes with English labels
      // This is served from the frontend's print-stages.js, but also available via API
      const stages = {};
      for (let i = 0; i <= 35; i++) {
        stages[i] = {
          nb: ['Printing','Auto bed leveling','Heatbed preheating','Sweeping XY mech mode','Changing filament',
               'M400 pause','Paused: filament runout','Heating hotend','Calibrating extrusion','Scanning bed surface',
               'Inspecting first layer','Identifying build plate','Calibrating Micro Lidar','Homing toolhead',
               'Cleaning nozzle tip','Checking extruder temp','Paused by user','Paused: front cover falling',
               'Calibrating Micro Lidar','Calibrating extrusion flow','Paused: nozzle temp malfunction',
               'Paused: bed temp malfunction','Filament unloading','Skip step pause','Filament loading',
               'Motor noise calibration','Paused: AMS lost','Paused: heatbreak fan low','Paused: chamber temp error',
               'Cooling chamber','Paused by G-code','Motor noise showoff','Paused: nozzle filament covered',
               'Paused: cutter error','Paused: first layer error','Paused: nozzle clog'][i],
          en: ['Printing','Auto bed leveling','Heatbed preheating','Sweeping XY mech mode','Changing filament',
               'M400 pause','Paused: filament runout','Heating hotend','Calibrating extrusion','Scanning bed surface',
               'Inspecting first layer','Identifying build plate','Calibrating Micro Lidar','Homing toolhead',
               'Cleaning nozzle tip','Checking extruder temp','Paused by user','Paused: front cover falling',
               'Calibrating Micro Lidar','Calibrating extrusion flow','Paused: nozzle temp malfunction',
               'Paused: bed temp malfunction','Filament unloading','Skip step pause','Filament loading',
               'Motor noise calibration','Paused: AMS lost','Paused: heatbreak fan low','Paused: chamber temp error',
               'Cooling chamber','Paused by G-code','Motor noise showoff','Paused: nozzle filament covered',
               'Paused: cutter error','Paused: first layer error','Paused: nozzle clog'][i]
        };
      }
      return sendJson(res, stages);
    }

    // ---- BamBuddy features ----

    // Screenshot → print history linking
    if (method === 'POST' && path.match(/^\/api\/screenshots\/\d+\/link$/)) {
      const screenshotId = parseInt(path.split('/')[3]);
      return readBody(req, res, (body) => {
        if (!body.print_history_id) return sendJson(res, { error: 'print_history_id required' }, 400);
        linkScreenshotToPrint(screenshotId, body.print_history_id);
        sendJson(res, { ok: true });
      });
    }

    // Photos for a specific print
    if (method === 'GET' && path.match(/^\/api\/history\/\d+\/photos$/)) {
      const printId = parseInt(path.split('/')[3]);
      return sendJson(res, getScreenshotsForPrint(printId));
    }

    // MQTT debug log
    if (method === 'GET' && path.match(/^\/api\/mqtt-debug\/[^/]+$/)) {
      const printerId = decodeURIComponent(path.split('/')[3]);
      const params = new URL(req.url, 'http://localhost').searchParams;
      return sendJson(res, getMqttDebugLog(printerId, parseInt(params.get('limit')) || 100));
    }

    if (method === 'DELETE' && path.match(/^\/api\/mqtt-debug\/[^/]+$/)) {
      const printerId = decodeURIComponent(path.split('/')[3]);
      clearMqttDebugLog(printerId);
      return sendJson(res, { ok: true });
    }

    // Firmware status check
    if (method === 'GET' && path.match(/^\/api\/firmware\/check\/[^/]+$/)) {
      const printerId = decodeURIComponent(path.split('/')[3]);
      return sendJson(res, checkFirmwareUpdate(printerId));
    }

    // ---- Printers ----
    // Printer maintenance mode
    if (method === 'GET' && path === '/api/printers/maintenance') {
      return sendJson(res, getMaintenanceModePrinters());
    }

    if (method === 'POST' && path.match(/^\/api\/printers\/[^/]+\/maintenance$/)) {
      const printerId = decodeURIComponent(path.split('/')[3]);
      return readBody(req, res, (body) => {
        setMaintenanceMode(printerId, body.enabled !== false, body.note || null);
        if (_broadcastFn) _broadcastFn('printer_maintenance', { printer_id: printerId, maintenance: body.enabled !== false, note: body.note || null });
        sendJson(res, { ok: true });
      });
    }

    // ---- Camera: MJPEG stream + snapshot ----

    const mjpegMatch = path.match(/^\/api\/printers\/([^/]+)\/stream\.mjpeg$/);
    if (mjpegMatch && method === 'GET') {
      const pid = decodeURIComponent(mjpegMatch[1]);
      const entry = _printerManager?.printers?.get(pid);
      if (!entry?.camera) return sendJson(res, { error: 'Camera not available' }, 404);
      entry.camera.addMjpegClient(res);
      return;
    }

    const frameMatch = path.match(/^\/api\/printers\/([^/]+)\/frame\.jpeg$/);
    if (frameMatch && method === 'GET') {
      const pid = decodeURIComponent(frameMatch[1]);
      const entry = _printerManager?.printers?.get(pid);
      // Support both Bambu camera and Moonraker camera
      let frame = entry?.camera?.getLastFrame() || entry?.moonCamera?.getSnapshot();
      // Fallback: try live fetch from Moonraker/PrusaLink webcam
      if (!frame && entry?.client?.getCameraFrame) {
        try { frame = await entry.client.getCameraFrame(); } catch { /* ignore */ }
      }
      if (!frame && entry?.client?.getSnapshotUrl) {
        try {
          const snapUrl = entry.client.getSnapshotUrl();
          const snapRes = await fetch(snapUrl, { signal: AbortSignal.timeout(3000) });
          if (snapRes.ok) frame = Buffer.from(await snapRes.arrayBuffer());
        } catch { /* ignore */ }
      }
      if (!frame) return sendJson(res, { error: 'No frame available yet' }, 503);
      res.writeHead(200, {
        'Content-Type': 'image/jpeg',
        'Content-Length': frame.length,
        'Cache-Control': 'no-cache, no-store',
      });
      res.end(frame);
      return;
    }

    // ---- Moonraker print thumbnail proxy ----
    const printThumbMatch = path.match(/^\/api\/printers\/([^/]+)\/print-thumb$/);
    if (printThumbMatch && method === 'GET') {
      const pid = decodeURIComponent(printThumbMatch[1]);
      const entry = _printerManager?.printers?.get(pid);
      const thumbPath = entry?.client?.state?._thumbnail_path;
      const printerIp = entry?.config?.ip;
      const printerPort = entry?.config?.port || 80;
      if (!thumbPath || !printerIp) return sendJson(res, { error: 'No thumbnail' }, 404);
      try {
        const thumbRes = await fetch(`http://${printerIp}:${printerPort}/server/files/gcodes/${encodeURIComponent(thumbPath)}`, { signal: AbortSignal.timeout(5000) });
        if (!thumbRes.ok) return sendJson(res, { error: 'Thumbnail fetch failed' }, 502);
        const buf = Buffer.from(await thumbRes.arrayBuffer());
        res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=300' });
        res.end(buf);
      } catch (e) { return sendJson(res, { error: e.message }, 502); }
      return;
    }

    if (method === 'GET' && path === '/api/printers') {
      const printers = getPrinters().map(p => ({
        ...p,
        accessCode: p.accessCode ? '***' : ''
      }));
      return sendJson(res, printers);
    }

    if (method === 'POST' && path === '/api/printers') {
      return readBody(req, res, (body) => {
        const vr = validate(PRINTER_SCHEMA, body);
        if (!vr.valid) return sendJson(res, { error: 'Validation failed', details: vr.errors }, 400);
        body.id = body.id || body.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        addPrinter(body);
        if (_onPrinterAdded) _onPrinterAdded(body);
        broadcastPrinterMeta();
        sendJson(res, { ok: true, id: body.id }, 201);
      });
    }

    const printerMatch = path.match(/^\/api\/printers\/([a-zA-Z0-9_-]+)$/);
    if (printerMatch && method === 'PUT') {
      return readBody(req, res, (body) => {
        const vr = validate(PRINTER_UPDATE_SCHEMA, body);
        if (!vr.valid) return sendJson(res, { error: 'Validation failed', details: vr.errors }, 400);
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
      const status = url.searchParams.get('status') || null;
      const rows = getHistory(limit, offset, printerId, status);
      // Enrich rows missing filament brand/type from linked inventory spool
      for (const row of rows) {
        if ((!row.filament_brand || !row.filament_type) && row.printer_id && row.tray_id != null) {
          try {
            const spool = getSpoolBySlot(row.printer_id, 0, parseInt(row.tray_id));
            if (spool) {
              if (!row.filament_brand) row.filament_brand = spool.vendor_name || spool.profile_name || null;
              if (!row.filament_type) row.filament_type = spool.material || null;
            }
          } catch { /* ignore */ }
        }
      }
      return sendJson(res, rows);
    }

    // ---- Update history notes ----
    const histUpdateMatch = path.match(/^\/api\/history\/(\d+)$/);
    if (histUpdateMatch && method === 'PUT') {
      return readBody(req, res, (body) => {
        try {
          const data = JSON.parse(body);
          const id = parseInt(histUpdateMatch[1]);
          const existing = getHistoryById(id);
          if (!existing) return sendJson(res, { error: 'Not found' }, 404);
          const notes = data.notes != null ? String(data.notes) : existing.notes;
          const updated = updateHistoryNotes(id, notes);
          return sendJson(res, updated);
        } catch (e) {
          return sendJson(res, { error: e.message }, 400);
        }
      });
    }

    // ---- Print Review (quality control) ----
    if (method === 'GET' && path === '/api/history/unreviewed') {
      const printerId = url.searchParams.get('printer_id') || null;
      const items = getUnreviewedPrints(printerId);
      return sendJson(res, items);
    }

    const reviewMatch = path.match(/^\/api\/history\/(\d+)\/review$/);
    if (reviewMatch && method === 'POST') {
      return readBody(req, res, (data) => {
        const id = parseInt(reviewMatch[1]);
        if (!data.status || !['approved', 'rejected', 'partial'].includes(data.status)) {
          return sendJson(res, { error: 'status must be approved, rejected, or partial' }, 400);
        }
        const result = reviewPrint(id, {
          status: data.status,
          waste_g: data.waste_g != null ? parseFloat(data.waste_g) : null,
          notes: data.notes || null
        });
        if (!result) return sendJson(res, { error: 'Print not found' }, 404);
        return sendJson(res, result);
      });
    }

    // ---- CSV/JSON Export ----
    if (method === 'GET' && path === '/api/history/export') {
      const printerId = url.searchParams.get('printer_id') || null;
      const format = url.searchParams.get('format') || 'csv';
      const rows = getHistory(10000, 0, printerId);
      const dateStr = new Date().toISOString().split('T')[0];

      // Enrich rows with printer name
      let printerMap = {};
      try {
        const printers = getPrinters();
        for (const p of printers) printerMap[p.id] = p.name;
      } catch { /* ignore */ }
      for (const row of rows) {
        row._printer_name = printerMap[row.printer_id] || row.printer_id || '';
      }

      if (format === 'json') {
        const jsonRows = rows.map(r => ({
          date: r.started_at || '',
          printer: r._printer_name,
          filename: r.filename || '',
          status: r.status || '',
          duration_min: r.duration_seconds ? Math.round(r.duration_seconds / 60) : 0,
          filament_used_g: r.filament_used_g || 0,
          filament_type: r.filament_type || '',
          color: r.filament_color || '',
          layers: r.layer_count || 0,
          notes: r.notes || ''
        }));
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="print-history-${dateStr}.json"`
        });
        res.end(JSON.stringify(jsonRows, null, 2));
        return;
      }

      // CSV format (default)
      function csvEscape(val) {
        const s = String(val == null ? '' : val);
        if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"';
        return s;
      }
      const header = 'Date,Printer,Filename,Status,Duration (min),Filament Used (g),Filament Type,Color,Layers,Notes\n';
      const csv = header + rows.map(r =>
        [
          r.started_at || '',
          r._printer_name,
          r.filename || '',
          r.status || '',
          r.duration_seconds ? Math.round(r.duration_seconds / 60) : 0,
          r.filament_used_g || 0,
          r.filament_type || '',
          r.filament_color || '',
          r.layer_count || 0,
          (r.notes || '')
        ].map(csvEscape).join(',')
      ).join('\n');

      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="print-history-${dateStr}.csv"`
      });
      res.end(csv);
      return;
    }

    // ---- Statistics Export ----
    if (method === 'GET' && path === '/api/stats/export') {
      const printerId = url.searchParams.get('printer_id') || null;
      const from = url.searchParams.get('from') || null;
      const to = url.searchParams.get('to') || null;
      const format = url.searchParams.get('format') || 'csv';
      const dateStr = new Date().toISOString().split('T')[0];

      const stats = getStatistics(printerId, from, to);
      const totalPrints = stats.total_prints || 0;
      const completed = stats.completed_prints || 0;
      const failed = stats.failed_prints || 0;
      const totalFilament = stats.total_filament_g || 0;
      const totalHours = stats.total_hours || 0;
      const avgPrintMin = stats.avg_print_minutes || 0;
      const successRate = stats.success_rate || 0;

      const metrics = [
        { metric: 'Total Prints', value: totalPrints },
        { metric: 'Successful Prints', value: completed },
        { metric: 'Failed Prints', value: failed },
        { metric: 'Total Filament Used (g)', value: Math.round(totalFilament) },
        { metric: 'Total Print Time (hours)', value: totalHours },
        { metric: 'Average Print Time (min)', value: avgPrintMin },
        { metric: 'Success Rate (%)', value: successRate }
      ];

      if (format === 'json') {
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="print-statistics-${dateStr}.json"`
        });
        res.end(JSON.stringify(metrics, null, 2));
        return;
      }

      const csv = 'Metric,Value\n' + metrics.map(m => `${m.metric},${m.value}`).join('\n');
      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="print-statistics-${dateStr}.csv"`
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

    // ---- Print Activity Calendar ----
    if (method === 'GET' && path === '/api/stats/calendar') {
      const history = getHistory(99999, 0);
      const yearParam = url.searchParams.get('year');
      const now = new Date();
      const year = yearParam ? parseInt(yearParam) : now.getFullYear();

      // Find all years that have data
      const yearsWithData = new Set();
      for (const h of history) {
        if (h.started_at) yearsWithData.add(parseInt(h.started_at.substring(0, 4)));
      }
      yearsWithData.add(now.getFullYear());

      // Build calendar for the requested year
      const calendar = {};
      const startDate = new Date(year, 0, 1);
      const endDate = year === now.getFullYear() ? now : new Date(year, 11, 31);
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().split('T')[0];
        calendar[key] = { date: key, prints: 0, completed: 0, failed: 0, hours: 0 };
      }

      // Fill in actual data
      for (const h of history) {
        if (!h.started_at) continue;
        const key = h.started_at.split('T')[0];
        if (calendar[key]) {
          calendar[key].prints++;
          if (h.status === 'completed') calendar[key].completed++;
          if (h.status === 'failed') calendar[key].failed++;
          calendar[key].hours += (h.duration_seconds || 0) / 3600;
        }
      }
      return sendJson(res, { year, years: [...yearsWithData].sort(), days: Object.values(calendar) });
    }

    // ---- Filament ----
    if (method === 'GET' && path === '/api/filament') {
      const printerId = url.searchParams.get('printer_id') || null;
      return sendJson(res, getFilament(printerId));
    }

    if (method === 'POST' && path === '/api/filament') {
      return readBody(req, res, (body) => {
        addFilament(body);
        sendJson(res, { ok: true }, 201);
      });
    }

    const filamentMatch = path.match(/^\/api\/filament\/(\d+)$/);
    if (filamentMatch && method === 'PUT') {
      return readBody(req, res, (body) => {
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
      const startupPurgeG = parseFloat(url.searchParams.get('startup_purge_g')) || 1.0;
      const wastePerChangeG = parseFloat(url.searchParams.get('waste_per_change_g')) || 5.0;
      return sendJson(res, getWasteStats(printerId, startupPurgeG, wastePerChangeG));
    }

    if (method === 'GET' && path === '/api/waste/history') {
      const limit = parseInt(url.searchParams.get('limit')) || 50;
      const printerId = url.searchParams.get('printer_id') || null;
      return sendJson(res, getWasteHistory(limit, printerId));
    }

    if (method === 'POST' && path === '/api/waste/backfill') {
      return readBody(req, res, (body) => {
        const startupPurgeG = parseFloat(body.startup_purge_g) || 1.0;
        const wastePerChangeG = parseFloat(body.waste_per_change_g) || 5;
        const updated = backfillWaste(startupPurgeG, wastePerChangeG);
        return sendJson(res, { ok: true, updated });
      });
    }

    if (method === 'POST' && path === '/api/waste') {
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
        if (!body.printer_id || !body.component || !body.interval_hours) {
          return sendJson(res, { error: 'printer_id, component, interval_hours required' }, 400);
        }
        upsertMaintenanceSchedule(body.printer_id, body.component, body.interval_hours, body.label || body.component);
        sendJson(res, { ok: true });
      });
    }

    if (method === 'POST' && path === '/api/maintenance/nozzle-change') {
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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

    // ---- Activity Log ----
    if (method === 'GET' && path === '/api/activity-log') {
      const limit = Math.min(parseInt(url.searchParams.get('limit')) || 200, 500);
      const printerId = url.searchParams.get('printer_id') || null;
      return sendJson(res, getActivityLog(limit, printerId));
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
      return sendJson(res, _guard.getSettings(printerId));
    }

    if (method === 'PUT' && path === '/api/protection/settings') {
      if (!_guard) return sendJson(res, { error: 'Guard not initialized' }, 500);
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
        if (!body.logId) return sendJson(res, { error: 'logId required' }, 400);
        _guard.resolve(body.logId);
        return sendJson(res, { ok: true });
      });
    }

    if (method === 'POST' && path === '/api/protection/test') {
      if (!_guard) return sendJson(res, { error: 'Guard not initialized' }, 500);
      return readBody(req, res, (body) => {
        const printerId = body.printer_id;
        const eventType = body.event_type || 'spaghetti_detected';
        if (!printerId) return sendJson(res, { error: 'printer_id required' }, 400);
        _guard.handleEvent(printerId, eventType, null);
        return sendJson(res, { ok: true });
      });
    }

    if (method === 'DELETE' && path === '/api/protection/log') {
      if (!_guard) return sendJson(res, { error: 'Guard not initialized' }, 500);
      const printerId = url.searchParams.get('printer_id') || null;
      const resolved = url.searchParams.get('resolved_only');
      _guard.clearLog(printerId, resolved === '1');
      return sendJson(res, { ok: true });
    }

    // ---- Cost Estimator ----
    if (method === 'POST' && path === '/api/cost-estimator/upload') {
      const filename = url.searchParams.get('filename') || 'unknown';
      return readBinaryBody(req, async (buffer) => {
        try {
          const ext = filename.toLowerCase().split('.').pop();
          let parsed;
          if (ext === '3mf') {
            parsed = await parse3mf(buffer);
          } else if (ext === 'gcode' || ext === 'gco' || ext === 'g') {
            parsed = parseGcode(buffer);
          } else {
            return sendJson(res, { error: 'Unsupported file type. Use 3MF or GCode.' }, 400);
          }
          // Compute a simple hash for deduplication
          const hash = createHmac('sha256', 'cost-est').update(buffer.subarray(0, Math.min(buffer.length, 8192))).digest('hex').substring(0, 16);
          return sendJson(res, { filename, file_hash: hash, ...parsed });
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      });
    }

    if (method === 'POST' && path === '/api/cost-estimator/calculate') {
      return readBody(req, res, (body) => {
        try {
          const filaments = body.filaments || [];
          const printerId = body.printer_id || null;
          const spoolIds = body.spool_ids || [];
          const estimatedTimeMin = body.estimated_time_min || 0;
          const colorChanges = body.color_changes || 0;
          const changeTimeSec = body.change_time_s || 0;
          const wattageOverride = body.wattage || null;

          const cs = getPrinterCostSettings(printerId);
          const wattage = wattageOverride || cs.printer_wattage || 150;
          const electricityRate = cs.electricity_rate_kwh || 0;
          const currency = getInventorySetting('cost_currency') || 'NOK';
          // Add color change time if not already included in slicer estimate
          const changeTimeMin = Math.round(changeTimeSec / 60);
          const durationH = (estimatedTimeMin + changeTimeMin) / 60;

          // Calculate filament cost per color/spool
          let totalFilamentCost = 0;
          const filamentBreakdown = filaments.map((fil, idx) => {
            const spoolId = spoolIds[idx] || null;
            let costPerG = 0;
            let spoolInfo = null;
            if (spoolId) {
              const spool = getSpool(spoolId);
              if (spool) {
                spoolInfo = { id: spool.id, name: spool.filament_name || spool.material, color: spool.color_hex };
                if (spool.cost > 0 && spool.initial_weight_g > 0) {
                  costPerG = spool.cost / spool.initial_weight_g;
                } else if (spool.profile_price > 0) {
                  costPerG = spool.profile_price / 1000;
                }
              }
            }
            if (costPerG <= 0 && body.manual_price_per_kg) {
              costPerG = body.manual_price_per_kg / 1000;
            }
            const cost = Math.round((fil.weight_g || 0) * costPerG * 100) / 100;
            totalFilamentCost += cost;
            return { ...fil, spool: spoolInfo, cost_per_g: costPerG, cost };
          });

          // Electricity cost
          const currentPrice = _energy.getCurrentPrice();
          const spotRate = currentPrice ? currentPrice.total : electricityRate;
          const electricityCost = Math.round(durationH * (wattage / 1000) * spotRate * 100) / 100;

          // Waste factor — material inefficiency (default 1.1 = 10% waste)
          const wasteFactor = parseFloat(getInventorySetting('material_waste_factor') || '1.0');
          const adjustedFilamentCost = Math.round(totalFilamentCost * wasteFactor * 100) / 100;
          const wasteCost = Math.round((adjustedFilamentCost - totalFilamentCost) * 100) / 100;

          // Wear cost (nozzle + machine depreciation per hour)
          const nozzleCostPerHour = parseFloat(getInventorySetting('nozzle_cost_per_hour') || '0');
          const machineDepreciation = cs.machine_cost > 0 && cs.machine_lifetime_hours > 0
            ? cs.machine_cost / cs.machine_lifetime_hours : 0;
          const wearCost = Math.round(durationH * (nozzleCostPerHour + machineDepreciation) * 100) / 100;

          // Labor cost (hourly rate + setup time)
          const laborRate = parseFloat(getInventorySetting('labor_rate_hourly') || '0');
          const setupMinutes = parseFloat(getInventorySetting('labor_setup_minutes') || '0');
          const laborCost = Math.round((durationH * laborRate + (setupMinutes / 60) * laborRate) * 100) / 100;

          // Subtotal (all production costs)
          const subtotal = Math.round((adjustedFilamentCost + electricityCost + wearCost + laborCost) * 100) / 100;

          // Markup / profit margin
          const markupPct = parseFloat(getInventorySetting('markup_pct') || '0');
          const markupAmount = Math.round(subtotal * (markupPct / 100) * 100) / 100;
          const totalCost = Math.round((subtotal + markupAmount) * 100) / 100;

          // Suggested selling prices at different margins
          const suggestedPrices = {
            cost: subtotal,
            low: Math.ceil(subtotal * 2),
            medium: Math.ceil(subtotal * 2.5),
            high: Math.ceil(subtotal * 3),
            custom: totalCost
          };

          return sendJson(res, {
            filament_breakdown: filamentBreakdown,
            filament_cost: totalFilamentCost,
            waste_material_cost: wasteCost,
            adjusted_filament_cost: adjustedFilamentCost,
            electricity_cost: electricityCost,
            electricity_rate: spotRate,
            wear_cost: wearCost,
            labor_cost: laborCost,
            subtotal,
            markup_pct: markupPct,
            markup_amount: markupAmount,
            total_cost: totalCost,
            suggested_prices: suggestedPrices,
            currency,
            estimated_time_min: estimatedTimeMin,
            wattage,
            settings: {
              wattage, electricity_rate: spotRate, nozzle_cost_per_hour: nozzleCostPerHour,
              machine_depreciation: machineDepreciation, labor_rate: laborRate,
              setup_minutes: setupMinutes, markup_pct: markupPct, waste_factor: wasteFactor
            }
          });
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      });
    }

    if (method === 'GET' && path === '/api/cost-estimator/estimates') {
      const limit = parseInt(url.searchParams.get('limit') || '50');
      return sendJson(res, getCostEstimates(limit));
    }

    const ceIdMatch = path.match(/^\/api\/cost-estimator\/estimates\/(\d+)$/);
    if (ceIdMatch && method === 'GET') {
      const est = getCostEstimate(parseInt(ceIdMatch[1]));
      if (!est) return sendJson(res, { error: 'Not found' }, 404);
      return sendJson(res, est);
    }

    if (ceIdMatch && method === 'DELETE') {
      deleteCostEstimate(parseInt(ceIdMatch[1]));
      return sendJson(res, { ok: true });
    }

    if (method === 'POST' && path === '/api/cost-estimator/save') {
      return readBody(req, res, (body) => {
        try {
          const id = saveCostEstimate(body);
          return sendJson(res, { ok: true, id }, 201);
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      });
    }

    if (method === 'POST' && path === '/api/cost-estimator/compare') {
      return readBody(req, res, (body) => {
        try {
          const filaments = body.filaments || [];
          const estimatedTimeMin = body.estimated_time_min || 0;
          const printerId = body.printer_id || null;
          const compareSpoolIds = body.compare_spool_ids || []; // Array of arrays

          const cs = getPrinterCostSettings(printerId);
          const wattage = cs.printer_wattage || 150;
          const electricityRate = cs.electricity_rate_kwh || 0;
          const currency = getInventorySetting('cost_currency') || 'NOK';
          const durationH = estimatedTimeMin / 60;
          const currentPrice = _energy.getCurrentPrice();
          const spotRate = currentPrice ? currentPrice.total : electricityRate;
          const electricityCost = Math.round(durationH * (wattage / 1000) * spotRate * 100) / 100;
          const nozzleCostPerHour = parseFloat(getInventorySetting('nozzle_cost_per_hour') || '0');
          const machineDepreciation = cs.machine_cost > 0 && cs.machine_lifetime_hours > 0
            ? cs.machine_cost / cs.machine_lifetime_hours : 0;
          const wearCost = Math.round(durationH * (nozzleCostPerHour + machineDepreciation) * 100) / 100;

          const results = compareSpoolIds.map(spoolSet => {
            let filamentCost = 0;
            const breakdown = filaments.map((fil, idx) => {
              const spoolId = spoolSet[idx] || null;
              let costPerG = 0;
              let spoolInfo = null;
              if (spoolId) {
                const spool = getSpool(spoolId);
                if (spool) {
                  spoolInfo = { id: spool.id, name: spool.filament_name || spool.material, color: spool.color_hex };
                  if (spool.cost > 0 && spool.initial_weight_g > 0) {
                    costPerG = spool.cost / spool.initial_weight_g;
                  } else if (spool.profile_price > 0) {
                    costPerG = spool.profile_price / 1000;
                  }
                }
              }
              const cost = Math.round((fil.weight_g || 0) * costPerG * 100) / 100;
              filamentCost += cost;
              return { ...fil, spool: spoolInfo, cost };
            });
            const total = Math.round((filamentCost + electricityCost + wearCost) * 100) / 100;
            return { filament_breakdown: breakdown, filament_cost: filamentCost, electricity_cost: electricityCost, wear_cost: wearCost, total_cost: total };
          });

          return sendJson(res, { comparisons: results, currency });
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      });
    }

    // ---- Material Recommendations ----
    if (method === 'GET' && path === '/api/materials/recommendations') {
      if (!_materialRecommender) return sendJson(res, []);
      return sendJson(res, _materialRecommender.getAllRecommendations());
    }

    if (method === 'GET' && path.startsWith('/api/materials/recommendations/') && !path.includes('/recalculate')) {
      if (!_materialRecommender) return sendJson(res, { error: 'Service not initialized' }, 500);
      const type = decodeURIComponent(path.replace('/api/materials/recommendations/', ''));
      const brand = url.searchParams.get('brand') || null;
      const rec = _materialRecommender.getRecommendation(type, brand);
      if (!rec) return sendJson(res, { error: 'No recommendation found' }, 404);
      return sendJson(res, rec);
    }

    if (method === 'POST' && path === '/api/materials/recommendations/recalculate') {
      if (!_materialRecommender) return sendJson(res, { error: 'Service not initialized' }, 500);
      try {
        const results = _materialRecommender.recalculate();
        return sendJson(res, { ok: true, count: results.length, recommendations: results });
      } catch (e) { return sendJson(res, { error: e.message }, 500); }
    }

    if (method === 'GET' && path.startsWith('/api/materials/compare/')) {
      if (!_materialRecommender) return sendJson(res, []);
      const type = decodeURIComponent(path.replace('/api/materials/compare/', ''));
      return sendJson(res, _materialRecommender.compareBrands(type));
    }

    if (method === 'GET' && path === '/api/materials/suggest-settings') {
      if (!_materialRecommender) return sendJson(res, { error: 'Service not initialized' }, 500);
      const type = url.searchParams.get('type');
      const brand = url.searchParams.get('brand') || null;
      if (!type) return sendJson(res, { error: 'type parameter required' }, 400);
      const suggestion = _materialRecommender.suggestSettings(type, brand);
      if (!suggestion) return sendJson(res, { error: 'No data available for this material' }, 404);
      return sendJson(res, suggestion);
    }

    if (method === 'GET' && path === '/api/materials/success-rates') {
      if (!_materialRecommender) return sendJson(res, []);
      return sendJson(res, _materialRecommender.getSuccessRates());
    }

    // ---- Wear Predictions ----
    if (method === 'GET' && path === '/api/wear/predictions') {
      const printerId = url.searchParams.get('printer_id');
      if (_wearPrediction) {
        return sendJson(res, _wearPrediction.getPredictions(printerId || null));
      }
      return sendJson(res, []);
    }

    if (method === 'GET' && path.match(/^\/api\/wear\/predictions\/[^/]+$/)) {
      const printerId = path.split('/')[4];
      if (_wearPrediction) {
        return sendJson(res, _wearPrediction.getPredictions(printerId));
      }
      return sendJson(res, []);
    }

    if (method === 'POST' && path === '/api/wear/predictions/recalculate') {
      if (!_wearPrediction) return sendJson(res, { error: 'Wear prediction service not initialized' }, 503);
      _wearPrediction.recalculate();
      return sendJson(res, { ok: true });
    }

    if (method === 'GET' && path === '/api/wear/alerts') {
      const printerId = url.searchParams.get('printer_id') || null;
      if (_wearPrediction) {
        return sendJson(res, _wearPrediction.getAlerts(printerId));
      }
      return sendJson(res, []);
    }

    if (method === 'POST' && path.match(/^\/api\/wear\/alerts\/\d+\/acknowledge$/)) {
      const alertId = parseInt(path.split('/')[4]);
      acknowledgeWearAlert(alertId);
      return sendJson(res, { ok: true });
    }

    if (method === 'GET' && path === '/api/wear/costs') {
      const printers = getPrinters();
      const summary = printers.map(p => {
        const total = getTotalMaintenanceCost(p.id);
        const costs = getMaintenanceCosts(p.id);
        return { printer_id: p.id, printer_name: p.name, total: total.total, currency: total.currency, items: costs };
      });
      return sendJson(res, summary);
    }

    if (method === 'GET' && path.match(/^\/api\/wear\/costs\/[^/]+$/)) {
      const printerId = path.split('/')[4];
      const total = getTotalMaintenanceCost(printerId);
      const costs = getMaintenanceCosts(printerId);
      return sendJson(res, { printer_id: printerId, total: total.total, currency: total.currency, items: costs });
    }

    if (method === 'POST' && path === '/api/wear/costs') {
      return readBody(req, res, (body) => {
        if (!body.printer_id || !body.component || body.cost === undefined) {
          return sendJson(res, { error: 'printer_id, component and cost required' }, 400);
        }
        const id = addMaintenanceCost(body);
        return sendJson(res, { ok: true, id });
      });
    }

    // ---- Error Pattern Analysis ----
    if (method === 'GET' && path === '/api/error-patterns') {
      if (!_errorPatternAnalyzer) return sendJson(res, []);
      return sendJson(res, _errorPatternAnalyzer.getAllPatterns());
    }

    if (method === 'GET' && path.match(/^\/api\/error-patterns\/\d+$/)) {
      if (!_errorPatternAnalyzer) return sendJson(res, { error: 'Service not initialized' }, 500);
      const id = parseInt(path.split('/').pop());
      const pattern = _errorPatternAnalyzer.getPattern(id);
      if (!pattern) return sendJson(res, { error: 'Pattern not found' }, 404);
      return sendJson(res, pattern);
    }

    if (method === 'POST' && path === '/api/error-patterns/analyze') {
      if (!_errorPatternAnalyzer) return sendJson(res, { error: 'Service not initialized' }, 500);
      try {
        _errorPatternAnalyzer.analyze();
        return sendJson(res, { ok: true, message: 'Analysis complete' });
      } catch (e) { return sendJson(res, { error: e.message }, 500); }
    }

    if (method === 'GET' && path === '/api/error-patterns/suggestions') {
      if (!_errorPatternAnalyzer) return sendJson(res, []);
      const printerId = url.searchParams.get('printer_id') || null;
      return sendJson(res, _errorPatternAnalyzer.getSuggestions(printerId));
    }

    if (method === 'GET' && path === '/api/error-correlations') {
      if (!_errorPatternAnalyzer) return sendJson(res, []);
      const code = url.searchParams.get('code') || null;
      return sendJson(res, _errorPatternAnalyzer.getAllCorrelations(code));
    }

    if (method === 'GET' && path.startsWith('/api/error-correlations/')) {
      if (!_errorPatternAnalyzer) return sendJson(res, []);
      const code = decodeURIComponent(path.replace('/api/error-correlations/', ''));
      return sendJson(res, _errorPatternAnalyzer.getAllCorrelations(code));
    }

    if (method === 'GET' && path === '/api/printer-health') {
      if (!_errorPatternAnalyzer) return sendJson(res, []);
      return sendJson(res, _errorPatternAnalyzer.getAllHealthScores());
    }

    if (method === 'GET' && path.startsWith('/api/printer-health/')) {
      if (!_errorPatternAnalyzer) return sendJson(res, null);
      const printerId = decodeURIComponent(path.replace('/api/printer-health/', ''));
      const score = _errorPatternAnalyzer.getHealthScore(printerId);
      if (!score) return sendJson(res, { error: 'No health data for this printer' }, 404);
      return sendJson(res, score);
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
      return readBody(req, res, (body) => {
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
        log.info('Auth config updated: enabled=' + config.auth.enabled + ', users=' + (config.auth.users?.length || 0));
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, async (body) => {
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
          try { link.print_settings = JSON.parse(link.print_settings); } catch (e) { log.warn('Failed to parse print_settings JSON', e.message); }
        }
        return sendJson(res, link || null);
      }

      if (method === 'PUT') {
        return readBody(req, res, (body) => {
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
        log.warn('Model error: ' + err.message);
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
        log.warn('Thumbnail error: ' + err.message);
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
              log.warn('Cloud thumb fetch error: ' + e.message);
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
        log.warn('History thumb error: ' + e.message);
      }
      // Return 1x1 transparent PNG placeholder to avoid 404 console noise
      const placeholder = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAA0lEQVQI12P4z8BQDwAEgAF/QualIQAAAABJRU5ErkJggg==', 'base64');
      res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': placeholder.length, 'Cache-Control': 'public, max-age=300' });
      res.end(placeholder);
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
        if (!body.name || !body.material) return sendJson(res, { error: 'name and material required' }, 400);
        const result = addFilamentProfile(body);
        _broadcastInventory('created', 'profile', { id: result.id });
        sendJson(res, result, 201);
      });
    }
    if (fpMatch && method === 'PUT') {
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
        const result = addSpool(body);
        _broadcastInventory('created', 'spool', { id: result.id });
        sendJson(res, result, 201);
      });
    }
    if (spoolMatch && method === 'PUT') {
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
        archiveSpool(parseInt(spoolArchiveMatch[1]), body.archived !== false);
        _broadcastInventory('archived', 'spool', { id: parseInt(spoolArchiveMatch[1]) });
        sendJson(res, { ok: true });
      });
    }
    const spoolRefillMatch = path.match(/^\/api\/inventory\/spools\/(\d+)\/refill$/);
    if (spoolRefillMatch && method === 'POST') {
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
        if (!body.name) return sendJson(res, { error: 'name required' }, 400);
        try {
          const loc = addLocation(body);
          sendJson(res, loc, 201);
        } catch (e) { sendJson(res, { error: e.message }, 409); }
      });
    }
    const locMatch = path.match(/^\/api\/inventory\/locations\/(\d+)$/);
    if (locMatch && (method === 'PATCH' || method === 'PUT')) {
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
        if (!body.material) return sendJson(res, { error: 'material required' }, 400);
        const result = addCompatibilityRule(body);
        sendJson(res, result, 201);
      });
    }
    if (compatMatch && method === 'PUT') {
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      if (method === 'POST') return readBody(req, res, (body) => { setInventorySetting(key, body.value); sendJson(res, { ok: true }); });
    }

    // ---- Inventory: Import ----
    if (method === 'POST' && path === '/api/inventory/import/spools') {
      return readBody(req, res, (body) => {
        if (!Array.isArray(body)) return sendJson(res, { error: 'Expected array' }, 400);
        const count = importSpools(body);
        _broadcastInventory('import', 'spool', { count });
        sendJson(res, { imported: count }, 201);
      });
    }
    if (method === 'POST' && path === '/api/inventory/import/filaments') {
      return readBody(req, res, (body) => {
        if (!Array.isArray(body)) return sendJson(res, { error: 'Expected array' }, 400);
        const count = importFilamentProfiles(body);
        _broadcastInventory('import', 'profile', { count });
        sendJson(res, { imported: count }, 201);
      });
    }
    if (method === 'POST' && path === '/api/inventory/import/vendors') {
      return readBody(req, res, (body) => {
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
        return readBody(req, res, (body) => {
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
      return sendJson(res, { name: '3DPrintForge', version: _updater?.currentVersion || 'unknown', uptime: process.uptime() });
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
        if (!body.spool_id || !body.duration_minutes) return sendJson(res, { error: 'spool_id and duration_minutes required' }, 400);
        const result = startDryingSession(body);
        _broadcastInventory('drying_started', 'drying_session', { id: result.id, spool_id: body.spool_id });
        sendJson(res, result, 201);
      });
    }
    const dryingCompleteMatch = path.match(/^\/api\/inventory\/drying\/sessions\/(\d+)\/complete$/);
    if (dryingCompleteMatch && method === 'PUT') {
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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

    // ---- Prometheus Metrics (legacy path, handled before auth at /api/metrics) ----
    if (method === 'GET' && path === '/metrics') {
      const metrics = _collectMetrics();
      res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4' });
      return res.end(metrics);
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
    const backupDlMatch = path.match(/^\/api\/backup\/download\/(.+\.db)$/);
    if (backupDlMatch && method === 'GET') {
      const backupPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'backups', backupDlMatch[1]);
      if (!existsSync(backupPath)) return sendJson(res, { error: 'Not found' }, 404);
      const stat = statSync(backupPath);
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${backupDlMatch[1]}"`,
        'Content-Length': stat.size
      });
      return createReadStream(backupPath).pipe(res);
    }
    if (method === 'DELETE' && path.match(/^\/api\/backup\/(.+\.db)$/)) {
      const fname = path.match(/^\/api\/backup\/(.+\.db)$/)[1];
      const backupPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'backups', fname);
      if (!existsSync(backupPath)) return sendJson(res, { error: 'Not found' }, 404);
      try { unlinkSync(backupPath); return sendJson(res, { ok: true }); }
      catch (e) { return sendJson(res, { error: e.message }, 500); }
    }

    // ---- Backup Restore ----
    const restoreMatch = path.match(/^\/api\/backup\/restore\/(.+\.db)$/);
    if (restoreMatch && method === 'POST') {
      try {
        const result = restoreBackup(decodeURIComponent(restoreMatch[1]));
        return sendJson(res, { ok: true, ...result, restart_required: true });
      } catch (e) { return sendJson(res, { error: e.message }, 500); }
    }

    // ---- Backup Upload ----
    if (method === 'POST' && path === '/api/backup/upload') {
      return new Promise((resolve) => {
        const chunks = [];
        let totalSize = 0;
        const MAX_SIZE = 100 * 1024 * 1024; // 100MB
        req.on('data', (chunk) => {
          totalSize += chunk.length;
          if (totalSize > MAX_SIZE) { req.destroy(); return; }
          chunks.push(chunk);
        });
        req.on('end', () => {
          try {
            const buffer = Buffer.concat(chunks);
            // Extract filename from Content-Disposition or query param
            const fname = url.searchParams.get('filename') || 'uploaded-backup.db';
            const result = uploadBackup(buffer, fname);
            resolve(sendJson(res, { ok: true, ...result }));
          } catch (e) { resolve(sendJson(res, { error: e.message }, 500)); }
        });
        req.on('error', () => resolve(sendJson(res, { error: 'Upload failed' }, 500)));
      });
    }

    // ---- System Info ----
    if (method === 'GET' && path === '/api/system/info') {
      const dbPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'dashboard.db');
      const dbSize = existsSync(dbPath) ? statSync(dbPath).size : 0;
      const uptime = process.uptime();
      const mem = process.memoryUsage();

      // Collect network addresses
      const { networkInterfaces: getIfaces, hostname: getHostname } = await import('node:os');
      const ifaces = getIfaces();
      const addresses = [];
      for (const [name, list] of Object.entries(ifaces)) {
        for (const iface of list) {
          if (iface.internal) continue;
          addresses.push({ interface: name, address: iface.address, family: iface.family, mac: iface.mac });
        }
      }
      const hn = getHostname();
      const httpPort = config.server?.port || parseInt(process.env.SERVER_PORT) || 3000;
      const httpsPort = config.server?.httpsPort || parseInt(process.env.SERVER_HTTPS_PORT) || 3443;

      return sendJson(res, {
        uptime: uptime,
        uptime_seconds: Math.floor(uptime),
        memoryUsage: { rss: mem.rss, heapUsed: mem.heapUsed, heapTotal: mem.heapTotal },
        node_version: process.version,
        nodeVersion: process.version,
        platform: `${process.platform} ${process.arch}`,
        printerCount: getPrinters().length,
        printer_count: getPrinters().length,
        dbSize: dbSize,
        db_size: dbSize,
        db_version: 76,
        startedAt: _serverStartTime,
        pid: process.pid,
        memory_mb: Math.round(mem.rss / 1024 / 1024),
        hostname: hn,
        network: addresses,
        ports: { http: httpPort, https: httpsPort, camera_base: 9001 }
      });
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
      return readBody(req, res, async (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
        return readBody(req, res, (body) => {
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
        return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
        if (!Array.isArray(body.item_ids)) return sendJson(res, { error: 'item_ids array required' }, 400);
        reorderQueueItems(queueId, body.item_ids);
        if (_broadcastFn) _broadcastFn('queue_update', { action: 'queue_changed', queueId });
        return sendJson(res, { ok: true });
      });
    }

    const queueMultiStartMatch = path.match(/^\/api\/queue\/(\d+)\/multi-start$/);
    if (queueMultiStartMatch && method === 'POST') {
      const queueId = parseInt(queueMultiStartMatch[1]);
      return readBody(req, res, (body) => {
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
        return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
        if (!body.entity_type || !body.entity_id || !body.tag_id) return sendJson(res, { error: 'entity_type, entity_id, tag_id required' }, 400);
        assignTag(body.entity_type, body.entity_id, body.tag_id);
        return sendJson(res, { ok: true });
      });
    }

    if (method === 'DELETE' && path === '/api/tags/unassign') {
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
        if (!body.tag_uid || !body.spool_id) return sendJson(res, { error: 'tag_uid and spool_id required' }, 400);
        try {
          const id = linkNfcTag(body.tag_uid, body.spool_id, body.standard, body.data ? JSON.stringify(body.data) : null);
          return sendJson(res, { ok: true, id });
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      });
    }

    // Auto-AMS: scan NFC tag and auto-assign spool to AMS slot
    if (method === 'POST' && path === '/api/nfc/scan') {
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      html += `<p class="meta">Shared from 3DPrintForge · ${spools.length} colors · Viewed ${palette.view_count} times</p></body></html>`;
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
      return readBody(req, res, (body) => {
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
      return readBinaryBody(req, async (buffer) => {
        try {
          const result = await saveUploadedFile(filename, buffer, printerId, autoQueue);
          sendJson(res, result, 201);
          // Auto-slice if needed
          if (result.needsSlicing) {
            sliceFile(result.jobId, { quality, profile }).catch(e => log.error('Slice failed: ' + e.message));
          }
        } catch (e) { sendJson(res, { error: e.message }, 500); }
      });
    }

    // Trigger slicing for a pending job
    const sliceMatch = path.match(/^\/api\/slicer\/jobs\/(\d+)\/slice$/);
    if (sliceMatch && method === 'POST') {
      return readBody(req, res, async (body) => {
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
      return readBody(req, res, async (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
        const vr = validate(WEBHOOK_SCHEMA, body);
        if (!vr.valid) return sendJson(res, { error: 'Validation failed', details: vr.errors }, 400);
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
      return readBody(req, res, (body) => {
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
        const payload = JSON.stringify({ event: 'test', title: 'Webhook Test', message: 'This is a test from 3DPrintForge', timestamp: new Date().toISOString(), data: {} });
        const deliveryId = addWebhookDelivery({ webhook_id: wh.id, event_type: 'test', payload, status: 'pending' });
        // Fire and forget — the webhook dispatcher will handle retry
        _dispatchWebhook(wh, payload, deliveryId).catch(e => log.warn('Webhook test dispatch failed', e.message));
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
      return readBody(req, res, (body) => {
        const result = estimatePrintCostAdvanced(body.filament_g || 0, body.duration_seconds || 0, body.spool_id || null, body.printer_id || null);
        return sendJson(res, result);
      });
    }

    // ---- Energy / Electricity Prices ----
    if (method === 'GET' && path === '/api/energy/prices') {
      return sendJson(res, _energy.getCachedPrices());
    }
    if (method === 'GET' && path === '/api/energy/current') {
      return sendJson(res, _energy.getCurrentPrice() || { error: 'No price data' });
    }
    if (method === 'GET' && path === '/api/energy/today') {
      return sendJson(res, _energy.getTodayStats() || { error: 'No price data' });
    }
    if (method === 'POST' && path === '/api/energy/refresh') {
      const result = await _energy.fetchPrices();
      return sendJson(res, result);
    }
    if (method === 'GET' && path === '/api/energy/cheapest') {
      const u = new URL(req.url, 'http://localhost');
      const minutes = parseInt(u.searchParams.get('duration') || '60');
      return sendJson(res, _energy.findCheapestWindow(minutes) || { error: 'No price data' });
    }
    if (method === 'POST' && path === '/api/energy/spot-cost') {
      return readBody(req, res, (body) => {
        const result = _energy.calculateSpotCost(body.started_at, body.duration_seconds, body.wattage || 200);
        return sendJson(res, result || { error: 'Could not calculate' });
      });
    }

    // ---- Circuit Breakers ----
    if (method === 'GET' && path === '/api/circuit-breakers') {
      return sendJson(res, getAllBreakerStatus());
    }

    // ---- Reports ----
    if (method === 'GET' && path === '/api/reports/generate') {
      const u = new URL(req.url, 'http://localhost');
      const period = u.searchParams.get('period') || 'week';
      const report = generateReport(period);
      return sendJson(res, { summary: report.summary, period: report.period, from: report.from, to: report.to });
    }
    if (method === 'GET' && path === '/api/reports/preview') {
      const u = new URL(req.url, 'http://localhost');
      const period = u.searchParams.get('period') || 'week';
      const report = generateReport(period);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(report.html);
    }
    if (method === 'POST' && path === '/api/reports/send') {
      return readBody(req, res, async (body) => {
        const period = body.period || 'week';
        const report = generateReport(period);
        const result = await sendReportEmail(report);
        return sendJson(res, result);
      });
    }
    if (method === 'POST' && path === '/api/reports/restart') {
      restartReportService();
      return sendJson(res, { ok: true });
    }

    // ---- Remote Nodes ----
    if (method === 'GET' && path === '/api/remote-nodes') {
      return sendJson(res, getRemoteNodeStates());
    }
    if (method === 'POST' && path === '/api/remote-nodes') {
      return readBody(req, res, (body) => {
        if (!body.name || !body.base_url) return sendJson(res, { error: 'name and base_url required' }, 400);
        const id = addRemoteNode(body);
        restartRemoteNodes();
        return sendJson(res, { ok: true, id }, 201);
      });
    }
    const remoteNodeMatch = path.match(/^\/api\/remote-nodes\/(\d+)$/);
    if (remoteNodeMatch && method === 'GET') {
      const node = getRemoteNode(parseInt(remoteNodeMatch[1]));
      if (!node) return sendJson(res, { error: 'Node not found' }, 404);
      return sendJson(res, { ...node, api_key: node.api_key ? '***' : null });
    }
    if (remoteNodeMatch && method === 'PUT') {
      return readBody(req, res, (body) => {
        updateRemoteNode(parseInt(remoteNodeMatch[1]), body);
        restartRemoteNodes();
        return sendJson(res, { ok: true });
      });
    }
    if (remoteNodeMatch && method === 'DELETE') {
      deleteRemoteNode(parseInt(remoteNodeMatch[1]));
      restartRemoteNodes();
      return sendJson(res, { ok: true });
    }
    if (method === 'POST' && path === '/api/remote-nodes/test') {
      return readBody(req, res, async (body) => {
        if (!body.base_url) return sendJson(res, { error: 'base_url required' }, 400);
        try {
          const result = await testRemoteNode(body.base_url, body.api_key);
          return sendJson(res, result);
        } catch (e) {
          return sendJson(res, { ok: false, error: e.message });
        }
      });
    }

    // ---- Home Assistant MQTT Discovery ----
    if (method === 'GET' && path === '/api/ha-discovery/status') {
      return sendJson(res, getHaDiscoveryStatus());
    }
    if (method === 'POST' && path === '/api/ha-discovery/restart') {
      restartHaDiscovery();
      return sendJson(res, { ok: true });
    }

    // ---- Print Scheduler ----
    if (method === 'GET' && path === '/api/scheduler') {
      const u = new URL(req.url, 'http://localhost');
      const from = u.searchParams.get('from') || undefined;
      const to = u.searchParams.get('to') || undefined;
      return sendJson(res, getScheduledPrints(from, to));
    }
    if (method === 'POST' && path === '/api/scheduler') {
      return readBody(req, res, (body) => {
        if (!body.title || !body.filename || !body.scheduled_at) return sendJson(res, { error: 'title, filename, scheduled_at required' }, 400);
        const id = addScheduledPrint(body);
        return sendJson(res, { id }, 201);
      });
    }
    const schedulerMatch = path.match(/^\/api\/scheduler\/(\d+)$/);
    if (method === 'GET' && schedulerMatch) {
      const sp = getScheduledPrint(parseInt(schedulerMatch[1]));
      if (!sp) return sendJson(res, { error: 'Not found' }, 404);
      return sendJson(res, sp);
    }
    if (method === 'PUT' && schedulerMatch) {
      return readBody(req, res, (body) => {
        updateScheduledPrint(parseInt(schedulerMatch[1]), body);
        return sendJson(res, { ok: true });
      });
    }
    if (method === 'DELETE' && schedulerMatch) {
      deleteScheduledPrint(parseInt(schedulerMatch[1]));
      return sendJson(res, { ok: true });
    }

    // ---- File Library ----
    if (method === 'GET' && path === '/api/library') {
      const u = new URL(req.url, 'http://localhost');
      return sendJson(res, getFileLibrary({
        category: u.searchParams.get('category') || undefined,
        file_type: u.searchParams.get('type') || undefined,
        search: u.searchParams.get('q') || undefined,
        limit: parseInt(u.searchParams.get('limit')) || 50,
        offset: parseInt(u.searchParams.get('offset')) || 0
      }));
    }
    if (method === 'GET' && path === '/api/library/categories') {
      return sendJson(res, getFileLibraryCategories());
    }
    if (method === 'POST' && path === '/api/library/upload') {
      const u = new URL(req.url, 'http://localhost');
      const origName = u.searchParams.get('filename');
      if (!origName) return sendJson(res, { error: 'filename param required' }, 400);
      const ext = origName.split('.').pop().toLowerCase();
      const allowed = ['stl', '3mf', 'obj', 'step', 'gcode'];
      if (!allowed.includes(ext)) return sendJson(res, { error: 'Unsupported file type' }, 400);
      return readBinaryBody(req, async (buffer) => {
        const ts = Date.now();
        const safeName = origName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storedName = `lib_${ts}_${safeName}`;
        const libDir = join(DATA_DIR, 'library');
        try { mkdirSync(libDir, { recursive: true }); } catch {}
        const filePath = join(libDir, storedName);
        writeFileSync(filePath, buffer);
        // Try thumbnail extraction for 3mf using lib3mf
        let thumbPath = null;
        if (ext === '3mf') {
          try {
            const { extractThumbnails } = await import('./lib3mf-parser.js');
            const thumbs = await extractThumbnails(buffer);
            if (thumbs.length > 0) {
              const thumbName = `thumb_${ts}.png`;
              writeFileSync(join(libDir, thumbName), thumbs[0].data);
              thumbPath = thumbName;
            }
          } catch {}
        }
        // Parse estimates
        let est = {};
        try {
          if (ext === '3mf') est = await parse3mf(buffer) || {};
          else if (ext === 'gcode') est = parseGcode(buffer.toString('utf-8', 0, Math.min(buffer.length, 200000))) || {};
        } catch {}
        const id = addFileLibraryItem({
          filename: storedName,
          original_name: origName,
          file_type: ext,
          file_size: buffer.length,
          category: u.searchParams.get('category') || 'uncategorized',
          tags: u.searchParams.get('tags') || null,
          estimated_time_s: est.estimated_time || null,
          estimated_filament_g: est.filament_used_g || null,
          filament_type: est.filament_type || null,
          thumbnail_path: thumbPath
        });
        return sendJson(res, { id, filename: storedName }, 201);
      });
    }
    const libMatch = path.match(/^\/api\/library\/(\d+)$/);
    if (method === 'GET' && libMatch) {
      const item = getFileLibraryItem(parseInt(libMatch[1]));
      if (!item) return sendJson(res, { error: 'Not found' }, 404);
      return sendJson(res, item);
    }
    if (method === 'PUT' && libMatch) {
      return readBody(req, res, (body) => {
        updateFileLibraryItem(parseInt(libMatch[1]), body);
        return sendJson(res, { ok: true });
      });
    }
    if (method === 'DELETE' && libMatch) {
      const item = getFileLibraryItem(parseInt(libMatch[1]));
      if (item) {
        try { unlinkSync(join(DATA_DIR, 'library', item.filename)); } catch {}
        if (item.thumbnail_path) try { unlinkSync(join(DATA_DIR, 'library', item.thumbnail_path)); } catch {}
      }
      deleteFileLibraryItem(parseInt(libMatch[1]));
      return sendJson(res, { ok: true });
    }
    if (method === 'GET' && path.match(/^\/api\/library\/(\d+)\/thumbnail$/)) {
      const id = parseInt(path.match(/^\/api\/library\/(\d+)\/thumbnail$/)[1]);
      const item = getFileLibraryItem(id);
      if (!item || !item.thumbnail_path) return sendJson(res, { error: 'No thumbnail' }, 404);
      const thumbFile = join(DATA_DIR, 'library', item.thumbnail_path);
      if (!existsSync(thumbFile)) return sendJson(res, { error: 'Not found' }, 404);
      res.writeHead(200, { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' });
      createReadStream(thumbFile).pipe(res);
      return;
    }
    // Library 3D model preview — extract mesh data from 3MF for enhanced viewer
    if (method === 'GET' && path.match(/^\/api\/library\/(\d+)\/model$/)) {
      const id = parseInt(path.match(/^\/api\/library\/(\d+)\/model$/)[1]);
      const item = getFileLibraryItem(id);
      if (!item) return sendJson(res, { error: 'Not found' }, 404);
      if (!item.filename.endsWith('.3mf')) return sendJson(res, { error: 'Only 3MF files have 3D preview' }, 400);
      const filePath = join(DATA_DIR, 'library', item.filename);
      if (!existsSync(filePath)) return sendJson(res, { error: 'File not found' }, 404);
      try {
        const { extractMeshData } = await import('./lib3mf-parser.js');
        const buffer = readFileSync(filePath);
        const data = await extractMeshData(buffer);
        // Convert typed arrays to regular arrays for JSON serialization
        const meshes = data.meshes.map(m => ({
          name: m.name,
          vertices: Array.from(m.vertices),
          triangles: Array.from(m.triangles),
          vertexCount: m.vertexCount,
          triangleCount: m.triangleCount,
          materialColor: null,
        }));
        // Assign material colors if available
        if (data.materials.length > 0) {
          for (let i = 0; i < meshes.length; i++) {
            if (data.materials[i]) {
              meshes[i].materialColor = data.materials[i].color;
            }
          }
        }
        return sendJson(res, {
          meshes,
          buildItems: data.buildItems,
          materials: data.materials,
          colorGroups: data.colorGroups,
          metadata: data.metadata,
          unit: data.unit,
        });
      } catch (e) {
        return sendJson(res, { error: 'Failed to parse 3MF: ' + e.message }, 500);
      }
    }

    // Library 3MF validation
    if (method === 'POST' && path === '/api/library/validate') {
      return readBinaryBody(req, async (buffer) => {
        try {
          const { validate3mf } = await import('./lib3mf-parser.js');
          const result = await validate3mf(buffer);
          return sendJson(res, result);
        } catch (e) {
          return sendJson(res, { error: e.message }, 500);
        }
      });
    }

    // Generate 3MF sign model
    if (method === 'POST' && path === '/api/sign-maker/generate-3mf') {
      return readBody(req, res, async (body) => {
        try {
          const { generateSign3MF } = await import('./sign-3mf-generator.js');
          const buf = await generateSign3MF({
            part: body.part || 'all',
            title: body.title || '', subtitle: body.subtitle || '', qrData: body.qr_data || '',
            plateWidth: body.plate_width, plateHeight: body.plate_height, plateDepth: body.plate_depth,
            cornerRadius: body.corner_radius, qrSize: body.qr_size, pixelSize: body.pixel_size,
            qrHeight: body.qr_height, textHeight: body.text_height, textSize: body.text_size,
            includeBorder: body.include_border, frameWidth: body.frame_width, lipWidth: body.lip_width,
            lipDepth: body.lip_depth, frameChamfer: body.frame_chamfer, frameTolerance: body.frame_tolerance,
            includeStand: body.include_stand, standSlotDepth: body.stand_slot_depth,
            standSlotTolerance: body.stand_slot_tolerance, standBaseHeight: body.stand_base_height,
            standBaseDepth: body.stand_base_depth,
            includeMagnets: body.include_magnets, magnetDiameter: body.magnet_diameter,
            magnetThickness: body.magnet_thickness, magnetTolerance: body.magnet_tolerance,
            includeNfc: body.include_nfc, nfcShape: body.nfc_shape, nfcDiameter: body.nfc_diameter,
            nfcThickness: body.nfc_thickness, nfcTolerance: body.nfc_tolerance,
            includeHoles: body.include_holes, holeDiameter: body.hole_diameter, holeMargin: body.hole_margin,
          });
          const filename = (body.title || 'sign').replace(/[^a-zA-Z0-9_-]/g, '_') + '.3mf';
          res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': buf.length
          });
          res.end(buf);
        } catch (e) {
          sendJson(res, { error: 'Failed to generate 3MF: ' + e.message }, 500);
        }
      });
    }

    // ── Klipper Macros ──
    const klipMacroMatch = path.match(/^\/api\/printers\/([^/]+)\/macros$/);
    if (klipMacroMatch && method === 'GET') {
      const pid = decodeURIComponent(klipMacroMatch[1]);
      const entry = _printerManager?.printers?.get(pid);
      if (!entry?.client?.state) return sendJson(res, { error: 'Printer not found' }, 404);
      try {
        const objects = await entry.client._apiGet('/printer/objects/list');
        const macros = (objects?.result?.objects || [])
          .filter(o => o.startsWith('gcode_macro '))
          .map(o => o.replace('gcode_macro ', ''))
          .filter(m => !m.startsWith('_')) // skip internal macros
          .sort();
        return sendJson(res, { macros, total: macros.length });
      } catch (e) { return sendJson(res, { error: e.message }, 500); }
    }

    const klipMacroRunMatch = path.match(/^\/api\/printers\/([^/]+)\/macros\/run$/);
    if (klipMacroRunMatch && method === 'POST') {
      const pid = decodeURIComponent(klipMacroRunMatch[1]);
      return readBody(req, res, (body) => {
        if (!body.macro) return sendJson(res, { error: 'macro required' }, 400);
        const safe = body.macro.replace(/[^A-Z0-9_]/gi, '');
        _printerManager.handleCommand({ printer_id: pid, action: 'gcode', gcode: safe });
        return sendJson(res, { ok: true, ran: safe });
      });
    }

    // ── Spoolman Sync ──
    if (method === 'POST' && path === '/api/spoolman/sync') {
      return readBody(req, res, async (body) => {
        const spoolmanUrl = body.url || config.spoolman?.url;
        if (!spoolmanUrl) return sendJson(res, { error: 'Spoolman URL required (body.url or config.spoolman.url)' }, 400);
        try {
          // Fetch all spools from Spoolman
          const spoolRes = await fetch(`${spoolmanUrl}/api/v1/spool`, { signal: AbortSignal.timeout(10000) });
          if (!spoolRes.ok) throw new Error(`Spoolman HTTP ${spoolRes.status}`);
          const spools = await spoolRes.json();

          // Import into our inventory
          const { getInventorySpools, addSpool } = await import('./database.js');
          const existing = getInventorySpools();
          const existingNames = new Set(existing.map(s => s.name));
          let imported = 0;

          for (const spool of spools) {
            const filament = spool.filament || {};
            const name = `${filament.vendor?.name || 'Unknown'} ${filament.name || filament.material || 'Spool'}`;
            if (existingNames.has(name)) continue;

            addSpool({
              name,
              material: filament.material || 'PLA',
              color_hex: (filament.color_hex || '808080').replace('#', ''),
              brand: filament.vendor?.name || 'Unknown',
              weight_total: spool.initial_weight || 1000,
              weight_used: (spool.initial_weight || 1000) - (spool.remaining_weight || 0),
              price: filament.price || 0,
              diameter: filament.diameter || 1.75,
              temp_nozzle: filament.settings_extruder_temp || 210,
              temp_bed: filament.settings_bed_temp || 60,
              source: 'spoolman',
            });
            imported++;
          }

          return sendJson(res, { ok: true, imported, total: spools.length, skipped: spools.length - imported });
        } catch (e) { return sendJson(res, { error: 'Spoolman sync failed: ' + e.message }, 500); }
      });
    }

    // ── Brand Profiles (Prusa, Creality, Voron) ──
    if (method === 'GET' && path.startsWith('/api/profiles/')) {
      const brand = decodeURIComponent(path.split('/').pop());
      const brandMap = { prusa: 'prusa-profiles.json', creality: 'creality-profiles.json', voron: 'voron-profiles.json', elegoo: 'elegoo-profiles.json', qidi: 'qidi-profiles.json', anker: 'anker-ratrig-profiles.json', ratrig: 'anker-ratrig-profiles.json', ankermake: 'anker-ratrig-profiles.json' };
      const file = brandMap[brand.toLowerCase()];
      if (file) {
        try {
          const { readFileSync } = await import('node:fs');
          const { join, dirname } = await import('node:path');
          const { fileURLToPath } = await import('node:url');
          return sendJson(res, JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'data', file), 'utf8')));
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      }
    }

    // ── EULA ──
    if (method === 'GET' && path === '/api/eula') {
      try {
        const { readFileSync } = await import('node:fs');
        const { join, dirname } = await import('node:path');
        const { fileURLToPath } = await import('node:url');
        const eulaPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'EULA.md');
        const text = readFileSync(eulaPath, 'utf8');
        const accepted = getInventorySetting('eula_accepted') === '1';
        const acceptedAt = getInventorySetting('eula_accepted_at') || null;
        return sendJson(res, { text, accepted, acceptedAt, version: '1.0' });
      } catch (e) { return sendJson(res, { error: e.message }, 500); }
    }

    if (method === 'POST' && path === '/api/eula/accept') {
      setInventorySetting('eula_accepted', '1');
      setInventorySetting('eula_accepted_at', new Date().toISOString());
      setInventorySetting('eula_version', '1.0');
      return sendJson(res, { ok: true, acceptedAt: new Date().toISOString() });
    }

    // ── Bambu Printer Database ──
    if (method === 'GET' && path === '/api/bambu/printer-db') {
      try {
        const { readFileSync } = await import('node:fs');
        const { join, dirname } = await import('node:path');
        const { fileURLToPath } = await import('node:url');
        const dbPath = join(dirname(fileURLToPath(import.meta.url)), 'data', 'bambu-printer-db.json');
        return sendJson(res, JSON.parse(readFileSync(dbPath, 'utf8')));
      } catch (e) { return sendJson(res, { error: e.message }, 500); }
    }

    if (method === 'GET' && path.startsWith('/api/bambu/printer-db/')) {
      try {
        const modelId = decodeURIComponent(path.split('/').pop());
        const { readFileSync } = await import('node:fs');
        const { join, dirname } = await import('node:path');
        const { fileURLToPath } = await import('node:url');
        const dbPath = join(dirname(fileURLToPath(import.meta.url)), 'data', 'bambu-printer-db.json');
        const db = JSON.parse(readFileSync(dbPath, 'utf8'));
        const printer = db.printers[modelId];
        if (!printer) return sendJson(res, { error: 'Model not found' }, 404);
        return sendJson(res, printer);
      } catch (e) { return sendJson(res, { error: e.message }, 500); }
    }

    if (method === 'GET' && path === '/api/bambu/filament-blacklist') {
      try {
        const { readFileSync } = await import('node:fs');
        const { join, dirname } = await import('node:path');
        const { fileURLToPath } = await import('node:url');
        const dbPath = join(dirname(fileURLToPath(import.meta.url)), 'data', 'bambu-printer-db.json');
        const db = JSON.parse(readFileSync(dbPath, 'utf8'));
        return sendJson(res, db.filament_blacklist || {});
      } catch (e) { return sendJson(res, { error: e.message }, 500); }
    }

    // ── Cloudflare Tunnel ──
    if (path.startsWith('/api/tunnel')) {
      if (method === 'GET' && path === '/api/tunnel/status') {
        try {
          const { CloudflareTunnel } = await import('./cloudflare-tunnel.js');
          if (!globalThis._cfTunnel) globalThis._cfTunnel = new CloudflareTunnel();
          return sendJson(res, globalThis._cfTunnel.getStatus());
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      }
      if (method === 'POST' && path === '/api/tunnel/start') {
        try {
          const { CloudflareTunnel } = await import('./cloudflare-tunnel.js');
          if (!globalThis._cfTunnel) globalThis._cfTunnel = new CloudflareTunnel();
          const port = config.server?.httpsPort || 3443;
          return sendJson(res, globalThis._cfTunnel.startQuickTunnel(port));
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      }
      if (method === 'POST' && path === '/api/tunnel/stop') {
        try {
          if (globalThis._cfTunnel) return sendJson(res, globalThis._cfTunnel.stop());
          return sendJson(res, { ok: false, error: 'No tunnel instance' });
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      }
    }

    // ── Plugin Routes ──
    if (path.startsWith('/api/plugins/')) {
      const pluginRouteKey = `${method}:${path}`;
      const handler = _pluginManager?._pluginRoutes?.get(pluginRouteKey);
      if (handler) {
        try {
          if (method === 'POST' || method === 'PUT') {
            return readBody(req, res, async (body) => {
              const result = await handler(body, req, res);
              if (result !== undefined && !res.writableEnded) sendJson(res, result);
            });
          }
          const result = await handler(null, req, res);
          if (result !== undefined && !res.writableEnded) sendJson(res, result);
        } catch (e) { sendJson(res, { error: 'Plugin error: ' + e.message }, 500); }
        return;
      }
    }

    // ── G-code Analysis ──
    if (method === 'POST' && path === '/api/gcode/analyze') {
      return readBinaryBody(req, async (buffer) => {
        try {
          const text = buffer.toString('utf8');
          const { analyzeGcode } = await import('./gcode-toolpath.js');
          const analysis = analyzeGcode(text);
          return sendJson(res, analysis);
        } catch (e) { sendJson(res, { error: e.message }, 500); }
      });
    }

    // ── Moonraker File Manager / Job Queue / Webcam / Updates ──
    const moonMatch = path.match(/^\/api\/printers\/([^/]+)\/moonraker\/(.+)$/);
    if (moonMatch) {
      const pid = decodeURIComponent(moonMatch[1]);
      const moonPath = moonMatch[2];
      const entry = _printerManager?.printers?.get(pid);
      if (!entry) return sendJson(res, { error: 'Printer not found' }, 404);
      if (!entry.live || !entry.client) return sendJson(res, { error: 'Printer offline' }, 503);
      const client = entry.client;

      // ── File Upload (send gcode/3mf to printer) ──
      if (method === 'POST' && moonPath === 'upload') {
        return readBinaryBody(req, async (buffer) => {
          try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const filename = url.searchParams.get('filename') || 'print.gcode';
            const print = url.searchParams.get('print') === 'true';
            if (print) {
              const result = await client.uploadAndPrint(filename, buffer);
              return sendJson(res, { ok: true, uploaded: filename, printing: true, result });
            } else {
              const result = await client.uploadFile(filename, buffer);
              return sendJson(res, { ok: true, uploaded: filename, result });
            }
          } catch (e) { return sendJson(res, { error: 'Upload failed: ' + e.message }, 500); }
        });
      }

      // ── File Manager ──
      if (method === 'GET' && moonPath === 'files') {
        try {
          const files = await client.listFiles();
          return sendJson(res, { files });
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      }

      const fileMetaMatch = moonPath.match(/^files\/metadata\/(.+)$/);
      if (method === 'GET' && fileMetaMatch) {
        try {
          const meta = await client.getFileMetadata(decodeURIComponent(fileMetaMatch[1]));
          if (!meta) return sendJson(res, { error: 'File not found' }, 404);
          // Add full thumbnail URLs
          if (meta.thumbnails) {
            meta.thumbnails = meta.thumbnails.map(t => ({
              ...t,
              url: client.getThumbnailUrl(t.relative_path),
            }));
          }
          return sendJson(res, meta);
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      }

      const fileDeleteMatch = moonPath.match(/^files\/delete\/(.+)$/);
      if (method === 'DELETE' && fileDeleteMatch) {
        const ok = await client.deleteFile(decodeURIComponent(fileDeleteMatch[1]));
        return sendJson(res, { ok });
      }

      if (method === 'GET' && moonPath === 'files/download-url') {
        const filename = new URL(req.url, `http://${req.headers.host}`).searchParams.get('filename');
        if (!filename) return sendJson(res, { error: 'filename required' }, 400);
        return sendJson(res, { url: client.getFileDownloadUrl(filename) });
      }

      // ── Job Queue ──
      if (method === 'GET' && moonPath === 'queue') {
        try {
          const queue = await client.getJobQueue();
          return sendJson(res, queue);
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      }

      if (method === 'POST' && moonPath === 'queue/enqueue') {
        return readBody(req, res, async (body) => {
          if (!body.filenames && !body.filename) return sendJson(res, { error: 'filename(s) required' }, 400);
          const files = body.filenames || [body.filename];
          await client.enqueueJob(files);
          return sendJson(res, { ok: true, queued: files });
        });
      }

      if (method === 'POST' && moonPath === 'queue/start') {
        await client.startQueue();
        return sendJson(res, { ok: true });
      }

      if (method === 'POST' && moonPath === 'queue/pause') {
        await client.pauseQueue();
        return sendJson(res, { ok: true });
      }

      const queueRemoveMatch = moonPath.match(/^queue\/remove\/(.+)$/);
      if (method === 'DELETE' && queueRemoveMatch) {
        await client.removeQueueJob(decodeURIComponent(queueRemoveMatch[1]));
        return sendJson(res, { ok: true });
      }

      // ── Webcam ──
      if (method === 'GET' && moonPath === 'webcams') {
        try {
          const webcams = await client.getWebcams();
          return sendJson(res, { webcams });
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      }

      if (method === 'GET' && moonPath === 'snapshot') {
        try {
          const snapRes = await fetch(client.getSnapshotUrl(), { signal: AbortSignal.timeout(5000) });
          if (!snapRes.ok) return sendJson(res, { error: 'Snapshot failed' }, 502);
          const buf = Buffer.from(await snapRes.arrayBuffer());
          res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Content-Length': buf.length, 'Cache-Control': 'no-cache' });
          res.end(buf);
        } catch (e) { return sendJson(res, { error: e.message }, 502); }
        return;
      }

      if (method === 'GET' && moonPath === 'stream-url') {
        return sendJson(res, { stream: client.getStreamUrl(), snapshot: client.getSnapshotUrl() });
      }

      // ── Update Manager ──
      if (method === 'GET' && moonPath === 'updates') {
        try {
          const status = await client.getUpdateStatus();
          return sendJson(res, status || { error: 'Update manager not available' });
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      }

      if (method === 'POST' && moonPath.startsWith('updates/')) {
        const pkg = moonPath.replace('updates/', '');
        await client.triggerUpdate(pkg);
        return sendJson(res, { ok: true, updating: pkg });
      }

      // ── Spoolman (if configured in Moonraker) ──
      if (method === 'GET' && moonPath === 'spoolman/spools') {
        try {
          const data = await client._apiGet('/server/spoolman/proxy/v1/spool');
          return sendJson(res, data?.result || []);
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      }

      if (method === 'GET' && moonPath === 'spoolman/status') {
        try {
          const data = await client._apiGet('/server/spoolman/status');
          return sendJson(res, data?.result || {});
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      }

      return sendJson(res, { error: 'Unknown Moonraker endpoint' }, 404);
    }

    // ── Snapmaker U1 API ──
    const smMatch = path.match(/^\/api\/printers\/([^/]+)\/snapmaker\/(.+)$/);
    if (smMatch) {
      const pid = decodeURIComponent(smMatch[1]);
      const smPath = smMatch[2];
      const entry = _printerManager?.printers?.get(pid);
      if (!entry) return sendJson(res, { error: 'Printer not found' }, 404);
      const smState = entry.client?.state || {};

      if (method === 'GET' && smPath === 'state') {
        return sendJson(res, {
          machine_state: smState._sm_machine_state,
          state_name: smState._sm_state_name,
          state_category: smState._sm_state_category,
          state_label: smState._sm_state_label,
          action_code: smState._sm_action_code,
        });
      }

      if (method === 'GET' && smPath === 'filament') {
        return sendJson(res, {
          channels: smState._sm_filament || [],
          feed: smState._sm_feed_channels || [],
        });
      }

      if (method === 'GET' && smPath === 'defects') {
        const { getDefectEvents } = await import('./db/snapmaker.js');
        return sendJson(res, {
          current: smState._sm_defect || null,
          events: getDefectEvents(pid, 50),
        });
      }

      if (method === 'GET' && smPath === 'print-config') {
        return sendJson(res, smState._sm_print_config || {});
      }

      if (method === 'GET' && smPath === 'calibration') {
        const { getCalibrationResults } = await import('./db/snapmaker.js');
        return sendJson(res, {
          flow_cal: smState._sm_flow_cal || {},
          history: getCalibrationResults(pid),
        });
      }

      if (method === 'GET' && smPath === 'power') {
        return sendJson(res, smState._sm_power || {});
      }

      if (method === 'POST' && smPath === 'feed') {
        return readBody(req, res, (body) => {
          const action = body.action;
          if (!action || !['auto', 'unload', 'manual'].includes(action)) return sendJson(res, { error: 'action required: auto, unload, or manual' }, 400);
          const channel = parseInt(body.channel);
          if (isNaN(channel) || channel < 0 || channel > 3) return sendJson(res, { error: 'channel required: 0-3' }, 400);
          if (!entry.live) return sendJson(res, { error: 'Printer is offline' }, 503);
          if (action === 'auto') _printerManager.handleCommand({ printer_id: pid, action: 'sm_feed_auto', channel });
          else if (action === 'unload') _printerManager.handleCommand({ printer_id: pid, action: 'sm_feed_unload', channel });
          else if (action === 'manual') _printerManager.handleCommand({ printer_id: pid, action: 'sm_feed_manual', channel });
          return sendJson(res, { ok: true, action, channel });
        });
      }

      if (method === 'POST' && smPath === 'defects/enable') {
        _printerManager.handleCommand({ printer_id: pid, action: 'sm_defect_config', enable: true });
        return sendJson(res, { ok: true });
      }
      if (method === 'POST' && smPath === 'defects/disable') {
        _printerManager.handleCommand({ printer_id: pid, action: 'sm_defect_config', enable: false });
        return sendJson(res, { ok: true });
      }

      if (method === 'PUT' && smPath === 'print-config') {
        if (!entry.live) return sendJson(res, { error: 'Printer is offline' }, 503);
        return readBody(req, res, (body) => {
          const allowed = ['autoBedLeveling', 'flowCalibrate', 'shaperCalibrate', 'timelapse'];
          const filtered = {};
          for (const key of allowed) {
            if (body[key] !== undefined) filtered[key] = !!body[key];
          }
          if (Object.keys(filtered).length === 0) return sendJson(res, { error: 'No valid config keys provided. Allowed: ' + allowed.join(', ') }, 400);
          _printerManager.handleCommand({ printer_id: pid, action: 'sm_set_print_config', ...filtered });
          return sendJson(res, { ok: true, updated: filtered });
        });
      }

      // Filament parameters database (load/unload/clean temps per material)
      if (method === 'GET' && smPath === 'filament-params') {
        try {
          const { readFileSync } = await import('node:fs');
          const { join, dirname } = await import('node:path');
          const { fileURLToPath } = await import('node:url');
          const paramsPath = join(dirname(fileURLToPath(import.meta.url)), 'data', 'sm-filament-params.json');
          const params = JSON.parse(readFileSync(paramsPath, 'utf8'));
          return sendJson(res, params);
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      }

      // Auto-suggest temperatures for a filament type+subtype
      if (method === 'GET' && smPath === 'filament-params/suggest') {
        try {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const type = url.searchParams.get('type') || 'PLA';
          const subType = url.searchParams.get('subType') || 'Standard';
          const { readFileSync } = await import('node:fs');
          const { join, dirname } = await import('node:path');
          const { fileURLToPath } = await import('node:url');
          const paramsPath = join(dirname(fileURLToPath(import.meta.url)), 'data', 'sm-filament-params.json');
          const params = JSON.parse(readFileSync(paramsPath, 'utf8'));
          const typeParams = params[type];
          const suggestion = typeParams?.[subType] || typeParams?.Standard || typeParams?.default || null;
          return sendJson(res, suggestion || { error: `No params for ${type}/${subType}` });
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      }

      // Camera snapshot from defect detection (via Moonraker webcam)
      if (method === 'GET' && smPath === 'camera/snapshot') {
        try {
          const snapUrl = entry.client?.getSnapshotUrl();
          if (!snapUrl) return sendJson(res, { error: 'Webcam not available' }, 503);
          const snapRes = await fetch(snapUrl, { signal: AbortSignal.timeout(5000) });
          if (!snapRes.ok) return sendJson(res, { error: 'Snapshot failed' }, 502);
          const buf = Buffer.from(await snapRes.arrayBuffer());
          res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Content-Length': buf.length, 'Cache-Control': 'no-cache' });
          res.end(buf);
        } catch (e) { return sendJson(res, { error: e.message }, 502); }
        return;
      }

      // Purifier maintenance info
      if (method === 'GET' && smPath === 'purifier') {
        return sendJson(res, {
          ...(smState._purifier || {}),
          workTimeHours: smState._purifier?.work_time ? Math.round(smState._purifier.work_time / 3600 * 10) / 10 : 0,
          filterReplacementHours: 500,
          needsReplacement: (smState._purifier?.work_time || 0) > 500 * 3600,
        });
      }

      // Power loss recovery
      if (method === 'POST' && smPath === 'power-recovery') {
        if (!entry.live) return sendJson(res, { error: 'Printer offline' }, 503);
        _printerManager.handleCommand({ printer_id: pid, action: 'gcode', gcode: 'RESUME' });
        return sendJson(res, { ok: true, action: 'resume_after_power_loss' });
      }

      // Extruder offset calibration
      if (method === 'POST' && smPath === 'calibrate/extruder-offset') {
        if (!entry.live) return sendJson(res, { error: 'Printer offline' }, 503);
        return readBody(req, res, (body) => {
          const mode = body.mode || 'all';
          const gcode = mode === 'all' ? 'EXTRUDER_OFFSET_ACTION_PROBE_CALIBRATE_ALL' : `XYZ_OFFSET_CALIBRATE`;
          _printerManager.handleCommand({ printer_id: pid, action: 'gcode', gcode });
          return sendJson(res, { ok: true, mode });
        });
      }

      // All Snapmaker machine definitions
      if (method === 'GET' && smPath === 'machines') {
        try {
          const { readFileSync } = await import('node:fs');
          const { join, dirname } = await import('node:path');
          const { fileURLToPath } = await import('node:url');
          const defsPath = join(dirname(fileURLToPath(import.meta.url)), 'data', 'sm-machine-defs.json');
          return sendJson(res, JSON.parse(readFileSync(defsPath, 'utf8')));
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      }

      if (method === 'GET' && smPath === 'profiles') {
        try {
          const { readFileSync } = await import('node:fs');
          const { join, dirname } = await import('node:path');
          const { fileURLToPath } = await import('node:url');
          const profilePath = join(dirname(fileURLToPath(import.meta.url)), 'data', 'sm-u1-profiles.json');
          const profiles = JSON.parse(readFileSync(profilePath, 'utf8'));
          return sendJson(res, profiles);
        } catch (e) {
          return sendJson(res, { error: 'Profiles not available: ' + e.message }, 500);
        }
      }

      return sendJson(res, { error: 'Unknown Snapmaker endpoint' }, 404);
    }

    // ── Model Forge: Storage Box Generator ──
    if (method === 'POST' && path === '/api/model-forge/storage-box/generate-3mf') {
      return readBody(req, res, async (body) => {
        try {
          const { generateStorageBox3MF } = await import('./generators/storage-box-generator.js');
          const buf = await generateStorageBox3MF(body);
          res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': 'attachment; filename="storage_box.3mf"', 'Content-Length': buf.length });
          res.end(buf);
        } catch (e) { sendJson(res, { error: 'Storage box generation failed: ' + e.message }, 500); }
      });
    }

    // ── Model Forge: Keychain Generator ──
    if (method === 'POST' && path === '/api/model-forge/keychain/generate-3mf') {
      return readBody(req, res, async (body) => {
        try {
          const { generateKeychain3MF } = await import('./generators/keychain-generator.js');
          const buf = await generateKeychain3MF(body);
          const name = (body.text || 'keychain').replace(/[^a-zA-Z0-9_-]/g, '_');
          res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename="${name}.3mf"`, 'Content-Length': buf.length });
          res.end(buf);
        } catch (e) { sendJson(res, { error: 'Keychain generation failed: ' + e.message }, 500); }
      });
    }

    // ── Model Forge: Text Plate Generator ──
    if (method === 'POST' && path === '/api/model-forge/text-plate/generate-3mf') {
      return readBody(req, res, async (body) => {
        try {
          const { generateTextPlate3MF } = await import('./generators/text-plate-generator.js');
          const buf = await generateTextPlate3MF(body);
          res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': 'attachment; filename="text_plate.3mf"', 'Content-Length': buf.length });
          res.end(buf);
        } catch (e) { sendJson(res, { error: 'Text plate generation failed: ' + e.message }, 500); }
      });
    }

    // ── Model Forge: Cable Label Generator ──
    if (method === 'POST' && path === '/api/model-forge/cable-label/generate-3mf') {
      return readBody(req, res, async (body) => {
        try {
          const { generateCableLabel3MF } = await import('./generators/cable-label-generator.js');
          const buf = await generateCableLabel3MF(body);
          res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': 'attachment; filename="cable_label.3mf"', 'Content-Length': buf.length });
          res.end(buf);
        } catch (e) { sendJson(res, { error: 'Cable label generation failed: ' + e.message }, 500); }
      });
    }

    // ── Model Forge: Image Relief Generator ──
    if (method === 'POST' && path === '/api/model-forge/relief/generate-3mf') {
      return readBinaryBody(req, async (buffer) => {
        try {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const opts = {
            width: parseFloat(url.searchParams.get('width')) || 80,
            maxRelief: parseFloat(url.searchParams.get('maxRelief')) || 3,
            baseThickness: parseFloat(url.searchParams.get('baseThickness')) || 2,
            resolution: parseInt(url.searchParams.get('resolution')) || 150,
            invert: url.searchParams.get('invert') === 'true',
            mirror: url.searchParams.get('mirror') === 'true',
            gamma: parseFloat(url.searchParams.get('gamma')) || 1.0,
            border: url.searchParams.get('border') === 'true',
          };
          const { generateRelief3MF } = await import('./generators/relief-generator.js');
          const buf = await generateRelief3MF(buffer, opts);
          res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': 'attachment; filename="relief.3mf"', 'Content-Length': buf.length });
          res.end(buf);
        } catch (e) { sendJson(res, { error: 'Relief generation failed: ' + e.message }, 500); }
      });
    }

    // ── Model Forge: Stencil Generator ──
    if (method === 'POST' && path === '/api/model-forge/stencil/generate-3mf') {
      return readBinaryBody(req, async (buffer) => {
        try {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const opts = {
            width: parseFloat(url.searchParams.get('width')) || 100,
            thickness: parseFloat(url.searchParams.get('thickness')) || 1.5,
            resolution: parseInt(url.searchParams.get('resolution')) || 100,
            threshold: parseFloat(url.searchParams.get('threshold')) || 0.5,
            invert: url.searchParams.get('invert') === 'true',
            border: url.searchParams.get('border') !== 'false',
            borderWidth: parseFloat(url.searchParams.get('borderWidth')) || 3,
          };
          const { generateStencil3MF } = await import('./generators/stencil-generator.js');
          const buf = await generateStencil3MF(buffer, opts);
          res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': 'attachment; filename="stencil.3mf"', 'Content-Length': buf.length });
          res.end(buf);
        } catch (e) { sendJson(res, { error: 'Stencil generation failed: ' + e.message }, 500); }
      });
    }

    // ── Model Forge: Calibration & Utility Generators ──
    const calGenMatch = path.match(/^\/api\/model-forge\/(tolerance-test|bed-level|temp-tower|retraction-test|vase|qr-block|custom-shape|thread)\/generate-3mf$/);
    if (calGenMatch && method === 'POST') {
      return readBody(req, res, async (body) => {
        try {
          const tool = calGenMatch[1];
          const { generateToleranceTest, generateBedLevelTest, generateTempTower, generateRetractionTest,
                  generateVase, generateQRBlock, generateCustomShape, generateThread } = await import('./generators/calibration-generators.js');
          const generators = {
            'tolerance-test': generateToleranceTest,
            'bed-level': generateBedLevelTest,
            'temp-tower': generateTempTower,
            'retraction-test': generateRetractionTest,
            'vase': generateVase,
            'qr-block': generateQRBlock,
            'custom-shape': generateCustomShape,
            'thread': generateThread,
          };
          const gen = generators[tool];
          if (!gen) return sendJson(res, { error: 'Unknown tool' }, 404);
          const buf = await gen(body);
          const filename = tool.replace(/-/g, '_') + '.3mf';
          res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename="${filename}"`, 'Content-Length': buf.length });
          res.end(buf);
        } catch (e) { sendJson(res, { error: 'Generation failed: ' + e.message }, 500); }
      });
    }

    // ── Model Forge: 3MF Converter (Bambu → Snapmaker U1) ──
    if (method === 'POST' && path === '/api/model-forge/3mf-converter/analyze') {
      return readBinaryBody(req, async (buffer) => {
        try {
          const { analyze3mf } = await import('./generators/threemf-converter.js');
          const result = await analyze3mf(buffer);
          return sendJson(res, result);
        } catch (e) { sendJson(res, { error: e.message }, 500); }
      });
    }

    if (method === 'POST' && path === '/api/model-forge/3mf-converter/convert') {
      return readBinaryBody(req, async (buffer) => {
        try {
          const { convertBambuToU1 } = await import('./generators/threemf-converter.js');
          const converted = await convertBambuToU1(buffer);
          res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': 'attachment; filename="converted_U1.3mf"',
            'Content-Length': converted.length
          });
          res.end(converted);
        } catch (e) { sendJson(res, { error: 'Conversion failed: ' + e.message }, 500); }
      });
    }

    if (method === 'GET' && path === '/api/model-forge/3mf-converter/filament-map') {
      try {
        const { getFilamentMap } = await import('./generators/threemf-converter.js');
        return sendJson(res, getFilamentMap());
      } catch (e) { sendJson(res, { error: e.message }, 500); }
    }

    // ── Model Forge: Lithophane Generator ──
    if (method === 'POST' && path === '/api/model-forge/lithophane/generate-3mf') {
      return readBinaryBody(req, async (buffer) => {
        try {
          // Parse multipart — image is the binary body, params in query string
          const url = new URL(req.url, `http://${req.headers.host}`);
          const opts = {
            shape: url.searchParams.get('shape') || 'flat',
            width: parseFloat(url.searchParams.get('width')) || 100,
            maxThickness: parseFloat(url.searchParams.get('maxThickness')) || 3,
            minThickness: parseFloat(url.searchParams.get('minThickness')) || 0.4,
            resolution: parseInt(url.searchParams.get('resolution')) || 150,
            invert: url.searchParams.get('invert') === 'true',
            gamma: parseFloat(url.searchParams.get('gamma')) || 1.0,
            curveRadius: parseFloat(url.searchParams.get('curveRadius')) || 60,
            frame: url.searchParams.get('frame') === 'true',
            frameWidth: parseFloat(url.searchParams.get('frameWidth')) || 3,
            base: url.searchParams.get('base') === 'true',
            baseHeight: parseFloat(url.searchParams.get('baseHeight')) || 8,
          };
          const { generateLithophane3MF } = await import('./generators/lithophane-generator.js');
          const buf = await generateLithophane3MF(buffer, opts);
          res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': 'attachment; filename="lithophane.3mf"',
            'Content-Length': buf.length
          });
          res.end(buf);
        } catch (e) {
          sendJson(res, { error: 'Lithophane generation failed: ' + e.message }, 500);
        }
      });
    }

    // Upload 3MF linked to a history entry
    const histModelMatch = path.match(/^\/api\/history\/(\d+)\/model-3mf$/);
    if (histModelMatch && method === 'POST') {
      const histId = parseInt(histModelMatch[1]);
      const hist = getHistoryById(histId);
      if (!hist) return sendJson(res, { error: 'History not found' }, 404);
      return readBinaryBody(req, async (buffer) => {
        try {
          const dir = join(DATA_DIR, 'history-models');
          mkdirSync(dir, { recursive: true });
          const fname = `hist_${histId}.3mf`;
          writeFileSync(join(dir, fname), buffer);
          // Update DB
          const db = (await import('./db/connection.js')).getDb();
          db.prepare('UPDATE print_history SET linked_3mf = ? WHERE id = ?').run(fname, histId);
          // Also extract model_name if missing
          if (!hist.model_name) {
            try {
              const { parse3mfBuffer } = await import('./lib3mf-parser.js');
              const parsed = await parse3mfBuffer(buffer);
              if (parsed.metadata?.Title) {
                db.prepare('UPDATE print_history SET model_name = ? WHERE id = ?').run(parsed.metadata.Title.trim(), histId);
              }
            } catch {}
          }
          return sendJson(res, { ok: true, filename: fname });
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      });
    }
    if (histModelMatch && method === 'GET') {
      const histId = parseInt(histModelMatch[1]);
      const hist = getHistoryById(histId);
      if (!hist?.linked_3mf) return sendJson(res, { error: 'No linked 3MF' }, 404);
      const fp = join(DATA_DIR, 'history-models', hist.linked_3mf);
      if (!existsSync(fp)) return sendJson(res, { error: 'File missing' }, 404);
      res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
      createReadStream(fp).pipe(res);
      return;
    }
    if (histModelMatch && method === 'DELETE') {
      const histId = parseInt(histModelMatch[1]);
      const hist = getHistoryById(histId);
      if (hist?.linked_3mf) {
        try { unlinkSync(join(DATA_DIR, 'history-models', hist.linked_3mf)); } catch {}
        const db = (await import('./db/connection.js')).getDb();
        db.prepare('UPDATE print_history SET linked_3mf = NULL WHERE id = ?').run(histId);
      }
      return sendJson(res, { ok: true });
    }

    // Serve library files directly by filename (for 3mfViewer embed)
    const libFileMatch = path.match(/^\/api\/library-file\/(.+)$/);
    if (method === 'GET' && libFileMatch) {
      const fname = decodeURIComponent(libFileMatch[1]);
      const fp = join(DATA_DIR, 'library', fname);
      if (!fp.startsWith(join(DATA_DIR, 'library')) || !existsSync(fp)) return sendJson(res, { error: 'Not found' }, 404);
      res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename="${fname}"` });
      createReadStream(fp).pipe(res);
      return;
    }

    // Universal 3D preview: resolve 3MF from various sources
    // ?source=library&id=1  |  ?source=slicer&filename=xxx.3mf  |  ?source=history&id=744
    if (method === 'GET' && path === '/api/preview-3d') {
      const source = url.searchParams.get('source');
      const id = url.searchParams.get('id');
      const filename = url.searchParams.get('filename');
      let buffer = null;

      let downloadUrl = null; // URL to download original 3MF for 3mfViewer

      try {
        const { extractMeshData } = await import('./lib3mf-parser.js');

        if (source === 'library' && id) {
          const item = getFileLibraryItem(parseInt(id));
          if (item && item.filename.endsWith('.3mf')) {
            const fp = join(DATA_DIR, 'library', item.filename);
            if (existsSync(fp)) { buffer = readFileSync(fp); downloadUrl = `/api/library/${id}/download`; }
          }
        } else if (source === 'slicer' && filename) {
          // Try uploads dir, then library dir
          for (const dir of ['uploads', 'library']) {
            const fp = join(DATA_DIR, dir, filename);
            if (existsSync(fp)) { buffer = readFileSync(fp); break; }
          }
          // Also try with .3mf extension if gcode was given
          if (!buffer && !filename.endsWith('.3mf')) {
            const mfName = filename.replace(/\.gcode$/i, '.3mf');
            for (const dir of ['uploads', 'library']) {
              const fp = join(DATA_DIR, dir, mfName);
              if (existsSync(fp)) { buffer = readFileSync(fp); break; }
            }
          }
        } else if (source === 'history' && id) {
          // For history: check linked 3MF first, then try other strategies
          const histRow = getHistoryById(parseInt(id));
          if (histRow?.linked_3mf) {
            const linkedPath = join(DATA_DIR, 'history-models', histRow.linked_3mf);
            if (existsSync(linkedPath)) {
              buffer = readFileSync(linkedPath);
              downloadUrl = `/api/history/${id}/model-3mf`;
            }
          }
          if (histRow) {
            const gcodeFile = histRow.gcode_file || histRow.filename || '';
            const baseName = (gcodeFile.split('/').pop() || '').replace(/\.gcode$/i, '');

            // Strategy 1: Direct match in uploads/library dirs
            for (const ext of ['.3mf', '.gcode']) {
              if (buffer) break;
              const name = baseName + ext;
              for (const dir of ['uploads', 'library']) {
                const fp = join(DATA_DIR, dir, name);
                if (existsSync(fp) && ext === '.3mf') { buffer = readFileSync(fp); break; }
              }
            }

            // Strategy 2: Check model-cache (auto-saved during live print)
            if (!buffer) {
              const cacheDir = join(DATA_DIR, 'model-cache');
              if (existsSync(cacheDir)) {
                const safeName = baseName.replace(/[^a-zA-Z0-9._-]/g, '_');
                const cachePath = join(cacheDir, `${safeName}.3mf`);
                if (existsSync(cachePath)) buffer = readFileSync(cachePath);
              }
            }

            // Strategy 3: Fuzzy match in library — find 3MF whose name is contained in gcode name
            if (!buffer) {
              for (const dir of ['library', 'model-cache']) {
                if (buffer) break;
                const searchDir = join(DATA_DIR, dir);
                if (!existsSync(searchDir)) continue;
                const files = readdirSync(searchDir).filter(f => f.endsWith('.3mf'));
                for (const lf of files) {
                  const clean = lf.replace(/^lib_\d+_/, '').replace(/\.3mf$/i, '').toLowerCase();
                  if (clean && baseName.toLowerCase().includes(clean)) {
                    buffer = readFileSync(join(searchDir, lf));
                    // Set downloadUrl so client can use 3mfViewer
                    if (dir === 'library') {
                      downloadUrl = `/api/library-file/${encodeURIComponent(lf)}`;
                    }
                    break;
                  }
                }
              }
            }

            // Strategy 3: Fetch from printer via FTP (Bambu printers)
            if (!buffer && histRow.printer_id) {
              const printer = getPrinters().find(p => p.id === histRow.printer_id);
              if (printer?.ip) {
                const accessCode = printer.access_code || printer.accessCode;
                if (accessCode) {
                  try {
                    const { download3mf } = await import('./thumbnail-service.js');
                    buffer = await download3mf(printer.ip, accessCode, gcodeFile);
                  } catch { /* FTP/network not available */ }
                }
              }
            }
          }
        }

        // No buffer found — try gcode toolpath as fallback
        if (!buffer) {
          try {
            const toolpathData = await _getGcodeToolpath(source, id, filename);
            if (toolpathData) return sendJson(res, toolpathData);
          } catch { /* fallthrough */ }
          return sendJson(res, { error: 'No 3D model available for this print' }, 404);
        }

        const data = await extractMeshData(buffer);

        // If 3MF has no meshes (Bambu gcode.3mf), extract gcode toolpath from ZIP instead
        if (data.meshes.length === 0) {
          try {
            const { inflateRawSync } = await import('node:zlib');
            const { parseAndCache } = await import('./gcode-toolpath.js');
            for (let i = buffer.length - 22; i >= 0; i--) {
              if (buffer.readUInt32LE(i) === 0x06054b50) {
                let pos = buffer.readUInt32LE(i + 16);
                const cdEnd = pos + buffer.readUInt32LE(i + 12);
                while (pos < cdEnd && buffer.readUInt32LE(pos) === 0x02014b50) {
                  const method = buffer.readUInt16LE(pos + 10);
                  const cSize = buffer.readUInt32LE(pos + 20);
                  const uSize = buffer.readUInt32LE(pos + 24);
                  const nLen = buffer.readUInt16LE(pos + 28);
                  const eLen = buffer.readUInt16LE(pos + 30);
                  const cLen = buffer.readUInt16LE(pos + 32);
                  const lOff = buffer.readUInt32LE(pos + 42);
                  const name = buffer.toString('utf8', pos + 46, pos + 46 + nLen);
                  if (/\.gcode$/i.test(name)) {
                    const lnLen = buffer.readUInt16LE(lOff + 26);
                    const leLen = buffer.readUInt16LE(lOff + 28);
                    const dStart = lOff + 30 + lnLen + leLen;
                    let gcData;
                    if (method === 0) gcData = buffer.subarray(dStart, dStart + uSize);
                    else if (method === 8) { try { gcData = inflateRawSync(buffer.subarray(dStart, dStart + cSize)); } catch { gcData = null; } }
                    if (gcData) return sendJson(res, parseAndCache(gcData.toString('utf8'), name));
                  }
                  pos += 46 + nLen + eLen + cLen;
                }
                break;
              }
            }
          } catch { /* fallthrough */ }
          // Still try gcode toolpath helper
          try {
            const toolpathData = await _getGcodeToolpath(source, id, filename);
            if (toolpathData) return sendJson(res, toolpathData);
          } catch { /* fallthrough */ }
          return sendJson(res, { error: 'No 3D model or gcode found in file' }, 404);
        }
        const meshes = data.meshes.map(m => ({
          name: m.name,
          vertices: Array.from(m.vertices),
          triangles: Array.from(m.triangles),
          vertexCount: m.vertexCount,
          triangleCount: m.triangleCount,
          materialColor: null,
        }));
        if (data.materials.length > 0) {
          for (let i = 0; i < meshes.length; i++) {
            if (data.materials[i]) meshes[i].materialColor = data.materials[i].color;
          }
        }
        return sendJson(res, {
          type: 'mesh',
          meshes,
          buildItems: data.buildItems,
          materials: data.materials,
          metadata: data.metadata,
          unit: data.unit,
          downloadUrl: downloadUrl || null,
        });
      } catch (e) {
        return sendJson(res, { error: 'Could not load 3D model:' + e.message }, 500);
      }
    }

    // Helper: get 3D model or toolpath for any printer type
    // Uses printer-capabilities to determine the correct strategy
    async function _getGcodeToolpath(source, id, filename) {
      const { parseAndCache, downloadGcodeFromMoonraker } = await import('./gcode-toolpath.js');
      const { getModelStrategy } = await import('./printer-capabilities.js');

      if (source === 'history' && id) {
        const histRow = getHistoryById(parseInt(id));
        if (!histRow) return null;
        const printer = getPrinters().find(p => p.id === histRow.printer_id);
        if (!printer) return null;

        const strategy = getModelStrategy(printer, histRow);
        const baseName = (histRow.filename || '').replace(/^.*\//, '');

        // 1. Try local gcode files (uploads/library)
        for (const dir of ['uploads', 'library']) {
          const searchDir = join(DATA_DIR, dir);
          if (!existsSync(searchDir)) continue;
          const fp = join(searchDir, baseName);
          if (existsSync(fp)) return parseAndCache(readFileSync(fp, 'utf8'), baseName);
        }

        // 2. Printer-specific strategy
        if (strategy.strategy === 'moonraker-gcode') {
          // Moonraker: download gcode directly via HTTP API
          const text = await downloadGcodeFromMoonraker(printer.ip, printer.port || 80, baseName);
          if (text) return parseAndCache(text, baseName);

        } else if (strategy.strategy === 'bambu-ftps') {
          // Bambu: download .gcode.3mf via FTPS, extract embedded gcode
          const accessCode = printer.access_code || printer.accessCode;
          if (!accessCode) return null;

          const { download3mf, downloadAny3mf } = await import('./thumbnail-service.js');
          let zipBuf = null;

          // Try each search name (model_name → filename → gcode_file)
          for (const name of strategy.searchNames) {
            zipBuf = await download3mf(printer.ip, accessCode, name);
            if (zipBuf) break;
          }

          if (!zipBuf) return null;

          // Bambu gcode.3mf has no mesh — extract gcode from ZIP
          return _extractGcodeFromZip(zipBuf, baseName);
        }
      } else if (source === 'gcode' && filename) {
        for (const dir of ['uploads', 'library']) {
          const fp = join(DATA_DIR, dir, filename);
          if (existsSync(fp)) return parseAndCache(readFileSync(fp, 'utf8'), filename);
        }
      }

      return null;
    }

    // Extract gcode from a ZIP (3MF) file and parse as toolpath
    async function _extractGcodeFromZip(zipBuf, filename) {
      const { parseAndCache } = await import('./gcode-toolpath.js');
      const { inflateRawSync } = await import('node:zlib');
      for (let i = zipBuf.length - 22; i >= 0; i--) {
        if (zipBuf.readUInt32LE(i) !== 0x06054b50) continue;
        let pos = zipBuf.readUInt32LE(i + 16);
        const cdEnd = pos + zipBuf.readUInt32LE(i + 12);
        while (pos < cdEnd && zipBuf.readUInt32LE(pos) === 0x02014b50) {
          const method = zipBuf.readUInt16LE(pos + 10);
          const cSize = zipBuf.readUInt32LE(pos + 20);
          const uSize = zipBuf.readUInt32LE(pos + 24);
          const nLen = zipBuf.readUInt16LE(pos + 28);
          const eLen = zipBuf.readUInt16LE(pos + 30);
          const cLen = zipBuf.readUInt16LE(pos + 32);
          const lOff = zipBuf.readUInt32LE(pos + 42);
          const name = zipBuf.toString('utf8', pos + 46, pos + 46 + nLen);
          if (/\.gcode$/i.test(name)) {
            const lnLen = zipBuf.readUInt16LE(lOff + 26);
            const leLen = zipBuf.readUInt16LE(lOff + 28);
            const dStart = lOff + 30 + lnLen + leLen;
            let gcData;
            if (method === 0) gcData = zipBuf.subarray(dStart, dStart + uSize);
            else if (method === 8) { try { gcData = inflateRawSync(zipBuf.subarray(dStart, dStart + cSize)); } catch { gcData = null; } }
            if (gcData) return parseAndCache(gcData.toString('utf8'), filename || name);
          }
          pos += 46 + nLen + eLen + cLen;
        }
        break;
      }
      return null;
    }

    if (method === 'GET' && path.match(/^\/api\/library\/(\d+)\/download$/)) {
      const id = parseInt(path.match(/^\/api\/library\/(\d+)\/download$/)[1]);
      const item = getFileLibraryItem(id);
      if (!item) return sendJson(res, { error: 'Not found' }, 404);
      const filePath = join(DATA_DIR, 'library', item.filename);
      if (!existsSync(filePath)) return sendJson(res, { error: 'File not found' }, 404);
      res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename="${item.original_name}"` });
      createReadStream(filePath).pipe(res);
      return;
    }

    // ---- Activity Heatmap ----
    if (method === 'GET' && path === '/api/activity/daily') {
      const u = new URL(req.url, 'http://localhost');
      const days = parseInt(u.searchParams.get('days') || '365');
      return sendJson(res, getDailyActivity(days));
    }
    if (method === 'GET' && path === '/api/activity/streaks') {
      return sendJson(res, getActivityStreaks());
    }

    // ---- Achievements ----
    if (method === 'GET' && path === '/api/achievements') {
      return sendJson(res, calculateAchievements());
    }

    // ---- Settings Export / Import ----
    if (method === 'GET' && path === '/api/settings/export') {
      const exported = {
        _meta: { type: '3dprintforge-settings', version: 1, exported_at: new Date().toISOString() },
        widget_layouts: getWidgetLayouts(),
        custom_fields: getCustomFieldDefs(null),
        notification_config: (() => { try { return config.notifications || {}; } catch { return {}; } })(),
        inventory_settings: getAllInventorySettings(),
      };
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename=3dprintforge-settings.json',
        'X-API-Version': _pkgVersion
      });
      return res.end(JSON.stringify(exported, null, 2));
    }

    if (method === 'POST' && path === '/api/settings/import') {
      return readBody(req, res, (body) => {
        if (!body || !body._meta || (body._meta.type !== '3dprintforge-settings' && body._meta.type !== '3dprintforge-settings')) {
          return sendJson(res, { error: 'Invalid settings file. Missing _meta or wrong type.' }, 400);
        }
        let applied = 0;

        // Import widget layouts
        if (Array.isArray(body.widget_layouts)) {
          for (const wl of body.widget_layouts) {
            if (wl.name && wl.layout) {
              saveWidgetLayout(wl.name, typeof wl.layout === 'string' ? JSON.parse(wl.layout) : wl.layout);
              applied++;
            }
          }
        }

        // Import custom field definitions
        if (Array.isArray(body.custom_fields)) {
          for (const cf of body.custom_fields) {
            if (cf.entity_type && cf.field_name && cf.field_label) {
              try { addCustomFieldDef(cf); applied++; } catch { /* skip duplicates */ }
            }
          }
        }

        // Import inventory settings
        if (body.inventory_settings && typeof body.inventory_settings === 'object') {
          for (const [key, value] of Object.entries(body.inventory_settings)) {
            try { setInventorySetting(key, typeof value === 'string' ? value : JSON.stringify(value)); applied++; } catch { /* skip */ }
          }
        }

        return sendJson(res, { ok: true, applied });
      });
    }

    // ---- Widget Layouts ----
    if (method === 'GET' && path === '/api/widgets') {
      return sendJson(res, getWidgetLayouts());
    }
    if (method === 'GET' && path === '/api/widgets/active') {
      return sendJson(res, getActiveWidgetLayout() || { layout: '[]' });
    }
    if (method === 'POST' && path === '/api/widgets') {
      const body = await readBody(req);
      const id = saveWidgetLayout(body.name || 'default', body.layout || []);
      if (body.active) setActiveWidgetLayout(id);
      return sendJson(res, { ok: true, id });
    }
    if (method === 'PUT' && path.match(/^\/api\/widgets\/(\d+)\/activate$/)) {
      const id = parseInt(path.match(/^\/api\/widgets\/(\d+)\/activate$/)[1]);
      setActiveWidgetLayout(id);
      return sendJson(res, { ok: true });
    }
    if (method === 'DELETE' && path.match(/^\/api\/widgets\/(\d+)$/)) {
      const id = parseInt(path.match(/^\/api\/widgets\/(\d+)$/)[1]);
      deleteWidgetLayout(id);
      return sendJson(res, { ok: true });
    }

    // ---- Print Time Tracking ----
    if (method === 'GET' && path === '/api/time-tracking') {
      const u = new URL(req.url, 'http://localhost');
      const opts = {};
      if (u.searchParams.get('filament_type')) opts.filament_type = u.searchParams.get('filament_type');
      if (u.searchParams.get('from')) opts.from = u.searchParams.get('from');
      if (u.searchParams.get('to')) opts.to = u.searchParams.get('to');
      if (u.searchParams.get('limit')) opts.limit = parseInt(u.searchParams.get('limit'));
      return sendJson(res, getTimeTracking(opts));
    }
    if (method === 'GET' && path === '/api/time-tracking/stats') {
      return sendJson(res, getTimeTrackingStats());
    }
    if (method === 'POST' && path === '/api/time-tracking') {
      const body = await readBody(req);
      const id = addTimeTracking(body);
      return sendJson(res, { ok: true, id });
    }

    // ---- Milestone Screenshots ----
    if (method === 'GET' && path.startsWith('/api/milestones/archive/')) {
      const parts = path.split('/');
      // /api/milestones/archive/{historyId}/{filename}
      if (parts.length === 6) {
        const historyId = parts[4];
        const filename = parts[5];
        const filepath = getArchivedMilestoneFile(historyId, filename);
        if (filepath) {
          res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' });
          return createReadStream(filepath).pipe(res);
        }
        return sendJson(res, { error: 'Not found' }, 404);
      }
      // /api/milestones/archive/{historyId}
      if (parts.length === 5) {
        const historyId = parts[4];
        return sendJson(res, getArchivedMilestones(historyId));
      }
    }
    if (method === 'GET' && path.startsWith('/api/milestones/')) {
      const parts = path.split('/');
      // /api/milestones/{printerId}/{filename}
      if (parts.length === 5) {
        const printerId = parts[3];
        const filename = parts[4];
        const filepath = getMilestoneFile(printerId, filename);
        if (filepath) {
          res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-cache' });
          return createReadStream(filepath).pipe(res);
        }
        return sendJson(res, { error: 'Not found' }, 404);
      }
      // /api/milestones/{printerId}
      if (parts.length === 4) {
        const printerId = parts[3];
        return sendJson(res, getMilestones(printerId));
      }
    }

    // ---- Power Monitor (Shelly/Tasmota) ----
    if (method === 'GET' && path === '/api/power/current') {
      return sendJson(res, _power.getLatestPower() || { watts: null });
    }
    if (method === 'GET' && path === '/api/power/session') {
      return sendJson(res, _power.getLiveSession() || { error: 'No active session' });
    }
    if (method === 'GET' && path.startsWith('/api/power/print/')) {
      const printId = parseInt(path.split('/').pop());
      return sendJson(res, _power.getPrintPower(printId) || { error: 'No data' });
    }
    if (method === 'GET' && path === '/api/power/history') {
      const u = new URL(req.url, 'http://localhost');
      const limit = parseInt(u.searchParams.get('limit') || '20');
      return sendJson(res, _power.getPowerHistory(limit));
    }
    if (method === 'POST' && path === '/api/power/poll') {
      const result = await _power.pollNow();
      return sendJson(res, result || { error: 'Poll failed' });
    }
    if (method === 'POST' && path === '/api/power/restart') {
      _power.restartMonitor();
      return sendJson(res, { ok: true });
    }

    // ---- Material Reference ----
    if (method === 'GET' && path === '/api/materials') {
      return sendJson(res, getMaterials());
    }

    if (method === 'POST' && path === '/api/materials') {
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
        if (!body.printer_id) return sendJson(res, { error: 'printer_id required' }, 400);
        try {
          assignHardware(parseInt(hwAssignMatch[1]), body.printer_id);
          return sendJson(res, { ok: true });
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      });
    }

    const hwUnassignMatch = path.match(/^\/api\/hardware\/(\d+)\/unassign$/);
    if (hwUnassignMatch && method === 'POST') {
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, async (body) => {
        if (!body.license_key) return sendJson(res, { error: 'license_key required' }, 400);
        if (!_ecomLicense) return sendJson(res, { error: 'License manager not initialized' }, 500);
        try {
          const result = await _ecomLicense.activate(body.license_key, body.email, body.domain, body.phone);
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
      return readBody(req, res, (body) => {
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
        return readBody(req, res, (body) => { updateEcommerceConfig(id, body); sendJson(res, { ok: true }); });
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
      if (method === 'PUT') return readBody(req, res, (body) => { updateEcommerceOrder(id, body); sendJson(res, { ok: true }); });
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
                } catch (e) { log.warn('Failed to add ecom queue item', e.message); }
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

    // ---- CRM ----
    if (path.startsWith('/api/crm/')) {
      if (_ecomLicense && !_ecomLicense.isActive()) return sendJson(res, { error: 'Active e-commerce license required' }, 403);

      // Dashboard
      if (method === 'GET' && path === '/api/crm/dashboard') {
        try { return sendJson(res, getCrmDashboard()); }
        catch (e) { log.error('CRM dashboard error', e.message); return sendJson(res, { error: e.message }, 500); }
      }

      // Customers list + create
      if (path === '/api/crm/customers' && !path.includes('/api/crm/customers/')) {
        if (method === 'GET') {
          const search = url.searchParams.get('search');
          const limit = parseInt(url.searchParams.get('limit') || '50');
          const offset = parseInt(url.searchParams.get('offset') || '0');
          try { return sendJson(res, getCrmCustomers(search, limit, offset)); }
          catch (e) { return sendJson(res, { error: e.message }, 500); }
        }
        if (method === 'POST') {
          return readBody(req, res, (body) => {
            if (!body.name) return sendJson(res, { error: 'name is required' }, 400);
            try {
              const id = createCrmCustomer(body);
              return sendJson(res, { ok: true, id }, 201);
            } catch (e) { return sendJson(res, { error: e.message }, 500); }
          });
        }
      }

      // Customer detail
      const crmCustomerMatch = path.match(/^\/api\/crm\/customers\/(\d+)$/);
      if (crmCustomerMatch) {
        const id = parseInt(crmCustomerMatch[1]);
        if (method === 'GET') {
          const customer = getCrmCustomer(id);
          if (!customer) return sendJson(res, { error: 'Not found' }, 404);
          return sendJson(res, customer);
        }
        if (method === 'PUT') {
          return readBody(req, res, (body) => {
            try { updateCrmCustomer(id, body); return sendJson(res, { ok: true }); }
            catch (e) { return sendJson(res, { error: e.message }, 500); }
          });
        }
        if (method === 'DELETE') {
          try { deleteCrmCustomer(id); return sendJson(res, { ok: true }); }
          catch (e) { return sendJson(res, { error: e.message }, 500); }
        }
      }

      // Orders list + create
      if (path === '/api/crm/orders' && !path.includes('/api/crm/orders/')) {
        if (method === 'GET') {
          const filters = {
            status: url.searchParams.get('status') || undefined,
            customer_id: url.searchParams.get('customer_id') ? parseInt(url.searchParams.get('customer_id')) : undefined,
            limit: parseInt(url.searchParams.get('limit') || '50'),
            offset: parseInt(url.searchParams.get('offset') || '0')
          };
          try { return sendJson(res, getCrmOrders(filters)); }
          catch (e) { return sendJson(res, { error: e.message }, 500); }
        }
        if (method === 'POST') {
          return readBody(req, res, (body) => {
            try {
              const result = createCrmOrder(body);
              return sendJson(res, { ok: true, ...result }, 201);
            } catch (e) { return sendJson(res, { error: e.message }, 500); }
          });
        }
      }

      // Order from print history
      const crmFromHistoryMatch = path.match(/^\/api\/crm\/orders\/from-history\/(\d+)$/);
      if (crmFromHistoryMatch && method === 'POST') {
        const printId = parseInt(crmFromHistoryMatch[1]);
        const customerId = parseInt(url.searchParams.get('customer_id'));
        if (!customerId || isNaN(customerId)) {
          return sendJson(res, { error: 'customer_id query parameter is required' }, 400);
        }
        try {
          const result = createCrmOrderFromHistory(printId, customerId);
          return sendJson(res, { ok: true, ...result }, 201);
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      }

      // Order status update
      const crmOrderStatusMatch = path.match(/^\/api\/crm\/orders\/(\d+)\/status$/);
      if (crmOrderStatusMatch && method === 'PATCH') {
        const id = parseInt(crmOrderStatusMatch[1]);
        return readBody(req, res, (body) => {
          if (!body.status) return sendJson(res, { error: 'status is required' }, 400);
          try { updateCrmOrderStatus(id, body.status); return sendJson(res, { ok: true }); }
          catch (e) { return sendJson(res, { error: e.message }, 400); }
        });
      }

      // Order items
      const crmOrderItemsMatch = path.match(/^\/api\/crm\/orders\/(\d+)\/items$/);
      if (crmOrderItemsMatch && method === 'POST') {
        const orderId = parseInt(crmOrderItemsMatch[1]);
        return readBody(req, res, (body) => {
          try {
            const itemId = addCrmOrderItem(orderId, body);
            return sendJson(res, { ok: true, id: itemId }, 201);
          } catch (e) { return sendJson(res, { error: e.message }, 500); }
        });
      }

      const crmOrderItemDeleteMatch = path.match(/^\/api\/crm\/orders\/(\d+)\/items\/(\d+)$/);
      if (crmOrderItemDeleteMatch && method === 'DELETE') {
        const itemId = parseInt(crmOrderItemDeleteMatch[2]);
        try { removeCrmOrderItem(itemId); return sendJson(res, { ok: true }); }
        catch (e) { return sendJson(res, { error: e.message }, 500); }
      }

      // Order invoice
      const crmOrderInvoiceMatch = path.match(/^\/api\/crm\/orders\/(\d+)\/invoice$/);
      if (crmOrderInvoiceMatch && method === 'POST') {
        const orderId = parseInt(crmOrderInvoiceMatch[1]);
        try {
          const result = createCrmInvoice(orderId);
          return sendJson(res, { ok: true, ...result }, 201);
        } catch (e) { return sendJson(res, { error: e.message }, 500); }
      }

      // Order detail
      const crmOrderMatch = path.match(/^\/api\/crm\/orders\/(\d+)$/);
      if (crmOrderMatch) {
        const id = parseInt(crmOrderMatch[1]);
        if (method === 'GET') {
          const order = getCrmOrder(id);
          if (!order) return sendJson(res, { error: 'Not found' }, 404);
          return sendJson(res, order);
        }
        if (method === 'PUT') {
          return readBody(req, res, (body) => {
            try { updateCrmOrder(id, body); return sendJson(res, { ok: true }); }
            catch (e) { return sendJson(res, { error: e.message }, 500); }
          });
        }
      }

      // Invoices list
      if (method === 'GET' && path === '/api/crm/invoices') {
        const limit = parseInt(url.searchParams.get('limit') || '50');
        const offset = parseInt(url.searchParams.get('offset') || '0');
        try { return sendJson(res, getCrmInvoices(limit, offset)); }
        catch (e) { return sendJson(res, { error: e.message }, 500); }
      }

      // Invoice status
      const crmInvoiceStatusMatch = path.match(/^\/api\/crm\/invoices\/(\d+)\/status$/);
      if (crmInvoiceStatusMatch && method === 'PATCH') {
        const id = parseInt(crmInvoiceStatusMatch[1]);
        return readBody(req, res, (body) => {
          if (!body.status) return sendJson(res, { error: 'status is required' }, 400);
          try { updateCrmInvoiceStatus(id, body.status); return sendJson(res, { ok: true }); }
          catch (e) { return sendJson(res, { error: e.message }, 400); }
        });
      }

      // Invoice HTML view (printable)
      const crmInvoiceHtmlMatch = path.match(/^\/api\/crm\/invoices\/(\d+)\/html$/);
      if (crmInvoiceHtmlMatch && method === 'GET') {
        const id = parseInt(crmInvoiceHtmlMatch[1]);
        try {
          const invoice = getCrmInvoice(id);
          if (!invoice) return sendJson(res, { error: 'Invoice not found' }, 404);
          const order = invoice.order_id ? getCrmOrder(invoice.order_id) : null;
          const customer = invoice.customer_id ? getCrmCustomer(invoice.customer_id) : invoice;
          const items = invoice.items || (order ? order.items : []);
          const companySettings = getCrmSettings();
          const html = generateInvoiceHtml(order, customer, items, invoice, companySettings);
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(html);
          return;
        } catch (e) { log.error('Invoice HTML error', e.message); return sendJson(res, { error: e.message }, 500); }
      }

      // CRM Settings
      if (path === '/api/crm/settings') {
        if (method === 'GET') {
          try { return sendJson(res, getCrmSettings()); }
          catch (e) { return sendJson(res, { error: e.message }, 500); }
        }
        if (method === 'PUT') {
          return readBody(req, res, (body) => {
            try { updateCrmSettings(body); return sendJson(res, { ok: true }); }
            catch (e) { return sendJson(res, { error: e.message }, 500); }
          });
        }
      }
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
        if (rec && rec.file_path) { try { const { unlinkSync: ul } = await import('node:fs'); ul(rec.file_path); } catch (e) { log.warn('Failed to delete timelapse file', e.message); } }
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

    // Timelapse re-encode (speed, quality, trim)
    const timelapseEditMatch = path.match(/^\/api\/timelapse\/(\d+)\/reencode$/);
    if (timelapseEditMatch && method === 'POST') {
      const id = parseInt(timelapseEditMatch[1]);
      return readBody(req, res, async (body) => {
        const rec = getTimelapseRecording(id);
        if (!rec || !rec.file_path || !existsSync(rec.file_path)) return sendJson(res, { error: 'Video not found' }, 404);
        const { speed, quality, trim_start, trim_end } = body;
        try {
          const { execSync } = await import('node:child_process');
          const outPath = rec.file_path.replace('.mp4', `_edited_${Date.now()}.mp4`);
          let ffArgs = ['-y', '-i', rec.file_path];
          // Trim
          if (trim_start) ffArgs.push('-ss', String(trim_start));
          if (trim_end) ffArgs.push('-to', String(trim_end));
          // Speed
          const spd = parseFloat(speed) || 1;
          if (spd !== 1) ffArgs.push('-filter:v', `setpts=${(1/spd).toFixed(3)}*PTS`);
          // Quality
          const crf = quality === 'high' ? 18 : quality === 'low' ? 28 : 23;
          ffArgs.push('-c:v', 'libx264', '-preset', 'fast', '-crf', String(crf), '-pix_fmt', 'yuv420p', outPath);
          execSync('ffmpeg ' + ffArgs.join(' '), { timeout: 300000 });
          // Get file size
          const { statSync: st } = await import('node:fs');
          const size = st(outPath).size;
          sendJson(res, { ok: true, output: outPath, size_bytes: size });
        } catch (e) {
          sendJson(res, { error: 'Re-encoding feilet: ' + e.message }, 500);
        }
      });
    }

    // ---- Push Subscriptions ----
    if (method === 'POST' && path === '/api/push/subscribe') {
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      if (url.searchParams.get('translucent')) filters.translucent = true;
      if (url.searchParams.get('glow')) filters.glow = true;
      if (url.searchParams.get('multi_color')) filters.multi_color = true;
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, async (body) => {
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
      return readBody(req, res, (body) => {
        if (!body.manufacturer || !body.material) return sendJson(res, { error: 'manufacturer and material required' }, 400);
        const id = addCommunityFilament(body);
        sendJson(res, { ok: true, id }, 201);
      });
    }

    if (cfMatch && method === 'PUT') {
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
        if (!body.entity_type || !body.field_name || !body.field_label) return sendJson(res, { error: 'entity_type, field_name, field_label required' }, 400);
        const id = addCustomFieldDef(body);
        sendJson(res, { ok: true, id }, 201);
      });
    }

    if (cfdMatch && method === 'PUT') {
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
        if (!body.name) return sendJson(res, { error: 'name required' }, 400);
        const id = addPrinterGroup(body);
        sendJson(res, { ok: true, id }, 201);
      });
    }

    if (pgMatch && method === 'PUT') {
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
    if (method === 'GET' && path === '/api/projects/dashboard') {
      return sendJson(res, getProjectDashboard());
    }

    if (method === 'GET' && path === '/api/projects/overdue') {
      return sendJson(res, getOverdueProjects());
    }

    if (method === 'GET' && path === '/api/projects') {
      const status = url.searchParams.get('status');
      return sendJson(res, getProjects(status || null));
    }

    const projMatch = path.match(/^\/api\/projects\/(\d+)$/);

    const projDetailsMatch = path.match(/^\/api\/projects\/(\d+)\/details$/);
    if (projDetailsMatch && method === 'GET') {
      const p = getProjectWithDetails(parseInt(projDetailsMatch[1]));
      if (!p) return sendJson(res, { error: 'Not found' }, 404);
      return sendJson(res, p);
    }

    const projCostMatch = path.match(/^\/api\/projects\/(\d+)\/cost-summary$/);
    if (projCostMatch && method === 'GET') {
      return sendJson(res, getProjectCostSummary(parseInt(projCostMatch[1])));
    }

    const projTimelineMatch = path.match(/^\/api\/projects\/(\d+)\/timeline$/);
    if (projTimelineMatch && method === 'GET') {
      return sendJson(res, getProjectTimeline(parseInt(projTimelineMatch[1])));
    }

    const projInvoicesMatch = path.match(/^\/api\/projects\/(\d+)\/invoices$/);
    if (projInvoicesMatch && method === 'GET') {
      return sendJson(res, getProjectInvoices(parseInt(projInvoicesMatch[1])));
    }

    if (projInvoicesMatch && method === 'POST') {
      return readBody(req, res, (body) => {
        body.project_id = parseInt(projInvoicesMatch[1]);
        if (!body.invoice_number) {
          body.invoice_number = 'INV-' + Date.now();
        }
        const id = createInvoice(body);
        addTimelineEvent(body.project_id, 'invoice_created', 'Invoice ' + body.invoice_number + ' created');
        sendJson(res, { ok: true, id }, 201);
      });
    }

    const projShareMatch = path.match(/^\/api\/projects\/(\d+)\/share$/);
    if (projShareMatch && method === 'POST') {
      return readBody(req, res, (body) => {
        const projectId = parseInt(projShareMatch[1]);
        const p = getProject(projectId);
        if (!p) return sendJson(res, { error: 'Not found' }, 404);
        if (body.enabled === false) {
          updateProject(projectId, { share_enabled: 0 });
          addTimelineEvent(projectId, 'share_toggled', 'Delingslenke deaktivert');
          return sendJson(res, { ok: true, share_enabled: false });
        }
        let token = p.share_token;
        if (!token) {
          token = generateShareToken(projectId);
        } else {
          updateProject(projectId, { share_enabled: 1 });
        }
        addTimelineEvent(projectId, 'share_toggled', 'Delingslenke aktivert');
        sendJson(res, { ok: true, share_token: token, share_enabled: true });
      });
    }

    const projLinkQueueMatch = path.match(/^\/api\/projects\/(\d+)\/link-queue$/);
    if (projLinkQueueMatch && method === 'POST') {
      return readBody(req, res, (body) => {
        const projectId = parseInt(projLinkQueueMatch[1]);
        if (!body.queue_item_id) return sendJson(res, { error: 'queue_item_id required' }, 400);
        const id = addProjectPrint({ project_id: projectId, queue_item_id: body.queue_item_id, filename: body.filename || null, status: 'pending' });
        addTimelineEvent(projectId, 'queue_linked', 'Queue item #' + body.queue_item_id + ' linked');
        sendJson(res, { ok: true, id }, 201);
      });
    }

    if (projMatch && method === 'GET') {
      const p = getProject(parseInt(projMatch[1]));
      if (!p) return sendJson(res, { error: 'Not found' }, 404);
      p.prints = getProjectPrints(p.id);
      return sendJson(res, p);
    }

    if (method === 'POST' && path === '/api/projects') {
      return readBody(req, res, (body) => {
        if (!body.name) return sendJson(res, { error: 'name required' }, 400);
        const id = addProject(body);
        addTimelineEvent(id, 'project_created', 'Order "' + body.name + '" created');
        sendJson(res, { ok: true, id }, 201);
      });
    }

    if (projMatch && method === 'PUT') {
      return readBody(req, res, (body) => {
        const projectId = parseInt(projMatch[1]);
        updateProject(projectId, body);
        if (body.status) addTimelineEvent(projectId, 'status_changed', 'Status endret til ' + body.status);
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
      return readBody(req, res, (body) => {
        body.project_id = parseInt(projPrintMatch[1]);
        const id = addProjectPrint(body);
        sendJson(res, { ok: true, id }, 201);
      });
    }

    const projPrintItemMatch = path.match(/^\/api\/projects\/prints\/(\d+)$/);
    if (projPrintItemMatch && method === 'PUT') {
      return readBody(req, res, (body) => {
        updateProjectPrint(parseInt(projPrintItemMatch[1]), body);
        sendJson(res, { ok: true });
      });
    }

    if (projPrintItemMatch && method === 'DELETE') {
      deleteProjectPrint(parseInt(projPrintItemMatch[1]));
      return sendJson(res, { ok: true });
    }

    // ---- Invoices ----
    const invoiceMatch = path.match(/^\/api\/invoices\/(\d+)$/);
    if (invoiceMatch && method === 'GET') {
      const inv = getInvoice(parseInt(invoiceMatch[1]));
      if (!inv) return sendJson(res, { error: 'Not found' }, 404);
      return sendJson(res, inv);
    }

    const invoiceHtmlMatch = path.match(/^\/api\/invoices\/(\d+)\/html$/);
    if (invoiceHtmlMatch && method === 'GET') {
      const inv = getInvoice(parseInt(invoiceHtmlMatch[1]));
      if (!inv) return sendJson(res, { error: 'Not found' }, 404);
      const html = _renderInvoiceHtml(inv);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }

    const invoiceStatusMatch = path.match(/^\/api\/invoices\/(\d+)\/status$/);
    if (invoiceStatusMatch && method === 'PUT') {
      return readBody(req, res, (body) => {
        if (!body.status) return sendJson(res, { error: 'status required' }, 400);
        const sentAt = body.status === 'sent' ? new Date().toISOString() : null;
        updateInvoiceStatus(parseInt(invoiceStatusMatch[1]), body.status, sentAt);
        sendJson(res, { ok: true });
      });
    }

    // ---- Export ----
    if (method === 'GET' && path === '/api/export/templates') {
      const entityType = url.searchParams.get('entity_type');
      return sendJson(res, getExportTemplates(entityType || null));
    }

    if (method === 'POST' && path === '/api/export/templates') {
      return readBody(req, res, (body) => {
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
          `# Generated by 3DPrintForge`,
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
        from: '3DPrintForge',
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
        if (!body.filament_profile_id || !body.target_price) return sendJson(res, { error: 'filament_profile_id and target_price required' }, 400);
        const id = addPriceAlert(body);
        return sendJson(res, { ok: true, id }, 201);
      });
    }

    const paMatch = path.match(/^\/api\/price-alerts\/(\d+)$/);
    if (paMatch && method === 'PUT') {
      return readBody(req, res, (body) => {
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

        // Helper: build descriptive spool name from available fields
        const spoolLabel = (s) => {
          const parts = [];
          if (s.vendor_name) parts.push(s.vendor_name);
          parts.push(s.profile_name || s.material || '?');
          if (s.color_name) parts.push(s.color_name);
          return parts.join(' ');
        };

        // Low stock warnings
        const lowStock = predictions.per_spool.filter(s => s.needs_reorder);
        if (lowStock.length > 0) {
          insights.push({
            type: 'warning',
            title_key: 'insights.low_stock_title',
            message_key: 'insights.low_stock_message',
            message_args: { count: lowStock.length },
            items: lowStock.slice(0, 5).map(s => ({
              label: spoolLabel(s),
              days: s.days_until_empty,
              color_hex: s.color_hex
            }))
          });
        }

        // Restock suggestions
        const urgentRestock = restock.filter(r => r.urgency === 'high' || r.urgency === 'medium');
        if (urgentRestock.length > 0) {
          insights.push({
            type: 'restock',
            title_key: 'insights.restock_title',
            message_key: 'insights.restock_message',
            message_args: { count: urgentRestock.length },
            items: urgentRestock.slice(0, 5).map(r => ({
              label: `${r.profile_name} (${r.vendor_name || '?'})`,
              spools: r.recommended_spools || 1,
              color_hex: r.color_hex
            }))
          });
        }

        // Usage patterns
        if (predictions.by_material.length > 0) {
          const topMaterial = predictions.by_material[0];
          insights.push({
            type: 'info',
            title_key: 'insights.top_material_title',
            message_key: 'insights.top_material_message',
            message_args: {
              material: topMaterial.material || '?',
              total_g: Math.round(topMaterial.total_used_g),
              avg_daily_g: topMaterial.avg_daily_g
            },
            items: predictions.by_material.slice(0, 3).map(m => ({
              label: m.material,
              total_g: Math.round(m.total_used_g)
            }))
          });
        }

        // Cost optimization
        if (stats.total_spools > 0 && stats.total_cost > 0) {
          const avgCostPerKg = (stats.total_cost / (stats.total_weight_g / 1000)).toFixed(2);
          insights.push({
            type: 'info',
            title_key: 'insights.cost_title',
            message_key: 'insights.cost_message',
            message_args: {
              avg_cost_per_kg: avgCostPerKg,
              total_spools: stats.total_spools,
              total_value: stats.total_cost.toFixed(2)
            }
          });
        }

        // Dormant spools (not used in 60+ days)
        const dormant = predictions.per_spool.filter(s => s.avg_daily_g === 0 && s.remaining_weight_g > 100);
        if (dormant.length > 0) {
          insights.push({
            type: 'suggestion',
            title_key: 'insights.dormant_title',
            message_key: 'insights.dormant_message',
            message_args: { count: dormant.length },
            items: dormant.slice(0, 5).map(s => ({
              label: spoolLabel(s),
              remaining_g: Math.round(s.remaining_weight_g),
              color_hex: s.color_hex
            }))
          });
        }

        return sendJson(res, { insights });
      } catch (e) { return sendJson(res, { insights: [], error: e.message }); }
    }

    // ---- 3MF / Gcode file analysis ----
    if (method === 'POST' && path === '/api/inventory/analyze-file') {
      return readBinaryBody(req, async (buffer) => {
        try {
          const contentType = req.headers['content-type'] || '';
          const filename = url.searchParams.get('filename') || '';
          let result;
          if (filename.endsWith('.3mf') || contentType.includes('3mf')) {
            result = await parse3mf(buffer);
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
      return readBody(req, res, (body) => {
        if (!body.printer_id || !body.name) return sendJson(res, { error: 'printer_id and name required' }, 400);
        const id = addBuildPlate(body);
        sendJson(res, { ok: true, id }, 201);
      });
    }

    if (bpMatch && method === 'PUT') {
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
        if (!body.brand || !body.model) return sendJson(res, { error: 'brand and model required' }, 400);
        const id = addDryerModel(body);
        sendJson(res, { ok: true, id }, 201);
      });
    }

    if (dmMatch && method === 'PUT') {
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
        if (!body.title) return sendJson(res, { error: 'title required' }, 400);
        const id = addCourse(body);
        sendJson(res, { ok: true, id }, 201);
      });
    }

    if (courseMatch && method === 'PUT') {
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
        const userId = body.user_id || 0;
        upsertCourseProgress(parseInt(cpMatch[1]), userId, body);
        sendJson(res, { ok: true });
      });
    }

    if (method === 'GET' && path === '/api/courses/user-progress') {
      const userId = parseInt(url.searchParams.get('user_id') || '0');
      return sendJson(res, getUserCourseProgress(userId));
    }

    // ---- Filament Materials Reference ----
    if (method === 'GET' && path === '/api/filament-materials') {
      const category = url.searchParams.get('category') || null;
      const materials = category
        ? _filamentMaterials.getMaterialsByCategory(category)
        : _filamentMaterials.getAllMaterials();
      return sendJson(res, materials);
    }
    const filMatMatch = path.match(/^\/api\/filament-materials\/([a-z0-9-]+)$/);
    if (filMatMatch && method === 'GET') {
      const mat = _filamentMaterials.getMaterialById(filMatMatch[1])
        || _filamentMaterials.getMaterialByName(filMatMatch[1]);
      if (!mat) return sendJson(res, { error: 'Material not found' }, 404);
      return sendJson(res, mat);
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
      return readBody(req, res, (body) => {
        if (!body.model || !body.full_name) return sendJson(res, { error: 'model and full_name required' }, 400);
        const id = addKbPrinter(body);
        sendJson(res, { ok: true, id }, 201);
      });
    }
    if (kbPrinterMatch && method === 'PUT') {
      return readBody(req, res, (body) => { updateKbPrinter(parseInt(kbPrinterMatch[1]), body); sendJson(res, { ok: true }); });
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
      return readBody(req, res, (body) => {
        if (!body.name) return sendJson(res, { error: 'name required' }, 400);
        const id = addKbAccessory(body);
        sendJson(res, { ok: true, id }, 201);
      });
    }
    if (kbAccMatch && method === 'PUT') {
      return readBody(req, res, (body) => { updateKbAccessory(parseInt(kbAccMatch[1]), body); sendJson(res, { ok: true }); });
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
      return readBody(req, res, (body) => {
        if (!body.material) return sendJson(res, { error: 'material required' }, 400);
        const id = addKbFilament(body);
        sendJson(res, { ok: true, id }, 201);
      });
    }
    if (kbFilMatch && method === 'PUT') {
      return readBody(req, res, (body) => { updateKbFilament(parseInt(kbFilMatch[1]), body); sendJson(res, { ok: true }); });
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
      return readBody(req, res, (body) => {
        if (!body.name) return sendJson(res, { error: 'name required' }, 400);
        const id = addKbProfile(body);
        sendJson(res, { ok: true, id }, 201);
      });
    }
    if (kbProfMatch && method === 'PUT') {
      return readBody(req, res, (body) => { updateKbProfile(parseInt(kbProfMatch[1]), body); sendJson(res, { ok: true }); });
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
        if (body.hub_mode !== undefined) setInventorySetting('hub_mode', body.hub_mode ? '1' : '0');
        if (body.kiosk_mode !== undefined) setInventorySetting('kiosk_mode', body.kiosk_mode ? '1' : '0');
        if (body.kiosk_panels !== undefined) setInventorySetting('kiosk_panels', Array.isArray(body.kiosk_panels) ? body.kiosk_panels.join(',') : body.kiosk_panels);
        if (body.hub_refresh_interval !== undefined) setInventorySetting('hub_refresh_interval', String(body.hub_refresh_interval));
        sendJson(res, { ok: true });
      });
    }

    // ---- TOTP 2FA ----
    if (method === 'POST' && path === '/api/auth/totp/setup') {
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
        const user = getSessionUser(req);
        if (!user) return sendJson(res, { error: 'Not authenticated' }, 401);
        updateUser(user.id, { totp_enabled: 0, totp_secret: null, totp_backup_codes: null });
        sendJson(res, { ok: true });
      });
    }

    // ---- Staggered Start ----
    if (method === 'POST' && path === '/api/printer-groups/staggered-start') {
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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

    // Format Storage (SD card / USB)
    const formatStorageMatch = path.match(/^\/api\/printers\/([a-zA-Z0-9_-]+)\/storage\/format$/);
    if (formatStorageMatch && method === 'POST') {
      const pid = formatStorageMatch[1];
      const printer = _printerManager?.printers?.get(pid);
      if (!printer?.client) return sendJson(res, { error: 'Printer not connected' }, 400);
      const { buildFormatStorageCommand } = await import('./mqtt-commands.js');
      printer.client.sendCommand(buildFormatStorageCommand());
      return sendJson(res, { ok: true, message: 'Format command sent' });
    }

    // Buzzer — Play melody on printer speaker via M300 G-code
    const buzzerMatch = path.match(/^\/api\/printers\/([a-zA-Z0-9_-]+)\/buzzer$/);
    if (buzzerMatch && method === 'POST') {
      return readBody(req, res, async (body) => {
        const pid = buzzerMatch[1];
        const printer = _printerManager?.printers?.get(pid);
        if (!printer?.client) return sendJson(res, { error: 'Printer not connected' }, 400);
        const { buildBuzzerCommands, BUZZER_MELODIES } = await import('./mqtt-commands.js');
        const melody = body.melody || null;
        const tones = body.tones || null;
        if (melody && !BUZZER_MELODIES[melody] && !tones) {
          return sendJson(res, { error: 'Unknown melody. Available: ' + Object.keys(BUZZER_MELODIES).join(', ') }, 400);
        }
        const cmds = buildBuzzerCommands(melody, tones);
        if (cmds.length === 0) return sendJson(res, { error: 'No valid tones provided' }, 400);
        for (const cmd of cmds) printer.client.sendCommand(cmd);
        return sendJson(res, { ok: true, message: 'Buzzer command sent', tones: cmds.length });
      });
    }

    // Bed Mesh — Trigger calibration via G-code
    const bedMeshCalMatch = path.match(/^\/api\/printers\/([^/]+)\/bed-mesh\/calibrate$/);
    if (bedMeshCalMatch && method === 'POST') {
      const pid = bedMeshCalMatch[1];
      const printer = _printerManager?.printers?.get(pid);
      if (!printer?.client) return sendJson(res, { error: 'Printer not connected' }, 400);
      const { buildGcodeCommand } = await import('./mqtt-commands.js');
      // Send G28 (home) then G29 (auto bed level)
      printer.client.sendCommand(buildGcodeCommand('G28'));
      setTimeout(() => {
        printer.client.sendCommand(buildGcodeCommand('G29'));
      }, 2000);
      return sendJson(res, { ok: true, message: 'Calibration started — printer will home and auto-level' });
    }

    // Bed Mesh — Scan printer FTP for calibration files
    const bedMeshScanMatch = path.match(/^\/api\/printers\/([^/]+)\/bed-mesh\/scan$/);
    if (bedMeshScanMatch && method === 'POST') {
      const pid = bedMeshScanMatch[1];
      const printer = _printerManager?.printers?.get(pid);
      if (!printer?.config?.ip) return sendJson(res, { error: 'Printer not found or no IP' }, 404);
      const ftp = await _getFtp();
      if (!ftp) return sendJson(res, { error: 'FTP module not available' }, 500);
      const client = new ftp.Client();
      client.ftp.verbose = false;
      try {
        await client.access({ host: printer.config.ip, port: 990, user: 'bblp', password: printer.config.accessCode || printer.config.access_code, secure: 'implicit', secureOptions: { rejectUnauthorized: false } });
        const found = [];
        const scanPaths = ['/cache/', '/sdcard/'];
        for (const basePath of scanPaths) {
          try {
            const list = await client.list(basePath);
            for (const item of list) {
              found.push({ name: item.name, path: basePath + item.name, size: item.size || 0, type: item.isDirectory ? 'dir' : 'file' });
            }
          } catch { /* path might not exist */ }
        }
        // Look for mesh/calibration files
        const meshFiles = found.filter(f =>
          /mesh|level|calib|probe/i.test(f.name) && !f.name.endsWith('.gcode') && !f.name.endsWith('.3mf')
        );
        // Try to download and parse mesh files
        for (const mf of meshFiles) {
          try {
            const chunks = [];
            const { Writable } = await import('node:stream');
            const writable = new Writable({ write(chunk, _enc, cb) { chunks.push(chunk); cb(); } });
            await client.downloadTo(writable, mf.path);
            const content = Buffer.concat(chunks).toString('utf8');
            // Try JSON parse
            try {
              const parsed = JSON.parse(content);
              if (Array.isArray(parsed) && Array.isArray(parsed[0])) {
                const flat = parsed.flat();
                const mean = flat.reduce((s, v) => s + v, 0) / flat.length;
                const id = addBedMesh(pid, parsed, {
                  rows: parsed.length, cols: parsed[0].length,
                  zMin: Math.min(...flat), zMax: Math.max(...flat), zMean: mean,
                  zStdDev: Math.sqrt(flat.reduce((s, v) => s + (v - mean) ** 2, 0) / flat.length),
                  source: 'ftp_scan'
                });
                return sendJson(res, { ok: true, id, source: mf.path });
              }
            } catch { /* not valid JSON mesh */ }
            // Try space/newline separated values
            const lines = content.trim().split('\n').filter(l => l.trim());
            const mesh = lines.map(l => l.trim().split(/[\s,]+/).map(Number));
            if (mesh.length > 1 && mesh.every(r => r.length > 1 && r.every(v => !isNaN(v)))) {
              const flat = mesh.flat();
              const mean = flat.reduce((s, v) => s + v, 0) / flat.length;
              const id = addBedMesh(pid, mesh, {
                rows: mesh.length, cols: mesh[0].length,
                zMin: Math.min(...flat), zMax: Math.max(...flat), zMean: mean,
                zStdDev: Math.sqrt(flat.reduce((s, v) => s + (v - mean) ** 2, 0) / flat.length),
                source: 'ftp_scan'
              });
              return sendJson(res, { ok: true, id, source: mf.path });
            }
          } catch { /* download failed */ }
        }
        return sendJson(res, { ok: false, message: 'No mesh files found', files: found.map(f => f.name) });
      } catch (e) {
        return sendJson(res, { error: 'FTP scan failed: ' + e.message }, 500);
      } finally { client.close(); }
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, async (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
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
      return readBody(req, res, (body) => {
        const profileId = importCommunityToInventory(parseInt(cfImportMatch[1]), body.vendor_id);
        if (!profileId) return sendJson(res, { error: 'Community filament not found' }, 404);
        if (_broadcastFn) _broadcastFn('inventory_update', { action: 'add', entity: 'profile', id: profileId });
        sendJson(res, { profile_id: profileId }, 201);
      });
    }

    // ---- Plugins ----

    // GET /api/plugins — list all plugins
    if (method === 'GET' && path === '/api/plugins') {
      const dbPlugins = getPlugins();
      const loaded = _pluginManager ? _pluginManager.getLoadedPlugins() : [];
      const loadedNames = new Set(loaded.map(p => p.name));
      const result = dbPlugins.map(p => ({
        ...p,
        hooks: (() => { try { return JSON.parse(p.hooks || '[]'); } catch { return []; } })(),
        panels: (() => { try { return JSON.parse(p.panels || '[]'); } catch { return []; } })(),
        settings_schema: (() => { try { return JSON.parse(p.settings_schema || '{}'); } catch { return {}; } })(),
        loaded: loadedNames.has(p.name),
        settings: getPluginSettings(p.id)
      }));
      return sendJson(res, result);
    }

    // GET /api/plugins/hooks — list available hook names
    if (method === 'GET' && path === '/api/plugins/hooks') {
      const hooks = _pluginManager ? _pluginManager.getHookNames() : [];
      return sendJson(res, hooks);
    }

    // GET /api/plugins/:name — plugin detail
    const pluginDetailMatch = path.match(/^\/api\/plugins\/([^/]+)$/);
    if (method === 'GET' && pluginDetailMatch && pluginDetailMatch[1] !== 'hooks') {
      const p = getPlugin(decodeURIComponent(pluginDetailMatch[1]));
      if (!p) return sendJson(res, { error: 'Plugin not found' }, 404);
      p.hooks = (() => { try { return JSON.parse(p.hooks || '[]'); } catch { return []; } })();
      p.panels = (() => { try { return JSON.parse(p.panels || '[]'); } catch { return []; } })();
      p.settings_schema = (() => { try { return JSON.parse(p.settings_schema || '{}'); } catch { return {}; } })();
      p.settings = getPluginSettings(p.id);
      p.loaded = _pluginManager ? _pluginManager.getLoadedPlugins().some(lp => lp.name === p.name) : false;
      return sendJson(res, p);
    }

    // POST /api/plugins/:name/enable
    const pluginEnableMatch = path.match(/^\/api\/plugins\/([^/]+)\/enable$/);
    if (method === 'POST' && pluginEnableMatch) {
      const name = decodeURIComponent(pluginEnableMatch[1]);
      const p = getPlugin(name);
      if (!p) return sendJson(res, { error: 'Plugin not found' }, 404);
      if (_pluginManager) {
        try {
          await _pluginManager.enablePlugin(name);
        } catch (e) {
          return sendJson(res, { error: e.message }, 500);
        }
      } else {
        updatePluginEnabled(name, 1);
      }
      return sendJson(res, { ok: true, name, enabled: true });
    }

    // POST /api/plugins/:name/disable
    const pluginDisableMatch = path.match(/^\/api\/plugins\/([^/]+)\/disable$/);
    if (method === 'POST' && pluginDisableMatch) {
      const name = decodeURIComponent(pluginDisableMatch[1]);
      const p = getPlugin(name);
      if (!p) return sendJson(res, { error: 'Plugin not found' }, 404);
      if (_pluginManager) {
        try {
          await _pluginManager.disablePlugin(name);
        } catch (e) {
          return sendJson(res, { error: e.message }, 500);
        }
      } else {
        updatePluginEnabled(name, 0);
      }
      return sendJson(res, { ok: true, name, enabled: false });
    }

    // PUT /api/plugins/:name/settings
    const pluginSettingsMatch = path.match(/^\/api\/plugins\/([^/]+)\/settings$/);
    if (method === 'PUT' && pluginSettingsMatch) {
      const name = decodeURIComponent(pluginSettingsMatch[1]);
      const p = getPlugin(name);
      if (!p) return sendJson(res, { error: 'Plugin not found' }, 404);
      return readBody(req, res, (body) => {
        setPluginSettings(p.id, body);
        sendJson(res, { ok: true, settings: body });
      });
    }

    // GET /api/plugins/:name/state
    const pluginStateMatch = path.match(/^\/api\/plugins\/([^/]+)\/state$/);
    if (method === 'GET' && pluginStateMatch) {
      const name = decodeURIComponent(pluginStateMatch[1]);
      const p = getPlugin(name);
      if (!p) return sendJson(res, { error: 'Plugin not found' }, 404);
      const rows = (() => { try { return require('./database.js'); } catch { return null; } })();
      // Direct query for all state keys
      const allState = {};
      // Use getPluginSettings for the _settings key, and expose all keys
      const settings = getPluginSettings(p.id);
      allState._settings = settings;
      return sendJson(res, allState);
    }

    // DELETE /api/plugins/:name — uninstall (remove from DB, don't delete files)
    const pluginDeleteMatch = path.match(/^\/api\/plugins\/([^/]+)$/);
    if (method === 'DELETE' && pluginDeleteMatch) {
      const name = decodeURIComponent(pluginDeleteMatch[1]);
      const p = getPlugin(name);
      if (!p) return sendJson(res, { error: 'Plugin not found' }, 404);
      // Disable first if loaded
      if (_pluginManager) {
        try { await _pluginManager.disablePlugin(name); } catch {}
      }
      removePlugin(name);
      return sendJson(res, { ok: true, name, removed: true });
    }

    // ---- Print Profiles ----
    if (method === 'GET' && path === '/api/profiles') {
      return sendJson(res, getProfiles());
    }
    if (method === 'POST' && path === '/api/profiles') {
      return readBody(req, res, (body) => {
        const vr = validate(PROFILE_SCHEMA, body);
        if (!vr.valid) return sendJson(res, { error: 'Validation failed', details: vr.errors }, 400);
        addProfile(body);
        sendJson(res, { ok: true });
      });
    }
    const profileMatch = path.match(/^\/api\/profiles\/(\d+)$/);
    if (profileMatch && method === 'PUT') {
      return readBody(req, res, (body) => {
        updateProfile(parseInt(profileMatch[1]), body);
        sendJson(res, { ok: true });
      });
    }
    if (profileMatch && method === 'DELETE') {
      deleteProfile(parseInt(profileMatch[1]));
      return sendJson(res, { ok: true });
    }

    // ---- Screenshots ----
    if (method === 'GET' && path === '/api/screenshots') {
      const printerId = url.searchParams.get('printer_id') || null;
      const limit = parseInt(url.searchParams.get('limit')) || 50;
      const offset = parseInt(url.searchParams.get('offset')) || 0;
      return sendJson(res, getScreenshots(printerId, limit, offset));
    }
    const screenshotMatch = path.match(/^\/api\/screenshots\/(\d+)$/);
    if (screenshotMatch && method === 'GET') {
      const shot = getScreenshotById(parseInt(screenshotMatch[1]));
      if (!shot) return sendJson(res, { error: 'Not found' }, 404);
      return sendJson(res, shot);
    }
    if (method === 'POST' && path === '/api/screenshots') {
      return readBody(req, res, (body) => {
        if (!body.data || !body.filename) return sendJson(res, { error: 'data and filename required' }, 400);
        addScreenshot(body);
        sendJson(res, { ok: true });
      });
    }
    if (screenshotMatch && method === 'DELETE') {
      deleteScreenshot(parseInt(screenshotMatch[1]));
      return sendJson(res, { ok: true });
    }

    // 404
    sendJson(res, { error: 'Not found' }, 404);

  } catch (e) {
    log.error('Error: ' + e.message);
    sendJson(res, { error: 'Server error' }, 500);
  }
}

function _extractZipFile(zipBuf, targetPaths) {
  // Find EOCD
  let eocdOff = -1;
  for (let i = zipBuf.length - 22; i >= Math.max(0, zipBuf.length - 65557); i--) {
    if (zipBuf.readUInt32LE(i) === 0x06054b50) { eocdOff = i; break; }
  }
  if (eocdOff < 0) return null;
  const cdOffset = zipBuf.readUInt32LE(eocdOff + 16);
  const entryCount = zipBuf.readUInt16LE(eocdOff + 10);
  let pos = cdOffset;
  for (let i = 0; i < entryCount; i++) {
    if (pos + 46 > zipBuf.length || zipBuf.readUInt32LE(pos) !== 0x02014b50) break;
    const compression = zipBuf.readUInt16LE(pos + 10);
    const compressedSize = zipBuf.readUInt32LE(pos + 20);
    const fnLen = zipBuf.readUInt16LE(pos + 28);
    const extraLen = zipBuf.readUInt16LE(pos + 30);
    const commentLen = zipBuf.readUInt16LE(pos + 32);
    const localOffset = zipBuf.readUInt32LE(pos + 42);
    const filename = zipBuf.subarray(pos + 46, pos + 46 + fnLen).toString('utf8');
    if (targetPaths.some(tp => filename === tp || filename.toLowerCase() === tp.toLowerCase())) {
      if (localOffset + 30 > zipBuf.length || zipBuf.readUInt32LE(localOffset) !== 0x04034b50) return null;
      const lfhFnLen = zipBuf.readUInt16LE(localOffset + 26);
      const lfhExtraLen = zipBuf.readUInt16LE(localOffset + 28);
      const dataStart = localOffset + 30 + lfhFnLen + lfhExtraLen;
      if (dataStart + compressedSize > zipBuf.length) return null;
      const data = zipBuf.subarray(dataStart, dataStart + compressedSize);
      if (compression === 0) return data;
      if (compression === 8) { try { return inflateRawSync(data); } catch { return null; } }
      return null;
    }
    pos += 46 + fnLen + extraLen + commentLen;
  }
  return null;
}

function _getPublicStatus() {
  const printers = getPrinters();
  const result = [];
  for (const p of printers) {
    const raw = _hub?.printerStates?.[p.id] || {};
    const state = raw.print || raw;
    const gcodeState = state.gcode_state || 'OFFLINE';
    const isPrinting = ['RUNNING', 'PREPARE', 'PAUSE'].includes(gcodeState);
    // Fan speeds (Bambu reports 0-15 range, convert to %)
    const fanPct = (v) => v != null ? Math.round((parseInt(v) / 15) * 100) : null;

    // AMS info
    let ams = null;
    if (state.ams?.ams) {
      ams = state.ams.ams.map((unit, ui) => ({
        id: ui,
        trays: (unit.tray || []).map((tr, ti) => ({
          slot: ti + 1,
          color: tr.tray_color || null,
          type: tr.tray_type || null,
          remaining: tr.remain != null ? parseInt(tr.remain) : null
        })).filter(tr => tr.color || tr.type)
      })).filter(u => u.trays.length > 0);
    }

    // Lights
    let lights = null;
    if (Array.isArray(state.lights_report)) {
      lights = {};
      for (const l of state.lights_report) {
        if (l.node === 'chamber_light') lights.chamber = l.mode === 'on';
        if (l.node === 'work_light') lights.work = l.mode === 'on';
      }
    }

    result.push({
      id: p.id,
      name: p.name,
      model: p.model || null,
      status: gcodeState,
      progress: isPrinting ? (parseInt(state.mc_percent) || 0) : null,
      remaining_minutes: isPrinting ? (parseInt(state.mc_remaining_time) || 0) : null,
      current_file: isPrinting ? (state.subtask_name || null) : null,
      layer: isPrinting ? (parseInt(state.layer_num) || 0) : null,
      total_layers: isPrinting ? (parseInt(state.total_layer_num) || 0) : null,
      nozzle_temp: state.nozzle_temper ?? null,
      nozzle_target: state.nozzle_target_temper ?? null,
      bed_temp: state.bed_temper ?? null,
      bed_target: state.bed_target_temper ?? null,
      chamber_temp: state.chamber_temper ?? null,
      wifi_signal: state.wifi_signal ?? null,
      speed_percent: state.spd_mag ?? null,
      fan_part: fanPct(state.cooling_fan_speed),
      fan_aux: fanPct(state.big_fan1_speed),
      fan_chamber: fanPct(state.big_fan2_speed),
      ams,
      lights
    });
  }
  return { printers: result, timestamp: new Date().toISOString() };
}

function _collectMetrics() {
  const lines = [];
  const now = Date.now();

  // Printer metrics
  const printers = getPrinters();
  lines.push('# HELP bambu_printers_total Total number of configured printers');
  lines.push('# TYPE bambu_printers_total gauge');
  lines.push(`bambu_printers_total ${printers.length}`);

  // Print history metrics
  try {
    const history = getHistory(9999, 0);
    const completed = history.filter(h => h.status === 'completed').length;
    const failed = history.filter(h => h.status === 'failed').length;
    const cancelled = history.filter(h => h.status === 'cancelled').length;

    lines.push('# HELP bambu_prints_total Total number of prints by status');
    lines.push('# TYPE bambu_prints_total counter');
    lines.push(`bambu_prints_total{status="completed"} ${completed}`);
    lines.push(`bambu_prints_total{status="failed"} ${failed}`);
    lines.push(`bambu_prints_total{status="cancelled"} ${cancelled}`);

    // Filament usage
    const totalFilamentG = history.reduce((sum, h) => sum + (h.filament_used_g || 0), 0);
    lines.push('# HELP bambu_filament_used_grams_total Total filament used in grams');
    lines.push('# TYPE bambu_filament_used_grams_total counter');
    lines.push(`bambu_filament_used_grams_total ${Math.round(totalFilamentG)}`);

    // Print hours
    const totalSeconds = history.reduce((sum, h) => sum + (h.duration_seconds || 0), 0);
    lines.push('# HELP bambu_print_seconds_total Total print time in seconds');
    lines.push('# TYPE bambu_print_seconds_total counter');
    lines.push(`bambu_print_seconds_total ${totalSeconds}`);

    // Success rate
    const total = history.length;
    const rate = total > 0 ? (completed / total) : 0;
    lines.push('# HELP bambu_success_rate Print success rate');
    lines.push('# TYPE bambu_success_rate gauge');
    lines.push(`bambu_success_rate ${Math.round(rate * 10000) / 10000}`);
  } catch (_) {}

  // Filament inventory
  try {
    const spools = getFilament();
    lines.push('# HELP bambu_spools_total Total spools in inventory');
    lines.push('# TYPE bambu_spools_total gauge');
    lines.push(`bambu_spools_total ${spools.length}`);

    const totalWeightG = spools.reduce((sum, s) => sum + (s.remaining_weight_g || s.weight_g || 0), 0);
    lines.push('# HELP bambu_inventory_weight_grams Total filament weight in inventory');
    lines.push('# TYPE bambu_inventory_weight_grams gauge');
    lines.push(`bambu_inventory_weight_grams ${Math.round(totalWeightG)}`);
  } catch (_) {}

  // Per-spool Prometheus metrics (Spoolman-compatible)
  try {
    const perSpool = getSpoolmanPerSpoolMetrics();
    if (perSpool.length > 0) {
      lines.push('# HELP bambu_spool_remaining_weight_grams Remaining filament weight per spool');
      lines.push('# TYPE bambu_spool_remaining_weight_grams gauge');
      lines.push('# HELP bambu_spool_used_weight_grams Used filament weight per spool');
      lines.push('# TYPE bambu_spool_used_weight_grams gauge');
      lines.push('# HELP bambu_spool_initial_weight_grams Initial filament weight per spool');
      lines.push('# TYPE bambu_spool_initial_weight_grams gauge');
      lines.push('# HELP bambu_spool_price Spool price');
      lines.push('# TYPE bambu_spool_price gauge');
      lines.push('# HELP bambu_filament_info Filament metadata');
      lines.push('# TYPE bambu_filament_info gauge');
      for (const s of perSpool) {
        const labels = `spool_id="${s.id}",filament="${(s.filament_name || '').replace(/"/g, '')}"`;
        const infoLabels = `spool_id="${s.id}",vendor="${(s.vendor_name || '').replace(/"/g, '')}",material="${s.material || ''}",color="${s.color_hex || ''}"`;
        lines.push(`bambu_spool_remaining_weight_grams{${labels}} ${s.remaining_weight_g || 0}`);
        lines.push(`bambu_spool_used_weight_grams{${labels}} ${s.used_weight_g || 0}`);
        lines.push(`bambu_spool_initial_weight_grams{${labels}} ${s.initial_weight_g || 0}`);
        if (s.cost) lines.push(`bambu_spool_price{${labels}} ${s.cost}`);
        lines.push(`bambu_filament_info{${infoLabels}} 1`);
      }
    }
  } catch (_) {}

  // Uptime
  lines.push('# HELP bambu_uptime_seconds Server uptime in seconds');
  lines.push('# TYPE bambu_uptime_seconds gauge');
  lines.push(`bambu_uptime_seconds ${Math.round(process.uptime())}`);

  // Memory usage
  const mem = process.memoryUsage();
  lines.push('# HELP bambu_memory_heap_bytes Heap memory usage in bytes');
  lines.push('# TYPE bambu_memory_heap_bytes gauge');
  lines.push(`bambu_memory_heap_bytes ${mem.heapUsed}`);

  // Node.js version info
  lines.push('# HELP bambu_info Dashboard info');
  lines.push('# TYPE bambu_info gauge');
  lines.push(`bambu_info{version="${_pkgVersion}",node="${process.version}"} 1`);

  // Circuit breaker states (if available)
  try {
    for (const b of getAllBreakerStatus()) {
      lines.push(`bambu_circuit_breaker{service="${b.name}",state="${b.state}"} ${b.failures}`);
    }
  } catch (_) {}

  return lines.join('\n') + '\n';
}

function _getApiDocs() {
  return {
    openapi: '3.0.3',
    info: {
      title: '3DPrintForge API',
      version: _pkgVersion,
      description: 'REST API for 3DPrintForge — a self-hosted 3D printer management system.'
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
      { name: 'CRM', description: 'Customer Relationship Management' },
      { name: 'Slicer', description: 'Cloud slicer service' },
      { name: 'NFC', description: 'NFC tag mapping' },
      { name: 'Community', description: 'Community filament database' },
      { name: 'Timelapse', description: 'Timelapse recordings' },
      { name: 'Status', description: 'Public status page' },
      { name: 'System', description: 'Settings, backup, update' }
    ],
    endpoints: [
      // Public Status
      { method: 'GET', path: '/api/health', tag: 'Status', summary: 'Health check (no auth required)', permission: null },
      { method: 'GET', path: '/api/status/public', tag: 'Status', summary: 'Get public printer status (no auth required, must be enabled)', permission: null },
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
      { method: 'GET', path: '/api/bambu-cloud/status', tag: 'Bambu Cloud', summary: 'Get cloud authentication status (incl. token expiry)', permission: 'admin' },
      { method: 'POST', path: '/api/bambu-cloud/login', tag: 'Bambu Cloud', summary: 'Login with Bambu Lab account (triggers 2FA)', permission: 'admin' },
      { method: 'POST', path: '/api/bambu-cloud/verify', tag: 'Bambu Cloud', summary: 'Verify 2FA code', permission: 'admin' },
      { method: 'POST', path: '/api/bambu-cloud/refresh-token', tag: 'Bambu Cloud', summary: 'Refresh access token (auto-refreshes every 12h)', permission: 'admin' },
      { method: 'GET', path: '/api/bambu-cloud/printers', tag: 'Bambu Cloud', summary: 'List printers from Bambu Lab account', permission: 'admin' },
      { method: 'POST', path: '/api/bambu-cloud/logout', tag: 'Bambu Cloud', summary: 'Logout from Bambu Lab cloud', permission: 'admin' },
      { method: 'GET', path: '/api/bambu-cloud/printer-status', tag: 'Bambu Cloud', summary: 'Get current printer status from cloud', permission: 'admin' },
      { method: 'GET', path: '/api/bambu-cloud/device-version', tag: 'Bambu Cloud', summary: 'Get device firmware version info', permission: 'admin' },
      { method: 'PATCH', path: '/api/bambu-cloud/device-info', tag: 'Bambu Cloud', summary: 'Update device info (name etc.)', permission: 'admin' },
      { method: 'GET', path: '/api/bambu-cloud/task/:taskId', tag: 'Bambu Cloud', summary: 'Get print task details by ID', permission: 'admin' },
      { method: 'GET', path: '/api/bambu-cloud/notification', tag: 'Bambu Cloud', summary: 'Get upload/mesh notification', permission: 'admin' },
      { method: 'GET', path: '/api/bambu-cloud/projects', tag: 'Bambu Cloud', summary: 'List user projects from cloud', permission: 'admin' },
      { method: 'GET', path: '/api/bambu-cloud/project/:id', tag: 'Bambu Cloud', summary: 'Get cloud project details', permission: 'admin' },
      { method: 'GET', path: '/api/bambu-cloud/messages', tag: 'Bambu Cloud', summary: 'Get cloud messages (type, limit, offset)', permission: 'admin' },
      { method: 'GET', path: '/api/bambu-cloud/message-count', tag: 'Bambu Cloud', summary: 'Get unread message count', permission: 'admin' },
      { method: 'POST', path: '/api/bambu-cloud/messages/read', tag: 'Bambu Cloud', summary: 'Mark messages as read', permission: 'admin' },
      { method: 'GET', path: '/api/bambu-cloud/slicer-settings', tag: 'Bambu Cloud', summary: 'Get slicer settings catalog', permission: 'admin' },
      { method: 'GET', path: '/api/bambu-cloud/slicer-setting/:id', tag: 'Bambu Cloud', summary: 'Get slicer setting by ID', permission: 'admin' },
      { method: 'GET', path: '/api/bambu-cloud/design-search', tag: 'Bambu Cloud', summary: 'Search MakerWorld designs (q, limit, offset)', permission: 'admin' },
      { method: 'GET', path: '/api/bambu-cloud/design/:id', tag: 'Bambu Cloud', summary: 'Get design details', permission: 'admin' },
      { method: 'GET', path: '/api/bambu-cloud/design/:id/3mf', tag: 'Bambu Cloud', summary: 'Get 3MF download URL for design', permission: 'admin' },
      { method: 'POST', path: '/api/bambu-cloud/upload', tag: 'Bambu Cloud', summary: 'Last opp fil til Bambu Lab cloud (binary body + ?filename=)', permission: 'admin' },
      { method: 'GET', path: '/api/bambu-cloud/upload-url', tag: 'Bambu Cloud', summary: 'Get pre-signed S3 upload URL', permission: 'admin' },
      { method: 'POST', path: '/api/bambu-cloud/cloud-print', tag: 'Bambu Cloud', summary: 'Start cloud-print paa en printer', permission: 'admin' },
      { method: 'POST', path: '/api/bambu-cloud/create-task', tag: 'Bambu Cloud', summary: 'Create print job in cloud', permission: 'admin' },
      { method: 'POST', path: '/api/bambu-cloud/bind', tag: 'Bambu Cloud', summary: 'Bind ny printer til kontoen', permission: 'admin' },
      { method: 'DELETE', path: '/api/bambu-cloud/bind', tag: 'Bambu Cloud', summary: 'Remove printer from account', permission: 'admin' },
      { method: 'GET', path: '/api/bambu-cloud/video-url', tag: 'Bambu Cloud', summary: 'Get cloud video streaming URL', permission: 'admin' },
      { method: 'GET', path: '/api/bambu-cloud/profile', tag: 'Bambu Cloud', summary: 'Get user profile', permission: 'admin' },
      { method: 'PUT', path: '/api/bambu-cloud/profile', tag: 'Bambu Cloud', summary: 'Update user profile', permission: 'admin' },
      { method: 'GET', path: '/api/bambu-cloud/preferences', tag: 'Bambu Cloud', summary: 'Get user preferences', permission: 'admin' },
      { method: 'GET', path: '/api/bambu-cloud/files', tag: 'Bambu Cloud', summary: 'List cloud-filer (prosjekter, opplastinger)', permission: 'admin' },
      { method: 'POST', path: '/api/bambu-cloud/send-code', tag: 'Bambu Cloud', summary: 'Send 2FA-verifiseringskode til e-post', permission: 'admin' },
      // Filament Tracker
      { method: 'GET', path: '/api/filament-tracker/usage-history', tag: 'Filament Tracker', summary: 'Get AMS filament usage history (filterable)', permission: 'view' },
      { method: 'GET', path: '/api/filament-tracker/usage-trend', tag: 'Filament Tracker', summary: 'Get usage trend for a tray_id_name', permission: 'view' },
      { method: 'GET', path: '/api/filament-tracker/spool-by-tray', tag: 'Filament Tracker', summary: 'Find spool by tray_id_name', permission: 'view' },
      { method: 'GET', path: '/api/filament-tracker/purchased', tag: 'Filament Tracker', summary: 'List purchased spools registry', permission: 'view' },
      { method: 'POST', path: '/api/filament-tracker/purchased', tag: 'Filament Tracker', summary: 'Add purchased spool', permission: 'filament' },
      { method: 'PUT', path: '/api/filament-tracker/purchased/:id', tag: 'Filament Tracker', summary: 'Update purchased spool', permission: 'filament' },
      { method: 'DELETE', path: '/api/filament-tracker/purchased/:id', tag: 'Filament Tracker', summary: 'Delete purchased spool', permission: 'filament' },
      { method: 'POST', path: '/api/filament-tracker/purchased/import', tag: 'Filament Tracker', summary: 'Bulk import purchased spools (from tracker JSON)', permission: 'filament' },
      { method: 'POST', path: '/api/filament-tracker/purchased/link', tag: 'Filament Tracker', summary: 'Link purchased spool to inventory spool', permission: 'filament' },
      // Filament Analytics
      { method: 'GET', path: '/api/filament-analytics/consumption', tag: 'Filament Analytics', summary: 'Consumption summary by material/brand (days param)', permission: 'view' },
      { method: 'GET', path: '/api/filament-analytics/consumption-by-printer', tag: 'Filament Analytics', summary: 'Consumption grouped by printer + material', permission: 'view' },
      { method: 'GET', path: '/api/filament-analytics/daily', tag: 'Filament Analytics', summary: 'Daily usage data (filterable by date, material, printer)', permission: 'view' },
      { method: 'GET', path: '/api/filament-analytics/weekly-trend', tag: 'Filament Analytics', summary: 'Weekly consumption trend', permission: 'view' },
      { method: 'GET', path: '/api/filament-analytics/consumption-rates', tag: 'Filament Analytics', summary: 'Rolling avg consumption rates per material', permission: 'view' },
      { method: 'GET', path: '/api/filament-analytics/depletion-forecast', tag: 'Filament Analytics', summary: 'Spool depletion forecast (days until empty)', permission: 'view' },
      { method: 'GET', path: '/api/filament-analytics/waste', tag: 'Filament Analytics', summary: 'Waste analysis by material/status', permission: 'view' },
      { method: 'GET', path: '/api/filament-analytics/material-efficiency', tag: 'Filament Analytics', summary: 'Material efficiency metrics (g/h, success rate)', permission: 'view' },
      { method: 'GET', path: '/api/filament-analytics/cost', tag: 'Filament Analytics', summary: 'Cost analysis by material/vendor', permission: 'view' },
      { method: 'GET', path: '/api/filament-analytics/depletion-events', tag: 'Filament Analytics', summary: 'Spool depletion threshold events', permission: 'view' },
      { method: 'POST', path: '/api/filament-analytics/recalculate', tag: 'Filament Analytics', summary: 'Recalculate daily aggregates + consumption rates (90 days)', permission: 'admin' },
      { method: 'POST', path: '/api/filament-analytics/auto-match', tag: 'Filament Analytics', summary: 'Auto-match AMS tray to spool by color+material', permission: 'filament' },
      { method: 'POST', path: '/api/filament-analytics/auto-create-spool', tag: 'Filament Analytics', summary: 'Auto-create spool from AMS tray data', permission: 'filament' },
      { method: 'GET', path: '/api/filament-analytics/expired', tag: 'Filament Analytics', summary: 'List expired spools', permission: 'view' },
      { method: 'GET', path: '/api/filament-analytics/expiring', tag: 'Filament Analytics', summary: 'List spools expiring within N days', permission: 'view' },
      { method: 'GET', path: '/api/filament-analytics/substitutions', tag: 'Filament Analytics', summary: 'Get material substitution rules', permission: 'view' },
      { method: 'POST', path: '/api/filament-analytics/substitutions', tag: 'Filament Analytics', summary: 'Add material substitution rule', permission: 'filament' },
      { method: 'DELETE', path: '/api/filament-analytics/substitutions/:id', tag: 'Filament Analytics', summary: 'Delete substitution rule', permission: 'filament' },
      { method: 'GET', path: '/api/filament-analytics/find-substitutes', tag: 'Filament Analytics', summary: 'Find available substitute materials with stock', permission: 'view' },
      { method: 'GET', path: '/api/filament-analytics/ral-colors', tag: 'Filament Analytics', summary: 'List RAL Classic colors', permission: 'view' },
      { method: 'GET', path: '/api/filament-analytics/closest-ral', tag: 'Filament Analytics', summary: 'Find closest RAL code for a hex color', permission: 'view' },
      { method: 'GET', path: '/api/filament-analytics/storage-alerts', tag: 'Filament Analytics', summary: 'Get storage condition alerts (humidity/temp)', permission: 'view' },
      { method: 'GET', path: '/api/filament-analytics/core-weights', tag: 'Filament Analytics', summary: 'Spool core weight catalog (200+ brands)', permission: 'view' },
      { method: 'POST', path: '/api/filament-analytics/core-weights', tag: 'Filament Analytics', summary: 'Add/update spool core weight entry', permission: 'filament' },
      { method: 'GET', path: '/api/filament-analytics/bambu-codes', tag: 'Filament Analytics', summary: 'Bambu Lab filament code database (90+ codes)', permission: 'view' },
      { method: 'GET', path: '/api/filament-analytics/bambu-code/:code', tag: 'Filament Analytics', summary: 'Look up specific Bambu filament code', permission: 'view' },
      { method: 'GET', path: '/api/filament-analytics/k-calibrations/:spoolId', tag: 'Filament Analytics', summary: 'Get K-factor calibrations for a spool', permission: 'view' },
      { method: 'POST', path: '/api/filament-analytics/k-calibrations', tag: 'Filament Analytics', summary: 'Save K-factor calibration (per spool/printer/nozzle)', permission: 'filament' },
      { method: 'GET', path: '/api/filament-analytics/best-k', tag: 'Filament Analytics', summary: 'Get best K-factor for spool+printer combo', permission: 'view' },
      { method: 'POST', path: '/api/filament-analytics/weigh', tag: 'Filament Analytics', summary: 'Record spool weighing with auto core weight lookup', permission: 'filament' },
      { method: 'GET', path: '/api/filament-analytics/accuracy', tag: 'Filament Analytics', summary: 'Filament estimation vs actual accuracy stats', permission: 'view' },
      // Bambu Lab RFID Variant Database
      { method: 'GET', path: '/api/bambu/variants', tag: 'Bambu Lab', summary: 'Komplett Bambu Lab variant-database (228+ varianter)', permission: 'view' },
      { method: 'GET', path: '/api/bambu/variant/:id', tag: 'Bambu Lab', summary: 'Look up variant by ID (e.g. A00-K0)', permission: 'view' },
      { method: 'GET', path: '/api/bambu/product/:code', tag: 'Bambu Lab', summary: 'Look up variant by product code', permission: 'view' },
      { method: 'GET', path: '/api/bambu/enrich-tray', tag: 'Bambu Lab', summary: 'Berik AMS-tray med fargenavn og hex fra variant-database', permission: 'view' },
      { method: 'GET', path: '/api/bambu/materials', tag: 'Bambu Lab', summary: 'Liste over alle Bambu Lab materialtyper', permission: 'view' },
      { method: 'GET', path: '/api/bambu/colors', tag: 'Bambu Lab', summary: 'Colors available for a material', permission: 'view' },
      { method: 'GET', path: '/api/bambu/print-stages', tag: 'Bambu Lab', summary: '36 print-stage koder med norske/engelske beskrivelser', permission: 'view' },
      // BamBuddy features
      { method: 'POST', path: '/api/screenshots/:id/link', tag: 'Screenshots', summary: 'Koble screenshot til printhistorikk', permission: 'controls' },
      { method: 'GET', path: '/api/history/:id/photos', tag: 'History', summary: 'Get photos for a print', permission: 'view' },
      { method: 'GET', path: '/api/mqtt-debug/:printerId', tag: 'Debug', summary: 'Get MQTT debug log', permission: 'admin' },
      { method: 'DELETE', path: '/api/mqtt-debug/:printerId', tag: 'Debug', summary: 'Delete MQTT debug log', permission: 'admin' },
      { method: 'GET', path: '/api/firmware/check/:printerId', tag: 'Firmware', summary: 'Sjekk firmware-status per modul', permission: 'view' },
      { method: 'POST', path: '/api/printers/:id/maintenance', tag: 'Printers', summary: 'Sett vedlikeholdsmodus paa/av', permission: 'controls' },
      { method: 'GET', path: '/api/printers/maintenance', tag: 'Printers', summary: 'Get printers in maintenance mode', permission: 'view' },
      // Printers
      { method: 'GET', path: '/api/printers', tag: 'Printers', summary: 'List all printers', permission: 'view' },
      { method: 'POST', path: '/api/printers', tag: 'Printers', summary: 'Add a printer', permission: 'admin' },
      { method: 'GET', path: '/api/printers/:id', tag: 'Printers', summary: 'Get printer details', permission: 'view' },
      { method: 'PUT', path: '/api/printers/:id', tag: 'Printers', summary: 'Update printer', permission: 'controls' },
      { method: 'DELETE', path: '/api/printers/:id', tag: 'Printers', summary: 'Delete printer', permission: 'controls' },
      { method: 'GET', path: '/api/printers/:id/files', tag: 'Printers', summary: 'List files on printer SD', permission: 'view' },
      { method: 'POST', path: '/api/printers/:id/files/print', tag: 'Printers', summary: 'Start printing a file', permission: 'print' },
      { method: 'GET', path: '/api/printers/:id/camera', tag: 'Printers', summary: 'Get camera snapshot', permission: 'view' },
      { method: 'GET', path: '/api/printers/:id/stream.mjpeg', tag: 'Camera', summary: 'MJPEG live stream (multipart/x-mixed-replace)', permission: 'view' },
      { method: 'GET', path: '/api/printers/:id/frame.jpeg', tag: 'Camera', summary: 'Siste JPEG-frame fra kamera', permission: 'view' },
      // History & Stats
      { method: 'GET', path: '/api/history', tag: 'History', summary: 'Get print history (paginated)', permission: 'view' },
      { method: 'GET', path: '/api/history/export', tag: 'History', summary: 'Export history as CSV', permission: 'view' },
      { method: 'GET', path: '/api/statistics', tag: 'History', summary: 'Get print statistics (supports from/to date params)', permission: 'view' },
      { method: 'GET', path: '/api/statistics/costs', tag: 'History', summary: 'Get cost statistics breakdown', permission: 'view' },
      { method: 'GET', path: '/api/statistics/hardware', tag: 'History', summary: 'Get hardware statistics (maintenance, nozzles, build plates, firmware)', permission: 'view' },
      { method: 'GET', path: '/api/telemetry', tag: 'History', summary: 'Get telemetry data', permission: 'view' },
      { method: 'GET', path: '/api/wear', tag: 'History', summary: 'Get component wear data', permission: 'view' },
      { method: 'GET', path: '/api/errors', tag: 'History', summary: 'Get printer errors', permission: 'view' },
      { method: 'GET', path: '/api/activity-log', tag: 'History', summary: 'Get merged activity log from all tables (prints, errors, maintenance, notifications, etc.)', permission: 'view' },
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
      // CRM
      { method: 'GET', path: '/api/crm/dashboard', tag: 'CRM', summary: 'CRM dashboard stats', permission: 'view' },
      { method: 'GET', path: '/api/crm/customers', tag: 'CRM', summary: 'List customers', permission: 'view' },
      { method: 'POST', path: '/api/crm/customers', tag: 'CRM', summary: 'Create customer', permission: 'admin' },
      { method: 'GET', path: '/api/crm/customers/:id', tag: 'CRM', summary: 'Get customer', permission: 'view' },
      { method: 'PUT', path: '/api/crm/customers/:id', tag: 'CRM', summary: 'Update customer', permission: 'admin' },
      { method: 'DELETE', path: '/api/crm/customers/:id', tag: 'CRM', summary: 'Archive customer', permission: 'admin' },
      { method: 'GET', path: '/api/crm/orders', tag: 'CRM', summary: 'List CRM orders', permission: 'view' },
      { method: 'POST', path: '/api/crm/orders', tag: 'CRM', summary: 'Create CRM order', permission: 'admin' },
      { method: 'GET', path: '/api/crm/orders/:id', tag: 'CRM', summary: 'Get CRM order', permission: 'view' },
      { method: 'PUT', path: '/api/crm/orders/:id', tag: 'CRM', summary: 'Update CRM order', permission: 'admin' },
      { method: 'PATCH', path: '/api/crm/orders/:id/status', tag: 'CRM', summary: 'Update order status', permission: 'admin' },
      { method: 'POST', path: '/api/crm/orders/:id/items', tag: 'CRM', summary: 'Add order item', permission: 'admin' },
      { method: 'DELETE', path: '/api/crm/orders/:id/items/:itemId', tag: 'CRM', summary: 'Remove order item', permission: 'admin' },
      { method: 'POST', path: '/api/crm/orders/from-history/:printId?customer_id=', tag: 'CRM', summary: 'Create order from print history', permission: 'admin' },
      { method: 'POST', path: '/api/crm/orders/:id/invoice', tag: 'CRM', summary: 'Generate invoice from order', permission: 'admin' },
      { method: 'GET', path: '/api/crm/invoices', tag: 'CRM', summary: 'List invoices', permission: 'view' },
      { method: 'PATCH', path: '/api/crm/invoices/:id/status', tag: 'CRM', summary: 'Update invoice status', permission: 'admin' },
      { method: 'GET', path: '/api/crm/invoices/:id/html', tag: 'CRM', summary: 'Get printable invoice HTML', permission: 'view' },
      { method: 'GET', path: '/api/crm/settings', tag: 'CRM', summary: 'Get CRM company settings', permission: 'view' },
      { method: 'PUT', path: '/api/crm/settings', tag: 'CRM', summary: 'Update CRM company settings', permission: 'admin' },
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
      // Error Pattern Analysis
      { method: 'GET', path: '/api/error-patterns', tag: 'Analysis', summary: 'List discovered error patterns', permission: 'view' },
      { method: 'GET', path: '/api/error-patterns/:id', tag: 'Analysis', summary: 'Get error pattern detail', permission: 'view' },
      { method: 'POST', path: '/api/error-patterns/analyze', tag: 'Analysis', summary: 'Trigger error pattern analysis', permission: 'admin' },
      { method: 'GET', path: '/api/error-patterns/suggestions', tag: 'Analysis', summary: 'Get suggestions (query: printer_id)', permission: 'view' },
      { method: 'GET', path: '/api/error-correlations', tag: 'Analysis', summary: 'List error correlations (query: code)', permission: 'view' },
      { method: 'GET', path: '/api/error-correlations/:code', tag: 'Analysis', summary: 'Get correlations for error code', permission: 'view' },
      { method: 'GET', path: '/api/printer-health', tag: 'Analysis', summary: 'List all printer health scores', permission: 'view' },
      { method: 'GET', path: '/api/printer-health/:printerId', tag: 'Analysis', summary: 'Get health score for printer', permission: 'view' },
    ],
    rateLimit: { requests: API_RATE_MAX, window: `${API_RATE_WINDOW_MS / 1000}s`, headers: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'] }
  };
}

function _renderInvoiceHtml(inv) {
  const items = Array.isArray(inv.items) ? inv.items : [];
  let itemsHtml = '';
  for (const it of items) {
    const lineTotal = ((it.qty || 1) * (it.unit_price || 0)).toFixed(2);
    itemsHtml += '<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">' + _escHtml(it.description || '') + '</td>' +
      '<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">' + (it.qty || 1) + '</td>' +
      '<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">' + (it.unit_price || 0).toFixed(2) + '</td>' +
      '<td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">' + lineTotal + '</td></tr>';
  }
  const currency = inv.currency || 'NOK';
  const invoiceDate = inv.created_at ? inv.created_at.split('T')[0] : '';
  const sentDate = inv.sent_at ? inv.sent_at.split('T')[0] : '';
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Invoice ' + _escHtml(inv.invoice_number || '') + '</title>' +
    '<style>@media print { body { margin: 0; } .no-print { display: none; } } ' +
    'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1f2937; max-width: 800px; margin: 20px auto; padding: 40px; } ' +
    'h1 { margin: 0 0 4px; font-size: 28px; } .header { display: flex; justify-content: space-between; margin-bottom: 40px; } ' +
    '.meta { text-align: right; color: #6b7280; font-size: 14px; } .meta strong { color: #1f2937; } ' +
    'table { width: 100%; border-collapse: collapse; margin: 24px 0; } ' +
    'th { background: #f9fafb; padding: 10px 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb; } ' +
    '.totals { text-align: right; margin-top: 16px; } .totals .row { display: flex; justify-content: flex-end; gap: 40px; padding: 4px 0; } ' +
    '.totals .total { font-size: 20px; font-weight: 700; border-top: 2px solid #1f2937; padding-top: 8px; margin-top: 8px; } ' +
    '.notes { margin-top: 40px; padding: 16px; background: #f9fafb; border-radius: 8px; font-size: 14px; color: #6b7280; } ' +
    '.badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; } ' +
    '.badge-draft { background: #fef3c7; color: #92400e; } .badge-sent { background: #dbeafe; color: #1e40af; } .badge-paid { background: #d1fae5; color: #065f46; }' +
    '</style></head><body>' +
    '<div class="header"><div><h1>FAKTURA</h1><p style="color:#6b7280;margin:0">3DPrintForge</p></div>' +
    '<div class="meta"><p><strong>' + _escHtml(inv.invoice_number || '') + '</strong></p>' +
    '<p>Dato: ' + _escHtml(invoiceDate) + '</p>' +
    (sentDate ? '<p>Sendt: ' + _escHtml(sentDate) + '</p>' : '') +
    '<p><span class="badge badge-' + (inv.status || 'draft') + '">' + _escHtml((inv.status || 'draft').toUpperCase()) + '</span></p></div></div>' +
    '<div style="margin-bottom:32px"><h3 style="margin:0 0 4px;font-size:14px;color:#6b7280">Kunde</h3>' +
    '<p style="margin:0;font-weight:600">' + _escHtml(inv.customer_name || '--') + '</p>' +
    (inv.customer_email ? '<p style="margin:2px 0;color:#6b7280">' + _escHtml(inv.customer_email) + '</p>' : '') +
    '</div>' +
    '<table><thead><tr><th>Beskrivelse</th><th style="text-align:center">Antall</th><th style="text-align:right">Pris</th><th style="text-align:right">Sum</th></tr></thead>' +
    '<tbody>' + itemsHtml + '</tbody></table>' +
    '<div class="totals">' +
    '<div class="row"><span>Subtotal:</span><span>' + (inv.subtotal || 0).toFixed(2) + ' ' + currency + '</span></div>' +
    '<div class="row"><span>MVA (' + ((inv.tax_rate || 0) * 100).toFixed(0) + '%):</span><span>' + (inv.tax_amount || 0).toFixed(2) + ' ' + currency + '</span></div>' +
    '<div class="row total"><span>Total:</span><span>' + (inv.total || 0).toFixed(2) + ' ' + currency + '</span></div></div>' +
    (inv.notes ? '<div class="notes"><strong>Notater:</strong> ' + _escHtml(inv.notes) + '</div>' : '') +
    '<div style="margin-top:60px;text-align:center;color:#9ca3af;font-size:12px">Generert av 3DPrintForge</div>' +
    '</body></html>';
}

function _escHtml(s) {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---- Achievements calculator ----
function calculateAchievements() {
  const history = getHistory(9999, 0);
  const spools = getFilament();

  const totalPrints = history.length;
  const completedPrints = history.filter(h => h.status === 'completed').length;
  const failedPrints = history.filter(h => h.status === 'failed').length;
  const totalFilamentG = history.reduce((sum, h) => sum + (h.filament_used_g || 0), 0);
  const totalSeconds = history.reduce((sum, h) => sum + (h.duration_seconds || 0), 0);
  const totalHours = totalSeconds / 3600;
  const uniqueFilaments = new Set(history.map(h => h.filament_type).filter(Boolean)).size;
  const uniqueColors = new Set(history.map(h => h.filament_color).filter(c => c && c.length >= 6)).size;
  const uniqueBrands = new Set(history.map(h => h.filament_brand).filter(Boolean)).size;
  const uniquePrinters = new Set(history.map(h => h.printer_id).filter(Boolean)).size;
  const uniqueNozzles = new Set(history.filter(h => h.nozzle_diameter).map(h => h.nozzle_diameter)).size;
  const uniqueModels = new Set(history.map(h => h.filename).filter(Boolean)).size;
  const successRate = totalPrints > 0 ? (completedPrints / totalPrints * 100) : 0;
  const longestPrint = Math.max(0, ...history.map(h => h.duration_seconds || 0));
  const shortestCompleted = history.filter(h => h.status === 'completed' && h.duration_seconds > 0);
  const shortestPrint = shortestCompleted.length > 0 ? Math.min(...shortestCompleted.map(h => h.duration_seconds)) : 0;
  const heaviestPrint = Math.max(0, ...history.map(h => h.filament_used_g || 0));
  const lightestCompleted = history.filter(h => h.status === 'completed' && h.filament_used_g > 0);
  const lightestPrint = lightestCompleted.length > 0 ? Math.min(...lightestCompleted.map(h => h.filament_used_g)) : 0;
  const totalLayers = history.reduce((sum, h) => sum + (h.layer_count || 0), 0);
  const sorted = history.filter(h => h.status).sort((a, b) => new Date(a.started_at) - new Date(b.started_at));
  const consecutiveSuccess = _longestStreak(sorted);

  // Speed modes used
  const speedModes = new Set(history.map(h => h.speed_level).filter(Boolean));
  const ludicrousPrints = history.filter(h => h.speed_level === 4 && h.status === 'completed').length;
  const silentPrints = history.filter(h => h.speed_level === 1 && h.status === 'completed').length;

  // Time-based analysis
  const nightPrints = history.filter(h => { if (!h.started_at) return false; const hr = new Date(h.started_at).getHours(); return hr >= 0 && hr < 5; }).length;
  const earlyPrints = history.filter(h => { if (!h.started_at) return false; const hr = new Date(h.started_at).getHours(); return hr >= 5 && hr < 7; }).length;
  const weekendPrints = history.filter(h => { if (!h.started_at) return false; const d = new Date(h.started_at).getDay(); return d === 0 || d === 6; }).length;

  // Days with prints
  const printDays = new Set(history.filter(h => h.started_at).map(h => h.started_at.substring(0, 10)));
  const printMonths = new Set(history.filter(h => h.started_at).map(h => h.started_at.substring(0, 7)));
  const dailyStreak = _longestDailyStreak(printDays);
  const weeklyStreak = _longestWeeklyStreak(printDays);

  // Temperature records
  const maxNozzleTemp = Math.max(0, ...history.map(h => h.max_nozzle_temp || 0));
  const maxBedTemp = Math.max(0, ...history.map(h => h.max_bed_temp || 0));

  // Multi-color / AMS
  const amsPrints = history.filter(h => h.ams_units_used && h.ams_units_used > 1).length;
  const multiColorPrints = history.filter(h => h.color_changes && h.color_changes > 0).length;

  // Comeback: complete a print after 3+ consecutive fails
  const comebackKing = _hasComeback(sorted, 3);
  const comebackLegend = _hasComeback(sorted, 5);

  // Same model reprinted
  const modelCounts = {};
  for (const h of history) { if (h.filename) modelCounts[h.filename] = (modelCounts[h.filename] || 0) + 1; }
  const maxReprints = Math.max(0, ...Object.values(modelCounts));

  // Prints in a single day
  const printsByDay = {};
  for (const h of history) { if (h.started_at) { const d = h.started_at.substring(0, 10); printsByDay[d] = (printsByDay[d] || 0) + 1; } }
  const maxPrintsOneDay = Math.max(0, ...Object.values(printsByDay));

  // Account age (days since first print)
  const firstPrintDate = sorted.length > 0 && sorted[0].started_at ? new Date(sorted[0].started_at) : null;
  const accountAgeDays = firstPrintDate ? Math.floor((Date.now() - firstPrintDate) / 86400000) : 0;
  const accountAgeWeeks = Math.floor(accountAgeDays / 7);
  const accountAgeMonths = firstPrintDate ? _monthsDiff(firstPrintDate, new Date()) : 0;

  // Prints per time period averages
  const printsPerWeek = accountAgeWeeks > 0 ? completedPrints / accountAgeWeeks : 0;
  const printsPerMonth = accountAgeMonths > 0 ? completedPrints / accountAgeMonths : 0;

  // Longest gap between prints (days without printing)
  const sortedDays = [...printDays].sort();
  let longestGap = 0;
  for (let i = 1; i < sortedDays.length; i++) {
    const gap = Math.floor((new Date(sortedDays[i]) - new Date(sortedDays[i - 1])) / 86400000);
    longestGap = Math.max(longestGap, gap);
  }

  // Inventory stats
  const totalSpoolWeight = spools.reduce((s, sp) => s + (sp.remaining_weight_g || 0), 0);
  const spoolVendors = new Set(spools.map(s => s.vendor_name).filter(Boolean)).size;
  const spoolColors = new Set(spools.filter(s => s.color_hex && s.color_hex.length >= 6).map(s => s.color_hex.substring(0, 6))).size;

  const all = [
    // ═══ Prints ═══
    { id: 'first_print', icon: '\u{1F3AF}', title: 'First Print', desc: 'Complete your first print', target: 1, current: completedPrints, category: 'prints' },
    { id: 'prints_10', icon: '\u2B50', title: 'Getting Started', desc: 'Complete 10 prints', target: 10, current: completedPrints, category: 'prints' },
    { id: 'prints_50', icon: '\u{1F525}', title: 'On a Roll', desc: 'Complete 50 prints', target: 50, current: completedPrints, category: 'prints' },
    { id: 'prints_100', icon: '\u{1F4AF}', title: 'Centurion', desc: 'Complete 100 prints', target: 100, current: completedPrints, category: 'prints' },
    { id: 'prints_500', icon: '\u{1F3C6}', title: 'Print Master', desc: 'Complete 500 prints', target: 500, current: completedPrints, category: 'prints' },
    { id: 'prints_1000', icon: '\u{1F451}', title: 'Print Legend', desc: 'Complete 1,000 prints', target: 1000, current: completedPrints, category: 'prints' },
    { id: 'prints_2500', icon: '\u{1F30C}', title: 'Galaxy Brain', desc: 'Complete 2,500 prints', target: 2500, current: completedPrints, category: 'prints' },
    { id: 'prints_5000', icon: '\u{1F680}', title: 'To Infinity', desc: 'Complete 5,000 prints', target: 5000, current: completedPrints, category: 'prints' },
    { id: 'batch_5', icon: '\u{1F4E6}', title: 'Batch Job', desc: '5 prints in a single day', target: 5, current: maxPrintsOneDay, category: 'prints' },
    { id: 'batch_10', icon: '\u{1F3ED}', title: 'Factory Mode', desc: '10 prints in a single day', target: 10, current: maxPrintsOneDay, category: 'prints' },
    { id: 'batch_20', icon: '\u26A1', title: 'Assembly Line', desc: '20 prints in a single day', target: 20, current: maxPrintsOneDay, category: 'prints' },
    { id: 'reprint_5', icon: '\u{1F504}', title: 'Repeat Customer', desc: 'Print the same model 5 times', target: 5, current: maxReprints, category: 'prints' },
    { id: 'reprint_20', icon: '\u{1F3F7}\uFE0F', title: 'Mass Production', desc: 'Print the same model 20 times', target: 20, current: maxReprints, category: 'prints' },
    { id: 'unique_50', icon: '\u{1F4DA}', title: 'Diverse Portfolio', desc: 'Print 50 unique models', target: 50, current: uniqueModels, category: 'prints' },
    { id: 'unique_200', icon: '\u{1F30D}', title: 'World Builder', desc: 'Print 200 unique models', target: 200, current: uniqueModels, category: 'prints' },

    // ═══ Filament ═══
    { id: 'filament_1kg', icon: '\u{1F9F5}', title: '1 kg Club', desc: 'Use 1 kg of filament', target: 1000, current: Math.round(totalFilamentG), category: 'filament' },
    { id: 'filament_10kg', icon: '\u{1F3A8}', title: 'Filament Enthusiast', desc: 'Use 10 kg of filament', target: 10000, current: Math.round(totalFilamentG), category: 'filament' },
    { id: 'filament_50kg', icon: '\u{1F3ED}', title: 'Production Line', desc: 'Use 50 kg of filament', target: 50000, current: Math.round(totalFilamentG), category: 'filament' },
    { id: 'filament_100kg', icon: '\u{1F30B}', title: 'Plastic Volcano', desc: 'Use 100 kg of filament', target: 100000, current: Math.round(totalFilamentG), category: 'filament' },
    { id: 'materials_3', icon: '\u{1F3AD}', title: 'Material Explorer', desc: 'Use 3 different filament types', target: 3, current: uniqueFilaments, category: 'filament' },
    { id: 'materials_6', icon: '\u{1F308}', title: 'Rainbow Maker', desc: 'Use 6 different filament types', target: 6, current: uniqueFilaments, category: 'filament' },
    { id: 'materials_10', icon: '\u{1F52C}', title: 'Material Scientist', desc: 'Use 10 different filament types', target: 10, current: uniqueFilaments, category: 'filament' },
    { id: 'colors_10', icon: '\u{1F3A8}', title: 'Color Palette', desc: 'Print with 10 different colors', target: 10, current: uniqueColors, category: 'filament' },
    { id: 'colors_25', icon: '\u{1F308}', title: 'Chromatic', desc: 'Print with 25 different colors', target: 25, current: uniqueColors, category: 'filament' },
    { id: 'brands_3', icon: '\u{1F6CD}\uFE0F', title: 'Brand Taster', desc: 'Use filament from 3 brands', target: 3, current: uniqueBrands, category: 'filament' },
    { id: 'brands_5', icon: '\u{1F6D2}', title: 'Brand Connoisseur', desc: 'Use filament from 5 brands', target: 5, current: uniqueBrands, category: 'filament' },
    { id: 'heavy_print', icon: '\u{1F4AA}', title: 'Heavy Lifter', desc: 'Complete a single print using 500g+', target: 500, current: Math.round(heaviestPrint), category: 'filament' },
    { id: 'mega_print', icon: '\u{1F9BE}', title: 'Mega Build', desc: 'Complete a single print using 1 kg+', target: 1000, current: Math.round(heaviestPrint), category: 'filament' },
    { id: 'tiny_print', icon: '\u{1F90F}', title: 'Precision Work', desc: 'Complete a print using under 2g', target: 1, current: (lightestPrint > 0 && lightestPrint < 2) ? 1 : 0, category: 'filament' },
    { id: 'multicolor_1', icon: '\u{1F3A8}', title: 'Color Mixing', desc: 'Complete a multi-color print', target: 1, current: multiColorPrints, category: 'filament' },
    { id: 'multicolor_25', icon: '\u{1F5BC}\uFE0F', title: 'Artist', desc: 'Complete 25 multi-color prints', target: 25, current: multiColorPrints, category: 'filament' },
    { id: 'ams_10', icon: '\u{1F504}', title: 'AMS Powered', desc: 'Complete 10 prints using multiple AMS slots', target: 10, current: amsPrints, category: 'filament' },

    // ═══ Time ═══
    { id: 'hours_24', icon: '\u23F0', title: 'Full Day', desc: 'Print for 24 total hours', target: 24, current: Math.round(totalHours * 10) / 10, category: 'time' },
    { id: 'hours_100', icon: '\u23F1\uFE0F', title: 'Time Invested', desc: 'Print for 100 total hours', target: 100, current: Math.round(totalHours * 10) / 10, category: 'time' },
    { id: 'hours_500', icon: '\u{1F550}', title: 'Dedicated Maker', desc: 'Print for 500 total hours', target: 500, current: Math.round(totalHours * 10) / 10, category: 'time' },
    { id: 'hours_1000', icon: '\u{1F3C5}', title: 'Thousand Hour Club', desc: 'Print for 1,000 total hours', target: 1000, current: Math.round(totalHours * 10) / 10, category: 'time' },
    { id: 'hours_2500', icon: '\u{1F31F}', title: 'Time Lord', desc: 'Print for 2,500 total hours', target: 2500, current: Math.round(totalHours * 10) / 10, category: 'time' },
    { id: 'marathon', icon: '\u{1F3C3}', title: 'Marathon Print', desc: 'Complete a print over 12 hours', target: 43200, current: longestPrint, category: 'time' },
    { id: 'ultramarathon', icon: '\u{1F9BE}', title: 'Ultra Marathon', desc: 'Complete a print over 24 hours', target: 86400, current: longestPrint, category: 'time' },
    { id: 'ironman', icon: '\u{1F9D7}', title: 'Ironman', desc: 'Complete a print over 48 hours', target: 172800, current: longestPrint, category: 'time' },
    { id: 'speedster', icon: '\u26A1', title: 'Speed Demon', desc: 'Complete a print in under 30 minutes', target: 1, current: (shortestPrint > 0 && shortestPrint < 1800) ? 1 : 0, category: 'time' },
    { id: 'quickdraw', icon: '\u{1F4A8}', title: 'Quick Draw', desc: 'Complete a print in under 10 minutes', target: 1, current: (shortestPrint > 0 && shortestPrint < 600) ? 1 : 0, category: 'time' },
    { id: 'night_owl', icon: '\u{1F989}', title: 'Night Owl', desc: 'Start 10 prints between midnight and 5 AM', target: 10, current: nightPrints, category: 'time' },
    { id: 'early_bird', icon: '\u{1F426}', title: 'Early Bird', desc: 'Start 10 prints between 5 AM and 7 AM', target: 10, current: earlyPrints, category: 'time' },
    { id: 'weekend_warrior', icon: '\u{1F3D6}\uFE0F', title: 'Weekend Warrior', desc: 'Complete 50 weekend prints', target: 50, current: weekendPrints, category: 'time' },

    // ═══ Quality ═══
    { id: 'streak_5', icon: '\u{1F517}', title: 'Winning Streak', desc: '5 successful prints in a row', target: 5, current: consecutiveSuccess, category: 'quality' },
    { id: 'streak_20', icon: '\u{1F48E}', title: 'Flawless Run', desc: '20 successful prints in a row', target: 20, current: consecutiveSuccess, category: 'quality' },
    { id: 'streak_50', icon: '\u{1F3C6}', title: 'Untouchable', desc: '50 successful prints in a row', target: 50, current: consecutiveSuccess, category: 'quality' },
    { id: 'streak_100', icon: '\u{1F47D}', title: 'Inhuman Precision', desc: '100 successful prints in a row', target: 100, current: consecutiveSuccess, category: 'quality' },
    { id: 'success_95', icon: '\u{1F3AF}', title: 'Sharpshooter', desc: '95%+ success rate (min 20 prints)', target: 95, current: totalPrints >= 20 ? Math.round(successRate * 10) / 10 : 0, category: 'quality' },
    { id: 'success_99', icon: '\u{1F9EC}', title: 'Almost Perfect', desc: '99%+ success rate (min 50 prints)', target: 99, current: totalPrints >= 50 ? Math.round(successRate * 10) / 10 : 0, category: 'quality' },
    { id: 'zero_fails', icon: '\u2728', title: 'Perfect Week', desc: '0 failed prints this week', target: 1, current: _noFailsThisWeek(history) ? 1 : 0, category: 'quality' },
    { id: 'comeback', icon: '\u{1F4AA}', title: 'Comeback Kid', desc: 'Succeed after 3 consecutive failures', target: 1, current: comebackKing ? 1 : 0, category: 'quality' },
    { id: 'comeback_legend', icon: '\u{1F9D7}', title: 'Never Give Up', desc: 'Succeed after 5 consecutive failures', target: 1, current: comebackLegend ? 1 : 0, category: 'quality' },
    { id: 'layers_100k', icon: '\u{1F4C8}', title: 'Layer by Layer', desc: 'Accumulate 100,000 total layers', target: 100000, current: totalLayers, category: 'quality' },
    { id: 'layers_1m', icon: '\u{1F3D7}\uFE0F', title: 'Skyscraper', desc: 'Accumulate 1,000,000 total layers', target: 1000000, current: totalLayers, category: 'quality' },

    // ═══ Exploration ═══
    { id: 'multi_printer_2', icon: '\u{1F5A8}\uFE0F', title: 'Dual Operator', desc: 'Print on 2 different printers', target: 2, current: uniquePrinters, category: 'exploration' },
    { id: 'multi_printer_3', icon: '\u{1F3E2}', title: 'Print Farm', desc: 'Print on 3+ different printers', target: 3, current: uniquePrinters, category: 'exploration' },
    { id: 'multi_printer_5', icon: '\u{1F3ED}', title: 'Fleet Commander', desc: 'Print on 5+ different printers', target: 5, current: uniquePrinters, category: 'exploration' },
    { id: 'nozzle_2', icon: '\u{1F50D}', title: 'Nozzle Swap', desc: 'Use 2 different nozzle sizes', target: 2, current: uniqueNozzles, category: 'exploration' },
    { id: 'nozzle_4', icon: '\u{1F52E}', title: 'Nozzle Collector', desc: 'Use 4+ different nozzle sizes', target: 4, current: uniqueNozzles, category: 'exploration' },
    { id: 'all_speeds', icon: '\u{1F3CE}\uFE0F', title: 'Speed Explorer', desc: 'Use all 4 speed modes', target: 4, current: speedModes.size, category: 'exploration' },
    { id: 'ludicrous_10', icon: '\u{1F680}', title: 'Ludicrous Speed', desc: 'Complete 10 prints in Ludicrous mode', target: 10, current: ludicrousPrints, category: 'exploration' },
    { id: 'ludicrous_50', icon: '\u{1F4A5}', title: 'Warp Drive', desc: 'Complete 50 prints in Ludicrous mode', target: 50, current: ludicrousPrints, category: 'exploration' },
    { id: 'silent_10', icon: '\u{1F910}', title: 'Ninja Mode', desc: 'Complete 10 prints in Silent mode', target: 10, current: silentPrints, category: 'exploration' },
    { id: 'hot_nozzle', icon: '\u{1F321}\uFE0F', title: 'Feeling the Heat', desc: 'Print at 280\u00B0C+ nozzle temperature', target: 280, current: maxNozzleTemp, category: 'exploration' },
    { id: 'hot_bed', icon: '\u{1F525}', title: 'Hot Plate', desc: 'Print at 100\u00B0C+ bed temperature', target: 100, current: maxBedTemp, category: 'exploration' },

    // ═══ Dedication ═══
    { id: 'daily_3', icon: '\u{1F4C5}', title: 'Three Day Run', desc: 'Print 3 days in a row', target: 3, current: dailyStreak, category: 'dedication' },
    { id: 'daily_7', icon: '\u{1F4C6}', title: 'Weekly Printer', desc: 'Print every day for a week', target: 7, current: dailyStreak, category: 'dedication' },
    { id: 'daily_14', icon: '\u{1F3C3}\u200D\u2642\uFE0F', title: 'Two Week Streak', desc: 'Print every day for 2 weeks', target: 14, current: dailyStreak, category: 'dedication' },
    { id: 'daily_30', icon: '\u{1F525}', title: 'Monthly Machine', desc: 'Print every day for a month', target: 30, current: dailyStreak, category: 'dedication' },
    { id: 'weekly_4', icon: '\u{1F4AA}', title: 'Consistent Maker', desc: 'Print at least once a week for 4 weeks', target: 4, current: weeklyStreak, category: 'dedication' },
    { id: 'weekly_12', icon: '\u{1F9D1}\u200D\u{1F3A8}', title: 'Quarter Master', desc: 'Print at least once a week for 12 weeks', target: 12, current: weeklyStreak, category: 'dedication' },
    { id: 'weekly_26', icon: '\u{1F3C5}', title: 'Half Year Hero', desc: 'Print at least once a week for 26 weeks', target: 26, current: weeklyStreak, category: 'dedication' },
    { id: 'monthly_6', icon: '\u{1F30D}', title: 'Seasoned Maker', desc: 'Print in 6 different months', target: 6, current: printMonths.size, category: 'dedication' },
    { id: 'monthly_12', icon: '\u{1F389}', title: 'Year-Round Maker', desc: 'Print in 12 different months', target: 12, current: printMonths.size, category: 'dedication' },
    { id: 'print_days_100', icon: '\u{1F4C5}', title: '100 Print Days', desc: 'Have 100 unique days with prints', target: 100, current: printDays.size, category: 'dedication' },
    { id: 'print_days_365', icon: '\u{1F38A}', title: 'Year of Making', desc: 'Have 365 unique days with prints', target: 365, current: printDays.size, category: 'dedication' },
    { id: 'weekly_52', icon: '\u{1F451}', title: 'Year-Long Commitment', desc: 'Print at least once a week for 52 weeks', target: 52, current: weeklyStreak, category: 'dedication' },
    { id: 'daily_60', icon: '\u{1F9D8}', title: 'Zen Master', desc: 'Print every day for 60 days', target: 60, current: dailyStreak, category: 'dedication' },
    { id: 'daily_90', icon: '\u{1F3C6}', title: 'Unstoppable', desc: 'Print every day for 90 days straight', target: 90, current: dailyStreak, category: 'dedication' },
    { id: 'daily_180', icon: '\u{1F30C}', title: 'Half Year Streak', desc: 'Print every day for 180 days', target: 180, current: dailyStreak, category: 'dedication' },
    { id: 'daily_365', icon: '\u{1F3C6}', title: 'The Undying Flame', desc: 'Print every single day for an entire year', target: 365, current: dailyStreak, category: 'dedication' },
    { id: 'comeback_from_gap', icon: '\u{1F504}', title: 'The Return', desc: 'Resume printing after a 30+ day break', target: 30, current: longestGap, category: 'dedication' },

    // ═══ Milestones (account age) ═══
    { id: 'age_week', icon: '\u{1F331}', title: 'First Week', desc: 'Your printing journey is 1 week old', target: 7, current: accountAgeDays, category: 'milestones' },
    { id: 'age_month', icon: '\u{1F33F}', title: 'One Month In', desc: 'Your printing journey is 1 month old', target: 30, current: accountAgeDays, category: 'milestones' },
    { id: 'age_3months', icon: '\u{1F333}', title: 'Quarter Veteran', desc: 'Your printing journey is 3 months old', target: 90, current: accountAgeDays, category: 'milestones' },
    { id: 'age_6months', icon: '\u{1F334}', title: 'Half Year Maker', desc: 'Your printing journey is 6 months old', target: 180, current: accountAgeDays, category: 'milestones' },
    { id: 'age_1year', icon: '\u{1F3C5}', title: 'One Year Anniversary', desc: 'Your printing journey is 1 year old', target: 365, current: accountAgeDays, category: 'milestones' },
    { id: 'age_2years', icon: '\u{1F396}\uFE0F', title: 'Two Year Veteran', desc: 'Your printing journey is 2 years old', target: 730, current: accountAgeDays, category: 'milestones' },
    { id: 'monthly_24', icon: '\u{1F30D}', title: 'Two-Year Streak', desc: 'Print in 24 different months', target: 24, current: printMonths.size, category: 'milestones' },
    { id: 'avg_5_per_week', icon: '\u{1F4C8}', title: 'Power User', desc: 'Average 5+ prints per week over your career', target: 5, current: Math.round(printsPerWeek * 10) / 10, category: 'milestones' },
    { id: 'avg_50_per_month', icon: '\u{1F4C8}', title: 'Production Mode', desc: 'Average 50+ prints per month over your career', target: 50, current: Math.round(printsPerMonth * 10) / 10, category: 'milestones' },

    // ═══ Collection ═══
    { id: 'spools_10', icon: '\u{1F4E6}', title: 'Stocked Up', desc: 'Have 10+ spools in inventory', target: 10, current: spools.length, category: 'collection' },
    { id: 'spools_25', icon: '\u{1F3EA}', title: 'Mini Warehouse', desc: 'Have 25+ spools in inventory', target: 25, current: spools.length, category: 'collection' },
    { id: 'spools_50', icon: '\u{1F3E0}', title: 'Filament Hoarder', desc: 'Have 50+ spools in inventory', target: 50, current: spools.length, category: 'collection' },
    { id: 'spools_100', icon: '\u{1F3ED}', title: 'Warehouse Manager', desc: 'Have 100+ spools in inventory', target: 100, current: spools.length, category: 'collection' },
    { id: 'spool_vendors_3', icon: '\u{1F6D2}', title: 'Vendor Variety', desc: 'Have spools from 3+ vendors', target: 3, current: spoolVendors, category: 'collection' },
    { id: 'spool_vendors_5', icon: '\u{1F30E}', title: 'Global Shopper', desc: 'Have spools from 5+ vendors', target: 5, current: spoolVendors, category: 'collection' },
    { id: 'spool_colors_10', icon: '\u{1F3A8}', title: 'Color Collector', desc: 'Have 10+ unique colors in inventory', target: 10, current: spoolColors, category: 'collection' },
    { id: 'spool_colors_25', icon: '\u{1F308}', title: 'Rainbow Stash', desc: 'Have 25+ unique colors in inventory', target: 25, current: spoolColors, category: 'collection' },
    { id: 'stock_5kg', icon: '\u{1F4E6}', title: '5 kg Reserve', desc: 'Have 5 kg of filament in stock', target: 5000, current: Math.round(totalSpoolWeight), category: 'collection' },
    { id: 'stock_25kg', icon: '\u{1F9F1}', title: 'Filament Fortress', desc: 'Have 25 kg of filament in stock', target: 25000, current: Math.round(totalSpoolWeight), category: 'collection' },

    // ═══ Legendary Landmarks — Real-world 1:1 scale filament challenges ═══
    // Statue of Liberty: 93m tall, ~225 tonnes total. 3D printed at 15% infill with PLA ≈ 46,000 kg
    { id: 'landmark_liberty', icon: '\u{1F5FD}', title: 'Lady Liberty', desc: 'Use enough filament to 3D print the Statue of Liberty at 1:1 scale (46,000 kg)', target: 46000000, current: Math.round(totalFilamentG), category: 'milestones', xp: 50000 },
    // Eiffel Tower: 330m tall, 7,300 tonnes of iron. PLA equivalent at 15% infill ≈ 180,000 kg
    { id: 'landmark_eiffel', icon: '\u{1F5FC}', title: 'Tour Eiffel', desc: 'Use enough filament to 3D print the Eiffel Tower at 1:1 scale (180,000 kg)', target: 180000000, current: Math.round(totalFilamentG), category: 'milestones', xp: 200000 },
    // World landmarks — one per supported language/region
    // 🇳🇴 Norway: Viking Ship (Oseberg) — 21.5m long, ~15 tonnes oak → PLA 15% infill ≈ 3,000 kg
    { id: 'landmark_viking', icon: '\u{26F5}', title: 'Viking Longship', desc: 'Use enough filament to 3D print a Viking longship at 1:1 scale (3,000 kg)', target: 3000000, current: Math.round(totalFilamentG), category: 'milestones', xp: 15000 },
    // 🇬🇧 UK: Big Ben clock tower — 96m, ~8,600 tonnes → PLA ≈ 120,000 kg
    { id: 'landmark_bigben', icon: '\u{1F514}', title: 'Big Ben', desc: 'Use enough filament to 3D print Big Ben at 1:1 scale (120,000 kg)', target: 120000000, current: Math.round(totalFilamentG), category: 'milestones', xp: 150000 },
    // 🇩🇪 Germany: Brandenburg Gate — 26m tall, ~2,000 tonnes sandstone → PLA ≈ 800 kg (hollow columns)
    { id: 'landmark_brandenburg', icon: '\u{1F3DB}\uFE0F', title: 'Brandenburger Tor', desc: 'Use enough filament to 3D print the Brandenburg Gate at 1:1 scale (800 kg)', target: 800000, current: Math.round(totalFilamentG), category: 'milestones', xp: 8000 },
    // 🇪🇸 Spain: Sagrada Família — 170m tall when complete, ~50,000 tonnes → PLA ≈ 8,000 kg (facade only)
    { id: 'landmark_sagrada', icon: '\u26EA', title: 'Sagrada Família', desc: 'Use enough filament to 3D print the Sagrada Família facade at 1:1 scale (8,000 kg)', target: 8000000, current: Math.round(totalFilamentG), category: 'milestones', xp: 30000 },
    // 🇮🇹 Italy: Colosseum — 48m tall, ~100,000 tonnes → PLA ≈ 15,000 kg (outer wall)
    { id: 'landmark_colosseum', icon: '\u{1F3DF}\uFE0F', title: 'Colosseo', desc: 'Use enough filament to 3D print the Colosseum outer wall at 1:1 scale (15,000 kg)', target: 15000000, current: Math.round(totalFilamentG), category: 'milestones', xp: 40000 },
    // 🇯🇵 Japan: Tokyo Tower — 333m, 4,000 tonnes steel → PLA ≈ 90,000 kg
    { id: 'landmark_tokyo', icon: '\u{1F5FC}', title: 'Tokyo Tower', desc: 'Use enough filament to 3D print Tokyo Tower at 1:1 scale (90,000 kg)', target: 90000000, current: Math.round(totalFilamentG), category: 'milestones', xp: 120000 },
    // 🇰🇷 South Korea: Gyeongbokgung Throne Hall — 34m x 20m, ~500 tonnes wood → PLA ≈ 400 kg
    { id: 'landmark_gyeongbok', icon: '\u{1F3EF}', title: 'Gyeongbokgung', desc: 'Use enough filament to 3D print the Gyeongbokgung throne hall at 1:1 scale (400 kg)', target: 400000, current: Math.round(totalFilamentG), category: 'milestones', xp: 5000 },
    // 🇳🇱 Netherlands: Windmill (De Gooyer) — 26m tall → PLA ≈ 600 kg
    { id: 'landmark_windmill', icon: '\u{1F3E1}', title: 'Dutch Windmill', desc: 'Use enough filament to 3D print a classic Dutch windmill at 1:1 scale (600 kg)', target: 600000, current: Math.round(totalFilamentG), category: 'milestones', xp: 6000 },
    // 🇵🇱 Poland: Wawel Dragon statue — 6m → PLA ≈ 200 kg
    { id: 'landmark_wawel', icon: '\u{1F432}', title: 'Wawel Dragon', desc: 'Use enough filament to 3D print the Wawel Dragon statue at 1:1 scale (200 kg)', target: 200000, current: Math.round(totalFilamentG), category: 'milestones', xp: 3000 },
    // 🇧🇷 Brazil: Cristo Redentor — 30m tall, 635 tonnes → PLA ≈ 1,200 kg
    { id: 'landmark_cristo', icon: '\u271D\uFE0F', title: 'Cristo Redentor', desc: 'Use enough filament to 3D print Cristo Redentor at 1:1 scale (1,200 kg)', target: 1200000, current: Math.round(totalFilamentG), category: 'milestones', xp: 10000 },
    // 🇸🇪 Sweden: Turning Torso — 190m, 17,000 tonnes → PLA ≈ 2,500 kg (facade)
    { id: 'landmark_torso', icon: '\u{1F3D7}\uFE0F', title: 'Turning Torso', desc: 'Use enough filament to 3D print the Turning Torso facade at 1:1 scale (2,500 kg)', target: 2500000, current: Math.round(totalFilamentG), category: 'milestones', xp: 12000 },
    // 🇹🇷 Turkey: Hagia Sophia dome — 56m tall, ~4,000 tonnes → PLA ≈ 5,000 kg
    { id: 'landmark_hagia', icon: '\u{1F54C}', title: 'Hagia Sophia', desc: 'Use enough filament to 3D print the Hagia Sophia dome at 1:1 scale (5,000 kg)', target: 5000000, current: Math.round(totalFilamentG), category: 'milestones', xp: 20000 },
    // 🇺🇦 Ukraine: Motherland Monument — 102m, 450 tonnes steel → PLA ≈ 1,500 kg
    { id: 'landmark_motherland', icon: '\u{2694}\uFE0F', title: 'Motherland Monument', desc: 'Use enough filament to 3D print the Motherland Monument at 1:1 scale (1,500 kg)', target: 1500000, current: Math.round(totalFilamentG), category: 'milestones', xp: 12000 },
    // 🇨🇳 China: Great Wall section (1km) — PLA ≈ 50,000 kg
    { id: 'landmark_greatwall', icon: '\u{1F9F1}', title: 'Great Wall', desc: 'Use enough filament to 3D print 1 km of the Great Wall at 1:1 scale (50,000 kg)', target: 50000000, current: Math.round(totalFilamentG), category: 'milestones', xp: 60000 },
    // 🇨🇿 Czech Republic: Prague Astronomical Clock — 2.5m → PLA ≈ 150 kg
    { id: 'landmark_orloj', icon: '\u{1F570}\uFE0F', title: 'Prague Orloj', desc: 'Use enough filament to 3D print the Prague Astronomical Clock at 1:1 scale (150 kg)', target: 150000, current: Math.round(totalFilamentG), category: 'milestones', xp: 2000 },
    // 🇭🇺 Hungary: Parliament Building dome — 96m, ~40,000 tonnes → PLA ≈ 6,000 kg (dome only)
    { id: 'landmark_parliament', icon: '\u{1F3DB}\uFE0F', title: 'Budapest Parliament', desc: 'Use enough filament to 3D print the Budapest Parliament dome at 1:1 scale (6,000 kg)', target: 6000000, current: Math.round(totalFilamentG), category: 'milestones', xp: 25000 },

    // Bonus stepping stones
    { id: 'filament_500kg', icon: '\u{1F30B}', title: 'Half-Ton Club', desc: 'Use 500 kg of filament total', target: 500000, current: Math.round(totalFilamentG), category: 'filament', xp: 5000 },
    { id: 'filament_1000kg', icon: '\u2604\uFE0F', title: 'One Tonne', desc: 'Use 1,000 kg (1 metric tonne) of filament', target: 1000000, current: Math.round(totalFilamentG), category: 'filament', xp: 10000 },
    { id: 'filament_10000kg', icon: '\u{1F30C}', title: '10 Tonnes', desc: 'Use 10,000 kg of filament — enough for a small car', target: 10000000, current: Math.round(totalFilamentG), category: 'filament', xp: 25000 },
  ];

  return all.map(a => ({
    ...a,
    earned: a.current >= a.target,
    progress: Math.min(1, a.current / a.target)
  }));
}

function _longestStreak(sorted) {
  let max = 0, cur = 0;
  for (const h of sorted) {
    if (h.status === 'completed') { cur++; max = Math.max(max, cur); }
    else cur = 0;
  }
  return max;
}

function _noFailsThisWeek(history) {
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const thisWeek = history.filter(h => new Date(h.started_at) >= weekAgo);
  return thisWeek.length > 0 && thisWeek.every(h => h.status !== 'failed');
}

function _hasComeback(sorted, failCount) {
  let fails = 0;
  for (const h of sorted) {
    if (h.status === 'failed') { fails++; }
    else if (h.status === 'completed') { if (fails >= failCount) return true; fails = 0; }
    else { fails = 0; }
  }
  return false;
}

function _longestDailyStreak(daySet) {
  if (daySet.size === 0) return 0;
  const days = [...daySet].sort();
  let max = 1, cur = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diff = (curr - prev) / 86400000;
    if (diff === 1) { cur++; max = Math.max(max, cur); }
    else if (diff > 1) { cur = 1; }
  }
  return max;
}

function _longestWeeklyStreak(daySet) {
  if (daySet.size === 0) return 0;
  const days = [...daySet].sort();
  // Group by ISO week
  const weeks = new Set();
  for (const d of days) {
    const dt = new Date(d);
    const jan1 = new Date(dt.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((dt - jan1) / 86400000 + jan1.getDay() + 1) / 7);
    weeks.add(`${dt.getFullYear()}-W${weekNum}`);
  }
  const sorted = [...weeks].sort();
  let max = 1, cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const [py, pw] = sorted[i - 1].split('-W').map(Number);
    const [cy, cw] = sorted[i].split('-W').map(Number);
    if ((cy === py && cw === pw + 1) || (cy === py + 1 && pw >= 52 && cw === 1)) { cur++; max = Math.max(max, cur); }
    else { cur = 1; }
  }
  return max;
}

function _monthsDiff(d1, d2) {
  return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
}

function sendJson(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'X-API-Version': _pkgVersion });
  res.end(JSON.stringify(data));
}

const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10 MB (screenshots can be large)

function readBody(req, res, callback) {
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
      sendJson(res, { error: 'Invalid JSON in request' }, 400);
      return;
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
    Promise.resolve(callback(Buffer.concat(chunks))).catch(e => {
      console.error('[server] readBinaryBody callback error:', e.message);
    });
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
    searches.push(searchMakerWorld(encodedQuery).catch(e => { log.debug('MakerWorld search failed', e.message); return []; }));
  }
  if (source === 'all' || source === 'printables') {
    searches.push(searchPrintables(encodedQuery).catch(e => { log.debug('Printables search failed', e.message); return []; }));
  }
  if (source === 'all' || source === 'thingiverse') {
    searches.push(searchThingiverse(encodedQuery).catch(e => { log.debug('Thingiverse search failed', e.message); return []; }));
  }

  const results = (await Promise.all(searches)).flat();
  sendJson(res, results);
}

async function searchMakerWorld(query) {
  return withBreaker('makerworld', async () => {
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
  }, []);
}

async function searchPrintables(query) {
  return withBreaker('printables', async () => {
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
  }, []);
}

async function searchThingiverse(query) {
  return withBreaker('thingiverse', async () => {
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
  }, []);
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
        } catch (e) { log.warn('Failed to log webhook delivery', e.message); }
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
      } catch (e) { log.warn('Failed to log webhook failure', e.message); }
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
          embeds: [{ title, description: message, color: colors[eventType] || 9807270, timestamp: new Date().toISOString(), footer: { text: '3DPrintForge' } }]
        });
      } else if (wh.template === 'slack') {
        payload = JSON.stringify({
          text: `*${title}*\n${message}`
        });
      } else if (wh.template === 'homey') {
        // Flat structure optimized for Homey Flow tags
        payload = JSON.stringify({
          event: eventType,
          title,
          message,
          printer_name: data?.printerName || '',
          printer_id: data?.printerId || '',
          file_name: data?.filename || '',
          progress: data?.progress ?? 0,
          status: data?.status || eventType,
          timestamp: new Date().toISOString()
        });
      } else {
        payload = JSON.stringify({
          event: eventType, title, message,
          timestamp: new Date().toISOString(),
          data: data || {}
        });
      }

      const deliveryId = addWebhookDelivery({ webhook_id: wh.id, event_type: eventType, payload, status: 'pending' });
      _dispatchWebhook(wh, payload, deliveryId).catch(e => log.warn('Webhook dispatch failed', e.message));
    }
  } catch (e) {
    log.error('Webhook dispatch error: ' + e.message);
  }
}
