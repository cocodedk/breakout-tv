# Game over: retry the level or start over

## Goal

Today, losing the last life ends the game, and Game over offers "Play again", which always starts
again from level 1, and "Title". A player who has worked up to level 3 loses everything. This
change gives the choice: retry the level that was lost, with full lives and the score that level
began with, or start over from the very beginning.

This builds on specs 01 and 02 and the code they produced. Everything in them still holds unless
this spec says otherwise.

## The design to match

The Game over screen as it is: same heading, score lines, "New best!" line, and the same choice
style (the `.choice` boxes, `.focused` in `#ffd447`). No new colours, fonts or images.

## Game over

What shows, top to bottom, is unchanged ("Game over", "Score …", "Best score …", "New best!" when
it applies), except the row of choices. It now holds three choices, side by side, in this order:

1. **"Retry level N"** (`#over-retry`), where N is the level that was lost. Focused when Game over
   shows.
2. **"Start over"** (`#over-again`, the element that said "Play again"; only its text changes).
3. **"Title"** (`#over-title`), unchanged.

Left/Right (or A/D) moves the focus along the row and stops at the ends, as it does today.
Enter, Space or OK picks. Back goes to the title, as today.

## What each choice does

- **Retry level N**: the same level again, in the same loop (so at the same start speed), with a
  fresh wall of that level, the core at x 800 moving right, 3 lives, and the score set back to what
  it was when that level began. The game shows Play in Serve, as at the start of any level.
- **Start over**: exactly what "Play again" does today: score 0, 3 lives, level 1, loop 0.
- **Title**: unchanged.

The score a level began with is recorded every time a level's wall is loaded: at the start of a
game, after each level banner, and on a retry (where it is the same number again). Retrying level 1
of loop 0 is therefore the same as starting over.

## Best score

Unchanged: when Game over shows, the score at that moment is compared with the saved best, saved
when higher, and "New best!" shows as today. A retry does not touch the saved best. A later Game
over in the retried game compares again in the same way.

## Code shape

- `index.html`: the new `#over-retry` choice first in the row; `#over-again`'s text becomes "Start
  over".
- `js/session.js`: a `levelStartScore` field. `BO.game.snapshot()` adds `levelStartScore`, and
  `BO.game.seed()` accepts it.
- `js/game.js`: records `levelStartScore` where a level's wall is loaded, and gains `retry()`.
  `js/hud.js` writes "Retry level N" when Game over shows and puts the focus on it.
- `js/controls.js`: `"over-retry"` picks `game.retry`.
- No file over 200 lines.

## Which earlier tests may change

Tests from specs 01 and 02 that expect "Play again" as the text or as the focused choice when Game
over shows, or two choices on Game over, are updated to this spec. Every other earlier test keeps
what it demands.

## Acceptance tests

1. `npm run check` passes: the compatibility lint, the unit tests and every drive.
2. A drive at 1920×1080 with Playwright's clock:
   - Seed level 2 with `levelStartScore` 1000, score 1500 and 1 life, and lose the ball: Game over
     shows "Retry level 2" (focused), "Start over" and "Title", in that order.
   - Enter on "Retry level 2": Play in Serve, level 2, its full wall (72 bricks), 3 lives, score
     1000, the core at x 800 moving right, and the ball at level 2's start speed for that loop.
   - The same with loop 1: the retry keeps loop 1 and its start speed.
   - From Game over, Right then Enter ("Start over"): level 1, loop 0, score 0, 3 lives.
   - Right twice then Enter ("Title"): the title. Right a third time keeps the focus on "Title".
   - Back on Game over: the title.
   - Losing on level 1 of a new game and retrying gives score 0, level 1, 3 lives.
   - After a level banner leads to the next level, `levelStartScore` equals the score at that
     moment.
   - A Game over with a score above the saved best shows "New best!" and saves it; retrying and
     losing again with a lower score keeps the saved best.
3. The layout drive's rules hold on Game over with its three choices (all text at least 28px,
   everything at least 48px from every edge), and the console shows no errors.

## Out of scope

- Continues limited in number, a retry counter, or any cost for retrying.
- Changes to the pause dialog, the title, the levels, the core or the sounds.
- Packaging, signing or installing on the TV, and `website/`, `.github/`, `tools/` and
  `profile-tizen.md`.
