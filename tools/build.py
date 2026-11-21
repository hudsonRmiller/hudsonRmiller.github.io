import sys, re
out = sys.argv[1]
GH = 'https://github.com/hudsonRmiller/'
X = ' target="_blank" rel="noopener"'
BH = 'B&#x0302;'  # B with a hat


def page(fn, title, cur, body, desc):
    nav = ''.join(f'<li><a href="{h}"{" aria-current=\"page\"" if h == cur else ""}>{t}</a></li>' for h, t in [('index.html', 'About'), ('research.html', 'Research<span class="long-only"> and Projects</span>'), ('academics.html', 'Academics')])
    html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#0a100e">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="assets/css/site.css">
</head>
<body>
<header class="nav">
  <div class="wrap">
    <a class="name" href="index.html">Hudson Miller</a>
    <nav aria-label="Main"><ul>{nav}<li><a class="pill" href="mailto:hrmiller@colgate.edu">Email</a></li></ul></nav>
  </div>
</header>
<main>
{body}
</main>
<footer>
  <div class="wrap">
    <p>© 2026 Hudson Miller · <a href="mailto:hrmiller@colgate.edu">hrmiller@colgate.edu</a> · <a href="https://github.com/hudsonRmiller"{X}>GitHub</a></p>
    <p>Campus aerial and Memorial Chapel: Colgate University, CC BY-SA 4.0. Taylor Lake: Balon Greyjoy, CC0. Via Wikimedia Commons.</p>
  </div>
</footer>
<script src="assets/js/site.js"></script>
</body>
</html>
'''
    open(f'{out}/{fn}', 'w').write(html)


# ---------- force curves drawn over the rowing photograph ----------
SEATS = [(-57, 33, 96, .36, 3.1), (-55, 34, 101, .40, 3.3), (-58, 32, 108, .38, 2.9), (-54, 35, 111, .43, 3.4), (-56, 33, 106, .34, 3.0), (-53, 34, 99, .41, 3.6), (-55, 31, 93, .45, 3.2), (-52, 33, 90, .39, 2.8)]
def path(st):
    c, f, pk, pp, q = st; d = []
    for k in range(61):
        u = k / 60; F = 0 if u in (0, 1) else pk * (u / pp) ** (pp * q) * ((1 - u) / (1 - pp)) ** ((1 - pp) * q)
        d.append(f"{'M' if k == 0 else 'L'}{90 + ((c + u * (f - c)) + 62) / 100 * 820:.1f} {590 - F / 120 * 430:.1f}")
    return ' '.join(d)
tx = lambda a: 90 + (a + 62) / 100 * 820
OVER = '<svg class="over" viewBox="0 0 1000 667" preserveAspectRatio="none" aria-hidden="true"><line x1="70" y1="590" x2="930" y2="590"/>' + ''.join(f'<line x1="{tx(a):.0f}" y1="590" x2="{tx(a):.0f}" y2="600"/><text x="{tx(a):.0f}" y="624" text-anchor="middle">{("−" if a < 0 else "") + str(abs(a))}°</text>' for a in (-60, -40, -20, 0, 20)) + ''.join(f'<path d="{path(st)}"{" class=\"hot\" pathLength=\"1\"" if i == 3 else ""}/>' for i, st in enumerate(SEATS)) + '</svg>'

RPAS_INTRO = 'This model optimizes curve-fitting by combining polynomial fitting, adaptive sampling, and recursive iterating. The goal is to use as little compute as possible to achieve only the necessary level of accuracy when solving ordinary differential equations.'

# ------------------------------------------------------------------ Home
page('index.html', 'Hudson Miller · Research Portfolio', 'index.html', f'''
<section class="hero board chalk-hero">
  <img class="board-img" src="assets/img/board.jpg" alt="Hudson Miller at a chalkboard">
  <canvas class="chalk" aria-hidden="true"></canvas>
  <div class="wrap">
    <h1 class="rise">Hudson Miller</h1>
    <div class="actions rise d1">
      <a class="pill solid" href="#work">Research and Projects</a>
      <a class="pill" href="academics.html">Academics</a>
    </div>
    <div class="stats">
      <div><strong>4.00</strong><span>Major GPA</span></div>
      <div><strong>Division I</strong><span>Heavyweight Rower, Colgate University</span></div>
      <div><strong>AMS Scholar</strong><span>Awarded $10,000 to pursue independent academic opportunities</span></div>
    </div>
  </div>
