# 📄 DOCUMENTO DE SOPORTE — BALOTO (VERSIÓN DEFINITIVA)

**Propósito:** Base de datos pura + patrones + combinaciones + fórmulas + trading. Sin conclusiones ni predicciones.
**Última actualización:** 08/10/2026

---

## 1. DEFINICIONES DEL DOCUMENTO ORIGINAL

### 1.1 Tipos de Número

| Concepto | Definición |
|---|---|
| **Frío** | No seleccionado ganador durante las últimas 10 tiradas. |
| **Caliente** | Seleccionado ganador 2 veces en últimas 10 tiradas + 1 vez en últimas 5. |
| **Pequeño** | Baloto: 1–21. |
| **Grande** | Baloto: 22–43. |
| **Consecutivos** | Ganadores juntos, uno a continuación del otro. Ej: 15-16. |
| **Bilaterales** | A ambos lados del ganador anterior. Ej: si 15 salió, bilaterales son 14 y 16. |
| **Repetido** | Ganador en tirada actual y en la anterior. |
| **Par** | Múltiplo de 2. |
| **Impar** | No múltiplo de 2. |
| **Intervalos** | (1-9) (10-19) (20-29) (30-39) (40-43). |

### 1.2 Patrones Individuales

| Patrón | Definición |
|---|---|
| **Farol** | Frío que lleva 20+ tiradas sin salir. NO apostar. |
| **Despertar** | Frío (17+ tiradas sin salir) que sale y repite en 4 tiradas. |
| **Inercia** | Intervalos entre apariciones AUMENTAN. |
| **Impulso** | Intervalos entre apariciones SE REDUCEN. Señal de "calentado". |
| **Doblete** | Gana, descansa X, gana, descansa X, vuelve a ganar. |
| **Triple** | Similar al doblete pero con 3 intervalos iguales. |
| **Estrella** | Gana cada 5 tiradas ± 1. |

### 1.3 Patrones Colectivos

| Patrón | Definición |
|---|---|
| **Pares/Impares** | Mejor mezcla: 2/3 o 3/2 (80% de casos). |
| **Grandes/Pequeños** | Mejor mezcla: 2/3 o 3/2 (80% de casos). |
| **Calientes/Fríos** | 4 calientes + 1 frío (80/20). |
| **La Ausencia** | Falta uno o más intervalos. Tiende a compensarse en 3 tiradas. |

### 1.4 Principios

| Principio | Definición |
|---|---|
| **Péndulo** | Sumas extremas se compensan. Baloto: >160 baja, <90 sube. |
| **80/20 (Pareto)** | El 80% de resultados tienen ciertas características. |

### 1.5 Sistemas Combinatorios

| Sistema | Descripción |
|---|---|
| **Proporcional** | 8 números → 7 combinaciones. Garantía 4ª categoría. |
| **Número Fijo** | 1 número aparece en todas las combinaciones. |
| **Total** | Todas las combinaciones posibles. |

### 1.6 Tácticas

| Táctica | Descripción |
|---|---|
| **Juego Pasivo** | Mismos números siempre. |
| **Juego Activo** | Adaptar según patrones. Registrar. Cuantificar riesgos. |

### 1.7 Categorías de Premio en Baloto

| Categoría | Aciertos | ¿Súper Balota? |
|---|---|---|
| Premio Mayor | 5 | Sí |
| 5 aciertos | 5 | No |
| 4 + Súper | 4 | Sí |
| 4 aciertos | 4 | No |
| 3 + Súper | 3 | Sí |
| 3 aciertos | 3 | No |
| 2 + Súper | 2 | Sí |
| 1 + Súper | 1 | Sí |

### 1.8 Datos del Baloto

| Concepto | Valor |
|---|---|
| Precio por apuesta | $6.000 COP |
| Revancha | +$3.000 COP |
| Rango de números | 1–43 |
| Números por apuesta | 5 |
| Súper Balota | 1–16 |
| Retención de impuestos | 20% si premio > $2.251.000 |

### 1.9 El Momento Técnico y Personal

| Concepto | Definición |
|---|---|
| **Momento técnico** | La oportunidad de adelantarse a un patrón numérico recurrente en la serie. |
| **Momento personal** | Cómo armonizarse con los ciclos de buena suerte. |

### 1.10 Juego Individual y Colectivo

