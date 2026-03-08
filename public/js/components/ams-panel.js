// AMS Panel - Bambu Studio style card layout
(function() {
  let _inventorySpools = null;
  let _inventoryLoaded = false;
  let _selectedUnit = 0;

  async function _loadInventorySpools() {
    try {
      const res = await fetch('/api/inventory/spools');
      _inventorySpools = await res.json();
      _inventoryLoaded = true;
    } catch { _inventorySpools = []; _inventoryLoaded = true; }
  }

  function _getLinkedSpool(printerId, amsUnit, amsTray) {
    if (!_inventorySpools) return null;
    return _inventorySpools.find(s =>
      s.printer_id === printerId && s.ams_unit === amsUnit && s.ams_tray === amsTray && !s.archived
    ) || null;
  }

  window.getLinkedSpool = _getLinkedSpool;
  setInterval(() => { if (_inventoryLoaded) _loadInventorySpools(); }, 30000);
  _loadInventorySpools();

  function hexToRgb(hex) {
    if (!hex || hex.length < 6) return 'rgb(128,128,128)';
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgb(${r},${g},${b})`;
  }

  function hexToRgba(hex, alpha) {
    if (!hex || hex.length < 6) return `rgba(128,128,128,${alpha})`;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function isLightColor(hex) {
    if (!hex || hex.length < 6) return false;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 160;
  }

  function drawTubes(container, activeTray, amsUnits, unitIdx) {
    const canvas = document.getElementById('ams-tube-canvas');
    if (!canvas) return;
    const slotsEl = document.getElementById('ams-slots');
    if (!slotsEl) return;
    const tubeArea = canvas.parentElement;
    canvas.width = tubeArea.offsetWidth;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const slots = slotsEl.querySelectorAll('.ams-card');
    const hubX = canvas.width / 2;
    const hubY = canvas.height - 10;

    // Draw horizontal splitter bar
    const barLeft = Math.min(...Array.from(slots).map(s => {
      const r = s.getBoundingClientRect();
      const p = tubeArea.getBoundingClientRect();
      return r.left - p.left + r.width / 2;
    }));
    const barRight = Math.max(...Array.from(slots).map(s => {
      const r = s.getBoundingClientRect();
      const p = tubeArea.getBoundingClientRect();
      return r.left - p.left + r.width / 2;
    }));
    const barY = hubY * 0.5;
    // Solid connector bar like Bambu Studio
    ctx.fillStyle = 'rgba(180,180,180,0.25)';
    const barPad = 4;
    ctx.beginPath();
    ctx.roundRect(barLeft - barPad, barY - 2.5, barRight - barLeft + barPad * 2, 5, 2);
    ctx.fill();

    let activeColor = null;

    slots.forEach((slot, i) => {
      const rect = slot.getBoundingClientRect();
      const parentRect = tubeArea.getBoundingClientRect();
      const x = rect.left - parentRect.left + rect.width / 2;
      const globalSlot = unitIdx * 4 + i;
      const isActive = String(globalSlot) === String(activeTray) && String(activeTray) !== '254' && String(activeTray) !== '255';

      let tubeColor = 'rgba(255,255,255,0.15)';
      if (isActive) {
        const tray = amsUnits[unitIdx]?.tray?.[i];
        if (tray && tray.tray_color && tray.tray_color.length >= 6) {
          tubeColor = hexToRgba(tray.tray_color, 0.85);
          activeColor = hexToRgb(tray.tray_color);
        } else {
          tubeColor = 'rgba(0, 174, 66, 0.7)';
          activeColor = 'rgb(0,174,66)';
        }
      }

      // Vertical line down to splitter bar
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, barY);
      ctx.strokeStyle = tubeColor;
      ctx.lineWidth = isActive ? 2.5 : 1.5;
      ctx.stroke();

      // From splitter bar down to hub (only for active)
      if (isActive) {
        ctx.beginPath();
        ctx.moveTo(x, barY);
        ctx.lineTo(x, barY + 4);
        ctx.quadraticCurveTo(x, hubY - 2, hubX, hubY);
        ctx.strokeStyle = tubeColor;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
    });

    // Update hub icon color
    const hubIcon = document.getElementById('ams-hub-icon');
    if (hubIcon) {
      if (activeColor) {
        hubIcon.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14"><circle cx="12" cy="12" r="5" fill="${activeColor}"/><rect x="4" y="10" width="16" height="4" rx="2" fill="${activeColor}" opacity="0.3"/></svg>`;
      } else {
        hubIcon.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.4"><circle cx="12" cy="12" r="5"/><rect x="4" y="10" width="16" height="4" rx="2"/></svg>`;
      }
    }
  }

  window.updateAmsPanel = function(data) {
    const container = document.getElementById('ams-slots');
    const tabsEl = document.getElementById('ams-tabs');
    const humidityEl = document.getElementById('ams-humidity-info');
    const extSection = document.getElementById('ams-ext-section');
    if (!container || !data.ams) return;

    const amsData = data.ams;
    const amsUnits = amsData.ams;
    const activeTray = amsData.tray_now;
    if (!amsUnits || amsUnits.length === 0) return;

    const meta = window.printerState.getActivePrinterMeta();
    const amsType = typeof getAmsType === 'function' ? getAmsType(meta?.model) : 'full';

    // Get AMS model name from firmware module info
    const MODULE_NAMES = {
      'n3f': 'AMS 2 Pro', 'n3s': 'AMS 2 Pro', 'ams': 'AMS',
      'n1f': 'AMS Lite', 'ahb': 'Filament Buffer'
    };
    const infoModules = data._info?.module;
    let amsLabel = amsType === 'lite' ? 'AMS Lite' : 'AMS';
    if (Array.isArray(infoModules)) {
      const amsMod = infoModules.find(m => {
        const base = (m.name || '').split('/')[0];
        return MODULE_NAMES[base] && base !== 'ahb';
      });
      if (amsMod) amsLabel = MODULE_NAMES[amsMod.name.split('/')[0]];
    }

    // Clamp selected unit
    if (_selectedUnit >= amsUnits.length) _selectedUnit = 0;

    // --- Tabs: slot indicators (A1-A4) for each tray ---
    if (tabsEl) {
      const trays = amsUnits[_selectedUnit]?.tray || [];
      let tabsHtml = '';

      // If multiple AMS units, show unit selector tabs
      if (amsUnits.length > 1) {
        for (let i = 0; i < amsUnits.length; i++) {
          const active = i === _selectedUnit ? ' ams-tab-active' : '';
          tabsHtml += `<button class="ams-tab${active}" data-unit="${i}">A${i + 1}</button>`;
        }
        tabsEl.innerHTML = tabsHtml;
        tabsEl.querySelectorAll('.ams-tab').forEach(btn => {
          btn.onclick = () => {
            _selectedUnit = parseInt(btn.dataset.unit);
            window.updateAmsPanel(data);
          };
        });
      } else {
        // Single AMS: show slot indicators like Bambu Studio
        const reloadSvg = '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>';
        for (let i = 0; i < trays.length; i++) {
          const globalSlot = _selectedUnit * 4 + i;
          const isActive = String(globalSlot) === String(activeTray) && String(activeTray) !== '254' && String(activeTray) !== '255';
          tabsHtml += `<span class="ams-tab${isActive ? ' ams-tab-active' : ''}">A${i + 1} ${reloadSvg}</span>`;
        }
        tabsEl.innerHTML = tabsHtml;
      }
    }

    // --- Humidity info ---
    if (humidityEl) {
      const unit = amsUnits[_selectedUnit];
      const humidity = unit?.humidity_raw ?? unit?.humidity ?? '--';
      humidityEl.innerHTML = `
        <svg class="ams-humidity-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
        <span>${humidity}%</span>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.5;margin-left:2px"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
    }

    // --- Filament cards for selected unit ---
    container.innerHTML = '';
    const trays = amsUnits[_selectedUnit]?.tray;
    if (!trays) return;

    const printerId = meta?.id || window.printerState?.getActivePrinterId?.() || null;
    const gcodeState = data.gcode_state || 'IDLE';
    const isPrinting = gcodeState === 'RUNNING' || gcodeState === 'PAUSE';
    const est = window._printEstimates;

    for (let i = 0; i < trays.length; i++) {
      const tray = trays[i];
      const globalSlot = _selectedUnit * 4 + i;
      const isActive = String(globalSlot) === String(activeTray) && String(activeTray) !== '254' && String(activeTray) !== '255';
      const card = document.createElement('div');

      if (!tray || !tray.tray_type) {
        card.className = `ams-card ams-card-empty${isActive ? ' ams-card-active' : ''}`;
        card.innerHTML = `
          <div class="ams-card-inner ams-card-empty-inner">
            <span class="ams-card-type">${t('ams.empty')}</span>
          </div>`;
      } else {
        const color = tray.tray_color || '808080';
        const rgb = hexToRgb(color);
        const light = isLightColor(color);
        const textColor = light ? '#333' : '#fff';
        const linkedSpool = _getLinkedSpool(printerId, _selectedUnit, i);

        let remain;
        if (linkedSpool && linkedSpool.initial_weight_g > 0) {
          remain = Math.round((linkedSpool.remaining_weight_g / linkedSpool.initial_weight_g) * 100);
        } else {
          remain = tray.remain >= 0 ? Math.round(tray.remain) : null;
        }

        // Adjust for in-progress filament consumption (match active-filament.js)
        if (isActive && isPrinting && est && est.weight_g > 0 && remain !== null) {
          const pct = data.mc_percent || 0;
          const totalG = linkedSpool ? linkedSpool.initial_weight_g : (tray.tray_weight ? parseFloat(tray.tray_weight) : null);
          const remainG = linkedSpool ? linkedSpool.remaining_weight_g : (totalG ? totalG * (remain / 100) : null);
          if (remainG !== null && totalG > 0) {
            const consumedG = Math.round(est.weight_g * pct / 100);
            const remainingPrintG = est.weight_g - consumedG;
            remain = Math.max(0, Math.round(((remainG - remainingPrintG) / totalG) * 100));
          }
        }

        const hasRfid = !!(tray.tag_uid || tray.tray_uuid);

        const fillPct = remain !== null ? Math.max(0, Math.min(100, remain)) : 100;

        card.className = `ams-card${isActive ? ' ams-card-active' : ''}`;
        card.style.setProperty('--card-color', rgb);
        card.style.setProperty('--card-color-alpha', hexToRgba(color, 0.15));
        card.innerHTML = `
          <div class="ams-card-inner" style="color:${textColor};${light ? 'border:1px solid rgba(0,0,0,0.15);' : ''}">
            <div class="ams-card-fill" style="height:${fillPct}%;background:${rgb}"></div>
            ${isActive ? '<div class="ams-card-active-border"></div>' : ''}
            <span class="ams-card-type">${tray.tray_type}</span>
            ${remain !== null ? `<span class="ams-card-remain" style="color:${textColor}">${remain}%</span>` : ''}
            ${hasRfid ? `<div class="ams-card-rfid" style="color:${textColor}"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3"/></svg></div>` : ''}
          </div>`;
      }

      container.appendChild(card);
    }

    // --- External spool ---
    if (extSection) {
      const vtTray = amsData.vt_tray;
      const isExtActive = String(activeTray) === '254' || String(activeTray) === '255';

      // Printer wireframe SVG (Bambu Studio style)
      const printerSvg = `<svg class="ams-ext-printer" viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.2">
        <rect x="10" y="15" width="60" height="55" rx="4"/>
        <rect x="14" y="19" width="52" height="35" rx="2" stroke-dasharray="2 2"/>
        <circle cx="58" cy="62" r="5" fill="#00ae42" stroke="#00ae42"/>
        <rect x="10" y="8" width="60" height="7" rx="2"/>
        <line x1="25" y1="70" x2="55" y2="70"/>
      </svg>`;

      if (vtTray && vtTray.tray_type) {
        const color = vtTray.tray_color || '808080';
        const rgb = hexToRgb(color);
        const light = isLightColor(color);
        const textColor = light ? '#333' : '#fff';

        const linkedSpool = _getLinkedSpool(printerId, 255, 0);
        let remain;
        if (linkedSpool && linkedSpool.initial_weight_g > 0) {
          remain = Math.round((linkedSpool.remaining_weight_g / linkedSpool.initial_weight_g) * 100);
        } else {
          remain = vtTray.remain >= 0 ? Math.round(vtTray.remain) : null;
        }

        // Adjust for in-progress filament consumption (match active-filament.js)
        if (isExtActive && isPrinting && est && est.weight_g > 0 && remain !== null) {
          const pct = data.mc_percent || 0;
          const totalG = linkedSpool ? linkedSpool.initial_weight_g : (vtTray.tray_weight ? parseFloat(vtTray.tray_weight) : null);
          const remainG = linkedSpool ? linkedSpool.remaining_weight_g : (totalG ? totalG * (remain / 100) : null);
          if (remainG !== null && totalG > 0) {
            const consumedG = Math.round(est.weight_g * pct / 100);
            const remainingPrintG = est.weight_g - consumedG;
            remain = Math.max(0, Math.round(((remainG - remainingPrintG) / totalG) * 100));
          }
        }

        extSection.innerHTML = `
          <div class="ams-ext-label">Ext</div>
          <div class="ams-ext-row">
            <div class="ams-card ams-card-ext${isExtActive ? ' ams-card-active' : ''}">
              <div class="ams-card-inner" style="background:${rgb};color:${textColor};${light ? 'border:1px solid rgba(0,0,0,0.15);' : ''}">
                ${isExtActive ? '<div class="ams-card-active-border"></div>' : ''}
                <span class="ams-card-type">${vtTray.tray_type}</span>
                ${remain !== null ? `<div class="ams-card-remain" style="color:${textColor}">${remain}%</div>` : ''}
              </div>
            </div>
            ${printerSvg}
          </div>`;
      } else {
        extSection.innerHTML = `
          <div class="ams-ext-label">Ext</div>
          <div class="ams-ext-row">
            <div class="ams-card ams-card-ext ams-card-empty${isExtActive ? ' ams-card-active' : ''}">
              <div class="ams-card-inner ams-card-empty-inner">
                <span class="ams-card-type">?</span>
                <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5" style="position:absolute;bottom:4px;right:4px;opacity:0.4"><path d="M4 12L12 4M12 4H6M12 4v6"/></svg>
              </div>
            </div>
            ${printerSvg}
          </div>`;
      }
    }

    // Draw tubes
    requestAnimationFrame(() => drawTubes(container, activeTray, amsUnits, _selectedUnit));
  };

  // Unload / Load button handlers
  document.addEventListener('DOMContentLoaded', () => {
    const unloadBtn = document.getElementById('ams-unload-btn');
    const loadBtn = document.getElementById('ams-load-btn');

    if (unloadBtn) {
      unloadBtn.onclick = async () => {
        const pid = window.printerState?.getActivePrinterId?.();
        if (!pid) return;
        try {
          await fetch(`/api/printers/${pid}/change-filament`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ step: 'start' })
          });
          await fetch(`/api/printers/${pid}/change-filament`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ step: 'unload' })
          });
        } catch (e) { console.error('Unload failed:', e); }
      };
    }

    if (loadBtn) {
      loadBtn.onclick = async () => {
        const pid = window.printerState?.getActivePrinterId?.();
        if (!pid) return;
        try {
          await fetch(`/api/printers/${pid}/change-filament`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ step: 'load' })
          });
        } catch (e) { console.error('Load failed:', e); }
      };
    }
  });

  // Redraw tubes on resize
  window.addEventListener('resize', () => {
    const canvas = document.getElementById('ams-tube-canvas');
    if (canvas) canvas.width = canvas.parentElement?.offsetWidth || 0;
  });
})();
