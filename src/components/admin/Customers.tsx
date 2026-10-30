"use client";

import { useEffect, useMemo, useState } from "react";
import { waLink } from "@/lib/order";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { Empty, fmtBs, Input, PageHeader, Table, Toggle, useToast } from "./ui";

type C = { id: string; name: string; phone: string; vip: boolean; notes: string | null; created_at: string };
type O = { customer_id: string | null; total_est: number; total_final: number | null; status: string; created_at: string };

export default function Customers() {
  const toast = useToast();
  const [customers, setCustomers] = useState<C[]>([]);
  const [orders, setOrders] = useState<O[]>([]);
  const [q, setQ] = useState("");
  const [onlyVip, setOnlyVip] = useState(false);

  useEffect(() => {
    const db = supabaseBrowser();
    Promise.all([
      db.from("customers").select("*").order("created_at", { ascending: false }).limit(1000),
      db.from("orders").select("customer_id, total_est, total_final, status, created_at").limit(5000),
    ]).then(([c, o]) => {
      if (c.error) toast(c.error.message, "err");
      setCustomers((c.data ?? []) as C[]);
      setOrders((o.data ?? []) as O[]);
    });
  }, [toast]);

  const stats = useMemo(() => {
    const m: Record<string, { count: number; spent: number; last: string }> = {};
    for (const o of orders) {
      if (!o.customer_id || o.status === "cancelado") continue;
      const s = (m[o.customer_id] ??= { count: 0, spent: 0, last: o.created_at });
      s.count++;
      s.spent += Number(o.total_final ?? o.total_est);
      if (o.created_at > s.last) s.last = o.created_at;
    }
    return m;
  }, [orders]);

  const list = customers
    .filter((c) => (!onlyVip || c.vip) && (!q || c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q)))
    .sort((a, b) => (stats[b.id]?.spent ?? 0) - (stats[a.id]?.spent ?? 0));

  const setVip = async (c: C, vip: boolean) => {
    setCustomers((l) => l.map((x) => (x.id === c.id ? { ...x, vip } : x)));
    const { error } = await supabaseBrowser().from("customers").update({ vip }).eq("id", c.id);
    if (error) toast(error.message, "err");
  };

  return (
    <div>
      <PageHeader title="Clientes" sub="Se crean solos con cada pedido. Marca VIP para avisarles primero de cada lote nuevo." />
      <div className="mb-5 flex flex-wrap items-center gap-4">
        <Input placeholder="Buscar por nombre o teléfono" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <Toggle checked={onlyVip} onChange={setOnlyVip} label="Solo VIP" />
        <span className="text-xs text-ash">{list.length} clientes</span>
      </div>
      {list.length === 0 ? (
        <Empty>Aún no hay clientes.</Empty>
      ) : (
        <Table head={["Cliente", "Pedidos", "Total gastado", "Último pedido", "VIP"]}>
          {list.map((c) => {
            const s = stats[c.id];
            return (
              <tr key={c.id}>
                <td className="px-4 py-3">
                  <span className="text-bone">{c.name}</span>
                  <a href={waLink(c.phone)} target="_blank" rel="noopener" className="block text-xs text-champagne hover:text-bone">{c.phone} ↗</a>
                </td>
                <td className="px-4 py-3 text-bone">{s?.count ?? 0}</td>
                <td className="px-4 py-3 text-bone">{fmtBs(s?.spent ?? 0)}</td>
                <td className="px-4 py-3 text-ash">{s ? new Date(s.last).toLocaleDateString("es-BO") : "—"}</td>
                <td className="px-4 py-3"><Toggle checked={c.vip} onChange={(v) => setVip(c, v)} /></td>
              </tr>
            );
          })}
        </Table>
      )}
    </div>
  );
}
