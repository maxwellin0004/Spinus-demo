import { getBrandInsightAnalysis, getCreatorInsightAnalysis } from "@/lib/insights/analysis-queries";
import { invalidateInsightCache } from "@/lib/insights/cache";
import { getCreatorTrendDetailData } from "@/lib/insights/creator-trend-detail";
import { DEFAULT_INSIGHT_DIRECTION, INSIGHT_DIRECTION_SLUGS, isInsightDirectionSlug } from "@/lib/insights/directions";
import {
  getBrandCompetitors,
  getBrandInsightsOverview,
  getCreatorTopTopics,
  getCreatorTrendSeries,
  getCreatorTrendsOverview,
  getKeywordTrendSeries,
} from "@/lib/insights/queries";

const READ_CACHE_NAMESPACES = ["insights-queries", "insights-analysis", "creator-trend-detail"] as const;
const PREWARM_CONCURRENCY = 3;
const PREWARM_JOB_HISTORY_MAX = 30;

type InvalidateResult = {
  namespace: string;
  localRemoved: number;
  redisRemoved: number;
};

type PrewarmTask = {
  name: string;
  run: () => Promise<void>;
};

type PrewarmOptions = {
  directions?: string[];
  platforms?: string[];
  maxDirections?: number;
};

type PrewarmJobStatus = "RUNNING" | "SUCCESS" | "FAILED";

type InsightPrewarmJob = {
  id: string;
  status: PrewarmJobStatus;
  startedAt: string;
  finishedAt: string | null;
  options: Required<Pick<PrewarmInsightReadCachesResult, "directions" | "platforms">>;
  summary: Pick<PrewarmInsightReadCachesResult, "attempted" | "succeeded" | "failed">;
  failures: string[];
};

export type InvalidateInsightReadCachesResult = {
  totalLocalRemoved: number;
  totalRedisRemoved: number;
  results: InvalidateResult[];
};

export type PrewarmInsightReadCachesResult = {
  attempted: number;
  succeeded: number;
  failed: number;
  directions: string[];
  platforms: string[];
  failures: string[];
};

const INSIGHT_PREWARM_JOBS: InsightPrewarmJob[] = [];

function newJobId() {
  return `prewarm-${Date.now()}-${Math.floor(Math.random() * 1_000_000).toString(16)}`;
}

function upsertPrewarmJob(job: InsightPrewarmJob) {
  const index = INSIGHT_PREWARM_JOBS.findIndex((item) => item.id === job.id);
  if (index >= 0) {
    INSIGHT_PREWARM_JOBS[index] = job;
  } else {
    INSIGHT_PREWARM_JOBS.unshift(job);
  }
  if (INSIGHT_PREWARM_JOBS.length > PREWARM_JOB_HISTORY_MAX) {
    INSIGHT_PREWARM_JOBS.splice(PREWARM_JOB_HISTORY_MAX);
  }
}

function normalizeDirections(input?: string[], maxDirections = 2) {
  const unique = Array.from(new Set((input ?? []).filter((item) => isInsightDirectionSlug(item))));
  if (unique.length > 0) {
    return unique.slice(0, Math.max(1, maxDirections));
  }
  return [DEFAULT_INSIGHT_DIRECTION, ...INSIGHT_DIRECTION_SLUGS.filter((item) => item !== DEFAULT_INSIGHT_DIRECTION)].slice(
    0,
    Math.max(1, maxDirections),
  );
}

function normalizePlatforms(input?: string[]) {
  const allowed = new Set(["all", "xiaohongshu", "douyin", "weibo", "bilibili"]);
  const unique = Array.from(new Set((input ?? []).filter((item) => allowed.has(item))));
  return unique.length > 0 ? unique : ["all"];
}

