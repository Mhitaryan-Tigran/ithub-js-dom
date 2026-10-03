const BANKS = {
  sber: { name: 'Сбербанк', chip: 'linear-gradient(135deg, #24c45e, #0f8d40)' },
  tbank: { name: 'Т-Банк', chip: 'linear-gradient(135deg, #3a3a3c, #111)' },
  alfa: { name: 'Альфа-Банк', chip: 'linear-gradient(135deg, #ff6a5e, #c01f12)' },
  vtb: { name: 'ВТБ', chip: 'linear-gradient(135deg, #2a6cff, #0c2f9a)' },
  gpb: { name: 'Газпромбанк', chip: 'linear-gradient(135deg, #2e86ea, #0f3e94)' }
};

const SYSTEMS = {
  mir: { name: 'Мир', prefix: /^2/ },
  visa: { name: 'Visa', prefix: /^4/ },
  mastercard: { name: 'Mastercard', prefix: /^5/ },
  unionpay: { name: 'UnionPay', prefix: /^62/ }
};

const MESSAGES = {
  bank: 'Выберите банк',
  system: 'Выберите платёжную систему',
  number: 'Номер состоит из 16 цифр',
  holder: 'Имя и фамилия латиницей, минимум два символа',
  expiry: 'Укажите месяц и год',
  expired: 'Срок действия карты уже истёк'
};

const form = document.getElementById('card-form');
const fields = form.elements;
const stage = document.getElementById('stage');
const card = document.getElementById('card');
const cardBank = document.getElementById('card-bank');
const cardNumber = document.getElementById('card-number');
const cardHolder = document.getElementById('card-holder');
const cardExpiry = document.getElementById('card-expiry');
const cardSystem = document.getElementById('card-system');
const counter = document.getElementById('number-counter');
const systemHint = document.getElementById('system-hint');
const rows = document.getElementById('rows');
const tableWrap = document.querySelector('.vault__table-wrap');
const vaultCount = document.getElementById('vault-count');
const status = document.getElementById('status');

let detectedSystem = '';

function fillOptions(select, items) {
  for (const [value, label] of items) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    select.append(option);
  }
}

function digitsOnly(text) {
  return text.replace(/\D/g, '').slice(0, 16);
}

function groupByFour(digits) {
  return digits.replace(/(.{4})(?=.)/g, '$1 ');
}

function caretAfter(digitCount) {
  return digitCount + Math.floor(Math.max(digitCount - 1, 0) / 4);
}

function cleanHolder(text) {
  return text.toUpperCase().replace(/[^A-Z\s]/g, '').replace(/\s{2,}/g, ' ').trimStart();
}

function maskNumber(digits) {
  return `${digits.slice(0, 4)} •••• •••• ${digits.slice(-4)}`;
}

function detectSystem(digits) {
  return Object.keys(SYSTEMS).find((key) => SYSTEMS[key].prefix.test(digits)) || '';
}

function logo(prefix, key) {
  return `<svg aria-hidden="true"><use href="#${prefix}-${key}"></use></svg>`;
}

function formatNumberInput(input) {
  const caretDigits = digitsOnly(input.value.slice(0, input.selectionStart)).length;
  const digits = digitsOnly(input.value);
  input.value = groupByFour(digits);
  const caret = caretAfter(caretDigits);
  input.setSelectionRange(caret, caret);
  counter.textContent = `${digits.length} / 16`;
  return digits;
}

function formatHolderInput(input) {
  const caretChars = cleanHolder(input.value.slice(0, input.selectionStart)).length;
  input.value = cleanHolder(input.value);
  input.setSelectionRange(caretChars, caretChars);
  return input.value.trim();
}

function syncSystemFromNumber(digits) {
  const found = detectSystem(digits);
  if (found === detectedSystem) return;
  detectedSystem = found;
  if (found) {
    fields.system.value = found;
    systemHint.textContent = `Определено по номеру: ${SYSTEMS[found].name}`;
    renderSystem(found);
    validateField('system');
  } else {
    systemHint.textContent = '';
  }
}

function renderBank(key) {
  card.dataset.bank = key;
  cardBank.innerHTML = key ? logo('logo', key) : '<span class="card__bank-placeholder">Ваш банк</span>';
}

function renderSystem(key) {
  cardSystem.innerHTML = key ? logo('sys', key) : '';
}

