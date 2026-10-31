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
  image_url?: string | null;
  sort?: number;
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

export type DeliverySettings = {
  fee_per_km: number;
  min_fee: number | null;
  max_km: number | null;
  origin: { lat: number; lng: number } | null;
  pickup: boolean;
};

/** Shop settings, edited in Admin → Ajustes. */
export type Settings = {
  whatsapp: string;
  delivery: DeliverySettings;
  payment_methods: { key: string; label: L10n }[];
  payment_qr_url: string | null;
  min_order: number;
  slots: string[];
  announcement: { active: boolean; es: string; en: string };
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
};

export type Catalog = {
  products: Product[];
  offers: LaunchOffer[];
  settings: Settings;
  /** True when the data came from the bundled JSON instead of the database. */
  fromSeed: boolean;
};

const data = raw as unknown as {
  settings: { whatsapp: string; delivery: DeliverySettings; payment_methods: Settings["payment_methods"] };
  products: Product[];
  launch_offers: LaunchOffer[];
};

export const DEFAULT_SLOTS = ["10:00–12:00", "12:00–14:00", "14:00–16:00", "16:00–18:00", "18:00–20:00"];

/** Bundled catalogue: used when Supabase isn't configured or can't be reached. */
export const seedCatalog: Catalog = {
  products: data.products,
  offers: data.launch_offers,
  settings: {
    whatsapp: data.settings.whatsapp,
    delivery: data.settings.delivery,
    payment_methods: data.settings.payment_methods,
    payment_qr_url: null,
    min_order: 0,
    slots: DEFAULT_SLOTS,
    announcement: { active: false, es: "", en: "" },
    instagram_url: null,
    facebook_url: null,
    tiktok_url: null,
  },
  fromSeed: true,
};

export const visibleProducts = (c: Catalog) => c.products.filter((p) => p.status !== "hidden");
export const isCut = (p: Product) => p.sale_type === "portion" || p.sale_type === "weight";
/** Products that have a cut guide page (real cuts, not packs or add-ons). */
export const cutProductsOf = (c: Catalog) => visibleProducts(c).filter(isCut);

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
