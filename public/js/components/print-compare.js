// Print Comparison — Side-by-Side
(function() {
  'use strict';

  function _esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function _formatDuration(seconds) {
    if (!seconds) return '--';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  function _formatDate(iso) {
    if (!iso) return '--';
    const locale = (window.i18n?.getLocale() || 'nb').replace('_', '-');
    return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function _statusColor(status) {
    return { completed: 'var(--accent-green)', failed: 'var(--accent-red)', cancelled: 'var(--accent-orange)' }[status] || 'var(--text-muted)';
  }

  function _statusLabel(status) {
    const map = { completed: 'Completed', failed: 'Failed', cancelled: 'Cancelled' };
    if (typeof t === 'function') {
      const tMap = { completed: 'completed', failed: 'failed', cancelled: 'cancelled' };
      if (tMap[status]) return t(`history.${tMap[status]}`);
    }
    return map[status] || status || '--';
  }

  function _removeModal() {
    const existing = document.getElementById('print-compare-modal');
    if (existing) existing.remove();
  }

  function _createOverlay() {
    _removeModal();
    const overlay = document.createElement('div');
    overlay.id = 'print-compare-modal';
    overlay.className = 'modal-overlay';
    overlay.style.zIndex = '1100';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) _removeModal();
    });
    document.body.appendChild(overlay);
    return overlay;
  }

  window.openPrintCompare = async function(id1, id2) {
    if (!id1 || !id2) {
      _showSelectionModal();
      return;
    }

    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/history/' + id1).then(r => r.json()),
        fetch('/api/history/' + id2).then(r => r.json())
      ]);
      _showCompareModal(r1, r2);
    } catch (err) {
      if (typeof showToast === 'function') showToast((typeof t === 'function' ? t('history.compare_load_failed') : '') || 'Kunne ikke laste utskriftsdata', 'error', 3000);
    }
  };

  async function _showSelectionModal() {
    const overlay = _createOverlay();
    let prints = [];
    try {
      const res = await fetch('/api/history?limit=50');
      const data = await res.json();
      prints = data.prints || data || [];
    } catch (e) {
      prints = [];
    }

    let html = `<div class="modal-content" style="max-width:550px">
      <div class="modal-header">
        <h3>${(typeof t === 'function' ? t('history.compare_prints') : '') || 'Sammenlign utskrifter'}</h3>
        <button class="modal-close" onclick="document.getElementById('print-compare-modal')?.remove()">&times;</button>
      </div>
      <div class="modal-body">
        <p class="text-muted" style="font-size:0.8rem;margin-bottom:10px">${(typeof t === 'function' ? t('history.compare_select_hint') : '') || 'Velg nøyaktig to utskrifter, klikk deretter Sammenlign.'}</p>
        <div class="compare-select-list">`;

    for (const p of prints) {
      const fname = (p.filename || '--').replace(/\.(3mf|gcode)$/i, '');
      const date = _formatDate(p.started_at);
      html += `<label class="compare-select-item">
        <input type="checkbox" class="compare-cb" value="${p.id}">
        <span style="flex:1;min-width:0">
          <span style="font-size:0.85rem;font-weight:500;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_esc(fname)}</span>
          <span style="font-size:0.75rem;color:var(--text-muted)">${date} &mdash; <span style="color:${_statusColor(p.status)}">${_statusLabel(p.status)}</span></span>
        </span>
      </label>`;
    }

    html += `</div></div>
      <div class="modal-footer">
        <button class="form-btn form-btn-secondary" onclick="document.getElementById('print-compare-modal')?.remove()">${(typeof t === 'function' ? t('common.cancel') : '') || 'Avbryt'}</button>
        <button class="form-btn form-btn-primary" id="compare-go-btn" disabled onclick="window._compareSelected()">${(typeof t === 'function' ? t('history.compare_btn') : '') || 'Sammenlign'}</button>
      </div>
    </div>`;

    overlay.innerHTML = html;

    // Enable button when exactly 2 checked
    overlay.addEventListener('change', () => {
      const checked = overlay.querySelectorAll('.compare-cb:checked');
      const btn = document.getElementById('compare-go-btn');
      if (btn) btn.disabled = checked.length !== 2;
    });
  }

  window._compareSelected = function() {
    const modal = document.getElementById('print-compare-modal');
    if (!modal) return;
    const checked = modal.querySelectorAll('.compare-cb:checked');
    if (checked.length !== 2) return;
    const id1 = parseInt(checked[0].value);
    const id2 = parseInt(checked[1].value);
    _removeModal();
    window.openPrintCompare(id1, id2);
  };

  function _showCompareModal(a, b) {
    const overlay = _createOverlay();

    const _tl = (key, fallback) => (typeof t === 'function' ? t(key) : '') || fallback;
    const fields = [
      { label: _tl('history.filename', 'Filnavn'), key: 'filename', fmt: v => _esc((v || '--').replace(/\.(3mf|gcode)$/i, '')) },
      { label: _tl('history.status', 'Status'), key: 'status', fmt: v => `<span style="color:${_statusColor(v)};font-weight:600">${_statusLabel(v)}</span>`, compare: 'status' },
      { label: _tl('history.duration', 'Varighet'), key: 'duration_seconds', fmt: v => _formatDuration(v), compare: 'lower' },
      { label: _tl('history.started', 'Startet'), key: 'started_at', fmt: v => _formatDate(v) },
      { label: _tl('history.ended', 'Avsluttet'), key: 'ended_at', fmt: v => _formatDate(v) },
      { label: _tl('history.filament', 'Filament brukt'), key: 'filament_used_g', fmt: v => v ? v.toFixed(1) + 'g' : '--', compare: 'lower' },
      { label: _tl('history.filament_type', 'Filamenttype'), key: 'filament_type', fmt: v => _esc(v || '--') },
      { label: _tl('history.layers', 'Lag'), key: 'layer_count', fmt: v => v ? String(v) : '--' },
      { label: _tl('history.notes', 'Notater'), key: 'notes', fmt: v => _esc(v || '--') }
    ];

    function classFor(field, valA, valB, side) {
      if (!field.compare) return '';
      if (field.compare === 'status') {
        if (valA === valB) return '';
        if (side === 'a') return valA === 'completed' ? 'compare-better' : 'compare-worse';
        return valB === 'completed' ? 'compare-better' : 'compare-worse';
      }
      if (field.compare === 'lower') {
        const nA = parseFloat(valA) || 0;
        const nB = parseFloat(valB) || 0;
        if (nA === nB || (!nA && !nB)) return '';
        if (side === 'a') return nA < nB ? 'compare-better' : nA > nB ? 'compare-worse' : '';
        return nB < nA ? 'compare-better' : nB > nA ? 'compare-worse' : '';
      }
      return '';
    }

    const fnameA = (a.filename || '--').replace(/\.(3mf|gcode)$/i, '');
    const fnameB = (b.filename || '--').replace(/\.(3mf|gcode)$/i, '');

    let html = `<div class="modal-content" style="max-width:700px">
      <div class="modal-header">
        <h3>${_tl('history.compare_title', 'Sammenlign utskrifter')}</h3>
        <button class="modal-close" onclick="document.getElementById('print-compare-modal')?.remove()">&times;</button>
      </div>
      <div class="modal-body" style="padding:0">
        <div class="compare-grid">
          <div class="compare-header">${_esc(fnameA)}</div>
          <div class="compare-header">${_esc(fnameB)}</div>
        </div>`;

    for (const f of fields) {
      const valA = a[f.key];
      const valB = b[f.key];
      const clsA = classFor(f, valA, valB, 'a');
      const clsB = classFor(f, valA, valB, 'b');

      html += `<div class="compare-grid">
        <div class="compare-col">
          <div class="compare-row">
            <span class="compare-label">${f.label}</span>
            <span class="${clsA}">${f.fmt(valA)}</span>
          </div>
        </div>
        <div class="compare-col">
          <div class="compare-row">
            <span class="compare-label">${f.label}</span>
            <span class="${clsB}">${f.fmt(valB)}</span>
          </div>
        </div>
      </div>`;
    }

    html += `</div>
      <div class="modal-footer">
        <button class="form-btn form-btn-secondary" onclick="document.getElementById('print-compare-modal')?.remove()">${_tl('common.close', 'Lukk')}</button>
      </div>
    </div>`;

    overlay.innerHTML = html;
  }
})();
