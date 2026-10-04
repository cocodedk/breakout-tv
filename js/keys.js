/* Breakout keys: key codes (keyCode only, as the TV fills it for the remote and a keyboard) to actions. */
(function (BO) {
  "use strict";
  var ACTIONS = {
    37: "left", 65: "left",
    39: "right", 68: "right",
    38: "up", 87: "up",
    40: "down", 83: "down",
    32: "confirm", 13: "confirm",
    80: "pause",
    10009: "back", 27: "back", 8: "back",
    77: "mute"
  };

  /* The action a key code stands for, or "" when the game ignores it. */
  function action(code) {
    return ACTIONS[code] || "";
  }

  /* -1 for left, 1 for right, 0 for any other action. */
  function moveDir(name) {
    return name === "left" ? -1 : name === "right" ? 1 : 0;
  }

  BO.keys = { action: action, moveDir: moveDir };
})(window.BO);
