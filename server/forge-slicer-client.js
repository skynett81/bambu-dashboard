/**
 * Forge Slicer client — HTTP/1.1 client for the skynett81/OrcaSlicer
 * fork running in service mode (see docs/FORGE_SLICER_API.md).
 *
 * Auto-detects the service via /api/health, caches the discovery
 * result, and falls back gracefully to the CLI-bridge slicer when the
 * service isn't reachable. All public functions return a plain
 * object; errors throw with a `.code` property matching the API's
 * documented error codes.
 *
 * The client is small on purpose — slicing/profiles/preview maps
 * almost 1:1 onto the REST endpoints, so adding a new endpoint to the
 * fork only needs a corresponding wrapper here.
 */

import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { URL } from 'node:url';
import { createLogger } from './logger.js';

const log = createLogger('forge-slicer');

const DEFAULT_URL = process.env.FORGE_SLICER_URL || 'http://127.0.0.1:8765';
const DEFAULT_TOKEN = process.env.FORGE_SLICER_TOKEN || '';
const PROBE_INTERVAL_MS = 60_000;
const PROBE_TIMEOUT_MS = 1500;

let _config = { url: DEFAULT_URL, token: DEFAULT_TOKEN, enabled: true };
let _lastProbe = { ok: false, info: null, at: 0, error: null };
let _probeTimer = null;

export function configure({ url, token, enabled } = {}) {
  if (typeof url === 'string' && url) _config.url = url;
  if (typeof token === 'string') _config.token = token;
  if (typeof enabled === 'boolean') _config.enabled = enabled;
  // Re-probe immediately on config change.
  _lastProbe = { ok: false, info: null, at: 0, error: null };
}

export function getConfig() {
  return { ..._config };
}

function _isJson(headers) {
  const ct = (headers['content-type'] || '').toLowerCase();
  return ct.includes('application/json');
}

