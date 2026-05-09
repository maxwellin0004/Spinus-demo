import Link from "next/link";
import { UserRole } from "@prisma/client";
import { requestBrandInvoiceAction, requestBrandRefundAction, submitInvoicePaymentAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubmitButton } from "@/components/form-controls";
import { Card, DataTable, EmptyState, Field, MetricCard, PageHeader, Select, StatusBadge, Textarea } from "@/components/ui";
import { money, shortDate } from "@/lib/format";

const billingTabs = [
  { value: "todo", label: "待处理" },
  { value: "invoices", label: "付款单" },
  { value: "escrow", label: "余额与托管" },
  { value: "ledger", label: "资金流水" },
  { value: "refunds", label: "退款" },
  { value: "rules", label: "规则说明" },
] as const;

type BillingTab = (typeof billingTabs)[number]["value"];
type MoneyValue = number | string | { toString(): string } | null | undefined;

type ActionableInvoice = {
  id: string;
  invoiceNumber: string | null;
  campaign: { title: string } | null;
  amount: MoneyValue;
  currency: string;
  status: string;
  note: string | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  paymentProofUrl: string | null;
};

function isBillingTab(value?: string): value is BillingTab {
  return billingTabs.some((tab) => tab.value === value);
}

function BillingTabLink({ tab, activeTab }: { tab: (typeof billingTabs)[number]; activeTab: BillingTab }) {
  const active = tab.value === activeTab;
  return (
    <Link
      className={`rounded-full border px-4 py-2 text-sm font-black transition ${
        active
          ? "border-stone-950 bg-stone-950 text-white shadow-sm"
          : "border-stone-200 bg-white/80 text-stone-700 hover:border-amber-300 hover:bg-amber-50"
      }`}
      href={`/brand/billing?tab=${tab.value}`}
    >
      {tab.label}
    </Link>
  );
}

