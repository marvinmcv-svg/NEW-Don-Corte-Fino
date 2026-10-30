"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { Button, Empty, Field, fmtBs, Input, PageHeader, Panel, Select, Table, Toggle, refreshSite, useToast } from "./ui";

type Promo = { id: string; code: string; kind: string; value: number; min_subtotal: number; free_delivery_km: number | null; starts_at: string | null; ends_at: string | null; max_uses: number | null; used: number; active: boolean; note: string | null };
type Offer = { key: string; active: boolean; data: { option: string; name: { es: string }; pitch: { es: string }; type: string; code?: string; regular_value?: number; launch_price?: number } };

const blank = { code: "", kind: "percent", value: "", min_subtotal: "0", free_delivery_km: "", ends_at: "", max_uses: "", note: "" };

export default function Promotions() {
  const toast = useToast();
  const [promos, setPromos] = useState<Promo[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [form, setForm] = useState(blank);
  const [isOwner, setIsOwner] = useState(true);

  const load = useCallback(async () => {
    const db = supabaseBrowser();
    const [p, o] = await Promise.all([db.from("promotions").select("*").order("created_at", { ascending: false }), db.from("launch_offers").select("*").order("sort")]);
    if (p.error) setIsOwner(false);
    setPromos((p.data ?? []) as Promo[]);
    setOffers((o.data ?? []) as Offer[]);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const toggleOffer = async (o: Offer, active: boolean) => {
    const db = supabaseBrowser();
    const { error } = await db.from("launch_offers").update({ active }).eq("key", o.key);
    if (error) return toast(error.message, "err");
    // The Founders' Club offer is a discount code: switch the code on/off with it.
    if (o.data.type === "promo_code" && o.data.code && isOwner) await db.from("promotions").update({ active }).eq("code", o.data.code);
    toast(active ? "Oferta activada en el sitio" : "Oferta desactivada");
    refreshSite();
    load();
  };

  const setOfferPrice = async (o: Offer, field: "launch_price" | "regular_value", v: string) => {
    const { error } = await supabaseBrowser().from("launch_offers").update({ data: { ...o.data, [field]: Number(v) } }).eq("key", o.key);
    if (error) return toast(error.message, "err");
    toast("Precio actualizado");
    refreshSite();
    load();
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !(Number(form.value) > 0)) return toast("Código y valor son obligatorios", "err");
    const { error } = await supabaseBrowser().from("promotions").insert({
      code: form.code.trim().toUpperCase(),
      kind: form.kind,
      value: Number(form.value),
      min_subtotal: Number(form.min_subtotal) || 0,
      free_delivery_km: form.free_delivery_km ? Number(form.free_delivery_km) : null,
      ends_at: form.ends_at ? new Date(form.ends_at + "T23:59:59").toISOString() : null,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      note: form.note || null,
    });
    if (error) return toast(error.code === "23505" ? "Ese código ya existe" : error.message, "err");
    toast("Código creado");
    setForm(blank);
    load();
  };

  const patch = async (p: Promo, v: Partial<Promo>) => {
    const { error } = await supabaseBrowser().from("promotions").update(v).eq("id", p.id);
    if (error) return toast(error.message, "err");
    load();
  };

  return (
    <div>
      <PageHeader title="Promociones" sub="Ofertas de lanzamiento y códigos de descuento." />

      <Panel title="Ofertas de lanzamiento">
        <div className="grid gap-4 lg:grid-cols-3">
          {offers.map((o) => (
            <div key={o.key} className={`rounded-xl border p-4 ${o.active ? "border-wine bg-burgundy/15" : "border-champagne/10"}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-champagne">Opción {o.data.option}</p>
                <Toggle checked={o.active} onChange={(v) => toggleOffer(o, v)} label={o.active ? "Activa" : "Apagada"} />
              </div>
              <p className="mt-2 font-display text-lg text-bone">{o.data.name.es}</p>
              <p className="mt-1 text-xs leading-relaxed text-steel">{o.data.pitch.es}</p>
              {o.data.type === "bundle" ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Field label="Precio regular"><Input type="number" defaultValue={o.data.regular_value} onBlur={(e) => Number(e.target.value) !== o.data.regular_value && setOfferPrice(o, "regular_value", e.target.value)} /></Field>
                  <Field label="Precio lanzamiento"><Input type="number" defaultValue={o.data.launch_price} onBlur={(e) => Number(e.target.value) !== o.data.launch_price && setOfferPrice(o, "launch_price", e.target.value)} /></Field>
                </div>
              ) : (
                <p className="mt-3 text-xs text-ash">Código: <b className="text-bone">{o.data.code}</b> (se activa junto con la oferta)</p>
              )}
            </div>
          ))}
        </div>
      </Panel>

      {isOwner && (
        <>
          <Panel title="Nuevo código de descuento" className="mt-6">
            <form onSubmit={create} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Código"><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="ej. PADRE10" /></Field>
              <Field label="Tipo">
                <Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                  <option value="percent">Porcentaje (%)</option>
                  <option value="fixed">Monto fijo (Bs)</option>
                </Select>
              </Field>
              <Field label={form.kind === "percent" ? "Descuento (%)" : "Descuento (Bs)"}><Input type="number" min="0" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></Field>
              <Field label="Compra mínima (Bs)"><Input type="number" min="0" value={form.min_subtotal} onChange={(e) => setForm({ ...form, min_subtotal: e.target.value })} /></Field>
              <Field label="Envío gratis hasta (km)" hint="Vacío = no aplica"><Input type="number" min="0" value={form.free_delivery_km} onChange={(e) => setForm({ ...form, free_delivery_km: e.target.value })} /></Field>
              <Field label="Vence el"><Input type="date" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} /></Field>
              <Field label="Usos máximos"><Input type="number" min="1" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} /></Field>
              <div className="flex items-end"><Button className="w-full">Crear código</Button></div>
            </form>
          </Panel>

          <Panel title="Códigos" className="mt-6">
            {promos.length === 0 ? (
              <Empty>No hay códigos.</Empty>
            ) : (
              <Table head={["Código", "Descuento", "Condiciones", "Usos", "Activo", ""]}>
                {promos.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-semibold text-bone">{p.code}<span className="block text-xs font-normal text-ash">{p.note}</span></td>
                    <td className="px-4 py-3 text-bone">{p.kind === "percent" ? `${Number(p.value)}%` : fmtBs(p.value)}</td>
                    <td className="px-4 py-3 text-xs text-steel">
                      {Number(p.min_subtotal) > 0 && <span className="block">Mínimo {fmtBs(p.min_subtotal)}</span>}
                      {p.free_delivery_km && <span className="block">Envío gratis ≤ {Number(p.free_delivery_km)} km</span>}
                      {p.ends_at && <span className="block">Vence {new Date(p.ends_at).toLocaleDateString("es-BO")}</span>}
                    </td>
                    <td className="px-4 py-3 text-bone">{p.used}{p.max_uses ? ` / ${p.max_uses}` : ""}</td>
                    <td className="px-4 py-3"><Toggle checked={p.active} onChange={(v) => patch(p, { active: v })} /></td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="subtle" size="sm" onClick={async () => {
                        if (!confirm(`¿Eliminar el código ${p.code}?`)) return;
                        const { error } = await supabaseBrowser().from("promotions").delete().eq("id", p.id);
                        if (error) toast(error.message, "err"); else load();
                      }}>Eliminar</Button>
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
