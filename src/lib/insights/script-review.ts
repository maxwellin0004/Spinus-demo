import type { CreatorTrendScriptGeneration, CreatorTrendScriptImage, CreatorTrendScriptReview, PlatformSettings } from "@prisma/client";
import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { formatInsightAiHttpError, formatInsightAiRequestError, postJson, readInsightAiRuntimeConfig } from "@/lib/insights/recommendation-ai";
import { normalizeScriptTables, type ScriptReviewCheck, type ScriptReviewImageFinding, type ScriptReviewRiskItem, type ScriptReviewView } from "@/lib/insights/script-tables";
import { prisma } from "@/lib/prisma";

type ReviewSettings = Pick<PlatformSettings, "insightAiEnabled" | "insightAiBaseUrl" | "insightAiApiKey" | "insightAiModel">;

type ScriptWithReviewData = Pick<
  CreatorTrendScriptGeneration,
  "id" | "sourceTitle" | "platform" | "generationMode" | "model" | "plainText" | "graphicTablesJson" | "videoTablesJson" | "caseAnalysisTablesJson"
>;

type ReviewImage = Pick<CreatorTrendScriptImage, "pageKey" | "pageLabel" | "pageOrder" | "prompt" | "negativePrompt" | "imageUrl" | "status" | "errorMessage">;

export type ScriptReviewInput = {
  script: {
    id: string;
    sourceTitle: string;
    platform: string | null;
    generationMode: string;
    model: string | null;
    plainText: string;
    graphicTables: unknown;
    videoTables: unknown;
    caseAnalysisTables: unknown;
  };
  images: Array<{
    pageKey: string;
    pageLabel: string;
    pageOrder: number;
    imageUrl: string | null;
    status: string;
    errorMessage: string | null;
    prompt: string;
    negativePrompt: string | null;
  }>;
};

type ReviewAiPayload = {
  score?: unknown;
  summary?: unknown;
  checks?: unknown;
  imageFindings?: unknown;
  riskItems?: unknown;
  suggestions?: unknown;
};

const REVIEW_TIMEOUT_MS = 120_000;

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function jsonStable(value: unknown) {
  return JSON.stringify(value ?? null);
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function numberValue(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function reviewStatus(value: string): ScriptReviewView["status"] {
  if (value === "READY" || value === "FAILED") return value;
  return "GENERATING";
}

function checkStatus(value: unknown): "PASS" | "WARNING" | "FAIL" {
  return value === "PASS" || value === "FAIL" || value === "WARNING" ? value : "WARNING";
}

function severity(value: unknown): "LOW" | "MEDIUM" | "HIGH" {
  return value === "LOW" || value === "HIGH" || value === "MEDIUM" ? value : "MEDIUM";
}

function normalizeChecks(value: unknown): ScriptReviewCheck[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      return {
        id: stringValue(record.id, `check-${index + 1}`),
        label: stringValue(record.label, `检查项 ${index + 1}`),
        status: checkStatus(record.status),
        detail: stringValue(record.detail, "需要人工复核。"),
      };
    })
    .filter((item): item is ScriptReviewCheck => Boolean(item));
}

function normalizeImageFindings(value: unknown): ScriptReviewImageFinding[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      return {
        pageKey: stringValue(record.pageKey, `page-${index + 1}`),
        pageLabel: stringValue(record.pageLabel, `第 ${index + 1} 页`),
        status: checkStatus(record.status),
        textAccuracy: stringValue(record.textAccuracy, "未给出文字准确性判断。"),
        visualRisk: stringValue(record.visualRisk, "未给出视觉风险判断。"),
        suggestion: stringValue(record.suggestion, "发布前人工复核。"),
      };
    })
    .filter((item): item is ScriptReviewImageFinding => Boolean(item));
}

function normalizeRiskItems(value: unknown): ScriptReviewRiskItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const source = record.source === "image" || record.source === "publishing" || record.source === "script" ? record.source : "script";
      return {
        severity: severity(record.severity),
        source,
        detail: stringValue(record.detail, "存在发布风险。"),
        suggestion: stringValue(record.suggestion, "发布前修改或人工确认。"),
      };
    })
    .filter((item): item is ScriptReviewRiskItem => Boolean(item));
}

