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

test("the core moves while serving too, and turns back at 1540 and at 60", function () {
  var s = physics.newState([]);
  s.core.x = 1539;
  for (var i = 0; i < 5; i++) { physics.step(s, DT, 0); }
  assert.strictEqual(s.core.dir, -1);
  assert.ok(s.core.x <= 1540 && s.core.x > 1530);
  s.core.x = 61;
  for (i = 0; i < 5; i++) { physics.step(s, DT, 0); }
  assert.strictEqual(s.core.dir, 1);
  assert.ok(s.core.x >= 60 && s.core.x < 70);
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

test("a ball that only moves away from the core during a step is not a hit", function () {
  var s = flying(840.5, 60, 623.5382907247958, -360);
  assert.deepStrictEqual(physics.step(s, DT, 0), []);
  assert.strictEqual(s.score, 0);
});

test("a new core is at x 800 moving right, which is how a level starts", function () {
  assert.deepStrictEqual(core.create(), { x: 800, dir: 1 });
});

test("serving a new ball does not move the core back", function () {
  var s = physics.newState([]);
  s.core.x = 300;
  s.core.dir = -1;
  physics.serve(s);
  assert.deepStrictEqual(s.core, { x: 300, dir: -1 });
});

test("a ball touching the core's disc gives core and scores 500, and is not reflected", function () {
  var s = flying(800, 100, 0, -240);
  assert.deepStrictEqual(physics.step(s, DT, 0), ["core"]);
  assert.strictEqual(s.score, 500);
  assert.deepStrictEqual([s.ball.vx, s.ball.vy], [0, -240]);
});

test("a ball that only reaches the core's glow gives nothing", function () {
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
  s.ball.y = 100;
  s.ball.vx = 0;
  s.ball.vy = -240;
  assert.deepStrictEqual(physics.step(s, DT, 0), ["core"]);
});
