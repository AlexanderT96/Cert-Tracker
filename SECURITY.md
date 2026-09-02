# Cert Tracker Security Model

The hosted tracker is a static GitHub Pages application. Security is built around minimising trusted code, keeping secrets out of persistent browser storage, encrypting sync state before upload, and preventing unsafe browser navigation.

## Current controls

- Content Security Policy is declared in `index.html` and blocks remote scripts, plugins/objects, frames, mixed content and unauthorised form destinations.
- No third-party runtime JavaScript or remote stylesheet dependency is permitted.
- External links opened in a new tab use `noopener noreferrer`; runtime hardening also repairs dynamically-created anchors.
- External navigation uses a no-referrer policy.
- `javascript:` / `data:` style navigation is blocked by the runtime URL guard for normal application links.
- GitHub sync tokens and vault passphrases are held in JavaScript memory for the current browser session only and are not written to `localStorage`.
- GitHub sync is designed for a dedicated private repository and a fine-grained token restricted to that repository with Contents read/write only.
- Sync payloads are encrypted locally with AES-256-GCM. The key is derived with PBKDF2-SHA256 using a random salt and 250,000 iterations.
- Generic WebDAV sync requires HTTPS except explicit localhost development URLs.
- Imported encrypted vaults are validated before state is applied.
- The service worker only handles same-origin application requests and does not proxy cross-origin traffic.
- Static CI rejects `eval`, `new Function`, `document.write`, remote runtime scripts/styles, missing CSP controls and accidental persistence of GitHub sync secrets.

## Hosting limitation

GitHub Pages does not provide repository-controlled HTTP response headers. The application therefore uses a CSP meta policy and runtime safeguards. Headers such as HSTS, `X-Content-Type-Options`, COOP/COEP and a response-header `frame-ancestors` policy cannot be fully controlled from this repository while hosted directly on GitHub Pages.

For a future high-assurance deployment, place the static application behind a host/CDN that allows explicit security response headers, then remove remaining inline event handlers so CSP can drop `unsafe-inline` entirely.

## Browser storage

Tracker state is stored locally in the browser unless the user enables an encrypted sync provider. Treat a device/browser profile with access to the tracker as trusted. Use device-level encryption, screen lock and an up-to-date browser/OS.

## Supported security baseline

Use a currently supported release of Chrome, Edge, Firefox, Safari or iOS/iPadOS Safari. Internet Explorer and obsolete embedded browsers are intentionally unsupported because they cannot provide the required Web Crypto and modern browser-security baseline.
