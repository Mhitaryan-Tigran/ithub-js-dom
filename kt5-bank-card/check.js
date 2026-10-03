const assert = require('node:assert');
const card = require('./card.js');

assert.strictEqual(card.onlyDigits('1234-5678 abcd 9012 3456 7890'), '1234567890123456');
assert.strictEqual(card.groupByFour('1234567890'), '1234 5678 90');
assert.strictEqual(card.groupByFour(''), '');
assert.strictEqual(card.previewNumber('12345'), '1234 5### #### ####');
assert.strictEqual(card.maskNumber('1234567890125678'), '1234 •••• •••• 5678');
assert.deepStrictEqual([0, 1, 4, 5, 8, 9, 16].map(card.caretAfter), [0, 1, 4, 6, 9, 11, 19]);
assert.strictEqual(card.cleanHolder('  ivan  ivanov1 Иван'), 'IVAN IVANOV ');

const now = new Date(2026, 9, 4);
const good = { bank: 'sber', system: 'mir', number: '1234567890123456', holder: 'IVAN IVANOV', month: '10', year: '2026' };
assert.deepStrictEqual(card.validate(good, now), {});
assert.deepStrictEqual(Object.keys(card.validate({ bank: '', system: 'x', number: '123', holder: 'IVAN', month: '', year: '2027' }, now)), ['bank', 'system', 'number', 'holder', 'expiry']);
assert.strictEqual(card.validate({ ...good, month: '09' }, now).expiry, 'Срок действия карты уже истёк');
assert.deepStrictEqual(card.validate({ ...good, month: '01', year: '2027' }, now), {});

console.log('kt5-bank-card: ok');
