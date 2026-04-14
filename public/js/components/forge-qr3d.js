// Model Forge — 3D QR Code
(function() {
  'use strict';
  window.loadForgeQr3d = function() {
    const v = id => parseFloat(document.getElementById(id)?.value) || 0;
    const c = id => !!document.getElementById(id)?.checked;
    window.ForgeCommon.buildTool({
      title: '3D QR Code', icon: '⬛',
      endpoint: '/api/model-forge/qr3d/generate-3mf',
      downloadName: 'qr3d',
      helpText: 'Type any text, URL, or WiFi string (e.g. "WIFI:S:MyNet;T:WPA;P:password;;"). Print with a black/white color change at the base for scannable contrast.',
      fields: [
        { type: 'num', label: 'Module size (mm)', id: 'qr-ms', min: 0.6, max: 6, val: 2, step: 0.1 },
        { type: 'num', label: 'Base thickness (mm)', id: 'qr-bt', min: 0.8, max: 8, val: 1.6, step: 0.2 },
        { type: 'num', label: 'Dot height (mm)', id: 'qr-dh', min: 0.3, max: 6, val: 1.2, step: 0.1 },
        { type: 'num', label: 'Quiet zone (modules)', id: 'qr-mg', min: 0, max: 10, val: 4, step: 1 },
        { type: 'bool', label: 'Invert (recess dots)', id: 'qr-inv', val: false },
      ],
      getParams: () => ({
        text: document.getElementById('qr-text')?.value || 'https://3dprintforge',
        moduleSize: v('qr-ms'), baseThickness: v('qr-bt'),
        dotHeight: v('qr-dh'), margin: v('qr-mg'), invert: c('qr-inv'),
        errorLevel: document.getElementById('qr-el')?.value || 'M',
      }),
    });
    // Inject text + error-level controls at the top of the form
    setTimeout(() => {
      if (document.getElementById('qr-text')) return;
      const form = document.getElementById('fc-form');
      if (!form) return;
      const wrap = document.createElement('div');
      wrap.style.marginBottom = '10px';
      wrap.innerHTML = `
        <label style="font-size:0.7rem;color:var(--text-muted)">Text / URL</label>
        <textarea id="qr-text" class="form-input" rows="2" style="font-size:0.8rem;width:100%;resize:vertical">https://3dprintforge</textarea>
        <div style="margin-top:6px"><label style="font-size:0.7rem;color:var(--text-muted)">Error correction</label>
          <select id="qr-el" class="form-input" style="font-size:0.8rem;width:100%"><option value="L">L — 7%</option><option value="M" selected>M — 15%</option><option value="Q">Q — 25%</option><option value="H">H — 30%</option></select></div>`;
      form.insertBefore(wrap, form.firstChild);
      wrap.addEventListener('input', () => form.dispatchEvent(new Event('input', { bubbles: true })));
    }, 150);
  };
})();
