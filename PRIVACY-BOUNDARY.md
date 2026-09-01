# Cert Tracker public/private boundary

This repository is the **public, reusable application layer**.

It may contain:
- generic certification metadata and official-source links;
- generic role profiles and competency taxonomies;
- generic Market ROI / Knowledge ROI / role-relevance scoring logic;
- generic planning, readiness, timing and experience-gate logic;
- UI, tests and browser-local settings;
- optional client-side encrypted device-state sync adapters that write/read only a user-configured vault file in a user-selected private storage location.

It must **not** contain:
- a named user's employer, role history, salary, weaknesses or personal priorities;
- personalised certification score overrides or private sequencing decisions;
- private career notes or conversation-derived context;
- embedded credentials, access tokens, private-repository tokens or vault passphrases;
- code that automatically reads or exposes plaintext private career-context files from a private repository;
- user-specific private repository coordinates hard-coded into public source.

## Intended architecture

The public application stays standalone and privacy-safe. Role selections and other generic preferences may be stored locally in the browser.

A separate private context store may be used by an authorised assistant or private workflow to make personalised career decisions. Private facts should influence recommendations outside this public repository; only reusable algorithms or anonymised generic capabilities belong here.

The public app may optionally sync **its own tracker state** through a private repository. That state must be encrypted locally before upload. Repository coordinates may be stored in that browser because they are configuration, but authentication tokens and encryption passphrases must remain session-only.

### Device-state isolation rule

Use a **dedicated private repository containing only encrypted tracker-sync state** for browser/device synchronisation. Do not use the plaintext private career-context repository, or any private repository containing notes, documents, personal data, or other unrelated files.

This keeps the browser token's blast radius narrow. The sync token should be a fine-grained GitHub token scoped only to the dedicated sync repository with `Contents: Read and write`. It should not receive Actions, Administration, Issues, Pull Requests, or access to other repositories merely for tracker synchronisation.

The sync UI requires an explicit session confirmation that the selected repository is dedicated to encrypted tracker state. Tokens and vault passphrases are not persisted by the application.

## Rule for contributions

When a private career decision exposes a generally useful capability gap, add the **generic capability** here and keep the user's reason, values and history private.
