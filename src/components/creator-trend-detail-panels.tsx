"use client";

import Image from "next/image";
import { FileText, Loader2, RefreshCw, Trash2 } from "lucide-react";
import type { KeyboardEvent, MouseEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CopyScriptButton } from "@/components/copy-script-button";
import { useCreatorTrendFilters } from "@/components/creator-trends-interactive";
import { ScriptGenerationDrawer, ScriptGenerationWorkspace, type PendingScriptGeneration } from "@/components/script-generation-viewer";
import { saveCreatorTrendAction, updateCreatorSavedTrendAction } from "@/lib/actions";
import { formatInsightUpdatedAt, type InsightConfidence } from "@/lib/insights/credibility";
import type { CreatorTrendDetailData, DraftPoolItem, SourceKind, TopicCard, WatchPoolItem } from "@/lib/insights/creator-trend-detail";
import type { ScriptGenerationView, ScriptSourceType } from "@/lib/insights/script-tables";
import { cn } from "@/lib/utils";

type Props = {
  initialBatch?: string;
  initialRec?: string;
  initialPool?: string;
  savedTrends?: SavedTrend[];
};

type SavedTrend = {
  id: string;
  title: string;
  topic: string | null;
  platform: string | null;
  status: string;
  reason: string | null;
  updatedAt: string;
};

const DETAIL_CACHE_TTL_MS = 90_000;
const DETAIL_REQUEST_TIMEOUT_MS = 120_000;
const TOPIC_COVER_IMAGE_TIMEOUT_MS = 90_000;
const detailCache = new Map<string, { data: CreatorTrendDetailData; expiresAt: number }>();
const inflightRequests = new Map<string, Promise<CreatorTrendDetailData>>();

type ScriptGeneratePayload = {
  sourceType: ScriptSourceType;
  sourceKey: string;
  sourceTitle: string;
  platform?: string | null;
  platformLabel: string;
  directionLabel: string;
  topic?: TopicCard | null;
  caseStudy?: CreatorTrendDetailData["caseStudy"] | null;
};

type TopicCoverImageState = {
  status: "loading" | "ready" | "failed";
  imageUrl: string | null;
};

function useDebouncedValue(value: string, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, value]);

  return debounced;
}

function formatAiErrorForUser(message?: string | null) {
  if (!message) return "当前没有可展示的 AI 选题，请重新生成。";
  const timeoutMatch = message.match(/timed out after\s+(\d+)ms/i);
  if (timeoutMatch?.[1]) {
    return `AI 模型响应超时（约 ${Math.round(Number(timeoutMatch[1]) / 1000)} 秒），请稍后重新生成，或在 Admin 中切换到更快的模型。`;
  }
  if (/timeout|超时/i.test(message)) {
    return "AI 模型响应超时，请稍后重新生成，或在 Admin 中切换到更快的模型。";
  }
  if (/fetch failed|网关连接失败|ENOTFOUND|ECONNRESET|ECONNREFUSED/i.test(message)) {
    return "AI 网关连接失败，请检查 Base URL、API Key、代理或网络连通性。";
  }
  return message;
}

function readCachedDetail(key: string) {
  const cached = detailCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    detailCache.delete(key);
    return null;
  }
  return cached.data;
}

function writeCachedDetail(key: string, data: CreatorTrendDetailData) {
  detailCache.set(key, { data, expiresAt: Date.now() + DETAIL_CACHE_TTL_MS });
}

function requestDetail(url: string, key: string, signal: AbortSignal, options: { bypassCache?: boolean } = {}) {
  if (!options.bypassCache) {
    const cached = readCachedDetail(key);
    if (cached) return Promise.resolve(cached);
    const inflight = inflightRequests.get(key);
    if (inflight) return inflight;
  }

  const request = fetch(url, { signal, cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) throw new Error(`detail request failed: ${response.status}`);
      return response.json() as Promise<CreatorTrendDetailData>;
    })
    .then((next) => {
      writeCachedDetail(key, next);
      return next;
    })
    .finally(() => {
      if (!options.bypassCache) {
        inflightRequests.delete(key);
      }
    });

  if (!options.bypassCache) {
    inflightRequests.set(key, request);
  }
  return request;
}

function stageClass(stage: TopicCard["stage"]) {
  if (stage === "爆发中") return "border-red-100 bg-red-50 text-red-600";
  return "border-orange-100 bg-orange-50 text-orange-600";
}

function sourceClass(kind: SourceKind) {
  if (kind === "真实采集") return "border-teal-200 bg-teal-50 text-teal-700";
  if (kind === "AI生成") return "border-violet-200 bg-violet-50 text-violet-700";
  if (kind === "规则计算") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-slate-200 bg-slate-50 text-slate-500";
}

function confidenceClass(confidence: InsightConfidence | undefined) {
  if (confidence === "高可信") return "border-teal-200 bg-teal-50 text-teal-700";
  if (confidence === "中可信") return "border-blue-200 bg-blue-50 text-blue-700";
  if (confidence === "低可信") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-500";
}

