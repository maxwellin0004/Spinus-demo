import { Prisma, UserRole } from "@prisma/client";
import { requireAdminPermission } from "@/lib/admin";
import { requireRole } from "@/lib/auth";
import { timedJson, withRouteTimer } from "@/lib/http-timing";
import { normalizeScriptTables, tablesToPlainText, type ScriptTableGroupKey, type ScriptSourceType } from "@/lib/insights/script-tables";
import { regenerateTrendScriptTable, scriptGenerationToView, type ScriptCaseContext, type ScriptTopicContext } from "@/lib/insights/trend-script-generation";
import { prisma } from "@/lib/prisma";

type RegenerateTableBody = {
  scriptGenerationId?: string;
  groupKey?: string;
  tableId?: string;
  userInstruction?: string | null;
};

type SourcePayload = {
  sourceType?: ScriptSourceType;
  sourceTitle?: string;
  platformLabel?: string;
  directionLabel?: string;
  topic?: ScriptTopicContext | null;
  caseStudy?: ScriptCaseContext | null;
  userInstruction?: string | null;
};

function jsonInput(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

function cleanText(value: unknown, limit: number) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function normalizeGroupKey(value: unknown): ScriptTableGroupKey | null {
  if (value === "graphicTables" || value === "videoTables" || value === "caseAnalysisTables") return value;
  return null;
}

function tableFieldForGroup(groupKey: ScriptTableGroupKey) {
  if (groupKey === "graphicTables") return "graphicTablesJson" as const;
  if (groupKey === "videoTables") return "videoTablesJson" as const;
  return "caseAnalysisTablesJson" as const;
}

function replaceTable(tables: unknown, tableId: string, nextTable: ReturnType<typeof normalizeScriptTables>[number]) {
  const normalized = normalizeScriptTables(tables);
  const index = normalized.findIndex((table) => table.id === tableId);
  if (index < 0) return [...normalized, nextTable];
  return normalized.map((table, currentIndex) => (currentIndex === index ? nextTable : table));
}

function sourceInputFromRecord(record: { sourceType: string; sourceTitle: string; platform: string | null; userInstruction: string | null; sourcePayload: unknown }, userInstruction: string | null) {
  const payload = record.sourcePayload && typeof record.sourcePayload === "object" ? (record.sourcePayload as SourcePayload) : {};
  return {
    sourceType: record.sourceType === "CASE_STUDY" ? "CASE_STUDY" : "TOPIC_RECOMMENDATION",
    sourceTitle: payload.sourceTitle || record.sourceTitle,
    platformLabel: payload.platformLabel || record.platform || "全部平台",
    directionLabel: payload.directionLabel || "内容方向",
    topic: payload.topic ?? null,
    caseStudy: payload.caseStudy ?? null,
    userInstruction: [record.userInstruction, payload.userInstruction, userInstruction].filter(Boolean).join("；") || null,
  } satisfies Parameters<typeof regenerateTrendScriptTable>[1];
}

export async function POST(request: Request) {
  const timer = withRouteTimer();
  const session = await requireRole([UserRole.ADMIN, UserRole.CREATOR]);
  if (session.role === UserRole.ADMIN) await requireAdminPermission("compliance.manage");

  const body = (await request.json().catch(() => ({}))) as RegenerateTableBody;
  const scriptGenerationId = cleanText(body.scriptGenerationId, 80);
  const tableId = cleanText(body.tableId, 120);
  const groupKey = normalizeGroupKey(body.groupKey);
  const userInstruction = cleanText(body.userInstruction, 600) || null;

  if (!scriptGenerationId || !tableId || !groupKey) {
    return timedJson({ error: "invalid-table-target" }, { status: 400, metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "creator-trend-script-table-regenerate" }] });
  }

  const creator = session.role === UserRole.CREATOR ? await prisma.creatorProfile.findUnique({ where: { userId: session.userId }, select: { id: true } }) : null;
  if (session.role === UserRole.CREATOR && !creator) {
    return timedJson({ error: "missing-creator" }, { status: 403, metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "creator-trend-script-table-regenerate" }] });
  }

  const [settings, record] = await Promise.all([
    prisma.platformSettings.upsert({ where: { id: "platform" }, update: {}, create: { id: "platform" } }),
    prisma.creatorTrendScriptGeneration.findFirst({
      where: {
        id: scriptGenerationId,
        ...(creator ? { creatorId: creator.id } : {}),
      },
    }),
  ]);

  if (!record) {
    return timedJson({ error: "script-not-found" }, { status: 404, metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "creator-trend-script-table-regenerate" }] });
  }

  try {
    const regenerated = await regenerateTrendScriptTable(settings, sourceInputFromRecord(record, userInstruction), {
      groupKey,
      tableId,
      userInstruction,
    });
    const field = tableFieldForGroup(groupKey);
    const graphicTables = groupKey === "graphicTables" ? replaceTable(record.graphicTablesJson, tableId, regenerated.table) : normalizeScriptTables(record.graphicTablesJson);
    const videoTables = groupKey === "videoTables" ? replaceTable(record.videoTablesJson, tableId, regenerated.table) : normalizeScriptTables(record.videoTablesJson);
    const caseAnalysisTables = groupKey === "caseAnalysisTables" ? replaceTable(record.caseAnalysisTablesJson, tableId, regenerated.table) : normalizeScriptTables(record.caseAnalysisTablesJson);
    const aiDebug = {
      ...(record.aiDebugJson && typeof record.aiDebugJson === "object" && !Array.isArray(record.aiDebugJson) ? record.aiDebugJson : {}),
      tableRegenerations: {
        ...((record.aiDebugJson as { tableRegenerations?: Record<string, unknown> } | null)?.tableRegenerations ?? {}),
        [`${groupKey}:${tableId}`]: {
          regeneratedAt: new Date().toISOString(),
          tableTitle: regenerated.table.title,
          debug: regenerated.debug,
        },
      },
    };

    const updated = await prisma.creatorTrendScriptGeneration.update({
      where: { id: record.id },
      data: {
        status: "READY",
        generationMode: "AI",
        model: regenerated.model,
        userInstruction: userInstruction || record.userInstruction,
        [field]: jsonInput(groupKey === "graphicTables" ? graphicTables : groupKey === "videoTables" ? videoTables : caseAnalysisTables),
        plainText: tablesToPlainText([
          { title: "案例拆解", tables: caseAnalysisTables },
          { title: "图文脚本", tables: graphicTables },
          { title: "视频脚本", tables: videoTables },
        ]),
        aiDebugJson: jsonInput(aiDebug),
        generatedAt: new Date(),
      },
      include: {
        scriptImages: { orderBy: [{ pageOrder: "asc" }, { updatedAt: "desc" }] },
        scriptReviews: { orderBy: { updatedAt: "desc" }, take: 1 },
      },
    });

    return timedJson(
      { record: scriptGenerationToView(updated), table: regenerated.table },
      { metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "creator-trend-script-table-regenerate" }] },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "单表重新生成失败";
    return timedJson({ error: message }, { status: 500, metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "creator-trend-script-table-regenerate" }] });
  }
}
