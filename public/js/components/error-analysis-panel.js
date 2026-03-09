// Error Pattern AI — error pattern analysis, correlations, and printer health
(function() {
  let _tab = 'health';

  window.loadErrorAnalysisPanel = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    el.innerHTML = `<style>
      .epa-tabs { display:flex; gap:4px; margin-bottom:18px; }
      .epa-tab { padding:8px 16px; border-radius:8px; background:var(--bg-secondary); border:1px solid var(--border-color); color:var(--text-muted); cursor:pointer; font-size:0.78rem; font-weight:600; transition:all 0.2s; }
      .epa-tab:hover { background:var(--bg-tertiary); }
      .epa-tab.active { background:var(--accent-blue); color:#fff; border-color:var(--accent-blue); }
      .epa-container { max-width:1100px; }
      .epa-toolbar { display:flex; gap:8px; margin-bottom:14px; align-items:center; }
      .epa-btn { padding:6px 14px; border-radius:6px; background:var(--accent-blue); color:#fff; border:none; cursor:pointer; font-size:0.75rem; font-weight:600; }
      .epa-btn:hover { opacity:0.85; }
      .epa-empty { text-align:center; padding:40px; color:var(--text-muted); font-size:0.85rem; }

      /* Health cards */
      .epa-health-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:14px; }
      .epa-health-card { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); padding:18px; display:flex; gap:16px; align-items:center; }
      .epa-ring-wrap { position:relative; width:90px; height:90px; flex-shrink:0; }
      .epa-ring { transform:rotate(-90deg); }
      .epa-ring-bg { fill:none; stroke:var(--bg-tertiary); stroke-width:8; }
      .epa-ring-fill { fill:none; stroke-width:8; stroke-linecap:round; transition:stroke-dashoffset 1s ease; }
      .epa-score-text { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center; }
      .epa-score-num { font-size:1.4rem; font-weight:900; line-height:1; }
      .epa-score-label { font-size:0.6rem; color:var(--text-muted); font-weight:600; }
      .epa-health-info { flex:1; }
      .epa-health-name { font-size:0.9rem; font-weight:700; margin-bottom:4px; }
      .epa-health-stats { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:6px; }
      .epa-stat { font-size:0.7rem; color:var(--text-muted); }
      .epa-stat-val { font-weight:700; color:var(--text-primary); }
      .epa-trend { display:inline-flex; align-items:center; gap:3px; font-size:0.7rem; font-weight:600; padding:2px 8px; border-radius:10px; }
      .epa-trend-improving { background:rgba(0,174,66,0.1); color:var(--accent-green); }
      .epa-trend-worsening { background:rgba(229,57,53,0.1); color:var(--accent-red); }
      .epa-trend-stable { background:rgba(100,100,100,0.1); color:var(--text-muted); }
      .epa-risk { font-size:0.65rem; color:var(--text-muted); margin-top:4px; }
      .epa-risk-code { display:inline-block; background:var(--bg-tertiary); padding:1px 6px; border-radius:4px; margin:1px 2px; font-family:monospace; }

      /* Pattern cards */
      .epa-pattern-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(340px, 1fr)); gap:14px; }
      .epa-pattern-card { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); padding:16px; }
      .epa-pattern-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
      .epa-pattern-name { font-size:0.85rem; font-weight:700; }
      .epa-severity { padding:2px 8px; border-radius:10px; font-size:0.65rem; font-weight:700; text-transform:uppercase; }
      .epa-sev-fatal { background:rgba(229,57,53,0.15); color:#e53935; }
      .epa-sev-error { background:rgba(255,87,34,0.15); color:#ff5722; }
      .epa-sev-warning { background:rgba(245,158,11,0.15); color:#f59e0b; }
      .epa-sev-info { background:rgba(18,121,255,0.1); color:var(--accent-blue); }
      .epa-pattern-desc { font-size:0.75rem; color:var(--text-muted); margin-bottom:8px; }
      .epa-pattern-meta { display:flex; gap:12px; font-size:0.7rem; color:var(--text-muted); margin-bottom:8px; }
      .epa-pattern-meta b { color:var(--text-primary); }
      .epa-pattern-conditions { font-size:0.7rem; margin-bottom:8px; }
      .epa-cond-label { font-weight:600; color:var(--text-muted); }
      .epa-pattern-suggestion { font-size:0.72rem; padding:8px; background:rgba(18,121,255,0.04); border-radius:var(--radius); border-left:3px solid var(--accent-blue); color:var(--text-secondary); }

      /* Correlation heatmap */
      .epa-corr-table { width:100%; border-collapse:collapse; font-size:0.72rem; }
      .epa-corr-table th { padding:8px 10px; text-align:left; font-weight:600; color:var(--text-muted); border-bottom:1px solid var(--border-color); background:var(--bg-secondary); position:sticky; top:0; }
      .epa-corr-table td { padding:6px 10px; border-bottom:1px solid var(--border-color); }
      .epa-corr-cell { display:inline-block; padding:2px 8px; border-radius:4px; font-weight:600; min-width:40px; text-align:center; }
      .epa-corr-strong { background:rgba(229,57,53,0.2); color:#e53935; }
      .epa-corr-moderate { background:rgba(245,158,11,0.15); color:#f59e0b; }
      .epa-corr-weak { background:rgba(100,100,100,0.1); color:var(--text-muted); }
      .epa-corr-code { font-family:monospace; font-weight:600; }
      .epa-corr-filter { display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap; }
      .epa-corr-filter-btn { padding:4px 10px; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-secondary); cursor:pointer; font-size:0.7rem; font-weight:600; color:var(--text-muted); }
      .epa-corr-filter-btn.active { background:var(--accent-blue); color:#fff; border-color:var(--accent-blue); }

      @media (max-width:600px) {
        .epa-health-card { flex-direction:column; text-align:center; }
        .epa-tabs { flex-wrap:wrap; }
      }
    </style>
    <div class="epa-container">
      <div class="epa-tabs">
        <button class="epa-tab active" data-tab="health" onclick="window._switchEpaTab('health')">${t('error_analysis.tab_health')}</button>
        <button class="epa-tab" data-tab="patterns" onclick="window._switchEpaTab('patterns')">${t('error_analysis.tab_patterns')}</button>
        <button class="epa-tab" data-tab="correlations" onclick="window._switchEpaTab('correlations')">${t('error_analysis.tab_correlations')}</button>
      </div>
      <div id="epa-content"></div>
    </div>`;

    _switchTab('health');
  };

  window._switchEpaTab = function(tab) {
    _tab = tab;
    document.querySelectorAll('.epa-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    _switchTab(tab);
  };

  function _switchTab(tab) {
    const el = document.getElementById('epa-content');
    if (!el) return;
    el.innerHTML = `<div class="epa-empty">${t('error_analysis.loading')}</div>`;

    if (tab === 'health') _loadHealth(el);
    else if (tab === 'patterns') _loadPatterns(el);
    else if (tab === 'correlations') _loadCorrelations(el);
  }

  async function _loadHealth(el) {
    try {
      const scores = await fetch('/api/printer-health').then(r => r.ok ? r.json() : []);
      if (!scores.length) {
        el.innerHTML = `<div class="epa-toolbar"><button class="epa-btn" onclick="window._epaRunAnalysis()">${t('error_analysis.run_analysis')}</button></div><div class="epa-empty">${t('error_analysis.no_health_data')}</div>`;
        return;
      }

      let html = `<div class="epa-toolbar"><button class="epa-btn" onclick="window._epaRunAnalysis()">${t('error_analysis.run_analysis')}</button></div>`;
      html += '<div class="epa-health-grid">';

      for (const s of scores) {
        const score = s.health_score ?? 0;
        const color = score >= 80 ? 'var(--accent-green)' : score >= 50 ? '#f59e0b' : 'var(--accent-red)';
        const circumference = 2 * Math.PI * 36;
        const offset = circumference - (score / 100) * circumference;

        let riskFactors = [];
        try { riskFactors = typeof s.risk_factors === 'string' ? JSON.parse(s.risk_factors) : (s.risk_factors || []); } catch {}

        const trendClass = s.trend === 'improving' ? 'epa-trend-improving' : s.trend === 'worsening' ? 'epa-trend-worsening' : 'epa-trend-stable';
        const trendArrow = s.trend === 'improving' ? '\u2191' : s.trend === 'worsening' ? '\u2193' : '\u2192';
        const trendLabel = t('error_analysis.trend_' + (s.trend || 'stable'));

        html += `<div class="epa-health-card">
          <div class="epa-ring-wrap">
            <svg class="epa-ring" width="90" height="90" viewBox="0 0 80 80">
              <circle class="epa-ring-bg" cx="40" cy="40" r="36"/>
              <circle class="epa-ring-fill" cx="40" cy="40" r="36" stroke="${color}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
            </svg>
            <div class="epa-score-text">
              <div class="epa-score-num" style="color:${color}">${Math.round(score)}</div>
              <div class="epa-score-label">${t('error_analysis.health_score')}</div>
            </div>
          </div>
          <div class="epa-health-info">
            <div class="epa-health-name">${_esc(s.printer_id)}</div>
            <div class="epa-health-stats">
              <span class="epa-stat">${t('error_analysis.mtbf')}: <span class="epa-stat-val">${s.mtbf_hours != null ? s.mtbf_hours + 'h' : 'N/A'}</span></span>
              <span class="epa-stat">${t('error_analysis.error_freq')}: <span class="epa-stat-val">${s.error_frequency ?? 0}/h</span></span>
            </div>
            <span class="epa-trend ${trendClass}">${trendArrow} ${trendLabel}</span>
            ${riskFactors.length ? `<div class="epa-risk">${t('error_analysis.risk_factors')}: ${riskFactors.map(r => `<span class="epa-risk-code">${_esc(r.code)} (${r.count})</span>`).join('')}</div>` : ''}
          </div>
        </div>`;
      }

      html += '</div>';
      el.innerHTML = html;
    } catch (e) {
      el.innerHTML = `<div class="epa-empty">${t('error_analysis.load_error')}</div>`;
    }
  }

  async function _loadPatterns(el) {
    try {
      const patterns = await fetch('/api/error-patterns').then(r => r.ok ? r.json() : []);
      if (!patterns.length) {
        el.innerHTML = `<div class="epa-toolbar"><button class="epa-btn" onclick="window._epaRunAnalysis()">${t('error_analysis.run_analysis')}</button></div><div class="epa-empty">${t('error_analysis.no_patterns')}</div>`;
        return;
      }

      let html = `<div class="epa-toolbar"><button class="epa-btn" onclick="window._epaRunAnalysis()">${t('error_analysis.run_analysis')}</button></div>`;
      html += '<div class="epa-pattern-grid">';

      for (const p of patterns) {
        const sevClass = 'epa-sev-' + (p.severity || 'info');
        let conditions = {};
        try { conditions = typeof p.conditions === 'string' ? JSON.parse(p.conditions) : (p.conditions || {}); } catch {}

        html += `<div class="epa-pattern-card">
          <div class="epa-pattern-header">
            <span class="epa-pattern-name">${_esc(p.pattern_name || 'Unknown')}</span>
            <span class="epa-severity ${sevClass}">${_esc(p.severity || 'info')}</span>
          </div>
          <div class="epa-pattern-desc">${_esc(p.description || '')}</div>
          <div class="epa-pattern-meta">
            <span>${t('error_analysis.frequency')}: <b>${p.frequency || 0}</b></span>
            <span>${t('error_analysis.confidence')}: <b>${Math.round((p.confidence || 0) * 100)}%</b></span>
            ${p.first_seen ? `<span>${t('error_analysis.first_seen')}: <b>${_fmtDate(p.first_seen)}</b></span>` : ''}
          </div>
          <div class="epa-pattern-conditions">
            ${conditions.materials?.length ? `<div><span class="epa-cond-label">${t('error_analysis.materials')}:</span> ${conditions.materials.join(', ')}</div>` : ''}
            ${conditions.temp_range ? `<div><span class="epa-cond-label">${t('error_analysis.temp_range')}:</span> ${conditions.temp_range.min}-${conditions.temp_range.max}\u00B0C (avg ${conditions.temp_range.avg}\u00B0C)</div>` : ''}
            ${conditions.speed_levels?.length ? `<div><span class="epa-cond-label">${t('error_analysis.speed_levels')}:</span> ${conditions.speed_levels.join(', ')}</div>` : ''}
          </div>
          ${p.suggestion ? `<div class="epa-pattern-suggestion">${_esc(p.suggestion)}</div>` : ''}
        </div>`;
      }

      html += '</div>';
      el.innerHTML = html;
    } catch (e) {
      el.innerHTML = `<div class="epa-empty">${t('error_analysis.load_error')}</div>`;
    }
  }

  async function _loadCorrelations(el) {
    try {
      const corrs = await fetch('/api/error-correlations').then(r => r.ok ? r.json() : []);
      if (!corrs.length) {
        el.innerHTML = `<div class="epa-toolbar"><button class="epa-btn" onclick="window._epaRunAnalysis()">${t('error_analysis.run_analysis')}</button></div><div class="epa-empty">${t('error_analysis.no_correlations')}</div>`;
        return;
      }

      // Group by factor type
      const factors = [...new Set(corrs.map(c => c.factor))];
      let activeFactor = factors[0] || 'material';

      const render = (factor) => {
        const filtered = corrs.filter(c => c.factor === factor);
        const codes = [...new Set(filtered.map(c => c.error_code))];

        let html = `<div class="epa-toolbar"><button class="epa-btn" onclick="window._epaRunAnalysis()">${t('error_analysis.run_analysis')}</button></div>`;
        html += '<div class="epa-corr-filter">';
        for (const f of factors) {
          html += `<button class="epa-corr-filter-btn ${f === factor ? 'active' : ''}" onclick="window._epaFilterCorr('${f}')">${t('error_analysis.factor_' + f)}</button>`;
        }
        html += '</div>';

        if (!filtered.length) {
          html += `<div class="epa-empty">${t('error_analysis.no_correlations')}</div>`;
          el.innerHTML = html;
          return;
        }

        html += '<div style="overflow-x:auto"><table class="epa-corr-table"><thead><tr>';
        html += `<th>${t('error_analysis.error_code')}</th><th>${t('error_analysis.factor_value')}</th><th>${t('error_analysis.strength')}</th><th>${t('error_analysis.sample_size')}</th>`;
        html += '</tr></thead><tbody>';

        const sorted = [...filtered].sort((a, b) => b.correlation_strength - a.correlation_strength);
        for (const c of sorted) {
          const str = c.correlation_strength;
          const cellClass = str > 2 ? 'epa-corr-strong' : str > 1 ? 'epa-corr-moderate' : 'epa-corr-weak';
          html += `<tr>
            <td><span class="epa-corr-code">${_esc(c.error_code)}</span></td>
            <td>${_esc(c.factor_value || 'N/A')}</td>
            <td><span class="epa-corr-cell ${cellClass}">${str.toFixed(2)}x</span></td>
            <td>${c.sample_size || 0}</td>
          </tr>`;
        }

        html += '</tbody></table></div>';
        el.innerHTML = html;
      };

      window._epaFilterCorr = (factor) => { activeFactor = factor; render(factor); };
      render(activeFactor);
    } catch (e) {
      el.innerHTML = `<div class="epa-empty">${t('error_analysis.load_error')}</div>`;
    }
  }

  window._epaRunAnalysis = async function() {
    try {
      if (typeof showToast === 'function') showToast(t('error_analysis.analyzing'), 'info', 2000);
      await fetch('/api/error-patterns/analyze', { method: 'POST' });
      if (typeof showToast === 'function') showToast(t('error_analysis.analysis_complete'), 'success', 3000);
      _switchTab(_tab);
    } catch (e) {
      if (typeof showToast === 'function') showToast(t('error_analysis.analysis_failed'), 'error', 3000);
    }
  };

  function _esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function _fmtDate(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return iso; }
  }
})();
