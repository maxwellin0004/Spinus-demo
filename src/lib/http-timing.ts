type TimingMetric = {
  name: string;
  durMs: number;
  desc?: string;
};

type TimedJsonOptions = {
  status?: number;
  headers?: HeadersInit;
  metrics?: TimingMetric[];
};

type RoutePerfBucket = {
  count: number;
  totalMs: number;
  maxMs: number;
  lastMs: number;
  errorCount: number;
  samples: number[];
  updatedAt: number;
};

export type RoutePerfRow = {
  route: string;
  count: number;
  avgMs: number;
  p50Ms: number;
  p95Ms: number;
  maxMs: number;
  lastMs: number;
  errorCount: number;
  updatedAt: string;
};

export type RoutePerfSnapshot = {
  startedAt: string;
  totalRoutes: number;
  rows: RoutePerfRow[];
};

const ROUTE_PERF = new Map<string, RoutePerfBucket>();
const ROUTE_PERF_STARTED_AT = new Date();
const ROUTE_PERF_SAMPLE_LIMIT = 240;

function percentile(values: number[], ratio: number) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.max(0, Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1));
  return sorted[index];
}

function routeKey(metric: TimingMetric) {
  return metric.desc?.trim() || metric.name;
}

function recordRouteTiming(metric: TimingMetric, status: number) {
  const key = routeKey(metric);
  const bucket = ROUTE_PERF.get(key) ?? {
    count: 0,
    totalMs: 0,
    maxMs: 0,
    lastMs: 0,
    errorCount: 0,
    samples: [],
    updatedAt: Date.now(),
  };

  bucket.count += 1;
  bucket.totalMs += metric.durMs;
  bucket.maxMs = Math.max(bucket.maxMs, metric.durMs);
  bucket.lastMs = metric.durMs;
  if (status >= 500) bucket.errorCount += 1;
  bucket.samples.push(metric.durMs);
  if (bucket.samples.length > ROUTE_PERF_SAMPLE_LIMIT) {
    bucket.samples.shift();
  }
  bucket.updatedAt = Date.now();
  ROUTE_PERF.set(key, bucket);
}

export function withRouteTimer() {
  const startedAt = Date.now();
  return {
    elapsedMs() {
      return Math.max(0, Date.now() - startedAt);
    },
  };
}

export function getRoutePerfSnapshot(limit = 40): RoutePerfSnapshot {
  const rows = Array.from(ROUTE_PERF.entries())
    .map<RoutePerfRow>(([route, bucket]) => ({
      route,
      count: bucket.count,
      avgMs: Math.round(bucket.totalMs / Math.max(1, bucket.count)),
      p50Ms: percentile(bucket.samples, 0.5),
      p95Ms: percentile(bucket.samples, 0.95),
      maxMs: bucket.maxMs,
      lastMs: bucket.lastMs,
      errorCount: bucket.errorCount,
      updatedAt: new Date(bucket.updatedAt).toISOString(),
    }))
    .sort((left, right) => {
      if (right.p95Ms !== left.p95Ms) return right.p95Ms - left.p95Ms;
      return right.avgMs - left.avgMs;
    })
    .slice(0, Math.max(1, Math.min(limit, 200)));

  return {
    startedAt: ROUTE_PERF_STARTED_AT.toISOString(),
    totalRoutes: ROUTE_PERF.size,
    rows,
  };
}

export function resetRoutePerfStats() {
  ROUTE_PERF.clear();
}

export function timedJson<T>(payload: T, options?: TimedJsonOptions) {
  const status = options?.status ?? 200;
  const headers = new Headers(options?.headers);
  const metrics = options?.metrics ?? [];
  if (metrics.length > 0) {
    headers.set(
      "Server-Timing",
      metrics
        .map((metric) => {
          const base = `${metric.name};dur=${metric.durMs}`;
          return metric.desc ? `${base};desc="${metric.desc.replaceAll('"', "'")}"` : base;
        })
        .join(", "),
    );
    headers.set("X-Route-Duration-Ms", String(Math.round(metrics.reduce((sum, metric) => sum + metric.durMs, 0))));
    for (const metric of metrics) {
      recordRouteTiming(metric, status);
    }
  }
  return Response.json(payload, { status, headers });
}
