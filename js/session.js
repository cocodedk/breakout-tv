/* Breakout session: the state of the game being played, with the snapshot and the seeding the
   drives use. The rules that change it live in game.js. */
(function (BO) {
  "use strict";
  var START_LIVES = 3;

  var g = {
    START_LIVES: START_LIVES,
    s: BO.physics.newState([]),
    best: 0,
    lives: START_LIVES,
    level: 1,
    loop: 0,
    speed: BO.score.startSpeed(0),
    state: "serve",
    bannerLeft: 0
  };

  g.snapshot = function () {
    var b = g.s.ball;
    var playing = BO.screens.current() === "play";
    return {
      screen: BO.screens.current(),
      state: playing ? g.state : null,
      dialog: BO.screens.dialog(),
      score: g.s.score,
      lives: g.lives,
      level: g.level,
      loop: g.loop,
      paddleX: g.s.paddleX,
      ball: { x: b.x, y: b.y, vx: b.vx, vy: b.vy },
      bricksLeft: g.s.bricks.length
    };
  };

  /* Sets up a game for the drives: any of score, lives, level, loop, bricks [{col, row, color}]
     and ball {x, y, vx, vy} (which sends the ball flying). */
  g.seed = function (p) {
    if (p.score !== undefined) { g.s.score = p.score; }
    if (p.lives !== undefined) { g.lives = p.lives; }
    if (p.level !== undefined) { g.level = p.level; }
    if (p.loop !== undefined) { g.loop = p.loop; }
    if (p.bricks) {
      g.s.bricks = p.bricks.map(function (b) { return BO.levels.brick(b.col, b.row, b.color); });
    }
    if (p.ball) {
      Object.assign(g.s.ball, p.ball);
      g.s.serving = false;
      BO.hud.setState("moving");
    }
    g.speed = BO.score.speed(g.loop, g.s.broken);
    BO.hud.refresh();
  };

  BO.session = g;
})(window.BO);
