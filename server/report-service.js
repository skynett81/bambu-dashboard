// Report Service — generates HTML reports (weekly/monthly) and sends via email
// Uses existing notification email infrastructure, zero external dependencies

import { getStatistics, getHistory, getInventorySetting, setInventorySetting, getDailyActivity, getWasteStats } from './database.js';

let _timer = null;

// ── Public API ──

export function initReportService() {
  const freq = getInventorySetting('report_frequency') || 'none';
  if (freq === 'none') {
    console.log('[report] Service disabled');
    return;
  }
  console.log(`[report] Scheduled: ${freq}`);
  _scheduleNext(freq);
}

export function restartReportService() {
  if (_timer) { clearTimeout(_timer); _timer = null; }
  initReportService();
}

/**
 * Generate a report for a given period
 * @param {'week'|'month'} period
 * @returns {object} { html, summary, period, from, to }
 */
export function generateReport(period = 'week') {
  const now = new Date();
  const to = now.toISOString().split('T')[0];
  const from = new Date(now.getTime() - (period === 'month' ? 30 : 7) * 86400000).toISOString().split('T')[0];

  const stats = getStatistics(null, from + 'T00:00:00', to + 'T23:59:59');
  const daily = getDailyActivity(period === 'month' ? 30 : 7);
  const recent = getHistory(10, 0, null);
  let waste = null;
  try { waste = getWasteStats(); } catch {}

  const periodLabel = period === 'month' ? 'Monthly' : 'Weekly';
  const periodLabelNb = period === 'month' ? 'Månedlig' : 'Ukentlig';

  const summary = {
    period: periodLabel,
    from, to,
    totalPrints: stats.total_prints || 0,
    completed: stats.completed_prints || 0,
    failed: stats.failed_prints || 0,
    cancelled: stats.cancelled_prints || 0,
    successRate: stats.success_rate || 0,
    totalHours: stats.total_hours || 0,
    totalFilament: Math.round(stats.total_filament_g || 0),
    avgDuration: stats.avg_print_minutes || 0,
    longestPrint: stats.longest_print?.filename || null,
    longestDuration: stats.longest_print?.duration_seconds ? Math.round(stats.longest_print.duration_seconds / 60) : 0,
    topFilament: stats.most_used_filament || null,
    wasteG: waste?.total_waste_g || 0,
  };

  const html = _buildHtml(summary, daily, recent, stats);

  return { html, summary, period: periodLabel, from, to };
}

/**
 * Send report via email using the notification system
 */
export async function sendReportEmail(report) {
  const email = getInventorySetting('report_email');
  if (!email) return { error: 'No report email configured' };

  // Use the notification email settings
  const smtpHost = getInventorySetting('notify_email_host');
  const smtpPort = parseInt(getInventorySetting('notify_email_port') || '587');
  const smtpUser = getInventorySetting('notify_email_user');
  const smtpPass = getInventorySetting('notify_email_pass');
  const smtpFrom = getInventorySetting('notify_email_from') || smtpUser;

  if (!smtpHost || !smtpUser) return { error: 'Email not configured in notifications' };

  const subject = `Bambu Dashboard — ${report.period} Report (${report.from} → ${report.to})`;

  try {
    await _sendHtmlEmail({
      host: smtpHost, port: smtpPort, user: smtpUser, pass: smtpPass,
      from: smtpFrom, to: email, subject, html: report.html
    });
    console.log(`[report] Email sent to ${email}`);
    return { ok: true, to: email };
  } catch (e) {
    console.error(`[report] Email failed:`, e.message);
    return { error: e.message };
  }
}

// ── Scheduling ──

function _scheduleNext(freq) {
  if (_timer) clearTimeout(_timer);

  // Calculate ms until next Sunday 09:00 (weekly) or 1st of month 09:00 (monthly)
  const now = new Date();
  let next;

  if (freq === 'weekly') {
    next = new Date(now);
    next.setDate(next.getDate() + (7 - next.getDay()) % 7 || 7);
    next.setHours(9, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 7);
  } else if (freq === 'monthly') {
    next = new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0, 0);
  } else {
    return;
  }

  const ms = next.getTime() - now.getTime();
  console.log(`[report] Next ${freq} report: ${next.toISOString()} (${Math.round(ms / 3600000)}h)`);

  _timer = setTimeout(async () => {
    try {
      const period = freq === 'monthly' ? 'month' : 'week';
      const report = generateReport(period);
      await sendReportEmail(report);
    } catch (e) {
      console.error('[report] Scheduled report failed:', e.message);
    }
    _scheduleNext(freq);
  }, ms);
}

// ── HTML Report Builder ──

