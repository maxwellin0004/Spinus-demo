import { MarketingFooter, MarketingHeader, PageShell, proofItems, SectionHeading } from "@/components/marketing";

export default function ProofPage() {
  return (
    <PageShell>
      <MarketingHeader />
      <section className="bg-[#fbfaf7]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <SectionHeading
            eyebrow="为什么选择小黄雀"
            title="平台优势"
            copy="小黄雀不做复杂的泛营销平台，第一阶段聚焦小商家和种子 KOL 的高频履约问题。"
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {proofItems.map((item) => (
              <article className="rounded-2xl border border-stone-200 bg-white p-7 shadow-sm" key={item.value}>
                <p className="text-4xl font-black text-[#d99000]">{item.value}</p>
                <p className="mt-5 text-sm leading-7 text-stone-600">{item.label}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <MarketingFooter />
    </PageShell>
  );
}
