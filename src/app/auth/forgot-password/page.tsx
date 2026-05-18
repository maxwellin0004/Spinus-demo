import Link from "next/link";
import { requestPasswordResetAction } from "@/lib/actions";
import { Card, Field, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/form-controls";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string; devResetPath?: string }>;
}) {
  const { error, sent, devResetPath } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#fde68a,transparent_28rem),#fafaf9] p-6">
      <div className="w-full max-w-lg">
        <PageHeader eyebrow="Account security" title="找回密码" />
        <Card className="mt-8">
          {error ? <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}
          {sent ? (
            <div className="mb-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              如果该邮箱存在可用账号，系统已经生成密码重置请求。邮件服务接入后会发送到该邮箱。
            </div>
          ) : null}
          {devResetPath ? (
            <Link className="mb-5 block rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-900" href={devResetPath}>
              开发环境重置链接
            </Link>
          ) : null}
          <form action={requestPasswordResetAction} className="grid gap-4">
            <Field label="邮箱" name="email" type="email" required placeholder="name@example.com" />
            <SubmitButton className="rounded-full py-3" pendingLabel="正在提交...">提交重置请求</SubmitButton>
          </form>
          <p className="mt-5 text-sm text-stone-500">
            想起密码了？ <Link className="font-semibold text-stone-950" href="/auth/login">返回登录</Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
