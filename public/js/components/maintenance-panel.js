// Maintenance & Wear Tracking Panel — Modular with Tabs
(function() {

  // ═══ Helpers ═══
  function formatDate(iso) {
    if (!iso) return '--';
    const locale = (window.i18n?.getLocale() || 'nb').replace('_', '-');
    return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function fmtW(g) { return g >= 1000 ? `${(g/1000).toFixed(1)} kg` : `${Math.round(g)}g`; }
  function sRow(lbl, val, clr) { return `<div class="stats-detail-item"><span class="stats-detail-item-label">${lbl}</span><span class="stats-detail-item-value"${clr?` style="color:${clr}"`:''}>${val}</span></div>`; }

  const COMPONENTS = ['nozzle', 'ptfe_tube', 'linear_rods', 'carbon_rods', 'z_axis', 'linear_bearings', 'build_plate', 'ams', 'ams_sensors', 'filament_drying', 'general'];
  const ACTIONS = ['cleaned', 'replaced', 'lubricated', 'inspected', 'dried', 'calibrated'];
  // Wear limits from KB docs (hours unless noted)
  const WEAR_LIMITS = {
    fan_cooling: 3000, fan_aux: 3000, fan_chamber: 3000, fan_heatbreak: 3000,
    hotend_heater: 2000, bed_heater: 5000,
    belts_x: 5000, belts_y: 5000,
    linear_rails: 10000, extruder_motor: 5000
  };
  // Default maintenance intervals (hours) aligned with KB vedlikehold docs
  const KB_INTERVALS = {
    nozzle: 50,           // Cold pull every 50h, or when changing material
    ptfe_tube: 200,       // Visual inspection monthly, replace on visible wear
    linear_rods: 250,     // Oil XY rods every 200-300h
    carbon_rods: 250,     // Oil carbon rods every 200-300h
    z_axis: 200,          // Grease Z leadscrew every 200h
    linear_bearings: 400, // Grease linear bearings every 300-500h (X1C/P1S)
    build_plate: 100,     // Deep clean monthly (~100h), IPA between prints
    ams: 100,             // Clean filament path every 100h
    ams_sensors: 200,     // Inspect sensors monthly
    filament_drying: 50,  // Check/dry hygroscopic filament regularly
    general: 500          // Full maintenance cycle every 500h
  };
  // Nozzle lifespan by type (from KB dyse.md)
  const NOZZLE_LIFESPAN = {
    brass: { min: 200, max: 500, label: 'Brass', maxTemp: 300 },
    stainless_steel: { min: 200, max: 500, label: 'Stainless steel', maxTemp: 300 },
    hardened_steel: { min: 300, max: 600, label: 'Hardened steel', maxTemp: 300 },
    hs01: { min: 500, max: 1000, label: 'HS01 (Bambu)', maxTemp: 300 }
  };
  // Build plate lifespan (prints, from KB plate.md)
  const PLATE_LIFESPAN = {
    cool_plate: { normal: '200–500', intensive: '100–200' },
    engineering_plate: { normal: '300–700', intensive: '200–400' },
    high_temp_plate: { normal: '200–400', intensive: '100–200' },
    textured_pei: { normal: '300–600', intensive: '200–300' }
  };

  // ═══ Tab config ═══
  const TAB_CONFIG = {
    nozzle:     { label: 'maintenance.tab_nozzle',     modules: ['alerts', 'lifetime-stats', 'active-nozzle', 'nozzle-history'] },
    components: { label: 'maintenance.tab_components', modules: ['component-status', 'wear-tracking', 'kb-intervals', 'schedule'] },
    log:        { label: 'maintenance.tab_log',        modules: ['log-form', 'recent-events'] },
    guide:      { label: 'maintenance.tab_guide',      modules: ['kb-guide'] },
    wearprediction: { label: 'wear.title', modules: ['wear-prediction-embed'], external: true }
  };
  const MODULE_SIZE = {
    'alerts': 'full', 'lifetime-stats': 'full',
    'active-nozzle': 'half', 'nozzle-history': 'half',
    'component-status': 'half', 'wear-tracking': 'half',
    'schedule': 'full',
    'log-form': 'half', 'recent-events': 'half',
    'kb-intervals': 'full', 'kb-guide': 'full',
    'wear-prediction-embed': 'full'
  };

  let _selectedMaintPrinter = null;
  let _activeTab = 'nozzle';
  const _locked = true;
  let _status = null;
  let _log = [];
  let _wear = [];

  // ═══ Module order ═══
  function getOrder(tabId) {
    return TAB_CONFIG[tabId]?.modules || [];
  }

  // ═══ Module builders ═══
  const BUILDERS = {
    'alerts': (s) => {
      const overdueComps = (s.components || []).filter(c => c.overdue);
      const nozzleWarn = s.active_nozzle?.wear_estimate?.percentage >= 80;
      if (overdueComps.length === 0 && !nozzleWarn) return '';
      let h = `<div class="maint-alert-banner">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <div class="maint-alert-text">`;
      for (const c of overdueComps) {
        h += `<div>${t('maintenance.comp_' + c.component)} — <strong>${t('maintenance.overdue')}</strong> (${c.hours_since_maintenance}${t('time.h')} / ${c.interval_hours}${t('time.h')})</div>`;
      }
      if (nozzleWarn) {
        h += `<div>${t('maintenance.comp_nozzle')} — <strong>${t('maintenance.wear')}: ${s.active_nozzle.wear_estimate.percentage}%</strong></div>`;
      }
      h += '</div></div>';
      return h;
    },

    'lifetime-stats': (s) => {
      return `<div class="stat-grid">
        <div class="stat-card"><div class="stat-value">${s.total_print_hours}${t('time.h')}</div><div class="stat-label">${t('maintenance.total_hours')}</div></div>
        <div class="stat-card"><div class="stat-value">${s.total_prints}</div><div class="stat-label">${t('maintenance.total_prints')}</div></div>
        <div class="stat-card"><div class="stat-value">${fmtW(s.total_filament_g)}</div><div class="stat-label">${t('maintenance.total_filament')}</div></div>
      </div>`;
    },

    'active-nozzle': (s) => {
      let h = `<div class="card-title">${t('maintenance.active_nozzle')}</div>`;
      if (s.active_nozzle) {
        const n = s.active_nozzle;
        const w = n.wear_estimate;
        const wearColor = w.percentage >= 80 ? 'var(--accent-red)' : w.percentage >= 50 ? 'var(--accent-orange)' : 'var(--accent-green)';
        const nozzleInfo = NOZZLE_LIFESPAN[n.type] || NOZZLE_LIFESPAN.stainless_steel;
        const lifespanLabel = nozzleInfo ? `${nozzleInfo.min}–${nozzleInfo.max}${t('time.h')}` : '';
        h += `<div class="nozzle-type">${nozzleInfo?.label || n.type || 'Unknown'} ${n.diameter}mm</div>
          <div class="nozzle-stats">${n.print_hours}${t('time.h')} | ${fmtW(n.filament_g)} | ${n.print_count} prints</div>
          ${lifespanLabel ? `<div class="text-muted" style="font-size:0.7rem;margin:2px 0">${t('maintenance.expected_lifespan', 'Expected lifespan')}: ${lifespanLabel}</div>` : ''}
          <div class="nozzle-wear-bar"><div class="nozzle-wear-fill" style="width:${w.percentage}%;background:${wearColor}"></div></div>
          <div class="nozzle-wear-text" style="color:${wearColor}">${t('maintenance.wear')}: ${w.percentage}%</div>
          ${n.abrasive_g > 0 ? `<div class="text-muted" style="font-size:0.75rem;margin-top:4px">${t('maintenance.abrasive_used')}: ${fmtW(n.abrasive_g)}</div>` : ''}
          ${n.type === 'brass' ? `<div class="text-muted" style="font-size:0.7rem;margin-top:2px;color:var(--accent-orange)">⚠ ${t('maintenance.brass_cf_warning', 'Never use CF/GF filaments with brass nozzle')}</div>` : ''}`;
      } else {
        h += `<p class="text-muted">${t('maintenance.no_nozzle_data')}</p>`;
      }
      h += `<button class="form-btn form-btn-sm mt-sm" data-ripple onclick="toggleNozzleChangeForm()">${t('maintenance.log_nozzle_change')}</button>
        <div id="nozzle-change-form" style="display:none" class="settings-form mt-sm">
          <div class="form-group" style="margin-bottom:8px">
            <label class="form-label">${t('maintenance.nozzle_type')}</label>
            <select class="form-input" id="nozzle-type-input">
              <option value="stainless_steel">${t('maintenance.stainless_steel', 'Stainless steel')}</option>
              <option value="brass">${t('maintenance.brass', 'Brass (standard)')}</option>
              <option value="hardened_steel">${t('maintenance.hardened_steel', 'Hardened steel')}</option>
              <option value="hs01">${t('maintenance.hs01', 'HS01 (Bambu)')}</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom:8px">
            <label class="form-label">${t('maintenance.nozzle_diameter')}</label>
            <select class="form-input" id="nozzle-dia-input">
              <option value="0.4">0.4mm</option>
              <option value="0.2">0.2mm</option>
              <option value="0.6">0.6mm</option>
              <option value="0.8">0.8mm</option>
            </select>
          </div>
          <button class="form-btn" data-ripple onclick="submitNozzleChange()">${t('maintenance.save')}</button>
        </div>`;
      return h;
    },

    'nozzle-history': (s) => {
      if (!s.nozzle_history?.length) return '';
      let h = `<div class="card-title">${t('maintenance.nozzle_history')}</div>`;
      h += `<table class="data-table"><thead><tr><th>${t('maintenance.nozzle_type')}</th><th>${t('maintenance.nozzle_diameter')}</th><th>${t('maintenance.hours')}</th><th>${t('maintenance.prints')}</th><th>${t('history.status')}</th></tr></thead><tbody>`;
      for (const n of s.nozzle_history) {
        const isActive = !n.retired_at;
        const statusPill = isActive ? `<span class="pill pill-completed">${t('maintenance.installed')}</span>` : `<span class="pill pill-cancelled">${t('maintenance.retired')}</span>`;
        h += `<tr><td>${n.nozzle_type}</td><td>${n.nozzle_diameter}mm</td><td>${Math.round(n.total_print_hours * 10) / 10}${t('time.h')}</td><td>${n.print_count}</td><td>${statusPill}</td></tr>`;
      }
      h += '</tbody></table>';
      return h;
    },

    'component-status': (s) => {
      if (!s.components?.length) return '';
      let h = `<div class="card-title">${t('maintenance.component_status')}</div>`;
      for (const c of s.components) {
        const barColor = c.overdue ? 'var(--accent-red)' : c.percentage >= 75 ? 'var(--accent-orange)' : 'var(--accent-green)';
        const overdueTag = c.overdue ? ` <span class="pill pill-failed">${t('maintenance.overdue')}</span>` : '';
        h += `<div class="maintenance-component">
          <div class="maintenance-component-header">
            <span class="maintenance-component-label">${t('maintenance.comp_' + c.component)}</span>${overdueTag}
            <span class="text-muted" style="font-size:0.75rem;margin-left:auto">${c.hours_since_maintenance}${t('time.h')} / ${c.interval_hours}${t('time.h')}</span>
          </div>
          <div class="maintenance-bar"><div class="maintenance-bar-fill" style="width:${c.percentage}%;background:${barColor}"></div></div>
          ${c.last_maintenance ? `<div class="text-muted" style="font-size:0.7rem">${t('maintenance.last')}: ${formatDate(c.last_maintenance)}</div>` : ''}
        </div>`;
      }
      return h;
    },

    'wear-tracking': (s, log, wearData) => {
      if (!wearData?.length) return '';
      let h = `<div class="card-title">${t('maintenance.wear_tracking')}</div>`;
      for (const w of wearData) {
        const limit = WEAR_LIMITS[w.component] || 5000;
        const pct = Math.min(Math.round((w.total_hours / limit) * 100), 100);
        const wearColor = pct >= 80 ? 'var(--accent-red)' : pct >= 50 ? 'var(--accent-orange)' : 'var(--accent-green)';
        const label = t('maintenance.wear_' + w.component) || w.component;
        h += `<div class="wear-item">
          <span class="wear-label">${label}</span>
          <div class="wear-bar"><div class="wear-bar-fill" style="width:${pct}%;background:${wearColor}"></div></div>
          <span class="wear-value">${Math.round(w.total_hours)}${t('time.h')}${w.total_cycles > 0 ? ` / ${w.total_cycles}x` : ''}</span>
        </div>`;
      }
      return h;
    },

    'schedule': (s) => {
      if (!s.components?.length) return '';
      let h = `<div class="card-title">${t('maintenance.schedule')}</div><div class="maint-schedule-grid">`;
      for (const c of s.components) {
        h += `<div class="form-group" style="margin-bottom:0">
          <label class="form-label" style="font-size:0.7rem">${t('maintenance.comp_' + c.component)}</label>
          <div class="flex gap-sm items-center">
            <input class="form-input" style="width:60px;text-align:center" type="number" value="${c.interval_hours}" min="1" data-comp="${c.component}" onchange="updateSchedule(this)">
            <span class="text-muted" style="font-size:0.75rem">${t('time.h')}</span>
          </div>
        </div>`;
      }
      h += '</div>';
      return h;
    },

    'log-form': () => {
      return `<button class="form-btn" data-ripple onclick="toggleMaintenanceForm()">${t('maintenance.log_event')}</button>
        <div id="maint-form-area" style="display:none" class="settings-form mt-sm">
          <div class="flex gap-sm" style="flex-wrap:wrap;align-items:flex-end">
            <div class="form-group" style="flex:1;min-width:120px;margin-bottom:0">
              <label class="form-label">${t('maintenance.component')}</label>
              <select class="form-input" id="maint-component">
                ${COMPONENTS.map(c => `<option value="${c}">${t('maintenance.comp_' + c)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="flex:1;min-width:100px;margin-bottom:0">
              <label class="form-label">${t('maintenance.action')}</label>
              <select class="form-input" id="maint-action">
                ${ACTIONS.map(a => `<option value="${a}">${t('maintenance.action_' + a)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group" style="flex:2;min-width:150px;margin-bottom:0">
              <label class="form-label">${t('maintenance.notes')}</label>
              <input class="form-input" id="maint-notes" placeholder="${t('waste.notes_placeholder')}">
            </div>
            <button class="form-btn" data-ripple onclick="submitMaintenance()">${t('maintenance.save')}</button>
          </div>
        </div>`;
    },

    'kb-intervals': () => {
      const rows = [
        { comp: 'nozzle', action: t('maintenance.action_cleaned', 'Cold pull'), interval: '50', note: t('maintenance.kb_nozzle_note', 'Or when changing material') },
        { comp: 'nozzle', action: t('maintenance.action_replaced', 'Nozzle change'), interval: '200–1000', note: t('maintenance.kb_nozzle_replace_note', 'Depends on nozzle type (brass→HS01)') },
        { comp: 'linear_rods', action: t('maintenance.action_lubricated', 'Oil XY'), interval: '200–300', note: t('maintenance.kb_rods_note', 'Light oil, minimal amount') },
        { comp: 'z_axis', action: t('maintenance.action_lubricated', 'Grease Z leadscrew'), interval: '200', note: t('maintenance.kb_z_note', 'Thick grease') },
        { comp: 'linear_bearings', action: t('maintenance.action_lubricated', 'Grease bearings'), interval: '300–500', note: t('maintenance.kb_bearings_note', 'X1C/P1S — lithium grease') },
        { comp: 'ams', action: t('maintenance.action_cleaned', 'Clean filament path'), interval: '100', note: t('maintenance.kb_ams_note', 'Compressed air + nylon through path') },
        { comp: 'ptfe_tube', action: t('maintenance.action_inspected', 'Inspection'), interval: t('maintenance.monthly', 'Monthly'), note: t('maintenance.kb_ptfe_note', 'Check for kinks and wear') },
        { comp: 'ams_sensors', action: t('maintenance.action_cleaned', 'Cleaning'), interval: t('maintenance.monthly', 'Monthly'), note: t('maintenance.kb_sensors_note', 'Gently wipe sensor lenses') },
        { comp: 'build_plate', action: t('maintenance.action_cleaned', 'Deep cleaning'), interval: t('maintenance.monthly', 'Monthly'), note: t('maintenance.kb_plate_note', 'Warm water + mild dish soap') },
        { comp: 'build_plate', action: 'IPA', interval: t('maintenance.between_prints', 'Between prints'), note: t('maintenance.kb_plate_ipa_note', 'Avoid fingerprints on plate') },
        { comp: 'general', action: t('maintenance.full_cycle', 'Full cycle'), interval: '500', note: t('maintenance.kb_full_note', 'Lubrication + cleaning + inspection') }
      ];
      let h = `<div class="card-title">${t('maintenance.kb_intervals_title', 'Recommended intervals')} <a href="/docs/kb/vedlikehold/dyse" target="_blank" class="text-muted" style="font-size:0.65rem;margin-left:6px">📖 ${t('maintenance.see_docs', 'See documentation')}</a></div>`;
      h += `<table class="data-table"><thead><tr>
        <th>${t('maintenance.component')}</th>
        <th>${t('maintenance.action')}</th>
        <th>${t('maintenance.interval', 'Interval')}</th>
        <th>${t('maintenance.notes')}</th>
      </tr></thead><tbody>`;
      for (const r of rows) {
        h += `<tr><td>${t('maintenance.comp_' + r.comp)}</td><td>${r.action}</td><td>${r.interval}${typeof r.interval === 'string' && /^\d/.test(r.interval) ? t('time.h') : ''}</td><td class="text-muted">${r.note}</td></tr>`;
      }
      h += '</tbody></table>';

      // Nozzle lifespan table
      h += `<div class="card-title" style="margin-top:12px">${t('maintenance.nozzle_lifespan', 'Nozzle lifespan')}</div>`;
      h += `<table class="data-table"><thead><tr><th>${t('maintenance.nozzle_type')}</th><th>${t('maintenance.lifespan', 'Lifespan')}</th><th>${t('maintenance.materials', 'Materials')}</th></tr></thead><tbody>`;
      h += `<tr><td>Brass (standard)</td><td>200–500${t('time.h')}</td><td>PLA, PETG, ABS, TPU</td></tr>`;
      h += `<tr><td>Hardened steel</td><td>300–600${t('time.h')}</td><td>All incl. CF/GF</td></tr>`;
      h += `<tr><td>HS01 (Bambu)</td><td>500–1000${t('time.h')}</td><td>All incl. CF/GF</td></tr>`;
      h += '</tbody></table>';

      // Build plate lifespan
      h += `<div class="card-title" style="margin-top:12px">${t('maintenance.plate_lifespan', 'Plate lifespan (prints)')}</div>`;
      h += `<table class="data-table"><thead><tr><th>${t('maintenance.plate_type', 'Plate type')}</th><th>${t('maintenance.normal_use', 'Normal use')}</th><th>${t('maintenance.intensive_use', 'Intensive use')}</th></tr></thead><tbody>`;
      for (const [key, val] of Object.entries(PLATE_LIFESPAN)) {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        h += `<tr><td>${label}</td><td>${val.normal}</td><td>${val.intensive}</td></tr>`;
      }
      h += '</tbody></table>';
      return h;
    },

    'kb-guide': () => {
      let h = `<div class="card-title">${t('maintenance.guide_title', 'Maintenance guide')}</div>`;
      h += '<div class="maint-guide-grid">';

      // Dyse section
      h += `<div class="settings-card">
        <h4 style="margin:0 0 6px">🔧 ${t('maintenance.comp_nozzle')}</h4>
        <p class="text-muted" style="font-size:0.75rem;margin:0 0 6px">${t('maintenance.kb_nozzle_desc', 'Cold pull is the most effective method for removing contamination and carbon residue.')}</p>
        <div style="font-size:0.75rem"><strong>Cold pull:</strong> Heat up → nylon → 80-90°C → pull out quickly. Repeat 3-5x.</div>
        <div class="text-muted" style="font-size:0.7rem;margin-top:4px">⚠ Always change while nozzle is hot (200°C). Never CF/GF with brass.</div>
        <a href="/docs/kb/vedlikehold/dyse" target="_blank" class="form-btn form-btn-sm" style="margin-top:8px;font-size:0.7rem">📖 ${t('maintenance.read_more', 'Read more')}</a>
      </div>`;

      // Lubrication section
      h += `<div class="settings-card">
        <h4 style="margin:0 0 6px">🛢️ ${t('maintenance.comp_linear_rods', 'Lubrication')}</h4>
        <p class="text-muted" style="font-size:0.75rem;margin:0 0 6px">${t('maintenance.kb_lub_desc', 'Proper lubrication reduces wear and noise. Minimal amount is key.')}</p>
        <div style="font-size:0.75rem"><strong>XY:</strong> 1 drop light oil per point, move carriage 10x, wipe off. <strong>Z:</strong> Thin layer of grease along leadscrew.</div>
        <div class="text-muted" style="font-size:0.7rem;margin-top:4px">⚠ Too much oil attracts dust and creates abrasive paste.</div>
        <a href="/docs/kb/vedlikehold/smoring" target="_blank" class="form-btn form-btn-sm" style="margin-top:8px;font-size:0.7rem">📖 ${t('maintenance.read_more', 'Read more')}</a>
      </div>`;

      // AMS section
      h += `<div class="settings-card">
        <h4 style="margin:0 0 6px">📦 ${t('maintenance.comp_ams', 'AMS')}</h4>
        <p class="text-muted" style="font-size:0.75rem;margin:0 0 6px">${t('maintenance.kb_ams_desc', 'PTFE tubes, filament path and moisture prevention.')}</p>
        <div style="font-size:0.75rem"><strong>Filament path:</strong> Compressed air + nylon through. <strong>Sensors:</strong> Wipe with soft brush.</div>
        <div class="text-muted" style="font-size:0.7rem;margin-top:4px">⚠ Avoid oil on drive gears — calibrated for dry operation. Replace silica gel at 30%+ RH.</div>
        <a href="/docs/kb/vedlikehold/ams" target="_blank" class="form-btn form-btn-sm" style="margin-top:8px;font-size:0.7rem">📖 ${t('maintenance.read_more', 'Read more')}</a>
      </div>`;

      // Plate section
      h += `<div class="settings-card">
        <h4 style="margin:0 0 6px">🛏️ ${t('maintenance.comp_build_plate')}</h4>
        <p class="text-muted" style="font-size:0.75rem;margin:0 0 6px">${t('maintenance.kb_plate_desc', 'IPA between prints, deep cleaning monthly. Flex to remove, never metal scraper.')}</p>
        <div style="font-size:0.75rem"><strong>IPA:</strong> Apply on lint-free paper, wipe in circles, let dry 30-60s. <strong>Deep:</strong> Warm water + dish soap.</div>
        <div class="text-muted" style="font-size:0.7rem;margin-top:4px">⚠ Do not spray cold IPA on hot plate. Handle by the edges.</div>
        <a href="/docs/kb/vedlikehold/plate" target="_blank" class="form-btn form-btn-sm" style="margin-top:8px;font-size:0.7rem">📖 ${t('maintenance.read_more', 'Read more')}</a>
      </div>`;

      // Drying section
      h += `<div class="settings-card">
        <h4 style="margin:0 0 6px">💨 ${t('maintenance.comp_filament_drying', 'Filament drying')}</h4>
        <p class="text-muted" style="font-size:0.75rem;margin:0 0 6px">${t('maintenance.kb_drying_desc', 'Moist filament causes popping, stringing and weak parts.')}</p>
        <div style="font-size:0.75rem"><strong>PLA:</strong> 45-50°C 4-6h | <strong>PETG/ABS:</strong> 65-70°C 4-6h | <strong>PA:</strong> 70-80°C 8-12h (REQUIRED)</div>
        <div class="text-muted" style="font-size:0.7rem;margin-top:4px">⚠ Dry BEFORE adjusting print settings. Print PA/PC/PVA directly from dryer.</div>
        <a href="/docs/kb/vedlikehold/torking" target="_blank" class="form-btn form-btn-sm" style="margin-top:8px;font-size:0.7rem">📖 ${t('maintenance.read_more', 'Read more')}</a>
      </div>`;

      h += '</div>';
      return h;
    },

    'recent-events': (s, log) => {
      if (!log?.length) return '';
      let h = `<div class="card-title">${t('maintenance.recent_events')}</div>`;
      h += `<table class="data-table"><thead><tr><th>${t('history.date')}</th><th>${t('maintenance.component')}</th><th>${t('maintenance.action')}</th><th>${t('maintenance.notes')}</th></tr></thead><tbody>`;
      for (const e of log) {
        h += `<tr><td>${formatDate(e.timestamp)}</td><td>${t('maintenance.comp_' + e.component)}</td><td>${t('maintenance.action_' + e.action)}</td><td>${e.notes || '--'}</td></tr>`;
      }
      h += '</tbody></table>';
      return h;
    }
  };

  // ═══ Tab switching ═══
  function switchTab(tabId) {
    _activeTab = tabId;
    document.querySelectorAll('.maint-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
    document.querySelectorAll('.maint-tab-panel').forEach(p => {
      const isActive = p.id === `maint-tab-${tabId}`;
      p.classList.toggle('active', isActive);
      p.style.display = isActive ? 'grid' : 'none';
    });
    const slug = tabId === 'nozzle' ? 'maintenance' : `maintenance/${tabId}`;
    if (location.hash !== '#' + slug) history.replaceState(null, '', '#' + slug);
    _loadExternalTab(tabId);
  }

  function _loadExternalTab(tabId) {
    const cfg = TAB_CONFIG[tabId];
    if (!cfg?.external) return;
    const container = document.getElementById(`maint-ext-${tabId}`);
    if (!container) return;
    if (tabId === 'wearprediction' && typeof loadWearPredictionPanel === 'function') {
      const realBody = document.getElementById('overlay-panel-body');
      if (realBody) realBody.removeAttribute('id');
      container.id = 'overlay-panel-body';
      loadWearPredictionPanel();
      container.id = `maint-ext-${tabId}`;
      if (realBody) realBody.id = 'overlay-panel-body';
    }
  }

  // ═══ Main render ═══
  async function loadMaintenance(initialTab) {
    if (initialTab && TAB_CONFIG[initialTab]) _activeTab = initialTab;
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;

    // Read sub-slug from hash
    const hashParts = location.hash.replace('#', '').split('/');
    if (hashParts[0] === 'maintenance' && hashParts[1] && TAB_CONFIG[hashParts[1]]) {
      _activeTab = hashParts[1];
    }

    const printerId = _selectedMaintPrinter || window.printerState.getActivePrinterId();
    _selectedMaintPrinter = printerId;

    if (!printerId) {
      panel.innerHTML = `<div style="text-align:center;padding:3rem 1rem">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="margin-bottom:1rem"><rect x="6" y="2" width="12" height="8" rx="1"/><rect x="4" y="10" width="16" height="10" rx="1"/><circle cx="8" cy="15" r="1"/><line x1="12" y1="15" x2="18" y2="15"/></svg>
        <h3 style="margin:0 0 0.5rem;color:var(--text-primary)">${t('common.no_printers_title')}</h3>
        <p class="text-muted" style="margin:0 0 1rem">${t('common.no_printers_desc')}</p>
        <button class="form-btn" onclick="location.hash='#settings'">${t('common.add_printer_btn')}</button>
      </div>`;
      return;
    }

    try {
      const [statusRes, logRes] = await Promise.all([
        fetch(`/api/maintenance/status?printer_id=${printerId}`),
        fetch(`/api/maintenance/log?printer_id=${printerId}&limit=20`)
      ]);
      _status = await statusRes.json();
      _log = await logRes.json();

      // Fetch wear data (optional)
      try {
        const wearRes = await fetch(`/api/wear?printer_id=${printerId}`);
        _wear = await wearRes.json();
      } catch (_) { _wear = []; }

      let html = '';

      // Printer selector
      html += buildPrinterSelector('changeMaintPrinter', _selectedMaintPrinter, false);

      // Toolbar
      html += `<div class="stats-toolbar">
        <button class="form-btn" data-ripple title="${t('maintenance.log_nozzle_change')}" data-bs-toggle="tooltip" onclick="showGlobalNozzleChange()" style="display:flex;align-items:center;gap:4px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          <span>${t('maintenance.log_nozzle_change')}</span>
        </button>
        <button class="form-btn" data-ripple title="${t('maintenance.log_event')}" data-bs-toggle="tooltip" onclick="showGlobalMaintEvent()" style="display:flex;align-items:center;gap:4px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>${t('maintenance.log_event')}</span>
        </button>
      </div>`;

      // Global form container
      html += `<div id="maint-global-form" style="display:none"></div>`;

      // Tab bar
      html += '<div class="tabs">';
      for (const [id, cfg] of Object.entries(TAB_CONFIG)) {
        html += `<button class="tab-btn maint-tab-btn ${id === _activeTab ? 'active' : ''}" data-tab="${id}" data-ripple onclick="switchMaintTab('${id}')">${t(cfg.label)}</button>`;
      }
      html += '</div>';

      // Tab panels
      for (const [tabId, cfg] of Object.entries(TAB_CONFIG)) {
        const order = getOrder(tabId);
        html += `<div class="tab-panel maint-tab-panel stats-tab-panel stagger-in ix-tab-panel ${tabId === _activeTab ? 'active' : ''}" id="maint-tab-${tabId}" style="display:${tabId === _activeTab ? 'grid' : 'none'}">`;
        let _si = 0;
        if (cfg.external) {
          // External tab — render empty container, loaded after DOM insert
          html += `<div class="stats-module stats-module-full" id="maint-ext-${tabId}" style="--i:0"></div>`;
        } else {
          for (const modId of order) {
            const builder = BUILDERS[modId];
            if (!builder) continue;
            const content = builder(_status, _log, _wear);
            if (!content) continue;
            const isFull = (MODULE_SIZE[modId] || 'full') === 'full';
            html += `<div class="stats-module${isFull ? ' stats-module-full' : ''}" data-module-id="${modId}" style="--i:${_si++}">`;
            html += content;
            html += '</div>';
          }
        }
        html += '</div>';
      }

      panel.innerHTML = html;

      // Enhance data tables with search/sort/pagination
      panel.querySelectorAll('.data-table').forEach(tbl => {
        if (tbl.querySelector('tbody')?.children.length > 5 && typeof enhanceTable === 'function') {
          enhanceTable(tbl.parentElement, { pageSize: 15, searchPlaceholder: t('maintenance.search', 'Search...') });
        }
      });

      // Load external panels after DOM insert
      _loadExternalTab(_activeTab);
    } catch (e) {
      panel.innerHTML = `<p class="text-muted">${t('maintenance.load_failed')}</p>`;
    }
  }

  // ═══ Global toolbar forms ═══
  window.showGlobalNozzleChange = function() {
    const container = document.getElementById('maint-global-form');
    if (!container) return;
    container.style.display = '';
    container.innerHTML = `<div class="settings-card" style="margin-bottom:10px">
      <div class="settings-form">
        <div class="flex gap-sm" style="flex-wrap:wrap;align-items:flex-end">
          <div class="form-group" style="flex:1;min-width:140px;margin-bottom:0">
            <label class="form-label">${t('maintenance.nozzle_type')}</label>
            <select class="form-input" id="global-nozzle-type">
              <option value="stainless_steel">${t('maintenance.stainless_steel', 'Stainless steel')}</option>
              <option value="brass">${t('maintenance.brass', 'Brass (standard)')}</option>
              <option value="hardened_steel">${t('maintenance.hardened_steel', 'Hardened steel')}</option>
              <option value="hs01">${t('maintenance.hs01', 'HS01 (Bambu)')}</option>
            </select>
          </div>
          <div class="form-group" style="flex:1;min-width:100px;margin-bottom:0">
            <label class="form-label">${t('maintenance.nozzle_diameter')}</label>
            <select class="form-input" id="global-nozzle-dia">
              <option value="0.4">0.4mm</option>
              <option value="0.2">0.2mm</option>
              <option value="0.6">0.6mm</option>
              <option value="0.8">0.8mm</option>
            </select>
          </div>
          <button class="form-btn" data-ripple onclick="submitGlobalNozzleChange()">${t('maintenance.save')}</button>
          <button class="form-btn form-btn-sm" data-ripple style="background:transparent;color:var(--text-muted)" onclick="hideGlobalMaintForm()">${t('settings.cancel')}</button>
        </div>
      </div>
    </div>`;
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  window.showGlobalMaintEvent = function() {
    const container = document.getElementById('maint-global-form');
    if (!container) return;
    container.style.display = '';
    container.innerHTML = `<div class="settings-card" style="margin-bottom:10px">
      <div class="settings-form">
        <div class="flex gap-sm" style="flex-wrap:wrap;align-items:flex-end">
          <div class="form-group" style="flex:1;min-width:120px;margin-bottom:0">
            <label class="form-label">${t('maintenance.component')}</label>
            <select class="form-input" id="global-maint-component">
              ${COMPONENTS.map(c => `<option value="${c}">${t('maintenance.comp_' + c)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="flex:1;min-width:100px;margin-bottom:0">
            <label class="form-label">${t('maintenance.action')}</label>
            <select class="form-input" id="global-maint-action">
              ${ACTIONS.map(a => `<option value="${a}">${t('maintenance.action_' + a)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="flex:2;min-width:150px;margin-bottom:0">
            <label class="form-label">${t('maintenance.notes')}</label>
            <input class="form-input" id="global-maint-notes" placeholder="${t('waste.notes_placeholder')}">
          </div>
          <button class="form-btn" data-ripple onclick="submitGlobalMaintEvent()">${t('maintenance.save')}</button>
          <button class="form-btn form-btn-sm" data-ripple style="background:transparent;color:var(--text-muted)" onclick="hideGlobalMaintForm()">${t('settings.cancel')}</button>
        </div>
      </div>
    </div>`;
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  window.hideGlobalMaintForm = function() {
    const c = document.getElementById('maint-global-form');
    if (c) { c.style.display = 'none'; c.innerHTML = ''; }
  };

  window.submitGlobalNozzleChange = async function() {
    const printerId = _selectedMaintPrinter || window.printerState.getActivePrinterId();
    const nozzleType = document.getElementById('global-nozzle-type')?.value;
    const nozzleDia = parseFloat(document.getElementById('global-nozzle-dia')?.value);
    if (!printerId || !nozzleType || !nozzleDia) return;
    await fetch('/api/maintenance/nozzle-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ printer_id: printerId, nozzle_type: nozzleType, nozzle_diameter: nozzleDia })
    });
    loadMaintenance();
  };

  window.submitGlobalMaintEvent = async function() {
    const printerId = _selectedMaintPrinter || window.printerState.getActivePrinterId();
    const component = document.getElementById('global-maint-component')?.value;
    const action = document.getElementById('global-maint-action')?.value;
    const notes = document.getElementById('global-maint-notes')?.value?.trim();
    if (!printerId || !component || !action) return;
    await fetch('/api/maintenance/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ printer_id: printerId, component, action, notes: notes || null })
    });
    loadMaintenance();
  };

  // ═══ Global API ═══
  window.loadMaintenancePanel = loadMaintenance;
  window.changeMaintPrinter = function(value) { _selectedMaintPrinter = value || null; loadMaintenance(); };
  window.switchMaintTab = switchTab;
  window.toggleNozzleChangeForm = function() {
    const f = document.getElementById('nozzle-change-form');
    if (f) f.style.display = f.style.display === 'none' ? '' : 'none';
  };

  window.toggleMaintenanceForm = function() {
    const f = document.getElementById('maint-form-area');
    if (f) f.style.display = f.style.display === 'none' ? '' : 'none';
  };

  window.submitNozzleChange = async function() {
    const printerId = _selectedMaintPrinter || window.printerState.getActivePrinterId();
    const nozzleType = document.getElementById('nozzle-type-input')?.value;
    const nozzleDia = parseFloat(document.getElementById('nozzle-dia-input')?.value);
    if (!printerId || !nozzleType || !nozzleDia) return;
    await fetch('/api/maintenance/nozzle-change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ printer_id: printerId, nozzle_type: nozzleType, nozzle_diameter: nozzleDia })
    });
    loadMaintenance();
  };

  window.submitMaintenance = async function() {
    const printerId = _selectedMaintPrinter || window.printerState.getActivePrinterId();
    const component = document.getElementById('maint-component')?.value;
    const action = document.getElementById('maint-action')?.value;
    const notes = document.getElementById('maint-notes')?.value?.trim();
    if (!printerId || !component || !action) return;
    await fetch('/api/maintenance/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ printer_id: printerId, component, action, notes: notes || null })
    });
    loadMaintenance();
  };

  window.updateSchedule = async function(input) {
    const printerId = _selectedMaintPrinter || window.printerState.getActivePrinterId();
    const component = input.dataset.comp;
    const intervalHours = parseInt(input.value, 10);
    if (!printerId || !component || isNaN(intervalHours) || intervalHours < 1) return;
    try {
      await fetch('/api/maintenance/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ printer_id: printerId, component, interval_hours: intervalHours })
      });
      if (typeof showToast === 'function') showToast(t('maintenance.schedule_saved', 'Saved'), 'success');
      loadMaintenance();
    } catch (_) {}
  };

})();
