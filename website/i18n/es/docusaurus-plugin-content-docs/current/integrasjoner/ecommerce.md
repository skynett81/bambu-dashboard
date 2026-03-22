---
sidebar_position: 5
title: Comercio electrónico
description: Administra pedidos, clientes y facturación para la venta de impresiones 3D — requiere licencia de geektech.no
---

# Comercio electrónico

El módulo de comercio electrónico te proporciona un sistema completo para administrar clientes, pedidos y facturación — perfecto para quienes venden impresiones 3D de forma profesional o semiprofesional.

Ir a: **https://localhost:3443/#orders**

:::danger Licencia de comercio electrónico requerida
El módulo de comercio electrónico requiere una licencia válida. Las licencias **solo pueden adquirirse en [geektech.no](https://geektech.no)**. Sin una licencia activa, el módulo está bloqueado e inaccesible.
:::

## Licencia — compra y activación

### Comprar una licencia

1. Ve a **[geektech.no](https://geektech.no)** y crea una cuenta
2. Selecciona **Bambu Dashboard — Licencia de comercio electrónico**
3. Elige el tipo de licencia:

| Tipo de licencia | Descripción | Impresoras |
|---|---|---|
| **Hobby** | Una impresora, uso personal y ventas pequeñas | 1 |
| **Profesional** | Hasta 5 impresoras, uso comercial | 1–5 |
| **Enterprise** | Impresoras ilimitadas, soporte completo | Ilimitadas |

4. Completa el pago
5. Recibirás una **clave de licencia** por correo electrónico

### Activar la licencia

1. Ve a **Configuración → Comercio electrónico** en el panel
2. Completa los siguientes campos:

| Campo | Descripción | Obligatorio |
|-------|-------------|-------------|
| **Clave de licencia** | Clave hexadecimal de 32 caracteres de geektech.no | ✅ Sí |
| **Correo electrónico** | El correo que usaste al comprar | ✅ Sí |
| **Dominio** | El dominio en el que corre el panel (sin https://) | Recomendado |
| **Teléfono** | Teléfono de contacto (con código de país, ej. +34) | Opcional |

### Tipo de licencia — vinculación por identificador

geektech.no vincula la licencia a uno o más identificadores:

| Tipo | Valida contra | Caso de uso |
|------|---------------|-------------|
| **Dominio** | Nombre de dominio (ej. `dashboard.empresa.es`) | Servidor fijo con dominio propio |
| **IP** | Dirección(es) IP pública(s) | Servidor sin dominio, IP fija |
| **MAC** | Dirección(es) MAC de la tarjeta de red | Vinculación de hardware |
| **IP + MAC** | IP y MAC deben coincidir | Máxima seguridad |

:::info Identificación automática
El panel envía automáticamente la dirección IP y la dirección MAC del servidor en cada validación. No necesitas introducirlas manualmente — geektech.no las registra en la primera activación.
:::

Se pueden permitir múltiples direcciones IP y MAC (una por línea en el administrador de geektech.no). Esto es útil para servidores con múltiples tarjetas de red o IP dinámica.

3. Haz clic en **Activar licencia**
4. El panel envía una solicitud de activación a geektech.no
5. Si la activación es exitosa, se muestran:
   - **Tipo de licencia** (Hobby / Profesional / Enterprise)
   - **Fecha de vencimiento**
   - **Número máximo de impresoras**
   - **Titular de la licencia**
   - **ID de instancia** (único para tu instalación)

:::warning La clave de licencia está vinculada a tu dominio e instalación
La clave se activa para una instalación y dominio específicos de Bambu Dashboard. Contacta el soporte de [geektech.no](https://geektech.no) si necesitas:
- Trasladar la licencia a un nuevo servidor
- Cambiar de dominio
- Aumentar el número de impresoras
:::

### Validación de la licencia

La licencia se autentica y sincroniza con geektech.no:

- **Validación al iniciar** — la licencia se verifica automáticamente
- **Validación continua** — revalidada cada 24 horas contra geektech.no
- **Modo sin conexión** — en caso de fallo de red, la licencia funciona hasta **7 días** con validación en caché
- **Licencia vencida** → el módulo se bloquea, pero los datos existentes (pedidos, clientes) se conservan
- **Código PIN** — geektech.no puede bloquear/desbloquear la licencia mediante el sistema PIN
- **Renovación** — en **[geektech.no](https://geektech.no)** → Mis licencias → Renovar

### Tipos de licencia y restricciones

| Plan | Impresoras | Plataformas | Tarifa | Precio |
|------|------------|-------------|--------|--------|
| **Hobby** | 1 | 1 (Shopify O WooCommerce) | 5% | Ver geektech.no |
| **Profesional** | 1–5 | Todas | 5% | Ver geektech.no |
| **Enterprise** | Ilimitadas | Todas + API | 3% | Ver geektech.no |

### Verificar el estado de la licencia

Ve a **Configuración → Comercio electrónico** o llama a la API:

```bash
curl -sk https://localhost:3443/api/ecommerce/license
```

La respuesta contiene:
```json
{
  "active": true,
  "status": "active",
  "plan": "professional",
  "holder": "Nombre de empresa S.L.",
  "email": "empresa@ejemplo.es",
  "domain": "dashboard.nombreempresa.es",
  "max_printers": 5,
  "expires_at": "2027-03-22",
  "provider": "geektech.no",
  "fees_pending": 2,
  "fees_this_month": 450.00,
  "orders_this_month": 12
}
```

## Clientes

### Crear un cliente

1. Ve a **Comercio electrónico → Clientes**
2. Haz clic en **Nuevo cliente**
3. Completa:
   - **Nombre / Nombre de empresa**
   - **Persona de contacto** (para empresas)
   - **Correo electrónico**
   - **Teléfono**
   - **Dirección** (dirección de facturación)
   - **NIF / Número de identificación** (opcional, para contribuyentes de IVA)
   - **Nota** — anotación interna
4. Haz clic en **Crear**

### Resumen de clientes

La lista de clientes muestra:
- Nombre e información de contacto
- Número total de pedidos
- Facturación total
- Fecha del último pedido
- Estado (Activo / Inactivo)

Haz clic en un cliente para ver todo el historial de pedidos y facturación.

## Gestión de pedidos

### Crear un pedido

1. Ve a **Comercio electrónico → Pedidos**
2. Haz clic en **Nuevo pedido**
3. Selecciona el **Cliente** de la lista
4. Agrega líneas de pedido:
   - Selecciona el archivo/modelo de la biblioteca de archivos, o agrega una entrada de texto libre
   - Indica la cantidad y el precio unitario
   - El sistema calcula el costo automáticamente si se vincula a un proyecto
5. Indica la **Fecha de entrega** (estimada)
6. Haz clic en **Crear pedido**

### Estado del pedido

| Estado | Descripción |
|---|---|
| Solicitud | Solicitud recibida, no confirmada |
| Confirmado | El cliente ha confirmado |
| En producción | Impresiones en curso |
| Listo para entrega | Terminado, esperando retiro/envío |
| Entregado | Pedido completado |
| Cancelado | Cancelado por el cliente o por ti |

Actualiza el estado haciendo clic en el pedido → **Cambiar estado**.

### Vincular impresiones al pedido

1. Abre el pedido
2. Haz clic en **Vincular impresión**
3. Selecciona las impresiones del historial (se admite selección múltiple)
4. Los datos de costo se obtienen automáticamente del historial de impresiones

## Facturación

Consulta [Proyectos → Facturación](../funksjoner/projects#fakturering) para la documentación detallada de facturación.

La factura puede generarse directamente desde un pedido:

1. Abre el pedido
2. Haz clic en **Generar factura**
3. Verifica el importe e IVA
4. Descarga el PDF o envíalo al correo electrónico del cliente

### Serie de números de factura

Configura la serie de números de factura en **Configuración → Comercio electrónico**:
- **Prefijo**: por ejemplo, `2026-`
- **Número inicial**: por ejemplo, `1001`
- Los números de factura se asignan automáticamente en orden ascendente

## Informes y tarifas

### Informe de tarifas

El sistema registra todas las tarifas de transacción:
- Consulta las tarifas en **Comercio electrónico → Tarifas**
- Marca las tarifas como reportadas para fines contables
- Exporta el resumen de tarifas por período

### Estadísticas

En **Comercio electrónico → Estadísticas**:
- Facturación mensual (gráfico de barras)
- Principales clientes por facturación
- Modelos/materiales más vendidos
- Tamaño promedio de pedido

Exporta a CSV para el sistema contable.

## Soporte y contacto

:::info ¿Necesitas ayuda?
- **Preguntas sobre licencias**: contacta el soporte de [geektech.no](https://geektech.no)
- **Problemas técnicos**: [GitHub Issues](https://github.com/skynett81/bambu-dashboard/issues)
- **Solicitudes de funciones**: [GitHub Discussions](https://github.com/skynett81/bambu-dashboard/discussions)
:::