function PaymentProofTable({ invoices }: { invoices: ActionableInvoice[] }) {
  return (
    <div className="min-w-0">
      {invoices.map((invoice) => (
        <form action={submitInvoicePaymentAction.bind(null, invoice.id)} id={`payment-proof-${invoice.id}`} key={`form-${invoice.id}`} />
      ))}
      <div className="max-w-full overflow-x-auto rounded-2xl border border-[var(--line)] bg-white/86 shadow-sm backdrop-blur-sm">
        <table className="w-full min-w-[1160px] text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-[0.1em] text-stone-500">
            <tr>
              {["付款单", "金额", "状态", "付款方式", "交易订单号", "凭证 URL", "上传截图", "操作"].map((header) => (
                <th className="whitespace-nowrap px-4 py-3 font-semibold" key={header}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {invoices.map((invoice) => {
              const formId = `payment-proof-${invoice.id}`;
              return (
                <tr className="align-top transition hover:bg-amber-50/35" key={invoice.id}>
                  <td className="px-4 py-4">
                    <div className="grid min-w-[12rem] gap-1">
                      <span className="font-black text-stone-950">{invoice.invoiceNumber ?? "待付款"}</span>
                      <span className="text-xs text-stone-500">{invoice.campaign?.title ?? "余额充值"}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 font-black text-stone-950">{money(invoice.amount, invoice.currency)}</td>
                  <td className="px-4 py-4">
                    <StatusBadge>{invoice.status}</StatusBadge>
                  </td>
                  <td className="px-4 py-4">
                    <input
                      className="w-40 rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-950 shadow-inner outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-amber-100"
                      defaultValue={invoice.paymentMethod ?? "人工转账"}
                      form={formId}
                      name="paymentMethod"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <input
                      className="w-48 rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-950 shadow-inner outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-amber-100"
                      defaultValue={invoice.paymentReference ?? ""}
                      form={formId}
                      name="paymentReference"
                      required
                    />
                  </td>
                  <td className="px-4 py-4">
                    <input
                      className="w-56 rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-950 shadow-inner outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-amber-100"
                      defaultValue={invoice.paymentProofUrl ?? ""}
                      form={formId}
                      name="paymentProofUrl"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <input
                      accept="image/*"
                      className="w-64 rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-950 shadow-inner outline-none file:mr-3 file:rounded-full file:border-0 file:bg-stone-100 file:px-3 file:py-1.5 file:text-sm file:font-black file:text-stone-700 focus:border-[var(--accent)] focus:ring-4 focus:ring-amber-100"
                      form={formId}
                      name="paymentProof"
                      type="file"
                    />
                    <p className="mt-2 whitespace-nowrap text-xs text-stone-500">支持图片截图，单个文件最大 8MB。</p>
                  </td>
                  <td className="px-4 py-4">
                    <button className="whitespace-nowrap rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-black text-stone-950 shadow-sm transition hover:bg-amber-300" form={formId} type="submit">
                      提交付款凭证
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function BrandBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; invoice?: string; payment?: string; refund?: string; tab?: string }>;
}) {
  const session = await requireRole(UserRole.BRAND);
  const { error, invoice, payment, refund, tab } = await searchParams;
  const activeTab: BillingTab = isBillingTab(tab) ? tab : "todo";
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
  const needsPaymentProof = brand.invoices.filter((item) => ["REQUESTED", "OPEN"].includes(item.status));
  const waitingAdminConfirm = brand.invoices.filter((item) => item.status === "PAYMENT_SUBMITTED");
  const actionableInvoices = brand.invoices.filter((item) => item.status !== "PAID" && item.status !== "VOID" && item.status !== "REJECTED");
  const refundableBalance = Number(brand.budgetBalance);

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

      <Card className="border-amber-200 bg-amber-50/70">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">预算待处理</p>
            <h2 className="mt-2 text-xl font-black text-stone-950">
              {needsPaymentProof.length > 0
                ? `还有 ${needsPaymentProof.length} 笔付款需要上传凭证`
                : waitingAdminConfirm.length > 0
                  ? `已有 ${waitingAdminConfirm.length} 笔付款等待 Admin 确认`
                  : refundableBalance > 0
                    ? "当前有可用余额，可继续投放或申请退款"
                    : "当前没有必须处理的资金动作"}
            </h2>
            <p className="mt-1 text-sm text-stone-600">V1 主路径是按 Campaign 付款；余额充值只作为补充资金池。</p>
          </div>
          <div className="grid gap-2 text-sm font-semibold text-stone-700 sm:grid-cols-3">
            <span className="rounded-xl bg-white/80 px-3 py-2">待上传凭证：{needsPaymentProof.length}</span>
            <span className="rounded-xl bg-white/80 px-3 py-2">待平台确认：{waitingAdminConfirm.length}</span>
            <span className="rounded-xl bg-white/80 px-3 py-2">可退余额：{money(refundableBalance, "CNY")}</span>
          </div>
        </div>
      </Card>

      <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-[var(--line)] bg-white/78 p-2 shadow-sm">
        {billingTabs.map((item) => (
          <BillingTabLink activeTab={activeTab} key={item.value} tab={item} />
        ))}
      </nav>

      {activeTab === "todo" ? (
        <div className="grid gap-4">
          {actionableInvoices.length ? (
            <PaymentProofTable invoices={actionableInvoices} />
          ) : (
            <Card>
              <h2 className="text-xl font-black">当前无付款待办</h2>
              <p className="mt-2 text-sm text-stone-600">可以继续查看付款单、资金流水或申请余额退款。</p>
            </Card>
          )}
        </div>
      ) : null}

      {activeTab === "invoices" ? (
        <div className="grid gap-4">
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
                <SubmitButton pendingLabel="正在提交..." variant="secondary">提交付款申请</SubmitButton>
              </div>
            </form>
          </Card>

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
        </div>
      ) : null}

      {activeTab === "escrow" ? (
        <section>
          <h2 className="mb-3 text-xl font-semibold">Campaign 资金占用</h2>
          <DataTable
            headers={["Campaign", "状态", "总预算", "已托管", "已释放", "剩余托管", "下一步"]}
            rows={brand.campaigns.map((campaign) => {
              const escrowAmount = Number(campaign.escrowAmount || campaign.totalBudget);
              const frozenAmount = Number(campaign.escrowFrozenAmount);
              const releasedAmount = Number(campaign.escrowReleasedAmount);
              const remainingEscrow = Math.max(0, frozenAmount - releasedAmount);
              return [
                campaign.title,
                <StatusBadge key="s">{campaign.status}</StatusBadge>,
                money(campaign.totalBudget, campaign.currency),
                money(frozenAmount, campaign.currency),
                money(releasedAmount, campaign.currency),
                money(remainingEscrow, campaign.currency),
                frozenAmount < escrowAmount ? "等待付款确认并托管" : remainingEscrow > 0 ? "等待验收释放或结束退回" : "暂无资金占用",
              ];
            })}
          />
        </section>
      ) : null}

      {activeTab === "ledger" ? (
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
      ) : null}

      {activeTab === "refunds" ? (
        <div className="grid gap-4">
          <Card>
            <h2 className="text-xl font-black">申请余额退款</h2>
            <p className="mt-2 text-sm text-stone-600">仅可退回可用余额，已冻结在进行中 Campaign 的托管金额不能直接退款。</p>
            <form action={requestBrandRefundAction} className="mt-5 grid gap-4">
              <Field label="退款金额" name="amount" type="number" required defaultValue={20} />
              <Field label="退款方式" name="payoutMethod" required defaultValue="人工转账" />
              <Textarea label="收款信息" name="payoutDetails" rows={4} required placeholder="请填写收款账号、户名或其它人工处理所需信息。" />
              <SubmitButton pendingLabel="正在提交..." variant="secondary">提交退款申请</SubmitButton>
            </form>
          </Card>

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
      ) : null}

      {activeTab === "rules" ? (
        <Card>
          <h2 className="text-xl font-black">账单与托管规则</h2>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-stone-600 md:grid-cols-2">
            <p>V1 主路径是按 Campaign 付款，余额充值只作为补充资金池。</p>
            <p>Campaign 上线前必须完成付款确认或余额托管，不允许未托管先上线。</p>
            <p>商家提交付款截图和交易订单号后，由 Admin 人工确认入账。</p>
            <p>Campaign 创建或上架时冻结托管，KOL 验收通过后逐步释放。</p>
            <p>平台服务费从广告方预算中确认，不从 KOL 收益中二次扣除。</p>
            <p>Campaign 手动结束或到期归档后，未使用托管退回品牌可用余额。</p>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
