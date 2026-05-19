import {
  applyInsightCollectionDefaultsAction,
  collectAndRefreshCreatorTrendsAction,
  runCreatorTrendRefreshAction,
  runSlaAutomationAction,
  updateAlipayPaymentConfigAction,
  updatePlatformSettingsAction,
  updateWechatPaymentConfigAction,
} from "@/lib/actions";
import { AdminSettingsAccordion, AdminSettingsAccordionSection } from "@/components/admin-settings-accordion";
import { AdminMetricGrid, AdminNotice } from "@/components/admin-workbench";
import { AdminPromptTester } from "@/components/admin-prompt-tester";
import { SubmitButton } from "@/components/form-controls";
import { Card, Field, PageHeader, StatusBadge, Textarea } from "@/components/ui";
import {
  DEFAULT_INSIGHT_AI_CASE_ANALYSIS_PROMPT,
  DEFAULT_INSIGHT_AI_BASE_URL,
  DEFAULT_INSIGHT_AI_CASE_GRAPHIC_SCRIPT_PROMPT,
  DEFAULT_INSIGHT_AI_CASE_VIDEO_SCRIPT_PROMPT,
  DEFAULT_INSIGHT_AI_GRAPHIC_TABLE_SCRIPT_PROMPT,
  DEFAULT_INSIGHT_AI_MODEL,
  DEFAULT_INSIGHT_AI_TOPIC_DECK_PROMPT,
  DEFAULT_INSIGHT_AI_VIDEO_TABLE_SCRIPT_PROMPT,
  DEFAULT_INSIGHT_IMAGE_AI_MODEL,
  INSIGHT_SCRIPT_PROMPT_VERSION,
  INSIGHT_TOPIC_DECK_PROMPT_VERSION,
} from "@/lib/insights/ai-prompts";
import { INSIGHT_DIRECTIONS } from "@/lib/insights/directions";
import { prisma } from "@/lib/prisma";
import { getAdminContext, hasAdminPermission } from "@/lib/admin";

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

