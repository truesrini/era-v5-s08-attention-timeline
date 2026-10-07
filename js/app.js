/* Page wiring: standard-attention demo, bills calculator, timeline charts, cards, tables. */
const fmtDate = d => { const [y, m, dd] = d.split("-"); const mo = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m - 1]; return dd ? `${+dd} ${mo} ${y}` : `${mo} ${y}`; };
const yearFrac = d => { const [y, m, dd] = d.split("-").map(Number); return y + ((m || 1) - 1) / 12 + ((dd || 1) - 1) / 365; };
const PHASE = Object.fromEntries(PHASES.map(p => [p.id, p]));
const BY_ID = Object.fromEntries(MECHS.map(m => [m.id, m]));
const SHORT = { additive: "Bahdanau", learnedpos: "Learned pos.", sdpa: "Attention", sinusoidal: "Sinusoidal", relpos: "Relative pos.", txl: "Transformer-XL", sparse: "Sparse Tr.", mqa: "MQA", topk: "Top-k", swa: "Sliding window", linear: "Linear attn", delta: "DeltaNet", rope: "RoPE", alibi: "ALiBi", flash: "FlashAttention", gqa: "GQA", pi: "PI", ntk: "NTK-aware", yarn: "YaRN", sinks: "Sinks", mamba: "Mamba", mla: "MLA", gdn: "Gated DeltaNet", nsa: "NSA", gated: "Gated attn", hybrid: "Qwen3-Next hybrid", dsa: "DSA", kda: "Kimi KDA", drope: "DroPE", csa: "CSA + HCA" };
/* invention -> first big shipped use, all sourced on the cards */
const ADOPT = [
  ["mqa", "2022-04", "PaLM"], ["rope", "2022-04", "PaLM"], ["gqa", "2023-07", "Llama 2"], ["swa", "2023-10-10", "Mistral 7B"],
  ["delta", "2024-06-10", "parallel DeltaNet"], ["linear", "2025-09", "Qwen3-Next"], ["topk", "2025-09-29", "DSA"], ["mla", "2025-10-30", "Kimi Linear"], ["yarn", "2026-04-24", "DeepSeek-V4"],
];

