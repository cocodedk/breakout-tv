/* Breakout outcomes: what happens when the ball is lost, the game ends or the core is hit. */
(function (BO) {
  "use strict";
  var g = BO.session;
  var DISSOLVE_MS = 1000;
  var BEST_KEY = "breakout.best";

  function gameOver() {
    var result = BO.score.submitBest(g.best, g.s.score);
    if (result.isNew) { BO.store.set(BEST_KEY, String(result.best)); }
    g.best = BO.score.parseBest(BO.store.get(BEST_KEY));
    BO.hud.showOver(result.isNew);
    BO.sound.play("over", 0.4);
  }

  /* A lost ball costs a life: the next serve, or the end of the game. */
  function lose() {
    g.lives -= 1;
    BO.sound.play("lost");
    if (g.lives > 0) {
      BO.physics.serve(g.s);
      BO.hud.setState("serve");
    } else {
      gameOver();
    }
  }

  /* The ball touched the core: the ball goes, and the wall that is left fades away. */
  function dissolve() {
    g.s.ballGone = true;
    g.dissolveLeft = DISSOLVE_MS;
    g.fade = 0;
    BO.hud.setState("dissolve");
  }

  BO.outcomes = { BEST_KEY: BEST_KEY, DISSOLVE_MS: DISSOLVE_MS, lose: lose, dissolve: dissolve };
})(window.BO);
