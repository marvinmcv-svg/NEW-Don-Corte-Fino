import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import type { Locale } from "@/lib/catalog";
import { LEGAL } from "@/lib/legal";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const doc = LEGAL.privacy[locale];
  return { title: doc.title, description: doc.intro.slice(0, 155), alternates: { languages: { es: "/es/privacidad", en: "/en/privacidad" } } };
}

export default async function Page({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <LegalPage doc={LEGAL.privacy[locale]} locale={locale} />;
}
