---
sidebar_position: 4
title: Defectos de superficie
description: Diagnosticar y corregir problemas de superficie comunes — blobs, zits, líneas de capa, pie de elefante y más
---

# Defectos de superficie

La superficie de una impresión 3D revela mucho sobre lo que sucede dentro del sistema. La mayoría de los defectos de superficie tienen una o dos causas claras — con el diagnóstico correcto son sorprendentemente fáciles de corregir.

## Resumen rápido de diagnóstico

| Síntoma | Causa más común | Primera acción |
|---|---|---|
| Blobs y zits | Sobre-extrusión, colocación de la costura | Ajustar costura, calibrar flujo |
| Líneas de capa visibles | Z-wobble, capas demasiado gruesas | Cambiar a capas más finas, revisar eje Z |
| Pie de elefante | Primera capa demasiado ancha | Compensación de pie de elefante |
| Ringing/ghosting | Vibraciones a alta velocidad | Reducir velocidad, activar input shaper |
| Sub-extrusión | Boquilla obstruida, temperatura demasiado baja | Limpiar boquilla, aumentar temp |
| Sobre-extrusión | Caudal demasiado alto | Calibrar caudal |
| Pillowing | Pocas capas superiores, enfriamiento insuficiente | Aumentar capas superiores, aumentar ventilador |
| Delaminación | Temperatura demasiado baja, demasiado enfriamiento | Aumentar temp, reducir ventilador |

---

## Blobs y Zits

Los blobs son protuberancias irregulares en la superficie. Los zits son puntos en forma de punta de alfiler — a menudo a lo largo de la línea de costura.

### Causas

- **Sobre-extrusión** — se extruye demasiado plástico y se empuja hacia los lados
- **Mala colocación de la costura** — la costura «nearest» predeterminada acumula todas las transiciones en el mismo lugar
- **Problemas de retracción** — la retracción insuficiente crea acumulación de presión en la boquilla
- **Filamento húmedo** — la humedad crea microburbujasy goteos

### Soluciones

**Ajustes de costura en Bambu Studio:**
```
Bambu Studio → Calidad → Posición de costura
- Aligned: Todas las costuras en el mismo lugar (visible pero ordenado)
- Nearest: Punto más cercano (distribuye blobs aleatoriamente)
- Back: Detrás del objeto (recomendado para calidad visual)
- Random: Distribución aleatoria (mejor camuflaje de costura)
```

**Calibración de caudal:**
```
Bambu Studio → Calibración → Caudal
Ajustar en pasos de ±2 % hasta que desaparezcan los blobs
```

:::tip Costura en «Back» para calidad visual
Coloca la costura detrás del objeto para que sea menos visible. Combina con «Wipe on retract» para un acabado de costura más limpio.
:::

---

## Líneas de capa visibles

Todas las impresiones FDM tienen líneas de capa, pero deben ser consistentes y apenas visibles en impresiones normales. Una visibilidad anormal apunta a problemas específicos.

### Causas

- **Z-wobble** — el eje Z vibra o no está recto, creando un patrón ondulado en toda la altura
- **Capas demasiado gruesas** — la altura de capa superior a 0,28 mm es perceptible incluso en impresiones perfectas
- **Fluctuaciones de temperatura** — la temperatura de fusión inconsistente causa un ancho de capa variable
- **Diámetro de filamento inconsistente** — filamento barato con diámetro variable

### Soluciones

**Z-wobble:**
- Verificar que el husillo de avance Z (Z-leadscrew) esté limpio y lubricado
- Comprobar que el husillo no esté doblado (inspección visual al girar)
- Ver el artículo de mantenimiento para [lubricación del eje Z](/docs/kb/vedlikehold/smoring)

**Altura de capa:**
- Cambiar a 0,12 mm o 0,16 mm para una superficie más suave
- Recuerda que reducir a la mitad la altura de capa duplica el tiempo de impresión

**Fluctuaciones de temperatura:**
- Usar calibración PID (disponible a través del menú de mantenimiento de Bambu Studio)
- Evitar corrientes de aire que enfríen la boquilla durante la impresión

---

## Pie de elefante

