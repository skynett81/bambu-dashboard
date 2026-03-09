// History Wrapper — adds Gallery, Activity tabs to History panel
(function() {
  let _activeTab = 'history';
  const _origLoad = window.loadHistoryPanel;
  const TABS = [
    { id: 'history', labelKey: 'tabs.history', fallback: 'Historikk' },
    { id: 'gallery', labelKey: 'tabs.gallery', fallback: 'Galleri' },
    { id: 'activity', labelKey: 'tabs.activity', fallback: 'Aktivitet' }
  ];
  function _buildTabBar() {
    const div = document.createElement('div');
    div.className = 'tabs';
    div.innerHTML = TABS.map(tab => {
      const label = (typeof t === 'function' ? t(tab.labelKey) : '') || tab.fallback;
      const active = _activeTab === tab.id ? ' active' : '';
      return `<button class="tab-btn${active}" onclick="_switchHistoryTab('${tab.id}')">${label}</button>`;
    }).join('');
    return div;
  }
  window._switchHistoryTab = function(tab) { _activeTab = tab; _render(); };
  async function _render() {
    if (_activeTab === 'history' && _origLoad) await _origLoad();
    else if (_activeTab === 'gallery' && typeof loadGalleryPanel === 'function') await loadGalleryPanel();
    else if (_activeTab === 'activity' && typeof loadActivityPanel === 'function') await loadActivityPanel();
    const body = document.getElementById('overlay-panel-body');
    if (body) body.insertBefore(_buildTabBar(), body.firstChild);
  }
  window.loadHistoryPanel = function(initialTab) {
    if (typeof initialTab === 'string') _activeTab = initialTab;
    _render();
  };
})();
