export function formatTemp(value) {
  if (value == null) return '--';
  return `${Math.round(value * 10) / 10}°C`;
}

export function formatPercent(value) {
  if (value == null) return '--';
  return `${Math.round(value)}%`;
}

export function formatTime(minutes) {
  if (!minutes || minutes <= 0) return '--';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}${t('time.h')} ${m}${t('time.m')}`;
  return `${m}${t('time.m')}`;
}

export function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}${t('time.h')} ${m}${t('time.m')}`;
  return `${m}${t('time.m')}`;
}

export function formatFanSpeed(raw) {
  const val = parseInt(raw) || 0;
  return `${Math.round((val / 255) * 100)}%`;
}

export function formatWifi(signal) {
  if (!signal) return '--';
  return signal.replace('dBm', ' dBm');
}

export function stateToLocalized(state) {
  const key = { IDLE: 'idle', RUNNING: 'running', PAUSE: 'pause', FINISH: 'finish', FAILED: 'failed', PREPARE: 'prepare', HEATING: 'heating' }[state];
  return key ? t(`state.${key}`) : state || t('state.unknown');
}

export function hexToRgba(hex) {
  if (!hex || hex.length < 6) return 'rgba(128,128,128,1)';
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const a = hex.length >= 8 ? parseInt(hex.substring(6, 8), 16) / 255 : 1;
  return `rgba(${r},${g},${b},${a})`;
}

export function speedLevelName(level) {
  const map = { 1: 'silent', 2: 'standard', 3: 'sport', 4: 'ludicrous' };
  const key = map[level];
  return key ? t(`speed.${key}`) : t('state.unknown');
}
