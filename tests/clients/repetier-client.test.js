// repetier-client.test.js — RepetierClient unit tests with mocked HTTP.

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

import { RepetierClient, buildRepetierCommand } from '../../server/repetier-client.js';

let server, port;
const calls = [];

before(async () => {
  server = http.createServer((req, res) => {
    calls.push({ method: req.method, url: req.url });
    if (req.url.startsWith('/printer/info')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ printers: [{ slug: 'mk3', online: 1 }] }));
      return;
    }
    if (req.url.match(/\/printer\/api\/[^?]+\?a=stateList/)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        mk3: {
          activeJob: 'cube.gcode',
          paused: false,
          done: 42,
          printedTimeComp: 720,
          extruder: [{ tempRead: 215.5, tempSet: 220 }],
          heatedBeds: [{ tempRead: 60.1, tempSet: 60 }],
          fans: [{ value: 80 }],
        },
      }));
      return;
    }
    if (req.url.match(/\/printer\/api\/[^?]+\?a=send/)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: 1 }));
      return;
    }
    if (req.url.match(/\/printer\/api\/[^?]+\?a=stopJob/)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: 1 }));
      return;
    }
    res.writeHead(404); res.end();
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  port = server.address().port;
});

after(() => server.close());

function makeClient() {
  return new RepetierClient(
    { printer: { ip: '127.0.0.1', port, id: 'mk3', slug: 'mk3', accessCode: 'TESTKEY' } },
    { broadcast: () => {} }
  );
}

describe('RepetierClient', () => {
  it('connect resolves printer-info and verifies slug', async () => {
    const c = makeClient();
    await c.connect();
    assert.equal(c.connected, true);
    c.disconnect();
  });

  it('_poll parses stateList into normalised state', async () => {
    const c = makeClient();
    await c.connect();
    await c._poll();
    assert.equal(c.state.gcode_state, 'RUNNING');
    assert.equal(c.state.mc_percent, 42);
    assert.equal(c.state.elapsed_seconds, 720);
    assert.equal(c.state.nozzle_temper, 215.5);
    assert.equal(c.state.bed_temper, 60.1);
    assert.equal(c.state.cooling_fan_speed, 80);
    c.disconnect();
  });

  it('sendCommand("stop") calls stopJob', async () => {
    const c = makeClient();
    await c.connect();
    calls.length = 0;
    await c.sendCommand({ action: 'stop' });
    const stopCall = calls.find(call => call.url.includes('a=stopJob'));
    assert.ok(stopCall);
    c.disconnect();
  });

  it('sendCommand("set_temp_nozzle", 220) sends M104 via send command', async () => {
    const c = makeClient();
    await c.connect();
    calls.length = 0;
    await c.sendCommand({ action: 'set_temp_nozzle', target: 220 });
    const sendCall = calls.find(call => call.url.includes('a=send'));
    assert.ok(sendCall);
    assert.match(decodeURIComponent(sendCall.url), /M104 S220/);
    c.disconnect();
  });

  it('apikey is appended to every request', async () => {
    const c = makeClient();
    calls.length = 0;
    await c.connect();
    const infoCall = calls.find(call => call.url.startsWith('/printer/info'));
    assert.match(infoCall.url, /apikey=TESTKEY/);
    c.disconnect();
  });
});

describe('buildRepetierCommand', () => {
  it('namespaces the action under _repetier_action', () => {
    const out = buildRepetierCommand({ action: 'stop' });
    assert.equal(out._repetier_action, 'stop');
  });
});
