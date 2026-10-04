/* Breakout core: the gold disc that slides behind the wall. Its motion and the contact test. No DOM. */
(function (BO) {
  "use strict";
  var Y = 60;
  var R = 28;
  var SPEED = 240;
  var MIN_X = 60;
  var MAX_X = 1540;
  var START_X = 800;

  /* A core in the middle of its strip, moving right: how every level starts. */
  function create() {
    return { x: START_X, dir: 1 };
  }

  /* Slides the core along its strip, turning back as soon as it reaches an end. */
  function move(core, dt) {
    core.x += core.dir * SPEED * dt;
    if (core.x >= MAX_X) { core.x = 2 * MAX_X - core.x; core.dir = -1; }
    if (core.x <= MIN_X) { core.x = 2 * MIN_X - core.x; core.dir = 1; }
  }

  /* True when a ball of radius r centred at (bx, by) touches the core's disc. The glow does not count. */
  function touches(core, bx, by, r) {
    var dx = bx - core.x;
    var dy = by - Y;
    var reach = r + R;
    return dx * dx + dy * dy <= reach * reach;
  }

  BO.core = { Y: Y, R: R, create: create, move: move, touches: touches };
  if (typeof module !== "undefined" && module.exports) { module.exports = BO.core; }
})(typeof module !== "undefined" && module.exports ? require("./app.js") : window.BO);
