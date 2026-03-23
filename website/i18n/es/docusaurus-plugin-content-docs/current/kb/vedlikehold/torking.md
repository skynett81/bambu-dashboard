---
sidebar_position: 5
title: Secado de filamento
description: Por qué, cuándo y cómo secar el filamento — temperaturas, tiempos y consejos de almacenamiento para todos los materiales
---

# Secado de filamento

El filamento húmedo es una de las causas más frecuentes y más subestimadas de las malas impresiones. Incluso el filamento que parece seco puede haber absorbido suficiente humedad para arruinar el resultado — especialmente para materiales como el nylon y el PVA.

## ¿Por qué secar el filamento?

Muchos tipos de plástico son **higroscópicos** — absorben humedad del aire con el tiempo. Cuando el filamento húmedo pasa por la boquilla caliente, el agua se evapora bruscamente y crea microburbujeas en el plástico fundido. El resultado es:

- **Chasquidos y crujidos** durante la impresión
- **Niebla o vapor** visible desde la boquilla
- **Stringing y pelos** que no se pueden eliminar ajustando
- **Superficie rugosa o granulosa** — especialmente en las capas superiores
- **Piezas débiles** con mala adhesión entre capas y microgrietas
- **Acabado mate o apagado** en materiales que normalmente deberían ser brillantes o sedosos

:::warning Secar el filamento ANTES de ajustar configuraciones
Muchos usuarios pasan horas ajustando la retracción y la temperatura sin ver mejoras — porque la causa es filamento húmedo. Siempre secar el filamento y volver a probar antes de cambiar las configuraciones de impresión.
:::

## ¿Qué materiales necesitan secado?

Todos los tipos de plástico pueden volverse húmedos, pero el grado de higroscopicidad varía enormemente:

| Material | Higroscópico | Temp. de secado | Tiempo de secado | Prioridad |
|---|---|---|---|---|
| PLA | Bajo | 45–50 °C | 4–6 horas | Opcional |
| PETG | Medio | 65 °C | 4–6 horas | Recomendado |
| ABS | Medio | 65–70 °C | 4 horas | Recomendado |
| TPU | Medio | 50–55 °C | 4–6 horas | Recomendado |
| ASA | Medio | 65 °C | 4 horas | Recomendado |
| PC | Alto | 70–80 °C | 6–8 horas | Requerido |
| PA/Nylon | Extremadamente alto | 70–80 °C | 8–12 horas | REQUERIDO |
| PA-CF | Extremadamente alto | 70–80 °C | 8–12 horas | REQUERIDO |
| PVA | Extremadamente alto | 45–50 °C | 4–6 horas | REQUERIDO |

:::tip El nylon y el PVA son críticos
PA/Nylon y PVA pueden absorber suficiente humedad para volverse imposibles de imprimir en **pocas horas** en condiciones normales de interior. Nunca abras una nueva bobina de estos materiales sin secarla inmediatamente después — y siempre imprime desde una caja sellada o caja secadora.
:::

## Señales de filamento húmedo

No siempre necesitas secar el filamento según una tabla. Aprende a reconocer los síntomas:

| Síntoma | ¿Humedad? | Otras causas posibles |
|---|---|---|
| Chasquidos/crujidos | Sí, muy probable | Boquilla parcialmente obstruida |
| Niebla/vapor desde la boquilla | Sí, casi seguro | Ninguna otra causa |
| Superficie rugosa, granulosa | Sí, posible | Temp. demasiado baja, velocidad demasiado alta |
| Stringing que no desaparece | Sí, posible | Retracción incorrecta, temp. demasiado alta |
| Piezas débiles y frágiles | Sí, posible | Temp. demasiado baja, relleno incorrecto |
| Cambio de color o acabado mate | Sí, posible | Temp. incorrecta, plástico quemado |

## Métodos de secado

### Secadora de filamento (recomendado)

Las secadoras de filamento dedicadas son la solución más simple y segura. Mantienen una temperatura precisa y te permiten imprimir directamente desde la secadora durante todo el trabajo.

Modelos populares:
- **eSun eBOX** — asequible, puede imprimir desde la caja, soporta la mayoría de materiales
- **Bambu Lab Filament Dryer** — optimizado para Bambu AMS, soporta temperaturas altas
- **Polymaker PolyDryer** — buen termómetro y buena regulación de temperatura
- **Sunlu S2 / S4** — económico, varias bobinas a la vez

