---
sidebar_position: 5
title: PWA
description: Instala Bambu Dashboard como Progressive Web App para una experiencia similar a una app, modo sin conexión y notificaciones en segundo plano
---

# PWA (Progressive Web App)

Bambu Dashboard puede instalarse como una Progressive Web App (PWA) — una experiencia similar a una app directamente desde el navegador sin necesidad de tienda de aplicaciones. Obtendrás acceso más rápido, notificaciones push en segundo plano y funcionalidad limitada sin conexión.

## Instalar como app

### Escritorio (Chrome / Edge / Chromium)

1. Abre `https://localhost:3443` en el navegador
2. Busca el ícono de **Instalar** en la barra de direcciones (flecha hacia abajo con ícono de pantalla)
3. Haz clic en él
4. Haz clic en **Instalar** en el diálogo
5. Bambu Dashboard se abre como una ventana propia sin interfaz del navegador

Alternativamente: haz clic en los tres puntos (⋮) → **Instalar Bambu Dashboard...**

### Escritorio (Firefox)

Firefox no admite la instalación completa de PWA directamente. Usa Chrome o Edge para la mejor experiencia.

### Móvil (Android – Chrome)

1. Abre **https://ip-de-tu-servidor:3443** en Chrome
2. Toca los tres puntos → **Agregar a pantalla de inicio**
3. Dale un nombre a la app y toca **Agregar**
4. El ícono aparece en la pantalla de inicio — la app se abre en pantalla completa sin interfaz del navegador

### Móvil (iOS – Safari)

1. Abre **https://ip-de-tu-servidor:3443** en Safari
2. Toca el ícono de **Compartir** (cuadrado con flecha hacia arriba)
3. Desplázate hacia abajo y selecciona **Agregar a la pantalla de inicio**
4. Toca **Agregar**

:::warning Limitaciones de iOS
iOS tiene soporte limitado para PWA. Las notificaciones push solo funcionan en iOS 16.4 y versiones posteriores. El modo sin conexión es limitado.
:::

## Modo sin conexión

La PWA almacena en caché los recursos necesarios para un uso limitado sin conexión:

| Función | Disponible sin conexión |
|---|---|
| Último estado conocido de la impresora | ✅ (desde caché) |
| Historial de impresiones | ✅ (desde caché) |
| Inventario de filamento | ✅ (desde caché) |
| Estado en tiempo real (MQTT) | ❌ Requiere conexión |
| Transmisión de cámara | ❌ Requiere conexión |
| Enviar comandos a la impresora | ❌ Requiere conexión |

La vista sin conexión muestra un banner en la parte superior: «Conexión perdida — mostrando los últimos datos conocidos».

## Notificaciones push en segundo plano

La PWA puede enviar notificaciones push incluso cuando la app no está abierta:

1. Abre la PWA
2. Ve a **Configuración → Alertas → Browser Push**
3. Haz clic en **Activar notificaciones push**
4. Acepta el diálogo de permisos
5. Las notificaciones se entregan al centro de notificaciones del sistema operativo

Las notificaciones push funcionan para todos los eventos configurados en [Alertas](../funksjoner/notifications).

:::info Service Worker
Las notificaciones push requieren que el navegador esté ejecutándose en segundo plano (sin cierre completo del sistema). La PWA usa un Service Worker para recibirlas.
:::

## Ícono y apariencia de la app

La PWA usa automáticamente el ícono de Bambu Dashboard. Para personalizar:

1. Ve a **Configuración → Sistema → PWA**
2. Sube un ícono personalizado (mínimo 512×512 px PNG)
3. Indica el **Nombre de la app** y el **Nombre corto** (se muestra debajo del ícono en móvil)
4. Selecciona el **Color del tema** para la barra de estado en móvil

## Actualizar la PWA

La PWA se actualiza automáticamente cuando se actualiza el servidor:

- Se muestra un banner discreto: «Nueva versión disponible — haz clic para actualizar»
- Haz clic en el banner para cargar la nueva versión
- No se necesita reinstalación manual
