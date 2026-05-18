"use client";

import Image from "next/image";
import Link from "next/link";
import { FileText, Loader2, RefreshCw, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CopyScriptButton } from "@/components/copy-script-button";
import { useCreatorTrendFilters } from "@/components/creator-trends-interactive";
import { ScriptGenerationDrawer } from "@/components/script-generation-viewer";
import { saveCreatorTrendAction, updateCreatorSavedTrendAction } from "@/lib/actions";
import { formatInsightSampleText, formatInsightUpdatedAt, type InsightConfidence } from "@/lib/insights/credibility";
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

function requestDetail(url: string, key: string, signal: AbortSignal) {
  const cached = readCachedDetail(key);
  if (cached) return Promise.resolve(cached);
  const inflight = inflightRequests.get(key);
  if (inflight) return inflight;

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
      inflightRequests.delete(key);
    });

  inflightRequests.set(key, request);
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
  window.history.replaceState(null, "", `/creator/trends${query ? `?${query}` : ""}#topic-recommendations`);
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

export function CreatorTrendDetailPanels({ initialBatch, initialRec, initialPool, savedTrends = [] }: Props) {
  const { filters, currentDirection, setFilters } = useCreatorTrendFilters();
  const [data, setData] = useState<CreatorTrendDetailData | null>(null);
  const [lastResolvedKey, setLastResolvedKey] = useState("");
  const [batch, setBatch] = useState(initialBatch ?? "0");
  const [rec, setRec] = useState(initialRec ?? "");
  const [poolView, setPoolView] = useState(initialPool === "draft" ? "draft" : "watch");
  const [detailError, setDetailError] = useState<string | null>(null);
  const [scriptRecords, setScriptRecords] = useState<Record<string, ScriptGenerationView>>({});
  const [topicCoverImages, setTopicCoverImages] = useState<Record<string, TopicCoverImageState>>({});
  const requestedTopicCoverImageKeys = useRef(new Set<string>());
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
    }, 35_000);
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
          setDetailError("详情接口响应超时，请稍后重试。");
          setLastResolvedKey(requestKey);
          return;
        }
        console.error(error);
        setData(null);
        setDetailError(timedOut ? "详情接口响应超时，请稍后重试。" : error instanceof Error ? error.message : "热点详情加载失败");
        setLastResolvedKey(requestKey);
      });
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [requestKey, requestUrl]);

  useEffect(() => {
    setTopicCoverImages({});
    requestedTopicCoverImageKeys.current.clear();
  }, [requestKey]);

  const batchCount = data?.recommendationBatches.length ?? 0;
  const activeBatchIndex = positiveBatchIndex(batch, batchCount);
  const activeNextBatchIndex = batchCount > 1 ? (activeBatchIndex + 1) % batchCount : 0;
  const activeRecommendations = useMemo(() => data?.recommendationBatches[activeBatchIndex] ?? [], [activeBatchIndex, data]);
  const selectedRecommendation =
    rec && activeRecommendations.length > 0
      ? activeRecommendations.find((item) => item.id === rec || item.sampleSourceContentId === rec || item.title === rec) ?? null
      : null;
  const activeRec = selectedRecommendation ? rec : "";
  const activeDraftPool = data?.draftPools[activeBatchIndex] ?? [];
  const loading = lastResolvedKey !== requestKey;
  const caseSource = data?.caseStudy ? caseScriptSource(filters, data.caseStudy) : null;

  function resolvedCoverImageUrl(item: TopicCard) {
    return topicCoverImages[topicImageKey(item)]?.imageUrl || null;
  }

  function topicCoverStatus(item: TopicCard) {
    return topicCoverImages[topicImageKey(item)]?.status ?? (item.coverImagePrompt ? "loading" : "failed");
  }

  function topicCoverNode(item: TopicCard, heightClass = "h-24", sizes = "160px") {
    const imageUrl = resolvedCoverImageUrl(item);
    const status = topicCoverStatus(item);
    return (
      <div className={cn("relative overflow-hidden rounded-lg bg-gradient-to-br", heightClass, item.tone)}>
        {imageUrl ? <Image alt={item.title} className="object-cover" fill sizes={sizes} src={imageUrl} unoptimized /> : null}
        {!imageUrl ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/55 px-2 text-center text-[0.68rem] font-black text-teal-800">
            {status === "loading" ? <Loader2 className="animate-spin" size={18} /> : <FileText size={17} />}
            <span>{status === "loading" ? "AI封面生成中" : "AI封面生成失败"}</span>
          </div>
        ) : null}
      </div>
    );
  }

  useEffect(() => {
    replaceMetaUrl(filters, String(activeBatchIndex), activeRec, poolView);
  }, [activeBatchIndex, activeRec, filters, poolView]);

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
      requestedTopicCoverImageKeys.current.add(key);
      setTopicCoverImages((current) =>
        current[key]
          ? current
          : {
              ...current,
              [key]: { status: "loading", imageUrl: null },
            },
      );
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), TOPIC_COVER_IMAGE_TIMEOUT_MS);
      void fetch("/api/creator/trends/topic-image", {
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
      })
        .then(async (response) => {
          const payload = (await response.json().catch(() => ({}))) as { imageUrl?: string | null };
          setTopicCoverImages((current) => ({
            ...current,
            [key]: {
              status: response.ok && payload.imageUrl ? "ready" : "failed",
              imageUrl: payload.imageUrl ?? null,
            },
          }));
        })
        .catch(() => {
          setTopicCoverImages((current) => ({
            ...current,
            [key]: { status: "failed", imageUrl: null },
          }));
        })
        .finally(() => {
          window.clearTimeout(timeout);
        });
    }
  }, [activeRecommendations, filters.platform, loading]);

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
        setDetailError(result.error ?? "AI 选题重新生成失败，请稍后重试。");
        return;
      }
      setData(result.data);
      writeCachedDetail(requestKey, result.data);
      setLastResolvedKey(requestKey);
      setBatch("0");
      setRec("");
      setTopicCoverImages({});
      requestedTopicCoverImageKeys.current.clear();
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "AI 选题重新生成失败，请稍后重试。");
    } finally {
      setRegeneratingRecommendations(false);
    }
  }

  async function generateScript(payload: ScriptGeneratePayload, userInstruction = "") {
    const key = scriptRecordKey(payload.sourceType, payload.sourceKey);
    setGeneratingScriptKey(key);
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
          className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-100"
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
        className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-black text-slate-700 transition hover:border-teal-200 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        disabled={generating}
        onClick={() => generateScript(payload)}
      >
        {generating ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
        {generating ? "生成中..." : "生成脚本"}
      </button>
    );
  }

  return (
    <>
    {scriptError ? (
      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
        脚本生成失败：{scriptError}
      </div>
    ) : null}
    <section id="topic-recommendations" className="scroll-mt-28 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.75fr)]">
      <div className={cn("min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", loading && "opacity-70")}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black">AI 选题推荐</h2>
            <SourceBadge kind={data?.recommendationSource ?? "规则计算"} />
            {data?.recommendationStatus === "FAILED" ? <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700">AI失败</span> : null}
          </div>
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-1 text-sm font-black text-slate-600 transition hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={loading || regeneratingRecommendations}
              onClick={regenerateAiRecommendations}
            >
              {regeneratingRecommendations ? <Loader2 className="animate-spin" size={15} /> : <RefreshCw size={15} />}
              重新生成 AI 选题
            </button>
            <button
              className="flex items-center gap-1 text-sm font-black text-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              disabled={batchCount <= 1}
              onClick={() => {
                setRec("");
                setBatch(String(activeNextBatchIndex));
              }}
            >
              <RefreshCw size={15} />换一批
            </button>
          </div>
        </div>
        <div className="-mx-1 overflow-x-auto px-1 pb-2">
          <div className="flex min-w-max gap-4">
            {!loading && !data ? (
              <div className="flex h-40 min-w-96 items-center justify-center rounded-xl border border-dashed border-amber-200 bg-amber-50 px-6 text-center text-sm font-semibold text-amber-700">
                热点详情加载失败，请稍后重试。{detailError ? ` ${detailError}` : ""}
              </div>
            ) : !loading && data?.recommendationStatus === "FAILED" ? (
              <div className="flex h-48 min-w-96 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-amber-200 bg-amber-50 px-6 text-center text-sm font-semibold text-amber-800">
                <p className="text-base font-black">AI 选题生成失败</p>
                <p>{data.recommendationError ?? detailError ?? "当前没有可展示的 AI 选题，请重新生成。"}</p>
                <button
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-950 px-3 py-2 text-xs font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  type="button"
                  disabled={regeneratingRecommendations}
                  onClick={regenerateAiRecommendations}
                >
                  {regeneratingRecommendations ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                  重新生成 AI 选题
                </button>
              </div>
            ) : activeRecommendations.length > 0 ? (
              activeRecommendations.map((item) => (
                <div key={item.id ?? item.title} className="w-40 shrink-0 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                  <button
                    className="block w-full text-left"
                    type="button"
                    onClick={() => setRec(item.id ?? item.sampleSourceContentId ?? item.title)}
                  >
                    <div className="mb-3">{topicCoverNode(item)}</div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 font-black">{item.title}</p>
                      <span className={cn("shrink-0 rounded-md border px-2 py-1 text-xs font-black", stageClass(item.stage))}>{item.stage}</span>
                    </div>
                  </button>
                  <p className="mt-3 text-xs font-black text-slate-500">推荐理由</p>
                  <p className="mt-1 line-clamp-3 text-sm text-slate-600">{item.reason}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-black">
                    <span className={cn("rounded-md border px-2 py-1", confidenceClass(item.confidence))}>{item.confidence ?? "示例数据"}</span>
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600">{formatInsightUpdatedAt(item.updatedAt)}</span>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-slate-500">{formatInsightSampleText(item)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="whitespace-nowrap rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-black text-teal-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-sm font-black text-red-500">预计热度 {item.heat}</p>
                  <form action={saveCreatorTrendAction} className="mt-3">
                    <input name="title" type="hidden" value={item.title} />
                    <input name="topic" type="hidden" value={item.keyword ?? item.title} />
                    <input name="platform" type="hidden" value={item.platform ?? item.tags[1] ?? ""} />
                    <input name="reason" type="hidden" value={item.reason} />
                    <input name="sourceContentId" type="hidden" value={item.sampleSourceContentId ?? item.id ?? ""} />
                    <input name="sourceUrl" type="hidden" value={item.sampleContentUrl ?? ""} />
                    <button className="flex w-full items-center justify-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2 py-2 text-xs font-black text-teal-700 transition hover:bg-teal-100" type="submit">
                      <Save size={14} />
                      加入选题池
                    </button>
                  </form>
                  <div className="mt-2">
                    {scriptButtons({
                      ...topicScriptSource(item),
                      sourceTitle: item.title,
                      platform: item.platform ?? item.tags[1] ?? filters.platform,
                      platformLabel: item.platform ?? item.tags[1] ?? platformDisplay(filters.platform),
                      directionLabel: currentDirection.label,
                      topic: item,
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-40 min-w-96 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-sm font-semibold text-slate-400">
                当前筛选下暂无推荐，试试切换平台或清空关键词。
              </div>
            )}
          </div>
        </div>
        {selectedRecommendation ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-700">推荐详情</p>
                <h3 className="mt-2 text-lg font-black text-slate-950">{selectedRecommendation.title}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">{selectedRecommendation.reason}</p>
                <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-black">
                  <span className={cn("rounded-md border px-2 py-1", confidenceClass(selectedRecommendation.confidence))}>{selectedRecommendation.confidence ?? "示例数据"}</span>
                  <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-600">{formatInsightSampleText(selectedRecommendation)}</span>
                  <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-600">{formatInsightUpdatedAt(selectedRecommendation.updatedAt)}</span>
                </div>
              </div>
              <button
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-500 transition hover:text-slate-700"
                type="button"
                onClick={() => setRec("")}
              >
                关闭
              </button>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-[10rem_minmax(0,1fr)]">
              {topicCoverNode(selectedRecommendation, "h-40 rounded-xl", "160px")}
              <div className="space-y-3">
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="rounded-xl border border-white bg-white px-3 py-2 text-sm"><span className="font-bold text-slate-500">参考样本</span><p className="mt-1 font-black text-slate-900">{selectedRecommendation.sampleTitle ?? "暂无"}</p></div>
                  <div className="rounded-xl border border-white bg-white px-3 py-2 text-sm"><span className="font-bold text-slate-500">关键词 / 平台</span><p className="mt-1 font-black text-slate-900">{selectedRecommendation.keyword ?? "内容样本"} / {selectedRecommendation.tags[1] ?? selectedRecommendation.platform ?? ""}</p></div>
                  <div className="rounded-xl border border-white bg-white px-3 py-2 text-sm"><span className="font-bold text-slate-500">参考作者</span><p className="mt-1 font-black text-slate-900">{selectedRecommendation.creator ?? "未知作者"}</p></div>
                  <div className="rounded-xl border border-white bg-white px-3 py-2 text-sm"><span className="font-bold text-slate-500">互动结构</span><p className="mt-1 font-black text-slate-900">赞 {selectedRecommendation.metrics?.likes?.toLocaleString() ?? 0} / 评 {selectedRecommendation.metrics?.comments?.toLocaleString() ?? 0} / 藏 {selectedRecommendation.metrics?.collects?.toLocaleString() ?? 0}</p></div>
                </div>
                <div className="rounded-xl border border-white bg-white px-3 py-3 text-sm">
                  <p className="font-bold text-slate-500">可延展角度</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(selectedRecommendation.angles ?? []).map((angle) => (
                      <span key={angle} className="rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-black text-teal-700">
                        {angle}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {selectedRecommendation.sampleContentUrl ? (
                    <Link href={selectedRecommendation.sampleContentUrl} target="_blank" className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-black text-teal-700 transition hover:bg-teal-100">
                      查看原帖
                    </Link>
                  ) : null}
                  <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-500">样本 ID：{selectedRecommendation.sampleSourceContentId ?? selectedRecommendation.id ?? "暂无"}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div id="case-study" className={cn("min-w-0 scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", loading && "opacity-70")}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black">爆款案例拆解</h2>
            <SourceBadge kind={data?.caseSource ?? "规则计算"} />
          </div>
          <button className="text-sm font-black text-blue-600 hover:text-blue-700" type="button" onClick={() => setFilters({ keyword: "" }, "#case-study", { navigate: false })}>
            查看更多
          </button>
        </div>
        {!loading && !data ? (
          <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50 px-4 py-8 text-center text-sm font-semibold text-amber-700">
            爆款案例暂时没有加载成功。{detailError ? ` ${detailError}` : "请切换筛选或稍后重试。"}
          </div>
        ) : (
          <>
        <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4">
          <div className="relative h-28 overflow-hidden rounded-xl bg-gradient-to-br from-amber-100 to-stone-200">
            {data?.caseStudy.coverImageUrl ? <Image alt={data.caseStudy.title} className="object-cover" fill sizes="112px" src={data.caseStudy.coverImageUrl} unoptimized /> : null}
            <div className="absolute inset-x-0 bottom-0 flex items-end p-2">
              <span className="rounded-full bg-stone-700 px-2 py-1 text-xs font-black text-white">{data?.caseStudy.likes ?? "加载中"}</span>
            </div>
          </div>
          <div>
            <p className="line-clamp-2 font-black">{data?.caseStudy.title ?? "加载中..."}</p>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs font-black text-slate-600">
              {(data?.caseStudy.stats ?? ["-", "-", "-", "-"]).map((stat, index) => <span key={`${stat}-${index}`}>{stat}</span>)}
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {(data?.caseStudy.rows ?? []).map(([label, value]) => (
            <div key={label} className="grid grid-cols-[6rem_minmax(0,1fr)] rounded-lg border border-slate-100 px-3 py-2 text-sm">
              <span className="font-bold text-slate-500">{label}</span>
              <span className="font-black">{value}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-black text-teal-700 transition hover:bg-teal-100"
            type="button"
            onClick={() => setFilters({ keyword: data?.caseStudy.templateKeyword ?? currentDirection.label }, "#task-flow", { navigate: false })}
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
      </div>

      <div id="task-flow" className={cn("min-w-0 scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", loading && "opacity-70")}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black">方向趋势池</h2>
          <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-black text-teal-700">可筛选</span>
        </div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-black transition",
                poolView === "watch" ? "border-teal-200 bg-teal-50 text-teal-700" : "border-slate-200 bg-white text-slate-500 hover:text-slate-700",
              )}
              type="button"
              onClick={() => setPoolView("watch")}
            >
              方向观察池
            </button>
            <button
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-black transition",
                poolView === "draft" ? "border-teal-200 bg-teal-50 text-teal-700" : "border-slate-200 bg-white text-slate-500 hover:text-slate-700",
              )}
              type="button"
              onClick={() => setPoolView("draft")}
            >
              方向选题草稿池
            </button>
          </div>
          <span className="text-xs font-bold text-slate-400">{poolView === "watch" ? currentDirection.label : "系统生成"}</span>
        </div>
        <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
          {poolView === "watch" ? (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-black text-slate-700">方向观察池</p>
                <span className="text-xs font-bold text-slate-400">{currentDirection.label}</span>
              </div>
              <div className="space-y-3">
                {(data?.watchPool ?? []).map((item) => (
                  <div key={`${item.topic}-${item.status}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <button className="line-clamp-2 text-left text-sm font-black transition hover:text-teal-700" type="button" onClick={() => setFilters({ keyword: item.topic }, "#topic-recommendations", { navigate: false })}>
                        {item.topic}
                      </button>
                      <span className={cn("shrink-0 rounded-md border px-2 py-1 text-xs font-black", poolStatusClass(item.status))}>{item.status}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
                      <span>{item.signal}</span>
                      <button className="text-teal-700 hover:text-teal-800" type="button" onClick={() => setFilters({ keyword: item.topic }, item.action === "暂缓" ? "#case-study" : "#topic-recommendations", { navigate: false })}>
                        {item.action}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-black text-slate-700">我的选题池</p>
                <span className="text-xs font-bold text-slate-400">收藏 + 系统生成</span>
              </div>
              <div className="space-y-3">
                {savedTrends.map((item) => (
                  <div key={item.id} className="rounded-xl border border-teal-100 bg-teal-50/50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <button className="line-clamp-2 text-left text-sm font-black transition hover:text-teal-700" type="button" onClick={() => setFilters({ keyword: item.topic ?? item.title }, "#topic-recommendations", { navigate: false })}>
                        {item.title}
                      </button>
                      <span className={cn("shrink-0 rounded-md border px-2 py-1 text-xs font-black", poolStatusClass(item.status === "DROPPED" ? "已过热" : "可创作"))}>{savedStatusLabel(item.status)}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs font-semibold text-slate-500">{item.reason ?? "手动加入选题池。"}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-400">{formatInsightUpdatedAt(item.updatedAt)}</span>
                      <form action={updateCreatorSavedTrendAction.bind(null, item.id)} className="flex flex-wrap gap-1.5">
                        <button className="rounded-md border border-teal-200 bg-white px-2 py-1 text-xs font-black text-teal-700" name="status" type="submit" value="PLANNED">
                          准备做
                        </button>
                        <button className="rounded-md border border-blue-200 bg-white px-2 py-1 text-xs font-black text-blue-700" name="status" type="submit" value="PUBLISHED">
                          已发布
                        </button>
                        <button className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-black text-slate-500" name="intent" type="submit" value="delete">
                          <Trash2 size={12} />
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
                {activeDraftPool.map((item) => (
                  <div key={`${item.title}-${item.angle}`} className="rounded-xl border border-slate-100 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <button className="line-clamp-2 text-left text-sm font-black transition hover:text-teal-700" type="button" onClick={() => setFilters({ keyword: item.title }, "#topic-recommendations", { navigate: false })}>
                        {item.title}
                      </button>
                      <span className={cn("shrink-0 rounded-md border px-2 py-1 text-xs font-black", poolStatusClass(item.status))}>{item.status}</span>
                    </div>
                    <p className="mt-2 text-xs font-black text-teal-700">{item.angle}</p>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-500">{item.reason}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.platforms.slice(0, 3).map((platform) => <PlatformBadge key={platform} label={platform} />)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
    <ScriptGenerationDrawer
      open={Boolean(openScriptRecord)}
      record={openScriptRecord}
      regenerating={openScriptPayload ? generatingScriptKey === scriptRecordKey(openScriptPayload.sourceType, openScriptPayload.sourceKey) : false}
      onClose={() => setOpenScriptRecord(null)}
      onRegenerate={(instruction) => {
        if (!openScriptPayload) return;
        void generateScript(openScriptPayload, instruction);
      }}
    />
    </>
  );
}