function _request({ path, method = 'GET', body = null, headers = {}, timeoutMs = 30_000, raw = false }) {
  return new Promise((resolve, reject) => {
    let urlObj;
    try { urlObj = new URL(path, _config.url); } catch (e) { return reject(new Error(`Invalid URL ${path}: ${e.message}`)); }
    const opts = {
      method,
      headers: {
        'Accept': 'application/json',
        ...headers,
      },
      timeout: timeoutMs,
    };
    if (_config.token) opts.headers['Authorization'] = `Bearer ${_config.token}`;
    if (body && !opts.headers['Content-Type']) opts.headers['Content-Type'] = 'application/json';

    const reqFn = urlObj.protocol === 'https:' ? httpsRequest : httpRequest;
    const req = reqFn(urlObj, opts, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (raw) return resolve({ status: res.statusCode, headers: res.headers, body: buf });
        const status = res.statusCode || 0;
        if (status >= 400) {
          let msg = `HTTP ${status}`;
          let code = 'ERR_HTTP';
          if (_isJson(res.headers)) {
            try {
              const j = JSON.parse(buf.toString('utf8'));
              if (j.error) msg = j.error;
              if (j.code) code = j.code;
            } catch { /* ignore */ }
          }
          const err = new Error(msg);
          err.code = code;
          err.status = status;
          return reject(err);
        }
        if (_isJson(res.headers)) {
          try { return resolve(JSON.parse(buf.toString('utf8') || '{}')); }
          catch (e) { return reject(new Error(`Bad JSON from ${path}: ${e.message}`)); }
        }
        resolve(buf);
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    if (body) {
      if (typeof body === 'string' || Buffer.isBuffer(body)) req.end(body);
      else req.end(JSON.stringify(body));
    } else req.end();
  });
}

/**
 * Probe the service. Cached for PROBE_INTERVAL_MS so repeated calls are
 * cheap. Force a fresh check by passing { force: true }.
 *
 * @returns {Promise<{ok: boolean, info: object|null, error: string|null}>}
 */
export async function probe({ force = false } = {}) {
  if (!_config.enabled) return { ok: false, info: null, error: 'disabled' };
  const now = Date.now();
  if (!force && now - _lastProbe.at < PROBE_INTERVAL_MS && _lastProbe.at > 0) {
    return { ok: _lastProbe.ok, info: _lastProbe.info, error: _lastProbe.error };
  }
  try {
    const info = await _request({ path: '/api/health', timeoutMs: PROBE_TIMEOUT_MS });
    _lastProbe = { ok: !!info.ok, info, at: now, error: null };
    return { ok: !!info.ok, info, error: null };
  } catch (e) {
    _lastProbe = { ok: false, info: null, at: now, error: e.message };
    return { ok: false, info: null, error: e.message };
  }
}

export function lastProbe() { return { ..._lastProbe }; }

/**
 * Start the periodic background probe. Call once at server startup.
 */
export function startBackgroundProbe() {
  if (_probeTimer) return;
  // Initial probe — don't await, so server boot stays fast.
  probe({ force: true }).then((p) => {
    if (p.ok) log.info(`Forge slicer service detected: ${p.info?.service} v${p.info?.version}`);
    else log.debug(`Forge slicer service not available: ${p.error}`);
  }).catch(() => { /* swallow — already logged */ });
  _probeTimer = setInterval(() => { probe({ force: true }).catch(() => {}); }, PROBE_INTERVAL_MS);
}

export function stopBackgroundProbe() {
  if (_probeTimer) { clearInterval(_probeTimer); _probeTimer = null; }
}

export async function listProfiles({ kind = 'all', vendor } = {}) {
  let q = `?kind=${encodeURIComponent(kind)}`;
  if (vendor) q += `&vendor=${encodeURIComponent(vendor)}`;
  const res = await _request({ path: `/api/profiles${q}` });
  return res.profiles || [];
}

export async function getProfile(id) {
  return _request({ path: `/api/profiles/${encodeURIComponent(id)}` });
}

export async function listPrinters() {
  return _request({ path: '/api/printers' });
}

/**
 * Slice a model. Buffered (non-SSE) version — waits for the whole
 * response. Use sliceStream() for live progress events.
 *
 * @param {object} args
 * @param {Buffer} args.modelBuffer — STL/3MF bytes
 * @param {string} args.printerId
 * @param {string[]} args.filamentIds
 * @param {string} args.processId
 * @param {object} [args.overrides]
 * @returns {Promise<{ok:boolean, gcode_path:string, gcode_size:number, estimated_time_s:number, filament_used_g:number[]}>}
 */
export async function slice({ modelBuffer, modelFilename = 'model.stl', printerId, filamentIds, processId, overrides }) {
  if (!Buffer.isBuffer(modelBuffer)) throw new Error('modelBuffer must be a Buffer');
  const boundary = '----forge-slicer-' + Date.now().toString(36) + Math.random().toString(36).slice(2);
  const parts = [];
  const append = (name, value, headers = {}) => {
    parts.push(Buffer.from(`--${boundary}\r\n`));
    let h = `Content-Disposition: form-data; name="${name}"`;
    if (headers.filename) h += `; filename="${headers.filename}"`;
    parts.push(Buffer.from(h + '\r\n'));
    if (headers.contentType) parts.push(Buffer.from(`Content-Type: ${headers.contentType}\r\n`));
    parts.push(Buffer.from('\r\n'));
    parts.push(Buffer.isBuffer(value) ? value : Buffer.from(String(value)));
    parts.push(Buffer.from('\r\n'));
  };
  append('model', modelBuffer, { filename: modelFilename, contentType: 'application/octet-stream' });
  if (printerId) append('printer_id', printerId);
  if (Array.isArray(filamentIds)) append('filament_ids', JSON.stringify(filamentIds));
  if (processId) append('process_id', processId);
  if (overrides) append('overrides', JSON.stringify(overrides));
  parts.push(Buffer.from(`--${boundary}--\r\n`));
  const body = Buffer.concat(parts);

  return _request({
    path: '/api/slice',
    method: 'POST',
    body,
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Accept': 'application/json',  // request buffered response, not SSE
    },
    timeoutMs: 10 * 60_000,  // 10 min for big prints
  });
}

/**
 * Download the gcode produced by a slice job.
 *
 * @returns {Promise<Buffer>}
 */
export async function fetchGcode(jobId) {
  const res = await _request({
    path: `/api/jobs/${encodeURIComponent(jobId)}/gcode`,
    raw: true,
    timeoutMs: 60_000,
  });
  if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
  return res.body;
}

/**
 * Get a PNG thumbnail for a model.
 */
export async function preview({ modelBuffer, modelFilename = 'model.stl', width = 512, height = 512 }) {
  const boundary = '----forge-preview-' + Date.now().toString(36);
  const parts = [
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from(`Content-Disposition: form-data; name="model"; filename="${modelFilename}"\r\n`),
    Buffer.from('Content-Type: application/octet-stream\r\n\r\n'),
    modelBuffer,
    Buffer.from('\r\n'),
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from('Content-Disposition: form-data; name="width"\r\n\r\n'),
    Buffer.from(String(width)),
    Buffer.from('\r\n'),
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from('Content-Disposition: form-data; name="height"\r\n\r\n'),
    Buffer.from(String(height)),
    Buffer.from('\r\n'),
    Buffer.from(`--${boundary}--\r\n`),
  ];
  const res = await _request({
    path: '/api/preview',
    method: 'POST',
    body: Buffer.concat(parts),
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Accept': 'image/png' },
    raw: true,
    timeoutMs: 60_000,
  });
  if (res.status >= 400) throw new Error(`HTTP ${res.status}`);
  return res.body;
}
