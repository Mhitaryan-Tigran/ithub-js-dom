(function () {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const subscribers = [];
  let target = window.scrollY;
  let smooth = target;
  let running = false;

  function mapRange(value, inA, inB, outA, outB) {
    const t = Math.max(0, Math.min(1, (value - inA) / (inB - inA)));
    return outA + t * (outB - outA);
  }

  function progress(el, scroll) {
    const start = el.offsetTop;
    const end = start + el.offsetHeight - window.innerHeight;
    return end <= start ? 0 : Math.max(0, Math.min(1, (scroll - start) / (end - start)));
  }

  function tick() {
    smooth += (target - smooth) * (reduced ? 1 : 0.1);
    if (Math.abs(target - smooth) < 0.1) smooth = target;
    subscribers.forEach((fn) => fn(smooth));
    if (smooth !== target) requestAnimationFrame(tick);
    else running = false;
  }

  function wake() {
    if (!running) {
      running = true;
      requestAnimationFrame(tick);
    }
  }

  window.addEventListener("scroll", () => {
    target = window.scrollY;
    wake();
  }, { passive: true });
  window.addEventListener("resize", () => {
    target = window.scrollY;
    wake();
  });

  function onScroll(fn) {
    subscribers.push(fn);
    fn(smooth);
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  const themed = [...document.querySelectorAll("[data-theme='dark']")];
  if (themed.length) {
    onScroll(() => {
      const mid = window.innerHeight * 0.5;
      const dark = themed.some((el) => {
        const r = el.getBoundingClientRect();
        return r.top < mid && r.bottom > mid;
      });
      document.body.classList.toggle("is-dark", dark);
    });
  }

  function countUp(el) {
    const end = Number(el.dataset.count);
    const decimals = (el.dataset.count.split(".")[1] || "").length;
    if (reduced) {
      el.textContent = end.toFixed(decimals).replace(".", ",");
      return;
    }
    const t0 = performance.now();
    const dur = 1400;
    (function step(now) {
      const t = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - t, 4);
      el.textContent = (end * eased).toFixed(decimals).replace(".", ",");
      if (t < 1) requestAnimationFrame(step);
    })(t0);
  }
  const counters = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        countUp(e.target);
        counters.unobserve(e.target);
      }
    });
  }, { threshold: 0.6 });
  document.querySelectorAll("[data-count]").forEach((el) => counters.observe(el));

  window.Motion = { reduced, mapRange, progress, onScroll };
})();
