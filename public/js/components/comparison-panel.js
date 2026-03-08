// Print Comparison / A-B Testing — side-by-side print comparison
(function() {
  let _prints = [];
  let _selected = [null, null];

  window.loadComparisonPanel = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    el.innerHTML = `<style>
      .cmp-container { max-width:1100px; }
      .cmp-selector { display:flex; gap:16px; margin-bottom:20px; flex-wrap:wrap; }
      .cmp-slot { flex:1; min-width:280px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); padding:14px; }
      .cmp-slot h4 { margin:0 0 8px; font-size:0.85rem; color:var(--text-muted); }
      .cmp-select { width:100%; padding:8px 10px; background:var(--bg-primary); border:1px solid var(--border-color); border-radius:var(--radius); color:var(--text-primary); font-size:0.82rem; }
      .cmp-table { width:100%; border-collapse:collapse; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); overflow:hidden; }
      .cmp-table th { background:var(--bg-tertiary); padding:10px 14px; font-size:0.75rem; font-weight:700; text-align:left; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.02em; }
      .cmp-table td { padding:10px 14px; font-size:0.82rem; border-top:1px solid var(--border-color); }
      .cmp-table td:first-child { color:var(--text-muted); font-weight:600; width:180px; }
      .cmp-better { color:var(--accent-green); font-weight:700; }
      .cmp-worse { color:var(--accent-red); font-weight:700; }
      .cmp-bar-wrap { display:flex; align-items:center; gap:8px; }
      .cmp-bar { height:8px; border-radius:4px; transition:width 0.5s; }
      .cmp-empty { text-align:center; padding:40px; color:var(--text-muted); }
      .cmp-info { font-size:0.72rem; color:var(--text-muted); padding:4px 0; }
    </style>
    <div class="cmp-container">
      <div class="cmp-selector">
        <div class="cmp-slot">
          <h4>${t('comparison.print_a')}</h4>
          <select class="cmp-select" id="cmp-sel-a" onchange="_cmpSelect(0, this.value)"><option value="">${t('comparison.select_print')}</option></select>
        </div>
        <div class="cmp-slot">
          <h4>${t('comparison.print_b')}</h4>
          <select class="cmp-select" id="cmp-sel-b" onchange="_cmpSelect(1, this.value)"><option value="">${t('comparison.select_print')}</option></select>
        </div>
      </div>
      <div id="cmp-result"></div>
    </div>`;

    _loadPrints();
  };

  async function _loadPrints() {
    const pid = window.printerState?.getActivePrinterId();
    try {
      const url = pid ? `/api/history?limit=100&printer_id=${pid}` : '/api/history?limit=100';
      const r = await fetch(url);
      _prints = await r.json();
      if (Array.isArray(_prints)) _populateSelects();
    } catch { _prints = []; }
  }

  function _populateSelects() {
    for (const sel of ['cmp-sel-a', 'cmp-sel-b']) {
      const el = document.getElementById(sel);
      if (!el) continue;
      let html = `<option value="">${t('comparison.select_print')}</option>`;
      for (const p of _prints) {
        const name = p.filename || `Print #${p.id}`;
        const date = p.started_at ? new Date(p.started_at).toLocaleDateString() : '';
        html += `<option value="${p.id}">${_esc(name)} — ${date}</option>`;
      }
      el.innerHTML = html;
    }
  }

  window._cmpSelect = function(slot, id) {
    _selected[slot] = id ? _prints.find(p => p.id == id) : null;
    _renderComparison();
  };

  function _renderComparison() {
    const el = document.getElementById('cmp-result');
    if (!el) return;
    const [a, b] = _selected;
    if (!a || !b) {
      el.innerHTML = `<div class="cmp-empty">${t('comparison.select_both')}</div>`;
      return;
    }

    const rows = [
      [t('comparison.status'), a.status || '--', b.status || '--'],
      [t('comparison.duration'), _fmtDuration(a.duration_seconds), _fmtDuration(b.duration_seconds), 'lower', a.duration_seconds, b.duration_seconds],
      [t('comparison.filament'), a.filament_used_g ? a.filament_used_g.toFixed(1) + 'g' : '--', b.filament_used_g ? b.filament_used_g.toFixed(1) + 'g' : '--', 'lower', a.filament_used_g, b.filament_used_g],
      [t('comparison.filament_type'), a.filament_type || '--', b.filament_type || '--'],
      [t('comparison.layers'), a.layer_count || '--', b.layer_count || '--'],
      [t('comparison.speed'), a.speed_level || '--', b.speed_level || '--'],
      [t('comparison.nozzle_temp'), a.nozzle_target ? a.nozzle_target + '\u00B0C' : '--', b.nozzle_target ? b.nozzle_target + '\u00B0C' : '--'],
      [t('comparison.bed_temp'), a.bed_target ? a.bed_target + '\u00B0C' : '--', b.bed_target ? b.bed_target + '\u00B0C' : '--'],
      [t('comparison.nozzle_type'), a.nozzle_type || '--', b.nozzle_type || '--'],
      [t('comparison.waste'), a.waste_g ? a.waste_g.toFixed(1) + 'g' : '--', b.waste_g ? b.waste_g.toFixed(1) + 'g' : '--', 'lower', a.waste_g, b.waste_g],
      [t('comparison.date'), a.started_at ? new Date(a.started_at).toLocaleString() : '--', b.started_at ? new Date(b.started_at).toLocaleString() : '--']
    ];

    let html = `<table class="cmp-table">
      <tr><th>${t('comparison.metric')}</th><th>${t('comparison.print_a')}</th><th>${t('comparison.print_b')}</th></tr>`;
    for (const row of rows) {
      const [label, va, vb, mode, na, nb] = row;
      let clsA = '', clsB = '';
      if (mode && na && nb && na !== nb) {
        if (mode === 'lower') { clsA = na < nb ? 'cmp-better' : 'cmp-worse'; clsB = nb < na ? 'cmp-better' : 'cmp-worse'; }
        else { clsA = na > nb ? 'cmp-better' : 'cmp-worse'; clsB = nb > na ? 'cmp-better' : 'cmp-worse'; }
      }
      html += `<tr><td>${label}</td><td class="${clsA}">${va}</td><td class="${clsB}">${vb}</td></tr>`;
    }
    html += '</table>';
    el.innerHTML = html;
  }

  function _fmtDuration(s) {
    if (!s) return '--';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  function _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
})();
