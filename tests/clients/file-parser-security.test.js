// file-parser-security.test.js — Tests that 3MF ZIP entry extraction
// rejects path-traversal attempts (OrcaSlicer CVE pattern, patched in 2.3.2).
// A malicious 3MF containing an entry name like "../../etc/passwd" or
// "/absolute/path" must not be extracted or processed as a valid entry.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { deflateRawSync } from 'node:zlib';
import { parse3mf } from '../../server/file-parser.js';

// Build a minimal valid ZIP in-memory with a given list of entries
function buildZip(entries) {
  const localHeaders = [];
  const centralDir = [];
  const fileData = [];
  let offset = 0;

  for (const { name, content } of entries) {
    const data = Buffer.from(content, 'utf8');
    const compressed = deflateRawSync(data);
    const nameBuf = Buffer.from(name, 'utf8');

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);           // version
    localHeader.writeUInt16LE(0, 6);            // flags
    localHeader.writeUInt16LE(8, 8);            // method: deflate
    localHeader.writeUInt16LE(0, 10);           // mod time
    localHeader.writeUInt16LE(0, 12);           // mod date
    localHeader.writeUInt32LE(0, 14);           // crc32 (skip validation)
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);           // extra len

    localHeaders.push(localHeader, nameBuf, compressed);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);                    // version made by
    cd.writeUInt16LE(20, 6);                    // version needed
    cd.writeUInt16LE(0, 8);                     // flags
    cd.writeUInt16LE(8, 10);                    // method
    cd.writeUInt16LE(0, 12);                    // mod time
    cd.writeUInt16LE(0, 14);                    // mod date
    cd.writeUInt32LE(0, 16);                    // crc32
    cd.writeUInt32LE(compressed.length, 20);
    cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);                    // extra len
    cd.writeUInt16LE(0, 32);                    // comment len
    cd.writeUInt16LE(0, 34);                    // disk start
    cd.writeUInt16LE(0, 36);                    // internal attr
    cd.writeUInt32LE(0, 38);                    // external attr
    cd.writeUInt32LE(offset, 42);               // local header offset
    centralDir.push(cd, nameBuf);

    offset += localHeader.length + nameBuf.length + compressed.length;
  }

  const localPart = Buffer.concat(localHeaders);
  const cdPart = Buffer.concat(centralDir);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);                     // disk no
  eocd.writeUInt16LE(0, 6);                     // disk with cd
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdPart.length, 12);
  eocd.writeUInt32LE(localPart.length, 16);
  eocd.writeUInt16LE(0, 20);                    // comment len

  return Buffer.concat([localPart, cdPart, eocd]);
}

describe('3MF path-traversal hardening', () => {
  it('ignores entries with "../" traversal patterns', async () => {
    const benign = 'filament_used_g = 25.5\nfilament_type = PLA';
    const buf = buildZip([
      { name: '../../etc/passwd', content: 'malicious' },
      { name: 'Metadata/slice_info.config', content: benign },
    ]);

    const result = await parse3mf(buf);
    // Parser should still read the benign slice_info entry
    assert.equal(result.filaments.length, 1);
    assert.equal(result.filaments[0].weight_g, 25.5);
    // And it must not have processed the traversal entry (the .config match is key)
    // If the ../etc/passwd entry were processed as a .config, we'd see filament entries from it
  });

  it('ignores entries with absolute paths', async () => {
    const benign = 'filament_used_g = 10';
    const buf = buildZip([
      { name: '/absolute/path/evil.config', content: 'filament_used_g = 9999' },
      { name: 'Metadata/slice_info.config', content: benign },
    ]);

    const result = await parse3mf(buf);
    // Should only see the benign 10g entry — absolute-path entry must be skipped
    const weights = result.filaments.map(f => f.weight_g);
    assert.ok(!weights.includes(9999), 'absolute-path entry must not be processed');
  });

  it('ignores entries starting with backslash (Windows traversal)', async () => {
    const benign = 'filament_used_g = 5';
    const buf = buildZip([
      { name: '\\windows\\system32\\evil.config', content: 'filament_used_g = 9999' },
      { name: 'Metadata/slice_info.config', content: benign },
    ]);

    const result = await parse3mf(buf);
    const weights = result.filaments.map(f => f.weight_g);
    assert.ok(!weights.includes(9999), 'backslash-path entry must not be processed');
  });

  it('processes normal relative paths without issue', async () => {
    const benign = 'filament_used_g = 20';
    const buf = buildZip([{ name: 'Metadata/slice_info.config', content: benign }]);
    const result = await parse3mf(buf);
    assert.equal(result.filaments[0]?.weight_g, 20);
  });
});
