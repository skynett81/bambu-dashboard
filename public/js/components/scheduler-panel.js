// Print Scheduler — calendar view for scheduling prints
(function() {
  let _currentDate = new Date();
  let _events = [];
  let _view = 'month'; // month | week
  let _printers = [];
  let _cloudTasks = null;

  async function _loadCloudTasks() {
    if (_cloudTasks !== null) return;
    try {
      const res = await fetch('/api/bambu-cloud/tasks');
      if (!res.ok) { _cloudTasks = []; return; }
      const data = await res.json();
      _cloudTasks = data.tasks || data || [];
    } catch { _cloudTasks = []; }
  }

  function _getCloudMatch(filename) {
    if (!_cloudTasks || !filename) return null;
    const fn = filename.toLowerCase().trim();
    return _cloudTasks.find(t2 => {
      const tt = (t2.title || '').toLowerCase().trim();
      const dt = (t2.designTitle || '').toLowerCase().trim();
      return tt === fn || dt === fn || fn.includes(tt) || fn.includes(dt) || tt.includes(fn) || dt.includes(fn);
    }) || null;
  }

  function _panelSwitcher() {
    return '<div class="tabs" style="margin-bottom:12px">' +
      '<button class="tab-btn" onclick="openPanel(\'queue\')">' + (t('queue.title') || 'Utskriftskø') + '</button>' +
      '<button class="tab-btn active" onclick="openPanel(\'scheduler\')">' + (t('tabs.scheduler') || 'Planlegger') + '</button>' +
      '</div>';
  }

  window.loadSchedulerPanel = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;
    _loadCloudTasks();

    el.innerHTML = _panelSwitcher() + `<style>
      .sched-toolbar { display:flex; align-items:center; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
      .sched-nav { display:flex; align-items:center; gap:6px; }
      .sched-nav-btn { background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); padding:6px 12px; cursor:pointer; color:var(--text-primary); font-size:0.8rem; font-weight:600; transition:background 0.15s; }
      .sched-nav-btn:hover { background:var(--bg-tertiary); }
      .sched-month-label { font-size:1.1rem; font-weight:700; min-width:180px; text-align:center; }
      .sched-view-toggle { display:flex; margin-left:auto; background:var(--bg-secondary); border-radius:var(--radius); overflow:hidden; border:1px solid var(--border-color); }
      .sched-view-btn { padding:6px 14px; cursor:pointer; font-size:0.75rem; font-weight:600; border:none; background:transparent; color:var(--text-muted); transition:all 0.15s; }
      .sched-view-btn.active { background:var(--accent-blue); color:#fff; }
      .sched-add-btn { background:var(--accent-blue); color:#fff; border:none; border-radius:var(--radius); padding:6px 14px; cursor:pointer; font-size:0.8rem; font-weight:600; transition:opacity 0.15s; }
      .sched-add-btn:hover { opacity:0.85; }
      .sched-grid { display:grid; grid-template-columns:repeat(7, 1fr); border:1px solid var(--border-color); border-radius:var(--radius); overflow:hidden; }
      .sched-day-header { background:var(--bg-tertiary); padding:8px 4px; text-align:center; font-size:0.7rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; border-bottom:1px solid var(--border-color); }
      .sched-cell { min-height:90px; padding:4px; border-right:1px solid var(--border-color); border-bottom:1px solid var(--border-color); background:var(--bg-primary); position:relative; cursor:pointer; transition:background 0.1s; }
      .sched-cell:nth-child(7n) { border-right:none; }
      .sched-cell:hover { background:var(--bg-secondary); }
      .sched-cell.other-month { opacity:0.35; }
      .sched-cell.today { background:rgba(18,121,255,0.06); }
      .sched-day-num { font-size:0.75rem; font-weight:600; color:var(--text-secondary); margin-bottom:2px; }
      .sched-cell.today .sched-day-num { color:var(--accent-blue); font-weight:800; }
      .sched-event { font-size:0.65rem; padding:2px 5px; border-radius:4px; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; cursor:pointer; color:#fff; font-weight:600; }
      .sched-event:hover { filter:brightness(1.15); }
      .sched-more { font-size:0.6rem; color:var(--text-muted); padding:1px 4px; }
      .sched-week-grid { display:grid; grid-template-columns:60px repeat(7, 1fr); }
      .sched-week-time { font-size:0.65rem; color:var(--text-muted); text-align:right; padding:4px 6px 4px 0; border-right:1px solid var(--border-color); height:40px; }
      .sched-week-cell { border-right:1px solid var(--border-color); border-bottom:1px solid rgba(0,0,0,0.04); min-height:40px; position:relative; padding:1px 2px; }
      .sched-week-cell:last-child { border-right:none; }
      .sched-week-header { font-size:0.7rem; font-weight:700; text-align:center; padding:8px 4px; color:var(--text-muted); border-bottom:1px solid var(--border-color); border-right:1px solid var(--border-color); }
      .sched-week-header.today { color:var(--accent-blue); }
      .sched-dialog-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:999; display:flex; align-items:center; justify-content:center; }
      .sched-dialog { background:var(--bg-primary); border-radius:var(--radius-lg, 12px); padding:24px; width:min(440px, 90vw); max-height:85vh; overflow-y:auto; box-shadow:var(--shadow-lg); }
      .sched-dialog h3 { margin:0 0 16px; font-size:1rem; }
      .sched-field { margin-bottom:12px; }
      .sched-field label { display:block; font-size:0.75rem; font-weight:600; color:var(--text-muted); margin-bottom:4px; }
      .sched-field input, .sched-field select, .sched-field textarea { width:100%; padding:8px 10px; background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius); color:var(--text-primary); font-size:0.85rem; box-sizing:border-box; }
      .sched-field textarea { resize:vertical; min-height:60px; }
      .sched-colors { display:flex; gap:6px; flex-wrap:wrap; }
      .sched-color { width:24px; height:24px; border-radius:50%; cursor:pointer; border:2px solid transparent; transition:border-color 0.15s; }
      .sched-color.active { border-color:var(--text-primary); }
      .sched-dialog-actions { display:flex; gap:8px; justify-content:flex-end; margin-top:16px; }
      .sched-dialog-actions button { padding:8px 18px; border-radius:var(--radius); font-size:0.8rem; font-weight:600; cursor:pointer; border:none; }
      .sched-btn-cancel { background:var(--bg-secondary); color:var(--text-primary); border:1px solid var(--border-color) !important; }
      .sched-btn-save { background:var(--accent-blue); color:#fff; }
      .sched-btn-delete { background:var(--accent-red); color:#fff; }
      .sched-legend { display:flex; gap:12px; margin-top:12px; flex-wrap:wrap; }
      .sched-legend-item { display:flex; align-items:center; gap:4px; font-size:0.7rem; color:var(--text-muted); }
      .sched-legend-dot { width:10px; height:10px; border-radius:3px; }
      @media (max-width:700px) { .sched-cell { min-height:60px; } .sched-month-label { min-width:120px; font-size:0.9rem; } }
    </style>
    <div class="sched-toolbar">
      <div class="sched-nav">
        <button class="sched-nav-btn" onclick="_schedPrev()">&larr;</button>
        <button class="sched-nav-btn" onclick="_schedToday()">${t('scheduler.today')}</button>
        <button class="sched-nav-btn" onclick="_schedNext()">&rarr;</button>
      </div>
      <div class="sched-month-label" id="sched-month-label"></div>
      <button class="sched-add-btn" onclick="_schedShowAdd()">+ ${t('scheduler.add_event')}</button>
      <div class="sched-view-toggle">
        <button class="sched-view-btn ${_view === 'month' ? 'active' : ''}" onclick="_schedSetView('month')">${t('scheduler.month')}</button>
        <button class="sched-view-btn ${_view === 'week' ? 'active' : ''}" onclick="_schedSetView('week')">${t('scheduler.week')}</button>
      </div>
    </div>
    <div id="sched-calendar"></div>
    <div class="sched-legend">
      <div class="sched-legend-item"><div class="sched-legend-dot" style="background:#1279ff"></div> ${t('scheduler.pending')}</div>
      <div class="sched-legend-item"><div class="sched-legend-dot" style="background:#00ae42"></div> ${t('scheduler.completed')}</div>
      <div class="sched-legend-item"><div class="sched-legend-dot" style="background:#f59e0b"></div> ${t('scheduler.in_progress')}</div>
      <div class="sched-legend-item"><div class="sched-legend-dot" style="background:#e53935"></div> ${t('scheduler.failed')}</div>
    </div>`;

    _loadPrinters();
    _loadEvents();
  };

  async function _loadPrinters() {
    try {
      const r = await fetch('/api/printers');
      _printers = await r.json();
    } catch { _printers = []; }
  }

  async function _loadEvents() {
    const y = _currentDate.getFullYear();
    const m = _currentDate.getMonth();
    // Load 6 weeks range
    const from = new Date(y, m - 1, 1).toISOString();
    const to = new Date(y, m + 2, 0).toISOString();

    // Fetch scheduled events, print history, and queue items in parallel
    const [schedRes, histRes, queueRes] = await Promise.allSettled([
      fetch(`/api/scheduler?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`).then(r => r.json()),
      fetch(`/api/history?limit=500`).then(r => r.json()),
      fetch('/api/queue').then(r => r.json())
    ]);

    const scheduled = schedRes.status === 'fulfilled' && Array.isArray(schedRes.value) ? schedRes.value : [];
    const history = histRes.status === 'fulfilled' && Array.isArray(histRes.value) ? histRes.value : [];
    const queues = queueRes.status === 'fulfilled' && Array.isArray(queueRes.value) ? queueRes.value : [];

    // Convert print history to calendar events
    const fromDate = new Date(y, m - 1, 1);
    const toDate = new Date(y, m + 2, 0);
    const historyEvents = history
      .filter(h => {
        if (!h.started_at) return false;
        const d = new Date(h.started_at);
        return d >= fromDate && d <= toDate;
      })
      .map(h => {
        const cloud = _getCloudMatch(h.filename);
        return {
        id: 'h_' + h.id,
        _historyId: h.id,
        _cloud: cloud,
        title: h.model_name || cloud?.designTitle || _trimFilename(h.filename || t('scheduler.untitled')),
        scheduled_at: h.started_at,
        finished_at: h.finished_at,
        status: h.status === 'completed' ? 'completed' : h.status === 'failed' ? 'failed' : 'running',
        color: h.status === 'completed' ? '#00ae42' : h.status === 'failed' ? '#e53935' : '#f59e0b',
        duration_seconds: h.duration_seconds,
        filament_type: h.filament_type,
        filament_color: h.filament_color,
        filament_used_g: h.filament_used_g,
        filament_brand: h.filament_brand,
        layer_count: h.layer_count,
        notes: h.notes,
        printer_id: h.printer_id,
        review_status: h.review_status,
        review_notes: h.review_notes,
        review_waste_g: h.review_waste_g,
        waste_g: h.waste_g,
        _fromHistory: true
      };});

    // Add currently running prints from printer state
    const runningEvents = [];
    const now = new Date().toISOString();
    const printerIds = window.printerState?.getPrinterIds() || [];
    for (const pid of printerIds) {
      const ps = window.printerState._printers[pid] || {};
      const printData = ps.print || ps;
      const gcodeState = (printData.gcode_state || '').toUpperCase();
      if (gcodeState === 'RUNNING' || gcodeState === 'PAUSE') {
        const meta = window.printerState._printerMeta[pid] || {};
        const filename = printData.gcode_file || printData.subtask_name || '';
        runningEvents.push({
          id: 'run_' + pid,
          title: _trimFilename(filename) || (meta.name || pid),
          scheduled_at: now,
          status: gcodeState === 'PAUSE' ? 'paused' : 'running',
          color: gcodeState === 'PAUSE' ? '#f59e0b' : '#1279ff',
          printer_id: pid,
          _fromLive: true,
          _progress: parseInt(printData.mc_percent) || 0
        });
      }
    }

    // Add pending queue items on today's date
    const pendingEvents = [];
    for (const q of queues) {
      if (q.printing_count > 0) {
        pendingEvents.push({
          id: 'q_printing_' + q.id,
          title: q.name + ' (' + t('scheduler.in_progress') + ')',
          scheduled_at: now,
          status: 'running',
          color: '#f59e0b',
          _fromQueue: true
        });
      }
      if (q.item_count - q.completed_count - q.printing_count > 0) {
        const remaining = q.item_count - q.completed_count - q.printing_count;
        pendingEvents.push({
          id: 'q_pending_' + q.id,
          title: q.name + ' — ' + remaining + ' ' + (t('scheduler.pending') || 'ventende'),
          scheduled_at: now,
          status: 'pending',
          color: '#1279ff',
          _fromQueue: true
        });
      }
    }

    _events = [...scheduled, ...runningEvents, ...pendingEvents, ...historyEvents];
    _render();
  }

  function _trimFilename(name) {
    // Strip common suffixes and keep it short
    return (name || '').replace(/\.(3mf|gcode|gcode\.3mf)$/i, '').substring(0, 40);
  }

  function _render() {
    const label = document.getElementById('sched-month-label');
    const cal = document.getElementById('sched-calendar');
    if (!label || !cal) return;

    const monthNames = [
      t('scheduler.jan'), t('scheduler.feb'), t('scheduler.mar'), t('scheduler.apr'),
      t('scheduler.may'), t('scheduler.jun'), t('scheduler.jul'), t('scheduler.aug'),
      t('scheduler.sep'), t('scheduler.oct'), t('scheduler.nov'), t('scheduler.dec')
    ];
    label.textContent = `${monthNames[_currentDate.getMonth()]} ${_currentDate.getFullYear()}`;

    if (_view === 'month') _renderMonth(cal);
    else _renderWeek(cal);
  }

  function _renderMonth(cal) {
    const y = _currentDate.getFullYear();
    const m = _currentDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const startOffset = (firstDay + 6) % 7; // Monday start
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    const dayNames = [t('scheduler.mon'), t('scheduler.tue'), t('scheduler.wed'), t('scheduler.thu'), t('scheduler.fri'), t('scheduler.sat'), t('scheduler.sun')];
    let html = '<div class="sched-grid">';
    for (const d of dayNames) html += `<div class="sched-day-header">${d}</div>`;

    // Previous month days
    const prevDays = new Date(y, m, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const day = prevDays - i;
      const dateStr = _dateStr(y, m - 1, day);
      html += `<div class="sched-cell other-month" onclick="_schedShowAdd('${dateStr}')"><div class="sched-day-num">${day}</div></div>`;
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = _dateStr(y, m, d);
      const isToday = dateStr === todayStr;
      const dayEvents = _eventsForDate(dateStr);
      const hasEvents = dayEvents.length > 0;
      html += `<div class="sched-cell${isToday ? ' today' : ''}" onclick="_schedDayClick('${dateStr}')">`;
      html += `<div class="sched-day-num">${d}${hasEvents ? ' <span style=\\"font-weight:400;font-size:0.6rem;color:var(--text-muted)\\">(' + dayEvents.length + ')</span>' : ''}</div>`;
      const maxShow = 3;
      for (let i = 0; i < Math.min(dayEvents.length, maxShow); i++) {
        const ev = dayEvents[i];
        const bg = _eventColor(ev);
        html += `<div class="sched-event" style="background:${bg};padding:3px 6px" onclick="event.stopPropagation();_schedEdit('${ev.id}')" title="${_esc(ev.title)}">${_esc(ev.title)}</div>`;
      }
      if (dayEvents.length > maxShow) {
        html += `<div class="sched-more" style="cursor:pointer">+${dayEvents.length - maxShow} ${t('scheduler.more')}</div>`;
      }
      html += '</div>';
    }

    // Fill remaining cells
    const totalCells = startOffset + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const dateStr = _dateStr(y, m + 1, i);
      html += `<div class="sched-cell other-month" onclick="_schedShowAdd('${dateStr}')"><div class="sched-day-num">${i}</div></div>`;
    }

    html += '</div>';
    cal.innerHTML = html;
  }

  function _renderWeek(cal) {
    const y = _currentDate.getFullYear();
    const m = _currentDate.getMonth();
    const d = _currentDate.getDate();
    const dow = (_currentDate.getDay() + 6) % 7; // Monday=0
    const weekStart = new Date(y, m, d - dow);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const dayNames = [t('scheduler.mon'), t('scheduler.tue'), t('scheduler.wed'), t('scheduler.thu'), t('scheduler.fri'), t('scheduler.sat'), t('scheduler.sun')];

    let html = '<div class="sched-week-grid">';
    html += '<div class="sched-week-header"></div>';
    for (let i = 0; i < 7; i++) {
      const dt = new Date(weekStart);
      dt.setDate(dt.getDate() + i);
      const dateStr = _dateStr(dt.getFullYear(), dt.getMonth(), dt.getDate());
      const isToday = dateStr === todayStr;
      html += `<div class="sched-week-header${isToday ? ' today' : ''}">${dayNames[i]} ${dt.getDate()}</div>`;
    }

    // 24 hour rows
    for (let h = 0; h < 24; h++) {
      html += `<div class="sched-week-time">${String(h).padStart(2, '0')}:00</div>`;
      for (let i = 0; i < 7; i++) {
        const dt = new Date(weekStart);
        dt.setDate(dt.getDate() + i);
        const dateStr = _dateStr(dt.getFullYear(), dt.getMonth(), dt.getDate());
        const hourEvents = _eventsForDateHour(dateStr, h);
        html += `<div class="sched-week-cell" onclick="_schedShowAdd('${dateStr}', ${h})">`;
        for (const ev of hourEvents) {
          const bg = _eventColor(ev);
          html += `<div class="sched-event" style="background:${bg}" onclick="event.stopPropagation();_schedEdit('${ev.id}')" title="${_esc(ev.title)}">${_esc(ev.title)}</div>`;
        }
        html += '</div>';
      }
    }
    html += '</div>';
    cal.innerHTML = html;
  }

  // Convert ISO/UTC date to local YYYY-MM-DD string
  function _toLocalDateStr(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function _eventsForDate(dateStr) {
    return _events.filter(e => e.scheduled_at && _toLocalDateStr(e.scheduled_at) === dateStr);
  }

  function _eventsForDateHour(dateStr, hour) {
    return _events.filter(e => {
      if (!e.scheduled_at || _toLocalDateStr(e.scheduled_at) !== dateStr) return false;
      const h = new Date(e.scheduled_at).getHours();
      return h === hour;
    });
  }

  function _eventColor(ev) {
    if (ev.status === 'completed') return '#00ae42';
    if (ev.status === 'running') return '#f59e0b';
    if (ev.status === 'failed') return '#e53935';
    return ev.color || '#1279ff';
  }

  function _dateStr(y, m, d) {
    const dt = new Date(y, m, d);
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
  }

  // Navigation
  window._schedPrev = function() {
    if (_view === 'month') _currentDate.setMonth(_currentDate.getMonth() - 1);
    else _currentDate.setDate(_currentDate.getDate() - 7);
    _loadEvents();
  };
  window._schedNext = function() {
    if (_view === 'month') _currentDate.setMonth(_currentDate.getMonth() + 1);
    else _currentDate.setDate(_currentDate.getDate() + 7);
    _loadEvents();
  };
  window._schedToday = function() {
    _currentDate = new Date();
    _loadEvents();
  };
  window._schedSetView = function(v) {
    _view = v;
    _render();
    document.querySelectorAll('.sched-view-btn').forEach(b => b.classList.toggle('active', b.textContent.trim().toLowerCase() === v));
  };

  // Day click — show day detail if events exist, else add new
  window._schedDayClick = function(dateStr) {
    const dayEvents = _eventsForDate(dateStr);
    if (dayEvents.length === 0) {
      _schedShowAdd(dateStr);
      return;
    }
    // Show day detail dialog
    const locale = (window.i18n?.getLocale() || 'nb').replace('_', '-');
    const dateLabel = new Date(dateStr + 'T12:00:00').toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const statusLabels = {
      completed: t('scheduler.completed') || 'Fullfort',
      failed: t('scheduler.failed') || 'Feilet',
      running: t('scheduler.in_progress') || 'Pagar',
      paused: t('scheduler.paused') || 'Pauset',
      pending: t('scheduler.pending') || 'Ventende'
    };

    let listHtml = dayEvents.map(ev => {
      const color = _eventColor(ev);
      const statusText = statusLabels[ev.status] || ev.status || '';
      const startStr = ev.scheduled_at ? new Date(ev.scheduled_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : '';
      const endStr = ev.finished_at ? new Date(ev.finished_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : '';
      const timeStr = startStr && endStr ? `${startStr} → ${endStr}` : startStr;
      const printerLabel = ev.printer_id ? (window.printerState?._printerMeta?.[ev.printer_id]?.name || ev.printer_id) : '';
      const progress = ev._progress != null ? ` (${ev._progress}%)` : '';
      const thumbSrc = ev._historyId ? `/api/history/${ev._historyId}/thumbnail` : '';
      const filamentInfo = ev.filament_used_g ? `<span>${Math.round(ev.filament_used_g)}g</span>` : '';
      const colorSwatch = ev.filament_color ? `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#${ev.filament_color.substring(0,6)};border:1px solid var(--border-subtle)"></span>` : '';
      return `<div style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:var(--radius-sm);cursor:pointer;transition:background 0.1s;border:1px solid var(--border-subtle);margin-bottom:6px" onclick="_schedEdit('${ev.id}')" onmouseenter="this.style.background='var(--bg-tertiary)'" onmouseleave="this.style.background=''">
        ${thumbSrc ? `<img src="${thumbSrc}" alt="" style="width:48px;height:48px;object-fit:contain;border-radius:4px;background:var(--bg-tertiary);flex-shrink:0" onerror="this.style.display='none'">` : `<span style="width:12px;height:12px;border-radius:50%;background:${color};flex-shrink:0"></span>`}
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:0.85rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${_esc(ev.title)}</div>
          <div style="font-size:0.7rem;color:var(--text-muted);display:flex;gap:8px;align-items:center;margin-top:2px;flex-wrap:wrap">
            <span style="color:${color}">${statusText}${progress}</span>
            ${timeStr ? '<span>' + timeStr + '</span>' : ''}
            ${printerLabel ? '<span>' + _esc(printerLabel) + '</span>' : ''}
            ${ev.duration_seconds ? '<span>' + _fmtDuration(ev.duration_seconds) + '</span>' : ''}
            ${colorSwatch}
            ${filamentInfo}
            ${ev.review_status === 'approved' ? '<span style="color:var(--accent-green)" title="Godkjent">&#10003;</span>' : ev.review_status === 'rejected' ? '<span style="color:var(--accent-red)" title="Avvist">&#10007;</span>' : ev.review_status === 'partial' ? '<span style="color:var(--accent-orange)" title="Delvis">&#9680;</span>' : (ev._fromHistory && !ev._fromLive ? '<span style="color:var(--text-muted);opacity:0.5" title="Ikke vurdert">?</span>' : '')}
          </div>
        </div>
      </div>`;
    }).join('');

    const overlay = document.createElement('div');
    overlay.className = 'sched-dialog-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="sched-dialog">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3 style="margin:0">${dateLabel}</h3>
        <span style="font-size:0.8rem;color:var(--text-muted)">${dayEvents.length} ${dayEvents.length === 1 ? 'hendelse' : 'hendelser'}</span>
      </div>
      ${listHtml}
      <div class="sched-dialog-actions" style="margin-top:12px">
        <button class="form-btn form-btn-sm" onclick="this.closest('.sched-dialog-overlay').remove();_schedShowAdd('${dateStr}')">+ ${t('scheduler.add_event') || 'Ny hendelse'}</button>
        <div style="flex:1"></div>
        <button class="form-btn form-btn-secondary form-btn-sm" onclick="this.closest('.sched-dialog-overlay').remove()">${t('scheduler.close') || 'Lukk'}</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
  };

  // Add/Edit dialog
  window._schedShowAdd = function(dateStr, hour) {
    const dt = dateStr || new Date().toISOString().slice(0, 10);
    const time = hour != null ? `${String(hour).padStart(2, '0')}:00` : '09:00';
    _showDialog(null, { scheduled_at: `${dt}T${time}`, color: '#1279ff' });
  };

  window._schedEdit = function(id) {
    const ev = _events.find(e => String(e.id) === String(id));
    if (!ev) return;
    if (ev._fromHistory || ev._fromLive || ev._fromQueue) {
      _showHistoryDetail(ev);
    } else {
      _showDialog(ev);
    }
  };

  function _showHistoryDetail(ev) {
    const overlay = document.createElement('div');
    overlay.className = 'sched-dialog-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    const statusMap = {
      completed: { label: t('scheduler.completed') || 'Fullfort', color: '#00ae42' },
      failed: { label: t('scheduler.failed') || 'Feilet', color: '#e53935' },
      running: { label: t('scheduler.in_progress') || 'Pagar', color: '#f59e0b' },
      paused: { label: t('scheduler.paused') || 'Pauset', color: '#f59e0b' },
      pending: { label: t('scheduler.pending') || 'Ventende', color: '#1279ff' }
    };
    const st = statusMap[ev.status] || { label: ev.status, color: 'var(--text-muted)' };
    const dur = ev.duration_seconds ? _fmtDuration(ev.duration_seconds) : null;
    const locale = (window.i18n?.getLocale() || 'nb').replace('_', '-');
    const startTime = ev.scheduled_at ? new Date(ev.scheduled_at).toLocaleString(locale) : '--';
    const endTime = ev.finished_at ? new Date(ev.finished_at).toLocaleString(locale) : null;
    const printerLabel = ev.printer_id ? (window.printerState?._printerMeta?.[ev.printer_id]?.name || ev.printer_id) : null;

    // Thumbnail for history events + 3D preview button
    let thumbHtml = '';
    if (ev._historyId) {
      const safeTitle = _esc(ev.title || ev.filename || '').replace(/'/g, "\\'");
      thumbHtml = `<div style="float:right;margin:0 0 12px 12px;text-align:center"><img src="/api/history/${ev._historyId}/thumbnail" alt="" style="width:100px;height:100px;object-fit:contain;border-radius:var(--radius-sm);background:var(--bg-tertiary)" onerror="this.style.display='none'">${typeof open3DPreview === 'function' ? `<br><button class="lib-3d-btn" style="margin-top:4px;font-size:0.65rem" onclick="event.stopPropagation();open3DPreview('/api/preview-3d?source=history&id=${ev._historyId}','${safeTitle}')">&#x25B6; 3D</button>` : ''}</div>`;
    }

    let fields = '';
    fields += `<div class="sched-field"><label>${t('history.status') || 'Status'}</label><div style="color:${st.color};font-weight:600">${st.label}${ev._progress != null ? ' — ' + ev._progress + '%' : ''}</div></div>`;
    if (ev._fromLive && ev._progress != null) {
      fields += `<div class="sched-field"><label>${t('scheduler.progress') || 'Fremdrift'}</label><div style="margin-top:4px"><div style="background:var(--bg-tertiary);border-radius:4px;height:8px;overflow:hidden"><div style="background:${st.color};height:100%;width:${ev._progress}%;transition:width 0.3s"></div></div></div></div>`;
    }
    if (printerLabel) fields += `<div class="sched-field"><label>${t('scheduler.printer') || 'Printer'}</label><div>${_esc(printerLabel)}</div></div>`;
    fields += `<div class="sched-field"><label>${t('scheduler.started') || 'Startet'}</label><div>${startTime}</div></div>`;
    if (endTime) fields += `<div class="sched-field"><label>${t('scheduler.finished') || 'Ferdig'}</label><div>${endTime}</div></div>`;
    if (dur) fields += `<div class="sched-field"><label>${t('scheduler.duration') || 'Varighet'}</label><div>${dur}</div></div>`;

    // Filament info with color swatch
    if (ev.filament_type || ev.filament_brand || ev.filament_used_g) {
      let filInfo = '';
      if (ev.filament_color) {
        const hex = '#' + ev.filament_color.substring(0, 6);
        filInfo += `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${hex};border:1px solid var(--border-subtle);vertical-align:middle;margin-right:4px"></span>`;
      }
      if (ev.filament_brand) filInfo += _esc(ev.filament_brand);
      else if (ev.filament_type) filInfo += _esc(ev.filament_type);
      if (ev.filament_used_g) filInfo += ` — ${ev.filament_used_g}g`;
      fields += `<div class="sched-field"><label>${t('history.filament') || 'Filament'}</label><div>${filInfo}</div></div>`;
    }
    if (ev.layer_count) fields += `<div class="sched-field"><label>${t('history.layers') || 'Lag'}</label><div>${ev.layer_count}</div></div>`;
    if (ev.notes) fields += `<div class="sched-field"><label>${t('scheduler.notes') || 'Notater'}</label><div style="font-size:0.8rem;color:var(--text-muted)">${_esc(ev.notes)}</div></div>`;

    // MakerWorld model link
    let modelHtml = '';
    if (ev._cloud?.designId) {
      modelHtml = `<div class="sched-field"><label>Modellkilde</label><div><a href="https://makerworld.com/en/models/${ev._cloud.designId}" target="_blank" rel="noopener" class="ph-model-link"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:4px"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>Åpne på MakerWorld</a></div></div>`;
    }

    // Review section for history events
    let reviewHtml = '';
    if (ev._fromHistory && ev._historyId) {
      const rs = ev.review_status;
      const reviewBadge = rs === 'approved' ? '<span style="color:var(--accent-green);font-weight:600">&#10003; Godkjent</span>'
        : rs === 'rejected' ? '<span style="color:var(--accent-red);font-weight:600">&#10007; Avvist</span>'
        : rs === 'partial' ? '<span style="color:var(--accent-orange);font-weight:600">&#9680; Delvis</span>'
        : '<span style="color:var(--text-muted)">Ikke vurdert</span>';

      if (rs) {
        // Already reviewed — show status
        reviewHtml = `<div class="sched-field" style="border-top:1px solid var(--border-color);padding-top:12px;margin-top:8px">
          <label>Kvalitetsvurdering</label>
          <div>${reviewBadge}</div>
          ${ev.review_notes ? `<div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px">${_esc(ev.review_notes)}</div>` : ''}
          ${ev.review_waste_g ? `<div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px">Waste: ${ev.review_waste_g}g</div>` : ''}
          <button class="form-btn form-btn-sm" style="margin-top:8px" onclick="_schedReview(${ev._historyId}, this)">${typeof t === 'function' ? t('scheduler.change_review') : 'Endre vurdering'}</button>
        </div>`;
      } else {
        // Not reviewed — show review form
        reviewHtml = `<div class="sched-field" id="sched-review-${ev._historyId}" style="border-top:1px solid var(--border-color);padding-top:12px;margin-top:8px">
          <label>Kvalitetsvurdering</label>
          <div style="display:flex;gap:6px;margin-bottom:8px">
            <button class="form-btn form-btn-sm" style="background:var(--accent-green);color:#fff" onclick="_schedSubmitReview(${ev._historyId},'approved',this)">&#10003; Godkjenn</button>
            <button class="form-btn form-btn-sm" style="background:var(--accent-red);color:#fff" onclick="_schedShowRejectForm(${ev._historyId},${ev.filament_used_g || 0})">&#10007; Avvis</button>
            <button class="form-btn form-btn-sm" style="background:var(--accent-orange);color:#fff" onclick="_schedShowRejectForm(${ev._historyId},0)">&#9680; Delvis</button>
          </div>
          <div id="sched-reject-form-${ev._historyId}" style="display:none">
            <div class="sched-field"><label>Waste (gram)</label><input type="number" id="sched-waste-${ev._historyId}" min="0" step="0.1" placeholder="0"></div>
            <div class="sched-field"><label>Notater</label><textarea id="sched-notes-${ev._historyId}" rows="2" placeholder="Valgfritt..."></textarea></div>
            <button class="form-btn form-btn-sm" style="background:var(--accent-red);color:#fff" onclick="_schedSubmitReview(${ev._historyId},'rejected',this)">Lagre avvisning</button>
          </div>
        </div>`;
      }
    }

    overlay.innerHTML = `<div class="sched-dialog">
      ${thumbHtml}
      <h3 style="margin-top:0">${_esc(ev.title)}</h3>
      ${modelHtml}
      ${fields}
      ${reviewHtml}
      <div class="sched-dialog-actions">
        ${ev._fromHistory ? `<button class="form-btn form-btn-sm" onclick="this.closest('.sched-dialog-overlay').remove();location.hash='#history'">${t('history.view') || 'Vis historikk'}</button>` : ''}
        ${ev._fromQueue ? `<button class="form-btn form-btn-sm" onclick="this.closest('.sched-dialog-overlay').remove();location.hash='#queue'">${t('queue.title') || 'Vis ko'}</button>` : ''}
        <div style="flex:1"></div>
        <button class="form-btn form-btn-secondary form-btn-sm" onclick="this.closest('.sched-dialog-overlay').remove()">${t('scheduler.close') || 'Lukk'}</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
  }

  function _fmtDuration(sec) {
    if (!sec || sec <= 0) return '--';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h}${t('time.h')} ${m}${t('time.m')}`;
    return `${m}${t('time.m')}`;
  }

  const COLORS = ['#1279ff', '#00ae42', '#f59e0b', '#e53935', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  function _showDialog(existing, defaults) {
    const data = existing || defaults || {};
    const isEdit = !!existing;
    const schedAt = data.scheduled_at || '';
    const dateVal = schedAt.slice(0, 10);
    const timeVal = schedAt.slice(11, 16) || '09:00';

    let printerOpts = `<option value="">${t('scheduler.any_printer')}</option>`;
    for (const p of _printers) {
      const sel = p.id === data.printer_id ? ' selected' : '';
      printerOpts += `<option value="${_esc(p.id)}"${sel}>${_esc(p.name)}</option>`;
    }

    let colorHtml = '';
    for (const c of COLORS) {
      colorHtml += `<div class="sched-color${c === (data.color || '#1279ff') ? ' active' : ''}" style="background:${c}" data-color="${c}" onclick="_schedPickColor(this)"></div>`;
    }

    const repeatOpts = `
      <option value="">${t('scheduler.no_repeat')}</option>
      <option value="daily"${data.repeat_rule === 'daily' ? ' selected' : ''}>${t('scheduler.repeat_daily')}</option>
      <option value="weekly"${data.repeat_rule === 'weekly' ? ' selected' : ''}>${t('scheduler.repeat_weekly')}</option>
      <option value="monthly"${data.repeat_rule === 'monthly' ? ' selected' : ''}>${t('scheduler.repeat_monthly')}</option>
    `;

    const overlay = document.createElement('div');
    overlay.className = 'sched-dialog-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="sched-dialog">
      <h3>${isEdit ? t('scheduler.edit_event') : t('scheduler.new_event')}</h3>
      <div class="sched-field">
        <label>${t('scheduler.title')}</label>
        <input type="text" id="sched-title" value="${_esc(data.title || '')}" placeholder="${t('scheduler.title_placeholder')}">
      </div>
      <div class="sched-field">
        <label>${t('scheduler.filename')}</label>
        <input type="text" id="sched-filename" value="${_esc(data.filename || '')}" placeholder="model.3mf">
      </div>
      <div class="sched-field">
        <label>${t('scheduler.printer')}</label>
        <select id="sched-printer">${printerOpts}</select>
      </div>
      <div style="display:flex;gap:10px">
        <div class="sched-field" style="flex:1">
          <label>${t('scheduler.date')}</label>
          <input type="date" id="sched-date" value="${dateVal}">
        </div>
        <div class="sched-field" style="flex:1">
          <label>${t('scheduler.time')}</label>
          <input type="time" id="sched-time" value="${timeVal}">
        </div>
      </div>
      <div class="sched-field">
        <label>${t('scheduler.repeat')}</label>
        <select id="sched-repeat">${repeatOpts}</select>
      </div>
      <div class="sched-field">
        <label>${t('scheduler.color')}</label>
        <div class="sched-colors" id="sched-colors">${colorHtml}</div>
      </div>
      <div class="sched-field">
        <label>${t('scheduler.notes')}</label>
        <textarea id="sched-notes" placeholder="${t('scheduler.notes_placeholder')}">${_esc(data.notes || '')}</textarea>
      </div>
      <div class="sched-dialog-actions">
        ${isEdit ? `<button class="sched-btn-delete" onclick="_schedDelete(${data.id})">${t('scheduler.delete')}</button>` : ''}
        <div style="flex:1"></div>
        <button class="sched-btn-cancel" onclick="this.closest('.sched-dialog-overlay').remove()">${t('scheduler.cancel')}</button>
        <button class="sched-btn-save" onclick="_schedSave(${isEdit ? data.id : 'null'})">${t('scheduler.save')}</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#sched-title').focus();
  }

  window._schedPickColor = function(el) {
    el.closest('.sched-colors').querySelectorAll('.sched-color').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
  };

  window._schedSave = async function(id) {
    const title = document.getElementById('sched-title')?.value?.trim();
    const filename = document.getElementById('sched-filename')?.value?.trim();
    const printer_id = document.getElementById('sched-printer')?.value || null;
    const date = document.getElementById('sched-date')?.value;
    const time = document.getElementById('sched-time')?.value || '09:00';
    const repeat_rule = document.getElementById('sched-repeat')?.value || null;
    const notes = document.getElementById('sched-notes')?.value?.trim() || null;
    const color = document.querySelector('.sched-color.active')?.dataset?.color || '#1279ff';

    if (!title || !filename || !date) {
      if (typeof showToast === 'function') showToast(t('scheduler.fill_required'), 'warning');
      return;
    }

    const body = { title, filename, printer_id, scheduled_at: `${date}T${time}:00`, repeat_rule, color, notes };

    try {
      if (id) {
        await fetch(`/api/scheduler/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      } else {
        await fetch('/api/scheduler', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      }
      document.querySelector('.sched-dialog-overlay')?.remove();
      _loadEvents();
      if (typeof showToast === 'function') showToast(t('scheduler.saved'), 'success');
    } catch (e) {
      if (typeof showToast === 'function') showToast(t('scheduler.save_error'), 'error');
    }
  };

  window._schedDelete = async function(id) {
    if (!confirm(t('scheduler.confirm_delete'))) return;
    try {
      await fetch(`/api/scheduler/${id}`, { method: 'DELETE' });
      document.querySelector('.sched-dialog-overlay')?.remove();
      _loadEvents();
      if (typeof showToast === 'function') showToast(t('scheduler.deleted'), 'success');
    } catch {}
  };

  // ═══ Review functions for scheduler ═══

  window._schedShowRejectForm = function(historyId, prefillWaste) {
    const form = document.getElementById(`sched-reject-form-${historyId}`);
    if (form) {
      form.style.display = '';
      const wasteInput = document.getElementById(`sched-waste-${historyId}`);
      if (wasteInput && prefillWaste) wasteInput.value = prefillWaste;
    }
  };

  window._schedSubmitReview = async function(historyId, status, btn) {
    const waste = parseFloat(document.getElementById(`sched-waste-${historyId}`)?.value) || null;
    const notes = document.getElementById(`sched-notes-${historyId}`)?.value?.trim() || null;

    try {
      const res = await fetch(`/api/history/${historyId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, waste_g: waste, notes })
      });
      if (!res.ok) throw new Error('Review failed');

      // Close dialog and reload
      document.querySelector('.sched-dialog-overlay')?.remove();
      _loadEvents();
      const labels = { approved: 'Godkjent', rejected: 'Avvist', partial: 'Delvis godkjent' };
      if (typeof showToast === 'function') showToast(labels[status] || status, 'success');
    } catch (e) {
      if (typeof showToast === 'function') showToast('Feil ved lagring', 'error');
    }
  };

  window._schedReview = function(historyId, btn) {
    // Replace "Endre vurdering" button with the review form
    const container = btn.closest('.sched-field');
    if (!container) return;
    container.innerHTML = `
      <label>Kvalitetsvurdering</label>
      <div style="display:flex;gap:6px;margin-bottom:8px">
        <button class="form-btn form-btn-sm" style="background:var(--accent-green);color:#fff" onclick="_schedSubmitReview(${historyId},'approved',this)">&#10003; Godkjenn</button>
        <button class="form-btn form-btn-sm" style="background:var(--accent-red);color:#fff" onclick="_schedShowRejectForm(${historyId},0)">&#10007; Avvis</button>
        <button class="form-btn form-btn-sm" style="background:var(--accent-orange);color:#fff" onclick="_schedShowRejectForm(${historyId},0)">&#9680; Delvis</button>
      </div>
      <div id="sched-reject-form-${historyId}" style="display:none">
        <div class="sched-field"><label>Waste (gram)</label><input type="number" id="sched-waste-${historyId}" min="0" step="0.1" placeholder="0"></div>
        <div class="sched-field"><label>Notater</label><textarea id="sched-notes-${historyId}" rows="2" placeholder="Valgfritt..."></textarea></div>
        <button class="form-btn form-btn-sm" style="background:var(--accent-red);color:#fff" onclick="_schedSubmitReview(${historyId},'rejected',this)">Lagre</button>
      </div>`;
  };

  function _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
})();
