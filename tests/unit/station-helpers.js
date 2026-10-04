/* Helpers the station unit tests share. */
"use strict";
var physics = require("../../js/physics.js");
var station = require("../../js/station.js");

var STEP = 1 / 240;

/* Level 4 with the ball moving far from the station and the paddle in the middle (x 680 to 920). */
function level4() {
  var s = physics.newState([]);
  station.setup(s, 4);
  s.serving = false;
  s.ball.x = 100;
  s.ball.y = 600;
  return s;
}

function bolt(x, y, vx, vy, back) {
  return { x: x, y: y, vx: vx, vy: vy, back: !!back };
}

function speedOf(b) {
  return Math.sqrt(b.vx * b.vx + b.vy * b.vy);
}

module.exports = { STEP: STEP, level4: level4, bolt: bolt, speedOf: speedOf };
