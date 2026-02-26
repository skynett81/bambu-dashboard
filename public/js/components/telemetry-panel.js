// Telemetry Panel - Time-series charts for temperature, fans, speed, progress
(function() {
  window.loadTelemetryPanel = loadTelemetry;

  let currentRange = '1h';
  let _selectedTelePrinter = null;

  window.changeTelePrinter = function(value) {
    _selectedTelePrinter = value || null;
    loadTelemetry();
  };

  const RANGE_MAP = {
    '1h':  { ms: 3600000,    resolution: '30s' },
    '6h':  { ms: 21600000,   resolution: '5m' },
    '24h': { ms: 86400000,   resolution: '15m' },
    '7d':  { ms: 604800000,  resolution: '1h' }
  };

  async function loadTelemetry() {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;

    const printerId = _selectedTelePrinter || window.printerState.getActivePrinterId();
    _selectedTelePrinter = printerId;
    if (!printerId) {
      panel.innerHTML = `<p class="text-muted">${t('telemetry.no_printer')}</p>`;
      return;
    }

    const range = RANGE_MAP[currentRange];
    const from = new Date(Date.now() - range.ms).toISOString();
    const to = new Date().toISOString();

    try {
      const res = await fetch(`/api/telemetry?printer_id=${printerId}&from=${from}&to=${to}&resolution=${range.resolution}`);
      const data = await res.json();

      let html = buildPrinterSelector('changeTelePrinter', _selectedTelePrinter, false);

      // Time range selector
      html += '<div class="telemetry-range-selector">';
      for (const key of Object.keys(RANGE_MAP)) {
        const active = key === currentRange ? 'active' : '';
        html += `<button class="speed-btn ${active}" onclick="setTelemetryRange('${key}')">${key}</button>`;
      }
      html += '</div>';

      if (!data || data.length === 0) {
        html += `<p class="text-muted mt-md">${t('telemetry.no_data')}</p>`;
        panel.innerHTML = html;
        return;
      }

      // Temperature chart
      html += `<div class="mt-md"><div class="card-title">${t('telemetry.temperatures')}</div>`;
      html += renderChart(data,
        ['nozzle_temp', 'bed_temp', 'chamber_temp'],
        { nozzle_temp: '#f85149', bed_temp: '#58a6ff', chamber_temp: '#e3b341' },
        { nozzle_temp: t('temperature.nozzle'), bed_temp: t('temperature.bed'), chamber_temp: t('temperature.chamber') }
      );
      html += '</div>';

      // Fan speed chart
      html += `<div class="mt-md"><div class="card-title">${t('telemetry.fan_speeds')}</div>`;
      html += renderChart(data,
        ['fan_cooling', 'fan_aux', 'fan_chamber', 'fan_heatbreak'],
        { fan_cooling: '#00e676', fan_aux: '#f0883e', fan_chamber: '#58a6ff', fan_heatbreak: '#bc8cff' },
        { fan_cooling: t('fans.part'), fan_aux: t('fans.aux'), fan_chamber: t('fans.chamber'), fan_heatbreak: t('telemetry.heatbreak') },
        255
      );
      html += '</div>';

      // Speed magnitude
      html += `<div class="mt-md"><div class="card-title">${t('telemetry.speed_mag')}</div>`;
      html += renderChart(data,
        ['speed_mag'],
        { speed_mag: '#e3b341' },
        { speed_mag: t('speed.label') },
        200
      );
      html += '</div>';

      // Print progress
      html += `<div class="mt-md"><div class="card-title">${t('telemetry.print_progress')}</div>`;
      html += renderChart(data,
        ['print_progress'],
        { print_progress: '#00e676' },
        { print_progress: '%' },
        100
      );
      html += '</div>';

      panel.innerHTML = html;
    } catch (e) {
      panel.innerHTML = `<p class="text-muted">${t('telemetry.load_failed')}</p>`;
    }
  }

  function renderChart(data, keys, colors, labels, maxVal) {
    const W = 800, H = 180, PAD_L = 45, PAD_R = 10, PAD_T = 10, PAD_B = 25;
    const plotW = W - PAD_L - PAD_R;
    const plotH = H - PAD_T - PAD_B;

    if (!maxVal) {
      maxVal = 0;
      for (const d of data) {
        for (const k of keys) {
          if ((d[k] || 0) > maxVal) maxVal = d[k];
        }
      }
      maxVal = Math.ceil(maxVal / 10) * 10 || 100;
    }

    let svg = `<svg viewBox="0 0 ${W} ${H}" class="telemetry-chart" preserveAspectRatio="none">`;

    // Grid lines + labels
    for (let i = 0; i <= 4; i++) {
      const y = PAD_T + (plotH / 4) * i;
      const val = Math.round(maxVal - (maxVal / 4) * i);
      svg += `<line x1="${PAD_L}" y1="${y}" x2="${W - PAD_R}" y2="${y}" stroke="#21262d" stroke-width="1"/>`;
      svg += `<text x="${PAD_L - 5}" y="${y + 4}" text-anchor="end" fill="#8b949e" font-size="10">${val}</text>`;
    }

    // Time labels
    if (data.length > 1) {
      const step = Math.max(1, Math.floor(data.length / 6));
      for (let i = 0; i < data.length; i += step) {
        const x = PAD_L + (i / (data.length - 1)) * plotW;
        const time = data[i].time_bucket || '';
        const label = time.includes(' ') ? time.split(' ')[1].substring(0, 5) : time.substring(11, 16);
        svg += `<text x="${x}" y="${H - 4}" text-anchor="middle" fill="#8b949e" font-size="9">${label}</text>`;
      }
    }

    // Data lines
    for (const key of keys) {
      const points = [];
      for (let i = 0; i < data.length; i++) {
        const x = PAD_L + (i / Math.max(data.length - 1, 1)) * plotW;
        const y = PAD_T + plotH - ((data[i][key] || 0) / maxVal) * plotH;
        points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      svg += `<polyline points="${points.join(' ')}" fill="none" stroke="${colors[key]}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>`;
    }

    svg += '</svg>';

    // Legend
    svg += '<div class="chart-legend mt-sm">';
    for (const key of keys) {
      svg += `<span class="legend-item"><span class="legend-dot" style="background:${colors[key]}"></span> ${labels[key]}</span>`;
    }
    svg += '</div>';

    return svg;
  }

  window.setTelemetryRange = function(range) {
    currentRange = range;
    loadTelemetry();
  };
})();
