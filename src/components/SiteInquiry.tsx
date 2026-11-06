"use client";

import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/catalog";
import InquiryFunnel from "./InquiryFunnel";

/** The WhatsApp inquiry funnel on every page, except checkout, which already ends in WhatsApp. */
export default function SiteInquiry({ locale, whatsapp }: { locale: Locale; whatsapp: string }) {
  const pathname = usePathname();
  if (/\/checkout$/.test(pathname)) return null;
  return <InquiryFunnel locale={locale} whatsapp={whatsapp} />;
}
