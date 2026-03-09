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

  function _buildTabBar() {
    const div = document.createElement('div');
    div.className = 'tabs';
    div.innerHTML = TABS.map(tab => {
      const label = (typeof t === 'function' ? t(tab.labelKey) : '') || tab.fallback;
      const active = _activeTab === tab.id ? ' active' : '';
      return `<button class="tab-btn${active}" onclick="_switchMaterialRecTab('${tab.id}')">${label}</button>`;
    }).join('');
    return div;
  }

  function _tl(key, fb) {
    return (typeof t === 'function' ? t(key) : '') || fb;
  }

  function _rateColor(rate) {
    if (rate >= 90) return 'var(--accent-green, #22c55e)';
    if (rate >= 70) return 'var(--accent-orange, #f59e0b)';
    return 'var(--accent-red, #ef4444)';
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

    let filterHtml = `<div style="display:flex;gap:8px;align-items:center;margin-bottom:16px;flex-wrap:wrap">
      <select id="matrec-filter" onchange="_matRecFilterType(this.value)" style="padding:6px 12px;border-radius:6px;border:1px solid var(--border);background:var(--card-bg);color:var(--text-primary);font-size:0.85rem">
        <option value="">${_tl('material_rec.all_types', 'Alle typer')}</option>
        ${types.map(t => `<option value="${t}" ${t === _filterType ? 'selected' : ''}>${t}</option>`).join('')}
      </select>
      <button onclick="_matRecRecalculate()" class="btn btn-sm" style="margin-left:auto;padding:6px 14px;border-radius:6px;background:var(--accent-blue);color:#fff;border:none;cursor:pointer;font-size:0.8rem">
        ${_tl('material_rec.recalculate', 'Beregn p\u00e5 nytt')}
      </button>
    </div>`;

    if (filtered.length === 0) {
      return filterHtml + `<div class="empty-state" style="text-align:center;padding:40px;opacity:0.6">
        <p>${_tl('material_rec.no_data', 'Ingen anbefalinger enn\u00e5. Trenger minst 3 utskrifter per materiale.')}</p>
      </div>`;
    }

    let cardsHtml = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">';
    for (const r of filtered) {
      const rateColor = _rateColor(r.success_rate || 0);
      const brandLabel = r.filament_brand || _tl('material_rec.unknown_brand', 'Ukjent');
      cardsHtml += `
        <div class="card" style="background:var(--card-bg);border-radius:12px;overflow:hidden;border:1px solid var(--border)">
          <div style="padding:12px 16px;background:linear-gradient(135deg, var(--card-bg), color-mix(in srgb, ${rateColor} 15%, var(--card-bg)));border-bottom:1px solid var(--border)">
            <div style="font-weight:600;font-size:1rem">${r.filament_type}</div>
            <div style="font-size:0.8rem;opacity:0.7">${brandLabel}</div>
          </div>
          <div style="padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:0.85rem">
            <div>
              <div style="opacity:0.6;font-size:0.75rem">${_tl('material_rec.nozzle_temp', 'Dyse-temp')}</div>
              <div style="font-weight:600">${r.recommended_nozzle_temp != null ? r.recommended_nozzle_temp + '\u00b0C' : '--'}</div>
            </div>
            <div>
              <div style="opacity:0.6;font-size:0.75rem">${_tl('material_rec.bed_temp', 'Seng-temp')}</div>
              <div style="font-weight:600">${r.recommended_bed_temp != null ? r.recommended_bed_temp + '\u00b0C' : '--'}</div>
            </div>
            <div>
              <div style="opacity:0.6;font-size:0.75rem">${_tl('material_rec.speed', 'Hastighet')}</div>
              <div style="font-weight:600">${_speedLabel(r.recommended_speed_level)}</div>
            </div>
            <div>
              <div style="opacity:0.6;font-size:0.75rem">${_tl('material_rec.avg_time', 'Snitt-tid')}</div>
              <div style="font-weight:600">${r.avg_print_time_min != null ? r.avg_print_time_min + ' min' : '--'}</div>
            </div>
          </div>
          <div style="padding:12px 16px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
            <div style="display:flex;align-items:center;gap:6px">
              <div style="width:10px;height:10px;border-radius:50%;background:${rateColor}"></div>
              <span style="font-weight:700;color:${rateColor}">${r.success_rate != null ? r.success_rate + '%' : '--'}</span>
            </div>
            <span style="font-size:0.75rem;opacity:0.5">${r.sample_size || 0} ${_tl('material_rec.prints', 'utskrifter')}</span>
          </div>
        </div>`;
    }
    cardsHtml += '</div>';

    return filterHtml + cardsHtml;
  }

  function _renderCompareTab() {
    const types = _getDistinctTypes();

    let html = `<div style="margin-bottom:16px">
      <select id="matrec-compare-type" onchange="_matRecCompareType(this.value)" style="padding:6px 12px;border-radius:6px;border:1px solid var(--border);background:var(--card-bg);color:var(--text-primary);font-size:0.85rem">
        <option value="">${_tl('material_rec.select_type', 'Velg materialtype...')}</option>
        ${types.map(t => `<option value="${t}" ${t === _compareType ? 'selected' : ''}>${t}</option>`).join('')}
      </select>
    </div>`;

    if (!_compareType || _compareData.length === 0) {
      if (_compareType) {
        html += `<div class="empty-state" style="text-align:center;padding:40px;opacity:0.6">
          <p>${_tl('material_rec.no_compare_data', 'Ingen merker \u00e5 sammenligne for denne typen.')}</p>
        </div>`;
      }
      return html;
    }

    // Bar chart
    const maxRate = Math.max(..._compareData.map(d => d.success_rate || 0), 1);
    html += '<div style="margin-bottom:24px">';
    for (const d of _compareData) {
      const pct = ((d.success_rate || 0) / 100) * 100;
      const color = _rateColor(d.success_rate || 0);
      html += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <div style="width:100px;font-size:0.85rem;text-align:right;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${d.brand || ''}">${d.brand || '?'}</div>
        <div style="flex:1;background:var(--border);border-radius:4px;height:24px;overflow:hidden;position:relative">
          <div style="width:${pct}%;height:100%;background:${color};border-radius:4px;transition:width 0.3s"></div>
          <span style="position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:0.75rem;font-weight:600">${d.success_rate != null ? d.success_rate + '%' : '--'}</span>
        </div>
        <div style="width:50px;font-size:0.75rem;opacity:0.5;flex-shrink:0">${d.sample_size || 0}x</div>
      </div>`;
    }
    html += '</div>';

    // Comparison table
    html += `<div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:0.85rem">
        <thead>
          <tr style="border-bottom:2px solid var(--border)">
            <th style="text-align:left;padding:8px">#</th>
            <th style="text-align:left;padding:8px">${_tl('material_rec.brand', 'Merke')}</th>
            <th style="text-align:center;padding:8px">${_tl('material_rec.success_rate', 'Suksessrate')}</th>
            <th style="text-align:center;padding:8px">${_tl('material_rec.nozzle_temp', 'Dyse-temp')}</th>
            <th style="text-align:center;padding:8px">${_tl('material_rec.bed_temp', 'Seng-temp')}</th>
            <th style="text-align:center;padding:8px">${_tl('material_rec.speed', 'Hastighet')}</th>
            <th style="text-align:center;padding:8px">${_tl('material_rec.samples', 'Antall')}</th>
          </tr>
        </thead>
        <tbody>`;
    for (const d of _compareData) {
      html += `<tr style="border-bottom:1px solid var(--border)">
        <td style="padding:8px;font-weight:600">${d.rank || '-'}</td>
        <td style="padding:8px">${d.brand || '--'}</td>
        <td style="padding:8px;text-align:center;font-weight:600;color:${_rateColor(d.success_rate || 0)}">${d.success_rate != null ? d.success_rate + '%' : '--'}</td>
        <td style="padding:8px;text-align:center">${d.nozzle_temp != null ? d.nozzle_temp + '\u00b0C' : '--'}</td>
        <td style="padding:8px;text-align:center">${d.bed_temp != null ? d.bed_temp + '\u00b0C' : '--'}</td>
        <td style="padding:8px;text-align:center">${_speedLabel(d.speed_level)}</td>
        <td style="padding:8px;text-align:center">${d.sample_size || 0}</td>
      </tr>`;
    }
    html += '</tbody></table></div>';

    return html;
  }

  function _renderSuccessTab() {
    if (_successRates.length === 0) {
      return `<div class="empty-state" style="text-align:center;padding:40px;opacity:0.6">
        <p>${_tl('material_rec.no_data', 'Ingen data enn\u00e5. Trenger minst 3 utskrifter per materiale.')}</p>
      </div>`;
    }

    // Leaderboard bar chart
    let html = '<div style="margin-bottom:8px;font-size:0.8rem;opacity:0.5">' + _tl('material_rec.leaderboard_desc', 'Materialer rangert etter suksessrate (min. 3 utskrifter)') + '</div>';

    for (let i = 0; i < _successRates.length; i++) {
      const r = _successRates[i];
      const pct = (r.success_rate || 0);
      const color = _rateColor(pct);
      const label = r.filament_brand ? `${r.filament_type} (${r.filament_brand})` : r.filament_type;
      const medal = i === 0 ? ' \ud83e\udd47' : i === 1 ? ' \ud83e\udd48' : i === 2 ? ' \ud83e\udd49' : '';

      html += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
        <div style="width:24px;font-size:0.8rem;text-align:right;font-weight:600;opacity:0.5;flex-shrink:0">${i + 1}</div>
        <div style="width:160px;font-size:0.85rem;flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${label}">${label}${medal}</div>
        <div style="flex:1;background:var(--border);border-radius:4px;height:22px;overflow:hidden;position:relative">
          <div style="width:${pct}%;height:100%;background:${color};border-radius:4px;transition:width 0.3s"></div>
          <span style="position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:0.75rem;font-weight:600">${pct}%</span>
        </div>
        <div style="width:50px;font-size:0.75rem;opacity:0.5;flex-shrink:0;text-align:right">${r.sample_size}x</div>
      </div>`;
    }

    return html;
  }

  async function _render() {
    const body = document.getElementById('overlay-panel-body');
    if (!body) return;

    // Show loading on first load
    if (_recommendations.length === 0 && _successRates.length === 0) {
      body.innerHTML = '<div style="text-align:center;padding:40px;opacity:0.5">' + _tl('common.loading', 'Laster...') + '</div>';
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

    body.innerHTML = `<div id="matrec-content" style="padding:0">${contentHtml}</div>`;
    body.insertBefore(_buildTabBar(), body.firstChild);
  }

  // Global helpers
  window._switchMaterialRecTab = function(tab) { _activeTab = tab; _render(); };
  window._matRecFilterType = function(type) { _filterType = type; _render(); };
  window._matRecRecalculate = function() { _recalculate(); };
  window._matRecCompareType = async function(type) { _compareType = type; if (type) await _fetchCompare(type); _render(); };

  window.loadMaterialRecommendationsPanel = function() {
    _render();
  };
})();
