"use client";

import { useEffect, useState } from "react";
import { DEFAULT_SLOTS } from "@/lib/catalog";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { Button, Field, Input, PageHeader, Panel, Textarea, Toggle, refreshSite, useToast } from "./ui";

type S = {
  whatsapp: string;
  instagram_url: string;
  facebook_url: string;
  tiktok_url: string;
  fee_per_km: string;
  min_fee: string;
  max_km: string;
  lat: string;
  lng: string;
  pickup: boolean;
  min_order: string;
  slots: string;
  qr: string | null;
  ann_active: boolean;
  ann_es: string;
  ann_en: string;
};

export default function SettingsPage() {
  const toast = useToast();
  const [s, setS] = useState<S>();
  const [raw, setRaw] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof S>(k: K, v: S[K]) => setS((x) => (x ? { ...x, [k]: v } : x));

  useEffect(() => {
    supabaseBrowser()
      .from("settings")
      .select("key, value")
      .then(({ data, error }) => {
        if (error) return toast(error.message, "err");
        const kv = Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as Record<string, never>;
        setRaw(kv);
        const d = (kv.delivery ?? {}) as { fee_per_km?: number; min_fee?: number; max_km?: number; origin?: { lat: number; lng: number }; pickup?: boolean };
        const a = (kv.announcement ?? {}) as { active?: boolean; es?: string; en?: string };
        setS({
          whatsapp: kv.whatsapp ?? "",
          instagram_url: kv.instagram_url ?? "",
          facebook_url: kv.facebook_url ?? "",
          tiktok_url: kv.tiktok_url ?? "",
          fee_per_km: String(d.fee_per_km ?? 3),
          min_fee: d.min_fee?.toString() ?? "",
          max_km: d.max_km?.toString() ?? "",
          lat: d.origin?.lat?.toString() ?? "",
          lng: d.origin?.lng?.toString() ?? "",
          pickup: d.pickup ?? true,
          min_order: String(kv.min_order ?? 0),
          slots: ((kv.slots as string[] | undefined) ?? DEFAULT_SLOTS).join("\n"),
          qr: kv.payment_qr_url ?? null,
          ann_active: !!a.active,
          ann_es: a.es ?? "",
          ann_en: a.en ?? "",
        });
      });
  }, [toast]);

  if (!s) return <p className="text-sm text-ash">Cargando…</p>;

  const useMyLocation = () =>
    navigator.geolocation?.getCurrentPosition(
      (p) => {
        set("lat", p.coords.latitude.toFixed(6));
        set("lng", p.coords.longitude.toFixed(6));
        toast("Ubicación tomada. Guarda para aplicarla.");
      },
      () => toast("No se pudo obtener la ubicación", "err"),
      { enableHighAccuracy: true },
    );

  const uploadQr = async (file: File) => {
    const db = supabaseBrowser();
    const path = `settings/qr-${Date.now()}.${file.name.split(".").pop()?.toLowerCase() ?? "png"}`;
    const { error } = await db.storage.from("media").upload(path, file);
    if (error) return toast(error.message, "err");
    set("qr", db.storage.from("media").getPublicUrl(path).data.publicUrl);
    toast("QR subido. Guarda para publicarlo.");
  };

  const save = async () => {
    const digits = s.whatsapp.replace(/[^\d+]/g, "");
    if (digits.replace(/\D/g, "").length < 8) return toast("Número de WhatsApp inválido", "err");
    const lat = s.lat ? Number(s.lat) : null;
    const lng = s.lng ? Number(s.lng) : null;
    if ((lat === null) !== (lng === null) || (lat !== null && (Math.abs(lat) > 90 || Math.abs(lng!) > 180))) return toast("Revisa la latitud y longitud", "err");
    const slots = s.slots.split("\n").map((x) => x.trim()).filter(Boolean);
    const rows = [
      { key: "whatsapp", value: digits.startsWith("+") ? digits : `+591${digits.replace(/^591/, "")}` },
      { key: "instagram_url", value: s.instagram_url.trim() || null },
      { key: "facebook_url", value: s.facebook_url.trim() || null },
      { key: "tiktok_url", value: s.tiktok_url.trim() || null },
      {
        key: "delivery",
        value: {
          ...((raw.delivery as object) ?? {}),
          fee_per_km: Number(s.fee_per_km) || 0,
          min_fee: s.min_fee ? Number(s.min_fee) : null,
          max_km: s.max_km ? Number(s.max_km) : null,
          origin: lat !== null ? { lat, lng } : null,
          pickup: s.pickup,
        },
      },
      { key: "min_order", value: Number(s.min_order) || 0 },
      { key: "slots", value: slots.length ? slots : DEFAULT_SLOTS },
      { key: "payment_qr_url", value: s.qr },
      { key: "announcement", value: { active: s.ann_active, es: s.ann_es.trim(), en: s.ann_en.trim() || s.ann_es.trim() } },
    ];
    setBusy(true);
    const { error } = await supabaseBrowser().from("settings").upsert(rows.map((r) => ({ ...r, value: r.value ?? null })));
    setBusy(false);
    if (error) return toast(error.message, "err");
    toast("Ajustes guardados");
    refreshSite();
  };

  return (
    <div>
      <PageHeader title="Ajustes" sub="Datos de contacto, entregas, pagos y avisos del sitio." actions={<Button onClick={save} disabled={busy}>{busy ? "Guardando…" : "Guardar ajustes"}</Button>} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Contacto">
          <div className="space-y-4">
            <Field label="WhatsApp de pedidos" hint="Con código de país, ej. +59177665567. Los pedidos llegan a este número.">
              <Input value={s.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
            </Field>
            <Field label="Instagram (enlace)" hint="ej. https://instagram.com/tu_cuenta — aparece en el pie y en la sección de Instagram">
              <Input value={s.instagram_url} onChange={(e) => set("instagram_url", e.target.value)} placeholder="https://instagram.com/…" />
            </Field>
            <Field label="Facebook (enlace)" hint="Aparece en el pie de página">
              <Input value={s.facebook_url} onChange={(e) => set("facebook_url", e.target.value)} placeholder="https://facebook.com/…" />
            </Field>
            <Field label="TikTok (enlace)" hint="Aparece en el pie de página">
              <Input value={s.tiktok_url} onChange={(e) => set("tiktok_url", e.target.value)} placeholder="https://tiktok.com/@…" />
            </Field>
          </div>
        </Panel>

        <Panel title="Aviso en la parte superior del sitio">
          <div className="space-y-4">
            <Toggle checked={s.ann_active} onChange={(v) => set("ann_active", v)} label="Mostrar aviso" />
            <Field label="Texto (español)"><Input value={s.ann_es} onChange={(e) => set("ann_es", e.target.value)} placeholder="ej. Nuevo lote de Tomahawk disponible este viernes" /></Field>
            <Field label="Texto (inglés)"><Input value={s.ann_en} onChange={(e) => set("ann_en", e.target.value)} /></Field>
          </div>
        </Panel>

        <Panel title="Entregas">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bs por km"><Input type="number" step="0.5" min="0" value={s.fee_per_km} onChange={(e) => set("fee_per_km", e.target.value)} /></Field>
            <Field label="Costo mínimo de envío (Bs)" hint="Opcional"><Input type="number" min="0" value={s.min_fee} onChange={(e) => set("min_fee", e.target.value)} /></Field>
            <Field label="Distancia máxima (km)" hint="Opcional"><Input type="number" min="0" value={s.max_km} onChange={(e) => set("max_km", e.target.value)} /></Field>
            <Field label="Pedido mínimo (Bs)" hint="0 = sin mínimo"><Input type="number" min="0" value={s.min_order} onChange={(e) => set("min_order", e.target.value)} /></Field>
            <div className="sm:col-span-2">
              <p className="mb-2 text-xs font-semibold text-steel">Ubicación de la tienda (punto de partida para calcular el envío)</p>
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <Input value={s.lat} onChange={(e) => set("lat", e.target.value)} placeholder="Latitud, ej. -17.7833" />
                <Input value={s.lng} onChange={(e) => set("lng", e.target.value)} placeholder="Longitud, ej. -63.1821" />
                <Button type="button" variant="ghost" onClick={useMyLocation}>📍 Estoy en la tienda</Button>
              </div>
              <p className="mt-1.5 text-[0.7rem] text-ash">
                {s.lat && s.lng ? (
                  <a href={`https://maps.google.com/?q=${s.lat},${s.lng}`} target="_blank" rel="noopener" className="text-champagne">Ver en Maps ↗</a>
                ) : (
                  "Sin ubicación, el sitio muestra “Envío calculado por WhatsApp”."
                )}
              </p>
            </div>
            <Toggle checked={s.pickup} onChange={(v) => set("pickup", v)} label="Permitir retiro en tienda" />
          </div>
        </Panel>

        <Panel title="Horarios de entrega">
          <Field label="Un horario por línea"><Textarea rows={6} value={s.slots} onChange={(e) => set("slots", e.target.value)} /></Field>
        </Panel>

        <Panel title="Pago por QR">
          <div className="flex flex-wrap items-start gap-5">
            <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-lg bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {s.qr ? <img src={s.qr} alt="QR de pago" className="h-full w-full object-contain" /> : <span className="p-4 text-center text-xs text-neutral-500">Sin QR</span>}
            </div>
            <div className="space-y-2 text-sm text-steel">
              <p>Se muestra al cliente después de confirmar un pedido con pago QR.</p>
              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadQr(e.target.files[0])} className="block text-xs file:mr-3 file:rounded-md file:border-0 file:bg-burgundy file:px-3 file:py-1.5 file:text-bone" />
              {s.qr && <button type="button" onClick={() => set("qr", null)} className="text-xs text-ash hover:text-bone">Quitar QR</button>}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
