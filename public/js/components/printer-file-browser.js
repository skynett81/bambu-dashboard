/**
 * Printer File Browser — browse, upload, delete, print files on printer storage.
 * Works with all printer types that support file management.
 */
(function() {
  'use strict';

  window.renderPrinterFileBrowser = function() {
    return `<div class="ctrl-card" id="printer-files-card">
      <div class="ctrl-card-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
        Printer Files
        <button class="form-btn form-btn-sm form-btn-secondary" style="font-size:0.6rem;margin-left:auto" data-ripple onclick="window._refreshPrinterFiles()">Refresh</button>
      </div>
      <div id="printer-files-list" style="max-height:250px;overflow-y:auto">
        <div class="text-muted" style="font-size:0.72rem;padding:8px">Loading files...</div>
      </div>
      <div style="margin-top:6px">
        <label class="form-btn form-btn-sm" style="font-size:0.65rem;cursor:pointer" data-ripple>
          <input type="file" accept=".gcode,.g,.3mf" style="display:none" onchange="window._uploadPrinterFile(this)">
          Upload File
        </label>
      </div>
    </div>`;
  };

  window._refreshPrinterFiles = async function() {
    const container = document.getElementById('printer-files-list');
    if (!container) return;
    const pid = window.printerState?.getActivePrinterId?.();
    if (!pid) { container.innerHTML = '<div class="text-muted" style="font-size:0.72rem;padding:8px">No printer selected</div>'; return; }

    try {
      const res = await fetch(`/api/printers/${pid}/files`);
      const files = await res.json();
      if (!Array.isArray(files) || files.length === 0) {
        container.innerHTML = '<div class="text-muted" style="font-size:0.72rem;padding:8px">No files on printer</div>';
        return;
      }

      // Printer-supplied filenames are untrusted — escape for HTML and
      // pass via dataset attributes so click handlers don't reinterpret
      // them as JS string literals.
      const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      let html = '<div style="display:flex;flex-direction:column;gap:2px">';
      for (const f of files.slice(0, 50)) {
        if (f.type === 'folder') continue;
        const name = f.display || f.path || f.name || '?';
        const size = f.size ? `${(f.size / 1024).toFixed(0)} KB` : '';
        const safeName = esc(name);
        html += `<div style="display:flex;align-items:center;gap:6px;padding:4px 6px;border-radius:4px;font-size:0.72rem;background:var(--bg-inset)">
          <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${safeName}">${safeName}</span>
          <span class="text-muted" style="font-size:0.6rem;flex-shrink:0">${esc(size)}</span>
          <button class="form-btn form-btn-sm" style="font-size:0.55rem;padding:1px 4px" data-ripple data-pf-action="print" data-pf-name="${safeName}">Print</button>
          <button class="form-btn form-btn-sm form-btn-danger" style="font-size:0.55rem;padding:1px 4px" data-ripple data-pf-action="delete" data-pf-name="${safeName}" data-pf-pid="${esc(pid)}">×</button>
        </div>`;
      }
      html += '</div>';
      container.innerHTML = html;

      // Delegate clicks — keeps untrusted filename out of inline JS context.
      container.addEventListener('click', _handlePrinterFileClick);
    } catch (e) {
      container.innerHTML = `<div class="text-muted" style="font-size:0.72rem;padding:8px">Error: ${e.message}</div>`;
    }
  };

  function _handlePrinterFileClick(ev) {
    const btn = ev.target.closest('button[data-pf-action]');
    if (!btn) return;
    const action = btn.dataset.pfAction;
    const name = btn.dataset.pfName;
    if (action === 'print') {
      if (typeof sendCommand === 'function') sendCommand('print_file', { filename: name });
    } else if (action === 'delete') {
      const pid = btn.dataset.pfPid;
      if (confirm(`Delete ${name}?`)) {
        fetch(`/api/printers/${encodeURIComponent(pid)}/files/${encodeURIComponent(name)}`, { method: 'DELETE' })
          .then(() => window._refreshPrinterFiles());
      }
    }
  }

  window._uploadPrinterFile = async function(input) {
    if (!input.files?.length) return;
    const pid = window.printerState?.getActivePrinterId?.();
    if (!pid) return;
    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);
    try {
      if (typeof showToast === 'function') showToast(`Uploading ${file.name}...`, 'info', 3000);
      await fetch(`/api/printers/${pid}/files`, { method: 'POST', body: formData });
      if (typeof showToast === 'function') showToast(`Uploaded ${file.name}`, 'success');
      window._refreshPrinterFiles();
    } catch (e) {
      if (typeof showToast === 'function') showToast(`Upload failed: ${e.message}`, 'error');
    }
    input.value = '';
  };

  // Auto-load files when panel renders
  setTimeout(() => window._refreshPrinterFiles?.(), 500);
})();
