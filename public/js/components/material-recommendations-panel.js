// Material Recommendations Panel
(function() {
  let _activeTab = 'recommendations';
  let _recommendations = [];
  let _successRates = [];
  let _filterType = '';
  let _compareType = '';
  let _compareData = [];

  const TABS = [
    { id: 'recommendations', labelKey: 'material_rec.tab_recommendations', fallback: 'Anbefalinger' },
    { id: 'compare', labelKey: 'material_rec.tab_compare', fallback: 'Sammenlign' },
    { id: 'success', labelKey: 'material_rec.tab_success_rates', fallback: 'Suksessrate' }
  ];

  function _tabBarHtml() {
    return '<div class="tabs _wrapper-tabs">' + TABS.map(tab => {
      const label = (typeof t === 'function' ? t(tab.labelKey) : '') || tab.fallback;
      const active = _activeTab === tab.id ? ' active' : '';
      return `<button class="tab-btn${active}" onclick="_switchMaterialRecTab('${tab.id}')">${label}</button>`;
    }).join('') + '</div>';
  }

  function _ensureTabBar() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;
    const old = body.querySelector('._wrapper-tabs');
    if (old) old.remove();
    body.insertAdjacentHTML('afterbegin', _tabBarHtml());
  }

  function _tl(key, fb) {
    return (typeof t === 'function' ? t(key) : '') || fb;
  }

  function _rateClass(rate) {
    if (rate >= 90) return 'good';
    if (rate >= 70) return 'warn';
    return 'bad';
  }

  function _rateColor(rate) {
    if (rate >= 90) return 'var(--accent-green, #00AE42)';
    if (rate >= 70) return 'var(--accent-orange, #f0883e)';
    return 'var(--accent-red, #e53935)';
  }

  function _speedLabel(level) {
    if (level == null) return '--';
    if (level <= 1) return 'Silent';
    if (level <= 2) return 'Normal';
    if (level <= 3) return 'Sport';
    return 'Ludicrous';
  }

  function _getDistinctTypes() {
    const types = new Set();
    for (const r of _recommendations) types.add(r.filament_type);
    return [...types].sort();
  }

  async function _fetchRecommendations() {
    try {
      const resp = await fetch('/api/materials/recommendations');
      if (resp.ok) _recommendations = await resp.json();
    } catch {}
  }

  async function _fetchSuccessRates() {
    try {
      const resp = await fetch('/api/materials/success-rates');
      if (resp.ok) _successRates = await resp.json();
    } catch {}
  }

  async function _fetchCompare(type) {
    try {
      const resp = await fetch(`/api/materials/compare/${encodeURIComponent(type)}`);
      if (resp.ok) _compareData = await resp.json();
      else _compareData = [];
    } catch { _compareData = []; }
  }

  async function _recalculate() {
    try {
      const resp = await fetch('/api/materials/recommendations/recalculate', { method: 'POST' });
      const data = await resp.json();
      if (data.ok) {
        if (typeof showToast === 'function') showToast(_tl('material_rec.recalculated', 'Anbefalinger oppdatert') + ` (${data.count})`, 'success');
        await _fetchRecommendations();
        await _fetchSuccessRates();
        _render();
      }
    } catch (e) {
      if (typeof showToast === 'function') showToast('Feil: ' + e.message, 'error');
    }
  }

  function _renderRecommendationsTab() {
    const types = _getDistinctTypes();
    const filtered = _filterType ? _recommendations.filter(r => r.filament_type === _filterType) : _recommendations;

    // Summary stats strip
    const totalMaterials = _recommendations.length;
    const avgRate = totalMaterials > 0 ? Math.round(_recommendations.reduce((s, r) => s + (r.success_rate || 0), 0) / totalMaterials) : 0;
    const totalPrints = _recommendations.reduce((s, r) => s + (r.sample_size || 0), 0);
    const topMaterial = _recommendations.length > 0 ? [..._recommendations].sort((a, b) => (b.success_rate || 0) - (a.success_rate || 0))[0] : null;

    let html = `<div class="stats-strip" style="border-radius:var(--radius-sm);border:1px solid var(--border-color);margin-bottom:18px;overflow:hidden">
      <div class="spark-panel">
        <span class="spark-label">${_tl('material_rec.total_materials', 'Materialer')}</span>
        <span class="spark-value">${totalMaterials}</span>
      </div>
      <div class="spark-panel">
        <span class="spark-label">${_tl('material_rec.avg_success', 'Snitt suksess')}</span>
        <span class="spark-value" style="color:${_rateColor(avgRate)}">${avgRate}%</span>
      </div>
      <div class="spark-panel">
        <span class="spark-label">${_tl('material_rec.total_prints', 'Totalt utskrifter')}</span>
        <span class="spark-value">${totalPrints}</span>
      </div>
      <div class="spark-panel" style="border-right:none">
        <span class="spark-label">${_tl('material_rec.best_material', 'Beste materiale')}</span>
        <span class="spark-value" style="font-size:0.85rem">${topMaterial ? topMaterial.filament_type : '--'}</span>
      </div>
    </div>`;

    // Toolbar
    html += `<div class="matrec-toolbar">
      <select id="matrec-filter" onchange="_matRecFilterType(this.value)" class="matrec-select">
        <option value="">${_tl('material_rec.all_types', 'Alle typer')}</option>
        ${types.map(tp => `<option value="${tp}" ${tp === _filterType ? 'selected' : ''}>${tp}</option>`).join('')}
      </select>
      <button onclick="_matRecRecalculate()" class="matrec-recalc-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
        ${_tl('material_rec.recalculate', 'Beregn på nytt')}
      </button>
    </div>`;

    if (filtered.length === 0) {
      return html + `<div class="matrec-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.3;margin-bottom:12px"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
        <p>${_tl('material_rec.no_data', 'Ingen anbefalinger ennå. Trenger minst 3 utskrifter per materiale.')}</p>
      </div>`;
    }

    html += '<div class="auto-grid auto-grid--md" style="margin-top:4px">';
    for (const r of filtered) {
      const rate = r.success_rate || 0;
      const cls = _rateClass(rate);
      const brandLabel = r.filament_brand || _tl('material_rec.unknown_brand', 'Ukjent');
      html += `
        <div class="card matrec-card">
          <div class="matrec-card-header matrec-card-header--${cls}">
            <div class="matrec-card-type">${r.filament_type}</div>
            <div class="matrec-card-brand">${brandLabel}</div>
          </div>
          <div class="matrec-card-stats">
            <div class="matrec-stat">
              <span class="matrec-stat-label">${_tl('material_rec.nozzle_temp', 'Dyse')}</span>
              <span class="matrec-stat-value">${r.recommended_nozzle_temp != null ? r.recommended_nozzle_temp + '°C' : '--'}</span>
            </div>
            <div class="matrec-stat">
              <span class="matrec-stat-label">${_tl('material_rec.bed_temp', 'Seng')}</span>
              <span class="matrec-stat-value">${r.recommended_bed_temp != null ? r.recommended_bed_temp + '°C' : '--'}</span>
            </div>
            <div class="matrec-stat">
              <span class="matrec-stat-label">${_tl('material_rec.speed', 'Hastighet')}</span>
              <span class="matrec-stat-value">${_speedLabel(r.recommended_speed_level)}</span>
            </div>
            <div class="matrec-stat">
              <span class="matrec-stat-label">${_tl('material_rec.avg_time', 'Snitt-tid')}</span>
              <span class="matrec-stat-value">${r.avg_print_time_min != null ? r.avg_print_time_min + ' min' : '--'}</span>
            </div>
          </div>
          <div class="matrec-card-footer">
            <div class="matrec-rate">
              <span class="hs-badge hs-badge-${cls}">${rate}%</span>
            </div>
            <span class="matrec-samples">${r.sample_size || 0} ${_tl('material_rec.prints', 'utskrifter')}</span>
          </div>
        </div>`;
    }
    html += '</div>';

    return html;
  }

  function _renderCompareTab() {
    const types = _getDistinctTypes();

    let html = `<div class="matrec-toolbar" style="margin-bottom:18px">
      <select id="matrec-compare-type" onchange="_matRecCompareType(this.value)" class="matrec-select">
        <option value="">${_tl('material_rec.select_type', 'Velg materialtype...')}</option>
        ${types.map(tp => `<option value="${tp}" ${tp === _compareType ? 'selected' : ''}>${tp}</option>`).join('')}
      </select>
    </div>`;

    if (!_compareType || _compareData.length === 0) {
      if (_compareType) {
        html += `<div class="matrec-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.3;margin-bottom:12px"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
          <p>${_tl('material_rec.no_compare_data', 'Ingen merker å sammenligne for denne typen.')}</p>
        </div>`;
      } else {
        html += `<div class="matrec-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.3;margin-bottom:12px"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
          <p>${_tl('material_rec.select_to_compare', 'Velg en materialtype for å sammenligne merker.')}</p>
        </div>`;
      }
      return html;
    }

    // Bar chart
    html += '<div class="card" style="padding:20px;margin-bottom:18px">';
    html += `<div class="card-title">${_compareType} — ${_tl('material_rec.brand_comparison', 'Merkesammenligning')}</div>`;
    for (const d of _compareData) {
      const pct = d.success_rate || 0;
      const color = _rateColor(pct);
      html += `<div class="matrec-bar-row">
        <div class="matrec-bar-label" title="${d.brand || ''}">${d.brand || '?'}</div>
        <div class="matrec-bar-track">
          <div class="matrec-bar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
        <div class="matrec-bar-value" style="color:${color}">${pct}%</div>
        <div class="matrec-bar-count">${d.sample_size || 0}x</div>
      </div>`;
    }
    html += '</div>';

    // Table
    html += `<div class="card" style="padding:0;overflow:hidden">
      <table class="matrec-table">
        <thead>
          <tr>
            <th>#</th>
            <th style="text-align:left">${_tl('material_rec.brand', 'Merke')}</th>
            <th>${_tl('material_rec.success_rate', 'Suksess')}</th>
            <th>${_tl('material_rec.nozzle_temp', 'Dyse')}</th>
            <th>${_tl('material_rec.bed_temp', 'Seng')}</th>
            <th>${_tl('material_rec.speed', 'Hastighet')}</th>
            <th>${_tl('material_rec.samples', 'Antall')}</th>
          </tr>
        </thead>
        <tbody>`;
    for (const d of _compareData) {
      const cls = _rateClass(d.success_rate || 0);
      html += `<tr>
        <td style="font-weight:600">${d.rank || '-'}</td>
        <td style="text-align:left">${d.brand || '--'}</td>
        <td><span class="hs-badge hs-badge-${cls}">${d.success_rate != null ? d.success_rate + '%' : '--'}</span></td>
        <td>${d.nozzle_temp != null ? d.nozzle_temp + '°C' : '--'}</td>
        <td>${d.bed_temp != null ? d.bed_temp + '°C' : '--'}</td>
        <td>${_speedLabel(d.speed_level)}</td>
        <td>${d.sample_size || 0}</td>
      </tr>`;
    }
    html += '</tbody></table></div>';

    return html;
  }

  function _renderSuccessTab() {
    if (_successRates.length === 0) {
      return `<div class="matrec-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity:0.3;margin-bottom:12px"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        <p>${_tl('material_rec.no_data', 'Ingen data ennå. Trenger minst 3 utskrifter per materiale.')}</p>
      </div>`;
    }

    let html = `<div class="card" style="padding:20px">
      <div class="card-title">${_tl('material_rec.leaderboard', 'Rangliste')}</div>
      <p style="font-size:0.75rem;color:var(--text-muted);margin-bottom:16px">${_tl('material_rec.leaderboard_desc', 'Materialer rangert etter suksessrate (min. 3 utskrifter)')}</p>`;

    for (let i = 0; i < _successRates.length; i++) {
      const r = _successRates[i];
      const pct = r.success_rate || 0;
      const color = _rateColor(pct);
      const label = r.filament_brand ? `${r.filament_type} (${r.filament_brand})` : r.filament_type;
      const medal = i === 0 ? '<span class="matrec-medal matrec-medal--gold">1</span>'
                  : i === 1 ? '<span class="matrec-medal matrec-medal--silver">2</span>'
                  : i === 2 ? '<span class="matrec-medal matrec-medal--bronze">3</span>'
                  : `<span class="matrec-rank">${i + 1}</span>`;

      html += `<div class="matrec-leader-row">
        ${medal}
        <div class="matrec-leader-label" title="${label}">${label}</div>
        <div class="matrec-bar-track" style="flex:1">
          <div class="matrec-bar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
        <div class="matrec-bar-value" style="color:${color}">${pct}%</div>
        <div class="matrec-bar-count">${r.sample_size}x</div>
      </div>`;
    }

    html += '</div>';
    return html;
  }

  async function _render() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;

    // Show loading on first load
    if (_recommendations.length === 0 && _successRates.length === 0) {
      body.innerHTML = '<div class="matrec-empty"><div class="matrec-spinner"></div><p>' + _tl('common.loading', 'Laster...') + '</p></div>';
      await Promise.all([_fetchRecommendations(), _fetchSuccessRates()]);
    }

    let contentHtml = '';
    if (_activeTab === 'recommendations') {
      contentHtml = _renderRecommendationsTab();
    } else if (_activeTab === 'compare') {
      if (_compareType) await _fetchCompare(_compareType);
      contentHtml = _renderCompareTab();
    } else if (_activeTab === 'success') {
      contentHtml = _renderSuccessTab();
    }

    body.innerHTML = `<div class="matrec-panel">${contentHtml}</div>`;
    _ensureTabBar();
  }

  // Global helpers
  window._switchMaterialRecTab = function(tab) { _activeTab = tab; _render(); };
  window._matRecFilterType = function(type) { _filterType = type; _render(); };
  window._matRecRecalculate = function() { _recalculate(); };
  window._matRecCompareType = async function(type) { _compareType = type; if (type) await _fetchCompare(type); _render(); };

  window.loadMaterialRecommendationsPanel = function(initialTab) {
    _activeTab = (typeof initialTab === 'string') ? initialTab : 'recommendations';
    _render();
  };
})();
