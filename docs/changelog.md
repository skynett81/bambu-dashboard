# Changelog

All notable changes to 3DPrintForge.

---

## v1.1.17 — Knowledge Base, EULA, Camera Fixes, Community Integrations (2026-04-05)

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

### Bug Fixes
- Camera WSS mixed content on HTTPS
- EULA modal null check and global scope
- Knowledge Base filter by brand instead of Bambu series
- Camera-view log is not defined
- Printer isolation on switch

---

## v1.1.16 — Model Forge, Snapmaker Deep Integration, Multi-Brand Support (2026-04-05)

### Model Forge — 3D Model Generation Suite
- 8 parametric generators: Sign Maker, Lithophane, Storage Box, Text Plate, Keychain, Cable Label, Image Relief, Stencil
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
