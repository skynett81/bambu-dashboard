// Library Wrapper — adds Gcode tab to Library panel
(function() {
  let _activeTab = 'library';
  const _origLoad = window.loadLibraryPanel;
  const TABS = [
    { id: 'library', labelKey: 'tabs.library', fallback: 'Filbibliotek' },
    { id: 'gcode', labelKey: 'tabs.gcode', fallback: 'G-code' }
  ];
  function _tabBarHtml() {
    return '<div class="tabs _wrapper-tabs">' + TABS.map(tab => {
      const label = (typeof t === 'function' && t(tab.labelKey) !== tab.labelKey ? t(tab.labelKey) : tab.fallback);
      const active = _activeTab === tab.id ? ' active' : '';
      return `<button class="tab-btn${active}" onclick="_switchLibraryTab('${tab.id}')">${label}</button>`;
    }).join('') + '</div>';
  }
  function _ensureTabBar() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;
    const old = body.querySelector('._wrapper-tabs');
    if (old) old.remove();
    body.insertAdjacentHTML('afterbegin', _tabBarHtml());
  }
  window._switchLibraryTab = function(tab) { _activeTab = tab; history.replaceState(null, '', '#' + tab); window._activePanel = tab; _render(); };
  async function _render() {
    if (_activeTab === 'library' && _origLoad) await _origLoad();
    else if (_activeTab === 'gcode' && typeof loadGcodePanel === 'function') await loadGcodePanel();
    _ensureTabBar();
  }
  window.loadLibraryPanel = function(initialTab) {
    _activeTab = (typeof initialTab === 'string') ? initialTab : 'library';
    _render();
  };
})();
