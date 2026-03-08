import mqtt from 'mqtt';
import { getPrinters, getInventorySetting, setInventorySetting } from './database.js';

let _client = null;
let _hub = null;
let _publishTimer = null;
let _connected = false;
const DISCOVERY_PREFIX = 'homeassistant';
const STATE_PREFIX = 'bambu_dashboard';

export function initHaDiscovery(hub) {
  _hub = hub;
  const enabled = getInventorySetting('ha_mqtt_enabled');
  if (enabled === '1' || enabled === 'true') {
    _connect();
  } else {
    console.log('[ha-mqtt] Service disabled');
  }
}

export function restartHaDiscovery() {
  _disconnect();
  const enabled = getInventorySetting('ha_mqtt_enabled');
  if (enabled === '1' || enabled === 'true') {
    _connect();
  }
}

export function shutdownHaDiscovery() {
  _disconnect();
}

export function getHaDiscoveryStatus() {
  return {
    enabled: (getInventorySetting('ha_mqtt_enabled') === '1' || getInventorySetting('ha_mqtt_enabled') === 'true'),
    connected: _connected,
    broker: getInventorySetting('ha_mqtt_broker') || ''
  };
}

function _connect() {
  const broker = getInventorySetting('ha_mqtt_broker');
  if (!broker) {
    console.log('[ha-mqtt] No broker configured');
    return;
  }
  const username = getInventorySetting('ha_mqtt_username') || undefined;
  const password = getInventorySetting('ha_mqtt_password') || undefined;

  try {
    _client = mqtt.connect(broker, {
      username,
      password,
      reconnectPeriod: 10000,
      connectTimeout: 10000,
      clean: true,
      clientId: `bambu_dashboard_${Date.now().toString(36)}`
    });

    _client.on('connect', () => {
      _connected = true;
      console.log('[ha-mqtt] Connected to', broker);
      _publishDiscoveryAll();
      _publishStateAll();
      // Publish state every 15 seconds
      if (_publishTimer) clearInterval(_publishTimer);
      _publishTimer = setInterval(_publishStateAll, 15000);
    });

    _client.on('error', (err) => {
      console.error('[ha-mqtt] Error:', err.message);
    });

    _client.on('close', () => {
      _connected = false;
    });

    _client.on('offline', () => {
      _connected = false;
    });
  } catch (e) {
    console.error('[ha-mqtt] Connect failed:', e.message);
  }
}

function _disconnect() {
  if (_publishTimer) { clearInterval(_publishTimer); _publishTimer = null; }
  if (_client) {
    try { _client.end(true); } catch {}
    _client = null;
  }
  _connected = false;
}

function _slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function _publishDiscoveryAll() {
  if (!_client || !_connected) return;
  const printers = getPrinters();
  for (const p of printers) {
    _publishPrinterDiscovery(p);
  }
}

function _publishPrinterDiscovery(printer) {
  const slug = _slugify(printer.name);
  const deviceId = `bambu_${printer.id}`;
  const stateTopic = `${STATE_PREFIX}/${printer.id}/state`;
  const attrTopic = `${STATE_PREFIX}/${printer.id}/attributes`;
  const availTopic = `${STATE_PREFIX}/${printer.id}/availability`;

  const device = {
    identifiers: [deviceId],
    name: printer.name,
    manufacturer: 'Bambu Lab',
    model: printer.model || 'Unknown',
    via_device: 'bambu_dashboard'
  };

  const sensors = [
    { id: 'status', name: 'Status', icon: 'mdi:printer-3d', val: '{{ value_json.status }}' },
    { id: 'progress', name: 'Print Progress', icon: 'mdi:percent', unit: '%', val: '{{ value_json.progress }}', cls: null },
    { id: 'remaining', name: 'Remaining Time', icon: 'mdi:timer-outline', unit: 'min', val: '{{ value_json.remaining_minutes }}' },
    { id: 'layer', name: 'Current Layer', icon: 'mdi:layers', val: '{{ value_json.layer }}' },
    { id: 'total_layers', name: 'Total Layers', icon: 'mdi:layers-triple', val: '{{ value_json.total_layers }}' },
    { id: 'nozzle_temp', name: 'Nozzle Temperature', unit: '°C', val: '{{ value_json.nozzle_temp }}', cls: 'temperature' },
    { id: 'nozzle_target', name: 'Nozzle Target', unit: '°C', val: '{{ value_json.nozzle_target }}', cls: 'temperature' },
    { id: 'bed_temp', name: 'Bed Temperature', unit: '°C', val: '{{ value_json.bed_temp }}', cls: 'temperature' },
    { id: 'bed_target', name: 'Bed Target', unit: '°C', val: '{{ value_json.bed_target }}', cls: 'temperature' },
    { id: 'chamber_temp', name: 'Chamber Temperature', unit: '°C', val: '{{ value_json.chamber_temp }}', cls: 'temperature' },
    { id: 'current_file', name: 'Current File', icon: 'mdi:file-document', val: '{{ value_json.current_file }}' },
    { id: 'speed', name: 'Speed', icon: 'mdi:speedometer', unit: '%', val: '{{ value_json.speed_pct }}' },
    { id: 'wifi_signal', name: 'WiFi Signal', icon: 'mdi:wifi', val: '{{ value_json.wifi_signal }}', cls: 'signal_strength' }
  ];

  const binarySensors = [
    { id: 'printing', name: 'Printing', val: '{{ value_json.printing }}', cls: 'running', on: 'true', off: 'false' },
    { id: 'online', name: 'Online', val: '{{ value_json.online }}', cls: 'connectivity', on: 'true', off: 'false' }
  ];

  // Publish sensor discovery configs
  for (const s of sensors) {
    const uid = `${deviceId}_${s.id}`;
    const config = {
      name: s.name,
      unique_id: uid,
      object_id: `${slug}_${s.id}`,
      state_topic: stateTopic,
      value_template: s.val,
      device,
      availability_topic: availTopic,
      payload_available: 'online',
      payload_not_available: 'offline'
    };
    if (s.unit) config.unit_of_measurement = s.unit;
    if (s.icon) config.icon = s.icon;
    if (s.cls) config.device_class = s.cls;
    _client.publish(`${DISCOVERY_PREFIX}/sensor/${deviceId}/${s.id}/config`, JSON.stringify(config), { retain: true });
  }

  // Publish binary sensor discovery configs
  for (const b of binarySensors) {
    const uid = `${deviceId}_${b.id}`;
    const config = {
      name: b.name,
      unique_id: uid,
      object_id: `${slug}_${b.id}`,
      state_topic: stateTopic,
      value_template: b.val,
      payload_on: b.on,
      payload_off: b.off,
      device_class: b.cls,
      device,
      availability_topic: availTopic,
      payload_available: 'online',
      payload_not_available: 'offline'
    };
    _client.publish(`${DISCOVERY_PREFIX}/binary_sensor/${deviceId}/${b.id}/config`, JSON.stringify(config), { retain: true });
  }

  console.log(`[ha-mqtt] Published discovery for ${printer.name}`);
}

