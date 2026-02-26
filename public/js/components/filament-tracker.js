// Filament Inventory Tracker - Per Printer
(function() {
  function hexToRgb(hex) {
    if (!hex || hex.length < 6) return '#888';
    return `#${hex.substring(0, 6)}`;
  }

  function hexToRgbColor(hex) {
    if (!hex || hex.length < 6) return 'rgb(128,128,128)';
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgb(${r},${g},${b})`;
  }

  function isLightColor(hex) {
    if (!hex || hex.length < 6) return false;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 160;
  }

  function printerName(id) {
    return window.printerState?._printerMeta?.[id]?.name || id || '--';
  }

  window.loadFilamentPanel = loadFilament;

  async function loadFilament() {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;

    try {
      let html = '';

      // ---- Active filament per printer (from live AMS data) ----
      html += buildActiveFilamentSection();

      // ---- Inventory per printer ----
      const res = await fetch('/api/filament');
      const allSpools = await res.json();

      // Group by printer_id
      const grouped = {};
      const unassigned = [];
      for (const s of allSpools) {
        if (s.printer_id) {
          if (!grouped[s.printer_id]) grouped[s.printer_id] = [];
          grouped[s.printer_id].push(s);
        } else {
          unassigned.push(s);
        }
      }

      // Get all printer IDs (from state + any that have filament)
      const state = window.printerState;
      const printerIds = state ? state.getPrinterIds() : [];
      const allIds = [...new Set([...printerIds, ...Object.keys(grouped)])];

      for (const pid of allIds) {
        const spools = grouped[pid] || [];
        const name = printerName(pid);

        html += `<div class="filament-printer-section">
          <div class="filament-printer-header">
            <span class="printer-tag">${name}</span>
            <span class="text-muted" style="font-size:0.75rem">${spools.length} ${spools.length === 1 ? 'spole' : 'spoler'}</span>
            <button class="form-btn form-btn-sm" style="margin-left:auto" onclick="showAddFilamentForm('${pid}')">${t('filament.add_spool')}</button>
          </div>`;

        if (spools.length > 0) {
          html += '<div class="filament-grid">';
          for (const s of spools) {
            html += renderSpoolCard(s);
          }
          html += '</div>';
        }

        html += `<div id="filament-form-${pid}" style="display:none"></div>`;
        html += '</div>';
      }

      // Unassigned spools
      if (unassigned.length > 0) {
        html += `<div class="filament-printer-section">
          <div class="filament-printer-header">
            <span class="text-muted" style="font-size:0.8rem;font-weight:600">${t('filament.unassigned')}</span>
            <span class="text-muted" style="font-size:0.75rem">${unassigned.length} ${unassigned.length === 1 ? 'spole' : 'spoler'}</span>
          </div>
          <div class="filament-grid">`;
        for (const s of unassigned) {
          html += renderSpoolCard(s);
        }
        html += '</div></div>';
      }

      panel.innerHTML = html;
    } catch (e) {
      panel.innerHTML = `<p class="text-muted">${t('filament.load_failed')}</p>`;
    }
  }

  function renderSpoolCard(s) {
    const remaining = s.weight_total_g - s.weight_used_g;
    const pct = Math.round((remaining / s.weight_total_g) * 100);
    const color = hexToRgb(s.color_hex);

    return `
      <div class="filament-card">
        <div class="flex items-center gap-sm" style="justify-content:space-between">
          <div class="flex items-center gap-sm">
            <span class="filament-color-swatch" style="background:${color}"></span>
            <div>
              <strong>${s.type}</strong>
              <span class="text-muted" style="font-size:0.75rem"> ${s.brand || ''}</span>
            </div>
          </div>
          <button class="filament-delete-btn" onclick="deleteFilamentSpool(${s.id})" title="${t('settings.delete')}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="mt-sm" style="font-size:0.8rem;color:var(--text-secondary)">
          ${s.color_name || ''} &middot; ${Math.round(remaining)}g ${t('filament.remaining')}
        </div>
        <div class="filament-bar">
          <div class="filament-bar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
        <div class="flex justify-between mt-sm" style="font-size:0.75rem;color:var(--text-muted)">
          <span>${pct}% ${t('filament.remaining')}</span>
          <span>${s.cost_nok ? s.cost_nok + ' kr' : ''}</span>
        </div>
      </div>`;
  }

  function buildActiveFilamentSection() {
    const state = window.printerState;
    if (!state) return '';

    const ids = state.getPrinterIds();
    if (ids.length === 0) return '';

    let html = `<div class="card-title">${t('common.active_filament')}</div>`;
    let hasAny = false;

    for (const id of ids) {
      const ps = state._printers[id];
      const printData = ps?.print || ps;
      const amsData = printData?.ams;
      if (!amsData?.ams || amsData.ams.length === 0) continue;

      hasAny = true;
      const name = printerName(id);
      const activeTray = amsData.tray_now;

      html += `<div class="active-filament-printer">
        <div class="active-filament-printer-name">${name}</div>
        <div class="active-filament-trays">`;

      let globalSlot = 0;
      for (let unitIdx = 0; unitIdx < amsData.ams.length; unitIdx++) {
        const trays = amsData.ams[unitIdx]?.tray;
        if (!trays) continue;

        for (let i = 0; i < trays.length; i++) {
          const tray = trays[i];
          const isActive = String(globalSlot) === String(activeTray);

          if (tray && tray.tray_type) {
            const color = hexToRgbColor(tray.tray_color);
            const light = isLightColor(tray.tray_color);
            const remain = tray.remain >= 0 ? tray.remain : '?';
            const brand = tray.tray_sub_brands || '';
            const slotLabel = amsData.ams.length > 1
              ? `AMS${unitIdx + 1}:${i + 1}`
              : `${i + 1}`;

            html += `<div class="active-filament-tray ${isActive ? 'active-filament-tray-active' : ''}">
              <div class="active-filament-color" style="background:${color};${light ? 'border:1px solid var(--border-color);' : ''}"></div>
              <div class="active-filament-info">
                <span class="active-filament-type">${tray.tray_type}${brand ? ' · ' + brand : ''}</span>
                <span class="active-filament-remain">${remain}%</span>
              </div>
              <span class="active-filament-slot">${slotLabel}</span>
            </div>`;
          }
          globalSlot++;
        }
      }

      html += `</div></div>`;
    }

    if (!hasAny) {
      html += `<p class="text-muted" style="margin-bottom:16px">${t('common.no_ams_data')}</p>`;
    }

    return html;
  }

  window.showAddFilamentForm = function(printerId) {
    // Hide all other forms first
    document.querySelectorAll('[id^="filament-form-"]').forEach(el => {
      el.style.display = 'none';
      el.innerHTML = '';
    });

    const container = document.getElementById(`filament-form-${printerId}`);
    if (!container) return;

    container.style.display = '';
    container.innerHTML = `
      <div class="settings-form mt-sm" style="border-top:1px solid var(--border-color);padding-top:12px">
        <div class="flex gap-sm" style="flex-wrap:wrap">
          <div class="form-group" style="flex:1;min-width:120px">
            <label class="form-label">${t('filament.brand')}</label>
            <input class="form-input" id="f-brand-${printerId}" placeholder="Bambu Lab">
          </div>
          <div class="form-group" style="flex:1;min-width:100px">
            <label class="form-label">${t('filament.type')}</label>
            <input class="form-input" id="f-type-${printerId}" placeholder="PLA" required>
          </div>
          <div class="form-group" style="flex:1;min-width:100px">
            <label class="form-label">${t('filament.color')}</label>
            <input class="form-input" id="f-color-${printerId}" placeholder="">
          </div>
          <div class="form-group" style="width:80px">
            <label class="form-label">${t('filament.color_hex')}</label>
            <input class="form-input" id="f-hex-${printerId}" placeholder="FFFFFF">
          </div>
          <div class="form-group" style="width:80px">
            <label class="form-label">${t('filament.weight')}</label>
            <input class="form-input" id="f-weight-${printerId}" type="number" value="1000">
          </div>
          <div class="form-group" style="width:80px">
            <label class="form-label">${t('filament.price')}</label>
            <input class="form-input" id="f-cost-${printerId}" type="number" placeholder="219">
          </div>
        </div>
        <div class="flex gap-sm">
          <button class="form-btn" onclick="saveFilament('${printerId}')">${t('filament.save')}</button>
          <button class="form-btn form-btn-sm" style="background:transparent;color:var(--text-muted)" onclick="hideFilamentForm('${printerId}')">${t('settings.cancel')}</button>
        </div>
      </div>
    `;
  };

  window.hideFilamentForm = function(printerId) {
    const container = document.getElementById(`filament-form-${printerId}`);
    if (container) {
      container.style.display = 'none';
      container.innerHTML = '';
    }
  };

  window.saveFilament = async function(printerId) {
    const data = {
      printer_id: printerId,
      brand: document.getElementById(`f-brand-${printerId}`).value,
      type: document.getElementById(`f-type-${printerId}`).value,
      color_name: document.getElementById(`f-color-${printerId}`).value,
      color_hex: document.getElementById(`f-hex-${printerId}`).value,
      weight_total_g: parseFloat(document.getElementById(`f-weight-${printerId}`).value) || 1000,
      weight_used_g: 0,
      cost_nok: parseFloat(document.getElementById(`f-cost-${printerId}`).value) || null
    };

    if (!data.type) return alert(t('filament.type_required'));

    await fetch('/api/filament', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    loadFilament();
  };

  window.deleteFilamentSpool = async function(id) {
    await fetch(`/api/filament/${id}`, { method: 'DELETE' });
    loadFilament();
  };

})();
