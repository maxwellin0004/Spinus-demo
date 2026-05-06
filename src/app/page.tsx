import Link from "next/link";
import { getSession, roleHome } from "@/lib/auth";
import { LinkButton, MetricCard, StatusBadge } from "@/components/ui";

const flow = [
  "品牌简报",
  "平台审核",
  "创作者工作台",
  "内容审批",
  "证明验证",
  "钱包结算",
  "报告导出",
];

const workspaces = [
  {
    title: "平台运营控制台",
    copy: "审核品牌、Campaign、内容、Proof 和结算，所有关键动作写入 audit log。",
    href: "/admin",
    tint: "from-stone-950 to-stone-700",
  },
  {
    title: "品牌投放作战室",
    copy: "用 7 步表单发布 Campaign，审核创作者内容，查看投放报告和 CSV。",
    href: "/brand",
    tint: "from-amber-500 to-orange-400",
  },
  {
    title: "创作者内容工作台",
    copy: "接任务、用 AI 生成脚本与标题、人工发布后回传 proof 并提现。",
    href: "/creator",
    tint: "from-lime-400 to-cyan-300",
  },
];

export default async function Home() {
  const session = await getSession();
  const metrics = [
    ["3", "角色工作台"],
    ["16", "交付阶段"],
    ["10+", "数据库指标"],
    ["AI", "模拟/真实模型"],
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_14%_6%,rgba(244,176,0,0.50)_0,transparent_24rem),radial-gradient(circle_at_88%_12%,rgba(103,232,249,0.32)_0,transparent_26rem),linear-gradient(135deg,#fffaf0,#f8f1df_48%,#eef8d7)] px-6 py-8">
      <nav className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="group flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--ink)] text-lg font-black text-white shadow-xl transition group-hover:rotate-3">
            T
          </span>
          <span>
            <span className="block text-sm font-black uppercase tracking-[0.28em] text-amber-800">小黄雀联盟</span>
          <span className="block text-xs font-semibold text-stone-500">小黄雀联盟</span>
          </span>
        </Link>
        <div className="flex gap-3">
          {session ? <LinkButton href={roleHome(session.role)} variant="ghost">Open workspace</LinkButton> : null}
          <LinkButton href="/auth/login">Sign in</LinkButton>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="stitch-stage">
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-stone-700 shadow-sm backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-[var(--lime)] shadow-[0_0_0_5px_rgba(163,230,53,0.2)]" />
            Google Stitch 风格重设计
          </div>
          <h1 className="mt-7 max-w-5xl text-[3rem] font-black leading-[1.02] tracking-[-0.045em] text-[var(--ink)] sm:text-6xl md:text-8xl">
            AI 创作者增长任务的三方协作画布。
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
            从品牌 Brief 到创作者 AI 内容、发布证明、钱包结算和报告导出，Tanglin Rd 把每个状态、审核意见和资金流都放进同一个可追踪运营系统。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="/auth/login" variant="secondary">Use test accounts</LinkButton>
            <LinkButton href="/auth/register" variant="ghost">Register workspace</LinkButton>
          </div>
          <div className="mt-7 rounded-[2rem] border border-stone-200 bg-white/72 p-5 text-sm text-stone-600 shadow-[0_22px_70px_rgba(64,59,53,0.10)] backdrop-blur">
            <p className="font-black text-stone-950">演示账号</p>
            <p className="mt-2 break-words leading-6">
              <strong>admin@test.com</strong>, <strong>brand@test.com</strong>, <strong>creator@test.com</strong> / password123
            </p>
          </div>
        </div>

        <div className="stitch-stage relative">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--accent)]/30 blur-3xl" />
          <div className="absolute -bottom-8 left-6 h-36 w-36 rounded-full bg-[var(--cyan)]/35 blur-3xl" />
          <div className="relative rounded-[2.5rem] border border-stone-200 bg-white/72 p-5 shadow-[0_30px_100px_rgba(64,59,53,0.16)] backdrop-blur-2xl">
            <div className="rounded-[2rem] bg-[linear-gradient(135deg,#17211c,#344035)] p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">实时投放看板</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight">创作者投放闭环</h2>
                </div>
                <StatusBadge>v1 closed loop</StatusBadge>
              </div>
              <div className="mt-6 grid gap-2">
                {flow.map((item, index) => (
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-4 py-3" key={item}>
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-xs font-black text-stone-950">{index + 1}</span>
                    <span className="font-semibold text-white/90">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4">
              {metrics.map(([value, label]) => (
                <MetricCard key={label} label={label} value={value} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 pb-16 md:grid-cols-3">
        {workspaces.map((workspace) => {
          const href = session ? roleHome(session.role) : "/auth/login";
          return (
            <Link
              className="group rounded-[2rem] border border-stone-200 bg-white/72 p-5 shadow-[0_20px_70px_rgba(64,59,53,0.10)] backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-[0_28px_90px_rgba(64,59,53,0.15)]"
              href={href}
              key={workspace.title}
            >
              <div className={`h-28 rounded-[1.5rem] bg-gradient-to-br ${workspace.tint} p-4 text-white`}>
                <p className="text-xs font-black uppercase tracking-[0.2em] opacity-75">工作台</p>
                <p className="mt-6 text-2xl font-black tracking-tight">{workspace.title}</p>
              </div>
              <p className="mt-4 text-sm leading-6 text-stone-600">{workspace.copy}</p>
              <p className="mt-5 text-sm font-black text-stone-950 transition group-hover:translate-x-1">进入画布 →</p>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
