/* Breakout sound: short Web Audio tones, no files. Without Web Audio the game is silent. */
(function (BO) {
  "use strict";
  var SOUND_KEY = "breakout.sound";
  var PEAK = 0.2;
  var EDGE = 0.005;

  /* Each note: [wave, start Hz, end Hz, seconds]. */
  var TONES = {
    paddle: [["square", 440, 440, 0.06]],
    brick: [["square", 660, 660, 0.05]],
    wall: [["square", 330, 330, 0.04]],
    lost: [["sawtooth", 400, 100, 0.4]],
    core: [["sine", 300, 1200, 0.5]],
    cleared: [["square", 523, 523, 0.12], ["square", 659, 659, 0.12], ["square", 784, 784, 0.12]],
    over: [["square", 392, 392, 0.25], ["square", 262, 262, 0.25]]
  };

  var ctx = null;
  var playing = [];
  var on = BO.store.get(SOUND_KEY) !== "off";

  /* Creates and resumes the AudioContext; the browser allows it only after a key press. */
  function unlock() {
    try {
      if (!ctx) {
        var Context = window.AudioContext || window.webkitAudioContext;
        if (!Context) { return; }
        ctx = new Context();
      }
      var resumed = ctx.resume();
      if (resumed && resumed.catch) { resumed.catch(function () { /* stays suspended */ }); }
    } catch (e) { /* no Web Audio: the game runs silently */ }
  }

  /* Plays one note starting at t and returns when it ends. The 5 ms ramps stop clicks. */
  function note(spec, t) {
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    var end = t + spec[3];
    osc.type = spec[0];
    osc.frequency.setValueAtTime(spec[1], t);
    if (spec[2] !== spec[1]) { osc.frequency.linearRampToValueAtTime(spec[2], end); }
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(PEAK, t + EDGE);
    gain.gain.setValueAtTime(PEAK, end - EDGE);
    gain.gain.linearRampToValueAtTime(0, end);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(end);
    playing.push({ osc: osc, end: end });
    return end;
  }

  /* Plays a named sound, `delay` seconds from now. */
  function play(name, delay) {
    if (!on || !ctx) { return; }
    try {
      var t = ctx.currentTime + (delay || 0);
      playing = playing.filter(function (p) { return p.end > ctx.currentTime; });
      TONES[name].forEach(function (spec) { t = note(spec, t); });
    } catch (e) { /* a broken audio device must not stop the game */ }
  }

  /* Muting also cancels notes already scheduled, such as the rest of a level-clear run. */
  function silence() {
    playing.forEach(function (p) {
      try { p.osc.stop(0); } catch (e) { /* already finished */ }
    });
    playing = [];
  }

  function toggle() {
    on = !on;
    if (!on) { silence(); }
    BO.store.set(SOUND_KEY, on ? "on" : "off");
    return on;
  }

  BO.sound = { unlock: unlock, play: play, toggle: toggle, isOn: function () { return on; } };
})(window.BO);