El pie de elefante ocurre cuando la primera capa es más ancha que el resto del objeto — como si el objeto se «extendiera» en la base.

### Causas

- La primera capa se aplasta demasiado fuerte contra la placa (Z-offset demasiado ajustado)
- La temperatura de cama demasiado alta mantiene el plástico blando y fluido durante demasiado tiempo
- El enfriamiento insuficiente en la primera capa da al plástico más tiempo para extenderse

### Soluciones

**Compensación de pie de elefante en Bambu Studio:**
```
Bambu Studio → Calidad → Compensación de pie de elefante
Comenzar con 0,1–0,2 mm y ajustar hasta que desaparezca el pie
```

**Z-offset:**
- Recalibrar la altura de la primera capa
- Subir el Z-offset 0,05 mm a la vez hasta que desaparezca el pie

**Temperatura de cama:**
- Reducir la temperatura de cama 5–10 °C
- Para PLA: 55 °C suele ser suficiente — 65 °C puede causar pie de elefante

:::warning No compensar demasiado
Una compensación de pie de elefante demasiado alta puede crear un hueco entre la primera capa y el resto. Ajustar cuidadosamente en pasos de 0,05 mm.
:::

---

## Ringing y Ghosting

El ringing (también llamado «ghosting» o «echoing») es un patrón ondulado en la superficie justo después de aristas vivas o esquinas. El patrón «hace eco» desde la arista.

### Causas

- **Vibraciones** — la aceleración y desaceleración rápidas en las esquinas envía vibraciones a través del marco
- **Velocidad demasiado alta** — especialmente la velocidad de pared exterior por encima de 100 mm/s produce ringing marcado
- **Piezas sueltas** — bobina suelta, cadena de cables vibrante o impresora montada de forma imprecisa

### Soluciones

**Bambu Lab input shaper (Compensación de resonancia):**
```
Bambu Studio → Impresora → Compensación de resonancia
Bambu Lab X1C y P1S tienen acelerómetro integrado y se auto-calibran
```

**Reducir velocidad:**
```
Pared exterior: Reducir a 60–80 mm/s
Aceleración: Reducir del estándar a 3000–5000 mm/s²
```

**Verificación mecánica:**
- Verificar que la impresora descanse sobre una superficie estable
- Comprobar que la bobina no vibre en su soporte
- Apretar todos los tornillos accesibles en los paneles exteriores del marco

:::tip X1C y P1S auto-calibran el ringing
Bambu Lab X1C y P1S tienen calibración de acelerómetro integrada que se ejecuta automáticamente al inicio. Ejecutar «Calibración completa» desde el menú de mantenimiento si el ringing aparece después de un período de uso.
:::

---

## Sub-extrusión

La sub-extrusión ocurre cuando la impresora extruye demasiado poco plástico. El resultado son paredes delgadas y débiles, huecos visibles entre capas y una superficie áspera.

### Causas

- **Boquilla parcialmente obstruida** — la acumulación de carbono reduce el flujo
- **Temperatura de boquilla demasiado baja** — el plástico no es suficientemente fluido
- **Engranaje desgastado** en el mecanismo del extrusor que no agarra bien el filamento
- **Velocidad demasiado alta** — el extrusor no puede mantener el ritmo del flujo deseado

### Soluciones

**Cold pull:**
```
1. Calentar la boquilla a 220 °C
2. Empujar el filamento manualmente
3. Enfriar la boquilla a 90 °C (PLA) mientras se mantiene la presión
4. Tirar del filamento rápidamente
5. Repetir hasta que lo que sale esté limpio
```

**Ajuste de temperatura:**
- Aumentar la temperatura de la boquilla 5–10 °C y volver a probar
- Funcionar a temperatura demasiado baja es una causa común de sub-extrusión

**Calibración de caudal:**
```
Bambu Studio → Calibración → Caudal
Aumentar gradualmente hasta que desaparezca la sub-extrusión
```

**Revisar el engranaje del extrusor:**
- Retirar el filamento e inspeccionar el engranaje
- Limpiar con un pequeño cepillo si hay polvo de filamento en los dientes

---

## Sobre-extrusión

La sobre-extrusión produce un cordón demasiado ancho — la superficie parece suelta, brillante o desigual, con tendencia a blobs.

