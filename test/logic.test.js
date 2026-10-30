// Run with: node test/logic.test.js
// golden.json holds results of the original Java implementation.
const assert = require('node:assert/strict');
const L = require('../logic.js');
const golden = require('./golden.json');

for (const [id, level, effect, cost, total] of golden) {
  const gear = L.GEARS[id];
  assert.equal(L.effectAtLevel(level, gear).toString(), effect, `${id} effect @${level}`);
  assert.equal(L.costForLevel(level, gear).toString(), cost, `${id} cost @${level}`);
  assert.equal(L.totalCostUpToLevel(level, gear).toString(), total, `${id} total @${level}`);
}

// series() has to agree with the single-level functions
for (const gear of Object.values(L.GEARS)) {
  for (const row of L.series(gear, 300)) {
    assert.equal(row.effect, L.effectAtLevel(row.level, gear));
    assert.equal(row.cost, L.costForLevel(row.level, gear));
    assert.equal(row.total, L.totalCostUpToLevel(row.level, gear));
  }
}

assert.equal(L.numberToString(0n), '0');
assert.equal(L.numberToString(1234567n), '1 234 567');
assert.equal(L.flattenLong(123456n, 4), 123500n);

console.log(`${golden.length} golden cases ok`);
