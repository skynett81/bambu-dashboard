// Onboarding Tour — guided walkthrough for new users
(function() {
  'use strict';

  const TOUR_KEY = 'onboarding-completed';

  function _getTourSteps() {
    const _tl = (key, fallback) => (typeof t === 'function' ? t(key) : '') || fallback;
    return [
      {
        target: '#sidebar',
        title: _tl('tour.nav_title', 'Navigasjon'),
        text: _tl('tour.nav_text', 'Bruk sidebaren til å navigere mellom Dashboard, Kontroller, Filament, Historikk og mer. Seksjoner kan minimeres.'),
        position: 'right'
      },
      {
        target: '#stats-strip',
        title: _tl('tour.stats_title', 'Sanntidsstatistikk'),
        text: _tl('tour.stats_text', 'Sanntidsgrafer som viser dyse-, seng- og kammertemperaturer, viftehastighet, utskriftshastighet og lagfremgang.'),
        position: 'bottom'
      },
      {
        target: '#dashboard-grid',
        title: _tl('tour.dashboard_title', 'Dashboard'),
        text: _tl('tour.dashboard_text', 'Din hovedoversikt med utskriftsfremgang, kamerafeed, AMS-status, temperaturmålere og hurtigkontroller.'),
        position: 'top'
      },
      {
        target: '.printer-selector',
        title: _tl('tour.printer_selector_title', 'Printervalg'),
        text: _tl('tour.printer_selector_text', 'Hvis du har flere printere, kan du bytte mellom dem her. Hver printer har sin egen status og data.'),
        position: 'bottom'
      },
      {
        target: '#theme-toggle',
        title: _tl('tour.theme_title', 'Tema og visning'),
        text: _tl('tour.theme_text', 'Veksle mellom lyst og mørkt tema. Trykk T for rask veksling, eller ? for å se alle tastatursnarveier.'),
        position: 'bottom'
      }
    ];
  }

  function _createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'tour-overlay';
    overlay.id = 'tour-overlay';
    document.body.appendChild(overlay);
    return overlay;
  }

  function _createTooltip() {
    const tip = document.createElement('div');
    tip.className = 'tour-tooltip';
    tip.id = 'tour-tooltip';
    document.body.appendChild(tip);
    return tip;
  }

  function _showStep(idx) {
    const TOUR_STEPS = _getTourSteps();
    const step = TOUR_STEPS[idx];
    const target = document.querySelector(step.target);
    const tooltip = document.getElementById('tour-tooltip') || _createTooltip();
    const overlay = document.getElementById('tour-overlay') || _createOverlay();

    // Highlight target
    if (target) {
      target.style.position = target.style.position || 'relative';
      target.classList.add('tour-highlight');
    }

    const total = TOUR_STEPS.length;
    const isLast = idx === total - 1;
    const isFirst = idx === 0;

    tooltip.innerHTML = `
      <div class="tour-step-counter">${idx + 1} / ${total}</div>
      <div class="tour-title">${step.title}</div>
      <div class="tour-text">${step.text}</div>
      <div class="tour-actions">
        <button class="form-btn form-btn-secondary tour-skip" onclick="endTour()">${(typeof t === 'function' ? t('tour.skip') : '') || 'Hopp over'}</button>
        <div style="display:flex;gap:6px">
          ${!isFirst ? `<button class="form-btn form-btn-secondary tour-prev" onclick="tourPrev()">${(typeof t === 'function' ? t('tour.back') : '') || 'Tilbake'}</button>` : ''}
          <button class="form-btn tour-next" onclick="${isLast ? 'endTour()' : 'tourNext()'}">${isLast ? ((typeof t === 'function' ? t('tour.finish') : '') || 'Fullfør') : ((typeof t === 'function' ? t('tour.next') : '') || 'Neste')}</button>
        </div>
      </div>
    `;

    // Position tooltip
    if (target) {
      const rect = target.getBoundingClientRect();
      const tw = 320;
      let top, left;

      // Measure tooltip height first
      tooltip.style.top = '-9999px';
      tooltip.style.left = '-9999px';
      tooltip.style.display = 'block';
      tooltip.style.transform = '';
      const th = tooltip.offsetHeight || 200;

      let useTransform = false;
      switch (step.position) {
        case 'right':
          top = rect.top + rect.height / 2 - th / 2;
          left = rect.right + 16;
          break;
        case 'bottom':
          top = rect.bottom + 16;
          left = rect.left + rect.width / 2 - tw / 2;
          break;
        case 'top':
          top = rect.top - th - 16;
          left = rect.left + rect.width / 2 - tw / 2;
          break;
        default:
          top = rect.bottom + 16;
          left = rect.left;
      }

      // Keep within viewport
      left = Math.max(16, Math.min(left, window.innerWidth - tw - 16));
      top = Math.max(16, Math.min(top, window.innerHeight - th - 16));

      tooltip.style.top = top + 'px';
      tooltip.style.left = left + 'px';
      tooltip.style.transform = '';
    } else {
      // Center if target not found
      tooltip.style.top = '50%';
      tooltip.style.left = '50%';
      tooltip.style.transform = 'translate(-50%, -50%)';
    }

    tooltip.style.display = 'block';
    overlay.style.display = 'block';
  }

  function _clearHighlights() {
    document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
  }

  let _currentStep = 0;

  window.startTour = function() {
    _currentStep = 0;
    _createOverlay();
    _createTooltip();
    _showStep(0);
  };

  window.tourNext = function() {
    _clearHighlights();
    _currentStep++;
    if (_currentStep < _getTourSteps().length) {
      _showStep(_currentStep);
    } else {
      endTour();
    }
  };

  window.tourPrev = function() {
    _clearHighlights();
    if (_currentStep > 0) {
      _currentStep--;
      _showStep(_currentStep);
    }
  };

  window.endTour = function() {
    _clearHighlights();
    const tooltip = document.getElementById('tour-tooltip');
    const overlay = document.getElementById('tour-overlay');
    if (tooltip) tooltip.remove();
    if (overlay) overlay.remove();
    try { localStorage.setItem(TOUR_KEY, '1'); } catch (_) {}
  };

  // Auto-start tour for first-time users (delay to let dashboard load)
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (!localStorage.getItem(TOUR_KEY)) {
        startTour();
      }
    }, 2000);
  });
})();
