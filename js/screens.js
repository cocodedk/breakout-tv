/* Breakout screens: which screen and dialog show, and which choice is focused. DOM only. */
(function (BO) {
  "use strict";
  var NAMES = ["title", "play", "over"];
  var current = "title";
  var dialog = "";

  function el(id) {
    return document.getElementById(id);
  }

  function choices(box) {
    return box.querySelectorAll(".choice");
  }

  function setFocus(box, index) {
    var list = choices(box);
    for (var i = 0; i < list.length; i++) { list[i].classList.toggle("focused", i === index); }
  }

  function focusedIndex(box) {
    var list = choices(box);
    for (var i = 0; i < list.length; i++) {
      if (list[i].classList.contains("focused")) { return i; }
    }
    return 0;
  }

  /* The box whose choices the keys move: the open dialog, else the screen. */
  function menu() {
    return el(dialog ? "dialog-" + dialog : "screen-" + current);
  }

  function moveFocus(delta) {
    var box = menu();
    var last = choices(box).length - 1;
    setFocus(box, Math.max(0, Math.min(last, focusedIndex(box) + delta)));
  }

  function focusedId() {
    var box = menu();
    return choices(box)[focusedIndex(box)].id;
  }

  function closeDialog() {
    if (dialog) { el("dialog-" + dialog).hidden = true; }
    dialog = "";
  }

  function openDialog(name) {
    closeDialog();
    dialog = name;
    el("dialog-" + name).hidden = false;
    setFocus(menu(), 0);
  }

  /* Shows one screen, hides the others and any dialog, and focuses its first choice. */
  function show(name) {
    closeDialog();
    current = name;
    NAMES.forEach(function (n) { el("screen-" + n).hidden = n !== name; });
    setFocus(menu(), 0);
  }

  function text(id, value) {
    var node = el(id);
    if (node.textContent !== value) { node.textContent = value; }
  }

  function setHidden(id, hidden) {
    el(id).hidden = hidden;
  }

  BO.screens = {
    current: function () { return current; },
    dialog: function () { return dialog; },
    show: show,
    openDialog: openDialog,
    closeDialog: closeDialog,
    moveFocus: moveFocus,
    focusedId: focusedId,
    text: text,
    setHidden: setHidden
  };
})(window.BO);
