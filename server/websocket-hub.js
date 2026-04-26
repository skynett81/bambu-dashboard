import { WebSocketServer } from 'ws';
import { isAuthEnabled, getSessionToken, validateSession, getSessionUser, hasPermission } from './auth.js';
import { onLog, offLog, createLogger } from './logger.js';
import { recordWsConnect, recordWsDisconnect, recordWsMessage } from './analytics.js';
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
      // Auth check for WebSocket — supports cookie, query param, or first-message auth
      if (isAuthEnabled()) {
        const token = getSessionToken(req);
        if (validateSession(token)) {
          const session = getSessionUser(token);
          ws._user = session || { permissions: ['view'] };
          ws._authenticated = true;
        } else {
          // Allow first-message auth: client must send { type: 'auth', token: '...' } within 5s
          ws._authenticated = false;
          ws._user = { permissions: [] };
          ws._authTimer = setTimeout(() => {
            if (!ws._authenticated) {
              ws.close(4001, 'Authentication timeout');
            }
          }, 5000);
        }
      } else {
        ws._user = { permissions: ['*'] };
        ws._authenticated = true;
      }

      this.clients.add(ws);
      try { recordWsConnect(); } catch {}
      log.info(`Client connected (${this.clients.size} total)`);

      // Send all printer states + meta on connect (only if already authenticated)
      if (ws._authenticated) {
        ws.send(JSON.stringify({
          type: 'init',
          data: {
            printers: this.printerMeta,
            states: this.printerStates
          }
        }));
      }

      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString());

          // First-message auth: { type: 'auth', token: '<session_token>' }
          if (msg.type === 'auth' && !ws._authenticated) {
            if (msg.token && validateSession(msg.token)) {
              ws._authenticated = true;
              if (ws._authTimer) { clearTimeout(ws._authTimer); ws._authTimer = null; }
              const session = getSessionUser(msg.token);
              ws._user = session || { permissions: ['view'] };
              // Send init data now that auth is confirmed
              ws.send(JSON.stringify({
                type: 'init',
                data: { printers: this.printerMeta, states: this.printerStates }
              }));
            } else {
              ws.close(4001, 'Invalid token');
            }
            return;
          }

          // Block unauthenticated messages
          if (!ws._authenticated) return;

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
          log.warn('Invalid message: ' + e.message);
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        try { recordWsDisconnect(); } catch {}
        log.info(`Client disconnected (${this.clients.size} total)`);
      });

      ws.on('error', (err) => {
        log.warn('Error: ' + err.message);
        this.clients.delete(ws);
      });
    });

    // Stream server logs to subscribed clients. Stash the closure so close()
    // can offLog() it — otherwise re-instantiating the hub leaks closures.
    this._logListener = ({ ts, level, prefix, msg }) => {
      if (level === 'debug') return;
      const logMsg = JSON.stringify({ type: 'log_entry', data: { ts, level, prefix, msg } });
      for (const ws of this.clients) {
        if (ws.readyState === 1 && ws._subscribedLogs) {
          ws.send(logMsg);
        }
      }
    };
    onLog(this._logListener);
  }

  // Process-shutdown / re-instantiation cleanup.
  close() {
    if (this._logListener) {
      try { offLog(this._logListener); } catch {}
      this._logListener = null;
    }
    for (const ws of this.clients) {
      try { ws.terminate(); } catch {}
    }
    this.clients.clear();
    try { this.wss?.close?.(); } catch {}
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

    let sent = 0;
    const dead = [];
    for (const ws of this.clients) {
      if (ws.readyState === 1 && ws._authenticated) {
        // Send-error callback drops sockets whose write buffer is broken
        // (TCP-stalled, half-closed without 'close' event, etc.)
        ws.send(msg, (err) => { if (err) { try { ws.terminate(); } catch {} this.clients.delete(ws); } });
        sent++;
      } else if (ws.readyState >= 2) {
        // CLOSING (2) or CLOSED (3) — drop from set; 'close' may have been
        // missed for various reasons (already-closed under TLS, etc.).
        dead.push(ws);
      }
    }
    for (const ws of dead) this.clients.delete(ws);
    // Track WS messages for analytics
    if (sent > 0) { try { recordWsMessage('out', msg.length * sent); } catch {} }
  }

  getClientCount() {
    return this.clients.size;
  }
}
