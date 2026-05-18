import Link from "next/link";
import { CrawlerJobStatus, CrawlerJobType, CrawlerPlatform } from "@prisma/client";
import { refreshProofMetricsAction, refreshSocialAccountMetricsAction, retryCrawlerJobAction } from "@/lib/actions";
import { requireAdminPermission } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { Card, DataTable, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { SubmitButton } from "@/components/form-controls";
import { shortDate } from "@/lib/format";

type WorkerHealth = {
  status?: string;
  workerVersion?: string;
  checkedAt?: string;
  providers?: Record<
    string,
    {
      enabled?: boolean;
      loginStatus?: string;
      lastLoginCheckedAt?: string;
      lastError?: string | null;
    }
  >;
  queue?: {
    pending?: number;
    processing?: number;
    failed?: number;
  };
};

type WorkerHealthResult =
  | { online: true; data: WorkerHealth }
  | { online: false; error: string };

async function getWorkerHealth(): Promise<WorkerHealthResult> {
  const healthUrl = process.env.CRAWLER_WORKER_HEALTH_URL;
  if (!healthUrl) {
    return { online: false, error: "未配置 CRAWLER_WORKER_HEALTH_URL" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(healthUrl, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return { online: false, error: `Worker health 返回 ${response.status}` };
    }

    const data = (await response.json()) as WorkerHealth;
    return { online: true, data };
  } catch (error) {
    return { online: false, error: error instanceof Error ? error.message : "Worker 不可访问" };
  } finally {
    clearTimeout(timeout);
  }
}

function providerStatus(health: Awaited<ReturnType<typeof getWorkerHealth>>, key: "xhs" | "douyin") {
  if (!health.online || !("data" in health)) return "未知";
  return health.data.providers?.[key]?.loginStatus ?? "UNKNOWN";
}

export default async function AdminCrawlerPage({ searchParams }: { searchParams: Promise<{ status?: string; platform?: string; type?: string }> }) {
  await requireAdminPermission("account.freeze");
  const { status, platform, type } = await searchParams;
  const selectedStatus = Object.values(CrawlerJobStatus).includes(status as CrawlerJobStatus) ? (status as CrawlerJobStatus) : undefined;
  const selectedPlatform = Object.values(CrawlerPlatform).includes(platform as CrawlerPlatform) ? (platform as CrawlerPlatform) : undefined;
  const selectedType = Object.values(CrawlerJobType).includes(type as CrawlerJobType) ? (type as CrawlerJobType) : undefined;

  const [health, counts, jobs] = await Promise.all([
    getWorkerHealth(),
    prisma.crawlerJob.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.crawlerJob.findMany({
      where: {
        ...(selectedStatus ? { status: selectedStatus } : {}),
        ...(selectedPlatform ? { platform: selectedPlatform } : {}),
        ...(selectedType ? { type: selectedType } : {}),
      },
      include: {
        socialAccount: { include: { creator: true } },
        proof: { include: { creator: true, campaign: true } },
        socialSnapshots: { orderBy: { createdAt: "desc" }, take: 1 },
        postSnapshots: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const count = (status: CrawlerJobStatus) => counts.find((item) => item.status === status)?._count._all ?? 0;

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Admin" title="抓取服务与任务队列">
        <StatusBadge>{health.online ? "Worker 在线" : "Worker 离线"}</StatusBadge>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="待处理" value={count(CrawlerJobStatus.PENDING)} />
        <MetricCard label="处理中" value={count(CrawlerJobStatus.PROCESSING)} />
        <MetricCard label="成功" value={count(CrawlerJobStatus.SUCCESS)} />
        <MetricCard label="失败" value={count(CrawlerJobStatus.FAILED)} />
      </div>

      <Card>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">Worker</p>
            <p className="mt-2 text-2xl font-black text-stone-950">{health.online ? "在线" : "离线"}</p>
            <p className="mt-1 text-sm text-stone-500">{health.online ? `版本 ${health.data.workerVersion ?? "-"}` : health.error}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">小红书登录态</p>
            <p className="mt-2 text-2xl font-black text-stone-950">{providerStatus(health, "xhs")}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">抖音登录态</p>
            <p className="mt-2 text-2xl font-black text-stone-950">{providerStatus(health, "douyin")}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">最近检查</p>
            <p className="mt-2 text-lg font-black text-stone-950">{health.online && health.data.checkedAt ? shortDate(new Date(health.data.checkedAt)) : "-"}</p>
          </div>
        </div>
      </Card>

      <form className="flex flex-wrap gap-3">
        <select className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700" name="status" defaultValue={selectedStatus ?? ""}>
          <option value="">全部状态</option>
          {Object.values(CrawlerJobStatus).map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700" name="platform" defaultValue={selectedPlatform ?? ""}>
          <option value="">全部平台</option>
          {Object.values(CrawlerPlatform).map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700" name="type" defaultValue={selectedType ?? ""}>
          <option value="">全部任务</option>
          {Object.values(CrawlerJobType).map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <button className="rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-black text-white">筛选</button>
        {(selectedStatus || selectedPlatform || selectedType) ? <Link className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-black text-stone-700" href="/admin/crawler">清空</Link> : null}
      </form>

      <DataTable
        headers={["任务", "平台", "状态", "尝试", "关联对象", "锁定", "错误", "操作"]}
        rows={jobs.map((job) => {
          const retry = retryCrawlerJobAction.bind(null, job.id);
          const refreshProof = job.proofId ? refreshProofMetricsAction.bind(null, job.proofId) : null;
          const refreshAccount = job.socialAccountId ? refreshSocialAccountMetricsAction.bind(null, job.socialAccountId) : null;
          const target = job.socialAccount
            ? `${job.socialAccount.creator.displayName} / ${job.socialAccount.accountName}`
            : job.proof
              ? `${job.proof.campaign.title} / ${job.proof.creator.displayName}`
              : job.targetId;

          return [
            <div className="grid gap-1" key="job">
              <span className="font-black text-stone-950">{job.type}</span>
              <span className="text-xs text-stone-500">{shortDate(job.createdAt)}</span>
            </div>,
            job.platform,
            <StatusBadge key="status">{job.status}</StatusBadge>,
            `${job.attempts}/${job.maxAttempts}`,
            <div className="grid gap-1" key="target">
              <span>{target}</span>
              <Link className="break-all text-xs font-semibold text-stone-950 underline" href={job.targetUrl}>
                {job.targetUrl}
              </Link>
            </div>,
            job.lockedBy ? `${job.lockedBy} / ${job.lockedAt ? shortDate(job.lockedAt) : "-"}` : "-",
            <div className="grid gap-1" key="error">
              <span>{job.lastErrorMessage ?? "-"}</span>
              <span className="text-xs text-stone-500">
                {job.lastErrorCategory ?? job.socialSnapshots[0]?.failureCategory ?? job.postSnapshots[0]?.failureCategory ?? "-"}
                {" / "}
                {job.socialSnapshots[0]?.dataConfidence ?? job.postSnapshots[0]?.dataConfidence ?? "-"}
              </span>
            </div>,
            <div className="flex flex-wrap gap-2" key="actions">
              {job.status === CrawlerJobStatus.FAILED || job.status === CrawlerJobStatus.CANCELLED ? (
                <form action={retry}>
                  <SubmitButton pendingLabel="正在重试..." variant="ghost">重试</SubmitButton>
                </form>
              ) : null}
              {refreshProof ? (
                <form action={refreshProof}>
                  <SubmitButton pendingLabel="正在刷新..." variant="ghost">刷新作品</SubmitButton>
                </form>
              ) : null}
              {refreshAccount ? (
                <form action={refreshAccount}>
                  <SubmitButton pendingLabel="正在刷新..." variant="ghost">刷新账号</SubmitButton>
                </form>
              ) : null}
              {job.status !== CrawlerJobStatus.FAILED && job.status !== CrawlerJobStatus.CANCELLED && !refreshProof && !refreshAccount ? "-" : null}
            </div>,
          ];
        })}
      />
    </div>
  );
}
