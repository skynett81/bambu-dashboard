/**
 * Comprehensive KB-markdown importer.
 *
 * Reads every file under `website/docs/kb/filaments/` and extracts:
 *
 *   guide.md          — master temperature table covering all ~15 materials
 *   comparison.md     — star-ratings (strength, heat-res, UV, chemical, flex)
 *                       + Shore-D / HDT / VST data
 *   compatibility.md  — build-plate × material matrix + glue-stick flags
 *   bambu-series.md   — Bambu brand variants (PLA Basic, Matte, Silk, etc.)
 *                       with AMS compatibility, RFID flag, price tier
 *   profiles.md       — retract + speed presets per material
 *   <material>.md     — rich prose guides (tips_print, tips_storage, tips_post)
 *   composite.md      — composite sub-materials (PLA-CF, PETG-CF, PA-CF, etc.)
 *   special.md        — special sub-materials (ASA, PC, PP, PVA, HIPS)
 *
 * Writes into:
 *   materials_taxonomy — canonical temperature ranges, enclosure_required
 *   kb_filaments       — full property sheet (strength, flex, heat_res, UV,
 *                        plate_compatibility, glue_stick, difficulty, etc.)
 *
 * Idempotent — re-runs fill in blanks without clobbering user edits.
 */

import { readFileSync, existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb } from './db/connection.js';
import { createLogger } from './logger.js';

const log = createLogger('kb-md-importer');
const __dir = dirname(fileURLToPath(import.meta.url));
const KB_DIR = join(__dir, '..', 'website', 'docs', 'kb', 'filaments');

// Name aliases for materials that appear with slight variations across files
// (e.g. "PA (Nylon)" in comparison, "Nylon" in bambu-series, "PA" in taxonomy).
const NAME_ALIASES = {
  'PA (NYLON)': 'PA', 'NYLON': 'PA', 'PLA+': 'PLA+',
  'PLA BASIC': 'PLA', 'PLA MATTE': 'PLA Matte', 'PLA SILK': 'PLA Silk',
  'PLA SPARKLE': 'PLA Silk', 'PLA GLOW': 'PLA Glow', 'PLA AERO': 'PLA Aero',
  'PLA TOUGH': 'PLA+', 'PLA CF': 'PLA-CF',
  'PETG BASIC': 'PETG', 'PETG HF': 'PETG HF', 'PETG CF': 'PETG-CF',
  'PET-CF': 'PETG-CF',
  'ABS': 'ABS', 'ASA': 'ASA', 'PC': 'PC',
  'TPU 95A': 'TPU 95A', 'TPU': 'TPU',
  'PA6-CF': 'PA6-CF', 'PA6-GF': 'PA-GF', 'PA12-CF': 'PA12-CF',
  'PA-CF': 'PA-CF', 'PA-GF': 'PA-GF',
  'PC BLEND': 'PC Blend', 'PC-CF': 'PC-CF', 'PC-ABS': 'PC-ABS',
  'PVA': 'PVA', 'HIPS': 'HIPS', 'BVOH': 'BVOH', 'PVB': 'PVB',
  'PP': 'PP',
};

function _canon(name) {
  const up = String(name || '').trim().toUpperCase().replace(/\s+/g, ' ');
  return NAME_ALIASES[up] || (up.charAt(0) + up.slice(1).toLowerCase());
}

function _parseRange(value) {
  if (!value) return [null, null];
  const s = String(value).replace(/&nbsp;/g, ' ').replace(/\((\d+)\)/g, '').replace(/\s+/g, ' ');
  const match = s.match(/(\d{1,3})\s*[–\-−—]\s*(\d{1,3})/);
  if (match) return [parseInt(match[1], 10), parseInt(match[2], 10)];
  const single = s.match(/(\d{1,3})/);
  return single ? [parseInt(single[1], 10), parseInt(single[1], 10)] : [null, null];
}

function _parseStars(value) {
  if (!value) return null;
  const stars = String(value).match(/★/g);
  return stars ? stars.length : null;
}

function _parseBoolLike(value) {
  const s = String(value || '').toLowerCase();
  if (/utmerket|excellent|ja|yes|påkrevd|required|anbefalt/.test(s)) return 2;
  if (/god|good|akseptabel|acceptable/.test(s)) return 1;
  if (/ikke anbefalt|avoid|dårlig|poor|nei|no|valgfri|optional|—|-/.test(s)) return 0;
  return null;
}