function normalizeSuggestions(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => stringValue(item)).filter(Boolean).slice(0, 8);
}

export function buildScriptReviewInput(script: ScriptWithReviewData, images: ReviewImage[]): ScriptReviewInput {
  return {
    script: {
      id: script.id,
      sourceTitle: script.sourceTitle,
      platform: script.platform,
      generationMode: script.generationMode,
      model: script.model,
      plainText: script.plainText ?? "",
      graphicTables: normalizeScriptTables(script.graphicTablesJson),
      videoTables: normalizeScriptTables(script.videoTablesJson),
      caseAnalysisTables: normalizeScriptTables(script.caseAnalysisTablesJson),
    },
    images: images
      .slice()
      .sort((a, b) => a.pageOrder - b.pageOrder)
      .map((image) => ({
        pageKey: image.pageKey,
        pageLabel: image.pageLabel,
        pageOrder: image.pageOrder,
        imageUrl: image.imageUrl,
        status: image.status,
        errorMessage: image.errorMessage,
        prompt: image.prompt,
        negativePrompt: image.negativePrompt,
      })),
  };
}

export function hashScriptReviewInput(input: ScriptReviewInput, model: string) {
  return sha256(jsonStable({ model, input }));
}

function parseJsonContent(content: string) {
  const cleaned = content.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  if (cleaned.startsWith("{") && cleaned.endsWith("}")) return JSON.parse(cleaned) as ReviewAiPayload;
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1)) as ReviewAiPayload;
  throw new Error("AI review returned non-JSON content.");
}

function mimeTypeFromUrl(url: string) {
  const lower = url.toLowerCase().split("?", 1)[0] ?? "";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/png";
}

async function localImageDataUrl(imageUrl: string) {
  const relative = imageUrl.replace(/^\/+/, "");
  const absolute = path.join(process.cwd(), "public", relative);
  const bytes = await readFile(absolute);
  return `data:${mimeTypeFromUrl(imageUrl)};base64,${bytes.toString("base64")}`;
}

async function imageInputUrl(imageUrl: string) {
  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith("data:")) return imageUrl;
  if (imageUrl.startsWith("/")) return localImageDataUrl(imageUrl);
  return imageUrl;
}

async function buildVisionContent(input: ScriptReviewInput) {
  const content: Array<Record<string, unknown>> = [
    {
      type: "text",
      text: JSON.stringify({
        instruction:
          "请审查这组热点脚本、发布包装和生成图片是否适合发布。必须逐张检查图片里的中文文字是否清晰、是否疑似错字/乱码、画面是否有品牌/logo/水印/夸大风险。只返回严格 JSON，不要 Markdown。",
        outputContract: {
          score: "0-100 integer",
          summary: "string",
          checks: [{ id: "string", label: "string", status: "PASS|WARNING|FAIL", detail: "string" }],
          imageFindings: [{ pageKey: "string", pageLabel: "string", status: "PASS|WARNING|FAIL", textAccuracy: "string", visualRisk: "string", suggestion: "string" }],
          riskItems: [{ severity: "LOW|MEDIUM|HIGH", source: "script|image|publishing", detail: "string", suggestion: "string" }],
          suggestions: ["string"],
        },
        reviewInput: input,
      }),
    },
  ];

  for (const image of input.images) {
    if (!image.imageUrl || image.status !== "READY") continue;
    content.push({
      type: "image_url",
      image_url: {
        url: await imageInputUrl(image.imageUrl),
      },
    });
  }

  return content;
}

export function scriptReviewToView(review: CreatorTrendScriptReview, currentInputHash: string): ScriptReviewView {
  return {
    id: review.id,
    model: review.model,
    inputHash: review.inputHash,
    status: reviewStatus(review.status),
    score: review.score,
    summary: review.summary,
    checks: normalizeChecks(review.checksJson),
    imageFindings: normalizeImageFindings(review.imageFindingsJson),
    riskItems: normalizeRiskItems(review.riskItemsJson),
    suggestions: normalizeSuggestions(review.suggestionsJson),
    errorMessage: review.errorMessage,
    stale: review.inputHash !== currentInputHash,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
  };
}

