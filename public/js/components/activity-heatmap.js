// Activity Heatmap — GitHub-style year calendar + stats
(function() {
  'use strict';

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DAYS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

  function _tl(key, fb) { if (typeof t === 'function') { const v = t(key); if (v && v !== key) return v; } return fb || key; }
  function _fmtDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function _dayName(d) {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
  }

  function _colorForCount(count, max) {
    if (count === 0) return 'var(--bg-tertiary)';
    const pct = count / Math.max(max, 1);
    if (pct <= 0.25) return 'rgba(0, 230, 118, 0.3)';
    if (pct <= 0.5) return 'rgba(0, 230, 118, 0.5)';
    if (pct <= 0.75) return 'rgba(0, 230, 118, 0.7)';
    return 'rgba(0, 230, 118, 0.95)';
  }

  async function loadActivity() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    // Keep tab bar if present
    const tabBar = el.querySelector('._wrapper-tabs');
    el.innerHTML = '';
    if (tabBar) el.appendChild(tabBar);
    el.insertAdjacentHTML('beforeend', '<div class="matrec-empty"><div class="matrec-spinner"></div></div>');

    try {
      const _ahPid = window.printerState?.getActivePrinterId?.() || '';
      const _ahQ = _ahPid ? `&printer_id=${_ahPid}` : '';
      const [daily, streakDays] = await Promise.all([
        fetch(`/api/activity/daily?days=365${_ahQ}`).then(r => r.json()),
        fetch(`/api/activity/streaks?${_ahQ.substring(1)}`).then(r => r.json())
      ]);

      const dayMap = {};
      let maxPrints = 0;
      for (const d of daily) {
        dayMap[d.day] = d;
        if (d.prints > maxPrints) maxPrints = d.prints;
      }

      // Calculate streaks
      const streakSet = new Set(streakDays);
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 1;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const checkDate = new Date(today);
      while (streakSet.has(_fmtDate(checkDate))) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }

      const sortedDays = [...streakSet].sort();
      for (let i = 1; i < sortedDays.length; i++) {
        const diff = (new Date(sortedDays[i]) - new Date(sortedDays[i - 1])) / 86400000;
        if (diff === 1) {
          tempStreak++;
        } else {
          if (tempStreak > longestStreak) longestStreak = tempStreak;
          tempStreak = 1;
        }
      }
      if (tempStreak > longestStreak) longestStreak = tempStreak;

      // Totals
      const totalPrints = daily.reduce((s, d) => s + d.prints, 0);
      const totalHours = daily.reduce((s, d) => s + (d.hours || 0), 0);
      const totalFilament = daily.reduce((s, d) => s + (d.filament_g || 0), 0);
      const activeDays = streakDays.length;
      const totalCompleted = daily.reduce((s, d) => s + (d.completed || 0), 0);
      const totalFailed = daily.reduce((s, d) => s + (d.failed || 0), 0);
      const successRate = totalPrints > 0 ? Math.round((totalCompleted / totalPrints) * 100) : 0;
      const avgPerDay = activeDays > 0 ? (totalPrints / activeDays).toFixed(1) : '0';

      let h = '<div class="act-panel">';

      // ── Stats strip (full width) ──
      h += `<div class="act-full">
        <div class="stats-strip act-stats">
          <div class="spark-panel"><span class="spark-label">${_tl('activity.total_prints', 'Total')}</span><span class="spark-value" style="color:var(--accent-blue)">${totalPrints}</span></div>
          <div class="spark-panel"><span class="spark-label">${_tl('activity.active_days', 'Active days')}</span><span class="spark-value" style="color:var(--accent-green)">${activeDays}</span></div>
          <div class="spark-panel"><span class="spark-label">${_tl('activity.current_streak', 'Streak')}</span><span class="spark-value" style="color:var(--accent-yellow, #e6a817)">${currentStreak}d</span></div>
          <div class="spark-panel"><span class="spark-label">${_tl('activity.longest_streak', 'Longest')}</span><span class="spark-value" style="color:var(--accent-purple)">${longestStreak}d</span></div>
          <div class="spark-panel" style="border-right:none"><span class="spark-label">${_tl('activity.success_rate', 'Success rate')}</span><span class="spark-value" style="color:${successRate >= 80 ? 'var(--accent-green)' : successRate >= 50 ? 'var(--accent-orange)' : 'var(--accent-red)'}">${successRate}%</span></div>
        </div>
      </div>`;

      // ── 2-column body ──
      // Left: stat cards + busiest days
      h += `<div class="act-col-left">
        <div class="act-cards-grid">
          ${_statCard(_tl('activity.print_hours', 'Print hours'), Math.round(totalHours) + 'h', 'var(--accent-blue)')}
          ${_statCard(_tl('activity.filament_used', 'Filament used'), totalFilament >= 1000 ? (totalFilament / 1000).toFixed(1) + 'kg' : Math.round(totalFilament) + 'g', 'var(--accent-orange)')}
          ${_statCard(_tl('activity.completed', 'Completed'), totalCompleted, 'var(--accent-green)')}
          ${_statCard(_tl('activity.failed', 'Failed'), totalFailed, 'var(--accent-red)')}
          ${_statCard(_tl('activity.avg_per_day', 'Avg per day'), avgPerDay, 'var(--accent-purple)')}
        </div>
        <div class="card act-busiest-card">
          <div class="card-title">${_tl('activity.busiest_days', 'Busiest days')}</div>
          ${_renderBusiestDays(daily)}
        </div>
      </div>`;

      // Right: heatmap + monthly
      h += `<div class="act-col-right">
        <div class="card act-heatmap-card">
          <div class="card-title">${_tl('activity.year_heatmap', 'Print activity — last 12 months')}</div>
          ${_renderHeatmap(dayMap, maxPrints)}
        </div>
        <div class="card act-monthly-card">
          <div class="card-title">${_tl('activity.monthly_breakdown', 'Monthly overview')}</div>
          ${_renderMonthlyBars(daily)}
        </div>
      </div>`;

      h += '</div>';

      // Replace content, preserve tab bar
      const tb = el.querySelector('._wrapper-tabs');
      el.innerHTML = '';
      if (tb) el.appendChild(tb);
      el.insertAdjacentHTML('beforeend', h);

    } catch (e) {
      const tb = el.querySelector('._wrapper-tabs');
      el.innerHTML = '';
      if (tb) el.appendChild(tb);
      el.insertAdjacentHTML('beforeend', `<div class="matrec-empty"><p>Error: ${e.message}</p></div>`);
    }
  }

  function _statCard(label, value, color) {
    return `<div class="act-stat-card">
      <span class="act-stat-label">${label}</span>
      <span class="act-stat-value" style="color:${color}">${value}</span>
    </div>`;
  }

  function _renderHeatmap(dayMap, maxPrints) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - 364);
    while (start.getDay() !== 1) start.setDate(start.getDate() - 1);

    const cellSize = 13;
    const gap = 2;
    const step = cellSize + gap;

    const weeks = [];
    const d = new Date(start);
    let currentWeek = [];
    while (d <= today) {
      if (d.getDay() === 1 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    const svgWidth = weeks.length * step + 30;
    const svgHeight = 7 * step + 25;

    let svg = `<div class="act-heatmap-scroll"><svg class="act-heatmap-svg" viewBox="0 0 ${svgWidth} ${svgHeight}">`;

    // Day labels
    DAYS.forEach((label, i) => {
      if (label) svg += `<text x="0" y="${i * step + cellSize + 18}" font-size="9" fill="var(--text-muted)" font-family="inherit">${label}</text>`;
    });

    // Month labels
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const month = week[0].getMonth();
      if (month !== lastMonth) {
        svg += `<text x="${wi * step + 28}" y="10" font-size="9" fill="var(--text-muted)" font-family="inherit">${MONTHS[month]}</text>`;
        lastMonth = month;
      }
    });

    // Cells
    weeks.forEach((week, wi) => {
      week.forEach(day => {
        const dayStr = _fmtDate(day);
        const entry = dayMap[dayStr];
        const count = entry?.prints || 0;
        const color = _colorForCount(count, maxPrints);
        const dow = (day.getDay() + 6) % 7;
        const x = wi * step + 28;
        const y = dow * step + 15;

        const tooltip = count > 0
          ? `${dayStr}: ${count} ${count === 1 ? 'print' : 'prints'} (${entry.hours || 0}h)`
          : `${dayStr}: ${_tl('activity.no_prints', 'no prints')}`;

        svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${color}" stroke="var(--border-subtle)" stroke-width="0.5"><title>${tooltip}</title></rect>`;
      });
    });

    svg += '</svg></div>';

    // Legend
    svg += `<div class="act-heatmap-legend">
      <span>${_tl('activity.less', 'Less')}</span>
      <div class="act-legend-cell" style="background:var(--bg-tertiary);border:1px solid var(--border-color)"></div>
      <div class="act-legend-cell" style="background:rgba(0,230,118,0.3)"></div>
      <div class="act-legend-cell" style="background:rgba(0,230,118,0.5)"></div>
      <div class="act-legend-cell" style="background:rgba(0,230,118,0.7)"></div>
      <div class="act-legend-cell" style="background:rgba(0,230,118,0.95)"></div>
      <span>${_tl('activity.more', 'More')}</span>
    </div>`;

    return svg;
  }

  function _renderMonthlyBars(daily) {
    const months = {};
    for (const d of daily) {
      const key = d.day.substring(0, 7);
      if (!months[key]) months[key] = { prints: 0, hours: 0, filament: 0 };
      months[key].prints += d.prints;
      months[key].hours += d.hours || 0;
      months[key].filament += d.filament_g || 0;
    }

    const keys = Object.keys(months).sort();
    if (!keys.length) return `<div class="matrec-empty"><p>${_tl('activity.no_data', 'No data')}</p></div>`;

    const maxPrints = Math.max(...Object.values(months).map(m => m.prints), 1);

    let h = '<div class="act-monthly-list">';
    for (const key of keys) {
      const m = months[key];
      const pct = (m.prints / maxPrints) * 100;
      const [y, mon] = key.split('-');
      const label = `${MONTHS[parseInt(mon) - 1]} ${y}`;

      h += `<div class="act-monthly-row">
        <span class="act-monthly-label">${label}</span>
        <div class="matrec-bar-track"><div class="matrec-bar-fill" style="width:${pct}%;background:var(--accent-green)"></div></div>
        <span class="act-monthly-value">${m.prints} <span class="act-monthly-detail">(${Math.round(m.hours)}h · ${Math.round(m.filament)}g)</span></span>
      </div>`;
    }
    h += '</div>';
    return h;
  }

  function _renderBusiestDays(daily) {
    const sorted = [...daily].sort((a, b) => b.prints - a.prints).slice(0, 10);
    if (!sorted.length) return `<div class="matrec-empty"><p>${_tl('activity.no_data', 'No data')}</p></div>`;

    let h = '<div class="auto-grid auto-grid--md">';
    for (let i = 0; i < sorted.length; i++) {
      const d = sorted[i];
      const date = new Date(d.day + 'T00:00:00');
      const dayName = _dayName(date);
      const dateStr = `${dayName} ${date.getDate()}. ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
      const medal = i === 0 ? ' act-busiest--gold' : i === 1 ? ' act-busiest--silver' : i === 2 ? ' act-busiest--bronze' : '';

      h += `<div class="act-busiest-card${medal}">
        <div class="act-busiest-info">
          <span class="act-busiest-rank">#${i + 1}</span>
          <div>
            <div class="act-busiest-date">${dateStr}</div>
            <div class="act-busiest-meta">${d.hours || 0}h · ${Math.round(d.filament_g || 0)}g</div>
          </div>
        </div>
        <span class="act-busiest-count">${d.prints}</span>
      </div>`;
    }
    h += '</div>';
    return h;
  }

  window.loadActivityPanel = loadActivity;
})();
