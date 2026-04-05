// Model Forge — NFC Filament Tag Generator (OpenSpool format)
// Based on paxx12/PrintTag-Web — writes filament info to NFC tags
(function() {
  'use strict';

  const MATERIALS = ['PLA','PLA+','PETG','ABS','ASA','TPU','PA','PA-CF','PC','PVA','HIPS','PLA-CF','PETG-CF','Wood PLA','Silk PLA','PLA Matte','PLA SnapSpeed'];
  const VENDORS = ['Bambu Lab','Snapmaker','Polymaker','Prusament','eSUN','Hatchbox','Sunlu','Overture','Creality','Generic'];

  // Snapmaker U1 RFID tag format (Mifare Classic 1K)
  // Based on SnapmakerResearchGroup/RFID reverse engineering
  const SM_RFID_TYPES = { 0:'Reserved', 1:'PLA', 2:'PETG', 3:'ABS', 4:'TPU', 5:'PVA' };
  const SM_RFID_SUBTYPES = { 0:'Reserved', 1:'Basic', 2:'Matte', 3:'SnapSpeed' };

  window.loadForgeNfcTag = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    const hasNfc = 'NDEFReader' in window;

    el.innerHTML = `<style>
      .nfc-layout { display:grid; grid-template-columns:360px 1fr; gap:12px; min-height:400px; }
      .nfc-sidebar { overflow-y:auto; max-height:calc(100vh - 180px); }
      .nfc-form { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:12px; }
      .nfc-preview { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:16px; min-height:300px; }
      @media (max-width:900px) { .nfc-layout { grid-template-columns:1fr; } }
    </style>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
      <button class="form-btn form-btn-sm" onclick="window.loadModelForgePanel()" style="padding:4px 10px">← Back</button>
      <h4 style="margin:0;font-size:1rem">🏷️ NFC Filament Tag</h4>
    </div>
    ${!hasNfc ? '<div style="background:var(--accent-orange);color:#000;padding:10px 14px;border-radius:8px;margin-bottom:12px;font-size:0.82rem"><strong>Note:</strong> Web NFC requires Chrome on Android with NFC enabled. You can still generate tag data to write with other tools.</div>' : ''}
    <div class="nfc-layout">
      <div class="nfc-sidebar"><div class="nfc-form" id="nfc-form">
        <h5 style="margin:0 0 10px;font-size:0.88rem">Filament Info</h5>
        <div style="margin-bottom:8px">
          <label style="font-size:0.75rem;color:var(--text-muted)">Material</label>
          <select class="form-input" id="nfc-material" style="font-size:0.82rem">
            ${MATERIALS.map(m => `<option value="${m}">${m}</option>`).join('')}
          </select>
        </div>
        <div style="margin-bottom:8px">
          <label style="font-size:0.75rem;color:var(--text-muted)">Vendor</label>
          <select class="form-input" id="nfc-vendor" style="font-size:0.82rem">
            ${VENDORS.map(v => `<option value="${v}">${v}</option>`).join('')}
          </select>
        </div>
        <div style="margin-bottom:8px">
          <label style="font-size:0.75rem;color:var(--text-muted)">Color name</label>
          <input type="text" class="form-input" id="nfc-color-name" value="Black" style="font-size:0.82rem">
        </div>
        <div style="margin-bottom:8px">
          <label style="font-size:0.75rem;color:var(--text-muted)">Color hex</label>
          <input type="color" id="nfc-color-hex" value="#000000" style="width:100%;height:32px;border-radius:6px;border:1px solid var(--border-color);cursor:pointer">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
          <div><label style="font-size:0.75rem;color:var(--text-muted)">Nozzle min (°C)</label><input type="number" class="form-input" id="nfc-temp-min" value="190" style="font-size:0.82rem"></div>
          <div><label style="font-size:0.75rem;color:var(--text-muted)">Nozzle max (°C)</label><input type="number" class="form-input" id="nfc-temp-max" value="230" style="font-size:0.82rem"></div>
          <div><label style="font-size:0.75rem;color:var(--text-muted)">Bed temp (°C)</label><input type="number" class="form-input" id="nfc-bed" value="60" style="font-size:0.82rem"></div>
          <div><label style="font-size:0.75rem;color:var(--text-muted)">Weight (g)</label><input type="number" class="form-input" id="nfc-weight" value="1000" style="font-size:0.82rem"></div>
          <div><label style="font-size:0.75rem;color:var(--text-muted)">Diameter (mm)</label><input type="number" class="form-input" id="nfc-diameter" value="1.75" step="0.05" style="font-size:0.82rem"></div>
          <div><label style="font-size:0.75rem;color:var(--text-muted)">Density (g/cm³)</label><input type="number" class="form-input" id="nfc-density" value="1.24" step="0.01" style="font-size:0.82rem"></div>
        </div>
      </div></div>
      <div class="nfc-preview" id="nfc-result"></div>
    </div>`;

    const form = document.getElementById('nfc-form');
    if (form) {
      form.addEventListener('input', () => { clearTimeout(window._nfcD); window._nfcD = setTimeout(_update, 300); });
      form.addEventListener('change', _update);
    }
    setTimeout(_update, 100);
  };

  function _getData() {
    return {
      material: document.getElementById('nfc-material')?.value || 'PLA',
      vendor: document.getElementById('nfc-vendor')?.value || 'Generic',
      color_name: document.getElementById('nfc-color-name')?.value || 'Black',
      color_hex: document.getElementById('nfc-color-hex')?.value || '#000000',
      temp_min: parseInt(document.getElementById('nfc-temp-min')?.value) || 190,
      temp_max: parseInt(document.getElementById('nfc-temp-max')?.value) || 230,
      bed_temp: parseInt(document.getElementById('nfc-bed')?.value) || 60,
      weight: parseInt(document.getElementById('nfc-weight')?.value) || 1000,
      diameter: parseFloat(document.getElementById('nfc-diameter')?.value) || 1.75,
      density: parseFloat(document.getElementById('nfc-density')?.value) || 1.24,
    };
  }

  function _buildOpenSpool(data) {
    return {
      version: '1.0',
      protocol: 'openspool',
      color_hex: data.color_hex.replace('#', ''),
      color_name: data.color_name,
      type: data.material,
      brand: data.vendor,
      min_temp: data.temp_min,
      max_temp: data.temp_max,
      bed_temp: data.bed_temp,
      weight: data.weight,
      diameter: data.diameter,
      density: data.density,
    };
  }

  function _update() {
    const r = document.getElementById('nfc-result');
    if (!r) return;
    const d = _getData();
    const tag = _buildOpenSpool(d);
    const json = JSON.stringify(tag, null, 2);
    const hasNfc = 'NDEFReader' in window;

    r.innerHTML = `
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">
        ${hasNfc ? '<button class="form-btn form-btn-sm" data-ripple onclick="window._nfcWrite()" style="background:var(--accent-green);color:#fff;font-size:0.82rem;padding:6px 16px">📱 Write to NFC Tag</button>' : ''}
        ${hasNfc ? '<button class="form-btn form-btn-sm" data-ripple onclick="window._nfcRead()" style="font-size:0.82rem">📖 Read NFC Tag</button>' : ''}
        <button class="form-btn form-btn-sm" data-ripple onclick="navigator.clipboard.writeText(JSON.stringify(${JSON.stringify(tag)}));if(typeof showToast==='function')showToast('Copied!','success')" style="font-size:0.82rem">📋 Copy JSON</button>
      </div>

      <div style="display:flex;align-items:center;gap:12px;margin:10px 0">
        <div style="width:50px;height:50px;border-radius:50%;background:${d.color_hex};border:3px solid rgba(255,255,255,0.2);flex-shrink:0"></div>
        <div>
          <div style="font-size:1rem;font-weight:700">${d.vendor} ${d.material}</div>
          <div style="font-size:0.8rem;color:var(--text-muted)">${d.color_name} — ${d.temp_min}-${d.temp_max}°C / Bed ${d.bed_temp}°C</div>
          <div style="font-size:0.75rem;color:var(--text-muted)">${d.weight}g / ⌀${d.diameter}mm / ${d.density} g/cm³</div>
        </div>
      </div>

      <div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:4px">OpenSpool JSON (NDEF text record)</div>
      <pre style="background:var(--bg-tertiary);padding:10px;border-radius:6px;font-size:0.7rem;max-width:100%;overflow-x:auto;white-space:pre-wrap;margin:0">${json.replace(/</g,'&lt;')}</pre>

      <div style="font-size:0.65rem;color:var(--text-muted);margin-top:8px;text-align:center">
        Compatible with: Snapmaker U1 NFC, OpenSpool, OpenPrintTag<br>
        Tags: NTAG215 (recommended) or NTAG216
      </div>`;
  }

  window._nfcWrite = async function() {
    if (!('NDEFReader' in window)) { showToast('NFC not available in this browser', 'error'); return; }
    try {
      const d = _getData();
      const tag = _buildOpenSpool(d);
      const json = JSON.stringify(tag);
      if (typeof showToast === 'function') showToast('Hold NFC tag near device...', 'info');
      const ndef = new NDEFReader();
      await ndef.write({ records: [{ recordType: 'text', data: json, lang: 'en' }] });
      if (typeof showToast === 'function') showToast('NFC tag written!', 'success');
    } catch (e) {
      if (typeof showToast === 'function') showToast('NFC write failed: ' + e.message, 'error');
    }
  };

  window._nfcRead = async function() {
    if (!('NDEFReader' in window)) { showToast('NFC not available', 'error'); return; }
    try {
      if (typeof showToast === 'function') showToast('Hold NFC tag near device...', 'info');
      const ndef = new NDEFReader();
      await ndef.scan();
      ndef.addEventListener('reading', ({ message }) => {
        for (const record of message.records) {
          if (record.recordType === 'text') {
            const text = new TextDecoder().decode(record.data);
            try {
              const data = JSON.parse(text);
              if (data.type) document.getElementById('nfc-material').value = data.type;
              if (data.brand) document.getElementById('nfc-vendor').value = data.brand;
              if (data.color_name) document.getElementById('nfc-color-name').value = data.color_name;
              if (data.color_hex) document.getElementById('nfc-color-hex').value = '#' + data.color_hex;
              if (data.min_temp) document.getElementById('nfc-temp-min').value = data.min_temp;
              if (data.max_temp) document.getElementById('nfc-temp-max').value = data.max_temp;
              if (data.bed_temp) document.getElementById('nfc-bed').value = data.bed_temp;
              if (data.weight) document.getElementById('nfc-weight').value = data.weight;
              _update();
              if (typeof showToast === 'function') showToast('NFC tag read: ' + data.brand + ' ' + data.type, 'success');
            } catch { showToast('Invalid tag data', 'error'); }
          }
        }
      });
    } catch (e) { showToast('NFC read failed: ' + e.message, 'error'); }
  };
})();
