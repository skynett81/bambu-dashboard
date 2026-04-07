// Notification Center — bell icon dropdown with recent notifications/events
(function() {
  'use strict';

  const MAX_NOTIFICATIONS = 50;
  let _notifications = [];
  let _unreadCount = 0;
  let _panelOpen = false;
  let _panelEl = null;
  let _badgeEl = null;

  // ---- Session persistence ----
  function _loadFromSession() {
    try { _notifications = JSON.parse(sessionStorage.getItem('notifCenter')) || []; }
    catch(e) { _notifications = []; }
    _unreadCount = _notifications.filter(function(n) { return !n.read; }).length;
  }

  function _save() {
    try { sessionStorage.setItem('notifCenter', JSON.stringify(_notifications)); }
    catch(e) { /* quota exceeded — ignore */ }
  }

  // ---- Time formatting ----
  function _timeAgo(isoStr) {
    var diff = Date.now() - new Date(isoStr).getTime();
    if (diff < 0) diff = 0;
    var sec = Math.floor(diff / 1000);
    if (sec < 60) return 'Now';
    var min = Math.floor(sec / 60);
    if (min < 60) return min + ' min ago';
    var hr = Math.floor(min / 60);
    if (hr < 24) return hr + 'h ago';
    var d = Math.floor(hr / 24);
    return d + 'd ago';
  }

  function _escHtml(s) {
    var d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }

  // ---- Badge ----
  function _updateBadge() {
    if (!_badgeEl) _badgeEl = document.getElementById('notif-badge');
    if (!_badgeEl) return;
    _unreadCount = _notifications.filter(function(n) { return !n.read; }).length;
    if (_unreadCount > 0) {
      _badgeEl.textContent = _unreadCount > 99 ? '99+' : _unreadCount;
      _badgeEl.style.display = '';
    } else {
      _badgeEl.style.display = 'none';
    }
  }

  // ---- Notification type icons ----
  var TYPE_ICONS = {
    success: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>',
    error: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-red)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-yellow)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };

  // ---- Panel rendering ----
  function _renderPanel() {
    if (!_panelEl) return;

    var html = '<div class="notif-header"><h3>' + (typeof t === 'function' ? t('notification.title') : 'Notifications') + '</h3><div class="notif-header-actions">';
    html += '<button class="notif-action-btn" onclick="markAllNotificationsRead()" title="' + (typeof t === 'function' ? t('notification.mark_all_read') : 'Mark all read') + '" data-bs-toggle="tooltip" data-bs-placement="bottom">' + (typeof t === 'function' ? t('notification.mark_all_read') : 'Mark all read') + '</button>';
    html += '<button class="notif-action-btn notif-action-clear" onclick="clearAllNotifications()" title="' + (typeof t === 'function' ? t('notification.clear_all_tooltip') : 'Clear all notifications') + '" data-bs-toggle="tooltip" data-bs-placement="bottom">' + (typeof t === 'function' ? t('notification.clear_all') : 'Clear') + '</button>';
    html += '</div></div>';

    html += '<div class="notif-list list-group list-group-flush">';
    if (_notifications.length === 0) {
      html += '<div class="notif-empty list-group-item text-center text-muted">' + (typeof t === 'function' ? t('notification.no_notifications') : 'No notifications yet') + '</div>';
    } else {
      for (var i = 0; i < _notifications.length; i++) {
        var n = _notifications[i];
        var cls = 'notif-item list-group-item list-group-item-action' + (n.read ? '' : ' unread');
        html += '<div class="' + cls + '" data-notif-id="' + n.id + '" onclick="markNotificationRead(' + n.id + ')">';
        html += '<span class="notif-dot"></span>';
        html += '<span class="notif-type-icon">' + (TYPE_ICONS[n.type] || TYPE_ICONS.info) + '</span>';
        html += '<div class="notif-item-body">';
        html += '<div class="notif-item-title">' + _escHtml(n.title) + '</div>';
        if (n.message) html += '<div class="notif-item-msg">' + _escHtml(n.message) + '</div>';
        html += '<div class="notif-item-time">' + _timeAgo(n.ts) + '</div>';
        html += '</div></div>';
      }
    }
    html += '</div>';

    _panelEl.innerHTML = html;
  }

  function _createPanel() {
    _panelEl = document.createElement('div');
    _panelEl.className = 'notif-panel';
    _panelEl.id = 'notif-panel';
    _panelEl.style.display = 'none';
    // Append to body to avoid layout side-effects on the header
    document.body.appendChild(_panelEl);
  }

  function _positionPanel() {
    if (!_panelEl) return;
    var bellBtn = document.getElementById('notif-bell-btn');
    if (!bellBtn) return;
    var rect = bellBtn.getBoundingClientRect();
    _panelEl.style.position = 'fixed';
    _panelEl.style.top = (rect.bottom + 6) + 'px';
    _panelEl.style.right = Math.max(8, window.innerWidth - rect.right) + 'px';
    _panelEl.style.left = 'auto';
  }

  // ---- Public API ----
  window.addNotification = function(title, message, type) {
    _notifications.unshift({
      id: Date.now() + Math.random(),
      ts: new Date().toISOString(),
      title: title || 'Notification',
      message: message || '',
      type: type || 'info',
      read: false
    });
    if (_notifications.length > MAX_NOTIFICATIONS) _notifications.pop();
    _save();
    _updateBadge();
    if (_panelOpen) _renderPanel();
  };

  window.toggleNotificationCenter = function() {
    _panelOpen = !_panelOpen;
    if (!_panelEl) _createPanel();
    if (_panelOpen) {
      _renderPanel();
      _positionPanel();
      _panelEl.style.display = '';
    } else {
      _panelEl.style.display = 'none';
    }
  };

  window.markNotificationRead = function(id) {
    for (var i = 0; i < _notifications.length; i++) {
      if (_notifications[i].id === id) {
        _notifications[i].read = true;
        break;
      }
    }
    _save();
    _updateBadge();
    if (_panelOpen) _renderPanel();
  };

  window.markAllNotificationsRead = function() {
    for (var i = 0; i < _notifications.length; i++) {
      _notifications[i].read = true;
    }
    _save();
    _updateBadge();
    if (_panelOpen) _renderPanel();
  };

  window.clearAllNotifications = function() {
    _notifications = [];
    _save();
    _updateBadge();
    if (_panelOpen) _renderPanel();
  };

  // ---- Click outside to close ----
  document.addEventListener('click', function(e) {
    if (!_panelOpen) return;
    if (e.target.closest('#notif-panel') || e.target.closest('#notif-bell-btn')) return;
    _panelOpen = false;
    if (_panelEl) _panelEl.style.display = 'none';
  });

  // ---- WebSocket hook for print events ----
  var _origOnMessage = null;
  function _hookWebSocket() {
    if (window._notifWsHooked) return;
    window._notifWsHooked = true;

    // Listen for custom ws events dispatched by the app
    window.addEventListener('ws-message', function(e) {
      var data = e.detail;
      if (!data || !data.type) return;
      if (data.type === 'print_finished') {
        window.addNotification('Print finished', data.filename || 'Print completed', 'success');
      } else if (data.type === 'print_failed') {
        window.addNotification('Print failed', data.message || data.filename || 'A print has failed', 'error');
      } else if (data.type === 'error') {
        window.addNotification('Error', data.message || 'An error occurred', 'error');
      }
    });
  }

  // ---- Init ----
  function _init() {
    _loadFromSession();
    _updateBadge();
    _hookWebSocket();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }
})();
