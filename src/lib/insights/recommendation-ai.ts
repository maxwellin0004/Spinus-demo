import type { PlatformSettings } from "@prisma/client";
import net from "node:net";
import tls from "node:tls";
import type { RecommendationSummary } from "@/lib/insights/analysis";
import {
  DEFAULT_INSIGHT_AI_BASE_URL,
  DEFAULT_INSIGHT_AI_GRAPHIC_SCRIPT_PROMPT,
  DEFAULT_INSIGHT_AI_MODEL,
  DEFAULT_INSIGHT_AI_REWRITE_PROMPT,
  DEFAULT_INSIGHT_AI_VIDEO_SCRIPT_PROMPT,
  DEFAULT_INSIGHT_IMAGE_AI_MODEL,
  INSIGHT_TOPIC_PROMPT_VERSION,
} from "@/lib/insights/ai-prompts";

type AiRewritePayload = {
  items?: Array<{
    itemIndex?: number;
    sampleSourceContentId?: string;
    title?: string;
    reason?: string;
    angles?: string[];
    coverImagePrompt?: string;
    coverNegativePrompt?: string;
  }>;
};

export type AiRuntimeSettings = Pick<
  PlatformSettings,
  | "insightAiEnabled"
  | "insightAiSystemPrompt"
  | "insightAiScriptSystemPrompt"
  | "insightAiGraphicScriptSystemPrompt"
  | "insightAiVideoScriptSystemPrompt"
  | "insightAiBaseUrl"
  | "insightAiApiKey"
  | "insightAiModel"
>;

export type InsightAiRequestSettings = Pick<PlatformSettings, "insightAiEnabled" | "insightAiBaseUrl" | "insightAiApiKey" | "insightAiModel">;

export type InsightImageAiRequestSettings = Pick<
  PlatformSettings,
  | "insightAiEnabled"
  | "insightAiBaseUrl"
  | "insightAiApiKey"
  | "insightImageAiBaseUrl"
  | "insightImageAiApiKey"
  | "insightImageAiModel"
>;

type CreatorScriptInput = {
  directionLabel: string;
  platformLabel: string;
  title: string;
  keyword: string;
  author?: string | null;
  metrics: string[];
  rows: [string, string][];
  comments: string[];
};

type CreatorScriptPayload = {
  graphic?: GraphicScriptPayload;
  video?: VideoScriptPayload;
  riskNotes?: string[];
};

type CreatorScriptPack = {
  graphicScriptText: string;
  videoScriptText: string;
  scriptText: string;
};

type GraphicScriptPayload = {
  title?: string;
  platform?: string;
  objective?: string;
  audience?: string;
  coverText?: string;
  noteStructure?: Array<{
    page?: string;
    image?: string;
    imagePrompt?: string;
    negativePrompt?: string;
    aspectRatio?: string;
    imageModelNotes?: string;
    copy?: string;
    design?: string;
  }>;
  caption?: string;
  hashtags?: string[];
  cta?: string;
};

