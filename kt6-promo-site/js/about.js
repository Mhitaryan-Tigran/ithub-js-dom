const viewport = document.getElementById('carousel');
const track = document.getElementById('carousel-track');
const slides = track.children;
const dots = Array.from(document.querySelectorAll('#dots button'));

let index = 0;
let offset = 0;
let dragStartX = null;
let dragDelta = 0;

function targetOffset() {
  return -index * viewport.clientWidth + dragDelta;
}

const run = animationLoop(() => {
  offset = dragStartX === null ? approach(offset, targetOffset(), 0.12) : targetOffset();
  track.style.transform = 'translateX(' + offset + 'px)';
  Array.from(slides).forEach((slide, slideIndex) => {
    const distance = Math.min(Math.abs(slideIndex + offset / viewport.clientWidth), 1);
    slide.style.opacity = 1 - distance * 0.5;
    slide.style.transform = 'scale(' + (1 - distance * 0.08) + ')';
  });
  return offset !== targetOffset();
});

function goTo(next) {
  index = (next + slides.length) % slides.length;
  dots.forEach((dot, dotIndex) => dot.setAttribute('aria-current', dotIndex === index));
  run();
}

function startDrag(x) {
  dragStartX = x;
  dragDelta = 0;
  viewport.classList.add('is-dragging');
}

function moveDrag(x) {
  if (dragStartX === null) return;
  dragDelta = x - dragStartX;
  run();
}

function endDrag() {
  if (dragStartX === null) return;
  const delta = dragDelta;
  dragStartX = null;
  dragDelta = 0;
  viewport.classList.remove('is-dragging');
  if (delta < -60) goTo(index + 1);
  else if (delta > 60) goTo(index - 1);
  else run();
}

viewport.addEventListener('mousedown', (event) => {
  event.preventDefault();
  startDrag(event.clientX);
});
document.addEventListener('mousemove', (event) => moveDrag(event.clientX));
document.addEventListener('mouseup', endDrag);

viewport.addEventListener('touchstart', (event) => startDrag(event.touches[0].clientX), { passive: true });
viewport.addEventListener('touchmove', (event) => moveDrag(event.touches[0].clientX), { passive: true });
viewport.addEventListener('touchend', endDrag);

document.getElementById('prev').addEventListener('click', () => goTo(index - 1));
document.getElementById('next').addEventListener('click', () => goTo(index + 1));
dots.forEach((dot, dotIndex) => dot.addEventListener('click', () => goTo(dotIndex)));

document.addEventListener('keydown', (event) => {
  if (ignoreKey(event)) return;
  const number = Number(event.key);
  if (event.key === 'ArrowLeft') goTo(index - 1);
  else if (event.key === 'ArrowRight') goTo(index + 1);
  else if (number >= 1 && number <= slides.length) goTo(number - 1);
  else return;
  event.preventDefault();
});

window.addEventListener('resize', () => {
  offset = targetOffset();
  run();
});

goTo(0);
