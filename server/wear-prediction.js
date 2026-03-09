import { getComponentWear, getMaintenanceLog, getPrinters, upsertWearPrediction, getWearPredictions, getAllWearPredictions, addWearAlert, getWearAlerts, acknowledgeWearAlert, getMaintenanceCosts, getTotalMaintenanceCost, addMaintenanceCost } from './database.js';

// Default component lifetimes in hours
const DEFAULT_LIFETIMES = {
  'hardened_steel_nozzle': 800,
  'brass_nozzle': 400,
  'ptfe_tube': 500,
  'linear_rods': 2000,
  'belts': 3000,
  'build_plate': 1000,
  'carbon_rod': 5000,
  'heatbreak': 1500
};

// Map common component names from component_wear / maintenance_log to our keys
function normalizeComponent(name) {
  if (!name) return name;
  const lower = name.toLowerCase().replace(/[\s-]+/g, '_');
  // Direct matches
  if (DEFAULT_LIFETIMES[lower]) return lower;
  // Fuzzy matches
  if (lower.includes('hardened') && lower.includes('nozzle')) return 'hardened_steel_nozzle';
  if (lower.includes('brass') && lower.includes('nozzle')) return 'brass_nozzle';
  if (lower.includes('nozzle') && !lower.includes('heatbreak')) return 'brass_nozzle';
  if (lower.includes('ptfe')) return 'ptfe_tube';
  if (lower.includes('linear') || lower.includes('rod') && !lower.includes('carbon')) return 'linear_rods';
  if (lower.includes('belt')) return 'belts';
  if (lower.includes('build') || lower.includes('plate')) return 'build_plate';
  if (lower.includes('carbon')) return 'carbon_rod';
  if (lower.includes('heatbreak') || lower.includes('heat_break')) return 'heatbreak';
  return lower;
}

export class WearPredictionService {
  constructor(broadcast) {
    this.broadcast = broadcast;
    this._interval = null;
  }

  init() {
    // Recalculate on startup
    try { this.recalculate(); } catch (e) { console.error('[wear-prediction] Init recalculate error:', e.message); }
    // Periodic recalculation every 6 hours
    this._interval = setInterval(() => {
      try { this.recalculate(); } catch (e) { console.error('[wear-prediction] Periodic recalculate error:', e.message); }
    }, 6 * 60 * 60 * 1000);
  }

  shutdown() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }

  // Recalculate predictions for all printers
  recalculate() {
    const printers = getPrinters();
    for (const printer of printers) {
      this.recalculatePrinter(printer.id);
    }
  }

  // Recalculate for one printer
  recalculatePrinter(printerId) {
    const wearData = getComponentWear(printerId);
    const maintenanceLogs = getMaintenanceLog(printerId, 500);

    // Build a map of component → wear info
    const wearMap = {};
    for (const w of wearData) {
      const key = normalizeComponent(w.component);
      wearMap[key] = w;
    }

    // Build replacement history: component → array of intervals (hours between replacements)
    const replacementHistory = {};
    const replacementCounts = {};
    const componentEvents = {};

    for (const log of maintenanceLogs) {
      if (log.action !== 'replaced' && log.action !== 'replace' && log.action !== 'reset') continue;
      const key = normalizeComponent(log.component);
      if (!componentEvents[key]) componentEvents[key] = [];
      componentEvents[key].push(log.timestamp);
    }

    for (const [comp, timestamps] of Object.entries(componentEvents)) {
      replacementCounts[comp] = timestamps.length;
      if (timestamps.length >= 2) {
        // Sort oldest first
        const sorted = [...timestamps].sort();
        const intervals = [];
        for (let i = 1; i < sorted.length; i++) {
          const diff = (new Date(sorted[i]) - new Date(sorted[i - 1])) / (1000 * 3600);
          if (diff > 0) intervals.push(diff);
        }
        if (intervals.length > 0) {
          replacementHistory[comp] = intervals;
        }
      }
    }

    // Calculate predictions for each known component
    const allComponents = new Set([
      ...Object.keys(DEFAULT_LIFETIMES),
      ...Object.keys(wearMap)
    ]);

    for (const comp of allComponents) {
      const wear = wearMap[comp];
      const currentHours = wear ? (wear.total_hours || 0) : 0;
      const currentCycles = wear ? (wear.total_cycles || 0) : 0;

      // Determine max lifetime
      let maxLifetime;
      let sampleSize = 0;

      if (replacementHistory[comp] && replacementHistory[comp].length > 0) {
        // Use average replacement interval
        const intervals = replacementHistory[comp];
        maxLifetime = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        sampleSize = intervals.length + 1; // intervals + 1 = number of replacements
      } else {
        maxLifetime = DEFAULT_LIFETIMES[comp] || 1000;
        sampleSize = replacementCounts[comp] || 0;
      }

      const hoursRemaining = Math.max(0, maxLifetime - currentHours);
      const percentUsed = maxLifetime > 0 ? Math.min(100, (currentHours / maxLifetime) * 100) : 0;

      // Confidence: min(1.0, sample_size / 3)
      const confidence = Math.min(1.0, sampleSize / 3);

      // Predict failure date based on remaining hours
      // Estimate average print hours per day from history
      let predictedDate = null;
      if (hoursRemaining > 0) {
        // Rough estimate: assume ~4 hours printing per day
        const daysRemaining = hoursRemaining / 4;
        const d = new Date();
        d.setDate(d.getDate() + daysRemaining);
        predictedDate = d.toISOString();
      }

      upsertWearPrediction({
        printer_id: printerId,
        component: comp,
        predicted_failure_at: predictedDate,
        confidence: Math.round(confidence * 100) / 100,
        hours_remaining: Math.round(hoursRemaining * 10) / 10,
        cycles_remaining: null,
        based_on_hours: Math.round(currentHours * 10) / 10,
        based_on_cycles: currentCycles || null
      });

      // Generate alerts
      if (percentUsed >= 95) {
        this._maybeAlert(printerId, comp, 'critical', `${comp} is at ${Math.round(percentUsed)}% wear — replacement urgently needed`);
      } else if (percentUsed >= 90) {
        this._maybeAlert(printerId, comp, 'warning', `${comp} is at ${Math.round(percentUsed)}% wear — plan replacement soon`);
      }
    }

    // Broadcast update
    if (this.broadcast) {
      try {
        this.broadcast('wear_prediction_update', { printer_id: printerId });
      } catch {}
    }
  }

  _maybeAlert(printerId, component, alertType, message) {
    // Check if there's already an unacknowledged alert for this component/type
    const existing = getWearAlerts(printerId);
    const has = existing.find(a => a.component === component && a.alert_type === alertType && !a.acknowledged);
    if (has) return;

    addWearAlert({ printer_id: printerId, component, alert_type: alertType, message });

    if (this.broadcast) {
      try {
        this.broadcast('wear_alert', { printer_id: printerId, component, alert_type: alertType, message });
      } catch {}
    }
  }

  // Called after each print ends
  onPrintEnd(printerId, printData) {
    try {
      this.recalculatePrinter(printerId);
    } catch (e) {
      console.error('[wear-prediction] onPrintEnd error:', e.message);
    }
  }

  // Get predictions
  getPredictions(printerId) {
    if (printerId) return getWearPredictions(printerId);
    return getAllWearPredictions();
  }

  // Get alerts
  getAlerts(printerId) {
    return getWearAlerts(printerId || null);
  }
}
