# Secure cross-device tracker sync

Cert Tracker can synchronise its browser-local tracker state between devices without a Cert Tracker backend.

## Recommended GitHub layout

Use three separate layers:

1. **Public application repository** — hosts the generic Cert Tracker application.
2. **Private career-context repository** — optional plaintext career context used by authorised assistant/workflows. Never expose this to the browser sync token.
3. **Dedicated private state repository** — contains only the encrypted tracker vault used by phone/desktop browsers.

Keeping layer 3 separate from layer 2 matters because a browser token with repository `Contents` permission can access every file in the repository it is scoped to. A dedicated state repository keeps that token away from plaintext career context.

## Create the state repository

Create a new **private** GitHub repository dedicated only to tracker state. A name such as `Cert-Tracker-State` is suitable. Initialise it with a README so the `main` branch exists.

Do not put career notes, documents, credentials, exports or other personal files in this repository.

## Create a least-privilege token

Create a fine-grained personal access token and restrict it to only the dedicated state repository.

Required repository permission:

- **Contents: Read and write**

Do not grant Actions, Administration, Issues, Pull Requests or access to unrelated repositories just for tracker sync.

Treat the token as a password. Cert Tracker keeps it in JavaScript memory for the connected browser session only; it is not written to localStorage or committed to GitHub.

## Connect the first device

Open **Sync** in Cert Tracker and enter:

- the dedicated repository as `owner/repository`;
- vault path `sync/cert-tracker.ctvault`;
- branch `main`;
- the fine-grained GitHub token;
- a strong vault passphrase of at least 10 characters.

Confirm the isolation checkbox, test access, then use **Smart sync**. If no remote vault exists, the first device creates one from its current tracker state.

The vault is encrypted with AES-GCM in the browser before GitHub receives it. The encryption passphrase is not sent to GitHub.

## Connect another device

Use the same repository, path and vault passphrase on the second device with a token that can access the dedicated state repository.

Use **Smart sync first**. A device with no common sync revision is remote-first: it pulls the established vault rather than overwriting it with a fresh browser state.

## Conflict behaviour

If both devices independently modify tracker state after their last common revision, Cert Tracker blocks the automatic overwrite and reports a sync conflict. Resolve which copy is canonical before forcing an overwrite.

Auto-sync is optional and only operates while the browser session remains connected. Session secrets are forgotten when explicitly disconnected or when the page/browser session is discarded.

## Privacy boundary

The encrypted device-state vault and the plaintext private career-context store are intentionally different things. Browser sync must never be configured against the private career-context repository.
