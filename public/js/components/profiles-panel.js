// Print Profiles / Presets Panel
(function() {
  'use strict';

  let _profiles = [];

  function _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

  window.loadProfilesPanel = async function() {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;

    try {
      const res = await fetch('/api/profiles');
      _profiles = await res.json();
    } catch (e) {
      _profiles = [];
    }

    _render(panel);
  };

  function _render(panel) {
    let h = '';

    // Toolbar
    h += '<div class="stats-toolbar" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">';
    h += `<div style="color:var(--text-muted);font-size:0.85rem">${_profiles.length} ${t('profiles.count', 'profiles')}</div>`;
    h += `<button class="form-btn" data-ripple onclick="_showProfileForm()">${t('profiles.add', 'New profile')}</button>`;
    h += '</div>';

    if (_profiles.length === 0) {
      h += emptyState({
        icon: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
        title: t('profiles.empty_title', 'No print profiles'),
        desc: t('profiles.empty_desc', 'Save your favorite settings as reusable profiles for quick access.'),
        actionLabel: t('profiles.create_first', 'Create profile'),
        actionOnClick: '_showProfileForm()'
      });
    } else {
      h += '<div class="module-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">';
      for (const p of _profiles) {
        h += _renderCard(p);
      }
      h += '</div>';
    }

    panel.innerHTML = h;
  }

  function _renderCard(p) {
    const speeds = { 1: t('profiles.speed_silent', 'Silent'), 2: t('profiles.speed_standard', 'Standard'), 3: t('profiles.speed_sport', 'Sport'), 4: t('profiles.speed_ludicrous', 'Ludicrous') };

    let h = `<div class="stats-module" style="cursor:pointer" onclick="_showProfileForm(${p.id})">`;
    h += '<div class="module-header" style="display:flex;justify-content:space-between;align-items:center">';
    h += `<h3 class="module-title" style="margin:0">${_esc(p.name)}</h3>`;
    h += `<button class="form-btn form-btn-danger form-btn-sm" onclick="event.stopPropagation();_deleteProfile(${p.id})">${t('profiles.delete', 'Delete')}</button>`;
    h += '</div>';
    h += '<div class="module-body">';

    if (p.description) {
      h += `<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:8px">${_esc(p.description)}</div>`;
    }

    // Settings grid
    const items = [];
    if (p.filament_type) items.push({ label: t('profiles.filament_type', 'Type'), value: p.filament_type });
    if (p.filament_brand) items.push({ label: t('profiles.brand', 'Brand'), value: p.filament_brand });
    if (p.nozzle_temp) items.push({ label: t('profiles.nozzle_temp', 'Nozzle'), value: p.nozzle_temp + '\u00b0C' });
    if (p.bed_temp) items.push({ label: t('profiles.bed_temp', 'Bed'), value: p.bed_temp + '\u00b0C' });
    if (p.layer_height) items.push({ label: t('profiles.layer_height', 'Layer'), value: p.layer_height + 'mm' });
    if (p.nozzle_diameter) items.push({ label: t('profiles.nozzle_diameter', 'Nozzle\u00d8'), value: p.nozzle_diameter + 'mm' });
    if (p.speed_level) items.push({ label: t('profiles.speed_level', 'Speed'), value: speeds[p.speed_level] || p.speed_level });
    if (p.infill_percent) items.push({ label: t('profiles.infill', 'Infill'), value: p.infill_percent + '%' });

    if (items.length > 0) {
      h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:6px">';
      for (const item of items) {
        h += `<div style="background:var(--bg-tertiary);border-radius:var(--radius-sm);padding:6px 10px">`;
        h += `<div style="font-size:0.65rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.03em">${_esc(item.label)}</div>`;
        h += `<div style="font-size:0.85rem;font-weight:600;color:var(--text-primary)">${_esc(item.value)}</div>`;
        h += '</div>';
      }
      h += '</div>';
    }

    if (p.use_count > 0) {
      const usedText = (t('profiles.used_times', 'Used {count} times')).replace('{count}', p.use_count);
      h += `<div style="font-size:0.7rem;color:var(--text-muted);margin-top:8px">${usedText}</div>`;
    }

    h += '</div></div>';
    return h;
  }

  window._showProfileForm = function(id) {
    const profile = id ? _profiles.find(p => p.id === id) : {};
    const isEdit = !!id;

    const speeds = [
      { val: 1, label: t('profiles.speed_silent', 'Silent') },
      { val: 2, label: t('profiles.speed_standard', 'Standard') },
      { val: 3, label: t('profiles.speed_sport', 'Sport') },
      { val: 4, label: t('profiles.speed_ludicrous', 'Ludicrous') }
    ];
    const speedOpts = speeds.map(s =>
      `<option value="${s.val}"${(profile.speed_level || 2) === s.val ? ' selected' : ''}>${s.label}</option>`
    ).join('');

    const html = `
      <h3 style="margin:0 0 16px">${isEdit ? (t('profiles.edit', 'Edit profile')) : (t('profiles.add', 'New profile'))}</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="grid-column:1/-1">
          <label class="form-label">${t('profiles.name', 'Name')} *</label>
          <input class="form-input" id="pf-name" value="${_esc(profile.name || '')}" placeholder="${_esc(t('profiles.name_placeholder', 'E.g. PLA Standard'))}">
        </div>
        <div style="grid-column:1/-1">
          <label class="form-label">${t('profiles.description', 'Description')}</label>
          <input class="form-input" id="pf-desc" value="${_esc(profile.description || '')}" placeholder="${_esc(t('profiles.description_placeholder', 'Optional description'))}">
        </div>
        <div>
          <label class="form-label">${t('profiles.filament_type', 'Filament type')}</label>
          <input class="form-input" id="pf-type" value="${_esc(profile.filament_type || '')}" placeholder="${_esc(t('profiles.filament_type_placeholder', 'PLA, PETG, ABS...'))}">
        </div>
        <div>
          <label class="form-label">${t('profiles.brand', 'Brand')}</label>
          <input class="form-input" id="pf-brand" value="${_esc(profile.filament_brand || '')}" placeholder="${_esc(t('profiles.brand_placeholder', 'Bambu, eSUN...'))}">
        </div>
        <div>
          <label class="form-label">${t('profiles.nozzle_temp', 'Nozzle temp (\u00b0C)')}</label>
          <input class="form-input" type="number" id="pf-nozzle" value="${profile.nozzle_temp || ''}">
        </div>
        <div>
          <label class="form-label">${t('profiles.bed_temp', 'Bed temp (\u00b0C)')}</label>
          <input class="form-input" type="number" id="pf-bed" value="${profile.bed_temp || ''}">
        </div>
        <div>
          <label class="form-label">${t('profiles.layer_height', 'Layer height (mm)')}</label>
          <input class="form-input" type="number" step="0.04" id="pf-layer" value="${profile.layer_height || ''}">
        </div>
        <div>
          <label class="form-label">${t('profiles.nozzle_diameter', 'Nozzle diameter')}</label>
          <input class="form-input" type="number" step="0.1" id="pf-nozzle-d" value="${profile.nozzle_diameter || '0.4'}">
        </div>
        <div>
          <label class="form-label">${t('profiles.speed_level', 'Speed level')}</label>
          <select class="form-input" id="pf-speed">${speedOpts}</select>
        </div>
        <div>
          <label class="form-label">${t('profiles.infill', 'Infill %')}</label>
          <input class="form-input" type="number" id="pf-infill" value="${profile.infill_percent || ''}" min="0" max="100">
        </div>
        <div style="grid-column:1/-1">
          <label class="form-label">${t('profiles.notes', 'Notes')}</label>
          <textarea class="form-input" id="pf-notes" rows="2">${_esc(profile.notes || '')}</textarea>
        </div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">
        <button class="form-btn form-btn-secondary" data-close-modal>${t('profiles.cancel', 'Cancel')}</button>
        <button class="form-btn" onclick="_saveProfile(${id || 'null'})">${isEdit ? (t('profiles.save', 'Save')) : (t('profiles.create', 'Create'))}</button>
      </div>
    `;

    openModal(html, { style: 'max-width:520px;width:90%;padding:24px' });
  };

  window._saveProfile = async function(id) {
    const data = {
      name: document.getElementById('pf-name').value.trim(),
      description: document.getElementById('pf-desc').value.trim(),
      filament_type: document.getElementById('pf-type').value.trim(),
      filament_brand: document.getElementById('pf-brand').value.trim(),
      nozzle_temp: parseInt(document.getElementById('pf-nozzle').value) || null,
      bed_temp: parseInt(document.getElementById('pf-bed').value) || null,
      layer_height: parseFloat(document.getElementById('pf-layer').value) || null,
      nozzle_diameter: parseFloat(document.getElementById('pf-nozzle-d').value) || 0.4,
      speed_level: parseInt(document.getElementById('pf-speed').value) || 2,
      infill_percent: parseInt(document.getElementById('pf-infill').value) || null,
      notes: document.getElementById('pf-notes').value.trim()
    };

    if (!data.name) { showToast(t('profiles.name_required', 'Name is required'), 'error'); return; }

    try {
      const url = id ? `/api/profiles/${id}` : '/api/profiles';
      const method = id ? 'PUT' : 'POST';
      await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      document.querySelector('.ix-modal-overlay')?.querySelector('[data-close-modal]')?.click();
      showToast(id ? (t('profiles.saved', 'Profile saved')) : (t('profiles.created', 'Profile created')), 'success');
      loadProfilesPanel();
    } catch (e) {
      showToast(t('profiles.save_error', 'Could not save profile'), 'error');
    }
  };

  window._deleteProfile = async function(id) {
    confirmAction(t('profiles.delete_confirm', 'Delete this profile?'), async () => {
      await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
      showToast(t('profiles.deleted', 'Profile deleted'), 'success');
      loadProfilesPanel();
    }, { danger: true });
  };
})();
