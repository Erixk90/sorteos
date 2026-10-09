import { isPaired, isSmall, bandOf, intervalsFor } from './loader.js';

// ============================================================================
// motor.js — Análisis de patrones individuales y colectivos.
// Implementa las definiciones del documento: caliente/frío, farol, despertar,
// inercia/impulso, doblete, triple, estrella, pares/impares, grandes/pequeños,
// intervalos, ausencia, bilaterales, repetidos, consecutivos y principio del péndulo.
// ============================================================================

export const HOT_LAST = 10;
export const COLD_LAST = 10;
export const FAROL_GAP = 20;
export const DESPERTAR_GAP = 17;

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function pct(arr, p) {
  const s = [...arr].sort((a, b) => a - b);
  const idx = Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1));
  return s[idx];
}

function stdev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / (arr.length - 1));
}

/** Análisis individual de cada número. */
export function analyzeNumbers(game) {
  const { cfg, draws } = game;
  const n = cfg.max;
  const total = draws.length;
  const result = [];

  for (let num = cfg.min; num <= n; num++) {
    const appearances = [];
    draws.forEach((d, idx) => {
      if (d.nums.includes(num)) appearances.push(idx);
    });

    const gaps = [];
    for (let i = 1; i < appearances.length; i++) gaps.push(appearances[i] - appearances[i - 1]);

    const lastGap = appearances.length ? total - 1 - appearances[appearances.length - 1] : total;

    const c5 = appearances.filter((a) => a >= total - 5).length;
    const c10 = appearances.filter((a) => a >= total - 10).length;
    const c20 = appearances.filter((a) => a >= total - 20).length;

    const isHot = c10 >= 2 && c5 >= 1;
    const isCold = c10 === 0;
    const farol = lastGap >= FAROL_GAP;
    const despertarReady = lastGap >= DESPERTAR_GAP && !farol;

    const lastThree = gaps.slice(-3);
    const inercia = lastThree.length >= 3 && lastThree[0] < lastThree[1] && lastThree[1] < lastThree[2];
    const impulso = lastThree.length >= 3 && lastThree[0] > lastThree[1] && lastThree[1] > lastThree[2];

    const lastTwo = gaps.slice(-2);
    const dbl = lastTwo.length === 2 && Math.abs(lastTwo[0] - lastTwo[1]) <= 1;
    const trp = lastThree.length >= 3 && Math.max(...lastThree) - Math.min(...lastThree) <= 1;

    const avgInterval = gaps.length ? mean(gaps) : null;
    const estrella = avgInterval !== null && Math.abs(avgInterval - 5) <= 1;

    // Origen tras una larga ausencia (Despertar): la última aparición llegó después
    // de al menos DESPERTAR_GAP sorteos sin salir.
    const despertar = appearances.length >= 2 && gaps[gaps.length - 1] >= DESPERTAR_GAP;

    // Peso por recencia: más pesado si apareció recientemente.
    const recency = appearances.reduce((s, a, i) => s + (i + 1) * (a + 1), 0) / Math.max(1, appearances.length);

    result.push({
      num,
      firstSeenIdx: appearances[0] ?? null,
      count: appearances.length,
      freqPct: (100 * appearances.length) / total,
      last5: c5,
      last10: c10,
      last20: c20,
      lastGap,
      maxGapEver: gaps.length ? Math.max(...gaps) : lastGap,
      gaps,
      lastIntervals: lastThree,
      avgInterval,
      isHot,
      isCold,
      farol,
      despertar,
      despertarReady,
      inercia,
      impulso,
      doblete: dbl,
      triple: trp,
      estrella,
    });
  }

  return result;
}

