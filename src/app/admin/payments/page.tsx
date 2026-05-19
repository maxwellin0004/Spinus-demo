import { BrandLedgerTxStatus, BrandLedgerTxType, InvoiceStatus, WithdrawalStatus } from "@prisma/client";
import type { ReactNode } from "react";
import { refreshInvoicePaymentStatusAction, resolvePaymentProviderEventAction, updateBrandRefundAction, updateInvoiceStatusAction, updateWithdrawalAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { AdminSettingsAccordion, AdminSettingsAccordionSection } from "@/components/admin-settings-accordion";
import { AdminInfoPanel, AdminMetricGrid, AdminNotice } from "@/components/admin-workbench";
import { SubmitButton } from "@/components/form-controls";
import { DataTable, LinkButton, PageHeader, StatusBadge, WorkflowHint } from "@/components/ui";
import { money, shortDate } from "@/lib/format";
import { demoWhere, hasAdminPermission, requireAdminPermission } from "@/lib/admin";

type MoneyValue = number | string | { toString(): string } | null | undefined;

function Nowrap({ children, className = "min-w-[7rem]" }: { children: ReactNode; className?: string }) {
  return <span className={`inline-block whitespace-nowrap ${className}`}>{children}</span>;
}

function invoiceNextStep(status: string, amount: MoneyValue, currency: string, hasRisk: boolean) {
  if (hasRisk) return { title: "先核对风险", body: "订单号存在重复提交提示，确认后再入账。", tone: "warning" as const };
  if (status === InvoiceStatus.PAYMENT_SUBMITTED) return { title: "核对凭证", body: `确认后品牌余额增加 ${money(amount, currency)}。`, tone: "warning" as const };
  if (status === InvoiceStatus.REQUESTED || status === InvoiceStatus.OPEN) return { title: "等待付款", body: "品牌提交订单号和凭证后再确认。", tone: "default" as const };
  if (status === InvoiceStatus.PAID) return { title: "已入账", body: "品牌余额已更新。", tone: "success" as const };
  if (status === InvoiceStatus.REJECTED || status === InvoiceStatus.VOID) return { title: "已关闭", body: "无需继续处理。", tone: "danger" as const };
  return { title: "查看状态", body: "按付款单状态处理。", tone: "default" as const };
}

function refundNextStep(status: string, amount: MoneyValue, currency: string) {
  if (status === "PAID") return { title: "已退款", body: "无需继续处理。", tone: "success" as const };
  if (status === "REJECTED") return { title: "已拒绝", body: "等待品牌重新沟通。", tone: "danger" as const };
  return { title: "人工退款", body: `线下退款 ${money(amount, currency)} 后标记已退款。`, tone: "warning" as const };
}

function withdrawalNextStep(status: string, amount: MoneyValue, currency: string) {
  if (status === "PAID") return { title: "已打款", body: "提现流程已完成。", tone: "success" as const };
  if (status === "REJECTED") return { title: "已拒绝", body: "无需继续打款。", tone: "danger" as const };
  if (status === "APPROVED") return { title: "线下打款", body: `打款 ${money(amount, currency)} 后标记已打款。`, tone: "warning" as const };
  return { title: "先审核", body: "确认账户和金额后通过或拒绝。", tone: "warning" as const };
}

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<{ demo?: string; paymentReference?: string; error?: string }> }) {
  const context = await requireAdminPermission("payment.view");
  const { demo, paymentReference, error } = await searchParams;
  const canSeeDemo = hasAdminPermission(context.profile, "demo.manage");
  const canConfirmPayments = hasAdminPermission(context.profile, "payment.confirm");
  const canReviewRefunds = hasAdminPermission(context.profile, "payment.refund.review");
  const canExecuteRefunds = hasAdminPermission(context.profile, "payment.refund.execute");
  const referenceQuery = paymentReference?.trim();
  const [earnings, withdrawals, invoices, refunds, ledgers, providerEvents] = await Promise.all([
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
      where: {
        ...demoWhere(demo, canSeeDemo),
        ...(referenceQuery ? { paymentReference: { contains: referenceQuery, mode: "insensitive" } } : {}),
      },
      include: { brand: true, campaign: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.brandRefundRequest.findMany({
      where: demoWhere(demo, canSeeDemo),
      include: { brand: true, campaign: true, relatedInvoice: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.brandLedgerTransaction.findMany({
      include: { brand: true, campaign: true },
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
    prisma.paymentProviderEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 80,
    }),
  ]);
  const pendingInvoiceStatuses: InvoiceStatus[] = [InvoiceStatus.REQUESTED, InvoiceStatus.OPEN, InvoiceStatus.PAYMENT_SUBMITTED];
  const pendingInvoices = invoices.filter((invoice) => pendingInvoiceStatuses.includes(invoice.status));
  const invoiceRiskFlags = invoices.length
    ? await prisma.riskFlag.findMany({
        where: {
          entityType: "invoice",
          entityId: { in: invoices.map((invoice) => invoice.id) },
          reason: { startsWith: "重复交易订单号提交被拦截" },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const invoiceRiskById = new Map<string, typeof invoiceRiskFlags>();
  for (const flag of invoiceRiskFlags) {
    invoiceRiskById.set(flag.entityId, [...(invoiceRiskById.get(flag.entityId) ?? []), flag]);
  }
  const invoiceDuplicateLogs = invoices.length
    ? await prisma.auditLog.findMany({
        where: {
          entityType: "invoice",
          entityId: { in: invoices.map((invoice) => invoice.id) },
          action: "invoice.payment_reference_duplicate_blocked",
        },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const invoiceDuplicateLogsById = new Map<string, typeof invoiceDuplicateLogs>();
  for (const log of invoiceDuplicateLogs) {
    invoiceDuplicateLogsById.set(log.entityId, [...(invoiceDuplicateLogsById.get(log.entityId) ?? []), log]);
  }
  const paymentRiskFlags = await prisma.riskFlag.findMany({
    where: {
      entityType: "invoice",
      OR: [
        { reason: { contains: "amount mismatch", mode: "insensitive" } },
        { reason: { startsWith: "重复交易订单号提交被拦截" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  const paymentFailureLogs = await prisma.auditLog.findMany({
    where: {
      entityType: "invoice",
      action: {
        in: [
          "invoice.payment_status_query_failed",
          "alipay.invoice_amount_mismatch",
          "wechat_pay.invoice_amount_mismatch",
          "invoice.payment_reference_duplicate_blocked",
        ],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  const abnormalInvoiceIds = Array.from(new Set([...paymentRiskFlags.map((flag) => flag.entityId), ...paymentFailureLogs.map((log) => log.entityId)]));
  const abnormalInvoices = abnormalInvoiceIds.length
    ? await prisma.invoice.findMany({
        where: { id: { in: abnormalInvoiceIds } },
        include: { brand: true, campaign: true },
      })
    : [];
  const abnormalInvoiceById = new Map(abnormalInvoices.map((invoice) => [invoice.id, invoice]));
  const paymentAbnormalRows = [
    ...paymentRiskFlags.map((flag) => ({
      id: `risk-${flag.id}`,
      invoiceId: flag.entityId,
      source: "RiskFlag",
      level: flag.level,
      message: flag.reason,
      createdAt: flag.createdAt,
    })),
    ...paymentFailureLogs.map((log) => ({
      id: `audit-${log.id}`,
      invoiceId: log.entityId,
      source: log.action,
      level: "MEDIUM",
      message: JSON.stringify(log.afterJson ?? {}),
      createdAt: log.createdAt,
    })),
    ...providerEvents
      .filter((event) => event.status === "FAILED")
      .map((event) => ({
        id: `provider-${event.id}`,
        invoiceId: event.entityType === "invoice" && event.entityId ? event.entityId : "",
        source: `${event.provider}.${event.eventType}`,
        level: "HIGH",
        message: event.errorMessage || JSON.stringify(event.responseJson ?? {}),
        createdAt: event.createdAt,
      })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 40);
  const submittedInvoices = invoices.filter((invoice) => invoice.status === InvoiceStatus.PAYMENT_SUBMITTED);
  const pendingRefunds = refunds.filter((request) => request.status !== "PAID" && request.status !== "REJECTED");
  const pendingWithdrawals = withdrawals.filter((request) => request.status === WithdrawalStatus.PENDING || request.status === WithdrawalStatus.APPROVED);
  const confirmedPayments = ledgers
    .filter((ledger) => ledger.type === BrandLedgerTxType.PAYMENT && ledger.status === BrandLedgerTxStatus.CONFIRMED)
    .reduce((sum, ledger) => sum + Number(ledger.amount), 0);
  const frozenEscrow = ledgers
    .filter((ledger) => ledger.type === BrandLedgerTxType.ESCROW_FREEZE && ledger.status === BrandLedgerTxStatus.CONFIRMED)
    .reduce((sum, ledger) => sum + Number(ledger.amount), 0);
  const platformFee = ledgers
    .filter((ledger) => ledger.type === BrandLedgerTxType.PLATFORM_FEE && ledger.status === BrandLedgerTxStatus.CONFIRMED)
    .reduce((sum, ledger) => sum + Number(ledger.amount), 0);
  const pendingWithdrawalAmount = pendingWithdrawals.reduce((sum, request) => sum + Number(request.amount), 0);
  const pendingRefundAmount = pendingRefunds.reduce((sum, request) => sum + Number(request.amount), 0);
  const failedProviderEvents = providerEvents.filter((event) => event.status === "FAILED");
  const pendingProviderEvents = providerEvents.filter((event) => event.status === "PENDING");
  const providerEventReviewRows = providerEvents.filter((event) => event.status === "FAILED" || event.status === "PENDING").slice(0, 30);
  const invoiceById = new Map(invoices.map((invoice) => [invoice.id, invoice]));
  const refundById = new Map(refunds.map((refund) => [refund.id, refund]));

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="管理端" title="财务中心">
        <LinkButton href="/api/admin/finance.csv" variant="ghost">导出财务流水 CSV</LinkButton>
        <LinkButton href="/api/admin/payment-reconciliation.csv" variant="ghost">导出支付对账 CSV</LinkButton>
        <LinkButton href="/api/admin/payment-provider-events.csv" variant="ghost">导出渠道事件 CSV</LinkButton>
        <LinkButton href="/api/admin/withdrawals.csv" variant="ghost">导出提现 CSV</LinkButton>
      </PageHeader>
      {error ? <AdminNotice tone="danger">{error}</AdminNotice> : null}

      <form className="flex flex-wrap gap-3">
        <input
          className="min-w-[16rem] rounded-full border border-stone-200 px-4 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-amber-100"
          name="paymentReference"
          defaultValue={referenceQuery ?? ""}
          placeholder="搜索交易订单号"
        />
        <select className="rounded-full border border-stone-200 px-4 py-3" name="demo" defaultValue={demo ?? "real"}>
          <option value="real">只看真实数据</option>
          {canSeeDemo ? <option value="include">包含演示数据</option> : null}
          {canSeeDemo ? <option value="only">只看演示数据</option> : null}
        </select>
        <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white">筛选</button>
        {referenceQuery ? (
          <a className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700" href="/admin/payments">清除筛选</a>
        ) : null}
      </form>
      {referenceQuery ? <p className="text-sm font-semibold text-stone-500">当前匹配 {invoices.length} 笔付款记录</p> : null}

      <AdminMetricGrid
        className="sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
        items={[
          { label: "待确认付款", value: money(pendingInvoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0), "CNY"), sub: `${pendingInvoices.length} 笔付款单` },
          { label: "已确认入账", value: money(confirmedPayments, "CNY"), sub: "品牌付款确认流水" },
          { label: "累计托管冻结", value: money(frozenEscrow, "CNY"), sub: "Campaign 上架前锁定" },
          { label: "平台服务费", value: money(platformFee, "CNY"), sub: "随验收逐步确认" },
          { label: "待人工打款", value: money(pendingWithdrawalAmount + pendingRefundAmount, "CNY"), sub: `${pendingWithdrawals.length} 个提现 / ${pendingRefunds.length} 个退款` },
          { label: "支付异常", value: paymentAbnormalRows.length, sub: `${failedProviderEvents.length} 渠道失败 / ${pendingProviderEvents.length} 待完成事件` },
        ]}
      />

      <AdminInfoPanel tone="warning">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">资金运营待处理</p>
            <h2 className="mt-2 text-xl font-black text-stone-950">
              {submittedInvoices.length + pendingWithdrawals.length + pendingRefunds.length} 个动作需要人工确认
            </h2>
            <p className="mt-1 text-sm text-stone-600">优先处理已上传凭证的付款单，其次处理 KOL 提现和品牌退款。</p>
          </div>
          <div className="grid gap-2 text-sm font-semibold text-stone-700 sm:grid-cols-3">
            <span className="rounded-xl bg-white/80 px-3 py-2">付款待确认：{submittedInvoices.length}</span>
            <span className="rounded-xl bg-white/80 px-3 py-2">提现待打款：{pendingWithdrawals.length}</span>
            <span className="rounded-xl bg-white/80 px-3 py-2">退款待处理：{pendingRefunds.length}</span>
          </div>
        </div>
      </AdminInfoPanel>

      <AdminSettingsAccordion defaultExpandedId="payment-provider-review">
        <AdminSettingsAccordionSection
          abnormal={providerEventReviewRows.length > 0}
          id="payment-provider-review"
          summary={`待复核事件 ${providerEventReviewRows.length} 条，失败 ${failedProviderEvents.length} 条，待完成 ${pendingProviderEvents.length} 条。`}
          title="支付失败复核队列"
          tone={providerEventReviewRows.length > 0 ? "warning" : "success"}
        >
      <section className="min-w-0">
        <h2 className="mb-3 text-xl font-semibold">支付失败复核队列</h2>
        <DataTable
          headers={["时间", "渠道事件", "状态", "关联对象", "错误", "处理"]}
          emptyTitle="暂无需要复核的支付事件"
          emptyBody="渠道回调、查单、退款请求或退款查询失败时，会集中出现在这里。"
          rows={providerEventReviewRows.map((event) => {
            const invoice = event.entityType === "invoice" && event.entityId ? invoiceById.get(event.entityId) : null;
            const refund = event.entityType === "brand_refund_request" && event.entityId ? refundById.get(event.entityId) : null;
            return [
              shortDate(event.createdAt),
              <div className="grid min-w-[12rem] gap-1" key={`${event.id}-event`}>
                <span className="font-black text-stone-900">{event.provider}</span>
                <span className="text-xs text-stone-500">{event.eventType}</span>
              </div>,
              <StatusBadge key={`${event.id}-status`}>{event.status}</StatusBadge>,
              <div className="grid min-w-[14rem] gap-1 text-sm" key={`${event.id}-entity`}>
                {invoice ? (
                  <>
                    <span className="font-semibold">{invoice.brand.brandName}</span>
                    <span className="text-xs text-stone-500">{invoice.paymentReference ?? invoice.invoiceNumber ?? invoice.id}</span>
                  </>
                ) : refund ? (
                  <>
                    <span className="font-semibold">{refund.brand.brandName}</span>
                    <span className="text-xs text-stone-500">{refund.providerRefundId ?? refund.id}</span>
                  </>
                ) : (
                  <span className="text-stone-500">{event.entityType && event.entityId ? `${event.entityType}:${event.entityId.slice(-8)}` : "-"}</span>
                )}
              </div>,
              <span className="inline-block min-w-[18rem] max-w-[34rem] whitespace-normal text-sm text-stone-700" key={`${event.id}-error`}>
                {event.errorMessage ?? JSON.stringify(event.responseJson ?? {})}
              </span>,
              <div className="grid min-w-[13rem] gap-2" key={`${event.id}-action`}>
                {invoice?.paymentReference?.startsWith("ALIPAY-") || invoice?.paymentReference?.startsWith("WECHAT-") ? (
                  <form action={refreshInvoicePaymentStatusAction.bind(null, invoice.id)}>
                    <input name="returnTo" type="hidden" value="/admin/payments" />
                    <SubmitButton pendingLabel="查询中..." variant="secondary">重新查单</SubmitButton>
                  </form>
                ) : null}
                {canExecuteRefunds && refund?.providerRefundId && refund.status !== "PAID" && refund.status !== "REJECTED" ? (
                  <form action={updateBrandRefundAction.bind(null, refund.id)} className="grid gap-2">
                    <input name="confirmAction" type="hidden" value="yes" />
                    <input name="adminNote" type="hidden" value="从支付失败复核队列重新查询退款状态。" />
                    <SubmitButton name="action" pendingLabel="查询中..." value="query_refund" variant="secondary">重新查退款</SubmitButton>
                  </form>
                ) : null}
                <form action={resolvePaymentProviderEventAction.bind(null, event.id)} className="grid gap-2">
                  <input name="returnTo" type="hidden" value="/admin/payments" />
                  <input name="note" type="hidden" value="已由 Admin 在支付失败复核队列中确认，无需继续自动处理。" />
                  <SubmitButton pendingLabel="处理中..." variant="ghost">标记已复核</SubmitButton>
                </form>
              </div>,
            ];
          })}
        />
      </section>
        </AdminSettingsAccordionSection>

        <AdminSettingsAccordionSection
          abnormal={paymentAbnormalRows.length > 0}
          id="payment-abnormal"
          summary={`风险标记、失败日志与渠道异常共 ${paymentAbnormalRows.length} 条。`}
          title="支付异常"
          tone={paymentAbnormalRows.length > 0 ? "warning" : "success"}
        >
      <section className="min-w-0">
        <h2 className="mb-3 text-xl font-semibold">支付异常</h2>
        <DataTable
          headers={["时间", "等级", "来源", "品牌", "付款单", "交易订单号", "金额", "异常说明", "处理"]}
          emptyTitle="暂无支付异常"
          emptyBody="支付查询失败、金额不一致、重复订单号等异常会集中显示在这里。"
          rows={paymentAbnormalRows.map((row) => {
            const invoice = abnormalInvoiceById.get(row.invoiceId);
            return [
              shortDate(row.createdAt),
              <StatusBadge key={`${row.id}-level`}>{row.level}</StatusBadge>,
              <Nowrap key={`${row.id}-source`} className="min-w-[11rem]">{row.source}</Nowrap>,
              <Nowrap key={`${row.id}-brand`} className="min-w-[6rem]">{invoice?.brand.brandName ?? "-"}</Nowrap>,
              <Nowrap key={`${row.id}-invoice`} className="min-w-[8rem]">{invoice?.invoiceNumber ?? row.invoiceId.slice(-8)}</Nowrap>,
              <Nowrap key={`${row.id}-ref`} className="min-w-[13rem]">{invoice?.paymentReference ?? "-"}</Nowrap>,
              invoice ? money(invoice.amount, invoice.currency) : "-",
              <span className="inline-block min-w-[18rem] max-w-[32rem] whitespace-normal text-sm text-stone-700" key={`${row.id}-message`}>{row.message}</span>,
              invoice ? (
                <div className="grid min-w-[10rem] gap-2" key={`${row.id}-action`}>
                  {invoice.paymentReference?.startsWith("ALIPAY-") || invoice.paymentReference?.startsWith("WECHAT-") ? (
                    <form action={refreshInvoicePaymentStatusAction.bind(null, invoice.id)}>
                      <input name="returnTo" type="hidden" value="/admin/payments" />
                      <SubmitButton pendingLabel="查询中..." variant="ghost">重新查询</SubmitButton>
                    </form>
                  ) : null}
                  <a className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-center text-xs font-black text-stone-700" href={`/admin/payments?paymentReference=${encodeURIComponent(invoice.paymentReference ?? "")}`}>
                    查看付款单
                  </a>
                </div>
              ) : (
                "-"
              ),
            ];
          })}
        />
      </section>
        </AdminSettingsAccordionSection>

        <AdminSettingsAccordionSection
          abnormal={failedProviderEvents.length > 0 || pendingProviderEvents.length > 0}
          id="payment-provider-events"
          summary={`最近渠道事件 ${providerEvents.length} 条，失败 ${failedProviderEvents.length} 条，待完成 ${pendingProviderEvents.length} 条。`}
          title="支付渠道事件"
          tone={failedProviderEvents.length > 0 ? "warning" : pendingProviderEvents.length > 0 ? "info" : "success"}
        >
      <section className="min-w-0">
        <h2 className="mb-3 text-xl font-semibold">支付渠道事件</h2>
        <DataTable
          headers={["时间", "渠道", "类型", "状态", "关联对象", "幂等键", "错误"]}
          emptyTitle="暂无渠道事件"
          emptyBody="支付宝和微信支付的回调、查询、退款请求会记录在这里，用于排查重复回调和渠道失败。"
          rows={providerEvents.map((event) => [
            shortDate(event.createdAt),
            <Nowrap key={`${event.id}-provider`} className="min-w-[6rem]">{event.provider}</Nowrap>,
            <Nowrap key={`${event.id}-type`} className="min-w-[8rem]">{event.eventType}</Nowrap>,
            <StatusBadge key={`${event.id}-status`}>{event.status}</StatusBadge>,
            <Nowrap key={`${event.id}-entity`} className="min-w-[10rem]">{event.entityType && event.entityId ? `${event.entityType}:${event.entityId.slice(-8)}` : "-"}</Nowrap>,
            <span className="inline-block min-w-[18rem] max-w-[28rem] truncate text-xs text-stone-500" key={`${event.id}-key`}>{event.eventKey}</span>,
            <span className="inline-block min-w-[12rem] max-w-[24rem] whitespace-normal text-sm text-stone-700" key={`${event.id}-error`}>{event.errorMessage ?? "-"}</span>,
          ])}
        />
      </section>
        </AdminSettingsAccordionSection>

        <AdminSettingsAccordionSection
          abnormal={pendingInvoices.length > 0}
          id="invoice-review"
          summary={`付款单 ${invoices.length} 笔，待确认 ${pendingInvoices.length} 笔，重复风险 ${invoiceRiskFlags.length} 条。`}
          title="商家付款与托管确认"
          tone={pendingInvoices.length > 0 ? "warning" : "success"}
        >
      <section className="min-w-0">
        <h2 className="mb-3 text-xl font-semibold">商家付款与托管确认</h2>
        <DataTable
          headers={["商家", "Campaign", "付款单", "金额", "状态", "交易订单号", "凭证", "创建时间", "下一步", "操作"]}
          emptyTitle="暂无付款单"
          emptyBody="品牌提交预算申请或 Campaign 付款后，会在这里出现。"
          rows={invoices.map((invoice) => {
            const canAct = invoice.status !== InvoiceStatus.PAID && invoice.status !== InvoiceStatus.VOID && invoice.status !== InvoiceStatus.REJECTED;
            const duplicateFlags = invoiceRiskById.get(invoice.id) ?? [];
            const latestDuplicateFlag = duplicateFlags[0];
            const duplicateLogs = invoiceDuplicateLogsById.get(invoice.id) ?? [];
            const nextStep = invoiceNextStep(invoice.status, invoice.amount, invoice.currency, Boolean(latestDuplicateFlag));
            return [
              <Nowrap key={`${invoice.id}-brand`} className="min-w-[6rem]">{invoice.brand.brandName}</Nowrap>,
              <Nowrap key={`${invoice.id}-campaign`} className="min-w-[10rem]">{invoice.campaign?.title ?? "-"}</Nowrap>,
              <Nowrap key={`${invoice.id}-invoice`} className="min-w-[8rem]">{invoice.invoiceNumber ?? "-"}</Nowrap>,
              <Nowrap key={`${invoice.id}-amount`} className="min-w-[5rem]">{money(invoice.amount, invoice.currency)}</Nowrap>,
              <StatusBadge key="s">{invoice.status}</StatusBadge>,
              <div className="grid min-w-[13rem] gap-1" key={`${invoice.id}-reference`}>
                <span className="whitespace-nowrap">{invoice.paymentReference ?? "-"}</span>
                {latestDuplicateFlag ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-2 text-xs font-semibold text-red-700">
                    重复提示：该订单号有 {duplicateFlags.length} 次重复提交尝试。最近一次：{shortDate(latestDuplicateFlag.createdAt)}
                    {duplicateLogs.length ? (
                      <details className="mt-2 text-red-800">
                        <summary className="cursor-pointer">查看重复尝试详情</summary>
                        <div className="mt-2 grid gap-1">
                          {duplicateLogs.slice(0, 5).map((log) => (
                            <p key={log.id}>
                              {shortDate(log.createdAt)} / {log.actorRole ?? "-"} / {log.actorUserId?.slice(0, 8) ?? "-"}
                            </p>
                          ))}
                        </div>
                      </details>
                    ) : null}
                  </div>
                ) : null}
              </div>,
              invoice.paymentProofUrl ? <a className="inline-block min-w-[3rem] whitespace-nowrap font-semibold text-stone-950" href={invoice.paymentProofUrl} key={invoice.id}>查看</a> : "-",
              <Nowrap key={`${invoice.id}-created`} className="min-w-[7rem]">{shortDate(invoice.createdAt)}</Nowrap>,
              <WorkflowHint key={`${invoice.id}-next`} title={nextStep.title} body={nextStep.body} tone={nextStep.tone} />,
              canAct && canConfirmPayments ? (
                <details className="min-w-[18rem]" key={`${invoice.id}-action`}>
                  <summary className="cursor-pointer font-black text-stone-950">处理付款</summary>
                  {invoice.paymentReference?.startsWith("ALIPAY-") || invoice.paymentReference?.startsWith("WECHAT-") ? (
                    <form action={refreshInvoicePaymentStatusAction.bind(null, invoice.id)} className="mt-3">
                      <input name="returnTo" type="hidden" value="/admin/payments" />
                      <SubmitButton pendingLabel="查询中..." variant="ghost">查询渠道状态</SubmitButton>
                    </form>
                  ) : null}
                  <form action={updateInvoiceStatusAction.bind(null, invoice.id)} className="mt-3 grid gap-3">
                    <textarea
                      className="min-h-20 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm shadow-inner outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-amber-100"
                      name="note"
                      defaultValue={invoice.note ?? ""}
                      placeholder={`${invoice.brand.brandName} 付款备注`}
                    />
                    <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                      <input className="mt-0.5" name="confirmAction" required type="checkbox" value="yes" />
                      我已核对付款状态、金额、订单号和凭证，确认执行该操作。
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <SubmitButton name="action" pendingLabel="处理中..." value="issue" variant="ghost">打开发票/付款单</SubmitButton>
                      <SubmitButton name="action" pendingLabel="处理中..." value="paid" variant="secondary">确认已付款</SubmitButton>
                      <SubmitButton name="action" pendingLabel="处理中..." value="reject" variant="danger">拒绝</SubmitButton>
                      <SubmitButton name="action" pendingLabel="处理中..." value="void" variant="ghost">作废</SubmitButton>
                    </div>
                  </form>
                </details>
              ) : (
                <span className="inline-block whitespace-nowrap text-sm text-stone-500" key={`${invoice.id}-done`}>无需操作</span>
              ),
            ];
          })}
        />
      </section>
        </AdminSettingsAccordionSection>

        <AdminSettingsAccordionSection
          abnormal={pendingRefunds.length > 0}
          id="refund-review"
          summary={`退款申请 ${refunds.length} 笔，待处理 ${pendingRefunds.length} 笔，待退款金额 ${money(pendingRefundAmount, "CNY")}。`}
          title="商家退款申请"
          tone={pendingRefunds.length > 0 ? "warning" : "success"}
        >
      <section className="min-w-0">
        <h2 className="mb-3 text-xl font-semibold">商家退款申请</h2>
        <DataTable
          headers={["商家", "金额", "方式", "状态", "Campaign", "创建时间", "下一步", "操作"]}
          emptyTitle="暂无退款申请"
          emptyBody="Campaign 归档或人工发起退款后，会在这里处理。"
          rows={refunds.map((request) => {
            const canAct = request.status !== "PAID" && request.status !== "REJECTED";
            const nextStep = refundNextStep(request.status, request.amount, request.currency);
            return [
              <Nowrap key={`${request.id}-brand`} className="min-w-[6rem]">{request.brand.brandName}</Nowrap>,
              <Nowrap key={`${request.id}-amount`} className="min-w-[5rem]">{money(request.amount, request.currency)}</Nowrap>,
              <div className="grid min-w-[13rem] gap-1 text-sm" key={`${request.id}-method`}>
                <span className="font-semibold">{request.payoutMethod ?? "-"}</span>
                {request.relatedInvoice?.paymentReference ? <span className="text-xs text-stone-500">Original: {request.relatedInvoice.paymentReference}</span> : null}
                {request.providerRefundId ? <span className="text-xs text-stone-500">Refund: {request.providerRefundId}</span> : null}
                {request.providerRefundStatus ? <span className="text-xs font-semibold text-stone-700">Channel: {request.providerRefundStatus}</span> : null}
              </div>,
              <StatusBadge key="s">{request.status}</StatusBadge>,
              <Nowrap key={`${request.id}-campaign`} className="min-w-[10rem]">{request.campaign?.title ?? "-"}</Nowrap>,
              <Nowrap key={`${request.id}-created`} className="min-w-[7rem]">{shortDate(request.createdAt)}</Nowrap>,
              <WorkflowHint key={`${request.id}-next`} title={nextStep.title} body={nextStep.body} tone={nextStep.tone} />,
              canAct && (canReviewRefunds || canExecuteRefunds) ? (
                <details className="min-w-[17rem]" key={`${request.id}-action`}>
                  <summary className="cursor-pointer font-black text-stone-950">处理退款</summary>
                  <form action={updateBrandRefundAction.bind(null, request.id)} className="mt-3 grid gap-3">
                    <textarea
                      className="min-h-20 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm shadow-inner outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-amber-100"
                      name="adminNote"
                      defaultValue={request.adminNote ?? ""}
                      placeholder={`${request.brand.brandName} 退款处理备注`}
                    />
                    <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                      <input className="mt-0.5" name="confirmAction" required type="checkbox" value="yes" />
                      我已核对品牌余额、退款金额和线下处理结果，确认执行该操作。
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {canReviewRefunds ? <SubmitButton name="action" pendingLabel="处理中..." value="approve" variant="ghost">通过</SubmitButton> : null}
                      {canExecuteRefunds && (request.relatedInvoice?.paymentReference?.startsWith("ALIPAY-") || request.relatedInvoice?.paymentReference?.startsWith("WECHAT-")) ? (
                        <SubmitButton name="action" pendingLabel="退款中..." value="channel_refund" variant="secondary">原渠道退款</SubmitButton>
                      ) : null}
                      {canExecuteRefunds && request.providerRefundId ? (
                        <SubmitButton name="action" pendingLabel="查询中..." value="query_refund" variant="ghost">查询退款</SubmitButton>
                      ) : null}
                      {canExecuteRefunds ? <SubmitButton name="action" pendingLabel="处理中..." value="paid" variant="secondary">标记已退款</SubmitButton> : null}
                      {canReviewRefunds ? <SubmitButton name="action" pendingLabel="处理中..." value="reject" variant="danger">拒绝</SubmitButton> : null}
                    </div>
                  </form>
                </details>
              ) : (
                <span className="inline-block whitespace-nowrap text-sm text-stone-500" key={`${request.id}-done`}>无需操作</span>
              ),
            ];
          })}
        />
      </section>
        </AdminSettingsAccordionSection>

        <AdminSettingsAccordionSection
          id="brand-ledger"
          summary={`品牌资金流水最近 ${ledgers.length} 条，累计已确认收款 ${money(confirmedPayments, "CNY")}。`}
          title="商家资金流水"
          tone="neutral"
        >
      <section className="min-w-0">
        <h2 className="mb-3 text-xl font-semibold">商家资金流水</h2>
        <DataTable
          headers={["商家", "Campaign", "类型", "金额", "状态", "余额前", "余额后", "时间"]}
          rows={ledgers.map((ledger) => [
            <Nowrap key={`${ledger.id}-brand`} className="min-w-[6rem]">{ledger.brand.brandName}</Nowrap>,
            <Nowrap key={`${ledger.id}-campaign`} className="min-w-[10rem]">{ledger.campaign?.title ?? "-"}</Nowrap>,
            <Nowrap key={`${ledger.id}-type`} className="min-w-[10rem]">{ledger.type}</Nowrap>,
            <Nowrap key={`${ledger.id}-amount`} className="min-w-[5rem]">{money(ledger.amount, ledger.currency)}</Nowrap>,
            <StatusBadge key="s">{ledger.status}</StatusBadge>,
            <Nowrap key={`${ledger.id}-before`} className="min-w-[5rem]">{money(ledger.beforeBalance, ledger.currency)}</Nowrap>,
            <Nowrap key={`${ledger.id}-after`} className="min-w-[5rem]">{money(ledger.afterBalance, ledger.currency)}</Nowrap>,
            <Nowrap key={`${ledger.id}-created`} className="min-w-[7rem]">{shortDate(ledger.createdAt)}</Nowrap>,
          ])}
        />
      </section>
        </AdminSettingsAccordionSection>

        <AdminSettingsAccordionSection
          id="creator-earnings"
          summary={`KOL 收益入账最近 ${earnings.length} 条。`}
          title="KOL 收益入账记录"
          tone="neutral"
        >
      <section className="min-w-0">
        <h2 className="mb-3 text-xl font-semibold">KOL 收益入账记录</h2>
        <DataTable
          headers={["KOL", "Campaign", "金额", "状态", "创建时间"]}
          rows={earnings.map((earning) => [
            <Nowrap key={`${earning.id}-creator`} className="min-w-[7rem]">{earning.creator.displayName}</Nowrap>,
            <Nowrap key={`${earning.id}-campaign`} className="min-w-[10rem]">{earning.relatedSubmission?.campaign.title ?? "-"}</Nowrap>,
            <Nowrap key={`${earning.id}-amount`} className="min-w-[5rem]">{money(earning.amount, earning.currency)}</Nowrap>,
            <StatusBadge key="s">{earning.status}</StatusBadge>,
            <Nowrap key={`${earning.id}-created`} className="min-w-[7rem]">{shortDate(earning.createdAt)}</Nowrap>,
          ])}
        />
      </section>
        </AdminSettingsAccordionSection>

        <AdminSettingsAccordionSection
          abnormal={pendingWithdrawals.length > 0}
          id="creator-withdrawals"
          summary={`提现申请 ${withdrawals.length} 笔，待处理 ${pendingWithdrawals.length} 笔，待打款金额 ${money(pendingWithdrawalAmount, "CNY")}。`}
          title="KOL 提现申请"
          tone={pendingWithdrawals.length > 0 ? "warning" : "success"}
        >
      <section className="min-w-0">
        <h2 className="mb-3 text-xl font-semibold">KOL 提现申请</h2>
        <DataTable
          headers={["KOL", "金额", "方式", "状态", "创建时间", "下一步", "操作"]}
          emptyTitle="暂无提现申请"
          emptyBody="KOL 发起提现后，会在这里等待审核和线下打款。"
          rows={withdrawals.map((request) => {
            const canAct = request.status !== "PAID" && request.status !== "REJECTED";
            const nextStep = withdrawalNextStep(request.status, request.amount, request.currency);
            return [
              <Nowrap key={`${request.id}-creator`} className="min-w-[7rem]">{request.creator.displayName}</Nowrap>,
              <Nowrap key={`${request.id}-amount`} className="min-w-[5rem]">{money(request.amount, request.currency)}</Nowrap>,
              <Nowrap key={`${request.id}-method`} className="min-w-[7rem]">{request.payoutMethod}</Nowrap>,
              <StatusBadge key="s">{request.status}</StatusBadge>,
              <Nowrap key={`${request.id}-created`} className="min-w-[7rem]">{shortDate(request.createdAt)}</Nowrap>,
              <WorkflowHint key={`${request.id}-next`} title={nextStep.title} body={nextStep.body} tone={nextStep.tone} />,
              canAct && canConfirmPayments ? (
                <details className="min-w-[17rem]" key={`${request.id}-action`}>
                  <summary className="cursor-pointer font-black text-stone-950">处理提现</summary>
                  <form action={updateWithdrawalAction.bind(null, request.id)} className="mt-3 grid gap-3">
                    <textarea
                      className="min-h-20 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm shadow-inner outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-amber-100"
                      name="adminNote"
                      defaultValue={request.adminNote ?? ""}
                      placeholder={`${request.creator.displayName} 提现备注`}
                    />
                    <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                      <input className="mt-0.5" name="confirmAction" required type="checkbox" value="yes" />
                      我已核对 KOL 收款信息、提现金额和线下打款状态，确认执行该操作。
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <SubmitButton name="action" pendingLabel="处理中..." value="approve" variant="ghost">通过</SubmitButton>
                      <SubmitButton name="action" pendingLabel="处理中..." value="paid" variant="secondary">标记已打款</SubmitButton>
                      <SubmitButton name="action" pendingLabel="处理中..." value="reject" variant="danger">拒绝</SubmitButton>
                    </div>
                  </form>
                </details>
              ) : (
                <span className="inline-block whitespace-nowrap text-sm text-stone-500" key={`${request.id}-done`}>无需操作</span>
              ),
            ];
          })}
        />
      </section>
        </AdminSettingsAccordionSection>
      </AdminSettingsAccordion>
    </div>
  );
}
