// SVG Arc Temperature Gauges - Supports dual-nozzle (H2D) and toolchanger (H2C)
// Includes trend indicators (rising/falling/stable) and session min/max tracking
(function() {
  const GAUGES_STANDARD = {
    'gauge-nozzle': { max: 300, key: 'nozzle_temper', targetKey: 'nozzle_target_temper', label: 'temperature.nozzle' },
    'gauge-bed': { max: 120, key: 'bed_temper', targetKey: 'bed_target_temper', label: 'temperature.bed' },
    'gauge-chamber': { max: 60, key: 'chamber_temper', targetKey: '_chamber_target', label: 'temperature.chamber' }
  };

  const GAUGES_DUAL = {
    'gauge-nozzle': { max: 350, key: 'nozzle_temper', targetKey: 'nozzle_target_temper', label: 'temperature.nozzle_l' },
    'gauge-nozzle-r': { max: 350, key: 'nozzle_temper_2', targetKey: 'nozzle_target_temper_2', label: 'temperature.nozzle_r' },
    'gauge-bed': { max: 120, key: 'bed_temper', targetKey: 'bed_target_temper', label: 'temperature.bed' },
    'gauge-chamber': { max: 65, key: 'chamber_temper', targetKey: '_chamber_target', label: 'temperature.chamber' }
  };

  let currentMode = 'standard';

  const ARC_START = 135;
  const ARC_END = 405;
  const ARC_RANGE = ARC_END - ARC_START;
  const RADIUS = 44;
  const CX = 60, CY = 60;

  // Trend + min/max tracking per gauge per printer
  const _history = {}; // key: `${printerId}:${gaugeId}` → { samples: [{t, v}], min, max }
  const TREND_THRESHOLD = 1.5; // °C change to count as rising/falling
  const TREND_WINDOW = 5; // number of recent samples to compare

  function _getTracker(gaugeId) {
    const pid = window.printerState?.getActivePrinterId() || '_';
    const key = `${pid}:${gaugeId}`;
    if (!_history[key]) _history[key] = { samples: [], min: Infinity, max: -Infinity };
    return _history[key];
  }

  function _recordSample(gaugeId, temp) {
    const tracker = _getTracker(gaugeId);
    const now = Date.now();
    tracker.samples.push({ t: now, v: temp });
    // Keep last 30 samples
    if (tracker.samples.length > 30) tracker.samples.shift();
    // Update min/max (ignore 0 for nozzle/bed — printer idle)
    if (temp > 5) {
      if (temp < tracker.min) tracker.min = temp;
      if (temp > tracker.max) tracker.max = temp;
    }
  }

  function _getTrend(gaugeId) {
    const tracker = _getTracker(gaugeId);
    const s = tracker.samples;
    if (s.length < 3) return 'stable';
    const recent = s.slice(-TREND_WINDOW);
    const oldest = recent[0].v;
    const newest = recent[recent.length - 1].v;
    const diff = newest - oldest;
    if (diff > TREND_THRESHOLD) return 'rising';
    if (diff < -TREND_THRESHOLD) return 'falling';
    return 'stable';
  }

  function _getMinMax(gaugeId) {
    const tracker = _getTracker(gaugeId);
    if (tracker.min === Infinity) return null;
    return { min: tracker.min, max: tracker.max };
  }

  // Reset min/max when printer changes
  window.addEventListener('printerChanged', () => {
    // Don't clear — each printer has its own key
  });

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
    if (ratio < 0.3) return '#1279ff';
    if (ratio < 0.6) return '#00e676';
    if (ratio < 0.85) return '#f0883e';
    return '#ff5252';
  }

  // Trend arrow SVG paths (small, positioned right of temperature value)
  function trendSvg(trend, color) {
    if (trend === 'rising') {
      return `<path id="__trend__" d="M 82 48 l 5 -8 l 5 8" fill="none" stroke="#00e676" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    if (trend === 'falling') {
      return `<path id="__trend__" d="M 82 42 l 5 8 l 5 -8" fill="none" stroke="#1279ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    return '';
  }

  function initGauge(id) {
    const svg = document.getElementById(id);
    if (!svg) return;

    svg.innerHTML = `
      <path class="gauge-bg" d="${describeArc(CX, CY, RADIUS, ARC_START, ARC_END)}"
            fill="none" stroke="${theme.getCSSVar('--bg-tertiary')}" stroke-width="8" stroke-linecap="round"/>
      <path class="gauge-fill" id="${id}-fill" d="${describeArc(CX, CY, RADIUS, ARC_START, ARC_START)}"
            fill="none" stroke="#00e676" stroke-width="8" stroke-linecap="round"/>
      <text x="${CX}" y="${CY - 4}" text-anchor="middle" fill="${theme.getCSSVar('--text-primary')}"
            font-size="18" font-weight="600" id="${id}-value">--</text>
      <text x="${CX}" y="${CY + 14}" text-anchor="middle" fill="${theme.getCSSVar('--text-secondary')}"
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

    // Add danger class for high temperatures (ratio > 0.85)
    const wrapper = fillEl.closest('.gauge-wrapper') || document.getElementById(id)?.closest('.gauge-wrapper');
    if (wrapper) {
      wrapper.classList.toggle('gauge-danger', ratio > 0.85);
    }

    if (target && target > 0) {
      targetEl.textContent = t('temperature.target', { temp: Math.round(target) + '°' });
    } else {
      targetEl.textContent = '';
    }

    // Record sample and update trend arrow
    _recordSample(id, current);
    const trend = _getTrend(id);
    const svg = document.getElementById(id);
    if (svg) {
      const existing = svg.querySelector('#__trend__');
      if (existing) existing.remove();
      if (trend !== 'stable') {
        svg.insertAdjacentHTML('beforeend', trendSvg(trend, color));
      }
    }

    // Update min/max display under label
    const mm = _getMinMax(id);
    if (wrapper && mm) {
      let mmEl = wrapper.querySelector('.gauge-minmax');
      if (!mmEl) {
        mmEl = document.createElement('div');
        mmEl.className = 'gauge-minmax';
        wrapper.appendChild(mmEl);
      }
      mmEl.textContent = `${Math.round(mm.min * 10) / 10}° — ${Math.round(mm.max * 10) / 10}°`;
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

    const gauges = dual ? GAUGES_DUAL : GAUGES_STANDARD;
    if (dual) setupDualNozzle(); else setupStandard();

    for (const [id, cfg] of Object.entries(gauges)) {
      const current = data[cfg.key];
      const target = cfg.targetKey ? data[cfg.targetKey] : null;
      if (current != null) {
        updateGauge(id, current, target, cfg.max);
      }
    }

    // Hide chamber gauge if printer doesn't report chamber_temper
    const chamberSvg = document.getElementById('gauge-chamber');
    if (chamberSvg) {
      const wrapper = chamberSvg.closest('.gauge-wrapper');
      if (wrapper) {
        wrapper.style.display = (data.chamber_temper != null) ? '' : 'none';
      }
    }

    // Hide chamber sparkline if no data
    const sparkChamber = document.getElementById('spark-chamber');
    if (sparkChamber) {
      sparkChamber.style.display = (data.chamber_temper != null) ? '' : 'none';
    }

    // System temperatures (MCU/RPi) — show as small badges below gauges
    if (data._system_temps) {
      let sysContainer = document.getElementById('system-temps-badges');
      if (!sysContainer) {
        const tempCard = document.getElementById('temp-card')?.querySelector('.card-body');
        if (tempCard) {
          sysContainer = document.createElement('div');
          sysContainer.id = 'system-temps-badges';
          sysContainer.style.cssText = 'display:flex;gap:6px;margin-top:4px;flex-wrap:wrap';
          tempCard.appendChild(sysContainer);
        }
      }
      if (sysContainer) {
        let badges = '';
        for (const [key, val] of Object.entries(data._system_temps)) {
          const label = key === 'mcu_temp' ? 'MCU' : key === 'raspberry_pi' ? 'Host' : key;
          const color = val.temp > 70 ? 'var(--accent-red)' : val.temp > 55 ? 'var(--accent-orange)' : 'var(--text-muted)';
          badges += `<span style="font-size:0.6rem;color:${color}">${label}: ${val.temp}°C</span>`;
        }
        sysContainer.innerHTML = badges;
      }
    }
  };

  // Allow external reset of min/max (e.g., on print start)
  window.resetTempMinMax = function() {
    const pid = window.printerState?.getActivePrinterId() || '_';
    for (const key of Object.keys(_history)) {
      if (key.startsWith(pid + ':')) {
        _history[key].min = Infinity;
        _history[key].max = -Infinity;
      }
    }
  };
})();
