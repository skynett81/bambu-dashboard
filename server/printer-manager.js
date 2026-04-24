import { PrintTracker } from './print-tracker.js';
import { TelemetrySampler } from './telemetry-sampler.js';
import { CameraStream } from './camera-stream.js';
import { MoonrakerCamera } from './moonraker-camera.js';
import { startHistorySync } from './moonraker-history-sync.js';
import { getPrinters, addFirmwareEntry, addXcamEvent, updatePrinterIp } from './database.js';
import { PrintGuardService } from './print-guard.js';
import { provisionCamera } from './printer-provisioner.js';
import { createLogger } from './logger.js';
import http from 'node:http';
import { networkInterfaces } from 'node:os';

const log = createLogger('printer');

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

  setPluginManager(pm) {
    this._pluginManager = pm;
    for (const [id, entry] of this.printers) {
      if (entry.tracker) this._wireTrackerNotifications(id, entry.config.name, entry.tracker);
    }
  }

  setBambuCloud(cloud) {
    this._bambuCloud = cloud;
    // Inject into existing Bambu MQTT clients
    for (const [, entry] of this.printers) {
      if (entry.client?.setBambuCloud) entry.client.setBambuCloud(cloud);
    }
  }

  _dispatchPlugin(hookName, data) {
    if (this._pluginManager?.dispatch) {
      this._pluginManager.dispatch(hookName, data).catch(() => {});
    }
  }

  _wireTrackerNotifications(printerId, printerName, tracker) {
    if (!this._notifier) return;
    tracker.onPrintStart = (data) => {
      this._notifier.notify('print_started', { ...data, printerName });
      this._dispatchPlugin('onPrintStart', { printerId, printerName, ...data });
    };
    tracker.onPrintEnd = (data) => {
      const eventMap = { completed: 'print_finished', failed: 'print_failed', cancelled: 'print_cancelled' };
      this._notifier.notify(eventMap[data.status] || 'print_finished', { ...data, printerName });
      this._dispatchPlugin('onPrintEnd', { printerId, printerName, ...data });
    };
    tracker.onError = (data) => {
      this._notifier.notify('printer_error', { ...data, printerName });
      this._dispatchPlugin('onError', { printerId, printerName, ...data });
    };
    tracker.onNfcAutoLinked = (data) => {
      if (this.broadcast) this.broadcast('nfc_auto_linked', { ...data, printerName });
    };
    tracker.onBroadcast = (type, data) => {
      if (this.broadcast) this.broadcast(type, { ...data, printerId, printerName });
      if (type === 'progress' || type === 'status') {
        this._dispatchPlugin('onPrintProgress', { printerId, printerName, type, ...data });
      }
    };
  }

  async init() {
    const dbPrinters = getPrinters();
    for (const p of dbPrinters) {
      if (this._canConnect(p)) {
        await this._addLivePrinter(p);
      } else {
        this._addOfflinePrinter(p);
      }
    }

    if (dbPrinters.length === 0) {
      log.info('No printers configured. Add via Settings.');
    }
  }

  _allocCameraPort(existingEntry) {
    // Reuse port from existing entry if available
    if (existingEntry?.cameraPort) return existingEntry.cameraPort;
    const port = this.config.server.cameraWsPortStart + this._nextPortOffset;
    this._nextPortOffset++;
    return port;
  }

  // Detect connector type from printer config
  _getConnectorType(printerConf) {
    // Explicit type in config takes priority
    if (printerConf.type === 'moonraker' || printerConf.type === 'klipper') return 'moonraker';
    if (printerConf.type === 'bambu' || printerConf.type === 'mqtt') return 'bambu';
    if (printerConf.type === 'prusalink') return 'prusalink';
    if (printerConf.type === 'octoprint') return 'octoprint';
    if (printerConf.type === 'sacp') return 'sacp';
    if (printerConf.type === 'ankermake') return 'ankermake';
    if (printerConf.type === 'snapmaker-http' || printerConf.type === 'sm-http') return 'snapmaker-http';
    // Klipper-based brands → Moonraker connector
    if (['creality', 'elegoo', 'anker', 'voron', 'ratrig', 'qidi'].includes(printerConf.type)) return 'moonraker';
    // Auto-detect: Bambu printers use serial + accessCode, Moonraker printers don't need serial
    if (printerConf.serial && printerConf.accessCode) return 'bambu';
    if (printerConf.ip && !printerConf.serial) return 'moonraker';
    return 'bambu'; // fallback
  }

  async _addLivePrinter(printerConf, reusePort) {
    const id = printerConf.id;
    const cameraPort = reusePort || this._allocCameraPort();
    const tracker = new PrintTracker(id);
    const sampler = new TelemetrySampler(id);
    const connectorType = this._getConnectorType(printerConf);

    const connectorHub = {
      broadcast: (type, data) => {
        const enriched = type === 'status' ? { printer_id: id, ...data } : data;
        this.broadcast(type, enriched);
        if (type === 'status') {
          const printData = data.print || data;
          tracker.update(printData);
          sampler.update(printData);
          if (this._notifier) this._notifier.updateBedMonitor(id, printerConf.name, printData);
          if (this.guard) this.guard.processSensorData(id, printData);

          // Snapmaker defect detection — notify + optional auto-pause
          if (printData._sm_defect && printData.gcode_state === 'RUNNING') {
            const dd = printData._sm_defect;
            const threshold = printerConf.defectPauseThreshold ?? 0.9;
            const autoPause = printerConf.defectAutoPause !== false;
            // Check noodle (spaghetti) detection
            if (dd.noodle?.probability > 0.7 && this._notifier) {
              this._notifier.notify('defect_detected', {
                printerId: id, printerName: printerConf.name,
                type: 'spaghetti', probability: dd.noodle.probability,
              });
              // Auto-pause if above threshold and enabled
              if (autoPause && dd.noodle.probability > threshold) {
                const printer = this.printers.get(id);
                if (printer?.client) {
                  const cmd = printer.client._buildCommand?.({ action: 'pause' });
                  if (cmd) printer.client.sendCommand(cmd);
                  log.warn(`[defect] Auto-paused ${printerConf.name}: spaghetti probability ${dd.noodle.probability}`);
                }
              }
            }
          }
        }
      },
      printerState: {}
    };

    let client;
    if (connectorType === 'sacp') {
      const { SacpConnector, buildSacpCommand } = await import('./sacp-connector.js');
      client = new SacpConnector({ printer: printerConf }, connectorHub);
      client._buildCommand = buildSacpCommand;
      log.info(`Using SACP connector for ${printerConf.name}`);
    } else if (connectorType === 'ankermake') {
      const { AnkerMakeClient, buildAnkerMakeCommand } = await import('./ankermake-client.js');
      client = new AnkerMakeClient({ printer: printerConf }, connectorHub);
      client._buildCommand = buildAnkerMakeCommand;
      log.info(`Using AnkerMake (ankerctl) connector for ${printerConf.name}`);
    } else if (connectorType === 'snapmaker-http') {
      const { SnapmakerHttpClient, buildSnapmakerHttpCommand } = await import('./snapmaker-http-client.js');
      client = new SnapmakerHttpClient({ printer: printerConf }, connectorHub);
      client._buildCommand = buildSnapmakerHttpCommand;
      log.info(`Using Snapmaker HTTP connector for ${printerConf.name}`);
    } else if (connectorType === 'octoprint') {
      const { OctoPrintClient, buildOctoPrintCommand } = await import('./octoprint-client.js');
      client = new OctoPrintClient({ printer: printerConf }, connectorHub);
      client._buildCommand = buildOctoPrintCommand;
      log.info(`Using OctoPrint connector for ${printerConf.name}`);
    } else if (connectorType === 'prusalink') {
      const { PrusaLinkClient, buildPrusaLinkCommand } = await import('./prusalink-client.js');
      client = new PrusaLinkClient({ printer: printerConf }, connectorHub);
      client._buildCommand = buildPrusaLinkCommand;
      log.info(`Using PrusaLink connector for ${printerConf.name}`);
    } else if (connectorType === 'moonraker') {
      const { MoonrakerClient, buildMoonrakerCommand } = await import('./moonraker-client.js');
      client = new MoonrakerClient({ printer: printerConf }, connectorHub);
      client._buildCommand = buildMoonrakerCommand;
      log.info(`Using Moonraker connector for ${printerConf.name}`);
    } else {
      const { BambuMqttClient } = await import('./mqtt-client.js');
      const { buildCommandFromClientMessage } = await import('./mqtt-commands.js');
      client = new BambuMqttClient({ printer: printerConf }, connectorHub);
      client._buildCommand = buildCommandFromClientMessage;
      // Inject Bambu Cloud client for firmware version checks
      if (this._bambuCloud && client.setBambuCloud) {
        client.setBambuCloud(this._bambuCloud);
      }
      log.info(`Using Bambu MQTT connector for ${printerConf.name}`);
    }

    // Firmware change detection
    client.onFirmwareInfo = (mod) => {
      try {
        addFirmwareEntry({ printer_id: id, module: mod.name, sw_ver: mod.sw_ver, hw_ver: mod.hw_ver, sn: mod.sn });
      } catch (e) { /* duplicate or error */ }
    };

    // Snapmaker U1 detection — update meta with SM flag
    client.onSmDetected = () => {
      this.setMeta(id, { name: printerConf.name, model: printerConf.model || '', cameraPort, type: connectorType, _isSnapmakerU1: true });
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

    // Camera: Bambu uses TLS/RTSP stream, Moonraker uses HTTP snapshot polling
    let camera = null;
    let moonCamera = null;
    if (connectorType === 'moonraker') {
      // Auto-provision camera first, then start MoonrakerCamera
      try {
        const ok = await provisionCamera(printerConf.ip, printerConf.port || 80);
        log.info(`Camera provisioning for ${printerConf.name} (${printerConf.ip}): ${ok ? 'OK' : 'skipped/failed'}`);
      } catch (e) {
        log.warn(`Camera provisioning for ${printerConf.name} (${printerConf.ip}) threw: ${e.message}`);
      }
      moonCamera = new MoonrakerCamera({
        ...this.config,
        printer: printerConf
      });
    } else {
      camera = new CameraStream({
        ...this.config,
        printer: printerConf,
        server: { ...this.config.server, cameraWsPort: cameraPort }
      });
    }

    this._wireTrackerNotifications(id, printerConf.name, tracker);
    // History sync for Moonraker printers
    let historySync = null;
    if (connectorType === 'moonraker') {
      historySync = startHistorySync(id, printerConf.ip, printerConf.accessCode, printerConf.port || 80);
    }

    this.setMeta(id, { name: printerConf.name, model: printerConf.model || '', cameraPort, type: connectorType });
    this.printers.set(id, { config: printerConf, client, tracker, sampler, camera, moonCamera, historySync, cameraPort, live: true });

    if (camera) camera.start();
    if (moonCamera) moonCamera.start();
    client.connect();
    log.info('Printer connected: ' + printerConf.name + ' (' + printerConf.ip + ')');
    this._dispatchPlugin('onPrinterConnected', { printerId: id, printerName: printerConf.name, ip: printerConf.ip, type: connectorType });
  }

  _addOfflinePrinter(printerConf, reusePort) {
    const id = printerConf.id;
    const cameraPort = reusePort || this._allocCameraPort();

    this.setMeta(id, { name: printerConf.name, model: printerConf.model || '', cameraPort });
    this.printers.set(id, { config: printerConf, client: null, tracker: null, camera: null, cameraPort, live: false });
    log.info('Printer registered (not configured): ' + printerConf.name);
  }

  // Called when a new printer is added via API - auto-connects if configured
  async addPrinter(printerConf) {
    if (this.printers.has(printerConf.id)) {
      return this.updatePrinter(printerConf.id, printerConf);
    }

    const canConnect = this._canConnect(printerConf);
    if (canConnect) {
      await this._addLivePrinter(printerConf);
    } else {
      this._addOfflinePrinter(printerConf);
    }
  }

  // Check if printer has enough config to connect
  _canConnect(printerConf) {
    const type = this._getConnectorType(printerConf);
    if (type === 'moonraker') return !!printerConf.ip;
    return !!(printerConf.ip && printerConf.serial && printerConf.accessCode);
  }

  // Called when a printer is updated via API - reconnects if config changed
  async updatePrinter(id, printerConf) {
    const existing = this.printers.get(id);
    const reusePort = existing?.cameraPort;

    // Tear down old connection
    this._teardown(id);

    // Reconnect with updated config
    if (this._canConnect(printerConf)) {
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
    if (printer.moonCamera) printer.moonCamera.stop();
    if (printer.historySync) printer.historySync.stop();
    this.printers.delete(id);
  }

  /** Get camera snapshot for Moonraker printers. Returns Buffer or null. */
  getMoonrakerSnapshot(printerId) {
    const printer = this.printers.get(printerId);
    return printer?.moonCamera?.getSnapshot() || null;
  }

  handleCommand(msg) {
    const id = msg.printer_id;
    if (!id) {
      log.warn('Command received without printer_id — ignoring (action: ' + msg.action + ')');
      return;
    }

    const printer = this.printers.get(id);
    if (!printer) { log.warn(`Command for unknown printer: ${id}`); return; }
    if (!printer.live || !printer.client) { log.warn(`Command for offline printer: ${id}`); return; }

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
    log.info('Printer removed: ' + id);
    this._dispatchPlugin('onPrinterDisconnected', { printerId: id, printerName: printer.config?.name });
  }

  getPrinterIds() {
    return [...this.printers.keys()];
  }

  // ---- Auto-rediscovery: find printers that changed IP ----

  startAutoRediscovery() {
    const intervalMs = (this.config.network?.rediscoveryIntervalSeconds || 60) * 1000;
    this._scanTimeout = this.config.network?.scanTimeoutMs || 5000;
    this._rediscoveryInterval = setInterval(() => this._checkDisconnected(), intervalMs);
    // Run first check after 30s to give printers time to connect initially
    this._rediscoveryInitial = setTimeout(() => this._checkDisconnected(), 30000);
    const extras = this.config.network?.extraSubnets || [];
    if (extras.length > 0) {
      log.info(`[rediscovery] Extra subnets: ${extras.join(', ')}`);
    }
    log.info(`[rediscovery] Active — checking disconnected printers every ${Math.round(intervalMs / 1000)}s`);
  }

  async _checkDisconnected() {
    const disconnected = [];
    for (const [id, entry] of this.printers) {
      if (!entry.live) { disconnected.push(entry.config); continue; }
      // Check if client is actually connected
      const client = entry.client;
      if (!client) { disconnected.push(entry.config); continue; }
      if (client.connected === false) disconnected.push(entry.config);
    }

    if (disconnected.length === 0) return;

    log.info(`[rediscovery] ${disconnected.length} printer(s) disconnected — searching...`);

    for (const printerConf of disconnected) {
      const newIp = await this._rediscover(printerConf);
      if (newIp && newIp !== printerConf.ip) {
        const oldIp = printerConf.ip;
        log.info(`[rediscovery] ${printerConf.name}: new IP found ${oldIp} → ${newIp}`);
        printerConf.ip = newIp;
        updatePrinterIp(printerConf.id, newIp);
        await this.updatePrinter(printerConf.id, printerConf);
        this.broadcast('printer_ip_changed', { printer_id: printerConf.id, name: printerConf.name, old_ip: oldIp, new_ip: newIp });
      }
    }
  }

  async _rediscover(printerConf) {
    const type = this._getConnectorType(printerConf);

    if (type === 'bambu') {
      return this._rediscoverBambu(printerConf);
    }
    return this._rediscoverMoonraker(printerConf);
  }

  async _rediscoverBambu(printerConf) {
    // Use SSDP scan to find Bambu printers
    try {
      const { PrinterDiscovery } = await import('./printer-discovery.js');
      const scanner = new PrinterDiscovery();
      const found = await scanner.scan(this._scanTimeout || 5000);
      scanner.shutdown();
      const match = found.find(p => p.serial === printerConf.serial);
      return match?.ip || null;
    } catch {
      return null;
    }
  }

  async _rediscoverMoonraker(printerConf) {
    // Scan all local subnets for Moonraker API
    const subnets = this._getLocalSubnets();
    for (const subnet of subnets) {
      const ip = await this._scanSubnetForMoonraker(subnet, printerConf);
      if (ip) return ip;
    }
    return null;
  }

  _getLocalSubnets() {
    const ifaces = networkInterfaces();
    const subnets = new Set();

    // Auto-detect from network interfaces
    for (const entries of Object.values(ifaces)) {
      for (const entry of entries) {
        if (entry.family === 'IPv4' && !entry.internal) {
          const parts = entry.address.split('.');
          parts[3] = '0';
          subnets.add(parts.join('.'));
        }
      }
    }

    // Add manually configured extra subnets
    const extras = this.config.network?.extraSubnets || [];
    for (const subnet of extras) {
      // Normalize: accept "10.30.30.0", "10.30.30.0/24", or "10.30.30"
      const clean = subnet.replace(/\/\d+$/, '').trim();
      const parts = clean.split('.');
      if (parts.length >= 3) {
        if (parts.length === 3) parts.push('0');
        parts[3] = '0';
        subnets.add(parts.join('.'));
      }
    }

    return [...subnets];
  }

  /**
   * Scan a /24 subnet for Moonraker printers.
   * @param {string} subnetBase - e.g. "192.168.10.0"
   * @param {object} printerConf - needs .port (default 80)
   * @param {boolean} findAll - if true, return array of all found; if false, return first match IP string
   * @returns {Promise<string|null|Array>}
   */
  _scanSubnetForMoonraker(subnetBase, printerConf, findAll = false) {
    const port = printerConf.port || 80;
    const parts = subnetBase.split('.');
    const base = parts.slice(0, 3).join('.');
    const timeout = this._scanTimeout || 5000;

    return new Promise((resolve) => {
      const results = [];
      let pending = 254;
      let resolved = false;

      const finish = () => {
        if (resolved) return;
        resolved = true;
        resolve(findAll ? results : (results[0]?.ip || null));
      };

      const done = () => {
        if (--pending <= 0) finish();
      };

      for (let i = 1; i <= 254; i++) {
        const ip = `${base}.${i}`;
        const req = http.get(`http://${ip}:${port}/printer/info`, { timeout: 1500 }, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              const info = JSON.parse(data);
              if (info.result?.hostname || info.result?.state) {
                results.push({
                  ip,
                  hostname: info.result.hostname || '',
                  state: info.result.state || '',
                  software: info.result.software_version || ''
                });
                if (!findAll && !resolved) { resolved = true; resolve(ip); }
              }
            } catch { /* not moonraker */ }
            done();
          });
        });
        req.on('error', done);
        req.on('timeout', () => { req.destroy(); done(); });
      }

      setTimeout(finish, timeout + 5000);
    });
  }

  shutdown() {
    if (this._rediscoveryInterval) clearInterval(this._rediscoveryInterval);
    if (this._rediscoveryInitial) clearTimeout(this._rediscoveryInitial);
    for (const [id, p] of this.printers) {
      if (p.client?.disconnect) p.client.disconnect();
      if (p.client?.stop) p.client.stop();
      if (p.sampler) p.sampler.stop();
      if (p.camera) p.camera.stop();
    }
  }
}