Procedimiento:
```
1. Colocar bobinas en la secadora
2. Ajustar la temperatura según la tabla anterior
3. Ajustar el temporizador al tiempo recomendado
4. Esperar — no interrumpir el proceso
5. Imprimir directamente desde la secadora o sellar inmediatamente
```

### Deshidratador de alimentos

Un deshidratador de alimentos ordinario funciona sorprendentemente bien como secadora de filamento:

- Asequible (disponible desde ~25 €)
- Buena circulación de aire
- Soporta temperaturas de hasta 70–75 °C en muchos modelos

:::warning Verificar la temperatura máxima del deshidratador
Muchos deshidratadores de alimentos baratos tienen termostatos imprecisos y pueden variar ±10 °C. Medir la temperatura real con un termómetro para PA y PC que requieren calor alto.
:::

### Horno

El horno puede usarse en casos de urgencia, pero requiere precaución:

:::danger NUNCA usar un horno ordinario por encima de 60 °C para PLA — ¡se deforma!
El PLA comienza a ablandarse ya a 55–60 °C. Un horno caliente puede destruir bobinas, fundir el núcleo y hacer que el filamento sea inutilizable. Nunca uses el horno para PLA a menos que sepas que la temperatura está calibrada con precisión y sea inferior a 50 °C.
:::

Para materiales que toleran temperaturas más altas (ABS, ASA, PA, PC):
```
1. Precalentar el horno a la temperatura deseada
2. Verificar la temperatura real con un termómetro
3. Colocar bobinas en una rejilla (no directamente en el fondo del horno)
4. Dejar la puerta ligeramente entreabierta para que escape la humedad
5. Supervisar la primera vez que uses este método
```

### Bambu Lab AMS

Bambu Lab AMS Lite y AMS Pro tienen una función de secado integrada (calor bajo + circulación de aire). Esto no reemplaza el secado completo, pero mantiene el filamento ya secado durante la impresión.

- AMS Lite: Secado pasivo — limita la absorción de humedad, no seca activamente
- AMS Pro: Calefacción activa — algo de secado posible, pero no tan efectivo como una secadora dedicada

## Almacenamiento del filamento

El almacenamiento correcto después del secado es tan importante como el propio proceso de secado:

### Mejores soluciones

1. **Armario seco con silica gel** — armario dedicado con higrómetro y desecante. Mantiene la humedad constantemente baja (idealmente por debajo del 20 % HR)
2. **Bolsas de vacío** — extraer el aire y sellar con desecante dentro. Almacenamiento a largo plazo más económico
3. **Bolsas ziplock con desecante** — simple y efectivo para períodos más cortos

### Silica gel y desecante

- **Silica gel azul/naranja** indica el nivel de saturación — reemplazar o regenerar (secar en horno a 120 °C) cuando cambie el color
- **Silica gel en perlas** es más efectivo que los gránulos
- **Paquetes de desecante** de los fabricantes de filamento pueden regenerarse y reutilizarse

### Higrómetro en la caja de almacenamiento

Un higrómetro digital barato muestra la humedad actual en la caja:

| Humedad relativa (HR) | Estado |
|---|---|
| Por debajo del 15 % | Ideal |
| 15–30 % | Bueno para la mayoría de materiales |
| 30–50 % | Aceptable para PLA y PETG |
| Por encima del 50 % | Problemático — especialmente para PA, PVA, PC |

## Consejos prácticos

- **Secar justo ANTES de imprimir** — el filamento secado puede volver a humedecerse en días en condiciones normales de interior
- **Imprimir desde la secadora** para PA, PC y PVA — no solo secar y guardar
- **Bobina nueva ≠ bobina seca** — los fabricantes sellan con desecante, pero la cadena de suministro puede haber fallado. Siempre secar bobinas nuevas de materiales higroscópicos
- **Etiquetar bobinas secadas** con la fecha de secado
- **Tubo PTFE dedicado** desde la secadora hasta la impresora minimiza la exposición durante la impresión

## Bambu Dashboard y estado de secado

Bambu Dashboard te permite registrar información del filamento incluyendo la última fecha de secado en los perfiles de filamento. Úsalo para hacer un seguimiento de qué bobinas están recién secadas y cuáles necesitan otra ronda.
