import raw from "../../data/seed/catalog.json";

export type Locale = "es" | "en";
export type L10n = { es: string; en: string };

export type Grade = { key: string; label: L10n; price_per_kg: number };
export type Portion = {
  label: L10n;
  thickness_cm?: number;
  est_kg: number;
  est_price: number;
};

export type Product = {
  slug: string;
  cut: string | null;
  name: L10n;
  sale_type: "portion" | "weight" | "pack" | "addon";
  price_unit: "kg" | "unit";
  price_per_kg?: number;
  price?: number;
  portions?: Portion[];
  grades?: Grade[];
  prep_options?: string[];
  min_qty?: number;
  step_qty?: number;
  description?: L10n;
  badge?: string | null;
  featured?: boolean;
  status: "active" | "sold_out" | "hidden";
};

export type OfferItem = {
  product: string;
  est_kg: number | null;
  units: number | null;
  value: number;
};

export type LaunchOffer = {
  key: string;
  option: string;
  active: boolean;
  name: L10n;
  pitch: L10n;
  type: "bundle" | "promo_code";
  items?: OfferItem[];
  regular_value?: number;
  launch_price?: number;
  limit?: { units?: number; numbered?: boolean; uses?: number } | null;
  includes_extra?: L10n;
  code?: string;
  discount?: { kind: "percent" | "fixed"; value: number };
  min_subtotal?: number;
  free_delivery_km?: number;
  perk?: L10n;
  followup?: L10n;
};

export type Settings = {
  whatsapp: string;
  currency: string;
  delivery: {
    fee_per_km: number;
    min_fee: number | null;
    max_km: number | null;
    origin: { lat: number; lng: number } | null;
    pickup: boolean;
  };
  payment_methods: { key: string; label: L10n; qr_image?: string | null }[];
  prices_are_placeholders: boolean;
};

const data = raw as unknown as {
  settings: Settings;
  products: Product[];
  launch_offers: LaunchOffer[];
};

export const settings = data.settings;
export const products = data.products.filter((p) => p.status !== "hidden");
export const offers = data.launch_offers;

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

/** Products that have a cut guide page (real cuts, not packs or add-ons). */
export const cutProducts = products.filter(
  (p) => p.sale_type === "portion" || p.sale_type === "weight",
);

export const featuredProducts = products.filter((p) => p.featured);

export const PREP_LABELS: Record<string, L10n> = {
  whole: { es: "Pieza entera", en: "Whole piece" },
  steaks: { es: "En bifes", en: "Steaks" },
  skewers: { es: "Para brochetas", en: "Skewers" },
  flat: { es: "Flat (magro)", en: "Flat (lean)" },
  point: { es: "Point (graso)", en: "Point (fatty)" },
  ground: { es: "Molida", en: "Ground" },
  "sliced-3mm": { es: "Laminado 3 mm (yakiniku)", en: "Sliced 3 mm (yakiniku)" },
  "sliced-1.5mm": { es: "Laminado 1.5 mm (shabu)", en: "Sliced 1.5 mm (shabu)" },
  "english-cut": { es: "Corte inglés", en: "English cut" },
  rolled: { es: "Enrollado", en: "Rolled" },
  "cross-cut": { es: "Corte transversal (banderita)", en: "Cross-cut (flanken)" },
};

export const t = (v: L10n | undefined, l: Locale) => (v ? v[l] : "");

/** "Más vendido / Best seller" → the half for the active language. */
export const badgeFor = (b: string | null | undefined, l: Locale) => {
  if (!b) return null;
  const [es, en] = b.split(" / ");
  return l === "en" ? en ?? es : es;
};

/** Lowest price a customer can start from, used on cards. */
export function fromPrice(p: Product): { amount: number; perKg: boolean } {
  if (p.sale_type === "pack" || p.sale_type === "addon") return { amount: p.price ?? 0, perKg: false };
  const kg = Math.min(...(p.grades?.map((g) => g.price_per_kg) ?? [p.price_per_kg ?? 0]));
  return { amount: kg, perKg: true };
}
