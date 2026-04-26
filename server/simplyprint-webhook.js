/**
 * SimplyPrint webhook receiver.
 *
 * SimplyPrint.io is a cloud printer-management service with an
 * OctoPrint/Klipper plugin. Webhooks are posted with:
 *   - X-SimplyPrint-Signature: HMAC-SHA256 hex of the raw body
 *   - X-SimplyPrint-Timestamp: Unix epoch seconds (for replay protection)
 *
 * The signature is computed over `timestamp.body` (the timestamp, a literal
 * dot, then the raw body) — same pattern as GitHub webhooks and Stripe.
 *
 * Docs: https://simplyprint.io/docs/
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

const MAX_TIMESTAMP_SKEW_SECONDS = 300; // 5 minutes, matches most webhook providers

export const SIMPLYPRINT_EVENTS = Object.freeze([
  'print_started',
  'print_done',
  'print_failed',
  'print_paused',
  'print_resumed',
  'printer_online',
  'printer_offline',
  'filament_runout',
  'layer_complete',
  'progress',
  'test',
]);

function hmacHex(secret, data) {
  return createHmac('sha256', secret).update(data).digest('hex');
}

function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

/**
 * Verify and normalise a SimplyPrint webhook.
 *
 * @param {Buffer|string} rawBody — raw request body
 * @param {string} signature — X-SimplyPrint-Signature header (hex sha256)
 * @param {string|number} timestamp — X-SimplyPrint-Timestamp header (unix seconds)
 * @param {string} expectedSecret — shared secret from SimplyPrint integration settings
 * @param {number} [nowSec] — current time (injectable for tests)
 */
export function verifySimplyPrintWebhook(rawBody, signature, timestamp, expectedSecret, nowSec = Math.floor(Date.now() / 1000)) {
  if (!expectedSecret) return { ok: false, reason: 'server_misconfigured_secret_missing', status: 500 };
  if (rawBody == null) return { ok: false, reason: 'empty_body', status: 400 };

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) {
    return { ok: false, reason: 'invalid_timestamp', status: 400 };
  }
  if (Math.abs(nowSec - ts) > MAX_TIMESTAMP_SKEW_SECONDS) {
    return { ok: false, reason: 'timestamp_too_old', status: 401 };
  }

  const bodyBuf = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody), 'utf8');
  const signedPayload = Buffer.concat([Buffer.from(`${ts}.`, 'utf8'), bodyBuf]);
  const expectedSig = hmacHex(expectedSecret, signedPayload);

  if (!safeEqualHex(String(signature || '').trim().toLowerCase(), expectedSig)) {
    return { ok: false, reason: 'bad_signature', status: 401 };
  }

  let payload;
  try {
    payload = JSON.parse(bodyBuf.toString('utf8'));
  } catch {
    return { ok: false, reason: 'invalid_json', status: 400 };
  }

  const eventName = payload.event || '';
  if (!SIMPLYPRINT_EVENTS.includes(eventName)) {
    return { ok: false, reason: `unknown_event:${eventName}`, status: 400 };
  }

  return {
    ok: true,
    event: {
      type: eventName,
      printerId: payload.printer_id || '',
      printerName: payload.printer_name || '',
      printId: payload.print_id || '',
      fileName: payload.filename || null,
      progress: typeof payload.progress === 'number' ? payload.progress : null,
      layer: typeof payload.layer === 'number' ? payload.layer : null,
      error: payload.error || null,
      timestamp: ts,
    },
  };
}
