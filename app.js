(function () {
  'use strict';

  const L = globalThis.Lawliet;
  const toolsEl = document.getElementById('tools');
  const levelEl = document.getElementById('level');
  const errorEl = document.getElementById('error');
  const fromEl = document.getElementById('from');
  const fromErrorEl = document.getElementById('from-error');
  const prestigeEl = document.getElementById('prestige');
  const prestigeErrorEl = document.getElementById('prestige-error');
  const coinsEl = document.getElementById('coins');
  const coinsErrorEl = document.getElementById('coins-error');
  const budgetEl = document.getElementById('budget');
  const budget = {
    level: document.getElementById('b-level'),
    levelHint: document.getElementById('b-level-hint'),
    spent: document.getElementById('b-spent'),
    left: document.getElementById('b-left'),
    leftHint: document.getElementById('b-left-hint'),
    gain: document.getElementById('b-gain'),
    gainHint: document.getElementById('b-gain-hint'),
  };
  const resultsEl = document.getElementById('results');
  const planEl = document.getElementById('plan');
  const plan = {
    cost: document.getElementById('plan-cost'),
    costHint: document.getElementById('plan-cost-hint'),
    gain: document.getElementById('plan-gain'),
    gainHint: document.getElementById('plan-gain-hint'),
  };
  const out = {
    effect: document.getElementById('effect'),
    cost: document.getElementById('cost'),
    total: document.getElementById('total'),
  };

  const RANGES = [25, 50, 100, 250, 500];
  const rangesEl = document.getElementById('ranges');
  const noteEl = document.getElementById('dev-note');
  const tableView = document.getElementById('table-view');
  const tableBody = document.getElementById('table-body');
  const charts = globalThis.Charts.create(document.getElementById('charts'), document.getElementById('tooltip'), [
    { key: 'effect', title: 'Effect', sub: 'at each level' },
    { key: 'cost', title: 'Cost', sub: 'for each level' },
    { key: 'total', title: 'Total cost', sub: 'up to each level' },
  ]);

  let selected = 'daily';
  let range = 100;

  function store(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* storage unavailable */ }
  }

  function load(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  function renderTools() {
    toolsEl.innerHTML = '';
    for (const [id, gear] of Object.entries(L.GEARS)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tool';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', String(id === selected));
      btn.dataset.id = id;
      btn.innerHTML = '<span class="emoji"></span><span class="name"></span><span class="alias"></span>';
      btn.querySelector('.emoji').textContent = gear.emoji;
      btn.querySelector('.name').textContent = gear.name;
      btn.querySelector('.alias').textContent = '(' + gear.alias + ')';
      toolsEl.appendChild(btn);
    }
  }

  function renderRanges() {
    rangesEl.innerHTML = '';
    for (const r of RANGES) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', String(r === range));
      btn.dataset.range = String(r);
      btn.textContent = 'Levels 1–' + r;
      rangesEl.appendChild(btn);
    }
  }

  function renderTable(rows, marks) {
    if (!tableView.open) return;
    const frag = document.createDocumentFragment();
    for (const row of rows) {
      const tr = document.createElement('tr');
      if (row.level === marks.from || row.level === marks.to) tr.className = 'selected';
      for (const v of [row.level, row.effect, row.cost, row.total]) {
        const td = document.createElement('td');
        td.textContent = L.numberToString(BigInt(v));
        tr.appendChild(td);
      }
      frag.appendChild(tr);
    }
    tableBody.textContent = '';
    tableBody.appendChild(frag);
  }

  function updateCharts(marks, prestige) {
    const rows = L.series(L.GEARS[selected], range, prestige);
    const beyond = (marks.from !== null && marks.from > range) || (marks.to !== null && marks.to > range);
    noteEl.textContent = 'Levels 1 to ' + range + ' of the ' + L.GEARS[selected].name + '. The dots mark your current and target level' +
      (beyond ? ' (a level beyond this range is not shown).' : '.');
    charts.update(rows, marks);
    renderTable(rows, marks);
  }

  function parseLevel(text) {
    if (!/^\d+$/.test(text.trim())) return null;
    const n = Number(text.trim());
    return n >= 1 && n <= L.MAX_LEVEL ? n : null;
  }

  function parsePrestige(text) {
    if (!/^\d+$/.test(text.trim())) return null;
    const n = Number(text.trim());
    return n <= L.MAX_PRESTIGE ? n : null;
  }

  function showBudget(r, from, gear, prestige) {
    const n = L.numberToString;
    if (r === null) {
      budget.level.textContent = budget.spent.textContent = budget.left.textContent = budget.gain.textContent = '–';
      budget.levelHint.textContent = 'enter your coins';
      budget.leftHint.textContent = budget.gainHint.textContent = '';
      return;
    }
    budget.level.textContent = String(r.level);
    budget.levelHint.textContent = r.level === from
      ? 'not enough coins for the next upgrade yet'
      : '+' + (r.level - from) + (r.level - from === 1 ? ' level' : ' levels') + ', starting at level ' + from;
    budget.spent.textContent = n(r.spent);
    budget.left.textContent = n(r.left);
    budget.leftHint.textContent = r.nextCost === null
      ? 'maximum level reached'
      : 'next upgrade costs ' + n(r.nextCost) + ' (' + n(r.nextCost - r.left) + ' missing)';
    budget.gain.textContent = '+' + n(L.effectGain(from, r.level, gear));
    budget.gainHint.textContent = n(L.effectAtLevel(from, gear)) + ' → ' + n(L.effectAtLevel(r.level, gear));
  }

  function levelError() {
    return 'The level has to be a natural number between 1 and ' + L.numberToString(BigInt(L.MAX_LEVEL)) + '.';
  }

  function update() {
    const from = parseLevel(fromEl.value);
    const to = parseLevel(levelEl.value);
    const prestige = parsePrestige(prestigeEl.value);
    const toInvalid = to === null;
    const fromInvalid = from === null;
    const prestigeInvalid = prestige === null;
    const reversed = !toInvalid && !fromInvalid && to < from;
    const p = prestigeInvalid ? 0 : prestige;
    const gear = L.GEARS[selected];

    const coinsText = coinsEl.value.trim();
    const coins = coinsText === '' ? null : L.parseCoins(coinsText);
    const coinsInvalid = coinsText !== '' && (coins === null || coins > L.MAX_COINS);

    resultsEl.classList.toggle('invalid', toInvalid || prestigeInvalid);
    planEl.classList.toggle('invalid', toInvalid || fromInvalid || reversed || prestigeInvalid);
    fromEl.setAttribute('aria-invalid', String(fromInvalid));
    levelEl.setAttribute('aria-invalid', String(toInvalid || reversed));
    prestigeEl.setAttribute('aria-invalid', String(prestigeInvalid));
    coinsEl.setAttribute('aria-invalid', String(coinsInvalid));
    fromErrorEl.hidden = !fromInvalid;
    errorEl.hidden = !(toInvalid || reversed);
    prestigeErrorEl.hidden = !prestigeInvalid;
    coinsErrorEl.hidden = !coinsInvalid;
    if (fromInvalid) fromErrorEl.textContent = levelError();
    if (toInvalid) errorEl.textContent = levelError();
    else if (reversed) errorEl.textContent = 'The target level must not be lower than the current level.';
    if (prestigeInvalid) prestigeErrorEl.textContent = 'The prestige level has to be a whole number between 0 and ' + L.MAX_PRESTIGE + '.';
    if (coinsInvalid) coinsErrorEl.textContent = 'Enter a number of coins up to ' + L.numberToString(L.MAX_COINS) + ', e.g. 2500000 or 2.5m.';

    updateCharts({ from: from, to: to }, p);

    if (!toInvalid) {
      out.effect.textContent = L.numberToString(L.effectAtLevel(to, gear));
      out.cost.textContent = L.numberToString(L.costForLevel(to, gear, p));
      out.total.textContent = L.numberToString(L.totalCostUpToLevel(to, gear, p));
      store('level', String(to));
    }
    if (!fromInvalid) store('from', String(from));
    if (!prestigeInvalid) store('prestige', String(prestige));
    if (!toInvalid && !fromInvalid && !reversed) {
      plan.cost.textContent = L.numberToString(L.upgradeCost(from, to, gear, p));
      plan.costHint.textContent = 'from level ' + from + ' to level ' + to;
      plan.gain.textContent = '+' + L.numberToString(L.effectGain(from, to, gear));
      plan.gainHint.textContent = L.numberToString(L.effectAtLevel(from, gear)) + ' → ' + L.numberToString(L.effectAtLevel(to, gear));
    }

    const budgetReady = coins !== null && !coinsInvalid && !fromInvalid && !prestigeInvalid;
    budgetEl.classList.toggle('invalid', !budgetReady && coinsText !== '');
    if (coinsText === '') showBudget(null);
    else if (budgetReady) showBudget(L.affordable(coins, from, gear, p), from, gear, p);
    if (!coinsInvalid) store('coins', coinsText);
    store('tool', selected);
  }

  function stepper(input, dec, inc, min, max, parse) {
    const set = function (n) {
      input.value = String(Math.min(Math.max(n, min), max));
      update();
    };
    const current = function (fallback) { const v = parse(input.value); return v === null ? fallback : v; };
    document.getElementById(dec).addEventListener('click', function () { set(current(min + 1) - 1); });
    document.getElementById(inc).addEventListener('click', function () { set(current(min - 1) + 1); });
    input.addEventListener('input', update);
  }

  toolsEl.addEventListener('click', function (e) {
    const btn = e.target.closest('.tool');
    if (!btn) return;
    selected = btn.dataset.id;
    for (const b of toolsEl.children) b.setAttribute('aria-checked', String(b === btn));
    update();
  });

  rangesEl.addEventListener('click', function (e) {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    range = Number(btn.dataset.range);
    store('range', String(range));
    renderRanges();
    update();
  });
  tableView.addEventListener('toggle', update);

  stepper(levelEl, 'dec', 'inc', 1, L.MAX_LEVEL, parseLevel);
  stepper(fromEl, 'from-dec', 'from-inc', 1, L.MAX_LEVEL, parseLevel);
  stepper(prestigeEl, 'prestige-dec', 'prestige-inc', 0, L.MAX_PRESTIGE, parsePrestige);
  coinsEl.addEventListener('input', update);

  const savedTool = load('tool');
  if (savedTool && L.GEARS[savedTool]) selected = savedTool;
  const savedLevel = load('level');
  if (savedLevel && parseLevel(savedLevel) !== null) levelEl.value = savedLevel;
  const savedFrom = load('from');
  if (savedFrom && parseLevel(savedFrom) !== null) fromEl.value = savedFrom;

  const savedPrestige = load('prestige');
  if (savedPrestige && parsePrestige(savedPrestige) !== null) prestigeEl.value = savedPrestige;
  const savedCoins = load('coins');
  if (savedCoins) coinsEl.value = savedCoins;

  const savedRange = Number(load('range'));
  if (RANGES.includes(savedRange)) range = savedRange;

  renderTools();
  renderRanges();
  update();
})();
