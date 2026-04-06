// Notification Manager — 7 channels, quiet hours, bed cooling, maintenance alerts
import { request as httpsRequest } from 'node:https';
import { request as httpRequest } from 'node:http';
import { connect as tlsConnect } from 'node:tls';
import { connect as netConnect } from 'node:net';
import {
  addNotificationLog, addNotificationQueue, getNotificationQueue,
  clearNotificationQueue, getMaintenanceSchedule
} from './database.js';
import { createLogger } from './logger.js';

const log = createLogger('notify');

// ---- HTTP helper (zero dependencies) ----

function _httpPost(urlStr, headers, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const isHttps = url.protocol === 'https:';
    const reqFn = isHttps ? httpsRequest : httpRequest;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...headers
      }
    };

    const req = reqFn(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => req.destroy(new Error('Request timeout')));
    req.write(body);
    req.end();
  });
}

// ---- Channel Senders ----

function escapeMarkdown(text) {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

async function sendTelegram(conf, title, message) {
  const url = `https://api.telegram.org/bot${conf.botToken}/sendMessage`;
  const body = JSON.stringify({
    chat_id: conf.chatId,
    text: `*${escapeMarkdown(title)}*\n\n${escapeMarkdown(message)}`,
    parse_mode: 'MarkdownV2'
  });
  return _httpPost(url, {}, body);
}

async function sendDiscord(conf, title, message, eventType) {
  const colors = {
    print_started: 0x3498db, print_finished: 0x2ecc71,
    print_failed: 0xe74c3c, print_cancelled: 0xf39c12,
    printer_error: 0xe74c3c, maintenance_due: 0xf39c12,
    bed_cooled: 0x2ecc71, test: 0x9b59b6, digest: 0x3498db,
    drying_due: 0xf0883e, filament_low_stock: 0xf0883e
  };
  const body = JSON.stringify({
    embeds: [{
      title, description: message,
      color: colors[eventType] || 0x95a5a6,
      timestamp: new Date().toISOString(),
      footer: { text: '3DPrintForge by SkyNett81' }
    }]
  });
  return _httpPost(conf.webhookUrl, {}, body);
}

async function sendEmail(conf, title, message) {
  return new Promise((resolve, reject) => {
    const port = conf.port || 587;
    const useDirectTLS = port === 465;
    let resolved = false;

    function done(err) {
      if (resolved) return;
      resolved = true;
      err ? reject(err) : resolve();
    }

    function handleSmtp(socket) {
      let step = 0;
      let buffer = '';
      socket.setEncoding('utf-8');

      socket.on('data', (data) => {
        buffer += data;
        while (buffer.includes('\r\n')) {
          const line = buffer.substring(0, buffer.indexOf('\r\n'));
          buffer = buffer.substring(buffer.indexOf('\r\n') + 2);
          processLine(line);
        }
      });

      socket.on('error', done);

      function send(cmd) { socket.write(cmd + '\r\n'); }

      function processLine(line) {
        const code = parseInt(line.substring(0, 3));
        if (line[3] === '-') return; // multi-line response

        switch (step) {
          case 0: // greeting
            if (code === 220) { send('EHLO 3dprintforge'); step = 1; }
            else done(new Error(`SMTP greeting: ${line}`));
            break;
          case 1: // EHLO
            if (code === 250) {
              if (!useDirectTLS) { send('STARTTLS'); step = 2; }
              else doAuth();
            }
            break;
          case 2: // STARTTLS
            if (code === 220) {
              const tls = tlsConnect({ socket, servername: conf.host, rejectUnauthorized: true }, () => {
                socket = tls;
                socket.setEncoding('utf-8');
                buffer = '';
                socket.on('data', (d) => {
                  buffer += d;
                  while (buffer.includes('\r\n')) {
                    const l = buffer.substring(0, buffer.indexOf('\r\n'));
                    buffer = buffer.substring(buffer.indexOf('\r\n') + 2);
                    processLine(l);
                  }
                });
                socket.on('error', done);
                send('EHLO 3dprintforge');
                step = 3;
              });
            }
            break;
          case 3: if (code === 250) doAuth(); break;
          case 4: // AUTH LOGIN
            if (code === 334) { send(Buffer.from(conf.user).toString('base64')); step = 5; }
            break;
          case 5: // username
            if (code === 334) { send(Buffer.from(conf.pass).toString('base64')); step = 6; }
            break;
          case 6: // auth result
            if (code === 235) { send(`MAIL FROM:<${conf.from}>`); step = 7; }
            else done(new Error(`SMTP auth failed: ${line}`));
            break;
          case 7: if (code === 250) { send(`RCPT TO:<${conf.to}>`); step = 8; } break;
          case 8: if (code === 250) { send('DATA'); step = 9; } break;
          case 9:
            if (code === 354) {
              send([
                `From: 3DPrintForge <${conf.from}>`,
                `To: ${conf.to}`,
                `Subject: ${title}`,
                'MIME-Version: 1.0',
                'Content-Type: text/plain; charset=utf-8',
                `Date: ${new Date().toUTCString()}`,
                '', message, '.'
              ].join('\r\n'));
              step = 10;
            }
            break;
          case 10:
            if (code === 250) { send('QUIT'); step = 11; done(); }
            else done(new Error(`SMTP send failed: ${line}`));
            break;
          case 11: socket.destroy(); break;
        }
      }

      function doAuth() {
        if (conf.user && conf.pass) { send('AUTH LOGIN'); step = 4; }
        else { send(`MAIL FROM:<${conf.from}>`); step = 7; }
      }
    }

    const connectOpts = { host: conf.host, port };
    if (useDirectTLS) {
      const s = tlsConnect({ ...connectOpts, servername: conf.host, rejectUnauthorized: true }, () => handleSmtp(s));
      s.on('error', done);
      s.setTimeout(15000, () => s.destroy(new Error('SMTP timeout')));
    } else {
      const s = netConnect(connectOpts, () => handleSmtp(s));
      s.on('error', done);
      s.setTimeout(15000, () => s.destroy(new Error('SMTP timeout')));
    }
  });
}

function isPrivateUrl(urlStr) {
  try {
    const url = new URL(urlStr);
    const hostname = url.hostname;
    // Block localhost, private IPs, link-local
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return true;
    if (hostname === '0.0.0.0' || hostname === '[::]') return true;
    // Block private IP ranges
    const parts = hostname.split('.').map(Number);
    if (parts.length === 4 && parts.every(n => !isNaN(n))) {
      if (parts[0] === 10) return true;
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
      if (parts[0] === 192 && parts[1] === 168) return true;
      if (parts[0] === 169 && parts[1] === 254) return true;
    }
    // Block non-http(s) schemes
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return true;
    return false;
  } catch {
    return true;
  }
}

async function sendWebhook(conf, title, message, eventType, data) {
  if (isPrivateUrl(conf.url)) {
    throw new Error('Webhook URL cannot target private/internal networks');
  }
  const payload = JSON.stringify({
    event: eventType, title, message,
    timestamp: new Date().toISOString(),
    data: {
      printer_id: data.printerId || null,
      printer_name: data.printerName || null,
      filename: data.filename || null,
      duration: data.duration || null,
      filament_used: data.filamentUsed || null,
      error: data.error || null,
      bed_temp: data.bedTemp || null
    }
  });
  const customHeaders = conf.headers || {};
  return _httpPost(conf.url, customHeaders, payload);
}

async function sendNtfy(conf, title, message, eventType) {
  const url = `${conf.serverUrl.replace(/\/+$/, '')}/${conf.topic}`;
  const priorityMap = {
    print_failed: '5', printer_error: '5', maintenance_due: '4',
    print_finished: '3', bed_cooled: '3', print_cancelled: '3',
    print_started: '2', test: '3', digest: '3',
    drying_due: '3', filament_low_stock: '4'
  };
  const tagMap = {
    print_started: 'rocket', print_finished: 'white_check_mark',
    print_failed: 'x', print_cancelled: 'stop_sign',
    printer_error: 'warning', maintenance_due: 'wrench',
    bed_cooled: 'snowflake', test: 'test_tube', digest: 'clipboard',
    drying_due: 'droplet', filament_low_stock: 'warning'
  };
  const headers = {
    'Title': title,
    'Priority': priorityMap[eventType] || '3',
    'Tags': tagMap[eventType] || 'printer',
    'Content-Type': 'text/plain'
  };
  if (conf.token) headers['Authorization'] = `Bearer ${conf.token}`;
  // ntfy expects plain text body
  return _httpPost(url, headers, message);
}

async function sendSms(conf, title, message) {
  const text = `${title}\n${message}`.substring(0, 1600);
  if (conf.provider === 'twilio') {
    // Twilio REST API
    const url = `https://api.twilio.com/2010-04-01/Accounts/${conf.accountSid}/Messages.json`;
    const body = `To=${encodeURIComponent(conf.toNumber)}&From=${encodeURIComponent(conf.fromNumber)}&Body=${encodeURIComponent(text)}`;
    const auth = Buffer.from(`${conf.accountSid}:${conf.authToken}`).toString('base64');
    return _httpPost(url, {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }, body);
  } else {
    // Generic HTTP SMS gateway
    const url = conf.gatewayUrl;
    if (!url) throw new Error('SMS gateway URL not configured');
    // Sanitize extraParams: only allow string values
    let extra = {};
    if (conf.extraParams) {
      try {
        const parsed = JSON.parse(conf.extraParams);
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof k === 'string' && (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')) {
            extra[k] = v;
          }
        }
      } catch { /* invalid JSON — ignore */ }
    }
    const payload = JSON.stringify({
      to: conf.toNumber,
      from: conf.fromNumber || 'BambuDash',
      message: text,
      ...extra
    });
    // Sanitize gatewayHeaders: only allow string-to-string pairs, block sensitive headers
    let headers = {};
    const blockedHeaders = new Set(['host', 'cookie', 'authorization', 'proxy-authorization', 'transfer-encoding']);
    if (conf.gatewayHeaders) {
      try {
        const parsed = JSON.parse(conf.gatewayHeaders);
        for (const [k, v] of Object.entries(parsed)) {
          if (typeof k === 'string' && typeof v === 'string' && !blockedHeaders.has(k.toLowerCase())) {
            headers[k] = v;
          }
        }
      } catch { /* invalid JSON — ignore */ }
    }
    return _httpPost(url, headers, payload);
  }
}

