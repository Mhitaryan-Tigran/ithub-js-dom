(function () {
  const { FINISHES, render } = window.Volna;
  const reduced = window.Motion.reduced;
  const order = ["aluminum", "graphite", "sand", "night"];
  const KITS = { standard: "Стандарт", studio: "Студия" };
  const state = { finish: "aluminum", kit: "standard", qty: 1 };
  let shownTotal = 0;

  const synth = document.getElementById("synth");
  const swatches = document.getElementById("swatches");

  function money(n) {
    return `${Math.round(n).toLocaleString("ru-RU").replace(/ /g, " ")} ₽`;
  }

  function price() {
    return Number(document.querySelector(`.kit[data-kit="${state.kit}"]`).dataset.price) * state.qty;
  }

  function animateTotal() {
    const from = shownTotal;
    const to = price();
    const t0 = performance.now();
    const dur = reduced || !from ? 0 : 600;
    (function step(now) {
      const t = dur ? Math.min(1, (now - t0) / dur) : 1;
      const v = from + (to - from) * (1 - Math.pow(1 - t, 3));
      document.getElementById("total").textContent = money(v);
      if (t < 1) requestAnimationFrame(step);
      else shownTotal = to;
    })(t0);
    document.getElementById("monthly").textContent = `или ${money(Math.ceil(to / 12))}/мес. на 12 месяцев`;
  }

  function label() {
    document.getElementById("stage-name").textContent = `${FINISHES[state.finish].name} · ${KITS[state.kit]}${state.qty > 1 ? ` · ${state.qty} шт.` : ""}`;
  }

  function setFinish(key) {
    if (key === state.finish && synth.innerHTML) return;
    state.finish = key;
    synth.innerHTML = render(key);
    synth.classList.remove("swap");
    void synth.offsetWidth;
    synth.classList.add("swap");
    swatches.querySelectorAll(".swatch").forEach((s) => s.setAttribute("aria-checked", String(s.dataset.finish === key)));
    label();
  }

  order.forEach((key) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "swatch";
    b.dataset.finish = key;
    b.setAttribute("role", "radio");
    b.style.setProperty("--c", `linear-gradient(160deg, ${FINISHES[key].top}, ${FINISHES[key].bottom})`);
    b.innerHTML = `<i></i>${FINISHES[key].name}`;
    b.addEventListener("click", () => setFinish(key));
    swatches.append(b);
  });

  document.querySelectorAll(".kit").forEach((k) => k.addEventListener("click", () => {
    state.kit = k.dataset.kit;
    document.querySelectorAll(".kit").forEach((x) => x.setAttribute("aria-checked", String(x === k)));
    label();
    animateTotal();
  }));

  function setQty(n) {
    state.qty = Math.max(1, Math.min(5, n));
    const out = document.getElementById("qty");
    out.textContent = state.qty;
    out.classList.remove("bump");
    void out.offsetWidth;
    out.classList.add("bump");
    document.getElementById("minus").disabled = state.qty === 1;
    document.getElementById("plus").disabled = state.qty === 5;
    label();
    animateTotal();
  }
  document.getElementById("minus").addEventListener("click", () => setQty(state.qty - 1));
  document.getElementById("plus").addEventListener("click", () => setQty(state.qty + 1));

  const stage = document.getElementById("stage");
  let angle = 0;
  let velocity = 0;
  let dragging = false;
  let lastX = 0;
  let raf = 0;

  function apply() {
    synth.style.transform = `rotateY(${angle.toFixed(2)}deg) rotateX(${(Math.abs(angle) * 0.12).toFixed(2)}deg)`;
  }

  function settle() {
    cancelAnimationFrame(raf);
    (function step() {
      const force = -angle * 0.06;
      velocity = (velocity + force) * 0.86;
      angle += velocity;
      apply();
      if (Math.abs(angle) > 0.05 || Math.abs(velocity) > 0.05) raf = requestAnimationFrame(step);
      else {
        angle = 0;
        apply();
      }
    })();
  }

  function begin(x) {
    dragging = true;
    lastX = x;
    velocity = 0;
    cancelAnimationFrame(raf);
    stage.classList.add("is-dragging");
  }
  function move(x) {
    if (!dragging) return;
    const dx = x - lastX;
    lastX = x;
    velocity = dx * 0.25;
    angle = Math.max(-32, Math.min(32, angle + dx * 0.25));
    apply();
  }
  function end() {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove("is-dragging");
    if (reduced) {
      angle = 0;
      apply();
    } else settle();
  }

  stage.addEventListener("mousedown", (e) => {
    e.preventDefault();
    begin(e.clientX);
  });
  document.addEventListener("mousemove", (e) => move(e.clientX));
  document.addEventListener("mouseup", end);
  stage.addEventListener("touchstart", (e) => begin(e.touches[0].clientX), { passive: true });
  stage.addEventListener("touchmove", (e) => move(e.touches[0].clientX), { passive: true });
  stage.addEventListener("touchend", end);

  document.addEventListener("keydown", (e) => {
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || e.metaKey || e.ctrlKey) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const i = order.indexOf(state.finish);
      const next = order[(i + (e.key === "ArrowRight" ? 1 : order.length - 1)) % order.length];
      setFinish(next);
      if (!reduced) {
        velocity = e.key === "ArrowRight" ? -6 : 6;
        settle();
      }
    }
    if (e.key === "+" || e.key === "=") setQty(state.qty + 1);
    if (e.key === "-" || e.key === "_") setQty(state.qty - 1);
  });

  const form = document.getElementById("order");
  document.getElementById("checkout").addEventListener("click", () => {
    form.hidden = false;
    form.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    setTimeout(() => form.elements.name.focus({ preventScroll: true }), reduced ? 0 : 400);
  });

  const RULES = {
    name: (v) => (v.trim().length >= 2 ? "" : "Как к вам обращаться?"),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Проверьте адрес почты"),
    city: (v) => (v.trim().length >= 2 ? "" : "Укажите город"),
  };

  function check(input, force) {
    const field = input.closest(".field");
    field.classList.toggle("has-value", Boolean(input.value));
    const message = RULES[input.name](input.value);
    const show = force || field.dataset.touched;
    field.querySelector("em").textContent = show ? message : "";
    field.classList.toggle("is-invalid", Boolean(show && message));
    input.setAttribute("aria-invalid", String(Boolean(show && message)));
    return !message;
  }

  form.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => check(input));
    input.addEventListener("blur", () => {
      if (input.value) input.closest(".field").dataset.touched = "1";
      check(input);
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const inputs = [...form.querySelectorAll("input")];
    const bad = inputs.filter((i) => !check(i, true));
    if (bad.length) return bad[0].focus();
    const number = `В7-${Math.floor(1000 + Math.random() * 9000)}`;
    document.getElementById("done-text").textContent = `ВОЛНА·7, ${FINISHES[state.finish].name.toLowerCase()}, «${KITS[state.kit]}» × ${state.qty}. Город доставки: ${form.elements.city.value.trim()}, привезём завтра. Номер заказа ${number}.`;
    document.getElementById("done").showModal();
    form.reset();
    form.querySelectorAll(".field").forEach((f) => {
      f.classList.remove("has-value", "is-invalid");
      delete f.dataset.touched;
    });
  });

  setFinish("aluminum");
  setQty(1);
})();
