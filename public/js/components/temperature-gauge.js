// SVG Arc Temperature Gauges - Supports dual-nozzle (H2D) and toolchanger (H2C)
(function() {
  const GAUGES_STANDARD = {
    'gauge-nozzle': { max: 300, key: 'nozzle_temper', targetKey: 'nozzle_target_temper', label: 'temperature.nozzle' },
    'gauge-bed': { max: 120, key: 'bed_temper', targetKey: 'bed_target_temper', label: 'temperature.bed' },
    'gauge-chamber': { max: 60, key: 'chamber_temper', targetKey: null, label: 'temperature.chamber' }
  };

  const GAUGES_DUAL = {
    'gauge-nozzle': { max: 350, key: 'nozzle_temper', targetKey: 'nozzle_target_temper', label: 'temperature.nozzle_l' },
    'gauge-nozzle-r': { max: 350, key: 'nozzle_temper_2', targetKey: 'nozzle_target_temper_2', label: 'temperature.nozzle_r' },
    'gauge-bed': { max: 120, key: 'bed_temper', targetKey: 'bed_target_temper', label: 'temperature.bed' },
    'gauge-chamber': { max: 65, key: 'chamber_temper', targetKey: null, label: 'temperature.chamber' }
  };

  let currentMode = 'standard';

  const ARC_START = 135;
  const ARC_END = 405;
  const ARC_RANGE = ARC_END - ARC_START;
  const RADIUS = 44;
  const CX = 60, CY = 60;

  function polarToCartesian(cx, cy, r, angleDeg) {
    const rad = (angleDeg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function describeArc(cx, cy, r, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
  }

  function tempColor(ratio) {
    if (ratio < 0.3) return '#58a6ff';
    if (ratio < 0.6) return '#00e676';
    if (ratio < 0.85) return '#f0883e';
    return '#f85149';
  }

  function initGauge(id) {
    const svg = document.getElementById(id);
    if (!svg) return;

    svg.innerHTML = `
      <path class="gauge-bg" d="${describeArc(CX, CY, RADIUS, ARC_START, ARC_END)}"
            fill="none" stroke="#21262d" stroke-width="8" stroke-linecap="round"/>
      <path class="gauge-fill" id="${id}-fill" d="${describeArc(CX, CY, RADIUS, ARC_START, ARC_START)}"
            fill="none" stroke="#00e676" stroke-width="8" stroke-linecap="round"/>
      <text x="${CX}" y="${CY - 4}" text-anchor="middle" fill="#e6edf3"
            font-size="18" font-weight="600" id="${id}-value">--</text>
      <text x="${CX}" y="${CY + 14}" text-anchor="middle" fill="#8b949e"
            font-size="10" id="${id}-target"></text>
    `;
  }

  function updateGauge(id, current, target, maxTemp) {
    const fillEl = document.getElementById(`${id}-fill`);
    const valueEl = document.getElementById(`${id}-value`);
    const targetEl = document.getElementById(`${id}-target`);
    if (!fillEl) return;

    const ratio = Math.min(Math.max(current / maxTemp, 0), 1);
    const endAngle = ARC_START + ARC_RANGE * ratio;
    const color = tempColor(ratio);

    fillEl.setAttribute('d', describeArc(CX, CY, RADIUS, ARC_START, endAngle));
    fillEl.setAttribute('stroke', color);
    valueEl.textContent = `${Math.round(current * 10) / 10}°`;

    if (target && target > 0) {
      targetEl.textContent = t('temperature.target', { temp: Math.round(target) + '°' });
    } else {
      targetEl.textContent = '';
    }
  }

  function setupDualNozzle() {
    if (currentMode === 'dual') return;
    currentMode = 'dual';

    const container = document.querySelector('.temp-gauges');
    if (!container) return;

    // Check if right nozzle gauge already exists
    if (!document.getElementById('gauge-nozzle-r')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'gauge-wrapper';
      wrapper.innerHTML = `
        <svg class="gauge-svg" viewBox="0 0 120 120" id="gauge-nozzle-r"></svg>
        <div class="gauge-label" data-i18n-key="temperature.nozzle_r">${t('temperature.nozzle_r')}</div>
      `;
      // Insert after first gauge (nozzle L)
      const firstWrapper = container.children[0];
      if (firstWrapper?.nextSibling) {
        container.insertBefore(wrapper, firstWrapper.nextSibling);
      } else {
        container.appendChild(wrapper);
      }
      initGauge('gauge-nozzle-r');
    }

    // Update left nozzle label
    const leftLabel = container.children[0]?.querySelector('.gauge-label');
    if (leftLabel) leftLabel.textContent = t('temperature.nozzle_l');
  }

  function setupStandard() {
    if (currentMode === 'standard') return;
    currentMode = 'standard';

    // Remove right nozzle gauge if exists
    const rightGauge = document.getElementById('gauge-nozzle-r');
    if (rightGauge) {
      rightGauge.closest('.gauge-wrapper')?.remove();
    }

    // Restore left nozzle label
    const container = document.querySelector('.temp-gauges');
    const leftLabel = container?.children[0]?.querySelector('.gauge-label');
    if (leftLabel) leftLabel.textContent = t('temperature.nozzle');
  }

  // Initialize all gauges on load
  document.addEventListener('DOMContentLoaded', () => {
    for (const id of Object.keys(GAUGES_STANDARD)) {
      initGauge(id);
    }
  });

  // Global update function
  window.updateTemperatureGauges = function(data) {
    // Detect if dual-nozzle printer
    const meta = window.printerState.getActivePrinterMeta();
    const dual = typeof isDualNozzle === 'function' && isDualNozzle(meta?.model);

    if (dual) {
      setupDualNozzle();
      for (const [id, cfg] of Object.entries(GAUGES_DUAL)) {
        const current = data[cfg.key];
        const target = cfg.targetKey ? data[cfg.targetKey] : null;
        if (current != null) {
          updateGauge(id, current, target, cfg.max);
        }
      }
    } else {
      setupStandard();
      for (const [id, cfg] of Object.entries(GAUGES_STANDARD)) {
        const current = data[cfg.key];
        const target = cfg.targetKey ? data[cfg.targetKey] : null;
        if (current != null) {
          updateGauge(id, current, target, cfg.max);
        }
      }
    }
  };
})();
