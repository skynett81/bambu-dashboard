// Model Forge — Hub panel for 3D model generation tools
(function() {
  'use strict';

  const TOOLS = [
    { id: 'sign', name: 'Sign Maker', icon: '📶', desc: 'QR codes, labels, warning signs with frame and stand', loader: 'loadSignMakerPanel' },
    { id: 'lithophane', name: 'Lithophane', icon: '🖼️', desc: 'Convert images to 3D printable light panels', loader: 'loadForgeLithophane' },
    { id: 'storage-box', name: 'Storage Box', icon: '📦', desc: 'Parametric boxes with dividers (Gridfinity)', loader: 'loadForgeStorageBox' },
    { id: 'text-plate', name: 'Text Plate', icon: '🔤', desc: 'Custom 3D text on a plate with multi-line support', loader: 'loadForgeTextPlate' },
    { id: 'keychain', name: 'Keychain', icon: '🔑', desc: 'Custom keychains with text and shapes', loader: 'loadForgeKeychain' },
    { id: 'cable-label', name: 'Cable Label', icon: '🏷️', desc: 'Wrap-around labels for cables and wires', loader: 'loadForgeCableLabel' },
    { id: 'relief', name: 'Image Relief', icon: '🗿', desc: 'Convert images to raised 3D surfaces or stamps', loader: 'loadForgeRelief' },
    { id: 'stencil', name: 'Stencil', icon: '✂️', desc: 'Create cut-out stencils from images', loader: 'loadForgeStencil' },
    { id: 'nfc-tag', name: 'NFC Filament Tag', icon: '🏷️', desc: 'Write filament info to NFC tags (OpenSpool format)', loader: 'loadForgeNfcTag' },
    { id: '3mf-converter', name: '3MF Converter', icon: '🔄', desc: 'Convert Bambu Lab .3mf to Snapmaker U1 format', loader: 'loadForge3mfConverter' },
  ];

  window.loadModelForgePanel = function(subTool) {
    // If a sub-tool is specified, load it directly
    if (subTool) {
      const tool = TOOLS.find(t => t.id === subTool);
      if (tool?.loader && typeof window[tool.loader] === 'function') {
        window[tool.loader]();
        return;
      }
    }

    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    let h = `<style>
      .forge-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:10px; }
      .forge-card { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:10px; padding:14px; cursor:pointer; transition:all 0.15s; display:flex; flex-direction:column; gap:6px; }
      .forge-card:hover { border-color:var(--accent-blue); transform:translateY(-2px); box-shadow:0 4px 16px rgba(0,0,0,0.2); }
      .forge-card.soon { opacity:0.5; cursor:default; }
      .forge-card.soon:hover { border-color:var(--border-color); transform:none; box-shadow:none; }
      .forge-card-icon { font-size:1.6rem; }
      .forge-card-title { font-size:0.9rem; font-weight:600; }
      .forge-card-desc { font-size:0.75rem; color:var(--text-muted); line-height:1.4; }
      .forge-card-badge { font-size:0.6rem; padding:1px 6px; border-radius:8px; background:var(--accent-blue); color:#fff; align-self:flex-start; }
      .forge-card-soon { font-size:0.6rem; padding:1px 6px; border-radius:8px; background:var(--bg-tertiary); color:var(--text-muted); align-self:flex-start; }
    </style>`;

    h += `<div style="margin-bottom:14px">
      <h4 style="margin:0 0 4px;font-size:1.1rem">🔨 Model Forge</h4>
      <p style="margin:0;font-size:0.8rem;color:var(--text-muted)">Generate 3D printable models — no CAD skills needed. All models are exported as 3MF files ready for your slicer.</p>
    </div>`;

    h += '<div class="forge-grid">';
    for (const tool of TOOLS) {
      const clickable = tool.loader && !tool.soon;
      h += `<div class="forge-card ${tool.soon ? 'soon' : ''}" ${clickable ? `onclick="window._forgeOpenTool('${tool.id}')"` : ''}>
        <div class="forge-card-icon">${tool.icon}</div>
        <div class="forge-card-title">${tool.name}</div>
        <div class="forge-card-desc">${tool.desc}</div>
        ${tool.soon ? '<span class="forge-card-soon">Coming soon</span>' : '<span class="forge-card-badge">Open</span>'}
      </div>`;
    }
    h += '</div>';

    el.innerHTML = h;
  };

  window._forgeOpenTool = function(id) {
    const tool = TOOLS.find(t => t.id === id);
    if (!tool?.loader) return;

    // Update hash for deep linking
    history.replaceState(null, '', `#modelforge/${id}`);

    if (typeof window[tool.loader] === 'function') {
      window[tool.loader]();
    }
  };
})();
