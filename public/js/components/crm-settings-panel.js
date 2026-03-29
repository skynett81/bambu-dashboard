// CRM Settings Panel — Company info for invoice generation
(function() {
  'use strict';

  function _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
  function _tl(key, fb) { return (typeof window.t === 'function' ? window.t(key) : '') || fb; }

  async function fetchSettings() {
    try {
      const r = await fetch('/api/crm/settings');
      return r.ok ? r.json() : {};
    } catch { return {}; }
  }

  async function saveSettings(data) {
    const r = await fetch('/api/crm/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save');
    }
    return r.json();
  }

  function renderForm(body, settings) {
    const fields = [
      { key: 'crm_company_name', label: 'crm.company_name', fallback: 'Firmanavn', type: 'text', col: '1' },
      { key: 'crm_org_number', label: 'crm.org_number', fallback: 'Org.nr', type: 'text', col: '1' },
      { key: 'crm_company_address', label: 'crm.address', fallback: 'Adresse', type: 'text', col: '1' },
      { key: 'crm_company_postal', label: 'crm.postal_code', fallback: 'Postnummer', type: 'text', col: '2' },
      { key: 'crm_company_city', label: 'crm.city', fallback: 'By', type: 'text', col: '2' },
      { key: 'crm_company_country', label: 'crm.country', fallback: 'Land', type: 'text', col: '2' },
      { key: 'crm_company_email', label: 'crm.email', fallback: 'E-post', type: 'email', col: '3' },
      { key: 'crm_company_phone', label: 'crm.phone', fallback: 'Telefon', type: 'tel', col: '3' },
      { key: 'crm_bank_account', label: 'crm.bank_account', fallback: 'Kontonummer', type: 'text', col: '4' },
      { key: 'crm_payment_terms_days', label: 'crm.payment_terms_days', fallback: 'Betalingsfrist (dager)', type: 'number', col: '4' },
      { key: 'crm_default_tax_pct', label: 'crm.default_tax', fallback: 'MVA-sats (%)', type: 'number', col: '4' },
      { key: 'crm_logo_url', label: 'crm.logo_url', fallback: 'Logo URL (valgfritt)', type: 'url', col: '5' },
      { key: 'crm_invoice_footer', label: 'crm.invoice_footer', fallback: 'Faktura bunntekst', type: 'textarea', col: '5' }
    ];

    // Group fields by col
    const groups = {};
    for (const f of fields) {
      if (!groups[f.col]) groups[f.col] = [];
      groups[f.col].push(f);
    }

    const sections = [
      { col: '1', title: _tl('crm.company_settings', 'Firmainfo'), icon: 'bi-building' },
      { col: '2', title: _tl('crm.address', 'Adresse'), icon: 'bi-geo-alt' },
      { col: '3', title: _tl('crm.contact', 'Kontakt'), icon: 'bi-envelope' },
      { col: '4', title: _tl('crm.payment_terms', 'Betaling'), icon: 'bi-bank' },
      { col: '5', title: _tl('crm.invoice_settings', 'Faktura'), icon: 'bi-file-earmark-text' }
    ];

    let fieldsHtml = '';
    for (const sec of sections) {
      const sectionFields = groups[sec.col] || [];
      fieldsHtml += `<div style="margin-bottom:1.25rem">
        <h5 style="margin-bottom:0.75rem;display:flex;align-items:center;gap:6px">
          <i class="bi ${sec.icon}" style="opacity:0.7"></i> ${_esc(sec.title)}
        </h5>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0.75rem">`;
      for (const f of sectionFields) {
        const val = settings[f.key] || '';
        if (f.type === 'textarea') {
          fieldsHtml += `<div style="grid-column:1/-1">
            <label class="form-label">${_esc(_tl(f.label, f.fallback))}</label>
            <textarea class="form-control" name="${f.key}" rows="2">${_esc(val)}</textarea>
          </div>`;
        } else {
          fieldsHtml += `<div>
            <label class="form-label">${_esc(_tl(f.label, f.fallback))}</label>
            <input class="form-control" name="${f.key}" type="${f.type}" value="${_esc(val)}">
          </div>`;
        }
      }
      fieldsHtml += '</div></div>';
    }

    body.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><i class="bi bi-gear" style="margin-right:6px"></i>${_esc(_tl('crm.company_settings', 'Firmainformasjon'))}</h3>
        </div>
        <div class="card-body">
          <form id="crm-settings-form">
            ${fieldsHtml}
            <hr style="margin:1rem 0">
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
              <button type="submit" class="btn btn-primary">
                <i class="bi bi-check-lg"></i> ${_esc(_tl('crm.save', 'Lagre'))}
              </button>
              <button type="button" class="btn btn-outline-secondary" id="crm-settings-preview">
                <i class="bi bi-eye"></i> ${_esc(_tl('crm.preview_invoice', 'Forhåndsvis faktura'))}
              </button>
            </div>
          </form>
        </div>
      </div>`;

    const form = document.getElementById('crm-settings-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const data = {};
        for (const [key, value] of fd.entries()) {
          data[key] = value;
        }
        try {
          await saveSettings(data);
          if (typeof showToast === 'function') showToast(_tl('crm.settings_saved', 'Innstillinger lagret'), 'success');
        } catch (err) {
          if (typeof showToast === 'function') showToast(err.message, 'danger');
        }
      });
    }

    const previewBtn = document.getElementById('crm-settings-preview');
    if (previewBtn) {
      previewBtn.addEventListener('click', async () => {
        // First save settings, then try to find an invoice to preview, or show a sample
        const fd = new FormData(form);
        const data = {};
        for (const [key, value] of fd.entries()) {
          data[key] = value;
        }
        try {
          await saveSettings(data);
        } catch { /* continue anyway */ }

        // Try to find the latest invoice
        try {
          const r = await fetch('/api/crm/invoices?limit=1');
          const invoices = r.ok ? await r.json() : [];
          if (invoices.length > 0) {
            window.open('/api/crm/invoices/' + invoices[0].id + '/html', '_blank');
          } else {
            if (typeof showToast === 'function') showToast(_tl('crm.no_invoices', 'Ingen fakturaer å forhåndsvise. Opprett en ordre og generer en faktura først.'), 'info');
          }
        } catch {
          if (typeof showToast === 'function') showToast('Could not load invoices', 'danger');
        }
      });
    }
  }

  async function loadCrmSettingsPanel() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;

    body.innerHTML = '<div style="text-align:center;padding:2rem;opacity:0.6">Laster...</div>';

    const settings = await fetchSettings();
    renderForm(body, settings);
  }

  window.loadCrmSettingsPanel = loadCrmSettingsPanel;
})();
