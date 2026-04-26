---
title: Microsoft Store Submission Guide
sidebar_position: 99
---

# Microsoft Store — First Submission Guide

This walks through publishing 3DPrintForge (and any future app you build) to the Microsoft Store under a single individual developer account.

> **One-time cost: $19 USD.** Covers an unlimited number of apps, updates, and package formats for the lifetime of the account. No annual renewal.

---

## Step 1 — Register the individual developer account

You only do this once. After that, every future app you publish under this account uses the same registration.

1. Go to **https://partner.microsoft.com/dashboard/registration**
2. Sign in with the Microsoft account you want tied to publishing
   - Use a dedicated account if possible (e.g. `dev@yourdomain.com`) so it stays independent from personal Outlook/Xbox accounts
3. Choose **"Individual"** (not "Company") unless you have a registered business entity
4. Enter:
   - **Publisher display name** — this is what users see. Reserve `GeekTech` or `SkyNett81` here. **Choose carefully — renaming later is possible but disruptive.**
   - Legal name, address, phone (Microsoft calls for verification)
5. Pay the **$19 USD one-time fee** (credit card or PayPal)
6. Wait for the account to activate (typically minutes, sometimes up to 24h)

---

## Step 2 — Reserve the app name

Do this once per app. It's free and reserves the name for 3 months.

1. Partner Center → **Apps & Games** → **New product** → **MSIX or PWA app**
2. Enter the app name: `3DPrintForge`
3. Click **Reserve product name**
4. Microsoft assigns a unique **Package Identity Name** (e.g. `GeekTech.3DPrintForge`) and **Publisher** (e.g. `CN=XXXXXXXX-XXXX-...`)
5. Copy both values — you need them for `package.json`

### Update `package.json` with the reserved identity

Our current `build.appx` block has placeholder values. Replace with what Partner Center gave you:

```json
"appx": {
  "applicationId": "3DPrintForge",
  "identityName": "GeekTech.3DPrintForge",      // from Partner Center
  "publisher": "CN=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",  // exact value from PC
  "publisherDisplayName": "GeekTech",
  "displayName": "3DPrintForge",
  "languages": ["en-US", "nb-NO"],
  "showNameOnTiles": true,
  "backgroundColor": "#1a1d21"
}
```

Commit this change. **Do not** use different values on different dev machines — Store rejects submissions where `identityName` or `publisher` doesn't match the reserved registration.

---

## Step 3 — Build the MSIX package

```bash
npm install
npm run electron:build:win -- --win appx
```

Output lands in `dist-electron/3DPrintForge-<version>.appx` (or `.msix`).

### Self-check before upload

- **File size**: should be 100–300 MB for an Electron app. If it's &gt;500 MB, trim unused `extraResources` in `package.json`.
- **Architecture**: electron-builder produces x64 by default. For ARM64 add `"arch": ["x64", "arm64"]` to `build.appx`.
- **Content**: sideload-install locally with `Add-AppxPackage` to verify it launches before uploading:

```powershell
Add-AppxPackage -Path .\dist-electron\3DPrintForge-1.1.20.appx
```

---

## Step 4 — Submit via Partner Center

1. Partner Center → your reserved `3DPrintForge` product → **Packages**
2. Upload the `.appx`/`.msix`
3. Fill in required metadata (each of these is **per-app**, not per-account):

| Field | Value for 3DPrintForge |
|---|---|
| Category | `Utilities & tools` → `Developer tools` |
| Price | Free |
| Markets | All (or specific list) |
| Age rating | IARC questionnaire → likely 3+/E |
| Product properties | AGPL-3.0 license, website URL |
| Privacy policy | Required — link to a privacy page (can be simple for a local-only app) |

4. Store listing (screenshots + description):
   - At least **1 screenshot per device family** (PC minimum)
   - 1366×768 or larger PNG
   - Use screenshots from `website/static/img/` if available
   - Short description: 1–200 chars
   - Long description: up to 10 000 chars — paste from `README.md`
5. **Submission notes** (optional but recommended) — tell the reviewer:
   > This is an AGPL-3.0 self-hosted dashboard for 3D printers. It runs entirely on the user's local network and does not transmit data to third parties. Source at github.com/skynett81/3dprintforge.

6. Click **Submit for certification**

---

## Step 5 — Wait for certification

- First submission: **1–7 days**
- Subsequent updates: typically **1–24 hours**

You get an email when it's approved, published, or has failed certification. Common fail reasons:
- App crashes on first launch → fix locally and resubmit
- Missing privacy policy → add one
- Broken screenshot URLs → re-upload
- MSIX identity mismatch → check `publisher` exactly matches Partner Center value

---

## Step 6 — After approval

Your app appears at `https://apps.microsoft.com/store/detail/<product-id>`. Users can:

- Click "Get" in the Store app
- Visit your store URL directly
- Use `ms-windows-store://pdp/?productid=<id>` deep link

**Microsoft signs the MSIX package on the Store's infrastructure** — there's no SmartScreen warning, no "Unknown publisher", no UAC elevation surprise.

---

## Updating the app

For every future release:

1. Bump `version` in `package.json`
2. Build: `npm run electron:build:win -- --win appx`
3. Partner Center → the app → **Create new submission** → upload new `.msix`
4. Same certification pipeline, usually faster than first submission

The store auto-updates users within 24h of publication. Users don't need to reinstall.

---

## Publishing future apps

For any new app you build (whether 3D-printer-related or not):

1. Partner Center → **Apps & Games** → **New product** → reserve a fresh name
2. Build + submit — **no additional $19 fee**
3. Same account, same publisher display name, new package identity

The $19 was for the **account**, not the app. You can have as many products as you want.

---

## Common pitfalls

| Issue | Fix |
|---|---|
| "Publisher does not match" at upload | `package.json` → `build.appx.publisher` must be the exact `CN=...` string Partner Center gave you |
| "Package family name already in use" | Someone already has that identityName — pick a different one in Partner Center |
| App crashes on launch during review | Reviewer tests on clean Windows — check `electron/main.cjs` doesn't assume `config.json` exists |
| "This app requires internet access" flagged | Declare `internetClient` capability only if you actually need it. For LAN-only, declare `privateNetworkClientServer` instead. |
| Can't find reserved name later | Partner Center → Apps & Games → filter by "Reserved" — it's there |

---

## Parallel distribution

MSIX to the Store doesn't stop you from offering:

- **NSIS `.exe`** on GitHub Releases (for users who prefer sideloading — SmartScreen warning applies, bypass docs in [`WINDOWS_INSTALL.md`](./WINDOWS_INSTALL.md))
- **Portable `.exe`** on GitHub Releases (no install, runs from USB)
- **Linux packages** (AppImage/deb/rpm/Flatpak/Arch) — unaffected by Store submission
- **macOS `.zip`** — unaffected

Store is an additional channel, not a replacement.

---

## Checklist

- [ ] $19 individual developer account registered at partner.microsoft.com
- [ ] Publisher display name chosen (e.g. `GeekTech`)
- [ ] App name `3DPrintForge` reserved in Partner Center
- [ ] `package.json` → `build.appx.identityName` + `publisher` updated with real values
- [ ] MSIX built locally and sideload-tested with `Add-AppxPackage`
- [ ] Store listing metadata prepared (description, screenshots, privacy policy URL)
- [ ] Submission submitted for certification
- [ ] Published — share the `apps.microsoft.com/store/detail/<id>` URL
