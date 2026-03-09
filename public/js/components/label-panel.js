// QR/NFC Label Generator — create labels for spools, prints, printers
(function() {
  let _spools = [];
  let _labelType = 'spool';

  function _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
  function _tl(key, fb) { return (typeof t === 'function' ? t(key) : '') || fb; }

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
          <button class="lbl-type-btn" data-type="printer" onclick="_lblSetType('printer')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            ${_tl('labels.type_printer', 'Printere')}
          </button>
        </div>
        <div class="lbl-actions">
          <button class="lbl-select-btn" onclick="_lblToggleAll()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
            ${_tl('labels.select_all', 'Velg alle')}
          </button>
          <button class="lbl-print-btn" onclick="window.print()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            ${_tl('labels.print', 'Skriv ut')}
          </button>
        </div>
      </div>
      <div class="lbl-grid" id="lbl-grid">
        <div class="matrec-empty"><div class="matrec-spinner"></div></div>
      </div>
    </div>`;

    _labelType = 'spool';
    _loadData();
  };

  async function _loadData() {
    if (_labelType === 'spool') {
      try {
        const r = await fetch('/api/inventory/spools?archived=0');
        _spools = await r.json();
        if (!Array.isArray(_spools)) _spools = [];
      } catch { _spools = []; }
      _renderSpoolLabels();
    } else {
      _renderPrinterLabels();
    }
  }

  window._lblSetType = function(type) {
    _labelType = type;
    document.querySelectorAll('.lbl-type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === type));
    _loadData();
  };

  function _renderSpoolLabels() {
    const grid = document.getElementById('lbl-grid');
    if (!grid) return;
    if (!_spools.length) {
      grid.innerHTML = `<div class="matrec-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.3;margin-bottom:12px"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
        <p>${_tl('labels.no_spools', 'Ingen spoler funnet')}</p>
      </div>`;
      return;
    }
    let html = '';
    for (const sp of _spools) {
      const color = sp.color_hex || '#888';
      html += `<div class="lbl-card" data-label-id="${sp.id}">
        <div class="lbl-card-top">
          <div class="lbl-qr" id="lbl-qr-${sp.id}"></div>
          <div class="lbl-card-info">
            <div class="lbl-card-title">
              <span class="ce-swatch" style="background:${color}"></span>
              ${_esc(sp.name || sp.material || 'Spool')}
            </div>
            <div class="lbl-card-id">${_esc(sp.short_id || '#' + sp.id)}</div>
          </div>
        </div>
        <div class="lbl-card-details">
          <div class="lbl-detail"><span class="lbl-detail-label">${_tl('labels.material', 'Materiale')}</span><span class="lbl-detail-value">${_esc(sp.material || '--')}</span></div>
          <div class="lbl-detail"><span class="lbl-detail-label">${_tl('labels.brand', 'Merke')}</span><span class="lbl-detail-value">${_esc(sp.brand || '--')}</span></div>
          <div class="lbl-detail"><span class="lbl-detail-label">${_tl('labels.weight', 'Vekt')}</span><span class="lbl-detail-value">${sp.remaining_weight_g ? sp.remaining_weight_g.toFixed(0) + 'g' : '--'}</span></div>
          ${sp.lot_number ? `<div class="lbl-detail"><span class="lbl-detail-label">${_tl('labels.lot', 'Lot')}</span><span class="lbl-detail-value">${_esc(sp.lot_number)}</span></div>` : ''}
          ${sp.location_name ? `<div class="lbl-detail"><span class="lbl-detail-label">${_tl('labels.location', 'Plassering')}</span><span class="lbl-detail-value">${_esc(sp.location_name)}</span></div>` : ''}
        </div>
      </div>`;
    }
    grid.innerHTML = html;

    // Generate QR codes
    setTimeout(() => {
      for (const sp of _spools) {
        const el = document.getElementById(`lbl-qr-${sp.id}`);
        if (!el || el.querySelector('canvas') || el.querySelector('img')) continue;
        const qrData = `${location.origin}/spool/${sp.short_id || sp.id}`;
        if (typeof qrcode === 'undefined') continue;
        try {
          const qr = qrcode(0, 'M');
          qr.addData(qrData);
          qr.make();
          el.innerHTML = qr.createImgTag(3, 0);
        } catch {}
      }
    }, 50);
  }

  function _renderPrinterLabels() {
    const grid = document.getElementById('lbl-grid');
    if (!grid) return;
    const state = window.printerState;
    const ids = state?.getPrinterIds() || [];
    if (!ids.length) {
      grid.innerHTML = `<div class="matrec-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.3;margin-bottom:12px"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        <p>${_tl('labels.no_printers', 'Ingen printere funnet')}</p>
      </div>`;
      return;
    }
    let html = '';
    for (const id of ids) {
      const meta = state._printerMeta[id] || {};
      html += `<div class="lbl-card">
        <div class="lbl-card-top">
          <div class="lbl-qr" id="lbl-qr-p-${id.replace(/\W/g,'_')}"></div>
          <div class="lbl-card-info">
            <div class="lbl-card-title">${_esc(meta.name || id)}</div>
            <div class="lbl-card-id">${_esc(meta.model || '')}</div>
          </div>
        </div>
        <div class="lbl-card-details">
          <div class="lbl-detail"><span class="lbl-detail-label">${_tl('labels.printer_id', 'Printer ID')}</span><span class="lbl-detail-value lbl-detail-mono">${_esc(id)}</span></div>
        </div>
      </div>`;
    }
    grid.innerHTML = html;

    setTimeout(() => {
      for (const id of ids) {
        const elId = `lbl-qr-p-${id.replace(/\W/g,'_')}`;
        const el = document.getElementById(elId);
        if (!el || el.querySelector('img')) continue;
        const qrData = `${location.origin}/#dashboard?printer=${id}`;
        if (typeof qrcode === 'undefined') continue;
        try {
          const qr = qrcode(0, 'M');
          qr.addData(qrData);
          qr.make();
          el.innerHTML = qr.createImgTag(3, 0);
        } catch {}
      }
    }, 50);
  }

  window._lblToggleAll = function() {
    document.querySelectorAll('.lbl-card').forEach(c => c.classList.toggle('lbl-selected'));
  };
})();