| Concepto | Definición |
|---|---|
| **Juego individual** | Cada jugador aplica su propio sistema. |
| **Juego colectivo** | Varios jugadores combinan sus números y comparten premios. |

### 1.11 Cálculo de Riesgo

| Concepto | Fórmula |
|---|---|
| Riesgo | `dinero_apostado - premio_garantizado` |
| Cuantificar riesgo | `riesgo / premio_potencial` |
| Progresión | Aumentar apuesta solo si la garantía supera el costo. |

---

## 2. PATRONES POR NÚMERO (INDIVIDUALES)

### 2.1 Farol (20+ tiradas sin salir)

| Concepto | Fórmula |
|---|---|
| Detección | `tiradas_sin_salir >= 20` |
| Acción | NO apostar. Esperar señal de despertar. |

### 2.2 Despertar (17+ tiradas sin salir)

| Concepto | Fórmula |
|---|---|
| Detección | `tiradas_sin_salir >= 17` Y `sale` Y `repite en 4 tiradas` |
| Acción | Apostar por él si repite. |

### 2.3 Inercia (intervalos AUMENTAN)

| Concepto | Fórmula |
|---|---|
| Detección | `intervalo_1 < intervalo_2 < intervalo_3` |
| Acción | Evitar. El número está "dormido". |

### 2.4 Impulso (intervalos SE REDUCEN)

| Concepto | Fórmula |
|---|---|
| Detección | `intervalo_1 > intervalo_2 > intervalo_3` |
| Acción | Apostar. El número se ha "calentado". |

### 2.5 Doblete

| Concepto | Fórmula |
|---|---|
| Detección | `intervalo_1 == intervalo_2` (o ±1) |
| Acción | Apostar por tercera aparición. |

### 2.6 Triple

| Concepto | Fórmula |
|---|---|
| Detección | `intervalo_1 == intervalo_2 == intervalo_3` (o ±1) |
| Acción | Apostar por cuarta aparición. |

### 2.7 Estrella

| Concepto | Fórmula |
|---|---|
| Detección | `intervalo_promedio ≈ 5` (±1) |
| Acción | Usar como número fijo. |

---

## 3. PATRONES POR CONJUNTO (COLECTIVOS)

### 3.1 Pares/Impares

| Concepto | Fórmula |
|---|---|
| Pares | `contar(n % 2 == 0)` |
| Impares | `contar(n % 2 != 0)` |
| Mejor mezcla | 2/3 o 3/2 (80% de casos) |
| Evitar | 0/5, 5/0, 1/4, 4/1 |

### 3.2 Grandes/Pequeños

| Concepto | Fórmula |
|---|---|
| Pequeños | `contar(1 <= n <= 21)` |
| Grandes | `contar(22 <= n <= 43)` |
| Mejor mezcla | 2/3 o 3/2 (80% de casos) |
| Evitar | 0/5, 5/0, 1/4, 4/1 |

### 3.3 Calientes/Fríos

| Concepto | Fórmula |
|---|---|
| Calientes | `contar(caliente == True)` |
| Fríos | `contar(frio == True)` |
| Mejor mezcla | 4 calientes + 1 frío (80/20) |
| Evitar | 0 calientes, 5 fríos |

### 3.4 La Ausencia

| Concepto | Fórmula |
|---|---|
| Detección | `intervalo no presente en la combinación` |
| Acción | El intervalo ausente tiende a compensarse en 3 tiradas. |

### 3.5 Bilaterales

| Concepto | Fórmula |
|---|---|
| Detección | `[n-1, n+1] para cada n que salió en la tirada anterior` |
| Acción | Incluir al menos 1 bilateral. |

### 3.6 Repetidos

| Concepto | Fórmula |
|---|---|
| Detección | `números en tirada actual AND en tirada anterior` |
| Acción | Incluir al menos 1 repetido. |

### 3.7 Consecutivos

| Concepto | Fórmula |
|---|---|
| Detección | `n y n+1 en la misma combinación` |
| Acción | No es obligatorio, pero es común. |

---

## 4. COMBINACIONES INDIVIDUALES (por número)

### 4.1 Calientes

| Concepto | Fórmula |
|---|---|
| Detección | `veces_10 >= 2 AND veces_5 >= 1` |
| Acción | Apostar por él. |

