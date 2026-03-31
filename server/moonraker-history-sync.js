/**
 * MoonrakerHistorySync — Import print history from Moonraker printers.
 *
 * Fetches /server/history/list and imports completed/failed jobs
 * into 3DPrintForge's print_history table. Runs on startup and
 * periodically to catch new completed prints.
 *
 * Supports: Snapmaker U1, Voron, and all Klipper/Moonraker printers.
 */

import { addHistory, getHistory } from './database.js';
import { createLogger } from './logger.js';

const log = createLogger('moon-hist');

// Map Moonraker job status to our status format
const STATUS_MAP = {
  completed: 'completed',
  cancelled: 'cancelled',
  error: 'failed',
  klippy_shutdown: 'failed',
  klippy_disconnect: 'failed',
  server_exit: 'cancelled',
};

/**
 * Sync print history from a Moonraker printer into the local database.
 * @param {string} printerId - Printer ID in our system
 * @param {string} printerIp - Moonraker host IP
 * @param {string} apiKey - Optional API key
 * @param {number} port - Moonraker port (default 80)
 */
export async function syncMoonrakerHistory(printerId, printerIp, apiKey, port = 80) {
  const baseUrl = `http://${printerIp}:${port}`;
  const headers = apiKey ? { 'X-Api-Key': apiKey } : {};

  try {
    // Fetch recent history (last 50 jobs)
    const res = await fetch(`${baseUrl}/server/history/list?limit=50&order=desc`, {
      headers,
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) {
      log.warn(`History-henting feilet for ${printerId}: HTTP ${res.status}`);
      return { imported: 0, skipped: 0, error: null };
    }

    const data = await res.json();
    const jobs = data.result?.jobs || [];
    if (jobs.length === 0) return { imported: 0, skipped: 0, error: null };

    // Get existing history to avoid duplicates (check by started_at + filename)
    const existing = getHistory(200, 0, printerId);
    const existingKeys = new Set(existing.map(h => `${h.started_at}_${h.filename}`));

    let imported = 0;
    let skipped = 0;

    for (const job of jobs) {
      const status = STATUS_MAP[job.status];
      if (!status) continue; // Skip in-progress jobs

      const meta = job.metadata || {};
      const startTime = job.start_time ? new Date(job.start_time * 1000).toISOString() : null;
      const endTime = job.end_time ? new Date(job.end_time * 1000).toISOString() : null;
      const durationSeconds = Math.round(job.print_duration || 0);
      const filename = job.filename || 'Unknown';
      const modelName = filename.replace(/\.(gcode|3mf|g)$/i, '').replace(/_/g, ' ');

      // Dedup check
      const dedupKey = `${startTime}_${modelName}`;
      if (existingKeys.has(dedupKey)) {
        skipped++;
        continue;
      }

      // Parse filament info from metadata
      const filamentTypes = (meta.filament_type || '').split(';').filter(Boolean);
      const filamentColors = (meta.filament_colour || '').split(';').filter(Boolean);
      const filamentWeights = meta.filament_weight || [];
      const totalWeightG = meta.filament_weight_total || (filamentWeights.length > 0 ? filamentWeights.reduce((a, b) => a + b, 0) : null);
      const filamentUsedMm = job.filament_used || meta.filament_total || 0;

      // Get thumbnail URL if available
      const thumbnail = meta.thumbnails?.find(t => t.width >= 200)?.relative_path
        || meta.thumbnails?.[0]?.relative_path || null;
      const thumbnailUrl = thumbnail ? `${baseUrl}/server/files/gcodes/${thumbnail}` : null;

      try {
        addHistory({
          printer_id: printerId,
          filename: modelName,
          model_name: modelName,
          status,
          started_at: startTime,
          finished_at: endTime,
          duration_seconds: durationSeconds,
          filament_type: filamentTypes[0] || null,
          filament_color: filamentColors[0]?.replace('#', '') || null,
          filament_used_g: totalWeightG,
          layer_count: meta.layer_count || null,
          nozzle_diameter: meta.nozzle_diameter || null,
          bed_target: meta.first_layer_bed_temp || null,
          nozzle_target: meta.first_layer_extr_temp || null,
          gcode_file: job.filename || null,
          notes: `Imported from Moonraker | Slicer: ${meta.slicer || '?'} ${meta.slicer_version || ''} | ${filamentTypes.length} extruder(s)`.trim(),
        });
        imported++;
      } catch (e) {
        // Duplicate or schema mismatch — skip
        log.warn(`Kunne ikke importere jobb ${job.job_id}: ${e.message}`);
      }
    }

    if (imported > 0) {
      log.info(`${printerId}: importerte ${imported} print(s) fra Moonraker (${skipped} allerede importert)`);
    }
    return { imported, skipped, error: null };
  } catch (e) {
    log.error(`History-sync feilet for ${printerId}: ${e.message}`);
    return { imported: 0, skipped: 0, error: e.message };
  }
}

/**
 * Start periodic history sync for a Moonraker printer.
 * Runs immediately, then every 5 minutes.
 */
export function startHistorySync(printerId, printerIp, apiKey, port = 80) {
  // Initial sync after 10s (let connection settle)
  setTimeout(() => syncMoonrakerHistory(printerId, printerIp, apiKey, port), 10000);

  // Periodic sync every 5 minutes
  const interval = setInterval(() => {
    syncMoonrakerHistory(printerId, printerIp, apiKey, port);
  }, 5 * 60 * 1000);

  return { stop: () => clearInterval(interval) };
}
