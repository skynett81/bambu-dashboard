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

  window.loadLogViewer = function() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;

    // Subscribe to logs via WebSocket
    _subscribe();

    body.innerHTML = `
      <div class="log-viewer">
        <div class="log-toolbar">
          <button class="form-btn form-btn-secondary form-btn-sm" onclick="_logViewerClear()">T&oslash;m</button>
          <button class="form-btn form-btn-secondary form-btn-sm" id="log-pause-btn" onclick="_logViewerTogglePause()">Pause</button>
          <label style="display:flex;align-items:center;gap:3px;font-size:0.75rem;color:var(--text-secondary)">
            <input type="checkbox" id="log-filter-info" checked> <span style="color:#00d4ff">info</span>
          </label>
          <label style="display:flex;align-items:center;gap:3px;font-size:0.75rem;color:var(--text-secondary)">
            <input type="checkbox" id="log-filter-warn" checked> <span style="color:#ffaa00">warn</span>
          </label>
          <label style="display:flex;align-items:center;gap:3px;font-size:0.75rem;color:var(--text-secondary)">
            <input type="checkbox" id="log-filter-error" checked> <span style="color:#ff4444">error</span>
          </label>
          <input type="text" class="log-filter-input" placeholder="Filtrer prefix..." id="log-prefix-filter">
        </div>
        <div class="log-output" id="log-output"></div>
      </div>
    `;

    // Bind filter events
    document.getElementById('log-filter-info')?.addEventListener('change', _onFilterChange);
    document.getElementById('log-filter-warn')?.addEventListener('change', _onFilterChange);
    document.getElementById('log-filter-error')?.addEventListener('change', _onFilterChange);
    document.getElementById('log-prefix-filter')?.addEventListener('input', _onPrefixChange);

    // Render existing lines
    _renderAll();
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
