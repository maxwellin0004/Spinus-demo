import Link from "next/link";
import { Check, Orbit, Rocket, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { UserRole } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { creatorMembershipLabel, creatorMembershipTone } from "@/lib/creator-membership-status";
import { creatorMembershipTiers } from "@/lib/creator-memberships";
import { shortDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui";

const membershipSignals = [
  { label: "12 个月", copy: "年度陪跑周期" },
  { label: "20+", copy: "每月选题方向" },
  { label: "1v1", copy: "专属诊断与共创" },
];

const growthEngines = [
  { icon: Sparkles, title: "内容成长", copy: "系统化选题、复盘和共创，让内容方向更清晰。" },
  { icon: UsersRound, title: "合作机会", copy: "更早接触品牌合作、实习证明和推荐资源。" },
  { icon: Rocket, title: "商业化", copy: "从接单、报价到项目经验，逐步建立变现能力。" },
  { icon: ShieldCheck, title: "保障机制", copy: "按年度陪跑和执行保障，减少成长中的试错成本。" },
];

function splitPrice(priceLabel: string) {
  const [price, unit] = priceLabel.split("/");
  return {
    price: price.trim(),
    unit: unit?.trim() ? `/ ${unit.trim()}` : "",
  };
}

export default async function CreatorMembershipPage() {
  const session = await requireRole(UserRole.CREATOR);
  const creator = await prisma.creatorProfile.findUnique({
    where: { userId: session.userId },
  });

  if (!creator) {
    return null;
  }

  return (
    <div className="relative -mx-4 -my-6 overflow-hidden px-4 pb-16 pt-12 md:-mx-8 md:px-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_12%,rgba(255,197,51,0.34),transparent_24%),radial-gradient(circle_at_50%_46%,rgba(139,61,255,0.16),transparent_24%),linear-gradient(135deg,#fff7e6_0%,#f4ead8_48%,#eadfce_100%)]" />
      <div className="pointer-events-none absolute left-[9%] top-16 -z-10 h-72 w-72 rounded-full bg-white/35 blur-3xl" />

      <section className="mx-auto mb-4 grid max-w-6xl gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-stone-900/6 bg-white/70 p-5 shadow-sm backdrop-blur-xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">当前会员</p>
          <div className="mt-3">
            <StatusBadge tone={creatorMembershipTone(creator.membershipTier)}>{creatorMembershipLabel(creator.membershipTier)}</StatusBadge>
          </div>
        </div>
        <div className="rounded-[24px] border border-stone-900/6 bg-white/70 p-5 shadow-sm backdrop-blur-xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">到期时间</p>
          <p className="mt-3 text-xl font-black text-stone-950">{creator.membershipEndsAt ? shortDate(creator.membershipEndsAt) : "未设置"}</p>
        </div>
        <div className="rounded-[24px] border border-stone-900/6 bg-white/70 p-5 shadow-sm backdrop-blur-xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">开通入口</p>
          <Link className="mt-3 inline-flex rounded-full bg-stone-950 px-5 py-2.5 text-sm font-black text-white" href="/creator/membership/checkout">
            去联系开通
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
        <div>
          <p className="font-['Avenir_Next','Segoe_UI',Arial,sans-serif] text-xs font-black uppercase tracking-[0.38em] text-[#b65a08]">
            Creator Membership
          </p>
          <h1 className="mt-4 max-w-3xl font-['PingFang_SC','Microsoft_YaHei_UI','Microsoft_YaHei',sans-serif] text-[clamp(3rem,6vw,4.7rem)] font-black leading-[0.98] tracking-[-0.06em] text-[#101812]">
            让校园影响力
            <br />
            <span className="bg-[linear-gradient(90deg,#101812_0%,#5f420c_48%,#d28a00_100%)] bg-clip-text text-transparent">
              长成商业价值
            </span>
          </h1>
          <p className="mt-6 max-w-2xl font-['PingFang_SC','Microsoft_YaHei_UI','Microsoft_YaHei',sans-serif] text-[15.5px] font-medium leading-8 tracking-[0.01em] text-stone-600">
            会员方案不只是价格页，而是一条创作者升级路径：从账号诊断、选题陪跑，到内容共创与商业资源推荐，让用户清楚知道自己买到的是“成长确定性”。
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link className="rounded-full bg-[#101812] px-6 py-3 text-sm font-black text-white shadow-[0_18px_34px_rgba(16,24,18,0.2)] transition hover:-translate-y-0.5 hover:bg-[#1d2a21]" href="/creator/membership/checkout">
              立即选择方案
            </Link>
            <a className="rounded-full border border-stone-900/10 bg-white/70 px-6 py-3 text-sm font-black text-stone-950 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white" href="#plans">
              先做账号评估
            </a>
          </div>
        </div>

        <div className="relative min-h-[268px] overflow-hidden rounded-[34px] bg-[linear-gradient(145deg,#0c1a12,#203b2c)] p-6 text-white shadow-[0_34px_90px_rgba(27,38,25,0.24)]">
          <div className="absolute -right-24 -top-36 h-96 w-96 rounded-full bg-[radial-gradient(circle,#ffcf3f_0%,rgba(255,207,63,0.82)_28%,rgba(255,207,63,0)_68%)]" />
          <div className="absolute inset-[18px] rounded-[26px] border border-white/10" />
          <div className="relative z-10 max-w-[58%] pt-3">
            <p className="font-['Avenir_Next','Segoe_UI',Arial,sans-serif] text-xs font-black uppercase tracking-[0.3em] text-[#ffe987]">
              Growth Engine
            </p>
            <h2 className="mt-5 font-['PingFang_SC','Microsoft_YaHei_UI','Microsoft_YaHei',sans-serif] text-3xl font-black leading-tight tracking-[-0.035em]">
              账号定位 × 内容系统
              <br />× 商业机会
            </h2>
            <p className="mt-4 text-sm font-medium leading-7 text-white/68">用更高级的视觉把“会员”包装成一套创作者成长引擎。</p>
          </div>
          <div className="absolute right-10 top-9 h-44 w-44 rounded-full border border-dashed border-white/25">
            <div className="absolute -left-4 top-11 grid h-14 w-14 place-items-center rounded-2xl border border-white/15 bg-white/12 font-black backdrop-blur-xl">IP</div>
            <div className="absolute right-2 -top-3 grid h-14 w-14 place-items-center rounded-2xl bg-[#ffc533] font-black text-[#171006]">¥</div>
            <div className="absolute bottom-0 right-4 grid h-14 w-14 place-items-center rounded-2xl border border-white/15 bg-white/12 font-black backdrop-blur-xl">KOC</div>
          </div>
          <Orbit className="absolute bottom-8 right-56 h-5 w-5 text-white/30" />
        </div>
      </section>

      <section className="mx-auto mt-8 grid max-w-6xl gap-3 md:grid-cols-3">
        {membershipSignals.map((signal) => (
          <div className="rounded-[24px] border border-stone-900/5 bg-white/58 p-5 shadow-[0_18px_50px_rgba(54,42,20,0.07)] backdrop-blur-xl" key={signal.label}>
            <p className="font-['DIN_Alternate','Bahnschrift','Arial_Narrow',Arial,sans-serif] text-3xl font-black tracking-[-0.02em] text-stone-950">{signal.label}</p>
            <p className="mt-1 text-sm font-medium text-stone-500">{signal.copy}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto mt-5 grid max-w-6xl gap-6 lg:grid-cols-[0.96fr_1.04fr]" id="plans">
        {creatorMembershipTiers.map((tier) => {
          const isPro = tier.slug === "pro";
          const { price, unit } = splitPrice(tier.priceLabel);
          const visibleBenefits = tier.benefits.slice(0, 5);

          return (
            <article
              className={cn(
                "relative overflow-hidden rounded-[34px] border shadow-[0_28px_80px_rgba(52,42,23,0.1)]",
                isPro
                  ? "border-white/10 bg-[linear-gradient(180deg,rgba(20,21,19,0.98),rgba(18,30,23,0.96))] text-white lg:-mt-3"
                  : "border-stone-900/10 bg-white/72 text-stone-950",
              )}
              key={tier.slug}
            >
              {isPro ? (
                <>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(139,61,255,0.52),transparent_28%),radial-gradient(circle_at_25%_18%,rgba(255,197,51,0.18),transparent_22%)]" />
                  <div className="absolute right-7 top-7 rounded-full bg-[linear-gradient(90deg,#ffdc68,#ffb300)] px-4 py-2 text-sm font-black text-[#1a1000]">
                    推荐开通
                  </div>
                </>
              ) : null}

              <div className="relative p-7 md:p-8">
                <span className={cn("inline-flex h-8 items-center rounded-full px-4 font-['Avenir_Next','Segoe_UI',Arial,sans-serif] text-[11px] font-black uppercase tracking-[0.16em]", isPro ? "bg-[#ffc533] text-[#191003]" : "bg-[#fff3c5] text-[#7a4b00]")}>
                  {isPro ? "Campus Creator Pro" : "Starter Path"}
                </span>

                <h3 className="mt-6 font-['PingFang_SC','Microsoft_YaHei_UI','Microsoft_YaHei',sans-serif] text-[2.35rem] font-black leading-tight tracking-[-0.04em]">
                  {tier.title}
                </h3>
                <p className={cn("mt-3 max-w-xl text-sm font-medium leading-7", isPro ? "text-white/68" : "text-stone-600")}>{tier.subtitle}</p>

                <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className={cn("text-xs font-black uppercase tracking-[0.16em]", isPro ? "text-white/40" : "text-stone-400")}>会员价格</p>
                    <div className="mt-2 flex items-end gap-2">
                      <p className="font-['DIN_Alternate','Bahnschrift','Arial_Black',Arial,sans-serif] text-6xl font-black leading-none tracking-[-0.05em]">{price}</p>
                      <p className={cn("pb-2 text-xl font-black", isPro ? "text-white" : "text-stone-950")}>{unit}</p>
                    </div>
                  </div>
                  <span className={cn("rounded-full px-4 py-2 text-sm font-black", isPro ? "bg-white/10 text-[#ffe987]" : "bg-stone-950/6 text-stone-700")}>{tier.ribbon}</span>
                </div>

                <div className="mt-8 grid gap-3">
                  {visibleBenefits.map((benefit) => (
                    <div className={cn("flex min-h-[50px] items-center gap-3 rounded-[17px] border px-4 py-3 font-['PingFang_SC','Microsoft_YaHei_UI','Microsoft_YaHei',sans-serif] text-sm font-bold tracking-[-0.01em]", isPro ? "border-white/12 bg-white/8 text-white" : "border-stone-900/8 bg-white/70 text-stone-900")} key={benefit}>
                      <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full", isPro ? "bg-[#ffd14f] text-[#111]" : "bg-[#101812] text-[#ffd14f]")}>
                        <Check className="h-4 w-4 stroke-[4]" />
                      </span>
                      {benefit}
                    </div>
                  ))}
                </div>

                <Link className={cn("mt-5 flex h-14 w-full items-center justify-center rounded-[18px] text-base font-black shadow-sm transition hover:-translate-y-0.5 active:translate-y-0", isPro ? "bg-[linear-gradient(90deg,#ffd24c,#ffae00)] text-[#171006] shadow-[0_18px_40px_rgba(255,184,0,0.24)]" : "bg-[#101812] text-white hover:bg-[#1d2a21]")} href={`/creator/membership/checkout?tier=${tier.slug}`}>
                  {isPro ? "立即开通高阶会员" : "选择成长会员"}
                </Link>
              </div>
            </article>
          );
        })}
      </section>

      <section className="mx-auto mt-5 max-w-6xl rounded-[28px] border border-stone-900/8 bg-white/55 p-4 shadow-[0_18px_50px_rgba(54,42,20,0.07)] backdrop-blur-xl md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-base font-black text-stone-950">不确定选哪档？先让系统判断账号阶段</p>
            <p className="mt-1 text-sm font-medium text-stone-500">3 分钟评估账号基础、内容方向和变现目标，推荐更合适的会员路径。</p>
          </div>
          <Link className="w-fit rounded-full border border-stone-900/10 bg-white px-5 py-2.5 text-sm font-black text-stone-950 shadow-sm" href="/creator/membership/checkout">
            查看完整权益对比
          </Link>
        </div>
      </section>

      <section className="mx-auto mt-5 grid max-w-6xl gap-3 md:grid-cols-2 lg:grid-cols-4">
        {growthEngines.map((signal) => {
          const Icon = signal.icon;
          return (
            <div className="rounded-[26px] border border-stone-900/6 bg-white/72 p-5 shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-md" key={signal.title}>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#14251c,#0c1711)] text-[#ffd14f] shadow-inner">
                <Icon className="h-5 w-5" />
              </div>
              <h4 className="text-base font-black tracking-tight text-stone-950">{signal.title}</h4>
              <p className="mt-2 text-sm font-medium leading-6 text-stone-500">{signal.copy}</p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
