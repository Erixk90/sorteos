import { buildState } from './engine.js';
import { isPaired, isSmall, bandOf } from './loader.js';
import { sistemaProporcional, sistemaNumeroFijo, combinaciones, hits } from './combinatorics.js';
import { summarizeIndicators } from './indicators.js';

// ============================================================================
// scoring.js — Modelo de puntuación heurístico basado en los patrones del
// documento. Genera ranking de números y combinaciones recomendadas, y permite
// validar con backtest walk-forward (solo con datos anteriores a cada sorteo).
// ============================================================================

export const WEIGHTS = {
  freq: 1.0,        // frecuencia histórica normalizada
  hot: 2.0,         // 2+ en últimas 10 y 1+ en últimas 5
  cold: 0.3,        // contribución del "1 frío" de la regla 80/20
  farol: -3.0,      // 20+ sorteos sin salir → NO apostar
  despertar: 1.2,   // salió tras 17+ sin salir y podría repetir
  impulso: 1.5,     // intervalos decrecientes → calentando
  inercia: -1.5,    // intervalos crecientes → dormido
  doblete: 1.0,     // último intervalo repite → tercera aparición
  triple: 2.0,      // tres intervalos iguales → cuarta aparición
  estrella: 0.8,    // aparece cada ~5 sorteos → candidato a número fijo
  recencia: 0.35,   // apariciones en las últimas 5
  parePompe: 0.5,   // presente en el sorteo anterior (regla "incluir 1 repetido")
};

export const CONSTRAINT_PENALTY = 0.001;

function targetSumRange(state) {
  const d = state.collective.distribution;
  const last = d.last;
  // Señal de péndulo: extremos tienden a compensarse.
  let dir = 0;
  if (last > d.p90) dir = -1;   // suma alta → próxima baja
  else if (last < d.p10) dir = 1; // suma baja → próxima sube

  const center = (d.p10 + d.p90) / 2;
  return { d, dir, center };
}

export function scoreNumbers(state) {
  const { numbers, game } = state;
  const { d, dir } = targetSumRange(state);
  const total = state.total;
  const rated = numbers.map((x) => {
    let s = 0;
    s += WEIGHTS.freq * (100 * x.count / total);
    if (x.isHot) s += WEIGHTS.hot;
    if (x.isCold) s += WEIGHTS.cold;
    if (x.farol) s += WEIGHTS.farol;
    if (x.despertar || x.despertarReady) s += WEIGHTS.despertar;
    if (x.impulso) s += WEIGHTS.impulso;
    if (x.inercia) s += WEIGHTS.inercia;
    if (x.doblete) s += WEIGHTS.doblete;
    if (x.triple) s += WEIGHTS.triple;
    if (x.estrella) s += WEIGHTS.estrella;
    s += WEIGHTS.recencia * x.last5;

    const lastDraw = state.lastDraw;
    if (lastDraw.nums.includes(x.num)) s += WEIGHTS.parePompe;

    // Distancia del centro de la banda 80%: números que acercan la suma ideal.
    const distCenter = Math.abs(d.mean - x.num) / d.std;
    s += -0.15 * distCenter;

    return { ...x, score: s, razones: buildReasons(x) };
  });

  rated.sort((a, b) => b.score - a.score);
  return { rated, dir, distribution: d };
}

function buildReasons(x) {
  const r = [];
  if (x.isHot) r.push('🔥 Caliente (2+ en últimas 10, 1+ en últimas 5)');
  if (x.isCold) r.push('❄️ Frío (0 en últimas 10) → candidato al 80/20');
  if (x.farol) r.push('🚨 FAROL (20+ sorteos sin salir) → evitar');
  if (x.despertar) r.push('💤 Despertar (salió tras 17+ sin salir)');
  if (x.impulso) r.push('🚀 Impulso (intervalos decrecientes)');
  if (x.inercia) r.push('🐌 Inercia (intervalos crecientes)');
  if (x.doblete) r.push('🔁 Doblete (intervalo repetido)');
  if (x.triple) r.push('🔂 Triple (3 intervalos iguales)');
  if (x.estrella) r.push('⭐ Estrella (cada ~5 sorteos)');
  if (x.last5 > 0) r.push(`Repareció en ${x.last5} de las últimas 5`);
  if (r.length === 0) r.push('Sin patrón destacado');
  return r;
}