function renderNumber(digits) {
  const padded = digits.padEnd(16, '•');
  cardNumber.innerHTML = padded
    .match(/.{4}/g)
    .map((group) => {
      const typed = group.replace(/•/g, '');
      const rest = group.slice(typed.length);
      return `<span>${typed}${rest ? `<span class="is-dim">${rest}</span>` : ''}</span>`;
    })
    .join('');
}

function renderHolder(value) {
  cardHolder.textContent = value || 'ИМЯ ФАМИЛИЯ';
  cardHolder.classList.toggle('is-dim', !value);
}

function renderExpiry(month, year) {
  const hasValue = month || year;
  cardExpiry.textContent = `${month || 'ММ'}/${year ? year.slice(2) : 'ГГ'}`;
  cardExpiry.classList.toggle('is-dim', !hasValue);
}

function readForm() {
  return {
    bank: fields.bank.value,
    system: fields.system.value,
    number: digitsOnly(fields.number.value),
    holder: fields.holder.value.trim(),
    month: fields.month.value,
    year: fields.year.value
  };
}

function validate(data, now = new Date()) {
  const errors = {};
  if (!data.bank) errors.bank = MESSAGES.bank;
  if (!SYSTEMS[data.system]) errors.system = MESSAGES.system;
  if (data.number.length !== 16) errors.number = MESSAGES.number;
  if (data.holder.replace(/\s/g, '').length < 2) errors.holder = MESSAGES.holder;
  if (!data.month || !data.year) {
    errors.expiry = MESSAGES.expiry;
  } else {
    const lastDay = new Date(Number(data.year), Number(data.month), 0, 23, 59, 59);
    if (lastDay < now) errors.expiry = MESSAGES.expired;
  }
  return errors;
}

function fieldBox(name) {
  const key = name === 'month' || name === 'year' ? 'expiry' : name;
  return { key, box: document.getElementById(`${key}-error`).closest('.field') };
}

function showError(name, message) {
  const { key, box } = fieldBox(name);
  document.getElementById(`${key}-error`).textContent = message || '';
  box.classList.toggle('field--invalid', Boolean(message));
  box.classList.toggle('field--valid', !message && box.dataset.touched === 'true');
  for (const control of box.querySelectorAll('input, select')) {
    control.setAttribute('aria-invalid', message ? 'true' : 'false');
  }
}

function validateField(name) {
  const { key } = fieldBox(name);
  const errors = validate(readForm());
  showError(key, errors[key]);
  return !errors[key];
}

function clearValidation() {
  for (const box of form.querySelectorAll('.field')) {
    box.classList.remove('field--invalid', 'field--valid');
    delete box.dataset.touched;
    box.querySelector('.field__error').textContent = '';
    for (const control of box.querySelectorAll('input, select')) control.removeAttribute('aria-invalid');
  }
}

function resetPreview() {
  detectedSystem = '';
  systemHint.textContent = '';
  counter.textContent = '0 / 16';
  renderBank('');
  renderSystem('');
  renderNumber('');
  renderHolder('');
  renderExpiry('', '');
  card.classList.remove('is-reset');
  void card.offsetWidth;
  card.classList.add('is-reset');
}

function buildRow(data) {
  const row = document.createElement('tr');
  row.className = 'is-entering';
  row.innerHTML = `
    <td><span class="cell-bank"><span class="cell-bank__mark" style="--chip:${BANKS[data.bank].chip}">${logo('mark', data.bank)}</span><span>${BANKS[data.bank].name}</span></span></td>
    <td class="cell-system" title="${SYSTEMS[data.system].name}">${logo('sys', data.system)}</td>
    <td class="cell-number">${maskNumber(data.number)}</td>
    <td class="cell-holder">${data.holder}</td>
    <td class="cell-expiry">${data.month}/${data.year.slice(2)}</td>
    <td><button class="delete" type="button" aria-label="Удалить карту ${BANKS[data.bank].name} ${maskNumber(data.number)}"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></td>`;
  return row;
}

function updateVault() {
  const count = rows.children.length;
  vaultCount.textContent = count;
  tableWrap.classList.toggle('has-rows', count > 0);
}

