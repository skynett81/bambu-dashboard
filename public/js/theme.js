// Theme engine — presets + customization, persisted to localStorage
(function() {
  'use strict';

  const STORAGE_KEY = 'bambu-theme';
  const DEFAULT_ACCENT = '#00AE42';
  const DEFAULT_RADIUS = 16;

  const PRESETS = {
    light: {
      '--bg-primary': '#f0f1f5',
      '--bg-secondary': '#ffffff',
      '--bg-tertiary': '#e8eaef',
      '--bg-card': '#ffffff',
      '--bg-elevated': '#ffffff',
      '--bg-inset': 'rgba(0, 0, 0, 0.03)',
      '--text-primary': '#0f172a',
      '--text-secondary': '#475569',
      '--text-muted': '#94a3b8',
      '--border-color': 'rgba(0, 0, 0, 0.06)',
      '--border-subtle': 'rgba(0, 0, 0, 0.04)',
      '--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 4px rgba(0, 0, 0, 0.03)',
      '--shadow-md': '0 2px 8px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.06)',
      '--shadow-lg': '0 4px 12px rgba(0, 0, 0, 0.05), 0 16px 48px rgba(0, 0, 0, 0.08)',
      '--shadow-glow': 'none',
      '--shadow-neon': 'none',
      '--shadow-inset': 'none',
      '--surface-glass': 'rgba(255, 255, 255, 0.72)',
      '--surface-glass-strong': 'rgba(255, 255, 255, 0.88)',
      '--neon-blue': 'transparent',
      '--neon-cyan': 'transparent',
      '--neon-purple': 'transparent',
      '--glow-green': 'rgba(0, 174, 66, 0.08)',
      '--glow-blue': 'rgba(59, 130, 246, 0.06)',
      '--glow-red': 'rgba(239, 68, 68, 0.06)',
      '--glow-cyan': 'rgba(0, 174, 66, 0.06)',
    },
    dark: {
      '--bg-primary': '#1a1d21',
      '--bg-secondary': '#212529',
      '--bg-tertiary': '#2b3035',
      '--bg-card': '#2b3035',
      '--bg-elevated': '#343a40',
      '--bg-inset': 'rgba(0, 0, 0, 0.25)',
      '--text-primary': '#e9ecef',
      '--text-secondary': '#adb5bd',
      '--text-muted': '#6c757d',
      '--border-color': 'rgba(255, 255, 255, 0.08)',
      '--border-subtle': 'rgba(255, 255, 255, 0.05)',
      '--border-glow': 'rgba(13, 110, 253, 0.3)',
      '--card-glow': '0 4px 12px rgba(0, 0, 0, 0.3)',
      '--card-glow-border': 'rgba(255, 255, 255, 0.12)',
      '--shadow-sm': '0 1px 3px rgba(0, 0, 0, 0.3)',
      '--shadow-md': '0 2px 8px rgba(0, 0, 0, 0.35)',
      '--shadow-lg': '0 4px 16px rgba(0, 0, 0, 0.4)',
      '--shadow-glow': 'none',
      '--shadow-neon': 'none',
      '--shadow-inset': 'none',
      '--surface-glass': '#212529',
      '--surface-glass-strong': '#212529',
      '--neon-blue': 'transparent',
      '--neon-cyan': 'transparent',
      '--neon-purple': 'transparent',
      '--accent-green': '#10b3a4',
      '--accent-blue': '#3b82f6',
      '--accent-cyan': '#10b3a4',
      '--glow-green': 'rgba(16, 179, 164, 0.1)',
      '--glow-blue': 'rgba(59, 130, 246, 0.1)',
      '--glow-red': 'rgba(220, 53, 69, 0.1)',
      '--glow-cyan': 'rgba(16, 179, 164, 0.1)',
      '--mesh-gradient': 'none',
    },
    oled: {
      '--bg-primary': '#000000',
      '--bg-secondary': '#0a0a0a',
      '--bg-tertiary': '#141414',
      '--bg-card': '#111111',
      '--bg-elevated': '#1a1a1a',
      '--bg-inset': 'rgba(0, 0, 0, 0.5)',
      '--text-primary': '#e9ecef',
      '--text-secondary': '#adb5bd',
      '--text-muted': '#6c757d',
      '--border-color': 'rgba(255, 255, 255, 0.06)',
      '--border-subtle': 'rgba(255, 255, 255, 0.03)',
      '--border-glow': 'rgba(13, 110, 253, 0.25)',
      '--card-glow': '0 2px 8px rgba(0, 0, 0, 0.5)',
      '--card-glow-border': 'rgba(255, 255, 255, 0.1)',
      '--shadow-sm': '0 1px 3px rgba(0, 0, 0, 0.5)',
      '--shadow-md': '0 2px 8px rgba(0, 0, 0, 0.6)',
      '--shadow-lg': '0 4px 16px rgba(0, 0, 0, 0.7)',
      '--shadow-glow': 'none',
      '--shadow-neon': 'none',
      '--shadow-inset': 'none',
      '--surface-glass': '#0a0a0a',
      '--surface-glass-strong': '#0a0a0a',
      '--neon-blue': 'transparent',
      '--neon-cyan': 'transparent',
      '--neon-purple': 'transparent',
      '--glow-green': 'rgba(25, 135, 84, 0.12)',
      '--glow-blue': 'rgba(13, 110, 253, 0.12)',
      '--glow-red': 'rgba(220, 53, 69, 0.12)',
      '--glow-cyan': 'rgba(13, 202, 240, 0.12)',
      '--mesh-gradient': 'none',
    },
    bambuGreen: {
      '--bg-primary': '#020804',
      '--bg-secondary': 'rgba(6, 18, 11, 0.55)',
      '--bg-tertiary': 'rgba(11, 28, 18, 0.5)',
      '--bg-card': 'rgba(6, 18, 11, 0.5)',
      '--bg-elevated': 'rgba(16, 40, 24, 0.55)',
      '--bg-inset': 'rgba(0, 0, 0, 0.4)',
      '--text-primary': '#e0f5e8',
      '--text-secondary': '#6aaa78',
      '--text-muted': '#5a9b6a',
      '--border-color': 'rgba(0, 220, 110, 0.14)',
      '--border-subtle': 'rgba(0, 220, 110, 0.06)',
      '--border-glow': 'rgba(0, 220, 110, 0.55)',
      '--card-glow': '0 0 40px rgba(0, 212, 106, 0.15), 0 0 80px rgba(0, 212, 106, 0.06)',
      '--card-glow-border': 'rgba(0, 220, 110, 0.4)',
      '--shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.5)',
      '--shadow-md': '0 4px 24px rgba(0, 0, 0, 0.6), 0 0 40px rgba(0, 212, 106, 0.06)',
      '--shadow-lg': '0 8px 48px rgba(0, 0, 0, 0.7), 0 0 60px rgba(0, 212, 106, 0.1)',
      '--shadow-glow': '0 0 20px rgba(0, 212, 106, 0.2)',
      '--shadow-neon': '0 0 30px rgba(0, 212, 106, 0.3)',
      '--shadow-inset': 'inset 0 1px 0 rgba(0, 255, 128, 0.06)',
      '--surface-glass': 'rgba(4, 12, 8, 0.65)',
      '--surface-glass-strong': 'rgba(4, 12, 8, 0.8)',
      '--neon-blue': 'rgba(59, 130, 246, 0.3)',
      '--neon-cyan': 'rgba(0, 220, 110, 0.5)',
      '--neon-purple': 'rgba(139, 92, 246, 0.2)',
      '--glow-green': 'rgba(0, 212, 106, 0.28)',
      '--glow-blue': 'rgba(59, 130, 246, 0.15)',
      '--glow-red': 'rgba(239, 68, 68, 0.15)',
      '--glow-cyan': 'rgba(0, 212, 106, 0.22)',
      '--accent-green': '#00d46a',
      '--mesh-gradient': 'radial-gradient(ellipse 800px 700px at 15% 15%, rgba(0, 220, 110, 0.2) 0%, transparent 65%), radial-gradient(ellipse 600px 600px at 85% 80%, rgba(0, 180, 90, 0.12) 0%, transparent 60%)',
    },
    midnightBlue: {
      '--bg-primary': '#030610',
      '--bg-secondary': 'rgba(8, 14, 24, 0.55)',
      '--bg-tertiary': 'rgba(14, 22, 36, 0.5)',
      '--bg-card': 'rgba(8, 14, 24, 0.5)',
      '--bg-elevated': 'rgba(18, 28, 46, 0.55)',
      '--bg-inset': 'rgba(0, 0, 0, 0.4)',
      '--text-primary': '#e2eaf5',
      '--text-secondary': '#6a84b0',
      '--text-muted': '#5a7aaa',
      '--border-color': 'rgba(77, 170, 255, 0.14)',
      '--border-subtle': 'rgba(77, 170, 255, 0.06)',
      '--border-glow': 'rgba(77, 170, 255, 0.55)',
      '--card-glow': '0 0 40px rgba(77, 159, 255, 0.12), 0 0 80px rgba(77, 159, 255, 0.05)',
      '--card-glow-border': 'rgba(77, 170, 255, 0.35)',
      '--shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.5)',
      '--shadow-md': '0 4px 24px rgba(0, 0, 0, 0.6), 0 0 40px rgba(77, 159, 255, 0.05)',
      '--shadow-lg': '0 8px 48px rgba(0, 0, 0, 0.7), 0 0 60px rgba(77, 159, 255, 0.08)',
      '--shadow-glow': '0 0 20px rgba(77, 159, 255, 0.18)',
      '--shadow-neon': '0 0 30px rgba(77, 159, 255, 0.25)',
      '--shadow-inset': 'inset 0 1px 0 rgba(120, 180, 255, 0.06)',
      '--surface-glass': 'rgba(6, 10, 18, 0.65)',
      '--surface-glass-strong': 'rgba(6, 10, 18, 0.8)',
      '--neon-blue': 'rgba(77, 170, 255, 0.5)',
      '--neon-cyan': 'rgba(0, 200, 80, 0.3)',
      '--neon-purple': 'rgba(139, 92, 246, 0.4)',
      '--glow-green': 'rgba(0, 174, 66, 0.18)',
      '--glow-blue': 'rgba(77, 159, 255, 0.28)',
      '--glow-red': 'rgba(239, 68, 68, 0.15)',
      '--glow-cyan': 'rgba(77, 159, 255, 0.22)',
      '--accent-blue': '#4d9fff',
      '--mesh-gradient': 'radial-gradient(ellipse 800px 600px at 15% 10%, rgba(77, 170, 255, 0.18) 0%, transparent 65%), radial-gradient(ellipse 600px 800px at 85% 80%, rgba(139, 92, 246, 0.14) 0%, transparent 65%)',
    }
  };

  let _config = { preset: 'light', accentColor: null, radius: DEFAULT_RADIUS };
  let _mediaQuery = null;

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        _config.preset = ['light', 'dark', 'auto', 'oled', 'bambuGreen', 'midnightBlue'].includes(parsed.preset) ? parsed.preset : 'light';
        _config.accentColor = typeof parsed.accentColor === 'string' ? parsed.accentColor : null;
        _config.radius = typeof parsed.radius === 'number' ? Math.max(0, Math.min(20, parsed.radius)) : DEFAULT_RADIUS;
      }
    } catch (_) {}
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_config)); } catch (_) {}
  }

  function resolvePreset() {
    if (_config.preset === 'auto') {
      return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    return PRESETS[_config.preset] ? _config.preset : 'light';
  }

  function apply() {
    const resolved = resolvePreset();
    const vars = PRESETS[resolved];
    const root = document.documentElement;

    // Enable smooth theme transition
    document.documentElement.classList.add('theme-transitioning');

    // Apply preset vars
    for (const [key, val] of Object.entries(vars)) {
      root.style.setProperty(key, val);
    }

    // Accent color override
    const accent = _config.accentColor || DEFAULT_ACCENT;
    root.style.setProperty('--accent-green', accent);
    root.style.setProperty('--accent-cyan', accent);
    root.style.setProperty('--accent-primary', accent);

    // Generate glow from accent
    const rgb = hexToRGB(accent);
    if (rgb) {
      const glowOpacity = resolved === 'dark' ? 0.15 : 0.08;
      const glowVal = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${glowOpacity})`;
      root.style.setProperty('--glow-green', glowVal);
      root.style.setProperty('--glow-cyan', glowVal);
    }

    // Radius
    const r = _config.radius;
    root.style.setProperty('--radius', r + 'px');
    root.style.setProperty('--radius-sm', Math.max(r - 4, 2) + 'px');
    root.style.setProperty('--radius-xs', Math.max(r - 8, 0) + 'px');

    // data-theme attribute for CSS selectors (icon visibility etc.)
    const themeFamily = (resolved === 'light') ? 'light' : 'dark';
    root.setAttribute('data-theme', themeFamily);

    // AdminLTE / Bootstrap dark mode attribute
    if (document.body) document.body.setAttribute('data-bs-theme', themeFamily);

    // Update toggle button icon if present
    updateToggleButton(themeFamily);

    // Remove transition class after animation completes
    clearTimeout(window._themeTransTimeout);
    window._themeTransTimeout = setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 400);
  }

  function updateToggleButton(resolved) {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;
    const sunIcon = btn.querySelector('.theme-icon-light');
    const moonIcon = btn.querySelector('.theme-icon-dark');
    if (sunIcon) sunIcon.style.display = resolved === 'dark' ? 'none' : 'block';
    if (moonIcon) moonIcon.style.display = resolved === 'dark' ? 'block' : 'none';
  }

  function hexToRGB(hex) {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
    if (!m) return null;
    return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
  }

  function setupAutoListener() {
    if (_mediaQuery) return;
    if (!window.matchMedia) return;
    _mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    _mediaQuery.addEventListener('change', () => {
      if (_config.preset === 'auto') apply();
    });
  }

  // Public API
  window.theme = {
    get() {
      return { ..._config };
    },

    set(updates) {
      if (updates.preset !== undefined) {
        _config.preset = ['light', 'dark', 'auto', 'oled', 'bambuGreen', 'midnightBlue'].includes(updates.preset) ? updates.preset : 'light';
      }
      if (updates.accentColor !== undefined) {
        _config.accentColor = updates.accentColor;
      }
      if (updates.radius !== undefined) {
        _config.radius = Math.max(0, Math.min(20, updates.radius));
      }
      save();
      apply();
    },

    toggle() {
      const resolved = resolvePreset();
      _config.preset = resolved === 'light' ? 'dark' : 'light';
      save();
      apply();
    },

    getPresets() {
      const result = {};
      for (const key of Object.keys(PRESETS)) {
        result[key] = { ...PRESETS[key] };
      }
      return result;
    },

    getCSSVar(name) {
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    },

    getDefaultAccent() {
      return DEFAULT_ACCENT;
    },

    getDefaultRadius() {
      return DEFAULT_RADIUS;
    }
  };

  // Compact mode toggle
  window.toggleCompactMode = function() {
    const isCompact = document.body.classList.toggle('compact-mode');
    try { localStorage.setItem('compact-mode', isCompact ? '1' : '0'); } catch (_) {}
  };

  // Dashboard columns toggle (2 or 3) — default is 2 for 24-27" monitors
  window.setDashboardColumns = function(cols) {
    const grid = document.getElementById('dashboard-grid');
    if (!grid) return;
    grid.classList.remove('dashboard-cols-2', 'dashboard-cols-3');
    if (cols === 3) grid.classList.add('dashboard-cols-3');
    try { localStorage.setItem('dashboard-columns', String(cols)); } catch (_) {}
  };

  window.getDashboardColumns = function() {
    try {
      const v = localStorage.getItem('dashboard-columns');
      return v === '3' ? 3 : 2;  // Default: 2 columns
    } catch (_) { return 2; }
  };

  // Init immediately
  load();
  setupAutoListener();
  apply();

  // Restore compact mode from localStorage
  try {
    if (localStorage.getItem('compact-mode') === '1') document.body.classList.add('compact-mode');
  } catch (_) {}

  // Restore dashboard columns from localStorage (default: 2 columns)
  try {
    const cols = localStorage.getItem('dashboard-columns');
    if (cols === '3') {
      const waitForGrid = () => {
        const grid = document.getElementById('dashboard-grid');
        if (grid) { grid.classList.add('dashboard-cols-3'); }
        else { requestAnimationFrame(waitForGrid); }
      };
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForGrid);
      } else {
        waitForGrid();
      }
    }
    // 2 columns is default in CSS, no class needed
  } catch (_) {}
})();
