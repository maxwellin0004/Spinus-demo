import {
  AuthorMatchStatus,
  CrawlerJobStatus,
  CrawlerJobType,
  CrawlerPlatform,
  CrawlerSnapshotStatus,
  CrawlerTargetType,
  Prisma,
} from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { categorizeCrawlerFailure, evaluateCrawlerDataConfidence, toJsonEvidence } from "@/lib/crawler-reliability";

export const crawlerLockTimeoutMs = 10 * 60 * 1000;

export function verifyCrawlerToken(request: Request) {
  const expected = process.env.CRAWLER_INTERNAL_TOKEN;
  const received = request.headers.get("x-internal-token");

  return Boolean(expected && received && received === expected);
}

export function crawlerJson(body: unknown, status = 200) {
  return Response.json(body, { status });
}

export function toCrawlerPlatform(platform: string) {
  if (platform === "小红书" || platform.toLowerCase() === "xiaohongshu" || platform.toLowerCase() === "xhs") {
    return CrawlerPlatform.XIAOHONGSHU;
  }

  if (platform === "抖音" || platform.toLowerCase() === "douyin") {
    return CrawlerPlatform.DOUYIN;
  }

  return null;
}

const nullableIntSchema = z.number().int().nonnegative().nullable().optional();
const nullableStringSchema = z.string().trim().min(1).nullable().optional();
const nullableDateSchema = z.string().datetime().nullable().optional();

const crawlerResultSchema = z.object({
  workerId: z.string().trim().min(1),
  status: z.enum(["SUCCESS", "FAILED"]),
  errorCode: z.string().trim().min(1).optional(),
  errorMessage: z.string().trim().min(1).optional(),
  snapshot: z
    .object({
      displayName: nullableStringSchema,
      profileUrl: nullableStringSchema,
      platformUserId: nullableStringSchema,
      followerCount: nullableIntSchema,
      followingCount: nullableIntSchema,
      likeCount: nullableIntSchema,
      postCount: nullableIntSchema,
      viewCount: nullableIntSchema,
      favoriteCount: nullableIntSchema,
      commentCount: nullableIntSchema,
      shareCount: nullableIntSchema,
      title: nullableStringSchema,
      authorName: nullableStringSchema,
      authorPlatformUserId: nullableStringSchema,
      publishedAt: nullableDateSchema,
      canonicalUrl: nullableStringSchema,
      platformPostId: nullableStringSchema,
      authorMatchStatus: z.enum(["MATCHED", "MISMATCHED", "UNKNOWN"]).optional(),
      failureReason: nullableStringSchema,
      fetchedAt: z.string().datetime().optional(),
      rawProvider: nullableStringSchema,
      rawItemId: nullableStringSchema,
      rawUserId: nullableStringSchema,
      rawCanonicalUrl: nullableStringSchema,
      rawMetricText: nullableStringSchema,
      rawEvidence: z.unknown().optional(),
      parserVersion: nullableStringSchema,
    })
    .default({}),
});

export type CrawlerResultInput = z.infer<typeof crawlerResultSchema>;

export function parseCrawlerResult(input: unknown) {
  return crawlerResultSchema.safeParse(input);
}

export async function claimNextCrawlerJob(workerId: string) {
  const staleBefore = new Date(Date.now() - crawlerLockTimeoutMs);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const job = await prisma.crawlerJob.findFirst({
      where: {
        OR: [
          { status: CrawlerJobStatus.PENDING },
          {
            status: CrawlerJobStatus.PROCESSING,
            lockedAt: { lt: staleBefore },
          },
        ],
      },
      orderBy: [{ createdAt: "asc" }],
    });

    if (!job) return null;

    const claimed = await prisma.crawlerJob.updateMany({
      where: {
        id: job.id,
        OR: [
          { status: CrawlerJobStatus.PENDING },
          {
            status: CrawlerJobStatus.PROCESSING,
            lockedAt: { lt: staleBefore },
          },
        ],
      },
      data: {
        status: CrawlerJobStatus.PROCESSING,
        lockedAt: new Date(),
        lockedBy: workerId,
        attempts: { increment: 1 },
        lastAttemptAt: new Date(),
      },
    });

    if (claimed.count === 1) {
      return prisma.crawlerJob.findUniqueOrThrow({
        where: { id: job.id },
      });
    }
  }

  return null;
}

