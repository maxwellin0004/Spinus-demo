import Link from "next/link";
import { CrawlerJobStatus, ProofStatus, UserRole } from "@prisma/client";
import { refreshProofMetricsAction, reviewPublicationProofAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CopyButton, SubmitButton } from "@/components/form-controls";
import { Button, DataTable, EmptyState, PageHeader, Select, StatusBadge, WorkflowHint } from "@/components/ui";
import { crawlerMetric, shortDate } from "@/lib/format";

const rejectionReasons = ["链接不可访问", "平台账号不匹配", "未按已通过草稿发布", "未包含广告披露", "发布时间或内容不符合要求", "其他"];

type UrlCheckResult = {
  ok?: boolean;
  method?: string;
  rawHost?: string;
  resolvedHost?: string;
  resolvedUrl?: string;
  reachable?: boolean;
  status?: number | null;
  error?: string | null;
};

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function asUrlCheck(value: unknown): UrlCheckResult | null {
  if (!value || typeof value !== "object") return null;
  return value as UrlCheckResult;
}

function shortUrl(value: string) {
  try {
    const url = new URL(value);
    const path = url.pathname.length > 24 ? `${url.pathname.slice(0, 24)}...` : url.pathname;
    return `${url.hostname}${path}`;
  } catch {
    return value.length > 36 ? `${value.slice(0, 36)}...` : value;
  }
}

function proofNextStep(status: ProofStatus, overdue: boolean, hasRisk: boolean) {
  if (status === ProofStatus.VERIFIED) return { title: "已验收", body: "KOL 收益会按任务入账。", tone: "success" as const };
  if (status === ProofStatus.REJECTED) return { title: "已拒绝", body: "等待 KOL 按原因重新处理。", tone: "danger" as const };
  if (hasRisk) return { title: "先核对风险", body: "链接存在重复提交提示，确认是否同一作品。", tone: "warning" as const };
  if (overdue) return { title: "已超 SLA", body: "请尽快验收，避免进入平台自动处理。", tone: "danger" as const };
  return { title: "待验收", body: "检查链接、数据和内容后通过或拒绝。", tone: "warning" as const };
}

