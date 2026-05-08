import Link from "next/link";
import { SocialVerificationStatus } from "@prisma/client";
import { refreshSocialAccountMetricsAction, updateSocialAccountVerificationAction } from "@/lib/actions";
import { requireAdminPermission } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { Button, Card, DataTable, PageHeader, StatusBadge, Textarea } from "@/components/ui";
import { number, shortDate } from "@/lib/format";
import { V1_PLATFORMS } from "@/lib/v1Options";

export default async function AdminSocialAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; platform?: string; error?: string }>;
}) {
  await requireAdminPermission("account.freeze");

  const params = await searchParams;
  const status = params.status ?? SocialVerificationStatus.PENDING;
  const platform = params.platform ?? "";
  const error = params.error;

  const accounts = await prisma.socialAccount.findMany({
    where: {
      verificationStatus: status !== "ALL" ? (status as SocialVerificationStatus) : undefined,
      platform: platform || undefined,
    },
    include: {
      creator: {
        include: {
          user: true,
          responsibleAdmin: true,
        },
      },
      metricSnapshots: { orderBy: { fetchedAt: "desc" }, take: 3 },
      crawlerJobs: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: [{ verificationStatus: "asc" }, { createdAt: "desc" }],
  });

  const pendingCount = await prisma.socialAccount.count({
    where: { verificationStatus: SocialVerificationStatus.PENDING },
  });

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="管理端" title="社媒账号审核">
        <StatusBadge>{pendingCount} 待审核</StatusBadge>
      </PageHeader>
      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}

      <form className="flex flex-wrap gap-3">
        <select className="rounded-full border border-stone-200 px-4 py-3" name="status" defaultValue={status}>
          <option value="PENDING">待审核</option>
          <option value="VERIFIED">已验证</option>
          <option value="REJECTED">已拒绝</option>
          <option value="ALL">全部</option>
        </select>
        <select className="rounded-full border border-stone-200 px-4 py-3" name="platform" defaultValue={platform}>
          <option value="">全部平台</option>
          {V1_PLATFORMS.map((item) => <option key={item}>{item}</option>)}
        </select>
        <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white">筛选</button>
        <Link className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700" href="/admin/social-accounts">
          重置
        </Link>
      </form>

      <DataTable
        headers={["KOL", "平台", "账号", "粉丝数", "均播/均读", "地区/语言", "状态", "提交时间"]}
        rows={accounts.map((account) => [
          account.creator.displayName,
          account.platform,
          <a className="font-semibold text-stone-950" href={account.accountUrl} key={account.id}>
            {account.accountName}
          </a>,
          number(account.followers || account.submittedFollowers || 0),
          number(account.avgViews || account.submittedAvgViews || 0),
          `${account.country} / ${account.language}`,
          <StatusBadge key="s">{account.verificationStatus}</StatusBadge>,
          shortDate(account.createdAt),
        ])}
      />

      <div className="grid gap-4">
        {accounts.map((account) => {
          const action = updateSocialAccountVerificationAction.bind(null, account.id);
          const refreshAction = refreshSocialAccountMetricsAction.bind(null, account.id);
          const latestSuccess = account.metricSnapshots.find((snapshot) => snapshot.status === "SUCCESS");
          const latestSnapshot = account.metricSnapshots[0];
          const latestJob = account.crawlerJobs[0];
          return (
            <Card key={account.id}>
              <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black text-stone-950">{account.creator.displayName}</h2>
                    <StatusBadge>{account.verificationStatus}</StatusBadge>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-stone-600">
                    <p><strong>邮箱：</strong>{account.creator.user.email}</p>
                    <p><strong>平台：</strong>{account.platform}</p>
                    <p><strong>账号：</strong>{account.accountName}</p>
                    <p>
                      <strong>链接：</strong>
                      <a className="font-semibold text-stone-950" href={account.accountUrl}>
                        {account.accountUrl}
                      </a>
                    </p>
                    <p><strong>粉丝/均播：</strong>{number(account.followers || account.submittedFollowers || 0)} / {number(account.avgViews || account.submittedAvgViews || 0)}</p>
                    <p><strong>内容形式：</strong>{account.contentType}</p>
                    <p><strong>地区/语言：</strong>{account.country} / {account.language}</p>
                    <p><strong>运营负责人：</strong>{account.creator.responsibleAdmin?.displayName ?? "未分配"}</p>
                    <div className="mt-3 rounded-2xl bg-white/80 p-3">
                      <p className="font-black text-stone-950">自动抓取核验</p>
                      <p><strong>最近任务：</strong>{latestJob ? `${latestJob.type} / ${latestJob.status} / ${shortDate(latestJob.createdAt)}` : "暂无"}</p>
                      <p><strong>最新成功粉丝数：</strong>{latestSuccess?.followerCount == null ? "未获取" : number(latestSuccess.followerCount)}</p>
                      <p><strong>获赞/作品：</strong>{latestSuccess ? `${latestSuccess.likeCount == null ? "未获取" : number(latestSuccess.likeCount)} / ${latestSuccess.postCount == null ? "未获取" : number(latestSuccess.postCount)}` : "未获取"}</p>
                      <p><strong>最近抓取：</strong>{latestSnapshot ? `${latestSnapshot.status} / ${shortDate(latestSnapshot.fetchedAt)}${latestSnapshot.failureReason ? ` / ${latestSnapshot.failureReason}` : ""}` : "暂无快照"}</p>
                    </div>
                  </div>
                </div>
                <form action={action} className="grid gap-3">
                  <Textarea label="审核说明" name="verificationNote" defaultValue={account.verificationNote ?? ""} rows={3} />
                  <div className="flex flex-wrap gap-2">
                    <Button name="verificationStatus" value="VERIFIED" variant="secondary">
                      通过验证
                    </Button>
                    <Button name="verificationStatus" value="REJECTED" variant="danger">
                      拒绝
                    </Button>
                    <Button name="verificationStatus" value="PENDING" variant="ghost">
                      退回待审
                    </Button>
                  </div>
                </form>
                <form action={refreshAction} className="lg:col-span-2">
                  <Button variant="ghost">刷新账号数据</Button>
                </form>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
