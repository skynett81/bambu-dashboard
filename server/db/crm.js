import { getDb } from './connection.js';
import { createLogger } from '../logger.js';

const log = createLogger('db:crm');

// ---- Customers ----

export function getCrmCustomers(search = null, limit = 50, offset = 0) {
  const db = getDb();
  if (search) {
    return db.prepare(
      `SELECT * FROM crm_customers WHERE archived = 0
       AND (name LIKE ? OR email LIKE ? OR company LIKE ? OR phone LIKE ?)
       ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, limit, offset);
  }
  return db.prepare(
    'SELECT * FROM crm_customers WHERE archived = 0 ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(limit, offset);
}

export function getCrmCustomer(id) {
  const db = getDb();
  const customer = db.prepare('SELECT * FROM crm_customers WHERE id = ?').get(id);
  if (!customer) return null;
  const orderCount = db.prepare(
    'SELECT COUNT(*) as count FROM crm_orders WHERE customer_id = ?'
  ).get(id);
  return { ...customer, order_count: orderCount?.count || 0 };
}

export function createCrmCustomer(data) {
  const db = getDb();
  const result = db.prepare(
    `INSERT INTO crm_customers (name, email, phone, company, address, city, postal_code, country, notes, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    data.name,
    data.email || null,
    data.phone || null,
    data.company || null,
    data.address || null,
    data.city || null,
    data.postal_code || null,
    data.country || null,
    data.notes || null,
    data.tags ? JSON.stringify(data.tags) : null
  );
  return Number(result.lastInsertRowid);
}

export function updateCrmCustomer(id, data) {
  const db = getDb();
  const fields = [];
  const values = [];
  const allowed = ['name', 'email', 'phone', 'company', 'address', 'city', 'postal_code', 'country', 'notes'];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }
  if (data.tags !== undefined) {
    fields.push('tags = ?');
    values.push(JSON.stringify(data.tags));
  }
  if (fields.length === 0) return;
  fields.push("updated_at = datetime('now')");
  values.push(id);
  db.prepare(`UPDATE crm_customers SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteCrmCustomer(id) {
  const db = getDb();
  db.prepare("UPDATE crm_customers SET archived = 1, updated_at = datetime('now') WHERE id = ?").run(id);
}

// ---- Orders ----

function generateOrderNumber() {
  const db = getDb();
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `ORD-${dateStr}-`;
  const last = db.prepare(
    "SELECT order_number FROM crm_orders WHERE order_number LIKE ? ORDER BY id DESC LIMIT 1"
  ).get(`${prefix}%`);
  let seq = 1;
  if (last) {
    const parts = last.order_number.split('-');
    seq = parseInt(parts[2], 10) + 1;
  }
  return `${prefix}${String(seq).padStart(3, '0')}`;
}

export function getCrmOrders(filters = {}) {
  const db = getDb();
  const conditions = [];
  const params = [];
  if (filters.status) {
    conditions.push('o.status = ?');
    params.push(filters.status);
  }
  if (filters.customer_id) {
    conditions.push('o.customer_id = ?');
    params.push(filters.customer_id);
  }
  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  params.push(limit, offset);
  return db.prepare(
    `SELECT o.*, c.name as customer_name, c.email as customer_email
     FROM crm_orders o
     LEFT JOIN crm_customers c ON o.customer_id = c.id
     ${where}
     ORDER BY o.created_at DESC LIMIT ? OFFSET ?`
  ).all(...params);
}

export function getCrmOrder(id) {
  const db = getDb();
  const order = db.prepare(
    `SELECT o.*, c.name as customer_name, c.email as customer_email, c.company as customer_company
     FROM crm_orders o
     LEFT JOIN crm_customers c ON o.customer_id = c.id
     WHERE o.id = ?`
  ).get(id);
  if (!order) return null;
  const items = db.prepare('SELECT * FROM crm_order_items WHERE order_id = ?').all(id);
  return { ...order, items };
}

export function createCrmOrder(data) {
  const db = getDb();
  const orderNumber = generateOrderNumber();
  const result = db.prepare(
    `INSERT INTO crm_orders (customer_id, order_number, status, notes, due_date, assigned_printer_id, shipping_method, currency, discount_pct, tax_pct)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    data.customer_id || null,
    orderNumber,
    data.status || 'draft',
    data.notes || null,
    data.due_date || null,
    data.assigned_printer_id || null,
    data.shipping_method || null,
    data.currency || 'NOK',
    data.discount_pct || 0,
    data.tax_pct || 0
  );
  const orderId = Number(result.lastInsertRowid);

  // Update customer order count
  if (data.customer_id) {
    db.prepare(
      'UPDATE crm_customers SET total_orders = total_orders + 1 WHERE id = ?'
    ).run(data.customer_id);
  }

  return { id: orderId, order_number: orderNumber };
}

export function updateCrmOrder(id, data) {
  const db = getDb();
  const fields = [];
  const values = [];
  const allowed = ['customer_id', 'status', 'notes', 'due_date', 'assigned_printer_id', 'shipping_method', 'tracking_number', 'currency', 'discount_pct', 'tax_pct'];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }
  if (fields.length === 0) return;
  fields.push("updated_at = datetime('now')");
  values.push(id);
  db.prepare(`UPDATE crm_orders SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  // Recalculate if discount/tax changed
  if (data.discount_pct !== undefined || data.tax_pct !== undefined) {
    recalculateCrmOrderTotal(id);
  }
}

export function updateCrmOrderStatus(id, status) {
  const db = getDb();
  const validStatuses = ['draft', 'confirmed', 'in_progress', 'printing', 'completed', 'shipped', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}. Valid: ${validStatuses.join(', ')}`);
  }
  db.prepare(
    "UPDATE crm_orders SET status = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(status, id);
}

