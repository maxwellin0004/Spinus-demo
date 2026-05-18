import { CrawlerJobStatus, ProofStatus } from "@prisma/client";
import { createManualPostMetricSnapshotAction, verifyProofAction } from "@/lib/actions";
import { brandScopeWhere, demoWhere, getAdminContext, hasAdminPermission, scopeOptions } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { CopyButton, SubmitButton } from "@/components/form-controls";
import { DataTable, Field, PageHeader, PostMetricsPanel, StatusBadge, Textarea, WorkflowHint } from "@/components/ui";
import { crawlerMetric, number, shortDate } from "@/lib/format";

function shortUrl(value: string) {
  try {
    const url = new URL(value);
    const path = url.pathname.length > 24 ? `${url.pathname.slice(0, 24)}...` : url.pathname;
    return `${url.hostname}${path}`;
  } catch {
    return value.length > 36 ? `${value.slice(0, 36)}...` : value;
  }
}

const adminIgnoredUrlParams = new Set(["from", "share_from_user_hidden", "share_id", "share_sign", "share_source", "timestamp"]);

function proofTone(status: ProofStatus) {
  if (status === ProofStatus.VERIFIED) return "success" as const;
  if (status === ProofStatus.REJECTED) return "danger" as const;
  if (status === ProofStatus.NEEDS_SUPPLEMENT) return "info" as const;
  return "warning" as const;
}

function normalizeProofSearchQuery(value: string) {
  try {
    const url = new URL(value);
    url.protocol = "https:";
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      const normalizedKey = key.toLowerCase();
      if (normalizedKey.startsWith("utm_") || adminIgnoredUrlParams.has(normalizedKey)) url.searchParams.delete(key);
    }
    const sortedParams = [...url.searchParams.entries()].sort(([leftKey, leftValue], [rightKey, rightValue]) => {
      const keyOrder = leftKey.localeCompare(rightKey);
      return keyOrder || leftValue.localeCompare(rightValue);
    });
    url.search = "";
    for (const [key, paramValue] of sortedParams) url.searchParams.append(key, paramValue);
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return value.toLowerCase();
  }
}

