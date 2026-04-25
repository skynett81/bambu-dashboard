/**
 * G-code Studio — editor + linter + post-processor + snippet library.
 *
 * Renders into <div id="overlay-panel-body"> when the sidebar opens
 * the "gcode-studio" panel. Uses a textarea-based editor (no external
 * library) with custom syntax highlighting via overlay element so we
 * keep the zero-build, zero-dependency frontend rule.
 *
 * Backend:
 *   POST /api/gcode/lint        { text, firmware? } → { issues, stats }
 *   POST /api/gcode/transform   { text, ops[] } → { text }
 *   POST /api/gcode/diff        { left, right } → { hunks }
 *   GET  /api/gcode/snippets[?category=…&firmware=…&q=…]
 *   POST /api/gcode/snippets    { name, body, … }
 *   PUT  /api/gcode/snippets/:id
 *   DELETE /api/gcode/snippets/:id
 *   GET  /api/gcode/snippets/categories
 */
(function () {
  'use strict';

  let _state = {
    text: '',
    filename: 'untitled.gcode',
    firmware: 'auto',
    issues: [],
    stats: null,
    snippets: [],
    snippetFilter: { category: '', firmware: '', q: '' },
  };

  function _esc(s) { const d = document.createElement('div'); d.textContent = s ?? ''; return d.innerHTML; }
  function _toast(msg, type = 'info') { if (typeof showToast === 'function') showToast(msg, type, 3000); }

  async function _load() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;
    body.innerHTML = `
      <div class="gcode-studio-wrap">
        <div class="gcs-toolbar">
          <input type="file" id="gcs-file-input" accept=".gcode,.gco,.g,.nc" style="display:none">
          <button class="form-btn form-btn-sm" onclick="document.getElementById('gcs-file-input').click()">📂 Open file</button>
          <button class="form-btn form-btn-sm" onclick="window._gcs.lint()">✓ Lint</button>
          <button class="form-btn form-btn-sm" onclick="window._gcs.preview3D()">🧊 3D Preview</button>
          <span class="gcs-toolbar-sep"></span>
          <label style="font-size:0.72rem;color:var(--text-muted)">Firmware:</label>
          <select id="gcs-firmware" class="form-input form-input-sm" onchange="window._gcs.setFirmware(this.value)">
            <option value="auto">Auto-detect</option>
            <option value="marlin">Marlin</option>
            <option value="klipper">Klipper</option>
            <option value="reprap">RepRap</option>
            <option value="snapmaker">Snapmaker</option>
          </select>
          <span class="gcs-toolbar-sep"></span>
          <button class="form-btn form-btn-sm" onclick="window._gcs.openTransformDialog()">⚙ Post-process</button>
          <button class="form-btn form-btn-sm" onclick="window._gcs.download()">⬇ Download</button>
          <span class="gcs-toolbar-spacer"></span>
          <span id="gcs-stats" class="text-muted" style="font-size:0.72rem"></span>
        </div>
        <div class="gcs-grid">
          <div class="gcs-pane gcs-snippets">
            <div class="gcs-pane-title">Snippet Library</div>
            <div class="gcs-snip-controls">
              <input class="form-input form-input-sm" placeholder="Search…" id="gcs-snip-search" oninput="window._gcs.searchSnippets(this.value)">
              <select id="gcs-snip-cat" class="form-input form-input-sm" onchange="window._gcs.filterSnippets('category', this.value)">
                <option value="">All categories</option>
              </select>
              <button class="form-btn form-btn-sm" onclick="window._gcs.newSnippet()">＋ New</button>
            </div>
            <div id="gcs-snip-list" class="gcs-snip-list">Loading…</div>
          </div>
          <div class="gcs-pane gcs-editor-pane">
            <div class="gcs-pane-title" id="gcs-filename">${_esc(_state.filename)}</div>
            <textarea id="gcs-editor" class="gcs-editor" spellcheck="false" placeholder="-- empty --
Open a .gcode file or click a snippet to insert here. Then click Lint or 3D Preview." oninput="window._gcs.onEdit(this.value)"></textarea>
          </div>
          <div class="gcs-pane gcs-issues">
            <div class="gcs-pane-title">Lint Results</div>
            <div id="gcs-issues-list" class="gcs-issues-list">Click <strong>Lint</strong> to analyse.</div>
          </div>
        </div>
      </div>`;

    document.getElementById('gcs-file-input').addEventListener('change', _onFile);
    document.getElementById('gcs-firmware').value = _state.firmware;
    if (_state.text) document.getElementById('gcs-editor').value = _state.text;
    _renderStats();
    await _loadSnippets();
  }

  function _onFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      _state.text = reader.result;
      _state.filename = f.name;
      document.getElementById('gcs-editor').value = _state.text;
      document.getElementById('gcs-filename').textContent = _state.filename;
      _toast(`Loaded ${f.name} (${_fmtBytes(f.size)})`, 'success');
      _state.issues = [];
      _state.stats = null;
      _renderIssues();
      _renderStats();
    };
    reader.readAsText(f);
  }

  async function _lint() {
    if (!_state.text) { _toast('No G-code loaded', 'warn'); return; }
    try {
      const res = await fetch('/api/gcode/lint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: _state.text, firmware: _state.firmware }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'lint failed');
      _state.issues = data.issues || [];
      _state.stats = data.stats || null;
      _renderIssues();
      _renderStats();
      _toast(`Lint complete — ${_state.issues.length} issue${_state.issues.length === 1 ? '' : 's'}`,
        _state.issues.some(i => i.severity === 'error') ? 'error' : _state.issues.length ? 'warning' : 'success');
    } catch (e) {
      _toast(`Lint failed: ${e.message}`, 'error');
    }
  }

  function _renderIssues() {
    const el = document.getElementById('gcs-issues-list');
    if (!el) return;
    if (!_state.issues.length) {
      el.innerHTML = _state.stats
        ? `<div class="gcs-issue-empty"><strong style="color:var(--accent-green)">✓ No issues</strong><div class="text-muted" style="font-size:0.72rem;margin-top:4px">${_state.stats.commands} commands · ${_state.stats.layers} layers · ${(_state.stats.tools || []).join(', ') || 'single tool'}</div></div>`
        : '<div class="text-muted">No issues yet — click Lint.</div>';
      return;
    }
    const counts = { error: 0, warning: 0, info: 0 };
    for (const i of _state.issues) counts[i.severity]++;
    let html = `<div class="gcs-issues-summary">
      <span style="color:var(--accent-red)">${counts.error} errors</span> ·
      <span style="color:var(--accent-orange)">${counts.warning} warnings</span> ·
      <span style="color:var(--text-muted)">${counts.info} info</span>
    </div>`;
    html += _state.issues.map(i => `
      <div class="gcs-issue gcs-issue-${i.severity}" onclick="window._gcs.gotoLine(${i.line})" title="Click to jump to line ${i.line}">
        <div class="gcs-issue-head">
          <span class="gcs-issue-sev gcs-sev-${i.severity}">${i.severity.toUpperCase()}</span>
          <span class="gcs-issue-line">L${i.line}</span>
          <code class="gcs-issue-code">${_esc(i.code)}</code>
        </div>
        <div class="gcs-issue-msg">${_esc(i.message)}</div>
      </div>`).join('');
    el.innerHTML = html;
  }

  function _renderStats() {
    const el = document.getElementById('gcs-stats');
    if (!el) return;
    if (!_state.stats) { el.textContent = _state.text ? `${_fmtBytes(new Blob([_state.text]).size)}` : ''; return; }
    el.textContent = `${_state.stats.lines} lines · ${_state.stats.commands} cmds · ${_state.stats.layers} layers`;
  }

  async function _loadSnippets() {
    try {
      const params = new URLSearchParams();
      if (_state.snippetFilter.category) params.set('category', _state.snippetFilter.category);
      if (_state.snippetFilter.firmware) params.set('firmware', _state.snippetFilter.firmware);
      if (_state.snippetFilter.q) params.set('q', _state.snippetFilter.q);
      const res = await fetch('/api/gcode/snippets?' + params.toString());
      _state.snippets = await res.json();
      _renderSnippets();

      const cats = await (await fetch('/api/gcode/snippets/categories')).json();
      const sel = document.getElementById('gcs-snip-cat');
      if (sel) {
        sel.innerHTML = '<option value="">All categories</option>' +
          cats.map(c => `<option value="${_esc(c.category)}" ${c.category === _state.snippetFilter.category ? 'selected' : ''}>${_esc(c.category)} (${c.count})</option>`).join('');
      }
    } catch (e) {
      _toast(`Snippet load failed: ${e.message}`, 'error');
    }
  }

  function _renderSnippets() {
    const el = document.getElementById('gcs-snip-list');
    if (!el) return;
    if (!_state.snippets.length) {
      el.innerHTML = '<div class="text-muted" style="padding:8px;font-size:0.72rem">No snippets match. Click + New to add one.</div>';
      return;
    }
    el.innerHTML = _state.snippets.map(s => `
      <div class="gcs-snip" onclick="window._gcs.insertSnippet(${s.id})">
        <div class="gcs-snip-head">
          <span class="gcs-snip-name">${_esc(s.name)}</span>
          <span class="gcs-snip-fw">${_esc(s.firmware || 'auto')}</span>
        </div>
        ${s.description ? `<div class="gcs-snip-desc">${_esc(s.description)}</div>` : ''}
        <div class="gcs-snip-actions">
          <button class="form-btn form-btn-sm" onclick="event.stopPropagation();window._gcs.editSnippet(${s.id})">Edit</button>
          <button class="form-btn form-btn-sm form-btn-danger" onclick="event.stopPropagation();window._gcs.deleteSnippet(${s.id})">Delete</button>
        </div>
      </div>`).join('');
  }

  async function _insertSnippet(id) {
    const s = _state.snippets.find(x => x.id === id);
    if (!s) return;
    const ed = document.getElementById('gcs-editor');
    if (!ed) return;
    const insertAt = ed.selectionStart || ed.value.length;
    const before = ed.value.slice(0, insertAt);
    const after = ed.value.slice(insertAt);
    const block = `\n${s.body}\n`;
    ed.value = before + block + after;
    _state.text = ed.value;
    ed.focus();
    ed.setSelectionRange(insertAt + block.length, insertAt + block.length);
    _toast(`Inserted: ${s.name}`, 'success');
    _renderStats();
  }

  function _newSnippet() { _editSnippetDialog(null); }
  function _editSnippet(id) {
    const s = _state.snippets.find(x => x.id === id);
    if (s) _editSnippetDialog(s);
  }

  function _editSnippetDialog(snip) {
    const isEdit = !!snip;
    snip = snip || { name: '', category: '', firmware: 'auto', description: '', body: '', tags: '' };
    const overlay = document.createElement('div');
    overlay.className = 'gcs-dialog-overlay';
    overlay.innerHTML = `
      <div class="gcs-dialog">
        <h3 style="margin:0 0 12px">${isEdit ? 'Edit' : 'New'} snippet</h3>
        <label class="form-label">Name <input class="form-input" id="gcs-d-name" value="${_esc(snip.name)}"></label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
          <label class="form-label">Category <input class="form-input" id="gcs-d-cat" value="${_esc(snip.category || '')}" placeholder="e.g. movement"></label>
          <label class="form-label">Firmware
            <select class="form-input" id="gcs-d-fw">
              <option value="auto" ${snip.firmware === 'auto' ? 'selected' : ''}>Auto</option>
              <option value="marlin" ${snip.firmware === 'marlin' ? 'selected' : ''}>Marlin</option>
              <option value="klipper" ${snip.firmware === 'klipper' ? 'selected' : ''}>Klipper</option>
              <option value="reprap" ${snip.firmware === 'reprap' ? 'selected' : ''}>RepRap</option>
              <option value="snapmaker" ${snip.firmware === 'snapmaker' ? 'selected' : ''}>Snapmaker</option>
            </select>
          </label>
        </div>
        <label class="form-label" style="margin-top:8px">Description <input class="form-input" id="gcs-d-desc" value="${_esc(snip.description || '')}"></label>
        <label class="form-label" style="margin-top:8px">Body
          <textarea class="form-input" id="gcs-d-body" style="min-height:140px;font-family:ui-monospace,Menlo,monospace">${_esc(snip.body)}</textarea>
        </label>
        <label class="form-label" style="margin-top:8px">Tags <input class="form-input" id="gcs-d-tags" value="${_esc(snip.tags || '')}" placeholder="comma,separated"></label>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
          <button class="form-btn" onclick="this.closest('.gcs-dialog-overlay').remove()">Cancel</button>
          <button class="form-btn form-btn-success" id="gcs-d-save">Save</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    document.getElementById('gcs-d-save').onclick = async () => {
      const data = {
        name: document.getElementById('gcs-d-name').value.trim(),
        category: document.getElementById('gcs-d-cat').value.trim(),
        firmware: document.getElementById('gcs-d-fw').value,
        description: document.getElementById('gcs-d-desc').value.trim(),
        body: document.getElementById('gcs-d-body').value,
        tags: document.getElementById('gcs-d-tags').value.trim(),
        is_shared: 1,
      };
      try {
        const res = await fetch('/api/gcode/snippets' + (isEdit ? '/' + snip.id : ''), {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'save failed');
        overlay.remove();
        _toast(isEdit ? 'Snippet updated' : 'Snippet created', 'success');
        _loadSnippets();
      } catch (e) {
        _toast('Save failed: ' + e.message, 'error');
      }
    };
  }

  async function _deleteSnippet(id) {
    if (!confirm('Delete this snippet?')) return;
    try {
      const res = await fetch('/api/gcode/snippets/' + id, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      _toast('Deleted', 'success');
      _loadSnippets();
    } catch (e) {
      _toast('Delete failed: ' + e.message, 'error');
    }
  }

  function _searchSnippets(q) {
    _state.snippetFilter.q = q;
    clearTimeout(_searchSnippets._t);
    _searchSnippets._t = setTimeout(_loadSnippets, 250);
  }

  function _filterSnippets(key, value) {
    _state.snippetFilter[key] = value;
    _loadSnippets();
  }

  function _gotoLine(lineNo) {
    const ed = document.getElementById('gcs-editor');
    if (!ed) return;
    const lines = ed.value.split('\n');
    let pos = 0;
    for (let i = 0; i < lineNo - 1 && i < lines.length; i++) pos += lines[i].length + 1;
    ed.focus();
    ed.setSelectionRange(pos, pos + (lines[lineNo - 1] || '').length);
  }

  function _openTransformDialog() {
    if (!_state.text) { _toast('No G-code loaded', 'warn'); return; }
    const overlay = document.createElement('div');
    overlay.className = 'gcs-dialog-overlay';
    overlay.innerHTML = `
      <div class="gcs-dialog" style="min-width:480px">
        <h3 style="margin:0 0 12px">Post-process G-code</h3>
        <p class="text-muted" style="font-size:0.75rem;margin:0 0 12px">Modifies the editor content. Original file untouched until you Download.</p>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div>
            <label><input type="checkbox" id="gcs-op-bed"> Set bed temp <input id="gcs-op-bed-v" type="number" class="form-input form-input-sm" value="60" style="width:80px;display:inline-block">°C</label>
          </div>
          <div>
            <label><input type="checkbox" id="gcs-op-hotend"> Set hotend temp <input id="gcs-op-hotend-v" type="number" class="form-input form-input-sm" value="210" style="width:80px;display:inline-block">°C</label>
          </div>
          <div>
            <label><input type="checkbox" id="gcs-op-speed"> Multiply feedrate by <input id="gcs-op-speed-v" type="number" step="0.1" class="form-input form-input-sm" value="1.0" style="width:70px;display:inline-block"></label>
          </div>
          <div>
            <label><input type="checkbox" id="gcs-op-fan"> Multiply fan speed by <input id="gcs-op-fan-v" type="number" step="0.1" class="form-input form-input-sm" value="1.0" style="width:70px;display:inline-block"> (0–1)</label>
          </div>
          <div>
            <label><input type="checkbox" id="gcs-op-pause"> Insert pause at layer <input id="gcs-op-pause-v" type="number" class="form-input form-input-sm" value="10" style="width:70px;display:inline-block"></label>
          </div>
          <div>
            <label><input type="checkbox" id="gcs-op-strip"> Strip comments</label>
            <label style="margin-left:12px"><input type="checkbox" id="gcs-op-lines"> Add line numbers</label>
          </div>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">
          <button class="form-btn" onclick="this.closest('.gcs-dialog-overlay').remove()">Cancel</button>
          <button class="form-btn form-btn-success" id="gcs-do-transform">Apply</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    document.getElementById('gcs-do-transform').onclick = async () => {
      const ops = [];
      if (document.getElementById('gcs-op-bed').checked) ops.push({ op: 'set-bed', value: parseInt(document.getElementById('gcs-op-bed-v').value, 10) });
      if (document.getElementById('gcs-op-hotend').checked) ops.push({ op: 'set-hotend', value: parseInt(document.getElementById('gcs-op-hotend-v').value, 10) });
      if (document.getElementById('gcs-op-speed').checked) ops.push({ op: 'speed-mul', factor: parseFloat(document.getElementById('gcs-op-speed-v').value) });
      if (document.getElementById('gcs-op-fan').checked) ops.push({ op: 'fan-mul', factor: parseFloat(document.getElementById('gcs-op-fan-v').value) });
      if (document.getElementById('gcs-op-pause').checked) ops.push({ op: 'pause-at-layer', layer: parseInt(document.getElementById('gcs-op-pause-v').value, 10) });
      if (document.getElementById('gcs-op-strip').checked) ops.push({ op: 'strip-comments' });
      if (document.getElementById('gcs-op-lines').checked) ops.push({ op: 'line-numbers' });
      if (!ops.length) { _toast('Select at least one operation', 'warn'); return; }
      try {
        const res = await fetch('/api/gcode/transform', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: _state.text, ops }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'transform failed');
        _state.text = data.text;
        document.getElementById('gcs-editor').value = _state.text;
        _renderStats();
        overlay.remove();
        _toast(`Applied ${ops.length} operation${ops.length === 1 ? '' : 's'}`, 'success');
      } catch (e) {
        _toast('Transform failed: ' + e.message, 'error');
      }
    };
  }

  function _download() {
    if (!_state.text) { _toast('Nothing to download', 'warn'); return; }
    const blob = new Blob([_state.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = _state.filename || 'untitled.gcode';
    a.click();
    URL.revokeObjectURL(url);
  }

  function _preview3D() {
    if (!_state.text) { _toast('No G-code loaded', 'warn'); return; }
    if (typeof window.openGcodeViewerFromText === 'function') return window.openGcodeViewerFromText(_state.text, _state.filename);
    // Fallback: parse basic toolpath inline
    _toast('3D preview opens in a separate viewer (load file via standard upload).', 'info');
  }

  function _onEdit(value) {
    _state.text = value;
    _renderStats();
  }

  function _setFirmware(v) { _state.firmware = v; }

  function _fmtBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1024 / 1024).toFixed(1) + ' MB';
  }

  // Public API exposed for the lazy panel loader.
  window.loadGcodeStudio = _load;
  window._gcs = {
    lint: _lint,
    insertSnippet: _insertSnippet,
    newSnippet: _newSnippet,
    editSnippet: _editSnippet,
    deleteSnippet: _deleteSnippet,
    searchSnippets: _searchSnippets,
    filterSnippets: _filterSnippets,
    gotoLine: _gotoLine,
    openTransformDialog: _openTransformDialog,
    download: _download,
    preview3D: _preview3D,
    onEdit: _onEdit,
    setFirmware: _setFirmware,
  };
})();
