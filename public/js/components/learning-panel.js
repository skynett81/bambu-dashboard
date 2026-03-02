// Learning Center Panel — Interactive course system with search, categories, progress tracking, and achievements
(function() {

  const CATEGORIES = {
    all:             { label: 'learning.cat_all',             color: '#00b4ff' },
    getting_started: { label: 'learning.cat_getting_started', color: '#00c864' },
    filament:        { label: 'learning.cat_filament',        color: '#f0883e' },
    printing:        { label: 'learning.cat_printing',        color: '#00b4ff' },
    maintenance:     { label: 'learning.cat_maintenance',     color: '#f0c000' },
    automation:      { label: 'learning.cat_automation',      color: '#a855f7' }
  };

  let _courses = [];
  let _activeCategory = 'all';
  let _searchQuery = '';
  let _expandedCourseId = null;

  function _esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function _formatDate(iso) {
    if (!iso) return '--';
    try {
      const locale = (window.i18n?.getLocale?.() || 'nb').replace('_', '-');
      return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return iso.substring(0, 10); }
  }

  function _difficultyStars(level) {
    const n = Math.max(1, Math.min(5, level || 1));
    return '<span style="color:var(--accent)">' + '\u2605'.repeat(n) + '</span><span style="opacity:0.3">' + '\u2606'.repeat(5 - n) + '</span>';
  }

  function _getSteps(course) {
    if (!course.steps) return [];
    try {
      const parsed = JSON.parse(course.steps);
      return parsed.map(s => typeof s === 'string' ? { title: s, description: '', action: null } : s);
    } catch { return []; }
  }

  function _getCompletedSteps(course) {
    const raw = course.completed_steps;
    if (raw) {
      try { return JSON.parse(raw); } catch { return []; }
    }
    return [];
  }

  function _getProgress(course) {
    const steps = _getSteps(course);
    const done = _getCompletedSteps(course);
    return steps.length > 0 ? Math.round((done.length / steps.length) * 100) : 0;
  }

  function _getFiltered() {
    return _courses.filter(c => {
      if (_activeCategory !== 'all' && c.category !== _activeCategory) return false;
      if (_searchQuery) {
        const q = _searchQuery.toLowerCase();
        return (c.title || '').toLowerCase().includes(q) ||
               (c.description || '').toLowerCase().includes(q) ||
               (c.category || '').toLowerCase().includes(q);
      }
      return true;
    });
  }

  // ── Main Load ──
  async function loadLearning() {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;
    try {
      const res = await fetch('/api/courses/with-progress?user_id=0');
      _courses = await res.json();
      _render();
    } catch (e) {
      panel.innerHTML = '<p class="text-muted" style="padding:2rem;text-align:center">' + t('learning.load_failed') + '</p>';
    }
  }

  function _render() {
    const panel = document.getElementById('overlay-panel-body');
    if (!panel) return;
    const filtered = _getFiltered();
    const totalCourses = _courses.length;
    const completedCourses = _courses.filter(c => _getProgress(c) === 100).length;
    const totalSteps = _courses.reduce((s, c) => s + _getSteps(c).length, 0);
    const completedSteps = _courses.reduce((s, c) => s + _getCompletedSteps(c).length, 0);
    const totalTime = _courses.reduce((s, c) => s + (c.estimated_minutes || 0), 0);

    let html = '';

    // Hero stats
    html += '<div class="lc-hero-grid">';
    html += _heroCard('\uD83D\uDCDA', completedCourses + '/' + totalCourses, t('learning.courses_completed'), '#00c864');
    html += _heroCard('\u2705', completedSteps + '/' + totalSteps, t('learning.steps_completed'), '#00b4ff');
    html += _heroCard('\u23F1\uFE0F', totalTime + ' min', t('learning.total_time'), '#f0883e');
    html += _heroCard('\uD83C\uDFC6', completedCourses > 0 ? String(completedCourses) : '--', t('learning.achievements'), '#a855f7');
    html += '</div>';

    // Search
    html += '<div class="lc-search-bar">';
    html += '<input type="text" class="form-input lc-search-input" placeholder="' + t('learning.search_placeholder') + '" value="' + _esc(_searchQuery) + '" oninput="lcSearch(this.value)">';
    html += '</div>';

    // Category tabs
    html += '<div class="lc-tabs">';
    for (const [id, cfg] of Object.entries(CATEGORIES)) {
      const active = id === _activeCategory ? ' lc-tab-active' : '';
      const count = id === 'all' ? _courses.length : _courses.filter(c => c.category === id).length;
      html += '<button class="lc-tab-btn' + active + '" data-ripple onclick="lcSwitchCategory(\'' + id + '\')" style="--tab-color:' + cfg.color + '">' + t(cfg.label) + ' <span class="lc-tab-count">' + count + '</span></button>';
    }
    html += '</div>';

    // Course grid
    if (filtered.length === 0) {
      html += '<div class="text-muted" style="text-align:center;padding:2rem">' + t('learning.no_results') + '</div>';
    } else {
      html += '<div class="lc-course-grid stagger-in">';
      filtered.forEach((course, i) => {
        html += _renderCard(course, i);
      });
      html += '</div>';
    }

    panel.innerHTML = html;

    // Render detail modal if expanded (appended to body, not panel)
    const existing = document.getElementById('lc-detail-modal');
    if (existing) existing.remove();
    if (_expandedCourseId !== null) {
      const course = _courses.find(c => c.id === _expandedCourseId);
      if (course) {
        document.body.insertAdjacentHTML('beforeend', _renderDetail(course));
      }
    }
  }

  function _heroCard(icon, value, label, color) {
    return '<div class="lc-hero-card">' +
      '<div class="lc-hero-icon" style="background:' + color + '15;color:' + color + '">' + icon + '</div>' +
      '<div class="lc-hero-value" style="color:' + color + '">' + value + '</div>' +
      '<div class="lc-hero-label">' + label + '</div>' +
    '</div>';
  }

  function _renderCard(course, idx) {
    const steps = _getSteps(course);
    const done = _getCompletedSteps(course);
    const pct = _getProgress(course);
    const isComplete = pct === 100;
    const cat = CATEGORIES[course.category] || CATEGORIES.all;

    return '<div class="lc-course-card' + (isComplete ? ' lc-complete' : '') + '" onclick="lcToggleCourse(' + course.id + ')" style="--i:' + (idx || 0) + '">' +
      '<div class="lc-card-header">' +
        '<span class="lc-cat-badge" style="background:' + cat.color + '20;color:' + cat.color + '">' + t(cat.label) + '</span>' +
        (isComplete ? '<span class="lc-done-badge">\u2705</span>' : '') +
      '</div>' +
      '<div class="lc-card-title">' + _esc(course.title) + '</div>' +
      '<div class="lc-card-meta">' +
        '<span>' + _difficultyStars(course.difficulty) + '</span>' +
        '<span>~' + (course.estimated_minutes || '?') + ' min</span>' +
      '</div>' +
      '<div class="lc-card-desc">' + _esc(course.description) + '</div>' +
      '<div class="lc-progress-bar-wrap">' +
        '<div class="lc-progress-bar" style="width:' + pct + '%;background:' + (isComplete ? '#00c864' : 'var(--accent)') + '"></div>' +
      '</div>' +
      '<div class="lc-card-footer">' +
        '<span class="lc-pct">' + pct + '%</span>' +
        '<span class="lc-step-count">' + done.length + '/' + steps.length + ' ' + t('learning.steps') + '</span>' +
      '</div>' +
      (isComplete && course.completed_at ? '<div class="lc-completed-date">' + t('learning.completed_on') + ' ' + _formatDate(course.completed_at) + '</div>' : '') +
    '</div>';
  }

  function _renderDetail(course) {
    const steps = _getSteps(course);
    const done = _getCompletedSteps(course);
    const pct = _getProgress(course);
    const cat = CATEGORIES[course.category] || CATEGORIES.all;

    let html = '<div class="lc-detail-overlay" id="lc-detail-modal" onclick="lcCloseCourse(event)">';
    html += '<div class="lc-detail-panel" onclick="event.stopPropagation()">';

    // Header
    html += '<div class="lc-detail-header">';
    html += '<div>';
    html += '<h3 class="lc-detail-title">' + _esc(course.title) + '</h3>';
    html += '<div class="lc-detail-meta">' + _difficultyStars(course.difficulty) + ' &middot; ~' + (course.estimated_minutes || '?') + ' min &middot; ' + t(cat.label) + '</div>';
    html += '</div>';
    html += '<button class="lc-detail-close" onclick="lcCloseCourse(event)">\u2715</button>';
    html += '</div>';

    // Progress
    html += '<div class="lc-detail-progress">';
    html += '<div class="lc-progress-bar-wrap lc-progress-lg"><div class="lc-progress-bar" style="width:' + pct + '%"></div></div>';
    html += '<span class="lc-pct">' + pct + '% ' + t('learning.complete') + '</span>';
    html += '</div>';

    // Steps
    html += '<div class="lc-step-list">';
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const checked = done.includes(i);
      const actionBtn = step.action
        ? '<button class="form-btn form-btn-sm lc-goto-btn" data-ripple onclick="event.stopPropagation();lcGoTo(\'' + _esc(step.action) + '\')">' + t('learning.go_to') + ' \u2192</button>'
        : '';

      html += '<div class="lc-step' + (checked ? ' lc-step-done' : '') + '">';
      html += '<label class="lc-step-check"><input type="checkbox" ' + (checked ? 'checked' : '') + ' onchange="event.stopPropagation();lcToggleStep(' + course.id + ',' + i + ',this.checked)"></label>';
      html += '<div class="lc-step-content">';
      html += '<div class="lc-step-title">' + _esc(step.title) + '</div>';
      if (step.description) html += '<div class="lc-step-desc">' + _esc(step.description) + '</div>';
      html += '</div>';
      html += actionBtn;
      html += '</div>';
    }
    html += '</div>';

    // Actions
    html += '<div class="lc-detail-actions">';
    html += '<button class="form-btn form-btn-sm" data-ripple onclick="lcMarkAll(' + course.id + ')">' + t('learning.mark_all_complete') + '</button>';
    html += '<button class="form-btn form-btn-sm form-btn-danger" data-ripple onclick="lcResetProgress(' + course.id + ')">' + t('learning.reset_progress') + '</button>';
    html += '</div>';

    html += '</div></div>';
    return html;
  }

  // ── Sync helper ──
  async function _syncProgress(courseId) {
    const course = _courses.find(c => c.id === courseId);
    if (!course) return;
    const done = _getCompletedSteps(course);
    const steps = _getSteps(course);
    const allDone = done.length === steps.length;
    try {
      await fetch('/api/courses/' + courseId + '/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 0,
          status: allDone ? 'completed' : done.length > 0 ? 'in_progress' : 'not_started',
          current_step: done.length,
          completed_steps: JSON.stringify(done),
          completed_at: allDone ? (course.completed_at || new Date().toISOString()) : null
        })
      });
    } catch (e) {
      console.warn('[learning] Failed to sync progress:', e);
      localStorage.setItem('lc_progress_' + courseId, JSON.stringify(done));
    }
  }

  // ── Event Handlers ──
  window.lcSearch = function(query) {
    _searchQuery = query;
    _render();
  };

  window.lcSwitchCategory = function(cat) {
    _activeCategory = cat;
    _render();
  };

  window.lcToggleCourse = function(id) {
    _expandedCourseId = _expandedCourseId === id ? null : id;
    _render();
  };

  window.lcCloseCourse = function(e) {
    if (e) e.stopPropagation();
    _expandedCourseId = null;
    const modal = document.getElementById('lc-detail-modal');
    if (modal) modal.remove();
    _render();
  };

  window.lcGoTo = function(target) {
    _expandedCourseId = null;
    const modal = document.getElementById('lc-detail-modal');
    if (modal) modal.remove();
    if (target && target.startsWith('#')) {
      location.hash = target;
    }
  };

  window.lcToggleStep = function(courseId, stepIdx, checked) {
    const course = _courses.find(c => c.id === courseId);
    if (!course) return;
    let done = _getCompletedSteps(course);
    if (checked && !done.includes(stepIdx)) {
      done.push(stepIdx);
    } else if (!checked) {
      done = done.filter(i => i !== stepIdx);
    }
    const steps = _getSteps(course);
    const allDone = done.length === steps.length;
    course.completed_steps = JSON.stringify(done);
    course.completed_at = allDone ? new Date().toISOString() : null;
    course.progress_status = allDone ? 'completed' : done.length > 0 ? 'in_progress' : 'not_started';
    _render();
    _syncProgress(courseId);
  };

  window.lcMarkAll = function(courseId) {
    const course = _courses.find(c => c.id === courseId);
    if (!course) return;
    const steps = _getSteps(course);
    const allIndices = steps.map((_, i) => i);
    course.completed_steps = JSON.stringify(allIndices);
    course.completed_at = new Date().toISOString();
    course.progress_status = 'completed';
    _render();
    _syncProgress(courseId);
  };

  window.lcResetProgress = function(courseId) {
    const course = _courses.find(c => c.id === courseId);
    if (!course) return;
    course.completed_steps = '[]';
    course.completed_at = null;
    course.progress_status = 'not_started';
    _render();
    _syncProgress(courseId);
  };

  window.loadLearningPanel = loadLearning;
})();
