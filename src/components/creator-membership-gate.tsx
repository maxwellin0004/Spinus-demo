import Link from "next/link";
import { CreatorMembershipTier } from "@prisma/client";
import { Card, StatusBadge, WorkflowHint } from "@/components/ui";
import { creatorMembershipLabel, creatorMembershipTone } from "@/lib/creator-membership-status";
import { creatorMembershipFeatureRule, type CreatorMembershipFeature } from "@/lib/creator-membership-access";

export function CreatorMembershipGate({
  feature,
  currentTier,
  currentEndsAt,
}: {
  feature: CreatorMembershipFeature;
  currentTier: CreatorMembershipTier;
  currentEndsAt?: Date | string | null;
}) {
  const rule = creatorMembershipFeatureRule(feature);

  return (
    <div className="grid gap-6">
      <Card className="border-amber-200 bg-amber-50/70">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">会员权限限制</p>
            <h2 className="mt-2 text-2xl font-black text-stone-950">{rule.label} 暂未开放</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-700">{rule.description}</p>
          </div>
          <div className="flex flex-col items-start gap-2">
            <StatusBadge tone={creatorMembershipTone(currentTier)}>{creatorMembershipLabel(currentTier)}</StatusBadge>
            <span className="text-xs font-semibold text-stone-500">{currentEndsAt ? `当前会员有效期至 ${new Date(currentEndsAt).toLocaleDateString("zh-CN")}` : "当前账号尚未开通会员"}</span>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <WorkflowHint title="当前状态" body={`你的账号当前档位：${creatorMembershipLabel(currentTier)}。`} />
        <WorkflowHint title="所需档位" body={`使用“${rule.label}”需要 ${creatorMembershipLabel(rule.requiredTier)}。`} tone="warning" />
        <WorkflowHint title="下一步" body="前往会员页面查看两档权益，提交付款凭证后即可等待运营审核开通。" tone="success" />
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-lg font-black text-stone-950">去会员页完成升级</p>
            <p className="mt-2 text-sm text-stone-600">会员审核通过后，权限会自动联动，无需再次手工配置。</p>
          </div>
          <Link className="rounded-full bg-stone-950 px-5 py-3 text-sm font-black text-white shadow-sm" href={`/creator/membership?feature=${feature}`}>
            查看会员方案
          </Link>
        </div>
      </Card>
    </div>
  );
}
