---
sidebar_position: 8
title: Perfiles de impresión y configuraciones
description: Entender y personalizar perfiles de impresión en Bambu Studio — velocidad, temperatura, retracción y configuraciones de calidad
---

# Perfiles de impresión y configuraciones

Un perfil de impresión es una colección de configuraciones que determina exactamente cómo trabaja la impresora — desde la temperatura y la velocidad hasta la retracción y la altura de capa. El perfil correcto es la diferencia entre una impresión perfecta y un fracaso.

## ¿Qué es un perfil de impresión?

Bambu Studio distingue entre tres tipos de perfiles:

- **Perfil de filamento** — temperatura, enfriamiento, retracción y secado para un material específico
- **Perfil de proceso** — altura de capa, velocidad, relleno y configuraciones de soporte
- **Perfil de impresora** — configuraciones específicas de la máquina (se configuran automáticamente para las impresoras Bambu Lab)

Bambu Studio proporciona perfiles genéricos para todos los filamentos Bambu Lab y una gama de materiales de terceros. Proveedores de terceros como Polyalkemi, eSUN y Fillamentum también crean perfiles optimizados y finamente ajustados para su filamento específico.

Los perfiles se pueden importar, exportar y compartir libremente entre usuarios.

## Importar perfiles en Bambu Studio

1. Descargar el perfil (archivo JSON) desde el sitio web del proveedor o MakerWorld
2. Abrir Bambu Studio
3. Ir a **Archivo → Importar → Importar configuración**
4. Seleccionar el archivo descargado
5. El perfil aparece bajo la selección de filamento en el slicer

:::tip Organización
Dale a los perfiles un nombre descriptivo, p.ej. «Polyalkemi PLA HF 0,20mm Balanced», para encontrar fácilmente el perfil correcto la próxima vez.
:::

## Configuraciones importantes explicadas

### Temperatura

La temperatura es la configuración individual más importante. Una temperatura demasiado baja produce mala adhesión entre capas y sub-relleno. Demasiado alta produce stringing, superficie burbujeante y filamento quemado.

| Configuración | Descripción | PLA típico | PETG típico | ABS típico |
|---|---|---|---|---|
| Temperatura de boquilla | Temperatura de fusión | 200–220 °C | 230–250 °C | 240–260 °C |
| Temperatura de cama | Calor del plato de construcción | 55–65 °C | 70–80 °C | 90–110 °C |
| Temperatura de cámara | Temp. del recinto | No necesario | Opcional | 40–60 °C recomendado |

Bambu Lab X1C y la serie P1 tienen calefacción de cámara activa. Para ABS y ASA, esto es crítico para evitar la deformación y la delaminación.

### Velocidad

Las impresoras Bambu Lab pueden funcionar extremadamente rápido, pero mayor velocidad no siempre significa mejores resultados. La velocidad de la pared exterior en particular afecta la superficie.

| Configuración | Qué afecta | Modo calidad | Equilibrado | Rápido |
|---|---|---|---|---|
| Pared exterior | Resultado de superficie | 45–60 mm/s | 100 mm/s | 150+ mm/s |
| Pared interior | Resistencia estructural | 100 mm/s | 150 mm/s | 200+ mm/s |
| Relleno | Relleno interior | 150 mm/s | 200 mm/s | 300+ mm/s |
| Capa superior | Superficie superior | 45–60 mm/s | 80 mm/s | 100 mm/s |
| Capa inferior | Primera capa | 30–50 mm/s | 50 mm/s | 50 mm/s |

:::tip La velocidad de pared exterior es la clave de la calidad de superficie
Reduce la velocidad de pared exterior a 45–60 mm/s para un acabado sedoso. Esto se aplica especialmente al PLA Silk y filamentos mate. Las paredes interiores y el relleno pueden seguir funcionando rápido sin afectar la superficie.
:::

### Retracción

La retracción tira ligeramente del filamento hacia atrás en la boquilla cuando la impresora se mueve sin extruir. Esto previene el stringing (hilos finos entre las piezas). Las configuraciones incorrectas de retracción causan stringing (muy poca) o atascos (demasiada).

| Material | Distancia de retracción | Velocidad de retracción | Notas |
|---|---|---|---|
| PLA | 0,8–2,0 mm | 30–50 mm/s | Estándar para la mayoría |
| PETG | 1,0–3,0 mm | 20–40 mm/s | Demasiado = atasco |
| ABS | 0,5–1,5 mm | 30–50 mm/s | Similar al PLA |
| TPU | 0–1,0 mm | 10–20 mm/s | ¡Mínimo! O desactivar |
| Nylon | 1,0–2,0 mm | 30–40 mm/s | Requiere filamento seco |

