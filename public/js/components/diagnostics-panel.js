// Diagnostics Panel — combines Health, Telemetry, and Bed Mesh into a tabbed view
(function() {
  let _activeTab = 'health';

  const TABS = [
    { id: 'health', labelKey: 'tabs.health', fallback: 'Helsescore' },
    { id: 'telemetry', labelKey: 'tabs.telemetry', fallback: 'Telemetri' },
    { id: 'bedmesh', labelKey: 'tabs.bedmesh', fallback: 'Bed Mesh' }
  ];

  function _tabBarHtml() {
    return '<div class="tabs _wrapper-tabs">' + TABS.map(tab => {
      const label = (typeof t === 'function' ? t(tab.labelKey) : '') || tab.fallback;
      const active = _activeTab === tab.id ? ' active' : '';
      return `<button class="tab-btn${active}" onclick="_switchDiagTab('${tab.id}')">${label}</button>`;
    }).join('') + '</div>';
  }

  function _ensureTabBar() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;
    const old = body.querySelector('._wrapper-tabs');
    if (old) old.remove();
    body.insertAdjacentHTML('afterbegin', _tabBarHtml());
  }

  window._switchDiagTab = function(tab) {
    _activeTab = tab;
    _renderDiag();
  };

  async function _renderDiag() {
    if (_activeTab === 'health' && typeof loadHealthPanel === 'function') await loadHealthPanel();
    else if (_activeTab === 'telemetry' && typeof loadTelemetryPanel === 'function') await loadTelemetryPanel();
    else if (_activeTab === 'bedmesh' && typeof loadBedMeshPanel === 'function') await loadBedMeshPanel();
    _ensureTabBar();
  }

  window.loadDiagnosticsPanel = function(initialTab) {
    _activeTab = initialTab || 'health';
    _renderDiag();
  };
})();