/* ---------------- 1. standard attention demo ---------------- */
(function sdpaDemo() {
  const toks = ["The", "cat", "sat", "on", "the", "mat"];
  const X = [[1, 0, 1, 0], [0, 2, 0, 1], [1, 1, 0, 2], [0, 0, 1, 1], [1, 0, 1, 0], [2, 1, 0, 0]]; // "The" and "the" share a vector on purpose
  const Wq = [[1, 0, 1, 0], [0, 1, 0, 1], [1, 1, 0, 0], [0, 0, 1, 1]];
  const Wk = [[0, 1, 0, 1], [1, 0, 1, 0], [0, 1, 1, 0], [1, 0, 0, 1]];
  const Wv = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]].map((r, i) => r.map((x, j) => x + (i === j ? 0 : 0.5 * ((i + j) % 2))));
  const mm = (A, B) => A.map(r => B[0].map((_, j) => r.reduce((s, a, k) => s + a * B[k][j], 0)));
  const T = M => M[0].map((_, j) => M.map(r => r[j]));
  const Q = mm(X, Wq), K = mm(X, Wk), V = mm(X, Wv);
  const steps = ["Q, K, V", "Scores QKᵀ", "Scale ÷√dₖ", "Causal mask", "Softmax", "Weighted sum"];
  let step = 0, qi = 2;
  const stepsBox = document.getElementById("sdpaSteps"), body = document.getElementById("sdpaBody"), ex = document.getElementById("sdpaExplain");
  const sel = document.getElementById("sdpaQuery"), maskC = document.getElementById("sdpaMask"), scaleC = document.getElementById("sdpaScale"), tempR = document.getElementById("sdpaTemp"), tempV = document.getElementById("sdpaTempV");
  toks.forEach((t, i) => sel.append(h("option", { value: i }, `${i} · ${t}`))); sel.value = qi;
  steps.forEach((name, i) => { const b = h("button", { role: "tab" }, `${i + 1}. ${name}`); b.onclick = () => { step = i; render(); }; stepsBox.append(b); });
  [sel, maskC, scaleC, tempR].forEach(e => e.addEventListener("input", () => { qi = +sel.value; render(); }));

  function heat(v, lo, hi) { const t = hi === lo ? 0.5 : (v - lo) / (hi - lo); return `background: color-mix(in srgb, var(--c1) ${Math.round(8 + 72 * t)}%, var(--surface))`; }
  function table(title, M, rowL, colL, opts = {}) {
    const flat = M.flat().filter(Number.isFinite), lo = Math.min(...flat), hi = Math.max(...flat);
    const t = h("table", { class: "mat" });
    t.append(h("tr", {}, h("th"), colL.map(c => h("th", {}, c))));
    M.forEach((r, i) => t.append(h("tr", { class: opts.sel === i ? "sel" : "" }, h("th", {}, rowL[i]), r.map(v => Number.isFinite(v) ? h("td", { style: heat(v, lo, hi) + (opts.sel === i ? ";outline:2px solid var(--accent)" : "") }, v.toFixed(opts.dp ?? 2)) : h("td", { class: "neg-inf" }, "−∞")))));
    return h("div", { class: "matbox" }, h("h4", {}, title), t);
  }
  function render() {
    [...stepsBox.children].forEach((b, i) => b.classList.toggle("on", i === step));
    tempV.textContent = (+tempR.value).toFixed(2);
    const dk = 4, temp = +tempR.value;
    const S = mm(Q, T(K));
    const Ss = S.map(r => r.map(v => scaleC.checked ? v / Math.sqrt(dk) : v));
    const Sm = Ss.map((r, i) => r.map((v, j) => maskC.checked && j > i ? -Infinity : v));
    const P = Sm.map(r => { const z = r.map(v => v / temp), m = Math.max(...z), e = z.map(v => Number.isFinite(v) ? Math.exp(v - m) : 0), s = e.reduce((a, b) => a + b, 0); return e.map(v => v / s); });
    const O = mm(P, V);
    const tl = toks.map((t, i) => `${i} ${t}`), dl = ["d0", "d1", "d2", "d3"];
    body.replaceChildren();
    if (step === 0) {
      body.append(table("Embeddings X", X, tl, dl, { sel: qi, dp: 0 }), table("Q = X·Wq", Q, tl, dl, { sel: qi, dp: 0 }), table("K = X·Wk", K, tl, dl, { dp: 0 }), table("V = X·Wv", V, tl, dl, { dp: 1 }));
      ex.textContent = "Three projections of the same vector. Rows 0 and 4 ('The' and 'the') are identical, so their keys are identical too: attention alone cannot tell which came first.";
    } else if (step === 1) {
      body.append(table("Scores Q·Kᵀ (rows = queries, cols = keys)", S, tl, tl, { sel: qi, dp: 1 }));
      ex.textContent = `36 dot products for 6 tokens. The highlighted row is the query '${toks[qi]}' compared against every key. At 100,000 tokens this grid has 10 billion cells per head per layer.`;
    } else if (step === 2) {
      body.append(table(scaleC.checked ? "Scaled scores ÷ √4 = ÷2" : "Unscaled (scaling switched off)", Ss, tl, tl, { sel: qi }));
      ex.textContent = "Dot products grow with dₖ. Dividing by √dₖ keeps softmax out of its saturated, near one-hot region, where gradients vanish.";
    } else if (step === 3) {
      body.append(table(maskC.checked ? "Masked: future set to −∞" : "No mask: the future is visible", Sm, tl, tl, { sel: qi }));
      ex.textContent = maskC.checked ? "Everything above the diagonal is the future. Setting it to −∞ before softmax gives it exactly zero weight, which is what lets a decoder train on a whole sequence in parallel." : "With the mask off, the query can read tokens that have not been generated yet. Training would teach it to cheat.";
    } else if (step === 4) {
      body.append(table(`Softmax over each row (temperature ${temp.toFixed(2)})`, P, tl, tl, { sel: qi }));
      const row = P[qi], leak = row.slice(qi + 1).reduce((a, b) => a + b, 0);
      ex.textContent = `Each row now sums to 1. Every weight depends on every score in its row through the shared denominator, which is why exact softmax cannot be folded into a fixed state. ${maskC.checked ? "" : `Weight leaking into the future for '${toks[qi]}': ${(leak * 100).toFixed(0)}%.`}`;
    } else {
      const w = P[qi];
      const bars = h("div", { class: "matbox" }, h("h4", {}, `Weights for query '${toks[qi]}'`),
        ...w.map((x, j) => h("div", { style: "display:flex;align-items:center;gap:8px;font-size:12px;margin:2px 0" }, h("span", { style: "width:48px" }, `${j} ${toks[j]}`), h("div", { class: "bar", style: `width:${Math.max(2, x * 160)}px;${j > qi ? "background:var(--poor)" : ""}` }), h("span", { class: "outvec" }, x.toFixed(2)))));
      body.append(bars, table("V (values)", V, tl, dl, { dp: 1 }), h("div", { class: "matbox" }, h("h4", {}, "Output = Σ weight × value"), h("p", { class: "outvec" }, "[" + O[qi].map(v => v.toFixed(2)).join(", ") + "]")));
      ex.textContent = "One new vector for this token: a blend of the values it chose to look at. Every layer, every head, every token repeats this.";
    }
  }
  render();
})();

