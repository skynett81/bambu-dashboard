---
sidebar_position: 4
title: API Playground
description: Test all 177 API endpoints directly in the browser with built-in OpenAPI documentation and authentication
---

# API Playground

The API Playground lets you explore and test all 177 API endpoints in Bambu Dashboard directly in the browser — without writing code.

Go to: **https://localhost:3443/api/docs**

## What is the API Playground?

The playground is an interactive version of the OpenAPI documentation (Swagger UI) that is fully integrated with the dashboard. You are already authenticated when you are logged in, so you can test endpoints directly.

## Navigating the documentation

Endpoints are organized into categories:

| Category | Endpoints | Description |
|---|---|---|
| Printers | 24 | Get status, control, configure |
| Prints / History | 18 | Get, search, export history |
| Filament | 22 | Inventory, spools, profiles |
| Queue | 12 | Manage print queue |
| Statistics | 15 | Aggregated statistics and export |
| Notifications | 8 | Configure and test notification channels |
| Users | 10 | Users, roles, API keys |
| Settings | 14 | Read and change configuration |
| Maintenance | 12 | Maintenance tasks and log |
| Integrations | 18 | HA, Tibber, webhooks, etc. |
| File Library | 14 | Upload, analyze, manage |
| System | 10 | Backup, health, log |

Click on a category to expand it and see all endpoints.

## Testing an endpoint

1. Click on an endpoint (e.g. `GET /api/printers`)
2. Click **Try it out**
3. Fill in any parameters (filter, pagination, printer ID, etc.)
4. Click **Execute**
5. See the response below: HTTP status code, headers, and JSON body

### Example: Get all printers

```
GET /api/printers
```
Returns a list of all registered printers with real-time status.

### Example: Send command to printer

```
POST /api/printers/{id}/command
Body: {"command": "pause"}
```

:::warning Production environment
The API Playground is connected to the actual system. Commands are sent to real printers. Be careful with destructive operations like `DELETE` and `POST /command`.
:::

## Authentication

### Session authentication (logged-in user)
When you are logged in to the dashboard, the playground is already authenticated via session cookie. No extra configuration needed.

### API key authentication

For external access:

1. Click **Authorize** (lock icon at the top of the playground)
2. Enter your API key in the **ApiKeyAuth** field: `Bearer YOUR_KEY`
3. Click **Authorize**

Generate API keys under **Settings → API Keys** (see [Authentication](../system/auth)).

## Rate limiting

The API has rate limiting of **200 requests per minute** per user/key. The playground shows remaining requests in the response header `X-RateLimit-Remaining`.

:::info OpenAPI specification
Download the full OpenAPI specification as YAML or JSON:
- `https://localhost:3443/api/docs/openapi.yaml`
- `https://localhost:3443/api/docs/openapi.json`

Use the specification to generate client libraries in Python, TypeScript, Go, etc.
:::

## Webhook testing

Test webhook integrations directly:

1. Go to `POST /api/webhooks/test`
2. Select event type from the dropdown
3. The system sends a test event to the configured webhook URL
4. See request/response in the playground
