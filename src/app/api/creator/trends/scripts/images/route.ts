import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { timedJson, withRouteTimer } from "@/lib/http-timing";
import { extractScriptImagePrompts, generateScriptImages, listScriptImages } from "@/lib/insights/script-images";
import { prisma } from "@/lib/prisma";

type ImagesBody = {
  scriptGenerationId?: unknown;
  pageKey?: unknown;
  force?: unknown;
};

function cleanText(value: unknown, limit: number) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

async function requireCreatorId() {
  const session = await requireRole(UserRole.CREATOR);
  const creator = await prisma.creatorProfile.findUnique({ where: { userId: session.userId }, select: { id: true } });
  return creator?.id ?? null;
}

async function loadOwnedScript(scriptGenerationId: string, creatorId: string) {
  return prisma.creatorTrendScriptGeneration.findFirst({
    where: { id: scriptGenerationId, creatorId },
    select: {
      id: true,
      sourceTitle: true,
      graphicTablesJson: true,
    },
  });
}

export async function GET(request: Request) {
  const timer = withRouteTimer();
  const creatorId = await requireCreatorId();
  if (!creatorId) {
    return timedJson({ error: "missing-creator" }, { status: 403, metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "creator-trend-script-images-get" }] });
  }

  const url = new URL(request.url);
  const scriptGenerationId = cleanText(url.searchParams.get("scriptGenerationId"), 100);
  if (!scriptGenerationId) {
    return timedJson({ error: "invalid-script" }, { status: 400, metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "creator-trend-script-images-get" }] });
  }

  const script = await loadOwnedScript(scriptGenerationId, creatorId);
  if (!script) {
    return timedJson({ error: "not-found" }, { status: 404, metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "creator-trend-script-images-get" }] });
  }

  const [images] = await Promise.all([listScriptImages(script.id)]);
  return timedJson(
    { prompts: extractScriptImagePrompts(script), images },
    { metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "creator-trend-script-images-get" }] },
  );
}

export async function POST(request: Request) {
  const timer = withRouteTimer();
  const creatorId = await requireCreatorId();
  if (!creatorId) {
    return timedJson({ error: "missing-creator" }, { status: 403, metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "creator-trend-script-images-post" }] });
  }

  const body = (await request.json().catch(() => ({}))) as ImagesBody;
  const scriptGenerationId = cleanText(body.scriptGenerationId, 100);
  const pageKey = cleanText(body.pageKey, 80) || null;
  if (!scriptGenerationId) {
    return timedJson({ error: "invalid-script" }, { status: 400, metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "creator-trend-script-images-post" }] });
  }

  const script = await loadOwnedScript(scriptGenerationId, creatorId);
  if (!script) {
    return timedJson({ error: "not-found" }, { status: 404, metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "creator-trend-script-images-post" }] });
  }

  const settings = await prisma.platformSettings.upsert({
    where: { id: "platform" },
    update: {},
    create: { id: "platform" },
    select: {
      insightAiEnabled: true,
      insightAiBaseUrl: true,
      insightAiApiKey: true,
      insightImageAiBaseUrl: true,
      insightImageAiApiKey: true,
      insightImageAiModel: true,
    },
  });

  const result = await generateScriptImages(settings, script, { pageKey, force: body.force === true || Boolean(pageKey) });
  const images = await listScriptImages(script.id);

  return timedJson(
    { ...result, images },
    { metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "creator-trend-script-images-post" }] },
  );
}