function isPublicUrl(value: string | null | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

function requiredStatus(label: string, ready: boolean, detail: string) {
  return { label, ready, detail };
}

function hasPromptExample(prompt: string | null | undefined, marker: string) {
  return Boolean(prompt?.includes(marker) && prompt.includes(INSIGHT_SCRIPT_PROMPT_VERSION));
}

function shouldUseDefaultTopicPrompt(prompt: string | null | undefined) {
  const value = prompt?.trim() ?? "";
  if (!value) return true;
  if (value.includes(INSIGHT_TOPIC_DECK_PROMPT_VERSION)) return false;
  return true;
}

function PaymentReadinessPanel({
  title,
  items,
  failureCount,
}: {
  title: string;
  items: Array<{ label: string; ready: boolean; detail: string }>;
  failureCount: number;
}) {
  const readyCount = items.filter((item) => item.ready).length;
  const allReady = readyCount === items.length && failureCount === 0;
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-stone-950">{title}</h3>
          <p className="mt-1 text-sm text-stone-500">
            {readyCount}/{items.length} 项通过，最近失败事件 {failureCount} 条
          </p>
        </div>
        <StatusBadge tone={allReady ? "success" : "warning"}>{allReady ? "可测试" : "需处理"}</StatusBadge>
      </div>
      <div className="mt-4 grid gap-2">
        {items.map((item) => (
          <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm" key={item.label}>
            <div>
              <p className="font-black text-stone-900">{item.label}</p>
              <p className="mt-1 text-stone-500">{item.detail}</p>
            </div>
            <StatusBadge tone={item.ready ? "success" : "warning"}>{item.ready ? "通过" : "待配置"}</StatusBadge>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sla?: string; trendRefresh?: string; trendCollect?: string; insightDefaults?: string; payment?: string }>;
}) {
  const directionSlugs = INSIGHT_DIRECTIONS.map((direction) => direction.slug);
  const [
    { error, sla, trendRefresh, trendCollect, insightDefaults, payment },
    settings,
    [topicCount, contentCount, commentCount, snapshotCount, latestCollectionRun],
    snapshotRows,
    alipayConfig,
    wechatConfig,
    paymentEvents,
    adminContext,
  ] =
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
      prisma.paymentProviderConfig.findUnique({ where: { provider: "alipay" } }),
      prisma.paymentProviderConfig.findUnique({ where: { provider: "wechat_pay" } }),
      prisma.paymentProviderEvent.findMany({
        where: { provider: { in: ["alipay", "wechat_pay"] } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      getAdminContext(),
    ]);

  const latestSnapshotByDirection = new Map<string, (typeof snapshotRows)[number]>();
  for (const snapshot of snapshotRows) {
    if (!latestSnapshotByDirection.has(snapshot.direction)) {
      latestSnapshotByDirection.set(snapshot.direction, snapshot);
    }
  }
  const aiBaseUrl = settings.insightAiBaseUrl || DEFAULT_INSIGHT_AI_BASE_URL;
  const aiConfigured = Boolean(aiBaseUrl && settings.insightAiApiKey);
  const aiModel = settings.insightAiModel || DEFAULT_INSIGHT_AI_MODEL;
  const imageAiBaseUrl = settings.insightImageAiBaseUrl || aiBaseUrl;
  const imageAiKeyConfigured = Boolean(settings.insightImageAiApiKey || settings.insightAiApiKey);
  const imageAiModel = settings.insightImageAiModel || DEFAULT_INSIGHT_IMAGE_AI_MODEL;
  const topicRewritePrompt = shouldUseDefaultTopicPrompt(settings.insightAiSystemPrompt) ? DEFAULT_INSIGHT_AI_TOPIC_DECK_PROMPT : settings.insightAiSystemPrompt;
  const graphicScriptPrompt =
    hasPromptExample(settings.insightAiGraphicScriptSystemPrompt, "graphicTables") ? settings.insightAiGraphicScriptSystemPrompt : DEFAULT_INSIGHT_AI_GRAPHIC_TABLE_SCRIPT_PROMPT;
  const videoScriptPrompt =
    hasPromptExample(settings.insightAiVideoScriptSystemPrompt, "videoTables") ? settings.insightAiVideoScriptSystemPrompt : DEFAULT_INSIGHT_AI_VIDEO_TABLE_SCRIPT_PROMPT;
  const caseAnalysisPrompt =
    hasPromptExample(settings.insightAiCaseAnalysisSystemPrompt, "caseAnalysisTables") ? settings.insightAiCaseAnalysisSystemPrompt : DEFAULT_INSIGHT_AI_CASE_ANALYSIS_PROMPT;
  const caseGraphicPrompt =
    hasPromptExample(settings.insightAiCaseGraphicScriptSystemPrompt, "graphicTables") ? settings.insightAiCaseGraphicScriptSystemPrompt : DEFAULT_INSIGHT_AI_CASE_GRAPHIC_SCRIPT_PROMPT;
  const caseVideoPrompt =
    hasPromptExample(settings.insightAiCaseVideoScriptSystemPrompt, "videoTables") ? settings.insightAiCaseVideoScriptSystemPrompt : DEFAULT_INSIGHT_AI_CASE_VIDEO_SCRIPT_PROMPT;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const alipayFailures = paymentEvents.filter((event) => event.provider === "alipay" && event.status === "FAILED").length;
  const wechatFailures = paymentEvents.filter((event) => event.provider === "wechat_pay" && event.status === "FAILED").length;
  const alipayReadiness = [
    requiredStatus("渠道启用", Boolean(alipayConfig?.enabled), alipayConfig?.enabled ? "Admin 已启用支付宝。" : "未启用时品牌端不会进入真实付款流程。"),
    requiredStatus("品牌端展示", Boolean(alipayConfig?.visibleToBrand), alipayConfig?.visibleToBrand ? "品牌端会显示支付宝入口。" : "关闭后品牌端会隐藏或显示维护状态。"),
    requiredStatus("App ID", Boolean(alipayConfig?.appId), alipayConfig?.appId ? "已填写应用 App ID。" : "需要在支付宝开放平台申请后填写。"),
    requiredStatus("网关地址", Boolean(alipayConfig?.gatewayUrl), alipayConfig?.gatewayUrl ?? "未配置网关地址。"),
    requiredStatus("异步回调 URL", isPublicUrl(alipayConfig?.notifyUrl), alipayConfig?.notifyUrl ? `${alipayConfig.notifyUrl}，正式测试建议使用公网 HTTPS。` : "需要配置 /api/payments/alipay/notify 的公网 HTTPS 地址。"),
    requiredStatus("应用私钥", Boolean(alipayConfig?.privateKeyConfigured), alipayConfig?.privateKeyConfigured ? "已加密保存。" : "需要填写应用 RSA 私钥。"),
    requiredStatus("支付宝公钥", Boolean(alipayConfig?.publicKeyConfigured), alipayConfig?.publicKeyConfigured ? "已加密保存。" : "需要填写支付宝公钥。"),
    requiredStatus("配置加密密钥", Boolean(process.env.PAYMENT_CONFIG_SECRET || process.env.AUTH_SECRET), "生产环境建议配置 PAYMENT_CONFIG_SECRET。"),
  ];
  const wechatReadiness = [
    requiredStatus("渠道启用", Boolean(wechatConfig?.enabled), wechatConfig?.enabled ? "Admin 已启用微信支付。" : "未启用时品牌端不会进入真实付款流程。"),
    requiredStatus("品牌端展示", Boolean(wechatConfig?.visibleToBrand), wechatConfig?.visibleToBrand ? "品牌端会显示微信支付入口。" : "关闭后品牌端会隐藏或显示维护状态。"),
    requiredStatus("App ID", Boolean(wechatConfig?.appId), wechatConfig?.appId ? "已填写 App ID。" : "需要填写公众号/小程序/应用 App ID。"),
    requiredStatus("商户号", Boolean(wechatConfig?.merchantId), wechatConfig?.merchantId ? "已填写 MCHID。" : "需要填写微信支付商户号。"),
    requiredStatus("证书序列号", Boolean(wechatConfig?.certificateSerialNo), wechatConfig?.certificateSerialNo ? "已填写商户 API 证书序列号。" : "需要从微信商户平台获取。"),
    requiredStatus("网关地址", Boolean(wechatConfig?.gatewayUrl), wechatConfig?.gatewayUrl ?? "未配置网关地址。"),
    requiredStatus("异步回调 URL", isPublicUrl(wechatConfig?.notifyUrl), wechatConfig?.notifyUrl ? `${wechatConfig.notifyUrl}，正式测试建议使用公网 HTTPS。` : "需要配置 /api/payments/wechat/notify 的公网 HTTPS 地址。"),
    requiredStatus("商户私钥", Boolean(wechatConfig?.privateKeyConfigured), wechatConfig?.privateKeyConfigured ? "已加密保存。" : "需要填写商户 API 私钥。"),
    requiredStatus("平台公钥", Boolean(wechatConfig?.publicKeyConfigured), wechatConfig?.publicKeyConfigured ? "已加密保存。" : "需要填写微信支付平台公钥或证书公钥。"),
    requiredStatus("APIv3 密钥", Boolean(wechatConfig?.apiV3KeyConfigured), wechatConfig?.apiV3KeyConfigured ? "已加密保存。" : "需要填写 APIv3 密钥用于解密回调。"),
    requiredStatus("配置加密密钥", Boolean(process.env.PAYMENT_CONFIG_SECRET || process.env.AUTH_SECRET), "生产环境建议配置 PAYMENT_CONFIG_SECRET。"),
  ];
  const paymentReady = alipayReadiness.every((item) => item.ready) && wechatReadiness.every((item) => item.ready);
  const paymentFailureTotal = alipayFailures + wechatFailures;
  const insightReady = contentCount > 0 && snapshotCount > 0;
  const alipayConfigReady = Boolean(alipayConfig?.enabled && alipayConfig?.privateKeyConfigured && alipayConfig?.publicKeyConfigured);
  const wechatConfigReady = Boolean(
    wechatConfig?.enabled && wechatConfig?.privateKeyConfigured && wechatConfig?.publicKeyConfigured && wechatConfig?.apiV3KeyConfigured,
  );
  const trendSnapshotsFresh = INSIGHT_DIRECTIONS.every((direction) => isToday(latestSnapshotByDirection.get(direction.slug)?.date));
  const aiSectionReady = settings.insightAiEnabled && aiConfigured;
  const automationSectionHealthy = settings.creatorTrendRefreshLastStatus !== "FAILED";
  const platformConfigReady = aiSectionReady && automationSectionHealthy && trendSnapshotsFresh;

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="管理端" title="平台配置" />

      {error ? <AdminNotice tone="danger">{error}</AdminNotice> : null}
      {sla ? (
        <AdminNotice tone="success">
          SLA 处理完成：自动通过 {sla.split("-")[0] ?? 0} 条，进入平台复核 {sla.split("-")[1] ?? 0} 条。
        </AdminNotice>
      ) : null}
      {trendRefresh ? (
        <AdminNotice tone="success">达人洞察刷新完成：生成 {trendRefresh} 个方向快照。</AdminNotice>
      ) : null}
      {trendCollect ? (
        <AdminNotice tone="success">
          采集并刷新完成：采集 {trendCollect} 条内容，生成 {trendRefresh ?? 0} 个方向快照。
        </AdminNotice>
      ) : null}
      {insightDefaults ? (
        <AdminNotice tone="success">已将推荐采集策略同步到 {insightDefaults} 条关键词配置。</AdminNotice>
      ) : null}

      {payment ? <AdminNotice tone="success">支付配置已保存。</AdminNotice> : null}

      <AdminMetricGrid
        columns="md:grid-cols-3 xl:grid-cols-6"
        items={[
          { label: "支付上线", value: paymentReady ? "已就绪" : "待处理", sub: `${paymentFailureTotal} 条失败事件` },
          { label: "洞察话题", value: topicCount, sub: `内容 ${contentCount} / 评论 ${commentCount}` },
          { label: "达人快照", value: snapshotCount, sub: trendSnapshotsFresh ? "今日已刷新" : "仍有方向未刷新" },
          { label: "AI 配置", value: aiSectionReady ? "已启用" : "未完成", sub: aiModel },
          { label: "自动化状态", value: automationSectionHealthy ? "正常" : "失败", sub: formatDateTime(settings.creatorTrendRefreshLastRunAt) },
          { label: "最近采集", value: latestCollectionRun?.resultCount ?? 0, sub: latestCollectionRun ? latestCollectionRun.status : "尚未采集" },
        ]}
      />

      <AdminSettingsAccordion defaultExpandedId="payment-readiness">
        <AdminSettingsAccordionSection
          abnormal={!paymentReady}
          id="payment-readiness"
          summary={`支付宝 ${alipayReadiness.filter((item) => item.ready).length}/${alipayReadiness.length} · 微信 ${wechatReadiness.filter((item) => item.ready).length}/${wechatReadiness.length} · 失败事件 ${paymentFailureTotal} 条`}
          title="支付上线自检"
          tone={paymentReady ? "success" : "warning"}
        >
      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-black text-stone-950">支付上线自检</h2>
            <p className="mt-2 text-sm text-stone-600">
              填完支付宝和微信支付商户资料后，先看这里。全部通过后，再用小额付款单做真实支付、回调和退款测试。
            </p>
          </div>
          <StatusBadge tone={alipayReadiness.every((item) => item.ready) && wechatReadiness.every((item) => item.ready) ? "success" : "warning"}>
            {alipayReadiness.every((item) => item.ready) && wechatReadiness.every((item) => item.ready) ? "配置完整" : "仍需配置"}
          </StatusBadge>
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <PaymentReadinessPanel title="支付宝" items={alipayReadiness} failureCount={alipayFailures} />
          <PaymentReadinessPanel title="微信支付" items={wechatReadiness} failureCount={wechatFailures} />
        </div>
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm leading-6 text-amber-800">
          当前应用地址：<code>{appUrl || "未配置 NEXT_PUBLIC_APP_URL"}</code>。正式测试时，支付宝和微信支付后台里的回调地址必须能被公网访问，并且建议使用 HTTPS。
        </div>
      </Card>
        </AdminSettingsAccordionSection>

        <AdminSettingsAccordionSection
          abnormal={!insightReady}
          id="insight-status"
          summary={`话题 ${topicCount} · 内容 ${contentCount} · 评论 ${commentCount} · 快照 ${snapshotCount}`}
          title="洞察数据状态"
          tone={insightReady ? "success" : "warning"}
        >
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
        </AdminSettingsAccordionSection>

        <AdminSettingsAccordionSection
          abnormal={!alipayConfigReady}
          id="alipay-config"
          summary={`${alipayConfig?.enabled ? "已启用" : "未启用"} · ${alipayConfig?.appId ? "App ID 已配" : "缺 App ID"} · 失败事件 ${alipayFailures} 条`}
          title="支付配置 / Alipay"
          tone={alipayConfigReady ? "success" : "warning"}
        >
      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-black text-stone-950">支付配置 / Alipay</h2>
            <p className="mt-2 text-sm text-stone-600">
              品牌付款单会优先使用这里的支付宝配置。密钥只保存加密值，页面不会回显明文；如需修改，请重新粘贴完整密钥。
            </p>
          </div>
          <StatusBadge tone={alipayConfig?.enabled && alipayConfig.privateKeyConfigured && alipayConfig.publicKeyConfigured ? "success" : "warning"}>
            {alipayConfig?.enabled ? "已启用" : "未启用"}
          </StatusBadge>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm">
            <p className="font-black text-stone-900">环境</p>
            <p className="mt-1 text-stone-600">{alipayConfig?.environment ?? "sandbox"}</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm">
            <p className="font-black text-stone-900">App ID</p>
            <p className="mt-1 break-all text-stone-600">{alipayConfig?.appId ?? "未配置"}</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm">
            <p className="font-black text-stone-900">应用私钥</p>
            <p className="mt-1 text-stone-600">{alipayConfig?.privateKeyConfigured ? "已加密保存" : "未配置"}</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm">
            <p className="font-black text-stone-900">支付宝公钥</p>
            <p className="mt-1 text-stone-600">{alipayConfig?.publicKeyConfigured ? "已加密保存" : "未配置"}</p>
          </div>
        </div>

        {hasAdminPermission(adminContext.profile, "payment.config.manage") ? (
          <form action={updateAlipayPaymentConfigAction} className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-black text-stone-700">
              <input name="enabled" type="checkbox" defaultChecked={alipayConfig?.enabled ?? false} />
              启用支付宝付款
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-black text-stone-700">
              <input name="visibleToBrand" type="checkbox" defaultChecked={alipayConfig?.visibleToBrand ?? true} />
              对品牌方展示
            </label>
            <label className="grid gap-2 text-sm font-medium text-stone-700">
              运行环境
              <select
                className="rounded-xl border border-stone-200 bg-white/90 px-4 py-3 text-stone-950 shadow-inner outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-amber-100"
                name="environment"
                defaultValue={alipayConfig?.environment ?? "sandbox"}
              >
                <option value="sandbox">沙箱</option>
                <option value="production">正式</option>
              </select>
            </label>
            <Field label="显示名称" name="displayName" defaultValue={alipayConfig?.displayName ?? "Alipay"} required />
            <Field label="展示顺序" name="sortOrder" type="number" defaultValue={alipayConfig?.sortOrder ?? 100} required />
            <Field label="App ID" name="appId" defaultValue={alipayConfig?.appId ?? ""} required />
            <Field label="网关地址" name="gatewayUrl" defaultValue={alipayConfig?.gatewayUrl ?? "https://openapi-sandbox.dl.alipaydev.com/gateway.do"} required />
            <Field label="异步通知 URL" name="notifyUrl" defaultValue={alipayConfig?.notifyUrl ?? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/payments/alipay/notify`} required />
            <Field label="同步返回 URL" name="returnUrl" defaultValue={alipayConfig?.returnUrl ?? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/brand/billing?tab=invoices`} />
            <div className="md:col-span-2">
              <Textarea label="维护提示文案" name="maintenanceMessage" defaultValue={alipayConfig?.maintenanceMessage ?? "支付宝通道维护中，请使用其他付款方式。"} rows={3} />
            </div>
            <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
              <Textarea label="应用私钥（留空则保持原配置）" name="appPrivateKey" rows={7} />
              <Textarea label="支付宝公钥（留空则保持原配置）" name="alipayPublicKey" rows={7} />
            </div>
            <div className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-800">
              只有具备支付配置权限的管理员可以保存支付配置。审计日志只记录是否修改密钥，不记录密钥内容。生产环境请配置 <code>PAYMENT_CONFIG_SECRET</code>。
            </div>
            <div className="md:col-span-2">
              <SubmitButton pendingLabel="正在保存支付配置..." variant="secondary">保存支付宝配置</SubmitButton>
            </div>
          </form>
        ) : (
          <div className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
            只有具备支付配置权限的管理员可以修改支付密钥和支付网关配置。
          </div>
        )}
      </Card>
        </AdminSettingsAccordionSection>

        <AdminSettingsAccordionSection
          abnormal={!wechatConfigReady}
          id="wechat-config"
          summary={`${wechatConfig?.enabled ? "已启用" : "未启用"} · ${wechatConfig?.merchantId ? "MCHID 已配" : "缺 MCHID"} · 失败事件 ${wechatFailures} 条`}
          title="支付配置 / WeChat Pay"
          tone={wechatConfigReady ? "success" : "warning"}
        >
      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-black text-stone-950">支付配置 / WeChat Pay</h2>
            <p className="mt-2 text-sm text-stone-600">
              当前接入微信支付 V3 Native 扫码支付。商户私钥和 APIv3 密钥加密保存，页面不会回显明文。
            </p>
          </div>
          <StatusBadge tone={wechatConfig?.enabled && wechatConfig.privateKeyConfigured && wechatConfig.publicKeyConfigured && wechatConfig.apiV3KeyConfigured ? "success" : "warning"}>
            {wechatConfig?.enabled ? "已启用" : "未启用"}
          </StatusBadge>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm">
            <p className="font-black text-stone-900">商户号</p>
            <p className="mt-1 break-all text-stone-600">{wechatConfig?.merchantId ?? "未配置"}</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm">
            <p className="font-black text-stone-900">App ID</p>
            <p className="mt-1 break-all text-stone-600">{wechatConfig?.appId ?? "未配置"}</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm">
            <p className="font-black text-stone-900">商户私钥</p>
            <p className="mt-1 text-stone-600">{wechatConfig?.privateKeyConfigured ? "已加密保存" : "未配置"}</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm">
            <p className="font-black text-stone-900">平台公钥</p>
            <p className="mt-1 text-stone-600">{wechatConfig?.publicKeyConfigured ? "已加密保存" : "未配置"}</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm">
            <p className="font-black text-stone-900">APIv3 密钥</p>
            <p className="mt-1 text-stone-600">{wechatConfig?.apiV3KeyConfigured ? "已加密保存" : "未配置"}</p>
          </div>
        </div>

        {hasAdminPermission(adminContext.profile, "payment.config.manage") ? (
          <form action={updateWechatPaymentConfigAction} className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-black text-stone-700">
              <input name="enabled" type="checkbox" defaultChecked={wechatConfig?.enabled ?? false} />
              启用微信支付
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-black text-stone-700">
              <input name="visibleToBrand" type="checkbox" defaultChecked={wechatConfig?.visibleToBrand ?? true} />
              对品牌方展示
            </label>
            <label className="grid gap-2 text-sm font-medium text-stone-700">
              运行环境
              <select
                className="rounded-xl border border-stone-200 bg-white/90 px-4 py-3 text-stone-950 shadow-inner outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-amber-100"
                name="environment"
                defaultValue={wechatConfig?.environment ?? "production"}
              >
                <option value="sandbox">沙箱</option>
                <option value="production">正式</option>
              </select>
            </label>
            <Field label="显示名称" name="displayName" defaultValue={wechatConfig?.displayName ?? "WeChat Pay"} required />
            <Field label="展示顺序" name="sortOrder" type="number" defaultValue={wechatConfig?.sortOrder ?? 110} required />
            <Field label="App ID" name="appId" defaultValue={wechatConfig?.appId ?? ""} required />
            <Field label="商户号 MCHID" name="merchantId" defaultValue={wechatConfig?.merchantId ?? ""} required />
            <Field label="商户 API 证书序列号" name="certificateSerialNo" defaultValue={wechatConfig?.certificateSerialNo ?? ""} required />
            <Field label="网关地址" name="gatewayUrl" defaultValue={wechatConfig?.gatewayUrl ?? "https://api.mch.weixin.qq.com"} required />
            <Field label="异步通知 URL" name="notifyUrl" defaultValue={wechatConfig?.notifyUrl ?? `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/payments/wechat/notify`} required />
            <div className="md:col-span-2">
              <Textarea label="维护提示文案" name="maintenanceMessage" defaultValue={wechatConfig?.maintenanceMessage ?? "微信支付通道维护中，请使用其他付款方式。"} rows={3} />
            </div>
            <div className="md:col-span-2 grid gap-4 md:grid-cols-3">
              <Textarea label="商户 API 私钥（留空则保持原配置）" name="merchantPrivateKey" rows={7} />
              <Textarea label="微信支付平台公钥/证书公钥（留空则保持原配置）" name="platformPublicKey" rows={7} />
              <Textarea label="APIv3 密钥（留空则保持原配置）" name="apiV3Key" rows={7} />
            </div>
            <div className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-amber-800">
              微信支付 Native 下单会生成二维码。APIv3 密钥用于解密微信支付异步通知，请和商户平台配置保持一致。
            </div>
            <div className="md:col-span-2">
              <SubmitButton pendingLabel="正在保存微信支付配置..." variant="secondary">保存微信支付配置</SubmitButton>
            </div>
          </form>
        ) : (
          <div className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
            只有具备支付配置权限的管理员可以修改微信支付密钥和支付网关配置。
          </div>
        )}
      </Card>
        </AdminSettingsAccordionSection>

        <AdminSettingsAccordionSection
          abnormal={!platformConfigReady}
          id="platform-rules"
          summary={`趋势刷新 ${settings.creatorTrendRefreshEnabled ? "已启用" : "未启用"} · AI ${settings.insightAiEnabled ? "已启用" : "未启用"} · ${aiConfigured ? "AI Key 已配" : "缺 AI Key"}`}
          title="平台规则 / 趋势 / AI"
          tone={platformConfigReady ? "success" : "warning"}
        >
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
          <Field label="作品刷新冷却（分钟）" name="crawlerProofRefreshCooldownMinutes" type="number" defaultValue={settings.crawlerProofRefreshCooldownMinutes} />
          <Field label="品牌每小时作品刷新上限" name="crawlerBrandHourlyRefreshLimit" type="number" defaultValue={settings.crawlerBrandHourlyRefreshLimit} />
          <Field label="账号刷新冷却（分钟）" name="crawlerSocialRefreshCooldownMinutes" type="number" defaultValue={settings.crawlerSocialRefreshCooldownMinutes} />
          <Field label="抓取任务最大重试次数" name="crawlerMaxAttempts" type="number" defaultValue={settings.crawlerMaxAttempts} />
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
                <h2 className="text-lg font-black text-stone-950">AI 选题生成</h2>
                <p className="mt-1 text-sm text-stone-600">
                  先用真实帖子和评论做规则筛样本，再调用中转站模型把标题和推荐理由改写得更像真人策划。接口地址和 API Key 可在此处配置，接口失败时会自动回退到规则生成。
                </p>
              </div>
              <StatusBadge tone={settings.insightAiEnabled && aiConfigured ? "success" : "warning"}>
                {settings.insightAiEnabled && aiConfigured ? "已配置" : "未配置完成"}
              </StatusBadge>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-black text-stone-700">
                <input name="insightAiEnabled" type="checkbox" defaultChecked={settings.insightAiEnabled} />
                启用 AI 选题生成
              </label>
              <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
                <p className="font-black text-stone-900">当前状态</p>
                <p className="mt-1">
                  Base URL：{aiBaseUrl}<br />
                  API Key：{settings.insightAiApiKey ? "已配置" : "未配置"}<br />
                  模型：{aiModel}
                </p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
                <p className="font-black text-stone-900">4Router 默认配置</p>
                <p className="mt-1">
                  Base URL 建议填：<br />
                  <code>{DEFAULT_INSIGHT_AI_BASE_URL}</code><br />
                  文本模型建议用 <code>gpt-5.5</code>，需要更快时可改为 <code>gpt-5.4-mini</code>。API Key 留空保存时会保留原配置。
                </p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
                <p className="font-black text-stone-900">接入说明</p>
                <p className="mt-1">
                  代码会请求 <code>{`{BaseURL}/chat/completions`}</code>，所以 Base URL 应该填到带 <code>/v1</code> 的根路径。
                </p>
              </div>
              <Field label="AI Base URL" name="insightAiBaseUrl" defaultValue={aiBaseUrl} />
              <Field label="AI 模型名" name="insightAiModel" defaultValue={aiModel} placeholder="gpt-5.5 或 gpt-5.4-mini" />
              <Field label="AI API Key（留空保持原配置）" name="insightAiApiKey" type="password" placeholder={settings.insightAiApiKey ? "已配置，留空不变" : "粘贴 4Router API Key"} />
              <div className="md:col-span-2 rounded-xl border border-cyan-200 bg-cyan-50/60 px-4 py-3 text-sm text-cyan-900">
                <p className="font-black">前端生图模型配置</p>
                <p className="mt-1 text-cyan-800">
                  默认沿用文本 AI 的 Base URL 和 API Key；如果后续生图服务需要单独网关或单独 Key，可以在下面覆盖。当前生图模型：{imageAiModel}
                  ，Key：{imageAiKeyConfigured ? "已配置或沿用文本 Key" : "未配置"}。
                </p>
              </div>
              <Field label="生图 Base URL（留空沿用文本 AI）" name="insightImageAiBaseUrl" defaultValue={settings.insightImageAiBaseUrl ?? ""} placeholder={imageAiBaseUrl} />
              <Field label="生图模型名" name="insightImageAiModel" defaultValue={imageAiModel} />
              <Field
                label="生图 API Key（留空沿用文本 AI Key）"
                name="insightImageAiApiKey"
                type="password"
                placeholder={settings.insightImageAiApiKey ? "已单独配置，留空不变" : settings.insightAiApiKey ? "留空沿用文本 AI Key" : "粘贴 4Router API Key"}
              />
              <div className="md:col-span-2">
                <Textarea label="选题生成提示词" name="insightAiSystemPrompt" defaultValue={topicRewritePrompt} rows={14} />
                <AdminPromptTester label="选题生成提示词" promptField="insightAiSystemPrompt" promptType="topicRewrite" />
              </div>
              <input name="insightAiScriptSystemPrompt" type="hidden" value={settings.insightAiScriptSystemPrompt} />
              <div className="md:col-span-2">
                <Textarea
                  label="图文脚本生成提示词"
                  name="insightAiGraphicScriptSystemPrompt"
                  defaultValue={graphicScriptPrompt}
                  rows={12}
                />
                <AdminPromptTester label="图文脚本生成提示词" promptField="insightAiGraphicScriptSystemPrompt" promptType="topicGraphic" />
              </div>
              <div className="md:col-span-2">
                <Textarea
                  label="视频脚本生成提示词"
                  name="insightAiVideoScriptSystemPrompt"
                  defaultValue={videoScriptPrompt}
                  rows={12}
                />
                <AdminPromptTester label="视频脚本生成提示词" promptField="insightAiVideoScriptSystemPrompt" promptType="topicVideo" />
              </div>
              <div className="md:col-span-2">
                <Textarea
                  label="爆款案例拆解提示词"
                  name="insightAiCaseAnalysisSystemPrompt"
                  defaultValue={caseAnalysisPrompt}
                  rows={10}
                />
                <AdminPromptTester label="爆款案例拆解提示词" promptField="insightAiCaseAnalysisSystemPrompt" promptType="caseAnalysis" />
              </div>
              <div className="md:col-span-2">
                <Textarea
                  label="爆款案例图文改写提示词"
                  name="insightAiCaseGraphicScriptSystemPrompt"
                  defaultValue={caseGraphicPrompt}
                  rows={8}
                />
                <AdminPromptTester label="爆款案例图文改写提示词" promptField="insightAiCaseGraphicScriptSystemPrompt" promptType="caseGraphic" />
              </div>
              <div className="md:col-span-2">
                <Textarea
                  label="爆款案例视频改写提示词"
                  name="insightAiCaseVideoScriptSystemPrompt"
                  defaultValue={caseVideoPrompt}
                  rows={8}
                />
                <AdminPromptTester label="爆款案例视频改写提示词" promptField="insightAiCaseVideoScriptSystemPrompt" promptType="caseVideo" />
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <SubmitButton pendingLabel="正在保存...">保存配置</SubmitButton>
          </div>
        </form>
      </Card>
        </AdminSettingsAccordionSection>

        <AdminSettingsAccordionSection
          id="manual-trend-refresh"
          summary="按当前配置立即生成今日快照，不额外采集外部数据。"
          title="手动刷新达人洞察"
          tone="neutral"
        >
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
        </AdminSettingsAccordionSection>

        <AdminSettingsAccordionSection
          id="collect-and-refresh"
          summary="采集到期关键词后重建趋势快照，适合运营手动补跑。"
          title="采集并刷新达人洞察"
          tone="neutral"
        >
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
        </AdminSettingsAccordionSection>

        <AdminSettingsAccordionSection
          id="render-cron-guide"
          summary="Collect 和 Daily Refresh 两条建议任务，供 Render Cron 或其他调度器复用。"
          title="Render Cron 建议"
          tone="info"
        >
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
        </AdminSettingsAccordionSection>

        <AdminSettingsAccordionSection
          id="config-notes"
          summary="V1 必须稳定的平台边界、风险提示和争议处理说明。"
          title="第一版配置边界"
          tone="neutral"
        >
      <Card>
        <h2 className="text-xl font-black text-stone-950">第一版配置边界</h2>
        <div className="mt-3 grid gap-3 text-sm leading-6 text-stone-600">
          <p>这些字段只覆盖 V1 必须稳定的少数平台参数：验收时限、补交宽限、高金额复核、提现门槛、附件上限、服务费率和联系邮箱。</p>
          <p>风险行业采用软提示，不阻塞商家创建任务；但在付款托管前仍需要商家确认广告披露和平台规则。</p>
          <p>资金争议和任务争议必须留在系统内处理，联系邮箱只用于一般问题。</p>
        </div>
      </Card>
        </AdminSettingsAccordionSection>
      </AdminSettingsAccordion>

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
