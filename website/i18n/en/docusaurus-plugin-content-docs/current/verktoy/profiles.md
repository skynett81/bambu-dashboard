---
sidebar_position: 3
title: Print Profiles
description: Create, edit, and manage print profiles with preset settings for fast and consistent printing
---

# Print Profiles

Print profiles are saved sets of print settings you can reuse across prints and printers. Save time and ensure consistent quality by defining profiles for different purposes.

Go to: **https://localhost:3443/#profiles**

## Creating a profile

1. Go to **Tools → Print Profiles**
2. Click **New profile** (+ icon)
3. Fill in:
   - **Profile name** — descriptive name, e.g. "PLA - Fast Production"
   - **Material** — select from list (PLA / PETG / ABS / PA / PC / TPU / etc.)
   - **Printer model** — X1C / X1C Combo / X1E / P1S / P1S Combo / P1P / P2S / P2S Combo / A1 / A1 Combo / A1 mini / H2S / H2D / H2C / All
   - **Description** — optional text

4. Fill in settings (see sections below)
5. Click **Save profile**

## Settings in a profile

### Temperature
| Field | Example |
|---|---|
| Nozzle temperature | 220°C |
| Bed temperature | 60°C |
| Chamber temperature (X1C) | 35°C |

### Speed
| Field | Example |
|---|---|
| Speed setting | Standard |
| Max speed (mm/s) | 200 |
| Acceleration | 5000 mm/s² |

### Quality
| Field | Example |
|---|---|
| Layer height | 0.2 mm |
| Infill percentage | 15% |
| Infill pattern | Grid |
| Support material | Auto |

### AMS and colors
| Field | Description |
|---|---|
| Purge volume | Amount of flushing on color change |
| Preferred slots | Which AMS slots are preferred |

### Advanced
| Field | Description |
|---|---|
| Drying mode | Enable AMS drying for moisture-sensitive materials |
| Cooling time | Pause between layers for cooling |
| Fan speed | Cooling fan speed in percent |

## Editing a profile

1. Click on the profile in the list
2. Click **Edit** (pencil icon)
3. Make changes
4. Click **Save** (overwrite) or **Save as new** (creates a copy)

:::tip Versioning
Use "Save as new" to keep a working profile while experimenting with changes.
:::

## Using a profile

### From the file library

1. Select a file in the library
2. Click **Send to printer**
3. Select **Profile** from the dropdown
4. The settings from the profile are applied

### From the print queue

1. Create a new queue job
2. Select **Profile** under settings
3. The profile is linked to the queue job

## Importing and exporting profiles

### Export
1. Select one or more profiles
2. Click **Export**
3. Select format: **JSON** (for import in other dashboards) or **PDF** (for printing/documentation)

### Import
1. Click **Import profiles**
2. Select a `.json` file exported from another Bambu Dashboard
3. Existing profiles with the same name can be overwritten or both kept

## Sharing profiles

Share profiles with others via the community filament module (see [Community Filaments](../integrasjoner/community)) or via direct JSON export.

## Default profile

Set a default profile per material:

1. Select the profile
2. Click **Set as default for [material]**
3. The default profile is automatically selected when you send a file with that material
