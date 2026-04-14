// Model Forge — Hub panel for 3D model generation tools
(function() {
  'use strict';

  const CATEGORIES = [
    { id: 'organization', name: 'Organization', icon: '🗂️' },
    { id: 'mechanical',   name: 'Mechanical',   icon: '⚙️' },
    { id: 'printer',      name: 'Printer',      icon: '🖨️' },
    { id: 'home',         name: 'Home',         icon: '🏠' },
    { id: 'tech',         name: 'Tech',         icon: '💻' },
    { id: 'creative',     name: 'Creative',     icon: '🎨' },
    { id: 'calibration',  name: 'Calibration',  icon: '🎯' },
    { id: 'tools',        name: 'Utilities',    icon: '🛠️' },
  ];

  const TOOLS = [
    { id: 'sign', name: 'Sign Maker', icon: '📶', desc: 'QR codes, labels, warning signs with frame and stand', loader: 'loadSignMakerPanel', category: 'creative' },
    { id: 'lithophane', name: 'Lithophane', icon: '🖼️', desc: 'Convert images to 3D printable light panels', loader: 'loadForgeLithophane', category: 'creative' },
    { id: 'storage-box', name: 'Storage Box', icon: '📦', desc: 'Parametric boxes with dividers (Gridfinity)', loader: 'loadForgeStorageBox', category: 'organization' },
    { id: 'gridfinity-baseplate', name: 'Gridfinity Baseplate', icon: '🧰', desc: 'Gridfinity 42mm baseplate — configurable grid size', loader: 'loadForgeGridfinityBaseplate', category: 'organization' },
    { id: 'gridfinity-bin', name: 'Gridfinity Bin', icon: '📦', desc: 'Gridfinity storage bin — 1..6 units, 2..15 height units', loader: 'loadForgeGridfinityBin', category: 'organization' },
    { id: 'gridfinity-lid', name: 'Gridfinity Lid', icon: '🔲', desc: 'Flat lid with skirt — fits on top of any Gridfinity bin', loader: 'loadForgeGridfinityLid', category: 'organization' },
    { id: 'gridfinity-tool-holder', name: 'Gridfinity Tool Holder', icon: '🔧', desc: 'Gridfinity block with round tool slots for bits, drivers, pens', loader: 'loadForgeGridfinityToolHolder', category: 'organization' },
    { id: 'text-plate', name: 'Text Plate', icon: '🔤', desc: 'Custom 3D text on a plate with multi-line support', loader: 'loadForgeTextPlate', category: 'creative' },
    { id: 'keychain', name: 'Keychain', icon: '🔑', desc: 'Custom keychains with text and shapes', loader: 'loadForgeKeychain', category: 'creative' },
    { id: 'cable-label', name: 'Cable Label', icon: '🏷️', desc: 'Wrap-around labels for cables and wires', loader: 'loadForgeCableLabel', category: 'organization' },
    { id: 'relief', name: 'Image Relief', icon: '🗿', desc: 'Convert images to raised 3D surfaces or stamps', loader: 'loadForgeRelief', category: 'creative' },
    { id: 'stencil', name: 'Stencil', icon: '✂️', desc: 'Create cut-out stencils from images', loader: 'loadForgeStencil', category: 'creative' },
    { id: 'nfc-tag', name: 'NFC Filament Tag', icon: '🏷️', desc: 'Write filament info to NFC tags (OpenSpool format)', loader: 'loadForgeNfcTag', category: 'printer' },
    { id: '3mf-converter', name: '3MF Converter', icon: '🔄', desc: 'Convert Bambu Lab .3mf to Snapmaker U1 format', loader: 'loadForge3mfConverter', category: 'tools' },
    { id: 'calibration', name: 'Calibration Tools', icon: '🔧', desc: '8 tools: tolerance test, bed level, temp tower, retraction, vase, QR, shapes, threads', loader: 'loadForgeCalibration', category: 'calibration' },
    { id: 'lattice', name: 'Lattice Structure', icon: '🔩', desc: 'Lightweight lattice structures: BCC, FCC, octet, diamond, cubic cells', loader: 'loadForgeLattice', category: 'mechanical' },
    { id: 'multi-color', name: 'Multi-Color', icon: '🎨', desc: 'Multi-material colored parts for AMS/MMU color assignment', loader: 'loadForgeMultiColor', category: 'creative' },
    { id: 'vase', name: 'Advanced Vase', icon: '🏺', desc: 'Spiral vases with sine, bulge, flare, twist and tulip profiles', loader: 'loadForgeVase', category: 'creative' },
    { id: 'thread', name: 'Threads & Joints', icon: '🔩', desc: 'Metric bolts, nuts, standoffs and snap-fit joints (M3–M20)', loader: 'loadForgeThread', category: 'mechanical' },
    { id: 'gear', name: 'Spur Gear', icon: '⚙️', desc: 'Parametric involute spur gears — teeth, module, bore', loader: 'loadForgeGear', category: 'mechanical' },
    { id: 'pulley', name: 'Timing Belt Pulley', icon: '⚙️', desc: 'GT2/GT3/HTD pulleys with optional flanges and bore', loader: 'loadForgePulley', category: 'mechanical' },
    { id: 'spring', name: 'Compression Spring', icon: '🌀', desc: 'Helical coil spring — coils, diameter, wire, pitch', loader: 'loadForgeSpring', category: 'mechanical' },
    { id: 'hinge', name: 'Print-in-place Hinge', icon: '🪝', desc: 'Barrel hinge with interlocking knuckles and pin', loader: 'loadForgeHinge', category: 'mechanical' },
    { id: 'snapfit', name: 'Snap-fit Connector', icon: '🔒', desc: 'Cantilever snap-fit pair — male hook + female catch', loader: 'loadForgeSnapfit', category: 'mechanical' },
    { id: 'spool-adapter', name: 'Spool Adapter', icon: '🎯', desc: 'Tube adapter to fit a spool hub onto a different mount', loader: 'loadForgeSpoolAdapter', category: 'printer' },
    { id: 'cable-chain', name: 'Cable Chain Link', icon: '⛓️', desc: 'Drag chain segment — print many and connect with pins', loader: 'loadForgeCableChain', category: 'printer' },
    { id: 'first-layer', name: 'First Layer Test', icon: '📐', desc: 'Bed leveling + Z offset calibration pattern', loader: 'loadForgeFirstLayer', category: 'printer' },
    { id: 'nozzle-storage', name: 'Nozzle Storage', icon: '🔩', desc: 'Storage block with labeled bores for M6 printer nozzles', loader: 'loadForgeNozzleStorage', category: 'printer' },
    { id: 'scraper-holder', name: 'Scraper Holder', icon: '🪚', desc: 'Wall-mounted bracket for a bed scraper or putty knife', loader: 'loadForgeScraperHolder', category: 'printer' },
    { id: 'hook', name: 'Wall Hook', icon: '🪝', desc: 'Simple wall-mount peg hook with screw holes', loader: 'loadForgeHook', category: 'home' },
    { id: 'cable-clip', name: 'Cable Clip', icon: '📎', desc: 'Snap-on cable management clip with base ears', loader: 'loadForgeCableClip', category: 'home' },
    { id: 'plant-pot', name: 'Plant Pot', icon: '🪴', desc: 'Tapered plant pot with flat bottom', loader: 'loadForgePlantPot', category: 'home' },
    { id: 'desk-organizer', name: 'Desk Organizer', icon: '🗄️', desc: 'Rectangular tray with configurable compartment grid', loader: 'loadForgeDeskOrganizer', category: 'home' },
    { id: 'wall-bracket', name: 'Wall Bracket', icon: '📐', desc: 'L-bracket with screw holes and optional gusset rib', loader: 'loadForgeWallBracket', category: 'home' },
    { id: 'wall-plate', name: 'Wall Plate', icon: '⬜', desc: 'Blank wall plate with 4 corner screw holes', loader: 'loadForgeWallPlate', category: 'home' },
    { id: 'lidded-box', name: 'Lidded Box', icon: '📦', desc: 'Parametric box + friction-fit lid on one print', loader: 'loadForgeLiddedBox', category: 'home' },
    { id: 'peg-rail', name: 'Peg Rail', icon: '🪵', desc: 'Wall rail with multiple hanging pegs', loader: 'loadForgePegRail', category: 'home' },
    { id: 'texture', name: 'Texture Surface', icon: '🧱', desc: 'Procedural textures: diamond plate, knurl, honeycomb, waves, brick', loader: 'loadForgeTexture', category: 'creative' },
    { id: 'validator', name: '3MF Validator', icon: '✅', desc: 'Validate 3MF files, check mesh integrity, detect extensions, match colors', loader: 'loadForgeValidator', category: 'tools' },
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
      .forge-cat-header { display:flex; align-items:center; gap:8px; margin:18px 0 8px; padding-bottom:4px; border-bottom:1px solid var(--border-color); }
      .forge-cat-header:first-of-type { margin-top:4px; }
      .forge-cat-title { font-size:0.82rem; font-weight:600; color:var(--text-primary); text-transform:uppercase; letter-spacing:0.04em; }
      .forge-cat-count { font-size:0.7rem; color:var(--text-muted); }
    </style>`;

    h += `<div style="margin-bottom:14px">
      <h4 style="margin:0 0 4px;font-size:1.1rem">🔨 Model Forge</h4>
      <p style="margin:0;font-size:0.8rem;color:var(--text-muted)">Generate 3D printable models — no CAD skills needed. All models are exported as 3MF files ready for your slicer.</p>
    </div>`;

    // Group tools by category, preserving order defined in CATEGORIES.
    const byCat = new Map();
    for (const tool of TOOLS) {
      const cat = tool.category || 'tools';
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat).push(tool);
    }

    for (const category of CATEGORIES) {
      const tools = byCat.get(category.id);
      if (!tools || tools.length === 0) continue;
      h += `<div class="forge-cat-header">
        <span style="font-size:1rem">${category.icon}</span>
        <span class="forge-cat-title">${category.name}</span>
        <span class="forge-cat-count">${tools.length} tool${tools.length === 1 ? '' : 's'}</span>
      </div>`;
      h += '<div class="forge-grid">';
      for (const tool of tools) {
        const clickable = tool.loader && !tool.soon;
        h += `<div class="forge-card ${tool.soon ? 'soon' : ''}" ${clickable ? `onclick="window._forgeOpenTool('${tool.id}')"` : ''}>
          <div class="forge-card-icon">${tool.icon}</div>
          <div class="forge-card-title">${tool.name}</div>
          <div class="forge-card-desc">${tool.desc}</div>
          ${tool.soon ? '<span class="forge-card-soon">Coming soon</span>' : '<span class="forge-card-badge">Open</span>'}
        </div>`;
      }
      h += '</div>';
    }

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