function flyCard(targetRow) {
  const from = card.getBoundingClientRect();
  const to = targetRow.getBoundingClientRect();
  const ghost = document.createElement('div');
  ghost.className = 'ghost';
  ghost.style.left = `${from.left}px`;
  ghost.style.top = `${from.top}px`;
  ghost.style.width = `${from.width}px`;
  ghost.style.height = `${from.height}px`;
  const clone = card.cloneNode(true);
  clone.removeAttribute('id');
  clone.removeAttribute('style');
  ghost.append(clone);
  document.body.append(ghost);
  const scale = Math.max(to.height / from.height, 0.12);
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const animation = ghost.animate(
    [
      { transform: 'translate(0, 0) scale(1) rotateX(0)', opacity: 1, offset: 0 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5}px) scale(${(1 + scale) / 2}) rotateX(25deg)`, opacity: 0.95, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotateX(0)`, opacity: 0, offset: 1 }
    ],
    { duration: 750, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'forwards' }
  );
  return animation.finished.then(() => ghost.remove());
}

function handleInput(event) {
  const { name } = event.target;
  if (name === 'number') {
    const digits = formatNumberInput(event.target);
    renderNumber(digits);
    syncSystemFromNumber(digits);
  }
  if (name === 'holder') renderHolder(formatHolderInput(event.target));
  if (name === 'bank') renderBank(event.target.value);
  if (name === 'system') {
    renderSystem(event.target.value);
    if (event.target.value !== detectedSystem) systemHint.textContent = '';
  }
  if (name === 'month' || name === 'year') renderExpiry(fields.month.value, fields.year.value);
  const { box } = fieldBox(name);
  if (box.dataset.touched === 'true') validateField(name);
}

function handleFocusOut(event) {
  const { name } = event.target;
  if (!name) return;
  const { box } = fieldBox(name);
  box.dataset.touched = 'true';
  validateField(name);
}

async function handleSubmit(event) {
  event.preventDefault();
  const data = readForm();
  const errors = validate(data);
  for (const box of form.querySelectorAll('.field')) box.dataset.touched = 'true';
  for (const key of ['bank', 'system', 'number', 'holder', 'expiry']) showError(key, errors[key]);
  const firstError = Object.keys(errors)[0];
  if (firstError) {
    const target = firstError === 'expiry' ? (data.month ? fields.year : fields.month) : fields[firstError];
    target.focus();
    return;
  }
  const row = buildRow(data);
  rows.append(row);
  updateVault();
  const flight = flyCard(row);
  form.reset();
  clearValidation();
  resetPreview();
  status.textContent = `Карта ${BANKS[data.bank].name} ${maskNumber(data.number)} добавлена в список`;
  await flight;
  row.classList.remove('is-entering');
  row.classList.add('is-shown');
}

function handleReset() {
  clearValidation();
  resetPreview();
}

async function handleRowsClick(event) {
  const button = event.target.closest('.delete');
  if (!button) return;
  const row = button.closest('tr');
  await row.animate(
    [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(24px)' }],
    { duration: 250, easing: 'ease-out', fill: 'forwards' }
  ).finished;
  row.remove();
  updateVault();
  status.textContent = 'Карта удалена из списка';
}

function handleTilt(event) {
  const rect = card.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  card.style.setProperty('--ry', `${(x - 0.5) * 22}deg`);
  card.style.setProperty('--rx', `${(0.5 - y) * 18}deg`);
  card.style.setProperty('--gx', `${x * 100}%`);
  card.style.setProperty('--gy', `${y * 100}%`);
  stage.classList.add('is-tilting');
}

function handleTiltEnd() {
  stage.classList.remove('is-tilting');
  card.style.setProperty('--rx', '0deg');
  card.style.setProperty('--ry', '0deg');
}

function init() {
  fillOptions(fields.bank, Object.entries(BANKS).map(([key, bank]) => [key, bank.name]));
  fillOptions(fields.system, Object.entries(SYSTEMS).map(([key, system]) => [key, system.name]));
  fillOptions(fields.month, Array.from({ length: 12 }, (_, i) => [String(i + 1).padStart(2, '0'), String(i + 1).padStart(2, '0')]));
  const thisYear = new Date().getFullYear();
  fillOptions(fields.year, Array.from({ length: 11 }, (_, i) => [String(thisYear + i), String(thisYear + i)]));
  resetPreview();
  updateVault();
  form.addEventListener('input', handleInput);
  form.addEventListener('focusout', handleFocusOut);
  form.addEventListener('submit', handleSubmit);
  form.addEventListener('reset', handleReset);
  rows.addEventListener('click', handleRowsClick);
  if (window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) {
    stage.addEventListener('pointermove', handleTilt);
    stage.addEventListener('pointerleave', handleTiltEnd);
  }
}

init();
