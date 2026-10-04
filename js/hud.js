/* Breakout HUD: puts the session's numbers on the screen and the canvas. DOM only. */
(function (BO) {
  "use strict";
  var g = BO.session;
  var DASH = "—";
  var DOT = "●";
  var ctx = null;

  function init() {
    ctx = document.getElementById("playfield").getContext("2d");
  }

  /* The HUD row and the playfield, from the session. */
  function refresh() {
    var dots = [];
    for (var i = 0; i < g.lives; i++) { dots.push(DOT); }
    BO.screens.text("hud-score", "Score " + g.s.score);
    BO.screens.text("hud-level", "Level " + g.level);
    BO.screens.text("hud-lives", "Lives " + dots.join(" "));
    BO.render.draw(ctx, g.s, g.fade);
  }

  /* Serve, Moving, Dissolve or Banner: the launch hint and the level banner follow it. */
  function setState(next) {
    g.state = next;
    BO.screens.setHidden("play-hint", next !== "serve");
    BO.screens.setHidden("play-banner", next !== "banner");
  }

  function showTitle() {
    BO.screens.show("title");
    BO.screens.text("title-best", "Best score: " + (g.best > 0 ? g.best : DASH));
  }

  function showOver(isNew) {
    BO.screens.text("over-score", "Score " + g.s.score);
    BO.screens.text("over-best", "Best score " + (g.best > 0 ? g.best : DASH));
    BO.screens.setHidden("over-new-best", !isNew);
    BO.screens.show("over");
  }

  BO.hud = { init: init, refresh: refresh, setState: setState, showTitle: showTitle, showOver: showOver };
})(window.BO);
