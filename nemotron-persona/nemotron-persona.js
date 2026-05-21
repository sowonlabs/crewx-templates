#!/usr/bin/env node
/**
 * nemotron-persona — Persona simulation powered by NVIDIA Nemotron-Personas-Korea dataset
 *
 * Usage:
 *   node nemotron-persona.js download                              Download 9 parquet shards
 *   node nemotron-persona.js status                                Check download status
 *   node nemotron-persona.js search [--age=N-M] [--sex=...] ...   Search personas
 *   node nemotron-persona.js pick <uuid>                           View persona by UUID
 *   node nemotron-persona.js pick --random [filters]               Random persona detail
 *   node nemotron-persona.js query <uuid> "question"               Converse as persona
 *   node nemotron-persona.js query --random [filters] "question"   Random persona conversation
 */

'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SKILL_DIR = __dirname;
const DATA_DIR = path.join(SKILL_DIR, '.data');
const CREWX_YAML = path.join(SKILL_DIR, 'crewx.yaml');
const PARQUET_GLOB = path.join(DATA_DIR, '*.parquet');

const SHARD_URLS = Array.from({ length: 9 }, (_, i) =>
  `https://huggingface.co/api/datasets/nvidia/Nemotron-Personas-Korea/parquet/default/train/${i}.parquet`
);

const PROJECT_ROOT = path.resolve(SKILL_DIR, '../..');
const LOCAL_CREWX = path.join(PROJECT_ROOT, 'crewx');
const CREWX_CLI = process.env.CREWX_CLI ||
  (fs.existsSync(LOCAL_CREWX) ? LOCAL_CREWX : 'npx -y crewx@next');

const SUPPORTED_PROVIDERS = ['acp/claude', 'acp/codex'];
const DEFAULT_PROVIDER = 'acp/claude';
const DEFAULT_MODELS = {
  'acp/claude': 'sonnet',
  'acp/codex': 'gpt-5.4',
};

