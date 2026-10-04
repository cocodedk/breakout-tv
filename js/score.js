/* Breakout scoring: points per brick colour, the speed rule and the best score. No DOM. */
(function (BO) {
  "use strict";
  var POINTS = { R: 50, O: 40, Y: 30, G: 20, B: 10, S: 100 };
  var BASE_SPEED = 720;
  var LOOP_RISE = 1.1;
  var BRICKS_PER_RISE = 10;
  var BRICK_RISE = 1.05;
  var MAX_SPEED = 1200;

  function points(color) {
    return POINTS[color] || 0;
  }

  /* The level's start speed after `loop` complete rounds of all three levels. */
  function startSpeed(loop) {
    return BASE_SPEED * Math.pow(LOOP_RISE, loop);
  }

  /* The current speed: the start speed, up 5% for every 10 bricks broken in this level. */
  function speed(loop, broken) {
    var rises = Math.floor(broken / BRICKS_PER_RISE);
    return Math.min(MAX_SPEED, startSpeed(loop) * Math.pow(BRICK_RISE, rises));
  }

  /* The saved best score from its stored text; 0 means there is none. */
  function parseBest(raw) {
    var n = parseInt(raw, 10);
    return n > 0 ? n : 0;
  }

  /* The best score after a game ends: it changes only when the score is higher. */
  function submitBest(best, score) {
    return score > best ? { best: score, isNew: true } : { best: best, isNew: false };
  }

  BO.score = {
    POINTS: POINTS,
    MAX_SPEED: MAX_SPEED,
    points: points,
    startSpeed: startSpeed,
    speed: speed,
    parseBest: parseBest,
    submitBest: submitBest
  };
  if (typeof module !== "undefined" && module.exports) { module.exports = BO.score; }
})(typeof module !== "undefined" && module.exports ? require("./app.js") : window.BO);
