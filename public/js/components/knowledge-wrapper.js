// Knowledge Wrapper — adds Learning, ModelInfo tabs to Knowledge panel
(function() {
  let _activeTab = 'knowledge';
  const _origLoad = window.loadKnowledgePanel;
  const TABS = [
    { id: 'knowledge', labelKey: 'tabs.knowledge', fallback: 'Kunnskapsbase' },
    { id: 'learning', labelKey: 'tabs.learning', fallback: 'Læringssenter' },
    { id: 'modelinfo', labelKey: 'tabs.modelinfo', fallback: 'Modell Info' }
  ];
  function _tabBarHtml() {
    return '<div class="tabs _wrapper-tabs">' + TABS.map(tab => {
      const label = (typeof t === 'function' ? t(tab.labelKey) : '') || tab.fallback;
      const active = _activeTab === tab.id ? ' active' : '';
      return `<button class="tab-btn${active}" onclick="_switchKnowledgeTab('${tab.id}')">${label}</button>`;
    }).join('') + '</div>';
  }
  function _ensureTabBar() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;
    const old = body.querySelector('._wrapper-tabs');
    if (old) old.remove();
    body.insertAdjacentHTML('afterbegin', _tabBarHtml());
  }
  window._switchKnowledgeTab = function(tab) { _activeTab = tab; _render(); };
  async function _render() {
    if (_activeTab === 'knowledge' && _origLoad) await _origLoad();
    else if (_activeTab === 'learning' && typeof loadLearningPanel === 'function') await loadLearningPanel();
    else if (_activeTab === 'modelinfo' && typeof loadModelInfoPanel === 'function') await loadModelInfoPanel();
    _ensureTabBar();
  }
  window.loadKnowledgePanel = function(initialTab) {
    _activeTab = (typeof initialTab === 'string') ? initialTab : 'knowledge';
    _render();
  };
})();