</section>

<section class="block" id="work" style="border-top:0">
  <div class="wrap">
    <h2 style="margin-bottom:clamp(28px,4vw,48px)">Research and Projects</h2>
    <div class="widgets">
      <a class="widget wide" href="debruijn.html">
        <div class="wstage deck-anim"><canvas aria-hidden="true"></canvas></div>
        <h3>Reconstruction and the Intersection Number of the Undirected de Bruijn Graph</h3>
      </a>
      <a class="widget" href="rpas.html">
        <div class="wstage" id="rpas"><canvas aria-hidden="true"></canvas></div>
        <h3>Recursive Polynomial Adaptive Sampling</h3>
      </a>
      <a class="widget" href="research.html#p-destroyer">
        <div class="wstage" id="destroyer"><canvas aria-hidden="true"></canvas></div>
        <h3>Graph-Based Point Cloud Data Reduction</h3>
      </a>
      <a class="widget" href="research.html#rowing">
        <div class="wstage"><canvas id="row-curves" aria-hidden="true"></canvas></div>
        <h3>Colgate Rowing Telemetry and Data Analysis</h3>
      </a>
      <a class="widget" href="research.html#lexsegment">
        <div class="wstage"><svg class="lex" viewBox="0 0 400 300" aria-hidden="true"></svg></div>
        <h3>Strongly Stable Generators of Lexsegment Ideals</h3>
      </a>
      <a class="widget" href="research.html#alldorms">
        <div class="wstage"><img src="assets/img/alldorms-home.jpg" alt="" loading="lazy"><span class="badge">$11,000 in purchases</span></div>
        <h3>AllDorms</h3>
      </a>
      <a class="widget" href="research.html#projectverify">
        <div class="wstage"><img src="assets/img/projectverify.jpg" alt="" loading="lazy"></div>
        <h3>ProjectVerify</h3>
      </a>
      <a class="widget" href="research.html#tiretap">
        <div class="wstage"><img src="assets/img/tiretap.jpg" alt="" loading="lazy"></div>
        <h3>TireTap</h3>
      </a>
    </div>
  </div>
</section>

<section class="block">
  <div class="wrap split">
    <div>
      <h2>About</h2>
    </div>
    <div>
      <!-- YOUR TEXT: about-me paragraph goes here, e.g. <p class="cite">...</p> -->
      <div class="rows">
        <div class="row"><h3>Undergraduate Research Fellow | Colgate University</h3><span class="when">October 2025–Present</span>
          <p class="what">Mentor: Professor Sosa-Castillo</p>
          <p class="what">Conduct paid research in algebraic graph theory, investigating connections between existing work on reconstructing monomial orders and the graph reconstruction conjecture.</p>
          <p class="links"><a href="research.html">Research and Projects</a></p></div>
        <div class="row"><h3>Hamilton, NY | Philadelphia, PA</h3><span class="when"></span>
          <p class="links"><a href="mailto:hrmiller@colgate.edu">hrmiller@colgate.edu</a><a href="https://github.com/hudsonRmiller"{X}>GitHub</a></p></div>
      </div>
      <div class="photos">
        <div class="photo"><img src="assets/img/talk.jpg" alt="Hudson Miller giving a talk on reconstructing the de Bruijn graph" loading="lazy"></div>
        <div class="photo tall"><img src="assets/img/poster.jpg" alt="Hudson Miller presenting his poster" loading="lazy"></div>
      </div>
    </div>
  </div>
</section>

