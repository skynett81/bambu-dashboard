---
sidebar_position: 1
title: Welcome to 3DPrintForge
description: A powerful, self-hosted dashboard for all your 3D printers
---

# Welcome to 3DPrintForge

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/V7V21NRKM7)

**3DPrintForge** is a self-hosted, full-featured control panel for all your 3D printers. It gives you complete visibility and control over your printer, filament inventory, print history, and more — all from a single browser tab.

## What is 3DPrintForge?

3DPrintForge connects to your printers via MQTT (Bambu Lab), PrusaLink (Prusa), OctoPrint REST API (Ender 3, Prusa MK3, Anycubic, Artillery), SACP binary protocol (Snapmaker J1, Artisan), Snapmaker 2.0 HTTP API (A150-A350), or Moonraker WebSocket (Snapmaker U1, Voron, Creality, Elegoo, AnkerMake, QIDI, RatRig and other Klipper printers) over LAN. Sync models and print history via Bambu Cloud, Snapmaker Cloud, or fetch data directly from your printer. The built-in **Model Forge** provides 17 parametric design tools so you can create custom models without leaving the dashboard. **Snapmaker U1** is supported with deep integration including NFC filament (auto-synced to inventory), AI defect detection with probability logging, entangle detection, timelapse with frame capture, flow calibration with K-value trends, purifier, and power monitoring.

### Key features

- **Live dashboard** — real-time temperature, progress, camera, AMS status with LIVE indicator
- **3D model viewing** — 3MFConsortium 3mfViewer for 3MF files, gcode toolpath viewer with per-layer colours, Three.js-based rendering
- **Model Forge** — 17 parametric design tools: Sign Maker, Lithophane, Storage Box, Text Plate, Keychain, Cable Label, Image Relief, Stencil, NFC Filament Tag, 3MF Converter, Calibration Tools, Lattice Structure, Multi-Color, Advanced Vase, Threads & Joints, Texture Surface, and 3MF Validator
- **G-code Analyzer** — full G-code analysis with estimated print time, filament usage, layer stats, and 3D toolpath viewer
- **AdminLTE 4** — modern dashboard framework with treeview sidebar and responsive design
- **CRM system** — customers, orders, invoices, company settings with history integration
- **Filament inventory** — track all spools with AMS sync, EXT spool support, material info, plate compatibility, and drying guide
- **Filament tracking** — live tracking during printing with 4-level fallback (AMS sensor → EXT estimate → cloud → duration)
- **Material guide** — 15 materials with temperatures, plate compatibility, drying, properties, and tips
- **Print history** — complete log with model names, MakerWorld links, filament consumption, costs, and 3D preview
- **Planner** — calendar view, print queue with load balancing and filament check
- **Printer control** — temperature, speed, fans, G-code console, Bambu calibration UI, camera controls, AMS drying
- **Print Guard** — automatic protection with xcam + 5 sensor monitors
- **Cost estimator** — material, electricity, labour, wear, markup, filament change time, and suggested sale price
- **Maintenance** — tracking with KB-based intervals, nozzle lifespan, plate lifespan, and guide
- **Sound alerts** — 9 configurable events with custom sound upload and printer speaker (M300)
- **Activity log** — persistent timeline from all events (prints, errors, maintenance, filament)
- **AMS humidity/temperature** — 5-level rating with recommendations for optimal storage
- **Achievements** — 18 world landmarks as milestones for filament consumption with XP progression
- **Notifications** — 7 channels (Telegram, Discord, email, ntfy, Pushover, SMS, webhook) + PWA push notifications
- **Multi-printer, multi-brand** — Bambu Lab (MQTT) + Prusa (PrusaLink) + OctoPrint + Snapmaker (SACP + HTTP + Moonraker) + Voron, Creality, Elegoo, AnkerMake, QIDI, RatRig and all Klipper/Moonraker printers
- **7 connector types** — Bambu MQTT, Moonraker WS, PrusaLink HTTP, OctoPrint HTTP, Snapmaker SACP TCP, Snapmaker 2.0 HTTP, Snapmaker U1 Moonraker
- **AdminLTE 4 fully integrated** — info-boxes, sortable tables, breadcrumbs, pagination, offcanvas, accordions, Bootstrap tooltips, sidebar mini-mode
- **Responsive design** — optimized for desktop, tablet, and mobile (down to 375px iPhone SE)
- **Printer capabilities** — per-brand configuration for file access, camera, and features
- **File library** — 3MF/STL/gcode library with thumbnails, categories, tags, 3D preview, Send to Printer and Add to Queue
- **Remote access** — Cloudflare Tunnel integration for secure access from anywhere
- **PWA** — installable Progressive Web App with push notifications
- **English UI** — entire application in English, documentation available in English and Norwegian
- **Self-hosted** — no cloud dependency, your data on your machine

