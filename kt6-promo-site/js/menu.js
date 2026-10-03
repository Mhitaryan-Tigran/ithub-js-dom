function matches(item, query, category) {
  const inCategory = category === 'all' || item.category === category;
  const text = (item.name + ' ' + item.description).toLowerCase();
  return inCategory && text.includes(query.trim().toLowerCase());
}

function start() {
  const search = document.getElementById('search');
  const buttons = Array.from(document.querySelectorAll('.filter'));
  const count = document.getElementById('menu-count');
  const empty = document.getElementById('menu-empty');
  let category = 'all';

  const cards = Array.from(document.querySelectorAll('.item')).map((element) => ({
    element,
    inner: element.querySelector('.item__inner'),
    category: element.dataset.category,
    name: element.querySelector('h3').textContent,
    description: element.querySelector('p').textContent,
    dx: 0,
    dy: 0,
    scale: 1,
    opacity: 1,
    tiltX: 0,
    tiltY: 0,
    targetTiltX: 0,
    targetTiltY: 0
  }));

  const run = animationLoop(() => {
    let moving = false;
    cards.forEach((card) => {
      card.dx = approach(card.dx, 0, 0.16);
      card.dy = approach(card.dy, 0, 0.16);
      card.scale = approach(card.scale, 1, 0.16);
      card.opacity = approach(card.opacity, 1, 0.16);
      card.tiltX = approach(card.tiltX, card.targetTiltX, 0.15);
      card.tiltY = approach(card.tiltY, card.targetTiltY, 0.15);
      card.element.style.transform = 'translate(' + card.dx + 'px, ' + card.dy + 'px) scale(' + card.scale + ')';
      card.element.style.opacity = card.opacity;
      card.inner.style.transform = 'perspective(700px) rotateX(' + card.tiltX + 'deg) rotateY(' + card.tiltY + 'deg)';
      if (card.dx || card.dy || card.scale !== 1 || card.opacity !== 1 || card.tiltX !== card.targetTiltX || card.tiltY !== card.targetTiltY) moving = true;
    });
    return moving;
  });

  function applyFilter() {
    const before = cards.map((card) => card.element.getBoundingClientRect());
    let shown = 0;
    cards.forEach((card) => {
      card.element.hidden = !matches(card, search.value, category);
      if (!card.element.hidden) shown++;
    });
    cards.forEach((card, index) => {
      if (card.element.hidden) return;
      const after = card.element.getBoundingClientRect();
      if (before[index].width === 0) {
        card.scale = 0.6;
        card.opacity = 0;
      } else {
        card.dx += before[index].left - after.left;
        card.dy += before[index].top - after.top;
      }
    });
    count.textContent = 'Показано: ' + shown + ' из ' + cards.length;
    empty.hidden = shown > 0;
    run();
  }

  function selectCategory(name) {
    category = name;
    buttons.forEach((button) => button.setAttribute('aria-pressed', button.dataset.category === name));
    applyFilter();
  }

  buttons.forEach((button) => button.addEventListener('click', () => selectCategory(button.dataset.category)));

  search.addEventListener('input', applyFilter);

  search.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    search.value = '';
    search.blur();
    applyFilter();
  });

  document.addEventListener('keydown', (event) => {
    if (ignoreKey(event)) return;
    const number = Number(event.key);
    if (number >= 1 && number <= buttons.length) {
      selectCategory(buttons[number - 1].dataset.category);
    } else if (event.key === '/') {
      event.preventDefault();
      search.focus();
    } else if (/^\p{L}$/u.test(event.key)) {
      search.focus();
    }
  });

  cards.forEach((card) => {
    card.element.addEventListener('mousemove', (event) => {
      const rect = card.element.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      card.targetTiltY = (x - 0.5) * 18;
      card.targetTiltX = (0.5 - y) * 18;
      card.inner.style.setProperty('--glare-x', x * 100 + '%');
      card.inner.style.setProperty('--glare-y', y * 100 + '%');
      run();
    });
    card.element.addEventListener('mouseleave', () => {
      card.targetTiltX = 0;
      card.targetTiltY = 0;
      run();
    });
  });

  count.textContent = 'Показано: ' + cards.length + ' из ' + cards.length;
}

if (typeof document === 'undefined') module.exports = { matches };
else start();