/* ---------------- 2. bills ---------------- */
(function bills() {
  const L = 48, D = 128, B = 2;
  const rows = [
    ["MHA, 32 KV heads", "baseline", T => 2 * L * 32 * D * T * B],
    ["GQA, 8 KV heads (class yardstick)", "kv_heads ÷4", T => 2 * L * 8 * D * T * B],
    ["MQA, 1 KV head", "kv_heads ÷32", T => 2 * L * 1 * D * T * B],
    ["MLA latent 512 + 64 RoPE", "K,V → one latent", T => L * 576 * T * B],
    ["Hybrid 3:1, GQA-8 in 12 of 48 layers", "layers that cache ÷4", T => 2 * 12 * 8 * D * T * B],
    ["Sliding window 4,096 (GQA-8)", "T capped at w", T => 2 * L * 8 * D * Math.min(T, 4096) * B],
    ["Compress every 4 tokens (CSA-style)", "T ÷4", T => 2 * L * 8 * D * Math.ceil(T / 4) * B],
    ["Compress every 128 tokens (HCA-style)", "T ÷128", T => 2 * L * 8 * D * Math.ceil(T / 128) * B],
    ["Fixed state only (linear / DeltaNet)", "no T at all", () => L * 8 * D * D * B],
  ];
  const tR = document.getElementById("billT"), bR = document.getElementById("billB");
  const fmtB = b => b >= 1e12 ? (b / 1e12).toFixed(2) + " TB" : b >= 1e9 ? (b / 1e9).toFixed(2) + " GB" : b >= 1e6 ? (b / 1e6).toFixed(1) + " MB" : (b / 1e3).toFixed(0) + " KB";
  function render() {
    const T = Math.round(Math.pow(2, +tR.value)), users = Math.pow(2, +bR.value);
    document.getElementById("billTV").textContent = T >= 1e6 ? (T / 1048576).toFixed(T % 1048576 ? 2 : 0) + "M tokens" : Math.round(T / 1024) + "K tokens";
    document.getElementById("billBV").textContent = users;
    const vals = rows.map(r => r[2](T) * users), max = Math.max(...vals);
    const t = h("table", { class: "btable" }, h("tr", {}, h("th", {}, "Mechanism"), h("th", {}, "Factor it cuts"), h("th", {}, "Cache"), h("th", { style: "width:34%" }, "Relative size (red: over 80 GB)")));
    rows.forEach((r, i) => {
      const v = vals[i], frac = Math.min(1, v / max);
      t.append(h("tr", {}, h("td", {}, r[0]), h("td", { class: "factor" }, r[1]), h("td", { class: "num" }, fmtB(v)),
        h("td", {}, h("div", { class: "bar " + (v > 80e9 ? "over" : "ok"), style: `width:${Math.max(1, frac * 100)}%` }))));
    });
    document.getElementById("billTable").replaceChildren(t);
    const pairs = T * T;
    document.getElementById("billCompute").innerHTML = `Compute bill at this length: <b>${pairs.toExponential(2)}</b> query-key scores per head per layer for one full pass (T²). Doubling the context quadruples it; the cache rows above only double. Red bars no longer fit on one 80 GB accelerator even before the weights are loaded.`;
  }
  [tR, bR].forEach(e => e.addEventListener("input", render));
  render();
})();