### 4.2 Fríos

| Concepto | Fórmula |
|---|---|
| Detección | `veces_10 == 0` |
| Acción | Evitar (excepto si está en despertar). |

### 4.3 Faroles

| Concepto | Fórmula |
|---|---|
| Detección | `tiradas_sin_salir >= 20` |
| Acción | NO apostar. |

### 4.4 Despertares

| Concepto | Fórmula |
|---|---|
| Detección | `tiradas_sin_salir >= 17 AND sale AND repite en 4` |
| Acción | Apostar si repite. |

### 4.5 Impulso

| Concepto | Fórmula |
|---|---|
| Detección | `intervalo_1 > intervalo_2 > intervalo_3` |
| Acción | Apostar. |

### 4.6 Doblete

| Concepto | Fórmula |
|---|---|
| Detección | `intervalo_1 == intervalo_2` |
| Acción | Apostar por tercera aparición. |

---

## 5. COMBINACIONES CONJUNTAS (por conjunto)

### 5.1 Pares/Impares por sorteo

| Concepto | Fórmula |
|---|---|
| Pares | `contar(n % 2 == 0)` |
| Impares | `contar(n % 2 != 0)` |
| Config | `pares/impares` |

### 5.2 Grandes/Pequeños por sorteo

| Concepto | Fórmula |
|---|---|
| Pequeños | `contar(1 <= n <= 21)` |
| Grandes | `contar(22 <= n <= 43)` |
| Config | `pequeños/grandes` |

### 5.3 Calientes/Fríos por sorteo

| Concepto | Fórmula |
|---|---|
| Calientes | `contar(caliente == True)` |
| Fríos | `contar(frio == True)` |
| Normales | `5 - calientes - fríos` |

### 5.4 Intervalos cubiertos por sorteo

| Concepto | Fórmula |
|---|---|
| 1-9 | `contar(1 <= n <= 9)` |
| 10-19 | `contar(10 <= n <= 19)` |
| 20-29 | `contar(20 <= n <= 29)` |
| 30-39 | `contar(30 <= n <= 39)` |
| 40-43 | `contar(40 <= n <= 43)` |
| Total | `suma de intervalos con al menos 1 número` |

### 5.5 La Ausencia por sorteo

| Concepto | Fórmula |
|---|---|
| Detección | `intervalo con 0 números` |
| Acción | Tiende a compensarse en 3 tiradas. |

### 5.6 Bilaterales por sorteo

| Concepto | Fórmula |
|---|---|
| Detección | `[n-1, n+1] para cada n del sorteo anterior` |
| Acción | Incluir al menos 1. |

### 5.7 Repetidos por sorteo

| Concepto | Fórmula |
|---|---|
| Detección | `números en sorteo actual AND en anterior` |
| Acción | Incluir al menos 1. |

---

## 6. PRINCIPIO DEL PÉNDULO

### 6.1 Distribución de sumas

| Concepto | Fórmula |
|---|---|
| Suma | `num1 + num2 + num3 + num4 + num5` |
| Media | `promedio(sumas)` |
| Mediana | `mediana(sumas)` |
| Rango 80% | `percentil(10) a percentil(90)` |

### 6.2 Reglas del Péndulo (Baloto)

| Suma | Señal |
|---|---|
| >160 | Próxima tiende a bajar |
| <90 | Próxima tiende a subir |
| 90–160 | Sin señal |

### 6.3 Casos de suma <90 y qué pasó después

| Concepto | Fórmula |
|---|---|
| Detección | `suma < 90` |
| Acción | Apostar a que la próxima suma sube. |

---

## 7. VELAS JAPONESAS

### 7.1 Definiciones

| Concepto | Fórmula |
|---|---|
| Apertura | `suma_sorteo_anterior` |
| Cierre | `suma_sorteo_actual` |
| Cuerpo | `cierre - apertura` |
| Color | 🟢 si `cuerpo > 0`, 🔴 si `cuerpo < 0` |
| Máximo | `suma + desviacion_estandar_movil` |
| Mínimo | `suma - desviacion_estandar_movil` |

### 7.2 Patrones de velas