function _tables(md) {
  // Return array of { heading, rows } — rows is array of cell-arrays.
  const out = [];
  const regex = /(?:^|\n)##\s+([^\n]+)\n+([\s\S]*?)(?=\n##\s|\n---\n|$)/g;
  let m;
  while ((m = regex.exec(md))) {
    const heading = m[1].trim();
    const body = m[2];
    const rows = body
      .split('\n')
      .filter(l => /^\s*\|.+\|\s*$/.test(l) && !/\|\s*-{3,}/.test(l))
      .map(l => l.split('|').slice(1, -1).map(c => c.trim()));
    if (rows.length) out.push({ heading, rows });
  }
  return out;
}

function _findTable(md, headingPattern) {
  const all = _tables(md);
  return all.find(t => headingPattern.test(t.heading));
}

function _parseSection(md, heading) {
  const re = new RegExp(`##\\s+${heading}[^\\n]*\\n([\\s\\S]*?)(?=\\n##\\s|\\Z)`, 'i');
  const m = md.match(re);
  return m ? m[1].trim() : null;
}

// ── Parse guide.md master temperature table ──
function parseGuideTable(md) {
  const t = _findTable(md, /Temperatur|Temperature/i);
  if (!t) return [];
  const [, ...dataRows] = t.rows;
  return dataRows.map(cells => {
    const [material, nozzle, bed, chamber, difficulty] = cells;
    const [nMin, nMax] = _parseRange(nozzle);
    const [bMin, bMax] = _parseRange(bed);
    const [cMin, cMax] = _parseRange(chamber);
    const diffScore = /nybegynner|beginner/i.test(difficulty) ? 1
                    : /middels|medium/i.test(difficulty) ? 2
                    : /avansert|advanced/i.test(difficulty) ? 3
                    : /ekspert|expert/i.test(difficulty) ? 4 : null;
    return {
      material: _canon(material), nozzle_temp_min: nMin, nozzle_temp_max: nMax,
      bed_temp_min: bMin, bed_temp_max: bMax,
      chamber_temp: cMin || null, chamber_temp_max: cMax || null,
      difficulty: diffScore,
    };
  }).filter(r => r.material && r.nozzle_temp_min);
}

// ── Parse comparison.md star-rating table ──
function parseComparisonTable(md) {
  const t = _findTable(md, /sammenlign|comparison/i);
  if (!t) return [];
  const headers = t.rows[0].map(c => c.toLowerCase());
  const idx = (name) => headers.findIndex(h => h.includes(name));
  const iMaterial = idx('materiale') !== -1 ? idx('materiale') : idx('material');
  const iStrength = idx('styrke') !== -1 ? idx('styrke') : idx('strength');
  const iHeat = idx('temp-res') !== -1 ? idx('temp-res') : idx('temp') !== -1 ? idx('temp') : idx('heat');
  const iFlex = idx('fleksibilitet') !== -1 ? idx('fleksibilitet') : idx('flex');
  const iUV = idx('uv');
  const iChem = idx('kjemisk') !== -1 ? idx('kjemisk') : idx('chemical');
  const iDiff = idx('vanskelighet') !== -1 ? idx('vanskelighet') : idx('difficulty');
  const iEnclosure = idx('innelukke') !== -1 ? idx('innelukke') : idx('enclosure');
  const iPrice = idx('pris') !== -1 ? idx('pris') : idx('price');

  return t.rows.slice(1).map(cells => ({
    material: _canon(cells[iMaterial]),
    strength: _parseStars(cells[iStrength]),
    heat_resistance: _parseStars(cells[iHeat]),
    flexibility: _parseStars(cells[iFlex]),
    uv_resistant: iUV >= 0 ? _parseStars(cells[iUV]) : null,
    chemical_resistance: iChem >= 0 ? _parseStars(cells[iChem]) : null,
    difficulty: iDiff >= 0 ? _parseStars(cells[iDiff]) : null,
    enclosure_required: iEnclosure >= 0 ? /ja|yes/i.test(cells[iEnclosure] || '') ? 1 : 0 : null,
    price_tier: iPrice >= 0 ? (cells[iPrice] || '').toLowerCase().trim() : null,
  })).filter(r => r.material);
}

