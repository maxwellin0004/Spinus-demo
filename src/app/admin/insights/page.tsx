import Link from "next/link";
import type { Prisma } from "@prisma/client";
import {
  collectConfiguredInsightKeywordsAction,
  createInsightKeywordConfigAction,
  regenerateTopicCoverImageAction,
  retryCreatorTrendAiTopicDeckAction,
  seedInsightKeywordsAction,
  updateInsightKeywordConfigAction,
} from "@/lib/actions";
import { requireAdminPermission } from "@/lib/admin";
import { number, shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { TIKHUB_ENDPOINTS } from "@/lib/tikhub/endpoints";
import { AdminSettingsAccordion, AdminSettingsAccordionSection } from "@/components/admin-settings-accordion";
import { AdminMetricGrid, AdminSectionIntro } from "@/components/admin-workbench";
import { SubmitButton } from "@/components/form-controls";
import { Card, DataTable, Field, PageHeader, Select, StatusBadge } from "@/components/ui";

const platforms = [
  { value: "xiaohongshu", label: "小红书" },
  { value: "douyin", label: "抖音" },
  { value: "weibo", label: "微博" },
  { value: "bilibili", label: "B 站" },
];

const keywordTypes = ["品类词", "竞品词", "卖点词", "痛点词", "人群词", "场景词", "热点词"];

const endpointLabels: Record<keyof typeof TIKHUB_ENDPOINTS, string> = {
  douyinHotTopics: "抖音热点话题",
  douyinHotSearch: "抖音热搜榜",
  douyinCreatorHotSpot: "抖音创作者热点",
  douyinSearchVideos: "抖音视频搜索",
  xiaohongshuHotList: "小红书热榜",
  xiaohongshuTrending: "小红书热搜词",
  xiaohongshuSearchNotes: "小红书笔记搜索",
  xiaohongshuSearchNotesApp: "小红书笔记搜索（App）",
  xiaohongshuSearchSuggest: "小红书搜索联想词",
  xiaohongshuCreatorHotInspiration: "小红书创作者热点灵感",
  xiaohongshuNoteComments: "小红书评论",
  weiboHotSearch: "微博热搜",
  bilibiliSearchVideos: "B 站视频搜索",
};

function endpointOptions() {
  return (Object.keys(TIKHUB_ENDPOINTS) as (keyof typeof TIKHUB_ENDPOINTS)[]).map((key) => (
    <option key={key} value={key}>
      {endpointLabels[key]}
    </option>
  ));
}

function platformLabel(value: string) {
  return platforms.find((item) => item.value === value)?.label ?? value;
}

function dueState(row: { active: boolean; lastCollectedAt: Date | null; collectIntervalHours: number }) {
  if (!row.active) return { label: "已暂停", tone: "neutral" as const };
  if (!row.lastCollectedAt) return { label: "待采集", tone: "warning" as const };
  const nextAt = row.lastCollectedAt.getTime() + row.collectIntervalHours * 60 * 60 * 1000;
  if (Date.now() >= nextAt) return { label: "到期", tone: "warning" as const };
  return { label: "正常", tone: "success" as const };
}

function nextCollectText(row: { active: boolean; lastCollectedAt: Date | null; collectIntervalHours: number }) {
  if (!row.active) return "暂停中";
  if (!row.lastCollectedAt) return "立即";
  const nextAt = new Date(row.lastCollectedAt.getTime() + row.collectIntervalHours * 60 * 60 * 1000);
  return shortDate(nextAt);
}

function jsonArrayCount(value: Prisma.JsonValue) {
  return Array.isArray(value) ? value.length : 0;
}

function aiDeckStatusTone(status: string, refreshStatus: string) {
  if (refreshStatus === "FAILED" || status === "FAILED") return "warning" as const;
  if (refreshStatus === "GENERATING") return "info" as const;
  if (status === "READY") return "success" as const;
  if (status === "PARTIAL") return "info" as const;
  return "neutral" as const;
}

function cacheSourceLabel(platform: string, sampleSignature: string) {
  return `${platform === "all" ? "全部平台" : platformLabel(platform)} / 样本 ${sampleSignature.slice(0, 8)}`;
}

export default async function AdminInsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ active?: string; platform?: string; keywordType?: string }>;
}) {
  await requireAdminPermission("compliance.manage");
  const { active, platform, keywordType } = await searchParams;
  const activeFilter = active === "true" ? true : active === "false" ? false : undefined;
  const selectedPlatform = platforms.some((item) => item.value === platform) ? platform : undefined;
  const selectedKeywordType = keywordTypes.includes(keywordType ?? "") ? keywordType : undefined;
  const where: Prisma.InsightKeywordConfigWhereInput = {
    ...(activeFilter === undefined ? {} : { active: activeFilter }),
    ...(selectedPlatform ? { platform: selectedPlatform } : {}),
    ...(selectedKeywordType ? { keywordType: selectedKeywordType } : {}),
  };

  const [
    configs,
    activeCount,
    pausedCount,
    snapshotCount,
    contentCount,
    aiTopicDecks,
    aiTopicDeckCount,
    failedAiTopicDeckCount,
    generatingAiTopicDeckCount,
    failedTopicCoverImages,
    failedTopicCoverImageCount,
  ] = await Promise.all([
    prisma.insightKeywordConfig.findMany({
      where,
      orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
      take: 100,
    }),
    prisma.insightKeywordConfig.count({ where: { active: true } }),
    prisma.insightKeywordConfig.count({ where: { active: false } }),
    prisma.insightTrendSnapshot.count(),
    prisma.insightContent.count(),
    prisma.creatorTrendAiTopicDeck.findMany({
      orderBy: [{ updatedAt: "desc" }, { generatedAt: "desc" }],
      take: 24,
    }),
    prisma.creatorTrendAiTopicDeck.count(),
    prisma.creatorTrendAiTopicDeck.count({ where: { refreshStatus: "FAILED" } }),
    prisma.creatorTrendAiTopicDeck.count({ where: { refreshStatus: "GENERATING" } }),
    prisma.creatorTrendTopicImage.findMany({
      where: { status: "FAILED" },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.creatorTrendTopicImage.count({ where: { status: "FAILED" } }),
  ]);

  const dueCount = configs.filter((item) => dueState(item).label !== "正常" && item.active).length;
  const keywordConfigNeedsAttention = dueCount > 0;
  const aiDeckNeedsAttention = failedAiTopicDeckCount > 0;
  const topicCoverNeedsAttention = failedTopicCoverImageCount > 0;
  const latestAiTopicDeckSignatureByScope = new Map<string, string>();

  for (const deck of aiTopicDecks) {
    const scopeKey = `${deck.direction}\n${deck.platform}\n${deck.keyword}`;
    if (!latestAiTopicDeckSignatureByScope.has(scopeKey)) {
      latestAiTopicDeckSignatureByScope.set(scopeKey, deck.sampleSignature);
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Admin" title="洞察关键词配置">
        <StatusBadge tone="info">TikHub 数据源</StatusBadge>
        <StatusBadge tone={dueCount > 0 ? "warning" : "success"}>{dueCount} 个待采集</StatusBadge>
        <StatusBadge tone={failedAiTopicDeckCount > 0 ? "warning" : "success"}>{failedAiTopicDeckCount} 个 AI 选题失败</StatusBadge>
        <StatusBadge tone={generatingAiTopicDeckCount > 0 ? "info" : "neutral"}>{generatingAiTopicDeckCount} 个生成中</StatusBadge>
        <StatusBadge tone={failedTopicCoverImageCount > 0 ? "warning" : "success"}>{failedTopicCoverImageCount} 个封面失败</StatusBadge>
      </PageHeader>

      <AdminMetricGrid
        columns="md:grid-cols-4"
        items={[
          { label: "启用关键词", value: number(activeCount) },
          { label: "暂停关键词", value: number(pausedCount) },
          { label: "趋势快照", value: number(snapshotCount) },
          { label: "内容样本", value: number(contentCount) },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <AdminSectionIntro
            title="新增采集关键词"
            description="配置后由内部采集任务按优先级和采集间隔执行。"
            actions={
              <>
                <Link className="text-sm font-black text-stone-900 underline" href="/admin/crawler">
                  查看抓取队列
                </Link>
                <Link className="text-sm font-black text-stone-900 underline" href="/admin/insights/runs">
                  查看采集日志
                </Link>
                <Link className="text-sm font-black text-stone-900 underline" href="/admin/insights/script-generations">
                  查看脚本生成记录
                </Link>
              </>
            }
          />
          <form action={createInsightKeywordConfigAction} className="mt-5 grid gap-4 md:grid-cols-4">
            <Field label="关键词" name="keyword" required placeholder="例如：防晒" />
            <Select label="关键词类型" name="keywordType" defaultValue="品类词">
              {keywordTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
            <Select label="平台" name="platform" defaultValue="xiaohongshu">
              {platforms.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
            <Select label="接口" name="endpoint" defaultValue="xiaohongshuSearchNotes">
              {endpointOptions()}
            </Select>
            <Field label="优先级" name="priority" type="number" defaultValue={100} />
            <Field label="每次采集量" name="perRunLimit" type="number" defaultValue={5} />
            <Field label="采集间隔小时" name="collectIntervalHours" type="number" defaultValue={24} />
            <label className="flex items-end gap-2 rounded-xl border border-stone-200 bg-white/80 px-4 py-3 text-sm font-black text-stone-700">
              <input className="h-4 w-4 accent-[var(--accent)]" name="active" type="checkbox" defaultChecked />
              启用
            </label>
            <div className="md:col-span-4">
              <SubmitButton pendingLabel="正在保存...">保存关键词</SubmitButton>
            </div>
          </form>
        </Card>

        <Card>
          <h2 className="text-xl font-black text-stone-950">采集操作</h2>
          <p className="mt-2 text-sm leading-6 text-stone-500">
            这里管理的是达人页和品牌页共用的采集策略。定时任务会调用内部接口，人工也可以先跑一批验证数据。
          </p>
          <div className="mt-5 grid gap-3">
            <form action={seedInsightKeywordsAction}>
              <SubmitButton className="w-full" pendingLabel="正在初始化..." variant="ghost">
                初始化默认关键词
              </SubmitButton>
            </form>
            <form action={collectConfiguredInsightKeywordsAction} className="grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3">
              <Field label="本次最多采集配置数" name="limit" type="number" defaultValue={5} />
              <SubmitButton className="w-full" pendingLabel="正在采集..." variant="secondary">
                立即采集到期关键词
              </SubmitButton>
            </form>
          </div>
        </Card>
      </div>

      <AdminSettingsAccordion defaultExpandedId="keyword-configs">
        <AdminSettingsAccordionSection
          id="keyword-configs"
          title="关键词配置列表"
          summary={`${configs.length} 个关键词配置，${dueCount} 个待采集，${pausedCount} 个已暂停。`}
          tone={keywordConfigNeedsAttention ? "warning" : "success"}
          abnormal={keywordConfigNeedsAttention}
        >
          <div className="grid gap-4">
            <Card>
              <form className="flex flex-wrap gap-3">
                <select className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700" name="active" defaultValue={active ?? ""}>
                  <option value="">全部状态</option>
                  <option value="true">启用</option>
                  <option value="false">暂停</option>
                </select>
                <select className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700" name="platform" defaultValue={selectedPlatform ?? ""}>
                  <option value="">全部平台</option>
                  {platforms.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <select className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700" name="keywordType" defaultValue={selectedKeywordType ?? ""}>
                  <option value="">全部类型</option>
                  {keywordTypes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <button className="rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-black text-white">筛选</button>
                {active || selectedPlatform || selectedKeywordType ? (
                  <Link className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-black text-stone-700" href="/admin/insights">
                    清空
                  </Link>
                ) : null}
              </form>
            </Card>

            <DataTable
              emptyTitle="还没有关键词配置"
              emptyBody="先初始化默认关键词，或手动新增一个要监控的关键词。"
              headers={["关键词", "采集配置", "节奏", "最近采集", "状态", "编辑", "操作"]}
              rows={configs.map((config) => {
                const updateAction = updateInsightKeywordConfigAction.bind(null, config.id);
                const toggleAction = updateInsightKeywordConfigAction.bind(null, config.id);
                const state = dueState(config);
                return [
                  <div className="grid gap-1" key="keyword">
                    <span className="font-black text-stone-950">{config.keyword}</span>
                    <span className="text-xs text-stone-500">
                      {config.keywordType} / {platformLabel(config.platform)}
                    </span>
                  </div>,
                  <div className="grid gap-1 text-xs" key="config">
                    <span className="font-semibold text-stone-900">
                      {endpointLabels[config.endpoint as keyof typeof TIKHUB_ENDPOINTS] ?? config.endpoint}
                    </span>
                    <span className="text-stone-500">
                      优先级 {config.priority} / 每次 {config.perRunLimit} 条
                    </span>
                  </div>,
                  `${config.collectIntervalHours} 小时`,
                  <div className="grid gap-1" key="time">
                    <span>{config.lastCollectedAt ? shortDate(config.lastCollectedAt) : "未采集"}</span>
                    <span className="text-xs text-stone-500">下次：{nextCollectText(config)}</span>
                  </div>,
                  <StatusBadge key="status" tone={state.tone}>
                    {state.label}
                  </StatusBadge>,
                  <form action={updateAction} className="grid min-w-[34rem] gap-3" key="edit">
                    <div className="grid gap-2 md:grid-cols-4">
                      <input className="rounded-xl border border-stone-200 px-3 py-2 text-sm" name="keyword" defaultValue={config.keyword} required />
                      <select className="rounded-xl border border-stone-200 px-3 py-2 text-sm" name="keywordType" defaultValue={config.keywordType}>
                        {keywordTypes.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                      <select className="rounded-xl border border-stone-200 px-3 py-2 text-sm" name="platform" defaultValue={config.platform}>
                        {platforms.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                      <select className="rounded-xl border border-stone-200 px-3 py-2 text-sm" name="endpoint" defaultValue={config.endpoint}>
                        {endpointOptions()}
                      </select>
                    </div>
                    <div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto_auto]">
                      <input className="rounded-xl border border-stone-200 px-3 py-2 text-sm" name="priority" type="number" defaultValue={config.priority} />
                      <input className="rounded-xl border border-stone-200 px-3 py-2 text-sm" name="perRunLimit" type="number" defaultValue={config.perRunLimit} />
                      <input
                        className="rounded-xl border border-stone-200 px-3 py-2 text-sm"
                        name="collectIntervalHours"
                        type="number"
                        defaultValue={config.collectIntervalHours}
                      />
                      <label className="flex items-center gap-2 whitespace-nowrap rounded-xl border border-stone-200 px-3 py-2 text-sm font-bold">
                        <input className="h-4 w-4 accent-[var(--accent)]" name="active" type="checkbox" defaultChecked={config.active} />
                        启用
                      </label>
                      <SubmitButton pendingLabel="保存中..." variant="ghost">
                        保存
                      </SubmitButton>
                    </div>
                  </form>,
                  <form action={toggleAction} key="action">
                    <input name="intent" type="hidden" value="toggle" />
                    <SubmitButton pendingLabel="处理中..." variant={config.active ? "danger" : "secondary"}>
                      {config.active ? "暂停" : "启用"}
                    </SubmitButton>
                  </form>,
                ];
              })}
            />
          </div>
        </AdminSettingsAccordionSection>

        <AdminSettingsAccordionSection
          id="ai-topic-decks"
          title="AI 选题缓存"
          summary={`${aiTopicDeckCount} 个缓存，${failedAiTopicDeckCount} 个失败，${generatingAiTopicDeckCount} 个生成中。`}
          tone={aiDeckNeedsAttention ? "warning" : generatingAiTopicDeckCount > 0 ? "info" : "success"}
          abnormal={aiDeckNeedsAttention}
        >
          <Card>
            <AdminSectionIntro
              title="AI 选题缓存"
              description="这里展示热点页 AI 选题的缓存、失败次数、冷却时间和最近错误。创作者端会优先展示可用缓存；失败只在这里记录。"
              actions={
                <>
                  <StatusBadge tone="info">{aiTopicDeckCount} 个缓存</StatusBadge>
                  <StatusBadge tone={failedAiTopicDeckCount > 0 ? "warning" : "success"}>{failedAiTopicDeckCount} 个失败</StatusBadge>
                  <StatusBadge tone={generatingAiTopicDeckCount > 0 ? "info" : "neutral"}>{generatingAiTopicDeckCount} 个生成中</StatusBadge>
                </>
              }
            />
            <DataTable
              emptyTitle="暂无 AI 选题缓存"
              emptyBody="当创作者打开热点页或点击重新生成 AI 选题后，这里会记录缓存和失败诊断。"
              headers={["方向 / 平台", "关键词 / 样本", "缓存状态", "内容", "失败与冷却", "最近错误", "操作"]}
              rows={aiTopicDecks.map((deck) => {
                const itemCount = jsonArrayCount(deck.items);
                const scopeKey = `${deck.direction}\n${deck.platform}\n${deck.keyword}`;
                const sourceHint =
                  latestAiTopicDeckSignatureByScope.get(scopeKey) === deck.sampleSignature ? "当前样本缓存" : "上一期缓存，可作为兜底";
                const retryText = deck.refreshRetryAfter
                  ? `冷却至 ${shortDate(deck.refreshRetryAfter)}`
                  : deck.refreshFailureCount >= 3
                    ? "已达 3 次上限"
                    : "无冷却";

                return [
                  <div className="grid gap-1" key="scope">
                    <span className="font-black text-stone-950">{deck.direction}</span>
                    <span className="text-xs text-stone-500">{cacheSourceLabel(deck.platform, deck.sampleSignature)}</span>
                  </div>,
                  <div className="grid gap-1" key="keyword">
                    <span className="font-black text-stone-950">{deck.keyword || "全部关键词"}</span>
                    <span className="break-all text-xs text-stone-500">{deck.cacheKey.slice(0, 12)}</span>
                  </div>,
                  <div className="grid gap-1" key="status">
                    <StatusBadge tone={aiDeckStatusTone(deck.status, deck.refreshStatus)}>{deck.status}</StatusBadge>
                    <span className="text-xs text-stone-500">刷新：{deck.refreshStatus}</span>
                    <span className="text-xs text-stone-500">{sourceHint}</span>
                  </div>,
                  <div className="grid gap-1 text-xs" key="content">
                    <span className="font-black text-stone-900">{itemCount} 张选题</span>
                    <span className="text-stone-500">模型：{deck.model}</span>
                    <span className="text-stone-500">生成：{shortDate(deck.generatedAt)}</span>
                  </div>,
                  <div className="grid gap-1 text-xs" key="failure">
                    <span className="font-black text-stone-900">{deck.refreshFailureCount} / 3 次</span>
                    <span className="text-stone-500">{retryText}</span>
                    <span className="text-stone-500">
                      失败：{deck.lastRefreshFailedAt ? shortDate(deck.lastRefreshFailedAt) : "暂无"}
                    </span>
                  </div>,
                  <p className="max-w-sm line-clamp-3 text-xs text-red-700" key="error">
                    {deck.lastRefreshError ?? deck.errorMessage ?? "暂无错误"}
                  </p>,
                  <form action={retryCreatorTrendAiTopicDeckAction} className="grid gap-2" key="action">
                    <input name="direction" type="hidden" value={deck.direction} />
                    <input name="platform" type="hidden" value={deck.platform} />
                    <input name="keyword" type="hidden" value={deck.keyword} />
                    <SubmitButton pendingLabel="正在重试..." variant="secondary">
                      手动重试
                    </SubmitButton>
                  </form>,
                ];
              })}
            />
          </Card>
        </AdminSettingsAccordionSection>

        <AdminSettingsAccordionSection
          id="topic-cover-failures"
          title="AI 封面失败队列"
          summary={`${failedTopicCoverImageCount} 个封面失败待处理。`}
          tone={topicCoverNeedsAttention ? "warning" : "success"}
          abnormal={topicCoverNeedsAttention}
        >
          <Card>
            <AdminSectionIntro
              title="AI 封面失败队列"
              description="后台可手动重跑失败封面；重跑成功后，达人页再次打开或点击重试会展示新封面。"
              actions={<StatusBadge tone={failedTopicCoverImageCount > 0 ? "warning" : "success"}>{failedTopicCoverImageCount} 个失败</StatusBadge>}
            />
            <DataTable
              emptyTitle="暂无失败封面"
              emptyBody="当前 AI 选题封面没有失败记录。"
              headers={["选题", "平台 / 模型", "错误", "更新时间", "操作"]}
              rows={failedTopicCoverImages.map((image) => [
                <div className="grid max-w-md gap-1" key="title">
                  <span className="line-clamp-2 font-black text-stone-950">{image.sourceTitle}</span>
                  <span className="break-all text-xs text-stone-500">{image.sourceContentId ?? image.cacheKey}</span>
                </div>,
                <div className="grid gap-1 text-xs" key="model">
                  <span className="font-black text-stone-900">{image.platform ?? "未标记平台"}</span>
                  <span className="text-stone-500">{image.model}</span>
                </div>,
                <p className="max-w-sm line-clamp-3 text-xs text-red-700" key="error">
                  {image.errorMessage ?? "封面生成失败"}
                </p>,
                shortDate(image.updatedAt),
                <form action={regenerateTopicCoverImageAction.bind(null, image.id)} key="action">
                  <SubmitButton pendingLabel="正在重新生成..." variant="secondary">
                    重新生成封面
                  </SubmitButton>
                </form>,
              ])}
            />
          </Card>
        </AdminSettingsAccordionSection>
      </AdminSettingsAccordion>
    </div>
  );
}
