/* Small, self-contained visuals for each mechanism card. Each builder returns a DOM node. */
const SVGNS = "http://www.w3.org/2000/svg";

function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}
function s(tag, attrs = {}, ...kids) {
  const e = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}
function rng(seed) { let x = seed >>> 0 || 1; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); }
function slider(label, min, max, step, value, oninput, fmt = v => v) {
  const out = h("span", {}, fmt(value));
  const inp = h("input", { type: "range", min, max, step, value });
  inp.addEventListener("input", () => { out.textContent = fmt(+inp.value); oninput(+inp.value); });
  return h("label", {}, label, " ", inp, " ", out);
}
function seg(options, current, onpick) {
  const box = h("div", { class: "seg" });
  options.forEach(([id, label]) => {
    const b = h("button", { class: id === current ? "on" : "" }, label);
    b.addEventListener("click", () => { [...box.children].forEach(c => c.classList.remove("on")); b.classList.add("on"); onpick(id); });
    box.append(b);
  });
  return box;
}
function legend(items) {
  return h("div", { class: "legend" }, items.map(([c, t]) => h("span", {}, h("i", { style: `background:${c}` }), t)));
}

/* ---------- attention masks ---------- */
function maskCells(pattern, N, p) {
  // returns N×N array of: 0 none, 1 attended, 2 selected/sink, 3 window, 4 compressed summary, 5 cached (prev segment)
  const M = Array.from({ length: N }, () => Array(N).fill(0));
  const r = rng(7 + (p || 0));
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      if (pattern === "full") M[i][j] = 1;
      else if (j > i) continue;
      else if (pattern === "causal" || pattern === "tiles") M[i][j] = 1;
      else if (pattern === "window") M[i][j] = i - j < p ? 3 : 0;
      else if (pattern === "sink") M[i][j] = j < 2 ? 2 : (i - j < p ? 3 : 0);
      else if (pattern === "strided") M[i][j] = (i - j < p) ? 3 : ((j % p) === p - 1 ? 1 : 0);
      else if (pattern === "segment") {
        const S = N / 2, si = Math.floor(i / S), sj = Math.floor(j / S);
        if (si === sj) M[i][j] = 1; else if (sj === si - 1) M[i][j] = 5;
      }
    }
    if (pattern === "topk") {
      const scores = Array.from({ length: i + 1 }, (_, j) => ({ j, v: r() + (j === i ? 0.3 : 0) }));
      scores.sort((a, b) => b.v - a.v).slice(0, p).forEach(o => (M[i][o.j] = 2));
    }
    if (pattern === "nsa" || pattern === "csa") {
      const B = pattern === "nsa" ? 4 : p, W = 3;
      const nFull = Math.floor((i - W + 1) / B); // complete blocks strictly before the window
      const blocks = Array.from({ length: Math.max(0, nFull) }, (_, b) => ({ b, v: r() }));
      const top = new Set(blocks.slice().sort((a, b) => b.v - a.v).slice(0, 2).map(o => o.b));
      for (let j = 0; j <= i; j++) {
        if (i - j < W) { M[i][j] = 3; continue; }
        const b = Math.floor(j / B);
        if (b < nFull) {
          if (pattern === "nsa") M[i][j] = top.has(b) ? 2 : 4;
          else M[i][j] = top.has(b) ? 2 : 0;
        }
      }
    }
  }
  return M;
}
const MASK_COLORS = ["var(--cell)", "var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c4)"];
function maskViz(v) {
  const N = v.pattern === "nsa" || v.pattern === "csa" ? 24 : 12;
  const box = h("div");
  const holder = h("div");
  const cs = N > 12 ? 11 : 16, pad = 18, W = N * cs + pad;
  let p = v.param ? v.param.value : 0;
  function draw() {
    const M = maskCells(v.pattern, N, p);
    const svg = s("svg", { viewBox: `0 0 ${W + 4} ${W + 4}`, width: W + 4, role: "img", "aria-label": "attention mask" });
    svg.append(s("text", { x: pad, y: 11, "font-size": 9 }, "keys →"));
    svg.append(s("text", { x: 2, y: pad + 8, "font-size": 9, transform: `rotate(90 6 ${pad + 8})` }, "queries"));
    let count = 0;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const c = M[i][j]; if (c && c !== 4) count++;
      svg.append(s("rect", { x: pad + j * cs, y: pad + i * cs, width: cs - 2, height: cs - 2, rx: 2, fill: MASK_COLORS[c], opacity: c === 5 ? 0.9 : 1 }));
    }
    if (v.pattern === "tiles") {
      for (let t = 0; t <= N; t += 4) {
        svg.append(s("line", { x1: pad + t * cs - 1, y1: pad - 2, x2: pad + t * cs - 1, y2: pad + N * cs, stroke: "var(--c2)", "stroke-width": 1.5 }));
        svg.append(s("line", { x1: pad - 2, y1: pad + t * cs - 1, x2: pad + N * cs, y2: pad + t * cs - 1, stroke: "var(--c2)", "stroke-width": 1.5 }));
      }
      const hi = s("rect", { x: pad, y: pad, width: 4 * cs - 2, height: 4 * cs - 2, fill: "none", stroke: "var(--ink)", "stroke-width": 2.5, rx: 3 });
      svg.append(hi);
      const tiles = []; for (let a = 0; a < N / 4; a++) for (let b = 0; b <= a; b++) tiles.push([a, b]);
      let k = 0; clearInterval(box._t);
      box._t = setInterval(() => { if (!document.body.contains(svg)) return clearInterval(box._t); const [a, b] = tiles[k++ % tiles.length]; hi.setAttribute("x", pad + b * 4 * cs); hi.setAttribute("y", pad + a * 4 * cs); }, 700);
    }
    holder.replaceChildren(svg);
    const total = v.pattern === "full" ? N * N : N * (N + 1) / 2;
    cap.textContent = `${v.note || ""} ${v.pattern === "full" || v.pattern === "causal" || v.pattern === "tiles" ? "" : `Exact reads: ${count} of ${total} causal pairs.`}`;
  }
  const cap = h("p", { class: "vizcap" });
  if (v.param) box.append(h("div", { class: "vizctl" }, slider(v.param.name, v.param.min, v.param.max, 1, v.param.value, x => { p = x; draw(); })));
  box.append(holder, cap);
  const leg = {
    window: [["var(--c3)", "window"], ["var(--cell)", "not read"]],
    sink: [["var(--c2)", "sink tokens (kept forever)"], ["var(--c3)", "recent window"], ["var(--cell)", "evicted"]],
    strided: [["var(--c3)", "local block"], ["var(--c1)", "strided column"], ["var(--cell)", "not read"]],
    topk: [["var(--c2)", "top-k selected"], ["var(--cell)", "dropped"]],
    nsa: [["var(--c4)", "read as compressed summary"], ["var(--c2)", "selected block, read exactly"], ["var(--c3)", "local window"]],
    csa: [["var(--c2)", "top-k compressed blocks"], ["var(--c3)", "uncompressed window"], ["var(--cell)", "not read"]],
    segment: [["var(--c1)", "current segment"], ["var(--c4)", "cached previous segment (no gradient)"]],
    tiles: [["var(--c1)", "computed"], ["var(--c2)", "tile borders (one SRAM block at a time)"]],
  }[v.pattern];
  if (leg) box.append(legend(leg));
  draw();
  return box;
}

