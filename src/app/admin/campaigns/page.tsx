import Link from "next/link";
import { CampaignStatus } from "@prisma/client";
import { DataTable, PageHeader, StatusBadge } from "@/components/ui";
import { brandScopeWhere, demoWhere, getAdminContext, hasAdminPermission, scopeOptions } from "@/lib/admin";
import { money, shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

function campaignTone(status: CampaignStatus) {
  if (status === CampaignStatus.ACTIVE) return "info" as const;
  if (status === CampaignStatus.COMPLETED) return "success" as const;
  if (status === CampaignStatus.REJECTED || status === CampaignStatus.CANCELLED) return "danger" as const;
  if (status === CampaignStatus.PAUSED || status === CampaignStatus.ARCHIVED || status === CampaignStatus.DRAFT) return "neutral" as const;
  return "warning" as const;
}

function campaignNextStep({
  status,
  fundingReady,
  invoiceStatus,
}: {
  status: CampaignStatus;
  fundingReady: boolean;
  invoiceStatus?: string | null;
}) {
  if (status === CampaignStatus.AWAITING_PAYMENT) {
    if (invoiceStatus === "PAYMENT_SUBMITTED") return "确认付款并托管";
    return "等待品牌提交付款凭证";
  }
  if (status === CampaignStatus.PENDING_REVIEW) return fundingReady ? "审核内容并上架" : "先确认资金到账";
  if (status === CampaignStatus.ACTIVE) return "跟进申请、内容和验收";
  if (status === CampaignStatus.PAUSED) return "确认是否恢复或结束";
  if (status === CampaignStatus.COMPLETED) return "归档并核对未用托管";
  if (status === CampaignStatus.REJECTED) return "等待品牌调整后重提";
  return "查看详情";
}

export default async function AdminCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; scope?: string; demo?: string }>;
}) {
  const context = await getAdminContext();
  const { status, q, scope, demo } = await searchParams;
  const canSeeDemo = hasAdminPermission(context.profile, "demo.manage");
  const campaigns = await prisma.campaign.findMany({
    where: {
      ...demoWhere(demo, canSeeDemo),
      status: status && status !== "ALL" ? (status as never) : undefined,
      title: q ? { contains: q, mode: "insensitive" } : undefined,
      brand: brandScopeWhere(context.profile, scope),
    },
    include: {
      brand: { include: { responsibleAdmin: true } },
      tasks: true,
      invoices: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="管理端" title="推广活动审核" />
      <form className="flex flex-wrap gap-3">
        <input className="rounded-full border border-stone-200 px-4 py-3" name="q" placeholder="搜索 Campaign" defaultValue={q} />
        <select className="rounded-full border border-stone-200 px-4 py-3" name="status" defaultValue={status ?? "ALL"}>
          <option value="ALL">全部状态</option>
          <option value="AWAITING_PAYMENT">待资金确认</option>
          <option value="PENDING_REVIEW">待内容审核</option>
          <option value="ACTIVE">已上线</option>
          <option value="PAUSED">已暂停</option>
          <option value="COMPLETED">已完成</option>
          <option value="REJECTED">已拒绝</option>
        </select>
        <select className="rounded-full border border-stone-200 px-4 py-3" name="scope" defaultValue={scope}>
          {scopeOptions(context.profile).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <select className="rounded-full border border-stone-200 px-4 py-3" name="demo" defaultValue={demo ?? "real"}>
          <option value="real">只看真实数据</option>
          {canSeeDemo ? <option value="include">包含演示数据</option> : null}
          {canSeeDemo ? <option value="only">只看演示数据</option> : null}
        </select>
        <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white">筛选</button>
      </form>
      <DataTable
        headers={["Campaign", "Brand", "负责人", "状态", "下一步", "资金状态", "订单号", "付款截图", "预算", "任务", "结束时间"]}
        rows={campaigns.map((campaign) => {
          const invoice = campaign.invoices[0];
          const fundingReady = Number(campaign.escrowFrozenAmount) >= Number(campaign.escrowAmount);
          return [
            <Link className="font-semibold text-stone-950" href={`/admin/campaigns/${campaign.id}`} key={campaign.id}>{campaign.title}</Link>,
            campaign.brand.brandName,
            campaign.brand.responsibleAdmin?.displayName ?? "-",
            <StatusBadge key="s" tone={campaignTone(campaign.status)}>{campaign.status}</StatusBadge>,
            campaignNextStep({ status: campaign.status, fundingReady, invoiceStatus: invoice?.status }),
            fundingReady ? "已托管" : invoice?.status ?? "待确认",
            invoice?.paymentReference ?? "-",
            invoice?.paymentProofUrl ? <Link className="font-semibold text-stone-950" href={invoice.paymentProofUrl} key="proof" target="_blank">查看</Link> : "-",
            money(campaign.totalBudget, campaign.currency),
            campaign.tasks.length,
            shortDate(campaign.endDate),
          ];
        })}
      />
    </div>
  );
}
