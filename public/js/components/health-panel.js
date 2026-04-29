// Printer Health Score — aggregated printer health overview with multi-printer support
(function() {
  'use strict';
  let _data = null;
  let _selectedPrinter = null;

  function _t(k, fb) { if (typeof t === 'function') { const v = t(k); if (v && v !== k) return v; } return fb || k; }

  window.loadHealthPanel = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    // Keep tab bar if present
    const tabBar = el.querySelector('._wrapper-tabs');
    el.innerHTML = '';
    if (tabBar) el.appendChild(tabBar);
    el.insertAdjacentHTML('beforeend', '<div class="matrec-empty"><div class="matrec-spinner"></div></div>');

    _selectedPrinter = _selectedPrinter || window.printerState?.getActivePrinterId();
    _loadHealth(el);
  };

  async function _loadHealth(el) {
    // Get all printers
    const printers = [];
    if (window.printerState?.printers) {
      for (const [id, ps] of Object.entries(window.printerState.printers)) {
        const name = ps.print?.name || ps.name || id;
        printers.push({ id, name });
      }
    }

    if (!printers.length) {
      _replaceContent(el, `<div class="epa-empty"><div class="epa-empty-icon">🖨</div><div class="epa-empty-title">${_t('health.no_printer', 'No printers connected')}</div></div>`);
      return;
    }

    if (!_selectedPrinter || !printers.find(p => p.id === _selectedPrinter)) {
      _selectedPrinter = printers[0].id;
    }

    try {
      const [maint, stats, errors] = await Promise.all([
        fetch(`/api/maintenance/status?printer_id=${_selectedPrinter}`).then(r => r.ok ? r.json() : {}),
        fetch(`/api/statistics?printer_id=${_selectedPrinter}`).then(r => r.ok ? r.json() : {}),
        fetch(`/api/errors?printer_id=${_selectedPrinter}&limit=50`).then(r => r.ok ? r.json() : [])
      ]);

      _data = _computeHealth(maint, stats, errors);
      _render(el, printers);
    } catch (e) {
      _replaceContent(el, `<div class="epa-empty"><div class="epa-empty-icon">❌</div><div class="epa-empty-title">${_t('health.load_error', 'Could not load health data')}</div><div class="epa-empty-desc">${e.message}</div></div>`);
    }
  }

  function _replaceContent(el, html) {
    const tabBar = el.querySelector('._wrapper-tabs');
    el.innerHTML = '';
    if (tabBar) el.appendChild(tabBar);
    el.insertAdjacentHTML('beforeend', html);
  }

  window._hsSelectPrinter = function(pid) {
    _selectedPrinter = pid;
    window.loadHealthPanel();
  };

  function _computeHealth(maint, stats, errors) {
    const scores = {};
    const details = {};

    // 1. Maintenance score
    let maintScore = 100;
    const overdueCount = (maint.components || []).filter(c => c.overdue).length;
    const nearDueCount = (maint.components || []).filter(c => c.percentage > 80 && !c.overdue).length;
    maintScore -= overdueCount * 20;
    maintScore -= nearDueCount * 5;
    const nozzleWear = maint.active_nozzle?.wear_estimate?.percentage || 0;
    if (nozzleWear > 80) maintScore -= 15;
    else if (nozzleWear > 50) maintScore -= 5;
    scores.maintenance = Math.max(0, Math.min(100, maintScore));
    details.maintenance = {
      overdue: overdueCount, nearDue: nearDueCount,
      nozzleWear: Math.round(nozzleWear),
      nozzleCondition: maint.active_nozzle?.wear_estimate?.condition || '--',
      totalHours: maint.total_print_hours || 0
    };

    // 2. Reliability
    const totalPrints = stats.total_prints || 0;
    const successRate = totalPrints > 0 ? ((stats.completed_prints || 0) / totalPrints * 100) : 100;
    let reliabilityScore = successRate;
    if (totalPrints < 5) reliabilityScore = 80;
    scores.reliability = Math.max(0, Math.min(100, Math.round(reliabilityScore)));
    details.reliability = {
      successRate: successRate.toFixed(1), totalPrints,
      completed: stats.completed_prints || 0, failed: stats.failed_prints || 0,
      cancelled: stats.cancelled_prints || 0, streak: stats.current_streak || 0
    };

    // 3. Errors
    const errorList = Array.isArray(errors) ? errors : (errors.errors || []);
    const recentErrors = errorList.filter(e => Date.now() - new Date(e.timestamp).getTime() < 7 * 86400000);
    let errorScore = 100;
    errorScore -= Math.min(50, recentErrors.length * 5);
    const unacked = errorList.filter(e => !e.acknowledged).length;
    errorScore -= Math.min(20, unacked * 2);
    scores.errors = Math.max(0, Math.min(100, errorScore));
    details.errors = { total: errorList.length, recent7d: recentErrors.length, unacknowledged: unacked };

    // 4. Upkeep
    let upkeepScore = 100;
    const hours = maint.total_print_hours || 0;
    if (hours > 2000) upkeepScore -= 15;
    else if (hours > 1000) upkeepScore -= 5;
    const filamentKg = (maint.total_filament_g || 0) / 1000;
    if (filamentKg > 50) upkeepScore -= 10;
    scores.upkeep = Math.max(0, Math.min(100, upkeepScore));
    details.upkeep = { totalHours: hours.toFixed(1), totalFilamentKg: filamentKg.toFixed(1), totalPrints };

    const overall = Math.round(scores.maintenance * 0.30 + scores.reliability * 0.35 + scores.errors * 0.20 + scores.upkeep * 0.15);
    return { overall, scores, details };
  }

  function _render(el, printers) {
    if (!_data) return;
    const { overall, scores, details } = _data;
    const color = _scoreColor(overall);
    const grade = _scoreGrade(overall);
    const circumference = 2 * Math.PI * 50;
    const offset = circumference * (1 - overall / 100);

    // Printer selector
    let h = '<div class="hs-printer-bar">';
    for (const p of printers) {
      const active = p.id === _selectedPrinter ? ' active' : '';
      h += `<button class="hs-printer-btn${active}" onclick="_hsSelectPrinter('${p.id}')">${_esc(p.name)}</button>`;
    }
    h += '</div>';

    // 2-column layout
    h += '<div class="hs-layout"><div class="hs-col-left">';

    // Hero
    let badges = '';
    if (details.maintenance.overdue > 0) badges += `<span class="hs-badge hs-badge-bad">${details.maintenance.overdue} ${_t('health.overdue', 'overdue')}</span>`;
    if (details.errors.recent7d > 0) badges += `<span class="hs-badge hs-badge-warn">${details.errors.recent7d} ${_t('health.recent_errors', 'errors last 7d')}</span>`;
    if (details.reliability.streak > 5) badges += `<span class="hs-badge hs-badge-good">${details.reliability.streak} ${_t('health.streak', 'in a row')}</span>`;
    if (details.maintenance.nozzleWear > 80) badges += `<span class="hs-badge hs-badge-bad">${_t('health.nozzle_worn', 'Nozzle worn')}</span>`;

    h += `<div class="hs-score-hero">
      <div class="hs-ring-wrap">
        <svg class="hs-ring" viewBox="0 0 120 120" width="120" height="120">
          <circle class="hs-ring-bg" cx="60" cy="60" r="50"/>
          <circle class="hs-ring-fill" cx="60" cy="60" r="50" stroke="${color}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
        </svg>
        <div class="hs-score-text">
          <div class="hs-score-num" style="color:${color}">${overall}</div>
          <div class="hs-score-label">${_t('health.score', 'Health Score')}</div>
        </div>
      </div>
      <div class="hs-hero-info">
        <div class="hs-hero-title">${grade}</div>
        <div class="hs-hero-subtitle">${_t('health.based_on', 'Based on')} ${details.upkeep.totalHours}t, ${details.reliability.totalPrints} ${_t('health.prints', 'prints')}</div>
        <div class="hs-hero-badges">${badges || `<span class="hs-badge hs-badge-good">${_t('health.all_good', 'All looks good')}</span>`}</div>
      </div>
    </div>`;

    // Quick stats strip
    h += `<div class="epa-summary-grid">
      ${_summaryCard(scores.reliability, _t('health.cat_reliability', 'Reliability'), _scoreColor(scores.reliability))}
      ${_summaryCard(scores.maintenance, _t('health.cat_maintenance', 'Maintenance'), _scoreColor(scores.maintenance))}
      ${_summaryCard(scores.errors, _t('health.cat_errors', 'Errors'), _scoreColor(scores.errors))}
      ${_summaryCard(scores.upkeep, _t('health.cat_upkeep', 'Condition'), _scoreColor(scores.upkeep))}
    </div>`;

    h += '</div><div class="hs-col-right">';

    // Category detail cards
    h += '<div class="hs-categories">';
    h += _catCard(_t('health.cat_reliability', 'Reliability'), scores.reliability, [
      [_t('health.success_rate', 'Success rate'), details.reliability.successRate + '%'],
      [_t('health.completed', 'Completed'), details.reliability.completed],
      [_t('health.failed', 'Failed'), details.reliability.failed],
      [_t('health.cancelled', 'Cancelled'), details.reliability.cancelled],
      [_t('health.current_streak', 'Streak'), details.reliability.streak]
    ], scores.reliability < 80 ? _t('health.tip_reliability', 'Success rate is below 80%. Check filament, bed adhesion and slicer settings.') : null);

    h += _catCard(_t('health.cat_maintenance', 'Maintenance'), scores.maintenance, [
      [_t('health.overdue_items', 'Overdue'), details.maintenance.overdue],
      [_t('health.near_due', 'Near deadline'), details.maintenance.nearDue],
      [_t('health.nozzle_wear', 'Nozzle wear'), details.maintenance.nozzleWear + '%'],
      [_t('health.nozzle_condition', 'Nozzle condition'), details.maintenance.nozzleCondition],
      [_t('health.total_hours', 'Total hours'), details.maintenance.totalHours.toFixed(0) + 't']
    ], details.maintenance.overdue > 0 ? _t('health.tip_maintenance', 'You have overdue maintenance. Go to Maintenance to update.') : null);

    h += _catCard(_t('health.cat_errors', 'Errors'), scores.errors, [
      [_t('health.total_errors', 'Total errors'), details.errors.total],
      [_t('health.errors_7d', 'Errors last 7d'), details.errors.recent7d],
      [_t('health.unacknowledged', 'Unacknowledged'), details.errors.unacknowledged]
    ], details.errors.unacknowledged > 0 ? _t('health.tip_errors', 'You have unacknowledged errors. Go to Error Log to acknowledge them.') : null);

    h += _catCard(_t('health.cat_upkeep', 'Condition'), scores.upkeep, [
      [_t('health.total_hours', 'Total hours'), details.upkeep.totalHours + 't'],
      [_t('health.total_filament', 'Total filament'), details.upkeep.totalFilamentKg + ' kg'],
      [_t('health.total_prints', 'Total prints'), details.upkeep.totalPrints]
    ], null);

    h += '</div></div></div>';

    _replaceContent(el, h);
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

  function _summaryCard(value, label, color) {
    return `<div class="epa-summary-card">
      <div class="epa-summary-value" style="color:${color}">${value}</div>
      <div class="epa-summary-label">${label}</div>
    </div>`;
  }

  function _scoreColor(score) {
    if (score >= 80) return 'var(--accent-green)';
    if (score >= 60) return '#f59e0b';
    return 'var(--accent-red)';
  }

  function _scoreGrade(score) {
    if (score >= 90) return _t('health.grade_excellent', 'Excellent');
    if (score >= 80) return _t('health.grade_good', 'Good');
    if (score >= 60) return _t('health.grade_fair', 'OK');
    if (score >= 40) return _t('health.grade_poor', 'Poor');
    return _t('health.grade_critical', 'Critical');
  }

  function _esc(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
})();
