---
sidebar_position: 1
title: API Reference
description: REST API with 284+ endpoints, authentication, and rate limiting
---

# API Reference

Bambu Dashboard exposes a full REST API with 284+ endpoints. The API documentation is available directly in the dashboard.

## Interactive documentation

Open the OpenAPI documentation in the browser:

```
https://your-server:3443/api/docs
```

Here you will find all endpoints, parameters, request/response schemas, and the ability to test the API directly.

## Authentication

The API uses **Bearer token** authentication (JWT):

```bash
# Log in and get token
curl -X POST https://your-server:3443/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your-password"}'

# Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "24h"
}
```

Use the token in all subsequent calls:

```bash
curl https://your-server:3443/api/printers \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Rate limiting

The API is rate-limited to protect the server:

| Limit | Value |
|--------|-------|
| Requests per minute | 200 |
| Burst (max per second) | 20 |
| Response on exceeded | `429 Too Many Requests` |

The `Retry-After` header in the response indicates how many seconds until the next request is allowed.

## Endpoint overview

### Authentication
| Method | Endpoint | Description |
|--------|-----------|-------------|
| POST | `/api/auth/login` | Log in, get JWT |
| POST | `/api/auth/logout` | Log out |
| GET | `/api/auth/me` | Get logged-in user |

### Printers
| Method | Endpoint | Description |
|--------|-----------|-------------|
| GET | `/api/printers` | List all printers |
| POST | `/api/printers` | Add printer |
| GET | `/api/printers/:id` | Get printer |
| PUT | `/api/printers/:id` | Update printer |
| DELETE | `/api/printers/:id` | Delete printer |
| GET | `/api/printers/:id/status` | Real-time status |
| POST | `/api/printers/:id/command` | Send command |

### Filament
| Method | Endpoint | Description |
|--------|-----------|-------------|
| GET | `/api/filaments` | List all spools |
| POST | `/api/filaments` | Add spool |
| PUT | `/api/filaments/:id` | Update spool |
| DELETE | `/api/filaments/:id` | Delete spool |
| GET | `/api/filaments/stats` | Consumption statistics |

### Print history
| Method | Endpoint | Description |
|--------|-----------|-------------|
| GET | `/api/history` | List history (paginated) |
| GET | `/api/history/:id` | Get single print |
| GET | `/api/history/export` | Export CSV |
| GET | `/api/history/stats` | Statistics |

### Print queue
| Method | Endpoint | Description |
|--------|-----------|-------------|
| GET | `/api/queue` | Get queue |
| POST | `/api/queue` | Add job |
| PUT | `/api/queue/:id` | Update job |
| DELETE | `/api/queue/:id` | Remove job |
| POST | `/api/queue/dispatch` | Force dispatch |

## WebSocket API

In addition to REST, there is a WebSocket API for real-time data:

```javascript
const ws = new WebSocket('wss://your-server:3443/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data.type, data.payload);
};
```

### Message types (incoming)
- `printer.status` — updated printer status
- `print.progress` — progress percentage update
- `ams.update` — AMS state change
- `notification` — notification message

## Error codes

| Code | Meaning |
|------|-------|
| 200 | OK |
| 201 | Created |
| 400 | Bad request |
| 401 | Not authenticated |
| 403 | Not authorized |
| 404 | Not found |
| 429 | Too many requests |
| 500 | Server error |
