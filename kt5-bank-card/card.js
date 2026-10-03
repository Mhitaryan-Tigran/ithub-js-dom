const BANKS = {
  sber: {
    name: 'Сбербанк',
    background: 'linear-gradient(135deg, #2fbf5a, #0b6b3a)',
    mark: '<circle cx="12" cy="12" r="11" fill="#fff"/><path d="M6.5 12.5l3.5 3.5 7.5-8" fill="none" stroke="#21a038" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  tbank: {
    name: 'Т-Банк',
    background: 'linear-gradient(135deg, #3a3a3a, #111)',
    mark: '<path d="M3 2h18v11c0 5-4 8-9 9-5-1-9-4-9-9z" fill="#ffdd2d"/><path d="M7.5 7h9v2.4h-3.3V17h-2.4V9.4H7.5z" fill="#222"/>'
  },
  alfa: {
    name: 'Альфа-Банк',
    background: 'linear-gradient(135deg, #ff4b3e, #a3150c)',
    mark: '<rect width="24" height="24" rx="6" fill="#fff"/><path d="M12 4l5.5 11.5H15l-1.1-2.6h-3.8L9 15.5H6.5zM10.9 10.8h2.2L12 8.1z" fill="#ef3124" fill-rule="evenodd"/><rect x="6.5" y="17" width="11" height="2.2" fill="#ef3124"/>'
  },
  vtb: {
    name: 'ВТБ',
    background: 'linear-gradient(135deg, #1e46c8, #04145a)',
    mark: '<rect width="24" height="24" rx="6" fill="#fff"/><path d="M5 5.5h14l-1.5 3h-14z" fill="#009fdf"/><path d="M6 10.5h14l-1.5 3h-14z" fill="#0a2896"/><path d="M7 15.5h14l-1.5 3h-14z" fill="#0a2896"/>'
  },
  gpb: {
    name: 'Газпромбанк',
    background: 'linear-gradient(135deg, #3d7be0, #0b2f73)',
    mark: '<circle cx="12" cy="12" r="11" fill="#fff"/><path d="M12 3.5c3 3.5 4.7 6.2 4.7 8.8a4.7 4.7 0 0 1-9.4 0c0-2.6 1.7-5.3 4.7-8.8z" fill="#1e5bc6"/><path d="M12 10c1.3 1.6 2 2.8 2 3.9a2 2 0 0 1-4 0c0-1.1.7-2.3 2-3.9z" fill="#fff"/>'
  }
};

const SYSTEMS = {
  visa: {
    name: 'Visa',
    mark: '<text x="24" y="21" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="900" font-style="italic" fill="#1a1f71">VISA</text>'
  },
  mastercard: {
    name: 'Mastercard',
    mark: '<circle cx="18" cy="15" r="10" fill="#eb001b"/><circle cx="30" cy="15" r="10" fill="#f79e1b" fill-opacity="0.85"/>'
  },
  mir: {
    name: 'Мир',
    mark: '<text x="24" y="21" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="900" fill="#0f754e">МИР</text>'
  },
  unionpay: {
    name: 'UnionPay',
    mark: '<path d="M8 4h11l-4 22H4z" fill="#e21836"/><path d="M19 4h11l-4 22H15z" fill="#00447c"/><path d="M30 4h11l-4 22H26z" fill="#007b84"/><text x="23" y="18" text-anchor="middle" font-family="Arial, sans-serif" font-size="7.5" font-weight="700" fill="#fff">UnionPay</text>'
  }
};

const DEFAULT_BACKGROUND = 'linear-gradient(135deg, #8e94a8, #4a4f63)';

function onlyDigits(text) {
  return text.replace(/\D/g, '').slice(0, 16);
}

function groupByFour(text) {
  return (text.match(/.{1,4}/g) || []).join(' ');
}

function caretAfter(digitCount) {
  return digitCount === 0 ? 0 : digitCount + Math.floor((digitCount - 1) / 4);
}

function previewNumber(digits) {
  return groupByFour(digits.padEnd(16, '#'));
}

function maskNumber(digits) {
  return digits.slice(0, 4) + ' •••• •••• ' + digits.slice(12);
}

