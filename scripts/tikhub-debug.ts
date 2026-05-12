import fs from "node:fs";
import { TIKHUB_ENDPOINTS, type TikHubEndpointKey } from "../src/lib/tikhub/endpoints";
import { tikhubRequest } from "../src/lib/tikhub/client";

function loadEnv() {
  const text = fs.readFileSync(".env", "utf8");
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([^#][^=]+)=(.*)$/);
    if (!match) continue;
    process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, "");
  }
}

function summarize(value: unknown, depth = 0): unknown {
  if (depth > 3) return typeof value;
  if (Array.isArray(value)) {
    return {
      type: "array",
      length: value.length,
      first: value.length ? summarize(value[0], depth + 1) : null,
    };
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return {
      type: "object",
      keys: Object.keys(record).slice(0, 30),
      sample: Object.fromEntries(Object.entries(record).slice(0, 8).map(([key, nested]) => [key, summarize(nested, depth + 1)])),
    };
  }
  return value;
}

async function main() {
  loadEnv();
  const key = (process.argv[2] ?? "douyinHotTopics") as TikHubEndpointKey;
  const query =
    key === "xiaohongshuSearchNotes"
      ? {
          keyword: process.argv[3] ?? "防晒",
          page: 1,
          sort_type: "general",
          note_type: 0,
          time_filter: 0,
          search_id: "",
          search_session_id: "",
          source: "explore_feed",
          ai_mode: 0,
        }
      : undefined;
  const payload = await tikhubRequest<unknown>(TIKHUB_ENDPOINTS[key], { query });
  const record = payload && typeof payload === "object" && !Array.isArray(payload) ? (payload as Record<string, unknown>) : {};
  console.log(JSON.stringify({ root: summarize(payload), data: summarize(record.data) }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
