import Link from "next/link";
import { Prisma } from "@prisma/client";
import { requireAdminPermission } from "@/lib/admin";
import { number, shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { Card, DataTable, MetricCard, PageHeader, StatusBadge } from "@/components/ui";

const jobTypes = ["HOT_TOPICS", "SEARCH_CONTENTS"];
const statuses = ["PENDING", "PROCESSING", "SUCCESS", "PARTIAL", "FAILED"];

function compactJson(value: unknown) {
  if (!value) return "-";
  const serialized = JSON.stringify(value);
  return serialized.length > 160 ? `${serialized.slice(0, 160)}...` : serialized;
}

function formatTime(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function formatDuration(startedAt: Date, completedAt: Date | null) {
  const end = completedAt ?? new Date();
  const seconds = Math.max(0, Math.round((end.getTime() - startedAt.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remain = seconds % 60;
  return `${minutes}m ${remain}s`;
}

export default async function AdminInsightRunsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; jobType?: string; platform?: string; keyword?: string }>;
}) {
  await requireAdminPermission("compliance.manage");
  const { status, jobType, platform, keyword } = await searchParams;
  const selectedStatus = statuses.includes(status ?? "") ? status : undefined;
  const selectedJobType = jobTypes.includes(jobType ?? "") ? jobType : undefined;
  const where: Prisma.InsightCollectionRunWhereInput = {
    ...(selectedStatus ? { status: selectedStatus } : {}),
    ...(selectedJobType ? { jobType: selectedJobType } : {}),
    ...(platform ? { platform: { contains: platform, mode: "insensitive" } } : {}),
    ...(keyword ? { keyword: { contains: keyword, mode: "insensitive" } } : {}),
  };

  const [runs, totalCount, successCount, partialCount, failedCount, processingCount] = await Promise.all([
    prisma.insightCollectionRun.findMany({
      where,
      orderBy: { startedAt: "desc" },
      take: 120,
    }),
    prisma.insightCollectionRun.count(),
    prisma.insightCollectionRun.count({ where: { status: "SUCCESS" } }),
    prisma.insightCollectionRun.count({ where: { status: "PARTIAL" } }),
    prisma.insightCollectionRun.count({ where: { status: "FAILED" } }),
    prisma.insightCollectionRun.count({ where: { status: "PROCESSING" } }),
  ]);
  const successRate = totalCount ? Math.round((successCount / totalCount) * 100) : 0;
  const latestAbnormalRuns = runs.filter((run) => run.status === "FAILED" || run.status === "PARTIAL").slice(0, 5);

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Admin" title="采集日志">
        <StatusBadge tone="info">TikHub 运行记录</StatusBadge>
        <Link className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-black text-stone-700 shadow-sm" href="/admin/insights">
          返回关键词配置
        </Link>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-5">
        <MetricCard label="总采集次数" value={number(totalCount)} compact />
        <MetricCard label="成功次数" value={number(successCount)} compact />
        <MetricCard label="部分成功" value={number(partialCount)} compact />
        <MetricCard label="失败次数" value={number(failedCount)} compact />
        <MetricCard label="完全成功率" value={`${successRate}%`} compact />
      </div>

      <Card>
        <form className="flex flex-wrap gap-3">
          <select className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700" name="status" defaultValue={selectedStatus ?? ""}>
            <option value="">全部状态</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700" name="jobType" defaultValue={selectedJobType ?? ""}>
            <option value="">全部类型</option>
            {jobTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <input className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700" name="platform" placeholder="平台" defaultValue={platform ?? ""} />
          <input className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700" name="keyword" placeholder="关键词" defaultValue={keyword ?? ""} />
          <button className="rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-black text-white">筛选</button>
          {status || jobType || platform || keyword ? (
            <Link className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-black text-stone-700" href="/admin/insights/runs">
              清空
            </Link>
          ) : null}
        </form>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <h2 className="text-xl font-black text-stone-950">最近异常采集</h2>
          <p className="mt-2 text-sm text-stone-500">这里会展示 FAILED 与 PARTIAL，便于定位接口权限、参数以及评论采集可用性问题。</p>
          <div className="mt-4 grid gap-3">
            {latestAbnormalRuns.length > 0 ? (
              latestAbnormalRuns.map((run) => (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4" key={run.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-stone-950">{run.jobType}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        {formatTime(run.startedAt)} {run.platform ? ` / ${run.platform}` : ""} {run.keyword ? ` / ${run.keyword}` : ""}
                      </p>
                    </div>
                    <StatusBadge tone={run.status === "PARTIAL" ? "warning" : "danger"}>{run.status}</StatusBadge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-amber-900">{run.errorMessage ?? "无详细信息"}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white/70 p-6 text-sm text-stone-500">当前没有异常记录。</div>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-black text-stone-950">运行说明</h2>
          <div className="mt-4 grid gap-3 text-sm text-stone-600">
            <p>SUCCESS：主接口返回且流程完整。</p>
            <p>PARTIAL：发生回退或评论采集失败，内容可能已入库，但分析样本不足。</p>
            <p>FAILED：主流程失败，通常需要检查 TikHub 配额、接口参数或网络链路。</p>
          </div>
          <p className="mt-4 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700">当前处理中：{number(processingCount)}</p>
        </Card>
      </div>

      <DataTable
        emptyTitle="暂无采集日志"
        emptyBody="先执行一次关键词采集或热榜采集后，这里会出现记录。"
        headers={["时间", "类型", "平台", "关键词", "状态", "结果数", "耗时", "请求", "错误/告警"]}
        rows={runs.map((run) => [
          <div className="grid gap-1" key={`time-${run.id}`}>
            <span className="font-black text-stone-950">{formatTime(run.startedAt)}</span>
            <span className="text-xs text-stone-500">{shortDate(run.startedAt)}</span>
          </div>,
          <span key={`type-${run.id}`} className="font-semibold text-stone-800">
            {run.jobType}
          </span>,
          <span key={`platform-${run.id}`}>{run.platform ?? "-"}</span>,
          <span key={`keyword-${run.id}`} className="font-semibold text-stone-800">
            {run.keyword ?? "-"}
          </span>,
          <StatusBadge key={`status-${run.id}`} tone={run.status === "PARTIAL" ? "warning" : undefined}>
            {run.status}
          </StatusBadge>,
          number(run.resultCount),
          run.completedAt ? formatDuration(run.startedAt, run.completedAt) : "进行中",
          <code className="block max-w-[18rem] whitespace-pre-wrap break-all text-xs text-stone-600" key={`payload-${run.id}`}>
            {compactJson(run.requestPayload)}
          </code>,
          <code className="block max-w-[20rem] whitespace-pre-wrap break-all text-xs text-red-600" key={`error-${run.id}`}>
            {run.errorMessage ?? "-"}
          </code>,
        ])}
      />
    </div>
  );
}
