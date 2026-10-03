const wrapEl = document.getElementById("trackWrap");
const track = document.getElementById("track");
const slides = [...track.querySelectorAll(".slide")];
const current = document.getElementById("current");
const progress = document.getElementById("progress");
const SVG_NS = "http://www.w3.org/2000/svg";

const dots = document.getElementById("dots");
for (let y = 40; y < 600; y += 48) {
  for (let x = 40; x < 800; x += 48) {
    const c = document.createElementNS(SVG_NS, "circle");
    c.setAttribute("cx", x);
    c.setAttribute("cy", y);
    c.setAttribute("r", 3);
    c.setAttribute("fill", "#efe7da");
    c.setAttribute("opacity", ".35");
    dots.appendChild(c);
  }
}

const stars = document.getElementById("stars");
for (let i = 0; i < 90; i++) {
  const s = document.createElementNS(SVG_NS, "circle");
  s.setAttribute("cx", Math.random() * 800);
  s.setAttribute("cy", Math.random() * 420);
  s.setAttribute("r", Math.random() * 1.8 + 0.4);
  s.setAttribute("fill", "#efe7da");
  s.setAttribute("opacity", (Math.random() * 0.7 + 0.3).toFixed(2));
  stars.appendChild(s);
}

let index = 0;
let x = 0;
let targetX = 0;
let dragOffset = 0;
let dragging = false;
let startX = 0;
let lastX = 0;
let velocity = 0;

function step() {
  return slides[0].offsetWidth + 24;
}

function centerOffset() {
  return (wrapEl.clientWidth - slides[0].offsetWidth) / 2 - 24;
}

function goTo(i) {
  index = Math.max(0, Math.min(slides.length - 1, i));
  targetX = centerOffset() - index * step();
  current.textContent = String(index + 1).padStart(2, "0");
  progress.style.transform = `translateX(${index * 100}%)`;
  progress.style.width = `${100 / slides.length}%`;
  slides.forEach((s, k) => s.classList.toggle("is-far", k !== index));
}

goTo(0);
window.addEventListener("resize", () => goTo(index));

document.getElementById("prev").addEventListener("click", () => goTo(index - 1));
document.getElementById("next").addEventListener("click", () => goTo(index + 1));

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") goTo(index + 1);
  if (e.key === "ArrowLeft") goTo(index - 1);
  if (e.key === "Home") goTo(0);
  if (e.key === "End") goTo(slides.length - 1);
});

wrapEl.addEventListener("pointerdown", (e) => {
  dragging = true;
  startX = e.clientX;
  lastX = e.clientX;
  velocity = 0;
  wrapEl.classList.add("is-dragging");
  wrapEl.setPointerCapture(e.pointerId);
});

wrapEl.addEventListener("pointermove", (e) => {
  if (!dragging) return;
  dragOffset = e.clientX - startX;
  velocity = e.clientX - lastX;
  lastX = e.clientX;
});

function endDrag() {
  if (!dragging) return;
  dragging = false;
  wrapEl.classList.remove("is-dragging");
  const moved = dragOffset + velocity * 6;
  if (moved < -step() * 0.25) goTo(index + 1);
  else if (moved > step() * 0.25) goTo(index - 1);
  dragOffset = 0;
}

wrapEl.addEventListener("pointerup", endDrag);
wrapEl.addEventListener("pointercancel", endDrag);

const layers = slides.map((s) => [...s.querySelectorAll(".layer")]);
let mouse = { x: 0, y: 0, inside: false };

wrapEl.addEventListener("mousemove", (e) => {
  const r = wrapEl.getBoundingClientRect();
  mouse.x = (e.clientX - r.left) / r.width - 0.5;
  mouse.y = (e.clientY - r.top) / r.height - 0.5;
  mouse.inside = true;
});

wrapEl.addEventListener("mouseleave", () => (mouse.inside = false));

let px = 0;
let py = 0;

(function tick() {
  x = RM ? targetX + dragOffset : lerp(x, targetX + dragOffset, 0.12);
  track.style.transform = `translate3d(${x}px, 0, 0)`;

  const tx = mouse.inside ? mouse.x : 0;
  const ty = mouse.inside ? mouse.y : 0;
  px = RM ? 0 : lerp(px, tx, 0.08);
  py = RM ? 0 : lerp(py, ty, 0.08);
  layers[index].forEach((layer) => {
    const depth = Number(layer.dataset.depth);
    layer.setAttribute("transform", `translate(${(px * 60 * depth).toFixed(2)} ${(py * 40 * depth).toFixed(2)})`);
  });
  requestAnimationFrame(tick);
})();
