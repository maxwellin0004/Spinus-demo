import { CampaignWizard } from "@/components/campaign-wizard";
import { PageHeader } from "@/components/ui";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="品牌方" title="七步推广创建向导" />
      <CampaignWizard error={error} />
    </div>
  );
}
