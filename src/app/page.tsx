import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Box,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  Filter,
  Home as HomeIcon,
  LayoutDashboard,
  LockKeyhole,
  MessageSquare,
  PieChart,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Upload,
  User,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { getWorkspaceHref, Logo, PageShell } from "@/components/marketing";

const navItems = [
  { label: "产品功能", href: "/features" },
  { label: "使用流程", href: "/workflow" },
  { label: "费用说明", href: "/pricing" },
  { label: "平台优势", href: "/proof" },
  { label: "关于我们", href: "/about" },
];

const brandActions = [
  { icon: Send, label: "发布推广" },
  { icon: Filter, label: "筛选申请" },
  { icon: ShieldCheck, label: "验收结算" },
];

const kolActions = [
  { icon: Search, label: "申请任务" },
  { icon: Upload, label: "提交作品" },
  { icon: WalletCards, label: "钱包提现" },
];

const campaigns = [
  { name: "新品种草推广", budget: "¥120,000", progress: "75%", date: "2026-06-07", image: "/campaign-thumbs/campaign-1.png" },
  { name: "AI 工具体验活动", budget: "¥80,000", progress: "60%", date: "2026-06-15", image: "/campaign-thumbs/campaign-2.png" },
  { name: "品牌日合作", budget: "¥150,000", progress: "90%", date: "2026-06-20", image: "/campaign-thumbs/campaign-3.png" },
];

const valueItems = [
  { icon: ShieldCheck, title: "流程可信", copy: "标准化流程，关键节点留痕可追溯" },
  { icon: LockKeyhole, title: "数据安全", copy: "多重加密与权限控制，保障数据安全" },
  { icon: Clock3, title: "高效协同", copy: "自动化提醒与协同，提升执行效率" },
  { icon: PieChart, title: "清晰可控", copy: "数据驱动决策，预算与效果实时掌控" },
];