/* ---------- head sharing: MHA / GQA / MQA / MLA ---------- */
function headsViz(v) {
  const box = h("div"), holder = h("div"), cap = h("p", { class: "vizcap" });
  const modes = [["mha", "MHA"], ["gqa", "GQA (G=2)"], ["mqa", "MQA"], ["mla", "MLA"]];
  // per token per layer cache, in numbers, for an 8-head toy with d_head = 128; MLA uses d_c = 4·d_head = 512 plus 64 RoPE dims, as in DeepSeek-V2
  const cost = { mha: 2 * 8 * 128, gqa: 2 * 2 * 128, mqa: 2 * 1 * 128, mla: 512 + 64 };
  function draw(mode) {
    const W = 360, H = 170, svg = s("svg", { viewBox: `0 0 ${W} ${H}`, width: W });
    const qx = i => 22 + i * 42;
    for (let i = 0; i < 8; i++) {
      svg.append(s("rect", { x: qx(i), y: 12, width: 30, height: 22, rx: 4, fill: "var(--c1)" }));
      svg.append(s("text", { x: qx(i) + 15, y: 27, "font-size": 10, "text-anchor": "middle", fill: "#fff", style: "fill:#fff" }, "Q" + (i + 1)));
    }
    let kv = [];
    if (mode === "mha") kv = [...Array(8).keys()].map(i => ({ x: qx(i), w: 30, of: [i] }));
    if (mode === "gqa") kv = [0, 1].map(g => ({ x: qx(g * 4) + 50, w: 70, of: [g * 4, g * 4 + 1, g * 4 + 2, g * 4 + 3] }));
    if (mode === "mqa") kv = [{ x: 145, w: 70, of: [0, 1, 2, 3, 4, 5, 6, 7] }];
    if (mode === "mla") {
      for (let i = 0; i < 8; i++) {
        svg.append(s("rect", { x: qx(i), y: 70, width: 30, height: 20, rx: 4, fill: "none", stroke: "var(--c2)", "stroke-dasharray": "3 2" }));
        svg.append(s("text", { x: qx(i) + 15, y: 84, "font-size": 9, "text-anchor": "middle" }, "K,V" + (i + 1)));
        svg.append(s("line", { x1: qx(i) + 15, y1: 34, x2: qx(i) + 15, y2: 70, stroke: "var(--line)" }));
        svg.append(s("line", { x1: qx(i) + 15, y1: 90, x2: 180, y2: 128, stroke: "var(--c2)", "stroke-dasharray": "3 2" }));
      }
      svg.append(s("rect", { x: 110, y: 128, width: 140, height: 26, rx: 5, fill: "var(--c2)" }));
      svg.append(s("text", { x: 180, y: 145, "font-size": 10, "text-anchor": "middle", style: "fill:#fff" }, "latent 512 + RoPE 64"));
      svg.append(s("text", { x: 4, y: 166, "font-size": 9 }, "cached: only the latent; per-head K,V are rebuilt by up-projection"));
    } else {
      kv.forEach((k, n) => {
        k.of.forEach(i => svg.append(s("line", { x1: qx(i) + 15, y1: 34, x2: k.x + k.w / 2, y2: 110, stroke: "var(--line)", "stroke-width": 1.5 })));
        svg.append(s("rect", { x: k.x, y: 110, width: k.w, height: 26, rx: 4, fill: "var(--c2)" }));
        svg.append(s("text", { x: k.x + k.w / 2, y: 127, "font-size": 10, "text-anchor": "middle", style: "fill:#fff" }, "KV" + (n + 1)));
      });
      svg.append(s("text", { x: 4, y: 160, "font-size": 9 }, `cached per token per layer: ${kv.length} K + ${kv.length} V vectors`));
    }
    holder.replaceChildren(svg);
    cap.textContent = `Cache per token per layer: ${cost[mode].toLocaleString()} numbers (MHA ${cost.mha.toLocaleString()}), ${(cost.mha / cost[mode]).toFixed(1)}× smaller than MHA. ${mode === "mla" ? " With DeepSeek-V2's 128 heads the saving over MHA is about 57×." : ""} Every line still grows with T.`;
  }
  box.append(h("div", { class: "vizctl" }, seg(modes, v.mode, draw)), holder, cap);
  draw(v.mode);
  return box;
}

