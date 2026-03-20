// Filament Inventory Tracker — Modular with Tabs, 3-tier model (vendors → profiles → spools)
(function() {

  // ═══ Constants & Helpers ═══
  // Real-time spool percentage: adjusts for active print consumption
  function spoolPct(s) {
    if (!s) return 0;
    const init = s.initial_weight_g || 0;
    const rem = s.remaining_weight_g || 0;
    if (init <= 0) return 0;
    // Check if this spool is currently active in AMS
    if (typeof window.realtimeFilament === 'function' && s.printer_id && s.ams_unit != null && s.ams_tray != null) {
      const state = window.printerState?.getActivePrinterState?.();
      const ams = state?.ams || state?.print?.ams;
      if (ams) {
        const activeIdx = ams.tray_now != null ? parseInt(ams.tray_now) : -1;
        const spoolIdx = s.ams_unit * 4 + s.ams_tray;
        const isActive = spoolIdx === activeIdx;
        const rt = window.realtimeFilament({ remainG: rem, totalG: init, isActive, data: state });
        return rt.current;
      }
    }
    return Math.max(0, Math.round((rem / init) * 100));
  }

  // Real-time remaining grams for a spool
  function spoolRemainG(s) {
    if (!s) return 0;
    const init = s.initial_weight_g || 0;
    const rem = s.remaining_weight_g || 0;
    if (typeof window.realtimeFilament === 'function' && s.printer_id && s.ams_unit != null && s.ams_tray != null) {
      const state = window.printerState?.getActivePrinterState?.();
      const ams = state?.ams || state?.print?.ams;
      if (ams) {
        const activeIdx = ams.tray_now != null ? parseInt(ams.tray_now) : -1;
        const spoolIdx = s.ams_unit * 4 + s.ams_tray;
        const isActive = spoolIdx === activeIdx;
        const rt = window.realtimeFilament({ remainG: rem, totalG: init, isActive, data: state });
        return rt.currentG;
      }
    }
    return Math.round(rem);
  }

  const FILAMENT_TYPES = {
    'Standard': ['PLA', 'PLA+', 'PLA Matte', 'PLA Silk', 'PLA Marble', 'PLA Metal', 'PLA Glow', 'PLA Galaxy', 'PLA Sparkle', 'PLA Wood'],
    'Engineering': ['PETG', 'PETG-CF', 'ABS', 'ASA', 'PC', 'PA', 'PA-CF', 'PA-GF', 'PA6-CF', 'PA6-GF', 'PAHT-CF', 'PET-CF', 'PPA-CF', 'PPA-GF'],
    'Flexible': ['TPU', 'TPU 95A'],
    'Support': ['PVA', 'HIPS', 'BVOH'],
    'Specialty': ['PP', 'PE', 'EVA']
  };

  function buildMaterialOptions(selected) {
    let html = '<option value="">--</option>';
    let found = false;
    for (const [group, types] of Object.entries(FILAMENT_TYPES)) {
      html += `<optgroup label="${group}">`;
      for (const tp of types) {
        const sel = tp === selected ? 'selected' : '';
        if (sel) found = true;
        html += `<option value="${tp}" ${sel}>${tp}</option>`;
      }
      html += '</optgroup>';
    }
    if (selected && !found) {
      html += `<optgroup label="Custom"><option value="${selected}" selected>${selected}</option></optgroup>`;
    }
    html += `<option value="__custom__">${t('filament.custom_type')}</option>`;
    return html;
  }

  function hexToRgb(hex) { if (!hex || hex.length < 6) return '#888'; return hex.startsWith('#') ? hex : `#${hex.substring(0, 6)}`; }
  function hexToRgbColor(hex) { if (!hex || hex.length < 6) return 'rgb(128,128,128)'; const h = hex.replace('#',''); return `rgb(${parseInt(h.substring(0,2),16)},${parseInt(h.substring(2,4),16)},${parseInt(h.substring(4,6),16)})`; }
  function isLightColor(hex) { if (!hex || hex.length < 6) return false; const h = hex.replace('#',''); return (parseInt(h.substring(0,2),16)*299+parseInt(h.substring(2,4),16)*587+parseInt(h.substring(4,6),16)*114)/1000 > 160; }
  function printerName(id) { return window.printerState?._printerMeta?.[id]?.name || id || '--'; }
  function fmtW(g) { return g >= 1000 ? (g/1000).toFixed(1)+' kg' : Math.round(g)+'g'; }
  function barRow(lbl, pct, clr, val) { return `<div class="chart-bar-row"><span class="chart-bar-label">${lbl}</span><div class="chart-bar-track"><div class="chart-bar-fill" style="width:${pct}%;background:${clr}"></div></div><span class="chart-bar-value">${val}</span></div>`; }
  function sRow(lbl, val, clr) { return `<div class="stats-detail-item"><span class="stats-detail-item-label">${lbl}</span><span class="stats-detail-item-value"${clr?` style="color:${clr}"`:''}>${val}</span></div>`; }

  function _buildColorStyle(colorHex, multiColorHexes, multiColorDirection) {
    let hexes;
    try { hexes = multiColorHexes ? (typeof multiColorHexes === 'string' ? JSON.parse(multiColorHexes) : multiColorHexes) : null; } catch { hexes = null; }
    if (hexes && hexes.length > 1) {
      const colors = hexes.map(h => hexToRgb(h));
      const dir = multiColorDirection === 'longitudinal' ? '90deg' : '180deg';
      return `linear-gradient(${dir},${colors.join(',')})`;
    }
    return hexToRgb(colorHex);
  }

  const TYPE_COLORS = { 'PLA':'#00e676','PLA+':'#00c853','PETG':'#f0883e','TPU':'#9b4dff','ABS':'#ff5252','ASA':'#1279ff','PA':'#e3b341','PA-CF':'#d2a8ff','PET-CF':'#f778ba','PLA-CF':'#79c0ff','PC':'#8b949e','PLA Silk':'#ffd700','PLA Matte':'#7cb342','PETG-CF':'#ff9800' };

  function heroCard(icon, value, label, color) {
    return `<div class="fil-hero-card">
      <div class="fil-hero-icon" style="background:${color}15;color:${color}">${icon}</div>
      <div class="fil-hero-value" style="color:${color}">${value}</div>
      <div class="fil-hero-label">${label}</div>
    </div>`;
  }

  // ═══ Tab config (alphabetically sorted by translated label at render time) ═══
  const TAB_CONFIG_UNSORTED = {
    inventory: { label: 'filament.tab_inventory', modules: ['spool-summary', 'active-filament', 'low-stock-alert', 'spool-grid'], order: 0 },
    database:  { label: 'filament.tab_database',  modules: ['db-hero', 'db-browser'] },
    drying:    { label: 'filament.tab_drying',    modules: ['drying-dashboard'] },
    multicolor:{ label: 'tabs.multicolor',        modules: ['multicolor-panel'], external: true },
    tools:     { label: 'filament.tab_tools',     modules: ['tools-dashboard'] },
    manage:    { label: 'filament.tab_manage',    modules: ['manage-dashboard'] },
    stats:     { label: 'filament.tab_stats',     modules: ['type-breakdown', 'brand-breakdown', 'cost-summary', 'stock-health', 'restock-suggestions', 'usage-predictions', 'cost-estimation', 'usage-history'] }
  };
  // Sort tabs: inventory always first, rest alphabetically by translated label
  function _getSortedTabs() {
    const entries = Object.entries(TAB_CONFIG_UNSORTED);
    return entries.sort((a, b) => {
      if (a[1].order === 0) return -1;
      if (b[1].order === 0) return 1;
      const la = t(a[1].label) || a[0];
      const lb = t(b[1].label) || b[0];
      return la.localeCompare(lb);
    });
  }
  const TAB_CONFIG = TAB_CONFIG_UNSORTED;
  const MODULE_SIZE = {
    'spool-summary': 'full', 'active-filament': 'full',
    'low-stock-alert': 'full', 'spool-grid': 'full',
    'db-hero': 'full', 'db-browser': 'full',
    'drying-dashboard': 'full',
    'tools-dashboard': 'full',
    'manage-dashboard': 'full',
    'type-breakdown': 'half', 'brand-breakdown': 'half',
    'cost-summary': 'half', 'stock-health': 'half',
    'restock-suggestions': 'full', 'usage-predictions': 'full', 'cost-estimation': 'full', 'usage-history': 'full'
  };

  const STORAGE_PREFIX = 'filament-module-order-';

  const _MOD_VER = 13;
  if (localStorage.getItem('filament-mod-ver') !== String(_MOD_VER)) {
    for (const tab of Object.keys(TAB_CONFIG)) localStorage.removeItem(STORAGE_PREFIX + tab);
    localStorage.setItem('filament-mod-ver', String(_MOD_VER));
  }

  let _activeTab = 'inventory';
  const _locked = true;
  let _spools = [];        // New enriched spools from /api/inventory/spools
  let _vendors = [];
  let _profiles = [];
  let _locations = [];
  let _showArchived = false;
  let _dryingSessions = [];
  let _dryingPresets = [];
  let _dryingStatus = [];
  let _dryingTimers = {};
  let _dryingSubTab = 'active';
  let _toolsSubTab = 'spools';
  let _manageSubTab = 'profiles';
  let _dryingHistory = [];
  let _dryHistoryFilter = { material: '', method: '' };
  let _dryHistorySort = 'date_desc';
  let _filterMaterial = '';
  let _filterVendor = '';
  let _filterLocation = '';
  let _filterPrinter = 'all';
  let _filterFavorites = false;
  let _filterColorFamily = '';
  let _filterTag = '';
  let _filterCategory = '';
  let _tags = [];
  let _viewMode = localStorage.getItem('inv-view-mode') || 'grid';
  let _groupBy = localStorage.getItem('inv-group-by') || 'material';

  // ═══ Filament Database state ═══
  let _dbFilaments = [];
  let _dbOwnedIds = new Set();
  let _dbTotal = 0;
  let _dbPage = 0;
  let _dbPageSize = 50;
  let _dbSearch = '';
  let _dbFilterBrand = '';
  let _dbFilterMaterial = '';
  let _dbFilterCategory = '';
  let _dbFilterHasK = false;
  let _dbFilterHasTd = false;
  let _dbFilterTranslucent = false;
  let _dbFilterGlow = false;
  let _dbFilterMultiColor = false;
  let _dbSort = 'manufacturer';
  let _dbSortDir = 'ASC';
  let _dbViewMode = localStorage.getItem('db-view-mode') || 'cards';
  let _dbStats = null;
  let _dbBrands = [];
  let _dbMaterials = [];
  let _dbCompare = [];
  let _dbLoaded = false;
  let _dbSearchTimer = null;

  // ═══ Color family classification ═══
  const COLOR_FAMILIES = {
    red:         { h: [345, 15],  s: [20, 100], l: [15, 75], hex: '#e53935', label: 'color.red' },
    orange:      { h: [15, 45],   s: [30, 100], l: [25, 75], hex: '#fb8c00', label: 'color.orange' },
    yellow:      { h: [45, 70],   s: [30, 100], l: [30, 80], hex: '#fdd835', label: 'color.yellow' },
    green:       { h: [70, 170],  s: [20, 100], l: [15, 75], hex: '#43a047', label: 'color.green' },
    blue:        { h: [170, 260], s: [20, 100], l: [15, 75], hex: '#1e88e5', label: 'color.blue' },
    purple:      { h: [260, 310], s: [20, 100], l: [15, 75], hex: '#8e24aa', label: 'color.purple' },
    pink:        { h: [310, 345], s: [20, 100], l: [25, 80], hex: '#ec407a', label: 'color.pink' },
    brown:       { h: [10, 45],   s: [15, 70],  l: [10, 40], hex: '#795548', label: 'color.brown' },
    black:       { h: [0, 360],   s: [0, 100],  l: [0, 12],  hex: '#212121', label: 'color.black' },
    white:       { h: [0, 360],   s: [0, 30],   l: [85, 100], hex: '#fafafa', label: 'color.white' },
    gray:        { h: [0, 360],   s: [0, 15],   l: [12, 85], hex: '#9e9e9e', label: 'color.gray' },
    transparent: { h: [0, 0],     s: [0, 0],    l: [0, 0],   hex: 'transparent', label: 'color.transparent' }
  };

  function _hexToHsl(hex) {
    if (!hex) return null;
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    const r = parseInt(hex.substr(0,2),16)/255;
    const g = parseInt(hex.substr(2,2),16)/255;
    const b = parseInt(hex.substr(4,2),16)/255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let h, s, l = (max+min)/2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d/(2-max-min) : d/(max+min);
      switch(max) {
        case r: h = ((g-b)/d + (g<b?6:0))*60; break;
        case g: h = ((b-r)/d + 2)*60; break;
        case b: h = ((r-g)/d + 4)*60; break;
      }
    }
    return { h: Math.round(h), s: Math.round(s*100), l: Math.round(l*100) };
  }

  function _classifyColor(hex) {
    const hsl = _hexToHsl(hex);
    if (!hsl) return 'transparent';
    // Check achromatic first (black, white, gray)
    if (hsl.l <= 12) return 'black';
    if (hsl.l >= 85 && hsl.s <= 30) return 'white';
    if (hsl.s <= 15) return 'gray';
    // Brown is low-saturation warm with low lightness
    if (hsl.h >= 10 && hsl.h < 45 && hsl.s >= 15 && hsl.s <= 70 && hsl.l >= 10 && hsl.l <= 40) return 'brown';
    // Chromatic families
    for (const [name, f] of Object.entries(COLOR_FAMILIES)) {
      if (name === 'black' || name === 'white' || name === 'gray' || name === 'brown' || name === 'transparent') continue;
      const hMatch = f.h[0] <= f.h[1]
        ? (hsl.h >= f.h[0] && hsl.h < f.h[1])
        : (hsl.h >= f.h[0] || hsl.h < f.h[1]); // wrap around for red
      if (hMatch && hsl.s >= f.s[0] && hsl.l >= f.l[0] && hsl.l <= f.l[1]) return name;
    }
    return 'gray';
  }

  // ═══ Printer capability map (Bambu Lab printers) ═══
  const PRINTER_CAPS = {
    'X1 Carbon':  { maxNozzle: 300, maxBed: 120, enclosed: true },
    'X1':         { maxNozzle: 300, maxBed: 110, enclosed: true },
    'X1E':        { maxNozzle: 300, maxBed: 120, enclosed: true },
    'P1S':        { maxNozzle: 300, maxBed: 110, enclosed: true },
    'P1P':        { maxNozzle: 300, maxBed: 110, enclosed: false },
    'P2S Combo':  { maxNozzle: 300, maxBed: 110, enclosed: true },
    'A1':         { maxNozzle: 300, maxBed: 100, enclosed: false },
    'A1 Mini':    { maxNozzle: 300, maxBed: 80,  enclosed: false },
    'H2D':        { maxNozzle: 300, maxBed: 110, enclosed: true },
  };
  const ENCLOSURE_MATERIALS = new Set(['ABS', 'ASA', 'PC', 'PA', 'PA-CF', 'PA-GF', 'PA6-CF', 'PAHT-CF', 'PPA-CF', 'PPA-GF']);

  function checkCompatibility(spool) {
    const warnings = [];
    if (!spool.printer_id) return warnings;
    const printer = window.stateStore?._printerMeta?.[spool.printer_id];
    const model = printer?.model || '';
    const caps = PRINTER_CAPS[model];
    if (!caps) return warnings;
    if (spool.nozzle_temp_max && spool.nozzle_temp_max > caps.maxNozzle) {
      warnings.push(t('filament.compat_nozzle_too_hot').replace('{{required}}', spool.nozzle_temp_max).replace('{{max}}', caps.maxNozzle));
    }
    if (spool.bed_temp_max && spool.bed_temp_max > caps.maxBed) {
      warnings.push(t('filament.compat_bed_too_hot').replace('{{required}}', spool.bed_temp_max).replace('{{max}}', caps.maxBed));
    }
    if (!caps.enclosed && ENCLOSURE_MATERIALS.has(spool.material)) {
      warnings.push(t('filament.compat_needs_enclosure').replace('{{material}}', spool.material));
    }
    return warnings;
  }
  let _sortBy = 'recent';
  let _searchQuery = '';
  let _currentPage = 0;
  let _pageSize = 50;
  let _searchDebounce = null;
  let _lowStockPct = 20;
  let _lowStockGrams = 0;

  // ═══ Module order ═══
  function getOrder(tabId) {
    return TAB_CONFIG[tabId]?.modules || [];
  }

  // ═══ Cascade filter options ═══
  function _applyFiltersExcept(spools, excludeDim) {
    return spools.filter(s => {
      if (!_showArchived && s.archived) return false;
      if (_filterFavorites && !s.is_favorite) return false;
      if (excludeDim !== 'material' && _filterMaterial && s.material !== _filterMaterial) return false;
      if (excludeDim !== 'category' && _filterCategory && !Object.entries(FILAMENT_TYPES).some(([cat, types]) => cat === _filterCategory && types.includes(s.material))) return false;
      if (excludeDim !== 'vendor' && _filterVendor && s.vendor_name !== _filterVendor) return false;
      if (excludeDim !== 'location' && _filterLocation && s.location !== _filterLocation) return false;
      if (excludeDim !== 'color' && _filterColorFamily && _classifyColor(s.color_hex) !== _filterColorFamily) return false;
      if (excludeDim !== 'tag' && _filterTag && !(s.tags && s.tags.some(tg => String(tg.id) === _filterTag))) return false;
      if (_searchQuery) {
        const q = _searchQuery.toLowerCase();
        const fields = [s.profile_name, s.material, s.vendor_name, s.color_name, s.lot_number, s.location, s.comment, s.article_number, s.short_id].filter(Boolean);
        if (!fields.some(f => f.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }

  function _computeCascadeOptions(spools) {
    const matPool = _applyFiltersExcept(spools, 'material');
    const catPool = _applyFiltersExcept(spools, 'category');
    const venPool = _applyFiltersExcept(spools, 'vendor');
    const locPool = _applyFiltersExcept(spools, 'location');
    const tagPool = _applyFiltersExcept(spools, 'tag');
    const matCounts = {};
    for (const s of matPool) { if (s.material) matCounts[s.material] = (matCounts[s.material] || 0) + 1; }
    const venCounts = {};
    for (const s of venPool) { if (s.vendor_name) venCounts[s.vendor_name] = (venCounts[s.vendor_name] || 0) + 1; }
    const locCounts = {};
    for (const s of locPool) { if (s.location) locCounts[s.location] = (locCounts[s.location] || 0) + 1; }
    const catCounts = {};
    for (const s of catPool) {
      for (const [cat, types] of Object.entries(FILAMENT_TYPES)) {
        if (types.includes(s.material)) { catCounts[cat] = (catCounts[cat] || 0) + 1; break; }
      }
    }
    const tagCounts = {};
    for (const s of tagPool) { if (s.tags) for (const tg of s.tags) tagCounts[tg.id] = (tagCounts[tg.id] || 0) + 1; }
    return { matCounts, venCounts, locCounts, catCounts, tagCounts };
  }

  function _hasActiveFilters() {
    return !!(_filterMaterial || _filterVendor || _filterLocation || _filterCategory || _filterTag || _filterColorFamily || _filterFavorites || _searchQuery);
  }

  // ═══ Module builders ═══
  const BUILDERS = {
    'spool-summary': (spools) => {
      let totalRemaining = 0, totalValue = 0, lowStockCount = 0;
      const active = spools.filter(s => !s.archived);
      for (const s of active) {
        totalRemaining += spoolRemainG(s);
        if (s.cost) totalValue += s.cost;
        const pct = spoolPct(s);
        const rG = spoolRemainG(s);
        if ((pct > 0 && pct < _lowStockPct) || (_lowStockGrams > 0 && rG > 0 && rG < _lowStockGrams)) lowStockCount++;
      }
      const lowColor = lowStockCount > 0 ? '#f0883e' : '#00e676';
      return `<div class="fil-hero-grid">
        ${heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>', active.length, t('filament.total_spools'), '#1279ff')}
        ${heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>', fmtW(totalRemaining), t('filament.total_remaining'), '#00e676')}
        ${totalValue > 0 ? heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>', formatCurrency(totalValue, 0), t('filament.total_value'), '#e3b341') : ''}
        ${heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>', lowStockCount, t('filament.low_stock'), lowColor)}
      </div>`;
    },

    'low-stock-alert': (spools) => {
      const low = spools.filter(s => {
        if (s.archived) return false;
        const pct = spoolPct(s) || 100;
        return (pct > 0 && pct < _lowStockPct) || (_lowStockGrams > 0 && s.remaining_weight_g > 0 && s.remaining_weight_g < _lowStockGrams);
      });
      if (low.length === 0) return '';
      return `<div class="filament-low-stock-alert">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span>${t('filament.low_stock_warning', { count: low.length })}</span>
      </div>`;
    },

    'active-filament': () => {
      let h = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 7h4v4H7zM13 7h4v4h-4zM7 13h4v4H7zM13 13h4v4h-4z"/></svg>
        ${t('common.active_filament')}
      </div>`;
      h += buildActiveFilamentContent();
      return h;
    },

    'spool-grid': (spools) => {
      // Filter bar with search
      let h = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        ${t('filament.spool_title')}
      </div>`;

      // Cascade filter options — each dropdown only shows options matching OTHER active filters
      const _co = _computeCascadeOptions(spools);

      h += `<div class="inv-filter-bar">
        <label class="bulk-select-all" title="${t('filament.bulk_select_all')}">
          <input type="checkbox" id="bulk-select-all-cb" onchange="window._bulkSelectAll(this.checked)">
          <span>${t('filament.bulk_select_all')}</span>
        </label>
        <input class="form-input form-input-sm inv-search-input" type="text" placeholder="${t('filament.search_placeholder')}" value="${esc(_searchQuery)}" oninput="window._invSearch(this.value)">
        <button class="inv-filter-chip ${_filterFavorites ? 'active' : ''}" onclick="window._invToggleFavorites()" title="${t('filament.favorites_only')}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="${_filterFavorites ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
        <select class="form-input form-input-sm" onchange="window._invFilterMaterial(this.value)">
          <option value="">${t('filament.filter_all')} ${t('filament.filter_material')}</option>
          ${Object.entries(_co.matCounts).sort(([a],[b]) => a.localeCompare(b)).map(([m, n]) => `<option value="${m}" ${m === _filterMaterial ? 'selected' : ''}>${m} (${n})</option>`).join('')}
        </select>
        <select class="form-input form-input-sm" onchange="window._invFilterCategory(this.value)">
          <option value="">${t('filament.filter_all')} ${t('filament.filter_category')}</option>
          ${Object.keys(FILAMENT_TYPES).filter(c => _co.catCounts[c]).map(c => `<option value="${c}" ${c === _filterCategory ? 'selected' : ''}>${c} (${_co.catCounts[c]})</option>`).join('')}
        </select>
        <select class="form-input form-input-sm" onchange="window._invFilterVendor(this.value)">
          <option value="">${t('filament.filter_all')} ${t('filament.filter_vendor')}</option>
          ${Object.entries(_co.venCounts).sort(([a],[b]) => a.localeCompare(b)).map(([v, n]) => `<option value="${v}" ${v === _filterVendor ? 'selected' : ''}>${v} (${n})</option>`).join('')}
        </select>
        <select class="form-input form-input-sm" onchange="window._invFilterLocation(this.value)">
          <option value="">${t('filament.filter_all')} ${t('filament.filter_location')}</option>
          ${Object.entries(_co.locCounts).sort(([a],[b]) => a.localeCompare(b)).map(([l, n]) => `<option value="${l}" ${l === _filterLocation ? 'selected' : ''}>${l} (${n})</option>`).join('')}
        </select>
        ${_tags.length ? `<select class="form-input form-input-sm" onchange="window._invFilterTag(this.value)">
          <option value="">${t('filament.all_tags')}</option>
          ${_tags.filter(tg => _co.tagCounts[tg.id]).map(tg => `<option value="${tg.id}" ${String(tg.id) === _filterTag ? 'selected' : ''}>${esc(tg.name)} (${_co.tagCounts[tg.id]})</option>`).join('')}
        </select>` : ''}
        <select class="form-input form-input-sm" onchange="window._invSort(this.value)">
          <option value="recent" ${_sortBy === 'recent' ? 'selected' : ''}>${t('filament.sort_recent')}</option>
          <option value="name" ${_sortBy === 'name' ? 'selected' : ''}>${t('filament.sort_name')}</option>
          <option value="remaining_asc" ${_sortBy === 'remaining_asc' ? 'selected' : ''}>${t('filament.sort_remaining_asc')}</option>
          <option value="remaining_desc" ${_sortBy === 'remaining_desc' ? 'selected' : ''}>${t('filament.sort_remaining_desc')}</option>
          <option value="fifo" ${_sortBy === 'fifo' ? 'selected' : ''}>${t('filament.sort_fifo')}</option>
        </select>
        ${_hasActiveFilters() ? `<button class="inv-filter-chip" onclick="window._invResetFilters()" title="${t('filament.reset_filters')}" style="color:var(--accent-red)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          ${t('filament.reset_filters')}
        </button>` : ''}
        <label class="inv-archive-toggle">
          <input type="checkbox" ${_showArchived ? 'checked' : ''} onchange="window._invToggleArchived(this.checked)">
          <span>${t('filament.show_archived')}</span>
        </label>
        <div class="inv-view-toggle">
          <button class="inv-view-btn ${_viewMode === 'grid' ? 'active' : ''}" onclick="window._invViewMode('grid')" title="${t('filament.view_grid')}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </button>
          <button class="inv-view-btn ${_viewMode === 'list' ? 'active' : ''}" onclick="window._invViewMode('list')" title="${t('filament.view_list')}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </button>
          <button class="inv-view-btn ${_viewMode === 'table' ? 'active' : ''}" onclick="window._invViewMode('table')" title="${t('filament.view_table')}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
          </button>
          <button class="inv-view-btn ${_viewMode === 'groups' ? 'active' : ''}" onclick="window._invViewMode('groups')" title="${t('filament.groups_view')}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
          </button>
        </div>
      </div>`;
      // Active filter chips
      if (_hasActiveFilters()) {
        h += `<div class="inv-active-filters">`;
        if (_searchQuery) h += `<span class="inv-active-chip" onclick="window._invSearch('')">${t('filament.search_placeholder')}: "${esc(_searchQuery)}" &times;</span>`;
        if (_filterMaterial) h += `<span class="inv-active-chip" onclick="window._invFilterMaterial('')">${_filterMaterial} &times;</span>`;
        if (_filterCategory) h += `<span class="inv-active-chip" onclick="window._invFilterCategory('')">${_filterCategory} &times;</span>`;
        if (_filterVendor) h += `<span class="inv-active-chip" onclick="window._invFilterVendor('')">${_filterVendor} &times;</span>`;
        if (_filterLocation) h += `<span class="inv-active-chip" onclick="window._invFilterLocation('')">${_filterLocation} &times;</span>`;
        if (_filterColorFamily) h += `<span class="inv-active-chip" onclick="window._invFilterColor('')">${_filterColorFamily} &times;</span>`;
        if (_filterTag) { const tg = _tags.find(t2 => String(t2.id) === _filterTag); h += `<span class="inv-active-chip" onclick="window._invFilterTag('')">${tg ? esc(tg.name) : _filterTag} &times;</span>`; }
        if (_filterFavorites) h += `<span class="inv-active-chip" onclick="window._invToggleFavorites()">${t('filament.favorites_only')} &times;</span>`;
        h += `</div>`;
      }
      // Color family filter chips
      const colorFamilies = [...new Set(spools.map(s => _classifyColor(s.color_hex)).filter(c => c !== 'transparent'))];
      if (colorFamilies.length > 1) {
        h += `<div class="inv-color-filter-bar">`;
        h += `<button class="inv-color-chip ${!_filterColorFamily ? 'active' : ''}" onclick="window._invFilterColor('')" title="${t('filament.filter_all')}" style="font-size:0.75rem;padding:2px 8px">${t('filament.filter_all')}</button>`;
        for (const [name, fam] of Object.entries(COLOR_FAMILIES)) {
          if (name === 'transparent' || !colorFamilies.includes(name)) continue;
          const isActive = _filterColorFamily === name;
          const border = name === 'white' ? '1px solid var(--border-color)' : 'none';
          h += `<button class="inv-color-chip ${isActive ? 'active' : ''}" onclick="window._invFilterColor('${name}')" title="${t(fam.label)}">
            <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${fam.hex};border:${border};vertical-align:middle"></span>
            <span style="font-size:0.75rem">${t(fam.label)}</span>
          </button>`;
        }
        h += `</div>`;
      }

      // Apply filters
      let filtered = spools.filter(s => {
        if (!_showArchived && s.archived) return false;
        if (_filterFavorites && !s.is_favorite) return false;
        if (_filterMaterial && s.material !== _filterMaterial) return false;
        if (_filterCategory && !Object.entries(FILAMENT_TYPES).some(([cat, types]) => cat === _filterCategory && types.includes(s.material))) return false;
        if (_filterVendor && s.vendor_name !== _filterVendor) return false;
        if (_filterLocation && s.location !== _filterLocation) return false;
        if (_filterColorFamily && _classifyColor(s.color_hex) !== _filterColorFamily) return false;
        if (_filterTag && !(s.tags && s.tags.some(tg => String(tg.id) === _filterTag))) return false;
        if (_searchQuery) {
          const q = _searchQuery.toLowerCase();
          const fields = [s.profile_name, s.material, s.vendor_name, s.color_name, s.lot_number, s.location, s.comment, s.article_number, s.short_id].filter(Boolean);
          if (!fields.some(f => f.toLowerCase().includes(q))) return false;
        }
        return true;
      });

      // Sort — favorites first, then by selected criteria
      filtered.sort((a, b) => {
        const favA = a.is_favorite ? 1 : 0;
        const favB = b.is_favorite ? 1 : 0;
        if (favB !== favA) return favB - favA;
        if (_sortBy === 'name') return (a.profile_name || '').localeCompare(b.profile_name || '');
        if (_sortBy === 'remaining_asc') return spoolRemainG(a) - spoolRemainG(b);
        if (_sortBy === 'remaining_desc') return spoolRemainG(b) - spoolRemainG(a);
        if (_sortBy === 'fifo') {
          const aD = a.purchase_date || a.created_at || '';
          const bD = b.purchase_date || b.created_at || '';
          return aD.localeCompare(bD);
        }
        const aDate = a.last_used_at || a.created_at || '';
        const bDate = b.last_used_at || b.created_at || '';
        return bDate.localeCompare(aDate);
      });

      // Pagination
      const totalFiltered = filtered.length;
      const totalPages = Math.ceil(totalFiltered / _pageSize);
      if (_currentPage >= totalPages) _currentPage = Math.max(0, totalPages - 1);
      const pageStart = _currentPage * _pageSize;
      const pageSpools = filtered.slice(pageStart, pageStart + _pageSize);

      if (filtered.length === 0) {
        h += emptyState({
          icon: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/></svg>',
          title: _searchQuery ? t('filament.no_search_results') : t('filament.no_spools'),
          desc: _searchQuery ? '' : (t('filament.no_spools_desc') || 'Add your first spool to start tracking filament usage.'),
          actionLabel: _searchQuery ? '' : (t('filament.add_spool') || 'Add Spool'),
          actionOnClick: _searchQuery ? '' : 'document.querySelector(\'.fil-add-btn\')?.click()'
        });
      } else if (_viewMode === 'groups') {
        h += _renderSpoolGroups(filtered);
      } else if (_viewMode === 'table') {
        h += _renderSpoolTable(pageSpools);
      } else if (_viewMode === 'list') {
        h += _renderSpoolList(pageSpools);
      } else {
        h += '<div class="spool-card-grid">';
        for (const s of pageSpools) h += _renderSpoolVisualCard(s);
        h += '</div>';
      }

      // Pagination controls
      if (totalPages > 1) {
        h += `<div class="inv-pagination">
          <button class="form-btn form-btn-sm" data-ripple onclick="window._invPage(-1)" ${_currentPage === 0 ? 'disabled' : ''}>&laquo; ${t('filament.prev')}</button>
          <span class="inv-page-info">${_currentPage + 1} / ${totalPages} (${totalFiltered} ${t('filament.total_spools').toLowerCase()})</span>
          <button class="form-btn form-btn-sm" data-ripple onclick="window._invPage(1)" ${_currentPage >= totalPages - 1 ? 'disabled' : ''}>${t('filament.next')} &raquo;</button>
        </div>`;
      }
      return h;
    },

    // ── Manage tab modules ──

    // ── Manage dashboard (unified) ──
    'manage-dashboard': (spools) => {
      const tabs = [
        { id: 'profiles', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>', label: t('filament.profiles_title') },
        { id: 'vendors', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>', label: t('filament.vendors_title') },
        { id: 'locations', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>', label: t('filament.locations_title') },
        { id: 'tags', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>', label: t('filament.tags_title') },
        { id: 'prices', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>', label: t('filament.price_watch_title') },
        { id: 'insights', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>', label: t('filament.ai_insights') }
      ];
      let h = `<div class="drying-sub-tabs">`;
      for (const tab of tabs) {
        h += `<button class="drying-sub-tab${_manageSubTab === tab.id ? ' active' : ''}" data-manage-tab="${tab.id}" onclick="window._switchManageSubTab('${tab.id}')" class="drying-sub-tab-inner">${tab.icon} ${tab.label}</button>`;
      }
      h += `</div>`;
      h += `<div id="manage-sub-content"></div>`;
      setTimeout(() => _renderManageSubContent(spools), 0);
      return h;
    },

    // ── Stats tab ──

    'type-breakdown': (spools) => {
      const active = spools.filter(s => !s.archived);
      if (active.length === 0) return '';
      const byType = {};
      for (const s of active) {
        const tp = s.material || 'Unknown';
        if (!byType[tp]) byType[tp] = { count: 0, remaining_g: 0 };
        byType[tp].count++;
        byType[tp].remaining_g += spoolRemainG(s);
      }
      const sorted = Object.entries(byType).sort((a, b) => b[1].count - a[1].count);
      const mx = sorted[0]?.[1].count || 1;
      let h = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        ${t('filament.type_breakdown')}
      </div><div class="chart-bars">`;
      for (const [tp, d] of sorted) {
        const clr = TYPE_COLORS[tp] || 'var(--accent-blue)';
        h += barRow(esc(tp), (d.count / mx) * 100, clr, `${d.count} (${fmtW(d.remaining_g)})`);
      }
      h += '</div>';
      return h;
    },

    'brand-breakdown': (spools) => {
      const active = spools.filter(s => !s.archived);
      if (active.length === 0) return '';
      const byBrand = {};
      for (const s of active) {
        const br = s.vendor_name || 'Unknown';
        if (!byBrand[br]) byBrand[br] = { count: 0, total_cost: 0, total_weight: 0 };
        byBrand[br].count++;
        if (s.cost) byBrand[br].total_cost += s.cost;
        byBrand[br].total_weight += s.initial_weight_g || 0;
      }
      const sorted = Object.entries(byBrand).sort((a, b) => b[1].count - a[1].count);
      const mx = sorted[0]?.[1].count || 1;
      let h = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
        ${t('filament.brand_breakdown')}
      </div><div class="chart-bars">`;
      for (const [br, d] of sorted) {
        const avgKg = d.total_weight > 0 && d.total_cost > 0 ? Math.round(d.total_cost / (d.total_weight / 1000)) : null;
        const extra = avgKg ? ` · ${formatCurrency(avgKg, 0)}/kg` : '';
        h += barRow(esc(br), (d.count / mx) * 100, 'var(--accent-purple)', `${d.count}${extra}`);
      }
      h += '</div>';
      return h;
    },

    'cost-summary': (spools) => {
      const active = spools.filter(s => !s.archived);
      let invested = 0, usedValue = 0, totalWeightKg = 0;
      const costByType = {};
      for (const s of active) {
        if (s.cost) {
          invested += s.cost;
          const usedPct = s.initial_weight_g > 0 ? (s.used_weight_g || 0) / s.initial_weight_g : 0;
          usedValue += s.cost * usedPct;
          const tp = s.material || 'Unknown';
          if (!costByType[tp]) costByType[tp] = 0;
          costByType[tp] += s.cost;
        }
        totalWeightKg += (s.initial_weight_g || 0) / 1000;
      }
      if (invested === 0) return '';
      const avgKg = totalWeightKg > 0 ? Math.round(invested / totalWeightKg) : 0;
      const expensive = Object.entries(costByType).sort((a, b) => b[1] - a[1])[0];
      let h = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        ${t('filament.cost_summary')}
      </div><div class="stats-detail-list">`;
      h += sRow(t('filament.total_invested'), formatCurrency(invested, 0));
      h += sRow(t('filament.total_used_value'), formatCurrency(usedValue, 0), 'var(--accent-orange)');
      h += sRow(t('filament.avg_cost_kg'), `${formatCurrency(avgKg, 0)}/kg`);
      if (expensive) h += sRow(t('filament.most_expensive'), `${esc(expensive[0])} (${formatCurrency(expensive[1], 0)})`);
      h += '</div>';
      return h;
    },

    'stock-health': (spools) => {
      const active = spools.filter(s => !s.archived);
      if (active.length === 0) return '';
      let full = 0, half = 0, low = 0, empty = 0, totalPct = 0;
      for (const s of active) {
        const pct = spoolPct(s);
        totalPct += pct;
        if (pct > 75) full++;
        else if (pct > 40) half++;
        else if (pct > 10) low++;
        else empty++;
      }
      const avg = active.length > 0 ? Math.round(totalPct / active.length) : 0;
      const tp = active.length;
      let h = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        ${t('filament.stock_health')}
      </div>`;
      h += '<div class="fil-health-bar">';
      if (full > 0) h += `<div class="fil-health-seg" style="width:${(full/tp)*100}%;background:var(--accent-green)" title="${t('filament.full')} (${full})"></div>`;
      if (half > 0) h += `<div class="fil-health-seg" style="width:${(half/tp)*100}%;background:var(--accent-blue)" title="${t('filament.half')} (${half})"></div>`;
      if (low > 0) h += `<div class="fil-health-seg" style="width:${(low/tp)*100}%;background:var(--accent-orange)" title="${t('filament.low')} (${low})"></div>`;
      if (empty > 0) h += `<div class="fil-health-seg" style="width:${(empty/tp)*100}%;background:var(--accent-red)" title="${t('filament.empty')} (${empty})"></div>`;
      h += '</div>';
      h += `<div class="fil-health-legend">
        <span><span class="fil-health-dot" style="background:var(--accent-green)"></span> ${t('filament.full')} (${full})</span>
        <span><span class="fil-health-dot" style="background:var(--accent-blue)"></span> ${t('filament.half')} (${half})</span>
        <span><span class="fil-health-dot" style="background:var(--accent-orange)"></span> ${t('filament.low')} (${low})</span>
        <span><span class="fil-health-dot" style="background:var(--accent-red)"></span> ${t('filament.empty')} (${empty})</span>
      </div>`;
      h += `<div class="fil-health-avg">
        <span class="fil-health-avg-label">${t('filament.avg_remaining')}</span>
        <span class="fil-health-avg-value" style="color:${avg > 50 ? 'var(--accent-green)' : avg > 20 ? 'var(--accent-orange)' : 'var(--accent-red)'}">${avg}%</span>
      </div>`;
      return h;
    },

    'restock-suggestions': () => {
      let h = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
        ${t('filament.restock_title')}
      </div>`;
      h += `<div id="restock-container"><span class="text-muted text-sm">Loading...</span></div>`;
      setTimeout(() => _loadRestockSuggestions(), 0);
      return h;
    },

    'usage-predictions': () => {
      let h = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        ${t('filament.usage_predictions')}
      </div>`;
      h += `<div id="usage-predictions-container"><span class="text-muted text-sm">Loading...</span></div>`;
      setTimeout(() => _loadUsagePredictions(), 0);
      return h;
    },

    'cost-estimation': () => {
      let h = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
        ${t('filament.cost_estimate')}
      </div>`;
      h += `<div id="cost-estimation-container"><span class="text-muted text-sm">Loading...</span></div>`;
      setTimeout(() => _loadCostEstimation(), 0);
      return h;
    },

    'usage-history': () => {
      let h = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        ${t('filament.usage_history')}
      </div>`;
      h += `<div id="usage-history-container"><span class="text-muted text-sm">Loading...</span></div>`;
      setTimeout(() => loadUsageHistory(), 0);
      return h;
    },

    // ── Drying dashboard (unified) ──
    'drying-dashboard': () => {
      // Stats hero
      const activeCount = _dryingSessions?.length || 0;
      const needsDrying = _dryingStatus?.filter(d => d.drying_status === 'overdue' || d.drying_status === 'due_soon').length || 0;
      const needsColor = needsDrying > 0 ? '#f0883e' : '#3fb950';
      let h = `<div class="fil-hero-grid" style="margin-bottom:16px">
        ${heroCard('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 100 20 10 10 0 000-20z"/><path d="M12 6v6l4 2"/></svg>', activeCount, t('filament.drying_stats_active'), activeCount > 0 ? '#f0883e' : '#8b949e')}
        ${heroCard('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>', '<span id="drying-stat-total">...</span>', t('filament.drying_stats_total'), '#3fb950')}
        ${heroCard('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>', '<span id="drying-stat-humidity">...</span>', t('filament.drying_stats_humidity'), '#1279ff')}
        ${heroCard('<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>', needsDrying, t('filament.drying_stats_needs'), needsColor)}
      </div>`;

      // Sub-tabs + quick-start
      h += `<div class="drying-sub-tabs">
        <button class="drying-sub-tab${_dryingSubTab === 'active' ? ' active' : ''}" onclick="window._switchDryingSubTab('active')">${t('filament.drying_sub_active')}${activeCount > 0 ? ' (' + activeCount + ')' : ''}</button>
        <button class="drying-sub-tab${_dryingSubTab === 'history' ? ' active' : ''}" onclick="window._switchDryingSubTab('history')">${t('filament.drying_sub_history')}</button>
        <button class="drying-sub-tab${_dryingSubTab === 'presets' ? ' active' : ''}" onclick="window._switchDryingSubTab('presets')">${t('filament.drying_sub_presets')}</button>
        <div style="flex:1"></div>
        <button class="form-btn form-btn-sm" data-ripple onclick="window._dryingQuickStart()" style="display:flex;align-items:center;gap:4px">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          ${t('filament.drying_quick_start')}
        </button>
      </div>`;

      // Sub-tab content container
      h += `<div id="drying-sub-content"></div>`;
      setTimeout(() => {
        _renderDryingSubContent();
        _loadDryingStats();
      }, 0);
      return h;
    },

    // ── Tools dashboard (unified) ──
    'tools-dashboard': () => {
      const tabs = [
        { id: 'spools', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>', label: t('filament.tools_sub_spools') },
        { id: 'colors', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2"/><circle cx="8" cy="8" r="2"/><circle cx="16" cy="8" r="2"/><circle cx="8" cy="16" r="2"/><circle cx="16" cy="16" r="2"/></svg>', label: t('filament.color_card') },
        { id: 'tags', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8.32a7.43 7.43 0 010 7.36"/><path d="M9.46 6.21a11.76 11.76 0 010 11.58"/><path d="M12.91 4.1a16.09 16.09 0 010 15.8"/><path d="M16.37 2a20.42 20.42 0 010 20"/></svg>', label: t('filament.nfc_manager') },
        { id: 'reference', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>', label: t('filament.material_reference') },
        { id: 'compat', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>', label: t('filament.compatibility') },
        { id: 'tempguide', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>', label: t('filament.temp_guide') }
      ];
      let h = `<div class="drying-sub-tabs">`;
      for (const tab of tabs) {
        h += `<button class="drying-sub-tab${_toolsSubTab === tab.id ? ' active' : ''}" onclick="window._switchToolsSubTab('${tab.id}')" class="drying-sub-tab-inner">${tab.icon} ${tab.label}</button>`;
      }
      h += `</div>`;
      h += `<div id="tools-sub-content"></div>`;
      setTimeout(() => _renderToolsSubContent(), 0);
      return h;
    },

    // ── Filament Database modules ──
    'db-hero': () => {
      let h = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
        ${t('filament.tab_database')}
      </div>`;
      if (!_dbStats) {
        h += '<div id="db-hero-container"><span class="text-muted text-sm">Loading...</span></div>';
        setTimeout(() => _loadDbStats(), 0);
        return h;
      }
      h += `<div class="fil-hero-grid">
        ${heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>', _dbStats.total.toLocaleString(), t('filament.db_total'), '#1279ff')}
        ${heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>', _dbStats.brands.toLocaleString(), t('filament.db_brands'), '#00e676')}
        ${heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>', _dbStats.materials.toLocaleString(), t('filament.db_materials'), '#f0883e')}
        ${heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>', _dbStats.with_k_value.toLocaleString(), t('filament.db_with_k'), '#9b4dff')}
        ${heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/></svg>', _dbStats.with_td.toLocaleString(), t('filament.db_with_td'), '#e3b341')}
        ${_dbStats.translucent ? heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10"/></svg>', _dbStats.translucent.toLocaleString(), t('filament.translucent') || 'Transparent', '#67e8f9') : ''}
        ${_dbStats.glow_in_dark ? heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 009 9 9 9 0 11-9-9z"/></svg>', _dbStats.glow_in_dark.toLocaleString(), t('filament.glow') || 'Glow', '#bef264') : ''}
        ${_dbStats.multi_color ? heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="9" r="6"/><circle cx="15" cy="15" r="6"/></svg>', _dbStats.multi_color.toLocaleString(), t('filament.multi_color') || 'Flerfarge', '#f9a8d4') : ''}
      </div>`;
      return h;
    },

    'db-browser': () => {
      let h = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        ${t('filament.db_search_placeholder')}
      </div>`;
      // Search bar
      h += `<div class="db-search-bar">
        <input class="form-input" type="text" placeholder="${t('filament.db_search_placeholder')}" value="${esc(_dbSearch)}" oninput="window._dbOnSearch(this.value)" id="db-search-input">
      </div>`;
      // Filter row
      h += '<div class="db-filters">';
      h += `<select class="form-input form-input-sm" onchange="window._dbSetBrand(this.value)" style="max-width:180px"><option value="">${t('filament.filter_all_brands')}</option>`;
      for (const b of _dbBrands) h += `<option value="${esc(b)}"${b===_dbFilterBrand?' selected':''}>${esc(b)}</option>`;
      h += '</select>';
      h += `<select class="form-input form-input-sm" onchange="window._dbSetMaterial(this.value)" style="max-width:140px"><option value="">${t('filament.filter_all_materials')}</option>`;
      for (const m of _dbMaterials) h += `<option value="${esc(m)}"${m===_dbFilterMaterial?' selected':''}>${esc(m)}</option>`;
      h += '</select>';
      h += `<select class="form-input form-input-sm" onchange="window._dbSetCategory(this.value)" style="max-width:140px"><option value="">${t('filament.db_all_categories')}</option>`;
      for (const c of ['standard','engineering','composite','flexible','specialty','support']) h += `<option value="${c}"${c===_dbFilterCategory?' selected':''}>${c[0].toUpperCase()+c.slice(1)}</option>`;
      h += '</select>';
      h += `<label class="db-filter-check"><input type="checkbox" ${_dbFilterHasK?'checked':''} onchange="window._dbToggleK(this.checked)"> K-Value</label>`;
      h += `<label class="db-filter-check"><input type="checkbox" ${_dbFilterHasTd?'checked':''} onchange="window._dbToggleTd(this.checked)"> TD</label>`;
      h += `<label class="db-filter-check"><input type="checkbox" ${_dbFilterTranslucent?'checked':''} onchange="window._dbToggleTranslucent(this.checked)"> ${t('filament.translucent') || 'Transparent'}</label>`;
      h += `<label class="db-filter-check"><input type="checkbox" ${_dbFilterGlow?'checked':''} onchange="window._dbToggleGlow(this.checked)"> ${t('filament.glow') || 'Glow'}</label>`;
      h += `<label class="db-filter-check"><input type="checkbox" ${_dbFilterMultiColor?'checked':''} onchange="window._dbToggleMultiColor(this.checked)"> ${t('filament.multi_color') || 'Multi'}</label>`;
      h += '</div>';
      // Toolbar
      h += '<div class="db-toolbar">';
      h += '<div class="db-view-toggle">';
      for (const [mode, icon] of [['cards','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>'],['table','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>']]) {
        h += `<button class="form-btn form-btn-sm${_dbViewMode===mode?' active':''}" onclick="window._dbSetView('${mode}')" title="${mode}">${icon}</button>`;
      }
      h += '</div>';
      h += `<select class="form-input form-input-sm" onchange="window._dbSetSort(this.value)" style="max-width:160px">`;
      for (const [val, label] of [['manufacturer','Brand'],['name','Name'],['material','Material'],['extruder_temp','Temp'],['pressure_advance_k','K-Value'],['td_value','TD Value'],['price','Price'],['rating',t('filament.community_sort_rating')],['newest',t('filament.community_sort_newest')]]) {
        h += `<option value="${val}"${_dbSort===val?' selected':''}>${label}</option>`;
      }
      h += '</select>';
      h += `<button class="form-btn form-btn-sm" onclick="window._dbToggleSortDir()" title="Sort direction">${_dbSortDir==='ASC'?'&#x2191;':'&#x2193;'}</button>`;
      h += `<span class="db-results-count">${_dbTotal.toLocaleString()} ${t('filament.db_results')}</span>`;
      h += '</div>';
      // Results
      h += '<div id="db-results-container">';
      if (!_dbLoaded) {
        h += '<span class="text-muted text-sm">Loading...</span>';
        setTimeout(() => _loadDbFilaments(), 0);
      } else if (_dbFilaments.length === 0) {
        h += `<p class="text-muted" style="font-size:0.85rem;padding:20px 0;text-align:center">${t('filament.db_no_results')}</p>`;
      } else {
        h += _renderDbResults();
      }
      h += '</div>';
      // Pagination
      if (_dbLoaded && _dbTotal > _dbPageSize) {
        const totalPages = Math.ceil(_dbTotal / _dbPageSize);
        h += '<div class="db-pagination">';
        h += `<button class="form-btn form-btn-sm" onclick="window._dbPrevPage()" ${_dbPage===0?'disabled':''}>&#x2190;</button>`;
        h += `<span class="db-page-info">${_dbPage+1} / ${totalPages}</span>`;
        h += `<button class="form-btn form-btn-sm" onclick="window._dbNextPage()" ${_dbPage>=totalPages-1?'disabled':''}>&#x2192;</button>`;
        h += '</div>';
      }
      // Compare bar
      if (_dbCompare.length > 0) {
        h += `<div class="db-compare-bar">
          <span>${_dbCompare.length} ${t('filament.db_compare')}</span>
          <button class="form-btn form-btn-sm" onclick="window._dbShowCompare()">${t('filament.db_compare')}</button>
          <button class="form-btn form-btn-sm" onclick="window._dbClearCompare()">${t('filament.db_clear_compare')}</button>
        </div>`;
      }
      return h;
    }
  };

  // ═══ Spool card rendering ═══
  function _cleanProfileName(s) {
    let name = s.profile_name || s.material || '--';
    if (s.vendor_name && name.startsWith(s.vendor_name + ' ')) {
      name = name.substring(s.vendor_name.length + 1);
    }
    return name;
  }

  function renderColorSwatch(s, size) {
    const color = hexToRgb(s.color_hex);
    const pct = spoolPct(s) || 80;
    if (typeof miniSpool === 'function') return miniSpool(color, size || 16, pct);
    const bg = _buildColorStyle(s.color_hex, s.multi_color_hexes, s.multi_color_direction);
    return `<span class="filament-color-swatch" style="background:${bg}"></span>`;
  }

  function renderSpoolCard(s) {
    const pct = spoolPct(s);
    const color = hexToRgb(s.color_hex);
    const isLow = (pct > 0 && pct < _lowStockPct) || (_lowStockGrams > 0 && s.remaining_weight_g > 0 && s.remaining_weight_g < _lowStockGrams);
    const isEmpty = pct === 0 && s.used_weight_g > 0;
    const lowClass = isEmpty ? 'filament-card-empty' : isLow ? 'filament-card-low' : '';
    const archivedClass = s.archived ? 'filament-card-archived' : '';
    const cleanName = _cleanProfileName(s);
    const subtitle = [s.vendor_name, s.diameter && s.diameter !== 1.75 ? s.diameter + 'mm' : ''].filter(Boolean).join(' · ');
    // Drying status indicator
    const dryStatus = _dryingStatus.find(d => d.id === s.id);
    const dryIcon = dryStatus?.drying_status === 'overdue' ? `<span class="fil-dry-badge fil-dry-overdue" title="${t('filament.drying_status_overdue')}">&#x1F534;</span>`
      : dryStatus?.drying_status === 'due_soon' ? `<span class="fil-dry-badge" title="${t('filament.drying_status_due_soon')}">&#x1F7E1;</span>`
      : dryStatus?.drying_status === 'fresh' ? `<span class="fil-dry-badge" title="${t('filament.drying_status_fresh')}">&#x1F7E2;</span>`
      : '';
    // Compatibility check
    const compatWarnings = checkCompatibility(s);
    const compatIcon = compatWarnings.length > 0
      ? `<span class="fil-compat-warn" title="${esc(compatWarnings.join('\n'))}">&#x26A0;&#xFE0F;</span>`
      : '';
    const infoParts = [`${pct}%`];
    if (s.remaining_length_m) infoParts.push(s.remaining_length_m.toFixed(1) + 'm');
    if (s.short_id) infoParts.push('#' + s.short_id);
    if (s.location) infoParts.push('📍' + esc(s.location));
    if (s.storage_method) infoParts.push(s.storage_method === 'dry_box' ? '📦' : s.storage_method === 'vacuum_bag' ? '🫙' : '🌬');
    if (s.transmission_distance) infoParts.push('TD:' + s.transmission_distance);
    if (s.last_used_at) {
      const daysAgo = Math.floor((Date.now() - new Date(s.last_used_at).getTime()) / 86400000);
      if (daysAgo < 1) infoParts.push(t('filament.used_today'));
      else if (daysAgo < 60) infoParts.push(t('filament.days_ago', { n: daysAgo }));
      else infoParts.push(t('filament.months_ago', { n: Math.floor(daysAgo / 30) }));
    }
    if (s.archived) infoParts.push('📦');
    if (s.is_refill) infoParts.push('♻ x' + (s.refill_count || 1));
    const footerLeft = [
      s.printer_id ? '🖨 ' + esc(printerName(s.printer_id)) : '',
      s.ams_unit != null ? `AMS${s.ams_unit+1}:${(s.ams_tray||0)+1}` : ''
    ].filter(Boolean).join(' ');

    return `
      <div class="filament-card inv-spool-card ${lowClass} ${archivedClass}" data-spool-id="${s.id}" onclick="if(!event.target.closest('button,input,a,.fil-spool-actions'))window._showSpoolDetail(${s.id})" style="cursor:pointer">
        <div class="fil-spool-top">
          <div class="fil-spool-identity">
            <input type="checkbox" class="fil-bulk-check" onclick="toggleSpoolSelect(${s.id}, this)" ${_selectedSpools.has(s.id) ? 'checked' : ''} title="${t('filament.bulk_select')}">
            ${renderColorSwatch(s)}
            <strong>${esc(cleanName)}</strong>
          </div>
          <div class="fil-spool-actions">
            <button class="filament-edit-btn fil-fav-btn ${s.is_favorite ? 'fil-fav-active' : ''}" onclick="toggleFavorite(${s.id})" title="${s.is_favorite ? t('filament.remove_favorite') : t('filament.add_favorite')}" data-tooltip="${s.is_favorite ? t('filament.remove_favorite') : t('filament.add_favorite')}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="${s.is_favorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
            ${s.archived ? `<button class="filament-edit-btn" onclick="unarchiveSpoolItem(${s.id})" title="${t('filament.unarchive')}" data-tooltip="${t('filament.unarchive')}">↩</button>` : ''}
            <button class="filament-edit-btn" onclick="showSwatchLabel(${s.id})" title="${t('filament.swatch_label')}" data-tooltip="${t('filament.swatch_label')}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2"/><circle cx="12" cy="12" r="4"/></svg>
            </button>
            <button class="filament-edit-btn" onclick="showSpoolTimeline(${s.id})" title="${t('filament.spool_timeline')}" data-tooltip="${t('filament.spool_timeline')}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </button>
            <button class="filament-edit-btn" onclick="showSpoolLabel(${s.id})" title="${t('filament.qr_label')}" data-tooltip="${t('filament.qr_label')}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/></svg>
            </button>
            <button class="filament-edit-btn" onclick="duplicateSpoolItem(${s.id})" title="${t('filament.duplicate')}" data-tooltip="${t('filament.duplicate')}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            </button>
            <button class="filament-edit-btn" onclick="showMeasureDialog(${s.id})" title="${t('filament.measure_weight')}" data-tooltip="${t('filament.measure_weight')}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/></svg>
            </button>
            <button class="filament-edit-btn" onclick="showStartDryingDialog(${s.id})" title="${t('filament.start_drying')}" data-tooltip="${t('filament.start_drying')}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>
            </button>
            <button class="filament-edit-btn" onclick="window.open('https://store.bambulab.com/collections/filament?q='+encodeURIComponent('${esc(s.material||'')} ${esc(s.color_name||'')}'),'_blank')" title="${t('filament.buy_reorder')}" data-tooltip="${t('filament.buy_reorder')}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
            </button>
            <button class="filament-edit-btn" onclick="showSpoolTagAssign(${s.id})" title="${t('filament.tags_title')}" data-tooltip="${t('filament.tags_title')}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            </button>
            <button class="filament-edit-btn" onclick="showEditSpoolForm(${s.id})" title="${t('settings.edit')}" data-tooltip="${t('settings.edit')}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="filament-edit-btn" onclick="showRefillDialog(${s.id})" title="${t('filament.refill_spool')}" data-tooltip="${t('filament.refill_spool')}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6"/><path d="M21.34 15.57a10 10 0 11-.57-8.38"/></svg>
            </button>
            ${!s.archived ? `<button class="filament-edit-btn" onclick="archiveSpoolItem(${s.id})" title="${t('filament.archive')}" data-tooltip="${t('filament.archive')}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
            </button>` : ''}
            <button class="filament-delete-btn" onclick="deleteSpoolItem(${s.id})" title="${t('settings.delete')}" data-tooltip="${t('settings.delete')}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        ${subtitle ? `<div class="fil-spool-subtitle">${esc(subtitle)}</div>` : ''}
        <div class="fil-bar-row">
          <div class="filament-bar">
            <div class="filament-bar-fill" style="width:${pct}%;background:${isLow || isEmpty ? 'var(--accent-orange)' : color}"></div>
          </div>
          <span class="fil-bar-weight">${spoolRemainG(s)}g / ${Math.round(s.initial_weight_g)}g</span>
        </div>
        <div class="fil-spool-info">${infoParts.join(' · ')}${dryIcon}${compatIcon}</div>
        <div class="fil-spool-footer">
          <span>${footerLeft}</span>
          <span>${s.cost ? formatCurrency(s.cost) : ''}</span>
        </div>
        ${s.tags && s.tags.length ? `<div class="fil-tag-badges">${s.tags.map(tg => `<span class="fil-tag-badge" style="--tag-color:${esc(tg.color || '#58a6ff')}">${esc(tg.name)}</span>`).join('')}</div>` : ''}
        ${s.extra_fields ? renderExtraFields(s.extra_fields) : ''}
        <div id="spool-edit-${s.id}" style="display:none"></div>
      </div>`;
  }

  // ═══ Visual spool card (history-style) ═══
  // Build SVG spool visual — front view with filament wound around hub
  // Exposed globally so other panels (multicolor, etc.) can reuse
  window._spoolSvg = _spoolSvg;
  function _spoolSvg(colorHex, multiColorHexes, multiColorDir, pct, spoolId, size) {
    const sz = size || 80;
    const hubR = 13;
    const maxR = 38;
    const filR = pct > 0 ? hubR + (maxR - hubR) * Math.max(5, pct) / 100 : hubR;

    // Determine fill — solid color or SVG gradient for multi-color
    let defs = '';
    let fillAttr = hexToRgb(colorHex);
    let hexes;
    try { hexes = multiColorHexes ? (typeof multiColorHexes === 'string' ? JSON.parse(multiColorHexes) : multiColorHexes) : null; } catch { hexes = null; }
    if (hexes && hexes.length > 1) {
      const gid = 'sg' + spoolId;
      const horiz = multiColorDir === 'longitudinal';
      defs = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="${horiz?1:0}" y2="${horiz?0:1}">`;
      hexes.forEach((h, i) => { defs += `<stop offset="${(i/(hexes.length-1)).toFixed(2)}" stop-color="${hexToRgb(h)}"/>`; });
      defs += '</linearGradient></defs>';
      fillAttr = `url(#${gid})`;
    }

    // Winding texture lines
    let windings = '';
    if (pct > 8) {
      const gap = (filR - hubR) / Math.min(5, Math.max(2, Math.round((filR - hubR) / 4)));
      for (let r = hubR + gap; r < filR - 1; r += gap) {
        windings += `<circle cx="50" cy="50" r="${r.toFixed(1)}" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="0.6"/>`;
      }
    }

    // Flange notches (4 small marks on outer edge)
    const notches = [0, 90, 180, 270].map(deg => {
      const rad = deg * Math.PI / 180;
      const x1 = 50 + 40 * Math.cos(rad), y1 = 50 + 40 * Math.sin(rad);
      const x2 = 50 + 44 * Math.cos(rad), y2 = 50 + 44 * Math.sin(rad);
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="var(--border-color)" stroke-width="1.2" opacity="0.4"/>`;
    }).join('');

    return `<svg viewBox="0 0 100 100" width="${sz}" height="${sz}" class="spool-svg">
      ${defs}
      <circle cx="50" cy="50" r="44" fill="rgba(0,0,0,0.06)"/>
      <circle cx="50" cy="50" r="42" class="spool-flange"/>
      ${notches}
      <circle cx="50" cy="50" r="${filR.toFixed(1)}" fill="${fillAttr}" class="spool-filament"/>
      ${windings}
      <circle cx="50" cy="50" r="${hubR}" class="spool-hub"/>
      <circle cx="50" cy="50" r="5" class="spool-hole"/>
    </svg>`;
  }

  function _renderSpoolVisualCard(s) {
    const pct = spoolPct(s);
    const cleanName = _cleanProfileName(s);
    const vendorName = s.vendor_name || '--';
    const remaining = `${spoolRemainG(s)}g / ${Math.round(s.initial_weight_g)}g`;
    const isLow = (pct > 0 && pct < _lowStockPct);
    const isEmpty = pct === 0 && s.used_weight_g > 0;
    const statusColor = isEmpty ? 'var(--accent-red)' : isLow ? 'var(--accent-orange)' : 'var(--accent-green)';
    const statusText = isEmpty ? t('filament.status_empty', 'Tom') : isLow ? t('filament.status_low', 'Lav') : `${pct}%`;

    return `<div class="spool-vcard" onclick="window._showSpoolDetail(${s.id})">
      <div class="spool-vcard-thumb">
        ${_spoolSvg(s.color_hex, s.multi_color_hexes, s.multi_color_direction, pct, s.id)}
        <span class="spool-vcard-badge">${esc(s.material || '--')}</span>
        ${s.is_favorite ? '<span class="spool-vcard-fav">♥</span>' : ''}
      </div>
      <div class="spool-vcard-info">
        <div class="spool-vcard-name" title="${esc(cleanName)}">${esc(cleanName)}</div>
        <div class="spool-vcard-meta">${esc(vendorName)} · ${remaining}</div>
        <div class="spool-vcard-bottom">
          <span class="spool-vcard-pct" style="color:${statusColor}">${statusText}</span>
          <div class="spool-vcard-bar"><div class="spool-vcard-bar-fill" style="width:${pct}%;background:${statusColor}"></div></div>
        </div>
      </div>
    </div>`;
  }

  // ═══ Spool detail overlay ═══
  window._showSpoolDetail = async function(id) {
    const s = _spools.find(sp => sp.id === id);
    if (!s) return;
    const pct = spoolPct(s);
    const colorStyle = _buildColorStyle(s.color_hex, s.multi_color_hexes, s.multi_color_direction);
    const isLight = isLightColor(s.color_hex);
    const textColor = isLight ? '#333' : '#fff';
    const cleanName = _cleanProfileName(s);
    const isEmpty = pct === 0 && s.used_weight_g > 0;
    const isLow = (pct > 0 && pct < _lowStockPct);
    const statusColor = isEmpty ? 'var(--accent-red)' : isLow ? 'var(--accent-orange)' : 'var(--accent-green)';
    const statusText = isEmpty ? t('filament.status_empty', 'Tom') : isLow ? t('filament.status_low_stock', 'Lav beholdning') : t('filament.status_in_stock', 'På lager');

    const daysAgo = s.last_used_at ? Math.floor((Date.now() - new Date(s.last_used_at).getTime()) / 86400000) : null;
    const lastUsedText = daysAgo !== null ? (daysAgo < 1 ? t('filament.today', 'I dag') : daysAgo + ' ' + t('filament.days_ago', 'dager siden')) : '--';
    const amsText = s.ams_unit != null ? `AMS${s.ams_unit+1} ${t('filament.slot', 'spor')} ${(s.ams_tray||0)+1}` : '--';
    const printerText = s.printer_id ? printerName(s.printer_id) : '--';

    // Fetch print stats
    let ps = null;
    try {
      const res = await fetch(`/api/inventory/spools/${id}/print-stats`);
      if (res.ok) ps = await res.json();
    } catch {}

    const costPerG = ps ? ps.cost_per_g : 0;
    const fmtTime = (sec) => {
      if (!sec) return '--';
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      return h > 0 ? `${h}t ${m}m` : `${m}m`;
    };

    const overlay = document.createElement('div');
    overlay.className = 'ph-detail-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    overlay.innerHTML = `<div class="ph-detail-panel spool-detail-panel">
      <button class="ph-detail-close" onclick="this.closest('.ph-detail-overlay').remove()">&times;</button>
      <div class="ph-detail-layout">
        <div class="ph-detail-left">
          <div class="spool-detail-color spool-detail-spool-bg">
            ${_spoolSvg(s.color_hex, s.multi_color_hexes, s.multi_color_direction, pct, s.id, 140)}
          </div>
          <div class="ph-detail-status-banner" style="background:${statusColor}">
            <span>${statusText} · ${pct}%</span>
          </div>
          <div class="spool-detail-bar-section">
            <div class="spool-detail-bar-wrap">
              <div class="spool-vcard-bar spool-detail-bar"><div class="spool-vcard-bar-fill spool-detail-bar-fill" style="width:${pct}%;background:${statusColor}"></div></div>
              <div class="spool-detail-weight-row">
                <span>${spoolRemainG(s)}g ${t('filament.remaining_short', 'igjen')}</span>
                <span>${Math.round(s.initial_weight_g)}g ${t('filament.total_short', 'total')}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="ph-detail-right">
          <div class="ph-detail-header">
            <h3 class="ph-detail-title">${esc(cleanName)}</h3>
          </div>
          <div class="ph-detail-grid">
            <div class="ph-detail-field">
              <span class="ph-detail-label">${t('filament.brand', 'Merke')}</span>
              <span class="ph-detail-value">${esc(s.vendor_name || '--')}</span>
            </div>
            <div class="ph-detail-field">
              <span class="ph-detail-label">${t('filament.type', 'Materiale')}</span>
              <span class="ph-detail-value">${typeof miniSpool === 'function' ? miniSpool(hexToRgb(s.color_hex), 14) : `<span class="color-dot" style="background:${hexToRgb(s.color_hex)}"></span>`} ${esc(s.material || '--')}</span>
            </div>
            <div class="ph-detail-field">
              <span class="ph-detail-label">${t('filament.color', 'Farge')}</span>
              <span class="ph-detail-value">${esc(s.color_name || '--')}</span>
            </div>
            <div class="ph-detail-field">
              <span class="ph-detail-label">${t('filament.diameter', 'Diameter')}</span>
              <span class="ph-detail-value">${s.diameter || 1.75}mm</span>
            </div>
            <div class="ph-detail-field">
              <span class="ph-detail-label">${t('filament.used_weight', 'Brukt')}</span>
              <span class="ph-detail-value">${Math.round(s.used_weight_g || 0)}g</span>
            </div>
            <div class="ph-detail-field">
              <span class="ph-detail-label">${t('filament.remaining', 'Gjenstående')}</span>
              <span class="ph-detail-value">${spoolRemainG(s)}g (${pct}%)</span>
            </div>
            <div class="ph-detail-field">
              <span class="ph-detail-label">${t('common.printer', 'Printer')}</span>
              <span class="ph-detail-value">${esc(printerText)}</span>
            </div>
            <div class="ph-detail-field">
              <span class="ph-detail-label">${t('filament.ams_slot', 'AMS-plassering')}</span>
              <span class="ph-detail-value">${amsText}</span>
            </div>
            ${s.cost ? `<div class="ph-detail-field">
              <span class="ph-detail-label">${t('filament.spool_price', 'Spolpris')}</span>
              <span class="ph-detail-value">${formatCurrency(s.cost)}</span>
            </div>` : ''}
            ${costPerG > 0 ? `<div class="ph-detail-field">
              <span class="ph-detail-label">${t('filament.price_per_gram', 'Pris/gram')}</span>
              <span class="ph-detail-value">${formatCurrency(costPerG, 3)}</span>
            </div>` : ''}
            <div class="ph-detail-field">
              <span class="ph-detail-label">${t('filament.last_used', 'Sist brukt')}</span>
              <span class="ph-detail-value">${lastUsedText}</span>
            </div>
            ${s.location ? `<div class="ph-detail-field">
              <span class="ph-detail-label">${t('filament.location', 'Plassering')}</span>
              <span class="ph-detail-value">${esc(s.location)}</span>
            </div>` : ''}
            ${s.lot_number ? `<div class="ph-detail-field">
              <span class="ph-detail-label">${t('filament.lot_number', 'Lot-nummer')}</span>
              <span class="ph-detail-value">${esc(s.lot_number)}</span>
            </div>` : ''}
          </div>
          ${ps && ps.total_prints > 0 ? `
          <div class="ph-detail-divider"></div>
          <div class="ph-detail-field ph-detail-field-wide">
            <span class="ph-detail-label">${t('filament.usage_stats', 'Bruksstatistikk')}</span>
          </div>
          <div class="ph-detail-grid">
            <div class="ph-detail-field">
              <span class="ph-detail-label">${t('filament.total_prints', 'Antall prints')}</span>
              <span class="ph-detail-value">${ps.total_prints} (${ps.completed_prints} ${t('filament.detail_completed', 'fullført')}${ps.failed_prints > 0 ? ', ' + ps.failed_prints + ' ' + t('filament.detail_failed', 'feilet') : ''})</span>
            </div>
            <div class="ph-detail-field">
              <span class="ph-detail-label">${t('filament.total_print_time', 'Total printtid')}</span>
              <span class="ph-detail-value">${fmtTime(ps.total_print_time_s)}</span>
            </div>
            <div class="ph-detail-field">
              <span class="ph-detail-label">${t('filament.avg_per_print', 'Snitt per print')}</span>
              <span class="ph-detail-value">${Math.round(ps.avg_per_print_g)}g</span>
            </div>
            ${ps.total_cost_used > 0 ? `<div class="ph-detail-field">
              <span class="ph-detail-label">${t('filament.cost_used', 'Filamentkostnad brukt')}</span>
              <span class="ph-detail-value">${formatCurrency(ps.total_cost_used)}</span>
            </div>` : ''}
            ${ps.remaining_value > 0 ? `<div class="ph-detail-field">
              <span class="ph-detail-label">${t('filament.remaining_value', 'Gjenværende verdi')}</span>
              <span class="ph-detail-value">${formatCurrency(ps.remaining_value)}</span>
            </div>` : ''}
            ${ps.waste_from_failed_g > 0 ? `<div class="ph-detail-field">
              <span class="ph-detail-label">${t('filament.waste_failed', 'Svinn (feilede)')}</span>
              <span class="ph-detail-value">${Math.round(ps.waste_from_failed_g)}g (${formatCurrency(ps.waste_from_failed_g * costPerG)})</span>
            </div>` : ''}
          </div>
          <div class="ph-detail-divider"></div>
          <div class="ph-detail-field ph-detail-field-wide">
            <span class="ph-detail-label">${t('filament.recent_prints', 'Siste prints')}</span>
          </div>
          <div class="spool-print-list">
            ${ps.prints.slice(0, 8).map(p => `<div class="spool-print-row">
              <span class="spool-print-name" title="${esc(p.filename || '')}">${esc((p.filename || '?').replace(/\.gcode\.3mf$|\.3mf$|\.gcode$/i, '').substring(0, 35))}</span>
              <span class="spool-print-meta">${Math.round(p.used_g)}g${costPerG > 0 ? ' · ' + formatCurrency(p.cost) : ''} · ${fmtTime(p.duration_seconds)}</span>
              <span class="spool-print-status spool-print-status-${p.status}">${p.status === 'completed' ? '✓' : p.status === 'failed' ? '✗' : '−'}</span>
            </div>`).join('')}
          </div>` : `
          <div class="ph-detail-divider"></div>
          <div class="ph-detail-field ph-detail-field-wide">
            <span class="ph-detail-label">${t('filament.usage_stats', 'Bruksstatistikk')}</span>
            <span class="ph-detail-value spool-detail-muted">${t('filament.no_prints_recorded', 'Ingen prints registrert for denne spolen')}</span>
          </div>`}
          ${s.comment ? `<div class="ph-detail-divider"></div><div class="ph-detail-field ph-detail-field-wide"><span class="ph-detail-label">${t('filament.comment', 'Kommentar')}</span><span class="ph-detail-value">${esc(s.comment)}</span></div>` : ''}
          <div class="ph-detail-divider"></div>
          <div class="spool-detail-actions">
            <button class="form-btn form-btn-sm" data-ripple onclick="this.closest('.ph-detail-overlay').remove();showEditSpoolForm(${s.id})">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              ${t('settings.edit', 'Rediger')}
            </button>
            <button class="form-btn form-btn-sm" data-ripple onclick="this.closest('.ph-detail-overlay').remove();showMeasureDialog(${s.id})">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18M3 12h18"/></svg>
              ${t('filament.weigh', 'Vei')}
            </button>
            <button class="form-btn form-btn-sm" data-ripple onclick="this.closest('.ph-detail-overlay').remove();showStartDryingDialog(${s.id})">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>
              ${t('filament.dry', 'Tørk')}
            </button>
            <button class="form-btn form-btn-sm" data-ripple onclick="this.closest('.ph-detail-overlay').remove();showSpoolTimeline(${s.id})">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${t('filament.history', 'Historikk')}
            </button>
            <button class="form-btn form-btn-sm" data-ripple onclick="this.closest('.ph-detail-overlay').remove();showSpoolLabel(${s.id})">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              QR
            </button>
          </div>
        </div>
      </div>
    </div>`;

    document.body.appendChild(overlay);
  };

  function _renderSpoolGroups(spools) {
    const groupFn = {
      material: s => s.material || 'Unknown',
      brand: s => s.brand || 'Unknown',
      color: s => _classifyColor(s.color_hex) || 'Other',
      location: s => s.location || t('filament.no_location')
    }[_groupBy] || (s => s.material || 'Unknown');
    const groups = {};
    for (const s of spools) {
      const key = groupFn(s);
      (groups[key] || (groups[key] = [])).push(s);
    }
    const sortedKeys = Object.keys(groups).sort((a, b) => a.localeCompare(b));
    let h = `<div class="inv-group-bar">
      <span class="inv-group-label">${t('filament.group_by')}:</span>
      ${[['material','material'],['brand','vendor'],['color','color'],['location','location']].map(([g, k]) =>
        `<button class="form-btn form-btn-sm inv-group-btn ${_groupBy === g ? '' : 'form-btn-ghost'}" data-ripple onclick="window._setGroupBy('${g}')">${t('filament.group_by_' + k)}</button>`
      ).join('')}
    </div>`;
    for (const key of sortedKeys) {
      const grp = groups[key];
      const totalWeight = grp.reduce((s, sp) => s + (sp.remaining_weight_g || 0), 0);
      h += `<div class="inv-group-section">
        <div class="inv-group-header">
          <span>${key}</span>
          <span class="inv-group-meta">${grp.length} ${t('filament.total_spools').toLowerCase()} &middot; ${Math.round(totalWeight)}g</span>
        </div>
        <div class="filament-grid">`;
      for (const s of grp) h += renderSpoolCard(s);
      h += '</div></div>';
    }
    return h;
  }

  window._setGroupBy = function(g) { _groupBy = g; localStorage.setItem('inv-group-by', g); loadFilament(); };

  function _renderSpoolList(spools) {
    let h = '<div class="inv-list-view">';
    for (const s of spools) {
      const pct = spoolPct(s);
      const color = hexToRgb(s.color_hex);
      const name = _cleanProfileName(s);
      const favIcon = s.is_favorite ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="#e53935" stroke="#e53935" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' : '';
      h += `<div class="inv-list-row" data-spool-id="${s.id}" onclick="if(!event.target.closest('button,input,a'))window._showSpoolDetail(${s.id})" style="cursor:pointer">
        ${miniSpool(color, 14, pct)}
        <span class="inv-list-name">${favIcon} <strong>${esc(name)}</strong> <span class="text-muted">${esc(s.vendor_name || '')}</span></span>
        <span class="inv-list-material">${s.material || '--'}</span>
        <div class="inv-list-bar"><div class="filament-bar" style="width:80px;height:6px"><div class="filament-bar-fill" style="width:${pct}%;background:${(pct > 0 && pct < _lowStockPct) || (_lowStockGrams > 0 && s.remaining_weight_g > 0 && s.remaining_weight_g < _lowStockGrams) ? 'var(--accent-orange)' : color}"></div></div></div>
        <span class="inv-list-weight">${spoolRemainG(s)}g / ${Math.round(s.initial_weight_g)}g</span>
        <span class="inv-list-loc text-muted">${s.location || ''}</span>
        <span class="inv-list-cost">${s.cost ? formatCurrency(s.cost) : ''}</span>
        <span class="inv-list-actions">
          <button class="filament-edit-btn fil-fav-btn ${s.is_favorite ? 'fil-fav-active' : ''}" onclick="toggleFavorite(${s.id})" title="${t('filament.toggle_favorite')}" aria-label="${t('filament.toggle_favorite')}"><svg width="11" height="11" viewBox="0 0 24 24" fill="${s.is_favorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button>
          <button class="filament-edit-btn" onclick="showEditSpoolForm(${s.id})" title="${t('settings.edit')}" aria-label="${t('settings.edit')}"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          <button class="filament-delete-btn" onclick="deleteSpoolItem(${s.id})" title="${t('settings.delete')}" aria-label="${t('settings.delete')}"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </span>
      </div>`;
    }
    h += '</div>';
    return h;
  }

  function _renderSpoolTable(spools) {
    let h = `<div class="inv-table-wrap"><table class="data-table inv-table-view">
      <thead><tr>
        <th></th><th>${t('filament.profile_name')}</th><th>${t('filament.type')}</th>
        <th>${t('filament.brand')}</th><th>${t('filament.remaining')}</th><th>%</th>
        <th>${t('filament.location')}</th><th>${t('filament.price')}</th><th>${t('common.printer')}</th><th></th>
      </tr></thead><tbody>`;
    for (const s of spools) {
      const pct = spoolPct(s);
      const color = hexToRgb(s.color_hex);
      const name = _cleanProfileName(s);
      h += `<tr data-spool-id="${s.id}" class="${s.archived ? 'filament-card-archived' : ''}" onclick="if(!event.target.closest('button,input,a'))window._showSpoolDetail(${s.id})" style="cursor:pointer">
        <td>${miniSpool(color, 12, pct)}</td>
        <td><strong>${esc(name)}</strong>${s.is_favorite ? ' <span style="color:#e53935">♥</span>' : ''}</td>
        <td>${s.material || '--'}</td>
        <td>${esc(s.vendor_name || '--')}</td>
        <td>${spoolRemainG(s)}g / ${Math.round(s.initial_weight_g)}g</td>
        <td style="color:${(pct > 0 && pct < _lowStockPct) || (_lowStockGrams > 0 && s.remaining_weight_g > 0 && s.remaining_weight_g < _lowStockGrams) ? 'var(--accent-orange)' : 'inherit'}">${pct}%</td>
        <td>${esc(s.location || '--')}</td>
        <td>${s.cost ? formatCurrency(s.cost) : '--'}</td>
        <td>${s.printer_id ? esc(printerName(s.printer_id)) : '--'}</td>
        <td style="white-space:nowrap">
          <button class="filament-edit-btn fil-fav-btn ${s.is_favorite ? 'fil-fav-active' : ''}" onclick="toggleFavorite(${s.id})" title="${t('filament.toggle_favorite')}" aria-label="${t('filament.toggle_favorite')}"><svg width="11" height="11" viewBox="0 0 24 24" fill="${s.is_favorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button>
          <button class="filament-edit-btn" onclick="showEditSpoolForm(${s.id})" title="${t('settings.edit')}" aria-label="${t('settings.edit')}"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          <button class="filament-delete-btn" onclick="deleteSpoolItem(${s.id})" title="${t('settings.delete')}" aria-label="${t('settings.delete')}"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </td>
      </tr>`;
    }
    h += '</tbody></table></div>';
    return h;
  }

  function renderExtraFields(json) {
    let obj;
    try { obj = typeof json === 'string' ? JSON.parse(json) : json; } catch { return ''; }
    if (!obj || typeof obj !== 'object' || Object.keys(obj).length === 0) return '';
    let h = '<div class="fil-extra-fields">';
    for (const [k, v] of Object.entries(obj)) {
      h += `<span class="fil-extra-field"><span class="fil-extra-key">${esc(k)}</span> ${esc(String(v))}</span>`;
    }
    h += '</div>';
    return h;
  }

  // ═══ Active filament display ═══
  function buildActiveFilamentContent() {
    const state = window.printerState;
    if (!state) return `<p class="text-muted text-sm">${t('common.no_ams_data')}</p>`;
    const ids = state.getPrinterIds();
    if (ids.length === 0) return `<p class="text-muted text-sm">${t('common.no_ams_data')}</p>`;

    let html = '';
    let hasAny = false;
    for (const id of ids) {
      const ps = state._printers[id];
      const printData = ps?.print || ps;
      const amsData = printData?.ams;
      if (!amsData?.ams || amsData.ams.length === 0) continue;
      hasAny = true;
      const name = printerName(id);
      const activeTray = amsData.tray_now;
      html += `<div class="fil-ams-printer"><div class="fil-ams-name">${esc(name)}</div><div class="fil-ams-trays">`;
      let globalSlot = 0;
      for (let u = 0; u < amsData.ams.length; u++) {
        const trays = amsData.ams[u]?.tray;
        if (!trays) continue;
        for (let i = 0; i < trays.length; i++) {
          const tray = trays[i];
          const isActive = String(globalSlot) === String(activeTray);
          if (tray && tray.tray_type) {
            const color = hexToRgbColor(tray.tray_color);
            const light = isLightColor(tray.tray_color);
            const remain = tray.remain >= 0 ? Math.round(tray.remain) : '?';
            const brand = tray.tray_sub_brands || '';
            const slotLabel = amsData.ams.length > 1 ? `AMS${u+1}:${i+1}` : `${i+1}`;
            const remColor = remain < 20 ? 'var(--accent-orange)' : 'var(--accent-green)';
            // Find linked spool
            const linkedSpool = _spools.find(sp => sp.printer_id === id && sp.ams_unit === u && sp.ams_tray === i && !sp.archived);
            html += `<div class="fil-ams-tray ${isActive ? 'fil-ams-tray-active' : ''}">
              <div class="fil-ams-color">${miniSpool(color, 18, remain)}</div>
              <div class="fil-ams-info">
                <span class="fil-ams-type">${tray.tray_type}${brand ? ' · ' + brand : ''}</span>
                ${linkedSpool ? `<span class="fil-ams-linked text-muted" style="font-size:0.65rem">🔗 ${esc(linkedSpool.profile_name || '')} (${Math.round(linkedSpool.remaining_weight_g)}g)</span>` : ''}
                <div class="fil-ams-remain-row">
                  <div class="fil-ams-remain-bar"><div class="fil-ams-remain-fill" style="width:${remain}%;background:${remColor}"></div></div>
                  <span class="fil-ams-remain-pct">${remain}%</span>
                </div>
              </div>
              <span class="fil-ams-slot">${slotLabel}</span>
            </div>`;
          }
          globalSlot++;
        }
      }
      html += '</div></div>';
    }
    if (!hasAny) html += `<p class="text-muted text-sm">${t('common.no_ams_data')}</p>`;
    return html;
  }

  // ═══ Tab switching ═══
  function switchTab(tabId) {
    _activeTab = tabId;
    document.querySelectorAll('.filament-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
    document.querySelectorAll('.filament-tab-panel').forEach(p => {
      const isActive = p.id === `filament-tab-${tabId}`;
      p.classList.toggle('active', isActive);
      p.style.display = isActive ? (TAB_CONFIG[tabId]?.external ? 'block' : 'grid') : 'none';
      if (isActive) {
        p.classList.add('ix-tab-panel');
        p.addEventListener('animationend', () => p.classList.remove('ix-tab-panel'), { once: true });
      }
    });
    // Load external panel content into tab container
    _loadExternalTab(tabId);
    const slug = tabId === 'inventory' ? 'filament' : `filament/${tabId}`;
    if (location.hash !== '#' + slug) history.replaceState(null, '', '#' + slug);
  }

  function _loadExternalTab(tabId) {
    const cfg = TAB_CONFIG[tabId];
    if (!cfg?.external) return;
    const container = document.getElementById(`filament-tab-${tabId}`);
    if (!container) return;
    // Temporarily swap id so external panels render into our tab container
    const realBody = document.getElementById('overlay-panel-body');
    if (realBody) realBody.removeAttribute('id');
    container.id = 'overlay-panel-body';
    if (tabId === 'multicolor' && typeof loadMulticolorPanel === 'function') loadMulticolorPanel();
    container.id = `filament-tab-${tabId}`;
    if (realBody) realBody.id = 'overlay-panel-body';
  }

  // ═══ Main render ═══
  async function loadFilament(initialTab) {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;

    // Accept explicit tab from caller (e.g. loadFilamentPanel('forecast'))
    if (initialTab && TAB_CONFIG[initialTab]) {
      _activeTab = initialTab;
    }

    const hashFull = location.hash.replace('#', '');
    const [hashPath, hashQuery] = hashFull.split('?');
    const hashParts = hashPath.split('/');
    if (hashParts[0] === 'filament' && hashParts[1]) {
      if (hashParts[1] === 'printer' && hashParts[2]) {
        _filterPrinter = hashParts[2];
      } else if (TAB_CONFIG[hashParts[1]]) {
        _activeTab = hashParts[1];
      }
    }
    if (hashQuery) {
      const params = new URLSearchParams(hashQuery);
      if (params.has('material')) _filterMaterial = params.get('material');
      if (params.has('brand')) _filterVendor = params.get('brand');
      if (params.has('location')) _filterLocation = params.get('location');
      if (params.has('search')) _searchQuery = params.get('search');
      if (params.has('view')) _viewMode = params.get('view');
    }

    try {
      // Fetch all data in parallel
      const [spoolsRes, vendorsRes, profilesRes, locationsRes, dryingActiveRes, dryingPresetsRes, dryingStatusRes, tagsRes, alertsRes, settingsRes] = await Promise.all([
        fetch('/api/inventory/spools'),
        fetch('/api/inventory/vendors'),
        fetch('/api/inventory/filaments'),
        fetch('/api/inventory/locations'),
        fetch('/api/inventory/drying/sessions/active'),
        fetch('/api/inventory/drying/presets'),
        fetch('/api/inventory/drying/status'),
        fetch('/api/tags'),
        fetch('/api/inventory/location-alerts'),
        fetch('/api/inventory/settings')
      ]);
      _spools = await spoolsRes.json();
      _vendors = await vendorsRes.json();
      _profiles = await profilesRes.json();
      _locations = await locationsRes.json();
      _dryingSessions = await dryingActiveRes.json();
      _dryingPresets = await dryingPresetsRes.json();
      _dryingStatus = await dryingStatusRes.json();
      _tags = await tagsRes.json();
      let _locationAlerts = [];
      try { _locationAlerts = await alertsRes.json(); } catch {}
      try {
        const _invSettings = await settingsRes.json();
        _lowStockPct = parseInt(_invSettings.low_stock_threshold) || 20;
        _lowStockGrams = parseInt(_invSettings.near_empty_grams) || 0;
      } catch {}
      // Clear old drying timers
      for (const tid of Object.values(_dryingTimers)) clearInterval(tid);
      _dryingTimers = {};

      let html = '';

      // ── Top bar ──
      html += `<div class="tele-top-bar">
        ${window._can && window._can('filament') ? `<div class="inv-export-dropdown" style="display:inline-block">
          <button class="form-btn" data-ripple onclick="showAddSpoolForm()" style="display:flex;align-items:center;gap:4px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>${t('filament.add_spool')}</span>
          </button>
          <button class="form-btn form-btn-sm" data-ripple onclick="showQuickCreate(this)" style="padding:2px 4px;margin-left:-4px;border-radius:0 4px 4px 0" title="${t('filament.quick_create')}">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>` : ''}
        <button class="form-btn form-btn-sm" data-ripple onclick="importFromAms()" style="display:flex;align-items:center;gap:4px" title="${t('filament.import_ams')}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 7h4v4H7zM13 7h4v4h-4zM7 13h4v4H7zM13 13h4v4h-4z"/></svg>
          <span>${t('filament.import_ams')}</span>
        </button>
        <button class="form-btn form-btn-sm" data-ripple onclick="switchFilamentTab('database')" style="display:flex;align-items:center;gap:4px" title="${t('filament.tab_database')}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
          <span>${t('filament.tab_database')}</span>
        </button>
        <div class="inv-export-dropdown">
          <button class="form-btn form-btn-sm" data-ripple onclick="this.nextElementSibling.classList.toggle('show')" style="display:flex;align-items:center;gap:4px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>${t('filament.export')}</span>
          </button>
          <div class="inv-export-menu">
            <button onclick="exportInventory('spools','csv')">${t('filament.export_spools_csv')}</button>
            <button onclick="exportInventory('spools','json')">${t('filament.export_spools_json')}</button>
            <button onclick="exportInventory('filaments','csv')">${t('filament.export_profiles_csv')}</button>
            <button onclick="exportInventory('vendors','csv')">${t('filament.export_vendors_csv')}</button>
            <hr style="margin:4px 0;border-color:var(--border-color)">
            <button onclick="showImportDialog()">${t('filament.import')}</button>
            <hr style="margin:4px 0;border-color:var(--border-color)">
            <button onclick="showAnalyzeFileDialog()">${t('filament.analyze_file')}</button>
          </div>
        </div>
        <button class="form-btn form-btn-sm" data-ripple onclick="openQrScanner()" style="display:flex;align-items:center;gap:4px" title="${t('filament.scan_qr')}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3z"/><path d="M20 14v7h-7"/></svg>
        </button>
        <div style="flex:1"></div>
        <button class="form-btn form-btn-sm" data-ripple onclick="showInventorySettings()" title="${t('filament.settings')}" style="display:flex;align-items:center;gap:4px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        </button>
      </div>`;

      // ── Printer tabs ──
      const printerIds = [...new Set(_spools.map(s => s.printer_id).filter(Boolean))];
      if (printerIds.length > 1) {
        html += '<div class="tabs history-printer-tabs">';
        html += `<button class="tab-btn ${_filterPrinter === 'all' ? 'active' : ''}" onclick="filterFilamentPrinter('all')">${t('history.all_printers')}</button>`;
        for (const pid of printerIds) {
          html += `<button class="tab-btn ${_filterPrinter === pid ? 'active' : ''}" onclick="filterFilamentPrinter('${pid}')">${esc(printerName(pid))}</button>`;
        }
        html += '</div>';
      }

      // Filter spools by selected printer
      const filteredSpools = _filterPrinter === 'all'
        ? _spools : _spools.filter(s => s.printer_id === _filterPrinter);

      // ── Tab bar (sorted alphabetically, inventory first) ──
      html += '<div class="tabs">';
      for (const [id, cfg] of _getSortedTabs()) {
        html += `<button class="tab-btn filament-tab-btn ${id === _activeTab ? 'active' : ''}" data-tab="${id}" onclick="switchFilamentTab('${id}')">${t(cfg.label)}</button>`;
      }
      html += '</div>';

      // Global form container
      html += `<div id="inv-global-form" style="display:none"></div>`;

      // ── Location alerts ──
      if (_locationAlerts.length > 0 && _activeTab === 'inventory') {
        html += '<div style="margin:4px 0;padding:6px 10px;background:var(--bg-warning, rgba(255,165,0,0.1));border:1px solid var(--accent-orange, orange);border-radius:6px;font-size:0.75rem">';
        for (const a of _locationAlerts) {
          html += `<div style="padding:1px 0">&#9888; ${t('filament.location_alert_' + a.type, { location: a.location, current: a.current, threshold: a.threshold })}</div>`;
        }
        html += '</div>';
      }

      // ── Tab panels ──
      for (const [tabId, cfg] of _getSortedTabs()) {
        if (cfg.external) {
          // External tabs (multicolor) — render empty container, loaded after render
          html += `<div class="tab-panel filament-tab-panel" id="filament-tab-${tabId}" style="display:${tabId === _activeTab ? 'block' : 'none'}"></div>`;
          continue;
        }
        const order = getOrder(tabId);
        html += `<div class="tab-panel filament-tab-panel stats-tab-panel ${tabId === _activeTab ? 'active' : ''}" id="filament-tab-${tabId}" style="display:${tabId === _activeTab ? 'grid' : 'none'}">`;
        for (const modId of order) {
          const builder = BUILDERS[modId];
          if (!builder) continue;
          const content = builder(filteredSpools);
          if (!content) continue;
          const isFull = (MODULE_SIZE[modId] || 'full') === 'full';
          html += `<div class="stats-module${isFull ? ' stats-module-full' : ''}" data-module-id="${modId}">`;
          html += content;
          html += '</div>';
        }
        html += '</div>';
      }

      panel.innerHTML = html;

      // Load external tab content (multicolor) if active
      _loadExternalTab(_activeTab);

      // Update URL hash with current filters
      _updateFilterHash();

      // Attach WS listener for live updates
      attachInventoryWsListener();

      // Close export dropdown on outside click
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.inv-export-dropdown')) {
          document.querySelectorAll('.inv-export-menu.show').forEach(m => m.classList.remove('show'));
        }
      }, { once: true });
    } catch (e) {
      panel.innerHTML = `<p class="text-muted">${t('filament.load_failed')}</p>`;
    }
  }

  // ═══ Usage History ═══
  async function loadUsageHistory() {
    const container = document.getElementById('usage-history-container');
    if (!container) return;
    try {
      const res = await fetch('/api/inventory/usage?limit=50');
      const log = await res.json();
      if (!log || log.length === 0) {
        container.innerHTML = `<p class="text-muted text-sm">${t('filament.no_data')}</p>`;
        return;
      }
      let html = '<table class="data-table"><thead><tr><th>' + t('history.date') + '</th><th>' + t('filament.profile_name') + '</th><th>' + t('filament.usage_weight') + '</th><th>' + t('filament.usage_source') + '</th></tr></thead><tbody>';
      for (const entry of log) {
        const date = entry.timestamp ? new Date(entry.timestamp).toLocaleString(window.i18n?.getLocale?.() || 'nb') : '--';
        const src = entry.source === 'auto' ? t('filament.usage_auto') : t('filament.usage_manual');
        html += `<tr>
          <td>${date}</td>
          <td>${miniSpool(hexToRgb(entry.color_hex), 10)} ${esc(entry.profile_name || '--')} <span class="text-muted">${esc(entry.vendor_name || '')}</span></td>
          <td>${Math.round(entry.used_weight_g * 10) / 10}g</td>
          <td><span class="inv-source-badge inv-source-${entry.source}">${src}</span></td>
        </tr>`;
      }
      html += '</tbody></table>';
      container.innerHTML = html;
    } catch (e) {
      container.innerHTML = `<p class="text-muted text-sm">${t('filament.load_failed')}</p>`;
    }
  }

  // ═══ Profile select builder ═══
  function buildProfileSelect(selectedId) {
    let html = `<option value="">${t('filament.add_spool_select_profile')}</option>`;
    const grouped = {};
    for (const p of _profiles) {
      const vName = p.vendor_name || '--';
      if (!grouped[vName]) grouped[vName] = [];
      grouped[vName].push(p);
    }
    for (const [vendor, profiles] of Object.entries(grouped)) {
      html += `<optgroup label="${esc(vendor)}">`;
      for (const p of profiles) {
        const sel = p.id === selectedId ? 'selected' : '';
        const colorDot = p.color_hex ? `⬤ ` : '';
        html += `<option value="${p.id}" ${sel}>${colorDot}${esc(p.name)} (${p.material})</option>`;
      }
      html += '</optgroup>';
    }
    return html;
  }

  function buildLocationSelect(selected) {
    let html = `<option value="">${t('filament.filter_all')}</option>`;
    const byParent = {};
    for (const l of _locations) (byParent[l.parent_id || 0] || (byParent[l.parent_id || 0] = [])).push(l);
    function addLevel(pid, depth) {
      for (const l of (byParent[pid] || [])) {
        const prefix = '\u00A0\u00A0'.repeat(depth);
        html += `<option value="${esc(l.name)}" ${l.name === selected ? 'selected' : ''}>${prefix}${esc(l.name)}</option>`;
        addLevel(l.id, depth + 1);
      }
    }
    addLevel(0, 0);
    return html;
  }

  function buildPrinterOptions(selectedId) {
    const state = window.printerState;
    const ids = state ? state.getPrinterIds() : [];
    let opts = `<option value="" ${!selectedId ? 'selected' : ''}>--</option>`;
    for (const id of ids) {
      opts += `<option value="${id}" ${id === selectedId ? 'selected' : ''}>${printerName(id)}</option>`;
    }
    return opts;
  }

  // ═══ Global API ═══
  window.loadFilamentPanel = loadFilament;
  window.switchFilamentTab = switchTab;
  window.filterFilamentPrinter = function(printerId) {
    _filterPrinter = printerId;
    const slug = printerId === 'all' ? 'filament' : `filament/printer/${printerId}`;
    if (location.hash !== '#' + slug) history.replaceState(null, '', '#' + slug);
    loadFilament();
  };
  // Filter callbacks
  window._invFilterMaterial = function(v) { _filterMaterial = v; _currentPage = 0; loadFilament(); };
  window._invFilterVendor = function(v) { _filterVendor = v; _currentPage = 0; loadFilament(); };
  window._invFilterLocation = function(v) { _filterLocation = v; _currentPage = 0; loadFilament(); };
  window._invSort = function(v) { _sortBy = v; loadFilament(); };
  window._invToggleArchived = function(v) { _showArchived = v; _currentPage = 0; loadFilament(); };
  window._invToggleFavorites = function() { _filterFavorites = !_filterFavorites; _currentPage = 0; loadFilament(); };
  window._invFilterColor = function(v) { _filterColorFamily = v; _currentPage = 0; loadFilament(); };
  window._invFilterTag = function(v) { _filterTag = v; _currentPage = 0; loadFilament(); };
  window._invFilterCategory = function(v) { _filterCategory = v; _currentPage = 0; loadFilament(); };
  window._invResetFilters = function() { _filterMaterial = ''; _filterVendor = ''; _filterLocation = ''; _filterCategory = ''; _filterTag = ''; _filterColorFamily = ''; _filterFavorites = false; _searchQuery = ''; _currentPage = 0; loadFilament(); };
  window._invViewMode = function(mode) { _viewMode = mode; localStorage.setItem('inv-view-mode', mode); loadFilament(); };

  function _updateFilterHash() {
    const params = new URLSearchParams();
    if (_filterMaterial) params.set('material', _filterMaterial);
    if (_filterVendor) params.set('brand', _filterVendor);
    if (_filterLocation) params.set('location', _filterLocation);
    if (_searchQuery) params.set('search', _searchQuery);
    if (_viewMode !== 'grid') params.set('view', _viewMode);
    const q = params.toString();
    const path = `#filament/${_activeTab}`;
    history.replaceState(null, '', q ? `${path}?${q}` : path);
  }

  window.toggleFavorite = async function(spoolId) {
    await fetch(`/api/inventory/spools/${spoolId}/favorite`, { method: 'POST' });
    const spool = _spools.find(s => s.id === spoolId);
    if (spool) spool.is_favorite = spool.is_favorite ? 0 : 1;
    loadFilament();
  };
  window._invSearch = function(v) {
    clearTimeout(_searchDebounce);
    _searchDebounce = setTimeout(() => { _searchQuery = v; _currentPage = 0; loadFilament(); }, 300);
  };
  window._invPage = function(dir) { _currentPage += dir; loadFilament(); };

  // ═══ Add/Edit Spool ═══
  window.showAddSpoolForm = function() {
    if (_activeTab !== 'inventory') switchTab('inventory');
    const container = document.getElementById('inv-global-form');
    if (!container) return;
    container.style.display = '';
    container.innerHTML = renderSpoolForm(null);
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  window.showQuickCreate = async function(btn) {
    // Remove existing dropdown
    document.querySelector('.quick-create-menu')?.remove();
    try {
      const res = await fetch('/api/inventory/recent-profiles');
      const profiles = await res.json();
      if (!profiles.length) { showToast(t('filament.recent_profiles') + ': ' + t('common.none'), 'info'); return; }
      const menu = document.createElement('div');
      menu.className = 'inv-export-menu quick-create-menu show';
      menu.style.cssText = 'min-width:200px';
      for (const p of profiles) {
        const b = document.createElement('button');
        b.textContent = `${p.brand || ''} ${p.material || ''} ${p.color_name || ''}`.trim();
        b.onclick = async () => {
          menu.remove();
          const data = {
            filament_profile_id: p.id,
            initial_weight_g: p.spool_weight_g || 1000,
            used_weight_g: 0,
            remaining_weight_g: p.spool_weight_g || 1000
          };
          try {
            await fetch('/api/inventory/spools', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            showToast(t('filament.spool_added'), 'success');
            loadFilament();
          } catch { showToast(t('filament.save_failed'), 'error'); }
        };
        menu.appendChild(b);
      }
      btn.closest('.inv-export-dropdown').appendChild(menu);
      setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 10);
    } catch { showToast(t('filament.save_failed'), 'error'); }
  };

  window.showEditSpoolForm = function(spoolId) {
    const spool = _spools.find(s => s.id === spoolId);
    if (!spool) return;
    const container = document.getElementById(`spool-edit-${spoolId}`);
    if (container) {
      container.style.display = '';
      container.innerHTML = renderSpoolForm(spool);
      return;
    }
    // Fallback: open in modal overlay (visual card view)
    const overlay = document.createElement('div');
    overlay.className = 'inv-modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="inv-modal" style="max-width:700px">
      <div class="inv-modal-header">
        <span>${t('settings.edit')} — ${esc(_cleanProfileName(spool))}</span>
        <button class="inv-modal-close" onclick="this.closest('.inv-modal-overlay').remove()">&times;</button>
      </div>
      <div style="padding:12px" id="spool-edit-modal-${spoolId}">${renderSpoolForm(spool)}</div>
    </div>`;
    document.body.appendChild(overlay);
  };

  function renderSpoolForm(spool) {
    const isEdit = !!spool;
    const id = isEdit ? spool.id : 'new';
    return `
      <div class="settings-card" style="margin:8px 0">
        <div class="settings-form">
          <div class="flex gap-sm" style="flex-wrap:wrap">
            <div class="form-group" style="flex:2;min-width:180px">
              <label class="form-label">${t('filament.profile_select')}</label>
              <select class="form-input" id="sp-profile-${id}" onchange="onSpoolProfileChange('${id}')">${buildProfileSelect(spool?.filament_profile_id)}</select>
            </div>
            <div class="form-group" style="width:100px">
              <label class="form-label">${t('filament.initial_weight')}</label>
              <input class="form-input" id="sp-initial-${id}" type="number" value="${spool?.initial_weight_g || 1000}">
            </div>
            <div class="form-group" style="width:100px">
              <label class="form-label">${t('filament.used_g')}</label>
              <input class="form-input" id="sp-used-${id}" type="number" value="${spool?.used_weight_g || 0}">
            </div>
            <div class="form-group" style="width:100px">
              <label class="form-label">${t('filament.remaining_g') || 'Igjen (g)'}</label>
              <input class="form-input" id="sp-remaining-${id}" type="number" value="${spool?.remaining_weight_g ?? ''}" placeholder="Auto">
            </div>
            <div class="form-group" style="width:80px">
              <label class="form-label">${t('filament.price')}</label>
              <input class="form-input" id="sp-cost-${id}" type="number" value="${spool?.cost || ''}" placeholder="219">
            </div>
            <div class="form-group" style="width:100px">
              <label class="form-label">${t('filament.spool_tare_weight')}</label>
              <input class="form-input" id="sp-tare-${id}" type="number" value="${spool?.spool_weight || ''}" placeholder="Auto">
            </div>
            <div class="form-group" style="width:100px">
              <label class="form-label">${t('filament.lot_number')}</label>
              <input class="form-input" id="sp-lot-${id}" value="${spool?.lot_number || ''}">
            </div>
            <div class="form-group" style="width:130px">
              <label class="form-label">${t('filament.location')}</label>
              <select class="form-input" id="sp-location-${id}">${buildLocationSelect(spool?.location)}</select>
            </div>
            <div class="form-group" style="width:130px">
              <label class="form-label">${t('common.printer')}</label>
              <select class="form-input" id="sp-printer-${id}">${buildPrinterOptions(spool?.printer_id)}</select>
            </div>
            <div class="form-group" style="width:120px">
              <label class="form-label">${t('filament.purchase_date')}</label>
              <input class="form-input" id="sp-purchase-${id}" type="date" value="${spool?.purchase_date || ''}">
            </div>
            <div class="form-group" style="width:110px">
              <label class="form-label">${t('filament.storage_method')}</label>
              <select class="form-input" id="sp-storage-${id}">
                <option value="">${t('common.none')}</option>
                <option value="dry_box" ${spool?.storage_method === 'dry_box' ? 'selected' : ''}>${t('filament.storage_dry_box')}</option>
                <option value="vacuum_bag" ${spool?.storage_method === 'vacuum_bag' ? 'selected' : ''}>${t('filament.storage_vacuum')}</option>
                <option value="open_air" ${spool?.storage_method === 'open_air' ? 'selected' : ''}>${t('filament.storage_open_air')}</option>
              </select>
            </div>
            <div class="form-group" style="flex:1;min-width:120px">
              <label class="form-label">${t('filament.comment')}</label>
              <input class="form-input" id="sp-comment-${id}" value="${spool?.comment || ''}">
            </div>
            ${!isEdit ? `<div class="form-group" style="width:80px">
              <label class="form-label">${t('filament.bulk_quantity')}</label>
              <input class="form-input" id="sp-quantity-${id}" type="number" value="1" min="1" max="50" step="1">
            </div>` : ''}
          </div>
          <div id="sp-${id}-extra-fields-section">
            <div style="font-size:0.8rem;margin:4px 0">${t('filament.extra_fields')}</div>
            <div id="sp-${id}-extra-fields">${_renderExtraFieldInputs(`sp-${id}`, spool?.extra_fields)}</div>
            <button class="form-btn form-btn-sm" data-ripple style="font-size:0.7rem" onclick="window._addExtraField('sp-${id}')" type="button">+ ${t('filament.add_field')}</button>
          </div>
          <div class="flex gap-sm">
            <button class="form-btn" data-ripple onclick="${isEdit ? `saveSpool(${spool.id})` : 'saveNewSpool()'}">${t('filament.save')}</button>
            <button class="form-btn form-btn-sm" data-ripple style="background:transparent;color:var(--text-muted)" onclick="${isEdit ? `hideSpoolEdit(${spool.id})` : 'hideGlobalSpoolForm()'}">${t('settings.cancel')}</button>
          </div>
        </div>
      </div>`;
  }

  window.onSpoolProfileChange = function(id) {
    const sel = document.getElementById(`sp-profile-${id}`);
    const initialInput = document.getElementById(`sp-initial-${id}`);
    if (!sel || !initialInput) return;
    const profile = _profiles.find(p => p.id === parseInt(sel.value));
    if (profile && id === 'new') {
      initialInput.value = profile.spool_weight_g || 1000;
    }
  };

  window.saveNewSpool = async function() {
    const profileId = parseInt(document.getElementById('sp-profile-new')?.value);
    if (!profileId) { showToast(t('filament.add_spool_select_profile'), 'warning'); return; }
    const data = {
      filament_profile_id: profileId,
      initial_weight_g: parseFloat(document.getElementById('sp-initial-new').value) || 1000,
      used_weight_g: parseFloat(document.getElementById('sp-used-new').value) || 0,
      cost: parseFloat(document.getElementById('sp-cost-new').value) || null,
      lot_number: document.getElementById('sp-lot-new').value || null,
      location: document.getElementById('sp-location-new').value || null,
      printer_id: document.getElementById('sp-printer-new').value || null,
      comment: document.getElementById('sp-comment-new').value || null,
      purchase_date: document.getElementById('sp-purchase-new').value || null,
      spool_weight: parseFloat(document.getElementById('sp-tare-new').value) || null,
      storage_method: document.getElementById('sp-storage-new').value || null,
      extra_fields: _collectExtraFields('sp-new')
    };
    const manualRem = document.getElementById('sp-remaining-new')?.value;
    if (manualRem !== '' && manualRem !== undefined) {
      data.remaining_weight_g = Math.max(0, parseFloat(manualRem));
      data.used_weight_g = Math.max(0, data.initial_weight_g - data.remaining_weight_g);
    } else {
      data.remaining_weight_g = Math.max(0, data.initial_weight_g - data.used_weight_g);
    }
    const quantity = parseInt(document.getElementById('sp-quantity-new')?.value) || 1;
    if (quantity > 1) {
      data.count = Math.min(quantity, 50);
      await fetch('/api/inventory/spools/batch-add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      showToast(t('filament.bulk_added', { count: data.count }), 'success');
    } else {
      await fetch('/api/inventory/spools', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    }
    loadFilament();
  };

  window.saveSpool = async function(spoolId) {
    const id = spoolId;
    const spool = _spools.find(s => s.id === spoolId);
    const data = {
      filament_profile_id: parseInt(document.getElementById(`sp-profile-${id}`)?.value) || spool?.filament_profile_id,
      initial_weight_g: parseFloat(document.getElementById(`sp-initial-${id}`).value) || 1000,
      used_weight_g: parseFloat(document.getElementById(`sp-used-${id}`).value) || 0,
      cost: parseFloat(document.getElementById(`sp-cost-${id}`).value) || null,
      lot_number: document.getElementById(`sp-lot-${id}`).value || null,
      location: document.getElementById(`sp-location-${id}`).value || null,
      printer_id: document.getElementById(`sp-printer-${id}`).value || null,
      comment: document.getElementById(`sp-comment-${id}`).value || null,
      purchase_date: document.getElementById(`sp-purchase-${id}`).value || null,
      archived: spool?.archived || 0,
      spool_weight: parseFloat(document.getElementById(`sp-tare-${id}`).value) || null,
      storage_method: document.getElementById(`sp-storage-${id}`).value || null,
      extra_fields: _collectExtraFields(`sp-${id}`)
    };
    // Manuelt remaining har prioritet, ellers beregn fra initial - used
    const manualRemaining = document.getElementById(`sp-remaining-${id}`)?.value;
    if (manualRemaining !== '' && manualRemaining !== undefined) {
      data.remaining_weight_g = Math.max(0, parseFloat(manualRemaining));
      // Oppdater used_weight_g til å matche
      data.used_weight_g = Math.max(0, data.initial_weight_g - data.remaining_weight_g);
    } else {
      data.remaining_weight_g = Math.max(0, data.initial_weight_g - data.used_weight_g);
    }
    await fetch(`/api/inventory/spools/${spoolId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    // Close modal overlay if editing from visual card view
    const modal = document.getElementById(`spool-edit-modal-${spoolId}`);
    if (modal) modal.closest('.inv-modal-overlay')?.remove();
    loadFilament();
  };

  window.hideGlobalSpoolForm = function() {
    const c = document.getElementById('inv-global-form');
    if (c) { c.style.display = 'none'; c.innerHTML = ''; }
  };

  window.hideSpoolEdit = function(spoolId) {
    const c = document.getElementById(`spool-edit-${spoolId}`);
    if (c) { c.style.display = 'none'; c.innerHTML = ''; return; }
    // Fallback: close modal overlay if editing from visual card view
    const modal = document.getElementById(`spool-edit-modal-${spoolId}`);
    if (modal) modal.closest('.inv-modal-overlay')?.remove();
  };

  window.deleteSpoolItem = function(id) {
    return confirmAction(t('filament.delete_spool_confirm'), async () => {
      await fetch(`/api/inventory/spools/${id}`, { method: 'DELETE' });
      loadFilament();
    }, { danger: true });
  };

  window.archiveSpoolItem = async function(id) {
    await fetch(`/api/inventory/spools/${id}/archive`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ archived: true }) });
    loadFilament();
  };

  window.unarchiveSpoolItem = async function(id) {
    await fetch(`/api/inventory/spools/${id}/archive`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ archived: false }) });
    loadFilament();
  };

  // ═══ Manage Dashboard Sub-tabs ═══
  window._switchManageSubTab = function(tab) {
    _manageSubTab = tab;
    const container = document.getElementById('manage-sub-content')?.closest('.stats-module');
    if (container) {
      container.querySelectorAll('[data-manage-tab]').forEach(b => {
        b.classList.toggle('active', b.dataset.manageTab === tab);
      });
    }
    _renderManageSubContent(_spools);
  };

  function _renderManageSubContent(spools) {
    const el = document.getElementById('manage-sub-content');
    if (!el) return;
    if (_manageSubTab === 'profiles') {
      el.innerHTML = _renderProfilesList();
    } else if (_manageSubTab === 'vendors') {
      el.innerHTML = _renderVendorsList();
    } else if (_manageSubTab === 'locations') {
      el.innerHTML = _renderLocationsList() + _renderLocationsDnd(spools || _spools);
    } else if (_manageSubTab === 'tags') {
      el.innerHTML = _renderTagsList();
    } else if (_manageSubTab === 'prices') {
      el.innerHTML = `<div id="price-watch-container"><span class="text-muted text-sm">Loading...</span></div>`;
      _loadPriceWatch();
    } else if (_manageSubTab === 'insights') {
      el.innerHTML = `<div id="insights-container"><span class="text-muted text-sm">${t('filament.ai_loading')}</span></div>`;
      _loadInsights();
    }
  }

  function _renderVendorsList() {
    let h = '';
    if (_vendors.length === 0) {
      h += `<p class="text-muted" style="font-size:0.85rem">${t('filament.no_vendors')}</p>`;
    } else {
      const canWrite = !window._can || window._can('filament');
      h += `<table class="data-table"><thead><tr>${canWrite ? `<th style="width:30px"><input type="checkbox" class="fil-bulk-check" onchange="window._bulkSelectAllVendors(this.checked)" title="${t('filament.bulk_select_all')}"></th>` : ''}<th>${t('filament.vendor_name')}</th><th>${t('filament.vendor_website')}</th><th>${t('filament.vendor_empty_spool')}</th><th></th></tr></thead><tbody>`;
      for (const v of _vendors) {
        h += `<tr data-vendor-id="${v.id}" class="${_selectedVendors.has(v.id) ? 'bulk-row-selected' : ''}">
          ${canWrite ? `<td><input type="checkbox" class="fil-bulk-check fil-vendor-check" ${_selectedVendors.has(v.id) ? 'checked' : ''} onchange="window.toggleVendorSelect(${v.id}, this)"></td>` : ''}
          <td><strong>${esc(v.name)}</strong></td>
          <td>${v.website ? `<a href="${esc(v.website)}" target="_blank" class="text-muted">${esc(v.website)}</a>` : '--'}</td>
          <td>${v.empty_spool_weight_g ? v.empty_spool_weight_g + 'g' : '--'}</td>
          <td style="text-align:right">
            <button class="filament-edit-btn" onclick="editVendor(${v.id})" title="${t('settings.edit')}" data-tooltip="${t('settings.edit')}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <button class="filament-delete-btn" onclick="deleteVendorItem(${v.id})" title="${t('settings.delete')}" data-tooltip="${t('settings.delete')}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </td>
        </tr>`;
      }
      h += '</tbody></table>';
    }
    h += `<div id="vendor-form-container"></div>`;
    if (window._can && window._can('filament')) h += `<button class="form-btn form-btn-sm" data-ripple style="margin-top:8px" onclick="showAddVendorForm()">+ ${t('filament.vendor_add')}</button>`;
    return h;
  }

  function _renderProfilesList() {
    let h = '';
    if (_profiles.length === 0) {
      h += `<p class="text-muted" style="font-size:0.85rem">${t('filament.no_profiles')}</p>`;
    } else {
      const canWrite = !window._can || window._can('filament');
      h += '<div class="filament-grid">';
      for (const p of _profiles) {
        const color = hexToRgb(p.color_hex);
        const tempParts = [];
        if (p.nozzle_temp_min || p.nozzle_temp_max) tempParts.push(`🌡 ${p.nozzle_temp_min || '?'}–${p.nozzle_temp_max || '?'}°C`);
        if (p.bed_temp_min || p.bed_temp_max) tempParts.push(`🛏 ${p.bed_temp_min || '?'}–${p.bed_temp_max || '?'}°C`);
        if (p.chamber_temp_min || p.chamber_temp_max) tempParts.push(`🏠 ${p.chamber_temp_min || '?'}–${p.chamber_temp_max || '?'}°C`);
        const metaParts = [];
        if (p.density && p.density !== 1.24) metaParts.push(p.density + ' g/cm³');
        if (p.diameter && p.diameter !== 1.75) metaParts.push('⌀' + p.diameter + 'mm');
        if (p.diameter_tolerance) metaParts.push('±' + p.diameter_tolerance + 'mm');
        if (p.price) metaParts.push(formatCurrency(p.price));
        const refParts = [];
        if (p.tray_id_name) refParts.push(esc(p.tray_id_name));
        if (p.ral_code) refParts.push(esc(p.ral_code));
        if (p.pantone_code) refParts.push('Pantone ' + esc(p.pantone_code));
        if (p.article_number) refParts.push(esc(p.article_number));
        const tuneParts = [];
        if (p.pressure_advance_k) tuneParts.push('PA:' + p.pressure_advance_k);
        if (p.max_volumetric_speed) tuneParts.push('Vol:' + p.max_volumetric_speed + 'mm³/s');
        if (p.retraction_distance) tuneParts.push('Ret:' + p.retraction_distance + 'mm');
        if (p.cooling_fan_speed) tuneParts.push('Fan:' + p.cooling_fan_speed + '%');

        h += `<div class="filament-card inv-spool-card inv-profile-card ${_selectedProfiles.has(p.id) ? 'filament-card-selected' : ''}" data-profile-id="${p.id}">
          <div class="fil-spool-top">
            <div class="fil-spool-identity">
              ${canWrite ? `<input type="checkbox" class="fil-bulk-check fil-profile-check" ${_selectedProfiles.has(p.id) ? 'checked' : ''} onclick="window.toggleProfileSelect(${p.id}, this)">` : ''}
              ${miniSpool(color, 20)}
              <div>
                <strong style="font-size:0.9rem">${esc(p.name)}</strong>
                <span class="text-muted" style="font-size:0.75rem;display:block">${esc(p.vendor_name || '--')}</span>
              </div>
            </div>
          </div>
          <div class="fil-spool-meta" style="margin-top:8px">${esc(p.material)}${p.color_name ? ' · ' + esc(p.color_name) : ''} · ${p.spool_weight_g}g${metaParts.length ? ' · ' + metaParts.join(' · ') : ''}</div>
          ${tempParts.length ? `<div class="fil-spool-meta text-muted" style="font-size:0.7rem">${tempParts.join('  ')}</div>` : ''}
          ${refParts.length ? `<div class="fil-spool-meta text-muted" style="font-size:0.7rem">${refParts.join(' · ')}</div>` : ''}
          ${p.finish || p.translucent || p.glow || p.modifiers ? `<div class="fil-profile-badges">${p.finish ? `<span class="fil-badge">${t('filament.finish_' + p.finish)}</span>` : ''}${p.translucent ? `<span class="fil-badge">${t('filament.translucent')}</span>` : ''}${p.glow ? `<span class="fil-badge fil-badge-glow">${t('filament.glow')}</span>` : ''}${_parseModifiers(p.modifiers).map(m => `<span class="modifier-badge">${m}</span>`).join('')}</div>` : ''}
          ${tuneParts.length ? `<div class="fil-spool-meta text-muted" style="font-size:0.65rem;margin-top:2px">${tuneParts.join(' · ')}</div>` : ''}
          <div class="fil-profile-toolbar">
            <button class="fil-profile-action" onclick="window._shareProfile(${p.id})" data-tooltip="${t('filament.share_to_community')}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              ${t('filament.share_short', 'Del')}
            </button>
            <button class="fil-profile-action" onclick="window._exportSlicerProfile(${p.id})" data-tooltip="${t('filament.export_slicer')}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              ${t('filament.export_short', 'Eksporter')}
            </button>
            <button class="fil-profile-action" onclick="editProfile(${p.id})" data-tooltip="${t('settings.edit')}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              ${t('settings.edit', 'Rediger')}
            </button>
            <button class="fil-profile-action fil-profile-action-danger" onclick="deleteProfileItem(${p.id})" data-tooltip="${t('settings.delete')}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              ${t('settings.delete', 'Slett')}
            </button>
          </div>
        </div>`;
      }
      h += '</div>';
    }
    h += `<div id="profile-form-container"></div>`;
    if (window._can && window._can('filament')) h += `<button class="form-btn form-btn-sm" data-ripple style="margin-top:8px" onclick="showAddProfileForm()">+ ${t('filament.profile_add')}</button>`;
    return h;
  }

  function _renderLocationsList() {
    let h = '';
    if (_locations.length === 0) {
      h += `<p class="text-muted" style="font-size:0.85rem">${t('filament.no_locations')}</p>`;
    } else {
      // Build tree: top-level first, then children
      const byParent = {};
      for (const l of _locations) {
        const pid = l.parent_id || 0;
        (byParent[pid] || (byParent[pid] = [])).push(l);
      }
      function renderLevel(parentId, depth) {
        const items = byParent[parentId] || [];
        let out = '';
        for (const l of items) {
          const indent = depth * 20;
          const thresholdInfo = [];
          if (l.min_spools) thresholdInfo.push(`min:${l.min_spools}`);
          if (l.max_spools) thresholdInfo.push(`max:${l.max_spools}`);
          out += `<div class="inv-location-item" style="padding-left:${indent}px">
            <span>${depth > 0 ? '&#x2514; ' : ''}${esc(l.name)}${l.description ? ` <span class="text-muted">(${esc(l.description)})</span>` : ''}${thresholdInfo.length ? ` <span class="text-muted" style="font-size:0.7rem">[${thresholdInfo.join(', ')}]</span>` : ''}</span>
            <div>
              <button class="filament-edit-btn" onclick="editLocationItem(${l.id})" title="${t('settings.edit')}" data-tooltip="${t('settings.edit')}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
              <button class="filament-delete-btn" onclick="deleteLocationItem(${l.id})" data-tooltip="${t('settings.delete')}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
          </div>`;
          out += renderLevel(l.id, depth + 1);
        }
        return out;
      }
      h += '<div class="inv-location-list">';
      h += renderLevel(0, 0);
      h += '</div>';
    }
    h += `<div id="location-form-container"></div>`;
    h += `<button class="form-btn form-btn-sm" data-ripple style="margin-top:8px" onclick="showAddLocationForm()">+ ${t('filament.location_add')}</button>`;
    return h;
  }

  function _renderTagsList() {
    let h = '';
    if (_tags.length === 0) {
      h += `<p class="text-muted" style="font-size:0.85rem">${t('filament.no_tags')}</p>`;
    } else {
      h += '<div class="inv-location-list">';
      for (const tag of _tags) {
        const dot = tag.color ? `<span class="fil-tag-dot" style="background:${esc(tag.color)}"></span>` : '';
        h += `<div class="fil-tag-item">
          ${dot}
          <span style="flex:1"><strong>${esc(tag.name)}</strong> <span class="text-muted" style="font-size:0.75rem">(${esc(tag.category || 'custom')})</span></span>
          <span class="text-muted" style="font-size:0.75rem">${t('filament.tag_usage_count', { count: tag.usage_count || 0 })}</span>
          <div>
            <button class="filament-edit-btn" onclick="showEditTagForm(${tag.id})" title="${t('settings.edit')}" data-tooltip="${t('settings.edit')}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <button class="filament-delete-btn" onclick="deleteTagItem(${tag.id})" data-tooltip="${t('settings.delete')}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
        </div>`;
      }
      h += '</div>';
    }
    h += `<div id="tag-form-container"></div>`;
    if (window._can && window._can('filament')) h += `<button class="form-btn form-btn-sm" data-ripple style="margin-top:8px" onclick="showAddTagForm()">+ ${t('filament.tag_add')}</button>`;
    return h;
  }

  function _renderLocationsDnd(spools) {
    const active = (spools || []).filter(s => !s.archived);
    if (active.length === 0 && _locations.length === 0) return '';
    let h = `<div class="ctrl-card-title" style="margin-top:16px">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
      ${t('filament.locations_dnd_title')}
    </div>`;
    const byLoc = { '': [] };
    for (const l of _locations) byLoc[l.name] = [];
    for (const s of active) {
      const loc = s.location || '';
      if (!byLoc[loc]) byLoc[loc] = [];
      byLoc[loc].push(s);
    }
    h += '<div class="inv-dnd-columns">';
    for (const [locName, locSpools] of Object.entries(byLoc)) {
      const label = locName || t('filament.unassigned');
      h += `<div class="inv-dnd-column" data-location="${esc(locName)}" ondragover="event.preventDefault();this.classList.add('inv-dnd-over')" ondragleave="this.classList.remove('inv-dnd-over')" ondrop="window._invDropSpool(event,this)">
        <div class="inv-dnd-column-header">${esc(label)} <span class="text-muted">(${locSpools.length})</span></div>`;
      for (const s of locSpools) {
        const color = hexToRgb(s.color_hex);
        h += `<div class="inv-dnd-spool" draggable="true" data-spool-id="${s.id}" ondragstart="event.dataTransfer.setData('text/plain','${s.id}')">
          ${miniSpool(color, 10)}
          <span>${esc(s.profile_name || s.material || '--')} · ${Math.round(s.remaining_weight_g)}g</span>
        </div>`;
      }
      h += '</div>';
    }
    h += '</div>';
    return h;
  }

  // ═══ Vendor CRUD ═══
  window.showAddVendorForm = function() {
    const c = document.getElementById('vendor-form-container');
    if (!c) return;
    c.innerHTML = `<div class="settings-form mt-sm" style="border-top:1px solid var(--border-color);padding-top:8px">
      <div class="flex gap-sm" style="flex-wrap:wrap">
        <div class="form-group" style="flex:1;min-width:120px"><label class="form-label">${t('filament.vendor_name')}</label><input class="form-input" id="v-name"></div>
        <div class="form-group" style="flex:1;min-width:120px"><label class="form-label">${t('filament.vendor_website')}</label><input class="form-input" id="v-website" placeholder="https://"></div>
        <div class="form-group" style="width:100px"><label class="form-label">${t('filament.vendor_empty_spool')}</label><input class="form-input" id="v-spool-weight" type="number" placeholder="250"></div>
      </div>
      <div id="va-extra-fields-section">
        <div style="font-size:0.8rem;margin:4px 0">${t('filament.extra_fields')}</div>
        <div id="va-extra-fields"></div>
        <button class="form-btn form-btn-sm" data-ripple style="font-size:0.7rem" onclick="window._addExtraField('va')" type="button">+ ${t('filament.add_field')}</button>
      </div>
      <div class="flex gap-sm"><button class="form-btn" data-ripple onclick="saveNewVendor()">${t('filament.save')}</button><button class="form-btn form-btn-sm" data-ripple style="background:transparent;color:var(--text-muted)" onclick="document.getElementById('vendor-form-container').innerHTML=''">${t('settings.cancel')}</button></div>
    </div>`;
  };

  window.editVendor = function(id) {
    const v = _vendors.find(x => x.id === id);
    if (!v) return;
    const c = document.getElementById('vendor-form-container');
    if (!c) return;
    c.innerHTML = `<div class="settings-form mt-sm" style="border-top:1px solid var(--border-color);padding-top:8px">
      <div class="flex gap-sm" style="flex-wrap:wrap">
        <div class="form-group" style="flex:1;min-width:120px"><label class="form-label">${t('filament.vendor_name')}</label><input class="form-input" id="v-name" value="${esc(v.name)}"></div>
        <div class="form-group" style="flex:1;min-width:120px"><label class="form-label">${t('filament.vendor_website')}</label><input class="form-input" id="v-website" value="${esc(v.website || '')}"></div>
        <div class="form-group" style="width:100px"><label class="form-label">${t('filament.vendor_empty_spool')}</label><input class="form-input" id="v-spool-weight" type="number" value="${v.empty_spool_weight_g || ''}"></div>
      </div>
      <div id="ve-extra-fields-section">
        <div style="font-size:0.8rem;margin:4px 0">${t('filament.extra_fields')}</div>
        <div id="ve-extra-fields">${_renderExtraFieldInputs('ve', v.extra_fields)}</div>
        <button class="form-btn form-btn-sm" data-ripple style="font-size:0.7rem" onclick="window._addExtraField('ve')" type="button">+ ${t('filament.add_field')}</button>
      </div>
      <div class="flex gap-sm"><button class="form-btn" data-ripple onclick="saveVendorEdit(${id})">${t('filament.save')}</button><button class="form-btn form-btn-sm" data-ripple style="background:transparent;color:var(--text-muted)" onclick="document.getElementById('vendor-form-container').innerHTML=''">${t('settings.cancel')}</button></div>
    </div>`;
  };

  window.saveNewVendor = async function() {
    const name = document.getElementById('v-name')?.value?.trim();
    if (!name) return;
    await fetch('/api/inventory/vendors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      name, website: document.getElementById('v-website').value || null,
      empty_spool_weight_g: parseFloat(document.getElementById('v-spool-weight').value) || null,
      extra_fields: _collectExtraFields('va')
    })});
    loadFilament();
  };

  window.saveVendorEdit = async function(id) {
    const name = document.getElementById('v-name')?.value?.trim();
    if (!name) return;
    await fetch(`/api/inventory/vendors/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      name, website: document.getElementById('v-website').value || null,
      empty_spool_weight_g: parseFloat(document.getElementById('v-spool-weight').value) || null,
      extra_fields: _collectExtraFields('ve')
    })});
    loadFilament();
  };

  window.deleteVendorItem = function(id) {
    return confirmAction(t('filament.vendor_delete_confirm'), async () => {
      await fetch(`/api/inventory/vendors/${id}`, { method: 'DELETE' });
      loadFilament();
    }, { danger: true });
  };

  // ═══ Profile CRUD ═══
  window.showAddProfileForm = function() {
    const c = document.getElementById('profile-form-container');
    if (!c) return;
    c.innerHTML = renderProfileForm(null);
  };

  window.editProfile = function(id) {
    const p = _profiles.find(x => x.id === id);
    if (!p) return;
    const c = document.getElementById('profile-form-container');
    if (!c) return;
    c.innerHTML = renderProfileForm(p);
  };

  function _parseWeightOptions(json) {
    try { const arr = json ? (typeof json === 'string' ? JSON.parse(json) : json) : []; return arr.join(', '); } catch { return ''; }
  }
  function _parseDiameters(json) {
    try { const arr = json ? (typeof json === 'string' ? JSON.parse(json) : json) : []; return arr.join(', '); } catch { return ''; }
  }
  function _parseModifiers(json) {
    try { return json ? (typeof json === 'string' ? JSON.parse(json) : json) : []; } catch { return []; }
  }
  const _MODIFIERS = [
    'CF','GF','KF','HF','HS','HT','ESD','FR','UV',
    'Silk','Marble','Wood','Metal','Glow','Sparkle','Galaxy',
    'Tough','Flex','Pro','Plus','Basic','Lite','Max',
    'Matte','Glossy','Satin','Transparent','Translucent',
    'Recycled','Bio','ASA-Blend','Conductive','Magnetic',
    'Hygroscopic','Abrasive','Food-Safe','Medical',
    'Lightweight','Heavy','Foaming','Gradient','Dual-Color',
    'Neon','Pastel','Fluorescent','Phosphorescent',
    'Temperature','Humidity','Color-Change','Pearlescent'
  ];

  // Multi-color + extra fields helpers
  function _hasMultiColor(profile) {
    if (!profile?.multi_color_hexes) return false;
    try { const arr = JSON.parse(profile.multi_color_hexes); return Array.isArray(arr) && arr.length > 1; } catch { return false; }
  }

  function _renderMultiColorInputs(pfx, profile) {
    let hexes = [];
    try { hexes = profile?.multi_color_hexes ? JSON.parse(profile.multi_color_hexes) : []; } catch {}
    if (hexes.length < 2) hexes = ['FF0000', '00FF00'];
    let h = '';
    for (let i = 0; i < hexes.length; i++) {
      h += `<input type="color" class="form-input ${pfx}-mc-color" value="${hexToRgb(hexes[i])}" style="width:36px;height:28px;padding:1px">`;
    }
    h += `<button class="form-btn form-btn-sm" style="font-size:0.7rem" onclick="window._addMultiColorStop('${pfx}')" type="button">+</button>`;
    h += `<select class="form-input form-input-sm" id="${pfx}-mc-dir" style="width:auto">
      <option value="coaxial" ${profile?.multi_color_direction !== 'longitudinal' ? 'selected' : ''}>Coaxial</option>
      <option value="longitudinal" ${profile?.multi_color_direction === 'longitudinal' ? 'selected' : ''}>Longitudinal</option>
    </select>`;
    return h;
  }

  function _renderExtraFieldInputs(pfx, extraJson) {
    let obj = {};
    try { if (extraJson) obj = typeof extraJson === 'string' ? JSON.parse(extraJson) : extraJson; } catch {}
    let h = '';
    let idx = 0;
    for (const [k, v] of Object.entries(obj)) {
      h += `<div class="flex gap-sm" style="margin:2px 0">
        <input class="form-input form-input-sm ${pfx}-ef-key" value="${esc(k)}" placeholder="${t('filament.field_key')}" style="width:100px">
        <input class="form-input form-input-sm ${pfx}-ef-val" value="${esc(String(v))}" placeholder="${t('filament.field_value')}" style="flex:1">
        <button class="filament-delete-btn" onclick="this.parentElement.remove()" type="button" style="opacity:1" title="${t('settings.delete')}" aria-label="${t('settings.delete')}"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      </div>`;
      idx++;
    }
    return h;
  }

  function _collectExtraFields(pfx) {
    const container = document.getElementById(`${pfx}-extra-fields`);
    if (!container) return null;
    const keys = container.querySelectorAll(`.${pfx}-ef-key`);
    const vals = container.querySelectorAll(`.${pfx}-ef-val`);
    const obj = {};
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i]?.value?.trim();
      const v = vals[i]?.value?.trim();
      if (k) obj[k] = v || '';
    }
    return Object.keys(obj).length > 0 ? JSON.stringify(obj) : null;
  }

  function _collectMultiColorHexes(pfx) {
    const inputs = document.querySelectorAll(`.${pfx}-mc-color`);
    if (inputs.length < 2) return null;
    return JSON.stringify([...inputs].map(i => i.value.replace('#', '')));
  }

  window._toggleMultiColor = function(pfx, checked) {
    const fields = document.getElementById(`${pfx}-multicolor-fields`);
    if (fields) fields.style.display = checked ? 'flex' : 'none';
  };

  window._addMultiColorStop = function(pfx) {
    const container = document.getElementById(`${pfx}-multicolor-fields`);
    if (!container) return;
    const inputs = container.querySelectorAll(`.${pfx}-mc-color`);
    if (inputs.length >= 8) return;
    const newInput = document.createElement('input');
    newInput.type = 'color';
    newInput.className = `form-input ${pfx}-mc-color`;
    newInput.value = '#0000FF';
    newInput.style.cssText = 'width:36px;height:28px;padding:1px';
    const btn = container.querySelector('button');
    container.insertBefore(newInput, btn);
  };

  window._addExtraField = function(pfx) {
    const container = document.getElementById(`${pfx}-extra-fields`);
    if (!container) return;
    if (container.querySelectorAll(`.${pfx}-ef-key`).length >= 20) return;
    const row = document.createElement('div');
    row.className = 'flex gap-sm';
    row.style.margin = '2px 0';
    row.innerHTML = `<input class="form-input form-input-sm ${pfx}-ef-key" placeholder="${t('filament.field_key')}" style="width:100px">
      <input class="form-input form-input-sm ${pfx}-ef-val" placeholder="${t('filament.field_value')}" style="flex:1">
      <button class="filament-delete-btn" onclick="this.parentElement.remove()" type="button" style="opacity:1" title="${t('settings.delete')}" aria-label="${t('settings.delete')}"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
    container.appendChild(row);
  };

  function renderProfileForm(profile) {
    const isEdit = !!profile;
    const pfx = isEdit ? 'pe' : 'pa';
    return `<div class="settings-form mt-sm" style="border-top:1px solid var(--border-color);padding-top:8px">
      <div class="flex gap-sm" style="flex-wrap:wrap">
        <div class="form-group" style="flex:1;min-width:130px">
          <label class="form-label">${t('filament.filter_vendor')}</label>
          <select class="form-input" id="${pfx}-vendor">
            <option value="">--</option>
            ${_vendors.map(v => `<option value="${v.id}" ${profile?.vendor_id === v.id ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="flex:1;min-width:120px"><label class="form-label">${t('filament.profile_name')}</label><input class="form-input" id="${pfx}-name" value="${profile?.name || ''}"></div>
        <div class="form-group" style="flex:1;min-width:120px">
          <label class="form-label">${t('filament.profile_material')}</label>
          <select class="form-input" id="${pfx}-material" onchange="window._onProfileMaterialChange('${pfx}')">${buildMaterialOptions(profile?.material || '')}</select>
          <input class="form-input mt-xs" id="${pfx}-material-custom" style="display:none" placeholder="${t('filament.custom_type_placeholder')}">
        </div>
        <div class="form-group" style="width:90px"><label class="form-label">${t('filament.color')}</label><input class="form-input" id="${pfx}-color-name" value="${profile?.color_name || ''}"></div>
        <div class="form-group" style="width:60px"><label class="form-label">${t('filament.color_hex')}</label><input type="color" class="form-input" id="${pfx}-color-hex" value="${profile?.color_hex ? hexToRgb(profile.color_hex) : '#888888'}" style="padding:2px;height:32px"></div>
        <div class="form-group" style="width:80px"><label class="form-label">${t('filament.profile_spool_weight')}</label><input class="form-input" id="${pfx}-spool-weight" type="number" value="${profile?.spool_weight_g || 1000}"></div>
        <div class="form-group" style="width:70px"><label class="form-label">${t('filament.profile_density')}</label><input class="form-input" id="${pfx}-density" type="number" step="0.01" value="${profile?.density ?? 1.24}"></div>
        <div class="form-group" style="width:70px"><label class="form-label">${t('filament.profile_diameter')}</label><input class="form-input" id="${pfx}-diameter" type="number" step="0.01" value="${profile?.diameter ?? 1.75}"></div>
        <div class="form-group" style="width:80px"><label class="form-label">${t('filament.price')}</label><input class="form-input" id="${pfx}-price" type="number" step="0.01" value="${profile?.price || ''}"></div>
        <div class="form-group" style="flex:1;min-width:180px"><label class="form-label">${t('filament.purchase_url')}</label>
          <div style="display:flex;gap:4px"><input class="form-input" id="${pfx}-purchase-url" value="${profile?.purchase_url || ''}" placeholder="https://...">
          <button class="form-btn form-btn-sm" type="button" data-ripple onclick="window._checkPrice('${pfx}')" title="${t('filament.check_price')}" style="white-space:nowrap">${t('filament.check_price')}</button></div>
        </div>
      </div>
      <div class="flex gap-sm" style="flex-wrap:wrap">
        <div class="form-group" style="width:80px"><label class="form-label">${t('filament.profile_nozzle_temp')} ${t('filament.temp_min')}</label><input class="form-input" id="${pfx}-nozzle-min" type="number" value="${profile?.nozzle_temp_min || ''}"></div>
        <div class="form-group" style="width:80px"><label class="form-label">${t('filament.profile_nozzle_temp')} ${t('filament.temp_max')}</label><input class="form-input" id="${pfx}-nozzle-max" type="number" value="${profile?.nozzle_temp_max || ''}"></div>
        <div class="form-group" style="width:80px"><label class="form-label">${t('filament.profile_bed_temp')} ${t('filament.temp_min')}</label><input class="form-input" id="${pfx}-bed-min" type="number" value="${profile?.bed_temp_min || ''}"></div>
        <div class="form-group" style="width:80px"><label class="form-label">${t('filament.profile_bed_temp')} ${t('filament.temp_max')}</label><input class="form-input" id="${pfx}-bed-max" type="number" value="${profile?.bed_temp_max || ''}"></div>
        <div class="form-group" style="width:80px"><label class="form-label">Kammer min</label><input class="form-input" id="${pfx}-chamber-min" type="number" value="${profile?.chamber_temp_min || ''}"></div>
        <div class="form-group" style="width:80px"><label class="form-label">Kammer maks</label><input class="form-input" id="${pfx}-chamber-max" type="number" value="${profile?.chamber_temp_max || ''}"></div>
        <div class="form-group" style="width:80px"><label class="form-label">⌀ toleranse</label><input class="form-input" id="${pfx}-dia-tolerance" type="number" step="0.001" value="${profile?.diameter_tolerance || ''}" placeholder="±mm"></div>
        <div class="form-group" style="width:100px"><label class="form-label">${t('filament.article_number')}</label><input class="form-input" id="${pfx}-article" value="${profile?.article_number || ''}"></div>
        <div class="form-group" style="width:90px"><label class="form-label">Bambu SKU</label><input class="form-input" id="${pfx}-tray-id-name" value="${profile?.tray_id_name || ''}" placeholder="A00-W0"></div>
        <div class="form-group" style="width:90px"><label class="form-label">RAL-kode</label><input class="form-input" id="${pfx}-ral-code" value="${profile?.ral_code || ''}" placeholder="RAL 9005"></div>
        <div class="form-group" style="width:90px"><label class="form-label">Pantone</label><input class="form-input" id="${pfx}-pantone-code" value="${profile?.pantone_code || ''}" placeholder="PMS 123"></div>
        <div class="form-group" style="width:90px">
          <label class="form-label">${t('filament.finish')}</label>
          <select class="form-input" id="${pfx}-finish">
            <option value="">--</option>
            ${['matte','glossy','satin','silk'].map(f => `<option value="${f}" ${profile?.finish === f ? 'selected' : ''}>${t('filament.finish_' + f)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="width:120px"><label class="form-label">${t('filament.weight_options')}</label><input class="form-input" id="${pfx}-weights" value="${_parseWeightOptions(profile?.weight_options)}" placeholder="250, 500, 1000"></div>
        <div class="form-group" style="width:120px"><label class="form-label">${t('filament.diameters')}</label><input class="form-input" id="${pfx}-diameters" value="${_parseDiameters(profile?.diameters)}" placeholder="1.75, 2.85"></div>
      </div>
      <div style="margin-top:4px">
        <label class="form-label">${t('filament.modifiers')}</label>
        <div class="modifier-tags" id="${pfx}-modifiers">
          ${_MODIFIERS.map(m => {
            const active = _parseModifiers(profile?.modifiers).includes(m);
            return `<span class="modifier-tag${active ? ' active' : ''}" onclick="this.classList.toggle('active')" data-mod="${m}">${m}</span>`;
          }).join('')}
        </div>
      </div>
      <div class="flex gap-sm" style="flex-wrap:wrap;margin-top:4px">
        <div style="font-size:0.75rem;width:100%;color:var(--text-muted);font-weight:600">${t('filament.optimal_settings')}</div>
        <div class="form-group" style="width:90px"><label class="form-label">${t('filament.pressure_advance')}</label><input class="form-input" id="${pfx}-pa-k" type="number" step="0.001" value="${profile?.pressure_advance_k || ''}"></div>
        <div class="form-group" style="width:100px"><label class="form-label">${t('filament.max_volumetric_speed')}</label><input class="form-input" id="${pfx}-max-vol" type="number" step="0.1" value="${profile?.max_volumetric_speed || ''}"></div>
        <div class="form-group" style="width:90px"><label class="form-label">${t('filament.retraction_distance')}</label><input class="form-input" id="${pfx}-retract-dist" type="number" step="0.1" value="${profile?.retraction_distance || ''}"></div>
        <div class="form-group" style="width:90px"><label class="form-label">${t('filament.retraction_speed')}</label><input class="form-input" id="${pfx}-retract-speed" type="number" step="1" value="${profile?.retraction_speed || ''}"></div>
        <div class="form-group" style="width:80px"><label class="form-label">${t('filament.cooling_fan_speed')}</label><input class="form-input" id="${pfx}-fan-speed" type="number" min="0" max="100" value="${profile?.cooling_fan_speed || ''}"></div>
        <div class="form-group" style="width:80px"><label class="form-label">${t('filament.transmission_distance')}</label><input class="form-input" id="${pfx}-td" type="number" step="0.01" min="0" value="${profile?.transmission_distance || ''}" placeholder="TD"></div>
      </div>
      <div class="flex gap-sm" style="flex-wrap:wrap;align-items:center">
        <label style="font-size:0.8rem;display:flex;align-items:center;gap:4px">
          <input type="checkbox" id="${pfx}-translucent" ${profile?.translucent ? 'checked' : ''}>
          ${t('filament.translucent')}
        </label>
        <label style="font-size:0.8rem;display:flex;align-items:center;gap:4px">
          <input type="checkbox" id="${pfx}-glow" ${profile?.glow ? 'checked' : ''}>
          ${t('filament.glow')}
        </label>
        <label style="font-size:0.8rem;display:flex;align-items:center;gap:4px">
          <input type="checkbox" id="${pfx}-multicolor" ${_hasMultiColor(profile) ? 'checked' : ''} onchange="window._toggleMultiColor('${pfx}',this.checked)">
          ${t('filament.multi_color')}
        </label>
        <div id="${pfx}-multicolor-fields" style="display:${_hasMultiColor(profile) ? 'flex' : 'none'};gap:4px;flex-wrap:wrap;align-items:center">
          ${_renderMultiColorInputs(pfx, profile)}
        </div>
      </div>
      <div id="${pfx}-extra-fields-section">
        <div style="font-size:0.8rem;margin:4px 0">${t('filament.extra_fields')}</div>
        <div id="${pfx}-extra-fields">${_renderExtraFieldInputs(pfx, profile?.extra_fields)}</div>
        <button class="form-btn form-btn-sm" data-ripple style="font-size:0.7rem" onclick="window._addExtraField('${pfx}')" type="button">+ ${t('filament.add_field')}</button>
      </div>
      <div class="flex gap-sm">
        <button class="form-btn" data-ripple onclick="${isEdit ? `saveProfileEdit(${profile.id})` : 'saveNewProfile()'}">${t('filament.save')}</button>
        <button class="form-btn form-btn-sm" data-ripple style="background:transparent;color:var(--text-muted)" onclick="document.getElementById('profile-form-container').innerHTML=''">${t('settings.cancel')}</button>
      </div>
    </div>`;
  }

  window._onProfileMaterialChange = function(pfx) {
    const sel = document.getElementById(`${pfx}-material`);
    const custom = document.getElementById(`${pfx}-material-custom`);
    if (!sel || !custom) return;
    if (sel.value === '__custom__') { custom.style.display = ''; custom.focus(); }
    else { custom.style.display = 'none'; custom.value = ''; }
  };

  function getProfileMaterial(pfx) {
    const sel = document.getElementById(`${pfx}-material`);
    if (!sel) return '';
    if (sel.value === '__custom__') return document.getElementById(`${pfx}-material-custom`)?.value?.trim() || '';
    return sel.value;
  }

  function collectProfileData(pfx) {
    const colorHex = document.getElementById(`${pfx}-color-hex`)?.value?.replace('#', '') || '';
    const isMultiColor = document.getElementById(`${pfx}-multicolor`)?.checked;
    return {
      vendor_id: parseInt(document.getElementById(`${pfx}-vendor`)?.value) || null,
      name: document.getElementById(`${pfx}-name`)?.value?.trim() || '',
      material: getProfileMaterial(pfx),
      color_name: document.getElementById(`${pfx}-color-name`)?.value || null,
      color_hex: colorHex || null,
      spool_weight_g: parseFloat(document.getElementById(`${pfx}-spool-weight`)?.value) || 1000,
      density: parseFloat(document.getElementById(`${pfx}-density`)?.value) || 1.24,
      diameter: parseFloat(document.getElementById(`${pfx}-diameter`)?.value) || 1.75,
      nozzle_temp_min: parseInt(document.getElementById(`${pfx}-nozzle-min`)?.value) || null,
      nozzle_temp_max: parseInt(document.getElementById(`${pfx}-nozzle-max`)?.value) || null,
      bed_temp_min: parseInt(document.getElementById(`${pfx}-bed-min`)?.value) || null,
      bed_temp_max: parseInt(document.getElementById(`${pfx}-bed-max`)?.value) || null,
      chamber_temp_min: parseInt(document.getElementById(`${pfx}-chamber-min`)?.value) || null,
      chamber_temp_max: parseInt(document.getElementById(`${pfx}-chamber-max`)?.value) || null,
      diameter_tolerance: parseFloat(document.getElementById(`${pfx}-dia-tolerance`)?.value) || null,
      tray_id_name: document.getElementById(`${pfx}-tray-id-name`)?.value?.trim() || null,
      ral_code: document.getElementById(`${pfx}-ral-code`)?.value?.trim() || null,
      pantone_code: document.getElementById(`${pfx}-pantone-code`)?.value?.trim() || null,
      price: parseFloat(document.getElementById(`${pfx}-price`)?.value) || null,
      article_number: document.getElementById(`${pfx}-article`)?.value?.trim() || null,
      multi_color_hexes: isMultiColor ? _collectMultiColorHexes(pfx) : null,
      multi_color_direction: isMultiColor ? (document.getElementById(`${pfx}-mc-dir`)?.value || 'coaxial') : null,
      extra_fields: _collectExtraFields(pfx),
      finish: document.getElementById(`${pfx}-finish`)?.value || null,
      translucent: document.getElementById(`${pfx}-translucent`)?.checked ? 1 : 0,
      glow: document.getElementById(`${pfx}-glow`)?.checked ? 1 : 0,
      weight_options: (() => { const v = document.getElementById(`${pfx}-weights`)?.value?.trim(); if (!v) return null; return JSON.stringify(v.split(',').map(s => parseInt(s.trim())).filter(n => n > 0)); })(),
      diameters: (() => { const v = document.getElementById(`${pfx}-diameters`)?.value?.trim(); if (!v) return null; return JSON.stringify(v.split(',').map(s => parseFloat(s.trim())).filter(n => n > 0)); })(),
      weights: (() => {
        const v = document.getElementById(`${pfx}-weights`)?.value?.trim();
        if (!v) return null;
        const spoolW = parseFloat(document.getElementById(`${pfx}-spool-weight`)?.value) || null;
        return JSON.stringify(v.split(',').map(s => parseInt(s.trim())).filter(n => n > 0).map(w => ({ weight: w, spool_weight: spoolW, spool_type: 'plastic' })));
      })(),
      pressure_advance_k: parseFloat(document.getElementById(`${pfx}-pa-k`)?.value) || null,
      max_volumetric_speed: parseFloat(document.getElementById(`${pfx}-max-vol`)?.value) || null,
      retraction_distance: parseFloat(document.getElementById(`${pfx}-retract-dist`)?.value) || null,
      retraction_speed: parseFloat(document.getElementById(`${pfx}-retract-speed`)?.value) || null,
      cooling_fan_speed: parseInt(document.getElementById(`${pfx}-fan-speed`)?.value) || null,
      transmission_distance: parseFloat(document.getElementById(`${pfx}-td`)?.value) || null,
      purchase_url: document.getElementById(`${pfx}-purchase-url`)?.value?.trim() || null,
      modifiers: (() => {
        const el = document.getElementById(`${pfx}-modifiers`);
        if (!el) return null;
        const active = [...el.querySelectorAll('.modifier-tag.active')].map(t => t.dataset.mod);
        return active.length > 0 ? active : null;
      })(),
    };
  }

  window.saveNewProfile = async function() {
    const data = collectProfileData('pa');
    if (!data.name || !data.material) { showToast(t('filament.type_required'), 'warning'); return; }
    await fetch('/api/inventory/filaments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    loadFilament();
  };

  window.saveProfileEdit = async function(id) {
    const data = collectProfileData('pe');
    if (!data.name || !data.material) { showToast(t('filament.type_required'), 'warning'); return; }
    await fetch(`/api/inventory/filaments/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    loadFilament();
  };

  window._checkPrice = async function(pfx) {
    const url = document.getElementById(`${pfx}-purchase-url`)?.value?.trim();
    if (!url) { showToast(t('filament.enter_url_first'), 'warning'); return; }
    try {
      const res = await fetch('/api/inventory/price-check', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (data.price) {
        const priceInput = document.getElementById(`${pfx}-price`);
        if (priceInput && !priceInput.value) priceInput.value = data.price;
        showToast(`${t('filament.price_found')}: ${data.currency || ''}${data.price}`, 'success');
      } else {
        showToast(t('filament.price_not_found'), 'warning');
      }
    } catch (e) { showToast(e.message, 'error'); }
  };

  window.deleteProfileItem = function(id) {
    return confirmAction(t('filament.profile_delete_confirm'), async () => {
      await fetch(`/api/inventory/filaments/${id}`, { method: 'DELETE' });
      loadFilament();
    }, { danger: true });
  };

  // ═══ Community Sharing ═══
  window._exportSlicerProfile = function(id) {
    const overlay = document.createElement('div');
    overlay.className = 'inv-modal-backdrop';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="inv-modal" style="max-width:320px">
      <h3>${t('filament.export_slicer')}</h3>
      <div style="display:flex;flex-direction:column;gap:8px;margin:16px 0">
        <a href="/api/inventory/filaments/${id}/slicer-export?format=orcaslicer" download class="form-btn form-btn-primary" style="text-align:center" onclick="setTimeout(()=>this.closest('.inv-modal-backdrop').remove(),200)">OrcaSlicer (.json)</a>
        <a href="/api/inventory/filaments/${id}/slicer-export?format=prusaslicer" download class="form-btn" style="text-align:center" onclick="setTimeout(()=>this.closest('.inv-modal-backdrop').remove(),200)">PrusaSlicer (.ini)</a>
      </div>
      <button class="form-btn" style="width:100%" onclick="this.closest('.inv-modal-backdrop').remove()">${t('common.cancel')}</button>
    </div>`;
    document.body.appendChild(overlay);
  };

  window._shareProfile = async function(id) {
    const profile = _profiles.find(p => p.id === id);
    if (!profile) return;
    const confirmed = confirm(t('filament.share_confirm', { name: profile.name || profile.material }));
    if (!confirmed) return;
    try {
      const res = await fetch('/api/community-filaments/share', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: id })
      });
      const data = await res.json();
      if (data.ok) showToast(t('filament.shared_success'), 'success');
      else showToast(data.error || 'Error', 'error');
    } catch (e) { showToast(e.message, 'error'); }
  };

  window._rateCommunityFilament = async function(id, rating) {
    try {
      const res = await fetch(`/api/community-filaments/${id}/rate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating })
      });
      const data = await res.json();
      if (data.ok) {
        showToast(t('filament.rating_saved'), 'success');
        // Update stars display
        for (let i = 1; i <= 5; i++) {
          const star = document.getElementById(`cf-star-${i}`);
          if (star) star.style.color = i <= rating ? 'var(--accent-orange)' : 'var(--text-muted)';
        }
      }
      else showToast(data.error || 'Error', 'error');
    } catch (e) { showToast(e.message, 'error'); }
  };

  window._submitTdVote = async function(id) {
    const val = parseFloat(document.getElementById(`td-vote-${id}`)?.value);
    if (!val || val <= 0) return;
    try {
      const res = await fetch(`/api/community-filaments/${id}/td-vote`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ td_value: val })
      });
      const data = await res.json();
      if (data.td_value != null) {
        showToast(`TD updated: ${data.td_value} (${data.total_td_votes} votes)`, 'success');
        const f = _dbFilaments.find(x => x.id === id);
        if (f) { f.td_value = data.td_value; f.total_td_votes = data.total_td_votes; }
      } else showToast(data.error || 'Error', 'error');
    } catch (e) { showToast(e.message, 'error'); }
  };

  // ═══ Location CRUD ═══
  function _buildParentLocationOptions(excludeId) {
    let opts = `<option value="">${t('common.none')}</option>`;
    for (const l of _locations) {
      if (l.id === excludeId) continue;
      opts += `<option value="${l.id}">${esc(l.name)}</option>`;
    }
    return opts;
  }

  window.showAddLocationForm = function() {
    const c = document.getElementById('location-form-container');
    if (!c) return;
    c.innerHTML = `<div class="settings-form mt-sm" style="border-top:1px solid var(--border-color);padding-top:8px">
      <div class="flex gap-sm" style="flex-wrap:wrap">
        <div class="form-group" style="flex:1;min-width:120px"><label class="form-label">${t('filament.location_name')}</label><input class="form-input" id="loc-name"></div>
        <div class="form-group" style="width:120px"><label class="form-label">${t('filament.location_parent')}</label><select class="form-input" id="loc-parent">${_buildParentLocationOptions()}</select></div>
        <div class="form-group" style="width:70px"><label class="form-label">${t('filament.location_min_spools')}</label><input class="form-input" id="loc-min-spools" type="number" min="0"></div>
        <div class="form-group" style="width:70px"><label class="form-label">${t('filament.location_max_spools')}</label><input class="form-input" id="loc-max-spools" type="number" min="0"></div>
      </div>
      <div class="flex gap-sm"><button class="form-btn" data-ripple onclick="saveNewLocation()">${t('filament.save')}</button><button class="form-btn form-btn-sm" data-ripple style="background:transparent;color:var(--text-muted)" onclick="document.getElementById('location-form-container').innerHTML=''">${t('settings.cancel')}</button></div>
    </div>`;
  };

  window.saveNewLocation = async function() {
    const name = document.getElementById('loc-name')?.value?.trim();
    if (!name) return;
    const data = { name };
    const parentId = document.getElementById('loc-parent')?.value;
    if (parentId) data.parent_id = parseInt(parentId);
    const minS = document.getElementById('loc-min-spools')?.value;
    if (minS) data.min_spools = parseInt(minS);
    const maxS = document.getElementById('loc-max-spools')?.value;
    if (maxS) data.max_spools = parseInt(maxS);
    await fetch('/api/inventory/locations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    loadFilament();
  };

  window.deleteLocationItem = async function(id) {
    await fetch(`/api/inventory/locations/${id}`, { method: 'DELETE' });
    loadFilament();
  };

  window.editLocationItem = function(id) {
    const l = _locations.find(x => x.id === id);
    if (!l) return;
    const c = document.getElementById('location-form-container');
    if (!c) return;
    c.innerHTML = `<div class="settings-form mt-sm" style="border-top:1px solid var(--border-color);padding-top:8px">
      <div class="flex gap-sm" style="flex-wrap:wrap">
        <div class="form-group" style="flex:1;min-width:120px"><label class="form-label">${t('filament.location_name')}</label><input class="form-input" id="loc-edit-name" value="${esc(l.name)}"></div>
        <div class="form-group" style="flex:1;min-width:120px"><label class="form-label">${t('filament.location_description')}</label><input class="form-input" id="loc-edit-desc" value="${esc(l.description || '')}"></div>
        <div class="form-group" style="width:120px"><label class="form-label">${t('filament.location_parent')}</label><select class="form-input" id="loc-edit-parent">${_buildParentLocationOptions(id).replace(`value="${l.parent_id}"`, `value="${l.parent_id}" selected`)}</select></div>
        <div class="form-group" style="width:70px"><label class="form-label">${t('filament.location_min_spools')}</label><input class="form-input" id="loc-edit-min-spools" type="number" min="0" value="${l.min_spools || ''}"></div>
        <div class="form-group" style="width:70px"><label class="form-label">${t('filament.location_max_spools')}</label><input class="form-input" id="loc-edit-max-spools" type="number" min="0" value="${l.max_spools || ''}"></div>
      </div>
      <div class="flex gap-sm"><button class="form-btn" data-ripple onclick="saveLocationEdit(${id})">${t('filament.save')}</button><button class="form-btn form-btn-sm" data-ripple style="background:transparent;color:var(--text-muted)" onclick="document.getElementById('location-form-container').innerHTML=''">${t('settings.cancel')}</button></div>
    </div>`;
  };

  window.saveLocationEdit = async function(id) {
    const name = document.getElementById('loc-edit-name')?.value?.trim();
    if (!name) return;
    const desc = document.getElementById('loc-edit-desc')?.value?.trim() || null;
    const data = { name, description: desc };
    const parentId = document.getElementById('loc-edit-parent')?.value;
    data.parent_id = parentId ? parseInt(parentId) : null;
    const minS = document.getElementById('loc-edit-min-spools')?.value;
    data.min_spools = minS ? parseInt(minS) : null;
    const maxS = document.getElementById('loc-edit-max-spools')?.value;
    data.max_spools = maxS ? parseInt(maxS) : null;
    await fetch(`/api/inventory/locations/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    loadFilament();
  };

  // ═══ Duplicate Spool ═══
  window.duplicateSpoolItem = async function(id) {
    const res = await fetch(`/api/inventory/spools/${id}/duplicate`, { method: 'POST' });
    if (res.ok) loadFilament();
    else showToast(t('filament.duplicate_failed'), 'error');
  };

  // ═══ Measure Weight ═══
  window.showRefillDialog = function(id) {
    const spool = _spools.find(s => s.id === id);
    if (!spool) return;
    const container = document.getElementById(`spool-edit-${id}`);
    if (!container) return;
    container.style.display = '';
    container.innerHTML = `<div class="settings-form" style="margin:6px 0;padding:6px;border-top:1px solid var(--border-color)">
      <div style="font-size:0.8rem;font-weight:600;margin-bottom:4px">${t('filament.refill_spool')} ${spool.is_refill ? '♻ x' + (spool.refill_count || 1) : ''}</div>
      <div class="flex gap-sm" style="align-items:flex-end">
        <div class="form-group" style="width:120px">
          <label class="form-label">${t('filament.new_fill_weight')}</label>
          <input class="form-input" id="refill-weight-${id}" type="number" value="${spool.initial_weight_g || 1000}" min="1">
        </div>
        <button class="form-btn form-btn-sm" data-ripple onclick="submitRefill(${id})">${t('filament.refill')}</button>
        <button class="form-btn form-btn-sm" data-ripple style="background:transparent;color:var(--text-muted)" onclick="document.getElementById('spool-edit-${id}').style.display='none'">${t('settings.cancel')}</button>
      </div>
    </div>`;
  };

  window.submitRefill = async function(id) {
    const weightEl = document.getElementById(`refill-weight-${id}`);
    const weight = parseFloat(weightEl?.value);
    if (!weight || weight <= 0) { showToast('Enter a valid weight', 'warning'); return; }
    try {
      const res = await fetch(`/api/inventory/spools/${id}/refill`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_weight_g: weight })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      showToast(t('filament.refill_done'), 'success');
      document.getElementById(`spool-edit-${id}`).style.display = 'none';
      _loadSpools();
    } catch (e) { showToast(e.message, 'error'); }
  };

  window.showMeasureDialog = function(id) {
    const spool = _spools.find(s => s.id === id);
    if (!spool) return;
    const tare = spool.spool_weight ?? spool.vendor_empty_spool_weight_g ?? 250;
    const totalG = spool.initial_weight_g || 1000;
    const quickPcts = [0, 25, 50, 75, 100];
    const quickBtns = quickPcts.map(p => {
      const gross = Math.round(totalG * p / 100 + tare);
      return `<button class="measure-quick-btn" onclick="document.getElementById('measure-weight-${id}').value=${gross};document.getElementById('measure-weight-${id}').dispatchEvent(new Event('input'))">${p}% <span class="measure-quick-g">${gross}g</span></button>`;
    }).join('');
    const density = spool.density || 1.24;
    const diameter = spool.diameter || 1.75;
    const cancelAction = `closeMeasureDialog(${id})`;
    const formHtml = `<div class="settings-form" style="margin:6px 0;padding:6px;border-top:1px solid var(--border-color)">
      <div class="flex gap-sm" style="align-items:center;margin-bottom:4px">
        <label style="font-size:0.7rem;cursor:pointer"><input type="radio" name="measure-mode-${id}" value="scale" checked onchange="document.getElementById('measure-scale-${id}').style.display='';document.getElementById('measure-length-${id}').style.display='none'"> ${t('filament.gross_weight')}</label>
        <label style="font-size:0.7rem;cursor:pointer"><input type="radio" name="measure-mode-${id}" value="length" onchange="document.getElementById('measure-scale-${id}').style.display='none';document.getElementById('measure-length-${id}').style.display=''"> ${t('filament.use_by_length')}</label>
      </div>
      <div id="measure-scale-${id}">
        <div class="flex gap-sm" style="align-items:flex-end">
          <div class="form-group" style="width:120px">
            <label class="form-label">${t('filament.gross_weight')}</label>
            <input class="form-input" id="measure-weight-${id}" type="number" placeholder="${t('filament.gross_weight_placeholder')}">
          </div>
          <button class="form-btn form-btn-sm" data-ripple onclick="submitMeasure(${id})">${t('filament.measure')}</button>
          <button class="form-btn form-btn-sm" data-ripple style="background:transparent;color:var(--text-muted)" onclick="${cancelAction}">${t('settings.cancel')}</button>
        </div>
        <div class="measure-quick-btns">${quickBtns}</div>
      </div>
      <div id="measure-length-${id}" style="display:none">
        <div class="flex gap-sm" style="align-items:flex-end">
          <div class="form-group" style="width:120px">
            <label class="form-label">${t('filament.meters')}</label>
            <input class="form-input" id="measure-length-val-${id}" type="number" step="0.1" placeholder="${t('filament.enter_meters')}">
          </div>
          <button class="form-btn form-btn-sm" data-ripple onclick="submitMeasureLength(${id},${density},${diameter})">${t('filament.measure')}</button>
          <button class="form-btn form-btn-sm" data-ripple style="background:transparent;color:var(--text-muted)" onclick="${cancelAction}">${t('settings.cancel')}</button>
        </div>
      </div>
    </div>`;
    const container = document.getElementById(`spool-edit-${id}`);
    if (container) {
      container.style.display = '';
      container.innerHTML = formHtml;
      return;
    }
    // Fallback: open in modal overlay (visual card view)
    const overlay = document.createElement('div');
    overlay.className = 'inv-modal-overlay';
    overlay.id = `measure-modal-${id}`;
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="inv-modal" style="max-width:500px">
      <div class="inv-modal-header">
        <span>${t('filament.measure_weight')} — ${esc(_cleanProfileName(spool))}</span>
        <button class="inv-modal-close" onclick="this.closest('.inv-modal-overlay').remove()">&times;</button>
      </div>
      <div style="padding:12px">${formHtml}</div>
    </div>`;
    document.body.appendChild(overlay);
  };

  window.closeMeasureDialog = function(id) {
    const c = document.getElementById(`spool-edit-${id}`);
    if (c) { c.style.display = 'none'; return; }
    const m = document.getElementById(`measure-modal-${id}`);
    if (m) m.remove();
  };

  window.submitMeasure = async function(id) {
    const grossWeight = parseFloat(document.getElementById(`measure-weight-${id}`)?.value);
    if (!grossWeight || grossWeight <= 0) return;
    const res = await fetch(`/api/inventory/spools/${id}/measure`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gross_weight_g: grossWeight })
    });
    if (res.ok) { closeMeasureDialog(id); loadFilament(); }
    else { const err = await res.json().catch(() => ({})); showToast(err.error || t('filament.measure_failed'), 'error'); }
  };

  window.submitMeasureLength = async function(id, density, diameter) {
    const meters = parseFloat(document.getElementById(`measure-length-val-${id}`)?.value);
    if (!meters || meters <= 0) return;
    const radiusCm = (diameter / 10) / 2;
    const lengthCm = meters * 100;
    const volumeCm3 = lengthCm * Math.PI * radiusCm * radiusCm;
    const grams = Math.round(volumeCm3 * density * 100) / 100;
    const res = await fetch(`/api/inventory/spools/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ used_weight_g_add: grams })
    });
    if (res.ok) { closeMeasureDialog(id); loadFilament(); }
    else showToast(t('filament.measure_failed'), 'error');
  };

  // ═══ Code 128 Barcode Generator ═══
  function _code128Svg(text, height = 40) {
    const C128 = [
      [2,1,2,2,2,2],[2,2,2,1,2,2],[2,2,2,2,2,1],[1,2,1,2,2,3],[1,2,1,3,2,2],
      [1,3,1,2,2,2],[1,2,2,2,1,3],[1,2,2,3,1,2],[1,3,2,2,1,2],[2,2,1,2,1,3],
      [2,2,1,3,1,2],[2,3,1,2,1,2],[1,1,2,2,3,2],[1,2,2,1,3,2],[1,2,2,2,3,1],
      [1,1,3,2,2,2],[1,2,3,1,2,2],[1,2,3,2,2,1],[2,2,3,2,1,1],[2,2,1,1,3,2],
      [2,2,1,2,3,1],[2,1,3,2,1,2],[2,2,3,1,1,2],[3,1,2,1,3,1],[3,1,1,2,2,2],
      [3,2,1,1,2,2],[3,2,1,2,2,1],[3,1,2,2,1,2],[3,2,2,1,1,2],[3,2,2,2,1,1],
      [2,1,2,1,2,3],[2,1,2,3,2,1],[2,3,2,1,2,1],[1,1,1,3,2,3],[1,3,1,1,2,3],
      [1,3,1,3,2,1],[1,1,2,3,1,3],[1,3,2,1,1,3],[1,3,2,3,1,1],[2,1,1,3,1,3],
      [2,3,1,1,1,3],[2,3,1,3,1,1],[1,1,2,1,3,3],[1,1,2,3,3,1],[1,3,2,1,3,1],
      [1,1,3,1,2,3],[1,1,3,3,2,1],[1,3,3,1,2,1],[3,1,3,1,2,1],[2,1,1,3,3,1],
      [2,3,1,1,3,1],[2,1,3,1,1,3],[2,1,3,3,1,1],[2,1,3,1,3,1],[3,1,1,1,2,3],
      [3,1,1,3,2,1],[3,3,1,1,2,1],[3,1,2,1,1,3],[3,1,2,3,1,1],[3,3,2,1,1,1],
      [3,1,4,1,1,1],[2,2,1,4,1,1],[4,3,1,1,1,1],[1,1,1,2,2,4],[1,1,1,4,2,2],
      [1,2,1,1,2,4],[1,2,1,4,2,1],[1,4,1,1,2,2],[1,4,1,2,2,1],[1,1,2,2,1,4],
      [1,1,2,4,1,2],[1,2,2,1,1,4],[1,2,2,4,1,1],[1,4,2,1,1,2],[1,4,2,2,1,1],
      [2,4,1,2,1,1],[2,2,1,1,1,4],[4,1,3,1,1,1],[2,4,1,1,1,2],[1,3,4,1,1,1],
      [1,1,1,2,4,2],[1,2,1,1,4,2],[1,2,1,2,4,1],[1,1,4,2,1,2],[1,2,4,1,1,2],
      [1,2,4,2,1,1],[4,1,1,2,1,2],[4,2,1,1,1,2],[4,2,1,2,1,1],[2,1,2,1,4,1],
      [2,1,4,1,2,1],[4,1,2,1,2,1],[1,1,1,1,4,3],[1,1,1,3,4,1],[1,3,1,1,4,1],
      [1,1,4,1,1,3],[1,1,4,3,1,1],[4,1,1,1,1,3],[4,1,1,3,1,1],[1,1,3,1,4,1],
      [1,1,4,1,3,1],[3,1,1,1,4,1],[4,1,1,1,3,1],[2,1,1,4,1,2],[2,1,1,2,1,4],
      [2,1,1,2,3,2],[2,3,3,1,1,1,2]
    ];
    // Use Code B
    const codes = [104]; // Start B
    let checksum = 104;
    for (let i = 0; i < text.length; i++) {
      const val = text.charCodeAt(i) - 32;
      codes.push(val);
      checksum += val * (i + 1);
    }
    codes.push(checksum % 103);
    codes.push(106); // Stop
    let bars = '';
    let x = 10;
    for (const code of codes) {
      const pattern = C128[code];
      for (let i = 0; i < pattern.length; i++) {
        if (i % 2 === 0) bars += `<rect x="${x}" y="0" width="${pattern[i]}" height="${height}" fill="black"/>`;
        x += pattern[i];
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x + 10} ${height + 14}" style="max-width:100%"><rect width="100%" height="100%" fill="white"/>${bars}<text x="${(x + 10)/2}" y="${height + 12}" text-anchor="middle" font-size="10" font-family="monospace">${text}</text></svg>`;
  }

  window._toggleLabelCode = function(type) {
    const qrEl = document.querySelector('.inv-qr-code');
    const bcEl = document.querySelector('.inv-barcode');
    if (qrEl) qrEl.style.display = (type === 'barcode') ? 'none' : '';
    if (bcEl) bcEl.style.display = (type === 'qr') ? 'none' : '';
  };

  // ═══ QR Label ═══
  window.showSpoolLabel = async function(id) {
    const res = await fetch(`/api/inventory/spools/${id}/qr`);
    if (!res.ok) return;
    const data = await res.json();
    const label = data.label;
    let qrHtml = '';
    if (typeof qrcode !== 'undefined') {
      const qr = qrcode(0, 'M');
      qr.addData(data.qr_data);
      qr.make();
      qrHtml = qr.createSvgTag(4, 0);
    } else {
      qrHtml = `<div style="width:120px;height:120px;background:var(--bg-secondary);display:flex;align-items:center;justify-content:center;font-size:0.7rem;color:var(--text-muted)">${t('filament.qr_unavailable')}</div>`;
    }
    const overlay = document.createElement('div');
    overlay.className = 'inv-modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="inv-modal inv-qr-label">
      <div class="inv-modal-header">
        <span>${t('filament.qr_label')}</span>
        <button class="inv-modal-close" onclick="this.closest('.inv-modal-overlay').remove()">&times;</button>
      </div>
      <div style="padding:8px 12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <label class="form-label" style="margin:0;font-size:0.75rem">${t('filament.label_format')}:</label>
        <select class="form-input" id="qr-label-format" style="width:auto;font-size:0.75rem" onchange="document.getElementById('qr-label-print').className='inv-qr-label-content inv-qr-label-'+this.value">
          <option value="horizontal" selected>${t('filament.label_horizontal')}</option>
          <option value="vertical">${t('filament.label_vertical')}</option>
          <option value="compact">${t('filament.label_compact')}</option>
        </select>
        <label class="form-label" style="margin:0;font-size:0.75rem">${t('filament.label_code_type')}:</label>
        <select class="form-input" id="qr-label-code-type" style="width:auto;font-size:0.75rem" onchange="window._toggleLabelCode(this.value)">
          <option value="qr" selected>QR</option>
          <option value="barcode">Code 128</option>
          <option value="both">${t('filament.label_both')}</option>
        </select>
        <label class="form-label" style="margin:0;font-size:0.75rem">${t('filament.label_width')}:</label>
        <select class="form-input" id="qr-label-width" style="width:auto;font-size:0.75rem">
          <option value="62">62mm</option>
          <option value="50" selected>50mm</option>
          <option value="38">38mm</option>
          <option value="29">29mm</option>
        </select>
      </div>
      <div class="inv-qr-label-content inv-qr-label-horizontal" id="qr-label-print">
        <div class="inv-qr-code">${qrHtml}</div>
        <div class="inv-barcode" style="display:none;max-width:140px">${_code128Svg(label.short_id || String(id))}</div>
        <div class="inv-qr-info">
          <strong>${esc(label.name)}</strong>
          <span>${esc(label.vendor || '')} · ${esc(label.material || '')}</span>
          <span>${label.color_name ? esc(label.color_name) : ''}</span>
          ${label.short_id ? `<span>#${esc(label.short_id)}</span>` : ''}
          <span>${label.spool_weight_g ? label.spool_weight_g + 'g' : ''} ${label.remaining_weight_g ? '(' + Math.round(label.remaining_weight_g) + 'g ' + t('filament.remaining') + ')' : ''}</span>
          ${label.lot_number ? `<span>Lot: ${esc(label.lot_number)}</span>` : ''}
        </div>
      </div>
      <div class="inv-modal-footer" style="display:flex;gap:6px">
        <button class="form-btn" data-ripple onclick="printQrLabel()">${t('filament.print_label')}</button>
        <button class="form-btn form-btn-sm" data-ripple onclick="window._copyZplLabel(${id})" title="${t('filament.copy_zpl')}">${t('filament.copy_zpl')}</button>
        <button class="form-btn form-btn-sm" data-ripple onclick="window._copyDymoLabel(${id})" title="${t('filament.copy_dymo')}">${t('filament.copy_dymo')}</button>
        <button class="form-btn form-btn-sm" data-ripple onclick="window._copyEscPosLabel(${id})" title="${t('filament.copy_escpos')}">${t('filament.copy_escpos')}</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
  };

  window._copyZplLabel = async function(spoolId) {
    try {
      const res = await fetch('/api/inventory/label-zpl?spool_id=' + spoolId);
      const data = await res.json();
      if (data.zpl) {
        await navigator.clipboard.writeText(data.zpl);
        showToast(t('filament.zpl_copied'), 'success');
      }
    } catch { showToast('Error', 'error'); }
  };

  window._copyDymoLabel = async function(spoolId) {
    try {
      const res = await fetch('/api/inventory/label-zpl?spool_id=' + spoolId);
      const data = await res.json();
      if (data.dymo_xml) {
        await navigator.clipboard.writeText(data.dymo_xml);
        showToast(t('filament.dymo_copied'), 'success');
      }
    } catch { showToast('Error', 'error'); }
  };

  window._copyEscPosLabel = async function(spoolId) {
    try {
      const res = await fetch('/api/inventory/label-zpl?spool_id=' + spoolId);
      const data = await res.json();
      if (data.escpos) {
        await navigator.clipboard.writeText(data.escpos);
        showToast(t('filament.escpos_copied'), 'success');
      }
    } catch { showToast('Error', 'error'); }
  };

  window.printQrLabel = function() {
    const content = document.getElementById('qr-label-print');
    if (!content) return;
    const widthMm = document.getElementById('qr-label-width')?.value || '50';
    const format = document.getElementById('qr-label-format')?.value || 'horizontal';
    const isVertical = format === 'vertical';
    const isCompact = format === 'compact';
    const qrSize = isCompact ? '80px' : '120px';
    const fontSize = isCompact ? '10px' : '12px';
    const titleSize = isCompact ? '12px' : '14px';
    const win = window.open('', '_blank', 'width=400,height=300');
    win.document.write(`<html><head><title>${t('filament.qr_label')}</title><style>
      body{font-family:sans-serif;padding:5mm;text-align:center;margin:0}
      .inv-qr-label-content{display:flex;gap:${isCompact?'8px':'16px'};align-items:center;justify-content:center;${isVertical?'flex-direction:column;':''}width:${widthMm}mm;margin:0 auto}
      .inv-qr-info{display:flex;flex-direction:column;gap:2px;text-align:${isVertical?'center':'left'};font-size:${fontSize}}
      .inv-qr-info strong{font-size:${titleSize}}
      svg{width:${qrSize};height:${qrSize}}
      @media print{@page{size:${widthMm}mm auto;margin:2mm}body{padding:0}}
    </style></head><body>${content.outerHTML.replace(/class="[^"]*"/g, m => m.includes('inv-qr-info') || m.includes('inv-qr-code') || m.includes('inv-qr-label-content') ? m : '')}</body></html>`);
    win.document.close();
    win.print();
  };

  // ═══ QR Scanner ═══
  window.openQrScanner = function() {
    const overlay = document.createElement('div');
    overlay.className = 'inv-modal-overlay';
    overlay.id = 'qr-scanner-overlay';
    overlay.innerHTML = `<div class="inv-modal" style="max-width:400px">
      <div class="inv-modal-header">
        <span>${t('filament.scan_qr')}</span>
        <button class="inv-modal-close" onclick="closeQrScanner()">&times;</button>
      </div>
      <div style="position:relative">
        <video id="qr-scanner-video" style="width:100%;border-radius:4px" autoplay playsinline></video>
        <canvas id="qr-scanner-canvas" style="display:none"></canvas>
      </div>
      <div id="qr-scanner-status" class="text-muted" style="font-size:0.8rem;padding:8px;text-align:center">${t('filament.scanning')}</div>
    </div>`;
    document.body.appendChild(overlay);
    startQrScanning();
  };

  async function startQrScanning() {
    const video = document.getElementById('qr-scanner-video');
    const canvas = document.getElementById('qr-scanner-canvas');
    const status = document.getElementById('qr-scanner-status');
    if (!video || !canvas) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      video.srcObject = stream;
      video.setAttribute('playsinline', true);
      video.play();
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      // Try to load jsQR
      if (typeof jsQR === 'undefined') {
        const script = document.createElement('script');
        script.src = '/js/lib/jsqr.min.js';
        script.onload = () => scanFrame(video, canvas, ctx, status, stream);
        script.onerror = () => { if (status) status.textContent = t('filament.qr_lib_failed'); };
        document.head.appendChild(script);
      } else {
        scanFrame(video, canvas, ctx, status, stream);
      }
    } catch (e) {
      if (status) status.textContent = t('filament.camera_denied');
    }
  }

  function scanFrame(video, canvas, ctx, status, stream) {
    if (!document.getElementById('qr-scanner-overlay')) { stream.getTracks().forEach(t => t.stop()); return; }
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
      if (code) {
        // Parse spool ID from URL like /#filament/spool/42
        const match = code.data.match(/#filament\/spool\/(\d+)/);
        if (match) {
          stream.getTracks().forEach(t => t.stop());
          closeQrScanner();
          const spoolId = parseInt(match[1]);
          const spool = _spools.find(s => s.id === spoolId);
          if (spool) {
            showEditSpoolForm(spoolId);
          } else {
            showToast(t('filament.spool_not_found'), 'warning');
          }
          return;
        }
        if (status) status.textContent = t('filament.qr_not_recognized');
      }
    }
    requestAnimationFrame(() => scanFrame(video, canvas, ctx, status, stream));
  }

  window.closeQrScanner = function() {
    const overlay = document.getElementById('qr-scanner-overlay');
    if (overlay) {
      const video = overlay.querySelector('video');
      if (video && video.srcObject) video.srcObject.getTracks().forEach(t => t.stop());
      overlay.remove();
    }
  };

  // ═══ Export ═══
  window.importFromAms = async function() {
    try {
      const res = await fetch('/api/inventory/import-ams', { method: 'POST' });
      const data = await res.json();
      if (data.count > 0) {
        loadFilament();
      } else {
        alert(t('filament.import_ams_none'));
      }
    } catch (e) {
      alert(t('filament.import_ams_failed'));
    }
  };

  window.exportInventory = function(type, format) {
    // Close dropdown
    document.querySelectorAll('.inv-export-menu.show').forEach(m => m.classList.remove('show'));
    const url = `/api/inventory/export/${type}?format=${format}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // ═══ Color similarity ═══
  window.findSimilarColors = async function(spoolId) {
    const spool = _spools.find(s => s.id === spoolId);
    if (!spool || !spool.color_hex) return;
    const res = await fetch(`/api/inventory/colors/similar?hex=${spool.color_hex}&max_delta_e=30`);
    if (!res.ok) return;
    const results = await res.json();
    const overlay = document.createElement('div');
    overlay.className = 'inv-modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    let listHtml = '';
    for (const r of results) {
      listHtml += `<div class="inv-similar-item">
        ${miniSpool(hexToRgb(r.color_hex), 14)}
        <span>${esc(r.name)} · ${esc(r.material)}</span>
        <span class="text-muted">ΔE ${r.delta_e.toFixed(1)}</span>
      </div>`;
    }
    overlay.innerHTML = `<div class="inv-modal" style="max-width:400px">
      <div class="inv-modal-header">
        <span>${t('filament.similar_colors')}</span>
        <button class="inv-modal-close" onclick="this.closest('.inv-modal-overlay').remove()">&times;</button>
      </div>
      <div style="padding:12px">${results.length > 0 ? listHtml : `<p class="text-muted">${t('filament.no_similar_colors')}</p>`}</div>
    </div>`;
    document.body.appendChild(overlay);
  };

  // ═══ SpoolmanDB Browser ═══
  window.showSpoolmanDbBrowser = async function() {
    const overlay = document.createElement('div');
    overlay.className = 'inv-modal-overlay';
    overlay.id = 'spoolmandb-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="inv-modal" style="max-width:600px;max-height:80vh;display:flex;flex-direction:column">
      <div class="inv-modal-header">
        <span>SpoolmanDB</span>
        <button class="inv-modal-close" onclick="this.closest('.inv-modal-overlay').remove()">&times;</button>
      </div>
      <div style="padding:8px"><input class="form-input" id="spoolmandb-search" placeholder="${t('filament.search_placeholder')}" oninput="window._filterSpoolmanDb(this.value)"></div>
      <div id="spoolmandb-content" style="overflow-y:auto;flex:1;padding:8px">
        <span class="text-muted text-sm">${t('filament.loading')}...</span>
      </div>
    </div>`;
    document.body.appendChild(overlay);

    try {
      const res = await fetch('/api/inventory/spoolmandb/manufacturers');
      if (!res.ok) throw new Error();
      const manufacturers = await res.json();
      window._spoolmanDbMfgs = manufacturers;
      renderSpoolmanDbList(manufacturers);
    } catch {
      const c = document.getElementById('spoolmandb-content');
      if (c) c.innerHTML = `<p class="text-muted">${t('filament.spoolmandb_failed')}</p>`;
    }
  };

  window._filterSpoolmanDb = function(query) {
    if (!window._spoolmanDbMfgs) return;
    const q = query.toLowerCase();
    const filtered = q ? window._spoolmanDbMfgs.filter(m => m.name.toLowerCase().includes(q)) : window._spoolmanDbMfgs;
    renderSpoolmanDbList(filtered);
  };

  function renderSpoolmanDbList(manufacturers) {
    const c = document.getElementById('spoolmandb-content');
    if (!c) return;
    if (manufacturers.length === 0) { c.innerHTML = `<p class="text-muted">${t('filament.no_results')}</p>`; return; }
    let h = '';
    for (const m of manufacturers.slice(0, 100)) {
      // m.id is the filename without .json, m.name is same
      const displayName = m.name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ');
      h += `<div class="inv-spoolmandb-mfg">
        <div class="inv-spoolmandb-mfg-name" onclick="this.parentElement.classList.toggle('expanded');if(!this.parentElement.dataset.loaded)loadSpoolmanDbFilaments('${esc(m.id)}',this.parentElement)">
          <strong>${esc(displayName)}</strong>
        </div>
        <div class="inv-spoolmandb-filaments" style="display:none"></div>
      </div>`;
    }
    if (manufacturers.length > 100) h += `<p class="text-muted text-sm">... ${manufacturers.length - 100} ${t('filament.more')}</p>`;
    c.innerHTML = h;
  }

  window.loadSpoolmanDbFilaments = async function(mfgId, el) {
    el.dataset.loaded = '1';
    const filDiv = el.querySelector('.inv-spoolmandb-filaments');
    if (!filDiv) return;
    filDiv.style.display = '';
    filDiv.innerHTML = `<span class="text-muted text-sm">${t('filament.loading')}...</span>`;
    try {
      const res = await fetch(`/api/inventory/spoolmandb/filaments?manufacturer=${encodeURIComponent(mfgId)}`);
      const filaments = await res.json();
      let h = '';
      for (const f of filaments) {
        const color = f.color_hex ? hexToRgb(f.color_hex) : '#888';
        h += `<div class="inv-spoolmandb-fil">
          ${miniSpool(color, 10)}
          <span>${esc(f.name || '')} · ${esc(f.material || '')}</span>
          <button class="form-btn form-btn-sm" data-ripple onclick='importSpoolmanDbFilament(${JSON.stringify(f).replace(/'/g,"&#39;")})'>${t('filament.import')}</button>
        </div>`;
      }
      filDiv.innerHTML = h || `<span class="text-muted text-sm">${t('filament.no_results')}</span>`;
    } catch {
      filDiv.innerHTML = `<span class="text-muted text-sm">${t('filament.load_failed')}</span>`;
    }
  };

  window.importSpoolmanDbFilament = async function(filament) {
    const res = await fetch('/api/inventory/spoolmandb/import', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filament)
    });
    if (res.ok) {
      const overlay = document.getElementById('spoolmandb-overlay');
      if (overlay) overlay.remove();
      loadFilament();
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || t('filament.import_failed'), 'error');
    }
  };

  // ═══ DnD Location drop ═══
  window._invDropSpool = async function(e, colEl) {
    e.preventDefault();
    colEl.classList.remove('inv-dnd-over');
    const spoolId = parseInt(e.dataTransfer.getData('text/plain'));
    const location = colEl.dataset.location || null;
    if (!spoolId) return;
    const spool = _spools.find(s => s.id === spoolId);
    if (!spool || spool.location === location) return;
    await fetch(`/api/inventory/spools/${spoolId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...spool, location })
    });
    loadFilament();
  };

  // ═══ Import dialog ═══
  // ═══ Vendor-specific CSV field mappings ═══
  const VENDOR_FIELD_MAPS = {
    // Polymaker format
    polymaker: { 'Product Name': 'name', 'Color': 'color_name', 'Color Code': 'color_hex', 'Material': 'material', 'Weight (g)': 'initial_weight_g', 'Price': 'cost', 'Diameter': 'diameter' },
    // Prusament format
    prusament: { 'Name': 'name', 'Filament Type': 'material', 'Color Name': 'color_name', 'Hex Color': 'color_hex', 'Net Weight': 'initial_weight_g', 'Spool Weight': 'spool_weight_g', 'Nozzle Temp': 'nozzle_temp_min', 'Bed Temp': 'bed_temp_min' },
    // eSUN format
    esun: { 'SKU': 'article_number', 'Product': 'name', 'Type': 'material', 'Color': 'color_name', 'Weight': 'initial_weight_g', 'Nozzle Temperature': 'nozzle_temp_min' },
    // Generic / Spoolman format
    spoolman: { 'filament_name': 'name', 'filament_material': 'material', 'filament_color_hex': 'color_hex', 'weight': 'initial_weight_g', 'price': 'cost' }
  };

  function _detectVendorFormat(headers) {
    for (const [vendor, map] of Object.entries(VENDOR_FIELD_MAPS)) {
      const vendorHeaders = Object.keys(map).map(h => h.toLowerCase());
      const matchCount = headers.filter(h => vendorHeaders.includes(h.toLowerCase())).length;
      if (matchCount >= 3) return { vendor, map };
    }
    return null;
  }

  let _importParsedData = null;
  let _importDetectedFormat = null;

  window.showImportDialog = function() {
    document.querySelectorAll('.inv-export-menu.show').forEach(m => m.classList.remove('show'));
    _importParsedData = null;
    _importDetectedFormat = null;
    const overlay = document.createElement('div');
    overlay.className = 'inv-modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="inv-modal" style="max-width:550px">
      <div class="inv-modal-header">
        <span>${t('filament.import')}</span>
        <button class="inv-modal-close" onclick="this.closest('.inv-modal-overlay').remove()">&times;</button>
      </div>
      <div style="padding:12px">
        <div class="form-group">
          <label class="form-label">${t('filament.import_type')}</label>
          <select class="form-input" id="import-type">
            <option value="spools">${t('filament.export_spools_csv').replace(' (CSV)','')}</option>
            <option value="filaments">${t('filament.export_profiles_csv').replace(' (CSV)','')}</option>
            <option value="vendors">${t('filament.export_vendors_csv').replace(' (CSV)','')}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">${t('filament.import_file')}</label>
          <div id="import-drop-zone" style="border:2px dashed var(--border);border-radius:8px;padding:16px;text-align:center;cursor:pointer">
            <input type="file" class="form-input" id="import-file" accept=".json,.csv" style="display:none" onchange="previewImport()">
            <div onclick="document.getElementById('import-file').click()" style="color:var(--text-muted);font-size:0.85rem">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:4px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <div>${t('filament.import_drop')}</div>
            </div>
          </div>
        </div>
        <div id="import-preview" style="display:none"></div>
        <div id="import-status"></div>
      </div>
      <div class="inv-modal-footer">
        <button class="form-btn" data-ripple onclick="executeImport()" id="import-btn" disabled>${t('filament.import')}</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    // Drag-and-drop
    const zone = document.getElementById('import-drop-zone');
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.borderColor = 'var(--accent)'; });
    zone.addEventListener('dragleave', () => { zone.style.borderColor = ''; });
    zone.addEventListener('drop', e => {
      e.preventDefault(); zone.style.borderColor = '';
      if (e.dataTransfer.files.length) {
        const input = document.getElementById('import-file');
        input.files = e.dataTransfer.files;
        previewImport();
      }
    });
  };

  window.previewImport = async function() {
    const fileInput = document.getElementById('import-file');
    const preview = document.getElementById('import-preview');
    const btn = document.getElementById('import-btn');
    if (!fileInput?.files?.[0] || !preview) return;
    const file = fileInput.files[0];
    const text = await file.text();
    let data;
    let detectedFormat = null;

    if (file.name.endsWith('.json')) {
      data = JSON.parse(text);
      if (!Array.isArray(data)) data = [data];
    } else {
      // Parse CSV with proper quote handling
      const sep = text.includes(';') ? ';' : ',';
      const lines = text.replace(/^\uFEFF/, '').split('\n').filter(l => l.trim());
      const headers = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, ''));

      // Detect vendor-specific format
      detectedFormat = _detectVendorFormat(headers);

      data = [];
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(sep).map(v => v.trim().replace(/^"|"$/g, ''));
        const obj = {};
        headers.forEach((h, idx) => {
          // Map vendor-specific headers to our field names
          const fieldName = detectedFormat ? (detectedFormat.map[h] || h) : h;
          obj[fieldName] = vals[idx] || null;
        });
        // Convert numeric fields
        for (const k of ['cost', 'initial_weight_g', 'used_weight_g', 'remaining_weight_g', 'density', 'diameter', 'spool_weight_g', 'empty_spool_weight_g']) {
          if (obj[k]) obj[k] = parseFloat(obj[k]) || null;
        }
        for (const k of ['vendor_id', 'filament_profile_id', 'nozzle_temp_min', 'nozzle_temp_max', 'bed_temp_min', 'bed_temp_max']) {
          if (obj[k]) obj[k] = parseInt(obj[k]) || null;
        }
        // Normalize color_hex
        if (obj.color_hex && !obj.color_hex.startsWith('#')) obj.color_hex = '#' + obj.color_hex;
        data.push(obj);
      }
    }

    _importParsedData = data;
    _importDetectedFormat = detectedFormat;

    // Build preview
    const sample = data.slice(0, 5);
    const fields = sample.length ? Object.keys(sample[0]).filter(k => sample.some(r => r[k])) : [];
    let h = '';
    if (detectedFormat) {
      h += `<div style="padding:6px 8px;background:var(--bg-secondary);border-radius:6px;margin-bottom:8px;font-size:0.8rem">
        <strong>${t('filament.import_format_detected')}:</strong> ${esc(detectedFormat.vendor.charAt(0).toUpperCase() + detectedFormat.vendor.slice(1))}
      </div>`;
    }

    // Check for potential duplicates
    const existingNames = new Set(_profiles.map(p => (p.name || '').toLowerCase()));
    const dupes = data.filter(r => r.name && existingNames.has(r.name.toLowerCase()));
    if (dupes.length) {
      h += `<div style="padding:6px 8px;background:rgba(255,165,0,0.1);border:1px solid rgba(255,165,0,0.3);border-radius:6px;margin-bottom:8px;font-size:0.8rem;color:var(--warning)">
        ${t('filament.import_duplicates', { count: dupes.length })}
      </div>`;
    }

    h += `<div style="font-size:0.8rem;margin-bottom:4px"><strong>${data.length}</strong> ${t('filament.import_rows')}</div>`;
    if (fields.length && sample.length) {
      h += '<div style="overflow-x:auto;max-height:200px;border:1px solid var(--border);border-radius:6px"><table style="width:100%;font-size:0.72rem;border-collapse:collapse">';
      h += '<thead><tr style="background:var(--bg-secondary);position:sticky;top:0">';
      for (const f of fields.slice(0, 6)) h += `<th style="padding:3px 6px;text-align:left;white-space:nowrap">${esc(f)}</th>`;
      if (fields.length > 6) h += '<th style="padding:3px 6px">...</th>';
      h += '</tr></thead><tbody>';
      for (const row of sample) {
        h += '<tr>';
        for (const f of fields.slice(0, 6)) {
          const v = row[f] != null ? String(row[f]).substring(0, 30) : '';
          h += `<td style="padding:2px 6px;border-top:1px solid var(--border)">${esc(v)}</td>`;
        }
        if (fields.length > 6) h += '<td style="padding:2px 6px;border-top:1px solid var(--border)">...</td>';
        h += '</tr>';
      }
      if (data.length > 5) h += `<tr><td colspan="${Math.min(fields.length, 7)}" style="padding:4px 6px;text-align:center;color:var(--text-muted)">... +${data.length - 5} ${t('filament.import_more_rows')}</td></tr>`;
      h += '</tbody></table></div>';
    }
    preview.innerHTML = h;
    preview.style.display = 'block';
    if (btn) btn.disabled = false;

    // Show filename in drop zone
    const zone = document.getElementById('import-drop-zone');
    if (zone) zone.innerHTML = `<div style="font-size:0.85rem">${esc(file.name)} <span style="color:var(--text-muted)">(${(file.size/1024).toFixed(0)} KB)</span></div>`;
  };

  window.executeImport = async function() {
    const type = document.getElementById('import-type')?.value;
    const status = document.getElementById('import-status');
    let data = _importParsedData;
    if (!data || !data.length) {
      // Fallback: read file directly (for backwards compat)
      const fileInput = document.getElementById('import-file');
      if (!fileInput?.files?.[0]) return;
      const file = fileInput.files[0];
      const text = await file.text();
      if (file.name.endsWith('.json')) {
        data = JSON.parse(text);
      } else {
        const sep = text.includes(';') ? ';' : ',';
        const lines = text.replace(/^\uFEFF/, '').split('\n').filter(l => l.trim());
        const headers = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, ''));
        data = [];
        for (let i = 1; i < lines.length; i++) {
          const vals = lines[i].split(sep).map(v => v.trim().replace(/^"|"$/g, ''));
          const obj = {};
          headers.forEach((h, idx) => { obj[h] = vals[idx] || null; });
          for (const k of ['cost', 'initial_weight_g', 'used_weight_g', 'remaining_weight_g', 'density', 'diameter', 'spool_weight_g', 'empty_spool_weight_g']) {
            if (obj[k]) obj[k] = parseFloat(obj[k]) || null;
          }
          for (const k of ['vendor_id', 'filament_profile_id', 'nozzle_temp_min', 'nozzle_temp_max', 'bed_temp_min', 'bed_temp_max']) {
            if (obj[k]) obj[k] = parseInt(obj[k]) || null;
          }
          data.push(obj);
        }
      }
    }
    if (!Array.isArray(data)) data = [data];
    try {
      const res = await fetch(`/api/inventory/import/${type}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (status) status.innerHTML = `<span style="color:var(--accent-green)">${t('filament.imported_count', { count: result.imported || 0 })}</span>`;
      setTimeout(() => {
        document.querySelector('.inv-modal-overlay')?.remove();
        loadFilament();
      }, 1500);
    } catch (e) {
      if (status) status.innerHTML = `<span style="color:var(--accent-red)">${t('filament.import_failed')}</span>`;
    }
  };

  // ═══ 3MF / Gcode File Analyzer ═══
  window.showAnalyzeFileDialog = function() {
    const overlay = document.createElement('div');
    overlay.className = 'inv-modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="inv-modal" style="max-width:500px">
      <div class="inv-modal-header">
        <span>${t('filament.analyze_file')}</span>
        <button class="inv-modal-close" onclick="this.closest('.inv-modal-overlay').remove()">&times;</button>
      </div>
      <div style="padding:12px">
        <p class="text-muted" style="font-size:0.8rem;margin-bottom:8px">${t('filament.analyze_file_hint')}</p>
        <input type="file" id="analyze-file-input" accept=".3mf,.gcode,.g" class="form-input">
        <div id="analyze-file-result" style="margin-top:8px"></div>
      </div>
      <div class="inv-modal-footer">
        <button class="form-btn" data-ripple onclick="window._doAnalyzeFile()">${t('filament.analyze')}</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
  };

  window._doAnalyzeFile = async function() {
    const input = document.getElementById('analyze-file-input');
    const file = input?.files?.[0];
    if (!file) return;
    const resultEl = document.getElementById('analyze-file-result');
    resultEl.innerHTML = '<span class="text-muted">Analyzing...</span>';
    try {
      const formData = file;
      const res = await fetch(`/api/inventory/analyze-file?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: formData
      });
      const data = await res.json();
      if (data.error) { resultEl.innerHTML = `<span style="color:var(--accent-red)">${esc(data.error)}</span>`; return; }
      let h = '<div style="border:1px solid var(--border-color);border-radius:6px;padding:8px;font-size:0.8rem">';
      if (data.plate_name) h += `<div><strong>${t('common.name')}:</strong> ${esc(data.plate_name)}</div>`;
      h += `<div><strong>${t('filament.total_weight')}:</strong> ${Math.round(data.total_weight_g * 100) / 100}g</div>`;
      if (data.estimated_time_min) h += `<div><strong>${t('filament.estimated_time')}:</strong> ${Math.floor(data.estimated_time_min / 60)}h ${data.estimated_time_min % 60}m</div>`;
      if (data.filaments.length) {
        h += `<div style="margin-top:6px"><strong>${t('filament.filaments_used')}:</strong></div>`;
        h += '<table style="width:100%;font-size:0.75rem;border-collapse:collapse;margin-top:4px">';
        h += '<tr style="background:var(--bg-secondary)"><th style="padding:2px 6px;text-align:left">#</th><th style="padding:2px 6px;text-align:left">${t("filament.material")}</th><th style="padding:2px 6px;text-align:right">${t("filament.weight")}</th></tr>';
        data.filaments.forEach((f, i) => {
          h += `<tr><td style="padding:2px 6px">${i + 1}</td><td style="padding:2px 6px">${esc(f.material || '?')}</td><td style="padding:2px 6px;text-align:right">${Math.round(f.weight_g * 100) / 100}g</td></tr>`;
        });
        h += '</table>';
      }
      h += '</div>';
      resultEl.innerHTML = h;
    } catch (e) { resultEl.innerHTML = `<span style="color:var(--accent-red)">${esc(e.message)}</span>`; }
  };

  // ═══ Inventory Settings ═══
  window.showInventorySettings = async function() {
    let settings = {};
    try { const r = await fetch('/api/inventory/settings'); settings = await r.json(); } catch {}
    const overlay = document.createElement('div');
    overlay.className = 'inv-modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="inv-modal" style="max-width:400px">
      <div class="inv-modal-header">
        <span>${t('filament.settings')}</span>
        <button class="inv-modal-close" onclick="this.closest('.inv-modal-overlay').remove()">&times;</button>
      </div>
      <div style="padding:12px">
        <div class="form-group">
          <label class="form-label">${t('filament.default_weight')}</label>
          <input class="form-input" id="set-default-weight" type="number" value="${settings.default_weight || 1000}" placeholder="1000">
        </div>
        <div class="form-group">
          <label class="form-label">${t('filament.currency')}</label>
          <input class="form-input" id="set-currency" value="${settings.currency || currencySymbol()}" placeholder="${currencySymbol()}">
        </div>
        <div class="form-group">
          <label class="form-label">${t('filament.low_stock_threshold')}</label>
          <input class="form-input" id="set-low-threshold" type="number" value="${settings.low_stock_threshold || 20}" placeholder="20" min="1" max="50">
          <span class="text-muted" style="font-size:0.7rem">%</span>
        </div>
        <div class="form-group">
          <label class="form-label">${t('filament.near_empty_grams')}</label>
          <input class="form-input" id="set-near-empty-g" type="number" value="${settings.near_empty_grams || 0}" placeholder="0" min="0">
          <span class="text-muted" style="font-size:0.7rem">${t('filament.near_empty_grams_hint')}</span>
        </div>
        <div class="form-group">
          <label class="form-label">${t('filament.filament_check_mode')}</label>
          <select class="form-input" id="set-filament-check-mode">
            <option value="warn" ${(settings.filament_check_mode || 'warn') === 'warn' ? 'selected' : ''}>${t('filament.filament_check_warn')}</option>
            <option value="block" ${settings.filament_check_mode === 'block' ? 'selected' : ''}>${t('filament.filament_check_block')}</option>
          </select>
          <span class="text-muted" style="font-size:0.7rem">${t('filament.filament_check_hint')}</span>
        </div>
        <div class="form-group">
          <label class="form-label" style="display:flex;align-items:center;gap:8px">
            <input type="checkbox" id="set-exclude-labor-cancelled" ${settings.exclude_labor_cancelled === '1' ? 'checked' : ''}>
            ${t('filament.exclude_labor_cancelled')}
          </label>
          <span class="text-muted" style="font-size:0.7rem">${t('filament.exclude_labor_cancelled_hint')}</span>
        </div>
        <div class="form-group">
          <label class="form-label">${t('filament.page_size')}</label>
          <select class="form-input" id="set-page-size">
            ${[25, 50, 100].map(n => `<option value="${n}" ${(_pageSize === n || (!_pageSize && n === 50)) ? 'selected' : ''}>${n}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">${t('filament.auto_trash_days')}</label>
          <input class="form-input" id="set-auto-trash" type="number" value="${settings.auto_trash_days || 0}" placeholder="0" min="0" max="365">
          <span class="text-muted" style="font-size:0.7rem">${t('filament.auto_trash_hint')}</span>
        </div>
        <div style="border-top:1px solid var(--border-color);margin-top:8px;padding-top:8px">
          <div style="font-size:0.8rem;font-weight:600;margin-bottom:6px">${t('filament.cost_estimate')}</div>
          <div class="form-group">
            <label class="form-label">${t('filament.electricity_rate')}</label>
            <input class="form-input" id="set-electricity-rate" type="number" step="0.01" value="${settings.electricity_rate_kwh || ''}" placeholder="0.00">
          </div>
          <div class="form-group">
            <label class="form-label">${t('filament.printer_wattage')}</label>
            <input class="form-input" id="set-printer-wattage" type="number" value="${settings.printer_wattage || ''}" placeholder="0">
          </div>
          <div class="form-group">
            <label class="form-label">${t('filament.machine_cost')}</label>
            <input class="form-input" id="set-machine-cost" type="number" step="0.01" value="${settings.machine_cost || ''}" placeholder="0.00">
          </div>
          <div class="form-group">
            <label class="form-label">${t('filament.machine_lifetime')}</label>
            <input class="form-input" id="set-machine-lifetime" type="number" value="${settings.machine_lifetime_hours || ''}" placeholder="5000">
          </div>
          <div class="form-group">
            <label class="form-label">${t('filament.labor_rate')}</label>
            <input class="form-input" id="set-labor-rate" type="number" step="0.01" value="${settings.labor_rate_hourly || ''}" placeholder="0.00">
          </div>
        </div>
      </div>
      <div class="inv-modal-footer">
        <button class="form-btn" data-ripple onclick="saveInventorySettings()">${t('filament.save')}</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
  };

  window.saveInventorySettings = async function() {
    const keys = [
      ['default_weight', document.getElementById('set-default-weight')?.value],
      ['currency', document.getElementById('set-currency')?.value],
      ['low_stock_threshold', document.getElementById('set-low-threshold')?.value],
      ['near_empty_grams', document.getElementById('set-near-empty-g')?.value],
      ['filament_check_mode', document.getElementById('set-filament-check-mode')?.value],
      ['exclude_labor_cancelled', document.getElementById('set-exclude-labor-cancelled')?.checked ? '1' : '0'],
      ['page_size', document.getElementById('set-page-size')?.value],
      ['auto_trash_days', document.getElementById('set-auto-trash')?.value],
      ['electricity_rate_kwh', document.getElementById('set-electricity-rate')?.value],
      ['printer_wattage', document.getElementById('set-printer-wattage')?.value],
      ['machine_cost', document.getElementById('set-machine-cost')?.value],
      ['machine_lifetime_hours', document.getElementById('set-machine-lifetime')?.value],
      ['labor_rate_hourly', document.getElementById('set-labor-rate')?.value]
    ];
    for (const [key, value] of keys) {
      if (value != null) await fetch(`/api/inventory/settings/${key}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value }) });
    }
    _pageSize = parseInt(document.getElementById('set-page-size')?.value) || 50;
    document.querySelector('.inv-modal-overlay')?.remove();
    loadFilament();
  };

  // ═══ WebSocket inventory listener ═══
  let _wsListenerAttached = false;
  let _wsDebounce = null;
  function attachInventoryWsListener() {
    if (_wsListenerAttached || !window.printerState?._ws) return;
    const origHandler = window.printerState._ws.onmessage;
    window.printerState._ws.addEventListener('message', (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === 'inventory_update') {
          clearTimeout(_wsDebounce);
          _wsDebounce = setTimeout(() => {
            // Only reload if filament panel is visible
            if (document.getElementById('overlay-panel-body')?.querySelector('.filament-tab-panel')) {
              loadFilament();
            }
          }, 500);
        }
      } catch {}
    });
    _wsListenerAttached = true;
  }

  // ═══ Drying Management Functions ═══

  function _startDryingTimers() {
    for (const ds of _dryingSessions) {
      if (_dryingTimers[ds.id]) continue;
      _dryingTimers[ds.id] = setInterval(() => {
        const el = document.getElementById('drying-timer-' + ds.id);
        if (!el) { clearInterval(_dryingTimers[ds.id]); delete _dryingTimers[ds.id]; return; }
        const startTime = new Date(ds.started_at + 'Z').getTime();
        const endTime = startTime + ds.duration_minutes * 60 * 1000;
        const remaining = Math.max(0, endTime - Date.now());
        const remainMin = Math.floor(remaining / 60000);
        const remainH = Math.floor(remainMin / 60);
        const remainM = remainMin % 60;
        el.textContent = remaining <= 0 ? 'Done!' : `${remainH}h ${String(remainM).padStart(2, '0')}m`;
        if (remaining <= 0) el.style.color = 'var(--accent-green, #00e676)';
      }, 5000);
    }
  }

  // ── Drying dashboard sub-tab rendering ──
  async function _loadDryingStats() {
    try {
      const res = await fetch('/api/inventory/drying/sessions?active=0&limit=200');
      _dryingHistory = await res.json();
      const totalEl = document.getElementById('drying-stat-total');
      const humidEl = document.getElementById('drying-stat-humidity');
      if (totalEl) totalEl.textContent = _dryingHistory.length;
      if (humidEl) {
        const withHumidity = _dryingHistory.filter(s => s.humidity_before != null && s.humidity_after != null);
        if (withHumidity.length > 0) {
          const avg = withHumidity.reduce((sum, s) => sum + (s.humidity_before - s.humidity_after), 0) / withHumidity.length;
          humidEl.textContent = avg.toFixed(1) + '%';
        } else {
          humidEl.textContent = '-';
        }
      }
    } catch { /* ignore */ }
  }

  window._switchDryingSubTab = function(tab) {
    _dryingSubTab = tab;
    document.querySelectorAll('.drying-sub-tab').forEach(b => b.classList.toggle('active', b.textContent.trim().startsWith(
      tab === 'active' ? t('filament.drying_sub_active') : tab === 'history' ? t('filament.drying_sub_history') : t('filament.drying_sub_presets')
    )));
    _renderDryingSubContent();
  };

  function _renderDryingSubContent() {
    const el = document.getElementById('drying-sub-content');
    if (!el) return;
    if (_dryingSubTab === 'active') _renderDryingActive(el);
    else if (_dryingSubTab === 'history') _renderDryingHistory(el);
    else if (_dryingSubTab === 'presets') _renderDryingPresets(el);
  }

  function _renderDryingActive(el) {
    if (!_dryingSessions || _dryingSessions.length === 0) {
      el.innerHTML = `<p class="text-muted" style="font-size:0.8rem;padding:8px 0">${t('filament.drying_no_active')}</p>`;
      return;
    }
    let h = '';
    for (const ds of _dryingSessions) {
      const startTime = new Date(ds.started_at + 'Z').getTime();
      const endTime = startTime + ds.duration_minutes * 60 * 1000;
      const now = Date.now();
      const elapsed = Math.max(0, now - startTime);
      const remaining = Math.max(0, endTime - now);
      const remainMin = Math.floor(remaining / 60000);
      const remainH = Math.floor(remainMin / 60);
      const remainM = remainMin % 60;
      const pct = Math.min(100, Math.round((elapsed / (ds.duration_minutes * 60000)) * 100));
      const colorDot = ds.color_hex ? (typeof miniSpool === 'function' ? miniSpool('#' + ds.color_hex, 14) : `<span class="fil-color-dot" style="background:#${ds.color_hex}"></span>`) : '';
      const methodLabel = t('filament.drying_method_' + (ds.method || 'dryer_box'));
      h += `<div class="fil-drying-card active" data-drying-id="${ds.id}">
        ${colorDot}
        <div class="fil-drying-info">
          <div class="label">${esc(ds.profile_name || '?')} ${ds.vendor_name ? '(' + esc(ds.vendor_name) + ')' : ''}</div>
          <div class="meta">${esc(ds.material || '')} · ${methodLabel} · ${ds.temperature ? ds.temperature + '°C' : ''}</div>
        </div>
        <div class="fil-drying-timer" id="drying-timer-${ds.id}">${remainH}h ${String(remainM).padStart(2, '0')}m</div>
        <div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end">
          <div class="filament-bar" style="width:80px;height:6px"><div class="filament-bar-fill" style="width:${pct}%;background:var(--accent-orange,#f0883e)"></div></div>
          <button class="form-btn form-btn-sm" data-ripple onclick="completeDryingItem(${ds.id})">${t('filament.drying_complete')}</button>
        </div>
      </div>`;
    }
    el.innerHTML = h;
    _startDryingTimers();
  }

  function _renderDryingHistory(el) {
    // Filter bar
    const materials = [...new Set(_dryingHistory.map(s => s.material).filter(Boolean))].sort();
    const methods = [...new Set(_dryingHistory.map(s => s.method).filter(Boolean))].sort();
    let h = `<div class="inv-filter-bar" style="margin-bottom:10px">
      <select class="form-input form-input-sm" onchange="window._dryFilterMaterial(this.value)" style="max-width:150px">
        <option value="">${t('filament.drying_filter_material')}</option>
        ${materials.map(m => `<option value="${m}" ${m === _dryHistoryFilter.material ? 'selected' : ''}>${m}</option>`).join('')}
      </select>
      <select class="form-input form-input-sm" onchange="window._dryFilterMethod(this.value)" style="max-width:150px">
        <option value="">${t('filament.drying_filter_method')}</option>
        ${methods.map(m => `<option value="${m}" ${m === _dryHistoryFilter.method ? 'selected' : ''}>${t('filament.drying_method_' + m)}</option>`).join('')}
      </select>
      <select class="form-input form-input-sm" onchange="window._drySort(this.value)" style="max-width:150px">
        <option value="date_desc" ${_dryHistorySort === 'date_desc' ? 'selected' : ''}>${t('filament.drying_sort_newest')}</option>
        <option value="date_asc" ${_dryHistorySort === 'date_asc' ? 'selected' : ''}>${t('filament.drying_sort_oldest')}</option>
      </select>
    </div>`;

    // Filter + sort
    let filtered = _dryingHistory.slice();
    if (_dryHistoryFilter.material) filtered = filtered.filter(s => s.material === _dryHistoryFilter.material);
    if (_dryHistoryFilter.method) filtered = filtered.filter(s => s.method === _dryHistoryFilter.method);
    if (_dryHistorySort === 'date_asc') filtered.reverse();

    if (filtered.length === 0) {
      h += `<p class="text-muted text-sm">${t('filament.drying_no_history')}</p>`;
      el.innerHTML = h;
      return;
    }

    h += `<table class="fil-drying-presets-table"><thead><tr>
      <th>${t('common.date')}</th>
      <th>${t('filament.profile_name')}</th>
      <th>${t('filament.filter_material')}</th>
      <th>${t('filament.drying_method')}</th>
      <th>${t('filament.drying_temp')}</th>
      <th>${t('filament.drying_duration')}</th>
      <th>${t('filament.drying_humidity_before')}</th>
      <th>${t('filament.drying_humidity_after')}</th>
      <th></th>
    </tr></thead><tbody>`;
    for (const s of filtered) {
      const date = s.completed_at ? new Date(s.completed_at + 'Z').toLocaleDateString() : new Date(s.started_at + 'Z').toLocaleDateString();
      const methodLabel = t('filament.drying_method_' + (s.method || 'dryer_box'));
      h += `<tr>
        <td>${date}</td>
        <td>${esc(s.profile_name || '?')}</td>
        <td>${esc(s.material || '')}</td>
        <td>${methodLabel}</td>
        <td>${s.temperature ? s.temperature + '°C' : '-'}</td>
        <td>${s.duration_minutes} min</td>
        <td>${s.humidity_before != null ? s.humidity_before + '%' : '-'}</td>
        <td>${s.humidity_after != null ? s.humidity_after + '%' : '-'}</td>
        <td><button class="filament-delete-btn" style="opacity:1" onclick="deleteDryingItem(${s.id})" data-tooltip="${t('settings.delete')}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button></td>
      </tr>`;
    }
    h += '</tbody></table>';
    el.innerHTML = h;
  }

  function _renderDryingPresets(el) {
    let h = `<div style="display:flex;justify-content:flex-end;margin-bottom:8px">
      <button class="form-btn form-btn-sm" data-ripple onclick="showAddDryingPresetForm()">${t('filament.drying_preset_add')}</button>
    </div>`;
    h += `<div id="drying-presets-form" style="display:none"></div>`;
    if (!_dryingPresets || _dryingPresets.length === 0) {
      h += `<p class="text-muted" style="font-size:0.8rem;padding:8px 0">No presets</p>`;
      el.innerHTML = h;
      return;
    }
    h += `<table class="fil-drying-presets-table"><thead><tr>
      <th>${t('filament.filter_material')}</th>
      <th>${t('filament.drying_temp')}</th>
      <th>${t('filament.drying_duration')}</th>
      <th>${t('filament.drying_max_days')}</th>
      <th></th>
    </tr></thead><tbody>`;
    for (const p of _dryingPresets) {
      h += `<tr>
        <td><strong>${esc(p.material)}</strong></td>
        <td>${p.temperature}°C</td>
        <td>${p.duration_minutes} min (${(p.duration_minutes / 60).toFixed(1)}h)</td>
        <td>${p.max_days_without_drying} d</td>
        <td style="text-align:right">
          <button class="filament-edit-btn" style="opacity:1" onclick="editDryingPreset('${esc(p.material)}')" title="${t('settings.edit')}" data-tooltip="${t('settings.edit')}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="filament-delete-btn" style="opacity:1" onclick="deleteDryingPresetItem('${esc(p.material)}')" title="${t('settings.delete')}" data-tooltip="${t('settings.delete')}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </td>
      </tr>`;
    }
    h += '</tbody></table>';
    el.innerHTML = h;
  }

  window._dryFilterMaterial = function(v) { _dryHistoryFilter.material = v; _renderDryingSubContent(); };
  window._dryFilterMethod = function(v) { _dryHistoryFilter.method = v; _renderDryingSubContent(); };
  window._drySort = function(v) { _dryHistorySort = v; _renderDryingSubContent(); };

  window._dryingQuickStart = function() {
    let spoolOpts = `<option value="">${t('filament.drying_select_spool')}</option>`;
    for (const s of _spools) {
      const name = s.profile_name || s.material || `Spool #${s.id}`;
      const vendor = s.vendor_name ? ` (${s.vendor_name})` : '';
      spoolOpts += `<option value="${s.id}" data-material="${esc(s.material || '')}">${esc(name)}${esc(vendor)}</option>`;
    }
    const overlay = document.createElement('div');
    overlay.className = 'inv-modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="inv-modal" style="max-width:440px">
      <div class="inv-modal-header">
        <span>${t('filament.drying_quick_start')}</span>
        <button class="inv-modal-close" onclick="this.closest('.inv-modal-overlay').remove()">&times;</button>
      </div>
      <div class="inv-modal-body">
        <div class="form-group"><label class="form-label">${t('filament.drying_select_spool')}</label>
          <select class="form-input" id="qs-dry-spool" onchange="window._qsDrySpoolChanged()">${spoolOpts}</select>
        </div>
        <div class="form-grid" style="grid-template-columns:1fr 1fr;gap:8px">
          <label class="form-label">${t('filament.drying_temp')}
            <input class="form-input form-input-sm" type="number" id="qs-dry-temp" value="50" min="30" max="120">
          </label>
          <label class="form-label">${t('filament.drying_duration')}
            <input class="form-input form-input-sm" type="number" id="qs-dry-duration" value="240" min="30" max="1440">
          </label>
          <label class="form-label">${t('filament.drying_method')}
            <select class="form-input form-input-sm" id="qs-dry-method">
              <option value="dryer_box">${t('filament.drying_method_dryer_box')}</option>
              <option value="ams_drying">${t('filament.drying_method_ams')}</option>
              <option value="oven">${t('filament.drying_method_oven')}</option>
              <option value="other">${t('filament.drying_method_other')}</option>
            </select>
          </label>
          <label class="form-label">${t('filament.drying_humidity_before')}
            <input class="form-input form-input-sm" type="number" id="qs-dry-humidity" step="0.1" min="0" max="100" placeholder="Optional">
          </label>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="form-btn" data-ripple onclick="window._qsDrySubmit()">${t('filament.drying_quick_start')}</button>
          <button class="form-btn form-btn-sm" data-ripple onclick="this.closest('.inv-modal-overlay').remove()">${t('common.cancel')}</button>
        </div>
      </div>
    </div>`;
    document.body.appendChild(overlay);
  };

  window._qsDrySpoolChanged = function() {
    const select = document.getElementById('qs-dry-spool');
    if (!select?.value) return;
    const spool = _spools.find(s => s.id === parseInt(select.value));
    if (!spool) return;
    const preset = _dryingPresets.find(p => p.material === spool.material);
    if (preset) {
      const tempEl = document.getElementById('qs-dry-temp');
      const durEl = document.getElementById('qs-dry-duration');
      if (tempEl) tempEl.value = preset.temperature;
      if (durEl) durEl.value = preset.duration_minutes;
    }
  };

  window._qsDrySubmit = async function() {
    const spoolId = parseInt(document.getElementById('qs-dry-spool')?.value);
    if (!spoolId) return;
    const temp = parseInt(document.getElementById('qs-dry-temp')?.value || '50');
    const duration = parseInt(document.getElementById('qs-dry-duration')?.value || '240');
    const method = document.getElementById('qs-dry-method')?.value || 'dryer_box';
    const humidity = parseFloat(document.getElementById('qs-dry-humidity')?.value) || null;
    try {
      const res = await fetch('/api/inventory/drying/sessions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spool_id: spoolId, temperature: temp, duration_minutes: duration, method, humidity_before: humidity })
      });
      if (!res.ok) throw new Error('Failed');
      document.querySelector('.inv-modal-overlay')?.remove();
      loadFilament();
    } catch (e) { showToast(e.message, 'error'); }
  };

  async function _loadInsights() {
    const container = document.getElementById('insights-container');
    if (!container) return;
    try {
      const res = await fetch('/api/inventory/insights');
      const data = await res.json();
      if (!data.insights || data.insights.length === 0) {
        container.innerHTML = `<p class="text-muted" style="font-size:0.85rem;padding:12px 0">${t('filament.ai_insights_hint')}</p>`;
        return;
      }
      const icons = { warning: '&#9888;', restock: '&#128230;', info: '&#128161;', suggestion: '&#128300;' };
      const colors = { warning: 'var(--accent-orange, orange)', restock: 'var(--accent-red, red)', info: 'var(--accent-blue, #4a9eff)', suggestion: 'var(--accent-green, green)' };
      let h = '';
      for (const insight of data.insights) {
        h += `<div style="padding:10px;border:1px solid ${colors[insight.type] || 'var(--border-color)'};border-radius:8px;margin-bottom:8px;background:color-mix(in srgb, ${colors[insight.type] || 'var(--border-color)'} 5%, transparent)">
          <div style="font-weight:600;font-size:0.85rem;margin-bottom:4px">${icons[insight.type] || ''} ${esc(insight.title)}</div>
          <div style="font-size:0.8rem;color:var(--text-muted)">${esc(insight.message)}</div>`;
        if (insight.items?.length) {
          h += '<ul style="margin:6px 0 0;padding-left:18px;font-size:0.75rem">';
          for (const item of insight.items) h += `<li>${esc(item)}</li>`;
          h += '</ul>';
        }
        h += '</div>';
      }
      container.innerHTML = h;
    } catch { container.innerHTML = '<span class="text-muted">Error</span>'; }
  }

  async function _loadPriceWatch() {
    const container = document.getElementById('price-watch-container');
    if (!container) return;
    try {
      const res = await fetch('/api/price-alerts');
      const alerts = await res.json();
      let h = '';
      if (alerts.length > 0) {
        h += '<div class="inv-location-list">';
        for (const a of alerts) {
          const colorDot = a.color_hex ? `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#${a.color_hex};border:1px solid var(--border-color)"></span>` : '';
          const statusIcon = a.triggered ? `<span style="color:var(--accent-green,#3fb950)" title="${t('filament.price_alert_triggered')}">&#10003;</span>` : '';
          const priceInfo = a.latest_price != null ? `<span class="text-muted">${t('filament.price_current')}: ${a.latest_price}</span>` : '';
          h += `<div class="fil-tag-item">
            ${colorDot}
            <span style="flex:1">
              <strong>${esc(a.profile_name || '?')}</strong>
              ${a.vendor_name ? '<span class="text-muted">(' + esc(a.vendor_name) + ')</span>' : ''}
              <br><span class="text-muted" style="font-size:0.75rem">${t('filament.price_target')}: ${a.target_price} ${esc(a.currency || '')} ${priceInfo}</span>
            </span>
            ${statusIcon}
            ${a.source_url ? `<a href="${esc(a.source_url)}" target="_blank" class="filament-edit-btn" title="${t('filament.price_source')}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>` : ''}
            <button class="filament-delete-btn" onclick="window._deletePriceAlert(${a.id})" data-tooltip="${t('settings.delete')}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>`;
        }
        h += '</div>';
      } else {
        h += `<p class="text-muted" style="font-size:0.85rem">${t('filament.price_watch_none')}</p>`;
      }
      h += `<div id="price-alert-form-container"></div>`;
      if (window._can && window._can('filament')) h += `<button class="form-btn form-btn-sm" data-ripple style="margin-top:8px" onclick="window._showAddPriceAlert()">+ ${t('filament.price_alert_add')}</button>`;
      container.innerHTML = h;
    } catch (e) { container.innerHTML = `<p class="text-muted">Error: ${e.message}</p>`; }
  }

  window._showAddPriceAlert = function() {
    const container = document.getElementById('price-alert-form-container');
    if (!container) return;
    const profiles = _profiles || [];
    let opts = profiles.map(p => `<option value="${p.id}">${esc(p.name)} (${esc(p.material || '')})</option>`).join('');
    container.innerHTML = `<div class="inv-inline-form" style="margin-top:8px">
      <select class="form-input form-input-sm" id="pa-profile"><option value="">-- ${t('filament.profile_name')} --</option>${opts}</select>
      <input class="form-input form-input-sm" id="pa-target" type="number" step="0.01" placeholder="${t('filament.price_target')}" style="width:100px">
      <input class="form-input form-input-sm" id="pa-currency" type="text" value="USD" placeholder="USD" style="width:60px">
      <input class="form-input form-input-sm" id="pa-url" type="url" placeholder="${t('filament.price_source_url')}" style="flex:1">
      <button class="form-btn form-btn-sm form-btn-primary" data-ripple onclick="window._savePriceAlert()">${t('filament.tag_save')}</button>
    </div>`;
  };

  window._savePriceAlert = async function() {
    const profileId = document.getElementById('pa-profile')?.value;
    const target = parseFloat(document.getElementById('pa-target')?.value);
    const currency = document.getElementById('pa-currency')?.value || 'USD';
    const url = document.getElementById('pa-url')?.value || '';
    if (!profileId || !target) return;
    await fetch('/api/price-alerts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filament_profile_id: parseInt(profileId), target_price: target, currency, source_url: url || null }) });
    _loadPriceWatch();
  };

  window._deletePriceAlert = async function(id) {
    if (!confirm(t('filament.price_alert_delete_confirm'))) return;
    await fetch('/api/price-alerts/' + id, { method: 'DELETE' });
    _loadPriceWatch();
  };

  async function _loadRestockSuggestions() {
    const container = document.getElementById('restock-container');
    if (!container) return;
    try {
      const res = await fetch('/api/inventory/restock?days=30');
      const data = await res.json();
      if (!data || data.length === 0) {
        container.innerHTML = `<p class="text-muted text-sm">${t('filament.restock_none')}</p>`;
        return;
      }

      // Hero summary
      const critical = data.filter(s => s.urgency === 'critical').length;
      const high = data.filter(s => s.urgency === 'high').length;
      const medium = data.filter(s => s.urgency === 'medium').length;
      const totalCost = data.reduce((s, d) => s + (d.est_cost || 0), 0);
      const totalSpools = data.reduce((s, d) => s + (d.spools_to_order || 0), 0);

      let h = '<div class="fil-hero-grid" style="margin-bottom:12px">';
      h += heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>', critical, t('filament.restock_critical') || 'Kritisk', '#f85149');
      h += heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>', high, t('filament.restock_high') || 'Haster', '#f0883e');
      h += heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', medium, t('filament.restock_medium') || 'Middels', '#d29922');
      h += heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>', totalSpools + ' ' + (t('filament.spools') || 'spoler'), t('filament.restock_to_order') || 'Bestilles', '#58a6ff');
      if (totalCost > 0) h += heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>', '~' + Math.round(totalCost), t('filament.restock_est_cost') || 'Est. kostnad', '#a371f7');
      h += '</div>';

      h += `<table class="fil-drying-presets-table"><thead><tr>
        <th></th>
        <th>${t('filament.profile_name')}</th>
        <th>${t('filament.filter_material')}</th>
        <th>${t('filament.restock_stock')}</th>
        <th>${t('filament.restock_days_left')}</th>
        <th>${t('filament.restock_order')}</th>
        <th>${t('filament.restock_urgency')}</th>
      </tr></thead><tbody>`;
      for (const s of data) {
        const colorDot = s.color_hex ? `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#${s.color_hex};border:1px solid var(--border-color)"></span>` : '';
        const urgencyColors = { critical: '#f85149', high: '#f0883e', medium: '#d29922', low: '#58a6ff' };
        const uColor = urgencyColors[s.urgency] || '#8b949e';
        // Progress bar showing remaining stock vs needed
        const stockPct = s.needed_g > 0 ? Math.min(100, Math.round(s.current_stock_g / s.needed_g * 100)) : 100;
        const barColor = stockPct > 60 ? 'var(--accent-green)' : stockPct > 30 ? '#d29922' : '#f85149';
        h += `<tr>
          <td>${colorDot}</td>
          <td>${esc(s.profile_name || '?')} ${s.vendor_name ? '<span class="text-muted">(' + esc(s.vendor_name) + ')</span>' : ''}</td>
          <td>${esc(s.material || '')}</td>
          <td>
            <div style="font-size:0.78rem">${s.current_stock_g}g <span class="text-muted">(${s.current_spool_count})</span></div>
            <div style="width:60px;height:4px;background:var(--bg-tertiary);border-radius:2px;margin-top:2px"><div style="width:${stockPct}%;height:100%;background:${barColor};border-radius:2px"></div></div>
          </td>
          <td style="color:${s.days_until_out != null && s.days_until_out <= 14 ? uColor : ''};font-weight:${s.days_until_out != null && s.days_until_out <= 7 ? '700' : '400'}">${s.days_until_out != null ? s.days_until_out + 'd' : '-'}</td>
          <td>${s.spools_to_order > 0 ? `<strong>${s.spools_to_order}</strong> ${t('filament.spools') || 'spoler'}${s.est_cost ? ` <span class="text-muted">(~${Math.round(s.est_cost)})</span>` : ''}` : '-'}</td>
          <td><span style="background:${uColor};color:#fff;padding:1px 8px;border-radius:4px;font-size:0.7rem;text-transform:uppercase">${t('filament.urgency_' + s.urgency) || s.urgency}</span></td>
        </tr>`;
      }
      h += '</tbody></table>';
      container.innerHTML = h;
    } catch (e) { container.innerHTML = `<p class="text-muted">Error: ${e.message}</p>`; }
  }

  async function _loadUsagePredictions() {
    const container = document.getElementById('usage-predictions-container');
    if (!container) return;
    try {
      const res = await fetch('/api/inventory/predictions');
      const data = await res.json();
      if (!data.per_spool || data.per_spool.length === 0) {
        container.innerHTML = `<p class="text-muted text-sm">${t('filament.no_usage_data')}</p>`;
        return;
      }
      const active = data.per_spool.filter(s => s.avg_daily_g > 0);
      if (active.length === 0) {
        container.innerHTML = `<p class="text-muted text-sm">${t('filament.no_usage_data')}</p>`;
        return;
      }

      // Hero summary
      const totalRemaining = active.reduce((s, d) => s + d.remaining_weight_g, 0);
      const totalDailyUsage = data.by_material?.reduce((s, m) => s + m.avg_daily_g, 0) || 0;
      const needsReorder = active.filter(s => s.needs_reorder).length;
      const avgDaysLeft = active.length > 0 ? Math.round(active.reduce((s, d) => s + (d.days_until_empty || 0), 0) / active.length) : 0;
      const closestEmpty = active.reduce((min, s) => s.days_until_empty != null && s.days_until_empty < min ? s.days_until_empty : min, 999);

      let h = '<div class="fil-hero-grid" style="margin-bottom:12px">';
      h += heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>', Math.round(totalDailyUsage) + 'g/d', t('filament.daily_usage') || 'Daglig forbruk', '#1279ff');
      h += heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', closestEmpty < 999 ? closestEmpty + 'd' : '--', t('filament.next_empty') || 'Tidligst tom', closestEmpty <= 7 ? '#f85149' : closestEmpty <= 14 ? '#f0883e' : '#00e676');
      h += heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/></svg>', Math.round(totalRemaining) + 'g', t('filament.total_remaining') || 'Totalt igjen', '#00e676');
      h += heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>', needsReorder, t('filament.needs_reorder_count') || 'Trenger bestilling', needsReorder > 0 ? '#f0883e' : '#8b949e');
      h += heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>', active.length, t('filament.active_spools') || 'Aktive spoler', '#a371f7');
      h += '</div>';

      // Material usage summary cards
      if (data.by_material && data.by_material.length > 0) {
        h += '<div class="auto-grid auto-grid--md" style="margin-bottom:12px">';
        for (const m of data.by_material) {
          const matColor = m.material === 'PLA' ? '#4ade80' : m.material === 'PETG' ? '#60a5fa' : m.material === 'ABS' ? '#f97316' : m.material === 'TPU' ? '#c084fc' : '#8b949e';
          h += `<div style="background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:var(--radius);padding:10px 14px;display:flex;align-items:center;justify-content:space-between">
            <div>
              <div style="font-weight:700;font-size:0.9rem;color:${matColor}">${esc(m.material)}</div>
              <div class="text-muted" style="font-size:0.7rem">${m.active_days} ${t('filament.active_days') || 'aktive dager'}</div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:700;font-size:0.9rem">${m.avg_daily_g}g/d</div>
              <div class="text-muted" style="font-size:0.7rem">${Math.round(m.total_used_g)}g ${t('filament.total_used') || 'totalt brukt'}</div>
            </div>
          </div>`;
        }
        h += '</div>';
      }

      // Per-spool table
      h += `<table class="fil-drying-presets-table"><thead><tr>
        <th></th>
        <th>${t('filament.profile_name')}</th>
        <th>${t('filament.filter_material')}</th>
        <th>${t('filament.remaining_weight')}</th>
        <th>${t('filament.avg_daily_usage')}</th>
        <th>${t('filament.days_until_empty')}</th>
        <th></th>
      </tr></thead><tbody>`;
      for (const s of active) {
        const daysColor = s.days_until_empty != null && s.days_until_empty <= 7 ? '#f85149' : s.days_until_empty != null && s.days_until_empty <= 14 ? '#f0883e' : '';
        const reorderBadge = s.needs_reorder ? `<span style="background:${s.days_until_empty <= 7 ? '#f85149' : '#f0883e'};color:#fff;padding:1px 6px;border-radius:4px;font-size:0.7rem">${s.days_until_empty <= 7 ? (t('filament.urgency_critical') || 'Kritisk') : (t('filament.needs_reorder') || 'Bestill')}</span>` : '';
        const colorDot = s.color_hex ? `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#${s.color_hex};border:1px solid var(--border-color)"></span>` : '';
        // Weight bar
        const maxW = Math.max(...active.map(a => a.remaining_weight_g));
        const wPct = Math.round(s.remaining_weight_g / maxW * 100);
        h += `<tr>
          <td>${colorDot}</td>
          <td>${esc(s.profile_name || '?')} ${s.vendor_name ? '<span class="text-muted">(' + esc(s.vendor_name) + ')</span>' : ''}</td>
          <td>${esc(s.material || '')}</td>
          <td>
            <div style="font-size:0.78rem">${Math.round(s.remaining_weight_g)}g</div>
            <div style="width:50px;height:3px;background:var(--bg-tertiary);border-radius:2px;margin-top:2px"><div style="width:${wPct}%;height:100%;background:var(--accent-blue);border-radius:2px"></div></div>
          </td>
          <td style="font-weight:600">${s.avg_daily_g}g/d</td>
          <td style="color:${daysColor};font-weight:${s.needs_reorder ? '700' : '400'}">${s.days_until_empty != null ? s.days_until_empty + 'd' : '-'}</td>
          <td>${reorderBadge}</td>
        </tr>`;
      }
      h += '</tbody></table>';

      // Forecast chart
      h += '<div class="card" style="margin-top:12px">';
      h += `<div class="card-title">${t('forecast.chart_title') || '30-dagers prognose'}</div>`;
      h += '<div id="forecast-chart-container"></div>';
      h += '</div>';

      container.innerHTML = h;
      setTimeout(() => _renderForecastChart(data), 50);
    } catch (e) { container.innerHTML = `<p class="text-muted">Error: ${e.message}</p>`; }
  }

  async function _loadCostEstimation() {
    const container = document.getElementById('cost-estimation-container');
    if (!container) return;
    try {
      const res = await fetch('/api/history');
      const history = await res.json();
      const completed = history.filter(r => r.status === 'completed' && r.filament_used_g > 0);
      if (completed.length === 0) {
        container.innerHTML = `<p class="text-muted text-sm">${t('filament.no_usage_data')}</p>`;
        return;
      }
      let totalFilament = 0, totalElectricity = 0, totalDepreciation = 0, totalCost = 0;
      const byMaterial = {};
      const rows = [];
      for (const r of completed.slice(0, 50)) {
        try {
          const params = new URLSearchParams({ filament_g: r.filament_used_g, duration_s: r.duration_seconds || 0 });
          const cRes = await fetch('/api/inventory/cost-estimate?' + params);
          const cost = await cRes.json();
          totalFilament += cost.filament_cost;
          totalElectricity += cost.electricity_cost;
          totalDepreciation += cost.depreciation_cost;
          totalCost += cost.total_cost;
          const mat = r.filament_type || 'Unknown';
          if (!byMaterial[mat]) byMaterial[mat] = { count: 0, cost: 0 };
          byMaterial[mat].count++;
          byMaterial[mat].cost += cost.total_cost;
          rows.push({ name: r.filename, cost: cost.total_cost });
        } catch {}
      }
      let h = `<div class="fil-health-legend" style="gap:12px;margin-bottom:8px">
        <span><strong>${t('filament.filament_cost')}:</strong> ${formatCurrency(totalFilament)}</span>
        <span><strong>${t('filament.electricity_cost')}:</strong> ${formatCurrency(totalElectricity)}</span>
        <span><strong>${t('filament.depreciation_cost')}:</strong> ${formatCurrency(totalDepreciation)}</span>
        <span style="font-weight:700"><strong>${t('filament.total_cost')}:</strong> ${formatCurrency(totalCost)}</span>
      </div>`;
      const mats = Object.entries(byMaterial).sort((a, b) => b[1].cost - a[1].cost);
      if (mats.length > 0) {
        h += `<div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">`;
        h += mats.map(([m, d]) => `${m}: ${formatCurrency(d.cost)} (${d.count})`).join(' · ');
        h += '</div>';
      }
      container.innerHTML = h;
    } catch (e) { container.innerHTML = `<p class="text-muted">Error: ${e.message}</p>`; }
  }

  window.showStartDryingDialog = function(spoolId) {
    const spool = _spools.find(s => s.id === spoolId);
    if (!spool) return;
    const preset = _dryingPresets.find(p => p.material === spool.material);
    const cleanName = _cleanProfileName(spool);
    const cancelAction = `closeDryingDialog()`;
    const formHtml = `
      <div class="ctrl-card" style="margin-bottom:12px">
        <div class="ctrl-card-title">${t('filament.start_drying')} — ${esc(cleanName)}</div>
        <div class="form-grid" style="grid-template-columns:1fr 1fr;gap:8px">
          <label class="form-label">${t('filament.drying_temp')}
            <input class="form-input form-input-sm" type="number" id="dry-temp" value="${preset?.temperature || 50}" min="30" max="120">
          </label>
          <label class="form-label">${t('filament.drying_duration')}
            <input class="form-input form-input-sm" type="number" id="dry-duration" value="${preset?.duration_minutes || 240}" min="30" max="1440">
          </label>
          <label class="form-label">${t('filament.drying_method')}
            <select class="form-input form-input-sm" id="dry-method">
              <option value="dryer_box">${t('filament.drying_method_dryer_box')}</option>
              <option value="ams_drying">${t('filament.drying_method_ams')}</option>
              <option value="oven">${t('filament.drying_method_oven')}</option>
              <option value="other">${t('filament.drying_method_other')}</option>
            </select>
          </label>
          <label class="form-label">${t('filament.drying_humidity_before')}
            <input class="form-input form-input-sm" type="number" id="dry-humidity" step="0.1" min="0" max="100" placeholder="Optional">
          </label>
          <label class="form-label" style="grid-column:1/-1">${t('filament.drying_notes')}
            <input class="form-input form-input-sm" type="text" id="dry-notes" placeholder="Optional">
          </label>
        </div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="form-btn" data-ripple onclick="submitStartDrying(${spoolId})">${t('filament.start_drying')}</button>
          <button class="form-btn form-btn-sm" data-ripple onclick="${cancelAction}">${t('common.cancel')}</button>
        </div>
      </div>`;

    const formContainer = document.getElementById('inv-global-form');
    if (formContainer) {
      formContainer.style.display = 'block';
      formContainer.innerHTML = formHtml;
      formContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    // Fallback: open in modal overlay (visual card view)
    const overlay = document.createElement('div');
    overlay.className = 'inv-modal-overlay';
    overlay.id = 'drying-modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="inv-modal" style="max-width:500px">
      <div class="inv-modal-header">
        <span>${t('filament.start_drying')} — ${esc(cleanName)}</span>
        <button class="inv-modal-close" onclick="this.closest('.inv-modal-overlay').remove()">&times;</button>
      </div>
      <div style="padding:12px">${formHtml}</div>
    </div>`;
    document.body.appendChild(overlay);
  };

  window.closeDryingDialog = function() {
    const c = document.getElementById('inv-global-form');
    if (c) { c.style.display = 'none'; return; }
    const m = document.getElementById('drying-modal-overlay');
    if (m) m.remove();
  };

  window.submitStartDrying = async function(spoolId) {
    const temp = parseInt(document.getElementById('dry-temp')?.value || '50');
    const duration = parseInt(document.getElementById('dry-duration')?.value || '240');
    const method = document.getElementById('dry-method')?.value || 'dryer_box';
    const humidity = parseFloat(document.getElementById('dry-humidity')?.value) || null;
    const notes = document.getElementById('dry-notes')?.value || null;

    try {
      const res = await fetch('/api/inventory/drying/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spool_id: spoolId, temperature: temp, duration_minutes: duration, method, humidity_before: humidity, notes })
      });
      if (!res.ok) throw new Error('Failed');
      closeDryingDialog();
      loadFilament();
    } catch (e) { showToast(e.message, 'error'); }
  };

  window.completeDryingItem = async function(sessionId) {
    const humidityAfter = prompt(t('filament.drying_humidity_after'));
    try {
      const res = await fetch(`/api/inventory/drying/sessions/${sessionId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ humidity_after: humidityAfter ? parseFloat(humidityAfter) : null })
      });
      if (!res.ok) throw new Error('Failed');
      loadFilament();
    } catch (e) { showToast(e.message, 'error'); }
  };

  window.deleteDryingItem = function(sessionId) {
    return confirmAction(t('common.delete_confirm'), async () => {
      try {
        await fetch(`/api/inventory/drying/sessions/${sessionId}`, { method: 'DELETE' });
        loadFilament();
      } catch (e) { showToast(e.message, 'error'); }
    }, { danger: true });
  };

  window.showAddDryingPresetForm = function() {
    const container = document.getElementById('drying-presets-form');
    if (!container) return;
    container.style.display = 'block';
    container.innerHTML = `
      <div class="form-grid" style="grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-bottom:8px">
        <label class="form-label">${t('filament.filter_material')}
          <input class="form-input form-input-sm" type="text" id="preset-material" placeholder="e.g. PLA">
        </label>
        <label class="form-label">${t('filament.drying_temp')}
          <input class="form-input form-input-sm" type="number" id="preset-temp" value="50" min="30" max="120">
        </label>
        <label class="form-label">${t('filament.drying_duration')}
          <input class="form-input form-input-sm" type="number" id="preset-duration" value="240" min="30" max="1440">
        </label>
        <label class="form-label">${t('filament.drying_max_days')}
          <input class="form-input form-input-sm" type="number" id="preset-maxdays" value="30" min="1" max="365">
        </label>
      </div>
      <div style="display:flex;gap:8px">
        <button class="form-btn" data-ripple onclick="submitDryingPreset()">${t('common.save')}</button>
        <button class="form-btn form-btn-sm" data-ripple onclick="document.getElementById('drying-presets-form').style.display='none'">${t('common.cancel')}</button>
      </div>`;
  };

  window.editDryingPreset = function(material) {
    const preset = _dryingPresets.find(p => p.material === material);
    if (!preset) return;
    const container = document.getElementById('drying-presets-form');
    if (!container) return;
    container.style.display = 'block';
    container.innerHTML = `
      <div class="form-grid" style="grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-bottom:8px">
        <label class="form-label">${t('filament.filter_material')}
          <input class="form-input form-input-sm" type="text" id="preset-material" value="${esc(material)}" readonly>
        </label>
        <label class="form-label">${t('filament.drying_temp')}
          <input class="form-input form-input-sm" type="number" id="preset-temp" value="${preset.temperature}" min="30" max="120">
        </label>
        <label class="form-label">${t('filament.drying_duration')}
          <input class="form-input form-input-sm" type="number" id="preset-duration" value="${preset.duration_minutes}" min="30" max="1440">
        </label>
        <label class="form-label">${t('filament.drying_max_days')}
          <input class="form-input form-input-sm" type="number" id="preset-maxdays" value="${preset.max_days_without_drying || 30}" min="1" max="365">
        </label>
      </div>
      <div style="display:flex;gap:8px">
        <button class="form-btn" data-ripple onclick="submitDryingPreset()">${t('common.save')}</button>
        <button class="form-btn form-btn-sm" data-ripple onclick="document.getElementById('drying-presets-form').style.display='none'">${t('common.cancel')}</button>
      </div>`;
  };

  window.submitDryingPreset = async function() {
    const material = document.getElementById('preset-material')?.value?.trim();
    const temperature = parseInt(document.getElementById('preset-temp')?.value || '50');
    const duration_minutes = parseInt(document.getElementById('preset-duration')?.value || '240');
    const max_days_without_drying = parseInt(document.getElementById('preset-maxdays')?.value || '30');
    if (!material) return;
    try {
      const res = await fetch(`/api/inventory/drying/presets/${encodeURIComponent(material)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temperature, duration_minutes, max_days_without_drying })
      });
      if (!res.ok) throw new Error('Failed');
      document.getElementById('drying-presets-form').style.display = 'none';
      loadFilament();
    } catch (e) { showToast(e.message, 'error'); }
  };

  window.deleteDryingPresetItem = function(material) {
    return confirmAction(t('filament.drying_preset_delete'), async () => {
      try {
        await fetch(`/api/inventory/drying/presets/${encodeURIComponent(material)}`, { method: 'DELETE' });
        loadFilament();
      } catch (e) { showToast(e.message, 'error'); }
    }, { danger: true });
  };

  // ═══ Checked-out spools ═══
  async function _loadCheckedOut() {
    const el = document.getElementById('checked-out-container');
    if (!el) return;
    try {
      const res = await fetch('/api/inventory/checked-out');
      const spools = await res.json();
      if (!spools.length) { el.innerHTML = `<p class="text-muted" style="font-size:0.8rem;padding:8px 0">${t('filament.no_checked_out')}</p>`; return; }
      let h = '<div class="fil-checkout-list">';
      for (const s of spools) {
        const color = hexToRgb(s.color_hex);
        h += `<div class="fil-checkout-item">
          ${miniSpool(color, 16)}
          <div class="fil-checkout-info">
            <strong>${esc(s.profile_name || s.material || '--')}</strong>
            <span class="text-muted" style="font-size:0.75rem">${s.checked_out_by ? t('filament.checked_out_by') + ': ' + esc(s.checked_out_by) : ''} ${s.checked_out_from ? '· ' + esc(s.checked_out_from) : ''}</span>
          </div>
          <button class="form-btn form-btn-sm" data-ripple onclick="checkinSpoolItem(${s.id})">${t('filament.checkin')}</button>
        </div>`;
      }
      h += '</div>';
      el.innerHTML = h;
    } catch { el.innerHTML = '<span class="text-muted">Error</span>'; }
  }

  window.checkoutSpoolItem = async function(id) {
    const actor = prompt(t('filament.checkout_actor'));
    if (actor === null) return;
    try {
      await fetch(`/api/inventory/spools/${id}/checkout`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: actor || undefined })
      });
      loadFilament();
    } catch (e) { showToast(e.message, 'error'); }
  };

  window.checkinSpoolItem = async function(id) {
    try {
      await fetch(`/api/inventory/spools/${id}/checkin`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      loadFilament();
    } catch (e) { showToast(e.message, 'error'); }
  };

  // ═══ Tools Dashboard Sub-tabs ═══
  window._switchToolsSubTab = function(tab) {
    _toolsSubTab = tab;
    document.querySelectorAll('#tools-sub-content').length; // ensure dom ready
    document.querySelectorAll('.drying-sub-tab').forEach(b => {
      const parent = b.closest('[id]');
      if (parent && parent.id !== 'tools-sub-content') return; // only tools tabs
    });
    // Re-render tabs active state
    const container = document.getElementById('tools-sub-content')?.closest('.stats-module');
    if (container) {
      container.querySelectorAll('.drying-sub-tab').forEach(b => {
        const isActive = b.textContent.trim() === ({
          spools: t('filament.tools_sub_spools'),
          colors: t('filament.color_card'),
          tags: t('filament.nfc_manager'),
          reference: t('filament.material_reference')
        })[tab];
        b.classList.toggle('active', isActive);
      });
    }
    _renderToolsSubContent();
  };

  function _renderToolsSubContent() {
    const el = document.getElementById('tools-sub-content');
    if (!el) return;
    if (_toolsSubTab === 'spools') {
      el.innerHTML = `<div class="ctrl-card-title" style="display:flex;align-items:center;justify-content:space-between">
        <span style="display:flex;align-items:center;gap:6px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          ${t('filament.checked_out_spools')}
        </span>
      </div>
      <div id="checked-out-container"><span class="text-muted text-sm">Loading...</span></div>
      <div class="ctrl-card-title" style="margin-top:16px">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        ${t('filament.spool_timeline')}
      </div>
      <div id="timeline-container"><span class="text-muted text-sm">Loading...</span></div>`;
      _loadCheckedOut();
      _loadTimeline();
    } else if (_toolsSubTab === 'colors') {
      el.innerHTML = `<div class="ctrl-card-title" style="display:flex;align-items:center;justify-content:space-between">
        <span style="display:flex;align-items:center;gap:6px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2"/><circle cx="8" cy="8" r="2"/><circle cx="16" cy="8" r="2"/><circle cx="8" cy="16" r="2"/><circle cx="16" cy="16" r="2"/></svg>
          ${t('filament.color_card')}
        </span>
        <div id="color-card-actions" style="display:none;gap:4px">
          <button class="form-btn form-btn-sm" data-ripple onclick="exportColorCard()">${t('filament.color_card_export')}</button>
          <button class="form-btn form-btn-sm" data-ripple onclick="sharePalette()" style="display:flex;align-items:center;gap:4px">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            ${t('filament.share_palette')}
          </button>
        </div>
      </div>
      <div id="color-card-container"><span class="text-muted text-sm">Loading...</span></div>`;
      _loadColorCard();
    } else if (_toolsSubTab === 'tags') {
      el.innerHTML = `<div class="ctrl-card-title" style="display:flex;align-items:center;justify-content:space-between">
        <span style="display:flex;align-items:center;gap:6px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8.32a7.43 7.43 0 010 7.36"/><path d="M9.46 6.21a11.76 11.76 0 010 11.58"/><path d="M12.91 4.1a16.09 16.09 0 010 15.8"/><path d="M16.37 2a20.42 20.42 0 010 20"/></svg>
          ${t('filament.nfc_manager')}
        </span>
        <button class="form-btn form-btn-sm" data-ripple onclick="openTagScanner()">${t('filament.tag_scan')}</button>
      </div>
      <div id="nfc-container"><span class="text-muted text-sm">Loading...</span></div>`;
      _loadNfcMappings();
    } else if (_toolsSubTab === 'reference') {
      el.innerHTML = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        ${t('filament.material_reference')}
      </div>
      <div class="fil-matref-filter mb-sm">
        <select class="form-input form-input-sm" id="matref-category-filter" onchange="filterMaterials()">
          <option value="">All Categories</option>
          <option value="standard">Standard</option>
          <option value="engineering">Engineering</option>
          <option value="composite">Composite</option>
          <option value="flexible">Flexible</option>
          <option value="specialty">Specialty</option>
          <option value="support">Support</option>
          <option value="high-performance">High Performance</option>
        </select>
      </div>
      <div id="matref-container"><span class="text-muted text-sm">Loading...</span></div>`;
      _loadMaterials();
    } else if (_toolsSubTab === 'compat') {
      el.innerHTML = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
        ${t('filament.compatibility')}
      </div>
      <div id="compat-container"><span class="text-muted text-sm">Loading...</span></div>`;
      _loadCompatMatrix();
    } else if (_toolsSubTab === 'tempguide') {
      el.innerHTML = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>
        ${t('filament.temp_guide')}
      </div>
      <div id="tempguide-container"><span class="text-muted text-sm">Loading...</span></div>`;
      _loadTempGuide();
    }
  }

  // ═══ Temperature Guide ═══
  async function _loadTempGuide() {
    const el = document.getElementById('tempguide-container');
    if (!el) return;
    try {
      const res = await fetch('/api/inventory/temperature-guide');
      const data = await res.json();
      if (data.length === 0) { el.innerHTML = `<p class="text-muted">${t('filament.temp_guide_empty')}</p>`; return; }
      let h = '<div style="overflow-x:auto"><table class="compat-matrix"><thead><tr>';
      h += `<th>${t('filament.filter_material')}</th><th>${t('filament.nozzle_temp')} (°C)</th><th>${t('filament.bed_temp')} (°C)</th>`;
      h += `<th>${t('filament.temp_enclosure')}</th><th>${t('filament.temp_nozzle_rec')}</th><th>${t('filament.temp_tips')}</th></tr></thead><tbody>`;
      for (const r of data) {
        let tipsHtml = '—';
        if (r.tips) {
          try {
            const tp = typeof r.tips === 'string' ? JSON.parse(r.tips) : r.tips;
            const parts = [];
            if (tp.print) parts.push(`<b>${t('filament.tip_print')}:</b> ${tp.print}`);
            if (tp.storage) parts.push(`<b>${t('filament.tip_storage')}:</b> ${tp.storage}`);
            if (tp.post) parts.push(`<b>${t('filament.tip_post')}:</b> ${tp.post}`);
            tipsHtml = parts.length ? parts.join('<br>') : String(r.tips);
          } catch { tipsHtml = String(r.tips); }
        }
        h += `<tr>
          <td><b>${r.material}</b> <span class="text-muted">(${r.profile_count})</span></td>
          <td>${r.nozzle_min || '?'}–${r.nozzle_max || '?'}</td>
          <td>${r.bed_min || '?'}–${r.bed_max || '?'}</td>
          <td>${r.enclosure ? '✅' : '—'}</td>
          <td>${r.nozzle_recommendation || '—'}</td>
          <td style="max-width:300px;font-size:0.8em">${tipsHtml}</td>
        </tr>`;
      }
      h += '</tbody></table></div>';
      el.innerHTML = h;
    } catch { el.innerHTML = '<span class="text-muted">Error</span>'; }
  }

  // ═══ Compatibility Matrix ═══
  async function _loadCompatMatrix() {
    const el = document.getElementById('compat-container');
    if (!el) return;
    try {
      const res = await fetch('/api/inventory/compatibility');
      const rules = await res.json();
      if (rules.length === 0) { el.innerHTML = `<p class="text-muted">${t('filament.compat_empty')}</p>`; return; }
      const materials = [...new Set(rules.map(r => r.material))].sort();
      const plates = [...new Set(rules.map(r => r.plate_type))].sort();
      const icons = { good: '✅', fair: '⚠️', poor: '❌' };
      let h = '<div style="overflow-x:auto"><table class="compat-matrix"><thead><tr><th>' + t('filament.filter_material') + '</th>';
      for (const p of plates) h += `<th>${p.replace(/_/g, ' ')}</th>`;
      h += '</tr></thead><tbody>';
      for (const mat of materials) {
        h += `<tr><td><b>${mat}</b></td>`;
        for (const plate of plates) {
          const rule = rules.find(r => r.material === mat && r.plate_type === plate);
          if (rule) {
            h += `<td title="${rule.notes || ''}" class="compat-${rule.compatibility}">${icons[rule.compatibility] || '—'}</td>`;
          } else {
            h += '<td>—</td>';
          }
        }
        h += '</tr>';
      }
      h += '</tbody></table></div>';
      el.innerHTML = h;
    } catch { el.innerHTML = '<span class="text-muted">Error</span>'; }
  }

  // ═══ Color Card ═══
  async function _loadColorCard() {
    const el = document.getElementById('color-card-container');
    if (!el) return;
    try {
      const res = await fetch('/api/inventory/color-card');
      const grouped = await res.json();
      const materials = Object.keys(grouped).sort();
      const actions = document.getElementById('color-card-actions');
      if (materials.length === 0) {
        el.innerHTML = `<p class="text-muted" style="font-size:0.8rem;padding:8px 0">${t('filament.no_spools')}</p>`;
        if (actions) actions.style.display = 'none';
        return;
      }
      if (actions) actions.style.display = 'flex';
      let h = '<div class="fil-color-card" id="color-card-canvas-area">';
      for (const mat of materials) {
        h += `<div class="fil-color-group"><div class="fil-color-group-title">${esc(mat)}</div><div class="fil-color-swatches">`;
        for (const s of grouped[mat]) {
          const c = hexToRgb(s.color_hex);
          const pct = spoolPct(s) || 80;
          h += `<div class="fil-color-swatch-card" title="${esc(s.vendor_name || '')} ${esc(s.name || '')}\n${esc(s.color_name || '')}">
            ${typeof spoolIcon === 'function' ? spoolIcon(c, 48, pct) : `<div class="fil-color-swatch-big" style="background:${c}"></div>`}
            <div class="fil-color-swatch-name">${esc(s.color_name || s.name || '')}</div>
          </div>`;
        }
        h += '</div></div>';
      }
      h += '</div>';
      el.innerHTML = h;
    } catch { el.innerHTML = '<span class="text-muted">Error</span>'; }
  }

  window.exportColorCard = function() {
    const area = document.getElementById('color-card-canvas-area');
    if (!area) return;
    const win = window.open('', '_blank', 'width=800,height=600');
    win.document.write(`<html><head><title>${t('filament.color_card')}</title><style>
      body{font-family:sans-serif;padding:20px;background:#fff;color:#333}
      .fil-color-group{margin-bottom:16px}
      .fil-color-group-title{font-weight:bold;font-size:14px;margin-bottom:8px;border-bottom:1px solid #ddd;padding-bottom:4px}
      .fil-color-swatches{display:flex;flex-wrap:wrap;gap:8px}
      .fil-color-swatch-card{text-align:center;width:60px}
      .fil-color-swatch-big{width:48px;height:48px;border-radius:6px;margin:0 auto 4px}
      .fil-color-swatch-name{font-size:9px;word-break:break-word}
      @media print{@page{margin:10mm}}
    </style></head><body>${area.innerHTML}</body></html>`);
    win.document.close();
    win.print();
  };

  window.sharePalette = async function() {
    try {
      const filters = {};
      if (_filterMaterial) filters.material = _filterMaterial;
      if (_filterVendor) filters.vendor = _filterVendor;
      if (_filterLocation) filters.location = _filterLocation;
      const res = await fetch('/api/inventory/palette/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: t('filament.color_card'), filters })
      });
      const data = await res.json();
      if (data.url) {
        const fullUrl = location.origin + data.url;
        try { await navigator.clipboard.writeText(fullUrl); } catch (_) {}
        showToast(t('filament.palette_shared') + ': ' + fullUrl, 'success');
      }
    } catch (e) {
      showToast(t('filament.load_failed'), 'error');
    }
  };

  // ═══ NFC Manager ═══
  async function _loadNfcMappings() {
    const el = document.getElementById('nfc-container');
    if (!el) return;
    try {
      const res = await fetch('/api/nfc/mappings');
      const mappings = await res.json();
      if (!mappings.length) {
        el.innerHTML = `<p class="text-muted" style="font-size:0.8rem;padding:8px 0">${t('filament.nfc_no_mappings')}</p>`;
        return;
      }
      let h = '<div class="fil-nfc-list">';
      for (const m of mappings) {
        const color = m.color_hex ? hexToRgb(m.color_hex) : '#888';
        h += `<div class="fil-nfc-item">
          ${miniSpool(color, 16)}
          <div class="fil-nfc-info">
            <strong>${esc(m.spool_name || t('filament.nfc_unlinked'))}</strong>
            <span class="text-muted" style="font-size:0.75rem">UID: ${esc(m.tag_uid)} · ${esc(m.standard || 'openspool')}</span>
          </div>
          <button class="filament-delete-btn" style="opacity:1" onclick="unlinkNfcItem('${esc(m.tag_uid)}')" title="${t('settings.delete')}" data-tooltip="${t('settings.delete')}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>`;
      }
      h += '</div>';
      el.innerHTML = h;
    } catch { el.innerHTML = '<span class="text-muted">Error</span>'; }
  }

  // ── Multi-method Tag Scanner ──
  let _tagScannerStream = null;
  let _tagScannerNdef = null;
  let _tagScannerWedgeTimer = null;

  window.openTagScanner = function() {
    const hasNfc = 'NDEFReader' in window;
    const methods = [];
    if (hasNfc) methods.push({ id: 'nfc', label: t('filament.tag_method_nfc') });
    methods.push({ id: 'camera', label: t('filament.tag_method_camera') });
    methods.push({ id: 'usb', label: t('filament.tag_method_usb') });
    methods.push({ id: 'manual', label: t('filament.tag_method_manual') });

    const tabs = methods.map((m, i) =>
      `<button class="tag-scanner-tab${i === 0 ? ' active' : ''}" data-method="${m.id}" onclick="window._tagSwitchTab('${m.id}')">${m.label}</button>`
    ).join('');

    const overlay = document.createElement('div');
    overlay.className = 'inv-modal-overlay';
    overlay.id = 'tag-scanner-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) window.closeTagScanner(); };
    overlay.innerHTML = `<div class="inv-modal" style="max-width:440px">
      <div class="inv-modal-header">
        <span>${t('filament.tag_scanner')}</span>
        <button class="inv-modal-close" onclick="closeTagScanner()">&times;</button>
      </div>
      <div class="tag-scanner-tabs">${tabs}</div>
      <div id="tag-scanner-body" style="padding:16px;min-height:180px"></div>
      <div id="tag-scanner-result" style="padding:0 16px 16px"></div>
    </div>`;
    document.body.appendChild(overlay);
    window._tagSwitchTab(methods[0].id);
  };

  window._tagSwitchTab = function(method) {
    // Clean up previous method
    _tagCleanupMethod();
    // Update tab active state
    document.querySelectorAll('.tag-scanner-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.method === method);
    });
    const body = document.getElementById('tag-scanner-body');
    const result = document.getElementById('tag-scanner-result');
    if (!body) return;
    if (result) result.innerHTML = '';

    if (method === 'nfc') {
      body.innerHTML = `<div style="text-align:center;padding:16px 0">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" stroke-width="1.5"><path d="M6 8.32a7.43 7.43 0 010 7.36"/><path d="M9.46 6.21a11.76 11.76 0 010 11.58"/><path d="M12.91 4.1a16.09 16.09 0 010 15.8"/><path d="M16.37 2a20.42 20.42 0 010 20"/></svg>
        <p style="margin-top:12px">${t('filament.nfc_hold_tag')}</p>
        <p class="text-muted" style="font-size:0.75rem">${t('filament.nfc_scanning')}...</p>
      </div>`;
      _tagStartNfc();
    } else if (method === 'camera') {
      body.innerHTML = `<div style="position:relative">
        <video id="tag-scanner-video" style="width:100%;border-radius:6px;background:#000" autoplay playsinline></video>
        <canvas id="tag-scanner-canvas" style="display:none"></canvas>
      </div>
      <p class="text-muted" style="font-size:0.75rem;text-align:center;margin-top:8px">${t('filament.scanning')}</p>`;
      _tagStartCamera();
    } else if (method === 'usb') {
      body.innerHTML = `<div style="text-align:center;padding:16px 0">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" stroke-width="1.5"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><circle cx="12" cy="16" r="2"/></svg>
        <p style="margin-top:12px;font-size:0.85rem">${t('filament.tag_usb_hint')}</p>
        <input type="text" id="tag-usb-input" class="form-input" style="margin-top:12px;text-align:center;font-family:monospace;font-size:1.1rem;letter-spacing:1px" autofocus placeholder="${t('filament.tag_usb_placeholder')}">
      </div>`;
      setTimeout(() => {
        const inp = document.getElementById('tag-usb-input');
        if (inp) {
          inp.focus();
          inp.addEventListener('input', () => {
            clearTimeout(_tagScannerWedgeTimer);
            if (inp.value.length >= 4) {
              _tagScannerWedgeTimer = setTimeout(() => {
                const uid = inp.value.trim();
                if (uid) _handleScannedTag(uid);
              }, 500);
            }
          });
          inp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              clearTimeout(_tagScannerWedgeTimer);
              const uid = inp.value.trim();
              if (uid) _handleScannedTag(uid);
            }
          });
        }
      }, 50);
    } else if (method === 'manual') {
      body.innerHTML = `<div style="padding:8px 0">
        <p style="font-size:0.85rem;margin-bottom:12px">${t('filament.tag_manual_hint')}</p>
        <div style="display:flex;gap:8px">
          <input type="text" id="tag-manual-input" class="form-input" style="flex:1;font-family:monospace" placeholder="${t('filament.tag_manual_placeholder')}">
          <button class="form-btn form-btn-sm" data-ripple onclick="window._tagManualLookup()">${t('filament.nfc_link')}</button>
        </div>
      </div>`;
      setTimeout(() => { const inp = document.getElementById('tag-manual-input'); if (inp) inp.focus(); }, 50);
    }
  };

  window._tagManualLookup = function() {
    const inp = document.getElementById('tag-manual-input');
    const uid = inp?.value?.trim();
    if (!uid) return;
    _handleScannedTag(uid);
  };

  async function _tagStartNfc() {
    try {
      _tagScannerNdef = new NDEFReader();
      await _tagScannerNdef.scan();
      _tagScannerNdef.onreading = (event) => {
        const uid = event.serialNumber || 'unknown';
        _handleScannedTag(uid);
      };
    } catch (e) {
      showToast(t('filament.nfc_error') + ': ' + e.message, 'error');
    }
  }

  async function _tagStartCamera() {
    const video = document.getElementById('tag-scanner-video');
    const canvas = document.getElementById('tag-scanner-canvas');
    if (!video || !canvas) return;
    try {
      _tagScannerStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      video.srcObject = _tagScannerStream;
      video.play();
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const startScan = () => _tagScanFrame(video, canvas, ctx);
      if (typeof jsQR === 'undefined') {
        const script = document.createElement('script');
        script.src = '/js/lib/jsqr.min.js';
        script.onload = startScan;
        script.onerror = () => showToast(t('filament.qr_lib_failed'), 'error');
        document.head.appendChild(script);
      } else {
        startScan();
      }
    } catch {
      const body = document.getElementById('tag-scanner-body');
      if (body) body.innerHTML = `<p class="text-muted" style="padding:24px;text-align:center">${t('filament.camera_denied')}</p>`;
    }
  }

  function _tagScanFrame(video, canvas, ctx) {
    if (!document.getElementById('tag-scanner-overlay')) return;
    if (!_tagScannerStream) return;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
      if (code && code.data) {
        // Parse as spool URL or raw UID
        const spoolMatch = code.data.match(/#filament\/spool\/(\d+)/);
        if (spoolMatch) {
          const spoolId = parseInt(spoolMatch[1]);
          const spool = _spools.find(s => s.id === spoolId);
          if (spool) {
            _tagCleanupMethod();
            closeTagScanner();
            showEditSpoolForm(spoolId);
            return;
          }
        }
        // Try as NFC UID
        _handleScannedTag(code.data);
        return;
      }
    }
    requestAnimationFrame(() => _tagScanFrame(video, canvas, ctx));
  }

  async function _handleScannedTag(uid) {
    const resultEl = document.getElementById('tag-scanner-result');
    if (!resultEl) return;
    resultEl.innerHTML = `<div style="padding:12px;background:var(--bg-secondary);border-radius:8px;text-align:center">
      <span class="text-muted">${t('filament.scanning')}...</span>
    </div>`;
    try {
      const res = await fetch(`/api/nfc/lookup/${encodeURIComponent(uid)}`);
      if (res.ok) {
        const tag = await res.json();
        const color = tag.color_hex ? hexToRgb(tag.color_hex) : '#888';
        resultEl.innerHTML = `<div style="padding:12px;background:var(--bg-secondary);border-radius:8px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
            ${typeof spoolIcon === 'function' ? spoolIcon(color, 28) : `<span class="filament-color-swatch" style="background:${color};width:24px;height:24px"></span>`}
            <div>
              <strong>${esc(tag.spool_name || 'Unknown')}</strong><br>
              <span class="text-muted text-sm">${esc(tag.material || '')} · ${esc(tag.vendor_name || '')}</span>
            </div>
          </div>
          <span class="text-muted" style="font-size:0.75rem">UID: ${esc(uid)}${tag.standard ? ` · ${esc(tag.standard)}` : ''}</span>
          ${'NDEFReader' in window ? `<button class="form-btn form-btn-sm" data-ripple style="margin-top:6px" onclick="window._nfcWriteToTag(${tag.spool_id})">${t('filament.nfc_write_to_tag')}</button>` : ''}
        </div>`;
      } else {
        // Build spool options for linking
        let spoolOpts = `<option value="">${t('filament.tag_select_spool')}</option>`;
        for (const s of _spools) {
          const name = s.profile_name || s.material || `Spool #${s.id}`;
          const vendor = s.vendor_name ? ` (${s.vendor_name})` : '';
          spoolOpts += `<option value="${s.id}">${esc(name)}${esc(vendor)}</option>`;
        }
        resultEl.innerHTML = `<div style="padding:12px;background:var(--bg-secondary);border-radius:8px">
          <p style="margin-bottom:8px">${t('filament.tag_not_found')}</p>
          <span class="text-muted" style="font-size:0.75rem">UID: ${esc(uid)}</span>
          <div style="margin-top:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <select id="tag-link-spool-select" class="form-input" style="flex:1;min-width:120px">${spoolOpts}</select>
            <select id="tag-link-standard" class="form-input" style="width:100px">
              <option value="openspool">${t('filament.nfc_standard_openspool')}</option>
              <option value="bambu">${t('filament.nfc_standard_bambu')}</option>
              <option value="ntag">${t('filament.nfc_standard_ntag')}</option>
            </select>
            <button class="form-btn form-btn-sm" data-ripple onclick="window._tagLinkSpool('${esc(uid)}')">${t('filament.tag_link_spool')}</button>
          </div>
        </div>`;
      }
    } catch {
      resultEl.innerHTML = `<span class="text-muted">Error</span>`;
    }
  }

  window._tagLinkSpool = async function(uid) {
    const select = document.getElementById('tag-link-spool-select');
    const spoolId = select?.value;
    if (!spoolId) return;
    const standard = document.getElementById('tag-link-standard')?.value || 'openspool';
    try {
      await fetch('/api/nfc/link', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag_uid: uid, spool_id: parseInt(spoolId), standard })
      });
      showToast(t('filament.tag_found'), 'success');
      closeTagScanner();
      loadFilament();
    } catch (e) { showToast(e.message, 'error'); }
  };

  // ═══ NFC Write ═══
  window._nfcWriteToTag = async function(spoolId) {
    if (!('NDEFReader' in window)) { showToast(t('filament.nfc_write_unsupported'), 'error'); return; }
    const spool = _spools.find(s => s.id === spoolId);
    if (!spool) return;
    const host = location.host;
    const proto = location.protocol;
    const url = `${proto}//${host}/#filament/spool/${spoolId}`;
    const statusEl = document.getElementById('tag-scanner-result');
    if (statusEl) statusEl.innerHTML = `<div style="padding:12px;background:var(--bg-secondary);border-radius:8px;text-align:center"><span class="text-muted">${t('filament.nfc_hold_to_write')}...</span></div>`;
    try {
      const writer = new NDEFReader();
      await writer.write({
        records: [
          { recordType: 'url', data: url },
          { recordType: 'text', data: `${spool.profile_name || spool.material || 'Spool'} #${spool.short_id || spoolId}` }
        ]
      });
      showToast(t('filament.nfc_write_success'), 'success');
      if (statusEl) statusEl.innerHTML = `<div style="padding:12px;background:var(--bg-secondary);border-radius:8px;text-align:center;color:var(--accent-green)">${t('filament.nfc_write_success')}</div>`;
    } catch (e) {
      showToast(t('filament.nfc_write_failed') + ': ' + e.message, 'error');
      if (statusEl) statusEl.innerHTML = `<div style="padding:12px;background:var(--bg-secondary);border-radius:8px;text-align:center;color:var(--accent-red)">${t('filament.nfc_write_failed')}: ${esc(e.message)}</div>`;
    }
  };

  function _tagCleanupMethod() {
    // Stop camera
    if (_tagScannerStream) {
      _tagScannerStream.getTracks().forEach(t => t.stop());
      _tagScannerStream = null;
    }
    // Stop NFC
    if (_tagScannerNdef) {
      _tagScannerNdef.onreading = null;
      _tagScannerNdef = null;
    }
    // Clear wedge timer
    clearTimeout(_tagScannerWedgeTimer);
  }

  window.closeTagScanner = function() {
    _tagCleanupMethod();
    const overlay = document.getElementById('tag-scanner-overlay');
    if (overlay) overlay.remove();
  };

  window.linkNfcToSpool = async function(uid) {
    // Legacy compat — opens tag scanner instead
    window.openTagScanner();
  };

  window.unlinkNfcItem = function(uid) {
    return confirmAction(t('filament.nfc_unlink_confirm'), async () => {
      try {
        await fetch(`/api/nfc/link/${encodeURIComponent(uid)}`, { method: 'DELETE' });
        loadFilament();
      } catch (e) { showToast(e.message, 'error'); }
    }, { danger: true });
  };

  // ═══ Spool Timeline ═══
  async function _loadTimeline() {
    const el = document.getElementById('timeline-container');
    if (!el) return;
    try {
      const res = await fetch('/api/inventory/events?limit=50');
      const events = await res.json();
      if (!events.length) { el.innerHTML = `<p class="text-muted" style="font-size:0.8rem;padding:8px 0">${t('filament.timeline_empty')}</p>`; return; }
      const eventIcons = {
        created: '&#x2795;', edited: '&#x270F;', used: '&#x1F4E6;', dried: '&#x1F4A7;',
        assigned: '&#x1F5A8;', unassigned: '&#x2B05;', archived: '&#x1F4E6;', unarchived: '&#x21A9;',
        checked_out: '&#x2197;', checked_in: '&#x2199;', empty: '&#x26A0;'
      };
      let h = '<div class="fil-timeline">';
      for (const ev of events) {
        const icon = eventIcons[ev.event_type] || '&#x2022;';
        const time = ev.timestamp ? new Date(ev.timestamp + 'Z').toLocaleString() : '';
        h += `<div class="fil-timeline-item">
          <div class="fil-timeline-dot">${icon}</div>
          <div class="fil-timeline-content">
            <div class="fil-timeline-header">
              <strong>${esc(ev.spool_name || 'Spool #' + ev.spool_id)}</strong>
              <span class="text-muted" style="font-size:0.7rem">${time}</span>
            </div>
            <div class="fil-timeline-event">${t('filament.event_' + ev.event_type, {}, ev.event_type)}</div>
            ${ev.actor ? `<span class="text-muted" style="font-size:0.7rem">${esc(ev.actor)}</span>` : ''}
          </div>
        </div>`;
      }
      h += '</div>';
      el.innerHTML = h;
    } catch { el.innerHTML = '<span class="text-muted">Error</span>'; }
  }

  // ═══ Spool Timeline Dialog (per spool) ═══
  window.showSpoolTimeline = async function(id) {
    try {
      const res = await fetch(`/api/inventory/spools/${id}/timeline`);
      const events = await res.json();
      const eventIcons = {
        created: '&#x2795;', edited: '&#x270F;', used: '&#x1F4E6;', dried: '&#x1F4A7;',
        assigned: '&#x1F5A8;', unassigned: '&#x2B05;', archived: '&#x1F4E6;', unarchived: '&#x21A9;',
        checked_out: '&#x2197;', checked_in: '&#x2199;', empty: '&#x26A0;'
      };
      let h = '';
      if (!events.length) { h = `<p class="text-muted">${t('filament.timeline_empty')}</p>`; }
      else {
        h = '<div class="fil-timeline">';
        for (const ev of events) {
          const icon = eventIcons[ev.event_type] || '&#x2022;';
          const time = ev.timestamp ? new Date(ev.timestamp + 'Z').toLocaleString() : '';
          h += `<div class="fil-timeline-item">
            <div class="fil-timeline-dot">${icon}</div>
            <div class="fil-timeline-content">
              <div class="fil-timeline-header"><span>${t('filament.event_' + ev.event_type, {}, ev.event_type)}</span><span class="text-muted" style="font-size:0.7rem">${time}</span></div>
            </div>
          </div>`;
        }
        h += '</div>';
      }
      const overlay = document.createElement('div');
      overlay.className = 'inv-modal-overlay';
      overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
      overlay.innerHTML = `<div class="inv-modal" style="max-width:500px">
        <div class="inv-modal-header">
          <span>${t('filament.spool_timeline')}</span>
          <button class="inv-modal-close" onclick="this.closest('.inv-modal-overlay').remove()">&times;</button>
        </div>
        <div style="padding:12px;max-height:400px;overflow-y:auto">${h}</div>
      </div>`;
      document.body.appendChild(overlay);
    } catch (e) { showToast(e.message, 'error'); }
  };

  // ═══ Bulk Operations ═══
  let _selectedSpools = new Set();
  let _selectedProfiles = new Set();
  let _selectedVendors = new Set();

  window.toggleSpoolSelect = function(id, el) {
    if (_selectedSpools.has(id)) {
      _selectedSpools.delete(id);
      el.closest('.filament-card')?.classList.remove('filament-card-selected');
    } else {
      _selectedSpools.add(id);
      el.closest('.filament-card')?.classList.add('filament-card-selected');
    }
    _updateBulkBar();
    _updateSelectAllCheckbox();
  };

  window._bulkSelectAll = function(checked) {
    const cards = document.querySelectorAll('.inv-spool-card[data-spool-id]');
    if (checked) {
      cards.forEach(c => {
        const id = parseInt(c.dataset.spoolId);
        _selectedSpools.add(id);
        c.classList.add('filament-card-selected');
        const cb = c.querySelector('.fil-bulk-check');
        if (cb) cb.checked = true;
      });
    } else {
      cards.forEach(c => {
        const id = parseInt(c.dataset.spoolId);
        _selectedSpools.delete(id);
        c.classList.remove('filament-card-selected');
        const cb = c.querySelector('.fil-bulk-check');
        if (cb) cb.checked = false;
      });
    }
    _updateBulkBar();
  };

  function _updateSelectAllCheckbox() {
    const cb = document.getElementById('bulk-select-all-cb');
    if (!cb) return;
    const cards = document.querySelectorAll('.inv-spool-card[data-spool-id]');
    const total = cards.length;
    const selected = _selectedSpools.size;
    cb.checked = total > 0 && selected >= total;
    cb.indeterminate = selected > 0 && selected < total;
  }

  function _updateBulkBar() {
    let bar = document.getElementById('bulk-action-bar');
    if (_selectedSpools.size === 0) {
      if (bar) bar.remove();
      return;
    }
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'bulk-action-bar';
      bar.className = 'fil-bulk-bar';
      document.body.appendChild(bar);
    }
    const canWrite = !window._can || window._can('filament');
    bar.innerHTML = `<span>${_selectedSpools.size} ${t('filament.bulk_selected')}</span>
      <div class="fil-bulk-actions">
        ${canWrite ? `<button class="form-btn form-btn-sm" data-ripple onclick="showBulkEditDialog()">${t('filament.bulk_edit')}</button>` : ''}
        ${canWrite ? `<button class="form-btn form-btn-sm" data-ripple onclick="showBulkTagDialog()">${t('filament.bulk_tag')}</button>` : ''}
        ${canWrite ? `<button class="form-btn form-btn-sm" data-ripple onclick="showBulkDryDialog()">${t('filament.bulk_dry')}</button>` : ''}
        ${canWrite && _selectedSpools.size >= 2 ? `<button class="form-btn form-btn-sm" data-ripple onclick="window._showMergeDialog()">${t('filament.merge')}</button>` : ''}
        <button class="form-btn form-btn-sm" data-ripple onclick="bulkLabels()">${t('filament.bulk_labels')}</button>
        <button class="form-btn form-btn-sm" data-ripple onclick="bulkExport()">${t('filament.bulk_export')}</button>
        ${canWrite ? `<button class="form-btn form-btn-sm" data-ripple onclick="bulkAction('relocate')">${t('filament.bulk_relocate')}</button>` : ''}
        ${canWrite ? `<button class="form-btn form-btn-sm" data-ripple onclick="bulkAction('archive')">${t('filament.archive')}</button>` : ''}
        ${canWrite ? `<button class="form-btn form-btn-sm" data-ripple style="color:var(--accent-red)" onclick="bulkAction('delete')">${t('settings.delete')}</button>` : ''}
        <button class="form-btn form-btn-sm" data-ripple onclick="clearBulkSelection()">${t('common.cancel')}</button>
      </div>`;
  }

  window.clearBulkSelection = function() {
    _selectedSpools.clear();
    document.querySelectorAll('.filament-card-selected').forEach(el => el.classList.remove('filament-card-selected'));
    document.querySelectorAll('.fil-bulk-check').forEach(cb => cb.checked = false);
    _updateBulkBar();
    _updateSelectAllCheckbox();
  };

  window.bulkAction = async function(action) {
    const ids = Array.from(_selectedSpools);
    if (ids.length === 0) return;
    let body = { action, spool_ids: ids };

    const _doBulk = async (b) => {
      if (b.action === 'relocate') {
        const loc = prompt(t('filament.bulk_relocate_prompt'));
        if (!loc) return;
        b.location = loc;
      }
      try {
        const res = await fetch('/api/inventory/spools/bulk', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(b)
        });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed'); }
        _selectedSpools.clear();
        _updateBulkBar();
        _updateSelectAllCheckbox();
        loadFilament();
      } catch (e) { showToast(e.message, 'error'); }
    };

    if (action === 'delete') {
      return confirmAction(t('filament.bulk_delete_confirm', { count: ids.length }), () => _doBulk(body), { danger: true });
    }
    if (action === 'archive') {
      return confirmAction(t('filament.bulk_archive_confirm', { count: ids.length }), () => _doBulk(body), {});
    }
    await _doBulk(body);
  };

  // ── Bulk Edit Dialog ──
  window.showBulkEditDialog = function() {
    const n = _selectedSpools.size;
    const locs = [...new Set(_spools.map(s => s.location).filter(Boolean))].sort();
    const mats = [...new Set(_spools.map(s => s.material).filter(Boolean))].sort();
    let html = `<div class="inv-modal-backdrop" onclick="if(event.target===this)this.remove()">
      <div class="inv-modal" style="max-width:420px">
        <div class="inv-modal-header"><h3>${t('filament.bulk_edit_title', { count: n })}</h3></div>
        <div class="inv-modal-body">
          <div class="bulk-edit-row"><label><input type="checkbox" id="be-cost-cb"> ${t('filament.cost_per_kg')}</label>
            <input type="number" step="0.01" class="form-input form-input-sm" id="be-cost" disabled></div>
          <div class="bulk-edit-row"><label><input type="checkbox" id="be-notes-cb"> ${t('filament.notes')}</label>
            <input type="text" class="form-input form-input-sm" id="be-notes" disabled></div>
          <div class="bulk-edit-row"><label><input type="checkbox" id="be-location-cb"> ${t('filament.location')}</label>
            <select class="form-input form-input-sm" id="be-location" disabled>
              <option value="">--</option>${locs.map(l => `<option value="${esc(l)}">${esc(l)}</option>`).join('')}
            </select></div>
          <div class="bulk-edit-row"><label><input type="checkbox" id="be-material-cb"> ${t('filament.material')}</label>
            <select class="form-input form-input-sm" id="be-material" disabled>
              <option value="">--</option>${mats.map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join('')}
            </select></div>
        </div>
        <div class="inv-modal-footer">
          <button class="form-btn" onclick="this.closest('.inv-modal-backdrop').remove()">${t('common.cancel')}</button>
          <button class="form-btn form-btn-primary" onclick="window._applyBulkEdit()">${t('filament.bulk_apply', { count: n })}</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    // Wire checkboxes to enable/disable inputs
    for (const key of ['cost', 'notes', 'location', 'material']) {
      document.getElementById(`be-${key}-cb`).onchange = function() {
        document.getElementById(`be-${key}`).disabled = !this.checked;
      };
    }
  };

  window._applyBulkEdit = async function() {
    const fields = {};
    if (document.getElementById('be-cost-cb').checked) fields.cost_per_kg = parseFloat(document.getElementById('be-cost').value) || 0;
    if (document.getElementById('be-notes-cb').checked) fields.notes = document.getElementById('be-notes').value;
    if (document.getElementById('be-location-cb').checked) fields.location = document.getElementById('be-location').value;
    if (document.getElementById('be-material-cb').checked) fields.material = document.getElementById('be-material').value;
    if (Object.keys(fields).length === 0) return showToast('No fields selected', 'warning');
    try {
      const res = await fetch('/api/inventory/spools/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit', spool_ids: Array.from(_selectedSpools), fields })
      });
      if (!res.ok) throw new Error('Failed');
      document.querySelector('.inv-modal-backdrop')?.remove();
      clearBulkSelection();
      loadFilament();
      showToast(t('filament.bulk_edit_done'), 'success');
    } catch (e) { showToast(e.message, 'error'); }
  };

  // ── Bulk Tag Dialog ──
  window.showBulkTagDialog = async function() {
    const n = _selectedSpools.size;
    let tags = [];
    try { const r = await fetch('/api/tags'); tags = await r.json(); } catch {}
    let html = `<div class="inv-modal-backdrop" onclick="if(event.target===this)this.remove()">
      <div class="inv-modal" style="max-width:360px">
        <div class="inv-modal-header"><h3>${t('filament.bulk_tag_title', { count: n })}</h3></div>
        <div class="inv-modal-body">
          <div style="margin-bottom:8px">
            <label>${t('filament.bulk_tag_assign')}</label>
            <select class="form-input form-input-sm" id="bt-tag">
              <option value="">--</option>
              ${tags.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}
            </select>
          </div>
          <div style="display:flex;gap:8px">
            <button class="form-btn form-btn-sm form-btn-primary" onclick="window._doBulkTag('assign')">${t('filament.bulk_tag_assign_btn')}</button>
            <button class="form-btn form-btn-sm" onclick="window._doBulkTag('unassign')">${t('filament.bulk_tag_unassign_btn')}</button>
          </div>
        </div>
        <div class="inv-modal-footer">
          <button class="form-btn" onclick="this.closest('.inv-modal-backdrop').remove()">${t('common.cancel')}</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  window._doBulkTag = async function(action) {
    const tagId = parseInt(document.getElementById('bt-tag').value);
    if (!tagId) return showToast('Select a tag', 'warning');
    try {
      const res = await fetch('/api/tags/bulk-assign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag_id: tagId, entity_type: 'spool', entity_ids: Array.from(_selectedSpools), action })
      });
      if (!res.ok) throw new Error('Failed');
      document.querySelector('.inv-modal-backdrop')?.remove();
      loadFilament();
      showToast(action === 'assign' ? t('filament.bulk_tag_assigned') : t('filament.bulk_tag_unassigned'), 'success');
    } catch (e) { showToast(e.message, 'error'); }
  };

  // ── Bulk Drying Dialog ──
  window.showBulkDryDialog = async function() {
    const n = _selectedSpools.size;
    let presets = [];
    try { const r = await fetch('/api/inventory/drying/presets'); presets = await r.json(); } catch {}
    let html = `<div class="inv-modal-backdrop" onclick="if(event.target===this)this.remove()">
      <div class="inv-modal" style="max-width:380px">
        <div class="inv-modal-header"><h3>${t('filament.bulk_dry_title', { count: n })}</h3></div>
        <div class="inv-modal-body">
          <div class="bulk-edit-row"><label>${t('filament.drying_preset')}</label>
            <select class="form-input form-input-sm" id="bd-preset" onchange="_fillDryPreset(this.value)">
              <option value="">-- ${t('filament.manual')} --</option>
              ${presets.map(p => `<option value="${p.id}" data-temp="${p.temperature||''}" data-dur="${p.duration_minutes||''}" data-method="${p.method||'dryer_box'}">${esc(p.name)}</option>`).join('')}
            </select>
          </div>
          <div class="bulk-edit-row"><label>${t('filament.drying_temp')}</label>
            <input type="number" class="form-input form-input-sm" id="bd-temp" placeholder="50"> °C</div>
          <div class="bulk-edit-row"><label>${t('filament.drying_duration')}</label>
            <input type="number" class="form-input form-input-sm" id="bd-dur" placeholder="240"> min</div>
        </div>
        <div class="inv-modal-footer">
          <button class="form-btn" onclick="this.closest('.inv-modal-backdrop').remove()">${t('common.cancel')}</button>
          <button class="form-btn form-btn-primary" onclick="window._doBulkDry()">${t('filament.start_drying')}</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  window._fillDryPreset = function(presetId) {
    const opt = document.querySelector(`#bd-preset option[value="${presetId}"]`);
    if (opt) {
      document.getElementById('bd-temp').value = opt.dataset.temp || '';
      document.getElementById('bd-dur').value = opt.dataset.dur || '';
    }
  };

  window._doBulkDry = async function() {
    try {
      const res = await fetch('/api/inventory/spools/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_drying', spool_ids: Array.from(_selectedSpools),
          temperature: parseInt(document.getElementById('bd-temp').value) || null,
          duration_minutes: parseInt(document.getElementById('bd-dur').value) || null
        })
      });
      if (!res.ok) throw new Error('Failed');
      document.querySelector('.inv-modal-backdrop')?.remove();
      clearBulkSelection();
      loadFilament();
      showToast(t('filament.bulk_dry_started'), 'success');
    } catch (e) { showToast(e.message, 'error'); }
  };

  // ── Bulk Labels ──
  window.bulkLabels = function() {
    const ids = Array.from(_selectedSpools);
    if (ids.length === 0) return;
    // Show format picker
    const overlay = document.createElement('div');
    overlay.className = 'inv-modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="inv-modal" style="max-width:350px">
      <div class="inv-modal-header"><span>${t('filament.print_labels')}</span><button class="inv-modal-close" onclick="this.closest('.inv-modal-overlay').remove()">&times;</button></div>
      <div class="inv-modal-body">
        <p style="font-size:0.85rem;margin:0 0 8px">${ids.length} ${t('filament.bulk_selected')}</p>
        <div class="form-group"><label class="form-label">${t('filament.label_format')}</label>
          <select class="form-input" id="label-format-select">
            <option value="thermal_40x30">Thermal 40x30mm</option>
            <option value="thermal_50x30">Thermal 50x30mm</option>
            <option value="a4_grid_3x8">A4 Grid 3x8 (Avery L7159)</option>
            <option value="a4_grid_2x7">A4 Grid 2x7 (Avery L7163)</option>
          </select>
        </div>
      </div>
      <div class="inv-modal-footer">
        <button class="form-btn" data-ripple onclick="window._doPrintLabels()">${t('filament.print_label')}</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
  };

  window._doPrintLabels = function() {
    const ids = Array.from(_selectedSpools);
    const format = document.getElementById('label-format-select')?.value || 'thermal_40x30';
    document.querySelector('.inv-modal-overlay')?.remove();
    window.open(`/print/labels?ids=${ids.join(',')}&format=${format}`, '_blank');
  };

  // ── Bulk Export ──
  window.bulkExport = async function() {
    const ids = Array.from(_selectedSpools);
    try {
      const res = await fetch('/api/inventory/spools/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'export', spool_ids: ids, format: 'csv' })
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `spools-export-${ids.length}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) { showToast(e.message, 'error'); }
  };

  // ── Merge Spools Dialog ──
  window._showMergeDialog = function() {
    const ids = Array.from(_selectedSpools);
    if (ids.length < 2) return showToast(t('filament.merge_min'), 'error');
    const selected = _spools.filter(s => ids.includes(s.id));
    const profiles = [...new Set(selected.map(s => s.filament_profile_id))];
    const sameProfile = profiles.length === 1;

    let html = `<div class="inv-modal-backdrop" onclick="if(event.target===this)this.remove()">
      <div class="inv-modal" style="max-width:500px">
        <h3>${t('filament.merge_title')}</h3>
        ${!sameProfile ? `<div class="form-help" style="color:var(--accent-orange);margin-bottom:12px">${t('filament.merge_warning_profile')}</div>` : ''}
        <p style="margin-bottom:12px">${t('filament.merge_desc')}</p>
        <div style="margin-bottom:16px">
          <label class="form-label">${t('filament.merge_target')}</label>
          <select id="merge-target" class="form-input">
            ${selected.map(s => `<option value="${s.id}">#${s.id} — ${s.profile_name || s.material || '?'} (${Math.round(s.remaining_weight_g)}g)</option>`).join('')}
          </select>
        </div>
        <div id="merge-preview" style="background:var(--card-bg);border-radius:8px;padding:12px;margin-bottom:16px"></div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="form-btn" onclick="this.closest('.inv-modal-backdrop').remove()">${t('common.cancel')}</button>
          <button class="form-btn form-btn-primary" data-ripple onclick="window._executeMerge()">${t('filament.merge_confirm')}</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    const sel = document.getElementById('merge-target');
    const updatePreview = () => {
      const targetId = Number(sel.value);
      const target = selected.find(s => s.id === targetId);
      const sources = selected.filter(s => s.id !== targetId);
      const totalRemaining = selected.reduce((sum, s) => sum + (s.remaining_weight_g || 0), 0);
      const totalUsed = selected.reduce((sum, s) => sum + (s.used_weight_g || 0), 0);
      const totalCost = selected.reduce((sum, s) => sum + (s.cost || 0), 0);
      document.getElementById('merge-preview').innerHTML = `
        <div style="font-weight:600;margin-bottom:8px">${t('filament.merge_preview')}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;font-size:0.9em">
          <span>${t('filament.merge_keep')}:</span><span><b>#${target.id}</b> — ${target.profile_name || '?'}</span>
          <span>${t('filament.merge_absorb')}:</span><span>${sources.map(s => '#' + s.id).join(', ')}</span>
          <span>${t('filament.remaining_weight')}:</span><span>${Math.round(totalRemaining)}g</span>
          <span>${t('filament.used_weight')}:</span><span>${Math.round(totalUsed)}g</span>
          ${totalCost > 0 ? `<span>${t('filament.cost')}:</span><span>${totalCost.toFixed(2)}</span>` : ''}
        </div>
        <div style="margin-top:8px;font-size:0.85em;opacity:0.7">${t('filament.merge_source_archived')}</div>`;
    };
    sel.addEventListener('change', updatePreview);
    updatePreview();
  };

  window._executeMerge = async function() {
    const targetId = Number(document.getElementById('merge-target').value);
    const sourceIds = Array.from(_selectedSpools).filter(id => id !== targetId);
    try {
      const res = await fetch('/api/inventory/spools/merge', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: targetId, source_ids: sourceIds })
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Merge failed'); }
      document.querySelector('.inv-modal-backdrop')?.remove();
      _selectedSpools.clear();
      _updateBulkBar();
      _updateSelectAllCheckbox();
      showToast(t('filament.merge_success'), 'success');
      loadFilament();
    } catch (e) { showToast(e.message, 'error'); }
  };

  // ── Profile multi-select ──
  window.toggleProfileSelect = function(id, el) {
    if (_selectedProfiles.has(id)) {
      _selectedProfiles.delete(id);
      el.closest('.filament-card')?.classList.remove('filament-card-selected');
    } else {
      _selectedProfiles.add(id);
      el.closest('.filament-card')?.classList.add('filament-card-selected');
    }
    _updateManageBulkBar();
  };

  window._bulkSelectAllProfiles = function(checked) {
    document.querySelectorAll('.inv-profile-card[data-profile-id]').forEach(c => {
      const id = parseInt(c.dataset.profileId);
      if (checked) { _selectedProfiles.add(id); c.classList.add('filament-card-selected'); }
      else { _selectedProfiles.delete(id); c.classList.remove('filament-card-selected'); }
      const cb = c.querySelector('.fil-profile-check');
      if (cb) cb.checked = checked;
    });
    _updateManageBulkBar();
  };

  // ── Vendor multi-select ──
  window.toggleVendorSelect = function(id, el) {
    if (_selectedVendors.has(id)) {
      _selectedVendors.delete(id);
      el.closest('tr')?.classList.remove('bulk-row-selected');
    } else {
      _selectedVendors.add(id);
      el.closest('tr')?.classList.add('bulk-row-selected');
    }
    _updateManageBulkBar();
  };

  window._bulkSelectAllVendors = function(checked) {
    document.querySelectorAll('tr[data-vendor-id]').forEach(r => {
      const id = parseInt(r.dataset.vendorId);
      if (checked) { _selectedVendors.add(id); r.classList.add('bulk-row-selected'); }
      else { _selectedVendors.delete(id); r.classList.remove('bulk-row-selected'); }
      const cb = r.querySelector('.fil-vendor-check');
      if (cb) cb.checked = checked;
    });
    _updateManageBulkBar();
  };

  function _updateManageBulkBar() {
    let bar = document.getElementById('manage-bulk-bar');
    const pCount = _selectedProfiles.size;
    const vCount = _selectedVendors.size;
    if (pCount === 0 && vCount === 0) {
      if (bar) bar.remove();
      return;
    }
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'manage-bulk-bar';
      bar.className = 'fil-bulk-bar';
      document.body.appendChild(bar);
    }
    let html = '';
    if (pCount > 0) {
      html += `<span>${pCount} ${t('filament.profiles_selected')}</span>
        <div class="fil-bulk-actions">
          <button class="form-btn form-btn-sm" data-ripple onclick="showBulkEditProfilesDialog()">${t('filament.bulk_edit')}</button>
          <button class="form-btn form-btn-sm" data-ripple style="color:var(--accent-red)" onclick="bulkDeleteProfiles()">${t('settings.delete')}</button>
          <button class="form-btn form-btn-sm" data-ripple onclick="clearManageBulkSelection()">${t('common.cancel')}</button>
        </div>`;
    }
    if (vCount > 0) {
      if (pCount > 0) html += '<span style="border-left:1px solid var(--border-color);height:20px;margin:0 4px"></span>';
      html += `<span>${vCount} ${t('filament.vendors_selected')}</span>
        <div class="fil-bulk-actions">
          <button class="form-btn form-btn-sm" data-ripple style="color:var(--accent-red)" onclick="bulkDeleteVendors()">${t('settings.delete')}</button>
          <button class="form-btn form-btn-sm" data-ripple onclick="clearManageBulkSelection()">${t('common.cancel')}</button>
        </div>`;
    }
    bar.innerHTML = html;
  }

  window.clearManageBulkSelection = function() {
    _selectedProfiles.clear();
    _selectedVendors.clear();
    document.querySelectorAll('.filament-card-selected').forEach(el => el.classList.remove('filament-card-selected'));
    document.querySelectorAll('.bulk-row-selected').forEach(el => el.classList.remove('bulk-row-selected'));
    document.querySelectorAll('.fil-profile-check, .fil-vendor-check').forEach(cb => cb.checked = false);
    _updateManageBulkBar();
  };

  window.bulkDeleteProfiles = function() {
    const ids = Array.from(_selectedProfiles);
    confirmAction(t('filament.bulk_delete_profiles_confirm', { count: ids.length }), async () => {
      try {
        const res = await fetch('/api/inventory/profiles/bulk', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', profile_ids: ids })
        });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed'); }
        _selectedProfiles.clear();
        _updateManageBulkBar();
        loadFilament();
        showToast(t('filament.bulk_profiles_deleted'), 'success');
      } catch (e) { showToast(e.message, 'error'); }
    }, { danger: true });
  };

  window.bulkDeleteVendors = function() {
    const ids = Array.from(_selectedVendors);
    confirmAction(t('filament.bulk_delete_vendors_confirm', { count: ids.length }), async () => {
      try {
        const res = await fetch('/api/inventory/vendors/bulk', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', vendor_ids: ids })
        });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed'); }
        _selectedVendors.clear();
        _updateManageBulkBar();
        loadFilament();
        showToast(t('filament.bulk_vendors_deleted'), 'success');
      } catch (e) { showToast(e.message, 'error'); }
    }, { danger: true });
  };

  window.showBulkEditProfilesDialog = function() {
    const n = _selectedProfiles.size;
    const mats = [...new Set(_profiles.map(p => p.material).filter(Boolean))].sort();
    const vendors = _vendors.map(v => ({ id: v.id, name: v.name }));
    let html = `<div class="inv-modal-backdrop" onclick="if(event.target===this)this.remove()">
      <div class="inv-modal" style="max-width:420px">
        <div class="inv-modal-header"><h3>${t('filament.bulk_edit_profiles_title', { count: n })}</h3></div>
        <div class="inv-modal-body">
          <div class="bulk-edit-row"><label><input type="checkbox" id="bep-material-cb"> ${t('filament.material')}</label>
            <select class="form-input form-input-sm" id="bep-material" disabled>
              <option value="">--</option>${mats.map(m => `<option value="${esc(m)}">${esc(m)}</option>`).join('')}
            </select></div>
          <div class="bulk-edit-row"><label><input type="checkbox" id="bep-vendor-cb"> ${t('filament.vendor')}</label>
            <select class="form-input form-input-sm" id="bep-vendor" disabled>
              <option value="">--</option>${vendors.map(v => `<option value="${v.id}">${esc(v.name)}</option>`).join('')}
            </select></div>
          <div class="bulk-edit-row"><label><input type="checkbox" id="bep-density-cb"> ${t('filament.density')}</label>
            <input type="number" step="0.01" class="form-input form-input-sm" id="bep-density" placeholder="1.24" disabled> g/cm³</div>
        </div>
        <div class="inv-modal-footer">
          <button class="form-btn" onclick="this.closest('.inv-modal-backdrop').remove()">${t('common.cancel')}</button>
          <button class="form-btn form-btn-primary" onclick="window._applyBulkEditProfiles()">${t('filament.bulk_apply', { count: n })}</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    for (const key of ['material', 'vendor', 'density']) {
      document.getElementById(`bep-${key}-cb`).onchange = function() {
        document.getElementById(`bep-${key}`).disabled = !this.checked;
      };
    }
  };

  window._applyBulkEditProfiles = async function() {
    const fields = {};
    if (document.getElementById('bep-material-cb').checked) fields.material = document.getElementById('bep-material').value;
    if (document.getElementById('bep-vendor-cb').checked) fields.vendor_id = parseInt(document.getElementById('bep-vendor').value) || null;
    if (document.getElementById('bep-density-cb').checked) fields.density = parseFloat(document.getElementById('bep-density').value) || null;
    if (Object.keys(fields).length === 0) return showToast(t('filament.bulk_no_fields'), 'warning');
    try {
      const res = await fetch('/api/inventory/profiles/bulk', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit', profile_ids: Array.from(_selectedProfiles), fields })
      });
      if (!res.ok) throw new Error('Failed');
      document.querySelector('.inv-modal-backdrop')?.remove();
      clearManageBulkSelection();
      loadFilament();
      showToast(t('filament.bulk_edit_done'), 'success');
    } catch (e) { showToast(e.message, 'error'); }
  };

  // ── Tag Management (Manage tab) ──
  window.showAddTagForm = function() {
    const container = document.getElementById('tag-form-container');
    if (!container) return;
    container.innerHTML = `<div class="inv-inline-form" style="margin-top:8px">
      <input type="text" class="form-input form-input-sm" id="tag-name" placeholder="${t('filament.tag_name')}">
      <select class="form-input form-input-sm" id="tag-category">
        <option value="custom">${t('tags.custom')}</option>
        <option value="material">${t('tags.material')}</option>
        <option value="printer">${t('tags.printer')}</option>
        <option value="nozzle">${t('tags.nozzle')}</option>
      </select>
      <input type="color" id="tag-color" value="#58a6ff" style="width:36px;height:28px;border:none;padding:0;cursor:pointer">
      <button class="form-btn form-btn-sm form-btn-primary" onclick="saveTag()">${t('filament.tag_save')}</button>
      <button class="form-btn form-btn-sm" onclick="document.getElementById('tag-form-container').innerHTML=''">${t('common.cancel')}</button>
    </div>`;
  };

  window.showEditTagForm = function(id) {
    const tag = _tags.find(t => t.id === id);
    if (!tag) return;
    const container = document.getElementById('tag-form-container');
    if (!container) return;
    container.innerHTML = `<div class="inv-inline-form" style="margin-top:8px">
      <input type="hidden" id="tag-edit-id" value="${id}">
      <input type="text" class="form-input form-input-sm" id="tag-name" value="${esc(tag.name)}">
      <select class="form-input form-input-sm" id="tag-category">
        <option value="custom" ${tag.category === 'custom' ? 'selected' : ''}>${t('tags.custom')}</option>
        <option value="material" ${tag.category === 'material' ? 'selected' : ''}>${t('tags.material')}</option>
        <option value="printer" ${tag.category === 'printer' ? 'selected' : ''}>${t('tags.printer')}</option>
        <option value="nozzle" ${tag.category === 'nozzle' ? 'selected' : ''}>${t('tags.nozzle')}</option>
      </select>
      <input type="color" id="tag-color" value="${tag.color || '#58a6ff'}" style="width:36px;height:28px;border:none;padding:0;cursor:pointer">
      <button class="form-btn form-btn-sm form-btn-primary" onclick="saveTag()">${t('filament.tag_save')}</button>
      <button class="form-btn form-btn-sm" onclick="document.getElementById('tag-form-container').innerHTML=''">${t('common.cancel')}</button>
    </div>`;
  };

  window.saveTag = async function() {
    const name = document.getElementById('tag-name').value.trim();
    if (!name) return;
    const category = document.getElementById('tag-category').value;
    const color = document.getElementById('tag-color').value;
    const editId = document.getElementById('tag-edit-id')?.value;
    try {
      const res = await fetch(editId ? `/api/tags/${editId}` : '/api/tags', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, color })
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed'); }
      loadFilament();
      showToast(t('filament.tag_saved'), 'success');
    } catch (e) { showToast(e.message, 'error'); }
  };

  window.deleteTagItem = function(id) {
    const tag = _tags.find(t => t.id === id);
    confirmAction(t('filament.tag_delete_confirm', { name: tag?.name || '' }), async () => {
      try {
        await fetch(`/api/tags/${id}`, { method: 'DELETE' });
        loadFilament();
        showToast(t('filament.tag_deleted'), 'success');
      } catch (e) { showToast(e.message, 'error'); }
    }, { danger: true });
  };

  // ── Individual spool tag assignment ──
  window.showSpoolTagAssign = async function(spoolId) {
    const spool = _spools.find(s => s.id === spoolId);
    if (!spool) return;
    const spoolTags = spool.tags || [];
    const availableTags = _tags.filter(t => !spoolTags.some(st => st.id === t.id));
    let html = `<div class="inv-modal-backdrop" onclick="if(event.target===this)this.remove()">
      <div class="inv-modal" style="max-width:380px">
        <div class="inv-modal-header"><h3>${t('filament.tags_title')}</h3></div>
        <div class="inv-modal-body">
          <div class="fil-tag-badges" style="margin-bottom:8px;min-height:24px">
            ${spoolTags.map(tg => `<span class="fil-tag-chip" style="--tag-color:${esc(tg.color || '#58a6ff')}">
              <span class="fil-tag-dot" style="background:${esc(tg.color || '#58a6ff')}"></span>
              ${esc(tg.name)}
              <span class="fil-tag-chip-remove" onclick="window._removeSpoolTag(${spoolId},${tg.id})">&times;</span>
            </span>`).join('')}
          </div>
          ${availableTags.length ? `<div style="display:flex;gap:6px;align-items:center">
            <select class="form-input form-input-sm" id="spool-tag-select" style="flex:1">
              ${availableTags.map(tg => `<option value="${tg.id}">${esc(tg.name)}</option>`).join('')}
            </select>
            <button class="form-btn form-btn-sm form-btn-primary" onclick="window._addSpoolTag(${spoolId})">${t('filament.tag_add_to_spool')}</button>
          </div>` : `<p class="text-muted text-sm">${t('filament.no_tags')}</p>`}
        </div>
        <div class="inv-modal-footer">
          <button class="form-btn" onclick="this.closest('.inv-modal-backdrop').remove()">${t('common.close')}</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  window._addSpoolTag = async function(spoolId) {
    const tagId = parseInt(document.getElementById('spool-tag-select').value);
    if (!tagId) return;
    try {
      await fetch('/api/tags/assign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_type: 'spool', entity_id: spoolId, tag_id: tagId })
      });
      document.querySelector('.inv-modal-backdrop')?.remove();
      loadFilament();
    } catch (e) { showToast(e.message, 'error'); }
  };

  window._removeSpoolTag = async function(spoolId, tagId) {
    try {
      await fetch('/api/tags/unassign', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_type: 'spool', entity_id: spoolId, tag_id: tagId })
      });
      document.querySelector('.inv-modal-backdrop')?.remove();
      loadFilament();
    } catch (e) { showToast(e.message, 'error'); }
  };

  // ═══ Swatch Labels (enhanced) ═══
  window.showSwatchLabel = async function(id) {
    const res = await fetch(`/api/inventory/spools/${id}/label?format=swatch_40x30`);
    if (!res.ok) return;
    const data = await res.json();
    const s = data.spool;
    if (!s) return;
    const color = hexToRgb(s.color_hex);
    const textColor = isLightColor(s.color_hex) ? '#333' : '#fff';
    const overlay = document.createElement('div');
    overlay.className = 'inv-modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="inv-modal" style="max-width:500px">
      <div class="inv-modal-header">
        <span>${t('filament.swatch_label')}</span>
        <button class="inv-modal-close" onclick="this.closest('.inv-modal-overlay').remove()">&times;</button>
      </div>
      <div style="padding:12px">
        <div style="display:flex;gap:8px;margin-bottom:12px;align-items:center">
          <label class="form-label" style="margin:0;font-size:0.75rem">${t('filament.label_format')}:</label>
          <select class="form-input" id="swatch-format" style="width:auto;font-size:0.75rem" onchange="updateSwatchPreview(${id})">
            <option value="swatch_40x30">Swatch 40x30mm</option>
            <option value="swatch_50x75">Full 50x75mm</option>
          </select>
        </div>
        <div id="swatch-preview" class="fil-swatch-preview">
          <div class="fil-swatch-card" style="background:${color};color:${textColor}">
            <div class="fil-swatch-material">${esc(s.material || '')}</div>
            <div class="fil-swatch-vendor">${esc(s.vendor_name || '')}</div>
            ${s.color_name ? `<div class="fil-swatch-color-name">${esc(s.color_name)}</div>` : ''}
            <div class="fil-swatch-temps">${s.nozzle_temp_min || ''}–${s.nozzle_temp_max || ''}°C</div>
          </div>
        </div>
      </div>
      <div class="inv-modal-footer">
        <button class="form-btn" data-ripple onclick="printSwatchLabel()">${t('filament.print_label')}</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    overlay._spoolData = s;
  };

  window.updateSwatchPreview = function(id) {
    const overlay = document.querySelector('.inv-modal-overlay');
    if (!overlay || !overlay._spoolData) return;
    const s = overlay._spoolData;
    const format = document.getElementById('swatch-format')?.value || 'swatch_40x30';
    const color = hexToRgb(s.color_hex);
    const textColor = isLightColor(s.color_hex) ? '#333' : '#fff';
    const el = document.getElementById('swatch-preview');
    if (!el) return;
    if (format === 'swatch_50x75') {
      let qrHtml = '';
      if (typeof qrcode !== 'undefined') {
        const qr = qrcode(0, 'M');
        qr.addData(JSON.stringify({ id: s.id, material: s.material }));
        qr.make();
        qrHtml = qr.createSvgTag(3, 0);
      }
      el.innerHTML = `<div class="fil-swatch-card fil-swatch-full" style="background:${color};color:${textColor}">
        <div style="display:flex;gap:8px;align-items:center">
          ${qrHtml ? `<div style="background:#fff;padding:4px;border-radius:4px">${qrHtml}</div>` : ''}
          <div>
            <div class="fil-swatch-material" style="font-size:16px">${esc(s.material || '')}</div>
            <div class="fil-swatch-vendor">${esc(s.vendor_name || '')}</div>
          </div>
        </div>
        ${s.color_name ? `<div class="fil-swatch-color-name">${esc(s.color_name)}</div>` : ''}
        <div class="fil-swatch-temps">${s.nozzle_temp_min || ''}–${s.nozzle_temp_max || ''}°C / Bed: ${s.bed_temp_min || ''}–${s.bed_temp_max || ''}°C</div>
      </div>`;
    } else {
      el.innerHTML = `<div class="fil-swatch-card" style="background:${color};color:${textColor}">
        <div class="fil-swatch-material">${esc(s.material || '')}</div>
        <div class="fil-swatch-vendor">${esc(s.vendor_name || '')}</div>
        ${s.color_name ? `<div class="fil-swatch-color-name">${esc(s.color_name)}</div>` : ''}
        <div class="fil-swatch-temps">${s.nozzle_temp_min || ''}–${s.nozzle_temp_max || ''}°C</div>
      </div>`;
    }
  };

  window.printSwatchLabel = function() {
    const preview = document.getElementById('swatch-preview');
    if (!preview) return;
    const format = document.getElementById('swatch-format')?.value || 'swatch_40x30';
    const widthMm = format === 'swatch_50x75' ? 75 : 40;
    const heightMm = format === 'swatch_50x75' ? 50 : 30;
    const win = window.open('', '_blank', 'width=400,height=300');
    win.document.write(`<html><head><title>${t('filament.swatch_label')}</title><style>
      body{margin:0;padding:0;display:flex;justify-content:center;align-items:center;min-height:100vh}
      .fil-swatch-card{width:${widthMm}mm;height:${heightMm}mm;border-radius:4px;padding:4mm;display:flex;flex-direction:column;justify-content:center;gap:2px;font-family:sans-serif}
      .fil-swatch-card.fil-swatch-full{height:auto;min-height:${heightMm}mm}
      .fil-swatch-material{font-weight:bold;font-size:14px}
      .fil-swatch-vendor{font-size:11px;opacity:0.85}
      .fil-swatch-color-name{font-size:10px;opacity:0.7}
      .fil-swatch-temps{font-size:9px;opacity:0.6}
      svg{width:60px;height:60px}
      @media print{@page{size:${widthMm}mm ${heightMm}mm;margin:0}body{min-height:auto}}
    </style></head><body>${preview.innerHTML}</body></html>`);
    win.document.close();
    win.print();
  };

  // ═══ Material Reference ═══

  // ═══ Filament Database Functions ═══

  async function _loadDbStats() {
    try {
      const res = await fetch('/api/community-filaments/stats');
      _dbStats = await res.json();
      const el = document.getElementById('db-hero-container');
      if (el) {
        el.outerHTML = `<div class="fil-hero-grid">
          ${heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>', _dbStats.total.toLocaleString(), t('filament.db_total'), '#1279ff')}
          ${heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>', _dbStats.brands.toLocaleString(), t('filament.db_brands'), '#00e676')}
          ${heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>', _dbStats.materials.toLocaleString(), t('filament.db_materials'), '#f0883e')}
          ${heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>', _dbStats.with_k_value.toLocaleString(), t('filament.db_with_k'), '#9b4dff')}
          ${heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></svg>', _dbStats.with_td.toLocaleString(), t('filament.db_with_td'), '#e3b341')}
        </div>`;
      }
    } catch { /* silent */ }
  }

  async function _loadDbFilaments() {
    const params = new URLSearchParams();
    if (_dbSearch) params.set('search', _dbSearch);
    if (_dbFilterBrand) params.set('manufacturer', _dbFilterBrand);
    if (_dbFilterMaterial) params.set('material', _dbFilterMaterial);
    if (_dbFilterCategory) params.set('category', _dbFilterCategory);
    if (_dbFilterHasK) params.set('has_k_value', '1');
    if (_dbFilterHasTd) params.set('has_td', '1');
    if (_dbFilterTranslucent) params.set('translucent', '1');
    if (_dbFilterGlow) params.set('glow', '1');
    if (_dbFilterMultiColor) params.set('multi_color', '1');
    params.set('sort', _dbSort);
    params.set('sort_dir', _dbSortDir);
    params.set('limit', _dbPageSize);
    params.set('offset', _dbPage * _dbPageSize);

    try {
      const promises = [fetch('/api/community-filaments?' + params)];
      if (!_dbBrands.length) promises.push(fetch('/api/community-filaments/manufacturers'));
      if (!_dbMaterials.length) promises.push(fetch('/api/community-filaments/materials'));
      const results = await Promise.all(promises);

      const data = await results[0].json();
      _dbFilaments = data.rows || data;
      _dbTotal = data.total || _dbFilaments.length;
      if (data.owned_ids) _dbOwnedIds = new Set(data.owned_ids);
      _dbLoaded = true;

      if (results[1]) _dbBrands = await results[1].json();
      if (results[2]) _dbMaterials = await results[2].json();

      _refreshDbBrowser();
    } catch (e) {
      const el = document.getElementById('db-results-container');
      if (el) el.innerHTML = `<div class="text-muted">Error: ${e.message}</div>`;
    }
  }

  function _refreshDbBrowser() {
    // Re-render the db-browser module content
    const panel = document.getElementById('filament-tab-database');
    if (!panel) return;
    const mod = panel.querySelector('[data-module-id="db-browser"]');
    if (!mod) return;
    const builder = BUILDERS['db-browser'];
    if (builder) {
      mod.innerHTML = builder(_spools);
    }
  }

  function _renderDbResults() {
    if (_dbViewMode === 'table') return _renderDbTable();
    return _renderDbCards();
  }

  function _renderDbCards() {
    let h = '<div class="db-card-grid">';
    for (const f of _dbFilaments) {
      const color = f.color_hex ? hexToRgb(f.color_hex) : '#888';
      const textColor = f.color_hex && isLightColor(f.color_hex) ? '#000' : '#fff';
      const badges = [];
      if (f.category) badges.push(`<span class="fil-badge" style="background:var(--bg-tertiary);font-size:0.65rem">${f.category}</span>`);
      if (f.pressure_advance_k != null) badges.push(`<span class="fil-badge" style="background:#2d1f4e;color:#c4b5fd;font-size:0.65rem">K=${f.pressure_advance_k}</span>`);
      if (f.td_value && f.td_value > 0) badges.push(`<span class="fil-badge" style="background:#3d2e00;color:#e3b341;font-size:0.65rem">TD=${f.td_value}</span>`);
      // Slicer settings badges
      if (f.flow_ratio && f.flow_ratio !== 1) badges.push(`<span class="fil-badge" style="background:#1a3a2a;color:#6ee7b7;font-size:0.65rem">${t('filament.flow_ratio')} ${f.flow_ratio}</span>`);
      if (f.max_volumetric_speed) badges.push(`<span class="fil-badge" style="background:#1a2a3a;color:#93c5fd;font-size:0.65rem">${f.max_volumetric_speed} mm³/s</span>`);
      if (f.retraction_distance) badges.push(`<span class="fil-badge" style="background:#3a2a1a;color:#fcd34d;font-size:0.65rem">${t('filament.retraction')} ${f.retraction_distance}mm</span>`);
      // Visual properties
      if (f.finish) badges.push(`<span class="fil-badge" style="background:#2a2a3a;color:#a5b4fc;font-size:0.65rem">${f.finish}</span>`);
      if (f.translucent) badges.push(`<span class="fil-badge" style="background:#1a2a3a;color:#67e8f9;font-size:0.65rem">${t('filament.translucent') || 'Transparent'}</span>`);
      if (f.glow) badges.push(`<span class="fil-badge" style="background:#2a3a1a;color:#bef264;font-size:0.65rem">${t('filament.glow') || 'Glow'}</span>`);
      if (f.multi_color_direction) badges.push(`<span class="fil-badge" style="background:#3a1a2a;color:#f9a8d4;font-size:0.65rem">${t('filament.multi_color') || 'Multi'}: ${f.multi_color_direction}</span>`);
      if (f.pattern) badges.push(`<span class="fil-badge" style="background:#2a3a2a;color:#86efac;font-size:0.65rem">${f.pattern}</span>`);
      // Rating
      const ratingAvg = f.rating_count > 0 ? (f.rating_sum / f.rating_count).toFixed(1) : null;
      const stars = ratingAvg ? '★'.repeat(Math.round(ratingAvg)) + '☆'.repeat(5 - Math.round(ratingAvg)) : '';
      const inCompare = _dbCompare.includes(f.id);
      const isOwned = _dbOwnedIds.has(f.id);

      // Multi-color gradient support
      let colorStyle = `background:${color}`;
      if (f.color_hexes) {
        try {
          const hexes = typeof f.color_hexes === 'string' ? JSON.parse(f.color_hexes) : f.color_hexes;
          if (Array.isArray(hexes) && hexes.length > 1) {
            const stops = hexes.map(h => '#' + h.replace('#', '')).join(', ');
            colorStyle = `background:linear-gradient(135deg, ${stops})`;
          }
        } catch { /* ignore */ }
      }
      h += `<div class="db-filament-card" onclick="window._dbShowDetail(${f.id})">
        <div class="db-card-color" style="display:flex;align-items:center;justify-content:center;position:relative">${typeof spoolIcon === 'function' ? spoolIcon(color, 52) : `<div style="width:100%;height:100%;${colorStyle}"></div>`}${isOwned ? `<span style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.6);color:#4ade80;font-size:0.6rem;padding:1px 5px;border-radius:8px">✓ ${t('filament.owned')}</span>` : ''}</div>
        <div class="db-card-body">
          <div class="db-card-brand">${esc(f.manufacturer || '')}${ratingAvg ? ` <span style="color:#fbbf24;font-size:0.7rem">${stars} (${ratingAvg})</span>` : ''}</div>
          <div class="db-card-name">${esc(f.name || f.material)}</div>
          <div class="db-card-material">${esc(f.material || '')}${f.material_type ? ' <span class="text-muted">' + esc(f.material_type) + '</span>' : ''}</div>
          <div class="db-card-temps">${f.extruder_temp ? f.extruder_temp + '°C' : '--'} / ${f.bed_temp ? f.bed_temp + '°C' : '--'}</div>
          <div class="fil-profile-badges" style="margin-top:4px">${badges.join('')}</div>
        </div>
        <div class="db-card-actions">
          ${window._can && window._can('filament') ? `<button class="form-btn form-btn-sm" onclick="event.stopPropagation();window._dbImport(${f.id})" title="${t('filament.db_add_to_inventory')}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>` : ''}
          <button class="form-btn form-btn-sm${inCompare?' active':''}" onclick="event.stopPropagation();window._dbToggleCompare(${f.id})" title="${t('filament.db_compare')}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
          </button>
        </div>
      </div>`;
    }
    h += '</div>';
    return h;
  }

  function _renderDbTable() {
    let h = '<div style="overflow-x:auto"><table class="data-table"><thead><tr>';
    h += '<th></th><th>Brand</th><th>Name</th><th>Material</th><th>Nozzle</th><th>Bed</th><th>K-Value</th><th>TD</th><th>Price</th><th></th>';
    h += '</tr></thead><tbody>';
    for (const f of _dbFilaments) {
      const color = f.color_hex ? hexToRgb(f.color_hex) : '#888';
      const owned = _dbOwnedIds.has(f.id);
      h += `<tr style="cursor:pointer" onclick="window._dbShowDetail(${f.id})">
        <td>${typeof miniSpool === 'function' ? miniSpool(color, 16) : `<span class="filament-color-swatch" style="background:${color};width:14px;height:14px;display:inline-block;border-radius:50%"></span>`}${owned ? ' <span style="color:#4ade80;font-size:0.65rem">✓</span>' : ''}</td>
        <td>${esc(f.manufacturer || '')}</td>
        <td>${esc(f.name || '--')}</td>
        <td>${esc(f.material || '')}${f.material_type ? ' <span class="text-muted">' + esc(f.material_type) + '</span>' : ''}</td>
        <td>${f.extruder_temp ? f.extruder_temp + '°C' : '--'}</td>
        <td>${f.bed_temp ? f.bed_temp + '°C' : '--'}</td>
        <td>${f.pressure_advance_k != null ? f.pressure_advance_k : '--'}</td>
        <td>${f.td_value && f.td_value > 0 ? f.td_value : '--'}</td>
        <td>${f.price ? '$' + f.price : '--'}</td>
        <td>${window._can && window._can('filament') ? `<button class="form-btn form-btn-sm" onclick="event.stopPropagation();window._dbImport(${f.id})" title="${t('filament.db_add_to_inventory')}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>` : ''}</td>
      </tr>`;
    }
    h += '</tbody></table></div>';
    return h;
  }

  function _dbShowDetail(id) {
    const f = _dbFilaments.find(x => x.id === id);
    if (!f) return;
    const color = f.color_hex ? hexToRgb(f.color_hex) : '#888';
    const textColor = f.color_hex && isLightColor(f.color_hex) ? '#000' : '#fff';

    const fields = [
      ['Material', f.material + (f.material_type ? ' ' + f.material_type : '')],
      ['Category', f.category || '--'],
      [t('filament.db_nozzle_temp'), f.extruder_temp ? f.extruder_temp + '°C' + (f.extruder_temp_min || f.extruder_temp_max ? ` (${f.extruder_temp_min || '?'}–${f.extruder_temp_max || '?'}°C)` : '') : '--'],
      [t('filament.db_bed_temp'), f.bed_temp ? f.bed_temp + '°C' + (f.bed_temp_min || f.bed_temp_max ? ` (${f.bed_temp_min || '?'}–${f.bed_temp_max || '?'}°C)` : '') : '--'],
      [t('filament.db_chamber_temp'), f.chamber_temp ? f.chamber_temp + '°C' : '--'],
      [t('filament.db_k_value'), f.pressure_advance_k != null ? f.pressure_advance_k : '--'],
      [t('filament.db_td_value'), f.td_value && f.td_value > 0 ? f.td_value + (f.total_td_votes ? ` (${f.total_td_votes} votes)` : '') : '--'],
      [t('filament.db_flow_ratio'), f.flow_ratio || '--'],
      [t('filament.db_volumetric'), f.max_volumetric_speed ? f.max_volumetric_speed + ' mm\u00B3/s' : '--'],
      [t('filament.db_fan_speed'), (f.fan_speed_min != null || f.fan_speed_max != null) ? `${f.fan_speed_min || 0}% - ${f.fan_speed_max || 100}%` : '--'],
      [t('filament.db_retraction'), f.retraction_distance != null ? f.retraction_distance + ' mm' + (f.retraction_speed ? ' @ ' + f.retraction_speed + ' mm/s' : '') : '--'],
      ['Density', f.density ? f.density + ' g/cm\u00B3' : '--'],
      ['Diameter', f.diameter ? f.diameter + ' mm' : '1.75 mm'],
      [t('filament.db_finish') || 'Finish', f.finish || '--'],
      [t('filament.db_spool_type') || 'Spooltype', f.spool_type || '--'],
      [t('filament.db_spool_weight') || 'Spoolvekt', f.spool_weight ? f.spool_weight + 'g' : '--'],
    ];
    // Only show visual properties if they have values
    if (f.translucent) fields.push([t('filament.translucent') || 'Transparent', 'Ja']);
    if (f.glow) fields.push([t('filament.glow') || 'Glow-in-dark', 'Ja']);
    if (f.pattern) fields.push([t('filament.db_pattern') || 'Mønster', f.pattern]);
    if (f.multi_color_direction) fields.push([t('filament.multi_color') || 'Flerfarge', f.multi_color_direction]);
    fields.push(
      [t('filament.db_price'), f.price ? '$' + f.price + (f.price_currency && f.price_currency !== 'USD' ? ' ' + f.price_currency : '') : '--'],
      [t('filament.db_source'), f.source || '--']
    );

    let html = `<div class="inv-modal-backdrop" onclick="if(event.target===this)this.remove()">
      <div class="inv-modal" style="max-width:520px;max-height:90vh;overflow-y:auto">
        <div class="inv-modal-header">
          <span>${esc(f.manufacturer || '')} — ${esc(f.name || f.material)}</span>
          <button class="inv-modal-close" onclick="this.closest('.inv-modal-backdrop').remove()">&times;</button>
        </div>
        <div class="inv-modal-body">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
            <div style="flex-shrink:0">${typeof spoolIcon === 'function' ? spoolIcon(color, 48) : `<div style="width:48px;height:48px;border-radius:8px;background:${color};border:2px solid var(--border-color)"></div>`}</div>
            <div>
              <div style="font-weight:600;font-size:1rem">${esc(f.name || f.material)}</div>
              <div class="text-muted text-sm">${esc(f.manufacturer || '')} &middot; ${esc(f.material)}${f.material_type ? ' ' + esc(f.material_type) : ''}</div>
              ${f.color_name ? '<div class="text-muted" style="font-size:0.75rem">' + esc(f.color_name) + (f.color_hex ? ' #' + f.color_hex : '') + '</div>' : ''}
            </div>
          </div>
          <div class="db-detail-grid">`;
    for (const [label, val] of fields) {
      if (val === '--' || val === '-- mm' || val === null) continue;
      html += `<div class="db-detail-field"><div class="db-detail-label">${label}</div><div class="db-detail-value">${val}</div></div>`;
    }
    html += '</div>';
    if (f.tips) html += `<div style="margin-top:8px;padding:8px;background:var(--bg-tertiary);border-radius:6px;font-size:0.8rem"><strong>Tips:</strong> ${esc(f.tips)}</div>`;
    if (f.purchase_url) html += `<div style="margin-top:8px"><a href="${esc(f.purchase_url)}" target="_blank" rel="noopener" class="form-btn form-btn-sm" style="display:inline-flex;align-items:center;gap:4px"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg> ${t('filament.db_buy')}</a></div>`;
    // Community rating
    const avgRating = f.rating_count > 0 ? (f.rating_sum / f.rating_count) : 0;
    html += `<div style="margin-top:10px;display:flex;align-items:center;gap:8px">
      <span style="font-size:0.8rem;font-weight:600">${t('filament.community_rating')}:</span>
      <span style="display:flex;gap:2px">${[1,2,3,4,5].map(i => `<span id="cf-star-${i}" style="cursor:pointer;font-size:1.1rem;color:${i <= Math.round(avgRating) ? 'var(--accent-orange)' : 'var(--text-muted)'}" onclick="window._rateCommunityFilament(${f.id},${i})">&#9733;</span>`).join('')}</span>
      ${f.rating_count > 0 ? `<span class="text-muted" style="font-size:0.75rem">(${avgRating.toFixed(1)} / ${f.rating_count})</span>` : `<span class="text-muted" style="font-size:0.75rem">${t('filament.no_ratings')}</span>`}
    </div>`;
    // TD voting
    html += `<div style="margin-top:10px;padding:8px;background:var(--bg-tertiary);border-radius:6px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
        <span style="font-size:0.8rem;font-weight:600">${t('filament.db_td_value')}:</span>
        <span style="font-size:0.9rem;font-weight:700;color:var(--accent-orange)">${f.td_value && f.td_value > 0 ? f.td_value : '--'}</span>
        ${f.total_td_votes ? `<span class="text-muted" style="font-size:0.7rem">(${f.total_td_votes} ${t('filament.td_votes_count')})</span>` : ''}
      </div>
      <div class="flex gap-sm" style="align-items:flex-end">
        <div class="form-group" style="width:90px;margin:0">
          <label class="form-label" style="font-size:0.65rem">${t('filament.td_your_value')}</label>
          <input class="form-input" id="td-vote-${f.id}" type="number" step="0.01" placeholder="e.g. 1.42" style="font-size:0.8rem">
        </div>
        <button class="form-btn form-btn-sm" onclick="window._submitTdVote(${f.id})">${t('filament.td_submit')}</button>
      </div>
    </div>`;
    if (f.shared_by) html += `<div class="text-muted" style="font-size:0.7rem;margin-top:4px">${t('filament.shared_by')}: ${esc(f.shared_by)}</div>`;
    html += `</div>
        <div class="inv-modal-footer">
          ${window._can && window._can('filament') ? `<button class="form-btn" onclick="window._dbImport(${f.id});this.closest('.inv-modal-backdrop').remove()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            ${t('filament.db_add_to_inventory')}
          </button>
          <button class="form-btn form-btn-sm" onclick="window._dbImport(${f.id},true);this.closest('.inv-modal-backdrop').remove()">${t('filament.db_add_with_spool')}</button>` : ''}
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  }

  async function _dbImport(id, createSpool = false) {
    try {
      const res = await fetch('/api/community-filaments/import-to-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, create_spool: createSpool })
      });
      const data = await res.json();
      if (data.ok) {
        showToast(t('filament.db_imported'), 'success');
      } else {
        showToast(data.error || 'Error', 'error');
      }
    } catch (e) {
      showToast(e.message, 'error');
    }
  }

  function _dbToggleCompare(id) {
    const idx = _dbCompare.indexOf(id);
    if (idx >= 0) _dbCompare.splice(idx, 1);
    else if (_dbCompare.length < 4) _dbCompare.push(id);
    else { showToast('Max 4 filaments', 'warning'); return; }
    _refreshDbBrowser();
  }

  function _dbShowCompare() {
    if (_dbCompare.length < 2) return;
    const items = _dbCompare.map(id => _dbFilaments.find(f => f.id === id)).filter(Boolean);
    if (items.length < 2) return;

    const fields = ['material','material_type','extruder_temp','bed_temp','chamber_temp','pressure_advance_k','td_value','flow_ratio','max_volumetric_speed','fan_speed_min','fan_speed_max','retraction_distance','retraction_speed','density','price'];
    const labels = ['Material','Type','Nozzle Temp','Bed Temp','Chamber','K-Value','TD','Flow Ratio','Max Vol. Speed','Fan Min','Fan Max','Retract Dist.','Retract Speed','Density','Price'];
    // Fields where lower is better
    const lowerIsBetter = new Set(['price','retraction_distance','density']);

    let html = `<div class="inv-modal-backdrop" onclick="if(event.target===this)this.remove()">
      <div class="inv-modal" style="max-width:${items.length*200+120}px">
        <div class="inv-modal-header"><span>${t('filament.db_compare')}</span><button class="inv-modal-close" onclick="this.closest('.inv-modal-backdrop').remove()">&times;</button></div>
        <div class="inv-modal-body" style="overflow-x:auto">
          <table class="data-table"><thead><tr><th></th>`;
    for (const f of items) {
      const color = f.color_hex ? hexToRgb(f.color_hex) : '#888';
      html += `<th><div style="display:flex;flex-direction:column;align-items:center;gap:4px">${typeof spoolIcon === 'function' ? spoolIcon(color, 24) : `<span class="filament-color-swatch" style="background:${color};width:20px;height:20px;border-radius:50%;display:inline-block"></span>`}<span style="font-size:0.75rem">${esc(f.manufacturer||'')}</span><span style="font-size:0.7rem" class="text-muted">${esc(f.name||f.material)}</span></div></th>`;
    }
    html += '</tr></thead><tbody>';
    for (let i = 0; i < fields.length; i++) {
      const key = fields[i];
      const vals = items.map(f => f[key]);
      if (vals.every(v => v == null || v === '')) continue;
      // Find best/worst for numeric fields
      const numVals = vals.map(v => v != null ? parseFloat(v) : NaN).filter(n => !isNaN(n));
      const isNumeric = numVals.length >= 2 && !['material','material_type'].includes(key);
      const bestVal = isNumeric ? (lowerIsBetter.has(key) ? Math.min(...numVals) : Math.max(...numVals)) : null;
      const worstVal = isNumeric ? (lowerIsBetter.has(key) ? Math.max(...numVals) : Math.min(...numVals)) : null;
      html += `<tr><td style="font-weight:600;font-size:0.8rem">${labels[i]}</td>`;
      for (const v of vals) {
        let display = v != null ? String(v) : '--';
        if (key === 'price' && v) display = '$' + v;
        if (['extruder_temp','bed_temp','chamber_temp'].includes(key) && v) display += '\u00B0C';
        if (key === 'max_volumetric_speed' && v) display += ' mm\u00B3/s';
        if (['retraction_distance'].includes(key) && v) display += ' mm';
        if (['retraction_speed'].includes(key) && v) display += ' mm/s';
        if (key === 'density' && v) display += ' g/cm\u00B3';
        let style = 'font-size:0.8rem';
        if (isNumeric && v != null && bestVal !== worstVal) {
          const n = parseFloat(v);
          if (n === bestVal) style += ';color:var(--accent-green);font-weight:600';
          else if (n === worstVal) style += ';color:var(--accent-red)';
        }
        html += `<td style="${style}">${display}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table></div></div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
  }

  // DB Browser interaction handlers
  window._dbOnSearch = function(val) {
    clearTimeout(_dbSearchTimer);
    _dbSearchTimer = setTimeout(() => {
      _dbSearch = val;
      _dbPage = 0;
      _loadDbFilaments();
    }, 300);
  };
  window._dbSetBrand = function(v) { _dbFilterBrand = v; _dbPage = 0; _loadDbFilaments(); };
  window._dbSetMaterial = function(v) { _dbFilterMaterial = v; _dbPage = 0; _loadDbFilaments(); };
  window._dbSetCategory = function(v) { _dbFilterCategory = v; _dbPage = 0; _loadDbFilaments(); };
  window._dbToggleK = function(v) { _dbFilterHasK = v; _dbPage = 0; _loadDbFilaments(); };
  window._dbToggleTd = function(v) { _dbFilterHasTd = v; _dbPage = 0; _loadDbFilaments(); };
  window._dbToggleTranslucent = function(v) { _dbFilterTranslucent = v; _dbPage = 0; _loadDbFilaments(); };
  window._dbToggleGlow = function(v) { _dbFilterGlow = v; _dbPage = 0; _loadDbFilaments(); };
  window._dbToggleMultiColor = function(v) { _dbFilterMultiColor = v; _dbPage = 0; _loadDbFilaments(); };
  window._dbSetSort = function(v) { _dbSort = v; _dbPage = 0; _loadDbFilaments(); };
  window._dbToggleSortDir = function() { _dbSortDir = _dbSortDir === 'ASC' ? 'DESC' : 'ASC'; _loadDbFilaments(); };
  window._dbSetView = function(v) { _dbViewMode = v; localStorage.setItem('db-view-mode', v); _refreshDbBrowser(); };
  window._dbPrevPage = function() { if (_dbPage > 0) { _dbPage--; _loadDbFilaments(); } };
  window._dbNextPage = function() { if ((_dbPage + 1) * _dbPageSize < _dbTotal) { _dbPage++; _loadDbFilaments(); } };
  window._dbShowDetail = _dbShowDetail;
  window._dbImport = _dbImport;
  window._dbToggleCompare = _dbToggleCompare;
  window._dbShowCompare = _dbShowCompare;
  window._dbClearCompare = function() { _dbCompare = []; _refreshDbBrowser(); };

  let _materialsCache = null;

  async function _loadMaterials() {
    const el = document.getElementById('matref-container');
    if (!el) return;
    try {
      if (!_materialsCache) {
        const res = await fetch('/api/materials');
        _materialsCache = await res.json();
      }
      _renderMaterials(_materialsCache, el);
    } catch (e) {
      el.innerHTML = `<div class="text-muted">Error: ${e.message}</div>`;
    }
  }

  function _renderMaterials(materials, el) {
    const filter = document.getElementById('matref-category-filter')?.value || '';
    const filtered = filter ? materials.filter(m => m.category === filter) : materials;
    if (!filtered.length) { el.innerHTML = `<div class="text-muted">${t('filament.no_materials')}</div>`; return; }

    let html = '<div class="fil-matref-grid">';
    for (const m of filtered) {
      const tips = m.tips ? (() => { try { return JSON.parse(m.tips); } catch { return {}; } })() : {};
      const badges = [];
      if (m.abrasive) badges.push('<span class="fil-matref-badge fil-matref-abrasive">Abrasive</span>');
      if (m.food_safe) badges.push('<span class="fil-matref-badge fil-matref-foodsafe">Food Safe</span>');
      if (m.uv_resistant) badges.push('<span class="fil-matref-badge fil-matref-uv">UV Resistant</span>');
      if (m.enclosure) badges.push('<span class="fil-matref-badge fil-matref-enclosure">Enclosure</span>');

      html += `<div class="fil-matref-card" onclick="showMaterialDetail(${m.id})">
        <div class="fil-matref-header">
          <strong>${m.material}</strong>
          <span class="fil-matref-cat">${m.category}</span>
        </div>
        <div class="fil-matref-bars">
          ${_matBar(t('filament.mat_difficulty'), m.difficulty, '#e74c3c')}
          ${_matBar(t('filament.mat_strength'), m.strength, '#3498db')}
          ${_matBar(t('filament.mat_temp_res'), m.temp_resistance, '#e67e22')}
          ${_matBar(t('filament.mat_flexibility'), m.flexibility, '#2ecc71')}
        </div>
        <div class="fil-matref-temps">
          ${m.nozzle_temp_min && m.nozzle_temp_max ? `<span>Nozzle: ${m.nozzle_temp_min}-${m.nozzle_temp_max}°C</span>` : ''}
          ${m.bed_temp_min && m.bed_temp_max ? `<span>Bed: ${m.bed_temp_min}-${m.bed_temp_max}°C</span>` : ''}
        </div>
        ${badges.length ? `<div class="fil-matref-badges">${badges.join('')}</div>` : ''}
      </div>`;
    }
    html += '</div>';
    el.innerHTML = html;
  }

  function _matBar(label, value, color) {
    const pct = (value / 5) * 100;
    return `<div class="fil-matref-bar-row"><span class="fil-matref-bar-label">${label}</span><div class="fil-matref-bar"><div class="fil-matref-bar-fill" style="width:${pct}%;background:${color}"></div></div><span class="fil-matref-bar-val">${value}/5</span></div>`;
  }

  window.filterMaterials = function() {
    if (_materialsCache) {
      const el = document.getElementById('matref-container');
      if (el) _renderMaterials(_materialsCache, el);
    }
  };

  window.showMaterialDetail = async function(id) {
    try {
      const res = await fetch(`/api/materials/${id}`);
      const m = await res.json();
      const tips = m.tips ? (() => { try { return JSON.parse(m.tips); } catch { return {}; } })() : {};

      let html = `<div class="modal-overlay" id="material-detail-modal">
        <div class="modal-content" style="max-width:500px">
          <div class="modal-header"><h3>${m.material}</h3>
            <button class="modal-close" onclick="document.getElementById('material-detail-modal').remove()">&times;</button></div>
          <div class="modal-body">
            <div class="fil-matref-detail-grid">
              <div class="fil-matref-detail-section">
                <h4>${t('filament.mat_properties')}</h4>
                ${_matBar(t('filament.mat_difficulty'), m.difficulty, '#e74c3c')}
                ${_matBar(t('filament.mat_strength'), m.strength, '#3498db')}
                ${_matBar(t('filament.mat_temp_res'), m.temp_resistance, '#e67e22')}
                ${_matBar(t('filament.mat_moisture'), m.moisture_sensitivity, '#9b59b6')}
                ${_matBar(t('filament.mat_flexibility'), m.flexibility, '#2ecc71')}
                ${_matBar(t('filament.mat_adhesion'), m.layer_adhesion, '#1abc9c')}
              </div>
              <div class="fil-matref-detail-section">
                <h4>${t('filament.mat_temps')}</h4>
                ${m.nozzle_temp_min ? `<div>Nozzle: ${m.nozzle_temp_min} - ${m.nozzle_temp_max}°C</div>` : ''}
                ${m.bed_temp_min ? `<div>Bed: ${m.bed_temp_min} - ${m.bed_temp_max}°C</div>` : ''}
                ${m.chamber_temp ? `<div>Chamber: ${m.chamber_temp}°C</div>` : ''}
                ${m.typical_density ? `<div>Density: ${m.typical_density} g/cm³</div>` : ''}
                ${m.nozzle_recommendation ? `<div>Nozzle: ${m.nozzle_recommendation}</div>` : ''}
              </div>
            </div>
            ${tips.print ? `<div class="fil-matref-tip"><strong>${t('filament.mat_tip_print')}:</strong> ${tips.print}</div>` : ''}
            ${tips.storage ? `<div class="fil-matref-tip"><strong>${t('filament.mat_tip_storage')}:</strong> ${tips.storage}</div>` : ''}
            ${tips.post ? `<div class="fil-matref-tip"><strong>${t('filament.mat_tip_post')}:</strong> ${tips.post}</div>` : ''}
          </div>
        </div>
      </div>`;
      document.body.insertAdjacentHTML('beforeend', html);
    } catch (e) { showToast(e.message, 'error'); }
  };

  // ═══ Forecast Chart ═══
  function _renderForecastChart(predictions) {
    const container = document.getElementById('forecast-chart-container');
    if (!container || !predictions?.per_spool?.length) {
      if (container) container.innerHTML = '<p class="text-muted" style="text-align:center;padding:16px;font-size:0.8rem">No usage data to forecast</p>';
      return;
    }

    const spools = predictions.per_spool
      .filter(s => s.avg_daily_g > 0 && s.remaining_weight_g > 0)
      .slice(0, 5); // Top 5 most active spools

    if (spools.length === 0) {
      container.innerHTML = '<p class="text-muted" style="text-align:center;padding:16px;font-size:0.8rem">No active spools to forecast</p>';
      return;
    }

    const days = 30;
    const W = 600, H = 200, PAD = 40;
    const colors = ['var(--accent-blue)', 'var(--accent-green)', 'var(--accent-orange)', 'var(--accent-red)', 'var(--accent-purple)'];

    let svg = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-height:200px">`;

    // Grid lines
    for (let i = 0; i <= 4; i++) {
      const y = PAD + (H - 2 * PAD) * i / 4;
      svg += `<line x1="${PAD}" y1="${y}" x2="${W - 10}" y2="${y}" stroke="var(--border-color)" stroke-width="0.5"/>`;
    }

    // X-axis labels (days)
    for (let d = 0; d <= days; d += 5) {
      const x = PAD + (W - PAD - 10) * d / days;
      svg += `<text x="${x}" y="${H - 5}" font-size="9" fill="var(--text-muted)" text-anchor="middle">${d}d</text>`;
    }

    // Max weight for Y scale
    const maxWeight = Math.max(...spools.map(s => s.remaining_weight_g));

    // Y-axis labels
    for (let i = 0; i <= 4; i++) {
      const val = Math.round(maxWeight * (4 - i) / 4);
      const y = PAD + (H - 2 * PAD) * i / 4;
      svg += `<text x="${PAD - 4}" y="${y + 3}" font-size="9" fill="var(--text-muted)" text-anchor="end">${val}g</text>`;
    }

    // Draw lines for each spool
    spools.forEach((spool, idx) => {
      let points = [];
      for (let d = 0; d <= days; d++) {
        const remaining = Math.max(0, spool.remaining_weight_g - spool.avg_daily_g * d);
        const x = PAD + (W - PAD - 10) * d / days;
        const y = PAD + (H - 2 * PAD) * (1 - remaining / maxWeight);
        points.push(`${x},${y}`);
      }
      svg += `<polyline points="${points.join(' ')}" fill="none" stroke="${colors[idx]}" stroke-width="2" stroke-linecap="round"/>`;
    });

    svg += '</svg>';

    // Legend
    svg += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;font-size:0.7rem">';
    spools.forEach((spool, idx) => {
      const name = spool.name || spool.material || `Spool ${spool.id}`;
      const daysLeft = spool.avg_daily_g > 0 ? Math.round(spool.remaining_weight_g / spool.avg_daily_g) : '\u221E';
      svg += `<span style="display:flex;align-items:center;gap:3px"><span style="width:8px;height:8px;border-radius:50%;background:${colors[idx]}"></span>${esc(name)} (${daysLeft}d)</span>`;
    });
    svg += '</div>';

    container.innerHTML = svg;
  }

  // ═══ Legacy compat: old /api/filament still works for backward compat ═══
  window.showAddFilamentForm = window.showAddSpoolForm;
  window.showGlobalAddFilament = window.showAddSpoolForm;
  window.deleteFilamentSpool = window.deleteSpoolItem;

})();
