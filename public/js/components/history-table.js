// Print History Table
(function() {
  function printerName(id) {
    return window.printerState?._printerMeta?.[id]?.name || id || '--';
  }

  function statusLabel(status) {
    const key = { completed: 'completed', failed: 'failed', cancelled: 'cancelled' }[status];
    return key ? t(`history.${key}`) : status;
  }

  function formatDuration(seconds) {
    if (!seconds) return '--';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}${t('time.h')} ${m}${t('time.m')}` : `${m}${t('time.m')}`;
  }

  function formatDate(iso) {
    if (!iso) return '--';
    const d = new Date(iso);
    const locale = (window.i18n?.getLocale() || 'nb').replace('_', '-');
    return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  window.loadHistoryPanel = loadHistory;

  async function loadHistory() {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;

    try {
      const res = await fetch('/api/history?limit=50');
      const data = await res.json();

      if (!data.length) {
        panel.innerHTML = `<p class="text-muted">${t('history.no_records')}</p>`;
        return;
      }

      let html = `<table class="data-table"><thead><tr>
        <th>${t('common.printer')}</th><th>${t('history.date')}</th><th>${t('history.filename')}</th><th>${t('history.status')}</th><th>${t('history.duration')}</th><th>${t('history.filament')}</th><th>${t('history.layers')}</th>
      </tr></thead><tbody>`;

      for (const row of data) {
        const pillClass = `pill pill-${row.status}`;
        html += `<tr>
          <td><span class="printer-tag">${printerName(row.printer_id)}</span></td>
          <td>${formatDate(row.started_at)}</td>
          <td>${row.filename || '--'}</td>
          <td><span class="${pillClass}">${statusLabel(row.status)}</span></td>
          <td>${formatDuration(row.duration_seconds)}</td>
          <td>${row.filament_used_g ? row.filament_used_g + 'g ' + (row.filament_type || '') : '--'}</td>
          <td>${row.layer_count || '--'}</td>
        </tr>`;
      }

      html += '</tbody></table>';
      panel.innerHTML = html;
    } catch (e) {
      panel.innerHTML = `<p class="text-muted">${t('history.load_failed')}</p>`;
    }
  }

})();
