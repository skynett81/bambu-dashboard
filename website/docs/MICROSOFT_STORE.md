# Publishing 3DPrintForge to Microsoft Store

## Why Microsoft Store?

Apps installed from Microsoft Store are **automatically trusted** by Windows Defender SmartScreen — no warnings, no "Unknown Publisher", no blocked installations. Users simply click "Get" in the Store and it installs.

---

## Prerequisites

1. **Microsoft Partner Center account** — $19 one-time registration fee
   - Sign up at https://partner.microsoft.com/en-us/dashboard/account/exp/enrollment/welcome
   - Choose "Individual" or "Company" account type
   - Verify identity (takes 1-3 business days)

2. **AppX/MSIX package** — built by the CI/CD pipeline on Windows

---

## Step-by-step guide

### 1. Build the MSIX package

The MSIX (.appx) is built automatically by GitHub Actions on tag push.
To build manually (requires Windows 10+):

```powershell
npm ci
npx electron-builder --win appx
# Output: dist-electron\3DPrintForge.appx
```

### 2. Create app listing in Partner Center

1. Log in to https://partner.microsoft.com/en-us/dashboard/apps-and-games/overview
2. Click **"New product"** → **"Desktop app (Win32/MSIX)"**
3. Reserve the name: **3DPrintForge**
4. Fill in the listing:

   | Field | Value |
   |-------|-------|
   | **Product name** | 3DPrintForge |
   | **Category** | Developer tools → Utilities or Design tools |
   | **Short description** | Self-hosted dashboard for managing all your 3D printers from one place |
   | **Description** | (use README.md highlights section) |
   | **Screenshots** | At least 1 screenshot at 1366×768 or similar |
   | **Icon** | 300×300 PNG (use electron/assets/icon.png) |
   | **Privacy policy** | https://github.com/skynett81/3dprintforge/blob/main/EULA.md |
   | **Website** | https://skynett81.github.io/3dprintforge/ |
   | **Support contact** | https://github.com/skynett81/3dprintforge/issues |

5. Under **"Packages"**, upload the `.appx` file
6. Set **"Availability"** → **"Available in all markets"**
7. Set **"Pricing"** → **"Free"**
8. Click **"Submit for certification"**

### 3. Certification review

Microsoft reviews the submission (1-7 business days). They check:
- No malware
- Appropriate content
- Correct metadata
- App launches and works

Common rejection reasons and fixes:
- **"App requires network access"** → Declare `internetClient` capability (already done via Electron)
- **"App modifies system settings"** → Our auto-start feature; may need to make it opt-in only
- **"App runs a web server"** → Explain in notes that it's a self-hosted dashboard (localhost only)

### 4. After approval

Once approved, the app appears in Microsoft Store. Users can find and install it by:
- Searching "3DPrintForge" in Store
- Direct link: `ms-windows-store://pdp/?ProductId=YOUR_PRODUCT_ID`

Auto-updates happen through the Store — no need for electron-updater for Store installations.

---

## Automated CI publishing (optional)

For automatic Store submissions on each release, use the `store-publish` GitHub Action:

```yaml
- name: Publish to Microsoft Store
  uses: niclasleonbock/windows-store-publish@v1
  with:
    app-id: YOUR_APP_ID
    tenant-id: YOUR_TENANT_ID
    client-id: YOUR_CLIENT_ID
    client-secret: ${{ secrets.MS_STORE_CLIENT_SECRET }}
    packages: dist-electron/*.appx
```

This requires Azure AD app registration — see https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/create-app-submission-via-api

---

## AppX configuration in 3DPrintForge

The `package.json` build config already includes:

```json
"appx": {
  "applicationId": "3DPrintForge",
  "identityName": "GeekTech.3DPrintForge",
  "publisher": "CN=GeekTech",
  "publisherDisplayName": "GeekTech",
  "displayName": "3DPrintForge",
  "languages": ["en-US", "nb-NO"],
  "showNameOnTiles": true,
  "backgroundColor": "#1a1d21"
}
```

**Note:** `publisher` must match your Microsoft Partner Center certificate CN exactly. Update it after enrollment.

---

## Cost summary

| Item | Cost | Frequency |
|------|------|-----------|
| Partner Center account | $19 | One-time |
| Store hosting | Free | — |
| Auto-updates | Free | — |
| Code signing | Free (included) | — |

**Total: $19 once** — no ongoing costs.
