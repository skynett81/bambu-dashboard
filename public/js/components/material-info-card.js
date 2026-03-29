// Material Info Card — renders detailed material reference data
// inside spool detail overlays or any container element.
(function() {
  'use strict';

  // Cache fetched materials to avoid repeated API calls
  let _materialsCache = null;

  async function fetchMaterials() {
    if (_materialsCache) return _materialsCache;
    try {
      const res = await fetch('/api/filament-materials');
      if (res.ok) {
        _materialsCache = await res.json();
      }
    } catch { /* ignore */ }
    return _materialsCache || [];
  }

  async function fetchMaterial(nameOrId) {
    if (!nameOrId) return null;
    // Try cache first
    const all = await fetchMaterials();
    const key = nameOrId.toLowerCase().trim();
    const cached = all.find(m =>
      m.id === key ||
      m.name.toLowerCase() === key ||
      m.name.toLowerCase().replace(/[() ]/g, '') === key.replace(/[() ]/g, '')
    );
    if (cached) return cached;
    // Fallback to API
    try {
      const res = await fetch('/api/filament-materials/' + encodeURIComponent(key));
      if (res.ok) return await res.json();
    } catch { /* ignore */ }
    return null;
  }

  function esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // Difficulty badge colors
  const DIFFICULTY_COLORS = {
    beginner: '#00c864',
    intermediate: '#4aa3df',
    advanced: '#f0883e',
    expert: '#e53935'
  };

  // Plate rating colors and icons
  const RATING_COLORS = {
    excellent: '#00c864',
    good: '#4aa3df',
    poor: '#f0883e',
    not_recommended: '#e53935'
  };

  const RATING_ICONS = {
    excellent: '\u2605\u2605\u2605',
    good: '\u2605\u2605',
    poor: '\u2605',
    not_recommended: '\u2298'
  };

  // Hygroscopic level colors
  const HYGRO_COLORS = {
    low: '#00c864',
    medium: '#4aa3df',
    high: '#f0883e',
    extreme: '#e53935'
  };

  function renderPropertyBar(label, value, maxVal) {
    const pct = Math.round((value / maxVal) * 100);
    const color = pct >= 80 ? '#00c864' : pct >= 60 ? '#4aa3df' : pct >= 40 ? '#f0883e' : '#e53935';
    return `<div class="mat-prop-row">
      <span class="mat-prop-label">${esc(label)}</span>
      <div class="mat-prop-track">
        <div class="mat-prop-fill" style="width:${pct}%;background:${color}"></div>
      </div>
      <span class="mat-prop-val">${value}/5</span>
    </div>`;
  }

  function renderPlateCard(plateKey, plateData) {
    const plateNames = {
      cool_plate: 'Cool Plate',
      engineering_plate: 'Engineering Plate',
      high_temp_plate: 'High Temp Plate',
      textured_pei: 'Textured PEI'
    };
    const name = plateNames[plateKey] || plateKey;
    const rating = plateData.rating || 'poor';
    const color = RATING_COLORS[rating] || '#888';
    const icon = RATING_ICONS[rating] || '';
    const ratingLabel = typeof t === 'function'
      ? t('filament.plate_' + rating, rating)
      : rating;
    const glueNote = plateData.glue_stick
      ? `<div class="mat-plate-glue">${typeof t === 'function' ? t('filament.glue_required', 'Glue stick required') : 'Glue stick required'}</div>`
      : '';
    const best = rating === 'excellent';

    return `<div class="mat-plate-card${best ? ' mat-plate-best' : ''}" style="border-color:${color}">
      <div class="mat-plate-name">${esc(name)}</div>
      <div class="mat-plate-rating" style="color:${color}">${icon} ${esc(ratingLabel)}</div>
      ${glueNote}
    </div>`;
  }

  /**
   * Render a complete material info card into a container.
   * @param {string|HTMLElement} container - ID string or DOM element
   * @param {string} materialType - Material name (e.g. 'PLA', 'PA-CF')
   */
  window.renderMaterialInfo = async function(container, materialType) {
    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el || !materialType) return;

    const mat = await fetchMaterial(materialType);
    if (!mat) {
      el.innerHTML = '';
      return;
    }

    const _t = typeof t === 'function' ? t : (k, fb) => fb || k;

    // Difficulty badge
    const diffColor = DIFFICULTY_COLORS[mat.difficulty] || '#888';
    const diffLabel = _t('filament.difficulty_' + mat.difficulty, mat.difficulty);

    // Drying info
    const hygroColor = HYGRO_COLORS[mat.drying?.hygroscopic] || '#888';
    const hygroLabel = _t('filament.hygroscopic_' + (mat.drying?.hygroscopic || 'low'), mat.drying?.hygroscopic || 'low');

    // Properties
    const propLabels = {
      strength: _t('filament.strength', 'Strength'),
      flexibility: _t('filament.flexibility', 'Flexibility'),
      heat_resistance: _t('filament.heat_resistance', 'Heat resistance'),
      uv_resistance: _t('filament.uv_resistance', 'UV resistance'),
      surface_quality: _t('filament.surface_quality', 'Surface quality'),
      ease_of_print: _t('filament.ease_of_print', 'Ease of print')
    };

    let propsHtml = '';
    if (mat.properties) {
      for (const [key, label] of Object.entries(propLabels)) {
        if (mat.properties[key] != null) {
          propsHtml += renderPropertyBar(label, mat.properties[key], 5);
        }
      }
    }

    // Plates
    let platesHtml = '';
    if (mat.plates) {
      platesHtml = '<div class="mat-plates-grid">';
      for (const [key, data] of Object.entries(mat.plates)) {
        platesHtml += renderPlateCard(key, data);
      }
      platesHtml += '</div>';
    }

    // Requirement badges
    let badges = '';
    if (mat.requires_hardened_nozzle) {
      badges += `<span class="mat-badge mat-badge-warn">${_t('filament.hardened_nozzle_required', 'Hardened nozzle required')}</span>`;
    }
    if (mat.requires_enclosure) {
      badges += `<span class="mat-badge mat-badge-warn">${_t('filament.enclosure_required', 'Enclosure required')}</span>`;
    }

    el.innerHTML = `
      <div class="mat-info-card">
        <div class="mat-info-header" onclick="this.parentElement.classList.toggle('mat-info-expanded')">
          <span class="mat-info-toggle-icon"></span>
          <span class="mat-info-title">${_t('filament.material_info', 'Material Info')}</span>
          <span class="mat-info-subtitle">${esc(mat.fullName)}</span>
          <span class="mat-difficulty-badge" style="background:${diffColor}">${esc(diffLabel)}</span>
        </div>
        <div class="mat-info-body">
          ${badges ? `<div class="mat-badges">${badges}</div>` : ''}

          <div class="mat-section">
            <div class="mat-section-title">${_t('filament.db_nozzle_temp', 'Nozzle temperature')}</div>
            <div class="mat-temp-range">
              <span class="mat-temp-min">${mat.nozzle_temp.min}&deg;C</span>
              <div class="mat-temp-bar">
                <div class="mat-temp-fill" style="left:${((mat.nozzle_temp.min - 180) / 150) * 100}%;right:${100 - ((mat.nozzle_temp.max - 180) / 150) * 100}%"></div>
                <div class="mat-temp-rec" style="left:${((mat.nozzle_temp.recommended - 180) / 150) * 100}%"></div>
              </div>
              <span class="mat-temp-max">${mat.nozzle_temp.max}&deg;C</span>
            </div>
            <div class="mat-temp-rec-label">${_t('filament.recommended', 'Recommended')}: ${mat.nozzle_temp.recommended}&deg;C</div>
          </div>

          <div class="mat-section">
            <div class="mat-section-title">${_t('filament.db_bed_temp', 'Bed temperature')}</div>
            <div class="mat-temp-range">
              <span class="mat-temp-min">${mat.bed_temp.min}&deg;C</span>
              <div class="mat-temp-bar">
                <div class="mat-temp-fill" style="left:${((mat.bed_temp.min - 20) / 120) * 100}%;right:${100 - ((mat.bed_temp.max - 20) / 120) * 100}%"></div>
                <div class="mat-temp-rec" style="left:${((mat.bed_temp.recommended - 20) / 120) * 100}%"></div>
              </div>
              <span class="mat-temp-max">${mat.bed_temp.max}&deg;C</span>
            </div>
            <div class="mat-temp-rec-label">${_t('filament.recommended', 'Recommended')}: ${mat.bed_temp.recommended}&deg;C</div>
          </div>

          ${mat.chamber_temp ? `<div class="mat-section">
            <div class="mat-section-title">${_t('filament.db_chamber_temp', 'Chamber temperature')}</div>
            <div class="mat-temp-rec-label">${mat.chamber_temp.min}&deg;C &ndash; ${mat.chamber_temp.max}&deg;C</div>
          </div>` : ''}

          <div class="mat-section">
            <div class="mat-section-title">${_t('filament.plate_compat', 'Plate compatibility')}</div>
            ${platesHtml}
          </div>

          <div class="mat-section">
            <div class="mat-section-title">${_t('filament.drying_info', 'Drying')}</div>
            <div class="mat-drying-row">
              <span>${mat.drying.temp}&deg;C &middot; ${mat.drying.hours}h</span>
              <span class="mat-hygro-badge" style="background:${hygroColor}">${_t('filament.hygroscopic', 'Moisture sensitivity')}: ${esc(hygroLabel)}</span>
            </div>
          </div>

          <div class="mat-section">
            <div class="mat-section-title">${_t('filament.properties', 'Properties')}</div>
            <div class="mat-props">${propsHtml}</div>
          </div>

          ${mat.tips ? `<div class="mat-section mat-tips">
            <div class="mat-section-title">${_t('filament.tips', 'Tips')}</div>
            <div class="mat-tip-text">${esc(_t('filament.mat_tips_' + mat.id, '') || mat.tips)}</div>
          </div>` : ''}

          ${mat.warnings ? `<div class="mat-section mat-warnings">
            <div class="mat-section-title">${_t('filament.warnings', 'Warnings')}</div>
            <div class="mat-warn-text">${esc(_t('filament.mat_warn_' + mat.id, '') || mat.warnings)}</div>
          </div>` : ''}
        </div>
      </div>`;
  };

  // Inject CSS once
  const style = document.createElement('style');
  style.textContent = `
    .mat-info-card {
      margin-top: 8px;
      border: 1px solid var(--border, #333);
      border-radius: 8px;
      overflow: hidden;
      background: var(--card-bg, #1a1a2e);
    }
    .mat-info-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      cursor: pointer;
      user-select: none;
      background: var(--card-header-bg, rgba(255,255,255,0.03));
      transition: background 0.15s;
    }
    .mat-info-header:hover { background: rgba(255,255,255,0.06); }
    .mat-info-toggle-icon::before {
      content: '\\25B6';
      font-size: 0.65rem;
      color: var(--text-secondary, #888);
      transition: transform 0.2s;
      display: inline-block;
    }
    .mat-info-expanded .mat-info-toggle-icon::before { transform: rotate(90deg); }
    .mat-info-title {
      font-weight: 700;
      font-size: 0.85rem;
      color: var(--text-primary, #eee);
    }
    .mat-info-subtitle {
      font-size: 0.75rem;
      color: var(--text-secondary, #888);
      flex: 1;
    }
    .mat-info-body {
      display: none;
      padding: 12px 14px;
    }
    .mat-info-expanded .mat-info-body { display: block; }
    .mat-difficulty-badge {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 10px;
      color: #fff;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .mat-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
    .mat-badge {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 6px;
      color: #fff;
    }
    .mat-badge-warn { background: #e53935; }
    .mat-section { margin-bottom: 12px; }
    .mat-section-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-secondary, #888);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 6px;
    }
    /* Temperature range bars */
    .mat-temp-range {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .mat-temp-min, .mat-temp-max {
      font-size: 0.72rem;
      color: var(--text-secondary, #888);
      min-width: 38px;
      text-align: center;
    }
    .mat-temp-bar {
      flex: 1;
      height: 6px;
      background: var(--border, #333);
      border-radius: 3px;
      position: relative;
    }
    .mat-temp-fill {
      position: absolute;
      top: 0; bottom: 0;
      background: linear-gradient(90deg, #4aa3df, #f0883e);
      border-radius: 3px;
    }
    .mat-temp-rec {
      position: absolute;
      top: -3px;
      width: 3px;
      height: 12px;
      background: #fff;
      border-radius: 2px;
      transform: translateX(-1px);
    }
    .mat-temp-rec-label {
      font-size: 0.72rem;
      color: var(--text-secondary, #888);
      margin-top: 3px;
    }
    /* Plate cards */
    .mat-plates-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 6px;
    }
    .mat-plate-card {
      border: 1px solid var(--border, #333);
      border-radius: 6px;
      padding: 8px;
      text-align: center;
      border-left-width: 3px;
      background: rgba(255,255,255,0.02);
    }
    .mat-plate-best { background: rgba(0,200,100,0.06); }
    .mat-plate-name {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-primary, #eee);
      margin-bottom: 4px;
    }
    .mat-plate-rating { font-size: 0.72rem; font-weight: 700; }
    .mat-plate-glue {
      font-size: 0.65rem;
      color: #f0883e;
      margin-top: 3px;
    }
    /* Drying */
    .mat-drying-row {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.78rem;
      color: var(--text-primary, #eee);
    }
    .mat-hygro-badge {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 10px;
      color: #fff;
    }
    /* Properties bars */
    .mat-props { display: flex; flex-direction: column; gap: 4px; }
    .mat-prop-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .mat-prop-label {
      font-size: 0.72rem;
      color: var(--text-secondary, #888);
      min-width: 100px;
    }
    .mat-prop-track {
      flex: 1;
      height: 5px;
      background: var(--border, #333);
      border-radius: 3px;
      overflow: hidden;
    }
    .mat-prop-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s;
    }
    .mat-prop-val {
      font-size: 0.68rem;
      color: var(--text-secondary, #888);
      min-width: 24px;
      text-align: right;
    }
    /* Tips and warnings */
    .mat-tips .mat-tip-text {
      font-size: 0.78rem;
      color: var(--text-primary, #eee);
      padding: 8px 10px;
      background: rgba(0,200,100,0.06);
      border-left: 3px solid #00c864;
      border-radius: 4px;
      line-height: 1.4;
    }
    .mat-warnings .mat-warn-text {
      font-size: 0.78rem;
      color: var(--text-primary, #eee);
      padding: 8px 10px;
      background: rgba(229,57,53,0.06);
      border-left: 3px solid #e53935;
      border-radius: 4px;
      line-height: 1.4;
    }
  `;
  document.head.appendChild(style);

})();
