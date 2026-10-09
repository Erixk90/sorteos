import { stdev } from './engine.js';

// ============================================================================
// indicators.js — Velas japonesas e indicadores de trading aplicados a la serie
// de sumas de cada sorteo (sección 7 y 8 del documento).
// ============================================================================

export function sma(arr, period) {
  const out = [];
  for (let i = period - 1; i < arr.length; i++) {
    let s = 0;
    for (let k = i - period + 1; k <= i; k++) s += arr[k];
    out.push({ value: s / period, index: i });
  }
  return out;
}

export function ema(arr, period) {
  const k = 2 / (period + 1);
  const out = [];
  let prev = null;
  for (let i = 0; i < arr.length; i++) {
    const v = prev === null ? arr[i] : arr[i] * k + prev * (1 - k);
    out.push({ value: v, index: i });
    prev = v;
  }
  return out;
}

export function rsiSeries(arr, period = 14) {
  const out = [];
  if (arr.length <= period) return out;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = arr[i] - arr[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  let avgG = gains / period;
  let avgL = losses / period;
  out.push({ value: 100 - 100 / (1 + (avgL === 0 ? 100 : avgG / avgL)), index: period });
  for (let i = period + 1; i < arr.length; i++) {
    const diff = arr[i] - arr[i - 1];
    const g = Math.max(diff, 0);
    const l = Math.max(-diff, 0);
    avgG = (avgG * (period - 1) + g) / period;
    avgL = (avgL * (period - 1) + l) / period;
    const rs = avgL === 0 ? 100 : avgG / avgL;
    out.push({ value: 100 - 100 / (1 + rs), index: i });
  }
  return out;
}

export function bollinger(arr, period = 20) {
  const out = [];
  for (let i = period - 1; i < arr.length; i++) {
    const win = arr.slice(i - period + 1, i + 1);
    const m = win.reduce((a, b) => a + b, 0) / period;
    const sd = stdev(win);
    out.push({ middle: m, upper: m + 2 * sd, lower: m - 2 * sd, index: i });
  }
  return out;
}

export function macdSeries(arr, fast = 12, slow = 26, signal = 9) {
  const eFast = ema(arr, fast);
  const eSlow = ema(arr, slow);
  const macd = [];
  for (let i = 0; i < arr.length; i++) {
    if (i >= slow - 1) macd.push({ value: eFast[i].value - eSlow[i].value, index: i });
  }
  const sig = ema(macd.map((m) => m.value), signal);
  const out = [];
  for (let i = 0; i < macd.length; i++) {
    out.push({ value: macd[i].value, signal: sig[i]?.value ?? null, index: macd[i].index });
  }
  return out;
}

export function stochastic(arr, period = 14, smoothK = 3) {
  const out = [];
  for (let i = period - 1; i < arr.length; i++) {
    const win = arr.slice(i - period + 1, i + 1);
    const min = Math.min(...win);
    const max = Math.max(...win);
    const k = max === min ? 50 : ((arr[i] - min) / (max - min)) * 100;
    out.push({ value: k, index: i });
  }
  const d = sma(out.map((x) => x.value), smoothK);
  return out.map((x, i) => {
    const dj = i - (smoothK - 1);
    return { ...x, signalD: dj >= 0 && d[dj] ? d[dj].value : null };
  });
}

export function atrSeries(candles, period = 14) {
  const out = [];
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const prevClose = i > 0 ? candles[i - 1].close : c.open;
    const tr = Math.max(
      c.high - c.low,
      Math.abs(c.high - prevClose),
      Math.abs(c.low - prevClose)
    );
    out.push({ tr, index: i });
  }
  const result = [];
  for (let i = period - 1; i < out.length; i++) {
    let s = 0;
    for (let k = i - period + 1; k <= i; k++) s += out[k].tr;
    result.push({ value: s / period, index: i });
  }
  return result;
}

export function buildCandles(sums) {
  const stds = [];
  const sd = stdev(sums);
  for (let i = 0; i < sums.length; i++) stds.push(sd);
  const candles = [];
  for (let i = 0; i < sums.length; i++) {
    const open = i > 0 ? sums[i - 1] : sums[i];
    const close = sums[i];
    const high = close + stds[i];
    const low = close - stds[i];
    candles.push({
      open,
      close,
      high,
      low,
      body: close - open,
      upperWick: high - Math.max(open, close),
      lowerWick: Math.min(open, close) - low,
      green: close > open,
      red: close < open,
    });
  }
  return candles;
}

