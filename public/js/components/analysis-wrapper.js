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
  function _tabBarHtml() {
    return '<div class="tabs _wrapper-tabs">' + TABS.map(tab => {
      const label = (typeof t === 'function' ? t(tab.labelKey) : '') || tab.fallback;
      const active = _activeTab === tab.id ? ' active' : '';
      return `<button class="tab-btn${active}" onclick="_switchAnalysisTab('${tab.id}')">${label}</button>`;
    }).join('') + '</div>';
  }
  function _ensureTabBar() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;
    const old = body.querySelector('._wrapper-tabs');
    if (old) old.remove();
    body.insertAdjacentHTML('afterbegin', _tabBarHtml());
  }
  window._switchAnalysisTab = function(tab) { _activeTab = tab; _render(); };
  async function _render() {
    if (_activeTab === 'stats' && _origStats) await _origStats();
    else if (_activeTab === 'comparison' && typeof loadComparisonPanel === 'function') await loadComparisonPanel();
    else if (_activeTab === 'printermatrix' && typeof loadPrinterMatrixPanel === 'function') await loadPrinterMatrixPanel();
    else if (_activeTab === 'timetracker' && typeof loadTimeTrackerPanel === 'function') await loadTimeTrackerPanel();
    else if (_activeTab === 'waste' && typeof loadWastePanel === 'function') await loadWastePanel();
    _ensureTabBar();
  }
  window.loadAnalysisPanel = function(initialTab) {
    _activeTab = (typeof initialTab === 'string') ? initialTab : 'stats';
    _render();
  };
})();
