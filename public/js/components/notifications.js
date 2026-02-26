// Browser Notifications for print events
(function() {
  let previousStates = {};
  let enabled = false;

  function requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(p => { enabled = p === 'granted'; });
    }
    enabled = typeof Notification !== 'undefined' && Notification.permission === 'granted';
  }

  function notify(title, body) {
    if (!enabled) return;
    try {
      new Notification(title, { body, icon: '/assets/favicon.svg' });
    } catch (e) { /* ignore */ }
  }

  window.checkNotifications = function(printerId, data) {
    const prev = previousStates[printerId];
    const curr = data.gcode_state;
    const name = data.subtask_name || t('notify.print');

    if (prev && prev !== curr) {
      if (prev === 'RUNNING' && curr === 'FINISH') {
        notify(t('notify.print_finished'), t('notify.print_finished_body', { name }));
      }
      if (prev === 'RUNNING' && curr === 'FAILED') {
        notify(t('notify.print_failed'), t('notify.print_failed_body', { name }));
      }
      if (prev !== 'RUNNING' && curr === 'RUNNING') {
        notify(t('notify.print_started'), t('notify.print_started_body', { name }));
      }
    }

    previousStates[printerId] = curr;
  };

  document.addEventListener('DOMContentLoaded', requestPermission);
})();
