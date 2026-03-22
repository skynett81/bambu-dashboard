import { getDb } from './connection.js';
import { createLogger } from '../logger.js';

const log = createLogger('db:ecommerce');

// ---- E-Commerce Configs ----

export function getEcommerceConfigs() {
  const db = getDb();
  return db.prepare('SELECT * FROM ecommerce_configs ORDER BY created_at DESC').all();
}

export function getEcommerceConfig(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM ecommerce_configs WHERE id = ?').get(id) || null;
}

export function addEcommerceConfig(c) {
  const db = getDb();
  const result = db.prepare('INSERT INTO ecommerce_configs (platform, name, webhook_secret, api_url, api_key, auto_queue, target_queue_id, sku_to_file_mapping, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(c.platform || 'custom', c.name, c.webhook_secret || null, c.api_url || null, c.api_key || null, c.auto_queue ? 1 : 0, c.target_queue_id || null, JSON.stringify(c.sku_to_file_mapping || {}), c.active !== false ? 1 : 0);
  return Number(result.lastInsertRowid);
}

export function updateEcommerceConfig(id, c) {
  const db = getDb();
  const fields = [];
  const values = [];
  for (const key of ['platform', 'name', 'webhook_secret', 'api_url', 'api_key', 'active']) {
    if (c[key] !== undefined) { fields.push(`${key} = ?`); values.push(key === 'active' ? (c[key] ? 1 : 0) : c[key]); }
  }
  if (c.auto_queue !== undefined) { fields.push('auto_queue = ?'); values.push(c.auto_queue ? 1 : 0); }
  if (c.target_queue_id !== undefined) { fields.push('target_queue_id = ?'); values.push(c.target_queue_id); }
  if (c.sku_to_file_mapping !== undefined) { fields.push('sku_to_file_mapping = ?'); values.push(JSON.stringify(c.sku_to_file_mapping)); }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE ecommerce_configs SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteEcommerceConfig(id) {
  const db = getDb();
  db.prepare('DELETE FROM ecommerce_orders WHERE config_id = ?').run(id);
  db.prepare('DELETE FROM ecommerce_configs WHERE id = ?').run(id);
}

// ---- E-Commerce Orders ----

export function getEcommerceOrders(configId = null, limit = 50) {
  const db = getDb();
  if (configId) {
    return db.prepare('SELECT * FROM ecommerce_orders WHERE config_id = ? ORDER BY received_at DESC LIMIT ?').all(configId, limit);
  }
  return db.prepare('SELECT * FROM ecommerce_orders ORDER BY received_at DESC LIMIT ?').all(limit);
}

export function getEcommerceOrder(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM ecommerce_orders WHERE id = ?').get(id) || null;
}

export function addEcommerceOrder(o) {
  const db = getDb();
  const result = db.prepare('INSERT INTO ecommerce_orders (config_id, order_id, platform_order_id, customer_name, items, status, queue_item_ids) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(o.config_id, o.order_id || null, o.platform_order_id || null, o.customer_name || null, JSON.stringify(o.items || []), o.status || 'received', JSON.stringify(o.queue_item_ids || []));
  return Number(result.lastInsertRowid);
}

export function updateEcommerceOrder(id, updates) {
  const db = getDb();
  const fields = [];
  const values = [];
  for (const key of ['status', 'customer_name', 'fulfilled_at']) {
    if (updates[key] !== undefined) { fields.push(`${key} = ?`); values.push(updates[key]); }
  }
  if (updates.queue_item_ids !== undefined) { fields.push('queue_item_ids = ?'); values.push(JSON.stringify(updates.queue_item_ids)); }
  if (updates.items !== undefined) { fields.push('items = ?'); values.push(JSON.stringify(updates.items)); }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE ecommerce_orders SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

// ---- E-Commerce License ----

export function getEcomLicense() {
  const db = getDb();
  return db.prepare('SELECT * FROM ecom_license WHERE id = 1').get() || null;
}

export function setEcomLicense(data) {
  const db = getDb();
  const row = getEcomLicense();
  if (!row) return;
  const fields = [];
  const values = [];
  for (const key of ['license_key', 'geektech_email', 'geektech_api_url', 'instance_id', 'status', 'holder_name', 'plan', 'features', 'expires_at', 'last_validated', 'cached_response', 'last_report_at', 'domain', 'phone', 'max_printers', 'pin_code', 'is_pinned', 'notes', 'attachments', 'license_type', 'allowed_ips', 'allowed_macs', 'verify_count']) {
    if (data[key] !== undefined) { fields.push(`${key} = ?`); values.push(data[key]); }
  }
  if (fields.length === 0) return;
  values.push(1);
  db.prepare(`UPDATE ecom_license SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

// ---- E-Commerce Fees ----

export function getEcomFees(reported = null) {
  const db = getDb();
  if (reported !== null) {
    return db.prepare('SELECT * FROM ecom_fees WHERE reported = ? ORDER BY created_at DESC').all(reported);
  }
  return db.prepare('SELECT * FROM ecom_fees ORDER BY created_at DESC').all();
}

export function addEcomFee(fee) {
  const db = getDb();
  const result = db.prepare('INSERT INTO ecom_fees (order_id, ecom_config_id, order_total, fee_pct, fee_amount, currency) VALUES (?, ?, ?, ?, ?, ?)').run(
    fee.order_id || null, fee.ecom_config_id || null, fee.order_total, fee.fee_pct || 5.0, fee.fee_amount, fee.currency || 'NOK'
  );
  return Number(result.lastInsertRowid);
}

export function markFeesReported(feeIds) {
  const db = getDb();
  if (!feeIds.length) return;
  const placeholders = feeIds.map(() => '?').join(',');
  db.prepare(`UPDATE ecom_fees SET reported = 1, reported_at = datetime('now') WHERE id IN (${placeholders})`).run(...feeIds);
}

export function getUnreportedFees() {
  const db = getDb();
  return db.prepare('SELECT ef.*, eo.platform_order_id, ec.platform FROM ecom_fees ef LEFT JOIN ecommerce_orders eo ON ef.order_id = eo.id LEFT JOIN ecommerce_configs ec ON ef.ecom_config_id = ec.id WHERE ef.reported = 0 ORDER BY ef.created_at ASC').all();
}

export function getEcomFeesSummary(from = null, to = null) {
  const db = getDb();
  let sql = 'SELECT COUNT(*) as order_count, COALESCE(SUM(fee_amount), 0) as total_fees, COALESCE(SUM(order_total), 0) as total_revenue, currency FROM ecom_fees';
  const params = [];
  if (from && to) {
    sql += ' WHERE created_at >= ? AND created_at <= ?';
    params.push(from, to);
  } else if (from) {
    sql += ' WHERE created_at >= ?';
    params.push(from);
  }
  sql += ' GROUP BY currency';
  return db.prepare(sql).all(...params);
}

export function getEcomFeesTotal() {
  const db = getDb();
  return db.prepare('SELECT COUNT(*) as pending_count, COALESCE(SUM(fee_amount), 0) as pending_total FROM ecom_fees WHERE reported = 0').get();
}
