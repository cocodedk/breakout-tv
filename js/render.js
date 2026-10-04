/* Breakout canvas: draws the bricks, the UFO, the paddle and the ball. */
(function (BO) {
  "use strict";
  var BACKGROUND = "#070b1e";
  var SILVER_HIT = "#7d869a";
  var RADIUS = 6;
  var LIGHTS = 5;
  var physics = BO.physics;

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }

  function disc(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function brickColor(b) {
    return b.color === "S" && b.hits === 1 ? SILVER_HIT : BO.levels.COLORS[b.color];
  }

  /* `fade` runs from 0 to 1 while the wall dissolves: each brick shrinks to no height about its own
     centre line. */
  function drawBrick(ctx, b, fade) {
    var h = b.h * (1 - fade);
    if (h <= 0) { return; }
    ctx.fillStyle = brickColor(b);
    roundRect(ctx, b.x, b.y + (b.h - h) / 2, b.w, h, Math.min(RADIUS, h / 2));
  }

  /* All the bricks lose opacity together as they fade, so it is set once for the whole wall. */
  function drawBricks(ctx, bricks, fade) {
    if (fade > 0) { ctx.globalAlpha = 1 - fade; }
    bricks.forEach(function (b) { drawBrick(ctx, b, fade); });
    if (fade > 0) { ctx.globalAlpha = 1; }
  }

  function ellipse(ctx, x, y, rx, ry, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /* The UFO: glow, hull, dome and five lights, in the colours of the hue (degrees) it is given. */
  function drawCore(ctx, core, hue) {
    var x = core.x;
    ellipse(ctx, x, 60, 60, 26, "hsla(" + hue + ", 90%, 60%, 0.25)");
    ellipse(ctx, x, 64, 44, 12, "hsl(" + hue + ", 90%, 60%)");
    ctx.fillStyle = "rgba(200, 240, 255, 0.85)";
    ctx.beginPath();
    ctx.arc(x, 56, 18, Math.PI, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    for (var i = 0; i < LIGHTS; i++) {
      disc(ctx, x + (i - 2) * 15, 66, 4, "hsl(" + (hue + 72 * i) % 360 + ", 90%, 60%)");
    }
  }

  /* Paints the whole playfield from the physics state and the view: { fade, ballHidden, hue }. */
  function draw(ctx, s, view) {
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, physics.W, physics.H);
    drawBricks(ctx, s.bricks, view.fade);
    drawCore(ctx, s.core, view.hue);
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, s.paddleX, physics.PADDLE_Y, physics.PADDLE_W, physics.PADDLE_H, RADIUS);
    if (!view.ballHidden) { disc(ctx, s.ball.x, s.ball.y, physics.BALL_R, "#ffffff"); }
  }

  BO.render = { draw: draw };
})(window.BO);
