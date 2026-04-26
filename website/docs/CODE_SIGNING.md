# Code Signing Setup for 3DPrintForge

## Why we need code signing

Without a valid code signing certificate:

1. **Windows Defender SmartScreen** blocks the installer on first launch
2. **Microsoft Defender Antivirus** may flag it as suspicious
3. **UAC prompt** shows "Unknown Publisher" in red

With a valid certificate, all three issues disappear.

---

## Current status

**SignPath.io application rejected.** Common reasons (non-exhaustive):
- Project too new or low stars / forks (SignPath usually wants established OSS)
- License compatibility concerns (they generally accept AGPL-3.0, but edge cases happen)
- Identity-verification step failed
- Backlog / capacity limits on the free tier

→ **Reapply later** once the project has more traction, or follow one of the alternatives below.

---

## Option A: Microsoft Store (MSIX) — ⭐ Recommended for this project

**Cost:** $19 one-time individual developer fee. No per-release cost, no cert renewal.
**Approval time:** 1–7 days for first submission, hours for updates.
**Trust:** Installer is signed by **Microsoft** after review — SmartScreen does not warn.

`package.json` already configures the MSIX build target (`build.appx`). Everything is in place:

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

### Steps

1. Register at https://partner.microsoft.com/en-us/dashboard/home as an **individual developer** ($19 one-time)
2. Reserve the app name **3DPrintForge** under Apps & Games → Create new
3. On your dev machine: `npm run electron:build:win -- --win appx`
4. Upload the resulting `.msix` to Partner Center
5. Fill out store listing (screenshots, description, categories)
6. Submit for certification
7. After approval, users install via `ms-windows-store://` URL or Store app — **automatically trusted**

### Trade-offs

- **Pro**: free ongoing, Microsoft-signed, zero SmartScreen friction
- **Pro**: bundles well with Windows 11 recommendation engine
- **Con**: must pass Store content policies (most hobby apps pass)
- **Con**: users who prefer sideloading `.exe` still need NSIS — see Option C

---

## Option B: Azure Trusted Signing

**Cost:** $9.99/month per identity ($120/year) — Microsoft's answer to SignPath.
**Approval time:** 1–3 days for identity verification.
**Trust:** Short-lived (72h) certs issued by a Microsoft-run CA. SmartScreen reputation builds over a few hundred downloads.

### Setup

1. Open an Azure subscription (free trial works for starting)
2. Azure Portal → **Trusted Signing Accounts** → Create
3. Choose region (e.g. East US, West Europe) and SKU (Basic $9.99/mo)
4. Create an **Identity Validation** request — submit proof of business / individual
5. Create a **Certificate Profile** ("Release Signing")
6. Add the `Azure.CodeSigning` task to `.github/workflows/release-build.yml`:

```yaml
- name: Azure login
  uses: azure/login@v2
  with:
    creds: ${{ secrets.AZURE_CREDENTIALS }}

- name: Sign Windows installer
  uses: azure/trusted-signing-action@v0.4
  with:
    azure-tenant-id: ${{ secrets.AZURE_TENANT_ID }}
    azure-client-id: ${{ secrets.AZURE_CLIENT_ID }}
    azure-client-secret: ${{ secrets.AZURE_CLIENT_SECRET }}
    endpoint: https://eus.codesigning.azure.net/
    trusted-signing-account-name: geektech-signing
    certificate-profile-name: release-signing
    files-folder: dist-electron
    files-folder-filter: exe,msi
```

### Trade-offs

- **Pro**: CI-friendly, no HSM / USB token required
- **Pro**: cheaper than commercial CAs ($120/year vs $300–500)
- **Con**: SmartScreen reputation still builds gradually (not instant like EV)
- **Con**: identity-validation can be strict for individuals (business accounts pass faster)

---

## Option C: Commercial Certificate

If you want a classic `.pfx` file for local signing or CI:

| Provider | Type | Cost | Notes |
|----------|------|------|-------|
| [Certum Open Source](https://shop.certum.eu/data-safety/code-signing-certificates/open-source-code-signing-certyficate.html) | OV (cloud) | ~€30/year | Cheapest. Cloud-signing now available — no USB token. |
| [SSL.com eSigner](https://www.ssl.com/certificates/ev-code-signing/) | EV (cloud) | ~$299/year | Instant-trust EV, cloud-signed via eSigner API. CI-friendly. |
| [DigiCert](https://www.digicert.com/signing/code-signing-certificates) | EV | ~$500/year | Most trusted, HSM required. |
| [Sectigo](https://sectigostore.com/code-signing-ssl) | OV or EV | $100–450/year | HSM required for new OV certs since 2023. |

After buying a certificate:

1. Store it as a `.pfx` (or configure cloud-signing API)
2. Add GitHub secrets:
   - `WIN_CSC_LINK` — base64-encoded PFX file (or HTTPS URL if cloud)
   - `WIN_CSC_KEY_PASSWORD` — PFX password
3. electron-builder automatically picks them up on `npm run electron:build:win`

---

## Option D: Reapply to SignPath later

After the rejection, you can reapply after:
- The project has more visibility (stars, forks, downloads on GitHub Releases)
- You've published more releases (shows active maintenance)
- You've addressed whatever they cited in the rejection email

If the rejection email mentioned specific blockers (e.g. "need more public release history"), fix those first. SignPath generally wants to see the project is **actively developed and used**, not a side experiment.

---

## Interim solution until any of the above lands

We already provide:

1. **SHA-256 checksums** for all release artifacts (`SHA256SUMS.txt` on each GitHub release)
2. **Clear bypass instructions** in [`WINDOWS_INSTALL.md`](./WINDOWS_INSTALL.md) — users click "More info" → "Run anyway"
3. **Embedded publisher metadata** in the `.exe` (right-click → Properties shows "GeekTech — SkyNett81")
4. **Professional version-info resources** so the installer doesn't look sketchy

Verify file integrity manually:

```powershell
Get-FileHash .\3DPrintForge-Setup-1.1.20.exe -Algorithm SHA256
```

---

## Recommendation for 3DPrintForge today

Given the SignPath rejection + the fact that MSIX config is **already wired up** in `package.json`:

1. **Ship to Microsoft Store first** — lowest cost, highest trust, no ongoing fees. MSIX build is one command away.
2. **Keep NSIS + checksums + bypass-docs** for users who sideload from GitHub Releases.
3. **Reapply to SignPath in 3–6 months** once there's a track record. If rejected again, move to Azure Trusted Signing for the NSIS/EXE artifacts.

---

## Status

- [x] Uploaded `SHA256SUMS.txt` to GitHub releases
- [x] Embedded publisher name "GeekTech — SkyNett81" in .exe metadata
- [x] Added file associations for .3mf, .stl, .gcode
- [x] MSIX build target configured in `package.json`
- [x] Documented SmartScreen workaround in `docs/WINDOWS_INSTALL.md`
- [~] SignPath.io — **rejected** (apply: 2026-04). Reassess in 3–6 months.
- [ ] Microsoft Store — register individual developer account ($19), upload MSIX
- [ ] Azure Trusted Signing — optional fallback for NSIS / sideloaded `.exe`
