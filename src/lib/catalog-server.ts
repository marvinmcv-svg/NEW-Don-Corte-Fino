import "server-only";
import { unstable_cache } from "next/cache";
import { DEFAULT_SLOTS, seedCatalog, type Catalog, type LaunchOffer, type Product, type Settings } from "./catalog";
import { hasSupabase } from "./supabase/env";
import { supabasePublic } from "./supabase/server";

export const CATALOG_TAG = "catalog";

const num = (v: unknown) => (v === null || v === undefined ? undefined : Number(v));

async function load(): Promise<Catalog> {
  if (!hasSupabase) return seedCatalog;
  try {
    const db = supabasePublic();
    const [p, o, s] = await Promise.all([
      db.from("products").select("*").order("sort"),
      db.from("launch_offers").select("key, active, data").order("sort"),
      db.from("settings").select("key, value"),
    ]);
    if (p.error || o.error || s.error || !p.data?.length) throw p.error ?? o.error ?? s.error ?? new Error("empty catalogue");

    const products: Product[] = p.data.map((r) => ({
      slug: r.slug,
      cut: r.cut,
      name: r.name,
      description: r.description ?? undefined,
      sale_type: r.sale_type,
      price_unit: r.price_unit,
      price_per_kg: num(r.price_per_kg),
      price: num(r.price),
      portions: r.portions ?? undefined,
      grades: r.grades ?? undefined,
      prep_options: r.prep_options ?? undefined,
      min_qty: num(r.min_qty),
      step_qty: num(r.step_qty),
      badge: r.badge,
      featured: r.featured,
      status: r.status,
      image_url: r.image_url,
      sort: r.sort,
    }));
    const offers: LaunchOffer[] = o.data.map((r) => ({ ...r.data, key: r.key, active: r.active }));
    const kv = Object.fromEntries(s.data.map((r) => [r.key, r.value]));
    const settings: Settings = {
      ...seedCatalog.settings,
      whatsapp: kv.whatsapp ?? seedCatalog.settings.whatsapp,
      delivery: { ...seedCatalog.settings.delivery, ...(kv.delivery ?? {}) },
      payment_methods: kv.payment_methods ?? seedCatalog.settings.payment_methods,
      payment_qr_url: kv.payment_qr_url ?? null,
      min_order: Number(kv.min_order ?? 0),
      slots: Array.isArray(kv.slots) && kv.slots.length ? kv.slots : DEFAULT_SLOTS,
      announcement: kv.announcement ?? seedCatalog.settings.announcement,
      instagram_url: kv.instagram_url ?? null,
      facebook_url: kv.facebook_url ?? null,
      tiktok_url: kv.tiktok_url ?? null,
    };
    return { products, offers, settings, fromSeed: false };
  } catch (e) {
    console.warn("[catalog] falling back to bundled seed:", (e as Error).message);
    return seedCatalog;
  }
}

/** Catalogue for the public site. Cached; the admin portal refreshes it on every save. */
export const getCatalog = unstable_cache(load, ["catalog-v1"], { tags: [CATALOG_TAG], revalidate: 300 });
