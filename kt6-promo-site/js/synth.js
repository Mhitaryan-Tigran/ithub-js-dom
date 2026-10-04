(function () {
  const FINISHES = {
    aluminum: { name: "Алюминий", top: "#e4e5e8", bottom: "#c6c8cc", ink: "#1d1d1f", sub: "#6e6e73", knob: ["#3a3a3c", "#1c1c1e"], tick: "#ffffff", swatch: "#d7d8dc" },
    graphite: { name: "Графит", top: "#4a4b50", bottom: "#2a2b2f", ink: "#f5f5f7", sub: "#a1a1a6", knob: ["#e8e8ed", "#c7c7cc"], tick: "#1d1d1f", swatch: "#3b3c40" },
    sand: { name: "Песок", top: "#efe6d8", bottom: "#d9cab2", ink: "#3d3428", sub: "#8a7c66", knob: ["#4a3f33", "#2e271f"], tick: "#f5efe6", swatch: "#e3d6c2" },
    night: { name: "Ночь", top: "#27304a", bottom: "#141a2c", ink: "#eef1f8", sub: "#8e98b3", knob: ["#d9dde8", "#aeb5c7"], tick: "#141a2c", swatch: "#1f2740" },
  };

  const BLACK = { 1: true, 3: true, 6: true, 8: true, 10: true };
  const KEY_START = 48;
  const KEY_COUNT = 37;

  function keyLayout(x0, width) {
    const whites = [];
    for (let n = KEY_START; n < KEY_START + KEY_COUNT; n++) if (!BLACK[n % 12]) whites.push(n);
    const w = width / whites.length;
    const keys = [];
    whites.forEach((n, i) => keys.push({ note: n, black: false, x: x0 + i * w, w }));
    for (let n = KEY_START; n < KEY_START + KEY_COUNT; n++) {
      if (!BLACK[n % 12]) continue;
      const left = keys.find((k) => k.note === n - 1);
      keys.push({ note: n, black: true, x: left.x + w * 0.66, w: w * 0.62 });
    }
    return { keys, w };
  }

  function knob(cx, cy, r, value, label, f, id) {
    const angle = -135 + value * 270;
    return `
      <g class="synth-knob" data-knob="${id}" transform="translate(${cx} ${cy})">
        <circle r="${r + 7}" fill="none" stroke="${f.sub}" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="2 5"/>
        <circle r="${r}" fill="url(#knob-${id})"/>
        <circle r="${r - 6}" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="2"/>
        <line class="synth-knob-tick" x1="0" y1="${-r + 7}" x2="0" y2="${-r + 18}" stroke="${f.tick}" stroke-width="4" stroke-linecap="round" transform="rotate(${angle})"/>
        <text y="${r + 28}" text-anchor="middle" font-size="13" font-weight="600" letter-spacing="1.5" fill="${f.sub}">${label}</text>
      </g>`;
  }

  function render(finishKey, options = {}) {
    const f = FINISHES[finishKey] || FINISHES.aluminum;
    const knobs = options.knobs || { cutoff: 0.62, resonance: 0.35, attack: 0.15, release: 0.45 };
    const { keys, w } = keyLayout(232, 868);
    const whiteKeys = keys.filter((k) => !k.black).map((k) => `<rect class="synth-key" data-note="${k.note}" x="${(k.x + 1).toFixed(1)}" y="282" width="${(k.w - 2).toFixed(1)}" height="164" rx="5" fill="url(#white-key)"/>`).join("");
    const blackKeys = keys.filter((k) => k.black).map((k) => `<rect class="synth-key is-black" data-note="${k.note}" x="${k.x.toFixed(1)}" y="282" width="${k.w.toFixed(1)}" height="100" rx="4" fill="url(#black-key)"/>`).join("");
    const knobDefs = ["cutoff", "resonance", "attack", "release"].map((id) => `
      <radialGradient id="knob-${id}" cx="0.35" cy="0.3" r="0.9">
        <stop offset="0" stop-color="${f.knob[0]}"/>
        <stop offset="1" stop-color="${f.knob[1]}"/>
      </radialGradient>`).join("");
    return `
<svg class="synth" viewBox="0 0 1200 560" role="img" aria-label="Синтезатор ВОЛНА·7, отделка ${f.name}">
  <defs>
    <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${f.top}"/>
      <stop offset="1" stop-color="${f.bottom}"/>
    </linearGradient>
    <linearGradient id="walnut" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8a5a36"/>
      <stop offset="0.5" stop-color="#6b4226"/>
      <stop offset="1" stop-color="#4d2e19"/>
    </linearGradient>
    <linearGradient id="white-key" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f2f2f4"/>
      <stop offset="0.85" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#dcdce0"/>
    </linearGradient>
    <linearGradient id="black-key" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2c2c2e"/>
      <stop offset="0.9" stop-color="#121214"/>
      <stop offset="1" stop-color="#3a3a3c"/>
    </linearGradient>
    <linearGradient id="wheel" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#1c1c1e"/>
      <stop offset="0.5" stop-color="#48484a"/>
      <stop offset="1" stop-color="#1c1c1e"/>
    </linearGradient>
    <linearGradient id="screen-glass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="floor" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#000" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
    ${knobDefs}
  </defs>
  <ellipse cx="600" cy="510" rx="560" ry="34" fill="url(#floor)"/>
  <rect x="40" y="56" width="1120" height="420" rx="30" fill="url(#walnut)"/>
  <rect x="40" y="56" width="1120" height="420" rx="30" fill="none" stroke="#000" stroke-opacity="0.18"/>
  <rect x="86" y="56" width="1028" height="420" rx="6" fill="#0d0d0f"/>
  <rect x="86" y="56" width="1028" height="214" rx="6" fill="url(#panel)"/>
  <rect x="86" y="57" width="1028" height="2" fill="#ffffff" fill-opacity="0.55"/>
  <text x="122" y="104" font-size="30" font-weight="700" letter-spacing="-0.5" fill="${f.ink}">ВОЛНА·7</text>
  <text x="124" y="126" font-size="11" font-weight="600" letter-spacing="2.4" fill="${f.sub}">POLYPHONIC ANALOG SYNTHESIZER</text>
  <rect x="122" y="146" width="236" height="96" rx="12" fill="#0a0b0d"/>
  <g class="synth-screen">
    <path class="synth-grid" d="M140 194H340" stroke="#ff9f0a" stroke-opacity="0.18" stroke-dasharray="3 5"/>
    <path class="synth-wave" d="M140 194 C 165 160, 190 160, 215 194 S 265 228, 290 194 S 315 160, 340 194" fill="none" stroke="#ff9f0a" stroke-width="3" stroke-linecap="round"/>
    <text class="synth-readout" x="140" y="232" font-size="11" font-weight="600" letter-spacing="1.5" fill="#ff9f0a" fill-opacity="0.75">SAW · 7 VOICES</text>
  </g>
  <rect x="122" y="146" width="236" height="96" rx="12" fill="url(#screen-glass)"/>
  ${knob(462, 184, 32, knobs.cutoff, "CUTOFF", f, "cutoff")}
  ${knob(574, 184, 32, knobs.resonance, "RESO", f, "resonance")}
  ${knob(686, 184, 32, knobs.attack, "ATTACK", f, "attack")}
  ${knob(798, 184, 32, knobs.release, "RELEASE", f, "release")}
  <g font-size="11" font-weight="600" letter-spacing="1.5" fill="${f.sub}">
    <rect x="890" y="154" width="54" height="34" rx="8" fill="${f.ink}" fill-opacity="0.08" stroke="${f.ink}" stroke-opacity="0.12"/>
    <rect x="958" y="154" width="54" height="34" rx="8" fill="${f.ink}" fill-opacity="0.08" stroke="${f.ink}" stroke-opacity="0.12"/>
    <rect x="1026" y="154" width="54" height="34" rx="8" fill="${f.ink}" fill-opacity="0.08" stroke="${f.ink}" stroke-opacity="0.12"/>
    <circle class="synth-led" data-led="0" cx="917" cy="171" r="4" fill="#ff9f0a"/>
    <circle class="synth-led" data-led="1" cx="985" cy="171" r="4" fill="${f.sub}" fill-opacity="0.35"/>
    <circle class="synth-led" data-led="2" cx="1053" cy="171" r="4" fill="${f.sub}" fill-opacity="0.35"/>
    <text x="917" y="214" text-anchor="middle">OSC</text>
    <text x="985" y="214" text-anchor="middle">LFO</text>
    <text x="1053" y="214" text-anchor="middle">ARP</text>
  </g>
  <rect x="86" y="270" width="1028" height="6" fill="#000" fill-opacity="0.4"/>
  <rect x="104" y="296" width="44" height="136" rx="12" fill="#0a0a0c"/>
  <rect x="166" y="296" width="44" height="136" rx="12" fill="#0a0a0c"/>
  <rect x="110" y="304" width="32" height="120" rx="9" fill="url(#wheel)"/>
  <rect x="172" y="304" width="32" height="120" rx="9" fill="url(#wheel)"/>
  <rect class="synth-pitch" x="110" y="358" width="32" height="6" rx="3" fill="#ff9f0a"/>
  <rect class="synth-mod" x="172" y="410" width="32" height="6" rx="3" fill="#ffffff" fill-opacity="0.7"/>
  <g class="synth-keys">${whiteKeys}${blackKeys}</g>
</svg>`;
  }

  const NOTE_KEYS = { a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71, k: 72, o: 73, l: 74, p: 75, ";": 76 };
  const CODE_KEYS = { KeyA: "a", KeyW: "w", KeyS: "s", KeyE: "e", KeyD: "d", KeyF: "f", KeyT: "t", KeyG: "g", KeyY: "y", KeyH: "h", KeyU: "u", KeyJ: "j", KeyK: "k", KeyO: "o", KeyL: "l", KeyP: "p", Semicolon: ";" };

  function createAudio() {
    let ctx = null;
    let master = null;
    let filter = null;
    let analyser = null;
    const voices = new Map();
    const params = { wave: "sawtooth", cutoff: 0.62, resonance: 0.35, attack: 0.15, release: 0.45, volume: 0.5 };

    function ensure() {
      if (ctx) return ctx;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      master = ctx.createGain();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      filter.connect(master);
      master.connect(analyser);
      analyser.connect(ctx.destination);
      apply();
      return ctx;
    }

    function apply() {
      if (!ctx) return;
      const now = ctx.currentTime;
      filter.frequency.setTargetAtTime(120 * Math.pow(2, params.cutoff * 7.2), now, 0.03);
      filter.Q.setTargetAtTime(0.5 + params.resonance * 18, now, 0.03);
      master.gain.setTargetAtTime(params.volume * 0.35, now, 0.03);
    }

    function freq(note) {
      return 440 * Math.pow(2, (note - 69) / 12);
    }

    function start(note) {
      if (!ensure()) return;
      if (ctx.state === "suspended") ctx.resume();
      if (voices.has(note)) return;
      const now = ctx.currentTime;
      const a = ctx.createOscillator();
      const b = ctx.createOscillator();
      const g = ctx.createGain();
      a.type = params.wave;
      b.type = params.wave;
      a.frequency.value = freq(note);
      b.frequency.value = freq(note);
      b.detune.value = 7;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.5, now + 0.005 + params.attack * 1.2);
      a.connect(g);
      b.connect(g);
      g.connect(filter);
      a.start(now);
      b.start(now);
      voices.set(note, { a, b, g });
    }

    function stop(note) {
      const v = voices.get(note);
      if (!v || !ctx) return;
      const now = ctx.currentTime;
      const tail = 0.04 + params.release * 2.4;
      v.g.gain.cancelScheduledValues(now);
      v.g.gain.setValueAtTime(v.g.gain.value, now);
      v.g.gain.linearRampToValueAtTime(0, now + tail);
      v.a.stop(now + tail + 0.05);
      v.b.stop(now + tail + 0.05);
      voices.delete(note);
    }

    function stopAll() {
      [...voices.keys()].forEach(stop);
    }

    function set(key, value) {
      params[key] = value;
      if (key === "wave") voices.forEach((v) => { v.a.type = value; v.b.type = value; });
      apply();
    }

    return { start, stop, stopAll, set, params, analyser: () => analyser, active: () => voices.size };
  }

  function drawScope(canvas, audio, color) {
    const ctx2d = canvas.getContext("2d");
    const data = new Uint8Array(2048);
    let phase = 0;
    function frame() {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2d.clearRect(0, 0, w, h);
      ctx2d.lineWidth = 2.5;
      ctx2d.strokeStyle = color;
      ctx2d.lineJoin = "round";
      ctx2d.beginPath();
      const an = audio.analyser();
      const live = an && audio.active() > 0;
      if (live) an.getByteTimeDomainData(data);
      phase += 0.02;
      for (let i = 0; i <= 256; i++) {
        const x = (i / 256) * w;
        let y;
        if (live) y = h / 2 + ((data[Math.floor((i / 256) * 1023)] - 128) / 128) * h * 0.42;
        else y = h / 2 + Math.sin(i / 18 + phase) * h * 0.06;
        if (i === 0) ctx2d.moveTo(x, y);
        else ctx2d.lineTo(x, y);
      }
      ctx2d.stroke();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  window.Volna = { FINISHES, render, createAudio, drawScope, NOTE_KEYS, CODE_KEYS };
})();