// ── Parse compatibility.md plate matrix ──
function parseCompatibility(md) {
  const t = _findTable(md, /byggplater|plates/i);
  if (!t) return [];
  const headers = t.rows[0];
  // Typically: [Material, Cool, Engineering, High Temp, Textured PEI, Limstift]
  return t.rows.slice(1).map(cells => {
    const plate_compatibility = {};
    for (let i = 1; i < Math.min(headers.length - 1, cells.length); i++) {
      const plateName = headers[i].toLowerCase().replace(/\s+/g, '_');
      plate_compatibility[plateName] = _parseBoolLike(cells[i]);
    }
    return {
      material: _canon(cells[0]),
      plate_compatibility: JSON.stringify(plate_compatibility),
      glue_stick: cells[cells.length - 1] || null,
    };
  }).filter(r => r.material);
}

// ── Parse bambu-series.md — brand-specific variants ──
function parseBambuSeries(md) {
  const out = [];
  // Find every ### sub-heading and grab its table
  const regex = /###\s+([^\n]+?)\n+([\s\S]*?)(?=\n###\s|\n##\s|$)/g;
  let m;
  while ((m = regex.exec(md))) {
    const variant = m[1].trim();
    const body = m[2];
    const rows = body
      .split('\n')
      .filter(l => /^\s*\|.+\|\s*$/.test(l) && !/\|\s*-{3,}/.test(l))
      .map(l => l.split('|').slice(1, -1).map(c => c.trim()));
    if (!rows.length) continue;
    const kv = {};
    for (const row of rows.slice(1)) {
      if (row.length < 2) continue;
      kv[row[0].toLowerCase()] = row[1];
    }
    const [nMin, nMax] = _parseRange(kv['dysetemperatur'] || kv['nozzle temperature']);
    const [bMin, bMax] = _parseRange(kv['sengtemperatur'] || kv['bed temperature']);
    const [cMin] = _parseRange(kv['kammertemperatur'] || kv['chamber temperature']);

    // Infer material from variant name (e.g. "PLA Matte" → PLA)
    let material = null;
    if (/pla/i.test(variant)) material = 'PLA';
    else if (/petg-cf/i.test(variant)) material = 'PETG-CF';
    else if (/petg/i.test(variant)) material = 'PETG';
    else if (/abs/i.test(variant)) material = 'ABS';
    else if (/asa/i.test(variant)) material = 'ASA';
    else if (/tpu/i.test(variant)) material = 'TPU 95A';
    else if (/pa6-cf/i.test(variant)) material = 'PA6-CF';
    else if (/pa6-gf/i.test(variant)) material = 'PA-GF';
    else if (/^pc/i.test(variant)) material = 'PC';
    else if (/pva/i.test(variant)) material = 'PVA';
    else if (/hips/i.test(variant)) material = 'HIPS';
    if (!material) continue;

    out.push({
      material, brand: 'Bambu Lab', variant,
      nozzle_temp_min: nMin, nozzle_temp_max: nMax,
      bed_temp_min: bMin, bed_temp_max: bMax,
      chamber_temp: cMin || null,
      rfid: /ja|yes/i.test(kv['rfid'] || '') ? 1 : 0,
      ams_compatible: /begrenset|limited/i.test(kv['ams-kompatibel'] || '') ? 0 : /ja|yes/i.test(kv['ams-kompatibel'] || '') ? 1 : null,
      price_tier: (kv['pris'] || kv['price'] || '').toLowerCase().trim() || null,
      enclosure_required: /påkrevd|anbefalt/i.test(kv['innelukke'] || '') ? 1 : 0,
    });
  }
  return out;
}

// ── Parse per-material markdown for rich prose ──
const FILE_TO_MATERIAL = {
  'pla.md': 'PLA', 'petg.md': 'PETG', 'abs.md': 'ABS', 'asa.md': 'ASA',
  'pc.md': 'PC', 'pva.md': 'PVA', 'tpu.md': 'TPU 95A', 'nylon.md': 'PA',
};