### Causas

- **Caudal demasiado alto** (EM — Multiplicador de extrusión)
- **Diámetro de filamento incorrecto** — filamento de 2,85 mm con perfil de 1,75 mm causa sobre-extrusión masiva
- **Temperatura de boquilla demasiado alta** hace el plástico demasiado fluido

### Soluciones

**Calibración de caudal:**
```
Bambu Studio → Calibración → Caudal
Reducir en pasos del 2 % hasta que la superficie sea uniforme y mate
```

**Verificar el diámetro del filamento:**
- Medir el diámetro real del filamento con un calibre en 5–10 lugares a lo largo del filamento
- Una desviación media superior a 0,05 mm indica filamento de baja calidad

---

## Pillowing

El pillowing son capas superiores abultadas e irregulares con «almohadillas» de plástico entre las capas superiores. Particularmente notable con relleno bajo y pocas capas superiores.

### Causas

- **Pocas capas superiores** — el plástico sobre el relleno se hunde en los huecos
- **Enfriamiento insuficiente** — el plástico no se solidifica lo suficientemente rápido para hacer puente sobre los huecos del relleno
- **Relleno demasiado bajo** — los grandes huecos en el relleno son difíciles de cubrir

### Soluciones

**Aumentar el número de capas superiores:**
```
Bambu Studio → Calidad → Capas de carcasa superior
Mínimo: 4 capas
Recomendado para superficie suave: 5–6 capas
```

**Aumentar el enfriamiento:**
- El PLA debe tener el ventilador de enfriamiento al 100 % desde la capa 3
- El enfriamiento insuficiente es la causa más común del pillowing

**Aumentar el relleno:**
- Pasar del 10–15 % al 20–25 % si el pillowing persiste
- El patrón giróide da una superficie de puente más uniforme que las líneas

:::tip Planchado (Ironing)
La función «ironing» de Bambu Studio pasa la boquilla sobre la capa superior una vez más para alisar la superficie. Activar en Calidad → Ironing para el mejor acabado de capa superior.
:::

---

## Delaminación (separación de capas)

La delaminación ocurre cuando las capas no se adhieren correctamente entre sí. En el peor caso, la impresión se agrieta a lo largo de las líneas de capa.

### Causas

- **Temperatura de boquilla demasiado baja** — el plástico no se funde bien en la capa inferior
- **Demasiado enfriamiento** — el plástico se solidifica demasiado rápido antes de tener tiempo de fusionarse
- **Grosor de capa demasiado grande** — más del 80 % del diámetro de la boquilla da mala fusión
- **Velocidad demasiado alta** — tiempo de fusión reducido por mm de trayectoria

### Soluciones

**Aumentar temperatura:**
- Probar +10 °C desde el estándar y observar
- ABS y ASA son particularmente sensibles — requieren calefacción de cámara controlada

**Reducir enfriamiento:**
- ABS: ventilador de enfriamiento APAGADO (0 %)
- PETG: 20–40 % máx
- PLA: puede tolerar enfriamiento completo, pero reducir si ocurre delaminación

**Grosor de capa:**
- Usar máx 75 % del diámetro de la boquilla
- Con boquilla de 0,4 mm: altura de capa máxima recomendada de 0,30 mm

**Verificar que el recinto esté suficientemente caliente (ABS/ASA/PA/PC):**
```
Bambu Lab X1C/P1S: Dejar que la cámara se caliente a 40–60 °C
antes de que comience la impresión — no abrir la puerta durante la impresión
```

---

## Consejos generales de solución de problemas

1. **Cambiar una cosa a la vez** — probar con una pequeña impresión de calibración entre cada cambio
2. **Secar el filamento primero** — muchos defectos de superficie son en realidad síntomas de humedad
3. **Limpiar la boquilla** — una obstrucción parcial produce defectos de superficie inconsistentes difíciles de diagnosticar
4. **Ejecutar una calibración completa** desde el menú de mantenimiento de Bambu Studio después de ajustes importantes
5. **Usar Bambu Dashboard** para rastrear qué configuraciones produjeron los mejores resultados a lo largo del tiempo