export function lastCandlePatterns(candles) {
  const n = candles.length;
  const out = [];
  const c = (i) => candles[i];

  const isDoji = (x) => Math.abs(x.body) < 5;
  const isEngulfingBull = (a, b) => a.red && b.green && b.close > a.open;
  const isEngulfingBear = (a, b) => a.green && b.red && b.close < a.open;
  const isHammer = (x) => Math.abs(x.body) < 6 && x.lowerWick > 2 * Math.abs(x.body);
  const isShooting = (x) => Math.abs(x.body) < 6 && x.upperWick > 2 * Math.abs(x.body);
  const harami = (a, b) => {
    const aRange = Math.abs(a.open - a.close);
    return aRange > 10 && Math.abs(b.open - b.close) <= aRange * 0.5 && b.low >= Math.min(a.open, a.close) && b.high <= Math.max(a.open, a.close);
  };
  const marubozu = (x) => x.upperWick < Math.abs(x.body) * 0.1 && x.lowerWick < Math.abs(x.body) * 0.1 && Math.abs(x.body) > 6;
  const hangingMan = (x) => {
    const priorGreen = n >= 2 && c(n - 2).green;
    return priorGreen && Math.abs(x.body) < 6 && x.lowerWick > 2 * Math.abs(x.body) && x.green;
  };

  const tags = [];
  if (isDoji(c(n - 1))) tags.push('Doji');
  if (n >= 2 && isEngulfingBull(c(n - 2), c(n - 1))) tags.push('Envolvente alcista');
  if (n >= 2 && isEngulfingBear(c(n - 2), c(n - 1))) tags.push('Envolvente bajista');
  if (n >= 3 && c(n - 3).red && c(n - 2).red && c(n - 1).red) tags.push('Tres cuervos negros');
  if (n >= 3 && c(n - 3).green && c(n - 2).green && c(n - 1).green) tags.push('Tres soldados blancos');
  if (isHammer(c(n - 1))) tags.push('Martillo');
  if (isShooting(c(n - 1))) tags.push('Estrella fugaz');
  if (n >= 2 && harami(c(n - 2), c(n - 1))) tags.push('Harami');
  if (marubozu(c(n - 1))) tags.push('Marubozu');
  if (hangingMan(c(n - 1))) tags.push('Hombre colgado');

  return { candles: c(n - 1), tags };
}

export function fibonacciLevels(sums, lookback = 30) {
  const win = sums.slice(-lookback);
  const max = Math.max(...win);
  const min = Math.min(...win);
  const close = sums[sums.length - 1];
  const levels = [0, 0.236, 0.382, 0.5, 0.618, 1].map((f) => ({
    level: f * 100,
    value: max - (max - min) * f,
  }));
  return { max, min, close, levels };
}

export function pivotPoints(sums) {
  const candles = buildCandles(sums);
  const last = candles[candles.length - 1];
  const high = last.high;
  const low = last.low;
  const close = last.close;
  const pivot = (high + low + close) / 3;
  return {
    pivot,
    r1: 2 * pivot - low,
    s1: 2 * pivot - high,
    r2: pivot + (high - low),
    s2: pivot - (high - low),
  };
}

/** Resumen de todos los indicadores sobre la última vela / último valor. */
export function summarizeIndicators(sums) {
  const candles = buildCandles(sums);
  const rsi = rsiSeries(sums).at(-1);
  const boll = bollinger(sums).at(-1);
  const ma5 = sma(sums, 5).at(-1)?.value;
  const ma10 = sma(sums, 10).at(-1)?.value;
  const ma20 = sma(sums, 20).at(-1)?.value;
  const macd = macdSeries(sums).at(-1);
  const stoch = stochastic(sums).at(-1);
  const atr = atrSeries(candles).at(-1)?.value;
  const fibo = fibonacciLevels(sums);
  const pivot = pivotPoints(sums);
  const pat = lastCandlePatterns(candles);

  return {
    ultimaVela: pat.candles,
    patronesVela: pat.tags,
    sumaActual: sums[sums.length - 1],
    rsi: rsi?.value ?? null,
    rsiSenal: rsi ? (rsi.value > 70 ? 'Sobrecompra (>70): tendencia a bajar' : rsi.value < 30 ? 'Sobreventa (<30): tendencia a subir' : 'Neutral') : null,
    bollinger: boll ? { upper: boll.upper, middle: boll.middle, lower: boll.lower } : null,
    ma: { ma5, ma10, ma20, cruce: ma5 !== undefined && ma20 !== undefined ? (ma5 > ma20 ? 'Alcista (MA5>MA20)' : ma5 < ma20 ? 'Bajista (MA5<MA20)' : 'Neutral') : null },
    macd: macd ? { macd: macd.value, senal: macd.signal, cruce: macd.signal !== null ? (macd.value > macd.signal ? 'Alcista (MACD>señal)' : macd.value < macd.signal ? 'Bajista (MACD<señal)' : 'Neutral') : null } : null,
    estocastico: stoch ? { k: stoch.value, d: stoch.signalD, senal: stoch.value > 80 ? 'Sobrecompra' : stoch.value < 20 ? 'Sobreventa' : 'Neutral' } : null,
    atr,
    fibonacci: fibo,
    pivots: pivot,
  };
}