### New in v1.1.20

- **Native slicer** — pure-JS slicing engine built from scratch (mesh→polygon→infill→G-code), runs without external dependencies
- **Slicer Studio** — full standalone slicer program with Three.js viewport, profile system, and Send-to-Printer
- **Slicer Bridge** — headless slicing via OrcaSlicer / BambuStudio / Snapmaker Orca CLI with auto-detection
- **Scene Composer** — 3D scene editor with BSP-tree CSG (boolean mesh operations)
- **AI Model Forge** — text-to-3D generator with intent parser (signs, lithophanes, holders, etc.)
- **Mesh Repair Toolkit** — automatic repair of broken STL/3MF files
- **G-code Reference & Estimator** — built-in G-code reference with time estimation
- **17 brands / 75+ models** — expanded vendor coverage with Duet/RRF, FlashForge FNet, Repetier-Server
- **Printer Image Service** — real product images from OrcaSlicer GitHub for fleet view
- **23 slicer profiles seeded** — 12 printers, 7 filaments, 4 quality presets ready out of the box
- **Universal multi-column UI** — optimised grid layout for large screens
- **Command Palette fix** — Ctrl+K now shows all 25 panels correctly
- **Sidebar fix** — Library badge updated from 11 to 12 after Slicer Bridge

### New in v1.1.19

- **Model Forge 51 tools** — 34 new across 8 categories: Gridfinity (baseplate/bin/lid/tool holder), mechanical (gear/pulley/spring/hinge/snap-fit), printer (spool adapter/cable chain/first layer test/nozzle storage), home (wall hook/cable clip/plant pot/wall bracket), tech (phone stand/headphone stand/VESA mount/RPi case), creative (voronoi/topographic map/3D QR code/honeycomb/dice tower/miniature base)
- **JSCAD Studio** — scripted parametric 3D modelling with live code editor, @jscad/modeling primitives, STL export, 4 built-in examples
- **Complete Prusa integration** — 6,735 filament profiles, 1,539 print profiles, 254 printer models, 968 error codes, 26 G-codes from PrusaSlicer + Prusa-Error-Codes repos
- **All 8 brands deep** — Bambu (230 HMS + 20 G-codes), Klipper (32), Snapmaker (24), Creality (65), Elegoo (27), Voron (59 + mods database), AnkerMake (20), QIDI (28), OctoPrint (402 plugins)
- **OctoPrint deep integration** — 50+ WebSocket events, system commands, user/group management, settings viewer, plugin inspection, connection manager
- **Unified firmware update system** — check + update + dev commits tracking across all brands via Bambu Cloud, Snapmaker Wiki, GitHub releases
- **Bambu firmware 01.02.00.00 features** — Print While Drying, motor disable, bed low-power mode, manual filament change, internal timelapse storage
- **Electron desktop app** — system tray, native notifications, auto-start at login, auto-updater, deep linking
- **Linux packages** — AppImage, deb, rpm, Flatpak, Arch pkg.tar.zst, tar.gz
- **Windows packages** — NSIS installer, portable exe, MSIX for Microsoft Store
- **macOS** — zip archive (unsigned)
- **6 bug fixes** — defect auto-pause crash, rediscovery broadcast, Bambu Cloud array safety, firmware checker fallback, camera polling backoff

### New in v1.1.18

