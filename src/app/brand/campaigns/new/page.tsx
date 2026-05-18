import { UserRole } from "@prisma/client";
import { CampaignWizard, type CampaignWizardPrefill } from "@/components/campaign-wizard";
import { PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; trend?: string; platform?: string; creator?: string; reason?: string; keyword?: string }>;
}) {
  const session = await requireRole(UserRole.BRAND);
  const [{ error, trend, platform, creator, reason, keyword }, settings, brand] = await Promise.all([
    searchParams,
    prisma.platformSettings.upsert({
      where: { id: "platform" },
      update: {},
      create: { id: "platform" },
    }),
    prisma.brandProfile.findUnique({
      where: { userId: session.userId },
      select: { budgetBalance: true },
    }),
  ]);
  const prefill: CampaignWizardPrefill | undefined = trend
    ? {
        title: trend,
        productName: keyword || trend,
        objective: "借势热点完成真实体验种草",
        cta: "查看主页或链接了解产品详情",
        platform,
        creator,
        brief: `${trend} 是当前热点洞察台推荐的投放方向。请围绕「${keyword || trend}」展开真实体验内容，结合用户痛点、使用场景、对比证据和转化 CTA。推荐原因：${reason || "热度、样本可信度和平台匹配度综合较高。"}`,
        mustInclude: `${keyword || trend}, 真实使用场景, 用户痛点, 转化 CTA, 广告披露`,
        hashtags: `#${keyword || trend}, #真实体验, #种草分享`,
      }
    : undefined;

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="品牌方" title="Campaign 创建向导" />
      <CampaignWizard
        error={error}
        settings={{
          acceptanceSlaDays: settings.acceptanceSlaDays,
          highValueReviewThreshold: Number(settings.highValueReviewThreshold),
          resubmissionGraceDays: settings.resubmissionGraceDays,
          kolPreviewMaxMb: settings.kolPreviewMaxMb,
          platformFeeRate: Number(settings.platformFeeRate),
          platformContactEmail: settings.platformContactEmail,
          riskIndustryKeywords: settings.riskIndustryKeywords,
          riskIndustryPrompt: settings.riskIndustryPrompt,
        }}
        brandBalance={Number(brand?.budgetBalance ?? 0)}
        prefill={prefill}
      />
    </div>
  );
}
