/* Breakout session: the state of the game being played, with the snapshot and the seeding the
   drives use. The rules that change it live in game.js. */
(function (BO) {
  "use strict";
  var START_LIVES = 10;

  var g = {
    START_LIVES: START_LIVES,
    s: BO.physics.newState([]),
    best: 0,
    lives: START_LIVES,
    level: 1,
    chosenLevel: 1,
    loop: 0,
    speed: BO.score.startSpeed(0),
    state: "serve",
    phaseLeft: 0,
    levelStartScore: 0
  };

  g.snapshot = function () {
    var b = g.s.ball;
    var playing = BO.screens.current() === "play";
    return {
      screen: BO.screens.current(),
      state: playing ? g.state : null,
      dialog: BO.screens.dialog(),
      score: g.s.score,
      levelStartScore: g.levelStartScore,
      lives: g.lives,
      level: g.level,
      chosenLevel: g.chosenLevel,
      loop: g.loop,
      paddleX: g.s.paddleX,
      ball: { x: b.x, y: b.y, vx: b.vx, vy: b.vy },
      bricksLeft: g.s.bricks.length,
      core: g.s.core && { x: g.s.core.x, y: BO.core.Y, dir: g.s.core.dir },
      station: g.s.station && { x: g.s.station.x, y: g.s.station.y, r: g.s.station.r, charging: BO.station.charging(g.s) },
      bolts: g.s.bolts.map(function (b) { return { x: b.x, y: b.y, vx: b.vx, vy: b.vy, back: b.back }; })
    };
  };

  /* Sets up a game for the drives: any of score, levelStartScore, lives, level (which loads that level's
     wall and its UFO or station), loop, bricks [{col, row, color}],
     core {x, dir}, bolts [{x, y, vx, vy, back}], fireIn (seconds to the next shot) and ball {x, y, vx, vy}
     (which sends the ball flying). */
  g.seed = function (p) {
    if (p.score !== undefined) { g.s.score = p.score; }
    if (p.levelStartScore !== undefined) { g.levelStartScore = p.levelStartScore; }
    if (p.lives !== undefined) { g.lives = p.lives; }
    if (p.level !== undefined) {
      g.level = p.level;
      g.s.bricks = BO.levels.build(p.level);
      BO.station.setup(g.s, p.level);
    }
    if (p.loop !== undefined) { g.loop = p.loop; }
    if (p.bricks) {
      g.s.bricks = p.bricks.map(function (b) { return BO.levels.brick(b.col, b.row, b.color); });
    }
    if (p.core && g.s.core) { Object.assign(g.s.core, p.core); }
    if (p.bolts) { g.s.bolts = p.bolts.map(function (b) { return Object.assign({}, b); }); }
    if (p.fireIn !== undefined) { g.s.fireIn = p.fireIn; }
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