function resolveProvider(optProvider) {
  const provider = optProvider || process.env.NEMOTRON_PROVIDER || DEFAULT_PROVIDER;
  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    console.error(`Unsupported provider: ${provider}`);
    console.error(`Supported: ${SUPPORTED_PROVIDERS.join(', ')}`);
    process.exit(1);
  }
  return provider;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function humanSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)}GB`;
}

// Parse --key=value arguments
function parseArgs(argv) {
  const opts = {};
  const positional = [];
  for (const arg of argv) {
    const m = arg.match(/^--([^=]+)=(.*)$/s);
    if (m) {
      opts[m[1]] = m[2];
    } else if (arg.startsWith('--')) {
      opts[arg.slice(2)] = true;
    } else {
      positional.push(arg);
    }
  }
  return { opts, positional };
}

// ─────────────────────────────────────────────
// download
// ─────────────────────────────────────────────
function cmdDownload() {
  ensureDataDir();
  console.log('📥 Downloading Nemotron-Personas-Korea parquet (9 shards)\n');

  for (let i = 0; i < SHARD_URLS.length; i++) {
    const url = SHARD_URLS[i];
    const dest = path.join(DATA_DIR, `${i}.parquet`);

    if (fs.existsSync(dest)) {
      const size = humanSize(fs.statSync(dest).size);
      console.log(`  [${i + 1}/9] Already exists — ${i}.parquet (${size})`);
      continue;
    }

    console.log(`  [${i + 1}/9] Downloading — ${i}.parquet ...`);
    try {
      execSync(`curl -L -f -o "${dest}" "${url}"`, { stdio: 'inherit' });
      const size = humanSize(fs.statSync(dest).size);
      console.log(`       Done — ${size}`);
    } catch (e) {
      console.error(`       Failed: ${e.message}`);
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
    }
  }
  console.log('\n✅ Download complete');
}

// ─────────────────────────────────────────────
// status
// ─────────────────────────────────────────────
function cmdStatus() {
  ensureDataDir();
  let totalSize = 0;
  const found = [];

  for (let i = 0; i < 9; i++) {
    const fpath = path.join(DATA_DIR, `${i}.parquet`);
    if (fs.existsSync(fpath)) {
      const size = fs.statSync(fpath).size;
      totalSize += size;
      found.push(i);
    }
  }

  console.log('📊 Download Status');
  console.log(`   Completed: ${found.length}/9 shards`);
  console.log(`   Total size: ${humanSize(totalSize)}`);

  if (found.length < 9) {
    const missing = Array.from({ length: 9 }, (_, i) => i).filter(i => !found.includes(i));
    console.log(`   Missing shards: ${missing.join(', ')}`);
    console.log('\n💡 Run: node nemotron-persona.js download');
  } else {
    console.log('\n✅ All shards downloaded — search/conversation ready');
  }
}

// ─────────────────────────────────────────────
// DuckDB helpers
// ─────────────────────────────────────────────
let _db = null;
function getDb() {
  if (_db) return _db;
  const duckdb = require('duckdb');
  _db = new duckdb.Database(':memory:');
  return _db;
}

function checkParquetExists() {
  ensureDataDir();
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.parquet'));
  if (files.length === 0) {
    console.error('❌ No parquet files found. Run: node nemotron-persona.js download');
    process.exit(1);
  }
  return files.length;
}

function dbAll(conn, sql, params) {
  return new Promise((resolve, reject) => {
    conn.all(sql, ...params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Filter options → WHERE clause + params
function buildWhere(opts) {
  const clauses = [];
  const params = [];

  if (opts.age) {
    const parts = opts.age.split('-').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      clauses.push('TRY_CAST(age AS INTEGER) BETWEEN ? AND ?');
      params.push(parts[0], parts[1]);
    }
  }
  if (opts.sex) {
    clauses.push('sex = ?');
    params.push(opts.sex);
  }
  if (opts.province) {
    clauses.push('province = ?');
    params.push(opts.province);
  }
  if (opts.district) {
    clauses.push('district = ?');
    params.push(opts.district);
  }
  if (opts.occupation) {
    clauses.push('occupation LIKE ?');
    params.push(`%${opts.occupation}%`);
  }
  if (opts.education) {
    clauses.push('education_level LIKE ?');
    params.push(`%${opts.education}%`);
  }

  return {
    where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
}

// ─────────────────────────────────────────────
// search
// ─────────────────────────────────────────────
async function cmdSearch(opts) {
  checkParquetExists();
  const limit = parseInt(opts.limit || '5', 10);
  const { where, params } = buildWhere(opts);

  const db = getDb();
  const conn = db.connect();

  try {
    const countRows = await dbAll(
      conn,
      `SELECT COUNT(*) AS cnt FROM '${PARQUET_GLOB}' ${where}`,
      params
    );
    const total = Number(countRows[0].cnt);

    const filterParts = [];
    if (opts.age) filterParts.push(`age=${opts.age}`);
    if (opts.sex) filterParts.push(`sex=${opts.sex}`);
    if (opts.province) filterParts.push(`province=${opts.province}`);
    if (opts.district) filterParts.push(`district=${opts.district}`);
    if (opts.occupation) filterParts.push(`occupation=${opts.occupation}`);
    if (opts.education) filterParts.push(`education=${opts.education}`);

    console.log(`🔍 Filter: ${filterParts.length ? filterParts.join(', ') : '(none)'}`);
    console.log(`📊 Matched: ${Math.min(limit, total)} samples from ${total.toLocaleString()}\n`);

    if (total === 0) {
      console.log('No personas matching the given criteria.');
      return;
    }

    const rows = await dbAll(
      conn,
      `SELECT uuid, persona, age, sex, province, district, occupation
       FROM '${PARQUET_GLOB}'
       ${where}
       ORDER BY RANDOM()
       LIMIT ?`,
      [...params, limit]
    );

    rows.forEach((row, idx) => {
      const summary = row.persona ? row.persona.slice(0, 60) + '...' : '';
      console.log(`${idx + 1}. (Age ${row.age}, ${row.sex}) — ${row.province} ${row.district}, ${row.occupation}`);
      console.log(`   "${summary}"`);
      console.log(`   uuid: ${row.uuid}\n`);
    });
  } finally {
    conn.close();
  }
}

// ─────────────────────────────────────────────
// pick
// ─────────────────────────────────────────────
function printPick(row) {
  console.log(`\n👤 (uuid: ${row.uuid})`);
  console.log('━'.repeat(50));
  console.log(`Age: ${row.age} | Gender: ${row.sex} | Location: ${row.province} ${row.district}`);
  const edu = row.bachelors_field ? `${row.education_level} (${row.bachelors_field})` : (row.education_level || '-');
  console.log(`Occupation: ${row.occupation || '-'} | Education: ${edu}`);
  console.log(`Marital: ${row.marital_status || '-'} | Housing: ${row.housing_type || '-'}`);
  console.log('');

  const trunc = (s, n) => s ? `"${s.slice(0, n)}${s.length > n ? '...' : ''}"` : null;
  if (row.persona) console.log(`📋 General: ${trunc(row.persona, 120)}`);
  if (row.professional_persona) console.log(`💼 Professional: ${trunc(row.professional_persona, 80)}`);
  if (row.sports_persona) console.log(`⚽ Sports: ${trunc(row.sports_persona, 80)}`);
  if (row.arts_persona) console.log(`🎨 Arts: ${trunc(row.arts_persona, 80)}`);
  if (row.travel_persona) console.log(`✈️  Travel: ${trunc(row.travel_persona, 80)}`);
  if (row.culinary_persona) console.log(`🍽️  Culinary: ${trunc(row.culinary_persona, 80)}`);
  if (row.family_persona) console.log(`👨‍👩‍👧 Family: ${trunc(row.family_persona, 80)}`);
  console.log('');
}

async function cmdPick(args, opts) {
  checkParquetExists();
  const db = getDb();
  const conn = db.connect();

  try {
    let rows;
    if (opts.random) {
      const { where, params } = buildWhere(opts);
      rows = await dbAll(
        conn,
        `SELECT * FROM '${PARQUET_GLOB}' ${where} ORDER BY RANDOM() LIMIT 1`,
        params
      );
      if (rows.length === 0) {
        console.log('No personas matching the given criteria.');
        return;
      }
    } else {
      const uuid = args[0];
      if (!uuid) {
        console.error('Usage: node nemotron-persona.js pick <uuid>  or  node nemotron-persona.js pick --random');
        process.exit(1);
      }
      rows = await dbAll(
        conn,
        `SELECT * FROM '${PARQUET_GLOB}' WHERE uuid = ? LIMIT 1`,
        [uuid]
      );
      if (rows.length === 0) {
        console.error(`UUID "${uuid}" not found.`);
        process.exit(1);
      }
    }
    printPick(rows[0]);
  } finally {
    conn.close();
  }
}

// ─────────────────────────────────────────────
// query
// ─────────────────────────────────────────────
function buildProfile(row) {
  const line = (label, val) => val ? `- ${label}: ${val}` : '';
  const edu = row.bachelors_field
    ? `${row.education_level} (${row.bachelors_field})`
    : (row.education_level || '-');

  return [
    '# Persona Profile',
    '',
    '## Basic Info',
    line('Age', `${row.age}`),
    line('Gender', row.sex),
    line('Location', `${row.province} ${row.district}`),
    line('Occupation', row.occupation),
    line('Education', edu),
    line('Marital Status', row.marital_status),
    line('Housing', row.housing_type),
    line('Military', row.military_status),
    line('Family Type', row.family_type),
    '',
    '## General Persona',
    row.persona || '-',
    '',
    '## Professional Persona',
    row.professional_persona || '-',
    '',
    '## Sports & Activities',
    row.sports_persona || '-',
    '',
    '## Arts & Culture',
    row.arts_persona || '-',
    '',
    '## Travel',
    row.travel_persona || '-',
    '',
    '## Culinary',
    row.culinary_persona || '-',
    '',
    '## Family & Relationships',
    row.family_persona || '-',
    '',
    '## Skills & Expertise',
    row.skills_and_expertise || '-',
    '',
    '## Hobbies & Interests',
    row.hobbies_and_interests || '-',
    '',
    '## Career Goals',
    row.career_goals_and_ambitions || '-',
  ].filter(l => l !== null).join('\n');
}

async function cmdQuery(args, opts) {
  checkParquetExists();
  const db = getDb();
  const conn = db.connect();

  try {
    let row, question;

    if (opts.random) {
      const { where, params } = buildWhere(opts);
      const rows = await dbAll(
        conn,
        `SELECT * FROM '${PARQUET_GLOB}' ${where} ORDER BY RANDOM() LIMIT 1`,
        params
      );
      if (rows.length === 0) {
        console.error('No personas matching the given criteria.');
        process.exit(1);
      }
      row = rows[0];
      question = args[0];
    } else {
      const uuid = args[0];
      question = args[1];
      if (!uuid || !question) {
        console.error('Usage: node nemotron-persona.js query <uuid> "question"');
        process.exit(1);
      }
      const rows = await dbAll(
        conn,
        `SELECT * FROM '${PARQUET_GLOB}' WHERE uuid = ? LIMIT 1`,
        [uuid]
      );
      if (rows.length === 0) {
        console.error(`UUID "${uuid}" not found.`);
        process.exit(1);
      }
      row = rows[0];
    }

    if (!question) {
      console.error('Please provide a question.');
      process.exit(1);
    }

    const profile = buildProfile(row);
    const provider = resolveProvider(opts.provider);
    const model = opts.model || DEFAULT_MODELS[provider];

    console.log(`\n👤 Persona: Age ${row.age}, ${row.sex}, ${row.province} ${row.district}, ${row.occupation}`);
    console.log(`🔌 Provider: ${provider}`);
    console.log(`🤖 Model: ${model}`);
    console.log(`💬 Question: "${question}"\n`);
    console.log('─'.repeat(50));

    const prompt = `You are the person described in the profile below. Converse naturally from this person's perspective.
