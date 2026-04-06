---
sidebar_position: 2
title: Security
description: Security features in 3DPrintForge — authentication, encryption, rate limiting, CSP headers, CSRF protection, and more
---

# Security

3DPrintForge includes multiple layers of security to protect your printers and data. Authentication is optional but recommended for any network-accessible installation.

## Authentication

Authentication is opt-in. When enabled, all dashboard and API access requires a valid session or API key.

- **Role-based permissions** — five permission levels: `admin`, `controls`, `print`, `queue`, `view`
- **Session-based auth** — passwords hashed with scrypt (N=16384, key length 64 bytes)
- **TOTP 2FA** — optional two-factor authentication via authenticator apps
- **Session invalidation** — sessions are invalidated immediately when a user's role or permissions change

See [Authentication](./auth) for user management and 2FA setup.

## API key access

API keys provide programmatic access without sessions:

- Send via `Authorization: Bearer <key>` header or `X-API-Key: <key>` header
- Keys inherit the permissions of the user they belong to
- Keys can have an expiry date

## Transport security

### Auto-SSL

3DPrintForge automatically generates a self-signed TLS certificate on first startup. All HTTP traffic on port 3000 redirects to HTTPS on port 3443.

- **HSTS** — `Strict-Transport-Security` header enabled to prevent downgrade attacks
- **Custom certificates** — upload your own certificate and key in **Settings → Security**

### MQTT TLS

Connections to Bambu Lab printers use MQTT over TLS (port 8883):

- **TOFU certificate pinning** — the printer's TLS certificate is pinned on first connection (trust on first use) and validated on subsequent connections

## HTTP security headers

### Content Security Policy (CSP)

CSP headers restrict which resources the browser can load:

- `script-src` — only same-origin scripts
- `style-src` — same-origin styles and inline styles
- `connect-src` — same-origin API calls and WebSocket connections
- `frame-ancestors` — prevents embedding in iframes from other origins
- `upgrade-insecure-requests` — forces HTTPS for all sub-resources

### CSRF protection

State-changing requests (POST, PUT, DELETE) validate the `Origin` header against the server's own origin. Requests from mismatched origins are rejected.

### Trusted proxies

When running behind a reverse proxy, set the `TRUSTED_PROXIES` environment variable to a comma-separated list of proxy IPs. Only trusted proxies' `X-Forwarded-For` headers are used for client IP resolution.

## Rate limiting

| Endpoint | Limit |
|----------|-------|
| API requests | 200 requests per minute per IP |
| Login attempts | 5 attempts per 15 minutes per IP |
| TOTP attempts | 5 attempts per 15 minutes per IP |

Rate limit status is returned in response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

## SSRF protection

Webhook URLs and plugin HTTP requests are validated to prevent server-side request forgery:

- Private IP ranges blocked (10.x, 172.16-31.x, 192.168.x, 127.x)
- Link-local addresses blocked (169.254.x)
- Non-HTTP/HTTPS schemes blocked
- DNS rebinding protection

## WebSocket authentication

Camera WebSocket connections require authentication:

- **Session token** — passed as a query parameter on connection
- **API key** — passed as a query parameter on connection
- **First-message auth** — alternatively, send the token as the first WebSocket message instead of using query parameters

Unauthenticated WebSocket connections are rejected immediately.

## Plugin security

- **Integrity verification** — plugins include a SHA-256 manifest hash that is verified on load
- **Sandboxed HTTP** — plugin outbound HTTP requests pass through the SSRF guard

## Data protection

- **Secret masking** — API responses from `getSafeConfig()` mask sensitive fields (tokens, passwords, access codes)
- **Backup path traversal protection** — backup/restore endpoints validate file paths to prevent directory traversal
- **Error messages** — server errors return generic messages to clients; detailed context is logged server-side only
