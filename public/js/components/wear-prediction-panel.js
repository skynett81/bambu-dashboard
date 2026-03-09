// Wear Prediction Panel — component lifetime tracking, alerts, cost summary
(function() {
  'use strict';

  const COMPONENT_LABELS = {
    hardened_steel_nozzle: 'Hardened Steel Nozzle',
    brass_nozzle: 'Brass Nozzle',
    ptfe_tube: 'PTFE Tube',
    linear_rods: 'Linear Rods',
    belts: 'Belts',
    build_plate: 'Build Plate',
    carbon_rod: 'Carbon Rod',
    heatbreak: 'Heatbreak'
  };

  const DEFAULT_LIFETIMES = {
    hardened_steel_nozzle: 800,
    brass_nozzle: 400,
    ptfe_tube: 500,
    linear_rods: 2000,
    belts: 3000,
    build_plate: 1000,
    carbon_rod: 5000,
    heatbreak: 1500
  };

  function _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

  function formatDate(iso) {
    if (!iso) return '--';
    const locale = (window.i18n?.getLocale() || 'nb').replace('_', '-');
    return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function formatHours(h) {
    if (h === null || h === undefined) return '--';
    if (h >= 1000) return (h / 1000).toFixed(1) + 'k h';
    return Math.round(h) + ' h';
  }

  function getStatusInfo(hoursRemaining, component) {
    const lifetime = DEFAULT_LIFETIMES[component] || 1000;
    const pctUsed = lifetime > 0 ? Math.min(100, ((lifetime - hoursRemaining) / lifetime) * 100) : 0;

    if (pctUsed >= 95) return { status: 'critical', color: 'var(--accent-red)', label: t('wear.status_critical'), pctUsed };
    if (pctUsed >= 90) return { status: 'warning', color: 'var(--accent-orange)', label: t('wear.status_warning'), pctUsed };
    if (pctUsed >= 70) return { status: 'fair', color: 'var(--accent-yellow, #e6a817)', label: t('wear.status_fair'), pctUsed };
    return { status: 'good', color: 'var(--accent-green)', label: t('wear.status_good'), pctUsed };
  }

  function getPrinterHealth(predictions) {
    if (!predictions || predictions.length === 0) return { status: 'good', color: 'var(--accent-green)', label: t('wear.status_good') };
    let worst = 'good';
    for (const p of predictions) {
      const info = getStatusInfo(p.hours_remaining, p.component);
      if (info.status === 'critical') return { status: 'critical', color: 'var(--accent-red)', label: t('wear.status_critical') };
      if (info.status === 'warning') worst = 'warning';
      else if (info.status === 'fair' && worst === 'good') worst = 'fair';
    }
    if (worst === 'warning') return { status: 'warning', color: 'var(--accent-orange)', label: t('wear.status_warning') };
    if (worst === 'fair') return { status: 'fair', color: 'var(--accent-yellow, #e6a817)', label: t('wear.status_fair') };
    return { status: 'good', color: 'var(--accent-green)', label: t('wear.status_good') };
  }

  // ═══ API calls ═══

  async function fetchPredictions(printerId) {
    const url = printerId ? `/api/wear/predictions/${encodeURIComponent(printerId)}` : '/api/wear/predictions';
    const res = await fetch(url);
    if (!res.ok) return [];
    return res.json();
  }

  async function fetchAlerts(printerId) {
    const url = printerId ? `/api/wear/alerts?printer_id=${encodeURIComponent(printerId)}` : '/api/wear/alerts';
    const res = await fetch(url);
    if (!res.ok) return [];
    return res.json();
  }

  async function fetchCosts() {
    const res = await fetch('/api/wear/costs');
    if (!res.ok) return [];
    return res.json();
  }

  async function recalculate() {
    await fetch('/api/wear/predictions/recalculate', { method: 'POST' });
  }

  async function acknowledgeAlert(id) {
    await fetch(`/api/wear/alerts/${id}/acknowledge`, { method: 'POST' });
  }

  // ═══ Render ═══

  async function render() {
    const container = document.getElementById('overlay-panel-body');
    if (!container) return;

    container.innerHTML = `<div id="wear-prediction-root" style="padding:1rem;max-width:1200px;margin:0 auto;">
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap;">
        <h2 style="margin:0;font-size:1.3rem;">${_esc(t('wear.title'))}</h2>
        <button id="wear-recalculate-btn" class="btn btn-sm" style="margin-left:auto;" data-ripple>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          ${_esc(t('wear.recalculate'))}
        </button>
      </div>
      <div id="wear-loading" style="text-align:center;padding:2rem;color:var(--text-secondary);">${_esc(t('wear.loading'))}</div>
    </div>`;

    document.getElementById('wear-recalculate-btn')?.addEventListener('click', async () => {
      const btn = document.getElementById('wear-recalculate-btn');
      if (btn) btn.disabled = true;
      await recalculate();
      setTimeout(async () => {
        await renderContent();
        if (btn) btn.disabled = false;
      }, 500);
    });

    await renderContent();
  }

  async function renderContent() {
    const root = document.getElementById('wear-prediction-root');
    if (!root) return;

    const [predictions, alerts, costs] = await Promise.all([
      fetchPredictions(),
      fetchAlerts(),
      fetchCosts()
    ]);

    // Group predictions by printer
    const printerMap = {};
    for (const p of predictions) {
      if (!printerMap[p.printer_id]) printerMap[p.printer_id] = [];
      printerMap[p.printer_id].push(p);
    }

    // Get printer names from state
    const printerNames = {};
    const meta = window.printerState?._printerMeta || {};
    for (const id of Object.keys(meta)) {
      printerNames[id] = meta[id]?.name || id;
    }

    let html = '';

    // ── Alerts section ──
    if (alerts.length > 0) {
      html += `<div class="wear-section" style="margin-bottom:1.5rem;">
        <h3 style="margin:0 0 0.75rem;font-size:1.1rem;display:flex;align-items:center;gap:0.5rem;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          ${_esc(t('wear.active_alerts'))} <span style="background:var(--accent-red);color:#fff;font-size:0.7rem;padding:1px 6px;border-radius:8px;">${alerts.length}</span>
        </h3>
        <div style="display:flex;flex-direction:column;gap:0.5rem;">`;

      for (const alert of alerts) {
        const isCritical = alert.alert_type === 'critical';
        const borderColor = isCritical ? 'var(--accent-red)' : 'var(--accent-orange)';
        html += `<div style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem 1rem;background:var(--card-bg);border-radius:8px;border-left:3px solid ${borderColor};">
          <span style="font-weight:600;font-size:0.75rem;padding:2px 8px;border-radius:4px;background:${borderColor};color:#fff;text-transform:uppercase;">${_esc(alert.alert_type)}</span>
          <span style="flex:1;font-size:0.85rem;">${_esc(printerNames[alert.printer_id] || alert.printer_id)} &mdash; ${_esc(alert.message)}</span>
          <button class="btn btn-sm wear-ack-btn" data-alert-id="${alert.id}" style="font-size:0.75rem;" data-ripple>${_esc(t('wear.acknowledge'))}</button>
        </div>`;
      }

      html += `</div></div>`;
    }

    // ── Overview cards ──
    const printerIds = Object.keys(printerMap);
    if (printerIds.length > 0) {
      html += `<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(300px, 1fr));gap:1rem;margin-bottom:1.5rem;">`;
      for (const pid of printerIds) {
        const preds = printerMap[pid];
        const health = getPrinterHealth(preds);
        const name = printerNames[pid] || pid;
        const costInfo = costs.find(c => c.printer_id === pid);
        const totalCost = costInfo ? costInfo.total : 0;

        html += `<div class="wear-printer-card" style="background:var(--card-bg);border-radius:12px;padding:1rem;border:1px solid var(--border-color);">
          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem;">
            <span style="width:10px;height:10px;border-radius:50%;background:${health.color};flex-shrink:0;"></span>
            <strong style="font-size:0.95rem;">${_esc(name)}</strong>
            <span style="margin-left:auto;font-size:0.75rem;color:var(--text-secondary);">${_esc(health.label)}</span>
          </div>`;

        // Component gauges
        for (const pred of preds) {
          const compLabel = COMPONENT_LABELS[pred.component] || pred.component;
          const lifetime = DEFAULT_LIFETIMES[pred.component] || 1000;
          const info = getStatusInfo(pred.hours_remaining, pred.component);
          const pctUsed = Math.min(100, Math.max(0, info.pctUsed));

          html += `<div style="margin-bottom:0.6rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
              <span style="font-size:0.8rem;font-weight:500;">${_esc(compLabel)}</span>
              <span style="font-size:0.7rem;color:var(--text-secondary);">${formatHours(pred.hours_remaining)} ${_esc(t('wear.remaining'))}</span>
            </div>
            <div style="background:var(--bg-secondary);border-radius:4px;height:6px;overflow:hidden;">
              <div style="width:${pctUsed}%;height:100%;background:${info.color};border-radius:4px;transition:width 0.3s;"></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:2px;">
              <span style="font-size:0.65rem;color:var(--text-tertiary);">${Math.round(pctUsed)}% ${_esc(t('wear.used'))}</span>
              <span style="font-size:0.65rem;color:var(--text-tertiary);">${pred.predicted_failure_at ? formatDate(pred.predicted_failure_at) : '--'}</span>
            </div>
          </div>`;
        }

        // Cost line
        if (totalCost > 0) {
          html += `<div style="margin-top:0.5rem;padding-top:0.5rem;border-top:1px solid var(--border-color);font-size:0.8rem;color:var(--text-secondary);display:flex;justify-content:space-between;">
            <span>${_esc(t('wear.total_cost'))}</span>
            <span style="font-weight:600;">${totalCost.toFixed(0)} NOK</span>
          </div>`;
        }

        html += `</div>`;
      }
      html += `</div>`;
    } else {
      html += `<div style="text-align:center;padding:3rem;color:var(--text-secondary);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.4;margin-bottom:1rem;"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
        <p>${_esc(t('wear.no_data'))}</p>
      </div>`;
    }

    // ── Cost summary ──
    const costsWithData = costs.filter(c => c.total > 0);
    if (costsWithData.length > 0) {
      html += `<div style="margin-top:1rem;">
        <h3 style="margin:0 0 0.75rem;font-size:1.1rem;">${_esc(t('wear.cost_summary'))}</h3>
        <div style="background:var(--card-bg);border-radius:12px;padding:1rem;border:1px solid var(--border-color);">
        <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
          <thead><tr style="border-bottom:1px solid var(--border-color);">
            <th style="text-align:left;padding:0.4rem 0.5rem;">${_esc(t('wear.printer'))}</th>
            <th style="text-align:right;padding:0.4rem 0.5rem;">${_esc(t('wear.total_cost'))}</th>
            <th style="text-align:right;padding:0.4rem 0.5rem;">${_esc(t('wear.items'))}</th>
          </tr></thead><tbody>`;

      for (const c of costsWithData) {
        html += `<tr style="border-bottom:1px solid var(--border-color, transparent);">
          <td style="padding:0.4rem 0.5rem;">${_esc(printerNames[c.printer_id] || c.printer_id)}</td>
          <td style="text-align:right;padding:0.4rem 0.5rem;font-weight:600;">${c.total.toFixed(0)} ${_esc(c.currency)}</td>
          <td style="text-align:right;padding:0.4rem 0.5rem;">${c.items.length}</td>
        </tr>`;
      }

      html += `</tbody></table></div></div>`;
    }

    // Replace content (keep header)
    const loading = document.getElementById('wear-loading');
    if (loading) loading.remove();

    // Remove old content
    const old = root.querySelector('.wear-content');
    if (old) old.remove();

    const contentDiv = document.createElement('div');
    contentDiv.className = 'wear-content';
    contentDiv.innerHTML = html;
    root.appendChild(contentDiv);

    // Bind acknowledge buttons
    contentDiv.querySelectorAll('.wear-ack-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.alertId;
        btn.disabled = true;
        await acknowledgeAlert(id);
        await renderContent();
      });
    });
  }

  window.loadWearPredictionPanel = render;
})();
