# Cert Tracker

Cert Tracker is a local-first certification and career planning application for tracking progress, exam dates, renewal windows, study priorities, portfolio evidence, market-value estimates and long-term certification sequencing.

## Features

- Certification progress and pass-date tracking
- Exam booking and renewal reminders
- Custom **My Path** planning
- Phase and prerequisite tracking
- Goal-aware certification recommendations
- Target-role what-if scenarios
- Portfolio and experience evidence tracking
- Certification-data freshness and official-source checks
- UK role salary bands and indicative certification career-value ranges
- JSON backup and restore
- Recovery points and one-step undo
- Optional encrypted multi-device sync
- Offline-capable installable PWA

## £ market value and ROI

The tracker keeps role-market salary estimates separate from certification career-value estimates.

Role bands are UK market benchmarks. Certification values are indicative ranges based on factors such as career relevance, seniority, study effort, cost and data confidence. They are not guaranteed salary increases and are not added directly to a salary figure.

The £ ROI view includes:

- low / median / high UK role-market bands
- indicative certification contribution ranges
- confidence level
- value signal per focused study hour
- self-funded cost efficiency
- portfolio-evidence context

## Recommendation engine

Recommendations consider:

- current phase
- My Path inclusion
- prerequisites
- certification track and gateway status
- career ROI
- market-value signal
- target-role relevance
- employer funding
- study-time efficiency
- booked exams
- certification-data confidence

Built-in goal profiles include Convergence / OT Security Architect, Cyber Security Engineer, Network / Security Engineer, Physical Security Architect and Cloud Security Architect.

## Certification data health

Certification metadata is treated as dated information rather than permanent fact.

The application tracks verification dates, official-source provenance, pricing dates and confidence. Critical pathway records use an audited source registry, while the Data Health view highlights records requiring review.

## Privacy and storage

Personal progress is stored locally in the browser by default. There is no Cert Tracker account or application backend.

The salary baseline starts at zero. Any salary, progress, notes, exam dates or portfolio information entered into the tracker remains browser-local unless encrypted sync is explicitly enabled.

Public application content is kept generic and does not include personal employer, location or salary assumptions.

## Backup and recovery

Backup restore is validated before live state changes. Recovery points and one-step undo protect normal state mutations.

Regular JSON backups are recommended even when encrypted sync is enabled.

## Optional encrypted sync

Two encrypted-vault options are available:

1. **Encrypted file** — manually export and import a `.ctvault` file.
2. **WebDAV vault** — sync an encrypted vault through a compatible WebDAV service.

Encryption uses AES-GCM with PBKDF2-SHA256 key derivation, random salt and IV generation, and browser-side encryption. Vault and WebDAV passphrases are not stored in localStorage.

## Architecture

The application is framework-free and build-free.

| File | Responsibility |
| --- | --- |
| `certs.js` | Certification and career catalogue |
| `app.js` | Main UI renderer |
| `src/path-defaults.js` | Curated default certification path |
| `src/config.js` | Shared configuration |
| `src/dates.js` | Date and expiry calculations |
| `src/storage.js` | Persistence, backup, recovery and undo |
| `src/validation.js` | Certification schema and dependency validation |
| `src/phase-engine.js` | Path and phase completion rules |
| `src/source-registry.js` | Audited official-source registry |
| `src/data-health.js` | Verification age, provenance and confidence |
| `src/market-value.js` | UK role-market and certification value modelling |
| `src/recommendation-engine.js` | Recommendation scoring and explanations |
| `src/exports.js` | Export handling |
| `src/notifications.js` | Notification checks |
| `src/sync.js` | Encrypted vault and optional WebDAV sync |
| `src/ux.js` | Today view, command palette and supporting UI |
| `src/market-value-ui.js` | £ ROI view |
| `src/bootstrap.js` | Application startup |

## Testing

Run:

```bash
npm test
```

The automated checks cover JavaScript syntax, certification data contracts, dependencies, source coverage, service-worker assets, privacy regressions and architecture constraints.

A browser self-test page is also available at `tests.html` for browser-state, backup, date, calendar, recommendation, encryption and rendering checks.

## Deployment

Cert Tracker is a static application suitable for GitHub Pages or another HTTPS static host. HTTPS is required for service workers, notifications and Web Crypto outside localhost.
