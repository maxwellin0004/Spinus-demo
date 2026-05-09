import Link from "next/link";
import { ApplicationStatus, SubmissionStatus, UserRole, WalletTxStatus, WalletTxType, WithdrawalStatus } from "@prisma/client";
import { requestWithdrawalAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubmitButton } from "@/components/form-controls";
import { Card, DataTable, Field, MetricCard, PageHeader, Select, StatusBadge, Textarea, WorkflowHint } from "@/components/ui";
import { money, shortDate } from "@/lib/format";

function txNextStep(type: WalletTxType, status: WalletTxStatus) {
  if (type === WalletTxType.EARNING && status === WalletTxStatus.APPROVED) {
    return { title: "已入账", body: "金额已进入可提现余额。", tone: "success" as const };
  }
  if (type === WalletTxType.WITHDRAWAL && status === WalletTxStatus.PAID) {
    return { title: "已提现", body: "平台已完成线下打款。", tone: "success" as const };
  }
  if (status === WalletTxStatus.PENDING) return { title: "处理中", body: "等待平台或商家确认。", tone: "warning" as const };
  if (status === WalletTxStatus.REJECTED || status === WalletTxStatus.FAILED) return { title: "异常", body: "查看说明或联系运营。", tone: "danger" as const };
  return { title: "查看记录", body: "该流水无需你处理。", tone: "default" as const };
}

function withdrawalNextStep(status: WithdrawalStatus) {
  if (status === WithdrawalStatus.PENDING) return { title: "等待审核", body: "平台会人工核对金额和收款信息。", tone: "warning" as const };
  if (status === WithdrawalStatus.APPROVED) return { title: "等待打款", body: "平台线下打款后会标记完成。", tone: "warning" as const };
  if (status === WithdrawalStatus.PAID) return { title: "已完成", body: "提现流程已结束。", tone: "success" as const };
  return { title: "已拒绝", body: "查看平台备注后重新提交。", tone: "danger" as const };
}

