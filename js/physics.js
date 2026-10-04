/* Breakout physics: one fixed step of the paddle, the core, the ball, the walls and the bricks. No DOM.
   Positions are in playfield pixels, time in seconds. */
(function (BO) {
  "use strict";
  var W = 1600;
  var H = 880;
  var PADDLE_W = 240;
  var PADDLE_H = 24;
  var PADDLE_Y = 816;
  var PADDLE_START_SPEED = 900;
  var PADDLE_MAX_SPEED = 2400;
  var PADDLE_ACCEL = 6000;
  var R = 12;
  var LAUNCH_ANGLE = Math.PI / 6;
  var MAX_BOUNCE_ANGLE = Math.PI / 3;
  var score = BO.score || require("./score.js");
  var core = BO.core || require("./core.js");

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function follow(s) {
    s.ball.x = s.paddleX + PADDLE_W / 2;
    s.ball.y = PADDLE_Y - R;
  }

  /* Puts the paddle in the middle and the ball on it, ready to launch. */
  function serve(s) {
    s.paddleX = (W - PADDLE_W) / 2;
    s.serving = true;
    s.ball.vx = 0;
    s.ball.vy = 0;
    follow(s);
  }

  function newState(bricks) {
    var s = { paddleX: 0, paddleDir: 0, paddleRun: 0, ball: { x: 0, y: 0, vx: 0, vy: 0 }, bricks: bricks,
      score: 0, broken: 0, serving: true, core: core.create() };
    serve(s);
    return s;
  }

  /* Hitting the core scores, and the ball is not reflected: it flies on until the game hides it. */
  function hitCore(s, events) {
    if (!core.touches(s.core, s.ball.x, s.ball.y, R)) { return; }
    s.score += score.CORE_POINTS;
    events.push("core");
  }

  /* Sends the ball 30 degrees to the right of straight up. */
  function launch(s, speed) {
    s.serving = false;
    s.ball.vx = speed * Math.sin(LAUNCH_ANGLE);
    s.ball.vy = -speed * Math.cos(LAUNCH_ANGLE);
  }

  /* Changes how fast the ball flies, keeping its direction. */
  function setSpeed(ball, speed) {
    var now = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    if (now > 0) {
      ball.vx *= speed / now;
      ball.vy *= speed / now;
    }
  }

  function bounceWalls(ball) {
    var hit = false;
    if (ball.x - R < 0) { ball.x = R; ball.vx = Math.abs(ball.vx); hit = true; }
    if (ball.x + R > W) { ball.x = W - R; ball.vx = -Math.abs(ball.vx); hit = true; }
    if (ball.y - R < 0) { ball.y = R; ball.vy = Math.abs(ball.vy); hit = true; }
    return hit;
  }

  /* The ball must come down across the paddle's top: one already below it hit the side. */
  function bouncePaddle(s, prevBottom) {
    var ball = s.ball;
    var bottom = ball.y + R;
    var dx = ball.x - clamp(ball.x, s.paddleX, s.paddleX + PADDLE_W);
    var dy = ball.y - PADDLE_Y;
    var touches = dx * dx + dy * dy <= R * R;
    if (ball.vy <= 0 || prevBottom > PADDLE_Y || bottom < PADDLE_Y || !touches) { return false; }
    var offset = clamp((ball.x - (s.paddleX + PADDLE_W / 2)) / (PADDLE_W / 2), -1, 1);
    var speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    ball.y = PADDLE_Y - R;
    ball.vx = speed * Math.sin(MAX_BOUNCE_ANGLE * offset);
    ball.vy = -speed * Math.cos(MAX_BOUNCE_ANGLE * offset);
    return true;
  }

  /* The brick the ball touches, the nearest one when it touches several; -1 for none. */
  function touching(s) {
    var ball = s.ball;
    var found = -1;
    var nearest = R * R;
    for (var i = 0; i < s.bricks.length; i++) {
      var b = s.bricks[i];
      var dx = ball.x - clamp(ball.x, b.x, b.x + b.w);
      var dy = ball.y - clamp(ball.y, b.y, b.y + b.h);
      var d = dx * dx + dy * dy;
      if (d < nearest) { nearest = d; found = i; }
    }
    return found;
  }

  /* Reflects the ball on the axis of the smaller overlap, pushing it out of the brick. */
  function reflect(ball, b) {
    var cx = b.x + b.w / 2;
    var cy = b.y + b.h / 2;
    var overlapX = R + b.w / 2 - Math.abs(ball.x - cx);
    var overlapY = R + b.h / 2 - Math.abs(ball.y - cy);
    if (overlapX < overlapY) {
      var sx = ball.x < cx ? -1 : 1;
      ball.x += sx * overlapX;
      ball.vx = sx * Math.abs(ball.vx);
    } else {
      var sy = ball.y < cy ? -1 : 1;
      ball.y += sy * overlapY;
      ball.vy = sy * Math.abs(ball.vy);
    }
  }

  /* At most one brick is hit per step. Returns the events it caused. */
  function hitBrick(s, events) {
    var i = touching(s);
    if (i < 0) { return; }
    var b = s.bricks[i];
    reflect(s.ball, b);
    b.hits -= 1;
    events.push("brick");
    if (b.hits > 0) { return; }
    s.bricks.splice(i, 1);
    s.score += b.points;
    s.broken += 1;
  }

  /* Moves the paddle for dt seconds. A held direction starts at 900 px/s and speeds up to 2400 px/s
     over a quarter of a second; letting go or turning round starts the climb again. */
  function movePaddle(s, dt, dir) {
    if (dir !== s.paddleDir) {
      s.paddleDir = dir;
      s.paddleRun = 0;
    }
    if (dir === 0) { return; }
    var speed = Math.min(PADDLE_MAX_SPEED, PADDLE_START_SPEED + PADDLE_ACCEL * s.paddleRun);
    s.paddleX = clamp(s.paddleX + dir * speed * dt, 0, W - PADDLE_W);
    s.paddleRun += dt;
  }

  /* Moves the paddle (dir is -1, 0 or 1), the core and the ball by dt seconds. Returns the events,
     in order: "wall", "paddle", "brick", "core", "lost". */
  function step(s, dt, dir) {
    var events = [];
    var ball = s.ball;
    movePaddle(s, dt, dir);
    core.move(s.core, dt);
    if (s.serving) {
      follow(s);
      return events;
    }
    var prevBottom = ball.y + R;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    if (bounceWalls(ball)) { events.push("wall"); }
    if (bouncePaddle(s, prevBottom)) { events.push("paddle"); }
    hitBrick(s, events);
    hitCore(s, events);
    if (ball.y - R > H) { events.push("lost"); }
    return events;
  }

  BO.physics = {
    W: W,
    H: H,
    PADDLE_W: PADDLE_W,
    PADDLE_H: PADDLE_H,
    PADDLE_Y: PADDLE_Y,
    BALL_R: R,
    newState: newState,
    serve: serve,
    launch: launch,
    setSpeed: setSpeed,
    step: step
  };
  if (typeof module !== "undefined" && module.exports) { module.exports = BO.physics; }
})(typeof module !== "undefined" && module.exports ? require("./app.js") : window.BO);