/** Estadística colectiva por sorteo + distribución de sumas. */
export function analyzeCollective(game) {
  const { cfg, draws } = game;
  const total = draws.length;
  const bands = intervalsFor(cfg);
  const perDraw = [];
  const numsArr = analyzeNumbers(game);
  const hotSet = new Set(numsArr.filter((x) => x.isHot).map((x) => x.num));
  const coldSet = new Set(numsArr.filter((x) => x.isCold).map((x) => x.num));

  let repeatedTotal = 0;
  let bilateralTotal = 0;
  let consecutiveTotal = 0;
  let intervalCountTotal = 0;

  for (let i = 0; i < total; i++) {
    const d = draws[i];
    const prev = i > 0 ? draws[i - 1] : null;
    const pares = d.nums.filter((x) => isPaired(x, cfg)).length;
    const impares = 5 - pares;
    const pequenos = d.nums.filter((x) => isSmall(x, cfg)).length;
    const grandes = 5 - pequenos;
    const calientes = d.nums.filter((x) => hotSet.has(x)).length;
    const frios = d.nums.filter((x) => coldSet.has(x)).length;
    const coveredBands = new Set(d.nums.map((x) => bandOf(x, cfg)));

    const repetidos = prev ? d.nums.filter((x) => prev.nums.includes(x)).length : 0;
    const bilaterales = prev
      ? d.nums.filter((x) => prev.nums.some((p) => Math.abs(x - p) === 1)).length
      : 0;
    let consecutivos = 0;
    for (let k = 0; k < d.nums.length; k++) {
      if (d.nums.includes(d.nums[k] + 1)) consecutivos++;
    }

    repeatedTotal += repetidos;
    bilateralTotal += bilaterales;
    consecutiveTotal += consecutivos;
    intervalCountTotal += coveredBands.size;

    perDraw.push({
      no: d.no,
      date: d.date,
      nums: d.nums,
      sum: d.nums.reduce((a, b) => a + b, 0),
      pares,
      impares,
      pequenos,
      grandes,
      calientes,
      frios,
      intervalsCubiertos: coveredBands.size,
      intervalosFaltantes: bands.length - coveredBands.size,
      bandas: [...coveredBands].sort((a, b) => a - b),
      repetidos,
      bilaterales,
      consecutivos,
    });
  }

  const sums = perDraw.map((x) => x.sum);
  const sMean = mean(sums);
  const sMedian = median(sums);
  const sP10 = pct(sums, 10);
  const sP90 = pct(sums, 90);
  const sStd = stdev(sums);

  // Pendulum: probabilidad empírica de que la suma suba/baje según la banda actual.
  const pendulo = [];
  const bandsSum = [
    { label: `Baja (< ${sP10})`, test: (s) => s < sP10, dir: 'sube' },
    { label: `Normal alta`, test: (s) => s >= sP10 && s <= sP90 },
    { label: `Alta (> ${sP90})`, test: (s) => s > sP90, dir: 'baja' },
  ];
  for (const b of bandsSum) {
    const idx = perDraw.map((x) => x.sum).map((s, i) => ({ i, s })).filter((x) => b.test(x.s));
    let up = 0;
    let dn = 0;
    let st = 0;
    for (const { i } of idx) {
      if (i + 1 >= total) continue;
      const next = perDraw[i + 1].sum;
      if (next > perDraw[i].sum) up++;
      else if (next < perDraw[i].sum) dn++;
      else st++;
    }
    const cm = up + dn;
    pendulo.push({
      label: b.label,
      dirSugerida: b.dir,
      casos: cm,
      probSube: cm ? (up / cm) * 100 : null,
      probBaja: cm ? (dn / cm) * 100 : null,
    });
  }

  return {
    bandas: bands.map(([a, z]) => `${a}-${z}`),
    perDraw,
    distribution: {
      n: sums.length,
      mean: sMean,
      median: sMedian,
      p10: sP10,
      p90: sP90,
      std: sStd,
      min: Math.min(...sums),
      max: Math.max(...sums),
      last: sums[sums.length - 1],
      last3: sums.slice(-3),
    },
    pendulo,
    promedios: {
      pares: mean(perDraw.map((x) => x.pares)),
      impares: mean(perDraw.map((x) => x.impares)),
      pequenos: mean(perDraw.map((x) => x.pequenos)),
      grandes: mean(perDraw.map((x) => x.grandes)),
      repetidos: mean(perDraw.map((x) => x.repetidos)),
      bilaterales: mean(perDraw.map((x) => x.bilaterales)),
      consecutivos: mean(perDraw.map((x) => x.consecutivos)),
      intervalos: mean(perDraw.map((x) => x.intervalsCubiertos)),
      calientes: mean(perDraw.map((x) => x.calientes)),
      frios: mean(perDraw.map((x) => x.frios)),
    },
  };
}

/** Estado resumido para la predicción. */
export function buildState(game) {
  const numbers = analyzeNumbers(game);
  const collective = analyzeCollective(game);
  const last = game.draws[game.draws.length - 1];
  const prev = game.draws[game.draws.length - 2];

  const bilateralesUltimo = new Set();
  for (const n of last.nums) {
    if (n - 1 >= game.cfg.min) bilateralesUltimo.add(n - 1);
    if (n + 1 <= game.cfg.max) bilateralesUltimo.add(n + 1);
  }
  const bandasAbsentesUltimo = intervalsFor(game.cfg)
    .map((b, i) => ({ b, i }))
    .filter(({ b }) => !last.nums.some((n) => n >= b[0] && n <= b[1]))
    .map(({ i }) => i);

  return {
    game,
    numbers,
    collective,
    lastDraw: last,
    prevDraw: prev,
    bilateralesUltimo: [...bilateralesUltimo].sort((a, b) => a - b),
    bandasAbsentesUltimo,
    total: game.draws.length,
  };
}

export { mean, median, pct, stdev };