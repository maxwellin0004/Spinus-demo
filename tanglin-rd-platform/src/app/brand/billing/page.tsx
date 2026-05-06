import { UserRole } from "@prisma/client";
import { requestBrandInvoiceAction, submitInvoicePaymentAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button, Card, DataTable, EmptyState, Field, MetricCard, PageHeader, Select, StatusBadge, Textarea } from "@/components/ui";
import { money, shortDate } from "@/lib/format";

export default async function BrandBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; invoice?: string; payment?: string }>;
}) {
  const session = await requireRole(UserRole.BRAND);
  const { error, invoice, payment } = await searchParams;
  const brand = await prisma.brandProfile.findUnique({
    where: { userId: session.userId },
    include: {
      campaigns: { orderBy: { createdAt: "desc" } },
      invoices: { include: { campaign: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!brand) return <EmptyState title="缺少品牌资料" />;

  const openAmount = brand.invoices.filter((item) => ["REQUESTED", "OPEN", "PAYMENT_SUBMITTED"].includes(item.status)).reduce((sum, item) => sum + Number(item.amount), 0);
  const paidAmount = brand.invoices.filter((item) => item.status === "PAID").reduce((sum, item) => sum + Number(item.amount), 0);
  const committedBudget = brand.campaigns.reduce((sum, campaign) => sum + Number(campaign.totalBudget), 0);

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="品牌方" title="预算 / 账单 / 发票" />
      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
      {invoice ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">发票/预算申请已提交给运营。</div> : null}
      {payment ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">付款凭证已提交，等待平台财务确认。</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="可用预算余额" value={money(brand.budgetBalance)} />
        <MetricCard label="待处理发票" value={money(openAmount)} />
        <MetricCard label="已确认付款" value={money(paidAmount)} />
        <MetricCard label="Campaign 预算承诺" value={money(committedBudget)} />
      </div>

      <Card>
        <h2 className="text-xl font-black">申请预算 / 发票</h2>
        <p className="mt-2 text-sm text-stone-600">品牌提交申请后，运营或财务会在 Admin 端开票、确认付款，并把金额计入品牌预算余额。</p>
        <form action={requestBrandInvoiceAction} className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="申请金额" name="amount" type="number" required defaultValue={5000} />
          <Field label="币种" name="currency" required defaultValue="USD" />
          <Select label="关联 Campaign，可选" name="campaignId">
            <option value="">不关联具体 Campaign</option>
            {brand.campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>{campaign.title}</option>
            ))}
          </Select>
          <div className="md:col-span-2">
            <Textarea label="发票抬头、预算用途或备注" name="note" rows={4} placeholder="例如：用于 5 月 TikTok 创作者推广，需公司抬头。" />
          </div>
          <div className="md:col-span-2"><Button variant="secondary">提交预算/发票申请</Button></div>
        </form>
      </Card>

      <section>
        <h2 className="mb-3 text-xl font-semibold">发票与付款记录</h2>
        <DataTable
          headers={["发票号", "关联 Campaign", "金额", "状态", "付款方式", "凭证", "创建时间"]}
          rows={brand.invoices.map((item) => [
            item.invoiceNumber ?? "-",
            item.campaign?.title ?? "-",
            money(item.amount, item.currency),
            <StatusBadge key="s">{item.status}</StatusBadge>,
            item.paymentMethod ?? "-",
            item.paymentProofUrl ? <a className="font-semibold text-stone-950" href={item.paymentProofUrl} key={item.id}>查看</a> : "-",
            shortDate(item.createdAt),
          ])}
        />
      </section>

      <div className="grid gap-4">
        {brand.invoices.filter((item) => item.status !== "PAID" && item.status !== "VOID").map((item) => (
          <Card key={item.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black">{item.invoiceNumber ?? "待开票"} · {money(item.amount, item.currency)}</h3>
                <p className="mt-1 text-sm text-stone-500">当前状态：{item.status} · {item.note ?? "无备注"}</p>
              </div>
              <StatusBadge>{item.status}</StatusBadge>
            </div>
            <form action={submitInvoicePaymentAction.bind(null, item.id)} className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="付款方式" name="paymentMethod" defaultValue={item.paymentMethod ?? "Bank transfer"} />
              <Field label="付款凭证 URL，可选" name="paymentProofUrl" defaultValue={item.paymentProofUrl ?? ""} />
              <label className="grid gap-2 text-sm font-medium text-stone-700">
                上传付款凭证
                <input className="rounded-2xl border border-stone-200 bg-white/90 px-4 py-3" name="paymentProof" type="file" />
              </label>
              <div className="flex items-end"><Button variant="secondary">提交付款凭证</Button></div>
            </form>
          </Card>
        ))}
      </div>
    </div>
  );
}
