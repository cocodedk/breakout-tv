/* Breakout phases: the two timed stretches of Play. When the core is hit the wall dissolves, then a
   banner names the next level. Both run on one clock, session.phaseLeft, and take no keys but Back,
   P and M. The rest of Play is in game.js. */
(function (BO) {
  "use strict";
  var g = BO.session;
  var levels = BO.levels;
  var screens = BO.screens;
  var sound = BO.sound;
  var nextLevel = null;

  /* Each phase: how long it lasts (ms) and what happens when its time is up. */
  var PHASES = {
    dissolve: { ms: 1000, done: clear },
    banner: { ms: 1500, done: function () { nextLevel(); } }
  };

  /* game.js hands over how a level is loaded, which is what the banner leads to. */
  function init(loadLevel) {
    nextLevel = loadLevel;
  }

  function enter(name) {
    g.phaseLeft = PHASES[name].ms;
    BO.hud.setState(name);
  }

  /* True while a phase runs. */
  function timed() {
    return !!PHASES[g.state];
  }

  /* How far the wall has dissolved, from 0 to 1; 0 when no dissolve runs. */
  function fade() {
    return g.state === "dissolve" ? 1 - g.phaseLeft / PHASES.dissolve.ms : 0;
  }

  /* The ball touched the core: the ball goes, and the wall that is left fades away. */
  function dissolve() {
    enter("dissolve");
  }

  /* After the dissolve: the wall is gone, and the next level, repeating faster after level 3, shows
     its name in a banner. */
  function clear() {
    g.s.bricks = [];
    sound.play("cleared", 0.05);
    if (g.level === levels.COUNT) {
      g.level = 1;
      g.loop += 1;
    } else {
      g.level += 1;
    }
    screens.text("play-banner", "Level " + g.level);
    enter("banner");
  }

  /* Lets the running phase spend ms of its time, and ends it when none is left. */
  function tick(ms) {
    g.phaseLeft -= ms;
    if (g.phaseLeft <= 0) { PHASES[g.state].done(); }
  }

  BO.phases = { init: init, timed: timed, fade: fade, dissolve: dissolve, tick: tick };
})(window.BO);
