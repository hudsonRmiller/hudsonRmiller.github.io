/* Research figures: the hero graph, the deck lab, the lexsegment explorer. */
(function () {
  'use strict';
  const C = { chalk: '#edefe7', dim: '#9db0a8', gold: '#e3b23c', maroon: '#d9606a', board: '#0f1917', teal: '#5fb8a5' };
  const MONO = '"JetBrains Mono", ui-monospace, Menlo, monospace';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r) => (r || document).querySelector(s);

  // hi-dpi canvas sized from CSS
  function fit(canvas) {
    const r = canvas.getBoundingClientRect();
    const d = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(10, Math.round(r.width)), h = Math.max(10, Math.round(r.height));
    if (canvas.width !== w * d || canvas.height !== h * d) { canvas.width = w * d; canvas.height = h * d; }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(d, 0, 0, d, 0, 0);
    return { ctx, w, h };
  }
  window.HMfit = fit; window.HMC = C; window.HMMONO = MONO;

  // run a callback only while the element is on screen
  function whileVisible(el, start, stop) {
    if (!('IntersectionObserver' in window)) { start(); return; }
    new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? start() : stop())), { rootMargin: '80px' }).observe(el);
  }
  window.HMwhileVisible = whileVisible;

  // ---------- force-directed graph view ----------
  class GraphView {
    constructor(canvas, opts) {
      this.cv = canvas; this.o = Object.assign({ cx: 0.5, cy: 0.5, spread: 1, ambient: false, labels: 'hover' }, opts);
      this.nodes = []; this.g = null; this.hover = -1; this.drag = -1; this.running = false; this.heat = 1;
      this.pointer = null;
      this.nodeStyle = () => ({}); this.edgeStyle = () => ({});
      this._loop = this._loop.bind(this);
      const pos = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
      const pick = (p) => {
        let best = -1, bd = 18 * 18;
        this.nodes.forEach((n, i) => { if (n.gone) return; const d = (n.x - p.x) ** 2 + (n.y - p.y) ** 2; if (d < bd) { bd = d; best = i; } });
        return best;
      };
      canvas.addEventListener('pointermove', (e) => {
        const p = pos(e); this.pointer = p;
        if (this.drag >= 0) { const n = this.nodes[this.drag]; n.x = p.x; n.y = p.y; n.vx = n.vy = 0; this.moved = true; this.heat = Math.max(this.heat, 0.35); }
        else { const h = pick(p); if (h !== this.hover) { this.hover = h; canvas.style.cursor = h >= 0 ? 'pointer' : 'grab'; if (this.o.onHover) this.o.onHover(h); } }
        this.wake();
      });
      canvas.addEventListener('pointerdown', (e) => {
        const h = pick(pos(e)); if (h < 0) return;
        this.drag = h; this.moved = false; canvas.setPointerCapture(e.pointerId); e.preventDefault();
      });
      const up = () => {
        if (this.drag >= 0 && !this.moved && this.o.onClick) this.o.onClick(this.drag);
        this.drag = -1;
      };
      canvas.addEventListener('pointerup', up);
      canvas.addEventListener('pointercancel', () => { this.drag = -1; });
      canvas.addEventListener('pointerleave', () => { this.pointer = null; if (this.drag < 0 && this.hover !== -1) { this.hover = -1; if (this.o.onHover) this.o.onHover(-1); this.wake(); } });
      if ('ResizeObserver' in window) new ResizeObserver(() => { this.heat = Math.max(this.heat, 0.5); this.wake(); }).observe(canvas);
      whileVisible(canvas, () => { this.visible = true; this.wake(); }, () => { this.visible = false; });
    }
    set(g) {
      this.g = g; this.hover = -1;
      const { w, h } = fit(this.cv);
      const R = Math.min(w, h) * 0.36;
      this.nodes = Array.from({ length: g.N }, (_, i) => {
        const a = (i / g.N) * Math.PI * 2;
        return { x: w * this.o.cx + Math.cos(a) * R, y: h * this.o.cy + Math.sin(a) * R, vx: 0, vy: 0, gone: false };
      });
      this.heat = 1;
      // settle off-screen so the first painted frame is already a layout
      for (let i = 0; i < 260; i++) this.step(w, h);
      this.heat = reduced ? 0 : 0.25;
      this.wake();
    }
    wake() { if (!this.running && this.visible !== false) { this.running = true; requestAnimationFrame(this._loop); } }
    step(w, h) {
      const N = this.nodes, g = this.g, n = N.length;
      const area = w * h * (w > 760 ? 0.5 : 0.8) * this.o.spread;
      const L = Math.sqrt(area / n) * 0.78;
      const cx = w * (w > 760 ? this.o.cx : 0.5), cy = h * this.o.cy;
      for (let i = 0; i < n; i++) {
        const a = N[i]; if (a.gone) continue;
        for (let j = i + 1; j < n; j++) {
          const b = N[j]; if (b.gone) continue;
          let dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy + 0.01;
          const f = (L * L) / d2; const d = Math.sqrt(d2);
          dx = (dx / d) * f; dy = (dy / d) * f;
          a.vx += dx; a.vy += dy; b.vx -= dx; b.vy -= dy;
        }
        a.vx += (cx - a.x) * 0.012; a.vy += (cy - a.y) * 0.016;
      }
      for (const [i, j] of g.edges) {
        const a = N[i], b = N[j]; if (a.gone || b.gone) continue;
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) + 0.01;
        const f = ((d - L) / d) * 0.06;
        a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f;
      }
      const t = this.o.ambient && !reduced ? performance.now() / 1000 : 0;
      for (let i = 0; i < n; i++) {
        const a = N[i]; if (a.gone || i === this.drag) { a.vx = a.vy = 0; continue; }
        if (t) { a.vx += Math.sin(t * 0.5 + i * 1.7) * 0.05; a.vy += Math.cos(t * 0.43 + i * 2.3) * 0.05; }
        if (this.o.ambient && this.pointer) {
          const dx = a.x - this.pointer.x, dy = a.y - this.pointer.y, d2 = dx * dx + dy * dy;
          if (d2 < 150 * 150 && d2 > 400) { const f = 26 / d2; a.vx += dx * f; a.vy += dy * f; }
        }
        a.vx *= 0.82; a.vy *= 0.82;
        const sp = Math.hypot(a.vx, a.vy), cap = 14; if (sp > cap) { a.vx *= cap / sp; a.vy *= cap / sp; }
        a.x += a.vx; a.y += a.vy;
        a.x = Math.max(14, Math.min(w - 14, a.x)); a.y = Math.max(14, Math.min(h - 14, a.y));
      }
    }
    _loop() {
      if (!this.g || this.visible === false) { this.running = false; return; }
      const { ctx, w, h } = fit(this.cv);
      const live = this.o.ambient ? !reduced || this.drag >= 0 : this.heat > 0.02 || this.drag >= 0;
      if (live) { this.step(w, h); this.heat *= 0.985; }
      this.draw(ctx, w, h);
      if (live || this.o.ambient && !reduced) requestAnimationFrame(this._loop); else this.running = false;
    }
    draw(ctx, w, h) {
      const N = this.nodes, g = this.g, hv = this.hover;
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = 'round';
      for (const [i, j] of g.edges) {
        const a = N[i], b = N[j];
        const s = this.edgeStyle(i, j) || {};
        if (s.hide) continue;
        const lit = hv === i || hv === j;
        ctx.strokeStyle = lit ? C.gold : s.color || C.chalk;
        ctx.globalAlpha = lit ? 0.95 : s.alpha != null ? s.alpha : 0.2;
        ctx.lineWidth = lit ? 1.8 : s.width || 1;
        ctx.setLineDash(s.dash || []);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      ctx.setLineDash([]); ctx.globalAlpha = 1;
      ctx.font = `11px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      N.forEach((a, i) => {
        const s = this.nodeStyle(i) || {};
        const near = hv >= 0 && (hv === i || g.adj[hv].has(i));
        const r = (s.r || 4) + (hv === i ? 2 : 0);
        ctx.globalAlpha = s.alpha != null ? s.alpha : 1;
        if (s.ring) { ctx.strokeStyle = s.ring; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(a.x, a.y, r + 5, 0, 6.2832); ctx.stroke(); }
        ctx.beginPath(); ctx.arc(a.x, a.y, r, 0, 6.2832);
        if (s.hollow) { ctx.fillStyle = C.board; ctx.fill(); ctx.strokeStyle = s.fill || C.chalk; ctx.lineWidth = 1.3; ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]); }
        else { ctx.fillStyle = hv === i ? C.gold : s.fill || C.chalk; ctx.fill(); }
        const showLabel = this.o.labels === 'all' || near || s.label;
        if (showLabel) {
          ctx.globalAlpha = near || s.label ? 1 : 0.42;
          ctx.fillStyle = hv === i ? C.gold : s.labelColor || (near ? C.chalk : C.dim);
          ctx.fillText(g.word(i), a.x, a.y - r - 5);
        }
      });
      ctx.globalAlpha = 1;
    }
  }

  // ---------- hero ----------
  const heroCv = $('#hero-graph');
  if (heroCv) {
    const g = HM.deBruijn(3, 3);
    const hubSet = new Set(HM.hubs(g.adj, 3));
    const view = new GraphView(heroCv, { cx: 0.72, cy: 0.5, ambient: true, labels: 'all', spread: 1.05 });
    view.nodeStyle = (i) => (hubSet.has(i) ? { fill: C.gold, r: 5.5, ring: 'rgba(227,178,60,.45)', label: true, labelColor: C.gold } : { r: 3.6 });
    view.edgeStyle = () => ({ alpha: 0.2 });
    view.set(g);
  }

  // ---------- deck lab ----------
  const lab = $('#deck-lab');
  if (lab) {
    const st = { k: 3, n: 3, removed: -1, hubs: true, cover: false };
    const view = new GraphView($('canvas', lab), { labels: 'hover', spread: 1.5, onClick: (v) => { st.removed = st.removed === v ? -1 : v; refresh(false); } });
    let g, cliqueOf = null, cliqueCount = 0, hubList = [], trueHubs = new Set();
    const hue = (i) => `hsl(${(i * 47) % 360} 70% 66%)`;
    const sup = (m) => String(m).replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]);

    function refresh(rebuild) {
      if (rebuild) {
        g = HM.deBruijn(st.k, st.n); st.removed = -1;
        trueHubs = new Set(HM.hubs(g.adj, st.k));
        const cl = HM.greedyCliqueCover(g); cliqueCount = cl.length; cliqueOf = new Map();
        cl.forEach((c, ci) => { for (let i = 0; i < c.length; i++) for (let j = i + 1; j < c.length; j++) cliqueOf.set(Math.min(c[i], c[j]) * g.N + Math.max(c[i], c[j]), { ci, size: c.length }); });
        view.o.labels = g.N <= 16 ? 'all' : 'hover';
        view.set(g);
        const deck = $('.deck', lab); deck.innerHTML = '';
        for (let v = 0; v < g.N; v++) {
          const b = document.createElement('button'); b.type = 'button'; b.textContent = g.word(v); b.dataset.v = v;
          b.setAttribute('aria-label', 'Deal the card that deletes ' + g.word(v));
          if (trueHubs.has(v)) b.className = 'hub';
          b.addEventListener('click', () => { st.removed = st.removed === v ? -1 : v; refresh(false); });
          deck.appendChild(b);
        }
      }
      view.nodes.forEach((nd, i) => { nd.gone = false; });
      const adj = st.removed >= 0 ? HM.card(g, st.removed).adj : g.adj;
      hubList = HM.hubs(adj, st.k);
      const hubNow = new Set(hubList);
      view.nodeStyle = (i) => {
        if (i === st.removed) return { hollow: true, fill: C.maroon, r: 5, label: true, labelColor: C.maroon };
        if (st.hubs && hubNow.has(i)) return { fill: C.gold, r: 6, ring: 'rgba(227,178,60,.5)', label: true, labelColor: C.gold };
        return { r: g.N > 40 ? 3.2 : 4 };
      };
      view.edgeStyle = (a, b) => {
        if (a === st.removed || b === st.removed) return { color: C.maroon, alpha: 0.5, dash: [3, 4] };
        if (st.cover) { const c = cliqueOf.get(Math.min(a, b) * g.N + Math.max(a, b)); if (c && c.size >= 3) return { color: hue(c.ci), alpha: 0.85, width: 1.6 }; return { alpha: 0.13 }; }
        if (st.hubs && (hubNow.has(a) || hubNow.has(b))) return { color: C.gold, alpha: 0.5 };
        return { alpha: g.N > 40 ? 0.16 : 0.24 };
      };
      view.wake(); requestAnimationFrame(() => view.wake());
      // readouts
      const E = st.removed >= 0 ? g.edges.length - g.adj[st.removed].size : g.edges.length;
      $('[data-r="v"]', lab).textContent = st.removed >= 0 ? g.N - 1 : g.N;
      $('[data-r="e"]', lab).textContent = E;
      $('[data-r="deg"]', lab).textContent = HM.degreeMultiset(adj).map(([d, m]) => d + sup(m)).join(' ');
      $('[data-r="hub"]', lab).textContent = hubList.length ? hubList.map(g.word).join(' ') : 'none';
      $('[data-r="name"]', lab).textContent = st.removed >= 0 ? `card B(${st.k},${st.n}) − ${g.word(st.removed)}` : `B(${st.k},${st.n})`;
      lab.querySelectorAll('.deck button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.v === st.removed)));
      const note = $('.lab-note', lab);
      if (st.cover) note.innerHTML = `A greedy edge-clique cover computed in your browser uses <b class="g">${cliqueCount} cliques</b> (${[...new Set([...cliqueOf.values()].map((c) => c.ci + ':' + c.size))].filter((s) => +s.split(':')[1] >= 3).length} of them triangles or larger, coloured). That is only an upper bound on the intersection number; the manuscript is about the true minimum.`;
      else if (st.removed >= 0) note.innerHTML = `One card from the deck: the vertex <b style="color:${C.maroon}">${g.word(st.removed)}</b> and its ${g.adj[st.removed].size} edges are erased, and the labels would be too. The hub detector still finds <b class="g">${hubList.length}</b> hub${hubList.length === 1 ? '' : 's'} in what is left.`;
      else note.innerHTML = `The whole graph, with minimum degree <b>${2 * st.k - 2}</b> = 2k − 2. The hubs are exactly the constant words: their loop is gone, so they are the only vertices of degree 2k − 2 whose neighbours form a complete bipartite K<sub>${st.k - 1},${st.k - 1}</sub>. Click any vertex to deal its card.`;
      lab.querySelectorAll('[data-k]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.k === st.k)));
      lab.querySelectorAll('[data-n]').forEach((b) => { b.setAttribute('aria-pressed', String(+b.dataset.n === st.n)); b.disabled = Math.pow(st.k, +b.dataset.n) > 81; });
      $('[data-t="hubs"]', lab).setAttribute('aria-pressed', String(st.hubs));
      $('[data-t="cover"]', lab).setAttribute('aria-pressed', String(st.cover));
    }
    lab.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => { st.k = +b.dataset.k; if (Math.pow(st.k, st.n) > 81) st.n = 3; refresh(true); }));
    lab.querySelectorAll('[data-n]').forEach((b) => b.addEventListener('click', () => { st.n = +b.dataset.n; refresh(true); }));
    $('[data-t="hubs"]', lab).addEventListener('click', () => { st.hubs = !st.hubs; if (st.hubs) st.cover = false; refresh(false); });
    $('[data-t="cover"]', lab).addEventListener('click', () => { st.cover = !st.cover; if (st.cover) st.hubs = false; refresh(false); });
    $('[data-t="reset"]', lab).addEventListener('click', () => { st.removed = -1; refresh(false); });
    refresh(true);
  }

  // ---------- lexsegment explorer ----------
  const lex = $('#lex-lab');
  if (lex) {
    const svg = $('svg', lex), slider = $('#lex-len'), NS = 'http://www.w3.org/2000/svg';
    const st = { d: 4, len: 7 };
    const V = ['x', 'y', 'z'];
    const el = (name, attrs, parent) => { const e = document.createElementNS(NS, name); for (const k in attrs) e.setAttribute(k, attrs[k]); (parent || svg).appendChild(e); return e; };
    const pretty = (m) => m.map((e, i) => (e ? V[i] + (e > 1 ? '⁰¹²³⁴⁵⁶⁷⁸⁹'[e] : '') : '')).join('') || '1';
    function draw() {
      const ms = HM.monomials(3, st.d);
      slider.max = ms.length; if (st.len > ms.length) st.len = ms.length; slider.value = st.len;
      const seg = ms.slice(0, st.len);
      const gens = new Set(HM.borelGenerators(seg).map((m) => m.join(',')));
      const W = 640, H = 470, top = 54, side = 400, x0 = W / 2, rowH = (side * 0.866) / st.d, colW = side / st.d;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.innerHTML = '';
      const pos = (m) => ({ x: x0 + (m[2] - m[1]) * colW / 2, y: top + (st.d - m[0]) * rowH });
      // lattice: every Borel move between neighbours
      ms.forEach((m) => {
        const p = pos(m);
        [[0, 1], [1, 2], [0, 2]].forEach(([i, j]) => {
          if (!m[i]) return; const t = m.slice(); t[i]--; t[j]++; const q = pos(t);
          el('line', { x1: p.x, y1: p.y, x2: q.x, y2: q.y, stroke: C.chalk, 'stroke-opacity': 0.13, 'stroke-width': 1 });
        });
      });
      const fs = st.d > 5 ? 10.5 : 12.5, r = st.d > 5 ? 7 : 9;
      ms.forEach((m, idx) => {
        const p = pos(m), inSeg = idx < st.len, gen = gens.has(m.join(','));
        const gEl = el('g', { style: 'cursor:pointer' });
        gEl.addEventListener('click', () => { st.len = idx + 1; draw(); });
        if (gen) el('circle', { cx: p.x, cy: p.y, r: r + 6, fill: 'none', stroke: C.gold, 'stroke-width': 1.6 }, gEl);
        el('circle', { cx: p.x, cy: p.y, r, fill: inSeg ? (gen ? C.gold : C.maroon) : C.board, stroke: inSeg ? 'none' : C.dim, 'stroke-opacity': 0.6, 'stroke-width': 1 }, gEl);
        const t = el('text', { x: p.x, y: p.y + r + fs + 3, 'text-anchor': 'middle', 'font-family': MONO, 'font-size': fs, fill: gen ? C.gold : inSeg ? C.chalk : C.dim, 'fill-opacity': inSeg ? 1 : 0.65 }, gEl);
        t.textContent = pretty(m);
        el('title', {}, gEl).textContent = `${pretty(m)}: position ${idx + 1} in lex order`;
      });
      $('[data-r="size"]', lex).textContent = `${st.len} of ${ms.length}`;
      $('[data-r="count"]', lex).textContent = gens.size;
      $('[data-r="gens"]', lex).textContent = HM.borelGenerators(seg).map(pretty).join(', ');
      $('[data-r="last"]', lex).textContent = pretty(seg[seg.length - 1]);
      lex.querySelectorAll('[data-d]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.d === st.d)));
    }
    slider.addEventListener('input', () => { st.len = +slider.value; draw(); });
    lex.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => { const old = HM.monomials(3, st.d).length; st.d = +b.dataset.d; st.len = Math.max(1, Math.round((st.len / old) * HM.monomials(3, st.d).length)); draw(); }));
    draw();
  }
})();
