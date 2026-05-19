import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPermission } from "@/lib/admin";
import { sourceTypeLabel } from "@/lib/insights/script-tables";
import { scriptGenerationToView } from "@/lib/insights/trend-script-generation";
import { prisma } from "@/lib/prisma";
import { ScriptTablesPanel } from "@/components/script-generation-viewer";
import { Card, PageHeader, StatusBadge } from "@/components/ui";

function statusLabel(status: string) {
  if (status === "READY") return "已生成";
  if (status === "FAILED") return "失败";
  return "生成中";
}

export default async function AdminScriptGenerationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPermission("compliance.manage");
  const { id } = await params;
  const record = await prisma.creatorTrendScriptGeneration.findUnique({
    where: { id },
    include: {
      creator: { include: { user: true } },
      scriptImages: { orderBy: [{ pageOrder: "asc" }, { updatedAt: "desc" }] },
      scriptReviews: { orderBy: { updatedAt: "desc" }, take: 1 },
    },
  });

  if (!record) notFound();
  const view = scriptGenerationToView(record);

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Admin" title="脚本生成详情">
        <StatusBadge tone={record.status === "READY" ? "success" : record.status === "FAILED" ? "danger" : "warning"}>{statusLabel(record.status)}</StatusBadge>
        <StatusBadge tone={record.generationMode === "AI" ? "success" : "warning"}>{record.generationMode === "AI" ? "AI 生成" : "规则兜底"}</StatusBadge>
      </PageHeader>

      <Card>
        <div className="grid gap-3 text-sm text-stone-700 md:grid-cols-4">
          <div>
            <p className="text-xs font-black text-stone-400">创作者</p>
            <p className="mt-1 font-black text-stone-950">{record.creator.displayName}</p>
            <p className="text-xs text-stone-500">{record.creator.user.email}</p>
          </div>
          <div>
            <p className="text-xs font-black text-stone-400">来源</p>
            <p className="mt-1 font-black text-stone-950">{sourceTypeLabel(view.sourceType)}</p>
          </div>
          <div>
            <p className="text-xs font-black text-stone-400">平台</p>
            <p className="mt-1 font-black text-stone-950">{record.platform ?? "全部"}</p>
          </div>
          <div>
            <p className="text-xs font-black text-stone-400">模型</p>
            <p className="mt-1 font-black text-stone-950">{record.model ?? "未记录"}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-black text-stone-800" href="/admin/insights/script-generations">
            返回列表
          </Link>
          <Link className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-black text-stone-800" href="/admin/insights">
            返回洞察配置
          </Link>
        </div>
      </Card>

      <Card>
        <ScriptTablesPanel record={view} readOnly allowTableRegenerate />
      </Card>

      <Card>
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-black text-stone-950">AI 调试信息</h2>
            <p className="mt-1 text-sm text-stone-500">用于排查中转站返回、JSON 解析、表格校验和自动修复过程。</p>
          </div>
          {record.errorMessage ? <StatusBadge tone="warning">有诊断信息</StatusBadge> : <StatusBadge tone="success">无错误</StatusBadge>}
        </div>
        {record.errorMessage ? <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold leading-6 text-amber-800">{record.errorMessage}</div> : null}
        <details className="mt-4 rounded-xl border border-stone-200 bg-stone-50">
          <summary className="cursor-pointer px-4 py-3 text-sm font-black text-stone-800">查看 AI 原始返回和校验记录</summary>
          <pre className="max-h-[32rem] overflow-auto border-t border-stone-200 bg-white p-4 text-xs leading-5 text-stone-700">
            {JSON.stringify(record.aiDebugJson ?? { message: "暂无 AI 调试记录" }, null, 2)}
          </pre>
        </details>
      </Card>
    </div>
  );
}
