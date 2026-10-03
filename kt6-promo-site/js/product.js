const SVG_NS = "http://www.w3.org/2000/svg";
const synth = document.getElementById("synth");
const stage = document.getElementById("stage");
const knobLayer = document.getElementById("knobs");
const keyLayer = document.getElementById("keys");
const readout = document.getElementById("readout");
const swatchBox = document.getElementById("swatches");
const screenText = document.getElementById("screenText");
const screenWave = document.getElementById("screenWave");

const finishes = [
  { name: "Графит", body: "#1b1b1d", panel: "#2a2a2e", ink: "#efe7da" },
  { name: "Слоновая кость", body: "#e9e2d3", panel: "#d8d0bf", ink: "#1b1b1d" },
  { name: "Закат", body: "#ff6a1a", panel: "#e85d12", ink: "#0c0b0a" },
  { name: "Полночь", body: "#15203a", panel: "#1d2c4e", ink: "#ffb347" },
];

const knobDefs = [
  { label: "Cutoff", value: 62, unit: "Гц", scale: (v) => Math.round(200 * Math.pow(40, v / 100)) },
  { label: "Resonance", value: 35, unit: "%", scale: Math.round },
  { label: "Drive", value: 20, unit: "%", scale: Math.round },
  { label: "Mix", value: 50, unit: "%", scale: Math.round },
];

let finishIndex = 0;
let activeKnob = 0;

function el(tag, attrs) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

const whitePattern = [0, 2, 4, 5, 7, 9, 11];
for (let i = 0; i < 29; i++) {
  keyLayer.appendChild(el("rect", { x: 72 + i * 29.5, y: 268, width: 27, height: 150, rx: 3, fill: "#efe7da" }));
}
for (let i = 0; i < 28; i++) {
  const inOctave = i % 7;
  if ([2, 6].includes(inOctave)) continue;
  keyLayer.appendChild(el("rect", { x: 72 + i * 29.5 + 19, y: 268, width: 18, height: 92, rx: 2, fill: "#111" }));
}

const knobNodes = knobDefs.map((def, i) => {
  const cx = 420 + i * 130;
  const cy = 160;
  const g = el("g", { class: "knob", "data-i": i });
  g.appendChild(el("circle", { cx, cy, r: 46, fill: "none", stroke: "#efe7da", "stroke-opacity": ".15", "stroke-width": "1" }));
  g.appendChild(el("circle", { class: "ring", cx, cy, r: 38, fill: "#0a0806", stroke: "#efe7da", "stroke-opacity": ".4", "stroke-width": "2" }));
  const pointer = el("line", { x1: cx, y1: cy, x2: cx, y2: cy - 30, stroke: "#ffb347", "stroke-width": "4", "stroke-linecap": "round" });
  g.appendChild(pointer);
  const arc = el("path", { d: "", fill: "none", stroke: "#ff6a1a", "stroke-width": "3", "stroke-linecap": "round" });
  g.appendChild(arc);
  const label = el("text", { class: "brand", x: cx, y: cy + 72, "text-anchor": "middle", "font-family": "Menlo, monospace", "font-size": "10", "letter-spacing": "2", fill: "#efe7da", opacity: ".7" });
  label.textContent = def.label.toUpperCase();
  g.appendChild(label);
  knobLayer.appendChild(g);
  return { g, pointer, arc, cx, cy };
});

const readRows = knobDefs.map((def) => {
  const row = document.createElement("div");
  row.innerHTML = `<span>${def.label}</span><b></b>`;
  readout.appendChild(row);
  return row;
});

