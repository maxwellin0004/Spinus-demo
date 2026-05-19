import { addComplianceRuleAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { shortDate } from "@/lib/format";
import { AdminSettingsAccordion, AdminSettingsAccordionSection } from "@/components/admin-settings-accordion";
import { AdminInfoPanel, AdminMetricGrid } from "@/components/admin-workbench";
import { SubmitButton } from "@/components/form-controls";
import { Card, DataTable, Field, PageHeader, Select, StatusBadge, Textarea } from "@/components/ui";

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

  const activeRules = rules.filter((rule) => rule.active).length;
  const highSeverityRules = rules.filter((rule) => rule.severity === "HIGH").length;
  const unresolvedFlags = flags.filter((flag) => flag.level === "HIGH" || flag.level === "MEDIUM").length;

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="管理端" title="规则中心">
        <StatusBadge tone={unresolvedFlags > 0 ? "warning" : "success"}>{unresolvedFlags} 个需关注风险标记</StatusBadge>
        <StatusBadge tone="info">{rules.length} 条规则</StatusBadge>
      </PageHeader>

      <AdminMetricGrid
        items={[
          { label: "规则总数", value: rules.length },
          { label: "启用规则", value: activeRules },
          { label: "高严重级别规则", value: highSeverityRules },
        ]}
      />

      <AdminInfoPanel>
        <p>
          当前规则中心只做轻量提示和结构化记录，不做复杂自动判定。资金和任务争议以系统内记录、草稿、发布链接和验收意见作为主要证据。
        </p>
        <p>
          平台联系邮箱：<span className="font-black text-stone-950">{settings.platformContactEmail}</span>。一般问题可以邮件联系，资金和任务争议必须在系统内发起。
        </p>
      </AdminInfoPanel>

      <AdminSettingsAccordion defaultExpandedId="rule-create">
        <AdminSettingsAccordionSection
          id="rule-create"
          title="新增规则"
          summary="录入敏感词、禁止表达、广告披露和平台规则，作为后台审核和运营提示的基础。"
          tone="info"
        >
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
              <Field label="关键词 / 表达" name="keyword" required />
              <Textarea label="说明" name="description" />
              <div className="md:col-span-2">
                <SubmitButton pendingLabel="正在新增...">新增规则</SubmitButton>
              </div>
            </form>
          </Card>
        </AdminSettingsAccordionSection>

        <AdminSettingsAccordionSection
          id="rule-list"
          title="规则列表"
          summary={`${rules.length} 条规则，${activeRules} 条已启用，${highSeverityRules} 条高严重级别。`}
          tone={highSeverityRules > 0 ? "warning" : "success"}
          abnormal={highSeverityRules > 0}
        >
          <DataTable
            headers={["规则类型", "关键词", "严重程度", "状态", "创建时间"]}
            rows={rules.map((rule) => [
              ruleTypeText[rule.type] ?? rule.type,
              rule.keyword,
              <StatusBadge key="severity" tone={rule.severity === "HIGH" ? "warning" : rule.severity === "MEDIUM" ? "info" : "neutral"}>
                {severityText[rule.severity] ?? rule.severity}
              </StatusBadge>,
              rule.active ? "启用" : "停用",
              shortDate(rule.createdAt),
            ])}
          />
        </AdminSettingsAccordionSection>

        <AdminSettingsAccordionSection
          id="risk-flags"
          title="最近风险标记"
          summary={`${flags.length} 条最近标记，${unresolvedFlags} 条中高风险。`}
          tone={unresolvedFlags > 0 ? "warning" : "success"}
          abnormal={unresolvedFlags > 0}
        >
          <DataTable
            headers={["对象", "等级", "原因", "创建时间"]}
            rows={flags.map((flag) => [
              `${flag.entityType}:${flag.entityId.slice(0, 8)}`,
              <StatusBadge key="severity" tone={flag.level === "HIGH" ? "warning" : flag.level === "MEDIUM" ? "info" : "neutral"}>
                {severityText[flag.level] ?? flag.level}
              </StatusBadge>,
              flag.reason,
              shortDate(flag.createdAt),
            ])}
          />
        </AdminSettingsAccordionSection>
      </AdminSettingsAccordion>
    </div>
  );
}
