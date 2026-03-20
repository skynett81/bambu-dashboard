// Global spool SVG utilities — reusable across all components
(function() {
  'use strict';

  // Unique ID counter for SVG gradient definitions
  let _spoolIdCounter = 0;

  // Generate hub spokes SVG (4 curved spokes like real Bambu spools)
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

  // Generate winding texture (diagonal lines simulating wound filament)
  function _windingTexture(hubR, filR, uid) {
    if (filR - hubR < 3) return '';
    let lines = '';
    const count = Math.min(8, Math.max(3, Math.round((filR - hubR) / 3)));
    const gap = (filR - hubR) / count;
    for (let r = hubR + gap; r < filR - 0.5; r += gap) {
      lines += `<circle cx="50" cy="50" r="${r.toFixed(1)}" fill="none" stroke="rgba(255,255,255,0.09)" stroke-width="0.5"/>`;
    }
    // Diagonal cross-hatch for wound filament look
    lines += `<clipPath id="sp-clip-${uid}"><circle cx="50" cy="50" r="${(filR - 0.5).toFixed(1)}"/></clipPath>`;
    lines += `<g clip-path="url(#sp-clip-${uid})">`;
    for (let x = -40; x <= 40; x += 5) {
      const opacity = 0.06 + 0.03 * Math.sin(x * 0.3);
      lines += `<line x1="${(50 + x - 20).toFixed(0)}" y1="${(50 - filR).toFixed(0)}" x2="${(50 + x + 20).toFixed(0)}" y2="${(50 + filR).toFixed(0)}" stroke="rgba(0,0,0,${opacity.toFixed(3)})" stroke-width="0.7"/>`;
    }
    lines += '</g>';
    return lines;
  }

  /**
   * Inline mini spool SVG — replaces color dots/swatches everywhere.
   * @param {string} color - CSS color (hex or rgb)
   * @param {number} [size=16] - Size in px
   * @param {number} [pct=80] - Fill percentage (0-100)
   * @returns {string} HTML string with inline SVG
   */
  window.miniSpool = function(color, size, pct) {
    const sz = size || 16;
    const p = pct != null ? pct : 80;
    const hubR = 13;
    const maxR = 38;
    const filR = p > 0 ? hubR + (maxR - hubR) * Math.max(5, p) / 100 : hubR;
    const uid = _spoolIdCounter++;
    const c = color || '#888';
    const style = `display:inline-block;width:${sz}px;height:${sz}px;vertical-align:middle;flex-shrink:0`;
    return `<span style="${style}"><svg viewBox="0 0 100 100" style="width:100%;height:100%">
      <defs>
        <radialGradient id="mfg-${uid}" cx="40%" cy="38%" r="55%">
          <stop offset="0%" stop-color="white" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="black" stop-opacity="0.15"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="4"/>
      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2.5"/>
      <circle cx="50" cy="50" r="${filR.toFixed(1)}" fill="${c}"/>
      <circle cx="50" cy="50" r="${filR.toFixed(1)}" fill="url(#mfg-${uid})"/>
      <circle cx="50" cy="50" r="${hubR}" fill="var(--bg-card, #1a1c20)" stroke="var(--border-color)" stroke-width="1.5"/>
      <circle cx="50" cy="50" r="5" fill="var(--bg-primary, #0d0f12)"/>
    </svg></span>`;
  };

  /**
   * Larger spool SVG with winding detail — for cards, headers, larger displays.
   * @param {string} color - CSS color
   * @param {number} [size=48] - Size in px
   * @param {number} [pct=80] - Fill percentage
   * @returns {string} HTML string
   */
  window.spoolIcon = function(color, size, pct) {
    const sz = size || 48;
    const p = pct != null ? pct : 80;
    const hubR = 13;
    const maxR = 38;
    const filR = p > 0 ? hubR + (maxR - hubR) * Math.max(5, p) / 100 : hubR;
    const uid = _spoolIdCounter++;
    const c = color || '#888';

    const windings = _windingTexture(hubR, filR, uid);
    const spokes = _hubSpokes(hubR);

    const notches = [0, 90, 180, 270].map(deg => {
      const rad = deg * Math.PI / 180;
      const x1 = 50 + 40 * Math.cos(rad), y1 = 50 + 40 * Math.sin(rad);
      const x2 = 50 + 44 * Math.cos(rad), y2 = 50 + 44 * Math.sin(rad);
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="var(--border-color)" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>`;
    }).join('');

    const style = `display:inline-block;width:${sz}px;height:${sz}px;vertical-align:middle;flex-shrink:0`;
    return `<span style="${style}"><svg viewBox="0 0 100 100" style="width:100%;height:100%" class="spool-svg">
      <defs>
        <radialGradient id="sfg-${uid}" cx="38%" cy="35%" r="60%">
          <stop offset="0%" stop-color="white" stop-opacity="0.25"/>
          <stop offset="70%" stop-color="white" stop-opacity="0"/>
          <stop offset="100%" stop-color="black" stop-opacity="0.2"/>
        </radialGradient>
        <radialGradient id="sfh-${uid}" cx="45%" cy="40%" r="50%">
          <stop offset="0%" stop-color="white" stop-opacity="0.08"/>
          <stop offset="100%" stop-color="black" stop-opacity="0.05"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="47" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>
      <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="3"/>
      <circle cx="50" cy="50" r="42" class="spool-flange"/>
      <circle cx="50" cy="50" r="42" fill="url(#sfh-${uid})"/>
      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>
      ${notches}
      <circle cx="50" cy="50" r="${filR.toFixed(1)}" fill="${c}" class="spool-filament"/>
      <circle cx="50" cy="50" r="${filR.toFixed(1)}" fill="url(#sfg-${uid})"/>
      ${windings}
      <circle cx="50" cy="50" r="${hubR}" class="spool-hub"/>
      <circle cx="50" cy="50" r="${hubR}" fill="url(#sfh-${uid})"/>
      ${spokes}
      <circle cx="50" cy="50" r="5" class="spool-hole"/>
    </svg></span>`;
  };
  /**
   * Global real-time filament calculation.
   * Returns { current, currentG, afterPrint, afterPrintG, usedG, totalPrintG, totalG, isPrinting }
   * - current/currentG: real-time remaining right now (consumed so far subtracted)
   * - afterPrint/afterPrintG: estimated remaining when print finishes
   * @param {object} opts - { remainG, totalG, isActive, data }
   */
  window.realtimeFilament = function(opts) {
    const { remainG, totalG, isActive, data } = opts;
    if (!totalG || totalG <= 0 || remainG == null) {
      return { current: 0, currentG: 0, afterPrint: null, afterPrintG: null, usedG: 0, totalPrintG: 0, totalG: totalG || 0, isPrinting: false };
    }
    const basePct = Math.max(0, Math.round((remainG / totalG) * 100));

    if (isActive && data) {
      const gcodeState = data.gcode_state || 'IDLE';
      const isPrinting = gcodeState === 'RUNNING' || gcodeState === 'PAUSE';
      const est = window._printEstimates;
      if (isPrinting && est && est.weight_g > 0) {
        const pct = data.mc_percent || 0;
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
    return { current: basePct, currentG: Math.round(remainG), afterPrint: null, afterPrintG: null, usedG: 0, totalPrintG: 0, totalG: Math.round(totalG), isPrinting: false };
  };
})();
