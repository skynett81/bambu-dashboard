// Speed Control — stats strip widget with slider + presets, per-printer aware
(function() {
  const PRESET_MAP = { 1: 50, 2: 100, 3: 124, 4: 166 };
  let _rendered = false;
  let _lastPrinterId = null;

  function renderStrip(container, data) {
    const meta = window.printerState.getActivePrinterMeta();
    const name = meta?.name || '';
    const spdLvl = data.spd_lvl || 2;
    const spdMag = data.spd_mag || 100;

    container.innerHTML = `
      <div class="strip-speed-top">
        <span class="strip-speed-pct" id="strip-speed-pct">${spdMag}%</span>
        ${name ? `<span class="strip-speed-printer" id="strip-speed-printer">${window.esc(name)}</span>` : ''}
      </div>
      <input type="range" class="strip-speed-slider" id="strip-speed-slider" min="50" max="166" value="${spdMag}"
             oninput="previewStripSpeed(this.value)" onchange="applyStripSpeed(this.value)">
      <div class="speed-buttons" id="speed-buttons">
        <button class="speed-btn ${spdLvl === 1 ? 'active' : ''}" data-level="1" onclick="setStripPreset(1)">${t('speed.silent')}</button>
        <button class="speed-btn ${spdLvl === 2 ? 'active' : ''}" data-level="2" onclick="setStripPreset(2)">${t('speed.standard')}</button>
        <button class="speed-btn ${spdLvl === 3 ? 'active' : ''}" data-level="3" onclick="setStripPreset(3)">${t('speed.sport')}</button>
        <button class="speed-btn ${spdLvl === 4 ? 'active' : ''}" data-level="4" onclick="setStripPreset(4)">${t('speed.ludicrous')}</button>
      </div>`;
    _rendered = true;
  }

  function updateInPlace(data) {
    const spdLvl = data.spd_lvl || 2;
    const spdMag = data.spd_mag || 100;

    // Update slider (skip if user is dragging)
    const slider = document.getElementById('strip-speed-slider');
    if (slider && !slider.matches(':active')) slider.value = spdMag;

    // Update pct label
    const pct = document.getElementById('strip-speed-pct');
    if (pct) pct.textContent = `${spdMag}%`;

    // Update active button
    document.querySelectorAll('#speed-buttons .speed-btn').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.level) === spdLvl);
    });

    // Update printer name
    const tag = document.getElementById('strip-speed-printer');
    if (tag) {
      const meta = window.printerState.getActivePrinterMeta();
      if (meta?.name) tag.textContent = meta.name;
    }
  }

  window.updateSpeedControl = function(data) {
    const container = document.getElementById('strip-speed');
    if (!container) return;

    const printerId = window.printerState.getActivePrinterId();

    // Re-render on printer switch or first load
    if (!_rendered || printerId !== _lastPrinterId) {
      renderStrip(container, data);
      _lastPrinterId = printerId;
    } else {
      updateInPlace(data);
    }
  };

  // Slider preview (oninput — no command sent yet)
  window.previewStripSpeed = function(val) {
    const pct = document.getElementById('strip-speed-pct');
    if (pct) pct.textContent = `${val}%`;
  };

  // Slider change (onchange — snap to nearest preset and send)
  window.applyStripSpeed = function(val) {
    const pct = parseInt(val);
    let bestLvl = 2, bestDist = Infinity;
    for (const [lvl, target] of Object.entries(PRESET_MAP)) {
      const dist = Math.abs(pct - target);
      if (dist < bestDist) { bestDist = dist; bestLvl = parseInt(lvl); }
    }
    sendCommand('speed', { value: bestLvl });
  };

  // Preset button click
  window.setStripPreset = function(level) {
    sendCommand('speed', { value: level });
    const slider = document.getElementById('strip-speed-slider');
    const val = PRESET_MAP[level] || 100;
    if (slider) slider.value = val;
    const pct = document.getElementById('strip-speed-pct');
    if (pct) pct.textContent = `${val}%`;
  };
})();
