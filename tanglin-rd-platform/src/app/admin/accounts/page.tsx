import { CreatorLevel } from "@prisma/client";
import { createBrandAccountAction, createCreatorAccountAction } from "@/lib/actions";
import { demoWhere, getAdminContext, hasAdminPermission } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { Button, Card, DataTable, Field, PageHeader, Select, StatusBadge, Textarea } from "@/components/ui";
import { shortDate } from "@/lib/format";

export default async function AdminAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string; error?: string }>;
}) {
  const context = await getAdminContext();
  if (!hasAdminPermission(context.profile, "account.create")) return <PageHeader title="无权开通账号" />;
  const { demo, error } = await searchParams;
  const canDemo = hasAdminPermission(context.profile, "demo.manage");
  const admins = await prisma.adminProfile.findMany({
    where: { user: { status: "ACTIVE" } },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
  const [brands, creators] = await Promise.all([
    prisma.brandProfile.findMany({
      where: demoWhere(demo, canDemo),
      include: { user: true, responsibleAdmin: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.creatorProfile.findMany({
      where: demoWhere(demo, canDemo),
      include: { user: true, responsibleAdmin: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="管理端" title="品牌与创作者账号开通" />
      {error ? <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div> : null}
      <form className="flex flex-wrap gap-3">
        <select className="rounded-full border border-stone-200 px-4 py-3" name="demo" defaultValue={demo ?? "real"}>
          <option value="real">只看真实数据</option>
          {canDemo ? <option value="include">包含演示数据</option> : null}
          {canDemo ? <option value="only">只看演示数据</option> : null}
        </select>
        <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white">筛选</button>
      </form>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <h2 className="text-xl font-semibold">开通品牌号</h2>
          <form action={createBrandAccountAction} className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="邮箱" name="email" required />
            <Field label="初始密码" name="password" type="password" required />
            <Field label="品牌名称" name="brandName" required />
            <Field label="公司名称" name="companyName" required />
            <Field label="联系人" name="contactName" required />
            <Field label="行业" name="industry" defaultValue="AI 工具" required />
            <Field label="国家/地区" name="country" defaultValue="新加坡" required />
            <Select label="负责运营" name="responsibleAdminId" defaultValue={context.profile.id}>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>{admin.displayName} · {admin.user.email}</option>
              ))}
            </Select>
            <div className="md:col-span-2"><Textarea label="说明" name="description" defaultValue="由平台方创建的品牌账号。" /></div>
            {canDemo ? (
              <label className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                <input className="mr-2" name="isDemo" type="checkbox" />
                创建为内部演示账号，不计入真实运营统计
              </label>
            ) : null}
            <div className="md:col-span-2"><Button variant="secondary">开通品牌号</Button></div>
          </form>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold">开通创作者号</h2>
          <form action={createCreatorAccountAction} className="mt-5 grid gap-4 md:grid-cols-2">
            <Field label="邮箱" name="email" required />
            <Field label="初始密码" name="password" type="password" required />
            <Field label="显示名称" name="displayName" required />
            <Field label="国家/地区" name="country" defaultValue="新加坡" required />
            <Field label="语言，逗号分隔" name="languages" defaultValue="中文, 英语" />
            <Field label="擅长领域，逗号分隔" name="categories" defaultValue="AI, SaaS" />
            <Field label="内容形式，逗号分隔" name="contentTypes" defaultValue="短视频, 口播" />
            <Select label="创作者等级" name="level" defaultValue={CreatorLevel.NEW}>
              <option value={CreatorLevel.NEW}>新手</option>
              <option value={CreatorLevel.VERIFIED}>已认证</option>
              <option value={CreatorLevel.PRO}>专业</option>
              <option value={CreatorLevel.ELITE}>精英</option>
            </Select>
            <Select label="负责运营" name="responsibleAdminId" defaultValue={context.profile.id}>
              {admins.map((admin) => (
                <option key={admin.id} value={admin.id}>{admin.displayName} · {admin.user.email}</option>
              ))}
            </Select>
            <Field label="币种" name="currency" defaultValue="USD" />
            {canDemo ? (
              <label className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                <input className="mr-2" name="isDemo" type="checkbox" />
                创建为内部演示账号，不计入真实运营统计
              </label>
            ) : null}
            <div className="md:col-span-2"><Button variant="secondary">开通创作者号</Button></div>
          </form>
        </Card>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">最近品牌号</h2>
        <DataTable
          headers={["品牌", "邮箱", "状态", "负责运营", "演示数据", "创建时间"]}
          rows={brands.map((brand) => [
            brand.brandName,
            brand.user.email,
            <StatusBadge key="status">{brand.reviewStatus}</StatusBadge>,
            brand.responsibleAdmin?.displayName ?? "-",
            brand.isDemo ? "是" : "否",
            shortDate(brand.createdAt),
          ])}
        />
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold">最近创作者号</h2>
        <DataTable
          headers={["创作者", "邮箱", "状态", "等级", "负责运营", "演示数据", "创建时间"]}
          rows={creators.map((creator) => [
            creator.displayName,
            creator.user.email,
            <StatusBadge key="status">{creator.reviewStatus}</StatusBadge>,
            creator.level,
            creator.responsibleAdmin?.displayName ?? "-",
            creator.isDemo ? "是" : "否",
            shortDate(creator.createdAt),
          ])}
        />
      </section>
    </div>
  );
}
