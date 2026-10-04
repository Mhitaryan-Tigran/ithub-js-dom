(function () {
  const { mapRange, progress, onScroll, reduced } = window.Motion;
  const { render, createAudio, drawScope, NOTE_KEYS, CODE_KEYS } = window.Volna;
  const audio = createAudio();
  const WAVES = { sine: "SINE", triangle: "TRI", sawtooth: "SAW", square: "SQUARE" };
  const KEY_OF = Object.fromEntries(Object.entries(NOTE_KEYS).map(([k, n]) => [n, k]));
  const held = new Map();

  const synthBox = document.getElementById("synth");
  synthBox.innerHTML = render("aluminum");
  const svg = synthBox.querySelector("svg");

  function light(note, on) {
    svg.querySelectorAll(`.synth-key[data-note="${note}"]`).forEach((k) => k.classList.toggle("is-on", on));
    document.querySelectorAll(`.mk[data-note="${note}"]`).forEach((k) => k.classList.toggle("is-on", on));
  }

  function press(note, source) {
    if (held.has(note)) return;
    held.set(note, source);
    audio.start(note);
    light(note, true);
  }

  function release(note) {
    if (!held.has(note)) return;
    held.delete(note);
    audio.stop(note);
    light(note, false);
  }

  function setWave(wave) {
    audio.set("wave", wave);
    document.querySelectorAll(".waves button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.wave === wave)));
    svg.querySelector(".synth-readout").textContent = `${WAVES[wave]} · 7 VOICES`;
  }

  const mini = document.getElementById("minikeys");
  const whites = [60, 62, 64, 65, 67, 69, 71, 72];
  const blacks = [61, 63, 66, 68, 70];
  whites.forEach((n) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "mk";
    b.dataset.note = n;
    b.textContent = (KEY_OF[n] || "").toUpperCase();
    b.setAttribute("aria-label", `Нота ${n}, клавиша ${(KEY_OF[n] || "").toUpperCase()}`);
    mini.append(b);
  });
  blacks.forEach((n) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "mk black";
    b.dataset.note = n;
    b.textContent = (KEY_OF[n] || "").toUpperCase();
    b.setAttribute("aria-label", `Нота ${n}, клавиша ${(KEY_OF[n] || "").toUpperCase()}`);
    const left = whites.indexOf(n - 1);
    b.style.left = `${((left + 1) / whites.length) * 100}%`;
    mini.append(b);
  });

  function bindPointer(root, selector) {
    let down = false;
    root.addEventListener("pointerdown", (e) => {
      const key = e.target.closest(selector);
      if (!key) return;
      e.preventDefault();
      down = true;
      root.setPointerCapture?.(e.pointerId);
      press(Number(key.dataset.note), "mouse");
    });
    root.addEventListener("pointermove", (e) => {
      if (!down) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const key = el && el.closest(selector);
      const note = key && root.contains(key) ? Number(key.dataset.note) : null;
      [...held].forEach(([n, src]) => src === "mouse" && n !== note && release(n));
      if (note !== null) press(note, "mouse");
    });
    const up = () => {
      down = false;
      [...held].forEach(([n, src]) => src === "mouse" && release(n));
    };
    root.addEventListener("pointerup", up);
    root.addEventListener("pointercancel", up);
    root.addEventListener("lostpointercapture", up);
  }
  bindPointer(svg, ".synth-key");
  bindPointer(mini, ".mk");

  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    const key = CODE_KEYS[e.code];
    if (key) {
      press(NOTE_KEYS[key], "keyboard");
      return;
    }
    const wave = { Digit1: "sine", Digit2: "triangle", Digit3: "sawtooth", Digit4: "square" }[e.code];
    if (wave) setWave(wave);
  });
  document.addEventListener("keyup", (e) => {
    const key = CODE_KEYS[e.code];
    if (key) release(NOTE_KEYS[key]);
  });
  window.addEventListener("blur", () => [...held.keys()].forEach(release));

  document.querySelectorAll(".waves button").forEach((b) => b.addEventListener("click", () => setWave(b.dataset.wave)));
  drawScope(document.getElementById("scope"), audio, "#ff9f0a");

  const chapter = document.getElementById("chapter");
  const product = document.getElementById("product");
  const callouts = [...document.querySelectorAll(".callout")];
  const wipe = document.getElementById("wipe");
  const lines = [...document.querySelectorAll(".wipe-line")];
  lines.forEach((l) => (l.dataset.text = l.textContent.trim()));
  const pinned = matchMedia("(min-width: 835px)");

  onScroll((y) => {
    if (pinned.matches) {
      const p = progress(chapter, y);
      const scale = mapRange(p, 0, 0.5, 0.84, 1.04);
      const ty = mapRange(p, 0, 0.5, 60, 0) + mapRange(p, 0.8, 1, 0, -40);
      const fade = mapRange(p, 0.85, 1, 1, 0.4);
      product.style.transform = `translateY(${ty.toFixed(1)}px) scale(${scale.toFixed(3)})`;
      product.style.opacity = fade.toFixed(3);
      callouts.forEach((c) => c.classList.toggle("is-on", p >= Number(c.dataset.at) && p < 0.92));
    } else {
      product.style.transform = "";
      product.style.opacity = "";
    }
    const w = progress(wipe, y);
    lines.forEach((l, i) => l.style.setProperty("--p", mapRange(w, i * 0.22, i * 0.22 + 0.36, 0, 1).toFixed(3)));
  });

  const tilt = document.getElementById("tilt");
  if (!reduced && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const scene = document.querySelector(".scene");
    scene.addEventListener("mousemove", (e) => {
      const r = scene.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = `perspective(1600px) rotateY(${(x * 8).toFixed(2)}deg) rotateX(${(-y * 6).toFixed(2)}deg)`;
    });
    scene.addEventListener("mouseleave", () => (tilt.style.transform = ""));
  }

  setWave("sawtooth");
})();
