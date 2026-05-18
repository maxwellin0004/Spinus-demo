import { Prisma, UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { timedJson, withRouteTimer } from "@/lib/http-timing";
import { generateTrendScriptTables, scriptGenerationToView, type ScriptCaseContext, type ScriptTopicContext } from "@/lib/insights/trend-script-generation";
import type { ScriptSourceType } from "@/lib/insights/script-tables";
import { prisma } from "@/lib/prisma";

type GenerateBody = {
  sourceType?: string;
  sourceKey?: string;
  sourceTitle?: string;
  platform?: string | null;
  platformLabel?: string;
  directionLabel?: string;
  topic?: ScriptTopicContext | null;
  caseStudy?: ScriptCaseContext | null;
  userInstruction?: string | null;
};

function jsonInput(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

function normalizeSourceType(value: unknown): ScriptSourceType {
  return value === "CASE_STUDY" ? "CASE_STUDY" : "TOPIC_RECOMMENDATION";
}

function cleanText(value: unknown, limit: number) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

async function requireCreator() {
  const session = await requireRole(UserRole.CREATOR);
  return prisma.creatorProfile.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });
}

export async function POST(request: Request) {
  const timer = withRouteTimer();
  const creator = await requireCreator();
  if (!creator) {
    return timedJson({ error: "missing-creator" }, { status: 403, metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "creator-trend-script-generate" }] });
  }

  const body = (await request.json().catch(() => ({}))) as GenerateBody;
  const sourceType = normalizeSourceType(body.sourceType);
  const sourceKey = cleanText(body.sourceKey, 300);
  const sourceTitle = cleanText(body.sourceTitle, 240);
  const platform = cleanText(body.platform, 80) || null;
  const userInstruction = cleanText(body.userInstruction, 800) || null;

  if (!sourceKey || !sourceTitle) {
    return timedJson({ error: "invalid-source" }, { status: 400, metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "creator-trend-script-generate" }] });
  }

  const [settings, savedTrend] = await Promise.all([
    prisma.platformSettings.upsert({ where: { id: "platform" }, update: {}, create: { id: "platform" } }),
    prisma.creatorSavedTrend.findFirst({
      where: {
        creatorId: creator.id,
        title: sourceTitle,
        platform: platform ?? "",
      },
      select: { id: true },
    }),
  ]);

  const sourcePayload = {
    sourceType,
    sourceKey,
    sourceTitle,
    platform,
    platformLabel: cleanText(body.platformLabel, 80) || platform || "全部平台",
    directionLabel: cleanText(body.directionLabel, 80) || "内容方向",
    topic: body.topic ?? null,
    caseStudy: body.caseStudy ?? null,
    userInstruction,
  };

  try {
    await prisma.creatorTrendScriptGeneration.upsert({
      where: {
        creatorId_sourceType_sourceKey: {
          creatorId: creator.id,
          sourceType,
          sourceKey,
        },
      },
      update: {
        savedTrendId: savedTrend?.id ?? null,
        sourceTitle,
        platform,
        status: "GENERATING",
        generationMode: "FALLBACK",
        model: settings.insightAiModel,
        userInstruction,
        sourcePayload: jsonInput(sourcePayload),
        errorMessage: null,
      },
      create: {
        creatorId: creator.id,
        savedTrendId: savedTrend?.id ?? null,
        sourceType,
        sourceKey,
        sourceTitle,
        platform,
        status: "GENERATING",
        generationMode: "FALLBACK",
        model: settings.insightAiModel,
        userInstruction,
        sourcePayload: jsonInput(sourcePayload),
      },
    });

    const generated = await generateTrendScriptTables(settings, {
      sourceType,
      sourceTitle,
      platformLabel: sourcePayload.platformLabel,
      directionLabel: sourcePayload.directionLabel,
      topic: body.topic ?? null,
      caseStudy: body.caseStudy ?? null,
      userInstruction,
    });

    const record = await prisma.creatorTrendScriptGeneration.update({
      where: {
        creatorId_sourceType_sourceKey: {
          creatorId: creator.id,
          sourceType,
          sourceKey,
        },
      },
      data: {
        status: "READY",
        generationMode: generated.generationMode,
        model: generated.model,
        userInstruction,
        graphicTablesJson: jsonInput(generated.graphicTables),
        videoTablesJson: jsonInput(generated.videoTables),
        caseAnalysisTablesJson: jsonInput(generated.caseAnalysisTables),
        plainText: generated.plainText,
        errorMessage: generated.errorMessage,
        aiDebugJson: jsonInput(generated.aiDebug),
        generatedAt: new Date(),
      },
    });

    return timedJson(
      { record: scriptGenerationToView(record) },
      { metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "creator-trend-script-generate" }] },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 240) : "脚本生成失败";
    try {
      const record = await prisma.creatorTrendScriptGeneration.update({
        where: {
          creatorId_sourceType_sourceKey: {
            creatorId: creator.id,
            sourceType,
            sourceKey,
          },
        },
        data: {
          status: "FAILED",
          generationMode: "FALLBACK",
          errorMessage: message,
          aiDebugJson: jsonInput({ exception: message }),
        },
      });

      return timedJson(
        { record: scriptGenerationToView(record), error: message },
        { status: 500, metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "creator-trend-script-generate" }] },
      );
    } catch {
      return timedJson(
        { error: message },
        { status: 500, metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "creator-trend-script-generate" }] },
      );
    }
  }
}
