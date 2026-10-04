# Ten lives a level, and unused lives multiply the score

## Goal

Every level is played with 10 lives instead of the game's 3. When the player hits the UFO, the
whole score is multiplied by the number of lives left, so a level cleared without losing a ball
multiplies everything scored so far by 10. Each new level starts with 10 lives again. Scores grow
fast, so they are shown with thousands separators and the HUD makes room for them.

This builds on specs 01 to 04 and the code they produced. Everything in them still holds unless
this spec says otherwise.

## The design to match

The game's look as it is: the HUD row's 40px white text, `#ffd447` for what matters, the level
banner's style. No new colours, fonts or images.

## Lives

- `START_LIVES` becomes 10. Every level starts with 10 lives: the start of a game, every level after
  a banner, a retry (spec 03) and Start over.
- Losing the ball takes one life as today; losing the last one ends the game with Game over, as
  today.
- The HUD shows lives as a number: "Lives 10", "Lives 9", … (the row of dots goes).

## The multiplier

- When the ball hits the UFO, first its 500 points are added (as today), then the whole score is
  multiplied by the lives left at that moment (10 when no ball was lost in the level, 1 when the
  last life is in play). The result is never above 999,999,999,999: when the product would pass
  it, the score becomes 999,999,999,999.
- During the dissolve and the banner, a line shows under the banner's place in the playfield:
  "10 lives left: score × 10" (with the real number, and "1 life left: score × 1" for one),
  `#play-bonus`, 56px, `#ffd447`, centred, its top 508px below the playfield's top (just under where
  the banner shows). It shows from
  the hit until the next level's wall appears, and is hidden at every other time.
- The score a level began with (spec 03's `levelStartScore`) is recorded after the multiplier, when
  the next level's wall loads, so a retry starts from the multiplied score.
- Best score works as today, with the multiplied score.

## Numbers on screen

- Every score the player reads is written with a comma every three digits: the HUD ("Score
  1,234,500"), the title's best score, Game over's score and best score. Use a small formatter in
  `js/score.js` (`formatScore`), not `toLocaleString`, so the TV's language setting cannot change
  it.
- The HUD row (positions inside `#hud`, which is 1600px wide): score at left 0, level centred in
  the box from 600 to 1000 as today, "Sound off" (28px) moved to left 1040, lives right-aligned at
  the right edge. "Score 999,999,999,999" must end before 600, and nothing in the row may overlap
  anything else.

## Code shape

- `js/session.js`: `START_LIVES` 10.
- `js/game.js` or `js/phases.js`: on a UFO hit, the multiplier and the cap, and lives back to 10
  when the next level's wall loads. Keep the hit's order: 500 points, then multiply.
- `js/score.js`: `multiply(score, lives)` returning the capped product, and `formatScore(n)`.
- `js/hud.js`, `index.html`, `css/play.css`: lives as a number, the bonus line, the moved "Sound
  off", formatted scores.
- `BO.game.snapshot()` keeps `score` as a plain number (unformatted) and `lives` as today.
- No file over 200 lines.

## Which earlier tests may change

Tests from specs 01 to 04 that assume 3 lives, the row of life dots, unformatted score text on
screen, the old "Sound off" position, or a score after a UFO hit of only `+500`, are updated to
this spec. Every other earlier test keeps what it demands.

## Acceptance tests

1. `npm run check` passes: the compatibility lint, the unit tests and every drive.
2. Unit tests of `js/score.js`: `multiply(1500, 10)` is 15000, `multiply(1500, 1)` is 1500, and
   `multiply(500000000000, 10)` is 999999999999; `formatScore` gives "0", "999", "1,000",
   "1,234,567" and "999,999,999,999".
3. A drive at 1920×1080 with Playwright's clock:
   - A new game shows "Lives 10" and "Score 0"; losing the ball shows "Lives 9".
   - Seed score 1000 and 7 lives, and send the ball into the UFO: the score becomes
     (1000 + 500) × 7 = 10500, the HUD shows "Score 10,500", and "7 lives left: score × 7" shows
     during the dissolve and the banner and is hidden once the next level is in Serve.
   - The next level starts with "Lives 10" and `levelStartScore` 10500; losing all its lives and
     picking "Retry level N" gives score 10500 and 10 lives.
   - Start over gives 10 lives and score 0.
   - Seed score 600,000,000,000 and 10 lives and hit the UFO: the score is 999,999,999,999.
   - Game over and the title show scores with commas.
4. The layout drive's rules hold with "Score 999,999,999,999", "Sound off" and "Lives 10" all in the
   HUD at once (no overlap, nothing within 48px of a screen edge, text at least 28px), and with the
   bonus line on screen.
5. The console shows no errors.

## Out of scope

- Extra lives, power-ups, or any other change to how lives are lost.
- Changing the UFO's 500 points, the brick points, the speed rules, the levels or the sounds.
- Packaging, signing or installing on the TV, and `website/`, `.github/`, `tools/` and
  `profile-tizen.md`.
