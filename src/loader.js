import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const GAMES = {
  miloto: {
    file: 'miloto.csv',
    label: 'MiLoto',
    min: 1,
    max: 39,
    smallMax: 19,
    cost: 4000,
    categories: [
      { hits: 5, name: 'Premio Mayor (5 aciertos)' },
      { hits: 4, name: '2º premio (4 aciertos)' },
      { hits: 3, name: '3º premio (3 aciertos)' },
      { hits: 2, name: '4º premio (2 aciertos)' },
    ],
  },
  baloto: {
    file: 'baloto.csv',
    label: 'Baloto',
    min: 1,
    max: 43,
    smallMax: 21,
    cost: 6000,
    hasBalota: true,
    balotaMax: 16,
    categories: [
      { hits: 5, balota: true, name: 'Premio Mayor' },
      { hits: 5, balota: false, name: '5 aciertos' },
      { hits: 4, balota: true, name: '4 + Súper Balota' },
      { hits: 4, balota: false, name: '4 aciertos' },
      { hits: 3, balota: true, name: '3 + Súper Balota' },
      { hits: 3, balota: false, name: '3 aciertos' },
      { hits: 2, balota: true, name: '2 + Súper Balota' },
      { hits: 1, balota: true, name: '1 + Súper Balota' },
    ],
  },
};

export function gameConfig(name) {
  const cfg = GAMES[name];
  if (!cfg) throw new Error(`Juego desconocido: ${name}. Disponibles: ${Object.keys(GAMES).join(', ')}`);
  return cfg;
}

export function loadGame(name) {
  const cfg = gameConfig(name);
  const file = join(__dirname, '..', 'data', cfg.file);
  const text = readFileSync(file, 'utf8');
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(',');
  const draws = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < header.length) continue;
    const rec = {};
    header.forEach((h, idx) => {
      const raw = (parts[idx] || '').trim();
      rec[h] = /^\d+$/.test(raw) ? parseInt(raw, 10) : raw;
    });
    const nums = [];
    for (let k = 1; k <= 5; k++) nums.push(rec[`n${k}`]);
    nums.sort((a, b) => a - b);
    draws.push({
      date: rec.draw_date,
      no: rec.sorteo,
      nums,
      balota: rec.balota ?? null,
    });
  }

  draws.sort((a, b) => a.no - b.no);
  return { name, cfg, draws, headers: header };
}

export function isPaired(n, cfg) {
  return n % 2 === 0;
}

export function isSmall(n, cfg) {
  return n <= cfg.smallMax;
}

export function intervalsFor(cfg) {
  // Intervalos dinámicos según el rango del juego
  const bands = [];
  let start = cfg.min;
  const width = cfg.max <= 20 ? 4 : 10;
  while (start <= cfg.max) {
    const end = Math.min(start + width - 1, cfg.max);
    bands.push([start, end]);
    start = end + 1;
  }
  return bands;
}

export function bandOf(n, cfg) {
  const bands = intervalsFor(cfg);
  for (let i = 0; i < bands.length; i++) {
    if (n >= bands[i][0] && n <= bands[i][1]) return i;
  }
  return -1;
}