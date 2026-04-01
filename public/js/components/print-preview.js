// Print Preview — 3D model viewer with layer-by-layer animation + HUD overlay
// Tracks per-layer filament color for accurate multi-color rendering
(function() {
  let _currentSubtask = '';
  let _fetching = false;
  let _viewer = null;

  // Per-layer color tracking
  let _layerColors = [];    // [layerIndex] = [r, g, b] (0-1)
  let _lastTrackedLayer = -1;
  let _lastColor = null;

  // MakerWorld tracking
  let _usingMwImage = false;

  // Throttle/cache for API calls to prevent 429 floods
  let _lastModelFetch = 0;
  let _cachedModel = null;
  let _lastTasksFetch = 0;
  let _cachedTasks = null;
  let _lastModelLinkFetch = 0;
  let _cachedModelLink = null;
  const MODEL_FETCH_INTERVAL = 30000;    // 30s
  const TASKS_FETCH_INTERVAL = 60000;    // 60s
  const MODEL_LINK_FETCH_INTERVAL = 30000; // 30s

  const STATE_TEXT = {
    IDLE: 'idle', RUNNING: 'running', PAUSE: 'pause',
    FINISH: 'finish', FAILED: 'failed', PREPARE: 'prepare', HEATING: 'heating'
  };

  const STATE_COLORS = {
    IDLE: '#c0c8d8', RUNNING: '#00e676', PAUSE: '#f0883e',
    FINISH: '#1279ff', FAILED: '#ff5252', PREPARE: '#e3b341', HEATING: '#e3b341'
  };

  // Convert RRGGBBAA hex string to [r, g, b] in 0-1 range for WebGL
  function trayColorToRgb(hex) {
    if (!hex || hex.length < 6) return null;
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return [r, g, b];
  }

  // Get active filament color from AMS data
  function getActiveFilamentColor(data) {
    if (!data.ams || !data.ams.ams) return null;
    const activeTrayId = data.ams.tray_now;
    if (activeTrayId == null) return null;
    for (const unit of data.ams.ams) {
      const tray = (unit.tray || []).find(t => String(t.id) === String(activeTrayId));
      if (tray && tray.tray_color) {
        return trayColorToRgb(tray.tray_color);
      }
    }
    return null;
  }

  // Record the current filament color for all layers up to currentLayer
  function trackLayerColor(data) {
    const currentLayer = data.layer_num || 0;
    const rgb = getActiveFilamentColor(data);
    if (!rgb) return;

    // Update last known color
    _lastColor = rgb;

    // Fill from last tracked layer+1 to current layer with current color
    const startFill = Math.max(0, _lastTrackedLayer + 1);
    for (let i = startFill; i <= currentLayer; i++) {
      _layerColors[i] = rgb;
    }
    _lastTrackedLayer = currentLayer;
  }

  window.updatePrintPreview = function(data) {
    const canvas = document.getElementById('print-model-canvas');
    if (!canvas) return;

    const gcodeState = data.gcode_state || 'IDLE';
    const isActive = gcodeState === 'RUNNING' || gcodeState === 'PAUSE' || gcodeState === 'PREPARE' || gcodeState === 'HEATING';
    const subtask = data.subtask_name || '';

    // Update HUD regardless of 3D model state
    updateHud(data, gcodeState, isActive);

    const mwContainer = document.getElementById('print-mw-container');

    if (!isActive || !subtask) {
      canvas.style.display = 'none';
      if (mwContainer) mwContainer.style.display = 'none';
      // Remove thumbnail fallback when idle
      const thumbFallback = canvas.parentElement?.querySelector('.moonraker-thumb-fallback');
      if (thumbFallback) thumbFallback.remove();
      _currentSubtask = '';
      _usingMwImage = false;
      if (_viewer) { _viewer.destroy(); _viewer = null; }
      // Reset layer tracking
      _layerColors = [];
      _lastTrackedLayer = -1;
      _lastColor = null;
      // Clear print estimates
      window._printEstimates = null;
      // Clear fetch caches on idle
      _cachedModel = null; _lastModelFetch = 0;
      _cachedTasks = null; _lastTasksFetch = 0;
      _cachedModelLink = null; _lastModelLinkFetch = 0;
      // Hide model metadata
      renderModelMeta(null, null);
      return;
    }

    // Track layer colors on every tick
    trackLayerColor(data);

    // Update progress on every tick
    const layer = data.layer_num || 0;
    const total = data.total_layer_num || 0;
    const pct = data.mc_percent || 0;

    if (_usingMwImage) {
      // Reveal bright image from bottom via clip-path
      const reveal = document.getElementById('print-mw-reveal');
      const edge = document.getElementById('print-mw-edge');
      const clipTop = 100 - pct;
      if (reveal) reveal.style.clipPath = `inset(${clipTop}% 0 0 0)`;
      if (edge) {
        edge.style.bottom = pct + '%';
        // Tint glow line with active filament color
        const rgb = getActiveFilamentColor(data);
        if (rgb) {
          const hex = '#' + rgb.map(c => Math.round(c * 255).toString(16).padStart(2, '0')).join('');
          edge.style.background = hex;
          edge.style.boxShadow = `0 0 12px ${hex}, 0 0 4px ${hex}`;
        }
      }
    } else if (_viewer) {
      if (pct > 0) {
        _viewer.setProgress(pct / 100);
      }
      // Upload per-layer color map to GPU for multi-color rendering
      if (_layerColors.length > 0) {
        const totalLayers = data.total_layer_num || _layerColors.length;
        _viewer.setLayerColors(_layerColors, totalLayers);
      }
      // Update uniform color to active filament (for layers not yet tracked)
      const rgb = getActiveFilamentColor(data);
      if (rgb) _viewer.setColor(rgb);
    }

    // Already showing this model/image/thumbnail — only need progress update above
    const hasThumbnailFallback = canvas.parentElement?.querySelector('.moonraker-thumb-fallback');
    if (subtask === _currentSubtask && (canvas.style.display !== 'none' || _usingMwImage || hasThumbnailFallback)) return;

    // New subtask: reset
    if (subtask !== _currentSubtask) {
      _layerColors = [];
      _lastTrackedLayer = -1;
      _lastColor = null;
      _usingMwImage = false;
      if (mwContainer) mwContainer.style.display = 'none';
      // Clear fetch caches for new job
      _cachedModel = null; _lastModelFetch = 0;
      _cachedTasks = null; _lastTasksFetch = 0;
      _cachedModelLink = null; _lastModelLinkFetch = 0;
    }

    if (_fetching) return;
    _currentSubtask = subtask;
    _fetching = true;
    updateModelLoadingState(true);

    const printerId = window.printerState.getActivePrinterId();
    const projectId = data.project_id;

    // If MakerWorld project: use cover image with progress reveal
    if (projectId && projectId !== '0') {
      fetch(`/api/makerworld/${projectId}`)
        .then(r => r.ok ? r.json() : null)
        .then(info => {
          // Store print estimates globally for AMS/filament panels
          if (info && (info.estimated_weight_g || info.estimated_time_s)) {
            window._printEstimates = {
              weight_g: info.estimated_weight_g || 0,
              time_s: info.estimated_time_s || 0,
              filament_type: info.filament_type || null,
              title: info.title || null
            };
          }
          if (info && info.image && !info.fallback) {
            _usingMwImage = true;
            canvas.style.display = 'none';
            if (_viewer) { _viewer.destroy(); _viewer = null; }
            const bgImg = document.getElementById('print-mw-image');
            const revealImg = document.getElementById('print-mw-reveal');
            const edge = document.getElementById('print-mw-edge');
            if (bgImg) bgImg.src = info.image;
            if (revealImg) revealImg.src = info.image;
            // Set initial progress
            const clipTop = 100 - pct;
            if (revealImg) revealImg.style.clipPath = `inset(${clipTop}% 0 0 0)`;
            if (edge) edge.style.bottom = pct + '%';
            if (mwContainer) mwContainer.style.display = '';
            // Use cloud task data for metadata bar, fallback to model API
            if (info.estimated_weight_g || info.estimated_time_s) {
              renderModelMeta(null, {
                filament_type: info.filament_type || null,
                estimated_weight_g: info.estimated_weight_g || null,
                estimated_time_s: info.estimated_time_s || null
              });
            } else {
              const _now = Date.now();
              if (_cachedModelLink && (_now - _lastModelLinkFetch) < MODEL_LINK_FETCH_INTERVAL) {
                if (_cachedModelLink) renderModelMeta(_cachedModelLink.meta, _cachedModelLink.sliceInfo);
              } else {
                fetch(`/api/model/${printerId}`).then(r => r.ok ? r.json() : null)
                  .then(m => { _lastModelLinkFetch = Date.now(); _cachedModelLink = m; if (m) renderModelMeta(m.meta, m.sliceInfo); })
                  .catch(() => {});
              }
            }
            // Handle image load failure
            if (bgImg) bgImg.onerror = () => {
              if (mwContainer) mwContainer.style.display = 'none';
              _usingMwImage = false;
              _loadModel(printerId, canvas, data);
            };
          } else {
            _loadModel(printerId, canvas, data);
          }
        })
        .catch(() => {
          _loadModel(printerId, canvas, data);
        })
        .finally(() => {
          _fetching = false;
          updateModelLoadingState(false);
        });
    } else {
      _loadModel(printerId, canvas, data);
    }

    // Fallback: if no MakerWorld data, try cloud task history for print estimates
    if (!window._printEstimates && subtask) {
      const now = Date.now();

      // Use cached tasks if fetched recently
      if (_cachedTasks && (now - _lastTasksFetch) < TASKS_FETCH_INTERVAL) {
        _applyTaskEstimates(_cachedTasks, subtask);
      } else {
        fetch('/api/bambu-cloud/tasks').then(r => r.ok ? r.json() : null).then(tasks => {
          _lastTasksFetch = Date.now();
          _cachedTasks = tasks;
          _applyTaskEstimates(tasks, subtask);
        }).catch(() => {});
      }
    }
  };

  function _applyTaskEstimates(tasks, subtask) {
    if (!tasks || window._printEstimates) return;
    const list = Array.isArray(tasks) ? tasks : (tasks.tasks || []);
    // Match by filename
    const match = list.find(t => (t.title || t.name || '') === subtask);
    if (match && (match.weight || match.costTime)) {
      window._printEstimates = {
        weight_g: match.weight || 0,
        time_s: match.costTime || 0,
        filament_type: match.filament_type || null,
        title: match.title || match.name || subtask
      };
      // Trigger re-render of filament displays with new estimates
      const _state = window.printerState?.getActivePrinterState?.();
      if (_state) {
        const _pd = _state.print || _state;
        if (typeof updateFilamentRing === 'function') updateFilamentRing(_pd);
        if (typeof updateActiveFilament === 'function') updateActiveFilament(_pd);
      }
    }
  }

  const _MODEL_NOT_FOUND = Symbol('not_found');

  // Reset preview when switching printers
  window.resetPrintPreview = function() {
    _currentSubtask = '';
    _cachedModel = null;
    _lastModelFetch = 0;
    _cachedTasks = null;
    _lastTasksFetch = 0;
    _cachedModelLink = null;
    _lastModelLinkFetch = 0;
    _usingMwImage = false;
    _fetching = false;
    if (_viewer) { _viewer.destroy(); _viewer = null; }
    const canvas = document.getElementById('print-model-canvas');
    if (canvas) canvas.style.display = 'none';
    const thumb = canvas?.parentElement?.querySelector('.moonraker-thumb-fallback');
    if (thumb) thumb.remove();
    const mw = document.getElementById('print-mw-container');
    if (mw) mw.style.display = 'none';
  };

  function _showThumbnailFallback(canvas, data) {
    canvas.style.display = 'none';
    const pid = window.printerState?.getActivePrinterId();
    if (!pid) return;
    // Use slicer thumbnail proxy (not camera frame!)
    const thumbUrl = `/api/printers/${encodeURIComponent(pid)}/print-thumb`;
    const container = canvas.parentElement;
    if (!container) return;
    let thumbEl = container.querySelector('.moonraker-thumb-fallback');
    if (!thumbEl) {
      thumbEl = document.createElement('div');
      thumbEl.className = 'moonraker-thumb-fallback';
      thumbEl.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg-tertiary);border-radius:var(--radius);gap:8px';
      const slicerInfo = data._slicer ? `<div style="font-size:0.7rem;color:var(--text-muted)">${data._slicer} ${data._slicer_version || ''}</div>` : '';
      const heightInfo = data._object_height ? `<div style="font-size:0.7rem;color:var(--text-muted)">H: ${data._object_height}mm · Layer: ${data._layer_height || '?'}mm</div>` : '';
      const filamentInfo = data._slicer_filament_total_g ? `<div style="font-size:0.7rem;color:var(--text-muted)">Filament: ${data._slicer_filament_total_g.toFixed(1)}g</div>` : '';
      thumbEl.innerHTML = `<img src="${thumbUrl}" alt="Print preview" style="max-width:80%;max-height:70%;object-fit:contain;border-radius:8px" onerror="this.src='/api/printers/${encodeURIComponent(pid)}/frame.jpeg'">${slicerInfo}${heightInfo}${filamentInfo}`;
      container.appendChild(thumbEl);
    }
  }

  function _loadModel(printerId, canvas, data) {
    const mwContainer = document.getElementById('print-mw-container');
    if (mwContainer) mwContainer.style.display = 'none';
    _usingMwImage = false;

    const now = Date.now();

    // Use cached result if fetched recently (including "not found")
    if (_lastModelFetch && (now - _lastModelFetch) < MODEL_FETCH_INTERVAL) {
      if (_cachedModel && _cachedModel !== _MODEL_NOT_FOUND) {
        _applyModel(_cachedModel, canvas, data);
      } else {
        // Cached "not found" — show thumbnail fallback without re-fetching
        _showThumbnailFallback(canvas, data);
      }
      _fetching = false;
      updateModelLoadingState(false);
      return;
    }

    fetch(`/api/model/${printerId}`)
      .then(res => {
        if (!res.ok) throw new Error('No model');
        return res.json();
      })
      .then(model => {
        _lastModelFetch = Date.now();
        _cachedModel = model;
        _applyModel(model, canvas, data);
      })
      .catch(() => {
        // Cache "not found" to prevent re-fetching every second
        _lastModelFetch = Date.now();
        _cachedModel = _MODEL_NOT_FOUND;
        _showThumbnailFallback(canvas, data);
        renderModelMeta(null, null);
      })
      .finally(() => {
        _fetching = false;
        updateModelLoadingState(false);
      });
  }

  function _applyModel(model, canvas, data) {
    canvas.style.display = '';
    if (!_viewer) {
      _viewer = new window.ModelViewer(canvas);
    }
    // Apply active filament color as the model's base color
    const rgb = getActiveFilamentColor(data);
    if (rgb) model.color = rgb;
    _viewer.loadModel(model);
    const initPct = data.mc_percent || 0;
    if (initPct > 0) {
      _viewer.setProgress(initPct / 100);
    } else {
      _viewer.setProgress(0);
    }
    // Show model metadata bar
    renderModelMeta(model.meta, model.sliceInfo);
  }

  function updatePrepareOverlay(data, state) {
    const overlay = document.getElementById('prepare-overlay');
    if (!overlay) return;

    const isPrepare = state === 'PREPARE' || state === 'HEATING';
    if (!isPrepare) {
      overlay.style.display = 'none';
      return;
    }

    overlay.style.display = '';

    const icon = document.getElementById('prepare-icon');
    const status = document.getElementById('prepare-status');
    const bar = document.getElementById('prepare-bar');
    const detail = document.getElementById('prepare-detail');

    const upload = data.upload || {};
    const isUploading = upload.status === 'uploading';

    if (isUploading) {
      // Uploading phase
      const pct = upload.progress || 0;
      if (icon) icon.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>`;
      if (status) status.textContent = `${t('prepare.uploading')} ${pct}%`;
      if (bar) bar.style.width = `${pct}%`;
      if (detail) {
        const fname = (data.subtask_name || '').replace(/\.(3mf|gcode)$/i, '');
        detail.textContent = fname || '';
      }
    } else {
      // Heating phase
      const nozzle = Math.round(data.nozzle_temper || 0);
      const nozzleTarget = data.nozzle_target_temper || 0;
      const bed = Math.round(data.bed_temper || 0);
      const bedTarget = data.bed_target_temper || 0;

      // Calculate overall heating progress
      let heatPct = 0;
      if (nozzleTarget > 0 && bedTarget > 0) {
        const nPct = Math.min(nozzle / nozzleTarget, 1);
        const bPct = Math.min(bed / bedTarget, 1);
        heatPct = Math.round((nPct * 0.6 + bPct * 0.4) * 100);
      }

      if (icon) icon.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 2c0 0-5 6-5 10a5 5 0 0 0 10 0c0-4-5-10-5-10z"/>
          <path d="M12 18v-3" opacity="0.5"/>
        </svg>`;
      if (status) status.textContent = `${t('prepare.heating')} ${heatPct}%`;
      if (bar) bar.style.width = `${heatPct}%`;
      if (detail) {
        detail.textContent = `${t('temperature.nozzle')} ${nozzle}°/${nozzleTarget}°  ·  ${t('temperature.bed')} ${bed}°/${bedTarget}°`;
      }
    }
  }

  function updateHud(data, state, isActive) {
    const hudFile = document.getElementById('hud-file');
    const hudState = document.getElementById('hud-state');
    const hudPct = document.getElementById('hud-pct');
    const hudLayers = document.getElementById('progress-layers');

    // Update prepare overlay and model info strip
    updatePrepareOverlay(data, state);
    if (typeof window.updateModelInfo === 'function') window.updateModelInfo(data, isActive);

    // File name
    if (hudFile) {
      const fname = data.subtask_name || '--';
      hudFile.textContent = fname.replace(/\.(3mf|gcode)$/i, '');
    }

    // State badge
    if (hudState) {
      const key = STATE_TEXT[state];
      const label = key ? t(`state.${key}`) : state;
      hudState.textContent = label;
      hudState.style.color = STATE_COLORS[state] || '#c0c8d8';
      hudState.style.background = isActive ? 'rgba(0,0,0,0.4)' : '';
    }

    // Percent
    if (hudPct) {
      hudPct.textContent = `${data.mc_percent || 0}%`;
    }

    // Layers
    if (hudLayers) {
      const current = data.layer_num || 0;
      const total = data.total_layer_num || 0;
      if (total > 0 && isActive) {
        hudLayers.textContent = `${t('progress.layer', { current, total })}`;
      } else {
        hudLayers.textContent = '--';
      }
    }
  }

  // ---- Model metadata bar ----

  function renderModelMeta(meta, sliceInfo) {
    const bar = document.getElementById('model-meta-bar');
    if (!bar) return;

    if (!meta && !sliceInfo) {
      bar.style.display = 'none';
      return;
    }

    const chips = [];

    // Dimensions
    if (meta?.dimensions) {
      const d = meta.dimensions;
      chips.push(`<span class="mm-chip" title="${t('model_meta.dimensions')}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0022 16z"/></svg> ${d.x}\u00D7${d.y}\u00D7${d.z} mm</span>`);
    }

    // Triangle count
    if (meta?.triangleCount) {
      const tc = meta.triangleCount >= 1000 ? (meta.triangleCount / 1000).toFixed(1) + 'k' : meta.triangleCount;
      chips.push(`<span class="mm-chip" title="${t('model_meta.triangles')}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 22 20 2 20"/></svg> ${tc}</span>`);
    }

    // Volume
    if (meta?.volume) {
      const vol = meta.volume >= 1000 ? (meta.volume / 1000).toFixed(1) + ' cm\u00B3' : meta.volume + ' mm\u00B3';
      chips.push(`<span class="mm-chip" title="${t('model_meta.volume')}">${vol}</span>`);
    }

    // Slice info
    if (sliceInfo) {
      if (sliceInfo.layer_height) {
        chips.push(`<span class="mm-chip" title="${t('model_meta.layer_height')}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg> ${sliceInfo.layer_height} mm</span>`);
      }
      if (sliceInfo.infill_density) {
        chips.push(`<span class="mm-chip" title="${t('model_meta.infill')}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg> ${sliceInfo.infill_density}${sliceInfo.infill_density.includes('%') ? '' : '%'}</span>`);
      }
      if (sliceInfo.filament_type) {
        chips.push(`<span class="mm-chip mm-chip-accent" title="${t('model_meta.filament')}">${esc(sliceInfo.filament_type)}</span>`);
      }
      if (sliceInfo.estimated_weight_g) {
        chips.push(`<span class="mm-chip" title="${t('model_meta.est_weight')}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a4 4 0 00-4 4c0 2 4 4 4 4s4-2 4-4a4 4 0 00-4-4z"/><path d="M5 12h14l-1.5 9h-11z"/></svg> ${sliceInfo.estimated_weight_g}g</span>`);
      }
      if (sliceInfo.estimated_time_s) {
        const mins = Math.round(sliceInfo.estimated_time_s / 60);
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
        chips.push(`<span class="mm-chip" title="${t('model_meta.est_time')}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${timeStr}</span>`);
      }
      if (sliceInfo.support_type && sliceInfo.support_type !== 'none') {
        chips.push(`<span class="mm-chip" title="${t('model_meta.supports')}">SUP: ${esc(sliceInfo.support_type)}</span>`);
      }
    }

    if (chips.length === 0) {
      bar.style.display = 'none';
      return;
    }

    bar.style.display = '';
    bar.innerHTML = chips.join('');
  }

  // ---- Model loading indicator ----

  function updateModelLoadingState(loading) {
    const detail = document.getElementById('prepare-detail');
    if (!detail) return;
    if (loading) {
      // Append loading model text if in prepare phase
      const existing = detail.textContent;
      if (existing) {
        detail.innerHTML = `${existing}<div class="model-loading-text">${t('prepare.loading_model')}</div>`;
      } else {
        detail.innerHTML = `<div class="model-loading-text">${t('prepare.loading_model')}</div>`;
      }
    }
  }

})();
