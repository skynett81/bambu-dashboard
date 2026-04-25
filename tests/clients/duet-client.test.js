// duet-client.test.js — DuetClient unit tests with mocked HTTP.

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

import { DuetClient, buildDuetCommand } from '../../server/duet-client.js';

let server, port;
const calls = [];

before(async () => {
  server = http.createServer((req, res) => {
    calls.push({ method: req.method, url: req.url });
    if (req.url.startsWith('/rr_connect')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ err: 0, sessionTimeout: 8000 }));
      return;
    }
    if (req.url.startsWith('/rr_status')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'P',                           // printing
        fractionPrinted: 0.4250,
        temps: { current: [60.1, 215.5], bed: { active: 60 }, tools: { active: [[220]] } },
        coords: { xyz: [125.5, 100.2, 5.0] },
        params: { fanPercent: [80] },
        timesLeft: { file: 1800 },
        printDuration: 600,
      }));
      return;
    }
    if (req.url.startsWith('/rr_gcode')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ buff: 'ok' }));
      return;
    }
    if (req.url.startsWith('/rr_files')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ files: [{ type: 'f', name: 'test.gcode', size: 1024 }] }));
      return;
    }
    if (req.url.startsWith('/rr_upload')) {
      let bytes = 0;
      req.on('data', c => { bytes += c.length; });
      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ err: 0, received: bytes }));
      });
      return;
    }
    res.writeHead(404); res.end();
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  port = server.address().port;
});

after(() => server.close());

function makeClient() {
  return new DuetClient({ printer: { ip: `127.0.0.1:${port}`, id: 't1', accessCode: 'reprap' } }, { broadcast: () => {} });
}

describe('DuetClient', () => {
  it('connects via rr_connect and parses status', async () => {
    const c = makeClient();
    await c._ensureSession();
    assert.equal(c.connected, true);
    await c._poll();
    assert.equal(c.state.gcode_state, 'RUNNING');
    assert.equal(c.state.mc_percent, 43);   // 0.425 * 100 = 42.5 → 43
    assert.equal(c.state.bed_temper, 60.1);
    assert.equal(c.state.nozzle_temper, 215.5);
    assert.equal(c.state.cooling_fan_speed, 80);
    assert.equal(c.state.time_remaining_min, 30);
    c.disconnect();
  });

  it('sendCommand("pause") sends M25 via rr_gcode', async () => {
    const c = makeClient();
    await c._ensureSession();
    calls.length = 0;
    await c.sendCommand({ action: 'pause' });
    const lastGcode = calls.find(call => call.url.startsWith('/rr_gcode'));
    assert.ok(lastGcode);
    assert.match(decodeURIComponent(lastGcode.url), /M25/);
    c.disconnect();
  });

  it('sendCommand("set_temp_nozzle", 220) sends G10 P0 S220', async () => {
    const c = makeClient();
    await c._ensureSession();
    calls.length = 0;
    await c.sendCommand({ action: 'set_temp_nozzle', target: 220 });
    const lastGcode = calls.find(call => call.url.startsWith('/rr_gcode'));
    assert.match(decodeURIComponent(lastGcode.url), /G10 P0 S220/);
    c.disconnect();
  });

  it('uploadFile POSTs to rr_upload with sanitised path', async () => {
    const c = makeClient();
    await c._ensureSession();
    const buf = Buffer.from('G28\nG1 X10 Y10\n');
    const res = await c.uploadFile('test scene!.gcode', buf);
    assert.equal(res.ok, true);
    assert.equal(res.uploaded, 'test_scene_.gcode');
    assert.match(res.path, /0:\/gcodes\/test_scene_\.gcode$/);
    c.disconnect();
  });

  it('listFiles returns the rr_files array', async () => {
    const c = makeClient();
    await c._ensureSession();
    const list = await c.listFiles();
    assert.ok(Array.isArray(list));
    assert.equal(list[0].name, 'test.gcode');
    c.disconnect();
  });
});

describe('buildDuetCommand', () => {
  it('namespaces the action under _duet_action', () => {
    const out = buildDuetCommand({ action: 'pause' });
    assert.equal(out._duet_action, 'pause');
    assert.equal(out.action, 'pause');
  });
});