/* ---------- positions ---------- */
function posViz(v) {
  const box = h("div"), holder = h("div"), cap = h("p", { class: "vizcap" });
  if (v.scheme === "learned") {
    let L = 12;
    const draw = () => {
      const N = 16, cs = 18, svg = s("svg", { viewBox: `0 0 ${N * cs + 70} 120`, width: N * cs + 70 });
      for (let t = 0; t < N; t++) {
        const trained = t < 8, used = t < L;
        svg.append(s("rect", { x: 60 + t * cs, y: 20, width: cs - 2, height: 40, rx: 2, fill: trained ? "var(--c1)" : "var(--cell)", stroke: used && !trained ? "var(--poor)" : "none", "stroke-width": 2 }));
        svg.append(s("text", { x: 60 + t * cs + cs / 2 - 1, y: 74, "font-size": 9, "text-anchor": "middle" }, t));
      }
      svg.append(s("text", { x: 0, y: 44, "font-size": 10 }, "table row"));
      svg.append(s("line", { x1: 60 + L * cs - 1, y1: 10, x2: 60 + L * cs - 1, y2: 88, stroke: "var(--ink)", "stroke-dasharray": "4 3" }));
      svg.append(s("text", { x: 60 + L * cs - 4, y: 100, "font-size": 10, "text-anchor": "end" }, "inference length"));
      holder.replaceChildren(svg);
      cap.textContent = L <= 8 ? "Every position used at inference has a trained row." : `Positions 8-${L - 1} use rows that were never updated in training (red outline). Past the table size there is no row at all.`;
    };
    box.append(h("div", { class: "vizctl" }, slider("inference length", 4, 16, 1, L, x => { L = x; draw(); })), holder, cap); draw();
  } else if (v.scheme === "sinusoidal") {
    const T = 48, D = 32, cw = 6, ch = 4, svg = s("svg", { viewBox: `0 0 ${D * cw + 50} ${T * ch + 30}`, width: D * cw + 50 });
    for (let t = 0; t < T; t++) for (let d = 0; d < D; d++) {
      const i = Math.floor(d / 2), ang = t / Math.pow(10000, (2 * i) / D), val = d % 2 ? Math.cos(ang) : Math.sin(ang);
      svg.append(s("rect", { x: 40 + d * cw, y: 10 + t * ch, width: cw, height: ch, fill: val > 0 ? "var(--c1)" : "var(--c2)", opacity: Math.abs(val).toFixed(2) }));
    }
    svg.append(s("text", { x: 40, y: 8, "font-size": 9 }, "dimension → (fast … slow)"));
    svg.append(s("text", { x: 0, y: 20, "font-size": 9 }, "pos 0"));
    svg.append(s("text", { x: 0, y: T * ch + 6, "font-size": 9 }, "pos 47"));
    holder.append(svg);
    cap.textContent = "Each column is a sinusoid of a different wavelength. Left columns cycle fast, right columns barely move in 48 positions, which is why far positions in slow dimensions are values the model has never seen.";
    box.append(holder, cap);
  } else if (v.scheme === "relative") {
    let k = 3;
    const draw = () => {
      const N = 10, cs = 22, svg = s("svg", { viewBox: `0 0 ${N * cs + 20} ${N * cs + 20}`, width: N * cs + 20 });
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
        const d = Math.max(-k, Math.min(k, j - i));
        svg.append(s("rect", { x: 10 + j * cs, y: 10 + i * cs, width: cs - 2, height: cs - 2, rx: 2, fill: d < 0 ? "var(--c1)" : d > 0 ? "var(--c2)" : "var(--c3)", opacity: (0.25 + 0.75 * Math.abs(d) / k).toFixed(2) }));
        svg.append(s("text", { x: 10 + j * cs + cs / 2 - 1, y: 10 + i * cs + cs / 2 + 3, "font-size": 8, "text-anchor": "middle" }, d));
      }
      holder.replaceChildren(svg);
      cap.textContent = `Each cell uses the learned vector for clip(j−i, ±${k}). Every diagonal shares one vector, so the relation is the same anywhere; distances beyond ${k} all look alike.`;
    };
    box.append(h("div", { class: "vizctl" }, slider("clip k", 1, 6, 1, k, x => { k = x; draw(); })), holder, cap); draw();
  }
  return box;
}

