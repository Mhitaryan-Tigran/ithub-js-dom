const assert = require('node:assert');
const { matches } = require('./js/menu.js');
const { fieldError } = require('./js/contact.js');

const cappuccino = { category: 'classic', name: 'Капучино', description: 'Эспрессо и бархатная молочная пена' };
assert.strictEqual(matches(cappuccino, '', 'all'), true);
assert.strictEqual(matches(cappuccino, '  ПЕНА ', 'classic'), true);
assert.strictEqual(matches(cappuccino, 'пена', 'cold'), false);
assert.strictEqual(matches(cappuccino, 'чизкейк', 'all'), false);

assert.strictEqual(fieldError('name', ' Анна '), '');
assert.notStrictEqual(fieldError('name', 'А'), '');
assert.strictEqual(fieldError('email', 'anna@mail.ru'), '');
assert.notStrictEqual(fieldError('email', 'anna@mail'), '');
assert.strictEqual(fieldError('message', 'Привет'), 'Сообщение: ещё 4 симв.');
assert.strictEqual(fieldError('message', 'Хочу столик на субботу'), '');

console.log('kt6-promo-site: ok');
