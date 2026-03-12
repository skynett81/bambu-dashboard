# Changelog

All notable changes to Bambu Dashboard.

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
