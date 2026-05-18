import { notFound } from "next/navigation";
import { MarketingFooter, MarketingHeader, PageShell } from "@/components/marketing";
import { legalPages, legalUpdatedAt, type LegalSlug } from "@/lib/legal-content";

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!(slug in legalPages)) notFound();
  const page = legalPages[slug as LegalSlug];

  return (
    <PageShell>
      <MarketingHeader />
      <section className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#d99000]">Legal</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-stone-950 md:text-5xl">{page.title}</h1>
        <p className="mt-4 text-base leading-8 text-stone-600">{page.description}</p>
        <p className="mt-2 text-sm font-semibold text-stone-500">更新日期：{legalUpdatedAt}</p>
        <div className="mt-10 grid gap-6">
          {page.sections.map(([title, body]) => (
            <section className="border-t border-stone-200 pt-6" key={title}>
              <h2 className="text-xl font-black text-stone-950">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-stone-600">{body}</p>
            </section>
          ))}
        </div>
      </section>
      <MarketingFooter />
    </PageShell>
  );
}
