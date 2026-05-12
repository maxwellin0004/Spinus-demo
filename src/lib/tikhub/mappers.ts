import { heatScore } from "@/lib/insights/scoring";

type JsonRecord = Record<string, unknown>;

export type MappedTopic = {
  topic: string;
  sourceKey?: string;
  heatValue: number;
  platforms: string[];
  rawPayload: unknown;
};

export type MappedContent = {
  platform: string;
  sourceContentId: string;
  title: string;
  description?: string;
  authorId?: string;
  authorName?: string;
  publishTime?: Date;
  contentUrl?: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  collectCount: number;
  viewCount: number;
  heatScore: number;
  rawPayload: unknown;
};

export type MappedComment = {
  sourceCommentId?: string;
  text: string;
  likeCount: number;
  createdAt?: Date;
  rawPayload: unknown;
};

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function firstString(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return undefined;
}

function firstNumber(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value.replace(/[^\d.-]/g, ""));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

function firstArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  for (const key of ["data", "items", "list", "aweme_list", "notes", "result", "results"]) {
    const value = record[key];
    if (Array.isArray(value)) return value;
    const nested = asRecord(value);
    const combined = ["current", "rocketing"].flatMap((nestedKey) => {
      const nestedValue = nested[nestedKey];
      return Array.isArray(nestedValue) ? nestedValue : [];
    });
    if (combined.length) return combined;
    for (const nestedKey of ["data", "items", "list", "aweme_list", "notes", "result", "results"]) {
      const nestedValue = nested[nestedKey];
      if (Array.isArray(nestedValue)) return nestedValue;
    }
    const deep = firstArray(nested);
    if (deep.length) return deep;
  }
  return [];
}

function dateFromTimestamp(value: string | undefined) {
  if (!value) return undefined;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }
  return new Date(numeric < 10_000_000_000 ? numeric * 1000 : numeric);
}

function textFromRecord(record: JsonRecord, keys: string[]) {
  return firstString(record, keys) ?? "";
}

export function mapHotTopics(payload: unknown, platform: string): MappedTopic[] {
  const topics: MappedTopic[] = [];
  for (const item of firstArray(payload)) {
    const record = asRecord(item);
    const topic = firstString(record, ["word", "sentence", "title", "keyword", "topic_name", "topic", "name", "desc"]);
    if (!topic) continue;
    const sourceKey = firstString(record, ["id", "group_id", "sentence_id", "event_id", "hot_id"]);
    topics.push({
      topic,
      ...(sourceKey ? { sourceKey } : {}),
      heatValue: firstNumber(record, ["hot_value", "hotValue", "hot_score", "topic_index", "score", "vv", "view_count", "views"]),
      platforms: [platform],
      rawPayload: item,
    });
  }
  return topics;
}

export function mapSearchContents(payload: unknown, platform: string): MappedContent[] {
  const contents: MappedContent[] = [];
  for (const item of firstArray(payload)) {
    const record = asRecord(item);
    const nestedAweme = asRecord(record.aweme_info ?? record.aweme ?? record.noteCard ?? record.note ?? record.item ?? record.video);
    const source = Object.keys(nestedAweme).length ? nestedAweme : record;
    const author = asRecord(source.author ?? source.user ?? source.user_info ?? source.author_info);
    const interact = asRecord(source.interactInfo ?? source.interact_info ?? source.statistics ?? source.stats);

    const sourceContentId =
      firstString(source, ["aweme_id", "note_id", "id", "item_id", "video_id", "bvid", "mblogid", "mid"]) ??
      firstString(record, ["aweme_id", "note_id", "id", "item_id", "video_id", "bvid", "mblogid", "mid"]);
    if (!sourceContentId) continue;

    const title =
      firstString(source, ["title", "desc", "description", "content", "text"]) ??
      firstString(source, ["displayTitle"]) ??
      firstString(record, ["title", "desc", "description", "content", "text"]) ??
      "未命名内容";

    const metrics = {
      likeCount: firstNumber(source, ["like_count", "digg_count", "liked_count", "likes", "attitudes_count", "likedCount"]) || firstNumber(interact, ["likedCount", "like_count", "likes"]),
      commentCount: firstNumber(source, ["comment_count", "comments", "comments_count", "commentCount"]) || firstNumber(interact, ["commentCount", "comment_count", "comments"]),
      shareCount: firstNumber(source, ["share_count", "repost_count", "reposts_count", "shareCount"]) || firstNumber(interact, ["shareCount", "share_count"]),
      collectCount: firstNumber(source, ["collect_count", "favorite_count", "collected_count", "favorites", "collectedCount"]) || firstNumber(interact, ["collectedCount", "collect_count", "favorite_count"]),
      viewCount: firstNumber(source, ["view_count", "play_count", "read_count", "views", "viewCount"]) || firstNumber(interact, ["viewCount", "view_count"]),
    };
    const description = firstString(source, ["desc", "description", "content", "text"]);
    const authorId = firstString(author, ["uid", "id", "user_id", "sec_uid", "mid"]);
    const authorName = firstString(author, ["nickname", "name", "screen_name", "user_name"]);
    const publishTime = dateFromTimestamp(firstString(source, ["create_time", "ctime", "pubdate", "created_at", "publish_time"]));
    const contentUrl = firstString(source, ["share_url", "url", "web_url", "short_url"]);

    contents.push({
      platform,
      sourceContentId,
      title,
      ...(description ? { description } : {}),
      ...(authorId ? { authorId } : {}),
      ...(authorName ? { authorName } : {}),
      ...(publishTime ? { publishTime } : {}),
      ...(contentUrl ? { contentUrl } : {}),
      ...metrics,
      heatScore: heatScore(metrics),
      rawPayload: item,
    });
  }
  return contents;
}

export function mapComments(payload: unknown): MappedComment[] {
  const comments: MappedComment[] = [];
  for (const item of firstArray(payload)) {
    const record = asRecord(item);
    const nested = asRecord(record.comment ?? record.data ?? record.item ?? record);
    const source = Object.keys(nested).length ? nested : record;
    const text =
      textFromRecord(source, ["text", "content", "desc", "comment", "comment_text", "message"]) ||
      textFromRecord(record, ["text", "content", "desc", "comment", "comment_text", "message"]);
    if (!text) continue;
    const sourceCommentId =
      firstString(source, ["comment_id", "id", "cid", "source_comment_id", "commentId"]) ??
      firstString(record, ["comment_id", "id", "cid", "source_comment_id", "commentId"]);
    const createdAt = dateFromTimestamp(firstString(source, ["create_time", "ctime", "created_at", "time", "timestamp"]));
    comments.push({
      ...(sourceCommentId ? { sourceCommentId } : {}),
      text,
      likeCount: firstNumber(source, ["like_count", "likes", "digg_count", "liked_count", "likeCount"]),
      ...(createdAt ? { createdAt } : {}),
      rawPayload: item,
    });
  }
  return comments;
}
