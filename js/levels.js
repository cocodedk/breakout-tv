/* Breakout levels: the three wall layouts and how they become bricks. No DOM. */
(function (BO) {
  "use strict";
  var score = BO.score || require("./score.js");

  /* R O Y G B are the colours, S is a silver two-hit brick, . is empty. The bricks are thin, so
     every line is written twice: each layer of the wall is two rows. */
  var LAYOUTS = [
    [
      "RRRRRRRRRRRR",
      "RRRRRRRRRRRR",
      "OOOOOOOOOOOO",
      "OOOOOOOOOOOO",
      "YYYYYYYYYYYY",
      "YYYYYYYYYYYY",
      "GGGGGGGGGGGG",
      "GGGGGGGGGGGG",
      "BBBBBBBBBBBB",
      "BBBBBBBBBBBB"
    ],
    [
      "R.R.R.R.R.R.",
      "R.R.R.R.R.R.",
      ".O.O.O.O.O.O",
      ".O.O.O.O.O.O",
      "Y.Y.Y.Y.Y.Y.",
      "Y.Y.Y.Y.Y.Y.",
      ".G.G.G.G.G.G",
      ".G.G.G.G.G.G",
      "B.B.B.B.B.B.",
      "B.B.B.B.B.B.",
      ".B.B.B.B.B.B",
      ".B.B.B.B.B.B"
    ],
    [
      "SSSSSSSSSSSS",
      "SSSSSSSSSSSS",
      ".RRRRRRRRRR.",
      ".RRRRRRRRRR.",
      "..OOOOOOOO..",
      "..OOOOOOOO..",
      "...YYYYYY...",
      "...YYYYYY...",
      "....GGGG....",
      "....GGGG....",
      ".....BB.....",
      ".....BB....."
    ]
  ];

  var COLORS = {
    R: "#ff5a4a",
    O: "#ffaa3c",
    Y: "#ffd447",
    G: "#4be38e",
    B: "#5aa9ff",
    S: "#c8d0e0"
  };

  var BRICK_W = 120;
  var BRICK_H = 20;
  var COL_STEP = 128;
  var ROW_STEP = 28;
  var LEFT = 36;
  var TOP = 120;

  function brick(col, row, color) {
    return {
      x: LEFT + col * COL_STEP,
      y: TOP + row * ROW_STEP,
      w: BRICK_W,
      h: BRICK_H,
      color: color,
      hits: color === "S" ? 2 : 1,
      points: score.points(color)
    };
  }

  function parse(rows) {
    var bricks = [];
    rows.forEach(function (line, row) {
      for (var col = 0; col < line.length; col++) {
        if (line.charAt(col) !== ".") { bricks.push(brick(col, row, line.charAt(col))); }
      }
    });
    return bricks;
  }

  /* The fresh wall of level 1, 2 or 3. */
  function build(level) {
    return parse(LAYOUTS[level - 1]);
  }

  BO.levels = {
    LAYOUTS: LAYOUTS,
    COLORS: COLORS,
    COUNT: LAYOUTS.length,
    brick: brick,
    parse: parse,
    build: build
  };
  if (typeof module !== "undefined" && module.exports) { module.exports = BO.levels; }
})(typeof module !== "undefined" && module.exports ? require("./app.js") : window.BO);
