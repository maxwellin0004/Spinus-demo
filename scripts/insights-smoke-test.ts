import fs from "node:fs";

function loadEnv() {
  const text = fs.readFileSync(".env", "utf8");
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([^#][^=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    const value = match[2].trim().replace(/^"|"$/g, "");
    process.env[key] = value;
  }
}

async function main() {
  loadEnv();
  const { collectHotTopics, collectKeywordBatch, collectSearchContents } = await import("../src/lib/insights/collector");
  const { collectConfiguredKeywords } = await import("../src/lib/insights/collector");
  const { seedDefaultInsightKeywords } = await import("../src/lib/insights/keywords");
  const { rebuildTrendSnapshotsFromContents } = await import("../src/lib/insights/snapshots");
  const mode = process.argv[2] ?? "hot";
  if (mode === "seed-keywords") {
    const result = await seedDefaultInsightKeywords();
    console.log(JSON.stringify(result));
    return;
  }

  if (mode === "configured") {
    const result = await collectConfiguredKeywords(Number(process.argv[3] ?? 5));
    console.log(JSON.stringify(result));
    return;
  }

  if (mode === "snapshots") {
    const result = await rebuildTrendSnapshotsFromContents();
    console.log(JSON.stringify(result));
    return;
  }

  if (mode === "search") {
    const keyword = process.argv[3] ?? "防晒";
    const result = await collectSearchContents({
      endpoint: "xiaohongshuSearchNotes",
      platform: "xiaohongshu",
      keyword,
      limit: 10,
    });
    console.log(JSON.stringify(result));
    return;
  }

  if (mode === "batch") {
    const keywords = (process.argv[3] ?? "防晒,底妆,敏感肌,油皮,持妆")
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean);
    const result = await collectKeywordBatch({
      endpoint: "xiaohongshuSearchNotes",
      platform: "xiaohongshu",
      keywords,
      limit: 5,
    });
    console.log(JSON.stringify(result));
    return;
  }

  const result = await collectHotTopics({
    endpoint: "douyinHotTopics",
    platform: "douyin",
  });
  console.log(JSON.stringify(result));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  if (error && typeof error === "object" && "payload" in error) {
    console.error(JSON.stringify((error as { payload: unknown }).payload, null, 2));
  }
  process.exit(1);
});
