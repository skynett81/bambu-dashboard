// Network Settings Panel — subnet management, scan controls, printer discovery
(function() {
  'use strict';

  let _networkSettings = null;
  let _scanResults = null;
  let _scanning = false;

  function _esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /**
   * Load network settings from API and render the panel
   */
  window.loadNetworkSettings = async function() {
    const el = document.getElementById('network-settings-section');
    if (!el) return;

    try {
      const res = await fetch('/api/network/settings');
      if (!res.ok) throw new Error('Failed to load network settings');
      _networkSettings = await res.json();
      _renderNetworkPanel(el);
    } catch (err) {
      el.innerHTML = '<div class="text-muted" style="font-size:0.85rem">Could not load network settings.</div>';
    }
  };

  function _renderNetworkPanel(el) {
    const s = _networkSettings;
    if (!s) return;

    let h = '';

    // ── Detected Subnets (read-only) ──
    h += '<div class="settings-card">';
    h += '<div class="card-title" style="margin-bottom:10px">' + t('network.detected_subnets') + '</div>';
    h += '<div class="text-muted" style="font-size:0.8rem;margin-bottom:8px">' + t('network.detected_subnets_hint') + '</div>';
    h += '<div class="net-chip-list" id="net-detected-subnets">';
    if (s.detectedSubnets && s.detectedSubnets.length) {
      for (const subnet of s.detectedSubnets) {
        h += '<span class="net-chip net-chip-readonly">' + _esc(subnet) + '</span>';
      }
    } else {
      h += '<span class="text-muted" style="font-size:0.8rem">' + t('network.no_subnets_detected') + '</span>';
    }
    h += '</div></div>';

    // ── Extra Subnets ──
    h += '<div class="settings-card mt-sm">';
    h += '<div class="card-title" style="margin-bottom:10px">' + t('network.extra_subnets') + '</div>';
    h += '<div class="text-muted" style="font-size:0.8rem;margin-bottom:8px">' + t('network.extra_subnets_hint') + '</div>';
    h += '<div class="net-chip-list" id="net-extra-subnets">';
    if (s.extraSubnets && s.extraSubnets.length) {
      for (const subnet of s.extraSubnets) {
        h += '<span class="net-chip net-chip-removable">' + _esc(subnet);
        h += '<button class="net-chip-remove" onclick="window._removeExtraSubnet(\'' + _esc(subnet) + '\')" title="' + t('network.remove') + '">&times;</button>';
        h += '</span>';
      }
    }
    h += '</div>';
    h += '<div style="display:flex;gap:8px;margin-top:8px;align-items:center">';
    h += '<input type="text" class="form-input" id="net-new-subnet" placeholder="e.g. 10.0.0.0" style="max-width:200px;font-size:0.85rem" onkeydown="if(event.key===\'Enter\')window._addExtraSubnet()">';
    h += '<button class="form-btn form-btn-sm form-btn-primary" data-ripple onclick="window._addExtraSubnet()">' + t('network.add') + '</button>';
    h += '</div>';
    h += '</div>';

    // ── Scan Settings ──
    h += '<div class="settings-card mt-sm">';
    h += '<div class="card-title" style="margin-bottom:10px">' + t('network.scan_settings') + '</div>';
    h += '<div class="prefs-compact-grid">';

    // Rediscovery interval
    const interval = s.rediscoveryIntervalSeconds || 60;
    h += '<div class="prefs-row">';
    h += '<span class="prefs-label">' + t('network.rediscovery_interval') + '</span>';
    h += '<div style="display:flex;align-items:center;gap:8px">';
    h += '<input type="range" id="net-rediscovery-interval" min="10" max="600" step="10" value="' + interval + '" style="width:140px;accent-color:var(--accent-green)" oninput="document.getElementById(\'net-interval-val\').textContent=this.value+\'s\'">';
    h += '<span id="net-interval-val" style="font-size:0.8rem;min-width:35px;opacity:0.7">' + interval + 's</span>';
    h += '</div></div>';

    // Scan timeout
    const timeout = s.scanTimeoutMs || 5000;
    h += '<div class="prefs-row">';
    h += '<span class="prefs-label">' + t('network.scan_timeout') + '</span>';
    h += '<div style="display:flex;align-items:center;gap:8px">';
    h += '<input type="range" id="net-scan-timeout" min="1000" max="30000" step="500" value="' + timeout + '" style="width:140px;accent-color:var(--accent-green)" oninput="document.getElementById(\'net-timeout-val\').textContent=(this.value/1000)+\'s\'">';
    h += '<span id="net-timeout-val" style="font-size:0.8rem;min-width:35px;opacity:0.7">' + (timeout / 1000) + 's</span>';
    h += '</div></div>';

    h += '</div>'; // end prefs-compact-grid

    h += '<div style="margin-top:12px;display:flex;gap:8px">';
    h += '<button class="form-btn form-btn-primary" data-ripple onclick="window._saveNetworkSettings()">' + t('network.save_settings') + '</button>';
    h += '</div>';
    h += '</div>';

    // ── Network Scan ──
    h += '<div class="settings-card mt-sm">';
    h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">';
    h += '<div class="card-title" style="margin:0">' + t('network.network_scan') + '</div>';
    h += '<button class="form-btn form-btn-sm form-btn-accent" id="net-scan-btn" data-ripple onclick="window._runNetworkScan()" ' + (_scanning ? 'disabled' : '') + '>';
    h += _scanning
      ? '<span class="spinner-sm"></span> ' + t('network.scanning')
      : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg> ' + t('network.scan_for_printers');
    h += '</button>';
    h += '</div>';
    h += '<div class="text-muted" style="font-size:0.8rem;margin-bottom:8px">' + t('network.scan_hint') + '</div>';
    h += '<div id="net-scan-results">';
    if (_scanResults) {
      h += _renderScanResults(_scanResults);
    }
    h += '</div>';
    h += '</div>';

    // ── WiFi QR Code Generator ──
    h += '<div class="settings-card mt-sm">';
    h += '<div class="card-title" style="gap:8px">';
    h += '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.6"><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><circle cx="12" cy="20" r="1"/></svg>';
    h += 'WiFi QR Code';
    h += '</div>';
    h += '<p class="text-muted" style="font-size:0.8rem;margin-bottom:10px">Generate a QR code that guests can scan to connect to your WiFi network.</p>';
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;max-width:500px">';
    h += '<div><label class="form-label">Network name (SSID)</label>';
    h += '<input type="text" class="form-input" id="wifi-qr-ssid" placeholder="MyWiFi" value="' + _esc(localStorage.getItem('wifi-qr-ssid') || '') + '"></div>';
    h += '<div><label class="form-label">Password</label>';
    h += '<input type="password" class="form-input" id="wifi-qr-pass" placeholder="Password" value="' + _esc(localStorage.getItem('wifi-qr-pass') || '') + '"></div>';
    h += '<div><label class="form-label">Security</label>';
    h += '<select class="form-input" id="wifi-qr-enc"><option value="WPA">WPA/WPA2/WPA3</option><option value="WEP">WEP</option><option value="nopass">Open (no password)</option></select></div>';
    h += '<div><label class="form-label">Hidden network</label>';
    h += '<label style="display:flex;align-items:center;gap:6px;margin-top:6px;font-size:0.85rem;cursor:pointer"><input type="checkbox" id="wifi-qr-hidden"> Hidden SSID</label></div>';
    h += '</div>';
    h += '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">';
    h += '<button class="form-btn form-btn-primary" data-ripple onclick="window._generateWifiQR()">Generate QR Code</button>';
    h += '<button class="form-btn form-btn-sm form-btn-secondary" data-ripple onclick="window._printWifiQR()" id="wifi-qr-print-btn" style="display:none">Print Sign</button>';
    h += '<button class="form-btn form-btn-sm form-btn-secondary" data-ripple onclick="window._downloadWifiQR()" id="wifi-qr-download-btn" style="display:none">Download PNG</button>';
    h += '</div>';
    h += '<div id="wifi-qr-result" style="margin-top:14px"></div>';
    h += '</div>';

    // ── Dashboard QR Code ──
    h += '<div class="settings-card mt-sm">';
    h += '<div class="card-title" style="gap:8px">';
    h += '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.6"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/><rect x="18" y="14" width="3" height="3"/><rect x="14" y="18" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/></svg>';
    h += 'Dashboard QR Code';
    h += '</div>';
    h += '<p class="text-muted" style="font-size:0.8rem;margin-bottom:10px">Scan to open the 3DPrintForge dashboard on your phone or tablet.</p>';
    h += '<div id="dashboard-qr-result"></div>';
    h += '</div>';

    el.innerHTML = h;

    // Auto-generate dashboard QR
    _generateDashboardQR();
  }

  function _renderScanResults(results) {
    const bambu = results.bambu || [];
    const moonraker = results.moonraker || [];
    if (!bambu.length && !moonraker.length) {
      return '<div class="text-muted" style="font-size:0.85rem;padding:12px 0">' + t('network.no_printers_found') + '</div>';
    }

    let h = '';

    if (bambu.length) {
      h += '<div style="margin-bottom:12px">';
      h += '<div style="font-size:0.8rem;font-weight:600;margin-bottom:6px;color:var(--text-secondary)">Bambu Lab (' + bambu.length + ')</div>';
      h += '<div class="net-results-table">';
      h += '<div class="net-results-header"><span>IP</span><span>Name</span><span>Model</span><span>Serial</span><span></span></div>';
      for (const p of bambu) {
        const added = p.alreadyAdded;
        h += '<div class="net-results-row">';
        h += '<span class="net-cell-mono">' + _esc(p.ip) + '</span>';
        h += '<span>' + _esc(p.name || '-') + '</span>';
        h += '<span>' + _esc(p.model || '-') + '</span>';
        h += '<span class="net-cell-mono" style="font-size:0.75rem">' + _esc(p.serial || '-') + '</span>';
        if (added) {
          h += '<span class="pill pill-completed" style="font-size:0.7rem">' + t('network.already_added') + '</span>';
        } else {
          h += '<button class="form-btn form-btn-sm form-btn-primary" data-ripple onclick="window._addDiscoveredPrinter(\'bambu\', \'' + _esc(p.ip) + '\', \'' + _esc(p.serial || '') + '\', \'' + _esc(p.name || '') + '\', \'' + _esc(p.model || '') + '\')">' + t('network.add_printer') + '</button>';
        }
        h += '</div>';
      }
      h += '</div></div>';
    }

    if (moonraker.length) {
      h += '<div>';
      h += '<div style="font-size:0.8rem;font-weight:600;margin-bottom:6px;color:var(--text-secondary)">Moonraker / Klipper (' + moonraker.length + ')</div>';
      h += '<div class="net-results-table">';
      h += '<div class="net-results-header"><span>IP</span><span>Hostname</span><span>Software</span><span>Status</span><span></span></div>';
      for (const p of moonraker) {
        const added = p.alreadyAdded;
        h += '<div class="net-results-row">';
        h += '<span class="net-cell-mono">' + _esc(p.ip) + '</span>';
        h += '<span>' + _esc(p.hostname || '-') + '</span>';
        h += '<span>' + _esc(p.software || '-') + '</span>';
        h += '<span>' + _esc(p.state || '-') + '</span>';
        if (added) {
          h += '<span class="pill pill-completed" style="font-size:0.7rem">' + t('network.already_added') + '</span>';
        } else {
          h += '<button class="form-btn form-btn-sm form-btn-primary" data-ripple onclick="window._addDiscoveredPrinter(\'moonraker\', \'' + _esc(p.ip) + '\', \'\', \'' + _esc(p.hostname || '') + '\', \'\')">' + t('network.add_printer') + '</button>';
        }
        h += '</div>';
      }
      h += '</div></div>';
    }

    return h;
  }

  window._addExtraSubnet = function() {
    const input = document.getElementById('net-new-subnet');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;
    if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(val)) {
      input.style.borderColor = 'var(--accent-red, #e74c3c)';
      setTimeout(() => { input.style.borderColor = ''; }, 2000);
      return;
    }
    if (!_networkSettings.extraSubnets) _networkSettings.extraSubnets = [];
    if (_networkSettings.extraSubnets.includes(val)) { input.value = ''; return; }
    _networkSettings.extraSubnets = [..._networkSettings.extraSubnets, val];
    input.value = '';
    const el = document.getElementById('network-settings-section');
    if (el) _renderNetworkPanel(el);
  };

  window._removeExtraSubnet = function(subnet) {
    if (!_networkSettings || !_networkSettings.extraSubnets) return;
    _networkSettings.extraSubnets = _networkSettings.extraSubnets.filter(s => s !== subnet);
    const el = document.getElementById('network-settings-section');
    if (el) _renderNetworkPanel(el);
  };

  window._saveNetworkSettings = async function() {
    const interval = parseInt(document.getElementById('net-rediscovery-interval')?.value) || 60;
    const timeout = parseInt(document.getElementById('net-scan-timeout')?.value) || 5000;
    const body = {
      extraSubnets: _networkSettings.extraSubnets || [],
      rediscoveryIntervalSeconds: interval,
      scanTimeoutMs: timeout
    };
    try {
      const res = await fetch('/api/network/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Save failed');
      _networkSettings = { ..._networkSettings, ...body };
      if (typeof window.showToast === 'function') window.showToast('Network settings saved', 'success');
    } catch (err) {
      if (typeof window.showToast === 'function') window.showToast('Could not save settings', 'error');
    }
  };

  window._runNetworkScan = async function() {
    _scanning = true;
    _scanResults = null;
    const btn = document.getElementById('net-scan-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-sm"></span> ' + t('network.scanning'); }
    const resultsEl = document.getElementById('net-scan-results');
    if (resultsEl) resultsEl.innerHTML = '<div class="text-muted" style="font-size:0.8rem;padding:8px 0">Scanning network...</div>';
    try {
      const res = await fetch('/api/network/scan', { method: 'POST' });
      if (!res.ok) throw new Error('Scan failed');
      _scanResults = await res.json();
    } catch (err) {
      _scanResults = { bambu: [], moonraker: [] };
      if (typeof window.showToast === 'function') window.showToast('Network scan failed', 'error');
    } finally {
      _scanning = false;
    }
    if (resultsEl) resultsEl.innerHTML = _renderScanResults(_scanResults);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg> ' + t('network.scan_for_printers');
    }
  };

  window._addDiscoveredPrinter = function(type, ip, serial, name, model) {
    if (typeof window.showAddPrinterDialog === 'function') {
      window.showAddPrinterDialog({ type, ip, serial, name, model });
    } else {
      if (typeof window.switchSettingsTab === 'function') window.switchSettingsTab('printers');
      if (typeof window.showToast === 'function') window.showToast('Go to Printers tab to add manually', 'info');
    }
  };

  // ── WiFi QR Code Generator ──

  function _makeQR(text, size) {
    if (typeof qrcode === 'undefined') return null;
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    return qr.createSvgTag({ cellSize: size || 4, margin: 0 });
  }

  window._generateWifiQR = function() {
    const ssid = document.getElementById('wifi-qr-ssid')?.value?.trim();
    const pass = document.getElementById('wifi-qr-pass')?.value || '';
    const enc = document.getElementById('wifi-qr-enc')?.value || 'WPA';
    const hidden = document.getElementById('wifi-qr-hidden')?.checked;
    const result = document.getElementById('wifi-qr-result');
    if (!result) return;

    if (!ssid) {
      if (typeof showToast === 'function') showToast('Enter a network name (SSID)', 'error');
      return;
    }

    // Save for next time
    try { localStorage.setItem('wifi-qr-ssid', ssid); localStorage.setItem('wifi-qr-pass', pass); } catch {}

    // WiFi QR format: WIFI:T:WPA;S:MyNetwork;P:MyPassword;H:false;;
    const escWifi = (s) => s.replace(/[\\;,:""]/g, c => '\\' + c);
    const wifiStr = `WIFI:T:${enc};S:${escWifi(ssid)};P:${escWifi(pass)};H:${hidden ? 'true' : 'false'};;`;

    const svg = _makeQR(wifiStr, 5);
    if (!svg) {
      result.innerHTML = '<span class="text-muted">QR code library not loaded</span>';
      return;
    }

    result.innerHTML = `
      <div id="wifi-qr-sign" style="display:inline-block;background:#fff;color:#000;border-radius:12px;padding:24px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.3)">
        <div style="font-size:1.4rem;font-weight:800;margin-bottom:4px;letter-spacing:1px">📶 WiFi</div>
        <div style="margin:12px auto;display:inline-block">${svg}</div>
        <div style="font-size:0.9rem;margin-top:8px">
          <div style="font-weight:700;font-size:1rem;margin-bottom:2px">${_esc(ssid)}</div>
          ${pass && enc !== 'nopass' ? '<div style="font-size:0.8rem;color:#666">Password: <strong>' + _esc(pass) + '</strong></div>' : '<div style="font-size:0.8rem;color:#666">Open network — no password</div>'}
        </div>
        <div style="font-size:0.65rem;color:#999;margin-top:8px">Scan with your phone camera to connect</div>
      </div>`;

    document.getElementById('wifi-qr-print-btn').style.display = '';
    document.getElementById('wifi-qr-download-btn').style.display = '';
  };

  window._printWifiQR = function() {
    const sign = document.getElementById('wifi-qr-sign');
    if (!sign) return;
    const w = window.open('', '_blank');
    w.document.write('<html><head><title>WiFi QR Code</title><style>body{display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#fff}@media print{body{background:#fff}}</style></head><body>');
    w.document.write(sign.outerHTML);
    w.document.write('</body></html>');
    w.document.close();
    setTimeout(() => { w.print(); }, 300);
  };

  window._downloadWifiQR = function() {
    const sign = document.getElementById('wifi-qr-sign');
    if (!sign) return;
    // Use canvas to convert to PNG
    const svgEl = sign.querySelector('svg');
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    const size = 600;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 50, 50, size - 100, size - 100);
      const a = document.createElement('a');
      a.download = 'wifi-qr-' + (document.getElementById('wifi-qr-ssid')?.value || 'code') + '.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // ── Dashboard QR Code ──

  function _generateDashboardQR() {
    const el = document.getElementById('dashboard-qr-result');
    if (!el) return;
    const url = location.origin;
    const svg = _makeQR(url, 4);
    if (!svg) { el.innerHTML = ''; return; }

    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:16px">
        <div style="background:#fff;padding:12px;border-radius:8px;display:inline-block">${svg}</div>
        <div style="font-size:0.85rem">
          <div style="font-weight:600;margin-bottom:4px">${_esc(url)}</div>
          <div class="text-muted" style="font-size:0.78rem">Scan to open dashboard on mobile</div>
        </div>
      </div>`;
  }

})();
