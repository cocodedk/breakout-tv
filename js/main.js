/* Breakout start-up: the last script, once every module is in place. */
(function (BO) {
  "use strict";
  BO.screens.setHidden("hud-sound", BO.sound.isOn());
  BO.game.init();
  BO.controls.install();
})(window.BO);
