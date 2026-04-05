// Interactive API Playground — test API endpoints in the browser
(function() {
  let _spec = null;
  let _history = [];
  let _selectedEndpoint = null;
  let _expandedTags = {};

  function _esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function _syntaxHighlight(json) {
    if (typeof json !== 'string') json = JSON.stringify(json, null, 2);
    json = _esc(json);
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?|\bnull\b)/g,
      function(match) {
        let cls = 'pg-json-number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'pg-json-key';
          } else {
            cls = 'pg-json-string';
          }
        } else if (/true|false/.test(match)) {
          cls = 'pg-json-boolean';
        } else if (/null/.test(match)) {
          cls = 'pg-json-null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
      }
    );
  }

  function _methodColor(method) {
    const m = (method || '').toUpperCase();
    if (m === 'GET') return 'var(--accent-green)';
    if (m === 'POST') return 'var(--accent-blue)';
    if (m === 'PUT') return 'var(--accent-orange)';
    if (m === 'DELETE') return 'var(--accent-red)';
    if (m === 'PATCH') return 'var(--accent-purple)';
    return 'var(--text-muted)';
  }

  function _statusColor(code) {
    if (code >= 200 && code < 300) return 'var(--accent-green)';
    if (code >= 300 && code < 400) return 'var(--accent-blue)';
    if (code >= 400 && code < 500) return 'var(--accent-orange)';
    if (code >= 500) return 'var(--accent-red)';
    return 'var(--text-muted)';
  }

  function _extractPathParams(path) {
    const params = [];
    const re = /:([a-zA-Z_][a-zA-Z0-9_]*)/g;
    let m;
    while ((m = re.exec(path)) !== null) {
      params.push(m[1]);
    }
    return params;
  }

  function _buildUrl(endpoint, paramValues, queryStr) {
    let url = endpoint.path;
    const params = _extractPathParams(endpoint.path);
    for (const p of params) {
      const val = (paramValues[p] || '').trim();
      url = url.replace(':' + p, encodeURIComponent(val || ':' + p));
    }
    if (queryStr && queryStr.trim()) {
      const sep = url.includes('?') ? '&' : '?';
      url = url + sep + queryStr.trim();
    }
    return url;
  }

  function _groupByTag(endpoints) {
    const groups = {};
    for (const ep of endpoints) {
      const tag = ep.tag || 'Other';
      if (!groups[tag]) groups[tag] = [];
      groups[tag].push(ep);
    }
    return groups;
  }

  window.loadPlaygroundPanel = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    el.innerHTML = `<style>
      .pg-wrap { display:flex; gap:16px; height:calc(100vh - 180px); min-height:500px; }
      .pg-sidebar { width:320px; min-width:260px; flex-shrink:0; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); display:flex; flex-direction:column; overflow:hidden; }
      .pg-sidebar-header { padding:12px 14px; border-bottom:1px solid var(--border-color); }
      .pg-sidebar-title { font-size:0.85rem; font-weight:800; margin-bottom:8px; }
      .pg-search { width:100%; padding:7px 10px; border:1px solid var(--border-color); border-radius:var(--radius); background:var(--bg-tertiary); color:var(--text-primary); font-size:0.78rem; outline:none; box-sizing:border-box; }
      .pg-search:focus { border-color:var(--accent-blue); }
      .pg-endpoint-list { flex:1; overflow-y:auto; padding:6px 0; }
      .pg-tag-group { margin-bottom:2px; }
      .pg-tag-header { display:flex; align-items:center; gap:6px; padding:8px 14px; cursor:pointer; font-size:0.76rem; font-weight:700; color:var(--text-muted); user-select:none; transition:background 0.15s; }
      .pg-tag-header:hover { background:var(--bg-tertiary); }
      .pg-tag-arrow { font-size:0.6rem; transition:transform 0.2s; }
      .pg-tag-arrow.open { transform:rotate(90deg); }
      .pg-tag-count { margin-left:auto; font-size:0.65rem; font-weight:600; opacity:0.5; }
      .pg-ep-item { display:flex; align-items:center; gap:8px; padding:6px 14px 6px 24px; cursor:pointer; font-size:0.74rem; transition:background 0.15s; }
      .pg-ep-item:hover { background:var(--bg-tertiary); }
      .pg-ep-item.active { background:var(--bg-tertiary); border-left:2px solid var(--accent-blue); }
      .pg-method-badge { display:inline-block; min-width:46px; text-align:center; padding:2px 6px; border-radius:4px; font-size:0.62rem; font-weight:800; color:#fff; flex-shrink:0; }
      .pg-ep-path { color:var(--text-primary); font-family:monospace; font-size:0.72rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

      .pg-main { flex:1; display:flex; flex-direction:column; gap:14px; overflow-y:auto; min-width:0; }
      .pg-request-box { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); padding:18px; }
      .pg-req-header { display:flex; align-items:center; gap:10px; margin-bottom:14px; flex-wrap:wrap; }
      .pg-req-method { font-size:0.9rem; font-weight:900; }
      .pg-req-path { font-family:monospace; font-size:0.85rem; color:var(--text-primary); word-break:break-all; }
      .pg-req-summary { font-size:0.76rem; color:var(--text-muted); margin-bottom:4px; }
      .pg-req-permission { font-size:0.7rem; color:var(--text-muted); margin-bottom:14px; display:inline-block; padding:2px 8px; background:var(--bg-tertiary); border-radius:4px; }
      .pg-field-label { font-size:0.72rem; font-weight:700; color:var(--text-muted); margin-bottom:4px; margin-top:12px; text-transform:uppercase; letter-spacing:0.5px; }
      .pg-field-input { width:100%; padding:7px 10px; border:1px solid var(--border-color); border-radius:var(--radius); background:var(--bg-tertiary); color:var(--text-primary); font-size:0.78rem; font-family:monospace; outline:none; box-sizing:border-box; }
      .pg-field-input:focus { border-color:var(--accent-blue); }
      .pg-body-textarea { width:100%; min-height:100px; padding:8px 10px; border:1px solid var(--border-color); border-radius:var(--radius); background:var(--bg-tertiary); color:var(--text-primary); font-size:0.76rem; font-family:monospace; outline:none; resize:vertical; box-sizing:border-box; }
      .pg-body-textarea:focus { border-color:var(--accent-blue); }
      .pg-send-row { display:flex; align-items:center; gap:10px; margin-top:14px; }
      .pg-send-btn { padding:8px 24px; border:none; border-radius:var(--radius); background:var(--accent-blue); color:#fff; font-size:0.8rem; font-weight:700; cursor:pointer; transition:opacity 0.15s; }
      .pg-send-btn:hover { opacity:0.85; }
      .pg-send-btn:disabled { opacity:0.5; cursor:not-allowed; }
      .pg-clear-btn { padding:8px 16px; border:1px solid var(--border-color); border-radius:var(--radius); background:transparent; color:var(--text-muted); font-size:0.76rem; font-weight:600; cursor:pointer; }
      .pg-clear-btn:hover { background:var(--bg-tertiary); }

      .pg-response-box { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); padding:18px; flex:1; display:flex; flex-direction:column; min-height:200px; }
      .pg-resp-header { display:flex; align-items:center; gap:12px; margin-bottom:10px; flex-wrap:wrap; }
      .pg-resp-title { font-size:0.8rem; font-weight:800; }
      .pg-resp-status { padding:3px 10px; border-radius:4px; font-size:0.72rem; font-weight:800; color:#fff; }
      .pg-resp-time { font-size:0.7rem; color:var(--text-muted); }
      .pg-resp-body { flex:1; background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:var(--radius); padding:12px; overflow:auto; font-family:monospace; font-size:0.74rem; white-space:pre-wrap; word-break:break-all; line-height:1.5; }
      .pg-no-response { display:flex; align-items:center; justify-content:center; height:100%; color:var(--text-muted); font-size:0.8rem; }

      .pg-json-key { color:var(--accent-blue); }
      .pg-json-string { color:var(--accent-green); }
      .pg-json-number { color:var(--accent-blue); }
      .pg-json-boolean { color:var(--accent-orange); }
      .pg-json-null { color:var(--accent-red); }

      .pg-history-box { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); padding:14px; }
      .pg-history-title { font-size:0.78rem; font-weight:800; margin-bottom:8px; }
      .pg-history-list { display:flex; flex-direction:column; gap:4px; max-height:180px; overflow-y:auto; }
      .pg-history-item { display:flex; align-items:center; gap:8px; padding:5px 8px; border-radius:var(--radius); cursor:pointer; font-size:0.7rem; transition:background 0.15s; }
      .pg-history-item:hover { background:var(--bg-tertiary); }
      .pg-history-method { min-width:42px; text-align:center; padding:1px 5px; border-radius:3px; font-size:0.58rem; font-weight:800; color:#fff; }
      .pg-history-path { font-family:monospace; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--text-primary); }
      .pg-history-status { font-weight:700; font-size:0.68rem; }
      .pg-history-time { color:var(--text-muted); font-size:0.64rem; }
      .pg-history-empty { font-size:0.74rem; color:var(--text-muted); text-align:center; padding:12px; }

      .pg-placeholder { display:flex; align-items:center; justify-content:center; flex:1; color:var(--text-muted); font-size:0.85rem; text-align:center; padding:40px; }
      .pg-loading { text-align:center; padding:40px; color:var(--text-muted); font-size:0.8rem; }
      .pg-param-row { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
      .pg-param-label { font-size:0.72rem; font-weight:600; color:var(--text-primary); min-width:80px; font-family:monospace; }

      @media (max-width:800px) {
        .pg-wrap { flex-direction:column; height:auto; }
        .pg-sidebar { width:100%; max-height:300px; }
      }
    </style>
    <div class="pg-wrap">
      <div class="pg-sidebar">
        <div class="pg-sidebar-header">
          <div class="pg-sidebar-title">${_esc(t('playground.title'))}</div>
          <input type="text" class="pg-search" id="pg-search" placeholder="${_esc(t('playground.search'))}" />
        </div>
        <div class="pg-endpoint-list" id="pg-endpoint-list">
          <div class="pg-loading">${_esc(t('playground.loading'))}</div>
        </div>
      </div>
      <div class="pg-main" id="pg-main">
        <div class="pg-placeholder" id="pg-placeholder">${_esc(t('playground.select_endpoint'))}</div>
      </div>
    </div>`;

    _history = [];
    _selectedEndpoint = null;
    _expandedTags = {};
    _loadSpec();

    document.getElementById('pg-search').addEventListener('input', function() {
      _renderSidebar(this.value.trim().toLowerCase());
    });
  };

  async function _loadSpec() {
    try {
      const res = await fetch('/api/docs');
      if (!res.ok) throw new Error('Failed to load API spec');
      _spec = await res.json();
      _renderSidebar('');
    } catch (e) {
      const list = document.getElementById('pg-endpoint-list');
      if (list) list.innerHTML = '<div class="pg-loading" style="color:var(--accent-red)">Failed to load API spec</div>';
    }
  }

  function _renderSidebar(filter) {
    const list = document.getElementById('pg-endpoint-list');
    if (!list || !_spec) return;

    const endpoints = _spec.endpoints || [];
    const filtered = filter
      ? endpoints.filter(ep => ep.path.toLowerCase().includes(filter) || (ep.summary || '').toLowerCase().includes(filter) || (ep.tag || '').toLowerCase().includes(filter) || (ep.method || '').toLowerCase().includes(filter))
      : endpoints;

    const groups = _groupByTag(filtered);
    const tagNames = Object.keys(groups).sort();

    if (tagNames.length === 0) {
      list.innerHTML = '<div class="pg-loading">' + _esc(t('playground.no_response')) + '</div>';
      return;
    }

    let html = '';
    for (const tag of tagNames) {
      const eps = groups[tag];
      const isOpen = filter ? true : !!_expandedTags[tag];
      html += '<div class="pg-tag-group">';
      html += '<div class="pg-tag-header" data-tag="' + _esc(tag) + '">';
      html += '<span class="pg-tag-arrow ' + (isOpen ? 'open' : '') + '">&#9654;</span>';
      html += _esc(tag);
      html += '<span class="pg-tag-count">' + eps.length + '</span>';
      html += '</div>';
      html += '<div style="display:' + (isOpen ? 'block' : 'none') + '">';
      for (const ep of eps) {
        const isActive = _selectedEndpoint && _selectedEndpoint.method === ep.method && _selectedEndpoint.path === ep.path;
        html += '<div class="pg-ep-item' + (isActive ? ' active' : '') + '" data-method="' + _esc(ep.method) + '" data-path="' + _esc(ep.path) + '">';
        html += '<span class="pg-method-badge" style="background:' + _methodColor(ep.method) + '">' + _esc(ep.method) + '</span>';
        html += '<span class="pg-ep-path">' + _esc(ep.path) + '</span>';
        html += '</div>';
      }
      html += '</div></div>';
    }
    list.innerHTML = html;

    list.querySelectorAll('.pg-tag-header').forEach(el => {
      el.addEventListener('click', function() {
        const tag = this.getAttribute('data-tag');
        _expandedTags[tag] = !_expandedTags[tag];
        const arrow = this.querySelector('.pg-tag-arrow');
        const content = this.nextElementSibling;
        if (_expandedTags[tag]) {
          arrow.classList.add('open');
          content.style.display = 'block';
        } else {
          arrow.classList.remove('open');
          content.style.display = 'none';
        }
      });
    });

    list.querySelectorAll('.pg-ep-item').forEach(el => {
      el.addEventListener('click', function() {
        const method = this.getAttribute('data-method');
        const path = this.getAttribute('data-path');
        const ep = (_spec.endpoints || []).find(e => e.method === method && e.path === path);
        if (ep) _selectEndpoint(ep);
      });
    });
  }

  function _selectEndpoint(ep) {
    _selectedEndpoint = ep;
    const filter = (document.getElementById('pg-search') || {}).value || '';
    _renderSidebar(filter.trim().toLowerCase());
    _renderMain();
  }

  function _renderMain() {
    const main = document.getElementById('pg-main');
    if (!main) return;

    if (!_selectedEndpoint) {
      main.innerHTML = '<div class="pg-placeholder">' + _esc(t('playground.select_endpoint')) + '</div>';
      return;
    }

    const ep = _selectedEndpoint;
    const method = (ep.method || 'GET').toUpperCase();
    const pathParams = _extractPathParams(ep.path);
    const hasBody = ['POST','PUT','PATCH'].includes(method);

    let html = '<div class="pg-request-box">';
    html += '<div class="pg-req-header">';
    html += '<span class="pg-req-method" style="color:' + _methodColor(method) + '">' + _esc(method) + '</span>';
    html += '<span class="pg-req-path">' + _esc(ep.path) + '</span>';
    html += '</div>';
    if (ep.summary) html += '<div class="pg-req-summary">' + _esc(ep.summary) + '</div>';
    if (ep.permission) html += '<div class="pg-req-permission">' + _esc(t('playground.permission')) + ': ' + _esc(ep.permission) + '</div>';

    if (pathParams.length > 0) {
      html += '<div class="pg-field-label">' + _esc(t('playground.url_params')) + '</div>';
      for (const p of pathParams) {
        html += '<div class="pg-param-row">';
        html += '<span class="pg-param-label">:' + _esc(p) + '</span>';
        html += '<input type="text" class="pg-field-input pg-param-input" data-param="' + _esc(p) + '" placeholder="' + _esc(p) + '" />';
        html += '</div>';
      }
    }

    html += '<div class="pg-field-label">' + _esc(t('playground.query_params')) + '</div>';
    html += '<input type="text" class="pg-field-input" id="pg-query" placeholder="key=value&key2=value2" />';

    if (hasBody) {
      html += '<div class="pg-field-label">' + _esc(t('playground.body')) + '</div>';
      html += '<textarea class="pg-body-textarea" id="pg-body" placeholder=\'{"key": "value"}\'></textarea>';
    }

    html += '<div class="pg-send-row">';
    html += '<button class="pg-send-btn" id="pg-send-btn">' + _esc(t('playground.send')) + '</button>';
    html += '<button class="pg-clear-btn" id="pg-clear-btn">' + _esc(t('playground.clear')) + '</button>';
    html += '<button class="pg-clear-btn" id="pg-curl-btn" title="Copy as cURL">📋 cURL</button>';
    html += '<button class="pg-clear-btn" id="pg-fav-btn" title="Save to favorites">⭐ Favorite</button>';
    html += '</div>';

    // Example requests (pre-filled)
    if (_getExamples(ep).length > 0) {
      html += '<div style="margin-top:8px"><span style="font-size:0.7rem;color:var(--text-muted)">Examples:</span>';
      html += '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px">';
      for (const ex of _getExamples(ep)) {
        html += '<button class="pg-clear-btn pg-example-btn" style="font-size:0.65rem;padding:2px 8px" data-body=\'' + _esc(JSON.stringify(ex.body || {})) + '\' data-query="' + _esc(ex.query || '') + '">' + _esc(ex.name) + '</button>';
      }
      html += '</div></div>';
    }

    html += '</div>';

    html += '<div class="pg-response-box" id="pg-response-box">';
    html += '<div class="pg-resp-header">';
    html += '<span class="pg-resp-title">' + _esc(t('playground.response')) + '</span>';
    html += '<span class="pg-resp-status" id="pg-resp-status" style="display:none"></span>';
    html += '<span class="pg-resp-time" id="pg-resp-time"></span>';
    html += '</div>';
    html += '<div class="pg-resp-body" id="pg-resp-body">';
    html += '<div class="pg-no-response">' + _esc(t('playground.no_response')) + '</div>';
    html += '</div>';
    html += '</div>';

    html += _renderHistory();

    main.innerHTML = html;

    document.getElementById('pg-send-btn').addEventListener('click', _sendRequest);

    // cURL export
    document.getElementById('pg-curl-btn').addEventListener('click', function() {
      const ep = _selectedEndpoint;
      if (!ep) return;
      const method = (ep.method || 'GET').toUpperCase();
      const paramValues = {};
      document.querySelectorAll('.pg-param-input').forEach(input => { paramValues[input.getAttribute('data-param')] = input.value; });
      const queryStr = (document.getElementById('pg-query') || {}).value || '';
      const bodyText = (document.getElementById('pg-body') || {}).value || '';
      const url = location.origin + _buildUrl(ep, paramValues, queryStr);
      let curl = `curl -X ${method} '${url}'`;
      if (bodyText.trim()) curl += ` -H 'Content-Type: application/json' -d '${bodyText.replace(/'/g, "'\\''")}'`;
      navigator.clipboard.writeText(curl);
      if (typeof showToast === 'function') showToast('cURL copied!', 'success');
    });

    // Favorites
    document.getElementById('pg-fav-btn').addEventListener('click', function() {
      const ep = _selectedEndpoint;
      if (!ep) return;
      const favs = JSON.parse(localStorage.getItem('pg-favorites') || '[]');
      const key = ep.method + ':' + ep.path;
      if (favs.includes(key)) { favs.splice(favs.indexOf(key), 1); }
      else { favs.push(key); }
      localStorage.setItem('pg-favorites', JSON.stringify(favs));
      if (typeof showToast === 'function') showToast(favs.includes(key) ? 'Added to favorites' : 'Removed from favorites', 'info');
    });

    // Example buttons
    main.querySelectorAll('.pg-example-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const body = this.getAttribute('data-body');
        const query = this.getAttribute('data-query');
        if (body && body !== '{}') { const el = document.getElementById('pg-body'); if (el) el.value = JSON.stringify(JSON.parse(body), null, 2); }
        if (query) { const el = document.getElementById('pg-query'); if (el) el.value = query; }
      });
    });

    document.getElementById('pg-clear-btn').addEventListener('click', function() {
      const body = document.getElementById('pg-resp-body');
      const status = document.getElementById('pg-resp-status');
      const time = document.getElementById('pg-resp-time');
      if (body) body.innerHTML = '<div class="pg-no-response">' + _esc(t('playground.no_response')) + '</div>';
      if (status) status.style.display = 'none';
      if (time) time.textContent = '';
    });

    main.querySelectorAll('.pg-history-item').forEach(el => {
      el.addEventListener('click', function() {
        const idx = parseInt(this.getAttribute('data-idx'), 10);
        if (_history[idx]) _rerunHistory(idx);
      });
    });
  }

  function _renderHistory() {
    let html = '<div class="pg-history-box">';
    html += '<div class="pg-history-title">' + _esc(t('playground.history')) + '</div>';
    html += '<div class="pg-history-list" id="pg-history-list">';
    if (_history.length === 0) {
      html += '<div class="pg-history-empty">' + _esc(t('playground.no_response')) + '</div>';
    } else {
      for (let i = _history.length - 1; i >= 0; i--) {
        const h = _history[i];
        html += '<div class="pg-history-item" data-idx="' + i + '">';
        html += '<span class="pg-history-method" style="background:' + _methodColor(h.method) + '">' + _esc(h.method) + '</span>';
        html += '<span class="pg-history-path">' + _esc(h.url) + '</span>';
        html += '<span class="pg-history-status" style="color:' + _statusColor(h.status) + '">' + (h.status || '—') + '</span>';
        html += '<span class="pg-history-time">' + (h.duration != null ? h.duration + 'ms' : '') + '</span>';
        html += '</div>';
      }
    }
    html += '</div></div>';
    return html;
  }

  async function _sendRequest() {
    if (!_selectedEndpoint) return;

    const ep = _selectedEndpoint;
    const method = (ep.method || 'GET').toUpperCase();
    const btn = document.getElementById('pg-send-btn');
    const respBody = document.getElementById('pg-resp-body');
    const respStatus = document.getElementById('pg-resp-status');
    const respTime = document.getElementById('pg-resp-time');

    const paramValues = {};
    document.querySelectorAll('.pg-param-input').forEach(input => {
      paramValues[input.getAttribute('data-param')] = input.value;
    });

    const queryStr = (document.getElementById('pg-query') || {}).value || '';
    const bodyText = (document.getElementById('pg-body') || {}).value || '';

    const url = _buildUrl(ep, paramValues, queryStr);

    btn.disabled = true;
    btn.textContent = t('playground.loading');
    respBody.innerHTML = '<div class="pg-no-response">' + _esc(t('playground.loading')) + '</div>';

    const fetchOpts = { method: method, headers: {} };

    if (['POST','PUT','PATCH'].includes(method) && bodyText.trim()) {
      fetchOpts.headers['Content-Type'] = 'application/json';
      fetchOpts.body = bodyText;
    }

    const startTime = performance.now();
    let status = 0;
    let responseData = null;
    let responseText = '';

    try {
      const res = await fetch(url, fetchOpts);
      const duration = Math.round(performance.now() - startTime);
      status = res.status;

      try {
        responseData = await res.json();
        responseText = JSON.stringify(responseData, null, 2);
      } catch (_) {
        responseText = await res.text().catch(() => '');
      }

      respStatus.style.display = 'inline-block';
      respStatus.style.background = _statusColor(status);
      respStatus.textContent = _esc(t('playground.status')) + ': ' + status;
      respTime.textContent = _esc(t('playground.time')) + ': ' + duration + 'ms';

      if (responseData !== null) {
        respBody.innerHTML = _syntaxHighlight(responseText);
      } else {
        respBody.textContent = responseText || '(empty response)';
      }

      _addHistory(method, url, status, duration, bodyText);
    } catch (err) {
      const duration = Math.round(performance.now() - startTime);
      respStatus.style.display = 'inline-block';
      respStatus.style.background = 'var(--accent-red)';
      respStatus.textContent = 'Error';
      respTime.textContent = duration + 'ms';
      respBody.textContent = err.message || 'Network error';
      _addHistory(method, url, 0, duration, bodyText);
    } finally {
      btn.disabled = false;
      btn.textContent = t('playground.send');
    }
  }

  function _addHistory(method, url, status, duration, body) {
    _history.push({ method, url, status, duration, body });
    if (_history.length > 10) _history.shift();
    const listEl = document.getElementById('pg-history-list');
    if (listEl) {
      listEl.innerHTML = '';
      const container = document.createElement('div');
      container.innerHTML = _renderHistoryItems();
      listEl.innerHTML = container.innerHTML;
      listEl.querySelectorAll('.pg-history-item').forEach(el => {
        el.addEventListener('click', function() {
          const idx = parseInt(this.getAttribute('data-idx'), 10);
          if (_history[idx]) _rerunHistory(idx);
        });
      });
    }
  }

  function _renderHistoryItems() {
    if (_history.length === 0) return '<div class="pg-history-empty">' + _esc(t('playground.no_response')) + '</div>';
    let html = '';
    for (let i = _history.length - 1; i >= 0; i--) {
      const h = _history[i];
      html += '<div class="pg-history-item" data-idx="' + i + '">';
      html += '<span class="pg-history-method" style="background:' + _methodColor(h.method) + '">' + _esc(h.method) + '</span>';
      html += '<span class="pg-history-path">' + _esc(h.url) + '</span>';
      html += '<span class="pg-history-status" style="color:' + _statusColor(h.status) + '">' + (h.status || '—') + '</span>';
      html += '<span class="pg-history-time">' + (h.duration != null ? h.duration + 'ms' : '') + '</span>';
      html += '</div>';
    }
    return html;
  }

  function _rerunHistory(idx) {
    const h = _history[idx];
    if (!h || !_spec) return;

    const ep = (_spec.endpoints || []).find(e => {
      const builtPattern = e.path.replace(/:[a-zA-Z_][a-zA-Z0-9_]*/g, '[^/]+');
      const re = new RegExp('^' + builtPattern.replace(/\//g, '\\/') + '(\\?.*)?$');
      return (e.method || '').toUpperCase() === h.method && re.test(h.url);
    });

    if (ep) {
      _selectedEndpoint = ep;
      _renderMain();

      const queryIdx = h.url.indexOf('?');
      if (queryIdx !== -1) {
        const queryEl = document.getElementById('pg-query');
        if (queryEl) queryEl.value = h.url.substring(queryIdx + 1);
      }

      const pathParams = _extractPathParams(ep.path);
      if (pathParams.length > 0) {
        const pathParts = ep.path.split('/');
        const urlPath = (queryIdx !== -1 ? h.url.substring(0, queryIdx) : h.url).split('/');
        for (let i = 0; i < pathParts.length; i++) {
          if (pathParts[i].startsWith(':')) {
            const paramName = pathParts[i].substring(1);
            const input = document.querySelector('.pg-param-input[data-param="' + paramName + '"]');
            if (input && urlPath[i]) input.value = decodeURIComponent(urlPath[i]);
          }
        }
      }

      if (h.body) {
        const bodyEl = document.getElementById('pg-body');
        if (bodyEl) bodyEl.value = h.body;
      }
    }

    _sendRequest();
  }

  // Pre-defined examples for common endpoints
  function _getExamples(ep) {
    const key = ep.method + ':' + ep.path;
    const examples = {
      'GET:/api/health': [{ name: 'Health check', query: '' }],
      'GET:/api/printers': [{ name: 'List all', query: '' }],
      'GET:/api/kb/stats': [{ name: 'KB stats', query: '' }],
      'GET:/api/system/info': [{ name: 'System info', query: '' }],
      'GET:/api/history': [{ name: 'Last 10', query: 'limit=10' }, { name: 'Last 50', query: 'limit=50' }],
      'GET:/api/inventory/spools': [{ name: 'All spools', query: '' }],
      'GET:/api/courses': [{ name: 'All courses', query: '' }],
      'POST:/api/slicer/upload': [{ name: 'Upload STL', body: {} }],
      'POST:/api/gcode/analyze': [{ name: 'Analyze G-code', body: {} }],
      'GET:/api/eula': [{ name: 'Get EULA', query: '' }],
      'GET:/api/bambu/printer-db': [{ name: 'All Bambu printers', query: '' }],
      'GET:/api/tunnel/status': [{ name: 'Tunnel status', query: '' }],
      'POST:/api/sign-maker/generate-3mf': [{ name: 'WiFi sign', body: { title: 'WiFi', qr_data: 'WIFI:T:WPA;S:MyNetwork;P:password;;', plate_width: 80, plate_height: 55 } }],
      'POST:/api/model-forge/storage-box/generate-3mf': [{ name: 'Simple box', body: { width: 80, depth: 60, height: 40 } }, { name: 'Gridfinity 2x2', body: { gridfinity: true, gridUnitsX: 2, gridUnitsY: 2, height: 30 } }],
      'POST:/api/model-forge/keychain/generate-3mf': [{ name: 'Test keychain', body: { text: 'HELLO', width: 50, height: 20 } }],
    };
    return examples[key] || [];
  }
})();
