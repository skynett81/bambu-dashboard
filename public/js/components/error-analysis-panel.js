// Error Pattern AI — error pattern analysis, correlations, suggestions and printer health
(function() {
  'use strict';
  let _tab = 'overview';

  function _t(k, fb) { if (typeof t === 'function') { const v = t(k); if (v && v !== k) return v; } return fb || k; }
  function _esc(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function _fmtDate(iso) {
    if (!iso) return '';
    try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return iso; }
  }

  window.loadErrorAnalysisPanel = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    el.innerHTML = `<div class="tabs _wrapper-tabs">
      <button class="tab-btn active" data-tab="overview" onclick="window._switchEpaTab('overview')">${_t('error_analysis.tab_overview', 'Overview')}</button>
      <button class="tab-btn" data-tab="health" onclick="window._switchEpaTab('health')">${_t('error_analysis.tab_health', 'Printer health')}</button>
      <button class="tab-btn" data-tab="patterns" onclick="window._switchEpaTab('patterns')">${_t('error_analysis.tab_patterns', 'Error patterns')}</button>
      <button class="tab-btn" data-tab="correlations" onclick="window._switchEpaTab('correlations')">${_t('error_analysis.tab_correlations', 'Correlations')}</button>
    </div>
    <div id="epa-content"></div>`;

    _tab = 'overview';
    _switchContent('overview');
  };

  window._switchEpaTab = function(tab) {
    _tab = tab;
    document.querySelectorAll('._wrapper-tabs .tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    _switchContent(tab);
  };

  function _switchContent(tab) {
    const el = document.getElementById('epa-content');
    if (!el) return;
    el.innerHTML = '<div class="matrec-empty"><div class="matrec-spinner"></div></div>';

    if (tab === 'overview') _loadOverview(el);
    else if (tab === 'health') _loadHealth(el);
    else if (tab === 'patterns') _loadPatterns(el);
    else if (tab === 'correlations') _loadCorrelations(el);
  }

  // ── Overview: summary + suggestions + health cards ──
  async function _loadOverview(el) {
    try {
      const [scores, patterns, suggestions, corrs] = await Promise.all([
        fetch('/api/printer-health').then(r => r.ok ? r.json() : []),
        fetch('/api/error-patterns').then(r => r.ok ? r.json() : []),
        fetch('/api/error-patterns/suggestions').then(r => r.ok ? r.json() : []),
        fetch('/api/error-correlations').then(r => r.ok ? r.json() : [])
      ]);

      const hasData = scores.length || patterns.length || suggestions.length;

      if (!hasData) {
        el.innerHTML = _emptyState(
          '🔍',
          _t('error_analysis.no_data_title', 'No analysis data yet'),
          _t('error_analysis.no_data_desc', 'Run an analysis to discover error patterns, correlations and printer health based on your history.'),
          true
        );
        return;
      }

      // Summary stats
      const avgHealth = scores.length ? Math.round(scores.reduce((s, h) => s + (h.health_score || 0), 0) / scores.length) : null;
      const worstPrinter = scores.length ? scores.reduce((w, s) => (!w || s.health_score < w.health_score) ? s : w, null) : null;
      const criticalPatterns = patterns.filter(p => p.severity === 'fatal' || p.severity === 'error').length;
      const strongCorrs = corrs.filter(c => c.correlation_strength > 2).length;

      let h = '<div class="epa-layout"><div class="epa-col-left">';

      // Summary cards
      h += '<div class="card" style="padding:16px"><div class="card-title">' + _t('error_analysis.summary', 'Summary') + '</div>';
      h += '<div class="epa-summary-grid">';
      h += _summaryCard(scores.length, _t('error_analysis.printers', 'Printers'), 'var(--accent-blue)');
      h += _summaryCard(avgHealth !== null ? avgHealth + '%' : 'N/A', _t('error_analysis.avg_health', 'Avg health'), avgHealth >= 80 ? 'var(--accent-green)' : avgHealth >= 50 ? '#f59e0b' : 'var(--accent-red)');
      h += _summaryCard(patterns.length, _t('error_analysis.patterns_found', 'Patterns'), 'var(--accent-orange)');
      h += _summaryCard(criticalPatterns, _t('error_analysis.critical', 'Critical'), criticalPatterns > 0 ? 'var(--accent-red)' : 'var(--accent-green)');
      h += _summaryCard(strongCorrs, _t('error_analysis.strong_corr', 'Strong corr.'), 'var(--accent-purple)');
      h += _summaryCard(suggestions.length, _t('error_analysis.suggestions', 'Suggestions'), 'var(--accent-cyan)');
      h += '</div>';
      h += `<button class="form-btn form-btn-sm" style="margin-top:8px" onclick="window._epaRunAnalysis()">${_t('error_analysis.run_analysis', 'Run analysis')}</button>`;
      h += '</div>';

      // Worst printer highlight
      if (worstPrinter && worstPrinter.health_score < 80) {
        const color = worstPrinter.health_score >= 50 ? '#f59e0b' : 'var(--accent-red)';
        h += `<div class="card" style="padding:16px;border-left:3px solid ${color}">
          <div class="card-title">${_t('error_analysis.needs_attention', 'Needs attention')}</div>
          <div style="display:flex;align-items:center;gap:12px">
            ${_miniRing(worstPrinter.health_score, color, 56)}
            <div>
              <div style="font-weight:700;font-size:0.85rem">${_esc(worstPrinter.printer_id)}</div>
              <div style="font-size:0.72rem;color:var(--text-muted)">${_t('error_analysis.error_freq', 'Error frequency')}: ${worstPrinter.error_frequency ?? 0}/t · MTBF: ${worstPrinter.mtbf_hours != null ? worstPrinter.mtbf_hours + 't' : 'N/A'}</div>
            </div>
          </div>
        </div>`;
      }

      h += '</div><div class="epa-col-right">';

      // Suggestions
      h += '<div class="card" style="padding:16px"><div class="card-title">' + _t('error_analysis.suggestions', 'Suggestions') + '</div>';
      if (suggestions.length) {
        h += '<div class="epa-sugg-list">';
        for (const s of suggestions.slice(0, 8)) {
          const iconClass = 'epa-sugg-icon--' + (s.type || 'pattern');
          const icon = s.type === 'health' ? '⚠' : s.type === 'trend' ? '📉' : s.type === 'correlation' ? '🔗' : '🔧';
          const conf = Math.round((s.confidence || 0) * 100);
          const barColor = conf >= 70 ? 'var(--accent-green)' : conf >= 40 ? '#f59e0b' : 'var(--accent-red)';

          h += `<div class="epa-sugg-card">
            <div class="epa-sugg-icon ${iconClass}">${icon}</div>
            <div class="epa-sugg-body">
              <div class="epa-sugg-text">${_esc(s.suggestion)}</div>
              <div class="epa-sugg-meta">
                ${s.error_code ? `<span class="epa-corr-code">${_esc(s.error_code)}</span>` : ''}
                ${s.severity ? `<span class="epa-severity epa-sev-${s.severity}">${s.severity}</span>` : ''}
                <span class="epa-sugg-confidence">
                  ${conf}%
                  <span class="epa-sugg-bar"><span class="epa-sugg-bar-fill" style="width:${conf}%;background:${barColor}"></span></span>
                </span>
              </div>
            </div>
          </div>`;
        }
        h += '</div>';
      } else {
        h += `<div class="epa-empty"><div class="epa-empty-desc">${_t('error_analysis.no_suggestions', 'No suggestions right now — everything looks good!')}</div></div>`;
      }
      h += '</div>';

      h += '</div></div>';
      el.innerHTML = h;
    } catch (e) {
      el.innerHTML = _emptyState('❌', _t('error_analysis.load_error', 'Could not load data'), e.message, true);
    }
  }

  // ── Health tab ──
  async function _loadHealth(el) {
    try {
      const scores = await fetch('/api/printer-health').then(r => r.ok ? r.json() : []);
      if (!scores.length) {
        el.innerHTML = _emptyState('💚', _t('error_analysis.no_health_title', 'No health data'), _t('error_analysis.no_health_desc', 'Run an analysis to calculate health scores for your printers.'), true);
        return;
      }

      let html = `<div style="margin-bottom:14px"><button class="form-btn form-btn-sm" onclick="window._epaRunAnalysis()">${_t('error_analysis.run_analysis', 'Run analysis')}</button></div>`;
      html += '<div class="epa-health-grid">';

      for (const s of scores) {
        const score = s.health_score ?? 0;
        const color = score >= 80 ? 'var(--accent-green)' : score >= 50 ? '#f59e0b' : 'var(--accent-red)';
        const circumference = 2 * Math.PI * 32;
        const offset = circumference - (score / 100) * circumference;

        let riskFactors = [];
        try { riskFactors = typeof s.risk_factors === 'string' ? JSON.parse(s.risk_factors) : (s.risk_factors || []); } catch {}

        const trendClass = s.trend === 'improving' ? 'epa-trend-improving' : s.trend === 'worsening' ? 'epa-trend-worsening' : 'epa-trend-stable';
        const trendArrow = s.trend === 'improving' ? '↑' : s.trend === 'worsening' ? '↓' : '→';
        const trendLabel = _t('error_analysis.trend_' + (s.trend || 'stable'), s.trend || 'stable');

        html += `<div class="epa-health-card">
          <div class="epa-ring-wrap">
            <svg class="epa-ring" width="80" height="80" viewBox="0 0 72 72">
              <circle class="epa-ring-bg" cx="36" cy="36" r="32"/>
              <circle class="epa-ring-fill" cx="36" cy="36" r="32" stroke="${color}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
            </svg>
            <div class="epa-score-text">
              <div class="epa-score-num" style="color:${color}">${Math.round(score)}</div>
              <div class="epa-score-label">${_t('error_analysis.health_score', 'Health')}</div>
            </div>
          </div>
          <div class="epa-health-info">
            <div class="epa-health-name">${_esc(s.printer_id)}</div>
            <div class="epa-health-stats">
              <span class="epa-stat">MTBF: <span class="epa-stat-val">${s.mtbf_hours != null ? s.mtbf_hours + 't' : 'N/A'}</span></span>
              <span class="epa-stat">${_t('error_analysis.error_freq', 'Error frequency')}: <span class="epa-stat-val">${s.error_frequency ?? 0}/t</span></span>
            </div>
            <span class="epa-trend ${trendClass}">${trendArrow} ${trendLabel}</span>
            ${riskFactors.length ? `<div class="epa-risk">${_t('error_analysis.risk_factors', 'Risk factors')}: ${riskFactors.map(r => `<span class="epa-risk-code">${_esc(r.code)} (${r.count})</span>`).join('')}</div>` : ''}
          </div>
        </div>`;
      }

      html += '</div>';
      el.innerHTML = html;
    } catch (e) {
      el.innerHTML = _emptyState('❌', _t('error_analysis.load_error', 'Could not load data'), e.message, false);
    }
  }

  // ── Patterns tab ──
  async function _loadPatterns(el) {
    try {
      const patterns = await fetch('/api/error-patterns').then(r => r.ok ? r.json() : []);
      if (!patterns.length) {
        el.innerHTML = _emptyState('🧩', _t('error_analysis.no_patterns_title', 'No error patterns detected'), _t('error_analysis.no_patterns_desc', 'Error patterns are detected automatically when there are recurring errors in the log. Run an analysis to start.'), true);
        return;
      }

      let html = `<div style="margin-bottom:14px"><button class="form-btn form-btn-sm" onclick="window._epaRunAnalysis()">${_t('error_analysis.run_analysis', 'Run analysis')}</button></div>`;
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
            <span>${_t('error_analysis.frequency', 'Frequency')}: <b>${p.frequency || 0}</b></span>
            <span>${_t('error_analysis.confidence', 'Confidence')}: <b>${Math.round((p.confidence || 0) * 100)}%</b></span>
            ${p.first_seen ? `<span>${_t('error_analysis.first_seen', 'First seen')}: <b>${_fmtDate(p.first_seen)}</b></span>` : ''}
            ${p.last_seen ? `<span>${_t('error_analysis.last_seen', 'Last seen')}: <b>${_fmtDate(p.last_seen)}</b></span>` : ''}
          </div>
          <div class="epa-pattern-conditions">
            ${conditions.materials?.length ? `<div><span class="epa-cond-label">${_t('error_analysis.materials', 'Materials')}:</span> ${conditions.materials.join(', ')}</div>` : ''}
            ${conditions.temp_range ? `<div><span class="epa-cond-label">${_t('error_analysis.temp_range', 'Temperature')}:</span> ${conditions.temp_range.min}–${conditions.temp_range.max}°C (snitt ${conditions.temp_range.avg}°C)</div>` : ''}
            ${conditions.speed_levels?.length ? `<div><span class="epa-cond-label">${_t('error_analysis.speed_levels', 'Speed')}:</span> ${conditions.speed_levels.join(', ')}</div>` : ''}
            ${conditions.printers?.length ? `<div><span class="epa-cond-label">${_t('error_analysis.printers', 'Printers')}:</span> ${conditions.printers.join(', ')}</div>` : ''}
          </div>
          ${p.suggestion ? `<div class="epa-pattern-suggestion">${_esc(p.suggestion)}</div>` : ''}
        </div>`;
      }

      html += '</div>';
      el.innerHTML = html;
    } catch (e) {
      el.innerHTML = _emptyState('❌', _t('error_analysis.load_error', 'Could not load data'), e.message, false);
    }
  }

  // ── Correlations tab ──
  async function _loadCorrelations(el) {
    try {
      const corrs = await fetch('/api/error-correlations').then(r => r.ok ? r.json() : []);
      if (!corrs.length) {
        el.innerHTML = _emptyState('📊', _t('error_analysis.no_corr_title', 'No correlations found'), _t('error_analysis.no_corr_desc', 'Correlations show relationships between errors and factors such as material, speed and temperature.'), true);
        return;
      }

      const factors = [...new Set(corrs.map(c => c.factor))];
      let activeFactor = factors[0] || 'material';

      const factorLabels = {
        material: _t('error_analysis.factor_material', 'Material'),
        speed: _t('error_analysis.factor_speed', 'Speed'),
        printer: _t('error_analysis.factor_printer', 'Printer'),
        temperature: _t('error_analysis.factor_temperature', 'Temperature')
      };

      const render = (factor) => {
        const filtered = corrs.filter(c => c.factor === factor);

        let html = `<div style="margin-bottom:14px"><button class="form-btn form-btn-sm" onclick="window._epaRunAnalysis()">${_t('error_analysis.run_analysis', 'Run analysis')}</button></div>`;
        html += '<div class="epa-corr-filter">';
        for (const f of factors) {
          html += `<button class="epa-corr-filter-btn ${f === factor ? 'active' : ''}" onclick="window._epaFilterCorr('${f}')">${factorLabels[f] || f}</button>`;
        }
        html += '</div>';

        if (!filtered.length) {
          html += `<div class="epa-empty"><div class="epa-empty-desc">${_t('error_analysis.no_correlations', 'No correlations for this factor')}</div></div>`;
          el.innerHTML = html;
          return;
        }

        const sorted = [...filtered].sort((a, b) => b.correlation_strength - a.correlation_strength);

        html += '<div style="overflow-x:auto"><table class="epa-corr-table"><thead><tr>';
        html += `<th>${_t('error_analysis.error_code', 'Error code')}</th>`;
        html += `<th>${factorLabels[factor] || factor}</th>`;
        html += `<th>${_t('error_analysis.strength', 'Strength')}</th>`;
        html += `<th>${_t('error_analysis.sample_size', 'Sample size')}</th>`;
        html += '</tr></thead><tbody>';

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
      el.innerHTML = _emptyState('❌', _t('error_analysis.load_error', 'Could not load data'), e.message, false);
    }
  }

  // ── Run analysis ──
  window._epaRunAnalysis = async function() {
    try {
      if (typeof showToast === 'function') showToast(_t('error_analysis.analyzing', 'Analyzing...'), 'info', 2000);
      await fetch('/api/error-patterns/analyze', { method: 'POST' });
      if (typeof showToast === 'function') showToast(_t('error_analysis.analysis_complete', 'Analysis complete'), 'success', 3000);
      _switchContent(_tab);
    } catch (e) {
      if (typeof showToast === 'function') showToast(_t('error_analysis.analysis_failed', 'Analysis failed'), 'error', 3000);
    }
  };

  // ── Helpers ──
  function _summaryCard(value, label, color) {
    return `<div class="epa-summary-card">
      <div class="epa-summary-value" style="color:${color}">${value}</div>
      <div class="epa-summary-label">${label}</div>
    </div>`;
  }

  function _miniRing(score, color, size) {
    const r = (size - 10) / 2;
    const c = 2 * Math.PI * r;
    const off = c - (score / 100) * c;
    const cx = size / 2;
    return `<div style="position:relative;width:${size}px;height:${size}px;flex-shrink:0">
      <svg style="transform:rotate(-90deg)" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle fill="none" stroke="var(--bg-tertiary)" stroke-width="6" cx="${cx}" cy="${cx}" r="${r}"/>
        <circle fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round" cx="${cx}" cy="${cx}" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${off}"/>
      </svg>
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:${size > 50 ? '0.95' : '0.7'}rem;font-weight:900;color:${color}">${Math.round(score)}</div>
    </div>`;
  }

  function _emptyState(icon, title, desc, showAnalyzeBtn) {
    return `<div class="epa-empty">
      <div class="epa-empty-icon">${icon}</div>
      <div class="epa-empty-title">${title}</div>
      <div class="epa-empty-desc">${desc}</div>
      ${showAnalyzeBtn ? `<button class="form-btn form-btn-sm" onclick="window._epaRunAnalysis()">${_t('error_analysis.run_analysis', 'Run analysis')}</button>` : ''}
    </div>`;
  }
})();
