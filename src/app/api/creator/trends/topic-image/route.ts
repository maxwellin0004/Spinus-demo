import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { timedJson, withRouteTimer } from "@/lib/http-timing";
import { generateTopicCoverImage } from "@/lib/insights/topic-cover-images";
import { prisma } from "@/lib/prisma";

type TopicImageBody = {
  sourceContentId?: unknown;
  sourceTitle?: unknown;
  platform?: unknown;
  prompt?: unknown;
  negativePrompt?: unknown;
  fallbackImageUrl?: unknown;
};

function text(value: unknown, limit: number) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

export async function POST(request: Request) {
  const timer = withRouteTimer();
  await requireRole(UserRole.CREATOR);
  const body = (await request.json().catch(() => ({}))) as TopicImageBody;
  const sourceTitle = text(body.sourceTitle, 240);
  const prompt = text(body.prompt, 3000);
  if (!sourceTitle || !prompt) {
    return timedJson(
      { imageUrl: text(body.fallbackImageUrl, 1000) || null, generated: false, cached: false, error: "invalid-topic-image-input" },
      { status: 400, metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "creator-trend-topic-image" }] },
    );
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

  const result = await generateTopicCoverImage(settings, {
    sourceContentId: text(body.sourceContentId, 300) || null,
    sourceTitle,
    platform: text(body.platform, 80) || null,
    prompt,
    negativePrompt: text(body.negativePrompt, 2000) || null,
    fallbackImageUrl: text(body.fallbackImageUrl, 1000) || null,
  });

  return timedJson(result, {
    metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "creator-trend-topic-image" }],
  });
}
