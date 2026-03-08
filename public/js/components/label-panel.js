// QR/NFC Label Generator — create labels for spools, prints, printers
(function() {
  let _spools = [];
  let _labelType = 'spool';

  window.loadLabelPanel = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    el.innerHTML = `<style>
      .lbl-container { max-width:900px; }
      .lbl-toolbar { display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap; align-items:center; }
      .lbl-type-btn { padding:7px 14px; border-radius:var(--radius); font-size:0.78rem; font-weight:600; cursor:pointer; border:1px solid var(--border-color); background:var(--bg-secondary); color:var(--text-primary); transition:all 0.15s; }
      .lbl-type-btn.active { background:var(--accent-blue); color:#fff; border-color:var(--accent-blue); }
      .lbl-print-btn { margin-left:auto; padding:8px 16px; background:var(--accent-blue); color:#fff; border:none; border-radius:var(--radius); cursor:pointer; font-size:0.8rem; font-weight:600; }
      .lbl-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:14px; }
      .lbl-card { background:#fff; border:1px solid #ddd; border-radius:8px; padding:16px; color:#000; page-break-inside:avoid; }
      .lbl-card-header { display:flex; gap:10px; align-items:flex-start; margin-bottom:8px; }
      .lbl-qr { width:80px; height:80px; flex-shrink:0; }
      .lbl-qr canvas { width:100% !important; height:100% !important; }
      .lbl-card-info { flex:1; }
      .lbl-card-title { font-size:0.85rem; font-weight:800; margin-bottom:2px; }
      .lbl-card-subtitle { font-size:0.7rem; color:#666; }
      .lbl-card-row { display:flex; justify-content:space-between; font-size:0.72rem; padding:3px 0; border-bottom:1px solid #eee; }
      .lbl-card-row span:first-child { color:#888; }
      .lbl-card-row span:last-child { font-weight:600; }
      .lbl-color-dot { display:inline-block; width:14px; height:14px; border-radius:50%; border:1px solid #ddd; vertical-align:middle; margin-right:4px; }
      .lbl-select-all { padding:6px 12px; border-radius:var(--radius); border:1px solid var(--border-color); background:var(--bg-secondary); cursor:pointer; color:var(--text-primary); font-size:0.75rem; }
      .lbl-check { margin-right:8px; }
      .lbl-empty { text-align:center; padding:40px; color:var(--text-muted); }
      @media print {
        .sidebar, .header, .stats-strip, .panel-content-header, .lbl-toolbar { display:none !important; }
        .panel-content { margin:0 !important; padding:0 !important; }
        .lbl-grid { gap:8px; }
        .lbl-card { border:1px solid #ccc; break-inside:avoid; }
      }
    </style>
    <div class="lbl-container">
      <div class="lbl-toolbar">
        <button class="lbl-type-btn active" onclick="_lblSetType('spool')">${t('labels.type_spool')}</button>
        <button class="lbl-type-btn" onclick="_lblSetType('printer')">${t('labels.type_printer')}</button>
        <button class="lbl-select-all" onclick="_lblToggleAll()">${t('labels.select_all')}</button>
        <button class="lbl-print-btn" onclick="window.print()">${t('labels.print')}</button>
      </div>
      <div class="lbl-grid" id="lbl-grid"></div>
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
    document.querySelectorAll('.lbl-type-btn').forEach(b => b.classList.toggle('active', b.textContent.includes(type === 'spool' ? t('labels.type_spool') : t('labels.type_printer'))));
    _loadData();
  };

  function _renderSpoolLabels() {
    const grid = document.getElementById('lbl-grid');
    if (!grid) return;
    if (!_spools.length) {
      grid.innerHTML = `<div class="lbl-empty">${t('labels.no_spools')}</div>`;
      return;
    }
    let html = '';
    for (const sp of _spools) {
      const color = sp.color_hex || '#888';
      const qrData = `${location.origin}/spool/${sp.short_id || sp.id}`;
      html += `<div class="lbl-card" data-label-id="${sp.id}">
        <div class="lbl-card-header">
          <div class="lbl-qr" id="lbl-qr-${sp.id}"></div>
          <div class="lbl-card-info">
            <div class="lbl-card-title"><span class="lbl-color-dot" style="background:${color}"></span>${_esc(sp.name || sp.material || 'Spool')}</div>
            <div class="lbl-card-subtitle">${_esc(sp.short_id || '#' + sp.id)}</div>
          </div>
        </div>
        <div class="lbl-card-row"><span>${t('labels.material')}</span><span>${_esc(sp.material || '--')}</span></div>
        <div class="lbl-card-row"><span>${t('labels.brand')}</span><span>${_esc(sp.brand || '--')}</span></div>
        <div class="lbl-card-row"><span>${t('labels.weight')}</span><span>${sp.remaining_weight_g ? sp.remaining_weight_g.toFixed(0) + 'g' : '--'}</span></div>
        ${sp.lot_number ? `<div class="lbl-card-row"><span>${t('labels.lot')}</span><span>${_esc(sp.lot_number)}</span></div>` : ''}
        ${sp.location_name ? `<div class="lbl-card-row"><span>${t('labels.location')}</span><span>${_esc(sp.location_name)}</span></div>` : ''}
      </div>`;
    }
    grid.innerHTML = html;

    // Generate QR codes
    setTimeout(() => {
      for (const sp of _spools) {
        const el = document.getElementById(`lbl-qr-${sp.id}`);
        if (!el || el.querySelector('canvas')) continue;
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
      grid.innerHTML = `<div class="lbl-empty">${t('labels.no_printers')}</div>`;
      return;
    }
    let html = '';
    for (const id of ids) {
      const meta = state._printerMeta[id] || {};
      const qrData = `${location.origin}/#dashboard?printer=${id}`;
      html += `<div class="lbl-card">
        <div class="lbl-card-header">
          <div class="lbl-qr" id="lbl-qr-p-${id.replace(/\W/g,'_')}"></div>
          <div class="lbl-card-info">
            <div class="lbl-card-title">${_esc(meta.name || id)}</div>
            <div class="lbl-card-subtitle">${_esc(meta.model || '')}</div>
          </div>
        </div>
        <div class="lbl-card-row"><span>${t('labels.printer_id')}</span><span>${_esc(id)}</span></div>
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
    // Toggle all cards for print selection (visual highlight)
    document.querySelectorAll('.lbl-card').forEach(c => c.classList.toggle('selected'));
  };

  function _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
})();
