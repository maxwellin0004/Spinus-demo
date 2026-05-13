import type { PlatformSettings } from "@prisma/client";
import net from "node:net";
import tls from "node:tls";
import type { RecommendationSummary } from "@/lib/insights/analysis";

type AiRewritePayload = {
  items?: Array<{
    itemIndex?: number;
    sampleSourceContentId?: string;
    title?: string;
    reason?: string;
    angles?: string[];
  }>;
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function readRuntimeConfig() {
  return {
    baseUrl: process.env.INSIGHT_AI_BASE_URL?.trim() ?? "",
    apiKey: process.env.INSIGHT_AI_API_KEY?.trim() ?? "",
    model: process.env.INSIGHT_AI_MODEL?.trim() || "chatgpt-4o-latest",
    proxyUrl: process.env.HTTPS_PROXY?.trim() || process.env.HTTP_PROXY?.trim() || "",
  };
}

function isConfigured(settings: Pick<PlatformSettings, "insightAiEnabled">) {
  const runtime = readRuntimeConfig();
  return settings.insightAiEnabled && Boolean(runtime.baseUrl) && Boolean(runtime.apiKey) && Boolean(runtime.model);
}

function compactText(value: string, limit: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, limit);
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

async function postJson(url: string, headers: Record<string, string>, body: unknown, proxyUrl: string) {
  if (!proxyUrl) {
    return fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
  }

  return postJsonViaHttpProxy(url, headers, body, proxyUrl);
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

async function postJsonViaHttpProxy(url: string, headers: Record<string, string>, body: unknown, proxyUrl: string) {
  const target = new URL(url);
  const proxy = new URL(proxyUrl);
  if (proxy.protocol !== "http:") {
    throw new Error("Only HTTP proxy URLs are supported for insight AI requests.");
  }

  const requestBody = JSON.stringify(body);
  const proxySocket = net.connect(Number(proxy.port || 80), proxy.hostname);
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

export async function rewriteRecommendationsWithAi(
  recommendations: RecommendationSummary[],
  commentTextsByContentId: Map<string, string[]>,
  settings: Pick<PlatformSettings, "insightAiEnabled" | "insightAiSystemPrompt">,
) {
  if (!isConfigured(settings) || recommendations.length === 0) return recommendations;
  const runtime = readRuntimeConfig();

  const endpoint = `${normalizeBaseUrl(runtime.baseUrl)}/responses`;
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
        instructions: settings.insightAiSystemPrompt,
        input: JSON.stringify({
          instruction:
            "请重写这些达人选题。保持 itemIndex 和 sampleSourceContentId 原样返回。每条必须输出 itemIndex、sampleSourceContentId、title、reason、angles。title 不超过 22 个中文字符，reason 一句话，angles 保留 3 条。必须严格匹配每条 item 的 platformLabel 和 titleStyle；title 和 angles 要像该平台真实创作者会发布的标题，不要生成跨平台通用标题，不要直接复用 candidateTitle。只返回 JSON，不要输出 Markdown。",
          platformRules: [
            "小红书：标题要像种草、避坑、教程、测评笔记，口语化，有具体使用场景或痛点。",
            "抖音：标题要短、强钩子、强结果感，适合视频首屏和短视频推荐流。",
            "B站：标题可以更完整，偏教程、横评、复盘、深度测评。",
            "微博：标题要有话题感、观点感或争议点，便于讨论转发。",
          ],
          items: inputItems,
        }),
        max_output_tokens: 1600,
        text: { format: { type: "json_object" } },
      },
      runtime.proxyUrl,
    );

    if (!response.ok) return recommendations;

    const data = await response.json();
    const content =
      data?.output_text ??
      data?.output
        ?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content ?? [])
        ?.map((item: { text?: string }) => item.text ?? "")
        ?.join("");
    if (typeof content !== "string" || !content.trim()) return recommendations;

    const parsed = JSON.parse(content) as AiRewritePayload;
    const bySourceId = new Map(
      (parsed.items ?? [])
        .filter((item) => item.sampleSourceContentId)
        .map((item) => [item.sampleSourceContentId!, item]),
    );
    const byIndex = new Map(
      (parsed.items ?? [])
        .filter((item) => Number.isInteger(item.itemIndex))
        .map((item) => [item.itemIndex!, item]),
    );

    return recommendations.map((item, index) => {
      const rewritten = bySourceId.get(item.sampleSourceContentId) ?? byIndex.get(index);
      if (!rewritten) return item;

      return {
        ...item,
        title: rewritten.title?.trim() || item.title,
        reason: rewritten.reason?.trim() || item.reason,
        angles:
          Array.isArray(rewritten.angles) && rewritten.angles.length > 0
            ? rewritten.angles.map((angle) => angle.trim()).filter(Boolean).slice(0, 3)
            : item.angles,
      };
    });
  } catch {
    return recommendations;
  }
}
