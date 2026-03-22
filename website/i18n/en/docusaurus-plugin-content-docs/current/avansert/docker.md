---
sidebar_position: 3
title: Docker Setup
description: Run Bambu Dashboard with Docker and docker-compose
---

# Docker Setup

Bambu Dashboard includes a `Dockerfile` and `docker-compose.yml` for easy containerization.

## Quick start

```bash
git clone https://github.com/skynett81/bambu-dashboard.git
cd bambu-dashboard
docker-compose up -d
```

Open `https://localhost:3443` in the browser.

## docker-compose.yml

```yaml
version: '3.8'

services:
  bambu-dashboard:
    build: .
    container_name: bambu-dashboard
    restart: unless-stopped
    ports:
      - "3000:3000"
      - "3443:3443"
      - "9001-9010:9001-9010"   # Camera streams
    volumes:
      - ./data:/app/data         # Database and configuration
      - ./certs:/app/certs       # SSL certificates (optional)
    environment:
      - NODE_ENV=production
      - PORT=3000
      - HTTPS_PORT=3443
    network_mode: host           # Recommended for MQTT connection
```

:::warning network_mode: host
`network_mode: host` is recommended so the container can reach the printer on the local network via MQTT. Without this, the MQTT connection may fail depending on the network configuration.
:::

## Dockerfile

```dockerfile
FROM node:22-alpine

WORKDIR /app

# Install ffmpeg for camera streaming
RUN apk add --no-cache ffmpeg

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000 3443

CMD ["node", "--experimental-sqlite", "server/index.js"]
```

## Volumes

| Host path | Container path | Contents |
|-----------|---------------|---------|
| `./data` | `/app/data` | SQLite database, configuration |
| `./certs` | `/app/certs` | SSL certificates (optional) |

:::tip Persistent data
Always mount the `./data` volume. Without this, all data will be lost when the container restarts.
:::

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Environment |
| `PORT` | `3000` | HTTP port |
| `HTTPS_PORT` | `3443` | HTTPS port |
| `AUTH_SECRET` | (auto) | JWT secret — set explicitly in production |
| `LOG_LEVEL` | `info` | Log level (debug, info, warn, error) |

## SSL certificates in Docker

### Self-generated (default)
No configuration needed. The certificate is generated automatically and stored in `./data/certs/`.

### Custom certificate
```yaml
volumes:
  - ./my-cert.pem:/app/certs/cert.pem:ro
  - ./my-key.pem:/app/certs/key.pem:ro
```

## Administration

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f

# Update to new version
docker-compose pull
docker-compose up -d --build

# Backup database
docker cp bambu-dashboard:/app/data/database.db ./backup-$(date +%Y%m%d).db
```

## Health status

```bash
docker inspect --format='{{.State.Health.Status}}' bambu-dashboard
```

The container reports `healthy` when the server is up and responding to `/api/health`.
