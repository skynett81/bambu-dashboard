// Camera View - jsmpeg MPEG1 player with multi-printer support + fullscreen
(function() {
  let player = null;
  let fullscreenPlayer = null;
  let currentPort = null;
  let streamActive = false;

  function initCamera(port) {
    if (!port) {
      const meta = window.printerState.getActivePrinterMeta();
      port = meta.cameraPort || null;
    }

    const container = document.getElementById('camera-container');
    if (!container) return;

    // Check if RTSP is disabled on this printer (e.g. P2S)
    const printerId = window.printerState?.getActivePrinterId();
    const ps = printerId ? window.printerState?._printers?.[printerId] : null;
    const pd = ps?.print || ps;
    if (pd?.ipcam?.rtsp_url === 'disable') {
      if (player) { try { player.destroy(); } catch(e) {} player = null; }
      currentPort = null;
      streamActive = false;
      showRtspDisabled(container);
      return;
    }

    // No camera port configured — show placeholder, don't connect
    if (!port) {
      if (player) {
        try { player.destroy(); } catch(e) {}
        player = null;
      }
      currentPort = null;
      streamActive = false;
      showPlaceholder(container);
      return;
    }

    if (port === currentPort && player) return;
    currentPort = port;

    if (typeof JSMpeg === 'undefined') {
      showPlaceholder(container);
      return;
    }

    if (player) {
      try { player.destroy(); } catch(e) {}
      player = null;
    }
    streamActive = false;

    const wsUrl = `ws://${location.hostname}:${port}`;

    // Probe the WebSocket first — only create JSMpeg player if it connects
    let probe;
    try {
      probe = new WebSocket(wsUrl);
    } catch(e) {
      showPlaceholder(container);
      return;
    }

    const probeTimeout = setTimeout(() => {
      probe.close();
      showPlaceholder(container);
    }, 3000);

    probe.onopen = () => {
      clearTimeout(probeTimeout);
      probe.close();
      startPlayer(container, wsUrl);
    };

    probe.onerror = () => {
      clearTimeout(probeTimeout);
      showPlaceholder(container);
    };
  }

  function startPlayer(container, wsUrl) {
    try {
      container.innerHTML = '';
      const canvas = document.createElement('canvas');
      canvas.className = 'camera-canvas';
      container.appendChild(canvas);

      // Fullscreen button overlay
      const overlay = document.createElement('div');
      overlay.className = 'camera-overlay';
      const fullscreenTitle = t('camera.fullscreen');
      overlay.innerHTML = `
        <button class="camera-fullscreen-btn" title="${fullscreenTitle}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
          </svg>
        </button>`;
      overlay.querySelector('.camera-fullscreen-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openFullscreen();
      });
      container.appendChild(overlay);

      // Click anywhere on camera to open fullscreen
      container.style.cursor = 'pointer';
      container.onclick = () => { if (streamActive) openFullscreen(); };

      player = new JSMpeg.Player(wsUrl, {
        canvas: canvas,
        autoplay: true,
        audio: false,
        loop: false,
        onSourceEstablished: () => {
          console.log('[kamera] Stream tilkoblet');
          streamActive = true;
        },
        onSourceCompleted: () => {
          console.log('[kamera] Stream avsluttet');
          streamActive = false;
          showPlaceholder(container);
        }
      });
    } catch (e) {
      console.warn('[kamera] Kunne ikke starte:', e.message);
      showPlaceholder(container);
    }
  }

  function showPlaceholder(container) {
    container.innerHTML = `
      <div class="camera-placeholder">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="2" y="6" width="15" height="12" rx="2"/>
          <path d="M17 10l4-2v8l-4-2z"/>
        </svg>
        <span>${t('camera.not_available')}</span>
      </div>`;
    container.style.cursor = 'default';
  }

  function showRtspDisabled(container) {
    container.innerHTML = `
      <div class="camera-placeholder">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="2" y="6" width="15" height="12" rx="2"/>
          <path d="M17 10l4-2v8l-4-2z"/>
          <line x1="1" y1="1" x2="23" y2="23" stroke-width="2"/>
        </svg>
        <span>${t('camera.rtsp_disabled')}</span>
        <span class="camera-hint">${t('camera.rtsp_disabled_hint')}</span>
      </div>`;
    container.style.cursor = 'default';
  }

  function getStreamUrl() {
    if (!currentPort) return null;
    return `ws://${location.hostname}:${currentPort}`;
  }

  function openFullscreen() {
    if (!currentPort) return;
    const modal = document.getElementById('camera-modal');
    if (!modal) return;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const fsContainer = document.getElementById('camera-fullscreen-container');
    fsContainer.innerHTML = '';

    const canvas = document.createElement('canvas');
    canvas.className = 'camera-canvas-fullscreen';
    fsContainer.appendChild(canvas);

    // Stream link bar
    const streamUrl = getStreamUrl();
    const linkBar = document.getElementById('camera-stream-link');
    if (linkBar && streamUrl) {
      linkBar.style.display = '';
      const urlEl = linkBar.querySelector('.camera-stream-url');
      if (urlEl) urlEl.textContent = streamUrl;
      const copyBtn = linkBar.querySelector('.camera-copy-btn');
      if (copyBtn) {
        copyBtn.onclick = () => {
          navigator.clipboard.writeText(streamUrl).then(() => {
            copyBtn.textContent = t('camera.copied') || 'Kopiert!';
            setTimeout(() => { copyBtn.textContent = t('camera.copy') || 'Kopier'; }, 1500);
          });
        };
      }
    }

    const wsUrl = `ws://${location.hostname}:${currentPort}`;

    try {
      fullscreenPlayer = new JSMpeg.Player(wsUrl, {
        canvas: canvas,
        autoplay: true,
        audio: false,
        loop: false,
        onSourceCompleted: () => {
          fsContainer.innerHTML = `<div class="camera-placeholder"><span>${t('camera.stream_ended')}</span></div>`;
        }
      });
    } catch (e) {
      fsContainer.innerHTML = `<div class="camera-placeholder"><span>${t('camera.connect_failed')}</span></div>`;
    }
  }

  function closeFullscreen() {
    const modal = document.getElementById('camera-modal');
    if (!modal) return;

    modal.classList.remove('active');
    document.body.style.overflow = '';

    if (fullscreenPlayer) {
      try { fullscreenPlayer.destroy(); } catch(e) {}
      fullscreenPlayer = null;
    }

    const linkBar = document.getElementById('camera-stream-link');
    if (linkBar) linkBar.style.display = 'none';
  }

  window.closeCameraModal = closeFullscreen;

  // Switch camera when printer changes
  window.switchCamera = function(port) {
    // Close fullscreen if open when switching printer
    closeFullscreen();
    initCamera(port);
  };

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => initCamera(), 1000);

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeFullscreen();
        close3dFullscreen();
      }
    });

    // Close on backdrop click
    const modal = document.getElementById('camera-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeFullscreen();
      });
    }

    const modal3d = document.getElementById('model-modal');
    if (modal3d) {
      modal3d.addEventListener('click', (e) => {
        if (e.target === modal3d) close3dFullscreen();
      });
    }
  });

  // ═══ 3D View Fullscreen Modal ═══
  let _fsViewer = null;
  let _fsAnimId = null;
  let _fsMwMode = false;

  function getActiveFilamentColorHex(pd) {
    if (!pd?.ams?.ams) return null;
    const activeTrayId = pd.ams.tray_now;
    if (activeTrayId == null) return null;
    for (const unit of pd.ams.ams) {
      const tray = (unit.tray || []).find(t => String(t.id) === String(activeTrayId));
      if (tray?.tray_color) return tray.tray_color;
    }
    return null;
  }

  function open3dFullscreen() {
    const modal = document.getElementById('model-modal');
    if (!modal) return;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const container = document.getElementById('model-fullscreen-container');
    container.innerHTML = '';

    const printerId = window.printerState?.getActivePrinterId();
    const ps = printerId ? window.printerState?._printers?.[printerId] : null;
    const pd = ps?.print || ps;
    const fname = pd?.subtask_name || pd?.gcode_file || '';

    // Update header
    const titleEl = modal.querySelector('.camera-modal-title');
    if (titleEl) titleEl.textContent = fname ? fname.replace(/\.(3mf|gcode)$/i, '') : t('model.preview');

    // Detect what the small progress card is currently showing
    const mwContainer = document.getElementById('print-mw-container');
    const mwImage = document.getElementById('print-mw-image');
    const smallCanvas = document.getElementById('print-model-canvas');
    const isMwActive = mwContainer && mwContainer.style.display !== 'none' && mwImage && mwImage.src && mwImage.src !== location.href;
    const is3dActive = smallCanvas && smallCanvas.style.display !== 'none';

    if (isMwActive) {
      // Mirror the MakerWorld image view with progress reveal
      _fsMwMode = true;
      _showMwFullscreen(container, mwImage.src, pd);
    } else if (is3dActive && printerId) {
      // Mirror the 3D model view
      _fsMwMode = false;
      _show3dFullscreen(container, printerId, pd);
    } else {
      container.innerHTML = `<div class="camera-placeholder"><span>${t('model.not_available')}</span></div>`;
      return;
    }

    // Start real-time update loop (works for both modes)
    startFsUpdateLoop();
  }

  function _showMwFullscreen(container, imageSrc, pd) {
    const pct = pd?.total_layer_num > 0 ? ((pd.layer_num || 0) / pd.total_layer_num) * 100 : 0;
    const clipTop = 100 - pct;

    container.innerHTML = `
      <div class="fs-mw-wrap">
        <img class="fs-mw-bg" src="${imageSrc}" alt="">
        <img class="fs-mw-reveal" id="fs-mw-reveal" src="${imageSrc}" alt="" style="clip-path:inset(${clipTop}% 0 0 0)">
        <div class="fs-mw-edge" id="fs-mw-edge" style="bottom:${pct}%"></div>
        <div class="fs-mw-hud">
          <span class="fs-mw-pct" id="fs-mw-pct">${Math.round(pct)}%</span>
        </div>
      </div>`;

    // Tint edge with filament color
    const hex = getActiveFilamentColorHex(pd);
    if (hex) {
      const edge = document.getElementById('fs-mw-edge');
      const c = '#' + hex.substring(0, 6);
      if (edge) { edge.style.background = c; edge.style.boxShadow = `0 0 16px ${c}, 0 0 6px ${c}`; }
    }
  }

  function _show3dFullscreen(container, printerId, pd) {
    const canvas = document.createElement('canvas');
    canvas.className = 'camera-canvas-fullscreen';
    canvas.style.touchAction = 'none';
    canvas.style.cursor = 'grab';
    container.appendChild(canvas);

    if (typeof window.ModelViewer === 'undefined') {
      container.innerHTML = `<div class="camera-placeholder"><span>${t('model.not_available')}</span></div>`;
      return;
    }

    fetch(`/api/model/${printerId}`)
      .then(res => {
        if (!res.ok) throw new Error('No model');
        return res.json();
      })
      .then(model => {
        _fsViewer = new window.ModelViewer(canvas);
        const hex = getActiveFilamentColorHex(pd);
        if (hex) {
          model.color = [
            parseInt(hex.substring(0, 2), 16) / 255,
            parseInt(hex.substring(2, 4), 16) / 255,
            parseInt(hex.substring(4, 6), 16) / 255
          ];
        }
        _fsViewer.loadModel(model);
        const layer = pd?.layer_num || 0;
        const total = pd?.total_layer_num || 0;
        if (total > 0) _fsViewer.setProgress(layer / total);
      })
      .catch(() => {
        container.innerHTML = `<div class="camera-placeholder"><span>${t('model.not_available')}</span></div>`;
      });
  }

  function startFsUpdateLoop() {
    if (_fsAnimId) cancelAnimationFrame(_fsAnimId);

    function update() {
      const modal = document.getElementById('model-modal');
      if (!modal || !modal.classList.contains('active')) return;

      const printerId = window.printerState?.getActivePrinterId();
      const ps = printerId ? window.printerState?._printers?.[printerId] : null;
      const pd = ps?.print || ps;
      if (!pd) { _fsAnimId = requestAnimationFrame(update); return; }

      const layer = pd.layer_num || 0;
      const total = pd.total_layer_num || 0;
      const pct = total > 0 ? (layer / total) * 100 : 0;

      if (_fsMwMode) {
        // Update MakerWorld reveal
        const reveal = document.getElementById('fs-mw-reveal');
        const edge = document.getElementById('fs-mw-edge');
        const pctEl = document.getElementById('fs-mw-pct');
        const clipTop = 100 - pct;
        if (reveal) reveal.style.clipPath = `inset(${clipTop}% 0 0 0)`;
        if (edge) edge.style.bottom = pct + '%';
        if (pctEl) pctEl.textContent = Math.round(pct) + '%';

        // Update edge color from active filament
        const hex = getActiveFilamentColorHex(pd);
        if (hex && edge) {
          const c = '#' + hex.substring(0, 6);
          edge.style.background = c;
          edge.style.boxShadow = `0 0 16px ${c}, 0 0 6px ${c}`;
        }
      } else if (_fsViewer) {
        if (total > 0) _fsViewer.setProgress(layer / total);
      }

      _fsAnimId = requestAnimationFrame(update);
    }
    _fsAnimId = requestAnimationFrame(update);
  }

  function close3dFullscreen() {
    const modal = document.getElementById('model-modal');
    if (!modal) return;

    modal.classList.remove('active');
    document.body.style.overflow = '';

    if (_fsAnimId) { cancelAnimationFrame(_fsAnimId); _fsAnimId = null; }
    if (_fsViewer) { _fsViewer.destroy(); _fsViewer = null; }
    _fsMwMode = false;
  }

  window.open3dFullscreen = open3dFullscreen;
  window.close3dFullscreen = close3dFullscreen;
})();
