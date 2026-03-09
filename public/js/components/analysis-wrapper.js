// Analysis Wrapper — combines Stats, Comparison, PrinterMatrix, TimeTracker, Waste
(function() {
  let _activeTab = 'stats';
  const _origStats = window.loadStatsPanel;
  const TABS = [
    { id: 'stats', labelKey: 'tabs.statistics', fallback: 'Statistikk' },
    { id: 'comparison', labelKey: 'tabs.comparison', fallback: 'Sammenlign' },
    { id: 'printermatrix', labelKey: 'tabs.printermatrix', fallback: 'Printermatrise' },
    { id: 'timetracker', labelKey: 'tabs.timetracker', fallback: 'Tidsanalyse' },
    { id: 'waste', labelKey: 'tabs.waste', fallback: 'Avfall' }
  ];
  function _buildTabBar() {
    const div = document.createElement('div');
    div.className = 'tabs';
    div.innerHTML = TABS.map(tab => {
      const label = (typeof t === 'function' ? t(tab.labelKey) : '') || tab.fallback;
      const active = _activeTab === tab.id ? ' active' : '';
      return `<button class="tab-btn${active}" onclick="_switchAnalysisTab('${tab.id}')">${label}</button>`;
    }).join('');
    return div;
  }
  window._switchAnalysisTab = function(tab) { _activeTab = tab; _render(); };
  async function _render() {
    if (_activeTab === 'stats' && _origStats) await _origStats();
    else if (_activeTab === 'comparison' && typeof loadComparisonPanel === 'function') await loadComparisonPanel();
    else if (_activeTab === 'printermatrix' && typeof loadPrinterMatrixPanel === 'function') await loadPrinterMatrixPanel();
    else if (_activeTab === 'timetracker' && typeof loadTimeTrackerPanel === 'function') await loadTimeTrackerPanel();
    else if (_activeTab === 'waste' && typeof loadWastePanel === 'function') await loadWastePanel();
    const body = document.getElementById('overlay-panel-body');
    if (body) body.insertBefore(_buildTabBar(), body.firstChild);
  }
  window.loadAnalysisPanel = function(initialTab) {
    if (typeof initialTab === 'string') _activeTab = initialTab;
    _render();
  };
})();
