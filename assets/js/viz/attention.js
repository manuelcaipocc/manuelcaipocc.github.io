// Attention simulator: scaled dot-product self-attention with three hand-designed heads.
// Ported to vanilla JS from zasa4/attention-visualizer (https://github.com/zasa4/attention-visualizer).
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var D_K = 8;
  var POS_A = 2.5, POS_T = Math.PI / 4;
  var CYCLE_MS = 2400, IDLE_MS = 8000;
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Embedding dims: [ANIMAL, THING, VERB, PREP, DET, PERSON, posX, posY]
  var VOCAB = {
    the: 4, cat: 0, dog: 0, sat: 2, chased: 2, poured: 2, on: 3, into: 3, mat: 1, glass: 1, water: 1, she: 5
  };
  var PRESETS = ['the cat sat on the mat', 'the dog chased the cat', 'she poured water into the glass'];

  var C = Math.cos(POS_T), S = Math.sin(POS_T);
  var Z = [0, 0, 0, 0, 0, 0, 0, 0];
  var HEADS = [
    {
      name: 'Syntactic',
      text: 'Verbs attend to their subject, prepositions to their object.',
      W: [[1, 2, 6, 0, 0, 0, 0, 0], [0, 1, 2, 6, 0, 0, 0, 0], [7, 5, 0, 0, 0, 0, 0, 0], [0, 6, 0, 1, 0, 0, 0, 0],
          [0, 0, 0, 0, 1, 0, 0, 0], [0, 0, 6, 0, 0, 1, 0, 0], Z, Z]
    },
    {
      name: 'Positional',
      text: 'Each token attends mainly to the previous one (a rotation of the positional code).',
      W: [Z, Z, Z, Z, Z, Z, [0, 0, 0, 0, 0, 0, C, -S], [0, 0, 0, 0, 0, 0, S, C]]
    },
    {
      name: 'Determiner',
      text: 'Determiners and the nouns they modify attend to each other.',
      W: [[1, 0, 0, 0, 6, 0, 0, 0], [0, 1, 0, 0, 6, 0, 0, 0], [0, 0, 6, 0, 0, 0, 0, 0], [0, 0, 0, 6, 0, 0, 0, 0],
          [6, 6, 0, 0, 1, 0, 0, 0], [0, 0, 0, 0, 0, 6, 0, 0], Z, Z]
    }
  ];

  function embed(words) {
    return words.map(function (w, i) {
      var v = [0, 0, 0, 0, 0, 0, POS_A * Math.cos(i * POS_T), POS_A * Math.sin(i * POS_T)];
      if (w in VOCAB) v[VOCAB[w]] = 1;
      return v;
    });
  }

  function matMul(a, b) {
    return a.map(function (row) {
      return b[0].map(function (_, c) {
        var s = 0;
        for (var k = 0; k < row.length; k++) s += row[k] * b[k][c];
        return s;
      });
    });
  }

  // softmax(Q·Kᵀ/√d) row-wise; W_K = W_V = I so K = X. Masked scores are -Infinity -> weight 0.
  function attention(X, W, causal) {
    var Q = matMul(X, W), f = 1 / Math.sqrt(D_K);
    return Q.map(function (q, i) {
      var s = X.map(function (k, j) {
        if (causal && j > i) return -Infinity;
        var d = 0;
        for (var t = 0; t < D_K; t++) d += q[t] * k[t];
        return d * f;
      });
      var m = Math.max.apply(null, s);
      var e = s.map(function (x) { return Math.exp(x - m); });
      var z = e.reduce(function (a, b) { return a + b; }, 0);
      return e.map(function (x) { return x / z; });
    });
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function svg(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function segmented(label, items, onPick) {
    var g = el('div', 'mc-viz-switch');
    g.setAttribute('role', 'group');
    g.setAttribute('aria-label', label);
    var buttons = items.map(function (txt, i) {
      var b = el('button', null, txt);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(i === 0));
      b.addEventListener('click', function () {
        buttons.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        onPick(i);
      });
      g.appendChild(b);
      return b;
    });
    return g;
  }

  function init(stage) {
    var state = { preset: 0, head: 0, causal: false, query: 1 };
    var words, weights, timer = 0, idleUntil = 0, visible = false;

    // Controls
    var bar = el('div', 'mc-attn-bar');
    var presetSel = el('select', 'mc-attn-select');
    presetSel.setAttribute('aria-label', 'Sentence');
    PRESETS.forEach(function (p, i) { var o = el('option', null, p); o.value = i; presetSel.appendChild(o); });
    presetSel.addEventListener('change', function () { state.preset = +presetSel.value; state.query = 1; idle(); update(); });
    var mask = el('button', 'mc-attn-mask', 'Causal mask');
    mask.type = 'button';
    mask.setAttribute('aria-pressed', 'false');
    mask.title = 'Decoder-style (GPT): a token only sees itself and earlier tokens';
    mask.addEventListener('click', function () {
      state.causal = !state.causal;
      mask.setAttribute('aria-pressed', String(state.causal));
      update();
    });
    bar.appendChild(presetSel);
    bar.appendChild(mask);

    var heads = segmented('Attention head', HEADS.map(function (h) { return h.name; }), function (i) { state.head = i; update(); });
    heads.classList.add('mc-attn-heads');

    // Views
    var main = el('div', 'mc-attn-main');
    var arcs = svg('svg', { class: 'mc-attn-arcs', role: 'group', 'aria-label': 'Attention arcs from the query token' });
    var heat = el('div', 'mc-attn-heat');
    heat.setAttribute('role', 'img');
    main.appendChild(arcs);
    main.appendChild(heat);
    var note = el('p', 'mc-attn-note');

    stage.appendChild(heads);
    stage.appendChild(bar);
    stage.appendChild(main);
    stage.appendChild(note);

    function idle() { idleUntil = performance.now() + IDLE_MS; }

    function setQuery(i, user) {
      if (user) idle();
      if (i === state.query) return;
      state.query = i;
      draw();
    }

    function update() {
      words = PRESETS[state.preset].split(' ');
      weights = attention(embed(words), HEADS[state.head].W, state.causal);
      if (state.query >= words.length) state.query = 0;
      buildTokens();
      draw();
      note.textContent = HEADS[state.head].text + ' \u00b7 softmax(QK\u1d40/\u221ad)' + (state.causal ? ' \u00b7 future masked' : '');
    }

    var COL = 84, BASE = 100, H = 140;
    var arcLayer, tokenLayer;

    function buildTokens() {
      var n = words.length;
      arcs.setAttribute('viewBox', '0 0 ' + n * COL + ' ' + H);
      arcs.textContent = '';
      arcLayer = svg('g', { 'pointer-events': 'none' });
      tokenLayer = svg('g', {});
      arcs.appendChild(arcLayer);
      arcs.appendChild(tokenLayer);
      words.forEach(function (w, i) {
        var g = svg('g', { class: 'mc-attn-tok', tabindex: '0', role: 'button', 'aria-label': 'Query token ' + w });
        g.appendChild(svg('rect', { x: i * COL, y: 0, width: COL, height: H, fill: 'transparent' }));
        g.appendChild(svg('circle', { cx: i * COL + COL / 2, cy: BASE, r: 3 }));
        var t = svg('text', { x: i * COL + COL / 2, y: BASE + 28, 'text-anchor': 'middle' });
        t.textContent = w;
        g.appendChild(t);
        g.addEventListener('pointerenter', function () { setQuery(i, true); });
        g.addEventListener('focus', function () { setQuery(i, true); });
        g.addEventListener('click', function () { setQuery(i, true); });
        tokenLayer.appendChild(g);
      });

      heat.textContent = '';
      heat.style.gridTemplateColumns = 'auto repeat(' + n + ', 1fr)';
      heat.appendChild(el('span'));
      words.forEach(function (w) { heat.appendChild(el('span', 'mc-attn-lbl mc-attn-col', w)); });
      weights.forEach(function (row, i) {
        var lbl = el('span', 'mc-attn-lbl', words[i]);
        lbl.addEventListener('pointerenter', function () { setQuery(i, true); });
        heat.appendChild(lbl);
        row.forEach(function (w, j) {
          var c = el('span', 'mc-attn-cell');
          c.dataset.row = i;
          c.title = words[i] + ' \u2192 ' + words[j] + ': ' + w.toFixed(2);
          if (state.causal && j > i) c.classList.add('is-masked');
          else c.style.background = 'rgba(56,217,230,' + (0.06 + w * 0.94).toFixed(3) + ')';
          c.addEventListener('pointerenter', function () { setQuery(i, true); });
          heat.appendChild(c);
        });
      });
      heat.setAttribute('aria-label', 'Attention matrix, rows are queries and columns are keys');
    }

    function arcPath(i, j) {
      var x1 = i * COL + COL / 2, x2 = j * COL + COL / 2;
      if (i === j) return 'M ' + (x1 - 16) + ' ' + BASE + ' Q ' + x1 + ' ' + (BASE - 46) + ' ' + (x1 + 16) + ' ' + BASE;
      var lift = Math.min(BASE - 10, 30 + Math.abs(x2 - x1) * 0.34);
      return 'M ' + x1 + ' ' + BASE + ' Q ' + (x1 + x2) / 2 + ' ' + (BASE - lift) + ' ' + x2 + ' ' + BASE;
    }

    function draw() {
      var q = state.query, row = weights[q];
      arcLayer.textContent = '';
      var paths = [];
      row.forEach(function (w, j) {
        if (w < 0.02) return;
        var p = svg('path', {
          d: arcPath(q, j),
          pathLength: '1',
          stroke: 'rgba(56,217,230,' + (0.25 + w * 0.75).toFixed(3) + ')',
          'stroke-width': (1 + w * 10).toFixed(2)
        });
        arcLayer.appendChild(p);
        paths.push(p);
      });
      if (!reduceMotion) {
        requestAnimationFrame(function () { paths.forEach(function (p) { p.classList.add('is-drawn'); }); });
      } else {
        paths.forEach(function (p) { p.classList.add('is-drawn'); });
      }
      Array.prototype.forEach.call(tokenLayer.children, function (g, i) {
        g.classList.toggle('is-query', i === q);
        g.classList.toggle('is-target', i !== q && row[i] >= 0.02);
      });
      Array.prototype.forEach.call(heat.querySelectorAll('.mc-attn-cell'), function (c) {
        c.classList.toggle('is-row', +c.dataset.row === q);
      });
    }

    function tick() {
      timer = 0;
      if (!visible || document.hidden) return;
      if (performance.now() > idleUntil) setQuery((state.query + 1) % words.length, false);
      schedule();
    }

    function schedule() {
      if (!timer && !reduceMotion && visible && !document.hidden) timer = setTimeout(tick, CYCLE_MS);
    }

    update();
    stage.classList.add('is-ready');

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) schedule(); else { clearTimeout(timer); timer = 0; }
      }).observe(stage);
    } else {
      visible = true;
      schedule();
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { clearTimeout(timer); timer = 0; } else schedule();
    });
  }

  document.querySelectorAll('[data-mc-viz="attention"]').forEach(init);
})();
