/* Breakout core: the gold disc that slides behind the wall. Its motion and the contact test. No DOM. */
(function (BO) {
  "use strict";
  var Y = 60;
  var R = 28;
  var SPEED = 240;
  var MIN_X = 60;
  var MAX_X = 1540;
  var START_X = 800;

  function create() {
    return { x: START_X, dir: 1 };
  }

  /* The core back at the middle of its strip, moving right: the start of a level. */
  function reset(core) {
    core.x = START_X;
    core.dir = 1;
  }

  /* Slides the core along its strip, turning back as soon as it reaches an end. */
  function move(core, dt) {
    core.x += core.dir * SPEED * dt;
    if (core.x >= MAX_X) { core.x = 2 * MAX_X - core.x; core.dir = -1; }
    if (core.x <= MIN_X) { core.x = 2 * MIN_X - core.x; core.dir = 1; }
  }

  /* True when a ball of radius r, moving in a straight line from (x0, y0) to (x1, y1) while the core
     slides from centre x cx0 to core.x, touches the core's disc at any moment of the step. The glow
     does not count. Seen from the core, the ball also moves in a straight line. */
  function touches(core, cx0, x0, y0, x1, y1, r) {
    var ax = x0 - cx0;
    var ay = y0 - Y;
    var vx = x1 - core.x - ax;
    var vy = y1 - Y - ay;
    var len2 = vx * vx + vy * vy;
    var t = len2 > 0 ? -(ax * vx + ay * vy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    var dx = ax + t * vx;
    var dy = ay + t * vy;
    var reach = r + R;
    return dx * dx + dy * dy <= reach * reach;
  }

  BO.core = { Y: Y, R: R, create: create, reset: reset, move: move, touches: touches };
  if (typeof module !== "undefined" && module.exports) { module.exports = BO.core; }
})(typeof module !== "undefined" && module.exports ? require("./app.js") : window.BO);
