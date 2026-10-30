"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { Button, Empty, Field, fmtBs, fmtDate, fmtKg, Input, PageHeader, Panel, Select, Table, refreshSite, useToast } from "./ui";

type P = { slug: string; name: { es: string }; sale_type: string; track_stock: boolean; stock_kg: number; stock_units: number; low_stock_kg: number; low_stock_units: number; status: string };
type M = { id: string; product_slug: string; delta_kg: number; delta_units: number; reason: string; note: string | null; created_at: string; orders: { code: string } | null };
type Lot = { id: string; product_slug: string; supplier: string | null; grade: string | null; received_at: string; kg_received: number; units_received: number; cost_per_kg: number | null; cost_per_unit: number | null };

const REASON: Record<string, string> = { lot: "Ingreso", sale: "Venta", return: "Devolución", waste: "Merma", trim: "Recorte", tasting: "Degustación", adjust: "Ajuste" };
const byUnits = (p?: P) => p?.sale_type === "pack" || p?.sale_type === "addon";

export default function Inventory() {
  const toast = useToast();
  const [products, setProducts] = useState<P[]>([]);
  const [moves, setMoves] = useState<M[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [busy, setBusy] = useState(false);
  const [lot, setLot] = useState({ slug: "", qty: "", cost: "", supplier: "", grade: "", date: new Date().toISOString().slice(0, 10) });
  const [adj, setAdj] = useState({ slug: "", qty: "", reason: "waste", note: "" });

  const load = useCallback(async () => {
    const db = supabaseBrowser();
    const [p, m, l] = await Promise.all([
      db.from("products").select("slug, name, sale_type, track_stock, stock_kg, stock_units, low_stock_kg, low_stock_units, status").order("sort"),
      db.from("stock_movements").select("id, product_slug, delta_kg, delta_units, reason, note, created_at, orders(code)").order("created_at", { ascending: false }).limit(150),
      db.from("inventory_lots").select("*").order("received_at", { ascending: false }).limit(60),
    ]);
    if (p.error) toast(p.error.message, "err");
    setProducts((p.data ?? []) as P[]);
    setMoves((m.data ?? []) as unknown as M[]);
    setLots((l.data ?? []) as Lot[]);
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const name = useMemo(() => Object.fromEntries(products.map((p) => [p.slug, p.name.es])), [products]);
  const lotProduct = products.find((p) => p.slug === lot.slug);
  const adjProduct = products.find((p) => p.slug === adj.slug);
  const tracked = products.filter((p) => p.track_stock);

  const addLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lotProduct || !(Number(lot.qty) > 0)) return toast("Elige producto y cantidad", "err");
    setBusy(true);
    const db = supabaseBrowser();
    const units = byUnits(lotProduct);
    // Receiving stock turns tracking on so the shop can mark the item sold out automatically later.
    if (!lotProduct.track_stock) await db.from("products").update({ track_stock: true }).eq("slug", lotProduct.slug);
    const { data: u } = await db.auth.getUser();
    const { error } = await db.from("inventory_lots").insert({
      product_slug: lotProduct.slug,
      kg_received: units ? 0 : Number(lot.qty),
      units_received: units ? Math.round(Number(lot.qty)) : 0,
      cost_per_kg: !units && lot.cost ? Number(lot.cost) : null,
      cost_per_unit: units && lot.cost ? Number(lot.cost) : null,
      supplier: lot.supplier || null,
      grade: lot.grade || null,
      received_at: lot.date,
      created_by: u.user?.id,
    });
    setBusy(false);
    if (error) return toast(error.message, "err");
    toast("Ingreso registrado");
    setLot({ ...lot, qty: "", cost: "" });
    refreshSite();
    load();
  };

  const addAdj = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = Number(adj.qty);
    if (!adjProduct || !q) return toast("Elige producto y cantidad", "err");
    setBusy(true);
    const db = supabaseBrowser();
    const { data: u } = await db.auth.getUser();
    // Waste/trim/tasting always take stock out; a manual adjustment can go either way.
    const delta = adj.reason === "adjust" ? q : -Math.abs(q);
    const units = byUnits(adjProduct);
    const { error } = await db.from("stock_movements").insert({
      product_slug: adjProduct.slug,
      delta_kg: units ? 0 : delta,
      delta_units: units ? Math.round(delta) : 0,
      reason: adj.reason,
      note: adj.note || null,
      created_by: u.user?.id,
    });
    setBusy(false);
    if (error) return toast(error.message, "err");
    toast("Ajuste registrado");
    setAdj({ ...adj, qty: "", note: "" });
    refreshSite();
    load();
  };

  const low = (p: P) => (byUnits(p) ? p.stock_units <= p.low_stock_units : Number(p.stock_kg) <= Number(p.low_stock_kg));

  return (
    <div>
      <PageHeader title="Inventario" sub="El stock baja cuando confirmas un pedido (no cuando el cliente abre WhatsApp) y vuelve si lo cancelas." />

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Ingreso de mercadería (lote)">
          <form onSubmit={addLot} className="grid gap-3 sm:grid-cols-2">
            <Field label="Producto" className="sm:col-span-2">
              <Select value={lot.slug} onChange={(e) => setLot({ ...lot, slug: e.target.value })}>
                <option value="">Elegir…</option>
                {products.map((p) => <option key={p.slug} value={p.slug}>{p.name.es}</option>)}
              </Select>
            </Field>
            <Field label={byUnits(lotProduct) ? "Unidades recibidas" : "Kg recibidos"}><Input type="number" step={byUnits(lotProduct) ? "1" : "0.001"} min="0" value={lot.qty} onChange={(e) => setLot({ ...lot, qty: e.target.value })} /></Field>
            <Field label={byUnits(lotProduct) ? "Costo por unidad (Bs)" : "Costo por kg (Bs)"}><Input type="number" step="0.01" min="0" value={lot.cost} onChange={(e) => setLot({ ...lot, cost: e.target.value })} /></Field>
            <Field label="Proveedor"><Input value={lot.supplier} onChange={(e) => setLot({ ...lot, supplier: e.target.value })} /></Field>
            <Field label="Grado (opcional)"><Input value={lot.grade} placeholder="ej. Reserva BMS 6–7" onChange={(e) => setLot({ ...lot, grade: e.target.value })} /></Field>
            <Field label="Fecha de llegada"><Input type="date" value={lot.date} onChange={(e) => setLot({ ...lot, date: e.target.value })} /></Field>
            <div className="flex items-end"><Button disabled={busy} className="w-full">Registrar ingreso</Button></div>
          </form>
        </Panel>

        <Panel title="Ajuste manual">
          <form onSubmit={addAdj} className="grid gap-3 sm:grid-cols-2">
            <Field label="Producto" className="sm:col-span-2">
              <Select value={adj.slug} onChange={(e) => setAdj({ ...adj, slug: e.target.value })}>
                <option value="">Elegir…</option>
                {products.map((p) => <option key={p.slug} value={p.slug}>{p.name.es}</option>)}
              </Select>
            </Field>
            <Field label="Motivo">
              <Select value={adj.reason} onChange={(e) => setAdj({ ...adj, reason: e.target.value })}>
                <option value="waste">Merma</option>
                <option value="trim">Recorte</option>
                <option value="tasting">Degustación</option>
                <option value="adjust">Ajuste de conteo (+/−)</option>
              </Select>
            </Field>
            <Field label={byUnits(adjProduct) ? "Unidades" : "Kg"} hint={adj.reason === "adjust" ? "Usa negativo para restar" : "Se resta del stock"}>
              <Input type="number" step={byUnits(adjProduct) ? "1" : "0.001"} value={adj.qty} onChange={(e) => setAdj({ ...adj, qty: e.target.value })} />
            </Field>
            <Field label="Nota" className="sm:col-span-2"><Input value={adj.note} onChange={(e) => setAdj({ ...adj, note: e.target.value })} /></Field>
            <div className="sm:col-span-2"><Button disabled={busy} variant="ghost" className="w-full">Registrar ajuste</Button></div>
          </form>
        </Panel>
      </div>

      <Panel title="Stock actual" className="mt-6">
        {tracked.length === 0 ? (
          <Empty>Aún no controlas stock de ningún producto. Registra un ingreso y empieza automáticamente.</Empty>
        ) : (
          <Table head={["Producto", "Stock", "Aviso en", "Estado"]}>
            {tracked.map((p) => (
              <tr key={p.slug}>
                <td className="px-4 py-3 text-bone">{p.name.es}</td>
                <td className={`px-4 py-3 font-semibold ${low(p) ? "text-amber-300" : "text-bone"}`}>{byUnits(p) ? `${p.stock_units} u.` : fmtKg(p.stock_kg)}</td>
                <td className="px-4 py-3 text-ash">{byUnits(p) ? `${p.low_stock_units} u.` : fmtKg(p.low_stock_kg)}</td>
                <td className="px-4 py-3 text-steel">{{ active: "Activo", sold_out: "Agotado", hidden: "Oculto" }[p.status]}</td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Lotes recientes">
          {lots.length === 0 ? (
            <Empty>Sin lotes.</Empty>
          ) : (
            <ul className="divide-y divide-champagne/5 text-sm">
              {lots.map((l) => (
                <li key={l.id} className="flex justify-between gap-3 py-2.5">
                  <span>
                    <span className="text-bone">{name[l.product_slug] ?? l.product_slug}</span>
                    <span className="block text-xs text-ash">{l.received_at} · {[l.supplier, l.grade].filter(Boolean).join(" · ") || "—"}</span>
                  </span>
                  <span className="text-right">
                    <span className="block text-bone">{l.units_received ? `${l.units_received} u.` : fmtKg(l.kg_received)}</span>
                    <span className="text-xs text-ash">
                      {l.cost_per_kg ? `${fmtBs(l.cost_per_kg)}/kg · total ${fmtBs(l.cost_per_kg * l.kg_received)}` : l.cost_per_unit ? `${fmtBs(l.cost_per_unit)}/u.` : ""}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Movimientos">
          {moves.length === 0 ? (
            <Empty>Sin movimientos.</Empty>
          ) : (
            <ul className="max-h-[520px] divide-y divide-champagne/5 overflow-y-auto text-sm">
              {moves.map((m) => {
                const d = Number(m.delta_kg) || m.delta_units;
                return (
                  <li key={m.id} className="flex justify-between gap-3 py-2.5">
                    <span>
                      <span className="text-bone">{name[m.product_slug] ?? m.product_slug}</span>
                      <span className="block text-xs text-ash">{fmtDate(m.created_at)} · {REASON[m.reason]}{m.orders?.code ? ` · ${m.orders.code}` : ""}{m.note ? ` · ${m.note}` : ""}</span>
                    </span>
                    <span className={d >= 0 ? "text-emerald-300" : "text-red-300"}>
                      {d >= 0 ? "+" : ""}
                      {Number(m.delta_kg) ? fmtKg(m.delta_kg) : `${m.delta_units} u.`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
