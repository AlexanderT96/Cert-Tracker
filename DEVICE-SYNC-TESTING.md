# Device sync verification checklist

Use this after configuring the dedicated private state repository.

1. On the canonical device, open Sync and connect using the dedicated state repository, fine-grained token and vault passphrase.
2. Confirm the isolation checkbox, run Test access, then Smart sync.
3. Confirm that the dedicated repository contains only the encrypted vault path and no plaintext tracker export.
4. On a second device, connect with the same vault passphrase and Smart sync before editing anything.
5. Verify that completed certifications, study state and planner state match the canonical device.
6. Make a harmless tracker change on device A and Smart sync.
7. Smart sync on device B and confirm the change arrives.
8. Disconnect both sessions and verify the app asks for the token and passphrase again on a new session.
9. Never paste the token or vault passphrase into issues, source files, career-context files or screenshots intended for public sharing.

The automated Quality Gate covers application loading, encrypted-vault round trips, secret non-persistence, path validation and the existing browser regression suite. Live GitHub permission and multi-device behaviour require the one-time end-to-end check above because CI does not use a real private repository token.
