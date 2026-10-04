/* Breakout controls: turns key events into what each screen and dialog does with them. */
(function (BO) {
  "use strict";
  var game = BO.game;
  var screens = BO.screens;
  var keys = BO.keys;
  var sound = BO.sound;

  function leave() {
    try {
      tizen.application.getCurrentApplication().exit();
    } catch (e) { /* in a desktop browser there is nothing to exit */ }
    screens.closeDialog();
  }

  var PICK = {
    "over-retry": game.retry,
    "over-again": game.start,
    "over-title": game.toTitle,
    "pause-resume": game.resume,
    "pause-quit": game.quit,
    "leave-stay": screens.closeDialog,
    "leave-leave": leave
  };

  /* A list of choices: `before` and `after` move the focus, confirm picks, Back does `back`. */
  function menu(action, before, after, back) {
    if (action === before) { screens.moveFocus(-1); }
    else if (action === after) { screens.moveFocus(1); }
    else if (action === "confirm") { PICK[screens.focusedId()](); }
    else if (action === "back") { back(); }
  }

  function handle(action) {
    if (action === "mute") {
      screens.setHidden("hud-sound", sound.toggle());
      return;
    }
    var dialog = screens.dialog();
    var screen = screens.current();
    if (dialog === "pause") { menu(action === "pause" ? "back" : action, "up", "down", game.resume); }
    else if (dialog === "leave") { menu(action, "left", "right", screens.closeDialog); }
    else if (screen === "over") { menu(action, "left", "right", game.toTitle); }
    else if (screen === "title") {
      if (action === "confirm") { game.start(); }
      else if (action === "back") { screens.openDialog("leave"); }
    } else if (action === "back" || action === "pause") {
      game.pause();
    } else if (action === "confirm") {
      game.launch();
    }
  }

  function onKeyDown(e) {
    var action = keys.action(e.keyCode);
    if (!action) { return; }
    e.preventDefault();
    sound.unlock();
    var dir = keys.moveDir(action);
    if (dir) { game.holdDown(e.keyCode, dir); }
    if (!e.repeat) { handle(action); }
  }

  function onKeyUp(e) {
    game.holdUp(e.keyCode);
    if (keys.action(e.keyCode)) { e.preventDefault(); }
  }

  function install() {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", game.onHidden);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { game.onHidden(); }
    });
  }

  BO.controls = { install: install };
})(window.BO);
