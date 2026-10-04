# Breakout

[![CI](https://github.com/cocodedk/breakout-tv/actions/workflows/ci.yml/badge.svg)](https://github.com/cocodedk/breakout-tv/actions/workflows/ci.yml)

The classic brick-breaker for a 2021 Samsung TV (Tizen 6.0, Chromium 76). It is a packaged web app
(`.wgt`) that you sideload in the TV's developer mode and play with a keyboard plugged into the TV
or with the TV remote. It is plain HTML, CSS and JavaScript: classic `<script>` tags on one shared
namespace, no bundler, no framework and no runtime packages.

## Website

- [English](https://breakout.cocode.dk/)
- [فارسی (Persian)](https://breakout.cocode.dk/fa/)

## Features

- Three walls of thin bricks: a full wall, a checkerboard, and a pyramid under two rows of silver
  bricks that take two hits. After level 3 they come round again, with the ball starting faster.
- Behind each wall a UFO with rainbow-shifting lights slides left and right. Hit it and the rest of
  the wall dissolves and the next level starts: you don't have to clear every brick.
- 10 lives a level, and when you hit the UFO the whole score is multiplied by the lives you have
  left.
- Game over offers a retry of the level you lost (with the score it started with), a fresh start
  from level 1, or the title. The best score is saved on the TV.
- Paddle, ball and bricks, played at a fixed 1920×1080 layout, with everything that matters kept
  well inside the screen edges and no text smaller than 28px.
- Works with a plain USB or Bluetooth keyboard and with the TV remote, with the same keys doing the
  same thing on both.
- Runs on the TV's own browser engine, which never updates, so nothing newer than Chromium 76 is used.
- No network: everything the game needs lives in the app.
- A build stamp in a corner of the screen, so you can see which commit is running on the TV.

## Controls

| Action | Keyboard | TV remote |
|---|---|---|
| Move the paddle (hold) | ← → or A D | ← → |
| Move around menus | Arrow keys, W S, A D | Arrows |
| Launch the ball, choose | Space or Enter | OK |
| Pause | P, Escape or Backspace | Back |
| Sound on/off | M | — |

Back always does something: it closes a dialog, goes back a screen, or asks before leaving.

## Download

The release is an **unsigned app folder**: a Tizen TV only installs an app signed with a
certificate, and the signing key must stay with its owner, so you sign it yourself.

[**Download Breakout**](https://github.com/cocodedk/breakout-tv/releases/latest/download/breakout-tv-app.zip)
(`breakout-tv-app.zip`, which unpacks to an `app/` folder).

Each release carries a build provenance attestation. To check a download:

```sh
gh attestation verify breakout-tv-app.zip --repo cocodedk/breakout-tv
```

## Install on the TV

You need [Tizen Studio](https://developer.tizen.org/development/tizen-studio/download) (its `tizen`
and `sdb` command line tools) and a signing certificate profile, which you create in its Certificate
Manager.

1. Turn on the TV's developer mode: open Apps (or App Settings on some TVs), press 1 2 3 4 5, switch
   Developer mode on, enter your computer's IP address, and restart the TV. A set that requires it
   also needs "Permit to install applications" in Tizen Studio's Device Manager before the first
   install.
2. Get the app folder, either by unzipping the download above (`app/`), or by building it yourself
   from a clone:

   ```sh
   git clone https://github.com/cocodedk/breakout-tv.git
   cd breakout-tv
   npm ci
   npm run stage
   ```

   `npm run stage` copies the app into `dist/app/` and fills in the build stamp.
3. Package, install and start it. Use `app` instead of `dist/app` if you unzipped the download:

   ```sh
   tizen package -t wgt -s <your-signing-profile> -- dist/app
   sdb connect <tv-ip>:26101
   tizen install -n app.wgt -t <device-name> -- dist/app
   tizen run -p BreakoutTV.Breakout -t <device-name>
   ```

   `tizen package` names the package after the app (`Breakout.wgt`), so rename it to `app.wgt` before
   installing. `-t` takes the name `sdb devices` prints, not `ip:port`. If a retail set rejects a
   self-signed install, sign with a Samsung certificate that has the TV's DUID registered.

The longer notes are in [profile-tizen.md](profile-tizen.md). A desktop browser test does not prove
the app works on the TV: try each release on the oldest TV you care about.

## Build from source

You need Node.js 22 or newer. The app is the repository itself, so there is nothing to compile.

```sh
npm ci
npx playwright install chromium
npm run check
```

`npm run check` runs the compatibility lint for the TV's engine, the unit tests and the Playwright
drives that play the app at 1920×1080 with synthetic remote keys. It is the gate for every change,
and CI runs it on every pull request. To try the game on a desktop, open `index.html` in a browser.

## Architecture

```
index.html        the page, with the build stamp
config.xml        the Tizen widget description
css/              the stylesheets
js/               the game, on the window.BO namespace
tests/unit/       unit tests run by Node
tests/drive/      Playwright drives that play the app
tools/            the compatibility lint and the staging script
docs/lean/        what to build, one spec per feature
```

| Part | Choice |
|---|---|
| Engine | Chromium 76 on Tizen 6.0; nothing newer is used |
| Language | Classic scripts on the `window.BO` namespace |
| Tests | Node's test runner and Playwright |
| Packaging | `.wgt`, signed by whoever installs it |

The house rules are in [CLAUDE.md](CLAUDE.md). See [CONTRIBUTING.md](CONTRIBUTING.md) before opening
a pull request, and [SECURITY.md](SECURITY.md) to report a vulnerability.

## Author

**Babak Bandpey** — [https://cocode.dk](https://cocode.dk) | [LinkedIn](https://linkedin.com/in/babakbandpey) | [GitHub](https://github.com/cocodedk)

## License

Apache-2.0 | © 2026 [Cocode](https://cocode.dk) | Created by [Babak Bandpey](https://linkedin.com/in/babakbandpey)
