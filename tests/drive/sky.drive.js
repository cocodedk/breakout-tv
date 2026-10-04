/* Breakout drive: the sky is drawn once and never again, shows behind the title and the see-through
   playfield, and twelve stars twinkle with a running opacity animation (none with reduced motion). */
"use strict";
var assert = require("node:assert");
var runDrive = require("./drive-runner.js").runDrive;
var h = require("./drive-helpers.js");
var K = h.KEY;

function draws(page) {
  return page.evaluate(function () { return window.BO.sky.draws(); });
}

/* Runs in the page: how many pixels of a canvas region are not the plain navy #070b1e, and the
   alpha of the first pixel. */
function pixels(args) {
  var ctx = document.getElementById(args.id).getContext("2d");
  var data = ctx.getImageData(args.x, args.y, args.w, args.h).data;
  var other = 0;
  for (var i = 0; i < data.length; i += 4) {
    if (data[i] !== 7 || data[i + 1] !== 11 || data[i + 2] !== 30) { other += 1; }
  }
  return { other: other, alpha: data[3] };
}

/* Runs in the page: the twinkle elements, each with its animations' state, timing and properties. */
function twinkles() {
  return Array.prototype.map.call(document.querySelectorAll(".twinkle"), function (el) {
    var animations = el.getAnimations();
    var keyframes = animations.length ? animations[0].effect.getKeyframes() : [];
    var props = {};
    keyframes.forEach(function (k) {
      Object.keys(k).forEach(function (p) {
        if (["offset", "easing", "composite", "computedOffset"].indexOf(p) < 0) { props[p] = true; }
      });
    });
    return {
      count: animations.length,
      state: animations.length ? animations[0].playState : "none",
      duration: animations.length ? animations[0].effect.getTiming().duration : 0,
      iterations: animations.length ? animations[0].effect.getTiming().iterations : 0,
      props: Object.keys(props),
      opacity: getComputedStyle(el).opacity,
      text: el.textContent
    };
  });
}

runDrive(async function (browser, url) {
  var context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  var page = await h.openPage(context, url);

  assert.strictEqual(await draws(page), 1, "drawn once after load");
  assert.ok(await page.isVisible("#sky"), "the sky shows behind the title");
  var sky = await page.evaluate(pixels, { id: "sky", x: 0, y: 0, w: 1920, h: 1080 });
  assert.ok(sky.other > 1000, "the sky has stars and nebula pixels");

  await h.startGame(page);
  await page.clock.runFor(5000);
  await h.tap(page, K.P);
  await h.tap(page, K.P);
  await page.clock.runFor(500);
  var play = await page.evaluate(pixels, { id: "playfield", x: 0, y: 600, w: 200, h: 200 });
  assert.strictEqual(play.alpha, 0, "the playfield canvas is see-through");
  var behind = await page.evaluate(pixels, { id: "sky", x: 160, y: 752, w: 200, h: 200 });
  assert.ok(behind.other > 0, "a star or nebula pixel shows behind the playfield");
  await h.seed(page, { lives: 1, ball: { x: 100, y: 600, vx: 0, vy: 720 } });
  await page.clock.runFor(1000);
  assert.strictEqual((await h.snap(page)).screen, "over");
  assert.strictEqual(await draws(page), 1, "never drawn again while playing");

  var stars = await page.evaluate(twinkles);
  assert.strictEqual(stars.length, 12, "twelve twinkling stars");
  stars.forEach(function (s, i) {
    assert.deepStrictEqual([s.count, s.state, s.iterations, s.props, s.text], [1, "running", Infinity, ["opacity"], ""],
      "star " + i + " runs an opacity animation");
    assert.ok(s.duration >= 2400 && s.duration <= 4800, "star " + i + " lasts " + s.duration);
  });
  assert.strictEqual(new Set(stars.map(function (s) { return s.duration; })).size, 12, "no two pulse together");
  assert.deepStrictEqual(page.errors, []);
  await page.close();

  var calm = await browser.newContext({ viewport: { width: 1920, height: 1080 }, reducedMotion: "reduce" });
  var still = await h.openPage(calm, url);
  var resting = await still.evaluate(twinkles);
  assert.strictEqual(resting.length, 12);
  resting.forEach(function (s, i) {
    assert.deepStrictEqual([s.count, s.opacity], [0, "0.6"], "star " + i + " rests at 0.6 with reduced motion");
  });
  assert.deepStrictEqual(still.errors, []);
  console.log("sky drive: ok");
}).catch(function (e) { console.error(e); process.exit(1); });