function comboScore(cand, state, dir) {
  const { lastDraw, bilateralesUltimo, bandasAbsentesUltimo } = state;
  const cfg = state.game.cfg;
  const d = state.collective.distribution;

  let s = cand.reduce((a, x) => a + x.score, 0);
  const pares = cand.filter((x) => isPaired(x.num, cfg)).length;
  const impares = 5 - pares;
  const pequenos = cand.filter((x) => isSmall(x.num, cfg)).length;
  const grandes = 5 - pequenos;
  const sum = cand.reduce((a, x) => a + x.num, 0);
  const nums = cand.map((x) => x.num);

  const constr = [];
  if (Math.abs(pares - impares) <= 1) { s += 1.5; constr.push(`${pares}P/${impares}I ideal`); }
  if (Math.abs(pequenos - grandes) <= 1) { s += 1.5; constr.push(`${pequenos}Peq/${grandes}Gr ideal`); }

  const hasBilat = nums.some((x) => bilateralesUltimo.includes(x));
  if (hasBilat) { s += 1.0; constr.push('≥1 bilateral del sorteo anterior'); }

  const hasAbsent = nums.some((x) => bandasAbsentesUltimo.includes(bandOf(x, cfg)));
  if (hasAbsent) { s += 0.8; constr.push(`compensa banda ausente [${state.collective.bandas[bandasAbsentesUltimo[0]] ?? '?'}]`); }

  const hotCount = cand.filter((x) => x.isHot).length;
  const coldCount = cand.filter((x) => x.isCold).length;
  if (hotCount >= 3 && hotCount <= 4) { s += 1.0; constr.push(`${hotCount} calientes (80/20)`); }
  if (coldCount === 1) { s += 0.5; constr.push('1 frío (80/20)'); }

  const hasRepeat = nums.some((x) => lastDraw.nums.includes(x));
  if (hasRepeat) { s += 0.5; constr.push('≥1 repetido del sorteo anterior'); }

  if (sum >= d.p10 && sum <= d.p90) { s += 1.0; constr.push(`suma=${sum} en banda 80%`); }
  else { s -= 0.5; constr.push(`suma=${sum} fuera de banda 80%`); }

  for (let i = 0; i < nums.length; i++) if (nums.includes(nums[i] + 1)) { s += 0.3; constr.push('tiene consecutivo'); break; }

  if (dir < 0 && sum < d.mean) s += 0.7;
  if (dir > 0 && sum > d.mean) s += 0.7;

  return { s: +s.toFixed(2), constr, pares, impares, pequenos, grandes, sum, hotCount };
}

export function recommendCombos(state, opts = {}) {
  const { rated, dir } = scoreNumbers(state);
  const { topN = 18, maxCombos = 10 } = opts;
  const cfg = state.game.cfg;

  const pool = rated.slice(0, topN);
  const ratedSet = new Map(rated.map((x) => [x.num, x]));

  const candidates = combinaciones(pool.map((x) => x.num), 5)
    .map((nums) => {
      const cand = nums.map((n) => ratedSet.get(n));
      const c = comboScore(cand, state, dir);
      return { nums, cand, ...c };
    })
    .filter((c) => Math.abs(c.pares - c.impares) <= 1 && Math.abs(c.pequenos - c.grandes) <= 1)
    .sort((a, b) => b.s - a.s);

  const topCombs = candidates.slice(0, maxCombos);

  const ochoTop = rated.slice(0, 8).map((x) => x.num);
  const proporcional = sistemaProporcional(ochoTop);
  const seis = rated.slice(1, 8).map((x) => x.num);
  const numFijo = sistemaNumeroFijo(ochoTop[0], seis);

  const flicks = rated.slice(0, 8);
  const total8 = combinaciones(flicks.map((x) => x.num), 5)
    .map((nums) => {
      const cand = nums.map((n) => ratedSet.get(n));
      const c = comboScore(cand, state, dir);
      return { nums, ...c };
    })
    .filter((c) => Math.abs(c.pares - c.impares) <= 1)
    .sort((a, b) => b.s - a.s)
    .slice(0, 20);

  return {
    ranking: rated,
    dirigir: dir,
    banda84: { p10: state.collective.distribution.p10, p90: state.collective.distribution.p90, mean: state.collective.distribution.mean },
    topCombos: topCombs,
    sistemaProporcional: { numeros: ochoTop, apuestas: proporcional },
    sistemaNumeroFijo: { fijo: ochoTop[0], variables: seis, apuestas: numFijo },
    sistemaTotal8: total8,
  };
}

