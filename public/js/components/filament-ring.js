(function() {
  'use strict';

  let _lastFp = '';

  // ── Parse slicer filament data from Moonraker metadata ──
  function _parseSlicerData(data) {
    const colors = (data._slicer_filament_colours || '').split(';').map(function(c) { return c.trim(); });
    const rawNames = (data._slicer_filament_names || '').split(';').map(function(n) { return n.trim(); });
    const types = (data._slicer_filament_type || '').split(';').map(function(t) { return t.trim(); });
    const weights = Array.isArray(data._slicer_filament_weights)
      ? data._slicer_filament_weights
      : [];

    // Clean brand names: remove @U1, @BBL..., @Snapmaker..., etc.
    const names = rawNames.map(function(n) {
      return n.replace(/@[A-Za-z0-9_.-]+/g, '').replace(/\s{2,}/g, ' ').trim();
    });

    return { colors: colors, names: names, types: types, weights: weights };
  }

  // Format seconds to human-readable time string
  function _fmtTime(secs) {
    if (!secs || secs <= 0) return '--';
    var h = Math.floor(secs / 3600);
    var m = Math.floor((secs % 3600) / 60);
    if (h > 0) return h + 'h ' + m + 'm';
    return m + 'm';
  }

  // ── Klipper/Moonraker extruder display (Snapmaker U1 etc.) ──
  function _renderKlipperExtruders(container, data) {
    const extruders = [];
    // Primary extruder
    if (data.nozzle_temper !== undefined) {
      extruders.push({
        index: 0,
        temp: Math.round(data.nozzle_temper),
        target: Math.round(data.nozzle_target_temper || 0),
        active: data._active_extruder === 'extruder' || data._active_extruder === undefined,
      });
    }
    // Additional extruders (Snapmaker U1 has up to 4)
    if (data._extra_extruders) {
      for (let i = 0; i < data._extra_extruders.length; i++) {
        const ex = data._extra_extruders[i];
        extruders.push({
          index: i + 1,
          temp: ex.temperature,
          target: ex.target,
          active: data._active_extruder === `extruder${i + 1}`,
        });
      }
    }

    if (extruders.length === 0) {
      container.innerHTML = '<div class="card-title">Filament</div><div class="countdown-idle">Ingen data</div>';
      return;
    }

    // Parse slicer metadata for filament info
    const slicer = _parseSlicerData(data);
    const isPrinting = data.gcode_state === 'RUNNING' || data.gcode_state === 'PAUSE';

    // Filter: show used extruders (weight > 0) + always include active extruder
    const hasSlicerWeights = slicer.weights.length > 0;
    const visibleExtruders = (isPrinting && hasSlicerWeights)
      ? extruders.filter(function(ext) {
        if (ext.active) return true; // Always show active extruder
        var w = slicer.weights[ext.index];
        return w !== undefined && w > 0;
      })
      : extruders;

    // Fall back to all extruders if filter resulted in empty set
    const displayExtruders = visibleExtruders.length > 0 ? visibleExtruders : extruders;

    // Assign fallback colors per slot
    const fallbackColors = ['#4a9eff', '#ff6b6b', '#ffd93d', '#6bcb77', '#c084fc', '#f97316', '#38bdf8', '#fb923c'];

    let html = '<div class="card-title">Extruders <span class="ams-live-badge" title="Live data via Moonraker">LIVE</span></div>';

    // State bar with filename and progress
    const state = data.gcode_state || 'IDLE';
    const progress = data.mc_percent || 0;
    const filename = data.subtask_name || '';

    if (isPrinting) {
      html += `<div class="fr-active-bar">
        <span class="fr-active-name">${_esc(filename)}</span>
        <span class="fr-active-slot">${progress}%</span>
      </div>`;
    }

    // Time + filament usage stats bar (only during print)
    if (isPrinting) {
      html += '<div class="fr-klipper-stats">';

      // Estimated vs actual time
      var estTime = data._slicer_estimated_time || 0;
      var actualTime = data.print_duration_seconds || 0;
      if (estTime > 0) {
        html += `<div class="fr-klipper-stat">
          <span class="fr-klipper-stat-icon">&#9201;</span>
          <span class="fr-klipper-stat-label">Elapsed</span>
          <span class="fr-klipper-stat-val">${_fmtTime(actualTime)} / ${_fmtTime(estTime)}</span>
        </div>`;
      }

      // Live filament used
      if (data.filament_used_mm && data.filament_used_mm > 0) {
        var usedM = (data.filament_used_mm / 1000).toFixed(2);
        html += `<div class="fr-klipper-stat">
          <span class="fr-klipper-stat-icon">&#128207;</span>
          <span class="fr-klipper-stat-label">Filament</span>
          <span class="fr-klipper-stat-val">${usedM}m</span>
        </div>`;
      }

      // Object height / layer info
      if (data._object_height) {
        var layerInfo = data._object_height + 'mm';
        if (data._layer_height) layerInfo += ' (layer ' + data._layer_height + 'mm)';
        html += `<div class="fr-klipper-stat">
          <span class="fr-klipper-stat-icon">&#9650;</span>
          <span class="fr-klipper-stat-label">Height</span>
          <span class="fr-klipper-stat-val">${layerInfo}</span>
        </div>`;
      }

      html += '</div>';
    }

    // Extruder grid — uses same spool SVG visual as Bambu AMS for consistent look
    html += '<div class="fr-spools-grid">';
    for (const ext of displayExtruders) {
      var slicerColor = slicer.colors[ext.index] || '';
      var filColor = (slicerColor && slicerColor.startsWith('#'))
        ? slicerColor : fallbackColors[ext.index % fallbackColors.length];
      var filName = slicer.names[ext.index] || '';
      var filType = slicer.types[ext.index] || '';
      var filWeight = (slicer.weights[ext.index] > 0) ? slicer.weights[ext.index] : 0;

      const isActive = ext.active;
      const isHeating = ext.target > 0;
      const activeCls = isActive ? ' fr-spool-active' : '';
      const warnCls = ext.temp > 200 ? '' : '';

      // Use filament color for spool visual — percentage based on weight used if available
      const filPct = filWeight > 0 ? Math.max(10, 80) : (isHeating ? 60 : 30);
      const tempLabel = ext.temp > 0 ? ext.temp + '°C' : '';
      const slotLabel = 'T' + ext.index;

      html += `<div class="fr-spool-item${activeCls}${warnCls}" style="cursor:default">`;
      // Reuse the same spool SVG as Bambu — with filament color and percentage
      html += `<div class="fr-spool-ring">${_spoolVisual(filColor, filPct, 'kl-' + ext.index)}<div class="fr-spool-overlay"><span class="fr-spool-pct">${tempLabel}</span></div></div>`;

      // Meta: same layout as Bambu AMS spools
      html += `<div class="fr-spool-meta">`;
      html += `<span class="fr-spool-brand">${filName ? _esc(filName) : filType || slotLabel}</span>`;
      if (filWeight > 0) {
        html += `<span class="fr-spool-weight-row">${filWeight.toFixed(0)}g</span>`;
      }
      html += `<span class="fr-spool-slot">${slotLabel}${isActive ? ' · Active' : ' · Parked'}${isHeating ? ' · 🔥' + ext.target + '°C' : ''}</span>`;
      if (filType) html += `<span class="fr-spool-temp">${filType}</span>`;
      html += `</div></div>`;
    }
    html += '</div>';

    // Position + speed bar (compact, like Bambu's AMS info)
    const infoItems = [];
    if (data._position) infoItems.push(`X:${data._position.x} Y:${data._position.y} Z:${data._position.z}`);
    if (data.spd_mag) infoItems.push(`Speed: ${data.spd_mag}%`);
    if (data.cooling_fan_speed) infoItems.push(`Fan: ${data.cooling_fan_speed}%`);
    if (infoItems.length > 0) {
      html += `<div class="fr-klipper-position">${infoItems.join(' · ')}</div>`;
    }

    container.innerHTML = html;
  }

  function _esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  // Reset fingerprint cache — called when switching printers
  window.resetFilamentRingCache = function() { _lastFp = ''; };

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
    // Include mapping in fingerprint for EXT detection (P2S/A1 AMS Lite)
    const _m = data.mapping;
    const _isExt = Array.isArray(_m) && _m.length > 0 && ((_m[0] >> 8) & 0xFF) === 0xFF;
    const activeIdx = _isExt ? 254 : (ams.tray_now != null ? parseInt(ams.tray_now) : -1);
    const _estKey = window._printEstimates ? String(window._printEstimates.weight_g) : '0';
    let fp = String(activeIdx) + '_' + (data.mc_percent || 0) + '_e' + _estKey;
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
    // Bruk den laveste av AMS-sensor og spoldatabasen
    // AMS-sensor kan vise for høyt etter feilede prints der filament ble kastet
    const amsRemain = (tray.remain >= 0 && tray.remain <= 100) ? Math.round(tray.remain) : null;
    const spoolRemain = (linkedSpool && linkedSpool.initial_weight_g > 0 && linkedSpool.remaining_weight_g >= 0)
      ? Math.max(0, Math.round((linkedSpool.remaining_weight_g / linkedSpool.initial_weight_g) * 100)) : null;

    let baseRemain;
    if (amsRemain !== null && spoolRemain !== null) {
      baseRemain = Math.min(amsRemain, spoolRemain);
    } else if (amsRemain !== null) {
      baseRemain = amsRemain;
    } else if (spoolRemain !== null) {
      baseRemain = spoolRemain;
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
          // For AMS: remainG syncs during print → reconstruct start = remainG + consumed
          // For EXT (no sync): remainG is fixed at start value → use directly
          const _isExtM = Array.isArray(data.mapping) && data.mapping.length > 0 && ((data.mapping[0] >> 8) & 0xFF) === 0xFF;
          const startOfPrintG = _isExtM ? Math.min(totalG, remainG) : Math.min(totalG, remainG + consumedG);
          const currentRemainG = Math.max(0, startOfPrintG - consumedG);
          const afterPrintG = Math.max(0, startOfPrintG - est.weight_g);
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

    // Skip if data hasn't changed (avoid flicker) — but always render during printing
    const isPrinting = data.gcode_state === 'RUNNING' || data.gcode_state === 'PAUSE';
    if (!isPrinting) {
      const fp = _fingerprint(data);
      if (fp === _lastFp) return;
      _lastFp = fp;
    }

    const ams = data.ams;

    // Moonraker/Klipper printers: show extruder temps instead of AMS trays
    if ((!ams || !ams.ams || !ams.ams.length) && data._extra_extruders) {
      _renderKlipperExtruders(container, data);
      return;
    }
    if ((!ams || !ams.ams || !ams.ams.length) && data.nozzle_temper !== undefined && !data.ams) {
      _renderKlipperExtruders(container, data);
      return;
    }
    if (!ams || !ams.ams || !ams.ams.length) {
      container.innerHTML = '<div class="card-title">Filament</div><div class="countdown-idle">Ingen AMS-data</div>';
      return;
    }

    // Collect trays (AMS + external)
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
    // Include external spool — always show if vt_tray exists or linked spool exists
    const _extPid = window.printerState?.getActivePrinterId?.();
    const _extSpool = window.getLinkedSpool?.(_extPid, 255, 0);
    if (ams.vt_tray && ams.vt_tray.tray_type) {
      trays.push({ tray: ams.vt_tray, unitIdx: 255, trayIdx: 0, globalIdx: 254, isExternal: true });
    } else if (_extSpool) {
      // P2S/A1 or any printer with an EXT spool in inventory
      trays.push({
        tray: {
          tray_type: _extSpool.material || _extSpool.profile_name || 'PLA',
          tray_color: (_extSpool.color_hex || '808080').replace('#',''),
          tray_sub_brands: _extSpool.profile_name || '',
          remain: _extSpool.initial_weight_g > 0 ? Math.round(_extSpool.remaining_weight_g / _extSpool.initial_weight_g * 100) : -1,
          tray_weight: _extSpool.initial_weight_g ? String(_extSpool.initial_weight_g) : null,
          nozzle_temp_min: _extSpool.nozzle_temp_min || null,
          nozzle_temp_max: _extSpool.nozzle_temp_max || null
        },
        unitIdx: 255, trayIdx: 0, globalIdx: 254, isExternal: true
      });
    }

    if (!trays.length) {
      container.innerHTML = '<div class="card-title">Filament</div><div class="countdown-idle">Ingen filament lastet</div>';
      return;
    }

    // Detect EXT: mapping[0] high byte 0xFF = external spool (P2S/A1 AMS Lite)
    const _mapping = data.mapping;
    const _isExtFromMapping = Array.isArray(_mapping) && _mapping.length > 0 && ((_mapping[0] >> 8) & 0xFF) === 0xFF;
    const rawActiveIdx = ams.tray_now != null ? parseInt(ams.tray_now) : -1;
    const activeIdx = _isExtFromMapping ? 254 : rawActiveIdx;
    const activeEntry = trays.find(e => e.globalIdx === activeIdx || (activeIdx >= 254 && e.isExternal)) || trays[0];
    const activeTray = activeEntry.tray;

    const activeColor = parseColor(activeTray.tray_color);
    const activeInfo = _getTrayPercent(activeTray, activeEntry.unitIdx, activeEntry.trayIdx, true, data);
    const activeType = activeTray.tray_type || '??';
    const activeBrand = activeTray.tray_sub_brands || '';
    const activeLinkedSpool = window.getLinkedSpool?.(window.printerState?.getActivePrinterId?.(), activeEntry.unitIdx, activeEntry.trayIdx);
    const activeColorName = activeLinkedSpool?.bambu_color_name || getColorName(activeColor);
    const isActive = activeEntry.globalIdx === activeIdx || (activeIdx >= 254 && activeEntry.isExternal);
    const slotNum = activeEntry.isExternal ? 0 : activeEntry.trayIdx + 1;
    const amsNum = activeEntry.isExternal ? 0 : activeEntry.unitIdx + 1;

    // Build display name: prefer brand + color name
    const displayName = (activeBrand || activeType) + (activeColorName ? ' — ' + activeColorName : '');
    const showType = activeBrand && activeBrand !== activeType;

    let html = '<div class="card-title">Filament <span class="ams-live-badge" title="Live data fra AMS via MQTT">LIVE</span></div>';

    // Active spool info bar
    html += '<div class="fr-active-bar">';
    html += `<div class="fr-active-dot" style="background:${activeColor}"></div>`;
    html += `<span class="fr-active-name">${displayName}</span>`;
    if (showType) html += `<span class="filament-ring-type-badge">${activeType}</span>`;
    html += `<span class="fr-active-slot">${activeEntry.isExternal ? 'EXT' : `AMS${amsNum}:${slotNum}`}</span>`;
    if (activeInfo.currentG != null) html += `<span class="fr-active-weight">${activeInfo.currentG}g</span>`;
    html += '</div>';

    // Print stats bar (when printing)
    if (activeInfo.isPrinting) {
      const usePct = activeInfo.totalPrintG > 0 ? Math.round(activeInfo.usedG / activeInfo.totalPrintG * 100) : 0;
      html += '<div class="fr-print-stats">';
      html += `<span>${t('filament.usage') || 'Usage'}: ${activeInfo.usedG}g / ${activeInfo.totalPrintG}g</span>`;
      html += `<span>${t('filament.after_print') || 'After'}: ${activeInfo.afterPrint}% (${activeInfo.afterPrintG}g)</span>`;
      html += `<div class="fr-usage-bar"><div class="fr-usage-bar-fill" style="width:${usePct}%;background:${activeColor}"></div></div>`;
      html += '</div>';
    }

    // All trays — large spools with full info
    html += '<div class="fr-spools-grid">';
    for (const entry of trays) {
      const tr = entry.tray;
      const c = parseColor(tr.tray_color);
      const isAct = entry.globalIdx === activeIdx || (activeIdx >= 254 && entry.isExternal);
      const info = _getTrayPercent(tr, entry.unitIdx, entry.trayIdx, isAct, data);
      const brand = tr.tray_sub_brands || '';
      const tType = tr.tray_type || '?';
      const slotLabel = entry.isExternal ? 'EXT' : `A${entry.trayIdx + 1}`;
      const weightG = info.currentG != null ? info.currentG + 'g' : '';
      const totalG = tr.tray_weight ? parseInt(tr.tray_weight) + 'g' : '';
      const nozzleRange = (tr.nozzle_temp_min && tr.nozzle_temp_max) ? tr.nozzle_temp_min + '-' + tr.nozzle_temp_max + '°C' : '';
      const hasRfid = !!(tr.tag_uid || tr.tray_uuid);
      const linkedSpool = window.getLinkedSpool?.(window.printerState?.getActivePrinterId?.(), entry.unitIdx, entry.trayIdx);
      const bambuColorName = linkedSpool?.bambu_color_name;
      const colorName = bambuColorName || getColorName(c);
      const idName = tr.tray_id_name || linkedSpool?.bambu_variant_id || '';

      // Warn if low
      const isLow = info.current <= 10;
      const isCritical = info.current <= 5;
      let warnClass = isCritical ? ' fr-spool-critical' : isLow ? ' fr-spool-low' : '';

      const spoolData = JSON.stringify({ unitIdx: entry.unitIdx, trayIdx: entry.trayIdx, isExt: !!entry.isExternal, type: tType, brand, color: tr.tray_color, remain: info.current, weightG: info.currentG, totalG: tr.tray_weight, nozzle: nozzleRange, rfid: hasRfid, idName, colorName, slot: slotLabel, dryingTemp: tr.drying_temp, dryingTime: tr.drying_time }).replace(/'/g, '&#39;');
      html += `<div class="fr-spool-item${isAct ? ' fr-spool-active' : ''}${warnClass}" style="cursor:pointer" onclick='showSpoolDetail(${spoolData})'>`;
      html += `<div class="fr-spool-ring">${_spoolVisual(c, info.current, 'fr-' + entry.globalIdx)}<div class="fr-spool-overlay"><span class="fr-spool-pct">${info.current}%</span></div></div>`;
      html += `<div class="fr-spool-meta">`;
      html += `<span class="fr-spool-brand">${brand || tType}${colorName ? ' — ' + colorName : ''}</span>`;
      html += `<span class="fr-spool-weight-row">${weightG}${totalG ? ' / ' + totalG : ''}</span>`;
      html += `<span class="fr-spool-slot">${slotLabel}${idName ? ' · ' + idName : ''}${nozzleRange ? ' · 🔥' + nozzleRange : ''}</span>`;
      if (hasRfid) html += `<span class="fr-spool-rfid" title="RFID${idName ? ': ' + idName : ''}">📡</span>`;
      html += `</div>`;
      if (isAct && info.isPrinting && info.afterPrint != null) {
        html += `<div class="fr-spool-after">→ ${info.afterPrint}% (${info.afterPrintG}g)</div>`;
      }
      html += '</div>';
    }
    html += '</div>'; // end fr-spools-grid

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

      // Low filament shown visually in spool rings + AMS panel — no toast needed
    } else {
      const filBtn = document.querySelector('.sidebar-btn[data-panel="filament"]');
      if (filBtn) {
        const dot = filBtn.querySelector('.low-stock-dot');
        if (dot) dot.remove();
      }
    }
  };

  // Spool detail popup — shows full info when clicking a spool
  window.showSpoolDetail = function(d) {
    // Remove existing popup
    document.querySelectorAll('.fr-detail-popup').forEach(el => el.remove());

    const color = d.color ? '#' + d.color.substring(0, 6) : '#888';
    const remainPct = d.remain ?? 0;
    const remainBar = `<div style="height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;margin:6px 0"><div style="height:100%;width:${remainPct}%;background:${color};border-radius:3px;transition:width 0.3s"></div></div>`;

    let html = `
      <div class="fr-detail-header">
        <div class="fr-detail-dot" style="background:${color}"></div>
        <div>
          <div class="fr-detail-title">${d.brand || d.type}</div>
          <div class="fr-detail-sub">${d.type}${d.colorName ? ' · ' + d.colorName : ''} · ${d.slot}</div>
        </div>
        <button class="fr-detail-close" onclick="this.closest('.fr-detail-popup').remove()">×</button>
      </div>
      ${remainBar}
      <div class="fr-detail-grid">
        <div class="fr-detail-stat"><span class="fr-detail-stat-val">${remainPct}%</span><span class="fr-detail-stat-lbl">${t('filament.remaining') || 'Remaining'}</span></div>
        <div class="fr-detail-stat"><span class="fr-detail-stat-val">${d.weightG || '--'}g</span><span class="fr-detail-stat-lbl">${t('filament.weight') || 'Weight'}</span></div>
        <div class="fr-detail-stat"><span class="fr-detail-stat-val">${d.totalG || '--'}g</span><span class="fr-detail-stat-lbl">${t('filament.total') || 'Total'}</span></div>
      </div>`;

    // Extra info rows
    html += '<div class="fr-detail-rows">';
    if (d.nozzle) html += `<div class="fr-detail-row"><span>${t('filament.nozzle_temp') || 'Nozzle'}</span><span>${d.nozzle}</span></div>`;
    if (d.dryingTemp) html += `<div class="fr-detail-row"><span>${t('filament.drying') || 'Drying'}</span><span>${d.dryingTemp}°C / ${d.dryingTime || '?'}h</span></div>`;
    if (d.rfid) html += `<div class="fr-detail-row"><span>RFID</span><span>${d.idName || 'Bambu Lab'} ✓</span></div>`;
    html += `<div class="fr-detail-row"><span>${t('filament.diameter') || 'Diameter'}</span><span>1.75mm</span></div>`;
    html += '</div>';

    // Material info button
    html += `<button class="form-btn form-btn-sm" style="width:100%;margin-top:8px" onclick="location.hash='#filament/inventory'">${t('filament.view_inventory') || 'View in Inventory'}</button>`;

    // Render material info card if available
    html += `<div id="fr-material-info-${d.slot}"></div>`;

    const popup = document.createElement('div');
    popup.className = 'fr-detail-popup';
    popup.innerHTML = html;

    // Position near the clicked spool
    document.body.appendChild(popup);

    // Load material info if available
    if (typeof renderMaterialInfo === 'function') {
      setTimeout(() => renderMaterialInfo(document.getElementById('fr-material-info-' + d.slot), d.type), 100);
    }
  };
})();
