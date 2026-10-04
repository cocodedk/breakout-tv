/* Breakout drive: the UFO's hue turns a full circle in 4 seconds while the game runs, stands still under
   the pause dialog, and the ball hits the whole saucer, not just a disc around its middle. */
"use strict";
var assert = require("node:assert");
var runDrive = require("./drive-runner.js").runDrive;
var h = require("./drive-helpers.js");
var near = h.near;

/* Records the hue of every playfield drawing in window.hues. */
function recordHues(page) {
  return page.evaluate(function () {
    var draw = window.BO.render.draw;
    window.hues = [];
    window.BO.render.draw = function (ctx, s, view) {
      window.hues.push(view.hue);
      return draw(ctx, s, view);
    };
  });
}

function hues(page) {
  return page.evaluate(function () { return window.hues; });
}

async function lastHue(page) {
  var all = await hues(page);
  return all[all.length - 1];
}

runDrive(async function (browser, url) {
  var context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  var page = await h.openPage(context, url);
  await h.tap(page, h.KEY.ENTER);
  await recordHues(page);

  // Moving: the ball flies sideways far below the UFO, and a second of clock time turns the hue 90 degrees.
  await h.seed(page, { bricks: [], core: { x: 200, dir: 1 }, ball: { x: 300, y: 500, vx: 720, vy: 0 } });
  await page.clock.runFor(100);
  var before = await lastHue(page);
  await page.clock.runFor(1000);
  var turned = (await lastHue(page) - before + 360) % 360;
  near(turned, 90, 2, "the hue turns 90 degrees in a second");

  // Under the pause dialog nothing is redrawn.
  await h.tap(page, h.KEY.P);
  assert.strictEqual((await h.snap(page)).dialog, "pause");
  var drawn = (await hues(page)).length;
  await page.clock.runFor(1000);
  assert.strictEqual((await hues(page)).length, drawn, "the pause dialog stops the drawing");
  await h.tap(page, h.KEY.P);

  // A ball flying up at a point 40px left of the UFO's middle hits its hull, outside the old disc.
  await h.seed(page, { bricks: h.FAR_BRICKS, core: { x: 772, dir: 1 }, ball: { x: 740, y: 110, vx: 0, vy: -720 } });
  await page.clock.runFor(100);
  var snap = await h.snap(page);
  assert.deepStrictEqual([snap.state, snap.score], ["dissolve", 5000], "the hull is a hit, 500 points times 10 lives");
  near(snap.core.x - 740, 40, 2, "the ball hit 40px left of the UFO's middle");

  // The colours keep shifting during the dissolve.
  var atHit = await lastHue(page);
  await page.clock.runFor(300);
  assert.notStrictEqual(await lastHue(page), atHit, "the hue shifts during the dissolve");

  assert.deepStrictEqual(page.errors, []);
  console.log("ufo drive: ok");
}).catch(function (e) { console.error(e); process.exit(1); });
