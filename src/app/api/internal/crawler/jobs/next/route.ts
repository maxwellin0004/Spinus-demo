import { claimNextCrawlerJob, crawlerJson, verifyCrawlerToken } from "@/lib/crawler";

export async function GET(request: Request) {
  if (!verifyCrawlerToken(request)) {
    return crawlerJson({ error: "Unauthorized" }, 401);
  }

  const url = new URL(request.url);
  const workerId = url.searchParams.get("workerId")?.trim() || request.headers.get("x-worker-id")?.trim();

  if (!workerId) {
    return crawlerJson({ error: "workerId is required" }, 400);
  }

  const job = await claimNextCrawlerJob(workerId);
  if (!job) return crawlerJson({ job: null });

  return crawlerJson({
    job: {
      jobId: job.id,
      type: job.type,
      platform: job.platform,
      targetType: job.targetType,
      targetId: job.targetId,
      targetUrl: job.targetUrl,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      createdAt: job.createdAt.toISOString(),
    },
  });
}
