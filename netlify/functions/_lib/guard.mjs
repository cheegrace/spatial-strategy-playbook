// Gatekeeping shared by /api/strategy and /api/mockup: origin check, access
// code, input limits and a site-wide daily cap. The daily counters live in
// Netlify Blobs and hold no personal data.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { getStore } from "@netlify/blobs";

const ALLOWED_ORIGINS = new Set(["https://www.gracechee.com", "https://gracechee.com"]);
const URL_PATTERN = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|co|ai|app|xyz|ly)\b)/i;

export function reply(status, body) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

export function fail(status, message) {
  return reply(status, { error: message });
}

// The page and its functions share a host, so same-origin also covers
// `netlify deploy` draft URLs; localhost covers `netlify dev`.
export function originAllowed(req) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return origin === new URL(req.url).origin;
}

export async function readJson(req, maxBytes = 4096) {
  const text = await req.text();
  if (text.length > maxBytes) return null;
  try {
    const body = JSON.parse(text);
    return body && typeof body === "object" ? body : null;
  } catch {
    return null;
  }
}

// Returns the trimmed string, or throws a message the visitor can act on.
export function cleanText(value, label, max, { required = true } = {}) {
  const s = typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  if (required && !s) throw `Add a ${label}.`;
  if (s.length > max) throw `Keep the ${label} under ${max} characters.`;
  if (URL_PATTERN.test(s)) throw `Leave links out of the ${label}.`;
  return s;
}

// Strips spaces and any straight or curly quotes around a code, which pasted
// terminal commands can save into the environment variable by accident.
function bareCode(s) {
  return String(s).trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, "");
}

export function codeMatches(given) {
  const expected = bareCode(process.env.ACCESS_CODE || "");
  if (!expected || typeof given !== "string") return false;
  // Hash both sides so the comparison is constant-time regardless of length.
  const a = createHash("sha256").update(bareCode(given)).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

// Counts one use against the hourly per-IP limit and the daily limit for this
// endpoint. Returns an error Response when either is used up, otherwise null.
// Counts one use against today's site-wide limit for this endpoint. Returns
// an error Response when the limit is used up, otherwise null.
export async function spend(kind, limit) {
  const store = getStore("playbook-limits");
  const dayKey = `${kind}/day/${new Date().toISOString().slice(0, 10)}`;
  const used = await count(store, dayKey);
  if (used >= limit) return fail(429, "The tool has reached today's limit. Try again tomorrow.");
  await store.set(dayKey, String(used + 1));
  return null;
}

async function count(store, key) {
  return Number(await store.get(key)) || 0;
}

export function dailyLimit(name, fallback) {
  const n = parseInt(process.env[name] || "", 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

// The blueprint function signs the image prompt it builds, and the mockup
// function only renders prompts carrying a valid signature. The browser can
// pass a prompt along but can't write or change one.
function renderKey() {
  return "render:" + (process.env.FAL_KEY || "") + ":" + (process.env.ACCESS_CODE || "");
}

export function signRender(prompt) {
  return createHmac("sha256", renderKey()).update(prompt).digest("hex");
}

export function renderSigned(prompt, sig) {
  if (typeof prompt !== "string" || typeof sig !== "string" || !/^[0-9a-f]{64}$/.test(sig)) return false;
  return timingSafeEqual(Buffer.from(signRender(prompt), "hex"), Buffer.from(sig, "hex"));
}
