// Label Generator — create rich labels for spools, filament profiles, printers
(function() {
  let _spools = [];
  let _profiles = [];
  let _labelType = 'spool';
  let _labelSize = 'medium'; // small, medium, large
  let _selected = new Set();

  function _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
  function _tl(key, fb) { return (typeof t === 'function' ? t(key) : '') || fb; }

  function _fmtW(g) {
    if (g == null) return '--';
    return g >= 1000 ? (g / 1000).toLocaleString('nb-NO', { maximumFractionDigits: 1 }) + ' kg' : Math.round(g) + 'g';
  }

  function _fmtDate(d) {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d; }
  }

  function _spoolSvg(color, pct, size) {
    const sz = size || 40;
    const hubR = 13, maxR = 38;
    const p = pct != null ? pct : 80;
    const filR = p > 0 ? hubR + (maxR - hubR) * Math.max(5, p) / 100 : hubR;
    let windings = '';
    if (p > 8) {
      const gap = (filR - hubR) / Math.min(5, Math.max(2, Math.round((filR - hubR) / 4)));
      for (let r = hubR + gap; r < filR - 1; r += gap) {
        windings += `<circle cx="50" cy="50" r="${r.toFixed(1)}" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="0.6"/>`;
      }
    }
    return `<span style="display:inline-block;width:${sz}px;height:${sz}px;flex-shrink:0"><svg viewBox="0 0 100 100" style="width:100%;height:100%">
      <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border-color)" stroke-width="2" opacity="0.5"/>
      <circle cx="50" cy="50" r="${filR.toFixed(1)}" fill="${color || '#888'}"/>
      ${windings}
      <circle cx="50" cy="50" r="${hubR}" fill="var(--bg-card, #1a1c20)" stroke="var(--border-color)" stroke-width="1.5"/>
      <circle cx="50" cy="50" r="5" fill="var(--bg-primary, #0d0f12)"/>
    </svg></span>`;
  }

  function _pctColor(pct) {
    if (pct > 50) return 'var(--accent-green)';
    if (pct > 20) return 'var(--accent-orange)';
    return 'var(--accent-red)';
  }

  window.loadLabelPanel = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    el.innerHTML = `<div class="lbl-panel">
      <div class="lbl-toolbar">
        <div class="lbl-type-group">
          <button class="lbl-type-btn active" data-type="spool" onclick="_lblSetType('spool')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
            ${_tl('labels.type_spool', 'Spoler')}
          </button>
          <button class="lbl-type-btn" data-type="profile" onclick="_lblSetType('profile')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            ${_tl('labels.type_profile', 'Profiles')}
          </button>
          <button class="lbl-type-btn" data-type="printer" onclick="_lblSetType('printer')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            ${_tl('labels.type_printer', 'Printere')}
          </button>
        </div>
        <div class="lbl-size-group">
          <button class="lbl-size-btn${_labelSize==='small'?' active':''}" onclick="_lblSetSize('small')" title="Liten">S</button>
          <button class="lbl-size-btn${_labelSize==='medium'?' active':''}" onclick="_lblSetSize('medium')" title="Medium">M</button>
          <button class="lbl-size-btn${_labelSize==='large'?' active':''}" onclick="_lblSetSize('large')" title="Stor">L</button>
        </div>
        <div class="lbl-actions">
          <button class="lbl-select-btn" onclick="_lblToggleAll()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
            ${_tl('labels.select_all', 'Select all')}
          </button>
          <button class="lbl-print-btn" onclick="window.print()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            ${_tl('labels.print', 'Print')}
          </button>
        </div>
      </div>
      <div class="lbl-grid lbl-grid-${_labelSize}" id="lbl-grid">
        <div class="matrec-empty"><div class="matrec-spinner"></div></div>
      </div>
    </div>`;

    _selected.clear();
    _loadData();
  };

  async function _loadData() {
    if (_labelType === 'spool') {
      try { const r = await fetch('/api/inventory/spools?archived=0'); _spools = await r.json(); if (!Array.isArray(_spools)) _spools = []; } catch { _spools = []; }
      _renderSpoolLabels();
    } else if (_labelType === 'profile') {
      try { const r = await fetch('/api/inventory/filaments'); _profiles = await r.json(); if (!Array.isArray(_profiles)) _profiles = []; } catch { _profiles = []; }
      _renderProfileLabels();
    } else {
      _renderPrinterLabels();
    }
  }

  window._lblSetType = function(type) {
    _labelType = type;
    _selected.clear();
    document.querySelectorAll('.lbl-type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === type));
    _loadData();
  };

  window._lblSetSize = function(size) {
    _labelSize = size;
    document.querySelectorAll('.lbl-size-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.lbl-size-btn[onclick*="${size}"]`)?.classList.add('active');
    const grid = document.getElementById('lbl-grid');
    if (grid) { grid.className = `lbl-grid lbl-grid-${size}`; }
  };

  window._lblToggleAll = function() {
    const cards = document.querySelectorAll('.lbl-card');
    const allSelected = [...cards].every(c => c.classList.contains('lbl-selected'));
    cards.forEach(c => c.classList.toggle('lbl-selected', !allSelected));
  };

  window._lblToggleCard = function(el) {
    el.closest('.lbl-card')?.classList.toggle('lbl-selected');
  };

  // ---- Spool Labels ----
  function _renderSpoolLabels() {
    const grid = document.getElementById('lbl-grid');
    if (!grid) return;
    if (!_spools.length) { grid.innerHTML = _emptyState('circle', _tl('labels.no_spools', 'No spools found')); return; }

    let html = '';
    for (const sp of _spools) {
      const color = sp.color_hex ? (sp.color_hex.startsWith('#') ? sp.color_hex : '#' + sp.color_hex) : '#888';
      const pct = sp.initial_weight_g > 0 ? Math.round((sp.remaining_weight_g / sp.initial_weight_g) * 100) : 0;
      const pctCol = _pctColor(pct);
      const vendor = sp.vendor_name || sp.brand || '';
      const trayId = sp.tray_id_name || '';
      const lengthM = sp.remaining_length_m ? sp.remaining_length_m.toFixed(1) + 'm' : '';

      html += `<div class="lbl-card" onclick="_lblToggleCard(event.target)">
        <div class="lbl-card-color-strip" style="background:${color}"></div>
        <div class="lbl-card-body">
          <div class="lbl-card-top">
            <div class="lbl-qr" id="lbl-qr-${sp.id}"></div>
            ${_spoolSvg(color, pct, _labelSize === 'small' ? 32 : _labelSize === 'large' ? 52 : 42)}
            <div class="lbl-card-info">
              <div class="lbl-card-title">${_esc(sp.name || sp.profile_name || sp.material || 'Spool')}</div>
              <div class="lbl-card-subtitle">${_esc(vendor)}${trayId ? ' &middot; ' + _esc(trayId) : ''}</div>
              <div class="lbl-card-id">${_esc(sp.short_id || '#' + sp.id)}</div>
            </div>
          </div>
          <div class="lbl-card-meter">
            <div class="lbl-meter-bar"><div class="lbl-meter-fill" style="width:${pct}%;background:${pctCol}"></div></div>
            <span class="lbl-meter-pct" style="color:${pctCol}">${pct}%</span>
          </div>
          <div class="lbl-card-details">
            <div class="lbl-detail"><span class="lbl-detail-label">Materiale</span><span class="lbl-detail-value">${_esc(sp.material || '--')}</span></div>
            <div class="lbl-detail"><span class="lbl-detail-label">Vekt</span><span class="lbl-detail-value">${_fmtW(sp.remaining_weight_g)} / ${_fmtW(sp.initial_weight_g)}${lengthM ? ' &middot; ' + lengthM : ''}</span></div>
            ${vendor ? `<div class="lbl-detail"><span class="lbl-detail-label">Leverandor</span><span class="lbl-detail-value">${_esc(vendor)}</span></div>` : ''}
            ${sp.color_name ? `<div class="lbl-detail"><span class="lbl-detail-label">Farge</span><span class="lbl-detail-value"><span class="lbl-color-dot" style="background:${color}"></span>${_esc(sp.color_name)}</span></div>` : ''}
            ${sp.lot_number ? `<div class="lbl-detail"><span class="lbl-detail-label">Lot-nr</span><span class="lbl-detail-value lbl-detail-mono">${_esc(sp.lot_number)}</span></div>` : ''}
            ${sp.purchase_date ? `<div class="lbl-detail"><span class="lbl-detail-label">Kjopt</span><span class="lbl-detail-value">${_fmtDate(sp.purchase_date)}</span></div>` : ''}
            ${sp.location || sp.location_name ? `<div class="lbl-detail"><span class="lbl-detail-label">Plassering</span><span class="lbl-detail-value">${_esc(sp.location_name || sp.location)}</span></div>` : ''}
            ${sp.nozzle_temp_min || sp.nozzle_temp_max ? `<div class="lbl-detail"><span class="lbl-detail-label">Dyse</span><span class="lbl-detail-value">${sp.nozzle_temp_min || '?'}&ndash;${sp.nozzle_temp_max || '?'}&deg;C</span></div>` : ''}
            ${sp.bed_temp_min || sp.bed_temp_max ? `<div class="lbl-detail"><span class="lbl-detail-label">Seng</span><span class="lbl-detail-value">${sp.bed_temp_min || '?'}&ndash;${sp.bed_temp_max || '?'}&deg;C</span></div>` : ''}
          </div>
        </div>
      </div>`;
    }
    grid.innerHTML = html;
    _generateQrCodes('spool', _spools);
  }

  // ---- Profile Labels ----
  function _renderProfileLabels() {
    const grid = document.getElementById('lbl-grid');
    if (!grid) return;
    if (!_profiles.length) { grid.innerHTML = _emptyState('layers', _tl('labels.no_profiles', 'No profiles found')); return; }

    let html = '';
    for (const p of _profiles) {
      const color = p.color_hex ? (p.color_hex.startsWith('#') ? p.color_hex : '#' + p.color_hex) : '#888';
      const vendor = p.vendor_name || '';

      html += `<div class="lbl-card" onclick="_lblToggleCard(event.target)">
        <div class="lbl-card-color-strip" style="background:${color}"></div>
        <div class="lbl-card-body">
          <div class="lbl-card-top">
            ${_spoolSvg(color, 80, _labelSize === 'small' ? 32 : _labelSize === 'large' ? 52 : 42)}
            <div class="lbl-card-info">
              <div class="lbl-card-title">${_esc(p.name)}</div>
              <div class="lbl-card-subtitle">${_esc(vendor)}${p.tray_id_name ? ' &middot; ' + _esc(p.tray_id_name) : ''}</div>
            </div>
          </div>
          <div class="lbl-card-details">
            <div class="lbl-detail"><span class="lbl-detail-label">Materiale</span><span class="lbl-detail-value">${_esc(p.material)}</span></div>
            ${p.color_name ? `<div class="lbl-detail"><span class="lbl-detail-label">Farge</span><span class="lbl-detail-value"><span class="lbl-color-dot" style="background:${color}"></span>${_esc(p.color_name)}</span></div>` : ''}
            <div class="lbl-detail"><span class="lbl-detail-label">Diameter</span><span class="lbl-detail-value">${p.diameter || 1.75}mm${p.diameter_tolerance ? ' &plusmn;' + p.diameter_tolerance + 'mm' : ''}</span></div>
            <div class="lbl-detail"><span class="lbl-detail-label">Densitet</span><span class="lbl-detail-value">${p.density || 1.24} g/cm&sup3;</span></div>
            ${p.nozzle_temp_min || p.nozzle_temp_max ? `<div class="lbl-detail"><span class="lbl-detail-label">Dyse</span><span class="lbl-detail-value">${p.nozzle_temp_min || '?'}&ndash;${p.nozzle_temp_max || '?'}&deg;C</span></div>` : ''}
            ${p.bed_temp_min || p.bed_temp_max ? `<div class="lbl-detail"><span class="lbl-detail-label">Seng</span><span class="lbl-detail-value">${p.bed_temp_min || '?'}&ndash;${p.bed_temp_max || '?'}&deg;C</span></div>` : ''}
            <div class="lbl-detail"><span class="lbl-detail-label">Spolvekt</span><span class="lbl-detail-value">${_fmtW(p.spool_weight_g)}</span></div>
            ${p.price ? `<div class="lbl-detail"><span class="lbl-detail-label">Pris</span><span class="lbl-detail-value">${typeof window.formatCurrency === 'function' ? window.formatCurrency(p.price) : Math.round(p.price)}</span></div>` : ''}
            ${p.ral_code ? `<div class="lbl-detail"><span class="lbl-detail-label">RAL</span><span class="lbl-detail-value">${_esc(p.ral_code)}</span></div>` : ''}
            ${p.article_number ? `<div class="lbl-detail"><span class="lbl-detail-label">Art.nr</span><span class="lbl-detail-value lbl-detail-mono">${_esc(p.article_number)}</span></div>` : ''}
            ${p.finish ? `<div class="lbl-detail"><span class="lbl-detail-label">Finish</span><span class="lbl-detail-value">${_esc(p.finish)}</span></div>` : ''}
          </div>
        </div>
      </div>`;
    }
    grid.innerHTML = html;
  }

  // ---- Printer Labels ----
  function _renderPrinterLabels() {
    const grid = document.getElementById('lbl-grid');
    if (!grid) return;
    const state = window.printerState;
    const ids = state?.getPrinterIds() || [];
    if (!ids.length) { grid.innerHTML = _emptyState('printer', _tl('labels.no_printers', 'No printers found')); return; }

    let html = '';
    for (const id of ids) {
      const meta = state._printerMeta[id] || {};
      html += `<div class="lbl-card" onclick="_lblToggleCard(event.target)">
        <div class="lbl-card-color-strip" style="background:var(--accent-blue)"></div>
        <div class="lbl-card-body">
          <div class="lbl-card-top">
            <div class="lbl-qr" id="lbl-qr-p-${id.replace(/\W/g,'_')}"></div>
            <div class="lbl-card-info">
              <div class="lbl-card-title">${_esc(meta.name || id)}</div>
              <div class="lbl-card-subtitle">${_esc(meta.model || '')}</div>
              <div class="lbl-card-id">${_esc(id)}</div>
            </div>
          </div>
          <div class="lbl-card-details">
            <div class="lbl-detail"><span class="lbl-detail-label">Serienr</span><span class="lbl-detail-value lbl-detail-mono">${_esc(meta.serial || id)}</span></div>
            ${meta.model ? `<div class="lbl-detail"><span class="lbl-detail-label">Modell</span><span class="lbl-detail-value">${_esc(meta.model)}</span></div>` : ''}
            ${meta.ip ? `<div class="lbl-detail"><span class="lbl-detail-label">IP</span><span class="lbl-detail-value lbl-detail-mono">${_esc(meta.ip)}</span></div>` : ''}
          </div>
        </div>
      </div>`;
    }
    grid.innerHTML = html;

    setTimeout(() => {
      for (const id of ids) {
        const elId = `lbl-qr-p-${id.replace(/\W/g,'_')}`;
        const el = document.getElementById(elId);
        if (!el || el.querySelector('img')) continue;
        if (typeof qrcode === 'undefined') continue;
        try {
          const qr = qrcode(0, 'M');
          qr.addData(`${location.origin}/#dashboard?printer=${id}`);
          qr.make();
          el.innerHTML = qr.createImgTag(3, 0);
        } catch {}
      }
    }, 50);
  }

  function _generateQrCodes(type, items) {
    setTimeout(() => {
      for (const item of items) {
        const el = document.getElementById(`lbl-qr-${item.id}`);
        if (!el || el.querySelector('img') || el.querySelector('canvas')) continue;
        if (typeof qrcode === 'undefined') continue;
        const url = `${location.origin}/spool/${item.short_id || item.id}`;
        try {
          const qr = qrcode(0, 'M');
          qr.addData(url);
          qr.make();
          el.innerHTML = qr.createImgTag(3, 0);
        } catch {}
      }
    }, 50);
  }

  function _emptyState(icon, text) {
    const icons = {
      circle: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>',
      layers: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
      printer: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>'
    };
    return `<div class="matrec-empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.3;margin-bottom:12px">${icons[icon] || icons.circle}</svg>
      <p>${text}</p>
    </div>`;
  }
})();
