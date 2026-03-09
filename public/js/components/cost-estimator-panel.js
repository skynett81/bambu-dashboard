// Cost Estimator Panel — upload 3MF/GCode, calculate cost breakdown, compare materials
(function() {
  'use strict';

  let _fileData = null;
  let _costResult = null;
  let _estimates = [];
  let _spools = [];
  let _activeTab = 'estimate';

  function _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
  function _tl(key, fb) { return (typeof t === 'function' ? t(key) : '') || fb; }

  function formatCurrency(val, currency) {
    if (val === null || val === undefined) return '--';
    return val.toFixed(2) + ' ' + (currency || 'NOK');
  }

  function formatTime(minutes) {
    if (!minutes) return '--';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return h + 't ' + m + 'min';
    return m + 'min';
  }

  function formatDate(iso) {
    if (!iso) return '--';
    const locale = (window.i18n?.getLocale() || 'nb').replace('_', '-');
    return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  // ═══ Tab bar ═══

  const TABS = [
    { id: 'estimate', labelKey: 'cost_estimator.estimate_tab', fallback: 'Estimat' },
    { id: 'saved', labelKey: 'cost_estimator.saved_tab', fallback: 'Lagrede' }
  ];

  function _tabBarHtml() {
    return '<div class="tabs _wrapper-tabs">' + TABS.map(tab => {
      const label = _tl(tab.labelKey, tab.fallback);
      const active = _activeTab === tab.id ? ' active' : '';
      return `<button class="tab-btn${active}" onclick="_switchCostTab('${tab.id}')">${label}</button>`;
    }).join('') + '</div>';
  }

  function _ensureTabBar() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;
    const old = body.querySelector('._wrapper-tabs');
    if (old) old.remove();
    body.insertAdjacentHTML('afterbegin', _tabBarHtml());
  }

  window._switchCostTab = function(tab) {
    _activeTab = tab;
    _render();
  };

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
    if (statusEl) { statusEl.textContent = _tl('cost_estimator.parsing', 'Analyserer fil...'); statusEl.style.display = 'flex'; statusEl.className = 'ce-status ce-status--info'; }

    try {
      _fileData = await uploadFile(file);
      _costResult = null;
      if (statusEl) statusEl.style.display = 'none';
      _renderEstimateTab();
    } catch (e) {
      if (statusEl) { statusEl.textContent = e.message; statusEl.className = 'ce-status ce-status--error'; }
    }
  }

  // ═══ Estimate tab ═══

  function _renderEstimateTab() {
    const container = document.getElementById('ce-tab-estimate');
    if (!container) return;

    let html = '';

    // Drop zone (always visible)
    html += `<div id="ce-drop-zone" class="ce-drop-zone">
      <div class="ce-drop-icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      </div>
      <div class="ce-drop-text">
        <div class="ce-drop-title">${_tl('cost_estimator.drop_title', 'Slipp fil her')}</div>
        <div class="ce-drop-subtitle">${_tl('cost_estimator.drop_subtitle', '3MF, GCode')}</div>
      </div>
      <input type="file" id="ce-file-input" accept=".3mf,.gcode,.gco,.g" style="display:none">
    </div>
    <div id="ce-upload-status" class="ce-status" style="display:none"></div>`;

    if (_fileData) {
      const filaments = _fileData.filaments || [];

      // File info card with stats
      html += `<div class="card ce-section">
        <div class="ce-file-header">
          <div class="ce-file-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div class="ce-file-name">${_esc(_fileData.filename || '')}</div>
        </div>
        <div class="stats-strip ce-file-stats">
          <div class="spark-panel">
            <span class="spark-label">${_tl('cost_estimator.print_time', 'Tid')}</span>
            <span class="spark-value">${formatTime(_fileData.estimated_time_min)}</span>
          </div>
          <div class="spark-panel">
            <span class="spark-label">${_tl('cost_estimator.total_weight', 'Vekt')}</span>
            <span class="spark-value">${_fileData.total_weight_g ? _fileData.total_weight_g.toFixed(1) + ' g' : '--'}</span>
          </div>
          <div class="spark-panel" style="border-right:none">
            <span class="spark-label">${_tl('cost_estimator.colors', 'Farger')}</span>
            <span class="spark-value">${filaments.length}</span>
          </div>
        </div>`;

      // Filament table
      if (filaments.length > 0) {
        html += `<div class="ce-filament-list">`;
        filaments.forEach((f, i) => {
          const colorSwatch = f.color ? `<span class="ce-swatch" style="background:${_esc(f.color)}"></span>` : '<span class="ce-swatch ce-swatch--empty"></span>';
          html += `<div class="ce-filament-row">
            <div class="ce-filament-info">
              ${colorSwatch}
              <div>
                <div class="ce-filament-name">${_esc(f.material || _tl('cost_estimator.unknown', 'Ukjent'))}</div>
                <div class="ce-filament-weight">${f.weight_g ? f.weight_g.toFixed(1) + ' g' : '--'}</div>
              </div>
            </div>
            <select class="ce-spool-select matrec-select" data-filament-idx="${i}">
              <option value="">${_tl('cost_estimator.manual_price', 'Manuell pris')}</option>
              ${_spools.map(s => `<option value="${s.id}">${_esc((s.filament_name || s.material || '') + ' - ' + (s.color_name || ''))}</option>`).join('')}
            </select>
          </div>`;
        });
        html += `</div>`;
      }
      html += `</div>`;

      // Calculator settings
      html += `<div class="card ce-section">
        <div class="card-title">${_tl('cost_estimator.settings', 'Innstillinger')}</div>
        <div class="auto-grid auto-grid--md" style="margin-bottom:16px">
          <label class="ce-field">
            <span class="ce-field-label">${_tl('cost_estimator.manual_price_kg', 'Pris per kg')}</span>
            <div class="ce-input-wrap">
              <input type="number" id="ce-manual-price" class="ce-input" value="250" step="1" min="0">
              <span class="ce-input-suffix">NOK</span>
            </div>
          </label>
          <label class="ce-field">
            <span class="ce-field-label">${_tl('cost_estimator.wattage', 'Effekt')}</span>
            <div class="ce-input-wrap">
              <input type="number" id="ce-wattage" class="ce-input" value="150" step="10" min="0">
              <span class="ce-input-suffix">W</span>
            </div>
          </label>
          <label class="ce-field">
            <span class="ce-field-label">${_tl('cost_estimator.printer', 'Printer')}</span>
            <select id="ce-printer" class="matrec-select" style="width:100%">
              <option value="">${_tl('cost_estimator.default_settings', 'Standard')}</option>
            </select>
          </label>
        </div>
        <button class="matrec-recalc-btn" id="ce-calc-btn" style="margin-left:0;width:100%;justify-content:center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="10" y2="18"/><line x1="14" y1="18" x2="16" y2="18"/></svg>
          ${_tl('cost_estimator.calculate', 'Beregn kostnad')}
        </button>
      </div>`;

      // Result area
      html += `<div id="ce-result"></div>`;
    }

    container.innerHTML = html;
    _setupDropZone();
    _populatePrinterDropdown();
    document.getElementById('ce-calc-btn')?.addEventListener('click', runCalculation);

    if (_fileData && _costResult) renderResult();
  }

  // ═══ Result rendering ═══

  function renderResult() {
    const el = document.getElementById('ce-result');
    if (!el || !_costResult) return;

    const c = _costResult;
    const cur = c.currency || 'NOK';

    // Cost breakdown cards
    let html = `<div class="card ce-section">
      <div class="card-title">${_tl('cost_estimator.cost_breakdown', 'Kostnadsfordeling')}</div>
      <div class="ce-cost-grid">
        <div class="ce-cost-item">
          <div class="ce-cost-icon" style="background:rgba(0,174,66,0.08);color:var(--accent-green)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg>
          </div>
          <div class="ce-cost-detail">
            <span class="ce-cost-label">${_tl('cost_estimator.filament_cost', 'Filament')}</span>
            <span class="ce-cost-value">${formatCurrency(c.filament_cost, cur)}</span>
          </div>
          <div class="ce-cost-bar"><div class="ce-cost-bar-fill" style="width:${_costPct(c.filament_cost, c.total_cost)}%;background:var(--accent-green)"></div></div>
        </div>
        <div class="ce-cost-item">
          <div class="ce-cost-icon" style="background:rgba(240,136,62,0.08);color:var(--accent-orange)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <div class="ce-cost-detail">
            <span class="ce-cost-label">${_tl('cost_estimator.electricity_cost', 'Strøm')}</span>
            <span class="ce-cost-value">${formatCurrency(c.electricity_cost, cur)}</span>
          </div>
          <div class="ce-cost-bar"><div class="ce-cost-bar-fill" style="width:${_costPct(c.electricity_cost, c.total_cost)}%;background:var(--accent-orange)"></div></div>
        </div>
        <div class="ce-cost-item">
          <div class="ce-cost-icon" style="background:rgba(127,63,242,0.08);color:var(--accent-purple, #7b2ff2)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
          </div>
          <div class="ce-cost-detail">
            <span class="ce-cost-label">${_tl('cost_estimator.wear_cost', 'Slitasje')}</span>
            <span class="ce-cost-value">${formatCurrency(c.wear_cost, cur)}</span>
          </div>
          <div class="ce-cost-bar"><div class="ce-cost-bar-fill" style="width:${_costPct(c.wear_cost, c.total_cost)}%;background:var(--accent-purple, #7b2ff2)"></div></div>
        </div>
      </div>
      <div class="ce-total-row">
        <span class="ce-total-label">${_tl('cost_estimator.total_cost', 'Total')}</span>
        <span class="ce-total-value">${formatCurrency(c.total_cost, cur)}</span>
      </div>
    </div>`;

    // Filament detail breakdown
    if (c.filament_breakdown && c.filament_breakdown.length > 0) {
      html += `<div class="card ce-section">
        <div class="card-title">${_tl('cost_estimator.filament_details', 'Filamentdetaljer')}</div>`;
      c.filament_breakdown.forEach((fb, i) => {
        const label = fb.spool ? _esc(fb.spool.name || fb.material || '') : _esc(fb.material || _tl('cost_estimator.filament', 'Filament') + ' ' + (i + 1));
        const color = fb.spool?.color || fb.color || 'var(--border-color)';
        const pct = c.filament_cost > 0 ? ((fb.cost || 0) / c.filament_cost * 100) : 0;
        html += `<div class="ce-breakdown-row">
          <span class="ce-swatch" style="background:${_esc(color)}"></span>
          <span class="ce-breakdown-name">${label}</span>
          <span class="ce-breakdown-weight">${(fb.weight_g || 0).toFixed(1)} g</span>
          <div class="ce-breakdown-bar"><div class="ce-breakdown-bar-fill" style="width:${pct}%"></div></div>
          <span class="ce-breakdown-cost">${formatCurrency(fb.cost, cur)}</span>
        </div>`;
      });
      html += `</div>`;
    }

    // Actions
    html += `<div class="ce-actions">
      <button class="matrec-recalc-btn" id="ce-save-btn" style="margin-left:0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        ${_tl('cost_estimator.save_estimate', 'Lagre estimat')}
      </button>
      <button class="ce-secondary-btn" id="ce-compare-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        ${_tl('cost_estimator.compare_materials', 'Sammenlign materialer')}
      </button>
    </div>`;

    // Info line
    if (c.electricity_rate) {
      html += `<div class="ce-info-line">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        ${_tl('cost_estimator.rate_info', `Strømpris: ${c.electricity_rate.toFixed(3)} NOK/kWh, ${c.wattage || 150}W`)}
      </div>`;
    }

    html += `<div id="ce-compare-result"></div>`;

    el.innerHTML = html;
    document.getElementById('ce-save-btn')?.addEventListener('click', doSave);
    document.getElementById('ce-compare-btn')?.addEventListener('click', showCompareUI);
  }

  function _costPct(part, total) {
    if (!total || !part) return 0;
    return Math.min(100, Math.round(part / total * 100));
  }

  // ═══ Save / Compare ═══

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
      _estimates = await fetchEstimates();
      const btn = document.getElementById('ce-save-btn');
      if (btn) { btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> ' + _tl('cost_estimator.saved', 'Lagret'); btn.disabled = true; }
      if (typeof showToast === 'function') showToast(_tl('cost_estimator.saved', 'Estimat lagret'), 'success');
    } catch (e) {
      if (typeof showToast === 'function') showToast(e.message, 'error');
    }
  }

  function showCompareUI() {
    const el = document.getElementById('ce-compare-result');
    if (!el || !_fileData) return;

    const filaments = _fileData.filaments || [];
    let selectors = '';
    for (let set = 0; set < 2; set++) {
      selectors += `<div class="ce-compare-option">
        <div class="ce-compare-option-header">${_tl('cost_estimator.option', 'Alternativ')} ${set + 1}</div>`;
      filaments.forEach((f, i) => {
        const colorSwatch = f.color ? `<span class="ce-swatch ce-swatch--sm" style="background:${_esc(f.color)}"></span>` : '';
        selectors += `<div class="ce-compare-spool-row">
          ${colorSwatch}
          <select class="matrec-select ce-compare-spool" data-set="${set}" data-idx="${i}" style="flex:1">
            <option value="">${_tl('cost_estimator.select_spool', 'Velg spole...')}</option>
            ${_spools.map(s => `<option value="${s.id}">${_esc((s.filament_name || s.material || '') + ' - ' + (s.color_name || ''))}</option>`).join('')}
          </select>
        </div>`;
      });
      selectors += '</div>';
    }

    el.innerHTML = `<div class="card ce-section">
      <div class="card-title">${_tl('cost_estimator.compare_materials', 'Sammenlign materialer')}</div>
      <div class="ce-compare-grid">${selectors}</div>
      <button class="matrec-recalc-btn" id="ce-run-compare" style="margin-left:0;margin-top:16px;width:100%;justify-content:center">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        ${_tl('cost_estimator.compare', 'Sammenlign')}
      </button>
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

      let html = '<div class="ce-compare-results">';
      result.comparisons.forEach((comp, idx) => {
        const isWinner = result.comparisons.length === 2 &&
          comp.total_cost === Math.min(...result.comparisons.map(c => c.total_cost));
        html += `<div class="ce-compare-result-card${isWinner ? ' ce-compare-winner' : ''}">
          ${isWinner ? '<div class="ce-winner-badge">' + _tl('cost_estimator.cheapest', 'Billigst') + '</div>' : ''}
          <div class="ce-compare-result-title">${_tl('cost_estimator.option', 'Alternativ')} ${idx + 1}</div>
          <div class="ce-compare-result-total">${formatCurrency(comp.total_cost, cur)}</div>
          <div class="ce-compare-result-detail">
            <span>${_tl('cost_estimator.filament_cost', 'Filament')}</span>
            <span>${formatCurrency(comp.filament_cost, cur)}</span>
          </div>
        </div>`;
      });
      html += '</div>';

      if (result.comparisons.length === 2) {
        const diff = Math.abs(result.comparisons[0].total_cost - result.comparisons[1].total_cost);
        html += `<div class="ce-compare-diff">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
          ${_tl('cost_estimator.difference', 'Forskjell')}: <strong>${formatCurrency(diff, cur)}</strong>
        </div>`;
      }
      out.innerHTML = html;
    } catch (e) {
      const out = document.getElementById('ce-compare-output');
      if (out) out.innerHTML = `<div class="ce-status ce-status--error">${_esc(e.message)}</div>`;
    }
  }

  // ═══ Saved estimates tab ═══

  function _renderSavedTab() {
    const container = document.getElementById('ce-tab-saved');
    if (!container) return;

    if (!_estimates.length) {
      container.innerHTML = `<div class="matrec-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.3;margin-bottom:12px"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        <p>${_tl('cost_estimator.no_estimates', 'Ingen lagrede estimater ennå.')}</p>
      </div>`;
      return;
    }

    let html = '<div class="ce-estimates-grid">';
    _estimates.forEach(est => {
      const cur = est.currency || 'NOK';
      html += `<div class="card ce-estimate-card">
        <div class="ce-estimate-header">
          <div class="ce-estimate-file">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>${_esc(est.filename || '--')}</span>
          </div>
          <button class="ce-delete-btn ce-delete-est" data-id="${est.id}" title="${_tl('cost_estimator.delete', 'Slett')}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>
        </div>
        <div class="ce-estimate-costs">
          <div class="ce-estimate-cost-item">
            <span class="ce-estimate-cost-label">${_tl('cost_estimator.filament_cost', 'Filament')}</span>
            <span>${formatCurrency(est.filament_cost, cur)}</span>
          </div>
          <div class="ce-estimate-cost-item">
            <span class="ce-estimate-cost-label">${_tl('cost_estimator.electricity_cost', 'Strøm')}</span>
            <span>${formatCurrency(est.electricity_cost, cur)}</span>
          </div>
          <div class="ce-estimate-cost-item ce-estimate-total">
            <span>${_tl('cost_estimator.total_cost', 'Total')}</span>
            <span>${formatCurrency(est.total_cost, cur)}</span>
          </div>
        </div>
        <div class="ce-estimate-meta">
          <span>${formatTime(est.estimated_time_min)}</span>
          <span>${formatDate(est.created_at)}</span>
        </div>
      </div>`;
    });
    html += '</div>';

    container.innerHTML = html;

    container.querySelectorAll('.ce-delete-est').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.id);
        await deleteEstimate(id);
        _estimates = await fetchEstimates();
        _renderSavedTab();
      });
    });
  }

  // ═══ Setup helpers ═══

  function _setupDropZone() {
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

  // ═══ Main render ═══

  async function _render() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;

    if (_spools.length === 0) {
      body.innerHTML = '<div class="matrec-empty"><div class="matrec-spinner"></div><p>' + _tl('common.loading', 'Laster...') + '</p></div>';
      _spools = await fetchSpools();
      _estimates = await fetchEstimates();
    }

    body.innerHTML = `<div class="ce-panel">
      <div id="ce-tab-estimate"${_activeTab !== 'estimate' ? ' style="display:none"' : ''}></div>
      <div id="ce-tab-saved"${_activeTab !== 'saved' ? ' style="display:none"' : ''}></div>
    </div>`;

    _ensureTabBar();
    _renderEstimateTab();
    _renderSavedTab();
  }

  async function runCalculation() {
    const btn = document.getElementById('ce-calc-btn');
    if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }

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
    if (btn) { btn.disabled = false; btn.style.opacity = ''; }
  }

  window.loadCostEstimatorPanel = async function(initialTab) {
    _activeTab = (typeof initialTab === 'string') ? initialTab : 'estimate';
    await _render();
  };
})();
