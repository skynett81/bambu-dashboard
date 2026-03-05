// AMS Panel - Enhanced with humidity, temp, brand, RFID, drying, AMS-Lite, inventory integration
(function() {
  let _inventorySpools = null;
  let _inventoryLoaded = false;

  async function _loadInventorySpools() {
    try {
      const res = await fetch('/api/inventory/spools');
      _inventorySpools = await res.json();
      _inventoryLoaded = true;
    } catch { _inventorySpools = []; _inventoryLoaded = true; }
  }

  // Load inventory on first call, refresh periodically
  function _getLinkedSpool(printerId, amsUnit, amsTray) {
    if (!_inventorySpools) return null;
    return _inventorySpools.find(s =>
      s.printer_id === printerId && s.ams_unit === amsUnit && s.ams_tray === amsTray && !s.archived
    ) || null;
  }

  // Refresh inventory cache every 30s
  setInterval(() => { if (_inventoryLoaded) _loadInventorySpools(); }, 30000);
  _loadInventorySpools();

  function hexToRgb(hex) {
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

  window.updateAmsPanel = function(data) {
    const container = document.getElementById('ams-slots');
    const headerEl = document.getElementById('ams-header');
    if (!container || !data.ams) return;

    const amsData = data.ams;
    const amsUnits = amsData.ams;
    const activeTray = amsData.tray_now;

    if (!amsUnits || amsUnits.length === 0) return;

    // Detect AMS type from printer model
    const meta = window.printerState.getActivePrinterMeta();
    const amsType = typeof getAmsType === 'function' ? getAmsType(meta?.model) : 'full';
    const amsLabel = amsType === 'lite' ? 'AMS-Lite' : 'AMS';

    // Update AMS header with humidity and temp from all units
    if (headerEl) {
      const liteBadge = amsType === 'lite' ? `<span class="ams-lite-badge">Lite</span>` : '';
      const infoParts = amsUnits.map((unit, idx) => {
        const humidity = unit.humidity ? `${unit.humidity}%` : '--';
        const temp = unit.temp ? `${unit.temp}°C` : '--';
        const prefix = amsUnits.length > 1 ? `${amsLabel}${idx + 1}: ` : '';
        return `${prefix}${t('ams.humidity')}: ${humidity} · ${t('ams.temp')}: ${temp}`;
      });
      headerEl.innerHTML = `${amsLabel}${liteBadge} <span class="ams-header-info">${infoParts.join(' | ')}</span>`;
    }

    container.innerHTML = '';

    // Render all trays from all AMS units
    let globalSlot = 0;
    for (let unitIdx = 0; unitIdx < amsUnits.length; unitIdx++) {
      const trays = amsUnits[unitIdx]?.tray;
      if (!trays) continue;

      for (let i = 0; i < trays.length; i++) {
        const tray = trays[i];
        const slot = document.createElement('div');
        const slotLabel = amsUnits.length > 1 ? t('ams.slot_multi', { unit: unitIdx + 1, num: i + 1 }) : t('ams.slot', { num: i + 1 });

        if (!tray || !tray.tray_type) {
          slot.className = 'ams-slot ams-empty';
          slot.innerHTML = `
            <div class="ams-slot-inner ams-slot-empty-inner">
              <div class="ams-color-ring ams-empty-ring"></div>
              <span class="ams-type">${t('ams.empty')}</span>
              <span class="ams-slot-num">${slotLabel}</span>
            </div>`;
        } else {
          const isActive = String(globalSlot) === String(activeTray);
          const color = hexToRgb(tray.tray_color);
          const light = isLightColor(tray.tray_color);
          const brand = tray.tray_sub_brands || '';
          const tempRange = (tray.nozzle_temp_min && tray.nozzle_temp_max) ? `${tray.nozzle_temp_min}-${tray.nozzle_temp_max}°C` : '';

          // Check inventory for linked spool with accurate weight data
          const printerId = meta?.id || window.printerState?.getActivePrinterId?.() || null;
          const linkedSpool = _getLinkedSpool(printerId, unitIdx, i);

          let remain, remainParts, remainG = null, totalG = null;
          if (linkedSpool && linkedSpool.initial_weight_g > 0) {
            // Use inventory data for accurate weight tracking
            remainG = linkedSpool.remaining_weight_g;
            totalG = linkedSpool.initial_weight_g;
            const pct = Math.round((remainG / totalG) * 100);
            remain = pct;
            remainParts = [`${pct}%`, `${Math.round(remainG)}g / ${totalG}g`];
          } else {
            // Fallback to MQTT/AMS data
            remain = tray.remain >= 0 ? Math.round(tray.remain) : '?';
            remainParts = [`${remain}%`];
            if (tray.tray_weight) {
              totalG = parseFloat(tray.tray_weight);
              remainG = totalG * (remain / 100);
              remainParts.push(`${tray.tray_weight}g`);
            }
          }

          // Adjust remaining to account for estimated print consumption
          const est = window._printEstimates;
          const gcodeState = data.gcode_state || 'IDLE';
          const isPrinting = gcodeState === 'RUNNING' || gcodeState === 'PAUSE';
          let usageInfo = '';
          let estRemain = remain;
          if (isActive && isPrinting && est && est.weight_g > 0 && remainG !== null && totalG > 0) {
            const pctDone = data.mc_percent || 0;
            const remainingPrintG = est.weight_g * (1 - pctDone / 100);
            const estRemainG = Math.max(0, remainG - remainingPrintG);
            estRemain = Math.round((estRemainG / totalG) * 100);
            const consumedG = Math.round(est.weight_g * pctDone / 100);
            usageInfo = `<div class="ams-row ams-row-usage"><span class="ams-usage-text">${t('filament.print_using')}: ${consumedG}g / ${Math.round(est.weight_g)}g &middot; ${t('filament.est_remaining')}: ~${Math.round(estRemainG)}g</span></div>`;
          } else if (isActive && isPrinting && est && est.weight_g > 0) {
            const pctDone = data.mc_percent || 0;
            const consumedG = Math.round(est.weight_g * pctDone / 100);
            usageInfo = `<div class="ams-row ams-row-usage"><span class="ams-usage-text">${t('filament.print_using')}: ${consumedG}g / ${Math.round(est.weight_g)}g</span></div>`;
          }

          // RFID detection
          const hasRfid = !!(tray.tag_uid || tray.tray_uuid);
          const rfidBadge = hasRfid ? `<span class="ams-rfid-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4"/><path d="M5 12a7 7 0 0 1 7-7 7 7 0 0 1 5.7 3"/><circle cx="12" cy="12" r="2"/></svg>RFID</span>` : '';

          // Drying info
          const dryInfo = (tray.drying_temp && tray.drying_time) ? `<span class="ams-dry-info"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>${tray.drying_temp}°C / ${tray.drying_time}${t('time.h')}</span>` : '';

          // Details line: temp range + K value
          const detailParts = [];
          if (tempRange) detailParts.push(tempRange);
          if (tray.k) detailParts.push(`K: ${tray.k}`);

          slot.className = `ams-slot ${isActive ? 'ams-active' : ''}`;
          slot.innerHTML = `
            <div class="ams-slot-inner">
              <div class="ams-row ams-row-top">
                <div class="ams-color-ring" style="background:${color};${light ? `border:2px solid ${theme.getCSSVar('--text-muted')};` : ''}">
                  ${isActive ? '<div class="ams-active-dot"></div>' : ''}
                </div>
                <div class="ams-info-main">
                  <span class="ams-type">${tray.tray_type}</span>
                  ${brand ? `<span class="ams-sep">\u00b7</span><span class="ams-brand">${brand}</span>` : ''}
                </div>
                ${rfidBadge}
              </div>
              <div class="ams-row ams-row-bar">
                <div class="ams-remain-bar"><div class="ams-remain-fill" style="width:${isActive && isPrinting && estRemain !== remain ? estRemain : remain}%;background:${color}"></div>${isActive && isPrinting && estRemain !== remain ? `<div class="ams-remain-usage" style="width:${remain - estRemain}%;left:${estRemain}%;background:${color};opacity:0.3"></div>` : ''}</div>
                <span class="ams-remain-text">${isActive && isPrinting && estRemain !== remain ? `~${estRemain}%` : remainParts.join(' \u00b7 ')}</span>
              </div>
              ${detailParts.length ? `<div class="ams-row ams-row-details">${detailParts.join(' \u00b7 ')}</div>` : ''}
              ${usageInfo}
              <div class="ams-row ams-row-bottom">
                ${dryInfo || '<span></span>'}
                <span class="ams-slot-num">${slotLabel}</span>
              </div>
            </div>`;
        }

        container.appendChild(slot);
        globalSlot++;
      }
    }
  };
})();
