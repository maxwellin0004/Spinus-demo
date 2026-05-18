import { SupportTicketPriority, SupportTicketStatus } from "@prisma/client";
import { createSupportTicketAction, updateSupportTicketAction } from "@/lib/actions";
import { getAdminContext, hasAdminPermission } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { SubmitButton } from "@/components/form-controls";
import { Card, Field, PageHeader, Select, StatusBadge, Textarea, WorkflowHint } from "@/components/ui";
import { shortDate } from "@/lib/format";

function ticketTone(status: SupportTicketStatus) {
  if (status === SupportTicketStatus.RESOLVED || status === SupportTicketStatus.CLOSED) return "success" as const;
  if (status === SupportTicketStatus.WAITING_CUSTOMER) return "warning" as const;
  if (status === SupportTicketStatus.IN_PROGRESS) return "info" as const;
  return "danger" as const;
}

function priorityTone(priority: SupportTicketPriority) {
  if (priority === SupportTicketPriority.URGENT || priority === SupportTicketPriority.HIGH) return "danger" as const;
  if (priority === SupportTicketPriority.NORMAL) return "warning" as const;
  return "neutral" as const;
}

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; ticket?: string; error?: string }>;
}) {
  const context = await getAdminContext();
  if (!hasAdminPermission(context.profile, "support.manage")) return null;
  const { status, ticket: focusedTicketId, error } = await searchParams;
  const statusFilter = Object.values(SupportTicketStatus).includes(status as SupportTicketStatus) ? (status as SupportTicketStatus) : undefined;
  const [tickets, brands, creators, admins] = await Promise.all([
    prisma.supportTicket.findMany({
      where: statusFilter ? { status: statusFilter } : {},
      include: {
        brand: true,
        creator: true,
        assignedTo: true,
        openedBy: true,
        notes: { include: { author: true }, orderBy: { createdAt: "asc" } },
      },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { updatedAt: "desc" }],
      take: 80,
    }),
    prisma.brandProfile.findMany({ where: { isDemo: false }, orderBy: { brandName: "asc" }, take: 100 }),
    prisma.creatorProfile.findMany({ where: { isDemo: false }, orderBy: { displayName: "asc" }, take: 100 }),
    prisma.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, orderBy: { email: "asc" }, take: 100 }),
  ]);
  const openCount = tickets.filter((ticket) => ticket.status === SupportTicketStatus.OPEN || ticket.status === SupportTicketStatus.IN_PROGRESS).length;

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Admin" title="客服与工单">
        <StatusBadge>{openCount} open</StatusBadge>
      </PageHeader>
      {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}

      <Card>
        <details>
          <summary className="cursor-pointer text-lg font-black text-stone-950">新建工单</summary>
          <form action={createSupportTicketAction} className="mt-5 grid gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="标题" name="title" required />
              <Select label="类型" name="category" defaultValue="brand_issue">
                <option value="brand_issue">品牌问题</option>
                <option value="creator_issue">创作者问题</option>
                <option value="dispute_evidence">争议补充材料</option>
                <option value="payment_issue">支付/提现问题</option>
                <option value="internal_ops">内部运营备注</option>
              </Select>
              <Select label="优先级" name="priority" defaultValue={SupportTicketPriority.NORMAL}>
                {Object.values(SupportTicketPriority).map((item) => <option key={item} value={item}>{item}</option>)}
              </Select>
              <Select label="关联品牌" name="brandId">
                <option value="">不关联</option>
                {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.brandName}</option>)}
              </Select>
              <Select label="关联创作者" name="creatorId">
                <option value="">不关联</option>
                {creators.map((creator) => <option key={creator.id} value={creator.id}>{creator.displayName}</option>)}
              </Select>
              <Select label="负责人" name="assignedToId" defaultValue={context.userId}>
                {admins.map((admin) => <option key={admin.id} value={admin.id}>{admin.email}</option>)}
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Campaign ID" name="campaignId" />
              <Field label="Proof ID" name="proofId" />
              <Field label="Dispute ID" name="disputeId" />
            </div>
            <Textarea label="问题说明 / 内部备注" name="body" required rows={4} />
            <Textarea label="处理摘要" name="internalNote" rows={3} />
            <SubmitButton pendingLabel="正在创建...">创建工单</SubmitButton>
          </form>
        </details>
      </Card>

      <form className="flex flex-wrap gap-3">
        <Select label="状态筛选" name="status" defaultValue={statusFilter ?? ""}>
          <option value="">全部</option>
          {Object.values(SupportTicketStatus).map((item) => <option key={item} value={item}>{item}</option>)}
        </Select>
        <button className="rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-black text-white">筛选</button>
      </form>

      <div className="grid gap-4">
        {tickets.map((ticket) => {
          const focused = focusedTicketId === ticket.id;
          return (
            <Card key={ticket.id} className={focused ? "ring-4 ring-amber-200" : ""}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge tone={ticketTone(ticket.status)}>{ticket.status}</StatusBadge>
                    <StatusBadge tone={priorityTone(ticket.priority)}>{ticket.priority}</StatusBadge>
                    <StatusBadge>{ticket.category}</StatusBadge>
                  </div>
                  <h2 className="mt-3 text-xl font-black text-stone-950">{ticket.title}</h2>
                  <p className="mt-2 text-sm text-stone-500">
                    {ticket.brand?.brandName ?? "无品牌"} / {ticket.creator?.displayName ?? "无创作者"} / 负责人：{ticket.assignedTo?.email ?? "-"} / {shortDate(ticket.createdAt)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-stone-500">
                    {ticket.campaignId ? <span>Campaign: {ticket.campaignId}</span> : null}
                    {ticket.proofId ? <span>Proof: {ticket.proofId}</span> : null}
                    {ticket.disputeId ? <span>Dispute: {ticket.disputeId}</span> : null}
                  </div>
                </div>
                <WorkflowHint
                  title={ticket.status === SupportTicketStatus.OPEN ? "待接手" : ticket.status === SupportTicketStatus.IN_PROGRESS ? "处理中" : "已更新"}
                  body={ticket.internalNote || "记录问题、补充材料和内部处理结论。"}
                  tone={ticket.status === SupportTicketStatus.OPEN ? "warning" : "default"}
                />
              </div>

              <div className="mt-5 grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                {ticket.notes.map((note) => (
                  <div className="rounded-xl bg-white px-4 py-3 text-sm" key={note.id}>
                    <p className="font-black text-stone-950">{note.author?.email ?? "系统"} · {shortDate(note.createdAt)}</p>
                    <p className="mt-2 whitespace-pre-wrap leading-7 text-stone-600">{note.body}</p>
                  </div>
                ))}
              </div>

              <form action={updateSupportTicketAction.bind(null, ticket.id)} className="mt-5 grid gap-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <Select label="状态" name="status" defaultValue={ticket.status}>
                    {Object.values(SupportTicketStatus).map((item) => <option key={item} value={item}>{item}</option>)}
                  </Select>
                  <Select label="优先级" name="priority" defaultValue={ticket.priority}>
                    {Object.values(SupportTicketPriority).map((item) => <option key={item} value={item}>{item}</option>)}
                  </Select>
                  <Select label="负责人" name="assignedToId" defaultValue={ticket.assignedToId ?? ""}>
                    <option value="">未分配</option>
                    {admins.map((admin) => <option key={admin.id} value={admin.id}>{admin.email}</option>)}
                  </Select>
                </div>
                <Textarea label="新增内部备注" name="note" rows={3} />
                <label className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                  <input className="h-4 w-4" name="visibleToCustomer" type="checkbox" />
                  这条回复对客户可见
                </label>
                <Textarea label="处理摘要" name="internalNote" defaultValue={ticket.internalNote ?? ""} rows={3} />
                <SubmitButton pendingLabel="正在保存..." variant="secondary">保存工单</SubmitButton>
              </form>
            </Card>
          );
        })}
        {tickets.length === 0 ? <Card><p className="text-sm font-semibold text-stone-500">暂无工单。</p></Card> : null}
      </div>
    </div>
  );
}
