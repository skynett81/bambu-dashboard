// obico-simplyprint-webhook.test.js — Tests Obico (HMAC-only) and SimplyPrint
// (HMAC + timestamp) webhook verification and normalisation.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifyObicoWebhook, OBICO_EVENTS } from '../../server/obico-webhook.js';
import { verifySimplyPrintWebhook, SIMPLYPRINT_EVENTS } from '../../server/simplyprint-webhook.js';

const OBICO_SECRET = 'obico-shared-secret-abc123';
const SP_SECRET = 'simplyprint-secret-xyz789';

function hmac(secret, data) {
  return createHmac('sha256', secret).update(data).digest('hex');
}

describe('verifyObicoWebhook', () => {
  it('accepts valid signed payload', () => {
    const body = JSON.stringify({ event: 'print_start', printer_id: 'p1', filename: 'a.gcode' });
    const sig = hmac(OBICO_SECRET, body);
    const r = verifyObicoWebhook(body, sig, OBICO_SECRET);
    assert.equal(r.ok, true);
    assert.equal(r.event.type, 'print_start');
    assert.equal(r.event.fileName, 'a.gcode');
  });

  it('rejects tampered body', () => {
    const body = JSON.stringify({ event: 'print_start' });
    const sig = hmac(OBICO_SECRET, body);
    const r = verifyObicoWebhook('{"event":"print_failed"}', sig, OBICO_SECRET);
    assert.equal(r.ok, false);
    assert.equal(r.status, 401);
  });

  it('rejects wrong secret', () => {
    const body = JSON.stringify({ event: 'print_start' });
    const sig = hmac('wrong', body);
    const r = verifyObicoWebhook(body, sig, OBICO_SECRET);
    assert.equal(r.ok, false);
    assert.equal(r.reason, 'bad_signature');
  });

  it('maps failure_detected with failure_score', () => {
    const body = JSON.stringify({ event: 'failure_detected', failure_score: 0.87, printer_id: 'x' });
    const sig = hmac(OBICO_SECRET, body);
    const r = verifyObicoWebhook(body, sig, OBICO_SECRET);
    assert.equal(r.ok, true);
    assert.equal(r.event.failureScore, 0.87);
  });

  it('accepts Buffer body', () => {
    const body = Buffer.from(JSON.stringify({ event: 'test' }), 'utf8');
    const sig = hmac(OBICO_SECRET, body);
    const r = verifyObicoWebhook(body, sig, OBICO_SECRET);
    assert.equal(r.ok, true);
  });

  it('rejects missing server secret', () => {
    const r = verifyObicoWebhook('{}', 'abc', '');
    assert.equal(r.status, 500);
  });

  it('exports all known event types', () => {
    for (const evt of ['print_start', 'print_failed', 'failure_detected', 'test']) {
      assert.ok(OBICO_EVENTS.includes(evt), `missing ${evt}`);
    }
  });
});

describe('verifySimplyPrintWebhook', () => {
  function signedRequest(body, secret, ts) {
    const sig = hmac(secret, `${ts}.${body}`);
    return { body, sig, ts };
  }

  it('accepts valid signed + fresh request', () => {
    const now = 1_700_000_000;
    const body = JSON.stringify({ event: 'print_started', printer_id: 'p1' });
    const { sig } = signedRequest(body, SP_SECRET, now);
    const r = verifySimplyPrintWebhook(body, sig, now, SP_SECRET, now);
    assert.equal(r.ok, true);
    assert.equal(r.event.type, 'print_started');
  });

  it('rejects stale timestamp (> 5 min skew)', () => {
    const now = 1_700_000_000;
    const old = now - 301;
    const body = JSON.stringify({ event: 'print_started' });
    const { sig } = signedRequest(body, SP_SECRET, old);
    const r = verifySimplyPrintWebhook(body, sig, old, SP_SECRET, now);
    assert.equal(r.ok, false);
    assert.equal(r.reason, 'timestamp_too_old');
  });

  it('accepts edge-of-skew (exactly 5 minutes)', () => {
    const now = 1_700_000_000;
    const ts = now - 300;
    const body = JSON.stringify({ event: 'test' });
    const { sig } = signedRequest(body, SP_SECRET, ts);
    const r = verifySimplyPrintWebhook(body, sig, ts, SP_SECRET, now);
    assert.equal(r.ok, true);
  });

  it('rejects non-numeric timestamp', () => {
    const body = JSON.stringify({ event: 'test' });
    const r = verifySimplyPrintWebhook(body, 'sig', 'not-a-number', SP_SECRET, 1_700_000_000);
    assert.equal(r.reason, 'invalid_timestamp');
  });

  it('rejects tampered timestamp (body signed with different ts)', () => {
    const now = 1_700_000_000;
    const body = JSON.stringify({ event: 'print_started' });
    const { sig } = signedRequest(body, SP_SECRET, now);
    // Send same sig but claim a different timestamp — signature won't match
    const r = verifySimplyPrintWebhook(body, sig, now - 60, SP_SECRET, now);
    assert.equal(r.ok, false);
    assert.equal(r.reason, 'bad_signature');
  });

  it('rejects unknown event type', () => {
    const now = 1_700_000_000;
    const body = JSON.stringify({ event: 'mystery_event' });
    const { sig } = signedRequest(body, SP_SECRET, now);
    const r = verifySimplyPrintWebhook(body, sig, now, SP_SECRET, now);
    assert.equal(r.ok, false);
    assert.match(r.reason, /unknown_event/);
  });

  it('exports all known event types', () => {
    for (const evt of ['print_started', 'print_done', 'print_failed', 'test']) {
      assert.ok(SIMPLYPRINT_EVENTS.includes(evt), `missing ${evt}`);
    }
  });
});
