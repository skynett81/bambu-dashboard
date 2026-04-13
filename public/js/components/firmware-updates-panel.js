// Firmware Updates Panel — unified view of firmware updates across all printers
(function() {
  'use strict';

  let _updates = [];
  let _lastCheckAt = null;
  let _checking = false;

  function _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

  // Lightweight Markdown → HTML renderer (headings, bold, italic, lists, paragraphs, line breaks)
  function renderMarkdown(md) {
    if (!md) return '';
    // Escape HTML first
    let html = _esc(md);

    // Process line by line to handle lists and headings
    const lines = html.split('\n');
    const out = [];
    let inList = false;

    for (let raw of lines) {
      const line = raw.trimEnd();

      // Skip empty lines (they create paragraph breaks)
      if (!line.trim()) {
        if (inList) { out.push('</ul>'); inList = false; }
        out.push('');
        continue;
      }

      // Headings: ### / ## / #
      const h3 = line.match(/^###\s+(.+)$/);
      const h2 = line.match(/^##\s+(.+)$/);
      const h1 = line.match(/^#\s+(.+)$/);
      if (h1 || h2 || h3) {
        if (inList) { out.push('</ul>'); inList = false; }
        const level = h1 ? 'h5' : h2 ? 'h6' : 'h6';
        const text = (h1 || h2 || h3)[1];
        out.push(`<${level} style="margin:12px 0 6px;font-weight:700;color:var(--bs-body-color)">${text}</${level}>`);
        continue;
      }

      // Numbered list: 1. text
      const num = line.match(/^(\d+)\.\s+(.+)$/);
      if (num) {
        if (!inList) { out.push('<ol style="margin:4px 0 8px 20px;padding:0">'); inList = 'ol'; }
        out.push(`<li style="margin-bottom:4px">${num[2]}</li>`);
        continue;
      }

      // Bullet list: - text / * text
      const bullet = line.match(/^[-*]\s+(.+)$/);
      if (bullet) {
        if (!inList) { out.push('<ul style="margin:4px 0 8px 20px;padding:0">'); inList = 'ul'; }
        out.push(`<li style="margin-bottom:4px">${bullet[1]}</li>`);
        continue;
      }

      // Italic note indented: *text
      const note = line.match(/^\s*\*([^*].+)$/);
      if (note) {
        out.push(`<div style="font-style:italic;color:var(--text-muted);margin:2px 0 6px 20px;font-size:0.88em">${note[1]}</div>`);
        continue;
      }

      // Close list if we're out of list items
      if (inList) { out.push(inList === 'ol' ? '</ol>' : '</ul>'); inList = false; }

      // Plain paragraph
      out.push(`<p style="margin:4px 0">${line}</p>`);
    }
    if (inList) out.push(inList === 'ol' ? '</ol>' : '</ul>');

    // Inline formatting: **bold**, *italic*, `code`
    let result = out.join('\n');
    result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
    result = result.replace(/`([^`]+)`/g, '<code>$1</code>');
    return result;
  }

  function formatDate(iso) {
    if (!iso) return '--';
    const locale = (window.i18n?.getLocale() || 'en').replace('_', '-');
    return new Date(iso).toLocaleString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  async function fetchStatus() {
    try {
      const res = await fetch('/api/firmware/updates');
      if (!res.ok) return;
      const data = await res.json();
      _updates = Array.isArray(data?.availableUpdates) ? data.availableUpdates : [];
      _lastCheckAt = data?.lastCheckAt || null;
      _render();
    } catch {}
  }

  async function checkNow() {
    if (_checking) return;
    _checking = true;
    _render();
    try {
      await fetch('/api/firmware/check-now', { method: 'POST' });
      showToast('Firmware check started — this may take a minute', 'info');
      // Poll for results
      setTimeout(fetchStatus, 10000);
      setTimeout(fetchStatus, 30000);
      setTimeout(() => { _checking = false; _render(); }, 60000);
    } catch (e) {
      _checking = false;
      showToast('Check failed: ' + e.message, 'error');
      _render();
    }
  }

  async function checkPrinter(printerId) {
    try {
      const res = await fetch('/api/firmware/check/' + encodeURIComponent(printerId), { method: 'POST' });
      const data = await res.json();
      if (data.available) {
        showToast(`Update available for ${printerId}: ${data.current} → ${data.latest}`, 'info');
      } else {
        showToast(`${printerId} is up to date (${data.current})`, 'success');
      }
      fetchStatus();
    } catch (e) {
      showToast('Check failed: ' + e.message, 'error');
    }
  }

  async function triggerUpdate(printerId) {
    try {
      const res = await fetch('/api/firmware/trigger/' + encodeURIComponent(printerId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();

      // Manual update required (e.g. Bambu Lab)
      if (data.requiresManualUpdate) {
        showManualUpdateDialog(printerId, data);
        return;
      }

      if (res.ok && data.ok !== false) {
        showToast('Update triggered: ' + (data.message || 'OK'), 'success');
      } else {
        showToast('Trigger failed: ' + (data.error || data.message || 'Unknown error'), 'error');
      }
    } catch (e) {
      showToast('Trigger failed: ' + e.message, 'error');
    }
  }

  function showManualUpdateDialog(printerId, info) {
    const existing = document.getElementById('fw-manual-dialog');
    if (existing) existing.remove();
    const instructions = (info.instructions || []).map(i => `<li>${_esc(i)}</li>`).join('');
    const backdrop = document.createElement('div');
    backdrop.id = 'fw-manual-dialog';
    backdrop.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px';
    backdrop.innerHTML = `
      <div class="card" style="max-width:540px;width:100%">
        <div class="card-header">
          <h5 class="card-title mb-0"><i class="bi bi-info-circle"></i> Manual update required</h5>
        </div>
        <div class="card-body">
          <p>${_esc(info.message || 'This printer requires manual firmware update.')}</p>
          <ol class="mb-3">${instructions}</ol>
          <div class="alert alert-info mb-3" style="font-size:0.88rem">
            <i class="bi bi-lightbulb"></i> After you've installed the update on the printer, click <strong>"Mark as Updated"</strong> below to clear this notification. The next auto-check will verify the new version.
          </div>
          <div class="d-flex gap-2 justify-content-end flex-wrap">
            <button class="btn btn-secondary" id="fw-dlg-close">Close</button>
            <button class="btn btn-outline-primary" id="fw-dlg-recheck" data-printer="${_esc(printerId)}">
              <i class="bi bi-arrow-repeat"></i> Recheck now
            </button>
            <button class="btn btn-success" id="fw-dlg-dismiss" data-printer="${_esc(printerId)}">
              <i class="bi bi-check"></i> Mark as Updated
            </button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(backdrop);
    backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.remove(); });
    document.getElementById('fw-dlg-close').addEventListener('click', () => backdrop.remove());
    document.getElementById('fw-dlg-recheck').addEventListener('click', async () => {
      backdrop.remove();
      await checkPrinter(printerId);
    });
    document.getElementById('fw-dlg-dismiss').addEventListener('click', async () => {
      backdrop.remove();
      await dismissUpdate(printerId);
    });
  }

  async function dismissUpdate(printerId) {
    try {
      const res = await fetch('/api/firmware/dismiss/' + encodeURIComponent(printerId), { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast('Update dismissed. Run "Check Now" to verify.', 'success');
        fetchStatus();
        // Also update the sidebar badge
        setTimeout(() => {
          const badge = document.getElementById('fw-nav-badge');
          if (badge) {
            const n = parseInt(badge.textContent || '0') - 1;
            if (n <= 0) badge.style.display = 'none';
            else badge.textContent = n;
          }
        }, 500);
      } else {
        showToast('Dismiss failed: ' + (data.error || 'Unknown'), 'error');
      }
    } catch (e) {
      showToast('Dismiss failed: ' + e.message, 'error');
    }
  }

  function showToast(msg, type) {
    if (window.showToast) window.showToast(msg, type);
    else console.log(`[toast ${type}] ${msg}`);
  }

  function _render() {
    const container = document.getElementById('firmware-updates-panel');
    if (!container) return;

    const updatesCount = _updates.length;
    const badgeClass = updatesCount > 0 ? 'badge-warning' : 'badge-success';

    let html = `
      <div class="card card-outline ${updatesCount > 0 ? 'card-warning' : 'card-success'}">
        <div class="card-header">
          <h3 class="card-title">
            <i class="bi bi-cloud-download"></i> Firmware Updates
            <span class="badge ${badgeClass}">${updatesCount} available</span>
          </h3>
          <div class="card-tools">
            <button class="btn btn-sm btn-primary" id="fw-check-now-btn" ${_checking ? 'disabled' : ''}>
              <i class="bi bi-arrow-repeat ${_checking ? 'spin' : ''}"></i>
              ${_checking ? 'Checking...' : 'Check Now'}
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class="text-muted small mb-2">Last checked: ${_lastCheckAt ? formatDate(_lastCheckAt) : 'Never'}</div>`;

    if (updatesCount === 0) {
      html += `<p class="text-success mb-0"><i class="bi bi-check-circle"></i> All printers are up to date</p>`;
    } else {
      for (const u of _updates) {
        const name = _esc(u.printer_name || u.printer_id);
        const model = u.model ? ` <span class="text-muted small">(${_esc(u.model)})</span>` : '';
        const changelogId = 'fw-changelog-' + u.printer_id;
        html += `
          <div class="card mb-3" style="border-left:4px solid var(--bs-warning)">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
                <div>
                  <h5 class="mb-1"><i class="bi bi-printer"></i> ${name}${model}</h5>
                  <div>
                    <span class="badge text-bg-secondary">Current: ${_esc(u.sw_ver || '?')}</span>
                    <i class="bi bi-arrow-right mx-1"></i>
                    <span class="badge text-bg-success">Latest: ${_esc(u.latest_available || '?')}</span>
                  </div>
                </div>
                <div class="btn-group flex-wrap">
                  <button class="btn btn-sm btn-outline-secondary" onclick="window._fwCheck('${_esc(u.printer_id)}')" title="Recheck">
                    <i class="bi bi-arrow-repeat"></i> Recheck
                  </button>
                  <button class="btn btn-sm btn-warning" onclick="window._fwTrigger('${_esc(u.printer_id)}')" title="Install update">
                    <i class="bi bi-download"></i> Install Update
                  </button>
                  <button class="btn btn-sm btn-outline-success" onclick="window._fwDismiss('${_esc(u.printer_id)}')" title="Mark as already updated">
                    <i class="bi bi-check"></i> Mark as Updated
                  </button>
                </div>
              </div>
              ${u.changelog ? `
                <details>
                  <summary style="cursor:pointer;font-weight:600;margin-bottom:8px">
                    <i class="bi bi-card-text"></i> Release Notes
                  </summary>
                  <div id="${changelogId}" class="fw-changelog" style="max-height:400px;overflow-y:auto;padding:12px;background:var(--bs-tertiary-bg);border-radius:6px;font-size:0.88rem;line-height:1.5">
                    ${renderMarkdown(u.changelog)}
                  </div>
                </details>
              ` : ''}
              ${u.release_url ? `<div class="mt-2"><a href="${_esc(u.release_url)}" target="_blank" rel="noopener"><i class="bi bi-box-arrow-up-right"></i> Open release notes externally</a></div>` : ''}
              <div class="text-muted small mt-2">Checked: ${formatDate(u.checked_at)}</div>
            </div>
          </div>`;
      }
    }

    html += `
        </div>
      </div>`;

    container.innerHTML = html;

    const btn = document.getElementById('fw-check-now-btn');
    if (btn) btn.addEventListener('click', checkNow);
  }

  // Expose action handlers for inline onclick
  window._fwCheck = checkPrinter;
  window._fwTrigger = triggerUpdate;
  window._fwDismiss = dismissUpdate;
  window.loadFirmwareUpdatesPanel = fetchStatus;

  // Listen for WebSocket firmware check events
  if (!window._fwWsListener) {
    window._fwWsListener = true;
    const origOnMsg = window._wsOnMessage;
    document.addEventListener('ws:firmware_check_complete', () => fetchStatus());
  }

  // Periodic badge update in sidebar (every 5 minutes)
  async function updateSidebarBadge() {
    try {
      const res = await fetch('/api/firmware/updates');
      if (!res.ok) return;
      const data = await res.json();
      const count = Array.isArray(data?.availableUpdates) ? data.availableUpdates.length : 0;
      const badge = document.getElementById('fw-nav-badge');
      if (badge) {
        if (count > 0) {
          badge.textContent = count;
          badge.style.display = '';
        } else {
          badge.style.display = 'none';
        }
      }
    } catch {}
  }

  // Auto-load on DOM ready if container exists
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('firmware-updates-panel')) fetchStatus();
    // Start periodic badge update
    updateSidebarBadge();
    setInterval(updateSidebarBadge, 5 * 60 * 1000);
  });
})();
