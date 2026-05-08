import { updateBrandRefundAction, updateInvoiceStatusAction, updateWithdrawalAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { Button, Card, DataTable, LinkButton, PageHeader, StatusBadge, Textarea } from "@/components/ui";
import { money, shortDate } from "@/lib/format";
import { demoWhere, getAdminContext, hasAdminPermission } from "@/lib/admin";

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const context = await getAdminContext();
  const { demo } = await searchParams;
  const canSeeDemo = hasAdminPermission(context.profile, "demo.manage");
  const [earnings, withdrawals, invoices, refunds, ledgers] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { type: "EARNING", ...demoWhere(demo, canSeeDemo) },
      include: { creator: true, relatedSubmission: { include: { campaign: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.withdrawalRequest.findMany({
      where: demoWhere(demo, canSeeDemo),
      include: { creator: true, wallet: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.findMany({
      where: demoWhere(demo, canSeeDemo),
      include: { brand: true, campaign: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.brandRefundRequest.findMany({
      where: demoWhere(demo, canSeeDemo),
      include: { brand: true, campaign: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.brandLedgerTransaction.findMany({
      include: { brand: true, campaign: true },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
  ]);

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="管理端" title="财务中心">
        <LinkButton href="/api/admin/finance.csv" variant="ghost">导出财务流水 CSV</LinkButton>
        <LinkButton href="/api/admin/withdrawals.csv" variant="ghost">导出提现 CSV</LinkButton>
      </PageHeader>

      <form className="flex flex-wrap gap-3">
        <select className="rounded-full border border-stone-200 px-4 py-3" name="demo" defaultValue={demo ?? "real"}>
          <option value="real">只看真实数据</option>
          {canSeeDemo ? <option value="include">包含演示数据</option> : null}
          {canSeeDemo ? <option value="only">只看演示数据</option> : null}
        </select>
        <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white">筛选</button>
      </form>

      <section>
        <h2 className="mb-3 text-xl font-semibold">商家付款与托管确认</h2>
        <DataTable
          headers={["商家", "Campaign", "付款单", "金额", "状态", "交易订单号", "凭证", "创建时间"]}
          rows={invoices.map((invoice) => [
            invoice.brand.brandName,
            invoice.campaign?.title ?? "-",
            invoice.invoiceNumber ?? "-",
            money(invoice.amount, invoice.currency),
            <StatusBadge key="s">{invoice.status}</StatusBadge>,
            invoice.paymentReference ?? "-",
            invoice.paymentProofUrl ? <a className="font-semibold text-stone-950" href={invoice.paymentProofUrl} key={invoice.id}>查看</a> : "-",
            shortDate(invoice.createdAt),
          ])}
        />
      </section>

      <div className="grid gap-4">
        {invoices
          .filter((invoice) => invoice.status !== "PAID" && invoice.status !== "VOID" && invoice.status !== "REJECTED")
          .map((invoice) => (
            <Card key={invoice.id}>
              <form action={updateInvoiceStatusAction.bind(null, invoice.id)} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                <Textarea label={`${invoice.brand.brandName} 付款备注`} name="note" defaultValue={invoice.note ?? ""} rows={2} />
                <div className="flex flex-wrap gap-2">
                  <Button name="action" value="issue" variant="ghost">打开发票/付款单</Button>
                  <Button name="action" value="paid" variant="secondary">确认已付款</Button>
                  <Button name="action" value="reject" variant="danger">拒绝</Button>
                  <Button name="action" value="void" variant="ghost">作废</Button>
                </div>
              </form>
            </Card>
          ))}
      </div>

      <section>
        <h2 className="mb-3 text-xl font-semibold">商家退款申请</h2>
        <DataTable
          headers={["商家", "金额", "方式", "状态", "Campaign", "创建时间"]}
          rows={refunds.map((request) => [
            request.brand.brandName,
            money(request.amount, request.currency),
            request.payoutMethod ?? "-",
            <StatusBadge key="s">{request.status}</StatusBadge>,
            request.campaign?.title ?? "-",
            shortDate(request.createdAt),
          ])}
        />
      </section>

      <div className="grid gap-4">
        {refunds
          .filter((request) => request.status !== "PAID" && request.status !== "REJECTED")
          .map((request) => (
            <Card key={request.id}>
              <form action={updateBrandRefundAction.bind(null, request.id)} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                <Textarea label={`${request.brand.brandName} 退款处理备注`} name="adminNote" defaultValue={request.adminNote ?? ""} rows={2} />
                <div className="flex flex-wrap gap-2">
                  <Button name="action" value="approve" variant="ghost">通过</Button>
                  <Button name="action" value="paid" variant="secondary">标记已退款</Button>
                  <Button name="action" value="reject" variant="danger">拒绝</Button>
                </div>
              </form>
            </Card>
          ))}
      </div>

      <section>
        <h2 className="mb-3 text-xl font-semibold">商家资金流水</h2>
        <DataTable
          headers={["商家", "Campaign", "类型", "金额", "状态", "余额前", "余额后", "时间"]}
          rows={ledgers.map((ledger) => [
            ledger.brand.brandName,
            ledger.campaign?.title ?? "-",
            ledger.type,
            money(ledger.amount, ledger.currency),
            <StatusBadge key="s">{ledger.status}</StatusBadge>,
            money(ledger.beforeBalance, ledger.currency),
            money(ledger.afterBalance, ledger.currency),
            shortDate(ledger.createdAt),
          ])}
        />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">KOL 收益入账记录</h2>
        <DataTable
          headers={["KOL", "Campaign", "金额", "状态", "创建时间"]}
          rows={earnings.map((earning) => [
            earning.creator.displayName,
            earning.relatedSubmission?.campaign.title ?? "-",
            money(earning.amount, earning.currency),
            <StatusBadge key="s">{earning.status}</StatusBadge>,
            shortDate(earning.createdAt),
          ])}
        />
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">KOL 提现申请</h2>
        <DataTable
          headers={["KOL", "金额", "方式", "状态", "创建时间"]}
          rows={withdrawals.map((request) => [
            request.creator.displayName,
            money(request.amount, request.currency),
            request.payoutMethod,
            <StatusBadge key="s">{request.status}</StatusBadge>,
            shortDate(request.createdAt),
          ])}
        />
      </section>

      <div className="grid gap-4">
        {withdrawals
          .filter((request) => request.status !== "PAID" && request.status !== "REJECTED")
          .map((request) => (
            <Card key={request.id}>
              <form action={updateWithdrawalAction.bind(null, request.id)} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                <Textarea label={`${request.creator.displayName} 提现备注`} name="adminNote" defaultValue={request.adminNote ?? ""} rows={2} />
                <div className="flex flex-wrap gap-2">
                  <Button name="action" value="approve" variant="ghost">通过</Button>
                  <Button name="action" value="paid" variant="secondary">标记已打款</Button>
                  <Button name="action" value="reject" variant="danger">拒绝</Button>
                </div>
              </form>
            </Card>
          ))}
      </div>
    </div>
  );
}
