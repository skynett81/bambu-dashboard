// Error Log Display
(function() {
  function printerName(id) {
    return window.printerState?._printerMeta?.[id]?.name || id || '--';
  }

  function formatDate(iso) {
    if (!iso) return '--';
    const d = new Date(iso);
    const locale = (window.i18n?.getLocale() || 'nb').replace('_', '-');
    return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  window.loadErrorsPanel = loadErrors;

  async function loadErrors() {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;

    try {
      const res = await fetch('/api/errors?limit=50');
      const errors = await res.json();

      if (!errors.length) {
        panel.innerHTML = `<p class="text-muted">${t('errors.no_errors')}</p>`;
        return;
      }

      let html = '';
      for (const e of errors) {
        html += `
          <div class="error-item">
            <div class="error-severity severity-${e.severity}"></div>
            <div style="flex:1">
              <div class="flex items-center gap-sm">
                <span class="printer-tag">${printerName(e.printer_id)}</span>
                <span>${e.message}</span>
              </div>
              <div class="error-time">${formatDate(e.timestamp)} &middot; ${e.code || ''}</div>
            </div>
          </div>`;
      }

      panel.innerHTML = html;
    } catch (e) {
      panel.innerHTML = `<p class="text-muted">${t('errors.load_failed')}</p>`;
    }
  }

})();