function parseFilePerMaterial(file, content) {
  const material = FILE_TO_MATERIAL[file];
  if (!material) return null;
  return {
    material,
    description: (() => {
      const m = content.match(/^#\s+[^\n]+\n+([^\n#][^\n]*(?:\n[^\n#][^\n]*)*)/m);
      return m ? m[1].trim().replace(/\s+/g, ' ') : null;
    })(),
    tips_print: _parseSection(content, 'Innstillinger'),
    tips_storage: _parseSection(content, 'Tørking')
                 || _parseSection(content, 'Lagring')
                 || _parseSection(content, 'Fuktighet'),
    tips_post: _parseSection(content, 'Etterbehandling')
               || _parseSection(content, 'Post-processing'),
    warnings: _parseSection(content, 'Warping') || _parseSection(content, 'Damper'),
  };
}

// ── DB writers ──
function _upsertTaxonomy(db, r) {
  // Node DatabaseSync refuses undefined bindings — coerce missing fields to null.
  const n = (v) => (v == null || Number.isNaN(v)) ? null : v;
  db.prepare(`INSERT INTO materials_taxonomy
              (material, description, extruder_temp_min, extruder_temp_max,
               bed_temp_min, bed_temp_max, enclosure_required, source)
              VALUES (?, ?, ?, ?, ?, ?, ?, 'kb_markdown')
              ON CONFLICT(material) DO UPDATE SET
                description = COALESCE(excluded.description, description),
                extruder_temp_min = COALESCE(excluded.extruder_temp_min, extruder_temp_min),
                extruder_temp_max = COALESCE(excluded.extruder_temp_max, extruder_temp_max),
                bed_temp_min = COALESCE(excluded.bed_temp_min, bed_temp_min),
                bed_temp_max = COALESCE(excluded.bed_temp_max, bed_temp_max),
                enclosure_required = COALESCE(excluded.enclosure_required, enclosure_required),
                updated_at = datetime('now')`)
    .run(r.material, n(r.description),
         n(r.nozzle_temp_min), n(r.nozzle_temp_max),
         n(r.bed_temp_min), n(r.bed_temp_max),
         r.enclosure_required != null ? r.enclosure_required : 0);
}

function _updateKbFilaments(db, material, updates) {
  const sets = []; const values = [];
  for (const [col, val] of Object.entries(updates)) {
    if (val == null || Number.isNaN(val)) continue;
    // Coerce booleans/strings consistently; node DatabaseSync only binds
    // number | string | bigint | Buffer | null.
    let bound = val;
    if (typeof bound === 'boolean') bound = bound ? 1 : 0;
    else if (typeof bound === 'object') bound = JSON.stringify(bound);
    // Only fill blanks — COALESCE(col, ?) preserves user edits in non-null rows.
    sets.push(`${col} = COALESCE(${col}, ?)`);
    values.push(bound);
  }
  if (!sets.length) return 0;
  values.push(material);
  return db.prepare(`UPDATE kb_filaments SET ${sets.join(', ')} WHERE material = ?`).run(...values).changes;
}

function _upsertBambuVariant(db, r) {
  const n = (v) => (v == null || Number.isNaN(v)) ? null : v;
  const existing = db.prepare('SELECT id FROM kb_filaments WHERE material = ? AND brand = ? AND variant = ?')
    .get(r.material, r.brand, r.variant);
  if (existing) {
    db.prepare(`UPDATE kb_filaments SET
                  nozzle_temp_min = COALESCE(NULLIF(nozzle_temp_min, 0), ?),
                  nozzle_temp_max = COALESCE(NULLIF(nozzle_temp_max, 0), ?),
                  bed_temp_min = COALESCE(NULLIF(bed_temp_min, 0), ?),
                  bed_temp_max = COALESCE(NULLIF(bed_temp_max, 0), ?),
                  chamber_temp = COALESCE(NULLIF(chamber_temp, 0), ?),
                  enclosure_required = ?
                WHERE id = ?`)
      .run(n(r.nozzle_temp_min), n(r.nozzle_temp_max), n(r.bed_temp_min), n(r.bed_temp_max),
           n(r.chamber_temp), r.enclosure_required || 0, existing.id);
    return 0;
  }
  db.prepare(`INSERT INTO kb_filaments (material, brand, variant, nozzle_temp_min, nozzle_temp_max,
              bed_temp_min, bed_temp_max, chamber_temp, enclosure_required, category)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(r.material, r.brand, r.variant, n(r.nozzle_temp_min), n(r.nozzle_temp_max),
         n(r.bed_temp_min), n(r.bed_temp_max), n(r.chamber_temp), r.enclosure_required || 0,
         /specialty|matte|silk|sparkle|glow|aero|wood|metal/i.test(r.variant) ? 'specialty' : 'standard');
  return 1;
}

/** Main entry point. */
export async function importKbMarkdown() {
  if (!existsSync(KB_DIR)) return { error: 'kb_dir_missing' };
  const files = await readdir(KB_DIR);
  const db = getDb();
  const results = {
    guide_rows: 0, comparison_rows: 0, compatibility_rows: 0,
    bambu_variants_inserted: 0, per_material_files: 0, kb_rows_updated: 0,
  };

  const read = (f) => readFileSync(join(KB_DIR, f), 'utf8');

  const safe = (fn, label) => { try { fn(); } catch (e) { log.warn(`${label} failed: ${e.message}`); results.errors = results.errors || []; results.errors.push({ step: label, msg: e.message }); } };

  // 1. guide.md master temperature table → every material gets canonical temps
  if (files.includes('guide.md')) safe(() => {
    const rows = parseGuideTable(read('guide.md'));
    for (const r of rows) safe(() => {
      _upsertTaxonomy(db, r);
      results.kb_rows_updated += _updateKbFilaments(db, r.material, {
        nozzle_temp_min: r.nozzle_temp_min, nozzle_temp_max: r.nozzle_temp_max,
        bed_temp_min: r.bed_temp_min, bed_temp_max: r.bed_temp_max,
        chamber_temp: r.chamber_temp,
      });
    }, `guide:${r.material}`);
    results.guide_rows = rows.length;
  }, 'guide.md');

  // 2. comparison.md star-ratings
  if (files.includes('comparison.md')) safe(() => {
    const rows = parseComparisonTable(read('comparison.md'));
    for (const r of rows) safe(() => {
      results.kb_rows_updated += _updateKbFilaments(db, r.material, {
        strength: r.strength, heat_resistance: r.heat_resistance,
        flexibility: r.flexibility, uv_resistant: r.uv_resistant,
        moisture_sensitivity: r.chemical_resistance,
        difficulty: r.difficulty, enclosure_required: r.enclosure_required,
      });
    }, `compare:${r.material}`);
    results.comparison_rows = rows.length;
  }, 'comparison.md');

  // 3. compatibility.md plate matrix
  if (files.includes('compatibility.md')) safe(() => {
    const rows = parseCompatibility(read('compatibility.md'));
    for (const r of rows) safe(() => {
      results.kb_rows_updated += _updateKbFilaments(db, r.material, {
        plate_compatibility: r.plate_compatibility,
        glue_stick: r.glue_stick,
      });
    }, `compat:${r.material}`);
    results.compatibility_rows = rows.length;
  }, 'compatibility.md');

  // 4. bambu-series.md brand variants
  if (files.includes('bambu-series.md')) safe(() => {
    const rows = parseBambuSeries(read('bambu-series.md'));
    for (const r of rows) safe(() => {
      results.bambu_variants_inserted += _upsertBambuVariant(db, r);
    }, `bambu:${r.variant}`);
  }, 'bambu-series.md');

  // 5. per-material prose guides
  for (const f of files) {
    if (!FILE_TO_MATERIAL[f]) continue;
    safe(() => {
      const parsed = parseFilePerMaterial(f, read(f));
      if (!parsed) return;
      _upsertTaxonomy(db, {
        material: parsed.material,
        description: parsed.description,
        enclosure_required: /ABS|ASA|PC|PA/.test(parsed.material) ? 1 : 0,
      });
      results.kb_rows_updated += _updateKbFilaments(db, parsed.material, {
        tips_print: parsed.tips_print,
        tips_storage: parsed.tips_storage,
        tips_post: parsed.tips_post,
      });
      results.per_material_files++;
    }, `file:${f}`);
  }

  log.info(`KB import: guide=${results.guide_rows} comparison=${results.comparison_rows} compat=${results.compatibility_rows} bambu_new=${results.bambu_variants_inserted} files=${results.per_material_files} kb_updates=${results.kb_rows_updated}`);
  return results;
}
