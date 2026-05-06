import { ComplianceRuleType, RiskLevel } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ComplianceResult = {
  blocked: boolean;
  hits: string[];
  severity: RiskLevel | null;
};

const severityRank: Record<RiskLevel, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
};

export async function checkSensitiveText(parts: string[]): Promise<ComplianceResult> {
  const content = parts.join("\n").toLowerCase();
  const rules = await prisma.complianceRule.findMany({
    where: {
      active: true,
      type: { in: [ComplianceRuleType.SENSITIVE_WORD, ComplianceRuleType.PROHIBITED_EXPRESSION] },
    },
  });

  const hits = rules
    .filter((rule) => content.includes(rule.keyword.toLowerCase()))
    .sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);

  return {
    blocked: hits.some((hit) => hit.severity === RiskLevel.HIGH || hit.severity === RiskLevel.MEDIUM),
    hits: hits.map((hit) => hit.keyword),
    severity: hits[0]?.severity ?? null,
  };
}
