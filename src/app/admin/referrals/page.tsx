import Link from "next/link";
import { CreatorMembershipApplicationStatus, CreatorMembershipTier } from "@prisma/client";
import { DataTable, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { creatorScopeWhere, demoWhere, getAdminContext, hasAdminPermission, scopeOptions } from "@/lib/admin";
import { creatorMembershipLabel, creatorMembershipTone } from "@/lib/creator-membership-status";
import { money, percent, shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type SortKey = "registrations" | "conversions" | "amount";

export default async function AdminReferralsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; scope?: string; demo?: string; sort?: string }>;
}) {
  const context = await getAdminContext();
  const { q, scope, demo, sort } = await searchParams;
  const canSeeDemo = hasAdminPermission(context.profile, "demo.manage");
  const sortKey: SortKey = sort === "conversions" || sort === "amount" ? sort : "registrations";

  const creators = await prisma.creatorProfile.findMany({
    where: {
      ...creatorScopeWhere(context.profile, scope),
      ...demoWhere(demo, canSeeDemo),
      displayName: q ? { contains: q, mode: "insensitive" } : undefined,
    },
    include: {
      responsibleAdmin: true,
      referralsReceived: {
        include: {
          user: {
            include: {
              creatorProfile: {
                include: {
                  membershipApplications: {
                    where: { status: CreatorMembershipApplicationStatus.APPROVED },
                    orderBy: { createdAt: "desc" },
                    take: 5,
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const ranking = creators.map((creator) => {
    const registrations = creator.referralsReceived.length;
    const convertedUsers = creator.referralsReceived.filter((referral) => referral.user.creatorProfile?.membershipTier !== CreatorMembershipTier.NONE);
    const convertedMembers = convertedUsers.length;
    const approvedAmount = convertedUsers.reduce((sum, referral) => {
      const latestApproved = referral.user.creatorProfile?.membershipApplications[0];
      return sum + Number(latestApproved?.amount ?? 0);
    }, 0);

    return {
      creator,
      registrations,
      convertedMembers,
      approvedAmount,
      conversionRate: registrations > 0 ? (convertedMembers / registrations) * 100 : 0,
    };
  });

  ranking.sort((left, right) => {
    if (sortKey === "amount") return right.approvedAmount - left.approvedAmount || right.registrations - left.registrations;
    if (sortKey === "conversions") return right.convertedMembers - left.convertedMembers || right.registrations - left.registrations;
    return right.registrations - left.registrations || right.convertedMembers - left.convertedMembers;
  });

  const totalRegistrations = ranking.reduce((sum, item) => sum + item.registrations, 0);
  const totalConversions = ranking.reduce((sum, item) => sum + item.convertedMembers, 0);
  const totalApprovedAmount = ranking.reduce((sum, item) => sum + item.approvedAmount, 0);
  const activeSharers = ranking.filter((item) => item.registrations > 0).length;
  const recentConverted = ranking
    .flatMap((item) =>
      item.creator.referralsReceived
        .filter((referral) => referral.user.creatorProfile?.membershipTier !== CreatorMembershipTier.NONE)
        .map((referral) => ({
          inviterName: item.creator.displayName,
          inviterId: item.creator.id,
          userEmail: referral.user.email,
          memberTier: referral.user.creatorProfile?.membershipTier ?? CreatorMembershipTier.NONE,
          registeredAt: referral.createdAt,
          latestApproved: referral.user.creatorProfile?.membershipApplications[0] ?? null,
        })),
    )
    .sort((left, right) => right.registeredAt.getTime() - left.registeredAt.getTime())
    .slice(0, 20);

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Referral Analytics" title="邀请转化分析" />

      <form className="flex flex-wrap gap-3">
        <input className="rounded-full border border-stone-200 px-4 py-3" name="q" placeholder="搜索创作者" defaultValue={q} />
        <select className="rounded-full border border-stone-200 px-4 py-3" name="scope" defaultValue={scope}>
          {scopeOptions(context.profile).map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <select className="rounded-full border border-stone-200 px-4 py-3" name="sort" defaultValue={sortKey}>
          <option value="registrations">按注册人数排序</option>
          <option value="conversions">按会员转化排序</option>
          <option value="amount">按转化金额排序</option>
        </select>
        <select className="rounded-full border border-stone-200 px-4 py-3" name="demo" defaultValue={demo ?? "real"}>
          <option value="real">只看真实数据</option>
          {canSeeDemo ? <option value="include">包含演示数据</option> : null}
          {canSeeDemo ? <option value="only">只看演示数据</option> : null}
        </select>
        <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white">筛选</button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="累计邀请注册" value={totalRegistrations} sub="通过创作者分享码完成注册" />
        <MetricCard label="累计会员转化" value={totalConversions} sub={totalRegistrations ? `整体转化率 ${percent((totalConversions / totalRegistrations) * 100)}` : "暂无转化"} />
        <MetricCard label="转化金额" value={money(totalApprovedAmount)} sub="按已通过会员申请金额统计" />
        <MetricCard label="活跃分享创作者" value={activeSharers} sub="至少带来 1 个注册的创作者" />
      </div>

      <section>
        <h2 className="mb-3 text-xl font-semibold">创作者排名</h2>
        <DataTable
          headers={["创作者", "分享码", "负责运营", "邀请注册", "会员转化", "转化率", "转化金额", "会员状态", "明细"]}
          rows={ranking.map((item) => [
            item.creator.displayName,
            item.creator.shareCode,
            item.creator.responsibleAdmin?.displayName ?? "-",
            item.registrations,
            item.convertedMembers,
            percent(item.conversionRate),
            money(item.approvedAmount),
            <StatusBadge key={`${item.creator.id}-membership`} tone={creatorMembershipTone(item.creator.membershipTier)}>
              {creatorMembershipLabel(item.creator.membershipTier)}
            </StatusBadge>,
            <Link className="font-semibold text-stone-950" href={`/admin/creators/${item.creator.id}`} key={item.creator.id}>
              查看详情
            </Link>,
          ])}
          emptyTitle="还没有可统计的分享数据"
          emptyBody="当创作者通过海报带来注册后，这里会自动形成排名。"
        />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">最近会员转化</h2>
        <DataTable
          headers={["邀请人", "注册用户", "会员档位", "审批金额", "审批时间", "注册时间"]}
          rows={recentConverted.map((item, index) => [
            <Link className="font-semibold text-stone-950" href={`/admin/creators/${item.inviterId}`} key={`${item.inviterId}-${index}`}>
              {item.inviterName}
            </Link>,
            item.userEmail,
            <StatusBadge key={`${item.inviterId}-${index}-tier`} tone={creatorMembershipTone(item.memberTier)}>
              {creatorMembershipLabel(item.memberTier)}
            </StatusBadge>,
            money(item.latestApproved?.amount),
            shortDate(item.latestApproved?.reviewedAt ?? item.latestApproved?.createdAt),
            shortDate(item.registeredAt),
          ])}
          emptyTitle="还没有邀请带来的会员转化"
          emptyBody="当被邀请用户开通成长会员或 Pro 高阶会员后，这里会显示最近记录。"
        />
      </section>
    </div>
  );
}
