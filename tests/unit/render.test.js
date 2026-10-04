"use strict";
var test = require("node:test");
var assert = require("node:assert");
var BO = require("../../js/app.js");
require("../../js/score.js");
require("../../js/levels.js");
require("../../js/core.js");
require("../../js/physics.js");
global.window = { BO: BO };
require("../../js/render.js");

/* A canvas context that records the fills: the colour, the opacity and the shape of each. */
function recorder() {
  var ctx = { fills: [], globalAlpha: 1, path: null };
  ctx.fillRect = function () {};
  ctx.beginPath = function () { ctx.path = { arcs: [], moves: [] }; };
  ctx.arc = function (x, y, r) { ctx.path.arcs.push([x, y, r]); };
  ctx.moveTo = function (x, y) { ctx.path.moves.push([x, y]); };
  ctx.arcTo = function () {};
  ctx.closePath = function () {};
  ctx.fill = function () {
    ctx.fills.push({ color: ctx.fillStyle, alpha: ctx.globalAlpha, arcs: ctx.path.arcs, moves: ctx.path.moves });
  };
  return ctx;
}

function discs(ctx) {
  return ctx.fills.filter(function (f) { return f.arcs.length > 0; });
}

/* What the HUD hands the renderer: how far the wall has dissolved, and whether the ball is hidden. */
function view(fade, ballHidden) {
  return { fade: fade || 0, ballHidden: !!ballHidden };
}

function state(bricks) {
  var s = BO.physics.newState(bricks);
  s.core.x = 500;
  s.ball.x = 300;
  s.ball.y = 400;
  return s;
}

test("the core is a glow of radius 44, a disc of radius 28 and an inner disc of radius 14", function () {
  var ctx = recorder();
  BO.render.draw(ctx, state([]), view());
  var found = discs(ctx).filter(function (f) { return f.arcs[0][0] === 500; });
  assert.deepStrictEqual(found.map(function (f) { return [f.color, f.arcs[0][1], f.arcs[0][2]]; }), [
    ["rgba(255, 212, 71, 0.25)", 60, 44],
    ["#ffd447", 60, 28],
    ["#fff1b0", 60, 14]
  ]);
});

test("a brick is drawn at full opacity and full height without a dissolve", function () {
  var ctx = recorder();
  var b = BO.levels.brick(0, 0, "R");
  BO.render.draw(ctx, state([b]), view());
  var f = ctx.fills.filter(function (x) { return x.color === BO.levels.COLORS.R; })[0];
  assert.strictEqual(f.alpha, 1);
  assert.deepStrictEqual(f.moves[0], [b.x + 6, b.y]);
});

test("a dissolving brick fades linearly and shrinks about its centre line", function () {
  [0.25, 0.5, 0.75].forEach(function (fade) {
    var ctx = recorder();
    var b = BO.levels.brick(0, 0, "R");
    BO.render.draw(ctx, state([b]), view(fade));
    var f = ctx.fills.filter(function (x) { return x.color === BO.levels.COLORS.R; })[0];
    var h = 20 * (1 - fade);
    assert.ok(Math.abs(f.alpha - (1 - fade)) < 1e-9, "opacity at " + fade);
    assert.ok(Math.abs(f.moves[0][1] - (b.y + 10 - h / 2)) < 1e-9, "top edge at " + fade);
  });
});

test("the opacity is set once for the whole wall and restored once after it", function () {
  var ctx = recorder();
  var sets = [];
  var alpha = 1;
  Object.defineProperty(ctx, "globalAlpha", { get: function () { return alpha; },
    set: function (v) { alpha = v; sets.push(v); } });
  BO.render.draw(ctx, state([BO.levels.brick(0, 0, "R"), BO.levels.brick(1, 0, "R")]), view(0.5));
  assert.deepStrictEqual(sets, [0.5, 1]);
});

test("a fully dissolved brick is not drawn, and opacity is restored", function () {
  var ctx = recorder();
  BO.render.draw(ctx, state([BO.levels.brick(0, 0, "R")]), view(1));
  assert.ok(!ctx.fills.some(function (x) { return x.color === BO.levels.COLORS.R; }));
  assert.strictEqual(ctx.globalAlpha, 1);
});

test("the ball is drawn unless it is hidden", function () {
  var shown = recorder();
  BO.render.draw(shown, state([]), view());
  assert.ok(discs(shown).some(function (f) { return f.color === "#ffffff" && f.arcs[0][2] === 12; }));
  var hidden = recorder();
  BO.render.draw(hidden, state([]), view(0.5, true));
  assert.ok(!discs(hidden).some(function (f) { return f.color === "#ffffff"; }));
});
