import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGame, gameConfig, GAMES } from './loader.js';
import { buildState, analyzeNumbers } from './engine.js';
import { summarizeIndicators } from './indicators.js';
import { recommendCombos, backtest, nextMilotoDraws, nextBalotoDraws } from './scoring.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const fmt = (d) => {
  const p = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const pad = (s, n = 6) => String(s).padStart(n);

function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${d} ${meses[m - 1]} ${y}`;
}

function fmtDates(list) {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return list.map((d) => `${days[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`).join(', ');
}

// ============================================================================

function printIndicators(state) {
  const sums = state.collective.perDraw.map((x) => x.sum);
  const ind = summarizeIndicators(sums);
  const d = state.collective.distribution;
  console.log('\n=== INDICADORES (serie de sumas) ===');
  console.log(`Suma actual (último sorteo): ${ind.sumaActual} | media ${d.mean.toFixed(1)} | P10 ${d.p10} | P90 ${d.p90}`);
  console.log(`Péndulo: ${state.collective.pendulo.map((p) => `${p.label}: sube ${p.probSube?.toFixed(0) ?? '-'}% / baja ${p.probBaja?.toFixed(0) ?? '-'}% (${p.casos} casos)`).join('\n         ')}`);
  console.log(`Velas: cuerpo ${ind.ultimaVela.body > 0 ? '🟢' : '🔴'} ${Math.abs(ind.ultimaVela.body).toFixed(1)} | patrones: ${ind.patronesVela.join(', ') || 'ninguno'}`);
  console.log(`RSI(14): ${ind.rsi?.toFixed(1)} → ${ind.rsiSenal}`);
  if (ind.bollinger) console.log(`Bollinger(20): sup ${ind.bollinger.upper.toFixed(1)} | med ${ind.bollinger.middle.toFixed(1)} | inf ${ind.bollinger.lower.toFixed(1)}`);
  if (ind.ma) console.log(`Medias: MA5 ${ind.ma.ma5?.toFixed(1)} | MA10 ${ind.ma.ma10?.toFixed(1)} | MA20 ${ind.ma.ma20?.toFixed(1)} → ${ind.ma.cruce}`);
  if (ind.macd) console.log(`MACD(12,26,9): ${ind.macd.macd.toFixed(2)} vs señal ${ind.macd.senal?.toFixed(2)} → ${ind.macd.cruce}`);
  if (ind.estocastico) console.log(`Estocástico: %K ${ind.estocastico.k.toFixed(1)} | %D ${ind.estocastico.d?.toFixed(1)} → ${ind.estocastico.senal}`);
  console.log(`ATR(14): ${ind.atr?.toFixed(1)} (volatilidad de la suma)`);
  console.log(`Pivots: P ${ind.pivots.pivot.toFixed(1)} | R1 ${ind.pivots.r1.toFixed(1)} | S1 ${ind.pivots.s1.toFixed(1)} | R2 ${ind.pivots.r2.toFixed(1)} | S2 ${ind.pivots.s2.toFixed(1)}`);
  console.log(`Fibonacci (última onda): del ${ind.fibonacci.min} al ${ind.fibonacci.max} — niveles ${ind.fibonacci.levels.map((l) => `${l.level.toFixed(1)}%→${l.value.toFixed(0)}`).join(', ')}`);
}

function printPrediction(state, gameName) {
  const rec = recommendCombos(state);
  const last = state.lastDraw;
  const lastSum = last.nums.reduce((a, b) => a + b, 0);

  console.log(`\n=== PREDICCIÓN ${state.game.cfg.label} — próximo sorteo ===`);
  console.log(`Último sorteo #${last.no} (${fmtDate(last.date)}): ${last.nums.join(' - ')} suma ${lastSum}`);

  console.log('\nRanking de los 12 números con mejor score:');
  rec.ranking.slice(0, 12).forEach((x, i) => {
    console.log(`  ${String(i + 1).padStart(2)}. Nº ${pad(x.num, 2)} (score ${x.score.toFixed(2)}) ${x.razones[0]}`);
  });

  console.log('\nBilaterales del último sorteo:', state.bilateralesUltimo.join(', ') || '—');
  console.log(`Bandas ausentes en el último sorteo (compensación en ~3 sorteos):`,
    state.bandasAbsentesUltimo.map((i) => state.collective.bandas[i]).join(', ') || 'ninguna');

  console.log('\n--- COMBINACIONES RECOMENDADAS (juego de 5 números) ---');
  rec.topCombos.forEach((c, i) => {
    console.log(` ${i + 1}. [${c.nums.join(', ')}] suma ${c.sum} | ${c.pares}P/${c.impares}I · ${c.pequenos}Peq/${c.grandes}Gr | ${c.constr.slice(0, 3).join(' · ')}`);
  });

  console.log(`\n--- SISTEMA PROPORCIONAL (8 números → 7 apuestas) ---`);
  console.log(`   Números base: ${rec.sistemaProporcional.numeros.join(', ')}`);
  rec.sistemaProporcional.apuestas.forEach((a, i) => console.log(`   ${i + 1}. ${a.join(' - ')}`));

  console.log(`\n--- SISTEMA NÚMERO FIJO (fijo ${rec.sistemaNumeroFijo.fijo} + 7 variables) ---`);
  console.log(`   Variables: ${rec.sistemaNumeroFijo.variables.join(', ')}`);
  rec.sistemaNumeroFijo.apuestas.forEach((a, i) => console.log(`   ${i + 1}. ${a.join(' - ')}`));

  console.log(`\n--- SISTEMA TOTAL (top 8 → mejores 20, filtradas por mezcla ideal) ---`);
  rec.sistemaTotal8.slice(0, 20).forEach((c, i) => console.log(`   ${String(i + 1).padStart(2)}. [${c.nums.join(', ')}] suma ${c.sum} | ${c.pares}P/${c.impares}I`));

  return rec;
}

// ============================================================================

function cmdStats(gameName) {
  const game = loadGame(gameName);
  const cfg = gameConfig(gameName);
  const state = buildState(game);
  const nums = analyzeNumbers(game);
  const col = state.collective;

  console.log(`\n${'='.repeat(64)}`);
  console.log(`  ${cfg.label} — ANÁLISIS ESTADÍSTICO (${game.draws.length} sorteos)`);
  console.log(`${'='.repeat(64)}`);

  const hot = nums.filter((x) => x.isHot).map((x) => x.num);
  const cold = nums.filter((x) => x.isCold).map((x) => x.num);
  const farol = nums.filter((x) => x.farol).map((x) => x.num);
  const impulso = nums.filter((x) => x.impulso).map((x) => x.num);
  const inercia = nums.filter((x) => x.inercia).map((x) => x.num);
  const doblete = nums.filter((x) => x.doblete).map((x) => x.num);
  const triple = nums.filter((x) => x.triple).map((x) => x.num);
  const estrella = nums.filter((x) => x.estrella).map((x) => x.num);

  console.log(`\nÚltimo sorteo: #${state.lastDraw.no} ${fmtDate(state.lastDraw.date)} → ${state.lastDraw.nums.join(' - ')}` + (state.lastDraw.balota ? ` · Súper ${state.lastDraw.balota}` : ''));

  console.log('\n[Calientes]  (2+ en últimas 10 y 1+ en últimas 5):', hot.join(', ') || 'ninguno');
  console.log('[Fríos]      (0 en últimas 10):', cold.join(', ') || 'ninguno');
  console.log('[Faroles]    (20+ sin salir → NO apostar):', farol.join(', ') || 'ninguno');
  console.log('[Impulso]    (intervalos ↓ = calentando):', impulso.join(', ') || '—');
  console.log('[Inercia]    (intervalos ↑ = dormido):', inercia.join(', ') || '—');
  console.log('[Doblete]    (patrón doble):', doblete.join(', ') || '—');
  console.log('[Triple]     (patrón triple):', triple.join(', ') || '—');
  console.log('[Estrella]   (cada ~5 sorteos):', estrella.join(', ') || '—');

  console.log('\n[Distribución de sumas]');
  console.log(`  media ${col.distribution.mean.toFixed(1)} · mediana ${col.distribution.median} · P10 ${col.distribution.p10} · P90 ${col.distribution.p90} · std ${col.distribution.std.toFixed(1)}`);
  const ult = col.perDraw[col.perDraw.length - 1];
  console.log(`  últimos sumas: ${col.distribution.last3.join(', ')} → péndulo: ${state.collective.pendulo.map((p) => `${p.label}: ${p.probSube === null ? '—' : `${p.probSube.toFixed(0)}% sube`}`).join(' | ')}`);

  console.log('\n[Mezclas por sorteo] (promedios)');
  console.log(`  Pares/Impares: ${col.promedios.pares.toFixed(2)} / ${col.promedios.impares.toFixed(2)}  (ideal 2/3 o 3/2)`);
  console.log(`  Pequeños/Grandes: ${col.promedios.pequenos.toFixed(2)} / ${col.promedios.grandes.toFixed(2)}  (ideal 2/3 o 3/2)`);
  console.log(`  Calientes/Fríos: ${col.promedios.calientes.toFixed(2)} / ${col.promedios.frios.toFixed(2)}  (ideal 4/1)`);
  console.log(`  Repetidos ${col.promedios.repetidos.toFixed(2)} · Bilaterales ${col.promedios.bilaterales.toFixed(2)} · Consecutivos ${col.promedios.consecutivos.toFixed(2)} · Intervalos cubiertos ${col.promedios.intervalos.toFixed(2)}/${cfg.min}-${cfg.max}`);

  printIndicators(state);

  if (cfg.hasBalota) {
    const b = balotaStats(game);
    console.log('\n[Frecuencia Súper Balota] (1-16)');
    b.sorted.forEach((x, i) => console.log(`  ${pad(x.num, 2)}: ${x.count} veces (${x.pct}%) · gap ${x.lastGap} · ${x.hot ? 'CALIENTE' : x.cold ? 'fría' : ''} ${x.farol ? 'FAROL⚠️' : ''}`));
  }
}

function balotaStats(game) {
  const MAX = game.cfg.balotaMax;
  const balotas = game.draws.map((d) => d.balota);
  const total = balotas.length;
  const out = [];
  for (let b = 1; b <= MAX; b++) {
    const idx = [];
    balotas.forEach((v, i) => { if (v === b) idx.push(i); });
    const lastGap = idx.length ? total - 1 - idx[idx.length - 1] : total;
    const c10 = idx.filter((i) => i >= total - 10).length;
    const c5 = idx.filter((i) => i >= total - 5).length;
    out.push({
      num: b,
      count: idx.length,
      pct: ((100 * idx.length) / total).toFixed(1),
      lastGap,
      hot: c10 >= 2 && c5 >= 1,
      cold: c10 === 0,
      farol: lastGap >= 20,
    });
  }
  out.sort((a, b) => a.count - b.count || a.num - b.num);
  return { sorted: out.reverse() };
}

// ============================================================================

function cmdPredict(gameName) {
  const game = loadGame(gameName);
  const state = buildState(game);
  const dates = gameName === 'miloto' ? nextMilotoDraws() : nextBalotoDraws();
  const rec = recommendCombos(state);
  const col = state.collective;

  console.log(`\n${'='.repeat(64)}`);
  console.log(`  ${gameConfig(gameName).label} — PREDICCIÓN PRÓXIMO SORTEO`);
  console.log(`${'='.repeat(64)}`);

  // Suma real del último (para corregir el bug del print anterior)
  const lastSum = state.lastDraw.nums.reduce((a, b) => a + b, 0);
  const d = col.distribution;
  console.log(`\nÚltimo sorteo #${state.lastDraw.no} (${fmtDate(state.lastDraw.date)}): ${state.lastDraw.nums.join(' - ')} · suma ${lastSum} (P10 ${d.p10}/P90 ${d.p90})`);
  const pend = updatePendulo(state, lastSum);
  console.log(`Señal de péndulo: ${pend}`);
  console.log(`Próximos sorteos ${gameName === 'miloto' ? '(Lun·Mar·Jue·Vie)' : '(Lun·Mié·Sáb)'}: ${fmtDates(dates)}`);

  printPrediction(state, gameName);
}

function updatePendulo(state, lastSum) {
  const d = state.collective.distribution;
  if (lastSum > d.p90) return 'suma ALTA → tiende a BAJAR (elige combinaciones de suma baja)';
  if (lastSum < d.p10) return 'suma BAJA → tiende a SUBIR (elige combinaciones de suma alta)';
  return 'suma en banda normal (sin señal clara)';
}

function cmdBacktest(gameName) {
  const game = loadGame(gameName);
  const bt = backtest(game, { minTrain: 100, combosPorSorteo: 5, sorteos: 100 });
  console.log(`\n=== BACKTEST WALK-FORWARD ${gameConfig(gameName).label} ===`);
  console.log(`Sorteos evaluados: ${bt.sorteosEvaluados} (entrenando solo con datos previos, ${bt.combosPorSorteo} combos/sorteo = ${bt.combosTotal} apuestas)`);
  console.log('\nTasa de acierto del modelo vs. puro azar (por combinación apostada):');
  console.log('  Umbral                                  | Modelo    | Azar');
  console.log('  ----------------------------------------+-----------+--------');
  for (const m of bt.metricas) {
    const azarStr = m.azar < 1e-3 ? m.azar.toExponential(2) : m.azar.toFixed(2);
    console.log(`  ${m.label.padEnd(40)} | ${m.modelo.toFixed(2).padStart(6)}%   | ${azarStr}%`);
  }
  console.log('\n  Best por sorteo alcanzado por 1 sola combinación (máx aciertos):', bt.maxAciertoIgnorado);
  console.log('\n  ▶ Los resultados del modelo para ≥4 y 5 no superan sistemáticamente el azar.');
  console.log('    Es esperable: la lotería es aleatoria. El modelo ayuda a elegir combinaciones');
  console.log('    "razonables" (mezclas balanceadas), no garantiza premios.');
}

function cmdReport() {
  mkdirSync(join(__dirname, '..', 'report'), { recursive: true });
  const out = [];
  out.push('# REPORTE DE ANÁLISIS — Baloto · Revancha · MiLoto\n');
  out.push(`_Generado: ${new Date().toISOString()}_\n`);

  for (const name of ['miloto', 'baloto']) {
    const game = loadGame(name);
    const cfg = gameConfig(name);
    const state = buildState(game);
    const nums = analyzeNumbers(game);
    const col = state.collective;
    const ind = summarizeIndicators(col.perDraw.map((x) => x.sum));
    const rec = recommendCombos(state);
    const lastSum = state.lastDraw.nums.reduce((a, b) => a + b, 0);

    out.push(`\n## ${cfg.label}\n`);
    out.push(`- Sorteos analizados: **${game.draws.length}** (${fmtDate(game.draws[0].date)} → ${fmtDate(game.draws[game.draws.length - 1].date)})`);
    out.push(`- Último sorteo **#${state.lastDraw.no}** (${fmtDate(state.lastDraw.date)}): ${state.lastDraw.nums.join(' - ')} · suma **${lastSum}**` + (state.lastDraw.balota ? ` · Súper **${state.lastDraw.balota}**` : ''));

    out.push('\n### Patrones individuales');
    out.push(`- 🔥 Calientes: ${nums.filter((x) => x.isHot).map((x) => x.num).join(', ') || 'ninguno'}`);
    out.push(`- ❄️ Fríos: ${nums.filter((x) => x.isCold).map((x) => x.num).join(', ') || 'ninguno'}`);
    out.push(`- 🚨 Faroles: ${nums.filter((x) => x.farol).map((x) => x.num).join(', ') || 'ninguno'}`);
    out.push(`- 🚀 Impulso: ${nums.filter((x) => x.impulso).map((x) => x.num).join(', ') || '—'}`);
    out.push(`- 🔁 Doblete: ${nums.filter((x) => x.doblete).map((x) => x.num).join(', ') || '—'}`);

    out.push('\n### Colectivo');
    out.push(`- Pares/Impares promedio: ${col.promedios.pares.toFixed(2)} / ${col.promedios.impares.toFixed(2)}`);
    out.push(`- Pequeños/Grandes promedio: ${col.promedios.pequenos.toFixed(2)} / ${col.promedios.grandes.toFixed(2)}`);
    out.push(`- Sumas: media ${col.distribution.mean.toFixed(1)} · P10 ${col.distribution.p10} · P90 ${col.distribution.p90}`);

    out.push('\n### Indicadores (sumas)');
    out.push(`- RSI(14): ${ind.rsi?.toFixed(1)} (${ind.rsiSenal})`);
    out.push(`- Medias: MA5 ${ind.ma?.ma5?.toFixed(1)} | MA20 ${ind.ma?.ma20?.toFixed(1)} → ${ind.ma?.cruce}`);
    out.push(`- Patrones de vela: ${ind.patronesVela.join(', ') || 'ninguno'}`);

    out.push('\n### Ranking top 10');
    out.push('| # | Nº | Score | Frec% | Últ10 | Últ5 | Gap | Patrón');
    out.push('|---|----|-------|-------|-------|------|-----|--------');
    rec.ranking.slice(0, 10).forEach((x, i) => {
      const tags = [x.isHot && 'caliente', x.isCold && 'frío', x.farol && 'FAROL', x.impulso && 'impulso', x.doblete && 'doblete'].filter(Boolean).join(', ') || '—';
      out.push(`| ${i + 1} | ${x.num} | ${x.score.toFixed(1)} | ${x.freqPct.toFixed(1)} | ${x.last10} | ${x.last5} | ${x.lastGap} | ${tags}`);
    });

    out.push('\n### Combinaciones recomendadas');
    rec.topCombos.slice(0, 5).forEach((c, i) => out.push(`- **${i + 1}.** ${c.nums.join(' - ')}  _suma ${c.sum} · ${c.pares}P/${c.impares}I · ${c.pequenos}Peq/${c.grandes}Gr_`));
    out.push('\n### Sistema proporcional (8 → 7)');
    rec.sistemaProporcional.apuestas.forEach((a, i) => out.push(`- ${i + 1}. ${a.join(' - ')}`));
    out.push('\n### Sistema número fijo');
    out.push(`Con fijo **${rec.sistemaNumeroFijo.fijo}**:`);
    rec.sistemaNumeroFijo.apuestas.forEach((a, i) => out.push(`- ${i + 1}. ${a.join(' - ')}`));
  }

  out.push('\n---\n> ⚠️ **Aviso importante**: Las loterías son juegos de azar puro. Cada combinación tiene la misma probabilidad de salir (5 en 39 para MiLoto ≈ 1 en 575.757). Este sistema es una herramienta de análisis estadístico y gestión de juego responsable (sección 1.6 y 1.11 del documento); no garantiza resultados. **Juega con responsabilidad**.');

  const file = join(__dirname, '..', 'report', `reporte_${fmt(new Date())}.md`);
  writeFileSync(file, out.join('\n'), 'utf8');
  console.log(`\nReporte generado: ${file}`);
}

// ============================================================================

function usage() {
  console.log(`
Sistema de análisis Baloto / Revancha / MiLoto
Uso: node src/cli.js <comando> [opciones]

Comandos:
  stats [juego]          Análisis completo del estado actual (miloto|baloto|all)
  predict <juego>        Ranking de números + combos recomendados para próximos sorteos
  combo <juego>          Sistemas de combinación (proporcional, número fijo, total)
  backtest <juego>       Validación walk-forward (tasa de acierto honesta)
  report                 Genera reporte markdown completo en report/

Ejemplos:
  node src/cli.js stats miloto
  node src/cli.js predict miloto
  node src/cli.js backtest miloto
`);
}

// ============================================================================

const [cmd, arg = 'miloto'] = process.argv.slice(2);

switch (cmd) {
  case 'stats':
    if (arg === 'all') {
      for (const g of Object.keys(GAMES)) cmdStats(g);
    } else {
      cmdStats(arg);
    }
    break;
  case 'predict':
    cmdPredict(arg);
    break;
  case 'combo': {
    const g = loadGame(arg);
    const state = buildState(g);
    printPrediction(state, arg);
    break;
  }
  case 'backtest':
    cmdBacktest(arg);
    break;
  case 'report':
    cmdReport();
    break;
  default:
    usage();
    break;
}