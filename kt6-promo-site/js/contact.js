function fieldError(name, value) {
  const text = value.trim();
  if (name === 'name') return /^[\p{L} -]{2,}$/u.test(text) ? '' : 'Имя: минимум 2 буквы';
  if (name === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text) ? '' : 'Email в формате name@mail.ru';
  if (name === 'message') return text.length >= 10 ? '' : 'Сообщение: ещё ' + (10 - text.length) + ' симв.';
  return '';
}

function start() {
  const form = document.getElementById('contact-form');
  const inputs = Array.from(form.querySelectorAll('input, textarea'));
  const bar = document.getElementById('progress-bar');
  const label = document.getElementById('progress-label');
  const zone = document.getElementById('magnet-zone');
  const button = document.getElementById('send');
  const success = document.getElementById('success');
  const touched = new Set();
  const shakes = new Map();
  const progress = { value: 0, target: 0 };
  const magnet = { x: 0, y: 0, targetX: 0, targetY: 0 };

  const run = animationLoop((time) => {
    progress.value = approach(progress.value, progress.target, 0.1);
    bar.style.transform = 'scaleX(' + progress.value + ')';
    label.textContent = Math.round(progress.value * 100) + '%';

    magnet.x = approach(magnet.x, magnet.targetX, 0.15);
    magnet.y = approach(magnet.y, magnet.targetY, 0.15);
    button.style.transform = 'translate(' + magnet.x + 'px, ' + magnet.y + 'px)';

    shakes.forEach((startTime, field) => {
      const elapsed = time - startTime;
      if (elapsed >= 500) {
        field.style.transform = '';
        shakes.delete(field);
      } else {
        field.style.transform = 'translateX(' + Math.sin(elapsed / 25) * 10 * (1 - elapsed / 500) + 'px)';
      }
    });

    return shakes.size > 0 || progress.value !== progress.target || magnet.x !== magnet.targetX || magnet.y !== magnet.targetY;
  });

  function check(input) {
    const error = fieldError(input.name, input.value);
    const field = input.closest('.field');
    const visible = touched.has(input) && error !== '';
    field.querySelector('.error').textContent = visible ? error : '';
    field.classList.toggle('field--ok', error === '');
    field.classList.toggle('field--bad', visible);
    return error === '';
  }

  function updateProgress() {
    progress.target = inputs.filter((input) => fieldError(input.name, input.value) === '').length / inputs.length;
    run();
  }

  inputs.forEach((input) => {
    input.addEventListener('keyup', (event) => {
      if (event.key === 'Tab' || event.key === 'Shift') return;
      touched.add(input);
      success.textContent = '';
      check(input);
      updateProgress();
    });
    input.addEventListener('change', () => {
      touched.add(input);
      check(input);
      updateProgress();
    });
  });

  form.elements.message.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) form.requestSubmit();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    inputs.forEach((input) => touched.add(input));
    const invalid = inputs.filter((input) => !check(input));
    if (invalid.length > 0) {
      if (!reduceMotion) invalid.forEach((input) => shakes.set(input.closest('.field'), performance.now()));
      invalid[0].focus();
      run();
      return;
    }
    success.textContent = 'Спасибо, ' + form.elements.name.value.trim() + '! Ответим на ' + form.elements.email.value.trim() + ' в течение дня.';
    form.reset();
    touched.clear();
    inputs.forEach(check);
    updateProgress();
  });

  zone.addEventListener('mousemove', (event) => {
    const rect = zone.getBoundingClientRect();
    magnet.targetX = (event.clientX - (rect.left + rect.width / 2)) * 0.25;
    magnet.targetY = (event.clientY - (rect.top + rect.height / 2)) * 0.25;
    run();
  });

  zone.addEventListener('mouseleave', () => {
    magnet.targetX = 0;
    magnet.targetY = 0;
    run();
  });
}

if (typeof document === 'undefined') module.exports = { fieldError };
else start();
