// Filament Wrapper — adds Forecast, Multicolor tabs to Filament panel
(function() {
  let _activeTab = 'filament';
  const _origLoad = window.loadFilamentPanel;
  const TABS = [
    { id: 'filament', labelKey: 'tabs.filament', fallback: 'Filament' },
    { id: 'forecast', labelKey: 'tabs.forecast', fallback: 'Prognose' },
    { id: 'multicolor', labelKey: 'tabs.multicolor', fallback: 'Flerfarget' }
  ];
  function _buildTabBar() {
    const div = document.createElement('div');
    div.className = 'tabs';
    div.innerHTML = TABS.map(tab => {
      const label = (typeof t === 'function' ? t(tab.labelKey) : '') || tab.fallback;
      const active = _activeTab === tab.id ? ' active' : '';
      return `<button class="tab-btn${active}" onclick="_switchFilamentTab('${tab.id}')">${label}</button>`;
    }).join('');
    return div;
  }
  window._switchFilamentTab = function(tab) { _activeTab = tab; _render(); };
  async function _render() {
    if (_activeTab === 'filament' && _origLoad) await _origLoad();
    else if (_activeTab === 'forecast' && typeof loadForecastPanel === 'function') await loadForecastPanel();
    else if (_activeTab === 'multicolor' && typeof loadMulticolorPanel === 'function') await loadMulticolorPanel();
    const body = document.getElementById('overlay-panel-body');
    if (body) body.insertBefore(_buildTabBar(), body.firstChild);
  }
  window.loadFilamentPanel = function(initialTab) {
    if (typeof initialTab === 'string') _activeTab = initialTab;
    _render();
  };
})();
