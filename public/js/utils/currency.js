/**
 * Currency utilities — frontend façade for /api/currency.
 *
 * Loads active currency + rates once at boot, exposes:
 *   window.currency.format(amountInUsd)       → "kr 123,45"
 *   window.currency.convert(amount, from, to) → number
 *   window.currency.list()                    → [{code, name, symbol, locale}]
 *   window.currency.active                    → 'NOK'
 *   window.currency.set(code)                 → updates server + reloads
 */
(function () {
  'use strict';

  const cache = { active: 'USD', rates: { USD: 1 }, list: [] };

  async function _bootstrap() {
    try {
      const data = await (await fetch('/api/currency')).json();
      cache.active = data.active;
      cache.rates = data.rates;
      cache.list = data.supported || [];
      // Refresh rates if older than 24h
      if (!data.fresh) {
        try { await fetch('/api/currency/refresh-rates', { method: 'POST' }); } catch {}
      }
    } catch (e) {
      console.warn('[currency] bootstrap failed:', e.message);
    }
  }

  function _format(amount, code = cache.active) {
    const cur = cache.list.find(c => c.code === code) || { code: 'USD', symbol: '$', locale: 'en-US' };
    try {
      return new Intl.NumberFormat(cur.locale, { style: 'currency', currency: cur.code }).format(amount);
    } catch {
      return `${cur.symbol} ${(+amount).toFixed(2)}`;
    }
  }

  function _convert(amount, from, to) {
    if (from === to || !Number.isFinite(amount)) return amount;
    const usd = amount / (cache.rates[from] || 1);
    return usd * (cache.rates[to] || 1);
  }

  function _displayUsd(amountUsd) {
    return _format(_convert(amountUsd, 'USD', cache.active), cache.active);
  }

  async function _set(code) {
    const res = await fetch('/api/currency/active', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) throw new Error('set currency failed');
    cache.active = code;
    window.dispatchEvent(new CustomEvent('currency-changed', { detail: { code } }));
    // Best-effort refresh: reopen the active overlay panel and update the
    // active dashboard so existing price-rendering code re-runs through
    // the new active currency.
    try {
      if (window._activePanel && typeof window.openPanel === 'function') {
        window.openPanel(window._activePanel, true);
      }
      if (typeof window.updateDashboard === 'function') {
        const ps = window.printerState;
        const pid = ps?.getActivePrinterId?.();
        const st = pid ? ps?._printers?.[pid] : null;
        if (st) window.updateDashboard(st.print || st);
      }
    } catch {}
  }

  window.currency = {
    bootstrap: _bootstrap,
    format: _format,
    convert: _convert,
    displayUsd: _displayUsd,
    set: _set,
    list: () => cache.list.slice(),
    get active() { return cache.active; },
    get rates() { return { ...cache.rates }; },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _bootstrap);
  } else {
    _bootstrap();
  }
})();
