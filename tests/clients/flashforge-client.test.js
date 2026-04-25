// flashforge-client.test.js — FlashForgeClient unit tests with mocked
// TCP socket. We exercise the FNet command framing (~M### commands +
// `\r\nok\r\n` response delimiter) and status parser without touching
// real hardware.

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';

import { FlashForgeClient, buildFlashForgeCommand } from '../../server/flashforge-client.js';

// ── Tiny FNet mock server ──────────────────────────────────────────
let server, port;
const received = [];

const RESPONSES = {
  '~M601 S1':  'CMD M601 Received.\r\nControl Success.',
  '~M119':     'CMD M119 Received.\r\nEndstop: X-max:0 Y-max:0 Z-max:0\r\nMachineStatus: BUILDING_FROM_SD\r\nMoveMode: WAIT_ON_TOOL\r\nStatus: S:1 L:0 J:0 F:1\r\nLED: 1\r\nCurrentFile: test.gcode',
  '~M105':     'CMD M105 Received.\r\nT0:215.0/220.0 T1:0.0/0.0 B:60.0/60.0',
  '~M27':      'CMD M27 Received.\r\nSD printing byte 4500/10000',
  '~M25':      'CMD M25 Received.\r\nPaused.',
  '~M104 S220':'CMD M104 Received.',
  '~M115':     'CMD M115 Received.\r\nMachine Type: FlashForge Adventurer 5M Pro\r\nFirmware: 1.5.2',
};

before(async () => {
  server = net.createServer((socket) => {
    let buf = '';
    socket.on('data', (chunk) => {
      buf += chunk.toString('utf8');
      let nl;
      while ((nl = buf.indexOf('\r\n')) !== -1) {
        const line = buf.slice(0, nl);
        buf = buf.slice(nl + 2);
        received.push(line);
        const body = RESPONSES[line] || `CMD ${line} Received.`;
        socket.write(`${body}\r\nok\r\n`);
      }
    });
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  port = server.address().port;
});

after(() => server.close());

function makeClient() {
  // Use a custom port via a sub-class hack — the real client hard-codes
  // port 8899, so we re-set _socket via a lightweight subclass.
  class TestableClient extends FlashForgeClient {
    connect() {
      const socket = net.createConnection({ host: this.ip, port }); // override
      this._socket = socket;
      socket.setEncoding('utf8');
      socket.on('connect', () => this._onConnect());
      socket.on('data', (c) => this._onData(c));
      socket.on('error', () => {});
      socket.on('close', () => this._onClose());
    }
  }
  return new TestableClient({ printer: { ip: '127.0.0.1', id: 't1' } }, { broadcast: () => {} });
}

describe('FlashForgeClient FNet protocol', () => {
  it('logs in via M601 on connect and starts heartbeat', async () => {
    received.length = 0;
    const c = makeClient();
    c.connect();
    await new Promise(r => setTimeout(r, 250));
    assert.ok(c.connected, 'should be connected after M601');
    assert.equal(received[0], '~M601 S1');
    c.disconnect();
  });

  it('parses M119/M105/M27 status into the standard schema', async () => {
    received.length = 0;
    const c = makeClient();
    c.connect();
    await new Promise(r => setTimeout(r, 100));
    await c._poll();
    assert.equal(c.state.gcode_state, 'RUNNING');
    assert.equal(c.state._flashforge_status, 'building_from_sd');
    assert.equal(c.state.nozzle_temper, 215);
    assert.equal(c.state.nozzle_target_temper, 220);
    assert.equal(c.state.bed_temper, 60);
    assert.equal(c.state.bed_target_temper, 60);
    assert.equal(c.state.mc_percent, 45);   // 4500/10000
    c.disconnect();
  });

  it('sendCommand("pause") sends ~M25', async () => {
    received.length = 0;
    const c = makeClient();
    c.connect();
    await new Promise(r => setTimeout(r, 100));
    await c.sendCommand({ action: 'pause' });
    assert.ok(received.includes('~M25'));
    c.disconnect();
  });

  it('sendCommand("set_temp_nozzle", 220) sends ~M104 S220', async () => {
    received.length = 0;
    const c = makeClient();
    c.connect();
    await new Promise(r => setTimeout(r, 100));
    await c.sendCommand({ action: 'set_temp_nozzle', target: 220 });
    assert.ok(received.includes('~M104 S220'));
    c.disconnect();
  });

  it('getPrinterInfo issues ~M115', async () => {
    received.length = 0;
    const c = makeClient();
    c.connect();
    await new Promise(r => setTimeout(r, 100));
    const info = await c.getPrinterInfo();
    assert.match(info.firmware, /Adventurer 5M Pro/);
    assert.match(info.firmware, /Firmware: 1\.5\.2/);
    c.disconnect();
  });
});

describe('buildFlashForgeCommand', () => {
  it('namespaces the action under _flashforge_action', () => {
    const out = buildFlashForgeCommand({ action: 'pause' });
    assert.equal(out._flashforge_action, 'pause');
  });
});
