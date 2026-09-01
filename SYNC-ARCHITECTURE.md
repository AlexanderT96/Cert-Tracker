# Cert Tracker sync architecture

Cert Tracker deliberately separates three concerns:

- **Public application** — reusable PWA code and generic certification/career logic.
- **Private shared brain** — personalised career context used by authorised assistant/workflows, never by the browser sync token.
- **Private device-state vault** — dedicated repository containing only encrypted tracker state for phone/desktop synchronisation.

This separation prevents the public application from needing direct access to plaintext personal career context while still allowing the user's tracker progress to stay aligned across devices.

The browser sync vault is encrypted client-side with AES-GCM. GitHub receives only the encrypted envelope. Repository coordinates may be stored in local browser configuration; the GitHub token and vault passphrase are session-memory only.

A dedicated state repository is required by the intended security model because a GitHub Contents token can read every file in the repository to which it is scoped. Keeping the vault repository separate from the private shared brain ensures that the browser token cannot read plaintext career-context files even if browser code is compromised during that session.
