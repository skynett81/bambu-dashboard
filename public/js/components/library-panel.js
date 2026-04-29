// STL/3MF Library — file manager for 3D print files
(function() {
  let _files = [];
  let _categories = [];
  let _filter = { category: '', type: '', search: '' };
  let _offset = 0;
  const PAGE = 24;
  let _fileSelectMode = false;
  let _selectedFiles = new Set();

  window.loadLibraryPanel = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    el.innerHTML = `<style>
      .lib-toolbar { display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap; align-items:center; }
      .lib-search { flex:1; min-width:180px; padding:8px 12px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); color:var(--text-primary); font-size:0.85rem; }
      .lib-filter-select { padding:7px 10px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); color:var(--text-primary); font-size:0.8rem; }
      .lib-upload-btn { background:var(--accent-blue); color:#fff; border:none; border-radius:var(--radius); padding:8px 16px; cursor:pointer; font-size:0.8rem; font-weight:600; transition:opacity 0.15s; }
      .lib-upload-btn:hover { opacity:0.85; }
      .lib-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:14px; }
      .lib-card { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); overflow:hidden; cursor:pointer; transition:box-shadow 0.2s; }
      .lib-card:hover { box-shadow:var(--shadow-lg); }
      .lib-thumb { width:100%; aspect-ratio:4/3; background:var(--bg-tertiary); display:flex; align-items:center; justify-content:center; overflow:hidden; }
      .lib-thumb img { width:100%; height:100%; object-fit:cover; }
      .lib-thumb-placeholder { color:var(--text-muted); font-size:2rem; }
      .lib-card-body { padding:10px 12px; }
      .lib-card-name { font-size:0.8rem; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .lib-card-meta { font-size:0.68rem; color:var(--text-muted); margin-top:4px; display:flex; gap:8px; flex-wrap:wrap; }
      .lib-card-badge { display:inline-block; padding:2px 7px; border-radius:8px; font-size:0.6rem; font-weight:600; text-transform:uppercase; background:rgba(18,121,255,0.1); color:var(--accent-blue); margin-top:4px; }
      .lib-card-tags { display:flex; gap:4px; flex-wrap:wrap; margin-top:4px; }
      .lib-tag { font-size:0.6rem; padding:1px 6px; border-radius:6px; background:var(--bg-tertiary); color:var(--text-secondary); }
      .lib-empty { text-align:center; padding:40px; color:var(--text-muted); }
      .lib-load-more { display:block; margin:20px auto 0; padding:8px 24px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); cursor:pointer; color:var(--text-primary); font-size:0.8rem; }
      .lib-dialog-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:999; display:flex; align-items:center; justify-content:center; }
      .lib-dialog { background:var(--bg-primary); border-radius:var(--radius-lg, 12px); padding:24px; width:min(480px, 90vw); max-height:85vh; overflow-y:auto; box-shadow:var(--shadow-lg); }
      .lib-dialog h3 { margin:0 0 16px; font-size:1rem; }
      .lib-field { margin-bottom:12px; }
      .lib-field label { display:block; font-size:0.75rem; font-weight:600; color:var(--text-muted); margin-bottom:4px; }
      .lib-field input, .lib-field select, .lib-field textarea { width:100%; padding:8px 10px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); color:var(--text-primary); font-size:0.85rem; box-sizing:border-box; }
      .lib-dialog-actions { display:flex; gap:8px; justify-content:flex-end; margin-top:16px; }
      .lib-dialog-actions button { padding:8px 18px; border-radius:var(--radius); font-size:0.8rem; font-weight:600; cursor:pointer; border:none; }
      .lib-btn-cancel { background:var(--bg-secondary); color:var(--text-primary); border:1px solid var(--border-color) !important; }
      .lib-btn-save { background:var(--accent-blue); color:#fff; }
      .lib-btn-delete { background:var(--accent-red); color:#fff; }
      .lib-detail-row { display:flex; gap:6px; font-size:0.78rem; margin-bottom:6px; }
      .lib-detail-label { color:var(--text-muted); min-width:100px; }
      .lib-detail-value { color:var(--text-primary); font-weight:600; }
      .lib-drop-zone { border:2px dashed var(--border-color); border-radius:var(--radius); padding:30px; text-align:center; color:var(--text-muted); font-size:0.85rem; transition:border-color 0.2s; cursor:pointer; }
      .lib-drop-zone.dragover { border-color:var(--accent-blue); background:rgba(18,121,255,0.05); }
      .lib-3d-btn { background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:var(--radius); padding:5px 10px; cursor:pointer; color:var(--text-secondary); font-size:0.72rem; font-weight:600; transition:all 0.15s; display:inline-flex; align-items:center; gap:4px; }
      .lib-3d-btn:hover { background:var(--accent-blue); color:#fff; border-color:var(--accent-blue); }
      .lib-3d-viewer-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.8); z-index:10000; display:flex; align-items:center; justify-content:center; }
      .lib-3d-viewer-wrap { background:var(--bg-primary); border-radius:var(--radius-lg, 12px); width:min(1100px, 95vw); height:min(700px, 85vh); display:flex; flex-direction:column; overflow:hidden; box-shadow:var(--shadow-lg); }
      .lib-3d-toolbar { display:flex; align-items:center; gap:10px; padding:10px 16px; background:var(--bg-secondary); border-bottom:1px solid var(--border-color); }
      .lib-3d-toolbar h4 { margin:0; font-size:0.9rem; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .lib-3d-content { flex:1; display:flex; min-height:0; }
      .lib-3d-canvas-wrap { flex:1; min-width:0; }
      .lib-3d-info { width:240px; padding:14px; overflow-y:auto; border-left:1px solid var(--border-color); font-size:0.78rem; }
      .lib-3d-info h5 { margin:0 0 8px; font-size:0.82rem; color:var(--text-muted); }
      .lib-3d-info-row { display:flex; justify-content:space-between; margin-bottom:5px; }
      .lib-3d-info-label { color:var(--text-muted); }
      .lib-3d-info-value { color:var(--text-primary); font-weight:600; }
      @media (max-width:768px) { .lib-3d-info { display:none; } }
      .lib-progress { height:4px; background:var(--bg-tertiary); border-radius:2px; margin-top:8px; overflow:hidden; }
      .lib-progress-bar { height:100%; background:var(--accent-blue); transition:width 0.3s; }
      .lib-cat-pills { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px; }
      .lib-cat-pill { padding:5px 12px; border-radius:16px; font-size:0.75rem; font-weight:600; cursor:pointer; background:var(--bg-secondary); border:1px solid var(--border-color); color:var(--text-secondary); transition:all 0.15s; }
      .lib-cat-pill.active { background:var(--accent-blue); color:#fff; border-color:var(--accent-blue); }
      @media (max-width:600px) { .lib-grid { grid-template-columns:repeat(auto-fill, minmax(150px, 1fr)); } }
    </style>
    <div class="lib-toolbar">
      <input class="lib-search" type="text" placeholder="${t('library.search_placeholder')}" id="lib-search" oninput="_libSearch(this.value)">
      <select class="lib-filter-select" id="lib-type-filter" onchange="_libFilterType(this.value)">
        <option value="">${t('library.all_types')}</option>
        <option value="3mf">3MF</option>
        <option value="stl">STL</option>
        <option value="gcode">G-code</option>
        <option value="obj">OBJ</option>
        <option value="step">STEP</option>
      </select>
      <button class="lib-upload-btn" onclick="_libShowUpload()">+ ${t('library.upload')}</button>
      <button class="form-btn form-btn-secondary" onclick="_toggleFileSelectMode()" id="file-select-toggle" style="padding:4px 10px;font-size:0.75rem">${_fileSelectMode ? '\u2713 Done' : '\u2610 ' + (t('library.select', 'Select'))}</button>
    </div>
    <div class="lib-cat-pills" id="lib-cats"></div>
    <div class="lib-grid" id="lib-grid"></div>
    <div id="lib-load-more-wrap"></div>
    <div class="batch-bar" id="file-batch-bar" style="display:none">
      <span id="file-batch-count">0 selected</span>
      <button class="form-btn form-btn-secondary" onclick="_batchAddToQueue()" style="padding:4px 10px;font-size:0.75rem">${t('library.add_to_queue', 'Add to queue')}</button>
      <button class="form-btn form-btn-danger" onclick="_batchDeleteFiles()" style="padding:4px 10px;font-size:0.75rem">${t('common.delete', 'Delete')}</button>
      <button class="form-btn form-btn-secondary" onclick="_clearFileSelection()" style="padding:4px 10px;font-size:0.75rem">${t('library.clear', 'Clear')}</button>
    </div>`;

    _offset = 0;
    _filter = { category: '', type: '', search: '' };
    _loadCategories();
    _loadFiles(true);
  };

  async function _loadCategories() {
    try {
      const r = await fetch('/api/library/categories');
      _categories = await r.json();
    } catch { _categories = []; }
    _renderCategories();
  }

  function _renderCategories() {
    const el = document.getElementById('lib-cats');
    if (!el) return;
    let html = `<div class="lib-cat-pill${!_filter.category ? ' active' : ''}" onclick="_libFilterCat('')">${t('library.all')}</div>`;
    for (const c of _categories) {
      const active = _filter.category === c.category ? ' active' : '';
      html += `<div class="lib-cat-pill${active}" onclick="_libFilterCat('${_esc(c.category)}')">${_esc(c.category)} (${c.count})</div>`;
    }
    el.innerHTML = html;
  }

  async function _loadFiles(reset) {
    if (reset) { _offset = 0; _files = []; }
    const params = new URLSearchParams({ limit: PAGE, offset: _offset });
    if (_filter.category) params.set('category', _filter.category);
    if (_filter.type) params.set('type', _filter.type);
    if (_filter.search) params.set('q', _filter.search);
    try {
      const r = await fetch(`/api/library?${params}`);
      const raw = await r.json();
      const data = Array.isArray(raw) ? raw : [];
      if (reset) _files = data;
      else _files = _files.concat(data);
      _renderGrid();
      // Show "load more" if we got a full page
      const wrap = document.getElementById('lib-load-more-wrap');
      if (wrap) {
        wrap.innerHTML = data.length >= PAGE
          ? `<button class="lib-load-more" onclick="_libLoadMore()">${t('library.load_more')}</button>`
          : '';
      }
    } catch {}
  }

  function _renderGrid() {
    const grid = document.getElementById('lib-grid');
    if (!grid) return;
    if (!_files.length) {
      grid.innerHTML = `<div class="lib-empty">${t('library.no_files')}</div>`;
      return;
    }
    let html = '';
    for (const f of _files) {
      const thumb = f.thumbnail_path
        ? `<img src="/api/library/${f.id}/thumbnail" alt="" loading="lazy">`
        : `<div class="lib-thumb-placeholder">${_typeIcon(f.file_type)}</div>`;
      const size = _fmtSize(f.file_size);
      const tags = f.tags ? f.tags.split(',').map(t => `<span class="lib-tag">${_esc(t.trim())}</span>`).join('') : '';
      const checked = _selectedFiles.has(String(f.id)) ? ' checked' : '';
      html += `<div class="lib-card" style="position:relative" onclick="${_fileSelectMode ? `_toggleFileCheck(${f.id})` : `_libDetail(${f.id})`}">
        ${_fileSelectMode ? `<input type="checkbox" class="file-select-check" data-file-id="${f.id}" style="position:absolute;top:8px;left:8px;width:18px;height:18px;z-index:2;cursor:pointer"${checked} onclick="event.stopPropagation();_onFileSelect()">` : ''}
        <div class="lib-thumb">${thumb}</div>
        <div class="lib-card-body">
          <div class="lib-card-name" title="${_esc(f.original_name)}">${_esc(f.original_name)}</div>
          <div class="lib-card-meta">
            <span>${f.file_type.toUpperCase()}</span>
            <span>${size}</span>
            ${f.print_count ? `<span>${f.print_count}x</span>` : ''}
          </div>
          ${f.category !== 'uncategorized' ? `<span class="lib-card-badge">${_esc(f.category)}</span>` : ''}
          ${tags ? `<div class="lib-card-tags">${tags}</div>` : ''}
          ${f.file_type === '3mf' ? `<button class="lib-3d-btn" style="margin-top:6px" onclick="event.stopPropagation();_lib3DPreview(${f.id},'${_esc(f.original_name).replace(/'/g, "\\'")}')">&#x25B6; 3D ${t('library.preview', 'Preview')}</button>` : ''}
          <div style="display:flex;gap:3px;margin-top:4px">
            <button class="lib-3d-btn" style="background:var(--accent-cyan);font-size:0.6rem;padding:2px 6px" onclick="event.stopPropagation();_libSendToPrinter(${f.id},'${_esc(f.original_name).replace(/'/g, "\\'")}')">🖨️ Print</button>
            <button class="lib-3d-btn" style="font-size:0.6rem;padding:2px 6px" onclick="event.stopPropagation();_libAddToQueue(${f.id},'${_esc(f.original_name).replace(/'/g, "\\'")}')">📋 Queue</button>
          </div>
        </div>
      </div>`;
    }
    grid.innerHTML = html;
  }

  window._libSearch = _debounce(function(val) {
    _filter.search = val;
    _loadFiles(true);
  }, 300);

  window._libFilterType = function(val) {
    _filter.type = val;
    _loadFiles(true);
  };

  window._libFilterCat = function(cat) {
    _filter.category = cat;
    _loadFiles(true);
    _renderCategories();
  };

  window._libLoadMore = function() {
    _offset += PAGE;
    _loadFiles(false);
  };

  // Upload dialog
  window._libShowUpload = function() {
    const overlay = document.createElement('div');
    overlay.className = 'lib-dialog-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="lib-dialog">
      <h3>${t('library.upload_title')}</h3>
      <div class="lib-drop-zone" id="lib-drop-zone" onclick="document.getElementById('lib-file-input').click()">
        ${t('library.drop_hint')}
        <input type="file" id="lib-file-input" accept=".stl,.3mf,.obj,.step,.gcode" multiple style="display:none" onchange="_libHandleFiles(this.files)">
      </div>
      <div class="lib-field" style="margin-top:12px">
        <label>${t('library.category')}</label>
        <input type="text" id="lib-upload-cat" placeholder="${t('library.category_placeholder')}" list="lib-cat-list">
        <datalist id="lib-cat-list">${_categories.map(c => `<option value="${_esc(c.category)}">`).join('')}</datalist>
      </div>
      <div class="lib-field">
        <label>${t('library.tags')}</label>
        <input type="text" id="lib-upload-tags" placeholder="${t('library.tags_placeholder')}">
      </div>
      <div id="lib-upload-progress"></div>
      <div class="lib-dialog-actions">
        <button class="lib-btn-cancel" onclick="this.closest('.lib-dialog-overlay').remove()">${t('library.close')}</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);

    // Drag & drop
    const zone = overlay.querySelector('#lib-drop-zone');
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      _libHandleFiles(e.dataTransfer.files);
    });
  };

  window._libHandleFiles = async function(fileList) {
    const cat = document.getElementById('lib-upload-cat')?.value?.trim() || 'uncategorized';
    const tags = document.getElementById('lib-upload-tags')?.value?.trim() || '';
    const progressEl = document.getElementById('lib-upload-progress');
    if (!progressEl) return;

    for (const file of fileList) {
      progressEl.innerHTML += `<div style="font-size:0.8rem;margin-top:6px">${_esc(file.name)} <span id="lib-up-${file.name.replace(/\W/g,'_')}" style="color:var(--text-muted)">...</span></div>
        <div class="lib-progress"><div class="lib-progress-bar" id="lib-bar-${file.name.replace(/\W/g,'_')}" style="width:0%"></div></div>`;

      const statusEl = document.getElementById(`lib-up-${file.name.replace(/\W/g,'_')}`);
      const barEl = document.getElementById(`lib-bar-${file.name.replace(/\W/g,'_')}`);
      try {
        const buffer = await file.arrayBuffer();
        const params = new URLSearchParams({ filename: file.name, category: cat });
        if (tags) params.set('tags', tags);
        if (barEl) barEl.style.width = '50%';
        const r = await fetch(`/api/library/upload?${params}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: buffer
        });
        if (r.ok) {
          if (statusEl) statusEl.textContent = t('library.uploaded');
          if (statusEl) statusEl.style.color = 'var(--accent-green)';
        } else {
          const err = await r.json().catch(() => ({}));
          if (statusEl) statusEl.textContent = err.error || 'Error';
          if (statusEl) statusEl.style.color = 'var(--accent-red)';
        }
        if (barEl) barEl.style.width = '100%';
      } catch (e) {
        if (statusEl) statusEl.textContent = e.message;
        if (statusEl) statusEl.style.color = 'var(--accent-red)';
      }
    }
    _loadFiles(true);
    _loadCategories();
  };

  // Detail dialog
  window._libDetail = async function(id) {
    const f = _files.find(f => f.id === id);
    if (!f) return;

    const overlay = document.createElement('div');
    overlay.className = 'lib-dialog-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    const thumb = f.thumbnail_path ? `<img src="/api/library/${f.id}/thumbnail" style="max-width:100%;border-radius:var(--radius);margin-bottom:12px">` : '';
    const duration = f.estimated_time_s ? _fmtDuration(f.estimated_time_s) : '--';
    const weight = f.estimated_filament_g ? `${f.estimated_filament_g.toFixed(1)}g` : '--';

    overlay.innerHTML = `<div class="lib-dialog">
      <h3>${_esc(f.original_name)}</h3>
      ${thumb}
      <div class="lib-detail-row"><span class="lib-detail-label">${t('library.type')}</span><span class="lib-detail-value">${f.file_type.toUpperCase()}</span></div>
      <div class="lib-detail-row"><span class="lib-detail-label">${t('library.size')}</span><span class="lib-detail-value">${_fmtSize(f.file_size)}</span></div>
      <div class="lib-detail-row"><span class="lib-detail-label">${t('library.est_time')}</span><span class="lib-detail-value">${duration}</span></div>
      <div class="lib-detail-row"><span class="lib-detail-label">${t('library.est_filament')}</span><span class="lib-detail-value">${weight}</span></div>
      ${f.filament_type ? `<div class="lib-detail-row"><span class="lib-detail-label">${t('library.material')}</span><span class="lib-detail-value">${_esc(f.filament_type)}</span></div>` : ''}
      <div class="lib-detail-row"><span class="lib-detail-label">${t('library.prints')}</span><span class="lib-detail-value">${f.print_count || 0}</span></div>
      <div class="lib-detail-row"><span class="lib-detail-label">${t('library.added')}</span><span class="lib-detail-value">${f.added_at ? new Date(f.added_at).toLocaleDateString() : '--'}</span></div>
      <div class="lib-field" style="margin-top:12px">
        <label>${t('library.category')}</label>
        <input type="text" id="lib-edit-cat" value="${_esc(f.category || '')}" list="lib-cat-list-edit">
        <datalist id="lib-cat-list-edit">${_categories.map(c => `<option value="${_esc(c.category)}">`).join('')}</datalist>
      </div>
      <div class="lib-field">
        <label>${t('library.tags')}</label>
        <input type="text" id="lib-edit-tags" value="${_esc(f.tags || '')}">
      </div>
      <div class="lib-field">
        <label>${t('library.notes')}</label>
        <textarea id="lib-edit-notes">${_esc(f.notes || '')}</textarea>
      </div>
      <div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap">
        <button class="lib-btn-save" style="background:var(--accent-cyan)" onclick="_libSendToPrinter(${f.id},'${_esc(f.original_name).replace(/'/g, "\\'")}')">🖨️ Send to Printer</button>
        <button class="lib-btn-save" style="background:var(--accent-blue)" onclick="_libAddToQueue(${f.id},'${_esc(f.original_name).replace(/'/g, "\\'")}')">📋 Queue</button>
        <a href="/api/library/${f.id}/download" class="lib-btn-cancel" style="text-decoration:none;text-align:center">📥 Download</a>
        ${f.file_type === '3mf' ? `<button class="lib-3d-btn" onclick="event.stopPropagation();_lib3DPreview(${f.id},'${_esc(f.original_name).replace(/'/g, "\\'")}')">🧊 3D</button>` : ''}
      </div>
      <div class="lib-dialog-actions" style="margin-top:8px">
        <button class="lib-btn-delete" onclick="_libDelete(${f.id})">${t('library.delete')}</button>
        <div style="flex:1"></div>
        <button class="lib-btn-cancel" onclick="this.closest('.lib-dialog-overlay').remove()">${t('library.close')}</button>
        <button class="lib-btn-save" onclick="_libSave(${f.id})">${t('library.save')}</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
  };

  window._libSave = async function(id) {
    const category = document.getElementById('lib-edit-cat')?.value?.trim() || 'uncategorized';
    const tags = document.getElementById('lib-edit-tags')?.value?.trim() || null;
    const notes = document.getElementById('lib-edit-notes')?.value?.trim() || null;
    try {
      await fetch(`/api/library/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, tags, notes })
      });
      document.querySelector('.lib-dialog-overlay')?.remove();
      _loadFiles(true);
      _loadCategories();
      if (typeof showToast === 'function') showToast(t('library.saved'), 'success');
    } catch {
      if (typeof showToast === 'function') showToast(t('library.save_error'), 'error');
    }
  };

  window._libSendToPrinter = async function(id, filename) {
    const state = window.printerState;
    const printerIds = state ? state.getPrinterIds() : [];
    if (printerIds.length === 0) { if (typeof showToast === 'function') showToast('No printers connected', 'error'); return; }

    // Build printer selector
    let printerOpts = printerIds.map(pid => {
      const meta = state.printerMeta?.[pid] || {};
      return `<option value="${pid}">${meta.name || pid}</option>`;
    }).join('');

    const overlay = document.createElement('div');
    overlay.className = 'lib-dialog-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="lib-dialog" style="max-width:350px;padding:16px">
      <h4 style="margin:0 0 12px">Send to Printer</h4>
      <div style="margin-bottom:10px"><label style="font-size:0.8rem">File: <strong>${filename}</strong></label></div>
      <div style="margin-bottom:10px"><label style="font-size:0.8rem">Printer</label><select class="form-input" id="lib-send-printer">${printerOpts}</select></div>
      <label style="font-size:0.8rem;display:flex;align-items:center;gap:6px;margin-bottom:12px"><input type="checkbox" id="lib-send-start"> Start printing immediately</label>
      <div style="display:flex;gap:6px;justify-content:flex-end">
        <button class="form-btn form-btn-sm" onclick="this.closest('.lib-dialog-overlay').remove()">Cancel</button>
        <button class="form-btn form-btn-sm" style="background:var(--accent-cyan);color:#fff" onclick="window._libDoSend(${id},'${filename.replace(/'/g,"\\'")}')">Send</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
  };

  window._libDoSend = async function(id, filename) {
    const printerId = document.getElementById('lib-send-printer')?.value;
    const startPrint = document.getElementById('lib-send-start')?.checked;
    if (!printerId) return;
    document.querySelector('.lib-dialog-overlay')?.remove();

    try {
      if (typeof showToast === 'function') showToast('Uploading to printer...', 'info');
      // Download file from library
      const fileRes = await fetch(`/api/library/${id}/download`);
      if (!fileRes.ok) throw new Error('Failed to download from library');
      const buffer = await fileRes.arrayBuffer();

      // Upload to printer via Moonraker API
      const uploadRes = await fetch(`/api/printers/${encodeURIComponent(printerId)}/moonraker/upload?filename=${encodeURIComponent(filename)}&print=${startPrint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: buffer,
      });
      const result = await uploadRes.json();
      if (result.ok) {
        if (typeof showToast === 'function') showToast(startPrint ? 'Sent and printing!' : 'Uploaded to printer!', 'success');
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (e) {
      if (typeof showToast === 'function') showToast(e.message, 'error');
    }
  };

  window._libAddToQueue = async function(id, filename) {
    try {
      const qRes = await fetch('/api/queue');
      const raw = await qRes.json();
      const queues = Array.isArray(raw) ? raw : [];
      if (queues.length === 0) { if (typeof showToast === 'function') showToast('No queues available — create one first', 'warning'); return; }
      await fetch(`/api/queue/${queues[0].id}/items`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, library_id: id })
      });
      if (typeof showToast === 'function') showToast(`Added "${filename}" to queue`, 'success');
    } catch (e) {
      if (typeof showToast === 'function') showToast(e.message, 'error');
    }
  };

  window._libDelete = async function(id) {
    if (!confirm(t('library.confirm_delete'))) return;
    try {
      await fetch(`/api/library/${id}`, { method: 'DELETE' });
      document.querySelector('.lib-dialog-overlay')?.remove();
      _loadFiles(true);
      _loadCategories();
      if (typeof showToast === 'function') showToast(t('library.deleted'), 'success');
    } catch {}
  };

  function _typeIcon(type) {
    const icons = { '3mf': '\u2B22', 'stl': '\u25B2', 'gcode': '\u2261', 'obj': '\u25CE', 'step': '\u2B1A' };
    return icons[type] || '\u25A0';
  }

  function _fmtSize(bytes) {
    if (!bytes) return '--';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`;
    return `${(bytes/1048576).toFixed(1)} MB`;
  }

  function _fmtDuration(seconds) {
    if (!seconds) return '--';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  function _debounce(fn, ms) {
    let timer;
    return function(...args) { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
  }

  function _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

  // ── Batch file management ──

  window._toggleFileSelectMode = function() {
    _fileSelectMode = !_fileSelectMode;
    _selectedFiles.clear();
    _renderGrid();
    _updateBatchBar();
    const toggle = document.getElementById('file-select-toggle');
    if (toggle) toggle.textContent = _fileSelectMode ? '\u2713 Done' : '\u2610 ' + (t('library.select', 'Select'));
  };

  window._toggleFileCheck = function(id) {
    const key = String(id);
    if (_selectedFiles.has(key)) _selectedFiles.delete(key);
    else _selectedFiles.add(key);
    _renderGrid();
    _updateBatchBar();
  };

  window._onFileSelect = function() {
    _selectedFiles.clear();
    document.querySelectorAll('.file-select-check:checked').forEach(cb => {
      _selectedFiles.add(cb.dataset.fileId);
    });
    _updateBatchBar();
  };

  function _updateBatchBar() {
    const bar = document.getElementById('file-batch-bar');
    const count = document.getElementById('file-batch-count');
    if (bar) bar.style.display = (_fileSelectMode && _selectedFiles.size > 0) ? 'flex' : 'none';
    if (count) count.textContent = `${_selectedFiles.size} ${t('library.selected', 'valgt')}`;
  }

  window._clearFileSelection = function() {
    _selectedFiles.clear();
    document.querySelectorAll('.file-select-check').forEach(cb => cb.checked = false);
    _updateBatchBar();
  };

  window._batchDeleteFiles = function() {
    if (_selectedFiles.size === 0) return;
    if (typeof confirmAction === 'function') {
      confirmAction(`${t('library.delete_confirm_prefix', 'Delete')} ${_selectedFiles.size} ${_selectedFiles.size > 1 ? (t('library.files', 'files')) : (t('library.file', 'file'))}?`, async () => {
        let deleted = 0;
        for (const fileId of _selectedFiles) {
          try {
            const r = await fetch(`/api/library/${fileId}`, { method: 'DELETE' });
            if (r.ok) deleted++;
          } catch (_) {}
        }
        if (typeof showToast === 'function') showToast(`${t('library.deleted_prefix', 'Deleted')} ${deleted} ${deleted > 1 ? (t('library.files', 'files')) : (t('library.file', 'file'))}`, 'success');
        _selectedFiles.clear();
        _fileSelectMode = false;
        const toggle = document.getElementById('file-select-toggle');
        if (toggle) toggle.textContent = '\u2610 ' + (t('library.select', 'Select'));
        _loadFiles(true);
        _loadCategories();
      }, { danger: true });
    }
  };

  // ── 3D Preview ──

  let _activeViewer = null;

  window._lib3DPreview = async function(id, name) {
    // Close any existing detail dialog
    document.querySelector('.lib-dialog-overlay')?.remove();

    // Use 3MFConsortium viewer for library 3MF files (full-featured)
    if (typeof open3mfViewer === 'function') {
      open3mfViewer(`/api/library/${id}/download`, name);
      return;
    }

    // Fallback to EnhancedViewer
    if (typeof close3DPreview === 'function') close3DPreview();

    const overlay = document.createElement('div');
    overlay.className = 'lib-3d-viewer-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) _close3DPreview(overlay); };

    overlay.innerHTML = `<div class="lib-3d-viewer-wrap">
      <div class="lib-3d-toolbar">
        <h4>${_esc(name)}</h4>
        <button class="lib-3d-btn" id="lib-3d-wireframe" onclick="_toggle3DWireframe()">Wireframe</button>
        <button class="lib-3d-btn" id="lib-3d-shading" onclick="_toggle3DShading()">Flat</button>
        <button class="lib-3d-btn" onclick="_reset3DView()">Reset</button>
        <button class="lib-3d-btn" onclick="_close3DPreview(this.closest('.lib-3d-viewer-overlay'))" style="font-size:1.1rem;padding:4px 10px">&times;</button>
      </div>
      <div class="lib-3d-content">
        <div class="lib-3d-canvas-wrap" id="lib-3d-canvas-wrap">
          <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:0.9rem" id="lib-3d-loading">
            ${t('library.loading_model', 'Loading 3D model...')}
          </div>
        </div>
        <div class="lib-3d-info" id="lib-3d-info">
          <h5>${t('library.model_info', 'Modellinformasjon')}</h5>
          <div id="lib-3d-info-body"></div>
        </div>
      </div>
    </div>`;
    document.body.appendChild(overlay);

    // Keyboard close
    const onKey = (e) => { if (e.key === 'Escape') _close3DPreview(overlay); };
    document.addEventListener('keydown', onKey);
    overlay._keyHandler = onKey;

    try {
      const r = await fetch(`/api/library/${id}/model`);
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Failed');
      const data = await r.json();

      const canvasWrap = document.getElementById('lib-3d-canvas-wrap');
      const loading = document.getElementById('lib-3d-loading');
      if (loading) loading.remove();

      if (!window.EnhancedViewer) {
        canvasWrap.innerHTML = '<div style="padding:20px;color:var(--accent-red)">EnhancedViewer not loaded</div>';
        return;
      }

      const viewer = new window.EnhancedViewer(canvasWrap);
      await viewer.init();
      viewer.loadModel(data);
      _activeViewer = viewer;

      // Show model info
      const info = viewer.getModelInfo();
      const infoBody = document.getElementById('lib-3d-info-body');
      if (info && infoBody) {
        let html = '';
        html += `<div class="lib-3d-info-row"><span class="lib-3d-info-label">${t('library.dimensions', 'Dimensjoner')}</span><span class="lib-3d-info-value">${info.dimensions.x} × ${info.dimensions.y} × ${info.dimensions.z} mm</span></div>`;
        html += `<div class="lib-3d-info-row"><span class="lib-3d-info-label">${t('library.triangles', 'Trekanter')}</span><span class="lib-3d-info-value">${info.triangleCount.toLocaleString()}</span></div>`;
        html += `<div class="lib-3d-info-row"><span class="lib-3d-info-label">${t('library.vertices', 'Vertekser')}</span><span class="lib-3d-info-value">${info.vertexCount.toLocaleString()}</span></div>`;
        html += `<div class="lib-3d-info-row"><span class="lib-3d-info-label">${t('library.mesh_count', 'Mesh-deler')}</span><span class="lib-3d-info-value">${info.meshCount}</span></div>`;
        if (info.meshNames.length > 1) {
          html += `<h5 style="margin-top:12px">${t('library.mesh_list', 'Mesh-liste')}</h5>`;
          for (const name of info.meshNames) {
            html += `<div style="color:var(--text-secondary);margin-bottom:3px;font-size:0.72rem">${_esc(name)}</div>`;
          }
        }
        // Show 3MF metadata
        if (data.metadata && Object.keys(data.metadata).length) {
          html += `<h5 style="margin-top:12px">Metadata</h5>`;
          for (const [k, v] of Object.entries(data.metadata)) {
            if (v && v.length < 60) {
              html += `<div class="lib-3d-info-row"><span class="lib-3d-info-label">${_esc(k)}</span><span class="lib-3d-info-value">${_esc(v)}</span></div>`;
            }
          }
        }
        infoBody.innerHTML = html;
      }
    } catch (e) {
      const loading = document.getElementById('lib-3d-loading');
      if (loading) {
        loading.style.color = 'var(--accent-red)';
        loading.textContent = e.message || 'Failed to load model';
      }
    }
  };

  window._close3DPreview = function(overlay) {
    if (_activeViewer) { _activeViewer.destroy(); _activeViewer = null; }
    if (overlay?._keyHandler) document.removeEventListener('keydown', overlay._keyHandler);
    overlay?.remove();
  };

  window._toggle3DWireframe = function() {
    if (!_activeViewer) return;
    const btn = document.getElementById('lib-3d-wireframe');
    const on = btn?.dataset.active === '1';
    _activeViewer.setWireframe(!on);
    if (btn) { btn.dataset.active = on ? '0' : '1'; btn.style.background = on ? '' : 'var(--accent-blue)'; btn.style.color = on ? '' : '#fff'; }
  };

  window._toggle3DShading = function() {
    if (!_activeViewer) return;
    const btn = document.getElementById('lib-3d-shading');
    const on = btn?.dataset.active === '1';
    _activeViewer.setFlatShading(!on);
    if (btn) { btn.dataset.active = on ? '0' : '1'; btn.textContent = on ? 'Flat' : 'Smooth'; }
  };

  window._reset3DView = function() {
    if (_activeViewer) _activeViewer.resetView();
  };

  window._batchAddToQueue = function() {
    if (_selectedFiles.size === 0) return;
    if (typeof showToast === 'function') {
      showToast(`${_selectedFiles.size} ${_selectedFiles.size > 1 ? (t('library.files', 'files')) : (t('library.file', 'file'))} ${t('library.ready_to_queue', 'ready for queue \u2014 select a queue in the Queue panel')}`, 'info', 0, [
        { label: t('library.open_queue', 'Open queue'), onClick: () => { if (typeof openPanel === 'function') openPanel('queue'); } }
      ]);
    }
  };
})();
