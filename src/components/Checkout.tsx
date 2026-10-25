"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { useCart } from "@/lib/cart";
import { settings, type Locale } from "@/lib/catalog";
import { bs, getDict } from "@/lib/i18n";
import { buildWhatsAppMessage, deliveryFee, discountFor, findPromo, newOrderCode, SLOTS, waLink } from "@/lib/order";

function nextDays(locale: Locale, n = 7) {
  const fmt = new Intl.DateTimeFormat(locale === "es" ? "es-BO" : "en-GB", { weekday: "short", day: "2-digit", month: "2-digit" });
  return Array.from({ length: n }, (_, i) => {
    const dt = new Date();
    dt.setDate(dt.getDate() + i + 1);
    return fmt.format(dt);
  });
}

export default function Checkout({ locale }: { locale: Locale }) {
  const d = getDict(locale).checkout;
  const { items, subtotal, clear } = useCart();
  const days = useMemo(() => nextDays(locale), [locale]);

  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [date, setDate] = useState(days[0]);
  const [slot, setSlot] = useState(SLOTS[1]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoState, setGeoState] = useState<"" | "ok" | "err" | "loading">("");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState(settings.payment_methods[0]?.key ?? "cash");
  const [codeInput, setCodeInput] = useState("");
  const [codeState, setCodeState] = useState<"" | "ok" | "bad" | "min">("");
  const [appliedCode, setAppliedCode] = useState<string>();
  const [error, setError] = useState("");
  const [sent, setSent] = useState<{ code: string; url: string; payment: string } | null>(null);

  const promo = appliedCode ? findPromo(appliedCode) : undefined;
  const discount = discountFor(promo, subtotal);
  let shipping = fulfillment === "delivery" ? deliveryFee(geo) : null;
  if (shipping && promo?.free_delivery_km && shipping.km <= promo.free_delivery_km && discount > 0) shipping = { ...shipping, fee: 0 };
  const total = subtotal - discount + (shipping?.fee ?? 0);
  const payLabel = settings.payment_methods.find((m) => m.key === payment)?.label[locale] ?? payment;

  const locate = () => {
    if (!navigator.geolocation) return setGeoState("err");
    setGeoState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoState("ok");
      },
      () => setGeoState("err"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const applyCode = () => {
    const p = findPromo(codeInput);
    if (!p) return setCodeState("bad");
    if (p.min_subtotal && subtotal < p.min_subtotal) return setCodeState("min");
    setAppliedCode(p.code);
    setCodeState("ok");
  };

  const send = () => {
    if (!name.trim() || !phone.trim() || (fulfillment === "delivery" && !address.trim() && !geo)) {
      setError(d.required);
      return;
    }
    setError("");
    const code = newOrderCode();
    const text = buildWhatsAppMessage({
      code,
      locale,
      items,
      subtotal,
      discount,
      promoCode: appliedCode,
      fulfillment,
      shipping,
      date,
      slot,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      mapUrl: geo ? `https://maps.google.com/?q=${geo.lat.toFixed(6)},${geo.lng.toFixed(6)}` : undefined,
      notes: notes.trim(),
      payment: payLabel,
    });
    const url = waLink(text);
    setSent({ code, url, payment });
    clear();
    window.open(url, "_blank", "noopener");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (sent) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 pt-32 pb-20">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="card max-w-lg p-10 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }} className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-burgundy text-3xl">
            ✓
          </motion.div>
          <p className="label mt-8">{sent.code}</p>
          <h1 className="h-display mt-3 text-3xl">{d.done}</h1>
          <p className="mt-4 font-serif text-lg leading-relaxed text-steel">{d.doneSub}</p>
          <p className="mt-4 text-sm text-ash">{sent.payment === "qr" ? d.qrNote : d.cashNote}</p>
          <div className="mt-8 flex flex-col gap-3">
            <a href={sent.url} target="_blank" rel="noopener" className="btn-primary">
              {d.again}
            </a>
            <Link href={`/${locale}/tienda`} className="btn-ghost">
              {d.backShop}
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (items.length === 0) {
    const c = getDict(locale).cart;
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 pt-32 pb-20 text-center">
        <p className="font-serif text-3xl text-steel">{c.empty}</p>
        <Link href={`/${locale}/cortes`} className="btn-primary">
          {c.emptyCta}
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 pt-32 pb-28 md:px-8 md:pt-40">
      <div className="mx-auto max-w-6xl">
        <h1 className="h-display text-4xl md:text-6xl">{d.title}</h1>
        <p className="mt-4 max-w-2xl font-serif text-xl text-steel">{d.sub}</p>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_380px]">
          <div className="space-y-10">
            <fieldset>
              <legend className="label mb-4">{d.fulfillment}</legend>
              <div className="grid grid-cols-2 gap-2">
                {(["delivery", "pickup"] as const).map((k) => (
                  <button key={k} onClick={() => setFulfillment(k)} className={`chip py-4 text-sm ${fulfillment === k ? "chip-on" : ""}`}>
                    {k === "delivery" ? d.delivery : d.pickup}
                  </button>
                ))}
              </div>
            </fieldset>

            {fulfillment === "delivery" && (
              <div className="space-y-3">
                <label className="block">
                  <span className="label mb-3 block">{d.address}</span>
                  <textarea className="input min-h-24" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={d.addressPh} />
                </label>
                <button onClick={locate} className="btn-ghost w-full sm:w-auto">
                  📍 {geoState === "ok" ? d.locationOk : geoState === "loading" ? "…" : d.location}
                </button>
                {geoState === "err" && <p className="text-xs text-wine">{d.locationErr}</p>}
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block">
                <span className="label mb-3 block">{d.date}</span>
                <select className="input" value={date} onChange={(e) => setDate(e.target.value)}>
                  {days.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="label mb-3 block">{d.slot}</span>
                <select className="input" value={slot} onChange={(e) => setSlot(e.target.value)}>
                  {SLOTS.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="label mb-3 block">{d.name}</span>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </label>
              <label className="block">
                <span className="label mb-3 block">{d.phone}</span>
                <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" autoComplete="tel" placeholder="+591 7…" />
              </label>
            </div>

            <fieldset>
              <legend className="label mb-4">{d.payment}</legend>
              <div className="grid grid-cols-2 gap-2">
                {settings.payment_methods.map((m) => (
                  <button key={m.key} onClick={() => setPayment(m.key)} className={`chip py-4 text-sm ${payment === m.key ? "chip-on" : ""}`}>
                    {m.label[locale]}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-ash">{payment === "qr" ? d.qrNote : d.cashNote}</p>
            </fieldset>

            <label className="block">
              <span className="label mb-3 block">{d.notes}</span>
              <textarea className="input min-h-20" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={d.notesPh} />
            </label>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="card p-6">
              <h2 className="label mb-5">{d.summary}</h2>
              <ul className="space-y-3 text-sm">
                {items.map((i) => (
                  <li key={i.id} className="flex justify-between gap-4">
                    <span className="text-steel">
                      {i.name[locale]}
                      {i.qty > 1 && <span className="text-ash"> ×{i.qty}</span>}
                      <span className="block text-xs text-ash">{i.details.map((x) => x[locale]).join(" · ")}</span>
                    </span>
                    <span className="shrink-0 text-bone">
                      {i.estimated && "~"}
                      {bs(i.unitPrice * i.qty)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex gap-2">
                <input className="input py-2 uppercase" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder={d.code} />
                <button onClick={applyCode} className="chip shrink-0 uppercase">
                  {d.apply}
                </button>
              </div>
              {codeState && (
                <p className={`mt-2 text-xs ${codeState === "ok" ? "text-champagne" : "text-wine"}`}>
                  {codeState === "ok" ? d.codeOk : codeState === "min" ? `${d.codeMin}: ${bs(findPromo(codeInput)?.min_subtotal ?? 0)}` : d.codeBad}
                </p>
              )}

              <div className="gold-rule my-6" />
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ash">{d.subtotal}</dt>
                  <dd>~{bs(subtotal)}</dd>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-champagne">
                    <dt>{d.discount}</dt>
                    <dd>-{bs(discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-ash">{d.shipping}</dt>
                  <dd className="text-right">
                    {fulfillment === "pickup" ? d.free : shipping ? (shipping.fee === 0 ? d.free : `${bs(shipping.fee)} · ${shipping.km} km`) : <span className="text-xs text-ash">{d.shippingWa}</span>}
                  </dd>
                </div>
              </dl>
              <div className="mt-5 flex items-end justify-between">
                <span className="label">{d.total}</span>
                <span className="font-display text-3xl">~{bs(total)}</span>
              </div>
              {error && <p className="mt-4 text-sm text-wine">{error}</p>}
              <button onClick={send} className="btn-primary mt-6 w-full bg-[#1f8f4e] hover:bg-[#25D366]">
                {d.send}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
