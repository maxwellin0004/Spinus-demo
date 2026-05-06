import { ApplicationStatus, SubmissionStatus, UserRole, WalletTxStatus, WalletTxType } from "@prisma/client";
import { requestWithdrawalAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button, Card, DataTable, Field, MetricCard, PageHeader, StatusBadge, Textarea } from "@/components/ui";
import { money, shortDate } from "@/lib/format";

export default async function CreatorWalletPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; requested?: string }>;
}) {
  const session = await requireRole(UserRole.CREATOR);
  const { error, requested } = await searchParams;
  const creator = await prisma.creatorProfile.findUnique({
    where: { userId: session.userId },
    include: {
      applications: { include: { task: { include: { campaign: true } }, submissions: { orderBy: { createdAt: "desc" }, take: 1 } } },
      wallet: { include: { transactions: { orderBy: { createdAt: "desc" } }, withdrawalRequests: { orderBy: { createdAt: "desc" } } } },
    },
  });
  if (!creator?.wallet) return <PageHeader title="缺少钱包" />;
  const currency = creator.wallet.currency;
  const estimatedIncome = creator.applications
    .filter((application) => application.status === ApplicationStatus.APPLIED)
    .reduce((sum, application) => sum + Number(application.task.rewardAmount), 0);
  const reviewStatuses: SubmissionStatus[] = [SubmissionStatus.SUBMITTED, SubmissionStatus.PROOF_SUBMITTED];
  const pendingReviewIncome = creator.applications
    .filter((application) => {
      const latest = application.submissions[0];
      return latest && reviewStatuses.includes(latest.status);
    })
    .reduce((sum, application) => sum + Number(application.task.rewardAmount), 0);
  const pendingSettlementIncome = creator.wallet.transactions
    .filter((tx) => tx.type === WalletTxType.EARNING && tx.status === WalletTxStatus.PENDING)
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  const availableBalance = Number(creator.wallet.availableBalance);
  const frozenWithdrawal = Number(creator.wallet.frozenBalance);
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="创作者" title="钱包与提现" />
      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
      {requested ? <div className="rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-700">提现申请已提交。</div> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="预计收入" value={money(estimatedIncome, currency)} sub="已申请但尚未通过，不计入钱包。" />
        <MetricCard label="待审核收入" value={money(pendingReviewIncome, currency)} sub="内容或 Proof 正在审核中。" />
        <MetricCard label="待结算收入" value={money(pendingSettlementIncome, currency)} sub="Proof 已验证，等待 Admin 确认入账。" />
        <MetricCard label="Available balance" value={money(availableBalance, currency)} sub="可立即申请提现。" />
        <MetricCard label="Frozen balance" value={money(frozenWithdrawal, currency)} sub="提现申请处理中，暂时冻结。" />
      </div>
      <Card>
        <h2 className="text-xl font-black">收益口径说明</h2>
        <div className="mt-4 grid gap-3 text-sm text-stone-600 md:grid-cols-2 xl:grid-cols-4">
          <p><span className="font-black text-stone-950">预计收入：</span>任务申请中，金额仅用于预估，不代表已获得。</p>
          <p><span className="font-black text-stone-950">待审核收入：</span>内容或发布证明正在等待品牌/Admin 审核。</p>
          <p><span className="font-black text-stone-950">待结算收入：</span>Proof 已通过，平台待确认打入钱包。</p>
          <p><span className="font-black text-stone-950">可提现/冻结：</span>可提现余额可申请提现，冻结金额来自处理中的提现单。</p>
        </div>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Cumulative income" value={money(creator.wallet.cumulativeIncome, currency)} />
        <MetricCard label="Cumulative withdrawn" value={money(creator.wallet.cumulativeWithdrawn, currency)} />
        <MetricCard label="提现处理中" value={creator.wallet.withdrawalRequests.filter((item) => item.status === "PENDING" || item.status === "APPROVED").length} />
        <MetricCard label="任务收益流水" value={creator.wallet.transactions.filter((tx) => tx.type === WalletTxType.EARNING).length} />
      </div>
      <Card>
        <h2 className="text-xl font-semibold">申请提现</h2>
        <form action={requestWithdrawalAction} className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Amount" name="amount" type="number" required />
          <Field label="Payout method" name="payoutMethod" defaultValue="USDT" />
          <div className="md:col-span-2"><Textarea label="收款信息" name="payoutDetails" placeholder="USDT 钱包地址或银行信息" /></div>
          <div className="md:col-span-2"><Button variant="secondary">提交提现</Button></div>
        </form>
      </Card>
      <section>
        <h2 className="mb-3 text-xl font-semibold">交易流水</h2>
        <DataTable
          headers={["Type", "Amount", "Status", "说明", "Created"]}
          rows={creator.wallet.transactions.map((tx) => [
            tx.type,
            money(tx.amount, tx.currency),
            <StatusBadge key="s">{tx.status}</StatusBadge>,
            tx.note ?? "-",
            shortDate(tx.createdAt),
          ])}
        />
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold">提现记录</h2>
        <DataTable
          headers={["Amount", "Method", "Status", "Admin note", "Created"]}
          rows={creator.wallet.withdrawalRequests.map((request) => [
            money(request.amount, request.currency),
            request.payoutMethod,
            <StatusBadge key="s">{request.status}</StatusBadge>,
            request.adminNote ?? "-",
            shortDate(request.createdAt),
          ])}
        />
      </section>
    </div>
  );
}
