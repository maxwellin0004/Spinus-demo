import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { timedJson, withRouteTimer } from "@/lib/http-timing";
import { scriptGenerationToView } from "@/lib/insights/trend-script-generation";
import { prisma } from "@/lib/prisma";

type LookupSource = {
  sourceType?: string;
  sourceKey?: string;
};

async function requireCreatorId() {
  const session = await requireRole(UserRole.CREATOR);
  const creator = await prisma.creatorProfile.findUnique({ where: { userId: session.userId }, select: { id: true } });
  if (!creator) return null;
  return creator.id;
}

export async function POST(request: Request) {
  const timer = withRouteTimer();
  const creatorId = await requireCreatorId();
  if (!creatorId) return timedJson({ records: [] }, { status: 403, metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "creator-trend-scripts-lookup" }] });

  const body = (await request.json().catch(() => ({}))) as { sources?: LookupSource[] };
  const sources = (body.sources ?? [])
    .map((source) => ({
      sourceType: source.sourceType === "CASE_STUDY" ? "CASE_STUDY" : "TOPIC_RECOMMENDATION",
      sourceKey: source.sourceKey?.trim() ?? "",
    }))
    .filter((source) => source.sourceKey);

  if (sources.length === 0) {
    return timedJson({ records: [] }, { metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "creator-trend-scripts-lookup" }] });
  }

  const records = await prisma.creatorTrendScriptGeneration.findMany({
    where: {
      creatorId,
      OR: sources.map((source) => ({
        sourceType: source.sourceType,
        sourceKey: source.sourceKey,
      })),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      scriptImages: { orderBy: [{ pageOrder: "asc" }, { updatedAt: "desc" }] },
      scriptReviews: { orderBy: { updatedAt: "desc" }, take: 1 },
    },
  });

  return timedJson(
    { records: records.map(scriptGenerationToView) },
    { metrics: [{ name: "app", durMs: timer.elapsedMs(), desc: "creator-trend-scripts-lookup" }] },
  );
}
