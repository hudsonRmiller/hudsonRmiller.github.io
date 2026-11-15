/* Rowing telemetry figure. The crew here is simulated; the metrics are computed
   with the same definitions the real dashboard uses (pin force -> handle power
   through the oar's lever arm). */
(function () {
  'use strict';
  const root = document.getElementById('row-lab'); if (!root) return;
  const C = window.HMC, MONO = window.HMMONO, fit = window.HMfit;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 374 cm oar, 114 cm inboard, measured to hand centre and blade centre
  const RIG = { oarLength: 3.74, inboard: 1.14, handOffset: 0.13, bladeOffset: 0.25 };
  const rin = RIG.inboard - RIG.handOffset, rout = RIG.oarLength - RIG.inboard - RIG.bladeOffset;
  const LEVER = (rin * rout) / (rin + rout);
  const KGF = 9.80665, DEG = Math.PI / 180;

  const BANDS = [
    { key: 'Under 20', rate: 18, f: 0.84, arc: 1.02 },
    { key: '20–24', rate: 22, f: 0.93, arc: 1.0 },
    { key: '24–28', rate: 26, f: 1.0, arc: 0.985 },
    { key: '28–32', rate: 30, f: 1.07, arc: 0.97 },
    { key: '32+', rate: 35, f: 1.13, arc: 0.95 },
  ];
  // seat 8 = stroke, seat 1 = bow. Fixed "personalities" so the picture is stable.
  const SEATS = [
    { seat: 8, c: -57, f: 33, peak: 96, p: 0.36, q: 3.1 },
    { seat: 7, c: -55, f: 34, peak: 101, p: 0.40, q: 3.3 },
    { seat: 6, c: -58, f: 32, peak: 108, p: 0.38, q: 2.9 },
    { seat: 5, c: -54, f: 35, peak: 111, p: 0.43, q: 3.4 },
    { seat: 4, c: -56, f: 33, peak: 106, p: 0.34, q: 3.0 },
    { seat: 3, c: -53, f: 34, peak: 99, p: 0.41, q: 3.6 },
    { seat: 2, c: -55, f: 31, peak: 93, p: 0.45, q: 3.2 },
    { seat: 1, c: -52, f: 33, peak: 90, p: 0.39, q: 2.8 },
  ];
  const HUES = ['#e3b23c', '#d9606a', '#5fb8a5', '#8fa9e8', '#e58f5a', '#b98fe0', '#9fd06a', '#e7e0c8'];
  const st = { band: 2, seat: 8 };

  function curve(s, band) {
    const b = BANDS[band], arc = (s.f - s.c) * b.arc, c = s.c * b.arc, peak = s.peak * b.f;
    const a = s.p * s.q, bb = (1 - s.p) * s.q, pts = [];
    for (let i = 0; i <= 80; i++) {
      const u = i / 80;
      const F = peak * Math.pow(u / s.p, a) * Math.pow((1 - u) / (1 - s.p), bb);
      pts.push([c + u * arc, F]);
    }
    return pts;
  }
  function metrics(s, band) {
    const pts = curve(s, band); let work = 0, peak = 0, slip = null, wash = null;
    for (let i = 1; i < pts.length; i++) {
      work += ((pts[i][1] + pts[i - 1][1]) / 2) * KGF * LEVER * (pts[i][0] - pts[i - 1][0]) * DEG;
      peak = Math.max(peak, pts[i][1]);
    }
    // slip / wash: degrees spent below 30% of peak at each end
    for (let i = 0; i < pts.length; i++) { if (pts[i][1] >= 0.3 * peak) { if (slip === null) slip = pts[i][0] - pts[0][0]; wash = pts[pts.length - 1][0] - pts[i][0]; } }
    return { catchA: pts[0][0], finishA: pts[pts.length - 1][0], peak, power: (work * BANDS[band].rate) / 60, slip, wash, pts };
  }

  // ----- force curve chart -----
  const chart = root.querySelector('#row-chart');
  function drawChart() {
    const { ctx, w, h } = fit(chart);
    ctx.clearRect(0, 0, w, h);
    const m = { l: 46, r: 16, t: 18, b: 38 }, X0 = -65, X1 = 40, Y1 = 130;
    const x = (v) => m.l + ((v - X0) / (X1 - X0)) * (w - m.l - m.r), y = (v) => h - m.b - (v / Y1) * (h - m.t - m.b);
    ctx.font = `10.5px ${MONO}`; ctx.lineWidth = 1;
    for (let v = 0; v <= Y1; v += 20) {
      ctx.strokeStyle = 'rgba(237,239,231,.08)'; ctx.beginPath(); ctx.moveTo(m.l, y(v)); ctx.lineTo(w - m.r, y(v)); ctx.stroke();
      ctx.fillStyle = C.dim; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(v, m.l - 8, y(v));
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let v = -60; v <= 40; v += 20) {
      ctx.fillStyle = C.dim; ctx.fillText((v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v) + '°', x(v), h - m.b + 8);
      if (v === 0) { ctx.strokeStyle = 'rgba(237,239,231,.2)'; ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(x(0), m.t); ctx.lineTo(x(0), h - m.b); ctx.stroke(); ctx.setLineDash([]); }
    }
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = C.dim;
    ctx.fillText('PIN FORCE, KGF', m.l, 2);
    ctx.textAlign = 'right'; ctx.fillText('GATE ANGLE: CATCH → FINISH', w - m.r, h - 13);
    // crew mean
    const all = SEATS.map((s) => metrics(s, st.band));
    const line = (pts, color, width, alpha, dash) => {
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.globalAlpha = alpha; ctx.setLineDash(dash || []); ctx.lineJoin = 'round';
      ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(x(p[0]), y(p[1])) : ctx.moveTo(x(p[0]), y(p[1])))); ctx.stroke();
      ctx.globalAlpha = 1; ctx.setLineDash([]);
    };
    SEATS.forEach((s, i) => { if (s.seat !== st.seat) line(all[i].pts, HUES[i], 1.3, 0.38); });
    const si = SEATS.findIndex((s) => s.seat === st.seat), sel = all[si];
    ctx.fillStyle = HUES[si]; ctx.globalAlpha = 0.13;
    ctx.beginPath(); sel.pts.forEach((p, i) => (i ? ctx.lineTo(x(p[0]), y(p[1])) : ctx.moveTo(x(p[0]), y(p[1])))); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
    line(sel.pts, HUES[si], 2.6, 1);
    const pk = sel.pts.reduce((a, b) => (b[1] > a[1] ? b : a));
    ctx.fillStyle = HUES[si]; ctx.beginPath(); ctx.arc(x(pk[0]), y(pk[1]), 4, 0, 6.2832); ctx.fill();
    ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.font = `11.5px ${MONO}`;
    ctx.fillText(`seat ${st.seat}  ${pk[1].toFixed(0)} kgf at ${pk[0] < 0 ? '−' : '+'}${Math.abs(pk[0]).toFixed(0)}°`, Math.min(x(pk[0]) + 10, w - 190), y(pk[1]) - 6);
    return all;
  }

  // ----- table -----
  const tbody = root.querySelector('tbody');
  function drawTable(all) {
    tbody.innerHTML = '';
    SEATS.forEach((s, i) => {
      const m = all[i], tr = document.createElement('tr');
      if (s.seat === st.seat) tr.className = 'on';
      tr.tabIndex = 0; tr.setAttribute('role', 'button'); tr.setAttribute('aria-label', 'Highlight seat ' + s.seat);
      tr.innerHTML = `<td><i style="background:${HUES[i]}"></i>${s.seat}${s.seat === 8 ? ' stroke' : s.seat === 1 ? ' bow' : ''}</td><td>${m.catchA.toFixed(0)}°</td><td>${m.finishA.toFixed(0)}°</td><td>${m.peak.toFixed(0)}</td><td>${m.slip.toFixed(0)}° / ${m.wash.toFixed(0)}°</td><td>${m.power.toFixed(0)}</td>`;
      const pickSeat = () => { st.seat = s.seat; render(); };
      tr.addEventListener('click', pickSeat);
      tr.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickSeat(); } });
      tbody.appendChild(tr);
    });
    const avg = all.reduce((a, m) => a + m.power, 0) / all.length;
    root.querySelector('[data-r="avg"]').textContent = avg.toFixed(0) + ' W';
    root.querySelector('[data-r="rate"]').textContent = BANDS[st.band].rate + ' spm';
  }

  // ----- animated top-down eight -----
  const boat = root.querySelector('#row-boat');
  let t0 = performance.now(), running = false, visible = true;
  function drawBoat(now) {
    const { ctx, w, h } = fit(boat);
    ctx.clearRect(0, 0, w, h);
    const b = BANDS[st.band], period = 60 / b.rate, driveT = 0.36 + 0.3 * (18 / b.rate) * 0.5;
    const tt = reduced ? 0.18 * period : ((now - t0) / 1000) % period, ph = tt / period, drive = ph < driveT / period;
    const u = drive ? ph / (driveT / period) : 1 - (ph - driveT / period) / (1 - driveT / period);
    const ease = drive ? u : u * u * (3 - 2 * u);
    const cy = h / 2, L = Math.min(w - 40, 760), xs = (w - L) / 2, sc = L / 19; // metres -> px
    // water streaks drift with boat speed
    ctx.strokeStyle = 'rgba(237,239,231,.06)'; ctx.lineWidth = 1;
    const drift = reduced ? 0 : ((now - t0) / 1000) * 60;
    for (let i = 0; i < 16; i++) { const yy = ((i * 53) % h); const xx = w - ((drift * (0.5 + (i % 4) * 0.2) + i * 97) % (w + 80)); ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + 26 + (i % 3) * 14, yy); ctx.stroke(); }
    // hull
    ctx.fillStyle = '#e9ebe2'; ctx.beginPath();
    ctx.moveTo(xs, cy); ctx.quadraticCurveTo(xs + L * 0.3, cy - sc * 0.34, xs + L * 0.55, cy - sc * 0.3); ctx.quadraticCurveTo(xs + L * 0.86, cy - sc * 0.22, xs + L, cy);
    ctx.quadraticCurveTo(xs + L * 0.86, cy + sc * 0.22, xs + L * 0.55, cy + sc * 0.3); ctx.quadraticCurveTo(xs + L * 0.3, cy + sc * 0.34, xs, cy); ctx.fill();
    ctx.font = `10px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    SEATS.forEach((s, i) => {
      const m = metrics(s, st.band), side = i % 2 === 0 ? -1 : 1; // stroke on port
      const px = xs + L * 0.2 + i * sc * 1.42, py = cy + side * sc * 0.83;
      const th = (m.catchA + ease * (m.finishA - m.catchA)) * DEG;
      const dx = -Math.sin(th), dy = side * Math.cos(th);
      const hx = px - dx * rin * sc, hy = py - dy * rin * sc, bx = px + dx * rout * sc, by = py + dy * rout * sc;
      const on = s.seat === st.seat, col = on ? HUES[i] : C.chalk;
      // rigger
      ctx.strokeStyle = 'rgba(237,239,231,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(px - sc * 0.25, cy + side * sc * 0.25); ctx.lineTo(px, py); ctx.lineTo(px + sc * 0.25, cy + side * sc * 0.25); ctx.stroke();
      // force now
      const idx = Math.round(ease * 80), F = drive ? m.pts[idx][1] : 0;
      ctx.strokeStyle = col; ctx.globalAlpha = on ? 1 : 0.62; ctx.lineWidth = on ? 2.2 : 1.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(bx, by); ctx.stroke();
      // blade
      ctx.lineWidth = on ? 6 : 4.5; ctx.strokeStyle = drive ? HUES[i] : col; ctx.globalAlpha = drive ? 0.45 + 0.55 * (F / 125) : on ? 0.9 : 0.5;
      ctx.beginPath(); ctx.moveTo(bx - dx * sc * 0.5, by - dy * sc * 0.5); ctx.lineTo(bx, by); ctx.stroke();
      if (drive && F > 20) { ctx.globalAlpha = 0.22 * (F / 125); ctx.fillStyle = HUES[i]; ctx.beginPath(); ctx.arc(bx, by, 4 + F / 9, 0, 6.2832); ctx.fill(); }
      ctx.globalAlpha = 1;
      // rower
      ctx.fillStyle = on ? HUES[i] : '#0f1917'; ctx.beginPath(); ctx.arc(px - sc * 0.15, cy, sc * 0.2, 0, 6.2832); ctx.fill();
      ctx.fillStyle = on ? '#0f1917' : C.chalk; ctx.fillText(s.seat, px - sc * 0.15, cy + 0.5);
    });
    ctx.fillStyle = C.dim; ctx.textAlign = 'left'; ctx.fillText(drive ? 'DRIVE' : 'RECOVERY', 14, 14);
    ctx.textAlign = 'right'; ctx.fillText('BOW →', w - 14, 14);
  }
  function loop(now) { if (!visible) { running = false; return; } drawBoat(now); if (!reduced) requestAnimationFrame(loop); else running = false; }
  function wake() { if (!running) { running = true; requestAnimationFrame(loop); } }
  window.HMwhileVisible(boat, () => { visible = true; wake(); }, () => { visible = false; });

  function render() {
    const all = drawChart(); drawTable(all);
    root.querySelectorAll('[data-band]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.band === st.band)));
    if (reduced) wake();
  }
  root.querySelectorAll('[data-band]').forEach((b) => b.addEventListener('click', () => { st.band = +b.dataset.band; render(); }));
  if ('ResizeObserver' in window) new ResizeObserver(() => drawChart()).observe(chart);
  render();
})();
