/* Breakout drive: with localStorage throwing, the game still runs and the best score shows a dash. */
"use strict";
var assert = require("node:assert");
var runDrive = require("./drive-runner.js").runDrive;
var h = require("./drive-helpers.js");
var K = h.KEY;

function breakStorage() {
  Object.defineProperty(window, "localStorage", { get: function () { throw new Error("no storage"); } });
}

runDrive(async function (browser, url) {
  var context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  await context.addInitScript(breakStorage);
  var page = await h.openPage(context, url);
  assert.strictEqual(await h.text(page, "#title-best"), "Best score: —");

  await h.startGame(page);
  await h.seed(page, { score: 50, lives: 1, ball: { x: 100, y: 600, vx: 0, vy: 720 } });
  await page.clock.runFor(1000);
  assert.strictEqual((await h.snap(page)).screen, "over");
  assert.strictEqual(await h.text(page, "#over-score"), "Score 50");
  assert.strictEqual(await h.text(page, "#over-best"), "Best score —", "nothing was saved");

  await h.tap(page, K.BACK);
  assert.strictEqual(await h.text(page, "#title-best"), "Best score: —", "nothing was saved");
  await h.startGame(page);
  await h.tap(page, K.M);
  assert.strictEqual((await h.snap(page)).screen, "play", "the game still runs");
  assert.deepStrictEqual(page.errors, []);
  console.log("storage drive: ok");
}).catch(function (e) { console.error(e); process.exit(1); });
