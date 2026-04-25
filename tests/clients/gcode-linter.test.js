// gcode-linter.test.js — verify each rule fires for the bug it targets
// and stays silent on clean G-code. Each test uses minimal real-world
// snippets so failures are easy to localise.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { lintGcode, parseGcodeLine } from '../../server/gcode-linter.js';

describe('parseGcodeLine()', () => {
  it('parses command + tokens, ignores comments', () => {
    const r = parseGcodeLine('G1 X10.5 Y-3 F1500 ; perimeter');
    assert.equal(r.cmd, 'G1');
    assert.equal(r.tokens.X, 10.5);
    assert.equal(r.tokens.Y, -3);
    assert.equal(r.tokens.F, 1500);
  });

  it('returns null on blank/comment-only lines', () => {
    assert.equal(parseGcodeLine(''), null);
    assert.equal(parseGcodeLine('; just a comment'), null);
    assert.equal(parseGcodeLine('   '), null);
  });

  it('preserves the command letter+number form (e.g. M104)', () => {
    const r = parseGcodeLine('M104 S210');
    assert.equal(r.cmd, 'M104');
    assert.equal(r.tokens.S, 210);
  });
});

describe('Rule: homing before move', () => {
  it('fires when G1 happens before any G28', () => {
    const { issues } = lintGcode('G1 X10 Y10\nG28');
    const e = issues.find(i => i.code === 'no-homing');
    assert.ok(e);
    assert.equal(e.severity, 'error');
  });

  it('stays silent when G28 is first', () => {
    const { issues } = lintGcode('G28\nG1 X10 Y10');
    assert.equal(issues.find(i => i.code === 'no-homing'), undefined);
  });
});

describe('Rule: temperature bounds', () => {
  it('errors on hotend > 320°C', () => {
    const { issues } = lintGcode('G28\nM104 S350\n');
    assert.ok(issues.find(i => i.code === 'hotend-too-hot'));
  });

  it('errors on negative hotend', () => {
    const { issues } = lintGcode('G28\nM104 S-10\n');
    assert.ok(issues.find(i => i.code === 'hotend-negative'));
  });

  it('errors on bed > 130°C', () => {
    const { issues } = lintGcode('G28\nM140 S140\n');
    assert.ok(issues.find(i => i.code === 'bed-too-hot'));
  });

  it('warns on chamber > 80°C', () => {
    const { issues } = lintGcode('G28\nM141 S100\n');
    const w = issues.find(i => i.code === 'chamber-too-hot');
    assert.ok(w);
    assert.equal(w.severity, 'warning');
  });

  it('accepts normal PLA temps', () => {
    const { issues } = lintGcode('G28\nM104 S210\nM140 S60\n');
    assert.equal(issues.filter(i => i.severity === 'error').length, 0);
  });
});

describe('Rule: cold extrusion', () => {
  it('errors when extrusion happens before heating', () => {
    const { issues } = lintGcode('G28\nM82\nG1 X10 Y10 E5\n');
    assert.ok(issues.find(i => i.code === 'cold-extrusion'));
  });

  it('passes when hotend reaches 200°C first', () => {
    const { issues } = lintGcode('G28\nM109 S210\nM82\nG1 X10 Y10 E5\n');
    assert.equal(issues.find(i => i.code === 'cold-extrusion'), undefined);
  });
});

describe('Rule: extruder mode', () => {
  it('warns when extrusion happens before M82/M83', () => {
    const { issues } = lintGcode('G28\nM109 S210\nG1 X10 Y10 E5\n');
    assert.ok(issues.find(i => i.code === 'no-extruder-mode'));
  });

  it('silent with M83', () => {
    const { issues } = lintGcode('G28\nM109 S210\nM83\nG1 X10 Y10 E5\n');
    assert.equal(issues.find(i => i.code === 'no-extruder-mode'), undefined);
  });
});

describe('Rule: excessive Z-hop', () => {
  it('warns when Z jumps > 5mm in one move', () => {
    const { issues } = lintGcode('G28\nG1 Z0.2\nG1 Z10\n');
    assert.ok(issues.find(i => i.code === 'excessive-z-hop'));
  });

  it('silent on normal Z-hops', () => {
    const { issues } = lintGcode('G28\nG1 Z0.2\nG1 Z0.5\nG1 Z0.8\n');
    assert.equal(issues.find(i => i.code === 'excessive-z-hop'), undefined);
  });
});

describe('Rule: firmware-flavour sanity', () => {
  it('warns about Klipper macros under Marlin', () => {
    const { issues } = lintGcode('G28\nSET_FAN_SPEED FAN=part SPEED=0.5\n', { firmware: 'marlin' });
    assert.ok(issues.find(i => i.code === 'klipper-cmd-in-marlin'));
  });

  it('silent under auto', () => {
    const { issues } = lintGcode('G28\nSET_FAN_SPEED FAN=part SPEED=0.5\n', { firmware: 'auto' });
    assert.equal(issues.find(i => i.code === 'klipper-cmd-in-marlin'), undefined);
  });
});

describe('Stats', () => {
  it('counts lines, commands, layers, tools', () => {
    const src = 'G28\n; LAYER:0\nT0\nM104 S210 T0\nG1 X10 Y10\n; LAYER:1\nT1\nM104 S220 T1\nG1 X20\n';
    const { stats } = lintGcode(src);
    assert.equal(stats.lines, 10); // includes trailing newline → empty 10th
    assert.ok(stats.commands >= 6);
    assert.equal(stats.layers, 2);
    assert.deepEqual(stats.tools.sort(), ['T0', 'T1']);
  });
});
