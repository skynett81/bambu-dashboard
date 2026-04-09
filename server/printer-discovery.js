/**
 * SSDP-based printer discovery for Bambu Lab printers on the local network.
 * Uses node:dgram (UDP) — no external dependencies.
 */
import dgram from 'node:dgram';
import mqtt from 'mqtt';

const SSDP_ADDR = '239.255.255.250';
const SSDP_PORT = 1990;
const SEARCH_TARGET = 'urn:bambulab-com:device:3dprinter:1';

const MODEL_MAP = {
  'BL-P001': 'X1 Carbon', 'BL-P002': 'X1', 'BL-P003': 'X1E',
  'BL-A001': 'A1 mini', 'BL-A003': 'A1', 'BL-A004': 'A1 Combo',
  'C11': 'P1P', 'C12': 'P1S', 'C13': 'P1S Combo',
  'N1': 'P2S', 'N2S': 'P2S Combo', 'N7': 'P2S',
};

export class PrinterDiscovery {
  constructor() {
    this._cache = [];
    this._scanning = false;
  }

  /**
   * Send SSDP M-SEARCH and collect responses for `timeoutMs` milliseconds.
   * Returns array of { ip, serial, model, modelCode, name, signal }
   */
  scan(timeoutMs = 5000) {
    if (this._scanning) return Promise.resolve(this._cache);
    this._scanning = true;

    return new Promise((resolve) => {
      const found = new Map();
      let socket;

      try {
        socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
      } catch {
        this._scanning = false;
        return resolve([]);
      }

      const finish = () => {
        this._scanning = false;
        try { socket.close(); } catch { /* ignore */ }
        this._cache = [...found.values()];
        resolve(this._cache);
      };

      const timer = setTimeout(finish, timeoutMs);

      socket.on('error', () => {
        clearTimeout(timer);
        finish();
      });

      socket.on('message', (msg, rinfo) => {
        const text = msg.toString('utf8');
        if (!text.includes('NOTIFY') && !text.includes('HTTP/1.1 200')) return;

        const headers = {};
        for (const line of text.split('\r\n')) {
          const idx = line.indexOf(':');
          if (idx > 0) {
            headers[line.substring(0, idx).trim().toLowerCase()] = line.substring(idx + 1).trim();
          }
        }

        const serial = headers['usn'] || '';
        const location = headers['location'] || '';
        const modelCode = headers['devmodel.bambu.com'] || '';
        const name = headers['devname.bambu.com'] || '';
        const signal = headers['devsignal.bambu.com'] || '';

        if (!serial) return;

        // Extract IP from Location header or use remote address
        let ip = rinfo.address;
        const locMatch = location.match(/\/\/([^:/]+)/);
        if (locMatch) ip = locMatch[1];

        found.set(serial, {
          ip,
          serial,
          model: MODEL_MAP[modelCode] || modelCode || '',
          modelCode,
          name: name || serial,
          signal: signal ? parseInt(signal, 10) : null,
        });
      });

      socket.bind(0, () => {
        try {
          socket.addMembership(SSDP_ADDR);
        } catch { /* not fatal — responses still arrive as unicast */ }

        const msearch = [
          'M-SEARCH * HTTP/1.1',
          `HOST: ${SSDP_ADDR}:${SSDP_PORT}`,
          'MAN: "ssdp:discover"',
          `ST: ${SEARCH_TARGET}`,
          'MX: 3',
          '', '',
        ].join('\r\n');

        const buf = Buffer.from(msearch);
        // Send twice for reliability
        socket.send(buf, 0, buf.length, SSDP_PORT, SSDP_ADDR, () => {
          setTimeout(() => {
            socket.send(buf, 0, buf.length, SSDP_PORT, SSDP_ADDR, () => {});
          }, 500);
        });
      });
    });
  }

  /**
   * Scan for Moonraker/Klipper printers on the local network.
   * Probes common IPs via HTTP for Moonraker's /printer/info endpoint.
   * @param {string[]} [extraIps] - Additional IPs to probe
   * @param {number} [timeoutMs=3000] - Per-probe timeout
   */
  async scanMoonraker(extraIps = [], timeoutMs = 3000) {
    const ipsToProbe = new Set(extraIps);

    // Get local subnet from network interfaces
    const { networkInterfaces } = await import('node:os');
    const ifaces = networkInterfaces();
    for (const list of Object.values(ifaces)) {
      for (const iface of list) {
        if (iface.internal || iface.family !== 'IPv4') continue;
        const parts = iface.address.split('.');
        // Probe common printer IPs in the same subnet (limited range)
        for (let i = 1; i <= 254; i++) {
          ipsToProbe.add(`${parts[0]}.${parts[1]}.${parts[2]}.${i}`);
        }
      }
    }

    // Remove our own IPs
    for (const list of Object.values(ifaces)) {
      for (const iface of list) ipsToProbe.delete(iface.address);
    }

    const results = [];
    const batchSize = 30;
    const ips = [...ipsToProbe];

    for (let i = 0; i < ips.length; i += batchSize) {
      const batch = ips.slice(i, i + batchSize);
      const probes = batch.map(async (ip) => {
        try {
          const res = await fetch(`http://${ip}:80/printer/info`, { signal: AbortSignal.timeout(timeoutMs) });
          if (!res.ok) return null;
          const data = await res.json();
          if (!data?.result?.hostname) return null;
          return {
            ip,
            serial: data.result.hostname || ip,
            model: 'Moonraker/Klipper',
            modelCode: '',
            name: data.result.hostname || ip,
            signal: null,
            type: 'moonraker',
            software_version: data.result.software_version || '',
            state: data.result.state || '',
          };
        } catch { return null; }
      });
      const batchResults = await Promise.all(probes);
      for (const r of batchResults) {
        if (r) results.push(r);
      }
    }

    return results;
  }

