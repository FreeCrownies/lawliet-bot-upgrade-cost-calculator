(function () {
  'use strict';

  const L = globalThis.Lawliet;
  const toolsEl = document.getElementById('tools');
  const levelEl = document.getElementById('level');
  const errorEl = document.getElementById('error');
  const resultsEl = document.getElementById('results');
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

  function renderTable(rows, level) {
    if (!tableView.open) return;
    const frag = document.createDocumentFragment();
    for (const row of rows) {
      const tr = document.createElement('tr');
      if (row.level === level) tr.className = 'selected';
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

  function updateCharts(level) {
    const rows = L.series(L.GEARS[selected], range);
    noteEl.textContent = 'Levels 1 to ' + range + ' of the ' + L.GEARS[selected].name + '. The dot marks your level' +
      (level !== null && level > range ? ' (beyond this range).' : '.');
    charts.update(rows, level);
    renderTable(rows, level);
  }

  function parseLevel(text) {
    if (!/^\d+$/.test(text.trim())) return null;
    const n = Number(text.trim());
    return n >= 1 && n <= L.MAX_LEVEL ? n : null;
  }

  function update() {
    const level = parseLevel(levelEl.value);
    const invalid = level === null;
    resultsEl.classList.toggle('invalid', invalid);
    levelEl.setAttribute('aria-invalid', String(invalid));
    errorEl.hidden = !invalid;

    updateCharts(level);

    if (invalid) {
      errorEl.textContent = 'The level has to be a natural number between 1 and ' + L.numberToString(BigInt(L.MAX_LEVEL)) + '.';
      return;
    }

    const gear = L.GEARS[selected];
    out.effect.textContent = L.numberToString(L.effectAtLevel(level, gear));
    out.cost.textContent = L.numberToString(L.costForLevel(level, gear));
    out.total.textContent = L.numberToString(L.totalCostUpToLevel(level, gear));
    store('tool', selected);
    store('level', String(level));
  }

  function setLevel(n) {
    levelEl.value = String(Math.min(Math.max(n, 1), L.MAX_LEVEL));
    update();
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
  tableView.addEventListener('toggle', function () { updateCharts(parseLevel(levelEl.value)); });

  levelEl.addEventListener('input', update);
  document.getElementById('dec').addEventListener('click', function () { setLevel((parseLevel(levelEl.value) || 1) - 1); });
  document.getElementById('inc').addEventListener('click', function () { setLevel((parseLevel(levelEl.value) || 0) + 1); });

  const savedTool = load('tool');
  if (savedTool && L.GEARS[savedTool]) selected = savedTool;
  const savedLevel = load('level');
  if (savedLevel && parseLevel(savedLevel) !== null) levelEl.value = savedLevel;

  const savedRange = Number(load('range'));
  if (RANGES.includes(savedRange)) range = savedRange;

  renderTools();
  renderRanges();
  update();
})();
