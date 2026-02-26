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
    'IDLE': '#8b949e',
    'RUNNING': '#00e676',
    'PAUSE': '#f0883e',
    'FINISH': '#58a6ff',
    'FAILED': '#f85149',
    'PREPARE': '#e3b341',
    'HEATING': '#e3b341'
  };

  // Live countdown state
  let _remainingSeconds = 0;
  let _countdownInterval = null;
  let _lastGcodeState = 'IDLE';
  let _lastServerMins = -1;

  function initProgressRing() {
    const svg = document.getElementById('progress-ring');
    if (!svg) return;

    svg.innerHTML = `
      <circle cx="${CX}" cy="${CY}" r="${RADIUS}"
              fill="none" stroke="#21262d" stroke-width="8"/>
      <circle id="progress-circle" cx="${CX}" cy="${CY}" r="${RADIUS}"
              fill="none" stroke="#00e676" stroke-width="8" stroke-linecap="round"
              stroke-dasharray="${CIRCUMFERENCE}" stroke-dashoffset="${CIRCUMFERENCE}"
              transform="rotate(-90 ${CX} ${CY})"
              style="transition: stroke-dashoffset 0.8s ease, stroke 0.3s ease"/>
      <text x="${CX}" y="${CY - 2}" text-anchor="middle" fill="#e6edf3"
            font-size="26" font-weight="700" id="progress-percent">0%</text>
      <text x="${CX}" y="${CY + 16}" text-anchor="middle" fill="#8b949e"
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

      if (countdownEl) {
        countdownEl.textContent = timeStr + ' ' + t('progress.remaining');
        countdownEl.style.display = '';
      }

      // ETA clock time
      if (etaEl) {
        const eta = new Date(Date.now() + _remainingSeconds * 1000);
        const locale = (window.i18n?.getLocale() || 'nb').replace('_', '-');
        const etaStr = eta.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
        etaEl.innerHTML = `${t('progress.eta_prefix')} <strong>${etaStr}</strong>`;
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
    const color = STATE_COLORS[state] || '#8b949e';
    _lastGcodeState = state;

    // Progress ring
    const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;
    circle.setAttribute('stroke-dashoffset', offset);
    circle.setAttribute('stroke', color);

    // Percent text
    percentText.textContent = `${percent}%`;

    // Ring state label
    ringState.textContent = stateLabel(state);

    // Details
    if (fileEl) {
      const fname = data.subtask_name || '--';
      fileEl.textContent = fname.replace(/\.(3mf|gcode)$/i, '');
    }
    if (stateEl) {
      stateEl.textContent = stateLabel(state);
      stateEl.style.color = color;
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

    // Layers
    if (layersEl) {
      if (data.total_layer_num > 0) {
        layersEl.textContent = t('progress.layer', { current: data.layer_num || 0, total: data.total_layer_num });
      } else {
        layersEl.textContent = '--';
      }
    }
  };
})();
