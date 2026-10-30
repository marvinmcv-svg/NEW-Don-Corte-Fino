import type { Metadata } from "next";
import ShopGrid from "@/components/ShopGrid";
import { MaskText } from "@/components/Reveal";
import type { Locale } from "@/lib/catalog";
import { getDict } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDict(locale).store.titleFull };
}

export const revalidate = 300;

export default async function ShopPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const d = getDict(locale).store;
  return (
    <div className="px-4 pt-32 pb-28 md:px-8 md:pt-40">
      <div className="mx-auto max-w-7xl">
        <p className="label mb-5">{d.kicker}</p>
        <h1 className="h-display text-5xl md:text-7xl">
          <MaskText text={d.titleFull} />
        </h1>
        <p className="mt-6 max-w-2xl font-serif text-xl text-steel">{d.subFull}</p>
        <ShopGrid locale={locale} />
      </div>
    </div>
  );
}