<section class="block photo-bg"><img class="bg" src="assets/img/golden.jpg" alt="" loading="lazy" style="object-position:50% 55%">
  <div class="wrap split">
    <h2>Leadership and Activities</h2>
    <div class="rows">
      <div class="row"><div class="withmark"><img class="mark" src="assets/img/logo-colgate-rowing.png" alt=""><h3>Division I Heavyweight Rower | Colgate University</h3></div><span class="when">2025–Present</span>
        <p class="what">Train 20 hours weekly; compete nationally in fall and spring; attend seasonal training camps.</p></div>
      <div class="row"><h3>AllDorms.net | Founder</h3><span class="when"></span>
        <p class="what">Built a college packing-list website for new parents; generated more than $11,000 in purchases.</p></div>
      <div class="row"><h3>ProjectVerify | Founder | TIA Incubator Entrepreneurship Program</h3><span class="when"></span>
        <p class="what">Obtained grant funding to build an early-stage software company offering AI "thesis defense" interviews for technical projects.</p></div>
      <div class="row"><h3>Colgate Math Club | Vice President</h3><span class="when">2026–Present</span>
        <p class="what">Manage funding; coordinate conferences, Putnam activities, and social events.</p></div>
    </div>
  </div>
</section>

<section class="block">
  <div class="wrap split">
    <h2>Honors</h2>
    <div class="rows">
      <div class="row"><h3>AMS Scholar</h3><span class="when"></span><p class="what">Awarded $10,000 to pursue independent academic opportunities</p></div>
      <div class="row"><h3>Benton Scholar</h3><span class="when"></span><p class="what">Awarded $3,000 to pursue independent academic opportunities</p></div>
      <div class="row"><h3>Phi Eta Sigma Honor Society</h3><span class="when"></span></div>
    </div>
  </div>
</section>
''', 'Research portfolio of Hudson Miller. Mathematics, Colgate University.')

# ------------------------------------------------------------------ Research and Projects
page('research.html', 'Research and Projects · Hudson Miller', 'research.html', f'''
<section class="top"><div class="wrap"><h1 class="rise">Research and Projects</h1></div></section>

