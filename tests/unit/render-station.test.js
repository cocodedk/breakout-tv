"use strict";
var test = require("node:test");
var assert = require("node:assert");
var BO = require("../../js/app.js");
require("../../js/score.js");
require("../../js/levels.js");
require("../../js/core.js");
require("../../js/physics.js");
require("../../js/station.js");
global.window = { BO: BO };
require("../../js/render.js");
require("../../js/render-station.js");

/* A canvas context that records, in order, every save, restore, clip, move, turn and fill. */
function recorder() {
  var ctx = { ops: [], path: null };
  ["save", "restore", "clearRect", "arcTo", "closePath"].forEach(function (name) {
    ctx[name] = function () { if (name === "save" || name === "restore") { ctx.ops.push([name]); } };
  });
  ctx.beginPath = function () { ctx.path = { arcs: [], moves: [] }; };
  ctx.arc = function (x, y, r, from, to) { ctx.path.arcs.push([x, y, r, from, to]); };
  ctx.ellipse = function () {};
  ctx.moveTo = function (x, y) { ctx.path.moves.push([x, y]); };
  ctx.clip = function () { ctx.ops.push(["clip", ctx.path.arcs]); };
  ctx.translate = function (x, y) { ctx.ops.push(["translate", x, y]); };
  ctx.rotate = function (a) { ctx.ops.push(["rotate", a]); };
  ctx.fillRect = function (x, y, w, h) { ctx.ops.push(["rect", ctx.fillStyle, [x, y, w, h]]); };
  ctx.fill = function () { ctx.ops.push(["fill", ctx.fillStyle, ctx.path.arcs, ctx.path.moves]); };
  return ctx;
}

var VIEW = { fade: 0, ballHidden: true, hue: 0 };

/* A level 4 state with the ball hidden and no bricks, so only the station and the paddle are drawn. */
function level4(charging) {
  var s = BO.physics.newState([]);
  BO.station.setup(s, 4);
  s.serving = !charging;
  s.fireIn = charging ? 0.4 : 2;
  return s;
}

function draw(s) {
  var ctx = recorder();
  BO.render.draw(ctx, s, VIEW);
  return ctx.ops;
}

var FULL = [800, 140, 100, 0, 2 * Math.PI];

function disc(x, y, r) { return [[x, y, r, 0, 2 * Math.PI]]; }

test("the station is a rimmed hull, then shading, trench, lines and panels inside one clip, then the dish", function () {
  var ops = draw(level4(false));
  assert.deepStrictEqual(ops.slice(0, 12), [
    ["fill", "#c9d0dd", [FULL], []],
    ["fill", "#8a93a6", disc(802, 142, 98), []],
    ["save"],
    ["clip", [FULL]],
    ["fill", "rgba(0, 0, 0, 0.11)", disc(830, 170, 100), []],
    ["fill", "rgba(0, 0, 0, 0.11)", disc(855, 195, 100), []],
    ["fill", "rgba(0, 0, 0, 0.11)", disc(880, 220, 100), []],
    ["rect", "#3b4152", [700, 135, 200, 10]],
    ["rect", "rgba(255, 255, 255, 0.16)", [700, 145, 200, 2]],
    ["rect", "#5b6378", [700, 94, 200, 2]],
    ["rect", "#5b6378", [700, 184, 200, 2]],
    ["rect", "#5b6378", [700, 214, 200, 2]]
  ]);
  var panels = ops.slice(12, 26);
  assert.ok(panels.every(function (o) { return o[0] === "rect" && /^#(7a8397|9ca5b7)$/.test(o[1]); }), "14 panels");
  assert.deepStrictEqual(ops.slice(26, 31), [
    ["restore"],
    ["fill", "#5b6378", disc(840, 100, 26), []],
    ["fill", "#454c5e", disc(840, 100, 17), []],
    ["fill", "#6f788c", disc(842, 102, 15), []],
    ["fill", "#3b4152", disc(840, 100, 3), []]
  ]);
  assert.strictEqual(ops.filter(function (o) { return o[0] === "clip"; }).length, 1, "one clip only");
});

test("the whole station, dish and glow included, moves with its centre", function () {
  [false, true].forEach(function (charging) {
    var at800 = JSON.stringify(draw(level4(charging)));
    var s = level4(charging);
    s.station.x = 500;
    var at500 = draw(s);
    var moved = JSON.stringify(at500);
    assert.notStrictEqual(moved, at800);
    assert.ok(moved.indexOf("[540,100,26,0,6.283185307179586]") > 0, "the dish is 40 right and 40 above the centre");
    assert.strictEqual(at500.filter(function (o) { return o[0] === "clip"; })[0][1][0][0], 500);
  });
});

test("the green dot shows in the dish only while charging", function () {
  var dot = ["fill", "#4be38e", disc(840, 100, 6), []];
  assert.deepStrictEqual(draw(level4(true))[32], dot);
  assert.ok(!draw(level4(false)).some(function (o) { return o[1] === "#4be38e"; }), "not in Serve");
  var s = level4(true);
  s.fireIn = 0.6;
  assert.ok(!draw(s).some(function (o) { return o[1] === "#4be38e"; }), "not before the last half second");
});

test("levels 1 to 3 draw no station and no UFO is drawn on level 4", function () {
  var s = BO.physics.newState([]);
  BO.station.setup(s, 1);
  var ops = draw(s);
  assert.ok(!ops.some(function (o) { return o[0] === "clip" || o[1] === "#8a93a6"; }));
  assert.ok(ops.some(function (o) { return o[1] === "hsl(0, 90%, 60%)"; }), "the UFO is there");
  assert.ok(!draw(level4(false)).some(function (o) { return /^hsl/.test(o[1]); }), "no UFO on level 4");
});

test("bolts are rounded 6x28 bars, green going down and gold coming back", function () {
  var s = level4(false);
  s.bolts = [{ x: 300, y: 400, vx: 0, vy: 600, back: false }, { x: 500, y: 600, vx: 0, vy: -900, back: true }];
  var ops = draw(s).filter(function (o) { return o[0] === "translate" || o[1] === "#4be38e" || o[1] === "#ffd447"; });
  assert.deepStrictEqual(ops[0], ["translate", 300, 400]);
  assert.deepStrictEqual(ops[1].slice(0, 3), ["fill", "#4be38e", []]);
  assert.deepStrictEqual(ops[1][3], [[0, -14]], "a 6x28 bar with corners of radius 3");
  assert.deepStrictEqual(ops[2], ["translate", 500, 600]);
  assert.deepStrictEqual(ops[3].slice(0, 3), ["fill", "#ffd447", []]);
});

test("a bolt lies along its direction of travel", function () {
  var s = level4(false);
  s.bolts = [{ x: 300, y: 400, vx: 300, vy: 400, back: false }];
  var angle = draw(s).filter(function (o) { return o[0] === "rotate"; })[0][1];
  assert.ok(Math.abs(-Math.sin(angle) - 0.6) < 1e-9 && Math.abs(Math.cos(angle) - 0.8) < 1e-9);
});
