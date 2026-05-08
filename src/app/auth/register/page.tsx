import Link from "next/link";
import { registerAction } from "@/lib/actions";
import { Card, Field, PageHeader, Select } from "@/components/ui";
import { normalizeInviteCode } from "@/lib/invitations";
import { prisma } from "@/lib/prisma";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; invite?: string; role?: string }>;
}) {
  const { error, invite, role } = await searchParams;
  const inviteCode = normalizeInviteCode(invite ?? "");
  const defaultRole = role === "CREATOR" ? "CREATOR" : "BRAND";
  const invitation = inviteCode
    ? await prisma.invitationCode.findUnique({
        where: { code: inviteCode },
        include: { adminProfile: true },
      })
    : null;
  const lockedInvite = Boolean(invitation?.active);
  const invalidInvite = Boolean(inviteCode && (!invitation || !invitation.active));

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,#fbbf24,transparent_24rem),#fafaf9] p-6">
      <div className="w-full max-w-xl">
        <PageHeader eyebrow="Tanglin" title="创建工作账号" />
        <Card className="mt-8">
          {error ? <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}
          {lockedInvite ? (
            <div className="mb-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
              邀请人：{invitation?.adminProfile.displayName}
            </div>
          ) : null}
          {invalidInvite ? (
            <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              邀请码无效或已停用。没有邀请码可移除 URL 中的 invite 参数后继续注册。
            </div>
          ) : null}
          <form action={registerAction} className="grid gap-4">
            <Select label="角色" name="role" defaultValue={defaultRole}>
              <option value="BRAND">品牌方</option>
              <option value="CREATOR">KOL / 创作者</option>
            </Select>
            <label className="grid gap-2 text-sm font-medium text-stone-700">
              邀请码（可选）
              <input
                className="rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 text-stone-950 shadow-inner outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-amber-100 read-only:bg-stone-100"
                name="inviteCode"
                defaultValue={inviteCode}
                placeholder="例如 A7K2P9"
                readOnly={lockedInvite}
              />
              {lockedInvite ? <input name="inviteLocked" type="hidden" value="1" /> : null}
            </label>
            <Field label="工作台/显示名称" name="name" required placeholder="例如 Tanglin Test" />
            <Field label="国家/地区" name="country" required defaultValue="Singapore" />
            <Field label="行业（品牌方填写）" name="industry" defaultValue="AI SaaS" />
            <Field label="邮箱" name="email" type="email" required placeholder="name@example.com" />
            <Field label="密码" name="password" type="password" required placeholder="至少 8 位" />
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
