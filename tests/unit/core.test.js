"use strict";
var test = require("node:test");
var assert = require("node:assert");
var physics = require("../../js/physics.js");
var core = require("../../js/core.js");
var flying = require("./physics-helpers.js").flying;

var DT = 1 / 240;

test("the core starts at x 800 moving right and slides 240 px/s", function () {
  var s = physics.newState([]);
  assert.deepStrictEqual(s.core, { x: 800, dir: 1 });
  for (var i = 0; i < 240; i++) { physics.step(s, DT, 0); }
  assert.ok(Math.abs(s.core.x - 1040) < 1e-6);
  assert.strictEqual(s.core.dir, 1);
});

test("the core turns the moment it reaches an end", function () {
  var s = physics.newState([]);
  s.core.x = 1539;
  physics.step(s, DT, 0);
  assert.deepStrictEqual([s.core.x, s.core.dir], [1540, -1]);
  s.core.x = 61;
  s.core.dir = -1;
  physics.step(s, DT, 0);
  assert.deepStrictEqual([s.core.x, s.core.dir], [60, 1]);
});

test("a ball that only moves away from the UFO during a step is not a hit", function () {
  var s = flying(856, 60, 720, 0);
  assert.deepStrictEqual(physics.step(s, DT, 0), []);
  assert.strictEqual(s.score, 0);
});

test("serving a new ball does not move the core back", function () {
  var s = physics.newState([]);
  s.core.x = 300;
  s.core.dir = -1;
  physics.serve(s);
  assert.deepStrictEqual(s.core, { x: 300, dir: -1 });
});

test("a ball touching the UFO gives core and scores 500, and is not reflected", function () {
  var s = flying(800, 85, 0, -240);
  assert.deepStrictEqual(physics.step(s, DT, 0), ["core"]);
  assert.strictEqual(s.score, 500);
  assert.deepStrictEqual([s.ball.vx, s.ball.vy], [0, -240]);
});

/* The UFO is the box x 756 to 844, y 38 to 76; core.move shifts it, so the test calls touches directly. */
test("a ball touching the box's left end, right end, top or bottom is a hit", function () {
  var c = { x: 800, dir: 1 };
  [[744, 60], [856, 60], [800, 26], [800, 88], [744, 38], [856, 76]].forEach(function (p) {
    assert.ok(core.touches(c, p[0], p[1], 12), p.join(", "));
  });
});

test("a ball 13px from the box on any side is not a hit", function () {
  var c = { x: 800, dir: 1 };
  [[743, 60], [857, 60], [800, 25], [800, 89]].forEach(function (p) {
    assert.ok(!core.touches(c, p[0], p[1], 12), p.join(", "));
  });
});

test("a ball inside the glow but off the box gives nothing", function () {
  var c = { x: 800, dir: 1 };
  assert.ok(!core.touches(c, 858, 60, 12), "the glow reaches x 860 at its middle line");
  assert.ok(!core.touches(c, 742, 60, 12));
  var s = flying(800, 112, 0, 0);
  assert.deepStrictEqual(physics.step(s, DT, 0), []);
  assert.strictEqual(s.score, 0);
});

test("a ball flying on with no bricks left ends nothing until it reaches the core", function () {
  var s = flying(200, 500, 720, 0);
  for (var i = 0; i < 480; i++) {
    var events = physics.step(s, DT, 0);
    assert.ok(events.indexOf("core") < 0 && events.indexOf("lost") < 0);
  }
  s.ball.x = s.core.x;
  s.ball.y = 85;
  s.ball.vx = 0;
  s.ball.vy = -240;
  assert.deepStrictEqual(physics.step(s, DT, 0), ["core"]);
});
