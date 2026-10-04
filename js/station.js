/* Breakout station: the battle station of level 4 that stands in for the UFO, its firing timer and the
   bolts it sends at the paddle. One step moves the bolts, bats them back and scores. No DOM. */
(function (BO) {
  "use strict";
  var physics = BO.physics || require("./physics.js");
  var core = BO.core || require("./core.js");
  var score = BO.score || require("./score.js");
  var BOSS_LEVEL = 4;
  var X = 800;
  var Y = 140;
  var R = 100;
  var DISH_X = 840;
  var DISH_Y = 100;
  var FIRST_SHOT = 2;
  var SHOT_EVERY = 3;
  var CHARGE = 0.5;
  var MAX_BOLTS = 2;
  var BOLT_SPEED = 600;
  var BACK_SPEED = 900;
  var BOLT_W = 6;
  var BOLT_H = 28;
  var EPSILON = 1e-9;

  /* A level's boss or UFO: level 4 has the station and no UFO, the others the UFO; no bolts, the
     first shot 2 s away. */
  function setup(s, level) {
    var boss = level === BOSS_LEVEL;
    s.core = boss ? null : core.create();
    s.station = boss ? { x: X, y: Y, r: R } : null;
    s.bolts = [];
    s.fireIn = FIRST_SHOT;
  }

  /* The ball was launched: the first shot comes 2 s from now. */
  function arm(s) {
    s.fireIn = FIRST_SHOT;
  }

  /* True during the half second before each shot. */
  function charging(s) {
    return !!s.station && !s.serving && s.fireIn <= CHARGE;
  }

  /* True when a circle of radius r centred at (x, y) touches the station's disc. */
  function touches(station, x, y, r) {
    var dx = x - station.x;
    var dy = y - station.y;
    return dx * dx + dy * dy <= (station.r + r) * (station.r + r);
  }

  /* A green bolt leaves the dish's centre at 600 px/s, aimed at the paddle's centre at its top. */
  function fire(s) {
    var dx = s.paddleX + physics.PADDLE_W / 2 - DISH_X;
    var dy = physics.PADDLE_Y - DISH_Y;
    var length = Math.sqrt(dx * dx + dy * dy);
    s.bolts.push({ x: DISH_X, y: DISH_Y, vx: BOLT_SPEED * dx / length, vy: BOLT_SPEED * dy / length, back: false });
  }

  /* Counts down to the next shot while Moving; a shot due with 2 bolts in the air is skipped. */
  function countdown(s, dt, events) {
    if (s.serving) { return; }
    s.fireIn -= dt;
    if (s.fireIn > EPSILON) { return; }
    s.fireIn += SHOT_EVERY;
    if (s.bolts.length < MAX_BOLTS) {
      fire(s);
      events.push("fire");
    }
  }

  /* The bolt's 6x28 box overlaps the paddle's box. */
  function onPaddle(s, b) {
    return b.x + BOLT_W / 2 > s.paddleX && b.x - BOLT_W / 2 < s.paddleX + physics.PADDLE_W &&
      b.y + BOLT_H / 2 > physics.PADDLE_Y && b.y - BOLT_H / 2 < physics.PADDLE_Y + physics.PADDLE_H;
  }

  function outside(b) {
    return b.x < 0 || b.x > physics.W || b.y < 0 || b.y > physics.H;
  }

  /* Moves every bolt. A green one meeting the paddle turns gold and flies up at the ball's angle for that
     point of the paddle; a gold one reaching the station scores. A bolt leaving the playfield is gone. */
  function moveBolts(s, dt, events) {
    s.bolts = s.bolts.filter(function (b) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.back) {
        if (touches(s.station, b.x, b.y, 0)) {
          s.score += score.BOLT_POINTS;
          events.push("station-hit");
          return false;
        }
      } else if (onPaddle(s, b)) {
        var v = physics.leave(s, b.x, BACK_SPEED);
        b.vx = v.vx;
        b.vy = v.vy;
        b.back = true;
        events.push("reflect");
      }
      return !outside(b);
    });
  }

  /* One step after the physics step. The ball touching the station scores and ends the level: every
     bolt goes. Returns the events, in order: "core", "station-hit", "reflect", "fire". */
  function step(s, dt) {
    var events = [];
    if (!s.station) { return events; }
    if (!s.serving && touches(s.station, s.ball.x, s.ball.y, physics.BALL_R)) {
      s.score += score.CORE_POINTS;
      s.bolts = [];
      s.fireIn = FIRST_SHOT;
      events.push("core");
      return events;
    }
    moveBolts(s, dt, events);
    countdown(s, dt, events);
    return events;
  }

  BO.station = {
    X: X, Y: Y, R: R, DISH_X: DISH_X, DISH_Y: DISH_Y, BOLT_W: BOLT_W, BOLT_H: BOLT_H,
    FIRST_SHOT: FIRST_SHOT, SHOT_EVERY: SHOT_EVERY,
    setup: setup, arm: arm, charging: charging, touches: touches, step: step
  };
  if (typeof module !== "undefined" && module.exports) { module.exports = BO.station; }
})(typeof module !== "undefined" && module.exports ? require("./app.js") : window.BO);
