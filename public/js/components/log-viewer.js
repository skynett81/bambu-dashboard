/* ═══ Real-time Server Log Viewer ═══ */
(function() {
  'use strict';

  const MAX_LINES = 500;
  let _lines = [];
  let _paused = false;
  let _filters = { info: true, warn: true, error: true };
  let _prefixFilter = '';
  let _wsListener = null;
  let _subscribed = false;

  function _subscribe() {
    if (_subscribed) return;
    // Send subscribe message via the exposed _wsSend helper
    if (window._wsSend) {
      window._wsSend(JSON.stringify({ type: 'subscribe_logs' }));
    }
    // Register listener on the global _wsListeners array to receive messages
    _wsListener = function(msg) {
      if (msg.type === 'log_entry' && msg.data) {
        _addLine(msg.data);
      }
    };
    if (!window._wsListeners) window._wsListeners = [];
    window._wsListeners.push(_wsListener);
    _subscribed = true;
  }

  function _unsubscribe() {
    if (!_subscribed) return;
    if (window._wsSend) {
      window._wsSend(JSON.stringify({ type: 'unsubscribe_logs' }));
    }
    if (window._wsListeners && _wsListener) {
      const idx = window._wsListeners.indexOf(_wsListener);
      if (idx !== -1) window._wsListeners.splice(idx, 1);
    }
    _wsListener = null;
    _subscribed = false;
  }

  function _addLine(entry) {
    _lines.push(entry);
    if (_lines.length > MAX_LINES) _lines.shift();
    if (!_paused) _renderNewLine(entry);
  }

  function _matchesFilter(entry) {
    if (!_filters[entry.level]) return false;
    if (_prefixFilter && entry.prefix && !entry.prefix.toLowerCase().includes(_prefixFilter.toLowerCase())) return false;
    if (_prefixFilter && !entry.prefix) return false;
    return true;
  }

  function _formatLine(entry) {
    if (!_matchesFilter(entry)) return '';
    const ts = entry.ts ? entry.ts.substring(11, 23) : '';
    const levelClass = `log-level-${entry.level}`;
    return `<div class="log-line"><span class="log-ts">${ts}</span><span class="log-level ${levelClass}">${entry.level}</span><span class="log-prefix">${entry.prefix || ''}</span><span class="log-msg">${_escapeHtml(entry.msg || '')}</span></div>`;
  }

  function _escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function _renderNewLine(entry) {
    const output = document.getElementById('log-output');
    if (!output) return;
    const html = _formatLine(entry);
    if (!html) return;
    output.insertAdjacentHTML('beforeend', html);
    // Remove oldest rendered lines if exceeding MAX_LINES
    while (output.children.length > MAX_LINES) {
      output.removeChild(output.firstChild);
    }
    if (!_paused) {
      output.scrollTop = output.scrollHeight;
    }
  }

  function _renderAll() {
    const output = document.getElementById('log-output');
    if (!output) return;
    const html = _lines.map(e => _formatLine(e)).filter(Boolean).join('');
    output.innerHTML = html;
    if (!_paused) {
      output.scrollTop = output.scrollHeight;
    }
  }

  // Expose these as window functions so inline onclick handlers work
  window._logViewerClear = function() {
    _lines = [];
    const output = document.getElementById('log-output');
    if (output) output.innerHTML = '';
  };

  window._logViewerTogglePause = function() {
    _paused = !_paused;
    const btn = document.getElementById('log-pause-btn');
    if (btn) btn.textContent = _paused ? (t('controls.resume') || 'Fortsett') : (t('controls.pause') || 'Pause');
    if (!_paused) {
      _renderAll();
    }
  };

  function _onFilterChange() {
    _filters.info = document.getElementById('log-filter-info')?.checked ?? true;
    _filters.warn = document.getElementById('log-filter-warn')?.checked ?? true;
    _filters.error = document.getElementById('log-filter-error')?.checked ?? true;
    _renderAll();
  }

  function _onPrefixChange(e) {
    _prefixFilter = e.target.value.trim();
    _renderAll();
  }

  let _activeLogTab = 'realtime';
  let _activityData = null;
  let _activityFilter = 'all';

  async function _loadActivity() {
    const container = document.getElementById('activity-log-content');
    if (!container) return;
    if (!_activityData) {
      container.innerHTML = '<div class="text-muted" style="padding:1rem">' + (t('common.loading') || 'Loading...') + '</div>';
      try {
        const res = await fetch('/api/activity-log?limit=200');
        _activityData = await res.json();
      } catch { _activityData = []; }
    }
    _renderActivity();
  }

  function _renderActivity() {
    const container = document.getElementById('activity-log-content');
    if (!container) return;
    let filtered = _activityData || [];
    if (_activityFilter === 'prints') filtered = filtered.filter(e => e.type === 'print');
    else if (_activityFilter === 'errors') filtered = filtered.filter(e => e.type === 'error');
    else if (_activityFilter === 'maintenance') filtered = filtered.filter(e => e.type === 'maintenance');
    else if (_activityFilter === 'other') filtered = filtered.filter(e => !['print','error','maintenance'].includes(e.type));

    if (!filtered.length) {
      container.innerHTML = '<div class="text-muted" style="padding:1rem;text-align:center">' + (t('errors.no_activity') || 'No activity yet') + '</div>';
      return;
    }

    const typeColors = { print: '#00ae42', error: '#ff4444', maintenance: '#ffaa00', notification: '#00d4ff', protection: '#ff6b6b', spool: '#8b5cf6', xcam: '#06b6d4', queue: '#6366f1' };
    const typeIcons = { print: '⬤', error: '▲', maintenance: '⚙', notification: '🔔', protection: '🛡', spool: '◉', xcam: '📷', queue: '📋' };

    // Group by date
    const groups = {};
    for (const e of filtered) {
      const d = new Date(e.timestamp);
      const key = d.toLocaleDateString((window.i18n?.getLocale() || 'nb').replace('_', '-'), { day: '2-digit', month: 'long', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    }

    let html = '';
    for (const [date, items] of Object.entries(groups)) {
      html += '<div style="margin-bottom:12px"><div style="font-size:0.75rem;font-weight:600;color:var(--text-muted);padding:4px 0;border-bottom:1px solid var(--border-color);margin-bottom:4px">' + date + ' (' + items.length + ')</div>';
      for (const e of items) {
        const color = typeColors[e.type] || '#888';
        const icon = typeIcons[e.type] || '•';
        const time = new Date(e.timestamp).toLocaleTimeString((window.i18n?.getLocale() || 'nb').replace('_', '-'), { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const printer = e.printer_id ? '<span style="color:var(--text-muted);font-size:0.7rem;margin-left:4px">[' + (window.printerState?._printerMeta?.[e.printer_id]?.name || e.printer_id) + ']</span>' : '';
        html += '<div style="display:flex;align-items:flex-start;gap:8px;padding:3px 0;font-size:0.8rem">';
        html += '<span style="color:' + color + ';flex-shrink:0;font-size:0.7rem;margin-top:2px">' + icon + '</span>';
        html += '<span style="color:var(--text-muted);flex-shrink:0;font-size:0.7rem;min-width:60px">' + time + '</span>';
        html += '<span style="flex:1">' + _escapeHtml(e.message || '') + printer + '</span>';
        if (e.details) html += '<span style="color:var(--text-muted);font-size:0.7rem;flex-shrink:0">' + _escapeHtml(e.details) + '</span>';
        html += '</div>';
      }
      html += '</div>';
    }
    container.innerHTML = html;
  }

  window._logFilterActivity = function(type) {
    _activityFilter = type;
    document.querySelectorAll('.activity-filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === type));
    _renderActivity();
  };

  window.loadLogViewer = function() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;

    // Tab bar
    body.innerHTML = `
      <div class="tabs" style="margin-bottom:10px">
        <button class="tab-btn ${_activeLogTab === 'realtime' ? 'active' : ''}" onclick="window._switchLogTab('realtime')">${t('logs.realtime') || 'Live'}</button>
        <button class="tab-btn ${_activeLogTab === 'activity' ? 'active' : ''}" onclick="window._switchLogTab('activity')">${t('errors.tab_activity') || 'Activity'}</button>
      </div>
      <div id="log-tab-realtime" style="display:${_activeLogTab === 'realtime' ? '' : 'none'}">
        <div class="log-viewer">
          <div class="log-toolbar">
            <button class="form-btn form-btn-secondary form-btn-sm" onclick="_logViewerClear()">${t('logs.clear') || 'Clear'}</button>
            <button class="form-btn form-btn-secondary form-btn-sm" id="log-pause-btn" onclick="_logViewerTogglePause()">${t('controls.pause') || 'Pause'}</button>
            <label style="display:flex;align-items:center;gap:3px;font-size:0.75rem;color:var(--text-secondary)">
              <input type="checkbox" id="log-filter-info" checked> <span style="color:#00d4ff">info</span>
            </label>
            <label style="display:flex;align-items:center;gap:3px;font-size:0.75rem;color:var(--text-secondary)">
              <input type="checkbox" id="log-filter-warn" checked> <span style="color:#ffaa00">warn</span>
            </label>
            <label style="display:flex;align-items:center;gap:3px;font-size:0.75rem;color:var(--text-secondary)">
              <input type="checkbox" id="log-filter-error" checked> <span style="color:#ff4444">error</span>
            </label>
            <input type="text" class="log-filter-input" placeholder="${t('logs.filter_prefix') || 'Filter prefix...'}" id="log-prefix-filter">
          </div>
          <div class="log-output" id="log-output"></div>
        </div>
      </div>
      <div id="log-tab-activity" style="display:${_activeLogTab === 'activity' ? '' : 'none'}">
        <div style="display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap">
          <button class="form-btn form-btn-sm activity-filter-btn ${_activityFilter === 'all' ? 'active' : ''}" data-filter="all" onclick="_logFilterActivity('all')">${t('errors.filter_all') || 'All'}</button>
          <button class="form-btn form-btn-sm activity-filter-btn ${_activityFilter === 'prints' ? 'active' : ''}" data-filter="prints" onclick="_logFilterActivity('prints')">${t('errors.filter_prints') || 'Prints'}</button>
          <button class="form-btn form-btn-sm activity-filter-btn ${_activityFilter === 'errors' ? 'active' : ''}" data-filter="errors" onclick="_logFilterActivity('errors')">${t('errors.filter_errors') || 'Errors'}</button>
          <button class="form-btn form-btn-sm activity-filter-btn ${_activityFilter === 'maintenance' ? 'active' : ''}" data-filter="maintenance" onclick="_logFilterActivity('maintenance')">${t('errors.filter_maintenance') || 'Maintenance'}</button>
          <button class="form-btn form-btn-sm activity-filter-btn ${_activityFilter === 'other' ? 'active' : ''}" data-filter="other" onclick="_logFilterActivity('other')">${t('errors.filter_other') || 'Other'}</button>
          <button class="form-btn form-btn-sm" style="margin-left:auto" onclick="_activityData=null;_loadActivity()">${t('common.refresh') || 'Refresh'}</button>
        </div>
        <div id="activity-log-content" style="max-height:calc(100vh - 250px);overflow-y:auto"></div>
      </div>
    `;

    // Bind filter events
    document.getElementById('log-filter-info')?.addEventListener('change', _onFilterChange);
    document.getElementById('log-filter-warn')?.addEventListener('change', _onFilterChange);
    document.getElementById('log-filter-error')?.addEventListener('change', _onFilterChange);
    document.getElementById('log-prefix-filter')?.addEventListener('input', _onPrefixChange);

    // Subscribe to realtime logs
    _subscribe();

    // Render existing lines
    _renderAll();

    // Load activity if that tab is active
    if (_activeLogTab === 'activity') _loadActivity();
  };

  window._switchLogTab = function(tab) {
    _activeLogTab = tab;
    const rtEl = document.getElementById('log-tab-realtime');
    const actEl = document.getElementById('log-tab-activity');
    if (rtEl) rtEl.style.display = tab === 'realtime' ? '' : 'none';
    if (actEl) actEl.style.display = tab === 'activity' ? '' : 'none';
    document.querySelectorAll('.tabs .tab-btn').forEach((b, i) => b.classList.toggle('active', (i === 0 && tab === 'realtime') || (i === 1 && tab === 'activity')));
    if (tab === 'activity') _loadActivity();
    if (tab === 'realtime' && !_paused) {
      const output = document.getElementById('log-output');
      if (output) output.scrollTop = output.scrollHeight;
    }
  };

  // Patch openPanel and showDashboard to unsubscribe when leaving logs panel
  const _patchInterval = setInterval(() => {
    if (window.openPanel && window.openPanel !== _patchedOpenPanel) {
      const _realOpenPanel = window.openPanel;
      window.openPanel = _patchedOpenPanel = function(name, skipHash) {
        if (name !== 'logs' && _subscribed) {
          _unsubscribe();
        }
        return _realOpenPanel.call(this, name, skipHash);
      };

      const _realShowDashboard = window.showDashboard;
      window.showDashboard = function(skipHash) {
        if (_subscribed) {
          _unsubscribe();
        }
        return _realShowDashboard.call(this, skipHash);
      };

      clearInterval(_patchInterval);
    }
  }, 200);

  let _patchedOpenPanel = null;

})();
