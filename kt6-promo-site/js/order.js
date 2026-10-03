const field = document.getElementById("field");
const fctx = field.getContext("2d");
let particles = [];
let fw = 0;
let fh = 0;
const pointer = { x: -9999, y: -9999 };

function buildField() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  fw = field.clientWidth;
  fh = field.clientHeight;
  field.width = fw * dpr;
  field.height = fh * dpr;
  fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  particles = [];
  const gap = fw < 700 ? 40 : 34;
  for (let y = gap / 2; y < fh; y += gap) {
    for (let x = gap / 2; x < fw; x += gap) {
      particles.push({ hx: x, hy: y, x, y, vx: 0, vy: 0 });
    }
  }
}

window.addEventListener("resize", buildField);
buildField();

window.addEventListener("mousemove", (e) => {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
});

window.addEventListener("mouseleave", () => {
  pointer.x = -9999;
  pointer.y = -9999;
});

function explode(cx, cy) {
  particles.forEach((p) => {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const d = Math.hypot(dx, dy) || 1;
    const force = Math.max(0, 1 - d / Math.max(fw, fh)) * 42 + 6;
    p.vx += (dx / d) * force + (Math.random() - 0.5) * 8;
    p.vy += (dy / d) * force + (Math.random() - 0.5) * 8;
  });
}

function drawField() {
  fctx.clearRect(0, 0, fw, fh);
  particles.forEach((p) => {
    if (!RM) {
      const dx = p.x - pointer.x;
      const dy = p.y - pointer.y;
      const d = Math.hypot(dx, dy);
      if (d < 160) {
        const push = ((160 - d) / 160) * 2.2;
        p.vx += (dx / (d || 1)) * push;
        p.vy += (dy / (d || 1)) * push;
      }
      p.vx += (p.hx - p.x) * 0.02;
      p.vy += (p.hy - p.y) * 0.02;
      p.vx *= 0.88;
      p.vy *= 0.88;
      p.x += p.vx;
      p.y += p.vy;
    }
    const off = Math.min(1, Math.hypot(p.x - p.hx, p.y - p.hy) / 60);
    fctx.fillStyle = off > 0.08 ? `rgba(255,${Math.round(180 - off * 74)},${Math.round(120 - off * 94)},${0.35 + off * 0.65})` : "rgba(239,231,218,0.22)";
    fctx.beginPath();
    fctx.arc(p.x, p.y, 1.4 + off * 2.2, 0, Math.PI * 2);
    fctx.fill();
  });
  requestAnimationFrame(drawField);
}

drawField();

const form = document.getElementById("form");
const bar = document.getElementById("bar");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const messageInput = document.getElementById("message");
const totalEl = document.getElementById("total");
const done = document.getElementById("done");
const doneText = document.getElementById("doneText");
const inputs = [nameInput, emailInput, messageInput];

const rules = {
  name: (v) => v.trim().length >= 2,
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
};

function validate(input, strict) {
  const wrapper = input.closest(".field");
  const rule = rules[input.id];
  if (!rule) return true;
  const ok = rule(input.value);
  wrapper.classList.toggle("is-ok", ok);
  wrapper.classList.toggle("is-bad", !ok && (strict || input.value.length > 0));
  return ok;
}

function updateBar() {
  const filled = [rules.name(nameInput.value), rules.email(emailInput.value), messageInput.value.trim().length > 0].filter(Boolean).length;
  bar.style.transform = `scaleX(${filled / 3})`;
}

inputs.forEach((input) => {
  input.addEventListener("input", () => {
    validate(input, false);
    updateBar();
  });
  input.addEventListener("blur", () => validate(input, false));
});

let shownTotal = 189000;

function tweenTotal(to) {
  const from = shownTotal;
  shownTotal = to;
  if (RM) {
    totalEl.textContent = to.toLocaleString("ru-RU") + " ₽";
    return;
  }
  const start = performance.now();
  (function stepTotal(now) {
    const t = Math.min(1, (now - start) / 600);
    const eased = 1 - Math.pow(1 - t, 3);
    totalEl.textContent = Math.round(lerp(from, to, eased)).toLocaleString("ru-RU") + " ₽";
    if (t < 1) requestAnimationFrame(stepTotal);
  })(start);
}

function currentTotal() {
  const model = document.querySelector("#models .is-active");
  const finish = document.querySelector("#finishes .is-active");
  return Number(model.dataset.price) + Number(finish.dataset.price);
}

document.querySelectorAll(".pills").forEach((group) => {
  group.addEventListener("click", (e) => {
    const pill = e.target.closest(".pill");
    if (!pill) return;
    group.querySelectorAll(".pill").forEach((p) => p.classList.remove("is-active"));
    pill.classList.add("is-active");
    tweenTotal(currentTotal());
  });
});

function drawStroke(path, duration, delay) {
  const length = path.getTotalLength();
  path.style.strokeDasharray = length;
  path.style.strokeDashoffset = length;
  if (RM) {
    path.style.strokeDashoffset = 0;
    return;
  }
  const start = performance.now() + delay;
  (function run(now) {
    const t = Math.max(0, Math.min(1, (now - start) / duration));
    path.style.strokeDashoffset = length * (1 - (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(run);
  })(performance.now());
}

function submit() {
  const okName = validate(nameInput, true);
  const okEmail = validate(emailInput, true);
  if (!okName || !okEmail) {
    (okName ? emailInput : nameInput).focus();
    return;
  }
  const model = document.querySelector("#models .is-active").textContent;
  const finish = document.querySelector("#finishes .is-active").textContent;
  doneText.textContent = `${nameInput.value.trim()}, мы напишем на ${emailInput.value.trim()} про «${model}» в отделке «${finish.toLowerCase()}». Итого ${totalEl.textContent}.`;
  done.classList.add("is-in");
  drawStroke(document.getElementById("doneCircle"), 700, 0);
  drawStroke(document.getElementById("doneCheck"), 500, 500);
  explode(innerWidth / 2, innerHeight / 2);
}

function reset() {
  done.classList.remove("is-in");
  inputs.forEach((input, i) => {
    setTimeout(() => {
      input.value = "";
      input.closest(".field").classList.remove("is-ok", "is-bad");
      updateBar();
    }, RM ? 0 : i * 90);
  });
  nameInput.focus();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  submit();
});

document.getElementById("again").addEventListener("click", reset);

form.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !(e.target === messageInput && !(e.metaKey || e.ctrlKey))) {
    e.preventDefault();
    const i = inputs.indexOf(e.target);
    if (i > -1 && i < inputs.length - 1 && !(e.metaKey || e.ctrlKey)) {
      inputs[i + 1].focus();
    } else {
      submit();
    }
  }
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") reset();
  if (e.key === " " && !["INPUT", "TEXTAREA"].includes(e.target.tagName)) {
    e.preventDefault();
    explode(pointer.x > 0 ? pointer.x : innerWidth / 2, pointer.y > 0 ? pointer.y : innerHeight / 2);
  }
});

document.addEventListener("mousedown", (e) => {
  if (e.target.closest(".form, .contacts, .nav, .hints")) return;
  explode(e.clientX, e.clientY);
});
