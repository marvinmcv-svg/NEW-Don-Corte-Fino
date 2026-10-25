import type { MetadataRoute } from "next";
import { cutProducts } from "@/lib/catalog";
import { LOCALES } from "@/lib/i18n";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://don-corte-fino.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/cortes", "/tienda", ...cutProducts.map((p) => `/cortes/${p.slug}`)];
  return LOCALES.flatMap((l) => paths.map((p) => ({ url: `${base}/${l}${p}`, changeFrequency: "weekly" as const })));
}