type VideoScriptPayload = {
  title?: string;
  platform?: string;
  objective?: string;
  audience?: string;
  hook?: string;
  contentScript?: Array<{
    section?: string;
    objective?: string;
    coreMessage?: string;
    spokenDraft?: string;
  }>;
  storyboard?: Array<{
    section?: string;
    visualGoal?: string;
    visualContent?: string;
    assetNeeds?: string;
    motionTransition?: string;
  }>;
  assetScript?: Array<{
    assetId?: string;
    targetSection?: string;
    assetType?: string;
    assetDescription?: string;
    sourceGuidance?: string;
    required?: boolean;
    fallbackPlan?: string;
  }>;
  subtitleVoiceScript?: Array<{
    section?: string;
    sourceLines?: string;
    voiceoverLines?: string;
    subtitleChunks?: string[];
    emphasisWords?: string[];
    pausesEmphasis?: string;
    sfxNotes?: string;
  }>;
  voiceover?: Array<{
    timeRange?: string;
    voiceId?: string;
    section?: string;
    text?: string;
    targetDurationSec?: number;
    pauseAfterSec?: number;
    visualSectionId?: string;
    emphasisWords?: string[];
    timingStatus?: string;
  }>;
  audioPlan?: Array<{
    timeRange?: string;
    section?: string;
    voiceStrategy?: string;
    bgmStrategy?: string;
    sfxStrategy?: string;
    silencePauses?: string;
    mixRelation?: string;
  }>;
  sfxBgmMap?: {
    bgm?: unknown;
    sfx?: unknown;
    duckingRules?: unknown;
  };
  visualScriptVertical?: Array<{
    visualId?: string;
    targetSection?: string;
    visualGoal?: string;
    layoutStructure?: string;
    visualHierarchy?: string;
    primaryElements?: string;
    stylePalette?: string;
  }>;
  reactPageScriptVertical?: Array<{
    sceneId?: string;
    componentName?: string;
    inputFields?: string;
    layoutStructure?: string;
    animationPresets?: string;
    assetSlots?: string;
    responsiveRules?: string;
  }>;
  timeline?: Array<{
    timeRange?: string;
    scene?: string;
    visualDescription?: string;
    audioDescription?: string;
    notes?: string;
  }>;
  formalScriptVertical?: Array<{
    timeRange?: string;
    section?: string;
    visualDescription?: string;
    audioDescription?: string;
    notes?: string;
  }>;
  caption?: string;
  cta?: string;
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

export function readInsightAiRuntimeConfig(settings: Pick<PlatformSettings, "insightAiBaseUrl" | "insightAiApiKey" | "insightAiModel">) {
  return {
    baseUrl: settings.insightAiBaseUrl?.trim() || process.env.INSIGHT_AI_BASE_URL?.trim() || DEFAULT_INSIGHT_AI_BASE_URL,
    apiKey: settings.insightAiApiKey?.trim() || process.env.INSIGHT_AI_API_KEY?.trim() || "",
    model: settings.insightAiModel?.trim() || process.env.INSIGHT_AI_MODEL?.trim() || DEFAULT_INSIGHT_AI_MODEL,
    proxyUrl: process.env.HTTPS_PROXY?.trim() || process.env.HTTP_PROXY?.trim() || "",
  };
}

export function readInsightImageAiRuntimeConfig(settings: InsightImageAiRequestSettings) {
  return {
    baseUrl:
      settings.insightImageAiBaseUrl?.trim() ||
      settings.insightAiBaseUrl?.trim() ||
      process.env.INSIGHT_IMAGE_AI_BASE_URL?.trim() ||
      process.env.INSIGHT_AI_BASE_URL?.trim() ||
      DEFAULT_INSIGHT_AI_BASE_URL,
    apiKey:
      settings.insightImageAiApiKey?.trim() ||
      settings.insightAiApiKey?.trim() ||
      process.env.INSIGHT_IMAGE_AI_API_KEY?.trim() ||
      process.env.INSIGHT_AI_API_KEY?.trim() ||
      "",
    model: settings.insightImageAiModel?.trim() || process.env.INSIGHT_IMAGE_AI_MODEL?.trim() || DEFAULT_INSIGHT_IMAGE_AI_MODEL,
    proxyUrl: process.env.HTTPS_PROXY?.trim() || process.env.HTTP_PROXY?.trim() || "",
  };
}

function isConfigured(settings: Pick<PlatformSettings, "insightAiEnabled" | "insightAiBaseUrl" | "insightAiApiKey" | "insightAiModel">) {
  const runtime = readInsightAiRuntimeConfig(settings);
  return settings.insightAiEnabled && Boolean(runtime.baseUrl) && Boolean(runtime.apiKey) && Boolean(runtime.model);
}

export function isInsightAiConfigured(settings: InsightAiRequestSettings) {
  return isConfigured(settings);
}

export function isInsightImageAiConfigured(settings: InsightImageAiRequestSettings) {
  const runtime = readInsightImageAiRuntimeConfig(settings);
  return settings.insightAiEnabled && Boolean(runtime.baseUrl) && Boolean(runtime.apiKey) && Boolean(runtime.model);
}

export type RecommendationAiRewriteResult = {
  recommendations: RecommendationSummary[];
  usedAi: boolean;
  errorMessage: string | null;
};

function resolveTopicRewritePrompt(settings: Pick<PlatformSettings, "insightAiSystemPrompt">) {
  const prompt = settings.insightAiSystemPrompt?.trim() ?? "";
  if (!prompt) return DEFAULT_INSIGHT_AI_REWRITE_PROMPT;
  if (prompt.includes(INSIGHT_TOPIC_PROMPT_VERSION)) return prompt;
  return DEFAULT_INSIGHT_AI_REWRITE_PROMPT;
}

function compactText(value: string, limit: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, limit);
}

function comparableText(value: string | undefined) {
  return (value ?? "").replace(/\s+/g, "").trim();
}

function textChanged(next: string | undefined, previous: string) {
  const normalized = comparableText(next);
  return Boolean(normalized) && normalized !== comparableText(previous);
}

function stringListChanged(next: string[], previous: string[]) {
  if (next.length !== previous.length) return true;
  return next.some((item, index) => comparableText(item) !== comparableText(previous[index]));
}

function platformLabel(platform: string) {
  const map: Record<string, string> = {
    xiaohongshu: "小红书",
    douyin: "抖音",
    bilibili: "B站",
    weibo: "微博",
  };
  return map[platform] ?? platform;
}

function platformTitleGuide(platform: string) {
  const label = platformLabel(platform);
  if (platform === "xiaohongshu") {
    return {
      platformLabel: label,
      titleStyle: "小红书标题：口语化、种草/避坑/教程/测评感强，可以使用轻量情绪词，但不要标题党；适合出现“新手”“实测”“别急着”“到底”“怎么做”等表达。",
      avoid: "避免像公众号文章标题，避免过长，避免纯数据总结，避免过度夸张功效承诺。",
    };
  }
  if (platform === "douyin") {
    return {
      platformLabel: label,
      titleStyle: "抖音标题：短、强钩子、强结果感，适合前 8 个字给冲突或结论；可用反差、避坑、步骤、结果导向。",
      avoid: "避免解释型长句，避免平铺直叙，避免需要读很久才懂的标题。",
    };
  }
  if (platform === "bilibili") {
    return {
      platformLabel: label,
      titleStyle: "B站标题：信息量更完整，可偏教程、复盘、横评、深度测评，标题要说明对象和看点。",
      avoid: "避免只有情绪钩子，避免缺少具体内容承诺。",
    };
  }
  if (platform === "weibo") {
    return {
      platformLabel: label,
      titleStyle: "微博标题：热点讨论感强，适合观点、争议、话题化表达，标题要便于转发讨论。",
      avoid: "避免太像教程目录，避免缺少话题态度。",
    };
  }
  return {
    platformLabel: label,
    titleStyle: "标题需要符合目标平台内容语境，具体、可发布、可创作。",
    avoid: "避免空泛模板句。",
  };
}

function readTimeoutMs(name: string, fallback: number) {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value >= 5_000 ? value : fallback;
}

const DEFAULT_AI_POST_TIMEOUT_MS = readTimeoutMs("INSIGHT_AI_TIMEOUT_MS", 60_000);
export const INSIGHT_AI_TOPIC_DECK_TIMEOUT_MS = readTimeoutMs("INSIGHT_AI_TOPIC_DECK_TIMEOUT_MS", 90_000);