export function createCrmOrderFromHistory(printHistoryId, customerId) {
  const db = getDb();
  const print = db.prepare('SELECT * FROM print_history WHERE id = ?').get(printHistoryId);
  if (!print) throw new Error('Print history not found');

  const costs = db.prepare('SELECT * FROM print_costs WHERE print_history_id = ?').get(printHistoryId);

  const order = createCrmOrder({
    customer_id: customerId,
    status: 'draft',
    notes: `Created from print history #${printHistoryId}`
  });

  const durationMin = print.duration_seconds
    ? Math.round(print.duration_seconds / 60)
    : null;

  addCrmOrderItem(order.id, {
    description: print.filename || 'Print job',
    filename: print.filename || null,
    quantity: 1,
    filament_type: print.filament_type || null,
    filament_color: print.filament_color || null,
    filament_weight_g: print.filament_used_g || null,
    estimated_time_min: durationMin,
    material_cost: costs?.filament_cost || 0,
    electricity_cost: costs?.electricity_cost || 0,
    wear_cost: costs?.depreciation_cost || 0,
    labor_cost: costs?.labor_cost || 0,
    print_history_id: printHistoryId
  });

  return order;
}

// ---- Order Items ----

export function addCrmOrderItem(orderId, item) {
  const db = getDb();
  const itemCost = (item.material_cost || 0) + (item.labor_cost || 0) +
    (item.electricity_cost || 0) + (item.wear_cost || 0);
  const markupMultiplier = 1 + ((item.markup_pct || 0) / 100);
  const totalCost = itemCost * markupMultiplier * (item.quantity || 1);

  const result = db.prepare(
    `INSERT INTO crm_order_items (order_id, description, filename, file_hash, quantity, filament_type,
     filament_color, filament_weight_g, estimated_time_min, material_cost, labor_cost,
     electricity_cost, wear_cost, markup_pct, item_cost, total_cost, print_history_id, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    orderId,
    item.description || null,
    item.filename || null,
    item.file_hash || null,
    item.quantity || 1,
    item.filament_type || null,
    item.filament_color || null,
    item.filament_weight_g || null,
    item.estimated_time_min || null,
    item.material_cost || 0,
    item.labor_cost || 0,
    item.electricity_cost || 0,
    item.wear_cost || 0,
    item.markup_pct || 0,
    itemCost,
    totalCost,
    item.print_history_id || null,
    item.status || 'pending',
    item.notes || null
  );

  recalculateCrmOrderTotal(orderId);
  return Number(result.lastInsertRowid);
}

export function updateCrmOrderItem(itemId, data) {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM crm_order_items WHERE id = ?').get(itemId);
  if (!existing) throw new Error('Order item not found');

  const fields = [];
  const values = [];
  const allowed = ['description', 'filename', 'file_hash', 'quantity', 'filament_type',
    'filament_color', 'filament_weight_g', 'estimated_time_min', 'material_cost',
    'labor_cost', 'electricity_cost', 'wear_cost', 'markup_pct', 'status', 'notes'];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }

  // Recalculate item costs
  const materialCost = data.material_cost !== undefined ? data.material_cost : existing.material_cost;
  const laborCost = data.labor_cost !== undefined ? data.labor_cost : existing.labor_cost;
  const electricityCost = data.electricity_cost !== undefined ? data.electricity_cost : existing.electricity_cost;
  const wearCost = data.wear_cost !== undefined ? data.wear_cost : existing.wear_cost;
  const markupPct = data.markup_pct !== undefined ? data.markup_pct : existing.markup_pct;
  const quantity = data.quantity !== undefined ? data.quantity : existing.quantity;

  const itemCost = materialCost + laborCost + electricityCost + wearCost;
  const totalCost = itemCost * (1 + markupPct / 100) * quantity;

  fields.push('item_cost = ?', 'total_cost = ?');
  values.push(itemCost, totalCost);

  if (fields.length === 0) return;
  values.push(itemId);
  db.prepare(`UPDATE crm_order_items SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  recalculateCrmOrderTotal(existing.order_id);
}

export function removeCrmOrderItem(itemId) {
  const db = getDb();
  const item = db.prepare('SELECT order_id FROM crm_order_items WHERE id = ?').get(itemId);
  if (!item) throw new Error('Order item not found');
  db.prepare('DELETE FROM crm_order_items WHERE id = ?').run(itemId);
  recalculateCrmOrderTotal(item.order_id);
}

export function recalculateCrmOrderTotal(orderId) {
  const db = getDb();
  const items = db.prepare('SELECT total_cost FROM crm_order_items WHERE order_id = ?').all(orderId);
  const subtotal = items.reduce((sum, i) => sum + (i.total_cost || 0), 0);
  const order = db.prepare('SELECT discount_pct, tax_pct FROM crm_orders WHERE id = ?').get(orderId);
  if (!order) return;

  const discountAmount = subtotal * ((order.discount_pct || 0) / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * ((order.tax_pct || 0) / 100);
  const totalCost = afterDiscount + taxAmount;

  db.prepare(
    "UPDATE crm_orders SET subtotal = ?, total_cost = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(subtotal, totalCost, orderId);

  // Update customer revenue
  const orderData = db.prepare('SELECT customer_id FROM crm_orders WHERE id = ?').get(orderId);
  if (orderData?.customer_id) {
    const revenue = db.prepare(
      "SELECT COALESCE(SUM(total_cost), 0) as total FROM crm_orders WHERE customer_id = ? AND status != 'cancelled'"
    ).get(orderData.customer_id);
    db.prepare('UPDATE crm_customers SET total_revenue = ? WHERE id = ?')
      .run(revenue.total, orderData.customer_id);
  }
}

// ---- Invoices ----

function generateInvoiceNumber() {
  const db = getDb();
  const now = new Date();
  const yearMonth = now.toISOString().slice(0, 7).replace('-', '');
  const prefix = `INV-${yearMonth}-`;
  const last = db.prepare(
    "SELECT invoice_number FROM crm_invoices WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1"
  ).get(`${prefix}%`);
  let seq = 1;
  if (last) {
    const parts = last.invoice_number.split('-');
    seq = parseInt(parts[2], 10) + 1;
  }
  return `${prefix}${String(seq).padStart(3, '0')}`;
}

export function createCrmInvoice(orderId) {
  const db = getDb();
  const order = db.prepare('SELECT * FROM crm_orders WHERE id = ?').get(orderId);
  if (!order) throw new Error('Order not found');

  const invoiceNumber = generateInvoiceNumber();
  const subtotal = order.subtotal || 0;
  const discountAmount = subtotal * ((order.discount_pct || 0) / 100);
  const afterDiscount = subtotal - discountAmount;
  const tax = afterDiscount * ((order.tax_pct || 0) / 100);
  const total = afterDiscount + tax;

  const result = db.prepare(
    `INSERT INTO crm_invoices (order_id, invoice_number, status, subtotal, tax, total, currency, due_date, notes)
     VALUES (?, ?, 'draft', ?, ?, ?, ?, ?, ?)`
  ).run(
    orderId,
    invoiceNumber,
    subtotal,
    tax,
    total,
    order.currency || 'NOK',
    order.due_date || null,
    order.notes || null
  );
  return { id: Number(result.lastInsertRowid), invoice_number: invoiceNumber };
}

export function getCrmInvoice(id) {
  const db = getDb();
  const invoice = db.prepare(
    `SELECT i.*, o.order_number, o.customer_id, c.name as customer_name, c.email as customer_email,
     c.company as customer_company, c.address as customer_address, c.city as customer_city,
     c.postal_code as customer_postal_code, c.country as customer_country
     FROM crm_invoices i
     LEFT JOIN crm_orders o ON i.order_id = o.id
     LEFT JOIN crm_customers c ON o.customer_id = c.id
     WHERE i.id = ?`
  ).get(id);
  if (!invoice) return null;
  const items = db.prepare('SELECT * FROM crm_order_items WHERE order_id = ?').all(invoice.order_id);
  return { ...invoice, items };
}

export function getCrmInvoices(limit = 50, offset = 0) {
  const db = getDb();
  return db.prepare(
    `SELECT i.*, o.order_number, c.name as customer_name
     FROM crm_invoices i
     LEFT JOIN crm_orders o ON i.order_id = o.id
     LEFT JOIN crm_customers c ON o.customer_id = c.id
     ORDER BY i.created_at DESC LIMIT ? OFFSET ?`
  ).all(limit, offset);
}

export function updateCrmInvoiceStatus(id, status) {
  const db = getDb();
  const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid invoice status: ${status}. Valid: ${validStatuses.join(', ')}`);
  }
  const updates = { status };
  if (status === 'sent') updates.sent_at = new Date().toISOString();
  if (status === 'paid') updates.paid_at = new Date().toISOString();

  const fields = Object.keys(updates).map(k => `${k} = ?`);
  const values = Object.values(updates);
  values.push(id);
  db.prepare(`UPDATE crm_invoices SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

// ---- Dashboard ----

export function getCrmDashboard() {
  const db = getDb();
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM crm_orders').get();
  const totalRevenue = db.prepare(
    "SELECT COALESCE(SUM(total_cost), 0) as total FROM crm_orders WHERE status NOT IN ('cancelled', 'draft')"
  ).get();
  const pendingOrders = db.prepare(
    "SELECT COUNT(*) as count FROM crm_orders WHERE status IN ('draft', 'confirmed', 'in_progress', 'printing')"
  ).get();
  const totalCustomers = db.prepare('SELECT COUNT(*) as count FROM crm_customers WHERE archived = 0').get();
  const recentOrders = db.prepare(
    `SELECT o.*, c.name as customer_name
     FROM crm_orders o
     LEFT JOIN crm_customers c ON o.customer_id = c.id
     ORDER BY o.created_at DESC LIMIT 10`
  ).all();
  const unpaidInvoices = db.prepare(
    "SELECT COUNT(*) as count FROM crm_invoices WHERE status IN ('draft', 'sent', 'overdue')"
  ).get();

  // Revenue this month
  const now = new Date();
  const monthStart = now.toISOString().slice(0, 7) + '-01';
  const revenueThisMonth = db.prepare(
    "SELECT COALESCE(SUM(total_cost), 0) as total FROM crm_orders WHERE status NOT IN ('cancelled', 'draft') AND created_at >= ?"
  ).get(monthStart);

  // Revenue trend — last 6 months
  const revenueChart = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = d.toISOString().slice(0, 7) + '-01';
    const endD = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const end = endD.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('nb-NO', { month: 'short', year: '2-digit' });
    const row = db.prepare(
      "SELECT COALESCE(SUM(total_cost), 0) as revenue FROM crm_orders WHERE status NOT IN ('cancelled', 'draft') AND created_at >= ? AND created_at < ?"
    ).get(start, end);
    revenueChart.push({ month: label, revenue: row.revenue });
  }

  // Orders by status breakdown
  const ordersByStatus = db.prepare(
    'SELECT status, COUNT(*) as count FROM crm_orders GROUP BY status'
  ).all();

  // Top 5 customers by revenue
  const topCustomers = db.prepare(
    `SELECT c.id, c.name, c.company, COALESCE(SUM(o.total_cost), 0) as revenue, COUNT(o.id) as order_count
     FROM crm_customers c
     JOIN crm_orders o ON o.customer_id = c.id AND o.status NOT IN ('cancelled', 'draft')
     WHERE c.archived = 0
     GROUP BY c.id
     ORDER BY revenue DESC
     LIMIT 5`
  ).all();

  // Recent activity — last 10 orders + invoices combined
  const recentActivity = db.prepare(
    `SELECT 'order' as type, o.id, o.order_number as ref_number, o.status, o.total_cost as amount, o.created_at, c.name as customer_name
     FROM crm_orders o LEFT JOIN crm_customers c ON o.customer_id = c.id
     UNION ALL
     SELECT 'invoice' as type, i.id, i.invoice_number as ref_number, i.status, i.total as amount, i.created_at, c.name as customer_name
     FROM crm_invoices i LEFT JOIN crm_orders o ON i.order_id = o.id LEFT JOIN crm_customers c ON o.customer_id = c.id
     ORDER BY created_at DESC LIMIT 10`
  ).all();

  return {
    total_orders: totalOrders.count,
    total_revenue: totalRevenue.total,
    revenue_this_month: revenueThisMonth.total,
    pending_orders: pendingOrders.count,
    total_customers: totalCustomers.count,
    unpaid_invoices: unpaidInvoices.count,
    recent_orders: recentOrders,
    revenue_chart: revenueChart,
    orders_by_status: ordersByStatus,
    top_customers: topCustomers,
    recent_activity: recentActivity
  };
}

// ---- CRM Settings ----

const CRM_SETTINGS_KEYS = [
  'crm_company_name', 'crm_company_address', 'crm_company_city',
  'crm_company_postal', 'crm_company_country', 'crm_org_number',
  'crm_company_email', 'crm_company_phone', 'crm_bank_account',
  'crm_payment_terms_days', 'crm_default_tax_pct', 'crm_invoice_footer',
  'crm_logo_url'
];

export function getCrmSettings() {
  const db = getDb();
  const result = {};
  for (const key of CRM_SETTINGS_KEYS) {
    const row = db.prepare('SELECT value FROM inventory_settings WHERE key = ?').get(key);
    result[key] = row ? row.value : '';
  }
  return result;
}

export function updateCrmSettings(settings) {
  const db = getDb();
  const stmt = db.prepare('INSERT OR REPLACE INTO inventory_settings (key, value) VALUES (?, ?)');
  const runAll = db.transaction((entries) => {
    for (const [key, value] of entries) {
      if (CRM_SETTINGS_KEYS.includes(key)) {
        stmt.run(key, String(value ?? ''));
      }
    }
  });
  runAll(Object.entries(settings));
}
