/* ─────────────────────────────────────────────────────
   SPATIAL STRATEGY PLAYBOOK — trend evidence, example
   blueprint, generator and mockup
   ───────────────────────────────────────────────────── */

import { indexEvidence, chipLabel, STRENGTH_LABELS } from "./evidence.mjs";

// Generator goal keys → labels for the result header.
const FORM_GOALS = {
  launch: "Launch a new product", community: "Build a local community", trial: "Drive trial and conversion",
  flagship: "Brand flagship and awareness", service: "Service, repair, and loyalty",
};

const $ = (id) => document.getElementById(id);
let evidenceIndex = new Map();

/* ── helpers ── */
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
function extLink(href, text, cls) {
  const a = el("a", cls, text);
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener";
  return a;
}
// Portfolio links stay on this site and open in the same tab.
function sourceLink(url, text, cls) {
  if (/gracechee\.com\/#/.test(url)) {
    const a = el("a", cls, text);
    a.href = "/" + new URL(url).hash;
    return a;
  }
  return extLink(url, text, cls);
}
function host(url) {
  return new URL(url).hostname.replace(/^www\./, "");
}
function track(name, params) {
  if (typeof window.gtag === "function") window.gtag("event", name, params || {});
}
function sizeBucket(n) {
  if (n < 2000) return "under_2k";
  if (n < 10000) return "2k_10k";
  if (n < 50000) return "10k_50k";
  return "50k_plus";
}
function badge(strength) {
  const b = el("span", "pb-badge", STRENGTH_LABELS[strength] || "Directional");
  b.dataset.strength = strength || "directional";
  return b;
}

/* ─────────────────────────────────────────────────────
   LOAD DATA
   ───────────────────────────────────────────────────── */
async function loadJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(url + " " + r.status);
  return r.json();
}

Promise.all([loadJson("/data/case-studies.json"), loadJson("/playbook/example.json")])
  .then(([data, example]) => {
    evidenceIndex = indexEvidence(data);
    renderTrendEvidence(data);
    renderSources(data);
    fillForm(example.input);
    renderStrategy(example.strategy, example.input, { example: true, image: example.image });
  })
  .catch((err) => {
    console.error(err);
    $("out").textContent = "The example blueprint failed to load. Refresh the page.";
  });

/* ─────────────────────────────────────────────────────
   TREND EVIDENCE — each trend lists its cases by id
   ───────────────────────────────────────────────────── */
const KIND_LABELS = {
  proven: "Case study", mine: "My work", research: "Research",
  precedent: "Precedent, no published results", principle: "Design principle",
};
// My work first, then measured cases, then the rest.
const KIND_ORDER = { mine: 0, proven: 1, research: 2, precedent: 3, principle: 4 };

function findEntry(data, id) {
  const lists = [
    ["proven", data.proven_cases], ["mine", data.practitioner_projects], ["research", data.research],
    ["precedent", data.reference_examples], ["principle", data.principles],
  ];
  for (const [kind, list] of lists) {
    const c = (list || []).find((x) => x.id === id);
    if (c) return { kind, c };
  }
  console.warn("No evidence entry for id", id);
  return null;
}

function renderTrendEvidence(data) {
  document.querySelectorAll(".pb-trend[data-evidence]").forEach((trend) => {
    const ids = trend.dataset.evidence.split(/\s+/).filter(Boolean);
    const entries = ids.map((id) => findEntry(data, id)).filter(Boolean)
      .sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]);
    const list = el("ul", "pb-ev__list");
    entries.forEach((entry) => list.appendChild(evidenceRow(entry)));
    trend.querySelector(".pb-ev").appendChild(list);
  });
}

