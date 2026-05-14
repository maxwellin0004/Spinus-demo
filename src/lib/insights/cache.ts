import { AsyncLocalStorage } from "node:async_hooks";
import { Redis } from "ioredis";

type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

type SharedCacheOptions<T> = {
  namespace: string;
  key: string;
  ttlMs: number;
  maxEntries: number;
  loader: () => Promise<T>;
};

type CacheEvent =
  | "local_hit"
  | "redis_hit"
  | "inflight_hit"
  | "miss"
  | "load_success"
  | "load_error"
  | "redis_error"
  | "write_local"
  | "write_redis"
  | "invalidated";

export type InsightCacheCounters = {
  localHits: number;
  redisHits: number;
  inflightHits: number;
  misses: number;
  loadSuccesses: number;
  loadErrors: number;
  redisErrors: number;
  writeLocal: number;
  writeRedis: number;
  invalidations: number;
};

export type InsightCacheTrace = {
  status: "HIT" | "MISS" | "BYPASS";
  elapsedMs: number;
  totals: InsightCacheCounters;
  namespaces: Record<string, InsightCacheCounters>;
};

type CacheTraceStore = {
  startedAt: number;
  namespaces: Map<string, InsightCacheCounters>;
};

type CacheStatsSnapshot = {
  startedAt: string;
  namespaces: Record<string, InsightCacheCounters>;
  totals: InsightCacheCounters;
};

const LOCAL_CACHE = new Map<string, CacheEntry>();
const LOCAL_INFLIGHT = new Map<string, Promise<unknown>>();
const GLOBAL_NAMESPACE_STATS = new Map<string, InsightCacheCounters>();
const GLOBAL_STATS_STARTED_AT = new Date();
const CACHE_TRACE_STORAGE = new AsyncLocalStorage<CacheTraceStore>();

const REDIS_PREFIX = process.env.INSIGHTS_REDIS_PREFIX?.trim() || "insights-cache:v1";
const REDIS_UNAVAILABLE_COOLDOWN_MS = 30_000;

let redisClient: Redis | null = null;
let redisUnavailableUntil = 0;

function toLocalKey(namespace: string, key: string) {
  return `${namespace}:${key}`;
}

function toRedisKey(localKey: string) {
  return `${REDIS_PREFIX}:${localKey}`;
}

function isRedisConfigured() {
  return Boolean(process.env.INSIGHTS_REDIS_URL);
}

function createCounters(): InsightCacheCounters {
  return {
    localHits: 0,
    redisHits: 0,
    inflightHits: 0,
    misses: 0,
    loadSuccesses: 0,
    loadErrors: 0,
    redisErrors: 0,
    writeLocal: 0,
    writeRedis: 0,
    invalidations: 0,
  };
}

function cloneCounters(counters: InsightCacheCounters): InsightCacheCounters {
  return { ...counters };
}

function sumCounters(items: Iterable<InsightCacheCounters>) {
  const totals = createCounters();
  for (const counters of items) {
    totals.localHits += counters.localHits;
    totals.redisHits += counters.redisHits;
    totals.inflightHits += counters.inflightHits;
    totals.misses += counters.misses;
    totals.loadSuccesses += counters.loadSuccesses;
    totals.loadErrors += counters.loadErrors;
    totals.redisErrors += counters.redisErrors;
    totals.writeLocal += counters.writeLocal;
    totals.writeRedis += counters.writeRedis;
    totals.invalidations += counters.invalidations;
  }
  return totals;
}

function getOrCreateNamespaceStats(target: Map<string, InsightCacheCounters>, namespace: string) {
  const existing = target.get(namespace);
  if (existing) return existing;
  const created = createCounters();
  target.set(namespace, created);
  return created;
}

function recordEvent(counters: InsightCacheCounters, event: CacheEvent) {
  if (event === "local_hit") counters.localHits += 1;
  else if (event === "redis_hit") counters.redisHits += 1;
  else if (event === "inflight_hit") counters.inflightHits += 1;
  else if (event === "miss") counters.misses += 1;
  else if (event === "load_success") counters.loadSuccesses += 1;
  else if (event === "load_error") counters.loadErrors += 1;
  else if (event === "redis_error") counters.redisErrors += 1;
  else if (event === "write_local") counters.writeLocal += 1;
  else if (event === "write_redis") counters.writeRedis += 1;
  else if (event === "invalidated") counters.invalidations += 1;
}

