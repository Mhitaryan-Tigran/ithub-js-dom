(function () {
  const { render, createAudio, drawScope, NOTE_KEYS, CODE_KEYS } = window.Volna;
  const audio = createAudio();
  const p = audio.params;
  const DEFAULTS = { cutoff: 0.62, resonance: 0.35, attack: 0.15, release: 0.45, volume: 0.5 };
  const PRESETS = {
    pad: { wave: "triangle", cutoff: 0.48, resonance: 0.2, attack: 0.55, release: 0.85, volume: 0.55 },
    bass: { wave: "sawtooth", cutoff: 0.32, resonance: 0.88, attack: 0.02, release: 0.18, volume: 0.6 },
    glass: { wave: "sine", cutoff: 0.95, resonance: 0.1, attack: 0.01, release: 0.7, volume: 0.5 },
    brass: { wave: "square", cutoff: 0.7, resonance: 0.4, attack: 0.12, release: 0.3, volume: 0.45 },
  };
  const WAVE_PATHS = {
    sine: "M140 194 C 165 160, 190 160, 215 194 S 265 228, 290 194 S 315 160, 340 194",
    triangle: "M140 194 L165 164 L215 224 L265 164 L315 224 L340 194",
    sawtooth: "M140 224 L215 164 L215 224 L290 164 L290 224 L340 184",
    square: "M140 164 H190 V224 H240 V164 H290 V224 H340",
  };
  const WAVE_NAMES = { sine: "SINE", triangle: "TRI", sawtooth: "SAW", square: "SQUARE" };
  const NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
  let octave = 4;
  const held = new Map();

  const device = document.getElementById("device");
  device.innerHTML = render("graphite", { knobs: DEFAULTS });
  const svg = device.querySelector("svg");

  function format(param, v) {
    if (param === "cutoff") return `${Math.round(120 * Math.pow(2, v * 7.2))} Гц`;
    if (param === "attack") return `${Math.round((0.005 + v * 1.2) * 1000)} мс`;
    if (param === "release") return `${Math.round((0.04 + v * 2.4) * 1000)} мс`;
    return `${Math.round(v * 100)}%`;
  }

  const knobs = {};
  function arc(v) {
    const a0 = (-225 * Math.PI) / 180;
    const a1 = a0 + (v * 270 * Math.PI) / 180;
    const r = 26;
    const x0 = 32 + r * Math.cos(a0);
    const y0 = 32 + r * Math.sin(a0);
    const x1 = 32 + r * Math.cos(a1);
    const y1 = 32 + r * Math.sin(a1);
    return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${v * 270 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  }

  function setParam(param, v) {
    v = Math.max(0, Math.min(1, v));
    audio.set(param, v);
    const k = knobs[param];
    if (k) {
      k.arc.setAttribute("d", v > 0.001 ? arc(v) : "");
      k.pointer.setAttribute("transform", `rotate(${-135 + v * 270} 32 32)`);
      k.value.textContent = format(param, v);
      k.el.setAttribute("aria-valuenow", Math.round(v * 100));
      k.el.setAttribute("aria-valuetext", format(param, v));
    }
    const tick = svg.querySelector(`[data-knob="${param}"] .synth-knob-tick`);
    if (tick) tick.setAttribute("transform", `rotate(${-135 + v * 270})`);
  }

  document.querySelectorAll(".knob").forEach((el) => {
    const param = el.dataset.param;
    el.innerHTML = `
      <svg viewBox="0 0 64 64" aria-hidden="true">
        <path class="arc-bg" d="${arc(1)}"/>
        <path class="arc"/>
        <circle cx="32" cy="32" r="17" fill="#d1d1d6"/>
        <circle cx="32" cy="29" r="14" fill="#f2f2f7" opacity="0.55"/>
        <line class="pointer" x1="32" y1="19" x2="32" y2="25"/>
      </svg>
      <span class="k-label">${el.dataset.label}</span>
      <span class="k-value"></span>`;
    el.tabIndex = 0;
    el.setAttribute("role", "slider");
    el.setAttribute("aria-label", el.dataset.label);
    el.setAttribute("aria-valuemin", "0");
    el.setAttribute("aria-valuemax", "100");
    knobs[param] = { el, arc: el.querySelector(".arc"), pointer: el.querySelector(".pointer"), value: el.querySelector(".k-value") };

    const drag = (startY, startV) => (y) => setParam(param, startV + (startY - y) / 180);
    el.addEventListener("mousedown", (e) => {
      e.preventDefault();
      el.focus();
      el.classList.add("is-active");
      document.body.style.cursor = "ns-resize";
      const move = drag(e.clientY, p[param]);
      const onMove = (ev) => move(ev.clientY);
      const onUp = () => {
        el.classList.remove("is-active");
        document.body.style.cursor = "";
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });
    el.addEventListener("touchstart", (e) => {
      const move = drag(e.touches[0].clientY, p[param]);
      const onMove = (ev) => {
        ev.preventDefault();
        move(ev.touches[0].clientY);
      };
      const onEnd = () => {
        el.removeEventListener("touchmove", onMove);
        el.removeEventListener("touchend", onEnd);
      };
      el.addEventListener("touchmove", onMove, { passive: false });
      el.addEventListener("touchend", onEnd);
    }, { passive: true });
    el.addEventListener("wheel", (e) => {
      e.preventDefault();
      setParam(param, p[param] - e.deltaY / 600);
    }, { passive: false });
    el.addEventListener("dblclick", () => setParam(param, DEFAULTS[param]));
    el.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 0.1 : 0.02;
      const map = { ArrowUp: step, ArrowRight: step, ArrowDown: -step, ArrowLeft: -step };
      if (e.key in map) {
        e.preventDefault();
        e.stopPropagation();
        setParam(param, p[param] + map[e.key]);
      } else if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        setParam(param, e.key === "Home" ? 0 : 1);
      }
    });
    setParam(param, DEFAULTS[param]);
  });

  function setWave(wave) {
    audio.set("wave", wave);
    document.querySelectorAll("#waves button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.wave === wave)));
    svg.querySelector(".synth-wave").setAttribute("d", WAVE_PATHS[wave]);
    svg.querySelector(".synth-readout").textContent = `${WAVE_NAMES[wave]} · 7 VOICES`;
  }

  function tween(target) {
    const from = { ...p };
    const t0 = performance.now();
    const dur = window.Motion.reduced ? 0 : 520;
    setWave(target.wave);
    (function step(now) {
      const t = dur ? Math.min(1, (now - t0) / dur) : 1;
      const e = 1 - Math.pow(1 - t, 3);
      Object.keys(DEFAULTS).forEach((k) => setParam(k, from[k] + (target[k] - from[k]) * e));
      if (t < 1) requestAnimationFrame(step);
    })(t0);
  }

  document.querySelectorAll(".preset").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll(".preset").forEach((x) => x.setAttribute("aria-checked", String(x === b)));
    tween(PRESETS[b.dataset.preset]);
  }));
  document.querySelectorAll("#waves button").forEach((b) => b.addEventListener("click", () => setWave(b.dataset.wave)));

  function setOctave(o) {
    [...held.keys()].forEach(release);
    octave = Math.max(2, Math.min(6, o));
    document.getElementById("octave").textContent = `Октава ${octave}`;
  }
  document.getElementById("oct-down").addEventListener("click", () => setOctave(octave - 1));
  document.getElementById("oct-up").addEventListener("click", () => setOctave(octave + 1));

  function light(note, on) {
    svg.querySelectorAll(`.synth-key[data-note="${note}"]`).forEach((k) => k.classList.toggle("is-on", on));
  }

  function press(note, source) {
    if (held.has(note)) return;
    held.set(note, source);
    audio.start(note);
    light(note, true);
    const names = [...held.keys()].sort((a, b) => a - b).map((n) => `${NAMES[n % 12]}${Math.floor(n / 12) - 1}`);
    document.getElementById("readout").textContent = names.join(" · ");
  }

  function release(note) {
    if (!held.has(note)) return;
    held.delete(note);
    audio.stop(note);
    light(note, false);
    const names = [...held.keys()].sort((a, b) => a - b).map((n) => `${NAMES[n % 12]}${Math.floor(n / 12) - 1}`);
    document.getElementById("readout").textContent = names.length ? names.join(" · ") : "Сыграйте ноту";
  }

  let mouseDown = false;
  svg.addEventListener("mousedown", (e) => {
    const key = e.target.closest(".synth-key");
    if (!key) return;
    e.preventDefault();
    mouseDown = true;
    press(Number(key.dataset.note), "mouse");
  });
  svg.addEventListener("mouseover", (e) => {
    if (!mouseDown) return;
    const key = e.target.closest(".synth-key");
    if (!key) return;
    [...held].forEach(([n, src]) => src === "mouse" && release(n));
    press(Number(key.dataset.note), "mouse");
  });
  document.addEventListener("mouseup", () => {
    mouseDown = false;
    [...held].forEach(([n, src]) => src === "mouse" && release(n));
  });
  svg.addEventListener("touchstart", (e) => {
    const key = e.target.closest(".synth-key");
    if (!key) return;
    e.preventDefault();
    press(Number(key.dataset.note), "touch");
  }, { passive: false });
  svg.addEventListener("touchend", () => [...held].forEach(([n, src]) => src === "touch" && release(n)));

  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    const key = CODE_KEYS[e.code];
    if (key) return press(NOTE_KEYS[key] + (octave - 4) * 12, `key:${e.code}`);
    if (e.code === "KeyZ") return setOctave(octave - 1);
    if (e.code === "KeyX") return setOctave(octave + 1);
    const wave = { Digit1: "sine", Digit2: "triangle", Digit3: "sawtooth", Digit4: "square" }[e.code];
    if (wave) setWave(wave);
  });
  document.addEventListener("keyup", (e) => {
    [...held].forEach(([n, src]) => src === `key:${e.code}` && release(n));
  });
  window.addEventListener("blur", () => [...held.keys()].forEach(release));

  drawScope(document.getElementById("scope"), audio, "#ff9f0a");
  setWave("sawtooth");
})();
