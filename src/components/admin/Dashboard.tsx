"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { Badge, Empty, fmtBs, fmtDate, fmtKg, PageHeader, Panel, Stat } from "./ui";

type Order = { id: string; code: string; status: string; payment_status: string; total_est: number; total_final: number | null; created_at: string; customer_name: string };
type Item = { product_slug: string | null; name: { es: string }; qty: number; est_kg: number | null; final_kg: number | null; unit_price: number; line_final: number | null; orders: { status: string; created_at: string } };
type Low = { slug: string; name: { es: string }; sale_type: string; stock_kg: number; stock_units: number; low_stock_kg: number; low_stock_units: number };

const startOfDay = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export default function Dashboard({ role }: { role: "owner" | "staff" | "editor" }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [low, setLow] = useState<Low[]>([]);
  const [productCount, setProductCount] = useState<number>();
  const [loading, setLoading] = useState(true);
  const ops = role !== "editor";

  useEffect(() => {
    const db = supabaseBrowser();
    const since = new Date(Date.now() - 30 * 864e5).toISOString();
    (async () => {
      const tasks: PromiseLike<unknown>[] = [
        db.from("products").select("slug", { count: "exact", head: true }).then((r) => setProductCount(r.count ?? 0)),
        db
          .from("products")
          .select("slug, name, sale_type, stock_kg, stock_units, low_stock_kg, low_stock_units")
          .eq("track_stock", true)
          .then((r) =>
            setLow(((r.data ?? []) as Low[]).filter((p) => (p.sale_type === "pack" || p.sale_type === "addon" ? p.stock_units <= p.low_stock_units : Number(p.stock_kg) <= Number(p.low_stock_kg)))),
          ),
      ];
      if (ops) {
        tasks.push(
          db.from("orders").select("id, code, status, payment_status, total_est, total_final, created_at, customer_name").gte("created_at", since).order("created_at", { ascending: false }).then((r) => setOrders((r.data ?? []) as Order[])),
          db.from("order_items").select("product_slug, name, qty, est_kg, final_kg, unit_price, line_final, orders!inner(status, created_at)").gte("orders.created_at", since).then((r) => setItems((r.data ?? []) as unknown as Item[])),
        );
      }
      await Promise.all(tasks);
      setLoading(false);
    })();
  }, [ops]);

  const today = startOfDay();
  const weekAgo = new Date(today.getTime() - 6 * 864e5);
  const live = orders.filter((o) => o.status !== "cancelado");
  const inRange = (from: Date) => live.filter((o) => new Date(o.created_at) >= from);
  const sum = (list: Order[], final = false) => list.reduce((n, o) => n + Number(final ? o.total_final ?? o.total_est : o.total_est), 0);
  const confirmed = (list: Order[]) => list.filter((o) => o.status !== "nuevo");
  const pending = orders.filter((o) => o.status === "nuevo");

  const top = Object.values(
    items
      .filter((i) => i.orders.status !== "cancelado")
      .reduce<Record<string, { name: string; kg: number; units: number; revenue: number }>>((acc, i) => {
        const k = i.product_slug ?? i.name.es;
        acc[k] ??= { name: i.name.es, kg: 0, units: 0, revenue: 0 };
        acc[k].kg += Number(i.final_kg ?? (i.est_kg ? i.est_kg * i.qty : 0));
        acc[k].units += i.qty;
        acc[k].revenue += Number(i.line_final ?? i.unit_price * i.qty);
        return acc;
      }, {}),
  )
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  return (
    <div>
      <PageHeader title="Resumen" sub={new Date().toLocaleDateString("es-BO", { weekday: "long", day: "numeric", month: "long" })} />
      {loading && <p className="text-sm text-ash">Cargando…</p>}

      {ops && !loading && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Pedidos hoy" value={inRange(today).length} hint={fmtBs(sum(inRange(today)))} />
            <Stat label="Pedidos 7 días" value={inRange(weekAgo).length} hint={`${fmtBs(sum(inRange(weekAgo)))} estimado`} />
            <Stat label="Confirmado 7 días" value={fmtBs(sum(confirmed(inRange(weekAgo)), true))} hint="Con pesos finales cuando existen" tone="text-champagne" />
            <Stat label="Por confirmar" value={pending.length} hint="Pedidos en estado nuevo" tone={pending.length ? "text-amber-300" : ""} />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <Panel title="Esperando confirmación" actions={<Link href="/admin/pedidos?estado=nuevo" className="text-xs text-champagne hover:text-bone">Ver todos →</Link>}>
              {pending.length === 0 ? (
                <Empty>No hay pedidos pendientes. 🎉</Empty>
              ) : (
                <ul className="divide-y divide-champagne/5">
                  {pending.slice(0, 8).map((o) => (
                    <li key={o.id}>
                      <Link href={`/admin/pedidos/${o.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-champagne">
                        <span>
                          <span className="font-semibold text-bone">{o.code}</span> <span className="text-sm text-steel">· {o.customer_name}</span>
                          <span className="block text-xs text-ash">{fmtDate(o.created_at)}</span>
                        </span>
                        <span className="text-right">
                          <span className="block text-sm text-bone">{fmtBs(o.total_est)}</span>
                          <Badge value={o.status} />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title="Más vendidos · 30 días">
              {top.length === 0 ? (
                <Empty>Aún no hay ventas.</Empty>
              ) : (
                <ul className="space-y-3">
                  {top.map((t) => (
                    <li key={t.name}>
                      <div className="flex justify-between text-sm">
                        <span className="text-bone">{t.name}</span>
                        <span className="text-champagne">{fmtBs(t.revenue)}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-champagne/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-burgundy to-champagne" style={{ width: `${(t.revenue / top[0].revenue) * 100}%` }} />
                      </div>
                      <p className="mt-0.5 text-[0.7rem] text-ash">{t.kg > 0 ? fmtKg(t.kg) : `${t.units} u.`}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Stock bajo" actions={ops ? <Link href="/admin/inventario" className="text-xs text-champagne hover:text-bone">Inventario →</Link> : undefined}>
          {low.length === 0 ? (
            <Empty>Ningún producto bajo el mínimo. Activa “Controlar stock” en un producto para seguirlo.</Empty>
          ) : (
            <ul className="divide-y divide-champagne/5">
              {low.map((p) => (
                <li key={p.slug} className="flex justify-between py-2.5 text-sm">
                  <span className="text-bone">{p.name.es}</span>
                  <span className={Number(p.stock_kg) <= 0 && p.stock_units <= 0 ? "text-red-300" : "text-amber-300"}>
                    {p.sale_type === "pack" || p.sale_type === "addon" ? `${p.stock_units} u.` : fmtKg(p.stock_kg)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        {!ops && <Stat label="Productos en catálogo" value={productCount ?? "—"} />}
      </div>
    </div>
  );
}
