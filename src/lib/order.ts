import type { DeliverySettings, Locale } from "./catalog";
import type { CartItem } from "./cart";
import { bs, getDict } from "./i18n";

const digits = (phone: string) => phone.replace(/\D/g, "");

export const waLink = (phone: string, text?: string) =>
  `https://wa.me/${digits(phone)}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

/** "+59177665567" → "776 65567" */
export const displayPhone = (phone: string) => {
  const d = digits(phone).replace(/^591/, "");
  return d.length === 8 ? `${d.slice(0, 3)} ${d.slice(3)}` : d;
};

const toRad = (d: number) => (d * Math.PI) / 180;

/** Preview of the delivery fee; the database recomputes it when the order is placed. */
export function deliveryFee(delivery: DeliverySettings, to: { lat: number; lng: number } | null): { km: number; fee: number } | null {
  const o = delivery.origin;
  if (!o || !to) return null;
  const R = 6371;
  const dLat = toRad(to.lat - o.lat);
  const dLng = toRad(to.lng - o.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(o.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  const km = Math.ceil(2 * R * Math.asin(Math.sqrt(a)) * 1.3);
  let fee = km * delivery.fee_per_km;
  if (delivery.min_fee) fee = Math.max(fee, delivery.min_fee);
  return { km, fee };
}

/** Used only if the database can't be reached, so the WhatsApp order still goes out. */
export const offlineOrderCode = () => `DCF-W${String(Date.now()).slice(-5, -1)}`;

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
