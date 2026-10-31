// Run with: node test/logic.test.js
// golden.json holds results of the original Java implementation.
const assert = require('node:assert/strict');
const L = require('../logic.js');
const golden = require('./golden.json');
const goldenPrestige = require('./golden-prestige.json');

for (const [id, level, effect, cost, total] of golden) {
  const gear = L.GEARS[id];
  assert.equal(L.effectAtLevel(level, gear).toString(), effect, `${id} effect @${level}`);
  assert.equal(L.costForLevel(level, gear).toString(), cost, `${id} cost @${level}`);
  assert.equal(L.totalCostUpToLevel(level, gear).toString(), total, `${id} total @${level}`);
}

// prestige: every level makes the prices 25 % cheaper (reference values of the bot's formula)
for (const [id, prestige, level, cost, total] of goldenPrestige) {
  const gear = L.GEARS[id];
  assert.equal(L.costForLevel(level, gear, prestige).toString(), cost, `${id} p${prestige} cost @${level}`);
  assert.equal(L.totalCostUpToLevel(level, gear, prestige).toString(), total, `${id} p${prestige} total @${level}`);
}
assert.equal(L.costForLevel(10, L.GEARS.daily, 0), L.costForLevel(10, L.GEARS.daily));

// affordable(): spends exactly what upgradeCost says and cannot afford the next step
for (const gear of Object.values(L.GEARS)) {
  for (const prestige of [0, 3]) {
    for (const coins of [0n, 1n, 25000n, 1000000000n, 987654321987n]) {
      for (const from of [1, 10, 777]) {
        const r = L.affordable(coins, from, gear, prestige);
        assert.equal(r.spent, L.upgradeCost(from, r.level, gear, prestige));
        assert.equal(r.left, coins - r.spent);
        assert.ok(r.left >= 0n && r.left < r.nextCost, 'next upgrade must not be affordable');
        assert.equal(r.nextCost, L.costForLevel(r.level, gear, prestige));
      }
    }
  }
}
assert.equal(L.affordable(0n, 5, L.GEARS.daily, 0).level, 5);

// parseCoins
assert.equal(L.parseCoins('2 500 000'), 2500000n);
assert.equal(L.parseCoins('2,500,000'), 2500000n);
assert.equal(L.parseCoins('2.5b'), 2500000000n);
assert.equal(L.parseCoins('1.5 K'), 1500n);
for (const bad of ['', 'abc', '1.5', '.5m', '-3', '1e6']) assert.equal(L.parseCoins(bad), null, bad);

// series() has to agree with the single-level functions
for (const gear of Object.values(L.GEARS)) {
  for (const row of L.series(gear, 300)) {
    assert.equal(row.effect, L.effectAtLevel(row.level, gear));
    assert.equal(row.cost, L.costForLevel(row.level, gear));
    assert.equal(row.total, L.totalCostUpToLevel(row.level, gear));
  }
  for (const row of L.series(gear, 50, 4)) {
    assert.equal(row.cost, L.costForLevel(row.level, gear, 4));
    assert.equal(row.total, L.totalCostUpToLevel(row.level, gear, 4));
  }
}

// upgrade planner: from level 1 it equals the total cost, otherwise it is the sum of the single steps
for (const gear of Object.values(L.GEARS)) {
  for (const to of [1, 2, 10, 40, 250]) assert.equal(L.upgradeCost(1, to, gear), L.totalCostUpToLevel(to, gear));
  let sum = 0n;
  for (let k = 10; k < 40; k++) sum += L.costForLevel(k, gear);
  assert.equal(L.upgradeCost(10, 40, gear), sum);
  assert.equal(L.effectGain(10, 40, gear), L.effectAtLevel(40, gear) - L.effectAtLevel(10, gear));
  assert.equal(L.upgradeCost(25, 25, gear), 0n);
}
assert.equal(L.upgradeCost(10, 40, L.GEARS.daily), 296210000n);

assert.equal(L.numberToString(0n), '0');
assert.equal(L.numberToString(1234567n), '1 234 567');
assert.equal(L.flattenLong(123456n, 4), 123500n);

console.log(`${golden.length} golden cases ok`);
