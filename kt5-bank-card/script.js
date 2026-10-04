const BANKS = {
  sber: { name: "Сбербанк", tone: "linear-gradient(135deg, #21a038, #0b6b25)" },
  tbank: { name: "Т-Банк", tone: "linear-gradient(135deg, #2b2b2e, #0d0d0f)" },
  alfa: { name: "Альфа-Банк", tone: "linear-gradient(135deg, #ef3124, #a1150b)" },
  vtb: { name: "ВТБ", tone: "linear-gradient(135deg, #1f5bd8, #0a2a7a)" },
  gpb: { name: "Газпромбанк", tone: "linear-gradient(135deg, #1f78d1, #0b3a80)" },
};

const SYSTEMS = {
  mir: { name: "Мир", prefix: /^2/ },
  visa: { name: "Visa", prefix: /^4/ },
  mastercard: { name: "Mastercard", prefix: /^5[1-5]/ },
  unionpay: { name: "UnionPay", prefix: /^62/ },
};

const MESSAGES = {
  bank: "Выберите банк",
  system: "Выберите платёжную систему",
  number: "Номер карты — 16 цифр",
  holder: "Имя и фамилия латиницей",
  expiry: "Укажите месяц и год",
  expired: "Срок действия уже истёк",
};

const form = document.getElementById("card-form");
const f = form.elements;
const card = document.getElementById("card");
const rows = document.getElementById("rows");
const touched = new Set();
let system = "";
let systemManual = false;
let lastRemoved = null;

const use = (id) => `<svg aria-hidden="true"><use href="#${id}"/></svg>`;

function option(select, value, text) {
  select.append(new Option(text, value));
}

function setup() {
  Object.entries(BANKS).forEach(([k, b]) => option(f.bank, k, b.name));
  for (let m = 1; m <= 12; m++) option(f.month, String(m).padStart(2, "0"), String(m).padStart(2, "0"));
  const year = new Date().getFullYear() % 100;
  for (let y = year; y <= year + 8; y++) option(f.year, String(y), String(y));
  document.getElementById("systems").replaceChildren(...Object.entries(SYSTEMS).map(([k, s]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "sys";
    b.dataset.system = k;
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", "false");
    b.setAttribute("aria-label", s.name);
    b.innerHTML = use(`sys-${k}`);
    b.addEventListener("click", () => {
      systemManual = true;
      setSystem(k);
      touched.add("system");
      validate();
    });
    return b;
  }));
  document.getElementById("systems").setAttribute("role", "radiogroup");
}

function setSystem(k) {
  system = k;
  document.querySelectorAll(".sys").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.system === k)));
  update();
}

function digits() {
  return f.number.value.replace(/\D/g, "");
}

function formatNumber() {
  const input = f.number;
  const caret = input.selectionStart;
  const before = input.value.slice(0, caret).replace(/\D/g, "").length;
  const d = digits().slice(0, 16);
  input.value = d.replace(/(\d{4})(?=\d)/g, "$1 ");
  let pos = 0;
  let seen = 0;
  while (pos < input.value.length && seen < before) {
    if (/\d/.test(input.value[pos])) seen++;
    pos++;
  }
  input.setSelectionRange(pos, pos);
  if (!systemManual) {
    const found = Object.keys(SYSTEMS).find((k) => SYSTEMS[k].prefix.test(d)) || "";
    if (found !== system) setSystem(found);
  }
}

function update() {
  card.dataset.bank = f.bank.value;
  const bank = document.getElementById("card-bank");
  bank.innerHTML = f.bank.value ? use(`logo-${f.bank.value}`) : '<span class="card-placeholder">Банк</span>';
  const d = digits().padEnd(16, "•");
  const number = document.getElementById("card-number");
  number.textContent = d.replace(/(.{4})(?=.)/g, "$1 ");
  number.classList.toggle("is-empty", !digits());
  const holder = document.getElementById("card-holder");
  holder.textContent = f.holder.value.trim() || "IVAN PETROV";
  holder.classList.toggle("is-empty", !f.holder.value.trim());
  const expiry = document.getElementById("card-expiry");
  expiry.textContent = `${f.month.value || "ММ"}/${f.year.value || "ГГ"}`;
  expiry.classList.toggle("is-empty", !f.month.value || !f.year.value);
  document.getElementById("card-system").innerHTML = system ? use(`sys-${system}`) : "";
}

function errors() {
  const e = {};
  if (!f.bank.value) e.bank = MESSAGES.bank;
  if (!system) e.system = MESSAGES.system;
  if (digits().length !== 16) e.number = MESSAGES.number;
  if (!/^[A-Z]+(?:[ -][A-Z]+)+$/.test(f.holder.value.trim())) e.holder = MESSAGES.holder;
  if (!f.month.value || !f.year.value) e.expiry = MESSAGES.expiry;
  else {
    const now = new Date();
    const end = new Date(2000 + Number(f.year.value), Number(f.month.value), 1);
    if (end <= new Date(now.getFullYear(), now.getMonth(), 1)) e.expiry = MESSAGES.expired;
  }
  return e;
}

