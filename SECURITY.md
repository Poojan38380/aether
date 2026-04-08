# Security Policy

## Reporting a Vulnerability

**Do NOT file a public issue** for security vulnerabilities.

Instead, report a vulnerability via [GitHub Security Advisories](https://github.com/Poojan38380/aether/security/advisories/new).

If you cannot use GitHub Security Advisories, please [open a private issue](https://github.com/Poojan38380/aether/issues/new) with the title "SECURITY: [brief description]" and mark it as confidential.

## Response Timeline

| Stage | Timeline |
|-------|----------|
| Acknowledgment | Within 48 hours |
| Initial Assessment | Within 7 days |
| Fix or Mitigation | Within 30 days |

We will keep you informed of our progress throughout the process.

## Security Principles

Aether is designed with security in mind:

- **No API calls** — The application runs entirely in the browser with no network requests
- **No data collection** — No analytics, telemetry, or user data is collected or transmitted
- **No server component** — Everything runs client-side; there is no backend to compromise
- **Minimal dependencies** — Only `@chenglou/pretext` (text layout) and `vite`/`typescript` (build tooling)
- **No user input processing** — The only user input is mouse/touch coordinates; no text input, file uploads, or form data
- **No third-party scripts** — Only Google Fonts for typefaces, loaded via standard `<link>` tags
- **Content Security Policy friendly** — No `eval()`, no inline event handlers, no dynamic script injection

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅ Yes |

We recommend always using the latest version.
