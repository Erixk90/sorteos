# PLAN — Reorganización de la landing (Baloto · MiLoto)

> Estado: **cambios aplicados en local, SIN deployar** (pendiente de tu OK).

## Objetivo
Reordenar la página y diferenciar visualmente las recomendaciones.

## Orden de secciones (confirmado)
1. **Recomendaciones — comparación de los 3 gatillos** (destacado, PRIMERO)
2. Sorteo / Resultado / Suma / Próximos sorteos
3. Análisis: patrones de números + distribución de sumas & péndulo
4. Ranking de números (score)
5. Sistemas de combinación
6. Indicadores de trading + Backtest
7. **Seguimiento** (recomendados del sorteo anterior vs. resultado real) — ÚLTIMO

## Cambios acordados
- [x] **Quitar** la sección «Combinaciones recomendadas (juego de 5)» (modelo base).
- [x] **Mover** la tabla de los 3 gatillos (Péndulo / Indicadores / Combinado) **al inicio**.
- [x] **Look diferente**: el bloque de recomendaciones usa `.card.destacado`
      (borde y título color acento). El resto queda normal con su título.
- [x] Comparación **lado a lado** en una sola tabla de 3 columnas (15 cada una).
- [x] **Seguimiento = historial** de los últimos **10 sorteos** (walk-forward), en
      **desplegables**: cada sorteo se abre y muestra la **lista completa** de los 3
      gatillos (15 combinaciones cada uno) con suma y **aciertos** vs. el resultado real
      (filas verdes = 2+). Resumen con mejor acierto y ≥3. Ya no mide el modelo base.

## Pendiente / por confirmar
- ¿Deployar? (por ahora **NO** hasta tu aprobación).
- ¿Algún ajuste de estilo del bloque destacado (color/intensidad)?

## Notas técnicas
- Motor de gatillos: `src/gatillos.js` → `analizarGatillos(state)`.
  - Gatillo 1 Péndulo: objetivo = media ± dirección (P10/P90).
  - Gatillo 2 Indicadores: votos de RSI, Bollinger, MA5/20, MACD, estocástico,
    pivots y patrones de velas → objetivo de suma.
  - Gatillo 3 Combinado: promedio de los dos anteriores.
- Datos del sitio: `web/data.js` (artefacto de build, **no versionado**).
- Deploy: `.github/workflows/pages.yml` (diario 7:00 Colombia + push + manual).
- Git simplificado: el CI solo versiona `data/`; `web/data.js` es ignorado.