function timeoutSeconds(timeoutMs: number) {
  return Math.round(timeoutMs / 1000);
}

export function formatInsightAiRequestError(error: unknown, timeoutMs = DEFAULT_AI_POST_TIMEOUT_MS) {
  const message = error instanceof Error ? error.message : String(error || "");
  if (/timed out|timeout|abort|aborted/i.test(message)) {
    return `AI 模型响应超时（已等待 ${timeoutSeconds(timeoutMs)} 秒）。请稍后重新生成，或临时切换到更快的模型。`;
  }
  if (/fetch failed|ENOTFOUND|EAI_AGAIN|ECONNRESET|ECONNREFUSED|socket hang up/i.test(message)) {
    return "AI 网关连接失败，请检查 Base URL、代理或网络连通性。";
  }
  return message ? message.slice(0, 500) : "AI 请求失败，请稍后重试。";
}

function responseErrorMessage(data: unknown) {
  if (!data || typeof data !== "object") return "";
  const record = data as Record<string, unknown>;
  const error = record.error;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const message = (error as Record<string, unknown>).message;
    if (typeof message === "string") return message;
  }
  const message = record.message;
  return typeof message === "string" ? message : "";
}

export function formatInsightAiHttpError(status: number, data: unknown) {
  const detail = responseErrorMessage(data);
  if (status === 401 || status === 403) return detail ? `AI API Key 无权限或已失效：${detail}` : "AI API Key 无权限或已失效。";
  if (status === 404) return detail ? `AI 模型或接口地址不存在：${detail}` : "AI 模型或接口地址不存在，请检查 Base URL 和模型名。";
  if (status === 429) return detail ? `AI 接口限流：${detail}` : "AI 接口限流，请稍后重新生成。";
  if (status >= 500) return detail ? `AI 网关服务异常 ${status}：${detail}` : `AI 网关服务异常 ${status}，请稍后重试。`;
  return detail ? `AI 接口返回 ${status}：${detail}` : `AI 接口返回 ${status}`;
}

function socketTimeoutError(label: string, timeoutMs: number) {
  return new Error(`${label} timed out after ${timeoutMs}ms.`);
}

export async function postJson(url: string, headers: Record<string, string>, body: unknown, proxyUrl: string, timeoutMs = DEFAULT_AI_POST_TIMEOUT_MS) {
  if (!proxyUrl) {
    return fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  }

  return postJsonViaHttpProxy(url, headers, body, proxyUrl, timeoutMs);
}

function splitHttpResponse(raw: string) {
  const splitAt = raw.indexOf("\r\n\r\n");
  const head = splitAt >= 0 ? raw.slice(0, splitAt) : raw;
  const rawBody = splitAt >= 0 ? raw.slice(splitAt + 4) : "";
  const status = Number.parseInt(head.match(/^HTTP\/\d(?:\.\d)?\s+(\d+)/)?.[1] ?? "0", 10);
  const chunked = /transfer-encoding:\s*chunked/i.test(head);
  const body = chunked ? decodeChunkedBody(rawBody) : rawBody;
  return { status, body };
}

function decodeChunkedBody(rawBody: string) {
  let index = 0;
  let body = "";
  while (index < rawBody.length) {
    const sizeEnd = rawBody.indexOf("\r\n", index);
    if (sizeEnd < 0) break;
    const sizeText = rawBody.slice(index, sizeEnd).split(";", 1)[0]?.trim() ?? "";
    const size = Number.parseInt(sizeText, 16);
    if (!Number.isFinite(size) || size < 0) break;
    index = sizeEnd + 2;
    if (size === 0) break;
    body += rawBody.slice(index, index + size);
    index += size + 2;
  }
  return body || rawBody;
}

function readProxyResponse(socket: net.Socket) {
  return new Promise<string>((resolve, reject) => {
    let raw = "";
    const onData = (chunk: Buffer) => {
      raw += chunk.toString("latin1");
      if (raw.includes("\r\n\r\n")) {
        socket.off("data", onData);
        resolve(raw);
      }
    };
    socket.on("data", onData);
    socket.once("error", reject);
  });
}

async function postJsonViaHttpProxy(url: string, headers: Record<string, string>, body: unknown, proxyUrl: string, timeoutMs: number) {
  const target = new URL(url);
  const proxy = new URL(proxyUrl);
  if (proxy.protocol !== "http:") {
    throw new Error("Only HTTP proxy URLs are supported for insight AI requests.");
  }

  const requestBody = JSON.stringify(body);
  const proxySocket = net.connect(Number(proxy.port || 80), proxy.hostname);
  proxySocket.setTimeout(timeoutMs, () => proxySocket.destroy(socketTimeoutError("AI proxy request", timeoutMs)));
  await new Promise<void>((resolve, reject) => {
    proxySocket.once("connect", resolve);
    proxySocket.once("error", reject);
  });

  proxySocket.write(`CONNECT ${target.hostname}:443 HTTP/1.1\r\nHost: ${target.hostname}:443\r\n\r\n`);
  const proxyResponse = await readProxyResponse(proxySocket);
  if (!proxyResponse.startsWith("HTTP/1.1 200") && !proxyResponse.startsWith("HTTP/1.0 200")) {
    proxySocket.destroy();
    throw new Error(`Proxy CONNECT failed: ${proxyResponse.slice(0, 120)}`);
  }

  const secureSocket = tls.connect({ socket: proxySocket, servername: target.hostname });
  secureSocket.setTimeout(timeoutMs, () => secureSocket.destroy(socketTimeoutError("AI HTTPS request", timeoutMs)));
  await new Promise<void>((resolve, reject) => {
    secureSocket.once("secureConnect", resolve);
    secureSocket.once("error", reject);
  });

  const path = `${target.pathname}${target.search}`;
  const headerLines = Object.entries({
    Host: target.hostname,
    ...headers,
    "Content-Length": String(Buffer.byteLength(requestBody)),
    Connection: "close",
  })
    .map(([key, value]) => `${key}: ${value}`)
    .join("\r\n");

  secureSocket.write(`POST ${path} HTTP/1.1\r\n${headerLines}\r\n\r\n${requestBody}`);

  const rawResponse = await new Promise<string>((resolve, reject) => {
    let raw = "";
    secureSocket.setEncoding("utf8");
    secureSocket.on("data", (chunk) => {
      raw += chunk;
    });
    secureSocket.once("end", () => resolve(raw));
    secureSocket.once("error", reject);
  });
  const parsed = splitHttpResponse(rawResponse);

  return {
    ok: parsed.status >= 200 && parsed.status < 300,
    status: parsed.status,
    json: async () => JSON.parse(parsed.body || "{}"),
  };
}

