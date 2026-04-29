// Stats Wrapper — adds Comparison, PrinterMatrix tabs to Stats panel
(function() {
  let _activeTab = 'stats';
  const _origLoad = window.loadStatsPanel;
  const TABS = [
    { id: 'stats', labelKey: 'tabs.stats', fallback: 'Statistikk' },
    { id: 'comparison', labelKey: 'tabs.comparison', fallback: 'Sammenlign' },
    { id: 'printermatrix', labelKey: 'tabs.printermatrix', fallback: 'Printermatrise' }
  ];
  function _buildTabBar() {
    const div = document.createElement('div');
    div.className = 'tabs';
    div.innerHTML = TABS.map(tab => {
      const label = (typeof t === 'function' && t(tab.labelKey) !== tab.labelKey ? t(tab.labelKey) : tab.fallback);
      const active = _activeTab === tab.id ? ' active' : '';
      return `<button class="tab-btn${active}" onclick="_switchStatsTab('${tab.id}')">${label}</button>`;
    }).join('');
    return div;
  }
  window._switchStatsTab = function(tab) { _activeTab = tab; _render(); };
  function _render() {
    if (_activeTab === 'stats' && _origLoad) _origLoad();
    else if (_activeTab === 'comparison' && typeof loadComparisonPanel === 'function') loadComparisonPanel();
    else if (_activeTab === 'printermatrix' && typeof loadPrinterMatrixPanel === 'function') loadPrinterMatrixPanel();
    const body = document.getElementById('overlay-panel-body');
    if (body) body.insertBefore(_buildTabBar(), body.firstChild);
  }
  window.loadStatsPanel = function(initialTab) {
    if (typeof initialTab === 'string') _activeTab = initialTab;
    _render();
  };
})();
