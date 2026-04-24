// file-parser-metadata.test.js — Tests that new 2025–2026 3MF metadata fields
// from OrcaSlicer, PrusaSlicer, and BambuStudio are extracted and surfaced.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { deflateRawSync } from 'node:zlib';
import { parse3mf } from '../../server/file-parser.js';

// Minimal ZIP builder — same layout as file-parser-security.test.js
function buildZip(entries) {
  const localHeaders = [];
  const centralDir = [];
  let offset = 0;
  for (const { name, content } of entries) {
    const data = Buffer.from(content, 'utf8');
    const compressed = deflateRawSync(data);
    const nameBuf = Buffer.from(name, 'utf8');

    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0, 6);
    lh.writeUInt16LE(8, 8); lh.writeUInt16LE(0, 10); lh.writeUInt16LE(0, 12);
    lh.writeUInt32LE(0, 14); lh.writeUInt32LE(compressed.length, 18);
    lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(nameBuf.length, 26); lh.writeUInt16LE(0, 28);
    localHeaders.push(lh, nameBuf, compressed);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0); cd.writeUInt16LE(20, 4); cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8); cd.writeUInt16LE(8, 10); cd.writeUInt16LE(0, 12); cd.writeUInt16LE(0, 14);
    cd.writeUInt32LE(0, 16); cd.writeUInt32LE(compressed.length, 20); cd.writeUInt32LE(data.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28); cd.writeUInt16LE(0, 30); cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34); cd.writeUInt16LE(0, 36); cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(offset, 42);
    centralDir.push(cd, nameBuf);

    offset += lh.length + nameBuf.length + compressed.length;
  }
  const localPart = Buffer.concat(localHeaders);
  const cdPart = Buffer.concat(centralDir);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(0, 4); eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8); eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(cdPart.length, 12); eocd.writeUInt32LE(localPart.length, 16);
  eocd.writeUInt16LE(0, 20);
  return Buffer.concat([localPart, cdPart, eocd]);
}

describe('3MF new metadata extraction (2025–2026 slicer releases)', () => {
  it('extracts scarf_seam flag (PrusaSlicer 2.9, Cura 5.9, Orca 2.3)', async () => {
    const config = `filament_used_g = 10
filament_type = PLA
seam_slope_type = scarf
seam_slope_steps = 30`;
    const buf = buildZip([{ name: 'Metadata/slice_info.config', content: config }]);
    const result = await parse3mf(buf);
    assert.equal(result.scarf_seam, true, 'scarf_seam should be true when seam_slope_type=scarf');
  });

  it('extracts chamber_temp (QIDI Plus4/Q1 Pro up to 65°C, BambuStudio H2D)', async () => {
    const config = `filament_used_g = 10
filament_type = PLA
chamber_temperature = 55`;
    const buf = buildZip([{ name: 'Metadata/slice_info.config', content: config }]);
    const result = await parse3mf(buf);
    assert.equal(result.chamber_temp, 55);
  });

  it('extracts wipe_tower_type (OrcaSlicer 2.3+)', async () => {
    const config = `filament_used_g = 10
wipe_tower_type = rib`;
    const buf = buildZip([{ name: 'Metadata/slice_info.config', content: config }]);
    const result = await parse3mf(buf);
    assert.equal(result.wipe_tower_type, 'rib');
  });

  it('detects BambuStudio 2.0+ 3MF schema version (geometry-only fallback risk)', async () => {
    const pkgRels = `<?xml version="1.0"?><Relationships><BBL:Schema Version="2.0"/></Relationships>`;
    const buf = buildZip([{ name: 'Metadata/_rels/.rels', content: pkgRels }]);
    const result = await parse3mf(buf);
    assert.equal(result.schema_version, '2.0', 'schema version should be extracted from rels');
  });

  it('extracts per-extruder dual-nozzle flow ratios (H2D left/right)', async () => {
    const config = `filament_used_g = 15;5
extruder_type = Direct
top_surface_flow_ratio = 1.05,0.98
nozzle_volume = 0.6,0.4`;
    const buf = buildZip([{ name: 'Metadata/slice_info.config', content: config }]);
    const result = await parse3mf(buf);
    assert.ok(Array.isArray(result.per_extruder), 'per_extruder array should be populated');
    assert.equal(result.per_extruder.length, 2);
    assert.equal(result.per_extruder[0].topSurfaceFlowRatio, 1.05);
    assert.equal(result.per_extruder[1].topSurfaceFlowRatio, 0.98);
  });

  it('extracts RFID filament metadata for AMS 2 Pro auto-drying', async () => {
    const config = `filament_used_g = 10
filament_type = PLA
filament_rfid_uid = ABC123;DEF456
filament_drying_temp = 45;55
filament_drying_time = 480;360`;
    const buf = buildZip([{ name: 'Metadata/slice_info.config', content: config }]);
    const result = await parse3mf(buf);
    assert.equal(result.filaments[0]?.rfid_uid, 'ABC123');
    assert.equal(result.filaments[0]?.drying_temp, 45);
    assert.equal(result.filaments[0]?.drying_time, 480);
  });

  it('parses exclude_objects / skip_objects metadata', async () => {
    const xml = `<plate>
  <objects>
    <object id="1" name="cube_a" identify_id="111"/>
    <object id="2" name="cube_b" identify_id="222"/>
  </objects>
</plate>`;
    const buf = buildZip([{ name: 'Metadata/model_settings.config', content: xml }]);
    const result = await parse3mf(buf);
    assert.ok(Array.isArray(result.exclude_objects));
    assert.equal(result.exclude_objects.length, 2);
    assert.equal(result.exclude_objects[0].identifyId, '111');
    assert.equal(result.exclude_objects[0].name, 'cube_a');
  });

  it('detects multi-bed (PrusaSlicer 2.9+ virtual beds)', async () => {
    const config = `filament_used_g = 10
bed_count = 3`;
    const buf = buildZip([{ name: 'Metadata/slice_info.config', content: config }]);
    const result = await parse3mf(buf);
    assert.equal(result.bed_count, 3);
    assert.equal(result.multi_bed, true);
  });
});
