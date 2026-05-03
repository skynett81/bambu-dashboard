// auth.test.js — Tester for brukere, roller og API-nøkler

import { describe, it, before, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestDb } from '../test-helper.js';
import { getDb } from '../../server/db/connection.js';
import {
  getRoles,
  addRole,
  getRole,
  addUser,
  getUser,
  getUserByUsername,
  updateUser,
  deleteUser,
  getApiKeys,
  addApiKey,
  deleteApiKey,
  deactivateApiKey,
  getApiKeyByHash,
} from '../../server/db/auth.js';

describe('Auth — roller, brukere og API-nøkler', () => {
  before(() => {
    setupTestDb();
  });

  afterEach(() => {
    // Rens mellom tester for isolasjon
    try {
      const db = getDb();
      db.exec('DELETE FROM api_keys');
      db.exec('DELETE FROM users');
      // Behold innebygde roller fra migrasjoner, slett kun testrollen(e)
      db.exec("DELETE FROM user_roles WHERE name NOT IN ('admin', 'operator', 'viewer')");
    } catch { /* ignorer */ }
  });

  describe('Roller (user_roles)', () => {
    it('getRoles() returnerer array (inkl. evt. innebygde roller fra migrasjoner)', () => {
      const roles = getRoles();
      assert.ok(Array.isArray(roles), 'skal returnere array');
    });

    it('addRole() oppretter en ny rolle og returnerer id', () => {
      const id = addRole({
        name: 'test-role',
        permissions: ['printers:read', 'history:read'],
        description: 'Teststolle',
        is_default: 0,
      });
      assert.ok(typeof id === 'number', 'id skal være nummer');
      assert.ok(id > 0, 'id skal være positiv');
    });

    it('getRole() returnerer rollen med riktig data', () => {
      const id = addRole({
        name: 'leserrolle',
        permissions: ['history:read'],
        description: 'Kun lesetilgang',
      });

      const role = getRole(id);
      assert.ok(role, 'rolle skal finnes');
      assert.strictEqual(role.name, 'leserrolle');
      assert.strictEqual(role.description, 'Kun lesetilgang');
    });

    it('getRole() returnerer null for ikke-eksisterende id', () => {
      const role = getRole(99999);
      assert.strictEqual(role, null);
    });
  });

  describe('Brukere (users)', () => {
    let sharedRoleId;

    before(() => {
      sharedRoleId = addRole({ name: 'bruker-test-rolle', permissions: ['*'] });
    });

    it('addUser() oppretter bruker og returnerer id', () => {
      const id = addUser({
        username: 'testbruker',
        password_hash: 'hashed_password_here',
        role_id: sharedRoleId,
        display_name: 'Test Bruker',
      });
      assert.ok(typeof id === 'number', 'id skal være nummer');
      assert.ok(id > 0);
    });

    it('getUser() returnerer brukeren med riktig data', () => {
      const id = addUser({
        username: 'getuser_test',
        password_hash: 'hash123',
        role_id: null,
      });

      const user = getUser(id);
      assert.ok(user, 'bruker skal finnes');
      assert.strictEqual(user.id, id);
      assert.strictEqual(user.username, 'getuser_test');
    });

    it('getUser() returnerer null for ikke-eksisterende id', () => {
      const user = getUser(99999);
      assert.strictEqual(user, null);
    });

    it('getUserByUsername() returnerer brukeren basert på brukernavn', () => {
      const id = addUser({
        username: 'unik_bruker_xyz',
        password_hash: 'sikker_hash',
        role_id: null,
        display_name: 'Unik Bruker',
      });

      const user = getUserByUsername('unik_bruker_xyz');
      assert.ok(user, 'bruker skal finnes');
      assert.strictEqual(user.id, id);
      assert.strictEqual(user.username, 'unik_bruker_xyz');
    });

    it('getUserByUsername() returnerer null for ikke-eksisterende brukernavn', () => {
      const user = getUserByUsername('finnes_ikke_xyz123');
      assert.strictEqual(user, null);
    });

    it('deleteUser() fjerner brukeren', () => {
      const id = addUser({
        username: 'slett_meg',
        password_hash: 'hash',
        role_id: null,
      });

      deleteUser(id);
      const user = getUser(id);
      assert.strictEqual(user, null, 'slettet bruker skal ikke finnes');
    });

    it('updateUser() persists totp_secret, totp_enabled, totp_backup_codes', () => {
      // Regression: the field allowlist previously omitted TOTP columns,
      // so /api/auth/totp/verify silently dropped enrolment writes and
      // MFA could be bypassed despite appearing enabled. getUserByUsername
      // is what the production login flow uses (SELECT u.*), so verify
      // through that path.
      addUser({ username: 'totp_user', password_hash: 'hash', role_id: null });
      const created = getUserByUsername('totp_user');
      updateUser(created.id, {
        totp_secret: 'JBSWY3DPEHPK3PXP',
        totp_enabled: 1,
        totp_backup_codes: JSON.stringify(['code1', 'code2']),
      });
      const user = getUserByUsername('totp_user');
      assert.strictEqual(user.totp_secret, 'JBSWY3DPEHPK3PXP', 'totp_secret skal lagres');
      assert.strictEqual(user.totp_enabled, 1, 'totp_enabled skal lagres');
      assert.match(user.totp_backup_codes, /code1/);
    });
  });

  describe('API-nøkler', () => {
    it('getApiKeys() returnerer tom liste initialt', () => {
      const keys = getApiKeys();
      assert.ok(Array.isArray(keys), 'skal returnere array');
      assert.strictEqual(keys.length, 0, 'ingen nøkler initialt');
    });

    it('addApiKey() oppretter en nøkkel og returnerer id', () => {
      const id = addApiKey({
        name: 'Test API Key',
        key_hash: 'sha256_hash_of_key_123',
        key_prefix: 'bdb_',
        permissions: ['*'],
        user_id: null,
        expires_at: null,
      });
      assert.ok(typeof id === 'number', 'id skal være nummer');
      assert.ok(id > 0);
    });

    it('getApiKeys() returnerer nøkkelen som ble lagt til', () => {
      addApiKey({
        name: 'Synlig Nøkkel',
        key_hash: 'hash_synlig_123',
        key_prefix: 'bdb_',
        permissions: ['*'],
      });
      const keys = getApiKeys();
      const key = keys.find(k => k.name === 'Synlig Nøkkel');
      assert.ok(key, 'nøkkelen skal finnes');
      assert.strictEqual(key.key_prefix, 'bdb_');
      assert.strictEqual(key.active, 1, 'nøkkel skal være aktiv som standard');
    });

    it('getApiKeyByHash() finner aktiv nøkkel via hash', () => {
      addApiKey({
        name: 'Hash Test Key',
        key_hash: 'unique_hash_value_abc',
        key_prefix: 'bdb_',
        permissions: ['printers:read'],
      });

      const found = getApiKeyByHash('unique_hash_value_abc');
      assert.ok(found, 'nøkkel skal finnes via hash');
      assert.strictEqual(found.name, 'Hash Test Key');
    });

    it('getApiKeyByHash() returnerer null for ukjent hash', () => {
      const found = getApiKeyByHash('finnes_ikke_hash');
      assert.strictEqual(found, null);
    });

    it('deactivateApiKey() deaktiverer nøkkelen slik at hash-oppslag feiler', () => {
      const id = addApiKey({
        name: 'Deaktiver Meg',
        key_hash: 'deactivate_hash_xyz',
        key_prefix: 'bdb_',
        permissions: ['*'],
      });

      deactivateApiKey(id);

      // getApiKeyByHash returnerer kun aktive nøkler
      const found = getApiKeyByHash('deactivate_hash_xyz');
      assert.strictEqual(found, null, 'deaktivert nøkkel skal ikke finnes via hash-oppslag');
    });

    it('deleteApiKey() fjerner nøkkelen fra listen', () => {
      const id = addApiKey({
        name: 'Slett Meg',
        key_hash: 'delete_hash_abc123',
        key_prefix: 'bdb_',
        permissions: ['*'],
      });

      deleteApiKey(id);

      const keys = getApiKeys();
      const found = keys.find(k => k.id === id);
      assert.strictEqual(found, undefined, 'slettet nøkkel skal ikke finnes i listen');
    });
  });
});