export async function latestScriptReviewView(script: ScriptWithReviewData & { scriptImages?: ReviewImage[]; scriptReviews?: CreatorTrendScriptReview[] }, settings: ReviewSettings) {
  const runtime = readInsightAiRuntimeConfig(settings);
  const input = buildScriptReviewInput(script, script.scriptImages ?? []);
  const inputHash = hashScriptReviewInput(input, runtime.model);
  const review = script.scriptReviews?.[0] ?? null;
  return { input, inputHash, model: runtime.model, review: review ? scriptReviewToView(review, inputHash) : null };
}

export async function runScriptPublishReview(settings: ReviewSettings, script: ScriptWithReviewData & { scriptImages: ReviewImage[] }, options: { force?: boolean } = {}) {
  if (!settings.insightAiEnabled) throw new Error("AI review is not enabled.");
  const runtime = readInsightAiRuntimeConfig(settings);
  if (!runtime.baseUrl || !runtime.apiKey || !runtime.model) throw new Error("AI review model is not configured.");

  const input = buildScriptReviewInput(script, script.scriptImages);
  const inputHash = hashScriptReviewInput(input, runtime.model);
  const cached = await prisma.creatorTrendScriptReview.findUnique({
    where: {
      scriptGenerationId_inputHash_model: {
        scriptGenerationId: script.id,
        inputHash,
        model: runtime.model,
      },
    },
  });
  if (cached?.status === "READY" && !options.force) return scriptReviewToView(cached, inputHash);

  await prisma.creatorTrendScriptReview.upsert({
    where: {
      scriptGenerationId_inputHash_model: {
        scriptGenerationId: script.id,
        inputHash,
        model: runtime.model,
      },
    },
    update: { status: "GENERATING", errorMessage: null },
    create: {
      scriptGenerationId: script.id,
      inputHash,
      model: runtime.model,
      status: "GENERATING",
    },
  });

  try {
    const response = await postJson(
      `${normalizeBaseUrl(runtime.baseUrl)}/chat/completions`,
      {
        "Content-Type": "application/json",
        Authorization: `Bearer ${runtime.apiKey}`,
      },
      {
        model: runtime.model,
        messages: [
          {
            role: "system",
            content: "你是中文小红书/短视频发布前质检员。你必须检查脚本文案、发布包装、合规风险和图片里的中文文字。只返回严格 JSON。",
          },
          {
            role: "user",
            content: await buildVisionContent(input),
          },
        ],
        response_format: { type: "json_object" },
      },
      runtime.proxyUrl,
      REVIEW_TIMEOUT_MS,
    );
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(formatInsightAiHttpError(response.status, body));
    const content = body?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) throw new Error("AI review returned empty content.");
    const parsed = parseJsonContent(content);
    const saved = await prisma.creatorTrendScriptReview.update({
      where: {
        scriptGenerationId_inputHash_model: {
          scriptGenerationId: script.id,
          inputHash,
          model: runtime.model,
        },
      },
      data: {
        status: "READY",
        score: numberValue(parsed.score),
        summary: stringValue(parsed.summary, "AI 检查完成。"),
        checksJson: normalizeChecks(parsed.checks),
        imageFindingsJson: normalizeImageFindings(parsed.imageFindings),
        riskItemsJson: normalizeRiskItems(parsed.riskItems),
        suggestionsJson: normalizeSuggestions(parsed.suggestions),
        rawResponseJson: body,
        errorMessage: null,
      },
    });
    return scriptReviewToView(saved, inputHash);
  } catch (error) {
    const message = formatInsightAiRequestError(error, REVIEW_TIMEOUT_MS);
    const failed = await prisma.creatorTrendScriptReview.update({
      where: {
        scriptGenerationId_inputHash_model: {
          scriptGenerationId: script.id,
          inputHash,
          model: runtime.model,
        },
      },
      data: {
        status: "FAILED",
        errorMessage: message,
      },
    });
    return scriptReviewToView(failed, inputHash);
  }
}
