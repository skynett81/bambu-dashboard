(function() {
  'use strict';

  let _remainingSec = 0;
  let _lastData = null;
  let _built = false;

  const CIRCLE_RADIUS = 96;
  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

  function _formatTime(totalSeconds) {
    if (totalSeconds <= 0) return '--:--:--';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function _estimateFinishTime(remainingSec) {
    if (remainingSec <= 0) return '';
    const finish = new Date(Date.now() + remainingSec * 1000);
    return 'Ferdig kl. ' + String(finish.getHours()).padStart(2, '0') + ':' + String(finish.getMinutes()).padStart(2, '0');
  }

  function _truncateFilename(name, maxLen) {
    if (!name) return '';
    name = name.replace(/\.(gcode|3mf)$/i, '');
    if (name.length <= maxLen) return name;
    return name.substring(0, maxLen - 3) + '...';
  }

  // Build the static DOM structure once
  function _buildDOM(container) {
    const isEmbed = container.id === 'countdown-embed';
    if (isEmbed) {
      container.innerHTML =
        '<span class="ct-inline-time" id="ct-time">--:--:--</span>' +
        '<span class="ct-inline-eta" id="ct-finish"></span>';
      // Hidden elements needed by _updateValues
      const hidden = document.createElement('div');
      hidden.style.display = 'none';
      hidden.innerHTML = '<span id="ct-progress"></span><span id="ct-info"></span><span id="ct-filename"></span>';
      container.appendChild(hidden);
      _built = true;
      return;
    } else {
      container.innerHTML =
        '<div class="countdown-ring">' +
          '<svg width="220" height="220" viewBox="0 0 220 220">' +
            '<circle class="countdown-ring-bg" cx="110" cy="110" r="' + CIRCLE_RADIUS + '"/>' +
            '<circle class="countdown-ring-progress" cx="110" cy="110" r="' + CIRCLE_RADIUS + '" id="ct-progress"' +
              ' stroke-dasharray="' + CIRCLE_CIRCUMFERENCE + '"' +
              ' stroke-dashoffset="' + CIRCLE_CIRCUMFERENCE + '"/>' +
          '</svg>' +
          '<div class="countdown-time" id="ct-time">--:--:--</div>' +
        '</div>' +
        '<div class="countdown-info" id="ct-info"></div>' +
        '<div class="countdown-finish" id="ct-finish"></div>' +
        '<div class="countdown-filename" id="ct-filename"></div>';
    }
    _built = true;
  }

  function _showIdle(container) {
    if (!container.querySelector('.countdown-idle')) {
      container.innerHTML = '<div class="countdown-idle">Ingen aktiv utskrift</div>';
      _built = false;
    }
  }

  // Update only changed text/attributes — no innerHTML replacement
  function _updateValues() {
    const container = document.getElementById('countdown-embed') || document.getElementById('countdown-timer');
    if (!container) return;

    const data = _lastData;
    const isActive = data && (data.gcode_state === 'RUNNING' || data.gcode_state === 'PAUSE');

    if (!isActive) {
      _showIdle(container);
      return;
    }

    // Ensure DOM is built
    if (!_built) _buildDOM(container);

    const percent = data.mc_percent || 0;
    const dashOffset = CIRCLE_CIRCUMFERENCE - (percent / 100) * CIRCLE_CIRCUMFERENCE;
    const filename = data.subtask_name || data.gcode_file || '';
    const layerCurrent = data.layer_num || 0;
    const layerTotal = data.total_layer_num || 0;
    const finishText = _estimateFinishTime(_remainingSec);
    const pauseLabel = data.gcode_state === 'PAUSE' ? ' (Pauset)' : '';

    // Update only the values
    const progressEl = document.getElementById('ct-progress');
    if (progressEl) progressEl.setAttribute('stroke-dashoffset', dashOffset);

    const timeEl = document.getElementById('ct-time');
    if (timeEl) timeEl.textContent = _formatTime(_remainingSec);

    const infoEl = document.getElementById('ct-info');
    if (infoEl) {
      const infoText = percent + '% ' +
        (layerTotal > 0 ? '\u00B7 Lag ' + layerCurrent + ' / ' + layerTotal : '') +
        pauseLabel;
      infoEl.textContent = infoText;
    }

    const finishEl = document.getElementById('ct-finish');
    if (finishEl) finishEl.textContent = finishText;

    // Print stage badge
    const stageEl = document.getElementById('ct-stage');
    if (stageEl && typeof renderStageBadge === 'function') {
      stageEl.innerHTML = renderStageBadge(data.stg_cur);
    } else if (!stageEl && typeof renderStageBadge === 'function' && data.stg_cur != null) {
      const fnContainer = document.getElementById('ct-filename')?.parentElement;
      if (fnContainer && !fnContainer.querySelector('#ct-stage')) {
        const el = document.createElement('div');
        el.id = 'ct-stage';
        el.style.marginTop = '4px';
        el.style.textAlign = 'center';
        el.innerHTML = renderStageBadge(data.stg_cur);
        fnContainer.appendChild(el);
      }
    }

    const fnEl = document.getElementById('ct-filename');
    if (fnEl) {
      const truncated = _truncateFilename(filename, 35);
      if (fnEl.textContent !== truncated) {
        fnEl.textContent = truncated;
        fnEl.title = filename;
      }
    }
  }

  window.updateCountdownTimer = function(data) {
    _lastData = data;
    const isActive = data && (data.gcode_state === 'RUNNING' || data.gcode_state === 'PAUSE');
    if (isActive && typeof data.mc_remaining_time === 'number') {
      const serverSec = data.mc_remaining_time * 60;
      // Only sync from server when the difference is large (>90s),
      // otherwise let the local 1-second ticker interpolate smoothly
      if (_remainingSec <= 0 || Math.abs(_remainingSec - serverSec) > 90) {
        _remainingSec = serverSec;
      }
    } else if (!isActive) {
      _remainingSec = 0;
    }
    _updateValues();
  };

  // Tick every second for smooth countdown
  setInterval(function() {
    if (_remainingSec > 0 && _lastData && _lastData.gcode_state === 'RUNNING') {
      _remainingSec--;
    }
    if (_lastData) {
      _updateValues();
    }
  }, 1000);
})();