  /**
   * Combined scan — Bambu SSDP + Moonraker HTTP + Snapmaker SACP broadcast
   */
  async scanAll(timeoutMs = 5000, extraIps = []) {
    let sacpResults = [];
    try {
      const { discoverSacpPrinters } = await import('./sacp-client.js');
      sacpResults = await discoverSacpPrinters(3000);
    } catch { /* SACP discovery optional */ }

    // mDNS discovery for Snapmaker Ray (queries _printer._udp.local)
    let mdnsResults = [];
    try {
      mdnsResults = await this._discoverMdns(2000);
    } catch { /* mDNS optional */ }

    const [bambu, moonraker] = await Promise.all([
      this.scan(timeoutMs),
      this.scanMoonraker(extraIps, 3000),
    ]);
    const combined = [...bambu, ...moonraker, ...sacpResults, ...mdnsResults];
    this._cache = combined;
    return combined;
  }

  /**
   * mDNS discovery for Snapmaker Ray (queries _printer._udp.local and _printer._tcp.local)
   */
  async _discoverMdns(timeoutMs = 2000) {
    return new Promise((resolve) => {
      const found = new Map();
      let udpSocket;
      try {
        const dgram = require('node:dgram');
        udpSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
      } catch { resolve([]); return; }

      const timer = setTimeout(() => {
        try { udpSocket.close(); } catch {}
        resolve([...found.values()]);
      }, timeoutMs);

      udpSocket.on('message', (msg, rinfo) => {
        // Simple mDNS response parsing — look for _printer._udp.local PTR records
        const text = msg.toString('utf8');
        if (text.includes('_printer._udp.local') || text.includes('_printer._tcp.local')) {
          found.set(rinfo.address, {
            ip: rinfo.address,
            name: `Snapmaker Ray (${rinfo.address})`,
            model: 'Snapmaker Ray',
            type: 'sacp',
            transport: 'udp',
            mdns: true,
          });
        }
      });

      udpSocket.on('error', () => {
        clearTimeout(timer);
        try { udpSocket.close(); } catch {}
        resolve([]);
      });

      // Send mDNS query to multicast address
      udpSocket.bind(0, () => {
        try {
          // Simple DNS PTR query for _printer._udp.local
          const query = Buffer.from([
            0x00, 0x00, // Transaction ID
            0x00, 0x00, // Flags (standard query)
            0x00, 0x01, // Questions: 1
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // Answer/Auth/Additional: 0
            // Question: _printer._udp.local PTR
            0x08, 0x5f, 0x70, 0x72, 0x69, 0x6e, 0x74, 0x65, 0x72, // _printer
            0x04, 0x5f, 0x75, 0x64, 0x70, // _udp
            0x05, 0x6c, 0x6f, 0x63, 0x61, 0x6c, // local
            0x00, // end
            0x00, 0x0c, // Type: PTR
            0x00, 0x01, // Class: IN
          ]);
          udpSocket.send(query, 5353, '224.0.0.251');
        } catch {}
      });
    });
  }

  getCached() { return this._cache; }
  isScanning() { return this._scanning; }
  shutdown() { this._cache = []; }
}

/**
 * Test MQTT connection to a Bambu Lab printer.
 * Resolves { ok: true } on success, { ok: false, error: string } on failure.
 */
export function testMqttConnection(ip, serial, accessCode, timeoutMs = 8000) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (result) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { client.end(true); } catch { /* ignore */ }
      resolve(result);
    };

    const timer = setTimeout(() => finish({ ok: false, error: 'timeout' }), timeoutMs);

    const client = mqtt.connect(`mqtts://${ip}:8883`, {
      username: 'bblp',
      password: accessCode,
      rejectUnauthorized: false,
      connectTimeout: 6000,
    });

    client.on('connect', () => finish({ ok: true }));
    client.on('error', (err) => finish({ ok: false, error: err.message }));
  });
}
