import { PrintTracker } from './print-tracker.js';
import { TelemetrySampler } from './telemetry-sampler.js';
import { CameraStream } from './camera-stream.js';
import { getPrinters, addFirmwareEntry, addXcamEvent } from './database.js';
import { PrintGuardService } from './print-guard.js';

export class PrinterManager {
  constructor(config, broadcastFn, hubSetMeta) {
    this.config = config;
    this.broadcast = broadcastFn;
    this.setMeta = hubSetMeta;
    this.printers = new Map();
    this._nextPortOffset = 0;
    this._notifier = null;
    this.guard = null;
  }

  setNotificationHandler(notifier) {
    this._notifier = notifier;
    this.guard = new PrintGuardService(this, notifier, this.broadcast);
    // Wire up existing live printers
    for (const [id, entry] of this.printers) {
      if (entry.tracker) this._wireTrackerNotifications(id, entry.config.name, entry.tracker);
    }
  }

  _wireTrackerNotifications(printerId, printerName, tracker) {
    if (!this._notifier) return;
    tracker.onPrintStart = (data) => {
      this._notifier.notify('print_started', { ...data, printerName });
    };
    tracker.onPrintEnd = (data) => {
      const eventMap = { completed: 'print_finished', failed: 'print_failed', cancelled: 'print_cancelled' };
      this._notifier.notify(eventMap[data.status] || 'print_finished', { ...data, printerName });
    };
    tracker.onError = (data) => {
      this._notifier.notify('printer_error', { ...data, printerName });
    };
    tracker.onNfcAutoLinked = (data) => {
      if (this.broadcast) this.broadcast('nfc_auto_linked', { ...data, printerName });
    };
    tracker.onBroadcast = (type, data) => {
      if (this.broadcast) this.broadcast(type, { ...data, printerId, printerName });
    };
  }

  async init() {
    const dbPrinters = getPrinters();
    for (const p of dbPrinters) {
      if (p.ip && p.serial && p.accessCode) {
        await this._addLivePrinter(p);
      } else {
        this._addOfflinePrinter(p);
      }
    }

    if (dbPrinters.length === 0) {
      console.log('[server] Ingen printere konfigurert. Legg til via Innstillinger.');
    }
  }

  _allocCameraPort(existingEntry) {
    // Reuse port from existing entry if available
    if (existingEntry?.cameraPort) return existingEntry.cameraPort;
    const port = this.config.server.cameraWsPortStart + this._nextPortOffset;
    this._nextPortOffset++;
    return port;
  }

  async _addLivePrinter(printerConf, reusePort) {
    const id = printerConf.id;
    const cameraPort = reusePort || this._allocCameraPort();
    const tracker = new PrintTracker(id);
    const sampler = new TelemetrySampler(id);

    const { BambuMqttClient } = await import('./mqtt-client.js');
    const { buildCommandFromClientMessage } = await import('./mqtt-commands.js');

    const mqttHub = {
      broadcast: (type, data) => {
        const enriched = type === 'status' ? { printer_id: id, ...data } : data;
        this.broadcast(type, enriched);
        if (type === 'status') {
          const printData = data.print || data;
          tracker.update(printData);
          sampler.update(printData);
          if (this._notifier) this._notifier.updateBedMonitor(id, printerConf.name, printData);
          if (this.guard) this.guard.processSensorData(id, printData);
        }
      },
      printerState: {}
    };

    const client = new BambuMqttClient({ printer: printerConf }, mqttHub);
    client._buildCommand = buildCommandFromClientMessage;

    // Firmware change detection
    client.onFirmwareInfo = (mod) => {
      try {
        addFirmwareEntry({ printer_id: id, module: mod.name, sw_ver: mod.sw_ver, hw_ver: mod.hw_ver, sn: mod.sn });
      } catch (e) { /* duplicate or error */ }
    };

    // XCam event detection
    client.onXcamEvent = (status) => {
      try {
        const eventMap = {
          'spaghetti': 'spaghetti_detected',
          'first_layer': 'first_layer_issue',
          'foreign': 'foreign_object',
          'clump': 'nozzle_clump'
        };
        for (const [key, eventType] of Object.entries(eventMap)) {
          if (status.toLowerCase().includes(key)) {
            addXcamEvent({ printer_id: id, event_type: eventType });
            // Trigger print guard
            const printId = tracker.currentPrint?.id || null;
            if (this.guard) this.guard.handleEvent(id, eventType, printId);
            break;
          }
        }
      } catch (e) { /* ignore */ }
    };

    const camera = new CameraStream({
      ...this.config,
      printer: printerConf,
      server: { ...this.config.server, cameraWsPort: cameraPort }
    });

    this._wireTrackerNotifications(id, printerConf.name, tracker);
    this.setMeta(id, { name: printerConf.name, model: printerConf.model || '', cameraPort });
    this.printers.set(id, { config: printerConf, client, tracker, sampler, camera, cameraPort, live: true });

    camera.start();
    client.connect();
    console.log(`[manager] Printer tilkoblet: ${printerConf.name} (${printerConf.ip})`);
  }