function dateOrNow(value?: string | null) {
  return value ? new Date(value) : new Date();
}

function cleanNullableString(value?: string | null) {
  return value?.trim() || null;
}

function snapshotStatus(resultStatus: CrawlerResultInput["status"]) {
  return resultStatus === "SUCCESS" ? CrawlerSnapshotStatus.SUCCESS : CrawlerSnapshotStatus.FAILED;
}

function failureReason(result: CrawlerResultInput) {
  return cleanNullableString(result.snapshot.failureReason) ?? result.errorMessage ?? result.errorCode ?? "抓取失败";
}

async function resolveAuthorMatchStatus(jobId: string, result: CrawlerResultInput) {
  const explicit = result.snapshot.authorMatchStatus;
  if (explicit) return explicit as AuthorMatchStatus;

  const authorPlatformUserId = cleanNullableString(result.snapshot.authorPlatformUserId);
  const authorName = cleanNullableString(result.snapshot.authorName);

  if (!authorPlatformUserId && !authorName) return AuthorMatchStatus.UNKNOWN;

  const job = await prisma.crawlerJob.findUnique({
    where: { id: jobId },
    include: {
      proof: {
        include: {
          submission: {
            include: {
              application: {
                include: { selectedSocialAccount: true },
              },
            },
          },
        },
      },
    },
  });

  const account = job?.proof?.submission.application.selectedSocialAccount;
  if (!account) return AuthorMatchStatus.UNKNOWN;

  const accountName = account.accountName.trim().toLowerCase();
  const authorNameLower = authorName?.toLowerCase();
  const accountUrl = account.accountUrl.trim();

  if (authorPlatformUserId && accountUrl.includes(authorPlatformUserId)) return AuthorMatchStatus.MATCHED;
  if (authorNameLower && accountName === authorNameLower) return AuthorMatchStatus.MATCHED;

  return AuthorMatchStatus.MISMATCHED;
}

