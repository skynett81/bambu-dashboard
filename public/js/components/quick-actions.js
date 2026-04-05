// Quick Actions — floating action button with common operations
(function() {
  'use strict';

  let _open = false;

  window.initQuickActions = function() {
    if (document.getElementById('qa-fab')) return;

    const fab = document.createElement('div');
    fab.id = 'qa-fab';
    fab.innerHTML = `
      <style>
        #qa-fab { position:fixed; bottom:20px; right:20px; z-index:9000; }
        #qa-btn { width:48px; height:48px; border-radius:50%; background:var(--accent-blue); border:none; color:#fff; cursor:pointer; box-shadow:0 4px 16px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; transition:transform 0.2s,background 0.2s; }
        #qa-btn:hover { transform:scale(1.1); }
        #qa-btn.open { background:var(--accent-red); transform:rotate(45deg); }
        #qa-menu { position:absolute; bottom:56px; right:0; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:12px; padding:8px 0; min-width:220px; box-shadow:0 8px 32px rgba(0,0,0,0.4); display:none; }
        #qa-menu.open { display:block; animation:qa-slide 0.15s ease-out; }
        @keyframes qa-slide { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .qa-item { display:flex; align-items:center; gap:10px; padding:8px 14px; cursor:pointer; font-size:0.82rem; color:var(--text-primary); transition:background 0.1s; border:none; background:none; width:100%; text-align:left; }
        .qa-item:hover { background:var(--bg-tertiary); }
        .qa-item svg { flex-shrink:0; opacity:0.7; }
        .qa-divider { height:1px; background:var(--border-color); margin:4px 8px; }
      </style>
      <div id="qa-menu">
        <button class="qa-item" onclick="_qaAction('upload')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Upload File to Printer
        </button>
        <button class="qa-item" onclick="_qaAction('modelforge')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
          Model Forge
        </button>
        <button class="qa-item" onclick="_qaAction('queue')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          Print Queue
        </button>
        <div class="qa-divider"></div>
        <button class="qa-item" onclick="_qaAction('pause')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          Pause Active Print
        </button>
        <button class="qa-item" onclick="_qaAction('resume')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Resume Print
        </button>
        <button class="qa-item" onclick="_qaAction('light')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a7 7 0 014 12.7V17a2 2 0 01-2 2h-4a2 2 0 01-2-2v-2.3A7 7 0 0112 2z"/></svg>
          Toggle Light
        </button>
        <div class="qa-divider"></div>
        <button class="qa-item" onclick="_qaAction('screenshot')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          Camera Screenshot
        </button>
        <button class="qa-item" onclick="_qaAction('home')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
          Home All Axes
        </button>
      </div>
      <button id="qa-btn" onclick="_qaToggle()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    `;
    document.body.appendChild(fab);

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (_open && !fab.contains(e.target)) { _qaClose(); }
    });
  };

  window._qaToggle = function() {
    _open = !_open;
    document.getElementById('qa-btn')?.classList.toggle('open', _open);
    document.getElementById('qa-menu')?.classList.toggle('open', _open);
  };

  function _qaClose() {
    _open = false;
    document.getElementById('qa-btn')?.classList.remove('open');
    document.getElementById('qa-menu')?.classList.remove('open');
  }

  window._qaAction = function(action) {
    _qaClose();
    switch (action) {
      case 'upload':
        if (typeof openPanel === 'function') openPanel('library');
        break;
      case 'modelforge':
        if (typeof openPanel === 'function') openPanel('modelforge');
        break;
      case 'queue':
        if (typeof openPanel === 'function') openPanel('queue');
        break;
      case 'pause':
        if (typeof sendCommand === 'function') sendCommand('pause');
        if (typeof showToast === 'function') showToast('Pause sent', 'info');
        break;
      case 'resume':
        if (typeof sendCommand === 'function') sendCommand('resume');
        if (typeof showToast === 'function') showToast('Resume sent', 'info');
        break;
      case 'light':
        if (typeof toggleLight === 'function') toggleLight();
        else if (typeof sendCommand === 'function') sendCommand('light', { mode: 'on', node: 'chamber_light' });
        break;
      case 'screenshot':
        // Trigger camera screenshot download
        const pid = window.printerState?.getActivePrinterId();
        if (pid) {
          const a = document.createElement('a');
          a.href = `/api/printers/${encodeURIComponent(pid)}/frame.jpeg`;
          a.download = `${pid}_screenshot_${Date.now()}.jpg`;
          a.click();
        }
        break;
      case 'home':
        if (typeof sendCommand === 'function') sendCommand('gcode', { gcode: 'G28' });
        if (typeof showToast === 'function') showToast('Homing...', 'info');
        break;
    }
  };

  // Auto-init after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initQuickActions, 1000));
  } else {
    setTimeout(initQuickActions, 1000);
  }
})();
