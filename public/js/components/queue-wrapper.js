// Queue Wrapper — adds Scheduler tab to Queue panel
(function() {
  let _activeTab = 'queue';
  const _origLoad = window.loadQueuePanel;
  const TABS = [
    { id: 'queue', labelKey: 'tabs.queue', fallback: 'Utskriftskø' },
    { id: 'scheduler', labelKey: 'tabs.scheduler', fallback: 'Planlegger' }
  ];
  function _buildTabBar() {
    const div = document.createElement('div');
    div.className = 'tabs';
    div.innerHTML = TABS.map(tab => {
      const label = (typeof t === 'function' ? t(tab.labelKey) : '') || tab.fallback;
      const active = _activeTab === tab.id ? ' active' : '';
      return `<button class="tab-btn${active}" onclick="_switchQueueTab('${tab.id}')">${label}</button>`;
    }).join('');
    return div;
  }
  window._switchQueueTab = function(tab) { _activeTab = tab; _render(); };
  async function _render() {
    if (_activeTab === 'queue' && _origLoad) await _origLoad();
    else if (_activeTab === 'scheduler' && typeof loadSchedulerPanel === 'function') await loadSchedulerPanel();
    const body = document.getElementById('overlay-panel-body');
    if (body) body.insertBefore(_buildTabBar(), body.firstChild);
  }
  window.loadQueuePanel = function(initialTab) {
    if (typeof initialTab === 'string') _activeTab = initialTab;
    _render();
  };
})();
