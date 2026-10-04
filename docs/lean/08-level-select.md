# Choose the level on the title page

## Goal

The player picks which level to start on, from the title page, instead of always starting on
level 1. All levels can be chosen from the start; nothing has to be unlocked. The choice is
remembered for next time.

This builds on specs 01 to 07 and the code they produced. Everything in them still holds unless
this spec says otherwise.

## The design to match

The title page as it is: the same fonts, sizes and colours, `#ffd447` for what is focused. No new
images.

## The title page

- A new line, the level chooser (`#title-level`), directly under "Press Enter or OK to start" and
  above "Best score: …", 48px, centred: "◀  Level 2  ▶". The number is the chosen level.
- At the lowest level (1) the "◀" is dimmed (opacity 0.3), at the highest level (`levels.COUNT`, 4
  with spec 07) the "▶" is dimmed; otherwise both are full white. The level text is `#ffd447`.
- Left (or A) lowers the chosen level by one and Right (or D) raises it, stopping at the ends (no
  wrap-around), as the other menus do. Up/Down do nothing on the title.
- Enter, Space or OK starts a new game on the chosen level: score 0, 10 lives, loop 0, that level's
  fresh wall and start speed, and the UFO (or, on level 4, the station) as that level has it. From
  there the game goes on as always; after the last level comes level 1 with the loop one higher.
- A fourth control line is added under the others, 32px, same style: "Level: ← → or A D".
- The chosen level is saved in `localStorage` under `breakout.level` (try/catch: without storage it
  is simply 1 each time) whenever it changes, and read once, when the app starts. From then on the game keeps the chosen
  level in memory for the whole session, so returning to the title (from Game over or the pause
  dialog) shows the level chosen last, even when storage throws. A saved value that is
  not a whole number from 1 to `levels.COUNT` counts as 1.
- Back on the title still opens the leave dialog. While the leave dialog is open, Left/Right move
  its focus as today and do not change the level.
- The title's vertical layout may be tightened (for example the name's top padding) so everything
  fits; every text rule of spec 01 still holds (text at least 28px, everything at least 48px from
  every edge).

## Other screens

- Game over's "Start over" (spec 03) starts on **level 1**, as today, not on the chosen level.
  "Retry level N" is unchanged. "Title" returns to the title with the chosen level still shown.
- Quit to title from the pause dialog shows the title with the chosen level still shown.

## Code shape

- `index.html`: the chooser line and the fourth control line.
- The title's key handling in `js/controls.js` (or a small new `js/title-level.js` if a file would
  pass 200 lines) moves the chosen level; `js/game.js` gets a way to start on a given level
  (`start(level)`, defaulting to 1).
- `BO.game.snapshot()` adds `chosenLevel`.
- No file over 200 lines.

## Which earlier tests may change

Tests that assume the title has three control lines, or a fixed layout of the title's lines, are
updated to this spec. Every other earlier test keeps what it demands.

## Acceptance tests

1. `npm run check` passes: the compatibility lint, the unit tests and every drive.
2. A drive at 1920×1080 with Playwright's clock:
   - A fresh start (empty storage) shows "◀  Level 1  ▶" with "◀" dimmed; Right shows Level 2 with
     both arrows full; Right until the end shows the last level with "▶" dimmed, and one more Right
     changes nothing; Left goes back down, and stops at 1.
   - A and D do the same as Left and Right.
   - With Level 3 chosen, Enter starts level 3: score 0, 10 lives, loop 0, level 3's wall in Serve.
   - With Level 4 chosen (spec 07), Enter starts level 4 with the station and no UFO.
   - After a reload the title shows the level chosen before; with storage throwing, it shows 1 and
     the game still starts.
   - A saved "7", "0" or "abc" shows Level 1.
   - From Game over, "Start over" starts level 1 even when Level 3 is chosen; "Title" shows the
     title with Level 3 still chosen.
   - Back opens the leave dialog; there, Left/Right move its focus and the chosen level stays.
3. The layout drive's rules hold on the title with its new lines, and the console shows no errors.

## Out of scope

- Locking levels until reached, choosing the loop or the speed, or choosing lives.
- Any change to the levels themselves, the station, the UFO, the scoring or the sounds.
- Packaging, signing or installing on the TV, and `website/`, `.github/`, `tools/` and
  `profile-tizen.md`.
