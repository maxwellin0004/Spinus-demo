import type { PlatformSettings } from "@prisma/client";
import crypto from "node:crypto";
import { isInsightImageAiConfigured, postJson, readInsightImageAiRuntimeConfig, type InsightImageAiRequestSettings } from "@/lib/insights/recommendation-ai";
import { prisma } from "@/lib/prisma";
import { saveGeneratedImage } from "@/lib/storage";

type TopicCoverImageInput = {
  sourceContentId?: string | null;
  sourceTitle: string;
  platform?: string | null;
  prompt: string;
  negativePrompt?: string | null;
  fallbackImageUrl?: string | null;
};

type ImageGenerationResponse = {
  data?: Array<{
    b64_json?: string;
    url?: string;
    mime_type?: string;
  }>;
};

const IMAGE_GENERATION_TIMEOUT_MS = 90_000;

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function cacheKey(input: TopicCoverImageInput, model: string, promptHash: string) {
  return sha256([input.sourceContentId ?? "", input.sourceTitle, input.platform ?? "", model, promptHash].join("\n"));
}

function combinedPrompt(input: TopicCoverImageInput) {
  return [
    input.prompt.trim(),
    "图片内不要生成中文文字，中文标题和标签会由前端叠加。",
    input.negativePrompt?.trim() ? `负向要求：${input.negativePrompt.trim()}` : "",
  ].filter(Boolean).join("\n");
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

export async function generateTopicCoverImage(
  settings: InsightImageAiRequestSettings,
  input: TopicCoverImageInput,
) {
  const prompt = input.prompt.trim();
  if (!prompt || !isInsightImageAiConfigured(settings)) {
    return { imageUrl: input.fallbackImageUrl ?? null, generated: false, cached: false, errorMessage: null };
  }

  const runtime = readInsightImageAiRuntimeConfig(settings);
  const promptHash = sha256(`${prompt}\n${input.negativePrompt ?? ""}`);
  const key = cacheKey(input, runtime.model, promptHash);
  const cached = await prisma.creatorTrendTopicImage.findUnique({ where: { cacheKey: key } });
  if (cached?.status === "READY" && cached.imageUrl) {
    return { imageUrl: cached.imageUrl, generated: false, cached: true, errorMessage: null };
  }

  try {
    await prisma.creatorTrendTopicImage.upsert({
      where: { cacheKey: key },
      update: {
        sourceContentId: input.sourceContentId || null,
        sourceTitle: input.sourceTitle,
        platform: input.platform || null,
        model: runtime.model,
        promptHash,
        prompt,
        negativePrompt: input.negativePrompt || null,
        status: "GENERATING",
        errorMessage: null,
      },
      create: {
        cacheKey: key,
        sourceContentId: input.sourceContentId || null,
        sourceTitle: input.sourceTitle,
        platform: input.platform || null,
        model: runtime.model,
        promptHash,
        prompt,
        negativePrompt: input.negativePrompt || null,
        status: "GENERATING",
      },
    });

    const response = await postJson(
      `${normalizeBaseUrl(runtime.baseUrl)}/images/generations`,
      {
        "Content-Type": "application/json",
        Authorization: `Bearer ${runtime.apiKey}`,
      },
      {
        model: runtime.model,
        prompt: combinedPrompt(input),
        n: 1,
        size: "1024x1536",
      },
      runtime.proxyUrl,
      IMAGE_GENERATION_TIMEOUT_MS,
    );

    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(`Image API returned ${response.status}${body?.error?.message ? `: ${body.error.message}` : ""}`);
    }

    const { bytes, mimeType } = await imageBytesFromResponse(body as ImageGenerationResponse);
    const imageUrl = await saveGeneratedImage(bytes, mimeType, "insights/topic-covers", input.sourceContentId || input.sourceTitle);
    await prisma.creatorTrendTopicImage.update({
      where: { cacheKey: key },
      data: {
        imageUrl,
        status: "READY",
        errorMessage: null,
      },
    });

    return { imageUrl, generated: true, cached: false, errorMessage: null };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Image generation failed.";
    await prisma.creatorTrendTopicImage.upsert({
      where: { cacheKey: key },
      update: {
        status: "FAILED",
        errorMessage: message,
      },
      create: {
        cacheKey: key,
        sourceContentId: input.sourceContentId || null,
        sourceTitle: input.sourceTitle,
        platform: input.platform || null,
        model: runtime.model,
        promptHash,
        prompt,
        negativePrompt: input.negativePrompt || null,
        status: "FAILED",
        errorMessage: message,
      },
    });
    return { imageUrl: input.fallbackImageUrl ?? null, generated: false, cached: false, errorMessage: message };
  }
}

export type TopicCoverImageSettings = Pick<
  PlatformSettings,
  | "insightAiEnabled"
  | "insightAiBaseUrl"
  | "insightAiApiKey"
  | "insightImageAiBaseUrl"
  | "insightImageAiApiKey"
  | "insightImageAiModel"
>;
