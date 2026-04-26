/**
 * OctoEverywhere webhook receiver.
 *
 * OctoEverywhere POSTs print-event notifications to any HTTP endpoint the
 * user configures. We receive them, verify the shared SecretKey embedded
 * in the payload, map the integer EventType to a human-readable name, and
 * return a normalized event the rest of the app can route to any of our
 * 7 notification channels (Telegram, Discord, ntfy, ...).
 *
 * Docs:
 *   https://docs.octoeverywhere.com/webhook-notifications/
 *   https://docs.octoeverywhere.com/webhook-notifications/json-payload-format/
 *   https://docs.octoeverywhere.com/webhook-notifications/event-types/
 *
 * Security model: OctoEverywhere does not sign requests with HMAC. Instead
 * the user configures a SecretKey in the OctoEverywhere notification
 * settings UI, which is included verbatim in every webhook payload. We
 * compare it in constant time against a secret the user has also saved on
 * our side. Rotate by updating both sides.
 */

import { timingSafeEqual } from 'node:crypto';

export const EVENT_TYPE = Object.freeze({
  1:  'print_started',
  2:  'print_complete',
  3:  'print_failed',
  4:  'print_paused',
  5:  'print_resumed',
  6:  'print_progress',
  7:  'gadget_possible_failure',
  8:  'gadget_paused_print',
  9:  'error',
  10: 'first_layer_complete',
  11: 'filament_change_required',
  12: 'user_interaction_required',
  13: 'non_supporter_notification_limit',
  14: 'third_layer_complete',
  15: 'bed_cooldown_complete',
  16: 'test_notification',
});

function safeCompare(a, b) {
  const ba = Buffer.from(String(a ?? ''), 'utf8');
  const bb = Buffer.from(String(b ?? ''), 'utf8');
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/**
 * Verify and normalise an OctoEverywhere webhook payload.
 *
 * @param {object|string|Buffer} body — raw JSON body (string/Buffer) or pre-parsed object
 * @param {string} expectedSecret — the SecretKey the user configured in both our dashboard and OctoEverywhere
 * @returns {{ ok: true, event: NormalizedEvent } | { ok: false, reason: string, status: number }}
 */
export function verifyOctoEverywhereWebhook(body, expectedSecret) {
  if (!expectedSecret || typeof expectedSecret !== 'string') {
    return { ok: false, reason: 'server_misconfigured_secret_missing', status: 500 };
  }

  let payload;
  if (typeof body === 'string' || Buffer.isBuffer(body)) {
    try {
      payload = JSON.parse(body.toString('utf8'));
    } catch {
      return { ok: false, reason: 'invalid_json', status: 400 };
    }
  } else if (body && typeof body === 'object') {
    payload = body;
  } else {
    return { ok: false, reason: 'empty_body', status: 400 };
  }

  if (!payload.SecretKey || !safeCompare(payload.SecretKey, expectedSecret)) {
    return { ok: false, reason: 'bad_secret', status: 401 };
  }

  const rawType = payload.EventType;
  const eventName = EVENT_TYPE[rawType];
  if (!eventName) {
    return { ok: false, reason: `unknown_event_type:${rawType}`, status: 400 };
  }

  return {
    ok: true,
    event: {
      type: eventName,
      typeId: rawType,
      printerId: payload.PrinterId || '',
      printerName: payload.PrinterName || '',
      printId: payload.PrintId || '',
      fileName: payload.FileName || null,
      snapshotUrl: payload.SnapshotUrl || null,
      quickViewUrl: payload.QuickViewUrl || null,
      progress: typeof payload.Progress === 'number' ? payload.Progress : null,
      durationSec: typeof payload.DurationSec === 'number' ? payload.DurationSec : null,
      timeRemainingSec: typeof payload.TimeRemainingSec === 'number' ? payload.TimeRemainingSec : null,
      zOffsetMM: typeof payload.ZOffsetMM === 'number' ? payload.ZOffsetMM : null,
      error: payload.Error || null,
    },
  };
}
