(function () {
  'use strict';
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var INK = '#eef2ee', FAINT = '#7d8a83', LINE = 'rgba(238,242,238,0.12)', ACCENT = '#e0707a';
  var SANS = '"Host Grotesk", system-ui, sans-serif';

  function fit(cv) {
    var r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(10, Math.round(r.width)), h = Math.max(10, Math.round(r.height));
    if (cv.width !== w * d || cv.height !== h * d) { cv.width = w * d; cv.height = h * d; }
    var ctx = cv.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, w, h);
    return { ctx: ctx, w: w, h: h };
  }
  // run frame(t) every animation frame while the element is on screen
  function animate(el, frame) {
    var on = false, raf = 0;
    var loop = function (t) { if (!on) return; frame(t); raf = requestAnimationFrame(loop); };
    if (still || !('IntersectionObserver' in window)) { frame(0); window.addEventListener('resize', function () { frame(0); }); return; }
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting && !on) { on = true; raf = requestAnimationFrame(loop); } else if (!e.isIntersecting) { on = false; cancelAnimationFrame(raf); } });
    }, { rootMargin: '60px' }).observe(el);
  }
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function gauss(r) { return Math.sqrt(-2 * Math.log(r() + 1e-12)) * Math.cos(6.2832 * r()); }
  var ease = function (u) { return u < 0 ? 0 : u > 1 ? 1 : u * u * (3 - 2 * u); };

  // ------------------------------------------------------------------
  // The undirected de Bruijn graph on binary words of length 3; one vertex at a time is deleted.
  var svg = document.querySelector('.fig');
  if (svg) {
    var NS = 'http://www.w3.org/2000/svg';
    var V = { '000': [40, 150], '001': [180, 50], '100': [180, 250], '010': [300, 108], '101': [300, 192], '011': [420, 50], '110': [420, 250], '111': [560, 150] };
    var E = ['000-001', '000-100', '001-010', '001-011', '001-100', '010-100', '010-101', '011-101', '011-110', '011-111', '101-110', '100-110', '110-111'];
    var mk = function (n, a) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); svg.appendChild(e); return e; };
    var parts = [];
    E.forEach(function (e) { var p = e.split('-'), a = V[p[0]], b = V[p[1]]; parts.push({ el: mk('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1] }), on: p }); });
    Object.keys(V).forEach(function (w) {
      var p = V[w], up = p[1] <= 150;
      parts.push({ el: mk('circle', { cx: p[0], cy: p[1], r: 5 }), on: [w] });
      var t = mk('text', { x: p[0], y: up ? p[1] - 14 : p[1] + 26 }); t.textContent = w; parts.push({ el: t, on: [w] });
    });
    if (!still) {
      var order = Object.keys(V), k = -1;
      setInterval(function () {
        k = (k + 1) % (order.length + 1);
        var gone = order[k];
        parts.forEach(function (p) { p.el.classList.toggle('off', !!gone && p.on.indexOf(gone) >= 0); });
      }, 2400);
    }
  }


  // ------------------------------------------------------------------
  // Degree-4 monomials in x > y > z; an initial lexsegment grows, and the monomials
  // that generate it under the moves x_j -> x_i (i < j) are marked.
  [].forEach.call(document.querySelectorAll('.lex'), function (lx) {
    var NS = 'http://www.w3.org/2000/svg', D = 4, ms = [], a, b;
    for (a = D; a >= 0; a--) for (b = D - a; b >= 0; b--) ms.push([a, b, D - a - b]);
    var pos = function (m) { return [200 + (m[2] - m[1]) * 38, 36 + (D - m[0]) * 58]; };
    var mk = function (n, at) { var e = document.createElementNS(NS, n); for (var k in at) e.setAttribute(k, at[k]); lx.appendChild(e); return e; };
    ms.forEach(function (m) { [[0, 1], [1, 2]].forEach(function (mv) { if (!m[mv[0]]) return; var t = m.slice(); t[mv[0]]--; t[mv[1]]++; var p = pos(m), q = pos(t); mk('line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1] }); }); });
    var dots = ms.map(function (m) { var p = pos(m); return mk('circle', { cx: p[0], cy: p[1], r: 7, 'class': 'out' }); });
    var show = function (len) {
      var inSeg = {}; ms.slice(0, len).forEach(function (m) { inSeg[m.join()] = 1; });
      ms.forEach(function (m, i) {
        var cls = 'out';
        if (i < len) { cls = 'gen'; for (var j = 0; j < 2; j++) { if (!m[j]) continue; var t = m.slice(); t[j]--; t[j + 1]++; if (inSeg[t.join()]) cls = 'in'; } }
        dots[i].setAttribute('class', cls); dots[i].setAttribute('r', cls === 'gen' ? 9 : 7);
      });
    };
    var len = 7; show(len);
    if (!still) setInterval(function () { len = len % ms.length + 1; show(len); }, 1100);
  });

  // ------------------------------------------------------------------
  // Recursive polynomial adaptive sampling, fitted over successive iterations
  var rp = document.getElementById('rpas');
  if (rp) (function () {
    var N = 400, X0 = -10, X1 = 10;
    var F = [
      function (x) { return Math.exp(-0.12 * (x + 10)) * Math.cos(1.9 * (x + 10)) * 0.9 + 0.25 * Math.cos(2.6 * x) * (x > -4 ? 1 : 0.3); },
      function (x) { var u = 100 * (x - 5); return ((x - 5) * Math.atan(u) - Math.log(1 + u * u) / 200) / 8 - 0.6 + 0.12 * Math.sin(1.4 * x); },
    ];
    function polyfit2(X, Y) {
      var s = [0, 0, 0, 0, 0], t = [0, 0, 0], i, k, p;
      for (i = 0; i < X.length; i++) { p = 1; for (k = 0; k < 5; k++) { s[k] += p; if (k < 3) t[k] += p * Y[i]; p *= X[i]; } }
      var A = [[s[0], s[1], s[2], t[0]], [s[1], s[2], s[3], t[1]], [s[2], s[3], s[4], t[2]]], r, c, f;
      for (i = 0; i < 3; i++) { p = i; for (r = i + 1; r < 3; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r; f = A[i]; A[i] = A[p]; A[p] = f; for (r = i + 1; r < 3; r++) { f = A[r][i] / A[i][i]; for (c = i; c < 4; c++) A[r][c] -= f * A[i][c]; } }
      var co = [0, 0, 0]; for (i = 2; i >= 0; i--) { f = A[i][3]; for (c = i + 1; c < 3; c++) f -= A[i][c] * co[c]; co[i] = f / A[i][i]; }
      return function (x) { return co[0] + co[1] * x + co[2] * x * x; };
    }
    function spline(X, Y) {
      var n = X.length - 1, h = [], al = [], l = [1], mu = [0], z = [0], c = [], b = [], d = [], i, j;
      for (i = 0; i <= n; i++) c.push(0);
      for (i = 0; i < n; i++) h[i] = X[i + 1] - X[i];
      for (i = 1; i < n; i++) al[i] = (3 / h[i]) * (Y[i + 1] - Y[i]) - (3 / h[i - 1]) * (Y[i] - Y[i - 1]);
      for (i = 1; i < n; i++) { l[i] = 2 * (X[i + 1] - X[i - 1]) - h[i - 1] * mu[i - 1]; mu[i] = h[i] / l[i]; z[i] = (al[i] - h[i - 1] * z[i - 1]) / l[i]; }
      for (j = n - 1; j >= 0; j--) { c[j] = z[j] - mu[j] * c[j + 1]; b[j] = (Y[j + 1] - Y[j]) / h[j] - (h[j] * (c[j + 1] + 2 * c[j])) / 3; d[j] = (c[j + 1] - c[j]) / (3 * h[j]); }
      return function (x) { var lo = 0, hi = n - 1, m; while (lo < hi) { m = (lo + hi + 1) >> 1; if (X[m] <= x) lo = m; else hi = m - 1; } var t = x - X[lo]; return Y[lo] + b[lo] * t + c[lo] * t * t + d[lo] * t * t * t; };
    }
    // precompute every iteration of one run: sampled indices and the fitted curve
    function run(f) {
      var xs = [], ys = [], i;
      for (i = 0; i < N; i++) { xs.push(X0 + (X1 - X0) * i / (N - 1)); ys.push(f(xs[i])); }
      var sampled = [0, Math.round(N / 5), Math.round(2 * N / 5), Math.round(3 * N / 5), Math.round(4 * N / 5), N - 1], iters = [];
      for (var it = 0; it < 9; it++) {
        sampled.sort(function (a, b) { return a - b; });
        var X = sampled.map(function (j) { return xs[j]; }), Y = sampled.map(function (j) { return ys[j]; });
        var base = polyfit2(X, Y), res = spline(X, Y.map(function (y, j) { return y - base(X[j]); }));
        var fitted = xs.map(function (x) { return base(x) + res(x); }), err = fitted.map(function (v, j) { return Math.abs(v - ys[j]); });
        var mx = Math.max.apply(null, err), mean = err.reduce(function (a, b) { return a + b; }, 0) / N;
        iters.push({ pts: sampled.slice(), fit: fitted, err: err, max: mx });
        if (mx < 0.012) break;
        // add points where the residual is high, a few per pass, spaced apart
        var sd = Math.sqrt(err.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / N), cand = [];
        for (i = 0; i < N; i++) if (err[i] > mean + 0.6 * sd && sampled.indexOf(i) < 0) cand.push(i);
        cand.sort(function (a, b) { return err[b] - err[a]; });
        var add = [];
        cand.forEach(function (c) { if (add.length < 7 && add.every(function (a) { return Math.abs(a - c) > 9; }) && sampled.every(function (a) { return Math.abs(a - c) > 3; })) add.push(c); });
        if (!add.length) break;
        sampled = sampled.concat(add);
      }
      return { xs: xs, ys: ys, iters: iters };
    }
    var runs = F.map(run), cv = rp.querySelector('canvas'), label = rp.querySelector('[data-iter]');
    var STEP = 1700, HOLD = 2600;
    animate(cv, function (t) {
      var total = 0, spans = runs.map(function (r) { var d = r.iters.length * STEP + HOLD; total += d; return d; });
      var tt = still ? spans[0] - 1 : t % total, ri = 0; while (tt >= spans[ri]) { tt -= spans[ri]; ri++; }
      var R = runs[ri], n = R.iters.length, k = Math.min(n - 1, Math.floor(tt / STEP)), u = ease((tt - k * STEP) / 700);
      var cur = R.iters[k], prev = R.iters[Math.max(0, k - 1)];
      var c = fit(cv), ctx = c.ctx, w = c.w, h = c.h, i;
      var mL = 8, mR = 8, top = 30, split = h * 0.7, lo = Math.min.apply(null, R.ys) - 0.15, hi = Math.max.apply(null, R.ys) + 0.15;
      var x = function (j) { return mL + (j / (N - 1)) * (w - mL - mR); }, y = function (v) { return split - 14 - ((v - lo) / (hi - lo)) * (split - 14 - top); };
      // actual solution
      ctx.setLineDash([5, 5]); ctx.strokeStyle = FAINT; ctx.lineWidth = 1.5; ctx.beginPath();
      R.ys.forEach(function (v, j) { j ? ctx.lineTo(x(j), y(v)) : ctx.moveTo(x(j), y(v)); }); ctx.stroke(); ctx.setLineDash([]);
      // approximation, eased from the previous iteration
      ctx.strokeStyle = ACCENT; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.beginPath();
      for (i = 0; i < N; i++) { var v = prev.fit[i] + (cur.fit[i] - prev.fit[i]) * u, yy = Math.max(-20, Math.min(h + 20, y(v))); i ? ctx.lineTo(x(i), yy) : ctx.moveTo(x(i), yy); } ctx.stroke();
      // sampled points; the new ones grow in
      cur.pts.forEach(function (j) { var fresh = prev.pts.indexOf(j) < 0 && k > 0; ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x(j), y(R.ys[j]), fresh ? 4 * u : 3.2, 0, 6.2832); ctx.fill(); });
      // error panel
      var eb = h - 8, eh = h - split - 30, emax = R.iters[0].max;
      ctx.strokeStyle = LINE; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(mL, split); ctx.lineTo(w - mR, split); ctx.stroke();
      ctx.fillStyle = 'rgba(224,112,122,0.22)'; ctx.strokeStyle = ACCENT; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x(0), eb);
      for (i = 0; i < N; i++) { var e = prev.err[i] + (cur.err[i] - prev.err[i]) * u; ctx.lineTo(x(i), eb - Math.min(1, e / emax) * eh); }
      ctx.lineTo(x(N - 1), eb); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.font = '13px ' + SANS; ctx.fillStyle = FAINT; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
      ctx.fillText('Error at each step', mL, split + 9);
      if (label) label.textContent = 'Iteration ' + (k + 1) + ' · ' + cur.pts.length + ' sampled points';
    });
  })();

  // ------------------------------------------------------------------
  // graph.theory.data.destroyer: nearest-neighbour graph, components, centroids, repeat
  var gd = document.getElementById('destroyer');
  if (gd) (function () {
    var sets = [
      function (r) { var P = [], i; for (i = 0; i < 300; i++) { var t = i / 300 * 6.2832; P.push([Math.cos(t) + 0.08 * gauss(r), Math.sin(t) + 0.08 * gauss(r)]); } return P; },
      function (r) { var P = [], i; for (i = 0; i < 300; i++) { var x = i / 299 * 12.566; P.push([x / 3.3 - 1.9, 0.75 * Math.sin(x) + 0.15 * gauss(r)]); } return P; },
      function (r) { var P = [], i; for (i = 0; i < 200; i++) P.push([-2 + 4 * i / 199 + 0.05 * gauss(r), 0.06 * gauss(r)]); for (i = 0; i < 200; i++) { var u = i / 200 * 6.2832; P.push([0.8 + 0.7 * Math.cos(u) + 0.05 * gauss(r), 0.7 * Math.sin(u) + 0.05 * gauss(r)]); } return P; },
    ];
    function coarsen(X) {
      var n = X.length, nn = [], par = [], i, j;
      for (i = 0; i < n; i++) { var b = -1, bd = Infinity; for (j = 0; j < n; j++) { if (i === j) continue; var d = (X[i][0] - X[j][0]) * (X[i][0] - X[j][0]) + (X[i][1] - X[j][1]) * (X[i][1] - X[j][1]); if (d < bd) { bd = d; b = j; } } nn.push(b); par.push(i); }
      var find = function (a) { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
      for (i = 0; i < n; i++) par[find(i)] = find(nn[i]);
      var acc = {}, to = [];
      for (i = 0; i < n; i++) { var rt = find(i); (acc[rt] = acc[rt] || [0, 0, 0]); acc[rt][0] += X[i][0]; acc[rt][1] += X[i][1]; acc[rt][2]++; }
      for (i = 0; i < n; i++) { var a = acc[find(i)]; to.push([a[0] / a[2], a[1] / a[2]]); }
      var centers = Object.keys(acc).map(function (k) { return [acc[k][0] / acc[k][2], acc[k][1] / acc[k][2]]; });
      return { nn: nn, to: to, centers: centers };
    }
    // each dataset becomes a list of levels; a level knows its edges and where each point goes
    var shows = sets.map(function (mkSet, si) {
      var cur = mkSet(rng(7 + si)), levels = [];
      for (var l = 0; l < 3 && cur.length > 6; l++) { var c = coarsen(cur); levels.push({ pts: cur, nn: c.nn, to: c.to }); cur = c.centers; }
      levels.push({ pts: cur, nn: null, to: null });
      return levels;
    });
    var cv = gd.querySelector('canvas'), label = gd.querySelector('[data-level]');
    var A = 1100, B = 1300, C = 700, PER = A + B + C, END = 2200; // edges in, collapse, rest
    animate(cv, function (t) {
      var spans = shows.map(function (s) { return (s.length - 1) * PER + END; }), total = spans.reduce(function (a, b) { return a + b; }, 0);
      var tt = still ? A * 0.9 : t % total, si = 0; while (tt >= spans[si]) { tt -= spans[si]; si++; }
      var S = shows[si], li = Math.min(S.length - 1, Math.floor(tt / PER)), lt = tt - li * PER, L = S[li];
      var c = fit(cv), ctx = c.ctx, w = c.w, h = c.h, s = Math.min(w / 5, h / 2.9);
      var X = function (p) { return w / 2 + p[0] * s; }, Y = function (p) { return h / 2 - p[1] * s; };
      // the original cloud stays faintly underneath
      ctx.fillStyle = 'rgba(238,242,238,0.13)'; S[0].pts.forEach(function (p) { ctx.beginPath(); ctx.arc(X(p), Y(p), 1.4, 0, 6.2832); ctx.fill(); });
      var eIn = L.nn ? ease(lt / A) : 0, mv = L.nn ? ease((lt - A) / B) : 0;
      var pos = L.pts.map(function (p, i) { return L.to ? [p[0] + (L.to[i][0] - p[0]) * mv, p[1] + (L.to[i][1] - p[1]) * mv] : p; });
      if (L.nn) {
        ctx.strokeStyle = ACCENT; ctx.lineWidth = 1.1; ctx.globalAlpha = 0.85 * eIn * (1 - mv * 0.6);
        L.nn.forEach(function (j, i) { ctx.beginPath(); ctx.moveTo(X(pos[i]), Y(pos[i])); ctx.lineTo(X(pos[j]), Y(pos[j])); ctx.stroke(); });
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = INK; var r = 2 + li * 0.7;
      pos.forEach(function (p) { ctx.beginPath(); ctx.arc(X(p), Y(p), r, 0, 6.2832); ctx.fill(); });
      if (label) label.textContent = S.map(function (l) { return l.pts.length; }).slice(0, li + 1).join(' → ') + ' points';
    });
  })();

  // ------------------------------------------------------------------
  // Rowing telemetry views (illustrative crew)
  var SEATS = [[-57, 33, 96, .36, 3.1], [-55, 34, 101, .40, 3.3], [-58, 32, 108, .38, 2.9], [-54, 35, 111, .43, 3.4], [-56, 33, 106, .34, 3.0], [-53, 34, 99, .41, 3.6], [-55, 31, 93, .45, 3.2], [-52, 33, 90, .39, 2.8]];
  var FOCUS = 3; // seat 5
  function force(s, u) { return u <= 0 || u >= 1 ? 0 : s[2] * Math.pow(u / s[3], s[3] * s[4]) * Math.pow((1 - u) / (1 - s[3]), (1 - s[3]) * s[4]); }
  function axes(ctx, w, h, m, xt, yt, xf, yf) {
    ctx.font = '12px ' + SANS; ctx.lineWidth = 1;
    yt.forEach(function (v) { var y = yf(v); ctx.strokeStyle = 'rgba(238,242,238,0.07)'; ctx.beginPath(); ctx.moveTo(m.l, y); ctx.lineTo(w - m.r, y); ctx.stroke(); ctx.fillStyle = FAINT; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(v, m.l - 8, y); });
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'; xt.forEach(function (p) { ctx.fillStyle = FAINT; ctx.fillText(p[1], xf(p[0]), h - m.b + 8); });
  }

  var c1 = document.getElementById('row-curves');
  if (c1) animate(c1, function (t) {
    var c = fit(c1), ctx = c.ctx, w = c.w, h = c.h, m = { l: 38, r: 12, t: 14, b: 30 };
    var xf = function (a) { return m.l + (a + 65) / 105 * (w - m.l - m.r); }, yf = function (v) { return h - m.b - v / 120 * (h - m.t - m.b); };
    axes(ctx, w, h, m, [[-60, '−60°'], [-30, '−30°'], [0, '0°'], [30, '30°']], [0, 40, 80, 120], xf, yf);
    var prog = still ? 1 : Math.min(1, (t % 9000) / 2200);
    SEATS.forEach(function (s, i) {
      var on = i === FOCUS; ctx.strokeStyle = on ? ACCENT : FAINT; ctx.globalAlpha = on ? 1 : 0.5; ctx.lineWidth = on ? 2.4 : 1.2; ctx.lineJoin = 'round'; ctx.beginPath();
      for (var k = 0; k <= 80 * prog; k++) { var u = k / 80, px = xf(s[0] + u * (s[1] - s[0])), py = yf(force(s, u)); k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke();
    });
    ctx.globalAlpha = 1;
    var f = SEATS[FOCUS]; ctx.font = '13px ' + SANS; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    if (prog > 0.6) { ctx.fillStyle = INK; ctx.fillText('Seat 5', xf(f[0] + f[3] * (f[1] - f[0])) + 10, yf(f[2]) - 4); ctx.fillStyle = FAINT; ctx.fillText('Rest of crew', xf(8), yf(34)); }
  });

  var c2 = document.getElementById('row-trace');
  if (c2) animate(c2, function (t) {
    var c = fit(c2), ctx = c.ctx, w = c.w, h = c.h, m = { l: 38, r: 12, t: 14, b: 30 }, period = 60 / 26, drive = 0.85, win = 9;
    var t0 = still ? 0 : t / 1000 * 0.6;
    var xf = function (s) { return m.l + s / win * (w - m.l - m.r); }, yf = function (v) { return h - m.b - v / 120 * (h - m.t - m.b); };
    axes(ctx, w, h, m, [], [0, 40, 80, 120], xf, yf);
    ctx.save(); ctx.beginPath(); ctx.rect(m.l, 0, w - m.l - m.r, h); ctx.clip();
    [[SEATS[1], FAINT, 1.2, 0.55, 0.03], [SEATS[FOCUS], ACCENT, 2.2, 1, 0]].forEach(function (d) {
      ctx.strokeStyle = d[1]; ctx.lineWidth = d[2]; ctx.globalAlpha = d[3]; ctx.lineJoin = 'round'; ctx.beginPath();
      for (var k = 0; k <= 360; k++) { var s = k / 360 * win, ph = ((s + t0 + d[4]) % period) / drive, strokeNo = Math.floor((s + t0) / period), wob = 1 + 0.05 * Math.sin(strokeNo * 12.9898); var py = yf(force(d[0], ph) * wob); k ? ctx.lineTo(xf(s), py) : ctx.moveTo(xf(s), py); }
      ctx.stroke();
    });
    ctx.restore(); ctx.globalAlpha = 1;
    ctx.fillStyle = FAINT; ctx.font = '12px ' + SANS; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText('9 s at 26 strokes per minute', w - m.r, h - m.b + 8);
  });

  var c3 = document.getElementById('row-session');
  if (c3) (function () {
    var r = rng(21), pts = [], i;
    // warm-up, four pieces with rests, paddle home
    for (i = 0; i < 300; i++) { var mnt = i / 300 * 70, p = 150 + 20 * Math.sin(mnt / 3); [[18, 26, 285], [30, 38, 300], [42, 50, 310], [54, 60, 335]].forEach(function (pc) { if (mnt > pc[0] && mnt < pc[1]) p = pc[2] - (mnt - pc[0]) * 2.2; }); if (mnt < 8) p = 110 + mnt * 9; pts.push(p + 7 * gauss(r)); }
    var draw = function () {
      var c = fit(c3), ctx = c.ctx, w = c.w, h = c.h, m = { l: 38, r: 12, t: 14, b: 30 };
      var xf = function (mn) { return m.l + mn / 70 * (w - m.l - m.r); }, yf = function (v) { return h - m.b - v / 400 * (h - m.t - m.b); };
      axes(ctx, w, h, m, [[0, '0'], [20, '20'], [40, '40'], [60, '60 min']], [0, 200, 400], xf, yf);
      ctx.beginPath(); ctx.moveTo(xf(0), yf(0)); pts.forEach(function (p, k) { ctx.lineTo(xf(k / 300 * 70), yf(p)); }); ctx.lineTo(xf(70), yf(0)); ctx.closePath(); ctx.fillStyle = 'rgba(224,112,122,0.16)'; ctx.fill();
      ctx.beginPath(); pts.forEach(function (p, k) { k ? ctx.lineTo(xf(k / 300 * 70), yf(p)) : ctx.moveTo(xf(0), yf(p)); }); ctx.strokeStyle = ACCENT; ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.stroke();
    };
    draw(); window.addEventListener('resize', draw);
  })();
})();
