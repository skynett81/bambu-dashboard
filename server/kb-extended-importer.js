/**
 * Extended KB importer — covers everything outside filaments/:
 *   - website/docs/kb/build-plates/    → kb_build_plates   (6 guides)
 *   - website/docs/kb/maintenance/     → kb_maintenance    (5 guides)
 *   - website/docs/kb/troubleshooting/ → kb_troubleshooting (4 guides)
 *
 * Each file's frontmatter (title, description, sidebar_position) plus full
 * body-markdown is persisted so the dashboard's KB tab can render the
 * same Norwegian prose that's on the public docs site.
 *
 * Topic/symptom/compatibility data is extracted from structured sections
 * where available; raw body_markdown is always preserved.
 */

import { readFileSync, existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb } from './db/connection.js';
import { createLogger } from './logger.js';

const log = createLogger('kb-extended-importer');
const __dir = dirname(fileURLToPath(import.meta.url));
const KB_NB = join(__dir, '..', 'website', 'docs', 'kb');
const KB_EN = join(__dir, '..', 'website', 'i18n', 'en', 'docusaurus-plugin-content-docs', 'current', 'kb');

function _parseFrontmatter(md) {
  const fm = md.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
  if (!fm) return { title: null, description: null };
  const lines = fm[1].split('\n').map(l => l.trim()).filter(Boolean);
  const kv = {};
  for (const line of lines) {
    const m = line.match(/^(\w+):\s*(.+?)\s*$/);
    if (m) kv[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  return kv;
}

function _bodyAfterFrontmatter(md) {
  return md.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '').trim();
}

function _parseSection(md, headingRegex) {
  const regex = new RegExp(`##\\s+(?:${headingRegex.source})[^\\n]*\\n([\\s\\S]*?)(?=\\n##\\s|$)`, 'i');
  const m = md.match(regex);
  return m ? m[1].trim() : null;
}

// ── Build-plate parser ──
function parseBuildPlate(slug, content) {
  const fm = _parseFrontmatter(content);
  const body = _bodyAfterFrontmatter(content);
  // Max temp is often in an "Innstillinger" or "Egenskaper" section
  const maxTemp = (body.match(/maks(?:imal)?\s*(?:temp(?:eratur)?|bed)\s*[:\-]?\s*(\d{2,3})\s*°?C/i) || [])[1];
  // Compatibility section usually lists materials
  const compatSection = _parseSection(body, /Kompat|Egnet|Works|Compatible/) || '';
  const incompatSection = _parseSection(body, /Ikke\s+anbefalt|Avoid|Incompatible|Unngå/) || '';
  return {
    slug,
    title: fm.title || slug,
    description: fm.description || null,
    surface_type: /(PEI|PEO|PEY|PEX|smooth|textured|engineering|cool\s*plate|high\s*temp)/i.exec(body)?.[1] || null,
    max_temp_c: maxTemp ? parseInt(maxTemp, 10) : null,
    compatible_materials: compatSection.slice(0, 2000) || null,
    incompatible_materials: incompatSection.slice(0, 2000) || null,
    glue_required: _parseSection(body, /Limstift|Glue\s*stick/)?.slice(0, 1000) || null,
    cleaning_tips: _parseSection(body, /Rengjør|Clean|Vedlikehold/)?.slice(0, 2000) || null,
    body_markdown: body,
  };
}

// ── Maintenance parser ──
function parseMaintenance(slug, content) {
  const fm = _parseFrontmatter(content);
  const body = _bodyAfterFrontmatter(content);
  const frequencyMatch = body.match(/(?:hver|every)\s+(\d+)\s+(?:dag|day)/i);
  const difficultyMatch = body.match(/vanskelighet(?:sgrad)?\s*[:\-]?\s*(\d+|lett|middels|avansert|ekspert)/i);
  const diffMap = { lett: 1, middels: 2, avansert: 3, ekspert: 4 };
  const difficulty = difficultyMatch
    ? (parseInt(difficultyMatch[1], 10) || diffMap[difficultyMatch[1]?.toLowerCase()] || null)
    : null;
  return {
    slug,
    title: fm.title || slug,
    description: fm.description || null,
    topic: slug.toLowerCase(),
    frequency_days: frequencyMatch ? parseInt(frequencyMatch[1], 10) : null,
    difficulty,
    body_markdown: body,
  };
}

// ── Troubleshooting parser ──
function parseTroubleshooting(slug, content) {
  const fm = _parseFrontmatter(content);
  const body = _bodyAfterFrontmatter(content);
  return {
    slug,
    title: fm.title || slug,
    description: fm.description || null,
    symptom: slug.toLowerCase(),
    causes: _parseSection(body, /Årsak|Cause/)?.slice(0, 3000) || null,
    solutions: _parseSection(body, /Løsning|Solution|Fix|Tiltak/)?.slice(0, 4000) || null,
    body_markdown: body,
  };
}

// ── DB writer helper — uses (slug, locale) composite key ──
function _upsert(db, table, row) {
  const n = (v) => (v == null || Number.isNaN(v)) ? null : v;
  const cols = Object.keys(row);
  const values = cols.map(c => n(row[c]));
  const placeholders = cols.map(() => '?').join(', ');
  const updateSet = cols
    .filter(c => c !== 'slug' && c !== 'locale')
    .map(c => `${c} = excluded.${c}`).join(', ');
  db.prepare(`INSERT INTO ${table} (${cols.join(', ')})
              VALUES (${placeholders})
              ON CONFLICT(slug, locale) DO UPDATE SET ${updateSet}, updated_at = datetime('now')`)
    .run(...values);
}

export async function importExtendedKb() {
  const result = {
    nb: { build_plates: 0, maintenance: 0, troubleshooting: 0 },
    en: { build_plates: 0, maintenance: 0, troubleshooting: 0 },
    errors: [],
  };
  const db = getDb();

  const safe = (fn, label) => { try { fn(); } catch (e) { result.errors.push({ step: label, msg: e.message }); } };

  const run = async (root, subdir, table, parseFn, locale, counter) => {
    const dir = join(root, subdir);
    if (!existsSync(dir)) return;
    const files = (await readdir(dir)).filter(f => f.endsWith('.md'));
    for (const f of files) {
      safe(() => {
        const slug = f.replace(/\.md$/, '');
        const content = readFileSync(join(dir, f), 'utf8');
        const row = parseFn(slug, content);
        row.locale = locale;
        row.source_file = `${root.includes('i18n') ? 'i18n/en/' : ''}kb/${subdir}/${f}`;
        _upsert(db, table, row);
        result[locale][counter]++;
      }, `${locale}/${subdir}/${f}`);
    }
  };

  db.exec('BEGIN');
  try {
    // Norwegian — canonical
    if (existsSync(KB_NB)) {
      await run(KB_NB, 'build-plates',    'kb_build_plates',    parseBuildPlate,    'nb', 'build_plates');
      await run(KB_NB, 'maintenance',     'kb_maintenance',     parseMaintenance,   'nb', 'maintenance');
      await run(KB_NB, 'troubleshooting', 'kb_troubleshooting', parseTroubleshooting, 'nb', 'troubleshooting');
    }
    // English — i18n translations
    if (existsSync(KB_EN)) {
      await run(KB_EN, 'build-plates',    'kb_build_plates',    parseBuildPlate,    'en', 'build_plates');
      await run(KB_EN, 'maintenance',     'kb_maintenance',     parseMaintenance,   'en', 'maintenance');
      await run(KB_EN, 'troubleshooting', 'kb_troubleshooting', parseTroubleshooting, 'en', 'troubleshooting');
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }

  log.info(`Extended KB import: nb ${JSON.stringify(result.nb)} / en ${JSON.stringify(result.en)} (${result.errors.length} errors)`);
  return result;
}
