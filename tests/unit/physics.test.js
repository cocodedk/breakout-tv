"use strict";
var test = require("node:test");
var assert = require("node:assert");
var physics = require("../../js/physics.js");
var levels = require("../../js/levels.js");
var flying = require("./physics-helpers.js").flying;

var DT = 1 / 240;

function degrees(ball) {
  return Math.atan2(ball.vx, -ball.vy) * 180 / Math.PI;
}

function speedOf(ball) {
  return Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
}

test("the paddle starts in the middle with the ball on it, and the ball follows it", function () {
  var s = physics.newState([]);
  assert.strictEqual(s.paddleX, 680);
  assert.deepStrictEqual([s.ball.x, s.ball.y], [800, 804]);
  assert.deepStrictEqual(physics.step(s, DT, 1), []);
  assert.strictEqual(s.ball.x, s.paddleX + 120);
});

test("launch sends the ball 30 degrees right of straight up at the given speed", function () {
  var s = physics.newState([]);
  physics.launch(s, 720);
  assert.ok(Math.abs(degrees(s.ball) - 30) < 1e-9);
  assert.ok(Math.abs(speedOf(s.ball) - 720) < 1e-9);
  assert.strictEqual(s.serving, false);
});

test("the left wall reflects the ball", function () {
  var s = flying(13, 400, -300, 0);
  assert.deepStrictEqual(physics.step(s, DT, 0), ["wall"]);
  assert.ok(s.ball.vx > 0);
  assert.ok(s.ball.x >= 12);
});

test("the right wall reflects the ball", function () {
  var s = flying(1587, 400, 300, 0);
  assert.deepStrictEqual(physics.step(s, DT, 0), ["wall"]);
  assert.ok(s.ball.vx < 0);
  assert.ok(s.ball.x <= 1588);
});

test("the top wall reflects the ball", function () {
  var s = flying(800, 13, 0, -300);
  assert.deepStrictEqual(physics.step(s, DT, 0), ["wall"]);
  assert.ok(s.ball.vy > 0);
  assert.ok(s.ball.y >= 12);
});

test("the paddle bounce leaves at 60 degrees times the offset, keeping the speed", function () {
  [[-1, -60], [0, 0], [0.5, 30], [1, 60]].forEach(function (c) {
    var s = flying(800 + 120 * c[0], 803, 0, 720);
    var events = physics.step(s, DT, 0);
    assert.deepStrictEqual(events, ["paddle"], "offset " + c[0]);
    assert.ok(s.ball.vy < 0, "leaves upward");
    assert.ok(Math.abs(degrees(s.ball) - c[1]) < 1e-9, "offset " + c[0] + " gives " + degrees(s.ball));
    assert.ok(Math.abs(speedOf(s.ball) - 720) < 1e-9, "speed kept");
  });
});

test("a ball that hits the paddle's side while going down is not saved", function () {
  var s = flying(680 - 10, 830, 100, 300);
  var events = physics.step(s, DT, 0);
  assert.ok(events.indexOf("paddle") < 0);
  assert.ok(s.ball.vy > 0);
});

test("a ball whose circle misses the paddle's top corner is not saved", function () {
  var s = flying(669, 803, 0, 720);
  assert.ok(physics.step(s, DT, 0).indexOf("paddle") < 0);
  assert.ok(s.ball.vy > 0);
});

test("a ball past the bottom gives lost", function () {
  var s = flying(100, 895, 0, 300);
  assert.deepStrictEqual(physics.step(s, DT, 0), ["lost"]);
});

test("a ball above the bottom is not lost", function () {
  var s = flying(100, 700, 0, 300);
  assert.deepStrictEqual(physics.step(s, DT, 0), []);
});

test("a brick hit removes the brick, reflects the ball and scores its points", function () {
  var bricks = [levels.brick(0, 0, "R"), levels.brick(5, 0, "B")];
  var s = flying(96, 150, 0, -720, bricks);
  var events = physics.step(s, DT, 0);
  assert.deepStrictEqual(events, ["brick"]);
  assert.strictEqual(s.bricks.length, 1);
  assert.strictEqual(s.score, 50);
  assert.strictEqual(s.broken, 1);
  assert.ok(s.ball.vy > 0, "the ball turns back down");
});

test("a ball hitting a brick's side reflects sideways", function () {
  var bricks = [levels.brick(1, 0, "O"), levels.brick(5, 0, "B")];
  var s = flying(164 - 12 - 1, 130, 720, 0, bricks);
  assert.deepStrictEqual(physics.step(s, DT, 0), ["brick"]);
  assert.ok(s.ball.vx < 0);
  assert.strictEqual(s.ball.vy, 0);
});

test("a silver brick needs two hits", function () {
  var bricks = [levels.brick(0, 0, "S"), levels.brick(5, 0, "B")];
  var s = flying(96, 150, 0, -720, bricks);
  assert.deepStrictEqual(physics.step(s, DT, 0), ["brick"]);
  assert.strictEqual(s.bricks.length, 2, "still there after the first hit");
  assert.strictEqual(s.score, 0);
  s.ball.y = 150;
  s.ball.vy = -720;
  assert.deepStrictEqual(physics.step(s, DT, 0), ["brick"]);
  assert.strictEqual(s.bricks.length, 1);
  assert.strictEqual(s.score, 100);
});

test("at most one brick is hit per step", function () {
  var bricks = [levels.brick(0, 0, "R"), levels.brick(1, 0, "R"), levels.brick(8, 0, "R")];
  var s = flying(160, 150, 0, -720, bricks);
  physics.step(s, DT, 0);
  assert.strictEqual(s.bricks.length, 2);
  assert.strictEqual(s.broken, 1);
});

test("a ball at 1200 px/s aimed at a brick never passes through it", function () {
  [0, 0.25, 0.5, 0.75, 1].forEach(function (frac) {
    ["R", "S"].forEach(function (color) {
      var brick = levels.brick(4, 3, color);
      var bottom = brick.y + brick.h;
      var s = flying(brick.x + brick.w * frac, 700, 0, -1200, [brick, levels.brick(0, 0, "B")]);
      var hit = false;
      for (var i = 0; i < 480 && !hit; i++) {
        hit = physics.step(s, DT, 0).indexOf("brick") >= 0;
        if (!hit) { assert.ok(s.ball.y - 12 >= bottom, "the ball is still below the brick"); }
      }
      assert.ok(hit, "the ball hit the brick (" + color + ", " + frac + ")");
      assert.ok(s.ball.y >= bottom, "the ball did not pass the brick's far side");
      assert.ok(s.ball.vy > 0, "the ball turned back");
    });
  });
});

test("breaking the last brick gives no level-ending event", function () {
  var s = flying(96, 150, 0, -720, [levels.brick(0, 0, "G")]);
  assert.deepStrictEqual(physics.step(s, DT, 0), ["brick"]);
  assert.strictEqual(s.bricks.length, 0);
});

test("setSpeed keeps the direction", function () {
  var ball = { vx: 300, vy: -400 };
  physics.setSpeed(ball, 1000);
  assert.ok(Math.abs(ball.vx - 600) < 1e-9);
  assert.ok(Math.abs(ball.vy + 800) < 1e-9);
});