export async function completeCrawlerJob(jobId: string, result: CrawlerResultInput) {
  const existing = await prisma.crawlerJob.findUnique({ where: { id: jobId } });
  if (!existing) return { ok: false as const, status: 404, body: { error: "Job not found" } };
  if (existing.status !== CrawlerJobStatus.PROCESSING) return { ok: false as const, status: 409, body: { error: "Job is not processing" } };
  if (existing.lockedBy !== result.workerId) return { ok: false as const, status: 409, body: { error: "Job lock owner mismatch" } };

  const now = new Date();
  const failed = result.status === "FAILED";
  const finalFailed = failed && existing.attempts >= existing.maxAttempts;
  const nextStatus = failed && !finalFailed ? CrawlerJobStatus.PENDING : result.status === "SUCCESS" ? CrawlerJobStatus.SUCCESS : CrawlerJobStatus.FAILED;
  const completedAt = nextStatus === CrawlerJobStatus.PENDING ? null : now;
  const status = snapshotStatus(result.status);
  const fetchedAt = dateOrNow(result.snapshot.fetchedAt);
  const normalizedFailureReason = failed ? failureReason(result) : null;
  const failureCategory = failed ? categorizeCrawlerFailure(result.errorCode, normalizedFailureReason) : null;
  const authorMatchStatus =
    existing.targetType === CrawlerTargetType.PROOF ? await resolveAuthorMatchStatus(existing.id, result) : AuthorMatchStatus.UNKNOWN;
  const rawEvidence = toJsonEvidence(result.snapshot.rawEvidence);
  const socialDataConfidence = evaluateCrawlerDataConfidence({
    status,
    failureCategory,
    hasRawEvidence: Boolean(rawEvidence || result.snapshot.rawMetricText),
    hasCoreMetric: result.snapshot.followerCount != null || result.snapshot.likeCount != null || result.snapshot.postCount != null,
  });
  const postDataConfidence = evaluateCrawlerDataConfidence({
    status,
    failureCategory,
    hasRawEvidence: Boolean(rawEvidence || result.snapshot.rawMetricText),
    hasCoreMetric: result.snapshot.viewCount != null || result.snapshot.likeCount != null,
    authorMatched: authorMatchStatus === AuthorMatchStatus.UNKNOWN ? undefined : authorMatchStatus === AuthorMatchStatus.MATCHED,
  });
  const commonSnapshot = {
    crawlerJobId: existing.id,
    platform: existing.platform,
    status,
    failureReason: normalizedFailureReason,
    failureCategory,
    fetchedAt,
    rawProvider: cleanNullableString(result.snapshot.rawProvider),
    rawUserId: cleanNullableString(result.snapshot.rawUserId),
    rawCanonicalUrl: cleanNullableString(result.snapshot.rawCanonicalUrl),
    rawMetricText: cleanNullableString(result.snapshot.rawMetricText),
    rawEvidence,
    parserVersion: cleanNullableString(result.snapshot.parserVersion),
  };

  await prisma.$transaction(async (tx) => {
    if (existing.targetType === CrawlerTargetType.SOCIAL_ACCOUNT) {
      if (!existing.socialAccountId) throw new Error("Crawler job missing socialAccountId");

      await tx.socialAccountSnapshot.create({
        data: {
          ...commonSnapshot,
          dataConfidence: socialDataConfidence,
          socialAccountId: existing.socialAccountId,
          displayName: cleanNullableString(result.snapshot.displayName),
          profileUrl: cleanNullableString(result.snapshot.profileUrl),
          platformUserId: cleanNullableString(result.snapshot.platformUserId),
          followerCount: result.snapshot.followerCount ?? null,
          followingCount: result.snapshot.followingCount ?? null,
          likeCount: result.snapshot.likeCount ?? null,
          postCount: result.snapshot.postCount ?? null,
        },
      });
    }

    if (existing.targetType === CrawlerTargetType.PROOF) {
      if (!existing.proofId) throw new Error("Crawler job missing proofId");

      await tx.postMetricSnapshot.create({
        data: {
          ...commonSnapshot,
          dataConfidence: postDataConfidence,
          proofId: existing.proofId,
          viewCount: result.snapshot.viewCount ?? null,
          likeCount: result.snapshot.likeCount ?? null,
          favoriteCount: result.snapshot.favoriteCount ?? null,
          commentCount: result.snapshot.commentCount ?? null,
          shareCount: result.snapshot.shareCount ?? null,
          title: cleanNullableString(result.snapshot.title),
          authorName: cleanNullableString(result.snapshot.authorName),
          authorPlatformUserId: cleanNullableString(result.snapshot.authorPlatformUserId),
          publishedAt: result.snapshot.publishedAt ? new Date(result.snapshot.publishedAt) : null,
          canonicalUrl: cleanNullableString(result.snapshot.canonicalUrl),
          platformPostId: cleanNullableString(result.snapshot.platformPostId),
          authorMatchStatus,
          rawItemId: cleanNullableString(result.snapshot.rawItemId),
        },
      });
    }

    await tx.crawlerJob.update({
      where: { id: existing.id },
      data: {
        status: nextStatus,
        lockedAt: nextStatus === CrawlerJobStatus.PENDING ? null : existing.lockedAt,
        lockedBy: nextStatus === CrawlerJobStatus.PENDING ? null : existing.lockedBy,
        lastErrorCode: result.errorCode ?? null,
        lastErrorMessage: normalizedFailureReason,
        lastErrorCategory: failureCategory,
        completedAt,
      },
    });
  });

  return {
    ok: true as const,
    status: 200,
    body: {
      jobId: existing.id,
      status: nextStatus,
      retryScheduled: nextStatus === CrawlerJobStatus.PENDING,
    },
  };
}

export async function createCrawlerJob(data: {
  type: CrawlerJobType;
  platform: CrawlerPlatform;
  targetType: CrawlerTargetType;
  targetId: string;
  targetUrl: string;
  socialAccountId?: string | null;
  proofId?: string | null;
  createdByUserId?: string | null;
  maxAttempts?: number;
}) {
  const settings = await prisma.platformSettings.upsert({ where: { id: "platform" }, update: {}, create: { id: "platform" } });
  return prisma.crawlerJob.create({
    data: {
      type: data.type,
      platform: data.platform,
      targetType: data.targetType,
      targetId: data.targetId,
      targetUrl: data.targetUrl,
      socialAccountId: data.socialAccountId ?? null,
      proofId: data.proofId ?? null,
      createdByUserId: data.createdByUserId ?? null,
      maxAttempts: data.maxAttempts ?? settings.crawlerMaxAttempts,
    },
  });
}

export type CrawlerJobPayload = Prisma.CrawlerJobGetPayload<Record<string, never>>;
