const PRESETS = {
  none: { exposure: 0, contrast: 0, saturation: 100, temperature: 0, vignette: 0, grain: 0 },
  cinema: { exposure: -8, contrast: 28, saturation: 85, temperature: -12, vignette: 45, grain: 20 },
  warm: { exposure: 10, contrast: 8, saturation: 125, temperature: 38, vignette: 20, grain: 0 },
  cold: { exposure: 4, contrast: 18, saturation: 70, temperature: -40, vignette: 30, grain: 10 },
  film: { exposure: 6, contrast: -14, saturation: 110, temperature: 16, vignette: 60, grain: 60 },
};

const sliders = {};
const values = { ...PRESETS.none };
let comparing = false;

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function look(v) {
  const filter = `brightness(${1 + v.exposure / 200}) contrast(${1 + v.contrast / 150}) saturate(${v.saturation / 100})`;
  const t = v.temperature;
  const temp = t === 0 ? "transparent" : t > 0 ? `rgba(255, 140, 40, ${t / 80})` : `rgba(40, 120, 255, ${-t / 80})`;
  return { filter, temp, vignette: v.vignette / 100, grain: v.grain / 160 };
}

function render() {
  const l = look(comparing ? PRESETS.none : values);
  document.getElementById("scene-view").style.filter = l.filter;
  document.getElementById("layer-temp").style.background = l.temp;
  document.getElementById("layer-vignette").style.opacity = l.vignette;
  document.getElementById("layer-grain").style.opacity = l.grain;
  document.getElementById("badge").hidden = !comparing;
  const changed = Object.keys(values).some((k) => values[k] !== PRESETS.none[k]);
  document.getElementById("resetAll").disabled = !changed;
  const current = Object.keys(PRESETS).find((name) => Object.keys(values).every((k) => PRESETS[name][k] === values[k]));
  document.querySelectorAll(".preset").forEach((p) => p.setAttribute("aria-checked", String(p.dataset.preset === current)));
}

function format(s, v) {
  const sign = s.bipolar && v > 0 ? "+" : "";
  return `${sign}${v}${s.suffix}`;
}

function setValue(s, raw, commit = true) {
  const stepped = Math.round((raw - s.min) / s.step) * s.step + s.min;
  const v = clamp(Number(stepped.toFixed(4)), s.min, s.max);
  s.value = v;
  const pct = ((v - s.min) / (s.max - s.min)) * 100;
  s.thumb.style.left = `${pct}%`;
  s.bubble.style.left = `${pct}%`;
  s.bubble.textContent = format(s, v);
  if (s.bipolar) {
    s.fill.style.left = `${Math.min(pct, 50)}%`;
    s.fill.style.width = `${Math.abs(pct - 50)}%`;
  } else {
    s.fill.style.left = "0";
    s.fill.style.width = `${pct}%`;
  }
  s.el.setAttribute("aria-valuenow", v);
  s.el.setAttribute("aria-valuetext", format(s, v));
  s.box.classList.toggle("is-changed", v !== s.initial);
  if (commit) {
    values[s.id] = v;
    render();
  }
}

function fromPointer(s, clientX) {
  const rect = s.el.getBoundingClientRect();
  const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
  return s.min + ratio * (s.max - s.min);
}

function build(box) {
  const d = box.dataset;
  const s = {
    id: d.id,
    box,
    min: Number(d.min),
    max: Number(d.max),
    step: Number(d.step),
    initial: Number(d.value),
    suffix: d.suffix || "",
    bipolar: "bipolar" in d,
  };
  const el = document.createElement("div");
  el.className = "slider";
  el.tabIndex = 0;
  el.setAttribute("role", "slider");
  el.setAttribute("aria-labelledby", `label-${s.id}`);
  el.setAttribute("aria-valuemin", s.min);
  el.setAttribute("aria-valuemax", s.max);
  el.innerHTML = `<div class="slider-track"></div>${s.bipolar ? '<div class="slider-center"></div>' : ""}<div class="slider-fill"></div><div class="slider-thumb"></div><div class="slider-value"></div>`;
  Object.assign(s, { el, fill: el.querySelector(".slider-fill"), thumb: el.querySelector(".slider-thumb"), bubble: el.querySelector(".slider-value") });
  box.append(el);

  const start = (clientX) => {
    el.classList.add("is-dragging");
    document.body.classList.add("is-dragging");
    el.focus({ preventScroll: true });
    setValue(s, fromPointer(s, clientX));
  };
  const stop = () => {
    el.classList.remove("is-dragging");
    document.body.classList.remove("is-dragging");
  };

  el.addEventListener("mousedown", (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    start(event.clientX);
    const move = (e) => setValue(s, fromPointer(s, e.clientX));
    const up = () => {
      stop();
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  });

  el.addEventListener("touchstart", (event) => {
    start(event.touches[0].clientX);
    const move = (e) => {
      e.preventDefault();
      setValue(s, fromPointer(s, e.touches[0].clientX));
    };
    const end = () => {
      stop();
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", end);
    };
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", end);
    el.addEventListener("touchcancel", end);
  }, { passive: true });

  el.addEventListener("dblclick", () => setValue(s, s.initial));
  box.querySelector(".control-reset").addEventListener("click", () => setValue(s, s.initial));

  el.addEventListener("keydown", (event) => {
    const big = event.shiftKey ? 10 : 1;
    const moves = {
      ArrowRight: s.value + s.step * big,
      ArrowUp: s.value + s.step * big,
      ArrowLeft: s.value - s.step * big,
      ArrowDown: s.value - s.step * big,
      PageUp: s.value + s.step * 10,
      PageDown: s.value - s.step * 10,
      Home: s.min,
      End: s.max,
    };
    if (event.key in moves) {
      event.preventDefault();
      setValue(s, moves[event.key]);
    }
  });

  sliders[s.id] = s;
  setValue(s, s.initial);
}

function applyPreset(name) {
  for (const [id, v] of Object.entries(PRESETS[name])) setValue(sliders[id], v, false);
  Object.assign(values, PRESETS[name]);
  render();
}

document.querySelectorAll(".control").forEach(build);

document.querySelectorAll(".preset").forEach((button) => {
  const l = look(PRESETS[button.dataset.preset]);
  button.querySelector("svg").style.filter = l.filter;
  button.querySelector(".t-temp").style.background = l.temp;
  button.querySelector(".t-vig").style.opacity = l.vignette;
  button.addEventListener("click", () => applyPreset(button.dataset.preset));
});

document.getElementById("resetAll").addEventListener("click", () => applyPreset("none"));

const photo = document.getElementById("photo");
const compare = (on) => {
  comparing = on;
  render();
};
photo.addEventListener("mousedown", () => compare(true));
photo.addEventListener("touchstart", () => compare(true), { passive: true });
["mouseup", "mouseleave", "touchend", "touchcancel"].forEach((type) => photo.addEventListener(type, () => comparing && compare(false)));
document.addEventListener("keydown", (event) => {
  if (event.key === "\\" && !event.repeat) compare(true);
});
document.addEventListener("keyup", (event) => {
  if (event.key === "\\") compare(false);
});

render();
