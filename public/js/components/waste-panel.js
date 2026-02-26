// Poop Counter - Filament waste tracker
(function() {
  window.loadWastePanel = loadWaste;

  function printerName(id) {
    return window.printerState?._printerMeta?.[id]?.name || id || '--';
  }

  function formatDate(iso) {
    if (!iso) return '--';
    const d = new Date(iso);
    const locale = (window.i18n?.getLocale() || 'nb').replace('_', '-');
    return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function formatWeight(g) {
    if (g >= 1000) return `${(g / 1000).toFixed(2)} kg`;
    return `${Math.round(g)}g`;
  }

  async function loadWaste() {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;

    try {
      const res = await fetch('/api/waste/stats');
      const s = await res.json();

      let html = '';

      // Top stats cards
      html += `<div class="stat-grid" style="grid-template-columns:repeat(3,1fr)">
        <div class="stat-card">
          <div class="stat-value">${s.total_color_changes}</div>
          <div class="stat-label">${t('waste.total_count')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--accent-orange)">${formatWeight(s.total_waste_g)}</div>
          <div class="stat-label">${t('waste.total_weight')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--accent-red)">${s.total_cost} kr</div>
          <div class="stat-label">${t('waste.total_cost')}</div>
        </div>
      </div>`;

      // Detail row
      html += `<div class="stat-detail-row mt-md">
        <div class="stat-detail">
          <span class="stat-detail-label">${t('waste.avg_per_print')}</span>
          <span class="stat-detail-value">${s.avg_per_print}g</span>
        </div>
        <div class="stat-detail">
          <span class="stat-detail-label">${t('waste.color_changes')}</span>
          <span class="stat-detail-value">${s.total_color_changes}</span>
        </div>
      </div>`;

      // Waste per week chart
      if (s.waste_per_week?.length > 0) {
        const maxWeek = Math.max(...s.waste_per_week.map(w => w.total));
        html += `<div class="mt-md"><div class="card-title">${t('waste.per_week')}</div><div class="week-chart">`;
        for (const w of s.waste_per_week) {
          const h = maxWeek > 0 ? (w.total / maxWeek) * 100 : 0;
          const label = w.week.split('-W')[1] ? `${t('stats.week')} ${w.week.split('-W')[1]}` : w.week;
          html += `<div class="week-bar-group">
            <div class="week-bar-stack" style="height:80px">
              <div class="week-bar-fg" style="height:${h}%;background:var(--accent-orange)"></div>
            </div>
            <div class="week-bar-label">${label}</div>
            <div class="week-bar-count">${Math.round(w.total)}g</div>
          </div>`;
        }
        html += `</div></div>`;
      }

      // Recent events
      html += `<div class="mt-md"><div class="card-title">${t('waste.recent')}</div>`;
      if (s.recent?.length > 0) {
        html += `<table class="data-table"><thead><tr>
          <th>${t('common.printer')}</th>
          <th>${t('history.date')}</th>
          <th>${t('waste.notes')}</th>
          <th>${t('waste.color_changes')}</th>
          <th>${t('waste.total_weight')}</th>
          <th>${t('history.status')}</th>
        </tr></thead><tbody>`;
        for (const r of s.recent) {
          const pillClass = r.reason === 'auto' ? 'pill pill-completed' : 'pill pill-cancelled';
          const label = r.reason === 'auto' ? t('waste.auto') : t('waste.manual');
          html += `<tr>
            <td><span class="printer-tag">${printerName(r.printer_id)}</span></td>
            <td>${formatDate(r.timestamp)}</td>
            <td>${r.notes || '--'}</td>
            <td>${r.color_changes || '--'}</td>
            <td>${r.waste_g}g</td>
            <td><span class="${pillClass}">${label}</span></td>
          </tr>`;
        }
        html += `</tbody></table>`;
      } else {
        html += `<p class="text-muted">${t('waste.no_data')}</p>`;
      }
      html += `</div>`;

      // Manual add form
      html += `<div class="mt-md">
        <button class="form-btn" onclick="toggleWasteForm()">${t('waste.add_manual')}</button>
        <div id="waste-form-area" style="display:none" class="settings-form mt-md">
          <div class="flex gap-sm" style="flex-wrap:wrap;align-items:flex-end">
            <div class="form-group" style="width:100px;margin-bottom:0">
              <label class="form-label">${t('waste.weight_g')}</label>
              <input class="form-input" id="waste-g-input" type="number" placeholder="5" min="1" step="1">
            </div>
            <div class="form-group" style="flex:1;min-width:150px;margin-bottom:0">
              <label class="form-label">${t('waste.notes')}</label>
              <input class="form-input" id="waste-notes-input" placeholder="${t('waste.notes_placeholder')}">
            </div>
            <button class="form-btn" onclick="submitWaste()">${t('waste.save')}</button>
          </div>
        </div>
      </div>`;

      // Settings: waste per color change
      const savedWaste = localStorage.getItem('wastePerChange') || '5';
      html += `<div class="settings-section mt-md">
        <div class="card-title">${t('waste.settings')}</div>
        <div class="flex items-center gap-sm">
          <span class="text-muted" style="font-size:0.85rem">${t('waste.per_change')}</span>
          <input class="form-input" style="width:60px;text-align:center" id="waste-per-change" type="number" value="${savedWaste}" min="1" max="20" step="1" onchange="saveWastePerChange(this.value)">
          <span class="text-muted" style="font-size:0.85rem">g</span>
        </div>
      </div>`;

      panel.innerHTML = html;
    } catch (e) {
      panel.innerHTML = `<p class="text-muted">${t('waste.load_failed')}</p>`;
    }
  }

  window.toggleWasteForm = function() {
    const area = document.getElementById('waste-form-area');
    if (area) area.style.display = area.style.display === 'none' ? '' : 'none';
  };

  window.submitWaste = async function() {
    const wasteG = parseFloat(document.getElementById('waste-g-input')?.value);
    const notes = document.getElementById('waste-notes-input')?.value?.trim();
    if (!wasteG || wasteG <= 0) return;

    const printerId = window.printerState.getActivePrinterId();
    await fetch('/api/waste', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ printer_id: printerId, waste_g: wasteG, notes })
    });

    loadWaste();
  };

  window.saveWastePerChange = function(val) {
    localStorage.setItem('wastePerChange', val);
  };
})();
