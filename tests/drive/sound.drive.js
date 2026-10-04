/* Breakout drive: with Web Audio replaced by a recording shim, a paddle hit, a brick hit and a lost
   ball each start one tone; a UFO hit starts its four layers; after M none do, "Sound off" shows,
   and the setting survives a reload. */
"use strict";
var assert = require("node:assert");
var runDrive = require("./drive-runner.js").runDrive;
var h = require("./drive-helpers.js");
var installShim = require("./audio-shim.js").installShim;
var K = h.KEY;

/* Every source the page has started so far (oscillators and noise sources). */
function tones(page) {
  return page.evaluate(function () { return window.__tones; });
}

/* Plays a paddle hit, a brick hit and a lost ball, and returns the tones each one started. */
async function playThree(page) {
  var counts = [];
  var before = await tones(page);
  await h.seed(page, { ball: { x: 800, y: 780, vx: 0, vy: 720 } });
  await page.clock.runFor(100);
  counts.push((await tones(page)) - before);

  before = await tones(page);
  await h.seed(page, {
    bricks: [{ col: 5, row: 0, color: "R" }, { col: 0, row: 0, color: "R" }],
    ball: { x: 736, y: 300, vx: 0, vy: -720 }
  });
  await page.clock.runFor(400);
  counts.push((await tones(page)) - before);

  before = await tones(page);
  await h.seed(page, { ball: { x: 100, y: 600, vx: 0, vy: 720 } });
  await page.clock.runFor(1000);
  counts.push((await tones(page)) - before);
  return counts;
}

/* Hits the core and returns the sources started in the 100 ms after; then waits out the dissolve and
   the level banner. */
async function coreHit(page) {
  var before = await tones(page);
  await h.seed(page, h.atCore());
  await page.clock.runFor(100);
  var started = (await tones(page)) - before;
  await page.clock.runFor(2700);
  return started;
}

/* A gain curve with the 5 ms attack and release: [set 0, ramp to peak, set peak, ramp to 0]. */
function envelope(peak, start, end) {
  function r(x) { return Math.round(x * 1e6) / 1e6; }
  return [["set", 0, start], ["ramp", peak, r(start + 0.005)], ["set", peak, r(end - 0.005)], ["ramp", 0, end]];
}

/* The four layers of the UFO hit, each once and at its time, from the notes the shim recorded. */
function checkLayers(notes) {
  assert.strictEqual(notes.length, 5, "zap, boom, thump, warble and the warble's wobble");
  var zap = notes[0];
  assert.deepStrictEqual([zap.kind, zap.type, zap.start, zap.end], ["osc", "square", 0, 0.15]);
  assert.deepStrictEqual(zap.freq, [["set", 1800, 0], ["ramp", 200, 0.15]]);
  assert.deepStrictEqual(zap.gain, envelope(0.15, 0, 0.15));

  var boom = notes[1];
  assert.deepStrictEqual([boom.kind, boom.start, boom.end], ["noise", 0.1, 0.5]);
  assert.deepStrictEqual(boom.filter, { type: "lowpass", cutoff: [["set", 2000, 0.1], ["ramp", 200, 0.5]] });
  assert.deepStrictEqual(boom.gain, envelope(0.25, 0.1, 0.5));

  var thump = notes[2];
  assert.deepStrictEqual([thump.kind, thump.type, thump.start, thump.end], ["osc", "sine", 0.1, 0.4]);
  assert.deepStrictEqual(thump.freq, [["set", 120, 0.1], ["ramp", 40, 0.4]]);
  assert.deepStrictEqual(thump.gain, envelope(0.25, 0.1, 0.4));

  var warble = notes[3];
  assert.deepStrictEqual([warble.kind, warble.type, warble.start, warble.end], ["osc", "sine", 0.35, 0.95]);
  assert.deepStrictEqual(warble.freq, [["set", 900, 0.35], ["ramp", 300, 0.95]]);
  assert.deepStrictEqual(warble.gain, envelope(0.12, 0.35, 0.95));
  assert.deepStrictEqual(warble.wobble, { rate: [["set", 12, 0.35]], depth: [["set", 40, 0.35]] },
    "an oscillator of 12 Hz and a depth of 40 Hz drives the warble's frequency");
  assert.strictEqual(notes[4].lfo, true);
}

runDrive(async function (browser, url) {
  var context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  await context.addInitScript(installShim);

  var page = await h.openPage(context, url);
  await h.startGame(page);
  assert.ok(!(await page.isVisible("#hud-sound")), "sound is on at first");
  assert.deepStrictEqual(await playThree(page), [1, 1, 1], "each event starts one tone");
  await page.evaluate(function () { window.__notes.length = 0; });
  assert.strictEqual(await coreHit(page), 5, "a core hit starts its layers once");
  var notes = await page.evaluate(function () { return window.__notes.slice(0, 5); });
  checkLayers(notes);
  var buffers = await page.evaluate(function () { return window.__buffers; });
  assert.deepStrictEqual(buffers, [{ length: 4000, rate: 8000 }], "one 0.5 s noise buffer, made once");

  await h.tap(page, K.M);
  assert.ok(await page.isVisible("#hud-sound"));
  assert.strictEqual(await h.text(page, "#hud-sound"), "Sound off");
  assert.deepStrictEqual(await playThree(page), [0, 0, 0], "no tones once sound is off");
  assert.strictEqual(await coreHit(page), 0, "a core hit starts nothing once sound is off");
  assert.deepStrictEqual(page.errors, []);
  await page.close();

  var again = await h.openPage(context, url);
  await h.startGame(again);
  assert.ok(await again.isVisible("#hud-sound"), "Sound off survives a reload");
  assert.deepStrictEqual(await playThree(again), [0, 0, 0], "and so does the silence");
  await h.tap(again, K.M);
  assert.ok(!(await again.isVisible("#hud-sound")));
  assert.deepStrictEqual(await playThree(again), [1, 1, 1], "M turns it back on");
  assert.deepStrictEqual(again.errors, []);
  await again.close();

  // The wall, UFO-hit, level-clear and game-over sounds.
  var third = await h.openPage(context, url);
  await h.startGame(third);
  var before = await tones(third);
  await h.seed(third, { ball: { x: 30, y: 600, vx: -720, vy: 0 } });
  await third.clock.runFor(100);
  assert.strictEqual((await tones(third)) - before, 1, "a wall hit starts one tone");

  before = await tones(third);
  await h.seed(third, h.atCore());
  await third.clock.runFor(400);
  assert.strictEqual((await tones(third)) - before, 5, "the core hit starts its five sources");
  await third.clock.runFor(700);
  assert.strictEqual((await tones(third)) - before, 8, "the end of the dissolve sounds three rising notes");
  await h.tap(third, K.M);
  var cancelled = await third.evaluate(function () {
    return window.__stops.filter(function (t) { return t === 0; }).length;
  });
  assert.ok(cancelled >= 8, "muting cancels the layers and the notes already scheduled");
  await h.tap(third, K.M);
  await third.clock.runFor(1500);

  before = await tones(third);
  await h.seed(third, { lives: 1, ball: { x: 100, y: 600, vx: 0, vy: 720 } });
  await third.clock.runFor(1000);
  assert.strictEqual((await h.snap(third)).screen, "over");
  assert.strictEqual((await tones(third)) - before, 3, "the lost ball and two falling notes");
  assert.deepStrictEqual(third.errors, []);
  console.log("sound drive: ok");
}).catch(function (e) { console.error(e); process.exit(1); });