<section class="block">
  <div class="wrap">

    <article class="feature" id="debruijn">
      <div class="feature-head">
        <h3>Reconstruction and the Intersection Number of the Undirected de Bruijn Graph</h3>
        <div>
          <p>Miller, H. Manuscript in preparation for submission.</p>
          <div class="thm"><b>Theorem 1 (Reconstruction).</b> For all k, n ≥ 2, the undirected de Bruijn graph {BH}(k, n) on ≥ 3 vertices is reconstructible.</div>
          <div class="thm"><b>Theorem 2 (Intersection Number).</b> For k ≥ 3, n ≥ 4, the intersection number of the undirected de Bruijn graph {BH}(k, n) is i({BH}(k, n)) = k<sup>n</sup> − k(k + 1)/2 − ⅔ k(k − 1)(k + 4).</div>
          <p class="links"><a href="debruijn.html">Read more</a></p>
        </div>
      </div>
      <div class="stage deck-anim">
        <canvas style="height:clamp(380px,40vw,500px)" role="img" aria-label="A graph G and its deck: each vertex is deleted in turn, and each card joins the deck"></canvas>
      </div>
      <div class="rows" style="margin-top:24px">
        <div class="row"><h3>Invited Speaker, Rutgers DIMACS Graduate Seminar in Combinatorics</h3><span class="when">Fall 2026</span></div>
        <div class="row"><div class="withmark"><img class="mark chip" src="assets/img/logo-cimpa.png" alt=""><h3>Presenter, CIMPA Summer School in Combinatorics and Graph Theory, Costa Rica</h3></div><span class="when">Summer 2026</span></div>
      </div>
    </article>

    <article class="feature" id="p-rpas">
      <div class="feature-head">
        <h3>Recursive Polynomial Adaptive Sampling</h3>
        <div>
          <p>{RPAS_INTRO}</p>
          <p class="links"><a href="rpas.html">Write-up</a><a href="{GH}Recursive-Polynomial-Adaptive-Sampling"{X}>Code on GitHub</a></p>
        </div>
      </div>
      <div class="stage" id="rpas">
        <span class="note" data-iter>Iteration 1</span>
        <canvas style="height:clamp(300px,36vw,460px)" role="img" aria-label="An approximation converging to the actual solution over successive iterations"></canvas>
      </div>
    </article>

    <article class="feature" id="p-destroyer">
      <div class="feature-head">
        <h3>Graph-Based Point Cloud Data Reduction</h3>
        <div>
          <p class="links" style="margin-top:0"><a href="{GH}graph.theory.data.destroyer"{X}>Code on GitHub</a></p>
        </div>
      </div>
      <div class="stage" id="destroyer">
        <span class="note" data-level></span>
        <canvas style="height:clamp(300px,40vw,480px)" role="img" aria-label="A noisy point cloud joined by nearest-neighbour edges and reduced to component centroids, repeatedly"></canvas>
      </div>
    </article>

    <article class="feature" id="rowing">
      <div class="feature-head">
        <div class="withmark"><img class="mark" style="height:44px" src="assets/img/logo-colgate-rowing.png" alt=""><h3>Colgate Rowing Telemetry and Data Analysis</h3></div>
        <div>
          <p>Team dashboard for Peach PowerLine data from Colgate's 8+. Coaches upload sessions; every athlete can see every session (whole boat); each athlete has a season page with their own trends.</p>
          <p>This is some work I did for the Colgate rowing team. We walk through data cleaning, summary, analysis, and modelling.</p>
          <p class="links"><a href="https://colgate-rowing.vercel.app"{X}>colgate-rowing.vercel.app</a><a href="https://hudson-miller.github.io/"{X}>Data analysis</a></p>
        </div>
      </div>
      <div class="stage shade">
        <img src="assets/img/single.jpg" alt="Hudson Miller rowing a single, with force curves drawn over the photograph">
        {OVER}
      </div>
      <div class="viz">
        <figure><figcaption>Force / angle <span>kgf</span></figcaption><canvas id="row-curves" role="img" aria-label="Gate force against oar angle for each seat, one seat highlighted"></canvas></figure>
        <figure><figcaption>Gate force <span>kgf</span></figcaption><canvas id="row-trace" role="img" aria-label="Gate force over time, stroke after stroke"></canvas></figure>
        <figure><figcaption>Session <span>crew power, W</span></figcaption><canvas id="row-session" role="img" aria-label="Crew power across a session"></canvas></figure>
      </div>
      <p style="color:var(--faint);font-size:15px;margin-top:12px">Illustrative data.</p>
    </article>

    <article class="feature" id="lexsegment">
      <div class="feature-head">
        <h3>Strongly Stable Generators of Lexsegment Ideals</h3>
        <div>
          <p>Sosa, G.; Miller, H.; Santo, K.; and Mackenzie, N. Manuscript in preparation for submission.</p>
          <!-- YOUR TEXT: abstract or description of this paper -->
        </div>
      </div>
      <div class="stage" style="display:flex;justify-content:center;padding:28px 0"><svg class="lex" viewBox="0 0 400 300" style="width:min(100%,560px);height:auto" role="img" aria-label="Monomials of degree four in three variables, with a growing lexsegment and its strongly stable generators"></svg></div>
      <div class="rows" style="margin-top:24px">
        <div class="row"><div class="withmark"><img class="mark chip" src="assets/img/logo-cimpa.png" alt=""><h3>Presenter, CIMPA Summer School in Combinatorics and Graph Theory, Costa Rica</h3></div><span class="when">Summer 2026</span></div>
      </div>
    </article>

    <article class="feature" id="alldorms">
      <div class="feature-head">
        <div><h3>AllDorms</h3><strong class="big">$11,000</strong></div>
        <div>
          <p>Built a college packing-list website for new parents; generated more than $11,000 in purchases.</p>
          <p class="links"><a href="https://alldorms.net"{X}>alldorms.net</a><a href="{GH}alldorms"{X}>Code on GitHub</a></p>
        </div>
      </div>
      <div class="shots">
        <div class="stage"><img src="assets/img/alldorms-home.jpg" alt="AllDorms home page" loading="lazy"></div>
        <div class="col">
          <div class="stage"><img src="assets/img/alldorms-colgate.jpg" alt="AllDorms guide for Colgate" loading="lazy"></div>
          <div class="stage"><img src="assets/img/alldorms-guide.jpg" alt="AllDorms housing section for Colgate" loading="lazy"></div>
        </div>
      </div>
    </article>

    <article class="feature">
      <div class="pair">
        <div id="projectverify">
          <div class="stage"><img src="assets/img/projectverify.jpg" alt="ProjectVerify" loading="lazy"></div>
          <h3>ProjectVerify</h3>
          <p>Obtained grant funding to build an early-stage software company offering AI "thesis defense" interviews for technical projects.</p>
          <p class="links"><a href="https://www.useprojectverify.com"{X}>useprojectverify.com</a></p>
        </div>
        <div id="tiretap">
          <div class="stage"><img src="assets/img/tiretap.jpg" alt="TireTap" loading="lazy" style="aspect-ratio:1440/900;object-fit:cover"></div>
          <h3>TireTap</h3>
          <p>A mountain bike game for your phone</p>
          <p class="links"><a href="https://tiretap.racing"{X}>tiretap.racing</a></p>
        </div>
      </div>
    </article>
  </div>
