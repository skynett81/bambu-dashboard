---
sidebar_position: 9
title: Comparación de materiales
description: Compara todos los materiales de impresión 3D lado a lado — resistencia, temperatura, precio, dificultad
---

# Comparación de materiales

Elegir el filamento correcto es tan importante como elegir la herramienta correcta para un trabajo. Este artículo te da el panorama completo — desde una simple tabla de comparación hasta valores de dureza Shore, HDT y una guía práctica de decisión.

## Gran tabla de comparación

| Material | Resistencia | Resist. temp | Flexibilidad | Resist. UV | Resist. quím | Req. boquilla | Recinto | Dificultad | Precio |
|---|---|---|---|---|---|---|---|---|---|
| PLA | ★★★ | ★ | ★ | ★ | ★ | Latón | No | ★ Fácil | Bajo |
| PETG | ★★★ | ★★ | ★★ | ★★ | ★★★ | Latón | No | ★★ | Bajo |
| ABS | ★★★ | ★★★ | ★★ | ★ | ★★ | Latón | SÍ | ★★★ | Bajo |
| ASA | ★★★ | ★★★ | ★★ | ★★★★ | ★★ | Latón | SÍ | ★★★ | Medio |
| TPU | ★★ | ★★ | ★★★★★ | ★★ | ★★ | Latón | No | ★★★ | Medio |
| PA (Nylon) | ★★★★ | ★★★ | ★★★ | ★★ | ★★★★ | Latón | SÍ | ★★★★ | Alto |
| PA-CF | ★★★★★ | ★★★★ | ★★ | ★★★ | ★★★★ | Acero endurecido | SÍ | ★★★★ | Alto |
| PC | ★★★★ | ★★★★ | ★★ | ★★ | ★★★ | Latón | SÍ | ★★★★ | Alto |
| PLA-CF | ★★★★ | ★★ | ★ | ★ | ★ | Acero endurecido | No | ★★ | Medio |

**Clave:**
- ★ = débil/bajo/malo
- ★★★ = medio/estándar
- ★★★★★ = excelente/mejor en su clase

---

## Elegir el material correcto — guía de decisión

¿No sabes qué elegir? Sigue estas preguntas:

### ¿Necesita resistir el calor?
**Sí** → ABS, ASA, PC o PA

- Algo de calor (hasta ~90 °C): **ABS** o **ASA**
- Mucho calor (por encima de 100 °C): **PC** o **PA**
- Resistencia máxima a la temperatura: **PC** (hasta ~120 °C) o **PA-CF** (hasta ~160 °C)

### ¿Necesita ser flexible?
**Sí** → **TPU**

- Muy blando (como goma): TPU 85A
- Flexible estándar: TPU 95A
- Semi-flexible: PETG o PA

### ¿Se usará en exteriores?
**Sí** → **ASA** es la elección clara

El ASA está desarrollado específicamente para la exposición UV y es superior al ABS en exteriores. El PETG es la segunda mejor opción si el ASA no está disponible.

### ¿Necesita resistencia máxima?
**Sí** → **PA-CF** o **PC**

- Compuesto ligero más resistente: **PA-CF**
- Termoplástico puro más resistente: **PC**
- Buena resistencia a menor precio: **PA (Nylon)**

### ¿La impresión más sencilla posible?
→ **PLA**

El PLA es el material más indulgente que existe. Temperatura más baja, sin requisitos de recinto, riesgo mínimo de deformación.

### ¿Contacto con alimentos?
→ **PLA** (con reservas)

El PLA en sí no es tóxico, pero:
- Usar boquilla de acero inoxidable (no de latón — puede contener plomo)
- Las impresiones FDM nunca son verdaderamente «seguras para alimentos» debido a la superficie porosa — las bacterias pueden crecer
- Evitar entornos exigentes (ácidos, agua caliente, lavavajillas)
- El PETG es una mejor opción para el contacto de un solo uso

---

## Dureza Shore explicada

La dureza Shore se usa para describir la dureza y rigidez de los elastómeros y materiales plásticos. Para la impresión 3D es particularmente relevante para el TPU y otros filamentos flexibles.

### Shore A — materiales flexibles

La escala Shore A va de 0 (extremadamente blando, casi como gel) a 100 (goma extremadamente dura). Los valores por encima de 90A empiezan a acercarse a los materiales plásticos rígidos.

| Valor Shore A | Dureza percibida | Ejemplo |
|---|---|---|
| 30A | Extremadamente blando | Silicona, gelatina |
| 50A | Muy blando | Goma blanda, tapones para los oídos |
| 70A | Blando | Tubo interior de coche, suela intermedia de zapatillas |
| 85A | Medianamente blando | Neumático de bicicleta, filamento TPU blando |
| 95A | Semi-rígido | Filamento TPU estándar |
| 100A ≈ 55D | Límite entre escalas | — |