async function sendPushover(conf, title, message, eventType) {
  const priorityMap = {
    print_failed: 1, printer_error: 1, maintenance_due: 0,
    print_finished: 0, bed_cooled: -1, print_started: -1,
    print_cancelled: 0, test: 0, digest: 0,
    drying_due: 0, filament_low_stock: 0
  };
  const body = JSON.stringify({
    token: conf.apiToken,
    user: conf.userKey,
    title, message,
    priority: priorityMap[eventType] ?? 0
  });
  return _httpPost('https://api.pushover.net/1/messages.json', {}, body);
}

// ---- NotificationManager ----

export class NotificationManager {
  constructor(notifConfig) {
    this.config = notifConfig || {};
    this._bedMonitors = new Map();
    this._maintenanceAlerted = new Set();
    this._dryingAlerted = new Set();
    this._lowStockAlerted = new Set();
    this._getPrinterIds = null;
    this._getSpoolsDryingStatus = null;
    this._getLowStockSpools = null;
    this._digestTimer = null;
    this._maintenanceTimer = null;
    this._dryingTimer = null;
    this._lowStockTimer = null;

    this._startDigestTimer();
    this._startMaintenanceChecker();
    this._startDryingChecker();
    this._startLowStockChecker();
  }

  reloadConfig(newConfig) {
    this.config = newConfig;
    if (this._digestTimer) clearInterval(this._digestTimer);
    this._startDigestTimer();
  }

