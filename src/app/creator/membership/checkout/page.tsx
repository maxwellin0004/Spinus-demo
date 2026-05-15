import Link from "next/link";
import { CreatorMembershipTier, UserRole } from "@prisma/client";
import { CopyButton, FileInput, SubmitButton } from "@/components/form-controls";
import { Card, DataTable, Field, PageHeader, Select, StatusBadge, Textarea, WorkflowHint } from "@/components/ui";
import { submitCreatorMembershipApplicationAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { creatorMembershipLabel, creatorMembershipTone } from "@/lib/creator-membership-status";
import { creatorMembershipTiers, getCreatorMembershipTier, membershipTierFromSlug } from "@/lib/creator-memberships";
import { money, shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export default async function CreatorMembershipCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string; error?: string; submitted?: string }>;
}) {
  const session = await requireRole(UserRole.CREATOR);
  const { tier, error, submitted } = await searchParams;
  const creator = await prisma.creatorProfile.findUnique({
    where: { userId: session.userId },
    include: {
      responsibleAdmin: { include: { user: true } },
      membershipApplications: {
        include: { reviewedBy: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!creator) {
    return <PageHeader title="缺少创作者资料" />;
  }

  const selectedTier = getCreatorMembershipTier(tier);
  const selectedTierEnum = membershipTierFromSlug(selectedTier.slug);
  const activeApplication = creator.membershipApplications.find((item) => item.status === "SUBMITTED");
  const operatorName = creator.responsibleAdmin?.displayName || "平台运营";
  const operatorContact = creator.responsibleAdmin?.wechat || creator.responsibleAdmin?.user.email || "等待平台分配";

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Membership Checkout" title="会员开通与付款提交">
        <Link className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-black text-stone-800 shadow-sm" href="/creator/membership">
          返回会员页
        </Link>
      </PageHeader>

      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
      {submitted ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">申请已提交，平台审核后会更新你的会员状态。</div> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">当前会员</p>
          <div className="mt-3">
            <StatusBadge tone={creatorMembershipTone(creator.membershipTier)}>{creatorMembershipLabel(creator.membershipTier)}</StatusBadge>
          </div>
          <p className="mt-3 text-sm text-stone-600">到期时间：{creator.membershipEndsAt ? shortDate(creator.membershipEndsAt) : "未设置"}</p>
        </Card>
        <Card>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">本次申请</p>
          <p className="mt-3 text-2xl font-black text-stone-950">{selectedTier.title}</p>
          <p className="mt-2 text-sm text-stone-600">{selectedTier.priceLabel}</p>
        </Card>
        <Card>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">对接运营</p>
          <p className="mt-3 text-2xl font-black text-stone-950">{operatorName}</p>
          <p className="mt-2 text-sm text-stone-600">{operatorContact}</p>
        </Card>
      </div>

      <Card className="border-amber-200 bg-amber-50/70">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <WorkflowHint title="操作说明" body="先线下完成付款，再在这里提交付款单号和截图。平台审核通过后会自动开通会员。" tone="warning" />
          {activeApplication ? (
            <WorkflowHint title="当前有待审核申请" body={`提交于 ${shortDate(activeApplication.createdAt)}，审核前请不要重复提交。`} />
          ) : (
            <WorkflowHint title="当前可提交" body="如果你已经完成付款，可以直接上传付款凭证。" tone="success" />
          )}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-stone-500">提交申请</p>
              <h2 className="mt-2 text-2xl font-black text-stone-950">上传付款凭证，进入人工审核</h2>
            </div>
            <StatusBadge>{money(selectedTierEnum === CreatorMembershipTier.PRO ? 6999 : 1999)}</StatusBadge>
          </div>

          <form action={submitCreatorMembershipApplicationAction} className="mt-6 grid gap-4">
            <Select label="申请档位" name="tier" defaultValue={selectedTierEnum}>
              <option value={CreatorMembershipTier.GROWTH}>成长会员</option>
              <option value={CreatorMembershipTier.PRO}>Pro 高阶会员</option>
            </Select>
            <Field label="付款单号 / 转账备注" name="paymentReference" required placeholder="例如：微信转账单号或银行流水号" />
            <FileInput
              name="paymentProof"
              label="付款凭证"
              required
              accept="image/*,.pdf"
              helper="支持截图、照片或 PDF，单个文件不超过 8MB。"
            />
            <Textarea
              label="补充说明"
              name="creatorNote"
              rows={4}
              placeholder="可填写付款时间、备注信息，或希望开通后的使用目标。"
            />
            <SubmitButton className="w-full md:w-auto" disabled={Boolean(activeApplication)} pendingLabel="正在提交申请...">
              {activeApplication ? "已有待审核申请" : "提交开通申请"}
            </SubmitButton>
          </form>
        </Card>

        <div className="grid gap-4">
          <Card>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-stone-500">联系信息</p>
            <p className="mt-3 text-2xl font-black text-stone-950">{operatorName}</p>
            <p className="mt-2 text-sm leading-7 text-stone-600">{operatorContact}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <CopyButton value={operatorContact}>复制联系方式</CopyButton>
              <CopyButton value={creator.displayName}>复制当前账号名</CopyButton>
              <CopyButton value={selectedTier.title}>复制申请档位</CopyButton>
            </div>
          </Card>

          {creatorMembershipTiers.map((tierItem) => (
            <Card key={tierItem.slug}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.16em] text-stone-500">{tierItem.badge}</p>
                  <h3 className="mt-2 text-2xl font-black text-stone-950">{tierItem.title}</h3>
                </div>
                <span className="rounded-full bg-stone-950 px-4 py-2 text-sm font-black text-white">{tierItem.priceLabel}</span>
              </div>
              <p className="mt-4 text-sm leading-7 text-stone-600">{tierItem.subtitle}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {tierItem.outcomes.map((item) => (
                  <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-black text-stone-700" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-xl font-semibold">最近申请记录</h2>
        <DataTable
          headers={["提交时间", "档位", "金额", "状态", "付款单号", "凭证", "审核时间", "处理人", "备注"]}
          rows={creator.membershipApplications.map((application) => [
            shortDate(application.createdAt),
            creatorMembershipLabel(application.tier),
            money(application.amount, application.currency),
            <StatusBadge key={`${application.id}-status`}>{application.status}</StatusBadge>,
            application.paymentReference || "-",
            application.paymentProofUrl ? (
              <a className="font-semibold text-stone-950 underline-offset-2 hover:underline" href={application.paymentProofUrl} key={`${application.id}-proof`} target="_blank">
                查看凭证
              </a>
            ) : (
              "-"
            ),
            shortDate(application.reviewedAt),
            application.reviewedBy?.email ?? "-",
            application.adminNote ?? application.creatorNote ?? "-",
          ])}
          emptyTitle="还没有提交过会员申请"
          emptyBody="完成线下付款后，在本页上传凭证，平台会按提交顺序审核。"
        />
      </section>
    </div>
  );
}