| Patrón | Fórmula |
|---|---|
| **Envolvente alcista** | `v1 roja, v2 verde, v2 cierre > v1 apertura` |
| **Envolvente bajista** | `v1 verde, v2 roja, v2 cierre < v1 apertura` |
| **Doji** | `abs(cuerpo) < 5` |
| **Tres cuervos negros** | `3 velas rojas consecutivas` |
| **Tres soldados blancos** | `3 velas verdes consecutivas` |
| **Martillo (Hammer)** | `cuerpo pequeño, mecha inferior larga (2x cuerpo)` |
| **Estrella fugaz (Shooting Star)** | `cuerpo pequeño, mecha superior larga (2x cuerpo)` |
| **Harami** | `v1 grande, v2 pequeño dentro del cuerpo de v1` |
| **Marubozu** | `cuerpo grande sin mechas` |
| **Hombre colgado (Hanging Man)** | `cuerpo pequeño, mecha inferior larga, después de subida` |

### 7.3 Secuencias

| Secuencia | ¿Qué suele pasar? |
|---|---|
| 🟢 → 🔴 | Baja |
| 🔴 → 🟢 | Sube |
| 🔴 → 🔴 | Sigue bajando |
| 🟢 → 🟢 | Sigue subiendo |

---

## 8. INDICADORES DE TRADING

### 8.1 RSI

| Concepto | Fórmula |
|---|---|
| RSI | `100 - (100 / (1 + RS))` |
| RS | `avg_ganancia / avg_perdida` |
| Sobrecompra | `RSI > 70` |
| Sobreventa | `RSI < 30` |

### 8.2 Bandas de Bollinger

| Concepto | Fórmula |
|---|---|
| Media | `media_movil(sumas, periodo)` |
| Banda superior | `media + (2 * std)` |
| Banda inferior | `media - (2 * std)` |
| Señal | Toca banda inferior → sube; toca superior → baja |

### 8.3 Medias Móviles

| Concepto | Fórmula |
|---|---|
| MA5 | `media_movil(sumas, 5)` |
| MA10 | `media_movil(sumas, 10)` |
| MA20 | `media_movil(sumas, 20)` |
| Cruce alcista | `MA5 > MA20` |
| Cruce bajista | `MA5 < MA20` |

### 8.4 MACD

| Concepto | Fórmula |
|---|---|
| MACD | `EMA12 - EMA26` |
| Señal | `EMA9 del MACD` |
| Cruce alcista | `MACD > señal` |
| Cruce bajista | `MACD < señal` |

### 8.5 Estocástico

| Concepto | Fórmula |
|---|---|
| %K | `(cierre - mínimo) / (máximo - mínimo) * 100` |
| %D | `media_movil(%K, 3)` |
| Sobrecompra | `%K > 80` |
| Sobreventa | `%K < 20` |

### 8.6 Fibonacci

| Concepto | Fórmula |
|---|---|
| Niveles | `0%, 23.6%, 38.2%, 50%, 61.8%, 100%` |
| Retroceso | `máximo - (máximo - mínimo) * nivel` |
| Señal | Si la suma rebota en un nivel, tendencia continúa |

### 8.7 ATR (Average True Range)

| Concepto | Fórmula |
|---|---|
| TR | `max(alto - bajo, abs(alto - cierre_anterior), abs(bajo - cierre_anterior))` |
| ATR | `media_movil(TR, periodo)` |
| Señal | ATR alto → volatilidad alta |

### 8.8 Ichimoku

| Concepto | Fórmula |
|---|---|
| Tenkan-sen | `(máximo 9 + mínimo 9) / 2` |
| Kijun-sen | `(máximo 26 + mínimo 26) / 2` |
| Senkou A | `(Tenkan + Kijun) / 2` |
| Senkou B | `(máximo 52 + mínimo 52) / 2` |
| Señal | Precio sobre la nube → alcista |

### 8.9 Pivot Points

| Concepto | Fórmula |
|---|---|
| Pivot | `(alto + bajo + cierre) / 3` |
| R1 | `2 * Pivot - bajo` |
| S1 | `2 * Pivot - alto` |
| R2 | `Pivot + (alto - bajo)` |
| S2 | `Pivot - (alto - bajo)` |
| Señal | Precio sobre Pivot → alcista |

---

## 9. COMBINACIONES (sistemas)

### 9.1 Sistema Proporcional (8 números → 7 apuestas)

