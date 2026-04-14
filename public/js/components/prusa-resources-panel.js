// Prusa Resources Panel — browse imported PrusaSlicer profiles, error codes, G-codes
(function() {
  'use strict';

  const _esc = (s) => { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; };
  let _activeTab = 'filaments';
  let _refreshStatus = [];

  async function _fetchRefreshStatus() {
    try {
      const res = await fetch('/api/prusa/refresh-status');
      if (res.ok) _refreshStatus = await res.json();
    } catch {}
  }

  async function _refreshNow() {
    try {
      await fetch('/api/prusa/refresh', { method: 'POST' });
      if (window.showToast) window.showToast('Prusa resources refresh started — this may take a minute', 'info');
      setTimeout(() => { _fetchRefreshStatus(); _render(); }, 30000);
      setTimeout(() => { _fetchRefreshStatus(); _render(); }, 60000);
    } catch (e) {
      if (window.showToast) window.showToast('Refresh failed: ' + e.message, 'error');
    }
  }

  async function _loadTab(tab) {
    _activeTab = tab;
    const content = document.getElementById('prusa-tab-content');
    if (!content) return;
    content.innerHTML = '<div class="text-center p-3"><i class="bi bi-arrow-repeat spin"></i> Loading…</div>';

    try {
      if (tab === 'filaments') await _renderFilaments(content);
      else if (tab === 'print-profiles') await _renderPrintProfiles(content);
      else if (tab === 'printer-profiles') await _renderPrinterProfiles(content);
      else if (tab === 'errors') await _renderErrors(content);
      else if (tab === 'gcodes') await _renderGcodes(content);
    } catch (e) {
      content.innerHTML = `<div class="alert alert-danger">${_esc(e.message)}</div>`;
    }

    // Update active tab indicator
    document.querySelectorAll('.prusa-tab').forEach(el => el.classList.toggle('active', el.dataset.tab === tab));
  }

  async function _renderFilaments(container) {
    const q = document.getElementById('prusa-search')?.value || '';
    const vendor = document.getElementById('prusa-filter-vendor')?.value || '';
    const material = document.getElementById('prusa-filter-material')?.value || '';
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (vendor) params.set('filament_vendor', vendor);
    if (material) params.set('material_type', material);
    params.set('limit', '200');

    const res = await fetch('/api/prusa/filaments?' + params);
    const data = await res.json();
    const items = Array.isArray(data) ? data : [];

    if (items.length === 0) {
      container.innerHTML = `<div class="alert alert-info mb-0">No filament profiles found. <button class="btn btn-sm btn-primary ms-2" onclick="window._prusaRefresh()">Import from Prusa</button></div>`;
      return;
    }

    // Build vendor and material filter options from data
    const vendors = [...new Set(items.map(i => i.filament_vendor).filter(Boolean))].sort();
    const materials = [...new Set(items.map(i => i.material_type).filter(Boolean))].sort();

    container.innerHTML = `
      <div class="mb-3 d-flex gap-2 flex-wrap">
        <input type="text" class="form-control form-control-sm" id="prusa-search" placeholder="Search..." value="${_esc(q)}" style="max-width:200px">
        <select class="form-select form-select-sm" id="prusa-filter-vendor" style="max-width:180px">
          <option value="">All vendors</option>
          ${vendors.map(v => `<option value="${_esc(v)}" ${v === vendor ? 'selected' : ''}>${_esc(v)}</option>`).join('')}
        </select>
        <select class="form-select form-select-sm" id="prusa-filter-material" style="max-width:120px">
          <option value="">All materials</option>
          ${materials.map(m => `<option value="${_esc(m)}" ${m === material ? 'selected' : ''}>${_esc(m)}</option>`).join('')}
        </select>
        <span class="text-muted small align-self-center">${items.length} profiles</span>
      </div>
      <div class="table-responsive" style="max-height:600px;overflow-y:auto">
        <table class="table table-sm table-hover">
          <thead class="sticky-top" style="background:var(--bs-body-bg)">
            <tr>
              <th>Vendor</th><th>Material</th><th>Profile</th><th>Nozzle</th><th>Bed</th><th>Density</th><th>Max vol</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(i => `
              <tr>
                <td>${_esc(i.filament_vendor || i.vendor)}</td>
                <td><span class="badge text-bg-secondary">${_esc(i.material_type || '?')}</span></td>
                <td>${_esc(i.profile_name)}</td>
                <td>${i.nozzle_temp || '?'}°C${i.nozzle_temp_first_layer && i.nozzle_temp_first_layer !== i.nozzle_temp ? ` (L1: ${i.nozzle_temp_first_layer}°C)` : ''}</td>
                <td>${i.bed_temp || '?'}°C${i.bed_temp_first_layer && i.bed_temp_first_layer !== i.bed_temp ? ` (L1: ${i.bed_temp_first_layer}°C)` : ''}</td>
                <td>${i.density ? i.density + ' g/cm³' : '--'}</td>
                <td>${i.max_volumetric_speed ? i.max_volumetric_speed + ' mm³/s' : '--'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Wire up filter changes
    ['prusa-search', 'prusa-filter-vendor', 'prusa-filter-material'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', () => _loadTab('filaments'));
      if (id === 'prusa-search' && el) el.addEventListener('input', _debounce(() => _loadTab('filaments'), 400));
    });
  }

  async function _renderPrintProfiles(container) {
    const res = await fetch('/api/prusa/print-profiles?limit=200');
    const items = await res.json();
    if (!Array.isArray(items) || items.length === 0) {
      container.innerHTML = '<div class="alert alert-info mb-0">No print profiles imported yet.</div>';
      return;
    }
    container.innerHTML = `
      <div class="table-responsive" style="max-height:600px;overflow-y:auto">
        <table class="table table-sm table-hover">
          <thead class="sticky-top" style="background:var(--bs-body-bg)">
            <tr><th>Vendor</th><th>Profile</th><th>Layer</th><th>Infill</th><th>Pattern</th><th>Perim</th><th>Travel</th></tr>
          </thead>
          <tbody>
            ${items.map(i => `
              <tr>
                <td>${_esc(i.vendor)}</td>
                <td>${_esc(i.profile_name)}</td>
                <td>${i.layer_height ? i.layer_height + ' mm' : '--'}</td>
                <td>${i.infill_density ? i.infill_density + '%' : '--'}</td>
                <td>${_esc(i.infill_pattern || '--')}</td>
                <td>${i.perimeter_speed || '?'} mm/s</td>
                <td>${i.travel_speed || '?'} mm/s</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
  }

  async function _renderPrinterProfiles(container) {
    const res = await fetch('/api/prusa/printer-profiles');
    const items = await res.json();
    if (!Array.isArray(items) || items.length === 0) {
      container.innerHTML = '<div class="alert alert-info mb-0">No printer profiles imported yet.</div>';
      return;
    }
    container.innerHTML = `
      <div class="row g-2" style="max-height:600px;overflow-y:auto">
        ${items.map(i => `
          <div class="col-md-6 col-lg-4">
            <div class="card h-100">
              <div class="card-body p-3">
                <h6 class="card-title mb-1"><i class="bi bi-printer"></i> ${_esc(i.profile_name)}</h6>
                <div class="text-muted small mb-2">${_esc(i.vendor)}${i.family ? ' · ' + _esc(i.family) : ''}</div>
                ${i.technology ? `<div class="small"><strong>Tech:</strong> ${_esc(i.technology)}</div>` : ''}
                ${i.variant ? `<div class="small"><strong>Variants:</strong> ${_esc(i.variant).slice(0, 80)}</div>` : ''}
                ${i.default_materials ? `<div class="small text-muted mt-1" style="max-height:60px;overflow:hidden">${_esc(i.default_materials).slice(0, 120)}...</div>` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>`;
  }

  async function _renderErrors(container) {
    const q = document.getElementById('prusa-err-search')?.value || '';
    const model = document.getElementById('prusa-err-model')?.value || '';
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (model) params.set('model', model);
    params.set('limit', '200');

    const res = await fetch('/api/prusa/errors?' + params);
    const items = await res.json();
    if (!Array.isArray(items) || items.length === 0) {
      container.innerHTML = '<div class="alert alert-info mb-0">No error codes imported yet.</div>';
      return;
    }

    const models = [...new Set(items.map(i => i.printer_model).filter(Boolean))].sort();

    container.innerHTML = `
      <div class="mb-3 d-flex gap-2 flex-wrap">
        <input type="text" class="form-control form-control-sm" id="prusa-err-search" placeholder="Search errors..." value="${_esc(q)}" style="max-width:240px">
        <select class="form-select form-select-sm" id="prusa-err-model" style="max-width:150px">
          <option value="">All models</option>
          ${models.map(m => `<option value="${_esc(m)}" ${m === model ? 'selected' : ''}>${_esc(m)}</option>`).join('')}
        </select>
        <span class="text-muted small align-self-center">${items.length} error codes</span>
      </div>
      <div style="max-height:600px;overflow-y:auto">
        ${items.map(e => {
          const catColor = { 'Mechanical': 'warning', 'Temperature': 'danger', 'Electrical': 'danger', 'Connectivity': 'info', 'System': 'secondary', 'Bootloader': 'secondary', 'Warnings': 'warning', 'Connect': 'info' }[e.category] || 'secondary';
          return `
            <div class="card mb-2">
              <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                  <div>
                    <code class="me-2">${_esc(e.code)}</code>
                    <strong>${_esc(e.title || 'No title')}</strong>
                  </div>
                  <div>
                    <span class="badge text-bg-${catColor}">${_esc(e.category || 'Unknown')}</span>
                    <span class="badge text-bg-dark">${_esc(e.printer_model)}</span>
                  </div>
                </div>
                ${e.text ? `<div class="mt-2 small">${_esc(e.text)}</div>` : ''}
                ${e.action ? `<div class="mt-1 small text-muted"><strong>Action:</strong> ${_esc(e.action)}</div>` : ''}
              </div>
            </div>`;
        }).join('')}
      </div>
    `;
    ['prusa-err-search', 'prusa-err-model'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', () => _loadTab('errors'));
      if (id === 'prusa-err-search' && el) el.addEventListener('input', _debounce(() => _loadTab('errors'), 400));
    });
  }

  async function _renderGcodes(container) {
    const q = document.getElementById('prusa-gcode-search')?.value || '';
    const model = document.getElementById('prusa-gcode-model')?.value || '';
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (model) params.set('model', model);
    const res = await fetch('/api/prusa/gcodes?' + params);
    const items = await res.json();
    if (!Array.isArray(items) || items.length === 0) {
      container.innerHTML = '<div class="alert alert-info mb-0">No G-code reference imported yet.</div>';
      return;
    }
    container.innerHTML = `
      <div class="mb-3 d-flex gap-2 flex-wrap">
        <input type="text" class="form-control form-control-sm" id="prusa-gcode-search" placeholder="Search G-codes..." value="${_esc(q)}" style="max-width:240px">
        <select class="form-select form-select-sm" id="prusa-gcode-model" style="max-width:150px">
          <option value="">All models</option>
          <option value="MK3" ${model === 'MK3' ? 'selected' : ''}>MK3/MK3S</option>
          <option value="MK4" ${model === 'MK4' ? 'selected' : ''}>MK4/MK4S</option>
          <option value="MINI" ${model === 'MINI' ? 'selected' : ''}>MINI</option>
          <option value="XL" ${model === 'XL' ? 'selected' : ''}>XL</option>
          <option value="CORE" ${model === 'CORE' ? 'selected' : ''}>CORE One</option>
        </select>
        <span class="text-muted small align-self-center">${items.length} commands</span>
      </div>
      <div style="max-height:600px;overflow-y:auto">
        ${items.map(c => `
          <div class="card mb-2">
            <div class="card-body p-3">
              <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                <div>
                  <code class="fs-6">${_esc(c.code)}</code>
                  <strong class="ms-2">${_esc(c.title)}</strong>
                </div>
                <span class="badge text-bg-secondary small">${_esc(c.printer_models || 'all')}</span>
              </div>
              <div class="mt-2 small">${_esc(c.description)}</div>
              ${c.parameters ? `<div class="mt-1 small"><strong>Params:</strong> <code>${_esc(c.parameters)}</code></div>` : ''}
              ${c.example ? `<div class="mt-1 small"><strong>Example:</strong> <code>${_esc(c.example)}</code></div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>`;
    ['prusa-gcode-search', 'prusa-gcode-model'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', () => _loadTab('gcodes'));
      if (id === 'prusa-gcode-search' && el) el.addEventListener('input', _debounce(() => _loadTab('gcodes'), 400));
    });
  }

  function _debounce(fn, ms) {
    let t = null;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  function _render() {
    const container = document.getElementById('prusa-resources-panel');
    if (!container) return;
    const lastFetch = _refreshStatus[0]?.last_fetched_at;
    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><i class="bi bi-database"></i> Prusa Resources</h3>
          <div class="card-tools">
            ${lastFetch ? `<span class="text-muted small me-2">Last refresh: ${new Date(lastFetch).toLocaleString()}</span>` : ''}
            <button class="btn btn-sm btn-primary" onclick="window._prusaRefresh()">
              <i class="bi bi-cloud-download"></i> Refresh
            </button>
          </div>
        </div>
        <div class="card-body">
          <ul class="nav nav-tabs mb-3">
            <li class="nav-item"><a class="nav-link prusa-tab ${_activeTab === 'filaments' ? 'active' : ''}" data-tab="filaments" href="#" onclick="return window._prusaTab('filaments')">Filaments</a></li>
            <li class="nav-item"><a class="nav-link prusa-tab ${_activeTab === 'print-profiles' ? 'active' : ''}" data-tab="print-profiles" href="#" onclick="return window._prusaTab('print-profiles')">Print Profiles</a></li>
            <li class="nav-item"><a class="nav-link prusa-tab ${_activeTab === 'printer-profiles' ? 'active' : ''}" data-tab="printer-profiles" href="#" onclick="return window._prusaTab('printer-profiles')">Printer Models</a></li>
            <li class="nav-item"><a class="nav-link prusa-tab ${_activeTab === 'errors' ? 'active' : ''}" data-tab="errors" href="#" onclick="return window._prusaTab('errors')">Error Codes</a></li>
            <li class="nav-item"><a class="nav-link prusa-tab ${_activeTab === 'gcodes' ? 'active' : ''}" data-tab="gcodes" href="#" onclick="return window._prusaTab('gcodes')">G-code Reference</a></li>
          </ul>
          <div id="prusa-tab-content"></div>
        </div>
      </div>`;
    _loadTab(_activeTab);
  }

  window._prusaTab = (tab) => { _loadTab(tab); return false; };
  window._prusaRefresh = _refreshNow;
  window.loadPrusaResourcesPanel = async () => {
    await _fetchRefreshStatus();
    _render();
  };
})();