// ============================================================================
// BACKTEST walk-forward: honesto, solo usa datos anteriores a cada sorteo.
// ============================================================================

export function backtest(game, opts = {}) {
  const { minTrain = 100, combosPorSorteo = 5, sorteos = 60 } = opts;
  const draws = game.draws;
  const start = Math.max(minTrain, draws.length - sorteos);
  const cfg = game.cfg;
  const totalCombos = [];
  let maxAny = 0;

  for (let t = start; t < draws.length; t++) {
    const trainGame = { name: game.name, cfg, draws: draws.slice(0, t) };
    const state = buildState(trainGame);
    const rec = recommendCombos(state, { topN: 18, maxCombos: combosPorSorteo });
    const result = draws[t].nums;

    let best = 0;
    for (const c of rec.topCombos) {
      const h = hits(c.nums, result);
      best = Math.max(best, h);
      totalCombos.push({ draw: t, combo: c.nums, hits: h, result });
    }
    maxAny = Math.max(maxAny, best);
  }

  const nDraws = draws.length - start;
  const combosTested = totalCombos.length;
  const bestDraws2plus = totalCombos.filter((x) => x.hits >= 2).length;
  const shot2plus = totalCombos.filter((x) => x.hits >= 2).length;
  const shot3plus = totalCombos.filter((x) => x.hits >= 3).length;
  const shot4plus = totalCombos.filter((x) => x.hits >= 4).length;
  const shot5 = totalCombos.filter((x) => x.hits === 5).length;

  return {
    juego: game.name,
    sorteosEvaluados: nDraws,
    combosTotal: combosTested,
    combosPorSorteo,
    metricas: [
      { label: '≥2 aciertos (premio 4º) por combo', modelo: (shot2plus / combosTested) * 100, azar: hitsProb(cfg.max, 2) },
      { label: '≥3 aciertos (premio 3º) por combo', modelo: (shot3plus / combosTested) * 100, azar: hitsProb(cfg.max, 3) },
      { label: '≥4 aciertos (premio 2º) por combo', modelo: (shot4plus / combosTested) * 100, azar: hitsProb(cfg.max, 4) },
      { label: '5 aciertos (premio mayor) por combo', modelo: (shot5 / combosTested) * 100, azar: hitsProb(cfg.max, 5) },
    ],
    mejorRachaCombo: bestDraws2plus,
    maxAciertoIgnorado: maxAny,
  };
}

/** Probabilidad de acertar ≥ k números jugando 5 de 1..N (dist. hipergeométrica). */
export function hitsProb(N, k = 2) {
  const comb = (a, b) => {
    if (b < 0 || b > a) return 0;
    let r = 1;
    for (let i = 0; i < b; i++) r *= (a - i) / (i + 1);
    return r;
  };
  let p = 0;
  for (let i = k; i <= 5; i++) p += (comb(5, i) * comb(N - 5, 5 - i)) / comb(N, 5);
  return p * 100;
}

/** Próximas fechas de sorteo MiLoto (Lun, Mar, Jue, Vie). */
export function nextMilotoDraws(from = new Date(), count = 5) {
  return nextGameDates([1, 2, 4, 5], from, count);
}

/** Próximas fechas de sorteo Baloto (Lun, Mié, Sáb). */
export function nextBalotoDraws(from = new Date(), count = 5) {
  return nextGameDates([1, 3, 6], from, count);
}

function nextGameDates(weekdays, from, count) {
  const out = [];
  const d = new Date(from);
  const jsDayNow = d.getDay(); // 0=Dom
  const dayIdxNow = jsDayNow === 0 ? 7 : jsDayNow;
  const drawHoy = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 22, 15);
  if (weekdays.includes(dayIdxNow) && d.getTime() < drawHoy.getTime()) {
    out.push(drawHoy);
  }
  d.setDate(d.getDate() + 1);
  while (out.length < count) {
    const jsDay = d.getDay(); // 0=Dom
    const dayIdx = jsDay === 0 ? 7 : jsDay;
    if (weekdays.includes(dayIdx)) {
      out.push(new Date(d));
    }
    d.setDate(d.getDate() + 1);
  }
  return out;
}