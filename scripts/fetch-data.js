import { writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '..', 'data');

const SOURCES = {
  miloto: 'https://resultadosloteriascol.com/api/download/miloto.csv',
  baloto: 'https://resultadosloteriascol.com/api/download/baloto.csv',
};

for (const [name, url] of Object.entries(SOURCES)) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fallo al descargar ${name}: HTTP ${res.status}`);
  const text = await res.text();
  const lines = text.trim().split(/\r?\n/);
  const err = `Archivo ${name} no pasó validación (${lines.length} líneas). No se sobrescribe.`;

  const headerOk = /^(draw_date,sorteo,)/.test(lines[0] ?? '');
  const rows = lines.slice(1).filter(Boolean);
  const rowOk = rows.every((l) => /^20\d\d-\d\d-\d\d,\d+,\d+,\d+,\d+,\d+,\d+$/.test(l));
  if (!headerOk || rows.length < 50 || !rowOk) throw new Error(err);

  const prev = join(DATA, `${name}.csv`);
  let prevCount = 0;
  try { prevCount = readFileSync(prev, 'utf8').trim().split(/\r?\n/).length - 1; } catch {}

  writeFileSync(prev, text.replace(/\r\n/g, '\n').replace(/\n$/, '') + '\n', 'utf8');
  console.log(`✓ ${name}: ${prevCount} → ${rows.length} sorteos (${rows.length > prevCount ? 'actualizado' : 'sin cambios'})`);
}
console.log('\nDatos actualizados. Ejecuta ahora: node scripts/generate-web.js');