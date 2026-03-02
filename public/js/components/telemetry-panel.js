// Telemetry Panel — Modular with Tabs and Drag-and-Drop
(function() {

  // ═══ State ═══
  let currentRange = '1h';
  let _selectedTelePrinter = null;
  let _activeTab = 'overview';
  let _locked = localStorage.getItem('tele-layout-locked') !== '0';
  let _draggedMod = null;
  let _data = [];
  let _printerId = null;

  const RANGE_MAP = {
    '1h':  { ms: 3600000,    resolution: '30s' },
    '6h':  { ms: 21600000,   resolution: '5m' },
    '24h': { ms: 86400000,   resolution: '15m' },
    '7d':  { ms: 604800000,  resolution: '1h' }
  };

  // ═══ Tab config ═══
  const TAB_CONFIG = {
    overview: { label: 'telemetry.tab_overview', modules: ['live-values', 'print-status', 'temperature-chart'] },
    fans:     { label: 'telemetry.tab_fans',     modules: ['fan-dashboard', 'fan-chart', 'speed-chart'] }
  };
  const MODULE_SIZE = {
    'live-values': 'full', 'print-status': 'full', 'temperature-chart': 'full',
    'fan-dashboard': 'full', 'fan-chart': 'half', 'speed-chart': 'half'
  };

  const STORAGE_PREFIX = 'tele-module-order-';
  const LOCK_KEY = 'tele-layout-locked';

  // Clear stale saved orders when module set changes
  const _MOD_VER = 2;
  if (localStorage.getItem('tele-mod-ver') !== String(_MOD_VER)) {
    for (const tab of Object.keys(TAB_CONFIG)) localStorage.removeItem(STORAGE_PREFIX + tab);
    localStorage.setItem('tele-mod-ver', String(_MOD_VER));
  }

  // ═══ Persistence ═══
  function getOrder(tabId) {
    try { const o = JSON.parse(localStorage.getItem(STORAGE_PREFIX + tabId)); if (Array.isArray(o)) return o; } catch (_) {}
    return TAB_CONFIG[tabId]?.modules || [];
  }
  function saveOrder(tabId) {
    const cont = document.getElementById(`tele-tab-${tabId}`);
    if (!cont) return;
    const ids = [...cont.querySelectorAll('.stats-module[data-module-id]')].map(m => m.dataset.moduleId);
    localStorage.setItem(STORAGE_PREFIX + tabId, JSON.stringify(ids));
  }

  // ═══ Helpers ═══
  function fanPct(raw) { return Math.round((parseInt(raw) || 0) / 255 * 100); }
  function fmtRemain(mins) {
    if (!mins || mins <= 0) return '--';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}${t('time.h')} ${m}${t('time.m')}` : `${m}${t('time.m')}`;
  }

  function heroCard(icon, value, label, sub, color) {
    return `<div class="tele-hero-card">
      <div class="tele-hero-icon" style="background:${color}15;color:${color}">${icon}</div>
      <div class="tele-hero-value" style="color:${color}">${value}</div>
      <div class="tele-hero-label">${label}</div>
      ${sub ? `<div class="tele-hero-sub">${sub}</div>` : ''}
    </div>`;
  }

  // ═══ Module builders ═══
  const BUILDERS = {
    'live-values': () => {
      const ps = window.printerState?._printers?.[_printerId];
      if (!ps) return `<div class="text-muted" style="font-size:0.8rem">${t('telemetry.no_data')}</div>`;
      const pd = ps.print || ps;

      const nozzle = Math.round(pd.nozzle_temper || 0);
      const bed = Math.round(pd.bed_temper || 0);
      const chamber = Math.round(pd.chamber_temper || 0);
      const nozzleTarget = Math.round(pd.nozzle_target_temper || pd.nozzle_temper_target || 0);
      const bedTarget = Math.round(pd.bed_target_temper || pd.bed_temper_target || 0);
      const progress = pd.mc_percent || 0;
      const spdMag = pd.spd_mag || 100;
      const wifiVal = pd.wifi_signal;
      const wifiStr = wifiVal ? `${wifiVal}dBm` : '--';

      return `<div class="tele-hero-grid">
        ${heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>', `${nozzle}°C`, t('temperature.nozzle'), nozzleTarget > 0 ? `→ ${nozzleTarget}°C` : '', '#ff5252')}
        ${heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/></svg>', `${bed}°C`, t('temperature.bed'), bedTarget > 0 ? `→ ${bedTarget}°C` : '', '#1279ff')}
        ${heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>', `${chamber}°C`, t('temperature.chamber'), '', '#e3b341')}
        ${heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>', `${progress}%`, t('telemetry.print_progress'), '', '#00e676')}
        ${heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>', `${spdMag}%`, t('speed.label'), '', '#f0883e')}
        ${heroCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0114 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><circle cx="12" cy="20" r="1"/></svg>', wifiStr, 'WiFi', '', '#9b4dff')}
      </div>`;
    },

    'print-status': () => {
      const ps = window.printerState?._printers?.[_printerId];
      if (!ps) return '';
      const pd = ps.print || ps;
      const state = pd.gcode_state || 'IDLE';
      const progress = pd.mc_percent || 0;
      const fileName = pd.gcode_file || pd.subtask_name || '';
      const remaining = pd.mc_remaining_time;
      const layer = pd.layer_num || 0;
      const totalLayers = pd.total_layer_num || 0;
      const isActive = state === 'RUNNING' || state === 'PAUSE';
      const barColor = state === 'PAUSE' ? '#f0883e' : '#00e676';

      const stateMap = { RUNNING: t('status.printing'), PAUSE: t('status.paused'), FINISH: t('status.finished'), FAILED: t('status.failed') };
      const stateLabel = stateMap[state] || t('status.idle');
      const stateIcon = state === 'RUNNING'
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5,3 19,12 5,21"/></svg>'
        : state === 'PAUSE'
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';

      let h = `<div class="tele-status-row">
        <div class="tele-status-left">
          <div class="tele-status-header">
            <span class="tele-status-icon" style="color:${barColor}">${stateIcon}</span>
            <span class="tele-status-state" style="color:${barColor}">${stateLabel}</span>
            <span class="tele-status-pct">${isActive ? progress + '%' : ''}</span>
          </div>
          <div class="tele-progress-bar"><div class="tele-progress-fill" style="width:${progress}%;background:${barColor}"></div></div>
          ${fileName ? `<div class="tele-status-file" title="${fileName}">${fileName.replace(/\.gcode$|\.3mf$/i, '')}</div>` : ''}
        </div>
        <div class="tele-status-right">`;
      if (isActive && remaining) h += `<div class="tele-status-detail"><span class="tele-status-dlabel">${t('status.remaining')}</span><span class="tele-status-dvalue">${fmtRemain(remaining)}</span></div>`;
      if (layer > 0) h += `<div class="tele-status-detail"><span class="tele-status-dlabel">${t('status.layers')}</span><span class="tele-status-dvalue">${layer} / ${totalLayers || '?'}</span></div>`;
      const spdLvl = pd.spd_lvl || 2;
      const spdLabels = { 1: t('speed.silent'), 2: t('speed.standard'), 3: t('speed.sport'), 4: t('speed.ludicrous') };
      h += `<div class="tele-status-detail"><span class="tele-status-dlabel">${t('speed.label')}</span><span class="tele-status-dvalue">${spdLabels[spdLvl] || spdLabels[2]}</span></div>`;
      h += `</div></div>`;
      return h;
    },

    'temperature-chart': (data) => {
      let h = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>
        ${t('telemetry.temperatures')}
      </div>`;
      if (!data.length) { h += `<p class="text-muted" style="font-size:0.8rem">${t('telemetry.no_data')}</p>`; return h; }
      const ps = window.printerState?._printers?.[_printerId];
      const pd = ps?.print || ps;
      const targets = {
        nozzle_temp: pd?.nozzle_target_temper || pd?.nozzle_temper_target || 0,
        bed_temp: pd?.bed_target_temper || pd?.bed_temper_target || 0
      };
      h += renderChart(data,
        ['nozzle_temp', 'bed_temp', 'chamber_temp'],
        { nozzle_temp: '#ff5252', bed_temp: '#1279ff', chamber_temp: '#e3b341' },
        { nozzle_temp: t('temperature.nozzle'), bed_temp: t('temperature.bed'), chamber_temp: t('temperature.chamber') },
        null, targets
      );
      return h;
    },

    'fan-dashboard': () => {
      const ps = window.printerState?._printers?.[_printerId];
      if (!ps) return `<div class="text-muted" style="font-size:0.8rem">${t('telemetry.no_data')}</div>`;
      const pd = ps.print || ps;

      const fans = [
        { label: t('fans.part'), pct: fanPct(pd.cooling_fan_speed), color: '#00e676',
          icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>' },
        { label: t('fans.aux'), pct: fanPct(pd.big_fan1_speed), color: '#f0883e',
          icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>' },
        { label: t('fans.chamber'), pct: fanPct(pd.big_fan2_speed), color: '#1279ff',
          icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M12 8v8m-4-4h8"/></svg>' },
        { label: t('telemetry.heatbreak'), pct: fanPct(pd.heatbreak_fan_speed), color: '#9b4dff',
          icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>' }
      ];

      let h = '<div class="tele-fan-grid">';
      for (const f of fans) {
        h += `<div class="tele-fan-card">
          <div class="tele-hero-icon" style="background:${f.color}15;color:${f.color}">${f.icon}</div>
          <div class="tele-hero-value" style="color:${f.color}">${f.pct}%</div>
          <div class="tele-fan-bar"><div class="tele-fan-fill" style="width:${f.pct}%;background:${f.color}"></div></div>
          <div class="tele-hero-label">${f.label}</div>
        </div>`;
      }
      h += '</div>';
      return h;
    },

    'fan-chart': (data) => {
      let h = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4"/></svg>
        ${t('telemetry.fan_speeds')}
      </div>`;
      if (!data.length) { h += `<p class="text-muted" style="font-size:0.8rem">${t('telemetry.no_data')}</p>`; return h; }
      h += renderChart(data,
        ['fan_cooling', 'fan_aux', 'fan_chamber', 'fan_heatbreak'],
        { fan_cooling: '#00e676', fan_aux: '#f0883e', fan_chamber: '#1279ff', fan_heatbreak: '#9b4dff' },
        { fan_cooling: t('fans.part'), fan_aux: t('fans.aux'), fan_chamber: t('fans.chamber'), fan_heatbreak: t('telemetry.heatbreak') },
        255
      );
      return h;
    },

    'speed-chart': (data) => {
      let h = `<div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        ${t('telemetry.speed_mag')}
      </div>`;
      if (!data.length) { h += `<p class="text-muted" style="font-size:0.8rem">${t('telemetry.no_data')}</p>`; return h; }
      h += renderChart(data,
        ['speed_mag'],
        { speed_mag: '#e3b341' },
        { speed_mag: t('speed.label') },
        200
      );
      return h;
    }
  };

  // ═══ Chart rendering ═══
  function renderChart(data, keys, colors, labels, maxVal, targets) {
    const W = 800, H = 180, PAD_L = 45, PAD_R = 10, PAD_T = 10, PAD_B = 25;
    const plotW = W - PAD_L - PAD_R;
    const plotH = H - PAD_T - PAD_B;

    if (!maxVal) {
      maxVal = 0;
      for (const d of data) { for (const k of keys) { if ((d[k] || 0) > maxVal) maxVal = d[k]; } }
      if (targets) { for (const k of keys) { if (targets[k] > maxVal) maxVal = targets[k] * 1.1; } }
      maxVal = Math.ceil(maxVal / 10) * 10 || 100;
    }

    const chartId = 'tc-' + Math.random().toString(36).substr(2, 6);
    let svg = `<div class="telemetry-chart-wrap" id="${chartId}-wrap">`;
    svg += `<svg viewBox="0 0 ${W} ${H}" class="telemetry-chart" id="${chartId}" preserveAspectRatio="none">`;

    for (let i = 0; i <= 4; i++) {
      const y = PAD_T + (plotH / 4) * i;
      const val = Math.round(maxVal - (maxVal / 4) * i);
      svg += `<line x1="${PAD_L}" y1="${y}" x2="${W - PAD_R}" y2="${y}" stroke="${theme.getCSSVar('--bg-tertiary')}" stroke-width="1"/>`;
      svg += `<text x="${PAD_L - 5}" y="${y + 4}" text-anchor="end" fill="${theme.getCSSVar('--text-muted')}" font-size="10">${val}</text>`;
    }

    if (data.length > 1) {
      const step = Math.max(1, Math.floor(data.length / 6));
      for (let i = 0; i < data.length; i += step) {
        const x = PAD_L + (i / (data.length - 1)) * plotW;
        const time = data[i].time_bucket || '';
        const label = time.includes(' ') ? time.split(' ')[1].substring(0, 5) : time.substring(11, 16);
        svg += `<text x="${x}" y="${H - 4}" text-anchor="middle" fill="${theme.getCSSVar('--text-muted')}" font-size="9">${label}</text>`;
      }
    }

    if (targets) {
      for (const key of keys) {
        if (targets[key] && targets[key] > 0) {
          const y = PAD_T + plotH - (targets[key] / maxVal) * plotH;
          svg += `<line x1="${PAD_L}" y1="${y.toFixed(1)}" x2="${W - PAD_R}" y2="${y.toFixed(1)}" stroke="${colors[key]}" stroke-width="1" stroke-dasharray="6,4" opacity="0.5"/>`;
          svg += `<text x="${W - PAD_R + 2}" y="${y.toFixed(1) - (-4)}" fill="${colors[key]}" font-size="8" opacity="0.7">${targets[key]}°</text>`;
        }
      }
    }

    for (const key of keys) {
      const points = [];
      for (let i = 0; i < data.length; i++) {
        const x = PAD_L + (i / Math.max(data.length - 1, 1)) * plotW;
        const y = PAD_T + plotH - ((data[i][key] || 0) / maxVal) * plotH;
        points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      if (points.length > 1) {
        const lastX = PAD_L + ((data.length - 1) / Math.max(data.length - 1, 1)) * plotW;
        const bottomY = PAD_T + plotH;
        svg += `<polygon points="${points.join(' ')} ${lastX.toFixed(1)},${bottomY} ${PAD_L},${bottomY}" fill="${colors[key]}" opacity="0.06"/>`;
      }
    }

    for (const key of keys) {
      const points = [];
      for (let i = 0; i < data.length; i++) {
        const x = PAD_L + (i / Math.max(data.length - 1, 1)) * plotW;
        const y = PAD_T + plotH - ((data[i][key] || 0) / maxVal) * plotH;
        points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      svg += `<polyline points="${points.join(' ')}" fill="none" stroke="${colors[key]}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>`;
    }

    svg += `<line class="tele-hover-line" x1="0" y1="${PAD_T}" x2="0" y2="${PAD_T + plotH}" stroke="#999999" stroke-width="1" opacity="0" stroke-dasharray="3,3"/>`;
    svg += '</svg>';
    svg += `<div class="tele-tooltip" id="${chartId}-tip"></div>`;
    svg += '</div>';

    svg += '<div class="chart-legend mt-sm">';
    for (const key of keys) {
      const lastVal = data.length > 0 ? (data[data.length - 1][key] || 0) : 0;
      const dispVal = maxVal > 100 ? Math.round(lastVal) : Math.round(lastVal * 10) / 10;
      svg += `<span class="legend-item"><span class="legend-dot" style="background:${colors[key]}"></span> ${labels[key]} <span class="legend-val">${dispVal}</span></span>`;
    }
    svg += '</div>';

    setTimeout(() => {
      const wrap = document.getElementById(`${chartId}-wrap`);
      if (wrap) {
        wrap._chartData = data;
        wrap._chartKeys = keys;
        wrap._chartColors = colors;
        wrap._chartLabels = labels;
        wrap._chartMaxVal = maxVal;
        wrap._chartDims = { W, H, PAD_L, PAD_R, PAD_T, PAD_B, plotW, plotH };
        wrap.addEventListener('mousemove', handleChartHover);
        wrap.addEventListener('mouseleave', handleChartLeave);
      }
    }, 50);

    return svg;
  }

  function handleChartHover(e) {
    const wrap = e.currentTarget;
    const svg = wrap.querySelector('svg');
    const tip = wrap.querySelector('.tele-tooltip');
    const line = wrap.querySelector('.tele-hover-line');
    if (!svg || !tip || !wrap._chartData) return;

    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const pct = mouseX / rect.width;
    const d = wrap._chartDims;
    const svgX = pct * d.W;

    if (svgX < d.PAD_L || svgX > d.W - d.PAD_R) {
      tip.style.opacity = '0';
      line.setAttribute('opacity', '0');
      return;
    }

    const dataIdx = Math.round(((svgX - d.PAD_L) / d.plotW) * (wrap._chartData.length - 1));
    const clampedIdx = Math.max(0, Math.min(dataIdx, wrap._chartData.length - 1));
    const point = wrap._chartData[clampedIdx];

    const lineX = d.PAD_L + (clampedIdx / Math.max(wrap._chartData.length - 1, 1)) * d.plotW;
    line.setAttribute('x1', lineX.toFixed(1));
    line.setAttribute('x2', lineX.toFixed(1));
    line.setAttribute('opacity', '0.5');

    const time = point.time_bucket || '';
    const timeStr = time.includes(' ') ? time.split(' ')[1].substring(0, 5) : time.substring(11, 16);
    let tipHtml = `<div class="tele-tip-time">${timeStr}</div>`;
    for (const key of wrap._chartKeys) {
      const val = point[key] || 0;
      const dispVal = wrap._chartMaxVal > 100 ? Math.round(val) : Math.round(val * 10) / 10;
      tipHtml += `<div class="tele-tip-row"><span class="legend-dot" style="background:${wrap._chartColors[key]}"></span> ${wrap._chartLabels[key]}: <strong>${dispVal}</strong></div>`;
    }
    tip.innerHTML = tipHtml;
    tip.style.opacity = '1';
    const tipLeft = mouseX < rect.width / 2 ? mouseX + 12 : mouseX - tip.offsetWidth - 12;
    tip.style.left = tipLeft + 'px';
    tip.style.top = '10px';
  }

  function handleChartLeave(e) {
    const wrap = e.currentTarget;
    const tip = wrap.querySelector('.tele-tooltip');
    const line = wrap.querySelector('.tele-hover-line');
    if (tip) tip.style.opacity = '0';
    if (line) line.setAttribute('opacity', '0');
  }

  // ═══ Tab switching ═══
  function switchTab(tabId) {
    _activeTab = tabId;
    document.querySelectorAll('.tele-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
    document.querySelectorAll('.tele-tab-panel').forEach(p => {
      const isActive = p.id === `tele-tab-${tabId}`;
      p.classList.toggle('active', isActive);
      p.style.display = isActive ? 'grid' : 'none';
    });
    const slug = tabId === 'overview' ? 'telemetry' : `telemetry/${tabId}`;
    if (location.hash !== '#' + slug) history.replaceState(null, '', '#' + slug);
  }

  // ═══ Module Drag & Drop ═══
  function initModuleDrag(container, tabId) {
    container.addEventListener('dragstart', e => {
      const mod = e.target.closest('.stats-module');
      if (!mod || _locked) { e.preventDefault(); return; }
      _draggedMod = mod;
      mod.classList.add('stats-module-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');
    });
    container.addEventListener('dragover', e => {
      e.preventDefault();
      if (!_draggedMod || _locked) return;
      e.dataTransfer.dropEffect = 'move';
      const target = e.target.closest('.stats-module');
      if (target && target !== _draggedMod) {
        const rect = target.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (e.clientY < midY) container.insertBefore(_draggedMod, target);
        else container.insertBefore(_draggedMod, target.nextSibling);
      }
    });
    container.addEventListener('drop', e => {
      e.preventDefault();
      if (_draggedMod) { _draggedMod.classList.remove('stats-module-dragging'); saveOrder(tabId); _draggedMod = null; }
    });
    container.addEventListener('dragend', () => {
      if (_draggedMod) { _draggedMod.classList.remove('stats-module-dragging'); _draggedMod = null; }
    });
  }

  // ═══ Main render ═══
  async function loadTelemetry() {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;

    const hashParts = location.hash.replace('#', '').split('/');
    if (hashParts[0] === 'telemetry' && hashParts[1] && TAB_CONFIG[hashParts[1]]) {
      _activeTab = hashParts[1];
    }

    _printerId = _selectedTelePrinter || window.printerState.getActivePrinterId();
    _selectedTelePrinter = _printerId;

    if (!_printerId) {
      panel.innerHTML = `<div style="text-align:center;padding:3rem 1rem">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="margin-bottom:1rem"><rect x="6" y="2" width="12" height="8" rx="1"/><rect x="4" y="10" width="16" height="10" rx="1"/><circle cx="8" cy="15" r="1"/><line x1="12" y1="15" x2="18" y2="15"/></svg>
        <h3 style="margin:0 0 0.5rem;color:var(--text-primary)">${t('common.no_printers_title')}</h3>
        <p class="text-muted" style="margin:0 0 1rem">${t('common.no_printers_desc')}</p>
        <button class="btn btn-primary" onclick="location.hash='#settings'">${t('common.add_printer_btn')}</button>
      </div>`;
      return;
    }

    const range = RANGE_MAP[currentRange];
    const from = new Date(Date.now() - range.ms).toISOString();
    const to = new Date().toISOString();

    try {
      const res = await fetch(`/api/telemetry?printer_id=${_printerId}&from=${from}&to=${to}&resolution=${range.resolution}`);
      _data = await res.json();
      if (!Array.isArray(_data)) _data = [];

      let html = '';

      // ── Top bar: Printer selector + Range + Lock ──
      html += '<div class="tele-top-bar">';
      html += buildPrinterSelector('changeTelePrinter', _selectedTelePrinter, false);
      html += '<div class="tele-range-group">';
      for (const key of Object.keys(RANGE_MAP)) {
        html += `<button class="tele-range-btn ${key === currentRange ? 'active' : ''}" data-ripple onclick="setTelemetryRange('${key}')">${key}</button>`;
      }
      html += '</div>';
      const lockIcon = _locked
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>';
      html += `<button class="tele-lock-btn ${_locked ? '' : 'active'}" data-ripple onclick="toggleTeleLock()" title="${_locked ? t('telemetry.layout_locked') : t('telemetry.layout_unlocked')}">${lockIcon}</button>`;
      html += '</div>';

      // ── Tab bar ──
      html += '<div class="tabs">';
      for (const [id, cfg] of Object.entries(TAB_CONFIG)) {
        html += `<button class="tab-btn tele-tab-btn ${id === _activeTab ? 'active' : ''}" data-tab="${id}" data-ripple onclick="switchTeleTab('${id}')">${t(cfg.label)}</button>`;
      }
      html += '</div>';

      // ── Tab panels ──
      for (const [tabId, cfg] of Object.entries(TAB_CONFIG)) {
        const order = getOrder(tabId);
        html += `<div class="tab-panel tele-tab-panel stats-tab-panel ${tabId === _activeTab ? 'active' : ''}" id="tele-tab-${tabId}" style="display:${tabId === _activeTab ? 'grid' : 'none'}">`;
        for (const modId of order) {
          const builder = BUILDERS[modId];
          if (!builder) continue;
          const content = builder(_data);
          if (!content) continue;
          const draggable = _locked ? '' : 'draggable="true"';
          const unlocked = _locked ? '' : ' stats-module-unlocked';
          const isFull = (MODULE_SIZE[modId] || 'full') === 'full';
          html += `<div class="stats-module${unlocked}${isFull ? ' stats-module-full' : ''}" data-module-id="${modId}" ${draggable}>`;
          if (!_locked) html += '<div class="stats-module-handle" title="Drag to reorder">&#x2630;</div>';
          html += content;
          html += '</div>';
        }
        html += '</div>';
      }

      panel.innerHTML = html;

      for (const tabId of Object.keys(TAB_CONFIG)) {
        const cont = document.getElementById(`tele-tab-${tabId}`);
        if (cont) initModuleDrag(cont, tabId);
      }
    } catch (e) {
      panel.innerHTML = `<p class="text-muted">${t('telemetry.load_failed')}</p>`;
    }
  }

  // ═══ Global API ═══
  window.loadTelemetryPanel = loadTelemetry;
  window.changeTelePrinter = function(value) { _selectedTelePrinter = value || null; loadTelemetry(); };
  window.switchTeleTab = switchTab;
  window.toggleTeleLock = function() {
    _locked = !_locked;
    localStorage.setItem(LOCK_KEY, _locked ? '1' : '0');
    loadTelemetry();
  };
  window.setTelemetryRange = function(range) {
    currentRange = range;
    loadTelemetry();
  };
})();
