import Link from "next/link";
import { UserRole } from "@prisma/client";
import { CreatorPosterGenerator } from "@/components/creator-poster-generator";
import { Card, DataTable, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { creatorMembershipLabel, creatorMembershipTone } from "@/lib/creator-membership-status";
import { creatorRegisterUrl } from "@/lib/creator-marketing";
import { shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export default async function CreatorSharePage() {
  const session = await requireRole(UserRole.CREATOR);
  const creator = await prisma.creatorProfile.findUnique({
    where: { userId: session.userId },
    include: {
      responsibleAdmin: { include: { user: true } },
      referralsReceived: {
        include: {
          user: {
            include: { creatorProfile: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!creator) {
    return <PageHeader title="缺少创作者资料" />;
  }

  const headerStore = await headers();
  const protocol = headerStore.get("x-forwarded-proto") || "http";
  const host = headerStore.get("host") || "localhost:3000";
  const registerUrl = creatorRegisterUrl(creator.shareCode, `${protocol}://${host}`);
  const operatorContact = creator.responsibleAdmin?.wechat || creator.responsibleAdmin?.user.email || "平台分配后显示";

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Creator Share" title="分享海报">
        <Link className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-black text-stone-800 shadow-sm" href="/creator/membership">
          查看会员方案
        </Link>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard compact label="专属分享码" value={creator.shareCode} />
        <MetricCard compact label="注册链接" sub="二维码指向这个地址" value="注册入口" href={registerUrl} />
        <MetricCard compact label="通过分享注册" sub="当前累计注册人数" value={creator.referralsReceived.length} />
        <MetricCard compact label="当前会员" sub="你的会员状态" value={creatorMembershipLabel(creator.membershipTier)} />
      </div>

      <CreatorPosterGenerator />

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-stone-950">当前分享链路</h2>
            <p className="mt-2 text-sm leading-7 text-stone-600">
              海报二维码会直接跳到创作者注册页，并带上你的专属分享码。对方完成注册后，系统会记录到你的邀请来源里，管理员也可以在后台看到邀请明细。
            </p>
            <p className="mt-2 break-all text-sm text-stone-500">{registerUrl}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <StatusBadge tone={creatorMembershipTone(creator.membershipTier)}>{creatorMembershipLabel(creator.membershipTier)}</StatusBadge>
            <span className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-black text-stone-700 shadow-sm">
              会员咨询：{operatorContact}
            </span>
          </div>
        </div>
      </Card>

      <section>
        <h2 className="mb-3 text-xl font-semibold">我邀请的用户</h2>
        <DataTable
          emptyTitle="还没有用户通过你的海报完成注册"
          emptyBody="分享出去后，只要对方通过你的专属二维码完成注册，这里就会出现邀请明细。"
          headers={["用户", "邮箱", "当前状态", "会员状态", "注册时间"]}
          rows={creator.referralsReceived.map((referral) => [
            referral.user.creatorProfile?.displayName ?? referral.user.email,
            referral.user.email,
            <StatusBadge key={`${referral.id}-status`}>{referral.user.status}</StatusBadge>,
            referral.user.creatorProfile ? (
              <StatusBadge key={`${referral.id}-membership`} tone={creatorMembershipTone(referral.user.creatorProfile.membershipTier)}>
                {creatorMembershipLabel(referral.user.creatorProfile.membershipTier)}
              </StatusBadge>
            ) : (
              "-"
            ),
            shortDate(referral.createdAt),
          ])}
        />
      </section>
    </div>
  );
}