function _buildHtml(summary, daily, recent, stats) {
  const g = '#00e676';
  const r = '#ff5252';
  const y = '#ffd740';
  const b = '#448aff';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bambu Dashboard — ${summary.period} Report</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:#f5f5f5; color:#1a1a2e; line-height:1.5; }
  .container { max-width:640px; margin:0 auto; padding:20px; }
  .header { background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%); color:#fff; padding:24px; border-radius:12px 12px 0 0; text-align:center; }
  .header h1 { font-size:1.4rem; font-weight:700; margin-bottom:4px; }
  .header p { font-size:0.8rem; opacity:0.7; }
  .body { background:#fff; padding:20px; border-radius:0 0 12px 12px; box-shadow:0 2px 12px rgba(0,0,0,0.08); }
  .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:20px; }
  .stat { text-align:center; padding:12px 8px; background:#f8f9fa; border-radius:8px; }
  .stat-value { font-size:1.5rem; font-weight:800; }
  .stat-label { font-size:0.65rem; text-transform:uppercase; letter-spacing:0.05em; color:#666; margin-top:2px; }
  .section { margin-top:20px; }
  .section-title { font-size:0.75rem; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; color:#999; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:6px; }
  .bar-row { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
  .bar-label { width:60px; font-size:0.72rem; color:#666; text-align:right; flex-shrink:0; }
  .bar-track { flex:1; height:16px; background:#f0f0f0; border-radius:4px; overflow:hidden; }
  .bar-fill { height:100%; border-radius:4px; }
  .bar-value { width:50px; font-size:0.72rem; font-weight:600; }
  .print-row { display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid #f0f0f0; font-size:0.8rem; }
  .print-name { font-weight:500; }
  .print-meta { color:#999; font-size:0.7rem; }
  .badge { display:inline-block; padding:2px 8px; border-radius:10px; font-size:0.65rem; font-weight:600; color:#fff; }
  .footer { text-align:center; margin-top:16px; font-size:0.65rem; color:#999; }
  @media(max-width:480px) { .stats-grid { grid-template-columns:repeat(2,1fr); } }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>Bambu Dashboard</h1>
    <p>${summary.period} Report · ${summary.from} → ${summary.to}</p>
  </div>
  <div class="body">
    <div class="stats-grid">
      <div class="stat"><div class="stat-value" style="color:${b}">${summary.totalPrints}</div><div class="stat-label">Prints</div></div>
      <div class="stat"><div class="stat-value" style="color:${g}">${summary.successRate}%</div><div class="stat-label">Success</div></div>
      <div class="stat"><div class="stat-value">${summary.totalHours}h</div><div class="stat-label">Print Time</div></div>
      <div class="stat"><div class="stat-value">${summary.totalFilament}g</div><div class="stat-label">Filament</div></div>
    </div>

    <div class="stats-grid">
      <div class="stat"><div class="stat-value" style="color:${g}">${summary.completed}</div><div class="stat-label">Completed</div></div>
      <div class="stat"><div class="stat-value" style="color:${r}">${summary.failed}</div><div class="stat-label">Failed</div></div>
      <div class="stat"><div class="stat-value" style="color:${y}">${summary.cancelled}</div><div class="stat-label">Cancelled</div></div>
      <div class="stat"><div class="stat-value">${summary.avgDuration}m</div><div class="stat-label">Avg Duration</div></div>
    </div>

    ${daily.length ? `
    <div class="section">
      <div class="section-title">Daily Activity</div>
      ${daily.map(d => {
        const maxP = Math.max(...daily.map(x => x.prints), 1);
        const pct = (d.prints / maxP) * 100;
        const date = d.day.substring(5);
        return `<div class="bar-row">
          <div class="bar-label">${date}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${g}"></div></div>
          <div class="bar-value">${d.prints} · ${d.hours || 0}h</div>
        </div>`;
      }).join('')}
    </div>` : ''}

    ${stats.filament_by_type?.length ? `
    <div class="section">
      <div class="section-title">Filament Usage</div>
      ${stats.filament_by_type.slice(0, 5).map(f => {
        const maxG = Math.max(...stats.filament_by_type.map(x => x.grams), 1);
        return `<div class="bar-row">
          <div class="bar-label">${f.type || '?'}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${(f.grams / maxG) * 100}%;background:${b}"></div></div>
          <div class="bar-value">${Math.round(f.grams)}g</div>
        </div>`;
      }).join('')}
    </div>` : ''}

    ${recent.length ? `
    <div class="section">
      <div class="section-title">Recent Prints</div>
      ${recent.slice(0, 8).map(p => {
        const name = (p.filename || '?').replace(/\.(3mf|gcode)$/i, '');
        const dur = p.duration_seconds ? Math.round(p.duration_seconds / 60) + 'm' : '--';
        const statusColor = p.status === 'completed' ? g : p.status === 'failed' ? r : y;
        const statusText = p.status === 'completed' ? '✓' : p.status === 'failed' ? '✗' : '○';
        return `<div class="print-row">
          <div><span class="print-name">${_esc(name.length > 30 ? name.substring(0, 30) + '…' : name)}</span><br><span class="print-meta">${dur} · ${Math.round(p.filament_used_g || 0)}g ${p.filament_type || ''}</span></div>
          <span class="badge" style="background:${statusColor}">${statusText}</span>
        </div>`;
      }).join('')}
    </div>` : ''}

    ${summary.longestPrint ? `
    <div class="section">
      <div class="section-title">Records</div>
      <div class="print-row"><span>Longest print</span><span class="print-name">${_esc(summary.longestPrint)} (${summary.longestDuration}m)</span></div>
      ${summary.topFilament ? `<div class="print-row"><span>Most used filament</span><span class="print-name">${summary.topFilament}</span></div>` : ''}
      ${summary.wasteG > 0 ? `<div class="print-row"><span>Total waste</span><span class="print-name">${Math.round(summary.wasteG)}g</span></div>` : ''}
    </div>` : ''}
  </div>
  <div class="footer">Generated by Bambu Dashboard · ${new Date().toISOString().split('T')[0]}</div>
</div>
</body>
</html>`;
}

function _esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── HTML Email Sender ──

async function _sendHtmlEmail(conf) {
  const net = await import('node:net');
  const tls = await import('node:tls');

  return new Promise((resolve, reject) => {
    const port = conf.port || 587;
    const useDirectTLS = port === 465;
    let step = 0;
    let socket;

    const done = (err) => {
      if (socket) try { socket.destroy(); } catch {}
      if (err) reject(err); else resolve();
    };

    const send = (data) => socket.write(data + '\r\n');

    function handleSmtp(s) {
      socket = s;
      let buf = '';
      s.on('data', (chunk) => {
        buf += chunk.toString();
        while (buf.includes('\r\n')) {
          const line = buf.substring(0, buf.indexOf('\r\n'));
          buf = buf.substring(buf.indexOf('\r\n') + 2);
          processLine(line);
        }
      });
      s.on('error', done);
      s.on('end', () => done(new Error('Connection closed')));
    }

    function processLine(line) {
      const code = parseInt(line.substring(0, 3));
      switch (step) {
        case 0: if (code === 220) { send(`EHLO bambu-dashboard`); step = 1; } break;
        case 1:
          if (line.startsWith('250 ') || (code === 250 && !line.startsWith('250-'))) {
            if (useDirectTLS) doAuth();
            else { send('STARTTLS'); step = 2; }
          }
          break;
        case 2:
          if (code === 220) {
            const tlsSock = tls.connect({ socket, servername: conf.host, rejectUnauthorized: false }, () => {
              socket = tlsSock;
              send('EHLO bambu-dashboard');
              step = 3;
            });
            tlsSock.on('data', (chunk) => {
              let b2 = chunk.toString();
              while (b2.includes('\r\n')) {
                const l = b2.substring(0, b2.indexOf('\r\n'));
                b2 = b2.substring(b2.indexOf('\r\n') + 2);
                processLine(l);
              }
            });
            tlsSock.on('error', done);
          }
          break;
        case 3:
          if (line.startsWith('250 ') || (code === 250 && !line.startsWith('250-'))) doAuth();
          break;
        case 4: if (code === 334) { send(Buffer.from(conf.user).toString('base64')); step = 5; } break;
        case 5: if (code === 334) { send(Buffer.from(conf.pass).toString('base64')); step = 6; } break;
        case 6:
          if (code === 235) { send(`MAIL FROM:<${conf.from}>`); step = 7; }
          else done(new Error(`SMTP auth failed`));
          break;
        case 7: if (code === 250) { send(`RCPT TO:<${conf.to}>`); step = 8; } break;
        case 8: if (code === 250) { send('DATA'); step = 9; } break;
        case 9:
          if (code === 354) {
            send([
              `From: Bambu Dashboard <${conf.from}>`,
              `To: ${conf.to}`,
              `Subject: ${conf.subject}`,
              'MIME-Version: 1.0',
              'Content-Type: text/html; charset=utf-8',
              `Date: ${new Date().toUTCString()}`,
              '', conf.html, '.'
            ].join('\r\n'));
            step = 10;
          }
          break;
        case 10:
          if (code === 250) { send('QUIT'); step = 11; done(); }
          else done(new Error(`SMTP send failed`));
          break;
        case 11: socket.destroy(); break;
      }
    }

    function doAuth() {
      if (conf.user && conf.pass) { send('AUTH LOGIN'); step = 4; }
      else { send(`MAIL FROM:<${conf.from}>`); step = 7; }
    }

    const connectOpts = { host: conf.host, port };
    if (useDirectTLS) {
      const s = tls.connect({ ...connectOpts, servername: conf.host, rejectUnauthorized: false }, () => handleSmtp(s));
      s.on('error', done);
    } else {
      const s = net.createConnection(connectOpts, () => handleSmtp(s));
      s.on('error', done);
    }

    setTimeout(() => done(new Error('SMTP timeout')), 30000);
  });
}
