// Active Filament Display - shows in the print status panel
(function() {
  window.updateActiveFilament = function(data) {
    const container = document.getElementById('active-filament');
    if (!container) return;

    const amsData = data.ams;
    if (!amsData?.ams?.[0]?.tray) {
      container.innerHTML = `
        <div class="filament-inactive">
          <span class="text-muted">${t('filament.no_data')}</span>
        </div>`;
      return;
    }

    const activeTrayIdx = amsData.tray_now;
    const tray = amsData.ams[0].tray.find(t => String(t.id) === String(activeTrayIdx));

    if (!tray || !tray.tray_type) {
      container.innerHTML = `
        <div class="filament-inactive">
          <span class="text-muted">${t('filament.none_active')}</span>
        </div>`;
      return;
    }

    const color = hexToDisplayColor(tray.tray_color);
    const remain = tray.remain >= 0 ? Math.round(tray.remain) : 0;
    const brand = tray.tray_sub_brands || '';
    const name = tray.tray_id_name || tray.tray_type;
    const tempMin = tray.nozzle_temp_min || '?';
    const tempMax = tray.nozzle_temp_max || '?';
    const isLight = isLightHex(tray.tray_color);
    const slotNum = parseInt(activeTrayIdx) + 1;
    const totalG = tray.tray_weight ? parseFloat(tray.tray_weight) : null;
    const remainG = totalG ? totalG * (remain / 100) : null;

    // Estimate filament consumption during active print
    const est = window._printEstimates;
    const gcodeState = data.gcode_state || 'IDLE';
    const isPrinting = gcodeState === 'RUNNING' || gcodeState === 'PAUSE';
    const pct = data.mc_percent || 0;

    let usageHtml = '';
    let displayRemain = remain;
    let displayRemainG = remainG;
    if (isPrinting && est && est.weight_g > 0) {
      const consumedG = Math.round(est.weight_g * pct / 100);
      const remainingPrintG = est.weight_g - consumedG;
      if (remainG !== null && totalG > 0) {
        displayRemainG = Math.max(0, remainG - remainingPrintG);
        displayRemain = Math.round((displayRemainG / totalG) * 100);
      }
      usageHtml = `
        <div class="filament-usage-estimate">
          <span>${t('filament.print_using')}: ${consumedG}g / ${Math.round(est.weight_g)}g</span>
          <div class="filament-usage-bar"><div class="filament-usage-bar-fill" style="width:${pct}%;background:${color}"></div></div>
        </div>`;
    }

    // Color for the bar - low remaining = warn
    const barColor = displayRemain < 15 ? 'var(--accent-red)' : color;
    const remainClass = displayRemain < 15 ? 'filament-remain-low' : '';
    const showEstimate = isPrinting && displayRemain !== remain;

    container.innerHTML = `
      <div class="filament-status">
        <div class="filament-status-header">
          <div class="filament-color-dot" style="background:${color};${isLight ? 'border:2px solid var(--border-color)' : ''}"></div>
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
          ${t('filament.slot', { num: slotNum })} &middot; ${tempMin}-${tempMax}°C
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
