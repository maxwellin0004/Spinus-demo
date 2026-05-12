import { runSlaAutomationAction, updatePlatformSettingsAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { INSIGHT_DIRECTIONS } from "@/lib/insights/directions";
import { Card, Field, PageHeader, StatusBadge, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/form-controls";

function formatDateTime(value: Date | null) {
  if (!value) return "尚未运行";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sla?: string }>;
}) {
  const [{ error, sla }, settings] = await Promise.all([
    searchParams,
    prisma.platformSettings.upsert({
      where: { id: "platform" },
      update: {},
      create: { id: "platform" },
    }),
  ]);

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="管理端" title="平台配置" />

      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
      {sla ? (
        <div className="rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-700">
          SLA 处理完成：自动通过 {sla.split("-")[0] ?? 0} 条，进入平台复核 {sla.split("-")[1] ?? 0} 条。
        </div>
      ) : null}

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
            <div className="mt-4 grid gap-2 text-sm text-stone-600">
              <p>上次运行：{formatDateTime(settings.creatorTrendRefreshLastRunAt)}</p>
              {settings.creatorTrendRefreshLastError ? <p className="text-red-700">上次错误：{settings.creatorTrendRefreshLastError}</p> : null}
            </div>
          </div>
          <div className="md:col-span-2">
            <SubmitButton pendingLabel="正在保存...">保存配置</SubmitButton>
          </div>
        </form>
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
            <p className="mt-2 text-sm text-stone-600">
              手动扫描逾期未验收的发布链接：低金额任务自动通过并直接入账，高金额任务自动进入平台争议处理。
            </p>
          </div>
          <form action={runSlaAutomationAction}>
            <SubmitButton pendingLabel="正在运行..." variant="secondary">运行 SLA 处理</SubmitButton>
          </form>
        </div>
      </Card>
    </div>
  );
}
