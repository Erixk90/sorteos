import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadGame, gameConfig, GAMES } from '../src/loader.js';
import { buildState, analyzeNumbers } from '../src/engine.js';
import { summarizeIndicators } from '../src/indicators.js';
import { recommendCombos, backtest, nextMilotoDraws, nextBalotoDraws } from '../src/scoring.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB = join(__dirname, '..', 'web');

function pad(n = 2) { return String(n).padStart(2, '0'); }
const fmtLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function buildGameData(name) {
  const game = loadGame(name);
  const cfg = gameConfig(name);
  const state = buildState(game);
  const col = state.collective;
  const nums = analyzeNumbers(game);
  const lastSum = state.lastDraw.nums.reduce((a, b) => a + b, 0);
  const ind = summarizeIndicators(col.perDraw.map((x) => x.sum));
  const rec = recommendCombos(state);
  const bt = backtest(game, { minTrain: 100, combosPorSorteo: 5, sorteos: 100 });

  const flags = {
    hot: nums.filter((x) => x.isHot).map((x) => x.num),
    cold: nums.filter((x) => x.isCold).map((x) => x.num),
    farol: nums.filter((x) => x.farol).map((x) => x.num),
    impulso: nums.filter((x) => x.impulso).map((x) => x.num),
    inercia: nums.filter((x) => x.inercia).map((x) => x.num),
    doblete: nums.filter((x) => x.doblete).map((x) => x.num),
    triple: nums.filter((x) => x.triple).map((x) => x.num),
    estrella: nums.filter((x) => x.estrella).map((x) => x.num),
  };

  return {
    label: cfg.label,
    range: `${cfg.min}-${cfg.max}`,
    draws: game.draws.length,
    desde: game.draws[0].date,
    ultimo: {
      no: state.lastDraw.no,
      fecha: state.lastDraw.date,
      nums: state.lastDraw.nums,
      balota: state.lastDraw.balota,
      suma: lastSum,
    },
    distrib: {
      mean: +col.distribution.mean.toFixed(1),
      median: col.distribution.median,
      p10: col.distribution.p10,
      p90: col.distribution.p90,
      std: +col.distribution.std.toFixed(1),
      last3: col.distribution.last3,
    },
    pendulo: col.pendulo.map((p) => ({
      label: p.label,
      casos: p.casos,
      probSube: p.probSube === null ? null : +p.probSube.toFixed(0),
    })),
    promedios: {
      pares: +col.promedios.pares.toFixed(2),
      impares: +col.promedios.impares.toFixed(2),
      pequenos: +col.promedios.pequenos.toFixed(2),
      grandes: +col.promedios.grandes.toFixed(2),
      calientes: +col.promedios.calientes.toFixed(2),
      frios: +col.promedios.frios.toFixed(2),
      repetidos: +col.promedios.repetidos.toFixed(2),
      bilaterales: +col.promedios.bilaterales.toFixed(2),
    },
    flags,
    banda84: rec.banda84,
    bilateralesUltimo: state.bilateralesUltimo,
    bandas: col.bandas,
    bandasAusentesUltimo: state.bandasAbsentesUltimo,
    ranking: rec.ranking.slice(0, 25).map((x) => ({
      num: x.num,
      score: +x.score.toFixed(2),
      freq: +x.freqPct.toFixed(1),
      last10: x.last10,
      last5: x.last5,
      gap: x.lastGap,
      hot: x.isHot,
      cold: x.isCold,
      farol: x.farol,
      razon: x.razones[0],
    })),
    combos: rec.topCombos.map((c) => ({
      nums: c.nums,
      suma: c.sum,
      pares: c.pares,
      impares: c.impares,
      pequenos: c.pequenos,
      grandes: c.grandes,
      constr: c.constr.slice(0, 3),
    })),
    sistemas: {
      proporcional: { numeros: rec.sistemaProporcional.numeros, apuestas: rec.sistemaProporcional.apuestas },
      numFijo: { fijo: rec.sistemaNumeroFijo.fijo, apuestas: rec.sistemaNumeroFijo.apuestas },
      total: rec.sistemaTotal8.slice(0, 10),
    },
    indicadores: {
      rsi: ind.rsi === null ? null : +ind.rsi.toFixed(1),
      rsiSenal: ind.rsiSenal,
      bollinger: ind.bollinger ? { up: +ind.bollinger.upper.toFixed(1), mid: +ind.bollinger.middle.toFixed(1), low: +ind.bollinger.lower.toFixed(1) } : null,
      ma: ind.ma ? { ma5: +ind.ma.ma5.toFixed(1), ma20: +ind.ma.ma20.toFixed(1), cruce: ind.ma.cruce } : null,
      macd: ind.macd ? { macd: +ind.macd.macd.toFixed(2), senal: +(ind.macd.senal ?? 0).toFixed(2), cruce: ind.macd.cruce } : null,
      estocastico: ind.estocastico ? { k: +ind.estocastico.k.toFixed(1), d: ind.estocastico.d === null ? null : +ind.estocastico.d.toFixed(1), senal: ind.estocastico.senal } : null,
      atr: ind.atr === null ? null : +ind.atr.toFixed(1),
      velas: ind.patronesVela,
      ultimaVelaBody: +ind.ultimaVela.body.toFixed(1),
      pivots: ind.pivots,
    },
    backtest: {
      sorteos: bt.sorteosEvaluados,
      apuestas: bt.combosTotal,
      metricas: bt.metricas.map((m) => ({ label: m.label, modelo: +m.modelo.toFixed(2), azar: m.azar < 1e-3 ? m.azar.toExponential(2) : +m.azar.toFixed(2) })),
    },
  };
}

mkdirSync(WEB, { recursive: true });

const data = {
  meta: {
    generado: new Date().toString(),
    generadoISO: new Date().toISOString(),
    proximos: {
      miloto: nextMilotoDraws().map(fmtLocal),
      baloto: nextBalotoDraws().map(fmtLocal),
    },
  },
  juegos: {
    miloto: buildGameData('miloto'),
    baloto: buildGameData('baloto'),
  },
};

writeFileSync(join(WEB, 'data.js'), 'window.DATA=' + JSON.stringify(data) + ';\n', 'utf8');
console.log('Landing data generado en web/data.js');
console.log(`  - MiLoto: últimos ${data.juegos.miloto.draws} sorteos`);
console.log(`  - Baloto: últimos ${data.juegos.baloto.draws} sorteos`);
console.log(`  - Próximos MiLoto: ${data.meta.proximos.miloto.join(', ')}`);
console.log(`  - Próximos Baloto: ${data.meta.proximos.baloto.join(', ')}`);