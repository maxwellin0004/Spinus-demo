import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireAdminPermission } from "@/lib/admin";
import { shortDate } from "@/lib/format";
import { sourceTypeLabel } from "@/lib/insights/script-tables";
import { prisma } from "@/lib/prisma";
import { Card, DataTable, Field, PageHeader, Select, StatusBadge } from "@/components/ui";

function statusTone(status: string) {
  if (status === "READY") return "success" as const;
  if (status === "FAILED") return "danger" as const;
  return "warning" as const;
}

function statusLabel(status: string) {
  if (status === "READY") return "已生成";
  if (status === "FAILED") return "失败";
  return "生成中";
}

function modeLabel(mode: string) {
  return mode === "AI" ? "AI 生成" : "规则兜底";
}

function hasRepair(debug: Prisma.JsonValue | null | undefined) {
  if (!debug) return false;
  try {
    return JSON.stringify(debug).includes('"usedRepair":true');
  } catch {
    return false;
  }
}

export default async function AdminScriptGenerationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sourceType?: string; platform?: string; creator?: string; mode?: string; q?: string }>;
}) {
  await requireAdminPermission("compliance.manage");
  const params = await searchParams;
  const status = ["GENERATING", "READY", "FAILED"].includes(params.status ?? "") ? params.status : "";
  const sourceType = ["TOPIC_RECOMMENDATION", "CASE_STUDY"].includes(params.sourceType ?? "") ? params.sourceType : "";
  const mode = ["AI", "FALLBACK"].includes(params.mode ?? "") ? params.mode : "";
  const platform = params.platform?.trim() ?? "";
  const creator = params.creator?.trim() ?? "";
  const q = params.q?.trim() ?? "";

  const where: Prisma.CreatorTrendScriptGenerationWhereInput = {
    ...(status ? { status } : {}),
    ...(sourceType ? { sourceType } : {}),
    ...(mode ? { generationMode: mode } : {}),
    ...(platform ? { platform } : {}),
    ...(q
      ? {
          OR: [
            { sourceTitle: { contains: q, mode: "insensitive" } },
            { sourceKey: { contains: q, mode: "insensitive" } },
            { errorMessage: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(creator
      ? {
          creator: {
            OR: [
              { displayName: { contains: creator, mode: "insensitive" } },
              { email: { contains: creator, mode: "insensitive" } },
              { user: { email: { contains: creator, mode: "insensitive" } } },
            ],
          },
        }
      : {}),
  };

  const [records, total, readyCount, failedCount, fallbackCount] = await Promise.all([
    prisma.creatorTrendScriptGeneration.findMany({
      where,
      include: { creator: { include: { user: true } } },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    prisma.creatorTrendScriptGeneration.count({ where }),
    prisma.creatorTrendScriptGeneration.count({ where: { ...where, status: "READY" } }),
    prisma.creatorTrendScriptGeneration.count({ where: { ...where, status: "FAILED" } }),
    prisma.creatorTrendScriptGeneration.count({ where: { ...where, generationMode: "FALLBACK" } }),
  ]);

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Admin" title="脚本生成记录">
        <StatusBadge tone="info">{total} 条记录</StatusBadge>
        <StatusBadge tone="success">{readyCount} 条已生成</StatusBadge>
        <StatusBadge tone={failedCount > 0 ? "danger" : "success"}>{failedCount} 条失败</StatusBadge>
        <StatusBadge tone={fallbackCount > 0 ? "warning" : "success"}>{fallbackCount} 条规则兜底</StatusBadge>
      </PageHeader>

      <Card>
        <form className="grid gap-4 md:grid-cols-6" action="/admin/insights/script-generations">
          <Select label="状态" name="status" defaultValue={status}>
            <option value="">全部</option>
            <option value="READY">已生成</option>
            <option value="GENERATING">生成中</option>
            <option value="FAILED">失败</option>
          </Select>
          <Select label="来源类型" name="sourceType" defaultValue={sourceType}>
            <option value="">全部</option>
            <option value="TOPIC_RECOMMENDATION">选题推荐</option>
            <option value="CASE_STUDY">爆款案例</option>
          </Select>
          <Select label="生成模式" name="mode" defaultValue={mode}>
            <option value="">全部</option>
            <option value="AI">AI 生成</option>
            <option value="FALLBACK">规则兜底</option>
          </Select>
          <Field label="平台" name="platform" defaultValue={platform} placeholder="xiaohongshu / douyin" />
          <Field label="创作者" name="creator" defaultValue={creator} placeholder="昵称或邮箱" />
          <Field label="标题/错误" name="q" defaultValue={q} placeholder="标题、sourceKey、失败原因" />
          <div className="flex items-end gap-2 md:col-span-6">
            <button className="h-11 rounded-xl bg-stone-950 px-4 text-sm font-black text-white" type="submit">
              筛选
            </button>
            <Link className="inline-flex h-11 items-center rounded-xl border border-stone-200 bg-white px-4 text-sm font-black text-stone-700" href="/admin/insights/script-generations">
              清空
            </Link>
          </div>
        </form>
      </Card>

      <Card>
        <DataTable
          headers={["创作者", "来源", "标题", "平台", "状态", "模式/模型", "诊断", "生成时间", "操作"]}
          rows={records.map((record) => [
            <div key="creator">
              <p className="font-black text-stone-950">{record.creator.displayName}</p>
              <p className="text-xs text-stone-500">{record.creator.user.email}</p>
            </div>,
            sourceTypeLabel(record.sourceType === "CASE_STUDY" ? "CASE_STUDY" : "TOPIC_RECOMMENDATION"),
            <div key="title" className="max-w-xs">
              <p className="line-clamp-2 font-black text-stone-950">{record.sourceTitle}</p>
              <p className="mt-1 line-clamp-1 text-xs text-stone-400">{record.sourceKey}</p>
              {record.userInstruction ? <p className="mt-1 line-clamp-2 text-xs text-stone-500">要求：{record.userInstruction}</p> : null}
            </div>,
            record.platform ?? "全部",
            <StatusBadge key="status" tone={statusTone(record.status)}>{statusLabel(record.status)}</StatusBadge>,
            <div key="mode">
              <p className="font-black">{modeLabel(record.generationMode)}</p>
              <p className="text-xs text-stone-500">{record.model ?? "未记录"}</p>
              {hasRepair(record.aiDebugJson) ? <p className="mt-1 text-xs font-black text-teal-700">已自动修复</p> : null}
            </div>,
            <div key="diagnostics" className="max-w-sm">
              {record.errorMessage ? (
                <p className="line-clamp-3 text-xs font-semibold text-amber-700">{record.errorMessage}</p>
              ) : (
                <p className="text-xs text-stone-400">无错误</p>
              )}
            </div>,
            record.generatedAt ? shortDate(record.generatedAt) : shortDate(record.updatedAt),
            <Link key="action" className="font-black text-teal-700 underline" href={`/admin/insights/script-generations/${record.id}`}>
              查看表格
            </Link>,
          ])}
          emptyTitle="暂无脚本生成记录"
          emptyBody="创作者在热点页生成脚本后会出现在这里。"
        />
      </Card>
    </div>
  );
}
