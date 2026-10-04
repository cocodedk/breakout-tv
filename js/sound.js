/* Breakout sound: short Web Audio tones, no files. Without Web Audio the game is silent. */
(function (BO) {
  "use strict";
  var SOUND_KEY = "breakout.sound";
  var PEAK = 0.2;
  var EDGE = 0.005;

  /* Each note: [wave, start Hz, end Hz, seconds] and, when it is not 0.2, a peak gain. */
  var TONES = {
    paddle: [["square", 440, 440, 0.06]],
    brick: [["square", 660, 660, 0.05]],
    wall: [["square", 330, 330, 0.04]],
    fire: [["square", 880, 440, 0.12, 0.12]],
    reflect: [["square", 660, 1320, 0.08, 0.15]],
    cleared: [["square", 523, 523, 0.12], ["square", 659, 659, 0.12], ["square", 784, 784, 0.12]],
    over: [["square", 392, 392, 0.25], ["square", 262, 262, 0.25]]
  };

  /* Layered sounds from other files, by name: { setup(ctx) once the context exists, play(ctx, t, track) }. */
  var layered = {};
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
        Object.keys(layered).forEach(function (name) { layered[name].setup(ctx); });
      }
      var resumed = ctx.resume();
      if (resumed && resumed.catch) { resumed.catch(function () { /* stays suspended */ }); }
    } catch (e) { /* no Web Audio: the game runs silently */ }
  }

  /* A gain node into the speakers: up to `peak` in 5 ms at t, back to silence by `end`. The ramps stop clicks. */
  function envelope(t, end, peak) {
    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peak, t + EDGE);
    gain.gain.setValueAtTime(peak, end - EDGE);
    gain.gain.linearRampToValueAtTime(0, end);
    gain.connect(ctx.destination);
    return gain;
  }

  /* Remembers a source until `end`, so that muting can stop it. */
  function track(source, end) {
    playing.push({ osc: source, end: end });
  }

  /* Plays one note starting at t and returns when it ends. */
  function note(spec, t) {
    var osc = ctx.createOscillator();
    var end = t + spec[3];
    osc.type = spec[0];
    osc.frequency.setValueAtTime(spec[1], t);
    if (spec[2] !== spec[1]) { osc.frequency.linearRampToValueAtTime(spec[2], end); }
    osc.connect(envelope(t, end, spec[4] || PEAK));
    osc.start(t);
    osc.stop(end);
    track(osc, end);
    return end;
  }

  /* Plays a named sound, `delay` seconds from now. */
  function play(name, delay) {
    if (!on || !ctx) { return; }
    try {
      var t = ctx.currentTime + (delay || 0);
      playing = playing.filter(function (p) { return p.end > ctx.currentTime; });
      if (layered[name]) {
        layered[name].play(ctx, t, track);
      } else {
        TONES[name].forEach(function (spec) { t = note(spec, t); });
      }
    } catch (e) { /* a broken audio device must not stop the game */ }
  }

  /* The tones for one game step: one for the ball (the first of core, brick, paddle, wall), then one for
     each bolt event (fire, reflect, station-hit). */
  function playEvents(events) {
    var ball = ["core", "brick", "paddle", "wall"].filter(function (e) { return events.indexOf(e) >= 0; })[0];
    if (ball) { play(ball); }
    events.forEach(function (e) {
      if (e === "fire" || e === "reflect" || e === "station-hit") { play(e); }
    });
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

  BO.sound = {
    unlock: unlock, play: play, playEvents: playEvents, toggle: toggle, isOn: function () { return on; },
    envelope: envelope, extend: function (name, sound) { layered[name] = sound; }
  };
})(window.BO);
