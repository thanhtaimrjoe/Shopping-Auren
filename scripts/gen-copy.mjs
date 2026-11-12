/* Regenerate src/lib/copy.ts from the COPY table in spec/03-ui-contract.md.
 * The spec is the source of truth; this file only materialises it for the app.
 * Run: node scripts/gen-copy.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const spec = fs.readFileSync(path.join(root, 'spec/03-ui-contract.md'), 'utf8');

const rows = [...spec.matchAll(/^\| (COPY-\d+) \| (.+?) \|/gm)].map((m) => ({ id: m[1], text: m[2].trim() }));
if (!rows.length) throw new Error('No COPY rows found in spec/03-ui-contract.md');

const ids = new Set();
for (const r of rows) {
  if (ids.has(r.id)) throw new Error(`Duplicate COPY id in spec: ${r.id}`);
  ids.add(r.id);
}

const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const body = rows
  .map((r) => `  '${r.id}': '${esc(r.text)}',`)
  .join('\n');

const out = `// GENERATED FILE — do not edit by hand.
// Source: spec/03-ui-contract.md (bảng COPY). Regenerate: node scripts/gen-copy.mjs
// Chuỗi có {…} là chỗ nội suy; gọi site phải truyền giá trị tương ứng (xem spec §5 quy ước).

export const copy = {
${body}
} as const;

export type CopyId = keyof typeof copy;
`;

fs.writeFileSync(path.join(root, 'src/lib/copy.ts'), out);
console.log(`wrote src/lib/copy.ts with ${rows.length} strings`);
