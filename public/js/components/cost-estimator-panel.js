// Cost Estimator Panel — upload 3MF/GCode, calculate cost breakdown, compare materials
(function() {
  'use strict';

  let _fileData = null;       // Parsed file data from upload
  let _costResult = null;     // Latest calculation result
  let _estimates = [];        // Saved estimates
  let _spools = [];           // Available spools for selection

  function _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

  function formatCurrency(val, currency) {
    if (val === null || val === undefined) return '--';
    return val.toFixed(2) + ' ' + (currency || 'NOK');
  }

  function formatTime(minutes) {
    if (!minutes) return '--';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return h + 'h ' + m + 'm';
    return m + 'm';
  }

  function formatDate(iso) {
    if (!iso) return '--';
    const locale = (window.i18n?.getLocale() || 'nb').replace('_', '-');
    return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  // ═══ API calls ═══

  async function uploadFile(file) {
    const buffer = await file.arrayBuffer();
    const res = await fetch('/api/cost-estimator/upload?filename=' + encodeURIComponent(file.name), {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: buffer
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Upload failed'); }
    return res.json();
  }

  async function calculateCost(data) {
    const res = await fetch('/api/cost-estimator/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Calculation failed'); }
    return res.json();
  }

  async function saveEstimate(data) {
    const res = await fetch('/api/cost-estimator/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to save');
    return res.json();
  }

  async function fetchEstimates() {
    const res = await fetch('/api/cost-estimator/estimates');
    if (!res.ok) return [];
    return res.json();
  }

  async function deleteEstimate(id) {
    await fetch('/api/cost-estimator/estimates/' + id, { method: 'DELETE' });
  }

  async function fetchSpools() {
    try {
      const res = await fetch('/api/filament');
      if (!res.ok) return [];
      return res.json();
    } catch { return []; }
  }

  async function compareMaterials(data) {
    const res = await fetch('/api/cost-estimator/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Compare failed');
    return res.json();
  }

  // ═══ File handling ═══

  function handleFileDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const dropZone = document.getElementById('ce-drop-zone');
    if (dropZone) dropZone.classList.remove('ce-drop-active');
    const files = e.dataTransfer?.files || e.target?.files;
    if (files && files.length > 0) processFile(files[0]);
  }

  async function processFile(file) {
    const statusEl = document.getElementById('ce-upload-status');
    if (statusEl) { statusEl.textContent = t('cost_estimator.parsing'); statusEl.style.display = 'block'; }

    try {
      _fileData = await uploadFile(file);
      _costResult = null;
      if (statusEl) statusEl.style.display = 'none';
      renderFileInfo();
      renderCalculator();
    } catch (e) {
      if (statusEl) { statusEl.textContent = e.message; statusEl.className = 'ce-status ce-status--error'; }
    }
  }

  // ═══ Render functions ═══

  function renderFileInfo() {
    const el = document.getElementById('ce-file-info');
    if (!el || !_fileData) { if (el) el.innerHTML = ''; return; }

    const filaments = _fileData.filaments || [];
    let filamentRows = '';
    filaments.forEach((f, i) => {
      const colorSwatch = f.color ? `<span class="ce-color-swatch" style="background:${_esc(f.color)}"></span>` : '';
      filamentRows += `<tr>
        <td>${i + 1}</td>
        <td>${colorSwatch} ${_esc(f.material || t('cost_estimator.unknown'))}</td>
        <td>${f.weight_g ? f.weight_g.toFixed(1) + ' g' : '--'}</td>
        <td>
          <select class="form-input ce-spool-select" data-filament-idx="${i}" style="min-width:160px">
            <option value="">${t('cost_estimator.manual_price')}</option>
            ${_spools.map(s => `<option value="${s.id}">${_esc((s.filament_name || s.material || '') + ' - ' + (s.color_name || ''))}</option>`).join('')}
          </select>
        </td>
      </tr>`;
    });

    el.innerHTML = `
      <div class="stat-card">
        <h3>${_esc(_fileData.filename || '')}</h3>
        <div class="stat-grid" style="grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); margin-bottom: 1rem;">
          <div class="stat-card"><div class="stat-label">${t('cost_estimator.print_time')}</div><div class="stat-value">${formatTime(_fileData.estimated_time_min)}</div></div>
          <div class="stat-card"><div class="stat-label">${t('cost_estimator.total_weight')}</div><div class="stat-value">${_fileData.total_weight_g ? _fileData.total_weight_g.toFixed(1) + ' g' : '--'}</div></div>
          <div class="stat-card"><div class="stat-label">${t('cost_estimator.colors')}</div><div class="stat-value">${filaments.length}</div></div>
        </div>
        ${filaments.length > 0 ? `
        <table class="ce-table">
          <thead><tr>
            <th>#</th><th>${t('cost_estimator.material')}</th><th>${t('cost_estimator.weight')}</th><th>${t('cost_estimator.spool')}</th>
          </tr></thead>
          <tbody>${filamentRows}</tbody>
        </table>` : `<p style="opacity:.6">${t('cost_estimator.no_filament_data')}</p>`}
      </div>`;
  }

  function renderCalculator() {
    const el = document.getElementById('ce-calculator');
    if (!el || !_fileData) { if (el) el.innerHTML = ''; return; }

    el.innerHTML = `
      <div class="stat-card" style="margin-top:1rem">
        <h3>${t('cost_estimator.settings')}</h3>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:.75rem; margin-bottom:1rem">
          <label class="form-label">${t('cost_estimator.manual_price_kg')}
            <input type="number" id="ce-manual-price" class="form-input" value="250" step="1" min="0">
          </label>
          <label class="form-label">${t('cost_estimator.wattage')}
            <input type="number" id="ce-wattage" class="form-input" value="150" step="10" min="0">
          </label>
          <label class="form-label">${t('cost_estimator.printer')}
            <select id="ce-printer" class="form-input">
              <option value="">${t('cost_estimator.default_settings')}</option>
            </select>
          </label>
        </div>
        <button class="form-btn" id="ce-calc-btn">${t('cost_estimator.calculate')}</button>
      </div>
      <div id="ce-result"></div>`;

    // Populate printer dropdown
    _populatePrinterDropdown();

    document.getElementById('ce-calc-btn')?.addEventListener('click', runCalculation);
  }

  async function _populatePrinterDropdown() {
    try {
      const res = await fetch('/api/printers');
      if (!res.ok) return;
      const printers = await res.json();
      const sel = document.getElementById('ce-printer');
      if (!sel) return;
      printers.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name || p.id;
        sel.appendChild(opt);
      });
    } catch {}
  }

  async function runCalculation() {
    const btn = document.getElementById('ce-calc-btn');
    if (btn) btn.disabled = true;

    const spoolSelects = document.querySelectorAll('.ce-spool-select');
    const spoolIds = [];
    spoolSelects.forEach(sel => spoolIds.push(sel.value ? parseInt(sel.value) : null));

    const manualPrice = parseFloat(document.getElementById('ce-manual-price')?.value || '0');
    const wattage = parseFloat(document.getElementById('ce-wattage')?.value || '150');
    const printerId = document.getElementById('ce-printer')?.value || null;

    try {
      _costResult = await calculateCost({
        filaments: _fileData.filaments || [],
        spool_ids: spoolIds,
        estimated_time_min: _fileData.estimated_time_min || 0,
        printer_id: printerId,
        wattage: wattage,
        manual_price_per_kg: manualPrice
      });
      renderResult();
    } catch (e) {
      const el = document.getElementById('ce-result');
      if (el) el.innerHTML = `<div class="ce-status ce-status--error">${_esc(e.message)}</div>`;
    }
    if (btn) btn.disabled = false;
  }

  function renderResult() {
    const el = document.getElementById('ce-result');
    if (!el || !_costResult) return;

    const c = _costResult;
    const cur = c.currency || 'NOK';

    let breakdownRows = '';
    if (c.filament_breakdown) {
      c.filament_breakdown.forEach((fb, i) => {
        const label = fb.spool ? _esc(fb.spool.name || fb.material || '') : _esc(fb.material || t('cost_estimator.filament') + ' ' + (i + 1));
        const colorDot = (fb.spool?.color || fb.color) ? `<span class="ce-color-swatch" style="background:${_esc(fb.spool?.color || fb.color)}"></span>` : '';
        breakdownRows += `<tr><td>${colorDot} ${label}</td><td>${(fb.weight_g || 0).toFixed(1)} g</td><td>${formatCurrency(fb.cost, cur)}</td></tr>`;
      });
    }

    el.innerHTML = `
      <div class="stat-card" style="margin-top:1rem">
        <h3>${t('cost_estimator.cost_breakdown')}</h3>
        <div class="stat-grid" style="grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); margin-bottom:1rem">
          <div class="stat-card"><div class="stat-label">${t('cost_estimator.filament_cost')}</div><div class="stat-value">${formatCurrency(c.filament_cost, cur)}</div></div>
          <div class="stat-card"><div class="stat-label">${t('cost_estimator.electricity_cost')}</div><div class="stat-value">${formatCurrency(c.electricity_cost, cur)}</div></div>
          <div class="stat-card"><div class="stat-label">${t('cost_estimator.wear_cost')}</div><div class="stat-value">${formatCurrency(c.wear_cost, cur)}</div></div>
          <div class="stat-card" style="border:2px solid var(--accent-green)"><div class="stat-label">${t('cost_estimator.total_cost')}</div><div class="stat-value" style="font-size:1.4rem;color:var(--accent-green)">${formatCurrency(c.total_cost, cur)}</div></div>
        </div>
        ${breakdownRows ? `
        <details style="margin-bottom:1rem">
          <summary style="cursor:pointer;font-weight:600">${t('cost_estimator.filament_details')}</summary>
          <table class="ce-table" style="margin-top:.5rem">
            <thead><tr><th>${t('cost_estimator.material')}</th><th>${t('cost_estimator.weight')}</th><th>${t('cost_estimator.cost')}</th></tr></thead>
            <tbody>${breakdownRows}</tbody>
          </table>
        </details>` : ''}
        <div style="display:flex;gap:.5rem;flex-wrap:wrap">
          <button class="form-btn" id="ce-save-btn">${t('cost_estimator.save_estimate')}</button>
          <button class="form-btn form-btn--secondary" id="ce-compare-btn">${t('cost_estimator.compare_materials')}</button>
        </div>
        <div class="ce-info" style="margin-top:.75rem;opacity:.6;font-size:.85rem">
          ${t('cost_estimator.rate_info', { rate: c.electricity_rate?.toFixed(3) || '0', wattage: c.wattage || 150 })}
        </div>
      </div>
      <div id="ce-compare-result"></div>`;

    document.getElementById('ce-save-btn')?.addEventListener('click', doSave);
    document.getElementById('ce-compare-btn')?.addEventListener('click', showCompareUI);
  }

  async function doSave() {
    if (!_fileData || !_costResult) return;
    try {
      await saveEstimate({
        filename: _fileData.filename,
        file_hash: _fileData.file_hash,
        filament_data: _fileData.filaments || [],
        estimated_time_min: _fileData.estimated_time_min || 0,
        filament_cost: _costResult.filament_cost,
        electricity_cost: _costResult.electricity_cost,
        wear_cost: _costResult.wear_cost,
        total_cost: _costResult.total_cost,
        settings: _costResult.settings || {},
        currency: _costResult.currency || 'NOK'
      });
      await loadEstimates();
      const btn = document.getElementById('ce-save-btn');
      if (btn) { btn.textContent = t('cost_estimator.saved'); btn.disabled = true; }
    } catch (e) {
      alert(e.message);
    }
  }

  function showCompareUI() {
    const el = document.getElementById('ce-compare-result');
    if (!el || !_fileData) return;

    const filaments = _fileData.filaments || [];
    let selectors = '';
    for (let set = 0; set < 2; set++) {
      selectors += `<div class="stat-card" style="margin-bottom:.5rem"><h4>${t('cost_estimator.option')} ${set + 1}</h4>`;
      filaments.forEach((f, i) => {
        selectors += `<select class="form-input ce-compare-spool" data-set="${set}" data-idx="${i}" style="margin-bottom:.25rem;min-width:180px">
          <option value="">${t('cost_estimator.select_spool')}</option>
          ${_spools.map(s => `<option value="${s.id}">${_esc((s.filament_name || s.material || '') + ' - ' + (s.color_name || ''))}</option>`).join('')}
        </select>`;
      });
      selectors += '</div>';
    }

    el.innerHTML = `
      <div class="stat-card" style="margin-top:1rem">
        <h3>${t('cost_estimator.compare_materials')}</h3>
        ${selectors}
        <button class="form-btn" id="ce-run-compare">${t('cost_estimator.compare')}</button>
        <div id="ce-compare-output"></div>
      </div>`;

    document.getElementById('ce-run-compare')?.addEventListener('click', runCompare);
  }

  async function runCompare() {
    const filaments = _fileData.filaments || [];
    const sets = [[], []];
    document.querySelectorAll('.ce-compare-spool').forEach(sel => {
      const setIdx = parseInt(sel.dataset.set);
      sets[setIdx].push(sel.value ? parseInt(sel.value) : null);
    });

    try {
      const result = await compareMaterials({
        filaments,
        estimated_time_min: _fileData.estimated_time_min || 0,
        printer_id: document.getElementById('ce-printer')?.value || null,
        compare_spool_ids: sets
      });

      const out = document.getElementById('ce-compare-output');
      if (!out) return;
      const cur = result.currency || 'NOK';
      let html = '<div class="stat-grid" style="grid-template-columns:1fr 1fr;margin-top:1rem">';
      result.comparisons.forEach((comp, idx) => {
        html += `<div class="stat-card">
          <h4>${t('cost_estimator.option')} ${idx + 1}</h4>
          <div class="stat-label">${t('cost_estimator.filament_cost')}</div><div>${formatCurrency(comp.filament_cost, cur)}</div>
          <div class="stat-label" style="margin-top:.5rem">${t('cost_estimator.total_cost')}</div><div style="font-weight:700;font-size:1.1rem">${formatCurrency(comp.total_cost, cur)}</div>
        </div>`;
      });
      html += '</div>';
      if (result.comparisons.length === 2) {
        const diff = result.comparisons[0].total_cost - result.comparisons[1].total_cost;
        const cheaper = diff > 0 ? 2 : 1;
        html += `<p style="margin-top:.5rem;font-weight:600">${t('cost_estimator.cheaper_option', { option: cheaper, amount: Math.abs(diff).toFixed(2), currency: cur })}</p>`;
      }
      out.innerHTML = html;
    } catch (e) {
      const out = document.getElementById('ce-compare-output');
      if (out) out.innerHTML = `<div class="ce-status ce-status--error">${_esc(e.message)}</div>`;
    }
  }

  async function loadEstimates() {
    _estimates = await fetchEstimates();
    renderEstimates();
  }

  function renderEstimates() {
    const el = document.getElementById('ce-estimates-list');
    if (!el) return;

    if (!_estimates.length) {
      el.innerHTML = `<p style="opacity:.6">${t('cost_estimator.no_estimates')}</p>`;
      return;
    }

    let rows = '';
    _estimates.forEach(est => {
      rows += `<tr>
        <td>${_esc(est.filename || '--')}</td>
        <td>${formatTime(est.estimated_time_min)}</td>
        <td>${formatCurrency(est.filament_cost, est.currency)}</td>
        <td>${formatCurrency(est.electricity_cost, est.currency)}</td>
        <td style="font-weight:700">${formatCurrency(est.total_cost, est.currency)}</td>
        <td>${formatDate(est.created_at)}</td>
        <td><button class="form-btn form-btn--danger form-btn--sm ce-delete-est" data-id="${est.id}" title="${t('cost_estimator.delete')}">&#10005;</button></td>
      </tr>`;
    });

    el.innerHTML = `
      <table class="ce-table">
        <thead><tr>
          <th>${t('cost_estimator.filename')}</th>
          <th>${t('cost_estimator.time')}</th>
          <th>${t('cost_estimator.filament_cost')}</th>
          <th>${t('cost_estimator.electricity_cost')}</th>
          <th>${t('cost_estimator.total_cost')}</th>
          <th>${t('cost_estimator.date')}</th>
          <th></th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`;

    el.querySelectorAll('.ce-delete-est').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id);
        await deleteEstimate(id);
        await loadEstimates();
      });
    });
  }

  // ═══ Tab switching ═══

  function switchTab(tabName) {
    document.querySelectorAll('.ce-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabName));
    document.querySelectorAll('.ce-tab-content').forEach(c => c.classList.toggle('view-hidden', c.dataset.tab !== tabName));
  }

  // ═══ Main render ═══

  window.loadCostEstimatorPanel = async function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    el.innerHTML = `
      <style>
        .ce-panel { padding: 1rem; }
        .ce-tabs { display: flex; gap: .5rem; margin-bottom: 1rem; border-bottom: 2px solid var(--border); padding-bottom: .5rem; }
        .ce-tab-btn { background: none; border: none; color: var(--text-secondary); font-size: .95rem; font-weight: 600; cursor: pointer; padding: .4rem .8rem; border-radius: 6px 6px 0 0; transition: all .2s; }
        .ce-tab-btn.active { color: var(--accent); border-bottom: 2px solid var(--accent); }
        .ce-tab-btn:hover { color: var(--text-primary); }
        .ce-tab-content.view-hidden { display: none; }
        .ce-drop-zone {
          border: 2px dashed var(--border);
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all .2s;
          margin-bottom: 1rem;
        }
        .ce-drop-zone:hover, .ce-drop-active { border-color: var(--accent); background: var(--accent-bg, rgba(0,122,255,.05)); }
        .ce-drop-zone svg { opacity: .4; margin-bottom: .5rem; }
        .ce-drop-zone p { margin: 0; opacity: .6; }
        .ce-drop-zone .ce-drop-title { font-size: 1.1rem; font-weight: 600; opacity: 1; margin-bottom: .25rem; }
        .ce-status { padding: .5rem 1rem; border-radius: 8px; margin-bottom: 1rem; }
        .ce-status--error { background: rgba(255,59,48,.1); color: var(--danger); }
        .ce-table { width: 100%; border-collapse: collapse; font-size: .9rem; }
        .ce-table th, .ce-table td { padding: .5rem .75rem; text-align: left; border-bottom: 1px solid var(--border); }
        .ce-table th { font-weight: 600; opacity: .7; font-size: .8rem; text-transform: uppercase; }
        .ce-color-swatch { display: inline-block; width: 14px; height: 14px; border-radius: 50%; vertical-align: middle; margin-right: .25rem; border: 1px solid var(--border); }
        .ce-info { font-size: .85rem; opacity: .6; }
        .form-btn--sm { padding: .25rem .5rem; font-size: .8rem; min-width: auto; }
        .form-btn--danger { background: var(--danger, #ff3b30); color: #fff; border: none; border-radius: 6px; cursor: pointer; }
        .form-btn--secondary { background: var(--surface); color: var(--text-primary); border: 1px solid var(--border); }
      </style>
      <div class="ce-panel">
        <div class="ce-tabs">
          <button class="ce-tab-btn active" data-tab="estimate" onclick="document.querySelectorAll('.ce-tab-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active');document.querySelectorAll('.ce-tab-content').forEach(c=>c.classList.toggle('view-hidden',c.dataset.tab!=='estimate'))">${t('cost_estimator.estimate_tab')}</button>
          <button class="ce-tab-btn" data-tab="saved" onclick="document.querySelectorAll('.ce-tab-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active');document.querySelectorAll('.ce-tab-content').forEach(c=>c.classList.toggle('view-hidden',c.dataset.tab!=='saved'))">${t('cost_estimator.saved_tab')}</button>
        </div>

        <div class="ce-tab-content" data-tab="estimate">
          <div id="ce-drop-zone" class="ce-drop-zone">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <p class="ce-drop-title">${t('cost_estimator.drop_title')}</p>
            <p>${t('cost_estimator.drop_subtitle')}</p>
            <input type="file" id="ce-file-input" accept=".3mf,.gcode,.gco,.g" style="display:none">
          </div>
          <div id="ce-upload-status" class="ce-status" style="display:none"></div>
          <div id="ce-file-info"></div>
          <div id="ce-calculator"></div>
        </div>

        <div class="ce-tab-content view-hidden" data-tab="saved">
          <div id="ce-estimates-list"></div>
        </div>
      </div>`;

    // Load spools for selectors
    _spools = await fetchSpools();

    // Set up drop zone
    const dropZone = document.getElementById('ce-drop-zone');
    const fileInput = document.getElementById('ce-file-input');

    if (dropZone) {
      dropZone.addEventListener('click', () => fileInput?.click());
      dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('ce-drop-active'); });
      dropZone.addEventListener('dragleave', () => dropZone.classList.remove('ce-drop-active'));
      dropZone.addEventListener('drop', handleFileDrop);
    }
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files?.length) processFile(e.target.files[0]);
      });
    }

    // Load saved estimates
    loadEstimates();

    // Restore file info if we still have it
    if (_fileData) {
      renderFileInfo();
      renderCalculator();
      if (_costResult) renderResult();
    }
  };
})();
