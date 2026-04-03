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
      el.innerHTML = '<div class="text-muted" style="font-size:0.85rem">Kunne ikke laste nettverksinnstillinger.</div>';
    }
  };

  function _renderNetworkPanel(el) {
    const s = _networkSettings;
    if (!s) return;

    let h = '';

    // ── Detected Subnets (read-only) ──
    h += '<div class="settings-card">';
    h += '<div class="card-title" style="margin-bottom:10px">Oppdagede subnett</div>';
    h += '<div class="text-muted" style="font-size:0.8rem;margin-bottom:8px">Automatisk oppdaget fra nettverksgrensesnittene.</div>';
    h += '<div class="net-chip-list" id="net-detected-subnets">';
    if (s.detectedSubnets && s.detectedSubnets.length) {
      for (const subnet of s.detectedSubnets) {
        h += '<span class="net-chip net-chip-readonly">' + _esc(subnet) + '</span>';
      }
    } else {
      h += '<span class="text-muted" style="font-size:0.8rem">Ingen subnett oppdaget</span>';
    }
    h += '</div></div>';

    // ── Extra Subnets ──
    h += '<div class="settings-card mt-sm">';
    h += '<div class="card-title" style="margin-bottom:10px">Ekstra subnett</div>';
    h += '<div class="text-muted" style="font-size:0.8rem;margin-bottom:8px">Legg til subnett som skal skannes i tillegg til de automatisk oppdagede.</div>';
    h += '<div class="net-chip-list" id="net-extra-subnets">';
    if (s.extraSubnets && s.extraSubnets.length) {
      for (const subnet of s.extraSubnets) {
        h += '<span class="net-chip net-chip-removable">' + _esc(subnet);
        h += '<button class="net-chip-remove" onclick="window._removeExtraSubnet(\'' + _esc(subnet) + '\')" title="Fjern">&times;</button>';
        h += '</span>';
      }
    }
    h += '</div>';
    h += '<div style="display:flex;gap:8px;margin-top:8px;align-items:center">';
    h += '<input type="text" class="form-input" id="net-new-subnet" placeholder="f.eks. 10.0.0.0" style="max-width:200px;font-size:0.85rem" onkeydown="if(event.key===\'Enter\')window._addExtraSubnet()">';
    h += '<button class="form-btn form-btn-sm form-btn-primary" data-ripple onclick="window._addExtraSubnet()">Legg til</button>';
    h += '</div>';
    h += '</div>';

    // ── Scan Settings ──
    h += '<div class="settings-card mt-sm">';
    h += '<div class="card-title" style="margin-bottom:10px">Skanneinnstillinger</div>';
    h += '<div class="prefs-compact-grid">';

    // Rediscovery interval
    const interval = s.rediscoveryIntervalSeconds || 60;
    h += '<div class="prefs-row">';
    h += '<span class="prefs-label">Gjenoppdagelsesintervall</span>';
    h += '<div style="display:flex;align-items:center;gap:8px">';
    h += '<input type="range" id="net-rediscovery-interval" min="10" max="600" step="10" value="' + interval + '" style="width:140px;accent-color:var(--accent-green)" oninput="document.getElementById(\'net-interval-val\').textContent=this.value+\'s\'">';
    h += '<span id="net-interval-val" style="font-size:0.8rem;min-width:35px;opacity:0.7">' + interval + 's</span>';
    h += '</div></div>';

    // Scan timeout
    const timeout = s.scanTimeoutMs || 5000;
    h += '<div class="prefs-row">';
    h += '<span class="prefs-label">Skanne-timeout</span>';
    h += '<div style="display:flex;align-items:center;gap:8px">';
    h += '<input type="range" id="net-scan-timeout" min="1000" max="30000" step="500" value="' + timeout + '" style="width:140px;accent-color:var(--accent-green)" oninput="document.getElementById(\'net-timeout-val\').textContent=(this.value/1000)+\'s\'">';
    h += '<span id="net-timeout-val" style="font-size:0.8rem;min-width:35px;opacity:0.7">' + (timeout / 1000) + 's</span>';
    h += '</div></div>';

    h += '</div>'; // end prefs-compact-grid

    h += '<div style="margin-top:12px;display:flex;gap:8px">';
    h += '<button class="form-btn form-btn-primary" data-ripple onclick="window._saveNetworkSettings()">Lagre innstillinger</button>';
    h += '</div>';
    h += '</div>';

    // ── Network Scan ──
    h += '<div class="settings-card mt-sm">';
    h += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">';
    h += '<div class="card-title" style="margin:0">Nettverksskanning</div>';
    h += '<button class="form-btn form-btn-sm form-btn-accent" id="net-scan-btn" data-ripple onclick="window._runNetworkScan()" ' + (_scanning ? 'disabled' : '') + '>';
    h += _scanning
      ? '<span class="spinner-sm"></span> Skanner...'
      : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg> Sak etter printere';
    h += '</button>';
    h += '</div>';
    h += '<div class="text-muted" style="font-size:0.8rem;margin-bottom:8px">Utfor en full nettverksskanning (Bambu SSDP + Moonraker) for a finne printere.</div>';
    h += '<div id="net-scan-results">';
    if (_scanResults) {
      h += _renderScanResults(_scanResults);
    }
    h += '</div>';
    h += '</div>';

    el.innerHTML = h;
  }

  function _renderScanResults(results) {
    const bambu = results.bambu || [];
    const moonraker = results.moonraker || [];
    if (!bambu.length && !moonraker.length) {
      return '<div class="text-muted" style="font-size:0.85rem;padding:12px 0">Ingen printere funnet.</div>';
    }

    let h = '';

    if (bambu.length) {
      h += '<div style="margin-bottom:12px">';
      h += '<div style="font-size:0.8rem;font-weight:600;margin-bottom:6px;color:var(--text-secondary)">Bambu Lab (' + bambu.length + ')</div>';
      h += '<div class="net-results-table">';
      h += '<div class="net-results-header"><span>IP</span><span>Navn</span><span>Modell</span><span>Serienr.</span><span></span></div>';
      for (const p of bambu) {
        const added = p.alreadyAdded;
        h += '<div class="net-results-row">';
        h += '<span class="net-cell-mono">' + _esc(p.ip) + '</span>';
        h += '<span>' + _esc(p.name || '-') + '</span>';
        h += '<span>' + _esc(p.model || '-') + '</span>';
        h += '<span class="net-cell-mono" style="font-size:0.75rem">' + _esc(p.serial || '-') + '</span>';
        if (added) {
          h += '<span class="pill pill-completed" style="font-size:0.7rem">Lagt til</span>';
        } else {
          h += '<button class="form-btn form-btn-sm form-btn-primary" data-ripple onclick="window._addDiscoveredPrinter(\'bambu\', \'' + _esc(p.ip) + '\', \'' + _esc(p.serial || '') + '\', \'' + _esc(p.name || '') + '\', \'' + _esc(p.model || '') + '\')">Legg til</button>';
        }
        h += '</div>';
      }
      h += '</div></div>';
    }

    if (moonraker.length) {
      h += '<div>';
      h += '<div style="font-size:0.8rem;font-weight:600;margin-bottom:6px;color:var(--text-secondary)">Moonraker / Klipper (' + moonraker.length + ')</div>';
      h += '<div class="net-results-table">';
      h += '<div class="net-results-header"><span>IP</span><span>Hostname</span><span>Programvare</span><span>Status</span><span></span></div>';
      for (const p of moonraker) {
        const added = p.alreadyAdded;
        h += '<div class="net-results-row">';
        h += '<span class="net-cell-mono">' + _esc(p.ip) + '</span>';
        h += '<span>' + _esc(p.hostname || '-') + '</span>';
        h += '<span>' + _esc(p.software || '-') + '</span>';
        h += '<span>' + _esc(p.state || '-') + '</span>';
        if (added) {
          h += '<span class="pill pill-completed" style="font-size:0.7rem">Lagt til</span>';
        } else {
          h += '<button class="form-btn form-btn-sm form-btn-primary" data-ripple onclick="window._addDiscoveredPrinter(\'moonraker\', \'' + _esc(p.ip) + '\', \'\', \'' + _esc(p.hostname || '') + '\', \'\')">Legg til</button>';
        }
        h += '</div>';
      }
      h += '</div></div>';
    }

    return h;
  }

  /**
   * Add a subnet to the extra list
   */
  window._addExtraSubnet = function() {
    const input = document.getElementById('net-new-subnet');
    if (!input) return;
    const val = input.value.trim();
    if (!val) return;

    // Basic subnet validation (IPv4 pattern)
    if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(val)) {
      input.style.borderColor = 'var(--accent-red, #e74c3c)';
      setTimeout(() => { input.style.borderColor = ''; }, 2000);
      return;
    }

    if (!_networkSettings.extraSubnets) _networkSettings.extraSubnets = [];
    if (_networkSettings.extraSubnets.includes(val)) {
      input.value = '';
      return;
    }
    _networkSettings.extraSubnets = [..._networkSettings.extraSubnets, val];
    input.value = '';

    const el = document.getElementById('network-settings-section');
    if (el) _renderNetworkPanel(el);
  };

  /**
   * Remove a subnet from the extra list
   */
  window._removeExtraSubnet = function(subnet) {
    if (!_networkSettings || !_networkSettings.extraSubnets) return;
    _networkSettings.extraSubnets = _networkSettings.extraSubnets.filter(s => s !== subnet);

    const el = document.getElementById('network-settings-section');
    if (el) _renderNetworkPanel(el);
  };

  /**
   * Save network settings to the API
   */
  window._saveNetworkSettings = async function() {
    const interval = parseInt(document.getElementById('net-rediscovery-interval')?.value) || 60;
    const timeout = parseInt(document.getElementById('net-scan-timeout')?.value) || 5000;

    const body = {
      extraSubnets: _networkSettings.extraSubnets || [],
      rediscoveryIntervalSeconds: interval,
      scanTimeoutMs: timeout
    };

    try {
      const res = await fetch('/api/network/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Save failed');

      _networkSettings = { ..._networkSettings, ...body };

      if (typeof window.showToast === 'function') {
        window.showToast('Nettverksinnstillinger lagret', 'success');
      }
    } catch (err) {
      if (typeof window.showToast === 'function') {
        window.showToast('Kunne ikke lagre innstillinger', 'error');
      }
    }
  };

  /**
   * Run a full network scan
   */
  window._runNetworkScan = async function() {
    _scanning = true;
    _scanResults = null;

    const btn = document.getElementById('net-scan-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-sm"></span> Skanner...';
    }
    const resultsEl = document.getElementById('net-scan-results');
    if (resultsEl) resultsEl.innerHTML = '<div class="text-muted" style="font-size:0.8rem;padding:8px 0">Skanner nettverket...</div>';

    try {
      const res = await fetch('/api/network/scan', { method: 'POST' });
      if (!res.ok) throw new Error('Scan failed');
      _scanResults = await res.json();
    } catch (err) {
      _scanResults = { bambu: [], moonraker: [] };
      if (typeof window.showToast === 'function') {
        window.showToast('Nettverksskanning feilet', 'error');
      }
    } finally {
      _scanning = false;
    }

    if (resultsEl) {
      resultsEl.innerHTML = _renderScanResults(_scanResults);
    }
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg> Sak etter printere';
    }
  };

  /**
   * Add a discovered printer (delegates to the existing add-printer flow)
   */
  window._addDiscoveredPrinter = function(type, ip, serial, name, model) {
    if (typeof window.showAddPrinterDialog === 'function') {
      window.showAddPrinterDialog({ type, ip, serial, name, model });
    } else {
      // Fallback: navigate to printers tab
      if (typeof window.switchSettingsTab === 'function') {
        window.switchSettingsTab('printers');
      }
      if (typeof window.showToast === 'function') {
        window.showToast('Ga til Printere-fanen for a legge til manuelt', 'info');
      }
    }
  };

})();