function poolStatusClass(status: WatchPoolItem["status"] | DraftPoolItem["status"]) {
  if (status === "升温中" || status === "可创作") return "border-teal-200 bg-teal-50 text-teal-700";
  if (status === "已过热") return "border-red-200 bg-red-50 text-red-600";
  return "border-slate-200 bg-slate-50 text-slate-500";
}

function positiveBatchIndex(value: string | undefined, size: number) {
  if (size <= 0) return 0;
  const parsed = Number.parseInt(value ?? "0", 10);
  if (!Number.isFinite(parsed)) return 0;
  return Math.abs(parsed) % size;
}

function replaceMetaUrl(filters: { range: string; platform: string; direction: string; scenario: string; keyword: string }, batch: string, rec: string, pool: string) {
  const params = new URLSearchParams();
  if (filters.range !== "7d") params.set("range", filters.range);
  if (filters.platform !== "all") params.set("platform", filters.platform);
  if (filters.direction !== "beauty") params.set("direction", filters.direction);
  if (filters.scenario !== "creator_ops") params.set("scenario", filters.scenario);
  if (filters.keyword.trim()) params.set("keyword", filters.keyword.trim());
  if (batch && batch !== "0") params.set("batch", batch);
  if (rec) params.set("rec", rec);
  if (pool === "draft") params.set("pool", pool);
  const query = params.toString();
  window.history.replaceState(null, "", `/creator/trends${query ? `?${query}` : ""}#workflow`);
}

function scriptRecordKey(sourceType: ScriptSourceType, sourceKey: string) {
  return `${sourceType}:${sourceKey}`;
}

function topicScriptSource(item: TopicCard) {
  return {
    sourceType: "TOPIC_RECOMMENDATION" as const,
    sourceKey: item.sampleSourceContentId ?? item.id ?? item.title,
  };
}

function topicImageKey(item: TopicCard) {
  return `${item.sampleSourceContentId ?? item.id ?? item.title}:${item.title}`;
}

function caseScriptSource(filters: { direction: string; platform: string }, caseStudy: CreatorTrendDetailData["caseStudy"]) {
  return {
    sourceType: "CASE_STUDY" as const,
    sourceKey: `${filters.direction}:${filters.platform}:${caseStudy.title}`,
  };
}

function platformDisplay(value: string | null | undefined) {
  const map: Record<string, string> = {
    all: "全部平台",
    xiaohongshu: "小红书",
    douyin: "抖音",
    weibo: "微博",
    bilibili: "B站",
  };
  return value ? map[value] ?? value : "全部平台";
}

function SourceBadge({ kind }: { kind: SourceKind }) {
  return <span className={cn("rounded-full border px-2.5 py-1 text-xs font-black", sourceClass(kind))}>{kind}</span>;
}

function PlatformBadge({ label }: { label: string }) {
  const map: Record<string, string> = {
    小红书: "bg-red-500 text-white",
    抖音: "bg-stone-950 text-white",
    B站: "bg-pink-500 text-white",
    微博: "bg-amber-400 text-white",
  };
  return <span className={cn("inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-[0.62rem] font-black", map[label] ?? "bg-stone-100 text-stone-700")}>{label.slice(0, 2)}</span>;
}

function savedStatusLabel(status: string) {
  if (status === "PLANNED") return "准备做";
  if (status === "PUBLISHED") return "已发布";
  if (status === "DROPPED") return "放弃";
  return "已收藏";
}

const workflowSteps = [
  { label: "发现热点", hint: "筛选方向和平台" },
  { label: "AI 选题", hint: "挑选可执行角度" },
  { label: "爆款拆解", hint: "确认内容结构" },
  { label: "生成脚本", hint: "进入图文/视频生产" },
];

const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:border-teal-200 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-60";

const accentButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-black text-teal-700 shadow-sm transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50";

