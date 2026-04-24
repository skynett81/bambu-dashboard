// bambu-ams-features.test.js — Tests for Bambu 2025–2026 AMS and H2D feature parsing:
//  - AMS 2 Pro / AMS HT / AMS Lite detection via info.module[].hw_ver/product_name
//  - humidity_raw, dry_time, dry_sf_reason surface in _ams_humidity
//  - H2D granular AI toggles under xcam.{clump_detector, airprint_detector, pileup_detector, printing_monitor}

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BambuMqttClient, detectAmsModel } from '../../server/mqtt-client.js';

describe('detectAmsModel()', () => {
  it('identifies AMS 2 Pro by hw_ver N3F05', () => {
    assert.equal(detectAmsModel('N3F05', 'AMS 2 Pro (1)'), 'ams_2_pro');
  });

  it('identifies classic AMS by hw_ver AMS08', () => {
    assert.equal(detectAmsModel('AMS08', 'AMS (1)'), 'ams');
  });

  it('identifies AMS Lite by product_name', () => {
    assert.equal(detectAmsModel('AMS_F1', 'AMS Lite'), 'ams_lite');
  });

  it('identifies AMS HT by product_name', () => {
    assert.equal(detectAmsModel('AHT01', 'AMS HT'), 'ams_ht');
  });

  it('returns unknown for unrecognized hw_ver', () => {
    assert.equal(detectAmsModel('XX99', ''), 'unknown');
  });

  it('handles missing inputs gracefully', () => {
    assert.equal(detectAmsModel(undefined, undefined), 'unknown');
    assert.equal(detectAmsModel('', ''), 'unknown');
  });
});

describe('BambuMqttClient AMS feature parsing', () => {
  function makeClient() {
    const hub = { broadcast: () => {}, _events: [] };
    hub.broadcast = (ch, p) => hub._events.push({ ch, p });
    const config = {
      printer: { ip: '127.0.0.1', serial: 'TEST-SN', accessCode: 'x' },
    };
    return { client: new BambuMqttClient(config, hub), hub };
  }

  it('surfaces humidity_raw, dry_time, dry_sf_reason per AMS unit', () => {
    const { client } = makeClient();
    client._handleMessage({
      print: {
        ams: {
          ams: [
            { id: '0', humidity: '3', humidity_raw: '28', temp: '23', dry_time: 45, dry_sf_reason: 0 },
            { id: '1', humidity: '4', humidity_raw: '62', temp: '25', dry_time: 0, dry_sf_reason: 2 },
          ],
        },
      },
    });

    const humidityArr = client.state._ams_humidity;
    assert.ok(Array.isArray(humidityArr), 'expected _ams_humidity array');
    assert.equal(humidityArr.length, 2);

    const first = humidityArr[0];
    assert.equal(first.humidity, '3');
    assert.equal(first.humidityRaw, 28, 'humidityRaw should be numeric percent');
    assert.equal(first.dryTime, 45);
    assert.equal(first.drySfReason, 0);

    const second = humidityArr[1];
    assert.equal(second.humidityRaw, 62);
    assert.equal(second.drySfReason, 2, 'safety reason propagated');
  });

  it('populates _ams_models map from info.module', () => {
    const { client } = makeClient();
    client._handleMessage({
      info: {
        module: [
          { name: 'ams/0', hw_ver: 'N3F05', sw_ver: '1.0', product_name: 'AMS 2 Pro (1)', sn: 'P001' },
          { name: 'ams/1', hw_ver: 'AMS08', sw_ver: '1.0', product_name: 'AMS (2)', sn: 'A002' },
          { name: 'ota', hw_ver: '', sw_ver: '01.02.03.00' },
        ],
      },
    });

    const models = client.state._ams_models;
    assert.ok(Array.isArray(models), 'expected _ams_models array');
    assert.equal(models.length, 2, 'should filter non-AMS modules');
    assert.equal(models[0].model, 'ams_2_pro');
    assert.equal(models[0].hwVer, 'N3F05');
    assert.equal(models[1].model, 'ams');
  });
});

describe('BambuMqttClient H2D granular AI toggles', () => {
  function makeClient() {
    const hub = { broadcast: () => {} };
    const config = { printer: { ip: '127.0.0.1', serial: 'TEST-SN', accessCode: 'x' } };
    return new BambuMqttClient(config, hub);
  }

  it('parses xcam.clump_detector (not nozzle_clumping_detector)', () => {
    const client = makeClient();
    client._handleMessage({
      print: {
        xcam: {
          clump_detector: { enable: true, buzzer: true, halt_print_enable: false },
        },
      },
    });
    assert.equal(client.state._xcam.clumpDetector?.enable, true);
  });

  it('parses xcam.airprint_detector', () => {
    const client = makeClient();
    client._handleMessage({
      print: { xcam: { airprint_detector: { enable: true } } },
    });
    assert.equal(client.state._xcam.airprintDetector?.enable, true);
  });

  it('parses xcam.pileup_detector (not purge_chute_pile_up_detector)', () => {
    const client = makeClient();
    client._handleMessage({
      print: { xcam: { pileup_detector: { enable: false } } },
    });
    assert.equal(client.state._xcam.pileupDetector?.enable, false);
  });

  it('parses xcam.printing_monitor master toggle', () => {
    const client = makeClient();
    client._handleMessage({
      print: { xcam: { printing_monitor: { enable: true } } },
    });
    assert.equal(client.state._xcam.printingMonitor?.enable, true);
  });
});
