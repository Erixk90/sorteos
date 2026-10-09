/* eslint-disable no-undef */
const DATA = window.DATA;
const app = document.getElementById('app');

const fmtFecha = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${d} ${meses[m - 1]} ${y}`;
};

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function balls(nums, map) {
  const cls = (n) => {
    if (map && map.farol.includes(n)) return 'ball small farol';
    if (map && map.hot.includes(n)) return 'ball small hot';
    if (map && map.cold.includes(n)) return 'ball small cold';
    return 'ball small';
  };
  return nums.map((n) => `<span class="${cls(n)}">${n}</span>`).join('');
}

function card(title, inner) {
  return `<div class="card"><h3>${esc(title)}</h3>${inner}</div>`;
}

function patternsCard(g) {
  const f = g.flags;
  const rows = [
    ['🔥 Calientes', f.hot, 'hot'],
    ['❄️ Fríos', f.cold, 'cold'],
    ['🚨 Faroles — evitar', f.farol, 'farol'],
    ['🚀 Impulso', f.impulso, 'hot'],
    ['🐌 Inercia', f.inercia, 'cold'],
    ['🔁 Doblete', f.doblete, 'hot'],
    ['🔂 Triple', f.triple, 'hot'],
    ['⭐ Estrella', f.estrella, 'cold'],
  ];
  return rows.map(([t, list, c]) => `
    <p class="muted" style="margin-top:10px">${t}</p>
    <div class="numbers">${list.length ? balls(list.map((x) => [x]), { farol: f.farol.includes(list[0]) ? list : [], hot: f.hot, cold: f.cold }) : '<span class="muted">ninguno</span>'}</div>
  `).join('');
}

function stat(icon, label, value) {
  return `<div class="card"><h3>${icon} ${esc(label)}</h3><p style="font-size:20px;font-weight:700">${value}</p></div>`;
}

function renderGame(g, name) {
  const prox = DATA.meta.proximos[name];
  const last = g.ultimo;
  const d = g.distrib;
  const ind = g.indicadores;

  const html = `
  <div class="grid grid-2">
    ${stat('🎱', 'Último sorteo', `#${last.no}<br><span class="muted" style="font-size:12px">${fmtFecha(last.fecha)}</span>`)}
    ${stat('🔢', 'Resultado', balls(last.nums, { hot: [], cold: [], farol: [] }))}
    ${stat('🧮', 'Suma última', `${last.suma}<br><span class="muted" style="font-size:12px">media ${d.mean} · P10 ${d.p10} · P90 ${d.p90}</span>`)}
    ${stat('📅', 'Próximos sorteos', prox.map((p) => `<span class="badge">${fmtFecha(p)}</span>`).join(''))}
  </div>

  <div class="grid grid-2">
    ${card('Patrones de números', patternsCard(g))}
    ${card('Distribución de sumas & péndulo', `
      <p>Media <b>${d.mean}</b> · Mediana <b>${d.median}</b> · P10 <b>${d.p10}</b> · P90 <b>${d.p90}</b> · σ <b>${d.std}</b></p>
      <p>Últimas 3 sumas: ${d.last3.join(', ')}${last.suma > d.p90 ? ' → 🔻 alta, tiende a bajar' : last.suma < d.p10 ? ' → 🔺 baja, tiende a subir' : ' → neutral'}</p>
      <table><tr><th>Banda</th><th>Casos</th><th>Sube</th><th>Baja</th></tr>
      ${g.pendulo.map((p) => `<tr><td>${esc(p.label)}</td><td>${p.casos}</td><td>${p.probSube === null ? '—' : p.probSube + '%'}</td><td>${p.probSube === null ? '—' : (100 - p.probSube) + '%'}</td></tr>`).join('')}
      </table>
      <p class="muted" style="margin-top:8px">Promedios por sorteo: ${g.promedios.pares}P/${g.promedios.impares}I · ${g.promedios.pequenos}Peq/${g.promedios.grandes}Gr · ${g.promedios.calientes}Cal/${g.promedios.frios}Fríos</p>
    `)}
  </div>

  <div class="grid grid-2">
    ${card('Ranking de números (score)', `
      <div class="annotations">
      <table>
        <tr><th>#</th><th>Nº</th><th>Score</th><th>Frec%</th><th>Ú10</th><th>Ú5</th><th>Gap</th><th>Señal</th></tr>
        ${g.ranking.map((r, i) => `
          <tr>
            <td>${i + 1}</td>
            <td class="num">${r.num}</td>
            <td>${r.score}</td>
            <td>${r.freq}</td>
            <td>${r.last10}</td>
            <td>${r.last5}</td>
            <td>${r.gap}</td>
            <td>${r.hot ? '<span class="pill hot">🔥</span>' : ''}${r.cold ? '<span class="pill cold">❄️</span>' : ''}${r.farol ? '<span class="pill farol">🚨</span>' : ''} <span class="muted">${esc(r.razon)}</span></td>
          </tr>`).join('')}
      </table>
      </div>
    `)}
    ${card('Combinaciones recomendadas (juego de 5)', `
      ${g.combos.map((c, i) => `
        <div class="combo">
          <b>${i + 1}.</b> ${balls(c.nums, { hot: g.flags.hot, cold: g.flags.cold, farol: g.flags.farol })}
          <div class="info">
            suma ${c.suma} · ${c.pares}P/${c.impares}I · ${c.pequenos}Peq/${c.grandes}Gr<br>
            <span class="tag">${esc(c.constr.join(' · ') || 'mezcla balanceada')}</span>
          </div>
        </div>`).join('')}
      <div class="combo">
        <div class="info" style="min-width:100%">
        <b>Bilaterales del último:</b> ${g.bilateralesUltimo.join(', ') || '—'}<br>
        <b>Bandas ausentes (compensar):</b> ${g.bandasAusentesUltimo.map((i) => g.bandas[i]).join(', ') || 'ninguna'}
        </div>
      </div>
    `)}
  </div>

  ${card('Sistemas de combinación', `
    <h4>Sistema proporcional (8 números → 7 apuestas)</h4>
    <div class="numbers" style="margin-bottom:8px">${balls(g.sistemas.proporcional.numeros, { hot: g.flags.hot, cold: g.flags.cold, farol: g.flags.farol })}</div>
    <table><tr><th>#</th><th>Combinación</th></tr>
    ${g.sistemas.proporcional.apuestas.map((a, i) => `<tr><td>${i + 1}</td><td>${balls(a, {})}</td></tr>`).join('')}
    </table>
    <h4 style="margin-top:14px">Sistema número fijo (fijo ${g.sistemas.numFijo.fijo})</h4>
    <table><tr><th>#</th><th>Combinación</th></tr>
    ${g.sistemas.numFijo.apuestas.map((a, i) => `<tr><td>${i + 1}</td><td>${balls(a, {})}</td></tr>`).join('')}
    </table>
    <h4 style="margin-top:14px">Sistema total (top 8 → mejores 10 por índice)</h4>
    <table><tr><th>#</th><th>Combinación</th><th>Suma</th><th>P/I</th></tr>
    ${g.sistemas.total.map((c, i) => `<tr><td>${i + 1}</td><td>${balls(c.nums, {})}</td><td>${c.suma}</td><td>${c.pares}P/${c.impares}I</td></tr>`).join('')}
    </table>
  `)}

  <div class="grid grid-2">
    ${card('Indicadores de trading (serie de sumas)', `
      <table>
        <tr><td>Velas</td><td>${ind.ultimaVelaBody > 0 ? '🟢' : '🔴'} cuerpo ${Math.abs(ind.ultimaVelaBody)} · patrones: ${ind.velas.length ? ind.velas.join(', ') : 'ninguno'}</td></tr>
        <tr><td>RSI(14)</td><td>${ind.rsi ?? '—'} · ${esc(ind.rsiSenal ?? '')}</td></tr>
        <tr><td>Bollinger(20)</td><td>${ind.bollinger ? `sup ${ind.bollinger.up} · med ${ind.bollinger.mid} · inf ${ind.bollinger.low}` : '—'}</td></tr>
        <tr><td>Medias</td><td>${ind.ma ? `MA5 ${ind.ma.ma5} · MA20 ${ind.ma.ma20} → ${esc(ind.ma.cruce)}` : '—'}</td></tr>
        <tr><td>MACD</td><td>${ind.macd ? `${ind.macd.macd} vs señal ${ind.macd.senal} → ${esc(ind.macd.cruce)}` : '—'}</td></tr>
        <tr><td>Estocástico</td><td>${ind.estocastico ? `%K ${ind.estocastico.k} · %D ${ind.estocastico.d ?? '—'} → ${esc(ind.estocastico.senal)}` : '—'}</td></tr>
        <tr><td>ATR</td><td>${ind.atr ?? '—'}</td></tr>
        <tr><td>Pivots</td><td>${ind.pivots ? `P ${ind.pivots.pivot.toFixed(1)} · R1 ${ind.pivots.r1.toFixed(1)} · S1 ${ind.pivots.s1.toFixed(1)}` : '—'}</td></tr>
      </table>
    `)}
    ${card('Backtest walk-forward (validación honesta)', `
      <p class="muted">Últimos ${g.backtest.sorteos} sorteos evaluados entrenando solo con datos previos (${g.backtest.apuestas} apuestas probadas, 5 por sorteo).</p>
      <table>
        <tr><th>Umbral</th><th>Modelo</th><th>Azar</th><th></th></tr>
        ${g.backtest.metricas.map((m) => {
          const modelo = typeof m.modelo === 'number' ? m.modelo : parseFloat(m.modelo);
          const azar = typeof m.azar === 'number' ? m.azar : parseFloat(m.azar);
          const morelas = m.label;
          return `<tr>
            <td>${esc(m.label)}</td>
            <td><b>${modelo}%</b></td>
            <td>${m.azar}%</td>
            <td style="width:120px"><div class="progress"><span style="width:${Math.min(100, (modelo / Math.max(azar, 0.001)) * 20)}%;${modelo >= azar ? 'background:var(--ok)' : 'background:var(--farol)'}"></span></div></td>
          </tr>`;
        }).join('')}
      </table>
      <p class="muted" style="margin-top:8px">El modelo tiende a superar al azar en premios menores (≥2 y ≥3), no en el premio mayor: es un juego aleatorio, estas son combinaciones «razonables», no una garantía.</p>
    `)}
  </div>
  `;
  app.innerHTML = html;
  window.scrollTo(0, 0);
}

document.getElementById('generado').textContent =
  `Generado: ${DATA.meta.generado} · ${DATA.juegos.miloto.draws} sorteos del MiLoto (desde ${fmtFecha(DATA.juegos.miloto.desde)}) · ${DATA.juegos.baloto.draws} del Baloto`;

document.querySelectorAll('.tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    renderGame(DATA.juegos[btn.dataset.lot], btn.dataset.lot);
  });
});

renderGame(DATA.juegos.miloto, 'miloto');