/**
 * Forge Slicer status badge — small pill rendered in the global
 * header / dashboard so the user can see at a glance whether their
 * fork's REST service is connected. Click to navigate to Slicer Studio
 * where the full settings card lives.
 *
 * Mounts itself into any element with id="forge-slicer-badge" if
 * present, otherwise no-ops. Polls /api/slicer/forge/status every
 * 30 s. Hidden entirely when the service has been explicitly
 * disabled (config.enabled = false) so it doesn't add clutter for
 * users who don't run a fork.
 */
(function() {
  'use strict';

  let _timer = null;

  function _render(container, status) {
    const probe = status?.probe;
    const cfg = status?.config || {};
    if (cfg.enabled === false) {
      container.style.display = 'none';
      return;
    }
    container.style.display = '';
    let dotColor, label, title;
    if (probe?.ok) {
      dotColor = 'var(--accent-green)';
      label = t('forge_slicer.connected_short', 'Forge Slicer');
      title = `${probe.info?.service} v${probe.info?.version}\n${probe.info?.upstream || ''}`;
    } else {
      dotColor = 'var(--text-muted)';
      label = t('forge_slicer.offline_short', 'Forge Slicer (offline)');
      title = probe?.error || t('forge_slicer.not_running', 'Service not running — fallback in use');
    }
    container.innerHTML = `<a href="#slicer/studio" title="${title}" style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:14px;background:var(--bg-inset);border:1px solid var(--border-color);font-size:0.72rem;color:var(--text-muted);text-decoration:none;cursor:pointer">
      <span style="width:7px;height:7px;border-radius:50%;background:${dotColor};${probe?.ok ? 'box-shadow:0 0 6px ' + dotColor : ''}"></span>
      <span>🔧 ${label}</span>
    </a>`;
  }

  async function _refresh(container) {
    try {
      const res = await fetch('/api/slicer/forge/status');
      if (!res.ok) return;
      const status = await res.json();
      _render(container, status);
    } catch { /* ignore — keep last state */ }
  }

  function _mount() {
    const container = document.getElementById('forge-slicer-badge');
    if (!container) return false;
    _refresh(container);
    if (_timer) clearInterval(_timer);
    _timer = setInterval(() => {
      if (!document.body.contains(container)) {
        clearInterval(_timer); _timer = null; return;
      }
      _refresh(container);
    }, 30_000);
    return true;
  }

  // Mount on initial load + observe any later DOM mutations that might
  // add the badge container (e.g. a panel that lazily appends it).
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _mount);
  } else {
    _mount();
  }
  // Re-attempt after 2 s in case the badge slot appears after initial render.
  setTimeout(_mount, 2000);
})();
