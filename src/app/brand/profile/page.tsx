import { UserRole } from "@prisma/client";
import { updateBrandProfileAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OperatorCard } from "@/components/brand-ops";
import { Button, Card, EmptyState, Field, PageHeader, StatusBadge, Textarea } from "@/components/ui";

export default async function BrandProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const session = await requireRole(UserRole.BRAND);
  const { error, updated } = await searchParams;
  const brand = await prisma.brandProfile.findUnique({
    where: { userId: session.userId },
    include: { responsibleAdmin: { include: { user: true } } },
  });
  if (!brand) return <EmptyState title="缺少品牌资料" />;
  const operator = brand.responsibleAdmin;

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="品牌方" title="品牌资料">
        <StatusBadge>{brand.reviewStatus}</StatusBadge>
      </PageHeader>
      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
      {updated ? <div className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">品牌资料已重新提交审核。</div> : null}
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
            <Button variant="secondary">保存并重新提交审核</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
