// Print Progress Ring + Live ETA Countdown
(function() {
  const RADIUS = 54;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const CX = 70, CY = 70;

  function stateLabel(state) {
    const key = { IDLE: 'idle', RUNNING: 'running', PAUSE: 'pause', FINISH: 'finish', FAILED: 'failed', PREPARE: 'prepare', HEATING: 'heating' }[state];
    return key ? t(`state.${key}`) : state || t('state.unknown');
  }

  const STATE_COLORS = {
    'RUNNING': '#00e676',
    'PAUSE': '#f0883e',
    'FINISH': '#1279ff',
    'FAILED': '#ff5252',
    'PREPARE': '#e3b341',
    'HEATING': '#e3b341'
  };

  // Live countdown state
  let _remainingSeconds = 0;
  let _countdownInterval = null;
  let _lastGcodeState = null;
  let _lastServerMins = -1;
  let _lastPercent = 0;
  let _completionFired = false;
  let _initialized = false;

  function initProgressRing() {
    const svg = document.getElementById('progress-ring');
    if (!svg) return;

    svg.innerHTML = `
      <circle cx="${CX}" cy="${CY}" r="${RADIUS}"
              fill="none" stroke="${theme.getCSSVar('--bg-tertiary')}" stroke-width="8"/>
      <circle id="progress-circle" cx="${CX}" cy="${CY}" r="${RADIUS}"
              fill="none" stroke="#00e676" stroke-width="8" stroke-linecap="round"
              stroke-dasharray="${CIRCUMFERENCE}" stroke-dashoffset="${CIRCUMFERENCE}"
              transform="rotate(-90 ${CX} ${CY})"
              style="transition: stroke-dashoffset 0.8s ease, stroke 0.3s ease"/>
      <text x="${CX}" y="${CY - 2}" text-anchor="middle" fill="${theme.getCSSVar('--text-primary')}"
            font-size="26" font-weight="700" id="progress-percent">0%</text>
      <text x="${CX}" y="${CY + 16}" text-anchor="middle" fill="${theme.getCSSVar('--text-secondary')}"
            font-size="10" id="progress-ring-state">${t('state.idle')}</text>
    `;

    // Start countdown ticker
    if (_countdownInterval) clearInterval(_countdownInterval);
    _countdownInterval = setInterval(tickCountdown, 1000);
  }

  function tickCountdown() {
    if (_lastGcodeState !== 'RUNNING' || _remainingSeconds <= 0) return;

    _remainingSeconds = Math.max(0, _remainingSeconds - 1);
    renderCountdown();
  }

  function renderCountdown() {
    const countdownEl = document.getElementById('progress-countdown');
    const etaEl = document.getElementById('progress-eta');

    if (_remainingSeconds > 0 && (_lastGcodeState === 'RUNNING' || _lastGcodeState === 'PAUSE')) {
      // Countdown
      const h = Math.floor(_remainingSeconds / 3600);
      const m = Math.floor((_remainingSeconds % 3600) / 60);
      const s = _remainingSeconds % 60;
      let timeStr;
      if (h > 0) {
        timeStr = `${h}${t('time.h')} ${String(m).padStart(2, '0')}${t('time.m')} ${String(s).padStart(2, '0')}${t('time.s')}`;
      } else {
        timeStr = `${m}${t('time.m')} ${String(s).padStart(2, '0')}${t('time.s')}`;
      }

      // ETA clock time
      const eta = new Date(Date.now() + _remainingSeconds * 1000);
      const locale = (window.i18n?.getLocale() || 'nb').replace('_', '-');
      const etaStr = eta.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

      // Combined: countdown on main line, ETA as subtitle
      if (countdownEl) {
        countdownEl.textContent = timeStr;
        countdownEl.style.display = '';
      }
      if (etaEl) {
        etaEl.innerHTML = `${t('progress.eta_prefix')} ${etaStr}`;
        etaEl.style.display = '';
      }
    } else {
      if (countdownEl) countdownEl.style.display = 'none';
      if (etaEl) etaEl.style.display = 'none';
    }
  }

  document.addEventListener('DOMContentLoaded', initProgressRing);

  window.updatePrintProgress = function(data) {
    const circle = document.getElementById('progress-circle');
    const percentText = document.getElementById('progress-percent');
    const ringState = document.getElementById('progress-ring-state');
    const fileEl = document.getElementById('progress-file');
    const stateEl = document.getElementById('progress-state');
    const timeEl = document.getElementById('progress-time');
    const layersEl = document.getElementById('progress-layers');

    if (!circle) return;

    const percent = data.mc_percent || 0;
    const state = data.gcode_state || 'IDLE';
    const color = STATE_COLORS[state] || theme.getCSSVar('--text-muted');
    const prevState = _lastGcodeState;
    _lastGcodeState = state;

    // Progress ring
    const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;
    circle.setAttribute('stroke-dashoffset', offset);
    circle.setAttribute('stroke', color);

    // Animate percent number smoothly
    const ring = document.getElementById('progress-ring');
    if (percent !== _lastPercent && typeof animateNumber === 'function') {
      animateNumber(percentText, _lastPercent, percent, 800, v => `${Math.round(v)}%`);
    } else {
      percentText.textContent = `${percent}%`;
    }

    // Completion celebration — state detection (glow burst animation removed)
    if (state === 'FINISH' && prevState === 'RUNNING' && _initialized && !_completionFired) {
      _completionFired = true;
      if (typeof showToast === 'function') {
        showToast(t('progress.print_complete'), 'success', 5000);
      }
    }
    if (state !== 'FINISH') _completionFired = false;
    _initialized = true;

    _lastPercent = percent;

    // Ring state label
    ringState.textContent = stateLabel(state);

    // Details
    if (fileEl) {
      const fname = data.subtask_name || '--';
      fileEl.textContent = fname.replace(/\.(3mf|gcode)$/i, '');
    }
    // Hide state text when printing (ring already shows it)
    if (stateEl) {
      if (state === 'RUNNING') {
        stateEl.style.display = 'none';
      } else {
        stateEl.textContent = stateLabel(state);
        stateEl.style.color = color;
        stateEl.style.display = '';
      }
    }

    // Sync countdown from server remaining time (minutes)
    // Only re-sync when the server value actually changes to avoid jitter
    const serverMins = data.mc_remaining_time;
    if (serverMins != null && serverMins > 0 && (state === 'RUNNING' || state === 'PAUSE')) {
      if (serverMins !== _lastServerMins) {
        _remainingSeconds = serverMins * 60;
        _lastServerMins = serverMins;
      }
    } else if (state === 'IDLE' || state === 'FINISH' || state === 'FAILED') {
      _remainingSeconds = 0;
      _lastServerMins = -1;
    }

    // Render countdown immediately
    renderCountdown();

    // Elapsed time display (hide if not printing)
    if (timeEl) {
      if (state === 'RUNNING' || state === 'PAUSE') {
        timeEl.style.display = 'none'; // countdown replaces this
      } else if (state === 'FINISH') {
        timeEl.textContent = t('progress.print_complete');
        timeEl.style.display = '';
      } else {
        timeEl.textContent = '--';
        timeEl.style.display = '';
      }
    }

    // Layers - visual progress bar
    if (layersEl) {
      const current = data.layer_num || 0;
      const total = data.total_layer_num || 0;
      if (total > 0) {
        const pct = Math.round((current / total) * 100);
        layersEl.innerHTML = `
          <div class="layer-header">
            <svg class="layer-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
            <span class="layer-text">${t('progress.layer', { current, total })}</span>
          </div>
          <div class="layer-bar">
            <div class="layer-bar-fill" style="width:${pct}%"></div>
          </div>`;
      } else {
        layersEl.innerHTML = `
          <div class="layer-header">
            <svg class="layer-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
            <span class="layer-text" style="color:var(--text-muted)">--</span>
          </div>
          <div class="layer-bar">
            <div class="layer-bar-fill idle"></div>
          </div>`;
      }
    }
  };
})();
