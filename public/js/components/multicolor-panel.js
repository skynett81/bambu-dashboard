// Multi-Color Print Planner — plan AMS color assignments
(function() {
  let _slots = [];
  let _spools = [];
  let _amsTrays = []; // live AMS tray data

  function _hexToRgb(hex) {
    hex = (hex || '').replace('#', '');
    if (hex.length >= 8) hex = hex.substring(0, 6); // strip alpha
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    const n = parseInt(hex, 16);
    return isNaN(n) ? '#808080' : `rgb(${(n>>16)&255},${(n>>8)&255},${n&255})`;
  }

  function _readAmsTrays() {
    _amsTrays = [];
    try {
      const state = window.printerState?.getActivePrinterState?.();
      const amsRoot = state?.ams || state?.print?.ams;
      if (!amsRoot?.ams) return;
      const units = amsRoot.ams;
      for (let u = 0; u < units.length; u++) {
        const trays = units[u]?.tray || [];
        for (let ti = 0; ti < trays.length; ti++) {
          const tray = trays[ti];
          if (!tray || !tray.tray_type) continue;
          const color = tray.tray_color ? '#' + tray.tray_color.substring(0, 6) : '#808080';
          const slotLabel = (typeof window.t === 'function' ? window.t('multicolor.slot') : null) || 'Slot';
          _amsTrays.push({
            _ams: true,
            _unit: u,
            _tray: ti,
            id: `ams-${u}-${ti}`,
            name: tray.tray_sub_brands || tray.tray_type,
            material: tray.tray_type,
            color_hex: color,
            remaining_weight_g: tray.remain >= 0 ? Math.round(tray.remain) : null,
            _label: `AMS ${u+1} - ${slotLabel} ${ti+1}`
          });
        }
      }
      // Also check external spool (vt_tray)
      const vt = amsRoot.vt_tray;
      if (vt && vt.tray_type) {
        const color = vt.tray_color ? '#' + vt.tray_color.substring(0, 6) : '#808080';
        _amsTrays.push({
          _ams: true,
          _unit: 255,
          _tray: 0,
          id: 'ams-ext',
          name: vt.tray_sub_brands || vt.tray_type,
          material: vt.tray_type,
          color_hex: color,
          remaining_weight_g: vt.remain >= 0 ? Math.round(vt.remain) : null,
          _label: t('multicolor.external') || 'External'
        });
      }
    } catch (_) {}
  }

  window.loadMulticolorPanel = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    el.innerHTML = `<style>
      .mc-container { max-width:900px; }
      .mc-intro { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); padding:16px; margin-bottom:16px; font-size:0.82rem; color:var(--text-muted); }
      .mc-planner { display:grid; grid-template-columns:1fr 300px; gap:16px; }
      @media (max-width:800px) { .mc-planner { grid-template-columns:1fr; } }
      .mc-slots { display:flex; flex-direction:column; gap:10px; }
      .mc-slot { display:flex; align-items:center; gap:12px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); padding:12px 14px; }
      .mc-slot-num { font-size:0.75rem; font-weight:800; color:var(--text-muted); min-width:24px; }
      .mc-slot-color { width:32px; height:32px; border-radius:50%; border:2px solid var(--border-color); cursor:pointer; transition:transform 0.15s; flex-shrink:0; }
      .mc-slot-color:hover { transform:scale(1.15); }
      .mc-slot-info { flex:1; }
      .mc-slot-name { font-size:0.82rem; font-weight:600; }
      .mc-slot-meta { font-size:0.7rem; color:var(--text-muted); }
      .mc-slot-remove { padding:4px 8px; border-radius:var(--radius); border:1px solid var(--border-color); background:transparent; cursor:pointer; color:var(--text-muted); font-size:0.7rem; }
      .mc-add-btn { padding:10px; border:2px dashed var(--border-color); border-radius:var(--radius); background:transparent; cursor:pointer; color:var(--text-muted); font-size:0.82rem; text-align:center; transition:border-color 0.15s; }
      .mc-add-btn:hover { border-color:var(--accent-blue); color:var(--accent-blue); }
      .mc-sidebar { }
      .mc-preview { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); padding:16px; margin-bottom:12px; }
      .mc-preview h4 { margin:0 0 12px; font-size:0.85rem; }
      .mc-preview-grid { display:grid; grid-template-columns:repeat(4, 1fr); gap:4px; }
      .mc-preview-swatch { aspect-ratio:1; border-radius:6px; position:relative; }
      .mc-preview-swatch span { position:absolute; bottom:2px; right:4px; font-size:0.55rem; font-weight:700; color:rgba(255,255,255,0.8); text-shadow:0 1px 2px rgba(0,0,0,0.5); }
      .mc-compat { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); padding:16px; }
      .mc-compat h4 { margin:0 0 10px; font-size:0.85rem; }
      .mc-compat-row { display:flex; justify-content:space-between; padding:5px 0; font-size:0.78rem; border-bottom:1px solid rgba(0,0,0,0.03); }
      .mc-compat-ok { color:var(--accent-green); }
      .mc-compat-warn { color:#f59e0b; }
      .mc-picker-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.4); z-index:999; display:flex; align-items:center; justify-content:center; }
      .mc-picker { background:var(--bg-primary); border-radius:12px; padding:20px; width:min(400px,90vw); max-height:70vh; overflow-y:auto; }
      .mc-picker h4 { margin:0 0 12px; font-size:0.9rem; }
      .mc-picker-section { font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted); padding:10px 8px 4px; }
      .mc-picker-item { display:flex; align-items:center; gap:10px; padding:8px; border-radius:var(--radius); cursor:pointer; transition:background 0.1s; }
      .mc-picker-item:hover { background:var(--bg-secondary); }
      .mc-picker-dot { width:28px; height:28px; border-radius:50%; border:1px solid var(--border-color); flex-shrink:0; }
      .mc-picker-name { font-size:0.82rem; font-weight:600; }
      .mc-picker-meta { font-size:0.68rem; color:var(--text-muted); }
      .mc-export-btn { margin-top:12px; padding:8px 16px; background:var(--accent-blue); color:#fff; border:none; border-radius:var(--radius); cursor:pointer; font-size:0.8rem; font-weight:600; width:100%; }
    </style>
    <div class="mc-container">
      <div class="mc-intro">${t('multicolor.intro')}</div>
      <div class="mc-planner">
        <div>
          <div class="mc-slots" id="mc-slots"></div>
          <button class="mc-add-btn" onclick="_mcAddSlot()" style="margin-top:10px">+ ${t('multicolor.add_color')}</button>
        </div>
        <div class="mc-sidebar">
          <div class="mc-preview"><h4>${t('multicolor.preview')}</h4><div class="mc-preview-grid" id="mc-preview"></div></div>
          <div class="mc-compat"><h4>${t('multicolor.compatibility')}</h4><div id="mc-compat"></div></div>
          <button class="mc-export-btn" onclick="_mcExport()">${t('multicolor.export_plan')}</button>
        </div>
      </div>
    </div>`;

    // Read live AMS trays
    _readAmsTrays();

    // Pre-fill slots from AMS if we have tray data
    if (_amsTrays.length > 0) {
      _slots = _amsTrays.map(tr => ({ ...tr }));
    } else {
      _slots = [null, null, null, null];
    }

    _loadSpools();
  };

  async function _loadSpools() {
    try {
      const r = await fetch('/api/inventory/spools?archived=0');
      _spools = await r.json();
      if (!Array.isArray(_spools)) _spools = [];
    } catch { _spools = []; }
    _render();
  }

  function _render() {
    const slotsEl = document.getElementById('mc-slots');
    const previewEl = document.getElementById('mc-preview');
    const compatEl = document.getElementById('mc-compat');
    if (!slotsEl) return;

    // Slots
    let html = '';
    for (let i = 0; i < _slots.length; i++) {
      const s = _slots[i];
      const color = s?.color_hex || '#444';
      const name = s ? (_esc(s.name || s.material || 'Spool')) : t('multicolor.empty_slot');
      const remainStr = s?.remaining_weight_g != null ? `${s.remaining_weight_g}%` : '';
      const loc = s?._label ? `${_esc(s._label)} · ` : '';
      const meta = s ? `${loc}${_esc(s.material || '')}${remainStr ? ' — ' + remainStr : ''}` : t('multicolor.click_assign');
      html += `<div class="mc-slot">
        <span class="mc-slot-num">${i + 1}</span>
        <div class="mc-slot-color" style="background:${color}" onclick="_mcPickSpool(${i})"></div>
        <div class="mc-slot-info"><div class="mc-slot-name">${name}</div><div class="mc-slot-meta">${meta}</div></div>
        ${s ? `<button class="mc-slot-remove" onclick="_mcRemoveSlot(${i})">\u2715</button>` : ''}
      </div>`;
    }
    slotsEl.innerHTML = html;

    // Preview
    if (previewEl) {
      let ph = '';
      for (let i = 0; i < _slots.length; i++) {
        const color = _slots[i]?.color_hex || '#333';
        ph += `<div class="mc-preview-swatch" style="background:${color}"><span>${i + 1}</span></div>`;
      }
      previewEl.innerHTML = ph || `<div style="color:var(--text-muted);font-size:0.75rem">${t('multicolor.no_colors')}</div>`;
    }

    // Compatibility
    if (compatEl) {
      const materials = _slots.filter(Boolean).map(s => s.material || 'Unknown');
      const unique = [...new Set(materials)];
      let ch = '';
      if (unique.length <= 1) {
        ch = `<div class="mc-compat-row"><span>${t('multicolor.all_compatible')}</span><span class="mc-compat-ok">\u2714</span></div>`;
      } else {
        // Simple compatibility matrix
        const incompatible = [['PLA', 'ABS'], ['PLA', 'PA'], ['PETG', 'ABS'], ['TPU', 'ABS']];
        let hasIssue = false;
        for (let i = 0; i < unique.length; i++) {
          for (let j = i + 1; j < unique.length; j++) {
            const pair = [unique[i].toUpperCase(), unique[j].toUpperCase()];
            const bad = incompatible.some(([a, b]) => (pair[0] === a && pair[1] === b) || (pair[0] === b && pair[1] === a));
            ch += `<div class="mc-compat-row"><span>${unique[i]} + ${unique[j]}</span><span class="${bad ? 'mc-compat-warn' : 'mc-compat-ok'}">${bad ? '\u26A0 ' + t('multicolor.not_recommended') : '\u2714 OK'}</span></div>`;
            if (bad) hasIssue = true;
          }
        }
      }
      compatEl.innerHTML = ch;
    }
  }

  window._mcAddSlot = function() {
    _slots.push(null);
    _render();
  };

  window._mcRemoveSlot = function(index) {
    _slots[index] = null;
    _render();
  };

  window._mcPickSpool = function(index) {
    _readAmsTrays(); // refresh live data
    const overlay = document.createElement('div');
    overlay.className = 'mc-picker-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    let items = '';

    // AMS trays section
    if (_amsTrays.length > 0) {
      items += `<div class="mc-picker-section">${t('multicolor.ams_loaded') || 'AMS'}</div>`;
      for (let ai = 0; ai < _amsTrays.length; ai++) {
        const tr = _amsTrays[ai];
        items += `<div class="mc-picker-item" onclick="_mcAssignAms(${index}, ${ai})">
          <div class="mc-picker-dot" style="background:${tr.color_hex}"></div>
          <div><div class="mc-picker-name">${_esc(tr.name || tr.material)}</div>
          <div class="mc-picker-meta">${_esc(tr._label)} · ${_esc(tr.material)}${tr.remaining_weight_g != null ? ' — ' + tr.remaining_weight_g + '%' : ''}</div></div>
        </div>`;
      }
    }

    // Inventory spools section
    if (_spools.length > 0) {
      items += `<div class="mc-picker-section">${t('multicolor.inventory') || 'Inventory'}</div>`;
      for (const sp of _spools) {
        const color = sp.color_hex || '#888';
        items += `<div class="mc-picker-item" onclick="_mcAssignSpool(${index}, ${sp.id})">
          <div class="mc-picker-dot" style="background:${color}"></div>
          <div><div class="mc-picker-name">${_esc(sp.name || sp.material || 'Spool #' + sp.id)}</div>
          <div class="mc-picker-meta">${_esc(sp.material || '')} — ${(sp.remaining_weight_g || 0).toFixed(0)}g</div></div>
        </div>`;
      }
    }

    if (!items) items = `<div style="padding:20px;color:var(--text-muted);text-align:center">${t('multicolor.no_spools')}</div>`;
    overlay.innerHTML = `<div class="mc-picker"><h4>${t('multicolor.pick_spool')}</h4>${items}</div>`;
    document.body.appendChild(overlay);
  };

  window._mcAssignAms = function(index, amsIdx) {
    _slots[index] = { ..._amsTrays[amsIdx] };
    document.querySelector('.mc-picker-overlay')?.remove();
    _render();
  };

  window._mcAssignSpool = function(index, spoolId) {
    _slots[index] = _spools.find(s => s.id === spoolId) || null;
    document.querySelector('.mc-picker-overlay')?.remove();
    _render();
  };

  window._mcExport = function() {
    const plan = _slots.map((s, i) => ({
      slot: i + 1,
      spool: s ? { id: s.id, name: s.name, material: s.material, color: s.color_hex, remaining: s.remaining_weight_g } : null
    }));
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'color-plan.json';
    a.click();
    URL.revokeObjectURL(a.href);
    if (typeof showToast === 'function') showToast(t('multicolor.exported'), 'success');
  };

  function _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
})();
