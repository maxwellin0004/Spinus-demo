import { CreatorMembershipApplicationStatus } from "@prisma/client";
import { SubmitButton } from "@/components/form-controls";
import { Card, DataTable, Field, PageHeader, StatusBadge, Textarea, WorkflowHint } from "@/components/ui";
import { updateCreatorMembershipApplicationAction } from "@/lib/actions";
import { getAdminContext } from "@/lib/admin";
import { creatorMembershipLabel, creatorMembershipTone } from "@/lib/creator-membership-status";
import { money, shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

function dateInputValue(value?: Date | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export default async function AdminMembershipApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await getAdminContext();
  const { error } = await searchParams;
  const applications = await prisma.creatorMembershipApplication.findMany({
    include: {
      creator: { include: { user: true, responsibleAdmin: { include: { user: true } } } },
      reviewedBy: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const pendingApplications = applications.filter((item) => item.status === CreatorMembershipApplicationStatus.SUBMITTED);
  const handledApplications = applications.filter((item) => item.status !== CreatorMembershipApplicationStatus.SUBMITTED);
  const approvedCount = handledApplications.filter((item) => item.status === CreatorMembershipApplicationStatus.APPROVED).length;
  const rejectedCount = handledApplications.filter((item) => item.status === CreatorMembershipApplicationStatus.REJECTED).length;

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Membership Applications" title="会员开通审核">
        <StatusBadge>{pendingApplications.length} 待审核</StatusBadge>
        <StatusBadge tone="success">{approvedCount} 已通过</StatusBadge>
        <StatusBadge tone="danger">{rejectedCount} 已拒绝</StatusBadge>
      </PageHeader>

      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <WorkflowHint title="审核动作" body="核对付款单号和截图后，通过会直接更新创作者会员状态。" />
        <WorkflowHint title="拒绝规则" body="拒绝或取消时必须填写处理备注，创作者会收到站内通知。" tone="warning" />
        <WorkflowHint title="有效期" body="通过时可以自定义起止日期；不填写则默认从今天开始，顺延一年。" tone="success" />
      </div>

      <section>
        <h2 className="mb-3 text-xl font-semibold">待审核申请</h2>
        {pendingApplications.length === 0 ? (
          <DataTable
            headers={["申请人"]}
            rows={[]}
            emptyTitle="当前没有待审核的会员申请"
            emptyBody="新的付款申请提交后，这里会自动出现。"
          />
        ) : (
          <div className="grid gap-4">
            {pendingApplications.map((application) => {
              const action = updateCreatorMembershipApplicationAction.bind(null, application.id);
              return (
                <Card key={application.id}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.16em] text-stone-500">申请人</p>
                      <h2 className="mt-2 text-2xl font-black text-stone-950">{application.creator.displayName}</h2>
                      <p className="mt-2 text-sm text-stone-600">{application.creator.user.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone={creatorMembershipTone(application.tier)}>{creatorMembershipLabel(application.tier)}</StatusBadge>
                      <StatusBadge>{application.status}</StatusBadge>
                    </div>
                  </div>

                  <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                    <div><dt className="font-semibold">金额</dt><dd>{money(application.amount, application.currency)}</dd></div>
                    <div><dt className="font-semibold">提交时间</dt><dd>{shortDate(application.createdAt)}</dd></div>
                    <div><dt className="font-semibold">付款单号</dt><dd>{application.paymentReference || "-"}</dd></div>
                    <div><dt className="font-semibold">负责运营</dt><dd>{application.creator.responsibleAdmin?.displayName ?? "-"}</dd></div>
                  </dl>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                      <p className="text-sm font-black text-stone-950">申请备注</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-stone-600">{application.creatorNote || "无"}</p>
                      <div className="mt-4">
                        {application.paymentProofUrl ? (
                          <a className="inline-flex rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-black text-stone-800 shadow-sm" href={application.paymentProofUrl} target="_blank">
                            查看付款凭证
                          </a>
                        ) : (
                          <span className="text-sm text-stone-500">未上传付款凭证</span>
                        )}
                      </div>
                    </div>

                    <form action={action} className="grid gap-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="会员开始日期" name="membershipStartedAt" type="date" defaultValue={dateInputValue(application.creator.membershipStartedAt) || dateInputValue(new Date())} />
                        <Field label="会员结束日期" name="membershipEndsAt" type="date" defaultValue={dateInputValue(application.creator.membershipEndsAt)} />
                      </div>
                      <Textarea
                        label="处理备注"
                        name="adminNote"
                        rows={4}
                        placeholder="通过时可填写服务备注；拒绝或取消时请明确原因。"
                      />
                      <div className="flex flex-wrap gap-3">
                        <SubmitButton name="action" value="approve" pendingLabel="正在通过..." variant="primary">
                          通过并开通
                        </SubmitButton>
                        <SubmitButton name="action" value="reject" pendingLabel="正在拒绝..." variant="danger">
                          拒绝申请
                        </SubmitButton>
                        <SubmitButton name="action" value="cancel" pendingLabel="正在取消..." variant="ghost">
                          取消申请
                        </SubmitButton>
                      </div>
                    </form>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">历史记录</h2>
        <DataTable
          headers={["提交时间", "创作者", "档位", "金额", "状态", "付款单号", "处理时间", "处理人", "备注"]}
          rows={handledApplications.map((application) => [
            shortDate(application.createdAt),
            application.creator.displayName,
            <StatusBadge key={`${application.id}-tier`} tone={creatorMembershipTone(application.tier)}>
              {creatorMembershipLabel(application.tier)}
            </StatusBadge>,
            money(application.amount, application.currency),
            <StatusBadge key={`${application.id}-status`}>{application.status}</StatusBadge>,
            application.paymentReference || "-",
            shortDate(application.reviewedAt),
            application.reviewedBy?.email ?? "-",
            application.adminNote ?? application.creatorNote ?? "-",
          ])}
          emptyTitle="还没有历史审核记录"
          emptyBody="处理过的申请会沉淀在这里，方便后续复查。"
        />
      </section>
    </div>
  );
}
