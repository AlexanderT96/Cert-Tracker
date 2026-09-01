# Sync security notes

The browser sync feature is designed around least privilege and separation of concerns.

## Protected assets

- plaintext private career context;
- tracker progress and planning state;
- GitHub access token;
- vault encryption passphrase.

## Primary controls

- tracker state is AES-GCM encrypted before upload;
- the GitHub token and vault passphrase are held in memory only for the active session;
- repository/path configuration can be stored locally, but secrets cannot;
- first-time device binding is remote-first to reduce accidental overwrite risk;
- shared-revision hashes detect divergent edits and block unsafe automatic overwrite;
- path validation blocks traversal and use of `.github/workflows/` for the vault;
- the UI requires explicit confirmation that the selected repository is dedicated to encrypted state;
- a fine-grained token is expected to be scoped to that repository only with Contents read/write.

## Residual risk

Any browser code holding a repository token can use that token for the duration of the session. For that reason, the token must never be scoped to a repository containing plaintext private career context or other unrelated sensitive files. A separate state-only repository materially reduces the impact of a browser compromise.

The application deliberately does not attempt to persist or recover the token or vault passphrase. Losing the vault passphrase means losing the ability to decrypt the remote vault; keep it in a reputable password manager.
