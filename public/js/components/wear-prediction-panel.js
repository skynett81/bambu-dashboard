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
    hardened_steel_nozzle: 800, brass_nozzle: 400, ptfe_tube: 500,
    linear_rods: 2000, belts: 3000, build_plate: 1000,
    carbon_rod: 5000, heatbreak: 1500
  };

  function _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
  function _tl(key, fb) { return (typeof t === 'function' ? t(key) : '') || fb; }

  function formatDate(iso) {
    if (!iso) return '--';
    const locale = (window.i18n?.getLocale() || 'nb').replace('_', '-');
    return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function formatHours(h) {
    if (h === null || h === undefined) return '--';
    if (h >= 1000) return (h / 1000).toFixed(1) + 'k t';
    return Math.round(h) + ' t';
  }

  function getStatusInfo(hoursRemaining, component) {
    const lifetime = DEFAULT_LIFETIMES[component] || 1000;
    const pctUsed = lifetime > 0 ? Math.min(100, ((lifetime - hoursRemaining) / lifetime) * 100) : 0;
    if (pctUsed >= 95) return { cls: 'bad', color: 'var(--accent-red)', label: _tl('wear.status_critical', 'Kritisk'), pctUsed };
    if (pctUsed >= 90) return { cls: 'warn', color: 'var(--accent-orange)', label: _tl('wear.status_warning', 'Advarsel'), pctUsed };
    if (pctUsed >= 70) return { cls: 'fair', color: 'var(--accent-yellow, #e6a817)', label: _tl('wear.status_fair', 'Brukbar'), pctUsed };
    return { cls: 'good', color: 'var(--accent-green)', label: _tl('wear.status_good', 'God'), pctUsed };
  }

  function getPrinterHealth(predictions) {
    if (!predictions || !predictions.length) return { cls: 'good', color: 'var(--accent-green)', label: _tl('wear.status_good', 'God') };
    let worst = 'good';
    for (const p of predictions) {
      const info = getStatusInfo(p.hours_remaining, p.component);
      if (info.cls === 'bad') return { cls: 'bad', color: 'var(--accent-red)', label: _tl('wear.status_critical', 'Kritisk') };
      if (info.cls === 'warn') worst = 'warn';
      else if (info.cls === 'fair' && worst === 'good') worst = 'fair';
    }
    if (worst === 'warn') return { cls: 'warn', color: 'var(--accent-orange)', label: _tl('wear.status_warning', 'Advarsel') };
    if (worst === 'fair') return { cls: 'fair', color: 'var(--accent-yellow, #e6a817)', label: _tl('wear.status_fair', 'Brukbar') };
    return { cls: 'good', color: 'var(--accent-green)', label: _tl('wear.status_good', 'God') };
  }

  // API
  function _wpPid() { return window.printerState?.getActivePrinterId?.() || ''; }
  async function fetchPredictions() { try { const r = await fetch(`/api/wear/predictions?printer_id=${_wpPid()}`); return r.ok ? r.json() : []; } catch { return []; } }
  async function fetchAlerts() { try { const r = await fetch(`/api/wear/alerts?printer_id=${_wpPid()}`); return r.ok ? r.json() : []; } catch { return []; } }
  async function fetchCosts() { try { const r = await fetch(`/api/wear/costs?printer_id=${_wpPid()}`); return r.ok ? r.json() : []; } catch { return []; } }
  async function recalculate() { await fetch('/api/wear/predictions/recalculate', { method: 'POST' }); }
  async function acknowledgeAlert(id) { await fetch(`/api/wear/alerts/${id}/acknowledge`, { method: 'POST' }); }

  async function _render() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;

    body.innerHTML = '<div class="matrec-empty"><div class="matrec-spinner"></div></div>';

    const [predictions, alerts, costs] = await Promise.all([fetchPredictions(), fetchAlerts(), fetchCosts()]);

    const printerMap = {};
    for (const p of predictions) {
      if (!printerMap[p.printer_id]) printerMap[p.printer_id] = [];
      printerMap[p.printer_id].push(p);
    }

    const printerNames = {};
    const meta = window.printerState?._printerMeta || {};
    for (const id of Object.keys(meta)) printerNames[id] = meta[id]?.name || id;

    let html = '';

    // Toolbar
    html += `<div class="matrec-toolbar" style="margin-bottom:16px">
      <div style="font-size:0.8rem;color:var(--text-muted)">${predictions.length} ${_tl('wear.components', 'komponenter')} / ${Object.keys(printerMap).length} ${_tl('wear.printers', 'printere')}</div>
      <button class="matrec-recalc-btn" id="wear-recalc-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
        ${_tl('wear.recalculate', 'Beregn på nytt')}
      </button>
    </div>`;

    // Alerts
    if (alerts.length > 0) {
      html += `<div class="card wp-section" style="margin-bottom:16px;padding:0;overflow:hidden">
        <div class="wear-alert-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          ${_tl('wear.active_alerts', 'Aktive varsler')}
          <span class="wear-alert-count">${alerts.length}</span>
        </div>`;
      for (const alert of alerts) {
        const isCritical = alert.alert_type === 'critical';
        html += `<div class="wear-alert-row${isCritical ? ' wear-alert--critical' : ''}">
          <span class="hs-badge hs-badge-${isCritical ? 'bad' : 'warn'}">${_esc(alert.alert_type)}</span>
          <span class="wear-alert-msg">${_esc(printerNames[alert.printer_id] || alert.printer_id)} — ${_esc(alert.message)}</span>
          <button class="ce-secondary-btn wear-ack-btn" data-alert-id="${alert.id}" style="padding:4px 10px;font-size:0.72rem">${_tl('wear.acknowledge', 'Bekreft')}</button>
        </div>`;
      }
      html += `</div>`;
    }

    // Printer cards
    const printerIds = Object.keys(printerMap);
    if (printerIds.length > 0) {
      html += '<div class="auto-grid auto-grid--lg">';
      for (const pid of printerIds) {
        const preds = printerMap[pid];
        const health = getPrinterHealth(preds);
        const name = printerNames[pid] || pid;
        const costInfo = costs.find(c => c.printer_id === pid);

        html += `<div class="card wear-printer-card">
          <div class="wear-printer-header">
            <div class="wear-health-dot" style="background:${health.color}"></div>
            <span class="wear-printer-name">${_esc(name)}</span>
            <span class="hs-badge hs-badge-${health.cls}">${health.label}</span>
          </div>
          <div class="wear-components">`;

        for (const pred of preds) {
          const compLabel = COMPONENT_LABELS[pred.component] || pred.component;
          const info = getStatusInfo(pred.hours_remaining, pred.component);
          const pctUsed = Math.min(100, Math.max(0, info.pctUsed));

          html += `<div class="wear-comp">
            <div class="wear-comp-header">
              <span class="wear-comp-name">${_esc(compLabel)}</span>
              <span class="wear-comp-remaining">${formatHours(pred.hours_remaining)} ${_tl('wear.remaining', 'igjen')}</span>
            </div>
            <div class="matrec-bar-track" style="height:6px">
              <div class="matrec-bar-fill" style="width:${pctUsed}%;background:${info.color}"></div>
            </div>
            <div class="wear-comp-footer">
              <span>${Math.round(pctUsed)}% ${_tl('wear.used', 'brukt')}</span>
              <span>${pred.predicted_failure_at ? formatDate(pred.predicted_failure_at) : '--'}</span>
            </div>
          </div>`;
        }

        html += `</div>`;
        if (costInfo && costInfo.total > 0) {
          html += `<div class="wear-printer-cost">
            <span>${_tl('wear.total_cost', 'Total kostnad')}</span>
            <span>${costInfo.total.toFixed(0)} ${costInfo.currency || 'NOK'}</span>
          </div>`;
        }
        html += `</div>`;
      }
      html += '</div>';
    } else {
      html += `<div class="matrec-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.3;margin-bottom:12px"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
        <p>${_tl('wear.no_data', 'Ingen slitasjedata ennå.')}</p>
      </div>`;
    }

    // Cost summary table
    const costsWithData = costs.filter(c => c.total > 0);
    if (costsWithData.length > 0) {
      html += `<div class="card" style="margin-top:16px;padding:0;overflow:hidden">
        <div style="padding:16px 20px 0"><div class="card-title">${_tl('wear.cost_summary', 'Kostnadssammendrag')}</div></div>
        <table class="matrec-table">
          <thead><tr>
            <th style="text-align:left">${_tl('wear.printer', 'Printer')}</th>
            <th>${_tl('wear.total_cost', 'Total')}</th>
            <th>${_tl('wear.items', 'Deler')}</th>
          </tr></thead>
          <tbody>`;
      for (const c of costsWithData) {
        html += `<tr>
          <td style="text-align:left">${_esc(printerNames[c.printer_id] || c.printer_id)}</td>
          <td style="font-weight:700">${c.total.toFixed(0)} ${_esc(c.currency || 'NOK')}</td>
          <td>${c.items?.length || 0}</td>
        </tr>`;
      }
      html += `</tbody></table></div>`;
    }

    body.innerHTML = `<div class="wear-panel">${html}</div>`;

    // Bind events
    document.getElementById('wear-recalc-btn')?.addEventListener('click', async function() {
      this.disabled = true;
      await recalculate();
      setTimeout(() => _render(), 400);
    });
    body.querySelectorAll('.wear-ack-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        await acknowledgeAlert(btn.dataset.alertId);
        _render();
      });
    });
  }

  window.loadWearPredictionPanel = _render;
})();
