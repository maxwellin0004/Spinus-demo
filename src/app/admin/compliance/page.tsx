import { addComplianceRuleAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { Button, Card, DataTable, Field, PageHeader, Select, StatusBadge, Textarea } from "@/components/ui";
import { shortDate } from "@/lib/format";

const ruleTypeText = {
  SENSITIVE_WORD: "敏感词",
  PROHIBITED_EXPRESSION: "禁止表达",
  DISCLOSURE: "广告披露",
  PLATFORM_RULE: "平台规则",
};

const severityText = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
};

export default async function AdminCompliancePage() {
  const [rules, flags, settings] = await Promise.all([
    prisma.complianceRule.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.riskFlag.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.platformSettings.upsert({ where: { id: "platform" }, update: {}, create: { id: "platform" } }),
  ]);

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="管理端" title="规则中心" />

      <Card>
        <div className="grid gap-3 text-sm leading-6 text-stone-600">
          <p>第一版规则中心只做轻量提示和结构化记录，不做复杂自动判定。资金和任务争议必须以系统内记录、草稿、发布链接和验收意见为主要证据。</p>
          <p>
            平台联系邮箱：<span className="font-black text-stone-950">{settings.platformContactEmail}</span>。一般问题可邮件联系，资金和任务争议必须在系统内发起。
          </p>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-black text-stone-950">新增规则</h2>
        <form action={addComplianceRuleAction} className="mt-4 grid gap-4 md:grid-cols-2">
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
          <div className="md:col-span-2">
            <Button>新增规则</Button>
          </div>
        </form>
      </Card>

      <DataTable
        headers={["规则类型", "关键词", "严重程度", "状态", "创建时间"]}
        rows={rules.map((rule) => [
          ruleTypeText[rule.type] ?? rule.type,
          rule.keyword,
          <StatusBadge key="s">{severityText[rule.severity] ?? rule.severity}</StatusBadge>,
          rule.active ? "启用" : "停用",
          shortDate(rule.createdAt),
        ])}
      />

      <section>
        <h2 className="mb-3 text-xl font-black text-stone-950">最近风险标记</h2>
        <DataTable
          headers={["对象", "等级", "原因", "创建时间"]}
          rows={flags.map((flag) => [
            `${flag.entityType}:${flag.entityId.slice(0, 8)}`,
            <StatusBadge key="s">{severityText[flag.level] ?? flag.level}</StatusBadge>,
            flag.reason,
            shortDate(flag.createdAt),
          ])}
        />
      </section>
    </div>
  );
}
