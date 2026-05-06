import Link from "next/link";
import { registerAction } from "@/lib/actions";
import { Card, Field, PageHeader, Select } from "@/components/ui";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,#fbbf24,transparent_24rem),#fafaf9] p-6">
      <div className="w-full max-w-xl">
        <PageHeader eyebrow="小黄雀联盟" title="创建工作台" />
        <Card className="mt-8">
          {error ? <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}
          <form action={registerAction} className="grid gap-4">
            <Select label="角色" name="role" defaultValue="BRAND">
              <option value="BRAND">品牌方</option>
              <option value="CREATOR">创作者</option>
            </Select>
            <Field label="工作台/显示名称" name="name" required />
            <Field label="国家/地区" name="country" required defaultValue="Singapore" />
            <Field label="行业（品牌方填写）" name="industry" defaultValue="AI SaaS" />
            <Field label="邮箱" name="email" type="email" required />
            <Field label="密码" name="password" type="password" required />
            <button className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white" type="submit">
              注册
            </button>
          </form>
          <p className="mt-5 text-sm text-stone-500">
            已有账号？ <Link className="font-semibold text-stone-950" href="/auth/login">登录</Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