export async function rewriteRecommendationsWithAiDetailed(
  recommendations: RecommendationSummary[],
  commentTextsByContentId: Map<string, string[]>,
  settings: AiRuntimeSettings,
): Promise<RecommendationAiRewriteResult> {
  if (!isConfigured(settings) || recommendations.length === 0) {
    return { recommendations, usedAi: false, errorMessage: null };
  }
  const runtime = readInsightAiRuntimeConfig(settings);

  const endpoint = `${normalizeBaseUrl(runtime.baseUrl)}/chat/completions`;
  const systemPrompt = resolveTopicRewritePrompt(settings);
  const inputItems = recommendations.map((item, itemIndex) => ({
    itemIndex,
    sampleSourceContentId: item.sampleSourceContentId,
    keyword: item.keyword,
    candidateTitle: item.title,
    candidateReason: item.reason,
    sampleTitle: item.sampleTitle,
    creator: item.creator,
    platform: item.platform,
    ...platformTitleGuide(item.platform),
    metrics: item.metrics,
    tags: item.tags,
    angles: item.angles,
    commentSnippets: (commentTextsByContentId.get(item.id) ?? []).slice(0, 3).map((text) => compactText(text, 80)),
  }));

  try {
    const response = await postJson(
      endpoint,
      {
        "Content-Type": "application/json",
        Authorization: `Bearer ${runtime.apiKey}`,
      },
      {
        model: runtime.model,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: JSON.stringify({
              instruction:
                "请基于真实样本、互动数据、评论痛点和每条 item 的 platform 生成平台化选题。保持 itemIndex 和 sampleSourceContentId 原样返回。每条必须输出 itemIndex、sampleSourceContentId、title、reason、angles、coverImagePrompt、coverNegativePrompt。title 要符合目标平台的 SEO、搜索意图或推荐流机制，不要直接复用 candidateTitle 或 sampleTitle。reason 必须结合 metrics/commentSnippets/candidateReason 中至少一个信号，并说明适合该平台分发的原因。angles 必须是 3 条可直接创作的内容方向。coverImagePrompt 必须可直接给 gpt-image-2 生成封面图，写清主体、场景、构图、光线、镜头/质感和留白位置，且不要要求图片模型生成中文文字。只返回 JSON，不要输出 Markdown。",
              platformRules: [
                "小红书：标题要有可搜索关键词、人群/场景/痛点和收藏价值，适合避坑、教程、测评、清单、真实体验。",
                "抖音：标题要服务推荐流首屏停留，短、强钩子、强结论，优先使用反差、误区纠正、结果可视化。",
                "B站：标题要服务搜索和长尾推荐，信息量更完整，适合教程、横评、复盘、深度测评，并说明对象和判断标准。",
                "微博：标题要有话题感、观点感或讨论点，便于评论转发，但不能制造虚假争议。",
              ],
              outputShape: {
                items: [
                  {
                    itemIndex: 0,
                    sampleSourceContentId: "content_001",
                    title: "新手底妆卡粉，先查这3步",
                    reason: "样本互动集中在卡粉和上妆顺序，评论痛点明确，小红书用户会搜索可收藏的排查清单。",
                    angles: ["拆成保湿、用量、定妆 3 个检查点", "半脸对比展示错误顺序和修正顺序", "整理评论区高频误区做新手避坑清单"],
                    coverImagePrompt:
                      "竖版小红书封面图，真实生活方式摄影，年轻亚洲女生半脸底妆对比，一侧轻微卡粉斑驳，一侧服帖自然，上方保留干净留白用于前端叠加中文标题，自然窗边柔光，高清真实皮肤纹理",
                    coverNegativePrompt: "不要生成中文文字，不要水印，不要品牌 logo，不要广告海报感，不要过度磨皮，不要低清晰度，不要畸形手部",
                  },
                ],
              },
              items: inputItems,
            }),
          },
        ],
        max_tokens: 2600,
        response_format: { type: "json_object" },
      },
      runtime.proxyUrl,
    );

    if (!response.ok) {
      return { recommendations, usedAi: false, errorMessage: `AI request failed with status ${response.status}` };
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      return { recommendations, usedAi: false, errorMessage: "AI response content is empty" };
    }

    const parsed = JSON.parse(content) as AiRewritePayload;
    const rewrittenItems = parsed.items ?? [];
    if (rewrittenItems.length === 0) {
      return { recommendations, usedAi: false, errorMessage: "AI response has no items" };
    }
    const bySourceId = new Map(
      rewrittenItems
        .filter((item) => item.sampleSourceContentId)
        .map((item) => [item.sampleSourceContentId!, item]),
    );
    const byIndex = new Map(
      rewrittenItems
        .filter((item) => Number.isInteger(item.itemIndex))
        .map((item) => [item.itemIndex!, item]),
    );

    let changedCount = 0;
    const rewrittenRecommendations = recommendations.map((item, index) => {
      const rewritten = bySourceId.get(item.sampleSourceContentId) ?? byIndex.get(index);
      if (!rewritten) return item;
      const rewrittenTitle = rewritten.title?.trim();
      const rewrittenReason = rewritten.reason?.trim();
      const rewrittenAngles =
        Array.isArray(rewritten.angles) && rewritten.angles.length > 0
          ? rewritten.angles.map((angle) => angle.trim()).filter(Boolean).slice(0, 3)
          : item.angles;
      const rewrittenCoverImagePrompt = rewritten.coverImagePrompt?.trim();
      const rewrittenCoverNegativePrompt = rewritten.coverNegativePrompt?.trim();
      const hasMeaningfulChange =
        textChanged(rewrittenTitle, item.title) ||
        textChanged(rewrittenReason, item.reason) ||
        stringListChanged(rewrittenAngles, item.angles) ||
        textChanged(rewrittenCoverImagePrompt, item.coverImagePrompt ?? "") ||
        textChanged(rewrittenCoverNegativePrompt, item.coverNegativePrompt ?? "");
      if (hasMeaningfulChange) changedCount += 1;

      return {
        ...item,
        title: rewrittenTitle || item.title,
        reason: rewrittenReason || item.reason,
        angles: rewrittenAngles,
        coverImagePrompt: rewrittenCoverImagePrompt || item.coverImagePrompt,
        coverNegativePrompt: rewrittenCoverNegativePrompt || item.coverNegativePrompt,
      };
    });

    return { recommendations: rewrittenRecommendations, usedAi: changedCount > 0, errorMessage: null };
  } catch (error) {
    return { recommendations, usedAi: false, errorMessage: error instanceof Error ? error.message : "AI rewrite failed" };
  }
}

