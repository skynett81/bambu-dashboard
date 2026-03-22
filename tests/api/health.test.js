// health.test.js — Tester for API helse- og status-endepunkter
// Bruker en minimal HTTP-testserver som kun eksponerer health-endepunktet,
// uten å starte full Bambu Dashboard server (MQTT, HTTPS, etc.)

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import http from 'node:http';
import { setupTestDb } from '../test-helper.js';
import { getPrinters } from '../../server/db/printers.js';

function sendJson(res, data, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

// ---- Minimal testserver ----
function createTestServer() {
  const server = createServer((req, res) => {
    const method = req.method;
    const path = req.url.split('?')[0];

    // GET /api/health
    if (method === 'GET' && path === '/api/health') {
      const health = {
        status: 'ok',
        uptime: Math.round(process.uptime()),
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        version: '1.1.11',
        node: process.version,
        timestamp: new Date().toISOString(),
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(health));
      return;
    }

    // GET /api/printers
    if (method === 'GET' && path === '/api/printers') {
      try {
        const printers = getPrinters();
        sendJson(res, printers);
      } catch (e) {
        sendJson(res, { error: e.message }, 500);
      }
      return;
    }

    // GET /api/auth/status
    if (method === 'GET' && path === '/api/auth/status') {
      sendJson(res, {
        enabled: false,
        username: null,
        users: [],
      });
      return;
    }

    // Fallback 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Ikke funnet' }));
  });

  return server;
}

// ---- HTTP GET-hjelpefunksjon ----
function httpGet(port, path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:${port}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
  });
}

// ---- Delt server for alle tester ----
// Én server-instans for alle describe-blokker for å unngå gjentatte migrasjoner
let sharedServer;
let sharedPort;

describe('API endepunkter', () => {
  before(async () => {
    // Sett opp db én gang for alle tester i denne filen
    setupTestDb();
    sharedServer = createTestServer();
    await new Promise((resolve) => {
      sharedServer.listen(0, '127.0.0.1', () => {
        sharedPort = sharedServer.address().port;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => sharedServer.close(resolve));
  });

  describe('GET /api/health', () => {
    it('returnerer 200 OK', async () => {
      const { status } = await httpGet(sharedPort, '/api/health');
      assert.strictEqual(status, 200, 'health-endepunkt skal returnere 200');
    });

    it('returnerer korrekt form på health-objektet', async () => {
      const { body } = await httpGet(sharedPort, '/api/health');
      assert.strictEqual(body.status, 'ok', 'status skal være "ok"');
      assert.ok(typeof body.uptime === 'number', 'uptime skal være tall');
      assert.ok(typeof body.memory === 'number', 'memory skal være tall');
      assert.ok(typeof body.version === 'string', 'version skal være streng');
      assert.ok(typeof body.node === 'string', 'node skal være streng');
      assert.ok(typeof body.timestamp === 'string', 'timestamp skal være streng');
    });

    it('uptime er ikke-negativ', async () => {
      const { body } = await httpGet(sharedPort, '/api/health');
      assert.ok(body.uptime >= 0, 'uptime skal være >= 0');
    });

    it('memory er positiv', async () => {
      const { body } = await httpGet(sharedPort, '/api/health');
      assert.ok(body.memory > 0, 'memory-bruk skal være positiv');
    });

    it('timestamp er gyldig ISO 8601', async () => {
      const { body } = await httpGet(sharedPort, '/api/health');
      const date = new Date(body.timestamp);
      assert.ok(!isNaN(date.getTime()), 'timestamp skal være gyldig dato');
    });

    it('Content-Type er application/json', async () => {
      const { headers } = await httpGet(sharedPort, '/api/health');
      assert.ok(
        headers['content-type']?.includes('application/json'),
        'Content-Type skal inneholde application/json'
      );
    });
  });

  describe('GET /api/printers', () => {
    it('returnerer 200 og en array', async () => {
      const { status, body } = await httpGet(sharedPort, '/api/printers');
      assert.strictEqual(status, 200, 'skal returnere 200');
      assert.ok(Array.isArray(body), 'body skal være en array');
    });

    it('returnerer tom array for ny database', async () => {
      const { body } = await httpGet(sharedPort, '/api/printers');
      assert.strictEqual(body.length, 0, 'ingen skrivere i ny database');
    });
  });

  describe('GET /api/auth/status', () => {
    it('returnerer 200 med korrekt form', async () => {
      const { status, body } = await httpGet(sharedPort, '/api/auth/status');
      assert.strictEqual(status, 200, 'skal returnere 200');
      assert.ok('enabled' in body, 'enabled-felt skal eksistere');
    });

    it('enabled er en boolean', async () => {
      const { body } = await httpGet(sharedPort, '/api/auth/status');
      assert.ok(typeof body.enabled === 'boolean', 'enabled skal være boolean');
    });
  });

  describe('404 for ukjente endepunkter', () => {
    it('returnerer 404 for ukjent sti', async () => {
      const { status } = await httpGet(sharedPort, '/api/ukjent-endepunkt');
      assert.strictEqual(status, 404, 'ukjent endepunkt skal gi 404');
    });
  });
});
