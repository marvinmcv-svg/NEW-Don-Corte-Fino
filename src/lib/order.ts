import { offers, settings, type LaunchOffer, type Locale } from "./catalog";
import type { CartItem } from "./cart";
import { bs, getDict } from "./i18n";

export const SLOTS = ["10:00–12:00", "12:00–14:00", "14:00–16:00", "16:00–18:00", "18:00–20:00"];

export const waNumber = settings.whatsapp.replace(/\D/g, "");
export const waLink = (text?: string) =>
  `https://wa.me/${waNumber}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export const displayPhone = "776 65567";

/** Promo codes come from the launch offers that are switched on. */
export function findPromo(code: string): LaunchOffer | undefined {
  const c = code.trim().toUpperCase();
  return offers.find((o) => o.active && o.type === "promo_code" && o.code?.toUpperCase() === c);
}

export function discountFor(promo: LaunchOffer | undefined, subtotal: number) {
  if (!promo?.discount) return 0;
  if (promo.min_subtotal && subtotal < promo.min_subtotal) return 0;
  return promo.discount.kind === "percent" ? (subtotal * promo.discount.value) / 100 : promo.discount.value;
}

const toRad = (d: number) => (d * Math.PI) / 180;

/** Straight-line distance × 1.3 as a stand-in for road distance (plan §6.3 backup). */
export function deliveryFee(to: { lat: number; lng: number } | null): { km: number; fee: number } | null {
  const o = settings.delivery.origin;
  if (!o || !to) return null;
  const R = 6371;
  const dLat = toRad(to.lat - o.lat);
  const dLng = toRad(to.lng - o.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(o.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  const km = Math.ceil(2 * R * Math.asin(Math.sqrt(a)) * 1.3);
  let fee = km * settings.delivery.fee_per_km;
  if (settings.delivery.min_fee) fee = Math.max(fee, settings.delivery.min_fee);
  return { km, fee };
}

export const newOrderCode = () => `DCF-${String(Date.now()).slice(-5, -1)}`;

export type OrderInput = {
  code: string;
  locale: Locale;
  items: CartItem[];
  subtotal: number;
  discount: number;
  promoCode?: string;
  fulfillment: "delivery" | "pickup";
  shipping: { km: number; fee: number } | null;
  date: string;
  slot: string;
  name: string;
  phone: string;
  address: string;
  mapUrl?: string;
  notes: string;
  payment: string;
};

export function buildWhatsAppMessage(o: OrderInput) {
  const d = getDict(o.locale).wa;
  const line = "━━━━━━━━━━━━━━";
  const items = o.items.map((i) => {
    const det = i.details.map((x) => x[o.locale]).join(", ");
    const amount = i.unitPrice * i.qty;
    return `• ${i.name[o.locale]}${det ? ` — ${det}` : ""}${i.qty > 1 ? ` ×${i.qty}` : ""} — ${i.estimated ? "~" : ""}${bs(amount)}${i.note ? `\n   📝 ${i.note}` : ""}`;
  });
  const shippingFee = o.fulfillment === "pickup" ? 0 : o.shipping?.fee ?? null;
  const total = o.subtotal - o.discount + (shippingFee ?? 0);
  const shippingText =
    o.fulfillment === "pickup" ? d.pickup : shippingFee === null ? d.shippingWa : `${bs(shippingFee)} (${o.shipping?.km} km)`;

  return [
    `🥩 *DON CORTE FINO — ${d.order} ${o.code}*`,
    line,
    ...items,
    line,
    `${d.subtotal}: ${bs(o.subtotal)}`,
    ...(o.discount > 0 ? [`${d.discount} (${o.promoCode}): -${bs(o.discount)}`] : []),
    `${d.shipping}: ${shippingText}`,
    `*${d.total}: ${bs(total)}${shippingFee === null ? " + " + d.shipping.toLowerCase() : ""}*`,
    "",
    `📍 ${d.when}: ${o.date} · ${o.slot}`,
    `👤 ${o.name} · 📞 ${o.phone}`,
    ...(o.fulfillment === "delivery" ? [`🏠 ${o.address}`] : []),
    ...(o.mapUrl ? [`🗺️ ${o.mapUrl}`] : []),
    `💳 ${d.payment}: ${o.payment}`,
    ...(o.notes ? [`📝 ${o.notes}`] : []),
    "",
    `_${d.weightNote}_`,
  ].join("\n");
}
