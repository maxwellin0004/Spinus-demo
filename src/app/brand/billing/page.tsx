import { UserRole } from "@prisma/client";
import { requestBrandInvoiceAction, requestBrandRefundAction, submitInvoicePaymentAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button, Card, DataTable, EmptyState, Field, MetricCard, PageHeader, Select, StatusBadge, Textarea } from "@/components/ui";
import { money, shortDate } from "@/lib/format";

export default async function BrandBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; invoice?: string; payment?: string; refund?: string }>;
}) {
  const session = await requireRole(UserRole.BRAND);
  const { error, invoice, payment, refund } = await searchParams;
  const brand = await prisma.brandProfile.findUnique({
    where: { userId: session.userId },
    include: {
      campaigns: { orderBy: { createdAt: "desc" } },
      invoices: { include: { campaign: true }, orderBy: { createdAt: "desc" } },
      ledgerTransactions: { include: { campaign: true }, orderBy: { createdAt: "desc" }, take: 30 },
      refundRequests: { include: { campaign: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!brand) return <EmptyState title="缺少品牌资料" />;

  const openAmount = brand.invoices
    .filter((item) => ["REQUESTED", "OPEN", "PAYMENT_SUBMITTED"].includes(item.status))
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const paidAmount = brand.invoices.filter((item) => item.status === "PAID").reduce((sum, item) => sum + Number(item.amount), 0);
  const committedBudget = brand.campaigns.reduce((sum, campaign) => sum + Number(campaign.escrowAmount || campaign.totalBudget), 0);

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="品牌方" title="预算与账单" />
      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
      {invoice ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">预算/付款申请已提交给平台。</div> : null}
      {payment ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">付款凭证已提交，等待平台财务确认。</div> : null}
      {refund ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">退款申请已提交，等待平台人工处理。</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="可用余额" value={money(brand.budgetBalance, "CNY")} />
        <MetricCard label="冻结托管" value={money(brand.frozenEscrowBalance, "CNY")} />
        <MetricCard label="待确认付款" value={money(openAmount, "CNY")} />
        <MetricCard label="已确认付款" value={money(paidAmount, "CNY")} />
        <MetricCard label="Campaign 承诺预算" value={money(committedBudget, "CNY")} />
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-black">提交付款 / 预算申请</h2>
          <p className="mt-2 text-sm text-stone-600">余额不足的 Campaign 会生成待付款记录。商家也可以主动提交预算付款申请，平台确认后计入可用余额。</p>
          <form action={requestBrandInvoiceAction} className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="申请金额" name="amount" type="number" required defaultValue={500} />
            <Field label="币种" name="currency" required defaultValue="CNY" />
            <Select label="关联 Campaign，可选" name="campaignId">
              <option value="">不关联具体 Campaign</option>
              {brand.campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.title}
                </option>
              ))}
            </Select>
            <div className="md:col-span-2">
              <Textarea label="付款用途或备注" name="note" rows={4} placeholder="例如：用于 5 月小红书种草任务托管。" />
            </div>
            <div className="md:col-span-2">
              <Button variant="secondary">提交付款申请</Button>
            </div>
          </form>
        </Card>

        <Card>
          <h2 className="text-xl font-black">申请余额退款</h2>
          <p className="mt-2 text-sm text-stone-600">仅可退回可用余额，已冻结在进行中 Campaign 的托管金额不能直接退款。</p>
          <form action={requestBrandRefundAction} className="mt-5 grid gap-4">
            <Field label="退款金额" name="amount" type="number" required defaultValue={20} />
            <Field label="退款方式" name="payoutMethod" required defaultValue="人工转账" />
            <Textarea label="收款信息" name="payoutDetails" rows={4} required placeholder="请填写收款账号、户名或其它人工处理所需信息。" />
            <Button variant="secondary">提交退款申请</Button>
          </form>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">付款记录</h2>
        <DataTable
          headers={["付款单号", "关联 Campaign", "金额", "状态", "付款方式", "交易订单号", "凭证", "创建时间"]}
          rows={brand.invoices.map((item) => [
            item.invoiceNumber ?? "-",
            item.campaign?.title ?? "-",
            money(item.amount, item.currency),
            <StatusBadge key="s">{item.status}</StatusBadge>,
            item.paymentMethod ?? "-",
            item.paymentReference ?? "-",
            item.paymentProofUrl ? (
              <a className="font-semibold text-stone-950" href={item.paymentProofUrl} key={item.id}>
                查看
              </a>
            ) : (
              "-"
            ),
            shortDate(item.createdAt),
          ])}
        />
      </section>

      <div className="grid gap-4">
        {brand.invoices
          .filter((item) => item.status !== "PAID" && item.status !== "VOID" && item.status !== "REJECTED")
          .map((item) => (
            <Card key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black">
                    {item.invoiceNumber ?? "待付款"} · {money(item.amount, item.currency)}
                  </h3>
                  <p className="mt-1 text-sm text-stone-500">当前状态：{item.status} · {item.note ?? "无备注"}</p>
                </div>
                <StatusBadge>{item.status}</StatusBadge>
              </div>
              <form action={submitInvoicePaymentAction.bind(null, item.id)} className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label="付款方式" name="paymentMethod" defaultValue={item.paymentMethod ?? "人工转账"} />
                <Field label="交易订单号" name="paymentReference" defaultValue={item.paymentReference ?? ""} required />
                <Field label="付款凭证 URL，可选" name="paymentProofUrl" defaultValue={item.paymentProofUrl ?? ""} />
                <label className="grid gap-2 text-sm font-medium text-stone-700">
                  上传付款截图
                  <input className="rounded-2xl border border-stone-200 bg-white/90 px-4 py-3" name="paymentProof" type="file" accept="image/*" />
                </label>
                <div className="flex items-end">
                  <Button variant="secondary">提交付款凭证</Button>
                </div>
              </form>
            </Card>
          ))}
      </div>

      <section>
        <h2 className="mb-3 text-xl font-semibold">商家资金流水</h2>
        <DataTable
          headers={["类型", "Campaign", "金额", "状态", "余额前", "余额后", "备注", "时间"]}
          rows={brand.ledgerTransactions.map((item) => [
            item.type,
            item.campaign?.title ?? "-",
            money(item.amount, item.currency),
            <StatusBadge key="s">{item.status}</StatusBadge>,
            money(item.beforeBalance, item.currency),
            money(item.afterBalance, item.currency),
            item.note ?? "-",
            shortDate(item.createdAt),
          ])}
        />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">退款申请</h2>
        <DataTable
          headers={["金额", "状态", "方式", "备注", "创建时间"]}
          rows={brand.refundRequests.map((item) => [
            money(item.amount, item.currency),
            <StatusBadge key="s">{item.status}</StatusBadge>,
            item.payoutMethod ?? "-",
            item.adminNote ?? "-",
            shortDate(item.createdAt),
          ])}
        />
      </section>
    </div>
  );
}