function validate(all = false) {
  const e = errors();
  for (const key of ["bank", "system", "number", "holder", "expiry"]) {
    const show = all || touched.has(key);
    const box = document.getElementById(`${key}-error`);
    box.textContent = show && e[key] ? e[key] : "";
    const row = box.previousElementSibling;
    row.classList.toggle("is-invalid", Boolean(show && e[key]));
    row.querySelectorAll("input, select").forEach((el) => el.setAttribute("aria-invalid", String(Boolean(show && e[key]))));
  }
  return e;
}

function mask(number) {
  return `${number.slice(0, 4)} •••• •••• ${number.slice(12)}`;
}

function renderCount() {
  const n = rows.children.length;
  document.getElementById("count").textContent = n ? `${n}` : "";
  document.getElementById("empty").hidden = n > 0;
}

function addRow(data, index = 0) {
  const tr = document.createElement("tr");
  tr.className = "new";
  tr.innerHTML = `
    <td data-label="Банк"><span class="bank-cell"><span class="mark" style="background:${BANKS[data.bank].tone}">${use(`mark-${data.bank}`)}</span>${BANKS[data.bank].name}</span></td>
    <td class="sys-cell" data-label="Система" aria-label="${SYSTEMS[data.system].name}">${use(`sys-${data.system}`)}</td>
    <td class="mono" data-label="Номер">${mask(data.number)}</td>
    <td data-label="Владелец"></td>
    <td class="mono" data-label="Срок">${data.month}/${data.year}</td>
    <td><button class="delete" type="button" aria-label="Удалить карту ${BANKS[data.bank].name} ${mask(data.number)}">${use("trash")}</button></td>`;
  tr.children[3].textContent = data.holder;
  tr.querySelector(".delete").addEventListener("click", () => {
    lastRemoved = { data, index: [...rows.children].indexOf(tr) };
    tr.remove();
    renderCount();
    hud(`Карта ${BANKS[data.bank].name} удалена`);
  });
  rows.insertBefore(tr, rows.children[index] || null);
  renderCount();
}

function hud(text) {
  const el = document.getElementById("hud");
  document.getElementById("hud-text").textContent = text;
  el.hidden = true;
  void el.offsetWidth;
  el.hidden = false;
  clearTimeout(hud.t);
  hud.t = setTimeout(() => (el.hidden = true), 5000);
}

document.getElementById("hud-undo").addEventListener("click", () => {
  if (lastRemoved) addRow(lastRemoved.data, lastRemoved.index);
  lastRemoved = null;
  document.getElementById("hud").hidden = true;
});

function resetState() {
  system = "";
  systemManual = false;
  touched.clear();
  document.querySelectorAll(".sys").forEach((b) => b.setAttribute("aria-checked", "false"));
  validate();
  update();
}

f.number.addEventListener("input", () => {
  formatNumber();
  update();
  validate();
});
f.holder.addEventListener("input", () => {
  const caret = f.holder.selectionStart;
  f.holder.value = f.holder.value.toUpperCase().replace(/[^A-Z -]/g, "").replace(/\s{2,}/g, " ");
  f.holder.setSelectionRange(caret, caret);
  update();
  validate();
});
["bank", "month", "year"].forEach((name) => f[name].addEventListener("change", () => {
  touched.add(name === "bank" ? "bank" : "expiry");
  update();
  validate();
  card.classList.remove("pulse");
  void card.offsetWidth;
  card.classList.add("pulse");
}));
["number", "holder"].forEach((name) => f[name].addEventListener("blur", () => {
  if (f[name].value) touched.add(name);
  validate();
}));

form.addEventListener("reset", () => setTimeout(resetState));

function clear() {
  form.reset();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const e = validate(true);
  const first = Object.keys(e)[0];
  if (first) {
    const target = first === "system" ? document.querySelector(".sys") : first === "expiry" ? f.month : f[first];
    target.focus();
    return;
  }
  const data = { bank: f.bank.value, system, number: digits(), holder: f.holder.value.trim(), month: f.month.value, year: f.year.value };
  card.classList.add("away");
  setTimeout(() => {
    addRow(data);
    clear();
    card.classList.remove("away");
    card.classList.add("back");
    setTimeout(() => card.classList.remove("back"), 500);
    hud(`Карта ${BANKS[data.bank].name} добавлена`);
    document.getElementById("hud-undo").hidden = true;
  }, matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 420);
});

const showUndo = () => (document.getElementById("hud-undo").hidden = false);
rows.addEventListener("click", (event) => {
  if (event.target.closest(".delete")) showUndo();
}, true);

setup();
update();
renderCount();