function evidenceRow({ kind, c }) {
  const li = el("li", "pb-ev__row pb-ev__row--" + kind);

  const top = el("p", "pb-ev__kind", KIND_LABELS[kind]);
  const year = c.year || String(c.date || (c.source && c.source.date) || "").slice(0, 4);
  if (year) top.appendChild(el("span", null, year));
  li.appendChild(top);

  let name, what, url, linkText;
  if (kind === "research") {
    name = c.source.publisher;
    what = c.finding;
    url = c.source.url;
    linkText = c.source.publisher;
  } else if (kind === "principle") {
    name = c.rule;
    url = c.url;
    linkText = c.publisher || host(c.url);
  } else if (kind === "precedent") {
    name = c.brand;
    what = c.what;
    url = c.url;
    linkText = host(c.url);
  } else {
    const src = (c.sources || [])[0] || {};
    name = c.brand + " · " + c.project.replace(/\s*\(.*\)$/, "");
    what = c.what_they_did;
    url = src.url;
    linkText = kind === "mine" ? "See the project" : src.publisher || host(url);
  }

  li.appendChild(el("p", "pb-ev__name", name));
  if (what) li.appendChild(el("p", "pb-ev__what", what));

  if (c.results && c.results.length) {
    const dl = el("dl", "pb-ev__results");
    c.results.slice(0, 2).forEach((r) => {
      const row = el("div");
      row.appendChild(el("dt", r.value.length > 32 ? "is-long" : null, r.value));
      const dd = el("dd", null, r.metric + " ");
      dd.appendChild(badge(r.evidence_strength));
      row.appendChild(dd);
      dl.appendChild(row);
    });
    li.appendChild(dl);
  }

  if (url) {
    const foot = el("p", "pb-ev__src");
    foot.appendChild(sourceLink(url, linkText + (kind === "mine" ? " →" : " ↗")));
    const second = kind === "proven" && c.sources[1];
    if (second) {
      foot.appendChild(document.createTextNode(" · "));
      foot.appendChild(extLink(second.url, second.publisher + " ↗"));
    }
    li.appendChild(foot);
  }
  return li;
}

/* ─────────────────────────────────────────────────────
   SOURCES (footer)
   ───────────────────────────────────────────────────── */
function renderSources(data) {
  const seen = new Map();
  const add = (url, title, publisher, date) => {
    if (!url || seen.has(url) || /gracechee\.com/.test(url)) return;
    seen.set(url, { url, title, publisher, date });
  };
  data.proven_cases.forEach((c) => c.sources.forEach((s) => add(s.url, s.title, s.publisher, s.date)));
  data.research.forEach((r) => add(r.source.url, r.source.title, r.source.publisher, r.source.date));
  data.reference_examples.forEach((r) => add(r.url, r.brand + ", " + r.what.split(/[.,]/)[0], host(r.url), r.date));
  data.principles.forEach((p) => add(p.url, p.rule, host(p.url), ""));
  // Extra examples linked in the trend copy.
  document.querySelectorAll(".pb-trend__ex a").forEach((a) => add(a.href, a.dataset.title || a.textContent, host(a.href), ""));

  const list = $("sources-list");
  [...seen.values()].forEach((s) => {
    const li = el("li");
    li.appendChild(extLink(s.url, s.title));
    li.appendChild(el("span", null, [s.publisher, s.date && String(s.date).slice(0, 7)].filter(Boolean).join(", ")));
    list.appendChild(li);
  });
}

/* ─────────────────────────────────────────────────────
   BLUEPRINT RENDER
   ───────────────────────────────────────────────────── */
function citations(ids, evidence) {
  const wrap = el("ul", "pb-cites");
  wrap.setAttribute("aria-label", "Evidence");
  const list = (ids || []).map((id) => (evidence && evidence[id]) || evidenceIndex.get(id)).filter(Boolean);
  if (!list.length) {
    wrap.appendChild(el("li", "pb-cite pb-cite--untested", "Untested idea"));
    return wrap;
  }
  list.forEach((e) => {
    const li = el("li", "pb-cite pb-cite--" + e.kind);
    const a = sourceLink(e.url, chipLabel(e));
    if (e.detail) a.title = e.detail;
    a.addEventListener("click", () => track("playbook_citation_click", { case_id: e.id }));
    li.appendChild(a);
    const measured = e.kind === "proven" || e.kind === "research" || (e.kind === "mine" && e.hasResults);
    if (measured) li.appendChild(badge(e.strength));
    wrap.appendChild(li);
  });
  return wrap;
}

function block(label) {
  const b = el("section", "pb-block");
  b.appendChild(el("h4", "pb-label pb-label--rule", label));
  return b;
}

