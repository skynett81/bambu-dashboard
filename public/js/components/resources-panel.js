// Multi-brand Resources Panel — Prusa + Bambu + Klipper + Snapmaker + OctoPrint
(function() {
  'use strict';

  const _esc = (s) => { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; };
  let _activeBrand = 'prusa';
  let _activeTab = 'filaments';
  let _prusaRefreshStatus = [];
  let _brandRefreshStatus = [];

  const BRANDS = [
    { id: 'prusa', label: 'Prusa', icon: 'bi-printer', tabs: ['filaments', 'print-profiles', 'printer-profiles', 'errors', 'gcodes'] },
    { id: 'bambu', label: 'Bambu Lab', icon: 'bi-gem', tabs: ['errors', 'gcodes'] },
    { id: 'klipper', label: 'Klipper', icon: 'bi-cpu', tabs: ['gcodes'] },
    { id: 'snapmaker', label: 'Snapmaker', icon: 'bi-hexagon', tabs: ['errors', 'gcodes'] },
    { id: 'octoprint', label: 'OctoPrint', icon: 'bi-plug', tabs: ['plugins'] },
  ];

  async function _fetchRefreshStatus() {
    try {
      const [prusa, brands] = await Promise.all([
        fetch('/api/prusa/refresh-status').then(r => r.ok ? r.json() : []),
        fetch('/api/brands/refresh-status').then(r => r.ok ? r.json() : []),
      ]);
      _prusaRefreshStatus = Array.isArray(prusa) ? prusa : [];
      _brandRefreshStatus = Array.isArray(brands) ? brands : [];
    } catch {}
  }

  async function _refreshNow() {
    try {
      await Promise.all([
        fetch('/api/prusa/refresh', { method: 'POST' }),
        fetch('/api/brands/refresh', { method: 'POST' }),
      ]);
      if (window.showToast) window.showToast('Resource refresh started — this may take a minute', 'info');
      setTimeout(() => { _fetchRefreshStatus(); _render(); }, 30000);
    } catch (e) {
      if (window.showToast) window.showToast('Refresh failed: ' + e.message, 'error');
    }
  }

  async function _loadTab(brand, tab) {
    _activeBrand = brand;
    _activeTab = tab;
    const content = document.getElementById('res-tab-content');
    if (!content) return;
    content.innerHTML = '<div class="text-center p-3"><i class="bi bi-arrow-repeat spin"></i> Loading…</div>';

    try {
      if (brand === 'prusa') {
        if (tab === 'filaments') await _renderPrusaFilaments(content);
        else if (tab === 'print-profiles') await _renderPrusaPrintProfiles(content);
        else if (tab === 'printer-profiles') await _renderPrusaPrinterProfiles(content);
        else if (tab === 'errors') await _renderPrusaErrors(content);
        else if (tab === 'gcodes') await _renderPrusaGcodes(content);
      } else if (tab === 'errors') {
        await _renderBrandErrors(content, brand);
      } else if (tab === 'gcodes') {
        await _renderBrandGcodes(content, brand);
      } else if (tab === 'plugins' && brand === 'octoprint') {
        await _renderOctoPrintPlugins(content);
      }
    } catch (e) {
      content.innerHTML = `<div class="alert alert-danger">${_esc(e.message)}</div>`;
    }

    document.querySelectorAll('.res-tab').forEach(el => el.classList.toggle('active', el.dataset.tab === tab));
  }

  // ── Prusa renderers (kept from original) ──

  async function _renderPrusaFilaments(container) {
    const q = document.getElementById('res-search')?.value || '';
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    params.set('limit', '200');
    const res = await fetch('/api/prusa/filaments?' + params);
    const data = await res.json();
    const rows = Array.isArray(data) ? data : [];
    if (rows.length === 0) {
      container.innerHTML = `<div class="alert alert-info mb-0">No filament profiles. <button class="btn btn-sm btn-primary ms-2" onclick="window._resRefresh()">Import</button></div>`;
      return;
    }
    container.innerHTML = `
      <div class="mb-3 d-flex gap-2">
        <input type="text" class="form-control form-control-sm" id="res-search" placeholder="Search..." value="${_esc(q)}" style="max-width:240px">
        <span class="text-muted small align-self-center">${rows.length} profiles</span>
      </div>
      <div class="table-responsive" style="max-height:600px;overflow-y:auto">
        <table class="table table-sm table-hover">
          <thead class="sticky-top" style="background:var(--bs-body-bg)">
            <tr><th>Vendor</th><th>Material</th><th>Profile</th><th>Nozzle</th><th>Bed</th><th>Density</th></tr>
          </thead>
          <tbody>
            ${rows.map(i => `
              <tr>
                <td>${_esc(i.vendor)}</td>
                <td><span class="badge text-bg-secondary">${_esc(i.material_type || '?')}</span></td>
                <td>${_esc(i.profile_name)}</td>
                <td>${i.nozzle_temp || '?'}°C</td>
                <td>${i.bed_temp || '?'}°C</td>
                <td>${i.density ? i.density + ' g/cm³' : '--'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
    const searchEl = document.getElementById('res-search');
    if (searchEl) searchEl.addEventListener('input', _debounce(() => _loadTab('prusa', 'filaments'), 400));
  }

  async function _renderPrusaPrintProfiles(container) {
    const res = await fetch('/api/prusa/print-profiles?limit=200');
    const items = await res.json();
    if (!Array.isArray(items) || items.length === 0) {
      container.innerHTML = '<div class="alert alert-info mb-0">No print profiles.</div>';
      return;
    }
    container.innerHTML = `
      <div class="table-responsive" style="max-height:600px;overflow-y:auto">
        <table class="table table-sm table-hover">
          <thead class="sticky-top" style="background:var(--bs-body-bg)">
            <tr><th>Vendor</th><th>Profile</th><th>Layer</th><th>Infill</th><th>Pattern</th></tr>
          </thead>
          <tbody>
            ${items.map(i => `
              <tr>
                <td>${_esc(i.vendor)}</td>
                <td>${_esc(i.profile_name)}</td>
                <td>${i.layer_height ? i.layer_height + ' mm' : '--'}</td>
                <td>${i.infill_density ? i.infill_density + '%' : '--'}</td>
                <td>${_esc(i.infill_pattern || '--')}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  async function _renderPrusaPrinterProfiles(container) {
    const res = await fetch('/api/prusa/printer-profiles');
    const items = await res.json();
    if (!Array.isArray(items) || items.length === 0) {
      container.innerHTML = '<div class="alert alert-info mb-0">No printer profiles.</div>';
      return;
    }
    container.innerHTML = `
      <div class="row g-2" style="max-height:600px;overflow-y:auto">
        ${items.map(i => `
          <div class="col-md-6 col-lg-4">
            <div class="card h-100">
              <div class="card-body p-3">
                <h6 class="card-title mb-1"><i class="bi bi-printer"></i> ${_esc(i.profile_name)}</h6>
                <div class="text-muted small">${_esc(i.vendor)}${i.family ? ' · ' + _esc(i.family) : ''}</div>
                ${i.technology ? `<div class="small mt-1"><strong>Tech:</strong> ${_esc(i.technology)}</div>` : ''}
              </div>
            </div>
          </div>`).join('')}
      </div>`;
  }

  async function _renderPrusaErrors(container) {
    return _renderErrorList(container, '/api/prusa/errors', 'prusa');
  }

  async function _renderPrusaGcodes(container) {
    return _renderGcodeList(container, '/api/prusa/gcodes', 'prusa');
  }

  async function _renderBrandErrors(container, brand) {
    return _renderErrorList(container, '/api/brands/errors?brand=' + brand, brand);
  }

  async function _renderBrandGcodes(container, brand) {
    return _renderGcodeList(container, '/api/brands/gcodes?brand=' + brand, brand);
  }

  async function _renderOctoPrintPlugins(container) {
    const q = document.getElementById('res-search')?.value || '';
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    params.set('limit', '100');
    const res = await fetch('/api/brands/octoprint-plugins?' + params);
    const data = await res.json();
    const items = Array.isArray(data) ? data : [];

    if (items.length === 0) {
      container.innerHTML = '<div class="alert alert-info mb-0">No OctoPrint plugins imported yet. The catalog is fetched on startup.</div>';
      return;
    }

    container.innerHTML = `
      <div class="mb-3 d-flex gap-2">
        <input type="text" class="form-control form-control-sm" id="res-search" placeholder="Search plugins..." value="${_esc(q)}" style="max-width:240px">
        <span class="text-muted small align-self-center">${items.length} plugins</span>
      </div>
      <div class="row g-2" style="max-height:600px;overflow-y:auto">
        ${items.map(p => `
          <div class="col-md-6 col-lg-4">
            <div class="card h-100">
              <div class="card-body p-3">
                <h6 class="card-title mb-1">${_esc(p.title || p.id)}</h6>
                <div class="text-muted small mb-2">by ${_esc(p.author || 'Unknown')}</div>
                <p class="small mb-2" style="max-height:60px;overflow:hidden">${_esc((p.description || '').slice(0, 150))}</p>
                ${p.homepage ? `<a href="${_esc(p.homepage)}" target="_blank" rel="noopener" class="btn btn-sm btn-outline-primary"><i class="bi bi-box-arrow-up-right"></i> Open</a>` : ''}
              </div>
            </div>
          </div>`).join('')}
      </div>`;
    const searchEl = document.getElementById('res-search');
    if (searchEl) searchEl.addEventListener('input', _debounce(() => _loadTab('octoprint', 'plugins'), 400));
  }

  // Generic error list (Prusa + Bambu + Snapmaker)
  async function _renderErrorList(container, apiPath, brand) {
    const q = document.getElementById('res-err-search')?.value || '';
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    params.set('limit', '200');
    const sep = apiPath.includes('?') ? '&' : '?';
    const res = await fetch(apiPath + sep + params);
    const data = await res.json();
    const items = Array.isArray(data) ? data : [];

    if (items.length === 0) {
      container.innerHTML = '<div class="alert alert-info mb-0">No error codes imported yet.</div>';
      return;
    }

    container.innerHTML = `
      <div class="mb-3 d-flex gap-2">
        <input type="text" class="form-control form-control-sm" id="res-err-search" placeholder="Search..." value="${_esc(q)}" style="max-width:240px">
        <span class="text-muted small align-self-center">${items.length} errors</span>
      </div>
      <div style="max-height:600px;overflow-y:auto">
        ${items.map(e => {
          const catColor = { 'Mechanical': 'warning', 'Temperature': 'danger', 'Electrical': 'danger', 'Connectivity': 'info', 'System': 'secondary', 'Bootloader': 'secondary', 'Warnings': 'warning', 'Connect': 'info', 'AMS': 'primary', 'AI': 'info', 'Bed': 'danger', 'Nozzle': 'danger', 'Filament': 'primary', 'Tool': 'secondary', 'Power': 'warning', 'Purifier': 'info', 'Toolchanger': 'secondary' }[e.category] || 'secondary';
          const title = e.title || 'Untitled';
          const descr = e.description || e.text || '';
          const action = Array.isArray(e.actions) ? e.actions.join(', ') : (e.actions || e.action || '');
          return `
            <div class="card mb-2">
              <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                  <div>
                    <code class="me-2">${_esc(e.code)}</code>
                    <strong>${_esc(title)}</strong>
                  </div>
                  <div>
                    <span class="badge text-bg-${catColor}">${_esc(e.category || 'Unknown')}</span>
                    <span class="badge text-bg-dark">${_esc(e.printer_model || '--')}</span>
                    ${e.severity ? `<span class="badge text-bg-${e.severity === 'serious' || e.severity === 'fatal' ? 'danger' : 'warning'}">${_esc(e.severity)}</span>` : ''}
                  </div>
                </div>
                ${descr ? `<div class="mt-2 small">${_esc(descr)}</div>` : ''}
                ${action ? `<div class="mt-1 small text-muted"><strong>Action:</strong> ${_esc(action)}</div>` : ''}
                ${e.wiki_url ? `<div class="mt-1"><a href="${_esc(e.wiki_url)}" target="_blank" rel="noopener" class="small"><i class="bi bi-box-arrow-up-right"></i> Wiki</a></div>` : ''}
              </div>
            </div>`;
        }).join('')}
      </div>`;
    const searchEl = document.getElementById('res-err-search');
    if (searchEl) searchEl.addEventListener('input', _debounce(() => _loadTab(_activeBrand, 'errors'), 400));
  }

  // Generic G-code list (Prusa + Bambu + Klipper + Snapmaker)
  async function _renderGcodeList(container, apiPath, brand) {
    const q = document.getElementById('res-gcode-search')?.value || '';
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    const sep = apiPath.includes('?') ? '&' : '?';
    const res = await fetch(apiPath + sep + params);
    const data = await res.json();
    const items = Array.isArray(data) ? data : [];

    if (items.length === 0) {
      container.innerHTML = '<div class="alert alert-info mb-0">No G-code reference imported yet.</div>';
      return;
    }

    container.innerHTML = `
      <div class="mb-3 d-flex gap-2">
        <input type="text" class="form-control form-control-sm" id="res-gcode-search" placeholder="Search G-codes..." value="${_esc(q)}" style="max-width:240px">
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
              <div class="mt-2 small">${_esc(c.description || '')}</div>
              ${c.parameters ? `<div class="mt-1 small"><strong>Params:</strong> <code>${_esc(c.parameters)}</code></div>` : ''}
              ${c.example ? `<div class="mt-1 small"><strong>Example:</strong> <code>${_esc(c.example)}</code></div>` : ''}
              ${c.source_url ? `<div class="mt-1"><a href="${_esc(c.source_url)}" target="_blank" rel="noopener" class="small"><i class="bi bi-box-arrow-up-right"></i> Docs</a></div>` : ''}
            </div>
          </div>`).join('')}
      </div>`;
    const searchEl = document.getElementById('res-gcode-search');
    if (searchEl) searchEl.addEventListener('input', _debounce(() => _loadTab(_activeBrand, 'gcodes'), 400));
  }

  function _debounce(fn, ms) {
    let t = null;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  function _render() {
    const container = document.getElementById('resources-panel');
    if (!container) return;
    const activeBrand = BRANDS.find(b => b.id === _activeBrand) || BRANDS[0];

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><i class="bi bi-database"></i> Printer Resources</h3>
          <div class="card-tools">
            <button class="btn btn-sm btn-primary" onclick="window._resRefresh()">
              <i class="bi bi-cloud-download"></i> Refresh
            </button>
          </div>
        </div>
        <div class="card-body">
          <!-- Brand switcher -->
          <div class="d-flex gap-2 mb-3 flex-wrap">
            ${BRANDS.map(b => `
              <button class="btn btn-sm ${b.id === _activeBrand ? 'btn-primary' : 'btn-outline-secondary'}" onclick="window._resSetBrand('${b.id}')">
                <i class="bi ${b.icon}"></i> ${b.label}
              </button>`).join('')}
          </div>
          <!-- Tab navigation (brand-specific) -->
          <ul class="nav nav-tabs mb-3">
            ${activeBrand.tabs.map(tab => `
              <li class="nav-item">
                <a class="nav-link res-tab ${tab === _activeTab ? 'active' : ''}" data-tab="${tab}" href="#" onclick="return window._resSetTab('${tab}')">
                  ${_tabLabel(tab)}
                </a>
              </li>`).join('')}
          </ul>
          <div id="res-tab-content"></div>
        </div>
      </div>`;
    // Ensure active tab is valid for active brand
    if (!activeBrand.tabs.includes(_activeTab)) _activeTab = activeBrand.tabs[0];
    _loadTab(_activeBrand, _activeTab);
  }

  function _tabLabel(tab) {
    const labels = {
      'filaments': 'Filaments',
      'print-profiles': 'Print Profiles',
      'printer-profiles': 'Printer Models',
      'errors': 'Error Codes',
      'gcodes': 'G-code Reference',
      'plugins': 'Plugins',
    };
    return labels[tab] || tab;
  }

  window._resSetBrand = (brand) => { _activeBrand = brand; _render(); return false; };
  window._resSetTab = (tab) => { _loadTab(_activeBrand, tab); return false; };
  window._resRefresh = _refreshNow;
  window.loadResourcesPanel = async () => {
    await _fetchRefreshStatus();
    _render();
  };
})();
