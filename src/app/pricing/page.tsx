import { ButtonLink, getWorkspaceHref, MarketingFooter, MarketingHeader, PageShell, pricingItems, SectionHeading } from "@/components/marketing";

export default async function PricingPage() {
  const workspaceHref = await getWorkspaceHref();

  return (
    <PageShell>
      <MarketingHeader />
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <SectionHeading
            eyebrow="PRICING"
            title="费用说明"
            copy="当前版本先保证投放闭环和资金留痕，平台服务费字段已保留，第一版暂不收取。"
          />
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {pricingItems.map((item) => (
              <article className="rounded-2xl border border-stone-200 bg-white p-7 shadow-sm" key={item.title}>
                <p className="text-sm font-black text-stone-500">{item.title}</p>
                <p className="mt-4 text-3xl font-black">{item.value}</p>
                <p className="mt-5 text-sm leading-7 text-stone-600">{item.copy}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 rounded-3xl bg-stone-950 p-8 text-white md:flex md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black">发布前先托管，完成后再结算</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-300">
                这套规则适合早期平台控制资金风险，也能让 KOL 明确知道收入何时释放。
              </p>
            </div>
            <div className="mt-6 md:mt-0">
              <ButtonLink href={workspaceHref}>进入工作台</ButtonLink>
            </div>
          </div>
        </div>
      </section>
      <MarketingFooter />
    </PageShell>
  );
}
