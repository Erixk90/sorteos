import { summarizeIndicators } from './indicators.js';
import { combinaciones } from './combinatorics.js';
import { scoreNumbers } from './scoring.js';
import { isPaired, isSmall } from './loader.js';

// ============================================================================
// gatillos.js — Tres "gatillos" independientes que producen combinaciones:
//   1) PÉNDULO      → usa la distribución de sumas (P10/P90 + dirección).
//   2) INDICADORES  → usa velas + osciladores de trading sobre la serie de sumas.
//   3) COMBINADO    → mezcla péndulo + indicadores.
// Cada gatillo rankea combinaciones por cercanía a su "suma objetivo" y devuelve
// las 15 más fuertes, para poder compararlas.
// ============================================================================

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

function targetPendulo(dist) {
  let dir = 0;
  if (dist.last > dist.p90) dir = -1;      // suma alta → tiende a bajar
  else if (dist.last < dist.p10) dir = 1;  // suma baja → tiende a subir
  const target = dist.mean + dir * 0.25 * dist.std;
  const explicacion = dir === -1
    ? `La última suma (${dist.last}) > P90 (${dist.p90}): el péndulo apunta a BAJAR hacia la media.`
    : dir === 1
      ? `La última suma (${dist.last}) < P10 (${dist.p10}): el péndulo apunta a SUBIR hacia la media.`
      : `La última suma (${dist.last}) está en banda normal: el péndulo apunta a la media.`;
  return { dir, target, explicacion };
}

function analizarIndicadores(sums) {
  const ind = summarizeIndicators(sums);
  const votos = [];
  const add = (nombre, voto) => { if (voto) votos.push({ nombre, voto }); };

  if (ind.rsi != null) add(`RSI ${ind.rsi.toFixed(0)}`, ind.rsi > 70 ? -1 : ind.rsi < 30 ? 1 : 0);
  if (ind.estocastico) add(`Estocástico %K ${ind.estocastico.k.toFixed(0)}`, ind.estocastico.k > 80 ? -1 : ind.estocastico.k < 20 ? 1 : 0);
  if (ind.ma?.cruce) add(`Medias: ${ind.ma.cruce}`, ind.ma.cruce.startsWith('Alcista') ? 1 : ind.ma.cruce.startsWith('Bajista') ? -1 : 0);
  if (ind.macd?.cruce) add(`MACD: ${ind.macd.cruce}`, ind.macd.cruce.startsWith('Alcista') ? 1 : ind.macd.cruce.startsWith('Bajista') ? -1 : 0);
  if (ind.bollinger) {
    const lo = ind.bollinger.lower;
    const up = ind.bollinger.upper;
    add('Bollinger', sums[sums.length - 1] <= lo ? 1 : sums[sums.length - 1] >= up ? -1 : 0);
  }
  if (ind.pivots) add('Pivots (sobre P=alcista)', sums[sums.length - 1] > ind.pivots.pivot ? 1 : -1);

  const bullish = ['Envolvente alcista', 'Tres soldados blancos', 'Martillo'];
  const bearish = ['Envolvente bajista', 'Tres cuervos negros', 'Estrella fugaz', 'Hombre colgado'];
  for (const p of ind.patronesVela) {
    if (bullish.includes(p)) add(`Vela: ${p}`, 1);
    if (bearish.includes(p)) add(`Vela: ${p}`, -1);
  }

  const net = votos.reduce((a, v) => a + v.voto, 0);
  const dir = net > 0 ? 1 : net < 0 ? -1 : 0;
  const target = sums[sums.length - 1] + net * 0.15 * (ind.atr || 30);
  const explicacion = votos.length
    ? `Señales: ${votos.map((v) => `${v.nombre} ${v.voto > 0 ? '↑' : '↓'}`).join(' · ')}. Balance ${net > 0 ? '+' : ''}${net}.`
    : 'Sin señales claras de los indicadores (mercado lateral).';
  return { dir, target, net, votos, explicacion, ind };
}

/** Genera las 15 combinaciones más fuertes para una suma objetivo. */
function combosParaTarget(state, target, poolN = 16) {
  const cfg = state.game.cfg;
  const d = state.collective.distribution;
  const { rated } = scoreNumbers(state);
  const pool = rated.slice(0, poolN);
  const ratedSet = new Map(rated.map((x) => [x.num, x]));
  const t = clamp(target, d.min, d.max);

  const cands = combinaciones(pool.map((x) => x.num), 5).map((nums) => {
    const cand = nums.map((n) => ratedSet.get(n));
    const sum = nums.reduce((a, b) => a + b, 0);
    const pares = nums.filter((n) => isPaired(n, cfg)).length;
    const impares = 5 - pares;
    const pequenos = nums.filter((n) => isSmall(n, cfg)).length;
    const grandes = 5 - pequenos;

    let s = 0;
    s += -Math.abs(sum - t) / d.std * 3.0;
    if (sum >= d.p10 && sum <= d.p90) s += 1.0;
    if (Math.abs(pares - impares) <= 1) s += 1.0;
    if (Math.abs(pequenos - grandes) <= 1) s += 0.8;
    s += cand.reduce((a, x) => a + x.score, 0) * 0.05;
    return { nums, sum, pares, impares, pequenos, grandes, s: +s.toFixed(2) };
  });

  cands.sort((a, b) => b.s - a.s);
  return cands.slice(0, 15);
}

export function analizarGatillos(state) {
  const sums = state.collective.perDraw.map((x) => x.sum);
  const d = state.collective.distribution;

  const pen = targetPendulo(d);
  const ind = analizarIndicadores(sums);
  const combTarget = (pen.target + ind.target) / 2;

  const mk = (nombre, icono, dir, target, explicacion) => ({
    nombre,
    icono,
    dir,
    target: +target.toFixed(0),
    explicacion,
    combos: combosParaTarget(state, target),
  });

  return {
    pendulo: mk('Gatillo 1 · Péndulo', '⚖️', pen.dir, pen.target, pen.explicacion),
    indicadores: mk('Gatillo 2 · Indicadores de trading', '📈', ind.dir, ind.target, ind.explicacion),
    combinado: mk('Gatillo 3 · Combinado (péndulo + indicadores)', '🎯', pen.dir + ind.dir, combTarget,
      `Mezcla de ambos: objetivo ${((pen.target + ind.target) / 2).toFixed(0)} (péndulo ${pen.target.toFixed(0)} + indicadores ${ind.target.toFixed(0)}).`),
  };
}