- **Universal multi-printer UI** — all 35+ dashboard panels now work with all 8 printer types (Bambu, Snapmaker, Moonraker, PrusaLink, OctoPrint, AnkerMake, Creality, Elegoo)
- **AWStats-inspired analytics** — full web analytics with requests per hour, top endpoints, sessions, device and OS breakdown
- **OctoPrint full rewrite** — WebSocket support, native API, full feature parity with other connectors
- **Snapmaker deep integration** — SACP rewrite, Cloud sync, firmware check, power monitoring, J1 IDEX modes, Ray UDP/laser/CNC, mDNS discovery
- **Complete AdminLTE 4** — offcanvas, accordion, list groups, info-boxes, table enhancer, validation, sidebar mini mode
- **Responsive design** — full mobile/tablet optimisation with iOS-compatible QR codes and download pages
- **7-step setup wizard** — multi-brand installer supporting all printer brands
- **Batch cost estimation** — new POST /api/inventory/cost-estimate/batch (up to 200 items)
- **Unified firmware update system** — cross-brand firmware check and update UI in Settings with badge notifications
- **Dynamic Klipper object discovery** — automatic subscription to all available Klipper objects regardless of naming
- **Bambu firmware 01.02.00.00 features** — new commands for disable motors, bed low-power, manual filament change, print while drying
- **12 bug fixes** — API safety, rate limiting, memory leaks, migration ordering, camera cleanup

### New in v1.1.17

- **Model Forge expanded to 17 tools** — 6 new: Lattice Structure, Multi-Color, Advanced Vase, Threads & Joints, Texture Surface, 3MF Validator
- **16 security hardening improvements** — CIS/NIS2 aligned: command injection fix, SSRF guards, camera WS auth, TOFU cert pinning, plugin integrity, session invalidation, TOTP rate limiting, CSP hardening
- **Enhanced 3D viewer** — layer scrubber, parts panel with visibility toggle, materials panel
- **Server management** — restart server, clear cache, unregister service worker from Settings
- **Color matcher** — match 3MF colours against filament inventory with CIE76 Delta-E
- **i18n quality** — merged 7 duplicate keys (restored 266 translations), replaced 77+ Norwegian strings

### New in v1.1.16

- **Model Forge** — 11 tools: Sign Maker, Lithophane, Storage Box, Text Plate, Keychain, Cable Label, Image Relief, Stencil, NFC Filament Tag, 3MF Converter, Calibration Tools
- **Multi-brand** — PrusaLink (Prusa MK4, Mini, XL), Creality, Elegoo, AnkerMake, Voron, RatRig, QIDI via Moonraker
- **Snapmaker U1 deep integration** — NFC filament, AI defect detection, timelapse, print config, calibration, purifier, power monitor, SACP for older models
- **Bambu Lab enhancements** — 40+ MQTT commands, calibration UI, camera controls, AMS drying, HMS error system
- **Moonraker API** — file manager, job queue, webcam, update manager, Spoolman
- **Remote access** — Cloudflare Tunnel in Settings > System > Remote Access
- **Library** — Send to Printer and Add to Queue buttons on file cards
- **G-code** — Analyzer with 3D toolpath viewer
- **PWA** — installable webapp with push notifications

### New in v1.1.15

- **3MF Consortium integration** — lib3mf WASM for spec-compliant 3MF parsing, 3mfViewer embed for full 3D viewing
- **Gcode toolpath viewer** — per-layer colour visualisation for all Moonraker/Klipper printers
- **Three.js EnhancedViewer** — smooth shading, orbit controls, clipping planes for print progress
- **Universal 3D preview** — works for all printer types (Bambu FTPS, Moonraker HTTP, local files)
- **Printer capabilities** — per-brand/model configuration (Bambu Lab, Snapmaker, Voron, Creality, etc.)
- **History 3MF linking** — upload, replace and delete 3MF files linked to print history
- **Auto 3MF caching** — saves model name and metadata from Bambu printer at print start
- **3D buttons everywhere** — history, library, queue, scheduler and gallery

### New in v1.1.14

- **AdminLTE 4 integration** — complete HTML restructuring with treeview sidebar, modern layout and CSP support for CDN
- **CRM system** — full customer management with 4 panels: customers, orders, invoices and company settings with history integration
- **Modern UI** — teal accent, gradient titles, hover glow, floating orbs and improved dark theme
- **Achievements: 18 landmarks** — Viking ship, Statue of Liberty, Eiffel Tower, Big Ben, Brandenburg Gate, Sagrada Familia, Colosseum, Tokyo Tower, Gyeongbokgung, Dutch windmill, Wawel Dragon, Cristo Redentor, Turning Torso, Hagia Sophia, The Motherland, Great Wall of China, Prague Astronomical Clock, Budapest Parliament — with detail popup, XP and rarity
- **AMS humidity/temperature** — 5-level rating with recommendations for storage and drying
- **Live filament tracking** — real-time updates during printing via cloud estimate fallback
- **Complete i18n** — all keys translated, now English-only UI with Norwegian documentation

