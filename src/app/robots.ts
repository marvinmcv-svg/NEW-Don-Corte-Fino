import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://don-corte-fino.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/es/checkout", "/en/checkout"] }, sitemap: `${base}/sitemap.xml` };
}
