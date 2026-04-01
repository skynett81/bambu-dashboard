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

    // Get existing history to avoid duplicates
    // Match by started_at timestamp (within 5 min window) to handle filename variations
    const existing = getHistory(200, 0, printerId);
    const existingTimes = existing.map(h => h.started_at ? new Date(h.started_at).getTime() : 0).filter(t => t > 0);
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

      // Dedup check — match by key OR by start time within 5 min window
      const dedupKey = `${startTime}_${modelName}`;
      const startMs = startTime ? new Date(startTime).getTime() : 0;
      const timeMatch = startMs > 0 && existingTimes.some(t => Math.abs(t - startMs) < 300000);
      if (existingKeys.has(dedupKey) || timeMatch) {
        skipped++;
        continue;
      }

      // Parse filament info from metadata
      const filamentTypes = (meta.filament_type || '').split(';').filter(Boolean);
      const filamentColors = (meta.filament_colour || '').split(';').filter(Boolean);
      const filamentWeights = meta.filament_weight || [];
      const totalWeightG = meta.filament_weight_total || (filamentWeights.length > 0 ? filamentWeights.reduce((a, b) => a + b, 0) : null);
      const filamentUsedMm = job.filament_used || meta.filament_total || 0;

      // Download thumbnail if available
      const thumbPath = meta.thumbnails?.find(t => t.width >= 200)?.relative_path
        || meta.thumbnails?.[0]?.relative_path || null;
      let thumbnailData = null;
      if (thumbPath) {
        try {
          const thumbRes = await fetch(`${baseUrl}/server/files/gcodes/${encodeURIComponent(thumbPath)}`, {
            headers, signal: AbortSignal.timeout(5000)
          });
          if (thumbRes.ok) {
            thumbnailData = Buffer.from(await thumbRes.arrayBuffer());
          }
        } catch { /* skip thumbnail */ }
      }

      // Colors: semicolon-separated hex for multi-color display
      const allColors = filamentColors.map(c => c.replace('#', '')).join(';');
      // Type: use unique primary type (not "PLA;PLA;PLA;PLA")
      const uniqueTypes = [...new Set(filamentTypes)];
      const primaryType = uniqueTypes.join(' + ') || null; // "PLA" or "PLA + PETG"
      // Brand: from filament_name metadata
      const filamentNames = (meta.filament_name || '').split(';').map(s => s.replace(/"/g, '').trim()).filter(Boolean);
      const primaryBrand = filamentNames[0] || null;

      // Build descriptive notes with per-color details
      const colorDetails = filamentColors.map((c, i) => {
        const w = filamentWeights[i] ? `${filamentWeights[i].toFixed(1)}g` : '';
        const name = filamentNames[i] || filamentTypes[i] || 'PLA';
        return `T${i}: ${name} #${c.replace('#','')} ${w}`.trim();
      });
      const slicerInfo = meta.slicer ? `Slicer: ${meta.slicer} ${meta.slicer_version || ''}` : '';

      try {
        const histId = addHistory({
          printer_id: printerId,
          filename: modelName,
          model_name: modelName,
          status,
          started_at: startTime,
          finished_at: endTime,
          duration_seconds: durationSeconds,
          filament_type: primaryType,
          filament_color: allColors || null,
          filament_brand: primaryBrand,
          filament_used_g: totalWeightG,
          color_changes: filamentTypes.length > 1 ? filamentTypes.length - 1 : 0,
          layer_count: meta.layer_count || null,
          nozzle_diameter: meta.nozzle_diameter || null,
          bed_target: meta.first_layer_bed_temp || null,
          nozzle_target: meta.first_layer_extr_temp || null,
          gcode_file: job.filename || null,
          notes: [slicerInfo, ...colorDetails].filter(Boolean).join(' | '),
        });

        // Save thumbnail to history-thumbnails directory
        if (thumbnailData && histId) {
          try {
            const { writeFileSync, mkdirSync } = await import('node:fs');
            const { join } = await import('node:path');
            const thumbDir = join(process.cwd(), 'data', 'history-thumbnails');
            try { mkdirSync(thumbDir, { recursive: true }); } catch {}
            writeFileSync(join(thumbDir, `${histId}.png`), thumbnailData);
            log.info(`Thumbnail saved for print #${histId}`);
          } catch { /* not critical */ }
        }
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
