import Link from "next/link";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  Handshake,
  Mail,
  Scale,
  ShieldCheck,
  Sparkles,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { getSession, roleHome } from "@/lib/auth";

export const navItems = [
  { label: "产品功能", href: "/features" },
  { label: "使用流程", href: "/workflow" },
  { label: "费用说明", href: "/pricing" },
  { label: "平台优势", href: "/proof" },
  { label: "关于我们", href: "/about" },
];

export const featureCards = [
  {
    icon: ClipboardList,
    title: "Campaign 创建向导",
    copy: "按步骤填写目标、平台、人数、奖励、素材和验收规则，新手商家也能快速发布标准化推广任务。",
  },
  {
    icon: UsersRound,
    title: "KOL 自由申请",
    copy: "创作者查看完整 brief 后提交申请，商家可以批量通过或拒绝，申请、通过、履约都有清晰记录。",
  },
  {
    icon: FileCheck2,
    title: "内容草稿审稿",
    copy: "商家发布时可选择是否需要草稿。需要审稿时，系统支持结构化草稿、附件预览和最多两轮修改。",
  },
  {
    icon: ShieldCheck,
    title: "发布链接验收",
    copy: "KOL 提交作品链接后，商家在 SLA 内验收。拒绝必须给出结构化原因，争议处理更有依据。",
  },
  {
    icon: WalletCards,
    title: "资金托管结算",
    copy: "Campaign 总额先托管，验收通过后释放到 KOL 钱包；退款、部分结算、提现都保留财务流水。",
  },
  {
    icon: BarChart3,
    title: "数据辅助核验",
    copy: "支持小红书、抖音链接格式校验和第三方数据快照，用于辅助账号真实性和作品效果判断。",
  },
];

export const workflowSteps = [
  { step: "01", title: "品牌创建推广", copy: "配置推广目标、平台任务、奖励人数、素材要求、广告披露和验收时间。" },
  { step: "02", title: "资金托管确认", copy: "商家先完成付款或余额冻结，平台确认到账后 Campaign 才进入可申请状态。" },
  { step: "03", title: "KOL 申请履约", copy: "创作者选择账号提交申请，通过后按 brief 提交草稿或直接发布链接。" },
  { step: "04", title: "商家验收交付", copy: "商家根据链接、凭证和系统抓取数据验收，超时会进入待处理提醒。" },
  { step: "05", title: "结算与报表", copy: "验收完成后收入进入 KOL 钱包，Campaign 报表和财务流水可导出复盘。" },
];

export const pricingItems = [
  { title: "平台服务费", value: "第一版 ¥0", copy: "保留服务费字段，当前版本先不向商家或 KOL 收取平台服务费。" },
  { title: "付款方式", value: "Campaign 总额托管", copy: "发布前按总预算一次性托管。余额足够时直接冻结，不足时提交付款凭证给 Admin 审核。" },
  { title: "提现规则", value: "最低 ¥20", copy: "KOL 验收后收入入账，提现申请由平台人工处理，方便早期控制资金风险。" },
];

export const proofItems = [
  { value: "自助", label: "小商家可以独立创建推广，不依赖运营手工拆任务。" },
  { value: "闭环", label: "申请、审稿、发布、验收、结算全部留在系统内。" },
  { value: "可追溯", label: "资金、状态、链接、凭证和抓取快照都有记录。" },
  { value: "可控", label: "托管资金、验收 SLA、争议记录和人工复核降低早期履约风险。" },
];

const campaigns = [
  { name: "新品种草推广", stage: "内容验收", budget: "¥120,000", progress: "75%", date: "2026-06-07", status: "进行中" },
  { name: "AI 工具体验活动", stage: "素材验收", budget: "¥80,000", progress: "60%", date: "2026-06-15", status: "进行中" },
  { name: "品牌日合作", stage: "内容验收", budget: "¥150,000", progress: "90%", date: "2026-06-20", status: "进行中" },
  { name: "短视频挑战赛", stage: "平台任务", budget: "¥60,000", progress: "40%", date: "2026-05-30", status: "进行中" },
  { name: "海外市场推广", stage: "结算中", budget: "¥100,000", progress: "100%", date: "2026-05-18", status: "已完成" },
];