/* ---------- RoPE ---------- */
function ropeViz() {
  const box = h("div"), holder = h("div"), cap = h("p", { class: "vizcap" });
  let i = 8, j = 2; const theta = 0.35;
  const draw = () => {
    const W = 330, H = 170, svg = s("svg", { viewBox: `0 0 ${W} ${H}`, width: W });
    const cx = 85, cy = 85, R = 66;
    svg.append(s("circle", { cx, cy, r: R, fill: "none", stroke: "var(--line)" }));
    const arrow = (ang, col, lab) => {
      const x = cx + R * Math.cos(ang), y = cy - R * Math.sin(ang);
      svg.append(s("line", { x1: cx, y1: cy, x2: x, y2: y, stroke: col, "stroke-width": 3, "stroke-linecap": "round" }));
      svg.append(s("text", { x: cx + (R + 12) * Math.cos(ang), y: cy - (R + 12) * Math.sin(ang) + 4, "font-size": 11, "text-anchor": "middle", style: `fill:${col}` }, lab));
    };
    arrow(i * theta, "var(--c1)", `q@${i}`); arrow(j * theta, "var(--c2)", `k@${j}`);
    const rel = (i - j) * theta, score = Math.cos(rel);
    svg.append(s("text", { x: 180, y: 50, "font-size": 12 }, `query at ${i}, key at ${j}`));
    svg.append(s("text", { x: 180, y: 72, "font-size": 12 }, `gap i−j = ${i - j}`));
    svg.append(s("text", { x: 180, y: 94, "font-size": 12 }, `angle between = ${(((rel % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) * 180 / Math.PI).toFixed(0)}°`));
    svg.append(s("text", { x: 180, y: 116, "font-size": 12 }, `score ∝ cos = ${score.toFixed(3)}`));
    holder.replaceChildren(svg);
    cap.textContent = "Shift both tokens: the arrows rotate together, the angle between them and the score stay fixed. Only the gap matters.";
  };
  box.append(h("div", { class: "vizctl" },
    slider("query pos", 0, 30, 1, i, x => { i = x; draw(); }),
    slider("key pos", 0, 30, 1, j, x => { j = x; draw(); }),
    h("button", { class: "chip", onclick: () => { i = Math.min(i + 5, 60); j = Math.min(j + 5, 60); draw(); } }, "shift both +5")), holder, cap);
  draw();
  return box;
}