/* ---------------- 3. swimlane ---------------- */
(function swim() {
  const W = 1000, laneH = 96, top = 30, left = 150, right = 16, H = top + BILLS.length * laneH + 30;
  // piecewise-linear time axis: 2014-2017 compressed, 2023-2026 stretched (stated under the chart)
  const KX = [[2014, 0], [2017, 0.08], [2019, 0.2], [2023, 0.48], [2026.9, 1]];
  const X = y => { for (let i = 1; i < KX.length; i++) if (y <= KX[i][0]) { const [a, fa] = KX[i - 1], [b, fb] = KX[i]; return left + (fa + (y - a) / (b - a) * (fb - fa)) * (W - left - right); } return W - right; };
  const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, width: W, role: "img", "aria-label": "Timeline of attention mechanisms by bill" });
  PHASES.forEach((p, i) => {
    const a = yearFrac(p.from), b = yearFrac(p.to);
    svg.append(s("rect", { x: X(a), y: top - 6, width: X(b) - X(a), height: BILLS.length * laneH + 6, fill: p.color }));
    svg.append(s("circle", { cx: (X(a) + X(b)) / 2, cy: top - 16, r: 9, fill: p.color, stroke: "var(--muted)" }));
    svg.append(s("text", { x: (X(a) + X(b)) / 2, y: top - 12, "font-size": 11, "font-weight": 700, "text-anchor": "middle" }, i + 1));
  });
  BILLS.forEach((b, i) => {
    const y = top + i * laneH;
    svg.append(s("line", { x1: left, y1: y + laneH, x2: W - right, y2: y + laneH, stroke: "var(--line)" }));
    svg.append(s("text", { x: 6, y: y + laneH / 2 + 4, "font-size": 12, "font-weight": 600 }, b.label));
  });
  for (let y = 2014; y <= 2026; y++) {
    if (y > 2014 && y < 2017) continue;
    svg.append(s("line", { x1: X(y), y1: top + BILLS.length * laneH, x2: X(y), y2: top + BILLS.length * laneH + 5, stroke: "var(--muted)" }));
    svg.append(s("text", { x: X(y), y: H - 10, "font-size": 11, "text-anchor": "middle" }, y));
  }
  const laneMid = Object.fromEntries(BILLS.map((b, i) => [b.id, top + i * laneH + laneH / 2]));
  const pos = {}, boxes = [], dots = [];
  const hit = (a) => boxes.some(b => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y);
  MECHS.forEach(m => {
    const lane = m.bills[0], x = X(yearFrac(m.date));
    let y = laneMid[lane];
    for (const off of [0, -22, 22, -38, 38, -11, 11]) { const yy = laneMid[lane] + off; if (!dots.some(d => Math.abs(d.x - x) < 14 && Math.abs(d.y - yy) < 14)) { y = yy; break; } }
    dots.push({ x, y }); boxes.push({ x: x - 7, y: y - 7, w: 14, h: 14 });
    pos[m.id] = { x, y };
  });
  ADOPT.forEach(([id, d, label]) => {
    const p = pos[id]; const xa = X(yearFrac(d));
    svg.append(s("path", { d: `M ${p.x} ${p.y} Q ${(p.x + xa) / 2} ${p.y - 30} ${xa} ${p.y}`, fill: "none", stroke: "var(--muted)", "stroke-dasharray": "4 3", "stroke-width": 1.3 }, s("title", {}, `${SHORT[id]} → ${label}`)));
    svg.append(s("rect", { x: xa - 4, y: p.y - 4, width: 8, height: 8, transform: `rotate(45 ${xa} ${p.y})`, fill: "var(--surface)", stroke: "var(--muted)" }, s("title", {}, `${SHORT[id]} shipped in ${label}`)));
  });
  MECHS.forEach(m => {
    const p = pos[m.id], label = SHORT[m.id], w = label.length * 5.6 + 2, hgt = 11;
    let lb = null;
    for (const [dx, dy] of [[9, -6], [9, 14], [-9 - w, -6], [-9 - w, 14], [-w / 2, -12], [-w / 2, 22], [9, 26], [9, -18]]) {
      const b = { x: p.x + dx, y: p.y + dy - 9, w, h: hgt };
      if (!hit(b) && b.x > left - 2 && b.x + b.w < W) { lb = b; break; }
    }
    if (!lb) lb = { x: p.x + 9, y: p.y - 15, w, h: hgt };
    boxes.push(lb);
    const g = s("g", { class: "dot", tabindex: 0 });
    g.append(s("title", {}, `${m.dateLabel || fmtDate(m.date)} · ${m.name}`));
    g.append(s("circle", { cx: p.x, cy: p.y, r: 6.5, fill: m.extra ? "var(--c2)" : "var(--c1)", stroke: "var(--surface)", "stroke-width": 2 }));
    g.append(s("text", { x: lb.x, y: lb.y + 9, "font-size": 10 }, label));
    const go = () => document.getElementById("m-" + m.id).scrollIntoView({ behavior: "smooth" });
    g.addEventListener("click", go); g.addEventListener("keydown", e => { if (e.key === "Enter") go(); });
    svg.append(g);
  });
  document.getElementById("swimChart").append(svg,
    h("div", { class: "legend", style: "margin-top:8px" }, h("span", {}, h("i", { style: "background:var(--c1);border-radius:50%" }), "in the class list"), h("span", {}, h("i", { style: "background:var(--c2);border-radius:50%" }), "added (not covered in class)"), h("span", {}, "- - -◇ published → shipped in a major model"), h("span", {}, "Time axis: 2014-2017 compressed, 2023 onward stretched, so the crowded years stay readable.")));
  document.getElementById("phaseLegend").append(...PHASES.map((p, i) => h("div", { style: `background:${p.color}` }, h("b", {}, `${i + 1} · ${p.label}`), p.blurb)));
})();

