import Link from "next/link";
import { verifyEmailAction } from "@/lib/actions";
import { Card, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/form-controls";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#fde68a,transparent_28rem),#fafaf9] p-6">
      <div className="w-full max-w-lg">
        <PageHeader eyebrow="Account security" title="邮箱验证" />
        <Card className="mt-8">
          {error ? <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}
          <form action={verifyEmailAction} className="grid gap-4">
            <input name="token" type="hidden" value={token ?? ""} />
            <p className="text-sm leading-7 text-stone-600">点击下方按钮完成邮箱验证。验证后账号安全状态会写入审计日志。</p>
            <SubmitButton className="rounded-full py-3" pendingLabel="正在验证...">完成邮箱验证</SubmitButton>
          </form>
          <p className="mt-5 text-sm text-stone-500">
            已经验证？ <Link className="font-semibold text-stone-950" href="/auth/login">返回登录</Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