const pendingTasks = [
  { type: "内容验收", title: "产品体验视频", kol: "KOL: @科技小明", time: "2 小时前", score: "8" },
  { type: "素材验收", title: "产品图集", kol: "KOL: @数码玩家", time: "5 小时前", score: "6" },
  { type: "交付验收", title: "海外推广图文", kol: "KOL: @Travel with Lily", time: "1 天前", score: "9" },
];

export async function getWorkspaceHref() {
  const session = await getSession();
  return session ? roleHome(session.role) : "/auth/login";
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: string;
  variant?: "primary" | "secondary" | "dark";
}) {
  const className = {
    primary:
      "inline-flex h-12 min-w-36 items-center justify-center rounded-xl bg-[#f5a900] px-6 text-sm font-black text-stone-950 shadow-sm transition hover:bg-[#e89f00]",
    secondary:
      "inline-flex h-12 min-w-36 items-center justify-center rounded-xl border border-stone-300 bg-white px-6 text-sm font-black text-stone-950 shadow-sm transition hover:border-stone-400",
    dark:
      "inline-flex h-12 min-w-36 items-center justify-center rounded-xl bg-stone-950 px-6 text-sm font-black text-white shadow-sm transition hover:bg-stone-800",
  }[variant];

  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}

export function Logo() {
  return (
    <Link className="flex items-center gap-3" href="/">
      <span className="relative grid h-10 w-10 place-items-center">
        <span className="absolute left-1 top-1 h-7 w-7 skew-x-[-18deg] bg-[#f5a900]" />
        <span className="absolute bottom-1 left-3 h-6 w-2 bg-[#f5a900]" />
      </span>
      <span className="text-2xl font-black tracking-[0.16em] text-stone-950">TANGLIN</span>
    </Link>
  );
}