/* ---------- ALiBi ---------- */
function alibiViz() {
  const box = h("div"), holder = h("div"), cap = h("p", { class: "vizcap" });
  const N = 12, slopes = [1 / 2, 1 / 8, 1 / 32, 1 / 128];
  let hd = 1;
  const draw = () => {
    const m = slopes[hd], cs = 16, svg = s("svg", { viewBox: `0 0 ${N * cs + 10} ${N * cs + 10}`, width: N * cs + 10 });
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const bias = j > i ? null : -m * (i - j);
      const op = bias === null ? 1 : Math.exp(bias);
      svg.append(s("rect", { x: 5 + j * cs, y: 5 + i * cs, width: cs - 2, height: cs - 2, rx: 2, fill: bias === null ? "var(--cell)" : "var(--c1)", opacity: bias === null ? 1 : op.toFixed(2) }));
    }
    holder.replaceChildren(svg);
    cap.textContent = `Head slope m = 1/${1 / m}. Shading is exp(bias): how much a key at distance d is down-weighted before content is even considered. At d = 100 this head multiplies weight by ${Math.exp(-m * 100).toExponential(1)}.`;
  };
  box.append(h("div", { class: "vizctl" }, seg(slopes.map((m, k) => [k, `m=1/${1 / m}`]), hd, k => { hd = k; draw(); })), holder, cap);
  draw();
  return box;
}

