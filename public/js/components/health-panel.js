// Printer Health Score — aggregated printer health overview
(function() {
  let _data = null;

  window.loadHealthPanel = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    el.innerHTML = `<style>
      .hs-container { max-width:900px; }
      .hs-score-hero { display:flex; align-items:center; gap:24px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); padding:24px; margin-bottom:20px; }
      .hs-ring-wrap { position:relative; width:140px; height:140px; flex-shrink:0; }
      .hs-ring { transform:rotate(-90deg); }
      .hs-ring-bg { fill:none; stroke:var(--bg-tertiary); stroke-width:10; }
      .hs-ring-fill { fill:none; stroke-width:10; stroke-linecap:round; transition:stroke-dashoffset 1s ease; }
      .hs-score-text { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; }
      .hs-score-num { font-size:2.2rem; font-weight:900; line-height:1; }
      .hs-score-label { font-size:0.7rem; color:var(--text-muted); font-weight:600; }
      .hs-hero-info { flex:1; }
      .hs-hero-title { font-size:1.1rem; font-weight:800; margin-bottom:4px; }
      .hs-hero-subtitle { font-size:0.8rem; color:var(--text-muted); margin-bottom:12px; }
      .hs-hero-badges { display:flex; gap:8px; flex-wrap:wrap; }
      .hs-badge { padding:4px 10px; border-radius:12px; font-size:0.68rem; font-weight:600; }
      .hs-badge-good { background:rgba(0,174,66,0.1); color:var(--accent-green); }
      .hs-badge-warn { background:rgba(245,158,11,0.1); color:#f59e0b; }
      .hs-badge-bad { background:rgba(229,57,53,0.1); color:var(--accent-red); }
      .hs-categories { display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:14px; }
      .hs-cat { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); padding:16px; }
      .hs-cat-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
      .hs-cat-title { font-size:0.85rem; font-weight:700; }
      .hs-cat-score { font-size:1rem; font-weight:800; }
      .hs-cat-bar { width:100%; height:6px; background:var(--bg-tertiary); border-radius:3px; overflow:hidden; margin-bottom:10px; }
      .hs-cat-fill { height:100%; border-radius:3px; transition:width 0.8s ease; }
      .hs-item { display:flex; justify-content:space-between; padding:4px 0; font-size:0.75rem; border-bottom:1px solid rgba(0,0,0,0.03); }
      .hs-item-label { color:var(--text-muted); }
      .hs-item-value { font-weight:600; }
      .hs-tip { font-size:0.72rem; color:var(--text-muted); margin-top:8px; padding:8px; background:rgba(18,121,255,0.04); border-radius:var(--radius); border-left:3px solid var(--accent-blue); }
      @media (max-width:600px) { .hs-score-hero { flex-direction:column; text-align:center; } }
    </style>
    <div class="hs-container">
      <div class="hs-score-hero" id="hs-hero">
        <div style="text-align:center;padding:40px;color:var(--text-muted);width:100%">${t('health.loading')}</div>
      </div>
      <div class="hs-categories" id="hs-cats"></div>
    </div>`;

    _loadHealth();
  };

  async function _loadHealth() {
    const pid = window.printerState?.getActivePrinterId();
    if (!pid) {
      document.getElementById('hs-hero').innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);width:100%">${t('health.no_printer')}</div>`;
      return;
    }

    try {
      const [maint, stats, errors] = await Promise.all([
        fetch(`/api/maintenance/status?printer_id=${pid}`).then(r => r.ok ? r.json() : {}),
        fetch(`/api/statistics?printer_id=${pid}`).then(r => r.ok ? r.json() : {}),
        fetch(`/api/errors?printer_id=${pid}&limit=50`).then(r => r.ok ? r.json() : [])
      ]);

      _data = _computeHealth(maint, stats, errors, pid);
      _render();
    } catch (e) {
      document.getElementById('hs-hero').innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);width:100%">${t('health.load_error')}</div>`;
    }
  }

  function _computeHealth(maint, stats, errors, pid) {
    const scores = {};
    const details = {};

    // 1. Maintenance score (0-100)
    let maintScore = 100;
    const overdueCount = (maint.components || []).filter(c => c.overdue).length;
    const nearDueCount = (maint.components || []).filter(c => c.percentage > 80 && !c.overdue).length;
    maintScore -= overdueCount * 20;
    maintScore -= nearDueCount * 5;
    // Nozzle wear
    const nozzleWear = maint.active_nozzle?.wear_estimate?.percentage || 0;
    if (nozzleWear > 80) maintScore -= 15;
    else if (nozzleWear > 50) maintScore -= 5;
    scores.maintenance = Math.max(0, Math.min(100, maintScore));
    details.maintenance = {
      overdue: overdueCount,
      nearDue: nearDueCount,
      nozzleWear: Math.round(nozzleWear),
      nozzleCondition: maint.active_nozzle?.wear_estimate?.condition || '--',
      totalHours: maint.total_print_hours || 0
    };

    // 2. Reliability score (based on print success rate)
    const totalPrints = (stats.total_prints || 0);
    const successRate = totalPrints > 0 ? ((stats.completed_prints || 0) / totalPrints * 100) : 100;
    const recentFails = stats.failed_prints || 0;
    let reliabilityScore = successRate;
    if (totalPrints < 5) reliabilityScore = 80; // Not enough data
    scores.reliability = Math.max(0, Math.min(100, Math.round(reliabilityScore)));
    details.reliability = {
      successRate: successRate.toFixed(1),
      totalPrints,
      completed: stats.completed_prints || 0,
      failed: stats.failed_prints || 0,
      cancelled: stats.cancelled_prints || 0,
      streak: stats.current_streak || 0
    };

    // 3. Error score (based on recent errors)
    const errorList = Array.isArray(errors) ? errors : (errors.errors || []);
    const recentErrors = errorList.filter(e => {
      const age = Date.now() - new Date(e.timestamp).getTime();
      return age < 7 * 24 * 3600 * 1000; // Last 7 days
    });
    let errorScore = 100;
    errorScore -= Math.min(50, recentErrors.length * 5);
    const unacked = errorList.filter(e => !e.acknowledged).length;
    errorScore -= Math.min(20, unacked * 2);
    scores.errors = Math.max(0, Math.min(100, errorScore));
    details.errors = {
      total: errorList.length,
      recent7d: recentErrors.length,
      unacknowledged: unacked
    };

    // 4. Upkeep score (general age/usage)
    let upkeepScore = 100;
    const hours = maint.total_print_hours || 0;
    if (hours > 2000) upkeepScore -= 15;
    else if (hours > 1000) upkeepScore -= 5;
    const filamentKg = (maint.total_filament_g || 0) / 1000;
    if (filamentKg > 50) upkeepScore -= 10;
    scores.upkeep = Math.max(0, Math.min(100, upkeepScore));
    details.upkeep = {
      totalHours: hours.toFixed(1),
      totalFilamentKg: filamentKg.toFixed(1),
      totalPrints: totalPrints
    };

    // Overall score (weighted average)
    const overall = Math.round(
      scores.maintenance * 0.30 +
      scores.reliability * 0.35 +
      scores.errors * 0.20 +
      scores.upkeep * 0.15
    );

    return { overall, scores, details };
  }

  function _render() {
    if (!_data) return;
    const { overall, scores, details } = _data;
    const heroEl = document.getElementById('hs-hero');
    const catsEl = document.getElementById('hs-cats');
    if (!heroEl || !catsEl) return;

    const color = _scoreColor(overall);
    const grade = _scoreGrade(overall);
    const circumference = 2 * Math.PI * 60;
    const offset = circumference * (1 - overall / 100);

    // Badges
    let badges = '';
    if (details.maintenance.overdue > 0) badges += `<span class="hs-badge hs-badge-bad">${details.maintenance.overdue} ${t('health.overdue')}</span>`;
    if (details.errors.recent7d > 0) badges += `<span class="hs-badge hs-badge-warn">${details.errors.recent7d} ${t('health.recent_errors')}</span>`;
    if (details.reliability.streak > 5) badges += `<span class="hs-badge hs-badge-good">${details.reliability.streak} ${t('health.streak')}</span>`;
    if (details.maintenance.nozzleWear > 80) badges += `<span class="hs-badge hs-badge-bad">${t('health.nozzle_worn')}</span>`;

    heroEl.innerHTML = `
      <div class="hs-ring-wrap">
        <svg class="hs-ring" viewBox="0 0 140 140" width="140" height="140">
          <circle class="hs-ring-bg" cx="70" cy="70" r="60"/>
          <circle class="hs-ring-fill" cx="70" cy="70" r="60" stroke="${color}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
        </svg>
        <div class="hs-score-text">
          <div class="hs-score-num" style="color:${color}">${overall}</div>
          <div class="hs-score-label">${t('health.score')}</div>
        </div>
      </div>
      <div class="hs-hero-info">
        <div class="hs-hero-title">${grade}</div>
        <div class="hs-hero-subtitle">${t('health.based_on')} ${details.upkeep.totalHours}h, ${details.reliability.totalPrints} ${t('health.prints')}</div>
        <div class="hs-hero-badges">${badges || `<span class="hs-badge hs-badge-good">${t('health.all_good')}</span>`}</div>
      </div>`;

    // Categories
    catsEl.innerHTML = `
      ${_catCard(t('health.cat_reliability'), scores.reliability, [
        [t('health.success_rate'), details.reliability.successRate + '%'],
        [t('health.completed'), details.reliability.completed],
        [t('health.failed'), details.reliability.failed],
        [t('health.cancelled'), details.reliability.cancelled],
        [t('health.current_streak'), details.reliability.streak]
      ], scores.reliability < 80 ? t('health.tip_reliability') : null)}
      ${_catCard(t('health.cat_maintenance'), scores.maintenance, [
        [t('health.overdue_items'), details.maintenance.overdue],
        [t('health.near_due'), details.maintenance.nearDue],
        [t('health.nozzle_wear'), details.maintenance.nozzleWear + '%'],
        [t('health.nozzle_condition'), details.maintenance.nozzleCondition],
        [t('health.total_hours'), details.maintenance.totalHours.toFixed(0) + 'h']
      ], details.maintenance.overdue > 0 ? t('health.tip_maintenance') : null)}
      ${_catCard(t('health.cat_errors'), scores.errors, [
        [t('health.total_errors'), details.errors.total],
        [t('health.errors_7d'), details.errors.recent7d],
        [t('health.unacknowledged'), details.errors.unacknowledged]
      ], details.errors.unacknowledged > 0 ? t('health.tip_errors') : null)}
      ${_catCard(t('health.cat_upkeep'), scores.upkeep, [
        [t('health.total_hours'), details.upkeep.totalHours + 'h'],
        [t('health.total_filament'), details.upkeep.totalFilamentKg + ' kg'],
        [t('health.total_prints'), details.upkeep.totalPrints]
      ], null)}
    `;
  }

  function _catCard(title, score, items, tip) {
    const color = _scoreColor(score);
    let html = `<div class="hs-cat">
      <div class="hs-cat-header">
        <span class="hs-cat-title">${title}</span>
        <span class="hs-cat-score" style="color:${color}">${score}</span>
      </div>
      <div class="hs-cat-bar"><div class="hs-cat-fill" style="width:${score}%;background:${color}"></div></div>`;
    for (const [label, value] of items) {
      html += `<div class="hs-item"><span class="hs-item-label">${label}</span><span class="hs-item-value">${value}</span></div>`;
    }
    if (tip) html += `<div class="hs-tip">${tip}</div>`;
    html += '</div>';
    return html;
  }

  function _scoreColor(score) {
    if (score >= 80) return 'var(--accent-green)';
    if (score >= 60) return '#f59e0b';
    return 'var(--accent-red)';
  }

  function _scoreGrade(score) {
    if (score >= 90) return t('health.grade_excellent');
    if (score >= 80) return t('health.grade_good');
    if (score >= 60) return t('health.grade_fair');
    if (score >= 40) return t('health.grade_poor');
    return t('health.grade_critical');
  }
})();