function renderStrategy(s, input, { example = false, evidence = null, image = null } = {}) {
  const out = $("out");
  out.textContent = "";

  const head = el("div", "pb-out__head");
  head.appendChild(el("span", example ? "pb-stamp" : "pb-stamp pb-stamp--live", example ? "Example" : "Generated · review before sharing"));
  head.appendChild(el("h3", "pb-out__title", s.title || "Store blueprint"));
  head.appendChild(el("p", "pb-label", [input.brand, input.location, (Number(input.size) || 0).toLocaleString("en-US") + " sq ft", FORM_GOALS[input.goal]].filter(Boolean).join(" · ")));
  head.appendChild(el("p", "pb-note", "A first draft built from published case studies. Check sources before reusing figures."));
  out.appendChild(head);

  // Insight, then the concept it leads to, with its render
  const b1 = block(s.store_role ? "Insight · " + s.store_role + " store" : "Insight");
  b1.appendChild(el("p", "pb-out__insight", s.insight || ""));
  out.appendChild(b1);
  markTrend(s.trend);

  const concept = s.concept || {};
  const bc = block("Concept");
  bc.classList.add("pb-concept");
  bc.appendChild(el("h4", "pb-concept__name", concept.name || ""));
  if (concept.idea) bc.appendChild(el("p", "pb-concept__idea", concept.idea));
  bc.appendChild(renderFrame(image, concept.name));
  out.appendChild(bc);

  // Zones
  const zones = (s.zones || []).filter((z) => z && z.name);
  const sqft = Number(input.size) || 0;
  const b3 = block("Zones · entrance to back");
  const list = el("ol", "pb-zones");
  zones.forEach((z, i) => {
    const li = el("li", "pb-zone");
    li.appendChild(el("span", "pb-zone__n", String(i + 1)));

    const body = el("div", "pb-zone__body");
    const h = el("h5", "pb-zone__name", z.name);
    const type = z.type === "story" ? "Storytelling" : z.type === "flow" ? "Flow" : "Useful";
    h.appendChild(el("span", "pb-pill" + (z.type === "story" ? " pb-pill--story" : z.type === "flow" ? " pb-pill--flow" : ""), type));
    body.appendChild(h);
    const area = sqft ? " · about " + (Math.round((sqft * z.share_pct) / 100 / 50) * 50).toLocaleString("en-US") + " sq ft" : "";
    body.appendChild(el("p", "pb-label", z.share_pct + "% of floor" + area));
    body.appendChild(el("p", "pb-zone__feature", z.feature || ""));
    body.appendChild(el("p", "pb-zone__why", z.why || ""));
    const kpi = el("p", "pb-zone__kpi");
    kpi.appendChild(el("span", "pb-label", "Measure "));
    kpi.appendChild(document.createTextNode(z.kpi || ""));
    body.appendChild(kpi);
    body.appendChild(citations(z.evidence_ids, evidence));
    li.appendChild(body);
    list.appendChild(li);
  });
  b3.appendChild(list);
  out.appendChild(b3);

  // KPIs
  const b5 = block("KPIs");
  const wrap = el("div", "pb-table");
  const table = el("table");
  const thead = el("thead");
  const tr = el("tr");
  ["Metric", "How it's measured"].forEach((t) => {
    const th = el("th", null, t);
    th.scope = "col";
    tr.appendChild(th);
  });
  thead.appendChild(tr);
  table.appendChild(thead);
  const tbody = el("tbody");
  (s.kpis || []).forEach((k) => {
    const r = el("tr");
    r.appendChild(el("td", null, k.metric));
    r.appendChild(el("td", null, k.how_measured));
    tbody.appendChild(r);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  b5.appendChild(wrap);
  out.appendChild(b5);

}

/* ── the trend a blueprint builds on, linked to its card on the left ── */
function trendInfo(id) {
  const article = id && document.getElementById("t-" + id);
  if (!article) return null;
  return {
    article,
    num: article.querySelector(".pb-trend__meta span")?.textContent || "",
    title: article.querySelector("h3")?.textContent || "",
  };
}

// Tag the matching trend card on the left so the link works both ways.
function markTrend(id) {
  document.querySelectorAll(".pb-trend.is-picked").forEach((a) => {
    a.classList.remove("is-picked");
    a.querySelector(".pb-picked")?.remove();
  });
  const t = trendInfo(id);
  if (!t) return;
  t.article.classList.add("is-picked");
  t.article.tabIndex = -1;
  const tag = el("a", "pb-picked", "In the blueprint →");
  tag.href = "#generator";
  t.article.querySelector(".pb-trend__meta").appendChild(tag);
}

/* ─────────────────────────────────────────────────────
   CONCEPT RENDER
   ───────────────────────────────────────────────────── */
// The example ships with a saved render. A live blueprint fills the frame
// through renderConcept() straight after the text comes back.
function renderFrame(image, conceptName) {
  const figure = el("figure", "pb-mockup__fig");
  figure.id = "render";
  const frame = el("div", "pb-mockup__frame");
  if (image) {
    frame.appendChild(renderImg(image, conceptName));
  } else {
    frame.appendChild(el("p", "pb-mockup__placeholder", "Each blueprint comes with an AI render of its concept."));
  }
  figure.appendChild(frame);
  figure.appendChild(el("figcaption", null, "AI concept render"));
  const status = el("p", "pb-status");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  figure.appendChild(status);
  return figure;
}

function renderImg(src, conceptName) {
  const img = el("img");
  img.src = src;
  img.alt = "AI concept render of the store interior for " + (conceptName || "this blueprint");
  img.width = 1600;
  img.height = 900;
  img.decoding = "async";
  return img;
}

async function renderConcept(render, conceptName, code) {
  const figure = $("render");
  if (!figure || !render) return;
  const frame = figure.querySelector(".pb-mockup__frame");
  const status = figure.querySelector(".pb-status");
  frame.classList.add("is-loading");
  frame.querySelector(".pb-mockup__placeholder").textContent = "Rendering the concept…";
  try {
    const { url } = await post("/api/mockup", { prompt: render.prompt, sig: render.sig, code });
    frame.textContent = "";
    frame.appendChild(renderImg(url, conceptName));
    track("playbook_mockup");
  } catch (err) {
    frame.querySelector(".pb-mockup__placeholder").textContent = "The render failed.";
    status.className = "pb-status is-error";
    status.textContent = err.message;
  } finally {
    frame.classList.remove("is-loading");
  }
}

/* ─────────────────────────────────────────────────────
   GENERATOR
   ───────────────────────────────────────────────────── */
async function post(url, body) {
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  }
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON error page */ }
  if (!res.ok) {
    const fallback = res.status === 404
      ? "The generator runs only on gracechee.com or under netlify dev."
      : "Something went wrong (" + res.status + "). Try again.";
    throw new Error((data && data.error) || fallback);
  }
  return data;
}

