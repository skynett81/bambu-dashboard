// Statistics Panel
(function() {
  function formatDuration(seconds) {
    if (!seconds) return '--';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}${t('time.h')} ${m}${t('time.m')}` : `${m}${t('time.m')}`;
  }

  const TYPE_COLORS = {
    'PLA': '#00e676', 'PETG': '#f0883e', 'TPU': '#bc8cff',
    'ABS': '#f85149', 'ASA': '#58a6ff', 'PA': '#e3b341', 'PLA+': '#00c853',
    'PA-CF': '#d2a8ff', 'PET-CF': '#f778ba', 'PLA-CF': '#79c0ff'
  };

  const SPEED_NAMES_MAP = { 1: 'speed.silent', 2: 'speed.standard', 3: 'speed.sport', 4: 'speed.ludicrous' };
  const DAY_KEYS = ['stats.sun', 'stats.mon', 'stats.tue', 'stats.wed', 'stats.thu', 'stats.fri', 'stats.sat'];

  let _selectedStatsPrinter = null; // null = all

  window.loadStatsPanel = loadStatistics;
  window.changeStatsPrinter = function(value) {
    _selectedStatsPrinter = value || null;
    loadStatistics();
  };

  async function loadStatistics() {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;

    try {
      const printerId = _selectedStatsPrinter;
      const params = printerId ? `?printer_id=${printerId}` : '';
      const res = await fetch(`/api/statistics${params}`);
      const s = await res.json();

      let html = buildPrinterSelector('changeStatsPrinter', _selectedStatsPrinter);

      // Top stat cards
      html += `<div class="stat-grid">
        <div class="stat-card"><div class="stat-value">${s.total_prints}</div><div class="stat-label">${t('stats.total_prints')}</div></div>
        <div class="stat-card"><div class="stat-value" style="color:var(--accent-green)">${s.success_rate}%</div><div class="stat-label">${t('stats.success_rate')}</div></div>
        <div class="stat-card"><div class="stat-value">${s.total_hours}${t('time.h')}</div><div class="stat-label">${t('stats.total_time')}</div></div>
        <div class="stat-card"><div class="stat-value">${s.total_filament_g}g</div><div class="stat-label">${t('stats.filament_used')}</div></div>
      </div>`;

      // Second row
      html += `<div class="stat-grid mt-md">
        <div class="stat-card"><div class="stat-value" style="font-size:1.2rem;color:var(--accent-green)">${s.completed_prints}</div><div class="stat-label">${t('stats.completed')}</div></div>
        <div class="stat-card"><div class="stat-value" style="font-size:1.2rem;color:var(--accent-red)">${s.failed_prints}</div><div class="stat-label">${t('stats.failed')}</div></div>
        <div class="stat-card"><div class="stat-value" style="font-size:1.2rem;color:var(--accent-orange)">${s.cancelled_prints}</div><div class="stat-label">${t('stats.cancelled')}</div></div>
        <div class="stat-card"><div class="stat-value" style="font-size:1.2rem;color:var(--accent-blue)">${s.avg_print_minutes}${t('time.m')}</div><div class="stat-label">${t('stats.avg_duration')}</div></div>
      </div>`;

      // Total layers + cost
      html += `<div class="stat-grid mt-md" style="grid-template-columns:repeat(3,1fr)">`;
      html += `<div class="stat-card"><div class="stat-value" style="font-size:1.1rem;color:var(--accent-purple)">${(s.total_layers || 0).toLocaleString()}</div><div class="stat-label">${t('stats.total_layers')}</div></div>`;
      if (s.estimated_cost_nok > 0) {
        html += `<div class="stat-card"><div class="stat-value" style="font-size:1.1rem">${s.estimated_cost_nok} ${t('stats.currency')}</div><div class="stat-label">${t('stats.estimated_cost')}</div></div>`;
      }
      if (s.most_used_filament) {
        html += `<div class="stat-card"><div class="stat-value" style="font-size:1.1rem">${s.most_used_filament}</div><div class="stat-label">${t('stats.most_used_filament')}</div></div>`;
      }
      html += `</div>`;

      // Detail row
      html += `<div class="stat-detail-row mt-md">`;
      if (s.longest_print) {
        html += `<div class="stat-detail"><span class="stat-detail-label">${t('stats.longest_print')}</span><span class="stat-detail-value">${s.longest_print.filename} (${formatDuration(s.longest_print.duration_seconds)})</span></div>`;
      }
      html += `</div>`;

      // Temperature records
      if (s.temp_stats && (s.temp_stats.peak_nozzle > 0 || s.temp_stats.peak_bed > 0)) {
        html += `<div class="stat-grid mt-md" style="grid-template-columns:repeat(4,1fr)">
          <div class="stat-card"><div class="stat-value" style="font-size:1rem;color:var(--accent-orange)">${Math.round(s.temp_stats.peak_nozzle)}°C</div><div class="stat-label">${t('stats.peak_nozzle')}</div></div>
          <div class="stat-card"><div class="stat-value" style="font-size:1rem;color:var(--accent-orange)">${Math.round(s.temp_stats.avg_nozzle)}°C</div><div class="stat-label">${t('stats.avg_nozzle')}</div></div>
          <div class="stat-card"><div class="stat-value" style="font-size:1rem;color:var(--accent-blue)">${Math.round(s.temp_stats.peak_bed)}°C</div><div class="stat-label">${t('stats.peak_bed')}</div></div>
          <div class="stat-card"><div class="stat-value" style="font-size:1rem;color:var(--accent-blue)">${Math.round(s.temp_stats.avg_bed)}°C</div><div class="stat-label">${t('stats.avg_bed')}</div></div>
        </div>`;
      }

      // Success rate by filament type
      if (s.success_by_filament?.length > 0) {
        html += `<div class="mt-md"><div class="card-title">${t('stats.success_by_filament')}</div><div class="chart-bars">`;
        for (const f of s.success_by_filament) {
          const rateColor = f.rate >= 80 ? 'var(--accent-green)' : f.rate >= 50 ? 'var(--accent-orange)' : 'var(--accent-red)';
          html += `<div class="chart-bar-row"><span class="chart-bar-label">${f.type}</span><div class="chart-bar-track"><div class="chart-bar-fill" style="width:${f.rate}%;background:${rateColor}"></div></div><span class="chart-bar-value">${f.rate}% <span class="text-muted">(${f.completed}/${f.total})</span></span></div>`;
        }
        html += `</div></div>`;
      }

      // Success rate by speed level
      if (s.success_by_speed?.length > 0) {
        html += `<div class="mt-md"><div class="card-title">${t('stats.success_by_speed')}</div><div class="chart-bars">`;
        for (const sp of s.success_by_speed) {
          const name = t(SPEED_NAMES_MAP[sp.level] || 'speed.standard');
          const rateColor = sp.rate >= 80 ? 'var(--accent-green)' : sp.rate >= 50 ? 'var(--accent-orange)' : 'var(--accent-red)';
          html += `<div class="chart-bar-row"><span class="chart-bar-label">${name}</span><div class="chart-bar-track"><div class="chart-bar-fill" style="width:${sp.rate}%;background:${rateColor}"></div></div><span class="chart-bar-value">${sp.rate}% <span class="text-muted">(${sp.completed}/${sp.total})</span></span></div>`;
        }
        html += `</div></div>`;
      }

      // Filament by type (existing)
      if (s.filament_by_type?.length > 0) {
        const maxGrams = Math.max(...s.filament_by_type.map(f => f.grams));
        html += `<div class="mt-md"><div class="card-title">${t('stats.filament_by_type')}</div><div class="chart-bars">`;
        for (const f of s.filament_by_type) {
          const pct = maxGrams > 0 ? (f.grams / maxGrams) * 100 : 0;
          const color = TYPE_COLORS[f.type] || '#8b949e';
          html += `<div class="chart-bar-row"><span class="chart-bar-label">${f.type}</span><div class="chart-bar-track"><div class="chart-bar-fill" style="width:${pct}%;background:${color}"></div></div><span class="chart-bar-value">${Math.round(f.grams)}g <span class="text-muted">(${f.prints})</span></span></div>`;
        }
        html += `</div></div>`;
      }

      // Filament by brand
      if (s.filament_by_brand?.length > 0) {
        html += `<div class="mt-md"><div class="card-title">${t('stats.filament_by_brand')}</div>`;
        html += `<table class="data-table"><thead><tr><th>${t('filament.brand')}</th><th>${t('filament.type')}</th><th>${t('stats.filament_used')}</th><th>${t('stats.total_prints')}</th></tr></thead><tbody>`;
        for (const b of s.filament_by_brand.slice(0, 10)) {
          html += `<tr><td>${b.brand}</td><td>${b.type || '--'}</td><td>${Math.round(b.grams)}g</td><td>${b.prints}</td></tr>`;
        }
        html += `</tbody></table></div>`;
      }

      // Top files
      if (s.top_files?.length > 0) {
        html += `<div class="mt-md"><div class="card-title">${t('stats.top_files')}</div>`;
        html += `<table class="data-table"><thead><tr><th>#</th><th>${t('history.filename')}</th><th>${t('stats.total')}</th><th>${t('stats.success_rate')}</th></tr></thead><tbody>`;
        s.top_files.forEach((f, i) => {
          const rate = f.count > 0 ? Math.round((f.completed / f.count) * 100) : 0;
          html += `<tr><td>${i + 1}</td><td>${f.filename}</td><td>${f.count}</td><td>${rate}%</td></tr>`;
        });
        html += `</tbody></table></div>`;
      }

      // Prints per week (existing)
      if (s.prints_per_week?.length > 0) {
        const maxWeek = Math.max(...s.prints_per_week.map(w => w.total));
        html += `<div class="mt-md"><div class="card-title">${t('stats.prints_per_week')}</div><div class="week-chart">`;
        for (const w of s.prints_per_week) {
          const totalH = maxWeek > 0 ? (w.total / maxWeek) * 100 : 0;
          const completedH = maxWeek > 0 ? (w.completed / maxWeek) * 100 : 0;
          const label = w.week.split('-W')[1] ? `${t('stats.week')} ${w.week.split('-W')[1]}` : w.week;
          html += `<div class="week-bar-group"><div class="week-bar-stack" style="height:80px"><div class="week-bar-bg" style="height:${totalH}%"></div><div class="week-bar-fg" style="height:${completedH}%"></div></div><div class="week-bar-label">${label}</div><div class="week-bar-count">${w.total}</div></div>`;
        }
        html += `</div><div class="chart-legend mt-sm"><span class="legend-item"><span class="legend-dot" style="background:var(--accent-green)"></span> ${t('stats.completed')}</span><span class="legend-item"><span class="legend-dot" style="background:var(--bg-tertiary)"></span> ${t('stats.total')}</span></div></div>`;
      }

      // Monthly trends
      if (s.monthly_trends?.length > 0) {
        const maxMonth = Math.max(...s.monthly_trends.map(m => m.total));
        html += `<div class="mt-md"><div class="card-title">${t('stats.monthly_trends')}</div><div class="week-chart">`;
        for (const m of s.monthly_trends) {
          const totalH = maxMonth > 0 ? (m.total / maxMonth) * 100 : 0;
          const compH = maxMonth > 0 ? (m.completed / maxMonth) * 100 : 0;
          const label = m.month.split('-')[1];
          html += `<div class="week-bar-group" style="min-width:50px"><div class="week-bar-stack" style="height:80px"><div class="week-bar-bg" style="height:${totalH}%"></div><div class="week-bar-fg" style="height:${compH}%"></div></div><div class="week-bar-label">${label}</div><div class="week-bar-count">${m.total}</div></div>`;
        }
        html += `</div></div>`;
      }

      // Day of week heatmap
      if (s.prints_by_day_of_week?.length > 0) {
        const maxDow = Math.max(...s.prints_by_day_of_week.map(d => d.count));
        html += `<div class="mt-md"><div class="card-title">${t('stats.prints_by_day')}</div><div class="heatmap-row">`;
        for (let d = 0; d < 7; d++) {
          const entry = s.prints_by_day_of_week.find(x => x.dow === d);
          const count = entry?.count || 0;
          const intensity = maxDow > 0 ? count / maxDow : 0;
          const bg = `rgba(0, 230, 118, ${0.1 + intensity * 0.7})`;
          html += `<div class="heatmap-cell" style="background:${bg}"><span class="heatmap-day">${t(DAY_KEYS[d])}</span><span class="heatmap-count">${count}</span></div>`;
        }
        html += `</div></div>`;
      }

      // AMS statistics
      if (s.ams_filament_by_brand?.length > 0 || s.ams_avg_humidity?.length > 0) {
        html += `<div class="mt-md"><div class="card-title">${t('stats.ams_stats')}</div>`;
        if (s.ams_avg_humidity?.length > 0) {
          html += `<div class="stat-detail-row">`;
          for (const h of s.ams_avg_humidity) {
            html += `<div class="stat-detail"><span class="stat-detail-label">AMS${parseInt(h.ams_unit) + 1} ${t('stats.ams_humidity_avg')}</span><span class="stat-detail-value">${h.avg_humidity}%</span></div>`;
          }
          html += `</div>`;
        }
        if (s.ams_filament_by_brand?.length > 0) {
          html += `<table class="data-table mt-sm"><thead><tr><th>${t('filament.brand')}</th><th>${t('filament.type')}</th><th>${t('stats.total_prints')}</th></tr></thead><tbody>`;
          for (const b of s.ams_filament_by_brand) {
            html += `<tr><td>${b.brand}</td><td>${b.type || '--'}</td><td>${b.snapshots}</td></tr>`;
          }
          html += `</tbody></table>`;
        }
        html += `</div>`;
      }

      // XCam AI Detection stats
      try {
        const xcamRes = await fetch(`/api/xcam/stats${params}`);
        const xcam = await xcamRes.json();
        if (xcam && (xcam.spaghetti_detected || xcam.first_layer_issue || xcam.foreign_object || xcam.nozzle_clump)) {
          html += `<div class="mt-md"><div class="card-title">${t('stats.xcam_title')}</div>`;
          html += `<div class="xcam-grid">
            <div class="xcam-card"><div class="xcam-count">${xcam.spaghetti_detected || 0}</div><div class="xcam-label">${t('stats.xcam_spaghetti')}</div></div>
            <div class="xcam-card"><div class="xcam-count">${xcam.first_layer_issue || 0}</div><div class="xcam-label">${t('stats.xcam_first_layer')}</div></div>
            <div class="xcam-card"><div class="xcam-count">${xcam.foreign_object || 0}</div><div class="xcam-label">${t('stats.xcam_foreign')}</div></div>
            <div class="xcam-card"><div class="xcam-count">${xcam.nozzle_clump || 0}</div><div class="xcam-label">${t('stats.xcam_clump')}</div></div>
          </div></div>`;
        }
      } catch (_) { /* xcam stats optional */ }

      // CSV export
      html += `<div class="mt-md"><button class="form-btn" onclick="exportCsv()">${t('stats.download_csv')}</button></div>`;

      panel.innerHTML = html;
    } catch (e) {
      panel.innerHTML = `<p class="text-muted">${t('stats.load_failed')}</p>`;
    }
  }

  window.exportCsv = function() {
    const pid = _selectedStatsPrinter;
    window.open(`/api/history/export${pid ? '?printer_id=' + pid : ''}`);
  };

})();