export default async function CreatorWalletPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; requested?: string }>;
}) {
  const session = await requireRole(UserRole.CREATOR);
  const { error, requested } = await searchParams;
  const [creator, settings] = await Promise.all([
    prisma.creatorProfile.findUnique({
      where: { userId: session.userId },
      include: {
        applications: {
          include: {
            task: { include: { campaign: true } },
            submissions: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
        wallet: {
          include: {
            transactions: {
              include: {
                relatedSubmission: {
                  include: {
                    campaign: true,
                    application: { include: { task: true } },
                  },
                },
              },
              orderBy: { createdAt: "desc" },
            },
            withdrawalRequests: { orderBy: { createdAt: "desc" } },
          },
        },
      },
    }),
    prisma.platformSettings.upsert({ where: { id: "platform" }, update: {}, create: { id: "platform" } }),
  ]);

  if (!creator?.wallet) return <PageHeader title="缺少钱包" />;

  const currency = "CNY";
  const estimatedIncome = creator.applications
    .filter((application) => application.status === ApplicationStatus.APPLIED)
    .reduce((sum, application) => sum + Number(application.task.rewardAmount), 0);
  const pendingReviewIncome = creator.applications
    .filter((application) => {
      const latest = application.submissions[0];
      const reviewStatuses: SubmissionStatus[] = [SubmissionStatus.SUBMITTED, SubmissionStatus.PROOF_SUBMITTED];
      return latest && reviewStatuses.includes(latest.status);
    })
    .reduce((sum, application) => sum + Number(application.task.rewardAmount), 0);
  const creditedIncome = creator.wallet.transactions
    .filter((tx) => tx.type === WalletTxType.EARNING && tx.status === WalletTxStatus.APPROVED)
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  const availableBalance = Number(creator.wallet.availableBalance);
  const frozenWithdrawal = Number(creator.wallet.frozenBalance);
  const minimumWithdrawalAmount = Number(settings.minimumWithdrawalAmount);
  const canWithdraw = availableBalance >= minimumWithdrawalAmount;
  const pendingWithdrawals = creator.wallet.withdrawalRequests.filter((item) => item.status === "PENDING" || item.status === "APPROVED");
  const rejectedWithdrawals = creator.wallet.withdrawalRequests.filter((item) => item.status === "REJECTED").length;

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="KOL 中心" title="钱包与提现">
        <StatusBadge>{currency}</StatusBadge>
        <StatusBadge>最低提现 ￥20</StatusBadge>
      </PageHeader>
      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
      {requested ? <div className="rounded-2xl bg-green-50 p-4 text-sm font-semibold text-green-700">提现申请已提交，等待平台人工处理。</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <MetricCard label="预计收入" value={money(estimatedIncome, currency)} sub="已申请但尚未通过，不计入钱包。" />
        <MetricCard label="待审核收入" value={money(pendingReviewIncome, currency)} sub="内容或发布链接正在审核中。" />
        <MetricCard label="已入账收入" value={money(creditedIncome, currency)} sub="商家验收通过后直接进入可提现余额。" />
        <MetricCard label="可提现余额" value={money(availableBalance, currency)} sub="可立即申请提现。" />
        <MetricCard label="冻结金额" value={money(frozenWithdrawal, currency)} sub="提现申请处理中，暂时冻结。" />
      </div>

      <Card>
        <h2 className="text-xl font-black">收益路径</h2>
        <div className="mt-4 grid gap-3 text-sm text-stone-600 md:grid-cols-2 xl:grid-cols-4">
          <p><span className="font-black text-stone-950">预计收入：</span>任务申请中，只用于预估。</p>
          <p><span className="font-black text-stone-950">待审核收入：</span>内容草稿或发布链接等待商家处理。</p>
          <p><span className="font-black text-stone-950">已入账收入：</span>商家验收通过后直接进入可提现余额。</p>
          <p><span className="font-black text-stone-950">可提现/冻结：</span>可提现余额可发起提现；冻结金额来自处理中提现单。</p>
        </div>
      </Card>

      <Card className="border-amber-200 bg-amber-50/70">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">钱包待处理</p>
            <h2 className="mt-2 text-xl font-black text-stone-950">
              {canWithdraw ? "当前余额可以申请提现" : pendingWithdrawals.length > 0 ? "提现申请正在人工处理" : "继续完成任务以获得可提现余额"}
            </h2>
            <p className="mt-1 text-sm text-stone-600">验收通过后收益直接进入可提现余额；提交提现后金额会先冻结，平台人工打款后标记完成。</p>
          </div>
          <div className="grid gap-2 text-sm font-semibold text-stone-700 sm:grid-cols-3">
            <span className="rounded-xl bg-white/80 px-3 py-2">处理中提现：{pendingWithdrawals.length}</span>
            <span className="rounded-xl bg-white/80 px-3 py-2">被拒提现：{rejectedWithdrawals}</span>
            <span className="rounded-xl bg-white/80 px-3 py-2">最低提现：{money(minimumWithdrawalAmount, currency)}</span>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="累计入账" value={money(creator.wallet.cumulativeIncome, currency)} />
        <MetricCard label="累计提现" value={money(creator.wallet.cumulativeWithdrawn, currency)} />
        <MetricCard label="提现处理中" value={creator.wallet.withdrawalRequests.filter((item) => item.status === "PENDING" || item.status === "APPROVED").length} />
        <MetricCard label="收益流水" value={creator.wallet.transactions.filter((tx) => tx.type === WalletTxType.EARNING).length} />
      </div>

      <Card>
        <h2 className="text-xl font-semibold">申请提现</h2>
        <p className="mt-2 text-sm text-stone-600">第一版只支持人民币提现申请，平台人工处理。提交后金额会先冻结。</p>
        <form action={requestWithdrawalAction} className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="提现金额" name="amount" type="number" required defaultValue={20} />
          <Select label="收款方式" name="payoutMethod" defaultValue="银行卡">
            <option>银行卡</option>
            <option>支付宝</option>
            <option>微信</option>
            <option>其他</option>
          </Select>
          <div className="md:col-span-2">
            <Textarea label="收款信息" name="payoutDetails" placeholder="开户行、银行卡号、姓名，或支付宝/微信收款账号" />
          </div>
          <div className="md:col-span-2">
            <SubmitButton disabled={!canWithdraw} pendingLabel="正在提交..." variant="secondary">提交提现</SubmitButton>
            {!canWithdraw ? <p className="mt-3 text-sm text-red-700">当前可提现余额不足 ￥20。</p> : null}
          </div>
        </form>
      </Card>

      <section className="min-w-0">
        <h2 className="mb-3 text-xl font-semibold">交易流水</h2>
        <DataTable
          headers={["类型", "金额", "状态", "关联任务", "说明", "创建时间", "下一步"]}
          emptyTitle="暂无交易流水"
          emptyBody="任务验收通过、提现冻结和打款完成后，会在这里生成记录。"
          rows={creator.wallet.transactions.map((tx) => {
            const nextStep = txNextStep(tx.type, tx.status);
            return [
              tx.type,
              money(tx.amount, currency),
              <StatusBadge key="s">{tx.status}</StatusBadge>,
              tx.relatedSubmission ? (
                <Link className="font-semibold text-stone-950" href={`/creator/my-tasks/${tx.relatedSubmission.applicationId}`} key={tx.id}>
                  {tx.relatedSubmission.campaign.title} / {tx.relatedSubmission.application.task.title}
                </Link>
              ) : (
                "-"
              ),
              tx.note ?? "-",
              shortDate(tx.createdAt),
              <WorkflowHint key={`next-${tx.id}`} title={nextStep.title} body={nextStep.body} tone={nextStep.tone} />,
            ];
          })}
        />
      </section>

      <section className="min-w-0">
        <h2 className="mb-3 text-xl font-semibold">提现记录</h2>
        <DataTable
          headers={["金额", "方式", "状态", "平台备注", "创建时间", "下一步"]}
          emptyTitle="暂无提现记录"
          emptyBody="提交提现申请后，记录会显示审核、打款和完成状态。"
          rows={creator.wallet.withdrawalRequests.map((request) => {
            const nextStep = withdrawalNextStep(request.status);
            return [
              money(request.amount, currency),
              request.payoutMethod,
              <StatusBadge key="s">{request.status}</StatusBadge>,
              request.adminNote ?? "-",
              shortDate(request.createdAt),
              <WorkflowHint key={`next-${request.id}`} title={nextStep.title} body={nextStep.body} tone={nextStep.tone} />,
            ];
          })}
        />
      </section>
    </div>
  );
}
