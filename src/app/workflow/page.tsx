import { MarketingFooter, MarketingHeader, PageShell, SectionHeading, workflowSteps } from "@/components/marketing";

export default function WorkflowPage() {
  return (
    <PageShell>
      <MarketingHeader />
      <section className="border-b border-stone-200 bg-[#fbfaf7]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <SectionHeading
            eyebrow="WORKFLOW"
            title="使用流程"
            copy="第一版围绕自由申请模式设计，让商家快速发任务、快速找人推广，同时保留资金和交付控制。"
          />
          <div className="mt-12 grid gap-4 lg:grid-cols-5">
            {workflowSteps.map((item) => (
              <article className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm" key={item.step}>
                <p className="text-sm font-black text-[#d99000]">{item.step}</p>
                <h2 className="mt-5 text-lg font-black leading-7">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-stone-600">{item.copy}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 rounded-2xl border border-stone-200 bg-white p-8">
            <h2 className="text-2xl font-black">关键控制点</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {["付款托管后才发布", "草稿审稿由商家选择", "验收和结算都有 SLA"].map((item) => (
                <div className="rounded-xl bg-[#fff8e8] p-5 text-sm font-black text-stone-800" key={item}>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <MarketingFooter />
    </PageShell>
  );
}
