/* Breakout drive: a Web Audio stand-in that records every source the game starts. It runs inside the
   page, before the game's own scripts; the clock of the fake context stays at 0, so every time
   it records is the offset from the moment of the call. */
"use strict";

function installShim() {
  window.__tones = 0;
  window.__stops = [];
  window.__notes = [];
  function round(x) { return Math.round(x * 1e6) / 1e6; }
  /* Records every call made on the parameter, as [name, value, time]. */
  function param() {
    var p = { calls: [] };
    p.setValueAtTime = function (v, t) { p.calls.push(["set", round(v), round(t)]); };
    p.linearRampToValueAtTime = function (v, t) { p.calls.push(["ramp", round(v), round(t)]); };
    return p;
  }
  /* A node that remembers where it was connected. */
  function node(props) {
    var n = props || {};
    n.connect = function (to) { n.next = to; };
    return n;
  }
  /* The nodes a source runs through, and the parameter it ends on if it modulates one. */
  function route(source) {
    var nodes = [];
    var n = source.next;
    while (n && !n.calls) { nodes.push(n); n = n.next; }
    return { nodes: nodes, target: n };
  }
  function started(source, kind, t) {
    var r = route(source);
    var gain = r.nodes.filter(function (n) { return n.gain; }).pop();
    var filter = r.nodes.filter(function (n) { return n.cutoff; })[0];
    var note = { kind: kind, type: source.type, start: round(t), gain: gain && gain.gain.calls };
    if (source.frequency) { note.freq = source.frequency.calls; }
    if (filter) { note.filter = { type: filter.type, cutoff: filter.frequency.calls }; }
    if (r.target) {
      note.lfo = true;
      r.target.owner.note.wobble = { rate: note.freq, depth: gain.gain.calls };
    }
    source.note = note;
    window.__tones += 1;
    window.__notes.push(note);
  }
  function stopped(source, t) {
    window.__stops.push(t);
    if (source.note && t > 0) { source.note.end = round(t); }
  }

  function FakeAudioContext() {
    this.currentTime = 0;
    this.state = "running";
    this.sampleRate = 8000;
    this.destination = {};
  }
  FakeAudioContext.prototype.resume = function () { return Promise.resolve(); };
  FakeAudioContext.prototype.createGain = function () { return node({ gain: param() }); };
  FakeAudioContext.prototype.createBiquadFilter = function () {
    return node({ cutoff: true, frequency: param() });
  };
  FakeAudioContext.prototype.createBuffer = function (channels, length, rate) {
    window.__buffers = (window.__buffers || []).concat([{ length: length, rate: rate }]);
    var data = new Float32Array(length);
    return { getChannelData: function () { return data; } };
  };
  FakeAudioContext.prototype.createBufferSource = function () {
    var s = node({});
    s.start = function (t) { started(s, "noise", t); };
    s.stop = function (t) { stopped(s, t); };
    return s;
  };
  FakeAudioContext.prototype.createOscillator = function () {
    var s = node({ frequency: param() });
    s.frequency.owner = s;
    s.start = function (t) { started(s, "osc", t); };
    s.stop = function (t) { stopped(s, t); };
    return s;
  };
  window.AudioContext = FakeAudioContext;
}

/* A gain curve with the 5 ms attack and release: [set 0, ramp to peak, set peak, ramp to 0]. */
function envelope(peak, start, end) {
  function r(x) { return Math.round(x * 1e6) / 1e6; }
  return [["set", 0, start], ["ramp", peak, r(start + 0.005)], ["set", peak, r(end - 0.005)], ["ramp", 0, end]];
}

module.exports = { installShim: installShim, envelope: envelope };