function recordCacheEvent(namespace: string, event: CacheEvent) {
  recordEvent(getOrCreateNamespaceStats(GLOBAL_NAMESPACE_STATS, namespace), event);
  const trace = CACHE_TRACE_STORAGE.getStore();
  if (!trace) return;
  recordEvent(getOrCreateNamespaceStats(trace.namespaces, namespace), event);
}

function summarizeTrace(store: CacheTraceStore): InsightCacheTrace {
  const namespaces: Record<string, InsightCacheCounters> = {};
  for (const [name, counters] of store.namespaces.entries()) {
    namespaces[name] = cloneCounters(counters);
  }
  const totals = sumCounters(store.namespaces.values());
  const touched = totals.localHits + totals.redisHits + totals.inflightHits + totals.misses;
  const status: InsightCacheTrace["status"] = totals.misses > 0 ? "MISS" : touched > 0 ? "HIT" : "BYPASS";
  return {
    status,
    elapsedMs: Math.max(0, Date.now() - store.startedAt),
    totals,
    namespaces,
  };
}

export async function withInsightCacheTrace<T>(loader: () => Promise<T>) {
  const store: CacheTraceStore = { startedAt: Date.now(), namespaces: new Map() };
  const value = await CACHE_TRACE_STORAGE.run(store, loader);
  return { value, trace: summarizeTrace(store) };
}

export function cacheTraceHeaders(trace: InsightCacheTrace): Record<string, string> {
  const touched = trace.totals.localHits + trace.totals.redisHits + trace.totals.inflightHits + trace.totals.misses;
  if (touched === 0) return {};
  const header = `status=${trace.status};local=${trace.totals.localHits};redis=${trace.totals.redisHits};inflight=${trace.totals.inflightHits};miss=${trace.totals.misses}`;
  return {
    "X-Cache": header,
    "X-Cache-Trace-Ms": String(trace.elapsedMs),
  };
}

export function getInsightCacheStatsSnapshot(): CacheStatsSnapshot {
  const namespaces: Record<string, InsightCacheCounters> = {};
  for (const [name, counters] of GLOBAL_NAMESPACE_STATS.entries()) {
    namespaces[name] = cloneCounters(counters);
  }
  return {
    startedAt: GLOBAL_STATS_STARTED_AT.toISOString(),
    namespaces,
    totals: sumCounters(GLOBAL_NAMESPACE_STATS.values()),
  };
}

export function resetInsightCacheStats() {
  GLOBAL_NAMESPACE_STATS.clear();
}

function cleanupLocalNamespace(namespace: string, maxEntries: number, now: number) {
  const prefix = `${namespace}:`;
  for (const [key, entry] of LOCAL_CACHE.entries()) {
    if (!key.startsWith(prefix)) continue;
    if (entry.expiresAt <= now) LOCAL_CACHE.delete(key);
  }

  let namespaceCount = 0;
  for (const key of LOCAL_CACHE.keys()) {
    if (key.startsWith(prefix)) namespaceCount += 1;
  }
  if (namespaceCount <= maxEntries) return;

  const overflow = namespaceCount - maxEntries;
  let removed = 0;
  for (const key of LOCAL_CACHE.keys()) {
    if (!key.startsWith(prefix)) continue;
    LOCAL_CACHE.delete(key);
    removed += 1;
    if (removed >= overflow) break;
  }
}

function readLocal<T>(localKey: string, now: number) {
  const hit = LOCAL_CACHE.get(localKey);
  if (!hit) return null;
  if (hit.expiresAt <= now) {
    LOCAL_CACHE.delete(localKey);
    return null;
  }
  return hit.value as T;
}

function writeLocal(localKey: string, ttlMs: number, value: unknown) {
  LOCAL_CACHE.set(localKey, { expiresAt: Date.now() + ttlMs, value });
}

function markRedisUnavailable() {
  redisUnavailableUntil = Date.now() + REDIS_UNAVAILABLE_COOLDOWN_MS;
  if (redisClient) {
    try {
      redisClient.disconnect();
    } catch {
      // Ignore disconnect failures.
    }
  }
  redisClient = null;
}

