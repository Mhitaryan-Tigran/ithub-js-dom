const assert = require('node:assert');
const { snap, valueFromX } = require('./slider.js');

assert.strictEqual(snap(47, 0, 100, 5), 45);
assert.strictEqual(snap(48, 0, 100, 5), 50);
assert.strictEqual(snap(-20, 0, 100, 1), 0);
assert.strictEqual(snap(130, 0, 100, 1), 100);
assert.strictEqual(snap(22.26, -10, 40, 0.5), 22.5);
assert.strictEqual(snap(0.30000000000000004, 0, 1, 0.1), 0.3);
assert.strictEqual(snap(99, 0, 98, 5), 95);
assert.strictEqual(snap(-Infinity, 1000, 50000, 500), 1000);
assert.strictEqual(snap(Infinity, 1000, 50000, 500), 50000);
assert.strictEqual(valueFromX(150, 100, 200, 0, 100, 1), 25);
assert.strictEqual(valueFromX(0, 100, 200, 0, 100, 1), 0);
assert.strictEqual(valueFromX(500, 100, 200, 1000, 50000, 500), 50000);

console.log('kt4-slider: ok');
