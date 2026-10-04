/* Breakout drive: with Web Audio replaced by a recording shim, a paddle hit, a brick hit and a lost
   ball each start one tone; after M none do, "Sound off" shows, and the setting survives a reload. */
"use strict";
var assert = require("node:assert");
var runDrive = require("./drive-runner.js").runDrive;
var h = require("./drive-helpers.js");
var K = h.KEY;

/* Runs before the page's own scripts: counts every oscillator that is started. */
function installShim() {
  window.__tones = 0;
  window.__stops = [];
  window.__notes = [];
  /* Records every call made on the parameter, as [name, value, time]. */
  function param() {
    var p = { calls: [] };
    p.setValueAtTime = function (v, t) { p.calls.push(["set", v, t]); };
    p.linearRampToValueAtTime = function (v, t) { p.calls.push(["ramp", v, t]); };
    return p;
  }
  function FakeAudioContext() {
    this.currentTime = 0;
    this.state = "running";
    this.destination = {};
  }
  FakeAudioContext.prototype.resume = function () { return Promise.resolve(); };
  FakeAudioContext.prototype.createGain = function () {
    return { gain: param(), connect: function () {} };
  };
  FakeAudioContext.prototype.createOscillator = function () {
    var osc = {
      frequency: param(),
      connect: function (node) { osc.node = node; },
      start: function (t) {
        window.__tones += 1;
        osc.note = { type: osc.type, start: t, freq: osc.frequency.calls, gain: osc.node.gain.calls };
        window.__notes.push(osc.note);
      },
      stop: function (t) {
        window.__stops.push(t);
        if (osc.note && t > 0) { osc.note.end = t; }
      }
    };
    return osc;
  };
  window.AudioContext = FakeAudioContext;
}

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

/* Hits the core and returns the tones started in the 100 ms after; then waits out the dissolve and
   the level banner. */
async function coreHit(page) {
  var before = await tones(page);
  await h.seed(page, { bricks: [], core: { x: 780, dir: 1 }, ball: { x: 800, y: 110, vx: 0, vy: -720 } });
  await page.clock.runFor(100);
  var started = (await tones(page)) - before;
  await page.clock.runFor(2700);
  return started;
}

runDrive(async function (browser, url) {
  var context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  await context.addInitScript(installShim);

  var page = await h.openPage(context, url);
  await h.startGame(page);
  assert.ok(!(await page.isVisible("#hud-sound")), "sound is on at first");
  assert.deepStrictEqual(await playThree(page), [1, 1, 1], "each event starts one tone");
  await page.evaluate(function () { window.__notes.length = 0; });
  assert.strictEqual(await coreHit(page), 1, "a core hit starts the core tone once");
  var notes = await page.evaluate(function () { return window.__notes; });
  var core = notes[0];
  assert.strictEqual(core.type, "sine");
  assert.deepStrictEqual(core.freq, [["set", 300, 0], ["ramp", 1200, 0.5]], "a sweep from 300 to 1200 Hz over 500 ms");
  assert.strictEqual(core.end, 0.5);
  assert.deepStrictEqual(core.gain, [["set", 0, 0], ["ramp", 0.2, 0.005], ["set", 0.2, 0.495], ["ramp", 0, 0.5]],
    "peak gain 0.2 with 5 ms attack and release");

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

  // The wall, level-clear and game-over sounds.
  var third = await h.openPage(context, url);
  await h.startGame(third);
  var before = await tones(third);
  await h.seed(third, { ball: { x: 30, y: 600, vx: -720, vy: 0 } });
  await third.clock.runFor(100);
  assert.strictEqual((await tones(third)) - before, 1, "a wall hit starts one tone");

  before = await tones(third);
  await h.seed(third, { bricks: [], core: { x: 780, dir: 1 }, ball: { x: 800, y: 110, vx: 0, vy: -720 } });
  await third.clock.runFor(400);
  assert.strictEqual((await tones(third)) - before, 1, "the core hit starts one tone");
  await third.clock.runFor(700);
  assert.strictEqual((await tones(third)) - before, 4, "the end of the dissolve sounds three rising notes");
  await h.tap(third, K.M);
  var cancelled = await third.evaluate(function () {
    return window.__stops.filter(function (t) { return t === 0; }).length;
  });
  assert.ok(cancelled >= 3, "muting cancels the notes already scheduled");
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
