import Anthropic from "@anthropic-ai/sdk";

import { config } from "../config.js";

let client: Anthropic | null = null;
let clientKey: string | undefined;

/** Klien AI bersama untuk Doobie & AI matching. `null` kalau ANTHROPIC_API_KEY belum diisi. */
export function aiClient() {
  const key = config.anthropicApiKey;
  if (!key) return null;
  if (!client || clientKey !== key) {
    client = new Anthropic({ apiKey: key });
    clientKey = key;
  }
  return client;
}

/** Saat model menolak karena filter keamanan, API otomatis mencoba model cadangan. */
export const FALLBACK: { betas: Anthropic.AnthropicBeta[]; fallbacks: "default" } = {
  betas: ["server-side-fallback-2026-07-01"],
  fallbacks: "default",
};
