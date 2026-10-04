const COLUMNS = 6;
const ROWS = 5;
let numbers = [];

function random() {
  return Math.floor(Math.random() * 100);
}

function fillCell(cell, value) {
  cell.textContent = value;
  cell.classList.toggle("orange", value >= 50);
  cell.classList.remove("empty");
  cell.setAttribute("aria-label", value >= 50 ? `${value}, 50 и больше` : String(value));
}

function buildTable() {
  const table = document.getElementById("numbers");
  table.replaceChildren();
  const rows = Math.max(ROWS, Math.ceil(numbers.length / COLUMNS));
  for (let r = 0; r < rows; r++) {
    const row = table.insertRow();
    for (let c = 0; c < COLUMNS; c++) {
      const cell = row.insertCell();
      const value = numbers[r * COLUMNS + c];
      if (value === undefined) cell.className = "empty";
      else fillCell(cell, value);
    }
  }
}

function updateStats() {
  const high = numbers.filter((n) => n >= 50).length;
  const sum = numbers.reduce((a, b) => a + b, 0);
  document.getElementById("stat-count").textContent = numbers.length;
  document.getElementById("stat-high").textContent = high;
  document.getElementById("stat-avg").textContent = numbers.length ? (sum / numbers.length).toFixed(1).replace(".", ",") : 0;
  document.getElementById("stat-max").textContent = numbers.length ? Math.max(...numbers) : 0;
}

function createTable() {
  numbers = Array.from({ length: COLUMNS * ROWS }, random);
  buildTable();
  updateStats();
}

function foo() {
  const value = random();
  numbers.push(value);
  const table = document.getElementById("numbers");
  const index = numbers.length - 1;
  let row = table.rows[Math.floor(index / COLUMNS)];
  if (!row) {
    row = table.insertRow();
    for (let c = 0; c < COLUMNS; c++) row.insertCell().className = "empty";
  }
  const cell = row.cells[index % COLUMNS];
  fillCell(cell, value);
  cell.classList.remove("new");
  void cell.offsetWidth;
  cell.classList.add("new");
  updateStats();
}

document.getElementById("reset").addEventListener("click", createTable);
createTable();
