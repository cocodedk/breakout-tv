/* Breakout drive: the level chooser on the title page, its saving, and starting on the chosen level. */
"use strict";
var assert = require("node:assert");
var runDrive = require("./drive-runner.js").runDrive;
var h = require("./drive-helpers.js");
var K = h.KEY;

var LAST = 4;

function chooser(page) { return h.text(page, "#title-level"); }

function arrows(page) {
  return page.evaluate(function () {
    return [document.getElementById("title-level-prev"), document.getElementById("title-level-next")]
      .map(function (el) { return getComputedStyle(el).opacity; });
  });
}

async function chosen(page) { return (await h.snap(page)).chosenLevel; }

function throwingStorage() {
  Object.defineProperty(window, "localStorage", { get: function () { throw new Error("no storage"); } });
}

/* Chooses the level with the right key, from level 1. */
async function choose(page, level) {
  for (var i = 1; i < level; i++) { await h.tap(page, K.RIGHT); }
}

/* Plays level 3 to its end, so the game is over with the chosen level still shown on the title. */
async function gameOverOnLevel3(page) {
  await choose(page, 3);
  await h.startGame(page);
  await h.seed(page, { lives: 1, ball: { x: 100, y: 600, vx: 0, vy: 720 } });
  await page.clock.runFor(1000);
  assert.strictEqual((await h.snap(page)).screen, "over");
}

runDrive(async function (browser, url) {
  var context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });

  var page = await h.openPage(context, url);
  assert.strictEqual(await chooser(page), "◀  Level 1  ▶", "a fresh start shows level 1");
  assert.deepStrictEqual(await arrows(page), ["0.3", "1"], "the left arrow is dimmed at level 1");
  await h.tap(page, K.LEFT);
  assert.strictEqual(await chosen(page), 1, "no wrap-around below level 1");
  await h.tap(page, K.UP);
  await h.tap(page, K.DOWN);
  assert.strictEqual(await chosen(page), 1, "Up and Down do nothing");

  await h.tap(page, K.RIGHT);
  assert.strictEqual(await chooser(page), "◀  Level 2  ▶");
  assert.deepStrictEqual(await arrows(page), ["1", "1"]);
  for (var i = 3; i <= LAST; i++) { await h.tap(page, K.RIGHT); }
  assert.strictEqual(await chooser(page), "◀  Level " + LAST + "  ▶");
  assert.deepStrictEqual(await arrows(page), ["1", "0.3"], "the right arrow is dimmed at the last level");
  await h.tap(page, K.RIGHT);
  assert.strictEqual(await chosen(page), LAST, "no wrap-around above the last level");
  await h.tap(page, K.LEFT);
  assert.strictEqual(await chooser(page), "◀  Level " + (LAST - 1) + "  ▶");
  for (i = 0; i < 5; i++) { await h.tap(page, K.A); }
  assert.strictEqual(await chosen(page), 1, "A goes down and stops at 1");
  await h.tap(page, K.D);
  assert.strictEqual(await chosen(page), 2, "D goes up");

  // Level 3 and level 4 start with their own walls.
  await h.tap(page, K.D);
  await h.startGame(page);
  var three = await h.snap(page);
  assert.deepStrictEqual([three.screen, three.state, three.score, three.lives, three.level, three.loop],
    ["play", "serve", 0, 10, 3, 0]);
  assert.strictEqual(three.bricksLeft, 84);
  assert.ok(three.core, "level 3 has the UFO");
  assert.strictEqual(three.station, null, "and no station");

  var four = await h.openPage(await browser.newContext({ viewport: { width: 1920, height: 1080 } }), url);
  await choose(four, LAST);
  await h.startGame(four);
  var snapshot = await h.snap(four);
  assert.strictEqual(snapshot.level, LAST);
  assert.ok(snapshot.station, "level 4 has the station");
  assert.ok(!snapshot.core, "and no UFO");

  // The choice is saved: a page opened again in the same browser shows it.
  assert.deepStrictEqual(page.errors, []);
  page = await h.openPage(context, url);
  assert.strictEqual(await chooser(page), "◀  Level 3  ▶", "the choice survives a reload");

  // Quit to title keeps it shown.
  await h.startGame(page);
  await h.tap(page, K.P);
  await h.tap(page, K.DOWN);
  await h.tap(page, K.ENTER);
  assert.strictEqual(await chooser(page), "◀  Level 3  ▶", "Quit to title shows the chosen level");

  // Back opens the leave dialog; Left and Right move its focus and leave the level alone.
  await h.tap(page, K.BACK);
  assert.ok(await page.isVisible("#dialog-leave"));
  await h.tap(page, K.RIGHT);
  assert.strictEqual(await page.getAttribute("#leave-leave", "class"), "choice focused");
  await h.tap(page, K.LEFT);
  assert.strictEqual(await page.getAttribute("#leave-stay", "class"), "choice focused");
  assert.strictEqual(await chosen(page), 3, "the chosen level stays");
  await h.tap(page, K.BACK);

  // Game over: Start over is level 1, Title shows the chosen level.
  var over = await h.openPage(await browser.newContext({ viewport: { width: 1920, height: 1080 } }), url);
  await gameOverOnLevel3(over);
  await h.tap(over, K.RIGHT);
  await h.tap(over, K.ENTER);
  await over.clock.runFor(50);
  assert.strictEqual((await h.snap(over)).level, 1, "Start over starts level 1");
  await h.seed(over, { lives: 1, ball: { x: 100, y: 600, vx: 0, vy: 720 } });
  await over.clock.runFor(1000);
  await h.tap(over, K.RIGHT);
  await h.tap(over, K.RIGHT);
  await h.tap(over, K.ENTER);
  assert.strictEqual((await h.snap(over)).screen, "title");
  assert.strictEqual(await chooser(over), "◀  Level 3  ▶", "Title shows the chosen level");

  // A saved value that is not a level from 1 to 4 counts as level 1.
  for (var raw of ["7", "0", "abc"]) {
    var bad = await context.newPage();
    bad.errors = [];
    bad.on("pageerror", function (e) { bad.errors.push(String(e)); });
    await bad.addInitScript(function (v) { window.localStorage.setItem("breakout.level", v); }, raw);
    await bad.clock.install({ time: 0 });
    await bad.goto(url);
    assert.strictEqual(await chooser(bad), "◀  Level 1  ▶", "a saved '" + raw + "' shows level 1");
    assert.deepStrictEqual(bad.errors, []);
  }

  // Without storage the game starts on level 1, and the choice lives on in memory.
  var noStore = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  await noStore.addInitScript(throwingStorage);
  var plain = await h.openPage(noStore, url);
  assert.strictEqual(await chooser(plain), "◀  Level 1  ▶");
  await h.tap(plain, K.RIGHT);
  await h.startGame(plain);
  assert.strictEqual((await h.snap(plain)).level, 2, "the game starts without storage");
  await h.tap(plain, K.P);
  await h.tap(plain, K.DOWN);
  await h.tap(plain, K.ENTER);
  assert.strictEqual(await chooser(plain), "◀  Level 2  ▶", "the level is kept in memory");
  assert.deepStrictEqual(plain.errors, []);

  assert.deepStrictEqual(page.errors, []);
  console.log("level-select drive: ok");
}).catch(function (e) { console.error(e); process.exit(1); });
