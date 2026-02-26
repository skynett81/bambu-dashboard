// Maintenance & Wear Tracking Panel
(function() {
  window.loadMaintenancePanel = loadMaintenance;

  function formatDate(iso) {
    if (!iso) return '--';
    const d = new Date(iso);
    const locale = (window.i18n?.getLocale() || 'nb').replace('_', '-');
    return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function formatWeight(g) {
    if (g >= 1000) return `${(g / 1000).toFixed(1)} kg`;
    return `${Math.round(g)}g`;
  }

  const COMPONENTS = ['nozzle', 'ptfe_tube', 'linear_rods', 'carbon_rods', 'build_plate', 'general'];
  const ACTIONS = ['cleaned', 'replaced', 'lubricated', 'inspected'];

  let _selectedMaintPrinter = null;

  window.changeMaintPrinter = function(value) {
    _selectedMaintPrinter = value || null;
    loadMaintenance();
  };

  async function loadMaintenance() {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;

    // Default to active printer if no selection made yet
    const printerId = _selectedMaintPrinter || window.printerState.getActivePrinterId();
    _selectedMaintPrinter = printerId;

    if (!printerId) {
      panel.innerHTML = `<p class="text-muted">${t('maintenance.no_printer')}</p>`;
      return;
    }

    try {
      const [statusRes, logRes] = await Promise.all([
        fetch(`/api/maintenance/status?printer_id=${printerId}`),
        fetch(`/api/maintenance/log?printer_id=${printerId}&limit=20`)
      ]);
      const s = await statusRes.json();
      const log = await logRes.json();

      let html = buildPrinterSelector('changeMaintPrinter', _selectedMaintPrinter, false);

      // Lifetime stats
      html += `<div class="stat-grid" style="grid-template-columns:repeat(3,1fr)">
        <div class="stat-card"><div class="stat-value">${s.total_print_hours}${t('time.h')}</div><div class="stat-label">${t('maintenance.total_hours')}</div></div>
        <div class="stat-card"><div class="stat-value">${s.total_prints}</div><div class="stat-label">${t('maintenance.total_prints')}</div></div>
        <div class="stat-card"><div class="stat-value">${formatWeight(s.total_filament_g)}</div><div class="stat-label">${t('maintenance.total_filament')}</div></div>
      </div>`;

      // Active nozzle
      if (s.active_nozzle) {
        const n = s.active_nozzle;
        const w = n.wear_estimate;
        const wearColor = w.percentage >= 80 ? 'var(--accent-red)' : w.percentage >= 50 ? 'var(--accent-orange)' : 'var(--accent-green)';
        html += `<div class="maintenance-nozzle-card mt-md">
          <div class="card-title">${t('maintenance.active_nozzle')}</div>
          <div class="nozzle-type">${n.type || 'Unknown'} ${n.diameter}mm</div>
          <div class="nozzle-stats">${n.print_hours}${t('time.h')} | ${formatWeight(n.filament_g)} | ${n.print_count} prints</div>
          <div class="nozzle-wear-bar"><div class="nozzle-wear-fill" style="width:${w.percentage}%;background:${wearColor}"></div></div>
          <div class="nozzle-wear-text" style="color:${wearColor}">${t('maintenance.wear')}: ${w.percentage}%</div>
          ${n.abrasive_g > 0 ? `<div class="text-muted" style="font-size:0.75rem;margin-top:4px">${t('maintenance.abrasive_used')}: ${formatWeight(n.abrasive_g)}</div>` : ''}
          <button class="form-btn form-btn-sm mt-sm" onclick="toggleNozzleChangeForm()">${t('maintenance.log_nozzle_change')}</button>
          <div id="nozzle-change-form" style="display:none" class="settings-form mt-sm">
            <div class="flex gap-sm" style="flex-wrap:wrap;align-items:flex-end">
              <div class="form-group" style="flex:1;min-width:120px;margin-bottom:0">
                <label class="form-label">${t('maintenance.nozzle_type')}</label>
                <select class="form-input" id="nozzle-type-input">
                  <option value="stainless_steel">Stainless Steel</option>
                  <option value="hardened_steel">Hardened Steel</option>
                </select>
              </div>
              <div class="form-group" style="width:80px;margin-bottom:0">
                <label class="form-label">${t('maintenance.nozzle_diameter')}</label>
                <select class="form-input" id="nozzle-dia-input">
                  <option value="0.4">0.4mm</option>
                  <option value="0.2">0.2mm</option>
                  <option value="0.6">0.6mm</option>
                  <option value="0.8">0.8mm</option>
                </select>
              </div>
              <button class="form-btn" onclick="submitNozzleChange()">${t('maintenance.save')}</button>
            </div>
          </div>
        </div>`;
      } else {
        html += `<div class="maintenance-nozzle-card mt-md">
          <div class="card-title">${t('maintenance.active_nozzle')}</div>
          <p class="text-muted">${t('maintenance.no_nozzle_data')}</p>
          <button class="form-btn form-btn-sm mt-sm" onclick="toggleNozzleChangeForm()">${t('maintenance.log_nozzle_change')}</button>
          <div id="nozzle-change-form" style="display:none" class="settings-form mt-sm">
            <div class="flex gap-sm" style="flex-wrap:wrap;align-items:flex-end">
              <div class="form-group" style="flex:1;min-width:120px;margin-bottom:0">
                <label class="form-label">${t('maintenance.nozzle_type')}</label>
                <select class="form-input" id="nozzle-type-input">
                  <option value="stainless_steel">Stainless Steel</option>
                  <option value="hardened_steel">Hardened Steel</option>
                </select>
              </div>
              <div class="form-group" style="width:80px;margin-bottom:0">
                <label class="form-label">${t('maintenance.nozzle_diameter')}</label>
                <select class="form-input" id="nozzle-dia-input">
                  <option value="0.4">0.4mm</option>
                  <option value="0.2">0.2mm</option>
                  <option value="0.6">0.6mm</option>
                  <option value="0.8">0.8mm</option>
                </select>
              </div>
              <button class="form-btn" onclick="submitNozzleChange()">${t('maintenance.save')}</button>
            </div>
          </div>
        </div>`;
      }

      // Component status
      if (s.components?.length > 0) {
        html += `<div class="mt-md"><div class="card-title">${t('maintenance.component_status')}</div>`;
        for (const c of s.components) {
          const barColor = c.overdue ? 'var(--accent-red)' : c.percentage >= 75 ? 'var(--accent-orange)' : 'var(--accent-green)';
          const overdueTag = c.overdue ? ` <span class="pill pill-failed">${t('maintenance.overdue')}</span>` : '';
          html += `<div class="maintenance-component">
            <div class="maintenance-component-header">
              <span class="maintenance-component-label">${t('maintenance.comp_' + c.component)}</span>${overdueTag}
              <span class="text-muted" style="font-size:0.75rem;margin-left:auto">${c.hours_since_maintenance}${t('time.h')} / ${c.interval_hours}${t('time.h')}</span>
            </div>
            <div class="maintenance-bar"><div class="maintenance-bar-fill" style="width:${c.percentage}%;background:${barColor}"></div></div>
            ${c.last_maintenance ? `<div class="text-muted" style="font-size:0.7rem">${t('maintenance.last')}: ${formatDate(c.last_maintenance)}</div>` : ''}
          </div>`;
        }
        html += `</div>`;
      }

      // Component wear tracking
      try {
        const wearRes = await fetch(`/api/wear?printer_id=${printerId}`);
        const wearData = await wearRes.json();
        if (wearData && wearData.length > 0) {
          const WEAR_LIMITS = {
            fan_cooling: 3000, fan_aux: 3000, fan_chamber: 3000, fan_heatbreak: 3000,
            hotend_heater: 2000, bed_heater: 5000,
            belts_x: 5000, belts_y: 5000,
            linear_rails: 10000, extruder_motor: 5000
          };
          html += `<div class="wear-section mt-md"><div class="card-title">${t('maintenance.wear_tracking')}</div>`;
          for (const w of wearData) {
            const limit = WEAR_LIMITS[w.component] || 5000;
            const pct = Math.min(Math.round((w.total_hours / limit) * 100), 100);
            const wearColor = pct >= 80 ? 'var(--accent-red)' : pct >= 50 ? 'var(--accent-orange)' : 'var(--accent-green)';
            const label = t('maintenance.wear_' + w.component) || w.component;
            html += `<div class="wear-item">
              <span class="wear-label">${label}</span>
              <div class="wear-bar"><div class="wear-bar-fill" style="width:${pct}%;background:${wearColor}"></div></div>
              <span class="wear-value">${Math.round(w.total_hours)}${t('time.h')}${w.total_cycles > 0 ? ` / ${w.total_cycles}x` : ''}</span>
            </div>`;
          }
          html += `</div>`;
        }
      } catch (_) { /* wear data optional */ }

      // Log maintenance form
      html += `<div class="mt-md">
        <button class="form-btn" onclick="toggleMaintenanceForm()">${t('maintenance.log_event')}</button>
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
            <button class="form-btn" onclick="submitMaintenance()">${t('maintenance.save')}</button>
          </div>
        </div>
      </div>`;

      // Recent log
      if (log.length > 0) {
        html += `<div class="mt-md"><div class="card-title">${t('maintenance.recent_events')}</div>`;
        html += `<table class="data-table"><thead><tr><th>${t('history.date')}</th><th>${t('maintenance.component')}</th><th>${t('maintenance.action')}</th><th>${t('maintenance.notes')}</th></tr></thead><tbody>`;
        for (const e of log) {
          html += `<tr><td>${formatDate(e.timestamp)}</td><td>${t('maintenance.comp_' + e.component)}</td><td>${t('maintenance.action_' + e.action)}</td><td>${e.notes || '--'}</td></tr>`;
        }
        html += `</tbody></table></div>`;
      }

      // Maintenance schedule (editable)
      if (s.components?.length > 0) {
        html += `<div class="mt-md"><div class="card-title">${t('maintenance.schedule')}</div>
          <div class="flex gap-sm" style="flex-wrap:wrap">`;
        for (const c of s.components) {
          html += `<div class="form-group" style="width:140px;margin-bottom:8px">
            <label class="form-label" style="font-size:0.7rem">${t('maintenance.comp_' + c.component)}</label>
            <div class="flex gap-sm items-center">
              <input class="form-input" style="width:60px;text-align:center" type="number" value="${c.interval_hours}" min="1" data-comp="${c.component}" onchange="updateSchedule(this)">
              <span class="text-muted" style="font-size:0.75rem">${t('time.h')}</span>
            </div>
          </div>`;
        }
        html += `</div></div>`;
      }

      // Nozzle history
      if (s.nozzle_history?.length > 0) {
        html += `<div class="mt-md"><div class="card-title">${t('maintenance.nozzle_history')}</div>`;
        html += `<table class="data-table"><thead><tr><th>${t('maintenance.nozzle_type')}</th><th>${t('maintenance.nozzle_diameter')}</th><th>${t('maintenance.hours')}</th><th>${t('stats.filament_used')}</th><th>${t('maintenance.prints')}</th><th>${t('history.status')}</th></tr></thead><tbody>`;
        for (const n of s.nozzle_history) {
          const isActive = !n.retired_at;
          const statusPill = isActive ? `<span class="pill pill-completed">${t('maintenance.installed')}</span>` : `<span class="pill pill-cancelled">${t('maintenance.retired')}</span>`;
          html += `<tr><td>${n.nozzle_type}</td><td>${n.nozzle_diameter}mm</td><td>${Math.round(n.total_print_hours * 10) / 10}${t('time.h')}</td><td>${formatWeight(n.total_filament_g)}</td><td>${n.print_count}</td><td>${statusPill}</td></tr>`;
        }
        html += `</tbody></table></div>`;
      }

      panel.innerHTML = html;
    } catch (e) {
      panel.innerHTML = `<p class="text-muted">${t('maintenance.load_failed')}</p>`;
    }
  }

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
    const intervalHours = parseFloat(input.value);
    if (!printerId || !component || !intervalHours) return;

    await fetch('/api/maintenance/schedule', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ printer_id: printerId, component, interval_hours: intervalHours })
    });
  };
})();
