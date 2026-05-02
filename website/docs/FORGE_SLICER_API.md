# Forge Slicer REST API — Contract

This document specifies the HTTP API that the **skynett81/OrcaSlicer**
fork exposes when launched in service mode. 3DPrintForge talks to this
API through `server/forge-slicer-client.js` instead of spawning the
slicer CLI per request.

## Launching the slicer in service mode

The fork accepts a new flag:

```
orca-slicer --rest-port 8765 [--rest-bind 127.0.0.1] [--rest-token TOKEN]
```

Defaults:
- `--rest-bind 127.0.0.1` (localhost only — refuse remote connections)
- `--rest-port 8765`
- `--rest-token` empty (no auth)

Recommendations:
- Run as the same user as 3DPrintForge so config dirs match
- If you ever expose this beyond localhost, set `--rest-token` and
  forward it via the `Authorization: Bearer …` header

## Endpoints

All responses are JSON unless noted. All errors follow:
```json
{ "error": "human-readable message", "code": "ERR_CODE" }
```

### `GET /api/health`

Liveness + identity probe. Should be cheap (< 5 ms).

```json
{
  "ok": true,
  "service": "forge-slicer",
  "version": "1.10.2-skynett.3",
  "upstream": "OrcaSlicer 2.3.1",
  "started_at": "2026-05-02T18:00:00Z",
  "config_dir": "/home/user/.config/OrcaSlicer"
}
```

### `GET /api/version`

Same as `/api/health` but smaller payload — used when checking
compatibility before expensive calls.

```json
{ "version": "1.10.2-skynett.3", "api": 1 }
```

`api`: contract version. Bump when breaking the schema.

### `GET /api/profiles?kind={printer|filament|process|all}`

List all profiles known to the slicer. The forge stores its own copies
in `slicer_profiles` (DB), but read-only browsing goes through here so
the user always sees the same list as inside the slicer.

Query params:
- `kind` — filter by profile category. `all` returns flat list with `kind` field on each row
- `vendor` — filter by vendor name (optional)

Response:
```json
{
  "profiles": [
    {
      "id": "Snapmaker U1 0.4 nozzle",
      "kind": "printer",
      "name": "Snapmaker U1 0.4 nozzle",
      "vendor": "Snapmaker",
      "is_default": false,
      "settings": { "..." }
    },
    ...
  ]
}
```

### `GET /api/profiles/:id`

Single profile with full settings.

### `POST /api/slice`

Slice a model. Request body multipart:
- `model` — STL/3MF file (binary)
- `printer_id` — printer profile id
- `filament_ids` — JSON array of filament profile ids (one per extruder)
- `process_id` — process/quality profile id
- `overrides` — JSON object of per-job overrides (optional)

Response is streaming SSE (`Content-Type: text/event-stream`):
```
event: progress
data: {"stage":"loading","pct":5}

event: progress
data: {"stage":"slicing","pct":47}

event: layer
data: {"layer":120,"total_layers":250}

event: done
data: {"ok":true,"gcode_path":"/tmp/forge-slicer/abc.gcode","gcode_size":1843291,"estimated_time_s":7864,"filament_used_g":[68.06,0,0,0]}
```

If the client doesn't accept SSE (`Accept: application/json`), the
response is buffered and returned as a single JSON object on completion.
Slow but simpler for first integration.

### `GET /api/jobs/:id/gcode`

Download a sliced gcode file by job id (returned in the `done` event).

### `GET /api/jobs/:id/preview.png`

PNG preview of the sliced model (top-down render).

### `POST /api/preview`

Render a 3D thumbnail of an unsliced model. Multipart:
- `model` — STL/3MF
- `width`, `height` — image dimensions (default 512×512)

Response: `image/png`.

### `GET /api/printers`

List printers configured inside the slicer (printer profile bindings,
not the live network printers). 3DPrintForge mirrors these into
`slicer_profiles` so users see the same list in both apps.

## State + lifecycle

- The service runs in headless mode — no GUI window opens
- Active slicing jobs queue automatically; concurrent slice calls return
  `429 Too Many Requests` if the queue is full
- `GET /api/jobs` returns the current queue state

## Error codes

| Code | HTTP | Meaning |
|---|---|---|
| `ERR_BAD_REQUEST` | 400 | Missing/invalid field |
| `ERR_UNAUTHORIZED` | 401 | Token mismatch |
| `ERR_PROFILE_NOT_FOUND` | 404 | Unknown profile id |
| `ERR_TOO_MANY_JOBS` | 429 | Slicer busy |
| `ERR_SLICE_FAILED` | 500 | Slicing crashed |
| `ERR_INTERNAL` | 500 | Other internal error |

## Phased implementation order

Recommended order to avoid having a broken service binary:

1. **Phase 1 (week 1):** `/api/health`, `/api/version` — minimal embedded
   HTTP server. Confirms the service boots and 3DPrintForge can probe it
2. **Phase 2 (week 1-2):** `/api/profiles`, `/api/profiles/:id` —
   read-only listing
3. **Phase 3 (week 2-3):** `/api/slice` (buffered JSON response, no SSE
   yet) + `/api/jobs/:id/gcode`
4. **Phase 4 (week 3):** `/api/preview` — thumbnail rendering
5. **Phase 5 (week 4+):** SSE progress events for `/api/slice`

## Recommended C++ libraries

- **HTTP server:** `cpp-httplib` (header-only, MIT, simple). Adds ~3
  files to your build.
- **JSON:** `nlohmann/json` (already a transitive dep in OrcaSlicer)
- **Multipart parsing:** `cpp-httplib` handles it natively

Sample skeleton (cpp-httplib, ~50 LOC):

```cpp
#include "httplib.h"
#include <nlohmann/json.hpp>

int main(int argc, char** argv) {
    int port = 8765;
    httplib::Server svr;

    svr.Get("/api/health", [](const httplib::Request&, httplib::Response& res) {
        nlohmann::json j;
        j["ok"] = true;
        j["service"] = "forge-slicer";
        j["version"] = ORCA_VERSION;
        j["upstream"] = "OrcaSlicer " + std::string(ORCA_UPSTREAM_VERSION);
        res.set_content(j.dump(), "application/json");
    });

    svr.Get("/api/version", [](const httplib::Request&, httplib::Response& res) {
        nlohmann::json j;
        j["version"] = ORCA_VERSION;
        j["api"] = 1;
        res.set_content(j.dump(), "application/json");
    });

    svr.listen("127.0.0.1", port);
    return 0;
}
```

## 3DPrintForge integration

3DPrintForge probes for the service on startup and every 60 s
afterwards. When found:
- The Slicer Bridge falls back to forge-slicer-client first
- CLI-spawning bridge stays as a backup if the service goes down
- `/api/slicer/native/profiles` UI shows the slicer's profile list
  alongside any local `slicer_profiles` rows

Configuration in `config.json`:
```json
{
  "forge_slicer": {
    "enabled": true,
    "url": "http://127.0.0.1:8765",
    "token": ""
  }
}
```

Or via env: `FORGE_SLICER_URL`, `FORGE_SLICER_TOKEN`.
