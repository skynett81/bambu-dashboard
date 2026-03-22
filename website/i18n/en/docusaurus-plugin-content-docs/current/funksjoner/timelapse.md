---
sidebar_position: 7
title: Timelapse
description: Enable automatic timelapse recording of 3D prints, manage videos, and play them back directly in the dashboard
---

# Timelapse

Bambu Dashboard can automatically take photos during printing and compile them into a timelapse video. Videos are stored locally and can be played back directly in the dashboard.

Go to: **https://localhost:3443/#timelapse**

## Enabling

1. Go to **Settings → Timelapse**
2. Enable **Timelapse recording**
3. Select **Recording mode**:
   - **Per layer** — one image per layer (recommended for high quality)
   - **Time-based** — one image every N seconds (e.g. every 30 seconds)
4. Select which printers should have timelapse enabled
5. Click **Save**

:::tip Image interval
"Per layer" gives the smoothest animation because the motion is consistent. "Time-based" uses less storage space.
:::

## Recording settings

| Setting | Default | Description |
|---|---|---|
| Resolution | 1280×720 | Image size (640×480 / 1280×720 / 1920×1080) |
| Image quality | 85% | JPEG compression quality |
| FPS in video | 30 | Frames per second in final video |
| Video format | MP4 (H.264) | Output format |
| Rotate image | Off | Rotate 90°/180°/270° for mounting orientation |

:::warning Storage space
A timelapse with 500 images at 1080p uses approx. 200–400 MB before merging. The finished MP4 video is typically 20–80 MB.
:::

## Storage

Images and finished videos are stored in the folder configured under **Settings → Timelapse → Storage folder**:

```
/media/skynett81/Stuff/bambu-dashboard/timelapse/
├── PRINTER_ID/
│   ├── 2026-03-22_benchy/
│   │   ├── frame_001.jpg
│   │   ├── frame_002.jpg
│   │   └── ...
│   └── 2026-03-22_benchy.mp4
```

You can change the storage folder to an external drive to save space on the system disk.

## Automatic compilation

When the print is done, images are automatically compiled into a video with ffmpeg:

1. Bambu Dashboard receives the "print complete" event from MQTT
2. ffmpeg is called with the collected images
3. The video is saved in the storage folder
4. The Timelapse page is updated with the new video

You can monitor the progress under the **Timelapse → Processing** tab.

## Playback

1. Go to **https://localhost:3443/#timelapse**
2. Select a printer from the dropdown
3. Click a video in the list to play it
4. Use the playback controls:
   - ▶ / ⏸ — Play / Pause
   - ⏪ / ⏩ — Rewind / Fast forward
   - Speed buttons: 0.5× / 1× / 2× / 4×
5. Click **Fullscreen** to open in full screen
6. Click **Download** to download the MP4 file

## Deleting timelapse

1. Select the video in the list
2. Click **Delete** (trash icon)
3. Confirm in the dialog

:::danger Permanent deletion
Deleted timelapse videos and raw images cannot be recovered. Download the video first if you want to keep it.
:::

## Sharing timelapse

Timelapse videos can be shared via a time-limited link:

1. Select the video and click **Share**
2. Set expiration time (1 hour / 24 hours / 7 days / no expiry)
3. Copy the generated link and share it
4. The recipient does not need to log in to view the video
