/* Pure combinatorics used by the interactive figures. No DOM. */
(function (root) {
  'use strict';

  // ---------- undirected de Bruijn graph B(k, n) ----------
  // Vertices: words of length n over {0..k-1}. x1..xn ~ x2..xn a.
  // Loops are dropped and parallel edges merged.
  function deBruijn(k, n) {
    const N = Math.pow(k, n);
    const adj = Array.from({ length: N }, () => new Set());
    for (let v = 0; v < N; v++) {
      const shifted = (v * k) % N;
      for (let a = 0; a < k; a++) {
        const w = shifted + a;
        if (w !== v) { adj[v].add(w); adj[w].add(v); }
      }
    }
    const edges = [];
    for (let v = 0; v < N; v++) adj[v].forEach((w) => { if (v < w) edges.push([v, w]); });
    const word = (v) => v.toString(k).padStart(n, '0');
    return { k, n, N, adj, edges, word };
  }

  // The card G - v, as adjacency sets over the surviving vertex ids.
  function card(g, v) {
    const adj = g.adj.map((s, i) => {
      if (i === v) return null;
      const t = new Set(s); t.delete(v); return t;
    });
    return { adj, removed: v };
  }

  // Hub(C) = { w : deg_C(w) = 2k-2 and C[N_C(w)] is K_{k-1,k-1} }
  function isCompleteBipartite(adj, verts, half) {
    if (verts.length !== 2 * half || half === 0) return false;
    const inN = new Set(verts);
    const u = verts[0];
    const B = verts.filter((x) => adj[u].has(x));
    const A = verts.filter((x) => !adj[u].has(x));
    if (A.length !== half || B.length !== half) return false;
    const sideA = new Set(A);
    for (const x of verts) {
      let same = 0, cross = 0;
      adj[x].forEach((y) => { if (inN.has(y)) { if (sideA.has(y) === sideA.has(x)) same++; else cross++; } });
      if (same !== 0 || cross !== half) return false;
    }
    return true;
  }
  function hubs(adj, k) {
    const out = [];
    for (let w = 0; w < adj.length; w++) {
      if (!adj[w] || adj[w].size !== 2 * k - 2) continue;
      if (isCompleteBipartite(adj, Array.from(adj[w]), k - 1)) out.push(w);
    }
    return out;
  }

  function degreeMultiset(adj) {
    const m = new Map();
    adj.forEach((s) => { if (s) m.set(s.size, (m.get(s.size) || 0) + 1); });
    return Array.from(m.entries()).sort((a, b) => a[0] - b[0]);
  }

  // Greedy edge-clique cover: an upper bound on the intersection number.
  function greedyCliqueCover(g) {
    const key = (a, b) => (a < b ? a * g.N + b : b * g.N + a);
    const uncovered = new Set(g.edges.map(([a, b]) => key(a, b)));
    const cliques = [];
    while (uncovered.size) {
      // start from the uncovered edge whose endpoints share the most neighbours
      let best = null, bestScore = -1;
      uncovered.forEach((e) => {
        const a = Math.floor(e / g.N), b = e % g.N;
        let s = 0; g.adj[a].forEach((x) => { if (g.adj[b].has(x)) s++; });
        if (s > bestScore) { bestScore = s; best = [a, b]; }
      });
      const clique = best.slice();
      let cand = Array.from(g.adj[best[0]]).filter((x) => g.adj[best[1]].has(x));
      while (cand.length) {
        // prefer the candidate covering the most uncovered edges
        let pick = cand[0], gain = -1;
        for (const c of cand) {
          let s = 0; for (const q of clique) if (uncovered.has(key(c, q))) s++;
          if (s > gain) { gain = s; pick = c; }
        }
        clique.push(pick);
        cand = cand.filter((x) => x !== pick && g.adj[pick].has(x));
      }
      for (let i = 0; i < clique.length; i++)
        for (let j = i + 1; j < clique.length; j++) uncovered.delete(key(clique[i], clique[j]));
      cliques.push(clique);
    }
    return cliques;
  }

  // ---------- monomials, lex order, strongly stable sets ----------
  // All exponent vectors of degree d in n variables, in descending lex order
  // (x1 > x2 > ... > xn).
  function monomials(n, d) {
    const out = [];
    (function rec(i, left, cur) {
      if (i === n - 1) { out.push(cur.concat(left)); return; }
      for (let e = left; e >= 0; e--) rec(i + 1, left - e, cur.concat(e));
    })(0, d, []);
    return out;
  }
  const mkey = (m) => m.join(',');

  // Borel moves: replace x_j by x_i with i < j. A set is strongly stable when
  // it is closed under them. Its Borel generators are the members that no
  // other member reaches by such moves, i.e. the members m for which no
  // "downward" move x_i -> x_{i+1} lands back inside the set.
  function borelGenerators(seg) {
    const inSeg = new Set(seg.map(mkey));
    return seg.filter((m) => {
      for (let i = 0; i < m.length - 1; i++) {
        if (m[i] === 0) continue;
        const t = m.slice(); t[i]--; t[i + 1]++;
        if (inSeg.has(mkey(t))) return false;
      }
      return true;
    });
  }
  function isStronglyStable(seg) {
    const inSeg = new Set(seg.map(mkey));
    return seg.every((m) => {
      for (let j = 1; j < m.length; j++) {
        if (m[j] === 0) continue;
        const t = m.slice(); t[j]--; t[j - 1]++;
        if (!inSeg.has(mkey(t))) return false;
      }
      return true;
    });
  }

  const api = { deBruijn, card, hubs, degreeMultiset, greedyCliqueCover, monomials, borelGenerators, isStronglyStable };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HM = api;
})(typeof self !== 'undefined' ? self : this);
