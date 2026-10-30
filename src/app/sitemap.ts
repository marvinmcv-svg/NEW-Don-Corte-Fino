import type { MetadataRoute } from "next";
import { cutProductsOf } from "@/lib/catalog";
import { getCatalog } from "@/lib/catalog-server";
import { LOCALES } from "@/lib/i18n";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://don-corte-fino.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = ["", "/cortes", "/tienda", ...cutProductsOf(await getCatalog()).map((p) => `/cortes/${p.slug}`)];
  return LOCALES.flatMap((l) => paths.map((p) => ({ url: `${base}/${l}${p}`, changeFrequency: "weekly" as const })));
}