/* taught vs launched */
(function cross() {
  const items = TAUGHT_ORDER.map(([id, label], i) => ({ id, label, taught: i, date: BY_ID[id].date }));
  const chron = items.slice().sort((a, b) => a.date.localeCompare(b.date));
  chron.forEach((it, i) => (it.launched = i));
  const W = 700, rowH = 30, H = items.length * rowH + 40, lx = 200, rx = 480;
  const svg = s("svg", { viewBox: `0 0 ${W} ${H}` });
  svg.append(s("text", { x: lx, y: 16, "font-size": 12, "font-weight": 700, "text-anchor": "end" }, "Order taught in Session 8"));
  svg.append(s("text", { x: rx, y: 16, "font-size": 12, "font-weight": 700 }, "Order launched"));
  items.forEach(it => {
    const y1 = 36 + it.taught * rowH, y2 = 36 + it.launched * rowH, moved = Math.abs(it.taught - it.launched);
    svg.append(s("path", { d: `M ${lx + 8} ${y1} C ${(lx + rx) / 2} ${y1}, ${(lx + rx) / 2} ${y2}, ${rx - 8} ${y2}`, fill: "none", stroke: moved >= 3 ? "var(--c2)" : "var(--c1)", "stroke-width": moved >= 3 ? 2.5 : 1.5, opacity: .85 }));
    svg.append(s("text", { x: lx, y: y1 + 4, "font-size": 12, "text-anchor": "end" }, `${it.taught + 1}. ${it.label}`));
    svg.append(s("text", { x: rx, y: y2 + 4, "font-size": 12 }, `${fmtDate(it.date)} · ${it.label}`));
  });
  document.getElementById("crossChart").append(svg);
})();

