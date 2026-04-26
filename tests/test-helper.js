// test-helper.js — Hjelpefunksjoner for alle tester
// Setter opp en fersk in-memory SQLite-database med fullstendig skjema og migrasjoner.

import { DatabaseSync } from 'node:sqlite';
import { setDb } from '../server/db/connection.js';
import { runMigrations } from '../server/db/migrations.js';

// Creates a fresh in-memory SQLite database, registers it as the singleton,
// and runs the full migration chain (which now includes ensureBaseSchema()).
export function setupTestDb() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA journal_mode=WAL');
  db.exec('PRAGMA busy_timeout=5000');
  db.exec('PRAGMA foreign_keys=ON');
  setDb(db);
  runMigrations();
  return db;
}
