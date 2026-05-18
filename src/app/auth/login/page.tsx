import Link from "next/link";
import { loginAction } from "@/lib/actions";
import { Card, Field, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/form-controls";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#fde68a,transparent_28rem),#fafaf9] p-6">
      <div className="w-full max-w-lg">
        <PageHeader eyebrow="小黄雀联盟" title="登录" />
        <Card className="mt-8">
          {error ? <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}
          <form action={loginAction} className="grid gap-4">
            <Field label="邮箱" name="email" type="email" required defaultValue="admin@test.com" />
            <Field label="密码" name="password" type="password" required defaultValue="password123" />
            <SubmitButton className="rounded-full py-3" pendingLabel="正在登录...">登录</SubmitButton>
          </form>
          <p className="mt-5 text-sm text-stone-500">
            还没有账号？ <Link className="font-semibold text-stone-950" href="/auth/register">注册</Link>
          </p>
          <p className="mt-2 text-sm text-stone-500">
            忘记密码？ <Link className="font-semibold text-stone-950" href="/auth/forgot-password">找回密码</Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
