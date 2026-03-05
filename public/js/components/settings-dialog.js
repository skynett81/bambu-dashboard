// Settings - Tabbed layout with printer management, auth, notifications, system
(function() {
  window.loadSettingsPanel = loadSettings;

  // Ensure modal CSS exists (guards against stale SW cache)
  if (!document.getElementById('modal-css-inject')) {
    const style = document.createElement('style');
    style.id = 'modal-css-inject';
    style.textContent = `.modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:1000;display:flex;align-items:center;justify-content:center}.modal-content{background:var(--bg-card,#1a1f3c);border-radius:10px;border:1px solid var(--border-color,#2a2f4a);width:90%;max-width:500px;max-height:85vh;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 8px 32px rgba(0,0,0,0.3)}.modal-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border-color,#2a2f4a)}.modal-header h3{margin:0;font-size:0.9rem;font-weight:600;color:var(--text-primary,#e8ecf1)}.modal-close{background:none;border:none;color:var(--text-muted,#8892b0);font-size:1.4rem;cursor:pointer;line-height:1;padding:0;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:4px}.modal-close:hover{color:var(--text-primary,#e8ecf1);background:var(--bg-tertiary,#252a4a)}.modal-body{padding:16px;overflow-y:auto;flex:1}.modal-footer{padding:12px 16px;border-top:1px solid var(--border-color,#2a2f4a);display:flex;justify-content:flex-end;gap:0.5rem}`;
    document.head.appendChild(style);
  }

  function _esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  let _activeTab = 'printers';
  let _printerSubTab = 'list';
  let _generalSubTab = 'preferences';
  let _appearanceSubTab = 'theme';
  let _systemSubTab = 'updates';
  let _notifSubTab = 'channels';

  async function loadSettings() {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;

    // Read sub-slug from hash (e.g. #settings/notifications or #settings/system/security)
    const hashParts = location.hash.replace('#', '').split('/');
    const hashSub = hashParts[1];
    if (hashSub && ['printers','general','appearance','notifications','system'].includes(hashSub)) _activeTab = hashSub;
    if (hashParts[2]) {
      if (_activeTab === 'printers' && ['list','status'].includes(hashParts[2])) _printerSubTab = hashParts[2];
      if (_activeTab === 'general' && ['preferences','auth','obs'].includes(hashParts[2])) _generalSubTab = hashParts[2];
      if (_activeTab === 'appearance' && ['theme','customize'].includes(hashParts[2])) _appearanceSubTab = hashParts[2];
      if (_activeTab === 'system' && ['updates','security','printers','automation','integrations','data'].includes(hashParts[2])) _systemSubTab = hashParts[2];
      if (_activeTab === 'notifications' && ['channels','log','webhooks'].includes(hashParts[2])) _notifSubTab = hashParts[2];
    }

    try {
      const res = await fetch('/api/printers');
      const printers = await res.json();

      // Tab bar
      let html = `
        <div class="settings-tabs">
          <button class="settings-tab ${_activeTab === 'printers' ? 'active' : ''}" onclick="switchSettingsTab('printers')">${t('settings.tab_printers')}</button>
          <button class="settings-tab ${_activeTab === 'general' ? 'active' : ''}" onclick="switchSettingsTab('general')">${t('settings.tab_general')}</button>
          <button class="settings-tab ${_activeTab === 'appearance' ? 'active' : ''}" onclick="switchSettingsTab('appearance')">${t('settings.tab_appearance')}</button>
          <button class="settings-tab ${_activeTab === 'notifications' ? 'active' : ''}" onclick="switchSettingsTab('notifications')">${t('settings.tab_notifications')}</button>
          <button class="settings-tab ${_activeTab === 'system' ? 'active' : ''}" onclick="switchSettingsTab('system')">${t('settings.tab_system')}</button>
        </div>`;

      // ======== TAB: Printers (sub-tabs) ========
      html += `<div class="settings-tab-content ${_activeTab === 'printers' ? 'active' : ''}" id="tab-printers">`;
      {
        const ptabs = [
          { id: 'list', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>', label: t('settings.settings_sub_printer_list') },
          { id: 'status', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>', label: t('settings.settings_sub_printer_status') }
        ];
        html += '<div class="drying-sub-tabs">';
        for (const tab of ptabs) html += `<button class="drying-sub-tab${_printerSubTab === tab.id ? ' active' : ''}" data-printer-tab="${tab.id}" onclick="window._switchPrinterSubTab('${tab.id}')" style="display:flex;align-items:center;gap:4px">${tab.icon} ${tab.label}</button>`;
        html += '</div>';
        html += '<div id="printer-sub-content"></div>';
      }
      html += '</div>'; // end tab-printers

      // ======== TAB: General (sub-tabs) ========
      html += `<div class="settings-tab-content ${_activeTab === 'general' ? 'active' : ''}" id="tab-general">`;
      {
        const gtabs = [
          { id: 'preferences', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>', label: t('settings.settings_sub_preferences') },
          { id: 'auth', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>', label: t('settings.settings_sub_auth') },
          { id: 'obs', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>', label: t('settings.settings_sub_obs') }
        ];
        html += '<div class="drying-sub-tabs">';
        for (const tab of gtabs) html += `<button class="drying-sub-tab${_generalSubTab === tab.id ? ' active' : ''}" data-general-tab="${tab.id}" onclick="window._switchGeneralSubTab('${tab.id}')" style="display:flex;align-items:center;gap:4px">${tab.icon} ${tab.label}</button>`;
        html += '</div>';
        html += '<div id="general-sub-content"></div>';
      }
      html += '</div>'; // end tab-general

      // ======== TAB: Appearance (sub-tabs) ========
      html += `<div class="settings-tab-content ${_activeTab === 'appearance' ? 'active' : ''}" id="tab-appearance">`;
      {
        const atabs = [
          { id: 'theme', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>', label: t('settings.settings_sub_theme') },
          { id: 'customize', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>', label: t('settings.settings_sub_customize') }
        ];
        html += '<div class="drying-sub-tabs">';
        for (const tab of atabs) html += `<button class="drying-sub-tab${_appearanceSubTab === tab.id ? ' active' : ''}" data-appearance-tab="${tab.id}" onclick="window._switchAppearanceSubTab('${tab.id}')" style="display:flex;align-items:center;gap:4px">${tab.icon} ${tab.label}</button>`;
        html += '</div>';
        html += '<div id="appearance-sub-content"></div>';
      }
      html += '</div>'; // end tab-appearance

      // ======== TAB: Notifications (sub-tabs) ========
      html += `<div class="settings-tab-content ${_activeTab === 'notifications' ? 'active' : ''}" id="tab-notifications">`;
      {
        const ntabs = [
          { id: 'channels', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>', label: t('settings.settings_sub_channels') },
          { id: 'log', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>', label: t('settings.settings_sub_log') },
          { id: 'webhooks', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>', label: t('settings.settings_sub_webhooks') }
        ];
        html += '<div class="drying-sub-tabs">';
        for (const tab of ntabs) html += `<button class="drying-sub-tab${_notifSubTab === tab.id ? ' active' : ''}" data-notif-tab="${tab.id}" onclick="window._switchNotifSubTab('${tab.id}')" style="display:flex;align-items:center;gap:4px">${tab.icon} ${tab.label}</button>`;
        html += '</div>';
        html += '<div id="notif-sub-content"></div>';
      }
      html += '</div>'; // end tab-notifications

      // ======== TAB: System (sub-tabs) ========
      html += `<div class="settings-tab-content ${_activeTab === 'system' ? 'active' : ''}" id="tab-system">`;
      {
        const stabs = [
          { id: 'updates', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>', label: t('settings.settings_sub_updates') },
          { id: 'security', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>', label: t('settings.settings_sub_security'), admin: true },
          { id: 'printers', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>', label: t('settings.settings_sub_printers') },
          { id: 'automation', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>', label: t('settings.settings_sub_automation') },
          { id: 'integrations', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>', label: t('settings.settings_sub_integrations') },
          { id: 'data', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>', label: t('settings.settings_sub_data') }
        ];
        html += '<div class="drying-sub-tabs">';
        for (const tab of stabs) {
          if (tab.admin && !(window._can && window._can('admin'))) continue;
          html += `<button class="drying-sub-tab${_systemSubTab === tab.id ? ' active' : ''}" data-system-tab="${tab.id}" onclick="window._switchSystemSubTab('${tab.id}')" style="display:flex;align-items:center;gap:4px">${tab.icon} ${tab.label}</button>`;
        }
        html += '</div>';
        html += '<div id="system-sub-content"></div>';
      }
      html += '</div>'; // end tab-system

      panel.innerHTML = html;

      // Post-render: lazy-load all sub-tabbed sections
      _renderPrinterSubContent(printers);
      _renderGeneralSubContent(printers);
      _renderAppearanceSubContent();
      _renderNotifSubContent();
      _renderSystemSubContent();
    } catch (e) {
      panel.innerHTML = `<p class="text-muted">${t('settings.load_failed')}</p>`;
    }
  }

  window.switchSettingsTab = function(tab) {
    _activeTab = tab;
    const slug = tab === 'printers' ? 'settings' : `settings/${tab}`;
    if (location.hash !== '#' + slug) history.replaceState(null, '', '#' + slug);
    document.querySelectorAll('.settings-tab').forEach(el => {
      el.classList.toggle('active', el.textContent.trim() === document.querySelector(`.settings-tab[onclick*="'${tab}'"]`)?.textContent.trim());
    });
    document.querySelectorAll('.settings-tab-content').forEach(el => {
      const isTarget = el.id === 'tab-' + tab;
      el.classList.toggle('active', isTarget);
      if (isTarget) {
        el.classList.add('ix-tab-panel');
        el.addEventListener('animationend', () => el.classList.remove('ix-tab-panel'), { once: true });
      }
    });
    // Re-match tab buttons
    document.querySelectorAll('.settings-tab').forEach(el => {
      const match = el.getAttribute('onclick')?.match(/switchSettingsTab\('(\w+)'\)/);
      if (match) el.classList.toggle('active', match[1] === tab);
    });
  };

  // ═══ Printers sub-tabs ═══
  let _cachedPrinters = [];
  window._switchPrinterSubTab = function(tab) {
    _printerSubTab = tab;
    const slug = `settings/printers/${tab}`;
    if (location.hash !== '#' + slug) history.replaceState(null, '', '#' + slug);
    document.querySelectorAll('[data-printer-tab]').forEach(b => b.classList.toggle('active', b.dataset.printerTab === tab));
    _renderPrinterSubContent(_cachedPrinters);
  };

  function _renderPrinterSubContent(printers) {
    if (printers && printers.length) _cachedPrinters = printers;
    const p = _cachedPrinters;
    const el = document.getElementById('printer-sub-content');
    if (!el) return;

    if (_printerSubTab === 'list') {
      let h = '';
      // Bambu Lab Cloud section
      h += `<div id="cloud-section" class="settings-card" style="margin-bottom:0.75rem"><div class="card-title" style="display:flex;align-items:center;gap:6px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg> ${t('settings.bambu_cloud')}</div><div id="cloud-content"><span class="text-muted" style="font-size:0.8rem">...</span></div></div>`;
      // Discovery + Add buttons
      h += `<div style="display:flex;gap:0.5rem;align-items:center;margin-bottom:0.75rem;flex-wrap:wrap">
        <button class="form-btn" data-ripple onclick="discoverPrinters()" id="discover-btn" style="display:flex;align-items:center;gap:6px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
          ${t('settings.discover_printers')}
        </button>
        <button class="form-btn" data-ripple onclick="showAddPrinterForm()" style="display:flex;align-items:center;gap:6px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          ${t('settings.add_printer')}
        </button>
      </div>`;
      h += '<div id="discovery-results"></div>';
      h += '<div class="printer-list-grid">';
      for (const pr of p) {
        h += `<div class="printer-config-card"><div class="printer-config-header"><div><strong>${pr.name}</strong><div class="text-muted" style="font-size:0.75rem">${pr.model || ''} ${pr.ip && pr.serial && pr.accessCode ? '| ' + pr.ip + ' | ' + t('settings.auto_connect') : '| ' + t('settings.add_details')}</div></div><div class="printer-config-actions"><button class="form-btn form-btn-sm" data-ripple data-tooltip="${t('settings.edit')}" onclick="editPrinter('${pr.id}')">${t('settings.edit')}</button><button class="form-btn form-btn-sm form-btn-danger" data-ripple data-tooltip="${t('settings.delete')}" onclick="removePrinter('${pr.id}')">${t('settings.delete')}</button></div></div></div>`;
      }
      h += '</div>';
      h += '<div id="printer-form-area"></div>';
      el.innerHTML = h;
      // Load cloud status async
      _loadCloudStatus();
    } else if (_printerSubTab === 'status') {
      el.innerHTML = `<div class="settings-card"><div class="card-title">${t('printer_info.title')}</div><div id="settings-printer-info"><span class="text-muted" style="font-size:0.8rem">${t('printer_info.waiting')}</span></div></div>`;
      const printerInfoEl = document.getElementById('settings-printer-info');
      if (printerInfoEl && typeof renderPrinterInfoSection === 'function') renderPrinterInfoSection(printerInfoEl);
    }
  }

  // ═══ Appearance sub-tabs ═══
  window._switchAppearanceSubTab = function(tab) {
    _appearanceSubTab = tab;
    const slug = `settings/appearance/${tab}`;
    if (location.hash !== '#' + slug) history.replaceState(null, '', '#' + slug);
    document.querySelectorAll('[data-appearance-tab]').forEach(b => b.classList.toggle('active', b.dataset.appearanceTab === tab));
    _renderAppearanceSubContent();
  };

  function _renderAppearanceSubContent() {
    const el = document.getElementById('appearance-sub-content');
    if (!el) return;

    const cfg = window.theme ? window.theme.get() : { preset: 'light', accentColor: null, radius: 12 };
    const currentAccent = cfg.accentColor || (window.theme ? window.theme.getDefaultAccent() : '#00AE42');
    const currentRadius = cfg.radius ?? 12;

    if (_appearanceSubTab === 'theme') {
      let h = `<div class="settings-card"><div class="card-title">${t('settings.theme_title')}</div><div class="theme-preset-grid">`;
      h += `<button class="theme-preset-card ${cfg.preset === 'light' ? 'active' : ''}" onclick="setThemePreset('light')"><div class="theme-preset-preview theme-preview-light"><div class="tpp-sidebar"></div><div class="tpp-main"><div class="tpp-card"></div><div class="tpp-card"></div></div></div><span>${t('settings.theme_light')}</span></button>`;
      h += `<button class="theme-preset-card ${cfg.preset === 'dark' ? 'active' : ''}" onclick="setThemePreset('dark')"><div class="theme-preset-preview theme-preview-dark"><div class="tpp-sidebar"></div><div class="tpp-main"><div class="tpp-card"></div><div class="tpp-card"></div></div></div><span>${t('settings.theme_dark')}</span></button>`;
      h += `<button class="theme-preset-card ${cfg.preset === 'auto' ? 'active' : ''}" onclick="setThemePreset('auto')"><div class="theme-preset-preview theme-preview-auto"><div class="tpp-half-light"></div><div class="tpp-half-dark"></div></div><span>${t('settings.theme_auto')}</span></button>`;
      h += '</div></div>';
      h += `<div class="mt-md"><button class="form-btn form-btn-secondary" data-ripple onclick="resetTheme()">${t('settings.theme_reset')}</button></div>`;
      el.innerHTML = h;
    } else if (_appearanceSubTab === 'customize') {
      let h = `<div class="settings-card"><div class="card-title">${t('settings.theme_accent')}</div><div class="theme-color-row">`;
      for (const s of ACCENT_SWATCHES) {
        const isActive = currentAccent.toLowerCase() === s.color.toLowerCase();
        h += `<button class="theme-color-swatch ${isActive ? 'active' : ''}" style="background:${s.color}" onclick="setThemeAccent('${s.color}')" title="${s.label}"></button>`;
      }
      h += `<label class="theme-color-custom" title="${t('settings.theme_accent')}"><input type="color" id="theme-accent-picker" value="${currentAccent}" onchange="setThemeAccent(this.value)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></label></div>`;
      if (cfg.accentColor) h += `<button class="form-btn form-btn-sm form-btn-secondary mt-sm" data-ripple onclick="setThemeAccent(null)">${t('settings.theme_accent_reset')}</button>`;
      h += '</div>';
      h += `<div class="settings-card mt-md"><div class="card-title">${t('settings.theme_radius')}</div><div class="theme-radius-row"><span class="text-muted" style="font-size:0.8rem">${t('settings.theme_radius_sharp')}</span><input type="range" class="theme-radius-slider" id="theme-radius-slider" min="0" max="20" step="1" value="${currentRadius}" oninput="setThemeRadius(this.value)"><span class="text-muted" style="font-size:0.8rem">${t('settings.theme_radius_round')}</span><span class="theme-radius-value" id="theme-radius-value">${currentRadius}px</span></div></div>`;
      el.innerHTML = h;
    }
  }

  // ═══ General sub-tabs ═══
  window._switchGeneralSubTab = function(tab) {
    _generalSubTab = tab;
    const slug = `settings/general/${tab}`;
    if (location.hash !== '#' + slug) history.replaceState(null, '', '#' + slug);
    document.querySelectorAll('[data-general-tab]').forEach(b => b.classList.toggle('active', b.dataset.generalTab === tab));
    _renderGeneralSubContent(_cachedPrinters);
  };

  function _renderGeneralSubContent(printers) {
    if (printers && printers.length) _cachedPrinters = printers;
    const p = _cachedPrinters;
    const el = document.getElementById('general-sub-content');
    if (!el) return;

    if (_generalSubTab === 'preferences') {
      const locales = window.i18n.getSupportedLocales();
      const names = window.i18n.getLocaleNames();
      const current = window.i18n.getLocale();
      let opts = '';
      for (const loc of locales) opts += `<option value="${loc}" ${loc === current ? 'selected' : ''}>${names[loc]}</option>`;
      let h = '<div class="settings-grid"><div>';
      h += `<div class="settings-card"><div class="card-title">${t('settings.language')}</div><select class="form-input" id="lang-select" onchange="changeLanguage(this.value)">${opts}</select></div>`;
      h += `<div class="settings-card mt-md"><div class="card-title">${t('settings.notifications_title')}</div><label class="settings-checkbox"><input type="checkbox" id="notify-toggle" ${typeof Notification !== 'undefined' && Notification.permission === 'granted' ? 'checked' : ''} onchange="toggleNotificationsPerm(this.checked)"><span>${t('settings.notifications_browser')}</span></label></div>`;
      h += `<div class="settings-card mt-md"><div class="card-title">${t('settings.server_title')}</div><div class="text-muted" style="font-size:0.8rem">Port: ${location.port || '3000'} | ${t('settings.printers_title')}: ${p.length}</div></div>`;
      h += '</div></div>';
      el.innerHTML = h;

    } else if (_generalSubTab === 'auth') {
      el.innerHTML = '<div id="auth-settings-section"><div class="settings-card"><div class="text-muted" style="font-size:0.8rem">Loading...</div></div></div>';
      loadAuthSettings();

    } else if (_generalSubTab === 'obs') {
      el.innerHTML = `<div class="settings-card"><div class="card-title">${t('settings.obs_title')}</div><p class="text-muted" style="font-size:0.8rem;margin-bottom:8px">${t('settings.obs_description')}</p><div style="display:flex;gap:8px;align-items:center"><input class="form-input" id="obs-url-display" readonly value="${location.origin}/obs.html" style="flex:1;font-size:0.8rem"><button class="form-btn form-btn-sm" data-ripple onclick="copyObsUrl()">${t('camera.copy')}</button></div><p class="text-muted" style="font-size:0.75rem;margin-top:6px">${t('settings.obs_params')}</p></div>`;
    }
  }

  // ═══ Notifications sub-tabs ═══
  window._switchNotifSubTab = function(tab) {
    _notifSubTab = tab;
    const slug = `settings/notifications/${tab}`;
    if (location.hash !== '#' + slug) history.replaceState(null, '', '#' + slug);
    document.querySelectorAll('[data-notif-tab]').forEach(b => b.classList.toggle('active', b.dataset.notifTab === tab));
    _renderNotifSubContent();
  };

  function _renderNotifSubContent() {
    const el = document.getElementById('notif-sub-content');
    if (!el) return;
    if (_notifSubTab === 'channels') {
      el.innerHTML = `<div id="notif-server-section"><div class="text-muted" style="font-size:0.8rem">Loading...</div></div>`;
      loadNotifSettings();
    } else if (_notifSubTab === 'log') {
      el.innerHTML = `<div class="settings-card"><div class="card-title">${t('settings.notif_log_title')}</div><div id="notif-log-section"><div class="text-muted" style="font-size:0.8rem">Loading...</div></div></div>`;
      loadNotifLog();
    } else if (_notifSubTab === 'webhooks') {
      el.innerHTML = `<div class="settings-card"><div class="card-title">${t('settings.webhooks_title')}</div><p class="text-muted" style="font-size:0.85rem;margin-bottom:0.5rem">${t('settings.webhooks_desc')}</p><div id="webhooks-section"><div class="text-muted" style="font-size:0.8rem">Loading...</div></div><button class="form-btn form-btn-primary mt-sm" data-ripple onclick="showWebhookEditor()">${t('settings.webhook_add')}</button></div>`;
      loadWebhooks();
    }
  }

  // ═══ System sub-tabs ═══
  window._switchSystemSubTab = function(tab) {
    _systemSubTab = tab;
    const slug = `settings/system/${tab}`;
    if (location.hash !== '#' + slug) history.replaceState(null, '', '#' + slug);
    document.querySelectorAll('[data-system-tab]').forEach(b => b.classList.toggle('active', b.dataset.systemTab === tab));
    _renderSystemSubContent();
  };

  function _renderSystemSubContent() {
    const el = document.getElementById('system-sub-content');
    if (!el) return;

    if (_systemSubTab === 'updates') {
      el.innerHTML = `<div class="settings-grid"><div class="settings-card"><div class="card-title">${t('update.title')}</div><div id="update-section"><div class="text-muted" style="font-size:0.8rem">Loading...</div></div></div><div id="demo-data-section" style="display:none"></div></div>`;
      const updateSection = document.getElementById('update-section');
      if (updateSection && typeof renderUpdateSection === 'function') renderUpdateSection(updateSection);
      checkDemoData();

    } else if (_systemSubTab === 'security') {
      let h = '<div class="settings-grid">';
      h += `<div class="settings-card"><div class="card-title">${t('settings.users_title')}</div><p class="text-muted" style="font-size:0.85rem;margin-bottom:0.5rem">${t('settings.users_desc')}</p><div id="users-section"><div class="text-muted" style="font-size:0.8rem">Loading...</div></div><button class="form-btn form-btn-primary mt-sm" data-ripple onclick="showUserEditor()">${t('settings.user_add')}</button></div>`;
      h += `<div class="settings-card"><div class="card-title">${t('settings.api_keys_title')}</div><p class="text-muted" style="font-size:0.85rem;margin-bottom:0.5rem">${t('settings.api_keys_desc')}</p><div id="api-keys-section"><div class="text-muted" style="font-size:0.8rem">Loading...</div></div><button class="form-btn form-btn-primary mt-sm" data-ripple onclick="showApiKeyEditor()">${t('settings.api_key_add')}</button></div>`;
      h += `<div class="settings-card"><div class="card-title">${t('settings.push_title')}</div><p class="text-muted" style="font-size:0.85rem;margin-bottom:0.5rem">${t('settings.push_desc')}</p><div style="display:flex;gap:0.5rem;flex-wrap:wrap"><button class="form-btn form-btn-primary" data-ripple onclick="subscribePush()">${t('settings.push_enable')}</button><button class="form-btn" data-ripple onclick="unsubscribePush()">${t('settings.push_disable')}</button></div></div>`;
      h += '</div>';
      el.innerHTML = h;
      if (window._can && window._can('admin')) { loadUsers(); loadApiKeys(); }

    } else if (_systemSubTab === 'printers') {
      let h = '<div class="settings-grid">';
      h += `<div class="settings-card"><div class="card-title">${t('settings.printer_groups_title')}</div><p class="text-muted" style="font-size:0.85rem;margin-bottom:0.5rem">${t('settings.printer_groups_desc')}</p><div id="printer-groups-section"><div class="text-muted" style="font-size:0.8rem">Loading...</div></div><button class="form-btn form-btn-primary mt-sm" data-ripple onclick="showPrinterGroupEditor()">${t('settings.printer_groups_add')}</button></div>`;
      h += `<div class="settings-card"><div class="card-title">${t('settings.hub_title')}</div><p class="text-muted" style="font-size:0.85rem;margin-bottom:0.5rem">${t('settings.hub_desc')}</p><div id="hub-settings-section"><label class="form-checkbox-label" style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem"><input type="checkbox" id="hub-mode" onchange="toggleHubMode(this.checked)"><span>${t('settings.hub_enable')}</span></label><label class="form-checkbox-label" style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem"><input type="checkbox" id="kiosk-mode" onchange="toggleKioskMode(this.checked)"><span>${t('settings.kiosk_enable')}</span></label></div></div>`;
      h += '</div>';
      el.innerHTML = h;
      loadPrinterGroupsSettings();
      loadHubSettings();

    } else if (_systemSubTab === 'automation') {
      let h = '<div class="settings-grid">';
      h += `<div class="settings-card"><div class="card-title">${t('settings.ai_detection_title')}</div><p class="text-muted" style="font-size:0.85rem;margin-bottom:0.5rem">${t('settings.ai_detection_desc')}</p><div id="ai-detection-section"><label class="form-checkbox-label" style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem"><input type="checkbox" id="ai-detection-enabled" onchange="toggleAiDetection(this.checked)"><span>${t('settings.ai_detection_enable')}</span></label><div style="margin-top:0.5rem;display:flex;align-items:center;gap:0.5rem"><label style="font-size:0.85rem">${t('settings.ai_detection_sensitivity')}</label><select class="form-input" id="ai-detection-sensitivity" onchange="updateAiSensitivity(this.value)" style="width:auto"><option value="low">${t('settings.sensitivity_low')}</option><option value="medium">${t('settings.sensitivity_medium')}</option><option value="high">${t('settings.sensitivity_high')}</option></select></div><div id="ai-detection-list" style="margin-top:0.5rem"></div></div></div>`;
      h += `<div class="settings-card"><div class="card-title">${t('settings.timelapse_title')}</div><p class="text-muted" style="font-size:0.85rem;margin-bottom:0.5rem">${t('settings.timelapse_desc')}</p><div id="timelapse-settings-section"><label class="form-checkbox-label" style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem"><input type="checkbox" id="timelapse-enabled" onchange="toggleTimelapse(this.checked)"><span>${t('settings.timelapse_enable')}</span></label><div id="timelapse-list" style="margin-top:0.5rem"></div></div></div>`;
      h += '</div>';
      el.innerHTML = h;
      loadAiDetectionSettings();
      loadTimelapseSettings();

    } else if (_systemSubTab === 'integrations') {
      let h = '<div class="settings-grid">';
      h += `<div class="settings-card" id="ecom-premium-card"><div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.25rem"><span class="premium-badge" id="ecom-premium-badge">${t('settings.ecom_premium')}</span><div class="card-title">${t('settings.ecom_title')}</div></div><p class="text-muted" style="font-size:0.85rem;margin-bottom:0.5rem">${t('settings.ecom_desc')}</p><div id="ecom-license-area"><div class="text-muted" style="font-size:0.8rem">${t('settings.ecom_license_checking')}</div></div><div id="ecom-section" style="display:none"><div class="text-muted" style="font-size:0.8rem">Loading...</div></div><button class="form-btn form-btn-primary mt-sm" id="ecom-add-btn" style="display:none" data-ripple onclick="showEcomEditor()">${t('settings.ecom_add')}</button></div>`;
      h += '</div>';
      el.innerHTML = h;
      loadEcomLicenseStatus();

    } else if (_systemSubTab === 'data') {
      let h = '<div class="settings-grid">';
      h += `<div class="settings-card"><div class="card-title">${t('settings.custom_fields_title')}</div><p class="text-muted" style="font-size:0.85rem;margin-bottom:0.5rem">${t('settings.custom_fields_desc')}</p><div id="custom-fields-section"><div class="text-muted" style="font-size:0.8rem">Loading...</div></div><button class="form-btn form-btn-primary mt-sm" data-ripple onclick="showCustomFieldEditor()">${t('settings.custom_fields_add')}</button></div>`;
      h += `<div class="settings-card"><div class="card-title">${t('settings.brand_defaults_title')}</div><p class="text-muted" style="font-size:0.85rem;margin-bottom:0.5rem">${t('settings.brand_defaults_desc')}</p><div id="brand-defaults-section"><div class="text-muted" style="font-size:0.8rem">Loading...</div></div><button class="form-btn form-btn-primary mt-sm" data-ripple onclick="showBrandDefaultEditor()">${t('settings.brand_defaults_add')}</button></div>`;
      h += `<div class="settings-card" style="cursor:pointer" onclick="openPanel('learning')"><div class="card-title">${t('settings.courses_title')}</div><p class="text-muted" style="font-size:0.85rem">${t('settings.courses_desc')}</p><button class="form-btn form-btn-sm mt-sm" data-ripple onclick="openPanel('learning')">${t('learning.go_to')} \u2192</button></div>`;
      h += '</div>';
      el.innerHTML = h;
      loadCustomFieldsSettings();
      loadBrandDefaultsSettings();
    }
  }

  function renderPrinterForm(target, printer = null) {
    const isEdit = !!printer;
    const title = isEdit ? t('settings.edit_printer') : t('settings.add_printer_title');

    target.innerHTML = `
      <div class="settings-form mt-md">
        <div class="card-title">${title}</div>
        <div class="form-group">
          <label class="form-label">${t('settings.name')}</label>
          <input class="form-input" id="pf-name" value="${printer?.name || ''}" placeholder="${t('settings.name_placeholder')}">
        </div>
        <div class="form-group">
          <label class="form-label">${t('settings.model')}</label>
          <select class="form-input" id="pf-model">
            <option value="">${t('settings.model_placeholder')}</option>
            ${(typeof getKnownModels === 'function' ? getKnownModels() : []).map(m =>
              `<option value="${m}" ${printer?.model === m ? 'selected' : ''}>${m}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">${t('settings.ip')}</label>
          <input class="form-input" id="pf-ip" value="${printer?.ip || ''}" placeholder="${t('settings.ip_placeholder')}">
        </div>
        <div class="form-group">
          <label class="form-label">${t('settings.serial')}</label>
          <input class="form-input" id="pf-serial" value="${printer?.serial || ''}" placeholder="${t('settings.serial_placeholder')}">
        </div>
        <div class="form-group">
          <label class="form-label">${t('settings.access_code')}</label>
          <input class="form-input" id="pf-access" value="" placeholder="${t('settings.access_code_hint')}">
        </div>
        <details style="margin-top:8px;border-top:1px solid var(--border-color);padding-top:8px">
          <summary style="cursor:pointer;font-size:0.8rem;font-weight:600">${t('settings.per_printer_cost_title')}</summary>
          <p class="text-muted" style="font-size:0.7rem;margin:4px 0">${t('settings.per_printer_cost_hint')}</p>
          <div class="flex gap-sm" style="flex-wrap:wrap">
            <div class="form-group" style="width:110px">
              <label class="form-label">${t('settings.printer_wattage')}</label>
              <input class="form-input" id="pf-wattage" type="number" value="${printer?.printer_wattage || ''}" placeholder="--">
            </div>
            <div class="form-group" style="width:110px">
              <label class="form-label">${t('settings.printer_electricity_rate')}</label>
              <input class="form-input" id="pf-elec-rate" type="number" step="0.01" value="${printer?.electricity_rate_kwh || ''}" placeholder="--">
            </div>
            <div class="form-group" style="width:110px">
              <label class="form-label">${t('settings.printer_machine_cost')}</label>
              <input class="form-input" id="pf-machine-cost" type="number" step="0.01" value="${printer?.machine_cost || ''}" placeholder="--">
            </div>
            <div class="form-group" style="width:110px">
              <label class="form-label">${t('settings.printer_machine_lifetime')}</label>
              <input class="form-input" id="pf-machine-lifetime" type="number" value="${printer?.machine_lifetime_hours || ''}" placeholder="--">
            </div>
          </div>
        </details>
        <div class="form-actions">
          <button class="form-btn" data-ripple onclick="savePrinterForm('${printer?.id || ''}')">${t('settings.save')}</button>
          <button class="form-btn form-btn-secondary" data-ripple onclick="testPrinterConnection()">${t('settings.test_connection')}</button>
          <button class="form-btn form-btn-secondary" data-ripple onclick="cancelPrinterForm()">${t('settings.cancel')}</button>
        </div>
        <div id="test-connection-result" style="margin-top:0.5rem"></div>
        <p class="text-muted mt-sm" style="font-size:0.75rem">${t('settings.auto_connect_hint')}</p>
      </div>`;
  }

  window.showAddPrinterForm = function() {
    const area = document.getElementById('printer-form-area');
    if (area) renderPrinterForm(area);
  };

  window.editPrinter = async function(id) {
    try {
      const res = await fetch('/api/printers');
      const printers = await res.json();
      const printer = printers.find(p => p.id === id);
      if (!printer) return;
      const area = document.getElementById('printer-form-area');
      if (area) renderPrinterForm(area, printer);
    } catch (e) { /* ignore */ }
  };

  window.savePrinterForm = async function(existingId) {
    const name = document.getElementById('pf-name')?.value.trim();
    const model = document.getElementById('pf-model')?.value.trim();
    const ip = document.getElementById('pf-ip')?.value.trim();
    const serial = document.getElementById('pf-serial')?.value.trim();

    if (!name) { showToast(t('settings.name_required'), 'warning'); return; }

    const accessCode = document.getElementById('pf-access')?.value.trim();
    const wattage = document.getElementById('pf-wattage')?.value;
    const elecRate = document.getElementById('pf-elec-rate')?.value;
    const machCost = document.getElementById('pf-machine-cost')?.value;
    const machLife = document.getElementById('pf-machine-lifetime')?.value;
    const body = { name, model, ip, serial, accessCode,
      printer_wattage: wattage ? parseFloat(wattage) : null,
      electricity_rate_kwh: elecRate ? parseFloat(elecRate) : null,
      machine_cost: machCost ? parseFloat(machCost) : null,
      machine_lifetime_hours: machLife ? parseFloat(machLife) : null
    };

    try {
      if (existingId) {
        await fetch(`/api/printers/${existingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      } else {
        body.id = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        await fetch('/api/printers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      }
      loadSettings();
    } catch (e) {
      showToast(t('settings.save_failed'), 'error');
    }
  };

  window.cancelPrinterForm = function() {
    const area = document.getElementById('printer-form-area');
    if (area) area.innerHTML = '';
  };

  window.removePrinter = async function(id) {
    return confirmAction(t('settings.confirm_delete'), async () => {
      try {
        await fetch(`/api/printers/${id}`, { method: 'DELETE' });
        loadSettings();
      } catch (e) { /* ignore */ }
    }, { danger: true });
  };

  // ═══ Printer Discovery ═══
  window.discoverPrinters = async function() {
    const btn = document.getElementById('discover-btn');
    const results = document.getElementById('discovery-results');
    if (!btn || !results) return;

    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-sm"></span> ${t('settings.discovering')}`;
    results.innerHTML = '';

    try {
      const res = await fetch('/api/discovery/scan');
      const data = await res.json();

      if (!data.printers || data.printers.length === 0) {
        results.innerHTML = `<div class="settings-card" style="margin-bottom:0.75rem"><p class="text-muted" style="margin:0;font-size:0.85rem">${t('settings.discovery_none')}</p></div>`;
      } else {
        let h = `<div class="settings-card" style="margin-bottom:0.75rem"><div class="card-title">${t('settings.discovery_found').replace('{count}', data.printers.length)}</div>`;
        for (const p of data.printers) {
          const signalBar = p.signal != null ? `<span class="text-muted" style="font-size:0.75rem">${t('settings.discovery_signal')}: ${p.signal}%</span>` : '';
          h += `<div class="printer-config-card" style="margin-bottom:0.5rem"><div class="printer-config-header"><div>`;
          h += `<strong>${_esc(p.name)}</strong>`;
          h += `<div class="text-muted" style="font-size:0.75rem">${_esc(p.model)} | ${_esc(p.ip)} | ${_esc(p.serial)} ${signalBar}</div>`;
          h += `</div><div class="printer-config-actions">`;
          if (p.alreadyAdded) {
            h += `<span class="badge badge-muted" style="font-size:0.7rem">${t('settings.discovery_already_added')}</span>`;
          } else {
            h += `<button class="form-btn form-btn-sm" data-ripple onclick="addDiscoveredPrinter(${_esc(JSON.stringify(JSON.stringify(p)))})">${t('settings.discovery_add')}</button>`;
          }
          h += '</div></div></div>';
        }
        h += '</div>';
        results.innerHTML = h;
      }
    } catch (e) {
      results.innerHTML = `<div class="settings-card" style="margin-bottom:0.75rem"><p class="text-muted" style="margin:0">${t('settings.discovery_none')}</p></div>`;
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/><line x1="2" y1="12" x2="22" y2="12"/></svg> ${t('settings.discover_printers')}`;
    }
  };

  window.addDiscoveredPrinter = function(jsonStr) {
    try {
      const p = JSON.parse(jsonStr);
      const area = document.getElementById('printer-form-area');
      if (!area) return;
      renderPrinterForm(area, { name: p.name, model: p.model, ip: p.ip, serial: p.serial });
      // Focus on access code field
      setTimeout(() => {
        const accessEl = document.getElementById('pf-access');
        if (accessEl) accessEl.focus();
      }, 100);
    } catch { /* ignore */ }
  };

  window.testPrinterConnection = async function() {
    const ip = document.getElementById('pf-ip')?.value.trim();
    const serial = document.getElementById('pf-serial')?.value.trim();
    const accessCode = document.getElementById('pf-access')?.value.trim();
    const resultEl = document.getElementById('test-connection-result');
    if (!resultEl) return;

    if (!ip || !accessCode) {
      resultEl.innerHTML = `<span style="color:var(--warning-color,#f0ad4e);font-size:0.8rem">${t('settings.discovery_enter_access')}</span>`;
      return;
    }

    resultEl.innerHTML = `<span class="text-muted" style="font-size:0.8rem"><span class="spinner-sm"></span> ${t('settings.testing_connection')}</span>`;

    try {
      const res = await fetch('/api/discovery/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, serial, accessCode })
      });
      const data = await res.json();
      if (data.ok) {
        resultEl.innerHTML = `<span style="color:var(--success-color,#28a745);font-size:0.8rem">&#10003; ${t('settings.test_success')}</span>`;
      } else {
        const err = data.error === 'timeout' ? t('settings.test_timeout') : t('settings.test_failed');
        resultEl.innerHTML = `<span style="color:var(--danger-color,#dc3545);font-size:0.8rem">&#10007; ${err}</span>`;
      }
    } catch {
      resultEl.innerHTML = `<span style="color:var(--danger-color,#dc3545);font-size:0.8rem">&#10007; ${t('settings.test_failed')}</span>`;
    }
  };

  // ═══ Bambu Lab Cloud ═══
  let _cloudEmail = '';
  let _cloudState = 'loading'; // loading, login, verify, connected

  async function _loadCloudStatus() {
    const el = document.getElementById('cloud-content');
    if (!el) return;
    try {
      const res = await fetch('/api/bambu-cloud/status');
      const data = await res.json();
      if (data.authenticated) {
        _cloudState = 'connected';
        _cloudEmail = data.email || '';
        _renderCloudConnected(el);
      } else {
        _cloudState = 'login';
        _renderCloudLoginForm(el);
      }
    } catch {
      _cloudState = 'login';
      _renderCloudLoginForm(el);
    }
  }

  function _renderCloudLoginForm(el) {
    el.innerHTML = `
      <p class="text-muted" style="font-size:0.8rem;margin:0 0 0.5rem">${t('settings.bambu_cloud_desc')}</p>
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:flex-end">
        <div class="form-group" style="margin:0;flex:1;min-width:140px">
          <input class="form-input" id="cloud-email" placeholder="${t('settings.cloud_email')}" value="${_esc(_cloudEmail)}" style="font-size:0.85rem">
        </div>
        <div class="form-group" style="margin:0;flex:1;min-width:140px">
          <input class="form-input" id="cloud-password" type="password" placeholder="${t('settings.cloud_password')}" style="font-size:0.85rem">
        </div>
        <button class="form-btn" data-ripple onclick="bambuCloudLogin()" id="cloud-login-btn" style="white-space:nowrap">${t('settings.cloud_login')}</button>
      </div>
      <div id="cloud-error" style="margin-top:0.35rem"></div>`;
  }

  function _renderCloudVerifyForm(el) {
    el.innerHTML = `
      <p style="font-size:0.85rem;margin:0 0 0.5rem;color:var(--text-primary)">${t('settings.cloud_verify_desc')}</p>
      <div style="display:flex;gap:0.5rem;align-items:flex-end">
        <div class="form-group" style="margin:0;flex:1;max-width:200px">
          <input class="form-input" id="cloud-code" placeholder="000000" maxlength="6" style="font-size:1rem;letter-spacing:0.2em;text-align:center">
        </div>
        <button class="form-btn" data-ripple onclick="bambuCloudVerify()" id="cloud-verify-btn">${t('settings.cloud_verify')}</button>
        <button class="form-btn form-btn-secondary" data-ripple onclick="_resetCloudLogin()">${t('settings.cancel')}</button>
      </div>
      <div id="cloud-error" style="margin-top:0.35rem"></div>`;
    setTimeout(() => { const c = document.getElementById('cloud-code'); if (c) c.focus(); }, 50);
  }

  function _renderCloudConnected(el) {
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap">
        <span style="font-size:0.85rem;color:var(--success-color,#28a745)">&#10003; ${t('settings.cloud_connected').replace('{email}', _esc(_cloudEmail))}</span>
        <button class="form-btn form-btn-sm" data-ripple onclick="bambuCloudGetPrinters()" id="cloud-import-btn">${t('settings.cloud_import')}</button>
        <button class="form-btn form-btn-sm form-btn-secondary" data-ripple onclick="bambuCloudLogout()">${t('settings.cloud_disconnect')}</button>
      </div>
      <div id="cloud-printer-results" style="margin-top:0.5rem"></div>`;
  }

  window._resetCloudLogin = function() {
    _cloudState = 'login';
    const el = document.getElementById('cloud-content');
    if (el) _renderCloudLoginForm(el);
  };

  window.bambuCloudLogin = async function() {
    const email = document.getElementById('cloud-email')?.value.trim();
    const password = document.getElementById('cloud-password')?.value;
    const errEl = document.getElementById('cloud-error');
    if (!email || !password) return;

    const btn = document.getElementById('cloud-login-btn');
    if (btn) { btn.disabled = true; btn.textContent = t('settings.cloud_logging_in'); }

    try {
      const res = await fetch('/api/bambu-cloud/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.needsVerification) {
        _cloudEmail = email;
        _cloudState = 'verify';
        const el = document.getElementById('cloud-content');
        if (el) _renderCloudVerifyForm(el);
      } else if (data.ok) {
        _cloudEmail = data.email || email;
        _cloudState = 'connected';
        const el = document.getElementById('cloud-content');
        if (el) _renderCloudConnected(el);
      } else {
        if (errEl) errEl.innerHTML = `<span style="color:var(--danger-color,#dc3545);font-size:0.8rem">${t('settings.cloud_login_failed')}</span>`;
        if (btn) { btn.disabled = false; btn.textContent = t('settings.cloud_login'); }
      }
    } catch {
      if (errEl) errEl.innerHTML = `<span style="color:var(--danger-color,#dc3545);font-size:0.8rem">${t('settings.cloud_login_failed')}</span>`;
      if (btn) { btn.disabled = false; btn.textContent = t('settings.cloud_login'); }
    }
  };

  window.bambuCloudVerify = async function() {
    const code = document.getElementById('cloud-code')?.value.trim();
    const errEl = document.getElementById('cloud-error');
    if (!code) return;

    const btn = document.getElementById('cloud-verify-btn');
    if (btn) { btn.disabled = true; btn.textContent = t('settings.cloud_verifying'); }

    try {
      const res = await fetch('/api/bambu-cloud/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: _cloudEmail, code })
      });
      const data = await res.json();

      if (data.ok) {
        _cloudEmail = data.email || _cloudEmail;
        _cloudState = 'connected';
        const el = document.getElementById('cloud-content');
        if (el) _renderCloudConnected(el);
      } else {
        if (errEl) errEl.innerHTML = `<span style="color:var(--danger-color,#dc3545);font-size:0.8rem">${t('settings.cloud_verify_failed')}</span>`;
        if (btn) { btn.disabled = false; btn.textContent = t('settings.cloud_verify'); }
      }
    } catch {
      if (errEl) errEl.innerHTML = `<span style="color:var(--danger-color,#dc3545);font-size:0.8rem">${t('settings.cloud_verify_failed')}</span>`;
      if (btn) { btn.disabled = false; btn.textContent = t('settings.cloud_verify'); }
    }
  };

  window.bambuCloudGetPrinters = async function() {
    const resultsEl = document.getElementById('cloud-printer-results');
    const btn = document.getElementById('cloud-import-btn');
    if (!resultsEl) return;

    if (btn) { btn.disabled = true; btn.textContent = t('settings.cloud_loading'); }
    resultsEl.innerHTML = '';

    try {
      const res = await fetch('/api/bambu-cloud/printers');
      const data = await res.json();

      if (!data.printers || data.printers.length === 0) {
        resultsEl.innerHTML = `<p class="text-muted" style="font-size:0.8rem;margin:0">${t('settings.cloud_no_printers')}</p>`;
      } else {
        let h = '';
        for (const p of data.printers) {
          const ipInfo = p.ip ? `| ${_esc(p.ip)}` : '';
          const localBadge = p.ip ? ' <span style="color:var(--success-color,#28a745);font-size:0.7rem">&#9679; LAN</span>' : '';
          h += `<div class="printer-config-card" style="margin-bottom:0.4rem"><div class="printer-config-header"><div>`;
          h += `<strong>${_esc(p.name)}</strong>`;
          h += `<div class="text-muted" style="font-size:0.75rem">${_esc(p.model)} | ${_esc(p.serial)} ${ipInfo}${localBadge}</div>`;
          h += `</div><div class="printer-config-actions">`;
          if (p.alreadyAdded) {
            h += `<span class="badge badge-muted" style="font-size:0.7rem">${t('settings.discovery_already_added')}</span>`;
          } else {
            h += `<button class="form-btn form-btn-sm" data-ripple onclick="addCloudPrinter(${_esc(JSON.stringify(JSON.stringify(p)))})">${t('settings.discovery_add')}</button>`;
          }
          h += '</div></div></div>';
        }
        resultsEl.innerHTML = h;
      }
    } catch {
      resultsEl.innerHTML = `<p class="text-muted" style="font-size:0.8rem;margin:0">${t('settings.cloud_no_printers')}</p>`;
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = t('settings.cloud_import'); }
    }
  };

  window.addCloudPrinter = async function(jsonStr) {
    try {
      const p = JSON.parse(jsonStr);
      const body = {
        id: p.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
        name: p.name,
        model: p.model,
        ip: p.ip || '',
        serial: p.serial,
        accessCode: p.accessCode
      };
      await fetch('/api/printers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      showToast(t('settings.cloud_added'), 'success');
      loadSettings();
    } catch { /* ignore */ }
  };

  window.bambuCloudLogout = async function() {
    try {
      await fetch('/api/bambu-cloud/logout', { method: 'POST' });
      _cloudState = 'login';
      _cloudEmail = '';
      const el = document.getElementById('cloud-content');
      if (el) _renderCloudLoginForm(el);
    } catch { /* ignore */ }
  };

  window.changeLanguage = function(locale) {
    window.i18n.setLocale(locale).then(() => {
      if (window._activePanel === 'settings') {
        loadSettings();
      }
    });
  };

  window.toggleNotificationsPerm = function(checked) {
    if (checked && typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  };

  async function checkDemoData() {
    const section = document.getElementById('demo-data-section');
    if (!section) return;
    try {
      const res = await fetch('/api/demo/status');
      const data = await res.json();
      if (data.hasDemo) {
        section.style.display = '';
        section.innerHTML = `
          <div class="settings-card">
            <div class="card-title">${t('settings.demo_title')}</div>
            <div class="text-muted" style="font-size:0.8rem; margin-bottom:8px;">
              ${t('settings.demo_description', { count: data.printerIds.length })}
            </div>
            <button class="form-btn form-btn-danger" data-ripple data-tooltip="${t('settings.demo_delete')}" onclick="deleteDemoData()">${t('settings.demo_delete')}</button>
          </div>`;
      }
    } catch { /* no demo data endpoint or error */ }
  }

  window.deleteDemoData = async function() {
    return confirmAction(t('settings.demo_confirm'), async () => {
      try {
        const res = await fetch('/api/demo', { method: 'DELETE' });
        const data = await res.json();
        if (data.deleted > 0) {
          if (data.printerIds && window.printerState) {
            for (const id of data.printerIds) {
              window.printerState.removePrinter(id);
            }
            if (typeof updatePrinterSelector === 'function') updatePrinterSelector();
            if (typeof updateConnectionBadge === 'function') updateConnectionBadge();
          }
          loadSettings();
        }
      } catch { /* ignore */ }
    }, { danger: true });
  };

  // ---- Authentication Settings ----

  let _authUsers = [];

  async function loadAuthSettings() {
    const section = document.getElementById('auth-settings-section');
    if (!section) return;

    try {
      const res = await fetch('/api/auth/config');
      const ac = await res.json();

      const envManaged = ac.envManaged;
      _authUsers = (ac.users || []).map(u => ({ ...u }));

      let html = `
        <div class="settings-card">
          <div class="card-title">${t('settings.auth_title')}</div>`;

      if (envManaged) {
        html += `<p class="text-muted" style="font-size:0.8rem">${t('settings.auth_env_notice')}</p>`;
      } else {
        html += `
          <p class="text-muted" style="font-size:0.8rem;margin-bottom:12px">${t('settings.auth_info')}</p>
          <label class="settings-checkbox">
            <input type="checkbox" id="auth-enabled" ${ac.enabled ? 'checked' : ''}>
            <span>${t('settings.auth_enable')}</span>
          </label>

          <div class="card-title mt-md" style="font-size:0.7rem">${t('settings.auth_users_title')}</div>
          <div id="auth-users-list"></div>
          <button class="form-btn form-btn-sm mt-sm" data-ripple onclick="addAuthUser()">${t('settings.auth_add_user')}</button>

          <div class="form-group mt-md">
            <label class="form-label">${t('settings.auth_session')}</label>
            <input class="form-input" type="number" id="auth-session-hours" value="${ac.sessionDurationHours || 24}" min="1" max="720" style="max-width:120px">
          </div>
          <div class="notif-save-row">
            <button class="form-btn" id="auth-save-btn" data-ripple onclick="saveAuthSettings()">${t('settings.auth_save')}</button>
            <span class="notif-save-status" id="auth-save-status"></span>
          </div>`;
      }

      html += '</div>';
      section.innerHTML = html;

      if (!envManaged) renderAuthUsers();
    } catch {
      section.innerHTML = '';
    }
  }

  function renderAuthUsers() {
    const list = document.getElementById('auth-users-list');
    if (!list) return;

    if (_authUsers.length === 0) {
      list.innerHTML = `<p class="text-muted" style="font-size:0.8rem">${t('settings.auth_no_users')}</p>`;
      return;
    }

    let html = '<div class="auth-users-grid">';
    for (let i = 0; i < _authUsers.length; i++) {
      const u = _authUsers[i];
      html += `
        <div class="auth-user-row">
          <input class="form-input auth-user-input" type="text" value="${(u.username || '').replace(/"/g, '&quot;')}"
                 placeholder="${t('settings.auth_username_ph')}" data-idx="${i}" data-field="username" onchange="updateAuthUser(this)">
          <input class="form-input auth-user-input" type="password" value="${u.password || ''}"
                 placeholder="${u.password === '***' ? t('settings.auth_password_unchanged') : t('settings.auth_password_ph')}"
                 data-idx="${i}" data-field="password" onchange="updateAuthUser(this)">
          <button class="form-btn form-btn-sm form-btn-danger" data-ripple data-tooltip="${t('settings.delete')}" onclick="removeAuthUser(${i})" title="${t('settings.delete')}">✕</button>
        </div>`;
    }
    html += '</div>';
    list.innerHTML = html;
  }

  window.addAuthUser = function() {
    _authUsers.push({ username: '', password: '' });
    renderAuthUsers();
    // Focus the new username field
    const inputs = document.querySelectorAll('.auth-user-row:last-child input[data-field="username"]');
    if (inputs.length) inputs[inputs.length - 1].focus();
  };

  window.updateAuthUser = function(el) {
    const idx = parseInt(el.dataset.idx);
    const field = el.dataset.field;
    if (_authUsers[idx]) _authUsers[idx][field] = el.value;
  };

  window.removeAuthUser = function(idx) {
    _authUsers.splice(idx, 1);
    renderAuthUsers();
  };

  window.saveAuthSettings = async function() {
    const btn = document.getElementById('auth-save-btn');
    const status = document.getElementById('auth-save-status');
    if (btn) { btn.disabled = true; btn.classList.add('btn-loading'); }
    if (status) { status.textContent = t('settings.auth_saving'); status.style.color = ''; }

    const body = {
      enabled: document.getElementById('auth-enabled')?.checked || false,
      users: _authUsers.filter(u => u.username && u.username.trim()),
      password: '',
      username: '',
      sessionDurationHours: parseInt(document.getElementById('auth-session-hours')?.value) || 24
    };

    try {
      const res = await fetch('/api/auth/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.ok) {
        if (status) { status.textContent = t('settings.auth_saved'); status.style.color = 'var(--accent-green)'; }
        // Reload to get fresh masked passwords
        setTimeout(() => loadAuthSettings(), 1500);
      } else {
        if (status) { status.textContent = data.error || t('settings.auth_save_failed'); status.style.color = 'var(--accent-red)'; }
      }
    } catch {
      if (status) { status.textContent = t('settings.auth_save_failed'); status.style.color = 'var(--accent-red)'; }
    }

    if (btn) { btn.disabled = false; btn.classList.remove('btn-loading'); }
    setTimeout(() => { if (status) { status.textContent = ''; status.style.color = ''; } }, 3000);
  };

  // ---- Server Notification Settings ----

  let _notifConf = null;

  async function loadNotifSettings() {
    const section = document.getElementById('notif-server-section');
    if (!section) return;

    try {
      const res = await fetch('/api/notifications/config');
      _notifConf = await res.json();
    } catch {
      section.innerHTML = '';
      return;
    }

    const nc = _notifConf;
    const channels = [
      { key: 'telegram', label: t('settings.notif_telegram'), fields: [
        { id: 'botToken', label: t('settings.notif_bot_token') },
        { id: 'chatId', label: t('settings.notif_chat_id') }
      ]},
      { key: 'discord', label: t('settings.notif_discord'), fields: [
        { id: 'webhookUrl', label: t('settings.notif_webhook_url') }
      ]},
      { key: 'email', label: t('settings.notif_email'), fields: [
        { id: 'host', label: t('settings.notif_host') },
        { id: 'port', label: t('settings.notif_port'), type: 'number' },
        { id: 'user', label: t('settings.notif_user') },
        { id: 'pass', label: t('settings.notif_pass'), type: 'password' },
        { id: 'from', label: t('settings.notif_from') },
        { id: 'to', label: t('settings.notif_to') }
      ]},
      { key: 'webhook', label: t('settings.notif_webhook'), fields: [
        { id: 'url', label: t('settings.notif_url') },
        { id: 'headers', label: t('settings.notif_headers') }
      ]},
      { key: 'ntfy', label: t('settings.notif_ntfy'), fields: [
        { id: 'serverUrl', label: t('settings.notif_server_url') },
        { id: 'topic', label: t('settings.notif_topic') },
        { id: 'token', label: t('settings.notif_token') }
      ]},
      { key: 'pushover', label: t('settings.notif_pushover'), fields: [
        { id: 'apiToken', label: t('settings.notif_api_token') },
        { id: 'userKey', label: t('settings.notif_user_key') }
      ]},
      { key: 'sms', label: t('settings.notif_sms'), fields: [
        { id: 'provider', label: t('settings.notif_sms_provider'), type: 'select', options: [{ value: 'twilio', label: 'Twilio' }, { value: 'generic', label: t('settings.notif_sms_generic') }] },
        { id: 'accountSid', label: t('settings.notif_sms_account_sid') },
        { id: 'authToken', label: t('settings.notif_sms_auth_token'), type: 'password' },
        { id: 'fromNumber', label: t('settings.notif_sms_from') },
        { id: 'toNumber', label: t('settings.notif_sms_to') },
        { id: 'gatewayUrl', label: t('settings.notif_sms_gateway_url') },
        { id: 'gatewayHeaders', label: t('settings.notif_sms_gateway_headers') }
      ]}
    ];

    const events = [
      { key: 'print_started',   label: t('settings.notif_evt_print_started') },
      { key: 'print_finished',  label: t('settings.notif_evt_print_finished') },
      { key: 'print_failed',    label: t('settings.notif_evt_print_failed') },
      { key: 'print_cancelled', label: t('settings.notif_evt_print_cancelled') },
      { key: 'printer_error',   label: t('settings.notif_evt_printer_error') },
      { key: 'maintenance_due', label: t('settings.notif_evt_maintenance_due') },
      { key: 'bed_cooled',      label: t('settings.notif_evt_bed_cooled') },
      { key: 'drying_due',      label: t('settings.notif_evt_drying_due') },
      { key: 'filament_low_stock', label: t('settings.notif_evt_low_stock') },
      { key: 'queue_item_started',  label: t('settings.notif_evt_queue_item_started') },
      { key: 'queue_item_completed', label: t('settings.notif_evt_queue_item_completed') },
      { key: 'queue_item_failed',   label: t('settings.notif_evt_queue_item_failed') },
      { key: 'queue_completed',     label: t('settings.notif_evt_queue_completed') }
    ];

    let html = `
      <div class="settings-card notif-section">
        <div class="card-title">${t('settings.notif_server_title')}</div>
        <label class="settings-checkbox">
          <input type="checkbox" id="notif-enabled" ${nc.enabled ? 'checked' : ''}>
          <span>${t('settings.notif_enable')}</span>
        </label>

        <div class="card-title mt-md" style="font-size:0.7rem">${t('settings.notif_channels')}</div>
        <div class="notif-channel-list">`;

    for (const ch of channels) {
      const chConf = nc.channels?.[ch.key] || {};
      html += `
        <div class="notif-channel" id="notif-ch-${ch.key}">
          <div class="notif-channel-header" onclick="toggleNotifChannel('${ch.key}')">
            <span class="notif-channel-arrow">&#9654;</span>
            <span class="notif-channel-name">${ch.label}</span>
            <input type="checkbox" class="notif-channel-toggle" id="notif-ch-${ch.key}-on" ${chConf.enabled ? 'checked' : ''} onclick="event.stopPropagation()">
            <button class="notif-test-btn" id="notif-test-${ch.key}" onclick="event.stopPropagation(); testNotifChannel('${ch.key}')">${t('settings.notif_test')}</button>
          </div>
          <div class="notif-channel-body">`;

      for (const f of ch.fields) {
        let val = chConf[f.id] ?? '';
        if (f.id === 'headers' && typeof val === 'object') val = JSON.stringify(val);
        html += `<div class="notif-field"><label>${f.label}</label>`;
        if (f.type === 'select' && f.options) {
          html += `<select id="notif-${ch.key}-${f.id}" class="form-input" style="height:28px;font-size:0.8rem">`;
          for (const opt of f.options) html += `<option value="${opt.value}" ${val === opt.value ? 'selected' : ''}>${opt.label}</option>`;
          html += '</select>';
        } else {
          html += `<input type="${f.type || 'text'}" id="notif-${ch.key}-${f.id}" value="${String(val).replace(/"/g, '&quot;')}" autocomplete="off">`;
        }
        html += '</div>';
      }
      html += '</div></div>';
    }

    html += `</div>

      <div class="card-title mt-md" style="font-size:0.7rem">${t('settings.notif_events')}</div>
      <div class="notif-events-grid">`;

    for (const ev of events) {
      const evConf = nc.events?.[ev.key] || {};
      html += `
        <label class="notif-event-item">
          <input type="checkbox" id="notif-ev-${ev.key}" ${evConf.enabled ? 'checked' : ''}>
          <span>${ev.label}</span>
        </label>`;
    }

    html += `</div>
      <div class="notif-field mt-sm" style="max-width:200px">
        <label>${t('settings.notif_bed_threshold')}</label>
        <input type="number" id="notif-bed-threshold" value="${nc.bedCooledThreshold || 30}" min="15" max="60">
      </div>

      <div class="card-title mt-md" style="font-size:0.7rem">${t('settings.notif_quiet_hours')}</div>
      <div class="notif-quiet-row">
        <label class="notif-event-item">
          <input type="checkbox" id="notif-quiet-on" ${nc.quietHours?.enabled ? 'checked' : ''}>
          <span>${t('settings.notif_quiet_enable')}</span>
        </label>
        <label>${t('settings.notif_quiet_from')}</label>
        <input type="time" id="notif-quiet-start" value="${nc.quietHours?.start || '23:00'}">
        <label>${t('settings.notif_quiet_to')}</label>
        <input type="time" id="notif-quiet-end" value="${nc.quietHours?.end || '07:00'}">
      </div>

      <div class="notif-save-row">
        <button class="form-btn" id="notif-save-btn" data-ripple onclick="saveNotifSettings()">${t('settings.notif_save')}</button>
        <span class="notif-save-status" id="notif-save-status"></span>
      </div>
    </div>`;

    section.innerHTML = html;
  }

  window.toggleNotifChannel = function(key) {
    const el = document.getElementById(`notif-ch-${key}`);
    if (el) el.classList.toggle('open');
  };

  window.testNotifChannel = async function(key) {
    const btn = document.getElementById(`notif-test-${key}`);
    if (!btn) return;
    btn.textContent = '...';
    btn.className = 'notif-test-btn';

    const channelConf = _getChannelConf(key);
    try {
      const res = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: key, config: channelConf })
      });
      const data = await res.json();
      if (data.ok) {
        btn.textContent = t('settings.notif_test_ok');
        btn.className = 'notif-test-btn success';
      } else {
        btn.textContent = t('settings.notif_test_fail');
        btn.title = data.error || '';
        btn.className = 'notif-test-btn fail';
      }
    } catch (e) {
      btn.textContent = t('settings.notif_test_fail');
      btn.className = 'notif-test-btn fail';
    }
    setTimeout(() => { btn.textContent = t('settings.notif_test'); btn.className = 'notif-test-btn'; btn.title = ''; }, 3000);
  };

  function _getChannelConf(key) {
    const fields = {
      telegram: ['botToken', 'chatId'],
      discord: ['webhookUrl'],
      email: ['host', 'port', 'user', 'pass', 'from', 'to'],
      webhook: ['url', 'headers'],
      ntfy: ['serverUrl', 'topic', 'token'],
      pushover: ['apiToken', 'userKey'],
      sms: ['provider', 'accountSid', 'authToken', 'fromNumber', 'toNumber', 'gatewayUrl', 'gatewayHeaders']
    };
    const conf = { enabled: document.getElementById(`notif-ch-${key}-on`)?.checked || false };
    for (const f of (fields[key] || [])) {
      let val = document.getElementById(`notif-${key}-${f}`)?.value || '';
      if (f === 'port') val = parseInt(val) || 587;
      if (f === 'headers') {
        try { val = JSON.parse(val); } catch { val = {}; }
      }
      conf[f] = val;
    }
    return conf;
  }

  window.saveNotifSettings = async function() {
    const btn = document.getElementById('notif-save-btn');
    const status = document.getElementById('notif-save-status');
    if (btn) { btn.disabled = true; btn.classList.add('btn-loading'); }
    if (status) status.textContent = t('settings.notif_saving');

    const allEvents = ['print_started','print_finished','print_failed','print_cancelled','printer_error','maintenance_due','bed_cooled','drying_due','filament_low_stock','queue_item_started','queue_item_completed','queue_item_failed','queue_completed'];
    const allChannelKeys = ['telegram','discord','email','webhook','ntfy','pushover','sms'];

    const eventsConf = {};
    for (const ev of allEvents) {
      eventsConf[ev] = {
        enabled: document.getElementById(`notif-ev-${ev}`)?.checked || false,
        channels: allChannelKeys
      };
    }

    const channelsConf = {};
    for (const key of allChannelKeys) {
      channelsConf[key] = _getChannelConf(key);
    }

    const body = {
      enabled: document.getElementById('notif-enabled')?.checked || false,
      channels: channelsConf,
      events: eventsConf,
      quietHours: {
        enabled: document.getElementById('notif-quiet-on')?.checked || false,
        start: document.getElementById('notif-quiet-start')?.value || '23:00',
        end: document.getElementById('notif-quiet-end')?.value || '07:00'
      },
      bedCooledThreshold: parseInt(document.getElementById('notif-bed-threshold')?.value) || 30
    };

    try {
      const res = await fetch('/api/notifications/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.ok) {
        if (status) { status.textContent = t('settings.notif_saved'); status.style.color = 'var(--accent-green)'; }
      } else {
        if (status) { status.textContent = t('settings.notif_save_failed'); status.style.color = 'var(--accent-red)'; }
      }
    } catch {
      if (status) { status.textContent = t('settings.notif_save_failed'); status.style.color = 'var(--accent-red)'; }
    }

    if (btn) { btn.disabled = false; btn.classList.remove('btn-loading'); }
    setTimeout(() => { if (status) { status.textContent = ''; status.style.color = ''; } }, 3000);
  };

  // ---- Notification Log ----
  async function loadNotifLog() {
    const section = document.getElementById('notif-log-section');
    if (!section) return;

    try {
      const res = await fetch('/api/notifications/log?limit=20');
      const logs = await res.json();

      if (!logs || logs.length === 0) {
        section.innerHTML = `<p class="text-muted" style="font-size:0.8rem">${t('settings.notif_log_empty')}</p>`;
        return;
      }

      const locale = (window.i18n?.getLocale() || 'nb').replace('_', '-');
      let html = '<div class="notif-log-list">';
      for (const l of logs) {
        const d = l.timestamp ? new Date(l.timestamp) : new Date();
        const time = d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        const okClass = l.success ? 'notif-log-ok' : 'notif-log-fail';
        const icon = l.success
          ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
          : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        html += `<div class="notif-log-item ${okClass}">
          <span class="notif-log-icon">${icon}</span>
          <span class="notif-log-channel">${l.channel || '--'}</span>
          <span class="notif-log-event">${l.event || '--'}</span>
          <span class="notif-log-time">${time}</span>
          ${l.error ? `<span class="notif-log-error" title="${l.error}">${l.error.substring(0, 40)}</span>` : ''}
        </div>`;
      }
      html += '</div>';
      section.innerHTML = html;
    } catch {
      section.innerHTML = `<p class="text-muted" style="font-size:0.8rem">${t('settings.notif_log_failed')}</p>`;
    }
  }

  // ---- OBS URL Copy ----
  window.copyObsUrl = function() {
    const input = document.getElementById('obs-url-display');
    if (!input) return;
    navigator.clipboard.writeText(input.value).then(() => {
      const btn = input.nextElementSibling;
      if (btn) { btn.textContent = t('camera.copied'); setTimeout(() => { btn.textContent = t('camera.copy'); }, 1500); }
    });
  };

  // ---- Appearance / Theme ----

  const ACCENT_SWATCHES = [
    { color: '#00AE42', label: 'Green' },
    { color: '#1279ff', label: 'Blue' },
    { color: '#7b2ff2', label: 'Purple' },
    { color: '#f0883e', label: 'Orange' },
    { color: '#e91e63', label: 'Pink' },
    { color: '#00bcd4', label: 'Cyan' },
  ];

  function buildAppearanceTab() {
    const cfg = window.theme ? window.theme.get() : { preset: 'light', accentColor: null, radius: 12 };
    const currentAccent = cfg.accentColor || (window.theme ? window.theme.getDefaultAccent() : '#00AE42');
    const currentRadius = cfg.radius ?? 12;

    let html = '';

    // Theme preset
    html += `
      <div class="settings-card">
        <div class="card-title">${t('settings.theme_title')}</div>
        <div class="theme-preset-grid">
          <button class="theme-preset-card ${cfg.preset === 'light' ? 'active' : ''}" onclick="setThemePreset('light')">
            <div class="theme-preset-preview theme-preview-light">
              <div class="tpp-sidebar"></div>
              <div class="tpp-main"><div class="tpp-card"></div><div class="tpp-card"></div></div>
            </div>
            <span>${t('settings.theme_light')}</span>
          </button>
          <button class="theme-preset-card ${cfg.preset === 'dark' ? 'active' : ''}" onclick="setThemePreset('dark')">
            <div class="theme-preset-preview theme-preview-dark">
              <div class="tpp-sidebar"></div>
              <div class="tpp-main"><div class="tpp-card"></div><div class="tpp-card"></div></div>
            </div>
            <span>${t('settings.theme_dark')}</span>
          </button>
          <button class="theme-preset-card ${cfg.preset === 'auto' ? 'active' : ''}" onclick="setThemePreset('auto')">
            <div class="theme-preset-preview theme-preview-auto">
              <div class="tpp-half-light"></div>
              <div class="tpp-half-dark"></div>
            </div>
            <span>${t('settings.theme_auto')}</span>
          </button>
        </div>
      </div>`;

    // Accent color
    html += `
      <div class="settings-card mt-md">
        <div class="card-title">${t('settings.theme_accent')}</div>
        <div class="theme-color-row">`;
    for (const s of ACCENT_SWATCHES) {
      const isActive = currentAccent.toLowerCase() === s.color.toLowerCase();
      html += `<button class="theme-color-swatch ${isActive ? 'active' : ''}" style="background:${s.color}" onclick="setThemeAccent('${s.color}')" title="${s.label}"></button>`;
    }
    html += `
          <label class="theme-color-custom" title="${t('settings.theme_accent')}">
            <input type="color" id="theme-accent-picker" value="${currentAccent}" onchange="setThemeAccent(this.value)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </label>
        </div>
        ${cfg.accentColor ? `<button class="form-btn form-btn-sm form-btn-secondary mt-sm" data-ripple onclick="setThemeAccent(null)">${t('settings.theme_accent_reset')}</button>` : ''}
      </div>`;

    // Border radius
    html += `
      <div class="settings-card mt-md">
        <div class="card-title">${t('settings.theme_radius')}</div>
        <div class="theme-radius-row">
          <span class="text-muted" style="font-size:0.8rem">${t('settings.theme_radius_sharp')}</span>
          <input type="range" class="theme-radius-slider" id="theme-radius-slider" min="0" max="20" step="1" value="${currentRadius}" oninput="setThemeRadius(this.value)">
          <span class="text-muted" style="font-size:0.8rem">${t('settings.theme_radius_round')}</span>
          <span class="theme-radius-value" id="theme-radius-value">${currentRadius}px</span>
        </div>
      </div>`;

    // Reset
    html += `
      <div class="mt-md">
        <button class="form-btn form-btn-secondary" data-ripple onclick="resetTheme()">${t('settings.theme_reset')}</button>
      </div>`;

    return html;
  }

  window.setThemePreset = function(preset) {
    if (window.theme) window.theme.set({ preset });
    if (window._activePanel === 'settings' && _activeTab === 'appearance') _renderAppearanceSubContent();
  };

  window.setThemeAccent = function(color) {
    if (window.theme) window.theme.set({ accentColor: color });
    if (window._activePanel === 'settings' && _activeTab === 'appearance') _renderAppearanceSubContent();
  };

  window.setThemeRadius = function(val) {
    const r = parseInt(val) || 12;
    if (window.theme) window.theme.set({ radius: r });
    const label = document.getElementById('theme-radius-value');
    if (label) label.textContent = r + 'px';
  };

  window.resetTheme = function() {
    return confirmAction(t('settings.theme_reset_confirm'), () => {
      if (window.theme) window.theme.set({ preset: 'light', accentColor: null, radius: 12 });
      if (window._activePanel === 'settings' && _activeTab === 'appearance') _renderAppearanceSubContent();
    }, {});
  };

  // ---- Webhook Management ----

  window.loadWebhooks = async function() {
    const el = document.getElementById('webhooks-section');
    if (!el) return;
    try {
      const res = await fetch('/api/webhooks');
      const webhooks = await res.json();
      if (!webhooks.length) {
        el.innerHTML = `<div class="text-muted">${t('settings.no_webhooks')}</div>`;
        return;
      }
      let html = '<div class="wh-list">';
      for (const wh of webhooks) {
        const events = typeof wh.events === 'string' ? JSON.parse(wh.events) : (wh.events || []);
        html += `<div class="wh-item ${wh.active ? '' : 'wh-disabled'}">
          <div class="wh-item-header">
            <strong>${wh.name}</strong>
            <span class="wh-badge ${wh.active ? 'wh-badge-active' : 'wh-badge-inactive'}">${wh.active ? t('common.active') : t('common.inactive')}</span>
          </div>
          <div class="text-muted" style="font-size:0.8rem;word-break:break-all">${wh.url}</div>
          <div class="text-muted" style="font-size:0.75rem">${t('settings.webhook_template')}: ${wh.template} | ${t('settings.webhook_events')}: ${events.length === 0 ? t('common.all') : events.join(', ')}</div>
          <div class="wh-item-actions mt-xs">
            <button class="form-btn form-btn-sm" data-ripple data-tooltip="${t('settings.webhook_test')}" onclick="testWebhook(${wh.id})">${t('settings.webhook_test')}</button>
            <button class="form-btn form-btn-sm" data-ripple data-tooltip="${t('settings.webhook_edit')}" onclick="showWebhookEditor(${wh.id})">${t('settings.webhook_edit')}</button>
            <button class="form-btn form-btn-sm" data-ripple data-tooltip="${t('settings.webhook_deliveries')}" onclick="showWebhookDeliveries(${wh.id})">${t('settings.webhook_deliveries')}</button>
            <button class="form-btn form-btn-sm form-btn-danger" data-ripple data-tooltip="${t('settings.webhook_delete')}" onclick="deleteWebhookItem(${wh.id})">${t('settings.webhook_delete')}</button>
          </div>
        </div>`;
      }
      html += '</div>';
      el.innerHTML = html;
    } catch (e) {
      el.innerHTML = `<div class="text-muted">Error: ${e.message}</div>`;
    }
  };

  window.showWebhookEditor = async function(id) {
    let wh = { name: '', url: '', secret: '', events: [], headers: '{}', template: 'generic', retry_count: 3, retry_delay_s: 10, active: 1 };
    if (id) {
      try {
        const res = await fetch(`/api/webhooks/${id}`);
        wh = await res.json();
        wh.events = typeof wh.events === 'string' ? JSON.parse(wh.events) : (wh.events || []);
        wh.headers = typeof wh.headers === 'string' ? wh.headers : JSON.stringify(wh.headers || {});
      } catch { return; }
    }

    const allEvents = ['print_started','print_finished','print_failed','print_cancelled','printer_error','maintenance_due','bed_cooled','queue_item_started','queue_item_completed','queue_item_failed','queue_completed'];

    const html = `<div class="modal-overlay" id="webhook-editor-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-content" style="max-width:500px">
        <div class="modal-header"><h3>${id ? t('settings.webhook_edit') : t('settings.webhook_add')}</h3>
          <button class="modal-close" onclick="document.getElementById('webhook-editor-modal').remove()">&times;</button></div>
        <div class="modal-body">
          <label class="form-label">${t('settings.webhook_name')}</label>
          <input class="form-input" id="wh-name" value="${wh.name}">
          <label class="form-label mt-sm">URL</label>
          <input class="form-input" id="wh-url" value="${wh.url}" placeholder="https://...">
          <label class="form-label mt-sm">${t('settings.webhook_secret')}</label>
          <input class="form-input" id="wh-secret" value="${wh.secret || ''}" placeholder="HMAC-SHA256 secret (optional)">
          <label class="form-label mt-sm">${t('settings.webhook_template')}</label>
          <select class="form-input" id="wh-template">
            <option value="generic" ${wh.template === 'generic' ? 'selected' : ''}>Generic JSON</option>
            <option value="discord" ${wh.template === 'discord' ? 'selected' : ''}>Discord</option>
            <option value="slack" ${wh.template === 'slack' ? 'selected' : ''}>Slack</option>
          </select>
          <label class="form-label mt-sm">${t('settings.webhook_events')}</label>
          <div class="wh-events-grid">
            ${allEvents.map(e => `<label class="wh-event-label"><input type="checkbox" value="${e}" ${wh.events.includes(e) || wh.events.includes('*') ? 'checked' : ''}> ${e}</label>`).join('')}
          </div>
          <p class="text-muted" style="font-size:0.75rem">${t('settings.webhook_events_hint')}</p>
          <label class="form-label mt-sm">${t('settings.webhook_active')}</label>
          <input type="checkbox" id="wh-active" ${wh.active ? 'checked' : ''}>
        </div>
        <div class="modal-footer">
          <button class="form-btn form-btn-secondary" data-ripple onclick="document.getElementById('webhook-editor-modal').remove()">${t('common.cancel')}</button>
          <button class="form-btn form-btn-primary" data-ripple onclick="saveWebhook(${id || 'null'})">${t('common.save')}</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  window.saveWebhook = async function(id) {
    const name = document.getElementById('wh-name').value.trim();
    const url = document.getElementById('wh-url').value.trim();
    const secret = document.getElementById('wh-secret').value.trim();
    const template = document.getElementById('wh-template').value;
    const active = document.getElementById('wh-active').checked ? 1 : 0;
    const events = [...document.querySelectorAll('.wh-events-grid input:checked')].map(i => i.value);

    if (!name || !url) { showToast(t('settings.webhook_name_url_required'), 'warning'); return; }

    const body = { name, url, secret, template, active, events };
    const endpoint = id ? `/api/webhooks/${id}` : '/api/webhooks';
    const method = id ? 'PUT' : 'POST';

    try {
      await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      document.getElementById('webhook-editor-modal')?.remove();
      loadWebhooks();
    } catch (e) { showToast(e.message, 'error'); }
  };

  window.testWebhook = async function(id) {
    try {
      const res = await fetch(`/api/webhooks/${id}/test`, { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        showToast(t('settings.webhook_test_sent'), 'success');
      } else {
        showToast(data.error || 'Unknown', 'error');
      }
    } catch (e) { showToast(e.message, 'error'); }
  };

  window.deleteWebhookItem = async function(id) {
    return confirmAction(t('settings.webhook_delete_confirm'), async () => {
      try {
        await fetch(`/api/webhooks/${id}`, { method: 'DELETE' });
        loadWebhooks();
      } catch (e) { showToast(e.message, 'error'); }
    }, { danger: true });
  };

  window.showWebhookDeliveries = async function(id) {
    try {
      const res = await fetch(`/api/webhooks/${id}/deliveries`);
      const deliveries = await res.json();

      let html = `<div class="modal-overlay" id="wh-deliveries-modal" onclick="if(event.target===this)this.remove()">
        <div class="modal-content" style="max-width:600px">
          <div class="modal-header"><h3>${t('settings.webhook_deliveries')}</h3>
            <button class="modal-close" onclick="document.getElementById('wh-deliveries-modal').remove()">&times;</button></div>
          <div class="modal-body" style="max-height:400px;overflow-y:auto">`;

      if (!deliveries.length) {
        html += `<div class="text-muted">${t('settings.no_deliveries')}</div>`;
      } else {
        for (const d of deliveries) {
          const statusColor = d.status === 'sent' ? 'var(--accent)' : d.status === 'failed' ? '#e74c3c' : '#f39c12';
          html += `<div class="wh-delivery" style="border-left:3px solid ${statusColor};padding:0.5rem;margin-bottom:0.5rem;background:var(--bg-secondary);border-radius:4px">
            <div><strong>${d.event_type}</strong> <span style="color:${statusColor}">${d.status}</span> <span class="text-muted" style="font-size:0.75rem">${d.created_at}</span></div>
            ${d.response_code ? `<div class="text-muted" style="font-size:0.75rem">HTTP ${d.response_code}</div>` : ''}
          </div>`;
        }
      }

      html += '</div></div></div>';
      document.body.insertAdjacentHTML('beforeend', html);
    } catch (e) { showToast(e.message, 'error'); }
  };

  // ---- Users Management ----

  let _rolesCache = null;

  window.loadUsers = async function() {
    const el = document.getElementById('users-section');
    if (!el) return;
    try {
      const [usersRes, rolesRes] = await Promise.all([fetch('/api/users'), fetch('/api/roles')]);
      const users = await usersRes.json();
      _rolesCache = await rolesRes.json();

      if (!users.length) {
        el.innerHTML = `<div class="text-muted">${t('settings.no_users')}</div>`;
        return;
      }
      let html = '<div class="wh-list">';
      for (const u of users) {
        html += `<div class="wh-item">
          <div class="wh-item-header">
            <strong>${u.username}</strong>${u.display_name ? ` (${u.display_name})` : ''}
            <span class="wh-badge wh-badge-active">${u.role_name || t('settings.no_role')}</span>
          </div>
          <div class="text-muted" style="font-size:0.75rem">${t('settings.user_last_login')}: ${u.last_login || t('common.never')}</div>
          <div class="wh-item-actions mt-xs">
            <button class="form-btn form-btn-sm" data-ripple data-tooltip="${t('settings.user_edit')}" onclick="showUserEditor(${u.id})">${t('settings.user_edit')}</button>
            <button class="form-btn form-btn-sm form-btn-danger" data-ripple data-tooltip="${t('settings.user_delete')}" onclick="deleteUserItem(${u.id})">${t('settings.user_delete')}</button>
          </div>
        </div>`;
      }
      html += '</div>';
      el.innerHTML = html;
    } catch (e) {
      el.innerHTML = `<div class="text-muted">Error: ${e.message}</div>`;
    }
  };

  window.showUserEditor = async function(id) {
    let user = { username: '', display_name: '', role_id: '', password: '' };
    if (id) {
      try {
        const res = await fetch(`/api/users/${id}`);
        user = await res.json();
      } catch { return; }
    }
    if (!_rolesCache) {
      try { _rolesCache = await (await fetch('/api/roles')).json(); } catch { _rolesCache = []; }
    }
    const roleOptions = _rolesCache.map(r => `<option value="${r.id}" ${user.role_id === r.id ? 'selected' : ''}>${r.name}</option>`).join('');

    const html = `<div class="modal-overlay" id="user-editor-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-content" style="max-width:400px">
        <div class="modal-header"><h3>${id ? t('settings.user_edit') : t('settings.user_add')}</h3>
          <button class="modal-close" onclick="document.getElementById('user-editor-modal').remove()">&times;</button></div>
        <div class="modal-body">
          <label class="form-label">${t('settings.user_username')}</label>
          <input class="form-input" id="user-username" value="${user.username}">
          <label class="form-label mt-sm">${t('settings.user_display_name')}</label>
          <input class="form-input" id="user-display-name" value="${user.display_name || ''}">
          <label class="form-label mt-sm">${t('settings.user_role')}</label>
          <select class="form-input" id="user-role">${roleOptions}</select>
          <label class="form-label mt-sm">${t('settings.user_password')}${id ? ' (' + t('settings.user_password_keep_hint') + ')' : ''}</label>
          <input class="form-input" type="password" id="user-password" placeholder="${id ? '••••••••' : ''}">
        </div>
        <div class="modal-footer">
          <button class="form-btn form-btn-secondary" data-ripple onclick="document.getElementById('user-editor-modal').remove()">${t('common.cancel')}</button>
          <button class="form-btn form-btn-primary" data-ripple onclick="saveUser(${id || 'null'})">${t('common.save')}</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  window.saveUser = async function(id) {
    const username = document.getElementById('user-username').value.trim();
    const display_name = document.getElementById('user-display-name').value.trim();
    const role_id = parseInt(document.getElementById('user-role').value) || null;
    const password = document.getElementById('user-password').value;

    if (!username) { showToast(t('settings.username_required'), 'warning'); return; }
    if (!id && !password) { showToast(t('settings.password_required_new'), 'warning'); return; }

    const body = { username, display_name, role_id };
    if (password) body.password = password;

    try {
      await fetch(id ? `/api/users/${id}` : '/api/users', {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      document.getElementById('user-editor-modal')?.remove();
      loadUsers();
    } catch (e) { showToast(e.message, 'error'); }
  };

  window.deleteUserItem = async function(id) {
    return confirmAction(t('settings.user_delete_confirm'), async () => {
      try {
        await fetch(`/api/users/${id}`, { method: 'DELETE' });
        loadUsers();
      } catch (e) { showToast(e.message, 'error'); }
    }, { danger: true });
  };

  // ---- API Key Management ----

  window.loadApiKeys = async function() {
    const el = document.getElementById('api-keys-section');
    if (!el) return;
    try {
      const res = await fetch('/api/keys');
      const keys = await res.json();

      if (!keys.length) {
        el.innerHTML = `<div class="text-muted">${t('settings.no_api_keys')}</div>`;
        return;
      }
      let html = '<div class="wh-list">';
      for (const k of keys) {
        html += `<div class="wh-item ${k.active ? '' : 'wh-disabled'}">
          <div class="wh-item-header">
            <strong>${k.name}</strong>
            <code style="font-size:0.75rem">${k.key_prefix}...</code>
            <span class="wh-badge ${k.active ? 'wh-badge-active' : 'wh-badge-inactive'}">${k.active ? t('common.active') : t('common.inactive')}</span>
          </div>
          <div class="text-muted" style="font-size:0.75rem">
            ${t('settings.api_key_last_used')}: ${k.last_used || t('common.never')}
            ${k.expires_at ? ` | ${t('common.expires')}: ${k.expires_at}` : ''}
          </div>
          <div class="wh-item-actions mt-xs">
            <button class="form-btn form-btn-sm form-btn-danger" data-ripple data-tooltip="${t('settings.api_key_delete')}" onclick="deleteApiKeyItem(${k.id})">${t('settings.api_key_delete')}</button>
          </div>
        </div>`;
      }
      html += '</div>';
      el.innerHTML = html;
    } catch (e) {
      el.innerHTML = `<div class="text-muted">Error: ${e.message}</div>`;
    }
  };

  window.showApiKeyEditor = function() {
    const html = `<div class="modal-overlay" id="api-key-editor-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-content" style="max-width:400px">
        <div class="modal-header"><h3>${t('settings.api_key_add')}</h3>
          <button class="modal-close" onclick="document.getElementById('api-key-editor-modal').remove()">&times;</button></div>
        <div class="modal-body">
          <label class="form-label">${t('settings.api_key_name')}</label>
          <input class="form-input" id="apikey-name" placeholder="My API Key">
          <label class="form-label mt-sm">${t('settings.api_key_expires')}</label>
          <input class="form-input" type="date" id="apikey-expires">
          <div id="apikey-result" style="display:none" class="mt-sm">
            <div class="text-muted" style="font-size:0.85rem;font-weight:bold">${t('settings.api_key_created')}</div>
            <code id="apikey-value" style="word-break:break-all;display:block;padding:8px;background:var(--bg-tertiary);border-radius:4px;margin-top:4px;font-size:0.8rem"></code>
            <p class="text-muted" style="font-size:0.75rem;margin-top:4px">${t('settings.api_key_copy_warning')}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="form-btn form-btn-secondary" data-ripple onclick="document.getElementById('api-key-editor-modal').remove()">${t('common.cancel')}</button>
          <button class="form-btn form-btn-primary" data-ripple id="apikey-create-btn" onclick="createApiKey()">${t('settings.api_key_generate')}</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  window.createApiKey = async function() {
    const name = document.getElementById('apikey-name').value.trim();
    if (!name) { showToast(t('settings.name_required'), 'warning'); return; }
    const expires = document.getElementById('apikey-expires').value;

    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, expires_at: expires || null })
      });
      const data = await res.json();
      if (data.key) {
        document.getElementById('apikey-value').textContent = data.key;
        document.getElementById('apikey-result').style.display = '';
        document.getElementById('apikey-create-btn').style.display = 'none';
        loadApiKeys();
      }
    } catch (e) { showToast(e.message, 'error'); }
  };

  window.deleteApiKeyItem = async function(id) {
    return confirmAction(t('settings.api_key_delete_confirm'), async () => {
      try {
        await fetch(`/api/keys/${id}`, { method: 'DELETE' });
        loadApiKeys();
      } catch (e) { showToast(e.message, 'error'); }
    }, { danger: true });
  };

  // ---- E-Commerce License + Management ----

  async function loadEcomLicenseStatus() {
    const licArea = document.getElementById('ecom-license-area');
    const ecomSection = document.getElementById('ecom-section');
    const addBtn = document.getElementById('ecom-add-btn');
    const badge = document.getElementById('ecom-premium-badge');
    if (!licArea) return;
    try {
      const res = await fetch('/api/ecommerce/license');
      const lic = await res.json();
      if (lic.active) {
        // Active license — show info + enable ecom configs
        if (badge) { badge.classList.add('active'); badge.textContent = t('settings.ecom_premium') + ' \u2713'; }
        const feeStr = formatCurrency(lic.fees_this_month || 0);
        licArea.innerHTML = `
          <div class="ecom-license-info" style="display:flex;flex-wrap:wrap;gap:0.5rem 1.5rem;font-size:0.85rem;margin-bottom:0.5rem;padding:0.6rem;background:var(--bg-secondary);border-radius:var(--radius);border:1px solid rgba(0,174,66,0.3)">
            <span><strong>${t('settings.ecom_license_key')}:</strong> ${_esc(lic.license_key || '')}</span>
            <span><strong>${t('settings.ecom_license_holder')}:</strong> ${_esc(lic.holder || '-')}</span>
            <span><strong>${t('settings.ecom_license_expires')}:</strong> ${lic.expires_at ? new Date(lic.expires_at).toLocaleDateString() : '-'}</span>
            <span><strong>${t('settings.ecom_fees_month')}:</strong> ${feeStr} (${lic.orders_this_month || 0} ${t('settings.ecom_fees_orders')})</span>
            <button class="form-btn form-btn-sm form-btn-danger" data-ripple data-tooltip="${t('settings.ecom_deactivate')}" onclick="deactivateEcomLicense()" style="margin-left:auto">${t('settings.ecom_deactivate')}</button>
          </div>`;
        if (ecomSection) ecomSection.style.display = '';
        if (addBtn) addBtn.style.display = '';
        loadEcomConfigs();
      } else {
        // No active license — show activation form
        if (badge) { badge.classList.remove('active'); badge.textContent = t('settings.ecom_premium'); }
        licArea.innerHTML = `
          <div class="ecom-license-box">
            <p style="font-size:0.85rem;margin:0 0 0.3rem">${t('settings.ecom_license_required')}</p>
            <p style="font-size:0.8rem;color:var(--text-muted);margin:0 0 0.6rem">${t('settings.ecom_fee_notice')}</p>
            ${lic.status === 'expired' ? '<p style="font-size:0.8rem;color:#e91e63;margin:0 0 0.5rem">' + t('settings.ecom_license_expired') + '</p>' : ''}
            ${lic.status === 'invalid' ? '<p style="font-size:0.8rem;color:#e91e63;margin:0 0 0.5rem">' + t('settings.ecom_license_invalid') + '</p>' : ''}
            <div class="form-group" style="margin-bottom:0.4rem">
              <label class="form-label">${t('settings.ecom_license_key')}</label>
              <input class="form-input" id="ecom-license-key" placeholder="${t('settings.ecom_license_key_ph')}">
            </div>
            <div class="form-group" style="margin-bottom:0.6rem">
              <label class="form-label">${t('settings.ecom_license_email')}</label>
              <input class="form-input" id="ecom-license-email" placeholder="${t('settings.ecom_license_email_ph') || 'din@epost.no'}">
            </div>
            <div style="display:flex;gap:0.5rem;align-items:center">
              <button class="form-btn form-btn-primary" data-ripple onclick="activateEcomLicense()">${t('settings.ecom_activate')}</button>
              <a href="https://geektech.no/registrer" target="_blank" rel="noopener" style="font-size:0.85rem">${t('settings.ecom_create_account')}</a>
            </div>
          </div>`;
        if (ecomSection) ecomSection.style.display = 'none';
        if (addBtn) addBtn.style.display = 'none';
      }
    } catch (e) { licArea.innerHTML = `<span class="text-muted" style="font-size:0.85rem">Error: ${e.message}</span>`; }
  }

  window.activateEcomLicense = async function() {
    const key = document.getElementById('ecom-license-key')?.value?.trim();
    const email = document.getElementById('ecom-license-email')?.value?.trim();
    if (!key) { showToast(t('settings.ecom_license_invalid'), 'warning'); return; }
    try {
      const res = await fetch('/api/ecommerce/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: key, email })
      });
      const data = await res.json();
      if (data.valid) {
        showToast(t('settings.ecom_license_activated'), 'success');
      } else {
        showToast(data.error || t('settings.ecom_license_invalid'), 'error');
      }
      loadEcomLicenseStatus();
    } catch (e) { showToast(e.message, 'error'); }
  };

  window.deactivateEcomLicense = async function() {
    return confirmAction(t('settings.ecom_deactivate') + '?', async () => {
      try {
        await fetch('/api/ecommerce/license/deactivate', { method: 'POST' });
        showToast(t('settings.ecom_license_deactivated'), 'success');
        loadEcomLicenseStatus();
      } catch (e) { showToast(e.message, 'error'); }
    }, { danger: true });
  };

  async function loadEcomConfigs() {
    const el = document.getElementById('ecom-section');
    if (!el) return;
    try {
      const res = await fetch('/api/ecommerce/configs');
      const configs = await res.json();
      if (!configs.length) { el.innerHTML = `<span class="text-muted" style="font-size:0.85rem">${t('settings.no_ecom_configs')}</span>`; return; }
      el.innerHTML = configs.map(c => `
        <div class="wh-item" style="display:flex;align-items:center;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid rgba(255,255,255,0.05)">
          <div>
            <strong>${_esc(c.name)}</strong>
            <span class="wh-badge" style="margin-left:0.4rem">${_esc(c.platform)}</span>
            ${c.active ? '<span class="wh-badge" style="background:rgba(0,200,100,0.15);color:#00c864">' + t('common.active') + '</span>' : '<span class="wh-badge">' + t('common.inactive') + '</span>'}
            ${c.auto_queue ? '<span class="wh-badge" style="background:rgba(0,180,255,0.15);color:#00b4ff">' + t('settings.auto_queue') + '</span>' : ''}
          </div>
          <div style="display:flex;gap:0.3rem">
            <button class="form-btn form-btn-sm" data-ripple data-tooltip="${t('settings.webhook_edit')}" onclick="showEcomEditor(${c.id})">${t('settings.webhook_edit')}</button>
            <button class="form-btn form-btn-sm form-btn-danger" data-ripple data-tooltip="${t('settings.webhook_delete')}" onclick="deleteEcomConfig(${c.id})">${t('settings.webhook_delete')}</button>
          </div>
        </div>`).join('');
    } catch (e) { el.innerHTML = `<span class="text-muted">Error: ${e.message}</span>`; }
  }

  window.showEcomEditor = async function(id = null) {
    let config = { platform: 'custom', name: '', webhook_secret: '', auto_queue: false, target_queue_id: '', sku_to_file_mapping: '{}', active: true };
    if (id) {
      try {
        const res = await fetch(`/api/ecommerce/configs/${id}`);
        config = await res.json();
      } catch { return; }
    }
    const mapping = typeof config.sku_to_file_mapping === 'string' ? config.sku_to_file_mapping : JSON.stringify(config.sku_to_file_mapping || {}, null, 2);
    const html = `<div class="modal-overlay" id="ecom-editor-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-content" style="max-width:500px">
        <div class="modal-header"><h3>${id ? t('settings.ecom_edit') : t('settings.ecom_add')}</h3><button class="modal-close" onclick="document.getElementById('ecom-editor-modal').remove()">×</button></div>
        <div class="modal-body" style="display:flex;flex-direction:column;gap:0.6rem">
          <div class="form-group">
            <label class="form-label">${t('settings.ecom_name')}</label>
            <input class="form-input" id="ecom-name" value="${_esc(config.name)}">
          </div>
          <div class="form-group">
            <label class="form-label">${t('settings.ecom_platform')}</label>
            <select class="form-input" id="ecom-platform">
              <option value="custom" ${config.platform==='custom'?'selected':''}>Custom</option>
              <option value="shopify" ${config.platform==='shopify'?'selected':''}>Shopify</option>
              <option value="woocommerce" ${config.platform==='woocommerce'?'selected':''}>WooCommerce</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">${t('settings.webhook_secret')}</label>
            <input class="form-input" id="ecom-secret" value="${_esc(config.webhook_secret || '')}" placeholder="HMAC secret">
          </div>
          <label class="form-checkbox-label" style="display:flex;align-items:center;gap:0.5rem">
            <input type="checkbox" id="ecom-auto-queue" ${config.auto_queue?'checked':''}>
            <span>${t('settings.ecom_auto_queue')}</span>
          </label>
          <div class="form-group">
            <label class="form-label">${t('settings.ecom_target_queue')}</label>
            <input class="form-input" id="ecom-target-queue" type="number" value="${config.target_queue_id || ''}" placeholder="Queue ID">
          </div>
          <div class="form-group">
            <label class="form-label">${t('settings.ecom_sku_mapping')}</label>
            <textarea class="form-input" id="ecom-sku-map" rows="4" style="font-family:monospace;font-size:0.8rem">${_esc(mapping)}</textarea>
          </div>
          <label class="form-checkbox-label" style="display:flex;align-items:center;gap:0.5rem">
            <input type="checkbox" id="ecom-active" ${config.active?'checked':''}>
            <span>${t('settings.webhook_active')}</span>
          </label>
        </div>
        <div class="modal-footer">
          <button class="form-btn form-btn-secondary" data-ripple onclick="document.getElementById('ecom-editor-modal').remove()">${t('common.cancel')}</button>
          <button class="form-btn form-btn-primary" data-ripple onclick="saveEcomConfig(${id || 'null'})">${t('common.save')}</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  window.saveEcomConfig = async function(id) {
    let skuMap;
    try { skuMap = JSON.parse(document.getElementById('ecom-sku-map').value); } catch { skuMap = {}; }
    const data = {
      name: document.getElementById('ecom-name').value.trim(),
      platform: document.getElementById('ecom-platform').value,
      webhook_secret: document.getElementById('ecom-secret').value.trim() || null,
      auto_queue: document.getElementById('ecom-auto-queue').checked,
      target_queue_id: parseInt(document.getElementById('ecom-target-queue').value) || null,
      sku_to_file_mapping: skuMap,
      active: document.getElementById('ecom-active').checked
    };
    if (!data.name) { showToast(t('settings.name_required'), 'warning'); return; }
    try {
      await fetch(id ? `/api/ecommerce/configs/${id}` : '/api/ecommerce/configs', {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      document.getElementById('ecom-editor-modal')?.remove();
      loadEcomConfigs();
    } catch (e) { showToast(e.message, 'error'); }
  };

  window.deleteEcomConfig = async function(id) {
    return confirmAction(t('settings.ecom_delete_confirm'), async () => {
      try {
        await fetch(`/api/ecommerce/configs/${id}`, { method: 'DELETE' });
        loadEcomConfigs();
      } catch (e) { showToast(e.message, 'error'); }
    }, { danger: true });
  };

  // ---- Timelapse Settings ----

  async function loadTimelapseSettings() {
    try {
      const res = await fetch('/api/inventory/settings/timelapse_enabled');
      const data = await res.json();
      const cb = document.getElementById('timelapse-enabled');
      if (cb) cb.checked = data.value === '1' || data.value === 'true';
    } catch {}

    // Load recordings list
    try {
      const res = await fetch('/api/timelapse');
      const recs = await res.json();
      const el = document.getElementById('timelapse-list');
      if (!el || !recs.length) return;
      el.innerHTML = '<div style="font-size:0.85rem;font-weight:600;margin-bottom:0.3rem">' + t('settings.timelapse_recordings') + '</div>' +
        recs.slice(0, 10).map(r => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:0.3rem 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:0.8rem">
          <div>
            <span>${_esc(r.filename || 'Timelapse')}</span>
            <span class="text-muted" style="margin-left:0.3rem">${r.status}</span>
            ${r.file_size_bytes ? '<span class="text-muted" style="margin-left:0.3rem">' + (r.file_size_bytes / 1024 / 1024).toFixed(1) + 'MB</span>' : ''}
          </div>
          <div style="display:flex;gap:0.3rem">
            ${r.status === 'complete' ? `<a class="form-btn form-btn-sm" data-ripple data-tooltip="${t('common.view')}" href="/api/timelapse/${r.id}/video" target="_blank">${t('common.view')}</a>` : ''}
            <button class="form-btn form-btn-sm form-btn-danger" data-ripple data-tooltip="${t('common.delete')}" onclick="deleteTimelapse(${r.id})">${t('common.delete')}</button>
          </div>
        </div>`).join('');
    } catch {}
  }

  window.toggleTimelapse = async function(enabled) {
    try {
      await fetch('/api/inventory/settings/timelapse_enabled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: enabled ? '1' : '0' })
      });
    } catch (e) { showToast(e.message, 'error'); }
  };

  window.deleteTimelapse = async function(id) {
    return confirmAction(t('settings.timelapse_delete_confirm'), async () => {
      try {
        await fetch(`/api/timelapse/${id}`, { method: 'DELETE' });
        loadTimelapseSettings();
      } catch (e) { showToast(e.message, 'error'); }
    }, { danger: true });
  };

  // ---- Hub/Kiosk Settings ----
  async function loadHubSettings() {
    try {
      const res = await fetch('/api/hub/settings');
      const data = await res.json();
      const hubCb = document.getElementById('hub-mode');
      const kioskCb = document.getElementById('kiosk-mode');
      if (hubCb) hubCb.checked = data.hub_mode;
      if (kioskCb) kioskCb.checked = data.kiosk_mode;
    } catch {}
  }

  window.toggleHubMode = async function(enabled) {
    await fetch('/api/hub/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hub_mode: enabled }) });
  };
  window.toggleKioskMode = async function(enabled) {
    await fetch('/api/hub/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kiosk_mode: enabled }) });
  };

  // ---- AI Detection Settings ----
  async function loadAiDetectionSettings() {
    try {
      const enabledRes = await fetch('/api/inventory/settings/ai_detection_enabled');
      const enabledData = await enabledRes.json();
      const sensRes = await fetch('/api/inventory/settings/ai_detection_sensitivity');
      const sensData = await sensRes.json();
      const cb = document.getElementById('ai-detection-enabled');
      const sel = document.getElementById('ai-detection-sensitivity');
      if (cb) cb.checked = enabledData.value === '1';
      if (sel) sel.value = sensData.value || 'medium';
      // Load recent detections
      const dRes = await fetch('/api/failure-detections?limit=5');
      const detections = await dRes.json();
      const list = document.getElementById('ai-detection-list');
      if (list && Array.isArray(detections) && detections.length > 0) {
        list.innerHTML = detections.map(d => `<div style="font-size:0.8rem;padding:0.25rem 0;border-bottom:1px solid var(--border)">${_esc(d.detection_type)} (${Math.round((d.confidence || 0) * 100)}%) - ${d.detected_at}</div>`).join('');
      } else if (list) {
        list.innerHTML = '<div class="text-muted" style="font-size:0.8rem">' + t('settings.no_detections') + '</div>';
      }
    } catch {}
  }

  window.toggleAiDetection = async function(enabled) {
    await fetch('/api/inventory/settings/ai_detection_enabled', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: enabled ? '1' : '0' }) });
  };
  window.updateAiSensitivity = async function(value) {
    await fetch('/api/inventory/settings/ai_detection_sensitivity', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value }) });
  };

  // ---- Printer Groups Settings ----
  async function loadPrinterGroupsSettings() {
    try {
      const res = await fetch('/api/printer-groups');
      const groups = await res.json();
      const section = document.getElementById('printer-groups-section');
      if (!section) return;
      if (!Array.isArray(groups) || groups.length === 0) {
        section.innerHTML = '<div class="text-muted" style="font-size:0.8rem">' + t('settings.no_printer_groups') + '</div>';
        return;
      }
      section.innerHTML = groups.map(g => `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.25rem 0;border-bottom:1px solid var(--border)"><span style="font-size:0.85rem">${_esc(g.name)} ${g.color ? '<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:' + _esc(g.color) + '"></span>' : ''} <span class="text-muted">(${(g.members || []).length} printers, stagger: ${g.stagger_delay_s}s)</span></span><button class="form-btn form-btn-sm" data-ripple data-tooltip="${t('common.delete')}" onclick="deletePrinterGroupSetting(${g.id})" style="font-size:0.75rem">${t('common.delete')}</button></div>`).join('');
    } catch {}
  }

  window.showPrinterGroupEditor = function(editId = null) {
    let name = '', desc = '', color = '#00AE42', delay = 30, maxConc = 0;
    if (editId) {
      // Pre-fill for edit (find from DOM data)
    }
    const html = `<div class="modal-overlay" id="pg-editor-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-content" style="max-width:420px">
        <div class="modal-header"><h3>${t('settings.printer_groups_add')}</h3>
          <button class="modal-close" onclick="document.getElementById('pg-editor-modal').remove()">&times;</button></div>
        <div class="modal-body" style="display:flex;flex-direction:column;gap:0.6rem">
          <div class="form-group">
            <label class="form-label">${t('settings.pg_name')}</label>
            <input class="form-input" id="pg-name" value="${name}" placeholder="${t('settings.pg_name_ph')}">
          </div>
          <div class="form-group">
            <label class="form-label">${t('settings.pg_description')}</label>
            <input class="form-input" id="pg-desc" value="${desc}" placeholder="${t('settings.pg_desc_ph')}">
          </div>
          <div style="display:flex;gap:0.75rem">
            <div class="form-group" style="flex:1">
              <label class="form-label">${t('settings.pg_color')}</label>
              <input type="color" id="pg-color" value="${color}" style="width:100%;height:32px;border:none;cursor:pointer">
            </div>
            <div class="form-group" style="flex:1">
              <label class="form-label">${t('settings.pg_stagger')}</label>
              <input class="form-input" type="number" id="pg-delay" value="${delay}" min="0" max="600" placeholder="30">
            </div>
            <div class="form-group" style="flex:1">
              <label class="form-label">${t('settings.pg_max_concurrent')}</label>
              <input class="form-input" type="number" id="pg-max" value="${maxConc}" min="0" placeholder="0 = unlimited">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="form-btn form-btn-secondary" data-ripple onclick="document.getElementById('pg-editor-modal').remove()">${t('common.cancel')}</button>
          <button class="form-btn form-btn-primary" data-ripple onclick="savePrinterGroup()">${t('common.save')}</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  window.savePrinterGroup = async function() {
    const name = document.getElementById('pg-name')?.value.trim();
    if (!name) { showToast(t('settings.pg_name_required'), 'warning'); return; }
    const body = {
      name,
      description: document.getElementById('pg-desc')?.value.trim() || null,
      color: document.getElementById('pg-color')?.value || null,
      stagger_delay_s: parseInt(document.getElementById('pg-delay')?.value) || 0,
      max_concurrent: parseInt(document.getElementById('pg-max')?.value) || 0
    };
    try {
      await fetch('/api/printer-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      document.getElementById('pg-editor-modal')?.remove();
      loadPrinterGroupsSettings();
    } catch (e) { showToast(e.message, 'error'); }
  };

  window.deletePrinterGroupSetting = async function(id) {
    return confirmAction(t('settings.pg_delete_confirm'), async () => {
      await fetch(`/api/printer-groups/${id}`, { method: 'DELETE' });
      loadPrinterGroupsSettings();
    }, { danger: true });
  };

  // ---- Custom Fields Settings ----
  async function loadCustomFieldsSettings() {
    try {
      const res = await fetch('/api/custom-fields');
      const fields = await res.json();
      const section = document.getElementById('custom-fields-section');
      if (!section) return;
      if (!Array.isArray(fields) || fields.length === 0) {
        section.innerHTML = '<div class="text-muted" style="font-size:0.8rem">' + t('settings.no_custom_fields') + '</div>';
        return;
      }
      section.innerHTML = fields.map(f => `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.25rem 0;border-bottom:1px solid var(--border)"><span style="font-size:0.85rem">${_esc(f.field_label)} <span class="text-muted">(${_esc(f.entity_type)} / ${_esc(f.field_type)})</span></span><button class="form-btn form-btn-sm" data-ripple data-tooltip="${t('common.delete')}" onclick="deleteCustomFieldSetting(${f.id})" style="font-size:0.75rem">${t('common.delete')}</button></div>`).join('');
    } catch {}
  }

  window.showCustomFieldEditor = function() {
    const entityOpts = ['spool','printer','profile','project'].map(e =>
      `<option value="${e}">${e.charAt(0).toUpperCase() + e.slice(1)}</option>`).join('');
    const typeOpts = ['text','number','select','checkbox','date','url','email','color','textarea','rating'].map(t2 =>
      `<option value="${t2}">${t2.charAt(0).toUpperCase() + t2.slice(1)}</option>`).join('');
    const html = `<div class="modal-overlay" id="cf-editor-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-content" style="max-width:420px">
        <div class="modal-header"><h3>${t('settings.custom_fields_add')}</h3>
          <button class="modal-close" onclick="document.getElementById('cf-editor-modal').remove()">&times;</button></div>
        <div class="modal-body" style="display:flex;flex-direction:column;gap:0.6rem">
          <div class="form-group">
            <label class="form-label">${t('settings.cf_entity_type')}</label>
            <select class="form-input" id="cf-entity">${entityOpts}</select>
          </div>
          <div class="form-group">
            <label class="form-label">${t('settings.cf_field_name')}</label>
            <input class="form-input" id="cf-name" placeholder="${t('settings.cf_field_name_ph')}">
          </div>
          <div class="form-group">
            <label class="form-label">${t('settings.cf_field_label')}</label>
            <input class="form-input" id="cf-label" placeholder="${t('settings.cf_field_label_ph')}">
          </div>
          <div class="form-group">
            <label class="form-label">${t('settings.cf_field_type')}</label>
            <select class="form-input" id="cf-type">${typeOpts}</select>
          </div>
          <div class="form-group">
            <label class="form-label">${t('settings.cf_default_value')}</label>
            <input class="form-input" id="cf-default" placeholder="${t('settings.cf_default_ph')}">
          </div>
          <label class="form-checkbox-label" style="display:flex;align-items:center;gap:0.5rem">
            <input type="checkbox" id="cf-required">
            <span>${t('settings.cf_required')}</span>
          </label>
        </div>
        <div class="modal-footer">
          <button class="form-btn form-btn-secondary" data-ripple onclick="document.getElementById('cf-editor-modal').remove()">${t('common.cancel')}</button>
          <button class="form-btn form-btn-primary" data-ripple onclick="saveCustomField()">${t('common.save')}</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  window.saveCustomField = async function() {
    const field_name = document.getElementById('cf-name')?.value.trim();
    const field_label = document.getElementById('cf-label')?.value.trim();
    if (!field_name || !field_label) { showToast(t('settings.cf_name_required'), 'warning'); return; }
    const body = {
      entity_type: document.getElementById('cf-entity')?.value || 'spool',
      field_name,
      field_label,
      field_type: document.getElementById('cf-type')?.value || 'text',
      default_value: document.getElementById('cf-default')?.value || null,
      required: document.getElementById('cf-required')?.checked ? 1 : 0
    };
    try {
      await fetch('/api/custom-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      document.getElementById('cf-editor-modal')?.remove();
      loadCustomFieldsSettings();
    } catch (e) { showToast(e.message, 'error'); }
  };

  window.deleteCustomFieldSetting = async function(id) {
    return confirmAction(t('settings.cf_delete_confirm'), async () => {
      await fetch(`/api/custom-fields/${id}`, { method: 'DELETE' });
      loadCustomFieldsSettings();
    }, { danger: true });
  };

  // ---- Brand Defaults Settings ----
  async function loadBrandDefaultsSettings() {
    try {
      const res = await fetch('/api/brand-defaults');
      const defaults = await res.json();
      const section = document.getElementById('brand-defaults-section');
      if (!section) return;
      if (!Array.isArray(defaults) || defaults.length === 0) {
        section.innerHTML = '<div class="text-muted" style="font-size:0.8rem">' + t('settings.no_brand_defaults') + '</div>';
        return;
      }
      section.innerHTML = defaults.map(d => `<div style="display:flex;justify-content:space-between;align-items:center;padding:0.25rem 0;border-bottom:1px solid var(--border)"><span style="font-size:0.85rem">${_esc(d.manufacturer)} ${d.material ? '(' + _esc(d.material) + ')' : ''} <span class="text-muted">${d.default_extruder_temp ? d.default_extruder_temp + '°C' : ''}</span></span><button class="form-btn form-btn-sm" data-ripple data-tooltip="${t('common.delete')}" onclick="deleteBrandDefaultSetting(${d.id})" style="font-size:0.75rem">${t('common.delete')}</button></div>`).join('');
    } catch {}
  }

  window.showBrandDefaultEditor = function() {
    const html = `<div class="modal-overlay" id="bd-editor-modal" onclick="if(event.target===this)this.remove()">
      <div class="modal-content" style="max-width:420px">
        <div class="modal-header"><h3>${t('settings.brand_defaults_add')}</h3>
          <button class="modal-close" onclick="document.getElementById('bd-editor-modal').remove()">&times;</button></div>
        <div class="modal-body" style="display:flex;flex-direction:column;gap:0.6rem">
          <div class="form-group">
            <label class="form-label">${t('settings.bd_manufacturer')}</label>
            <input class="form-input" id="bd-manufacturer" placeholder="${t('settings.bd_manufacturer_ph')}">
          </div>
          <div class="form-group">
            <label class="form-label">${t('settings.bd_material')}</label>
            <input class="form-input" id="bd-material" placeholder="${t('settings.bd_material_ph')}">
          </div>
          <div style="display:flex;gap:0.75rem">
            <div class="form-group" style="flex:1">
              <label class="form-label">${t('settings.bd_nozzle_temp')}</label>
              <input class="form-input" type="number" id="bd-nozzle-temp" placeholder="200" min="0" max="400">
            </div>
            <div class="form-group" style="flex:1">
              <label class="form-label">${t('settings.bd_bed_temp')}</label>
              <input class="form-input" type="number" id="bd-bed-temp" placeholder="60" min="0" max="150">
            </div>
          </div>
          <div style="display:flex;gap:0.75rem">
            <div class="form-group" style="flex:1">
              <label class="form-label">${t('settings.bd_diameter')}</label>
              <input class="form-input" type="number" id="bd-diameter" value="1.75" step="0.05" min="1" max="3">
            </div>
            <div class="form-group" style="flex:1">
              <label class="form-label">${t('settings.bd_net_weight')}</label>
              <input class="form-input" type="number" id="bd-weight" placeholder="1000" min="0">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="form-btn form-btn-secondary" data-ripple onclick="document.getElementById('bd-editor-modal').remove()">${t('common.cancel')}</button>
          <button class="form-btn form-btn-primary" data-ripple onclick="saveBrandDefault()">${t('common.save')}</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
  };

  window.saveBrandDefault = async function() {
    const manufacturer = document.getElementById('bd-manufacturer')?.value.trim();
    if (!manufacturer) { showToast(t('settings.bd_manufacturer_required'), 'warning'); return; }
    const body = {
      manufacturer,
      material: document.getElementById('bd-material')?.value.trim() || null,
      default_extruder_temp: parseInt(document.getElementById('bd-nozzle-temp')?.value) || null,
      default_bed_temp: parseInt(document.getElementById('bd-bed-temp')?.value) || null,
      default_diameter: parseFloat(document.getElementById('bd-diameter')?.value) || 1.75,
      default_net_weight: parseInt(document.getElementById('bd-weight')?.value) || null
    };
    try {
      await fetch('/api/brand-defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      document.getElementById('bd-editor-modal')?.remove();
      loadBrandDefaultsSettings();
    } catch (e) { showToast(e.message, 'error'); }
  };

  window.deleteBrandDefaultSetting = async function(id) {
    return confirmAction(t('settings.bd_delete_confirm'), async () => {
      await fetch(`/api/brand-defaults/${id}`, { method: 'DELETE' });
      loadBrandDefaultsSettings();
    }, { danger: true });
  };

})();