Never reveal that you are an AI. Infer any missing information consistently with the profile.
Respond in Korean naturally.

${profile}`;

    execSync(
      `${CREWX_CLI} q "@nemotron_persona_actor ${question}" --config="${CREWX_YAML}" --var model=${model} --provider=${provider}`,
      {
        stdio: 'inherit',
        env: { ...process.env, NEMOTRON_PERSONA_PROMPT: prompt },
      }
    );
  } finally {
    conn.close();
  }
}

// ─────────────────────────────────────────────
// main
// ─────────────────────────────────────────────
function printHelp() {
  console.log(`
nemotron-persona — Persona simulation powered by NVIDIA Nemotron-Personas-Korea

Usage:
  node nemotron-persona.js download                              Download 9 parquet shards (~2GB)
  node nemotron-persona.js status                                Check download status
  node nemotron-persona.js search [options]                      Search personas (sample output)
  node nemotron-persona.js pick <uuid>                           View persona by UUID
  node nemotron-persona.js pick --random [options]               Random persona detail
  node nemotron-persona.js query <uuid> "question"               Converse as persona
  node nemotron-persona.js query --random [options] "question"   Random persona conversation
  node nemotron-persona.js query <uuid> "question" --model=haiku       Specify model
  node nemotron-persona.js query --random "question" --provider=acp/codex  Use Codex

Search/Filter Options:
  --age=N-M          Age range           e.g. --age=20-30
  --sex=value        Gender              남성 | 여성
  --province=value   Province/City       e.g. --province=서울특별시
  --district=value   District            e.g. --district=강남구
  --occupation=value Occupation (partial) e.g. --occupation=교사
  --education=value  Education (partial)  e.g. --education=4년제
  --limit=N          Result count (default: 5)
  --model=value      Model override          e.g. --model=haiku (default: per provider)
  --provider=value   AI provider             acp/claude (default) | acp/codex
                     Or set env: NEMOTRON_PROVIDER=acp/codex
`);
}

async function main() {
  const [,, cmd, ...rest] = process.argv;
  const { opts, positional } = parseArgs(rest);

  switch (cmd) {
    case 'download': cmdDownload(); break;
    case 'status':   cmdStatus();   break;
    case 'search':   await cmdSearch(opts); break;
    case 'pick':     await cmdPick(positional, opts); break;
    case 'query':    await cmdQuery(positional, opts); break;
    default:         printHelp(); process.exit(cmd ? 1 : 0);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
