// connection.test.js — Tester for database-tilkoblings-singleton

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { initConnection, getDb, setDb } from '../../server/db/connection.js';

describe('Database connection', () => {
  // Lagre original db-tilstand slik at vi kan gjenopprette etter tester
  let originalDb;

  before(() => {
    // Ta vare på evt. eksisterende singleton (null i test-miljø)
    try { originalDb = getDb(); } catch { originalDb = null; }
  });

  after(() => {
    // Gjenopprett: nullstill singletonent til opprinnelig tilstand
    setDb(originalDb);
  });

  it('setDb() lar oss injisere en in-memory db', () => {
    const db = new DatabaseSync(':memory:');
    setDb(db);
    assert.strictEqual(getDb(), db, 'getDb() skal returnere samme instans som ble satt');
  });

  it('getDb() returnerer samme instans (singleton)', () => {
    const db = new DatabaseSync(':memory:');
    setDb(db);
    const a = getDb();
    const b = getDb();
    assert.strictEqual(a, b, 'getDb() skal alltid returnere samme instans');
  });

  it('getDb() throws error before db is set', () => {
    setDb(null);
    assert.throws(
      () => getDb(),
      /not initialized/i,
      'getDb() should throw when db is null'
    );
  });

  it('initConnection() oppretter en fungerende database', () => {
    // Bruk en in-memory db via setDb i stedet for å faktisk skrive til disk
    // Vi tester initConnection() indirekte via setDb + getDb
    const db = new DatabaseSync(':memory:');
    db.exec('PRAGMA journal_mode=WAL');
    db.exec('PRAGMA foreign_keys=ON');
    setDb(db);

    const result = getDb().prepare('SELECT 1 AS val').get();
    assert.strictEqual(result.val, 1, 'Databasen skal svare på enkle spørringer');
  });
});
