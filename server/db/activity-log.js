import { getDb } from './connection.js';
import { createLogger } from '../logger.js';

const log = createLogger('db:activity-log');

/**
 * Query a table safely — returns [] if the table does not exist.
 */
function safeQuery(db, sql, params = []) {
  try {
    return db.prepare(sql).all(...params);
  } catch (err) {
    if (err.message && err.message.includes('no such table')) {
      return [];
    }
    log.warn('activity-log query failed: %s', err.message);
    return [];
  }
}

/**
 * Get a merged, time-sorted activity log from multiple tables.
 * @param {number} limit - Max entries to return (default 200)
 * @param {string|null} printerId - Optional printer filter
 * @returns {Array<{type: string, timestamp: string, printer_id: string|null, message: string, details: object|null}>}
 */
export function getActivityLog(limit = 200, printerId = null) {
  const db = getDb();
  const perTable = Math.max(50, Math.ceil(limit * 1.5));
  const entries = [];

  // ── Print history ──
  const phWhere = printerId ? 'WHERE printer_id = ?' : '';
  const phParams = printerId ? [printerId, perTable] : [perTable];
  const prints = safeQuery(db,
    `SELECT id, printer_id, filename, status, started_at, finished_at, filament_used_g
     FROM print_history ${phWhere} ORDER BY started_at DESC LIMIT ?`,
    phParams
  );
  for (const p of prints) {
    const ts = p.finished_at || p.started_at;
    const filament = p.filament_used_g ? Math.round(p.filament_used_g) : null;
    let message;
    let subtype;
    if (p.status === 'completed') {
      message = `Print completed: ${p.filename || '?'}` + (filament ? ` (${filament}g)` : '');
      subtype = 'completed';
    } else if (p.status === 'failed') {
      message = `Print failed: ${p.filename || '?'}`;
      subtype = 'failed';
    } else if (p.status === 'cancelled') {
      message = `Print cancelled: ${p.filename || '?'}`;
      subtype = 'failed';
    } else {
      message = `Print started: ${p.filename || '?'}`;
      subtype = 'started';
    }
    entries.push({
      type: 'print',
      subtype,
      timestamp: ts,
      printer_id: p.printer_id,
      message,
      details: { filename: p.filename, status: p.status, filament_g: filament }
    });
  }

  // ── Error log ──
  const elWhere = printerId ? 'WHERE printer_id = ?' : '';
  const elParams = printerId ? [printerId, perTable] : [perTable];
  const errors = safeQuery(db,
    `SELECT id, printer_id, timestamp, code, message, severity
     FROM error_log ${elWhere} ORDER BY timestamp DESC LIMIT ?`,
    elParams
  );
  for (const e of errors) {
    entries.push({
      type: 'error',
      subtype: e.severity || 'error',
      timestamp: e.timestamp,
      printer_id: e.printer_id,
      message: e.message || `Error ${e.code || ''}`,
      details: { code: e.code, severity: e.severity }
    });
  }

  // ── Maintenance log ──
  const mlWhere = printerId ? 'WHERE printer_id = ?' : '';
  const mlParams = printerId ? [printerId, perTable] : [perTable];
  const maint = safeQuery(db,
    `SELECT id, printer_id, component, action, timestamp, notes
     FROM maintenance_log ${mlWhere} ORDER BY timestamp DESC LIMIT ?`,
    mlParams
  );
  for (const m of maint) {
    entries.push({
      type: 'maintenance',
      subtype: 'maintenance',
      timestamp: m.timestamp,
      printer_id: m.printer_id,
      message: `Maintenance: ${m.action || ''} ${m.component || ''}`.trim(),
      details: { component: m.component, action: m.action, notes: m.notes }
    });
  }

  // ── Notification log ──
  const nlWhere = printerId ? 'WHERE printer_id = ?' : '';
  const nlParams = printerId ? [printerId, perTable] : [perTable];
  const notifs = safeQuery(db,
    `SELECT id, printer_id, timestamp, event_type, channel, title, message
     FROM notification_log ${nlWhere} ORDER BY timestamp DESC LIMIT ?`,
    nlParams
  );
  for (const n of notifs) {
    entries.push({
      type: 'notification',
      subtype: 'notification',
      timestamp: n.timestamp,
      printer_id: n.printer_id,
      message: `Notification sent: ${n.channel || '?'}`,
      details: { channel: n.channel, event_type: n.event_type, title: n.title }
    });
  }

  // ── Protection log ──
  const plWhere = printerId ? 'WHERE printer_id = ?' : '';
  const plParams = printerId ? [printerId, perTable] : [perTable];
  const protections = safeQuery(db,
    `SELECT id, printer_id, timestamp, event_type, action_taken, notes
     FROM protection_log ${plWhere} ORDER BY timestamp DESC LIMIT ?`,
    plParams
  );
  for (const p of protections) {
    entries.push({
      type: 'protection',
      subtype: 'protection',
      timestamp: p.timestamp,
      printer_id: p.printer_id,
      message: `Print Guard: ${p.event_type || p.notes || '?'}`,
      details: { event_type: p.event_type, action_taken: p.action_taken, notes: p.notes }
    });
  }

  // ── Spool usage log (join with spools for name) ──
  const suWhere = printerId ? 'WHERE sul.printer_id = ?' : '';
  const suParams = printerId ? [printerId, perTable] : [perTable];
  const spoolUsage = safeQuery(db,
    `SELECT sul.id, sul.printer_id, sul.used_weight_g, sul.timestamp, sul.source,
            fp.name AS spool_name
     FROM spool_usage_log sul
     LEFT JOIN spools s ON s.id = sul.spool_id
     LEFT JOIN filament_profiles fp ON fp.id = s.filament_profile_id
     ${suWhere} ORDER BY sul.timestamp DESC LIMIT ?`,
    suParams
  );
  for (const s of spoolUsage) {
    const weight = s.used_weight_g ? Math.round(s.used_weight_g * 10) / 10 : 0;
    const name = s.spool_name || '';
    entries.push({
      type: 'spool',
      subtype: 'spool',
      timestamp: s.timestamp,
      printer_id: s.printer_id,
      message: `Filament used: ${weight}g` + (name ? ` (${name})` : ''),
      details: { weight_g: weight, spool_name: name, source: s.source }
    });
  }

  // ── Xcam events ──
  const xcWhere = printerId ? 'WHERE printer_id = ?' : '';
  const xcParams = printerId ? [printerId, perTable] : [perTable];
  const xcam = safeQuery(db,
    `SELECT id, printer_id, timestamp, event_type
     FROM xcam_events ${xcWhere} ORDER BY timestamp DESC LIMIT ?`,
    xcParams
  );
  for (const x of xcam) {
    entries.push({
      type: 'xcam',
      subtype: 'xcam',
      timestamp: x.timestamp,
      printer_id: x.printer_id,
      message: `Camera: ${x.event_type || '?'}`,
      details: { event_type: x.event_type }
    });
  }

  // ── Queue log ──
  const qlParams = printerId ? [printerId, perTable] : [perTable];
  const qlWhere = printerId ? 'WHERE printer_id = ?' : '';
  const queueLogs = safeQuery(db,
    `SELECT id, printer_id, timestamp, event, details
     FROM queue_log ${qlWhere} ORDER BY timestamp DESC LIMIT ?`,
    qlParams
  );
  for (const q of queueLogs) {
    entries.push({
      type: 'queue',
      subtype: 'queue',
      timestamp: q.timestamp,
      printer_id: q.printer_id,
      message: `Queue: ${q.event || '?'}`,
      details: { event: q.event, info: q.details }
    });
  }

  // Sort all entries by timestamp DESC
  entries.sort((a, b) => {
    const ta = a.timestamp || '';
    const tb = b.timestamp || '';
    return tb.localeCompare(ta);
  });

  // Return limited result
  return entries.slice(0, limit);
}