export default async function AdminProofsPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; demo?: string; status?: string; crawler?: string; q?: string }>;
}) {
  const context = await getAdminContext();
  const { scope, demo, status, crawler, q } = await searchParams;
  const canSeeDemo = hasAdminPermission(context.profile, "demo.manage");
  const selectedStatus = Object.values(ProofStatus).includes(status as ProofStatus) ? (status as ProofStatus) : undefined;
  const selectedCrawler = Object.values(CrawlerJobStatus).includes(crawler as CrawlerJobStatus) ? (crawler as CrawlerJobStatus) : undefined;
  const query = q?.trim();
  const normalizedQuery = query ? normalizeProofSearchQuery(query) : null;
  const proofs = await prisma.proof.findMany({
    where: {
      campaign: { ...demoWhere(demo, canSeeDemo), brand: brandScopeWhere(context.profile, scope) },
      ...(selectedStatus ? { verificationStatus: selectedStatus } : {}),
      ...(selectedCrawler ? { crawlerJobs: { some: { status: selectedCrawler } } } : {}),
      ...(query
        ? {
            OR: [
              { postUrl: { contains: query, mode: "insensitive" } },
              { resolvedPostUrl: { contains: query, mode: "insensitive" } },
              { normalizedPostUrl: { contains: query.toLowerCase(), mode: "insensitive" } },
              ...(normalizedQuery && normalizedQuery !== query.toLowerCase()
                ? [{ normalizedPostUrl: { contains: normalizedQuery, mode: "insensitive" as const } }]
                : []),
            ],
          }
        : {}),
    },
    include: {
      campaign: true,
      creator: true,
      submission: { include: { draft: true } },
      postMetricSnapshots: { orderBy: { fetchedAt: "desc" }, take: 3 },
      crawlerJobs: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });
  const proofRiskFlags = proofs.length
    ? await prisma.riskFlag.findMany({
        where: {
          entityType: "proof",
          entityId: { in: proofs.map((proof) => proof.id) },
          reason: { startsWith: "重复作品链接提交被拦截" },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const proofRiskById = new Map<string, typeof proofRiskFlags>();
  for (const flag of proofRiskFlags) {
    proofRiskById.set(flag.entityId, [...(proofRiskById.get(flag.entityId) ?? []), flag]);
  }
  const proofDuplicateLogs = proofs.length
    ? await prisma.auditLog.findMany({
        where: {
          entityType: "proof",
          entityId: { in: proofs.map((proof) => proof.id) },
          action: "proof.duplicate_blocked",
        },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const proofDuplicateLogsById = new Map<string, typeof proofDuplicateLogs>();
  for (const log of proofDuplicateLogs) {
    proofDuplicateLogsById.set(log.entityId, [...(proofDuplicateLogsById.get(log.entityId) ?? []), log]);
  }

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="管理端" title="发布验收复核" />
      <form className="flex flex-wrap gap-3">
        <input
          className="min-w-[18rem] rounded-full border border-stone-200 px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-amber-100"
          name="q"
          defaultValue={query ?? ""}
          placeholder="搜索作品链接 / 最终链接 / 标准化链接"
        />
        <select className="rounded-full border border-stone-200 px-4 py-3" name="scope" defaultValue={scope}>
          {scopeOptions(context.profile).map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <select className="rounded-full border border-stone-200 px-4 py-3" name="demo" defaultValue={demo ?? "real"}>
          <option value="real">只看真实数据</option>
          {canSeeDemo ? <option value="include">包含演示数据</option> : null}
          {canSeeDemo ? <option value="only">只看演示数据</option> : null}
        </select>
        <select className="rounded-full border border-stone-200 px-4 py-3" name="status" defaultValue={selectedStatus ?? ""}>
          <option value="">全部验收状态</option>
          {Object.values(ProofStatus).map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="rounded-full border border-stone-200 px-4 py-3" name="crawler" defaultValue={selectedCrawler ?? ""}>
          <option value="">全部抓取状态</option>
          {Object.values(CrawlerJobStatus).map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white">筛选</button>
        {selectedStatus || selectedCrawler || query ? (
          <a className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700" href="/admin/proofs">清除筛选</a>
        ) : null}
      </form>
      {query ? <p className="text-sm font-semibold text-stone-500">当前匹配 {proofs.length} 条发布链接记录</p> : null}

      <DataTable
        headers={["KOL", "推广活动", "发布链接", "数据", "状态", "提交时间", "下一步", "操作"]}
        emptyTitle="暂无发布验收记录"
        emptyBody="KOL 提交发布链接后，会出现在这里等待平台复核。"
        rows={proofs.map((proof) => {
          const action = verifyProofAction.bind(null, proof.id);
          const manualMetricsAction = createManualPostMetricSnapshotAction.bind(null, proof.id);
          const latestSuccess = proof.postMetricSnapshots.find((snapshot) => snapshot.status === "SUCCESS");
          const latestAttempt = proof.postMetricSnapshots[0];
          const crawlerStatus = proof.crawlerJobs[0]?.status ?? latestAttempt?.status ?? "NO_JOB";
          const duplicateFlags = proofRiskById.get(proof.id) ?? [];
          const latestDuplicateFlag = duplicateFlags[0];
          const duplicateLogs = proofDuplicateLogsById.get(proof.id) ?? [];
          const canAct = proof.verificationStatus !== ProofStatus.VERIFIED && proof.verificationStatus !== ProofStatus.REJECTED;
          const nextStep =
            proof.verificationStatus === ProofStatus.VERIFIED
              ? { title: "已完成", body: "无需继续处理。", tone: "success" as const }
              : proof.verificationStatus === ProofStatus.REJECTED
                ? { title: "等待重提", body: "等待 KOL 按拒绝原因重新处理。", tone: "danger" as const }
                : latestDuplicateFlag
                  ? { title: "先核对风险", body: "该链接存在重复提交提示，先确认是否同一作品。", tone: "warning" as const }
                  : { title: "待复核", body: "检查链接、数据和内容后通过或拒绝。", tone: "warning" as const };

          return [
            <div className="grid min-w-[9rem] gap-1" key={`${proof.id}-creator`}>
              <span className="font-black text-stone-950">{proof.creator.displayName}</span>
              <span className="text-xs text-stone-500">{proof.creator.email}</span>
            </div>,
            <div className="grid min-w-[10rem] gap-1" key={`${proof.id}-campaign`}>
              <span className="font-semibold text-stone-950">{proof.campaign.title}</span>
              <span className="text-xs text-stone-500">{proof.submission?.draft.title ?? "未关联草稿"}</span>
            </div>,
            <div className="grid min-w-[15rem] gap-1" key={`${proof.id}-url`}>
              <a className="font-semibold text-stone-950 underline-offset-4 hover:underline" href={proof.postUrl} target="_blank" rel="noreferrer">打开链接</a>
              <span className="break-all text-xs text-stone-500" title={proof.postUrl}>{shortUrl(proof.postUrl)}</span>
              <div>
                <CopyButton value={proof.postUrl}>复制链接</CopyButton>
              </div>
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
            </div>,
            <details className="min-w-[18rem]" key={`${proof.id}-metrics`}>
              <summary className="cursor-pointer font-semibold text-stone-950">
                {latestSuccess
                  ? `Views ${crawlerMetric(latestSuccess.viewCount, "views", latestSuccess.rawProvider)} / Likes ${crawlerMetric(latestSuccess.likeCount, "likes", latestSuccess.rawProvider)}`
                  : `${number(proof.views)} views / ${number(proof.clicks)} clicks / ${number(proof.conversions)} conv.`}
              </summary>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge>{crawlerStatus}</StatusBadge>
              </div>
              <div className="mt-3">
                <PostMetricsPanel snapshot={latestSuccess} latestAttempt={latestAttempt} compact />
              </div>
            </details>,
            <StatusBadge key={`${proof.id}-status`} tone={proofTone(proof.verificationStatus)}>{proof.verificationStatus}</StatusBadge>,
            shortDate(proof.createdAt),
            <WorkflowHint key={`${proof.id}-next`} title={nextStep.title} body={nextStep.body} tone={nextStep.tone} />,
            canAct ? (
              <details className="min-w-[17rem]" key={`${proof.id}-action`}>
                <summary className="cursor-pointer font-black text-stone-950">处理验收</summary>
                <form action={action} className="mt-3 grid gap-3">
                  <textarea
                    className="min-h-20 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm shadow-inner outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-amber-100"
                    name="adminNote"
                    defaultValue={proof.adminNote ?? ""}
                    placeholder={`${proof.creator.displayName} 验收备注`}
                  />
                  <div className="flex flex-wrap gap-2">
                    <SubmitButton name="action" pendingLabel="正在验收..." value="verify" variant="secondary">通过验收</SubmitButton>
                    <SubmitButton name="action" pendingLabel="正在拒绝..." value="reject" variant="danger">拒绝</SubmitButton>
                  </div>
                </form>
                <form action={manualMetricsAction} className="mt-4 grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-3">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-stone-500">人工补录数据</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="浏览" name="viewCount" type="number" />
                    <Field label="点赞" name="likeCount" type="number" />
                    <Field label="收藏" name="favoriteCount" type="number" />
                    <Field label="评论" name="commentCount" type="number" />
                    <Field label="分享" name="shareCount" type="number" />
                    <Field label="作者名" name="authorName" />
                  </div>
                  <Field label="最终链接" name="canonicalUrl" type="url" defaultValue={proof.resolvedPostUrl ?? proof.postUrl} />
                  <Textarea label="证据说明" name="evidenceNote" required rows={3} placeholder="例如：后台截图核对，链接可访问，作者与任务一致。" />
                  <SubmitButton pendingLabel="正在补录..." variant="ghost">保存人工数据</SubmitButton>
                </form>
              </details>
            ) : (
              <span className="text-sm text-stone-500" key={`${proof.id}-done`}>无需操作</span>
            ),
          ];
        })}
      />
    </div>
  );
}
