// i18n - Lightweight internationalization module
(function() {
  const DEFAULT_LOCALE = 'en';
  const SUPPORTED_LOCALES = ['en'];

  const LOCALE_NAMES = {
    en: 'English'
  };

  const LOCALE_CURRENCY = { en: 'USD' };
  const LOCALE_TAG = { en: 'en-US' };
  const FALLBACK_RATES = {};

  let _locale = 'en'; // English only — ignore stored preference
  let _translations = {};
  let _fallback = {};
  let _ready = false;
  let _exchangeRates = null; // { rates: { NOK: 9.57, EUR: 0.85, ... }, fetched: timestamp }

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

  // ---- Global currency utilities ----
  async function _fetchExchangeRates() {
    // Cache for 1 hour
    if (_exchangeRates && Date.now() - _exchangeRates.fetched < 3600000) return;
    try {
      const r = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await r.json();
      if (data && data.rates) {
        _exchangeRates = { rates: data.rates, fetched: Date.now() };
        return;
      }
    } catch {}
    // Use fallback rates
    _exchangeRates = { rates: FALLBACK_RATES, fetched: Date.now() };
  }

  function _getCurrency() {
    // The user's explicit currency choice (Settings → General → Preferences)
    // wins over the locale-default. Falls back to LOCALE_CURRENCY only when
    // the currency utility hasn't bootstrapped yet.
    if (typeof window.currency !== 'undefined' && window.currency.active) {
      return window.currency.active;
    }
    return LOCALE_CURRENCY[_locale] || 'USD';
  }

  function _getTag() {
    // Match the active currency's locale when known, so 1234 NOK shows as
    // "1 234,00 kr" not "$1,234.00 (NOK)" or similar mismatch.
    if (typeof window.currency !== 'undefined' && window.currency.active) {
      const list = window.currency.list ? window.currency.list() : [];
      const cur = list.find(c => c.code === window.currency.active);
      if (cur?.locale) return cur.locale;
    }
    return LOCALE_TAG[_locale] || 'en-US';
  }

  function _getRate(currency) {
    if (currency === 'USD') return 1;
    if (_exchangeRates && _exchangeRates.rates[currency]) return _exchangeRates.rates[currency];
    return FALLBACK_RATES[currency] || 1;
  }

  // Format an amount already in the user's local currency (e.g. spool costs, print costs)
  window.formatCurrency = function(amount, decimals) {
    if (amount == null || isNaN(amount)) return '';
    const currency = _getCurrency();
    const tag = _getTag();
    const d = decimals != null ? decimals : (Math.abs(amount) >= 100 ? 0 : 2);
    try {
      return new Intl.NumberFormat(tag, {
        style: 'currency', currency, minimumFractionDigits: d, maximumFractionDigits: d
      }).format(amount);
    } catch {
      return currency + ' ' + (d > 0 ? amount.toFixed(d) : Math.round(amount));
    }
  };

  // Convert USD amount to local currency and format
  window.formatFromUSD = function(usd, decimals) {
    if (!usd || isNaN(usd)) return '';
    const currency = _getCurrency();
    const rate = _getRate(currency);
    const converted = usd * rate;
    const d = decimals != null ? decimals : 0;
    const tag = _getTag();
    try {
      return new Intl.NumberFormat(tag, {
        style: 'currency', currency, minimumFractionDigits: d, maximumFractionDigits: d
      }).format(Math.round(converted));
    } catch {
      return currency + ' ' + Math.round(converted);
    }
  };

  // Get currency code for the current locale
  window.currencyCode = function() {
    return _getCurrency();
  };

  // Get the currency symbol only (e.g. kr, $, €)
  window.currencySymbol = function() {
    const tag = _getTag();
    const currency = _getCurrency();
    try {
      return new Intl.NumberFormat(tag, { style: 'currency', currency }).formatToParts(0)
        .find(p => p.type === 'currency')?.value || currency;
    } catch {
      return currency;
    }
  };

  // Ensure exchange rates are loaded (call once at startup)
  window.loadExchangeRates = _fetchExchangeRates;

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
        const res = await fetch(`/lang/${locale}.json?v=${Date.now()}`);
        _translations = await res.json();
      } catch (e) {
        console.warn(`[i18n] Could not load ${locale}, using ${DEFAULT_LOCALE}`);
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
      // Load fallback first (cache-bust to avoid stale translations)
      try {
        const res = await fetch(`/lang/${DEFAULT_LOCALE}.json?v=${Date.now()}`);
        _fallback = await res.json();
      } catch (e) {
        console.error('[i18n] Could not load fallback translations');
      }

      // Load selected locale
      if (_locale !== DEFAULT_LOCALE) {
        try {
          const res = await fetch(`/lang/${_locale}.json?v=${Date.now()}`);
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

      // Pre-fetch exchange rates in background
      _fetchExchangeRates();
    }
  };
})();
