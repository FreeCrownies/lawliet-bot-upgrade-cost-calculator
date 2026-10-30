/*
 * Calculation logic of the Lawliet Bot fishery upgrades.
 * 1:1 port of the former Java code (Main, FisheryGear, NumberUtil).
 * Results are BigInt so they stay exact like Java's 64-bit long.
 */
(function (root) {
  'use strict';

  // Tools offered by the calculator (start price and effect per FisheryGear).
  const GEARS = {
    daily:   { name: 'Fishing Robot', alias: 'Daily',   emoji: '🤖', startPrice: 25000, effect: 100 },
    voice:   { name: 'Fishing Net',   alias: 'Voice',   emoji: '🥅', startPrice: 32000, effect: 1 },
    message: { name: 'Fishing Rod',   alias: 'Message', emoji: '🎣', startPrice: 25000, effect: 1 },
    work:    { name: 'Work',          alias: 'Work',    emoji: '💼', startPrice: 25000, effect: 4000 },
  };

  // Highest level for which the totals still fit into a Java long.
  const MAX_LEVEL = 100000;

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

  // Cost of a single upgrade step (level is 0-based)
  function stepCost(level, gear) {
    const raw = Math.round(Math.pow(Number(getValue(level)), 1.02) * gear.startPrice);
    return flattenLong(BigInt(raw), 4);
  }

  // Input is the 1-based level the user types in.
  function effectAtLevel(level, gear) {
    return getEffect(level - 1, gear);
  }

  function costForLevel(level, gear) {
    return stepCost(level - 1, gear);
  }

  function totalCostUpToLevel(level, gear) {
    let cost = 0n;
    for (let i = 0; i < level - 1; i++) {
      cost += stepCost(i, gear);
    }
    return cost;
  }

  // Effect, cost and total cost for the levels 1..maxLevel (same values as the functions above,
  // but the total is accumulated instead of recomputed for every level).
  function series(gear, maxLevel) {
    const rows = [];
    let total = 0n;
    for (let level = 1; level <= maxLevel; level++) {
      if (level > 1) total += stepCost(level - 2, gear);
      rows.push({
        level,
        effect: getEffect(level - 1, gear),
        cost: stepCost(level - 1, gear),
        total,
      });
    }
    return rows;
  }

  const api = {
    GEARS, MAX_LEVEL,
    getValue, getEffect, countDigits, flattenLong, numberToString,
    effectAtLevel, costForLevel, totalCostUpToLevel, series,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Lawliet = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
