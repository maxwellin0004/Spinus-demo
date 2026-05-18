import Link from "next/link";
import type { ReactNode } from "react";
import { UserRole } from "@prisma/client";
import { destroySession, requireRole } from "@/lib/auth";
import { getAdminContext, hasAdminPermission, type AdminPermission } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { SubmitButton } from "@/components/form-controls";
import { StatusBadge } from "@/components/ui";

type NavItem = [href: string, label: string];
type NavGroup = { title: string; items: NavItem[] };

const navGroups: Record<UserRole, NavGroup[]> = {
  [UserRole.ADMIN]: [
    { title: "总览", items: [["/admin", "仪表盘"], ["/admin/reports", "全局报表"], ["/admin/referrals", "邀请转化"], ["/admin/audit", "操作日志"]] },
    {
      title: "客户与账号",
      items: [
        ["/admin/invitations", "BD 邀请数据"],
        ["/admin/staff", "员工权限"],
        ["/admin/accounts", "账号开通"],
        ["/admin/support", "客服工单"],
        ["/admin/brands", "品牌管理"],
        ["/admin/creators", "KOL 管理"],
        ["/admin/social-accounts", "社媒审核"],
      ],
    },
    {
      title: "投放履约",
      items: [
        ["/admin/campaigns", "推广管理"],
        ["/admin/submissions", "内容审核"],
        ["/admin/proofs", "发布验收"],
        ["/admin/disputes", "争议处理"],
      ],
    },
    {
      title: "财务与规则",
      items: [
        ["/admin/payments", "资金运营"],
        ["/admin/membership-applications", "会员开通"],
        ["/admin/compliance", "规则中心"],
        ["/admin/settings", "平台配置"],
      ],
    },
    {
      title: "系统工具",
      items: [["/admin/crawler", "抓取队列"], ["/admin/insights", "洞察关键词"], ["/admin/insights/runs", "采集日志"], ["/admin/demo", "演示数据"]],
    },
  ],
  [UserRole.BRAND]: [
    { title: "品牌工作台", items: [["/brand", "仪表盘"], ["/brand/insights", "品牌洞察"], ["/brand/profile", "品牌资料"], ["/brand/requests", "需求沟通"], ["/brand/support", "客服工单"]] },
    { title: "投放", items: [["/brand/campaigns", "推广活动"], ["/brand/campaigns/new", "新建推广"], ["/brand/billing", "账单"]] },
  ],
  [UserRole.CREATOR]: [
    {
      title: "创作者工作台",
      items: [["/creator", "仪表盘"], ["/creator/trends", "热点选题"], ["/creator/profile", "个人资料"], ["/creator/share", "分享海报"], ["/creator/membership", "会员方案"], ["/creator/support", "客服工单"]],
    },
    { title: "任务与收益", items: [["/creator/marketplace", "任务大厅"], ["/creator/my-tasks", "我的任务"], ["/creator/wallet", "钱包提现"]] },
  ],
};

const adminNavPermissions: Record<string, AdminPermission | null> = {
  "/admin": null,
  "/admin/invitations": null,
  "/admin/staff": "staff.manage",
  "/admin/accounts": "account.create",
  "/admin/support": "support.manage",
  "/admin/brands": "account.create",
  "/admin/creators": "account.create",
  "/admin/social-accounts": "account.freeze",
  "/admin/crawler": "account.freeze",
  "/admin/insights": "compliance.manage",
  "/admin/campaigns": "campaign.manage",
  "/admin/submissions": "content.review",
  "/admin/proofs": "proof.review",
  "/admin/disputes": "proof.review",
  "/admin/payments": "payment.view",
  "/admin/membership-applications": "payment.view",
  "/admin/compliance": "compliance.manage",
  "/admin/settings": "compliance.manage",
  "/admin/reports": "reports.view",
  "/admin/referrals": "reports.view",
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
  const visibleGroups = navGroups[role]
    .map((group) => ({
      ...group,
      items:
        role === UserRole.ADMIN && adminContext
          ? group.items.filter(([href]) => {
              const permission = adminNavPermissions[href];
              return !permission || hasAdminPermission(adminContext.profile, permission);
            })
          : group.items,
    }))
    .filter((group) => group.items.length > 0);
  const primaryNav = visibleGroups.flatMap((group) => group.items).slice(0, 5);
  const notifications = await prisma.notification.count({
    where: { userId: session.userId, unread: true },
  });

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#fffaf0,#f7f2e8_48%,#f1f7e6)]">
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col border-r border-stone-200/80 bg-white/72 p-5 backdrop-blur-xl xl:flex">
        <Link href="/" className="block">
          <div className="rounded-2xl border border-stone-200 bg-[linear-gradient(135deg,#17211c,#334138)] p-4 text-white shadow-sm">
            <p className="text-xs font-black text-amber-200">小黄雀</p>
            <p className="mt-2 text-2xl font-black tracking-tight">KOL 投放平台</p>
            <p className="mt-2 text-xs leading-5 text-white/70">任务、审核、验收、财务统一协作。</p>
          </div>
        </Link>
        <nav className="mt-6 grid flex-1 gap-5 overflow-y-auto pr-1">
          {visibleGroups.map((group) => (
            <div key={group.title}>
              <p className="px-3 text-[0.68rem] font-black uppercase tracking-[0.18em] text-stone-400">{group.title}</p>
              <div className="mt-2 grid gap-1">
                {group.items.map(([href, label]) => (
                  <Link className="rounded-xl px-3 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-white hover:text-stone-950 hover:shadow-sm" href={href} key={href}>
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-5 rounded-2xl border border-stone-200 bg-white/80 p-4 text-sm text-stone-600">
          <p className="font-black text-stone-950">协作流程</p>
          <p className="mt-1">任务、审核、发布凭证、争议和钱包事件保持联动。</p>
        </div>
      </aside>
      <div className="xl:pl-72">
        <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-[rgba(255,250,240,0.88)] px-4 py-3 backdrop-blur-xl md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <StatusBadge>{role}</StatusBadge>
              <span className="max-w-[13rem] truncate text-sm text-stone-500 md:max-w-none">{session.email}</span>
              <Link href={`${roleRoot}/notifications`}>
                <StatusBadge>{notifications} 未读</StatusBadge>
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 xl:hidden">
              {primaryNav.map(([href, label]) => (
                <Link className="rounded-full border border-stone-200 bg-white/80 px-3 py-2 text-xs font-black text-stone-700 shadow-sm" href={href} key={href}>
                  {label}
                </Link>
              ))}
              <details className="group relative">
                <summary className="list-none rounded-full border border-stone-200 bg-white/90 px-3 py-2 text-xs font-black text-stone-800 shadow-sm marker:hidden">
                  全部菜单
                </summary>
                <div className="absolute right-0 top-11 z-30 grid max-h-[70vh] w-[min(22rem,calc(100vw-2rem))] gap-4 overflow-y-auto rounded-2xl border border-stone-200 bg-white p-4 shadow-xl">
                  {visibleGroups.map((group) => (
                    <div key={group.title}>
                      <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-stone-400">{group.title}</p>
                      <div className="mt-2 grid gap-1">
                        {group.items.map(([href, label]) => (
                          <Link className="rounded-xl px-3 py-2 text-sm font-bold text-stone-700 hover:bg-stone-50" href={href} key={href}>
                            {label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>
            <form action={logout}>
              <SubmitButton className="rounded-full px-4 py-2" pendingLabel="正在退出..." variant="ghost">
                退出登录
              </SubmitButton>
            </form>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
