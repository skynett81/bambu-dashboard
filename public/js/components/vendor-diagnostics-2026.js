// vendor-diagnostics-2026.js — Admin / power-user tools exposed to the UI:
//   - CAN-bus node scan (Klipper + Katapult setup wizard)
//   - Input-shaper tuning (MEASURE_AXES_NOISE, SHAPER_CALIBRATE, TEST_RESONANCES)
//   - Moonraker history CRUD (reset totals, delete job)
//   - Notifier test-trigger
//   - Full update runner
//   - TigerTag NFC manual lookup
//
// Renders into <div id="vendor-diagnostics-2026"> (settings → diagnostics tab).
// Commands go through the same WS sendCommand() pipeline used elsewhere.

(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  let canbusResult = null;
  let tigerTagResult = null;

  window._wsListeners = window._wsListeners || [];
  window._wsListeners.push((msg) => {
    if (msg?.type === 'moonraker_canbus_scan' && msg.data) {
      canbusResult = msg.data;
      render();
    }
  });

  function render() {
    const el = document.getElementById('vendor-diagnostics-2026');
    if (!el) return;

    // Compact-card helper — uniform visual density across the grid.
    const card = (icon, title, body, opts = {}) => `
      <details class="card" ${opts.open !== false ? 'open' : ''} style="padding:10px;margin:0">
        <summary style="cursor:pointer;font-weight:600;font-size:0.85rem"><i class="bi bi-${icon}"></i> ${title}</summary>
        <div style="margin-top:8px;font-size:0.82rem">${body}</div>
      </details>`;

    el.innerHTML = `
      <!-- Quick actions — most-used buttons always visible at the top -->
      <div class="card" style="padding:10px;margin-bottom:10px">
        <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:0.82rem">
          <strong style="margin-right:6px">Quick actions:</strong>
          <button class="form-btn form-btn-sm" onclick="_vd2026.updateRefresh()" title="Refresh Moonraker update-manager status">
            <i class="bi bi-arrow-clockwise"></i> Refresh updates
          </button>
          <button class="form-btn form-btn-sm" onclick="_vd2026.shaperMeasure()" title="MEASURE_AXES_NOISE — captures baseline noise on each axis">
            <i class="bi bi-soundwave"></i> Measure axes noise
          </button>
          <button class="form-btn form-btn-sm form-btn-danger" onclick="_vd2026.updateFull()" title="Run klipper + moonraker + system + web update; reboots services">
            <i class="bi bi-cloud-download"></i> Run full update
          </button>
          <button class="form-btn form-btn-sm form-btn-danger" onclick="_vd2026.historyResetTotals()" title="Reset lifetime filament/time totals — irreversible">
            <i class="bi bi-eraser"></i> Reset history totals
          </button>
        </div>
      </div>

      <!-- 2-column auto-grid for the rest -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:10px">

        ${card('soundwave', 'Input shaper tuning', `
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px">
            <button class="form-btn form-btn-sm" onclick="_vd2026.shaperCalibrate('X')">Calibrate X</button>
            <button class="form-btn form-btn-sm" onclick="_vd2026.shaperCalibrate('Y')">Calibrate Y</button>
            <button class="form-btn form-btn-sm" onclick="_vd2026.shaperTest('X')">TEST_RESONANCES X</button>
            <button class="form-btn form-btn-sm" onclick="_vd2026.shaperTest('Y')">TEST_RESONANCES Y</button>
          </div>
          <small class="text-muted" style="display:block;margin-top:6px;font-size:0.7rem">Results saved to <code>/tmp/resonances_*.csv</code> on the printer host.</small>`)}

        ${card('hdd-network', 'CAN-bus node scan', `
          <p class="text-muted" style="font-size:0.78rem;margin:0 0 6px">Detect unassigned Klipper + Katapult nodes on a CAN interface.</p>
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
            <input class="form-input" id="vd-canbus-iface" value="can0" placeholder="can0" style="flex:1;min-width:80px;max-width:120px">
            <button class="form-btn form-btn-sm" onclick="_vd2026.canbusScan()">Scan</button>
          </div>
          <div id="vd-canbus-result" style="margin-top:8px">${renderCanbus()}</div>`)}

        ${card('clock-history', 'Moonraker history', `
          <p class="text-muted" style="font-size:0.78rem;margin:0 0 6px">Delete a single job by UID. Lifetime totals are reset from the Quick actions bar.</p>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <input class="form-input" id="vd-history-uid" placeholder="Job UID" style="flex:1;min-width:120px">
            <button class="form-btn form-btn-sm" onclick="_vd2026.historyDelete()">Delete job</button>
          </div>`)}

        ${card('bell', 'Notifier test', `
          <p class="text-muted" style="font-size:0.78rem;margin:0 0 6px">Sends a synthetic notification through a notifier defined in <code>moonraker.conf</code>.</p>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <input class="form-input" id="vd-notifier-name" placeholder="Notifier name" style="flex:1;min-width:140px">
            <button class="form-btn form-btn-sm" onclick="_vd2026.notifierTest()">Send test</button>
          </div>`)}

        ${card('tag', 'TigerTag NFC lookup', `
          <p class="text-muted" style="font-size:0.78rem;margin:0 0 6px">Resolve a filament NFC tag UID against the offline DB + online TigerTag lookup.</p>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <input class="form-input" id="vd-tigertag-uid" placeholder="Tag UID (DEAD:BEEF:01:02)" style="flex:1;min-width:160px">
            <button class="form-btn form-btn-sm" onclick="_vd2026.tigertagLookup()">Look up</button>
          </div>
          <div id="vd-tigertag-result" style="margin-top:6px">${renderTigerTag()}</div>`)}
      </div>
    `;
  }

  function renderCanbus() {
    if (!canbusResult) return '';
    if (canbusResult.ok) {
      if (!canbusResult.uuids?.length) return `<span style="color:var(--text-muted)">Scan on ${esc(canbusResult.interface)} found no unassigned nodes.</span>`;
      return canbusResult.uuids.map(u => `<code>${esc(u.uuid)}</code> (${esc(u.application || 'unknown')})`).join(', ');
    }
    return `<span style="color:var(--accent-red)">Scan failed (${esc(canbusResult.error?.code)}): ${esc(canbusResult.error?.message)}</span>`;
  }

  function renderTigerTag() {
    if (!tigerTagResult) return '';
    if (tigerTagResult.error) return `<span style="color:var(--accent-red)">${esc(tigerTagResult.error)}</span>`;
    if (!tigerTagResult.profile) return `<span style="color:var(--text-muted)">No match in offline DB or online lookup.</span>`;
    const p = tigerTagResult.profile;
    return `<strong>${esc(p.vendor || '?')}</strong> ${esc(p.material || '')} ${esc(p.colorName || '')} ${p.color ? '<span style="display:inline-block;width:14px;height:14px;background:#' + esc(p.color) + ';border:1px solid #666;vertical-align:middle"></span>' : ''} — <span class="text-muted">${esc(p.source)}</span>`;
  }

  function sendCmd(action, extra = {}) {
    if (typeof window.sendCommand === 'function') window.sendCommand(action, extra);
  }

  window._vd2026 = {
    canbusScan() {
      const iface = document.getElementById('vd-canbus-iface')?.value.trim() || 'can0';
      canbusResult = { ok: true, uuids: [], interface: iface, error: null };
      render();
      sendCmd('canbus_scan', { interface: iface });
    },
    shaperMeasure() { sendCmd('input_shaper_measure'); },
    shaperCalibrate(axis) { sendCmd('input_shaper_calibrate', { axis }); },
    shaperTest(axis) { sendCmd('input_shaper_test', { axis, output: 'resonances' }); },
    updateRefresh() { sendCmd('update_refresh'); },
    updateFull() {
      if (!confirm('Run a full update (klipper + moonraker + system + web)? This reboots services.')) return;
      sendCmd('update_full');
    },
    historyDelete() {
      const uid = document.getElementById('vd-history-uid')?.value.trim();
      if (!uid) return;
      sendCmd('history_delete', { uid });
    },
    historyResetTotals() {
      if (!confirm('Reset lifetime filament/time totals? This cannot be undone.')) return;
      sendCmd('history_reset_totals');
    },
    notifierTest() {
      const name = document.getElementById('vd-notifier-name')?.value.trim();
      if (!name) return;
      sendCmd('notifier_test', { name });
    },
    async tigertagLookup() {
      const uid = document.getElementById('vd-tigertag-uid')?.value.trim();
      if (!uid) return;
      tigerTagResult = { profile: null };
      render();
      try {
        const res = await fetch(`/api/tigertag/lookup?uid=${encodeURIComponent(uid)}`);
        const data = await res.json();
        tigerTagResult = data;
      } catch (e) {
        tigerTagResult = { error: e.message };
      }
      render();
    },
  };

  // Expose render for panel loader (component lives in a lazy-rendered panel
  // now — the sidebar "admin-diagnostics" entry injects the container then
  // calls this function). Also render on DOMContentLoaded for backwards-
  // compatible setups that still embed the container on the dashboard.
  window.renderVendorDiagnostics2026 = render;
  document.addEventListener('DOMContentLoaded', render);
})();
