// Database connection singleton
// All repository modules import getDb() to access the shared connection

import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';
import { DATA_DIR } from '../config.js';
import { createLogger } from '../logger.js';

const log = createLogger('db');
const DB_PATH = join(DATA_DIR, 'dashboard.db');

let db;

/**
 * Initialize the database connection and configure PRAGMAs.
 * Returns the raw DatabaseSync instance.
 */
export function initConnection() {
  db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode=WAL');
  db.exec('PRAGMA busy_timeout=5000');
  db.exec('PRAGMA foreign_keys=ON');
  log.info('Database ready: ' + DB_PATH);
  return db;
}

/**
 * Get the active database connection.
 * Must be called after initConnection().
 */
export function getDb() {
  if (!db) throw new Error('Database ikke initialisert — kall initConnection() først');
  return db;
}

/**
 * Inject en database-instans direkte (brukes kun i tester).
 * Gjør det mulig å bruke en in-memory-database uten å kalle initConnection().
 */
export function setDb(instance) {
  db = instance;
}