:::warning Retracción de TPU
Para TPU y otros materiales flexibles: usar retracción mínima (0–1 mm) o desactivar completamente. Demasiada retracción hace que el filamento blando se doble y obstruya el tubo Bowden, provocando un atasco.
:::

### Altura de capa

La altura de capa determina el equilibrio entre el nivel de detalle y la velocidad de impresión. Una altura de capa baja da detalles más finos y superficies más suaves, pero tarda mucho más.

| Altura de capa | Descripción | Caso de uso |
|---|---|---|
| 0,08 mm | Ultrafino | Figuras en miniatura, modelos detallados |
| 0,12 mm | Fino | Calidad visual, texto, logotipos |
| 0,16 mm | Alta calidad | Estándar para la mayoría de impresiones |
| 0,20 mm | Equilibrado | Buen equilibrio tiempo/calidad |
| 0,28 mm | Rápido | Piezas funcionales, prototipos |

Bambu Studio opera con configuraciones de proceso como «0,16mm High Quality» y «0,20mm Balanced Quality» — estas establecen la altura de capa y ajustan automáticamente la velocidad y el enfriamiento.

### Relleno (Infill)

El relleno determina cuánto material llena el interior de la impresión. Más relleno = más resistente, más pesado y mayor tiempo de impresión.

| Porcentaje | Caso de uso | Patrón recomendado |
|---|---|---|
| 10–15 % | Decoración, visual | Giróide |
| 20–30 % | Uso general | Cúbico, Giróide |
| 40–60 % | Piezas funcionales | Cúbico, Panal |
| 80–100 % | Resistencia máxima | Rectilíneo |

:::tip El giróide es el rey
El patrón giróide ofrece la mejor relación resistencia/peso y es isotrópico — igualmente resistente en todas las direcciones. También es más rápido de imprimir que el panal y queda bien en modelos abiertos. Elección predeterminada para la mayoría de las situaciones.
:::

## Consejos de perfil por material

### PLA — Enfocado en la calidad

El PLA es indulgente y fácil de trabajar. Foco en la calidad de superficie:

- **Pared exterior:** 60 mm/s para una superficie perfecta, especialmente con PLA Silk
- **Ventilador de enfriamiento:** 100 % desde la capa 3 — crítico para detalles nítidos y puentes
- **Brim:** No necesario con PLA limpio y placa bien calibrada
- **Altura de capa:** 0,16 mm High Quality ofrece un buen equilibrio para piezas decorativas

### PETG — Equilibrio

El PETG es más resistente que el PLA, pero más exigente de afinar:

- **Configuración de proceso:** 0,16 mm High Quality o 0,20 mm Balanced Quality
- **Ventilador de enfriamiento:** 30–50 % — demasiado enfriamiento causa mala adhesión entre capas e impresiones frágiles
- **Z-hop:** Activar para evitar que la boquilla arrastre sobre la superficie durante los movimientos de desplazamiento
- **Stringing:** Ajustar la retracción e imprimir ligeramente más caliente en lugar de más frío

### ABS — El recinto lo es todo

El ABS imprime bien, pero requiere un entorno controlado:

- **Ventilador de enfriamiento:** APAGADO (0 %) — ¡absolutamente crítico! El enfriamiento causa delaminación y deformación
- **Recinto:** Cerrar las puertas y dejar que la cámara se caliente a 40–60 °C antes de que comience la impresión
- **Brim:** 5–8 mm recomendado para piezas grandes planas — evita la deformación en las esquinas
- **Ventilación:** Asegurar buena ventilación en la habitación — el ABS emite vapores de estireno

### TPU — Lento y cuidadoso

Los materiales flexibles requieren un enfoque completamente diferente:

- **Velocidad:** Máx 30 mm/s — imprimir demasiado rápido hace que el filamento se doble
- **Retracción:** Mínima (0–1 mm) o desactivar completamente
- **Direct drive:** El TPU funciona solo en máquinas Bambu Lab con direct drive integrado
- **Altura de capa:** 0,20 mm Balanced da buena fusión de capas sin demasiada tensión

### Nylon — El filamento seco lo es todo

El nylon es higroscópico y absorbe humedad en pocas horas:

