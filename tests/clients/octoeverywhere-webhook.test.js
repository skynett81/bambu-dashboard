// octoeverywhere-webhook.test.js — Tests OctoEverywhere webhook validation
// and normalisation: secret comparison (constant-time), event-type mapping,
// JSON parsing, and safe handling of missing/malformed payloads.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { verifyOctoEverywhereWebhook, EVENT_TYPE } from '../../server/octoeverywhere-webhook.js';

const SECRET = 'supersecret-octoe-key-123';

function basePayload(overrides = {}) {
  return {
    SecretKey: SECRET,
    PrinterId: 'PID-001',
    PrinterName: 'Voron 2.4',
    PrintId: 'JOB-42',
    EventType: 1,
    FileName: 'benchy.gcode',
    Progress: 15,
    DurationSec: 600,
    TimeRemainingSec: 3400,
    SnapshotUrl: 'https://example.com/snap.jpg',
    QuickViewUrl: 'https://octoeverywhere.com/q/abc',
    ...overrides,
  };
}

describe('verifyOctoEverywhereWebhook', () => {
  it('accepts valid payload with matching secret', () => {
    const r = verifyOctoEverywhereWebhook(basePayload(), SECRET);
    assert.equal(r.ok, true);
    assert.equal(r.event.type, 'print_started');
    assert.equal(r.event.printerName, 'Voron 2.4');
    assert.equal(r.event.progress, 15);
  });

  it('rejects bad secret with 401', () => {
    const r = verifyOctoEverywhereWebhook(basePayload(), 'wrong-secret');
    assert.equal(r.ok, false);
    assert.equal(r.status, 401);
    assert.equal(r.reason, 'bad_secret');
  });

  it('rejects missing SecretKey', () => {
    const p = basePayload();
    delete p.SecretKey;
    const r = verifyOctoEverywhereWebhook(p, SECRET);
    assert.equal(r.ok, false);
    assert.equal(r.status, 401);
  });

  it('rejects server-side misconfiguration (empty expectedSecret)', () => {
    const r = verifyOctoEverywhereWebhook(basePayload(), '');
    assert.equal(r.ok, false);
    assert.equal(r.status, 500);
    assert.equal(r.reason, 'server_misconfigured_secret_missing');
  });

  it('parses JSON string body', () => {
    const r = verifyOctoEverywhereWebhook(JSON.stringify(basePayload()), SECRET);
    assert.equal(r.ok, true);
  });

  it('parses Buffer body', () => {
    const r = verifyOctoEverywhereWebhook(Buffer.from(JSON.stringify(basePayload())), SECRET);
    assert.equal(r.ok, true);
  });

  it('rejects malformed JSON with 400', () => {
    const r = verifyOctoEverywhereWebhook('{ not json', SECRET);
    assert.equal(r.ok, false);
    assert.equal(r.status, 400);
    assert.equal(r.reason, 'invalid_json');
  });

  it('rejects empty body', () => {
    const r = verifyOctoEverywhereWebhook(null, SECRET);
    assert.equal(r.ok, false);
    assert.equal(r.status, 400);
  });

  it('rejects unknown EventType integer', () => {
    const r = verifyOctoEverywhereWebhook(basePayload({ EventType: 999 }), SECRET);
    assert.equal(r.ok, false);
    assert.equal(r.status, 400);
    assert.match(r.reason, /unknown_event_type/);
  });

  it('maps all 16 known event types', () => {
    for (let i = 1; i <= 16; i++) {
      const r = verifyOctoEverywhereWebhook(basePayload({ EventType: i }), SECRET);
      assert.equal(r.ok, true, `EventType ${i} should be recognised`);
      assert.ok(r.event.type, `EventType ${i} should map to a name`);
    }
  });

  it('exports EVENT_TYPE mapping for external use', () => {
    assert.equal(EVENT_TYPE[1], 'print_started');
    assert.equal(EVENT_TYPE[3], 'print_failed');
    assert.equal(EVENT_TYPE[10], 'first_layer_complete');
    assert.equal(EVENT_TYPE[15], 'bed_cooldown_complete');
    assert.equal(EVENT_TYPE[16], 'test_notification');
  });

  it('passes through optional fields including Error', () => {
    const r = verifyOctoEverywhereWebhook(
      basePayload({ EventType: 9, Error: 'Thermal runaway detected' }),
      SECRET,
    );
    assert.equal(r.event.type, 'error');
    assert.equal(r.event.error, 'Thermal runaway detected');
  });

  it('normalizes missing optional fields to null', () => {
    const minimal = { SecretKey: SECRET, EventType: 2, PrinterId: 'x' };
    const r = verifyOctoEverywhereWebhook(minimal, SECRET);
    assert.equal(r.ok, true);
    assert.equal(r.event.fileName, null);
    assert.equal(r.event.progress, null);
    assert.equal(r.event.snapshotUrl, null);
  });

  it('secret comparison is length-safe (no length-based timing leak)', () => {
    // Should return false gracefully for wildly different lengths
    const r = verifyOctoEverywhereWebhook(basePayload({ SecretKey: 'short' }), 'a'.repeat(100));
    assert.equal(r.ok, false);
    assert.equal(r.status, 401);
  });
});