</section>

<section class="block">
  <div class="wrap split">
    <h2>Research Experience</h2>
    <div class="rows">
      <div class="row"><h3>Undergraduate Research Fellow | Colgate University</h3><span class="when">October 2025–Present</span>
        <p class="what">Mentor: Professor Sosa-Castillo</p>
        <p class="what">Conduct paid research in algebraic graph theory, investigating connections between existing work on reconstructing monomial orders and the graph reconstruction conjecture.</p></div>
      <div class="row"><h3>Summer Research Fellow | Colgate University</h3><span class="when">June–August 2026</span>
        <p class="what">Completed a paid, faculty-initiated fellowship (40 hours per week), extending academic-year research in algebraic graph theory and pursuing related problems in algebra.</p></div>
      <div class="row"><div class="withmark"><img class="mark chip" src="assets/img/logo-cimpa.png" alt=""><h3>CIMPA School in Combinatorics and Graph Theory</h3></div><span class="when">August 2026</span>
        <p class="what">San José, Costa Rica. Studied graph theory, matroids, symmetric functions, and polytopes; presented research.</p></div>
    </div>
  </div>
</section>
''', 'Research and projects by Hudson Miller.')

# ------------------------------------------------------------------ de Bruijn (from the DIMACS slides)
page('debruijn.html', 'Reconstruction of the Undirected de Bruijn Graph · Hudson Miller', 'research.html', f'''
<section class="top">
  <div class="wrap">
    <p class="crumb rise"><a href="research.html#debruijn">← Research and Projects</a></p>
    <h1 class="rise long">Reconstruction and the Intersection Number of the Undirected de Bruijn Graph</h1>
    <p class="lede rise d1" style="color:var(--muted);margin-top:24px">Hudson Miller, Colgate University Department of Mathematics. Rutgers Graduate Seminar in Combinatorics, October 14, 2026.</p>
  </div>
</section>

<section class="block">
  <div class="wrap split">
    <h2>Reconstruction</h2>
    <div class="prose">
      <p>For a graph G:</p>
      <p><b>A card.</b> G with one vertex deleted.</p>
      <p><b>The deck.</b> The vertex-deletion deck of G, D(G), is the multiset of all cards.</p>
      <div class="stage deck-anim" style="margin:28px 0">
        <canvas style="height:clamp(420px,34vw,440px)" role="img" aria-label="A graph G and its deck: each vertex is deleted in turn, and each card joins the deck"></canvas>
      </div>
      <div class="thm lead"><b>The Kelly–Ulam Conjecture.</b> Every finite simple graph on ≥ 3 vertices is determined up to isomorphism by its vertex-deletion deck.</div>
      <p>Equivalently: D(G′) ≅ D(G) ⇒ G′ ≅ G.</p>
      <p>Proven for many families: trees, regular graphs, disconnected graphs, maximal planar graphs, and others.</p>
      <p>{BH}(k, n) does not belong to any of these classes.</p>
    </div>
  </div>
