// Filament Inventory Tracker — Modular with Tabs and Drag-and-Drop
(function() {

  // ═══ Constants & Helpers ═══
  const FILAMENT_TYPES = {
    'Standard': ['PLA', 'PLA+', 'PLA Matte', 'PLA Silk', 'PLA Marble', 'PLA Metal', 'PLA Glow', 'PLA Galaxy', 'PLA Sparkle', 'PLA Wood'],
    'Engineering': ['PETG', 'PETG-CF', 'ABS', 'ASA', 'PC', 'PA', 'PA-CF', 'PA-GF', 'PA6-CF', 'PA6-GF', 'PAHT-CF', 'PET-CF', 'PPA-CF', 'PPA-GF'],
    'Flexible': ['TPU', 'TPU 95A'],
    'Support': ['PVA', 'HIPS', 'BVOH'],
    'Specialty': ['PP', 'PE', 'EVA']
  };

  function buildTypeOptions(selectedType) {
    let html = '<option value="">--</option>';
    let found = false;
    for (const [group, types] of Object.entries(FILAMENT_TYPES)) {
      html += `<optgroup label="${group}">`;
      for (const tp of types) {
        const sel = tp === selectedType ? 'selected' : '';
        if (sel) found = true;
        html += `<option value="${tp}" ${sel}>${tp}</option>`;
      }
      html += '</optgroup>';
    }
    if (selectedType && !found) {
      html += `<optgroup label="Custom"><option value="${selectedType}" selected>${selectedType}</option></optgroup>`;
    }
    html += `<option value="__custom__">${t('filament.custom_type')}</option>`;
    return html;
  }

  function hexToRgb(hex) { if (!hex || hex.length < 6) return '#888'; return `#${hex.substring(0, 6)}`; }
  function hexToRgbColor(hex) { if (!hex || hex.length < 6) return 'rgb(128,128,128)'; return `rgb(${parseInt(hex.substring(0,2),16)},${parseInt(hex.substring(2,4),16)},${parseInt(hex.substring(4,6),16)})`; }
  function isLightColor(hex) { if (!hex || hex.length < 6) return false; return (parseInt(hex.substring(0,2),16)*299+parseInt(hex.substring(2,4),16)*587+parseInt(hex.substring(4,6),16)*114)/1000 > 160; }
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
    inventory: { label: 'filament.tab_inventory', modules: ['spool-summary', 'active-filament', 'spoolman-spools', 'low-stock-alert', 'printer-inventory'] },
    stats:     { label: 'filament.tab_stats',     modules: ['type-breakdown', 'brand-breakdown', 'cost-summary', 'stock-health'] }
  };
  const MODULE_SIZE = {
    'spool-summary': 'full', 'active-filament': 'full',
    'low-stock-alert': 'full', 'printer-inventory': 'full',
    'spoolman-spools': 'full',
    'type-breakdown': 'half', 'brand-breakdown': 'half',
    'cost-summary': 'half', 'stock-health': 'half'
  };

  const STORAGE_PREFIX = 'filament-module-order-';
  const LOCK_KEY = 'filament-layout-locked';

  // Clear stale saved orders when module set changes
  const _MOD_VER = 3;
  if (localStorage.getItem('filament-mod-ver') !== String(_MOD_VER)) {
    for (const tab of Object.keys(TAB_CONFIG)) localStorage.removeItem(STORAGE_PREFIX + tab);
    localStorage.setItem('filament-mod-ver', String(_MOD_VER));
  }

  let _activeTab = 'inventory';
  let _locked = localStorage.getItem(LOCK_KEY) !== '0';
  let _spools = [];
  let _draggedMod = null;

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
      let totalWeight = 0, totalRemaining = 0, totalValue = 0, lowStockCount = 0;
      for (const s of spools) {
        totalWeight += s.weight_total_g || 0;
        const rem = Math.max(0, (s.weight_total_g || 0) - (s.weight_used_g || 0));
        totalRemaining += rem;
        if (s.cost_nok) totalValue += s.cost_nok;
        const pct = s.weight_total_g > 0 ? (rem / s.weight_total_g) * 100 : 0;
        if (pct < 20 && pct > 0) lowStockCount++;
      }
      const lowColor = lowStockCount > 0 ? '#f0883e' : '#00e676';
      return `<div class="fil-hero-grid">
        ${heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>', spools.length, t('filament.total_spools'), '#1279ff')}
        ${heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>', fmtW(totalRemaining), t('filament.total_remaining'), '#00e676')}
        ${totalValue > 0 ? heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>', `${Math.round(totalValue)} kr`, t('filament.total_value'), '#e3b341') : ''}
        ${heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>', lowStockCount, t('filament.low_stock'), lowColor)}
      </div>`;
    },

    'low-stock-alert': (spools) => {
      const low = spools.filter(s => {
        const rem = Math.max(0, (s.weight_total_g || 0) - (s.weight_used_g || 0));
        const pct = s.weight_total_g > 0 ? (rem / s.weight_total_g) * 100 : 100;
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

    'spoolman-spools': () => {
      // Async load — renders a container and fetches data
      let h = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        ${t('filament.spoolman_title')}
      </div>`;
      h += `<div id="spoolman-spools-container"><span class="text-muted" style="font-size:0.8rem">Loading...</span></div>`;
      // Trigger async load
      setTimeout(() => loadSpoolmanSpools(), 0);
      return h;
    },

    'printer-inventory': (spools) => {
      let h = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        ${t('filament.tab_inventory')}
      </div>`;

      const grouped = {};
      const unassigned = [];
      for (const s of spools) {
        if (s.printer_id) {
          if (!grouped[s.printer_id]) grouped[s.printer_id] = [];
          grouped[s.printer_id].push(s);
        } else {
          unassigned.push(s);
        }
      }
      const state = window.printerState;
      const printerIds = state ? state.getPrinterIds() : [];
      const allIds = [...new Set([...printerIds, ...Object.keys(grouped)])];

      for (const pid of allIds) {
        const ps = grouped[pid] || [];
        const name = printerName(pid);
        h += `<div class="settings-card filament-printer-section" data-printer-id="${pid}">
          <div class="filament-printer-header">
            <span class="printer-tag">${esc(name)}</span>
            <span class="text-muted" style="font-size:0.75rem">${ps.length} ${ps.length === 1 ? t('filament.spool_singular') : t('filament.spool_plural')}</span>
            <button class="form-btn form-btn-sm" style="margin-left:auto" onclick="showAddFilamentForm('${pid}')">${t('filament.add_spool')}</button>
          </div>`;
        if (ps.length > 0) {
          ps.sort((a, b) => {
            const pA = a.weight_total_g > 0 ? ((a.weight_total_g - a.weight_used_g) / a.weight_total_g) : 1;
            const pB = b.weight_total_g > 0 ? ((b.weight_total_g - b.weight_used_g) / b.weight_total_g) : 1;
            return pA - pB;
          });
          h += '<div class="filament-grid">';
          for (const s of ps) h += renderSpoolCard(s);
          h += '</div>';
        }
        h += `<div id="filament-form-${pid}" style="display:none"></div></div>`;
      }

      // Unassigned
      h += `<div class="settings-card filament-printer-section" data-printer-id="">
        <div class="filament-printer-header">
          <span class="text-muted" style="font-size:0.8rem;font-weight:600">${t('filament.unassigned')}</span>
          <span class="text-muted" style="font-size:0.75rem">${unassigned.length} ${unassigned.length === 1 ? t('filament.spool_singular') : t('filament.spool_plural')}</span>
          <button class="form-btn form-btn-sm" style="margin-left:auto" onclick="showAddFilamentForm('')">${t('filament.add_spool')}</button>
        </div>`;
      if (unassigned.length > 0) {
        h += '<div class="filament-grid">';
        for (const s of unassigned) h += renderSpoolCard(s);
        h += '</div>';
      } else {
        h += `<div class="filament-drop-hint text-muted">${t('filament.drop_here')}</div>`;
      }
      h += `<div id="filament-form-" style="display:none"></div>`;
      h += '</div>';
      return h;
    },

    'type-breakdown': (spools) => {
      if (spools.length === 0) return '';
      const byType = {};
      for (const s of spools) {
        const tp = s.type || 'Unknown';
        if (!byType[tp]) byType[tp] = { count: 0, remaining_g: 0 };
        byType[tp].count++;
        byType[tp].remaining_g += Math.max(0, (s.weight_total_g || 0) - (s.weight_used_g || 0));
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
      if (spools.length === 0) return '';
      const byBrand = {};
      for (const s of spools) {
        const br = s.brand || 'Unknown';
        if (!byBrand[br]) byBrand[br] = { count: 0, total_cost: 0, total_weight: 0 };
        byBrand[br].count++;
        if (s.cost_nok) byBrand[br].total_cost += s.cost_nok;
        byBrand[br].total_weight += s.weight_total_g || 0;
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
      let invested = 0, usedValue = 0, totalWeightKg = 0;
      const costByType = {};
      for (const s of spools) {
        if (s.cost_nok) {
          invested += s.cost_nok;
          const usedPct = s.weight_total_g > 0 ? (s.weight_used_g || 0) / s.weight_total_g : 0;
          usedValue += s.cost_nok * usedPct;
          const tp = s.type || 'Unknown';
          if (!costByType[tp]) costByType[tp] = 0;
          costByType[tp] += s.cost_nok;
        }
        totalWeightKg += (s.weight_total_g || 0) / 1000;
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
      if (spools.length === 0) return '';
      let full = 0, half = 0, low = 0, empty = 0, totalPct = 0;
      for (const s of spools) {
        const rem = Math.max(0, (s.weight_total_g || 0) - (s.weight_used_g || 0));
        const pct = s.weight_total_g > 0 ? (rem / s.weight_total_g) * 100 : 0;
        totalPct += pct;
        if (pct > 75) full++;
        else if (pct > 40) half++;
        else if (pct > 10) low++;
        else empty++;
      }
      const avg = spools.length > 0 ? Math.round(totalPct / spools.length) : 0;
      const tp = spools.length;
      let h = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        ${t('filament.stock_health')}
      </div>`;
      // Health bar
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
    }
  };

  // ═══ Spool card rendering ═══
  function renderSpoolCard(s) {
    const remaining = Math.max(0, s.weight_total_g - s.weight_used_g);
    const pct = s.weight_total_g > 0 ? Math.round((remaining / s.weight_total_g) * 100) : 0;
    const color = hexToRgb(s.color_hex);
    const isLow = pct < 20 && pct > 0;
    const isEmpty = pct === 0 && s.weight_used_g > 0;
    const lowClass = isEmpty ? 'filament-card-empty' : isLow ? 'filament-card-low' : '';
    const costPerG = (s.cost_nok && s.weight_total_g) ? (s.cost_nok / s.weight_total_g).toFixed(2) : null;

    return `
      <div class="filament-card ${lowClass}" data-spool-id="${s.id}" draggable="true">
        <div class="fil-spool-top">
          <div class="fil-spool-identity">
            <span class="filament-color-swatch" style="background:${color}"></span>
            <div>
              <strong>${esc(s.type)}</strong>
              <span class="text-muted" style="font-size:0.75rem"> ${esc(s.brand)}</span>
            </div>
          </div>
          <div class="fil-spool-actions">
            <button class="filament-edit-btn" onclick="showEditFilamentForm(${s.id})" title="${t('settings.edit')}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="filament-delete-btn" onclick="deleteFilamentSpool(${s.id})" title="${t('settings.delete')}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        <div class="fil-spool-meta">
          ${esc(s.color_name)} &middot; ${Math.round(remaining)}g ${t('filament.remaining')}
        </div>
        <div class="filament-bar">
          <div class="filament-bar-fill" style="width:${pct}%;background:${isLow || isEmpty ? 'var(--accent-orange)' : color}"></div>
        </div>
        <div class="fil-spool-footer">
          <span>${pct}% ${t('filament.remaining')}${isLow ? ' ⚠' : ''}</span>
          <span>${s.cost_nok ? s.cost_nok + ' kr' : ''}${costPerG ? ` (${costPerG} kr/g)` : ''}</span>
        </div>
        <div id="filament-edit-${s.id}" style="display:none"></div>
      </div>`;
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
            html += `<div class="fil-ams-tray ${isActive ? 'fil-ams-tray-active' : ''}">
              <div class="fil-ams-color" style="background:${color};${light ? 'border:1px solid var(--border-color);' : ''}"></div>
              <div class="fil-ams-info">
                <span class="fil-ams-type">${tray.tray_type}${brand ? ' · ' + brand : ''}</span>
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

  // ═══ Spool Drag & Drop between printers ═══
  function initFilamentDnd() {
    let draggedEl = null;
    let draggedSpoolId = null;

    document.querySelectorAll('.filament-card[draggable]').forEach(card => {
      card.addEventListener('dragstart', e => {
        draggedEl = card;
        draggedSpoolId = card.dataset.spoolId;
        card.classList.add('filament-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedSpoolId);
      });
      card.addEventListener('dragend', () => {
        if (draggedEl) draggedEl.classList.remove('filament-dragging');
        draggedEl = null; draggedSpoolId = null;
        document.querySelectorAll('.filament-drop-target').forEach(el => el.classList.remove('filament-drop-target'));
      });
    });

    document.querySelectorAll('.filament-printer-section').forEach(section => {
      section.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
      section.addEventListener('dragenter', e => { e.preventDefault(); section.classList.add('filament-drop-target'); });
      section.addEventListener('dragleave', e => { if (!section.contains(e.relatedTarget)) section.classList.remove('filament-drop-target'); });
      section.addEventListener('drop', async e => {
        e.preventDefault();
        section.classList.remove('filament-drop-target');
        const spoolId = e.dataTransfer.getData('text/plain');
        const targetPrinterId = section.dataset.printerId || null;
        if (!spoolId) return;
        await reassignSpool(parseInt(spoolId), targetPrinterId);
      });
    });
  }

  async function reassignSpool(spoolId, newPrinterId) {
    try {
      const res = await fetch('/api/filament');
      const spools = await res.json();
      const spool = spools.find(s => s.id === spoolId);
      if (!spool) return;
      spool.printer_id = newPrinterId;
      await fetch(`/api/filament/${spoolId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(spool) });
      loadFilament();
    } catch (err) { console.error('Failed to reassign spool:', err); }
  }

  // ═══ Main render ═══
  async function loadFilament() {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;

    // Read sub-slug from hash
    const hashParts = location.hash.replace('#', '').split('/');
    if (hashParts[0] === 'filament' && hashParts[1] && TAB_CONFIG[hashParts[1]]) {
      _activeTab = hashParts[1];
    }

    try {
      const res = await fetch('/api/filament');
      _spools = await res.json();

      let html = '';

      // ── Top bar: Add button + Lock ──
      const lockIcon = _locked
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>';
      html += `<div class="tele-top-bar">
        <button class="form-btn" onclick="showGlobalAddFilament()" style="display:flex;align-items:center;gap:4px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>${t('filament.add_spool')}</span>
        </button>
        <div style="flex:1"></div>
        <button class="tele-lock-btn ${_locked ? '' : 'active'}" onclick="toggleFilamentLock()" title="${_locked ? t('filament.layout_locked') : t('filament.layout_unlocked')}">${lockIcon}</button>
      </div>`;

      // ── Tab bar ──
      html += '<div class="tabs">';
      for (const [id, cfg] of Object.entries(TAB_CONFIG)) {
        html += `<button class="tab-btn filament-tab-btn ${id === _activeTab ? 'active' : ''}" data-tab="${id}" onclick="switchFilamentTab('${id}')">${t(cfg.label)}</button>`;
      }
      html += '</div>';

      // Global add form container
      html += `<div id="filament-global-form" style="display:none"></div>`;

      // ── Tab panels ──
      for (const [tabId, cfg] of Object.entries(TAB_CONFIG)) {
        const order = getOrder(tabId);
        html += `<div class="tab-panel filament-tab-panel stats-tab-panel ${tabId === _activeTab ? 'active' : ''}" id="filament-tab-${tabId}" style="display:${tabId === _activeTab ? 'grid' : 'none'}">`;
        for (const modId of order) {
          const builder = BUILDERS[modId];
          if (!builder) continue;
          const content = builder(_spools);
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

      // Attach module DnD
      for (const tabId of Object.keys(TAB_CONFIG)) {
        const cont = document.getElementById(`filament-tab-${tabId}`);
        if (cont) initModuleDrag(cont, tabId);
      }

      // Attach spool DnD (only works within printer-inventory module)
      initFilamentDnd();
    } catch (e) {
      panel.innerHTML = `<p class="text-muted">${t('filament.load_failed')}</p>`;
    }
  }

  // ═══ Spoolman ═══
  async function loadSpoolmanSpools() {
    const container = document.getElementById('spoolman-spools-container');
    if (!container) return;
    try {
      const res = await fetch('/api/spoolman/spools');
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 400) {
          container.innerHTML = `<p class="text-muted" style="font-size:0.8rem">${t('filament.spoolman_not_configured')}</p>`;
          return;
        }
        throw new Error(err.error || 'Failed');
      }
      const spools = await res.json();
      if (!spools || spools.length === 0) {
        container.innerHTML = `<p class="text-muted" style="font-size:0.8rem">${t('filament.spoolman_empty')}</p>`;
        return;
      }
      let html = '<div class="spoolman-grid">';
      for (const s of spools) {
        const fil = s.filament || {};
        const vendor = fil.vendor || {};
        const color = fil.color_hex ? `#${fil.color_hex.replace('#', '').substring(0, 6)}` : '#888';
        const remaining = s.remaining_weight != null ? Math.round(s.remaining_weight) : '?';
        const used = s.used_weight != null ? Math.round(s.used_weight) : 0;
        const total = remaining !== '?' ? remaining + used : '?';
        const pct = total !== '?' && total > 0 ? Math.round((remaining / total) * 100) : 0;
        html += `<div class="spoolman-card">
          <div class="spoolman-card-top">
            <span class="filament-color-swatch" style="background:${color}"></span>
            <div>
              <strong>${esc(fil.name || fil.material || '--')}</strong>
              <span class="text-muted" style="font-size:0.75rem"> ${esc(vendor.name || '')}</span>
            </div>
          </div>
          <div class="filament-bar" style="margin:6px 0 4px">
            <div class="filament-bar-fill" style="width:${pct}%;background:${pct < 20 ? 'var(--accent-orange)' : color}"></div>
          </div>
          <div class="spoolman-card-meta">
            <span>${remaining}g ${t('filament.remaining')}</span>
            <span>${fil.material || ''}</span>
          </div>
        </div>`;
      }
      html += '</div>';
      container.innerHTML = html;
    } catch (e) {
      container.innerHTML = `<p class="text-muted" style="font-size:0.8rem">${t('filament.spoolman_not_configured')}</p>`;
    }
  }

  // ═══ Global API ═══
  window.loadFilamentPanel = loadFilament;
  window.switchFilamentTab = switchTab;
  window.toggleFilamentLock = function() {
    _locked = !_locked;
    localStorage.setItem(LOCK_KEY, _locked ? '1' : '0');
    loadFilament();
  };

  // ═══ Global add form ═══
  window.showGlobalAddFilament = function() {
    // Switch to inventory tab if not already
    if (_activeTab !== 'inventory') switchTab('inventory');
    const container = document.getElementById('filament-global-form');
    if (!container) return;
    // Close other forms
    document.querySelectorAll('[id^="filament-form-"]').forEach(el => { el.style.display = 'none'; el.innerHTML = ''; });
    document.querySelectorAll('[id^="filament-edit-"]').forEach(el => { el.style.display = 'none'; el.innerHTML = ''; });
    container.style.display = '';
    container.innerHTML = `
      <div class="settings-card" style="margin-bottom:10px">
        <div class="settings-form">
          <div class="flex gap-sm" style="flex-wrap:wrap">
            <div class="form-group" style="flex:1;min-width:140px">
              <label class="form-label">${t('common.printer')}</label>
              <select class="form-input" id="f-printer-global">${buildPrinterOptions('')}</select>
            </div>
            <div class="form-group" style="flex:1;min-width:120px">
              <label class="form-label">${t('filament.brand')}</label>
              <input class="form-input" id="f-brand-global" value="" placeholder="Bambu Lab">
            </div>
            <div class="form-group" style="flex:1;min-width:120px">
              <label class="form-label">${t('filament.type')}</label>
              <select class="form-input" id="f-type-global" onchange="onFilamentTypeChange('global')" required>
                ${buildTypeOptions('')}
              </select>
              <input class="form-input mt-xs" id="f-type-custom-global" style="display:none" placeholder="${t('filament.custom_type_placeholder')}">
            </div>
            <div class="form-group" style="flex:1;min-width:100px">
              <label class="form-label">${t('filament.color')}</label>
              <input class="form-input" id="f-color-global" value="" placeholder="">
            </div>
            <div class="form-group" style="width:80px">
              <label class="form-label">${t('filament.color_hex')}</label>
              <input class="form-input" id="f-hex-global" value="" placeholder="FFFFFF">
            </div>
            <div class="form-group" style="width:80px">
              <label class="form-label">${t('filament.weight')}</label>
              <input class="form-input" id="f-weight-global" type="number" value="1000">
            </div>
            <div class="form-group" style="width:80px">
              <label class="form-label">${t('filament.used_g')}</label>
              <input class="form-input" id="f-used-global" type="number" value="0">
            </div>
            <div class="form-group" style="width:80px">
              <label class="form-label">${t('filament.price')}</label>
              <input class="form-input" id="f-cost-global" type="number" value="" placeholder="219">
            </div>
          </div>
          <div class="flex gap-sm">
            <button class="form-btn" onclick="saveGlobalFilament()">${t('filament.save')}</button>
            <button class="form-btn form-btn-sm" style="background:transparent;color:var(--text-muted)" onclick="hideGlobalAddForm()">${t('settings.cancel')}</button>
          </div>
        </div>
      </div>`;
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  window.hideGlobalAddForm = function() {
    const c = document.getElementById('filament-global-form');
    if (c) { c.style.display = 'none'; c.innerHTML = ''; }
  };

  window.saveGlobalFilament = async function() {
    const printerId = document.getElementById('f-printer-global')?.value || null;
    const data = {
      printer_id: printerId,
      brand: document.getElementById('f-brand-global').value,
      type: getFilamentType('global'),
      color_name: document.getElementById('f-color-global').value,
      color_hex: document.getElementById('f-hex-global').value,
      weight_total_g: parseFloat(document.getElementById('f-weight-global').value) || 1000,
      weight_used_g: parseFloat(document.getElementById('f-used-global').value) || 0,
      cost_nok: parseFloat(document.getElementById('f-cost-global').value) || null
    };
    if (!data.type) return alert(t('filament.type_required'));
    await fetch('/api/filament', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    loadFilament();
  };

  // ═══ CRUD ═══
  window.showAddFilamentForm = function(printerId) {
    // Close global form
    const gf = document.getElementById('filament-global-form');
    if (gf) { gf.style.display = 'none'; gf.innerHTML = ''; }
    document.querySelectorAll('[id^="filament-form-"]').forEach(el => { el.style.display = 'none'; el.innerHTML = ''; });
    document.querySelectorAll('[id^="filament-edit-"]').forEach(el => { el.style.display = 'none'; el.innerHTML = ''; });
    const container = document.getElementById(`filament-form-${printerId}`);
    if (!container) return;
    container.style.display = '';
    container.innerHTML = renderFilamentForm(printerId, null);
  };

  window.showEditFilamentForm = function(spoolId) {
    document.querySelectorAll('[id^="filament-form-"]').forEach(el => { el.style.display = 'none'; el.innerHTML = ''; });
    document.querySelectorAll('[id^="filament-edit-"]').forEach(el => { el.style.display = 'none'; el.innerHTML = ''; });
    const container = document.getElementById(`filament-edit-${spoolId}`);
    if (!container) return;
    fetch('/api/filament').then(r => r.json()).then(spools => {
      const spool = spools.find(s => s.id === spoolId);
      if (!spool) return;
      container.style.display = '';
      container.innerHTML = renderFilamentForm(spool.printer_id, spool);
    });
  };

  function buildPrinterOptions(selectedId) {
    const state = window.printerState;
    const ids = state ? state.getPrinterIds() : [];
    let opts = `<option value="" ${!selectedId ? 'selected' : ''}>${t('filament.unassigned')}</option>`;
    for (const id of ids) {
      opts += `<option value="${id}" ${id === selectedId ? 'selected' : ''}>${printerName(id)}</option>`;
    }
    return opts;
  }

  function renderFilamentForm(printerId, spool) {
    const isEdit = !!spool;
    const idSuffix = isEdit ? `edit-${spool.id}` : printerId;
    const currentPrinterId = spool?.printer_id || printerId || '';
    return `
      <div class="settings-form mt-sm" style="border-top:1px solid var(--border-color);padding-top:12px">
        <div class="flex gap-sm" style="flex-wrap:wrap">
          ${isEdit ? `<div class="form-group" style="flex:1;min-width:140px">
            <label class="form-label">${t('common.printer')}</label>
            <select class="form-input" id="f-printer-${idSuffix}">${buildPrinterOptions(currentPrinterId)}</select>
          </div>` : ''}
          <div class="form-group" style="flex:1;min-width:120px">
            <label class="form-label">${t('filament.brand')}</label>
            <input class="form-input" id="f-brand-${idSuffix}" value="${spool?.brand || ''}" placeholder="Bambu Lab">
          </div>
          <div class="form-group" style="flex:1;min-width:120px">
            <label class="form-label">${t('filament.type')}</label>
            <select class="form-input" id="f-type-${idSuffix}" onchange="onFilamentTypeChange('${idSuffix}')" required>
              ${buildTypeOptions(spool?.type || '')}
            </select>
            <input class="form-input mt-xs" id="f-type-custom-${idSuffix}" style="display:none" placeholder="${t('filament.custom_type_placeholder')}">
          </div>
          <div class="form-group" style="flex:1;min-width:100px">
            <label class="form-label">${t('filament.color')}</label>
            <input class="form-input" id="f-color-${idSuffix}" value="${spool?.color_name || ''}" placeholder="">
          </div>
          <div class="form-group" style="width:80px">
            <label class="form-label">${t('filament.color_hex')}</label>
            <input class="form-input" id="f-hex-${idSuffix}" value="${spool?.color_hex || ''}" placeholder="FFFFFF">
          </div>
          <div class="form-group" style="width:80px">
            <label class="form-label">${t('filament.weight')}</label>
            <input class="form-input" id="f-weight-${idSuffix}" type="number" value="${spool?.weight_total_g || 1000}">
          </div>
          <div class="form-group" style="width:80px">
            <label class="form-label">${t('filament.used_g')}</label>
            <input class="form-input" id="f-used-${idSuffix}" type="number" value="${spool?.weight_used_g || 0}">
          </div>
          <div class="form-group" style="width:80px">
            <label class="form-label">${t('filament.price')}</label>
            <input class="form-input" id="f-cost-${idSuffix}" type="number" value="${spool?.cost_nok || ''}" placeholder="219">
          </div>
        </div>
        <div class="flex gap-sm">
          <button class="form-btn" onclick="${isEdit ? `updateFilament(${spool.id}, '${idSuffix}')` : `saveFilament('${printerId}')`}">${t('filament.save')}</button>
          <button class="form-btn form-btn-sm" style="background:transparent;color:var(--text-muted)" onclick="${isEdit ? `hideEditFilamentForm(${spool.id})` : `hideFilamentForm('${printerId}')`}">${t('settings.cancel')}</button>
        </div>
      </div>`;
  }

  window.onFilamentTypeChange = function(idSuffix) {
    const sel = document.getElementById(`f-type-${idSuffix}`);
    const custom = document.getElementById(`f-type-custom-${idSuffix}`);
    if (!sel || !custom) return;
    if (sel.value === '__custom__') { custom.style.display = ''; custom.focus(); }
    else { custom.style.display = 'none'; custom.value = ''; }
  };

  function getFilamentType(idSuffix) {
    const sel = document.getElementById(`f-type-${idSuffix}`);
    if (!sel) return '';
    if (sel.value === '__custom__') return document.getElementById(`f-type-custom-${idSuffix}`)?.value?.trim() || '';
    return sel.value;
  }

  window.hideFilamentForm = function(printerId) {
    const c = document.getElementById(`filament-form-${printerId}`);
    if (c) { c.style.display = 'none'; c.innerHTML = ''; }
  };

  window.hideEditFilamentForm = function(spoolId) {
    const c = document.getElementById(`filament-edit-${spoolId}`);
    if (c) { c.style.display = 'none'; c.innerHTML = ''; }
  };

  window.saveFilament = async function(printerId) {
    const data = {
      printer_id: printerId,
      brand: document.getElementById(`f-brand-${printerId}`).value,
      type: getFilamentType(printerId),
      color_name: document.getElementById(`f-color-${printerId}`).value,
      color_hex: document.getElementById(`f-hex-${printerId}`).value,
      weight_total_g: parseFloat(document.getElementById(`f-weight-${printerId}`).value) || 1000,
      weight_used_g: parseFloat(document.getElementById(`f-used-${printerId}`).value) || 0,
      cost_nok: parseFloat(document.getElementById(`f-cost-${printerId}`).value) || null
    };
    if (!data.type) return alert(t('filament.type_required'));
    await fetch('/api/filament', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    loadFilament();
  };

  window.updateFilament = async function(spoolId, idSuffix) {
    const printerSelect = document.getElementById(`f-printer-${idSuffix}`);
    const data = {
      printer_id: printerSelect ? (printerSelect.value || null) : undefined,
      brand: document.getElementById(`f-brand-${idSuffix}`).value,
      type: getFilamentType(idSuffix),
      color_name: document.getElementById(`f-color-${idSuffix}`).value,
      color_hex: document.getElementById(`f-hex-${idSuffix}`).value,
      weight_total_g: parseFloat(document.getElementById(`f-weight-${idSuffix}`).value) || 1000,
      weight_used_g: parseFloat(document.getElementById(`f-used-${idSuffix}`).value) || 0,
      cost_nok: parseFloat(document.getElementById(`f-cost-${idSuffix}`).value) || null
    };
    if (!data.type) return alert(t('filament.type_required'));
    await fetch(`/api/filament/${spoolId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    loadFilament();
  };

  window.deleteFilamentSpool = async function(id) {
    await fetch(`/api/filament/${id}`, { method: 'DELETE' });
    loadFilament();
  };

})();
