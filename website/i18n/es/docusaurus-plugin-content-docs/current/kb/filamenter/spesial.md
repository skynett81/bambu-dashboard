---
sidebar_position: 7
title: Materiales especiales
description: ASA, PC, PP, PVA, HIPS y otros materiales especiales para casos de uso avanzados
---

# Materiales especiales

Más allá de los materiales comunes, existen una serie de materiales especiales para casos de uso específicos — desde piezas exteriores resistentes a los UV hasta material de soporte soluble en agua. Aquí tienes un resumen práctico.

---

## ASA (Acrilonitrilo Estireno Acrilato)

El ASA es la mejor alternativa al ABS para uso en exteriores. Se imprime casi de forma idéntica al ABS, pero tolera mucho mejor la luz solar y las inclemencias del tiempo.

### Configuraciones

| Parámetro | Valor |
|-----------|-------|
| Temperatura de boquilla | 240–260 °C |
| Temperatura de cama | 90–110 °C |
| Temperatura de cámara | 45–55 °C |
| Enfriamiento de pieza | 0–20% |
| Secado | Recomendado (70 °C / 4–6 h) |

### Propiedades

- **Resistente a los UV:** Diseñado específicamente para exposición solar prolongada sin amarillear ni agrietarse
- **Estable al calor:** Temperatura de transición vítrea ~100 °C
- **Resistente a impactos:** Mejor resistencia a impactos que el ABS
- **Recinto necesario:** Se deforma de la misma manera que el ABS — X1C/P1S da los mejores resultados

:::tip ASA en lugar de ABS en exteriores
¿Va a vivir la pieza en exteriores con cualquier clima (sol, lluvia, heladas)? Elige ASA en lugar de ABS. El ASA aguanta muchos años sin degradación visible. El ABS empieza a agrietarse y amarillear después de meses.
:::

### Casos de uso
- Soportes, carcasas y puntos de fijación exteriores
- Piezas de carrocería de coches, soportes de antena
- Mobiliario de jardín y entornos exteriores
- Señalización y dispensadores en el exterior de edificios

---

## PC (Policarbonato)

El policarbonato es uno de los plásticos más resistentes y con mayor resistencia a impactos que se pueden imprimir en 3D. Es transparente y soporta temperaturas extremas.

### Configuraciones

| Parámetro | Valor |
|-----------|-------|
| Temperatura de boquilla | 260–310 °C |
| Temperatura de cama | 100–120 °C |
| Temperatura de cámara | 50–70 °C |
| Enfriamiento de pieza | 0–20% |
| Secado | Requerido (80 °C / 8–12 h) |

:::danger El PC requiere hotend de metal completo y alta temperatura
El PC no se funde a temperaturas estándar de PLA. El Bambu X1C con la configuración de boquilla correcta maneja el PC. Siempre verifica que los componentes PTFE del hotend soporten tu temperatura — el PTFE estándar no aguanta por encima de 240–250 °C de forma continua.
:::

### Propiedades

- **Muy resistente a impactos:** Resistente a la rotura incluso a bajas temperaturas
- **Transparente:** Puede usarse para ventanas, lentes y componentes ópticos
- **Estable al calor:** Temperatura de transición vítrea ~147 °C — la más alta de los materiales comunes
- **Higroscópico:** Absorbe humedad rápidamente — siempre secar bien
- **Deformación:** Fuerte contracción — requiere recinto y brim

### Casos de uso
- Viseras de seguridad y cubiertas protectoras
- Carcasas eléctricas que soportan calor
- Portaobjetivos y componentes ópticos
- Marcos de robots y cuerpos de drones

---

## PP (Polipropileno)

El polipropileno es uno de los materiales más difíciles de imprimir, pero ofrece propiedades únicas que ningún otro material plástico puede igualar.

### Configuraciones

| Parámetro | Valor |
|-----------|-------|
| Temperatura de boquilla | 220–250 °C |
| Temperatura de cama | 80–100 °C |
| Enfriamiento de pieza | 20–50% |
| Secado | Recomendado (70 °C / 6 h) |

### Propiedades

- **Resistente químicamente:** Soporta ácidos fuertes, bases, alcohol y la mayoría de solventes
- **Ligero y flexible:** Baja densidad, soporta flexión repetida (efecto de bisagra viva)
- **Mala adhesión:** Adhiere mal a sí mismo y a la placa de construcción — ese es el desafío
- **No tóxico:** Seguro para el contacto con alimentos (dependiendo del color y los aditivos)

:::warning El PP adhiere mal a todo
El PP es famoso por no adherirse a la placa de construcción. Usar cinta PP (como cinta Tesa o cinta PP dedicada) sobre la Engineering Plate, o barra de pegamento especialmente formulada para PP. Se requiere un brim de 15–20 mm.
:::

