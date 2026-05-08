import Link from "next/link";
import { ProofStatus, UserRole } from "@prisma/client";
import { refreshProofMetricsAction, reviewPublicationProofAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button, Card, EmptyState, PageHeader, PostMetricsPanel, Select, StatusBadge, Textarea } from "@/components/ui";
import { shortDate } from "@/lib/format";

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

export default async function BrandProofsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireRole(UserRole.BRAND);
  const { id } = await params;
  const { error } = await searchParams;
  const campaign = await prisma.campaign.findFirst({
    where: { id, brand: { userId: session.userId } },
    include: {
      proofs: {
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
      {campaign.proofs.length === 0 ? <EmptyState title="暂无发布链接" body="KOL 发布后只需要提交链接。商家验收通过后，收益会直接进入可提现余额。" /> : null}

      <div className="grid gap-4">
        {campaign.proofs.map((proof) => {
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

          return (
            <Card key={proof.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-stone-950">{proof.creator.displayName}</h2>
                  <p className="mt-1 text-sm text-stone-500">
                    {task.platform} · {task.contentType} · 提交 {shortDate(proof.createdAt)} · SLA 截止 {shortDate(dueAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge>{proof.verificationStatus}</StatusBadge>
                  <StatusBadge>{proof.publicationStatus}</StatusBadge>
                  {urlCheck ? <StatusBadge>{urlCheck.ok ? "域名匹配" : "域名异常"}</StatusBadge> : null}
                  {overdue ? <StatusBadge>已超 SLA</StatusBadge> : null}
                </div>
              </div>

              <section className="mt-5 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
                  <h3 className="font-black text-stone-950">发布信息</h3>
                  <div className="mt-3 grid gap-2">
                    <p><strong>发布账号：</strong>{account ? `${account.platform} / ${account.accountName}` : "未绑定"}</p>
                    <p><strong>账号链接：</strong>{account?.accountUrl ?? "-"}</p>
                    <p><strong>发布时间：</strong>{shortDate(proof.publishedAt)}</p>
                    <p><strong>补交次数：</strong>{proof.resubmissionCount}</p>
                    <p>
                      <strong>发布链接：</strong>
                      <Link className="font-semibold text-stone-950" href={proof.postUrl} target="_blank">
                        打开链接
                      </Link>
                    </p>
                    {proof.resolvedPostUrl && proof.resolvedPostUrl !== proof.postUrl ? (
                      <p>
                        <strong>最终链接：</strong>
                        <Link className="font-semibold text-stone-950" href={proof.resolvedPostUrl} target="_blank">
                          打开最终链接
                        </Link>
                      </p>
                    ) : null}
                  </div>
                  {urlCheck ? (
                    <div className="mt-4 rounded-2xl bg-white/80 p-3 text-xs leading-5 text-stone-600">
                      <p className="font-black text-stone-950">系统链接校验</p>
                      <p>提交域名：{urlCheck.rawHost ?? "-"}</p>
                      <p>最终域名：{urlCheck.resolvedHost ?? "-"}</p>
                      <p>校验方式：{urlCheck.method === "fetch" ? "已尝试展开短链" : "域名校验"}</p>
                      <p>访问状态：{urlCheck.status ?? "未取得"} {urlCheck.reachable ? "可访问/有响应" : ""}</p>
                      {urlCheck.error ? <p className="text-amber-700">自动访问提示：{urlCheck.error}</p> : null}
                    </div>
                  ) : null}
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-sm text-stone-700">
                  <h3 className="font-black text-stone-950">已提交内容</h3>
                  <p className="mt-3 font-semibold">{proof.submission.draft.title}</p>
                  <p className="mt-2 whitespace-pre-wrap">{proof.submission.draft.caption}</p>
                  <p className="mt-2">{proof.submission.draft.hashtags.join(" ")}</p>
                  <p className="mt-3"><strong>广告披露：</strong>{proof.submission.draft.disclosurePosition || "未填写"}</p>
                </div>
              </section>

              <section className="mt-5 rounded-2xl border border-stone-200 bg-white/80 p-4 text-sm text-stone-700">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-stone-950">自动数据核验</h3>
                    <p className="mt-1 text-stone-500">抓取结果只作为辅助核验，不自动决定放款。</p>
                  </div>
                  <form action={refreshAction}>
                    <Button variant="ghost">刷新作品数据</Button>
                  </form>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <p><strong>最近任务：</strong>{latestJob ? `${latestJob.type} / ${latestJob.status} / ${shortDate(latestJob.createdAt)}` : "暂无"}</p>
                  <p><strong>作者匹配：</strong>{latestSuccess?.authorMatchStatus ?? "未核验"}</p>
                  <p><strong>最近抓取：</strong>{latestSnapshot ? `${latestSnapshot.status} / ${shortDate(latestSnapshot.fetchedAt)}` : "暂无快照"}</p>
                  <p><strong>浏览量：</strong>{latestSuccess?.viewCount == null ? "未获取" : latestSuccess.viewCount.toLocaleString("zh-CN")}</p>
                  <p><strong>点赞：</strong>{latestSuccess?.likeCount == null ? "未获取" : latestSuccess.likeCount.toLocaleString("zh-CN")}</p>
                  <p><strong>收藏：</strong>{latestSuccess?.favoriteCount == null ? "未获取" : latestSuccess.favoriteCount.toLocaleString("zh-CN")}</p>
                  <p><strong>评论：</strong>{latestSuccess?.commentCount == null ? "未获取" : latestSuccess.commentCount.toLocaleString("zh-CN")}</p>
                  <p><strong>分享：</strong>{latestSuccess?.shareCount == null ? "未获取" : latestSuccess.shareCount.toLocaleString("zh-CN")}</p>
                  <p><strong>失败提示：</strong>{latestSnapshot?.failureReason ?? "-"}</p>
                </div>
                <div className="mt-4">
                  <PostMetricsPanel snapshot={latestSuccess} latestAttempt={latestSnapshot} />
                </div>
              </section>

              {proof.verificationStatus === ProofStatus.PENDING ? (
                <form action={action} className="mt-5 grid gap-3">
                  <Select label="拒绝原因" name="rejectionReason" defaultValue={rejectionReasons[0]}>
                    {rejectionReasons.map((reason) => <option key={reason}>{reason}</option>)}
                  </Select>
                  <Textarea label="拒绝说明，拒绝时必填" name="rejectionNote" rows={3} />
                  <div className="flex flex-wrap gap-2">
                    <Button name="decision" value="accept" variant="secondary">验收通过，收益入账</Button>
                    <Button name="decision" value="reject" variant="danger">拒绝，要求补交链接</Button>
                  </div>
                </form>
              ) : (
                <div className="mt-5 rounded-2xl bg-stone-100 p-4 text-sm text-stone-600">
                  {proof.verificationStatus === ProofStatus.VERIFIED ? "该链接已通过验收。" : `该链接已拒绝：${proof.rejectionReason ?? ""} ${proof.rejectionNote ?? ""}`}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