export default async function Home() {
  const workspaceHref = await getWorkspaceHref();

  return (
    <PageShell>
      <header className="border-b border-stone-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex h-20 max-w-[1500px] items-center justify-between px-6">
          <Logo />
          <div className="hidden items-center gap-12 text-sm font-black text-stone-800 lg:flex">
            {navItems.map((item) => (
              <Link className="transition hover:text-[#c98200]" href={item.href} key={item.label}>
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <TopEntry href="/auth/register?role=BRAND" variant="light">
              品牌方入口
            </TopEntry>
            <TopEntry href="/auth/register?role=CREATOR" variant="dark">
              KOL入口
            </TopEntry>
          </div>
        </nav>
      </header>

      <section className="bg-[#fbfaf6]">
        <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1500px] gap-14 px-6 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="max-w-[690px]">
            <p className="inline-flex rounded-full border border-[#d6a348] bg-white px-5 py-2 text-xs font-black tracking-[0.16em] text-[#b87500]">
              BRAND × CREATOR COLLABORATION
            </p>
            <h1 className="mt-8 max-w-[680px] text-[3.7rem] font-black leading-[1.08] tracking-tight text-stone-950 md:text-[5rem]">
              让推广合作更清晰
            </h1>
            <p className="mt-7 max-w-[610px] text-lg leading-9 text-stone-600">
              Tanglin 连接品牌方与创作者，把任务发布、申请筛选、内容确认、发布验收和资金结算放进同一套可信流程。
            </p>

            <RoleAccessPanel />

            <div className="mt-7 flex flex-wrap items-center gap-5 text-sm font-semibold text-stone-500">
              <Link className="inline-flex items-center gap-2 text-stone-950 underline underline-offset-4" href={workspaceHref}>
                已有账号，进入工作台
                <ArrowRight className="h-4 w-4" />
              </Link>
              <span>任务、内容、资金和争议全流程留痕</span>
            </div>
          </div>

          <DashboardMockup />
        </div>

        <div className="mx-auto max-w-[1500px] px-6 pb-14">
          <div className="grid gap-6 border-t border-stone-200 pt-9 md:grid-cols-4">
            {valueItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <article className={`flex gap-5 ${index > 0 ? "md:border-l md:border-stone-200 md:pl-8" : ""}`} key={item.title}>
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-[#c98200]">
                    <Icon className="h-8 w-8 stroke-[1.7]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-stone-950">{item.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-stone-500">{item.copy}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function TopEntry({ href, children, variant }: { href: string; children: string; variant: "light" | "dark" }) {
  return (
    <Link
      className={
        variant === "dark"
          ? "inline-flex h-12 items-center justify-center rounded-xl bg-stone-950 px-6 text-sm font-black text-white shadow-sm transition hover:bg-stone-800"
          : "inline-flex h-12 items-center justify-center rounded-xl border border-[#d7c5a4] bg-white px-6 text-sm font-black text-stone-950 shadow-sm transition hover:border-[#c98200]"
      }
      href={href}
    >
      {children}
    </Link>
  );
}

function RoleAccessPanel() {
  return (
    <div className="mt-10 overflow-hidden rounded-2xl border border-[#d8b56d] bg-white shadow-[0_18px_50px_rgba(68,64,60,0.08)]">
      <div className="grid grid-cols-2 bg-stone-950 text-sm font-black">
        <Link
          className="relative flex h-16 items-center justify-center gap-3 border border-[#d8b56d] bg-[#fffaf0] text-[#c98200]"
          href="/auth/register?role=BRAND"
        >
          <LayoutDashboard className="h-5 w-5" />
          品牌方
          <span className="absolute -bottom-2 h-4 w-4 rotate-45 border-b border-r border-[#d8b56d] bg-[#fffaf0]" />
        </Link>
        <Link className="flex h-16 items-center justify-center gap-3 text-white transition hover:bg-stone-800" href="/auth/register?role=CREATOR">
          <User className="h-5 w-5" />
          KOL
        </Link>
      </div>

      <RoleRow
        actions={brandActions}
        copy="发布推广，筛选 KOL，验收交付，查看报表"
        href="/auth/register?role=BRAND"
        icon={Box}
        theme="gold"
        title="品牌方"
      />
      <RoleRow
        actions={kolActions}
        copy="发现任务，申请合作，提交作品，钱包提现"
        href="/auth/register?role=CREATOR"
        icon={User}
        theme="dark"
        title="KOL"
      />
    </div>
  );
}

function RoleRow({
  actions,
  copy,
  href,
  icon: Icon,
  theme,
  title,
}: {
  actions: Array<{ icon: typeof Send; label: string }>;
  copy: string;
  href: string;
  icon: typeof Box;
  theme: "gold" | "dark";
  title: string;
}) {
  return (
    <Link className="grid items-center gap-5 border-t border-stone-200 px-5 py-5 transition hover:bg-[#fffaf0] md:grid-cols-[auto_1fr_1.25fr_auto]" href={href}>
      <div className={theme === "gold" ? "grid h-14 w-14 place-items-center rounded-xl bg-[#f3c15f] text-[#8a5a00]" : "grid h-14 w-14 place-items-center rounded-xl bg-stone-950 text-white"}>
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <h2 className="text-2xl font-black text-stone-950">{title}</h2>
        <p className="mt-1 text-sm text-stone-600">{copy}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {actions.map((action) => {
          const ActionIcon = action.icon;
          return (
            <span className="grid min-h-14 place-items-center gap-1 border-l border-stone-200 px-2 text-center text-xs font-semibold text-stone-700" key={action.label}>
              <ActionIcon className={theme === "gold" ? "h-5 w-5 text-[#c98200]" : "h-5 w-5 text-stone-950"} />
              {action.label}
            </span>
          );
        })}
      </div>
      <span className={theme === "gold" ? "grid h-11 w-11 place-items-center rounded-xl bg-[#c98200] text-white" : "grid h-11 w-11 place-items-center rounded-xl bg-stone-950 text-white"}>
        <ArrowRight className="h-5 w-5" />
      </span>
    </Link>
  );
}

function DashboardMockup() {
  return (
    <div className="rounded-[1.5rem] border border-stone-200 bg-white p-3 shadow-[0_28px_90px_rgba(68,64,60,0.10)]">
      <div className="grid overflow-hidden rounded-[1.25rem] border border-stone-200 bg-white lg:grid-cols-[170px_minmax(0,1fr)]">
        <aside className="hidden border-r border-stone-200 bg-[#fffdfa] p-5 lg:block">
          <p className="text-sm font-black tracking-[0.18em]">TANGLIN</p>
          <div className="mt-7 grid gap-2 text-sm font-semibold text-stone-600">
            {[
              { icon: HomeIcon, label: "概览", active: true },
              { icon: CalendarDays, label: "活动管理" },
              { icon: UsersRound, label: "KOL 管理" },
              { icon: FileCheck2, label: "内容管理" },
              { icon: BarChart3, label: "数据分析" },
              { icon: CircleDollarSign, label: "资金结算" },
              { icon: MessageSquare, label: "消息中心" },
              { icon: Settings, label: "设置" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div className={`flex items-center gap-3 rounded-xl px-3 py-3 ${item.active ? "bg-[#fff1d4] text-[#c98200]" : ""}`} key={item.label}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </div>
              );
            })}
          </div>
        </aside>

        <div className="min-w-0 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-black">概览</h2>
            <div className="flex items-center gap-3 text-xs font-bold text-stone-500">
              <Bell className="h-4 w-4" />
              <User className="h-4 w-4" />
              品牌方
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <Metric label="进行中活动" value="12" sub="较上月 ↑ 20%" />
            <Metric label="待审核内容" value="23" sub="较上月 ↑ 15%" />
            <Metric label="本月预算" value="¥368,000" sub="已消耗 62%" />
            <Metric label="本月结算金额" value="¥125,600" sub="待结算 ¥42,300" />
          </div>

          <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black">进行中活动</h3>
              <span className="text-xs font-black text-[#c98200]">查看全部 ›</span>
            </div>
            <div className="mt-4 grid gap-1">
              {campaigns.map((item, index) => (
                <div className="grid items-center gap-3 rounded-xl py-3 text-xs md:grid-cols-[1.3fr_0.8fr_0.8fr_0.9fr_0.7fr]" key={item.name}>
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      alt={`${item.name} 缩略图`}
                      className="h-10 w-10 shrink-0 rounded-lg border border-stone-200 object-cover shadow-sm"
                      src={item.image}
                    />
                    <span className="truncate font-black text-stone-800">{item.name}</span>
                  </div>
                  <span>
                    <span className="block text-stone-400">预算</span>
                    {item.budget}
                  </span>
                  <span>
                    <span className="block text-stone-400">进度</span>
                    {item.progress}
                  </span>
                  <span>
                    <span className="block text-stone-400">截止</span>
                    {item.date}
                  </span>
                  <span className="w-fit rounded-full bg-emerald-50 px-2 py-1 font-black text-emerald-700">进行中</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <SmallPanel title="待审核任务" copy="内容确认、资质审核等任务待处理" badge="8" />
            <SmallPanel title="资金与结算" copy="可用余额 ¥86,400" icon={CircleDollarSign} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="text-xs font-semibold text-stone-500">{label}</p>
      <p className="mt-3 truncate text-xl font-black">{value}</p>
      <p className="mt-2 text-xs text-stone-500">{sub}</p>
    </div>
  );
}

function SmallPanel({ title, copy, badge, icon: Icon }: { title: string; copy: string; badge?: string; icon?: typeof CircleDollarSign }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-black">{title}</h3>
        {badge ? <span className="grid h-7 w-7 place-items-center rounded-full bg-[#fff1d4] text-xs font-black text-[#c98200]">{badge}</span> : null}
        {Icon ? <Icon className="h-6 w-6 text-[#c98200]" /> : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-stone-600">{copy}</p>
    </div>
  );
}
