(function () {
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // RPAS: step through the six iteration figures
  var fr = document.querySelector('.frames');
  if (fr) {
    var imgs = fr.querySelectorAll('img'), i = 0;
    if (!still) setInterval(function () { imgs[i].classList.remove('on'); i = (i + 1) % imgs.length; imgs[i].classList.add('on'); }, 2600);
  }

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
})();
