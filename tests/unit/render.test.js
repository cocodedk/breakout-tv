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
  ctx.beginPath = function () { ctx.path = { arcs: [], ellipses: [], moves: [] }; };
  ctx.arc = function (x, y, r, from, to) { ctx.path.arcs.push([x, y, r, from, to]); };
  ctx.ellipse = function (x, y, rx, ry) { ctx.path.ellipses.push([x, y, rx, ry]); };
  ctx.moveTo = function (x, y) { ctx.path.moves.push([x, y]); };
  ctx.arcTo = function () {};
  ctx.closePath = function () {};
  ctx.fill = function () {
    ctx.fills.push({ color: ctx.fillStyle, alpha: ctx.globalAlpha, arcs: ctx.path.arcs,
      ellipses: ctx.path.ellipses, moves: ctx.path.moves });
  };
  return ctx;
}

function discs(ctx) {
  return ctx.fills.filter(function (f) { return f.arcs.length > 0; });
}

/* What the HUD hands the renderer: how far the wall has dissolved, whether the ball is hidden, the UFO's hue. */
function view(fade, ballHidden, hue) {
  return { fade: fade || 0, ballHidden: !!ballHidden, hue: hue || 0 };
}

function state(bricks) {
  var s = BO.physics.newState(bricks);
  s.core.x = 500;
  s.ball.x = 300;
  s.ball.y = 400;
  return s;
}

/* The fills of the UFO, in drawing order: everything centred within 60px of x 500 and above y 100. */
function ufo(ctx) {
  return ctx.fills.filter(function (f) {
    var p = f.ellipses.concat(f.arcs)[0];
    return p && Math.abs(p[0] - 500) <= 60 && p[1] < 100;
  });
}

test("the UFO is a glow, a hull, a dome and five lights, drawn in that order", function () {
  var ctx = recorder();
  BO.render.draw(ctx, state([]), view(0, false, 0));
  var f = ufo(ctx);
  assert.strictEqual(f.length, 8);
  assert.deepStrictEqual([f[0].color, f[0].ellipses], ["hsla(0, 90%, 60%, 0.25)", [[500, 60, 60, 26]]]);
  assert.deepStrictEqual([f[1].color, f[1].ellipses], ["hsl(0, 90%, 60%)", [[500, 64, 44, 12]]]);
  assert.deepStrictEqual([f[2].color, f[2].arcs], ["rgba(200, 240, 255, 0.85)", [[500, 56, 18, Math.PI, 2 * Math.PI]]]);
  [-30, -15, 0, 15, 30].forEach(function (dx, i) {
    assert.deepStrictEqual(f[3 + i].arcs, [[500 + dx, 66, 4, 0, 2 * Math.PI]], "light " + i);
    assert.strictEqual(f[3 + i].color, "hsl(" + 72 * i + ", 90%, 60%)");
  });
});

test("the lights' hues run on from the hull's and wrap past 360", function () {
  var ctx = recorder();
  BO.render.draw(ctx, state([]), view(0, false, 300));
  var f = ufo(ctx);
  assert.strictEqual(f[1].color, "hsl(300, 90%, 60%)");
  assert.strictEqual(f[4].color, "hsl(12, 90%, 60%)");
  assert.strictEqual(f[5].color, "hsl(84, 90%, 60%)");
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
