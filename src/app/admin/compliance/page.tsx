import { addComplianceRuleAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { Button, Card, DataTable, Field, PageHeader, Select, Textarea, StatusBadge } from "@/components/ui";
import { shortDate } from "@/lib/format";

export default async function AdminCompliancePage() {
  const [rules, flags] = await Promise.all([
    prisma.complianceRule.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.riskFlag.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="管理端" title="合规与风控中心" />
      <Card>
        <form action={addComplianceRuleAction} className="grid gap-4 md:grid-cols-2">
          <Select label="规则类型" name="type" defaultValue="SENSITIVE_WORD">
            <option value="SENSITIVE_WORD">敏感词</option>
            <option value="PROHIBITED_EXPRESSION">禁止表达</option>
            <option value="DISCLOSURE">广告披露</option>
            <option value="PLATFORM_RULE">平台规则</option>
          </Select>
          <Select label="严重程度" name="severity" defaultValue="HIGH">
            <option value="LOW">低</option>
            <option value="MEDIUM">中</option>
            <option value="HIGH">高</option>
          </Select>
          <Field label="关键词/表达" name="keyword" required />
          <Textarea label="说明" name="description" />
          <div className="md:col-span-2"><Button>新增规则</Button></div>
        </form>
      </Card>
      <DataTable
        headers={["Type", "Keyword", "Severity", "Active", "Created"]}
        rows={rules.map((rule) => [
          rule.type,
          rule.keyword,
          <StatusBadge key="s">{rule.severity}</StatusBadge>,
          rule.active ? "Yes" : "No",
          shortDate(rule.createdAt),
        ])}
      />
      <section>
        <h2 className="mb-3 text-xl font-semibold">最近风险标记</h2>
        <DataTable
          headers={["Entity", "Level", "Reason", "Created"]}
          rows={flags.map((flag) => [
            `${flag.entityType}:${flag.entityId.slice(0, 8)}`,
            <StatusBadge key="s">{flag.level}</StatusBadge>,
            flag.reason,
            shortDate(flag.createdAt),
          ])}
        />
      </section>
    </div>
  );
}
