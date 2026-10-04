"use strict";
var test = require("node:test");
var assert = require("node:assert");
var sky = require("../../js/sky.js");

/* A canvas context that records the fills, the gradients and the star discs. */
function recorder() {
  var ctx = { fills: [], gradients: [], discs: [], globalAlpha: 1 };
  ctx.fillRect = function (x, y, w, h) { ctx.fills.push({ style: ctx.fillStyle, rect: [x, y, w, h] }); };
  ctx.createRadialGradient = function (x0, y0, r0, x1, y1, r1) {
    var g = { from: [x0, y0, r0], to: [x1, y1, r1], stops: [] };
    g.addColorStop = function (at, color) { g.stops.push([at, color]); };
    ctx.gradients.push(g);
    return g;
  };
  ctx.beginPath = function () {};
  ctx.arc = function (x, y, r) { ctx.arcAt = [x, y, r]; };
  ctx.fill = function () {
    ctx.discs.push({ at: ctx.arcAt, color: ctx.fillStyle, alpha: ctx.globalAlpha });
  };
  return ctx;
}

test("there are 220 stars and the same list on every call", function () {
  var stars = sky.stars();
  assert.strictEqual(stars.length, 220);
  assert.deepStrictEqual(sky.stars(), stars);
});

test("every star lies inside the screen with a radius of 0.6 to 1.8 and an opacity of 0.3 to 1", function () {
  sky.stars().forEach(function (s, i) {
    assert.ok(s.x >= 0 && s.x <= 1920 && s.y >= 0 && s.y <= 1080, "star " + i + " is on screen");
    assert.ok(s.r >= 0.6 && s.r <= 1.8, "star " + i + " radius");
    assert.ok(s.opacity >= 0.3 && s.opacity <= 1, "star " + i + " opacity");
  });
});

test("every 10th star is pale blue, every 15th pale gold, a star that is both is blue, the rest white", function () {
  sky.stars().forEach(function (s, i) {
    var n = i + 1;
    var want = n % 10 === 0 ? "#cfe3ff" : n % 15 === 0 ? "#ffe9c4" : "#ffffff";
    assert.strictEqual(s.color, want, "star " + n);
  });
  assert.strictEqual(sky.stars()[29].color, "#cfe3ff");
  assert.strictEqual(sky.stars()[14].color, "#ffe9c4");
});

test("drawing fills the navy, then three nebula clouds, then 220 star discs, and counts one draw", function () {
  var ctx = recorder();
  var before = sky.draws();
  sky.draw(ctx);
  assert.strictEqual(sky.draws(), before + 1);
  assert.deepStrictEqual(ctx.fills[0], { style: "#070b1e", rect: [0, 0, 1920, 1080] });
  assert.deepStrictEqual(ctx.gradients.map(function (g) { return g.from.concat(g.to.slice(0, 2), g.to[2]); }), [
    [420, 260, 0, 420, 260, 520],
    [1500, 360, 0, 1500, 360, 600],
    [980, 900, 0, 980, 900, 480]
  ]);
  assert.deepStrictEqual(ctx.gradients.map(function (g) { return g.stops; }), [
    [[0, "rgba(124, 77, 255, 0.18)"], [1, "rgba(124, 77, 255, 0)"]],
    [[0, "rgba(90, 169, 255, 0.14)"], [1, "rgba(90, 169, 255, 0)"]],
    [[0, "rgba(255, 90, 200, 0.10)"], [1, "rgba(255, 90, 200, 0)"]]
  ]);
  assert.strictEqual(ctx.fills.length, 4, "the navy and one fill per cloud");
  assert.strictEqual(ctx.discs.length, 220);
  assert.strictEqual(ctx.globalAlpha, 1, "opacity is restored");
});
