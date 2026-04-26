/**
 * Prusa Connect — Cloud camera relay client.
 *
 * Pushes camera snapshots from 3DPrintForge to Prusa Connect so users can
 * see their prints in the official Prusa mobile app. Works alongside (not
 * instead of) the local PrusaLink HTTP client.
 *
 * Official spec: https://connect.prusa3d.com/docs/cameras/openapi/openapi.yaml
 *
 * Auth flow: the user registers the camera in the Prusa Connect web UI
 * (which requires a browser session), receives a one-time token, and
 * provides it + a stable fingerprint (16–64 chars) in the printer config:
 *
 *   "prusaConnect": {
 *     "token":       "abc123...",
 *     "fingerprint": "3dprintforge-<printer-id>"
 *   }
 *
 * From that point on, every snapshot we relay is authenticated with these
 * two headers; no further user action is needed.
 */

import { createLogger } from './logger.js';

const log = createLogger('prusa-connect');

const DEFAULT_HOST = 'https://connect.prusa3d.com';
const MAX_SNAPSHOT_BYTES = 16 * 1024 * 1024; // 16 MB hard limit from the spec

export class PrusaConnectClient {
  constructor({ token, fingerprint, host = DEFAULT_HOST } = {}) {
    if (!token) throw new Error('PrusaConnect token is required');
    if (!fingerprint || fingerprint.length < 16 || fingerprint.length > 64) {
      throw new Error('PrusaConnect fingerprint must be 16–64 characters');
    }
    this.token = token;
    this.fingerprint = fingerprint;
    this.host = host.replace(/\/+$/, '');
  }

  _authHeaders() {
    return {
      Token: this.token,
      Fingerprint: this.fingerprint,
    };
  }

  /**
   * Upload a JPEG snapshot to Prusa Connect.
   * Returns true on 2xx, false otherwise. Never throws on HTTP errors —
   * callers that relay continuously (timelapse loop) should keep running.
   */
  async uploadSnapshot(jpegBuffer) {
    if (!Buffer.isBuffer(jpegBuffer) && !(jpegBuffer instanceof Uint8Array)) {
      throw new TypeError('uploadSnapshot expects a Buffer or Uint8Array');
    }
    if (jpegBuffer.length === 0) {
      throw new Error('uploadSnapshot called with empty buffer');
    }
    if (jpegBuffer.length > MAX_SNAPSHOT_BYTES) {
      throw new Error(`Snapshot too large: ${jpegBuffer.length} > ${MAX_SNAPSHOT_BYTES}`);
    }

    try {
      const res = await fetch(`${this.host}/c/snapshot`, {
        method: 'PUT',
        headers: {
          ...this._authHeaders(),
          'Content-Type': 'image/jpg',
          'Content-Length': String(jpegBuffer.length),
        },
        body: jpegBuffer,
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        log.warn(`snapshot upload failed: HTTP ${res.status}`);
        return false;
      }
      return true;
    } catch (e) {
      log.warn(`snapshot upload error: ${e.message}`);
      return false;
    }
  }

  /**
   * Update camera config/options/capabilities on Prusa Connect.
   * `info` is `{ config?, options?, capabilities? }` per the OpenAPI spec.
   */
  async updateCameraInfo(info) {
    if (!info || typeof info !== 'object') {
      throw new TypeError('updateCameraInfo expects an object');
    }
    try {
      const res = await fetch(`${this.host}/c/info`, {
        method: 'PUT',
        headers: {
          ...this._authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(info),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        log.warn(`camera info update failed: HTTP ${res.status}`);
        return null;
      }
      // 200 OK returns camera_response, 204 No Content returns nothing.
      if (res.status === 204) return { ok: true };
      return await res.json();
    } catch (e) {
      log.warn(`camera info update error: ${e.message}`);
      return null;
    }
  }
}

/**
 * Build a client from a printer-config printer block. Supports two shapes:
 *   - nested: { prusaConnect: { token, fingerprint, host } }
 *   - flat:   { prusaConnect: true, prusaConnectToken, prusaConnectFingerprint, prusaConnectHost }
 * The flat shape matches the settings-dialog.js form fields; the nested
 * shape is cleaner for config.json edited by hand.
 *
 * Returns null if the printer is not configured for Prusa Connect relay —
 * that's a valid and common case.
 */
export function fromPrinterConfig(printerConfig) {
  if (!printerConfig) return null;
  const pc = typeof printerConfig.prusaConnect === 'object' ? printerConfig.prusaConnect : null;
  const token = pc?.token || printerConfig.prusaConnectToken;
  const fingerprint = pc?.fingerprint || printerConfig.prusaConnectFingerprint;
  const host = pc?.host || printerConfig.prusaConnectHost;
  if (!token || !fingerprint) return null;
  return new PrusaConnectClient({ token, fingerprint, host });
}
