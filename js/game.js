/* Breakout game: the animation loop and what happens when the ball is lost or a wall is cleared.
   The loop runs only while Play shows with no dialog over it. State lives in session.js. */
(function (BO) {
  "use strict";
  var physics = BO.physics;
  var score = BO.score;
  var levels = BO.levels;
  var screens = BO.screens;
  var sound = BO.sound;
  var store = BO.store;
  var g = BO.session;

  var STEP = 1 / 240;
  var MAX_FRAME = 0.05;
  var BANNER_MS = 1500;
  var BEST_KEY = "breakout.best";

  var refresh = BO.hud.refresh;
  var setState = BO.hud.setState;
  var hold = BO.hold.create();
  var now = function () { return performance.now(); };
  var last = 0;
  var acc = 0;
  var rafId = 0;

  /* Back to the title; the best score is read again, so without storage it shows a dash. */
  function toTitle() {
    g.best = score.parseBest(store.get(BEST_KEY));
    BO.hud.showTitle();
  }

  function running() {
    return screens.current() === "play" && !screens.dialog();
  }

  function schedule() {
    if (!rafId) { rafId = requestAnimationFrame(frame); }
  }

  /* A new wall, the paddle centred, the ball on it, and the level's start speed. */
  function loadLevel() {
    g.s.bricks = levels.build(g.level);
    g.s.broken = 0;
    g.speed = score.speed(g.loop, 0);
    physics.serve(g.s);
    setState("serve");
  }

  function start() {
    g.s.score = 0;
    g.lives = g.START_LIVES;
    g.level = 1;
    g.loop = 0;
    loadLevel();
    screens.show("play");
    refresh();
    last = now();
    acc = 0;
    schedule();
  }

  function launch() {
    if (g.state !== "serve") { return; }
    physics.launch(g.s, g.speed);
    setState("moving");
  }

  function gameOver() {
    var result = score.submitBest(g.best, g.s.score);
    if (result.isNew) { store.set(BEST_KEY, String(result.best)); }
    g.best = score.parseBest(store.get(BEST_KEY));
    BO.hud.showOver(result.isNew);
    sound.play("over", 0.4);
  }

  function lose() {
    g.lives -= 1;
    sound.play("lost");
    if (g.lives > 0) {
      physics.serve(g.s);
      setState("serve");
    } else {
      gameOver();
    }
  }

  /* After the last brick: the next level, repeating faster after level 3, behind a banner. */
  function clear() {
    sound.play("cleared", 0.05);
    if (g.level === levels.COUNT) {
      g.level = 1;
      g.loop += 1;
    } else {
      g.level += 1;
    }
    g.bannerLeft = BANNER_MS;
    screens.text("play-banner", "Level " + g.level);
    setState("banner");
  }

  /* Reacts to one step's events. Returns true when the step loop must stop. */
  function react(events) {
    if (events.indexOf("lost") >= 0) { lose(); return true; }
    if (events.indexOf("brick") >= 0) {
      g.speed = score.speed(g.loop, g.s.broken);
      physics.setSpeed(g.s.ball, g.speed);
    }
    var tone = ["brick", "paddle", "wall"].filter(function (e) { return events.indexOf(e) >= 0; })[0];
    if (tone) { sound.play(tone); }
    if (events.indexOf("cleared") >= 0) { clear(); return true; }
    return false;
  }

  /* Runs dt seconds of game time in whole steps of exactly 1/240 s, carrying any remainder to
     the next call; t (ms) is the time the remainder has reached. */
  function simulate(t, dt) {
    acc += dt;
    while (acc >= STEP - 1e-9) {
      acc -= STEP;
      var events = physics.step(g.s, STEP, hold.dir(t - acc * 1000));
      if (events.length && react(events)) { acc = 0; return; }
    }
  }

  /* Brings the game up to time t (ms), at most 50 ms of game time at once. */
  function advance(t) {
    var dt = Math.min(Math.max(t - last, 0) / 1000, MAX_FRAME);
    last = t;
    if (g.state === "banner") {
      g.bannerLeft -= dt * 1000;
      if (g.bannerLeft <= 0) { loadLevel(); }
    } else if (dt > 0) {
      simulate(t, dt);
    }
    refresh();
  }

  function frame() {
    rafId = 0;
    if (!running()) { return; }
    advance(now());
    if (running()) { schedule(); }
  }

  /* A key change takes effect at its own moment, not at the next frame. */
  function holdDown(code, dir) {
    if (!running() || g.state === "banner") { return; }
    var t = now();
    advance(t);
    hold.down(code, dir, t);
  }

  function holdUp(code) {
    if (running()) { advance(now()); }
    hold.up(code);
  }

  function pause() {
    if (running()) { screens.openDialog("pause"); }
  }

  function resume() {
    screens.closeDialog();
    last = now();
    schedule();
  }

  function quit() {
    screens.closeDialog();
    toTitle();
  }

  /* Focus lost or page hidden: every held key is released, and a game in Serve or Moving pauses. */
  function onHidden() {
    hold.release();
    if (g.state !== "banner") { pause(); }
  }

  function init() {
    BO.hud.init();
    toTitle();
  }

  BO.game = {
    init: init,
    start: start,
    launch: launch,
    pause: pause,
    resume: resume,
    quit: quit,
    toTitle: toTitle,
    holdDown: holdDown,
    holdUp: holdUp,
    onHidden: onHidden,
    seed: g.seed,
    snapshot: g.snapshot
  };
})(window.BO);
