---
sidebar_position: 1
title: Bienvenido a Bambu Dashboard
description: Un panel de control potente y auto-alojado para impresoras 3D Bambu Lab
---

# Bienvenido a Bambu Dashboard

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/V7V21NRKM7)

**Bambu Dashboard** es un panel de control completo y auto-alojado para impresoras 3D Bambu Lab. Le ofrece visibilidad y control total sobre su impresora, inventario de filamentos, historial de impresión y más — todo desde una sola pestaña del navegador.

## ¿Qué es Bambu Dashboard?

Bambu Dashboard se conecta directamente a su impresora mediante MQTT sobre la red local, sin dependencia de los servidores de Bambu Lab. También puede conectarse a Bambu Cloud para sincronizar modelos e historial de impresión.

### Funciones principales

- **Panel en vivo** — temperatura en tiempo real, progreso, cámara, estado AMS con indicador LIVE
- **Inventario de filamentos** — rastree todas las bobinas con sincronización AMS, soporte para bobina EXT, información de material, compatibilidad de placa y guía de secado
- **Seguimiento de filamentos** — seguimiento preciso con 4 niveles de respaldo (sensor AMS → estimación EXT → cloud → duración)
- **Guía de materiales** — 15 materiales con temperaturas, compatibilidad de placa, secado, propiedades y consejos
- **Historial de impresión** — registro completo con nombres de modelos, enlaces MakerWorld, consumo de filamento y costos
- **Planificador** — vista de calendario, cola de impresión con balanceo de carga y verificación de filamento
- **Control de impresora** — temperatura, velocidad, ventiladores, consola G-code
- **Print Guard** — protección automática con xcam + 5 monitores de sensores
- **Estimador de costos** — material, electricidad, mano de obra, desgaste, margen con precio de venta sugerido
- **Mantenimiento** — seguimiento con intervalos basados en KB, vida útil de la boquilla, vida útil de la placa y guía
- **Alertas de sonido** — 9 eventos configurables con carga de sonido personalizado y altavoz de impresora (M300)
- **Registro de actividad** — línea de tiempo persistente de todos los eventos (impresiones, errores, mantenimiento, filamento)
- **Notificaciones** — 7 canales (Telegram, Discord, correo electrónico, ntfy, Pushover, SMS, webhook)
- **Multi-impresora** — compatible con toda la gama Bambu Lab
- **17 idiomas** — noruego, inglés, alemán, francés, español, italiano, japonés, coreano, neerlandés, polaco, portugués, sueco, turco, ucraniano, chino, checo, húngaro
- **Auto-alojado** — sin dependencia de la nube, sus datos en su máquina

### Novedades en v1.1.13

- **Detección de bobina EXT** para P2S/A1 mediante campo de mapeo MQTT — consumo de filamento rastreado correctamente para bobina externa
- **Base de datos de materiales de filamento** con 15 materiales, compatibilidad de placa, guía de secado y propiedades
- **Panel de mantenimiento** con intervalos basados en KB, 4 nuevos tipos de boquillas, pestaña de guía con enlaces a la documentación
- **Alertas de sonido** con 9 eventos, carga personalizada (MP3/OGG/WAV, máx. 10 s), control de volumen y altavoz de impresora
- **Registro de actividad** — línea de tiempo persistente de todas las bases de datos, independientemente de si la página estaba abierta
- **Códigos de error HMS** con descripciones legibles de más de 270 códigos
- **i18n completo** — todas las 2944 claves traducidas a 17 idiomas
- **Documentación de compilación automática** — la documentación se genera automáticamente durante la instalación y el inicio del servidor

## Inicio rápido

| Tarea | Enlace |
|-------|--------|
| Instalar el panel | [Instalación](./kom-i-gang/installasjon) |
| Configurar la primera impresora | [Configuración](./kom-i-gang/oppsett) |
| Conectar Bambu Cloud | [Bambu Cloud](./kom-i-gang/bambu-cloud) |
| Explorar todas las funciones | [Funciones](./funksjoner/oversikt) |
| Guía de filamentos | [Guía de materiales](./kb/filamenter/guide) |
| Guía de mantenimiento | [Mantenimiento](./kb/vedlikehold/dyse) |
| Documentación de la API | [API](./avansert/api) |

:::tip Modo demo
Puede probar el panel sin una impresora física ejecutando `npm run demo`. Esto inicia 3 impresoras simuladas con ciclos de impresión en vivo.
:::

## Impresoras compatibles

Todas las impresoras Bambu Lab con modo LAN:

- **Serie X1**: X1C, X1C Combo, X1E
- **Serie P1**: P1S, P1S Combo, P1P
- **Serie P2**: P2S, P2S Combo
- **Serie A**: A1, A1 Combo, A1 mini
- **Serie H2**: H2S, H2D (boquilla doble), H2C (cambiador de herramientas, 6 cabezales)

## Funciones en detalle

### Seguimiento de filamentos

El panel rastrea el consumo de filamento automáticamente con 4 niveles de respaldo:

1. **Diff sensor AMS** — más preciso, compara remain% de inicio/fin
2. **EXT directo** — para P2S/A1 sin vt_tray, usa estimación cloud
3. **Estimación cloud** — datos del trabajo de impresión de Bambu Cloud
4. **Estimación por duración** — ~30 g/hora como último respaldo

Todos los valores se muestran como el mínimo del sensor AMS y la base de datos de bobinas para evitar errores tras impresiones fallidas.

### Guía de materiales

Base de datos integrada con 15 materiales que incluye:
- Temperaturas (boquilla, cama, cámara)
- Compatibilidad de placa (Cool, Engineering, High Temp, Textured PEI)
- Información de secado (temperatura, tiempo, higroscopicidad)
- 8 propiedades (resistencia, flexibilidad, resistencia al calor, UV, superficie, facilidad de uso)
- Nivel de dificultad y requisitos especiales (boquilla endurecida, recinto)

### Alertas de sonido

9 eventos configurables con soporte para:
- **Clips de audio personalizados** — cargue MP3/OGG/WAV (máx. 10 segundos, 500 KB)
- **Tonos integrados** — sonidos metálicos/synth generados con Web Audio API
- **Altavoz de impresora** — melodías G-code M300 directamente en el buzzer de la impresora
- **Cuenta regresiva** — alerta de sonido cuando queda 1 minuto de impresión

### Mantenimiento

Sistema de mantenimiento completo con:
- Seguimiento de componentes (boquilla, tubo PTFE, varillas, cojinetes, AMS, placa, secado)
- Intervalos basados en KB de la documentación
- Vida útil de boquilla por tipo (latón, acero endurecido, HS01)
- Vida útil de placa por tipo (Cool, Engineering, High Temp, Textured PEI)
- Pestaña de guía con consejos y enlaces a la documentación completa

## Descripción técnica

Bambu Dashboard está construido con Node.js 22 y HTML/CSS/JS puro — sin frameworks pesados, sin paso de compilación. La base de datos es SQLite, integrada en Node.js 22.

- **Backend**: Node.js 22 con solo 3 paquetes npm (mqtt, ws, basic-ftp)
- **Frontend**: Vanilla HTML/CSS/JS, sin paso de compilación
- **Base de datos**: SQLite mediante el built-in de Node.js 22 `--experimental-sqlite`
- **Documentación**: Docusaurus con 17 idiomas, generada automáticamente durante la instalación
- **API**: 177+ endpoints, documentación OpenAPI en `/api/docs`

Consulte [Arquitectura](./avansert/arkitektur) para más detalles.
