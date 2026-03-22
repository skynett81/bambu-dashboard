---
sidebar_position: 8
title: Gallery
description: View milestone screenshots taken automatically at 25, 50, 75, and 100% progress for all prints
---

# Gallery

The Gallery collects automatic screenshots taken during each print. Images are captured at fixed milestones and give you a visual log of the print's development.

Go to: **https://localhost:3443/#gallery**

## Milestone screenshots

Bambu Dashboard automatically takes a screenshot from the camera at the following milestones:

| Milestone | Timing |
|---|---|
| **25%** | A quarter through the print |
| **50%** | Halfway |
| **75%** | Three quarters through |
| **100%** | Print completed |

Screenshots are saved and linked to the relevant print history entry, and displayed in the gallery.

:::info Requirements
Milestone screenshots require the camera to be connected and active. Disabled cameras generate no images.
:::

## Enabling screenshots

1. Go to **Settings → Gallery**
2. Enable **Automatic milestone screenshots**
3. Select which milestones to enable (all four are on by default)
4. Select **Image quality**: Low (640×360) / Medium (1280×720) / High (1920×1080)
5. Click **Save**

## Image view

The gallery is organized per print:

1. Use the **filter** at the top to select printer, date, or filename
2. Click on a print row to expand and see all four images
3. Click on an image to open a preview

### Preview

The preview shows:
- Full-size image
- Milestone and timestamp
- Print name and printer
- **←** / **→** to browse between images in the same print

## Fullscreen view

Click **Fullscreen** (or press `F`) in the preview to fill the entire screen. Use arrow keys to browse between images.

## Download images

- **Single image**: Click **Download** in the preview
- **All images for a print**: Click **Download all** on the print row — you get a `.zip` file
- **Select multiple**: Check the checkboxes and click **Download selected**

## Delete images

:::warning Storage space
Gallery images can take up significant space over time. Set up automatic deletion for old images.
:::

### Manual deletion

1. Select one or more images (check box)
2. Click **Delete selected**
3. Confirm in the dialog

### Automatic cleanup

1. Go to **Settings → Gallery → Automatic cleanup**
2. Enable **Delete images older than**
3. Set number of days (e.g. 90 days)
4. Cleanup runs automatically every night at 03:00

## Link to print history

Each image is linked to a print entry in history:

- Click **View in history** on a print in the gallery to jump to the history entry
- In history, a thumbnail of the 100% image is shown if available

## Sharing

Share a gallery image via a time-limited link:

1. Open the image in preview
2. Click **Share**
3. Choose expiration time and copy the link