export default async function BrandProofsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; crawler?: string; status?: string }>;
}) {
  const session = await requireRole(UserRole.BRAND);
  const { id } = await params;
  const { error, crawler, status } = await searchParams;
  const selectedStatus = Object.values(ProofStatus).includes(status as ProofStatus) ? (status as ProofStatus) : null;
  const selectedCrawler = Object.values(CrawlerJobStatus).includes(crawler as CrawlerJobStatus) ? (crawler as CrawlerJobStatus) : null;
  const campaign = await prisma.campaign.findFirst({
    where: { id, brand: { userId: session.userId } },
    include: {
      proofs: {
        where: {
          ...(selectedStatus ? { verificationStatus: selectedStatus } : {}),
          ...(selectedCrawler ? { crawlerJobs: { some: { status: selectedCrawler } } } : {}),
        },
        include: {
          creator: true,
          submission: { include: { draft: true, application: { include: { task: true, selectedSocialAccount: true } } } },
          postMetricSnapshots: { orderBy: { fetchedAt: "desc" }, take: 3 },
          crawlerJobs: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!campaign) return <PageHeader title="未找到推广活动" />;
  const proofRiskFlags = campaign.proofs.length
    ? await prisma.riskFlag.findMany({
        where: {
          entityType: "proof",
          entityId: { in: campaign.proofs.map((proof) => proof.id) },
          reason: { startsWith: "重复作品链接提交被拦截" },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const proofRiskById = new Map<string, typeof proofRiskFlags>();
  for (const flag of proofRiskFlags) {
    proofRiskById.set(flag.entityId, [...(proofRiskById.get(flag.entityId) ?? []), flag]);
  }
  const proofDuplicateLogs = campaign.proofs.length
    ? await prisma.auditLog.findMany({
        where: {
          entityType: "proof",
          entityId: { in: campaign.proofs.map((proof) => proof.id) },
          action: "proof.duplicate_blocked",
        },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const proofDuplicateLogsById = new Map<string, typeof proofDuplicateLogs>();
  for (const log of proofDuplicateLogs) {
    proofDuplicateLogsById.set(log.entityId, [...(proofDuplicateLogsById.get(log.entityId) ?? []), log]);
  }
  const pendingCount = campaign.proofs.filter((proof) => proof.verificationStatus === ProofStatus.PENDING).length;
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="商家验收" title={`${campaign.title} 发布链接`}>
        <StatusBadge>{pendingCount} 待验收</StatusBadge>
        <StatusBadge>SLA {campaign.acceptanceSlaDays} 天</StatusBadge>
      </PageHeader>
      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
      <form className="flex flex-wrap items-end gap-3">
        <Select label="验收状态" name="status" defaultValue={selectedStatus ?? ""}>
          <option value="">全部验收状态</option>
          {Object.values(ProofStatus).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <Select label="抓取状态" name="crawler" defaultValue={selectedCrawler ?? ""}>
          <option value="">全部抓取状态</option>
          {Object.values(CrawlerJobStatus).map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <Button variant="ghost">筛选</Button>
        {selectedStatus || selectedCrawler ? (
          <Link className="rounded-full border border-stone-200 bg-white px-4 py-3 text-sm font-black text-stone-700" href={`/brand/campaigns/${id}/proofs`}>
            清空
          </Link>
        ) : null}
        <span className="text-sm font-semibold text-stone-500">当前显示 {campaign.proofs.length} 条</span>
      </form>
      {campaign.proofs.length === 0 ? <EmptyState title="暂无发布链接" body="KOL 发布后只需要提交链接。商家验收通过后，收益会直接进入可提现余额。" /> : null}

      {campaign.proofs.length ? (
        <DataTable
          headers={["KOL / 任务", "状态", "发布链接", "自动核验", "内容摘要", "下一步", "操作"]}
          emptyTitle="暂无发布链接"
          emptyBody="KOL 发布后只需要提交链接。商家验收通过后，收益会直接进入可提现余额。"
          rows={campaign.proofs.map((proof) => {
            const action = reviewPublicationProofAction.bind(null, proof.id);
            const refreshAction = refreshProofMetricsAction.bind(null, proof.id);
            const dueAt = addDays(proof.createdAt, campaign.acceptanceSlaDays);
            const overdue = proof.verificationStatus === ProofStatus.PENDING && dueAt.getTime() < now;
            const task = proof.submission.application.task;
            const account = proof.submission.application.selectedSocialAccount;
            const urlCheck = asUrlCheck(proof.urlCheckResult);
            const latestSuccess = proof.postMetricSnapshots.find((snapshot) => snapshot.status === "SUCCESS");
            const latestSnapshot = proof.postMetricSnapshots[0];
            const latestJob = proof.crawlerJobs[0];
            const duplicateFlags = proofRiskById.get(proof.id) ?? [];
            const latestDuplicateFlag = duplicateFlags[0];
            const duplicateLogs = proofDuplicateLogsById.get(proof.id) ?? [];
            const nextStep = proofNextStep(proof.verificationStatus, overdue, Boolean(latestDuplicateFlag));

            return [
              <div key={`meta-${proof.id}`}>
                <p className="font-black text-stone-950">{proof.creator.displayName}</p>
                <p className="mt-1 text-xs text-stone-500">{task.platform} · {task.contentType}</p>
                <p className="mt-1 text-xs text-stone-500">提交 {shortDate(proof.createdAt)} · SLA {shortDate(dueAt)}</p>
                <p className="mt-1 text-xs text-stone-500">账号：{account ? `${account.platform} / ${account.accountName}` : "未绑定"}</p>
              </div>,
              <div className="grid gap-2" key={`status-${proof.id}`}>
                <StatusBadge>{proof.verificationStatus}</StatusBadge>
                <StatusBadge>{proof.publicationStatus}</StatusBadge>
                {urlCheck ? <StatusBadge>{urlCheck.ok ? "域名匹配" : "域名异常"}</StatusBadge> : null}
                {overdue ? <StatusBadge>已超 SLA</StatusBadge> : null}
                {latestDuplicateFlag ? <StatusBadge>重复尝试 {duplicateFlags.length}</StatusBadge> : null}
              </div>,
              <div className="grid gap-1 text-sm" key={`link-${proof.id}`}>
                <Link className="font-black text-stone-950" href={proof.postUrl} target="_blank">
                  打开链接
                </Link>
                <p className="break-all text-xs text-stone-500" title={proof.postUrl}>{shortUrl(proof.postUrl)}</p>
                <div>
                  <CopyButton value={proof.postUrl}>复制链接</CopyButton>
                </div>
                {proof.resolvedPostUrl && proof.resolvedPostUrl !== proof.postUrl ? (
                  <Link className="font-semibold text-stone-950" href={proof.resolvedPostUrl} target="_blank">
                    打开最终链接
                  </Link>
                ) : null}
                <p className="text-xs text-stone-500">发布 {shortDate(proof.publishedAt)} · 补交 {proof.resubmissionCount} 次</p>
                {latestDuplicateFlag ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-xs font-semibold text-amber-800">
                    重复提示：该链接有 {duplicateFlags.length} 次重复提交尝试。最近一次：{shortDate(latestDuplicateFlag.createdAt)}
                    {duplicateLogs.length ? (
                      <details className="mt-2 text-amber-900">
                        <summary className="cursor-pointer">查看重复尝试详情</summary>
                        <div className="mt-2 grid gap-1">
                          {duplicateLogs.slice(0, 5).map((log) => (
                            <p key={log.id}>
                              {shortDate(log.createdAt)} / {log.actorRole ?? "-"} / {log.actorUserId?.slice(0, 8) ?? "-"}
                            </p>
                          ))}
                        </div>
                      </details>
                    ) : null}
                  </div>
                ) : null}
                {urlCheck ? (
                  <details className="text-xs text-stone-600">
                    <summary className="cursor-pointer font-semibold text-stone-950">链接校验</summary>
                    <p>提交域名：{urlCheck.rawHost ?? "-"}</p>
                    <p>最终域名：{urlCheck.resolvedHost ?? "-"}</p>
                    <p>访问状态：{urlCheck.status ?? "未取得"} {urlCheck.reachable ? "可访问/有响应" : ""}</p>
                    {urlCheck.error ? <p className="text-amber-700">{urlCheck.error}</p> : null}
                  </details>
                ) : null}
              </div>,
              <div className="grid gap-1 text-sm" key={`metrics-${proof.id}`}>
                <p>任务：{latestJob ? `${latestJob.status} / ${shortDate(latestJob.createdAt)}` : "暂无"}</p>
                <p>作者：{latestSuccess?.authorMatchStatus ?? "未核验"}</p>
                <p>抓取：{latestSnapshot ? `${latestSnapshot.status} / ${shortDate(latestSnapshot.fetchedAt)}` : "暂无快照"}</p>
                <p>浏览：{crawlerMetric(latestSuccess?.viewCount, "views", latestSuccess?.rawProvider)}</p>
                <p>点赞：{crawlerMetric(latestSuccess?.likeCount, "likes", latestSuccess?.rawProvider)}</p>
                <p>收藏：{crawlerMetric(latestSuccess?.favoriteCount, "saves", latestSuccess?.rawProvider)}</p>
                {latestSnapshot?.failureReason ? <p className="text-amber-700">提示：{latestSnapshot.failureReason}</p> : null}
                <form action={refreshAction} className="mt-2">
                  <SubmitButton pendingLabel="正在刷新..." variant="ghost">刷新数据</SubmitButton>
                </form>
              </div>,
              <details className="max-w-sm text-sm" key={`content-${proof.id}`}>
                <summary className="cursor-pointer font-black text-stone-950">{proof.submission.draft.title}</summary>
                <p className="mt-2 whitespace-pre-wrap">{proof.submission.draft.caption}</p>
                <p className="mt-2">{proof.submission.draft.hashtags.join(" ")}</p>
                <p className="mt-2">广告披露：{proof.submission.draft.disclosurePosition || "未填写"}</p>
              </details>,
              <WorkflowHint key={`next-${proof.id}`} title={nextStep.title} body={nextStep.body} tone={nextStep.tone} />,
              proof.verificationStatus === ProofStatus.PENDING ? (
                <details className="min-w-72" key={`action-${proof.id}`}>
                  <summary className="cursor-pointer font-black text-stone-950">处理验收</summary>
                  <form action={action} className="mt-3 grid gap-2">
                    <select className="rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm text-stone-950" name="rejectionReason" defaultValue={rejectionReasons[0]}>
                      {rejectionReasons.map((reason) => <option key={reason}>{reason}</option>)}
                    </select>
                    <textarea
                      className="min-h-20 rounded-xl border border-stone-200 bg-white/90 px-3 py-2 text-sm text-stone-950 shadow-inner outline-none focus:border-amber-400"
                      name="rejectionNote"
                      placeholder="拒绝说明，拒绝时必填"
                    />
                    <div className="flex flex-wrap gap-2">
                      <SubmitButton name="decision" pendingLabel="正在验收..." value="accept" variant="secondary">通过</SubmitButton>
                      <SubmitButton name="decision" pendingLabel="正在拒绝..." value="reject" variant="danger">拒绝</SubmitButton>
                    </div>
                  </form>
                </details>
              ) : (
                <span className="text-sm font-semibold text-stone-600" key={`done-${proof.id}`}>
                  {proof.verificationStatus === ProofStatus.VERIFIED ? "已通过验收" : `已拒绝：${proof.rejectionReason ?? ""} ${proof.rejectionNote ?? ""}`}
                </span>
              ),
            ];
          })}
        />
      ) : null}
    </div>
  );
}
