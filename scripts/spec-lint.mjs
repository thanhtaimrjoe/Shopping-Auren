/* Spec linter — no dependencies.
 * Checks: link integrity (referenced IDs exist), duplicate definitions, front-matter.
 * Run: node scripts/spec-lint.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const specDir = path.join(process.cwd(), 'spec');
const files = fs.readdirSync(specDir).filter((f) => f.endsWith('.md')).sort();
const docs = files.map((f) => ({ file: f, text: fs.readFileSync(path.join(specDir, f), 'utf8') }));
const all = docs.map((d) => d.text).join('\n');

const defs = new Map(); // id -> file
const add = (id, file, { allowRepeat = false } = {}) => {
  if (!id) return;
  if (defs.has(id)) {
    if (!allowRepeat) {
      console.error(`DUPLICATE definition: ${id} in ${defs.get(id)} and ${file}`);
      failed = true;
    }
  } else defs.set(id, file);
};
let failed = false;

const DEFINERS = [
  [/^### (FR-\d+)/gm, 'FR'],
  [/^- \*\*(NFR-\d+)/gm, 'NFR'],
  [/\| (UC-\d+) \|/g, 'UC'],
  [/\| (SC-\d+) \|/g, 'SC'],
  [/^### (CMP-\d+)/gm, 'CMP'],
  [/^\| (COPY-\d+) \|/gm, 'COPY'],
  [/^## (DEC-\d+)/gm, 'DEC'],
  [/^\| (AUR-\d+) \|/gm, 'AUR'],
  [/^\*\*(BR-\d+) —/gm, 'BR'],
  [/^- (BR-\d+\.\d+) /gm, 'BR'],
  [/^\*\*(BR-\d+\.\d+) —/gm, 'BR'],
];

for (const d of docs) {
  for (const [re, kind] of DEFINERS) {
    // SC/COPY appear in several tables of 03 by design — first occurrence defines them.
    const allowRepeat = kind === 'SC' || kind === 'COPY';
    for (const m of d.text.matchAll(re)) add(m[1], d.file, { allowRepeat });
    void kind;
  }
}

// IDs referenced anywhere in spec/. Q-xxx and TASK-xxx are legacy (Notion archive) — not linted.
const REF = /\b(FR-\d+|NFR-\d+|UC-\d+|SC-\d+|CMP-\d+|COPY-\d+|DEC-\d+|AUR-\d+|BR-\d+(?:\.\d+)?)\b/g;
const refs = new Map();
for (const d of docs) for (const m of d.text.matchAll(REF)) {
  if (!refs.has(m[1])) refs.set(m[1], new Set());
  refs.get(m[1]).add(d.file);
}

const dangling = [...refs.keys()].filter((id) => !defs.has(id)).sort();
if (dangling.length) {
  failed = true;
  console.error(`DANGLING references (${dangling.length}): ${dangling.join(', ')}`);
}

// front-matter
const ALLOWED = new Set(['draft', 'approved', 'superseded', 'withdrawn', 'partial']);
const metaProblems = [];
for (const d of docs) {
  const fm = d.text.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) { metaProblems.push(`${d.file}: missing front-matter`); continue; }
  const body = fm[1];
  for (const key of ['id', 'status', 'owner', 'updated']) {
    if (!new RegExp(`^${key}:`, 'm').test(body)) metaProblems.push(`${d.file}: missing "${key}"`);
  }
  const st = body.match(/^status:\s*(\S+)/m)?.[1];
  if (st && !ALLOWED.has(st)) metaProblems.push(`${d.file}: status "${st}" not in ${[...ALLOWED].join('|')}`);
}
if (metaProblems.length) { failed = true; metaProblems.forEach((p) => console.error(`META: ${p}`)); }

const counts = { docs: docs.length, ids: defs.size, refs: refs.size };
console.log(`spec-lint: ${counts.docs} files, ${counts.ids} defined IDs, ${counts.refs} referenced IDs`);
console.log(failed ? 'FAIL' : 'PASS');
process.exit(failed ? 1 : 0);
