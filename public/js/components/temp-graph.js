/**
 * Temperature Graph — live Canvas chart showing nozzle, bed, chamber temps over time.
 * Auto-updates from WebSocket state data. Last 10 minutes at 2-second intervals.
 */
(function() {
  'use strict';

  const MAX_POINTS = 300; // 10 min at 2s intervals
  const _tempData = { nozzle: [], bed: [], chamber: [], nozzle_target: [], bed_target: [] };
  let _graphTimer = null;

  window.renderTempGraph = function() {
    return `<div class="ctrl-card" id="temp-graph-card">
      <div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        Temperature History
      </div>
      <canvas id="temp-graph-canvas" width="400" height="150" style="width:100%;height:150px;border-radius:6px;background:var(--bg-inset)"></canvas>
      <div style="display:flex;gap:10px;margin-top:4px;font-size:0.65rem;flex-wrap:wrap">
        <span style="color:#ff6b6b">● Nozzle</span>
        <span style="color:#ff6b6b;opacity:0.4">- - Target</span>
        <span style="color:#4ecdc4">● Bed</span>
        <span style="color:#4ecdc4;opacity:0.4">- - Target</span>
        <span style="color:#ffe66d">● Chamber</span>
      </div>
    </div>`;
  };

  window.updateTempGraph = function(data) {
    // Push new data points
    _tempData.nozzle.push(data.nozzle_temper ?? null);
    _tempData.bed.push(data.bed_temper ?? null);
    _tempData.chamber.push(data.chamber_temper ?? null);
    _tempData.nozzle_target.push(data.nozzle_target_temper ?? null);
    _tempData.bed_target.push(data.bed_target_temper ?? null);

    // Trim to max
    for (const key of Object.keys(_tempData)) {
      if (_tempData[key].length > MAX_POINTS) _tempData[key].shift();
    }

    // Redraw (throttled to every 2s)
    if (!_graphTimer) {
      _graphTimer = setTimeout(() => { _drawGraph(); _graphTimer = null; }, 2000);
    }
  };

  function _drawGraph() {
    const canvas = document.getElementById('temp-graph-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const pad = { top: 10, right: 40, bottom: 20, left: 5 };

    ctx.clearRect(0, 0, W, H);

    // Find Y range
    let yMin = 0, yMax = 50;
    for (const key of Object.keys(_tempData)) {
      for (const val of _tempData[key]) {
        if (val !== null && val > yMax) yMax = val;
      }
    }
    yMax = Math.ceil(yMax / 50) * 50 + 20;

    const graphW = W - pad.left - pad.right;
    const graphH = H - pad.top - pad.bottom;

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let temp = 50; temp < yMax; temp += 50) {
      const y = pad.top + graphH - (temp / yMax * graphH);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(W - pad.right, y);
      ctx.stroke();
      // Label
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${temp}°`, W - pad.right + 4, y + 3);
    }

    // Draw lines
    const series = [
      { data: _tempData.nozzle_target, color: 'rgba(255,107,107,0.3)', dash: [4, 4] },
      { data: _tempData.bed_target, color: 'rgba(78,205,196,0.3)', dash: [4, 4] },
      { data: _tempData.nozzle, color: '#ff6b6b', dash: [] },
      { data: _tempData.bed, color: '#4ecdc4', dash: [] },
      { data: _tempData.chamber, color: '#ffe66d', dash: [] },
    ];

    for (const s of series) {
      const points = s.data;
      if (points.length < 2) continue;

      ctx.beginPath();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.dash.length ? 1 : 1.5;
      ctx.setLineDash(s.dash);

      let started = false;
      for (let i = 0; i < points.length; i++) {
        if (points[i] === null || points[i] === undefined) continue;
        const x = pad.left + (i / MAX_POINTS) * graphW;
        const y = pad.top + graphH - (points[i] / yMax * graphH);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Current values at right edge
    const latest = {
      nozzle: _tempData.nozzle[_tempData.nozzle.length - 1],
      bed: _tempData.bed[_tempData.bed.length - 1],
      chamber: _tempData.chamber[_tempData.chamber.length - 1],
    };
    ctx.font = 'bold 10px monospace';
    let labelY = pad.top + 12;
    if (latest.nozzle != null) { ctx.fillStyle = '#ff6b6b'; ctx.fillText(`${latest.nozzle}°`, W - pad.right + 4, labelY); labelY += 14; }
    if (latest.bed != null) { ctx.fillStyle = '#4ecdc4'; ctx.fillText(`${latest.bed}°`, W - pad.right + 4, labelY); labelY += 14; }
    if (latest.chamber != null) { ctx.fillStyle = '#ffe66d'; ctx.fillText(`${latest.chamber}°`, W - pad.right + 4, labelY); }
  }
})();