  setPrinterListProvider(fn) {
    this._getPrinterIds = fn;
  }

  setDryingStatusProvider(fn) {
    this._getSpoolsDryingStatus = fn;
  }

  setLowStockProvider(fn) {
    this._getLowStockSpools = fn;
  }

  // ---- Core dispatch ----

  setWebhookDispatcher(fn) {
    this._webhookDispatcher = fn;
  }

  setPushDispatcher(fn) {
    this._pushDispatcher = fn;
  }

  async notify(eventType, data) {
    // Always dispatch to outgoing webhooks (independent of notification system)
    if (this._webhookDispatcher) {
      try {
        const { title: whTitle, message: whMsg } = this._formatMessage(eventType, data);
        this._webhookDispatcher(eventType, whTitle, whMsg, data);
      } catch (e) { log.warn('Webhook dispatch failed', e.message); }
    }

    // Always dispatch to Web Push subscribers
    if (this._pushDispatcher) {
      try {
        const { title: pushTitle, message: pushMsg } = this._formatMessage(eventType, data);
        this._pushDispatcher(eventType, pushTitle, pushMsg, data);
      } catch (e) { log.warn('Web Push dispatch failed', e.message); }
    }

    if (!this.config.enabled) return;

    const eventConf = this.config.events?.[eventType];
    if (!eventConf?.enabled) return;

    const { title, message } = this._formatMessage(eventType, data);

    if (this._isQuietHours()) {
      addNotificationQueue({
        event_type: eventType,
        printer_id: data.printerId,
        printer_name: data.printerName,
        title, message, event_data: data
      });
      log.info('Queued during quiet hours: ' + eventType);
      return;
    }

    const enabledChannels = eventConf.channels || [];
    for (const channelName of enabledChannels) {
      const channelConf = this.config.channels?.[channelName];
      if (!channelConf?.enabled) continue;

      try {
        await this._sendToChannel(channelName, channelConf, title, message, eventType, data);
        addNotificationLog({
          event_type: eventType, channel: channelName,
          printer_id: data.printerId, title, message, status: 'sent'
        });
        log.info('Sent ' + eventType + ' via ' + channelName);
      } catch (err) {
        log.error(channelName + ' failed: ' + err.message);
        addNotificationLog({
          event_type: eventType, channel: channelName,
          printer_id: data.printerId, title, message,
          status: 'failed', error_info: err.message
        });
      }
    }
  }

