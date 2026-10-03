function decimals(step) {
  const fraction = String(step).split('.')[1];
  return fraction ? fraction.length : 0;
}

function snap(value, min, max, step) {
  const lastIndex = Math.floor((max - min) / step + 1e-9);
  const index = Math.min(Math.max(Math.round((value - min) / step), 0), lastIndex);
  return Number((min + index * step).toFixed(decimals(step)));
}

function valueFromX(clientX, trackLeft, trackWidth, min, max, step) {
  return snap(min + ((clientX - trackLeft) / trackWidth) * (max - min), min, max, step);
}

function initSlider(root) {
  const min = Number(root.dataset.min);
  const max = Number(root.dataset.max);
  const step = Number(root.dataset.step || 1);
  const suffix = root.dataset.suffix || '';
  let value = snap(Number(root.dataset.value || min), min, max, step);

  root.innerHTML =
    '<div class="slider__track">' +
      '<div class="slider__fill"></div>' +
      '<div class="slider__thumb" tabindex="0" role="slider"><span class="slider__bubble"></span></div>' +
    '</div>' +
    '<div class="slider__scale"><span></span><span></span></div>';

  const track = root.querySelector('.slider__track');
  const fill = root.querySelector('.slider__fill');
  const thumb = root.querySelector('.slider__thumb');
  const bubble = root.querySelector('.slider__bubble');
  const [minLabel, maxLabel] = root.querySelectorAll('.slider__scale span');

  minLabel.textContent = min.toLocaleString('ru-RU') + suffix;
  maxLabel.textContent = max.toLocaleString('ru-RU') + suffix;
  thumb.setAttribute('aria-label', root.dataset.label || '');
  thumb.setAttribute('aria-valuemin', min);
  thumb.setAttribute('aria-valuemax', max);

  function render() {
    const percent = ((value - min) / (max - min)) * 100;
    fill.style.width = percent + '%';
    thumb.style.left = percent + '%';
    bubble.textContent = value.toLocaleString('ru-RU') + suffix;
    thumb.setAttribute('aria-valuenow', value);
    root.dataset.value = value;
  }

  function moveTo(clientX) {
    const rect = track.getBoundingClientRect();
    value = valueFromX(clientX, rect.left, rect.width, min, max, step);
    render();
  }

  function onMouseMove(event) {
    moveTo(event.clientX);
  }

  function onMouseUp() {
    root.classList.remove('slider--dragging');
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }

  thumb.addEventListener('mousedown', (event) => {
    event.preventDefault();
    thumb.focus();
    root.classList.add('slider--dragging');
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

  track.addEventListener('click', (event) => {
    if (!thumb.contains(event.target)) moveTo(event.clientX);
  });

  thumb.addEventListener('touchstart', (event) => {
    event.preventDefault();
    root.classList.add('slider--dragging');
  }, { passive: false });

  thumb.addEventListener('touchmove', (event) => {
    event.preventDefault();
    moveTo(event.touches[0].clientX);
  }, { passive: false });

  thumb.addEventListener('touchend', () => root.classList.remove('slider--dragging'));

  thumb.addEventListener('keydown', (event) => {
    const moves = { ArrowLeft: -step, ArrowDown: -step, ArrowRight: step, ArrowUp: step, Home: -Infinity, End: Infinity };
    if (!(event.key in moves)) return;
    event.preventDefault();
    value = snap(value + moves[event.key], min, max, step);
    render();
  });

  render();
}

if (typeof document === 'undefined') module.exports = { snap, valueFromX };
else document.querySelectorAll('.slider').forEach(initSlider);
