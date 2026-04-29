// Screenshot Gallery Panel
(function() {
  'use strict';

  window.loadScreenshotGallery = async function() {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;

    let shots;
    try {
      const res = await fetch('/api/screenshots?limit=100');
      shots = await res.json();
    } catch (e) {
      shots = [];
    }

    let h = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">';
    h += `<div style="color:var(--text-muted);font-size:0.85rem">${shots.length} screenshots</div>`;
    h += `<button class="form-btn" onclick="_captureScreenshot()">${t('gallery.capture', 'Capture Now')}</button>`;
    h += '</div>';

    if (shots.length === 0) {
      h += emptyState({
        icon: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
        title: t('gallery.empty_title', 'No Screenshots'),
        desc: t('gallery.empty_desc', 'Capture screenshots from your camera feed. They will be saved here for easy access.'),
        actionLabel: t('gallery.capture', 'Capture Now'),
        actionOnClick: '_captureScreenshot()'
      });
    } else {
      h += '<div class="auto-grid auto-grid--sm" style="--grid-gap:8px">';
      for (const s of shots) {
        h += `<div class="card" style="padding:0;overflow:hidden;cursor:pointer;position:relative" onclick="_viewScreenshot(${s.id})">`;
        h += `<div style="aspect-ratio:16/9;background:var(--bg-tertiary);display:flex;align-items:center;justify-content:center">`;
        h += `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" opacity="0.4"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>`;
        h += '</div>';
        h += `<div style="padding:8px">`;
        h += `<div style="font-size:0.75rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(s.filename)}</div>`;
        h += `<div style="font-size:0.65rem;color:var(--text-muted);display:flex;justify-content:space-between;margin-top:4px">`;
        h += `<span>${new Date(s.captured_at).toLocaleDateString()}</span>`;
        if (s.print_file) h += `<span>${esc(s.print_file)}</span>`;
        h += '</div></div>';
        h += `<button class="form-btn form-btn-danger" style="position:absolute;top:4px;right:4px;padding:2px 6px;font-size:0.6rem;opacity:0;transition:opacity 0.2s" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0" onclick="event.stopPropagation();_deleteScreenshot(${s.id})">&#10005;</button>`;
        h += '</div>';
      }
      h += '</div>';
    }

    panel.innerHTML = h;
  };

  window._captureScreenshot = function() {
    // Find active camera canvas
    const canvas = document.querySelector('canvas.camera-canvas') || document.querySelector('img.camera-canvas');
    if (!canvas) {
      showToast(t('gallery.no_camera', 'No camera feed available'), 'warning');
      return;
    }

    let dataUrl;
    if (canvas.tagName === 'CANVAS') {
      dataUrl = canvas.toDataURL('image/png');
    } else {
      // For img elements, draw to temp canvas
      const c = document.createElement('canvas');
      c.width = canvas.naturalWidth || canvas.width;
      c.height = canvas.naturalHeight || canvas.height;
      c.getContext('2d').drawImage(canvas, 0, 0);
      dataUrl = c.toDataURL('image/png');
    }

    const printerId = window.printerState?.getActivePrinterId();
    const ps = window.printerState?.getActivePrinterState();
    const printFile = ps?.print?.gcode_file || ps?.gcode_file || '';
    const filename = `screenshot-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;

    fetch('/api/screenshots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        printer_id: printerId,
        filename: filename,
        data: dataUrl,
        print_file: printFile
      })
    }).then(() => {
      showToast(t('gallery.captured', 'Screenshot saved!'), 'success');
      if (window._activePanel === 'screenshots') loadScreenshotGallery();
    }).catch(e => {
      showToast(t('gallery.save_failed', 'Failed to save screenshot'), 'error');
    });
  };

  window._viewScreenshot = async function(id) {
    try {
      const res = await fetch(`/api/screenshots/${id}`);
      const shot = await res.json();
      const html = `
        <div style="text-align:center">
          <img src="${shot.data}" style="max-width:100%;max-height:70vh;border-radius:8px;margin-bottom:12px" alt="Screenshot">
          <div style="font-size:0.85rem;font-weight:600">${esc(shot.filename)}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">${new Date(shot.captured_at).toLocaleString()}${shot.print_file ? ' — ' + esc(shot.print_file) : ''}</div>
          <div style="display:flex;gap:8px;justify-content:center;margin-top:16px">
            <a href="${shot.data}" download="${shot.filename}" class="form-btn form-btn-secondary">${t('common.download', 'Last ned')}</a>
            <button class="form-btn form-btn-danger" onclick="_deleteScreenshot(${id}); document.querySelector('.ix-modal-overlay')?.remove();">${t('common.delete', 'Delete')}</button>
            <button class="form-btn form-btn-secondary" data-close-modal>${t('common.close', 'Close')}</button>
          </div>
        </div>
      `;
      openModal(html, { style: 'max-width:800px;width:95%;padding:20px' });
    } catch (e) {
      showToast(t('gallery.load_failed', 'Failed to load screenshot'), 'error');
    }
  };

  window._deleteScreenshot = async function(id) {
    await fetch(`/api/screenshots/${id}`, { method: 'DELETE' });
    showToast(t('gallery.deleted', 'Screenshot deleted'), 'success');
    if (window._activePanel === 'screenshots') loadScreenshotGallery();
  };
})();
