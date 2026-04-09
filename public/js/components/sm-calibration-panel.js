// Snapmaker U1 — Calibration wizard panel
(function() {
  'use strict';

  /**
   * Render SM calibration section for controls panel
   */
  window.renderSmCalibrationPanel = function(data) {
    if (!data._sm_print_config && !data._sm_flow_cal) return '';

    let html = `<div class="ctrl-card">
      <div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        Calibration
      </div>`;

    // Flow calibration
    const fc = data._sm_flow_cal;
    const hasFlowData = fc && Object.keys(fc).length > 0;
    html += `<div style="margin-bottom:10px">
      <div style="font-size:0.82rem;font-weight:600;margin-bottom:6px">Flow Calibration (Pressure Advance)</div>
      <div style="display:flex;gap:4px;margin-bottom:6px">
        <button class="form-btn form-btn-sm" data-ripple onclick="sendCommand('sm_flow_calibrate')" style="font-size:0.72rem">Start Flow Calibration</button>
      </div>
      ${hasFlowData ? `<div style="font-size:0.7rem;color:var(--text-muted)">Last result: ${JSON.stringify(fc)}</div>` : '<div style="font-size:0.7rem;color:var(--text-muted)">No calibration data yet</div>'}
    </div>`;

    // Quick calibration buttons
    html += `<div style="margin-bottom:8px">
      <div style="font-size:0.82rem;font-weight:600;margin-bottom:6px">Quick Calibrations</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap">
        <button class="form-btn form-btn-sm" data-ripple onclick="sendGcode('BED_MESH_CALIBRATE')" style="font-size:0.72rem">Bed Mesh</button>
        <button class="form-btn form-btn-sm" data-ripple onclick="sendGcode('SHAPER_CALIBRATE')" style="font-size:0.72rem">Input Shaper</button>
        <button class="form-btn form-btn-sm" data-ripple onclick="sendGcode('AUTO_SCREWS_TILT_ADJUST')" style="font-size:0.72rem">Screw Tilt</button>
        <button class="form-btn form-btn-sm" data-ripple onclick="sendGcode('XYZ_OFFSET_CALIBRATE_ALL')" style="font-size:0.72rem">XYZ Offset (All)</button>
        <button class="form-btn form-btn-sm" data-ripple onclick="sendGcode('ROUGHLY_CLEAN_NOZZLE')" style="font-size:0.72rem">Clean Nozzle</button>
      </div>
    </div>`;

    // Extruder offset calibration
    html += `<div>
      <div style="font-size:0.82rem;font-weight:600;margin-bottom:6px">Extruder Offset Calibration</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap">
        <button class="form-btn form-btn-sm" data-ripple onclick="sendGcode('EXTRUDER_OFFSET_ACTION_PROBE_CALIBRATE_ALL')" style="font-size:0.72rem">Auto-calibrate All Heads</button>
      </div>
      <p style="font-size:0.65rem;color:var(--text-muted);margin:6px 0 0">Measures nozzle offsets between all 4 extruders using inductance probe. Takes ~5 min.</p>
    </div>`;

    // Calibration history (loaded async)
    html += `<div id="sm-cal-history" style="margin-top:10px">
      <div style="font-size:0.82rem;font-weight:600;margin-bottom:6px">Calibration History</div>
      <div class="text-muted" style="font-size:0.72rem">Loading...</div>
    </div>`;

    html += '</div>';

    // Load calibration history async
    setTimeout(() => _loadCalHistory(), 100);

    return html;
  };

  async function _loadCalHistory() {
    const el = document.getElementById('sm-cal-history');
    if (!el) return;

    const pid = window.printerState?.getActivePrinterId?.();
    if (!pid) { el.querySelector('.text-muted').textContent = 'No printer selected'; return; }

    try {
      const res = await fetch(`/api/printers/${pid}/snapmaker/calibration`);
      const data = await res.json();
      const history = data.history || [];

      if (history.length === 0) {
        el.querySelector('.text-muted').textContent = 'No calibration history yet';
        return;
      }

      // Build K-value trend table
      let h = '<table class="data-table" style="font-size:0.72rem"><thead><tr><th>Date</th><th>Type</th><th>Extruder</th><th>K-value</th></tr></thead><tbody>';
      for (const cal of history.slice(0, 15)) {
        const date = new Date(cal.calibrated_at).toLocaleDateString();
        const kVal = cal.k_value != null ? cal.k_value.toFixed(4) : '--';
        const kColor = cal.k_value > 0.08 ? 'var(--accent-orange)' : 'var(--accent-green)';
        h += `<tr>
          <td>${date}</td>
          <td>${cal.cal_type || '--'}</td>
          <td>E${cal.extruder || 0}</td>
          <td style="font-weight:600;color:${kColor}">${kVal}</td>
        </tr>`;
      }
      h += '</tbody></table>';

      // K-value sparkline (simple bar chart)
      const flowCals = history.filter(c => c.cal_type === 'flow' && c.k_value != null).slice(0, 10).reverse();
      if (flowCals.length >= 2) {
        const maxK = Math.max(...flowCals.map(c => c.k_value), 0.1);
        h += '<div style="margin-top:8px;font-size:0.72rem;font-weight:600">K-value Trend</div>';
        h += '<div style="display:flex;align-items:flex-end;gap:2px;height:40px;margin-top:4px">';
        for (const cal of flowCals) {
          const pct = Math.round((cal.k_value / maxK) * 100);
          const color = cal.k_value > 0.08 ? 'var(--accent-orange)' : 'var(--accent-green)';
          h += `<div style="flex:1;height:${pct}%;background:${color};border-radius:2px 2px 0 0;min-height:2px" title="K=${cal.k_value?.toFixed(4)} (${new Date(cal.calibrated_at).toLocaleDateString()})"></div>`;
        }
        h += '</div>';
      }

      el.innerHTML = `<div style="font-size:0.82rem;font-weight:600;margin-bottom:6px">Calibration History</div>${h}`;
    } catch {
      el.querySelector('.text-muted').textContent = 'Failed to load history';
    }
  }
})();

