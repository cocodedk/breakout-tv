/* Helpers the physics and core unit tests share. */
"use strict";
var physics = require("../../js/physics.js");

/* A state with the ball flying from (x, y) at (vx, vy) over the given bricks (none by default). */
function flying(x, y, vx, vy, bricks) {
  var s = physics.newState(bricks || []);
  s.serving = false;
  s.ball.x = x;
  s.ball.y = y;
  s.ball.vx = vx;
  s.ball.vy = vy;
  return s;
}

module.exports = { flying: flying };
