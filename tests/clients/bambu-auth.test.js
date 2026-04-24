// bambu-auth.test.js — Tests for Bambu MQTT auth error classification and
// Developer Mode awareness (Bambu Authorization Control System, 2025).

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BambuMqttClient, classifyMqttError } from '../../server/mqtt-client.js';

describe('Bambu classifyMqttError()', () => {
  it('maps "Not authorized" to auth_error with Developer Mode hint', () => {
    const res = classifyMqttError({ message: 'Connection refused: Not authorized', code: 5 });
    assert.equal(res.status, 'auth_error');
    assert.match(res.hint, /Developer Mode/);
  });

  it('maps "Bad user name or password" to auth_error', () => {
    const res = classifyMqttError({ message: 'Connection refused: Bad user name or password', code: 4 });
    assert.equal(res.status, 'auth_error');
    assert.match(res.hint, /access code|Developer Mode/i);
  });

  it('returns null for non-auth errors', () => {
    const err = { message: 'ECONNREFUSED', code: 'ECONNREFUSED' };
    assert.equal(classifyMqttError(err), null);
  });

  it('handles missing/undefined errors gracefully', () => {
    assert.equal(classifyMqttError(null), null);
    assert.equal(classifyMqttError(undefined), null);
    assert.equal(classifyMqttError({}), null);
  });
});

describe('BambuMqttClient Developer Mode awareness', () => {
  function makeClient(printerOverrides = {}) {
    const hub = {
      broadcast: (channel, payload) => hub._events.push({ channel, payload }),
      _events: [],
    };
    const config = {
      printer: {
        ip: '127.0.0.1',
        serial: 'TEST-SN',
        accessCode: 'test-code',
        ...printerOverrides,
      },
    };
    const client = new BambuMqttClient(config, hub);
    return { client, hub };
  }

  it('records developerMode flag from config (default false)', () => {
    const { client } = makeClient();
    assert.equal(client.developerMode, false);
  });

  it('accepts developerMode: true from config', () => {
    const { client } = makeClient({ developerMode: true });
    assert.equal(client.developerMode, true);
  });

  it('auth_error broadcast includes vendor=bambu and Developer Mode hint', () => {
    const { client, hub } = makeClient({ developerMode: false });
    client._handleAuthError({ message: 'Not authorized', code: 5 });

    const event = hub._events.find(e => e.channel === 'connection' && e.payload?.status === 'auth_error');
    assert.ok(event, 'expected auth_error broadcast');
    assert.equal(event.payload.vendor, 'bambu');
    assert.match(event.payload.hint, /Developer Mode/);
  });

  it('auth_error is broadcast only once (de-duplicated until reset)', () => {
    const { client, hub } = makeClient();
    client._handleAuthError({ message: 'Not authorized' });
    client._handleAuthError({ message: 'Not authorized' });
    client._handleAuthError({ message: 'Not authorized' });

    const events = hub._events.filter(e => e.channel === 'connection' && e.payload?.status === 'auth_error');
    assert.equal(events.length, 1, 'expected a single auth_error broadcast');
  });
});
