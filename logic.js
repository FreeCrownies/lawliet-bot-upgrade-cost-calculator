/*
 * Calculation logic of the Lawliet Bot fishery upgrades.
 * 1:1 port of the former Java code (Main, FisheryGear, NumberUtil).
 * Results are BigInt so they stay exact like Java's 64-bit long.
 */
(function (root) {
  'use strict';

  // Tools offered by the calculator (start price and effect per FisheryGear).
  const GEARS = {
    daily:    { name: 'Fishing Robot',  alias: 'Daily',    emoji: '🤖', startPrice: 25000, effect: 100 },
    voice:    { name: 'Fishing Net',    alias: 'Voice',    emoji: '🥅', startPrice: 32000, effect: 1 },
    message:  { name: 'Fishing Rod',    alias: 'Message',  emoji: '🎣', startPrice: 25000, effect: 1 },
    work:     { name: 'Work',           alias: 'Work',     emoji: '💼', startPrice: 25000, effect: 4000 },
    treasure: { name: 'Metal Detector', alias: 'Treasure', emoji: '🔍', startPrice: 20000, effect: 80000 },
  };

  // Highest level for which the totals still fit into a Java long.
  const MAX_LEVEL = 100000;

  // Limits of the bot: coins (Settings.FISHERY_MAX) and the prestige levels offered here.
  const MAX_COINS = 9999999999999999n;
  const MAX_PRESTIGE = 30;

  // Main.getValue: triangular number of (level + 1)
  function getValue(level) {
    const n = BigInt(level) + 1n;
    return (n * (n + 1n)) / 2n;
  }

  // Main.getEffect (level is 0-based, as in the Java code)
  function getEffect(level, gear) {
    return getValue(level) * BigInt(gear.effect);
  }

  // NumberUtil.countDigits
  function countDigits(value) {
    const v = value < 0n ? -value : value;
    return v === 0n ? 1 : v.toString().length;
  }

  // NumberUtil.flattenLong
  function flattenLong(value, sliceKeepDigits) {
    const digits = countDigits(value);
    if (digits > sliceKeepDigits) {
      const p = Math.pow(10, digits - sliceKeepDigits);
      return BigInt(Math.round(Number(value) / p) * p);
    }
    return value;
  }

  // NumberUtil.numberToString: groups of three separated by U+2007 (figure space), like the Java code
  function numberToString(value) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u2007');
  }

  // Cost of a single upgrade step (level is 0-based), same operation order as FisheryMemberGearData.getPrice.
  // Every prestige level makes the upgrades 25 % cheaper.
  function stepCost(level, gear, prestige) {
    const raw = Math.round(Math.pow(Number(getValue(level)), 1.02) * gear.startPrice * Math.pow(0.75, prestige || 0));
    return flattenLong(BigInt(raw), 4);
  }

  // Input is the 1-based level the user types in.
  function effectAtLevel(level, gear) {
    return getEffect(level - 1, gear);
  }

  function costForLevel(level, gear, prestige) {
    return stepCost(level - 1, gear, prestige);
  }

  function totalCostUpToLevel(level, gear, prestige) {
    let cost = 0n;
    for (let i = 0; i < level - 1; i++) {
      cost += stepCost(i, gear, prestige);
    }
    return cost;
  }

  // Upgrading from level `from` to level `to`: difference of the totals / effects at those levels.
  function upgradeCost(from, to, gear, prestige) {
    return totalCostUpToLevel(to, gear, prestige) - totalCostUpToLevel(from, gear, prestige);
  }

  function effectGain(from, to, gear) {
    return effectAtLevel(to, gear) - effectAtLevel(from, gear);
  }

  // Effect, cost and total cost for the levels 1..maxLevel (same values as the functions above,
  // but the total is accumulated instead of recomputed for every level).
  function series(gear, maxLevel, prestige) {
    const rows = [];
    let total = 0n;
    for (let level = 1; level <= maxLevel; level++) {
      if (level > 1) total += stepCost(level - 2, gear, prestige);
      rows.push({
        level,
        effect: getEffect(level - 1, gear),
        cost: stepCost(level - 1, gear, prestige),
        total,
      });
    }
    return rows;
  }

  // How far do `coins` get you when upgrading one level after the other, starting at level `from`?
  // Returns the reachable level, the coins spent / left and the price of the next upgrade (null at MAX_LEVEL).
  function affordable(coins, from, gear, prestige) {
    let level = from;
    let spent = 0n;
    while (level < MAX_LEVEL) {
      const price = stepCost(level - 1, gear, prestige);
      if (spent + price > coins) return { level, spent, left: coins - spent, nextCost: price };
      spent += price;
      level++;
    }
    return { level, spent, left: coins - spent, nextCost: null };
  }

  // Coins as typed by a user: "2 500 000", "2,500,000", "2.5m", "1.2b" (k, m, b, t). Returns BigInt or null.
  function parseCoins(text) {
    const m = /^(\d+)(?:\.(\d+))?([kmbt])?$/i.exec(String(text).replace(/[\s,_\u2007]/g, ''));
    if (!m) return null;
    const zeros = { k: 3, m: 6, b: 9, t: 12 }[(m[3] || '').toLowerCase()] || 0;
    const frac = m[2] || '';
    if (frac && !zeros) return null;
    const scale = 10n ** BigInt(zeros);
    return BigInt(m[1]) * scale + (frac ? BigInt(frac) * scale / 10n ** BigInt(frac.length) : 0n);
  }

  const api = {
    GEARS, MAX_LEVEL, MAX_COINS, MAX_PRESTIGE,
    getValue, getEffect, countDigits, flattenLong, numberToString,
    effectAtLevel, costForLevel, totalCostUpToLevel, upgradeCost, effectGain, series, affordable, parseCoins,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Lawliet = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
