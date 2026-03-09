// Library Wrapper — adds Gcode tab to Library panel
(function() {
  let _activeTab = 'library';
  const _origLoad = window.loadLibraryPanel;
  const TABS = [
    { id: 'library', labelKey: 'tabs.library', fallback: 'Filbibliotek' },
    { id: 'gcode', labelKey: 'tabs.gcode', fallback: 'G-code' }
  ];
  function _buildTabBar() {
    const div = document.createElement('div');
    div.className = 'tabs';
    div.innerHTML = TABS.map(tab => {
      const label = (typeof t === 'function' ? t(tab.labelKey) : '') || tab.fallback;
      const active = _activeTab === tab.id ? ' active' : '';
      return `<button class="tab-btn${active}" onclick="_switchLibraryTab('${tab.id}')">${label}</button>`;
    }).join('');
    return div;
  }
  window._switchLibraryTab = function(tab) { _activeTab = tab; _render(); };
  async function _render() {
    if (_activeTab === 'library' && _origLoad) await _origLoad();
    else if (_activeTab === 'gcode' && typeof loadGcodePanel === 'function') await loadGcodePanel();
    const body = document.getElementById('overlay-panel-body');
    if (body) body.insertBefore(_buildTabBar(), body.firstChild);
  }
  window.loadLibraryPanel = function(initialTab) {
    if (typeof initialTab === 'string') _activeTab = initialTab;
    _render();
  };
})();
