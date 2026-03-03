# Changelog

All notable changes to Bambu Dashboard.

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
- ~80 new i18n keys across all 17 languages

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
- i18n strings for all new features across 17 languages

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
