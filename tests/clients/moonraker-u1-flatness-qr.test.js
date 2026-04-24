// moonraker-u1-flatness-qr.test.js — Snapmaker U1 V1.3.0 verified parsing.
//
// Against a live V1.3.0 printer we confirmed that:
//   - No dedicated bed_flatness object exists — deviation is derived from bed_mesh.
//   - Errors live in exception_manager.exceptions[] with shape
//     { id, index, code, level, message }. QR help URLs are NOT present on the
//     exception object itself — they're built client-side from the module slug
//     mapped to the Snapmaker wiki.

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { MoonrakerClient, buildU1HelpUrl } from '../../server/moonraker-client.js';

function makeClient() {
  const hub = { broadcast: () => {} };
  return new MoonrakerClient(
    { printer: { ip: '127.0.0.1', port: 7125, type: 'moonraker' } },
    hub,
  );
}

describe('Bed flatness deviation (derived from bed_mesh)', () => {
  let c;
  beforeEach(() => { c = makeClient(); });

  it('derives peak-to-peak deviation from bed_mesh.mesh_matrix', () => {
    c._mergeKlipperState({
      bed_mesh: { mesh_matrix: [[0.0, 0.1, 0.2], [-0.05, 0.05, 0.15]] },
    });
    // Peak-to-peak: 0.2 - (-0.05) = 0.25
    assert.equal(c.state._bed_flatness.deviation_mm, 0.25);
    assert.equal(c.state._bed_flatness.source, 'derived');
    assert.equal(c.state._bed_flatness.status, 'warn');
  });

  it('does not set _bed_flatness without mesh data', () => {
    c._mergeKlipperState({
      heater_bed: { temperature: 60, target: 0 },
    });
    assert.equal(c.state._bed_flatness, undefined);
  });

  it('status thresholds: <0.10=ok, <0.30=warn, >=0.30=fail', () => {
    const cases = [
      [[[0, 0.05]], 'ok'],
      [[[0, 0.15]], 'warn'],
      [[[0, 0.35]], 'fail'],
    ];
    for (const [matrix, expected] of cases) {
      const x = makeClient();
      x._mergeKlipperState({ bed_mesh: { mesh_matrix: matrix } });
      assert.equal(x.state._bed_flatness.status, expected, `matrix=${JSON.stringify(matrix)}`);
    }
  });

  it('ignores NaN and Infinity in mesh cells', () => {
    c._mergeKlipperState({
      bed_mesh: { mesh_matrix: [[0, 0.1, NaN], [Infinity, 0.05, 0.15]] },
    });
    // Real range after filtering: 0 .. 0.15 = 0.15
    assert.equal(c.state._bed_flatness.deviation_mm, 0.15);
  });
});

describe('U1 exception_manager — buildU1HelpUrl()', () => {
  it('builds URL with module slug for known IDs', () => {
    assert.equal(
      buildU1HelpUrl({ id: 522, index: 1, code: 0 }),
      'https://wiki.snapmaker.com/en/snapmaker_u1/troubleshooting/u1_error_codes#h-0522-motion-control',
    );
    assert.equal(
      buildU1HelpUrl({ id: 526, index: 3, code: 2 }),
      'https://wiki.snapmaker.com/en/snapmaker_u1/troubleshooting/u1_error_codes#h-0526-heated-bed',
    );
  });

  it('builds numeric-only anchor for unknown module IDs', () => {
    assert.equal(
      buildU1HelpUrl({ id: 9999, index: 0, code: 0 }),
      'https://wiki.snapmaker.com/en/snapmaker_u1/troubleshooting/u1_error_codes#h-9999',
    );
  });

  it('falls back to the index page when exception has no id', () => {
    assert.equal(
      buildU1HelpUrl({}),
      'https://wiki.snapmaker.com/en/snapmaker_u1/troubleshooting/u1_error_codes',
    );
    assert.equal(
      buildU1HelpUrl(null),
      'https://wiki.snapmaker.com/en/snapmaker_u1/troubleshooting/u1_error_codes',
    );
  });

  it('pads id to 4 digits', () => {
    assert.ok(
      buildU1HelpUrl({ id: 522 }).includes('h-0522-'),
      'Module 522 should render as h-0522',
    );
  });
});

describe('U1 exception_manager — state parsing', () => {
  let c;
  beforeEach(() => { c = makeClient(); });

  it('parses exceptions into _u1_exceptions with help URLs', () => {
    c._mergeKlipperState({
      exception_manager: {
        exceptions: [
          { id: 526, index: 1, code: 5, level: 3, message: 'Heated bed sensor disconnected' },
        ],
      },
    });
    assert.equal(c.state._u1_exceptions.length, 1);
    assert.equal(c.state._u1_exceptions[0].id, 526);
    assert.equal(c.state._u1_exceptions[0].level, 3);
    assert.equal(c.state._u1_exceptions[0].levelLabel, 'cancel');
    assert.equal(c.state._u1_exceptions[0].message, 'Heated bed sensor disconnected');
    assert.match(c.state._u1_exceptions[0].helpUrl, /h-0526-heated-bed/);
  });

  it('surfaces the highest-severity exception URL on print_error_qr_url', () => {
    c._mergeKlipperState({
      exception_manager: {
        exceptions: [
          { id: 525, index: 0, code: 3, level: 1, message: 'Minor filament notice' },
          { id: 526, index: 1, code: 5, level: 3, message: 'Heated bed fault' },
          { id: 523, index: 0, code: 0, level: 2, message: 'Toolhead filament runout' },
        ],
      },
    });
    assert.match(c.state.print_error_qr_url, /h-0526-heated-bed/);
  });

  it('maps exception severity levels correctly', () => {
    const cases = [
      [1, 'info'],
      [2, 'pause'],
      [3, 'cancel'],
    ];
    for (const [lvl, label] of cases) {
      const x = makeClient();
      x._mergeKlipperState({
        exception_manager: {
          exceptions: [{ id: 522, index: 0, code: 0, level: lvl, message: 'x' }],
        },
      });
      assert.equal(x.state._u1_exceptions[0].levelLabel, label);
    }
  });

  it('clears _u1_exceptions and qr url when exceptions list goes empty', () => {
    c._mergeKlipperState({
      exception_manager: {
        exceptions: [{ id: 522, index: 0, code: 0, level: 3, message: 'err' }],
      },
    });
    assert.equal(c.state._u1_exceptions.length, 1);
    c._mergeKlipperState({
      exception_manager: { exceptions: [] },
    });
    assert.deepEqual(c.state._u1_exceptions, []);
    // print_error_qr_url should be reset by subsequent print_stats update
    c._mergeKlipperState({
      print_stats: { state: 'ready' },
    });
    assert.equal(c.state.print_error_qr_url, '');
  });

  it('does not set exception state when exception_manager absent', () => {
    c._mergeKlipperState({
      heater_bed: { temperature: 60, target: 0 },
    });
    assert.equal(c.state._u1_exceptions, undefined);
  });
});
