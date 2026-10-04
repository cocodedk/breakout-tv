# Contributing to Breakout

## Local setup

1. Install Node.js 22 or newer.
2. Install the packages and a browser for the drives: `npm ci`, then `npx playwright install chromium`.
3. Run `npm run check` once to see that the machine is ready.

## Install git hooks

```sh
./scripts/install-hooks.sh
```

This sets `core.hooksPath` to `.githooks` for the repository:

- `pre-commit` runs the compatibility lint and the unit tests.
- `commit-msg` requires a Conventional Commits subject, such as `feat(paddle): hold to move`.
- `pre-push` refuses a push whose URL is not under `github.com/cocodedk` (a bare repository on the
  same machine is allowed) and refuses to force-push or delete `main`.

The hooks stop accidents, not malice: `git push --no-verify` skips them, and so do pushes from the
GitHub web page or from CI. `core.hooksPath` is local configuration, so a fresh clone has no hooks
until you run the installer. Because it is stored in the repository's own configuration, it applies
to every worktree of that clone.

## Build and test commands

```sh
npm run check                              # the lint, the unit tests and the Playwright drives
node tools/lint.js                         # only the compatibility lint
node --test tests/unit/*.test.js           # only the unit tests
node tests/drive/shell.drive.js            # one drive file
npm run stage                              # copy the app into dist/app with the build stamp
```

## Coding style

- The TV's engine is Chromium 76 and never updates. Use nothing newer; the lint rejects the
  features it knows about, but a green lint does not prove the app works on the TV.
- Classic `<script>` tags on the `window.BO` namespace: no modules, no bundler, no framework and no
  runtime packages. Every `tizen` and `webapis` call sits in try/catch.
- Read keys by `keyCode`. The keyboard and the remote must both work, and Back always does something.
- No code file over 200 lines. Split at a natural seam.
- Keep everything that matters 48px from every edge of the 1920×1080 layout, with no text smaller
  than 28px.
- Nothing private in a tracked file: no certificates, passwords, TV addresses or device IDs.

The full rules are in [CLAUDE.md](CLAUDE.md) and [profile-tizen.md](profile-tizen.md).

## Branches and commits

Never commit directly to `main`. Work on a branch named after the kind of change, in kebab-case,
and open a pull request.

| Branch prefix | Commit type | Example |
|---|---|---|
| `feature/` | `feat:` | `feature/add-multiball` |
| `fix/` | `fix:` | `fix/ball-sticks-to-paddle` |
| `chore/` | `chore:` | `chore/update-dependencies` |
| `docs/` | `docs:` | `docs/update-controls` |
| `refactor/` | `refactor:` | `refactor/split-physics` |
| `ci/` | `ci:` | `ci/cache-browsers` |

## Local git setup

Run once after cloning:

```sh
git config pull.rebase true          # rebase on pull instead of a merge commit
git config core.autocrlf input       # normalise CRLF to LF on commit (macOS and Linux)
git config push.autoSetupRemote true # git push without -u the first time
git config init.defaultBranch main   # default branch name for new repositories
```

Windows contributors use `core.autocrlf true` instead of `input`.

## Releases

Releases are cut by the owner. Git tags are the version: the Release workflow (Actions, Release, Run
workflow, then pick `patch`, `minor` or `major`) reads the highest `vX.Y.Z` tag, bumps it, stamps
the version into `config.xml` and `package.json` in the build only, and publishes
`breakout-tv-app.zip` with a build provenance attestation. Nothing is committed back to `main`.

The zip is the unsigned app folder. Signing needs the owner's Tizen certificate, which never goes
into the repository or CI, so everyone signs the app with their own certificate before installing
it (see the README).

## Pull request checklist

- [ ] `npm run check` passes.
- [ ] The changed behaviour was tried by hand, on the TV when it touches keys, focus, sound or layout.
- [ ] The spec or the docs are updated if the behaviour changed.
- [ ] No file is over 200 lines, and nothing newer than Chromium 76 was added.
