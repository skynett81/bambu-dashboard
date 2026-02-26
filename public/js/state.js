class StateStore {
  constructor() {
    this._printers = {};         // { printerId: state }
    this._printerMeta = {};      // { printerId: { name, model, cameraPort } }
    this._activePrinterId = null;
    this._listeners = new Map();
  }

  // Multi-printer methods
  setActivePrinter(id) {
    this._activePrinterId = id;
    this._notifyAll();
  }

  getActivePrinterId() {
    return this._activePrinterId;
  }

  getActivePrinterState() {
    return this._printers[this._activePrinterId] || {};
  }

  getActivePrinterMeta() {
    return this._printerMeta[this._activePrinterId] || {};
  }

  getPrinterIds() {
    const ids = new Set([...Object.keys(this._printerMeta), ...Object.keys(this._printers)]);
    return [...ids];
  }

  updatePrinter(printerId, data) {
    if (!this._printers[printerId]) this._printers[printerId] = {};
    this._printers[printerId] = this._deepMerge(this._printers[printerId], data);

    if (!this._activePrinterId) {
      this._activePrinterId = printerId;
    }

    if (printerId === this._activePrinterId) {
      this._notifyAll();
    }
  }

  setPrinterMeta(printerId, meta) {
    this._printerMeta[printerId] = meta;
  }

  replacePrinterMeta(newMeta) {
    this._printerMeta = newMeta;
  }

  removePrinter(printerId) {
    delete this._printers[printerId];
    delete this._printerMeta[printerId];
    if (this._activePrinterId === printerId) {
      const remaining = this.getPrinterIds();
      this._activePrinterId = remaining.length > 0 ? remaining[0] : null;
      this._notifyAll();
    }
  }

  // Legacy get/set for backward compat
  get(path) {
    const state = this.getActivePrinterState();
    if (!path) return state;
    const keys = path.split('.');
    let value = state;
    for (const key of keys) {
      if (value == null) return undefined;
      value = value[key];
    }
    return value;
  }

  set(path, value) {
    // For connection status etc.
    if (!this._activePrinterId) return;
    if (!path) return;
    const keys = path.split('.');
    let obj = this._printers[this._activePrinterId];
    if (!obj) return;
    for (let i = 0; i < keys.length - 1; i++) {
      if (obj[keys[i]] == null || typeof obj[keys[i]] !== 'object') {
        obj[keys[i]] = {};
      }
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    this._notify(path, value);
  }

  subscribe(path, callback) {
    if (!this._listeners.has(path)) {
      this._listeners.set(path, new Set());
    }
    this._listeners.get(path).add(callback);
    return () => {
      const set = this._listeners.get(path);
      if (set) set.delete(callback);
    };
  }

  _notify(changedPath, value) {
    for (const [path, callbacks] of this._listeners) {
      if (changedPath.startsWith(path) || path.startsWith(changedPath) || path === '*') {
        for (const cb of callbacks) {
          cb(this.get(path), changedPath);
        }
      }
    }
  }

  _notifyAll() {
    for (const [path, callbacks] of this._listeners) {
      for (const cb of callbacks) {
        cb(this.get(path), '*');
      }
    }
  }

  _deepMerge(target, source) {
    if (!source) return target;
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this._deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }
}

window.printerState = new StateStore();
