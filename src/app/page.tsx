import Link from "next/link";
import { LinkButton } from "@/components/ui";
import { getSession, roleHome } from "@/lib/auth";

const flow = ["发布推广", "KOL 申请", "内容审稿", "发布验收", "结算入账"];

const highlights = [
  {
    title: "品牌方自助发布",
    copy: "用结构化向导创建 Campaign，配置平台、人数、奖励、内容要求和托管预算。",
  },
  {
    title: "KOL 履约流程清晰",
    copy: "申请、草稿、发布链接、验收和钱包结算都在系统内留痕，减少站外沟通成本。",
  },
  {
    title: "平台运营可追踪",
    copy: "Admin 可以处理审核、付款、争议、抓取队列和财务报表，关键动作都有记录。",
  },
];

export default async function Home() {
  const session = await getSession();
  const primaryHref = session ? roleHome(session.role) : "/auth/login";

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_14%_6%,rgba(244,176,0,0.50)_0,transparent_24rem),radial-gradient(circle_at_88%_12%,rgba(103,232,249,0.32)_0,transparent_26rem),linear-gradient(135deg,#fffaf0,#f8f1df_48%,#eef8d7)] px-6 py-8">
      <nav className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="group flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--ink)] text-lg font-black text-white shadow-xl transition group-hover:rotate-3">
            T
          </span>
          <span>
            <span className="block text-sm font-black uppercase tracking-[0.28em] text-amber-800">TANGLIN</span>
            <span className="block text-xs font-semibold text-stone-500">KOL 投放协作平台</span>
          </span>
        </Link>
        <div className="flex gap-3">
          {session ? <LinkButton href={roleHome(session.role)} variant="ghost">进入工作台</LinkButton> : null}
          <LinkButton href="/auth/login">登录</LinkButton>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="stitch-stage">
          <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-stone-700 shadow-sm backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-[var(--lime)] shadow-[0_0_0_5px_rgba(163,230,53,0.2)]" />
            面向品牌、KOL 和平台方的自助投放系统
          </div>
          <h1 className="mt-7 max-w-5xl text-[3rem] font-black leading-[1.02] tracking-tight text-[var(--ink)] sm:text-6xl md:text-7xl">
            让品牌任务从发布到结算都有清晰流程。
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
            Tanglin 将 Campaign 创建、KOL 申请、内容草稿、发布链接验收、资金托管、钱包结算和报表导出放在同一个系统里，适合小商家快速发起推广，也适合平台运营统一追踪。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href={primaryHref} variant="secondary">{session ? "进入工作台" : "登录"}</LinkButton>
            {!session ? <LinkButton href="/auth/register" variant="ghost">注册工作台</LinkButton> : null}
          </div>
        </div>

        <div className="stitch-stage relative">
          <div className="relative rounded-[2.5rem] border border-stone-200 bg-white/72 p-5 shadow-[0_30px_100px_rgba(64,59,53,0.16)] backdrop-blur-2xl">
            <div className="rounded-[2rem] bg-[linear-gradient(135deg,#17211c,#344035)] p-6 text-white">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">Campaign workflow</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">投放履约闭环</h2>
              <div className="mt-6 grid gap-2">
                {flow.map((item, index) => (
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-4 py-3" key={item}>
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-xs font-black text-stone-950">{index + 1}</span>
                    <span className="font-semibold text-white/90">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 pb-16 md:grid-cols-3">
        {highlights.map((item) => (
          <div className="rounded-[2rem] border border-stone-200 bg-white/72 p-6 shadow-[0_20px_70px_rgba(64,59,53,0.10)] backdrop-blur-xl" key={item.title}>
            <h2 className="text-xl font-black text-stone-950">{item.title}</h2>
            <p className="mt-4 text-sm leading-6 text-stone-600">{item.copy}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
