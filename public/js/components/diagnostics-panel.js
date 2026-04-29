// Diagnostics Panel — combines Overview, Health, Telemetry, and Bed Mesh into a tabbed view
(function() {
  'use strict';
  let _activeTab = 'diagnostics';

  function _t(k, fb) { if (typeof t === 'function') { const v = t(k); if (v && v !== k) return v; } return fb || k; }
  function _esc(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  const TABS = [
    { id: 'diagnostics', labelKey: 'tabs.diagnostics_overview', fallback: 'Overview' },
    { id: 'health', labelKey: 'tabs.health', fallback: 'Health Score' },
    { id: 'telemetry', labelKey: 'tabs.telemetry', fallback: 'Telemetry' },
    { id: 'bedmesh', labelKey: 'tabs.bedmesh', fallback: 'Bed Mesh' }
  ];

  function _tabBarHtml() {
    return '<div class="tabs _wrapper-tabs">' + TABS.map(tab => {
      const label = (typeof t === 'function' && t(tab.labelKey) !== tab.labelKey ? t(tab.labelKey) : tab.fallback);
      const active = _activeTab === tab.id ? ' active' : '';
      return `<button class="tab-btn${active}" onclick="_switchDiagTab('${tab.id}')">${label}</button>`;
    }).join('') + '</div>';
  }

  function _ensureTabBar() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;
    const old = body.querySelector('._wrapper-tabs');
    if (old) old.remove();
    body.insertAdjacentHTML('afterbegin', _tabBarHtml());
  }

  window._switchDiagTab = function(tab) {
    _activeTab = tab;
    history.replaceState(null, '', '#' + tab);
    window._activePanel = tab;
    _renderDiag();
  };

  async function _renderDiag() {
    if (_activeTab === 'diagnostics') await _loadOverview();
    else if (_activeTab === 'health' && typeof loadHealthPanel === 'function') await loadHealthPanel();
    else if (_activeTab === 'telemetry' && typeof loadTelemetryPanel === 'function') await loadTelemetryPanel();
    else if (_activeTab === 'bedmesh' && typeof loadBedMeshPanel === 'function') await loadBedMeshPanel();
    _ensureTabBar();
  }

  // ── Overview: quick summary cards for each sub-panel ──
  async function _loadOverview() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    const tabBar = el.querySelector('._wrapper-tabs');
    el.innerHTML = '';
    if (tabBar) el.appendChild(tabBar);
    el.insertAdjacentHTML('beforeend', '<div class="matrec-empty"><div class="matrec-spinner"></div></div>');

    const pid = window.printerState?.getActivePrinterId();

    // Load data in parallel
    let healthData = null, telemetryLive = null, meshData = null;
    try {
      const promises = [];
      if (pid) {
        promises.push(
          Promise.all([
            fetch(`/api/maintenance/status?printer_id=${pid}`).then(r => r.ok ? r.json() : {}),
            fetch(`/api/statistics?printer_id=${pid}`).then(r => r.ok ? r.json() : {}),
            fetch(`/api/errors?printer_id=${pid}&limit=20`).then(r => r.ok ? r.json() : [])
          ]).then(([maint, stats, errors]) => { healthData = { maint, stats, errors }; }),
          fetch(`/api/printers/${pid}/bed-mesh`).then(r => r.ok ? r.json() : null).then(d => { meshData = d; })
        );
      }
      await Promise.all(promises);
    } catch {}

    // Get live state
    if (pid && window.printerState?.printers?.[pid]) {
      const ps = window.printerState.printers[pid];
      telemetryLive = ps.print || ps;
    }

    let h = '<div class="diag-overview">';

    // ── Health card ──
    h += _buildHealthCard(healthData, pid);

    // ── Telemetry card ──
    h += _buildTelemetryCard(telemetryLive, pid);

    // ── Bed Mesh card ──
    h += _buildMeshCard(meshData, pid);

    h += '</div>';

    const tb = el.querySelector('._wrapper-tabs');
    el.innerHTML = '';
    if (tb) el.appendChild(tb);
    el.insertAdjacentHTML('beforeend', h);
  }

  function _buildHealthCard(data, pid) {
    let score = '--', color = 'var(--text-muted)', subtitle = _t('diagnostics.no_data', 'No data');
    let stats = '';

    if (data && pid) {
      // Quick health calc
      const maint = data.maint;
      const statsObj = data.stats;
      const errorList = Array.isArray(data.errors) ? data.errors : (data.errors?.errors || []);

      const overdueCount = (maint.components || []).filter(c => c.overdue).length;
      const totalPrints = statsObj.total_prints || 0;
      const successRate = totalPrints > 0 ? Math.round((statsObj.completed_prints || 0) / totalPrints * 100) : 100;
      const recentErrors = errorList.filter(e => Date.now() - new Date(e.timestamp).getTime() < 7 * 86400000).length;

      let healthScore = Math.max(0, Math.min(100, Math.round(
        Math.max(0, 100 - overdueCount * 20) * 0.30 +
        Math.min(100, successRate) * 0.35 +
        Math.max(0, 100 - recentErrors * 5) * 0.20 +
        85 * 0.15
      )));

      score = healthScore;
      color = healthScore >= 80 ? 'var(--accent-green)' : healthScore >= 60 ? '#f59e0b' : 'var(--accent-red)';
      subtitle = healthScore >= 80 ? _t('health.grade_good', 'Good') : healthScore >= 60 ? _t('health.grade_fair', 'OK') : _t('health.grade_poor', 'Poor');

      stats = `<div class="diag-card-stats">
        <div class="diag-card-stat"><div class="diag-card-stat-value" style="color:var(--accent-green)">${successRate}%</div><div class="diag-card-stat-label">${_t('health.success_rate', 'Success rate')}</div></div>
        <div class="diag-card-stat"><div class="diag-card-stat-value" style="color:${overdueCount > 0 ? 'var(--accent-red)' : 'var(--text-primary)'}">${overdueCount}</div><div class="diag-card-stat-label">${_t('health.overdue', 'Overdue')}</div></div>
        <div class="diag-card-stat"><div class="diag-card-stat-value">${totalPrints}</div><div class="diag-card-stat-label">${_t('health.total_prints', 'Prints')}</div></div>
        <div class="diag-card-stat"><div class="diag-card-stat-value" style="color:${recentErrors > 0 ? '#f59e0b' : 'var(--text-primary)'}">${recentErrors}</div><div class="diag-card-stat-label">${_t('health.errors_7d', 'Errors 7d')}</div></div>
      </div>`;
    }

    return `<div class="diag-card" onclick="_switchDiagTab('health')">
      <div class="diag-card-header">
        <div class="diag-card-icon" style="background:rgba(0,174,66,0.1);color:var(--accent-green)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </div>
        <div>
          <div class="diag-card-title">${_t('tabs.health', 'Health Score')}</div>
          <div class="diag-card-subtitle">${subtitle}</div>
        </div>
        <div style="margin-left:auto;font-size:1.8rem;font-weight:900;color:${color}">${score}</div>
      </div>
      ${stats}
      <div class="diag-card-footer">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        ${_t('diagnostics.view_details', 'View details')}
      </div>
    </div>`;
  }

  function _buildTelemetryCard(live, pid) {
    let stats = '';
    let subtitle = _t('diagnostics.no_data', 'No data');

    if (live && pid) {
      const nozzle = Math.round(live.nozzle_temper || 0);
      const bed = Math.round(live.bed_temper || 0);
      const state = live.gcode_state || 'IDLE';
      const progress = live.mc_percent || 0;
      const stateLabels = { RUNNING: _t('status.printing', 'Printing'), PAUSE: _t('status.paused', 'Paused'), FINISH: _t('status.finished', 'Done'), FAILED: _t('status.failed', 'Failed') };
      subtitle = stateLabels[state] || _t('status.idle', 'Idle');

      stats = `<div class="diag-card-stats">
        <div class="diag-card-stat"><div class="diag-card-stat-value" style="color:#ff5252">${nozzle}°C</div><div class="diag-card-stat-label">${_t('temperature.nozzle', 'Nozzle')}</div></div>
        <div class="diag-card-stat"><div class="diag-card-stat-value" style="color:#1279ff">${bed}°C</div><div class="diag-card-stat-label">${_t('temperature.bed', 'Bed')}</div></div>
        <div class="diag-card-stat"><div class="diag-card-stat-value" style="color:#00e676">${progress}%</div><div class="diag-card-stat-label">${_t('telemetry.print_progress', 'Progress')}</div></div>
        <div class="diag-card-stat"><div class="diag-card-stat-value">${live.spd_mag || 100}%</div><div class="diag-card-stat-label">${_t('speed.label', 'Speed')}</div></div>
      </div>`;
    }

    return `<div class="diag-card" onclick="_switchDiagTab('telemetry')">
      <div class="diag-card-header">
        <div class="diag-card-icon" style="background:rgba(18,121,255,0.1);color:#1279ff">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        </div>
        <div>
          <div class="diag-card-title">${_t('tabs.telemetry', 'Telemetry')}</div>
          <div class="diag-card-subtitle">${subtitle}</div>
        </div>
      </div>
      ${stats}
      <div class="diag-card-footer">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        ${_t('diagnostics.view_details', 'View details')}
      </div>
    </div>`;
  }

  function _buildMeshCard(data, pid) {
    let stats = '';
    let subtitle = _t('diagnostics.no_data', 'No data');

    if (data?.latest && pid) {
      const mesh = data.latest;
      const range = ((mesh.z_max || 0) - (mesh.z_min || 0)).toFixed(3);
      const rangeNum = parseFloat(range);
      const quality = rangeNum < 0.1 ? _t('bedmesh.excellent', 'Excellent') : rangeNum < 0.2 ? _t('bedmesh.good', 'Good') : rangeNum < 0.3 ? _t('bedmesh.fair', 'OK') : _t('bedmesh.poor', 'Poor');
      const qualColor = rangeNum < 0.1 ? 'var(--accent-green)' : rangeNum < 0.3 ? '#f59e0b' : 'var(--accent-red)';
      subtitle = quality;

      stats = `<div class="diag-card-stats">
        <div class="diag-card-stat"><div class="diag-card-stat-value" style="color:${qualColor}">${range}</div><div class="diag-card-stat-label">${_t('bedmesh.z_range', 'Z range')} (mm)</div></div>
        <div class="diag-card-stat"><div class="diag-card-stat-value">${mesh.mesh_rows || '?'}x${mesh.mesh_cols || '?'}</div><div class="diag-card-stat-label">${_t('bedmesh.grid', 'Grid')}</div></div>
        <div class="diag-card-stat"><div class="diag-card-stat-value">${(mesh.z_mean || 0).toFixed(3)}</div><div class="diag-card-stat-label">${_t('bedmesh.z_mean', 'Z mean')} (mm)</div></div>
        <div class="diag-card-stat"><div class="diag-card-stat-value">${(data.history || []).length}</div><div class="diag-card-stat-label">${_t('bedmesh.history', 'History')}</div></div>
      </div>`;
    }

    return `<div class="diag-card" onclick="_switchDiagTab('bedmesh')">
      <div class="diag-card-header">
        <div class="diag-card-icon" style="background:rgba(245,158,11,0.1);color:#f59e0b">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
        </div>
        <div>
          <div class="diag-card-title">${_t('tabs.bedmesh', 'Bed Mesh')}</div>
          <div class="diag-card-subtitle">${subtitle}</div>
        </div>
      </div>
      ${stats}
      <div class="diag-card-footer">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        ${_t('diagnostics.view_details', 'View details')}
      </div>
    </div>`;
  }

  window.loadDiagnosticsPanel = function(initialTab) {
    _activeTab = initialTab || 'diagnostics';
    _renderDiag();
  };
})();