</section>

<section class="block">
  <div class="wrap split">
    <h2>De Bruijn sequences</h2>
    <div class="duo">
      <div class="prose">
        <p>Fix a k-alphabet Σ<sub>k</sub> = {{0, 1, …, k − 1}} and a length n.</p>
        <p><b>De Bruijn sequence.</b> A cyclic string of length k<sup>n</sup> in which every word of length n over Σ<sub>k</sub> appears exactly once as a substring, including wrap-around substrings.</p>
        <p>Example: k = 2, n = 3. Sequence: <span class="mono">00010111</span></p>
      </div>
      <div class="stage wheel">
        <canvas style="height:300px" role="img" aria-label="A window of length three sliding around the cyclic sequence 00010111"></canvas>
        <p class="words" data-words></p>
      </div>
    </div>
  </div>
</section>

<section class="block">
  <div class="wrap split">
    <h2>The undirected de Bruijn graph, {BH}(k, n)</h2>
    <div class="duo">
      <div class="prose">
        <p><b>De Bruijn graph B(k, n).</b> Vertices: all words of length n − 1 (|V| = k<sup>n−1</sup>). Edges: there is a directed edge u → v if suf(u) = pre(v).</p>
        <p>To “undirect” B(k, n):</p>
        <ol><li>Remove the orientation of all edges.</li><li>Delete loops.</li><li>Collapse all parallel edges.</li></ol>
        <p><b>Adjacency in {BH}(k, n).</b> For u ≠ v: u ∼ v if and only if suf(u) = pre(v) or suf(v) = pre(u).</p>
      </div>
      <canvas class="dbg-spin" style="width:100%;height:380px" role="img" aria-label="The undirected de Bruijn graph on two-letter words over four symbols"></canvas>
    </div>
  </div>
</section>

<section class="block">
  <div class="wrap split">
    <h2>Results</h2>
    <div class="prose">
      <div class="thm lead"><b>Theorem 1 (Reconstruction).</b> For all k, n ≥ 2, the undirected de Bruijn graph {BH}(k, n) on ≥ 3 vertices is reconstructible.</div>
      <p style="margin-top:36px"><b>Intersection number i(G)</b> (Erdős–Goodman–Pósa, 1966). The smallest number of cliques needed to cover every edge of G. Computing i(G) is NP-hard in general (Kou–Stockmeyer–Wong, 1978).</p>
      <div class="thm lead"><b>Theorem 2 (Intersection Number).</b> For k ≥ 3, n ≥ 4, the intersection number of the undirected de Bruijn graph {BH}(k, n) is
        <span class="eq">i({BH}(k, n)) = k<sup>n</sup> − k(k + 1)/2 − ⅔ k(k − 1)(k + 4).</span></div>
      <div class="photos">
        <div class="photo"><img src="assets/img/talk.jpg" alt="Hudson Miller presenting at the Rutgers Graduate Seminar in Combinatorics" loading="lazy"></div>
        <div class="photo tall"><img src="assets/img/poster.jpg" alt="Hudson Miller presenting his poster" loading="lazy"></div>
      </div>
      <p class="links" style="margin-top:28px"><a href="research.html#debruijn">← Research and Projects</a></p>
    </div>
  </div>
</section>
''', 'Reconstruction and the intersection number of the undirected de Bruijn graph, by Hudson Miller.')

# ------------------------------------------------------------------ RPAS write-up as a page
def fig(i, alt): return f'<div class="plot"><img src="assets/img/rpas/{i}.png" alt="{alt}" loading="lazy"></div>'
page('rpas.html', 'Recursive Polynomial Adaptive Sampling · Hudson Miller', 'research.html', f'''
<section class="top">
  <div class="wrap">
    <p class="crumb rise"><a href="research.html#p-rpas">← Research and Projects</a></p>
    <h1 class="rise long">Recursive Polynomial Adaptive Sampling</h1>
    <p class="lede rise d1" style="color:var(--muted);margin-top:24px">RPAS ODE Solver. Hudson Miller.</p>
    <p class="links rise d2"><a href="{GH}Recursive-Polynomial-Adaptive-Sampling"{X}>Code on GitHub</a></p>
  </div>
