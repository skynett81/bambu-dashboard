// Print Scheduler — calendar view for scheduling prints
(function() {
  let _currentDate = new Date();
  let _events = [];
  let _view = 'month'; // month | week
  let _printers = [];

  window.loadSchedulerPanel = function() {
    const el = document.getElementById('overlay-panel-body');
    if (!el) return;

    el.innerHTML = `<style>
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

    // Fetch both scheduled events and print history in parallel
    const [schedRes, histRes] = await Promise.allSettled([
      fetch(`/api/scheduler?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`).then(r => r.json()),
      fetch(`/api/history?limit=500`).then(r => r.json())
    ]);

    const scheduled = schedRes.status === 'fulfilled' && Array.isArray(schedRes.value) ? schedRes.value : [];
    const history = histRes.status === 'fulfilled' && Array.isArray(histRes.value) ? histRes.value : [];

    // Convert print history to calendar events
    const fromDate = new Date(y, m - 1, 1);
    const toDate = new Date(y, m + 2, 0);
    const historyEvents = history
      .filter(h => {
        if (!h.started_at) return false;
        const d = new Date(h.started_at);
        return d >= fromDate && d <= toDate;
      })
      .map(h => ({
        id: 'h_' + h.id,
        title: _trimFilename(h.filename || t('scheduler.untitled')),
        scheduled_at: h.started_at,
        finished_at: h.finished_at,
        status: h.status === 'completed' ? 'completed' : h.status === 'failed' ? 'failed' : 'running',
        color: h.status === 'completed' ? '#00ae42' : h.status === 'failed' ? '#e53935' : '#f59e0b',
        duration_seconds: h.duration_seconds,
        filament_type: h.filament_type,
        printer_id: h.printer_id,
        _fromHistory: true
      }));

    _events = [...scheduled, ...historyEvents];
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
      html += `<div class="sched-cell${isToday ? ' today' : ''}" onclick="_schedShowAdd('${dateStr}')">`;
      html += `<div class="sched-day-num">${d}</div>`;
      const maxShow = 3;
      for (let i = 0; i < Math.min(dayEvents.length, maxShow); i++) {
        const ev = dayEvents[i];
        const bg = _eventColor(ev);
        html += `<div class="sched-event" style="background:${bg}" onclick="event.stopPropagation();_schedEdit(${ev.id})" title="${_esc(ev.title)}">${_esc(ev.title)}</div>`;
      }
      if (dayEvents.length > maxShow) {
        html += `<div class="sched-more">+${dayEvents.length - maxShow} ${t('scheduler.more')}</div>`;
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
          html += `<div class="sched-event" style="background:${bg}" onclick="event.stopPropagation();_schedEdit(${ev.id})" title="${_esc(ev.title)}">${_esc(ev.title)}</div>`;
        }
        html += '</div>';
      }
    }
    html += '</div>';
    cal.innerHTML = html;
  }

  function _eventsForDate(dateStr) {
    return _events.filter(e => e.scheduled_at && e.scheduled_at.startsWith(dateStr));
  }

  function _eventsForDateHour(dateStr, hour) {
    return _events.filter(e => {
      if (!e.scheduled_at || !e.scheduled_at.startsWith(dateStr)) return false;
      const h = parseInt(e.scheduled_at.substring(11, 13)) || 0;
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

  // Add/Edit dialog
  window._schedShowAdd = function(dateStr, hour) {
    const dt = dateStr || new Date().toISOString().slice(0, 10);
    const time = hour != null ? `${String(hour).padStart(2, '0')}:00` : '09:00';
    _showDialog(null, { scheduled_at: `${dt}T${time}`, color: '#1279ff' });
  };

  window._schedEdit = function(id) {
    const ev = _events.find(e => e.id === id);
    if (!ev) return;
    if (ev._fromHistory) {
      _showHistoryDetail(ev);
    } else {
      _showDialog(ev);
    }
  };

  function _showHistoryDetail(ev) {
    const overlay = document.createElement('div');
    overlay.className = 'sched-dialog-overlay';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    const statusLabel = ev.status === 'completed' ? t('scheduler.completed') : ev.status === 'failed' ? t('scheduler.failed') : t('scheduler.in_progress');
    const statusColor = ev.status === 'completed' ? '#00ae42' : ev.status === 'failed' ? '#e53935' : '#f59e0b';
    const dur = ev.duration_seconds ? _fmtDuration(ev.duration_seconds) : '--';
    const startTime = ev.scheduled_at ? new Date(ev.scheduled_at).toLocaleString() : '--';
    const endTime = ev.finished_at ? new Date(ev.finished_at).toLocaleString() : '--';
    overlay.innerHTML = `<div class="sched-dialog">
      <h3>${_esc(ev.title)}</h3>
      <div class="sched-field"><label>${t('history.status')}</label><div style="color:${statusColor};font-weight:600">${statusLabel}</div></div>
      <div class="sched-field"><label>${t('scheduler.started')}</label><div>${startTime}</div></div>
      <div class="sched-field"><label>${t('scheduler.finished')}</label><div>${endTime}</div></div>
      <div class="sched-field"><label>${t('scheduler.duration')}</label><div>${dur}</div></div>
      ${ev.filament_type ? `<div class="sched-field"><label>${t('history.filament')}</label><div>${_esc(ev.filament_type)}</div></div>` : ''}
      <div class="sched-dialog-actions">
        <div style="flex:1"></div>
        <button class="sched-btn-cancel" onclick="this.closest('.sched-dialog-overlay').remove()">${t('scheduler.close') || 'OK'}</button>
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

  function _esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
})();