export async function rewriteRecommendationsWithAi(
  recommendations: RecommendationSummary[],
  commentTextsByContentId: Map<string, string[]>,
  settings: AiRuntimeSettings,
) {
  const result = await rewriteRecommendationsWithAiDetailed(recommendations, commentTextsByContentId, settings);
  return result.recommendations;
}

function cleanLines(lines: string[]) {
  return lines.filter((line, index, list) => line || list[index - 1]).join("\n").trim();
}

function formatJsonValue(value: unknown) {
  if (value == null) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatGraphicScript(payload: GraphicScriptPayload | undefined, fallbackTitle: string, riskNotes: string[]) {
  const pages = payload?.noteStructure?.length
    ? payload.noteStructure
    : [
        {
          page: "封面",
          image: "真实使用场景或结果对比",
          imagePrompt: "竖版小红书封面图，真实生活方式摄影，干净桌面，两件同类物品形成对比，中间留出标题空白，柔和自然光，清爽构图",
          negativePrompt: "不要夸张广告风，不要杂乱背景，不要变形文字，不要低清晰度，不要过度磨皮",
          aspectRatio: "3:4",
          imageModelNotes: "标题文字建议由前端叠加，生图不要直接生成中文文字。",
          copy: "用一句强结论说明这篇图文解决什么问题",
          design: "大标题不超过 14 字，保留产品/场景主体",
        },
        {
          page: "第 2 页",
          image: "痛点场景",
          imagePrompt: "竖版真实生活场景图，展示用户遇到的具体痛点，主体清晰，背景简洁，保留上方或侧边留白用于排版，真实摄影质感",
          negativePrompt: "不要卡通风，不要营销海报风，不要虚假夸张表情，不要生成不可读文字",
          aspectRatio: "3:4",
          imageModelNotes: "用于承接封面后的痛点页，画面要比封面更具体。",
          copy: "解释为什么这个问题最近值得关注",
          design: "用 2-3 个短句拆开信息层级",
        },
        {
          page: "第 3 页",
          image: "步骤或细节 1",
          imagePrompt: "竖版教程步骤图，展示一个具体动作或关键细节，手部动作自然，物品摆放有序，画面留白适合加编号和箭头",
          negativePrompt: "不要复杂背景，不要多人抢主体，不要过曝，不要生成水印或品牌 logo",
          aspectRatio: "3:4",
          imageModelNotes: "适合前端叠加 01/02 编号和箭头标注。",
          copy: "给出第一个可执行动作或观察点",
          design: "用箭头/编号标注重点",
        },
        {
          page: "第 4 页",
          image: "步骤或细节 2",
          imagePrompt: "竖版对比图，同一场景下展示前后差异或优缺点对照，左右分区明确，主体一致，真实摄影风格",
          negativePrompt: "不要强烈滤镜，不要过度商业广告质感，不要文字乱码，不要画面拥挤",
          aspectRatio: "3:4",
          imageModelNotes: "适合前端叠加左右对比标签。",
          copy: "补充真实体验、避坑或对比",
          design: "把优缺点并排展示",
        },
        {
          page: "收尾页",
          image: "总结清单",
          imagePrompt: "竖版清单背景图，干净浅色背景，主体物品整齐摆放，下方或中间留出大面积空白，适合叠加 checklist 文案",
          negativePrompt: "不要复杂纹理，不要深色压抑背景，不要生成错误文字，不要低质感拼贴",
          aspectRatio: "3:4",
          imageModelNotes: "清单文字建议由前端叠加，保证可读性。",
          copy: "给出适合/不适合人群，并引导收藏评论",
          design: "做成可截图清单",
        },
      ];

  return cleanLines([
    "【图文脚本】",
    `选题标题：${payload?.title?.trim() || fallbackTitle}`,
    payload?.platform ? `适合平台：${payload.platform}` : "",
    payload?.objective ? `内容目标：${payload.objective}` : "",
    payload?.audience ? `目标人群：${payload.audience}` : "",
    payload?.coverText ? `封面文案：${payload.coverText}` : "",
    "",
    "图文分页结构：",
    ...pages.map((item, index) =>
      cleanLines([
        `${item.page || `第 ${index + 1} 页`}：`,
        item.image ? `画面：${item.image}` : "",
        item.imagePrompt ? `图片生成提示词：${item.imagePrompt}` : "",
        item.negativePrompt ? `负向提示词：${item.negativePrompt}` : "",
        item.aspectRatio ? `建议画幅：${item.aspectRatio}` : "",
        item.imageModelNotes ? `生图备注：${item.imageModelNotes}` : "",
        item.copy ? `正文：${item.copy}` : "",
        item.design ? `排版提示：${item.design}` : "",
      ]),
    ),
    "",
    payload?.caption ? `发布文案：${payload.caption}` : "",
    payload?.hashtags?.length ? `话题标签：${payload.hashtags.join(" ")}` : "",
    payload?.cta ? `互动引导：${payload.cta}` : "",
    ...(riskNotes.length ? ["", "风险提醒：", ...riskNotes.map((item) => `- ${item}`)] : []),
  ]);
}

function formatVideoScript(payload: VideoScriptPayload | undefined, fallbackTitle: string, riskNotes: string[]) {
  const voiceover = payload?.voiceover?.length
    ? payload.voiceover
    : [
        { timeRange: "0-3s", voiceId: "v01", section: "hook", text: "先抛出用户最关心的问题或反差结论。", targetDurationSec: 3, pauseAfterSec: 0.2, visualSectionId: "scene_01", emphasisWords: ["反差"] },
        { timeRange: "3-8s", voiceId: "v02", section: "pain", text: "说明为什么这个问题最近被频繁讨论。", targetDurationSec: 5, pauseAfterSec: 0.2, visualSectionId: "scene_02", emphasisWords: ["最近"] },
        { timeRange: "8-22s", voiceId: "v03", section: "process", text: "展示真实使用、对比或步骤，不要只讲结论。", targetDurationSec: 14, pauseAfterSec: 0.25, visualSectionId: "scene_03", emphasisWords: ["真实"] },
        { timeRange: "22-42s", voiceId: "v04", section: "proof", text: "补充评论痛点、关键细节和避坑提醒。", targetDurationSec: 20, pauseAfterSec: 0.25, visualSectionId: "scene_04", emphasisWords: ["避坑"] },
        { timeRange: "42-55s", voiceId: "v05", section: "cta", text: "总结适合和不适合人群，引导评论或收藏。", targetDurationSec: 13, pauseAfterSec: 0.3, visualSectionId: "scene_05", emphasisWords: ["适合"] },
      ];

  return cleanLines([
    "【视频脚本】",
    `选题标题：${payload?.title?.trim() || fallbackTitle}`,
    payload?.platform ? `适合平台：${payload.platform}` : "",
    payload?.objective ? `内容目标：${payload.objective}` : "",
    payload?.audience ? `目标人群：${payload.audience}` : "",
    payload?.hook ? `开场 Hook：${payload.hook}` : "",
    "",
    "content_script：",
    ...(payload?.contentScript ?? []).map((item) =>
      cleanLines([
        `- ${item.section || "section"}`,
        item.objective ? `  目标：${item.objective}` : "",
        item.coreMessage ? `  核心信息：${item.coreMessage}` : "",
        item.spokenDraft ? `  口播草稿：${item.spokenDraft}` : "",
      ]),
    ),
    "",
    "storyboard_script：",
    ...(payload?.storyboard ?? []).map((item) =>
      cleanLines([
        `- ${item.section || "scene"}`,
        item.visualGoal ? `  画面目标：${item.visualGoal}` : "",
        item.visualContent ? `  画面内容：${item.visualContent}` : "",
        item.assetNeeds ? `  素材需求：${item.assetNeeds}` : "",
        item.motionTransition ? `  转场/动作：${item.motionTransition}` : "",
      ]),
    ),
    "",
    "asset_script：",
    ...(payload?.assetScript ?? []).map((item) =>
      cleanLines([
        `- ${item.assetId || "asset"} / ${item.targetSection || "section"}`,
        item.assetType ? `  类型：${item.assetType}` : "",
        item.assetDescription ? `  描述：${item.assetDescription}` : "",
        item.sourceGuidance ? `  来源建议：${item.sourceGuidance}` : "",
        typeof item.required === "boolean" ? `  是否必需：${item.required ? "是" : "否"}` : "",
        item.fallbackPlan ? `  替代方案：${item.fallbackPlan}` : "",
      ]),
    ),
    "",
    "subtitle_voice_script：",
    ...(payload?.subtitleVoiceScript ?? []).map((item) =>
      cleanLines([
        `- ${item.section || "section"}`,
        item.sourceLines ? `  来源句：${item.sourceLines}` : "",
        item.voiceoverLines ? `  口播句：${item.voiceoverLines}` : "",
        item.subtitleChunks?.length ? `  字幕切分：${item.subtitleChunks.join(" / ")}` : "",
        item.emphasisWords?.length ? `  重读词：${item.emphasisWords.join("、")}` : "",
        item.pausesEmphasis ? `  停顿/强调：${item.pausesEmphasis}` : "",
        item.sfxNotes ? `  声效提示：${item.sfxNotes}` : "",
      ]),
    ),
    "",
    "voiceover_script（时间为 estimated，最终以 TTS 对齐为准）：",
    ...voiceover.map((item) =>
      cleanLines([
        `${item.timeRange || "estimated"} / ${item.voiceId || "v00"} / ${item.section || "section"}`,
        `口播：${item.text || ""}`,
        `目标时长：${item.targetDurationSec ?? "-"}s，停顿：${item.pauseAfterSec ?? 0}s，视觉段落：${item.visualSectionId || "-"}`,
        item.emphasisWords?.length ? `重读词：${item.emphasisWords.join("、")}` : "",
        `timing_status：${item.timingStatus || "estimated"}`,
      ]),
    ),
    "",
    "audio_plan：",
    ...(payload?.audioPlan ?? []).map((item) =>
      cleanLines([
        `${item.timeRange || "estimated"} / ${item.section || "section"}`,
        item.voiceStrategy ? `人声策略：${item.voiceStrategy}` : "",
        item.bgmStrategy ? `BGM：${item.bgmStrategy}` : "",
        item.sfxStrategy ? `SFX：${item.sfxStrategy}` : "",
        item.silencePauses ? `留白/停顿：${item.silencePauses}` : "",
        item.mixRelation ? `混音关系：${item.mixRelation}` : "",
      ]),
    ),
    "",
    payload?.sfxBgmMap ? `sfx_bgm_map：\n${formatJsonValue(payload.sfxBgmMap)}` : "",
    "",
    "visual_script.vertical：",
    ...(payload?.visualScriptVertical ?? []).map((item) =>
      cleanLines([
        `- ${item.visualId || "visual"} / ${item.targetSection || "section"}`,
        item.visualGoal ? `  视觉目标：${item.visualGoal}` : "",
        item.layoutStructure ? `  布局结构：${item.layoutStructure}` : "",
        item.visualHierarchy ? `  信息层级：${item.visualHierarchy}` : "",
        item.primaryElements ? `  主要元素：${item.primaryElements}` : "",
        item.stylePalette ? `  视觉风格：${item.stylePalette}` : "",
      ]),
    ),
    "",
    "react_page_script.vertical：",
    ...(payload?.reactPageScriptVertical ?? []).map((item) =>
      cleanLines([
        `- ${item.sceneId || "scene"} / ${item.componentName || "Component"}`,
        item.inputFields ? `  输入字段：${item.inputFields}` : "",
        item.layoutStructure ? `  布局结构：${item.layoutStructure}` : "",
        item.animationPresets ? `  动画预设：${item.animationPresets}` : "",
        item.assetSlots ? `  素材槽：${item.assetSlots}` : "",
        item.responsiveRules ? `  适配规则：${item.responsiveRules}` : "",
      ]),
    ),
    "",
    "timeline_script：",
    ...(payload?.timeline ?? []).map((item) =>
      cleanLines([
        `${item.timeRange || "estimated"}：${item.scene || "scene"}`,
        item.visualDescription ? `画面：${item.visualDescription}` : "",
        item.audioDescription ? `声音：${item.audioDescription}` : "",
        item.notes ? `备注：${item.notes}` : "",
      ]),
    ),
    "",
    "formal_script.vertical：",
    ...(payload?.formalScriptVertical ?? []).map((item) =>
      cleanLines([
        `${item.timeRange || "estimated"} / ${item.section || "section"}`,
        item.visualDescription ? `画面说明：${item.visualDescription}` : "",
        item.audioDescription ? `声音说明：${item.audioDescription}` : "",
        item.notes ? `备注：${item.notes}` : "",
      ]),
    ),
    "",
    payload?.caption ? `发布文案：${payload.caption}` : "",
    payload?.cta ? `CTA：${payload.cta}` : "",
    ...(riskNotes.length ? ["", "风险提醒：", ...riskNotes.map((item) => `- ${item}`)] : []),
  ]);
}

async function requestCreatorScriptPayload<T>({
  endpoint,
  apiKey,
  model,
  proxyUrl,
  systemPrompt,
  instruction,
  input,
  maxTokens,
}: {
  endpoint: string;
  apiKey: string;
  model: string;
  proxyUrl: string;
  systemPrompt: string;
  instruction: string;
  input: CreatorScriptInput;
  maxTokens: number;
}) {
  const response = await postJson(
    endpoint,
    {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: JSON.stringify({ instruction, input }),
        },
      ],
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    },
    proxyUrl,
  );

  if (!response.ok) return null;
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) return null;
  return JSON.parse(content) as T;
}

