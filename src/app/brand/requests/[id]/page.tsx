import { UserRole } from "@prisma/client";
import { addBrandMessageAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessageThread, OperatorCard } from "@/components/brand-ops";
import { SubmitButton } from "@/components/form-controls";
import { Card, EmptyState, PageHeader, StatusBadge, Textarea } from "@/components/ui";
import { money, shortDate } from "@/lib/format";

export default async function BrandRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireRole(UserRole.BRAND);
  const { id } = await params;
  const request = await prisma.brandRequest.findFirst({
    where: { id, brand: { userId: session.userId } },
    include: {
      brand: { include: { responsibleAdmin: { include: { user: true } } } },
      messages: { where: { visibleToBrand: true }, include: { author: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!request) return <EmptyState title="未找到需求" />;
  const operator = request.brand.responsibleAdmin;

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="需求详情" title={request.title}>
        <StatusBadge>{request.status}</StatusBadge>
      </PageHeader>
      <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <OperatorCard name={operator?.displayName} email={operator?.user.email} wechat={operator?.wechat} />
        <Card>
          <dl className="grid gap-3 text-sm md:grid-cols-2">
            <div><dt className="font-semibold text-stone-950">推广目标</dt><dd>{request.objective}</dd></div>
            <div><dt className="font-semibold text-stone-950">预算预估</dt><dd>{request.budget ? money(request.budget) : "-"}</dd></div>
            <div><dt className="font-semibold text-stone-950">期望上线</dt><dd>{shortDate(request.expectedLaunchDate)}</dd></div>
            <div><dt className="font-semibold text-stone-950">创建时间</dt><dd>{shortDate(request.createdAt)}</dd></div>
            <div className="md:col-span-2"><dt className="font-semibold text-stone-950">需求描述</dt><dd className="whitespace-pre-wrap">{request.description}</dd></div>
          </dl>
        </Card>
      </section>
      <Card>
        <h2 className="text-xl font-black">沟通记录</h2>
        <div className="mt-5">
          <MessageThread messages={request.messages} />
        </div>
        <form action={addBrandMessageAction.bind(null, "request", request.id)} className="mt-5 grid gap-3">
          <Textarea label="补充留言" name="body" required rows={4} />
          <div>
            <SubmitButton pendingLabel="正在发送..." variant="secondary">发送留言</SubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
