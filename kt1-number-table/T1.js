let numbers = [];

function getColor(num) {
    return num >= 50 ? 'orange' : '';
}

function createTable() {
    numbers = [];
    for (let i = 0; i < 30; i++) {
        numbers.push(Math.floor(Math.random() * 100));
    }

    let table = document.createElement('table');
    let index = 0;

    for (let i = 0; i < 5; i++) {
        let row = document.createElement('tr');
        for (let j = 0; j < 6; j++) {
            let cell = document.createElement('td');
            let num = numbers[index];
            cell.textContent = num;
            if (num >= 50) {
                cell.classList.add('orange');
            }
            row.appendChild(cell);
            index++;
        }
        table.appendChild(row);
    }

    let container = document.getElementById('table-container');
    container.innerHTML = '';
    container.appendChild(table);
}

function foo() {
    let num = Math.floor(Math.random() * 100);
    numbers.push(num);

    let table = document.querySelector('table');
    let rows = table.rows;
    let lastRow = rows[rows.length - 1];

    if (lastRow.cells.length === 6) {
        let newRow = document.createElement('tr');
        let cell = document.createElement('td');
        cell.textContent = num;
        if (num >= 50) {
            cell.classList.add('orange');
        }
        newRow.appendChild(cell);
        table.appendChild(newRow);
    } else {
        let cell = document.createElement('td');
        cell.textContent = num;
        if (num >= 50) {
            cell.classList.add('orange');
        }
        lastRow.appendChild(cell);
    }
}

createTable();
