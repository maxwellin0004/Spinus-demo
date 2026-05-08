import { featureCards, MarketingFooter, MarketingHeader, PageShell, SectionHeading } from "@/components/marketing";

export default function FeaturesPage() {
  return (
    <PageShell>
      <MarketingHeader />
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <SectionHeading
            eyebrow="PRODUCT FEATURES"
            title="产品功能"
            copy="把品牌、创作者和平台运营放进同一个履约系统，减少站外沟通、人工对账和无效追问。"
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((feature) => {
              const Icon = feature.icon;
              return (
                <article className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" key={feature.title}>
                  <div className="grid h-14 w-14 place-items-center rounded-2xl border border-[#f4dfa9] bg-[#fff8e8] text-[#f5a900]">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h2 className="mt-6 text-xl font-black">{feature.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-stone-600">{feature.copy}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <MarketingFooter />
    </PageShell>
  );
}
