import {
  applyInsightCollectionDefaultsAction,
  collectAndRefreshCreatorTrendsAction,
  runCreatorTrendRefreshAction,
  runSlaAutomationAction,
  updatePlatformSettingsAction,
} from "@/lib/actions";
import { SubmitButton } from "@/components/form-controls";
import { Card, Field, PageHeader, StatusBadge, Textarea } from "@/components/ui";
import { INSIGHT_DIRECTIONS } from "@/lib/insights/directions";
import { prisma } from "@/lib/prisma";

function formatDateTime(value: Date | null) {
  if (!value) return "尚未运行";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function isToday(value: Date | null | undefined) {
  if (!value) return false;
  return startOfUtcDay(value).getTime() === startOfUtcDay().getTime();
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sla?: string; trendRefresh?: string; trendCollect?: string; insightDefaults?: string }>;
}) {
  const directionSlugs = INSIGHT_DIRECTIONS.map((direction) => direction.slug);
  const [{ error, sla, trendRefresh, trendCollect, insightDefaults }, settings, [topicCount, contentCount, commentCount, snapshotCount, latestCollectionRun], snapshotRows] =
    await Promise.all([
      searchParams,
      prisma.platformSettings.upsert({
        where: { id: "platform" },
        update: {},
        create: { id: "platform" },
      }),
      Promise.all([
        prisma.insightTopic.count(),
        prisma.insightContent.count(),
        prisma.insightComment.count(),
        prisma.creatorTrendDailySnapshot.count(),
        prisma.insightCollectionRun.findFirst({ orderBy: { startedAt: "desc" } }),
      ]),
      prisma.creatorTrendDailySnapshot.findMany({
        where: { direction: { in: directionSlugs } },
        orderBy: [{ generatedAt: "desc" }, { date: "desc" }],
      }),
    ]);

  const latestSnapshotByDirection = new Map<string, (typeof snapshotRows)[number]>();
  for (const snapshot of snapshotRows) {
    if (!latestSnapshotByDirection.has(snapshot.direction)) {
      latestSnapshotByDirection.set(snapshot.direction, snapshot);
    }
  }
  const aiEnvConfigured = Boolean(process.env.INSIGHT_AI_BASE_URL && process.env.INSIGHT_AI_API_KEY);
  const aiModel = process.env.INSIGHT_AI_MODEL || "chatgpt-4o-latest";

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="管理端" title="平台配置" />

      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
      {sla ? (
        <div className="rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-700">
          SLA 处理完成：自动通过 {sla.split("-")[0] ?? 0} 条，进入平台复核 {sla.split("-")[1] ?? 0} 条。
        </div>
      ) : null}
      {trendRefresh ? (
        <div className="rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-700">达人洞察刷新完成：生成 {trendRefresh} 个方向快照。</div>
      ) : null}
      {trendCollect ? (
        <div className="rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-700">
          采集并刷新完成：采集 {trendCollect} 条内容，生成 {trendRefresh ?? 0} 个方向快照。
        </div>
      ) : null}
      {insightDefaults ? (
        <div className="rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-700">已将推荐采集策略同步到 {insightDefaults} 条关键词配置。</div>
      ) : null}

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-black text-stone-950">洞察数据状态</h2>
            <p className="mt-2 text-sm text-stone-600">
              用来判断达人页为什么会显示示例数据。先看采集表是否有内容，再看对应方向今天是否已经生成快照。
            </p>
          </div>
          <StatusBadge tone={contentCount > 0 && snapshotCount > 0 ? "success" : "warning"}>
            {contentCount > 0 && snapshotCount > 0 ? "数据可用" : "数据不足"}
          </StatusBadge>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-5">
          {[
            ["话题数", topicCount],
            ["内容数", contentCount],
            ["评论数", commentCount],
            ["达人快照", snapshotCount],
            ["最近采集结果", latestCollectionRun?.resultCount ?? 0],
          ].map(([label, value]) => (
            <div className="rounded-2xl border border-stone-200 bg-white/85 p-4" key={String(label)}>
              <p className="text-xs font-black text-stone-500">{label}</p>
              <p className="mt-2 text-2xl font-black text-stone-950">{Number(value).toLocaleString()}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-2 text-sm text-stone-600 md:grid-cols-2">
          <p>
            最近采集：
            {latestCollectionRun ? `${formatDateTime(latestCollectionRun.completedAt ?? latestCollectionRun.startedAt)} / ${latestCollectionRun.status}` : "尚未采集"}
          </p>
          <p>最近快照：{formatDateTime(settings.creatorTrendRefreshLastRunAt)}</p>
        </div>
      </Card>

      <Card>
        <form action={updatePlatformSettingsAction} className="grid gap-4 md:grid-cols-2">
          <Field label="商家验收 SLA（天）" name="acceptanceSlaDays" type="number" defaultValue={settings.acceptanceSlaDays} />
          <Field label="高金额复核阈值（元）" name="highValueReviewThreshold" type="number" defaultValue={Number(settings.highValueReviewThreshold)} />
          <Field label="KOL 补交宽限期（天）" name="resubmissionGraceDays" type="number" defaultValue={settings.resubmissionGraceDays} />
          <Field label="最低提现金额（元）" name="minimumWithdrawalAmount" type="number" defaultValue={Number(settings.minimumWithdrawalAmount)} />
          <Field label="KOL 预览附件上限（MB）" name="kolPreviewMaxMb" type="number" defaultValue={settings.kolPreviewMaxMb} />
          <Field label="平台服务费率（%）" name="platformFeeRatePercent" type="number" defaultValue={Number(settings.platformFeeRate) * 100} />
          <Field label="平台联系邮箱" name="platformContactEmail" type="email" defaultValue={settings.platformContactEmail} />
          <Field label="风险行业关键词（逗号分隔）" name="riskIndustryKeywords" defaultValue={settings.riskIndustryKeywords.join(", ")} />
          <div className="md:col-span-2">
            <Textarea label="风险行业软提示" name="riskIndustryPrompt" defaultValue={settings.riskIndustryPrompt} rows={4} />
          </div>

          <div className="md:col-span-2 rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-stone-950">达人洞察每日刷新</h2>
                <p className="mt-1 text-sm text-stone-600">Render Cron 每天触发后，会按这里的配置生成达人页每日快照。</p>
              </div>
              <StatusBadge tone={settings.creatorTrendRefreshLastStatus === "FAILED" ? "danger" : settings.creatorTrendRefreshLastStatus === "SUCCESS" ? "success" : "neutral"}>
                {settings.creatorTrendRefreshLastStatus ?? "未运行"}
              </StatusBadge>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-black text-stone-700">
                <input name="creatorTrendRefreshEnabled" type="checkbox" defaultChecked={settings.creatorTrendRefreshEnabled} />
                启用每日刷新
              </label>
              <Field label="刷新小时（UTC 0-23）" name="creatorTrendRefreshHourUtc" type="number" defaultValue={settings.creatorTrendRefreshHourUtc} />
              <Field label="每日推荐批次数" name="creatorTrendRefreshBatchCount" type="number" defaultValue={settings.creatorTrendRefreshBatchCount} />
            </div>
            <div className="mt-4">
              <p className="text-sm font-black text-stone-700">刷新方向</p>
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                {INSIGHT_DIRECTIONS.map((direction) => (
                  <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700" key={direction.slug}>
                    <input name="creatorTrendRefreshDirections" type="checkbox" value={direction.slug} defaultChecked={settings.creatorTrendRefreshDirections.includes(direction.slug)} />
                    <span>
                      <span className="block font-black text-stone-900">{direction.label}</span>
                      <span className="block text-xs text-stone-500">{direction.slug}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-black text-stone-700">各方向快照状态</p>
              <div className="mt-2 grid gap-2 md:grid-cols-3">
                {INSIGHT_DIRECTIONS.map((direction) => {
                  const snapshot = latestSnapshotByDirection.get(direction.slug);
                  const fresh = isToday(snapshot?.date);
                  return (
                    <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm" key={direction.slug}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-black text-stone-900">{direction.label}</p>
                        <StatusBadge tone={fresh ? "success" : snapshot ? "warning" : "neutral"}>{fresh ? "今日已生成" : snapshot ? "非今日" : "无快照"}</StatusBadge>
                      </div>
                      <p className="mt-2 text-xs text-stone-500">{snapshot ? `更新于 ${formatDateTime(snapshot.generatedAt)}` : "达人为该方向时会显示实时计算或示例内容。"}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-stone-600">
              <p>上次运行：{formatDateTime(settings.creatorTrendRefreshLastRunAt)}</p>
              {settings.creatorTrendRefreshLastError ? <p className="text-red-700">上次错误：{settings.creatorTrendRefreshLastError}</p> : null}
            </div>
          </div>

          <div className="md:col-span-2 rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-lg font-black text-stone-950">媒体采集策略</h2>
                <p className="mt-1 text-sm text-stone-600">
                  控制每轮最多采几个关键词、0 结果后的重试冷却，以及热点词和普通词的默认频率与数量。保存后会影响后续调度，新建关键词也会直接继承这里的默认值。
                </p>
              </div>
              <SubmitButton formAction={applyInsightCollectionDefaultsAction} pendingLabel="正在同步..." variant="secondary">
                应用默认值到现有关键词
              </SubmitButton>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <Field label="每轮最多采集关键词数" name="insightConfiguredCollectionBatchLimit" type="number" defaultValue={settings.insightConfiguredCollectionBatchLimit} />
              <Field label="0 结果重试冷却（小时）" name="insightZeroResultCooldownHours" type="number" defaultValue={settings.insightZeroResultCooldownHours} />
              <Field label="评论抓取内容数" name="insightCommentTargetCount" type="number" defaultValue={settings.insightCommentTargetCount} />
              <Field label="每条内容评论上限" name="insightCommentPerContentLimit" type="number" defaultValue={settings.insightCommentPerContentLimit} />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-stone-200 bg-white p-4">
                <h3 className="text-sm font-black text-stone-900">热点 / 品类 / 竞品词</h3>
                <p className="mt-1 text-xs text-stone-500">更高频，适合追升温词。</p>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <Field label="默认每次采集内容数" name="insightDefaultHotKeywordPerRunLimit" type="number" defaultValue={settings.insightDefaultHotKeywordPerRunLimit} />
                  <Field label="默认采集间隔（小时）" name="insightDefaultHotKeywordIntervalHours" type="number" defaultValue={settings.insightDefaultHotKeywordIntervalHours} />
                </div>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white p-4">
                <h3 className="text-sm font-black text-stone-900">卖点 / 痛点 / 场景 / 人群词</h3>
                <p className="mt-1 text-xs text-stone-500">更低频，避免在长尾词上浪费额度。</p>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <Field label="默认每次采集内容数" name="insightDefaultStandardPerRunLimit" type="number" defaultValue={settings.insightDefaultStandardPerRunLimit} />
                  <Field label="默认采集间隔（小时）" name="insightDefaultStandardIntervalHours" type="number" defaultValue={settings.insightDefaultStandardIntervalHours} />
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-stone-950">AI 选题改写</h2>
                <p className="mt-1 text-sm text-stone-600">
                  先用真实帖子和评论做规则筛样本，再调用中转站模型把标题和推荐理由改写得更像真人策划。模型凭证从环境变量读取，接口失败时会自动回退到规则生成。
                </p>
              </div>
              <StatusBadge tone={settings.insightAiEnabled && aiEnvConfigured ? "success" : "warning"}>
                {settings.insightAiEnabled && aiEnvConfigured ? "已配置" : "未配置完成"}
              </StatusBadge>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-black text-stone-700">
                <input name="insightAiEnabled" type="checkbox" defaultChecked={settings.insightAiEnabled} />
                启用 AI 选题改写
              </label>
              <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
                <p className="font-black text-stone-900">当前状态</p>
                <p className="mt-1">
                  Base URL：{process.env.INSIGHT_AI_BASE_URL ? "已配置" : "未配置"}<br />
                  API Key：{process.env.INSIGHT_AI_API_KEY ? "已配置" : "未配置"}<br />
                  模型：{aiModel}
                </p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
                <p className="font-black text-stone-900">环境变量</p>
                <p className="mt-1">
                  请在 <code>.env</code> 或部署环境里配置：<br />
                  <code>INSIGHT_AI_BASE_URL</code><br />
                  <code>INSIGHT_AI_API_KEY</code><br />
                  <code>INSIGHT_AI_MODEL</code>（可选，默认 <code>chatgpt-4o-latest</code>）
                </p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
                <p className="font-black text-stone-900">接入说明</p>
                <p className="mt-1">
                  代码会请求 <code>{`{INSIGHT_AI_BASE_URL}/chat/completions`}</code>，所以 Base URL 应该填到带 <code>/v1</code> 的根路径。
                </p>
              </div>
              <div className="md:col-span-2">
                <Textarea label="系统提示词" name="insightAiSystemPrompt" defaultValue={settings.insightAiSystemPrompt} rows={6} />
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <SubmitButton pendingLabel="正在保存...">保存配置</SubmitButton>
          </div>
        </form>
      </Card>

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black text-stone-950">手动刷新达人洞察</h2>
            <p className="mt-2 text-sm text-stone-600">立即按当前配置生成今日快照。它不会采集外部数据，只会把已采集的洞察内容整理成达人页可读快照。</p>
          </div>
          <form action={runCreatorTrendRefreshAction}>
            <SubmitButton pendingLabel="正在刷新..." variant="secondary">
              立即刷新
            </SubmitButton>
          </form>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-stone-950">采集并刷新达人洞察</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              先采集到期关键词，再重建趋势快照，最后生成达人页快照。适合运营发现页面仍是示例时手动跑一轮。
            </p>
          </div>
          <form action={collectAndRefreshCreatorTrendsAction} className="grid min-w-72 gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3">
            <Field label="本次最多采集配置数" name="limit" type="number" defaultValue={settings.insightConfiguredCollectionBatchLimit} />
            <SubmitButton pendingLabel="正在采集并刷新..." variant="secondary">
              采集并刷新
            </SubmitButton>
          </form>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-black text-stone-950">Render Cron 建议</h2>
        <div className="mt-4 grid gap-4 text-sm text-stone-700 lg:grid-cols-2">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <p className="font-black text-stone-950">采集任务：每 6 小时</p>
            <p className="mt-2 text-stone-600">负责从已配置关键词采集内容，补充真实数据源。</p>
            <code className="mt-3 block whitespace-pre-wrap rounded-xl bg-stone-950 p-3 text-xs text-white">
              {`curl -X POST "$NEXT_PUBLIC_APP_URL/api/internal/insights/collect" -H "Authorization: Bearer $INSIGHTS_INTERNAL_TOKEN" -H "Content-Type: application/json" -d '{"type":"configured_keywords","limit":10}'`}
            </code>
            <p className="mt-2 text-xs text-stone-500">Schedule: 0 */6 * * *</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <p className="font-black text-stone-950">快照任务：每小时检查</p>
            <p className="mt-2 text-stone-600">负责按 Admin 配置的 UTC 小时生成达人页每日快照。</p>
            <code className="mt-3 block whitespace-pre-wrap rounded-xl bg-stone-950 p-3 text-xs text-white">
              {`curl -X POST "$NEXT_PUBLIC_APP_URL/api/internal/creator-trends/daily-refresh" -H "Authorization: Bearer $INSIGHTS_INTERNAL_TOKEN"`}
            </code>
            <p className="mt-2 text-xs text-stone-500">Schedule: 0 * * * *</p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-black text-stone-950">第一版配置边界</h2>
        <div className="mt-3 grid gap-3 text-sm leading-6 text-stone-600">
          <p>这些字段只覆盖 V1 必须稳定的少数平台参数：验收时限、补交宽限、高金额复核、提现门槛、附件上限、服务费率和联系邮箱。</p>
          <p>风险行业采用软提示，不阻塞商家创建任务；但在付款托管前仍需要商家确认广告披露和平台规则。</p>
          <p>资金争议和任务争议必须留在系统内处理，联系邮箱只用于一般问题。</p>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black text-stone-950">SLA 自动处理</h2>
            <p className="mt-2 text-sm text-stone-600">手动扫描逾期未验收的发布链接：低金额任务自动通过并直接入账，高金额任务自动进入平台争议处理。</p>
          </div>
          <form action={runSlaAutomationAction}>
            <SubmitButton pendingLabel="正在运行..." variant="secondary">
              运行 SLA 处理
            </SubmitButton>
          </form>
        </div>
      </Card>
    </div>
  );
}
