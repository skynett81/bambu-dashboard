// Active Filament Display - shows in the print status panel
(function() {
  window.updateActiveFilament = function(data) {
    const container = document.getElementById('active-filament');
    if (!container) return;

    const amsData = data.ams;
    if (!amsData) {
      container.innerHTML = `
        <div class="filament-inactive">
          <span class="text-muted">${t('filament.no_data')}</span>
        </div>`;
      return;
    }

    const activeTrayIdx = amsData.tray_now;
    const isExternal = String(activeTrayIdx) === '254' || String(activeTrayIdx) === '255';

    // Find active tray — search all AMS units, or use vt_tray for external
    let tray = null;
    let amsUnitIdx = 0;
    let amsTrayIdx = 0;

    if (isExternal && amsData.vt_tray?.tray_type) {
      tray = amsData.vt_tray;
      amsUnitIdx = 255;
      amsTrayIdx = 0;
    } else if (amsData.ams) {
      const idx = parseInt(activeTrayIdx);
      // Global index: 0-3 = unit 0, 4-7 = unit 1, 8-11 = unit 2, 12-15 = unit 3
      amsUnitIdx = Math.floor(idx / 4);
      amsTrayIdx = idx % 4;
      const unit = amsData.ams[amsUnitIdx];
      if (unit?.tray) {
        tray = unit.tray.find(t => String(t.id) === String(amsTrayIdx));
      }
    }

    if (!tray || !tray.tray_type) {
      container.innerHTML = `
        <div class="filament-inactive">
          <span class="text-muted">${t('filament.none_active')}</span>
        </div>`;
      return;
    }

    const color = hexToDisplayColor(tray.tray_color);
    const brand = tray.tray_sub_brands || '';
    const name = tray.tray_id_name || tray.tray_type;
    const tempMin = tray.nozzle_temp_min || '?';
    const tempMax = tray.nozzle_temp_max || '?';
    const isLight = isLightHex(tray.tray_color);
    const slotLabel = isExternal ? t('ams.external') : t('filament.slot', { num: parseInt(activeTrayIdx) + 1 });

    // Use inventory data if available (same source as AMS panel)
    const printerId = window.printerState?.getActivePrinterId?.() || null;
    const linkedSpool = window.getLinkedSpool?.(printerId, amsUnitIdx, isExternal ? 0 : amsTrayIdx);

    // Bruk den laveste av AMS-sensor og spoldatabasen
    // AMS-sensor kan vise for høyt etter feilede prints der filament ble kastet
    const amsRemain = (tray.remain >= 0 && tray.remain <= 100) ? Math.round(tray.remain) : null;
    const spoolRemain = (linkedSpool && linkedSpool.initial_weight_g > 0 && linkedSpool.remaining_weight_g >= 0)
      ? Math.max(0, Math.round((linkedSpool.remaining_weight_g / linkedSpool.initial_weight_g) * 100)) : null;

    let remain, totalG, remainG;
    if (amsRemain !== null && spoolRemain !== null) {
      remain = Math.min(amsRemain, spoolRemain);
    } else if (amsRemain !== null) {
      remain = amsRemain;
    } else if (spoolRemain !== null) {
      remain = spoolRemain;
    } else {
      remain = 0;
    }

    if (linkedSpool && linkedSpool.initial_weight_g > 0) {
      totalG = linkedSpool.initial_weight_g;
      remainG = totalG * remain / 100;
    } else {
      totalG = tray.tray_weight ? parseFloat(tray.tray_weight) : null;
      remainG = totalG ? totalG * (remain / 100) : null;
    }

    // Real-time filament consumption
    const gcodeState = data.gcode_state || 'IDLE';
    const isPrinting = gcodeState === 'RUNNING' || gcodeState === 'PAUSE';
    const pct = data.mc_percent || 0;

    let usageHtml = '';
    let displayRemain = remain;
    let displayRemainG = remainG;
    let afterPrint = null;
    let afterPrintG = null;
    if (typeof window.realtimeFilament === 'function') {
      const rt = window.realtimeFilament({ remainG, totalG, isActive: true, data });
      displayRemain = rt.current;
      displayRemainG = rt.currentG;
      afterPrint = rt.afterPrint;
      afterPrintG = rt.afterPrintG;
      if (rt.isPrinting) {
        usageHtml = `
          <div class="filament-usage-estimate">
            <span>${t('filament.print_using')}: ${rt.usedG}g / ${rt.totalPrintG}g</span>
            <div class="filament-usage-bar"><div class="filament-usage-bar-fill" style="width:${pct}%;background:${color}"></div></div>
          </div>
          <div class="filament-after-print-row">
            <span class="filament-after-label">${t('filament.after_print') || 'Etter print'}</span>
            <span class="filament-after-value">${afterPrint}% · ${afterPrintG}g</span>
          </div>`;
      }
    }

    // Color for the bar - low remaining = warn
    const barColor = displayRemain < 15 ? 'var(--accent-red)' : color;
    const remainClass = displayRemain < 15 ? 'filament-remain-low' : '';
    const showEstimate = isPrinting && displayRemain !== remain;

    container.innerHTML = `
      <div class="filament-status">
        <div class="filament-status-header">
          ${typeof spoolIcon === 'function' ? spoolIcon(color, 32, displayRemain) : `<div class="filament-color-dot" style="background:${color}"></div>`}
          <div>
            <div class="filament-status-type">${tray.tray_type} <span class="filament-status-brand">${brand}</span></div>
            <div class="filament-status-name">${name}</div>
          </div>
        </div>
        <div class="filament-remain-section">
          <div class="filament-remain-pct ${remainClass}">~${displayRemain}%</div>
          <div class="filament-remain-label">${showEstimate ? t('filament.est_remaining') : t('filament.remaining')}${displayRemainG !== null ? ` · ~${Math.round(displayRemainG)}g` : ''}</div>
        </div>
        <div class="filament-remain-bar-lg">
          <div class="filament-remain-bar-fill-lg" style="width:${displayRemain}%;background:${barColor}"></div>${showEstimate ? `<div class="filament-remain-bar-usage" style="width:${remain - displayRemain}%;left:${displayRemain}%;background:${barColor};opacity:0.3"></div>` : ''}
        </div>
        ${usageHtml}
        <div class="filament-status-meta">
          ${slotLabel} &middot; ${tempMin}-${tempMax}°C
        </div>
      </div>`;
  };

  function hexToDisplayColor(hex) {
    if (!hex || hex.length < 6) return '#888';
    return `#${hex.substring(0, 6)}`;
  }

  function isLightHex(hex) {
    if (!hex || hex.length < 6) return false;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 160;
  }
})();
