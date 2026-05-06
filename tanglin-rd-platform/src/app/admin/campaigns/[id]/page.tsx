import Link from "next/link";
import { addBrandMessageAction, adminCampaignAction, createCampaignTaskAction, reviewTaskApplicationAction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { Button, Card, DataTable, Field, MetricCard, PageHeader, Select, StatusBadge, Textarea } from "@/components/ui";
import { MessageThread } from "@/components/brand-ops";
import { money, number, shortDate } from "@/lib/format";

export default async function AdminCampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      brand: true,
      tasks: {
        include: { applications: { include: { creator: true }, orderBy: { createdAt: "desc" } } },
        orderBy: { createdAt: "desc" },
      },
      submissions: true,
      proofs: true,
      assets: true,
      messages: { include: { author: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!campaign) return <PageHeader title="未找到推广活动" />;
  const totals = campaign.proofs.reduce(
    (acc, proof) => ({
      views: acc.views + proof.views,
      clicks: acc.clicks + proof.clicks,
      conversions: acc.conversions + proof.conversions,
    }),
    { views: 0, clicks: 0, conversions: 0 },
  );
  const action = adminCampaignAction.bind(null, campaign.id);
  const createTask = createCampaignTaskAction.bind(null, campaign.id);
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="推广活动详情" title={campaign.title}>
        <StatusBadge>{campaign.status}</StatusBadge>
        <Link className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold" href="/admin/reports">查看报表入口</Link>
      </PageHeader>
      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Budget" value={money(campaign.totalBudget)} />
        <MetricCard label="Applications" value={campaign.tasks.reduce((sum, task) => sum + task.applications.length, 0)} />
        <MetricCard label="Published" value={campaign.proofs.length} />
        <MetricCard label="Total views" value={number(totals.views)} />
        <MetricCard label="Conversions" value={number(totals.conversions)} />
      </div>
      <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h2 className="text-xl font-semibold">审核与状态</h2>
          <form action={action} className="mt-5 grid gap-4">
            <Textarea label="Review note / reject reason" name="reviewNote" defaultValue={campaign.reviewNote ?? ""} />
            <div className="flex flex-wrap gap-2">
              <Button name="action" value="approve" variant="secondary">通过并上架</Button>
              <Button name="action" value="reject" variant="danger">拒绝</Button>
              <Button name="action" value="pause" variant="ghost">暂停</Button>
              <Button name="action" value="resume" variant="ghost">恢复</Button>
              <Button name="action" value="complete" variant="ghost">完成</Button>
            </div>
          </form>
        </Card>
        <Card>
          <dl className="grid gap-3 text-sm md:grid-cols-2">
            <div><dt className="font-semibold">品牌</dt><dd>{campaign.brand.brandName}</dd></div>
            <div><dt className="font-semibold">目标</dt><dd>{campaign.objective}</dd></div>
            <div><dt className="font-semibold">平台</dt><dd>{campaign.targetPlatforms.join(", ")}</dd></div>
            <div><dt className="font-semibold">国家/地区</dt><dd>{campaign.targetCountries.join(", ")}</dd></div>
            <div><dt className="font-semibold">创作者预算</dt><dd>{money(campaign.creatorBudget)}</dd></div>
            <div><dt className="font-semibold">平台服务费</dt><dd>{money(campaign.platformFee)}</dd></div>
            <div className="md:col-span-2"><dt className="font-semibold">简报</dt><dd>{campaign.brief}</dd></div>
            <div className="md:col-span-2"><dt className="font-semibold">禁止表达</dt><dd>{campaign.mustNotInclude.join(", ")}</dd></div>
          </dl>
        </Card>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold">创建任务包</h2>
        <Card>
          <form action={createTask} className="grid gap-4 md:grid-cols-3">
            <Field label="Task title" name="title" required placeholder="TikTok 创作者任务简报" />
            <Field label="Platform" name="platform" required defaultValue={campaign.targetPlatforms[0] ?? "TikTok"} />
            <Field label="Content type" name="contentType" required defaultValue="短视频" />
            <Field label="Reward amount" name="rewardAmount" type="number" defaultValue={Number(campaign.baseReward)} />
            <Field label="Slots" name="slotsTotal" type="number" defaultValue={3} />
            <Select label="Creator level required" name="creatorLevelRequired" defaultValue="NEW">
              <option value="NEW">新手</option>
              <option value="VERIFIED">已认证</option>
              <option value="PRO">专业</option>
              <option value="ELITE">精英</option>
            </Select>
            <Field label="Deadline" name="deadline" type="date" defaultValue={campaign.endDate.toISOString().slice(0, 10)} />
            <div className="flex items-end"><Button>创建任务</Button></div>
          </form>
        </Card>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold">任务</h2>
        <DataTable
          headers={["Task", "Platform", "Reward", "Slots", "Applications", "Level", "Deadline"]}
          rows={campaign.tasks.map((task) => [
            task.title,
            task.platform,
            money(task.rewardAmount),
            `${task.slotsTaken}/${task.slotsTotal}`,
            task.applications.length,
            task.creatorLevelRequired,
            shortDate(task.deadline),
          ])}
        />
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold">创作者申请审核</h2>
        {campaign.tasks.flatMap((task) => task.applications).length === 0 ? (
          <DataTable headers={["Creator", "Task", "Status"]} rows={[]} />
        ) : (
          <div className="grid gap-4">
            {campaign.tasks.flatMap((task) =>
              task.applications.map((application) => (
                <Card key={application.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-stone-950">{application.creator.displayName}</h3>
                      <p className="mt-1 text-sm text-stone-500">{task.title} · {task.platform} · 申请于 {shortDate(application.createdAt)}</p>
                    </div>
                    <StatusBadge>{application.status}</StatusBadge>
                  </div>
                  <div className="mt-4 rounded-3xl border border-stone-200 bg-white/70 p-4 text-sm text-stone-700">
                    {application.applicationNote ?? "创作者未填写申请备注。"}
                  </div>
                  <form action={reviewTaskApplicationAction.bind(null, application.id)} className="mt-5 grid gap-3">
                    <Textarea label="审核备注" name="note" defaultValue={application.applicationNote ?? ""} rows={3} />
                    <div className="flex flex-wrap gap-2">
                      <Button name="decision" value="APPROVED" variant="secondary">通过申请</Button>
                      <Button name="decision" value="REJECTED" variant="danger">拒绝申请</Button>
                      {application.status === "APPROVED" ? <Button name="decision" value="CANCELLED" variant="ghost">取消通过</Button> : null}
                    </div>
                  </form>
                </Card>
              )),
            )}
          </div>
        )}
      </section>
      <Card>
        <h2 className="text-xl font-black">品牌沟通记录</h2>
        <div className="mt-5">
          <MessageThread messages={campaign.messages} />
        </div>
        <form action={addBrandMessageAction.bind(null, "campaign", campaign.id)} className="mt-5 grid gap-3">
          <Textarea label="回复品牌" name="body" required rows={4} />
          <label className="rounded-2xl border border-stone-200 bg-white/80 px-4 py-3 text-sm">
            <input className="mr-2" name="visibleToBrand" type="checkbox" defaultChecked />
            品牌方可见
          </label>
          <div><Button variant="secondary">发送留言</Button></div>
        </form>
      </Card>
      <section>
        <h2 className="mb-3 text-xl font-semibold">素材</h2>
        <DataTable headers={["Name", "Kind", "URL"]} rows={campaign.assets.map((asset) => [asset.name, asset.kind, asset.url])} />
      </section>
    </div>
  );
}