/* ---------------- 4. cards + filters ---------------- */
const state = { wl: null, bills: new Set(), scope: "all" };
(function cards() {
  const host = document.getElementById("cards");
  let lastYear = null;
  MECHS.forEach(m => {
    const y = m.date.slice(0, 4);
    if (y !== lastYear) { host.append(h("div", { class: "year-mark", "data-year": y }, y)); lastYear = y; }
    const ph = PHASE[m.phase];
    const vd = h("div", { class: "verdicts" }, WORKLOADS.map(w => { const [c, t] = m.verdict[w.id]; return h("div", { class: `vd ${c}`, "data-wl": w.id }, h("b", {}, w.label), t); }));
    const viz = h("div", { class: "vizbox" }, buildViz(m.viz));
    const card = h("article", { class: "mcard", id: "m-" + m.id, style: `border-left-color:${m.extra ? "var(--c2)" : "var(--c1)"}`, "data-id": m.id },
      h("div", { class: "mhead" },
        h("span", { class: "mdate" }, m.dateLabel || fmtDate(m.date)),
        h("h3", { class: "mname" }, m.name),
        m.extra ? h("span", { class: "tag-new" }, "Added") : null,
        h("span", { class: "phasechip", style: `background:${ph.color}` }, ph.label),
        h("span", { class: "billtags" }, "attacks: " + m.bills.map(b => BILLS.find(x => x.id === b).label).join(", "))),
      h("div", { class: "mbody" },
        h("div", {},
          h("span", { class: "lbl" }, "The problem at that moment"), h("p", {}, m.problem),
          h("span", { class: "lbl" }, "The mechanism"), h("p", {}, m.mechanism),
          h("div", { class: "formula" }, m.formula),
          h("div", { class: "pc" },
            h("div", { class: "buys" }, h("span", { class: "lbl" }, "What it buys"), h("ul", {}, m.buys.map(b => h("li", {}, b)))),
            h("div", { class: "costs" }, h("span", { class: "lbl" }, "What it gives up"), h("ul", {}, m.costs.map(b => h("li", {}, b))))),
          h("div", { class: "pick" }, h("b", {}, "When I would pick it: "), m.pick),
          m.note ? h("p", { class: "note" }, m.note) : null),
        h("div", {}, h("span", { class: "lbl" }, "See it"), viz, h("span", { class: "lbl" }, "Verdict by workload"), vd)),
      h("div", { class: "src" }, h("b", {}, "Date source: "), h("a", { href: m.src.url, target: "_blank", rel: "noopener" }, m.src.label),
        m.adopted ? h("span", {}, " · Shipped: ", ...m.adopted.map((a, i) => h("span", {}, i ? "; " : "", h("a", { href: a.url, target: "_blank", rel: "noopener" }, a.label)))) : null));
    host.append(card);
  });

  const wl = document.getElementById("wlChips");
  [{ id: null, label: "All" }, ...WORKLOADS].forEach(w => {
    const b = h("button", { class: "chip" + (w.id === null ? " on" : "") }, w.label);
    b.onclick = () => { state.wl = w.id; [...wl.children].forEach(c => c.classList.remove("on")); b.classList.add("on"); apply(); };
    wl.append(b);
  });
  const bc = document.getElementById("billChips");
  BILLS.forEach(bl => {
    const b = h("button", { class: "chip" }, bl.label);
    b.onclick = () => { state.bills.has(bl.id) ? state.bills.delete(bl.id) : state.bills.add(bl.id); b.classList.toggle("on"); apply(); };
    bc.append(b);
  });
  document.querySelectorAll("[data-scope]").forEach(b => b.addEventListener("click", () => {
    state.scope = b.dataset.scope; document.querySelectorAll("[data-scope]").forEach(x => x.classList.toggle("on", x === b)); apply();
  }));
  function apply() {
    const visibleYears = new Set();
    MECHS.forEach(m => {
      const card = document.getElementById("m-" + m.id);
      const okScope = state.scope === "all" || (state.scope === "class" ? !m.extra : m.extra);
      const okBill = !state.bills.size || m.bills.some(b => state.bills.has(b));
      card.classList.toggle("hidden", !(okScope && okBill));
      if (okScope && okBill) visibleYears.add(m.date.slice(0, 4));
      card.querySelectorAll(".vd").forEach(v => { v.classList.toggle("focus", v.dataset.wl === state.wl); v.classList.toggle("dim", !!state.wl && v.dataset.wl !== state.wl); });
      card.classList.toggle("dimmed", !!state.wl && ["p", "h"].includes(m.verdict[state.wl][0]));
    });
    document.querySelectorAll(".year-mark").forEach(y => (y.style.display = visibleYears.has(y.dataset.year) ? "" : "none"));
  }
})();