function cleanHolder(text) {
  return text.toUpperCase().replace(/[^A-Z '-]/g, '').replace(/^ +/, '').replace(/ {2,}/g, ' ');
}

function validate(data, now) {
  const errors = {};
  if (!BANKS[data.bank]) errors.bank = 'Выберите банк';
  if (!SYSTEMS[data.system]) errors.system = 'Выберите платёжную систему';
  if (data.number.length !== 16) errors.number = 'Номер карты должен содержать ровно 16 цифр';
  if (!/^[A-Z'-]+( [A-Z'-]+)+$/.test(data.holder)) errors.holder = 'Введите имя и фамилию латиницей';
  if (!data.month || !data.year) {
    errors.expiry = 'Выберите месяц и год';
  } else if (Number(data.year) === now.getFullYear() && Number(data.month) < now.getMonth() + 1) {
    errors.expiry = 'Срок действия карты уже истёк';
  }
  return errors;
}

function bankLogo(id) {
  const bank = BANKS[id];
  return '<span class="bank-logo"><svg viewBox="0 0 24 24" aria-hidden="true">' + bank.mark + '</svg><span>' + bank.name + '</span></span>';
}

function systemLogo(id) {
  const system = SYSTEMS[id];
  return '<span class="pay-logo" title="' + system.name + '"><svg viewBox="0 0 48 30" role="img" aria-label="' + system.name + '">' + system.mark + '</svg></span>';
}

function start() {
  const form = document.getElementById('card-form');
  const fields = form.elements;
  const card = document.getElementById('card-preview');
  const preview = {
    bank: document.getElementById('preview-bank'),
    number: document.getElementById('preview-number'),
    holder: document.getElementById('preview-holder'),
    expiry: document.getElementById('preview-expiry'),
    system: document.getElementById('preview-system')
  };
  const tbody = document.getElementById('cards-body');
  const emptyText = document.getElementById('cards-empty');
  const thisYear = new Date().getFullYear();

  Object.entries(BANKS).forEach(([id, bank]) => fields.bank.add(new Option(bank.name, id)));
  Object.entries(SYSTEMS).forEach(([id, system]) => fields.system.add(new Option(system.name, id)));
  for (let month = 1; month <= 12; month++) {
    const text = String(month).padStart(2, '0');
    fields.month.add(new Option(text, text));
  }
  for (let year = thisYear; year <= thisYear + 10; year++) {
    fields.year.add(new Option(year, year));
  }

  function readForm() {
    return {
      bank: fields.bank.value,
      system: fields.system.value,
      number: onlyDigits(fields.number.value),
      holder: fields.holder.value.trim(),
      month: fields.month.value,
      year: fields.year.value
    };
  }

  function updatePreview() {
    const data = readForm();
    card.style.background = BANKS[data.bank] ? BANKS[data.bank].background : DEFAULT_BACKGROUND;
    preview.bank.innerHTML = BANKS[data.bank] ? bankLogo(data.bank) : '<span class="bank-logo bank-logo--empty">Банк</span>';
    preview.system.innerHTML = SYSTEMS[data.system] ? systemLogo(data.system) : '';
    preview.number.textContent = previewNumber(data.number);
    preview.holder.textContent = data.holder || 'IVAN IVANOV';
    preview.expiry.textContent = (data.month || 'ММ') + '/' + (data.year ? data.year.slice(2) : 'ГГ');
  }

  function showErrors(errors) {
    form.querySelectorAll('[data-error-for]').forEach((element) => {
      const name = element.dataset.errorFor;
      element.textContent = errors[name] || '';
      element.closest('.field').classList.toggle('field--invalid', Boolean(errors[name]));
    });
  }

  function addRow(data) {
    const row = tbody.insertRow();
    row.insertCell().innerHTML = bankLogo(data.bank);
    row.insertCell().innerHTML = systemLogo(data.system);
    row.insertCell().textContent = maskNumber(data.number);
    row.insertCell().textContent = data.holder;
    row.insertCell().textContent = data.month + '/' + data.year.slice(2);
    row.insertCell().innerHTML = '<button type="button" class="delete" aria-label="Удалить карту">✕</button>';
    emptyText.hidden = true;
  }

  fields.number.addEventListener('input', () => {
    const input = fields.number;
    const digitsBeforeCaret = onlyDigits(input.value.slice(0, input.selectionStart)).length;
    input.value = groupByFour(onlyDigits(input.value));
    const caret = caretAfter(digitsBeforeCaret);
    input.setSelectionRange(caret, caret);
  });

  fields.holder.addEventListener('input', () => {
    const input = fields.holder;
    const caret = cleanHolder(input.value.slice(0, input.selectionStart)).length;
    input.value = cleanHolder(input.value);
    input.setSelectionRange(caret, caret);
  });

  form.addEventListener('input', () => {
    updatePreview();
    if (form.classList.contains('form--checked')) showErrors(validate(readForm(), new Date()));
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = readForm();
    const errors = validate(data, new Date());
    form.classList.add('form--checked');
    showErrors(errors);
    if (Object.keys(errors).length > 0) return;
    addRow(data);
    form.reset();
    form.classList.remove('form--checked');
    updatePreview();
  });

  tbody.addEventListener('click', (event) => {
    const button = event.target.closest('.delete');
    if (!button) return;
    button.closest('tr').remove();
    emptyText.hidden = tbody.rows.length > 0;
  });

  updatePreview();
}

if (typeof document === 'undefined') module.exports = { onlyDigits, groupByFour, caretAfter, previewNumber, maskNumber, cleanHolder, validate };
else start();
