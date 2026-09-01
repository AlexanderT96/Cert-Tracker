# Cert Tracker

Cert Tracker is a local-first career operating system for certifications: progress, exam dates, renewal windows, study priorities, portfolio evidence, £ career-value modelling and long-term career sequencing.

Version **3.1** keeps the existing visual identity and static-hosting model while tightening reliability, privacy, provenance and career-value logic.

## Core product

- Tracks passed certifications, pass dates and renewal windows
- Stores exam bookings and exports correct all-day iCalendar events
- Maintains a custom **My Path** certification plan
- Uses one authoritative phase/gate engine
- Produces explainable, goal-aware next-certification recommendations
- Supports target-role what-if scenarios
- Tracks portfolio/experience evidence and phase artifacts
- Audits certification-data freshness, official-source provenance and confidence
- Models UK role salary bands separately from indicative per-certification £ career value
- Supports JSON backup/restore, recovery points and one-step undo
- Provides optional client-side encrypted multi-device sync
- Works offline as an installable PWA
- Keeps personal progress in the browser by default; there is no Cert Tracker backend

## Architecture

The project deliberately remains framework-free and build-free. `app.js` is retained as the legacy UI renderer while current product/domain logic lives in small modules under `src/`. New logic should go into `src/`, not back into `app.js`.

| File | Responsibility |
| --- | --- |
| `certs.js` | Canonical certification/career catalogue |
| `app.js` | Legacy renderer and existing screens |
| `src/path-defaults.js` | Curated default certification path |
| `src/config.js` | Versions, shared configuration, vendor sources, event bus |
| `src/dates.js` | Local-date and expiry calculations |
| `src/storage.js` | Storage migration, persistence, atomic backup restore, recovery and undo |
| `src/validation.js` | Certification schema, dependency and cycle validation |
| `src/phase-engine.js` | Authoritative path/phase/artifact completion rules |
| `src/source-registry.js` | Audited official-source registry for the core pathway |
| `src/data-health.js` | Provenance, verification age, confidence and review queue |
| `src/market-value.js` | UK role-market bands and indicative certification career-value ranges |
| `src/recommendation-engine.js` | Goal-aware scoring, prerequisites, market value and explanations |
| `src/exports.js` | Hardened export logic |
| `src/notifications.js` | Expiry notification checks |
| `src/sync.js` | AES-GCM encrypted vault and optional WebDAV sync |
| `src/ux.js` | Today view, command palette, onboarding, health and sync UI |
| `src/market-value-ui.js` | Dedicated £ ROI / market-value view |
| `src/bootstrap.js` | Renderer bridge and application startup |
| `tools/quality-check.mjs` | Automated regression/data-contract/provenance gate |
| `tools/privacy-check.mjs` | Privacy and architecture regression gate |

The old `stability.js` compatibility layer and one-time migration helpers are retired and are not shipped.

## Versioning

Version concepts are intentionally separate:

- **App:** `3.1.0`
- **Certification data generation:** `59`
- **Storage schema:** `4`
- **Backup format:** `3`
- **Encrypted sync format:** `1`
- **Market-value model:** `1`

The service-worker cache is versioned with the application release so installed PWAs do not remain pinned to stale JavaScript or CSS.

## £ market value and ROI

The tracker deliberately separates **role-market salary** from **certification career-value contribution**.

Role bands are UK market benchmarks. Per-certification values are indicative signalling ranges derived from the catalogue's historical `cvValue`, career ROI, seniority, study time and data-confidence inputs. They are not treated as guaranteed salary uplifts and are never simply added to a salary.

The £ ROI view includes:

- low / median / high UK role-market bands
- per-certification indicative £ contribution ranges
- confidence level
- £ signal per focused study hour
- self-funded cost efficiency
- portfolio-evidence context

The recommendation engine consumes the same market-value model, so £ value affects prioritisation rather than existing as a decorative statistic.

## Recommendation engine

