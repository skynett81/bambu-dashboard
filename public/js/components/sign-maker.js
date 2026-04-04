// Sign Maker — generate printable signs, QR codes, labels and cards
(function() {
  'use strict';

  const TEMPLATES = [
    { id: 'wifi', name: 'WiFi Sign', icon: '📶', desc: 'QR code for guests to connect to WiFi', fields: ['ssid', 'password', 'security'] },
    { id: 'url', name: 'URL / Link', icon: '🔗', desc: 'QR code linking to any website or page', fields: ['url', 'title'] },
    { id: 'dashboard', name: 'Dashboard Access', icon: '🖥️', desc: 'QR code to open 3DPrintForge on mobile', fields: [] },
    { id: 'printer', name: 'Printer Label', icon: '🏷️', desc: 'Label for a 3D printer with name, IP, and QR', fields: ['printer'] },
    { id: 'filament', name: 'Filament Spool Tag', icon: '🧵', desc: 'Tag for a filament spool with material, colour, and specs', fields: ['material', 'colour', 'brand', 'temp'] },
    { id: 'warning', name: 'Warning Sign', icon: '⚠️', desc: 'Safety warning sign for the print area', fields: ['message'] },
    { id: 'custom', name: 'Custom Sign', icon: '✏️', desc: 'Create any sign with title, message, and optional QR', fields: ['title', 'message', 'qr_data'] },
    { id: 'contact', name: 'Contact Card', icon: '📇', desc: 'vCard QR code with name, phone, email', fields: ['name', 'phone', 'email', 'company'] },
    { id: 'inventory', name: 'Inventory Tag', icon: '📦', desc: 'Asset tag with ID, description, and QR code', fields: ['asset_id', 'description', 'location'] },
  ];

  function _esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function _makeQR(text, size) {
    if (typeof qrcode === 'undefined') return '';
    try {
      const qr = qrcode(0, 'M');
      qr.addData(text);
      qr.make();
      return qr.createSvgTag({ cellSize: size || 4, margin: 0 });
    } catch { return ''; }
  }

  window.loadSignMakerPanel = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    let h = `<style>
      .sm-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:12px; margin-bottom:20px; }
      .sm-card { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:16px; cursor:pointer; transition:all 0.2s; }
      .sm-card:hover { border-color:var(--accent-blue); box-shadow:0 4px 12px rgba(0,0,0,0.2); transform:translateY(-1px); }
      .sm-card.active { border-color:var(--accent-green); background:color-mix(in srgb, var(--accent-green) 5%, var(--bg-secondary)); }
      .sm-card-icon { font-size:1.8rem; margin-bottom:6px; }
      .sm-card-name { font-size:0.9rem; font-weight:700; margin-bottom:2px; }
      .sm-card-desc { font-size:0.72rem; color:var(--text-muted); }
      .sm-form { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:20px; margin-bottom:16px; }
      .sm-preview { background:#fff; color:#000; border-radius:12px; padding:28px; text-align:center; display:inline-block; box-shadow:0 4px 24px rgba(0,0,0,0.3); min-width:280px; }
      .sm-actions { display:flex; gap:8px; margin-top:14px; flex-wrap:wrap; }
    </style>`;

    h += '<div class="sm-grid" id="sm-templates">';
    for (const t of TEMPLATES) {
      h += `<div class="sm-card" data-template="${t.id}" onclick="window._smSelectTemplate('${t.id}')">
        <div class="sm-card-icon">${t.icon}</div>
        <div class="sm-card-name">${t.name}</div>
        <div class="sm-card-desc">${t.desc}</div>
      </div>`;
    }
    h += '</div>';

    h += '<div id="sm-editor" style="display:none"></div>';
    h += '<div id="sm-result" style="display:none;text-align:center"></div>';

    el.innerHTML = h;
  };

  window._smSelectTemplate = function(id) {
    const tmpl = TEMPLATES.find(t => t.id === id);
    if (!tmpl) return;

    // Highlight selected
    document.querySelectorAll('.sm-card').forEach(c => c.classList.toggle('active', c.dataset.template === id));

    const editor = document.getElementById('sm-editor');
    const result = document.getElementById('sm-result');
    if (!editor) return;
    editor.style.display = '';
    result.style.display = 'none';

    let h = `<div class="sm-form"><h4 style="margin:0 0 12px;font-size:1rem">${tmpl.icon} ${tmpl.name}</h4>`;

    if (id === 'wifi') {
      h += _field('SSID (network name)', 'sm-ssid', 'text', localStorage.getItem('wifi-qr-ssid') || '');
      h += _field('Password', 'sm-pass', 'password', localStorage.getItem('wifi-qr-pass') || '');
      h += _select('Security', 'sm-enc', [['WPA', 'WPA/WPA2/WPA3'], ['WEP', 'WEP'], ['nopass', 'Open (no password)']]);
      h += _field('Welcome text', 'sm-welcome', 'text', 'Welcome');
      h += _field('Bottom text', 'sm-bottom', 'text', 'Enjoy WiFi');
      h += _checkbox('Hidden network', 'sm-hidden');
      h += _checkbox('Show password on sign', 'sm-show-pass');
    } else if (id === 'url') {
      h += _field('URL', 'sm-url', 'url', location.origin);
      h += _field('Title (optional)', 'sm-title', 'text', '');
    } else if (id === 'dashboard') {
      h += `<p class="text-muted" style="font-size:0.85rem">Dashboard URL: <strong>${_esc(location.origin)}</strong></p>`;
    } else if (id === 'printer') {
      const printers = window.printerState ? window.printerState.getPrinterIds().map(pid => {
        const meta = window.printerState._printerMeta?.[pid];
        return { id: pid, name: meta?.name || pid, model: meta?.model || '', ip: meta?.ip || '' };
      }) : [];
      h += _select('Printer', 'sm-printer', printers.map(p => [p.id, p.name + (p.model ? ' (' + p.model + ')' : '')]));
    } else if (id === 'filament') {
      h += _field('Material', 'sm-material', 'text', 'PLA');
      h += _field('Colour', 'sm-colour', 'text', '');
      h += _field('Brand', 'sm-brand', 'text', '');
      h += _field('Nozzle temp (°C)', 'sm-temp', 'number', '210');
      h += _field('Bed temp (°C)', 'sm-bed', 'number', '60');
    } else if (id === 'warning') {
      h += _select('Warning type', 'sm-warn-type', [
        ['hot', '🔥 Hot Surface — Do Not Touch'],
        ['moving', '⚙️ Moving Parts — Keep Clear'],
        ['fumes', '💨 Ventilation Required'],
        ['electric', '⚡ High Voltage'],
        ['custom', '✏️ Custom message']
      ]);
      h += _field('Custom message', 'sm-warn-msg', 'text', '', 'sm-warn-custom');
    } else if (id === 'custom') {
      h += _field('Title', 'sm-c-title', 'text', '');
      h += _field('Message', 'sm-c-msg', 'text', '');
      h += _field('QR data (optional — URL, text, etc.)', 'sm-c-qr', 'text', '');
    } else if (id === 'contact') {
      h += _field('Full name', 'sm-v-name', 'text', '');
      h += _field('Phone', 'sm-v-phone', 'tel', '');
      h += _field('Email', 'sm-v-email', 'email', '');
      h += _field('Company', 'sm-v-company', 'text', '');
    } else if (id === 'inventory') {
      h += _field('Asset ID', 'sm-inv-id', 'text', '');
      h += _field('Description', 'sm-inv-desc', 'text', '');
      h += _field('Location', 'sm-inv-loc', 'text', '');
    }

    // 3D Print Options — collapsible sections matching parametric generator style
    h += `<div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border-color)">
      <h5 style="margin:0 0 12px;font-size:0.9rem;color:var(--text-primary)">🧊 3D Model Settings</h5>`;

    // Sign Plate
    h += _section('Sign Plate', `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        ${_rangeField('Width (mm)', 'sm-3d-w', 40, 150, 80, 5)}
        ${_rangeField('Height (mm)', 'sm-3d-h', 30, 120, 55, 5)}
        ${_rangeField('Thickness (mm)', 'sm-3d-depth', 1, 5, 2, 0.5)}
        ${_rangeField('Corner radius (mm)', 'sm-3d-radius', 0, 15, 3, 1)}
      </div>`, true);

    // QR Code
    h += _section('QR Code', `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        ${_rangeField('QR size (mm)', 'sm-3d-qrsize', 15, 80, 35, 1)}
        ${_rangeField('Dot size (mm)', 'sm-3d-pixel', 0.6, 2.0, 1.2, 0.2)}
        ${_rangeField('Height (mm)', 'sm-3d-qrh', 0.2, 2.0, 0.8, 0.2)}
      </div>
      <div style="margin-top:6px">
        <label class="form-label" style="font-size:0.75rem">Error correction</label>
        <select class="form-input" id="sm-3d-ecc" style="font-size:0.8rem">
          <option value="L">Low (7%)</option>
          <option value="M" selected>Medium (15%)</option>
          <option value="Q">Quartile (25%)</option>
          <option value="H">High (30%)</option>
        </select>
      </div>`, true);

    // Text
    h += _section('Text', `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        ${_rangeField('Text height (mm)', 'sm-3d-texth', 0.2, 2.0, 0.8, 0.2)}
        ${_rangeField('Text size (mm)', 'sm-3d-textsize', 4, 20, 8, 1)}
      </div>`, true);

    // Frame
    h += _section('Frame', `
      <label style="font-size:0.8rem;cursor:pointer;display:flex;align-items:center;gap:6px;margin-bottom:8px">
        <input type="checkbox" id="sm-3d-border"> Enable frame
      </label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        ${_rangeField('Frame width (mm)', 'sm-3d-framew', 2, 12, 5, 1)}
        ${_rangeField('Lip width (mm)', 'sm-3d-lip', 0, 5, 2, 0.5)}
        ${_rangeField('Lip depth (mm)', 'sm-3d-lipd', 0.5, 3, 1.5, 0.5)}
        ${_rangeField('Chamfer (mm)', 'sm-3d-chamfer', 0, 4, 1.5, 0.5)}
        ${_rangeField('Tolerance (mm)', 'sm-3d-frametol', 0.1, 0.5, 0.3, 0.05)}
      </div>`);

    // Stand
    h += _section('Stand', `
      <label style="font-size:0.8rem;cursor:pointer;display:flex;align-items:center;gap:6px;margin-bottom:8px">
        <input type="checkbox" id="sm-3d-stand" checked> Enable desk stand
      </label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        ${_rangeField('Slot depth (mm)', 'sm-3d-slotd', 5, 25, 15, 1)}
        ${_rangeField('Slot tolerance (mm)', 'sm-3d-slottol', 0.1, 0.5, 0.3, 0.05)}
        ${_rangeField('Base height (mm)', 'sm-3d-baseh', 3, 15, 8, 1)}
        ${_rangeField('Base depth (mm)', 'sm-3d-based', 20, 60, 40, 5)}
      </div>`);

    // Magnets
    h += _section('Magnets', `
      <label style="font-size:0.8rem;cursor:pointer;display:flex;align-items:center;gap:6px;margin-bottom:8px">
        <input type="checkbox" id="sm-3d-magnets"> Enable magnet holes
      </label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div>
          <label class="form-label" style="font-size:0.75rem">Diameter</label>
          <select class="form-input" id="sm-3d-magdia" style="font-size:0.8rem">
            <option value="4">4mm</option>
            <option value="6" selected>6mm</option>
            <option value="8">8mm</option>
            <option value="10">10mm</option>
          </select>
        </div>
        <div>
          <label class="form-label" style="font-size:0.75rem">Thickness</label>
          <select class="form-input" id="sm-3d-magth" style="font-size:0.8rem">
            <option value="1">1mm</option>
            <option value="2" selected>2mm</option>
            <option value="3">3mm</option>
          </select>
        </div>
        ${_rangeField('Tolerance (mm)', 'sm-3d-magtol', 0.1, 0.4, 0.2, 0.05)}
      </div>`);

    // NFC Tag
    h += _section('NFC Tag', `
      <label style="font-size:0.8rem;cursor:pointer;display:flex;align-items:center;gap:6px;margin-bottom:8px">
        <input type="checkbox" id="sm-3d-nfc"> Enable NFC tag slot
      </label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div>
          <label class="form-label" style="font-size:0.75rem">Shape</label>
          <select class="form-input" id="sm-3d-nfcshape" style="font-size:0.8rem">
            <option value="circle" selected>Circle</option>
            <option value="square">Square</option>
          </select>
        </div>
        ${_rangeField('Diameter (mm)', 'sm-3d-nfcdia', 15, 40, 25, 1)}
        ${_rangeField('Thickness (mm)', 'sm-3d-nfcth', 0.5, 2, 0.85, 0.05)}
        ${_rangeField('Tolerance (mm)', 'sm-3d-nfctol', 0.1, 0.5, 0.3, 0.05)}
      </div>`);

    // Wall Mount
    h += _section('Wall Mount', `
      <label style="font-size:0.8rem;cursor:pointer;display:flex;align-items:center;gap:6px;margin-bottom:8px">
        <input type="checkbox" id="sm-3d-holes"> Enable mount holes
      </label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        ${_rangeField('Hole diameter (mm)', 'sm-3d-holedia', 2, 6, 4, 0.5)}
        ${_rangeField('Margin (mm)', 'sm-3d-holemarg', 3, 10, 5, 1)}
      </div>`);

    h += '</div>';

    h += `<div class="sm-actions" style="margin-top:14px">
      <button class="form-btn form-btn-primary" data-ripple onclick="window._smGenerate('${id}')">Preview Sign</button>
      <button class="form-btn form-btn-primary" data-ripple onclick="window._smDownload3MF('${id}')" style="background:var(--accent-green)">🧊 Download 3MF</button>
    </div></div>`;

    editor.innerHTML = h;
  };

  window._smGenerate = function(id) {
    const result = document.getElementById('sm-result');
    if (!result) return;
    result.style.display = '';

    let signHtml = '';
    let qrData = '';

    if (id === 'wifi') {
      const ssid = _val('sm-ssid');
      const pass = _val('sm-pass');
      const enc = _val('sm-enc');
      const hidden = document.getElementById('sm-hidden')?.checked;
      const welcome = _val('sm-welcome') || 'Welcome';
      const bottom = _val('sm-bottom') || 'Enjoy WiFi';
      const showPass = document.getElementById('sm-show-pass')?.checked;
      if (!ssid) return;
      try { localStorage.setItem('wifi-qr-ssid', ssid); localStorage.setItem('wifi-qr-pass', pass); } catch {}
      const esc = (s) => s.replace(/[\\;,:""]/g, c => '\\' + c);
      qrData = `WIFI:T:${enc};S:${esc(ssid)};P:${esc(pass)};H:${hidden ? 'true' : 'false'};;`;
      signHtml = `
        <div style="padding:8px 20px;font-family:'Georgia',serif">
          <div style="font-size:2rem;font-weight:700;font-style:italic;margin-bottom:6px">${_esc(welcome)}</div>
          <hr style="border:none;border-top:2px solid #000;margin:0 0 14px">
          <div style="position:relative;display:inline-block;margin:0 auto">
            ${_makeQR(qrData, 5)}
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 3px #fff">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2"><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><circle cx="12" cy="20" r="1" fill="#000"/></svg>
            </div>
          </div>
          <hr style="border:none;border-top:2px solid #000;margin:14px 0 8px">
          <div style="font-size:1.5rem;font-weight:700;font-style:italic;margin-bottom:10px">${_esc(bottom)}</div>
          <div style="display:grid;grid-template-columns:auto 1fr;gap:2px 12px;text-align:left;font-size:0.9rem">
            <strong>Name</strong><span>${_esc(ssid)}</span>
            ${pass && enc !== 'nopass' ? '<strong>Password</strong><span>' + (showPass ? _esc(pass) : '••••••••') + '</span>' : ''}
          </div>
        </div>`;

    } else if (id === 'url') {
      const url = _val('sm-url') || location.origin;
      const title = _val('sm-title');
      qrData = url;
      signHtml = `
        ${title ? '<div style="font-size:1.3rem;font-weight:800">' + _esc(title) + '</div>' : ''}
        <div style="margin:16px auto">${_makeQR(url, 5)}</div>
        <div style="font-size:0.8rem;color:#666;word-break:break-all">${_esc(url)}</div>
        <div style="font-size:0.6rem;color:#aaa;margin-top:8px">Scan to open</div>`;

    } else if (id === 'dashboard') {
      qrData = location.origin;
      signHtml = `
        <div style="font-size:1.3rem;font-weight:800">🖥️ 3DPrintForge</div>
        <div style="margin:16px auto">${_makeQR(location.origin, 5)}</div>
        <div style="font-size:0.85rem;color:#666">${_esc(location.origin)}</div>
        <div style="font-size:0.6rem;color:#aaa;margin-top:8px">Scan to open dashboard</div>`;

    } else if (id === 'printer') {
      const pid = _val('sm-printer');
      const meta = window.printerState?._printerMeta?.[pid] || {};
      const state = window.printerState?._printers?.[pid];
      const data = state?.print || state || {};
      const url = location.origin;
      qrData = url;
      signHtml = `
        <div style="font-size:1.2rem;font-weight:800">🖨️ ${_esc(meta.name || pid)}</div>
        ${meta.model ? '<div style="font-size:0.85rem;color:#666">' + _esc(meta.model) + '</div>' : ''}
        <div style="margin:14px auto">${_makeQR(url, 4)}</div>
        <div style="font-size:0.8rem;text-align:left;display:inline-block;margin-top:8px">
          ${meta.ip ? '<div><strong>IP:</strong> ' + _esc(meta.ip) + '</div>' : ''}
          ${data.gcode_state ? '<div><strong>Status:</strong> ' + _esc(data.gcode_state) + '</div>' : ''}
        </div>
        <div style="font-size:0.6rem;color:#aaa;margin-top:8px">Scan to open dashboard</div>`;

    } else if (id === 'filament') {
      const material = _val('sm-material');
      const colour = _val('sm-colour');
      const brand = _val('sm-brand');
      const temp = _val('sm-temp');
      const bed = _val('sm-bed');
      signHtml = `
        <div style="font-size:1.3rem;font-weight:800">🧵 ${_esc(material)}</div>
        ${colour ? '<div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:4px"><span style="width:16px;height:16px;border-radius:50%;background:' + _esc(colour) + ';border:2px solid #ccc;display:inline-block"></span><span style="font-size:0.9rem">' + _esc(colour) + '</span></div>' : ''}
        ${brand ? '<div style="font-size:0.85rem;color:#666;margin-top:4px">' + _esc(brand) + '</div>' : ''}
        <div style="margin-top:12px;font-size:0.9rem;text-align:left;display:inline-block;border-top:1px solid #ddd;padding-top:8px">
          ${temp ? '<div>🔥 Nozzle: <strong>' + _esc(temp) + '°C</strong></div>' : ''}
          ${bed ? '<div>🛏️ Bed: <strong>' + _esc(bed) + '°C</strong></div>' : ''}
        </div>`;

    } else if (id === 'warning') {
      const type = _val('sm-warn-type');
      const msgs = { hot: '🔥 HOT SURFACE\nDo Not Touch', moving: '⚙️ MOVING PARTS\nKeep Clear', fumes: '💨 VENTILATION\nRequired', electric: '⚡ HIGH VOLTAGE\nDanger', custom: _val('sm-warn-msg') || 'WARNING' };
      const msg = msgs[type] || msgs.custom;
      const lines = msg.split('\n');
      signHtml = `
        <div style="background:#FFD700;color:#000;padding:20px 30px;border-radius:8px;border:4px solid #000">
          <div style="font-size:1.6rem;font-weight:900;letter-spacing:2px">${_esc(lines[0])}</div>
          ${lines[1] ? '<div style="font-size:1rem;font-weight:600;margin-top:4px">' + _esc(lines[1]) + '</div>' : ''}
        </div>`;

    } else if (id === 'custom') {
      const title = _val('sm-c-title');
      const msg = _val('sm-c-msg');
      const qr = _val('sm-c-qr');
      if (qr) qrData = qr;
      signHtml = `
        ${title ? '<div style="font-size:1.4rem;font-weight:800">' + _esc(title) + '</div>' : ''}
        ${qr ? '<div style="margin:14px auto">' + _makeQR(qr, 5) + '</div>' : ''}
        ${msg ? '<div style="font-size:0.9rem;color:#444;margin-top:8px">' + _esc(msg) + '</div>' : ''}`;

    } else if (id === 'contact') {
      const name = _val('sm-v-name');
      const phone = _val('sm-v-phone');
      const email = _val('sm-v-email');
      const company = _val('sm-v-company');
      const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\n${phone ? 'TEL:' + phone + '\n' : ''}${email ? 'EMAIL:' + email + '\n' : ''}${company ? 'ORG:' + company + '\n' : ''}END:VCARD`;
      qrData = vcard;
      signHtml = `
        <div style="font-size:1.2rem;font-weight:800">📇 ${_esc(name)}</div>
        ${company ? '<div style="font-size:0.85rem;color:#666">' + _esc(company) + '</div>' : ''}
        <div style="margin:14px auto">${_makeQR(vcard, 4)}</div>
        <div style="font-size:0.8rem;text-align:left;display:inline-block">
          ${phone ? '<div>📞 ' + _esc(phone) + '</div>' : ''}
          ${email ? '<div>✉️ ' + _esc(email) + '</div>' : ''}
        </div>
        <div style="font-size:0.6rem;color:#aaa;margin-top:8px">Scan to add contact</div>`;

    } else if (id === 'inventory') {
      const assetId = _val('sm-inv-id');
      const desc = _val('sm-inv-desc');
      const loc = _val('sm-inv-loc');
      qrData = `ASSET:${assetId}|${desc}|${loc}`;
      signHtml = `
        <div style="font-size:0.7rem;color:#999;text-transform:uppercase;letter-spacing:2px">Inventory</div>
        <div style="font-size:1.4rem;font-weight:900;font-family:monospace;margin:4px 0">${_esc(assetId)}</div>
        <div style="margin:12px auto">${_makeQR(qrData, 4)}</div>
        ${desc ? '<div style="font-size:0.85rem;margin-top:6px">' + _esc(desc) + '</div>' : ''}
        ${loc ? '<div style="font-size:0.78rem;color:#666">📍 ' + _esc(loc) + '</div>' : ''}`;
    }

    result.innerHTML = `
      <div class="sm-preview" id="sm-sign">${signHtml}</div>
      <div class="sm-actions" style="justify-content:center;margin-top:16px">
        <button class="form-btn form-btn-primary" data-ripple onclick="window._smPrint()">🖨️ Print on paper</button>
        <button class="form-btn form-btn-sm form-btn-secondary" data-ripple onclick="window._smDownload()">📥 Download PNG</button>
        <button class="form-btn form-btn-sm form-btn-secondary" data-ripple onclick="window._smGenerate('${id}')">🔄 Regenerate</button>
      </div>`;
  };

  window._smPrint = function() {
    const sign = document.getElementById('sm-sign');
    if (!sign) return;
    const w = window.open('', '_blank');
    w.document.write('<html><head><title>Sign — 3DPrintForge</title><style>body{display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#fff}@media print{body{background:#fff}}</style></head><body>');
    w.document.write(sign.outerHTML.replace('class="sm-preview"', 'style="background:#fff;color:#000;border-radius:12px;padding:28px;text-align:center;min-width:280px"'));
    w.document.write('</body></html>');
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  window._smDownload = function() {
    const sign = document.getElementById('sm-sign');
    if (!sign) return;
    const svgEl = sign.querySelector('svg');
    if (!svgEl) {
      if (typeof showToast === 'function') showToast('No QR code to download', 'info');
      return;
    }
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    canvas.width = 600; canvas.height = 600;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, 600, 600);
      ctx.drawImage(img, 50, 50, 500, 500);
      const a = document.createElement('a');
      a.download = 'sign-3dprintforge.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // ── Download as 3MF (3D printable model) ──

  window._smDownload3MF = async function(templateId) {
    const _n = (id, fallback) => parseFloat(_val(id)) || fallback;
    const _c = (id) => !!document.getElementById(id)?.checked;

    const body = {
      // Sign plate
      plate_width: _n('sm-3d-w', 80),
      plate_height: _n('sm-3d-h', 55),
      plate_depth: _n('sm-3d-depth', 2),
      corner_radius: _n('sm-3d-radius', 3),
      // QR code
      qr_size: _n('sm-3d-qrsize', 35),
      pixel_size: _n('sm-3d-pixel', 1.2),
      qr_height: _n('sm-3d-qrh', 0.8),
      ecc: _val('sm-3d-ecc') || 'M',
      // Text
      text_height: _n('sm-3d-texth', 0.8),
      text_size: _n('sm-3d-textsize', 8),
      // Frame
      include_border: _c('sm-3d-border'),
      frame_width: _n('sm-3d-framew', 5),
      lip_width: _n('sm-3d-lip', 2),
      lip_depth: _n('sm-3d-lipd', 1.5),
      frame_chamfer: _n('sm-3d-chamfer', 1.5),
      frame_tolerance: _n('sm-3d-frametol', 0.3),
      // Stand
      include_stand: _c('sm-3d-stand'),
      stand_slot_depth: _n('sm-3d-slotd', 15),
      stand_slot_tolerance: _n('sm-3d-slottol', 0.3),
      stand_base_height: _n('sm-3d-baseh', 8),
      stand_base_depth: _n('sm-3d-based', 40),
      // Magnets
      include_magnets: _c('sm-3d-magnets'),
      magnet_diameter: _n('sm-3d-magdia', 6),
      magnet_thickness: _n('sm-3d-magth', 2),
      magnet_tolerance: _n('sm-3d-magtol', 0.2),
      // NFC
      include_nfc: _c('sm-3d-nfc'),
      nfc_shape: _val('sm-3d-nfcshape') || 'circle',
      nfc_diameter: _n('sm-3d-nfcdia', 25),
      nfc_thickness: _n('sm-3d-nfcth', 0.85),
      nfc_tolerance: _n('sm-3d-nfctol', 0.3),
      // Wall mount
      include_holes: _c('sm-3d-holes'),
      hole_diameter: _n('sm-3d-holedia', 4),
      hole_margin: _n('sm-3d-holemarg', 5),
    };

    if (templateId === 'wifi') {
      body.title = _val('sm-ssid') || 'WiFi';
      body.subtitle = _val('sm-pass') ? 'Pass: ' + _val('sm-pass') : '';
      const enc = _val('sm-enc');
      const hidden = document.getElementById('sm-hidden')?.checked;
      const esc = (s) => s.replace(/[\\;,:""]/g, c => '\\' + c);
      body.qr_data = `WIFI:T:${enc};S:${esc(body.title)};P:${esc(_val('sm-pass'))};H:${hidden?'true':'false'};;`;
    } else if (templateId === 'url') {
      body.title = _val('sm-title') || 'Scan Me';
      body.qr_data = _val('sm-url') || location.origin;
    } else if (templateId === 'dashboard') {
      body.title = '3DPrintForge';
      body.qr_data = location.origin;
    } else if (templateId === 'printer') {
      const pid = _val('sm-printer');
      const meta = window.printerState?._printerMeta?.[pid] || {};
      body.title = meta.name || pid;
      body.subtitle = meta.model || '';
      body.qr_data = location.origin;
    } else if (templateId === 'filament') {
      body.title = _val('sm-material') || 'PLA';
      body.subtitle = [_val('sm-brand'), _val('sm-colour'), _val('sm-temp') ? _val('sm-temp') + 'C' : ''].filter(Boolean).join(' - ');
    } else if (templateId === 'warning') {
      const type = _val('sm-warn-type');
      const msgs = { hot: 'HOT SURFACE', moving: 'MOVING PARTS', fumes: 'VENTILATION', electric: 'HIGH VOLTAGE', custom: _val('sm-warn-msg') || 'WARNING' };
      body.title = msgs[type] || 'WARNING';
      body.subtitle = 'DANGER';
      body.plate_width = 100; body.plate_height = 60;
    } else if (templateId === 'custom') {
      body.title = _val('sm-c-title') || 'Sign';
      body.subtitle = _val('sm-c-msg') || '';
      body.qr_data = _val('sm-c-qr') || '';
    } else if (templateId === 'contact') {
      body.title = _val('sm-v-name') || 'Contact';
      body.subtitle = _val('sm-v-company') || '';
      const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${_val('sm-v-name')}\n${_val('sm-v-phone') ? 'TEL:'+_val('sm-v-phone')+'\n' : ''}${_val('sm-v-email') ? 'EMAIL:'+_val('sm-v-email')+'\n' : ''}END:VCARD`;
      body.qr_data = vcard;
    } else if (templateId === 'inventory') {
      body.title = _val('sm-inv-id') || 'ASSET';
      body.subtitle = _val('sm-inv-desc') || '';
      body.qr_data = `ASSET:${_val('sm-inv-id')}|${_val('sm-inv-desc')}|${_val('sm-inv-loc')}`;
    }

    if (!body.title && !body.qr_data) {
      if (typeof showToast === 'function') showToast('Fill in the form first', 'error');
      return;
    }

    try {
      if (typeof showToast === 'function') showToast('Generating 3MF...', 'info');
      const res = await fetch('/api/sign-maker/generate-3mf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Generation failed');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (body.title || 'sign').replace(/[^a-zA-Z0-9_-]/g, '_') + '.3mf';
      a.click();
      URL.revokeObjectURL(a.href);
      if (typeof showToast === 'function') showToast('3MF downloaded — open in your slicer!', 'success');
    } catch (e) {
      if (typeof showToast === 'function') showToast(e.message, 'error');
    }
  };

  // Helpers
  function _val(id) { return document.getElementById(id)?.value?.trim() || ''; }
  function _field(label, id, type, val, wrapId) {
    return `<div ${wrapId ? 'id="' + wrapId + '"' : ''} style="margin-bottom:10px"><label class="form-label">${label}</label><input type="${type}" class="form-input" id="${id}" value="${_esc(val)}" style="max-width:400px"></div>`;
  }
  function _select(label, id, options) {
    return `<div style="margin-bottom:10px"><label class="form-label">${label}</label><select class="form-input" id="${id}" style="max-width:400px">${options.map(o => '<option value="' + _esc(o[0]) + '">' + _esc(o[1]) + '</option>').join('')}</select></div>`;
  }
  function _checkbox(label, id) {
    return `<label style="display:flex;align-items:center;gap:6px;font-size:0.85rem;cursor:pointer;margin-bottom:10px"><input type="checkbox" id="${id}"> ${label}</label>`;
  }
  function _section(title, content, open) {
    const id = 'sm-sec-' + title.replace(/\s/g, '').toLowerCase();
    return `<div style="margin-bottom:8px;border:1px solid var(--border-color);border-radius:8px;overflow:hidden">
      <div onclick="const c=this.nextElementSibling;c.style.display=c.style.display==='none'?'':'none';this.querySelector('.sm-arrow').textContent=c.style.display==='none'?'▸':'▾'" style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--bg-tertiary);cursor:pointer;font-size:0.85rem;font-weight:600">
        <span>${title}</span><span class="sm-arrow">${open ? '▾' : '▸'}</span>
      </div>
      <div style="padding:10px 12px;${open ? '' : 'display:none'}">${content}</div>
    </div>`;
  }
  function _rangeField(label, id, min, max, val, step) {
    return `<div style="margin-bottom:6px">
      <label class="form-label" style="font-size:0.72rem;margin-bottom:2px">${label}</label>
      <div style="display:flex;align-items:center;gap:6px">
        <input type="number" class="form-input" id="${id}" value="${val}" min="${min}" max="${max}" step="${step}" style="width:55px;font-size:0.8rem;padding:3px 6px" oninput="const s=this.nextElementSibling;if(s)s.value=this.value">
        <input type="range" min="${min}" max="${max}" value="${val}" step="${step}" style="flex:1;accent-color:var(--accent-blue)" oninput="const n=this.previousElementSibling;if(n)n.value=this.value">
      </div>
    </div>`;
  }
})();
