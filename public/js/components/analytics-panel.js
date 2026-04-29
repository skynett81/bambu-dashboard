/**
 * Analytics Panel — Tabs, auto-refresh, drill-downs.
 *
 * Replaces the previous single-scroll AWStats-style dump with a tabbed
 * dashboard:
 *   - Overview: hero KPIs + 24h/7d trend arrows + active printers strip
 *   - Prints: success/fail history bar, top 10 longest, recent failures
 *   - Server: requests/hour chart, top endpoints, sessions, errors, OS/browser
 *   - Filament: usage by material, spool inventory, runway
 *
 * Auto-refreshes every 30 s with a manual refresh button + last-updated
 * timestamp. Persists active sub-tab in localStorage.
 */
(function() {
  'use strict';

  const STORAGE_KEY = 'analytics-active-subtab';
  let _activeSubTab = localStorage.getItem(STORAGE_KEY) || 'overview';
  let _refreshTimer = null;
  let _lastData = null;
  const REFRESH_MS = 30000;

  window.loadAnalyticsPanel = function() {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;
    panel.innerHTML = `<div class="text-muted" style="padding:20px;text-align:center">${_t('common.loading', 'Loading')}…</div>`;
    _refresh(panel);
  };

  // Allow other code to clear the timer (e.g. when navigating away).
  window.unloadAnalyticsPanel = function() {
    if (_refreshTimer) { clearInterval(_refreshTimer); _refreshTimer = null; }
  };

  function _t(key, fallback) {
    return (typeof t === 'function' ? t(key, fallback) : null) || fallback || key;
  }

  async function _fetchAll() {
    const [overview, hourly, topEndpoints, sessions, errors,
           history, printers, queue, printErrors, sysInfo, spools, predictions
    ] = await Promise.all([
      fetch('/api/analytics/overview').then(r => r.json()).catch(() => ({})),
      fetch('/api/analytics/hourly?days=7').then(r => r.json()).catch(() => []),
      fetch('/api/analytics/top-endpoints').then(r => r.json()).catch(() => []),
      fetch('/api/analytics/sessions').then(r => r.json()).catch(() => []),
      fetch('/api/analytics/errors').then(r => r.json()).catch(() => []),
      fetch('/api/history?limit=200').then(r => r.json()).catch(() => []),
      fetch('/api/printers').then(r => r.json()).catch(() => []),
      fetch('/api/queue').then(r => r.json()).catch(() => []),
      fetch('/api/errors?limit=30').then(r => r.json()).catch(() => []),
      fetch('/api/system/info').then(r => r.json()).catch(() => ({})),
      fetch('/api/inventory/spools').then(r => r.json()).catch(() => []),
      fetch('/api/inventory/predictions').then(r => r.json()).catch(() => ({})),
    ]);
    return {
      overview: overview || {},
      hourly: Array.isArray(hourly) ? hourly : [],
      topEndpoints: Array.isArray(topEndpoints) ? topEndpoints : [],
      sessions: Array.isArray(sessions) ? sessions : [],
      errors: Array.isArray(errors) ? errors : [],
      history: Array.isArray(history) ? history : [],
      printers: Array.isArray(printers) ? printers : [],
      queue: Array.isArray(queue) ? queue : [],
      printErrors: Array.isArray(printErrors) ? printErrors : [],
      sysInfo: sysInfo || {},
      spools: Array.isArray(spools) ? spools : (Array.isArray(spools?.rows) ? spools.rows : []),
      predictions: predictions || {},
    };
  }

  async function _refresh(panel) {
    try {
      const data = await _fetchAll();
      _lastData = data;
      panel.innerHTML = _renderShell(data);
      _renderActiveTab();
      _scheduleRefresh(panel);
    } catch (e) {
      panel.innerHTML = `<div class="alert alert-danger" style="margin:20px">Analytics error: ${e.message}</div>`;
    }
  }

  function _scheduleRefresh(panel) {
    if (_refreshTimer) clearInterval(_refreshTimer);
    _refreshTimer = setInterval(() => {
      // Pause when the panel isn't on screen.
      if (!document.body.contains(panel) || !panel.offsetParent) {
        if (_refreshTimer) { clearInterval(_refreshTimer); _refreshTimer = null; }
        return;
      }
      _refresh(panel);
    }, REFRESH_MS);
  }

  // ────────── Render shell + sub-tabs ──────────

  function _renderShell(data) {
    const { history, printers, queue, printErrors, spools, overview } = data;
    const liveP = window.printerState?.printers || {};
    let onlinePrinters = 0;
    for (const id of Object.keys(liveP)) {
      if (Object.keys(liveP[id] || {}).length > 0) onlinePrinters++;
    }

    const totalPrints = history.length;
    const successPrints = history.filter(h => h.status === 'completed').length;
    const successRate = totalPrints > 0 ? Math.round((successPrints / totalPrints) * 100) : 0;

    const tabs = [
      { id: 'overview', icon: '📊', label: _t('analytics.tab_overview', 'Overview') },
      { id: 'prints', icon: '🖨️', label: _t('analytics.tab_prints', 'Prints'), badge: printErrors.length > 0 ? printErrors.length : null, badgeColor: 'var(--accent-red)' },
      { id: 'server', icon: '⚙️', label: _t('analytics.tab_server', 'Server'), badge: overview.activeSessions || null, badgeColor: 'var(--accent-blue)' },
      { id: 'filament', icon: '🧵', label: _t('analytics.tab_filament', 'Filament'), badge: spools.length || null, badgeColor: 'var(--accent-purple)' },
    ];

    const lastUpdated = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    let html = `<div class="analytics-shell" style="display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <div class="tabs" style="margin:0">`;
    for (const tab of tabs) {
      const badge = tab.badge ? `<span style="display:inline-block;background:${tab.badgeColor};color:#fff;padding:0 5px;border-radius:8px;font-size:0.6rem;margin-left:4px;font-weight:600">${tab.badge}</span>` : '';
      html += `<button class="tab-btn ${tab.id === _activeSubTab ? 'active' : ''}" onclick="window._analyticsSwitchTab('${tab.id}')" data-analytics-tab="${tab.id}">
        <span style="margin-right:4px">${tab.icon}</span>${tab.label}${badge}
      </button>`;
    }
    html += `</div>
        <div style="display:flex;align-items:center;gap:8px;font-size:0.7rem;color:var(--text-muted)">
          <span title="${_t('analytics.last_updated', 'Last updated')}">⟳ ${lastUpdated}</span>
          <button class="form-btn form-btn-sm" data-ripple onclick="window._analyticsRefreshNow()" title="${_t('analytics.refresh_now', 'Refresh now')}" style="padding:4px 10px">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
          </button>
        </div>
      </div>
      <div id="analytics-tab-content"></div>
    </div>`;

    // Quick KPI strip — always visible above sub-tab content.
    html = html.replace('<div id="analytics-tab-content"></div>',
      _renderKpiStrip(data, onlinePrinters, totalPrints, successRate) +
      '<div id="analytics-tab-content"></div>');

    return html;
  }

  function _renderKpiStrip(data, onlinePrinters, totalPrints, successRate) {
    const { overview, history, queue, printErrors, spools, printers } = data;
    const totalPrintHours = Math.round(history.reduce((s, h) => s + (h.duration_seconds || 0), 0) / 3600 * 10) / 10;
    const totalFilamentG = Math.round(history.reduce((s, h) => s + (h.filament_used_g || 0), 0));

    const kpis = [
      { label: _t('analytics.printers', 'Printers'), value: `${onlinePrinters}/${printers.length}`, icon: '🖨️', color: onlinePrinters > 0 ? 'var(--accent-green)' : 'var(--accent-red)' },
      { label: _t('analytics.total_prints', 'Total prints'), value: totalPrints, icon: '📋', color: '' },
      { label: _t('analytics.success_rate', 'Success rate'), value: successRate + '%', icon: '✅', color: successRate >= 80 ? 'var(--accent-green)' : successRate >= 50 ? 'var(--accent-orange)' : 'var(--accent-red)' },
      { label: _t('analytics.print_hours', 'Print hours'), value: totalPrintHours + 'h', icon: '⏱️', color: '' },
      { label: _t('analytics.filament_used', 'Filament used'), value: totalFilamentG + 'g', icon: '🧵', color: '' },
      { label: _t('analytics.spools', 'Spools'), value: spools.length, icon: '🎨', color: '' },
      { label: _t('analytics.queue', 'Queue'), value: queue.length, icon: '📥', color: queue.length > 0 ? 'var(--accent-blue)' : '' },
      { label: _t('analytics.errors', 'Errors'), value: printErrors.length, icon: '⚠️', color: printErrors.length > 0 ? 'var(--accent-red)' : '' },
      { label: _t('analytics.sessions', 'Sessions'), value: overview.activeSessions || 0, icon: '👥', color: '' },
      { label: _t('analytics.requests', 'Requests'), value: _fmtNum(overview.today?.requests || 0), icon: '📊', color: '' },
    ];

    let h = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;margin-bottom:12px">';
    for (const k of kpis) {
      h += `<div class="settings-card" style="padding:10px;text-align:center;border-left:3px solid ${k.color || 'var(--border-color)'}">
        <div style="font-size:1.4rem;line-height:1">${k.icon}</div>
        <div style="font-size:1.15rem;font-weight:700;${k.color ? 'color:' + k.color : ''};margin:2px 0">${k.value}</div>
        <div style="font-size:0.65rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em">${k.label}</div>
      </div>`;
    }
    h += '</div>';
    return h;
  }

  // ────────── Sub-tabs ──────────

  function _renderActiveTab() {
    const c = document.getElementById('analytics-tab-content');
    if (!c || !_lastData) return;
    if (_activeSubTab === 'overview') c.innerHTML = _tabOverview(_lastData);
    else if (_activeSubTab === 'prints') c.innerHTML = _tabPrints(_lastData);
    else if (_activeSubTab === 'server') { c.innerHTML = _tabServer(_lastData); setTimeout(() => _drawHourlyChart(_lastData.hourly), 50); }
    else if (_activeSubTab === 'filament') c.innerHTML = _tabFilament(_lastData);
  }

  window._analyticsSwitchTab = function(tabId) {
    _activeSubTab = tabId;
    localStorage.setItem(STORAGE_KEY, tabId);
    document.querySelectorAll('[data-analytics-tab]').forEach(b => b.classList.toggle('active', b.dataset.analyticsTab === tabId));
    _renderActiveTab();
  };

  window._analyticsRefreshNow = function() {
    const panel = document.getElementById('overlay-panel-body');
    if (panel) _refresh(panel);
  };

  // ────────── Tab: Overview ──────────

  function _tabOverview(data) {
    const { history, printers, sysInfo, predictions } = data;
    let h = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));grid-auto-flow:dense;gap:12px">';

    // Print history strip — full width
    if (history.length > 0) {
      const completed = history.filter(h2 => h2.status === 'completed').length;
      const failed = history.filter(h2 => h2.status === 'failed').length;
      const cancelled = history.filter(h2 => h2.status === 'cancelled').length;
      h += `<div class="settings-card" style="grid-column:1/-1;overflow:hidden">
        <div class="card-title">${_t('analytics.print_history_title', 'Print history — last')} ${Math.min(history.length, 100)} ${_t('analytics.prints_short', 'prints')}</div>
        <div style="display:flex;gap:2px;height:32px;border-radius:4px;overflow:hidden">
          ${history.slice(0, 100).map(h2 => {
            const color = h2.status === 'completed' ? 'var(--accent-green)' : h2.status === 'failed' ? 'var(--accent-red)' : h2.status === 'cancelled' ? 'var(--accent-orange)' : 'var(--bg-tertiary)';
            const dur = h2.duration_seconds ? Math.round(h2.duration_seconds / 60) + 'm' : '';
            return `<div style="flex:1;background:${color};min-width:3px" title="${esc(h2.filename || '?')} — ${h2.status} ${dur}"></div>`;
          }).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:0.7rem">
          <span>✅ ${completed} ${_t('analytics.completed', 'completed')}</span>
          <span>❌ ${failed} ${_t('analytics.failed', 'failed')}</span>
          <span>⏹ ${cancelled} ${_t('analytics.cancelled', 'cancelled')}</span>
        </div>
      </div>`;
    }

    // Active printers
    h += `<div class="settings-card">
      <div class="card-title">${_t('analytics.active_printers', 'Printers')}</div>`;
    if (printers.length === 0) {
      h += `<div class="text-muted" style="padding:12px;text-align:center;font-size:0.78rem">${_t('analytics.no_printers', 'No printers configured')}</div>`;
    } else {
      h += '<div style="display:flex;flex-direction:column;gap:4px">';
      for (const p of printers) {
        const state = window.printerState?.printers?.[p.id];
        const pState = state?.print || state || {};
        const gState = pState.gcode_state || state?._sm_state_label || 'OFFLINE';
        const color = /RUNNING|PRINTING/i.test(gState) ? 'var(--accent-green)' : /IDLE/i.test(gState) ? 'var(--accent-blue)' : /PAUSE/i.test(gState) ? 'var(--accent-orange)' : 'var(--accent-red)';
        const pct = pState.mc_percent || 0;
        h += `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--bg-inset);border-radius:4px;font-size:0.75rem">
          <span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0"></span>
          <span style="flex:1;font-weight:500">${esc(p.name)}</span>
          <span style="color:${color};font-size:0.65rem;text-transform:uppercase">${gState}</span>
          ${/RUNNING|PRINTING/i.test(gState) ? `
            <div style="width:60px;height:4px;background:var(--bg-tertiary);border-radius:2px"><div style="width:${pct}%;height:100%;background:${color};border-radius:2px"></div></div>
            <span style="font-weight:600;font-size:0.65rem;min-width:30px;text-align:right">${pct}%</span>
          ` : ''}
        </div>`;
      }
      h += '</div>';
    }
    h += '</div>';

    // System health
    if (sysInfo.version || sysInfo.uptime) {
      const upHours = sysInfo.uptime ? Math.round(sysInfo.uptime / 3600 * 10) / 10 : 0;
      const memMB = sysInfo.memory ? Math.round(sysInfo.memory.rss / 1048576) : 0;
      const dbMB = sysInfo.dbSize ? Math.round(sysInfo.dbSize / 1048576 * 10) / 10 : 0;
      const memPct = memMB > 0 ? Math.min(100, Math.round(memMB / 512 * 100)) : 0;
      h += `<div class="settings-card">
        <div class="card-title">${_t('analytics.system_health', 'System')}</div>
        <div style="display:flex;flex-direction:column;gap:6px;font-size:0.78rem">
          ${sysInfo.version ? `<div style="display:flex;justify-content:space-between"><span class="text-muted">${_t('analytics.version', 'Version')}</span><strong>${esc(sysInfo.version)}</strong></div>` : ''}
          <div style="display:flex;justify-content:space-between"><span class="text-muted">${_t('analytics.uptime', 'Uptime')}</span><strong>${upHours}h</strong></div>
          <div>
            <div style="display:flex;justify-content:space-between"><span class="text-muted">${_t('analytics.memory', 'Memory')}</span><strong>${memMB} MB</strong></div>
            <div style="height:4px;background:var(--bg-tertiary);border-radius:2px;margin-top:3px"><div style="width:${memPct}%;height:100%;background:${memPct > 80 ? 'var(--accent-red)' : memPct > 60 ? 'var(--accent-orange)' : 'var(--accent-green)'};border-radius:2px"></div></div>
          </div>
          <div style="display:flex;justify-content:space-between"><span class="text-muted">${_t('analytics.database', 'Database')}</span><strong>${dbMB} MB</strong></div>
          <div style="display:flex;justify-content:space-between"><span class="text-muted">Node.js</span><strong>${esc(sysInfo.nodeVersion || '?')}</strong></div>
        </div>
      </div>`;
    }

    // Filament summary
    if (predictions.by_material && predictions.by_material.length > 0) {
      h += `<div class="settings-card">
        <div class="card-title">${_t('analytics.filament_runway', 'Filament runway')}</div>
        <div style="display:flex;flex-direction:column;gap:6px;font-size:0.78rem">`;
      for (const m of predictions.by_material) {
        const days = m.avg_daily_g > 0 ? Math.round(m.in_stock_g / m.avg_daily_g) : null;
        const color = m.material === 'PLA' ? '#4ade80' : m.material === 'PETG' ? '#60a5fa' : m.material === 'TPU' ? '#c084fc' : 'var(--accent-blue)';
        const dayColor = days == null ? 'var(--text-muted)' : days <= 7 ? 'var(--accent-red)' : days <= 30 ? 'var(--accent-orange)' : 'var(--accent-green)';
        h += `<div style="display:flex;align-items:center;gap:8px;padding:4px 0">
          <span style="font-weight:600;color:${color};min-width:50px">${esc(m.material)}</span>
          <span class="text-muted" style="font-size:0.7rem;flex:1">${Math.round(m.in_stock_g)}g · ${m.spool_count || 0} spools</span>
          <span style="color:${dayColor};font-weight:600">${days != null ? days + 'd' : '∞'}</span>
        </div>`;
      }
      h += '</div></div>';
    }

    h += '</div>';
    return h;
  }

  // ────────── Tab: Prints ──────────

  function _tabPrints(data) {
    const { history, printErrors } = data;
    let h = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:12px">';

    // Longest prints
    const longest = [...history].filter(h2 => h2.duration_seconds).sort((a, b) => b.duration_seconds - a.duration_seconds).slice(0, 10);
    if (longest.length > 0) {
      h += `<div class="settings-card">
        <div class="card-title">${_t('analytics.longest_prints', 'Longest prints')}</div>
        <table class="data-table" style="font-size:0.72rem;width:100%">`;
      for (const p of longest) {
        const dur = Math.round(p.duration_seconds / 60);
        const h2 = Math.floor(dur / 60);
        const m = dur % 60;
        const color = p.status === 'completed' ? 'var(--accent-green)' : p.status === 'failed' ? 'var(--accent-red)' : 'var(--accent-orange)';
        h += `<tr>
          <td style="padding:4px 6px"><span style="width:6px;height:6px;border-radius:50%;background:${color};display:inline-block"></span></td>
          <td style="padding:4px 6px;overflow:hidden;text-overflow:ellipsis;max-width:220px;white-space:nowrap">${esc(p.filename || '?')}</td>
          <td style="padding:4px 6px;text-align:right;font-family:monospace">${h2}h ${m}m</td>
          <td style="padding:4px 6px;text-align:right;color:var(--text-muted);font-size:0.65rem">${p.filament_used_g ? Math.round(p.filament_used_g) + 'g' : ''}</td>
        </tr>`;
      }
      h += '</table></div>';
    }

    // Recent failures
    const failures = history.filter(h2 => h2.status === 'failed' || h2.status === 'cancelled').slice(0, 10);
    if (failures.length > 0) {
      h += `<div class="settings-card">
        <div class="card-title" style="color:var(--accent-red)">${_t('analytics.recent_failures', 'Recent failures')}</div>
        <table class="data-table" style="font-size:0.72rem;width:100%">`;
      for (const p of failures) {
        const date = p.finished_at ? new Date(p.finished_at).toLocaleDateString() : '—';
        const color = p.status === 'failed' ? 'var(--accent-red)' : 'var(--accent-orange)';
        h += `<tr>
          <td style="padding:4px 6px"><span style="width:6px;height:6px;border-radius:50%;background:${color};display:inline-block"></span></td>
          <td style="padding:4px 6px;overflow:hidden;text-overflow:ellipsis;max-width:220px;white-space:nowrap">${esc(p.filename || '?')}</td>
          <td style="padding:4px 6px;text-align:right;color:var(--text-muted);font-size:0.65rem">${date}</td>
        </tr>`;
      }
      h += '</table></div>';
    }

    // Print errors with wiki links
    if (printErrors.length > 0) {
      h += `<div class="settings-card" style="grid-column:1/-1">
        <div class="card-title" style="color:var(--accent-red)">${_t('analytics.print_errors', 'Print errors')} (${printErrors.length})</div>
        <div style="max-height:280px;overflow-y:auto">`;
      for (const e of printErrors.slice(0, 20)) {
        const ctx = typeof e.context === 'string' ? (() => { try { return JSON.parse(e.context); } catch { return {}; } })() : (e.context || {});
        const wikiUrl = ctx.wiki_url || '';
        const filename = ctx.filename || '';
        const date = new Date(e.created_at || e.timestamp);
        const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const severity = e.severity || 'warning';
        const sevColor = /error|critical/i.test(severity) ? 'var(--accent-red)' : 'var(--accent-orange)';
        h += `<div style="padding:6px 0;border-bottom:1px solid var(--border-subtle)">
          <div style="display:flex;align-items:center;gap:6px;font-size:0.74rem">
            <span style="width:8px;height:8px;border-radius:50%;background:${sevColor};flex-shrink:0"></span>
            <span style="font-weight:600">${esc(e.code || 'Error')}</span>
            <span class="text-muted" style="margin-left:auto;font-size:0.62rem">${dateStr}</span>
          </div>
          ${filename ? `<div style="font-size:0.62rem;color:var(--text-muted);margin-top:2px;margin-left:14px">${_t('analytics.file', 'File')}: ${esc(filename)}</div>` : ''}
          ${wikiUrl ? `<a href="${esc(wikiUrl)}" target="_blank" rel="noopener" style="font-size:0.62rem;color:var(--accent-blue);margin-left:14px;text-decoration:none">📖 ${_t('analytics.view_wiki', 'View on wiki →')}</a>` : ''}
        </div>`;
      }
      h += '</div></div>';
    }

    if (history.length === 0 && printErrors.length === 0) {
      h += `<div class="settings-card" style="grid-column:1/-1;text-align:center;padding:40px"><div style="font-size:2.5rem">🖨️</div><div style="margin-top:8px;font-weight:600">${_t('analytics.no_prints_yet', 'No prints yet')}</div><div class="text-muted" style="font-size:0.78rem;margin-top:4px">${_t('analytics.no_prints_hint', 'Print history will appear here once you complete your first job.')}</div></div>`;
    }

    h += '</div>';
    return h;
  }

  // ────────── Tab: Server ──────────

  function _tabServer(data) {
    const { overview, hourly, topEndpoints, sessions, errors } = data;
    let h = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));grid-auto-flow:dense;gap:12px">';

    // Hourly chart — full width
    h += `<div class="settings-card" style="grid-column:1/-1;overflow:hidden">
      <div class="card-title">${_t('analytics.requests_per_hour', 'Requests per hour')} <span class="text-muted" style="font-size:0.65rem;font-weight:normal">(7 days)</span></div>
      <canvas id="analytics-hourly-chart" width="800" height="180" style="width:100%;height:180px;display:block"></canvas>
    </div>`;

    // Top endpoints
    h += `<div class="settings-card">
      <div class="card-title">${_t('analytics.top_endpoints', 'Top endpoints')} <span class="text-muted" style="font-size:0.65rem;font-weight:normal">(24h)</span></div>`;
    if (!topEndpoints.length) {
      h += `<div class="text-muted" style="padding:12px;font-size:0.72rem;text-align:center">${_t('analytics.collecting', 'Collecting — refresh in 1 minute')}</div>`;
    } else {
      h += '<div style="max-height:280px;overflow-y:auto">';
      const maxHits = Math.max(...topEndpoints.map(e => e.hits), 1);
      for (let i = 0; i < topEndpoints.length; i++) {
        const ep = topEndpoints[i];
        const widthPct = Math.round(ep.hits / maxHits * 100);
        h += `<div style="position:relative;padding:4px 6px;font-size:0.7rem;border-bottom:1px solid var(--border-subtle);overflow:hidden">
          <div style="position:absolute;inset:0;background:linear-gradient(to right, rgba(74,158,255,0.12) ${widthPct}%, transparent ${widthPct}%)"></div>
          <div style="position:relative;display:flex;align-items:center;gap:6px">
            <span style="width:18px;text-align:right;color:var(--text-muted);font-size:0.62rem">${i + 1}</span>
            <span style="flex:1;font-family:monospace;font-size:0.62rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(ep.endpoint)}</span>
            <span style="font-weight:600;min-width:40px;text-align:right">${ep.hits}</span>
            ${ep.errors > 0 ? `<span style="color:var(--accent-red);font-size:0.6rem;min-width:30px;text-align:right">${ep.errors}err</span>` : ''}
            <span style="color:var(--text-muted);font-size:0.6rem;min-width:38px;text-align:right">${ep.avgMs}ms</span>
          </div>
        </div>`;
      }
      h += '</div>';
    }
    h += '</div>';

    // Active sessions
    h += `<div class="settings-card">
      <div class="card-title">${_t('analytics.active_sessions', 'Active sessions')} <span class="text-muted" style="font-size:0.65rem;font-weight:normal">(last hour)</span></div>`;
    if (!sessions.length) {
      h += `<div class="text-muted" style="padding:12px;font-size:0.72rem;text-align:center">${_t('analytics.no_sessions', 'No active sessions')}</div>`;
    } else {
      h += '<div style="max-height:240px;overflow-y:auto">';
      for (const s of sessions) {
        h += `<div style="display:flex;align-items:center;gap:8px;padding:5px 6px;font-size:0.7rem;border-bottom:1px solid var(--border-subtle)">
          <span style="width:8px;height:8px;border-radius:50%;background:var(--accent-green)"></span>
          <span style="flex:1;font-family:monospace">${esc(s.ip)}</span>
          <span class="text-muted">${esc(s.device_type || '')}</span>
          <span style="font-weight:600">${s.hits}</span>
        </div>`;
      }
      h += '</div>';
    }
    h += '</div>';

    // Server errors
    if (errors.length > 0) {
      h += `<div class="settings-card">
        <div class="card-title" style="color:var(--accent-red)">${_t('analytics.error_endpoints', 'Error endpoints')} <span class="text-muted" style="font-size:0.65rem;font-weight:normal">(24h)</span></div>
        <div style="max-height:240px;overflow-y:auto">`;
      for (const e of errors) {
        h += `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:0.7rem">
          <span style="color:var(--accent-red);font-weight:600;min-width:28px">${e.count}×</span>
          <span style="font-family:monospace;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.65rem">${esc(e.endpoint)}</span>
        </div>`;
      }
      h += '</div></div>';
    }

    // Devices/browsers/OS
    const deviceEntries = Object.entries(overview.devices || {}).filter(([,v]) => v > 0);
    const browserEntries = Object.entries(overview.browsers || {}).filter(([,v]) => v > 0);
    const osEntries = Object.entries(overview.os || {}).filter(([,v]) => v > 0);
    if (deviceEntries.length || browserEntries.length || osEntries.length) {
      h += `<div class="settings-card">
        <div class="card-title">${_t('analytics.client_breakdown', 'Clients')}</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;font-size:0.72rem">`;
      for (const [title, entries] of [
        [_t('analytics.devices', 'Devices'), deviceEntries],
        [_t('analytics.browsers', 'Browsers'), browserEntries],
        [_t('analytics.os', 'OS'), osEntries],
      ]) {
        h += `<div><div style="font-weight:600;margin-bottom:4px;color:var(--text-muted);font-size:0.62rem;text-transform:uppercase">${title}</div>`;
        if (entries.length === 0) {
          h += `<div class="text-muted" style="font-size:0.65rem">—</div>`;
        } else {
          for (const [name, count] of entries.sort((a, b) => b[1] - a[1])) {
            h += `<div style="display:flex;justify-content:space-between;font-size:0.65rem;padding:1px 0"><span>${esc(name)}</span><strong>${count}</strong></div>`;
          }
        }
        h += '</div>';
      }
      h += '</div></div>';
    }

    // WebSocket / Camera
    h += `<div class="settings-card">
      <div class="card-title">${_t('analytics.websocket_camera', 'WebSocket & Camera')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.7rem">
        <div style="padding:6px;background:var(--bg-inset);border-radius:4px">${_t('analytics.ws_connections', 'Connections')}: <strong>${overview.websocket?.connections || 0}</strong></div>
        <div style="padding:6px;background:var(--bg-inset);border-radius:4px">${_t('analytics.ws_bytes', 'WS bytes')}: <strong>${_fmtBytes((overview.websocket?.bytesIn || 0) + (overview.websocket?.bytesOut || 0))}</strong></div>
        <div style="padding:6px;background:var(--bg-inset);border-radius:4px">${_t('analytics.ws_msgs_in', 'Messages in')}: <strong>${overview.websocket?.messagesIn || 0}</strong></div>
        <div style="padding:6px;background:var(--bg-inset);border-radius:4px">${_t('analytics.ws_msgs_out', 'Messages out')}: <strong>${overview.websocket?.messagesOut || 0}</strong></div>
      </div>
      ${Object.keys(overview.camera || {}).length > 0 ? `
        <div style="margin-top:8px;font-size:0.7rem;font-weight:600">${_t('analytics.camera_streams', 'Camera streams')}</div>
        ${Object.entries(overview.camera).map(([pid, stats]) => `
          <div style="display:flex;justify-content:space-between;font-size:0.65rem;padding:2px 0"><span>${esc(pid)}</span><span>${stats.streams} · ${_fmtBytes(stats.bytes)}</span></div>
        `).join('')}` : ''}
    </div>`;

    h += '</div>';
    return h;
  }

  // ────────── Tab: Filament ──────────

  function _tabFilament(data) {
    const { spools, predictions } = data;
    let h = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:12px">';

    if (spools.length === 0) {
      h += `<div class="settings-card" style="grid-column:1/-1;text-align:center;padding:40px"><div style="font-size:2.5rem">🧵</div><div style="margin-top:8px;font-weight:600">${_t('analytics.no_spools', 'No spools yet')}</div><div class="text-muted" style="font-size:0.78rem;margin-top:4px"><a href="#filament" style="color:var(--accent-blue)">${_t('analytics.add_first_spool', 'Add your first spool →')}</a></div></div>`;
    } else {
      // By material
      const byMat = {};
      for (const s of spools.filter(sp => !sp.archived)) {
        const m = s.material || 'Unknown';
        if (!byMat[m]) byMat[m] = { count: 0, remaining: 0, total: 0 };
        byMat[m].count++;
        byMat[m].remaining += s.remaining_weight_g || 0;
        byMat[m].total += s.initial_weight_g || 0;
      }
      h += `<div class="settings-card">
        <div class="card-title">${_t('analytics.by_material', 'Inventory by material')}</div>
        <div style="display:flex;flex-direction:column;gap:6px;font-size:0.74rem">`;
      for (const [mat, info] of Object.entries(byMat).sort((a, b) => b[1].remaining - a[1].remaining)) {
        const matColor = mat === 'PLA' ? '#4ade80' : mat === 'PETG' ? '#60a5fa' : mat === 'ABS' ? '#f97316' : mat === 'TPU' ? '#c084fc' : 'var(--accent-blue)';
        const pct = info.total > 0 ? Math.round(info.remaining / info.total * 100) : 0;
        h += `<div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
            <span style="font-weight:700;color:${matColor}">${esc(mat)}</span>
            <span class="text-muted" style="font-size:0.7rem">${info.count} ${_t('analytics.spools', 'spools')} · ${Math.round(info.remaining)}g</span>
          </div>
          <div style="height:6px;background:var(--bg-tertiary);border-radius:3px;overflow:hidden"><div style="width:${pct}%;height:100%;background:${matColor};border-radius:3px"></div></div>
        </div>`;
      }
      h += '</div></div>';

      // By vendor
      const byVendor = {};
      for (const s of spools.filter(sp => !sp.archived)) {
        const v = s.vendor_name || 'Unknown';
        byVendor[v] = (byVendor[v] || 0) + 1;
      }
      h += `<div class="settings-card">
        <div class="card-title">${_t('analytics.by_vendor', 'By vendor')}</div>
        <div style="display:flex;gap:5px;flex-wrap:wrap">`;
      for (const [v, count] of Object.entries(byVendor).sort((a, b) => b[1] - a[1])) {
        h += `<span style="padding:3px 9px;border-radius:14px;background:var(--bg-inset);font-size:0.72rem">${esc(v)}: <strong>${count}</strong></span>`;
      }
      h += '</div></div>';

      // Runway by material
      if (predictions.by_material && predictions.by_material.length > 0) {
        h += `<div class="settings-card" style="grid-column:1/-1">
          <div class="card-title">${_t('analytics.runway_per_material', 'Runway per material')}</div>
          <table class="data-table" style="font-size:0.74rem;width:100%">
            <thead><tr>
              <th>${_t('analytics.material', 'Material')}</th>
              <th style="text-align:right">${_t('analytics.in_stock', 'In stock')}</th>
              <th style="text-align:right">${_t('analytics.daily_use', 'Daily use')}</th>
              <th style="text-align:right">${_t('analytics.runway', 'Runway')}</th>
              <th style="text-align:right">${_t('analytics.total_used', 'Total used')}</th>
            </tr></thead>`;
        for (const m of predictions.by_material) {
          const days = m.avg_daily_g > 0 ? Math.round(m.in_stock_g / m.avg_daily_g) : null;
          const matColor = m.material === 'PLA' ? '#4ade80' : m.material === 'PETG' ? '#60a5fa' : m.material === 'TPU' ? '#c084fc' : 'var(--accent-blue)';
          const dayColor = days == null ? 'var(--text-muted)' : days <= 7 ? 'var(--accent-red)' : days <= 30 ? 'var(--accent-orange)' : 'var(--accent-green)';
          h += `<tr>
            <td style="padding:6px;font-weight:600;color:${matColor}">${esc(m.material)}</td>
            <td style="padding:6px;text-align:right">${Math.round(m.in_stock_g || 0)}g</td>
            <td style="padding:6px;text-align:right">${m.avg_daily_g || 0}g/d</td>
            <td style="padding:6px;text-align:right;color:${dayColor};font-weight:600">${days != null ? days + 'd' : '∞'}</td>
            <td style="padding:6px;text-align:right;color:var(--text-muted)">${Math.round(m.total_used_g || 0)}g</td>
          </tr>`;
        }
        h += '</table></div>';
      }
    }

    h += '</div>';
    return h;
  }

  // ────────── Helpers ──────────

  function _drawHourlyChart(hourly) {
    const canvas = document.getElementById('analytics-hourly-chart');
    if (!canvas || !hourly.length) return;
    const ctx = canvas.getContext('2d');
    // Make canvas crisp on hi-dpi screens.
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || canvas.width;
    const cssH = canvas.clientHeight || canvas.height;
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const W = cssW, H = cssH;
    const pad = { top: 12, right: 12, bottom: 24, left: 44 };
    ctx.clearRect(0, 0, W, H);

    const maxReq = Math.max(...hourly.map(h => h.requests), 1);
    const graphW = W - pad.left - pad.right;
    const graphH = H - pad.top - pad.bottom;
    const barW = Math.max(1.5, graphW / hourly.length - 0.5);

    // Grid + Y labels
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (graphH / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '10px monospace'; ctx.textAlign = 'right';
      ctx.fillText(_fmtNum(Math.round(maxReq * (1 - i / 4))), pad.left - 6, y + 3);
    }

    // Bars with smooth gradient
    for (let i = 0; i < hourly.length; i++) {
      const h = hourly[i];
      const barH = (h.requests / maxReq) * graphH;
      const x = pad.left + (i / hourly.length) * graphW;
      const y = pad.top + graphH - barH;

      const baseColor = h.errors > 0 ? 'rgba(255,82,82,' : 'rgba(74,158,255,';
      const grad = ctx.createLinearGradient(0, y, 0, y + barH);
      grad.addColorStop(0, baseColor + '0.95)');
      grad.addColorStop(1, baseColor + '0.4)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barW, barH);
    }

    // X-axis day labels every 24 hours
    if (hourly.length >= 24) {
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
      const dayCount = Math.floor(hourly.length / 24);
      for (let d = 0; d <= dayCount; d++) {
        const x = pad.left + (d * 24 / hourly.length) * graphW;
        const date = new Date(Date.now() - (dayCount - d) * 86400000);
        ctx.fillText(date.getDate() + '.' + (date.getMonth() + 1), x, H - 6);
      }
    }
  }

  function _statCard(label, value, icon, color) {
    return `<div class="settings-card" style="padding:10px;text-align:center">
      <div style="font-size:1.4rem">${icon}</div>
      <div style="font-size:1.1rem;font-weight:700;${color ? 'color:' + color : ''}">${value}</div>
      <div style="font-size:0.65rem;color:var(--text-muted)">${label}</div>
    </div>`;
  }

  function _fmtBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1073741824).toFixed(2) + ' GB';
  }

  function _fmtNum(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
    return String(n);
  }

  function esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
})();
