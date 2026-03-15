(function() {
  'use strict';

  let _lastFp = '';

  function parseColor(trayColor) {
    if (!trayColor || trayColor.length < 6) return '#888888';
    return '#' + trayColor.substring(0, 6);
  }

  function getColorName(hex) {
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    if (brightness < 30) return 'Svart';
    if (brightness > 225 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20) return 'Hvit';
    if (r > 180 && g < 80 && b < 80) return 'Rød';
    if (r < 80 && g > 150 && b < 80) return 'Grønn';
    if (r < 80 && g < 80 && b > 150) return 'Blå';
    if (r > 200 && g > 200 && b < 80) return 'Gul';
    if (r > 200 && g > 100 && g < 180 && b < 80) return 'Oransje';
    if (r > 150 && g < 80 && b > 150) return 'Lilla';
    if (r > 100 && g < 100 && b > 100) return 'Rosa';
    if (Math.abs(r - g) < 30 && Math.abs(g - b) < 30) return 'Grå';
    return '';
  }

  // Build a fingerprint to detect if actual data changed
  function _fingerprint(data) {
    const ams = data.ams;
    if (!ams || !ams.ams) return 'none';
    const activeIdx = ams.tray_now != null ? parseInt(ams.tray_now) : -1;
    let fp = String(activeIdx) + '_' + (data.mc_percent || 0);
    for (let u = 0; u < ams.ams.length; u++) {
      const unit = ams.ams[u];
      if (unit.tray) {
        for (let i = 0; i < unit.tray.length; i++) {
          const t = unit.tray[i];
          if (!t) continue;
          const globalIdx = u * 4 + i;
          const isActive = globalIdx === activeIdx;
          const pct = _getTrayPercent(t, u, i, isActive, data);
          fp += '|' + i + ':' + pct + ':' + (t.tray_type || '') + ':' + (t.tray_color || '');
        }
      }
    }
    return fp;
  }

  function _getTrayPercent(tray, amsUnitIdx, amsTrayIdx, isActive, data) {
    const printerId = window.printerState?.getActivePrinterId?.() || null;
    const linkedSpool = window.getLinkedSpool?.(printerId, amsUnitIdx, amsTrayIdx);
    let remain;
    if (tray.remain >= 0 && tray.remain <= 100) {
      remain = Math.round(tray.remain);
    } else if (linkedSpool && linkedSpool.initial_weight_g > 0 && linkedSpool.remaining_weight_g >= 0) {
      remain = Math.max(0, Math.round((linkedSpool.remaining_weight_g / linkedSpool.initial_weight_g) * 100));
    } else {
      return 0;
    }

    if (isActive && data) {
      const gcodeState = data.gcode_state || 'IDLE';
      const isPrinting = gcodeState === 'RUNNING' || gcodeState === 'PAUSE';
      const est = window._printEstimates;
      if (isPrinting && est && est.weight_g > 0) {
        const pct = data.mc_percent || 0;
        const totalG = linkedSpool ? linkedSpool.initial_weight_g : (tray.tray_weight ? parseFloat(tray.tray_weight) : null);
        const remainG = linkedSpool ? linkedSpool.remaining_weight_g : (totalG ? totalG * (remain / 100) : null);
        if (remainG !== null && totalG > 0) {
          const consumedG = Math.round(est.weight_g * pct / 100);
          const remainingPrintG = est.weight_g - consumedG;
          remain = Math.max(0, Math.round(((remainG - remainingPrintG) / totalG) * 100));
        }
      }
    }

    return remain;
  }

  // Inline spool SVG for the filament-ring card (reuses same visual style as _spoolSvg)
  function _spoolVisual(color, pct, id) {
    const hubR = 13;
    const maxR = 38;
    const filR = pct > 0 ? hubR + (maxR - hubR) * Math.max(5, pct) / 100 : hubR;

    let windings = '';
    if (pct > 8) {
      const gap = (filR - hubR) / Math.min(5, Math.max(2, Math.round((filR - hubR) / 4)));
      for (let r = hubR + gap; r < filR - 1; r += gap) {
        windings += `<circle cx="50" cy="50" r="${r.toFixed(1)}" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="0.6"/>`;
      }
    }

    const notches = [0, 90, 180, 270].map(deg => {
      const rad = deg * Math.PI / 180;
      const x1 = 50 + 40 * Math.cos(rad), y1 = 50 + 40 * Math.sin(rad);
      const x2 = 50 + 44 * Math.cos(rad), y2 = 50 + 44 * Math.sin(rad);
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="var(--border-color)" stroke-width="1.2" opacity="0.4"/>`;
    }).join('');

    return `<svg viewBox="0 0 100 100" style="width:100%;height:100%" class="spool-svg">
      <circle cx="50" cy="50" r="44" fill="rgba(0,0,0,0.06)"/>
      <circle cx="50" cy="50" r="42" class="spool-flange"/>
      ${notches}
      <circle cx="50" cy="50" r="${filR.toFixed(1)}" fill="${color}" class="spool-filament"/>
      ${windings}
      <circle cx="50" cy="50" r="${hubR}" class="spool-hub"/>
      <circle cx="50" cy="50" r="5" class="spool-hole"/>
    </svg>`;
  }

  // Small spool for tray grid
  function _miniSpool(color, pct) {
    const hubR = 13;
    const maxR = 38;
    const filR = pct > 0 ? hubR + (maxR - hubR) * Math.max(5, pct) / 100 : hubR;

    return `<svg viewBox="0 0 100 100" style="width:100%;height:100%" class="spool-svg">
      <circle cx="50" cy="50" r="42" class="spool-flange"/>
      <circle cx="50" cy="50" r="${filR.toFixed(1)}" fill="${color}" class="spool-filament"/>
      <circle cx="50" cy="50" r="${hubR}" class="spool-hub"/>
      <circle cx="50" cy="50" r="5" class="spool-hole"/>
    </svg>`;
  }

  window.updateFilamentRing = function(data) {
    const container = document.getElementById('filament-ring');
    if (!container) return;

    // Skip if data hasn't changed (avoid flicker)
    const fp = _fingerprint(data);
    if (fp === _lastFp) return;
    _lastFp = fp;

    const ams = data.ams;
    if (!ams || !ams.ams || !ams.ams.length) {
      container.innerHTML = '<div class="card-title">Filament</div><div class="countdown-idle">Ingen AMS-data</div>';
      return;
    }

    // Collect trays
    const trays = [];
    for (let u = 0; u < ams.ams.length; u++) {
      const unit = ams.ams[u];
      if (unit.tray) {
        for (let i = 0; i < unit.tray.length; i++) {
          const t = unit.tray[i];
          if (t && t.tray_type) trays.push({ tray: t, unitIdx: u, trayIdx: i, globalIdx: u * 4 + i });
        }
      }
    }

    if (!trays.length) {
      container.innerHTML = '<div class="card-title">Filament</div><div class="countdown-idle">Ingen filament lastet</div>';
      return;
    }

    const activeIdx = ams.tray_now != null ? parseInt(ams.tray_now) : -1;
    const activeEntry = trays.find(e => e.globalIdx === activeIdx) || trays[0];
    const activeTray = activeEntry.tray;

    const activeColor = parseColor(activeTray.tray_color);
    const activePercent = _getTrayPercent(activeTray, activeEntry.unitIdx, activeEntry.trayIdx, true, data);
    const activeType = activeTray.tray_type || '??';
    const colorName = getColorName(activeColor);
    const isActive = activeEntry.globalIdx === activeIdx;

    let html = '<div class="card-title">Filament</div>';

    // Main spool visual
    html += '<div class="filament-ring-main">';
    html += _spoolVisual(activeColor, activePercent, 'fr-main');
    html += '<div class="filament-ring-overlay">';
    html += `<span class="filament-ring-percent">${activePercent}%</span>`;
    html += '</div></div>';

    // Active filament info
    html += '<div class="filament-ring-info">';
    html += `<span class="filament-ring-type-label">${activeType}</span>`;
    if (colorName) html += `<span class="filament-ring-color-name">${colorName}</span>`;
    html += '</div>';

    // Tray grid — small spools
    if (trays.length > 1) {
      html += '<div class="filament-ring-trays">';
      for (const entry of trays) {
        const c = parseColor(entry.tray.tray_color);
        const isAct = entry.globalIdx === activeIdx;
        const p = _getTrayPercent(entry.tray, entry.unitIdx, entry.trayIdx, isAct, data);
        html += `<div class="filament-ring-tray${isAct ? ' filament-ring-tray-active' : ''}">`;
        html += `<div class="filament-ring-tray-spool">${_miniSpool(c, p)}</div>`;
        html += `<div class="filament-ring-tray-label">${entry.tray.tray_type || '?'}</div>`;
        html += `<div class="filament-ring-tray-pct">${p}%</div>`;
        html += '</div>';
      }
      html += '</div>';
    }

    container.innerHTML = html;

    // Low-stock alert
    const lowTrays = trays.filter(e => {
      const isAct = e.globalIdx === activeIdx;
      const p = _getTrayPercent(e.tray, e.unitIdx, e.trayIdx, isAct, data);
      return p < 15 && p >= 0;
    });
    if (lowTrays.length > 0) {
      const warn = document.createElement('div');
      warn.className = 'filament-low-warning';
      warn.textContent = lowTrays.length === 1
        ? `Lite filament i spor ${lowTrays[0].trayIdx}!`
        : `Lite filament i ${lowTrays.length} spor!`;
      container.appendChild(warn);

      const filBtn = document.querySelector('.sidebar-btn[data-panel="filament"]');
      if (filBtn && !filBtn.querySelector('.low-stock-dot')) {
        const dot = document.createElement('span');
        dot.className = 'low-stock-dot';
        filBtn.appendChild(dot);
      }

      if (!window._lowStockAlerted) {
        window._lowStockAlerted = true;
        if (typeof showToast === 'function') showToast('Lite filament igjen i AMS!', 'warning', 5000);
      }
    } else {
      const filBtn = document.querySelector('.sidebar-btn[data-panel="filament"]');
      if (filBtn) {
        const dot = filBtn.querySelector('.low-stock-dot');
        if (dot) dot.remove();
      }
    }
  };
})();