- **Siempre secar:** 70–80 °C durante 8–12 horas antes de imprimir
- **Recinto:** Pasar desde la caja secadora directamente al AMS para mantener el filamento seco
- **Retracción:** Moderada (1,0–2,0 mm) — el nylon húmedo produce mucho más stringing
- **Plato de construcción:** Engineering Plate con pegamento, o plato Garolite para mejor adhesión

## Preajustes integrados de Bambu Lab

Bambu Studio tiene perfiles integrados para toda la gama de productos Bambu Lab:

- Bambu Lab Basic PLA, PETG, ABS, TPU, PVA, PA, PC, ASA
- Materiales de soporte Bambu Lab (Support W, Support G)
- Bambu Lab Especialidad (PLA-CF, PETG-CF, ABS-GF, PA-CF, PPA-CF, PPA-GF)
- Perfiles genéricos (Generic PLA, Generic PETG, etc.) que sirven como punto de partida para filamento de terceros

Los perfiles genéricos son un buen punto de partida. Afinar la temperatura ±5 °C basándose en el filamento real.

## Perfiles de terceros

Muchos proveedores líderes ofrecen perfiles de Bambu Studio listos para usar, optimizados para su filamento específico:

| Proveedor | Perfiles disponibles | Descarga |
|---|---|---|
| [Polyalkemi](https://polyalkemi.no) | PLA, PLA High Speed, PETG, PETG-CF, ABS | [Perfiles Bambu Lab](https://gammel.polyalkemi.no/bambulabprofiler/) |
| [eSUN](https://www.esun3d.com) | PLA+, ePLA-Lite, PETG, eABS | [Perfiles eSUN](https://www.esun3d.com/bambu-lab-3d-printer-filament-setting/) |
| [Fillamentum](https://fillamentum.com) | Nonoilen PLA, PLA, PET-G | [Perfiles Fillamentum](https://fillamentum.com/pages/bambu-lab-print-profiles) |
| [Spectrum](https://spectrumfilaments.com) | PETG FR V0, PETG-HT100 | [Perfiles Spectrum](https://spectrumfilaments.com/bambu-lab-profiles/) |
| [Fiberlogy](https://fiberlogy.com) | Easy-PETG, Matte-PETG, TPU 30D | [Perfiles Fiberlogy](https://fiberlogy.com/en/printing-profiles/) |
| [add:north](https://addnorth.com) | PLA, PETG, AduraX, X-PLA | [Perfiles add:north](https://addnorth.com/printing-profiles) |

:::info ¿Dónde encontrar perfiles?
- **Bambu Studio:** Perfiles integrados para materiales Bambu Lab y muchos de terceros
- **Sitio web del proveedor:** Buscar «Bambu Studio profile» o «JSON profile» en descargas
- **Bambu Dashboard:** En el panel de Perfiles de impresión en la sección Herramientas
- **MakerWorld:** Los perfiles se comparten a menudo junto con modelos por otros usuarios
:::

## Exportar y compartir perfiles

Los perfiles personalizados se pueden exportar y compartir con otros:

1. Ir a **Archivo → Exportar → Exportar configuración**
2. Seleccionar qué perfiles (filamento, proceso, impresora) exportar
3. Guardar como archivo JSON
4. Compartir el archivo directamente o subir a MakerWorld

Esto es especialmente útil si has afinado un perfil con el tiempo y quieres conservarlo al reinstalar Bambu Studio.

---

## Solución de problemas con perfiles

### Stringing

Hilos finos entre piezas impresas — probar en este orden:

1. Aumentar la distancia de retracción 0,5 mm
2. Reducir la temperatura de impresión 5 °C
3. Activar «Wipe on retract»
4. Verificar que el filamento esté seco

### Sub-relleno / huecos en las paredes

La impresión no parece sólida o tiene huecos:

1. Verificar que la configuración del diámetro del filamento sea correcta (1,75 mm)
2. Calibrar el caudal en Bambu Studio (Calibración → Caudal)
3. Aumentar la temperatura 5 °C
4. Verificar si hay boquilla parcialmente obstruida

### Mala adhesión entre capas

Las capas no se mantienen bien juntas:

1. Aumentar la temperatura 5–10 °C
2. Reducir el ventilador de enfriamiento (especialmente PETG y ABS)
3. Reducir la velocidad de impresión
4. Verificar que el recinto esté suficientemente caliente (para ABS/ASA)