## Quick start

| Task | Link |
|------|------|
| Install the dashboard | [Installation](./getting-started/installation) |
| Configure first printer | [Setup](./getting-started/setup) |
| Connect to Bambu Cloud | [Bambu Cloud](./getting-started/bambu-cloud) |
| Explore all features | [Features](./features/overview) |
| Filament guide | [Material guide](./kb/filaments/guide) |
| Maintenance guide | [Maintenance](./kb/maintenance/nozzle) |
| API documentation | [API](./advanced/api) |

:::tip Demo mode
You can try the dashboard without a physical printer by running `npm run demo`. This starts 3 simulated printers with live print cycles.
:::

## Supported printers

### Bambu Lab (via MQTT)
- **X1 series**: X1C, X1C Combo, X1E
- **P1 series**: P1S, P1S Combo, P1P
- **P2 series**: P2S, P2S Combo
- **A series**: A1, A1 Combo, A1 mini
- **H2 series**: H2S, H2D (dual nozzle), H2C (tool changer, 6 heads)

### Prusa (via PrusaLink HTTP API)
- **MK4** / **MK4S**
- **Mini** / **Mini+**
- **XL** (multi-tool)

### Klipper/Moonraker printers (via WebSocket + REST API)
- **Snapmaker**: U1 (up to 4 toolheads, deep integration with SACP), J1, A350T, A250T
- **Voron**: V0, Trident, V2.4
- **Creality**: K1, K1 Max, K2 Plus (with Klipper firmware)
- **Elegoo**: Neptune 4, Neptune 4 Pro, Neptune 4 Max (with Klipper firmware)
- **AnkerMake**: M5, M5C (with Klipper/Moonraker)
- **Sovol**: SV06, SV07, SV08
- **QIDI**: X-Max 3, X-Plus 3, Q1 Pro
- **RatRig**: V-Core, V-Minion
- **Any other** Klipper + Moonraker-based printer

## 3D model viewing

3DPrintForge integrates the 3MF Consortium's official tools for 3D model viewing:

### 3MF files (Library and History)
- **3mfViewer** from [3MFConsortium](https://github.com/3MFConsortium/3mfViewer) — full 3D viewer with scene tree, materials, wireframe and colours
- **lib3mf WASM** for spec-compliant parsing of metadata, thumbnails and mesh data
- Upload 3MF files directly to print history for 3D viewing

### Gcode toolpath (Moonraker and Bambu)
- Per-layer colour visualisation (blue bottom → red top)
- Automatic download from Moonraker HTTP API or Bambu FTPS
- Downsampling for large files (max 100k segments)

### Printer-specific access
| Printer type | 3MF access | Gcode access |
|-------------|------------|--------------|
| Bambu Lab | FTPS (port 990) | Embedded in gcode.3mf |
| Moonraker/Klipper | Not on printer | HTTP API `/server/files/gcodes/` |
| Library files | Local disk | N/A |

## Technical overview

3DPrintForge is built with Node.js 22 and vanilla HTML/CSS/JS — no heavy frameworks, no build step. The database is SQLite, built into Node.js 22.

- **Backend**: Node.js 22 with 6 npm packages (mqtt, ws, basic-ftp, admin-lte, ssh2, @3mfconsortium/lib3mf)
- **Frontend**: AdminLTE 4 + vanilla HTML/CSS/JS + Three.js (vendored) + 3mfViewer (embedded), no build step, PWA support
- **Database**: SQLite (built into Node.js 22)
- **3D viewing**: Three.js r183 + 3MFConsortium 3mfViewer + lib3mf WASM + G-code 3D toolpath viewer
- **Documentation**: Docusaurus with English and Norwegian, automatically built at installation
- **API**: 590+ endpoints, OpenAPI documentation at `/api/docs`

See [Architecture](./advanced/architecture) for details.
