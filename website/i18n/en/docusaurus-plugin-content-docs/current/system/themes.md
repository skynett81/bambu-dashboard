---
sidebar_position: 4
title: Theme
description: Customize the appearance of Bambu Dashboard with light/dark/auto mode, 6 color palettes, and custom accent color
---

# Theme

Bambu Dashboard has a flexible theme system that lets you customize the appearance to your taste and use case.

Go to: **https://localhost:3443/#settings** → **Theme**

## Color mode

Choose between three modes:

| Mode | Description |
|---|---|
| **Light** | Light background, dark text — good in well-lit rooms |
| **Dark** | Dark background, light text — default and recommended for monitoring |
| **Auto** | Follows the operating system's setting (OS dark/light) |

Change mode at the top of the theme settings or via the shortcut in the navigation bar (moon/sun icon).

## Color palettes

Six preset color palettes are available:

| Palette | Primary color | Style |
|---|---|---|
| **Bambu** | Green (#00C853) | Default, inspired by Bambu Lab |
| **Blue Night** | Blue (#2196F3) | Calm and professional |
| **Sunset** | Orange (#FF6D00) | Warm and energetic |
| **Purple** | Purple (#9C27B0) | Creative and distinct |
| **Red** | Red (#F44336) | High contrast, eye-catching |
| **Monochrome** | Gray (#607D8B) | Neutral and minimalist |

Click on a palette to preview and activate it immediately.

## Custom accent color

Use your own color as the accent color:

1. Click **Custom color** below the palette selector
2. Use the color picker or type a hex code (e.g. `#FF5722`)
3. The preview updates in real time
4. Click **Apply** to activate

:::tip Contrast
Make sure the accent color has good contrast against the background. The system warns if the color may cause readability issues (WCAG AA standard).
:::

## Roundness

Adjust the roundness of buttons, cards, and elements:

| Setting | Description |
|---|---|
| **Sharp** | No rounding (rectangular style) |
| **Small** | Subtle rounding (4 px) |
| **Medium** | Standard rounding (8 px) |
| **Large** | Pronounced rounding (16 px) |
| **Pill** | Maximum rounding (50 px) |

Slide the slider to adjust manually between 0–50 px.

## Density

Customize the density of the interface:

| Setting | Description |
|---|---|
| **Spacious** | More space between elements |
| **Standard** | Balanced, default setting |
| **Compact** | Tighter packing — more info on screen |

Compact mode is recommended for screens below 1080p or kiosk viewing.

## Typography

Choose a font:

- **System** — uses the operating system's default font (fast to load)
- **Inter** — clear and modern (default choice)
- **JetBrains Mono** — monospace, good for data values
- **Nunito** — softer and more rounded style

## Animations

Turn off or customize animations:

- **Full** — all transitions and animations active (default)
- **Reduced** — only necessary animations (respects OS preference)
- **Off** — no animations for maximum performance

:::tip Kiosk mode
For kiosk viewing, enable **Compact** + **Dark** + **Reduced animations** for optimal performance and readability from a distance. See [Kiosk Mode](./kiosk).
:::

## Export and import theme settings

Share your theme with others:

1. Click **Export theme** — downloads a `.json` file
2. Share the file with other Bambu Dashboard users
3. They import it via **Import theme** → select the file