export async function requestInsightAiJson<T>({
  settings,
  systemPrompt,
  instruction,
  input,
  maxTokens,
}: {
  settings: InsightAiRequestSettings;
  systemPrompt: string;
  instruction: string;
  input: unknown;
  maxTokens: number;
}) {
  const result = await requestInsightAiJsonDetailed<T>({ settings, systemPrompt, instruction, input, maxTokens });
  return result.parsed;
}

function extractJsonObject(content: string) {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  if (cleaned.startsWith("{") && cleaned.endsWith("}")) return cleaned;
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) return cleaned.slice(start, end + 1);
  return cleaned;
}

export type InsightAiJsonDetailedResult<T> = {
  parsed: T | null;
  rawContent: string;
  status: number | null;
  errorMessage: string | null;
  responseBody?: unknown;
};

export async function requestInsightAiJsonDetailed<T>({
  settings,
  systemPrompt,
  instruction,
  input,
  maxTokens,
  timeoutMs = DEFAULT_AI_POST_TIMEOUT_MS,
}: {
  settings: InsightAiRequestSettings;
  systemPrompt: string;
  instruction: string;
  input: unknown;
  maxTokens: number;
  timeoutMs?: number;
}): Promise<InsightAiJsonDetailedResult<T>> {
  if (!isConfigured(settings)) {
    return { parsed: null, rawContent: "", status: null, errorMessage: "AI 未配置或未启用。" };
  }
  const runtime = readInsightAiRuntimeConfig(settings);
  const endpoint = `${normalizeBaseUrl(runtime.baseUrl)}/chat/completions`;
  let response: Awaited<ReturnType<typeof postJson>>;
  try {
    response = await postJson(
      endpoint,
      {
        "Content-Type": "application/json",
        Authorization: `Bearer ${runtime.apiKey}`,
      },
      {
        model: runtime.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify({ instruction, input }) },
        ],
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
      },
      runtime.proxyUrl,
      timeoutMs,
    );
  } catch (error) {
    return {
      parsed: null,
      rawContent: "",
      status: null,
      errorMessage: formatInsightAiRequestError(error, timeoutMs),
    };
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    return {
      parsed: null,
      rawContent: "",
      status: response.status,
      errorMessage: formatInsightAiHttpError(response.status, data),
      responseBody: data,
    };
  }
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    return { parsed: null, rawContent: "", status: response.status, errorMessage: "AI 返回内容为空。", responseBody: data };
  }

  try {
    return {
      parsed: JSON.parse(extractJsonObject(content)) as T,
      rawContent: content,
      status: response.status,
      errorMessage: null,
      responseBody: data,
    };
  } catch (error) {
    return {
      parsed: null,
      rawContent: content,
      status: response.status,
      errorMessage: error instanceof Error ? error.message : "AI JSON 解析失败。",
      responseBody: data,
    };
  }
}

