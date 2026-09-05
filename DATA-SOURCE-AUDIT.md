# Historical source-link audit

Superseded by AUDIT-REMEDIATION.md for v4.14.0. The earlier 94% heuristic below was not factual verification; current UI counts dated fact-field checks separately.

# Certification source audit — 2 September 2026

Release: v4.8.4. Catalogue: 185 stable record IDs.

| Metric | Before | After |
| --- | --- | --- |
| Official-source links | 123/185 | 185/185 (100%) |
| Credential-level sources | 42 | 115 |
| Vendor/programme-level sources | 81 | 70 |
| Missing sources | 62 | 0 |
| Existing confidence heuristic | 81% | 94% |

Source coverage is a link/provenance measure, not the percentage of all catalogue statements independently verified. Some credential-level sources are official catalogues that explicitly identify the credential, rather than individual exam pages. Vendor-level links may require partner login or further exact-track research. URLs whose contents could not be inspected retain `sourceAudited: false`, no new source-check date and the lower vendor confidence.

## Corrections and limits

Every record has an explicit ID-to-source mapping. Descriptions are no longer scanned to guess the issuer: coverage text can mention competing products. This fixes incorrect AWS, Microsoft, Google, Axis, Milestone, TryHackMe and CrowdStrike matches for unrelated credentials.

New `sourceCheckedAt` dates record source identity/scope checks only. They do not rewrite catalogue `verifiedAt` or `priceCheckedAt`. Confidence scoring weights are unchanged; the improvement comes from better provenance. A fresh, audited credential-level source can score 100 under this heuristic, but that does not prove every cost, syllabus detail, availability claim or career-value estimate. Invalid and future record dates are treated as unknown. Month-only dates use the start of the stated month in UTC.

The review queue and CSV expose source notes, inspection dates and credential status. The full queue is accessible, including seven explicit availability warnings:

- JSNAD and JSNSD: official Linux Foundation retirement notices dated 30 September 2025.
- PCPP2: Python Institute lists the exam as in development.
- Claroty Platform Certified Engineer, Wiz Solution Engineer, MEDDIC Foundation and MEDDPICC Master: exact title/credential interpretation remains unconfirmed against the provider programme.

Existing record IDs, saved progress and career/readiness models are preserved. Availability warnings are audit findings, not deletion of historical achievements. This release does not automatically remove these records from a user's saved learning path or rewrite career recommendations.

## Verification

`npm test` includes a deterministic data-health regression gate checking all 185 mappings, wrong-issuer cases, honest source levels, date validation, stale-price preservation and availability warnings. Browser regression tests cover full provenance and warning visibility; functional Chromium, Firefox and WebKit checks open the data-health panel on desktop and mobile.

`npm run test:sources` is a separate network reachability probe. Reachability alone is not semantic source verification, and network warnings must not be reported as successful content audits. This audit used primary issuer pages where inspectable; unavailable inspections are explicitly marked in the registry.
