/* Breakout levels: the four wall layouts and how they become bricks. No DOM. */
(function (BO) {
  "use strict";
  var score = BO.score || require("./score.js");

  /* R O Y G B are the colours, L and D light and dark grey, S a silver two-hit brick, . is empty. The bricks are thin, so
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
    ],
    [
      "LLLLLLLLLLLL",
      "LLLLLLLLLLLL",
      "DDDDDDDDDDDD",
      "DDDDDDDDDDDD",
      "LL.LL..LL.LL",
      "LL.LL..LL.LL",
      "SSSSSSSSSSSS",
      "SSSSSSSSSSSS",
      "DDDDDDDDDDDD",
      "DDDDDDDDDDDD",
      "LLLLLLLLLLLL",
      "LLLLLLLLLLLL"
    ]
  ];

  var COLORS = {
    R: "#ff5a4a",
    O: "#ffaa3c",
    Y: "#ffd447",
    G: "#4be38e",
    B: "#5aa9ff",
    S: "#c8d0e0",
    L: "#9aa3b5",
    D: "#5b6378"
  };

  var BRICK_W = 120;
  var BRICK_H = 20;
  var COL_STEP = 128;
  var ROW_STEP = 28;
  var LEFT = 36;
  var TOP = 120;
  /* The y of each layout's top row: level 4 starts lower, to leave room for the station. */
  var TOPS = [TOP, TOP, TOP, 260];

  function brick(col, row, color, top) {
    return {
      x: LEFT + col * COL_STEP,
      y: (top || TOP) + row * ROW_STEP,
      w: BRICK_W,
      h: BRICK_H,
      color: color,
      hits: color === "S" ? 2 : 1,
      points: score.points(color)
    };
  }

  function parse(rows, top) {
    var bricks = [];
    rows.forEach(function (line, row) {
      for (var col = 0; col < line.length; col++) {
        if (line.charAt(col) !== ".") { bricks.push(brick(col, row, line.charAt(col), top)); }
      }
    });
    return bricks;
  }

  /* The fresh wall of level 1, 2, 3 or 4. */
  function build(level) {
    return parse(LAYOUTS[level - 1], TOPS[level - 1]);
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
