// Update panel — badge, check, apply, progress overlay
(function() {
  let _updateState = null;

  // Called from app.js when WS receives update_available
  window.handleUpdateAvailable = function(data) {
    _updateState = data;
    showUpdateBadge(true);
    showUpdateToast(data.latest);
  };

  // Called from app.js when WS receives update_status
  window.handleUpdateStatus = function(data) {
    if (data.stage === 'restarting') {
      showUpdateOverlay(t('update.restarting'));
      // Wait for reconnect
      setTimeout(() => location.reload(), 5000);
    } else if (data.stage === 'failed') {
      hideUpdateOverlay();
      showToast(t('update.failed') + ': ' + (data.error || ''), 'error');
    } else if (data.stage) {
      const stageKey = 'update.stage_' + data.stage;
      showUpdateOverlay(t(stageKey));
    }
  };

  function showUpdateBadge(show) {
    const badge = document.getElementById('update-badge');
    if (badge) badge.style.display = show ? 'inline-flex' : 'none';
  }

  // Overlay for update progress
  function showUpdateOverlay(message) {
    let overlay = document.getElementById('update-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'update-overlay';
      overlay.className = 'update-overlay';
      overlay.innerHTML = `
        <div class="update-overlay-box">
          <div class="update-overlay-spinner"></div>
          <div class="update-overlay-msg" id="update-overlay-msg"></div>
        </div>`;
      document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
    const msg = document.getElementById('update-overlay-msg');
    if (msg) msg.textContent = message || t('update.in_progress');
  }

  function hideUpdateOverlay() {
    const overlay = document.getElementById('update-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  // Toast banner at top of screen
  function showUpdateToast(version) {
    let toast = document.getElementById('update-toast');
    if (toast) { toast.classList.add('visible'); return; }

    toast = document.createElement('div');
    toast.id = 'update-toast';
    toast.className = 'update-toast';
    toast.innerHTML = `
      <span>${t('update.new_version', { version: version })} — </span>
      <button class="update-toast-btn" onclick="location.hash='#settings/system'">${t('update.view_details')}</button>
      <button class="update-toast-close" onclick="dismissUpdateToast()" aria-label="Close">&times;</button>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('visible')));
  }

  window.dismissUpdateToast = function() {
    const toast = document.getElementById('update-toast');
    if (toast) {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 400);
    }
  };

  // Render update section inside settings panel
  window.renderUpdateSection = async function(container) {
    container.innerHTML = `<div class="text-muted" style="font-size:0.8rem">${t('update.checking')}...</div>`;

    try {
      const res = await fetch('/api/update/status');
      const status = await res.json();
      _updateState = status;

      let html = `<div class="update-info-row">
        <span class="update-label">${t('update.current_version')}</span>
        <span class="update-value">v${status.current}</span>
      </div>`;

      if (status.available && status.latest) {
        showUpdateBadge(true);
        html += `
          <div class="update-available-banner">
            <div class="update-available-title">${t('update.new_version', { version: status.latest })}</div>`;
        if (status.publishedAt) {
          const d = new Date(status.publishedAt);
          html += `<div class="update-published">${t('update.published')} ${d.toLocaleDateString(window.i18n?.getLocale?.() || 'nb')}</div>`;
        }
        if (status.changelog) {
          html += `
            <details class="update-changelog">
              <summary>${t('update.view_changelog')}</summary>
              <div class="update-changelog-body">${escapeHtml(status.changelog)}</div>
            </details>`;
        }

        if (status.environment === 'docker') {
          html += `<div class="update-docker-hint">
            <code>docker compose pull && docker compose up -d</code>
          </div>`;
        } else {
          html += `<button class="form-btn form-btn-accent" onclick="applyUpdate()">${t('update.update_now')}</button>`;
        }
        html += '</div>';
      } else {
        showUpdateBadge(false);
        html += `<div class="text-muted" style="font-size:0.8rem;margin-top:4px">${t('update.no_updates')}</div>`;
      }

      if (status.lastCheck) {
        html += `<div class="text-muted" style="font-size:0.75rem;margin-top:8px">${t('update.last_check')}: ${new Date(status.lastCheck).toLocaleString(window.i18n?.getLocale?.() || 'nb')}</div>`;
      }

      html += `<div style="margin-top:8px"><button class="form-btn form-btn-sm" onclick="checkForUpdate()">${t('update.check_now')}</button></div>`;

      if (status.environment) {
        html += `<div class="text-muted" style="font-size:0.7rem;margin-top:4px">${t('update.environment')}: ${status.environment}</div>`;
      }

      container.innerHTML = html;
    } catch (e) {
      container.innerHTML = `<div class="text-muted" style="font-size:0.8rem">${t('update.load_failed')}</div>`;
    }
  };

  window.checkForUpdate = async function() {
    const section = document.getElementById('update-section');
    if (section) {
      section.innerHTML = `<div class="text-muted" style="font-size:0.8rem">${t('update.checking')}...</div>`;
    }
    try {
      const res = await fetch('/api/update/check', { method: 'POST' });
      const status = await res.json();
      _updateState = status;
      if (section) renderUpdateSection(section);
    } catch (e) {
      if (section) section.innerHTML = `<div class="text-muted" style="font-size:0.8rem">${t('update.check_failed')}</div>`;
    }
  };

  window.applyUpdate = function() {
    return confirmAction(t('update.confirm'), async () => {
      showUpdateOverlay(t('update.stage_downloading'));
      try {
        const res = await fetch('/api/update/apply', { method: 'POST' });
        const data = await res.json();
        if (data.error) {
          hideUpdateOverlay();
          showToast(data.error, 'error');
        }
        // If successful, we'll get WS update_status messages
      } catch (e) {
        hideUpdateOverlay();
        showToast(t('update.failed') + ': ' + e.message, 'error');
      }
    }, {});
  };

  function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
  }

  // On load, check for updates to show badge + toast
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      const res = await fetch('/api/update/status');
      const status = await res.json();
      if (status.available) {
        _updateState = status;
        showUpdateBadge(true);
        showUpdateToast(status.latest);
      }
    } catch { /* ok */ }
  });
})();