function buildPrewarmTasks(directions: string[], platforms: string[]) {
  const tasks: PrewarmTask[] = [];

  for (const direction of directions) {
    tasks.push({
      name: `creator:${direction}:core`,
      run: async () => {
        await getCreatorTrendsOverview(direction);
        await getCreatorTrendSeries(7, direction);
        await getCreatorTopTopics(direction);
        await getCreatorInsightAnalysis(direction);
        await getCreatorTrendDetailData({ direction, platform: "all", keyword: "" });
      },
    });

    for (const platform of platforms) {
      tasks.push({
        name: `brand:${direction}:${platform}`,
        run: async () => {
          await getBrandInsightsOverview({ directionSlug: direction, platform, days: 30 });
          await getKeywordTrendSeries(30, direction, { platform });
          await getBrandCompetitors({ directionSlug: direction, platform, days: 30 });
          await getBrandInsightAnalysis({ directionSlug: direction, platform, days: 30 });
        },
      });
    }
  }
  return tasks;
}

async function runPrewarmTasks(tasks: PrewarmTask[], concurrency = PREWARM_CONCURRENCY) {
  if (tasks.length === 0) {
    return { succeeded: 0, failures: [] as string[] };
  }

  const failures: string[] = [];
  let cursor = 0;
  let succeeded = 0;

  const workers = Array.from({ length: Math.max(1, Math.min(concurrency, tasks.length)) }, async () => {
    while (cursor < tasks.length) {
      const taskIndex = cursor;
      cursor += 1;
      const task = tasks[taskIndex];
      try {
        await task.run();
        succeeded += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push(`${task.name}: ${message}`);
      }
    }
  });

  await Promise.all(workers);
  return { succeeded, failures };
}

export async function invalidateInsightReadCaches(): Promise<InvalidateInsightReadCachesResult> {
  const results = await Promise.all(
    READ_CACHE_NAMESPACES.map(async (namespace) => {
      const result = await invalidateInsightCache({ namespace });
      return { namespace, ...result };
    }),
  );

  return {
    totalLocalRemoved: results.reduce((sum, item) => sum + item.localRemoved, 0),
    totalRedisRemoved: results.reduce((sum, item) => sum + item.redisRemoved, 0),
    results,
  };
}

export async function prewarmInsightReadCaches(options: PrewarmOptions = {}): Promise<PrewarmInsightReadCachesResult> {
  const directions = normalizeDirections(options.directions, options.maxDirections ?? 2);
  const platforms = normalizePlatforms(options.platforms);
  const tasks = buildPrewarmTasks(directions, platforms);
  const { succeeded, failures } = await runPrewarmTasks(tasks);

  return {
    attempted: tasks.length,
    succeeded,
    failed: failures.length,
    directions,
    platforms,
    failures: failures.slice(0, 20),
  };
}

export function scheduleInsightPrewarm(options: PrewarmOptions = {}) {
  const directions = normalizeDirections(options.directions, options.maxDirections ?? 2);
  const platforms = normalizePlatforms(options.platforms);
  const id = newJobId();
  const startedAt = new Date().toISOString();

  upsertPrewarmJob({
    id,
    status: "RUNNING",
    startedAt,
    finishedAt: null,
    options: { directions, platforms },
    summary: { attempted: 0, succeeded: 0, failed: 0 },
    failures: [],
  });

  void prewarmInsightReadCaches({
    directions,
    platforms,
    maxDirections: directions.length,
  })
    .then((result) => {
      upsertPrewarmJob({
        id,
        status: result.failed > 0 ? "FAILED" : "SUCCESS",
        startedAt,
        finishedAt: new Date().toISOString(),
        options: { directions: result.directions, platforms: result.platforms },
        summary: { attempted: result.attempted, succeeded: result.succeeded, failed: result.failed },
        failures: result.failures,
      });
    })
    .catch((error) => {
      upsertPrewarmJob({
        id,
        status: "FAILED",
        startedAt,
        finishedAt: new Date().toISOString(),
        options: { directions, platforms },
        summary: { attempted: 0, succeeded: 0, failed: 1 },
        failures: [error instanceof Error ? error.message : String(error)],
      });
    });

  return { id, startedAt, directions, platforms };
}

export function getInsightPrewarmJobs(limit = 20) {
  return INSIGHT_PREWARM_JOBS.slice(0, Math.max(1, Math.min(limit, PREWARM_JOB_HISTORY_MAX)));
}
