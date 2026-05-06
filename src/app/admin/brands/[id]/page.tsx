import Link from "next/link";
import { addBrandMessageAction, updateBrandRequestStatusAction, updateBrandStatusAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { DataTable, Field, PageHeader, Select, StatusBadge, Textarea, Button, Card } from "@/components/ui";
import { money, shortDate } from "@/lib/format";
import { getAdminContext } from "@/lib/admin";
import { MessageThread } from "@/components/brand-ops";

export default async function AdminBrandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await getAdminContext();
  const { id } = await params;
  const brand = await prisma.brandProfile.findUnique({
    where: { id },
    include: {
      campaigns: { orderBy: { createdAt: "desc" } },
      user: true,
      responsibleAdmin: true,
      requests: { orderBy: { createdAt: "desc" }, include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } } },
      messages: { include: { author: true }, orderBy: { createdAt: "asc" } },
    },
  });
  const admins = await prisma.adminProfile.findMany({ where: { user: { status: "ACTIVE" } }, include: { user: true }, orderBy: { createdAt: "asc" } });
  if (!brand) return <PageHeader title="未找到品牌" />;

  const action = updateBrandStatusAction.bind(null, brand.id);
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="品牌详情" title={brand.brandName}>
        <StatusBadge>{brand.reviewStatus}</StatusBadge>
      </PageHeader>
      <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h2 className="text-xl font-semibold">审核控制</h2>
          <form action={action} className="mt-5 grid gap-4">
            <Select label="Status" name="reviewStatus" defaultValue={brand.reviewStatus}>
              <option value="APPROVED">已通过</option>
              <option value="REJECTED">已拒绝</option>
              <option value="FROZEN">冻结</option>
              <option value="PENDING">待处理</option>
            </Select>
            <Select label="负责运营" name="responsibleAdminId" defaultValue={brand.responsibleAdminId ?? ""}>
              <option value="">未分配</option>
              {admins.map((admin) => <option key={admin.id} value={admin.id}>{admin.displayName} · {admin.user.email}</option>)}
            </Select>
            <Textarea label="Internal note" name="internalNote" defaultValue={brand.internalNote ?? ""} />
            <Button>保存状态</Button>
          </form>
        </Card>
        <Card>
          <dl className="grid gap-3 text-sm text-stone-600 md:grid-cols-2">
            <div><dt className="font-semibold text-stone-950">公司</dt><dd>{brand.companyName}</dd></div>
            <div><dt className="font-semibold text-stone-950">联系人</dt><dd>{brand.contactName}</dd></div>
            <div><dt className="font-semibold text-stone-950">邮箱</dt><dd>{brand.email}</dd></div>
            <div><dt className="font-semibold text-stone-950">官网</dt><dd>{brand.website ?? "-"}</dd></div>
            <div><dt className="font-semibold text-stone-950">行业</dt><dd>{brand.industry}</dd></div>
            <div><dt className="font-semibold text-stone-950">风险</dt><dd>{brand.riskLevel}</dd></div>
            <div><dt className="font-semibold text-stone-950">负责运营</dt><dd>{brand.responsibleAdmin?.displayName ?? "-"}</dd></div>
            <div><dt className="font-semibold text-stone-950">演示数据</dt><dd>{brand.isDemo ? "是" : "否"}</dd></div>
            <div className="md:col-span-2"><dt className="font-semibold text-stone-950">说明</dt><dd>{brand.description}</dd></div>
          </dl>
        </Card>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold">品牌需求</h2>
        <DataTable
          headers={["需求", "目标", "预算", "状态", "最近留言", "创建时间"]}
          rows={brand.requests.map((request) => [
            request.title,
            request.objective,
            request.budget ? money(request.budget) : "-",
            <StatusBadge key="s">{request.status}</StatusBadge>,
            request.messages[0]?.body ?? "-",
            shortDate(request.createdAt),
          ])}
        />
      </section>
      <div className="grid gap-4">
        {brand.requests.map((request) => (
          <Card key={request.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black">{request.title}</h3>
                <p className="mt-1 text-sm text-stone-500">{request.objective} · {request.budget ? money(request.budget) : "未填预算"}</p>
              </div>
              <StatusBadge>{request.status}</StatusBadge>
            </div>
            <form action={addBrandMessageAction.bind(null, "request", request.id)} className="mt-4 grid gap-3">
              <Textarea label="回复该需求" name="body" required rows={3} />
              <div><Button variant="secondary">发送需求回复</Button></div>
            </form>
            <form action={updateBrandRequestStatusAction.bind(null, request.id)} className="mt-4 flex flex-wrap items-end gap-3">
              <Select label="需求状态" name="status" defaultValue={request.status}>
                <option value="SUBMITTED">已提交</option>
                <option value="IN_REVIEW">审核中</option>
                <option value="ACCEPTED">已接受</option>
                <option value="CONVERTED">已转推广</option>
                <option value="CLOSED">已关闭</option>
              </Select>
              <Button variant="ghost">更新需求状态</Button>
            </form>
          </Card>
        ))}
      </div>
      <Card>
        <h2 className="text-xl font-black">品牌与运营沟通记录</h2>
        <div className="mt-5">
          <MessageThread messages={brand.messages} />
        </div>
        <form action={addBrandMessageAction.bind(null, "brand", brand.id)} className="mt-5 grid gap-3">
          <Textarea label="回复品牌" name="body" required rows={4} />
          <label className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm">
            <input className="mr-2" name="visibleToBrand" type="checkbox" defaultChecked />
            品牌方可见
          </label>
          <div><Button variant="secondary">发送留言</Button></div>
        </form>
      </Card>
      <section>
        <h2 className="mb-3 text-xl font-semibold">推广历史</h2>
        <DataTable
          headers={["Campaign", "Status", "Budget", "Start", "End"]}
          rows={brand.campaigns.map((campaign) => [
            <Link className="font-semibold text-stone-950" href={`/admin/campaigns/${campaign.id}`} key={campaign.id}>{campaign.title}</Link>,
            <StatusBadge key="s">{campaign.status}</StatusBadge>,
            money(campaign.totalBudget),
            shortDate(campaign.startDate),
            shortDate(campaign.endDate),
          ])}
        />
      </section>
      <Field label="User status" name="userStatus" defaultValue={brand.user.status} />
    </div>
  );
}
