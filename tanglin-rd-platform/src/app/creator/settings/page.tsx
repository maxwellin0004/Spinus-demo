import { Card, PageHeader } from "@/components/ui";

export default function CreatorSettingsPage() {
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="创作者" title="设置" />
      <Card>
        <p className="text-stone-600">第一版创作者设置保持轻量。个人资料、社媒账号、收款信息和通知状态分别在对应流程页面中维护。</p>
      </Card>
    </div>
  );
}
