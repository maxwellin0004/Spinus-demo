import Link from "next/link";
import { UserRole } from "@prisma/client";
import { CopyButton } from "@/components/form-controls";
import { Card, PageHeader, StatusBadge } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { creatorMembershipLabel, creatorMembershipTone } from "@/lib/creator-membership-status";
import { creatorMembershipTiers, getCreatorMembershipTier } from "@/lib/creator-memberships";
import { shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function CreatorMembershipCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>;
}) {
  const session = await requireRole(UserRole.CREATOR);
  const { tier } = await searchParams;
  const creator = await prisma.creatorProfile.findUnique({
    where: { userId: session.userId },
    include: {
      responsibleAdmin: { include: { user: true } },
    },
  });

  if (!creator) {
    return <PageHeader title="缺少创作者资料" />;
  }

  const selectedTier = getCreatorMembershipTier(tier);
  const operatorName = creator.responsibleAdmin?.displayName || "平台运营";
  const operatorContact = creator.responsibleAdmin?.wechat || creator.responsibleAdmin?.user.email || "等待平台分配";

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Creator Checkout" title="开通与支付">
        <Link className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-black text-stone-800 shadow-sm" href="/creator/membership">
          返回会员页
        </Link>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">当前会员</p>
          <div className="mt-3">
            <StatusBadge tone={creatorMembershipTone(creator.membershipTier)}>{creatorMembershipLabel(creator.membershipTier)}</StatusBadge>
          </div>
          <p className="mt-3 text-sm text-stone-600">到期时间：{creator.membershipEndsAt ? shortDate(creator.membershipEndsAt) : "未设置"}</p>
        </Card>
        <Card>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">本次意向</p>
          <p className="mt-3 text-2xl font-black text-stone-950">{selectedTier.title}</p>
          <p className="mt-2 text-sm text-stone-600">{selectedTier.priceLabel}</p>
        </Card>
        <Card>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">联系运营</p>
          <p className="mt-3 text-2xl font-black text-stone-950">{operatorName}</p>
          <p className="mt-2 text-sm text-stone-600">{operatorContact}</p>
        </Card>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="bg-[linear-gradient(135deg,#111827_0%,#1f2937_42%,#78350f_100%)] px-6 pb-8 pt-6 text-white">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-300">Payment / Contact</p>
          <h2 className="mt-4 text-4xl font-black leading-tight">先联系运营确认档位，再完成付款开通</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/78">
            当前版本不在站内完成复杂支付。你只需要联系运营确认会员档位，付款完成后由平台人工开通对应权益。
          </p>
        </div>

        <div className="grid gap-4 px-6 py-6 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-[24px] border border-stone-200 bg-stone-50 p-5">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-stone-500">对接运营</p>
            <p className="mt-3 text-3xl font-black text-stone-950">{operatorName}</p>
            <p className="mt-2 text-sm leading-7 text-stone-600">联系信息：{operatorContact}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <CopyButton value={operatorContact}>复制联系方式</CopyButton>
              <CopyButton value={creator.displayName}>复制当前账号名</CopyButton>
              <CopyButton value={selectedTier.title}>复制意向档位</CopyButton>
            </div>
          </div>

          <div className="grid gap-4">
            {creatorMembershipTiers.map((tierItem) => (
              <div className="rounded-[24px] border border-stone-200 bg-white p-5" key={tierItem.slug}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.16em] text-stone-500">{tierItem.badge}</p>
                    <h3 className="mt-2 text-2xl font-black text-stone-950">{tierItem.title}</h3>
                  </div>
                  <span className="rounded-full bg-stone-950 px-4 py-2 text-sm font-black text-white">{tierItem.priceLabel}</span>
                </div>
                <p className="mt-4 text-sm leading-7 text-stone-600">{tierItem.subtitle}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {tierItem.outcomes.map((item) => (
                    <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-black text-stone-700" key={item}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-black text-stone-950">开通步骤</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {["确认适合的会员档位", "联系运营完成付款或咨询", "平台人工开通会员权益"].map((item, index) => (
            <div className="rounded-2xl border border-stone-200 bg-white px-5 py-4" key={item}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-400">Step {index + 1}</p>
              <p className="mt-2 text-base font-black text-stone-950">{item}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
