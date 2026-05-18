import Link from "next/link";
import { SupportTicketPriority, SupportTicketStatus, UserRole } from "@prisma/client";
import { addCustomerSupportTicketNoteAction, createCustomerSupportTicketAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubmitButton } from "@/components/form-controls";
import { Card, EmptyState, Field, PageHeader, Select, StatusBadge, Textarea, WorkflowHint } from "@/components/ui";
import { shortDate } from "@/lib/format";

function ticketTone(status: SupportTicketStatus) {
  if (status === SupportTicketStatus.RESOLVED || status === SupportTicketStatus.CLOSED) return "success" as const;
  if (status === SupportTicketStatus.WAITING_CUSTOMER) return "warning" as const;
  if (status === SupportTicketStatus.IN_PROGRESS) return "info" as const;
  return "danger" as const;
}

function nextStep(status: SupportTicketStatus) {
  if (status === SupportTicketStatus.OPEN) return { title: "等待接手", body: "客服会先确认问题归属和需要的材料。", tone: "warning" as const };
  if (status === SupportTicketStatus.IN_PROGRESS) return { title: "处理中", body: "运营正在处理，必要时会在工单里回复。", tone: "default" as const };
  if (status === SupportTicketStatus.WAITING_CUSTOMER) return { title: "需要补充", body: "请补充截图、链接、订单号或其他上下文。", tone: "warning" as const };
  if (status === SupportTicketStatus.RESOLVED) return { title: "已解决", body: "问题已处理完成，可以保留记录备查。", tone: "success" as const };
  return { title: "已关闭", body: "该工单已关闭，如有新问题请重新提交。", tone: "default" as const };
}

