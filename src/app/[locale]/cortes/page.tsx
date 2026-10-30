import type { Metadata } from "next";
import Cow3D from "@/components/cow3d/Cow3D";
import ProductCard from "@/components/ProductCard";
import { MaskText, Reveal } from "@/components/Reveal";
import { cutProductsOf, type Locale } from "@/lib/catalog";
import { getCatalog } from "@/lib/catalog-server";
import { CUTS, PRIMALS, PRIMAL_ORDER } from "@/lib/cuts";
import { getDict } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDict(locale).map.kicker };
}

export const revalidate = 300;

export default async function CutsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const d = getDict(locale);
  const cutProducts = cutProductsOf(await getCatalog());
  return (
    <div className="px-4 pt-32 pb-28 md:px-8 md:pt-40">
      <div className="mx-auto max-w-7xl">
        <p className="label mb-5">{d.map.kicker}</p>
        <h1 className="h-display text-4xl leading-[1.05] md:text-7xl">
          <MaskText text={d.map.title} />
        </h1>
        <div className="mt-16">
          <Cow3D locale={locale} />
        </div>
        {PRIMAL_ORDER.map((k) => {
          const list = cutProducts.filter((p) => p.cut && CUTS[p.cut]?.primal === k);
          if (!list.length) return null;
          return (
            <section key={k} className="mt-24">
              <Reveal>
                <div className="mb-8 flex items-center gap-6">
                  <h2 className="h-display text-2xl md:text-3xl">{PRIMALS[k][locale]}</h2>
                  <span className="gold-rule flex-1" />
                  <span className="label">{list.length}</span>
                </div>
              </Reveal>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {list.map((p, i) => (
                  <Reveal key={p.slug} delay={i * 0.06}>
                    <ProductCard p={p} locale={locale} />
                  </Reveal>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
