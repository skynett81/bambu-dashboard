// Printer Comparison Matrix — side-by-side printer stats comparison
(function() {
  function _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

  function _fmtHours(sec) {
    if (!sec) return '0h';
    const h = Math.floor(sec / 3600);
    return h > 0 ? `${h}h` : '<1h';
  }

  function _fmtAvgTime(sec) {
    if (!sec) return '--';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  function _fmtKg(g) {
    if (!g) return '0 kg';
    return (g / 1000).toFixed(2) + ' kg';
  }

  const SPEED_LABELS = { 1: 'Silent', 2: 'Standard', 3: 'Sport', 4: 'Ludicrous' };

  window.loadPrinterMatrixPanel = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    const state = window.printerState;
    const ids = state?.getPrinterIds() || [];

    if (ids.length < 1) {
      el.innerHTML = `<style>
        .matrix-empty { text-align:center; padding:60px 20px; color:var(--text-muted); }
        .matrix-empty h3 { margin:0 0 8px; color:var(--text-primary); font-size:1rem; }
        .matrix-empty p { margin:0; font-size:0.85rem; }
      </style>
      <div class="matrix-empty">
        <h3>${t('matrix.no_printers')}</h3>
        <p>${t('matrix.need_two')}</p>
      </div>`;
      return;
    }

    el.innerHTML = `<style>
      .matrix-container { width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; }
      .matrix-title { font-size:1rem; font-weight:700; color:var(--text-primary); margin:0 0 16px; }
      .matrix-loading { text-align:center; padding:40px; color:var(--text-muted); font-size:0.85rem; }
      .matrix-table { width:100%; border-collapse:collapse; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); overflow:hidden; min-width:${Math.max(ids.length * 160 + 180, 400)}px; }
      .matrix-table th { background:var(--bg-tertiary, var(--bg-secondary)); padding:10px 14px; font-size:0.75rem; font-weight:700; text-align:center; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.02em; border-bottom:2px solid var(--border-color); }
      .matrix-table th:first-child { text-align:left; width:180px; }
      .matrix-table td { padding:10px 14px; font-size:0.82rem; text-align:center; border-top:1px solid var(--border-color); color:var(--text-primary); }
      .matrix-table td:first-child { text-align:left; color:var(--text-muted); font-weight:600; }
      .matrix-table tr:hover { background:var(--bg-tertiary, rgba(255,255,255,0.02)); }
      .matrix-best { color:var(--accent-green); font-weight:700; }
      .matrix-worst { color:var(--accent-red); font-weight:700; }
      .matrix-printer-name { max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:inline-block; }
    </style>
    <div class="matrix-container">
      <h3 class="matrix-title">${t('matrix.title')}</h3>
      <div id="matrix-content" class="matrix-loading">${t('matrix.loading')}</div>
    </div>`;

    _loadMatrix(ids);
  };

  async function _loadMatrix(ids) {
    const content = document.getElementById('matrix-content');
    if (!content) return;

    const state = window.printerState;
    const printerData = [];

    try {
      const fetches = ids.map(async (id) => {
        const [statsRes, histRes] = await Promise.all([
          fetch(`/api/statistics?printer_id=${encodeURIComponent(id)}`).catch(() => null),
          fetch(`/api/history?printer_id=${encodeURIComponent(id)}&limit=100`).catch(() => null)
        ]);

        let stats = null;
        let history = [];
        try { stats = statsRes ? await statsRes.json() : null; } catch (_) { stats = null; }
        try { history = histRes ? await histRes.json() : []; } catch (_) { history = []; }
        if (!Array.isArray(history)) history = [];

        const meta = state._printerMeta?.[id] || {};
        const name = meta.name || id;

        // Compute metrics
        const totalPrints = stats?.total_prints || 0;
        const successRate = stats?.success_rate ?? 0;
        const totalHoursSec = (stats?.total_hours || 0) * 3600;
        const totalFilamentG = stats?.total_filament_g || 0;
        const failureRate = totalPrints > 0 ? Math.round((1 - successRate / 100) * 100) : 0;

        // Avg print time from history
        let avgTimeSec = 0;
        const validTimes = history.filter(h => h.duration_seconds > 0);
        if (validTimes.length > 0) {
          avgTimeSec = Math.round(validTimes.reduce((a, h) => a + h.duration_seconds, 0) / validTimes.length);
        }

        // Most used material from history
        const matCount = {};
        for (const h of history) {
          const mat = [...new Set((h.filament_type || 'Unknown').split(';').filter(Boolean))].join(' + ') || 'Unknown';
          matCount[mat] = (matCount[mat] || 0) + 1;
        }
        let topMaterial = '--';
        let topMatCount = 0;
        for (const [mat, count] of Object.entries(matCount)) {
          if (count > topMatCount) { topMaterial = mat; topMatCount = count; }
        }

        // Average speed level from history
        let avgSpeed = 0;
        const validSpeeds = history.filter(h => h.speed_level > 0);
        if (validSpeeds.length > 0) {
          avgSpeed = Math.round(validSpeeds.reduce((a, h) => a + h.speed_level, 0) / validSpeeds.length);
        }

        return {
          id, name, totalPrints, successRate, totalHoursSec,
          avgTimeSec, totalFilamentG, topMaterial, failureRate, avgSpeed
        };
      });

      const results = await Promise.all(fetches);
      for (const r of results) {
        if (r) printerData.push(r);
      }
    } catch (_) {
      content.innerHTML = `<div class="matrix-loading" style="color:var(--accent-red)">Failed to load data</div>`;
      return;
    }

    if (printerData.length < 1) {
      content.innerHTML = `<div class="matrix-loading">${t('matrix.need_two')}</div>`;
      return;
    }

    _renderTable(content, printerData);
  }

  function _renderTable(container, printers) {
    // Define metric rows: [label, extractor, format, higherIsBetter]
    const metrics = [
      { label: t('matrix.total_prints'),  get: p => p.totalPrints,    fmt: v => v.toString(),         higher: true },
      { label: t('matrix.success_rate'),   get: p => p.successRate,    fmt: v => v + '%',              higher: true },
      { label: t('matrix.print_hours'),    get: p => p.totalHoursSec,  fmt: v => _fmtHours(v),         higher: true },
      { label: t('matrix.avg_time'),       get: p => p.avgTimeSec,     fmt: v => _fmtAvgTime(v),       higher: false },
      { label: t('matrix.filament_used'),  get: p => p.totalFilamentG, fmt: v => _fmtKg(v),            higher: true },
      { label: t('matrix.top_material'),   get: p => p.topMaterial,    fmt: v => _esc(v),              higher: null },
      { label: t('matrix.failure_rate'),   get: p => p.failureRate,    fmt: v => v + '%',              higher: false },
      { label: t('matrix.avg_speed'),      get: p => p.avgSpeed,       fmt: v => SPEED_LABELS[v] || (v > 0 ? v.toString() : '--'), higher: true }
    ];

    // Header row
    let html = '<table class="matrix-table"><thead><tr><th></th>';
    for (const p of printers) {
      html += `<th><span class="matrix-printer-name" title="${_esc(p.name)}">${_esc(p.name)}</span></th>`;
    }
    html += '</tr></thead><tbody>';

    // Metric rows
    for (const m of metrics) {
      const values = printers.map(p => m.get(p));
      let bestIdx = -1, worstIdx = -1;

      if (m.higher !== null) {
        const numericVals = values.map((v, i) => ({ v: typeof v === 'number' ? v : 0, i }));
        // Only highlight if there's actual variance
        const unique = new Set(numericVals.map(n => n.v));
        if (unique.size > 1) {
          if (m.higher) {
            bestIdx = numericVals.reduce((a, b) => b.v > a.v ? b : a, numericVals[0]).i;
            worstIdx = numericVals.reduce((a, b) => b.v < a.v ? b : a, numericVals[0]).i;
          } else {
            bestIdx = numericVals.reduce((a, b) => b.v < a.v ? b : a, numericVals[0]).i;
            worstIdx = numericVals.reduce((a, b) => b.v > a.v ? b : a, numericVals[0]).i;
          }
        }
      }

      html += `<tr><td>${m.label}</td>`;
      for (let i = 0; i < printers.length; i++) {
        let cls = '';
        if (i === bestIdx) cls = 'matrix-best';
        else if (i === worstIdx) cls = 'matrix-worst';
        html += `<td class="${cls}">${m.fmt(values[i])}</td>`;
      }
      html += '</tr>';
    }

    html += '</tbody></table>';
    container.innerHTML = html;
  }
})();
