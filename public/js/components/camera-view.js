// Camera View - jsmpeg MPEG1 player with multi-printer support + fullscreen
(function() {
  'use strict';

  function _isMobile() { return window.innerWidth <= 768; }

  // Mobile optimization settings
  const QUALITY_SETTINGS = {
    high:   { maxWidth: '100%',  interval: null },
    medium: { maxWidth: '480px', interval: 2000 },
    low:    { maxWidth: '320px', interval: 5000 }
  };

  let _jpegFrameCount = 0;

  let player = null;
  let fullscreenPlayer = null;
  let currentPort = null;
  let streamActive = false;
  let _reconnectTimer = null;
  let _reconnectAttempt = 0;
  const _maxReconnectAttempt = 15;
  let _staleTimer = null;
  let _lastFrameTs = 0;
  let _snapshotInterval = null; // For Moonraker SSH snapshot polling

  function _clearReconnect() {
    if (_reconnectTimer) { clearTimeout(_reconnectTimer); _reconnectTimer = null; }
    _reconnectAttempt = 0;
  }

  function _clearStaleTimer() {
    if (_staleTimer) { clearInterval(_staleTimer); _staleTimer = null; }
  }

  function _scheduleReconnect() {
    if (_reconnectAttempt >= _maxReconnectAttempt) return;
    _reconnectAttempt++;
    const delay = Math.min(2000 * _reconnectAttempt, 30000);
    console.log('[kamera] Reconnect om ' + (delay / 1000) + 's (forsøk ' + _reconnectAttempt + '/' + _maxReconnectAttempt + ')');
    _reconnectTimer = setTimeout(() => {
      initCamera(currentPort);
    }, delay);
  }

  function _showReconnecting(container) {
    let overlay = container.querySelector('.camera-reconnect-overlay');
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'camera-reconnect-overlay';
    overlay.innerHTML = `<div class="camera-reconnect-pulse"></div><span>${t('camera.reconnecting') || 'Reconnecting...'}</span>`;
    container.appendChild(overlay);
  }

  function _hideReconnecting(container) {
    const overlay = container.querySelector('.camera-reconnect-overlay');
    if (overlay) overlay.remove();
  }

  function initCamera(port) {
    if (!port) {
      const meta = window.printerState.getActivePrinterMeta();
      port = meta.cameraPort || null;
    }

    const container = document.getElementById('camera-container');
    if (!container) return;

    // No camera port configured — show placeholder, don't connect
    if (!port) {
      _cleanup();
      currentPort = null;
      streamActive = false;
      showPlaceholder(container);
      return;
    }

    if (port === currentPort && (player || _jpegWs || _snapshotInterval)) return;
    _cleanup();
    currentPort = port;
    _streamMode = null;
    streamActive = false;

    // Moonraker printers: use SSH snapshot image instead of WebSocket camera
    const meta = window.printerState?.getActivePrinterMeta?.();
    const pid = window.printerState?.getActivePrinterId?.();
    // Detect moonraker: meta.type, or no cameraPort assigned (moonraker skips Bambu camera)
    if (meta?.type === 'moonraker' || (pid && !meta?.cameraPort)) {
      _startSnapshotPlayer(container, pid || meta?.id);
      return;
    }

    const wsUrl = `ws://${location.hostname}:${port}`;

    // Single connection — detect mode from first message and keep playing
    startPlayer(container, wsUrl);
  }

  function _cleanup() {
    _clearReconnect();
    _clearStaleTimer();
    if (player) { try { player.destroy(); } catch(e) {} player = null; }
    if (_jpegWs) { try { _jpegWs.close(); } catch(e) {} _jpegWs = null; }
    if (_snapshotInterval) { clearInterval(_snapshotInterval); _snapshotInterval = null; }
  }

  let _streamMode = null; // 'jpeg', 'mpeg', or 'snapshot'
  let _jpegWs = null;

  function _startSnapshotPlayer(container, printerId) {
    _streamMode = 'snapshot';
    container.innerHTML = '';

    const img = document.createElement('img');
    img.className = 'camera-canvas';
    img.style.objectFit = 'contain';
    if (_isMobile()) {
      img.style.maxHeight = '240px';
    }
    container.appendChild(img);

    const overlay = _buildOverlay(container);
    container.appendChild(overlay);

    container.style.cursor = 'pointer';
    container.onclick = () => { if (streamActive) openFullscreen(); };

    const frameUrl = `/api/printers/${printerId}/frame.jpeg`;

    function refreshFrame() {
      // Cache-bust with timestamp
      img.src = frameUrl + '?t=' + Date.now();
    }

    img.onload = () => { streamActive = true; };
    img.onerror = () => {
      // Keep trying — printer may not be sending frames yet
      streamActive = false;
    };

    // Initial load + refresh every 3 seconds
    refreshFrame();
    _snapshotInterval = setInterval(refreshFrame, 3000);
  }

  function _buildOverlay(container) {
    const overlay = document.createElement('div');
    overlay.className = 'camera-overlay';
    const fullscreenTitle = t('camera.fullscreen');
    const screenshotTitle = t('camera.screenshot');
    overlay.innerHTML = `
      <button class="camera-screenshot-btn" title="${screenshotTitle}" aria-label="${screenshotTitle}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      </button>
      <button class="camera-fullscreen-btn" title="${fullscreenTitle}" aria-label="${fullscreenTitle}">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
      </button>`;
    overlay.querySelector('.camera-screenshot-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      _takeScreenshot(container);
    });
    overlay.querySelector('.camera-fullscreen-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openFullscreen();
    });
    return overlay;
  }

  function startPlayer(container, wsUrl) {
    try {
      container.innerHTML = '';

      // Skeleton loader while connecting
      const skeleton = document.createElement('div');
      skeleton.className = 'camera-skeleton';
      skeleton.innerHTML = `<div class="camera-skeleton-pulse"></div><span class="camera-skeleton-text">${t('camera.connecting')}</span>`;
      container.appendChild(skeleton);

      const overlay = _buildOverlay(container);

      // Click anywhere on camera to open fullscreen
      container.style.cursor = 'pointer';
      container.onclick = () => { if (streamActive) openFullscreen(); };

      // Single WebSocket — detect mode from first message, keep connection alive
      _streamMode = null;
      let ws;
      try {
        ws = new WebSocket(wsUrl);
      } catch(e) {
        showPlaceholder(container, 'probe_failed');
        _scheduleReconnect();
        return;
      }
      ws.binaryType = 'arraybuffer';

      let firstMessage = true;

      ws.onopen = () => {
        console.log('[kamera] WebSocket tilkoblet');
        _reconnectAttempt = 0; // Reset on successful connect
      };

      ws.onmessage = (e) => {
        // Text message = JSON error from server
        if (typeof e.data === 'string') {
          try {
            const msg = JSON.parse(e.data);
            if (msg.error === 'auth_denied') {
              console.log('[kamera] Auth avvist — LAN Live View deaktivert');
              _streamMode = 'error';
              ws.close();
              showPlaceholder(container, 'auth_denied');
              // Auth denied auto-resets on server after 60s — schedule reconnect
              _reconnectTimer = setTimeout(() => { initCamera(currentPort); }, 65000);
              return;
            }
            if (msg.error === 'stream_unavailable') {
              ws.close();
              showPlaceholder(container, 'stream_unavailable');
              _scheduleReconnect();
              return;
            }
          } catch {}
          return;
        }

        // First binary message — detect stream type
        if (firstMessage) {
          firstMessage = false;
          const data = new Uint8Array(e.data);

          if (data.length > 2 && data[0] === 0xFF && data[1] === 0xD8) {
            console.log('[kamera] JPEG-modus detektert');
            _streamMode = 'jpeg';
            // Reuse this WS for JPEG playback — don't open a new one
            _startJpegPlayerDirect(container, ws, overlay, e.data);
          } else {
            console.log('[kamera] MPEG-modus detektert');
            _streamMode = 'mpeg';
            // MPEG needs JSMpeg which manages its own WS — close this one
            ws.close();
            _startMpegPlayer(container, wsUrl, overlay);
          }
          return;
        }
      };

      ws.onerror = () => {
        if (!_streamMode) {
          showPlaceholder(container, 'probe_failed');
          _scheduleReconnect();
        }
      };

      ws.onclose = () => {
        if (!_streamMode) {
          // Never got first message — connection lost before detection
          showPlaceholder(container, 'probe_failed');
          _scheduleReconnect();
        }
      };

      // Timeout — no data in 8s means camera is not streaming
      setTimeout(() => {
        if (!_streamMode && ws.readyState <= 1) {
          ws.close();
          showPlaceholder(container, 'stream_unavailable');
          _scheduleReconnect();
        }
      }, 8000);
    } catch (e) {
      console.warn('[kamera] Kunne ikke starte:', e.message);
      showPlaceholder(container);
      _scheduleReconnect();
    }
  }

  function _removeSkeleton(container) {
    const sk = container.querySelector('.camera-skeleton');
    if (sk) sk.remove();
  }

  function _startJpegPlayer(container, wsUrl, overlay) {
    _removeSkeleton(container);
    container.innerHTML = '';
    const img = document.createElement('img');
    img.className = 'camera-canvas';
    img.style.objectFit = 'contain';
    if (_isMobile()) {
      img.style.maxHeight = '240px';
    }
    container.appendChild(img);
    container.appendChild(overlay);

    if (_jpegWs) { try { _jpegWs.close(); } catch {} }

    _jpegWs = new WebSocket(wsUrl);
    _jpegWs.binaryType = 'arraybuffer';

    _jpegWs.onopen = () => {
      console.log('[kamera] JPEG stream tilkoblet');
      streamActive = true;
    };

    _jpegWs.onmessage = (e) => {
      // Skip every other frame on mobile to reduce CPU/bandwidth usage
      if (_isMobile() && _jpegFrameCount++ % 2 !== 0) return;

      const blob = new Blob([e.data], { type: 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      const old = img.src;
      img.src = url;
      if (old && old.startsWith('blob:')) URL.revokeObjectURL(old);
    };

    _jpegWs.onclose = () => {
      console.log('[kamera] JPEG stream avsluttet');
      streamActive = false;
      _jpegWs = null;
    };

    _jpegWs.onerror = () => {
      streamActive = false;
      _jpegWs = null;
      showPlaceholder(container, 'probe_failed');
    };
  }

  function _startMpegPlayer(container, wsUrl, overlay) {
    _removeSkeleton(container);
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.className = 'camera-canvas';
    if (_isMobile()) {
      canvas.style.maxHeight = '240px';
    }
    container.appendChild(canvas);
    container.appendChild(overlay);

    player = new JSMpeg.Player(wsUrl, {
      canvas: canvas,
      autoplay: true,
      audio: false,
      loop: false,
      onSourceEstablished: () => {
        console.log('[kamera] MPEG stream tilkoblet');
        streamActive = true;
      },
      onSourceCompleted: () => {
        console.log('[kamera] MPEG stream avsluttet');
        streamActive = false;
        showPlaceholder(container);
      }
    });
  }

  function showPlaceholder(container, reason) {
    // Determine the specific reason for no camera
    const printerId = window.printerState?.getActivePrinterId();
    const meta = printerId ? window.printerState.getActivePrinterMeta() : {};
    const ps = printerId ? window.printerState?._printers?.[printerId] : null;
    const pd = ps?.print || ps;
    const hasPort = !!meta.cameraPort;
    const probeFailure = reason === 'probe_failed';

    const isAuthDenied = reason === 'auth_denied';
    let icon, title, hint, steps;

    if (!hasPort && !isAuthDenied) {
      // No camera port assigned — config/setup issue
      icon = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="2" y="6" width="15" height="12" rx="2"/>
        <path d="M17 10l4-2v8l-4-2z"/>
      </svg>`;
      title = t('camera.not_available');
      hint = t('camera.setup_hint');
      steps = null;
    } else {
      // Auth denied or stream failed — LAN Live View needs to be enabled
      icon = `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-yellow, #e3b341)" stroke-width="1.5">
        <rect x="2" y="6" width="15" height="12" rx="2"/>
        <path d="M17 10l4-2v8l-4-2z"/>
        <line x1="2" y1="2" x2="22" y2="22" stroke-width="2" stroke="var(--accent-red, #f85149)"/>
      </svg>`;
      title = isAuthDenied ? t('camera.auth_denied') : t('camera.stream_unavailable');
      hint = t('camera.lan_liveview_hint');
      steps = `
        <div class="camera-setup-steps">
          <div class="camera-step">
            <span class="camera-step-num">1</span>
            <span>${t('camera.step_printer_screen')}</span>
          </div>
          <div class="camera-step">
            <span class="camera-step-num">2</span>
            <span>${t('camera.step_settings')}</span>
          </div>
          <div class="camera-step">
            <span class="camera-step-num">3</span>
            <span>${t('camera.step_lan_liveview')}</span>
          </div>
        </div>`;
    }

    container.innerHTML = `
      <div class="camera-placeholder">
        ${icon}
        <span class="camera-placeholder-title">${title}</span>
        ${hint ? `<span class="camera-hint">${hint}</span>` : ''}
        ${steps || ''}
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
      if (_streamMode === 'snapshot') {
        // Snapshot fullscreen — refreshing <img> element
        fsContainer.innerHTML = '';
        const fsImg = document.createElement('img');
        fsImg.className = 'camera-canvas-fullscreen';
        fsImg.style.objectFit = 'contain';
        fsContainer.appendChild(fsImg);

        const printerId = window.printerState?.getActivePrinterId();
        const frameUrl = `/api/printers/${printerId}/frame.jpeg`;
        function refreshFs() { fsImg.src = frameUrl + '?t=' + Date.now(); }
        refreshFs();
        const fsInterval = setInterval(refreshFs, 3000);
        fullscreenPlayer = { destroy: () => { clearInterval(fsInterval); } };
      } else if (_streamMode === 'jpeg') {
        // JPEG fullscreen — use <img> element
        fsContainer.innerHTML = '';
        const fsImg = document.createElement('img');
        fsImg.className = 'camera-canvas-fullscreen';
        fsImg.style.objectFit = 'contain';
        fsContainer.appendChild(fsImg);

        const fsJpegWs = new WebSocket(wsUrl);
        fsJpegWs.binaryType = 'arraybuffer';
        fsJpegWs.onmessage = (e) => {
          const blob = new Blob([e.data], { type: 'image/jpeg' });
          const url = URL.createObjectURL(blob);
          const old = fsImg.src;
          fsImg.src = url;
          if (old && old.startsWith('blob:')) URL.revokeObjectURL(old);
        };
        fsJpegWs.onclose = () => {
          fsContainer.innerHTML = `<div class="camera-placeholder"><span>${t('camera.stream_ended')}</span></div>`;
        };
        fullscreenPlayer = { destroy: () => { try { fsJpegWs.close(); } catch {} } };
      } else {
        // MPEG-TS fullscreen — use JSMpeg canvas
        fullscreenPlayer = new JSMpeg.Player(wsUrl, {
          canvas: canvas,
          autoplay: true,
          audio: false,
          loop: false,
          onSourceCompleted: () => {
            fsContainer.innerHTML = `<div class="camera-placeholder"><span>${t('camera.stream_ended')}</span></div>`;
          }
        });
      }
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

  function _takeScreenshot(container) {
    // Find the visible image or canvas in camera container
    const img = container.querySelector('img.camera-canvas');
    const canvas = container.querySelector('canvas.camera-canvas');

    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');

    if (img && img.src) {
      c.width = img.naturalWidth || img.width;
      c.height = img.naturalHeight || img.height;
      ctx.drawImage(img, 0, 0);
    } else if (canvas) {
      c.width = canvas.width;
      c.height = canvas.height;
      ctx.drawImage(canvas, 0, 0);
    } else {
      if (typeof showToast === 'function') showToast(t('camera.screenshot_failed'), 'error');
      return;
    }

    c.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `camera-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
      a.click();
      URL.revokeObjectURL(url);
      if (typeof showToast === 'function') showToast(t('camera.screenshot_saved'), 'success');
    }, 'image/png');
  }

  window.closeCameraModal = closeFullscreen;

  // Switch camera when printer changes
  window.switchCamera = function(port) {
    // Close fullscreen if open when switching printer
    closeFullscreen();
    // Clean up any existing camera connection before switching
    _cleanup();
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

    // Close on backdrop click/touch
    const modal = document.getElementById('camera-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeFullscreen();
      });
      modal.addEventListener('touchend', (e) => {
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

    // Add info bar below the 3D/MW container
    const infoBar = document.createElement('div');
    infoBar.id = 'fs-info-bar';
    infoBar.className = 'fs-info-bar';
    container.parentElement.appendChild(infoBar);
    _updateFsInfoBar(pd);

    // Start real-time update loop (works for both modes)
    startFsUpdateLoop();
  }

  function _showMwFullscreen(container, imageSrc, pd) {
    const pct = pd?.mc_percent || 0;
    const layer = pd?.layer_num || 0;
    const total = pd?.total_layer_num || 0;
    const clipTop = 100 - pct;

    container.innerHTML = `
      <div class="fs-mw-wrap">
        <img class="fs-mw-bg" src="${imageSrc}" alt="">
        <img class="fs-mw-reveal" id="fs-mw-reveal" src="${imageSrc}" alt="" style="clip-path:inset(${clipTop}% 0 0 0)">
        <div class="fs-mw-edge" id="fs-mw-edge" style="bottom:${pct}%"></div>
        <div class="fs-mw-hud">
          <span class="fs-mw-pct" id="fs-mw-pct">${t('progress.layer', { current: layer, total: total })}</span>
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
        const initPct = pd?.mc_percent || 0;
        if (initPct > 0) _fsViewer.setProgress(initPct / 100);
      })
      .catch(() => {
        container.innerHTML = `<div class="camera-placeholder"><span>${t('model.not_available')}</span></div>`;
      });
  }

  function _updateFsInfoBar(pd) {
    const bar = document.getElementById('fs-info-bar');
    if (!bar || !pd) return;

    const pct = pd.mc_percent || 0;
    const gcState = pd.gcode_state || 'IDLE';
    const remaining = pd.mc_remaining_time || 0;
    const layer = pd.layer_num || 0;
    const total = pd.total_layer_num || 0;
    const isPrinting = gcState === 'RUNNING' || gcState === 'PAUSE';

    const stateMap = { RUNNING: t('progress.printing'), PAUSE: t('progress.paused'), FINISH: t('progress.finished'), IDLE: t('progress.idle'), PREPARE: t('progress.preparing'), FAILED: t('progress.failed') };
    const stateText = stateMap[gcState] || gcState;

    let timeStr = '';
    if (remaining > 0 && isPrinting) {
      const h = Math.floor(remaining / 60);
      const m = remaining % 60;
      timeStr = h > 0 ? `${h}${t('time.h')} ${String(m).padStart(2, '0')}${t('time.m')}` : `${m}${t('time.m')}`;
    }

    let etaStr = '';
    if (remaining > 0 && isPrinting) {
      const eta = new Date(Date.now() + remaining * 60 * 1000);
      const locale = (window.i18n?.getLocale() || 'nb').replace('_', '-');
      etaStr = `${t('progress.eta_prefix')} ${eta.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
    }

    bar.innerHTML = `
      <div class="fs-info-pct">${pct}%</div>
      <div class="fs-info-details">
        <span class="fs-info-state">${esc(stateText)}</span>
        ${timeStr ? `<span class="fs-info-time">${timeStr}</span>` : ''}
        ${etaStr ? `<span class="fs-info-eta">${etaStr}</span>` : ''}
        ${total > 0 ? `<span class="fs-info-layers">${t('progress.layer', { current: layer, total: total })}</span>` : ''}
      </div>`;
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
      const pct = pd.mc_percent || 0;

      if (_fsMwMode) {
        // Update MakerWorld reveal
        const reveal = document.getElementById('fs-mw-reveal');
        const edge = document.getElementById('fs-mw-edge');
        const pctEl = document.getElementById('fs-mw-pct');
        const clipTop = 100 - pct;
        if (reveal) reveal.style.clipPath = `inset(${clipTop}% 0 0 0)`;
        if (edge) edge.style.bottom = pct + '%';
        if (pctEl) pctEl.textContent = `${t('progress.layer', { current: layer, total: total })}`;

        // Update edge color from active filament
        const hex = getActiveFilamentColorHex(pd);
        if (hex && edge) {
          const c = '#' + hex.substring(0, 6);
          edge.style.background = c;
          edge.style.boxShadow = `0 0 16px ${c}, 0 0 6px ${c}`;
        }
      } else if (_fsViewer) {
        if (pct > 0) _fsViewer.setProgress(pct / 100);
      }

      // Update info bar
      _updateFsInfoBar(pd);

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

    // Remove info bar
    const infoBar = document.getElementById('fs-info-bar');
    if (infoBar) infoBar.remove();
  }

  window.open3dFullscreen = open3dFullscreen;
  window.close3dFullscreen = close3dFullscreen;
})();
