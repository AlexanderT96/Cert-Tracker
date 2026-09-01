# Cert Tracker

Cert Tracker is a local-first certification, readiness and career-planning application. It combines certification progress, exam and renewal tracking, competency coverage, study readiness, portfolio evidence, UK market-value modelling and constraint-aware certification sequencing in one installable PWA.

## Core capabilities

- Certification progress and pass-date tracking
- Exam booking, calendar export and renewal reminders
- Custom **My Path** planning with prerequisites and phase gates
- Explicit path-complete state rather than an endless final phase
- Target-role competency coverage and gap analysis
- Certification readiness estimates using prerequisites, study progress, objective coverage and existing skills
- Constraint-aware planning by study hours, budget, target date and maximum certification count
- Goal-aware recommendations with explainable scoring
- Marginal £ career-value modelling that discounts overlapping credentials
- Portfolio and experience evidence tracking
- Certification-data freshness and official-source checks
- Deeply validated JSON backup and restore
- Recovery points and one-step undo
- Optional encrypted multi-device sync with conflict protection
- Offline-capable installable PWA with no application backend

## Readiness and planning

The **Plan** view turns the tracker from a certification list into a sequencing tool.

It models:

- target-role competency coverage
- largest remaining skill gaps
- prerequisite completion
- logged study progress
- optional exam-objective coverage
- estimated remaining study effort
- available study hours per week
- self-funded budget
- target completion date
- employer-funded certifications
- certification dependencies
- marginal career value

The planner produces an ordered sequence that stays within the supplied constraints where possible and shows projected target-role coverage after the planned certifications.

Readiness percentages are estimates, not guarantees of an exam pass. Objective coverage can be entered manually from official exam objectives, practice tracking or another study system.

## Competency model

Certifications are mapped to a shared security and infrastructure competency taxonomy rather than ranked only by keywords.

The model covers areas including networking, routing, firewalling, Linux, cloud, Azure, AWS, IAM, Zero Trust, SOC operations, SIEM, incident response, threat detection, vulnerability management, offensive security, governance, architecture, OT/ICS, physical security, VMS, access control, automation, Python, infrastructure as code, containers, AI security, analytics, GIS and leadership.

Built-in goal profiles include:

- Convergence / OT Security Architect
- Cyber Security Engineer
- Network / Security Engineer
- Physical Security Architect
- Cloud Security Architect

Recommendations use competency fit alongside phase position, prerequisites, readiness, effort, funding, gateway status, data confidence and marginal market value.

## £ market value and ROI

Role-market salary estimates are kept separate from certification career-value estimates.

UK role bands provide broad market context. Certification values are indicative career-signal ranges rather than promised salary increases.

The marginal-value model reduces the contribution of a certification when its competency signal substantially overlaps credentials already completed. This prevents a portfolio of closely related certifications from being treated as a simple additive salary uplift.

The £ ROI views include:

- low / median / high UK role-market bands
- marginal certification contribution ranges
- credential-overlap and novelty effects
- confidence level
- value signal per remaining study hour
- self-funded cost efficiency
- portfolio-evidence context

## Certification data health

Certification metadata is treated as dated information rather than permanent fact.

The application tracks verification dates, official-source provenance, pricing dates and confidence. Critical pathway records use an audited official-source registry. A scheduled repository check also tests audited source URLs for broken or retired pages, while the in-app Data Health view highlights records requiring review.

## Privacy and local storage

Personal progress is stored locally in the browser by default. There is no Cert Tracker account, analytics service or application backend.

The salary baseline starts at zero. Salary, progress, notes, objective coverage, exam dates and portfolio information remain browser-local unless encrypted sync is explicitly enabled.

The application does not require third-party web fonts, so the normal interface is self-contained after its own assets have been cached.

## Backup and recovery

Backup restore validates both the overall schema and nested state before changing live data. Validation includes certification IDs, dates, phase overrides, study records, objective progress, planner settings and supported backup versions.

A failed restore rolls back to the previous state. Recovery points and one-step undo protect normal state changes.

Regular JSON backups are still recommended even when encrypted sync is enabled.

## Optional encrypted sync

Two encrypted-vault options are available:

1. **Encrypted file** — manually export and import a `.ctvault` file.
2. **WebDAV vault** — sync an encrypted vault through a compatible WebDAV service.

Encryption uses AES-GCM with PBKDF2-SHA256 key derivation, random salt and IV generation, and browser-side encryption. Vault and WebDAV passphrases are kept in memory for the current session rather than stored in localStorage.

WebDAV sync uses device/revision metadata, content hashes and HTTP ETags where available. Conditional writes prevent a remote vault that changed during an upload from being silently overwritten, and divergent local/remote revisions are surfaced as conflicts requiring an explicit choice.

## Architecture

The application remains framework-free and build-free. Domain logic is separated from rendering so the UI renderer no longer owns persistence or application state.

| File | Responsibility |
| --- | --- |
| `certs.js` | Certification and career catalogue |
| `src/path-defaults.js` | Curated default certification path |
| `src/config.js` | Shared configuration and utility primitives |
| `src/state-core.js` | Authoritative browser state, migration and renderer compatibility |
| `src/renderer.js` | Main application rendering and interaction layer |
| `src/dates.js` | Date and expiry calculations |
| `src/storage.js` | Persistence, deep backup validation, recovery and undo |
| `src/validation.js` | Certification schema and dependency validation |
| `src/phase-engine.js` | Path, phase and completion rules |
| `src/source-registry.js` | Audited official-source registry |
| `src/data-health.js` | Verification age, provenance and confidence |
| `src/competency-engine.js` | Competency taxonomy, role coverage and readiness |
| `src/market-value.js` | UK role-market and marginal certification-value modelling |
| `src/recommendation-engine.js` | Competency-aware recommendation scoring and explanations |
| `src/planner.js` | Constraint-aware certification sequence optimisation |
| `src/exports.js` | Export handling |
| `src/notifications.js` | Renewal notification checks |
| `src/sync.js` | Encrypted vault, revisions, hashes and WebDAV concurrency control |
| `src/ux.js` | Today view, command palette, data health and supporting UI |
| `src/market-value-ui.js` | £ ROI view |
| `src/intelligence-ui.js` | Readiness, competency gaps and planning UI |
| `src/accessibility.js` | Dialog keyboard handling and live-status accessibility |
| `src/bootstrap.js` | Application startup and non-invasive renderer integration |

## Testing

Run the static and data-contract checks with:

```bash
npm test
```

The repository quality gate also launches the real application in headless Chrome and executes `tests.html`. The browser suite covers state wiring, deep backup validation, dates/calendar export, phase overrides, competency modelling, readiness, marginal value, recommendations, planner constraints, encryption and stable sync hashing.

A separate scheduled data-health workflow checks both stored verification age and reachability of audited official sources.

## Deployment

Cert Tracker is a static application suitable for GitHub Pages or another HTTPS static host. HTTPS is required for service workers, notifications and Web Crypto outside localhost.
