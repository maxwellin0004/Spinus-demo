import type { CreatorTrendScriptGeneration, CreatorTrendScriptImage, PlatformSettings } from "@prisma/client";
import crypto from "node:crypto";
import { isInsightImageAiConfigured, postJson, readInsightImageAiRuntimeConfig, type InsightImageAiRequestSettings } from "@/lib/insights/recommendation-ai";
import { normalizeScriptTables, type ScriptImageView, type ScriptTable } from "@/lib/insights/script-tables";
import { prisma } from "@/lib/prisma";
import { saveGeneratedImage } from "@/lib/storage";

export type ScriptImagePrompt = {
  pageKey: string;
  pageLabel: string;
  pageOrder: number;
  prompt: string;
  negativePrompt: string | null;
  aspectRatio: string | null;
  size: string;
  overlayText: string;
  promptHash: string;
};

type ImageGenerationResponse = {
  data?: Array<{
    b64_json?: string;
    url?: string;
    mime_type?: string;
  }>;
};

type ScriptImageSettings = Pick<
  PlatformSettings,
  "insightAiEnabled" | "insightAiBaseUrl" | "insightAiApiKey" | "insightImageAiBaseUrl" | "insightImageAiApiKey" | "insightImageAiModel"
>;

const IMAGE_GENERATION_TIMEOUT_MS = 90_000;

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function cleanText(value: string | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function compactKey(value: string, fallback: string) {
  const source = cleanText(value).toLowerCase() || fallback;
  const ascii = source
    .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return ascii || fallback;
}

function includesAny(value: string, keywords: string[]) {
  const source = value.toLowerCase();
  return keywords.some((keyword) => source.includes(keyword.toLowerCase()));
}

function findColumnIndex(table: ScriptTable, keywords: string[]) {
  return table.columns.findIndex((column) => includesAny(column, keywords));
}

function cell(row: string[], index: number) {
  return index >= 0 ? cleanText(row[index]) : "";
}

function isPromptTable(table: ScriptTable) {
  const haystack = `${table.id} ${table.title} ${table.columns.join(" ")}`;
  const positiveIndex = findColumnIndex(table, ["正向", "imagePrompt", "prompt", "提示词", "图片生成"]);
  return positiveIndex >= 0 && includesAny(haystack, ["图片", "image", "素材", "生成"]);
}

function isPageTable(table: ScriptTable) {
  const haystack = `${table.id} ${table.title} ${table.columns.join(" ")}`;
  return includesAny(haystack, ["分页", "页面", "graphic_pages"]) && findColumnIndex(table, ["页码", "page"]) >= 0;
}

function uniqueLines(values: string[]) {
  const seen = new Set<string>();
  return values
    .map(cleanText)
    .filter(Boolean)
    .filter((value) => {
      const key = value.replace(/\s+/g, "");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function pageTextByLabel(tables: ScriptTable[]) {
  const pageTable = tables.find(isPageTable);
  if (!pageTable) return new Map<string, string>();

  const pageIndex = findColumnIndex(pageTable, ["页码", "page"]);
  const copyIndex = findColumnIndex(pageTable, ["页面文案", "文案", "copy"]);
  const layoutIndex = findColumnIndex(pageTable, ["排版", "design"]);
  const goalIndex = findColumnIndex(pageTable, ["目标", "objective"]);
  const result = new Map<string, string>();

  for (const row of pageTable.rows) {
    const label = cell(row, pageIndex);
    if (!label) continue;
    const lines = uniqueLines([cell(row, copyIndex), cell(row, layoutIndex), cell(row, goalIndex)]);
    result.set(label, lines.join("\n"));
  }

  return result;
}

function aspectRatioToSize(aspectRatio: string | null) {
  const value = (aspectRatio ?? "").replace(/\s+/g, "");
  if (value === "4:3") return "1536x1024";
  if (value === "1:1") return "1024x1024";
  if (value === "9:16") return "1024x1792";
  return "1024x1536";
}

function sanitizeNegativePrompt(value: string | null) {
  if (!value) return null;
  const cleaned = value
    .replace(/不要生成中文文字/g, "")
    .replace(/不要生成文字/g, "")
    .replace(/不要中文字/g, "")
    .replace(/不要中文/g, "")
    .replace(/\s+/g, " ")
    .replace(/[，,、\s]+$/g, "")
    .trim();
  return cleaned || null;
}

function buildPrompt(input: ScriptImagePrompt) {
  const overlayLines = uniqueLines(input.overlayText.split(/\n|；|;/).map((item) => item.trim())).slice(0, 5);
  const textInstruction = overlayLines.length
    ? [
        "请直接把以下简体中文文字准确生成在图片中，作为小红书成片的一部分：",
        ...overlayLines.map((line, index) => `${index + 1}. ${line}`),
        "中文必须清晰可读、不要错别字、不要乱码、不要额外添加其他文字。文字排版要服从画面构图，标题醒目，说明文字简洁。",
      ].join("\n")
    : "请生成适合小红书发布的完整成片，可以包含简洁、准确、清晰可读的简体中文标题。";

  return [
    input.prompt,
    textInstruction,
    input.negativePrompt ? `负向要求：${input.negativePrompt}` : "",
  ].filter(Boolean).join("\n\n");
}

function scriptImagePromptHash(input: Omit<ScriptImagePrompt, "promptHash">) {
  return sha256([input.prompt, input.negativePrompt ?? "", input.overlayText, input.aspectRatio ?? "", input.size].join("\n"));
}

async function imageBytesFromResponse(data: ImageGenerationResponse) {
  const first = data.data?.[0];
  if (!first) throw new Error("Image API response has no data.");

  if (first.b64_json) {
    return {
      bytes: Buffer.from(first.b64_json, "base64"),
      mimeType: first.mime_type || "image/png",
    };
  }

  if (first.url) {
    const response = await fetch(first.url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Image URL fetch failed with status ${response.status}.`);
    return {
      bytes: Buffer.from(await response.arrayBuffer()),
      mimeType: response.headers.get("content-type")?.split(";")[0] || first.mime_type || "image/png",
    };
  }

  throw new Error("Image API response has neither b64_json nor url.");
}

export function scriptImageToView(image: CreatorTrendScriptImage): ScriptImageView {
  return {
    id: image.id,
    pageKey: image.pageKey,
    pageLabel: image.pageLabel,
    pageOrder: image.pageOrder,
    model: image.model,
    promptHash: image.promptHash,
    prompt: image.prompt,
    negativePrompt: image.negativePrompt,
    aspectRatio: image.aspectRatio,
    size: image.size,
    imageUrl: image.imageUrl,
    status: image.status === "READY" || image.status === "FAILED" ? image.status : "GENERATING",
    errorMessage: image.errorMessage,
    generatedAt: image.generatedAt?.toISOString() ?? null,
    updatedAt: image.updatedAt.toISOString(),
  };
}

export function extractScriptImagePrompts(record: Pick<CreatorTrendScriptGeneration, "graphicTablesJson">) {
  const tables = normalizeScriptTables(record.graphicTablesJson);
  const promptTable = tables.find(isPromptTable);
  if (!promptTable) return [];

  const pageText = pageTextByLabel(tables);
  const pageIndex = findColumnIndex(promptTable, ["页码", "page"]);
  const positiveIndex = findColumnIndex(promptTable, ["正向", "imagePrompt", "prompt", "提示词"]);
  const negativeIndex = findColumnIndex(promptTable, ["负向", "negative"]);
  const ratioIndex = findColumnIndex(promptTable, ["画幅", "aspect"]);
  const overlayIndex = findColumnIndex(promptTable, ["文字", "叠加", "copy", "说明"]);

  return promptTable.rows
    .map((row, index): ScriptImagePrompt | null => {
      const prompt = cell(row, positiveIndex);
      if (!prompt) return null;
      const pageLabel = cell(row, pageIndex) || `第 ${index + 1} 页`;
      const negativePrompt = sanitizeNegativePrompt(cell(row, negativeIndex) || null);
      const aspectRatio = cell(row, ratioIndex) || "3:4";
      const overlayText = uniqueLines([cell(row, overlayIndex), pageText.get(pageLabel) ?? ""]).join("\n");
      const item = {
        pageKey: compactKey(pageLabel, `page-${index + 1}`),
        pageLabel,
        pageOrder: index,
        prompt,
        negativePrompt,
        aspectRatio,
        size: aspectRatioToSize(aspectRatio),
        overlayText,
      };
      return { ...item, promptHash: scriptImagePromptHash(item) };
    })
    .filter((item): item is ScriptImagePrompt => Boolean(item));
}

function promptHash(input: ScriptImagePrompt) {
  return input.promptHash;
}

export async function listScriptImages(scriptGenerationId: string) {
  const images = await prisma.creatorTrendScriptImage.findMany({
    where: { scriptGenerationId },
    orderBy: [{ pageOrder: "asc" }, { updatedAt: "desc" }],
  });
  return images.map(scriptImageToView);
}

export async function generateScriptImage(
  settings: InsightImageAiRequestSettings,
  script: Pick<CreatorTrendScriptGeneration, "id" | "sourceTitle" | "graphicTablesJson">,
  input: ScriptImagePrompt,
  options: { force?: boolean } = {},
) {
  if (!isInsightImageAiConfigured(settings)) {
    throw new Error("Image AI is not configured.");
  }

  const runtime = readInsightImageAiRuntimeConfig(settings);
  const hash = promptHash(input);
  const existing = await prisma.creatorTrendScriptImage.findUnique({
    where: {
      scriptGenerationId_pageKey_promptHash_model: {
        scriptGenerationId: script.id,
        pageKey: input.pageKey,
        promptHash: hash,
        model: runtime.model,
      },
    },
  });

  if (existing?.status === "READY" && existing.imageUrl && !options.force) {
    return scriptImageToView(existing);
  }

  await prisma.creatorTrendScriptImage.upsert({
    where: {
      scriptGenerationId_pageKey_promptHash_model: {
        scriptGenerationId: script.id,
        pageKey: input.pageKey,
        promptHash: hash,
        model: runtime.model,
      },
    },
    update: {
      pageLabel: input.pageLabel,
      pageOrder: input.pageOrder,
      prompt: input.prompt,
      negativePrompt: input.negativePrompt,
      aspectRatio: input.aspectRatio,
      size: input.size,
      status: "GENERATING",
      errorMessage: null,
    },
    create: {
      scriptGenerationId: script.id,
      pageKey: input.pageKey,
      pageLabel: input.pageLabel,
      pageOrder: input.pageOrder,
      model: runtime.model,
      promptHash: hash,
      prompt: input.prompt,
      negativePrompt: input.negativePrompt,
      aspectRatio: input.aspectRatio,
      size: input.size,
      status: "GENERATING",
    },
  });

  try {
    const response = await postJson(
      `${normalizeBaseUrl(runtime.baseUrl)}/images/generations`,
      {
        "Content-Type": "application/json",
        Authorization: `Bearer ${runtime.apiKey}`,
      },
      {
        model: runtime.model,
        prompt: buildPrompt(input),
        n: 1,
        size: input.size,
      },
      runtime.proxyUrl,
      IMAGE_GENERATION_TIMEOUT_MS,
    );
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(`Image API returned ${response.status}${body?.error?.message ? `: ${body.error.message}` : ""}`);
    }

    const { bytes, mimeType } = await imageBytesFromResponse(body as ImageGenerationResponse);
    const imageUrl = await saveGeneratedImage(bytes, mimeType, "insights/script-images", `${script.sourceTitle}-${input.pageLabel}`);
    const saved = await prisma.creatorTrendScriptImage.update({
      where: {
        scriptGenerationId_pageKey_promptHash_model: {
          scriptGenerationId: script.id,
          pageKey: input.pageKey,
          promptHash: hash,
          model: runtime.model,
        },
      },
      data: {
        imageUrl,
        status: "READY",
        errorMessage: null,
        generatedAt: new Date(),
      },
    });
    return scriptImageToView(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Image generation failed.";
    const failed = await prisma.creatorTrendScriptImage.update({
      where: {
        scriptGenerationId_pageKey_promptHash_model: {
          scriptGenerationId: script.id,
          pageKey: input.pageKey,
          promptHash: hash,
          model: runtime.model,
        },
      },
      data: {
        status: "FAILED",
        errorMessage: message,
      },
    });
    return scriptImageToView(failed);
  }
}

export async function generateScriptImages(
  settings: ScriptImageSettings,
  script: Pick<CreatorTrendScriptGeneration, "id" | "sourceTitle" | "graphicTablesJson">,
  options: { pageKey?: string | null; force?: boolean } = {},
) {
  const prompts = extractScriptImagePrompts(script);
  const selected = options.pageKey ? prompts.filter((item) => item.pageKey === options.pageKey) : prompts;
  const results = await Promise.allSettled(selected.map((item) => generateScriptImage(settings, script, item, { force: options.force })));
  return {
    prompts,
    images: results.map((result) => (result.status === "fulfilled" ? result.value : null)).filter((item): item is ScriptImageView => Boolean(item)),
    errors: results.map((result) => (result.status === "rejected" ? (result.reason instanceof Error ? result.reason.message : String(result.reason)) : null)).filter(Boolean),
  };
}
