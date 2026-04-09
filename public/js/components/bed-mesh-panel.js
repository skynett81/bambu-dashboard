/**
 * Bed Mesh Heatmap Visualization
 * Shows bed leveling mesh data as a color-coded 2D heatmap.
 * Works with all Klipper/Moonraker printers.
 *
 * SECTION INDEX:
 * Line ~10   renderBedMeshPanel — main render
 * Line ~80   _drawHeatmap — Canvas drawing
 */
(function() {
  'use strict';

  /**
   * Render bed mesh heatmap panel
   * @param {object} data — printer state with _bed_mesh
   * @returns {string} HTML
   */
  window.renderBedMeshPanel = function(data) {
    if (!data._bed_mesh || !data._bed_mesh.meshMatrix?.length) return '';

    const mesh = data._bed_mesh;
    const rows = mesh.meshMatrix.length;
    const cols = mesh.meshMatrix[0]?.length || 0;
    if (rows === 0 || cols === 0) return '';

    // Calculate min/max for color scaling
    let min = Infinity, max = -Infinity;
    for (const row of mesh.meshMatrix) {
      for (const val of row) {
        if (val < min) min = val;
        if (val > max) max = val;
      }
    }
    const range = Math.max(max - min, 0.01);
    const variance = Math.round(range * 1000) / 1000;

    let html = `<div class="ctrl-card">
      <div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
        Bed Mesh ${mesh.profileName ? '— ' + mesh.profileName : ''}
      </div>
      <div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <canvas id="bed-mesh-canvas" width="${cols * 40 + 20}" height="${rows * 40 + 20}" style="border-radius:6px;background:var(--bg-inset)"></canvas>
        <div style="font-size:0.72rem;color:var(--text-muted)">
          <div><strong>Points:</strong> ${rows}×${cols} (${rows * cols})</div>
          <div><strong>Range:</strong> ${min.toFixed(3)} to ${max.toFixed(3)} mm</div>
          <div><strong>Variance:</strong> <span style="color:${variance < 0.1 ? 'var(--accent-green)' : variance < 0.3 ? 'var(--accent-orange)' : 'var(--accent-red)'}">${variance} mm</span></div>
          ${mesh.meshMin ? `<div><strong>Area:</strong> ${mesh.meshMin[0]}–${mesh.meshMax[0]} × ${mesh.meshMin[1]}–${mesh.meshMax[1]} mm</div>` : ''}
          <div style="margin-top:6px;display:flex;align-items:center;gap:4px">
            <span style="width:12px;height:12px;background:linear-gradient(to right,#2196f3,#4caf50,#ff9800,#f44336);border-radius:2px"></span>
            Low → High
          </div>
        </div>
      </div>
      <button class="form-btn form-btn-sm" style="margin-top:6px;font-size:0.7rem" data-ripple onclick="sendGcode('BED_MESH_CALIBRATE')">Recalibrate</button>
    </div>`;

    // Draw heatmap after DOM insert
    setTimeout(() => _drawHeatmap(mesh.meshMatrix, min, max), 50);

    return html;
  };

  function _drawHeatmap(matrix, min, max) {
    const canvas = document.getElementById('bed-mesh-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rows = matrix.length;
    const cols = matrix[0].length;
    const cellW = 40;
    const cellH = 40;
    const pad = 10;
    const range = Math.max(max - min, 0.001);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = matrix[r][c];
        const t = (val - min) / range; // 0..1

        // Color gradient: blue(low) → green(mid) → orange → red(high)
        let red, green, blue;
        if (t < 0.25) {
          red = 0; green = Math.round(t * 4 * 200); blue = 200;
        } else if (t < 0.5) {
          red = 0; green = 200; blue = Math.round((0.5 - t) * 4 * 200);
        } else if (t < 0.75) {
          red = Math.round((t - 0.5) * 4 * 255); green = 200; blue = 0;
        } else {
          red = 255; green = Math.round((1 - t) * 4 * 200); blue = 0;
        }

        const x = pad + c * cellW;
        const y = pad + (rows - 1 - r) * cellH; // flip Y

        ctx.fillStyle = `rgb(${red},${green},${blue})`;
        ctx.fillRect(x, y, cellW - 2, cellH - 2);

        // Value label
        ctx.fillStyle = t > 0.4 && t < 0.6 ? '#000' : '#fff';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(val.toFixed(2), x + cellW / 2 - 1, y + cellH / 2 + 3);
      }
    }
  }

  /**
   * Update bed mesh if data changes
   */
  window.updateBedMeshPanel = function(data) {
    if (data._bed_mesh?.meshMatrix?.length) {
      let min = Infinity, max = -Infinity;
      for (const row of data._bed_mesh.meshMatrix) {
        for (const val of row) { if (val < min) min = val; if (val > max) max = val; }
      }
      _drawHeatmap(data._bed_mesh.meshMatrix, min, max);
    }
  };
})();
