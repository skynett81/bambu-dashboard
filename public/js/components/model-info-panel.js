// Model Info — Dashboard strip + sidebar panel (MakerWorld, Printables, Thingiverse)
(function() {
  const SOURCE_COLORS = {
    makerworld:  { bg: 'rgba(18,121,255,0.15)', border: 'rgba(18,121,255,0.4)', text: '#1279ff', label: 'MakerWorld' },
    printables:  { bg: 'rgba(255,128,0,0.15)', border: 'rgba(255,128,0,0.4)', text: '#ff8000', label: 'Printables' },
    thingiverse: { bg: 'rgba(0,200,220,0.15)', border: 'rgba(0,200,220,0.4)', text: '#00c8dc', label: 'Thingiverse' }
  };

  let _currentProjectId = '';
  let _currentModelData = null;
  let _fetching = false;
  let _currentFilename = '';

  // ---- Dashboard strip (replaces old MakerWorld strip) ----

  window.updateModelInfo = function(data, isActive) {
    const strip = document.getElementById('model-info');
    if (!strip) return;

    if (!isActive) {
      strip.style.display = 'none';
      _currentProjectId = '';
      _currentModelData = null;
      _currentFilename = '';
      return;
    }

    const projectId = data.project_id;
    const filename = data.subtask_name || data.gcode_file || '';
    _currentFilename = filename;

    // MakerWorld auto-detect via project_id
    if (projectId && projectId !== '0') {
      if (projectId === _currentProjectId && _currentModelData !== null) return;
      _currentProjectId = projectId;
      _currentModelData = null;

      if (_fetching) return;
      _fetching = true;

      strip.style.display = '';
      strip.innerHTML = `<span class="mi-loading">${t('model_info.loading')}</span>`;

      fetch(`/api/makerworld/${projectId}`)
        .then(r => r.ok ? r.json() : null)
        .then(info => {
          _currentModelData = info ? { ...info, source: 'makerworld', source_id: projectId } : null;
          renderStrip(strip);
        })
        .catch(() => {
          _currentModelData = { url: `https://makerworld.com/en/models/${projectId}`, source: 'makerworld', source_id: projectId, fallback: true };
          renderStrip(strip);
        })
        .finally(() => { _fetching = false; });
      return;
    }

    // Check for manually linked model
    _currentProjectId = '';
    const printerId = window.printerState?.getActivePrinterId();
    if (printerId && filename) {
      checkLinkedModel(strip, printerId, filename);
    } else {
      strip.style.display = 'none';
    }
  };

  function checkLinkedModel(strip, printerId, filename) {
    fetch(`/api/model-link/${encodeURIComponent(printerId)}?filename=${encodeURIComponent(filename)}`)
      .then(r => r.ok ? r.json() : null)
      .then(link => {
        if (link) {
          _currentModelData = link;
          strip.style.display = '';
          renderStrip(strip);
        } else {
          // No link — show small "link model" button
          strip.style.display = '';
          strip.innerHTML = `<button class="mi-link-btn" onclick="openPanel('modelinfo')" title="${t('model_info.link_model')}">`
            + `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>`
            + ` ${t('model_info.link_model')}</button>`;
        }
      })
      .catch(() => { strip.style.display = 'none'; });
  }

  function renderStrip(strip) {
    const data = _currentModelData;
    if (!data) { strip.style.display = 'none'; return; }

    const src = SOURCE_COLORS[data.source] || SOURCE_COLORS.makerworld;
    let html = `<span class="mi-source-badge" style="background:${src.bg};border-color:${src.border};color:${src.text}">${src.label}</span>`;

    if (data.image) {
      html += `<img class="mi-thumb" src="${esc(data.image)}" alt="" onerror="this.style.display='none'">`;
    }

    const url = data.url || '#';
    html += `<div class="mi-info">`;
    html += `<a class="mi-title" href="${esc(url)}" target="_blank" rel="noopener">${esc(data.title || t('model_info.unknown'))}</a>`;
    const parts = [];
    if (data.designer) parts.push(esc(data.designer));
    if (data.downloads > 0) parts.push(`${data.downloads} \u2B07`);
    if (data.likes > 0) parts.push(`${data.likes} \u2764`);
    if (parts.length) html += `<span class="mi-meta">${parts.join(' \u00B7 ')}</span>`;
    html += `</div>`;

    html += `<a class="mi-open" href="${esc(url)}" target="_blank" rel="noopener" title="${src.label}">`
      + `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>`;

    strip.innerHTML = html;
    strip.onclick = (e) => {
      if (e.target.closest('a')) return;
      openPanel('modelinfo');
    };
  }

  // ---- Sidebar Panel ----

  window.loadModelInfoPanel = function() {
    const container = document.getElementById('overlay-panel-body');
    if (!container) return;

    let html = `<div class="mi-panel">`;

    // Section 1: Active Model
    html += `<div class="mi-section">`;
    html += `<h3 class="mi-section-title">${t('model_info.active_model')}</h3>`;
    html += `<div id="mi-active-model" class="mi-active-model"></div>`;
    html += `</div>`;

    // Section 2: Search
    html += `<div class="mi-section">`;
    html += `<h3 class="mi-section-title">${t('model_info.search_models')}</h3>`;
    html += `<div class="mi-search-bar">`;
    html += `<input type="text" id="mi-search-input" class="mi-input" placeholder="${t('model_info.search_placeholder')}">`;
    html += `<select id="mi-search-source" class="mi-select">`;
    html += `<option value="all">${t('model_info.all_sources')}</option>`;
    html += `<option value="printables">Printables</option>`;
    html += `<option value="makerworld">MakerWorld</option>`;
    html += `<option value="thingiverse">Thingiverse</option>`;
    html += `</select>`;
    html += `<button id="mi-search-btn" class="mi-btn" data-ripple>${t('model_info.search')}</button>`;
    html += `</div>`;
    html += `<div id="mi-search-results" class="mi-search-results"></div>`;
    html += `</div>`;

    // Section 3: Link by URL
    html += `<div class="mi-section">`;
    html += `<h3 class="mi-section-title">${t('model_info.link_by_url')}</h3>`;
    html += `<div class="mi-search-bar">`;
    html += `<input type="text" id="mi-url-input" class="mi-input" placeholder="${t('model_info.url_placeholder')}">`;
    html += `<button id="mi-url-btn" class="mi-btn" data-ripple>${t('model_info.link')}</button>`;
    html += `</div>`;
    html += `<div id="mi-url-status"></div>`;
    html += `</div>`;

    // Section 4: Recent Links
    html += `<div class="mi-section mi-section-full">`;
    html += `<h3 class="mi-section-title">${t('model_info.recent_links')}</h3>`;
    html += `<div id="mi-recent-links" class="mi-recent-links"></div>`;
    html += `</div>`;

    html += `</div>`;
    container.innerHTML = html;

    // Render active model
    renderActiveModel();

    // Load recent links
    loadRecentLinks();

    // Search events
    const searchBtn = document.getElementById('mi-search-btn');
    const searchInput = document.getElementById('mi-search-input');
    searchBtn.addEventListener('click', doSearch);
    searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });

    // URL link events
    const urlBtn = document.getElementById('mi-url-btn');
    const urlInput = document.getElementById('mi-url-input');
    urlBtn.addEventListener('click', linkByUrl);
    urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') linkByUrl(); });
  };

  function renderActiveModel() {
    const el = document.getElementById('mi-active-model');
    if (!el) return;

    if (!_currentModelData) {
      el.innerHTML = `<div class="mi-empty">${t('model_info.no_active_model')}</div>`;
      return;
    }

    const data = _currentModelData;
    const src = SOURCE_COLORS[data.source] || SOURCE_COLORS.makerworld;
    let html = `<div class="mi-active-card">`;

    if (data.image) {
      html += `<img class="mi-active-img" src="${esc(data.image)}" alt="" onerror="this.style.display='none'">`;
    }

    html += `<div class="mi-active-details">`;
    html += `<div class="mi-active-title">${esc(data.title || t('model_info.unknown'))}</div>`;
    if (data.designer) html += `<div class="mi-active-designer">${t('model_info.by')} ${esc(data.designer)}</div>`;
    html += `<div class="mi-active-meta">`;
    html += `<span class="mi-source-badge" style="background:${src.bg};border-color:${src.border};color:${src.text}">${src.label}</span>`;
    if (data.category) html += `<span class="mi-category-badge">${esc(data.category)}</span>`;
    if (data.downloads > 0) html += `<span>\u2B07 ${data.downloads}</span>`;
    if (data.likes > 0) html += `<span>\u2764 ${data.likes}</span>`;
    if (data.prints > 0) html += `<span>\uD83D\uDDA8 ${data.prints}</span>`;
    html += `</div>`;
    if (data.url) {
      html += `<a class="mi-active-link" href="${esc(data.url)}" target="_blank" rel="noopener">${t('model_info.view_on')} ${src.label} \u2192</a>`;
    }
    html += `</div></div>`;

    // Description
    if (data.description) {
      html += `<div class="mi-description">`;
      html += `<h4 class="mi-sub-title">${t('model_info.description')}</h4>`;
      html += `<p class="mi-desc-text">${esc(data.description)}</p>`;
      html += `</div>`;
    }

    // Print Settings
    const ps = data.print_settings;
    if (ps && typeof ps === 'object' && Object.keys(ps).length) {
      html += `<div class="mi-print-settings">`;
      html += `<h4 class="mi-sub-title">${t('model_info.print_settings')}</h4>`;
      html += `<div class="mi-settings-grid">`;
      const settingLabels = {
        printer: t('model_info.ps_printer'),
        printer_model: t('model_info.ps_printer_model'),
        rafts: t('model_info.ps_rafts'),
        supports: t('model_info.ps_supports'),
        resolution: t('model_info.ps_resolution'),
        infill: t('model_info.ps_infill'),
        filament: t('model_info.ps_filament'),
        layer_height: t('model_info.ps_layer_height')
      };
      for (const [key, val] of Object.entries(ps)) {
        const label = settingLabels[key] || key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
        html += `<div class="mi-setting-row"><span class="mi-setting-label">${esc(label)}</span><span class="mi-setting-value">${esc(String(val))}</span></div>`;
      }
      html += `</div></div>`;
    }

    el.innerHTML = html;
  }

  function doSearch() {
    const input = document.getElementById('mi-search-input');
    const source = document.getElementById('mi-search-source');
    const results = document.getElementById('mi-search-results');
    if (!input || !results) return;

    const q = input.value.trim();
    if (q.length < 2) return;

    results.innerHTML = `<div class="mi-loading">${t('model_info.searching')}</div>`;

    const searchBtn = document.getElementById('mi-search-btn');
    if (searchBtn) { searchBtn.disabled = true; searchBtn.dataset.loading = 'true'; }

    fetch(`/api/model-search?q=${encodeURIComponent(q)}&source=${source.value}`)
      .then(r => r.ok ? r.json() : [])
      .then(items => {
        if (searchBtn) { searchBtn.disabled = false; delete searchBtn.dataset.loading; }
        if (!items.length) {
          results.innerHTML = `<div class="mi-empty">${t('model_info.no_results')}</div>`;
          return;
        }
        results.innerHTML = items.map(item => renderSearchResult(item)).join('');

        // Bind link buttons
        results.querySelectorAll('.mi-result-link-btn').forEach(btn => {
          btn.addEventListener('click', () => linkModel(btn.dataset));
        });
      })
      .catch(() => {
        if (searchBtn) { searchBtn.disabled = false; delete searchBtn.dataset.loading; }
        results.innerHTML = `<div class="mi-empty">${t('model_info.search_error')}</div>`;
      });
  }

  function renderSearchResult(item) {
    const src = SOURCE_COLORS[item.source] || SOURCE_COLORS.makerworld;
    let html = `<div class="mi-result-card">`;
    if (item.image) {
      html += `<img class="mi-result-img" src="${esc(item.image)}" alt="" onerror="this.style.display='none'">`;
    } else {
      html += `<div class="mi-result-img-placeholder">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
      </div>`;
    }
    html += `<div class="mi-result-info">`;
    html += `<div class="mi-result-title">${esc(item.title)}</div>`;
    html += `<div class="mi-result-meta">`;
    html += `<span class="mi-source-badge" style="background:${src.bg};border-color:${src.border};color:${src.text}">${src.label}</span>`;
    if (item.designer) html += `<span>${esc(item.designer)}</span>`;
    if (item.downloads > 0) html += `<span>\u2B07 ${item.downloads}</span>`;
    if (item.likes > 0) html += `<span>\u2764 ${item.likes}</span>`;
    html += `</div>`;
    html += `</div>`;

    // Action buttons
    html += `<div class="mi-result-actions">`;
    // View link
    html += `<a class="mi-action-btn mi-action-view" href="${esc(item.url)}" target="_blank" rel="noopener" title="${t('model_info.view_on')} ${src.label}">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
    </a>`;
    // Link button
    const printerId = window.printerState?.getActivePrinterId() || '';
    const filename = _currentFilename;
    if (printerId && filename) {
      html += `<button class="mi-action-btn mi-action-link mi-result-link-btn" data-ripple `
        + `data-source="${esc(item.source)}" `
        + `data-source_id="${esc(item.source_id)}" `
        + `data-title="${esc(item.title)}" `
        + `data-url="${esc(item.url)}" `
        + `data-image="${esc(item.image || '')}" `
        + `data-designer="${esc(item.designer || '')}" `
        + `title="${t('model_info.link')}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
      </button>`;
    }
    html += `</div>`;

    html += `</div>`;
    return html;
  }

  // ---- Link by URL ----
  function linkByUrl() {
    const input = document.getElementById('mi-url-input');
    const status = document.getElementById('mi-url-status');
    if (!input || !status) return;

    const url = input.value.trim();
    if (!url) return;

    const printerId = window.printerState?.getActivePrinterId();
    if (!printerId || !_currentFilename) {
      status.innerHTML = `<div class="mi-empty">${t('model_info.no_active_model')}</div>`;
      return;
    }

    // Parse URL to determine source
    let source = null, sourceId = null;
    const mwMatch = url.match(/makerworld\.com\/.*?models?\/(\d+)/);
    const prMatch = url.match(/printables\.com\/model\/(\d+)/);
    const tvMatch = url.match(/thingiverse\.com\/thing:(\d+)/);

    if (mwMatch) { source = 'makerworld'; sourceId = mwMatch[1]; }
    else if (prMatch) { source = 'printables'; sourceId = prMatch[1]; }
    else if (tvMatch) { source = 'thingiverse'; sourceId = tvMatch[1]; }
    else {
      status.innerHTML = `<div class="mi-empty">${t('model_info.url_invalid')}</div>`;
      return;
    }

    status.innerHTML = `<div class="mi-loading">${t('model_info.loading')}</div>`;

    // Fetch details and link
    const apiMap = {
      makerworld: (id) => `/api/makerworld/${id}`,
      printables: (id) => `/api/printables/${id}`,
      thingiverse: (id) => `/api/thingiverse/${id}`
    };

    fetch(apiMap[source](sourceId))
      .then(r => r.ok ? r.json() : { url, source, fallback: true })
      .then(fullData => {
        const body = {
          filename: _currentFilename,
          source,
          source_id: sourceId,
          title: fullData.title || `${SOURCE_COLORS[source].label} #${sourceId}`,
          url: fullData.url || url,
          image: fullData.image || null,
          designer: fullData.designer || null,
          description: fullData.description || null,
          category: fullData.category || null,
          print_settings: fullData.print_settings || null
        };

        return fetch(`/api/model-link/${encodeURIComponent(printerId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }).then(r => r.ok ? r.json() : null).then(result => {
          if (result?.ok) {
            _currentModelData = { ...body };
            renderStrip(document.getElementById('model-info'));
            renderActiveModel();
            loadRecentLinks();
            input.value = '';
            const src = SOURCE_COLORS[source];
            status.innerHTML = `<div class="mi-url-success">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>${t('model_info.linked_success')}</span>
            </div>`;
          }
        });
      })
      .catch(() => {
        status.innerHTML = `<div class="mi-empty">${t('model_info.search_error')}</div>`;
      });
  }

  function linkModel(dataset) {
    const printerId = window.printerState?.getActivePrinterId();
    if (!printerId || !_currentFilename) return;

    // Fetch full details from source API first
    const apiMap = {
      makerworld: (id) => `/api/makerworld/${id}`,
      printables: (id) => `/api/printables/${id}`,
      thingiverse: (id) => `/api/thingiverse/${id}`
    };
    const detailUrl = apiMap[dataset.source]?.(dataset.source_id);

    const saveLink = (fullData) => {
      const body = {
        filename: _currentFilename,
        source: dataset.source,
        source_id: dataset.source_id,
        title: fullData.title || dataset.title,
        url: fullData.url || dataset.url,
        image: fullData.image || dataset.image,
        designer: fullData.designer || dataset.designer,
        description: fullData.description || null,
        category: fullData.category || null,
        print_settings: fullData.print_settings || null
      };

      fetch(`/api/model-link/${encodeURIComponent(printerId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      .then(r => r.ok ? r.json() : null)
      .then(result => {
        if (result?.ok) {
          _currentModelData = { ...body, source: body.source };
          renderStrip(document.getElementById('model-info'));
          renderActiveModel();
          loadRecentLinks();
        }
      });
    };

    if (detailUrl) {
      fetch(detailUrl)
        .then(r => r.ok ? r.json() : {})
        .then(saveLink)
        .catch(() => saveLink(dataset));
    } else {
      saveLink(dataset);
    }
  }

  function loadRecentLinks() {
    const el = document.getElementById('mi-recent-links');
    if (!el) return;

    fetch('/api/model-links/recent')
      .then(r => r.ok ? r.json() : [])
      .then(links => {
        if (!links.length) {
          el.innerHTML = `<div class="mi-empty">${t('model_info.no_recent')}</div>`;
          return;
        }
        el.innerHTML = links.map(link => {
          const src = SOURCE_COLORS[link.source] || SOURCE_COLORS.makerworld;
          return `<div class="mi-recent-card">
            <div class="mi-recent-card-accent" style="background:${src.text}"></div>
            <div class="mi-recent-card-body">
              <div class="mi-recent-card-top">
                <span class="mi-source-badge mi-source-badge-sm" style="background:${src.bg};border-color:${src.border};color:${src.text}">${src.label}</span>
                <a class="mi-recent-card-title" href="${esc(link.url)}" target="_blank" rel="noopener">${esc(link.title || link.source_id)}</a>
              </div>
              <div class="mi-recent-card-meta">
                <span class="mi-recent-file">${esc(link.filename)}</span>
              </div>
            </div>
          </div>`;
        }).join('');
      })
      .catch(() => {
        el.innerHTML = `<div class="mi-empty">${t('model_info.no_recent')}</div>`;
      });
  }
})();