  _addOfflinePrinter(printerConf, reusePort) {
    const id = printerConf.id;
    const cameraPort = reusePort || this._allocCameraPort();

    this.setMeta(id, { name: printerConf.name, model: printerConf.model || '', cameraPort });
    this.printers.set(id, { config: printerConf, client: null, tracker: null, camera: null, cameraPort, live: false });
    console.log(`[manager] Printer registrert (ikke konfigurert): ${printerConf.name}`);
  }

  // Called when a new printer is added via API - auto-connects if configured
  async addPrinter(printerConf) {
    if (this.printers.has(printerConf.id)) {
      return this.updatePrinter(printerConf.id, printerConf);
    }

    if (printerConf.ip && printerConf.serial && printerConf.accessCode) {
      await this._addLivePrinter(printerConf);
    } else {
      this._addOfflinePrinter(printerConf);
    }
  }

  // Called when a printer is updated via API - reconnects if config changed
  async updatePrinter(id, printerConf) {
    const existing = this.printers.get(id);
    const reusePort = existing?.cameraPort;

    // Tear down old connection
    this._teardown(id);

    // Reconnect with updated config
    if (printerConf.ip && printerConf.serial && printerConf.accessCode) {
      await this._addLivePrinter(printerConf, reusePort);
    } else {
      this._addOfflinePrinter(printerConf, reusePort);
    }
  }

  _teardown(id) {
    const printer = this.printers.get(id);
    if (!printer) return;
    if (printer.client?.disconnect) printer.client.disconnect();
    if (printer.sampler) printer.sampler.stop();
    if (printer.camera) printer.camera.stop();
    this.printers.delete(id);
  }

  handleCommand(msg) {
    const id = msg.printer_id;
    if (!id) {
      const firstId = this.printers.keys().next().value;
      if (firstId) msg.printer_id = firstId;
      else return;
    }

    const printer = this.printers.get(msg.printer_id);
    if (!printer || !printer.live || !printer.client) return;

    const cmd = printer.client._buildCommand?.(msg);
    if (cmd) printer.client.sendCommand(cmd);
  }

  removePrinter(id) {
    const printer = this.printers.get(id);
    if (!printer) return;
    if (printer.client?.disconnect) printer.client.disconnect();
    if (printer.client?.stop) printer.client.stop();
    if (printer.camera) printer.camera.stop();
    this.printers.delete(id);
    console.log(`[manager] Printer fjernet: ${id}`);
  }

  getPrinterIds() {
    return [...this.printers.keys()];
  }

  shutdown() {
    for (const [id, p] of this.printers) {
      if (p.client?.disconnect) p.client.disconnect();
      if (p.client?.stop) p.client.stop();
      if (p.sampler) p.sampler.stop();
      if (p.camera) p.camera.stop();
    }
  }
}
