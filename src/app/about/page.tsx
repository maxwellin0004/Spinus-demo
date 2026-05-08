import { Building2, Handshake, Mail, Scale } from "lucide-react";
import { ButtonLink, getWorkspaceHref, MarketingFooter, MarketingHeader, PageShell } from "@/components/marketing";

const aboutCards = [
  { icon: Building2, title: "服务对象", copy: "适合需要快速发布推广任务、筛选 KOL、确认交付结果的小商家和轻量运营团队。" },
  { icon: Handshake, title: "协作原则", copy: "重要节点必须留痕：申请、通过、草稿、发布链接、验收意见和资金变动都在站内记录。" },
  { icon: Scale, title: "合规边界", copy: "所有付费任务默认要求广告披露。平台只基于站内记录和提交凭证处理审核与争议。" },
  { icon: Mail, title: "平台联系", copy: "一般问题可通过邮箱联系；资金和任务争议必须在系统内提交，避免站外证据不完整。" },
];

export default async function AboutPage() {
  const workspaceHref = await getWorkspaceHref();

  return (
    <PageShell>
      <MarketingHeader />
      <section className="border-b border-stone-200 bg-[linear-gradient(90deg,#ffffff_0%,#fffdf8_52%,#f8f6ee_100%)]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <div>
              <p className="text-sm font-black tracking-[0.22em] text-[#d99000]">ABOUT TANGLIN</p>
              <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-stone-950 md:text-5xl">
                我们把 KOL 投放做成可履约、可验收、可结算的协作系统
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-stone-600">
                Tanglin 面向自助型小商家、品牌运营团队和创作者，帮助双方把推广合作从聊天记录和表格里搬到系统里。平台不替代商业判断，而是把任务要求、申请审核、交付凭证、资金流转和争议证据沉淀为结构化记录。
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <ButtonLink href={workspaceHref}>进入工作台</ButtonLink>
                <ButtonLink href="mailto:support@tanglin.local" variant="secondary">
                  联系平台
                </ButtonLink>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {aboutCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm" key={card.title}>
                    <div className="grid h-12 w-12 place-items-center rounded-xl border border-[#f4dfa9] bg-[#fff8e8] text-[#d99000]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h2 className="mt-5 text-xl font-black text-stone-950">{card.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-stone-600">{card.copy}</p>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="mt-12 grid gap-4 border-t border-stone-200 pt-8 text-sm text-stone-600 md:grid-cols-3">
            <p>
              <span className="block font-black text-stone-950">当前阶段</span>
              第一版聚焦任务发布、自由申请、内容验收、链接交付、钱包结算和最小争议处理。
            </p>
            <p>
              <span className="block font-black text-stone-950">后续扩展</span>
              可继续增加邀请制、更多平台数据源、自动风险检测和更完整的经营分析。
            </p>
            <p>
              <span className="block font-black text-stone-950">联系方式</span>
              support@tanglin.local
            </p>
          </div>
        </div>
      </section>
      <MarketingFooter />
    </PageShell>
  );
}
