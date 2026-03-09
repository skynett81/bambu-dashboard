// Filament Wrapper — adds Forecast, Multicolor tabs to Filament panel
(function() {
  let _activeTab = 'filament';
  const _origLoad = window.loadFilamentPanel;
  const TABS = [
    { id: 'filament', labelKey: 'tabs.filament', fallback: 'Filament' },
    { id: 'forecast', labelKey: 'tabs.forecast', fallback: 'Prognose' },
    { id: 'multicolor', labelKey: 'tabs.multicolor', fallback: 'Flerfarget' }
  ];
  function _tabBarHtml() {
    return '<div class="tabs _wrapper-tabs">' + TABS.map(tab => {
      const label = (typeof t === 'function' ? t(tab.labelKey) : '') || tab.fallback;
      const active = _activeTab === tab.id ? ' active' : '';
      return `<button class="tab-btn${active}" onclick="_switchFilamentTab('${tab.id}')">${label}</button>`;
    }).join('') + '</div>';
  }
  function _ensureTabBar() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;
    // Remove any existing wrapper tabs
    const old = body.querySelector('._wrapper-tabs');
    if (old) old.remove();
    // Insert at top
    body.insertAdjacentHTML('afterbegin', _tabBarHtml());
  }
  window._switchFilamentTab = function(tab) { _activeTab = tab; _render(); };
  async function _render() {
    if (_activeTab === 'filament' && _origLoad) {
      await _origLoad();
    } else if (_activeTab === 'forecast' && typeof loadForecastPanel === 'function') {
      await loadForecastPanel();
    } else if (_activeTab === 'multicolor' && typeof loadMulticolorPanel === 'function') {
      await loadMulticolorPanel();
    }
    _ensureTabBar();
  }
  window.loadFilamentPanel = function(initialTab) {
    _activeTab = (typeof initialTab === 'string') ? initialTab : 'filament';
    _render();
  };
})();
