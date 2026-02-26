// AMS Panel - Enhanced with humidity, temp, brand, RFID, drying, AMS-Lite
(function() {
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
            <div class="ams-slot-inner">
              <div class="ams-color-ring ams-empty-ring"></div>
              <div class="ams-type">${t('ams.empty')}</div>
              <div class="ams-slot-num">${slotLabel}</div>
            </div>`;
        } else {
          const isActive = String(globalSlot) === String(activeTray);
          const color = hexToRgb(tray.tray_color);
          const light = isLightColor(tray.tray_color);
          const remain = tray.remain >= 0 ? Math.round(tray.remain) : '?';
          const brand = tray.tray_sub_brands || '';
          const tempRange = (tray.nozzle_temp_min && tray.nozzle_temp_max) ? `${tray.nozzle_temp_min}-${tray.nozzle_temp_max}°C` : '';

          // RFID detection
          const hasRfid = !!(tray.tag_uid || tray.tray_uuid);
          const rfidBadge = hasRfid ? `<span class="ams-rfid-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4"/><path d="M5 12a7 7 0 0 1 7-7 7 7 0 0 1 5.7 3"/><circle cx="12" cy="12" r="2"/></svg>RFID</span>` : '';

          // Drying info
          const dryInfo = (tray.drying_temp && tray.drying_time) ? `<div class="ams-dry-info"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>${tray.drying_temp}°C / ${tray.drying_time}${t('time.h')}</div>` : '';

          // Spool weight
          const weightInfo = tray.tray_weight ? `<div class="ams-temp-range">${tray.tray_weight}g</div>` : '';

          // K value (pressure advance)
          const kInfo = tray.k ? `<div class="ams-temp-range">K: ${tray.k}</div>` : '';

          slot.className = `ams-slot ${isActive ? 'ams-active' : ''}`;
          slot.innerHTML = `
            <div class="ams-slot-inner">
              <div class="ams-color-ring" style="background:${color};${light ? 'border:2px solid #30363d;' : ''}">
                ${isActive ? '<div class="ams-active-dot"></div>' : ''}
              </div>
              <div class="ams-type">${tray.tray_type}</div>
              <div class="ams-brand">${brand}</div>
              ${rfidBadge}
              <div class="ams-remain-bar">
                <div class="ams-remain-fill" style="width:${remain}%;background:${color}"></div>
              </div>
              <div class="ams-remain-text">${remain}%</div>
              ${tempRange ? `<div class="ams-temp-range">${tempRange}</div>` : ''}
              ${weightInfo}
              ${kInfo}
              ${dryInfo}
              <div class="ams-slot-num">${slotLabel}</div>
            </div>`;
        }

        container.appendChild(slot);
        globalSlot++;
      }
    }
  };
})();