export async function generateCreatorScriptWithAi(settings: AiRuntimeSettings, input: CreatorScriptInput, fallbackPack: CreatorScriptPack) {
  if (!isConfigured(settings)) return fallbackPack;
  const runtime = readInsightAiRuntimeConfig(settings);
  const endpoint = `${normalizeBaseUrl(runtime.baseUrl)}/chat/completions`;
  const sharedInput = {
    ...input,
    productionDefaults: {
      language: "zh-CN",
      durationSec: 60,
      targetPlatforms: [input.platformLabel],
      subtitleRequired: true,
      voiceRequired: true,
    },
  };

  const graphicInstruction =
    `请只生成 graphic 图文脚本，返回严格 JSON：{"graphic":{"title":"string","platform":"string","objective":"string","audience":"string","coverText":"string","noteStructure":[{"page":"string","image":"string","imagePrompt":"string","negativePrompt":"string","aspectRatio":"string","imageModelNotes":"string","copy":"string","design":"string"}],"caption":"string","hashtags":["string"],"cta":"string"},"riskNotes":["string"]}。noteStructure 必须 6-8 页，分别覆盖封面、痛点、核心观点、步骤/体验、证据/评论洞察、避坑、总结/互动。每页必须同时给出给人看的 image 拍摄/素材建议，以及给图片生成模型使用的 imagePrompt、negativePrompt、aspectRatio、imageModelNotes。imagePrompt 要具体到主体、场景、构图、光线、风格、留白位置；不要让图片模型直接生成中文文字，文字由前端叠加。适合小红书图文发布，不要输出视频分镜。`;
  const videoInstruction =
    `请只生成 video 视频脚本，返回严格 JSON：{"video":{"title":"string","platform":"string","objective":"string","audience":"string","hook":"string","contentScript":[...],"storyboard":[...],"assetScript":[...],"subtitleVoiceScript":[...],"voiceover":[...],"audioPlan":[...],"sfxBgmMap":{"bgm":{},"sfx":[],"duckingRules":{}},"visualScriptVertical":[...],"reactPageScriptVertical":[...],"timeline":[...],"formalScriptVertical":[...],"caption":"string","cta":"string"},"riskNotes":["string"]}。严格参考 video-script-maker：先共享层 content_script、storyboard_script、asset_script、subtitle_voice_script，再 audio 层 voiceover_script、audio_plan、sfx_bgm_map，再 9:16 vertical 层 visual_script、react_page_script、timeline_script、formal_script。voiceover 每条必须有 timeRange、voiceId、section、text、targetDurationSec、pauseAfterSec、visualSectionId、emphasisWords、timingStatus，timingStatus 固定 estimated。视频总长 45-75 秒，6-8 段。`;

  try {
    const [graphicPayload, videoPayload] = await Promise.all([
      requestCreatorScriptPayload<Pick<CreatorScriptPayload, "graphic" | "riskNotes">>({
        endpoint,
        apiKey: runtime.apiKey,
        model: runtime.model,
        proxyUrl: runtime.proxyUrl,
        systemPrompt: settings.insightAiGraphicScriptSystemPrompt?.trim() || settings.insightAiScriptSystemPrompt?.trim() || DEFAULT_INSIGHT_AI_GRAPHIC_SCRIPT_PROMPT,
        instruction: graphicInstruction,
        input: sharedInput,
        maxTokens: 4200,
      }).catch(() => null),
      requestCreatorScriptPayload<Pick<CreatorScriptPayload, "video" | "riskNotes">>({
        endpoint,
        apiKey: runtime.apiKey,
        model: runtime.model,
        proxyUrl: runtime.proxyUrl,
        systemPrompt: settings.insightAiVideoScriptSystemPrompt?.trim() || settings.insightAiScriptSystemPrompt?.trim() || DEFAULT_INSIGHT_AI_VIDEO_SCRIPT_PROMPT,
        instruction: videoInstruction,
        input: sharedInput,
        maxTokens: 5200,
      }).catch(() => null),
    ]);

    const graphicScriptText = graphicPayload?.graphic ? formatGraphicScript(graphicPayload.graphic, input.title, graphicPayload.riskNotes ?? []) : fallbackPack.graphicScriptText;
    const videoScriptText = videoPayload?.video ? formatVideoScript(videoPayload.video, input.title, videoPayload.riskNotes ?? []) : fallbackPack.videoScriptText;
    return {
      graphicScriptText,
      videoScriptText,
      scriptText: `${graphicScriptText}

${videoScriptText}`,
    };
  } catch {
    return fallbackPack;
  }
}
