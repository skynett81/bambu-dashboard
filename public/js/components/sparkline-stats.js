// Grafana-style Sparkline Stats Strip
(function() {
  const BUFFER_SIZE = 60;
  const SPARK_W = 120;
  const SPARK_H = 30;

  // Rolling data buffers per metric
  const buffers = {
    nozzle_temp: [],
    bed_temp: [],
    chamber_temp: [],
    fan_part: [],
    speed_mag: [],
    layer_pct: [],
    mcu_temp: [],
    humidity: []
  };

  function pushValue(key, val) {
    if (val == null || isNaN(val)) return;
    const buf = buffers[key];
    if (!buf) return;
    buf.push(val);
    if (buf.length > BUFFER_SIZE) buf.shift();
  }

  // SVG mini-chart with gradient fill + polyline + pulsing live dot
  function renderSparkSVG(key, color) {
    const buf = buffers[key];
    if (!buf || buf.length < 2) {
      return `<svg viewBox="0 0 ${SPARK_W} ${SPARK_H}" class="spark-svg" preserveAspectRatio="none">
        <line x1="0" y1="${SPARK_H - 1}" x2="${SPARK_W}" y2="${SPARK_H - 1}" stroke="${color}" stroke-width="0.5" opacity="0.2"/>
      </svg>`;
    }

    let min = Infinity, max = -Infinity;
    for (const v of buf) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const range = Math.max(max - min, 1);
    const padMin = min - range * 0.15;
    const padMax = max + range * 0.15;
    const padRange = padMax - padMin;

    const points = [];
    for (let i = 0; i < buf.length; i++) {
      const x = (i / (buf.length - 1)) * SPARK_W;
      const y = SPARK_H - ((buf[i] - padMin) / padRange) * (SPARK_H - 2) - 1;
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    const lastPt = points[points.length - 1].split(',');
    const polyStr = points.join(' ');
    const areaStr = polyStr + ` ${SPARK_W},${SPARK_H} 0,${SPARK_H}`;

    return `<svg viewBox="0 0 ${SPARK_W} ${SPARK_H}" class="spark-svg" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sg-${key}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      <polygon points="${areaStr}" fill="url(#sg-${key})"/>
      <polyline points="${polyStr}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${lastPt[0]}" cy="${lastPt[1]}" r="2" fill="${color}">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite"/>
      </circle>
    </svg>`;
  }

  // Panel configurations
  const PANELS = [
    {
      id: 'spark-nozzle',
      key: 'nozzle_temp',
      color: '#ff5252',
      extract: d => d.nozzle_temper ?? d.nozzle_temp,
      format: (v, d) => {
        const tgt = d.nozzle_target_temper ?? d.nozzle_target;
        return tgt > 0 ? `${Math.round(v)}/${tgt}°` : `${Math.round(v)}°`;
      },
      valColor: v => v > 180 ? '#ff5252' : v > 80 ? '#f0883e' : v > 40 ? '#00e676' : ''
    },
    {
      id: 'spark-bed',
      key: 'bed_temp',
      color: '#1279ff',
      extract: d => d.bed_temper ?? d.bed_temp,
      format: (v, d) => {
        const tgt = d.bed_target_temper ?? d.bed_target;
        return tgt > 0 ? `${Math.round(v)}/${tgt}°` : `${Math.round(v)}°`;
      },
      valColor: v => v > 80 ? '#f0883e' : v > 35 ? '#1279ff' : ''
    },
    {
      id: 'spark-chamber',
      key: 'chamber_temp',
      color: '#e3b341',
      extract: d => d.chamber_temper ?? d.chamber_temp,
      format: v => `${Math.round(v)}°`,
      valColor: v => v > 45 ? '#f0883e' : v > 25 ? '#e3b341' : ''
    },
    {
      id: 'spark-fan',
      key: 'fan_part',
      color: '#00e676',
      extract: d => { const v = parseInt(d.cooling_fan_speed) || 0; return v === 0 ? 0 : Math.min(100, Math.round((v / (v > 15 ? 255 : 15)) * 100)); },
      format: v => `${Math.round(v)}%`,
      valColor: v => v > 0 ? '#00e676' : ''
    },
    {
      id: 'spark-speed',
      key: 'speed_mag',
      color: '#9b4dff',
      extract: d => d.spd_mag,
      format: v => `${Math.round(v)}%`,
      valColor: () => '#9b4dff'
    },
    {
      id: 'spark-layer',
      key: 'layer_pct',
      color: '#00e676',
      extract: d => d.total_layer_num > 0 ? ((d.layer_num || 0) / d.total_layer_num) * 100 : 0,
      format: (v, d) => {
        const total = d.total_layer_num;
        return total > 0 ? `${d.layer_num || 0}/${total}` : '--';
      },
      valColor: () => '#00e676'
    },
    {
      id: 'spark-mcu',
      key: 'mcu_temp',
      color: '#ff9800',
      extract: d => d._system_temps?.mcu_temp?.temp ?? d._system_temps?.raspberry_pi?.temp,
      format: v => v != null ? `${Math.round(v)}°` : '--',
      valColor: v => v > 70 ? '#ff5252' : v > 55 ? '#ff9800' : ''
    },
    {
      id: 'spark-humidity',
      key: 'humidity',
      color: '#29b6f6',
      extract: d => d._ams_humidity?.[0]?.humidity ?? d.ams?.ams?.[0]?.humidity,
      format: v => v != null ? `${Math.round(v)}%` : '--',
      valColor: v => v > 60 ? '#ff5252' : v > 40 ? '#ff9800' : v > 0 ? '#29b6f6' : ''
    }
  ];

  window.updateSparklineStats = function(data) {
    for (const p of PANELS) {
      const raw = p.extract(data);
      pushValue(p.key, raw);

      const el = document.getElementById(p.id);
      if (!el) continue;

      // Update value
      const valEl = el.querySelector('.spark-value');
      if (valEl && raw != null) {
        const txt = p.format(raw, data);
        const old = valEl.textContent;
        valEl.textContent = txt;
        const c = p.valColor(raw);
        if (c) valEl.style.color = c;

        // Flash on change with direction indicator
        if (old !== txt && old !== '--') {
          valEl.classList.remove('spark-flash', 'ix-value-up', 'ix-value-down');
          void valEl.offsetWidth;
          valEl.classList.add('spark-flash');
          // Direction animation — compare numeric values
          const oldNum = parseFloat(old);
          const newNum = parseFloat(txt);
          if (!isNaN(oldNum) && !isNaN(newNum) && oldNum !== newNum) {
            valEl.classList.add(newNum > oldNum ? 'ix-value-up' : 'ix-value-down');
          }
        }
      }

      // Update sparkline
      const chart = el.querySelector('.spark-chart');
      if (chart) {
        chart.innerHTML = renderSparkSVG(p.key, p.color);
      }
    }
  };

  window.resetSparklineBuffers = function() {
    for (const key of Object.keys(buffers)) {
      buffers[key] = [];
    }
    // Clear chart visuals
    for (const p of PANELS) {
      const el = document.getElementById(p.id);
      if (!el) continue;
      const valEl = el.querySelector('.spark-value');
      if (valEl) { valEl.textContent = '--'; valEl.style.color = ''; }
      const chart = el.querySelector('.spark-chart');
      if (chart) chart.innerHTML = '';
    }
  };
})();
