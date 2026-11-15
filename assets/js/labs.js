/* Software demos: adaptive sampling, nearest-neighbour coarsening, fee routing. */
(function () {
  'use strict';
  const C = window.HMC, MONO = window.HMMONO, fit = window.HMfit;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // small seeded generator so each demo opens on the same picture
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  function gauss(r) { return Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(2 * Math.PI * r()); }
  const onResize = (cv, fn) => { if ('ResizeObserver' in window) new ResizeObserver(fn).observe(cv); };

  // =========================================================
  // Recursive polynomial adaptive sampling
  // =========================================================
  (function () {
    const root = document.getElementById('rpas-lab'); if (!root) return;
    const cv = root.querySelector('canvas');
    const TARGETS = [
      (x) => Math.sin(x) + 0.55 * Math.sin(3.1 * x) * Math.exp(-0.5 * (x - 7) * (x - 7)) * 2.2 + 0.08 * x,
      (x) => Math.tanh(4 * (x - 4)) + 0.4 * Math.sin(2 * x) + (x > 8 ? 0.8 * Math.sin(6 * x) * (x - 8) / 2 : 0),
      (x) => 1.4 * Math.exp(-2.5 * (x - 3) * (x - 3)) - 1.1 * Math.exp(-6 * (x - 7.5) * (x - 7.5)) + 0.15 * Math.sin(1.3 * x),
    ];
    let which = 0, xs, ys, sampled, iter, model, done, timer = null;

    function polyfit2(X, Y) { // least-squares quadratic via normal equations
      let s = [0, 0, 0, 0, 0], t = [0, 0, 0];
      for (let i = 0; i < X.length; i++) { const x = X[i]; let p = 1; for (let k = 0; k < 5; k++) { s[k] += p; if (k < 3) t[k] += p * Y[i]; p *= x; } }
      const A = [[s[0], s[1], s[2], t[0]], [s[1], s[2], s[3], t[1]], [s[2], s[3], s[4], t[2]]];
      for (let i = 0; i < 3; i++) { let p = i; for (let r = i + 1; r < 3; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r; [A[i], A[p]] = [A[p], A[i]]; for (let r = i + 1; r < 3; r++) { const f = A[r][i] / A[i][i]; for (let c = i; c < 4; c++) A[r][c] -= f * A[i][c]; } }
      const c = [0, 0, 0]; for (let i = 2; i >= 0; i--) { let v = A[i][3]; for (let j = i + 1; j < 3; j++) v -= A[i][j] * c[j]; c[i] = v / A[i][i]; }
      return (x) => c[0] + c[1] * x + c[2] * x * x;
    }
    function spline(X, Y) { // natural cubic interpolating spline
      const n = X.length - 1, h = [], al = [], l = [1], mu = [0], z = [0], c = new Array(n + 1).fill(0), b = [], d = [];
      for (let i = 0; i < n; i++) h[i] = X[i + 1] - X[i];
      for (let i = 1; i < n; i++) al[i] = (3 / h[i]) * (Y[i + 1] - Y[i]) - (3 / h[i - 1]) * (Y[i] - Y[i - 1]);
      for (let i = 1; i < n; i++) { l[i] = 2 * (X[i + 1] - X[i - 1]) - h[i - 1] * mu[i - 1]; mu[i] = h[i] / l[i]; z[i] = (al[i] - h[i - 1] * z[i - 1]) / l[i]; }
      for (let j = n - 1; j >= 0; j--) { c[j] = z[j] - mu[j] * c[j + 1]; b[j] = (Y[j + 1] - Y[j]) / h[j] - (h[j] * (c[j + 1] + 2 * c[j])) / 3; d[j] = (c[j + 1] - c[j]) / (3 * h[j]); }
      return (x) => { let j = 0, hi = n - 1; while (j < hi) { const m = (j + hi + 1) >> 1; if (X[m] <= x) j = m; else hi = m - 1; } const t = x - X[j]; return Y[j] + b[j] * t + c[j] * t * t + d[j] * t * t * t; };
    }
    function fitModel() {
      const idx = Array.from(sampled).sort((a, b) => a - b), X = idx.map((i) => xs[i]), Y = idx.map((i) => ys[i]);
      const base = polyfit2(X, Y), res = spline(X, Y.map((y, i) => y - base(X[i])));
      model = (x) => base(x) + res(x);
    }
    function residuals() { const r = xs.map((x, i) => ys[i] - model(x)); const mean = r.reduce((a, b) => a + b, 0) / r.length; const sd = Math.sqrt(r.reduce((a, b) => a + (b - mean) * (b - mean), 0) / r.length); return { r, sd }; }
    function reset() {
      const r = rng(11 + which * 7); const f = TARGETS[which];
      xs = Array.from({ length: 260 }, (_, i) => (i / 259) * 11); ys = xs.map((x) => f(x) + 0.045 * gauss(r));
      sampled = new Set(Array.from({ length: 10 }, (_, i) => Math.round((i / 9) * 259)));
      iter = 0; done = false; fitModel(); draw();
    }
    function step() {
      if (done) return;
      const { r, sd } = residuals(), thr = 1.5 * sd;
      let cand = []; r.forEach((v, i) => { if (Math.abs(v) > thr && !sampled.has(i)) cand.push(i); });
      if (!cand.length || sd < 0.05 || iter >= 14) { done = true; draw(); return; }
      cand.sort((a, b) => Math.abs(r[b]) - Math.abs(r[a])); cand = cand.slice(0, 10);
      cand.forEach((i) => sampled.add(i)); iter++; fitModel(); draw(cand);
    }
    function draw(fresh) {
      const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const m = { l: 14, r: 14, t: 16, b: 54 }, lo = Math.min(...ys) - 0.3, hi = Math.max(...ys) + 0.3;
      const x = (v) => m.l + (v / 11) * (w - m.l - m.r), y = (v) => h - m.b - ((v - lo) / (hi - lo)) * (h - m.t - m.b);
      const { r, sd } = residuals();
      // residual strip along the bottom: where the model still misses
      const base = h - 12; ctx.fillStyle = C.dim; ctx.font = `10px ${MONO}`; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText('|RESIDUAL|', m.l, base - 26);
      xs.forEach((v, i) => { const a = Math.min(1, Math.abs(r[i]) / 0.6); ctx.fillStyle = Math.abs(r[i]) > 1.5 * sd ? C.maroon : C.dim; ctx.globalAlpha = 0.35 + 0.65 * a; ctx.fillRect(x(v) - 1, base - a * 22, 2, a * 22 + 1); });
      ctx.globalAlpha = 1;
      xs.forEach((v, i) => { if (sampled.has(i)) return; ctx.fillStyle = 'rgba(237,239,231,.2)'; ctx.beginPath(); ctx.arc(x(v), y(ys[i]), 1.6, 0, 6.2832); ctx.fill(); });
      ctx.strokeStyle = C.gold; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.beginPath();
      for (let i = 0; i <= 400; i++) { const v = (i / 400) * 11, yy = Math.max(m.t - 40, Math.min(h, y(model(v)))); i ? ctx.lineTo(x(v), yy) : ctx.moveTo(x(v), yy); } ctx.stroke();
      const freshSet = new Set(fresh || []);
      sampled.forEach((i) => { ctx.fillStyle = freshSet.has(i) ? C.maroon : C.chalk; ctx.beginPath(); ctx.arc(x(xs[i]), y(ys[i]), freshSet.has(i) ? 4.5 : 3, 0, 6.2832); ctx.fill(); });
      const rmse = Math.sqrt(r.reduce((a, b) => a + b * b, 0) / r.length);
      root.querySelector('[data-r="pts"]').textContent = `${sampled.size} of ${xs.length}`;
      root.querySelector('[data-r="pct"]').textContent = Math.round((sampled.size / xs.length) * 100) + '%';
      root.querySelector('[data-r="rmse"]').textContent = rmse.toFixed(3);
      root.querySelector('[data-r="state"]').textContent = done ? 'converged' : 'pass ' + iter;
      root.querySelector('[data-r="state"]').className = done ? 'gold' : '';
    }
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    root.querySelector('[data-a="step"]').addEventListener('click', () => { stop(); step(); });
    root.querySelector('[data-a="run"]').addEventListener('click', () => { stop(); if (done) reset(); timer = setInterval(() => { step(); if (done) stop(); }, 520); });
    root.querySelector('[data-a="reset"]').addEventListener('click', () => { stop(); reset(); });
    root.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => { stop(); which = +b.dataset.f; root.querySelectorAll('[data-f]').forEach((q) => q.setAttribute('aria-pressed', String(q === b))); reset(); }));
    onResize(cv, () => draw());
    reset(); step(); step();
  })();

  // =========================================================
  // Iterated nearest-neighbour coarsening
  // =========================================================
  (function () {
    const root = document.getElementById('nn-lab'); if (!root) return;
    const cv = root.querySelector('canvas');
    const SETS = {
      circle: (r) => Array.from({ length: 300 }, (_, i) => { const t = (i / 300) * 6.2832; return [Math.cos(t) + 0.09 * gauss(r), Math.sin(t) + 0.09 * gauss(r)]; }),
      sine: (r) => Array.from({ length: 300 }, (_, i) => { const x = (i / 299) * 12.566; return [x / 3.3 - 1.9, 0.75 * Math.sin(x) + 0.13 * gauss(r)]; }),
      loop: (r) => { const P = []; for (let i = 0; i < 200; i++) P.push([-2 + (4 * i) / 199 + 0.05 * gauss(r), 0.07 * gauss(r)]); for (let i = 0; i < 200; i++) { const u = (i / 200) * 6.2832; P.push([0.8 + 0.7 * Math.cos(u) + 0.05 * gauss(r), 0.7 * Math.sin(u) + 0.05 * gauss(r)]); } return P; },
      y: (r) => { const P = []; for (let i = 0; i < 150; i++) { const t = i / 149; P.push([0 + 0.05 * gauss(r), -1.2 + 1.2 * t + 0.05 * gauss(r)]); P.push([-1.1 * t + 0.05 * gauss(r), 1.1 * t + 0.05 * gauss(r)]); P.push([1.1 * t + 0.05 * gauss(r), 1.1 * t + 0.05 * gauss(r)]); } return P; },
    };
    let name = 'circle', levels, edges, anim = 1, raf = null;
    function coarsen(X) {
      const n = X.length, nn = new Int32Array(n);
      for (let i = 0; i < n; i++) { let b = -1, bd = Infinity; for (let j = 0; j < n; j++) { if (i === j) continue; const d = (X[i][0] - X[j][0]) ** 2 + (X[i][1] - X[j][1]) ** 2; if (d < bd) { bd = d; b = j; } } nn[i] = b; }
      // union the nearest-neighbour edges, then take centroids of the components
      const par = Int32Array.from({ length: n }, (_, i) => i); const find = (a) => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
      for (let i = 0; i < n; i++) par[find(i)] = find(nn[i]);
      const acc = new Map(); for (let i = 0; i < n; i++) { const r = find(i); const a = acc.get(r) || [0, 0, 0]; a[0] += X[i][0]; a[1] += X[i][1]; a[2]++; acc.set(r, a); }
      return { nn, centers: Array.from(acc.values()).map((a) => [a[0] / a[2], a[1] / a[2]]) };
    }
    function reset() { levels = [SETS[name](rng(5))]; edges = []; anim = 1; draw(); }
    function step() {
      const cur = levels[levels.length - 1]; if (cur.length < 4) return;
      const { nn, centers } = coarsen(cur); edges.push(nn); levels.push(centers);
      if (reduced) { anim = 1; draw(); return; }
      anim = 0; cancelAnimationFrame(raf); const t0 = performance.now();
      const tick = (now) => { anim = Math.min(1, (now - t0) / 700); draw(); if (anim < 1) raf = requestAnimationFrame(tick); }; raf = requestAnimationFrame(tick);
    }
    function draw() {
      const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const s = Math.min(w / 5.2, h / 3.2), X = (p) => w / 2 + p[0] * s, Y = (p) => h / 2 - p[1] * s;
      const top = levels.length - 1;
      ctx.fillStyle = 'rgba(237,239,231,.16)'; levels[0].forEach((p) => { ctx.beginPath(); ctx.arc(X(p), Y(p), 1.5, 0, 6.2832); ctx.fill(); });
      if (top > 0) {
        const prev = levels[top - 1], nn = edges[top - 1];
        ctx.strokeStyle = C.teal; ctx.globalAlpha = 0.55 * (1 - anim * 0.5); ctx.lineWidth = 1;
        prev.forEach((p, i) => { const q = prev[nn[i]]; ctx.beginPath(); ctx.moveTo(X(p), Y(p)); ctx.lineTo(X(q), Y(q)); ctx.stroke(); });
        ctx.globalAlpha = 1 - anim; ctx.fillStyle = C.chalk; prev.forEach((p) => { ctx.beginPath(); ctx.arc(X(p), Y(p), 2.2, 0, 6.2832); ctx.fill(); });
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = top === 0 ? C.chalk : C.gold; ctx.globalAlpha = top === 0 ? 0.85 : anim;
      const r = top === 0 ? 2 : 2.4 + top * 0.5;
      levels[top].forEach((p) => { ctx.beginPath(); ctx.arc(X(p), Y(p), r, 0, 6.2832); ctx.fill(); });
      ctx.globalAlpha = 1;
      root.querySelector('[data-r="level"]').textContent = top;
      root.querySelector('[data-r="pts"]').textContent = levels[top].length;
      root.querySelector('[data-r="ratio"]').textContent = (levels[0].length / levels[top].length).toFixed(1) + '×';
      root.querySelector('[data-r="trail"]').textContent = levels.map((l) => l.length).join(' → ');
    }
    root.querySelector('[data-a="step"]').addEventListener('click', step);
    root.querySelector('[data-a="reset"]').addEventListener('click', reset);
    root.querySelectorAll('[data-set]').forEach((b) => b.addEventListener('click', () => { name = b.dataset.set; root.querySelectorAll('[data-set]').forEach((q) => q.setAttribute('aria-pressed', String(q === b))); reset(); step(); }));
    onResize(cv, draw);
    reset(); anim = 1; step();
  })();

  // =========================================================
  // RouteRight: two-venue version of the cost model
  // =========================================================
  (function () {
    const root = document.getElementById('route-lab'); if (!root) return;
    const cv = root.querySelector('canvas'), sV = root.querySelector('#route-v'), sI = root.querySelector('#route-i');
    // indicative schedules: [30-day notional threshold in $M, taker fee in bps]
    const VEN = [
      { name: 'Venue A', tiers: [[0, 5.0], [50, 4.0], [100, 3.0], [200, 2.2]], adv: 600 },
      { name: 'Venue B', tiers: [[0, 4.5], [25, 3.8], [150, 3.0]], adv: 400 },
    ];
    const rate = (v, M) => { let r = v.tiers[0][1]; for (const [th, bps] of v.tiers) if (M >= th) r = bps; return r; };
    function cost(share, V, k) { // $ thousand per month
      let fee = 0, imp = 0;
      [share, 1 - share].forEach((sh, i) => { const M = V * sh, v = VEN[i]; fee += M * rate(v, M) * 0.1; imp += M * k * Math.sqrt(M / v.adv) * 0.1; });
      return { fee, imp, total: fee + imp };
    }
    function draw() {
      const V = +sV.value, k = +sI.value / 10;
      const { ctx, w, h } = fit(cv); ctx.clearRect(0, 0, w, h);
      const N = 400, pts = []; let best = 0;
      for (let i = 0; i <= N; i++) { const c = cost(i / N, V, k); c.s = i / N; pts.push(c); if (c.total < pts[best].total) best = i; }
      const hi = Math.max(...pts.map((p) => p.total)) * 1.08, lo = 0;
      const m = { l: 52, r: 16, t: 18, b: 40 }, x = (s) => m.l + s * (w - m.l - m.r), y = (v) => h - m.b - ((v - lo) / (hi - lo)) * (h - m.t - m.b);
      ctx.font = `10.5px ${MONO}`; ctx.lineWidth = 1;
      const stepY = hi > 320 ? 100 : hi > 160 ? 50 : hi > 80 ? 20 : 10;
      for (let v = 0; v <= hi; v += stepY) { ctx.strokeStyle = 'rgba(237,239,231,.08)'; ctx.beginPath(); ctx.moveTo(m.l, y(v)); ctx.lineTo(w - m.r, y(v)); ctx.stroke(); ctx.fillStyle = C.dim; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText('$' + v + 'k', m.l - 8, y(v)); }
      ctx.textBaseline = 'top'; ctx.textAlign = 'center'; [0, 0.25, 0.5, 0.75, 1].forEach((s) => ctx.fillText(Math.round(s * 100) + '%', x(s), h - m.b + 8));
      ctx.textAlign = 'right'; ctx.fillText('SHARE OF FLOW SENT TO VENUE A', w - m.r, h - 13);
      const path = (key, color, width, alpha, dash) => { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.globalAlpha = alpha; ctx.setLineDash(dash || []); ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(x(p.s), y(p[key])) : ctx.moveTo(x(p.s), y(p[key])))); ctx.stroke(); ctx.globalAlpha = 1; ctx.setLineDash([]); };
      path('fee', C.teal, 1.4, 0.9); path('imp', C.maroon, 1.4, 0.9); path('total', C.chalk, 2.4, 1);
      // direct labels at the right edge
      ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
      const lab = (key, txt, color, at) => { const p = pts[Math.round(at * N)]; ctx.fillStyle = color; ctx.fillText(txt, x(p.s) + 0, y(p[key]) - 6); };
      lab('total', 'TOTAL', C.chalk, 0.98); lab('fee', 'TIERED FEES', C.teal, 0.62); lab('imp', 'MARKET IMPACT', C.maroon, 0.3);
      const b = pts[best]; ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(x(b.s), y(b.total), 5.5, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = C.gold; ctx.globalAlpha = 0.5; ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(x(b.s), y(b.total)); ctx.lineTo(x(b.s), h - m.b); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      const naive = pts[N / 2];
      root.querySelector('[data-r="split"]').textContent = `${Math.round(b.s * 100)} / ${Math.round((1 - b.s) * 100)}`;
      root.querySelector('[data-r="cost"]').textContent = '$' + b.total.toFixed(1) + 'k';
      root.querySelector('[data-r="bps"]').textContent = (b.total / V / 0.1).toFixed(2) + ' bps';
      root.querySelector('[data-r="save"]').textContent = '$' + (naive.total - b.total).toFixed(1) + 'k';
      root.querySelector('[data-o="v"]').textContent = '$' + V + 'M';
      root.querySelector('[data-o="i"]').textContent = k.toFixed(1) + ' bps';
    }
    sV.addEventListener('input', draw); sI.addEventListener('input', draw); onResize(cv, draw); draw();
  })();
})();