| # | Combinación |
|---|---|
| 1 | A – B – C – D – E |
| 2 | A – B – C – F – G |
| 3 | A – B – D – H – E |
| 4 | A – C – F – H – G |
| 5 | B – D – E – F – H |
| 6 | C – D – E – G – H |
| 7 | A – B – F – G – H |

**Garantía:** Si 4 de los 8 números salen, hay al menos 1 premio de 4ª categoría.

### 9.2 Sistema de Número Fijo

**Número fijo A + variables B, C, D, E, F, G, H:**

| # | Combinación |
|---|---|
| 1 | A – B – C – D – E |
| 2 | A – B – C – F – G |
| 3 | A – B – D – H – E |
| 4 | A – C – F – H – G |
| 5 | A – B – D – E – F |
| 6 | A – C – D – E – G |
| 7 | A – B – E – F – H |

**Garantía:** Si el número fijo sale + 3 variables, hay premio de 4ª categoría.

### 9.3 Sistema Total

| Números | Combinaciones |
|---|---|
| 8 | 56 |
| 9 | 126 |
| 10 | 252 |

**Garantía:** Único que garantiza 1ª categoría.

---

## 10. FRECUENCIA DE SÚPER BALOTA

### 10.1 Frecuencia histórica (ejemplo)

| SB | Veces | % |
|---|---|---|
| 14 | 13 | 11.1% |
| 10 | 13 | 11.1% |
| 13 | 10 | 8.5% |
| 09 | 10 | 8.5% |
| 08 | 9 | 7.7% |
| 11 | 8 | 6.8% |
| 02 | 8 | 6.8% |
| 05 | 7 | 6.0% |
| 01 | 6 | 5.1% |
| 04 | 6 | 5.1% |
| 06 | 6 | 5.1% |
| 12 | 6 | 5.1% |
| 15 | 6 | 5.1% |
| 03 | 5 | 4.3% |
| 07 | 5 | 4.3% |
| 16 | 5 | 4.3% |

### 10.2 Patrones de Súper Balota

| Patrón | Fórmula |
|---|---|
| Farol | `tiradas_sin_salir >= 20` |
| Caliente | `veces_10 >= 2 AND veces_5 >= 1` |
| Fría | `veces_10 == 0` |
| Inercia | `intervalos AUMENTAN` |
| Impulso | `intervalos SE REDUCEN` |
| Doblete | `intervalo_1 == intervalo_2` |
| Triple | `intervalo_1 == intervalo_2 == intervalo_3` |
| Estrella | `intervalo_promedio ≈ 5` |
| Repetición | `sb_actual == sb_anterior` |

---

## 11. VALIDACIONES

### 11.1 Validación de apuestas

| Concepto | Fórmula |
|---|---|
| Aciertos | `contar(números en apuesta AND en resultado)` |
| Aciertos SB | `sb_apuesta == sb_resultado` |
| Premio | Según categoría |

### 11.2 Tasa de acierto

| Concepto | Fórmula |
|---|---|
| Tasa | `aciertos_totales / apuestas_totales` |
| Tasa por estrategia | `aciertos_estrategia / apuestas_estrategia` |

### 11.3 Registro de apuestas

| Campo | Descripción |
|---|---|
| Fecha | Fecha del sorteo |
| Combinación | Números apostados |
| SB | Súper Balota apostada |
| Estrategia | Método usado |
| Aciertos | Números acertados |
| Aciertos SB | Súper Balota acertada |
| Premio | Categoría ganada |

---

## 12. INSTRUCCIONES PARA PRÓXIMA SESIÓN

1. Pegar este documento al inicio del chat.
2. Proporcionar la tabla de sorteos actualizada.
3. Recalcular:
   - Calientes/fríos
   - Faroles
   - Despertares
   - Inercia/impulso
   - Dobletes/triples/estrellas
   - Pares/impares
   - Grandes/pequeños
   - Calientes/fríos por sorteo
   - Intervalos cubiertos
   - Ausencias
   - Bilaterales
   - Repetidos
   - Sumas
   - Velas (todos los patrones)
   - RSI
   - Bandas de Bollinger
   - Medias móviles
   - MACD
   - Estocástico
   - Fibonacci
   - ATR
   - Ichimoku
   - Pivot Points
   - Súper Balota
4. Armar análisis desde cero.

---

**Fin del documento.**