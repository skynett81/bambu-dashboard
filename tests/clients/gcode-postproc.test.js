// gcode-postproc.test.js — pure transform functions over G-code text.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyOps, setBedTemp, setHotendTemp, multiplyFeedrate, multiplyFanSpeed, pauseAtLayer, addLineNumbers, stripComments, remapTools } from '../../server/gcode-postproc.js';

describe('setBedTemp', () => {
  it('replaces M140 and M190 S-values', () => {
    const out = setBedTemp('M190 S60\nG1 X10\nM140 S60\n', { value: 80 });
    assert.match(out, /M190 S80/);
    assert.match(out, /M140 S80/);
    assert.match(out, /G1 X10/);
  });

  it('rejects out-of-range values', () => {
    assert.throws(() => setBedTemp('', { value: 250 }));
    assert.throws(() => setBedTemp('', { value: -5 }));
  });

  it('preserves trailing comments', () => {
    const out = setBedTemp('M140 S60 ; bed preheat\n', { value: 80 });
    assert.match(out, /M140 S80 ; bed preheat/);
  });
});

describe('setHotendTemp', () => {
  it('replaces M104 and M109', () => {
    const out = setHotendTemp('M109 S210\nM104 S205\n', { value: 240 });
    assert.match(out, /M109 S240/);
    assert.match(out, /M104 S240/);
  });
});

describe('multiplyFeedrate', () => {
  it('scales every F on G1/G0 lines', () => {
    const out = multiplyFeedrate('G1 X10 F3000\nG0 F1500\nM104 S210\n', { factor: 0.5 });
    assert.match(out, /F1500/);
    assert.match(out, /F750/);
    assert.match(out, /M104 S210/); // M104 unchanged
  });

  it('rejects bogus factors', () => {
    assert.throws(() => multiplyFeedrate('', { factor: 0 }));
    assert.throws(() => multiplyFeedrate('', { factor: 10 }));
  });
});

describe('multiplyFanSpeed', () => {
  it('scales M106 S-values, clamped to 0-255', () => {
    const out = multiplyFanSpeed('M106 S255\nM106 S128\n', { factor: 0.5 });
    assert.match(out, /M106 S128/);
    assert.match(out, /M106 S64/);
  });
});

describe('pauseAtLayer', () => {
  it('inserts M0 before the matching ; LAYER comment', () => {
    const src = '; LAYER:0\nG1 X10\n; LAYER:1\nG1 X20\n';
    const out = pauseAtLayer(src, { layer: 1 });
    assert.match(out, /M0[^\n]*\n; LAYER:1/);
  });

  it('throws when layer not found', () => {
    assert.throws(() => pauseAtLayer('; LAYER:0\n', { layer: 5 }));
  });
});

describe('stripComments', () => {
  it('removes comment-only and trailing comments', () => {
    const out = stripComments('G1 X10 ; move\n; just a comment\nG1 Y10\n');
    assert.equal(out.split('\n').length, 2);
    assert.match(out, /G1 X10/);
    assert.match(out, /G1 Y10/);
  });
});

describe('addLineNumbers', () => {
  it('appends ; line N to command-bearing lines only', () => {
    const out = addLineNumbers('G28\n; comment\nG1 X10\n');
    const lines = out.split('\n');
    assert.match(lines[0], /; line 1/);
    assert.match(lines[2], /; line 2/);
  });
});

describe('remapTools', () => {
  it('swaps T0/T1 selectors', () => {
    const out = remapTools('T0\nG1 X10\nT1\n', { map: { '0': '1', '1': '0' } });
    const lines = out.split('\n');
    assert.equal(lines[0].trim(), 'T1');
    assert.equal(lines[2].trim(), 'T0');
  });

  it('also remaps T-parameter on M104', () => {
    const out = remapTools('M104 S210 T0\n', { map: { '0': '2' } });
    assert.match(out, /M104 S210 T2/);
  });
});

describe('applyOps dispatcher', () => {
  it('chains multiple operations in order', () => {
    const src = 'M140 S60\nG1 X10 F3000\n';
    const out = applyOps(src, [
      { op: 'set-bed', value: 80 },
      { op: 'speed-mul', factor: 0.5 },
    ]);
    assert.match(out, /M140 S80/);
    assert.match(out, /F1500/);
  });

  it('rejects unknown ops', () => {
    assert.throws(() => applyOps('', [{ op: 'rocket-launch' }]));
  });
});