const primaryButtonClass =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-base font-black text-white shadow-[0_12px_28px_rgba(15,23,42,0.14)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60";

function recommendationStatusLabel(data: CreatorTrendDetailData | null, loading: boolean, error: string | null) {
  if (loading) return "AI 选题加载中";
  if (error) return "AI 选题加载失败";
  if (!data) return "暂无 AI 选题";
  if (data.recommendationStatus === "FAILED") return "AI 选题生成失败";
  if (data.recommendationStatus === "PARTIAL") return "AI 选题补全中";
  if (data.recommendationNeedsRefresh) return "AI 选题建议刷新";
  return "AI 选题已就绪";
}

export function CreatorTrendDetailPanels({ initialBatch, initialPool, savedTrends = [] }: Props) {
  const { filters, currentDirection, setFilters } = useCreatorTrendFilters();
  const [data, setData] = useState<CreatorTrendDetailData | null>(null);
  const [lastResolvedKey, setLastResolvedKey] = useState("");
  const [batch, setBatch] = useState(initialBatch ?? "0");
  const [poolView, setPoolView] = useState(initialPool === "draft" ? "draft" : "watch");
  const [detailError, setDetailError] = useState<string | null>(null);
  const [scriptRecords, setScriptRecords] = useState<Record<string, ScriptGenerationView>>({});
  const [topicCoverImages, setTopicCoverImages] = useState<Record<string, TopicCoverImageState>>({});
  const requestedTopicCoverImageKeys = useRef(new Set<string>());
  const requestedCompletionKeys = useRef(new Set<string>());
  const [openScriptRecord, setOpenScriptRecord] = useState<ScriptGenerationView | null>(null);
  const [openScriptPayload, setOpenScriptPayload] = useState<ScriptGeneratePayload | null>(null);
  const [generatingScriptKey, setGeneratingScriptKey] = useState<string | null>(null);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [regeneratingRecommendations, setRegeneratingRecommendations] = useState(false);
  const debouncedKeyword = useDebouncedValue(filters.keyword.trim(), 220);
  const requestKey = `${filters.direction}|${filters.platform}|${debouncedKeyword}`;
  const requestUrl = useMemo(
    () =>
      `/api/creator/trends/detail?direction=${encodeURIComponent(filters.direction)}&platform=${encodeURIComponent(filters.platform)}&keyword=${encodeURIComponent(
        debouncedKeyword,
      )}`,
    [debouncedKeyword, filters.direction, filters.platform],
  );

  useEffect(() => {
    const controller = new AbortController();
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, DETAIL_REQUEST_TIMEOUT_MS);
    void requestDetail(requestUrl, requestKey, controller.signal)
      .then((next) => {
        if (controller.signal.aborted) return;
        setData(next);
        setDetailError(null);
        setLastResolvedKey(requestKey);
      })
      .catch((error) => {
        if (controller.signal.aborted && !timedOut) return;
        if (controller.signal.aborted && timedOut) {
          setData(null);
          setDetailError("详情接口响应超时，请稍后重试，AI 选题首次生成可能需要更久。");
          setLastResolvedKey(requestKey);
          return;
        }
        console.error(error);
        setData(null);
        setDetailError(timedOut ? "详情接口响应超时，请稍后重试，AI 选题首次生成可能需要更久。" : error instanceof Error ? error.message : "热点详情加载失败");
        setLastResolvedKey(requestKey);
      });
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [requestKey, requestUrl]);

  useEffect(() => {
    requestedTopicCoverImageKeys.current.clear();
    const timeout = window.setTimeout(() => setTopicCoverImages({}), 0);
    return () => window.clearTimeout(timeout);
  }, [requestKey]);

  const batchCount = data?.recommendationBatches.length ?? 0;
  const activeBatchIndex = positiveBatchIndex(batch, batchCount);
  const activeNextBatchIndex = batchCount > 1 ? (activeBatchIndex + 1) % batchCount : 0;
  const activeRecommendations = useMemo(() => data?.recommendationBatches[activeBatchIndex] ?? [], [activeBatchIndex, data]);
  const recommendationItemCount = data?.recommendationBatches.reduce((sum, group) => sum + group.length, 0) ?? 0;
  const partialCompletionKey =
    data?.recommendationStatus === "PARTIAL" || data?.recommendationNeedsRefresh
      ? `${requestKey}|${data.recommendationGeneratedAt ?? ""}|${recommendationItemCount}|${data.recommendationCacheSource ?? "none"}`
      : "";
  const activeDraftPool = data?.draftPools[activeBatchIndex] ?? [];
  const loading = lastResolvedKey !== requestKey;
  const caseSource = data?.caseStudy ? caseScriptSource(filters, data.caseStudy) : null;

  function resolvedCoverImageUrl(item: TopicCard) {
    return topicCoverImages[topicImageKey(item)]?.imageUrl || null;
  }

  function topicCoverStatus(item: TopicCard) {
    return topicCoverImages[topicImageKey(item)]?.status ?? (item.coverImagePrompt ? "loading" : "failed");
  }

  const requestTopicCoverImage = useCallback(
    async (item: TopicCard) => {
      const key = topicImageKey(item);
      if (!item.coverImagePrompt?.trim()) {
        setTopicCoverImages((current) => ({
          ...current,
          [key]: { status: "failed", imageUrl: null },
        }));
        return;
      }

      requestedTopicCoverImageKeys.current.add(key);
      setTopicCoverImages((current) => ({
        ...current,
        [key]: { status: "loading", imageUrl: null },
      }));

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), TOPIC_COVER_IMAGE_TIMEOUT_MS);
      try {
        const response = await fetch("/api/creator/trends/topic-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            sourceContentId: item.sampleSourceContentId ?? item.id ?? "",
            sourceTitle: item.title,
            platform: item.platform ?? item.tags[1] ?? filters.platform,
            prompt: item.coverImagePrompt,
            negativePrompt: item.coverNegativePrompt,
            fallbackImageUrl: null,
          }),
        });
        const payload = (await response.json().catch(() => ({}))) as { imageUrl?: string | null };
        setTopicCoverImages((current) => ({
          ...current,
          [key]: {
            status: response.ok && payload.imageUrl ? "ready" : "failed",
            imageUrl: payload.imageUrl ?? null,
          },
        }));
      } catch {
        setTopicCoverImages((current) => ({
          ...current,
          [key]: { status: "failed", imageUrl: null },
        }));
      } finally {
        window.clearTimeout(timeout);
      }
    },
    [filters.platform],
  );

  function topicCoverNode(item: TopicCard, heightClass = "h-24", sizes = "160px", options: { nestedInButton?: boolean } = {}) {
    const imageUrl = resolvedCoverImageUrl(item);
    const status = topicCoverStatus(item);
    const canRetry = status === "failed" && Boolean(item.coverImagePrompt?.trim());
    const retryClassName =
      "mt-1 inline-flex items-center justify-center gap-1 rounded-md border border-teal-200 bg-white/90 px-2 py-1 text-[0.66rem] font-black text-teal-700 shadow-sm transition hover:bg-teal-50";
    const retryCover = (event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      void requestTopicCoverImage(item);
    };
    return (
      <div className={cn("relative overflow-hidden rounded-lg border border-slate-100 bg-slate-50", heightClass)}>
        {imageUrl ? <Image alt={item.title} className="object-contain p-1" fill sizes={sizes} src={imageUrl} unoptimized /> : null}
        {!imageUrl ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/55 px-2 text-center text-[0.68rem] font-black text-teal-800">
            {status === "loading" ? <Loader2 className="animate-spin" size={18} /> : <FileText size={17} />}
            {status === "failed" ? <span>AI 封面生成失败</span> : null}
            {status === "loading" ? <span>AI 封面生成中</span> : null}
            {canRetry && options.nestedInButton ? (
              <span
                className={retryClassName}
                role="button"
                tabIndex={0}
                onClick={retryCover}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") retryCover(event);
                }}
              >
                <RefreshCw size={12} />
                重新生成封面
              </span>
            ) : null}
            {canRetry && !options.nestedInButton ? (
              <button className={retryClassName} type="button" onClick={retryCover}>
                <RefreshCw size={12} />
                重新生成封面
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  useEffect(() => {
    replaceMetaUrl(filters, String(activeBatchIndex), "", poolView);
  }, [activeBatchIndex, filters, poolView]);

  useEffect(() => {
    if (loading || !data) return;
    const sources = [
      ...activeRecommendations.map(topicScriptSource),
      ...(data.caseStudy ? [caseScriptSource(filters, data.caseStudy)] : []),
    ];
    if (sources.length === 0) return;

    let active = true;
    void fetch("/api/creator/trends/scripts/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sources }),
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json() as Promise<{ records?: ScriptGenerationView[] }>;
      })
      .then((payload) => {
        if (!active || !payload?.records) return;
        setScriptRecords((current) => {
          const next = { ...current };
          for (const record of payload.records ?? []) {
            next[scriptRecordKey(record.sourceType, record.sourceKey)] = record;
          }
          return next;
        });
      })
      .catch((error) => console.error(error));

    return () => {
      active = false;
    };
  }, [activeRecommendations, data, filters, loading]);

  useEffect(() => {
    if (loading || activeRecommendations.length === 0) return;
    for (const item of activeRecommendations) {
      if (!item.coverImagePrompt?.trim()) continue;
      const key = topicImageKey(item);
      if (requestedTopicCoverImageKeys.current.has(key)) continue;
      void requestTopicCoverImage(item);
    }
  }, [activeRecommendations, loading, requestTopicCoverImage]);

  useEffect(() => {
    if (!data || (data.recommendationStatus !== "PARTIAL" && !data.recommendationNeedsRefresh) || !partialCompletionKey) return;
    let active = true;

    if (!requestedCompletionKeys.current.has(partialCompletionKey)) {
      requestedCompletionKeys.current.add(partialCompletionKey);
      void fetch("/api/creator/trends/recommendations/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction: filters.direction,
          platform: filters.platform,
          keyword: debouncedKeyword,
        }),
      })
        .then(async (response) => {
          const result = (await response.json().catch(() => ({}))) as { data?: CreatorTrendDetailData };
          if (!active || !response.ok || !result.data) return;
          setData(result.data);
          writeCachedDetail(requestKey, result.data);
          if (result.data.recommendationStatus === "READY" && !result.data.recommendationNeedsRefresh) {
            setTopicCoverImages({});
            requestedTopicCoverImageKeys.current.clear();
          }
        })
        .catch((error) => console.error(error));
    }

    const interval = window.setInterval(() => {
      const controller = new AbortController();
      const pollUrl = `${requestUrl}&partialPoll=${Date.now()}`;
      void requestDetail(pollUrl, requestKey, controller.signal, { bypassCache: true })
        .then((next) => {
          if (!active) return;
          setData(next);
          setDetailError(null);
          setLastResolvedKey(requestKey);
          if (next.recommendationStatus !== "PARTIAL" && !next.recommendationNeedsRefresh) {
            window.clearInterval(interval);
            setTopicCoverImages({});
            requestedTopicCoverImageKeys.current.clear();
          }
        })
        .catch(() => undefined);
    }, 8_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [data, debouncedKeyword, filters.direction, filters.platform, partialCompletionKey, requestKey, requestUrl]);

  async function regenerateAiRecommendations() {
    setRegeneratingRecommendations(true);
    setDetailError(null);
    try {
      const response = await fetch("/api/creator/trends/recommendations/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction: filters.direction,
          platform: filters.platform,
          keyword: debouncedKeyword,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { data?: CreatorTrendDetailData; error?: string };
      if (!response.ok || !result.data) {
        setDetailError(formatAiErrorForUser(result.error ?? "AI 选题重新生成失败，请稍后重试。"));
        return;
      }
      setData(result.data);
      writeCachedDetail(requestKey, result.data);
      setLastResolvedKey(requestKey);
      setBatch("0");
      setTopicCoverImages({});
      requestedTopicCoverImageKeys.current.clear();
      requestedCompletionKeys.current.clear();
    } catch (error) {
      setDetailError(formatAiErrorForUser(error instanceof Error ? error.message : "AI 选题重新生成失败，请稍后重试。"));
    } finally {
      setRegeneratingRecommendations(false);
    }
  }

  async function generateScript(payload: ScriptGeneratePayload, userInstruction = "") {
    const key = scriptRecordKey(payload.sourceType, payload.sourceKey);
    const existingRecord = scriptRecords[key] ?? null;
    setGeneratingScriptKey(key);
    setOpenScriptPayload(payload);
    setOpenScriptRecord(existingRecord);
    setScriptError(null);
    try {
      const response = await fetch("/api/creator/trends/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, userInstruction }),
      });
      const result = (await response.json().catch(() => ({}))) as { record?: ScriptGenerationView; error?: string };
      if (result.record) {
        setScriptRecords((current) => ({ ...current, [key]: result.record! }));
        setOpenScriptRecord(result.record);
        setOpenScriptPayload(payload);
      } else if (!response.ok) {
        setScriptError(result.error ?? "脚本生成失败，请稍后重试。");
      }
    } catch (error) {
      setScriptError(error instanceof Error ? error.message : "脚本生成失败，请稍后重试。");
    } finally {
      setGeneratingScriptKey(null);
    }
  }

  function openScript(payload: ScriptGeneratePayload, record: ScriptGenerationView) {
    setOpenScriptPayload(payload);
    setOpenScriptRecord(record);
  }

  function scriptButtons(payload: ScriptGeneratePayload) {
    const key = scriptRecordKey(payload.sourceType, payload.sourceKey);
    const record = scriptRecords[key];
    const generating = generatingScriptKey === key;
    if (record) {
      return (
        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:bg-blue-100"
          type="button"
          onClick={() => openScript(payload, record)}
        >
          <FileText size={14} />
          打开脚本
        </button>
      );
    }
    return (
      <button
        className={secondaryButtonClass}
        type="button"
        disabled={generating}
        onClick={() => generateScript(payload)}
      >
        {generating ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
        {generating ? "生成中..." : "生成脚本"}
      </button>
    );
  }

  function primaryScriptAction(payload: ScriptGeneratePayload) {
    const key = scriptRecordKey(payload.sourceType, payload.sourceKey);
    const record = scriptRecords[key];
    const generating = generatingScriptKey === key;
    if (record) {
      return (
        <button
          className={primaryButtonClass}
          type="button"
          onClick={() => openScript(payload, record)}
        >
          <FileText size={16} />
          查看脚本
        </button>
      );
    }
    return (
      <button
        className={primaryButtonClass}
        type="button"
        disabled={generating}
        onClick={() => generateScript(payload)}
      >
        {generating ? <Loader2 className="animate-spin" size={16} /> : <FileText size={16} />}
        {generating ? "生成中..." : "生成脚本"}
      </button>
    );
  }

  const workflowStatus = recommendationStatusLabel(data, loading, detailError);
  const pendingScript: PendingScriptGeneration | null =
    openScriptPayload && generatingScriptKey === scriptRecordKey(openScriptPayload.sourceType, openScriptPayload.sourceKey)
      ? {
          sourceTitle: openScriptPayload.sourceTitle,
          platformLabel: openScriptPayload.platformLabel,
          directionLabel: openScriptPayload.directionLabel,
          mode: openScriptRecord ? "regenerate" : "create",
        }
      : null;

  return (
    <>
      {scriptError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          脚本生成失败：{scriptError}
        </div>
      ) : null}

      <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_minmax(30rem,36rem)]">
        <div className="min-w-0 space-y-5">
          <section id="workflow" className={cn("scroll-mt-28 rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm", loading && "opacity-80")}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-black tracking-[0.08em] text-teal-700">创作路径</p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">从热点到脚本，一步步完成今天的内容</h2>
                  <p className="mt-3 text-base font-semibold leading-7 text-slate-500">
                    当前方向：{currentDirection.label} · 平台：{platformDisplay(filters.platform)} · 关键词：{filters.keyword.trim() || "全部热点"}
                  </p>
                </div>
                <span className="inline-flex w-fit items-center rounded-2xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-black text-teal-700 shadow-sm">
                  {workflowStatus}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {workflowSteps.map((step, index) => (
                  <div key={step.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex size-9 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">{index + 1}</span>
                      <p className="text-base font-black text-slate-950">{step.label}</p>
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">{step.hint}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-4 rounded-[1.4rem] border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      className={cn(
                        "rounded-xl border px-4 py-3 text-sm font-black shadow-sm transition",
                        poolView === "watch" ? "border-teal-200 bg-teal-50 text-teal-700" : "border-slate-200 bg-white text-slate-500 hover:text-slate-900",
                      )}
                      type="button"
                      onClick={() => setPoolView("watch")}
                    >
                      趋势推荐
                    </button>
                    <button
                      className={cn(
                        "rounded-xl border px-4 py-3 text-sm font-black shadow-sm transition",
                        poolView === "draft" ? "border-teal-200 bg-teal-50 text-teal-700" : "border-slate-200 bg-white text-slate-500 hover:text-slate-900",
                      )}
                      type="button"
                      onClick={() => setPoolView("draft")}
                    >
                      我的关注
                    </button>
                    <SourceBadge kind={data?.recommendationSource ?? "规则计算"} />
                    {data?.recommendationStatus === "PARTIAL" ? (
                      <span className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 shadow-sm">AI 补全中 {recommendationItemCount}/12</span>
                    ) : null}
                    {data?.recommendationStatus === "FAILED" ? (
                      <span className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-black text-amber-700 shadow-sm">AI 失败</span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      className={cn(secondaryButtonClass, "w-full sm:w-auto")}
                      type="button"
                      disabled={loading || regeneratingRecommendations}
                      onClick={regenerateAiRecommendations}
                    >
                      {regeneratingRecommendations ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                      重新生成 AI 选题
                    </button>
                    <button
                      className={cn(accentButtonClass, "w-full sm:w-auto")}
                      type="button"
                      disabled={batchCount <= 1}
                      onClick={() => {
                        setBatch(String(activeNextBatchIndex));
                      }}
                    >
                      <RefreshCw size={14} />
                      换一批
                    </button>
                  </div>
                </div>

                {data?.recommendationStatus === "PARTIAL" ? (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-base font-semibold text-blue-800">
                    {data.recommendationError ?? `AI 已生成 ${recommendationItemCount}/12 张有效选题，后台正在补全，完成后会自动刷新。`}
                  </div>
                ) : null}

                {poolView === "watch" ? (
                  !loading && !data ? (
                    <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-5 py-10 text-center text-base font-semibold text-amber-800">
                      {detailError ? formatAiErrorForUser(detailError) : "热点详情加载失败，请稍后重试。"}
                    </div>
                  ) : !loading && data?.recommendationStatus === "FAILED" ? (
                    <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-5 py-10 text-center text-base font-semibold text-amber-800">
                      <p className="text-base font-black">AI 选题生成失败</p>
                      <p className="mt-2">{formatAiErrorForUser(data.recommendationError ?? detailError)}</p>
                    </div>
                  ) : activeRecommendations.length > 0 ? (
                    <div id="topic-recommendations" className="scroll-mt-28 grid gap-4">
                      {activeRecommendations.map((item) => (
                        <article
                          key={item.id ?? item.title}
                          className="grid gap-5 rounded-[1.4rem] border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[8rem_minmax(0,1fr)]"
                        >
                          {topicCoverNode(item, "h-40 lg:h-full", "(min-width: 1280px) 128px, (min-width: 1024px) 112px, 100vw")}
                          <div className="min-w-0">
                            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
                              <h3 className="min-w-0 flex-1 text-xl font-black text-slate-950">{item.title}</h3>
                              <span className={cn("rounded-xl border px-3 py-1.5 text-sm font-black", stageClass(item.stage))}>{item.stage}</span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className={cn("rounded-xl border px-3 py-1.5 text-sm font-black", confidenceClass(item.confidence))}>{item.confidence ?? "示例数据"}</span>
                              <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-black text-slate-600">{formatInsightUpdatedAt(item.updatedAt)}</span>
                              <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-black text-slate-600">热度 {item.heat}</span>
                            </div>
                            <p className="mt-4 line-clamp-2 text-base font-semibold leading-7 text-slate-600">{item.reason}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {item.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-sm font-black text-teal-700">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <div className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
                              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                <p className="text-sm font-black text-slate-400">讨论量</p>
                                <p className="mt-1 text-xl font-black text-slate-900">{item.metrics?.comments?.toLocaleString() ?? 0}</p>
                              </div>
                              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                <p className="text-sm font-black text-slate-400">互动量</p>
                                <p className="mt-1 text-xl font-black text-teal-700">{item.metrics?.likes?.toLocaleString() ?? 0}</p>
                              </div>
                              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                <p className="text-sm font-black text-slate-400">预计热度</p>
                                <p className="mt-1 text-xl font-black text-slate-900">{item.heat}</p>
                              </div>
                            </div>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2 self-start">
                            {primaryScriptAction({
                              ...topicScriptSource(item),
                              sourceTitle: item.title,
                              platform: item.platform ?? item.tags[1] ?? filters.platform,
                              platformLabel: item.platform ?? item.tags[1] ?? platformDisplay(filters.platform),
                              directionLabel: currentDirection.label,
                              topic: item,
                            })}
                            <form action={saveCreatorTrendAction}>
                              <input name="title" type="hidden" value={item.title} />
                              <input name="topic" type="hidden" value={item.keyword ?? item.title} />
                              <input name="platform" type="hidden" value={item.platform ?? item.tags[1] ?? ""} />
                              <input name="reason" type="hidden" value={item.reason} />
                              <input name="sourceContentId" type="hidden" value={item.sampleSourceContentId ?? item.id ?? ""} />
                              <input name="sourceUrl" type="hidden" value={item.sampleContentUrl ?? ""} />
                              <button className="w-full rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-black text-teal-700 shadow-sm transition hover:bg-teal-100" type="submit">
                                加入选题库
                              </button>
                            </form>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center text-base font-semibold text-slate-500">
                      当前筛选下暂无 AI 选题。
                    </div>
                  )
                ) : (
                  <div className="grid gap-3">
                    {savedTrends.map((item) => (
                      <div key={item.id} className="rounded-[1.4rem] border border-teal-100 bg-teal-50/50 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <button className="line-clamp-2 text-left text-base font-black text-slate-950 transition hover:text-teal-700" type="button" onClick={() => setFilters({ keyword: item.topic ?? item.title }, "#workflow", { navigate: false })}>
                            {item.title}
                          </button>
                          <span className={cn("shrink-0 rounded-xl border px-3 py-1.5 text-sm font-black", poolStatusClass(item.status === "DROPPED" ? "已过热" : "可创作"))}>{savedStatusLabel(item.status)}</span>
                        </div>
                        <p className="mt-3 line-clamp-2 text-base font-semibold text-slate-500">{item.reason ?? "手动加入选题池。"}</p>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-bold text-slate-400">{formatInsightUpdatedAt(item.updatedAt)}</span>
                          <form action={updateCreatorSavedTrendAction.bind(null, item.id)} className="flex flex-wrap gap-1.5">
                            <button className="rounded-xl border border-teal-200 bg-white px-3 py-2 text-sm font-black text-teal-700" name="status" type="submit" value="PLANNED">
                              准备做
                            </button>
                            <button className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-black text-blue-700" name="status" type="submit" value="PUBLISHED">
                              已发布
                            </button>
                            <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-500" name="intent" type="submit" value="delete">
                              <Trash2 size={12} />
                            </button>
                          </form>
                        </div>
                      </div>
                    ))}
                    {activeDraftPool.map((item) => (
                      <div key={`${item.title}-${item.angle}`} className="rounded-[1.4rem] border border-slate-200 bg-white p-5">
                        <div className="flex items-start justify-between gap-3">
                          <button className="line-clamp-2 text-left text-base font-black text-slate-950 transition hover:text-teal-700" type="button" onClick={() => setFilters({ keyword: item.title }, "#workflow", { navigate: false })}>
                            {item.title}
                          </button>
                          <span className={cn("shrink-0 rounded-xl border px-3 py-1.5 text-sm font-black", poolStatusClass(item.status))}>{item.status}</span>
                        </div>
                        <p className="mt-3 text-sm font-black text-teal-700">{item.angle}</p>
                        <p className="mt-2 line-clamp-2 text-base font-semibold text-slate-500">{item.reason}</p>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {item.platforms.slice(0, 3).map((platform) => <PlatformBadge key={platform} label={platform} />)}
                        </div>
                      </div>
                    ))}
                    {savedTrends.length === 0 && activeDraftPool.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center text-base font-semibold text-slate-500">
                        当前还没有收藏的选题和草稿。
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </section>

          <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
            <section id="case-study" className={cn("scroll-mt-28 rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm", loading && "opacity-70")}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black">爆款案例拆解</h2>
                  <SourceBadge kind={data?.caseSource ?? "规则计算"} />
                </div>
                <button className="text-base font-black text-blue-600 hover:text-blue-700" type="button" onClick={() => setFilters({ keyword: "" }, "#workflow", { navigate: false })}>
                  清空筛选
                </button>
              </div>
              {!loading && !data ? (
                <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-5 py-10 text-center text-base font-semibold text-amber-700">
                  爆款案例暂时没有加载成功。{detailError ? ` ${detailError}` : "请切换筛选或稍后重试。"}
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-[7rem_minmax(0,1fr)]">
                    <div className="relative h-28 overflow-hidden rounded-xl bg-gradient-to-br from-amber-100 to-stone-200">
                      {data?.caseStudy.coverImageUrl ? <Image alt={data.caseStudy.title} className="object-contain p-1" fill sizes="112px" src={data.caseStudy.coverImageUrl} unoptimized /> : null}
                      <div className="absolute inset-x-0 bottom-0 flex items-end p-2">
                        <span className="rounded-full bg-stone-700 px-2 py-1 text-xs font-black text-white">{data?.caseStudy.likes ?? "加载中"}</span>
                      </div>
                    </div>
                    <div>
                      <p className="line-clamp-2 text-xl font-black text-slate-950">{data?.caseStudy.title ?? "加载中..."}</p>
                      <div className="mt-3 grid grid-cols-4 gap-2 text-center text-sm font-black text-slate-600">
                        {(data?.caseStudy.stats ?? ["-", "-", "-", "-"]).map((stat, index) => <span key={`${stat}-${index}`}>{stat}</span>)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {(data?.caseStudy.rows ?? []).slice(0, 5).map(([label, value]) => (
                      <div key={label} className="grid gap-2 rounded-xl border border-slate-100 px-4 py-3 text-base sm:grid-cols-[7rem_minmax(0,1fr)]">
                        <span className="font-bold text-slate-500">{label}</span>
                        <span className="font-black">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-black text-teal-700 shadow-sm transition hover:bg-teal-100"
                      type="button"
                      onClick={() => setFilters({ keyword: data?.caseStudy.templateKeyword ?? currentDirection.label }, "#workflow", { navigate: false })}
                    >
                      {data?.caseStudy.templateKeyword ?? "案例模板"}
                    </button>
                    <CopyScriptButton label="复制图文脚本" text={data?.caseStudy.graphicScriptText ?? data?.caseStudy.scriptText ?? ""} />
                    <CopyScriptButton label="复制视频脚本" text={data?.caseStudy.videoScriptText ?? data?.caseStudy.scriptText ?? ""} />
                    {data?.caseStudy && caseSource ? (
                      <div className="min-w-32">
                        {scriptButtons({
                          ...caseSource,
                          sourceTitle: data.caseStudy.title,
                          platform: filters.platform,
                          platformLabel: platformDisplay(filters.platform),
                          directionLabel: currentDirection.label,
                          caseStudy: data.caseStudy,
                        })}
                      </div>
                    ) : null}
                  </div>
                </>
              )}
            </section>

            <section id="task-flow" className={cn("scroll-mt-28 rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm", loading && "opacity-70")}>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-black">方向趋势池</h2>
                  <p className="mt-2 text-sm font-semibold text-slate-500">{poolView === "watch" ? currentDirection.label : "收藏 + 系统生成"}</p>
                </div>
                <span className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-black text-teal-700 shadow-sm">{poolView === "watch" ? "可筛选" : "已关注"}</span>
              </div>
              <div className="space-y-3">
                {poolView === "watch"
                  ? (data?.watchPool ?? []).slice(0, 5).map((item) => (
                      <div key={`${item.topic}-${item.status}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <button className="line-clamp-2 text-left text-base font-black transition hover:text-teal-700" type="button" onClick={() => setFilters({ keyword: item.topic }, "#workflow", { navigate: false })}>
                            {item.topic}
                          </button>
                          <span className={cn("shrink-0 rounded-xl border px-3 py-1.5 text-sm font-black", poolStatusClass(item.status))}>{item.status}</span>
                        </div>
                        <div className="mt-3 flex flex-col gap-2 text-sm font-bold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                          <span>{item.signal}</span>
                          <button className="text-sm text-teal-700 hover:text-teal-800" type="button" onClick={() => setFilters({ keyword: item.topic }, "#workflow", { navigate: false })}>
                            {item.action}
                          </button>
                        </div>
                      </div>
                    ))
                  : activeDraftPool.slice(0, 5).map((item) => (
                      <div key={`${item.title}-${item.angle}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <button className="line-clamp-2 text-left text-base font-black transition hover:text-teal-700" type="button" onClick={() => setFilters({ keyword: item.title }, "#workflow", { navigate: false })}>
                            {item.title}
                          </button>
                          <span className={cn("shrink-0 rounded-xl border px-3 py-1.5 text-sm font-black", poolStatusClass(item.status))}>{item.status}</span>
                        </div>
                        <p className="mt-3 text-sm font-black text-teal-700">{item.angle}</p>
                        <p className="mt-2 line-clamp-2 text-base font-semibold text-slate-500">{item.reason}</p>
                      </div>
                    ))}
              </div>
            </section>
          </div>
        </div>

        <aside className="hidden min-w-0 2xl:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4 shadow-sm">
            <ScriptGenerationWorkspace
              record={openScriptRecord}
              pendingScript={pendingScript}
              regenerating={openScriptPayload ? generatingScriptKey === scriptRecordKey(openScriptPayload.sourceType, openScriptPayload.sourceKey) : false}
              onRegenerate={(instruction) => {
                if (!openScriptPayload) return;
                void generateScript(openScriptPayload, instruction);
              }}
            />
          </div>
        </aside>
      </div>

      <div className="2xl:hidden">
        <ScriptGenerationDrawer
          open={Boolean(openScriptRecord || pendingScript)}
          record={openScriptRecord}
          pendingScript={pendingScript}
          regenerating={openScriptPayload ? generatingScriptKey === scriptRecordKey(openScriptPayload.sourceType, openScriptPayload.sourceKey) : false}
          onClose={() => setOpenScriptRecord(null)}
          onRegenerate={(instruction) => {
            if (!openScriptPayload) return;
            void generateScript(openScriptPayload, instruction);
          }}
        />
      </div>
    </>
  );
}
