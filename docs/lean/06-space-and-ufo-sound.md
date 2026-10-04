# A deep-space sky, and a UFO hit that sounds like one

## Goal

Two changes that make the game feel richer:

1. **The background** is a plain navy colour today. It becomes deep space: a starfield with faint
   violet, blue and magenta nebula clouds, and a few stars that twinkle softly. It fits the UFO, and
   it is drawn once, so it costs the TV almost nothing while playing.
2. **Hitting the UFO** plays a single rising sweep today. It becomes a layered effect: a laser zap,
   a short explosion with a low thump, and the saucer's falling warble. The level-clear notes that
   already play when the wall has dissolved stay as they are and finish the moment like a fanfare.

This builds on specs 01 to 05 and the code they produced. Everything in them still holds unless
this spec says otherwise.

## The sky

- A new `<canvas id="sky" width="1920" height="1080">`, absolutely placed at 0,0 behind everything
  else on every screen (title, play, game over, dialogs). The body keeps `#070b1e` as its colour
  for the moment before the sky is drawn.
- `js/sky.js` draws it **once**, when the app starts, and never again:
  1. Fill `#070b1e`.
  2. Three nebula clouds, each a radial gradient from its colour at the centre to fully transparent
     at its radius: centre (420, 260) radius 520 `rgba(124, 77, 255, 0.18)`; centre (1500, 360)
     radius 600 `rgba(90, 169, 255, 0.14)`; centre (980, 900) radius 480 `rgba(255, 90, 200, 0.10)`.
  3. 220 stars at positions from a fixed seeded generator (mulberry32 with seed 7, the same every
     run): radius 0.6 to 1.8, opacity 0.3 to 1. Most are white; every 10th is `#cfe3ff` and every
     15th `#ffe9c4` (a star that is both takes `#cfe3ff`).
- **Twinkling**: 12 small DOM elements (`.twinkle`, 4×4px white circles) at fixed spots spread over
  the whole screen (their positions written in `css/sky.css`). They sit just above the sky canvas
  and below every screen, so the see-through playfield, the HUD and all text cover them. Each
  animates only its
  `opacity` between 0.15 and 1 with a CSS keyframe animation, durations between 2.4 s and 4.8 s
  (different per star so they never pulse together), `infinite`. Under
  `prefers-reduced-motion: reduce` they do not animate and stay at opacity 0.6. They hold no text.
- **The playfield canvas becomes see-through**: each frame it is cleared (`clearRect`) instead of
  painted `#070b1e`, and `#playfield` loses its CSS background, so the sky shows behind the bricks,
  the UFO, the paddle and the ball. Its 2px `#1f2a55` border stays.
- Text stays readable: the HUD, the title, Game over and the dialogs keep their colours; dialogs
  keep their `#0f1736` box.

## The UFO hit sound

The `core` sound becomes four layers, all started from the moment of the hit (t = 0), each with
the 5 ms attack and release of the other tones so nothing clicks:

| Layer | What | When | Peak gain |
|---|---|---|---|
| Zap | square wave falling from 1800 to 200 Hz | 0 to 0.15 s | 0.15 |
| Boom | white noise through a low-pass filter whose cutoff falls from 2000 to 200 Hz | 0.10 to 0.50 s | 0.25 |
| Thump | sine falling from 120 to 40 Hz | 0.10 to 0.40 s | 0.25 |
| Warble | sine falling from 900 to 300 Hz, its pitch wobbling ±40 Hz at 12 Hz (an LFO on the frequency) | 0.35 to 0.95 s | 0.12 |

- The noise is one buffer of 0.5 s of random samples, made once when the audio context is created.
- The `cleared` notes still play when the dissolve ends (spec 02), unchanged.
- M (sound off) silences every layer, including ones already scheduled, as it does for the other
  tones. Without Web Audio the game stays silent and runs.
- Put the layered sound in `js/sound-ufo.js` so `js/sound.js` stays small; both use the same
  context, on/off switch and list of playing sources.

## Code shape

- New: `js/sky.js` (the drawing, with the seeded generator; the star list is computed by a function
  Node can load and test), `js/sound-ufo.js`, `css/sky.css`.
- `index.html`: the sky canvas first inside `<body>`, the 12 twinkle elements, the new scripts and
  stylesheet.
- `js/render.js`: `clearRect` instead of the background fill.
- `BO.sky` exposes `draws()`, the number of times the sky has been drawn (for the drives).
- No file over 200 lines. Only `opacity` is animated.

## Which earlier tests may change

Tests that expect the playfield to be filled with `#070b1e` each frame, or the `core` sound to be a
single sine sweep, are updated to this spec. Every other earlier test keeps what it demands.

## Acceptance tests

1. `npm run check` passes: the compatibility lint, the unit tests and every drive.
2. Unit tests of `js/sky.js`: the star list has 220 stars, is identical on two calls, every star
   lies inside 1920×1080 with radius 0.6 to 1.8 and opacity 0.3 to 1, and the colour rule above
   holds; with a recording fake context, drawing makes the fill, three radial gradients with the
   centres, radii and colours above, and 220 star discs.
3. Unit test of `js/render.js`: a frame starts with `clearRect(0, 0, 1600, 880)` and never fills the
   whole playfield.
4. A drive at 1920×1080 with Playwright's clock: `BO.sky.draws()` is 1 after load and still 1 after
   starting a game, playing 5 s, pausing, resuming and reaching Game over; the `#sky` canvas is
   visible behind the title and behind the playfield (a pixel of the playfield area away from any
   brick is not `#070b1e` everywhere: at least one star or nebula pixel differs); 12 `.twinkle`
   elements exist, each with a running opacity animation; with reduced motion emulated, none runs.
5. The sound drive with its recording shim, extended for buffers, buffer sources, biquad filters
   and the LFO: a UFO hit starts the zap, the noise boom (through a low-pass filter whose cutoff is
   scheduled from 2000 to 200 Hz), the thump and the warble (with an oscillator connected to its
   frequency), each once and at the times above; with sound off (M) nothing starts; M during the
   layers stops them all.
6. The layout drive's rules hold on every screen, and the console shows no errors.

## Out of scope

- Moving or parallax stars, shooting stars, or a sky that changes per level.
- Any change to the other sounds, the music (there is none), the levels, the UFO's look or motion,
  or the scoring.
- Packaging, signing or installing on the TV, and `website/`, `.github/`, `tools/` and
  `profile-tizen.md`.