The recommendation engine answers: **what is the highest-value next move for the role being targeted right now?**

Scoring combines:

- current phase alignment
- My Path inclusion
- dependencies/prerequisites
- certification track and gateway status
- career ROI
- £ market/career-value signal
- target-role skill relevance
- employer funding
- study-time efficiency
- booked exams
- certification-data confidence/freshness

Built-in profiles include Convergence / OT Security Architect, Cyber Security Engineer, Network / Security Engineer, Physical Security Architect and Cloud Security Architect.

Open **Today**, use **£ ROI**, or press **Ctrl/⌘ + K** to inspect recommendations and supporting rationale.

## Certification data health

Certification metadata is treated as dated information, not timeless truth. Records can carry `verifiedAt`, source information, pricing dates and vendor metadata.

For the critical pathway, `src/source-registry.js` stores audited official sources separately from the catalogue. Gateway certifications are required by the test suite to have audited cert-specific HTTPS provenance. Core-path source coverage is also regression-tested; unresolved provenance debt is explicit rather than hidden behind invented URLs.

The Data Health screen reports fresh/review/stale/unknown records, cert-specific vs vendor-level source coverage, per-record confidence and a manual review queue.

## Privacy model

Shipped catalogue/application copy is written as reusable product guidance rather than a personal career diary. Employer names, personal location assumptions, hard-coded personal salary data and other direct career-history fingerprints are not part of the current release.

The salary baseline defaults to zero. Any salary entered into the tracker is browser-local. Personal progress, notes, passes, exams and portfolio state remain local by default unless the user explicitly enables encrypted sync.

`npm test` includes a privacy gate that checks public content for common direct identifiers and known personal-context regressions. It also keeps a size ceiling on `app.js` so new product/domain logic cannot silently drift back into the legacy renderer.

## Private storage, backup and undo

Storage schema v4 uses `ct3-mypath`, while migration code can adopt values from older local-storage keys so existing browser installs do not lose progress during upgrade.

Backup restore is validated before live state changes and rolls back if persistence fails. Recovery points and one-step undo protect normal state mutations.

## Optional encrypted multi-device sync

Sync is opt-in. There is no Cert Tracker account or hosted backend.

Available modes:

1. **Encrypted file** — export/import a `.ctvault` file manually.
2. **WebDAV vault** — sync the encrypted vault through a WebDAV-compatible service such as Nextcloud or ownCloud.

Security model includes AES-GCM 256-bit encryption, PBKDF2-SHA256 key derivation, random salt/IV generation, browser-side encryption and conflict detection. Vault and WebDAV passphrases are not stored in localStorage.

## Automated quality gate

Every pull request and push to `main` runs `.github/workflows/quality.yml` using Node 22 and `npm test`.

The gate checks JavaScript syntax, required modules, module load order, certification schema, IDs, tracks, dependencies, cycles, study-hour/ROI shapes, official-source coverage, service-worker coverage, privacy regressions and the legacy-renderer architecture ceiling.

The browser self-test page at `tests.html` additionally checks storage migration, backup validation, date handling, iCalendar semantics, phase logic, audited source coverage, recommendation ordering, market-value ranges, data-health bounds and AES-GCM vault round-tripping.

No npm dependencies or build step are required.

## Development rules

1. Keep certification facts in `certs.js` and date them with `verifiedAt`.
2. Put audited critical-path provenance in `src/source-registry.js`.
3. Put new domain logic in the relevant `src/` module.
4. Do not add new business logic to `app.js`.
5. Do not commit personal employer/location/salary assumptions into public product content.
6. Run `npm test` before merging.
7. Open `tests.html` after changes that touch browser state, exports, encryption or rendering integration.
8. Increment the service-worker/app version when changing shipped application behaviour.

## Deployment

Cert Tracker is static and suitable for GitHub Pages or any HTTPS static host. Relative asset paths preserve subdirectory deployment. HTTPS is required for service workers, notifications and encrypted sync/Web Crypto outside localhost.