</section>

<section class="block">
  <div class="wrap article">
    <div class="stage" id="rpas" style="margin-bottom:clamp(36px,5vw,64px)">
      <span class="note" data-iter>Iteration 1</span>
      <canvas style="height:clamp(300px,36vw,460px)" role="img" aria-label="An approximation converging to the actual solution over successive iterations"></canvas>
    </div>

    <h2>Introduction</h2>
    <p>This model optimizes curve-fitting by combining polynomial fitting, adaptive sampling, and recursive iterating. The goal is to use as little compute as possible to achieve only the necessary level of accuracy when solving ordinary differential equations. This essentially means reaching “convergence” in as few iterations as possible. The required level of accuracy to achieve convergence is set by the user, as they choose the maximum error for the model to keep iterating. This model is unique because it only continues to sample in regions where there are high residuals. This allows it to not only be efficient with compute, but efficient with information. The model only samples new points when it is necessary, hence making it very useful for large datasets. The principles behind this model have broad implications beyond just differential equations such as stock market trend analysis, derivatives trading, and the optimization of neural nets by providing an efficient way to minimize loss functions.</p>

    <h2>Iteration 1: Initial Approximation</h2>
    <p>The blue dashed line is the curve we are trying to approximate, and the solid orange line is our approximation. The solver starts with an initial linear “guess,” which is simply the dashed orange line that goes between the first and last sampled points. Red points represent the sampled points used to approximate the curve, and the residual-based correction begins from here. The purple plot at the bottom is the error plot. A polynomial of nth degree is fitted through the residual plot (not shown), and its values are subtracted from the initial guess function. This process is repeated with each iteration. The degree of the polynomial is a parameter that can be adjusted by the user before the first iteration. Here, polynomials of degree 3 are used. In the future, parameters could be added to dynamically change the degree of the polynomial. The differential equation we are solving in this case is:</p>
    <p class="eq">dy/dx = sin(5x) − y</p>
    {fig(1, 'Iteration 1')}

    <h2>Iteration 2: Improved Approximation</h2>
    <p>The solver refines the curve by correcting the first iteration using the residuals. The approximation aligns more closely with the true solution. Additional points are adaptively sampled where residuals are high. “High” is defined as a user-adjustable multiple of the maximum error. If a residual is abnormally high, more points near that residual are sampled. These points are simply midpoints between already-sampled points.</p>
    {fig(2, 'Iteration 2')}

    <h2>Iteration 3: Adding Points for Higher Accuracy</h2>
    <p>The solver continues refining the approximation by sampling additional points, improving accuracy further.</p>
    {fig(3, 'Iteration 3')}

    <h2>Iteration 4: Significant Error Reduction</h2>
    <p>By this iteration, the approximated curve (orange solid line) closely matches the actual solution. Remaining error is concentrated in regions of high oscillation. An important note: another sampling parameter ensures proper spacing between points. If the distance between two sample points is greater than a user-defined multiple of the average distance between sample points, a new point is added at the midpoint of the points that are too far apart. For example, this occurs in the second-leftmost region of the graph. This point was not added because of high error but rather due to this spacing parameter.</p>
    {fig(4, 'Iteration 4')}

    <h2>Iteration 5: Near Convergence</h2>
    <p>The curve is nearly indistinguishable from the actual solution. Sampling focuses on resolving residuals in areas with remaining errors, as indicated by the low error values.</p>
    {fig(5, 'Iteration 5')}

    <h2>Iteration 6: Convergence Achieved</h2>
    <p>The solver achieves convergence, where the maximum error and average error are within the specified thresholds. These thresholds are user-defined and situational. While average error is included here as a parameter for testing convergence, this metric would not appear in real use because it requires solving the function at every point.</p>
    {fig(6, 'Iteration 6')}

    <h2>Second Example: Sharp-Feature ODE</h2>
    <p>Here is another example, this time with a sharp-feature ODE. The equation is:</p>
    <p class="eq">dy/dx = arctan(100(x − 5))</p>
    <h3>Iteration 1</h3>{fig(7, 'Sharp-feature example, iteration 1')}
    <h3>Iteration 2</h3>{fig(8, 'Sharp-feature example, iteration 2')}
    <h3>Iteration 3</h3>{fig(9, 'Sharp-feature example, iteration 3')}
    <h3>Iteration 4</h3>{fig(10, 'Sharp-feature example, iteration 4')}

    <p class="links" style="margin-top:40px"><a href="research.html#p-rpas">← Research and Projects</a><a href="{GH}Recursive-Polynomial-Adaptive-Sampling"{X}>Code on GitHub</a></p>
  </div>
