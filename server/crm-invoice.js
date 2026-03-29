// CRM Invoice HTML Generator — generates printable HTML invoices
import { createLogger } from './logger.js';

const log = createLogger('crm-invoice');

/**
 * Escape HTML entities to prevent XSS
 */
function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Format a number as currency string
 */
function formatCurrency(val, currency = 'NOK') {
  if (val === null || val === undefined) return '0.00 ' + currency;
  return Number(val).toLocaleString('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + currency;
}

/**
 * Format an ISO date string to a locale-friendly format
 */
function formatDate(iso) {
  if (!iso) return '--';
  const d = new Date(iso);
  return d.toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Generate a complete HTML invoice from order/invoice data.
 *
 * @param {Object} order - The CRM order record
 * @param {Object} customer - Customer info (name, company, address, etc.)
 * @param {Array} items - Line items array
 * @param {Object} invoice - The CRM invoice record
 * @param {Object} companySettings - Company settings from inventory_settings (crm_ prefix)
 * @returns {string} Complete HTML document string
 */
export function generateInvoiceHtml(order, customer, items, invoice, companySettings) {
  if (!invoice) {
    log.error('generateInvoiceHtml called without invoice data');
    return '<html><body><p>Invoice data missing</p></body></html>';
  }

  const settings = companySettings || {};
  const currency = invoice.currency || order?.currency || 'NOK';
  const taxPct = invoice.tax_pct ?? order?.tax_pct ?? 25;
  const discountPct = invoice.discount_pct ?? order?.discount_pct ?? 0;

  const companyName = settings.crm_company_name || '';
  const companyAddress = settings.crm_company_address || '';
  const companyCity = settings.crm_company_city || '';
  const companyPostal = settings.crm_company_postal || '';
  const companyCountry = settings.crm_company_country || '';
  const orgNumber = settings.crm_org_number || '';
  const companyEmail = settings.crm_company_email || '';
  const companyPhone = settings.crm_company_phone || '';
  const bankAccount = settings.crm_bank_account || '';
  const paymentTermsDays = settings.crm_payment_terms_days || '14';
  const invoiceFooter = settings.crm_invoice_footer || '';
  const logoUrl = settings.crm_logo_url || '';

  const customerName = customer?.name || customer?.customer_name || '';
  const customerCompany = customer?.company || customer?.customer_company || '';
  const customerAddress = customer?.address || customer?.customer_address || '';
  const customerCity = customer?.city || customer?.customer_city || '';
  const customerPostal = customer?.postal_code || customer?.customer_postal_code || '';
  const customerCountry = customer?.country || customer?.customer_country || '';
  const customerEmail = customer?.email || customer?.customer_email || '';

  const lineItems = Array.isArray(items) ? items : [];

  const subtotal = invoice.subtotal ?? lineItems.reduce((sum, it) => sum + (it.total_cost || 0), 0);
  const discountAmount = subtotal * (discountPct / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = invoice.tax ?? (afterDiscount * (taxPct / 100));
  const total = invoice.total ?? (afterDiscount + taxAmount);

  const invoiceDate = formatDate(invoice.created_at);
  const dueDate = formatDate(invoice.due_date);

  const companyAddressLine = [companyAddress, companyPostal, companyCity, companyCountry]
    .filter(Boolean).join(', ');
  const customerAddressLine = [customerAddress, customerPostal, customerCity, customerCountry]
    .filter(Boolean).join(', ');

  const logoHtml = logoUrl
    ? `<img src="${esc(logoUrl)}" alt="${esc(companyName)}" style="max-height:60px;max-width:200px;object-fit:contain">`
    : '';

  const itemRows = lineItems.map(item => {
    const qty = item.quantity || 1;
    const unitPrice = item.total_cost ? (item.total_cost / qty) : (item.unit_price || item.item_cost || 0);
    const lineTotal = item.total_cost || (unitPrice * qty);
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${esc(item.description || '--')}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center">${qty}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right">${formatCurrency(unitPrice, currency)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right">${formatCurrency(lineTotal, currency)}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="nb">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(invoice.invoice_number || 'Faktura')}</title>
  <style>
    @media print {
      body { margin: 0; padding: 0; }
      .no-print { display: none !important; }
      @page { margin: 15mm 20mm; size: A4; }
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1e293b;
      background: #fff;
      margin: 0;
      padding: 20px;
      font-size: 13px;
      line-height: 1.5;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #1e293b;
    }
    .company-info h1 {
      font-size: 22px;
      margin: 0 0 4px 0;
      color: #1e293b;
    }
    .company-info p {
      margin: 2px 0;
      color: #475569;
      font-size: 12px;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-title h2 {
      font-size: 28px;
      margin: 0;
      color: #1e293b;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .invoice-title .invoice-number {
      font-size: 14px;
      color: #475569;
      margin-top: 4px;
    }
    .meta-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      gap: 40px;
    }
    .meta-block {
      flex: 1;
    }
    .meta-block h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #64748b;
      margin: 0 0 8px 0;
      padding-bottom: 4px;
      border-bottom: 1px solid #e2e8f0;
    }
    .meta-block p {
      margin: 2px 0;
      font-size: 13px;
    }
    .meta-block .name {
      font-weight: 600;
      font-size: 14px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .items-table th {
      background: #f1f5f9;
      padding: 10px 12px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
      border-bottom: 2px solid #cbd5e1;
    }
    .items-table th:nth-child(2) { text-align: center; }
    .items-table th:nth-child(3),
    .items-table th:nth-child(4) { text-align: right; }
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }
    .totals-table {
      width: 280px;
    }
    .totals-table tr td {
      padding: 6px 12px;
      font-size: 13px;
    }
    .totals-table tr td:first-child {
      text-align: right;
      color: #64748b;
    }
    .totals-table tr td:last-child {
      text-align: right;
      font-weight: 500;
    }
    .totals-table .total-row td {
      border-top: 2px solid #1e293b;
      font-size: 16px;
      font-weight: 700;
      padding-top: 10px;
      color: #1e293b;
    }
    .payment-section {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 16px 20px;
      margin-bottom: 20px;
    }
    .payment-section h3 {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #475569;
      margin: 0 0 8px 0;
    }
    .payment-section p {
      margin: 3px 0;
      font-size: 13px;
    }
    .payment-section .highlight {
      font-weight: 600;
      color: #1e293b;
    }
    .footer {
      text-align: center;
      color: #94a3b8;
      font-size: 11px;
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e2e8f0;
    }
    .print-btn {
      display: inline-block;
      padding: 10px 24px;
      background: #3b82f6;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      margin-bottom: 20px;
    }
    .print-btn:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="no-print" style="text-align:center;margin-bottom:20px">
      <button class="print-btn" onclick="window.print()">&#128424; Skriv ut / Print</button>
    </div>

    <div class="header">
      <div class="company-info">
        ${logoHtml ? `<div style="margin-bottom:8px">${logoHtml}</div>` : ''}
        <h1>${esc(companyName) || 'Ditt Firma'}</h1>
        ${companyAddressLine ? `<p>${esc(companyAddressLine)}</p>` : ''}
        ${orgNumber ? `<p>Org.nr: ${esc(orgNumber)}</p>` : ''}
        ${companyEmail ? `<p>${esc(companyEmail)}</p>` : ''}
        ${companyPhone ? `<p>Tlf: ${esc(companyPhone)}</p>` : ''}
      </div>
      <div class="invoice-title">
        <h2>Faktura</h2>
        <div class="invoice-number">${esc(invoice.invoice_number)}</div>
      </div>
    </div>

    <div class="meta-section">
      <div class="meta-block">
        <h3>Fakturert til</h3>
        <p class="name">${esc(customerName)}</p>
        ${customerCompany ? `<p>${esc(customerCompany)}</p>` : ''}
        ${customerAddressLine ? `<p>${esc(customerAddressLine)}</p>` : ''}
        ${customerEmail ? `<p>${esc(customerEmail)}</p>` : ''}
      </div>
      <div class="meta-block">
        <h3>Fakturadetaljer</h3>
        <p><strong>Fakturadato:</strong> ${invoiceDate}</p>
        <p><strong>Forfallsdato:</strong> ${dueDate}</p>
        ${order?.order_number ? `<p><strong>Ordrenr:</strong> ${esc(order.order_number)}</p>` : ''}
        <p><strong>Betalingsfrist:</strong> ${esc(paymentTermsDays)} dager</p>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>Beskrivelse</th>
          <th>Antall</th>
          <th>Enhetspris</th>
          <th>Sum</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows || '<tr><td colspan="4" style="padding:12px;text-align:center;color:#94a3b8">Ingen artikler</td></tr>'}
      </tbody>
    </table>

    <div class="totals-section">
      <table class="totals-table">
        <tr>
          <td>Subtotal</td>
          <td>${formatCurrency(subtotal, currency)}</td>
        </tr>
        ${discountPct > 0 ? `<tr>
          <td>Rabatt (${discountPct}%)</td>
          <td>-${formatCurrency(discountAmount, currency)}</td>
        </tr>` : ''}
        ${taxPct > 0 ? `<tr>
          <td>MVA (${taxPct}%)</td>
          <td>${formatCurrency(taxAmount, currency)}</td>
        </tr>` : ''}
        <tr class="total-row">
          <td>Totalt</td>
          <td>${formatCurrency(total, currency)}</td>
        </tr>
      </table>
    </div>

    ${bankAccount ? `<div class="payment-section">
      <h3>Betalingsinformasjon</h3>
      <p><strong>Kontonummer:</strong> <span class="highlight">${esc(bankAccount)}</span></p>
      ${invoice.payment_reference ? `<p><strong>Referanse/KID:</strong> <span class="highlight">${esc(invoice.payment_reference)}</span></p>` : ''}
      <p><strong>Forfallsdato:</strong> <span class="highlight">${dueDate}</span></p>
      <p><strong>Valuta:</strong> ${esc(currency)}</p>
    </div>` : ''}

    ${invoiceFooter ? `<div class="footer">${esc(invoiceFooter)}</div>` : ''}
    ${!invoiceFooter && companyName ? `<div class="footer">${esc(companyName)}${orgNumber ? ' | Org.nr: ' + esc(orgNumber) : ''}${companyEmail ? ' | ' + esc(companyEmail) : ''}</div>` : ''}
  </div>
</body>
</html>`;
}
