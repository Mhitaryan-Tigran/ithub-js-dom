const RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const lerp = (a, b, t) => a + (b - a) * t;

const curtain = document.querySelector(".curtain");

function openCurtain() {
  requestAnimationFrame(() => curtain.classList.add("is-open"));
}

window.addEventListener("pageshow", openCurtain);

document.querySelectorAll('a[href$=".html"]').forEach((link) => {
  link.addEventListener("click", (e) => {
    if (e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    const label = link.dataset.label || link.textContent.trim();
    curtain.querySelector("span").textContent = label;
    curtain.classList.remove("is-open");
    curtain.classList.add("is-closing");
    setTimeout(() => {
      window.location.href = link.getAttribute("href");
    }, RM ? 0 : 620);
  });
});

const page = location.pathname.split("/").pop() || "index.html";
document.querySelectorAll(".menu a").forEach((a) => {
  if (a.getAttribute("href") === page) a.classList.add("is-active");
});

const glow = document.querySelector(".glow");
if (glow && !RM) {
  let gx = innerWidth / 2;
  let gy = innerHeight / 2;
  let tx = gx;
  let ty = gy;
  window.addEventListener("mousemove", (e) => {
    tx = e.clientX;
    ty = e.clientY;
  });
  (function tickGlow() {
    gx = lerp(gx, tx, 0.08);
    gy = lerp(gy, ty, 0.08);
    glow.style.transform = `translate(${gx}px, ${gy}px)`;
    requestAnimationFrame(tickGlow);
  })();
}

window.addEventListener("keydown", (e) => {
  const name = e.key === " " ? "Space" : e.key;
  document.querySelectorAll("kbd").forEach((k) => {
    if (k.dataset.key === name || k.dataset.key === e.code) {
      k.classList.add("is-hit");
    }
  });
});

window.addEventListener("keyup", () => {
  document.querySelectorAll("kbd.is-hit").forEach((k) => k.classList.remove("is-hit"));
});

const revealer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-in");
        revealer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll(".reveal").forEach((el) => revealer.observe(el));

document.querySelectorAll(".display").forEach((title) => {
  const words = title.textContent.trim().split(/\s+/);
  title.innerHTML = "";
  let index = 0;
  words.forEach((word, wi) => {
    const w = document.createElement("span");
    w.className = "word";
    [...word].forEach((char) => {
      const c = document.createElement("span");
      c.className = "ch";
      c.textContent = char;
      c.style.transitionDelay = `${index * 35}ms`;
      index++;
      w.appendChild(c);
    });
    if (title.dataset.accent && title.dataset.accent.split(",").includes(String(wi))) {
      w.classList.add("accent");
    }
    title.appendChild(w);
    if (wi < words.length - 1) title.appendChild(document.createTextNode(" "));
  });
  setTimeout(() => title.classList.add("is-in"), 400);
});

document.querySelectorAll(".ticker div").forEach((row) => {
  row.innerHTML += row.innerHTML;
  if (RM) return;
  let x = 0;
  const half = row.scrollWidth / 2;
  (function tickTicker() {
    x -= 0.6;
    if (-x >= half) x = 0;
    row.style.transform = `translateX(${x}px)`;
    requestAnimationFrame(tickTicker);
  })();
});

function animateNumber(el, to, duration = 1400) {
  const from = 0;
  const suffix = el.dataset.suffix || "";
  const decimals = Number(el.dataset.decimals || 0);
  if (RM) {
    el.textContent = to.toFixed(decimals) + suffix;
    return;
  }
  const start = performance.now();
  (function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = lerp(from, to, eased).toFixed(decimals) + suffix;
    if (t < 1) requestAnimationFrame(step);
  })(start);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    animateNumber(entry.target, Number(entry.target.dataset.to));
    counterObserver.unobserve(entry.target);
  });
});

document.querySelectorAll("[data-to]").forEach((el) => counterObserver.observe(el));
