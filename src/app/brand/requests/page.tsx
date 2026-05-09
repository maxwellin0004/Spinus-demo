import Link from "next/link";
import { UserRole } from "@prisma/client";
import { addBrandMessageAction, submitBrandRequirementAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessageThread, OperatorCard } from "@/components/brand-ops";
import { Card, DataTable, EmptyState, Field, PageHeader, StatusBadge, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/form-controls";
import { money, shortDate } from "@/lib/format";

export default async function BrandRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await requireRole(UserRole.BRAND);
  const { error } = await searchParams;
  const brand = await prisma.brandProfile.findUnique({
    where: { userId: session.userId },
    include: {
      responsibleAdmin: { include: { user: true } },
      requests: { orderBy: { createdAt: "desc" }, include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } } },
      messages: { where: { requestId: null, campaignId: null, visibleToBrand: true }, include: { author: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!brand) return <EmptyState title="缺少品牌资料" />;

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="品牌方" title="需求沟通" />
      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
      <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <OperatorCard name={brand.responsibleAdmin?.displayName} email={brand.responsibleAdmin?.user.email} wechat={brand.responsibleAdmin?.wechat} />
        <Card>
          <h2 className="text-xl font-black">先发需求，不必立刻创建 Campaign</h2>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            如果预算、Brief 或创作者策略还没确定，可以先把需求发给运营。运营确认后，再转成正式 Campaign。
          </p>
        </Card>
      </section>
      <Card>
        <h2 className="text-xl font-black">提交新需求</h2>
        <form action={submitBrandRequirementAction} className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="需求标题" name="title" required placeholder="例如：5 月新品 TikTok 种草" />
          <Field label="推广目标" name="objective" required placeholder="曝光 / 注册 / 留资 / 下载 / 购买" />
          <Field label="预算预估" name="budget" type="number" placeholder="10000" />
          <Field label="期望上线时间" name="expectedLaunchDate" type="date" />
          <div className="md:col-span-2">
            <Textarea label="需求描述" name="description" required rows={6} placeholder="说明产品、目标人群、平台、内容风格、合规限制和你希望运营协助判断的问题。" />
          </div>
          <div className="md:col-span-2">
            <SubmitButton pendingLabel="正在提交..." variant="secondary">提交给运营</SubmitButton>
          </div>
        </form>
      </Card>
      <Card>
        <h2 className="text-xl font-black">品牌与运营留言</h2>
        <div className="mt-5">
          <MessageThread messages={brand.messages} />
        </div>
        <form action={addBrandMessageAction.bind(null, "brand", brand.id)} className="mt-5 grid gap-3">
          <Textarea label="留言给运营" name="body" required rows={4} />
          <div><SubmitButton pendingLabel="正在发送..." variant="secondary">发送留言</SubmitButton></div>
        </form>
      </Card>
      <section>
        <h2 className="mb-3 text-xl font-semibold">我的需求</h2>
        <DataTable
          headers={["需求", "目标", "预算", "状态", "最近留言", "创建时间"]}
          rows={brand.requests.map((request) => [
            <Link className="font-semibold text-stone-950" href={`/brand/requests/${request.id}`} key={request.id}>{request.title}</Link>,
            request.objective,
            request.budget ? money(request.budget) : "-",
            <StatusBadge key="s">{request.status}</StatusBadge>,
            request.messages[0]?.body ?? "-",
            shortDate(request.createdAt),
          ])}
        />
      </section>
    </div>
  );
}
