/* Breakout drive: with Web Audio replaced by a recording shim, on level 4 a shot, a batted bolt and a
   returned hit start one, one and two sources with the notes of spec 07; a bolt batted in the step the ball
   is lost still sounds; with sound off (M) none do. */
"use strict";
var assert = require("node:assert");
var runDrive = require("./drive-runner.js").runDrive;
var h = require("./drive-helpers.js");
var shim = require("./audio-shim.js");
var K = h.KEY;
var envelope = shim.envelope;

function tones(page) {
  return page.evaluate(function () { return window.__tones; });
}

/* The first round of a launched level 4: the shot, the batted bolt and the returned hit; then M, and the
   next round starts none. */
async function stationSounds(page) {
  await h.startGame(page);
  await h.toLevel4(page);
  await page.evaluate(function () { window.__notes.length = 0; });
  var before = await tones(page);
  await h.tap(page, K.SPACE);
  await h.seed(page, { ball: { x: 100, y: 700, vx: 0, vy: 0 } });
  await page.clock.runFor(2050);
  assert.strictEqual((await tones(page)) - before, 1, "one tone for the shot");
  await page.clock.runFor(1400);
  assert.strictEqual((await tones(page)) - before, 2, "one tone for the batted bolt");
  await page.clock.runFor(700);
  assert.strictEqual((await tones(page)) - before, 4, "two sources for the returned hit");
  var notes = await page.evaluate(function () { return window.__notes.slice(0, 4); });
  var fire = notes[0];
  assert.deepStrictEqual([fire.type, fire.freq, fire.gain], ["square", [["set", 880, 0], ["ramp", 440, 0.12]], envelope(0.12, 0, 0.12)]);
  var reflect = notes[1];
  assert.deepStrictEqual([reflect.type, reflect.freq, reflect.gain], ["square", [["set", 660, 0], ["ramp", 1320, 0.08]], envelope(0.15, 0, 0.08)]);
  var hit = notes[2];
  assert.deepStrictEqual([hit.kind, hit.filter, hit.gain],
    ["noise", { type: "lowpass", cutoff: [["set", 3000, 0], ["ramp", 300, 0.2]] }, envelope(0.2, 0, 0.2)]);
  var thump = notes[3];
  assert.deepStrictEqual([thump.type, thump.freq, thump.gain], ["sine", [["set", 200, 0], ["ramp", 80, 0.25]], envelope(0.2, 0, 0.25)]);

  await h.tap(page, K.M);
  before = await tones(page);
  var score = (await h.snap(page)).score;
  await page.clock.runFor(3000);
  assert.strictEqual((await h.snap(page)).score - score, 1000, "the next shot was fired, batted back and hit");
  assert.strictEqual((await tones(page)) - before, 0, "no tones once sound is off");
}

/* A bolt batted back in the very step the ball is lost still sounds its tone, and the lost ball none. */
async function boltInLostStep(page) {
  await h.startGame(page);
  await h.seed(page, { level: 4 });
  await h.tap(page, K.SPACE);
  var before = await tones(page);
  var bolt = { x: 800, y: 801, vx: 0, vy: 600, back: false };
  await h.seed(page, { fireIn: 100, bolts: [bolt], ball: { x: 100, y: 891, vx: 0, vy: 720 } });
  await page.clock.runFor(100);
  var snap = await h.snap(page);
  assert.deepStrictEqual([snap.lives, snap.bolts[0].back], [9, true], "the ball was lost and the bolt batted");
  assert.strictEqual((await tones(page)) - before, 1, "the reflect tone");
}

runDrive(async function (browser, url) {
  var context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  await context.addInitScript(shim.installShim);

  var lost = await h.openPage(context, url);
  await boltInLostStep(lost);
  assert.deepStrictEqual(lost.errors, []);
  await lost.close();

  var page = await h.openPage(context, url);
  await stationSounds(page);
  assert.deepStrictEqual(page.errors, []);
  console.log("station sound drive: ok");
}).catch(function (e) { console.error(e); process.exit(1); });
