// POST /api/mockup — one concept render of a blueprint's interior, via fal
// (Seedream v4 by default, about $0.03 an image). It renders only prompts that
// /api/strategy wrote and signed, so it can't be used as a general image
// generator.
import {
  reply, fail, originAllowed, readJson, codeMatches, spend, dailyLimit, renderSigned,
} from "./_lib/guard.mjs";

const MAX_PROMPT = 2600;
const IMAGE_MODEL = process.env.IMAGE_MODEL || "fal-ai/bytedance/seedream/v4/text-to-image";

export default async (req, context) => {
  if (req.method !== "POST") return fail(405, "Use POST.");
  if (!originAllowed(req)) return fail(403, "This tool accepts requests only from gracechee.com.");
  if (!process.env.FAL_KEY || !process.env.ACCESS_CODE) {
    return fail(503, "The render service isn't connected yet.");
  }

  const body = await readJson(req, 8192);
  if (!body) return fail(400, "The request was unreadable.");

  const { prompt, sig } = body;
  if (typeof prompt !== "string" || prompt.length > MAX_PROMPT || !renderSigned(prompt, sig)) {
    return fail(400, "Generate a blueprint first. The render follows it.");
  }

  if (!codeMatches(body.code)) {
    return fail(403, "That access code is wrong. Ask Grace for the code and try again.");
  }

  const limited = await spend("mockup", dailyLimit("MOCKUP_DAILY_LIMIT", 40));
  if (limited) return limited;

  let res;
  try {
    res = await fetch("https://fal.run/" + IMAGE_MODEL, {
      method: "POST",
      headers: { Authorization: "Key " + process.env.FAL_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt, image_size: "landscape_16_9", num_images: 1, enable_safety_checker: true,
      }),
      signal: AbortSignal.timeout(50_000),
    });
  } catch (err) {
    console.error("mockup: fal request failed", err?.message);
    return fail(502, "The image service didn't answer. Try again in a minute.");
  }
  if (!res.ok) {
    console.error("mockup: fal status", res.status);
    return fail(502, "The image service returned an error. Try again in a minute.");
  }

  const data = await res.json();
  const image = data?.images?.[0];
  console.log("mockup: image", image?.width, "x", image?.height, "billable units", res.headers.get("x-fal-billable-units") || "n/a");
  const url = image?.url;
  if (!url || !/^https:\/\//.test(url)) return fail(502, "No image came back. Try again.");

  return reply(200, { url });
};

export const config = { path: "/api/mockup" };
