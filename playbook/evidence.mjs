// Shared by the page (playbook.js) and the strategy function (strategy.mjs),
// so a citation resolves to the same label, figure and link everywhere.

export const STRENGTH_LABELS = {
  third_party_data: "Independent data",
  company_reported: "Company reported",
  agency_reported: "Agency reported",
  directional: "Directional",
};

// Kinds that count as evidence with published results ("proven").
const PROVEN_KINDS = new Set(["proven", "mine", "research"]);

// Flatten every entry in case-studies.json into one lookup by id.
export function indexEvidence(data) {
  const index = new Map();

  for (const c of data.proven_cases || []) {
    const r = (c.results || [])[0] || {};
    const src = (c.sources || []).find((s) => s.id === r.source_id) || (c.sources || [])[0] || {};
    index.set(c.id, {
      id: c.id, kind: "proven", brand: plain(c.brand), title: c.project,
      metric: shorten(r.value || "", 28), detail: r.metric || "",
      strength: r.evidence_strength || "directional",
      url: src.url || "", publisher: src.publisher || "",
    });
  }
  for (const c of data.practitioner_projects || []) {
    const r = (c.results || [])[0] || {};
    const src = (c.sources || [])[0] || {};
    index.set(c.id, {
      id: c.id, kind: "mine", brand: c.project.replace(/\s*\(.*\)$/, ""), title: c.brand,
      metric: shorten(r.value || "", 28), detail: r.metric || "",
      strength: r.evidence_strength || "agency_reported",
      url: src.url || "", publisher: "Grace Chee", hasResults: Boolean(r.value),
    });
  }
  for (const c of data.research || []) {
    index.set(c.id, {
      id: c.id, kind: "research", brand: plain(c.source.publisher), title: c.source.title,
      metric: shorten(c.finding.split(";")[0], 40), detail: c.finding,
      strength: /deloitte|placer|icsc/i.test(c.source.publisher) ? "third_party_data" : "company_reported",
      url: c.source.url, publisher: c.source.publisher,
    });
  }
  for (const c of data.reference_examples || []) {
    index.set(c.id, {
      id: c.id, kind: "precedent", brand: c.brand, title: c.what,
      metric: shorten(c.what.split(/[:;]/)[0], 32), detail: c.what, strength: "directional", url: c.url, publisher: "",
    });
  }
  for (const c of data.principles || []) {
    index.set(c.id, {
      id: c.id, kind: "principle", brand: shorten(c.rule, 40), title: c.rule,
      metric: "", detail: c.rule, strength: "directional", url: c.url, publisher: "",
    });
  }
  return index;
}

// proven: at least one id with published results; precedent: only precedents,
// principles or my projects without published figures; untested: nothing to cite.
export function confidenceFor(ids, index) {
  const entries = ids.map((id) => index.get(id)).filter(Boolean);
  if (!entries.length) return "untested";
  const proven = entries.some((e) => PROVEN_KINDS.has(e.kind) && (e.kind !== "mine" || e.hasResults));
  return proven ? "proven" : "precedent";
}

export function chipLabel(e) {
  const kind = { proven: "Proven", mine: "My work", research: "Research", precedent: "Precedent", principle: "Design principle" }[e.kind];
  return [kind, e.brand, e.metric].filter(Boolean).join(" · ");
}

function shorten(s, n = 48) {
  s = String(s).replace(/\s*\(.*?\)\s*/g, " ").replace(/\s+([.,;])/g, "$1").trim();
  return s.length > n ? s.slice(0, n - 1).replace(/[\s,;]+\S*$/, "") + "…" : s;
}
// "IKEA (and peers)" → "IKEA"
function plain(s) {
  return String(s || "").replace(/\s*\(.*?\)\s*/g, " ").trim();
}
