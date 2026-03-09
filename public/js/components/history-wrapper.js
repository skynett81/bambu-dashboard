// History Wrapper — adds Gallery, Activity tabs to History panel
(function() {
  let _activeTab = 'history';
  const _origLoad = window.loadHistoryPanel;
  const TABS = [
    { id: 'history', labelKey: 'tabs.history', fallback: 'Historikk' },
    { id: 'gallery', labelKey: 'tabs.gallery', fallback: 'Galleri' },
    { id: 'activity', labelKey: 'tabs.activity', fallback: 'Aktivitet' }
  ];
  function _tabBarHtml() {
    return '<div class="tabs _wrapper-tabs">' + TABS.map(tab => {
      const label = (typeof t === 'function' ? t(tab.labelKey) : '') || tab.fallback;
      const active = _activeTab === tab.id ? ' active' : '';
      return `<button class="tab-btn${active}" onclick="_switchHistoryTab('${tab.id}')">${label}</button>`;
    }).join('') + '</div>';
  }
  function _ensureTabBar() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;
    const old = body.querySelector('._wrapper-tabs');
    if (old) old.remove();
    body.insertAdjacentHTML('afterbegin', _tabBarHtml());
  }
  window._switchHistoryTab = function(tab) { _activeTab = tab; _render(); };
  async function _render() {
    if (_activeTab === 'history' && _origLoad) await _origLoad();
    else if (_activeTab === 'gallery' && typeof loadGalleryPanel === 'function') await loadGalleryPanel();
    else if (_activeTab === 'activity' && typeof loadActivityPanel === 'function') await loadActivityPanel();
    _ensureTabBar();
  }
  window.loadHistoryPanel = function(initialTab) {
    _activeTab = (typeof initialTab === 'string') ? initialTab : 'history';
    _render();
  };
})();
