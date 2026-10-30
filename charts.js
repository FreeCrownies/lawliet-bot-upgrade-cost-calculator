/*
 * Small dependency-free SVG line charts with a shared crosshair and tooltip.
 * Charts.create(mount, tooltip, definitions) -> { update(rows, selectedLevel) }
 */
(function (root) {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const HEIGHT = 190;
  const M = { top: 12, right: 16, bottom: 26, left: 58 };

  function el(name, attrs, parent) {
    const node = document.createElementNS(NS, name);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  // 1, 2, 2.5, 5 x 10^k that is >= raw
  function niceStep(raw) {
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    for (const f of [1, 2, 2.5, 5, 10]) if (f * pow >= raw) return f * pow;
    return 10 * pow;
  }

  const UNITS = [[1e18, 'Qi'], [1e15, 'Qa'], [1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']];

  // Axis labels: full number below 10 000, compact above (2.5K, 40M, 1.2B ...)
  function compact(n) {
    if (n < 10000) return String(n);
    for (const [size, unit] of UNITS) {
      if (n >= size) return String(Math.round(n / size * 100) / 100) + unit;
    }
    return String(n);
  }

  function create(mount, tooltip, defs) {
    let rows = [];
    let selected = null;
    let hover = null;
    let charts = [];
    let width = 0;

    function build() {
      mount.textContent = '';
      width = Math.max(280, Math.floor(mount.clientWidth));
      charts = defs.map(buildChart);
      applyHover();
    }

    function buildChart(def) {
      const fig = document.createElement('figure');
      fig.className = 'chart';
      const cap = document.createElement('figcaption');
      const h = document.createElement('h3');
      h.textContent = def.title;
      const sub = document.createElement('span');
      sub.textContent = def.sub;
      cap.append(h, sub);
      fig.appendChild(cap);

      const svg = el('svg', { width: width, height: HEIGHT, viewBox: '0 0 ' + width + ' ' + HEIGHT, tabindex: 0, role: 'img',
        'aria-label': def.title + ' by level. Use the arrow keys to read values, or open the table view.' }, fig);
      mount.appendChild(fig);

      const n = rows.length;
      const values = rows.map(r => Number(r[def.key]));
      const max = Math.max.apply(null, values) || 1;
      const step = niceStep(max / 4);
      const yMax = Math.ceil(max / step) * step;
      const plotW = width - M.left - M.right;
      const plotH = HEIGHT - M.top - M.bottom;
      const x = i => M.left + (n > 1 ? i / (n - 1) : 0) * plotW;
      const y = v => M.top + (1 - v / yMax) * plotH;

      // grid + y labels
      for (let v = 0; v <= yMax + step / 2; v += step) {
        const yy = Math.round(y(v)) + 0.5;
        el('line', { x1: M.left, x2: width - M.right, y1: yy, y2: yy, class: v === 0 ? 'baseline' : 'grid' }, svg);
        const t = el('text', { x: M.left - 8, y: yy + 4, 'text-anchor': 'end', class: 'tick' }, svg);
        t.textContent = compact(v);
      }

      // x labels (levels): the first level plus multiples of a nice step
      const xStep = niceStep(n / 5);
      const ticks = [1];
      for (let lv = xStep; lv <= n; lv += xStep) if (lv - 1 > xStep * 0.4) ticks.push(lv);
      for (const lv of ticks) {
        const t = el('text', { x: x(lv - 1), y: HEIGHT - 6, 'text-anchor': lv === 1 ? 'start' : 'middle', class: 'tick' }, svg);
        t.textContent = String(lv);
      }

      const pts = values.map((v, i) => x(i).toFixed(1) + ',' + y(v).toFixed(1));
      el('polygon', { class: 'area', points: x(0) + ',' + y(0) + ' ' + pts.join(' ') + ' ' + x(n - 1) + ',' + y(0) }, svg);
      el('polyline', { class: 'line', points: pts.join(' ') }, svg);

      // selected level
      let selDot = null;
      if (selected !== null && selected >= 1 && selected <= n) {
        selDot = el('circle', { class: 'dot', cx: x(selected - 1), cy: y(values[selected - 1]), r: 5 }, svg);
      }

      // hover layer
      const vline = el('line', { class: 'crosshair', y1: M.top, y2: M.top + plotH, visibility: 'hidden' }, svg);
      const hdot = el('circle', { class: 'dot', r: 4, visibility: 'hidden' }, svg);

      const chart = { svg, x, y, values, vline, hdot, selDot };

      function indexFromEvent(e) {
        const r = svg.getBoundingClientRect();
        const px = (e.clientX - r.left) * (width / r.width);
        return Math.min(n - 1, Math.max(0, Math.round((px - M.left) / plotW * (n - 1))));
      }
      svg.addEventListener('pointermove', function (e) { hover = indexFromEvent(e); applyHover(e); });
      svg.addEventListener('pointerleave', function () { hover = null; applyHover(); });
      svg.addEventListener('blur', function () { hover = null; applyHover(); });
      svg.addEventListener('keydown', function (e) {
        const dir = { ArrowLeft: -1, ArrowRight: 1, Home: -Infinity, End: Infinity }[e.key];
        if (dir === undefined) return;
        e.preventDefault();
        const start = hover === null ? (selected !== null && selected <= n ? selected - 1 : 0) : hover;
        hover = Math.min(n - 1, Math.max(0, isFinite(dir) ? start + dir : (dir < 0 ? 0 : n - 1)));
        applyHover(null, svg);
      });
      return chart;
    }

    function applyHover(pointerEvent, keyboardSvg) {
      if (!charts.length) return;
      for (const c of charts) {
        if (hover === null) {
          c.vline.setAttribute('visibility', 'hidden');
          c.hdot.setAttribute('visibility', 'hidden');
          continue;
        }
        const cx = c.x(hover);
        c.vline.setAttribute('x1', cx);
        c.vline.setAttribute('x2', cx);
        c.vline.setAttribute('visibility', 'visible');
        c.hdot.setAttribute('cx', cx);
        c.hdot.setAttribute('cy', c.y(c.values[hover]));
        c.hdot.setAttribute('visibility', 'visible');
      }
      if (hover === null) { tooltip.hidden = true; return; }

      const row = rows[hover];
      tooltip.textContent = '';
      const head = document.createElement('div');
      head.className = 'tip-level';
      head.textContent = 'Level ' + row.level;
      tooltip.appendChild(head);
      for (const def of defs) {
        const line = document.createElement('div');
        line.className = 'tip-row';
        const key = document.createElement('span');
        key.className = 'tip-key';
        const val = document.createElement('strong');
        val.textContent = root.Lawliet.numberToString(row[def.key]);
        const name = document.createElement('span');
        name.className = 'tip-name';
        name.textContent = def.title;
        line.append(key, val, name);
        tooltip.appendChild(line);
      }
      tooltip.hidden = false;

      // position next to the pointer (or the focused chart), flipped near the right edge
      const m = tooltip.offsetParent.getBoundingClientRect();
      const svgEl = keyboardSvg || (pointerEvent && pointerEvent.currentTarget);
      const sr = svgEl ? svgEl.getBoundingClientRect() : m;
      const cx = charts[0].x(hover) * (sr.width / width);
      const left = sr.left - m.left + cx;
      const top = pointerEvent ? pointerEvent.clientY - m.top : sr.top - m.top + 24;
      const tw = tooltip.offsetWidth;
      tooltip.style.left = (left + 16 + tw > m.width ? left - 16 - tw : left + 16) + 'px';
      tooltip.style.top = Math.max(0, top - tooltip.offsetHeight - 12) + 'px';
    }

    let resizeTimer = null;
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(function () {
        if (Math.floor(mount.clientWidth) === width || !rows.length) return;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(build, 60);
      }).observe(mount);
    }

    return {
      update: function (newRows, selectedLevel) {
        rows = newRows;
        selected = selectedLevel;
        if (hover !== null && hover >= rows.length) hover = null;
        build();
      },
    };
  }

  root.Charts = { create: create, compact: compact };
})(typeof globalThis !== 'undefined' ? globalThis : this);
