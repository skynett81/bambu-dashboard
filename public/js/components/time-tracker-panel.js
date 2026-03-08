// Print Time Tracker — Slicer estimate vs actual print time + print duration analysis
(function() {

  // ═══ Helpers ═══
  const _ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function _esc(s) { if (s == null) return ''; return String(s).replace(/[&<>"']/g, c => _ESC[c]); }

  function fmtTime(sec) {
    if (!sec) return '--';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  function fmtDate(iso) {
    if (!iso) return '--';
    const locale = (window.i18n?.getLocale() || 'nb').replace('_', '-');
    return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function _css(v, fb) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim() || fb; }

  function accColor(pct) {
    if (pct >= 95) return 'var(--accent-green)';
    if (pct >= 85) return 'var(--accent-orange)';
    return 'var(--accent-red)';
  }

  function accLabel(pct) {
    if (pct > 100) return t('timetracker.overestimate');
    if (pct < 100) return t('timetracker.underestimate');
    return '';
  }

  // ═══ Main ═══
  window.loadTimeTrackerPanel = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    el.innerHTML = `<style>
      .tt-container { max-width:1100px; }
      .tt-filters { display:flex; gap:12px; align-items:center; margin-bottom:16px; flex-wrap:wrap; }
      .tt-filters select, .tt-filters input { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); color:var(--text-primary); padding:6px 10px; font-size:0.78rem; }
      .tt-summary { display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:12px; margin-bottom:20px; }
      .tt-card { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); padding:16px; text-align:center; }
      .tt-card-label { font-size:0.7rem; color:var(--text-muted); font-weight:600; text-transform:uppercase; }
      .tt-card-value { font-size:1.5rem; font-weight:800; margin-top:4px; }
      .tt-card-sub { font-size:0.72rem; color:var(--text-muted); margin-top:2px; }
      .tt-chart-wrap { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); padding:16px; margin-bottom:16px; }
      .tt-chart-wrap h4 { margin:0 0 12px; font-size:0.85rem; }
      .tt-chart { width:100%; }
      .tt-table-wrap { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); overflow:hidden; }
      .tt-table { width:100%; border-collapse:collapse; font-size:0.78rem; }
      .tt-table th { text-align:left; padding:10px 12px; font-size:0.7rem; color:var(--text-muted); font-weight:600; text-transform:uppercase; border-bottom:1px solid var(--border-color); }
      .tt-table td { padding:8px 12px; border-bottom:1px solid var(--border-color); }
      .tt-table tr:last-child td { border-bottom:none; }
      .tt-table tr:hover { background:rgba(255,255,255,0.02); }
      .tt-acc-badge { display:inline-block; padding:2px 8px; border-radius:10px; font-weight:700; font-size:0.75rem; }
      .tt-no-data { text-align:center; padding:40px; color:var(--text-muted); font-size:0.85rem; }
      .tt-info-box { background:rgba(18,121,255,0.06); border:1px solid rgba(18,121,255,0.15); border-radius:var(--radius); padding:12px 16px; margin-bottom:16px; font-size:0.8rem; color:var(--text-muted); display:flex; align-items:center; gap:10px; }
    </style>
    <div class="tt-container">
      <div class="tt-filters">
        <select id="tt-filter-type"><option value="">${_esc(t('timetracker.filter_all'))}</option></select>
        <input type="date" id="tt-filter-from" />
        <input type="date" id="tt-filter-to" />
      </div>
      <div id="tt-info"></div>
      <div class="tt-summary" id="tt-summary"></div>
      <div class="tt-chart-wrap">
        <h4 id="tt-chart-title">${_esc(t('timetracker.title'))}</h4>
        <canvas class="tt-chart" id="tt-chart" height="300"></canvas>
      </div>
      <div class="tt-table-wrap">
        <table class="tt-table" id="tt-table">
          <thead id="tt-thead"></thead>
          <tbody id="tt-tbody"></tbody>
        </table>
      </div>
    </div>`;

    _loadData();

    document.getElementById('tt-filter-type').addEventListener('change', () => _applyFilters());
    document.getElementById('tt-filter-from').addEventListener('change', () => _applyFilters());
    document.getElementById('tt-filter-to').addEventListener('change', () => _applyFilters());
  };

  let _trackingData = [];
  let _historyData = [];
  let _mode = 'tracking'; // 'tracking' or 'history'

  async function _loadData() {
    // Try time-tracking data first
    try {
      const res = await fetch('/api/time-tracking');
      const data = await res.json();
      _trackingData = Array.isArray(data) ? data : [];
    } catch {
      _trackingData = [];
    }

    // Always fetch print history as fallback
    try {
      const pid = window.printerState?.getActivePrinterId();
      const url = `/api/history?limit=200${pid ? '&printer_id=' + encodeURIComponent(pid) : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      _historyData = (Array.isArray(data) ? data : []).filter(p => p.status === 'completed' && p.duration_seconds > 0);
    } catch {
      _historyData = [];
    }

    _mode = _trackingData.length > 0 ? 'tracking' : 'history';

    // Populate filter from available data
    const sourceData = _mode === 'tracking' ? _trackingData : _historyData;
    const typeKey = _mode === 'tracking' ? 'filament_type' : 'filament_type';
    const types = [...new Set(sourceData.map(d => d[typeKey]).filter(Boolean))].sort();
    const sel = document.getElementById('tt-filter-type');
    if (sel) {
      types.forEach(ft => {
        const opt = document.createElement('option');
        opt.value = ft;
        opt.textContent = ft;
        sel.appendChild(opt);
      });
    }

    _applyFilters();
  }

  function _applyFilters() {
    const typeVal = document.getElementById('tt-filter-type')?.value || '';
    const fromVal = document.getElementById('tt-filter-from')?.value || '';
    const toVal = document.getElementById('tt-filter-to')?.value || '';

    const dateKey = _mode === 'tracking' ? 'finished_at' : 'finished_at';
    let filtered = _mode === 'tracking' ? [..._trackingData] : [..._historyData];

    if (typeVal) {
      filtered = filtered.filter(d => d.filament_type === typeVal);
    }
    if (fromVal) {
      const from = new Date(fromVal);
      filtered = filtered.filter(d => new Date(d[dateKey]) >= from);
    }
    if (toVal) {
      const to = new Date(toVal);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(d => new Date(d[dateKey]) <= to);
    }

    if (_mode === 'tracking') {
      _renderTrackingMode(filtered);
    } else {
      _renderHistoryMode(filtered);
    }
  }

  // ═══ Mode: Time Tracking (estimated vs actual) ═══

  function _renderTrackingMode(data) {
    const infoEl = document.getElementById('tt-info');
    if (infoEl) infoEl.innerHTML = '';

    _renderTrackingSummary(data);
    _renderTrackingChart(data);
    _renderTrackingTable(data);
  }

  function _renderTrackingSummary(data) {
    const el = document.getElementById('tt-summary');
    if (!el) return;
    if (!data.length) { el.innerHTML = ''; return; }

    const accs = data.map(d => d.accuracy_pct);
    const avg = accs.reduce((s, v) => s + v, 0) / accs.length;
    const best = Math.max(...accs);
    const worst = Math.min(...accs);

    el.innerHTML = `
      <div class="tt-card">
        <div class="tt-card-label">${_esc(t('timetracker.avg_accuracy'))}</div>
        <div class="tt-card-value" style="color:${accColor(avg)}">${avg.toFixed(1)}%</div>
      </div>
      <div class="tt-card">
        <div class="tt-card-label">${_esc(t('timetracker.total_tracked'))}</div>
        <div class="tt-card-value" style="color:var(--accent-blue)">${data.length}</div>
      </div>
      <div class="tt-card">
        <div class="tt-card-label">${_esc(t('timetracker.best'))}</div>
        <div class="tt-card-value" style="color:var(--accent-green)">${best.toFixed(1)}%</div>
      </div>
      <div class="tt-card">
        <div class="tt-card-label">${_esc(t('timetracker.worst'))}</div>
        <div class="tt-card-value" style="color:var(--accent-red)">${worst.toFixed(1)}%</div>
      </div>`;
  }

  function _renderTrackingChart(data) {
    const canvas = document.getElementById('tt-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const titleEl = document.getElementById('tt-chart-title');
    if (titleEl) titleEl.textContent = t('timetracker.title');

    if (!data.length) {
      canvas.height = 80;
      canvas.width = canvas.parentElement.clientWidth || 600;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = _css('--text-muted', '#999');
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t('timetracker.no_data'), canvas.width / 2, 45);
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const barH = 24;
    const gap = 6;
    const labelW = 140;
    const valueW = 60;
    const padTop = 10;
    const padBottom = 10;
    const totalH = padTop + data.length * (barH + gap) - gap + padBottom;
    const containerW = canvas.parentElement.clientWidth || 600;

    canvas.style.width = containerW + 'px';
    canvas.style.height = totalH + 'px';
    canvas.width = containerW * dpr;
    canvas.height = totalH * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, containerW, totalH);

    const chartW = containerW - labelW - valueW - 20;

    data.forEach((item, i) => {
      const y = padTop + i * (barH + gap);
      const pct = Math.min(item.accuracy_pct, 120);
      const w = Math.max(2, (pct / 120) * chartW);

      ctx.fillStyle = _css('--text-primary', '#ccc');
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const name = item.filename && item.filename.length > 18
        ? item.filename.substring(0, 17) + '...' : (item.filename || '--');
      ctx.fillText(name, labelW - 8, y + barH / 2);

      ctx.fillStyle = 'rgba(128,128,128,0.1)';
      ctx.beginPath(); ctx.roundRect(labelW, y, chartW, barH, 4); ctx.fill();

      const color = item.accuracy_pct >= 95
        ? (_css('--accent-green', '#22c55e'))
        : item.accuracy_pct >= 85
          ? (_css('--accent-orange', '#f59e0b'))
          : (_css('--accent-red', '#ef4444'));
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.roundRect(labelW, y, w, barH, 4); ctx.fill();

      ctx.fillStyle = _css('--text-primary', '#ccc');
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${item.accuracy_pct.toFixed(1)}%`, labelW + chartW + 8, y + barH / 2);
    });
  }

  function _renderTrackingTable(data) {
    const thead = document.getElementById('tt-thead');
    const tbody = document.getElementById('tt-tbody');
    if (!thead || !tbody) return;

    thead.innerHTML = `<tr>
      <th>${_esc(t('timetracker.filename'))}</th>
      <th>${_esc(t('timetracker.estimated'))}</th>
      <th>${_esc(t('timetracker.actual'))}</th>
      <th>${_esc(t('timetracker.accuracy'))}</th>
      <th>${_esc(t('timetracker.date'))}</th>
    </tr>`;

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="tt-no-data">${_esc(t('timetracker.no_data'))}</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(d => {
      const acc = d.accuracy_pct;
      const color = accColor(acc);
      const label = accLabel(acc);
      return `<tr>
        <td>${_esc(d.filename)}</td>
        <td>${fmtTime(d.estimated_s)}</td>
        <td>${fmtTime(d.actual_s)}</td>
        <td><span class="tt-acc-badge" style="background:${color}18;color:${color}">${acc.toFixed(1)}%</span>${label ? ` <span style="font-size:0.7rem;color:var(--text-muted)">${_esc(label)}</span>` : ''}</td>
        <td>${fmtDate(d.finished_at)}</td>
      </tr>`;
    }).join('');
  }

  // ═══ Mode: History Fallback (print duration analysis) ═══

  function _renderHistoryMode(data) {
    const infoEl = document.getElementById('tt-info');
    if (infoEl) {
      infoEl.innerHTML = `<div class="tt-info-box">
        <span>\u2139\uFE0F</span>
        <span>${_esc(t('timetracker.history_mode_info'))}</span>
      </div>`;
    }

    _renderHistorySummary(data);
    _renderHistoryChart(data);
    _renderHistoryTable(data);
  }

  function _renderHistorySummary(data) {
    const el = document.getElementById('tt-summary');
    if (!el) return;
    if (!data.length) { el.innerHTML = ''; return; }

    const durations = data.map(d => d.duration_seconds);
    const totalSec = durations.reduce((s, v) => s + v, 0);
    const avgSec = totalSec / durations.length;
    const shortest = Math.min(...durations);
    const longest = Math.max(...durations);
    const totalFilament = data.reduce((s, d) => s + (d.filament_used_g || 0), 0);

    el.innerHTML = `
      <div class="tt-card">
        <div class="tt-card-label">${_esc(t('timetracker.total_print_time'))}</div>
        <div class="tt-card-value" style="color:var(--accent-blue)">${fmtTime(totalSec)}</div>
        <div class="tt-card-sub">${data.length} ${_esc(t('timetracker.prints'))}</div>
      </div>
      <div class="tt-card">
        <div class="tt-card-label">${_esc(t('timetracker.avg_duration'))}</div>
        <div class="tt-card-value">${fmtTime(Math.round(avgSec))}</div>
      </div>
      <div class="tt-card">
        <div class="tt-card-label">${_esc(t('timetracker.shortest'))}</div>
        <div class="tt-card-value" style="color:var(--accent-green)">${fmtTime(shortest)}</div>
      </div>
      <div class="tt-card">
        <div class="tt-card-label">${_esc(t('timetracker.longest'))}</div>
        <div class="tt-card-value" style="color:var(--accent-orange)">${fmtTime(longest)}</div>
      </div>
      <div class="tt-card">
        <div class="tt-card-label">${_esc(t('timetracker.filament_total'))}</div>
        <div class="tt-card-value">${(totalFilament / 1000).toFixed(2)} kg</div>
      </div>`;
  }

  function _renderHistoryChart(data) {
    const canvas = document.getElementById('tt-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const titleEl = document.getElementById('tt-chart-title');
    if (titleEl) titleEl.textContent = t('timetracker.duration_chart');

    if (!data.length) {
      canvas.height = 80;
      canvas.width = canvas.parentElement.clientWidth || 600;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = _css('--text-muted', '#999');
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t('timetracker.no_data'), canvas.width / 2, 45);
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const barH = 24;
    const gap = 6;
    const labelW = 160;
    const valueW = 80;
    const padTop = 10;
    const padBottom = 10;
    const maxItems = Math.min(data.length, 25);
    const displayData = data.slice(0, maxItems);
    const totalH = padTop + displayData.length * (barH + gap) - gap + padBottom;
    const containerW = canvas.parentElement.clientWidth || 600;

    canvas.style.width = containerW + 'px';
    canvas.style.height = totalH + 'px';
    canvas.width = containerW * dpr;
    canvas.height = totalH * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, containerW, totalH);

    const chartW = containerW - labelW - valueW - 20;
    const maxDuration = Math.max(...displayData.map(d => d.duration_seconds));

    displayData.forEach((item, i) => {
      const y = padTop + i * (barH + gap);
      const w = Math.max(2, (item.duration_seconds / maxDuration) * chartW);

      // Label (filename)
      ctx.fillStyle = _css('--text-primary', '#ccc');
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      const name = item.filename && item.filename.length > 22
        ? item.filename.substring(0, 21) + '...' : (item.filename || '--');
      ctx.fillText(name, labelW - 8, y + barH / 2);

      // Bar background
      ctx.fillStyle = 'rgba(128,128,128,0.1)';
      ctx.beginPath(); ctx.roundRect(labelW, y, chartW, barH, 4); ctx.fill();

      // Bar fill — color by duration relative to average
      const avgSec = displayData.reduce((s, d) => s + d.duration_seconds, 0) / displayData.length;
      const ratio = item.duration_seconds / avgSec;
      const color = ratio <= 0.5 ? _css('--accent-green', '#22c55e')
        : ratio <= 1.5 ? _css('--accent-blue', '#1279ff')
        : _css('--accent-orange', '#f59e0b');
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.roundRect(labelW, y, w, barH, 4); ctx.fill();

      // Value
      ctx.fillStyle = _css('--text-primary', '#ccc');
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(fmtTime(item.duration_seconds), labelW + chartW + 8, y + barH / 2);
    });
  }

  function _renderHistoryTable(data) {
    const thead = document.getElementById('tt-thead');
    const tbody = document.getElementById('tt-tbody');
    if (!thead || !tbody) return;

    thead.innerHTML = `<tr>
      <th>${_esc(t('timetracker.filename'))}</th>
      <th>${_esc(t('timetracker.duration'))}</th>
      <th>${_esc(t('timetracker.filament'))}</th>
      <th>${_esc(t('timetracker.material'))}</th>
      <th>${_esc(t('timetracker.date'))}</th>
    </tr>`;

    if (!data.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="tt-no-data">${_esc(t('timetracker.no_data'))}</td></tr>`;
      return;
    }

    tbody.innerHTML = data.map(d => {
      return `<tr>
        <td>${_esc(d.filename)}</td>
        <td>${fmtTime(d.duration_seconds)}</td>
        <td>${d.filament_used_g ? d.filament_used_g.toFixed(1) + 'g' : '--'}</td>
        <td>${_esc(d.filament_type || '--')}</td>
        <td>${fmtDate(d.finished_at)}</td>
      </tr>`;
    }).join('');
  }

})();