/* ---------- RoPE frequency scaling: none / PI / NTK / YaRN / DroPE ---------- */
function freqViz(v) {
  const box = h("div"), holder = h("div"), cap = h("p", { class: "vizcap" });
  const d = 128, base = 10000, L = 4096;
  let scheme = v.scheme, sc = 8;
  const thetas = Array.from({ length: d / 2 }, (_, i) => Math.pow(base, (-2 * i) / d));
  function scaled(sch) {
    if (sch === "none") return thetas.slice();
    if (sch === "pi") return thetas.map(t => t / sc);
    if (sch === "ntk") { const b2 = base * Math.pow(sc, d / (d - 2)); return thetas.map((_, i) => Math.pow(b2, (-2 * i) / d)); }
    if (sch === "yarn") {
      const alpha = 1, beta = 32;
      return thetas.map(t => { const r = L / (2 * Math.PI / t); const g = r < alpha ? 0 : r > beta ? 1 : (r - alpha) / (beta - alpha); return (1 - g) * (t / sc) + g * t; });
    }
    return thetas.map(() => 0);
  }
  const draw = () => {
    const W = 360, H = 150, svg = s("svg", { viewBox: `0 0 ${W} ${H}`, width: W });
    if (scheme === "drope") {
      svg.append(s("text", { x: 10, y: 40, "font-size": 13 }, "No rotation in any dimension after DroPE."));
      svg.append(s("text", { x: 10, y: 62, "font-size": 12 }, "Order is implied only by the causal mask (NoPE)."));
      svg.append(s("text", { x: 10, y: 84, "font-size": 12 }, "Nothing can be out of distribution, and nothing"));
      svg.append(s("text", { x: 10, y: 102, "font-size": 12 }, "tells the model distance: it must have relearned"));
      svg.append(s("text", { x: 10, y: 120, "font-size": 12 }, "that during recalibration."));
      holder.replaceChildren(svg);
      cap.textContent = "DroPE does not rescale frequencies; it removes them, then recalibrates.";
      return;
    }
    const th = scaled(scheme); let ood = 0;
    const bw = (W - 40) / (d / 2), y0 = 20, hgt = 100, lmin = Math.log(1 / 32);
    for (let i = 0; i < d / 2; i++) {
      const ratio = th[i] / thetas[i];
      const seen = L * thetas[i] >= 2 * Math.PI;  // completed at least one full turn in training
      const isOOD = !seen && sc * L * th[i] > L * thetas[i] * 1.0001;
      if (isOOD) ood++;
      const hh = Math.max(2, hgt * (1 - Math.log(ratio) / lmin));
      svg.append(s("rect", { x: 30 + i * bw, y: y0 + hgt - hh, width: bw - 1, height: hh, fill: isOOD ? "var(--poor)" : "var(--c3)" }));
    }
    svg.append(s("text", { x: 2, y: y0 + 6, "font-size": 9 }, "1×"));
    svg.append(s("text", { x: 2, y: y0 + hgt, "font-size": 9 }, "1/32"));
    svg.append(s("text", { x: 30, y: H - 12, "font-size": 9 }, "dimension pair → fast (left) … slow (right)"));
    holder.replaceChildren(svg);
    const local = th[0] / thetas[0];
    cap.textContent = `Bar = how much each frequency is scaled for a ${sc}× stretch of a ${L.toLocaleString()}-token model. Red = that dimension now reaches angles it never saw in training (${ood} of ${d / 2}). Fastest dimension keeps ${(local * 100).toFixed(0)}% of its resolution.`;
  };
  box.append(h("div", { class: "vizctl" },
    seg([["none", "Plain RoPE"], ["pi", "PI"], ["ntk", "NTK"], ["yarn", "YaRN"], ["drope", "DroPE"]], scheme, x => { scheme = x; draw(); }),
    slider("stretch", 1, 32, 1, sc, x => { sc = x; draw(); }, x => x + "×")), holder, cap);
  draw();
  return box;
}

/* ---------- linear attention: state vs cache ---------- */
function stateViz() {
  const box = h("div"), holder = h("div"), cap = h("p", { class: "vizcap" });
  let T = 6;
  const draw = () => {
    const W = 360, H = 130, svg = s("svg", { viewBox: `0 0 ${W} ${H}`, width: W });
    svg.append(s("text", { x: 4, y: 14, "font-size": 11 }, "KV cache (softmax)"));
    const shown = Math.min(T, 24);
    for (let t = 0; t < shown; t++) svg.append(s("rect", { x: 4 + t * 14, y: 22, width: 12, height: 26, rx: 2, fill: "var(--c1)" }));
    if (T > 24) svg.append(s("text", { x: 4 + 24 * 14, y: 40, "font-size": 11 }, "…"));
    svg.append(s("text", { x: 4, y: 74, "font-size": 11 }, "running state S (linear / recurrent)"));
    for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) svg.append(s("rect", { x: 4 + b * 12, y: 82 + a * 11, width: 10, height: 9, rx: 1.5, fill: "var(--c3)", opacity: (0.35 + 0.65 * Math.min(1, T / 40)).toFixed(2) }));
    svg.append(s("text", { x: 70, y: 110, "font-size": 11 }, "4×4: same size after 10 or 10⁶ tokens"));
    holder.replaceChildren(svg);
    cap.textContent = `${T.toLocaleString()} tokens: the cache holds ${T.toLocaleString()} key/value pairs; the state holds 16 numbers, a lossy blend of all of them.`;
  };
  box.append(h("div", { class: "vizctl" }, slider("tokens", 1, 1000, 1, T, x => { T = x; draw(); })), holder, cap);
  draw();
  return box;
}

