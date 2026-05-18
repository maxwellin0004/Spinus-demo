import assert from "node:assert/strict";
import { test } from "node:test";
import { CrawlerSnapshotStatus } from "@prisma/client";
import { categorizeCrawlerFailure, evaluateCrawlerDataConfidence, toJsonEvidence } from "../src/lib/crawler-reliability";

test("crawler failures are normalized into operational categories", () => {
  assert.equal(categorizeCrawlerFailure("AUTH_EXPIRED", "login cookie expired"), "AUTH_REQUIRED");
  assert.equal(categorizeCrawlerFailure("429", "too many requests"), "RATE_LIMITED");
  assert.equal(categorizeCrawlerFailure("404", "note not found or deleted"), "NOT_FOUND");
  assert.equal(categorizeCrawlerFailure("ETIMEDOUT", "network timeout"), "NETWORK");
  assert.equal(categorizeCrawlerFailure("PARSER_SCHEMA", "invalid payload shape"), "PARSER");
  assert.equal(categorizeCrawlerFailure("UPSTREAM_502", "bad gateway from provider"), "PROVIDER_ERROR");
  assert.equal(categorizeCrawlerFailure(undefined, undefined), "UNKNOWN");
});

test("crawler data confidence separates evidence quality from success status", () => {
  assert.equal(
    evaluateCrawlerDataConfidence({
      status: CrawlerSnapshotStatus.FAILED,
      failureCategory: "NETWORK",
      hasRawEvidence: true,
      hasCoreMetric: true,
    }),
    "FAILED",
  );
  assert.equal(
    evaluateCrawlerDataConfidence({
      status: CrawlerSnapshotStatus.SUCCESS,
      hasRawEvidence: true,
      hasCoreMetric: true,
      authorMatched: true,
    }),
    "HIGH",
  );
  assert.equal(
    evaluateCrawlerDataConfidence({
      status: CrawlerSnapshotStatus.SUCCESS,
      hasRawEvidence: false,
      hasCoreMetric: true,
    }),
    "MEDIUM",
  );
  assert.equal(
    evaluateCrawlerDataConfidence({
      status: CrawlerSnapshotStatus.SUCCESS,
      hasRawEvidence: true,
      hasCoreMetric: true,
      authorMatched: false,
    }),
    "LOW",
  );
});

test("crawler raw evidence is stored as safe JSON", () => {
  const evidence = toJsonEvidence({
    provider: "mock",
    metrics: { likes: 12, views: 100 },
    capturedAt: "2026-05-16T00:00:00.000Z",
  });

  assert.deepEqual(evidence, {
    provider: "mock",
    metrics: { likes: 12, views: 100 },
    capturedAt: "2026-05-16T00:00:00.000Z",
  });
});