/* ---------------- 5. what the timeline shows ---------------- */
(function shows() {
  const yrs = (a, b) => (yearFrac(b) - yearFrac(a)).toFixed(1);
  const lag = [["mqa", "2022-04", "PaLM"], ["swa", "2023-10-10", "Mistral 7B"], ["linear", "2025-09", "Qwen3-Next (as Gated DeltaNet)"], ["delta", "2025-09", "Qwen3-Next (as Gated DeltaNet)"], ["topk", "2025-09-29", "DeepSeek-V3.2-Exp (DSA)"], ["rope", "2022-04", "PaLM"]];
  const rows = lag.map(([id, d, who]) => `<tr><td>${SHORT[id]}</td><td>${fmtDate(BY_ID[id].date)}</td><td>${who}, ${fmtDate(d)}</td><td><b>${yrs(BY_ID[id].date, d)} yrs</b></td></tr>`).join("");
  document.getElementById("showsBody").innerHTML = `
  <p>Sorted by topic, these thirty mechanisms look like a menu. Sorted by date, they look like an argument the field keeps having with itself about which bill to pay. Five things only show up on the calendar.</p>
  <ol>
    <li><b>The field changes its mind, and the order is visible.</b> 2014-2022 is about <i>exactness</i>: attention replaces recurrence, positions get computed instead of stored, and the cheap approximations of 2019-2020 (sparse, local, linear) lose to exact softmax, which is then made faster by FlashAttention rather than replaced. 2022-2023 wants <i>memory back</i>: mass serving makes the KV cache the bill, and MQA then GQA cut the head factor. Mid-2023 wants <i>length</i>: in three months PI (27 Jun), NTK-aware scaling (29 Jun), YaRN (31 Aug) and attention sinks (29 Sep) all attack position. 2024-2025 wants <i>memory back again</i>, harder: MLA, Gated DeltaNet, hybrids, NSA, DSA. And then, with memory affordable, <i>length again</i>: DeepSeek-V4 makes 1M the default and DroPE goes after position from the other side.</li>
    <li><b>Ideas arrive years before their bill does.</b> Almost nothing that ships in 2023-2025 was invented then. The bottleneck was never invention; it was which cost hurt at the time.
      <table class="lagtable"><tr><th>Idea</th><th>Published</th><th>Shipped in</th><th>Lag</th></tr>${rows}</table>
      The delta rule itself is from 1960 (Widrow and Hoff). Linear attention sat on the shelf for five years because, while training FLOPs were the bill, exact attention plus FlashAttention was good enough. It came back when long-context agents made the per-conversation memory bill the one that hurt.</li>
    <li><b>The timeline walks through the cache formula one factor at a time.</b> <code>2 × layers × kv_heads × head_dim × T × bytes</code>. MQA and GQA cut <i>kv_heads</i> (2019, 2023). MLA replaces <i>kv_heads × head_dim</i> with one latent (2024). Hybrids cut <i>layers</i> that cache (2025). Sliding windows, compression and fixed state cut <i>T</i> itself (2020 idea, 2025-2026 practice). The only factor left mostly untouched by this list is <i>bytes</i>, which is a hint about what comes next.</li>
    <li><b>Exact access is never fully given up.</b> Every design that won keeps some exact softmax path: a window, sink tokens, top-k blocks, one layer in four. The designs that removed it entirely (pure linear attention, pure state-space stacks) did not replace attention; they became the cheap majority inside hybrids. The field trades away exactness only in proportion, never completely.</li>
    <li><b>Position went from stored, to computed, to relative, to stretched, to dropped.</b> Learned table (May 2017) → sinusoid (Jun 2017) → relative (2018) → rotation (2021) and bias (2021) → frequency surgery (2023) → removal after training (Dec 2025). Each step gives the model less fixed structure and asks training to supply more.</li>
  </ol>
  <h3>So what comes next?</h3>
  <div class="predict">
    <p><b>My guess, labelled as a guess.</b> The pattern is: a bill becomes binding, the field pulls an old idea off the shelf, then makes the trade-off learned instead of fixed. Fixed ratios are the obvious next target. Today the compression rate (4 and 128 in DeepSeek-V4), the top-k budget (1,024), the window (128) and the layer ratio (3:1) are hand-set numbers. The next step is a model that decides per token and per layer what to keep exactly, what to summarise and what to forget, plus cheaper <i>bytes</i> per entry (low-precision caches). Learned, test-time memory is already appearing (Titans, arXiv 2501.00663, 31 Dec 2024). Position looks likely to keep shrinking toward "none" as memory gets smarter, which is the direction DroPE points.</p>
  </div>`;
})();

