# 3DPrintForge — End User License Agreement (EULA)

**Version 1.0 — Effective Date: April 5, 2026**

This End User License Agreement ("EULA") is a legal agreement between you ("User") and GeekTech.no ("Licensor"), the developer of 3DPrintForge ("Software"). By installing, accessing, or using the Software, you agree to be bound by the terms of this EULA.

---

## 1. License Grant

### 1.1 Personal Use
The Software is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)** for personal, non-commercial use. You may install, use, modify, and distribute the Software in accordance with the AGPL-3.0 license terms.

### 1.2 Commercial Use
Commercial use of the Software — including but not limited to operating a print farm for profit, selling prints managed by the Software, or integrating the Software into a commercial product — requires a valid commercial license from GeekTech.no. Commercial licenses are available at [geektech.no](https://geektech.no).

### 1.3 License Verification
The Software periodically verifies its license status with GeekTech.no servers (`geektech.no/api`). This verification is required for commercial features including e-commerce integration, CRM, and multi-user access. The Software will continue to function for personal use without an active commercial license.

---

## 2. Permitted Use

You may:
- Install the Software on any number of devices you own or control
- Connect any number of 3D printers from any manufacturer
- Use all features for personal, educational, or non-commercial purposes
- Modify the source code in accordance with AGPL-3.0
- Distribute modifications under the same AGPL-3.0 license

---

## 3. Restrictions

You may not:
- Remove, alter, or obscure any license notices, copyright notices, or EULA references
- Use the Software to provide a commercial SaaS/hosted service without a commercial license
- Circumvent, disable, or interfere with the license verification system
- Modify the integrity checking mechanism (`ecom-license.js`, `api-routes.js`, `index.js`)
- Redistribute the Software under a different license
- Use the Software for any unlawful purpose

---

## 4. Data Collection & Privacy

### 4.1 Telemetry
The Software collects anonymous telemetry data on startup, including:
- Software version
- Operating system and Node.js version
- Number of connected printers (count only, no identifying information)
- Feature usage statistics (aggregated, non-identifiable)

Telemetry is sent to GeekTech.no servers and is used solely to improve the Software. No printer data, filenames, camera images, or personal information is transmitted.

### 4.2 License Verification
Commercial license verification communicates with `geektech.no/api` and transmits:
- License key
- Software version
- File integrity hashes (to detect unauthorized modifications)
- Machine identifier (anonymized hardware fingerprint)

### 4.3 Cloud Connections
When you connect to printer cloud services (Bambu Cloud, Snapmaker Cloud), the Software communicates directly with those services using your credentials. GeekTech.no does not receive or store your cloud credentials.

### 4.4 Local Data
All printer data, print history, filament inventory, camera images, and configuration files are stored locally on your machine. The Software does not upload this data to any external server.

### 4.5 Cloudflare Tunnel
If you enable Cloudflare Tunnel for remote access, your dashboard traffic is routed through Cloudflare's network. GeekTech.no does not control or monitor this traffic.

---

## 5. Third-Party Software

The Software includes or connects to the following third-party components:

| Component | License | Purpose |
|-----------|---------|---------|
| Node.js | MIT | Runtime |
| AdminLTE 4 | MIT | UI Framework |
| mqtt.js | MIT | Bambu Lab MQTT communication |
| ws | MIT | WebSocket communication |
| basic-ftp | MIT | Bambu Lab file transfer |
| ssh2 | MIT | Moonraker/Snapmaker SSH camera |
| @3mfconsortium/lib3mf | BSD-2-Clause | 3MF file generation (Model Forge) |
| Three.js | MIT | 3D model viewing |

---

## 6. Disclaimer of Warranties

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT.

THE LICENSOR DOES NOT WARRANT THAT:
- The Software will meet your requirements
- The Software will be uninterrupted, timely, secure, or error-free
- The results obtained from the Software will be accurate or reliable
- Any errors in the Software will be corrected

---

## 7. Limitation of Liability

IN NO EVENT SHALL GEEKTECH AS, ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
- Loss of profits, data, or business opportunity
- Damage to 3D printers, materials, or property
- Costs of procurement of substitute goods or services
- Personal injury resulting from printer malfunction

THE TOTAL LIABILITY OF GEEKTECH AS SHALL NOT EXCEED THE AMOUNT PAID BY YOU FOR THE SOFTWARE IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.

---

## 8. Printer Safety

3D printers involve high temperatures, moving parts, and electrical systems. The User acknowledges that:
- The Software provides monitoring and control features, but is not a safety system
- The User is solely responsible for printer operation and safety
- The Software's failure detection features (camera AI, sensor monitoring) are best-effort and may not detect all failures
- The User should never leave a printer unattended based solely on the Software's monitoring

---

## 9. Termination

This EULA is effective until terminated. Your rights under this EULA will terminate automatically without notice if you fail to comply with any of its terms. Upon termination, you must cease all use of the Software and destroy all copies.

---

## 10. Updates

GeekTech.no may release updates, patches, or new versions of the Software. Updates may modify features, add or remove functionality, and change system requirements. By using the auto-update feature, you consent to receiving these updates.

---

## 11. Governing Law

This EULA shall be governed by and construed in accordance with the laws of Norway, without regard to its conflict of law provisions. Any disputes arising under this EULA shall be subject to the exclusive jurisdiction of the courts of Norway.

---

## 12. Contact

GeekTech.no
Website: [geektech.no](https://geektech.no)
Email: support@geektech.no
GitHub: [github.com/skynett81/3dprintforge](https://github.com/skynett81/3dprintforge)

---

## 13. Acceptance

By installing, accessing, or using 3DPrintForge, you acknowledge that you have read, understood, and agree to be bound by the terms of this EULA.

**If you do not agree to these terms, do not install or use the Software.**

---

*© 2024-2026 GeekTech.no. All rights reserved.*
*3DPrintForge is a trademark of GeekTech.no.*
