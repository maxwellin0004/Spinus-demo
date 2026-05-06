import { approveEarningAction, updateInvoiceStatusAction, updateWithdrawalAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { Button, Card, DataTable, LinkButton, PageHeader, StatusBadge, Textarea } from "@/components/ui";
import { money, shortDate } from "@/lib/format";
import { demoWhere, getAdminContext, hasAdminPermission } from "@/lib/admin";

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const context = await getAdminContext();
  const { demo } = await searchParams;
  const canSeeDemo = hasAdminPermission(context.profile, "demo.manage");
  const [earnings, withdrawals, invoices] = await Promise.all([
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
  ]);
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="管理端" title="钱包与结算">
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
        <h2 className="mb-3 text-xl font-semibold">品牌发票与预算入账</h2>
        <DataTable
          headers={["Brand", "Campaign", "Invoice", "Amount", "Status", "Proof", "Created"]}
          rows={invoices.map((invoice) => [
            invoice.brand.brandName,
            invoice.campaign?.title ?? "-",
            invoice.invoiceNumber ?? "-",
            money(invoice.amount, invoice.currency),
            <StatusBadge key="s">{invoice.status}</StatusBadge>,
            invoice.paymentProofUrl ? <a className="font-semibold text-stone-950" href={invoice.paymentProofUrl} key={invoice.id}>查看</a> : "-",
            shortDate(invoice.createdAt),
          ])}
        />
      </section>
      <div className="grid gap-4">
        {invoices.map((invoice) => (
          <Card key={invoice.id}>
            <form action={updateInvoiceStatusAction.bind(null, invoice.id)} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <Textarea label={`${invoice.brand.brandName} invoice note`} name="note" defaultValue={invoice.note ?? ""} rows={2} />
              <div className="flex flex-wrap gap-2">
                <Button name="action" value="issue" variant="ghost">开票/打开</Button>
                <Button name="action" value="paid" variant="secondary">确认已付款</Button>
                <Button name="action" value="reject" variant="danger">拒绝</Button>
                <Button name="action" value="void" variant="ghost">作废</Button>
              </div>
            </form>
          </Card>
        ))}
      </div>
      <section>
        <h2 className="mb-3 text-xl font-semibold">收益记录</h2>
        <DataTable
          headers={["Creator", "Campaign", "Amount", "Status", "Created", "Action"]}
          rows={earnings.map((earning) => [
            earning.creator.displayName,
            earning.relatedSubmission?.campaign.title ?? "-",
            money(earning.amount, earning.currency),
            <StatusBadge key="s">{earning.status}</StatusBadge>,
            shortDate(earning.createdAt),
            earning.status === "PENDING" ? (
              <form action={approveEarningAction.bind(null, earning.id)} key={earning.id}>
                <Button variant="secondary">确认收益</Button>
              </form>
            ) : "-",
          ])}
        />
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold">提现申请</h2>
        <DataTable
          headers={["Creator", "Amount", "Method", "Status", "Created"]}
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
        {withdrawals.map((request) => (
          <Card key={request.id}>
            <form action={updateWithdrawalAction.bind(null, request.id)} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <Textarea label={`${request.creator.displayName} payout note`} name="adminNote" defaultValue={request.adminNote ?? ""} rows={2} />
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
