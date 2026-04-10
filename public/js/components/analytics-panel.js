/**
 * Analytics Panel — AWStats-inspired web analytics dashboard
 * Shows: requests/hour, bandwidth, top endpoints, error rates,
 * browser/device breakdown, sessions, WebSocket stats, camera bandwidth
 */
(function() {
  'use strict';

  window.loadAnalyticsPanel = function() {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;
    panel.innerHTML = '<div class="text-muted" style="padding:20px;text-align:center">Loading analytics...</div>';
    _fetchAndRender(panel);
  };

  async function _fetchAndRender(panel) {
    try {
      // Fetch ALL available data
      const [overview, hourly, topEndpoints, sessions, errors,
             history, printers, filament, queue, printErrors, sysInfo
      ] = await Promise.all([
        fetch('/api/analytics/overview').then(r => r.json()).catch(() => ({})),
        fetch('/api/analytics/hourly?days=7').then(r => r.json()).catch(() => []),
        fetch('/api/analytics/top-endpoints').then(r => r.json()).catch(() => []),
        fetch('/api/analytics/sessions').then(r => r.json()).catch(() => []),
        fetch('/api/analytics/errors').then(r => r.json()).catch(() => []),
        fetch('/api/history?limit=100').then(r => r.json()).catch(() => []),
        fetch('/api/printers').then(r => r.json()).catch(() => []),
        fetch('/api/filament').then(r => r.json()).catch(() => []),
        fetch('/api/queue').then(r => r.json()).catch(() => []),
        fetch('/api/errors?limit=20').then(r => r.json()).catch(() => []),
        fetch('/api/system/info').then(r => r.json()).catch(() => ({})),
      ]);

      // Ensure API responses are arrays (may return {error:...} on failure)
      const _history = Array.isArray(history) ? history : [];
      const _printers = Array.isArray(printers) ? printers : [];
      const _filament = Array.isArray(filament) ? filament : [];
      const _queue = Array.isArray(queue) ? queue : [];
      const _printErrors = Array.isArray(printErrors) ? printErrors : [];

      // Calculate print stats
      const totalPrints = _history.length;
      const successPrints = _history.filter(h => h.status === 'completed').length;
      const failedPrints = _history.filter(h => h.status === 'failed').length;
      const successRate = totalPrints > 0 ? Math.round((successPrints / totalPrints) * 100) : 0;
      const totalPrintHours = Math.round(_history.reduce((s, h) => s + (h.duration_seconds || 0), 0) / 3600 * 10) / 10;
      const totalFilamentG = Math.round(_history.reduce((s, h) => s + (h.filament_used_g || 0), 0));
      const totalSpools = _filament.length;
      const activeQueue = _queue.length;
      const onlinePrinters = Object.keys(window.printerState?.printers || {}).length;
      const totalPrinters = _printers.length;

      let html = '<div class="analytics-layout" style="display:flex;flex-direction:column;gap:14px">';

      // ── Overview Cards — Print Farm Stats ──
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px">';
      html += _statCard('Total Prints', totalPrints, '🖨️');
      html += _statCard('Success Rate', successRate + '%', '✅', successRate > 80 ? 'var(--accent-green)' : successRate > 50 ? 'var(--accent-orange)' : 'var(--accent-red)');
      html += _statCard('Failed', failedPrints, '❌', failedPrints > 0 ? 'var(--accent-red)' : '');
      html += _statCard('Print Hours', totalPrintHours + 'h', '⏱️');
      html += _statCard('Filament Used', totalFilamentG + 'g', '🧵');
      html += _statCard('Spools', totalSpools, '🎨');
      html += _statCard('Printers', `${onlinePrinters}/${totalPrinters}`, '🖨️', onlinePrinters > 0 ? 'var(--accent-green)' : 'var(--accent-red)');
      html += _statCard('Queue', activeQueue, '📋');
      html += _statCard('Errors', _printErrors.length, '⚠️', _printErrors.length > 0 ? 'var(--accent-red)' : '');
      html += _statCard('Requests', overview.today?.requests || 0, '📊');
      html += _statCard('Bandwidth', _fmtBytes(overview.today?.bytes || 0), '📡');
      html += _statCard('Sessions', overview.activeSessions || 0, '👥');
      html += '</div>';

      // ── System Info Bar ──
      if (sysInfo.version || sysInfo.uptime) {
        const upHours = sysInfo.uptime ? Math.round(sysInfo.uptime / 3600 * 10) / 10 : 0;
        const memMB = sysInfo.memory ? Math.round(sysInfo.memory.rss / 1048576) : 0;
        const dbMB = sysInfo.dbSize ? Math.round(sysInfo.dbSize / 1048576 * 10) / 10 : 0;
        html += `<div style="display:flex;gap:12px;flex-wrap:wrap;font-size:0.68rem;color:var(--text-muted);padding:6px 10px;background:var(--bg-inset);border-radius:6px">
          ${sysInfo.version ? `<span>Version: <strong>${sysInfo.version}</strong></span>` : ''}
          <span>Uptime: <strong>${upHours}h</strong></span>
          <span>Memory: <strong>${memMB} MB</strong></span>
          <span>DB: <strong>${dbMB} MB</strong></span>
          <span>Node: <strong>${sysInfo.nodeVersion || process?.version || '?'}</strong></span>
        </div>`;
      }

      // ── Print Success/Failure Chart ──
      if (_history.length > 0) {
        html += `<div class="settings-card" style="overflow:hidden">
          <div class="card-title">Print History — Last ${totalPrints} prints</div>
          <div style="display:flex;gap:2px;height:30px;border-radius:4px;overflow:hidden">
            ${_history.slice(0, 50).map(h => {
              const color = h.status === 'completed' ? 'var(--accent-green)' : h.status === 'failed' ? 'var(--accent-red)' : h.status === 'cancelled' ? 'var(--accent-orange)' : 'var(--bg-tertiary)';
              const dur = h.duration_seconds ? Math.round(h.duration_seconds / 60) + 'm' : '';
              return `<div style="flex:1;background:${color};min-width:4px" title="${h.filename || '?'} — ${h.status} ${dur}"></div>`;
            }).join('')}
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:0.6rem;color:var(--text-muted)">
            <span>✅ ${successPrints} completed</span>
            <span>❌ ${failedPrints} failed</span>
            <span>⏹ ${_history.filter(h => h.status === 'cancelled').length} cancelled</span>
          </div>
        </div>`;
      }

      // ── Printer Utilization ──
      if (_printers.length > 0) {
        html += `<div class="settings-card" style="overflow:hidden">
          <div class="card-title">Printers (${onlinePrinters}/${totalPrinters} online)</div>
          <div style="display:flex;flex-direction:column;gap:4px">
            ${_printers.map(p => {
              const state = window.printerState?.printers?.[p.id];
              const gState = state?.gcode_state || 'OFFLINE';
              const color = gState === 'RUNNING' ? 'var(--accent-green)' : gState === 'IDLE' ? 'var(--accent-blue)' : gState === 'PAUSE' ? 'var(--accent-orange)' : 'var(--accent-red)';
              const pct = state?.mc_percent || 0;
              return `<div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:var(--bg-inset);border-radius:4px;font-size:0.72rem">
                <span style="width:8px;height:8px;border-radius:50%;background:${color}"></span>
                <span style="flex:1;font-weight:500">${p.name}</span>
                <span style="color:${color};font-size:0.65rem">${gState}</span>
                ${gState === 'RUNNING' ? `<span style="font-weight:600">${pct}%</span>` : ''}
              </div>`;
            }).join('')}
          </div>
        </div>`;
      }

      // ── Filament Inventory Summary ──
      if (_filament.length > 0) {
        const byMaterial = {};
        for (const f of _filament) { const m = f.type || f.material || f.filament_type || 'Unknown'; byMaterial[m] = (byMaterial[m] || 0) + 1; }
        html += `<div class="settings-card" style="overflow:hidden">
          <div class="card-title">Filament Inventory (${_filament.length} spools)</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${Object.entries(byMaterial).sort((a, b) => b[1] - a[1]).map(([mat, count]) =>
              `<span style="padding:2px 8px;border-radius:12px;background:var(--bg-inset);font-size:0.68rem">${mat}: <strong>${count}</strong></span>`
            ).join('')}
          </div>
        </div>`;
      }

      // ── Recent Errors ──
      if (_printErrors.length > 0) {
        html += `<div class="settings-card" style="overflow:hidden">
          <div class="card-title" style="color:var(--accent-red)">Recent Errors (${_printErrors.length})</div>
          <div style="max-height:200px;overflow-y:auto">
            ${_printErrors.slice(0, 15).map(e => {
              const ctx = typeof e.context === 'string' ? (() => { try { return JSON.parse(e.context); } catch { return {}; } })() : (e.context || {});
              const wikiUrl = ctx.wiki_url || '';
              const filename = ctx.filename || '';
              const date = new Date(e.created_at || e.timestamp);
              const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const severity = e.severity || 'warning';
              const sevColor = severity === 'error' || severity === 'critical' ? 'var(--accent-red)' : 'var(--accent-orange)';
              return `<div style="padding:6px 0;border-bottom:1px solid var(--border-subtle)">
                <div style="display:flex;align-items:center;gap:6px;font-size:0.72rem">
                  <span style="width:8px;height:8px;border-radius:50%;background:${sevColor};flex-shrink:0"></span>
                  <span style="font-weight:600">${e.code || 'Error'}</span>
                  <span class="text-muted" style="margin-left:auto;font-size:0.6rem">${dateStr}</span>
                </div>
                ${filename ? `<div style="font-size:0.6rem;color:var(--text-muted);margin-top:2px;margin-left:14px">File: ${filename}</div>` : ''}
                ${wikiUrl ? `<a href="${wikiUrl}" target="_blank" style="font-size:0.6rem;color:var(--accent-blue);margin-left:14px;text-decoration:none">📖 View on Bambu Wiki →</a>` : ''}
              </div>`;
            }).join('')}
          </div>
        </div>`;
      }

      // ── Requests per Hour Chart ──
      html += `<div class="settings-card" style="overflow:hidden">
        <div class="card-title">Requests per Hour (7 days)</div>
        <canvas id="analytics-hourly-chart" width="400" height="160" style="width:100%;height:160px;display:block"></canvas>
      </div>`;

      // ── Grid for details ──
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px">';

      // ── Top Endpoints ──
      html += `<div class="settings-card" style="overflow:hidden">
        <div class="card-title">Top Endpoints (24h) ${!topEndpoints.length ? '<span style="font-size:0.6rem;color:var(--text-muted)">— collecting data, refresh in 1 min</span>' : ''}</div>
        <div style="max-height:250px;overflow-y:auto">
          ${topEndpoints.length ? topEndpoints.map((ep, i) => `
            <div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:0.72rem;border-bottom:1px solid var(--border-subtle)">
              <span style="width:20px;text-align:right;color:var(--text-muted)">${i + 1}</span>
              <span style="flex:1;font-family:monospace;font-size:0.65rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${ep.endpoint}</span>
              <span style="font-weight:600;min-width:40px;text-align:right">${ep.hits}</span>
              ${ep.errors > 0 ? `<span style="color:var(--accent-red);font-size:0.6rem">${ep.errors}err</span>` : ''}
              <span style="color:var(--text-muted);font-size:0.6rem;min-width:35px;text-align:right">${ep.avgMs}ms</span>
            </div>`).join('') : '<div class="text-muted" style="padding:8px;font-size:0.72rem">No data yet — analytics collect after first hour</div>'}
        </div>
      </div>`;

      // ── Device/Browser Breakdown ──
      html += `<div class="settings-card" style="overflow:hidden">
        <div class="card-title">Devices & Browsers</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div>
            <div style="font-size:0.72rem;font-weight:600;margin-bottom:4px">Devices</div>
            ${Object.entries(overview.devices || {}).filter(([,v]) => v > 0).map(([type, count]) => `
              <div style="display:flex;justify-content:space-between;font-size:0.68rem;padding:2px 0">
                <span>${type}</span><strong>${count}</strong>
              </div>`).join('') || '<div class="text-muted" style="font-size:0.68rem">No data</div>'}
          </div>
          <div>
            <div style="font-size:0.72rem;font-weight:600;margin-bottom:4px">Browsers</div>
            ${Object.entries(overview.browsers || {}).filter(([,v]) => v > 0).map(([name, count]) => `
              <div style="display:flex;justify-content:space-between;font-size:0.68rem;padding:2px 0">
                <span>${name}</span><strong>${count}</strong>
              </div>`).join('') || '<div class="text-muted" style="font-size:0.68rem">No data</div>'}
          </div>
        </div>
      </div>`;

      // ── Active Sessions ──
      html += `<div class="settings-card" style="overflow:hidden">
        <div class="card-title">Active Sessions (last hour)</div>
        <div style="max-height:200px;overflow-y:auto">
          ${sessions.length ? sessions.map(s => `
            <div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:0.68rem;border-bottom:1px solid var(--border-subtle)">
              <span style="width:8px;height:8px;border-radius:50%;background:var(--accent-green)"></span>
              <span style="flex:1;font-family:monospace">${s.ip}</span>
              <span class="text-muted">${s.device_type}</span>
              <span style="font-weight:600">${s.hits} hits</span>
            </div>`).join('') : '<div class="text-muted" style="padding:8px;font-size:0.72rem">No active sessions</div>'}
        </div>
      </div>`;

      // ── Error Breakdown ──
      if (errors.length > 0) {
        html += `<div class="settings-card" style="overflow:hidden">
          <div class="card-title" style="color:var(--accent-red)">Error Endpoints (24h)</div>
          ${errors.map(e => `
            <div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:0.68rem">
              <span style="color:var(--accent-red);font-weight:600;min-width:25px">${e.count}×</span>
              <span style="font-family:monospace;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.endpoint}</span>
            </div>`).join('')}
        </div>`;
      }

      // ── WebSocket Stats ──
      html += `<div class="settings-card" style="overflow:hidden">
        <div class="card-title">WebSocket & Camera</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:0.72rem">
          <div style="padding:6px;background:var(--bg-inset);border-radius:4px">WS Connections: <strong>${overview.websocket?.connections || 0}</strong></div>
          <div style="padding:6px;background:var(--bg-inset);border-radius:4px">Messages In: <strong>${overview.websocket?.messagesIn || 0}</strong></div>
          <div style="padding:6px;background:var(--bg-inset);border-radius:4px">Messages Out: <strong>${overview.websocket?.messagesOut || 0}</strong></div>
          <div style="padding:6px;background:var(--bg-inset);border-radius:4px">WS Bytes: <strong>${_fmtBytes((overview.websocket?.bytesIn || 0) + (overview.websocket?.bytesOut || 0))}</strong></div>
        </div>
        ${Object.keys(overview.camera || {}).length > 0 ? `
          <div style="margin-top:8px;font-size:0.72rem;font-weight:600">Camera Streams</div>
          ${Object.entries(overview.camera).map(([pid, stats]) => `
            <div style="display:flex;justify-content:space-between;font-size:0.68rem;padding:2px 0">
              <span>${pid}</span><span>${stats.streams} streams · ${_fmtBytes(stats.bytes)}</span>
            </div>`).join('')}
        ` : ''}
      </div>`;

      // ── OS Breakdown ──
      html += `<div class="settings-card" style="overflow:hidden">
        <div class="card-title">Operating Systems</div>
        ${Object.entries(overview.os || {}).filter(([,v]) => v > 0).map(([name, count]) => `
          <div style="display:flex;justify-content:space-between;font-size:0.68rem;padding:2px 0">
            <span>${name}</span><strong>${count}</strong>
          </div>`).join('') || '<div class="text-muted" style="font-size:0.68rem">No data</div>'}
      </div>`;

      html += '</div>'; // close detail grid
      html += '</div>'; // close analytics-layout
      panel.innerHTML = html;

      // Draw hourly chart
      setTimeout(() => _drawHourlyChart(hourly), 100);

    } catch (e) {
      panel.innerHTML = `<div class="alert alert-danger" style="margin:20px">Analytics error: ${e.message}</div>`;
    }
  }

  function _drawHourlyChart(hourly) {
    const canvas = document.getElementById('analytics-hourly-chart');
    if (!canvas || !hourly.length) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const pad = { top: 10, right: 10, bottom: 20, left: 40 };

    ctx.clearRect(0, 0, W, H);

    const maxReq = Math.max(...hourly.map(h => h.requests), 1);
    const graphW = W - pad.left - pad.right;
    const graphH = H - pad.top - pad.bottom;
    const barW = Math.max(2, graphW / hourly.length - 1);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (graphH / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '9px monospace'; ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxReq * (1 - i / 4)), pad.left - 4, y + 3);
    }

    // Bars
    for (let i = 0; i < hourly.length; i++) {
      const h = hourly[i];
      const barH = (h.requests / maxReq) * graphH;
      const x = pad.left + (i / hourly.length) * graphW;
      const y = pad.top + graphH - barH;

      ctx.fillStyle = h.errors > 0 ? 'rgba(255,82,82,0.7)' : 'rgba(0,230,118,0.5)';
      ctx.fillRect(x, y, barW, barH);
    }
  }

  function _statCard(label, value, icon, color) {
    return `<div class="settings-card" style="padding:10px;text-align:center">
      <div style="font-size:1.4rem">${icon}</div>
      <div style="font-size:1.1rem;font-weight:700;${color ? 'color:' + color : ''}">${value}</div>
      <div style="font-size:0.65rem;color:var(--text-muted)">${label}</div>
    </div>`;
  }

  function _fmtBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1073741824).toFixed(2) + ' GB';
  }
})();
