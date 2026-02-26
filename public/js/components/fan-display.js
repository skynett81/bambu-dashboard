// Fan Display with animated icons
(function() {
  function fanPercent(raw) {
    const val = parseInt(raw) || 0;
    return Math.round((val / 255) * 100);
  }

  function updateFanEl(id, pct) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = `${pct}%`;
    // Toggle active class on parent .qs-fan for icon animation
    const parent = el.closest('.qs-fan');
    if (parent) {
      parent.classList.toggle('fan-active', pct > 0);
    }
  }

  window.updateFanDisplay = function(data) {
    updateFanEl('fan-part', fanPercent(data.cooling_fan_speed));
    updateFanEl('fan-aux', fanPercent(data.big_fan1_speed));
    updateFanEl('fan-chamber', fanPercent(data.big_fan2_speed));
  };
})();
