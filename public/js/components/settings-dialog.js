// Settings - Tabbed layout with printer management, auth, notifications, system
(function() {
  window.loadSettingsPanel = loadSettings;

  let _activeTab = 'printers';

  async function loadSettings() {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;

    // Read sub-slug from hash (e.g. #settings/notifications)
    const hashSub = location.hash.replace('#', '').split('/')[1];
    if (hashSub && ['printers','general','appearance','notifications','system'].includes(hashSub)) _activeTab = hashSub;

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

      // ======== TAB: Printers ========
      html += `<div class="settings-tab-content ${_activeTab === 'printers' ? 'active' : ''}" id="tab-printers">`;

      // Printer info (live data)
      html += `
        <div class="settings-card">
          <div class="card-title">${t('printer_info.title')}</div>
          <div id="settings-printer-info">
            <span class="text-muted" style="font-size:0.8rem">${t('printer_info.waiting')}</span>
          </div>
        </div>`;

      // Printer list
      html += `<div class="card-title mt-md">${t('settings.printers_title')}</div>`;
      html += '<div class="printer-list-grid">';
      for (const p of printers) {
        html += `
          <div class="printer-config-card">
            <div class="printer-config-header">
              <div>
                <strong>${p.name}</strong>
                <div class="text-muted" style="font-size:0.75rem">${p.model || ''} ${p.ip && p.serial && p.accessCode ? '| ' + p.ip + ' | ' + t('settings.auto_connect') : '| ' + t('settings.add_details')}</div>
              </div>
              <div class="printer-config-actions">
                <button class="form-btn form-btn-sm" onclick="editPrinter('${p.id}')">${t('settings.edit')}</button>
                <button class="form-btn form-btn-sm form-btn-danger" onclick="removePrinter('${p.id}')">${t('settings.delete')}</button>
              </div>
            </div>
          </div>`;
      }
      html += '</div>';
      html += `<button class="form-btn mt-md" onclick="showAddPrinterForm()">${t('settings.add_printer')}</button>`;
      html += `<div id="printer-form-area"></div>`;
      html += '</div>'; // end tab-printers

      // ======== TAB: General ========
      html += `<div class="settings-tab-content ${_activeTab === 'general' ? 'active' : ''}" id="tab-general">`;
      html += '<div class="settings-grid">';

      // Left column: Language + Browser notifications
      html += '<div>';
      html += `
        <div class="settings-card">
          <div class="card-title">${t('settings.language')}</div>
          <select class="form-input" id="lang-select" onchange="changeLanguage(this.value)">`;
      const locales = window.i18n.getSupportedLocales();
      const names = window.i18n.getLocaleNames();
      const current = window.i18n.getLocale();
      for (const loc of locales) {
        html += `<option value="${loc}" ${loc === current ? 'selected' : ''}>${names[loc]}</option>`;
      }
      html += `</select>
        </div>
        <div class="settings-card mt-md">
          <div class="card-title">${t('settings.notifications_title')}</div>
          <label class="settings-checkbox">
            <input type="checkbox" id="notify-toggle"
                   ${typeof Notification !== 'undefined' && Notification.permission === 'granted' ? 'checked' : ''}
                   onchange="toggleNotificationsPerm(this.checked)">
            <span>${t('settings.notifications_browser')}</span>
          </label>
        </div>
        <div class="settings-card mt-md">
          <div class="card-title">${t('settings.server_title')}</div>
          <div class="text-muted" style="font-size:0.8rem">
            Port: ${location.port || '3000'} | ${t('settings.printers_title')}: ${printers.length}
          </div>
        </div>`;
      html += '</div>';

      // Right column: Authentication
      html += '<div id="auth-settings-section"><div class="settings-card"><div class="text-muted" style="font-size:0.8rem">Loading...</div></div></div>';

      html += '</div>'; // end settings-grid

      // Spoolman integration
      html += '<div id="spoolman-settings-section" class="mt-md"><div class="settings-card"><div class="text-muted" style="font-size:0.8rem">Loading...</div></div></div>';

      // OBS Overlay URL
      html += `<div class="settings-card mt-md">
        <div class="card-title">${t('settings.obs_title')}</div>
        <p class="text-muted" style="font-size:0.8rem;margin-bottom:8px">${t('settings.obs_description')}</p>
        <div style="display:flex;gap:8px;align-items:center">
          <input class="form-input" id="obs-url-display" readonly value="${location.origin}/obs.html" style="flex:1;font-size:0.8rem">
          <button class="form-btn form-btn-sm" onclick="copyObsUrl()">${t('camera.copy')}</button>
        </div>
        <p class="text-muted" style="font-size:0.75rem;margin-top:6px">${t('settings.obs_params')}</p>
      </div>`;

      html += '</div>'; // end tab-general

      // ======== TAB: Appearance ========
      html += `<div class="settings-tab-content ${_activeTab === 'appearance' ? 'active' : ''}" id="tab-appearance">`;
      html += buildAppearanceTab();
      html += '</div>'; // end tab-appearance

      // ======== TAB: Notifications ========
      html += `<div class="settings-tab-content ${_activeTab === 'notifications' ? 'active' : ''}" id="tab-notifications">`;
      html += `<div id="notif-server-section"><div class="text-muted" style="font-size:0.8rem">Loading...</div></div>`;
      html += `
        <div class="settings-card mt-md">
          <div class="card-title">${t('settings.notif_log_title')}</div>
          <div id="notif-log-section"><div class="text-muted" style="font-size:0.8rem">Loading...</div></div>
        </div>`;
      html += '</div>'; // end tab-notifications

      // ======== TAB: System ========
      html += `<div class="settings-tab-content ${_activeTab === 'system' ? 'active' : ''}" id="tab-system">`;
      html += '<div class="settings-grid">';
      html += `
        <div class="settings-card">
          <div class="card-title">${t('update.title')}</div>
          <div id="update-section"><div class="text-muted" style="font-size:0.8rem">Loading...</div></div>
        </div>`;
      html += '<div id="demo-data-section"></div>';
      html += '</div>'; // end settings-grid
      html += '</div>'; // end tab-system

      panel.innerHTML = html;

      // Post-render: populate async sections
      const printerInfoEl = document.getElementById('settings-printer-info');
      if (printerInfoEl && typeof renderPrinterInfoSection === 'function') renderPrinterInfoSection(printerInfoEl);
      checkDemoData();
      loadAuthSettings();
      loadSpoolmanSettings();
      loadNotifSettings();
      loadNotifLog();
      const updateSection = document.getElementById('update-section');
      if (updateSection && typeof renderUpdateSection === 'function') renderUpdateSection(updateSection);
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
      el.classList.toggle('active', el.id === 'tab-' + tab);
    });
    // Re-match tab buttons
    document.querySelectorAll('.settings-tab').forEach(el => {
      const match = el.getAttribute('onclick')?.match(/switchSettingsTab\('(\w+)'\)/);
      if (match) el.classList.toggle('active', match[1] === tab);
    });
  };

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
        <div class="form-actions">
          <button class="form-btn" onclick="savePrinterForm('${printer?.id || ''}')">${t('settings.save')}</button>
          <button class="form-btn form-btn-secondary" onclick="cancelPrinterForm()">${t('settings.cancel')}</button>
        </div>
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

    if (!name) { alert(t('settings.name_required')); return; }

    const accessCode = document.getElementById('pf-access')?.value.trim();
    const body = { name, model, ip, serial, accessCode };

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
      alert(t('settings.save_failed'));
    }
  };

  window.cancelPrinterForm = function() {
    const area = document.getElementById('printer-form-area');
    if (area) area.innerHTML = '';
  };

  window.removePrinter = async function(id) {
    if (!confirm(t('settings.confirm_delete'))) return;
    try {
      await fetch(`/api/printers/${id}`, { method: 'DELETE' });
      loadSettings();
    } catch (e) { /* ignore */ }
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
        section.innerHTML = `
          <div class="settings-card">
            <div class="card-title">${t('settings.demo_title')}</div>
            <div class="text-muted" style="font-size:0.8rem; margin-bottom:8px;">
              ${t('settings.demo_description', { count: data.printerIds.length })}
            </div>
            <button class="form-btn form-btn-danger" onclick="deleteDemoData()">${t('settings.demo_delete')}</button>
          </div>`;
      }
    } catch { /* no demo data endpoint or error */ }
  }

  window.deleteDemoData = async function() {
    if (!confirm(t('settings.demo_confirm'))) return;
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
          <button class="form-btn form-btn-sm mt-sm" onclick="addAuthUser()">${t('settings.auth_add_user')}</button>

          <div class="form-group mt-md">
            <label class="form-label">${t('settings.auth_session')}</label>
            <input class="form-input" type="number" id="auth-session-hours" value="${ac.sessionDurationHours || 24}" min="1" max="720" style="max-width:120px">
          </div>
          <div class="notif-save-row">
            <button class="form-btn" id="auth-save-btn" onclick="saveAuthSettings()">${t('settings.auth_save')}</button>
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
          <button class="form-btn form-btn-sm form-btn-danger" onclick="removeAuthUser(${i})" title="${t('settings.delete')}">✕</button>
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
    if (btn) btn.disabled = true;
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

    if (btn) btn.disabled = false;
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
      ]}
    ];

    const events = [
      { key: 'print_started',   label: t('settings.notif_evt_print_started') },
      { key: 'print_finished',  label: t('settings.notif_evt_print_finished') },
      { key: 'print_failed',    label: t('settings.notif_evt_print_failed') },
      { key: 'print_cancelled', label: t('settings.notif_evt_print_cancelled') },
      { key: 'printer_error',   label: t('settings.notif_evt_printer_error') },
      { key: 'maintenance_due', label: t('settings.notif_evt_maintenance_due') },
      { key: 'bed_cooled',      label: t('settings.notif_evt_bed_cooled') }
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
        html += `
          <div class="notif-field">
            <label>${f.label}</label>
            <input type="${f.type || 'text'}" id="notif-${ch.key}-${f.id}" value="${String(val).replace(/"/g, '&quot;')}" autocomplete="off">
          </div>`;
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
        <button class="form-btn" id="notif-save-btn" onclick="saveNotifSettings()">${t('settings.notif_save')}</button>
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
      pushover: ['apiToken', 'userKey']
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
    if (btn) btn.disabled = true;
    if (status) status.textContent = t('settings.notif_saving');

    const allEvents = ['print_started','print_finished','print_failed','print_cancelled','printer_error','maintenance_due','bed_cooled'];
    const allChannelKeys = ['telegram','discord','email','webhook','ntfy','pushover'];

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

    if (btn) btn.disabled = false;
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

  // ---- Spoolman Settings ----
  async function loadSpoolmanSettings() {
    const section = document.getElementById('spoolman-settings-section');
    if (!section) return;

    try {
      const res = await fetch('/api/spoolman/config', { method: 'GET' }).catch(() => null);
      // Config might not exist yet, use defaults
      let sc = { enabled: false, url: '' };
      if (res && res.ok) {
        // No dedicated GET, we read from general config via spoolman/test
      }
    } catch (_) {}

    // We need to infer config — there's no dedicated GET for spoolman config
    // So we render based on what the test endpoint can tell us
    let sc = { enabled: false, url: '' };
    try {
      // Try fetching spoolman spools to see if it's configured
      const testRes = await fetch('/api/spoolman/spools');
      if (testRes.ok) {
        sc.enabled = true;
        // We can't easily get the URL back, so leave blank for editing
      }
    } catch (_) {}

    let html = `<div class="settings-card">
      <div class="card-title">${t('settings.spoolman_title')}</div>
      <p class="text-muted" style="font-size:0.8rem;margin-bottom:10px">${t('settings.spoolman_description')}</p>
      <label class="settings-checkbox">
        <input type="checkbox" id="spoolman-enabled" ${sc.enabled ? 'checked' : ''}>
        <span>${t('settings.spoolman_enable')}</span>
      </label>
      <div class="form-group mt-sm">
        <label class="form-label">${t('settings.spoolman_url')}</label>
        <div style="display:flex;gap:8px">
          <input class="form-input" id="spoolman-url" value="${sc.url}" placeholder="${t('settings.spoolman_url_placeholder')}" style="flex:1">
          <button class="form-btn form-btn-sm" id="spoolman-test-btn" onclick="testSpoolman()">${t('settings.spoolman_test')}</button>
        </div>
        <span class="text-muted" id="spoolman-test-status" style="font-size:0.75rem;margin-top:4px;display:block"></span>
      </div>
      <div class="notif-save-row">
        <button class="form-btn" onclick="saveSpoolmanSettings()">${t('settings.save')}</button>
        <span class="notif-save-status" id="spoolman-save-status"></span>
      </div>
    </div>`;
    section.innerHTML = html;
  }

  window.testSpoolman = async function() {
    const url = document.getElementById('spoolman-url')?.value?.trim();
    const status = document.getElementById('spoolman-test-status');
    const btn = document.getElementById('spoolman-test-btn');
    if (!url) { if (status) status.textContent = t('settings.spoolman_url_placeholder'); return; }
    if (btn) btn.disabled = true;
    if (status) { status.textContent = '...'; status.style.color = ''; }
    try {
      const res = await fetch(`/api/spoolman/test?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (data.ok) {
        if (status) { status.textContent = `${t('settings.spoolman_test_ok')}${data.version ? ' (v' + data.version + ')' : ''}`; status.style.color = 'var(--accent-green)'; }
      } else {
        if (status) { status.textContent = `${t('settings.spoolman_test_fail')}: ${data.error || ''}`; status.style.color = 'var(--accent-red)'; }
      }
    } catch {
      if (status) { status.textContent = t('settings.spoolman_test_fail'); status.style.color = 'var(--accent-red)'; }
    }
    if (btn) btn.disabled = false;
  };

  window.saveSpoolmanSettings = async function() {
    const status = document.getElementById('spoolman-save-status');
    const body = {
      enabled: document.getElementById('spoolman-enabled')?.checked || false,
      url: document.getElementById('spoolman-url')?.value?.trim() || ''
    };
    try {
      const res = await fetch('/api/spoolman/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.ok) {
        if (status) { status.textContent = t('settings.auth_saved'); status.style.color = 'var(--accent-green)'; }
      } else {
        if (status) { status.textContent = t('settings.auth_save_failed'); status.style.color = 'var(--accent-red)'; }
      }
    } catch {
      if (status) { status.textContent = t('settings.auth_save_failed'); status.style.color = 'var(--accent-red)'; }
    }
    setTimeout(() => { if (status) { status.textContent = ''; status.style.color = ''; } }, 3000);
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
        ${cfg.accentColor ? `<button class="form-btn form-btn-sm form-btn-secondary mt-sm" onclick="setThemeAccent(null)">${t('settings.theme_accent_reset')}</button>` : ''}
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
        <button class="form-btn form-btn-secondary" onclick="resetTheme()">${t('settings.theme_reset')}</button>
      </div>`;

    return html;
  }

  window.setThemePreset = function(preset) {
    if (window.theme) window.theme.set({ preset });
    // Re-render to update active states
    if (window._activePanel === 'settings' && _activeTab === 'appearance') {
      const container = document.getElementById('tab-appearance');
      if (container) container.innerHTML = buildAppearanceTab();
    }
  };

  window.setThemeAccent = function(color) {
    if (window.theme) window.theme.set({ accentColor: color });
    if (window._activePanel === 'settings' && _activeTab === 'appearance') {
      const container = document.getElementById('tab-appearance');
      if (container) container.innerHTML = buildAppearanceTab();
    }
  };

  window.setThemeRadius = function(val) {
    const r = parseInt(val) || 12;
    if (window.theme) window.theme.set({ radius: r });
    const label = document.getElementById('theme-radius-value');
    if (label) label.textContent = r + 'px';
  };

  window.resetTheme = function() {
    if (!confirm(t('settings.theme_reset_confirm'))) return;
    if (window.theme) window.theme.set({ preset: 'light', accentColor: null, radius: 12 });
    if (window._activePanel === 'settings' && _activeTab === 'appearance') {
      const container = document.getElementById('tab-appearance');
      if (container) container.innerHTML = buildAppearanceTab();
    }
  };

})();