function polar(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function renderKnob(i) {
  const def = knobDefs[i];
  const node = knobNodes[i];
  const angle = -135 + (def.value / 100) * 270;
  node.pointer.setAttribute("transform", `rotate(${angle} ${node.cx} ${node.cy})`);
  const [sx, sy] = polar(node.cx, node.cy, 46, -135);
  const [ex, ey] = polar(node.cx, node.cy, 46, angle);
  const large = angle + 135 > 180 ? 1 : 0;
  node.arc.setAttribute("d", `M${sx} ${sy} A46 46 0 ${large} 1 ${ex} ${ey}`);
  node.g.classList.toggle("is-active", i === activeKnob);
  readRows[i].classList.toggle("is-active", i === activeKnob);
  readRows[i].querySelector("b").textContent = `${def.scale(def.value)} ${def.unit}`;
}

function renderScreen() {
  const cutoff = knobDefs[0].value / 100;
  const res = knobDefs[1].value / 100;
  let d = "";
  for (let x = 0; x <= 212; x += 4) {
    const t = x / 212;
    const y = 183 - Math.sin(t * Math.PI * 2 * (1 + cutoff * 5)) * (8 + res * 22) * Math.exp(-t * (1 - cutoff) * 2);
    d += (x === 0 ? "M" : "L") + (100 + x) + " " + y.toFixed(1) + " ";
  }
  screenWave.setAttribute("d", d);
}

function setKnob(i, value) {
  knobDefs[i].value = Math.max(0, Math.min(100, value));
  renderKnob(i);
  renderScreen();
}

function setActive(i) {
  activeKnob = (i + knobDefs.length) % knobDefs.length;
  knobDefs.forEach((_, k) => renderKnob(k));
}

knobDefs.forEach((_, i) => renderKnob(i));
renderScreen();

knobNodes.forEach((node, i) => {
  node.g.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    setActive(i);
    const startY = e.clientY;
    const startValue = knobDefs[i].value;
    const move = (ev) => setKnob(i, startValue + (startY - ev.clientY) * 0.6);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  });
});

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const rgbToCss = (rgb) => `rgb(${rgb.map(Math.round).join(",")})`;

function morphColor(selector, attr, from, to, duration) {
  const nodes = synth.querySelectorAll(selector);
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  if (RM) {
    nodes.forEach((n) => n.setAttribute(attr, to));
    return;
  }
  const start = performance.now();
  (function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const css = rgbToCss(a.map((c, i) => lerp(c, b[i], eased)));
    nodes.forEach((n) => n.setAttribute(attr, css));
    if (t < 1) requestAnimationFrame(step);
  })(start);
}

function ripple(color, x, y) {
  if (RM) return;
  const r = document.createElement("div");
  r.className = "ripple";
  r.style.background = color;
  r.style.left = `${x}px`;
  r.style.top = `${y}px`;
  document.body.appendChild(r);
  const size = Math.hypot(innerWidth, innerHeight) * 2;
  const start = performance.now();
  (function step(now) {
    const t = Math.min(1, (now - start) / 700);
    const eased = 1 - Math.pow(1 - t, 3);
    r.style.width = r.style.height = `${size * eased}px`;
    r.style.opacity = String(0.35 * (1 - t));
    if (t < 1) requestAnimationFrame(step);
    else r.remove();
  })(start);
}

function setFinish(i, x = innerWidth / 2, y = innerHeight / 2) {
  if (i === finishIndex) return;
  const prev = finishes[finishIndex];
  const next = finishes[i];
  finishIndex = i;
  morphColor(".body", "fill", prev.body, next.body, 700);
  morphColor(".panel", "fill", prev.panel, next.panel, 700);
  morphColor(".brand", "fill", prev.ink, next.ink, 700);
  screenText.textContent = next.name.toUpperCase();
  ripple(next.body, x, y);
  swatches.forEach((s, k) => s.classList.toggle("is-active", k === i));
}

const swatches = finishes.map((f, i) => {
  const b = document.createElement("button");
  b.className = "swatch" + (i === 0 ? " is-active" : "");
  b.style.setProperty("--c", f.body);
  b.title = f.name;
  b.innerHTML = `<i></i><span>${i + 1}</span>`;
  b.addEventListener("click", (e) => setFinish(i, e.clientX, e.clientY));
  swatchBox.appendChild(b);
  return b;
});

window.addEventListener("keydown", (e) => {
  if (e.key >= "1" && e.key <= "4") setFinish(Number(e.key) - 1);
  if (e.key === "ArrowUp") setActive(activeKnob - 1);
  if (e.key === "ArrowDown") setActive(activeKnob + 1);
  if (e.key === "ArrowLeft") setKnob(activeKnob, knobDefs[activeKnob].value - 2);
  if (e.key === "ArrowRight") setKnob(activeKnob, knobDefs[activeKnob].value + 2);
  if (e.key.startsWith("Arrow")) e.preventDefault();
});

let tiltX = 0;
let tiltY = 0;
let targetX = 0;
let targetY = 0;

stage.addEventListener("mousemove", (e) => {
  const rect = stage.getBoundingClientRect();
  targetY = ((e.clientX - rect.left) / rect.width - 0.5) * 18;
  targetX = -((e.clientY - rect.top) / rect.height - 0.5) * 12;
});

stage.addEventListener("mouseleave", () => {
  targetX = 0;
  targetY = 0;
});

if (!RM) {
  (function tickTilt() {
    tiltX = lerp(tiltX, targetX, 0.07);
    tiltY = lerp(tiltY, targetY, 0.07);
    synth.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
    requestAnimationFrame(tickTilt);
  })();
}
