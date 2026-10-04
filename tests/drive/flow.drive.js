/* Breakout drive: losing the ball, game over, hitting the core, and leaving from the title. */
"use strict";
var assert = require("node:assert");
var runDrive = require("./drive-runner.js").runDrive;
var h = require("./drive-helpers.js");
var K = h.KEY;

/* Sends the ball straight down far from the paddle, and lets it fall out. */
async function loseBall(page) {
  await h.seed(page, { ball: { x: 100, y: 600, vx: 0, vy: 720 } });
  await page.clock.runFor(1000);
}

/* Two bricks far from the ball, which flies straight up into the core as it slides into its path. */
var CORE_HIT = {
  bricks: [{ col: 0, row: 2, color: "R" }, { col: 11, row: 2, color: "R" }],
  core: { x: 780, dir: 1 },
  ball: { x: 800, y: 110, vx: 0, vy: -720 }
};

runDrive(async function (browser, url) {
  var context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  var page = await h.openPage(context, url);
  await h.startGame(page);

  // Losing focus or hiding the page releases held keys and pauses a game in Serve or Moving.
  await h.tap(page, K.SPACE);
  await h.down(page, K.RIGHT);
  await page.evaluate(function () { window.dispatchEvent(new Event("blur")); });
  assert.strictEqual((await h.snap(page)).dialog, "pause", "blur pauses");
  await h.tap(page, K.P);
  var parked = (await h.snap(page)).paddleX;
  await page.clock.runFor(300);
  assert.strictEqual((await h.snap(page)).paddleX, parked, "blur released the held key");
  await page.evaluate(function () {
    Object.defineProperty(document, "hidden", { configurable: true, get: function () { return true; } });
    document.dispatchEvent(new Event("visibilitychange"));
    delete document.hidden;
  });
  assert.strictEqual((await h.snap(page)).dialog, "pause", "a hidden page pauses");
  await h.tap(page, K.P);
  await h.up(page, K.RIGHT);

  await loseBall(page);
  var snap = await h.snap(page);
  assert.strictEqual(snap.lives, 2);
  assert.strictEqual(snap.state, "serve");
  assert.strictEqual(snap.paddleX, 680, "the paddle is centred again for the next serve");
  assert.strictEqual(await h.text(page, "#hud-lives"), "Lives ● ●");

  await h.seed(page, { score: 1230 });
  await loseBall(page);
  assert.strictEqual((await h.snap(page)).lives, 1);
  await loseBall(page);
  snap = await h.snap(page);
  assert.strictEqual(snap.screen, "over");
  assert.ok(await page.isVisible("#screen-over"));
  assert.ok(!(await page.isVisible("#screen-play")));
  assert.strictEqual(await h.text(page, "#over-score"), "Score 1230");
  assert.strictEqual(await h.text(page, "#over-best"), "Best score 1230");
  assert.ok(await page.isVisible("#over-new-best"), "a first score beats no best");
  assert.strictEqual(await page.getAttribute("#over-again", "class"), "choice focused");

  await h.tap(page, K.RIGHT);
  assert.strictEqual(await page.getAttribute("#over-title", "class"), "choice focused");
  await h.tap(page, K.BACK);
  assert.strictEqual((await h.snap(page)).screen, "title", "Back goes to the title");
  assert.strictEqual(await h.text(page, "#title-best"), "Best score: 1230");

  await h.startGame(page);
  snap = await h.snap(page);
  assert.deepStrictEqual([snap.score, snap.lives, snap.level], [0, 3, 1]);
  await h.seed(page, { lives: 1 });
  await loseBall(page);
  assert.strictEqual((await h.snap(page)).screen, "over");
  assert.ok(!(await page.isVisible("#over-new-best")), "a score of 0 is not a new best");
  assert.strictEqual(await h.text(page, "#over-best"), "Best score 1230");
  await h.tap(page, K.ENTER);
  snap = await h.snap(page);
  assert.deepStrictEqual([snap.screen, snap.state, snap.score, snap.lives], ["play", "serve", 0, 3], "Play again");

  // Hitting the core dissolves the wall, shows the level banner, then the level 2 wall in Serve.
  await h.seed(page, CORE_HIT);
  await page.clock.runFor(1200);
  snap = await h.snap(page);
  assert.strictEqual(snap.state, "banner");
  assert.strictEqual(snap.score, 500);
  assert.strictEqual(snap.bricksLeft, 0);
  assert.ok(await page.isVisible("#play-banner"));
  assert.strictEqual(await h.text(page, "#play-banner"), "Level 2");
  await h.tap(page, K.SPACE);
  assert.strictEqual((await h.snap(page)).state, "banner", "keys do nothing during the banner");
  await h.down(page, K.LEFT);
  await page.clock.runFor(1000);
  assert.strictEqual((await h.snap(page)).state, "banner", "the banner lasts 1.5 s");
  await page.clock.runFor(500);
  snap = await h.snap(page);
  assert.deepStrictEqual([snap.state, snap.level, snap.bricksLeft], ["serve", 2, 72]);
  await page.clock.runFor(200);
  assert.strictEqual((await h.snap(page)).paddleX, 680, "a direction pressed in the banner moves nothing");
  await h.up(page, K.LEFT);
  assert.ok(!(await page.isVisible("#play-banner")));
  assert.strictEqual(await h.text(page, "#hud-level"), "Level 2");

  // After level 3, level 1 comes back with the loop count up.
  await h.seed(page, Object.assign({ level: 3 }, CORE_HIT));
  await page.clock.runFor(2800);
  snap = await h.snap(page);
  assert.deepStrictEqual([snap.state, snap.level, snap.loop, snap.bricksLeft], ["serve", 1, 1, 120]);
  await h.tap(page, K.SPACE);
  await page.clock.runFor(16);
  var v = (await h.snap(page)).ball;
  assert.ok(Math.abs(Math.sqrt(v.vx * v.vx + v.vy * v.vy) - 792) < 1, "loop 1 launches at 792 px/s");

  // Leave dialog over the title.
  await h.tap(page, K.P);
  await h.tap(page, K.DOWN);
  await h.tap(page, K.ENTER);
  assert.strictEqual((await h.snap(page)).screen, "title");
  await h.tap(page, K.ESC);
  assert.ok(await page.isVisible("#dialog-leave"));
  assert.strictEqual(await h.text(page, "#dialog-leave h2"), "Leave Breakout?");
  assert.strictEqual(await page.getAttribute("#leave-stay", "class"), "choice focused");
  await h.tap(page, K.BACK);
  assert.ok(!(await page.isVisible("#dialog-leave")), "Back closes it");
  await h.tap(page, K.BACKSPACE);
  await h.tap(page, K.RIGHT);
  assert.strictEqual(await page.getAttribute("#leave-leave", "class"), "choice focused");
  await h.tap(page, K.ENTER);
  assert.ok(!(await page.isVisible("#dialog-leave")), "Leave closes it in a desktop browser");
  assert.strictEqual((await h.snap(page)).screen, "title");

  assert.deepStrictEqual(page.errors, []);
  assert.ok(page.prevented.every(function (k) { return k.prevented; }), "every handled key had its default prevented");
  console.log("flow drive: ok");
}).catch(function (e) { console.error(e); process.exit(1); });
