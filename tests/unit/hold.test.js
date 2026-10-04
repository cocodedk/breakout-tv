"use strict";
var test = require("node:test");
var assert = require("node:assert");
var hold = require("../../js/hold.js");

var LEFT = 37;
var RIGHT = 39;

test("nothing is held at first", function () {
  assert.strictEqual(hold.create().dir(0), 0);
});

test("keydown starts a move and keyup ends it", function () {
  var h = hold.create();
  h.down(RIGHT, 1, 0);
  assert.strictEqual(h.dir(100), 1);
  h.up(RIGHT);
  assert.strictEqual(h.dir(200), 0);
});

test("auto-repeat keydowns change nothing", function () {
  var h = hold.create();
  h.down(LEFT, -1, 0);
  h.down(LEFT, -1, 30);
  h.down(LEFT, -1, 60);
  assert.strictEqual(h.dir(70), -1);
  h.up(LEFT);
  assert.strictEqual(h.dir(80), 0, "one keyup ends it however many keydowns came");
});

test("the direction pressed last wins, and releasing it falls back to the other", function () {
  var h = hold.create();
  h.down(LEFT, -1, 0);
  h.down(RIGHT, 1, 10);
  assert.strictEqual(h.dir(20), 1);
  h.down(LEFT, -1, 30);
  assert.strictEqual(h.dir(40), 1, "a repeat of the earlier key does not take over");
  h.up(RIGHT);
  assert.strictEqual(h.dir(50), -1);
  h.up(LEFT);
  assert.strictEqual(h.dir(60), 0);
});

test("two keys for one direction: the move lasts while either is held", function () {
  var h = hold.create();
  h.down(LEFT, -1, 0);
  h.down(65, -1, 5);
  h.up(65);
  assert.strictEqual(h.dir(10), -1);
});

test("before any keyup, a move ends 600 ms after its last keydown", function () {
  var h = hold.create();
  h.down(RIGHT, 1, 1000);
  assert.strictEqual(h.dir(1599), 1);
  assert.strictEqual(h.dir(1600), 0);
  assert.strictEqual(h.dir(2000), 0);
});

test("a repeated keydown renews the 600 ms", function () {
  var h = hold.create();
  h.down(RIGHT, 1, 0);
  h.down(RIGHT, 1, 500);
  assert.strictEqual(h.dir(1000), 1);
  assert.strictEqual(h.dir(1100), 0);
});

test("after a keyup has been seen, a move does not time out", function () {
  var h = hold.create();
  h.down(LEFT, -1, 0);
  h.up(LEFT);
  h.down(RIGHT, 1, 100);
  assert.strictEqual(h.dir(5000), 1);
  h.up(RIGHT);
  assert.strictEqual(h.dir(5001), 0);
});

test("release lets go of every key", function () {
  var h = hold.create();
  h.down(LEFT, -1, 0);
  h.down(RIGHT, 1, 0);
  h.release();
  assert.strictEqual(h.dir(10), 0);
});
