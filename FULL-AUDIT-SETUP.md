# Full tracker audit

## Your setup

1. In the tracker open **? → Account Connections → Create account** (or Sign in to Adzuna) and check the provider terms.
2. Choose **Secure setup on GitHub**. Add repository secrets named `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` using the two values from Adzuna. Never paste them into the public tracker or commit them.
3. Choose **Open GitHub / sign in → Run workflow**. You only need your normal GitHub sign-in with access to run workflows in this repository. Return to the tracker and choose Refresh checks after the run finishes.

Adzuna uses API keys, not delegated OAuth account linking. Account Connections therefore provides provider-hosted sign-in and secure setup links, not a pretend permission-grant or a claim that your account is connected. The status check reads the last public workflow result, not your GitHub/Adzuna session. Remove the two repository secrets to stop subsequent authenticated requests; revoke the provider key if needed. Publicly published snapshots are not erased by this action.

Audits run daily automatically; market refreshes run hourly. No extra browser token or AI subscription is required. The first audit starts automatically on deployment, without waiting for provider keys.

## What is automated

- Inventory every mapped certification source, its linked fact sources, generated/curated learning links, all career-role sources and embedded salary-reference pages.
- Retrieve permitted public text sources, respecting robots rules and access challenges, with HTTPS/public-host checks, size limits and timeouts.
- Compare normalised page fingerprints with the last successful fetch; retain old evidence on access failures. First scans establish baselines, not changes.
- Report broken/blocked/unavailable sources, page changes, exact certification-name matches, and signals about retirement, eligibility, syllabuses, renewal and prices.
- Include a six-field review record for each certification. A name match is an automated source match, not independent verification of all credential facts.
- Run tracker logic regressions and refresh the job snapshot within quota. Record actual provider successes, query observation dates and last successful retrieval separately from attempts.
- Publish `data/tracker-audit.json` and show its counters and review queues in the ? panel.

## Limits that must stay visible

This is source-change monitoring and automated evidence collection, not an autonomous expert capable of certifying every claim. It does not silently rewrite prices, requirements, source-verification dates, career models or personal progress. Ambiguous facts, non-text/PDF sources, course-edition alignment and salary/role calibration still require contextual review. Search-result URLs are discovery tools and are explicitly excluded from fact evidence. A page mentioning retirement or a price may be discussing another product; signals are not automatic corrections.

The first source inventory includes many generated learning searches. The report separates those from pages actually retrieved. A partial run is published as partial, not passed.

## Market cadence and quota

The job provider budget is 3 requests/hour, 75/day and 2400/month, including manual attempts and failures. This fits within the documented default Adzuna quota. Queries rotate across the deduplicated role titles; one complete sweep takes roughly a day. An individual role is **not** rechecked every hour. Up to 500 recent listings are retained, and expired snapshots are suppressed. Hourly snapshots are usable for at most 90 minutes. Currency/pay-period uncertainty excludes salary figures from calculations.

The former `.co.uk` Arbeitnow endpoint was removed: the documented service is primarily Germany-focused and is not a verified UK fallback. Missing Adzuna keys therefore remain an explicit blocker to UK vacancy data.

Reference: https://developer.adzuna.com/docs/terms_of_service

Job cards include linked Jobs by Adzuna attribution. Logo: Adzuna, via https://commons.wikimedia.org/wiki/File:Adzuna_Logo.png (public-domain text logo; trademark rights remain with Adzuna). The externally hosted logo is fetched without a referrer; no private tracker data accompanies it.

## Authentication and publishing

The Run full audit link opens GitHub's authenticated workflow interface. It does not put a privileged token in the public app. Market refresh and source audit workflows share a publishing lock, do not cancel in-progress writes, and rebase only their generated-data commit before pushing. Tests never read a private vault.

The hosted app reads generated JSON directly from the public main branch, because GitHub Actions bot commits do not trigger branch-based Pages rebuilds. Refreshing data therefore does not require republishing the app. Local previews use same-origin data fixtures. No credentials or private tracker state accompany these public requests.

The previous weekly reachability workflow remains manually available; daily Full Tracker Audit replaces its schedule. A failed provider or blocked issuer is a report finding, not a fabricated verification success.
