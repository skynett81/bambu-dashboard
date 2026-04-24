// moonraker-notifications.test.js — Tests that we handle all relevant Moonraker
// JSON-RPC notifications (announcements, history, job queue, filelist, service state)
// that ship with Moonraker 0.8+ and are useful for real-time dashboard updates.

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MoonrakerClient } from '../../server/moonraker-client.js';

function makeClient() {
  const events = [];
  const hub = { broadcast: (channel, payload) => events.push({ channel, payload }) };
  const config = { printer: { ip: '127.0.0.1', port: 7125, type: 'voron' } };
  const client = new MoonrakerClient(config, hub);
  return { client, events };
}

describe('MoonrakerClient notification handling', () => {
  let client, events;

  beforeEach(() => {
    const c = makeClient();
    client = c.client;
    events = c.events;
  });

  it('handles notify_announcement_update — broadcasts announcement event', () => {
    client._handleWsMessage({
      jsonrpc: '2.0',
      method: 'notify_announcement_update',
      params: [{ entries: [{ entry_id: 'e1', title: 'New release', priority: 'normal' }] }],
    });
    const ev = events.find(e => e.channel === 'moonraker_announcement');
    assert.ok(ev, 'expected moonraker_announcement broadcast');
    assert.equal(ev.payload.entries.length, 1);
    assert.equal(ev.payload.entries[0].entry_id, 'e1');
  });

  it('handles notify_announcement_dismissed', () => {
    client._handleWsMessage({
      jsonrpc: '2.0',
      method: 'notify_announcement_dismissed',
      params: [{ entry_id: 'e1' }],
    });
    const ev = events.find(e => e.channel === 'moonraker_announcement');
    assert.ok(ev);
    assert.equal(ev.payload.dismissed, 'e1');
  });

  it('handles notify_job_queue_changed — broadcasts queue_changed', () => {
    client._handleWsMessage({
      jsonrpc: '2.0',
      method: 'notify_job_queue_changed',
      params: [{ action: 'jobs_added', updated_queue: [{ filename: 'a.gcode' }], queue_state: 'paused' }],
    });
    const ev = events.find(e => e.channel === 'moonraker_queue');
    assert.ok(ev);
    assert.equal(ev.payload.action, 'jobs_added');
    assert.equal(ev.payload.queue.length, 1);
  });

  it('handles notify_history_changed — triggers history refresh', () => {
    client._handleWsMessage({
      jsonrpc: '2.0',
      method: 'notify_history_changed',
      params: [{ action: 'added', job: { job_id: '123', filename: 'test.gcode', status: 'completed' } }],
    });
    const ev = events.find(e => e.channel === 'moonraker_history');
    assert.ok(ev);
    assert.equal(ev.payload.action, 'added');
    assert.equal(ev.payload.job.job_id, '123');
  });

  it('handles notify_filelist_changed — broadcasts filelist event', () => {
    client._handleWsMessage({
      jsonrpc: '2.0',
      method: 'notify_filelist_changed',
      params: [{ action: 'create_file', item: { path: 'job.gcode' } }],
    });
    const ev = events.find(e => e.channel === 'moonraker_filelist');
    assert.ok(ev);
    assert.equal(ev.payload.action, 'create_file');
    assert.equal(ev.payload.item.path, 'job.gcode');
  });

  it('handles notify_service_state_changed (systemd service up/down)', () => {
    client._handleWsMessage({
      jsonrpc: '2.0',
      method: 'notify_service_state_changed',
      params: [{ klipper: { active_state: 'active', sub_state: 'running' } }],
    });
    const ev = events.find(e => e.channel === 'moonraker_service');
    assert.ok(ev);
    assert.equal(ev.payload.services.klipper?.active_state, 'active');
  });

  it('ignores unknown notification methods without error', () => {
    // Should not throw
    client._handleWsMessage({
      jsonrpc: '2.0',
      method: 'notify_totally_unknown',
      params: [{ foo: 'bar' }],
    });
    // Assert no moonraker_* events leaked from unknown method
    const leaked = events.find(e => e.channel?.startsWith('moonraker_'));
    assert.equal(leaked, undefined);
  });
});