  async testChannel(channelName, channelConf) {
    const title = '3DPrintForge — Test';
    const message = `This is a test notification.\nChannel: ${channelName}\nTime: ${new Date().toLocaleString()}`;
    return this._sendToChannel(channelName, channelConf, title, message, 'test', {});
  }

  // ---- Bed cooling monitor ----

  updateBedMonitor(printerId, printerName, printData) {
    if (!this.config.enabled) return;
    if (!this.config.events?.bed_cooled?.enabled) return;

    const state = printData.gcode_state;
    const bedTemp = printData.bed_temper;
    const threshold = this.config.bedCooledThreshold || 30;

    let monitor = this._bedMonitors.get(printerId);
    if (!monitor) {
      monitor = { lastState: null, tracking: false, notified: false };
      this._bedMonitors.set(printerId, monitor);
    }

    if (monitor.lastState === 'RUNNING' && state === 'FINISH') {
      monitor.tracking = true;
      monitor.notified = false;
    }
    if (state === 'RUNNING') {
      monitor.tracking = false;
      monitor.notified = false;
    }

    if (monitor.tracking && !monitor.notified && bedTemp != null && bedTemp <= threshold) {
      monitor.notified = true;
      monitor.tracking = false;
      this.notify('bed_cooled', { printerId, printerName, bedTemp: Math.round(bedTemp * 10) / 10 });
    }

    monitor.lastState = state;
  }

  // ---- Quiet hours ----

  _isQuietHours() {
    const qh = this.config.quietHours;
    if (!qh?.enabled) return false;

    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const [sH, sM] = (qh.start || '23:00').split(':').map(Number);
    const [eH, eM] = (qh.end || '07:00').split(':').map(Number);
    const start = sH * 60 + sM;
    const end = eH * 60 + eM;

    if (start > end) return mins >= start || mins < end; // overnight
    return mins >= start && mins < end;
  }

  _startDigestTimer() {
    this._digestTimer = setInterval(() => this._checkDigest(), 60000);
  }

  async _checkDigest() {
    const qh = this.config.quietHours;
    if (!qh?.enabled) return;

    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    const [eH, eM] = (qh.end || '07:00').split(':').map(Number);
    const end = eH * 60 + eM;

    if (mins >= end && mins < end + 1) {
      await this._sendDigest();
    }
  }

  async _sendDigest() {
    const queued = getNotificationQueue();
    if (queued.length === 0) return;

    const title = `3DPrintForge — Digest (${queued.length} events)`;
    let message = `Summary of ${queued.length} events during quiet hours:\n\n`;
    for (const q of queued) {
      message += `[${q.queued_at}] ${q.title}\n`;
    }

    for (const [channelName, channelConf] of Object.entries(this.config.channels || {})) {
      if (!channelConf?.enabled) continue;
      try {
        await this._sendToChannel(channelName, channelConf, title, message, 'digest', {});
        addNotificationLog({ event_type: 'digest', channel: channelName, title, message, status: 'sent' });
      } catch (err) {
        log.error('Digest ' + channelName + ' failed: ' + err.message);
      }
    }

    clearNotificationQueue();
    log.info('Digest sent: ' + queued.length + ' queued events');
  }

