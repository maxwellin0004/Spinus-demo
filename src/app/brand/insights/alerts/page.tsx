import Link from "next/link";
import { BellRing, Plus, Power, Trash2 } from "lucide-react";
import { UserRole } from "@prisma/client";
import { SubmitButton } from "@/components/form-controls";
import { Card, DataTable, Field, PageHeader, Select, StatusBadge } from "@/components/ui";
import { createBrandInsightMonitorAction, updateBrandInsightMonitorAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const monitorTypeLabel: Record<string, string> = {
  keyword: "关键词",
  competitor: "竞品",
  negative: "负面预警",
};

const platformLabel: Record<string, string> = {
  all: "全部平台",
  xiaohongshu: "小红书",
  douyin: "抖音",
  weibo: "微博",
  bilibili: "B站",
};

function monitorTypeFromKeywordType(value: string) {
  return value.split(":")[2] ?? "keyword";
}

function dateText(value: Date | null | undefined) {
  if (!value) return "未采集";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export default async function BrandInsightAlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ keyword?: string; saved?: string; error?: string }>;
}) {
  const session = await requireRole(UserRole.BRAND);
  const [{ keyword, saved, error }, brand] = await Promise.all([
    searchParams,
    prisma.brandProfile.findUnique({ where: { userId: session.userId }, select: { id: true, insightDirection: true } }),
  ]);

  if (!brand) return null;

  const monitors = await prisma.insightKeywordConfig.findMany({
    where: { keywordType: { startsWith: `brand:${brand.id}:` } },
    orderBy: [{ active: "desc" }, { updatedAt: "desc" }],
  });

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="品牌方" title="关键词监控">
        <Link className="rounded-xl border border-stone-200 bg-white/80 px-4 py-2.5 text-sm font-black text-stone-800 transition hover:bg-white" href="/brand/insights">
          返回洞察台
        </Link>
      </PageHeader>

      {saved ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-800">监控词已保存。</div> : null}
      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">请检查监控词和表单内容。</div> : null}

      <Card>
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <BellRing size={21} />
          </div>
          <div>
            <h2 className="text-xl font-black text-stone-950">新增监控词</h2>
            <p className="mt-1 text-sm text-stone-500">用于竞品、负面反馈和重点品类词的定时采集；采集结果会回流品牌热点洞察台。</p>
          </div>
        </div>
        <form action={createBrandInsightMonitorAction} className="mt-5 grid gap-4 md:grid-cols-5">
          <Field label="监控词" name="keyword" required defaultValue={keyword ?? ""} placeholder="竞品名 / 风险词 / 品类词" />
          <Select label="类型" name="monitorType" defaultValue="keyword">
            <option value="keyword">关键词</option>
            <option value="competitor">竞品</option>
            <option value="negative">负面预警</option>
          </Select>
          <Select label="平台" name="platform" defaultValue="xiaohongshu">
            <option value="xiaohongshu">小红书</option>
            <option value="douyin">抖音</option>
            <option value="weibo">微博</option>
            <option value="bilibili">B站</option>
          </Select>
          <Field label="采集间隔（小时）" name="collectIntervalHours" type="number" defaultValue={6} />
          <div className="flex items-end">
            <SubmitButton className="w-full" variant="secondary">
              <Plus className="mr-1 inline" size={15} />
              保存监控
            </SubmitButton>
          </div>
        </form>
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-stone-950">我的监控列表</h2>
            <p className="mt-1 text-sm text-stone-500">停用后不再进入配置采集队列，历史样本仍保留。</p>
          </div>
          <StatusBadge>{monitors.length} 个监控词</StatusBadge>
        </div>
        <DataTable
          emptyTitle="暂无监控词"
          emptyBody="添加竞品、负面词或品类关键词后，品牌洞察台会持续追踪这些信号。"
          headers={["监控词", "类型", "平台", "状态", "采集间隔", "上次采集", "操作"]}
          rows={monitors.map((item) => {
            const monitorType = monitorTypeFromKeywordType(item.keywordType);
            return [
              <Link className="font-black text-stone-950 hover:text-teal-700" href={`/brand/insights?keyword=${encodeURIComponent(item.keyword)}`} key="keyword">
                {item.keyword}
              </Link>,
              monitorTypeLabel[monitorType] ?? monitorType,
              platformLabel[item.platform] ?? item.platform,
              <StatusBadge key="status">{item.active ? "启用" : "停用"}</StatusBadge>,
              `${item.collectIntervalHours} 小时`,
              dateText(item.lastCollectedAt),
              <form action={updateBrandInsightMonitorAction.bind(null, item.id)} className="flex flex-wrap gap-2" key="actions">
                <SubmitButton name="intent" value="toggle" variant="ghost">
                  <Power className="mr-1 inline" size={14} />
                  {item.active ? "停用" : "启用"}
                </SubmitButton>
                <SubmitButton name="intent" value="delete" variant="danger">
                  <Trash2 className="mr-1 inline" size={14} />
                  删除
                </SubmitButton>
              </form>,
            ];
          })}
        />
      </Card>
    </div>
  );
}
