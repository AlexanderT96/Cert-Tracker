# Practical capability and role-gate model

Cert Tracker does not treat certification completion as equivalent to career readiness.

## Maturity model

Practical evidence progresses through:

1. **Not evidenced** — no demonstrated capability yet.
2. **Labbed / demonstrated** — can perform the task in a safe or controlled environment.
3. **Used in real work** — has applied the capability operationally and can explain failure modes and trade-offs.
4. **Designed / documented** — has created and defended a design or implementation artefact.
5. **Owned / led** — has been materially accountable for the outcome or architecture decision.

Certification progress and practical-evidence maturity are deliberately stored separately.

## Capability pillars

The generic model covers physical security, enterprise networking, network/cyber security, enterprise infrastructure, cloud/identity, automation/software, OT cybersecurity, OT engineering, architecture/commercial delivery, offensive/attack-path understanding and AI/analytics systems.

Each pillar combines certification-derived competency signal with practical evidence. This prevents a high certification count from creating an artificially high capability score when real application is missing.

## Role transition gates

The tracker defines generic readiness gates for increasingly senior technical roles, including physical-security systems engineering, network-security engineering, OT-security engineering, convergence engineering, solution architecture and principal convergence architecture.

A role gate requires both minimum pillar scores and specific evidence maturity. Later gates increasingly require **USED**, **DESIGNED** and **OWNED** evidence rather than lab evidence.

## Senior-certification behaviour

Experience-gated/capstone certifications remain visible as strategic targets, but the recommendation engine penalises them in near-term recommendations while their corresponding role gate is unmet. The sequence planner excludes unmet T3 experience-gated certifications from the generated near-term plan.

## Portfolio classification

Credentials are dynamically classified as:

- **Core Capability** — directly develops capability needed for the current or next role.
- **Primary Specialisation** — deepens a strategically important long-term domain.
- **Supporting** — useful breadth but lower priority than the main capability path.
- **Capstone** — senior recognition or expert credential whose value depends on real experience.

This classification changes with role context rather than forcing every late-stage credential into a mandatory checklist.

## Privacy

The public repository contains only generic pillar definitions, evidence templates, role gates and algorithms. Actual evidence maturity is browser-local state and is included only in the application's encrypted device-state backup/sync. Personal career context belongs in a separate private context store and is never fetched by the public client.