  // ---- Maintenance checker ----

  _startMaintenanceChecker() {
    this._maintenanceTimer = setInterval(() => this._checkMaintenance(), 30 * 60 * 1000);
    setTimeout(() => this._checkMaintenance(), 15000);
  }

  _checkMaintenance() {
    if (!this.config.enabled || !this.config.events?.maintenance_due?.enabled) return;
    if (!this._getPrinterIds) return;

    const printers = this._getPrinterIds();
    for (const { id, name } of printers) {
      try {
        const schedule = getMaintenanceSchedule(id);
        if (!schedule?.components) continue;
        for (const comp of schedule.components) {
          const key = `${id}:${comp.component}`;
          if (comp.overdue && !this._maintenanceAlerted.has(key)) {
            this._maintenanceAlerted.add(key);
            this.notify('maintenance_due', {
              printerId: id, printerName: name,
              component: comp.component,
              overdueHours: Math.round((comp.hours_since || 0) - (comp.interval_hours || 0))
            });
          } else if (!comp.overdue) {
            this._maintenanceAlerted.delete(key);
          }
        }
      } catch { /* skip */ }
    }
  }

  // ---- Drying checker ----

  _startDryingChecker() {
    this._dryingTimer = setInterval(() => this._checkDrying(), 60 * 60 * 1000);
    setTimeout(() => this._checkDrying(), 30000);
  }

  _checkDrying() {
    if (!this.config.enabled || !this.config.events?.drying_due?.enabled) return;
    if (!this._getSpoolsDryingStatus) return;

    try {
      const statuses = this._getSpoolsDryingStatus();
      for (const s of statuses) {
        if (s.drying_status === 'overdue') {
          const key = `drying:${s.id}`;
          if (!this._dryingAlerted.has(key)) {
            this._dryingAlerted.add(key);
            this.notify('drying_due', {
              spoolId: s.id,
              spoolName: s.profile_name || 'Unknown',
              material: s.material || 'Unknown',
              daysSinceDried: Math.round(s.days_since_dried || 0),
              maxDays: s.max_days_without_drying || 30
            });
          }
        } else {
          this._dryingAlerted.delete(`drying:${s.id}`);
        }
      }
    } catch { /* skip */ }
  }

  // ---- Low stock checker ----

  _startLowStockChecker() {
    this._lowStockTimer = setInterval(() => this._checkLowStock(), 60 * 60 * 1000);
    setTimeout(() => this._checkLowStock(), 45000);
  }

  _checkLowStock() {
    if (!this.config.enabled || !this.config.events?.filament_low_stock?.enabled) return;
    if (!this._getLowStockSpools) return;

    try {
      const spools = this._getLowStockSpools();
      for (const s of spools) {
        const key = `low:${s.id}`;
        if (!this._lowStockAlerted.has(key)) {
          this._lowStockAlerted.add(key);
          this.notify('filament_low_stock', {
            spoolId: s.id,
            spoolName: s.profile_name || 'Unknown',
            material: s.material || 'Unknown',
            vendorName: s.vendor_name || '',
            remainingG: Math.round(s.remaining_weight_g),
            remainingPct: s.remaining_pct,
            thresholdPct: 20
          });
        }
      }
      // Clear alerts for spools no longer low
      for (const key of this._lowStockAlerted) {
        const id = parseInt(key.split(':')[1]);
        if (!spools.find(s => s.id === id)) {
          this._lowStockAlerted.delete(key);
        }
      }
    } catch { /* skip */ }
  }

  // ---- Message formatting ----

