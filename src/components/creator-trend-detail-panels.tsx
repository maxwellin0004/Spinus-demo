"use client";

import Image from "next/image";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CopyScriptButton } from "@/components/copy-script-button";
import { useCreatorTrendFilters } from "@/components/creator-trends-interactive";
import type { CreatorTrendDetailData, DraftPoolItem, SourceKind, TopicCard, WatchPoolItem } from "@/lib/insights/creator-trend-detail";
import { cn } from "@/lib/utils";

type Props = {
  initialBatch?: string;
  initialRec?: string;
  initialPool?: string;
};

const DETAIL_CACHE_TTL_MS = 90_000;
const detailCache = new Map<string, { data: CreatorTrendDetailData; expiresAt: number }>();
const inflightRequests = new Map<string, Promise<CreatorTrendDetailData>>();

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
  if (kind === "规则计算") return "border-blue-200 bg-blue-50 text-blue-700";
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

export function CreatorTrendDetailPanels({ initialBatch, initialRec, initialPool }: Props) {
  const { filters, currentDirection, setFilters } = useCreatorTrendFilters();
  const [data, setData] = useState<CreatorTrendDetailData | null>(null);
  const [lastResolvedKey, setLastResolvedKey] = useState("");
  const [batch, setBatch] = useState(initialBatch ?? "0");
  const [rec, setRec] = useState(initialRec ?? "");
  const [poolView, setPoolView] = useState(initialPool === "draft" ? "draft" : "watch");
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
    void requestDetail(requestUrl, requestKey, controller.signal)
      .then((next) => {
        if (controller.signal.aborted) return;
        setData(next);
        setLastResolvedKey(requestKey);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error(error);
        setLastResolvedKey(requestKey);
      });
    return () => controller.abort();
  }, [requestKey, requestUrl]);

  const batchCount = data?.recommendationBatches.length ?? 0;
  const activeBatchIndex = positiveBatchIndex(batch, batchCount);
  const activeNextBatchIndex = batchCount > 1 ? (activeBatchIndex + 1) % batchCount : 0;
  const activeRecommendations = data?.recommendationBatches[activeBatchIndex] ?? [];
  const selectedRecommendation =
    rec && activeRecommendations.length > 0
      ? activeRecommendations.find((item) => item.id === rec || item.sampleSourceContentId === rec || item.title === rec) ?? null
      : null;
  const activeRec = selectedRecommendation ? rec : "";
  const activeDraftPool = data?.draftPools[activeBatchIndex] ?? [];
  const loading = data == null || lastResolvedKey !== requestKey;

  useEffect(() => {
    replaceMetaUrl(filters, String(activeBatchIndex), activeRec, poolView);
  }, [activeBatchIndex, activeRec, filters, poolView]);

  return (
    <section id="topic-recommendations" className="scroll-mt-28 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.75fr)]">
      <div className={cn("min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", loading && "opacity-70")}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black">AI 选题推荐</h2>
            <SourceBadge kind={data?.recommendationSource ?? "规则计算"} />
          </div>
          <button
            className="flex items-center gap-1 text-sm font-black text-teal-700"
            type="button"
            onClick={() => {
              setRec("");
              setBatch(String(activeNextBatchIndex));
            }}
          >
            <RefreshCw size={15} />换一批
          </button>
        </div>
        <div className="-mx-1 overflow-x-auto px-1 pb-2">
          <div className="flex min-w-max gap-4">
            {activeRecommendations.length > 0 ? (
              activeRecommendations.map((item) => (
                <div key={item.id ?? item.title} className="w-40 shrink-0 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                  <button
                    className="block w-full text-left"
                    type="button"
                    onClick={() => setRec(item.id ?? item.sampleSourceContentId ?? item.title)}
                  >
                    <div className={cn("relative mb-3 h-24 overflow-hidden rounded-lg bg-gradient-to-br", item.tone)}>
                      {item.coverImageUrl ? <Image alt={item.title} className="object-cover" fill sizes="160px" src={item.coverImageUrl} unoptimized /> : null}
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 font-black">{item.title}</p>
                      <span className={cn("shrink-0 rounded-md border px-2 py-1 text-xs font-black", stageClass(item.stage))}>{item.stage}</span>
                    </div>
                  </button>
                  <p className="mt-3 text-xs font-black text-slate-500">推荐理由</p>
                  <p className="mt-1 line-clamp-3 text-sm text-slate-600">{item.reason}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="whitespace-nowrap rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-black text-teal-700">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-sm font-black text-red-500">预计热度 {item.heat}</p>
                  <p className="mt-3 rounded-lg border border-slate-100 bg-slate-50 px-2 py-2 text-xs font-black text-slate-500">方向切入角度</p>
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
              <div className={cn("relative h-40 overflow-hidden rounded-xl bg-gradient-to-br", selectedRecommendation.tone)}>
                {selectedRecommendation.coverImageUrl ? <Image alt={selectedRecommendation.title} className="object-cover" fill sizes="160px" src={selectedRecommendation.coverImageUrl} unoptimized /> : null}
              </div>
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
        <div className="mt-4 flex gap-3">
          <button
            className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-black text-teal-700 transition hover:bg-teal-100"
            type="button"
            onClick={() => setFilters({ keyword: data?.caseStudy.templateKeyword ?? currentDirection.label }, "#task-flow", { navigate: false })}
          >
            {data?.caseStudy.templateKeyword ?? "案例模板"}
          </button>
          <CopyScriptButton text={data?.caseStudy.scriptText ?? ""} />
        </div>
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
                <p className="text-sm font-black text-slate-700">方向选题草稿池</p>
                <span className="text-xs font-bold text-slate-400">系统生成</span>
              </div>
              <div className="space-y-3">
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
  );
}
