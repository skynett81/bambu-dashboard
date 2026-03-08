import { getRemoteNodes, updateRemoteNode } from './database.js';
import https from 'node:https';
import http from 'node:http';

let _hub = null;
let _broadcastFn = null;
let _pollTimer = null;
let _remoteStates = {}; // { nodeId: { printers: [...] } }

const POLL_INTERVAL = 10000; // 10 seconds

export function initRemoteNodes(hub, broadcastFn) {
  _hub = hub;
  _broadcastFn = broadcastFn;
  _startPolling();
  console.log('[remote-nodes] Service initialized');
}

export function restartRemoteNodes() {
  _stopPolling();
  _remoteStates = {};
  // Remove all remote printers from hub
  if (_hub) {
    for (const key of Object.keys(_hub.printerMeta)) {
      if (key.startsWith('remote_')) {
        _hub.removePrinterMeta(key);
      }
    }
  }
  _startPolling();
}

export function shutdownRemoteNodes() {
  _stopPolling();
}

export function getRemoteNodeStates() {
  const nodes = getRemoteNodes();
  return nodes.map(n => ({
    ...n,
    api_key: n.api_key ? '***' : null,
    printers: _remoteStates[n.id]?.printers || []
  }));
}

function _startPolling() {
  const nodes = getRemoteNodes();
  if (nodes.length === 0) return;
  _pollAll();
  _pollTimer = setInterval(_pollAll, POLL_INTERVAL);
}

function _stopPolling() {
  if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
}

async function _pollAll() {
  const nodes = getRemoteNodes();
  if (nodes.length === 0) { _stopPolling(); return; }

  for (const node of nodes) {
    if (!node.enabled) continue;
    try {
      await _pollNode(node);
    } catch (e) {
      _handleNodeError(node, e.message);
    }
  }
}

function _httpGet(url, headers) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const mod = isHttps ? https : http;
    const opts = { headers, timeout: 8000 };
    if (isHttps) opts.rejectUnauthorized = false;

    const req = mod.get(url, opts, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(body)); }
          catch { reject(new Error('Invalid JSON response')); }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body.substring(0, 100)}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function _pollNode(node) {
  const url = node.base_url.replace(/\/+$/, '') + '/api/status/public';
  const headers = {};
  if (node.api_key) headers['Authorization'] = `Bearer ${node.api_key}`;

  const data = await _httpGet(url, headers);
  if (!data.printers || !Array.isArray(data.printers)) {
    throw new Error('Invalid response format');
  }

  updateRemoteNode(node.id, { last_seen: new Date().toISOString(), last_error: null });
  _remoteStates[node.id] = data;
  _injectPrinters(node, data.printers);
}

// Also exported for test endpoint in api-routes
export async function testRemoteNode(baseUrl, apiKey) {
  const url = baseUrl.replace(/\/+$/, '') + '/api/status/public';
  const headers = {};
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
  const data = await _httpGet(url, headers);
  return { ok: true, printers: data.printers?.length || 0 };
}

function _injectPrinters(node, printers) {
  if (!_hub || !_broadcastFn) return;

  for (const p of printers) {
    const remoteId = `remote_${node.id}_${p.id}`;

    _hub.setPrinterMeta(remoteId, {
      name: `${p.name}`,
      model: p.model || '',
      cameraPort: 0,
      remote: true,
      remoteNodeId: node.id,
      remoteNodeName: node.name
    });

    const statePayload = {
      printer_id: remoteId,
      gcode_state: p.status || 'OFFLINE',
      mc_percent: p.progress,
      mc_remaining_time: p.remaining_minutes,
      subtask_name: p.current_file || '',
      layer_num: p.layer || 0,
      total_layer_num: p.total_layers || 0,
      nozzle_temper: p.nozzle_temp,
      bed_temper: p.bed_temp,
      _remote: true,
      _remoteNodeId: node.id,
      _remoteNodeName: node.name
    };

    _hub.printerStates[remoteId] = statePayload;
    _broadcastFn('status', statePayload);
  }
}

function _handleNodeError(node, message) {
  const shortened = message.length > 200 ? message.substring(0, 200) : message;
  updateRemoteNode(node.id, { last_error: shortened });

  if (_remoteStates[node.id]) {
    for (const p of _remoteStates[node.id].printers || []) {
      const remoteId = `remote_${node.id}_${p.id}`;
      if (_hub?.printerStates?.[remoteId]) {
        _hub.printerStates[remoteId].gcode_state = 'OFFLINE';
        _broadcastFn?.('status', { printer_id: remoteId, gcode_state: 'OFFLINE', _remote: true });
      }
    }
  }
}
