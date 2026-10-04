"use strict";
var test = require("node:test");
var assert = require("node:assert");
var physics = require("../../js/physics.js");

var DT = 1 / 240;

/* Steps the state n times in direction dir and returns how far the paddle moved on each step. */
function run(s, n, dir) {
  var moves = [];
  for (var i = 0; i < n; i++) {
    var before = s.paddleX;
    physics.step(s, DT, dir);
    moves.push(s.paddleX - before);
  }
  return moves;
}

function close(actual, expected, what) {
  assert.ok(Math.abs(actual - expected) < 1e-6, what + ": " + actual + " should be " + expected);
}

test("the paddle starts still, with no run behind it", function () {
  var s = physics.newState([]);
  assert.deepStrictEqual([s.paddleDir, s.paddleRun], [0, 0]);
});

test("the first step of a held key moves the paddle 900 px/s times dt", function () {
  var s = physics.newState([]);
  physics.step(s, DT, 1);
  close(s.paddleX, 680 + 900 * DT, "right");
  s = physics.newState([]);
  physics.step(s, DT, -1);
  close(s.paddleX, 680 - 900 * DT, "left");
});

test("the speed climbs 6000 px/s every second to 2400 px/s after 0.25 s, and stays there", function () {
  var s = physics.newState([]);
  s.paddleX = 0;
  var moves = run(s, 120, 1);
  for (var i = 0; i < 60; i++) { close(moves[i] * 240, 900 + 6000 * i * DT, "speed at step " + i); }
  for (i = 60; i < 120; i++) { close(moves[i] * 240, 2400, "speed at step " + i); }
  var first = moves.slice(0, 60).reduce(function (a, b) { return a + b; }, 0);
  close(first, 409.375, "distance in the first 0.25 s");
  close(s.paddleX, 409.375 + 60 * 2400 * DT, "distance after 0.5 s");
});

test("letting go resets the climb", function () {
  var s = physics.newState([]);
  run(s, 60, 1);
  var parked = s.paddleX;
  assert.deepStrictEqual(run(s, 3, 0), [0, 0, 0]);
  assert.strictEqual(s.paddleX, parked);
  assert.deepStrictEqual([s.paddleDir, s.paddleRun], [0, 0]);
  close(run(s, 1, 1)[0], 900 * DT, "the next press starts slow again");
});

test("turning round resets the climb", function () {
  var s = physics.newState([]);
  run(s, 60, 1);
  close(run(s, 1, 1)[0], 2400 * DT, "still at full speed going right");
  close(run(s, 1, -1)[0], -900 * DT, "the first step left");
  close(run(s, 1, -1)[0], -(900 + 6000 * DT) * DT, "the second step left");
  assert.strictEqual(s.paddleDir, -1);
});

test("the paddle stays inside the playfield", function () {
  var s = physics.newState([]);
  run(s, 600, 1);
  assert.strictEqual(s.paddleX, 1360);
  run(s, 60, 1);
  assert.strictEqual(s.paddleX, 1360);
  run(s, 960, -1);
  assert.strictEqual(s.paddleX, 0);
  run(s, 60, -1);
  assert.strictEqual(s.paddleX, 0);
});
