/**
 * Forge Slicer Settings — small standalone settings card the user can
 * mount anywhere. Shows the current connection status, lets the user
 * configure URL/token/enabled, and runs a connection test on demand.
 *
 * Mount via: window.renderForgeSlicerSettings(containerEl)
 *
 * Uses the new t(key, fallback) overload directly — no local _t wrapper.
 */
(function() {
  'use strict';

  const POLL_MS = 5000;
  let _pollTimer = null;

  async function _fetchStatus(force = false) {
    try {
      const res = await fetch('/api/slicer/forge/status' + (force ? '?force=1' : ''));
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }

  function _statusDot(probe) {
    if (!probe) return { color: 'var(--text-muted)', label: t('forge_slicer.unknown', 'Unknown'), title: '' };
    if (probe.ok) return {
      color: 'var(--accent-green)',
      label: t('forge_slicer.connected', 'Connected'),
      title: probe.info?.service + ' v' + (probe.info?.version || '?') + (probe.info?.upstream ? ' (' + probe.info.upstream + ')' : ''),
    };
    return {
      color: 'var(--accent-red)',
      label: t('forge_slicer.unreachable', 'Unreachable'),
      title: probe.error || '',
    };
  }

  function _renderInto(container, status) {
    const cfg = status?.config || { url: '', token: '', enabled: true };
    const probe = status?.probe;
    const dot = _statusDot(probe);
    const badgeStyle = `display:inline-flex;align-items:center;gap:6px;font-size:0.8rem;padding:4px 10px;border-radius:14px;background:var(--bg-inset);border:1px solid var(--border-color)`;

    container.innerHTML = `
      <div class="settings-card" style="padding:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px">
          <div>
            <div style="font-weight:700;font-size:1rem;display:flex;align-items:center;gap:6px">
              🔧 ${t('forge_slicer.title', 'Forge Slicer service')}
            </div>
            <div class="text-muted" style="font-size:0.72rem;margin-top:2px">${t('forge_slicer.subtitle', 'Connect 3DPrintForge to your skynett81/OrcaSlicer fork running in service mode')}</div>
          </div>
          <span style="${badgeStyle}" title="${dot.title || ''}">
            <span style="width:8px;height:8px;border-radius:50%;background:${dot.color}"></span>
            <span>${dot.label}</span>
          </span>
        </div>

        ${probe?.ok && probe.info ? `
          <div style="background:var(--bg-inset);border-radius:6px;padding:8px 10px;margin-bottom:10px;font-size:0.74rem;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:6px">
            <div><span class="text-muted">${t('forge_slicer.version', 'Version')}:</span> <strong>${probe.info.version || '?'}</strong></div>
            <div><span class="text-muted">${t('forge_slicer.upstream', 'Upstream')}:</span> <strong>${probe.info.upstream || '—'}</strong></div>
            <div><span class="text-muted">${t('forge_slicer.config_dir', 'Config dir')}:</span> <strong style="font-family:monospace;font-size:0.66rem">${probe.info.config_dir || '—'}</strong></div>
          </div>` : ''}

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-bottom:10px">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">${t('forge_slicer.service_url', 'Service URL')}</label>
            <input class="form-input" id="fsl-url" type="text" value="${(cfg.url || '').replace(/"/g, '&quot;')}" placeholder="http://127.0.0.1:8765">
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">${t('forge_slicer.token', 'Token (optional)')}</label>
            <input class="form-input" id="fsl-token" type="password" value="${(cfg.token || '').replace(/"/g, '&quot;')}" placeholder="${t('forge_slicer.token_placeholder', 'Bearer token if remote')}">
          </div>
          <div class="form-group" style="margin-bottom:0;align-self:end">
            <label class="form-label" style="display:flex;align-items:center;gap:6px">
              <input type="checkbox" id="fsl-enabled" ${cfg.enabled ? 'checked' : ''}>
              ${t('forge_slicer.enabled', 'Enable Forge Slicer')}
            </label>
          </div>
        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="form-btn" data-ripple onclick="window._fslSave()">${t('forge_slicer.save', 'Save')}</button>
          <button class="form-btn form-btn-sm" data-ripple onclick="window._fslTest()">${t('forge_slicer.test_connection', 'Test connection')}</button>
          <a href="https://github.com/skynett81/OrcaSlicer" target="_blank" rel="noopener" class="form-btn form-btn-sm" style="background:transparent;color:var(--accent-blue);text-decoration:none">${t('forge_slicer.open_repo', 'Open fork →')}</a>
        </div>

        ${!probe?.ok ? `
          <div style="margin-top:10px;padding:8px 10px;background:var(--bg-inset);border-left:3px solid var(--accent-orange);border-radius:4px;font-size:0.74rem">
            <strong>${t('forge_slicer.fallback_active', 'Fallback in use')}</strong> —
            ${t('forge_slicer.fallback_explainer', 'Slicing currently goes through the CLI bridge or native engine. Start your fork build with --rest-port 8765 to enable this service.')}
          </div>` : ''}
      </div>
    `;
  }

  async function _refresh(container, force = false) {
    const status = await _fetchStatus(force);
    _renderInto(container, status);
  }

  window.renderForgeSlicerSettings = async function(container) {
    if (!container) return;
    container.innerHTML = `<div class="text-muted" style="padding:14px">${t('common.loading', 'Loading')}…</div>`;
    await _refresh(container, false);
    if (_pollTimer) clearInterval(_pollTimer);
    _pollTimer = setInterval(() => {
      if (!document.body.contains(container)) {
        clearInterval(_pollTimer); _pollTimer = null; return;
      }
      _refresh(container, false);
    }, POLL_MS);
  };

  window._fslSave = async function() {
    const url = document.getElementById('fsl-url')?.value?.trim();
    const token = document.getElementById('fsl-token')?.value || '';
    const enabled = !!document.getElementById('fsl-enabled')?.checked;
    try {
      const res = await fetch('/api/slicer/forge/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, token, enabled }),
      });
      const data = await res.json();
      if (typeof showToast === 'function') {
        showToast(data.ok
          ? t('forge_slicer.connected_toast', 'Forge Slicer connected ✓')
          : t('forge_slicer.saved_unreachable', 'Settings saved — service still unreachable'),
          data.ok ? 'success' : 'warning');
      }
      const container = document.querySelector('[data-fsl-container]');
      if (container) await _refresh(container, true);
    } catch (e) {
      if (typeof showToast === 'function') showToast(e.message, 'error');
    }
  };

  window._fslTest = async function() {
    if (typeof showToast === 'function') showToast(t('forge_slicer.testing', 'Testing connection…'), 'info', 1500);
    const status = await _fetchStatus(true);
    if (typeof showToast === 'function') {
      showToast(status?.probe?.ok
        ? t('forge_slicer.connected_toast', 'Forge Slicer connected ✓')
        : (t('forge_slicer.unreachable_toast', 'Unreachable: ') + (status?.probe?.error || 'unknown')),
        status?.probe?.ok ? 'success' : 'error');
    }
    const container = document.querySelector('[data-fsl-container]');
    if (container) _renderInto(container, status);
  };
})();
