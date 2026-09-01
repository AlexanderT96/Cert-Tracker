# Cert Tracker

A dependency-free progressive web app for tracking certifications, exam dates, expiry/renewal windows, study priorities and a long-term security career path.

## What it does

- Tracks passed certifications and pass dates
- Calculates expiry and renewal windows
- Stores exam bookings and exports them to iCalendar
- Maintains a custom **My Path** certification plan
- Ranks next moves using priority, dependencies, estimated study time and career ROI
- Tracks portfolio/experience evidence and phase artifacts
- Provides role-match and what-if views
- Supports JSON backup/restore
- Works offline as an installable PWA
- Keeps personal progress in browser `localStorage`; there is no backend

## Architecture

The app intentionally avoids frameworks and build tooling.

| File | Purpose |
| --- | --- |
| `index.html` | App shell and script loading |
| `certs.js` | Certification and career-path data |
| `app.js` | Main UI and application logic |
| `stability.js` | Storage migrations, validation and compatibility fixes |
| `styles.css` | Complete visual system |
| `sw.js` | Offline cache and notification service worker |
| `manifest.json` | PWA manifest |
| `tests.html` / `tests.js` | Browser self-test harness |

## Versioning

Three versions have separate meanings:

- **App version:** `2.1.0` — user-visible behaviour/UI release
- **Data version:** `57` — curated My Path data generation
- **Storage schema:** `3` — browser persistence format/migrations

The service-worker cache uses the app version so stale JS/CSS is replaced predictably.

## Data contract

Each certification has a unique `id`, `name`, `phase` (1–6), `track`, dependency list and study/ROI metadata. Current valid track values are:

- `CORE`
- `FOUNDATION`
- `CONDITIONAL`
- `OPTIONAL`
- `ROLE-DRIVEN`
- `POST-PLAN`

`stability.js` validates duplicate IDs, invalid phases/tracks, malformed hours and missing/self dependencies at startup. Validation errors are exposed through `window.CertTrackerStability.diagnostics` and logged to the browser console.

## Local data and backups

The app stores progress locally in the browser. The current My Path key is `ct2-mypath`. Older builds accidentally used the literal localStorage key `undefined`; the stability migration automatically adopts that legacy value without deleting it.

Use **Backup** regularly. Restore validates the backup structure before mutating live state to avoid partial restores from malformed files.

## Development checks

Open `tests.html` in the same deployment to run the lightweight browser self-tests. They verify:

- the My Path storage migration
- required persistence handlers
- certification data integrity
- local-date handling
- iCalendar escaping and date formatting

No package manager or build step is required.

## Deployment

The repository is suitable for GitHub Pages or any static host. The service worker uses relative paths so subdirectory deployments continue to work.
