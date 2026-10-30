"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { waLink } from "@/lib/order";
import { Badge, Button, fmtBs, fmtDate, fmtKg, Input, PageHeader, Panel, Textarea, useToast } from "./ui";

type L = { es: string; en: string };
type Item = { id: string; product_slug: string | null; name: L; details: L[]; qty: number; unit_price: number; est_kg: number | null; final_kg: number | null; line_final: number | null; estimated: boolean; note: string | null };
type Order = {
  id: string; code: string; status: string; payment_status: string; payment_method: string; customer_id: string | null; customer_name: string; phone: string; locale: "es" | "en";
  fulfillment: string; address: string | null; map_url: string | null; slot_date: string | null; slot: string | null; notes: string | null; promo_code: string | null;
  subtotal_est: number; discount: number; delivery_fee: number | null; delivery_km: number | null; total_est: number; total_final: number | null; internal_notes: string | null; created_at: string; confirmed_at: string | null;
};

const FLOW = ["nuevo", "confirmado", "preparando", "en_camino", "entregado"];
const NEXT_LABEL: Record<string, string> = { nuevo: "Confirmar pedido", confirmado: "Pasar a preparando", preparando: "Marcar en camino", en_camino: "Marcar entregado" };

/** Price of a line once its real weight is known. */
const lineFinal = (i: Item, kgInput: string) => {
  const kg = Number(kgInput);
  if (!i.estimated || !kgInput || !(kg > 0) || !i.est_kg) return null;
  const perKg = Number(i.unit_price) / Number(i.est_kg);
  return Math.round(perKg * kg * 100) / 100;
};

