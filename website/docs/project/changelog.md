# Changelog

All notable changes to 3DPrintForge.

---

## v1.1.21 (in progress) — Forge Slicer fork integration

Adds the 3DPrintForge half of an integration with the
[skynett81/OrcaSlicer](https://github.com/skynett81/OrcaSlicer) fork.
The fork hosts a small REST service (cpp-httplib) that 3DPrintForge
talks to instead of spawning the slicer CLI per request. Profiles
mirror automatically; slicing routes through the fork when available
and falls back to the CLI bridge / native engine when not.

- **API contract** (`website/docs/FORGE_SLICER_API.md`) — every
  endpoint specified, 5-phase rollout, error codes, auth model
- **Node REST client** (`server/forge-slicer-client.js`) — probe
  with 60 s cache, profile listing, multipart slice, gcode download,
  PNG preview, optional bearer token, env overrides
- **Slicer resolver** (`server/slicer-resolver.js`) — single entry
  point that picks the best backend in priority order (forge → bridge
  → native). All slicer call sites get the same return shape regardless
- **Profile sync** (`server/forge-slicer-sync.js`) — pulls the fork's
  catalog into local `slicer_profiles` table every 5 min, archives
  vanished entries, idempotent on (kind, name)
- **9 REST endpoints** under `/api/slicer/forge/*`: status, configure,
  profiles, slice, jobs/:id/gcode, preview, sync, sync/status
- **Persistent settings** — configure endpoint writes to `config.json`
  via `saveConfig` so URL/token/enabled survive restart
- **UI status card** auto-mounted at the top of Slicer Studio
  (`forge-slicer-settings.js`) with Save / Test connection / Open fork
  buttons, version + upstream + config-dir display, fallback explainer
- **Header badge** (`forge-slicer-badge.js`) — small status pill in the
  global header so users see service state from any page
- **Slicer Studio "Slice" button** prefers Forge when available,
  shows "Sliced via Forge Slicer" in the success banner; falls back to
  native if the service is down
- **Mock server** (`tools/forge-slicer-mock.js`) — full Node
  implementation of the contract for fork-side dev. Returns plausible
  profiles + slice payloads so 3DPrintForge integration can be tested
  end-to-end without waiting for a binary
- **C++ reference impl**
  (`website/docs/forge-slicer-cpp/rest_server.cpp`) — Phase-1 skeleton
  using cpp-httplib + nlohmann/json. CMakeLists fragment + step-by-step
  `main_integration.md` for wiring into the OrcaSlicer entry point
- **Tests** — 25 new tests across `forge-slicer-client.test.js`,
  `slicer-resolver.test.js`, `forge-slicer-sync.test.js` covering
  probe + cache, profile listing, multipart slice, gcode download,
  PNG preview, auth, disabled state, fallback chain, sync idempotency,
  archived profile handling

Service-worker cache bumped to v188.

---

## v1.1.20 — Native Slicer, Scene Composer, AI Model Forge, Universal Vendor Coverage (2026-04-26)

Largest release since v1.1.0. Adds **our own slicer** (both a desktop-
slicer bridge and a from-scratch native engine), a Tinkercad-style 3D
**Scene Composer** with real CSG, an **AI Model Forge** that turns text /
image / sketch into printable meshes, a **Mesh Repair Toolkit**, **G-code
Reference & Estimator**, **printer-image cache** with brand-aware
fallback rendering, and **expanded vendor coverage** to 17 brands and
75+ printer models including the full Bambu H-series and three new
protocol clients (Duet/RepRapFirmware, FlashForge FNet, Repetier-Server).

### Slicer Studio + Slicer Bridge + native engine

**Slicer Studio** — full standalone slicer program built into the
dashboard. 3-column layout with profile-based settings (printer /
filament / quality), 3D viewport showing the build volume + model, and
one-click slice → toolpath → send pipeline.
- New `slicer_profiles` SQLite table (migration **v135**) seeded with
  23 default profiles: 7 filaments (Generic PLA/PETG/ABS/ASA/TPU +
  Bambu PLA Basic + Snapmaker PLA), 4 quality presets (Draft 0.30 mm,
  Normal 0.20 mm, Fine 0.12 mm, Strong 0.20 mm 3 walls 40 %), 12
  printer profiles spanning Bambu/Snapmaker/Voron/Prusa/Creality
- `mergeProfiles({printerId, filamentId, processId})` overlays the
  three JSONs into a single settings object the native-slicer engine
  consumes directly
- 5 new REST endpoints: GET / GET-by-id / POST / PUT / DELETE
  `/api/slicer/native/profiles`
- Frontend builds on Three.js viewport with yellow wireframe build
  volume + translucent bed plate + 10 mm grid; auto-resizes camera
  based on the selected printer's `buildVolume`
- Save-as-new-quality-preset button serialises overrides to a new
  `process` row

**Slicer Bridge** — headless slicing via the user's installed desktop
slicer.
- `server/slicer-bridge.js` probes for OrcaSlicer (Flatpak), Bambu
  Studio (Flatpak), and Snapmaker Orca AppImage at `/opt/`
- `pickSlicer(printerInfo)` chooses per brand: Bambu printers → Bambu
  Studio (best AMS handling), Snapmaker U1 → Snapmaker Orca, all
  others → OrcaSlicer
- `listProfiles(slicer)` reads the user's existing machine/filament/
  process JSONs from the slicer's config directory so the same
  dropdowns appear as in the desktop app
- `sliceModel({modelBuffer, slicer, printerProfile, …})` writes to
  tmp dir, spawns `--slice 0 --outputdir`, captures stdout/stderr,
  reads the produced `.gcode`. 10-min timeout cap, cleanup on every
  exit path
- 4 endpoints: `/api/slicer/bridge/probe`, `…/profiles`, `…/slice`,
  `…/slice-and-send` (atomic slice + upload-to-printer in one call)

**Native Slicer** — pure-JS slicing engine. Uses every existing module
(format-converter, mesh-repair, mesh-transforms, stl-analyzer,
gcode-time-estimator, printer-capabilities).
- `sliceLayer(mesh, z)` — triangle-edge intersections at the cut
  plane, chained into closed polygon loops with EPS tolerance
- `offsetPolygon(poly, distance)` — vertex-bisector inward/outward
  offset with degeneracy detection (signed-area sign flip + bbox-grew-
  instead-of-shrank guard)
- `lineInfill(poly, density, angle, lineWidth)` — rotates polygon
  into hatch-aligned space, scans even-odd-fill scanlines, rotates
  segments back. Spacing = lineWidth / density
- `layersToGcode(layers, settings)` — emits G1 X Y E F moves with
  full home/heat/prime preamble + cooldown finisher and per-layer
  retraction on travel transitions
- `sliceMeshToGcode(mesh, settings)` orchestrator runs autoRepair +
  recenterToOrigin before slicing, alternates infill angle every layer
- `POST /api/slicer/native/slice` with `X-Layer-Count`,
  `X-Slice-Duration-Ms`, `X-Estimated-Time-Sec`, `X-Filament-G`
  response headers

### Scene Composer — Tinkercad-style 3D editor

Drop-drag modeller med ekte boolean ops, 17 generator-shapes, og
visuell drag-handle-redigering.
- New `ai_forge_scenes` table (migration **v134**) for save/load
- `server/scene-builder.js` — pure-JS composer with SRT (scale → rotate
  XYZ → translate) per shape and `unionMeshes` for combination. Holes
  flagged as `hole: true` are CSG-subtracted from the combined solids
- `server/csg-bsp.js` — pure-JS BSP-tree CSG engine (Evan Wallace
  algorithm, public domain) with `unionMesh` / `subtractMesh` /
  `intersectMesh`. Vec3 / Vertex / Plane / Polygon / Node primitives
  + meshToCsg / csgToMesh round-trip
- `runGeneratorWithOpts(key, opts)` lets Shape Gallery insert any of
  the 17 Model Forge generators (keychain, gear, vase, gridfinity_bin,
  etc.) directly into a scene with editable opts
- Frontend `scene-composer.js`:
  - 7-shape palette: box / sphere / cylinder / cone / torus / prism
    / pyramid + import STL/OBJ/3MF + Shape Gallery + pattern array
    (linear / radial)
  - Three.js viewport with OrbitControls, axis helper, workplane grid,
    click-to-select via raycaster, emissive highlight on selected
  - Properties panel: name, color picker, hole flag, position XYZ,
    rotation XYZ in degrees, scale XYZ, geometry params per type
  - Multi-select via `Set<shapeId>` with Ctrl+click toggle
  - Visual translate handles: 3 colored arrows on selected shape,
    drag to move with snap-to-grid (off / 0.5 / 1 / 5 / 10 mm)
  - Group / ungroup with parent-id transform inheritance
  - Mirror X/Y/Z, Align X-center / Y-center / Z-min for 2+ selected
  - Undo / redo (Ctrl+Z / Ctrl+Y) with 50-step history
  - View presets: Iso / Top / Front / Side / Fit-all
  - Print bed overlay: yellow wireframe at the printer's build volume
  - Send-to-Printer dropdown integrated with printer-manager
- 7 endpoints: GET/POST/PUT/DELETE `/api/ai-forge/scenes`, plus
  `/render`, `/render-saved`, `/upload-mesh`, `/preview-shape`,
  `/generator-defaults/:key`, `/printer-beds` (per-printer build volumes)

### AI Model Forge — text / image / sketch → printable mesh

Self-hosted, no external ML services or GPU required.
- `server/text-intent-parser.js` — tokeniser + keyword matcher for
  shape names (cube/sphere/cylinder/cone/torus/prism/hex/pyramid,
  keychain, sign, vase, gear, plate, etc.), dimension parsing
  (`20mm`, `5cm`, `20x30x10`), key-value overrides (`r=10 h=20
  teeth=20`), count words (one..ten / two cubes), size presets
  (tiny / small / huge), modifiers (hollow / twisted / rounded),
  quoted text extraction. Plural-handling so "boxes" → "box"
- `server/ai-forge.js` — dispatcher that turns parsed intent into a
  mesh via mesh-primitives, routes images to `imageToHeightmap`
  (relief mode) or boundary-trace silhouette extrusion, parses simple
  SVG paths (M/L/H/V/Z) into extrusion polygons, and runs autoRepair
  before persisting STL/OBJ/3MF
- `server/ai-forge-generators.js` — registry mapping 17 shape
  keywords to real Model Forge generators (keychain, sign, vase,
  gear, cable_label, storage_box, plant_pot, phone_stand, hook,
  cable_clip, spring, hinge, battery_holder, headphone_stand,
  gridfinity_bin, gridfinity_baseplate, thread)
- `server/mesh-primitives.js` — pure-JS indexed-mesh builders for
  box, sphere (UV), cylinder, cone, torus, prism, pyramid, polygon-
  extrude, heightmap-to-mesh, union, offset
- New `ai_forge_jobs` table (migration **v133**) tracks generation
  history with status, result_path, repair_report, error, duration
- 7 endpoints: `POST /api/ai-forge/text` · `POST /api/ai-forge/image`
  · `POST /api/ai-forge/sketch` · `GET /api/ai-forge/jobs` · `GET
  /api/ai-forge/jobs/:id` · `DELETE /api/ai-forge/jobs/:id` ·
  `GET /api/ai-forge/jobs/:id/download`
- Frontend `ai-forge.js`: 4-tab panel (Text / Image / Sketch / Jobs)
  with drag-drop, canvas drawing, prompt-example gallery loaded
  from `GET /api/ai-forge/generators`, and Jobs tab with download/
  delete

### Mesh Repair Toolkit

Pure-JS auto-fix and transform pipeline.
- `mesh-repair.js`: `dedupeVertices`, `removeDegenerateTriangles`,
  `fixWinding` (BFS + signed-volume flip), `closeHoles` (boundary-
  loop fan triangulation), `autoRepair` chain with selectable ops,
  `analyzeMesh`
- `mesh-transforms.js`: `decimate` (vertex-cluster collapse),
  `smooth` (Laplacian with boundary anchoring), `hollow` (shell
  duplicate + reverse winding), `splitComponents` (BFS over face
  adjacency), `scale`, `translate`, `recenterToOrigin`, `meshStats`
- `format-converter.js`: STL ↔ OBJ ↔ 3MF bidirectional, format
  auto-detection. STL native (binary read/write), OBJ plain-text
  with quad triangulation + relative-index support, 3MF via lib3mf
- 6 endpoints: `/api/mesh/{analyze,repair,transform,convert,split,
  split/component}` — streaming binary upload (50 MB cap), returns
  binary mesh + report via `X-Mesh-Report` header
- Frontend `mesh-repair-suite.js`: 4-tab panel (Repair / Transform /
  Convert / Split) with drag-drop file picker

### G-code Reference & Estimator

- `server/gcode-reference.js` — curated catalog of 75+ commands
  across Marlin, Klipper, RepRap, and Bambu firmware families with
  descriptions, parameters, examples, and firmware tags. Searchable
  by code, description, parameter, category, and firmware family
- `server/gcode-time-estimator.js` — trapezoidal motion model with
  axis feedrate clamps and acceleration limits. Tracks extrusion
  length, computes filament volume → weight → cost using
  configurable diameter, density, and price-per-kg. Layer count
  via slicer LAYER_CHANGE comments with Z-up fallback. Detects
  and exposes slicer-header values (estimated time, filament used)
- 3 endpoints: `GET /api/gcode/reference[?q=&category=&firmware=]`
  · `GET /api/gcode/reference/:code` · `POST /api/gcode/estimate`
  (binary upload, 50 MB cap)

### Vendor expansion — 17 brands, 75+ models

**Full Bambu Lab H-series** — `detectBambuModel(serial, infoModule)`
gained an `infoModule` parameter to refine via firmware-reported
`product_name`. Added serial-prefix `0CE` for H2D Pro. Capability
overrides for H2D, H2D Pro (laser + refreshable nozzle + high-temp
bed), H2C (vortek 7-color), H2S. Fixed `model_name: 'X1E'` mis-tag
on the H2D Pro entry in `bambu-printer-db.json`.

**Prusa 2024–2025** — MK4S, CORE One, HT90 / Pro HT90, Mini+, XL
extended with multiExtruder + toolheads:5.

**Creality** — K1C, K1 SE, K2 Plus, K2 Plus Combo, Hi, Hi Combo,
Ender-3 V3 SE/KE/Plus, CR-10 SE.

**Elegoo** — Centauri, Centauri Carbon (2024 enclosed CoreXY),
Neptune 4 Plus.

**Voron community** — 0.1, Switchwire (CoreXZ kinematics), Phoenix.

**RatRig** — V-Core 3 / 3 Pro / 3.1 / 4 (V-Core 4 is the 2025
release), V-Minion compact.

**AnkerMake** — M5, M5C (2024 budget).

**QIDI** — X-Plus 3/4, X-Max 3/4, Q1 Pro, X-CF Pro, Plus4 with
heated chamber and AI features per spec.

**Anycubic (NEW vendor)** — Kobra 3 / 3 Combo, Kobra S1 / S1 Combo
(2024).

**Sovol** — SV06 / SV06 Plus, SV07 / SV07 Plus, SV08 (Voron 2.4
clone), Zero (compact).

**FlashForge** — Adventurer 5M / 5M Pro (2024 enclosed Klipper
variants), AD5X (IFS multi-color), Creator 4 (industrial IDEX with
chamber), Guider 3 Plus.

**BIQU/BigTreeTech** — Hurakan, B1 SE Plus.

**Two Trees** — SK-1 / SK-1 Pro, Sapphire Pro.

**Tronxy** — CRUX1, Veho 600.

**Mingda** — Magician X2 / Pro / Max.

**Kywoo** — Tycoon Slim / Tycoon / Tycoon Max.

`_resolveBrandRepo` extended with branches for all new vendors;
Creality K-series now route to dedicated source-code repos
(K2_Plus_Source_Code, K1_Max_Source_Code, K1_Source_Code) rather
than the brand wiki. `_guessBrand` regex re-ordered so brand-
specific patterns run before broad rules (Sovol's SV06 no longer
mis-attributed to Voron's `v0`, Tronxy's CRUX1 no longer to Bambu's
x1).

### Three new protocol clients

For printers the existing Bambu MQTT / Moonraker / PrusaLink /
OctoPrint / SACP / AnkerMake clients didn't reach.

**`duet-client.js`** — Duet/RepRapFirmware HTTP REST. Targets the
official DWC interface used by Duet 2/3, E3D Toolchanger, Hangprinter,
many high-end community builds. Session-aware (rr_connect timeout
tracking), normalises RRF status codes I/P/S/A/D/R/B/F/C/M into our
standard `gcode_state` schema, full command set + file ops.

**`flashforge-client.js`** — native FNet TCP-socket protocol on port
8899. Used by Adventurer 5M / 5M Pro / AD5X / Creator 4 / Guider 3
Plus when running stock firmware (no Klipper mod required). ASCII
`~M### args\r\n` framing with `\r\nok\r\n` response delimiter, M601
S1 login on connect, 3 s heartbeat, 5 s response timeout, auto-
reconnect with backoff, partial-buffer accumulation for split TCP
frames. Chunked binary file upload via M28 + raw socket writes + M29.

**`repetier-client.js`** — Repetier-Server REST API (default port
3344). Per-slug routing for multi-printer Repetier-Server installs,
dedicated continueJob/stopJob/copyModel-autostart endpoints, generic
gcode passthrough. apikey auto-appended to every request.

`printer-manager.js` `_getConnectorType` extended to dispatch to the
new clients and a handful of new Klipper-brand aliases (anycubic /
sovol / biqu / bigtreetech / twotrees / tronxy / mingda / kywoo).
`_canConnect` per-type validation (Duet/FlashForge: IP only,
Repetier/OctoPrint/PrusaLink: IP + apikey, FlashForge: no auth).
Settings → Add Printer dropdown gained the three new options with
per-type help blocks.

### Printer image service

- `server/printer-image-service.js` — disk cache of vendor product
  photos under `data/printer-images/{slug}.bin` + `{slug}.meta.json`.
  Resolution order: cache hit → registry URL fetch (8 s timeout +
  content-type guard) → on-the-fly SVG renderer
- `server/printer-image-renderer.js` — generates a brand-coloured
  chassis SVG for any printer based on its features. 7 chassis
  archetypes (bedslinger, corexy, corexy_idex, toolchanger, vortek,
  corexz, delta), 17 brand palettes, feature badges (AMS / CFS / IFS
  / CHM / IDEX / LSR / AI / CF / 350°C / MC), build-volume label
- `server/data/printer-image-registry.json` — 75-entry model→URL map
  pointing at OrcaSlicer's open-source profile cover images on
  GitHub (`raw.githubusercontent.com/SoftFever/OrcaSlicer/main/
  resources/profiles/{vendor}/{Model}_cover.png`). Stable, version-
  pinned, free to fetch
- 5 endpoints: GET registry, GET image, POST upload (admin), DELETE,
  POST refresh-all
- Fleet panel updated to fetch real images first, fall back to the
  brand-coloured SVG via `<img onerror>`

### UI improvements — multi-column grid responsiveness

- `.stats-tab-panel` (used by Statistics, Maintenance, Filament,
  Waste, Errors, History, Telemetry, Protection — 8+ panels)
  switched from hardcoded `repeat(3, 1fr)` to
  `repeat(auto-fit, minmax(320px, 1fr))` with `grid-auto-flow: dense`
- 5 settings sub-tab containers (`#printer-sub-content`,
  `#general-sub-content`, `#appearance-sub-content`, `#notif-sub-
  content`, `#system-sub-content`) become auto-fit grids; toolbar /
  ID-wrapper / form-area children auto-promote to full row via
  `:not(.settings-card)` rule
- Inventory Admin, Diagnostics & Tuning, Backup, Analytics, Plugins
  panels reorganised with Quick Actions bars + 2-column auto-fit
  grids and `grid-auto-flow: dense` so small cards backfill any cells
  next to full-width spanning items
- Library section badge updated 7 → 11 → 12 → 13 over the release
  to track AI Forge / Scene Composer / Mesh Repair / Slicer Bridge
  / Slicer Studio
- System section badge 7 → 12 after the three admin panels became
  reachable

### UI fixes

- **System sidebar admin panels were unclickable** — admin-
  diagnostics / admin-inventory / admin-kb had `data-panel` +
  onclick="openPanel(...)" markup but no entries in `PANEL_TITLES`
  or `PANEL_LOADERS`. `openPanel` silently no-ops on unregistered
  names. Fixed: titles + loaders that inject the right container ID
  (vendor-diagnostics-2026 / inventory-admin-2026 / kb-viewer-2026)
  and call the corresponding render function exposed by each
  -2026.js component
- **Command Palette (Ctrl+K) was missing 25 panels** — PANEL_LABELS
  had 43 entries while PANEL_TITLES had 67. Added entries for every
  recently-built feature (AI Forge / Mesh Repair / Scene Composer /
  G-code Studio / G-code Reference / Calibration / Pre-print /
  Slicer Bridge / Slicer Studio / admin-diagnostics / admin-inventory
  / admin-kb / Model Forge / Sign Maker / JSCAD / OctoPrint /
  Resources / Logs / Filament Analytics / 5 CRM modules)
- **Settings → Add Printer dropdown updated** with 10 protocol types
  and richer model hints (Bambu now mentions H2D/H2D Pro/H2C/H2S,
  Moonraker mentions all 7 new Klipper brands, PrusaLink mentions
  MK4S/CORE One/HT90)

### Internal

- New tests: 18 mesh-repair / mesh-transforms / format-converter,
  21 printer-capabilities-2026, 6 bambu-model-detect new cases,
  20 moonraker-brand-repos extended, 13 scene-builder, 10 csg-bsp,
  8 slicer-bridge, 17 native-slicer, 11 printer-image-service,
  7 printer-image-renderer, 26 gcode-reference / gcode-time-estimator,
  10 slicer-profiles, plus AI Forge, Scene Composer groups, generator-
  shape, mesh-primitives, text-intent-parser suites
- Test count: **725 → 783** since v1.1.19 (full suite passing)
- 21 server modules previously developed but not git-tracked are
  now in the repo (filament-db-refresh, spoolman-*, kb-importer,
  prusa-connect, webhook receivers, etc.)
- `data/` directory entries for printer-images and ai-forge-output
  are runtime-generated — not git-tracked

---

## Unreleased (carried forward — staged for v1.1.21+)

The pre-existing 'Unreleased' content from the v1.1.19 cycle covering
auth/PrusaLink 1.8/Moonraker JWT/Bambu ACS/spoolman v2/H2D AI
toggles/etc. ships as part of v1.1.20 above — those entries
described features now wired end-to-end and committed during this
release cycle.

---

## v1.1.19 → v1.1.20 — historical context kept below

### Vendor firmware compatibility — 2025–2026 rollups

#### Bambu AMS 2 Pro / AMS HT / H2D
- New `detectAmsModel()` identifies AMS 2 Pro (hw_ver `N3F05`), AMS HT, AMS Lite, and classic AMS from the `info.module[]` payload. Exposed as `state._ams_models[]`
- Per-AMS humidity summary now includes the new `humidity_raw` (actual RH%), `dry_time` (minutes remaining), and `dry_sf_reason` (safety-stop reason) fields shipped with AMS 2 Pro and AMS HT firmware
- H2D granular AI toggles under `print.xcam`: `clump_detector` (nozzle clumping), `airprint_detector`, `pileup_detector` (purge chute), and `printing_monitor` master toggle — with correct MQTT field names verified against OpenBambuAPI
- `buildPrintCommand()` now recognises `http://`, `https://`, `file:///`, and `ftp(s)://` URL schemes — enables H2D start-print-over-LAN without a USB stick (Bambu Forum #234923)

#### Moonraker Spoolman v2
- New `_spoolmanProxy()` helper opts into Moonraker's `use_v2_response=true` envelope, separating Spoolman-side errors from Moonraker transport errors
- Proxy path corrected from `/api/v1/spool` → `/v1/spool` (Moonraker 0.9+ rejects paths not starting with `/v1/`)
- Structured error reporting: `{ ok, data?, error?: { status_code, message } }`

#### Snapmaker U1 Extended / Creality K2 / QIDI Plus4
- No API changes required — these printers work via the existing dynamic `printer.objects.list` auto-discovery
- Chamber heater now promoted to `state._chamber_heater` for quick access — covers K2, QIDI Plus4/Q1 Pro, Voron Nevermore, and Snapmaker U1 cavity heaters regardless of exact `heater_generic <name>` spelling
- `afc` and `ercf` already subscribed for paxx12's AFC-Lite stub; RFID via `filament_detect`

#### Slicer compatibility — 2025–2026 releases

**3MF security hardening**
- `isSafeZipEntryName()` rejects path-traversal (`../`, absolute paths, backslashes, Windows drive letters, null bytes) on every zip entry — mirrors the OrcaSlicer 2.3.2 CVE-worthy 3MF fix
- Safer zip cursor advance so malformed/rejected entries can't break the loop

**New 3MF metadata fields**
- `schema_version` — detected from `.rels` (BambuStudio 2.0+ writes a schema version; older Studio versions can only load geometry from 2.0+ 3MF files)
- `scarf_seam` — from `seam_slope_type=scarf` (PrusaSlicer 2.9, Cura 5.9, OrcaSlicer 2.3)
- `chamber_temp` — from `chamber_temperature` (BambuStudio H2D, QIDI Plus4/Q1 Pro up to 65°C)
- `wipe_tower_type` — new OrcaSlicer 2.3+ field
- `per_extruder[]` — dual-nozzle flow ratio and nozzle volume per extruder (H2D left/right)
- RFID filament metadata per filament (`rfid_uid`, `drying_temp`, `drying_time`) — AMS 2 Pro auto-drying
- `exclude_objects[]` — per-object `id`/`identify_id`/`name` from `Metadata/model_settings.config` for skip-during-print UI
- `bed_count` + `multi_bed` — PrusaSlicer 2.9+ virtual beds migrated to a physical grid

**Extended slicer CLI auto-detection**
- `slicer-service.js` now detects OrcaSlicer, BambuStudio, Elegoo Slicer, QIDI Slicer/QIDIStudio, Snapmaker Orca, Creality Print, PrusaSlicer, SuperSlicer, and CuraEngine (any usable CLI wins — all OrcaSlicer forks share the same `--slice` surface)
- Profile search also covers BambuStudio, Elegoo, QIDI, Snapmaker Orca, and SuperSlicer install trees + user configs

#### Filament ecosystem — round 5 (final wiring + UI)
**Backend completion:**
- `POST/PUT/DELETE /api/inventory/spools` now fires auto-sync hooks to Spoolman fire-and-forget — local CRUD never blocks on remote
- `POST /api/extra-fields/sync` pulls Spoolman's `/extra_field` into our schema table per entity (spool/filament/vendor)
- `GET /api/spoolman/export` emits the full DB as a Spoolman-compatible `{ vendors, filaments, spools }` JSON download
- `GET /api/inventory/spools/:id/qr.png` renders a 256×256 QR code (error-correction M) encoding the spool's `short_id` or numeric id — backed by the `qrcode` npm dep we already carry
- `GET /api/inventory/spools/:id/label` returns a 62×29 mm printable HTML label with QR + material + color + remaining weight + short_id — ready for print-to-PDF
- `POST /api/orcaslicer/filaments/:id/import` promotes an indexed OrcaSlicer community preset into a real `filament_profiles` row (upserts the vendor too)
- `POST /api/filaments/find-match` returns nearest SMDB/3DFP/OrcaSlicer candidates for a (vendor, material, color_hex) tuple

**Frontend (`inventory-admin-2026.js`):**
- Collapsed "Inventory admin" panel on the dashboard with 6 sections:
  - Spoolman health badge (live WebSocket)
  - Initial-import-from-Spoolman wizard
  - Duplicate detection + merge browser
  - Cheapest-retailer-per-filament table
  - Custom-field admin (sync from Spoolman, local CRUD, delete)
  - OrcaSlicer preset browser with search + one-click import
- Top-of-panel conflict banner appears automatically when any spool has a `spoolman_sync_error`
- Export/tools row: Spoolman JSON download, manual price-track, per-vendor SMDB refresh, type-bridge refresh

#### Filament ecosystem — round 4 (full closure)
**New modules:**
- `server/spoolman-sync-hooks.js` — auto-push hooks (spool/vendor/profile) with last-writer-wins conflict detection using `spoolman_updated_at` timestamps
- `server/spoolman-health-monitor.js` — polls Spoolman every 3 min, logs to `spoolman_health_log`, fires `spoolman_offline` / `spoolman_back_online` notifications via the hub + notification channels
- `server/filament-dedupe.js` — fingerprint-based duplicate detection across 3DFP/SMDB/OrcaSlicer; duplicate rows link to a canonical via `duplicate_of`, merged source list tracked in `merged_sources`
- `server/spoolman-import.js` — initial full-import (vendors → filaments → spools) using transactions + `external_id` reconciliation so re-imports update rather than duplicate
- `server/threedfp-price-tracker.js` — multi-listing parser that extracts every retailer from `price_data.listings[]`, stores time-series rows, exposes cheapest-per-profile + trend endpoints
- `server/spoolman-type-bridge.js` — two-way `filament_type ↔ materials_taxonomy` mapping with orphan-tracking

**Extensions:**
- `spoolmandb-modular.js`: new `refreshPerVendorFilaments()` fetches the per-vendor `filaments/<vendor>.json` files from SpoolmanDB for richer per-colour metadata
- `spoolman-client.js`: added `listFilamentTypes()` and `getStats()` endpoints
- `seed-filament-db.js`: now warms the filament image cache, tracks prices, and runs duplicate detection after every seed (all opt-outable)
- Scheduler adds per-vendor refresh + type-bridge refresh to the weekly run

**Migration 127** adds: `spoolman_updated_at` on spools, `spoolman_id/updated_at/synced_at/local_updated_at/duplicate_of/merged_sources` on filament_profiles, `listing_id/retailer/retailer_url/in_stock` on price_history, plus new `spoolman_type_bridge` and `spoolman_health_log` tables

**12 new REST endpoints:**
`POST /api/spoolman/import-all`, `GET /api/spoolman/health-history`, `POST /api/spoolman/refresh-type-bridge`, `POST /api/filaments/detect-duplicates`, `GET /api/filaments/:id/duplicates`, `POST /api/filaments/track-prices`, `GET /api/filaments/cheapest-listings`, `GET /api/filaments/:id/price-trend?days=`, `POST /api/spoolmandb/refresh-per-vendor`, `POST /api/filament-profiles/:id/spoolman-sync`, `DELETE /api/filament-profiles/:id/spoolman-sync`

**Conflict resolution**: each two-way-sync write checks local `spoolman_updated_at` against the remote timestamp and sets `spoolman_sync_error` when a concurrent remote change is detected — UI can show "remote newer, resolve manually" without blocking local edits.

#### Filament ecosystem — round 3 (modular SMDB, OrcaSlicer library, image cache, extra fields)
- **SpoolmanDB modular pull** (`server/spoolmandb-modular.js`) — separately fetches `vendors.json` and `materials.json` so we get vendor logos/country/support-email and a real materials taxonomy (density, glass-transition temp, temp ranges, enclosure/food-safe flags) instead of flat strings. Also extracts the purge matrix when present
- **OrcaSlicer Filament Library sync** (`server/orcaslicer-library-sync.js`) — walks `SoftFever/OrcaSlicer/resources/profiles/<Vendor>/filament/` on GitHub and indexes ~1000+ community filament presets with full raw-JSON payload. Default vendor whitelist (BBL, Generic, Prusa, Polymaker, Bambu Lab, Creality, Elegoo, QIDI, Snapmaker, Voron)
- **Filament image cache** (`server/filament-image-cache.js`) — downloads 3DFP / vendor images to `<data>/filament-images/<sha256>.<ext>` with a 5 MB cap and type whitelist, so the dashboard doesn't leak IPs to third-party CDNs. Auto-prunes stale entries on weekly run
- **Spoolman extra_field schema** — user-definable custom fields per entity (spool/filament/vendor) with UI ordering and choice sets. Mirrors the Spoolman v2 surface
- **Vendor two-way sync hook** — `POST /api/vendors/:id/spoolman-sync` creates or updates the vendor in Spoolman and stores `spoolman_id` + `spoolman_synced_at` locally
- **Locations → Spoolman path** — `locationIdToSpoolmanPath()` walks our `parent_id` hierarchy and emits `"Garage/Drybox-1/Slot-3"` strings Spoolman understands. Auto-applied when `POST /api/spoolman/spool` receives a spool with `location_id` but no `location`
- **Purge matrix** — `filament_purge_matrix` table seeded from SpoolmanDB, `GET /api/filaments/purge-matrix?from=&to=` exposes it
- **TD-vote submission** — `POST /api/filaments/td-vote` exposes the existing `submitTdVote()` database helper
- **New REST endpoints**: `/api/extra-fields/{entity}`, `/api/materials/taxonomy`, `/api/filaments/purge-matrix`, `/api/orcaslicer/filaments[?vendor=&material=]`, `/api/orcaslicer/sync`, `/api/spoolmandb/refresh-modular`, `/api/filament-image?url=`, `/api/filaments/td-vote`, `/api/vendors/:id/spoolman-sync`
- **Migration 126** adds `extra_field_schema`, `materials_taxonomy`, `filament_purge_matrix`, `filament_image_cache`, `orcaslicer_filaments` tables + vendor metadata columns (`logo_url`, `support_email`, `country_code`, `spoolman_id`, `spoolman_synced_at`)

#### Filament inventory + locations upgrades
- **Location climate alerts** — `getLocationAlerts()` now also checks temp/humidity thresholds against the latest recorded reading per location. New API `POST /api/inventory/locations/:id/climate` lets sensors (or a cron) push readings; alert surfaces on the dashboard banner with "since" timestamp
- **Spool expiry warning** — reuses the existing `expiry_date` column. Inventory cards now show a color-coded badge (red = expired, yellow = less than 7 days, blue = less than 30 days) via `inventory-enhancements.js`. API `GET /api/inventory/spools/expiring?within=30`
- **Direct Spoolman two-way sync** — new `server/spoolman-client.js` with full v2 surface (vendors, filaments, spools, locations, extra_field, use). Routes: `POST /api/spoolman/spool`, `PATCH /api/spoolman/spool/:id`, `DELETE /api/spoolman/spool/:id`, `GET /api/spoolman/health`. Per-row sync state tracked via new `spoolman_synced_at` / `spoolman_sync_error` columns
- **Auto-refresh SpoolmanDB + 3DFilamentProfiles** — new `server/filament-db-refresh.js` scheduler (weekly default). Fetches `Donkie/SpoolmanDB/spoolman_json.json` from GitHub, refreshes 3DFP via existing seed pipeline, records state in `brand_data_refresh`. Manual trigger via `POST /api/spoolman/refresh-db`
- **Drag-and-drop spools between locations** — front-end `inventory-enhancements.js` binds `[data-drag-spool]` + `[data-drop-location]` attributes to a PATCH `/api/spools/:id { location_id }` pipe
- **Spoolman live status** — `notify_spoolman_status_changed` + `notify_active_spool_set` Moonraker events broadcast on `spoolman_status` / `spoolman_active_spool` hub channels; dashboard badge (`#spoolman-status-badge`) updates without polling
- **Migration 125** adds `expiry_warn_days`, `spoolman_synced_at`, `spoolman_sync_error` on spools + `last_temp`, `last_humidity`, `last_climate_at`, `climate_alert_since` on locations

#### Web UI integration — all three phases (webhook routes, config fields, feature/diagnostic panels)
**Phase 1 — last mile (makes previously backend-only features usable)**
- `POST /api/webhook/{octoeverywhere,obico,simplyprint}` — registered with session-auth bypass (external services authenticate via shared secret / HMAC); failed verification returns 401 with a structured reason
- Settings → Printers: new form fields for every new auth / feature flag
  - Bambu: `developerMode` checkbox (LAN Authorization Control System)
  - PrusaLink: `password` field + PrusaConnect token/fingerprint when the checkbox is enabled
  - Moonraker: JWT `token` field alongside existing API-key
- Settings → Notifications: new "Incoming webhook integrations" section with shared-secret inputs + example URLs for all three services; secrets masked in `getSafeConfig()`

**Phase 2 — visible vendor-features panel**
- New `public/js/components/vendor-features-2026.js` + `<div id="vendor-features-2026">` container on the dashboard
- Renders conditionally based on state/hub events:
  - Printer-model descriptor (H2D / H2S / H2C Vortek / P2S / classic)
  - AMS 2 Pro / AMS HT drying table with `humidityRaw`, `dryTime`, `drySfReason`
  - H2D granular AI-toggles (clump / airprint / pileup / spaghetti / first-layer / printing-monitor) with live switches
  - Chamber-heater readout + target input (0–65 °C) for X1E/H2D/H2S/H2C
  - Generic fans table (Nevermore / chamber / Squirrel — anything `fan_generic *` or `temperature_fan *`)
  - Exclude-objects skip-during-print buttons + reset-all
  - Moonraker live feed (last announcement / queue change / history entry / filelist change / service transitions)
  - Power devices (smart plug / PSU) with toggle buttons — listens for `notify_power_changed`
- New commands: `chamber_temp`, `xcam_control`, `exclude_object`, `power_toggle` wired end-to-end (frontend → WS → `_buildCommand` → printer client → protocol)
- `buildXcamControlCommand(field, enable)` + extended `buildCommandFromClientMessage` for Bambu; extended `buildMoonrakerCommand` for 11 new Moonraker actions

**Phase 3 — admin diagnostics panel**
- New `public/js/components/vendor-diagnostics-2026.js` + collapsed `<details>` on the dashboard
- One-click buttons for CAN-bus node scan, input-shaper tuning (`MEASURE_AXES_NOISE`, `SHAPER_CALIBRATE X/Y`, `TEST_RESONANCES X/Y`), update refresh, full update, history delete, history reset-totals, notifier test, TigerTag NFC lookup
- CAN-bus scan results arrive via the new `moonraker_canbus_scan` hub channel and render inline with structured error codes
- New REST endpoints: `GET /api/tigertag/lookup?uid=`, `GET /api/presets/printer[?vendor=&model=]`, `GET /api/presets/multi-material[?id=]`

#### Additional webhook receivers
- **Obico** (`server/obico-webhook.js`) — HMAC-SHA256 signature via `X-Obico-Signature` header, raw body verified, 9 event types mapped. Covers both self-hosted Obico and moonraker-obico.
- **SimplyPrint** (`server/simplyprint-webhook.js`) — HMAC-SHA256 over `timestamp.body` (GitHub/Stripe pattern), 5-minute replay window via `X-SimplyPrint-Timestamp`, 11 event types mapped.
- All three webhook modules return the same normalised `{ type, printerId, printerName, printId, fileName, progress, snapshotUrl, error, ... }` shape for downstream routing.

#### TigerTag filament DB lookup
- New `server/tigertag-lookup.js` — resolves TigerTag NFC UIDs to filament profiles via a bundled offline DB + optional online API fallback
- UID normalisation handles case + separators (`de:ad:be:ef` → `DEADBEEF`)
- In-memory cache for the process lifetime; negative lookups cached too
- `mergeOfflineDb()` lets users import tags at runtime

#### Printer model presets (2025–2026 line-up)
- New `server/data/printer-model-presets.json` + `server/printer-presets.js` lookup module
- Seeded with: Bambu H2D/H2D Pro/H2S/H2C Vortek/P2S, Prusa CORE One/One+/One L/MK4S, Creality K2 Plus/K2 Pro, Elegoo Centauri Carbon / CC2, QIDI Plus4/Q1 Pro/Q2/Q2C, Snapmaker U1
- Each preset: build volume, nozzle count, dual-nozzle flag, chamber-heating flag + target, capability tags
- Placeholder entries for announced-but-unshipped hardware (Prusa INDX, Elegoo CANVAS) so the UI can render a "capability recognised, support pending" banner

#### Multi-material system catalogue
- New `server/multi-material-capabilities.js` — canonical descriptor for every MM/toolchanger we recognise (AMS variants, MMU3, ERCF, AFC-Lite, Vortek, QIDI Box, CFS, Snapmaker U1 toolchanger) + INDX and CANVAS placeholders
- `isPlaceholderSystem(id)` surfaces hardware that's announced but not yet accessible

#### Filament types 2025–2026
- New `server/data/filament-types-2026.json` seeds PETG HF, TPU HF, Prusament PC Blend Tungsten, Polymaker Satin, and 15 Snapmaker RFID colors released March 2026
- Tungsten Carbide nozzle metadata (H2D Pro / abrasive filaments)

#### OctoPrint 1.11+ plugin hooks
- `getHealthChecks()` — passthrough to the new `/api/plugin/health_check` endpoint added in OctoPrint 1.11.0
- `getMfaStatus()` — detect and render 2FA enrollment for the new `MfaPlugin` type
- New passthroughs for popular plugins: Octolapse, PrintTimeGenius, HeaterTimeout, Firmware Updater — all return null (not error) when the plugin isn't installed

#### OctoEverywhere webhook receiver
- New `server/octoeverywhere-webhook.js` — `verifyOctoEverywhereWebhook(body, expectedSecret)` validates an OctoEverywhere print-event webhook and normalises it for downstream routing to any of our 7 notification channels
- Constant-time `SecretKey` comparison against the user-configured value (OctoEverywhere does not sign payloads with HMAC — secret is embedded in JSON)
- Full EventType → name map (1–16): `print_started`, `print_complete`, `print_failed`, `print_paused`, `print_resumed`, `print_progress`, `gadget_possible_failure`, `gadget_paused_print`, `error`, `first_layer_complete`, `filament_change_required`, `user_interaction_required`, `non_supporter_notification_limit`, `third_layer_complete`, `bed_cooldown_complete`, `test_notification`
- Handles string / Buffer / pre-parsed bodies; returns structured `{ ok, reason, status }` for 400/401/500 cases
- Accepts minimal payloads gracefully — missing optional fields normalise to `null`

#### Moonraker update_manager + service_start + input shaper
- `refreshUpdateStatus(name?)` (POST `/machine/update/refresh`) — rescans upstream repos without installing
- `triggerFullUpdate()` (POST `/machine/update/full`) — runs klipper + moonraker + system + web-client updates in one go
- New `service_start` action mirrors existing `service_restart` / `service_stop` — full systemd lifecycle from the dashboard
- `measureAxesNoise()`, `shaperCalibrate(axis?)`, `testResonances(axis, output?)` — Klipper input-shaper tuning commands with axis validation (only `[XYZE]` accepted) to prevent gcode injection via the axis parameter

#### ha-bambulab entity parity + chamber control
- AMS tray parsing now surfaces the full ha-bambulab-equivalent attribute set per slot: `tagUid`, `trayUuid`, `trayInfoIdx`, multi-color `colors[]` palette, `bedTempType`, flow ratio `flowRatio` (from `n`), `caliIdx`
- New `buildChamberTempCommand(targetC)` in `mqtt-commands.js` — sets chamber heater target on X1E/H2D/H2S/H2C; clamps to 0–65 °C vendor-safe range and rounds to integer

#### Moonraker history CRUD + notifier test
- `getHistoryJob(uid)`, `deleteHistoryJob(uid)`, `resetHistoryTotals()` fill out the `/server/history/*` surface beyond list + totals
- `testNotifier(name)` triggers a test notification through any configured Moonraker `[notifier]` (Apprise passthrough) — useful for "Test" buttons in the dashboard

#### Generic fan discovery
- Auto-discover `fan_generic *` and `temperature_fan *` Klipper objects (Nevermore carbon filter, Squirrel exhaust, named cooling fans) and expose under `state._generic_fans` — each entry has `kind`, `speed`, `rpm`, `temperature`, `target`
- Mirrors the dashboard pattern we already use for `_generic_heaters`

#### Moonraker power control + object skip
- **`notify_power_changed` handler** — live updates from `[power]` component (smart plugs, GPIO, HomeAssistant switches) broadcast on `moonraker_power` channel
- **`togglePowerDevice(device)`** — reads current state and issues the opposite action; returns the new state
- Removed duplicate `getPowerDevices()` / `getPowerDeviceStatus()` methods; canonical versions kept (the one returning the device status string, not the wrapping object)
- **Klipper EXCLUDE_OBJECT surface** — new `excludeObject(name)`, `excludeObjectById(id)`, and `resetExcludedObjects()` methods so the dashboard can drive skip-during-print on any Klipper printer with `[exclude_object]` (default in OrcaSlicer-configured installs)

#### Moonraker CAN-bus node discovery (setup UI)
- New `scanCanbus(interface?)` method returns a structured `{ ok, uuids, error, interface }` result — distinguishes successful scans (with empty UUIDs) from arbitration errors, unknown interfaces, and unreachable Moonraker
- Error codes: `arbitration_error` (broken termination / single-node bus / no-ACK), `interface_not_found` (no such `can0`/`can1`), `unreachable` (network/auth/timeout), `http_error` (other non-2xx)
- The legacy `getCanbusUuids()` thin wrapper remains for back-compat
- Use case: setup-UI flow for Klipper + Katapult users to find unassigned CAN nodes during initial provisioning

#### Prusa Connect cloud camera relay
- New `server/prusa-connect.js` — `PrusaConnectClient` that pushes JPEG snapshots to Prusa Connect so users can see their prints in the official Prusa mobile app
- `PUT /c/snapshot` with `Token` + `Fingerprint` headers (per Prusa Connect OpenAPI spec); 16 MB size cap enforced client-side
- `PUT /c/info` for camera config/options/capabilities metadata
- Opt-in: users add `prusaConnect: { token, fingerprint }` to the printer config — no effect if the block is missing
- Silent-on-HTTP-error: relay loops keep running even if Prusa Connect is unreachable or returns 5xx

#### Ecosystem & model coverage

**Bambu 2026 model line-up**
- `detectBambuModel(serial)` maps serial-number prefixes (`00M`, `03W`, `01P`, `01S`, `039`, `030`, `094`, `0CM`, `0CS`, `0CC`) to a model descriptor with `id`, `label`, `nozzleCount`, `dualNozzle`, and `amsDefault`
- Covers **H2D** (dual-nozzle), **H2S** (single-nozzle 2× X1C volume), and **H2C Vortek** (7-nozzle, FormNext 2025) alongside classic X1C/X1E/P1P/P1S/A1/A1mini/P2S
- `state._printer_model` populated at constructor time — UI can pick the right variant before the first MQTT payload
- Explicit MQTT `clientId: 3dprintforge-<serial>` — stable across reconnects, avoids library-random IDs and Bambu's flagged `nodered_*` prefix for per-account connection-cap diagnostics

**Moonraker real-time notifications**
- `_handleWsMessage` now handles five additional Moonraker 0.8+ JSON-RPC notifications:
  - `notify_announcement_update` / `notify_announcement_dismissed` → `moonraker_announcement` channel
  - `notify_job_queue_changed` → `moonraker_queue` (live queue state without polling)
  - `notify_history_changed` → `moonraker_history`
  - `notify_filelist_changed` → `moonraker_filelist`
  - `notify_service_state_changed` → `moonraker_service` (systemd Klipper up/down)
- Unknown notification methods are silently ignored — defensive for forward-compat

**AnkerMake marked legacy**
- Anker exited the FDM market in 2025 (M5, M5C, M5X discontinued; no more parts or firmware updates)
- `AnkerMakeClient.connect()` now logs a LEGACY warning; file header documents the vendor exit
- Integration kept for users running existing hardware via ankerctl, but new deployments should pick a different printer

#### Verified no-op items (no code change required)
- **Prusa Core One L bed-LED progress indicator** (firmware 6.5.3+) — drives the physical LED from the printer's own progress value, not exposed as a separate API field. Our existing `mc_percent` surface already stays in sync with the LED
- **Moonraker `enable_inotify_warnings` → `enable_observer_warnings` rename** — this is a `moonraker.conf` server-side config key owned by the user, not read or written by our client

### Bambu Authorization Control System (2025)
- Detects and classifies MQTT auth failures (CONNACK 4/5, "Not authorized",
  "Bad user name or password") and broadcasts a banner to the dashboard
  with hints on enabling LAN-only Developer Mode
- New `developerMode: true` flag in printer config silences the startup
  warning once Developer Mode has been enabled on the printer
- Deduplicated auth-error broadcasts (once per session, not per retry)

### PrusaLink 1.8+ (API-key dropped)
- Switched to HTTP Digest Auth with cached realm/nonce — no more per-request
  401 probe roundtrip once the challenge is known
- Username/password preferred when configured; falls back to API-key only
  for legacy firmware < 1.8
- Broadcasts `auth_error` with credential-hint after persistent 401

### Moonraker / Klipper (0.8+ auth tightening)
- New `_authHeaders()` helper prefers `Authorization: Bearer <token>` over
  `X-Api-Key` (both supported; JWT-first aligns with newer Moonraker releases)
- WebSocket auth now uses one-shot token via `/access/oneshot_token` —
  query-param token avoids the unreliable header-based upgrade auth path
- Sends `server.connection.identify` RPC (replaces deprecated
  `server.websocket.id`) with `client_name: 3DPrintForge`, version, and
  access credentials for proper session tracking

### Internal
- New test suite: `tests/clients/{bambu,prusalink,moonraker}-auth.test.js`
  — 20 tests, 0 regressions on the remaining 178 tests
- `getSafeConfig()` now masks the new `token` and `password` printer fields

---

## v1.1.19 — Model Forge 51 Tools, JSCAD Studio, Electron Desktop App, 10-Brand Deep Integration (2026-04-19)

Adds 34 new parametric generators to Model Forge, bringing the total from
17 to **51 tools** across **8 categories**: Organization, Mechanical,
Printer, Home, Tech, Creative, Calibration, Utilities.

### Batch 1 — Organization (Gridfinity)
- **Gridfinity Baseplate** — 42mm grid, 1..12 units per axis, chamfered pockets
- **Gridfinity Bin** — 1..6 grid units, 2..15 height units (7mm each)
- **Gridfinity Lid** — flat lid with skirt
- **Gridfinity Tool Holder** — block with round tool slots

### Batch 2 — Mechanical
- **Spur Gear** — involute profile, module 0.3..5, bore
- **Timing Belt Pulley** — GT2/GT3/HTD profiles with optional flanges
- **Compression Spring** — helical coil, configurable coils/wire/pitch
- **Print-in-place Hinge** — interlocking knuckles + pin
- **Snap-fit Connector** — cantilever pair (male hook + female catch)

### Batch 3 — Printer
- **Filament Spool Adapter** — annular tube between two hub sizes
- **Cable Chain Link** — drag chain segment with pivot holes
- **First Layer Test** — single-layer calibration pattern
- **Nozzle Storage Block** — labeled bores for M6 nozzles
- **Scraper Holder** — wall-mount bracket

### Batch 4 — Home
- **Wall Hook** — plate + peg with screw holes
- **Cable Clip** — C-shape snap clip
- **Plant Pot** — tapered, hollow wall
- **Desk Organizer** — tray with MxN compartments
- **Wall Bracket** — L-bracket with optional gusset
- **Wall Plate** — EU 86×86mm blank plate
- **Lidded Box** — body + friction-fit lid
- **Peg Rail** — horizontal rail with multiple pegs

### Batch 5 — Tech
- **Phone / Tablet Stand** — tilted back + base + front lip
- **Headphone Stand** — T-shape with cross-bar yoke
- **VESA Mount Plate** — 75 and 100mm MIS-D patterns
- **Electronics Case** — parametric case + lid with standoffs (Pi 4/5, Arduino)
- **Battery Holder** — AA/AAA/C/D/18650/21700/CR123A bores

### Batch 6 — Creative
- **Voronoi Tray** — randomized voronoi compartments
- **Topographic Map** — synthetic terrain from layered noise
- **3D QR Code** — raised QR for URLs, WiFi, any text
- **Shape Extruder** — star, heart, flower, polygon, circle
- **Honeycomb Tile** — hexagonal pattern tile
- **Dice Tower** — tabletop tower with internal bounce ramps
- **Miniature Base** — round tabletop figure base

### Infrastructure improvements
- **mesh-builder primitives**: `addExtrudedRoundedRect`, `addFrustumRoundedRect`,
  `addExtrudedPolygon`, `addExtrudedAnnulus`, `addHelicalTube`, `addHexPrism`, `addTorus`
- **`_shared/validate.js`** — shared num/int/bool/str validators for generators
- **`forge-common.js`** — shared UI helper that cuts new-tool UI code by ~60%
- **Category-grouped Model Forge hub** — tools now organized in the hub view

### Quality
- Every new tool is verified watertight via `lib3mf.IsManifoldAndOriented`
- No slicer mesh repair required — models print as-is

### JSCAD Studio
- Scripted parametric 3D modelling with live code editor
- Server-side rendering via @jscad/modeling in Node VM sandbox (10s timeout)
- All jscad primitives, booleans, transforms, extrusions available
- Binary STL export with triangle count verification
- 4 built-in examples: Cube, Gear, Text Plate, Honeycomb
- Dynamic parameter UI from getParameterDefinitions()

### Complete Prusa Ecosystem Integration
- 6,735 filament profiles from PrusaSlicer (104+ vendor INI files)
- 1,539 print profiles (layer heights, speeds, patterns)
- 254 printer models across all brands
- 968 error codes from Prusa-Error-Codes YAML (buddy/MMU/SLA)
- 26 Prusa-specific G-code commands (M572, M862.x, M701/702, etc.)
- PrusaLink OpenAPI-compliant pause/resume/continue endpoints
- Automatic refresh every 7 days

### All 8 Brands Deep Integration
- Bambu Lab: 230 HMS error codes + 20 G-codes
- Klipper (generic): 32 commands (covers Voron, Creality, Elegoo, AnkerMake, QIDI, RatRig)
- Snapmaker U1: 14 custom G-codes + 10 error codes
- Creality: 9 K1/K2 G-codes + 8 error codes
- Elegoo: 7 Neptune 4 G-codes + 5 error codes
- Voron: 17 community G-codes + 12 mod catalog entries + 5 calibration issues
- AnkerMake: 8 M5/M5C G-codes + 6 error codes
- QIDI: 8 X-Plus 3 G-codes + 5 error codes
- OctoPrint: 402 plugins from official catalog

### OctoPrint Deep Integration
- 50+ WebSocket event types subscribed and mapped to state
- System commands manager (restart, shutdown, reboot, custom)
- User and group management with permission matrix
- Full settings tree viewer
- Plugin inspection with active/installed status
- Connection manager (port, baudrate, printer profile)
- Printer profiles CRUD

### Unified Firmware Update System
- Cross-brand firmware check: Bambu Cloud, Snapmaker Wiki, PrusaLink GitHub, Moonraker update_manager
- Development commits tracking for open-source repos (Snapmaker U1 klipper/moonraker/fluidd)
- Firmware Updates panel in sidebar with badge count
- Formatted release notes with Markdown renderer
- Manual update dialog with instructions for brands that don't support remote trigger
- Dismiss / Mark as Updated for completed updates
- Notifications via all 7 channels

### Bambu Lab Firmware 01.02.00.00 Features
- New MQTT commands: disable_motors, bed_low_power, manual_filament_change, print_while_drying, timelapse_storage, delete_timelapse
- New state: _stopping, _bed_heating_mode, _motors_enabled, _ext_manual_change, _timelapse_storage, _drying_while_printing, _xcam_frame
- HMS errors now include causes, wiki_url, severity

### Electron Desktop App
- Native desktop wrapper for Linux, Windows, macOS
- System tray with printer status (polled every 30s)
- Native OS notifications via IPC bridge
- Application menu with Cmd/Ctrl keyboard shortcuts
- Single instance lock + auto-start at login
- Auto-updater via electron-updater (GitHub releases)
- Custom 3dprintforge:// protocol handler
- File associations for .3mf, .stl, .gcode

### Linux Packaging
- AppImage, .deb (Ubuntu/Debian), .rpm (Fedora/RHEL), Flatpak, Arch pkg.tar.zst, tar.gz
- Arch PKGBUILD in packaging/arch/
- Flatpak manifest with Electron BaseApp runtime
- Universal desktop-install.sh (auto-detects distro)
- systemd user service with auto-restart

### Windows & macOS Packaging
- NSIS installer with desktop/start menu shortcuts
- Portable .exe (no install)
- MSIX/AppX config for Microsoft Store submission
- macOS .zip (unsigned)
- GitHub Actions CI workflow for all platforms
- SignPath.io integration ready for free EV code signing
- SHA-256 checksums for all artifacts

### Bug Fixes
- Defect auto-pause crash: 'entry' undefined in printer-manager closure
- Rediscovery broadcast: old_ip sent as new_ip due to premature mutation
- Bambu Cloud firmware check: Array.isArray guards on devices/modules
- Firmware checker: _info treated as array instead of object
- Library panel: queue list Array.isArray validation
- Camera polling: exponential backoff on error (1s → 2s → 4s → 8s → max 30s)

---

## v1.1.18 — Universal Multi-Printer UI, Analytics, OctoPrint & Snapmaker Deep Integration (2026-04-11)

### Universal Multi-Printer Dashboard
- All 35+ dashboard panels now work with all 8 printer types (Bambu, Snapmaker, Moonraker, PrusaLink, OctoPrint, AnkerMake, Creality, Elegoo)
- Per-printer-type configuration UI for all connector types
- Printer-specific data injection across all core components (filament ring, printer info, controls, camera)
- Three new dashboard panels for complete printer type coverage

### AWStats-Inspired Analytics System
- Full web analytics dashboard: requests per hour, top endpoints, active sessions, device & browser breakdown, operating systems
- Print farm overview cards: success rate, print hours, filament used, spool count, queue status, error count
- System info bar: version, uptime, memory, DB size, Node version
- Print history chart with color-coded success/failure/cancelled visualization

### OctoPrint Complete Rewrite
- WebSocket real-time connection (replaces polling)
- Native OctoPrint API integration with full feature parity
- API key auth, state mapping, camera snapshot, file management

### Snapmaker Deep Integration
- SACP protocol complete rewrite with deep U1 improvements
- SACP connector for J1/Artisan/A-series printers
- Snapmaker 2.0 HTTP connector
- Cloud sync, firmware checking, power monitoring, G-code reference
- J1 IDEX modes (mirror, duplicate, multi-material)
- Ray UDP support, laser/CNC commands, mDNS discovery
- Expanded filament profiles

### AdminLTE 4 UI Framework
- Complete AdminLTE 4 coverage: offcanvas, accordion, list groups, input groups, alerts, progress bars
- Admin features: info-boxes, table enhancer, validation, dropdowns, breadcrumbs, pagination
- Bootstrap 5 JS integration with tooltip migration and sidebar mini-mode
- Custom UI components aligned with Bootstrap 5 / AdminLTE 4 standards

### Responsive Design & Mobile
- Comprehensive responsive design overhaul for mobile/tablet
- iOS native app (IPA) download with dual install options
- App download page with QR codes at /app
- Multiple QR code fixes for iPhone scanability and LAN IP resolution

### Filament Tracking Improvements
- Per-spool filament tracking using OrcaSlicer metadata + NFC color matching
- Spool recalculation with color matching and Moonraker tray tracking
- Filament tracking for all Moonraker/Klipper printers
- Spool quick actions: mark empty, set weight, swap, refill

### Bug Fixes (12 critical)
- Queue panel crash when API returns error instead of array
- Rate limiting triggered by 50 individual cost-estimate calls (replaced with batch endpoint)
- Unbounded proxy cache maps causing potential memory exhaustion (capped at 500 entries)
- Library file upload crash from unprotected writeFileSync
- Camera stream cleanup failure when ffmpeg already exited
- Migration ordering (115, 116, 117) corrected
- weightToLength returning null for empty spools (0 weight)
- Cost report NaN from NULL total_seconds
- Analytics panel crash on non-array API responses
- Library panel crash on non-array file list response
- Norwegian log message replaced with English

### New API Endpoints
- `POST /api/inventory/cost-estimate/batch` — batch cost estimation for up to 200 items in a single request

### Setup & Configuration
- 7-step multi-brand setup wizard supporting all printer brands

---

## v1.1.17 — Security Hardening, Model Forge Expansion, 3D Viewer Enhancements (2026-04-06)

### Knowledge Base Expansion
- 32 printers across 8 brands (Bambu Lab, Snapmaker, Prusa, Creality, Elegoo, Voron, AnkerMake, QIDI)
- 60 accessories (nozzles, build plates, enclosures, tools, upgrades)
- 93 filaments (12 brands: Polymaker, Prusament, eSUN, Hatchbox, Sunlu, Overture, Creality, Snapmaker)
- 81 print profiles for 5 printer models
- Brand-based printer filters (replaces Bambu A/P/X/H2 series)
- 54 learning courses (12 new for multi-brand, Model Forge, calibration)

### EULA
- Full End User License Agreement (EULA.md)
- Modal shown on first launch with checkbox acceptance
- View EULA button in Settings > System > Data
- AGPL-3.0 for personal use, commercial license from GeekTech.no

### Camera Improvements
- Per-printer-type camera: WSS for Bambu, snapshot polling for Moonraker
- U1 uses printer_detection.jpg (fresh) instead of .monitor.jpg (stale)
- Extended firmware auto-detection (paxx12 v4l2-mpp camera)
- Native MJPEG stream when extended firmware is installed

### Community Integrations (paxx12, community repos)
- NFC Filament Tag generator (Model Forge tool #9) — OpenSpool format
- 3MF Converter (Model Forge tool #10) — Bambu Lab → Snapmaker U1
- Klipper Macro Manager — browse and run macros from dashboard
- Quick Actions floating button (8 common operations)
- RFID Mifare Classic format (SnapmakerResearchGroup)
- Extended firmware detection + v4l2-mpp camera support

### Model Info Panel
- Multi-brand support: shows printer details for Bambu, Snapmaker, Klipper, PrusaLink
- Capability badges for Bambu printers
- NFC filament cards for Snapmaker U1
- Klipper position/extruder/chamber info

### UI Polish
- All Norwegian fallback strings translated to English
- Fixed corrupted HTML in review badges (history-table)
- Filament analytics: Norwegian → English (waste, brand, color changes)

### Model Forge Expansion (11 → 17 tools)
- Lattice Structure — BCC/FCC/octet/diamond/cubic cells with configurable strut diameter
- Multi-Color — Multi-object 3MF for AMS/MMU color assignment (stack/side-by-side/inlay)
- Advanced Vase — 7 profiles: cylinder, sine, bulge, flare, twist, hourglass, tulip
- Threads & Joints — M3-M20 bolts, nuts, standoffs, snap-fit clips with helical geometry
- Texture Surface — 8 patterns: diamond plate, knurl, honeycomb, waves, brick, carbon fiber, dots, crosshatch
- 3MF Validator — Validate 3MF files, check mesh integrity, detect extensions, match colors against spool inventory
- 3 new MeshBuilder methods: addRevolutionSurface, addHelicalStrip, addCylindricalHeightmap
- Color matcher API with CIE76 Delta-E sRGB→Lab color distance

### 3D Viewer Enhancements
- Layer scrubber slider for height clipping
- Parts panel with per-object visibility toggle and double-click isolate
- Materials panel showing unique colors with part counts
- Parts button in toolbar (auto-shown for multi-object models)

### Security Hardening (16 improvements, CIS/NIS2 compliant)
- **CRITICAL:** Fixed command injection via ffmpeg — replaced execSync with spawnSync + input validation
- **HIGH:** SSRF guard on webhook dispatcher — blocks private IPs and link-local addresses
- **HIGH:** Auth disabled warning on startup + REQUIRE_AUTH env var
- **HIGH:** Metrics endpoint moved behind authentication
- **HIGH:** Health endpoint stripped of version/node info (moved to /api/health/detail)
- **HIGH:** Camera WebSocket now requires session token or API key
- **MEDIUM:** First-message WebSocket auth (alternative to URL query param token)
- **MEDIUM:** X-Forwarded-For only trusted from TRUSTED_PROXIES env var
- **MEDIUM:** TOFU certificate pinning for MQTT TLS connections
- **MEDIUM:** Plugin integrity verification (SHA-256 manifest hash) + SSRF guard on plugin HTTP
- **MEDIUM:** SMS gateway headers sanitized (blocks host/cookie/authorization injection)
- **LOW:** Session invalidation on role/permission/password changes
- **LOW:** TOTP-specific brute force rate limiting (5 attempts/15min per user+IP)
- **LOW:** CSP hardened: removed unsafe-eval, added frame-ancestors and upgrade-insecure-requests
- **LOW:** getSafeConfig() masks all secrets (tokens, passwords, access codes)
- **LOW:** Backup path traversal guard with startsWith validation

### Server Management
- Restart Server button in Settings → System → Updates
- Clear Browser Cache (unregisters SW, clears all caches, server-side clear)
- Unregister Service Worker button

### i18n & Code Quality
- Merged 7 duplicate i18n keys in en.json — restored 266 lost translation keys
- Replaced 47+ Norwegian fallback strings with English across 20 components
- Fixed filament analytics tabs (lazy i18n loading)
- Replaced 30 Norwegian log/error messages with English
- Switched filament-analytics formatters from hardcoded nb-NO to dynamic locale
- docs/ is now a symlink to website/docs/ for unified documentation

### Bug Fixes
- Camera WSS mixed content on HTTPS
- EULA modal null check and global scope
- Knowledge Base filter by brand instead of Bambu series
- Camera-view log is not defined
- Printer isolation on switch
- False v4l2-mpp detection (probes /status instead of /snapshot)
- Service worker skips /lang/ files for fresh translations

---

## v1.1.16 — Model Forge, Snapmaker Deep Integration, Multi-Brand Support (2026-04-05)

### Model Forge — 3D Model Generation Suite
- 11 parametric generators: Sign Maker, Lithophane, Storage Box, Text Plate, Keychain, Cable Label, Image Relief, Stencil, NFC Filament Tag, 3MF Converter, Calibration Tools (8 sub-tools)
- Shared MeshBuilder with heightmap surface, tube, rounded box primitives
- Pure JS PNG decoder for image-to-3D conversion (no npm deps)
- All models exported as 3MF via lib3mf WASM

### Snapmaker U1 Deep Integration
- 13 custom Klipper modules: machine state, NFC filament, feed system, defect detection, timelapse, print config, flow calibration, power loss, purifier
- NFC filament spool cards with vendor, type, color, weight, temp profiles
- Auto-load/unload with live progress, entangle detection
- AI defect detection (spaghetti, residue, bed, nozzle) with configurable auto-pause
- Print task config toggles, calibration wizard
- 20 filament profiles + 5 process presets from OrcaSlicer
- U1 bed STL model + texture for 3D visualization
- SACP binary protocol client for older Snapmaker machines (A150/A250/A350/J1/Artisan)
- 7 Snapmaker machine definitions

### Bambu Lab Deep Integration
- 12 printer capability configs from BambuStudio (exact feature flags per model)
- 40+ new MQTT commands: calibration, camera, AMS advanced, multi-nozzle, fan v3, HMS
- 12 job states with transition tracking (Pausing/Resuming/Finishing/Stopping)
- HMS error system: 4 severity levels, 16 module IDs
- 7 fan types with air duct modes (cooling/heating/exhaust)
- Filament blacklist (TPU/CF restrictions per AMS)
- Camera resolution switching (720p/1080p)
- Calibration + Camera + System cards in controls panel

### Multi-Brand Printer Support
- PrusaLink REST client with digest auth (Prusa MK4/MK3.9/Mini+/XL)
- Creality, Elegoo, AnkerMake, Voron, RatRig, QIDI via Moonraker
- 15+ model overrides with build volumes and camera modes
- Combined discovery: Bambu SSDP + Moonraker HTTP + SACP broadcast

### Moonraker API Integrations
- File Manager: list, metadata with thumbnails, delete, download
- Job Queue: enqueue, start, pause, remove
- Webcam: snapshot proxy, stream URL (no mixed content on HTTPS)
- Update Manager: status + trigger
- Spoolman: proxy integration
- File upload to all Moonraker/PrusaLink printers

### Network & Remote Access
- SSL certs auto-include all local IPs and hostname
- Server accessible via IP, hostname, and localhost
- System info shows network interfaces and ports
- Cloudflare Tunnel integration (quick tunnel, no account needed)
- Camera snapshot polling on HTTPS (no separate cert for camera port)

### Library Improvements
- "Send to Printer" button on every library file
- Printer selector dialog with instant print option
- "Add to Queue" from library cards
- Reorganized dialog layout

### Other Features
- G-code analyzer: layers, extrusion, temps, warnings, filament weight
- G-code 3D toolpath viewer with layer scrubber
- Pre-print confirmation dialog with settings overview
- PWA push notifications via service worker
- Print farm load balancing (material/capability/enclosure scoring)
- Plugin system: route registration, UI panels, timers, DB access
- Community filament reviews + per-printer settings tables
- AMS drying card with material presets (PLA/PETG/ABS/TPU)

### Bug Fixes
- Camera WSS for HTTPS access (mixed content fix)
- Printer isolation: full re-render on switch, reject orphan commands
- Sign Maker: mirrored text in 3MF fixed, proportional preview sizing
- Norwegian fallback strings translated to English
- Capability cache cleared on printer deletion

### Tests
- 99 tests total (all passing)
- MeshBuilder, image-to-heightmap, all 8 Model Forge generators
- Snapmaker state map, DB operations, API endpoints
- E2E tests for SM filament, defect, calibration APIs

---

## v1.1.15 — 3MF Consortium Integration, Gcode Toolpath & Universal 3D Preview (2026-04-04)

### 3MF Consortium Integration
- lib3mf WASM (v2.5.0) for spec-compliant 3MF parsing
- 3mfViewer embedded viewer with scene tree, materials, wireframe
- 3MF validation endpoint

### Gcode Toolpath Viewer
- Server-side gcode parser with per-layer colour visualisation
- Automatic download from Moonraker HTTP API or Bambu FTPS
- Gzipped caching for instant repeat views

### Universal 3D Preview
- Works for all printer types (Bambu, Snapmaker, Voron, Creality)
- Automatic strategy selection via printer-capabilities.js
- 3D buttons in history, library, queue, scheduler, gallery
- History 3MF linking — upload/replace/delete 3MF per print
- Drag-and-drop upload when no model available

### English Only
- Entire application converted to English (800+ strings across 70 files)
- Removed Norwegian from i18n system, setup wizard, print stages
- Documentation site keeps English + Norwegian translations

### Infrastructure
- Removed deprecated --experimental-sqlite flag
- Updated install.sh, uninstall.sh, Dockerfile, start.sh
- New data directories: library, model-cache, history-models, toolpath-cache
- CSP updates for WASM and iframe support
- DB migration v112: linked_3mf column

---

## v1.1.14 — AdminLTE 4, CRM System & Achievement Landmarks (2026-03-30)

### AdminLTE 4 Integration
- Complete HTML restructuring migrated to AdminLTE 4 framework
- Treeview sidebar with proper section toggling and menu-open support
- CSS redesign with AdminLTE 4 Premium styling
- CSP updated to allow cdn.jsdelivr.net for AdminLTE assets
- Theme.js null-safe body check for dark/light mode

### CRM System (5 Phases)
- Phase 1: Database schema + full CRUD API for customers, orders, invoices
- Phase 2: Complete frontend with 4 panels (customers, orders, invoices, business settings)
- Phase 3: Print history integration with customer selection dialog
- Phase 4: Invoice generation, business settings, improved CRM dashboard
- Phase 5: Complete i18n — 107 CRM keys translated to all 2 languages

### Achievement Landmarks (18 World Landmarks)
- 18 landmark achievements from all supported language regions:
  Viking Ship (NO), Statue of Liberty (EN), Eiffel Tower (FR), Big Ben (EN),
  Brandenburg Gate (DE), Sagrada Família (ES), Colosseum (IT), Tokyo Tower (JA),
  Gyeongbokgung (KO), Dutch Windmill (NL), Wawel Dragon (PL), Cristo Redentor (PT-BR),
  Turning Torso (SV), Hagia Sophia (TR), Motherland Monument (UK), Great Wall (ZH),
  Prague Orloj (CS), Budapest Parliament (HU)
- Legendary achievements: Statue of Liberty and Eiffel Tower at 1:1 scale
- Click on achievement shows detail popup with XP, rarity, and progress
- Achievement i18n: rarity, category, completed_msg, keep_going translated to 2 languages

### Modern UI & Dark Theme
- Teal accent color, gradient titles, hover glow effects, floating orbs
- Improved dark theme with better text contrast
- Panel-active and view-hidden CSS fixes — all panels now work correctly
- Toast notifications moved to bottom-right with clear dismiss button, no longer blocking navbar

### Dashboard Layout
- 2-column layout as default, optimized for 24–27" monitors
- 3D/camera fills available space, filament/AMS compact below
- Temperature/fans cards hidden from main dashboard (info already in stats strip)
- Optimized dashboard layout with large 3D/camera and compact filament/AMS sections

### AMS & Filament
- AMS humidity 5-level rating + temperature assessment with storage recommendations
- AMS info bar redesigned — removed A1-A4 tabs, expanded humidity + temperature display
- EXT spool shown inline with AMS spools for better space utilization
- Filament section redesigned with large spools matching AMS style
- Filament spool horizontal layout — spool left, info right
- Filament spools with full info: brand, weight, temperature, RFID, color
- Click on spool in filament section opens detail popup
- AMS spool consistent sizing with flex layout (min/max width)

### Live Filament Tracking
- Real-time filament tracking during printing via cloud estimate fallback
- Filament ring live update — re-render on cloud estimate + fingerprint fix
- EXT live filament tracking — startOfPrintG calculation for EXT without AMS sync

### Alerts & Notifications
- Global alert bar with improved toast visibility
- Removed global alert bar blocking sidebar — moved to fixed top-right
- Low-filament toasts removed — shown visually in spool rings and AMS panel instead

### Cost Estimator
- Filament change time added to cost estimator with visible change counter

### Guided Tour
- All 14 guided tour keys translated to 2 languages
- Tour tooltip positioning fix — removed translateY, uses direct calculation
- Tour tooltip stays within viewport — measures height and clamps top

### Knowledge Base
- 5 new KB pages + compatibility matrix, translated to 2 languages
- Material tips/warnings translated to all 2 languages

### Internationalization
- Complete i18n audit: all 3,252 keys translated to 2 languages
- 18 landmark achievement descriptions translated to all 15 non-English/non-Norwegian languages
- CRM system: 107 keys translated to all 2 languages

### Bug Fixes
- Sidebar works with AdminLTE 4 treeview — thorough cleanup
- Ctrl+Shift+R keeps you on current page
- Camera fills card properly
- Notifications no longer block UI and can be dismissed
- EXT spool always visible + percentage centered in spool ring

---

## v1.1.13 — Filament Tracking Accuracy & Complete i18n (2026-03-26)

### Filament Tracking
- Consistent `Math.min(AMS sensor, spool database)` across all filament displays (filament-ring, active-filament, filament-tracker, multicolor-panel, ams-panel)
- EXT spool detection for P2S/A1 AMS Lite via MQTT `mapping` field (firmware doesn't report `vt_tray`)
- 4-tier filament tracking fallback: AMS diff → EXT direct → cloud estimate → duration estimate
- Cloud estimate fetched at both print start and end (fixes server restart race condition)
- Waste double-counting fix for failed/cancelled prints
- Cost calculation properly handles failed prints without double-counting
- Waste statistics now include filament from failed prints

### AMS & Dashboard
- LIVE badge with pulse animation on filament card
- Data source indicator showing AMS sensor vs database values
- EXT spool shown correctly in filament ring, active filament panel, and AMS panel
- `_getActiveFilament()` correctly reads EXT spool data from inventory instead of AMS tray 0

### Maintenance Panel
- New nozzle types: Brass (standard), HS01 (Bambu) with correct lifespans from knowledge base
- New components: Z-axis, linear bearings, AMS, AMS sensors, filament drying
- New actions: dried, calibrated
- New "Guide" tab with maintenance cards linking to `/docs/kb/vedlikehold/`
- Recommended intervals table aligned with KB documentation
- Nozzle lifespan table (brass 200–500h, hardened steel 300–600h, HS01 500–1000h)
- Build plate lifespan table (Cool, Engineering, High Temp, Textured PEI)

### Internationalization
- Complete i18n: all 2 languages now have 100% coverage (2,944 keys each)
- 1,174+ missing keys translated per language across 45+ sections
- Languages: nb, en, de, fr, es, it, ja, ko, nl, pl, pt-BR, sv, tr, uk, zh-CN, cs, hu
- Fixed broken placeholder in Polish, empty values in Japanese/Korean/Turkish/Hungarian

### Other
- Ko-fi donation button in dashboard sidebar and documentation
- Service worker cache versioning (v17→v25)

---

## v1.1.12 — Modular Architecture, Documentation & E-Commerce (2026-03-22)

### Modular Architecture
- database.js (10,306 lines) split into 16 domain modules under server/db/
- api-routes.js restored after failed splitting attempt (stability prioritized)
- 69 automated tests (Node.js built-in test runner)
- 80 input validation points on API endpoints
- 37 silent catch blocks fixed with proper logging

### Print Tracking Improvements
- Server restart during print: correctly calculates start time and filament usage
- Cloud estimate from Bambu Cloud as fallback on server restart
- Model name and MakerWorld link stored in history, gallery and scheduler
- Milestone capture: 3-step fallback (live frame → TLS JPEG → RTSP)
- False temperature alerts eliminated (Bambu standby 140°C ignored)

### Plate Compatibility & Knowledge Base
- 62/62 filaments have plate compatibility (Cool/Engineering/HT/Textured PEI)
- 62/62 filaments have glue stick recommendation (required/recommended/optional)
- Tips per material
- Compatibility matrix with legend, glue stick and tips in filament tool

### Full Pricing Model (Print Farm Academy)
- Cost calculator upgraded: labor, waste, markup, sale prices (2×/2.5×/3×)
- New settings: setup time, markup, nozzle cost, waste factor
- labor_rate_hour bug fixed (labor cost was always 0)
- Pricing model integrated in order panel

### E-Commerce & Licensing (GeekTech.no)
- License validation against GeekTech API (POST /api/license/verify)
- Supports domain, IP, MAC and IP+MAC binding
- 32-character hex license key with automatic IP/MAC detection
- Full CRUD for orders (create, edit, delete, duplicate)
- Cost summary with suggested sale prices per project

### Docusaurus Documentation Site
- 82 documentation pages (72 docs + 10 guides)
- Fully translated into 2 languages (1400+ files)
- Guides: first print, filament setup, daily use, plate selection, troubleshooting, alerts, OBS
- Knowledge base: filaments, build plates, maintenance, troubleshooting
- GitHub Pages deploy with Actions workflow
- Available at /docs/ from the dashboard

### Security & Performance
- Secure flag on session cookies with HTTPS
- N+1 query in getSpools fixed with batch query
- New database index on print_history.started_at
- readBody returns 400 on invalid JSON
- Intervals cleared on shutdown (no memory leak)
- Docker healthcheck fixed for HTTPS mode

### Translations & Visual Cleanup
- 12 components translated to Norwegian (Loading, Error, Quick Commands, etc.)
- 25 dead files deleted (13 frontend-split, 12 route-split)
- CSS variables fixed (var(--border) → var(--border-color))
- PWA theme-color corrected (#00d4ff → #00AE42)
- tabs.waste "Poop" → "Waste"
- Service worker bumped for cache update

### All Bambu Lab Printers Supported
- X1C, X1C Combo, X1E
- P1S, P1S Combo, P1P
- P2S, P2S Combo
- A1, A1 Combo, A1 mini
- H2S, H2D (dual nozzle), H2C (toolchanger)

---

## v1.1.11 — Filament Analytics, Cloud API, RFID Library, OBS Redesign & Multi-Repo Integration (2026-03-19)

### Bambu Lab Cloud API (42 methods)
- Full Cloud API coverage: file upload, cloud print, device binding, user profile, 2FA
- Token auto-refresh every 12 hours with expiry detection
- MakerWorld design search and 3MF download

### Filament Analytics (8 tabs)
- Daily/weekly/monthly consumption tracking with aggregation
- Material consumption rates, waste analysis, efficiency metrics
- Depletion forecast with estimated empty date per spool
- Cost analysis per vendor with utilization rate
- Material substitution rules (10 predefined)
- RAL color lookup (32 colors) with Delta-E matching
- Storage alerts with humidity/temperature thresholds
- Expiry date tracking for spools

### SpoolEase Integration
- 109 spool weights from catalog for accurate gross weight measurement
- 75 Bambu Lab filament codes with temperature ranges
- K-factor calibration per spool/printer/nozzle
- Consumed-since-weighing with weighing workflow
- Improved G-code parser with density/diameter from comments

### Bambu Lab RFID Library
- 223 variant→color mappings with hex codes and color names
- 36 material types with drying recommendations from RFID data
- Auto-enrichment of AMS trays with variant database
- Fuzzy matching for tray_id_name variants

### BambuBoard — 36 Print Stages
- Complete `stg_cur` mapping with translations and SVG icons
- Stage badge in control panel, fleet dashboard and countdown timer
- Print stage in telemetry historical data

### OBS Overlay Redesign
- Side panel layout (320px) with transparent background
- SVG spool visualizations for AMS trays with fill level
- Progress ring, temperatures, print stage badges
- Auto-detection of camera mode (fullscreen vs overlay)
- OBS settings updated with position, MJPEG and snapshot URLs

### Camera
- MJPEG HTTP stream (`/api/printers/:id/stream.mjpeg`)
- JPEG snapshot endpoint (`/api/printers/:id/frame.jpeg`)
- Direct camera URLs in OBS settings with copy button

### Label Generator Redesign
- SVG spool visualization with fill level on each card
- Color stripe, progress bar, vendor, temperatures, RAL code
- Filament profile labels as new type
- Size selection (S/M/L) with grid adjustment

### Fleet Dashboard
- Grid layout selector (Auto/1/2/3/4 columns) with localStorage persistence
- Printer maintenance mode with orange badge and dimming
- Labels for sorting and actions

### BamBuddy Features
- AMS remote drying via MQTT (start/stop with temperature and duration)
- Print history photo linking (screenshots → print)
- MQTT debug system with real-time WebSocket stream
- Firmware status check per module
- Timelapse re-encoding with speed, quality and trimming

### Maintenance
- Wear prediction moved as a tab into the maintenance panel
- Monitoring section cleaned up (5 → 4 buttons)

### Bug Fixes
- Special characters (æøå) corrected in all API messages, print stages and OBS
- SVG layer icon fixed (missing width/height, was too large)
- Thumbnail URL in OBS corrected to proper API route

### Database
- Migrations v96–v103 with auto-seeding of SpoolEase and RFID Library data

---

## v1.1.10 — Spool Visuals, Learning Center, Knowledge Base & UI Overhaul (2026-03-12)

### Spool Visuals
- All filament color indicators replaced with realistic spool SVG visuals across the entire dashboard
- New global `miniSpool()` and `spoolIcon()` utilities for consistent spool rendering
- Filament ring card redesigned with responsive spool visual, winding detail and container queries
- Active filament, history, statistics, waste, forecast and filament tracker all use spool visuals

### Knowledge Base & Learning Center
- Knowledge base expanded to 169 items: 18 printers, 35 accessories, 62 filaments, 54 profiles
- Added 8 new accessories (Liquid Glue, Hardened Steel Nozzle, AMS Lite Hub, Bambu Studio, OrcaSlicer, etc.)
- Added 6 new filaments (PA Basic Nylon, HIPS, PLA Dual Color Silk, PLA Impact Tough, PETG Matte, ABS Matte)
- Added 10 new printer profiles (H2S, H2C, X1C, X1E, P1P, A1 configurations)
- Learning center expanded from 18 to 42 courses across all 5 categories
- New courses covering slicer guides, troubleshooting, print techniques, filament care, maintenance and automation

### UI Redesign
- Complete CSS design system overhaul with refined transitions, grid layouts and glass morphism
- Redesigned panels: protection, health, diagnostics, error analysis, queue, bedmesh, AMS
- Improved filament tracker, statistics, telemetry, waste, calendar and multicolor panels
- Redesigned login, setup and public status pages
- Updated theme system with improved animations and variables

### New Features
- Achievements system expanded to 103 achievements with XP progression
- Forecast panel rewritten with improved material predictions
- OBS overlay settings page with URL builder, live preview and setup guide
- History stats moved to dedicated analysis panel
- Sidebar navigation consolidated with filament sub-tabs

### Bug Fixes
- Fixed false "Print complete" notification on page load when printer already in FINISH state
- Only error/warning toasts now feed into notification center (no more routine message spam)
- Fixed `#settings/system/energy` hash routing (energy tab was missing from route list)
- Fixed AMS gram display accuracy and cost calculations
- Removed unused dashboard-dnd and favorites components

---

## v1.1.9 — Print Guard, History Sorting, AMS Redesign & 3D Progress Fix (2026-03-08)

### Print Guard / Protection System
- Fixed guard system being completely non-functional (default settings fallback)
- Guard now works out-of-the-box without requiring manual database setup
- Fixed race condition where protection panel overwrote errors panel content

### Error Handling
- Eliminated false HMS errors (0500_0500, 0500_0600, 0C00_0300)
- Added print error dedup across server restarts
- Added PRINT_ERROR_IGNORE set for known false positives (0300_8003)
- HMS codes in FINISH/IDLE state are now ignored

### History Panel
- Sort by date, name, duration, filament usage, or status
- Toggle between grid and list view (compact rows with thumbnails)
- Sort direction and view mode persisted in localStorage

### Waste History
- Sortable waste history entries (date, waste, used filament, duration)
- Client-side sort with toggle direction

### 3D Preview & Fullscreen
- Progress line now uses actual print percentage (mc_percent) instead of layer ratio
- Fixes mismatch between progress bar and 3D reveal on both dashboard and fullscreen
- Added fullscreen info bar with print progress %, status, time remaining, ETA, and layer info
- Info bar uses proper theme colors for readability in both light and dark mode

### AMS Panel
- Tabs restyled with pill/capsule borders (Bambu Studio style)
- Tabs aligned directly above their respective filament cards
- Humidity indicator now uses pill-style border
- Layer label in fullscreen uses proper i18n template interpolation

### Translations
- Added progress state keys: printing, paused, finished, idle, preparing, failed (nb/en)
- Added history sort keys: sort_date, sort_name, sort_duration, sort_filament, sort_status (nb/en)
- Added waste sort keys: sort_date, sort_waste, sort_used, sort_duration (nb/en)

### Technical
- Service worker cache bumped to v5
- G-code console history styling added

---

## v1.1.8 — Inventory UX, Cost Analytics, AMS Sync & Smart Cost Handling (2026-03-03)

### Inventory & Cost
- Inventory UX improvements with cost analytics
- AMS sync enhancements
- Smart cost handling and recalculation

### Queue & Controls
- Queue staggering and layer pauses
- Z-offset wizard
- Spool refill tracking
- DYMO/ESC-POS label printing

### Camera & Telemetry
- Camera screenshots
- Telemetry charts for print progress, layers, WiFi signal
- Temperature trends

### Cloud Integration
- Cloud print history import
- Retroactive print capture
- AMS inventory tracking
- Bambu Cloud login
- Printer discovery

### UI
- Settings search
- Sub-tab navigation for all settings
- Consolidated filament dashboards
- Multi-method tag scanner (camera, USB reader, manual entry)

---

## v1.1.7 — NFC Scanner, Filament Tracking & Cloud Thumbnails (2026-03-03)

### Filament & AMS
- AMS import and filament tools improvements
- Estimated remaining filament after print on AMS and filament panels
- Fixed filament remaining mismatch between AMS and active filament panels

### Camera
- P2S camera detection
- Cloud thumbnail caching and fallback

### Maintenance
- Fixed nozzle session retire SQL bug

### Telemetry
- Telemetry charts for print progress, layers, and WiFi signal

---

## v1.1.6 — Feature Parity Release (2026-03-03)

### Learning Center & Knowledge Base
- Multi-step course system with progress tracking per user
- Categories: Getting Started, Filament Guide, Maintenance, Print Quality
- Searchable knowledge base: printers, accessories, filaments, slicer profiles
- Full CRUD with tagging, cross-category search, seed data generator

### Filament Inventory Enhancements
- **Favorite spools** — heart toggle, favorites sorted to top
- **Color family filter** — 12 HSL-based color chips
- **View modes** — Grid, List, Table views with saved preference
- **Bulk add** — quantity field (1–50) for creating identical spools
- **HueForge TD** — Transmission Distance field for lithophane printing
- **Shareable color palette** — public URL with color swatches and view counter
- **Enhanced import** — drag-and-drop CSV/JSON with vendor auto-detection (Polymaker, Prusament, eSUN, Spoolman)
- **Duplicate detection** during import with preview table

### Print Queue Enhancements
- **Multi-target dispatch** — select multiple printers per queue job
- **Pre-print filament check** — verifies spool weight and AMS material match
- **Intelligent load balancing** — dispatches to printer with lowest job count

### Cloud Slicer Integration
- File upload with drag-and-drop (3MF, G-code, STL, OBJ, STEP, up to 100 MB)
- Auto-detects OrcaSlicer and PrusaSlicer CLI
- Automatic slicing with filament estimates and print time
- FTPS upload to printer SD card
- Job tracking (uploading → slicing → ready → uploaded)

### SMS Notifications (7th Channel)
- Twilio integration with Account SID, Auth Token, From/To numbers
- Generic HTTP SMS gateway support for any SMS API provider
- Full integration with all 14 notification events

### Locale & Currency
- Locale-based currency formatting using `Intl.NumberFormat`
- Applied to spool costs, print cost estimates, price history

### Technical
- Database migrations 57–60
- New module: `server/slicer-service.js`
- ~80 new i18n keys across all 2 languages

---

## v1.1.5 — Security Hardening (2026-03-01)

### Security
- Auto-generated self-signed SSL certificates (no manual setup needed)
- HTTPS forced by default with HTTP→HTTPS redirect
- HSTS (Strict-Transport-Security) header
- Content Security Policy (CSP) header
- Config file restricted to owner-only permissions (0600)
- SMTP TLS verification enabled by default

### UI Changes
- Sidebar printer status indicators (online/offline/printing)
- AMS panel visual redesign with compact horizontal layout
- 3D viewport restructured — HUD info moved below canvas
- Improved card grid sizing for 3D view, camera, and AMS panels
- Anatomical bust model for demo mode 3D preview
- Update notification toast banner

### Other
- Spoolman integration support
- Database migrations v12–v20

---

## v1.1.4 — HMS, Skip Objects, OBS, Spoolman, Themes (2026-02-28)

### New Features
- **HMS error code database** — 268 error codes with descriptions and wiki links
- **Skip objects** — skip failed objects during active print via MQTT
- **OBS streaming overlay** — standalone page at `/obs.html` for OBS Browser Source
- **Spoolman integration** — connect to external Spoolman server for filament sync
- **Theme system** — Light/Dark/Auto, 6 color presets, custom accent color, border radius slider
- **Speed slider** — 50%–166% with preset buttons
- **Model info panel** — link prints to MakerWorld, Printables, Thingiverse

### Improvements
- Enhanced thumbnail service with better 3MF parsing
- Sparkline stats strip with rolling 60-sample mini-charts
- i18n strings for all new features across 2 languages

---

## v1.1.3 — Print Guard: Full Sensor Monitoring (2026-02-28)

### New Sensors
| Sensor | What it monitors |
|--------|-----------------|
| Temperature deviation | Nozzle/bed drifting from target |
| Filament runout | AMS tray below threshold |
| Print error | Non-zero error codes |
| Fan failure | Heatbreak fan stopped during print |
| Print stall | Progress stuck for configurable duration |

### Other
- Per-printer configurable actions (notify/pause/stop/ignore)
- Adjustable thresholds (temperature, filament %, stall time)
- Database migration v12

---

## v1.1.1 — Visual Redesign + Print Guard (2026-02-28)

### Visual Redesign
- Complete UI overhaul — glassmorphism effects, Inter font, smooth transitions
- Redesigned all 8 panels
- Hero card grids, SVG icon headers, improved responsive breakpoints

### Print Guard
- Automatic print protection using printer xcam sensors
- Spaghetti detection, first layer issues, foreign objects, nozzle clumps
- Configurable actions per event, cooldown, auto-resume
- Active alert dashboard, protection event log

### Camera & 3D Fullscreen
- Click camera/3D preview to open fullscreen modal
- Real-time layer progress in fullscreen

### Authentication
- Optional password protection with session management
- Environment variable support for Docker/Pterodactyl

### Other
- 6 notification channels: Telegram, Discord, Email, Webhook, ntfy, Pushover
- Database migrations v9–v11
- Pterodactyl egg file with printer config variables

---

## v1.1.0 — 3D Preview, MakerWorld, Notifications (2026-02-26)

### New Features
- **3D print preview** — WebGL model viewer with layer animation and filament colors
- **MakerWorld integration** — auto-detects MakerWorld prints, shows cover image with progress reveal
- **Notification system** — 6 channels, 8 events, quiet hours, test per channel
- **Auto-update** — checks GitHub Releases, one-click update with backup
- **Dashboard layout** — drag-and-drop card reordering with lock/unlock
- **Quick status panel** — fan speeds, WiFi, nozzle, SD, light, speed, errors
- **Thumbnail service** — FTPS fetching from printer, 3MF parsing

### Improvements
- Extended statistics, enhanced telemetry, better error log
- Filament drag-and-drop spool assignment, low stock warnings
- Fan control sliders, temperature presets, G-code console
- Camera reconnection improvements

### Infrastructure
- Dockerfile with healthcheck
- docker-compose.yml with container name
- `.gitignore` and `.dockerignore`

---

## v1.0.0 — Initial Release (2026-02-26)

- Real-time printer monitoring via MQTT
- Temperature gauges and sparkline stats
- Camera livestream via ffmpeg + jsmpeg
- Print history and statistics
- Multi-printer support
- 17 language translations
- Responsive design