/* ---------- delta rule (and gated) on one slot: 40 -> 55 ---------- */
function deltaViz(v) {
  const box = h("div"), holder = h("div"), cap = h("p", { class: "vizcap" });
  let beta = 1, alpha = v.gated ? 0.9 : 1;
  const old = 40, target = 55;
  const draw = () => {
    const decayed = alpha * old;
    const add = decayed + target;
    const delta = decayed + beta * (target - decayed);
    const W = 360, H = 120, svg = s("svg", { viewBox: `0 0 ${W} ${H}`, width: W });
    const scale = x => (x / 100) * 250;
    const row = (y, label, val, col) => {
      svg.append(s("text", { x: 4, y: y + 13, "font-size": 11 }, label));
      svg.append(s("rect", { x: 100, y, width: scale(Math.min(val, 110)), height: 18, rx: 3, fill: col }));
      svg.append(s("text", { x: 104 + scale(Math.min(val, 110)), y: y + 13, "font-size": 11 }, val.toFixed(1)));
    };
    row(8, v.gated ? "after gate α" : "memory says", decayed, "var(--c4)");
    row(36, "add-only write", add, "var(--poor)");
    row(64, "delta write", delta, "var(--c3)");
    svg.append(s("line", { x1: 100 + scale(target), y1: 2, x2: 100 + scale(target), y2: 90, stroke: "var(--ink)", "stroke-dasharray": "3 3" }));
    svg.append(s("text", { x: 100 + scale(target) + 3, y: 104, "font-size": 10 }, "wanted 55"));
    holder.replaceChildren(svg);
    cap.textContent = v.gated
      ? `Gate α=${alpha.toFixed(2)} first fades the whole memory (forgetting), then the delta write with β=${beta.toFixed(2)} moves this slot toward 55: ${decayed.toFixed(1)} + ${beta.toFixed(2)}×(55 − ${decayed.toFixed(1)}) = ${delta.toFixed(1)}.`
      : `Read 40, compute the error 55 − 40 = 15, write β×15. With β=${beta.toFixed(2)} the slot becomes ${delta.toFixed(1)}; add-only gives ${add.toFixed(0)}.`;
  };
  const ctl = h("div", { class: "vizctl" });
  if (v.gated) ctl.append(slider("α (keep)", 0, 1, 0.05, alpha, x => { alpha = x; draw(); }, x => (+x).toFixed(2)));
  ctl.append(slider("β (write strength)", 0, 1, 0.05, beta, x => { beta = x; draw(); }, x => (+x).toFixed(2)));
  box.append(ctl, holder, cap);
  draw();
  return box;
}

/* ---------- depth schedule ---------- */
function scheduleViz() {
  const box = h("div"), holder = h("div"), cap = h("p", { class: "vizcap" });
  const opts = [["1", "1:1"], ["3", "3:1 (Qwen3-Next, class V4)"], ["7", "7:1"], ["0", "all softmax"]];
  const draw = r => {
    r = +r; const L = 16, W = 360, svg = s("svg", { viewBox: `0 0 ${W} 70`, width: W });
    let g = 0;
    for (let l = 0; l < L; l++) {
      const isG = r === 0 ? true : (l % (r + 1)) === r; if (isG) g++;
      svg.append(s("rect", { x: 4 + l * 22, y: 10, width: 19, height: 30, rx: 3, fill: isG ? "var(--c1)" : "var(--c3)" }));
      svg.append(s("text", { x: 4 + l * 22 + 9.5, y: 30, "font-size": 11, "text-anchor": "middle", style: "fill:#fff" }, isG ? "G" : "D"));
    }
    svg.append(s("text", { x: 4, y: 60, "font-size": 10 }, "D = Gated DeltaNet (fixed state)   G = softmax attention (KV cache)"));
    holder.replaceChildren(svg);
    cap.textContent = `${g} of ${L} layers carry a KV cache: ${(g / L * 100).toFixed(0)}% of an all-softmax model's cache, and an exact look at old tokens every ${r === 0 ? 1 : r + 1} layers.`;
  };
  box.append(h("div", { class: "vizctl" }, seg(opts, "3", draw)), holder, cap);
  draw("3");
  return box;
}

function buildViz(v) {
  switch (v.type) {
    case "mask": return maskViz(v);
    case "heads": return headsViz(v);
    case "pos": return posViz(v);
    case "rope": return ropeViz(v);
    case "alibi": return alibiViz(v);
    case "freq": return freqViz(v);
    case "state": return stateViz(v);
    case "delta": return deltaViz(v);
    case "schedule": return scheduleViz(v);
  }
  return h("div");
}
