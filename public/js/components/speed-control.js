// Speed Control Buttons
(function() {
  window.updateSpeedControl = function(data) {
    const level = data.spd_lvl || 2;
    const buttons = document.querySelectorAll('.speed-btn');
    buttons.forEach(btn => {
      const btnLevel = parseInt(btn.dataset.level);
      btn.classList.toggle('active', btnLevel === level);
    });
  };
})();
