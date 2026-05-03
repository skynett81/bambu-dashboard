# Security Policy

3DPrintForge is a self-hosted dashboard for 3D printers. We take security seriously and welcome reports of vulnerabilities.

## Supported Versions

Only the latest minor release receives security fixes. Patch releases are issued for both the current and the immediately previous minor where practical.

| Version | Supported |
|---------|-----------|
| 1.1.x   | ✅ Active |
| < 1.1   | ❌ Unsupported |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security problems.**

Send the details to: **skynett81@gmail.com** with the subject line `SECURITY: <short title>`.

If the issue is sensitive, you may use GitHub's [private vulnerability reporting](https://github.com/skynett81/3dprintforge/security/advisories/new) flow instead.

Include in your report:

1. A concise description of the issue
2. The version (`/api/system/info` shows it) and deployment type (Docker, systemd, Pterodactyl, etc.)
3. Reproduction steps — a curl command or short script is ideal
4. Impact — what an attacker can read, modify, or do
5. Any suggested fix or mitigation

You will get an acknowledgement within **72 hours**. We aim to ship a fix within **14 days** for HIGH/CRITICAL findings and **30 days** for MEDIUM/LOW.

## Disclosure Process

1. We confirm the report and assign a severity (CRITICAL / HIGH / MEDIUM / LOW) following CVSS 3.1.
2. We develop and test a fix on a private branch.
3. We coordinate a release date with you. By default we credit reporters in the changelog and release notes — let us know if you want to remain anonymous.
4. We publish the fix as a patch release.
5. After roughly 7 days, we publish a GitHub Security Advisory describing the issue and the fix.

## Scope

In scope:

- The Node.js server (`server/`)
- The vanilla JS frontend (`public/`)
- Build/release tooling (`tools/`, `.github/workflows/`)
- Pterodactyl egg (`egg-3dprintforge.json`)
- Docusaurus site (`website/`) configuration

Out of scope:

- Vulnerabilities in upstream dependencies that are already filed against the upstream project. File those upstream and let us know if you'd like us to bump our pin.
- Social engineering, physical attacks, or vulnerabilities requiring local OS-level compromise.
- Self-XSS or vulnerabilities exploitable only by an admin against themselves.
- Denial-of-service via resource exhaustion (the dashboard is intended for trusted-LAN deployment).

## Hardening Recommendations for Operators

This repo ships secure defaults but you should also:

- Set `REQUIRE_AUTH=true` and a strong `BAMBU_AUTH_PASSWORD` — never run with auth disabled on a network reachable from untrusted hosts.
- Enable TOTP for every admin account (`Settings → Security → 2FA`).
- Front the dashboard with HTTPS using a real certificate (Let's Encrypt). The default self-signed cert is fine for LAN-only use but breaks HSTS preload eligibility.
- Set `TRUSTED_PROXIES` only if you actually run behind a reverse proxy. An unset value already declines to trust `X-Forwarded-For`.
- Keep the auto-update enabled (`AUTO_UPDATE=true`) so patch releases reach you within the maintenance window.
- Review `data/dashboard.db` permissions — it contains hashed credentials and printer access codes. The default `0600` is correct.

## Acknowledgements

We will list reporters here once advisories are published.