export async function SupportCenterPage({ role, error, focusedTicketId }: { role: UserRole; error?: string; focusedTicketId?: string }) {
  const session = await requireRole(role);
  const roleRoot = role === UserRole.BRAND ? "/brand" : "/creator";
  const [brand, creator] = await Promise.all([
    role === UserRole.BRAND ? prisma.brandProfile.findUnique({ where: { userId: session.userId }, include: { campaigns: { orderBy: { createdAt: "desc" }, take: 50 } } }) : null,
    role === UserRole.CREATOR ? prisma.creatorProfile.findUnique({ where: { userId: session.userId } }) : null,
  ]);
  const tickets = await prisma.supportTicket.findMany({
    where: {
      openedByUserId: session.userId,
      ...(brand ? { brandId: brand.id } : {}),
      ...(creator ? { creatorId: creator.id } : {}),
    },
    include: {
      assignedTo: true,
      notes: {
        where: { internal: false },
        include: { author: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: [{ status: "asc" }, { lastMessageAt: "desc" }, { updatedAt: "desc" }],
    take: 80,
  });
  const openCount = tickets.filter((ticket) => ticket.status === SupportTicketStatus.OPEN || ticket.status === SupportTicketStatus.IN_PROGRESS).length;
  const waitingCustomerCount = tickets.filter((ticket) => ticket.status === SupportTicketStatus.WAITING_CUSTOMER).length;
  const latestTicket = tickets[0];
  const latestStep = latestTicket ? nextStep(latestTicket.status) : null;

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow={role === UserRole.BRAND ? "品牌支持" : "创作者支持"} title="客服工单">
        <StatusBadge>{openCount} 处理中</StatusBadge>
        {waitingCustomerCount ? <StatusBadge tone="warning">{waitingCustomerCount} 待补充</StatusBadge> : null}
      </PageHeader>
      {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div> : null}

      {latestStep ? (
        <Card className="border-amber-200 bg-amber-50/70">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">最近工单</p>
              <h2 className="mt-2 text-xl font-black text-stone-950">{latestTicket?.title}</h2>
              <p className="mt-1 text-sm text-stone-600">{latestStep.body}</p>
            </div>
            <WorkflowHint title={latestStep.title} body={latestTicket?.assignedTo?.email ?? "等待客服分配"} tone={latestStep.tone} />
          </div>
        </Card>
      ) : null}

      <Card>
        <details open={!tickets.length}>
          <summary className="cursor-pointer text-lg font-black text-stone-950">提交新工单</summary>
          <form action={createCustomerSupportTicketAction} className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="标题" name="title" required placeholder="一句话说明问题" />
            <Select label="类型" name="category" defaultValue="general">
              <option value="general">一般问题</option>
              <option value="campaign">Campaign / 任务问题</option>
              <option value="content_review">内容审核问题</option>
              <option value="payment">付款 / 钱包问题</option>
              <option value="account">账号资料问题</option>
              <option value="dispute">争议补充材料</option>
            </Select>
            <Select label="优先级" name="priority" defaultValue={SupportTicketPriority.NORMAL}>
              <option value={SupportTicketPriority.LOW}>LOW</option>
              <option value={SupportTicketPriority.NORMAL}>NORMAL</option>
              <option value={SupportTicketPriority.HIGH}>HIGH</option>
              <option value={SupportTicketPriority.URGENT}>URGENT</option>
            </Select>
            {brand ? (
              <Select label="关联 Campaign" name="campaignId">
                <option value="">不关联</option>
                {brand.campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.title}
                  </option>
                ))}
              </Select>
            ) : (
              <Field label="关联 Proof ID（可选）" name="proofId" />
            )}
            <div className="md:col-span-2">
              <Textarea label="问题说明" name="body" required rows={5} placeholder="请写清楚页面、任务、订单号、链接、截图地址或你期望客服处理的结果。" />
            </div>
            <div className="md:col-span-2">
              <SubmitButton pendingLabel="正在提交..." variant="secondary">提交工单</SubmitButton>
            </div>
          </form>
        </details>
      </Card>

      {tickets.length ? (
        <div className="grid gap-4">
          {tickets.map((ticket) => {
            const step = nextStep(ticket.status);
            const canReply = ticket.status !== SupportTicketStatus.CLOSED && ticket.status !== SupportTicketStatus.RESOLVED;
            return (
              <Card key={ticket.id} className={focusedTicketId === ticket.id ? "ring-4 ring-amber-200" : ""}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone={ticketTone(ticket.status)}>{ticket.status}</StatusBadge>
                      <StatusBadge>{ticket.priority}</StatusBadge>
                      <StatusBadge>{ticket.category}</StatusBadge>
                    </div>
                    <h2 className="mt-3 text-xl font-black text-stone-950">{ticket.title}</h2>
                    <p className="mt-2 text-sm text-stone-500">
                      {shortDate(ticket.createdAt)} / 负责人：{ticket.assignedTo?.email ?? "待分配"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold text-stone-500">
                      {ticket.campaignId ? <span>Campaign: {ticket.campaignId}</span> : null}
                      {ticket.proofId ? <span>Proof: {ticket.proofId}</span> : null}
                    </div>
                  </div>
                  <WorkflowHint title={step.title} body={step.body} tone={step.tone} />
                </div>

                <div className="mt-5 grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  {ticket.notes.length ? (
                    ticket.notes.map((note) => (
                      <div className="rounded-xl bg-white px-4 py-3 text-sm" key={note.id}>
                        <p className="font-black text-stone-950">
                          {note.authorRole === UserRole.ADMIN ? "客服" : "我"} · {note.author?.email ?? "系统"} · {shortDate(note.createdAt)}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap leading-7 text-stone-600">{note.body}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-stone-500">暂无客户可见回复。</p>
                  )}
                </div>

                {canReply ? (
                  <form action={addCustomerSupportTicketNoteAction.bind(null, ticket.id)} className="mt-5 grid gap-3">
                    <Textarea label="补充回复" name="body" rows={3} placeholder="补充截图地址、链接、订单号或处理反馈。" required />
                    <div>
                      <SubmitButton pendingLabel="正在提交..." variant="secondary">提交补充</SubmitButton>
                    </div>
                  </form>
                ) : (
                  <p className="mt-4 text-sm font-semibold text-stone-500">工单已结束。如有新问题，请重新提交工单。</p>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="暂无工单" body="遇到付款、审核、任务或账号问题时，可以直接提交给客服处理。" />
      )}

      <div className="text-sm font-semibold text-stone-500">
        <Link className="text-stone-950" href={roleRoot}>返回工作台</Link>
      </div>
    </div>
  );
}
