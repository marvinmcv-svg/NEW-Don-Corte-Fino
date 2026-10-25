import type { Metadata } from "next";
import Checkout from "@/components/Checkout";
import type { Locale } from "@/lib/catalog";
import { getDict } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDict(locale).checkout.title, robots: { index: false } };
}

export default async function CheckoutPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return <Checkout locale={locale} />;
}
