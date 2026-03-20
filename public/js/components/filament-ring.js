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
          const info = _getTrayPercent(t, u, i, isActive, data);
          fp += '|' + i + ':' + info.current + ':' + (info.afterPrint ?? '') + ':' + (t.tray_type || '') + ':' + (t.tray_color || '');
        }
      }
    }
    return fp;
  }

  // Returns { current, afterPrint, isPrinting }
  // current = real-time remaining (consumed so far subtracted)
  // afterPrint = estimated remaining when print completes
  function _getTrayPercent(tray, amsUnitIdx, amsTrayIdx, isActive, data) {
    const printerId = window.printerState?.getActivePrinterId?.() || null;
    const linkedSpool = window.getLinkedSpool?.(printerId, amsUnitIdx, amsTrayIdx);
    let baseRemain;
    if (tray.remain >= 0 && tray.remain <= 100) {
      baseRemain = Math.round(tray.remain);
    } else if (linkedSpool && linkedSpool.initial_weight_g > 0 && linkedSpool.remaining_weight_g >= 0) {
      baseRemain = Math.max(0, Math.round((linkedSpool.remaining_weight_g / linkedSpool.initial_weight_g) * 100));
    } else {
      return { current: 0, afterPrint: null, isPrinting: false };
    }

    if (isActive && data) {
      const gcodeState = data.gcode_state || 'IDLE';
      const isPrinting = gcodeState === 'RUNNING' || gcodeState === 'PAUSE';
      const est = window._printEstimates;
      if (isPrinting && est && est.weight_g > 0) {
        const pct = data.mc_percent || 0;
        const totalG = linkedSpool ? linkedSpool.initial_weight_g : (tray.tray_weight ? parseFloat(tray.tray_weight) : null);
        const remainG = linkedSpool ? linkedSpool.remaining_weight_g : (totalG ? totalG * (baseRemain / 100) : null);
        if (remainG !== null && totalG > 0) {
          const consumedG = Math.round(est.weight_g * pct / 100);
          const currentRemainG = Math.max(0, remainG - consumedG);
          const afterPrintG = Math.max(0, remainG - est.weight_g);
          return {
            current: Math.max(0, Math.round((currentRemainG / totalG) * 100)),
            currentG: Math.round(currentRemainG),
            afterPrint: Math.max(0, Math.round((afterPrintG / totalG) * 100)),
            afterPrintG: Math.round(afterPrintG),
            usedG: consumedG,
            totalPrintG: Math.round(est.weight_g),
            totalG: Math.round(totalG),
            isPrinting: true
          };
        }
      }
    }

    const totalG = linkedSpool ? linkedSpool.initial_weight_g : (tray.tray_weight ? parseFloat(tray.tray_weight) : null);
    const currentG = totalG ? Math.round(totalG * baseRemain / 100) : null;
    return { current: baseRemain, currentG, afterPrint: null, isPrinting: false };
  }

  // Unique ID counter for filament-ring SVG defs
  let _frIdCounter = 0;

  // Hub spokes (4 curved spokes like real Bambu spools)
  function _hubSpokes(hubR) {
    const spokes = [];
    const innerR = 6;
    for (let i = 0; i < 4; i++) {
      const angle = (i * 90 + 45) * Math.PI / 180;
      const x1 = 50 + innerR * Math.cos(angle);
      const y1 = 50 + innerR * Math.sin(angle);
      const x2 = 50 + (hubR - 1.5) * Math.cos(angle);
      const y2 = 50 + (hubR - 1.5) * Math.sin(angle);
      spokes.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="var(--border-color)" stroke-width="1.8" stroke-linecap="round" opacity="0.35"/>`);
    }
    return spokes.join('');
  }

  // Winding texture with diagonal cross-hatch
  function _windingTexture(hubR, filR, uid) {
    if (filR - hubR < 3) return '';
    let lines = '';
    const count = Math.min(8, Math.max(3, Math.round((filR - hubR) / 3)));
    const gap = (filR - hubR) / count;
    for (let r = hubR + gap; r < filR - 0.5; r += gap) {
      lines += `<circle cx="50" cy="50" r="${r.toFixed(1)}" fill="none" stroke="rgba(255,255,255,0.09)" stroke-width="0.5"/>`;
    }
    lines += `<clipPath id="fr-clip-${uid}"><circle cx="50" cy="50" r="${(filR - 0.5).toFixed(1)}"/></clipPath>`;
    lines += `<g clip-path="url(#fr-clip-${uid})">`;
    for (let x = -40; x <= 40; x += 5) {
      const opacity = 0.06 + 0.03 * Math.sin(x * 0.3);
      lines += `<line x1="${(50 + x - 20).toFixed(0)}" y1="${(50 - filR).toFixed(0)}" x2="${(50 + x + 20).toFixed(0)}" y2="${(50 + filR).toFixed(0)}" stroke="rgba(0,0,0,${opacity.toFixed(3)})" stroke-width="0.7"/>`;
    }
    lines += '</g>';
    return lines;
  }

  // Inline spool SVG for the filament-ring card (reuses same visual style as _spoolSvg)
  function _spoolVisual(color, pct, id) {
    const hubR = 13;
    const maxR = 38;
    const filR = pct > 0 ? hubR + (maxR - hubR) * Math.max(5, pct) / 100 : hubR;
    const uid = _frIdCounter++;

    const windings = _windingTexture(hubR, filR, uid);
    const spokes = _hubSpokes(hubR);

    const notches = [0, 90, 180, 270].map(deg => {
      const rad = deg * Math.PI / 180;
      const x1 = 50 + 40 * Math.cos(rad), y1 = 50 + 40 * Math.sin(rad);
      const x2 = 50 + 44 * Math.cos(rad), y2 = 50 + 44 * Math.sin(rad);
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="var(--border-color)" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>`;
    }).join('');

    return `<svg viewBox="0 0 100 100" style="width:100%;height:100%" class="spool-svg">
      <defs>
        <radialGradient id="frg-${uid}" cx="38%" cy="35%" r="60%">
          <stop offset="0%" stop-color="white" stop-opacity="0.25"/>
          <stop offset="70%" stop-color="white" stop-opacity="0"/>
          <stop offset="100%" stop-color="black" stop-opacity="0.2"/>
        </radialGradient>
        <radialGradient id="frh-${uid}" cx="45%" cy="40%" r="50%">
          <stop offset="0%" stop-color="white" stop-opacity="0.08"/>
          <stop offset="100%" stop-color="black" stop-opacity="0.05"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="47" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>
      <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="3"/>
      <circle cx="50" cy="50" r="42" class="spool-flange"/>
      <circle cx="50" cy="50" r="42" fill="url(#frh-${uid})"/>
      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>
      ${notches}
      <circle cx="50" cy="50" r="${filR.toFixed(1)}" fill="${color}" class="spool-filament"/>
      <circle cx="50" cy="50" r="${filR.toFixed(1)}" fill="url(#frg-${uid})"/>
      ${windings}
      <circle cx="50" cy="50" r="${hubR}" class="spool-hub"/>
      <circle cx="50" cy="50" r="${hubR}" fill="url(#frh-${uid})"/>
      ${spokes}
      <circle cx="50" cy="50" r="5" class="spool-hole"/>
    </svg>`;
  }

  // Small spool for tray grid
  function _miniSpool(color, pct) {
    const hubR = 13;
    const maxR = 38;
    const filR = pct > 0 ? hubR + (maxR - hubR) * Math.max(5, pct) / 100 : hubR;
    const uid = _frIdCounter++;

    return `<svg viewBox="0 0 100 100" style="width:100%;height:100%" class="spool-svg">
      <defs>
        <radialGradient id="frm-${uid}" cx="40%" cy="38%" r="55%">
          <stop offset="0%" stop-color="white" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="black" stop-opacity="0.15"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="3"/>
      <circle cx="50" cy="50" r="42" class="spool-flange"/>
      <circle cx="50" cy="50" r="${filR.toFixed(1)}" fill="${color}" class="spool-filament"/>
      <circle cx="50" cy="50" r="${filR.toFixed(1)}" fill="url(#frm-${uid})"/>
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
    const activeInfo = _getTrayPercent(activeTray, activeEntry.unitIdx, activeEntry.trayIdx, true, data);
    const activeType = activeTray.tray_type || '??';
    const activeBrand = activeTray.tray_sub_brands || '';
    const colorName = getColorName(activeColor);
    const isActive = activeEntry.globalIdx === activeIdx;
    const slotNum = activeEntry.trayIdx + 1;
    const amsNum = activeEntry.unitIdx + 1;

    // Build display name: prefer brand (e.g. "PLA Basic"), fall back to type
    const displayName = activeBrand || activeType;
    const showType = activeBrand && activeBrand !== activeType;

    let html = '<div class="card-title">Filament</div>';

    // Main spool visual — shows current real-time percentage
    html += '<div class="filament-ring-main">';
    html += _spoolVisual(activeColor, activeInfo.current, 'fr-main');
    html += '<div class="filament-ring-overlay">';
    html += `<span class="filament-ring-percent">${activeInfo.current}%</span>`;
    html += '</div></div>';

    // Filament identity — clean single line
    html += '<div class="filament-ring-identity">';
    html += `<span class="filament-ring-brand">${displayName}</span>`;
    if (showType) html += `<span class="filament-ring-type-badge">${activeType}</span>`;
    html += '</div>';

    // Details row — color · weight · slot
    html += '<div class="filament-ring-info">';
    if (colorName) html += `<span>${colorName}</span>`;
    if (activeInfo.currentG != null) html += `<span>${activeInfo.currentG}g</span>`;
    html += `<span>AMS${amsNum} S${slotNum}</span>`;
    html += '</div>';

    // Print usage stats — shown below spool when printing
    if (activeInfo.isPrinting) {
      html += '<div class="filament-ring-stats">';
      html += `<div class="filament-ring-stat-row">`;
      html += `<span class="filament-ring-stat-label">Etter print</span>`;
      html += `<span class="filament-ring-stat-value">${activeInfo.afterPrint}% (${activeInfo.afterPrintG}g)</span>`;
      html += `</div>`;
      html += `<div class="filament-ring-stat-row">`;
      html += `<span class="filament-ring-stat-label">Forbruk</span>`;
      html += `<span class="filament-ring-stat-value">${activeInfo.usedG}g / ${activeInfo.totalPrintG}g</span>`;
      html += `</div>`;
      html += '</div>';
    }

    // Tray grid — small spools
    if (trays.length > 1) {
      html += '<div class="filament-ring-trays">';
      for (const entry of trays) {
        const c = parseColor(entry.tray.tray_color);
        const isAct = entry.globalIdx === activeIdx;
        const info = _getTrayPercent(entry.tray, entry.unitIdx, entry.trayIdx, isAct, data);
        html += `<div class="filament-ring-tray${isAct ? ' filament-ring-tray-active' : ''}">`;
        html += `<div class="filament-ring-tray-spool">${_miniSpool(c, info.current)}</div>`;
        const tBrand = entry.tray.tray_sub_brands || '';
        html += `<div class="filament-ring-tray-label" title="${tBrand ? tBrand + ' ' : ''}${entry.tray.tray_type || '?'}">${entry.tray.tray_type || '?'}</div>`;
        html += `<div class="filament-ring-tray-pct">${info.current}%</div>`;
        if (isAct && info.isPrinting && info.afterPrint != null) {
          html += `<div class="filament-ring-tray-after">&#8600; ${info.afterPrint}%</div>`;
        }
        html += '</div>';
      }
      html += '</div>';
    }

    container.innerHTML = html;

    // Low-stock alert
    const lowTrays = trays.filter(e => {
      const isAct = e.globalIdx === activeIdx;
      const info = _getTrayPercent(e.tray, e.unitIdx, e.trayIdx, isAct, data);
      return info.current < 15 && info.current >= 0;
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