export default function OrderDetail({ id, isOwner }: { id: string; isOwner: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [o, setO] = useState<Order>();
  const [items, setItems] = useState<Item[]>([]);
  const [kg, setKg] = useState<Record<string, string>>({});
  const [fee, setFee] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const db = supabaseBrowser();
    const [{ data: order }, { data: its }] = await Promise.all([
      db.from("orders").select("*").eq("id", id).single(),
      db.from("order_items").select("*").eq("order_id", id).order("id"),
    ]);
    if (!order) return;
    setO(order as Order);
    setItems((its ?? []) as Item[]);
    setKg(Object.fromEntries(((its ?? []) as Item[]).map((i) => [i.id, i.final_kg?.toString() ?? ""])));
    setFee(order.delivery_fee?.toString() ?? "");
    setNotes(order.internal_notes ?? "");
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!o) return <p className="text-sm text-ash">Cargando…</p>;

  const lines = items.map((i) => ({ i, est: Number(i.unit_price) * i.qty, final: lineFinal(i, kg[i.id]) }));
  const goods = lines.reduce((n, l) => n + (l.final ?? l.est), 0);
  const feeNum = fee === "" ? 0 : Number(fee);
  const finalTotal = Math.round((goods - Number(o.discount) + feeNum) * 100) / 100;
  const pendingWeights = lines.some((l) => l.i.estimated && l.final === null);

  const update = async (patch: Partial<Order>, ok: string) => {
    setBusy(true);
    const { error } = await supabaseBrowser().from("orders").update(patch).eq("id", o.id);
    setBusy(false);
    if (error) return toast(error.message, "err");
    toast(ok);
    load();
  };

  const saveWeights = async () => {
    setBusy(true);
    const db = supabaseBrowser();
    for (const l of lines) {
      if (!l.i.estimated) continue;
      const k = kg[l.i.id];
      const { error } = await db.from("order_items").update({ final_kg: k ? Number(k) : null, line_final: l.final }).eq("id", l.i.id);
      if (error) {
        setBusy(false);
        return toast(error.message, "err");
      }
    }
    await update({ total_final: pendingWeights ? null : finalTotal, delivery_fee: fee === "" ? null : feeNum, internal_notes: notes || null }, "Pesos y total guardados");
  };

  const finalMessage = () => {
    const en = o.locale === "en";
    const rows = lines.map((l) => `• ${l.i.name[o.locale]}${l.i.qty > 1 ? ` ×${l.i.qty}` : ""}${kg[l.i.id] ? ` — ${kg[l.i.id]} kg` : ""}: Bs ${(l.final ?? l.est).toFixed(2)}`);
    return [
      `🥩 *DON CORTE FINO — ${o.code}*`,
      en ? "Your order is weighed and ready:" : "Tu pedido ya está pesado:",
      ...rows,
      ...(Number(o.discount) > 0 ? [`${en ? "Discount" : "Descuento"}: -Bs ${Number(o.discount).toFixed(2)}`] : []),
      `${en ? "Delivery" : "Envío"}: Bs ${feeNum.toFixed(2)}`,
      `*${en ? "Final total" : "Total final"}: Bs ${finalTotal.toFixed(2)}*`,
      o.payment_method === "qr" ? (en ? "You can pay by QR now. Thank you!" : "Ya puedes pagar por QR. ¡Gracias!") : en ? "Cash on delivery. Thank you!" : "Pago en efectivo al recibir. ¡Gracias!",
    ].join("\n");
  };

  const del = async () => {
    if (!confirm(`¿Eliminar el pedido ${o.code}? Esto no se puede deshacer.`)) return;
    const { error } = await supabaseBrowser().from("orders").delete().eq("id", o.id);
    if (error) return toast(error.message, "err");
    toast("Pedido eliminado");
    router.replace("/admin/pedidos");
  };

  const step = FLOW.indexOf(o.status);

  return (
    <div className="print:text-black">
      <Link href="/admin/pedidos" className="text-xs text-ash hover:text-bone print:hidden">← Pedidos</Link>
      <PageHeader
        title={o.code}
        sub={`Creado ${fmtDate(o.created_at)}${o.confirmed_at ? ` · confirmado ${fmtDate(o.confirmed_at)}` : ""}`}
        actions={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Badge value={o.status} />
            <Badge value={o.payment_status} label={o.payment_status === "pagado" ? "Pagado" : "Pago pendiente"} />
            <Button variant="ghost" size="sm" onClick={() => window.print()}>Imprimir</Button>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2 print:hidden">
        {o.status !== "cancelado" && o.status !== "entregado" && (
          <Button disabled={busy} onClick={() => update({ status: FLOW[step + 1] }, `Pedido ${FLOW[step + 1].replace("_", " ")}`)}>{NEXT_LABEL[o.status]}</Button>
        )}
        <Button variant="ghost" disabled={busy} onClick={() => update({ payment_status: o.payment_status === "pagado" ? "pendiente" : "pagado" }, "Pago actualizado")}>
          {o.payment_status === "pagado" ? "Marcar pago pendiente" : "Marcar pagado"}
        </Button>
        {o.status !== "cancelado" && (
          <Button variant="danger" disabled={busy} onClick={() => confirm("¿Cancelar este pedido? Si estaba confirmado, el stock vuelve al inventario.") && update({ status: "cancelado" }, "Pedido cancelado")}>
            Cancelar pedido
          </Button>
        )}
        {isOwner && <Button variant="subtle" onClick={del}>Eliminar</Button>}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Productos" actions={<span className="text-xs text-ash print:hidden">Ingresa el peso real de cada pieza pesada</span>}>
          <div className="space-y-4">
            {lines.map(({ i, est, final }) => (
              <div key={i.id} className="grid gap-3 border-b border-champagne/5 pb-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                <div>
                  <p className="font-semibold text-bone">
                    {i.name.es} {i.qty > 1 && <span className="text-champagne">×{i.qty}</span>}
                  </p>
                  <p className="text-xs text-ash">{i.details.map((d) => d.es).join(" · ")}</p>
                  {i.note && <p className="mt-1 text-xs italic text-amber-200">“{i.note}”</p>}
                  {i.estimated && <p className="mt-1 text-[0.7rem] text-ash">Estimado: {fmtKg(i.est_kg ? i.est_kg * (i.qty || 1) : null)} · {fmtBs(est)}</p>}
                </div>
                {i.estimated ? (
                  <label className="flex items-center gap-2 text-xs text-steel">
                    Peso real
                    <Input type="number" step="0.001" min="0" inputMode="decimal" value={kg[i.id] ?? ""} onChange={(e) => setKg({ ...kg, [i.id]: e.target.value })} className="w-24 print:border-black" placeholder="kg" />
                  </label>
                ) : (
                  <span />
                )}
                <span className="text-right font-display text-lg text-bone">{fmtBs(final ?? est)}</span>
              </div>
            ))}
          </div>
          <dl className="mt-5 space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-ash">Productos</dt><dd>{fmtBs(goods)}</dd></div>
            {Number(o.discount) > 0 && <div className="flex justify-between text-champagne"><dt>Descuento {o.promo_code}</dt><dd>-{fmtBs(o.discount)}</dd></div>}
            <div className="flex items-center justify-between">
              <dt className="text-ash">Envío {o.delivery_km ? `(${o.delivery_km} km)` : ""}</dt>
              <dd><Input type="number" step="0.5" min="0" value={fee} onChange={(e) => setFee(e.target.value)} className="w-24 text-right" placeholder="Bs" /></dd>
            </div>
            <div className="flex justify-between border-t border-champagne/10 pt-2 text-base">
              <dt className="font-semibold text-bone">{pendingWeights ? "Total (faltan pesos)" : "Total final"}</dt>
              <dd className="font-display text-2xl text-champagne">{fmtBs(finalTotal)}</dd>
            </div>
            <div className="flex justify-between text-xs text-ash"><dt>Total estimado al pedir</dt><dd>{fmtBs(o.total_est)}</dd></div>
          </dl>
          <div className="mt-5 flex flex-wrap gap-2 print:hidden">
            <Button disabled={busy} onClick={saveWeights}>Guardar pesos y total</Button>
            {pendingWeights ? (
              <Button variant="ghost" disabled title="Ingresa todos los pesos primero">Enviar total por WhatsApp</Button>
            ) : (
              <a href={waLink(o.phone, finalMessage())} target="_blank" rel="noopener" className="inline-flex items-center rounded-lg border border-champagne/25 px-4 py-2.5 text-sm font-semibold text-bone hover:border-champagne/60">
                Enviar total por WhatsApp
              </a>
            )}
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Cliente">
            <p className="text-lg text-bone">{o.customer_name}</p>
            <a href={waLink(o.phone)} target="_blank" rel="noopener" className="text-sm text-champagne hover:text-bone">{o.phone} ↗</a>
            <dl className="mt-4 space-y-2 text-sm">
              <div><dt className="text-xs text-ash">Entrega</dt><dd className="text-bone">{o.fulfillment === "pickup" ? "Retiro en tienda" : "Delivery"} · {[o.slot_date, o.slot].filter(Boolean).join(" · ")}</dd></div>
              {o.address && <div><dt className="text-xs text-ash">Dirección</dt><dd className="whitespace-pre-line text-bone">{o.address}</dd></div>}
              {o.map_url && <div><dt className="text-xs text-ash">Ubicación</dt><dd><a href={o.map_url} target="_blank" rel="noopener" className="text-champagne hover:text-bone">Abrir en Maps ↗</a></dd></div>}
              <div><dt className="text-xs text-ash">Pago</dt><dd className="text-bone">{o.payment_method === "qr" ? "QR" : "Efectivo contra entrega"}</dd></div>
              {o.notes && <div><dt className="text-xs text-ash">Notas del cliente</dt><dd className="whitespace-pre-line text-bone">{o.notes}</dd></div>}
              <div><dt className="text-xs text-ash">Idioma</dt><dd className="text-bone">{o.locale === "en" ? "Inglés" : "Español"}</dd></div>
            </dl>
          </Panel>
          <Panel title="Notas internas">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Solo las ve el equipo" />
            <Button size="sm" variant="ghost" className="mt-3 print:hidden" disabled={busy} onClick={() => update({ internal_notes: notes || null }, "Nota guardada")}>Guardar nota</Button>
          </Panel>
        </div>
      </div>
    </div>
  );
}
