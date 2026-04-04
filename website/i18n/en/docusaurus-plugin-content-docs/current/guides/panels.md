---
sidebar_position: 8
title: Navigating the dashboard
description: Learn to navigate 3DPrintForge — sidebar, panels, keyboard shortcuts, and customization
---

# Navigating the dashboard

This guide gives you a quick introduction to how the dashboard is organized and how to navigate it efficiently.

## The sidebar

The sidebar on the left is your navigation center. It is organized into sections:

```
┌────────────────────┐
│ 🖨  Printer status  │  ← One row per printer
├────────────────────┤
│ Overview           │
│ Fleet              │
│ Active print       │
├────────────────────┤
│ Filament           │
│ History            │
│ Projects           │
│ Queue              │
│ Scheduler          │
├────────────────────┤
│ Monitoring         │
│  └ Print Guard     │
│  └ Errors          │
│  └ Diagnostics     │
│  └ Maintenance     │
├────────────────────┤
│ Analytics          │
│ Tools              │
│ Integrations       │
│ System             │
├────────────────────┤
│ ⚙ Settings         │
└────────────────────┘
```

**The sidebar can be hidden** by clicking the hamburger icon (☰) in the top left. Useful on smaller screens or in kiosk mode.

## The main panel

When you click on an item in the sidebar, the content is shown in the main panel to the right. The layout varies:

| Panel | Layout |
|-------|--------|
| Overview | Card grid with all printers |
| Active print | Large detail card + temperature curves |
| History | Filterable table |
| Filament | Card view with spools |
| Analytics | Graphs and charts |

## Clicking on printer status for details

The printer card on the overview panel is clickable:

**Single click** → Opens the detail panel for that printer:
- Real-time temperatures
- Active print (if running)
- AMS status with all slots
- Recent errors and events
- Quick buttons: Pause, Stop, Light on/off

**Click the camera icon** → Opens live camera view

**Click the ⚙ icon** → Printer settings

## Keyboard shortcut — the command palette

The command palette gives quick access to all features without navigating:

| Shortcut | Action |
|----------|--------|
| `Ctrl + K` (Linux/Windows) | Open command palette |
| `Cmd + K` (macOS) | Open command palette |
| `Esc` | Close palette |

In the command palette you can:
- Search for pages and features
- Start a print directly
- Pause / resume active prints
- Switch theme (light/dark)
- Navigate to any page

**Example:** Press `Ctrl+K`, type "pause" → select "Pause all active prints"

## Widget customization

The overview panel can be customized with widgets of your choosing:

**How to edit the dashboard:**
1. Click **Edit layout** (pencil icon) in the top right of the overview panel
2. Drag widgets to the desired position
3. Click and drag the corner of a widget to resize it
4. Click **+ Add widget** to add new ones:

Available widgets:

| Widget | Shows |
|--------|-------|
| Printer status | Cards for all printers |
| Active print (large) | Detailed view of ongoing print |
| AMS overview | All slots and filament levels |
| Temperature curve | Real-time graph |
| Electricity price | Next 24-hour price graph |
| Filament meter | Total consumption last 30 days |
| History shortcut | Last 5 prints |
| Camera feed | Live camera image |
| 3D model viewer | Interactive 3D preview with Three.js and gcode toolpath |

5. Click **Save layout**

:::tip Save multiple layouts
You can have different layouts for different purposes — a compact one for daily use, a large one to display on a big screen. Switch between them with the layout selector.
:::

## Theme — switching between light and dark

**Quick switch:**
- Click the sun/moon icon in the top right of the navigation bar
- Or: `Ctrl+K` → type "theme"

**Permanent setting:**
1. Go to **System → Themes**
2. Choose between:
   - **Light** — white background
   - **Dark** — dark background (recommended at night)
   - **Automatic** — follows the system setting on your device
3. Choose accent color (blue, green, purple, etc.)
4. Click **Save**

## Keyboard navigation

For efficient navigation without a mouse:

| Shortcut | Action |
|----------|--------|
| `Tab` | Next interactive element |
| `Shift+Tab` | Previous element |
| `Enter` / `Space` | Activate button/link |
| `Esc` | Close modal/dropdown |
| `Ctrl+K` | Command palette |
| `Alt+1` – `Alt+9` | Navigate directly to the first 9 pages |

## PWA — install as an app

3DPrintForge can be installed as a progressive web app (PWA) and run as a standalone app without browser menus:

1. Go to the dashboard in Chrome, Edge, or Safari
2. Click the **Install app** icon in the address bar
3. Confirm the installation

See the [PWA documentation](../system/pwa) for more details.

## Kiosk mode

Kiosk mode hides all navigation and shows only the dashboard — perfect for a dedicated screen in the print workshop:

1. Go to **System → Kiosk**
2. Enable **Kiosk mode**
3. Select which widgets should be shown
4. Set refresh interval

See the [Kiosk documentation](../system/kiosk) for full setup.
