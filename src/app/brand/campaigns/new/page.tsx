import { UserRole } from "@prisma/client";
import { CampaignWizard } from "@/components/campaign-wizard";
import { PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireRole(UserRole.BRAND);
  const [{ error }, settings, brand] = await Promise.all([
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
      />
    </div>
  );
}
