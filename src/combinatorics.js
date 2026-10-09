// ============================================================================
// combinatorics.js — Sistemas combinados (sección 9 del documento):
//   • Proporcional: 8 números → 7 apuestas (garantía 4ª categoría)
//   • Número Fijo: 1 fijo + 7 variables → 7 apuestas
//   • Total: todas las combinaciones de n números tomadas de a 5
// También: validación de apuestas vs. resultado según categorías.
// ============================================================================

const PROPORCIONAL_7 = [
  [0, 1, 2, 3, 4],
  [0, 1, 2, 5, 6],
  [0, 1, 3, 7, 4],
  [0, 2, 5, 7, 6],
  [1, 3, 4, 5, 7],
  [2, 3, 4, 6, 7],
  [0, 1, 5, 6, 7],
];

const NUM_FIJO_7 = [
  [0, 1, 2, 3, 4],
  [0, 1, 2, 5, 6],
  [0, 1, 3, 7, 4],
  [0, 2, 5, 7, 6],
  [0, 1, 3, 4, 5],
  [0, 2, 3, 4, 6],
  [0, 1, 4, 5, 7],
];

export function combinaciones(ns, k) {
  const out = [];
  const rec = (start, acc) => {
    if (acc.length === k) {
      out.push([...acc]);
      return;
    }
    for (let i = start; i < ns.length; i++) {
      acc.push(ns[i]);
      rec(i + 1, acc);
      acc.pop();
    }
  };
  rec(0, []);
  return out;
}

/** Sistema proporcional: 8 números → 7 combinaciones. */
export function sistemaProporcional(eight) {
  if (eight.length !== 8) throw new Error('El sistema proporcional requiere exactamente 8 números.');
  return PROPORCIONAL_7.map((row) => row.map((i) => eight[i]));
}

/** Sistema número fijo: número fijo + 7 variables → 7 combinaciones de 5. */
export function sistemaNumeroFijo(fijo, variables) {
  if (variables.length !== 7) throw new Error('Requiere 7 números variables además del fijo.');
  return NUM_FIJO_7.map((row) => [fijo, ...row.slice(1).map((i) => variables[i - 1])]);
}

export function hits(combo, result) {
  return combo.filter((x) => result.includes(x)).length;
}

/** Categoría MiLoto según aciertos (5,4,3,2). */
export function categoriaMiloto(aciertos) {
  if (aciertos >= 5) return '🏆 Premio Mayor (5/5)';
  if (aciertos === 4) return '2º premio (4/5)';
  if (aciertos === 3) return '3º premio (3/5)';
  if (aciertos === 2) return '4º premio (2/5)';
  return null;
}

/** Categoría Baloto según aciertos y súper balota (sección 1.7). */
export function categoriaBaloto(aciertos, sbAcertada) {
  if (aciertos === 5 && sbAcertada) return '🏆 Premio Mayor (5 + Súper)';
  if (aciertos === 5) return '5 aciertos';
  if (aciertos === 4 && sbAcertada) return '4 + Súper Balota';
  if (aciertos === 4) return '4 aciertos';
  if (aciertos === 3 && sbAcertada) return '3 + Súper Balota';
  if (aciertos === 3) return '3 aciertos';
  if (aciertos === 2 && sbAcertada) return '2 + Súper Balota';
  if (aciertos === 1 && sbAcertada) return '1 + Súper Balota';
  return null;
}