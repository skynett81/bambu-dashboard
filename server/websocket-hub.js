import { WebSocketServer } from 'ws';
import { isAuthEnabled, getSessionToken, validateSession, getSessionUser, hasPermission } from './auth.js';
import { onLog, createLogger } from './logger.js';
const log = createLogger('ws');

export class WebSocketHub {
  constructor(server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.clients = new Set();
    this.printerStates = {};   // { printerId: state }
    this.printerMeta = {};     // { printerId: { name, model, cameraPort } }
    this._lastState = new Map(); // printerId -> last sent state (for delta compression)
    this.onCommand = null;

    this.wss.on('connection', (ws, req) => {
      // Auth check for WebSocket
      if (isAuthEnabled()) {
        const token = getSessionToken(req);
        if (!validateSession(token)) {
          ws.close(4001, 'Unauthorized');
          return;
        }
        // Store user permissions on the WebSocket connection
        const session = getSessionUser(token);
        ws._user = session || { permissions: ['view'] };
      } else {
        ws._user = { permissions: ['*'] };
      }

      this.clients.add(ws);
      log.info(`Klient tilkoblet (${this.clients.size} totalt)`);

      // Send all printer states + meta on connect
      ws.send(JSON.stringify({
        type: 'init',
        data: {
          printers: this.printerMeta,
          states: this.printerStates
        }
      }));

      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.type === 'subscribe_logs') {
            ws._subscribedLogs = true;
            return;
          }
          if (msg.type === 'unsubscribe_logs') {
            ws._subscribedLogs = false;
            return;
          }
          if (msg.type === 'subscribe_mqtt_debug') {
            ws._subscribedMqttDebug = true;
            return;
          }
          if (msg.type === 'unsubscribe_mqtt_debug') {
            ws._subscribedMqttDebug = false;
            return;
          }
          if (msg.type === 'command' && this.onCommand) {
            if (!hasPermission(ws._user?.permissions, 'controls')) {
              ws.send(JSON.stringify({ type: 'error', data: { error: 'Forbidden', message: 'Permission denied: controls' } }));
              return;
            }
            this.onCommand(msg);
          }
        } catch (e) {
          log.warn('Ugyldig melding: ' + e.message);
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        log.info(`Klient frakoblet (${this.clients.size} totalt)`);
      });

      ws.on('error', (err) => {
        log.warn('Feil: ' + err.message);
        this.clients.delete(ws);
      });
    });

    // Stream server logs to subscribed clients
    onLog(({ ts, level, prefix, msg }) => {
      // Skip debug logs to avoid noise
      if (level === 'debug') return;
      const logMsg = JSON.stringify({ type: 'log_entry', data: { ts, level, prefix, msg } });
      for (const ws of this.clients) {
        if (ws.readyState === 1 && ws._subscribedLogs) {
          ws.send(logMsg);
        }
      }
    });
  }

  broadcastMqttDebug(printerId, direction, topic, payload) {
    const msg = JSON.stringify({
      type: 'mqtt_debug',
      data: { printer_id: printerId, direction, topic, payload, ts: new Date().toISOString() }
    });
    for (const ws of this.clients) {
      if (ws.readyState === 1 && ws._subscribedMqttDebug) {
        ws.send(msg);
      }
    }
  }

  setPrinterMeta(printerId, meta) {
    this.printerMeta[printerId] = meta;
  }

  updatePrinterMeta(printerId, meta) {
    this.printerMeta[printerId] = { ...this.printerMeta[printerId], ...meta };
  }

  removePrinterMeta(printerId) {
    delete this.printerMeta[printerId];
    delete this.printerStates[printerId];
    this._lastState.delete(printerId);
  }

  broadcast(type, data) {
    if (type === 'status' && data.printer_id) {
      this.printerStates[data.printer_id] = data;
    }

    let msg;

    // Delta compression for status updates
    if (type === 'status' && data.printer_id) {
      const pid = data.printer_id;
      const last = this._lastState.get(pid);
      if (last) {
        const delta = {};
        let hasChanges = false;
        for (const [key, value] of Object.entries(data)) {
          if (key === 'printer_id') { delta.printer_id = value; continue; }
          if (key === 'print' && typeof value === 'object' && last.print) {
            // Deep diff print sub-object
            const printDelta = {};
            let printChanged = false;
            for (const [pk, pv] of Object.entries(value)) {
              if (JSON.stringify(pv) !== JSON.stringify(last.print[pk])) {
                printDelta[pk] = pv;
                printChanged = true;
              }
            }
            if (printChanged) { delta.print = printDelta; hasChanges = true; }
          } else if (JSON.stringify(value) !== JSON.stringify(last[key])) {
            delta[key] = value;
            hasChanges = true;
          }
        }
        if (!hasChanges) return; // Nothing changed, skip broadcast
        this._lastState.set(pid, JSON.parse(JSON.stringify(data)));
        msg = JSON.stringify({ type, data: delta, delta: true });
      } else {
        this._lastState.set(pid, JSON.parse(JSON.stringify(data)));
        msg = JSON.stringify({ type, data });
      }
    } else {
      msg = JSON.stringify({ type, data });
    }

    for (const ws of this.clients) {
      if (ws.readyState === 1) {
        ws.send(msg);
      }
    }
  }

  getClientCount() {
    return this.clients.size;
  }
}
