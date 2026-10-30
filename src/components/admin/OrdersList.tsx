"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { Badge, Button, Empty, fmtBs, fmtDate, Input, ORDER_STATUSES, PageHeader, Select, STATUS_LABEL, Table, useToast } from "./ui";

type Row = {
  id: string; code: string; status: string; payment_status: string; payment_method: string; customer_name: string; phone: string;
  fulfillment: string; slot_date: string | null; slot: string | null; total_est: number; total_final: number | null; created_at: string;
};

const RANGES = { "7": "7 días", "30": "30 días", "90": "90 días", all: "Todo" } as const;

export default function OrdersList() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const status = params.get("estado") ?? "activos";
  const [range, setRange] = useState<keyof typeof RANGES>("30");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabaseBrowser()
      .from("orders")
      .select("id, code, status, payment_status, payment_method, customer_name, phone, fulfillment, slot_date, slot, total_est, total_final, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (range !== "all") query = query.gte("created_at", new Date(Date.now() - Number(range) * 864e5).toISOString());
    if (status === "activos") query = query.in("status", ["nuevo", "confirmado", "preparando", "en_camino"]);
    else if (status !== "todos") query = query.eq("status", status);
    const { data, error } = await query;
    if (error) toast(error.message, "err");
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }, [range, status, toast]);

  useEffect(() => {
    load();
  }, [load]);

  // New orders show up live while this page is open.
  useEffect(() => {
    const db = supabaseBrowser();
    const ch = db
      .channel("orders-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (p) => {
        toast(`Nuevo pedido ${(p.new as Row).code} · ${(p.new as Row).customer_name}`);
        load();
      })
      .subscribe();
    return () => {
      db.removeChannel(ch);
    };
  }, [load, toast]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => r.code.toLowerCase().includes(s) || r.customer_name.toLowerCase().includes(s) || r.phone.includes(s));
  }, [rows, q]);

  const exportCsv = () => {
    const head = ["codigo", "fecha", "estado", "pago", "metodo", "cliente", "telefono", "entrega", "dia", "horario", "total_estimado", "total_final"];
    const lines = filtered.map((r) =>
      [r.code, new Date(r.created_at).toISOString(), r.status, r.payment_status, r.payment_method, r.customer_name, r.phone, r.fulfillment, r.slot_date ?? "", r.slot ?? "", r.total_est, r.total_final ?? ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob(["﻿" + [head.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pedidos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const setStatus = (s: string) => router.replace(`/admin/pedidos${s === "activos" ? "" : `?estado=${s}`}`);

  return (
    <div>
      <PageHeader title="Pedidos" sub="Los pedidos llegan aquí al confirmarse en el sitio, antes de abrir WhatsApp." actions={<Button variant="ghost" onClick={exportCsv}>Exportar CSV</Button>} />
      <div className="mb-5 flex flex-wrap gap-2">
        {["activos", ...ORDER_STATUSES, "todos"].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${status === s ? "border-wine bg-burgundy text-bone" : "border-champagne/15 text-steel hover:border-champagne/40"}`}>
            {s === "activos" ? "Activos" : s === "todos" ? "Todos" : STATUS_LABEL[s as keyof typeof STATUS_LABEL]}
          </button>
        ))}
      </div>
      <div className="mb-5 flex flex-wrap gap-3">
        <Input placeholder="Buscar por código, nombre o teléfono" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <Select value={range} onChange={(e) => setRange(e.target.value as keyof typeof RANGES)} className="w-36">
          {Object.entries(RANGES).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
      </div>
      {loading ? (
        <p className="text-sm text-ash">Cargando…</p>
      ) : filtered.length === 0 ? (
        <Empty>No hay pedidos con estos filtros.</Empty>
      ) : (
        <Table head={["Pedido", "Cliente", "Entrega", "Total", "Estado", "Pago"]}>
          {filtered.map((r) => (
            <tr key={r.id} className="cursor-pointer hover:bg-champagne/[0.03]" onClick={() => router.push(`/admin/pedidos/${r.id}`)}>
              <td className="px-4 py-3">
                <Link href={`/admin/pedidos/${r.id}`} className="font-semibold text-bone">{r.code}</Link>
                <span className="block text-xs text-ash">{fmtDate(r.created_at)}</span>
              </td>
              <td className="px-4 py-3">
                <span className="text-bone">{r.customer_name}</span>
                <span className="block text-xs text-ash">{r.phone}</span>
              </td>
              <td className="px-4 py-3 text-steel">
                {r.fulfillment === "pickup" ? "Retiro" : "Delivery"}
                <span className="block text-xs text-ash">{[r.slot_date, r.slot].filter(Boolean).join(" · ")}</span>
              </td>
              <td className="px-4 py-3">
                <span className="text-bone">{fmtBs(r.total_final ?? r.total_est)}</span>
                <span className="block text-xs text-ash">{r.total_final ? "final" : "estimado"}</span>
              </td>
              <td className="px-4 py-3"><Badge value={r.status} /></td>
              <td className="px-4 py-3"><Badge value={r.payment_status} label={`${r.payment_status === "pagado" ? "Pagado" : "Pendiente"} · ${r.payment_method === "qr" ? "QR" : "Efectivo"}`} /></td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
