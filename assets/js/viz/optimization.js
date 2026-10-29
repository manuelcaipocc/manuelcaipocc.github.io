// Numerical optimization: contour map of a 2D objective + trajectories computed with real GD / Adam updates.
(function () {
  'use strict';

  var BG = '#070D14';
  var COLORS = [[56, 217, 230], [66, 133, 244], [128, 232, 242], [92, 164, 250], [176, 242, 248]];
  var DPR_MAX = 1.5;
  var FRAME_MS = 1000 / 30;
  var TRAVEL = 11000, HOLD = 2600, FADE = 1200, FADE_IN = 700; // ms, ~15 s loop
  var PARTICLES = 10;
  var MAX_STEP = 0.35; // step-norm clipping keeps early steps on steep walls readable
  var LEVELS = 12;
  var METHOD_LABEL = { gd: 'Gradient descent', adam: 'Adam' };
  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var SURFACES = [
    {
      name: 'Himmelblau',
      span: 5.4,
      f: function (x, y) { var a = x * x + y - 11, b = x + y * y - 7; return a * a + b * b; },
      grad: function (x, y) { var a = x * x + y - 11, b = x + y * y - 7; return [4 * x * a + 2 * b, 2 * a + 4 * y * b]; },
      minima: [[3, 2], [-2.805118, 3.131312], [-3.77931, -3.283186], [3.584428, -1.848126]],
      lr: { gd: 0.008, adam: 0.06 },
      steps: 140
    },
    {
      name: 'Rotated quadratic',
      span: 3.2,
      f: function (x, y) { var s = x + y, d = x - y; return s * s + 0.2 * d * d; },
      grad: function (x, y) { var s = x + y, d = x - y; return [2 * s + 0.4 * d, 2 * s - 0.4 * d]; },
      minima: [[0, 0]],
      lr: { gd: 0.08, adam: 0.12 },
      steps: 110
    }
  ];

  function optimize(surface, method, start) {
    var x = start[0], y = start[1];
    var path = [x, y];
    var lr = surface.lr[method];
    var b1 = 0.9, b2 = 0.999, eps = 1e-8;
    var m0 = 0, m1 = 0, v0 = 0, v1 = 0;
    for (var t = 1; t <= surface.steps; t++) {
      var g = surface.grad(x, y), dx, dy;
      if (method === 'adam') {
        m0 = b1 * m0 + (1 - b1) * g[0];
        m1 = b1 * m1 + (1 - b1) * g[1];
        v0 = b2 * v0 + (1 - b2) * g[0] * g[0];
        v1 = b2 * v1 + (1 - b2) * g[1] * g[1];
        var c1 = 1 - Math.pow(b1, t), c2 = 1 - Math.pow(b2, t);
        dx = -lr * (m0 / c1) / (Math.sqrt(v0 / c2) + eps);
        dy = -lr * (m1 / c1) / (Math.sqrt(v1 / c2) + eps);
      } else {
        dx = -lr * g[0];
        dy = -lr * g[1];
      }
      var n = Math.sqrt(dx * dx + dy * dy);
      if (n > MAX_STEP) { dx *= MAX_STEP / n; dy *= MAX_STEP / n; }
      x += dx;
      y += dy;
      path.push(x, y);
    }
    return path;
  }

  function init(stage) {
    var canvas = stage.querySelector('canvas');
    var ctx = canvas && canvas.getContext('2d');
    if (!ctx) return;
    var caption = stage.querySelector('.mc-viz-caption');
    var buttons = stage.querySelectorAll('[data-method]');

    var surfaceIdx = 0, method = 'gd';
    var W = 0, H = 0, dpr = 1, scale = 1;
    var contour = document.createElement('canvas');
    var starts = [], paths = [];
    var clock = 0, last = 0, raf = 0, visible = false, hover = -1;

    function surface() { return SURFACES[surfaceIdx]; }
    function px(x) { return W / 2 + x * scale; }
    function py(y) { return H / 2 - y * scale; }

    function pickStarts() {
      var s = surface();
      var hx = Math.min(W / (2 * scale), s.span) * 0.9, hy = s.span * 0.88;
      starts = [];
      for (var i = 0; i < PARTICLES; i++) {
        var best = null, bestD = -1;
        for (var k = 0; k < 14; k++) {
          var c = [(Math.random() * 2 - 1) * hx, (Math.random() * 2 - 1) * hy];
          var d = Infinity;
          starts.concat(s.minima).forEach(function (p) {
            d = Math.min(d, Math.hypot(p[0] - c[0], p[1] - c[1]));
          });
          if (d > bestD) { bestD = d; best = c; }
        }
        starts.push(best);
      }
    }

    function computePaths() {
      paths = starts.map(function (p) { return optimize(surface(), method, p); });
    }

    function buildContours() {
      var s = surface();
      contour.width = canvas.width;
      contour.height = canvas.height;
      var c = contour.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.fillStyle = BG;
      c.fillRect(0, 0, W, H);

      var step = 4, cols = Math.ceil(W / step) + 1, rows = Math.ceil(H / step) + 1;
      var g = new Float32Array(cols * rows);
      for (var j = 0; j < rows; j++) {
        for (var i = 0; i < cols; i++) {
          var x = (i * step - W / 2) / scale, y = (H / 2 - j * step) / scale;
          g[j * cols + i] = Math.log(1 + s.f(x, y));
        }
      }
      // Quantile levels spread the iso-lines evenly over the visible area
      var sorted = Array.prototype.slice.call(g).sort(function (a, b) { return a - b; });
      var levels = [];
      for (var l = 0; l < LEVELS; l++) levels.push(sorted[Math.floor(((l + 0.35) / LEVELS) * (sorted.length - 1))]);
      var gmin = sorted[0], gmax = sorted[sorted.length - 1];

      // Faint basin shading
      var img = c.createImageData(cols, rows);
      for (var q = 0; q < g.length; q++) {
        var t = 1 - (g[q] - gmin) / (gmax - gmin + 1e-9);
        var a = Math.pow(t, 3) * 0.32;
        img.data[q * 4] = 56; img.data[q * 4 + 1] = 150; img.data[q * 4 + 2] = 230; img.data[q * 4 + 3] = a * 255;
      }
      var tmp = document.createElement('canvas');
      tmp.width = cols; tmp.height = rows;
      tmp.getContext('2d').putImageData(img, 0, 0);
      c.imageSmoothingEnabled = true;
      c.drawImage(tmp, 0, 0, cols * step, rows * step);

      // Marching squares
      c.lineWidth = 1;
      levels.forEach(function (lv, li) {
        var t = li / (LEVELS - 1);
        var col = [Math.round(56 + (66 - 56) * t), Math.round(217 + (133 - 217) * t), Math.round(230 + (244 - 230) * t)];
        c.strokeStyle = 'rgba(' + col.join(',') + ',' + (0.34 - 0.2 * t).toFixed(3) + ')';
        c.beginPath();
        for (var j = 0; j < rows - 1; j++) {
          for (var i = 0; i < cols - 1; i++) {
            var v = [g[j * cols + i], g[j * cols + i + 1], g[(j + 1) * cols + i + 1], g[(j + 1) * cols + i]];
            var X = i * step, Y = j * step, pts = [];
            // edges: top(0-1), right(1-2), bottom(2-3), left(3-0)
            var E = [[0, 1, X, Y, X + step, Y], [1, 2, X + step, Y, X + step, Y + step], [2, 3, X + step, Y + step, X, Y + step], [3, 0, X, Y + step, X, Y]];
            for (var e = 0; e < 4; e++) {
              var a0 = v[E[e][0]] - lv, a1 = v[E[e][1]] - lv;
              if ((a0 < 0) !== (a1 < 0)) {
                var u = a0 / (a0 - a1);
                pts.push(E[e][2] + (E[e][4] - E[e][2]) * u, E[e][3] + (E[e][5] - E[e][3]) * u);
              }
            }
            if (pts.length >= 4) { c.moveTo(pts[0], pts[1]); c.lineTo(pts[2], pts[3]); }
            if (pts.length === 8) { c.moveTo(pts[4], pts[5]); c.lineTo(pts[6], pts[7]); }
          }
        }
        c.stroke();
      });

      // Minima markers
      c.strokeStyle = 'rgba(200,245,250,0.45)';
      s.minima.forEach(function (m) {
        var x = px(m[0]), y = py(m[1]);
        c.beginPath();
        c.moveTo(x - 4, y); c.lineTo(x + 4, y);
        c.moveTo(x, y - 4); c.lineTo(x, y + 4);
        c.stroke();
      });
    }

    function updateCaption() {
      if (caption) caption.textContent = 'f(x,y): ' + surface().name + ' \u00b7 ' + METHOD_LABEL[method];
    }

    function resize() {
      var r = stage.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return false;
      dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      scale = H / (2 * surface().span);
      buildContours();
      return true;
    }

    function restart(nextSurface) {
      if (nextSurface) {
        surfaceIdx = (surfaceIdx + 1) % SURFACES.length;
        scale = H / (2 * surface().span);
        buildContours();
      }
      pickStarts();
      computePaths();
      updateCaption();
      clock = 0;
    }

    function draw(time) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(contour, 0, 0, W, H);

      var fade = 1;
      if (time < FADE_IN) fade = time / FADE_IN;
      if (time > TRAVEL + HOLD) fade = Math.max(0, 1 - (time - TRAVEL - HOLD) / FADE);
      var progress = Math.min(time / TRAVEL, 1);

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'lighter';
      paths.forEach(function (p, idx) {
        var steps = p.length / 2 - 1;
        var f = progress * steps, k = Math.min(Math.floor(f), steps - 1), fr = f - k;
        var hx = p[2 * k] + (p[2 * k + 2] - p[2 * k]) * fr, hy = p[2 * k + 1] + (p[2 * k + 3] - p[2 * k + 1]) * fr;
        var col = COLORS[idx % COLORS.length].join(',');
        var emph = hover === -1 ? 1 : (hover === idx ? 1.9 : 0.45);
        ctx.globalAlpha = fade;

        // Full trajectory, faint
        ctx.strokeStyle = 'rgba(' + col + ',' + Math.min(0.22 * emph, 0.75) + ')';
        ctx.lineWidth = hover === idx ? 1.6 : 1;
        ctx.beginPath();
        ctx.moveTo(px(p[0]), py(p[1]));
        for (var i = 1; i <= k; i++) ctx.lineTo(px(p[2 * i]), py(p[2 * i + 1]));
        ctx.lineTo(px(hx), py(hy));
        ctx.stroke();

        // Luminous tail over the last iterations
        var t0 = Math.max(0, k - 9);
        ctx.strokeStyle = 'rgba(' + col + ',' + Math.min(0.55 * emph, 0.95) + ')';
        ctx.lineWidth = hover === idx ? 2.2 : 1.5;
        ctx.beginPath();
        ctx.moveTo(px(p[2 * t0]), py(p[2 * t0 + 1]));
        for (var j = t0 + 1; j <= k; j++) ctx.lineTo(px(p[2 * j]), py(p[2 * j + 1]));
        ctx.lineTo(px(hx), py(hy));
        ctx.stroke();

        // Start marker
        ctx.strokeStyle = 'rgba(' + col + ',0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px(p[0]), py(p[1]), 2.5, 0, Math.PI * 2);
        ctx.stroke();

        // Glowing head
        var X = px(hx), Y = py(hy);
        var glow = ctx.createRadialGradient(X, Y, 0, X, Y, 9);
        glow.addColorStop(0, 'rgba(' + col + ',' + Math.min(0.45 * emph, 0.8) + ')');
        glow.addColorStop(1, 'rgba(' + col + ',0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(X, Y, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(235,252,255,0.95)';
        ctx.beginPath();
        ctx.arc(X, Y, hover === idx ? 2.6 : 1.9, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    function render() { draw(reduceMotion ? TRAVEL : clock); }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      var dt = now - last;
      if (dt < FRAME_MS - 2) return;
      last = now;
      clock += Math.min(dt, 100);
      if (clock > TRAVEL + HOLD + FADE) restart(true);
      draw(clock);
    }

    function play() {
      if (raf || reduceMotion || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function pause() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    function nearest(mx, my) {
      var best = -1, bestD = 26;
      var progress = reduceMotion ? 1 : Math.min(clock / TRAVEL, 1);
      paths.forEach(function (p, idx) {
        var k = Math.floor(progress * (p.length / 2 - 1));
        for (var i = 0; i <= k; i++) {
          var d = Math.hypot(px(p[2 * i]) - mx, py(p[2 * i + 1]) - my);
          if (d < bestD) { bestD = d; best = idx; }
        }
      });
      return best;
    }

    canvas.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      var h = nearest(e.clientX - r.left, e.clientY - r.top);
      if (h !== hover) { hover = h; if (!raf) render(); }
    });
    canvas.addEventListener('pointerleave', function () {
      if (hover !== -1) { hover = -1; if (!raf) render(); }
    });
    canvas.addEventListener('click', function () { restart(false); render(); });
    canvas.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); restart(false); render(); }
    });

    buttons.forEach(function (b) {
      b.addEventListener('click', function () {
        method = b.dataset.method;
        buttons.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        computePaths();
        updateCaption();
        clock = 0;
        render();
      });
    });

    if (!resize()) return;
    restart(false);
    render();
    stage.classList.add('is-ready');

    if (window.ResizeObserver) {
      var lastW = W;
      new ResizeObserver(function () {
        if (Math.abs(stage.getBoundingClientRect().width - lastW) < 1) return;
        if (resize()) { lastW = W; pickStarts(); computePaths(); render(); }
      }).observe(stage);
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) play(); else pause();
      }).observe(stage);
    } else {
      visible = true;
      play();
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) pause(); else play();
    });
  }

  document.querySelectorAll('[data-mc-viz="optimization"]').forEach(init);
})();
