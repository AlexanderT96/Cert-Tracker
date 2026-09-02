# Browser Support

Cert Tracker targets the current major browser engines with graceful degradation rather than maintaining separate browser-specific applications.

## Supported

- Google Chrome — current stable and previous major release
- Microsoft Edge — current stable and previous major release
- Mozilla Firefox — current stable and previous major release
- Apple Safari on macOS — current stable and previous major release
- Safari on current supported iOS/iPadOS releases

The application is also expected to remain usable in Chromium-derived browsers that implement the same web-platform baseline.

## Compatibility architecture

`src/browser-compat.js` detects platform capabilities instead of user-agent strings. `browser-compat.css` supplies fallbacks where an engine does not support optional presentation features such as `color-mix()`, `clip-path`, `backdrop-filter`, sticky positioning or CSS Grid.

The responsive layer separately selects mobile, tablet or desktop composition using viewport geometry, pointer capability and orientation. This avoids treating a desktop browser resized to phone width differently from a real touch device unless the input characteristics justify it.

## Required capabilities

The core tracker requires normal ES2020-era browser features. Encrypted cross-device sync additionally requires Web Crypto (`crypto.subtle`). When Web Crypto is unavailable, the tracker remains readable/local but encrypted sync is deliberately unavailable rather than silently downgrading to weak cryptography.

## Deliberately unsupported

- Internet Explorer
- Unsupported legacy Safari/Android WebView releases
- Browsers with JavaScript disabled
- Browsers that do not provide the security primitives required for encrypted sync

Supporting those environments would weaken the security baseline and materially complicate the tracker without a useful benefit.