async function getRedisClient(): Promise<Redis | null> {
  if (!isRedisConfigured()) return null;
  if (Date.now() < redisUnavailableUntil) return null;
  if (redisClient) return redisClient;

  try {
    const client = new Redis(process.env.INSIGHTS_REDIS_URL!, {
      connectTimeout: 1500,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
      lazyConnect: true,
    });
    client.on("error", () => {
      // Keep silent; callers handle failures.
    });
    redisClient = client;
    return redisClient;
  } catch {
    markRedisUnavailable();
    return null;
  }
}

async function readRedis<T>(namespace: string, localKey: string) {
  const client = await getRedisClient();
  if (!client) return null;

  try {
    const raw = await client.get(toRedisKey(localKey));
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    recordCacheEvent(namespace, "redis_error");
    markRedisUnavailable();
    return null;
  }
}

async function writeRedis(namespace: string, localKey: string, ttlMs: number, value: unknown) {
  const client = await getRedisClient();
  if (!client) return;

  try {
    await client.set(toRedisKey(localKey), JSON.stringify(value), "PX", Math.max(1, Math.trunc(ttlMs)));
    recordCacheEvent(namespace, "write_redis");
  } catch {
    recordCacheEvent(namespace, "redis_error");
    markRedisUnavailable();
  }
}

export async function withSharedInsightCache<T>(options: SharedCacheOptions<T>) {
  const now = Date.now();
  const localKey = toLocalKey(options.namespace, options.key);
  const localHit = readLocal<T>(localKey, now);
  if (localHit != null) {
    recordCacheEvent(options.namespace, "local_hit");
    return localHit;
  }

  const inflight = LOCAL_INFLIGHT.get(localKey);
  if (inflight) {
    recordCacheEvent(options.namespace, "inflight_hit");
    return inflight as Promise<T>;
  }

  const redisHit = await readRedis<T>(options.namespace, localKey);
  if (redisHit != null) {
    writeLocal(localKey, options.ttlMs, redisHit);
    recordCacheEvent(options.namespace, "redis_hit");
    recordCacheEvent(options.namespace, "write_local");
    cleanupLocalNamespace(options.namespace, options.maxEntries, now);
    return redisHit;
  }

  recordCacheEvent(options.namespace, "miss");
  const request = (async () => {
    try {
      const value = await options.loader();
      recordCacheEvent(options.namespace, "load_success");
      writeLocal(localKey, options.ttlMs, value);
      recordCacheEvent(options.namespace, "write_local");
      cleanupLocalNamespace(options.namespace, options.maxEntries, Date.now());
      void writeRedis(options.namespace, localKey, options.ttlMs, value);
      return value;
    } catch (error) {
      recordCacheEvent(options.namespace, "load_error");
      throw error;
    }
  })();

  LOCAL_INFLIGHT.set(localKey, request);
  try {
    return await request;
  } finally {
    LOCAL_INFLIGHT.delete(localKey);
  }
}

function namespaceMatches(localKey: string, namespace?: string) {
  if (!namespace) return true;
  return localKey.startsWith(`${namespace}:`);
}

function keyPrefixMatches(localKey: string, keyPrefix?: string) {
  if (!keyPrefix) return true;
  return localKey.includes(`:${keyPrefix}`);
}

export async function invalidateInsightCache(options: { namespace?: string; keyPrefix?: string } = {}) {
  let localRemoved = 0;
  for (const key of Array.from(LOCAL_CACHE.keys())) {
    if (!namespaceMatches(key, options.namespace)) continue;
    if (!keyPrefixMatches(key, options.keyPrefix)) continue;
    LOCAL_CACHE.delete(key);
    localRemoved += 1;
  }

  let redisRemoved = 0;
  const client = await getRedisClient();
  if (client) {
    const pattern = `${REDIS_PREFIX}:${options.namespace ? `${options.namespace}:` : ""}${options.keyPrefix ?? ""}*`;
    try {
      let cursor = "0";
      do {
        const [nextCursor, keys] = (await client.scan(cursor, "MATCH", pattern, "COUNT", 200)) as [string, string[]];
        cursor = nextCursor;
        if (keys.length > 0) {
          redisRemoved += await client.del(...keys);
        }
      } while (cursor !== "0");
    } catch {
      if (options.namespace) recordCacheEvent(options.namespace, "redis_error");
      markRedisUnavailable();
    }
  }

  if (options.namespace) {
    recordCacheEvent(options.namespace, "invalidated");
  }
  return { localRemoved, redisRemoved };
}

export async function prewarmInsightCache<T>(options: SharedCacheOptions<T>) {
  return withSharedInsightCache(options);
}
