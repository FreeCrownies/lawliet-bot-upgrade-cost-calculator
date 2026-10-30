(function () {
  'use strict';

  const L = globalThis.Lawliet;
  const toolsEl = document.getElementById('tools');
  const levelEl = document.getElementById('level');
  const errorEl = document.getElementById('error');
  const fromEl = document.getElementById('from');
  const fromErrorEl = document.getElementById('from-error');
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

  function updateCharts(marks) {
    const rows = L.series(L.GEARS[selected], range);
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

  function levelError() {
    return 'The level has to be a natural number between 1 and ' + L.numberToString(BigInt(L.MAX_LEVEL)) + '.';
  }

  function update() {
    const from = parseLevel(fromEl.value);
    const to = parseLevel(levelEl.value);
    const toInvalid = to === null;
    const fromInvalid = from === null;
    const reversed = !toInvalid && !fromInvalid && to < from;

    resultsEl.classList.toggle('invalid', toInvalid);
    planEl.classList.toggle('invalid', toInvalid || fromInvalid || reversed);
    fromEl.setAttribute('aria-invalid', String(fromInvalid));
    levelEl.setAttribute('aria-invalid', String(toInvalid || reversed));
    fromErrorEl.hidden = !fromInvalid;
    errorEl.hidden = !(toInvalid || reversed);
    if (fromInvalid) fromErrorEl.textContent = levelError();
    if (toInvalid) errorEl.textContent = levelError();
    else if (reversed) errorEl.textContent = 'The target level must not be lower than the current level.';

    updateCharts({ from: from, to: to });

    const gear = L.GEARS[selected];
    if (!toInvalid) {
      out.effect.textContent = L.numberToString(L.effectAtLevel(to, gear));
      out.cost.textContent = L.numberToString(L.costForLevel(to, gear));
      out.total.textContent = L.numberToString(L.totalCostUpToLevel(to, gear));
      store('level', String(to));
    }
    if (!fromInvalid) store('from', String(from));
    if (!toInvalid && !fromInvalid && !reversed) {
      plan.cost.textContent = L.numberToString(L.upgradeCost(from, to, gear));
      plan.costHint.textContent = 'from level ' + from + ' to level ' + to;
      plan.gain.textContent = '+' + L.numberToString(L.effectGain(from, to, gear));
      plan.gainHint.textContent = L.numberToString(L.effectAtLevel(from, gear)) + ' → ' + L.numberToString(L.effectAtLevel(to, gear));
    }
    store('tool', selected);
  }

  function stepper(input, dec, inc) {
    const set = function (n) {
      input.value = String(Math.min(Math.max(n, 1), L.MAX_LEVEL));
      update();
    };
    document.getElementById(dec).addEventListener('click', function () { set((parseLevel(input.value) || 1) - 1); });
    document.getElementById(inc).addEventListener('click', function () { set((parseLevel(input.value) || 0) + 1); });
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

  stepper(levelEl, 'dec', 'inc');
  stepper(fromEl, 'from-dec', 'from-inc');

  const savedTool = load('tool');
  if (savedTool && L.GEARS[savedTool]) selected = savedTool;
  const savedLevel = load('level');
  if (savedLevel && parseLevel(savedLevel) !== null) levelEl.value = savedLevel;
  const savedFrom = load('from');
  if (savedFrom && parseLevel(savedFrom) !== null) fromEl.value = savedFrom;

  const savedRange = Number(load('range'));
  if (RANGES.includes(savedRange)) range = savedRange;

  renderTools();
  renderRanges();
  update();
})();
