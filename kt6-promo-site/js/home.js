const scope = document.getElementById("scope");
const ctx2d = scope.getContext("2d");
const piano = document.getElementById("piano");
const keys = [...piano.querySelectorAll(".key")];
const waveforms = ["sawtooth", "square", "triangle", "sine"];
const voices = new Map();

let audio = null;
let master = null;
let filter = null;
let analyser = null;
let waveIndex = 0;
let mouseX = 0.5;
let mouseY = 0.5;
let smoothX = 0.5;
let smoothY = 0.5;
let phase = 0;
let width = 0;
let height = 0;

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  width = scope.clientWidth;
  height = scope.clientHeight;
  scope.width = width * dpr;
  scope.height = height * dpr;
  ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener("resize", resize);
resize();

function ensureAudio() {
  if (audio) return;
  audio = new (window.AudioContext || window.webkitAudioContext)();
  master = audio.createGain();
  master.gain.value = 0.25;
  filter = audio.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 6;
  analyser = audio.createAnalyser();
  analyser.fftSize = 2048;
  filter.connect(master);
  master.connect(analyser);
  analyser.connect(audio.destination);
}

function cutoffFromMouse() {
  return 200 * Math.pow(40, smoothX);
}

function noteOn(key) {
  if (voices.has(key)) return;
  ensureAudio();
  if (audio.state === "suspended") audio.resume();
  const note = Number(key.dataset.note);
  const osc = audio.createOscillator();
  const env = audio.createGain();
  osc.type = waveforms[waveIndex];
  osc.frequency.value = 261.63 * Math.pow(2, note / 12);
  env.gain.setValueAtTime(0, audio.currentTime);
  env.gain.linearRampToValueAtTime(0.5, audio.currentTime + 0.015);
  osc.connect(env);
  env.connect(filter);
  osc.start();
  voices.set(key, { osc, env });
  key.classList.add("is-on");
}

function noteOff(key) {
  const voice = voices.get(key);
  if (!voice) return;
  const t = audio.currentTime;
  voice.env.gain.cancelScheduledValues(t);
  voice.env.gain.setValueAtTime(voice.env.gain.value, t);
  voice.env.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  voice.osc.stop(t + 0.4);
  voices.delete(key);
  key.classList.remove("is-on");
}

const keyByLetter = Object.fromEntries(keys.map((k) => [k.dataset.k, k]));

window.addEventListener("keydown", (e) => {
  if (e.repeat) return;
  if (e.key === "Shift") {
    waveIndex = (waveIndex + 1) % waveforms.length;
    voices.forEach((v) => (v.osc.type = waveforms[waveIndex]));
    document.querySelector(".hero-meta").children[1].innerHTML = `<b>${waveIndex + 1}/4</b> ${{
      sawtooth: "пила",
      square: "меандр",
      triangle: "треугольник",
      sine: "синус",
    }[waveforms[waveIndex]]}`;
    return;
  }
  const key = keyByLetter[e.key.toLowerCase()];
  if (key) noteOn(key);
});

window.addEventListener("keyup", (e) => {
  const key = keyByLetter[e.key.toLowerCase()];
  if (key) noteOff(key);
});

keys.forEach((key) => {
  key.addEventListener("mousedown", () => noteOn(key));
  key.addEventListener("mouseup", () => noteOff(key));
  key.addEventListener("mouseleave", () => noteOff(key));
  key.addEventListener("mouseenter", (e) => {
    if (e.buttons === 1) noteOn(key);
  });
});

window.addEventListener("blur", () => voices.forEach((v, key) => noteOff(key)));

window.addEventListener("mousemove", (e) => {
  mouseX = e.clientX / window.innerWidth;
  mouseY = e.clientY / window.innerHeight;
});

const buffer = new Float32Array(2048);

function drawLine(samples, amp, color, lineWidth, alpha) {
  ctx2d.beginPath();
  for (let i = 0; i < width; i += 2) {
    const s = samples(i / width);
    const y = height * 0.5 + s * amp;
    if (i === 0) ctx2d.moveTo(i, y);
    else ctx2d.lineTo(i, y);
  }
  ctx2d.strokeStyle = color;
  ctx2d.globalAlpha = alpha;
  ctx2d.lineWidth = lineWidth;
  ctx2d.stroke();
  ctx2d.globalAlpha = 1;
}

function frame() {
  smoothX = lerp(smoothX, mouseX, 0.06);
  smoothY = lerp(smoothY, mouseY, 0.06);
  if (filter) filter.frequency.value = cutoffFromMouse();
  ctx2d.clearRect(0, 0, width, height);

  const playing = voices.size > 0 && analyser;
  const amp = height * (0.08 + (1 - smoothY) * 0.3);
  let samples;

  if (playing) {
    analyser.getFloatTimeDomainData(buffer);
    samples = (t) => buffer[Math.floor(t * (buffer.length - 1))] * 1.6;
  } else {
    const freq = 2 + smoothX * 10;
    samples = (t) =>
      Math.sin(t * Math.PI * 2 * freq + phase) * 0.6 +
      Math.sin(t * Math.PI * 2 * freq * 2.01 + phase * 1.7) * 0.25 +
      Math.sin(t * Math.PI * 2 * freq * 0.5 - phase * 0.6) * 0.15;
  }

  drawLine(samples, amp, "#ff6a1a", 14, 0.08);
  drawLine(samples, amp, "#ff6a1a", 5, 0.25);
  drawLine(samples, amp, "#ffb347", 1.5, 1);
  drawLine((t) => samples(t + 0.015), amp * 0.8, "#efe7da", 1, 0.25);

  phase += RM ? 0 : 0.02 + smoothX * 0.03;
  requestAnimationFrame(frame);
}

frame();