</section>
''', 'Recursive Polynomial Adaptive Sampling: an ODE solver write-up by Hudson Miller.')

# ------------------------------------------------------------------ Academics (unchanged, taken from the earlier generator)
page('academics.html', 'Academics · Hudson Miller', 'academics.html', '''
<section class="top photo-bg"><img class="bg" src="assets/img/colgate-aerial.jpg" alt=""><div class="wrap"><h1 class="rise">Academics</h1></div></section>

<section class="block">
  <div class="wrap split">
    <h2>Education</h2>
    <div>
      <div class="rows">
        <div class="row"><div class="withmark"><img class="mark" src="assets/img/logo-colgate.svg" alt=""><h3>Colgate University, Hamilton, NY</h3></div><span class="when">Expected May 2029</span>
          <p class="what">Bachelor of Arts in Mathematics | Major GPA 4.00</p>
          <p class="what">Selected Coursework: Number Theory, Probability, Computational Statistics in R, Linear Algebra, Calculus III</p>
          <p class="what">Planned Spring 2027: Mathematical Statistics, Abstract Algebra, Topology, Intro to Computing II</p></div>
        <div class="row"><div class="withmark"><img class="mark chip" src="assets/img/logo-cimpa.png" alt=""><h3>CIMPA School in Combinatorics and Graph Theory</h3></div><span class="when">August 2026</span>
          <p class="what">San José, Costa Rica. Studied graph theory, matroids, symmetric functions, and polytopes; presented research.</p></div>
        <div class="row"><h3>Conestoga High School, Berwyn, PA</h3><span class="when"></span>
          <p class="what">GPA 4.00 unweighted; 5.2/5.3 weighted | ACT 36 | SAT 1560 | 13 AP exams with scores of 4 or 5</p></div>
      </div>
    </div>
  </div>
</section>

<section class="block photo-bg"><img class="bg" src="assets/img/taylor-lake.jpg" alt="" loading="lazy">
  <div class="wrap split">
    <h2>Honors</h2>
    <div class="rows">
      <div class="row"><h3>AMS Scholar</h3><span class="when"></span><p class="what">Awarded $10,000 to pursue independent academic opportunities</p></div>
      <div class="row"><h3>Benton Scholar</h3><span class="when"></span><p class="what">Awarded $3,000 to pursue independent academic opportunities</p></div>
      <div class="row"><h3>Phi Eta Sigma Honor Society</h3><span class="when"></span></div>
    </div>
  </div>
</section>

<section class="block photo-bg"><img class="bg" src="assets/img/chapel.jpg" alt="" loading="lazy" style="object-position:50% 30%">
  <div class="wrap split">
    <h2>Technical Skills</h2>
    <div class="rows">
      <div class="row"><h3>Programming and Analysis</h3><span class="when"></span><p class="what">Python, R, C, ArcGIS</p></div>
      <div class="row"><h3>Typesetting</h3><span class="when"></span><p class="what">LaTeX</p></div>
    </div>
  </div>
</section>
''', 'Education and honors of Hudson Miller.')

open(f'{out}/projects.html', 'w').write('<!doctype html><meta charset="utf-8"><title>Research and Projects · Hudson Miller</title><meta http-equiv="refresh" content="0; url=research.html"><link rel="canonical" href="research.html"><a href="research.html">Research and Projects</a>')
