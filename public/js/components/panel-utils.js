// Shared utilities for overlay panels

// Resolve printer ID to display name
window.getPrinterDisplayName = function(id) {
  return window.printerState?._printerMeta?.[id]?.name || id || '--';
};

// Build a printer selector dropdown for panels
// callbackName: name of global function to call on change
// selectedId: currently selected printer ID (null = all)
// showAll: whether to include an "All printers" option (default true)
window.buildPrinterSelector = function(callbackName, selectedId, showAll) {
  if (showAll === undefined) showAll = true;
  const state = window.printerState;
  if (!state) return '';

  const ids = state.getPrinterIds();
  if (ids.length <= 1 && !showAll) return '';

  let options = '';
  if (showAll) {
    options += `<option value="" ${!selectedId ? 'selected' : ''}>${t('common.all_printers')}</option>`;
  }
  for (const id of ids) {
    const name = state._printerMeta[id]?.name || id;
    options += `<option value="${id}" ${id === selectedId ? 'selected' : ''}>${name}</option>`;
  }

  return `<div class="panel-printer-select-row">
    <label class="panel-printer-label">${t('common.printer')}:</label>
    <select class="panel-printer-select" onchange="${callbackName}(this.value)">${options}</select>
  </div>`;
};