  _formatMessage(eventType, data) {
    const printer = data.printerName || data.printerId || 'Unknown';
    const file = data.filename || 'Unknown file';

    switch (eventType) {
      case 'print_started':
        return { title: `Print Started — ${printer}`, message: `Printer: ${printer}\nFile: ${file}` };

      case 'print_finished': {
        const dur = data.duration ? this._fmtDuration(data.duration) : 'N/A';
        const fil = data.filamentUsed ? `${data.filamentUsed}g` : 'N/A';
        return {
          title: `Print Finished — ${printer}`,
          message: `Printer: ${printer}\nFile: ${file}\nDuration: ${dur}\nFilament: ${fil}`
        };
      }

      case 'print_failed':
        return {
          title: `Print Failed — ${printer}`,
          message: `Printer: ${printer}\nFile: ${file}${data.error ? '\nError: ' + data.error : ''}`
        };

      case 'print_cancelled':
        return { title: `Print Cancelled — ${printer}`, message: `Printer: ${printer}\nFile: ${file}` };

      case 'printer_error':
        return {
          title: `Printer Error — ${printer}`,
          message: `Printer: ${printer}\nCode: ${data.code || 'N/A'}\nMessage: ${data.errorMessage || 'Unknown'}\nSeverity: ${data.severity || 'unknown'}`
        };

      case 'maintenance_due':
        return {
          title: `Maintenance Due — ${printer}`,
          message: `Printer: ${printer}\nComponent: ${data.component}\nOverdue: ${data.overdueHours}h`
        };

      case 'bed_cooled':
        return {
          title: `Bed Cooled — ${printer}`,
          message: `Printer: ${printer}\nBed temp: ${data.bedTemp}°C\nReady to remove print.`
        };

      case 'update_available':
        return {
          title: 'Update Available — 3DPrintForge',
          message: `New version: ${data.latest}\nCurrent: ${data.current}${data.changelog ? '\n\n' + data.changelog.substring(0, 300) : ''}`
        };

      case 'protection_alert':
        return {
          title: `Print Guard Alert — ${printer}`,
          message: `Printer: ${printer}\nDetection: ${data.eventType || 'Unknown'}\nAction: ${data.action || 'notify'}${data.notes ? '\nDetails: ' + data.notes : ''}`
        };

      case 'drying_due':
        return {
          title: `Drying Due — ${data.material}`,
          message: `Spool: ${data.spoolName}\nMaterial: ${data.material}\nDays since dried: ${data.daysSinceDried}\nRecommended: dry every ${data.maxDays} days`
        };

      case 'filament_low_stock':
        return {
          title: `Low Stock — ${data.material}`,
          message: `Spool: ${data.spoolName}\nMaterial: ${data.material}${data.vendorName ? '\nVendor: ' + data.vendorName : ''}\nRemaining: ${data.remainingG}g (${data.remainingPct}%)`
        };

      case 'queue_item_started':
        return {
          title: `Queue Print Started — ${data.printerName || 'Unknown'}`,
          message: `Queue: ${data.queueName || 'Unknown'}\nPrinter: ${data.printerName || 'Unknown'}\nFile: ${data.filename || 'Unknown'}`
        };

      case 'queue_item_completed':
        return {
          title: `Queue Print Completed — ${data.printerName || 'Unknown'}`,
          message: `Queue: ${data.queueName || 'Unknown'}\nPrinter: ${data.printerName || 'Unknown'}\nFile: ${data.filename || 'Unknown'}`
        };

      case 'queue_item_failed':
        return {
          title: `Queue Print Failed — ${data.printerName || 'Unknown'}`,
          message: `Queue: ${data.queueName || 'Unknown'}\nPrinter: ${data.printerName || 'Unknown'}\nFile: ${data.filename || 'Unknown'}${data.error ? '\nError: ' + data.error : ''}`
        };

      case 'queue_completed':
        return {
          title: `Queue Completed — ${data.queueName || 'Unknown'}`,
          message: `All items in queue "${data.queueName}" have been printed.`
        };

      default:
        return { title: `3DPrintForge: ${eventType}`, message: JSON.stringify(data) };
    }
  }

  _fmtDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  // ---- Channel routing ----

  async _sendToChannel(name, conf, title, message, eventType, data) {
    switch (name) {
      case 'telegram':  return sendTelegram(conf, title, message);
      case 'discord':   return sendDiscord(conf, title, message, eventType);
      case 'email':     return sendEmail(conf, title, message);
      case 'webhook':   return sendWebhook(conf, title, message, eventType, data);
      case 'ntfy':      return sendNtfy(conf, title, message, eventType);
      case 'pushover':  return sendPushover(conf, title, message, eventType);
      case 'sms':       return sendSms(conf, title, message);
      default: throw new Error(`Unknown channel: ${name}`);
    }
  }

  shutdown() {
    if (this._digestTimer) clearInterval(this._digestTimer);
    if (this._maintenanceTimer) clearInterval(this._maintenanceTimer);
  }
}
