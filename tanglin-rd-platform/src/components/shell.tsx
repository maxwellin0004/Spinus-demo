import Link from "next/link";
import type { ReactNode } from "react";
import { UserRole } from "@prisma/client";
import { destroySession, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui";
import { getAdminContext, hasAdminPermission, type AdminPermission } from "@/lib/admin";

const nav = {
  [UserRole.ADMIN]: [
    ["/admin", "仪表盘"],
    ["/admin/staff", "员工权限"],
    ["/admin/accounts", "账号开通"],
    ["/admin/brands", "品牌管理"],
    ["/admin/creators", "创作者管理"],
    ["/admin/campaigns", "推广管理"],
    ["/admin/submissions", "内容审核"],
    ["/admin/proofs", "证明审核"],
    ["/admin/payments", "结算钱包"],
    ["/admin/compliance", "合规风控"],
    ["/admin/reports", "全局报表"],
    ["/admin/audit", "操作日志"],
    ["/admin/demo", "演示数据"],
  ],
  [UserRole.BRAND]: [
    ["/brand", "仪表盘"],
    ["/brand/profile", "品牌资料"],
    ["/brand/requests", "需求沟通"],
    ["/brand/campaigns", "推广活动"],
    ["/brand/campaigns/new", "新建推广"],
    ["/brand/billing", "账单"],
  ],
  [UserRole.CREATOR]: [
    ["/creator", "仪表盘"],
    ["/creator/profile", "个人资料"],
    ["/creator/marketplace", "任务大厅"],
    ["/creator/my-tasks", "我的任务"],
    ["/creator/wallet", "钱包提现"],
  ],
};

const adminNavPermissions: Record<string, AdminPermission | null> = {
  "/admin": null,
  "/admin/staff": "staff.manage",
  "/admin/accounts": "account.create",
  "/admin/brands": "account.create",
  "/admin/creators": "account.create",
  "/admin/campaigns": "campaign.manage",
  "/admin/submissions": "content.review",
  "/admin/proofs": "proof.review",
  "/admin/payments": "payment.manage",
  "/admin/compliance": "compliance.manage",
  "/admin/reports": "reports.view",
  "/admin/audit": "audit.view",
  "/admin/demo": "demo.manage",
};

async function logout() {
  "use server";
  await destroySession();
}

export async function AppShell({ role, children }: { role: UserRole; children: ReactNode }) {
  const adminContext = role === UserRole.ADMIN ? await getAdminContext() : null;
  const session = adminContext ?? await requireRole(role);
  const roleRoot = role === UserRole.ADMIN ? "/admin" : role === UserRole.BRAND ? "/brand" : "/creator";
  const visibleNav = role === UserRole.ADMIN && adminContext
    ? nav[role].filter(([href]) => {
        const permission = adminNavPermissions[href];
        return !permission || hasAdminPermission(adminContext.profile, permission);
      })
    : nav[role];
  const notifications = await prisma.notification.count({
    where: { userId: session.userId, unread: true },
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_0,rgba(244,176,0,0.42)_0,transparent_28rem),radial-gradient(circle_at_92%_8%,rgba(103,232,249,0.28)_0,transparent_24rem),linear-gradient(135deg,#fffaf0,#f7f2e8_42%,#eef8d7)]">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-stone-200/70 bg-white/58 p-5 backdrop-blur-2xl xl:block">
        <Link href="/" className="block">
          <div className="relative overflow-hidden rounded-[2rem] border border-stone-200 bg-[linear-gradient(135deg,#17211c,#344035)] p-5 text-white shadow-2xl">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[var(--accent)] blur-2xl" />
            <div className="absolute -bottom-10 left-6 h-24 w-24 rounded-full bg-[var(--cyan)]/70 blur-2xl" />
            <p className="relative text-xs font-black uppercase tracking-[0.28em] text-amber-200">小黄雀联盟</p>
            <p className="relative mt-2 text-3xl font-black tracking-tight">创作者运营台</p>
            <p className="relative mt-3 text-xs leading-5 text-white/70">面向品牌、创作者和平台方的 AI 投放协作画布。</p>
          </div>
        </Link>
        <nav className="mt-6 grid gap-2">
          {visibleNav.map(([href, label]) => (
            <Link className="rounded-2xl border border-transparent px-4 py-3 text-sm font-black text-stone-700 transition hover:border-stone-200 hover:bg-white/80 hover:text-stone-950 hover:shadow-sm" href={href} key={href}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 rounded-[1.5rem] border border-stone-200 bg-white/70 p-4 text-sm text-stone-600">
          <p className="font-black text-stone-950">协作画布</p>
          <p className="mt-1">任务、审核、发布证明和钱包事件保持联动。</p>
        </div>
      </aside>
      <div className="xl:pl-72">
        <header className="sticky top-0 z-20 border-b border-stone-200/70 bg-[rgba(255,250,240,0.78)] px-5 py-4 backdrop-blur-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <StatusBadge>{role}</StatusBadge>
              <span className="text-sm text-stone-500">{session.email}</span>
              <Link href={`${roleRoot}/notifications`}>
                <StatusBadge>{notifications} unread</StatusBadge>
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 xl:hidden">
              {visibleNav.slice(0, 5).map(([href, label]) => (
                <Link className="rounded-full bg-white/75 px-3 py-2 text-xs font-black text-stone-700 shadow-sm" href={href} key={href}>
                  {label}
                </Link>
              ))}
            </div>
            <form action={logout}>
              <button className="rounded-full border border-stone-200 bg-white/80 px-4 py-2 text-sm font-black text-stone-700 shadow-sm" type="submit">
                退出登录
              </button>
            </form>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-5 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
