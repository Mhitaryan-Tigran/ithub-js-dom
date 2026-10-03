const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function approach(current, target, speed) {
  const next = reduceMotion ? target : current + (target - current) * speed;
  return Math.abs(target - next) < 0.01 ? target : next;
}

function animationLoop(update) {
  let running = false;
  function frame(time) {
    if (update(time)) requestAnimationFrame(frame);
    else running = false;
  }
  return function start() {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  };
}

function ignoreKey(event) {
  if (!(event.target instanceof Element) || event.ctrlKey || event.metaKey || event.altKey) return true;
  if (event.target.closest('input, textarea, select')) return true;
  return event.key === ' ' && event.target.closest('a, button, summary') !== null;
}

const navToggle = document.querySelector('.nav-toggle');
navToggle.addEventListener('click', () => {
  const open = document.body.classList.toggle('nav-open');
  navToggle.setAttribute('aria-expanded', open);
});
