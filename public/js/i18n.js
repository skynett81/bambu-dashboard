// i18n - Lightweight internationalization module
(function() {
  const DEFAULT_LOCALE = 'nb';
  const SUPPORTED_LOCALES = [
    'nb', 'en', 'de', 'fr', 'es', 'it', 'ja', 'ko',
    'nl', 'pl', 'pt_BR', 'ru', 'sv', 'tr', 'uk', 'zh_CN',
    'cs', 'hu'
  ];

  const LOCALE_NAMES = {
    nb: 'Norsk Bokmål', en: 'English', de: 'Deutsch', fr: 'Français',
    es: 'Español', it: 'Italiano', ja: '日本語', ko: '한국어',
    nl: 'Nederlands', pl: 'Polski', pt_BR: 'Português (Brasil)',
    ru: 'Русский', sv: 'Svenska', tr: 'Türkçe', uk: 'Українська',
    zh_CN: '简体中文', cs: 'Čeština', hu: 'Magyar'
  };

  let _locale = localStorage.getItem('bambu-lang') || DEFAULT_LOCALE;
  let _translations = {};
  let _fallback = {};
  let _ready = false;

  function resolve(obj, key) {
    const parts = key.split('.');
    let val = obj;
    for (const p of parts) {
      if (val == null) return undefined;
      val = val[p];
    }
    return val;
  }

  function interpolate(str, vars) {
    if (!vars || typeof str !== 'string') return str;
    return str.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] !== undefined ? vars[k] : `{{${k}}}`);
  }

  // Core translation function - available globally
  window.t = function(key, vars) {
    let val = resolve(_translations, key);
    if (val == null) val = resolve(_fallback, key);
    if (val == null) return key;
    return interpolate(String(val), vars);
  };

  function translateStaticElements() {
    document.querySelectorAll('[data-i18n-key]').forEach(el => {
      const k = el.getAttribute('data-i18n-key');
      const attr = el.getAttribute('data-i18n-attr');
      if (attr) {
        el.setAttribute(attr, t(k));
      } else {
        el.textContent = t(k);
      }
    });
  }

  window.i18n = {
    getLocale() { return _locale; },
    getDefaultLocale() { return DEFAULT_LOCALE; },
    getSupportedLocales() { return SUPPORTED_LOCALES; },
    getLocaleNames() { return LOCALE_NAMES; },
    isReady() { return _ready; },

    async setLocale(locale) {
      if (!SUPPORTED_LOCALES.includes(locale)) locale = DEFAULT_LOCALE;
      _locale = locale;
      localStorage.setItem('bambu-lang', locale);

      try {
        const res = await fetch(`/lang/${locale}.json`);
        _translations = await res.json();
      } catch (e) {
        console.warn(`[i18n] Kunne ikke laste ${locale}, bruker ${DEFAULT_LOCALE}`);
        _locale = DEFAULT_LOCALE;
        _translations = _fallback;
      }

      document.documentElement.lang = locale.replace('_', '-');
      translateStaticElements();

      if (typeof refreshAllComponents === 'function') {
        refreshAllComponents();
      }
    },

    async init() {
      // Load fallback (nb) first
      try {
        const res = await fetch(`/lang/${DEFAULT_LOCALE}.json`);
        _fallback = await res.json();
      } catch (e) {
        console.error('[i18n] Kunne ikke laste fallback-oversettelser');
      }

      // Load selected locale
      if (_locale !== DEFAULT_LOCALE) {
        try {
          const res = await fetch(`/lang/${_locale}.json`);
          _translations = await res.json();
        } catch (e) {
          _translations = _fallback;
          _locale = DEFAULT_LOCALE;
        }
      } else {
        _translations = _fallback;
      }

      document.documentElement.lang = _locale.replace('_', '-');
      _ready = true;
      translateStaticElements();
    }
  };
})();
