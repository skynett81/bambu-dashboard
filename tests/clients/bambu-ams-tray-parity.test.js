// bambu-ams-tray-parity.test.js — Tests that our AMS tray parsing surfaces the
// per-slot attributes ha-bambulab exposes (rfid tag, tray_uuid, multi-color
// palette, bed_temp_type, flow-ratio n, cali_idx) + chamber_temperature
// set command for X1E/H2/H2D.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BambuMqttClient } from '../../server/mqtt-client.js';
import { buildChamberTempCommand } from '../../server/mqtt-commands.js';

function makeClient() {
  const hub = { broadcast: () => {} };
  const config = { printer: { ip: '127.0.0.1', serial: 'TEST-SN', accessCode: 'x' } };
  return new BambuMqttClient(config, hub);
}

describe('BambuMqttClient AMS tray entity-parity', () => {
  it('surfaces tag_uid, tray_uuid, tray_info_idx per tray', () => {
    const client = makeClient();
    client._handleMessage({
      print: {
        ams: {
          ams: [{
            id: '0', tray: [
              { id: '0', tray_type: 'PLA', tag_uid: 'ABC123', tray_uuid: 'UUID-1', tray_info_idx: 7 },
            ],
          }],
        },
      },
    });
    const tray = client.state._ams_trays[0];
    assert.equal(tray.tagUid, 'ABC123');
    assert.equal(tray.trayUuid, 'UUID-1');
    assert.equal(tray.trayInfoIdx, 7);
  });

  it('surfaces multi-color tray_colors[] array', () => {
    const client = makeClient();
    client._handleMessage({
      print: {
        ams: {
          ams: [{
            id: '0', tray: [
              { id: '0', tray_type: 'PLA', tray_color: 'FF0000FF', tray_colors: ['FF0000FF', '00FF00FF', '0000FFFF'] },
            ],
          }],
        },
      },
    });
    const tray = client.state._ams_trays[0];
    assert.deepEqual(tray.colors, ['FF0000FF', '00FF00FF', '0000FFFF']);
  });

  it('surfaces bed_temp_type, flow ratio n, cali_idx', () => {
    const client = makeClient();
    client._handleMessage({
      print: {
        ams: {
          ams: [{
            id: '0', tray: [
              { id: '0', tray_type: 'PETG', bed_temp_type: '1', n: 0.95, cali_idx: 12 },
            ],
          }],
        },
      },
    });
    const tray = client.state._ams_trays[0];
    assert.equal(tray.bedTempType, '1');
    assert.equal(tray.flowRatio, 0.95);
    assert.equal(tray.caliIdx, 12);
  });
});

describe('buildChamberTempCommand() — X1E/H2/H2D chamber heating', () => {
  it('builds print.chamber_temp command with target', () => {
    const cmd = buildChamberTempCommand(55);
    assert.equal(cmd.print.command, 'chamber_temp');
    assert.equal(cmd.print.target, 55);
  });

  it('clamps target to vendor-safe range (0–65°C)', () => {
    assert.equal(buildChamberTempCommand(-5).print.target, 0);
    assert.equal(buildChamberTempCommand(999).print.target, 65);
  });

  it('rounds to integer', () => {
    assert.equal(buildChamberTempCommand(45.7).print.target, 46);
  });
});
