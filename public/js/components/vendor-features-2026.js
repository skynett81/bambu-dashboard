// vendor-features-2026.js — UI surface for backend features added since v1.1.19.
//
// Single component file that exposes: AMS 2 Pro / AMS HT drying indicators,
// H2D granular AI-detection toggles, chamber-temperature control (X1E/H2D),
// Moonraker power toggles, Klipper exclude-object skip controls, Nevermore
// & chamber fan tiles, and a live feed for the six Moonraker notifications
// (announcement / queue / history / filelist / service / power).
//
// Everything is rendered into <div id="vendor-features-2026"> if present
// on the page. The component listens for `status` / `moonraker_*` WS
// events via window._wsListeners and re-renders on change.

(function () {
  'use strict';

  const state = {
    print: null,
    moonraker: { announcement: null, queue: null, history: [], filelist: [], service: null, power: {} },
  };

  function container() {
    return document.getElementById('vendor-features-2026');
  }

  // ---- Live updates via the global WS listener queue ----
  window._wsListeners = window._wsListeners || [];
  window._wsListeners.push((msg) => {
    if (!msg || !msg.type) return;
    if (msg.type === 'status' && msg.data?.print) {
      state.print = msg.data.print;
      render();
      return;
    }
    if (msg.type === 'moonraker_announcement' && msg.data) {
      state.moonraker.announcement = msg.data;
      render();
    }
    if (msg.type === 'moonraker_queue' && msg.data) {
      state.moonraker.queue = msg.data;
      render();
    }
    if (msg.type === 'moonraker_history' && msg.data) {
      state.moonraker.history.unshift(msg.data);
      state.moonraker.history = state.moonraker.history.slice(0, 10);
      render();
    }
    if (msg.type === 'moonraker_filelist' && msg.data) {
      state.moonraker.filelist.unshift(msg.data);
      state.moonraker.filelist = state.moonraker.filelist.slice(0, 10);
      render();
    }
    if (msg.type === 'moonraker_service' && msg.data) {
      state.moonraker.service = msg.data.services;
      render();
    }
    if (msg.type === 'moonraker_power' && msg.data?.device) {
      state.moonraker.power[msg.data.device] = msg.data.status;
      render();
    }
  });

  // ---- Render ----
  function render() {
    const el = container();
    if (!el) return;

    const print = state.print || {};
    const parts = [];

    // AMS 2 Pro / AMS HT drying indicators
    if (Array.isArray(print._ams_humidity) && print._ams_humidity.some(a => a.humidityRaw != null || a.dryTime != null)) {
      parts.push(renderAmsDrying(print._ams_humidity, print._ams_models));
    }

    // Printer model descriptor (Bambu H-series flag)
    if (print._printer_model && print._printer_model.id && print._printer_model.id !== 'unknown') {
      parts.push(renderPrinterModel(print._printer_model));
    }

    // H2D granular AI toggles
    if (print._xcam && (print._xcam.clumpDetector || print._xcam.airprintDetector || print._xcam.pileupDetector || print._xcam.printingMonitor)) {
      parts.push(renderH2dAiToggles(print._xcam));
    }

    // Chamber heater (Moonraker) + chamber temp control (Bambu).
    // H-series + X1E all have heated chambers — H2D / H2D Pro / H2C / H2S
    // and the older X1E. H2D Pro and H2S are recent additions.
    const _pmId = print._printer_model?.id;
    if (print._chamber_heater
        || _pmId === 'h2d' || _pmId === 'h2d_pro' || _pmId === 'h2c' || _pmId === 'h2s'
        || _pmId === 'x1e') {
      parts.push(renderChamberControl(print));
    }

    // Generic fans (Nevermore / Squirrel / chamber fans)
    if (print._generic_fans && Object.keys(print._generic_fans).length) {
      parts.push(renderGenericFans(print._generic_fans));
    }

    // Exclude objects (Klipper skip-during-print)
    if (Array.isArray(print.obj_list) && print.obj_list.length) {
      parts.push(renderExcludeObjects(print.obj_list));
    }

    // Moonraker live feed panel (queue / history / filelist / service / announcement)
    if (state.moonraker.announcement || state.moonraker.queue || state.moonraker.history.length || state.moonraker.filelist.length || state.moonraker.service) {
      parts.push(renderMoonrakerFeed(state.moonraker));
    }

    // Power devices
    if (Object.keys(state.moonraker.power).length) {
      parts.push(renderPowerDevices(state.moonraker.power));
    }

    const html = parts.join('') || '';
    if (el.dataset.lastHtml !== html) {
      el.innerHTML = html;
      el.dataset.lastHtml = html;
    }
    el.style.display = parts.length ? '' : 'none';
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function renderPrinterModel(m) {
    const badges = [];
    if (m.dualNozzle) badges.push('Dual nozzle');
    if (m.nozzleCount > 1) badges.push(`${m.nozzleCount} nozzles`);
    if (m.amsDefault) badges.push(m.amsDefault.toUpperCase().replace(/_/g, ' '));
    return `
      <div class="card mb-sm">
        <div class="card-title" style="font-size:0.7rem">Printer model</div>
        <div style="font-weight:600">${esc(m.label)}</div>
        <div style="margin-top:4px;display:flex;gap:4px;flex-wrap:wrap">
          ${badges.map(b => `<span class="badge badge-outline">${esc(b)}</span>`).join('')}
        </div>
      </div>`;
  }

  function renderAmsDrying(humidity, models) {
    const rows = humidity.map((a, i) => {
      const model = Array.isArray(models) ? (models[i]?.model || '') : '';
      const modelLabel = model === 'ams_2_pro' ? 'AMS 2 Pro' : model === 'ams_ht' ? 'AMS HT' : model === 'ams_lite' ? 'AMS Lite' : 'AMS';
      const dryTime = a.dryTime != null ? `${a.dryTime} min left` : '-';
      const sfReason = a.drySfReason > 0 ? `⚠ ${a.drySfReason}` : '';
      const humid = a.humidityRaw != null ? `${a.humidityRaw}% RH` : `level ${a.humidity}`;
      return `<tr><td>${esc(modelLabel)} #${esc(a.id)}</td><td>${esc(humid)}</td><td>${esc(dryTime)}</td><td>${esc(sfReason)}</td></tr>`;
    }).join('');
    return `
      <div class="card mb-sm">
        <div class="card-title" style="font-size:0.7rem">AMS drying status</div>
        <table style="width:100%;font-size:0.8rem"><thead><tr><th>Unit</th><th>Humidity</th><th>Drying</th><th>Safety</th></tr></thead><tbody>${rows}</tbody></table>
      </div>`;
  }

  function renderH2dAiToggles(xcam) {
    const pid = window.state?.getActivePrinterId?.();
    const rows = [
      { key: 'clumpDetector', label: 'Nozzle clumping' },
      { key: 'airprintDetector', label: 'Air print' },
      { key: 'pileupDetector', label: 'Purge chute pile-up' },
      { key: 'spaghettiDetector', label: 'Spaghetti' },
      { key: 'firstLayerInspector', label: 'First layer' },
      { key: 'printingMonitor', label: 'Printing monitor (master)' },
    ].filter(r => xcam[r.key] != null).map(r => {
      const val = xcam[r.key];
      const enabled = val === true || val?.enable === true;
      return `<label class="vf-toggle"><input type="checkbox" ${enabled ? 'checked' : ''} onchange="_vf2026.setXcam('${r.key}', this.checked)"> ${esc(r.label)}</label>`;
    }).join('');
    return `
      <div class="card mb-sm">
        <div class="card-title" style="font-size:0.7rem">H2D AI detection</div>
        <div style="display:flex;flex-direction:column;gap:4px;font-size:0.85rem">${rows}</div>
      </div>`;
  }

  function renderChamberControl(print) {
    const current = print._chamber_heater?.temperature ?? print.chamber_temper ?? 0;
    const target = print._chamber_heater?.target ?? print._chamber_target ?? 0;
    return `
      <div class="card mb-sm">
        <div class="card-title" style="font-size:0.7rem">Chamber</div>
        <div style="display:flex;gap:8px;align-items:center">
          <div style="font-weight:600;font-size:1.1rem">${esc(current)}°C</div>
          <div style="color:var(--text-muted);font-size:0.8rem">→</div>
          <input type="number" id="vf-chamber-target" min="0" max="65" value="${esc(target)}" style="width:70px">
          <button class="form-btn form-btn-sm" onclick="_vf2026.setChamberTemp()">Set</button>
        </div>
        <small class="text-muted" style="font-size:0.7rem">X1E / H2D / H2S / H2C — max 65°C</small>
      </div>`;
  }

  function renderGenericFans(fans) {
    const rows = Object.entries(fans).map(([name, f]) => `
      <tr><td>${esc(name)}</td><td>${esc(f.kind)}</td><td>${f.speed != null ? esc(f.speed) + '%' : '-'}</td><td>${f.rpm != null ? esc(f.rpm) + ' rpm' : '-'}</td><td>${f.temperature != null ? esc(f.temperature) + '°C' : '-'}</td></tr>`).join('');
    return `
      <div class="card mb-sm">
        <div class="card-title" style="font-size:0.7rem">Chamber & auxiliary fans</div>
        <table style="width:100%;font-size:0.8rem"><thead><tr><th>Name</th><th>Type</th><th>Speed</th><th>RPM</th><th>Temp</th></tr></thead><tbody>${rows}</tbody></table>
      </div>`;
  }

  function renderExcludeObjects(objs) {
    const rows = objs.map(o => `
      <tr><td>${esc(o.name)}</td><td>${o.skipped ? '<span style="color:var(--accent-red)">skipped</span>' : '<button class="form-btn form-btn-sm" onclick="_vf2026.excludeObject(&quot;' + esc(o.name) + '&quot;)">Skip</button>'}</td></tr>`).join('');
    return `
      <div class="card mb-sm">
        <div class="card-title" style="font-size:0.7rem">Objects in this print</div>
        <table style="width:100%;font-size:0.8rem"><tbody>${rows}</tbody></table>
        <button class="form-btn form-btn-sm form-btn-secondary" onclick="_vf2026.resetExcludedObjects()">Reset all skips</button>
      </div>`;
  }

  function renderMoonrakerFeed(mr) {
    const lines = [];
    if (mr.announcement?.entries?.length) {
      lines.push(`<div><strong>Announcement</strong>: ${esc(mr.announcement.entries[0].title)}</div>`);
    }
    if (mr.queue) {
      lines.push(`<div><strong>Queue</strong>: ${esc(mr.queue.action)} &middot; ${mr.queue.queue?.length || 0} jobs</div>`);
    }
    for (const h of mr.history.slice(0, 3)) {
      lines.push(`<div>Job ${esc(h.action)}: ${esc(h.job?.filename || '')}</div>`);
    }
    for (const f of mr.filelist.slice(0, 3)) {
      lines.push(`<div>File ${esc(f.action)}: ${esc(f.item?.path || '')}</div>`);
    }
    if (mr.service) {
      const up = Object.entries(mr.service).map(([svc, s]) => `${svc}=${s.active_state || '?'}`).join(', ');
      lines.push(`<div><strong>Services</strong>: ${esc(up)}</div>`);
    }
    return `
      <div class="card mb-sm">
        <div class="card-title" style="font-size:0.7rem">Moonraker live feed</div>
        <div style="display:flex;flex-direction:column;gap:2px;font-size:0.8rem">${lines.join('')}</div>
      </div>`;
  }

  function renderPowerDevices(devices) {
    const rows = Object.entries(devices).map(([name, status]) => `
      <tr><td>${esc(name)}</td><td>${esc(status)}</td><td><button class="form-btn form-btn-sm" onclick="_vf2026.togglePower('${esc(name)}')">Toggle</button></td></tr>`).join('');
    return `
      <div class="card mb-sm">
        <div class="card-title" style="font-size:0.7rem">Power devices</div>
        <table style="width:100%;font-size:0.8rem"><tbody>${rows}</tbody></table>
      </div>`;
  }

  // ---- Command dispatch via existing sendCommand() infra ----
  function send(action, extra = {}) {
    if (typeof window.sendCommand === 'function') window.sendCommand(action, extra);
  }

  window._vf2026 = {
    setXcam(key, enabled) {
      // Map UI key to Bambu xcam_control command field
      const map = { clumpDetector: 'clump_detector', airprintDetector: 'airprint_detector', pileupDetector: 'pileup_detector', spaghettiDetector: 'spaghetti_detector', firstLayerInspector: 'first_layer_inspector', printingMonitor: 'printing_monitor' };
      const field = map[key];
      if (!field) return;
      send('xcam_control', { field, enable: enabled });
    },
    setChamberTemp() {
      const v = parseInt(document.getElementById('vf-chamber-target')?.value || '0', 10);
      send('chamber_temp', { target: Math.max(0, Math.min(65, v)) });
    },
    excludeObject(name) {
      send('exclude_object', { name });
    },
    resetExcludedObjects() {
      send('exclude_object', { reset: true });
    },
    togglePower(device) {
      send('power_toggle', { device });
    },
  };

  document.addEventListener('DOMContentLoaded', render);
})();