function fillForm(i) {
  $("brand").value = i.brand;
  $("location").value = i.location;
  $("size").value = i.size;
  $("goal").value = i.goal;
  $("trend").value = i.trend;
  $("notes").value = i.notes || "";
}

$("gen-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const st = $("gen-status");
  const btn = $("gen-btn");
  const input = {
    brand: $("brand").value.trim(),
    location: $("location").value.trim(),
    size: Number($("size").value),
    goal: $("goal").value,
    trend: $("trend").value,
    notes: $("notes").value.trim(),
  };
  const code = $("code").value.trim();

  st.className = "pb-status is-error";
  if (!input.brand || !input.location) { st.textContent = "Add a brand and a location."; return; }
  if (!Number.isInteger(input.size) || input.size < 200 || input.size > 200000) {
    st.textContent = "Store size must be a whole number between 200 and 200,000 sq ft."; return;
  }
  if (!code) { st.textContent = "Add the access code. Ask Grace for one."; $("code").focus(); return; }

  btn.disabled = true;
  st.className = "pb-status";
  st.textContent = "Drafting the blueprint. This takes 20 to 40 seconds.";
  track("playbook_generate", { goal: input.goal, trend: input.trend, size_bucket: sizeBucket(input.size) });

  try {
    const { strategy, evidence, render } = await post("/api/strategy", { ...input, code });
    renderStrategy(strategy, input, { evidence });
    const out = $("out");
    out.focus({ preventScroll: true });
    out.scrollIntoView({ behavior: "smooth", block: "start" });
    st.textContent = "Blueprint ready. Rendering the concept…";
    await renderConcept(render, strategy.concept && strategy.concept.name, code);
    st.textContent = "Done. It's a first draft to react to, not a final plan.";
  } catch (err) {
    st.className = "pb-status is-error";
    st.textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});
