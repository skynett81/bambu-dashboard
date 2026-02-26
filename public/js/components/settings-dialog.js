// Settings - Printer management
(function() {
  window.loadSettingsPanel = loadSettings;

  async function loadSettings() {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;

    try {
      const res = await fetch('/api/printers');
      const printers = await res.json();

      let html = `<div class="card-title">${t('settings.printers_title')}</div>`;
      html += '<div class="printer-list">';

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

      // Language selector
      html += `
        <div class="settings-section mt-md">
          <div class="card-title">${t('settings.language')}</div>
          <select class="form-input" id="lang-select" onchange="changeLanguage(this.value)" style="max-width:250px">`;
      const locales = window.i18n.getSupportedLocales();
      const names = window.i18n.getLocaleNames();
      const current = window.i18n.getLocale();
      for (const loc of locales) {
        html += `<option value="${loc}" ${loc === current ? 'selected' : ''}>${names[loc]}</option>`;
      }
      html += `</select></div>`;

      // Notification settings
      html += `
        <div class="settings-section mt-md">
          <div class="card-title">${t('settings.notifications_title')}</div>
          <label class="settings-checkbox">
            <input type="checkbox" id="notify-toggle"
                   ${typeof Notification !== 'undefined' && Notification.permission === 'granted' ? 'checked' : ''}
                   onchange="toggleNotificationsPerm(this.checked)">
            <span>${t('settings.notifications_browser')}</span>
          </label>
        </div>`;

      // Server info
      html += `
        <div class="settings-section mt-md">
          <div class="card-title">${t('settings.server_title')}</div>
          <div class="text-muted" style="font-size:0.8rem">
            Port: ${location.port || '3000'} | Printere: ${printers.length}
          </div>
        </div>`;

      // Demo data section (loaded async)
      html += `<div id="demo-data-section"></div>`;

      panel.innerHTML = html;

      // Check for demo data
      checkDemoData();
    } catch (e) {
      panel.innerHTML = `<p class="text-muted">${t('settings.load_failed')}</p>`;
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
      // Re-render settings if open
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
          <div class="settings-section mt-md">
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
        // Clear local state for deleted printers
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

})();
