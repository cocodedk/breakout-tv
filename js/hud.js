/* Breakout HUD: puts the session's numbers on the screen and the canvas. DOM only. */
(function (BO) {
  "use strict";
  var g = BO.session;
  var DASH = "—";
  var HUE_PERIOD = 4000;
  var ctx = null;

  function init() {
    ctx = document.getElementById("playfield").getContext("2d");
  }

  /* The HUD row and the playfield, from the session. The wall's fade and the ball's hiding follow
     from the phase the game is in; the UFO's hue turns a full circle every 4 seconds. */
  function refresh() {
    BO.screens.text("hud-score", "Score " + BO.score.formatScore(g.s.score));
    BO.screens.text("hud-level", "Level " + g.level);
    BO.screens.text("hud-lives", "Lives " + g.lives);
    var hue = (performance.now() / HUE_PERIOD * 360) % 360;
    BO.render.draw(ctx, g.s, { fade: BO.phases.fade(), ballHidden: BO.phases.timed(), hue: hue });
  }

  /* Serve, Moving, Dissolve or Banner: the launch hint, the level banner and the lives bonus follow it. */
  function setState(next) {
    g.state = next;
    BO.screens.setHidden("play-hint", next !== "serve");
    BO.screens.setHidden("play-banner", next !== "banner");
    BO.screens.setHidden("play-bonus", next !== "dissolve" && next !== "banner");
  }

  function best() {
    return g.best > 0 ? BO.score.formatScore(g.best) : DASH;
  }

  /* The level chooser: an arrow is dimmed at the end of the range it points to. */
  function showLevel() {
    BO.screens.text("title-level-text", "Level " + g.chosenLevel);
    document.getElementById("title-level-prev").style.opacity = g.chosenLevel === 1 ? "0.3" : "1";
    document.getElementById("title-level-next").style.opacity = g.chosenLevel === BO.levels.COUNT ? "0.3" : "1";
  }

  function showTitle() {
    BO.screens.show("title");
    showLevel();
    BO.screens.text("title-best", "Best score: " + best());
  }

  function showOver(isNew) {
    BO.screens.text("over-score", "Score " + BO.score.formatScore(g.s.score));
    BO.screens.text("over-best", "Best score " + best());
    BO.screens.text("over-retry", "Retry level " + g.level);
    BO.screens.setHidden("over-new-best", !isNew);
    BO.screens.show("over");
  }

  BO.hud = { init: init, refresh: refresh, setState: setState, showLevel: showLevel,
    showTitle: showTitle, showOver: showOver };
})(window.BO);