### Casos de uso
- Botellas de laboratorio y contenedores de productos químicos
- Piezas de almacenamiento de alimentos y utensilios de cocina
- Bisagras vivas (tapas de cajas que aguantan miles de ciclos de apertura/cierre)
- Componentes de automoción que resisten productos químicos

---

## PVA (Alcohol polivinílico) — material de soporte soluble en agua

El PVA es un material especial utilizado exclusivamente como material de soporte. Se disuelve en agua y deja una superficie limpia en el modelo.

### Configuraciones

| Parámetro | Valor |
|-----------|-------|
| Temperatura de boquilla | 180–220 °C |
| Temperatura de cama | 35–60 °C |
| Secado | Crítico (55 °C / 6–8 h) |

:::danger El PVA es extremadamente higroscópico
El PVA absorbe humedad más rápido que cualquier otro filamento común. Secar el PVA cuidadosamente ANTES de imprimir, y siempre almacenar en una caja sellada con sílice. El PVA húmedo se queda pegado en la boquilla y es muy difícil de retirar.
:::

### Uso y disolución

1. Imprimir el modelo con PVA como material de soporte (requiere impresora multimaterial — AMS)
2. Colocar la impresión terminada en agua tibia (30–40 °C)
3. Dejar reposar 30–120 minutos, cambiar el agua según sea necesario
4. Enjuagar con agua limpia y dejar secar

**Usar siempre un extrusor dedicado para el PVA** si es posible — los residuos de PVA en un extrusor estándar pueden arruinar la próxima impresión.

### Casos de uso
- Estructuras de soporte complejas imposibles de retirar manualmente
- Soporte de voladizo interno sin marcas visibles en la superficie
- Modelos con cavidades y canales internos

---

## HIPS (Poliestireno de alto impacto) — material de soporte soluble en solventes

El HIPS es otro material de soporte, diseñado para usarse con ABS. Se disuelve en **limoneno** (solvente cítrico).

### Configuraciones

| Parámetro | Valor |
|-----------|-------|
| Temperatura de boquilla | 220–240 °C |
| Temperatura de cama | 90–110 °C |
| Temperatura de cámara | 45–55 °C |
| Secado | Recomendado (65 °C / 4–6 h) |

### Uso con ABS

El HIPS se imprime a las mismas temperaturas que el ABS y adhiere bien a él. Después de imprimir, el HIPS se disuelve colocando la impresión en D-limoneno durante 30–60 minutos.

:::warning El limoneno no es agua
El D-limoneno es un solvente extraído de cáscaras de naranja. Es relativamente inofensivo, pero usar guantes de todas formas y trabajar en un espacio ventilado. No verter el limoneno usado por el desagüe — llevarlo a un punto de reciclaje.
:::

### Comparación: PVA vs HIPS

| Propiedad | PVA | HIPS |
|-----------|-----|------|
| Solvente | Agua | D-limoneno |
| Material compatible | Compatible con PLA | Compatible con ABS |
| Sensibilidad a la humedad | Extremadamente alta | Moderada |
| Costo | Alto | Moderado |
| Disponibilidad | Buena | Moderada |

---

## PVB / Fibersmooth — material suavizable con etanol

El PVB (Polivinil butiral) es un material único que puede **suavizarse con etanol (alcohol)** — de manera similar a como el ABS puede suavizarse con acetona, pero mucho más seguro.

### Configuraciones

| Parámetro | Valor |
|-----------|-------|
| Temperatura de boquilla | 190–210 °C |
| Temperatura de cama | 35–55 °C |
| Enfriamiento de pieza | 80–100% |
| Secado | Recomendado (55 °C / 4 h) |

### Suavizado con etanol

1. Imprimir el modelo con la configuración estándar de PVB
2. Aplicar alcohol isopropílico (IPA) al 99 % o etanol con un pincel
3. Dejar secar 10–15 minutos — la superficie se nivela uniformemente
4. Repetir si es necesario para una superficie más suave
5. Alternativa: aplicar y colocar en un recipiente cerrado durante 5 minutos para tratamiento con vapor

:::tip Más seguro que la acetona
El IPA/etanol es mucho más seguro de manejar que la acetona. El punto de inflamación es más alto y los vapores son mucho menos tóxicos. Sin embargo, se recomienda buena ventilación.
:::

### Casos de uso
- Figuritas y decoración donde se desea una superficie suave
- Prototipos que se van a presentar
- Piezas que se van a pintar — una superficie suave da mejor adhesión de la pintura

---

## Placas de construcción recomendadas para materiales especiales

| Material | Placa recomendada | ¿Barra de pegamento? |
|----------|------------------|---------------------|
| ASA | Engineering Plate / High Temp Plate | Sí |
| PC | High Temp Plate | Sí (requerido) |
| PP | Engineering Plate + cinta PP | Cinta específica para PP |
| PVA | Cool Plate / Textured PEI | No |
| HIPS | Engineering Plate / High Temp Plate | Sí |
| PVB | Cool Plate / Textured PEI | No |
