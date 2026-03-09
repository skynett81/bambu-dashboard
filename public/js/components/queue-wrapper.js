// Queue Wrapper — adds Scheduler tab to Queue panel
(function() {
  let _activeTab = 'queue';
  const _origLoad = window.loadQueuePanel;
  const TABS = [
    { id: 'queue', labelKey: 'tabs.queue', fallback: 'Utskriftskø' },
    { id: 'scheduler', labelKey: 'tabs.scheduler', fallback: 'Planlegger' }
  ];
  function _tabBarHtml() {
    return '<div class="tabs _wrapper-tabs">' + TABS.map(tab => {
      const label = (typeof t === 'function' ? t(tab.labelKey) : '') || tab.fallback;
      const active = _activeTab === tab.id ? ' active' : '';
      return `<button class="tab-btn${active}" onclick="_switchQueueTab('${tab.id}')">${label}</button>`;
    }).join('') + '</div>';
  }
  function _ensureTabBar() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;
    const old = body.querySelector('._wrapper-tabs');
    if (old) old.remove();
    body.insertAdjacentHTML('afterbegin', _tabBarHtml());
  }
  window._switchQueueTab = function(tab) { _activeTab = tab; _render(); };
  async function _render() {
    if (_activeTab === 'queue' && _origLoad) await _origLoad();
    else if (_activeTab === 'scheduler' && typeof loadSchedulerPanel === 'function') await loadSchedulerPanel();
    _ensureTabBar();
  }
  window.loadQueuePanel = function(initialTab) {
    _activeTab = (typeof initialTab === 'string') ? initialTab : 'queue';
    _render();
  };
})();
