# Breakout — house rules

The arcade game Breakout for a 2021 Samsung TV (Tizen 6.0, Chromium 76), played with an external
keyboard plugged into the TV or with the TV remote. What to build is in `docs/lean/`, one spec per
feature. How the checks and the gates work is in [profile-tizen.md](profile-tizen.md). The finished
work is source that passes `npm run check`: staging, signing and installing on the TV (see the
profile's on_the_tv section) are release steps outside the build.

## The engine

- The TV's browser engine is Chromium 76 and never updates. Use nothing newer: no `?.`, `??`,
  `replaceAll`, `.at()`, `Promise.any`, `Object.hasOwn`, `structuredClone`, flex `gap`,
  `aspect-ratio`, `inset`, `min()`, `max()`, `clamp()`, `:focus-visible`, `:is()`, `:where()`,
  `@container` or CSS nesting.
- Classic `<script>` tags on one shared namespace, `window.BO`: no modules, no bundler, no framework
  and no runtime packages. A file that holds logic ends with a `module.exports` guard, so Node tests
  can load it.
- Every `tizen` and `webapis` call sits in try/catch, so the same files run in a desktop browser.

## Input

- A keyboard plugged into the TV sends ordinary key events: arrows 37 to 40, Enter 13, Space 32,
  Escape 27, letters by their key codes. The remote sends the arrows, OK (13) and Back (10009).
- Both must work. Escape (27) and Backspace (8) act as Back.
- Read keys by `keyCode`, never by `event.key` or `event.code` alone: the TV's engine fills
  `keyCode` reliably for both the remote and a keyboard.
- Back always does something.

## The screen

- A fixed 1920×1080 layout. Keep everything that matters at least 48px from each edge, and no text
  smaller than 28px.
- `[hidden]` gets `display: none !important`.
- A build stamp in a corner (`#build-stamp`), filled in by `npm run stage`.

## Files

- No code file over 200 lines. Split at a natural seam.
- Nothing private in a tracked file: no certificates, passwords, TV addresses or device IDs.

## Checks

`npm run check` runs the compatibility lint, the unit tests and the Playwright drives. Everything a
person reads, on screen or in the code, is in plain language.
