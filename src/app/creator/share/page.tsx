import Link from "next/link";
import { UserRole } from "@prisma/client";
import { CreatorPosterGenerator } from "@/components/creator-poster-generator";
import { Card, MetricCard, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { creatorRegisterUrl } from "@/lib/creator-marketing";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export default async function CreatorSharePage() {
  const session = await requireRole(UserRole.CREATOR);
  const creator = await prisma.creatorProfile.findUnique({
    where: { userId: session.userId },
    include: {
      responsibleAdmin: { include: { user: true } },
    },
  });

  if (!creator) {
    return <PageHeader title="缺少创作者资料" />;
  }

  const headerStore = await headers();
  const protocol = headerStore.get("x-forwarded-proto") || "http";
  const host = headerStore.get("host") || "localhost:3000";
  const registerUrl = creatorRegisterUrl(creator.shareCode, `${protocol}://${host}`);
  const referralCount = await prisma.creatorReferralAttribution.count({
    where: { creatorProfileId: creator.id },
  });
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
        <MetricCard compact label="注册链接" sub="二维码指向这个地址" value="Creator" href={registerUrl} />
        <MetricCard compact label="通过分享注册" sub="当前累计注册人数" value={referralCount} />
        <MetricCard compact label="会员咨询联络" sub="支付 / 开通统一从这里继续" value={operatorContact} />
      </div>

      <CreatorPosterGenerator />

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-stone-950">当前分享链路</h2>
            <p className="mt-2 text-sm leading-7 text-stone-600">
              海报二维码会直接跳到创作者注册页，并带上你的专属分享码。对方完成注册后，系统会把这次注册记录到你的分享来源里。
            </p>
            <p className="mt-2 break-all text-sm text-stone-500">{registerUrl}</p>
          </div>
          <Link className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-black text-stone-950 shadow-sm" href="/creator/membership">
            去开通会员
          </Link>
        </div>
      </Card>
    </div>
  );
}
