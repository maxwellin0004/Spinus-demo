import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type SnapshotInput = {
  platform: string;
  keyword: string;
  source?: string;
  keywordType?: string;
  date?: Date;
};

function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date = new Date()) {
  const end = startOfDay(date);
  end.setDate(end.getDate() + 1);
  return end;
}

function jsonInput(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
}

function normalizeHeat(contentCount: number, interactionCount: number, viewCount: number) {
  const engagementScore = Math.log10(interactionCount + 1) * 18;
  const contentScore = Math.log10(contentCount + 1) * 24;
  const viewScore = Math.log10(viewCount + 1) * 8;
  return Math.min(100, Math.round((engagementScore + contentScore + viewScore) * 10) / 10);
}

export async function upsertKeywordTrendSnapshot(input: SnapshotInput) {
  const source = input.source ?? "tikhub";
  const date = startOfDay(input.date);
  const nextDate = endOfDay(date);

  const contents = await prisma.insightContent.findMany({
    where: {
      platform: input.platform,
      keyword: input.keyword,
      updatedAt: { gte: date, lt: nextDate },
    },
    select: {
      likeCount: true,
      commentCount: true,
      shareCount: true,
      collectCount: true,
      viewCount: true,
      heatScore: true,
    },
  });

  const totals = contents.reduce(
    (acc, item) => {
      acc.likeCount += item.likeCount;
      acc.commentCount += item.commentCount;
      acc.shareCount += item.shareCount;
      acc.collectCount += item.collectCount;
      acc.viewCount += item.viewCount;
      acc.heatScore += item.heatScore;
      return acc;
    },
    { likeCount: 0, commentCount: 0, shareCount: 0, collectCount: 0, viewCount: 0, heatScore: 0 },
  );
  const contentCount = contents.length;
  const interactionCount = totals.likeCount + totals.commentCount + totals.shareCount + totals.collectCount;
  const heatScore = contentCount > 0 ? normalizeHeat(contentCount, interactionCount, totals.viewCount) : 0;

  return prisma.insightTrendSnapshot.upsert({
    where: {
      source_platform_keyword_date: {
        source,
        platform: input.platform,
        keyword: input.keyword,
        date,
      },
    },
    update: {
      keywordType: input.keywordType,
      contentCount,
      interactionCount,
      likeCount: totals.likeCount,
      commentCount: totals.commentCount,
      shareCount: totals.shareCount,
      collectCount: totals.collectCount,
      viewCount: totals.viewCount,
      heatScore,
      rawPayload: jsonInput({ averageContentHeatScore: contentCount > 0 ? totals.heatScore / contentCount : 0 }),
    },
    create: {
      source,
      platform: input.platform,
      keyword: input.keyword,
      keywordType: input.keywordType,
      date,
      contentCount,
      interactionCount,
      likeCount: totals.likeCount,
      commentCount: totals.commentCount,
      shareCount: totals.shareCount,
      collectCount: totals.collectCount,
      viewCount: totals.viewCount,
      heatScore,
      rawPayload: jsonInput({ averageContentHeatScore: contentCount > 0 ? totals.heatScore / contentCount : 0 }),
    },
  });
}

export async function rebuildTrendSnapshotsFromContents() {
  const groups = await prisma.insightContent.groupBy({
    by: ["platform", "keyword"],
    where: { keyword: { not: null } },
    _count: { _all: true },
  });

  const results = [];
  for (const group of groups) {
    if (!group.keyword) continue;
    results.push(await upsertKeywordTrendSnapshot({ platform: group.platform, keyword: group.keyword }));
  }
  return { resultCount: results.length };
}
