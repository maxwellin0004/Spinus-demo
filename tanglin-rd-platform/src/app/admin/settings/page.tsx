import { Card, PageHeader } from "@/components/ui";

export default function AdminSettingsPage() {
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="管理端" title="平台设置" />
      <Card>
        <p className="text-stone-600">
          第一版的平台设置分布在数据库模块中：合规规则、任务包模板和钱包流水结算规则。后续如需集中配置平台级规则，可在此扩展专门表单。
        </p>
      </Card>
    </div>
  );
}
