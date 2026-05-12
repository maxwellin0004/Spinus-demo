import { UserRole } from "@prisma/client";
import { updateBrandInsightDirectionAction, updateBrandProfileAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { getInsightDirection, INSIGHT_DIRECTIONS } from "@/lib/insights/directions";
import { prisma } from "@/lib/prisma";
import { OperatorCard } from "@/components/brand-ops";
import { Card, EmptyState, Field, PageHeader, Select, StatusBadge, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/form-controls";

export default async function BrandProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ directionUpdated?: string; error?: string; updated?: string }>;
}) {
  const session = await requireRole(UserRole.BRAND);
  const { directionUpdated, error, updated } = await searchParams;
  const brand = await prisma.brandProfile.findUnique({
    where: { userId: session.userId },
    include: { responsibleAdmin: { include: { user: true } } },
  });
  if (!brand) return <EmptyState title="缺少品牌资料" />;
  const operator = brand.responsibleAdmin;
  const currentDirection = getInsightDirection(brand.insightDirection);

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="品牌方" title="品牌资料">
        <StatusBadge>{brand.reviewStatus}</StatusBadge>
      </PageHeader>
      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
      {updated ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">品牌资料已重新提交审核。</div> : null}
      {directionUpdated ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">洞察方向已保存，品牌洞察页会按该方向展示关键词和分析口径。</div> : null}
      <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <OperatorCard name={operator?.displayName} email={operator?.user.email} wechat={operator?.wechat} />
        <Card>
          <h2 className="text-xl font-black">资料审核说明</h2>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            品牌资料支持自助编辑。保存后状态会回到“待处理”，平台运营会重新审核；审核期间不影响已存在 Campaign 的查看。
          </p>
        </Card>
      </section>
      <Card>
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-xl font-black">品牌洞察方向</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              选择后，品牌洞察页会切换趋势图例、筛选标签、痛点关键词和风险识别口径。当前方向：
              <span className="font-black text-stone-950">{currentDirection.label}</span>
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {currentDirection.painKeywords.map((keyword) => (
                <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-black text-teal-700" key={keyword}>{keyword}</span>
              ))}
            </div>
          </div>
          <form action={updateBrandInsightDirectionAction} className="grid gap-4 rounded-2xl border border-stone-200 bg-stone-50/70 p-4">
            <Select label="品牌所在方向" name="insightDirection" defaultValue={currentDirection.slug}>
              {INSIGHT_DIRECTIONS.map((direction) => (
                <option key={direction.slug} value={direction.slug}>{direction.label}</option>
              ))}
            </Select>
            <p className="text-sm leading-6 text-stone-600">{currentDirection.description}</p>
            <div>
              <SubmitButton pendingLabel="正在保存..." variant="secondary">保存洞察方向</SubmitButton>
            </div>
          </form>
        </div>
      </Card>
      <Card>
        <h2 className="text-xl font-black">编辑品牌资料并重新提交审核</h2>
        <form action={updateBrandProfileAction} className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="品牌名称" name="brandName" required defaultValue={brand.brandName} />
          <Field label="公司名称" name="companyName" required defaultValue={brand.companyName} />
          <Field label="联系人" name="contactName" required defaultValue={brand.contactName} />
          <Field label="联系邮箱" name="email" type="email" required defaultValue={brand.email} />
          <Field label="Telegram" name="telegram" defaultValue={brand.telegram ?? ""} />
          <Field label="WhatsApp" name="whatsapp" defaultValue={brand.whatsapp ?? ""} />
          <Field label="官网" name="website" defaultValue={brand.website ?? ""} />
          <Field label="行业" name="industry" required defaultValue={brand.industry} />
          <Field label="国家/地区" name="country" required defaultValue={brand.country} />
          <Field label="Logo URL" name="logoUrl" defaultValue={brand.logoUrl ?? ""} />
          <label className="grid gap-2 text-sm font-medium text-stone-700">
            上传新 Logo
            <input className="rounded-2xl border border-stone-200 bg-white/90 px-4 py-3" name="logoFile" type="file" />
          </label>
          <div className="md:col-span-2">
            <Textarea label="公司介绍" name="description" required rows={6} defaultValue={brand.description} />
          </div>
          <div className="md:col-span-2">
            <SubmitButton pendingLabel="正在保存..." variant="secondary">保存并重新提交审核</SubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
