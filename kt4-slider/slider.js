const preview = document.getElementById('preview');
const compareBtn = document.getElementById('compareBtn');
const resetBtn = document.getElementById('resetBtn');
const presetsBox = document.getElementById('presets');

const presets = {
  none: { exposure: 0, contrast: 0, saturation: 100, temperature: 0, vignette: 0, grain: 0 },
  cinema: { exposure: -8, contrast: 28, saturation: 85, temperature: -12, vignette: 45, grain: 20 },
  warm: { exposure: 10, contrast: 8, saturation: 125, temperature: 38, vignette: 20, grain: 0 },
  cold: { exposure: 4, contrast: 18, saturation: 70, temperature: -40, vignette: 30, grain: 10 },
  film: { exposure: 6, contrast: -14, saturation: 110, temperature: 16, vignette: 60, grain: 60 }
};

const sliders = {};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function snap(value, min, step) {
  return min + Math.round((value - min) / step) * step;
}

function formatValue(value, bipolar, suffix) {
  const sign = bipolar && value > 0 ? '+' : '';
  return sign + value + suffix;
}

function createSlider(root) {
  const min = Number(root.dataset.min);
  const max = Number(root.dataset.max);
  const step = Number(root.dataset.step) || 1;
  const initial = Number(root.dataset.value);
  const suffix = root.dataset.suffix || '';
  const bipolar = 'bipolar' in root.dataset;
  let value = initial;

  const slider = document.createElement('div');
  slider.className = 'slider';
  slider.tabIndex = 0;
  slider.setAttribute('role', 'slider');
  slider.setAttribute('aria-label', root.querySelector('.control-name').textContent);
  slider.setAttribute('aria-valuemin', min);
  slider.setAttribute('aria-valuemax', max);

  const track = document.createElement('div');
  track.className = 'slider-track';
  const fill = document.createElement('div');
  fill.className = 'slider-fill';
  track.appendChild(fill);

  if (bipolar) {
    const center = document.createElement('div');
    center.className = 'slider-center';
    track.appendChild(center);
  }

  if ('ticks' in root.dataset) {
    const ticks = document.createElement('div');
    ticks.className = 'slider-ticks';
    for (let v = min; v <= max; v += step) {
      const tick = document.createElement('span');
      tick.className = 'slider-tick';
      tick.style.left = ((v - min) / (max - min)) * 100 + '%';
      ticks.appendChild(tick);
    }
    slider.appendChild(ticks);
  }

  const thumb = document.createElement('div');
  thumb.className = 'slider-thumb';
  const bubble = document.createElement('div');
  bubble.className = 'slider-bubble';
  thumb.appendChild(bubble);

  slider.appendChild(track);
  slider.appendChild(thumb);
  root.appendChild(slider);

  function render() {
    const percent = ((value - min) / (max - min)) * 100;
    thumb.style.left = percent + '%';
    bubble.textContent = formatValue(value, bipolar, suffix);
    slider.setAttribute('aria-valuenow', value);
    slider.setAttribute('aria-valuetext', bubble.textContent);
    root.classList.toggle('is-changed', value !== initial);
    if (bipolar) {
      fill.style.left = Math.min(50, percent) + '%';
      fill.style.width = Math.abs(percent - 50) + '%';
    } else {
      fill.style.left = '0';
      fill.style.width = percent + '%';
    }
  }

  function setValue(next, silent) {
    const snapped = clamp(snap(next, min, step), min, max);
    if (snapped === value) return;
    value = snapped;
    render();
    if (!silent) applyPreview();
  }

  function valueFromX(clientX) {
    const rect = slider.getBoundingClientRect();
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    return min + ratio * (max - min);
  }

  function onMouseDown(event) {
    if (event.button !== 0) return;
    event.preventDefault();
    slider.focus();
    setValue(valueFromX(event.clientX));
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  function onMouseMove(event) {
    slider.classList.add('is-dragging');
    setValue(valueFromX(event.clientX));
  }

  function onMouseUp() {
    slider.classList.remove('is-dragging');
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }

  function onTouchStart(event) {
    event.preventDefault();
    slider.classList.add('is-dragging');
    setValue(valueFromX(event.touches[0].clientX));
  }

  function onTouchMove(event) {
    event.preventDefault();
    setValue(valueFromX(event.touches[0].clientX));
  }

  function onTouchEnd() {
    slider.classList.remove('is-dragging');
  }

  function onDoubleClick() {
    setValue(initial);
  }

  function onKeyDown(event) {
    const big = event.shiftKey ? step * 10 : step;
    const actions = {
      ArrowLeft: value - big,
      ArrowDown: value - big,
      ArrowRight: value + big,
      ArrowUp: value + big,
      PageDown: value - (max - min) / 10,
      PageUp: value + (max - min) / 10,
      Home: min,
      End: max
    };
    if (!(event.key in actions)) return;
    event.preventDefault();
    setValue(actions[event.key]);
  }

  slider.addEventListener('mousedown', onMouseDown);
  slider.addEventListener('dblclick', onDoubleClick);
  slider.addEventListener('keydown', onKeyDown);
  slider.addEventListener('touchstart', onTouchStart, { passive: false });
  slider.addEventListener('touchmove', onTouchMove, { passive: false });
  slider.addEventListener('touchend', onTouchEnd);

  render();

  return {
    get value() { return value; },
    set: setValue,
    reset() { setValue(initial); }
  };
}

function applyPreview() {
  const s = preview.style;
  const temp = sliders.temperature.value;
  s.setProperty('--brightness', (1 + sliders.exposure.value / 100 * 0.6).toFixed(3));
  s.setProperty('--contrast', (1 + sliders.contrast.value / 100 * 0.6).toFixed(3));
  s.setProperty('--saturate', (sliders.saturation.value / 100).toFixed(3));
  s.setProperty('--temp-color', temp >= 0 ? '#ffb257' : '#4f9dff');
  s.setProperty('--temp-alpha', (Math.abs(temp) / 50 * 0.9).toFixed(3));
  s.setProperty('--vignette', (sliders.vignette.value / 100).toFixed(3));
  s.setProperty('--grain', (sliders.grain.value / 100 * 0.6).toFixed(3));
  markPreset();
}

function markPreset() {
  const current = Object.keys(presets).find(name =>
    Object.keys(presets[name]).every(id => presets[name][id] === sliders[id].value)
  );
  presetsBox.querySelectorAll('.chip').forEach(chip => {
    chip.classList.toggle('is-active', chip.dataset.preset === current);
  });
}

function applyPreset(name) {
  const values = presets[name];
  Object.keys(values).forEach(id => sliders[id].set(values[id], true));
  applyPreview();
}

function onPresetClick(event) {
  const chip = event.target.closest('.chip');
  if (chip) applyPreset(chip.dataset.preset);
}

function showOriginal(event) {
  event.preventDefault();
  preview.classList.add('is-original');
  compareBtn.classList.add('is-held');
}

function hideOriginal() {
  preview.classList.remove('is-original');
  compareBtn.classList.remove('is-held');
}

document.querySelectorAll('.control').forEach(root => {
  sliders[root.dataset.id] = createSlider(root);
});

presetsBox.addEventListener('click', onPresetClick);
resetBtn.addEventListener('click', () => applyPreset('none'));
compareBtn.addEventListener('mousedown', showOriginal);
compareBtn.addEventListener('mouseup', hideOriginal);
compareBtn.addEventListener('mouseleave', hideOriginal);
compareBtn.addEventListener('touchstart', showOriginal, { passive: false });
compareBtn.addEventListener('touchend', hideOriginal);
preview.addEventListener('mousedown', showOriginal);
preview.addEventListener('mouseup', hideOriginal);
preview.addEventListener('mouseleave', hideOriginal);

applyPreview();
