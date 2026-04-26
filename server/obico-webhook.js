/**
 * Obico webhook receiver.
 *
 * Obico (formerly The Spaghetti Detective) runs a print-failure detection
 * service that can post webhooks on failure-detected, print-done, and
 * filament-change events. Both the self-hosted Obico server and
 * moonraker-obico send identical payloads with an HMAC-SHA256 signature.
 *
 * Docs: https://www.obico.io/docs/
 *
 * Security model: unlike OctoEverywhere (plaintext SecretKey in body),
 * Obico signs the raw request body with HMAC-SHA256 and sends the hex
 * digest in the `X-Obico-Signature` header. We verify the signature with
 * a timing-safe comparison.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

export const OBICO_EVENTS = Object.freeze([
  'print_start',
  'print_done',
  'print_failed',
  'print_cancelled',
  'print_paused',
  'print_resumed',
  'failure_detected',
  'filament_change_required',
  'test',
]);

function hmacHex(secret, body) {
  return createHmac('sha256', secret).update(body).digest('hex');
}

function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

/**
 * Verify and normalise an Obico webhook.
 *
 * @param {Buffer|string} rawBody — the request body exactly as received (not re-serialised)
 * @param {string} signature — value of the X-Obico-Signature header
 * @param {string} expectedSecret — shared secret from the Obico UI
 */
export function verifyObicoWebhook(rawBody, signature, expectedSecret) {
  if (!expectedSecret) return { ok: false, reason: 'server_misconfigured_secret_missing', status: 500 };
  if (rawBody == null) return { ok: false, reason: 'empty_body', status: 400 };

  const bodyBuf = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody), 'utf8');
  const expectedSig = hmacHex(expectedSecret, bodyBuf);

  if (!safeEqualHex(String(signature || '').trim().toLowerCase(), expectedSig)) {
    return { ok: false, reason: 'bad_signature', status: 401 };
  }

  let payload;
  try {
    payload = JSON.parse(bodyBuf.toString('utf8'));
  } catch {
    return { ok: false, reason: 'invalid_json', status: 400 };
  }

  const eventName = payload.event || payload.type || '';
  if (!OBICO_EVENTS.includes(eventName)) {
    return { ok: false, reason: `unknown_event:${eventName}`, status: 400 };
  }

  return {
    ok: true,
    event: {
      type: eventName,
      printerId: payload.printer_id || payload.printerId || '',
      printerName: payload.printer_name || payload.printerName || '',
      printId: payload.print_id || payload.printId || '',
      fileName: payload.filename || payload.file_name || null,
      progress: typeof payload.progress === 'number' ? payload.progress : null,
      snapshotUrl: payload.snapshot_url || payload.snapshotUrl || null,
      failureScore: typeof payload.failure_score === 'number' ? payload.failure_score : null,
      error: payload.error || null,
    },
  };
}
