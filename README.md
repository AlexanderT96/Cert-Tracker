# Cert Tracker

Cert Tracker is a private, local-first career operating system for certifications: progress, exam dates, renewal windows, study priorities, portfolio evidence and long-term career sequencing.

Version **3.0** keeps the existing visual identity and static-hosting model, but moves reliability and career logic into small, testable modules instead of a single compatibility layer.

## Core product

- Tracks passed certifications, pass dates and renewal windows
- Stores exam bookings and exports correct all-day iCalendar events
- Maintains a custom **My Path** certification plan
- Uses one authoritative phase/gate engine
- Produces explainable, goal-aware next-certification recommendations
- Supports target-role what-if scenarios
- Tracks portfolio/experience evidence and phase artifacts
- Audits certification-data freshness and source confidence
- Supports JSON backup/restore, recovery points and one-step undo
- Provides optional client-side encrypted multi-device sync
- Works offline as an installable PWA
- Keeps personal progress in the browser by default; there is no Cert Tracker backend

## Architecture

The project deliberately remains framework-free and build-free. `app.js` is retained as the legacy UI renderer while v3 moves domain logic into dedicated modules using a strangler-pattern migration. New logic should go into `src/`, not back into `app.js`.

| File | Responsibility |
| --- | --- |
| `certs.js` | Canonical certification/career catalogue |
| `app.js` | Legacy renderer and existing screens |
| `src/config.js` | Versions, shared configuration, vendor sources, event bus |
| `src/dates.js` | Local-date and expiry calculations |
| `src/storage.js` | Storage migration, persistence, atomic backup restore, recovery and undo |
| `src/validation.js` | Certification schema, dependency and cycle validation |
| `src/phase-engine.js` | Authoritative path/phase/artifact completion rules |
| `src/data-health.js` | Provenance, verification age, confidence and review queue |
| `src/recommendation-engine.js` | Goal-aware scoring, prerequisites and explanations |
| `src/exports.js` | Hardened export logic |
| `src/notifications.js` | Expiry notification checks |
| `src/sync.js` | AES-GCM encrypted vault and optional WebDAV sync |
| `src/ux.js` | Today view, command palette, onboarding, health and sync UI |
| `src/bootstrap.js` | Renderer bridge and application startup |
| `tools/quality-check.mjs` | Automated regression/data-contract gate |

The previous `stability.js` compatibility layer has been retired.

## Versioning

Version concepts are intentionally separate:

- **App:** `3.0.0`
- **Certification data generation:** `58`
- **Storage schema:** `4`
- **Backup format:** `3`
- **Encrypted sync format:** `1`

The service-worker cache is versioned with the application release so installed PWAs do not remain pinned to stale JavaScript or CSS.

## Recommendation engine

The recommendation engine is designed to answer a more useful question than “what is next?”: **what is the highest-value next move for the role I am targeting right now?**

Scoring combines:

- current phase alignment
- My Path inclusion
- dependencies/prerequisites
- certification track and gateway status
- career ROI
- target-role skill relevance
- employer funding
- study-time efficiency
- booked exams
- certification-data confidence/freshness

The current target role can be switched without mutating the certification plan. Built-in profiles include Convergence / OT Security Architect, Cyber Security Engineer, Network / Security Engineer, Physical Security Architect and Cloud Security Architect.

Open **Today** or press **Ctrl/⌘ + K** to use the recommendation engine.

## Certification data health

Certification metadata is treated as dated information, not timeless truth. Records can carry:

- `code`
- `verifiedAt`
- `sourceUrl` / `officialUrl`
- `priceCheckedAt`
- vendor information

When a record has no cert-specific URL, v3 maps a known vendor to the vendor's official certification/training catalogue and labels the result as vendor-level rather than pretending it is a cert-specific source.

The Data Health screen reports:

- fresh / review / stale / unknown records
- cert-specific vs vendor-level vs missing source coverage
- per-record confidence
- an ordered manual review queue
- CSV audit export

A scheduled GitHub Actions job runs the freshness audit each Monday.

## Private storage, backup and undo

Progress remains local by default. Storage schema v4 migrates My Path to `ct3-mypath`, while adopting values from older `ct2-mypath` and historical `undefined` keys.

Backup restore is validated before live state changes and rolls back if persistence fails. v3 also records local recovery points and captures the previous persisted state before normal save operations, allowing **Undo last change** from the command palette.

Export a normal JSON backup periodically even when sync is configured.

## Optional encrypted multi-device sync

Sync is opt-in. There is no Cert Tracker account or hosted backend.

Two encrypted-vault modes are available:

1. **Encrypted file** — export/import a `.ctvault` file manually.
2. **WebDAV vault** — sync the encrypted vault through a WebDAV-compatible service such as Nextcloud or ownCloud.

Security model:

- AES-GCM 256-bit encryption
- PBKDF2-SHA256 key derivation with 250,000 iterations
- random salt and IV for every encrypted vault
- encryption/decryption happens in the browser
- vault passphrase is never stored in localStorage
- WebDAV password is never stored in localStorage
- secrets exist only for the connected browser session
- HTTPS is required except localhost testing
- smart sync detects two-sided divergence and refuses to silently overwrite a conflict

The WebDAV server receives encrypted ciphertext, not the certification-progress JSON.

## UX

The existing tracker screens remain available. v3 adds a lightweight product layer rather than redesigning them:

- **Today** view for the next recommendation, current blockers, upcoming exams, renewals, backup state and data confidence
- **Ctrl/⌘ + K** command palette
- global certification search / quick view
- target-role switching
- data-health indicator
- encrypted sync controls
- diagnostics
- backup reminders
- first-run onboarding for new installs

## Automated quality gate

Every pull request and push to `main` runs `.github/workflows/quality.yml` using Node 22. It checks:

- JavaScript syntax
- required module presence
- module load order
- removal of the old stability layer
- certification IDs and allowed tracks
- phase bounds
- dependency existence
- self-dependencies and dependency cycles
- study-hour shape
- verification-date formatting
- service-worker module/cache coverage

The browser self-test page at `tests.html` additionally checks storage migration, backup validation, date handling, iCalendar semantics, phase logic, recommendation ordering, data-health bounds and AES-GCM vault round-tripping.

No npm dependencies or build step are required.

## Development rules

1. Keep certification facts in `certs.js` and date them with `verifiedAt`.
2. Prefer a cert-specific HTTPS `sourceUrl`; vendor-level mappings are a fallback only.
3. Put new domain logic in the relevant `src/` module.
4. Do not add new business logic to `app.js`; it is the legacy renderer being progressively reduced.
5. Run `npm test` before merging.
6. Open `tests.html` after changes that touch browser state, exports, encryption or rendering integration.
7. Increment the service-worker cache/app version when changing shipped application behaviour.

## Deployment

Cert Tracker is static and suitable for GitHub Pages or any HTTPS static host. Relative asset paths preserve subdirectory deployment. HTTPS is required for service workers, notifications and encrypted sync/Web Crypto outside localhost.
