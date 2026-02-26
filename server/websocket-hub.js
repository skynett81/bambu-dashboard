import { WebSocketServer } from 'ws';

export class WebSocketHub {
  constructor(server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.clients = new Set();
    this.printerStates = {};   // { printerId: state }
    this.printerMeta = {};     // { printerId: { name, model, cameraPort } }
    this.onCommand = null;

    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      console.log(`[ws] Klient tilkoblet (${this.clients.size} totalt)`);

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
          if (msg.type === 'command' && this.onCommand) {
            this.onCommand(msg);
          }
        } catch (e) {
          console.warn('[ws] Ugyldig melding:', e.message);
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`[ws] Klient frakoblet (${this.clients.size} totalt)`);
      });

      ws.on('error', (err) => {
        console.warn('[ws] Feil:', err.message);
        this.clients.delete(ws);
      });
    });
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
  }

  broadcast(type, data) {
    if (type === 'status' && data.printer_id) {
      this.printerStates[data.printer_id] = data;
    }
    const msg = JSON.stringify({ type, data });
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
