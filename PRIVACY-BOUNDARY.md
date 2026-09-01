# Cert Tracker public/private boundary

This repository is the **public, reusable application layer**.

It may contain:
- generic certification metadata and official-source links;
- generic role profiles and competency taxonomies;
- generic Market ROI / Knowledge ROI / role-relevance scoring logic;
- generic planning, readiness, timing and experience-gate logic;
- UI, tests and browser-local settings.

It must **not** contain:
- a named user's employer, role history, salary, weaknesses or personal priorities;
- personalised certification score overrides or private sequencing decisions;
- private career notes or conversation-derived context;
- credentials/tokens capable of reading a private context store;
- code that fetches a user's private repository from a public client.

## Intended architecture

The public application stays standalone and privacy-safe. Role selections and other generic preferences may be stored locally in the browser.

A separate private context store may be used by an authorised assistant or private workflow to make personalised career decisions. Private facts should influence recommendations outside this public repository; only reusable algorithms or anonymised generic capabilities belong here.

## Rule for contributions

When a private career decision exposes a generally useful capability gap, add the **generic capability** here and keep the user's reason, values and history private.
