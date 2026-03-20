// AMS Panel - Bambu Studio style card layout
(function() {
  let _inventorySpools = null;
  let _inventoryLoaded = false;
  let _selectedUnit = 0;
  const _lowAlerted = {};  // track which trays have shown low filament toasts

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
    const trays = amsUnits[_selectedUnit]?.tray || [];
    const slotCount = Math.max(4, trays.length);  // Always show at least 4 slots

    const printerId = meta?.id || window.printerState?.getActivePrinterId?.() || null;
    const gcodeState = data.gcode_state || 'IDLE';
    const isPrinting = gcodeState === 'RUNNING' || gcodeState === 'PAUSE';
    const est = window._printEstimates;
    const _warnings = [];  // collect low filament warnings for banner

    for (let i = 0; i < slotCount; i++) {
      const tray = trays[i] || null;
      const globalSlot = _selectedUnit * 4 + i;
      const isActive = String(globalSlot) === String(activeTray) && String(activeTray) !== '254' && String(activeTray) !== '255';
      const card = document.createElement('div');

      if (!tray || !tray.tray_type) {
        card.className = `ams-card ams-card-empty${isActive ? ' ams-card-active' : ''}`;
        card.innerHTML = `
          <div class="ams-spool ams-spool-empty">
            <svg class="ams-spool-svg" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="var(--border-color)" stroke-width="2" stroke-dasharray="4 3"/>
              <circle cx="50" cy="50" r="18" fill="none" stroke="var(--border-color)" stroke-width="1.5" stroke-dasharray="3 3"/>
            </svg>
            <div class="ams-spool-center">
              <span class="ams-spool-type">${t('ams.empty')}</span>
            </div>
          </div>
          <div class="ams-spool-label">A${i + 1}</div>`;
      } else {
        const color = tray.tray_color || '808080';
        const rgb = hexToRgb(color);
        const light = isLightColor(color);
        const textColor = light ? '#333' : '#fff';
        const linkedSpool = _getLinkedSpool(printerId, _selectedUnit, i);

        let remain;
        // Prioritet: 1) Printer RFID/sensor, 2) linked spool beregning
        if (tray.remain >= 0 && tray.remain <= 100) {
          remain = Math.round(tray.remain);
        } else if (linkedSpool && linkedSpool.initial_weight_g > 0 && linkedSpool.remaining_weight_g >= 0) {
          remain = Math.max(0, Math.round((linkedSpool.remaining_weight_g / linkedSpool.initial_weight_g) * 100));
        } else {
          remain = null;
        }

        // Real-time filament calculation
        const _totalG = linkedSpool ? linkedSpool.initial_weight_g : (tray.tray_weight ? parseFloat(tray.tray_weight) : null);
        const _remainG = linkedSpool ? linkedSpool.remaining_weight_g : (_totalG ? _totalG * (remain / 100) : null);
        let displayGrams = null;
        if (remain !== null && typeof window.realtimeFilament === 'function') {
          const rt = window.realtimeFilament({ remainG: _remainG, totalG: _totalG, isActive, data });
          remain = rt.current;
          displayGrams = rt.currentG;
        } else if (remain !== null) {
          const tw = _totalG || (tray.tray_weight ? parseFloat(tray.tray_weight) : null);
          if (tw > 0) displayGrams = Math.round(tw * remain / 100);
        } else if (linkedSpool && linkedSpool.remaining_weight_g > 0) {
          displayGrams = linkedSpool.remaining_weight_g;
        }

        const hasRfid = !!(tray.tag_uid || tray.tray_uuid);

        // Low filament warning levels
        const isCritical = remain !== null && remain <= 5;
        const isLow = remain !== null && remain <= 10;
        if (isLow) _warnings.push({ slot: `A${i + 1}`, pct: remain });
        let warnClass = '';
        if (isCritical) warnClass = ' ams-card-critical';
        else if (isLow) warnClass = ' ams-card-low';

        // Toast notification for low filament (once per tray per threshold)
        const alertKey = `${printerId}_${_selectedUnit}_${i}`;
        if (isCritical && !_lowAlerted[alertKey + '_crit']) {
          _lowAlerted[alertKey + '_crit'] = true;
          if (typeof showToast === 'function') showToast(t('ams.critical_filament', { slot: `A${i + 1}`, pct: remain }) || `A${i + 1}: ${remain}% filament — bytt snart!`, 'error', 8000);
        } else if (isLow && !isCritical && !_lowAlerted[alertKey + '_low']) {
          _lowAlerted[alertKey + '_low'] = true;
          if (typeof showToast === 'function') showToast(t('ams.low_filament', { slot: `A${i + 1}`, pct: remain }) || `A${i + 1}: ${remain}% filament igjen`, 'warning', 6000);
        }
        // Reset alerts when filament is replenished
        if (remain !== null && remain > 10) {
          delete _lowAlerted[alertKey + '_low'];
          delete _lowAlerted[alertKey + '_crit'];
        }

        // SVG spool ring parameters
        const radius = 38;
        const strokeW = 14;
        const circumference = 2 * Math.PI * radius;
        const fillPct = remain !== null ? Math.max(0, Math.min(100, remain)) : 100;
        const dashLen = (fillPct / 100) * circumference;
        const dashGap = circumference - dashLen;

        const warnIcon = isCritical
          ? `<div class="ams-card-warn ams-card-warn-critical"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>`
          : isLow
            ? `<div class="ams-card-warn ams-card-warn-low"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>`
            : '';

        card.className = `ams-card${isActive ? ' ams-card-active' : ''}${warnClass}`;
        card.style.setProperty('--card-color', rgb);
        card.style.setProperty('--card-color-alpha', hexToRgba(color, 0.15));
        card.innerHTML = `
          <div class="ams-spool">
            <svg class="ams-spool-svg" viewBox="0 0 100 100">
              <!-- Outer spool rim -->
              <circle cx="50" cy="50" r="47" fill="none" stroke="${hexToRgba(color, 0.15)}" stroke-width="1.5"/>
              <!-- Background track -->
              <circle cx="50" cy="50" r="${radius}" fill="none" stroke="${hexToRgba(color, 0.15)}" stroke-width="${strokeW}" stroke-linecap="round"/>
              <!-- Filament ring -->
              <circle cx="50" cy="50" r="${radius}" fill="none" stroke="${rgb}" stroke-width="${strokeW}" stroke-linecap="round"
                stroke-dasharray="${dashLen} ${dashGap}" transform="rotate(-90 50 50)"
                class="ams-spool-ring" style="filter:drop-shadow(0 0 4px ${hexToRgba(color, 0.5)})"/>
              <!-- Inner spool hub -->
              <circle cx="50" cy="50" r="18" fill="${hexToRgba(color, 0.08)}" stroke="${hexToRgba(color, 0.25)}" stroke-width="1"/>
              <!-- Hub spokes -->
              <line x1="50" y1="32" x2="50" y2="24" stroke="${hexToRgba(color, 0.2)}" stroke-width="1"/>
              <line x1="50" y1="68" x2="50" y2="76" stroke="${hexToRgba(color, 0.2)}" stroke-width="1"/>
              <line x1="32" y1="50" x2="24" y2="50" stroke="${hexToRgba(color, 0.2)}" stroke-width="1"/>
              <line x1="68" y1="50" x2="76" y2="50" stroke="${hexToRgba(color, 0.2)}" stroke-width="1"/>
              <!-- Center dot -->
              <circle cx="50" cy="50" r="4" fill="${hexToRgba(color, 0.3)}"/>
            </svg>
            ${isActive ? '<div class="ams-spool-active-ring"></div>' : ''}
            ${warnIcon}
            <div class="ams-spool-center">
              <span class="ams-spool-type">${tray.tray_type}</span>
              ${remain !== null ? `<span class="ams-spool-pct" style="color:${rgb}">${remain}%</span>` : ''}
              ${displayGrams !== null ? `<span class="ams-spool-grams">${Math.round(displayGrams)}g</span>` : ''}
            </div>
            ${hasRfid ? `<div class="ams-spool-rfid"><svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="${rgb}" stroke-width="2"><path d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10"/><path d="M5 12c0-3.87 3.13-7 7-7s7 3.13 7 7"/><path d="M8 12a4 4 0 0 1 8 0"/><circle cx="12" cy="12" r="1.5" fill="${rgb}"/></svg></div>` : ''}
          </div>
          <div class="ams-spool-label">A${i + 1}</div>`;

        // Klikk på spool for å kalibrere
        card.style.cursor = 'pointer';
        card.title = t('ams.click_to_calibrate') || 'Klikk for å kalibrere';
        const trayIdx = i;
        const unitIdx = _selectedUnit;
        card.addEventListener('click', () => _showCalibrationDialog(printerId, unitIdx, trayIdx, tray, linkedSpool, remain, displayGrams));
      }

      container.appendChild(card);
    }

    // --- Low filament warning banner ---
    const bannerEl = document.getElementById('ams-low-banner');
    if (bannerEl) {
      if (_warnings.length > 0) {
        const hasCritical = _warnings.some(w => w.pct <= 5);
        const warnSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
        const lines = _warnings.map(w => {
          const label = w.pct <= 5 ? t('ams.critical_filament', w) : t('ams.low_filament', w);
          return `<span>${label}</span>`;
        }).join('');
        bannerEl.className = 'ams-low-banner' + (hasCritical ? ' ams-low-banner-critical' : ' ams-low-banner-warn');
        bannerEl.innerHTML = `<div class="ams-low-banner-icon">${warnSvg}</div><div class="ams-low-banner-text">${lines}</div>`;
        bannerEl.style.display = '';
      } else {
        bannerEl.style.display = 'none';
      }
    }

    // --- External spool ---
    if (extSection) {
      const vtTray = amsData.vt_tray;
      const isExtActive = String(activeTray) === '254' || String(activeTray) === '255';

      if (vtTray && vtTray.tray_type) {
        const color = vtTray.tray_color || '808080';
        const rgb = hexToRgb(color);

        const linkedSpool = _getLinkedSpool(printerId, 255, 0);
        let remain;
        if (linkedSpool && linkedSpool.initial_weight_g > 0 && linkedSpool.remaining_weight_g > 0) {
          remain = Math.round((linkedSpool.remaining_weight_g / linkedSpool.initial_weight_g) * 100);
        } else if (vtTray.remain >= 0) {
          remain = Math.round(vtTray.remain);
        } else if (linkedSpool && linkedSpool.initial_weight_g > 0) {
          remain = Math.round((linkedSpool.remaining_weight_g / linkedSpool.initial_weight_g) * 100);
        } else {
          remain = null;
        }

        // Real-time filament calculation
        const _vtTotalG = linkedSpool ? linkedSpool.initial_weight_g : (vtTray.tray_weight ? parseFloat(vtTray.tray_weight) : null);
        const _vtRemainG = linkedSpool ? linkedSpool.remaining_weight_g : (_vtTotalG ? _vtTotalG * (remain / 100) : null);
        let displayGrams = null;
        if (remain !== null && typeof window.realtimeFilament === 'function') {
          const rt = window.realtimeFilament({ remainG: _vtRemainG, totalG: _vtTotalG, isActive: isExtActive, data });
          remain = rt.current;
          displayGrams = rt.currentG;
        } else if (linkedSpool && linkedSpool.remaining_weight_g > 0) {
          displayGrams = linkedSpool.remaining_weight_g;
        } else if (remain !== null) {
          const tw = vtTray.tray_weight ? parseFloat(vtTray.tray_weight) : null;
          if (tw > 0) displayGrams = Math.round(tw * remain / 100);
        }

        const radius = 38;
        const strokeW = 14;
        const circumference = 2 * Math.PI * radius;
        const fillPct = remain !== null ? Math.max(0, Math.min(100, remain)) : 100;
        const dashLen = (fillPct / 100) * circumference;
        const dashGap = circumference - dashLen;

        extSection.innerHTML = `
          <div class="ams-card ams-card-ext${isExtActive ? ' ams-card-active' : ''}">
            <div class="ams-spool">
              <svg class="ams-spool-svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="47" fill="none" stroke="${hexToRgba(color, 0.15)}" stroke-width="1.5"/>
                <circle cx="50" cy="50" r="${radius}" fill="none" stroke="${hexToRgba(color, 0.15)}" stroke-width="${strokeW}" stroke-linecap="round"/>
                <circle cx="50" cy="50" r="${radius}" fill="none" stroke="${rgb}" stroke-width="${strokeW}" stroke-linecap="round"
                  stroke-dasharray="${dashLen} ${dashGap}" transform="rotate(-90 50 50)"
                  class="ams-spool-ring" style="filter:drop-shadow(0 0 4px ${hexToRgba(color, 0.5)})"/>
                <circle cx="50" cy="50" r="18" fill="${hexToRgba(color, 0.08)}" stroke="${hexToRgba(color, 0.25)}" stroke-width="1"/>
                <line x1="50" y1="32" x2="50" y2="24" stroke="${hexToRgba(color, 0.2)}" stroke-width="1"/>
                <line x1="50" y1="68" x2="50" y2="76" stroke="${hexToRgba(color, 0.2)}" stroke-width="1"/>
                <line x1="32" y1="50" x2="24" y2="50" stroke="${hexToRgba(color, 0.2)}" stroke-width="1"/>
                <line x1="68" y1="50" x2="76" y2="50" stroke="${hexToRgba(color, 0.2)}" stroke-width="1"/>
                <circle cx="50" cy="50" r="4" fill="${hexToRgba(color, 0.3)}"/>
              </svg>
              ${isExtActive ? '<div class="ams-spool-active-ring"></div>' : ''}
              <div class="ams-spool-center">
                <span class="ams-spool-type">${vtTray.tray_type}</span>
                ${remain !== null ? `<span class="ams-spool-pct" style="color:${rgb}">${remain}%</span>` : ''}
                ${displayGrams !== null ? `<span class="ams-spool-grams">${Math.round(displayGrams)}g</span>` : ''}
              </div>
            </div>
            <div class="ams-spool-label">Ext</div>
          </div>`;
      } else {
        extSection.innerHTML = `
          <div class="ams-card ams-card-ext ams-card-empty${isExtActive ? ' ams-card-active' : ''}">
            <div class="ams-spool ams-spool-empty">
              <svg class="ams-spool-svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="var(--border-color)" stroke-width="2" stroke-dasharray="4 3"/>
                <circle cx="50" cy="50" r="18" fill="none" stroke="var(--border-color)" stroke-width="1.5" stroke-dasharray="3 3"/>
              </svg>
              <div class="ams-spool-center">
                <span class="ams-spool-type">${t('ams.empty')}</span>
              </div>
            </div>
            <div class="ams-spool-label">Ext</div>
          </div>`;
      }
    }

    // Draw tubes
    requestAnimationFrame(() => drawTubes(container, activeTray, amsUnits, _selectedUnit));
  };

  // Kalibreringsdialo for AMS-spole
  function _showCalibrationDialog(printerId, amsUnit, amsTray, tray, linkedSpool, currentPct, currentGrams) {
    // Fjern eksisterende dialog
    document.querySelectorAll('.ams-calibrate-overlay').forEach(el => el.remove());

    const initG = linkedSpool?.initial_weight_g || (tray.tray_weight ? parseFloat(tray.tray_weight) : 1000);
    const remG = currentGrams || (currentPct !== null ? Math.round(initG * currentPct / 100) : 0);
    const slotName = `A${amsTray + 1}`;
    const color = tray.tray_color || '808080';
    const rgb = hexToRgb(color);

    const overlay = document.createElement('div');
    overlay.className = 'ams-calibrate-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center';
    overlay.innerHTML = `
      <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:24px;width:340px;max-width:90vw">
        <h3 style="margin:0 0 16px;color:${rgb}">Kalibrer ${slotName} — ${tray.tray_type || 'Filament'}</h3>
        <div style="display:flex;gap:12px;margin-bottom:16px">
          <div style="flex:1">
            <label style="font-size:0.8rem;color:var(--text-muted)">Spool størrelse (g)</label>
            <input type="number" id="cal-initial" value="${initG}" style="width:100%;padding:8px;background:var(--bg-dark);border:1px solid var(--border-color);border-radius:6px;color:var(--text-primary)">
          </div>
          <div style="flex:1">
            <label style="font-size:0.8rem;color:var(--text-muted)">Igjen (g)</label>
            <input type="number" id="cal-remaining" value="${remG}" style="width:100%;padding:8px;background:var(--bg-dark);border:1px solid var(--border-color);border-radius:6px;color:var(--text-primary)">
          </div>
        </div>
        <div style="margin-bottom:16px">
          <label style="font-size:0.8rem;color:var(--text-muted)">Eller sett prosent</label>
          <input type="range" id="cal-slider" min="0" max="100" value="${currentPct || 0}" style="width:100%"
            oninput="document.getElementById('cal-remaining').value=Math.round(document.getElementById('cal-initial').value*this.value/100);document.getElementById('cal-pct-label').textContent=this.value+'%'">
          <div style="text-align:center;font-size:1.2rem;font-weight:bold;color:${rgb}" id="cal-pct-label">${currentPct || 0}%</div>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button onclick="this.closest('.ams-calibrate-overlay').remove()" style="padding:8px 16px;border-radius:6px;border:1px solid var(--border-color);background:transparent;color:var(--text-primary);cursor:pointer">Avbryt</button>
          <button onclick="window._saveCalibration('${printerId}',${amsUnit},${amsTray})" style="padding:8px 16px;border-radius:6px;border:none;background:${rgb};color:${isLightColor(color)?'#333':'#fff'};cursor:pointer;font-weight:bold">Lagre</button>
        </div>
      </div>`;

    // Oppdater slider når gram endres
    const remInput = overlay.querySelector('#cal-remaining');
    const initInput = overlay.querySelector('#cal-initial');
    const slider = overlay.querySelector('#cal-slider');
    const pctLabel = overlay.querySelector('#cal-pct-label');
    remInput.addEventListener('input', () => {
      const pct = Math.round((parseFloat(remInput.value) / parseFloat(initInput.value)) * 100);
      slider.value = pct;
      pctLabel.textContent = pct + '%';
    });

    // Klikk utenfor lukker
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    document.body.appendChild(overlay);
  }

  window._saveCalibration = async function(printerId, amsUnit, amsTray) {
    const initG = parseFloat(document.getElementById('cal-initial').value) || 1000;
    const remG = parseFloat(document.getElementById('cal-remaining').value) || 0;
    const usedG = Math.max(0, initG - remG);

    const spool = _getLinkedSpool(printerId, amsUnit, amsTray);
    if (spool) {
      await fetch(`/api/inventory/spools/${spool.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initial_weight_g: initG, remaining_weight_g: remG, used_weight_g: usedG })
      });
      if (typeof showToast === 'function') showToast(`A${amsTray+1} kalibrert: ${Math.round(remG)}g igjen (${Math.round(remG/initG*100)}%)`, 'success');
    } else {
      if (typeof showToast === 'function') showToast('Ingen spoole koblet til denne AMS-plassen', 'warning');
    }

    document.querySelectorAll('.ams-calibrate-overlay').forEach(el => el.remove());
    // Refresh AMS-visning
    if (typeof window.updateAmsPanel === 'function') window.updateAmsPanel();
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
