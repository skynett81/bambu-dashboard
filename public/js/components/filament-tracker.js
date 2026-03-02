// Filament Inventory Tracker — Modular with Tabs, 3-tier model (vendors → profiles → spools)
(function() {

  // ═══ Constants & Helpers ═══
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

  const TYPE_COLORS = { 'PLA':'#00e676','PLA+':'#00c853','PETG':'#f0883e','TPU':'#9b4dff','ABS':'#ff5252','ASA':'#1279ff','PA':'#e3b341','PA-CF':'#d2a8ff','PET-CF':'#f778ba','PLA-CF':'#79c0ff','PC':'#8b949e','PLA Silk':'#ffd700','PLA Matte':'#7cb342','PETG-CF':'#ff9800' };

  function heroCard(icon, value, label, color) {
    return `<div class="fil-hero-card">
      <div class="fil-hero-icon" style="background:${color}15;color:${color}">${icon}</div>
      <div class="fil-hero-value" style="color:${color}">${value}</div>
      <div class="fil-hero-label">${label}</div>
    </div>`;
  }

  // ═══ Tab config ═══
  const TAB_CONFIG = {
    inventory: { label: 'filament.tab_inventory', modules: ['spool-summary', 'active-filament', 'low-stock-alert', 'spool-grid'] },
    drying:    { label: 'filament.tab_drying',    modules: ['active-drying', 'drying-history', 'drying-presets'] },
    tools:     { label: 'filament.tab_tools',     modules: ['checked-out', 'color-card', 'nfc-manager', 'spool-timeline', 'material-ref'] },
    manage:    { label: 'filament.tab_manage',    modules: ['vendors-list', 'filament-profiles-list', 'locations-list', 'locations-dnd'] },
    stats:     { label: 'filament.tab_stats',     modules: ['type-breakdown', 'brand-breakdown', 'cost-summary', 'stock-health', 'usage-predictions', 'cost-estimation', 'usage-history'] }
  };
  const MODULE_SIZE = {
    'spool-summary': 'full', 'active-filament': 'full',
    'low-stock-alert': 'full', 'spool-grid': 'full',
    'active-drying': 'full', 'drying-history': 'full', 'drying-presets': 'full',
    'checked-out': 'full', 'color-card': 'full', 'nfc-manager': 'full', 'spool-timeline': 'full', 'material-ref': 'full',
    'vendors-list': 'full', 'filament-profiles-list': 'full', 'locations-list': 'full', 'locations-dnd': 'full',
    'type-breakdown': 'half', 'brand-breakdown': 'half',
    'cost-summary': 'half', 'stock-health': 'half',
    'usage-predictions': 'full', 'cost-estimation': 'full', 'usage-history': 'full'
  };

  const STORAGE_PREFIX = 'filament-module-order-';
  const LOCK_KEY = 'filament-layout-locked';

  const _MOD_VER = 9;
  if (localStorage.getItem('filament-mod-ver') !== String(_MOD_VER)) {
    for (const tab of Object.keys(TAB_CONFIG)) localStorage.removeItem(STORAGE_PREFIX + tab);
    localStorage.setItem('filament-mod-ver', String(_MOD_VER));
  }

  let _activeTab = 'inventory';
  let _locked = localStorage.getItem(LOCK_KEY) !== '0';
  let _spools = [];        // New enriched spools from /api/inventory/spools
  let _vendors = [];
  let _profiles = [];
  let _locations = [];
  let _draggedMod = null;
  let _showArchived = false;
  let _dryingSessions = [];
  let _dryingPresets = [];
  let _dryingStatus = [];
  let _dryingTimers = {};
  let _filterMaterial = '';
  let _filterVendor = '';
  let _filterLocation = '';
  let _filterPrinter = 'all';

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

  // ═══ Persistence ═══
  function getOrder(tabId) {
    try { const o = JSON.parse(localStorage.getItem(STORAGE_PREFIX + tabId)); if (Array.isArray(o)) return o; } catch (_) {}
    return TAB_CONFIG[tabId]?.modules || [];
  }
  function saveOrder(tabId) {
    const cont = document.getElementById(`filament-tab-${tabId}`);
    if (!cont) return;
    const ids = [...cont.querySelectorAll('.stats-module[data-module-id]')].map(m => m.dataset.moduleId);
    localStorage.setItem(STORAGE_PREFIX + tabId, JSON.stringify(ids));
  }

  // ═══ Module builders ═══
  const BUILDERS = {
    'spool-summary': (spools) => {
      let totalRemaining = 0, totalValue = 0, lowStockCount = 0;
      const active = spools.filter(s => !s.archived);
      for (const s of active) {
        totalRemaining += s.remaining_weight_g || 0;
        if (s.cost) totalValue += s.cost;
        const pct = s.initial_weight_g > 0 ? (s.remaining_weight_g / s.initial_weight_g) * 100 : 0;
        if (pct < 20 && pct > 0) lowStockCount++;
      }
      const lowColor = lowStockCount > 0 ? '#f0883e' : '#00e676';
      return `<div class="fil-hero-grid">
        ${heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>', active.length, t('filament.total_spools'), '#1279ff')}
        ${heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>', fmtW(totalRemaining), t('filament.total_remaining'), '#00e676')}
        ${totalValue > 0 ? heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>', `${Math.round(totalValue)} kr`, t('filament.total_value'), '#e3b341') : ''}
        ${heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>', lowStockCount, t('filament.low_stock'), lowColor)}
      </div>`;
    },

    'low-stock-alert': (spools) => {
      const low = spools.filter(s => {
        if (s.archived) return false;
        const pct = s.initial_weight_g > 0 ? (s.remaining_weight_g / s.initial_weight_g) * 100 : 100;
        return pct < 20 && pct > 0;
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

      h += `<div class="inv-filter-bar">
        <input class="form-input form-input-sm inv-search-input" type="text" placeholder="${t('filament.search_placeholder')}" value="${esc(_searchQuery)}" oninput="window._invSearch(this.value)">
        <select class="form-input form-input-sm" onchange="window._invFilterMaterial(this.value)">
          <option value="">${t('filament.filter_all')} ${t('filament.filter_material')}</option>
          ${[...new Set(spools.map(s => s.material).filter(Boolean))].sort().map(m => `<option value="${m}" ${m === _filterMaterial ? 'selected' : ''}>${m}</option>`).join('')}
        </select>
        <select class="form-input form-input-sm" onchange="window._invFilterVendor(this.value)">
          <option value="">${t('filament.filter_all')} ${t('filament.filter_vendor')}</option>
          ${[...new Set(spools.map(s => s.vendor_name).filter(Boolean))].sort().map(v => `<option value="${v}" ${v === _filterVendor ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
        <select class="form-input form-input-sm" onchange="window._invFilterLocation(this.value)">
          <option value="">${t('filament.filter_all')} ${t('filament.filter_location')}</option>
          ${[...new Set(spools.map(s => s.location).filter(Boolean))].sort().map(l => `<option value="${l}" ${l === _filterLocation ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
        <select class="form-input form-input-sm" onchange="window._invSort(this.value)">
          <option value="recent" ${_sortBy === 'recent' ? 'selected' : ''}>${t('filament.sort_recent')}</option>
          <option value="name" ${_sortBy === 'name' ? 'selected' : ''}>${t('filament.sort_name')}</option>
          <option value="remaining_asc" ${_sortBy === 'remaining_asc' ? 'selected' : ''}>${t('filament.sort_remaining_asc')}</option>
          <option value="remaining_desc" ${_sortBy === 'remaining_desc' ? 'selected' : ''}>${t('filament.sort_remaining_desc')}</option>
        </select>
        <label class="inv-archive-toggle">
          <input type="checkbox" ${_showArchived ? 'checked' : ''} onchange="window._invToggleArchived(this.checked)">
          <span>${t('filament.show_archived')}</span>
        </label>
      </div>`;

      // Apply filters
      let filtered = spools.filter(s => {
        if (!_showArchived && s.archived) return false;
        if (_filterMaterial && s.material !== _filterMaterial) return false;
        if (_filterVendor && s.vendor_name !== _filterVendor) return false;
        if (_filterLocation && s.location !== _filterLocation) return false;
        if (_searchQuery) {
          const q = _searchQuery.toLowerCase();
          const fields = [s.profile_name, s.material, s.vendor_name, s.color_name, s.lot_number, s.location, s.comment, s.article_number].filter(Boolean);
          if (!fields.some(f => f.toLowerCase().includes(q))) return false;
        }
        return true;
      });

      // Sort
      filtered.sort((a, b) => {
        if (_sortBy === 'name') return (a.profile_name || '').localeCompare(b.profile_name || '');
        if (_sortBy === 'remaining_asc') return (a.remaining_weight_g || 0) - (b.remaining_weight_g || 0);
        if (_sortBy === 'remaining_desc') return (b.remaining_weight_g || 0) - (a.remaining_weight_g || 0);
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
        h += `<p class="text-muted" style="font-size:0.85rem;text-align:center;padding:20px 0">${_searchQuery ? t('filament.no_search_results') : t('filament.no_spools')}</p>`;
      } else {
        h += '<div class="filament-grid">';
        for (const s of pageSpools) h += renderSpoolCard(s);
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

    'vendors-list': () => {
      let h = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
        ${t('filament.vendors_title')}
      </div>`;

      if (_vendors.length === 0) {
        h += `<p class="text-muted" style="font-size:0.85rem">${t('filament.no_vendors')}</p>`;
      } else {
        h += '<table class="data-table"><thead><tr><th>' + t('filament.vendor_name') + '</th><th>' + t('filament.vendor_website') + '</th><th>' + t('filament.vendor_empty_spool') + '</th><th></th></tr></thead><tbody>';
        for (const v of _vendors) {
          h += `<tr>
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
      h += `<button class="form-btn form-btn-sm" data-ripple style="margin-top:8px" onclick="showAddVendorForm()">+ ${t('filament.vendor_add')}</button>`;
      return h;
    },

    'filament-profiles-list': () => {
      let h = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        ${t('filament.profiles_title')}
      </div>`;

      if (_profiles.length === 0) {
        h += `<p class="text-muted" style="font-size:0.85rem">${t('filament.no_profiles')}</p>`;
      } else {
        h += '<div class="filament-grid">';
        for (const p of _profiles) {
          const color = hexToRgb(p.color_hex);
          h += `<div class="filament-card inv-spool-card inv-profile-card">
            <div class="fil-spool-top">
              <div class="fil-spool-identity">
                <span class="filament-color-swatch" style="background:${color}"></span>
                <div>
                  <strong>${esc(p.name)}</strong>
                  <span class="text-muted" style="font-size:0.75rem">${esc(p.vendor_name || '--')}</span>
                </div>
              </div>
              <div class="fil-spool-actions">
                <button class="filament-edit-btn" onclick="editProfile(${p.id})" title="${t('settings.edit')}" data-tooltip="${t('settings.edit')}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                <button class="filament-delete-btn" onclick="deleteProfileItem(${p.id})" title="${t('settings.delete')}" data-tooltip="${t('settings.delete')}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
              </div>
            </div>
            <div class="fil-spool-meta">${esc(p.material)}${p.color_name ? ' · ' + esc(p.color_name) : ''} · ${p.spool_weight_g}g</div>
            <div class="fil-spool-meta text-muted" style="font-size:0.7rem">${p.nozzle_temp_min || p.nozzle_temp_max ? `🌡 ${p.nozzle_temp_min || '?'}–${p.nozzle_temp_max || '?'}°C` : ''} ${p.bed_temp_min || p.bed_temp_max ? `🛏 ${p.bed_temp_min || '?'}–${p.bed_temp_max || '?'}°C` : ''}${p.price ? ` · ${p.price} ${t('stats.currency')}` : ''}</div>
            ${p.finish || p.translucent || p.glow ? `<div class="fil-profile-badges">${p.finish ? `<span class="fil-badge">${t('filament.finish_' + p.finish)}</span>` : ''}${p.translucent ? `<span class="fil-badge">${t('filament.translucent')}</span>` : ''}${p.glow ? `<span class="fil-badge fil-badge-glow">${t('filament.glow')}</span>` : ''}</div>` : ''}
            ${p.pressure_advance_k || p.max_volumetric_speed || p.retraction_distance || p.cooling_fan_speed ? `<div class="fil-spool-meta text-muted" style="font-size:0.65rem;margin-top:2px">${[
              p.pressure_advance_k ? 'PA:' + p.pressure_advance_k : '',
              p.max_volumetric_speed ? 'Vol:' + p.max_volumetric_speed + 'mm³/s' : '',
              p.retraction_distance ? 'Ret:' + p.retraction_distance + 'mm' : '',
              p.cooling_fan_speed ? 'Fan:' + p.cooling_fan_speed + '%' : ''
            ].filter(Boolean).join(' · ')}</div>` : ''}
          </div>`;
        }
        h += '</div>';
      }

      h += `<div id="profile-form-container"></div>`;
      h += `<button class="form-btn form-btn-sm" data-ripple style="margin-top:8px" onclick="showAddProfileForm()">+ ${t('filament.profile_add')}</button>`;
      return h;
    },

    'locations-list': () => {
      let h = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        ${t('filament.locations_title')}
      </div>`;

      if (_locations.length === 0) {
        h += `<p class="text-muted" style="font-size:0.85rem">${t('filament.no_locations')}</p>`;
      } else {
        h += '<div class="inv-location-list">';
        for (const l of _locations) {
          h += `<div class="inv-location-item">
            <span>${esc(l.name)}${l.description ? ` <span class="text-muted">(${esc(l.description)})</span>` : ''}</span>
            <div>
              <button class="filament-edit-btn" onclick="editLocationItem(${l.id})" title="${t('settings.edit')}" data-tooltip="${t('settings.edit')}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
              <button class="filament-delete-btn" onclick="deleteLocationItem(${l.id})" data-tooltip="${t('settings.delete')}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
          </div>`;
        }
        h += '</div>';
      }

      h += `<div id="location-form-container"></div>`;
      h += `<button class="form-btn form-btn-sm" data-ripple style="margin-top:8px" onclick="showAddLocationForm()">+ ${t('filament.location_add')}</button>`;
      return h;
    },

    'locations-dnd': (spools) => {
      const active = spools.filter(s => !s.archived);
      if (active.length === 0 && _locations.length === 0) return '';
      let h = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        ${t('filament.locations_dnd_title')}
      </div>`;
      // Group spools by location
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
            <span class="filament-color-swatch" style="background:${color};width:10px;height:10px"></span>
            <span>${esc(s.profile_name || s.material || '--')} · ${Math.round(s.remaining_weight_g)}g</span>
          </div>`;
        }
        h += '</div>';
      }
      h += '</div>';
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
        byType[tp].remaining_g += s.remaining_weight_g || 0;
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
        const extra = avgKg ? ` · ${avgKg} kr/kg` : '';
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
      h += sRow(t('filament.total_invested'), `${Math.round(invested)} kr`);
      h += sRow(t('filament.total_used_value'), `${Math.round(usedValue)} kr`, 'var(--accent-orange)');
      h += sRow(t('filament.avg_cost_kg'), `${avgKg} kr/kg`);
      if (expensive) h += sRow(t('filament.most_expensive'), `${esc(expensive[0])} (${Math.round(expensive[1])} kr)`);
      h += '</div>';
      return h;
    },

    'stock-health': (spools) => {
      const active = spools.filter(s => !s.archived);
      if (active.length === 0) return '';
      let full = 0, half = 0, low = 0, empty = 0, totalPct = 0;
      for (const s of active) {
        const pct = s.initial_weight_g > 0 ? (s.remaining_weight_g / s.initial_weight_g) * 100 : 0;
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

    'usage-predictions': () => {
      let h = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        ${t('filament.usage_predictions')}
      </div>`;
      h += `<div id="usage-predictions-container"><span class="text-muted" style="font-size:0.8rem">Loading...</span></div>`;
      setTimeout(() => _loadUsagePredictions(), 0);
      return h;
    },

    'cost-estimation': () => {
      let h = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
        ${t('filament.cost_estimate')}
      </div>`;
      h += `<div id="cost-estimation-container"><span class="text-muted" style="font-size:0.8rem">Loading...</span></div>`;
      setTimeout(() => _loadCostEstimation(), 0);
      return h;
    },

    'usage-history': () => {
      let h = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        ${t('filament.usage_history')}
      </div>`;
      h += `<div id="usage-history-container"><span class="text-muted" style="font-size:0.8rem">Loading...</span></div>`;
      setTimeout(() => loadUsageHistory(), 0);
      return h;
    },

    // ── Drying modules ──
    'active-drying': () => {
      let h = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 100 20 10 10 0 000-20z"/><path d="M12 6v6l4 2"/></svg>
        ${t('filament.active_drying')}
      </div>`;
      if (!_dryingSessions || _dryingSessions.length === 0) {
        h += `<p class="text-muted" style="font-size:0.8rem;padding:8px 0">${t('filament.drying_no_active')}</p>`;
        return h;
      }
      for (const ds of _dryingSessions) {
        const startTime = new Date(ds.started_at + 'Z').getTime();
        const endTime = startTime + ds.duration_minutes * 60 * 1000;
        const now = Date.now();
        const elapsed = Math.max(0, now - startTime);
        const remaining = Math.max(0, endTime - now);
        const elapsedMin = Math.floor(elapsed / 60000);
        const remainMin = Math.floor(remaining / 60000);
        const remainH = Math.floor(remainMin / 60);
        const remainM = remainMin % 60;
        const pct = Math.min(100, Math.round((elapsed / (ds.duration_minutes * 60000)) * 100));
        const colorDot = ds.color_hex ? `<span class="fil-color-dot" style="background:#${ds.color_hex}"></span>` : '';
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
      // Start live countdown timers
      setTimeout(() => _startDryingTimers(), 0);
      return h;
    },

    'drying-history': () => {
      let h = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-6"/></svg>
        ${t('filament.drying_history')}
      </div>`;
      h += `<div id="drying-history-container"><span class="text-muted" style="font-size:0.8rem">Loading...</span></div>`;
      setTimeout(() => _loadDryingHistory(), 0);
      return h;
    },

    'drying-presets': () => {
      let h = `<div class="ctrl-card-title" style="display:flex;align-items:center;justify-content:space-between">
        <span style="display:flex;align-items:center;gap:6px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          ${t('filament.drying_presets')}
        </span>
        <button class="form-btn form-btn-sm" data-ripple onclick="showAddDryingPresetForm()">${t('filament.drying_preset_add')}</button>
      </div>`;
      h += `<div id="drying-presets-form" style="display:none"></div>`;
      if (!_dryingPresets || _dryingPresets.length === 0) {
        h += `<p class="text-muted" style="font-size:0.8rem;padding:8px 0">No presets</p>`;
        return h;
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
      return h;
    },

    // ── Tools tab modules ──
    'checked-out': () => {
      let h = `<div class="ctrl-card-title" style="display:flex;align-items:center;justify-content:space-between">
        <span style="display:flex;align-items:center;gap:6px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          ${t('filament.checked_out_spools')}
        </span>
      </div>`;
      h += `<div id="checked-out-container"><span class="text-muted" style="font-size:0.8rem">Loading...</span></div>`;
      setTimeout(() => _loadCheckedOut(), 0);
      return h;
    },

    'color-card': () => {
      let h = `<div class="ctrl-card-title" style="display:flex;align-items:center;justify-content:space-between">
        <span style="display:flex;align-items:center;gap:6px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2"/><circle cx="8" cy="8" r="2"/><circle cx="16" cy="8" r="2"/><circle cx="8" cy="16" r="2"/><circle cx="16" cy="16" r="2"/></svg>
          ${t('filament.color_card')}
        </span>
        <button class="form-btn form-btn-sm" data-ripple onclick="exportColorCard()">${t('filament.color_card_export')}</button>
      </div>`;
      h += `<div id="color-card-container"><span class="text-muted" style="font-size:0.8rem">Loading...</span></div>`;
      setTimeout(() => _loadColorCard(), 0);
      return h;
    },

    'nfc-manager': () => {
      let h = `<div class="ctrl-card-title" style="display:flex;align-items:center;justify-content:space-between">
        <span style="display:flex;align-items:center;gap:6px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8.32a7.43 7.43 0 010 7.36"/><path d="M9.46 6.21a11.76 11.76 0 010 11.58"/><path d="M12.91 4.1a16.09 16.09 0 010 15.8"/><path d="M16.37 2a20.42 20.42 0 010 20"/></svg>
          ${t('filament.nfc_manager')}
        </span>
        <button class="form-btn form-btn-sm" data-ripple onclick="startNfcScan()">${t('filament.nfc_scan')}</button>
      </div>`;
      h += `<div id="nfc-container"><span class="text-muted" style="font-size:0.8rem">Loading...</span></div>`;
      setTimeout(() => _loadNfcMappings(), 0);
      return h;
    },

    'spool-timeline': () => {
      let h = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        ${t('filament.spool_timeline')}
      </div>`;
      h += `<div id="timeline-container"><span class="text-muted" style="font-size:0.8rem">Loading...</span></div>`;
      setTimeout(() => _loadTimeline(), 0);
      return h;
    },

    'material-ref': () => {
      let h = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        ${t('filament.material_reference')}
      </div>`;
      h += `<div class="fil-matref-filter mb-sm">
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
      </div>`;
      h += `<div id="matref-container"><span class="text-muted" style="font-size:0.8rem">Loading...</span></div>`;
      setTimeout(() => _loadMaterials(), 0);
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

  function renderColorSwatch(s) {
    // Multi-color gradient swatch
    let hexes;
    try { hexes = s.multi_color_hexes ? JSON.parse(s.multi_color_hexes) : null; } catch { hexes = null; }
    if (hexes && hexes.length > 1) {
      const colors = hexes.map(h => hexToRgb(h));
      const dir = s.multi_color_direction === 'longitudinal' ? '90deg' : '180deg';
      return `<span class="filament-color-swatch" style="background:linear-gradient(${dir},${colors.join(',')})"></span>`;
    }
    return `<span class="filament-color-swatch" style="background:${hexToRgb(s.color_hex)}"></span>`;
  }

  function renderSpoolCard(s) {
    const pct = s.initial_weight_g > 0 ? Math.round((s.remaining_weight_g / s.initial_weight_g) * 100) : 0;
    const color = hexToRgb(s.color_hex);
    const isLow = pct < 20 && pct > 0;
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
    if (s.location) infoParts.push('📍' + esc(s.location));
    if (s.archived) infoParts.push('📦');
    const footerLeft = [
      s.printer_id ? '🖨 ' + esc(printerName(s.printer_id)) : '',
      s.ams_unit != null ? `AMS${s.ams_unit+1}:${(s.ams_tray||0)+1}` : ''
    ].filter(Boolean).join(' ');

    return `
      <div class="filament-card inv-spool-card ${lowClass} ${archivedClass}" data-spool-id="${s.id}">
        <div class="fil-spool-top">
          <div class="fil-spool-identity">
            <input type="checkbox" class="fil-bulk-check" onclick="toggleSpoolSelect(${s.id}, this)" ${_selectedSpools.has(s.id) ? 'checked' : ''} title="${t('filament.bulk_select')}">
            ${renderColorSwatch(s)}
            <strong>${esc(cleanName)}</strong>
          </div>
          <div class="fil-spool-actions">
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
            <button class="filament-edit-btn" onclick="showEditSpoolForm(${s.id})" title="${t('settings.edit')}" data-tooltip="${t('settings.edit')}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
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
          <span class="fil-bar-weight">${Math.round(s.remaining_weight_g)}g / ${Math.round(s.initial_weight_g)}g</span>
        </div>
        <div class="fil-spool-info">${infoParts.join(' · ')}${dryIcon}${compatIcon}</div>
        <div class="fil-spool-footer">
          <span>${footerLeft}</span>
          <span>${s.cost ? s.cost + ' kr' : ''}</span>
        </div>
        ${s.extra_fields ? renderExtraFields(s.extra_fields) : ''}
        <div id="spool-edit-${s.id}" style="display:none"></div>
      </div>`;
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
    if (!state) return `<p class="text-muted" style="font-size:0.8rem">${t('common.no_ams_data')}</p>`;
    const ids = state.getPrinterIds();
    if (ids.length === 0) return `<p class="text-muted" style="font-size:0.8rem">${t('common.no_ams_data')}</p>`;

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
              <div class="fil-ams-color" style="background:${color};${light ? 'border:1px solid var(--border-color);' : ''}"></div>
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
    if (!hasAny) html += `<p class="text-muted" style="font-size:0.8rem">${t('common.no_ams_data')}</p>`;
    return html;
  }

  // ═══ Tab switching ═══
  function switchTab(tabId) {
    _activeTab = tabId;
    document.querySelectorAll('.filament-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
    document.querySelectorAll('.filament-tab-panel').forEach(p => {
      const isActive = p.id === `filament-tab-${tabId}`;
      p.classList.toggle('active', isActive);
      p.style.display = isActive ? 'grid' : 'none';
      if (isActive) {
        p.classList.add('ix-tab-panel');
        p.addEventListener('animationend', () => p.classList.remove('ix-tab-panel'), { once: true });
      }
    });
    const slug = tabId === 'inventory' ? 'filament' : `filament/${tabId}`;
    if (location.hash !== '#' + slug) history.replaceState(null, '', '#' + slug);
  }

  // ═══ Module Drag & Drop ═══
  function initModuleDrag(container, tabId) {
    container.addEventListener('dragstart', e => {
      const mod = e.target.closest('.stats-module');
      if (!mod || _locked) { e.preventDefault(); return; }
      _draggedMod = mod;
      mod.classList.add('stats-module-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');
    });
    container.addEventListener('dragover', e => {
      e.preventDefault();
      if (!_draggedMod || _locked) return;
      e.dataTransfer.dropEffect = 'move';
      const target = e.target.closest('.stats-module');
      if (target && target !== _draggedMod) {
        const rect = target.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (e.clientY < midY) container.insertBefore(_draggedMod, target);
        else container.insertBefore(_draggedMod, target.nextSibling);
      }
    });
    container.addEventListener('drop', e => {
      e.preventDefault();
      if (_draggedMod) { _draggedMod.classList.remove('stats-module-dragging'); saveOrder(tabId); _draggedMod = null; }
    });
    container.addEventListener('dragend', () => {
      if (_draggedMod) { _draggedMod.classList.remove('stats-module-dragging'); _draggedMod = null; }
    });
  }

  // ═══ Main render ═══
  async function loadFilament() {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;

    const hashParts = location.hash.replace('#', '').split('/');
    if (hashParts[0] === 'filament' && hashParts[1]) {
      if (hashParts[1] === 'printer' && hashParts[2]) {
        _filterPrinter = hashParts[2];
      } else if (TAB_CONFIG[hashParts[1]]) {
        _activeTab = hashParts[1];
      }
    }

    try {
      // Fetch all data in parallel
      const [spoolsRes, vendorsRes, profilesRes, locationsRes, dryingActiveRes, dryingPresetsRes, dryingStatusRes] = await Promise.all([
        fetch('/api/inventory/spools'),
        fetch('/api/inventory/vendors'),
        fetch('/api/inventory/filaments'),
        fetch('/api/inventory/locations'),
        fetch('/api/inventory/drying/sessions/active'),
        fetch('/api/inventory/drying/presets'),
        fetch('/api/inventory/drying/status')
      ]);
      _spools = await spoolsRes.json();
      _vendors = await vendorsRes.json();
      _profiles = await profilesRes.json();
      _locations = await locationsRes.json();
      _dryingSessions = await dryingActiveRes.json();
      _dryingPresets = await dryingPresetsRes.json();
      _dryingStatus = await dryingStatusRes.json();
      // Clear old drying timers
      for (const tid of Object.values(_dryingTimers)) clearInterval(tid);
      _dryingTimers = {};

      let html = '';

      // ── Top bar ──
      const lockIcon = _locked
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>';
      html += `<div class="tele-top-bar">
        <button class="form-btn" data-ripple onclick="showAddSpoolForm()" style="display:flex;align-items:center;gap:4px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>${t('filament.add_spool')}</span>
        </button>
        <button class="form-btn form-btn-sm" data-ripple onclick="showSpoolmanDbBrowser()" style="display:flex;align-items:center;gap:4px" title="${t('filament.browse_spoolmandb')}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <span>SpoolmanDB</span>
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
          </div>
        </div>
        <button class="form-btn form-btn-sm" data-ripple onclick="openQrScanner()" style="display:flex;align-items:center;gap:4px" title="${t('filament.scan_qr')}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3z"/><path d="M20 14v7h-7"/></svg>
        </button>
        <div style="flex:1"></div>
        <button class="form-btn form-btn-sm" data-ripple onclick="showInventorySettings()" title="${t('filament.settings')}" style="display:flex;align-items:center;gap:4px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        </button>
        <button class="tele-lock-btn ${_locked ? '' : 'active'}" onclick="toggleFilamentLock()" title="${_locked ? t('filament.layout_locked') : t('filament.layout_unlocked')}">${lockIcon}</button>
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

      // ── Tab bar ──
      html += '<div class="tabs">';
      for (const [id, cfg] of Object.entries(TAB_CONFIG)) {
        html += `<button class="tab-btn filament-tab-btn ${id === _activeTab ? 'active' : ''}" data-tab="${id}" onclick="switchFilamentTab('${id}')">${t(cfg.label)}</button>`;
      }
      html += '</div>';

      // Global form container
      html += `<div id="inv-global-form" style="display:none"></div>`;

      // ── Tab panels ──
      for (const [tabId, cfg] of Object.entries(TAB_CONFIG)) {
        const order = getOrder(tabId);
        html += `<div class="tab-panel filament-tab-panel stats-tab-panel ${tabId === _activeTab ? 'active' : ''}" id="filament-tab-${tabId}" style="display:${tabId === _activeTab ? 'grid' : 'none'}">`;
        for (const modId of order) {
          const builder = BUILDERS[modId];
          if (!builder) continue;
          const content = builder(filteredSpools);
          if (!content) continue;
          const draggable = _locked ? '' : 'draggable="true"';
          const unlocked = _locked ? '' : ' stats-module-unlocked';
          const isFull = (MODULE_SIZE[modId] || 'full') === 'full';
          html += `<div class="stats-module${unlocked}${isFull ? ' stats-module-full' : ''}" data-module-id="${modId}" ${draggable}>`;
          if (!_locked) html += '<div class="stats-module-handle" title="Drag to reorder">&#x2630;</div>';
          html += content;
          html += '</div>';
        }
        html += '</div>';
      }

      panel.innerHTML = html;

      for (const tabId of Object.keys(TAB_CONFIG)) {
        const cont = document.getElementById(`filament-tab-${tabId}`);
        if (cont) initModuleDrag(cont, tabId);
      }

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
        container.innerHTML = `<p class="text-muted" style="font-size:0.8rem">${t('filament.no_data')}</p>`;
        return;
      }
      let html = '<table class="data-table"><thead><tr><th>' + t('history.date') + '</th><th>' + t('filament.profile_name') + '</th><th>' + t('filament.usage_weight') + '</th><th>' + t('filament.usage_source') + '</th></tr></thead><tbody>';
      for (const entry of log) {
        const date = entry.timestamp ? new Date(entry.timestamp).toLocaleString(window.i18n?.getLocale?.() || 'nb') : '--';
        const src = entry.source === 'auto' ? t('filament.usage_auto') : t('filament.usage_manual');
        html += `<tr>
          <td>${date}</td>
          <td><span class="filament-color-swatch" style="background:${hexToRgb(entry.color_hex)};width:10px;height:10px;display:inline-block;border-radius:50%;margin-right:4px"></span>${esc(entry.profile_name || '--')} <span class="text-muted">${esc(entry.vendor_name || '')}</span></td>
          <td>${Math.round(entry.used_weight_g * 10) / 10}g</td>
          <td><span class="inv-source-badge inv-source-${entry.source}">${src}</span></td>
        </tr>`;
      }
      html += '</tbody></table>';
      container.innerHTML = html;
    } catch (e) {
      container.innerHTML = `<p class="text-muted" style="font-size:0.8rem">${t('filament.load_failed')}</p>`;
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
    for (const l of _locations) {
      html += `<option value="${esc(l.name)}" ${l.name === selected ? 'selected' : ''}>${esc(l.name)}</option>`;
    }
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
  window.toggleFilamentLock = function() {
    _locked = !_locked;
    localStorage.setItem(LOCK_KEY, _locked ? '1' : '0');
    loadFilament();
  };

  // Filter callbacks
  window._invFilterMaterial = function(v) { _filterMaterial = v; _currentPage = 0; loadFilament(); };
  window._invFilterVendor = function(v) { _filterVendor = v; _currentPage = 0; loadFilament(); };
  window._invFilterLocation = function(v) { _filterLocation = v; _currentPage = 0; loadFilament(); };
  window._invSort = function(v) { _sortBy = v; loadFilament(); };
  window._invToggleArchived = function(v) { _showArchived = v; _currentPage = 0; loadFilament(); };
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

  window.showEditSpoolForm = function(spoolId) {
    const container = document.getElementById(`spool-edit-${spoolId}`);
    if (!container) return;
    const spool = _spools.find(s => s.id === spoolId);
    if (!spool) return;
    container.style.display = '';
    container.innerHTML = renderSpoolForm(spool);
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
            <div class="form-group" style="flex:1;min-width:120px">
              <label class="form-label">${t('filament.comment')}</label>
              <input class="form-input" id="sp-comment-${id}" value="${spool?.comment || ''}">
            </div>
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
      extra_fields: _collectExtraFields('sp-new')
    };
    data.remaining_weight_g = Math.max(0, data.initial_weight_g - data.used_weight_g);
    await fetch('/api/inventory/spools', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
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
      extra_fields: _collectExtraFields(`sp-${id}`)
    };
    data.remaining_weight_g = Math.max(0, data.initial_weight_g - data.used_weight_g);
    await fetch(`/api/inventory/spools/${spoolId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    loadFilament();
  };

  window.hideGlobalSpoolForm = function() {
    const c = document.getElementById('inv-global-form');
    if (c) { c.style.display = 'none'; c.innerHTML = ''; }
  };

  window.hideSpoolEdit = function(spoolId) {
    const c = document.getElementById(`spool-edit-${spoolId}`);
    if (c) { c.style.display = 'none'; c.innerHTML = ''; }
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
        <button class="filament-delete-btn" onclick="this.parentElement.remove()" type="button" style="opacity:1"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
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
      <button class="filament-delete-btn" onclick="this.parentElement.remove()" type="button" style="opacity:1"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
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
      </div>
      <div class="flex gap-sm" style="flex-wrap:wrap">
        <div class="form-group" style="width:80px"><label class="form-label">${t('filament.profile_nozzle_temp')} ${t('filament.temp_min')}</label><input class="form-input" id="${pfx}-nozzle-min" type="number" value="${profile?.nozzle_temp_min || ''}"></div>
        <div class="form-group" style="width:80px"><label class="form-label">${t('filament.profile_nozzle_temp')} ${t('filament.temp_max')}</label><input class="form-input" id="${pfx}-nozzle-max" type="number" value="${profile?.nozzle_temp_max || ''}"></div>
        <div class="form-group" style="width:80px"><label class="form-label">${t('filament.profile_bed_temp')} ${t('filament.temp_min')}</label><input class="form-input" id="${pfx}-bed-min" type="number" value="${profile?.bed_temp_min || ''}"></div>
        <div class="form-group" style="width:80px"><label class="form-label">${t('filament.profile_bed_temp')} ${t('filament.temp_max')}</label><input class="form-input" id="${pfx}-bed-max" type="number" value="${profile?.bed_temp_max || ''}"></div>
        <div class="form-group" style="width:100px"><label class="form-label">${t('filament.article_number')}</label><input class="form-input" id="${pfx}-article" value="${profile?.article_number || ''}"></div>
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
      <div class="flex gap-sm" style="flex-wrap:wrap;margin-top:4px">
        <div style="font-size:0.75rem;width:100%;color:var(--text-muted);font-weight:600">${t('filament.optimal_settings')}</div>
        <div class="form-group" style="width:90px"><label class="form-label">${t('filament.pressure_advance')}</label><input class="form-input" id="${pfx}-pa-k" type="number" step="0.001" value="${profile?.pressure_advance_k || ''}"></div>
        <div class="form-group" style="width:100px"><label class="form-label">${t('filament.max_volumetric_speed')}</label><input class="form-input" id="${pfx}-max-vol" type="number" step="0.1" value="${profile?.max_volumetric_speed || ''}"></div>
        <div class="form-group" style="width:90px"><label class="form-label">${t('filament.retraction_distance')}</label><input class="form-input" id="${pfx}-retract-dist" type="number" step="0.1" value="${profile?.retraction_distance || ''}"></div>
        <div class="form-group" style="width:90px"><label class="form-label">${t('filament.retraction_speed')}</label><input class="form-input" id="${pfx}-retract-speed" type="number" step="1" value="${profile?.retraction_speed || ''}"></div>
        <div class="form-group" style="width:80px"><label class="form-label">${t('filament.cooling_fan_speed')}</label><input class="form-input" id="${pfx}-fan-speed" type="number" min="0" max="100" value="${profile?.cooling_fan_speed || ''}"></div>
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

  window.deleteProfileItem = function(id) {
    return confirmAction(t('filament.profile_delete_confirm'), async () => {
      await fetch(`/api/inventory/filaments/${id}`, { method: 'DELETE' });
      loadFilament();
    }, { danger: true });
  };

  // ═══ Location CRUD ═══
  window.showAddLocationForm = function() {
    const c = document.getElementById('location-form-container');
    if (!c) return;
    c.innerHTML = `<div class="settings-form mt-sm" style="border-top:1px solid var(--border-color);padding-top:8px">
      <div class="flex gap-sm">
        <div class="form-group" style="flex:1"><label class="form-label">${t('filament.location_name')}</label><input class="form-input" id="loc-name"></div>
      </div>
      <div class="flex gap-sm"><button class="form-btn" data-ripple onclick="saveNewLocation()">${t('filament.save')}</button><button class="form-btn form-btn-sm" data-ripple style="background:transparent;color:var(--text-muted)" onclick="document.getElementById('location-form-container').innerHTML=''">${t('settings.cancel')}</button></div>
    </div>`;
  };

  window.saveNewLocation = async function() {
    const name = document.getElementById('loc-name')?.value?.trim();
    if (!name) return;
    await fetch('/api/inventory/locations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
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
      <div class="flex gap-sm">
        <div class="form-group" style="flex:1"><label class="form-label">${t('filament.location_name')}</label><input class="form-input" id="loc-edit-name" value="${esc(l.name)}"></div>
        <div class="form-group" style="flex:1"><label class="form-label">${t('filament.location_description')}</label><input class="form-input" id="loc-edit-desc" value="${esc(l.description || '')}"></div>
      </div>
      <div class="flex gap-sm"><button class="form-btn" data-ripple onclick="saveLocationEdit(${id})">${t('filament.save')}</button><button class="form-btn form-btn-sm" data-ripple style="background:transparent;color:var(--text-muted)" onclick="document.getElementById('location-form-container').innerHTML=''">${t('settings.cancel')}</button></div>
    </div>`;
  };

  window.saveLocationEdit = async function(id) {
    const name = document.getElementById('loc-edit-name')?.value?.trim();
    if (!name) return;
    const desc = document.getElementById('loc-edit-desc')?.value?.trim() || null;
    await fetch(`/api/inventory/locations/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, description: desc }) });
    loadFilament();
  };

  // ═══ Duplicate Spool ═══
  window.duplicateSpoolItem = async function(id) {
    const res = await fetch(`/api/inventory/spools/${id}/duplicate`, { method: 'POST' });
    if (res.ok) loadFilament();
    else showToast(t('filament.duplicate_failed'), 'error');
  };

  // ═══ Measure Weight ═══
  window.showMeasureDialog = function(id) {
    const spool = _spools.find(s => s.id === id);
    if (!spool) return;
    const container = document.getElementById(`spool-edit-${id}`);
    if (!container) return;
    container.style.display = '';
    container.innerHTML = `<div class="settings-form" style="margin:6px 0;padding:6px;border-top:1px solid var(--border-color)">
      <div class="flex gap-sm" style="align-items:flex-end">
        <div class="form-group" style="width:120px">
          <label class="form-label">${t('filament.gross_weight')}</label>
          <input class="form-input" id="measure-weight-${id}" type="number" placeholder="${t('filament.gross_weight_placeholder')}">
        </div>
        <button class="form-btn form-btn-sm" data-ripple onclick="submitMeasure(${id})">${t('filament.measure')}</button>
        <button class="form-btn form-btn-sm" data-ripple style="background:transparent;color:var(--text-muted)" onclick="document.getElementById('spool-edit-${id}').style.display='none'">${t('settings.cancel')}</button>
      </div>
    </div>`;
  };

  window.submitMeasure = async function(id) {
    const grossWeight = parseFloat(document.getElementById(`measure-weight-${id}`)?.value);
    if (!grossWeight || grossWeight <= 0) return;
    const res = await fetch(`/api/inventory/spools/${id}/measure`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gross_weight_g: grossWeight })
    });
    if (res.ok) loadFilament();
    else { const err = await res.json().catch(() => ({})); showToast(err.error || t('filament.measure_failed'), 'error'); }
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
        <div class="inv-qr-info">
          <strong>${esc(label.name)}</strong>
          <span>${esc(label.vendor || '')} · ${esc(label.material || '')}</span>
          <span>${label.color_name ? esc(label.color_name) : ''}</span>
          <span>${label.spool_weight_g ? label.spool_weight_g + 'g' : ''} ${label.remaining_weight_g ? '(' + Math.round(label.remaining_weight_g) + 'g ' + t('filament.remaining') + ')' : ''}</span>
          ${label.lot_number ? `<span>Lot: ${esc(label.lot_number)}</span>` : ''}
        </div>
      </div>
      <div class="inv-modal-footer">
        <button class="form-btn" data-ripple onclick="printQrLabel()">${t('filament.print_label')}</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
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
        <span class="filament-color-swatch" style="background:${hexToRgb(r.color_hex)}"></span>
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
        <span class="text-muted" style="font-size:0.8rem">${t('filament.loading')}...</span>
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
    if (manufacturers.length > 100) h += `<p class="text-muted" style="font-size:0.8rem">... ${manufacturers.length - 100} ${t('filament.more')}</p>`;
    c.innerHTML = h;
  }

  window.loadSpoolmanDbFilaments = async function(mfgId, el) {
    el.dataset.loaded = '1';
    const filDiv = el.querySelector('.inv-spoolmandb-filaments');
    if (!filDiv) return;
    filDiv.style.display = '';
    filDiv.innerHTML = `<span class="text-muted" style="font-size:0.8rem">${t('filament.loading')}...</span>`;
    try {
      const res = await fetch(`/api/inventory/spoolmandb/filaments?manufacturer=${encodeURIComponent(mfgId)}`);
      const filaments = await res.json();
      let h = '';
      for (const f of filaments) {
        const color = f.color_hex ? hexToRgb(f.color_hex) : '#888';
        h += `<div class="inv-spoolmandb-fil">
          <span class="filament-color-swatch" style="background:${color};width:10px;height:10px"></span>
          <span>${esc(f.name || '')} · ${esc(f.material || '')}</span>
          <button class="form-btn form-btn-sm" data-ripple onclick='importSpoolmanDbFilament(${JSON.stringify(f).replace(/'/g,"&#39;")})'>${t('filament.import')}</button>
        </div>`;
      }
      filDiv.innerHTML = h || `<span class="text-muted" style="font-size:0.8rem">${t('filament.no_results')}</span>`;
    } catch {
      filDiv.innerHTML = `<span class="text-muted" style="font-size:0.8rem">${t('filament.load_failed')}</span>`;
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
  window.showImportDialog = function() {
    document.querySelectorAll('.inv-export-menu.show').forEach(m => m.classList.remove('show'));
    const overlay = document.createElement('div');
    overlay.className = 'inv-modal-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="inv-modal" style="max-width:450px">
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
          <input type="file" class="form-input" id="import-file" accept=".json,.csv">
        </div>
        <div id="import-status"></div>
      </div>
      <div class="inv-modal-footer">
        <button class="form-btn" data-ripple onclick="executeImport()">${t('filament.import')}</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
  };

  window.executeImport = async function() {
    const type = document.getElementById('import-type')?.value;
    const fileInput = document.getElementById('import-file');
    const status = document.getElementById('import-status');
    if (!fileInput?.files?.[0]) return;
    const file = fileInput.files[0];
    const text = await file.text();
    let data;
    if (file.name.endsWith('.json')) {
      data = JSON.parse(text);
    } else {
      // Parse CSV (semicolon or comma separated)
      const sep = text.includes(';') ? ';' : ',';
      const lines = text.replace(/^\uFEFF/, '').split('\n').filter(l => l.trim());
      const headers = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, ''));
      data = [];
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(sep).map(v => v.trim().replace(/^"|"$/g, ''));
        const obj = {};
        headers.forEach((h, idx) => { obj[h] = vals[idx] || null; });
        // Convert numeric fields
        for (const k of ['cost', 'initial_weight_g', 'used_weight_g', 'remaining_weight_g', 'density', 'diameter', 'spool_weight_g', 'empty_spool_weight_g']) {
          if (obj[k]) obj[k] = parseFloat(obj[k]) || null;
        }
        for (const k of ['vendor_id', 'filament_profile_id', 'nozzle_temp_min', 'nozzle_temp_max', 'bed_temp_min', 'bed_temp_max']) {
          if (obj[k]) obj[k] = parseInt(obj[k]) || null;
        }
        data.push(obj);
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
          <input class="form-input" id="set-currency" value="${settings.currency || 'kr'}" placeholder="kr">
        </div>
        <div class="form-group">
          <label class="form-label">${t('filament.low_stock_threshold')}</label>
          <input class="form-input" id="set-low-threshold" type="number" value="${settings.low_stock_threshold || 20}" placeholder="20" min="1" max="50">
          <span class="text-muted" style="font-size:0.7rem">%</span>
        </div>
        <div class="form-group">
          <label class="form-label">${t('filament.page_size')}</label>
          <select class="form-input" id="set-page-size">
            ${[25, 50, 100].map(n => `<option value="${n}" ${(_pageSize === n || (!_pageSize && n === 50)) ? 'selected' : ''}>${n}</option>`).join('')}
          </select>
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
      ['page_size', document.getElementById('set-page-size')?.value],
      ['electricity_rate_kwh', document.getElementById('set-electricity-rate')?.value],
      ['printer_wattage', document.getElementById('set-printer-wattage')?.value],
      ['machine_cost', document.getElementById('set-machine-cost')?.value],
      ['machine_lifetime_hours', document.getElementById('set-machine-lifetime')?.value]
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

  async function _loadDryingHistory() {
    const container = document.getElementById('drying-history-container');
    if (!container) return;
    try {
      const res = await fetch('/api/inventory/drying/sessions?active=0&limit=50');
      const sessions = await res.json();
      if (sessions.length === 0) {
        container.innerHTML = `<p class="text-muted" style="font-size:0.8rem">${t('filament.drying_no_history')}</p>`;
        return;
      }
      let h = `<table class="fil-drying-presets-table"><thead><tr>
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
      for (const s of sessions) {
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
        container.innerHTML = `<p class="text-muted" style="font-size:0.8rem">${t('filament.no_usage_data')}</p>`;
        return;
      }
      // Only show spools with actual usage data
      const active = data.per_spool.filter(s => s.avg_daily_g > 0);
      if (active.length === 0) {
        container.innerHTML = `<p class="text-muted" style="font-size:0.8rem">${t('filament.no_usage_data')}</p>`;
        return;
      }
      let h = `<table class="fil-drying-presets-table"><thead><tr>
        <th></th>
        <th>${t('filament.profile_name')}</th>
        <th>${t('filament.filter_material')}</th>
        <th>${t('filament.remaining_weight')}</th>
        <th>${t('filament.avg_daily_usage')}</th>
        <th>${t('filament.days_until_empty')}</th>
        <th></th>
      </tr></thead><tbody>`;
      for (const s of active) {
        const daysColor = s.days_until_empty != null && s.days_until_empty < 14 ? 'var(--accent-orange,#f0883e)' : '';
        const reorderBadge = s.needs_reorder ? `<span style="background:var(--accent-orange,#f0883e);color:#fff;padding:1px 6px;border-radius:4px;font-size:0.7rem">${t('filament.needs_reorder')}</span>` : '';
        const colorDot = s.color_hex ? `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#${s.color_hex};border:1px solid var(--border-color)"></span>` : '';
        h += `<tr>
          <td>${colorDot}</td>
          <td>${esc(s.profile_name || '?')} ${s.vendor_name ? '<span class="text-muted">(' + esc(s.vendor_name) + ')</span>' : ''}</td>
          <td>${esc(s.material || '')}</td>
          <td>${Math.round(s.remaining_weight_g)}g</td>
          <td>${s.avg_daily_g}g/d</td>
          <td style="color:${daysColor};font-weight:${s.needs_reorder ? '700' : '400'}">${s.days_until_empty != null ? s.days_until_empty + 'd' : '-'}</td>
          <td>${reorderBadge}</td>
        </tr>`;
      }
      h += '</tbody></table>';
      // Material summary
      if (data.by_material && data.by_material.length > 0) {
        h += `<div style="margin-top:8px;font-size:0.75rem;color:var(--text-muted)">`;
        h += data.by_material.map(m => `${m.material}: ${m.avg_daily_g}g/d`).join(' · ');
        h += '</div>';
      }
      container.innerHTML = h;
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
        container.innerHTML = `<p class="text-muted" style="font-size:0.8rem">${t('filament.no_usage_data')}</p>`;
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
      const currency = _spools[0]?.cost ? 'kr' : 'kr';
      let h = `<div class="fil-health-legend" style="gap:12px;margin-bottom:8px">
        <span><strong>${t('filament.filament_cost')}:</strong> ${totalFilament.toFixed(2)} kr</span>
        <span><strong>${t('filament.electricity_cost')}:</strong> ${totalElectricity.toFixed(2)} kr</span>
        <span><strong>${t('filament.depreciation_cost')}:</strong> ${totalDepreciation.toFixed(2)} kr</span>
        <span style="font-weight:700"><strong>${t('filament.total_cost')}:</strong> ${totalCost.toFixed(2)} kr</span>
      </div>`;
      const mats = Object.entries(byMaterial).sort((a, b) => b[1].cost - a[1].cost);
      if (mats.length > 0) {
        h += `<div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:4px">`;
        h += mats.map(([m, d]) => `${m}: ${d.cost.toFixed(2)} kr (${d.count})`).join(' · ');
        h += '</div>';
      }
      container.innerHTML = h;
    } catch (e) { container.innerHTML = `<p class="text-muted">Error: ${e.message}</p>`; }
  }

  window.showStartDryingDialog = function(spoolId) {
    const spool = _spools.find(s => s.id === spoolId);
    if (!spool) return;
    const preset = _dryingPresets.find(p => p.material === spool.material);
    const formContainer = document.getElementById('inv-global-form');
    if (!formContainer) return;

    const cleanName = _cleanProfileName(spool);
    formContainer.style.display = 'block';
    formContainer.innerHTML = `
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
          <button class="form-btn form-btn-sm" data-ripple onclick="document.getElementById('inv-global-form').style.display='none'">${t('common.cancel')}</button>
        </div>
      </div>`;
    formContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
      document.getElementById('inv-global-form').style.display = 'none';
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
          <span class="filament-color-swatch" style="background:${color}"></span>
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

  // ═══ Color Card ═══
  async function _loadColorCard() {
    const el = document.getElementById('color-card-container');
    if (!el) return;
    try {
      const res = await fetch('/api/inventory/color-card');
      const grouped = await res.json();
      const materials = Object.keys(grouped).sort();
      if (materials.length === 0) { el.innerHTML = `<p class="text-muted" style="font-size:0.8rem;padding:8px 0">${t('filament.no_spools')}</p>`; return; }
      let h = '<div class="fil-color-card" id="color-card-canvas-area">';
      for (const mat of materials) {
        h += `<div class="fil-color-group"><div class="fil-color-group-title">${esc(mat)}</div><div class="fil-color-swatches">`;
        for (const s of grouped[mat]) {
          const c = hexToRgb(s.color_hex);
          const border = isLightColor(s.color_hex) ? 'border:1px solid var(--border-color)' : '';
          h += `<div class="fil-color-swatch-card" title="${esc(s.vendor_name || '')} ${esc(s.name || '')}\n${esc(s.color_name || '')}">
            <div class="fil-color-swatch-big" style="background:${c};${border}"></div>
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
          <span class="filament-color-swatch" style="background:${color}"></span>
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

  window.startNfcScan = async function() {
    if (!('NDEFReader' in window)) {
      showToast(t('filament.nfc_not_supported'), 'warning');
      return;
    }
    try {
      const ndef = new NDEFReader();
      await ndef.scan();
      const overlay = document.createElement('div');
      overlay.className = 'inv-modal-overlay';
      overlay.onclick = (e) => { if (e.target === overlay) { overlay.remove(); ndef.onreading = null; } };
      overlay.innerHTML = `<div class="inv-modal" style="max-width:400px">
        <div class="inv-modal-header">
          <span>${t('filament.nfc_scanning')}</span>
          <button class="inv-modal-close" onclick="this.closest('.inv-modal-overlay').remove()">&times;</button>
        </div>
        <div style="padding:24px;text-align:center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" stroke-width="1.5"><path d="M6 8.32a7.43 7.43 0 010 7.36"/><path d="M9.46 6.21a11.76 11.76 0 010 11.58"/><path d="M12.91 4.1a16.09 16.09 0 010 15.8"/><path d="M16.37 2a20.42 20.42 0 010 20"/></svg>
          <p style="margin-top:12px">${t('filament.nfc_hold_tag')}</p>
          <div id="nfc-scan-result"></div>
        </div>
      </div>`;
      document.body.appendChild(overlay);

      ndef.onreading = async (event) => {
        const uid = event.serialNumber || 'unknown';
        const resultEl = document.getElementById('nfc-scan-result');
        if (!resultEl) return;
        // Check if tag is linked
        try {
          const res = await fetch(`/api/nfc/lookup/${encodeURIComponent(uid)}`);
          if (res.ok) {
            const tag = await res.json();
            resultEl.innerHTML = `<div style="margin-top:12px;padding:12px;background:var(--bg-secondary);border-radius:8px">
              <strong>${esc(tag.spool_name || 'Unknown')}</strong><br>
              <span class="text-muted">${esc(tag.material || '')} · ${esc(tag.vendor_name || '')}</span><br>
              <span class="text-muted">UID: ${esc(uid)}</span>
            </div>`;
          } else {
            resultEl.innerHTML = `<div style="margin-top:12px;padding:12px;background:var(--bg-secondary);border-radius:8px">
              <p>${t('filament.nfc_tag_unknown')}</p>
              <span class="text-muted">UID: ${esc(uid)}</span><br>
              <button class="form-btn form-btn-sm" data-ripple style="margin-top:8px" onclick="linkNfcToSpool('${esc(uid)}')">${t('filament.nfc_link')}</button>
            </div>`;
          }
        } catch { resultEl.innerHTML = '<span class="text-muted">Error</span>'; }
      };
    } catch (e) {
      showToast(t('filament.nfc_error') + ': ' + e.message, 'error');
    }
  };

  window.linkNfcToSpool = async function(uid) {
    const spoolId = prompt(t('filament.nfc_enter_spool_id'));
    if (!spoolId) return;
    try {
      await fetch('/api/nfc/link', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag_uid: uid, spool_id: parseInt(spoolId) })
      });
      loadFilament();
    } catch (e) { showToast(e.message, 'error'); }
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

  window.toggleSpoolSelect = function(id, el) {
    if (_selectedSpools.has(id)) {
      _selectedSpools.delete(id);
      el.closest('.filament-card')?.classList.remove('filament-card-selected');
    } else {
      _selectedSpools.add(id);
      el.closest('.filament-card')?.classList.add('filament-card-selected');
    }
    _updateBulkBar();
  };

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
    bar.innerHTML = `<span>${_selectedSpools.size} ${t('filament.bulk_selected')}</span>
      <div class="fil-bulk-actions">
        <button class="form-btn form-btn-sm" data-ripple onclick="bulkAction('mark_dried')">${t('filament.start_drying')}</button>
        <button class="form-btn form-btn-sm" data-ripple onclick="bulkAction('relocate')">${t('filament.bulk_relocate')}</button>
        <button class="form-btn form-btn-sm" data-ripple onclick="bulkAction('archive')">${t('filament.archive')}</button>
        <button class="form-btn form-btn-sm" data-ripple style="color:var(--accent-red)" onclick="bulkAction('delete')">${t('settings.delete')}</button>
        <button class="form-btn form-btn-sm" data-ripple onclick="clearBulkSelection()">${t('common.cancel')}</button>
      </div>`;
  }

  window.clearBulkSelection = function() {
    _selectedSpools.clear();
    document.querySelectorAll('.filament-card-selected').forEach(el => el.classList.remove('filament-card-selected'));
    _updateBulkBar();
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
        if (!res.ok) throw new Error('Failed');
        _selectedSpools.clear();
        _updateBulkBar();
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

  // ═══ Legacy compat: old /api/filament still works for backward compat ═══
  window.showAddFilamentForm = window.showAddSpoolForm;
  window.showGlobalAddFilament = window.showAddSpoolForm;
  window.deleteFilamentSpool = window.deleteSpoolItem;

})();
