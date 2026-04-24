// bambu-print-command.test.js — Tests that buildPrintCommand handles
// the H2D 2026 flow of starting a print over LAN via HTTP URL (no USB stick required).
// Source: forum.bambulab.com/t/unable-to-send-sliced-file-to-h2d-without-a-usb-drive-connected/234923

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildPrintCommand } from '../../server/mqtt-commands.js';

describe('buildPrintCommand URL handling', () => {
  it('prefixes ftp:// when given a bare filename (legacy SD/USB flow)', () => {
    const cmd = buildPrintCommand('job.3mf');
    assert.equal(cmd.print.url, 'ftp://job.3mf');
    assert.equal(cmd.print.command, 'project_file');
    assert.equal(cmd.print.subtask_name, 'job');
  });

  it('uses http:// URL as-is for H2D start-over-LAN (no USB required)', () => {
    const cmd = buildPrintCommand('http://3dprintforge.local:3443/file/job.3mf');
    assert.equal(cmd.print.url, 'http://3dprintforge.local:3443/file/job.3mf');
    assert.equal(cmd.print.subtask_name, 'job');
  });

  it('uses https:// URL as-is', () => {
    const cmd = buildPrintCommand('https://example.com/print/job.3mf');
    assert.equal(cmd.print.url, 'https://example.com/print/job.3mf');
  });

  it('preserves ftp:// URL when given full URL (not double-prefixed)', () => {
    const cmd = buildPrintCommand('ftp://printer.local/job.3mf');
    assert.equal(cmd.print.url, 'ftp://printer.local/job.3mf');
  });

  it('preserves file:/// URL (SD card absolute path)', () => {
    const cmd = buildPrintCommand('file:///sdcard/job.3mf');
    assert.equal(cmd.print.url, 'file:///sdcard/job.3mf');
  });

  it('sets plate_idx when plateId provided', () => {
    const cmd = buildPrintCommand('job.3mf', 3);
    assert.equal(cmd.print.param, 'Metadata/plate_3.gcode');
  });
});