/* ---------------- 6. pick table ---------------- */
(function pick() {
  const L = { g: "good", o: "ok", p: "poor", h: "past" };
  const t = h("table", { class: "ptable" }, h("tr", {}, h("th", {}, "Date"), h("th", {}, "Mechanism"), WORKLOADS.map(w => h("th", {}, w.label))));
  MECHS.forEach(m => t.append(h("tr", {}, h("td", { class: "d" }, m.dateLabel || fmtDate(m.date)), h("td", {}, h("a", { href: "#m-" + m.id }, m.name)),
    WORKLOADS.map(w => { const [c, txt] = m.verdict[w.id]; return h("td", { class: "vc", title: txt }, h("span", { class: `v v-${c}` }, L[c])); }))));
  document.getElementById("pickTable").append(t);
})();

/* ---------------- 7. corrections, 8. sources ---------------- */
document.getElementById("corrList").append(...CORRECTIONS.map(c => h("div", { class: "corr" }, h("p", { class: "claim" }, c.claim), h("p", { class: "fact" }, c.fact, " ", h("a", { href: c.url, target: "_blank", rel: "noopener" }, "source")))));
(function sources() {
  const t = h("table", { class: "stable" }, h("tr", {}, h("th", {}, "Date"), h("th", {}, "Mechanism"), h("th", {}, "Primary source"), h("th", {}, "In class list?")));
  MECHS.forEach(m => t.append(h("tr", {}, h("td", { class: "d" }, m.dateLabel || m.date), h("td", {}, m.name), h("td", {}, h("a", { href: m.src.url, target: "_blank", rel: "noopener" }, m.src.label)), h("td", {}, m.extra ? "Added" : "Yes"))));
  document.getElementById("srcTable").append(t);
})();
