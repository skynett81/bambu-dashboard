// Activity Heatmap — GitHub-style year calendar
(function() {

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DAYS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];

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

    el.innerHTML = '<div class="text-muted" style="padding:20px;font-size:0.85rem">Loading activity data...</div>';

    try {
      const [daily, streakDays] = await Promise.all([
        fetch('/api/activity/daily?days=365').then(r => r.json()),
        fetch('/api/activity/streaks').then(r => r.json())
      ]);

      // Build day map
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
      let tempStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Current streak (count back from today)
      const checkDate = new Date(today);
      while (true) {
        if (streakSet.has(_fmtDate(checkDate))) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      // Longest streak
      const sortedDays = [...streakSet].sort();
      tempStreak = 1;
      for (let i = 1; i < sortedDays.length; i++) {
        const prev = new Date(sortedDays[i - 1]);
        const curr = new Date(sortedDays[i]);
        const diff = (curr - prev) / 86400000;
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

      let h = '';

      // ── Summary cards ──
      h += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:20px">`;
      h += _statCard(t('activity.total_prints'), totalPrints, 'var(--accent-blue)');
      h += _statCard(t('activity.active_days'), activeDays, 'var(--accent-green)');
      h += _statCard(t('activity.current_streak'), currentStreak + 'd', 'var(--accent-yellow)');
      h += _statCard(t('activity.longest_streak'), longestStreak + 'd', 'var(--accent-purple)');
      h += _statCard(t('activity.print_hours'), Math.round(totalHours) + 'h', 'var(--text-primary)');
      h += _statCard(t('activity.filament_used'), Math.round(totalFilament) + 'g', 'var(--accent-red)');
      h += _statCard(t('activity.completed'), totalCompleted, 'var(--accent-green)');
      h += _statCard(t('activity.failed'), totalFailed, 'var(--accent-red)');
      h += `</div>`;

      // ── Year heatmap ──
      h += `<div class="card" style="overflow-x:auto">`;
      h += `<div class="card-title">${t('activity.year_heatmap')}</div>`;
      h += _renderHeatmap(dayMap, maxPrints);
      h += `</div>`;

      // ── Monthly breakdown ──
      h += `<div class="card" style="margin-top:16px">`;
      h += `<div class="card-title">${t('activity.monthly_breakdown')}</div>`;
      h += _renderMonthlyBars(daily);
      h += `</div>`;

      // ── Busiest days ──
      h += `<div class="card" style="margin-top:16px">`;
      h += `<div class="card-title">${t('activity.busiest_days')}</div>`;
      h += _renderBusiestDays(daily);
      h += `</div>`;

      el.innerHTML = h;
    } catch (e) {
      el.innerHTML = `<div class="text-muted" style="padding:20px">Error: ${e.message}</div>`;
    }
  }

  function _statCard(label, value, color) {
    return `<div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:8px;padding:12px 16px;text-align:center">
      <div class="text-muted" style="font-size:0.68rem;text-transform:uppercase;letter-spacing:0.04em">${label}</div>
      <div style="font-size:1.4rem;font-weight:800;color:${color};margin-top:4px">${value}</div>
    </div>`;
  }

  function _renderHeatmap(dayMap, maxPrints) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Go back 52 weeks from today
    const start = new Date(today);
    start.setDate(start.getDate() - 364);
    // Align to Monday
    while (start.getDay() !== 1) start.setDate(start.getDate() - 1);

    const cellSize = 13;
    const gap = 2;
    const step = cellSize + gap;

    // Build weeks
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

    let svg = `<svg width="100%" viewBox="0 0 ${svgWidth} ${svgHeight}" style="min-width:${svgWidth}px;max-width:900px">`;

    // Day labels
    DAYS.forEach((label, i) => {
      if (label) {
        svg += `<text x="0" y="${i * step + cellSize + 18}" font-size="9" fill="var(--text-muted)" font-family="inherit">${label}</text>`;
      }
    });

    // Month labels
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const firstDay = week[0];
      const month = firstDay.getMonth();
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
        const dow = (day.getDay() + 6) % 7; // Mon=0, Sun=6
        const x = wi * step + 28;
        const y = dow * step + 15;

        const tooltip = count > 0
          ? `${dayStr}: ${count} print${count !== 1 ? 's' : ''} (${entry.hours || 0}h)`
          : `${dayStr}: ${t('activity.no_prints')}`;

        svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${color}" stroke="var(--border-color)" stroke-width="0.5" opacity="0.95">
          <title>${tooltip}</title>
        </rect>`;
      });
    });

    svg += '</svg>';

    // Legend
    svg += `<div style="display:flex;align-items:center;gap:4px;margin-top:8px;justify-content:flex-end;font-size:0.65rem;color:var(--text-muted)">`;
    svg += `<span>${t('activity.less')}</span>`;
    svg += `<div style="width:${cellSize}px;height:${cellSize}px;background:var(--bg-tertiary);border-radius:2px;border:1px solid var(--border-color)"></div>`;
    svg += `<div style="width:${cellSize}px;height:${cellSize}px;background:rgba(0,230,118,0.3);border-radius:2px"></div>`;
    svg += `<div style="width:${cellSize}px;height:${cellSize}px;background:rgba(0,230,118,0.5);border-radius:2px"></div>`;
    svg += `<div style="width:${cellSize}px;height:${cellSize}px;background:rgba(0,230,118,0.7);border-radius:2px"></div>`;
    svg += `<div style="width:${cellSize}px;height:${cellSize}px;background:rgba(0,230,118,0.95);border-radius:2px"></div>`;
    svg += `<span>${t('activity.more')}</span>`;
    svg += `</div>`;

    return svg;
  }

  function _renderMonthlyBars(daily) {
    // Group by month
    const months = {};
    for (const d of daily) {
      const key = d.day.substring(0, 7); // YYYY-MM
      if (!months[key]) months[key] = { prints: 0, hours: 0, filament: 0 };
      months[key].prints += d.prints;
      months[key].hours += d.hours || 0;
      months[key].filament += d.filament_g || 0;
    }

    const keys = Object.keys(months).sort();
    if (!keys.length) return `<div class="text-muted" style="font-size:0.8rem">${t('activity.no_data')}</div>`;

    const maxPrints = Math.max(...Object.values(months).map(m => m.prints), 1);

    let h = `<div style="display:flex;flex-direction:column;gap:6px">`;
    for (const key of keys) {
      const m = months[key];
      const pct = (m.prints / maxPrints) * 100;
      const [y, mon] = key.split('-');
      const label = `${MONTHS[parseInt(mon) - 1]} ${y}`;

      h += `<div style="display:flex;align-items:center;gap:8px">`;
      h += `<div style="width:60px;font-size:0.72rem;color:var(--text-secondary);text-align:right;flex-shrink:0">${label}</div>`;
      h += `<div style="flex:1;height:18px;background:var(--bg-tertiary);border-radius:4px;overflow:hidden">`;
      h += `<div style="width:${pct}%;height:100%;background:var(--accent-green);border-radius:4px;transition:width 0.3s"></div>`;
      h += `</div>`;
      h += `<div style="width:80px;font-size:0.72rem;color:var(--text-primary);font-weight:600">${m.prints} prints</div>`;
      h += `</div>`;
    }
    h += `</div>`;
    return h;
  }

  function _renderBusiestDays(daily) {
    const sorted = [...daily].sort((a, b) => b.prints - a.prints).slice(0, 10);
    if (!sorted.length) return `<div class="text-muted" style="font-size:0.8rem">${t('activity.no_data')}</div>`;

    let h = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px">`;
    for (const d of sorted) {
      const date = new Date(d.day + 'T00:00:00');
      const dayName = _dayName(date);
      const dateStr = `${dayName} ${date.getDate()}. ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;

      h += `<div style="background:var(--bg-tertiary);padding:8px 12px;border-radius:6px;display:flex;justify-content:space-between;align-items:center">`;
      h += `<div><div style="font-size:0.8rem;font-weight:600">${dateStr}</div>`;
      h += `<div style="font-size:0.68rem;color:var(--text-muted)">${d.hours || 0}h · ${Math.round(d.filament_g || 0)}g</div></div>`;
      h += `<div style="font-size:1.1rem;font-weight:800;color:var(--accent-green)">${d.prints}</div>`;
      h += `</div>`;
    }
    h += `</div>`;
    return h;
  }

  window.loadActivityPanel = loadActivity;

})();
