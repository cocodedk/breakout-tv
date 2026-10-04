/* Breakout scoring: points per brick colour, for the core and for a returned bolt, the speed rule and the best score.
   No DOM. */
(function (BO) {
  "use strict";
  var POINTS = { R: 50, O: 40, Y: 30, G: 20, B: 10, S: 100, L: 30, D: 20 };
  var CORE_POINTS = 500;
  var BOLT_POINTS = 1000;
  var BASE_SPEED = 720;
  var LOOP_RISE = 1.1;
  var BRICKS_PER_RISE = 20;
  var BRICK_RISE = 1.05;
  var MAX_SPEED = 1200;
  var MAX_SCORE = 999999999999;

  function points(color) {
    return POINTS[color] || 0;
  }

  /* The level's start speed after `loop` complete rounds of all four levels. */
  function startSpeed(loop) {
    return BASE_SPEED * Math.pow(LOOP_RISE, loop);
  }

  /* The current speed: the start speed, up 5% for every 20 bricks broken in this level. */
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

  /* The score times the lives left, never above MAX_SCORE. */
  function multiply(score, lives) {
    return Math.min(MAX_SCORE, score * lives);
  }

  /* A whole number with a comma every three digits, whatever the TV's language is set to. */
  function formatScore(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  BO.score = {
    POINTS: POINTS,
    CORE_POINTS: CORE_POINTS,
    BOLT_POINTS: BOLT_POINTS,
    MAX_SPEED: MAX_SPEED,
    MAX_SCORE: MAX_SCORE,
    multiply: multiply,
    formatScore: formatScore,
    points: points,
    startSpeed: startSpeed,
    speed: speed,
    parseBest: parseBest,
    submitBest: submitBest
  };
  if (typeof module !== "undefined" && module.exports) { module.exports = BO.score; }
})(typeof module !== "undefined" && module.exports ? require("./app.js") : window.BO);