export async function MarketingHeader() {
  const workspaceHref = await getWorkspaceHref();

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-20 max-w-[1500px] items-center justify-between px-6">
        <Logo />
        <div className="hidden items-center gap-10 text-sm font-black text-stone-800 lg:flex">
          {navItems.map((item) => (
            <Link className="transition hover:text-[#d89400]" href={item.href} key={item.label}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <ButtonLink href="/auth/login" variant="secondary">
            登录
          </ButtonLink>
          <ButtonLink href={workspaceHref}>进入工作台</ButtonLink>
        </div>
      </nav>
    </header>
  );
}

export function SectionHeading({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-black tracking-[0.18em] text-[#d99000]">{eyebrow}</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">{title}</h1>
      <p className="mt-4 text-base leading-8 text-stone-600">{copy}</p>
    </div>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-stone-500 md:flex-row md:items-center md:justify-between">
        <Logo />
        <p>Tanglin KOL 投放协作平台</p>
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen bg-white text-stone-950">{children}</main>;
}

export function DashboardPreview() {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-3 shadow-[0_30px_80px_rgba(68,64,60,0.12)]">
      <div className="grid min-h-[520px] overflow-hidden rounded-2xl border border-stone-200 bg-white lg:grid-cols-[180px_minmax(0,1fr)]">
        <aside className="hidden border-r border-stone-200 bg-white px-4 py-6 sm:block">
          <p className="text-sm font-black tracking-[0.18em]">TANGLIN</p>
          <div className="mt-6 grid gap-2 text-sm font-semibold text-stone-600">
            {["概览", "活动管理", "KOL 管理", "内容管理", "数据分析", "财务结算", "消息中心", "设置"].map((item, index) => (
              <div className={`rounded-xl px-3 py-3 ${index === 0 ? "bg-[#fff4d8] text-[#d99000]" : ""}`} key={item}>
                {item}
              </div>
            ))}
          </div>
        </aside>

        <div className="min-w-0 p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-black">概览</h2>
            <div className="flex items-center gap-2 text-xs font-black text-stone-500">
              <span className="grid h-7 w-7 place-items-center rounded-full border border-stone-200">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              品牌方
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {[
              { label: "进行中活动", value: "12", sub: "较上月 ↑ 20%" },
              { label: "待审核内容", value: "23", sub: "较上月 ↑ 15%" },
              { label: "本月预算", value: "¥368,000", sub: "已消耗 62%" },
              { label: "本月结算金额", value: "¥125,600", sub: "待结算 ¥42,300" },
            ].map((item) => (
              <div className="min-w-0 rounded-xl border border-stone-200 bg-white p-4" key={item.label}>
                <p className="text-xs font-semibold text-stone-500">{item.label}</p>
                <p className="mt-3 truncate text-xl font-black leading-tight xl:text-[1.38rem]">{item.value}</p>
                <p className="mt-2 text-xs text-stone-500">{item.sub}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-stone-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black">活动列表</h3>
              <span className="text-xs font-black text-[#d99000]">查看全部</span>
            </div>
            <div className="mt-4 hidden grid-cols-[1.35fr_0.8fr_0.9fr_0.85fr_1fr_0.72fr] gap-3 border-b border-stone-100 pb-2 text-xs font-black text-stone-400 md:grid">
              <span>活动名称</span>
              <span>阶段</span>
              <span>预算</span>
              <span>进度</span>
              <span>结束时间</span>
              <span>状态</span>
            </div>
            <div className="grid gap-1 pt-2 text-xs">
              {campaigns.map((item) => (
                <div className="grid gap-2 rounded-lg py-2 md:grid-cols-[1.35fr_0.8fr_0.9fr_0.85fr_1fr_0.72fr] md:items-center" key={item.name}>
                  <span className="min-w-0 truncate font-semibold text-stone-800">{item.name}</span>
                  <span className="min-w-0 truncate text-stone-600">{item.stage}</span>
                  <span>{item.budget}</span>
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    {item.progress}
                    <span className="h-1.5 w-10 rounded-full bg-stone-100">
                      <span className="block h-1.5 rounded-full bg-[#f5a900]" style={{ width: item.progress }} />
                    </span>
                  </span>
                  <span>{item.date}</span>
                  <span className={`w-fit rounded-full px-2 py-1 font-black ${item.status === "已完成" ? "bg-stone-100 text-stone-500" : "bg-emerald-50 text-emerald-700"}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black">待审核任务</h3>
                <span className="text-xs font-black text-[#d99000]">查看全部</span>
              </div>
              <div className="mt-3 grid gap-3 text-xs">
                {pendingTasks.map((item) => (
                  <div className="grid grid-cols-[0.75fr_1.1fr_1fr_0.6fr_auto] items-center gap-2" key={item.title}>
                    <span className="text-stone-500">{item.type}</span>
                    <span className="min-w-0 truncate font-semibold">{item.title}</span>
                    <span className="min-w-0 truncate text-stone-500">{item.kol}</span>
                    <span className="text-stone-500">{item.time}</span>
                    <span className="grid h-6 w-6 place-items-center rounded-full border border-[#f5a900] text-[0.68rem] font-black text-[#d99000]">{item.score}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black">资金与结算</h3>
                <span className="text-xs font-black text-[#d99000]">查看详情</span>
              </div>
              <div className="mt-4 grid gap-3 text-sm">
                <MoneyRow label="可用余额" value="¥86,400" />
                <MoneyRow label="待结算金额" value="¥42,300" />
                <MoneyRow label="本月已结算" value="¥83,300" />
              </div>
              <button className="mt-4 rounded-lg border border-stone-200 px-4 py-2 text-xs font-black">资金管理</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AboutCards() {
  const cards = [
    { icon: Building2, title: "服务对象", copy: "适合需要快速发布推广任务、筛选 KOL、确认交付结果的小商家和轻量运营团队。" },
    { icon: Handshake, title: "协作原则", copy: "重要节点必须留痕：申请、通过、草稿、发布链接、验收意见和资金变动都在站内记录。" },
    { icon: Scale, title: "合规边界", copy: "所有付费任务默认要求广告披露。平台只基于站内记录和提交凭证处理审核与争议。" },
    { icon: Mail, title: "平台联系", copy: "一般问题可通过邮箱联系；资金和任务争议必须在系统内提交，避免站外证据不完整。" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article className="rounded-2xl border border-white/10 bg-white/[0.06] p-6" key={card.title}>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#f5a900] text-stone-950">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-xl font-black">{card.title}</h3>
            <p className="mt-3 text-sm leading-7 text-stone-300">{card.copy}</p>
          </article>
        );
      })}
    </div>
  );
}

function MoneyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-stone-600">{label}</span>
      <span className="font-black">{value}</span>
    </div>
  );
}
