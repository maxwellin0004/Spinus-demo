import Link from "next/link";
import { resetPasswordAction } from "@/lib/actions";
import { Card, Field, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/form-controls";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#fde68a,transparent_28rem),#fafaf9] p-6">
      <div className="w-full max-w-lg">
        <PageHeader eyebrow="Account security" title="重置密码" />
        <Card className="mt-8">
          {error ? <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}
          <form action={resetPasswordAction} className="grid gap-4">
            <input name="token" type="hidden" value={token ?? ""} />
            <Field label="新密码" name="password" type="password" required placeholder="至少 8 位" />
            <Field label="确认新密码" name="confirmPassword" type="password" required placeholder="再次输入新密码" />
            <SubmitButton className="rounded-full py-3" pendingLabel="正在更新...">更新密码</SubmitButton>
          </form>
          <p className="mt-5 text-sm text-stone-500">
            链接失效？ <Link className="font-semibold text-stone-950" href="/auth/forgot-password">重新申请</Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