**TPU 95A** es el estándar industrial para impresión 3D y ofrece un buen equilibrio entre elasticidad e imprimibilidad. **TPU 85A** es muy blando y requiere más paciencia durante la impresión.

### Shore D — materiales rígidos

Shore D se usa para termoplásticos más duros:

| Material | Shore D aproximado |
|---|---|
| PLA | ~80D |
| PETG | ~70D |
| ABS | ~75D |
| PC | ~80D |
| PA (Nylon) | ~70–75D |

:::tip No es la misma escala
Shore A 95 y Shore D 40 no son lo mismo, aunque los números puedan parecer cercanos. Las escalas son diferentes y se superponen solo parcialmente alrededor del límite 100A/55D. Siempre verifica qué escala indica el proveedor.
:::

---

## Tolerancias térmicas — HDT y VST

Saber a qué temperatura un material empieza a ceder es crítico para piezas funcionales. Se usan dos mediciones estándar:

- **HDT (Heat Deflection Temperature)** — la temperatura a la que el material se deflecta 0,25 mm bajo una carga estandarizada. Medida de la temperatura de servicio bajo carga.
- **VST (Vicat Softening Temperature)** — la temperatura a la que una aguja estandarizada penetra 1 mm en el material. Medida del punto de ablandamiento absoluto sin carga.

| Material | HDT (°C) | VST (°C) | Temp. máx práctica |
|---|---|---|---|
| PLA | 52–60 | 55–65 | ~50 °C |
| PETG | 70–80 | 75–85 | ~70 °C |
| ABS | 85–105 | 95–110 | ~90 °C |
| ASA | 90–105 | 95–108 | ~90 °C |
| TPU | 40–70 | varía | ~60 °C |
| PA (Nylon) | 70–180 | 180–220 | ~80–160 °C |
| PA-CF | 100–200 | 200–230 | ~100–180 °C |
| PC | 120–140 | 145–160 | ~120 °C |
| PLA-CF | 55–65 | 60–70 | ~55 °C |

:::warning PLA en entornos calurosos
Las piezas de PLA en un coche en verano es una receta para el desastre. El salpicadero de un coche aparcado puede alcanzar 80–90 °C. Usa ABS, ASA o PETG para todo lo que pueda quedar al sol o en el calor.
:::

:::info Las variantes de PA tienen propiedades muy diferentes
El PA es una familia de materiales, no un material único. El PA6 tiene una HDT más baja (~70 °C), mientras que el PA12 y el PA6-CF pueden estar en 160–200 °C. Siempre comprueba la hoja de datos para exactamente el filamento que estás usando.
:::

---

## Requisitos de boquilla

### Boquilla de latón (estándar)

Funciona para todos los materiales **sin** relleno de fibra de carbono o fibra de vidrio:
- PLA, PETG, ABS, ASA, TPU, PA, PC, PVA
- El latón es blando y se desgastará rápidamente con materiales abrasivos

### Boquilla de acero endurecido (obligatorio para compuestos)

**OBLIGATORIO** para:
- PLA-CF (PLA fibra de carbono)
- PETG-CF
- PA-CF
- ABS-GF (ABS fibra de vidrio)
- PPA-CF, PPA-GF
- Todos los filamentos con «-CF», «-GF», «-HF» o «fibra de carbono» en el nombre

El acero endurecido tiene menor conductividad térmica que el latón — compensar con +5–10 °C en la temperatura de boquilla.

:::danger Los filamentos de fibra de carbono destruyen rápidamente las boquillas de latón
Una boquilla de latón puede desgastarse notablemente después de solo unos cientos de gramos de filamento CF. El resultado es sub-extrusión gradual y dimensiones inexactas. Invierte en acero endurecido si imprimes compuestos.
:::

---

## Resumen rápido de materiales por caso de uso

| Caso de uso | Material recomendado | Alternativa |
|---|---|---|
| Decoración, figuras | PLA, PLA Silk | PETG |
| Piezas funcionales de interior | PETG | PLA+ |
| Exposición exterior | ASA | PETG |
| Piezas flexibles, fundas | TPU 95A | TPU 85A |
| Compartimiento motor, entornos calurosos | PA-CF, PC | ABS |
| Construcción ligera y rígida | PLA-CF | PA-CF |
| Material de soporte (soluble) | PVA | HIPS |
| Contacto con alimentos (limitado) | PLA (boquilla inox) | — |
| Resistencia máxima | PA-CF | PC |
| Transparente | PETG transparente | PC transparente |

Consulta los artículos individuales de materiales para información detallada sobre configuraciones de temperatura, solución de problemas y perfiles recomendados para impresoras Bambu Lab.