function _publishStateAll() {
  if (!_client || !_connected || !_hub) return;
  const printers = getPrinters();
  for (const p of printers) {
    const state = _hub.printerStates?.[p.id] || {};
    const gcodeState = state.gcode_state || 'OFFLINE';
    const isPrinting = ['RUNNING', 'PREPARE', 'PAUSE'].includes(gcodeState);
    const isOnline = gcodeState !== 'OFFLINE';

    const payload = {
      status: gcodeState,
      progress: isPrinting ? (parseInt(state.mc_percent) || 0) : 0,
      remaining_minutes: isPrinting ? (parseInt(state.mc_remaining_time) || 0) : 0,
      layer: parseInt(state.layer_num) || 0,
      total_layers: parseInt(state.total_layer_num) || 0,
      nozzle_temp: state.nozzle_temper ?? 0,
      nozzle_target: state.nozzle_target_temper ?? 0,
      bed_temp: state.bed_temper ?? 0,
      bed_target: state.bed_target_temper ?? 0,
      chamber_temp: state.chamber_temper ?? 0,
      current_file: isPrinting ? (state.subtask_name || '') : '',
      speed_pct: parseInt(state.spd_mag) || 100,
      wifi_signal: state.wifi_signal || '',
      printing: isPrinting ? 'true' : 'false',
      online: isOnline ? 'true' : 'false'
    };

    _client.publish(`${STATE_PREFIX}/${p.id}/state`, JSON.stringify(payload), { retain: true });
    _client.publish(`${STATE_PREFIX}/${p.id}/availability`, isOnline ? 'online' : 'offline', { retain: true });
  }
}

// Called from index.js on every status broadcast for real-time updates
export function onPrinterStateUpdate(printerId, state) {
  if (!_client || !_connected) return;
  const gcodeState = state.gcode_state || 'OFFLINE';
  const isPrinting = ['RUNNING', 'PREPARE', 'PAUSE'].includes(gcodeState);
  const isOnline = gcodeState !== 'OFFLINE';

  const payload = {
    status: gcodeState,
    progress: isPrinting ? (parseInt(state.mc_percent) || 0) : 0,
    remaining_minutes: isPrinting ? (parseInt(state.mc_remaining_time) || 0) : 0,
    layer: parseInt(state.layer_num) || 0,
    total_layers: parseInt(state.total_layer_num) || 0,
    nozzle_temp: state.nozzle_temper ?? 0,
    nozzle_target: state.nozzle_target_temper ?? 0,
    bed_temp: state.bed_temper ?? 0,
    bed_target: state.bed_target_temper ?? 0,
    chamber_temp: state.chamber_temper ?? 0,
    current_file: isPrinting ? (state.subtask_name || '') : '',
    speed_pct: parseInt(state.spd_mag) || 100,
    wifi_signal: state.wifi_signal || '',
    printing: isPrinting ? 'true' : 'false',
    online: isOnline ? 'true' : 'false'
  };

  _client.publish(`${STATE_PREFIX}/${printerId}/state`, JSON.stringify(payload), { retain: true });
  _client.publish(`${STATE_PREFIX}/${printerId}/availability`, isOnline ? 'online' : 'offline', { retain: true });
}
