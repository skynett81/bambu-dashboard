// Knowledge Base Panel — printers, accessories, filaments, profiles
(function() {
  'use strict';

  const SECTIONS = {
    printers:    { label: 'kb.tab_printers',    color: '#00b4ff', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="2" width="12" height="20" rx="2"/><line x1="9" y1="22" x2="15" y2="22"/><line x1="12" y1="18" x2="12" y2="18.01"/></svg>' },
    accessories: { label: 'kb.tab_accessories',  color: '#f0883e', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>' },
    filaments:   { label: 'kb.tab_filaments',    color: '#00c864', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>' },
    profiles:    { label: 'kb.tab_profiles',     color: '#a855f7', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>' }
  };

  const ACC_FILTERS = ['all','ams','nozzle','build_plate','enclosure','tool','upgrade'];
  const FIL_FILTERS = ['all','standard','engineering','composite','flexible','support','specialty'];
  const PRINTER_FILTERS = ['all','A','P','X','H2'];
  const SORT_OPTIONS = {
    printers:    ['name_asc','name_desc','price_asc','price_desc','speed_desc','speed_asc','year_desc','year_asc'],
    accessories: ['name_asc','name_desc','price_asc','price_desc','category'],
    filaments:   ['name_asc','name_desc','material','brand','difficulty_asc','difficulty_desc','temp_asc','temp_desc'],
    profiles:    ['name_asc','name_desc','printer','material','speed_desc','speed_asc','difficulty_asc','difficulty_desc']
  };

  let _section = 'printers';
  let _search = '';
  let _filter = 'all';
  let _sort = 'name_asc';
  let _profileFilterPrinter = 'all';
  let _profileFilterMaterial = 'all';
  let _data = { printers: [], accessories: [], filaments: [], profiles: [] };
  let _stats = { printers: 0, accessories: 0, filaments: 0, profiles: 0 };

  // Use global formatFromUSD() and currencyCode() from i18n.js

  function _esc(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function _stars(n) { return '<span class="kb-stars">' + '★'.repeat(Math.min(n || 0, 5)) + '☆'.repeat(5 - Math.min(n || 0, 5)) + '</span>'; }

  function _parseJson(s) { try { return JSON.parse(s); } catch { return []; } }

  function _badges(arr, cls) {
    const list = typeof arr === 'string' ? _parseJson(arr) : (arr || []);
    return list.map(v => `<span class="${cls}">${_esc(v)}</span>`).join('');
  }

  // ---- Main load ----
  window.loadKnowledgePanel = async function() {
    const container = document.getElementById('overlay-panel-body');
    if (!container) return;

    try {
      const [printers, accessories, filaments, profiles, stats] = await Promise.all([
        fetch('/api/kb/printers').then(r => r.json()),
        fetch('/api/kb/accessories').then(r => r.json()),
        fetch('/api/kb/filaments').then(r => r.json()),
        fetch('/api/kb/profiles').then(r => r.json()),
        fetch('/api/kb/stats').then(r => r.json())
      ]);
      _data = { printers, accessories, filaments, profiles };
      _stats = stats;
      _render(container);
    } catch (e) {
      container.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:40px">${t('kb.load_failed')}</p>`;
    }
  };

  // ---- Render ----
  function _render(container) {
    if (!container) container = document.getElementById('overlay-panel-body');
    if (!container) return;

    let html = '';

    // Hero stats
    html += '<div class="kb-hero-grid stagger-in">';
    html += _heroCard(SECTIONS.printers.icon, _stats.printers, t('kb.tab_printers'), SECTIONS.printers.color, 0);
    html += _heroCard(SECTIONS.accessories.icon, _stats.accessories, t('kb.tab_accessories'), SECTIONS.accessories.color, 1);
    html += _heroCard(SECTIONS.filaments.icon, _stats.filaments, t('kb.tab_filaments'), SECTIONS.filaments.color, 2);
    html += _heroCard(SECTIONS.profiles.icon, _stats.profiles, t('kb.tab_profiles'), SECTIONS.profiles.color, 3);
    html += '</div>';

    // Search + Sort + Add
    html += `<div class="kb-search-bar">
      <input class="kb-search-input form-input" type="text" placeholder="${t('kb.search_placeholder')}" value="${_esc(_search)}" oninput="kbSearch(this.value)">
      <select class="kb-sort-select form-input" onchange="kbSort(this.value)">
        ${_renderSortOptions()}
      </select>
      <button class="form-btn form-btn-sm" onclick="kbOpenEdit('${_section}', null)" data-ripple>+ ${t('kb.add_new')}</button>
    </div>`;

    // Section tabs
    html += '<div class="kb-tabs">';
    for (const [key, cfg] of Object.entries(SECTIONS)) {
      const active = key === _section ? ' kb-tab-active' : '';
      html += `<button class="kb-tab-btn${active}" onclick="kbSwitchSection('${key}')" data-ripple>
        ${t(cfg.label)} <span class="kb-tab-count">${_stats[key] || 0}</span>
      </button>`;
    }
    html += '</div>';

    // Sub-filters
    html += _renderFilters();

    // Card grid
    const items = _getFilteredItems();
    if (items.length === 0) {
      html += `<div class="kb-empty">${t('kb.no_results')}</div>`;
    } else {
      html += '<div class="kb-card-grid stagger-in">';
      items.forEach((item, i) => {
        html += _renderCard(item, i);
      });
      html += '</div>';
    }

    container.innerHTML = html;

    // Apply stagger
    container.querySelectorAll('.stagger-in > *').forEach((el, i) => el.style.setProperty('--i', i));
  }

  function _heroCard(icon, value, label, color, idx) {
    return `<div class="kb-hero-card" style="--i:${idx}">
      <div class="kb-hero-icon" style="background:${color}15;color:${color}">${icon}</div>
      <div>
        <div class="kb-hero-value" style="color:${color}">${value}</div>
        <div class="kb-hero-label">${_esc(label)}</div>
      </div>
    </div>`;
  }

  function _renderSortOptions() {
    const opts = SORT_OPTIONS[_section] || [];
    return opts.map(key => {
      const sel = key === _sort ? ' selected' : '';
      return `<option value="${key}"${sel}>${t('kb.sort_' + key)}</option>`;
    }).join('');
  }

  function _renderFilters() {
    let html = '';

    if (_section === 'printers') {
      html += '<div class="kb-filters">';
      for (const f of PRINTER_FILTERS) {
        const active = f === _filter ? ' kb-filter-active' : '';
        const label = f === 'all' ? t('kb.filter_all') : f + '-' + t('kb.series');
        html += `<button class="kb-filter-chip${active}" onclick="kbFilter('${f}')" data-ripple>${label}</button>`;
      }
      html += '</div>';
    } else if (_section === 'accessories') {
      html += '<div class="kb-filters">';
      for (const f of ACC_FILTERS) {
        const active = f === _filter ? ' kb-filter-active' : '';
        html += `<button class="kb-filter-chip${active}" onclick="kbFilter('${f}')" data-ripple>${t('kb.filter_' + f)}</button>`;
      }
      html += '</div>';
    } else if (_section === 'filaments') {
      html += '<div class="kb-filters">';
      for (const f of FIL_FILTERS) {
        const active = f === _filter ? ' kb-filter-active' : '';
        html += `<button class="kb-filter-chip${active}" onclick="kbFilter('${f}')" data-ripple>${t('kb.filter_' + f)}</button>`;
      }
      html += '</div>';
    } else if (_section === 'profiles') {
      // Gather unique printer models and materials from data
      const printerModels = [...new Set((_data.profiles || []).map(p => p.printer_model).filter(Boolean))].sort();
      const materials = [...new Set((_data.profiles || []).map(p => p.filament_material).filter(Boolean))].sort();
      html += '<div class="kb-filters">';
      html += `<button class="kb-filter-chip${_profileFilterPrinter === 'all' ? ' kb-filter-active' : ''}" onclick="kbFilterProfile('printer','all')" data-ripple>${t('kb.all_printers')}</button>`;
      for (const m of printerModels) {
        const active = _profileFilterPrinter === m ? ' kb-filter-active' : '';
        html += `<button class="kb-filter-chip${active}" onclick="kbFilterProfile('printer','${_esc(m)}')" data-ripple>${_esc(m)}</button>`;
      }
      html += '<span class="kb-filter-divider"></span>';
      html += `<button class="kb-filter-chip${_profileFilterMaterial === 'all' ? ' kb-filter-active' : ''}" onclick="kbFilterProfile('material','all')" data-ripple>${t('kb.all_materials')}</button>`;
      for (const m of materials) {
        const active = _profileFilterMaterial === m ? ' kb-filter-active' : '';
        html += `<button class="kb-filter-chip${active}" onclick="kbFilterProfile('material','${_esc(m)}')" data-ripple>${_esc(m)}</button>`;
      }
      html += '</div>';
    }

    return html;
  }

  function _getFilteredItems() {
    let items = [...(_data[_section] || [])];

    // Search
    if (_search) {
      const q = _search.toLowerCase();
      items = items.filter(item => JSON.stringify(item).toLowerCase().includes(q));
    }

    // Sub-filter
    if (_section === 'printers' && _filter !== 'all') {
      items = items.filter(i => {
        const model = (i.model || '').toUpperCase();
        if (_filter === 'A') return model.startsWith('A');
        if (_filter === 'P') return model.startsWith('P');
        if (_filter === 'X') return model.startsWith('X');
        if (_filter === 'H2') return model.startsWith('H2');
        return true;
      });
    } else if (_section === 'accessories' && _filter !== 'all') {
      items = items.filter(i => i.category === _filter);
    } else if (_section === 'filaments' && _filter !== 'all') {
      items = items.filter(i => i.category === _filter);
    } else if (_section === 'profiles') {
      if (_profileFilterPrinter !== 'all') items = items.filter(i => i.printer_model === _profileFilterPrinter);
      if (_profileFilterMaterial !== 'all') items = items.filter(i => i.filament_material === _profileFilterMaterial);
    }

    // Sort
    items.sort(_comparator());
    return items;
  }

  function _comparator() {
    const s = _sort;
    const dir = s.endsWith('_desc') ? -1 : 1;
    const strCmp = (a, b) => (a || '').localeCompare(b || '', undefined, { sensitivity: 'base' });
    const numCmp = (a, b) => ((a || 0) - (b || 0));

    return (a, b) => {
      if (s === 'name_asc' || s === 'name_desc') {
        const aName = a.full_name || a.name || [a.brand, a.material, a.variant].filter(Boolean).join(' ');
        const bName = b.full_name || b.name || [b.brand, b.material, b.variant].filter(Boolean).join(' ');
        return strCmp(aName, bName) * dir;
      }
      if (s === 'price_asc' || s === 'price_desc') return numCmp(a.price_usd, b.price_usd) * dir;
      if (s === 'speed_asc' || s === 'speed_desc') return numCmp(a.max_speed || a.print_speed, b.max_speed || b.print_speed) * dir;
      if (s === 'year_asc' || s === 'year_desc') return numCmp(a.release_year, b.release_year) * dir;
      if (s === 'difficulty_asc' || s === 'difficulty_desc') return numCmp(a.difficulty, b.difficulty) * dir;
      if (s === 'temp_asc' || s === 'temp_desc') return numCmp(a.nozzle_temp_min, b.nozzle_temp_min) * dir;
      if (s === 'category') return strCmp(a.category, b.category);
      if (s === 'material') return strCmp(a.material || a.filament_material, b.material || b.filament_material);
      if (s === 'brand') return strCmp(a.brand || a.filament_brand, b.brand || b.filament_brand);
      if (s === 'printer') return strCmp(a.printer_model, b.printer_model);
      return 0;
    };
  }

  // ---- Card renderers ----
  function _renderCard(item, idx) {
    if (_section === 'printers') return _printerCard(item, idx);
    if (_section === 'accessories') return _accessoryCard(item, idx);
    if (_section === 'filaments') return _filamentCard(item, idx);
    if (_section === 'profiles') return _profileCard(item, idx);
    return '';
  }

  function _printerCard(p, idx) {
    const features = [];
    if (p.has_ams) features.push('AMS');
    if (p.has_enclosure) features.push('Encl');
    if (p.has_lidar) features.push('Lidar');
    if (p.has_camera) features.push('Cam');
    const featureHtml = features.map(f => `<span class="kb-feature-icon kb-feature-on" title="${f}">${f[0]}</span>`).join('');

    return `<div class="kb-card" onclick="kbOpenDetail('printers', ${p.id})" style="--i:${idx}">
      <div class="kb-card-header">
        <div>
          <div class="kb-card-title">${_esc(p.full_name)}</div>
          <div class="kb-card-meta">
            <span class="kb-cat-badge">${_esc(p.model)}</span>
            ${p.release_year ? `<span class="kb-cat-badge">${p.release_year}</span>` : ''}
          </div>
        </div>
        <div class="kb-feature-icons">${featureHtml}</div>
      </div>
      <div class="kb-card-desc">${_esc(p.build_volume)} &middot; ${p.max_speed || '--'}mm/s</div>
      <div class="kb-card-footer">
        ${_badges(p.supported_filaments, 'kb-compat-badge')}
        ${p.price_usd ? `<span class="kb-card-price">${formatFromUSD(p.price_usd)}</span>` : ''}
      </div>
    </div>`;
  }

  function _accessoryCard(a, idx) {
    return `<div class="kb-card" onclick="kbOpenDetail('accessories', ${a.id})" style="--i:${idx}">
      <div class="kb-card-header">
        <div class="kb-card-title">${_esc(a.name)}</div>
        <span class="kb-cat-badge" style="background:${SECTIONS.accessories.color}15;color:${SECTIONS.accessories.color}">${t('kb.filter_' + a.category) || a.category}</span>
      </div>
      <div class="kb-card-desc">${_esc(a.description)}</div>
      <div class="kb-card-footer">
        ${_badges(a.compatible_printers, 'kb-compat-badge')}
        ${a.price_usd ? `<span class="kb-card-price">${formatFromUSD(a.price_usd)}</span>` : ''}
      </div>
    </div>`;
  }

  function _filamentCard(f, idx) {
    const name = [f.brand, f.material, f.variant].filter(Boolean).join(' ');
    const tempStr = f.nozzle_temp_min && f.nozzle_temp_max ? `${f.nozzle_temp_min}-${f.nozzle_temp_max}°C` : '';
    return `<div class="kb-card" onclick="kbOpenDetail('filaments', ${f.id})" style="--i:${idx}">
      <div class="kb-card-header">
        <div>
          <div class="kb-card-title">${_esc(name)}</div>
          <div class="kb-card-meta">
            <span class="kb-cat-badge" style="background:${SECTIONS.filaments.color}15;color:${SECTIONS.filaments.color}">${t('kb.filter_' + f.category) || f.category}</span>
            ${_stars(f.difficulty)}
          </div>
        </div>
      </div>
      <div class="kb-card-desc">
        ${tempStr ? `<span class="kb-temp-range">${t('kb.nozzle_temp')}: ${tempStr}</span>` : ''}
        ${f.enclosure_required ? ` &middot; ${t('kb.enclosure_required')}` : ''}
        ${f.abrasive ? ' &middot; Abrasive' : ''}
      </div>
      <div style="display:flex;flex-direction:column;gap:3px">
        ${_propBar(t('kb.strength'), f.strength, '#00c864')}
        ${_propBar(t('kb.flexibility'), f.flexibility, '#00b4ff')}
        ${_propBar(t('kb.heat_resistance'), f.heat_resistance, '#f0883e')}
      </div>
    </div>`;
  }

  function _profileCard(p, idx) {
    return `<div class="kb-card" onclick="kbOpenDetail('profiles', ${p.id})" style="--i:${idx}">
      <div class="kb-card-header">
        <div class="kb-card-title">${_esc(p.name)}</div>
        ${_stars(p.difficulty)}
      </div>
      <div class="kb-card-meta">
        ${p.printer_model ? `<span class="kb-compat-badge">${_esc(p.printer_model)}</span>` : ''}
        ${p.filament_material ? `<span class="kb-cat-badge" style="background:${SECTIONS.filaments.color}15;color:${SECTIONS.filaments.color}">${_esc(p.filament_material)}</span>` : ''}
        ${p.filament_brand ? `<span class="kb-cat-badge">${_esc(p.filament_brand)}</span>` : ''}
      </div>
      <div class="kb-card-desc">
        ${p.nozzle_size ? `${t('kb.nozzle_size')}: ${p.nozzle_size}mm` : ''}
        ${p.layer_height ? ` &middot; ${t('kb.layer_height')}: ${p.layer_height}mm` : ''}
        ${p.print_speed ? ` &middot; ${p.print_speed}mm/s` : ''}
      </div>
      ${p.description ? `<div class="kb-card-desc">${_esc(p.description)}</div>` : ''}
    </div>`;
  }

  function _propBar(label, value, color) {
    const pct = Math.min((value || 0) / 5 * 100, 100);
    return `<div class="kb-prop-row">
      <span class="kb-prop-label">${_esc(label)}</span>
      <div class="kb-prop-bar-wrap"><div class="kb-prop-bar" style="width:${pct}%;background:${color}"></div></div>
    </div>`;
  }

  // ---- Detail modals ----
  window.kbOpenDetail = async function(section, id) {
    let item;
    try {
      item = await fetch(`/api/kb/${section}/${id}`).then(r => r.json());
    } catch { return; }
    if (!item || item.error) return;

    const overlay = document.createElement('div');
    overlay.className = 'kb-detail-overlay';

    let body = '';
    if (section === 'printers') body = _printerDetail(item);
    else if (section === 'accessories') body = _accessoryDetail(item);
    else if (section === 'filaments') body = _filamentDetail(item);
    else if (section === 'profiles') body = _profileDetail(item);

    overlay.innerHTML = `<div class="kb-detail-panel">
      <div class="kb-detail-header">
        <div>
          <div class="kb-detail-title">${_esc(item.full_name || item.name || [item.brand, item.material, item.variant].filter(Boolean).join(' '))}</div>
          <div class="kb-card-meta" style="margin-top:4px">
            ${section === 'printers' ? `<span class="kb-cat-badge">${_esc(item.model)}</span>` : ''}
            ${item.category ? `<span class="kb-cat-badge">${t('kb.filter_' + item.category) || item.category}</span>` : ''}
            ${item.difficulty ? _stars(item.difficulty) : ''}
          </div>
        </div>
        <button class="kb-detail-close" onclick="this.closest('.kb-detail-overlay').remove()">&times;</button>
      </div>
      <div class="kb-detail-body">${body}</div>
      <div class="kb-detail-actions" style="padding:12px 20px">
        <button class="form-btn form-btn-sm form-btn-secondary" onclick="this.closest('.kb-detail-overlay').remove();kbOpenEdit('${section}', ${id})" data-ripple>${t('kb.edit')}</button>
        <button class="form-btn form-btn-sm form-btn-danger" onclick="kbDeleteItem('${section}', ${id})" data-ripple>${t('kb.delete')}</button>
      </div>
    </div>`;

    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.addEventListener('keydown', function _esc(e) { if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', _esc); } }, true);
    document.body.appendChild(overlay);
  };

  function _specRow(label, value) {
    if (value == null || value === '' || value === undefined) return '';
    return `<tr class="kb-specs-row"><td class="kb-specs-label">${_esc(label)}</td><td class="kb-specs-value">${typeof value === 'string' ? _esc(value) : value}</td></tr>`;
  }

  function _printerDetail(p) {
    const features = [];
    if (p.has_ams) features.push('AMS');
    if (p.has_enclosure) features.push('Enclosure');
    if (p.has_lidar) features.push('Lidar');
    if (p.has_camera) features.push('Camera');
    if (p.has_aux_fan) features.push('Aux Fan');

    let html = '<div class="kb-detail-grid">';
    html += '<div class="kb-detail-section"><div class="kb-detail-section-title">' + t('kb.features') + '</div><table class="kb-specs-table">';
    html += _specRow(t('kb.build_volume'), p.build_volume);
    html += _specRow(t('kb.max_speed'), p.max_speed ? p.max_speed + ' mm/s' : null);
    html += _specRow(t('kb.nozzle_rec'), p.nozzle_type);
    html += _specRow(t('kb.price'), p.price_usd ? formatFromUSD(p.price_usd) : null);
    html += _specRow('Weight', p.weight_kg ? p.weight_kg + ' kg' : null);
    html += '</table></div>';

    html += '<div class="kb-detail-section"><div class="kb-detail-section-title">' + t('kb.features') + '</div>';
    html += '<div class="kb-feature-icons" style="gap:8px;flex-wrap:wrap">';
    for (const f of ['AMS','Enclosure','Lidar','Camera','Aux Fan']) {
      const has = features.includes(f);
      html += `<span class="kb-feature-icon ${has ? 'kb-feature-on' : 'kb-feature-off'}" style="width:auto;border-radius:12px;padding:3px 10px;font-size:0.7rem">${f}</span>`;
    }
    html += '</div></div></div>';

    // Supported filaments
    html += '<div class="kb-detail-section"><div class="kb-detail-section-title">' + t('kb.supported_filaments') + '</div><div class="kb-tag-list">';
    html += _badges(p.supported_filaments, 'kb-compat-badge');
    html += '</div></div>';

    // Pros/Cons
    const pros = _parseJson(p.pros);
    const cons = _parseJson(p.cons);
    if (pros.length) {
      html += '<div class="kb-detail-section"><div class="kb-detail-section-title">' + t('kb.pros') + '</div><ul style="margin:0;padding-left:16px;font-size:0.8rem;color:var(--accent-green)">';
      pros.forEach(pr => { html += `<li style="color:var(--text-primary)">${_esc(pr)}</li>`; });
      html += '</ul></div>';
    }
    if (cons.length) {
      html += '<div class="kb-detail-section"><div class="kb-detail-section-title">' + t('kb.cons') + '</div><ul style="margin:0;padding-left:16px;font-size:0.8rem">';
      cons.forEach(c => { html += `<li>${_esc(c)}</li>`; });
      html += '</ul></div>';
    }

    if (p.tips) html += '<div class="kb-detail-section"><div class="kb-detail-section-title">' + t('kb.tips') + '</div><div class="kb-tips-box">' + _esc(p.tips) + '</div></div>';
    return html;
  }

  function _accessoryDetail(a) {
    let html = '<table class="kb-specs-table">';
    html += _specRow(t('kb.category'), t('kb.filter_' + a.category) || a.category);
    html += _specRow(t('kb.brand'), a.brand);
    html += _specRow(t('kb.price'), a.price_usd ? formatFromUSD(a.price_usd) : null);
    html += '</table>';

    if (a.description) html += '<div class="kb-detail-section"><div class="kb-detail-section-title">' + t('kb.description') + '</div><div style="font-size:0.8rem;color:var(--text-secondary);line-height:1.5">' + _esc(a.description) + '</div></div>';

    html += '<div class="kb-detail-section"><div class="kb-detail-section-title">' + t('kb.compatible') + '</div><div class="kb-tag-list">';
    html += _badges(a.compatible_printers, 'kb-compat-badge');
    html += '</div></div>';

    if (a.tips) html += '<div class="kb-detail-section"><div class="kb-detail-section-title">' + t('kb.tips') + '</div><div class="kb-tips-box">' + _esc(a.tips) + '</div></div>';
    return html;
  }

  function _filamentDetail(f) {
    let html = '<div class="kb-detail-grid">';

    // Properties
    html += '<div class="kb-detail-section"><div class="kb-detail-section-title">' + t('kb.properties') + '</div>';
    html += _propBar(t('kb.strength'), f.strength, '#00c864');
    html += _propBar(t('kb.flexibility'), f.flexibility, '#00b4ff');
    html += _propBar(t('kb.heat_resistance'), f.heat_resistance, '#f0883e');
    html += _propBar(t('kb.layer_adhesion'), f.layer_adhesion, '#a855f7');
    html += _propBar(t('kb.moisture'), f.moisture_sensitivity, '#e53935');
    html += '</div>';

    // Temps
    html += '<div class="kb-detail-section"><div class="kb-detail-section-title">' + t('kb.nozzle_temp') + ' & ' + t('kb.bed_temp') + '</div><table class="kb-specs-table">';
    html += _specRow(t('kb.nozzle_temp'), f.nozzle_temp_min && f.nozzle_temp_max ? `${f.nozzle_temp_min} - ${f.nozzle_temp_max}°C` : null);
    html += _specRow(t('kb.bed_temp'), f.bed_temp_min && f.bed_temp_max ? `${f.bed_temp_min} - ${f.bed_temp_max}°C` : null);
    html += _specRow(t('kb.fan_speed'), f.fan_speed_min != null && f.fan_speed_max != null ? `${f.fan_speed_min} - ${f.fan_speed_max}%` : null);
    html += _specRow(t('kb.enclosure_required'), f.enclosure_required ? t('kb.yes') : t('kb.no'));
    html += _specRow(t('kb.nozzle_rec'), f.nozzle_recommendation);
    html += _specRow('Abrasive', f.abrasive ? t('kb.yes') : t('kb.no'));
    html += '</table></div></div>';

    // Tips
    if (f.tips_print) html += '<div class="kb-detail-section"><div class="kb-detail-section-title">' + t('kb.tips_print') + '</div><div class="kb-tips-box">' + _esc(f.tips_print) + '</div></div>';
    if (f.tips_storage) html += '<div class="kb-detail-section"><div class="kb-detail-section-title">' + t('kb.tips_storage') + '</div><div class="kb-tips-box">' + _esc(f.tips_storage) + '</div></div>';
    if (f.tips_post) html += '<div class="kb-detail-section"><div class="kb-detail-section-title">' + t('kb.tips_post') + '</div><div class="kb-tips-box">' + _esc(f.tips_post) + '</div></div>';

    // Compatible printers
    html += '<div class="kb-detail-section"><div class="kb-detail-section-title">' + t('kb.compatible') + '</div><div class="kb-tag-list">';
    html += _badges(f.compatible_printers, 'kb-compat-badge');
    html += '</div></div>';
    return html;
  }

  function _profileDetail(p) {
    let html = '<table class="kb-specs-table">';
    html += _specRow(t('kb.printer'), p.printer_model);
    html += _specRow(t('kb.material'), p.filament_material);
    html += _specRow(t('kb.brand'), p.filament_brand);
    html += _specRow(t('kb.nozzle_size'), p.nozzle_size ? p.nozzle_size + 'mm' : null);
    html += _specRow(t('kb.layer_height'), p.layer_height ? p.layer_height + 'mm' : null);
    html += _specRow(t('kb.print_speed'), p.print_speed ? p.print_speed + ' mm/s' : null);
    html += _specRow(t('kb.infill'), p.infill_pct != null ? p.infill_pct + '%' : null);
    html += _specRow(t('kb.walls'), p.wall_count);
    html += _specRow(t('kb.retraction'), p.retraction_distance != null ? p.retraction_distance + 'mm @ ' + (p.retraction_speed || '--') + 'mm/s' : null);
    html += _specRow(t('kb.author'), p.author);
    html += '</table>';

    if (p.description) html += '<div class="kb-detail-section"><div class="kb-detail-section-title">' + t('kb.description') + '</div><div style="font-size:0.8rem;color:var(--text-secondary);line-height:1.5">' + _esc(p.description) + '</div></div>';
    if (p.tips) html += '<div class="kb-detail-section"><div class="kb-detail-section-title">' + t('kb.tips') + '</div><div class="kb-tips-box">' + _esc(p.tips) + '</div></div>';

    // Copy JSON button
    if (p.settings_json && p.settings_json !== '{}') {
      html += `<button class="form-btn form-btn-sm form-btn-secondary" onclick="kbCopyProfile(${p.id})" data-ripple>${t('kb.copy_json')}</button>`;
    }
    return html;
  }

  // ---- CRUD ----
  window.kbOpenEdit = function(section, id) {
    // Close any open detail
    document.querySelectorAll('.kb-detail-overlay').forEach(el => el.remove());

    const item = id ? (_data[section] || []).find(i => i.id === id) : {};
    const isNew = !id;

    const overlay = document.createElement('div');
    overlay.className = 'kb-edit-overlay';
    overlay.id = 'kb-edit-overlay';

    let formHtml = '';
    if (section === 'printers') formHtml = _printerForm(item);
    else if (section === 'accessories') formHtml = _accessoryForm(item);
    else if (section === 'filaments') formHtml = _filamentForm(item);
    else if (section === 'profiles') formHtml = _profileForm(item);

    overlay.innerHTML = `<div class="kb-edit-panel">
      <div class="kb-edit-title">${isNew ? t('kb.create_new') : t('kb.edit_entry')} — ${t(SECTIONS[section].label)}</div>
      <form class="kb-edit-form" onsubmit="event.preventDefault(); kbSaveItem('${section}', ${id || 'null'})">
        ${formHtml}
        <div class="kb-edit-actions">
          <button type="button" class="form-btn form-btn-sm form-btn-secondary" onclick="document.getElementById('kb-edit-overlay').remove()" data-ripple>${t('kb.cancel')}</button>
          <button type="submit" class="form-btn form-btn-sm" data-ripple>${t('kb.save')}</button>
        </div>
      </form>
    </div>`;

    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  };

  function _field(label, name, value, type, required) {
    const req = required ? ' required' : '';
    if (type === 'textarea') {
      return `<div class="kb-edit-field"><label class="kb-edit-label">${_esc(label)}</label><textarea class="form-input" name="${name}" rows="3"${req}>${_esc(value || '')}</textarea></div>`;
    }
    return `<div class="kb-edit-field"><label class="kb-edit-label">${_esc(label)}</label><input class="form-input" type="${type || 'text'}" name="${name}" value="${_esc(value || '')}"${req}></div>`;
  }

  function _selectField(label, name, value, options) {
    let html = `<div class="kb-edit-field"><label class="kb-edit-label">${_esc(label)}</label><select class="form-input" name="${name}">`;
    for (const [val, lbl] of options) {
      html += `<option value="${val}"${val === value ? ' selected' : ''}>${_esc(lbl)}</option>`;
    }
    return html + '</select></div>';
  }

  function _printerForm(p) {
    return _field('Model *', 'model', p.model, 'text', true)
      + _field('Full Name *', 'full_name', p.full_name, 'text', true)
      + _field(t('kb.build_volume'), 'build_volume', p.build_volume)
      + _field(t('kb.max_speed') + ' (mm/s)', 'max_speed', p.max_speed, 'number')
      + _field(t('kb.price') + ` (${currencyCode()})`, 'price_usd', p.price_usd, 'number')
      + _field('Release Year', 'release_year', p.release_year, 'number')
      + _field(t('kb.supported_filaments') + ' (comma-sep)', 'supported_filaments', _parseJson(p.supported_filaments).join(', '))
      + _field(t('kb.pros') + ' (comma-sep)', 'pros', _parseJson(p.pros).join(', '))
      + _field(t('kb.cons') + ' (comma-sep)', 'cons', _parseJson(p.cons).join(', '))
      + _field(t('kb.tips'), 'tips', p.tips, 'textarea');
  }

  function _accessoryForm(a) {
    return _field('Name *', 'name', a.name, 'text', true)
      + _selectField(t('kb.category'), 'category', a.category || 'other', ACC_FILTERS.filter(f => f !== 'all').map(f => [f, t('kb.filter_' + f)]))
      + _field(t('kb.brand'), 'brand', a.brand)
      + _field(t('kb.price') + ` (${currencyCode()})`, 'price_usd', a.price_usd, 'number')
      + _field(t('kb.compatible') + ' (comma-sep)', 'compatible_printers', _parseJson(a.compatible_printers).join(', '))
      + _field(t('kb.description'), 'description', a.description, 'textarea')
      + _field(t('kb.tips'), 'tips', a.tips, 'textarea');
  }

  function _filamentForm(f) {
    return _field(t('kb.material') + ' *', 'material', f.material, 'text', true)
      + _field(t('kb.brand'), 'brand', f.brand)
      + _field(t('kb.variant'), 'variant', f.variant)
      + _selectField(t('kb.category'), 'category', f.category || 'standard', FIL_FILTERS.filter(x => x !== 'all').map(x => [x, t('kb.filter_' + x)]))
      + _field(t('kb.difficulty') + ' (1-5)', 'difficulty', f.difficulty, 'number')
      + _field(t('kb.nozzle_temp') + ' min (°C)', 'nozzle_temp_min', f.nozzle_temp_min, 'number')
      + _field(t('kb.nozzle_temp') + ' max (°C)', 'nozzle_temp_max', f.nozzle_temp_max, 'number')
      + _field(t('kb.bed_temp') + ' min (°C)', 'bed_temp_min', f.bed_temp_min, 'number')
      + _field(t('kb.bed_temp') + ' max (°C)', 'bed_temp_max', f.bed_temp_max, 'number')
      + _field(t('kb.fan_speed') + ' min (%)', 'fan_speed_min', f.fan_speed_min, 'number')
      + _field(t('kb.fan_speed') + ' max (%)', 'fan_speed_max', f.fan_speed_max, 'number')
      + _field(t('kb.tips_print'), 'tips_print', f.tips_print, 'textarea')
      + _field(t('kb.tips_storage'), 'tips_storage', f.tips_storage, 'textarea');
  }

  function _profileForm(p) {
    return _field(t('kb.profile_name') + ' *', 'name', p.name, 'text', true)
      + _field(t('kb.printer'), 'printer_model', p.printer_model)
      + _field(t('kb.material'), 'filament_material', p.filament_material)
      + _field(t('kb.brand'), 'filament_brand', p.filament_brand)
      + _field(t('kb.nozzle_size') + ' (mm)', 'nozzle_size', p.nozzle_size, 'number')
      + _field(t('kb.layer_height') + ' (mm)', 'layer_height', p.layer_height, 'number')
      + _field(t('kb.print_speed') + ' (mm/s)', 'print_speed', p.print_speed, 'number')
      + _field(t('kb.infill') + ' (%)', 'infill_pct', p.infill_pct, 'number')
      + _field(t('kb.walls'), 'wall_count', p.wall_count, 'number')
      + _field(t('kb.description'), 'description', p.description, 'textarea')
      + _field(t('kb.tips'), 'tips', p.tips, 'textarea')
      + _field(t('kb.author'), 'author', p.author);
  }

  // ---- Save ----
  window.kbSaveItem = async function(section, id) {
    const form = document.querySelector('#kb-edit-overlay form');
    if (!form) return;

    const data = {};
    const fd = new FormData(form);
    for (const [key, val] of fd.entries()) {
      // Convert comma-sep to JSON arrays for specific fields
      if (['supported_filaments','pros','cons','compatible_printers'].includes(key)) {
        data[key] = JSON.stringify(val.split(',').map(s => s.trim()).filter(Boolean));
      } else if (['max_speed','price_usd','release_year','difficulty','nozzle_temp_min','nozzle_temp_max','bed_temp_min','bed_temp_max','fan_speed_min','fan_speed_max','nozzle_size','layer_height','print_speed','infill_pct','wall_count','retraction_distance','retraction_speed','rating','chamber_temp','top_layers','bottom_layers'].includes(key)) {
        data[key] = val ? parseFloat(val) : null;
      } else {
        data[key] = val || null;
      }
    }

    // Boolean fields
    if (section === 'printers') {
      for (const k of ['has_ams','has_enclosure','has_lidar','has_camera','has_aux_fan']) {
        data[k] = data[k] ? 1 : 0;
      }
    }

    const saveBtn = form.querySelector('button[type="submit"]');
    try {
      if (typeof withLoading === 'function' && saveBtn) {
        await withLoading(saveBtn, async () => {
          if (id) {
            await fetch(`/api/kb/${section}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
          } else {
            await fetch(`/api/kb/${section}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
          }
        });
      } else {
        if (id) {
          await fetch(`/api/kb/${section}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        } else {
          await fetch(`/api/kb/${section}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        }
      }

      document.getElementById('kb-edit-overlay')?.remove();
      if (typeof showToast === 'function') showToast(t('kb.save'), 'success');
      await loadKnowledgePanel(); // Reload
    } catch (e) {
      if (typeof showToast === 'function') showToast(e.message, 'error');
    }
  };

  // ---- Delete ----
  window.kbDeleteItem = function(section, id) {
    if (typeof confirmAction === 'function') {
      confirmAction(t('kb.confirm_delete'), async () => {
        try {
          await fetch(`/api/kb/${section}/${id}`, { method: 'DELETE' });
          document.querySelectorAll('.kb-detail-overlay').forEach(el => el.remove());
          if (typeof showToast === 'function') showToast(t('kb.delete'), 'success');
          await loadKnowledgePanel();
        } catch (e) {
          if (typeof showToast === 'function') showToast(e.message, 'error');
        }
      }, { danger: true });
    }
  };

  // ---- Copy profile JSON ----
  window.kbCopyProfile = async function(id) {
    try {
      const p = await fetch(`/api/kb/profiles/${id}`).then(r => r.json());
      await navigator.clipboard.writeText(p.settings_json || '{}');
      if (typeof showToast === 'function') showToast(t('kb.copied'), 'success');
    } catch (e) {
      if (typeof showToast === 'function') showToast(e.message, 'error');
    }
  };

  // ---- Navigation ----
  window.kbSwitchSection = function(section) {
    _section = section;
    _filter = 'all';
    _search = '';
    _sort = (SORT_OPTIONS[section] || ['name_asc'])[0];
    _profileFilterPrinter = 'all';
    _profileFilterMaterial = 'all';
    _render();
  };

  window.kbSearch = function(query) {
    _search = query;
    clearTimeout(window._kbSearchTimeout);
    window._kbSearchTimeout = setTimeout(() => _render(), 150);
  };

  window.kbFilter = function(value) {
    _filter = value;
    _render();
  };

  window.kbSort = function(value) {
    _sort = value;
    _render();
  };

  window.kbFilterProfile = function(type, value) {
    if (type === 'printer') _profileFilterPrinter = value;
    else if (type === 'material') _profileFilterMaterial = value;
    _render();
  };
})();
