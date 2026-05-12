import Link from "next/link";
import { Prisma } from "@prisma/client";
import { requireAdminPermission } from "@/lib/admin";
import { number, shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { Card, DataTable, MetricCard, PageHeader, StatusBadge } from "@/components/ui";

const jobTypes = ["HOT_TOPICS", "SEARCH_CONTENTS"];
const statuses = ["PENDING", "PROCESSING", "SUCCESS", "FAILED"];

function compactJson(value: unknown) {
  if (!value) return "-";
  const serialized = JSON.stringify(value);
  return serialized.length > 120 ? `${serialized.slice(0, 120)}...` : serialized;
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

  const [runs, totalCount, successCount, failedCount, processingCount] = await Promise.all([
    prisma.insightCollectionRun.findMany({
      where,
      orderBy: { startedAt: "desc" },
      take: 120,
    }),
    prisma.insightCollectionRun.count(),
    prisma.insightCollectionRun.count({ where: { status: "SUCCESS" } }),
    prisma.insightCollectionRun.count({ where: { status: "FAILED" } }),
    prisma.insightCollectionRun.count({ where: { status: "PROCESSING" } }),
  ]);
  const successRate = totalCount ? Math.round((successCount / totalCount) * 100) : 0;
  const latestFailures = runs.filter((run) => run.status === "FAILED").slice(0, 5);

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Admin" title="采集日志">
        <StatusBadge tone="info">TikHub 运行记录</StatusBadge>
        <Link className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-black text-stone-700 shadow-sm" href="/admin/insights">
          返回关键词配置
        </Link>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="总采集次数" value={number(totalCount)} compact />
        <MetricCard label="成功次数" value={number(successCount)} compact />
        <MetricCard label="失败次数" value={number(failedCount)} compact />
        <MetricCard label="成功率" value={`${successRate}%`} compact />
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
          <h2 className="text-xl font-black text-stone-950">最近采集失败</h2>
          <p className="mt-2 text-sm text-stone-500">失败记录通常最能说明 TikHub 接口、参数或采集配置是否异常。</p>
          <div className="mt-4 grid gap-3">
            {latestFailures.length > 0 ? (
              latestFailures.map((run) => (
                <div className="rounded-2xl border border-red-100 bg-red-50/60 p-4" key={run.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-stone-950">{run.jobType}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        {formatTime(run.startedAt)} {run.platform ? ` / ${run.platform}` : ""} {run.keyword ? ` / ${run.keyword}` : ""}
                      </p>
                    </div>
                    <StatusBadge tone="danger">{run.status}</StatusBadge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-red-700">{run.errorMessage ?? "未知错误"}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white/70 p-6 text-sm text-stone-500">当前没有失败记录。</div>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-black text-stone-950">运行概览</h2>
          <div className="mt-4 grid gap-3 text-sm text-stone-600">
            <p>这里能直接看出系统是不是在持续产出数据，以及失败是不是集中在某个平台或某类关键词。</p>
            <p>如果某个关键词长期没有成功运行，通常说明配置有问题、接口返回异常，或者采集间隔没有命中。</p>
          <div className="grid gap-2 pt-2">
            <p className="font-black text-stone-950">检查重点</p>
            <ul className="grid gap-1">
              <li>• 失败率是否连续上升</li>
              <li>• 同一关键词是否反复失败</li>
              <li>• 某个平台是否整体异常</li>
              <li>• 结果数是否突然降为 0</li>
            </ul>
          </div>
          <p className="mt-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700">
            当前处理中：{number(processingCount)}
          </p>
        </div>
      </Card>
      </div>

      <DataTable
        emptyTitle="暂无采集日志"
        emptyBody="先执行一次关键词采集或热榜采集后，这里会出现记录。"
        headers={["时间", "类型", "平台", "关键词", "状态", "结果数", "耗时", "请求", "错误"]}
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
          <StatusBadge key={`status-${run.id}`}>{run.status}</StatusBadge>,
          number(run.resultCount),
          run.completedAt ? formatDuration(run.startedAt, run.completedAt) : "进行中",
          <code className="block max-w-[16rem] whitespace-pre-wrap break-all text-xs text-stone-600" key={`payload-${run.id}`}>
            {compactJson(run.requestPayload)}
          </code>,
          <code className="block max-w-[18rem] whitespace-pre-wrap break-all text-xs text-red-600" key={`error-${run.id}`}>
            {run.errorMessage ?? "-"}
          </code>,
        ])}
      />
    </div>
  );
}
