"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { Empty, PageHeader, Panel, Select, Table, useToast } from "./ui";

type P = { user_id: string; email: string; full_name: string | null; role: "owner" | "staff" | "editor" | null; created_at: string };

const ROLES = [
  { v: "", l: "Sin acceso" },
  { v: "owner", l: "Dueño — todo" },
  { v: "staff", l: "Personal — pedidos, stock, clientes" },
  { v: "editor", l: "Editor — productos y ofertas" },
];

export default function Team() {
  const toast = useToast();
  const [rows, setRows] = useState<P[]>([]);
  const [me, setMe] = useState<string>();

  const load = useCallback(async () => {
    const db = supabaseBrowser();
    const [{ data: u }, { data, error }] = await Promise.all([db.auth.getUser(), db.from("profiles").select("*").order("created_at")]);
    setMe(u.user?.id);
    if (error) toast(error.message, "err");
    setRows((data ?? []) as P[]);
  }, [toast]);
  useEffect(() => {
    load();
  }, [load]);

  const setRole = async (p: P, role: string) => {
    const { error } = await supabaseBrowser().from("profiles").update({ role: role || null }).eq("user_id", p.user_id);
    if (error) return toast(error.message, "err");
    toast("Rol actualizado");
    load();
  };

  return (
    <div>
      <PageHeader title="Equipo" sub="Quien quiera entrar crea su cuenta en /admin/login; luego tú le asignas un rol aquí." />
      <Panel>
        {rows.length === 0 ? (
          <Empty>Sin usuarios.</Empty>
        ) : (
          <Table head={["Correo", "Desde", "Rol"]}>
            {rows.map((p) => (
              <tr key={p.user_id}>
                <td className="px-4 py-3 text-bone">{p.email}{p.user_id === me && <span className="ml-2 text-xs text-champagne">(tú)</span>}</td>
                <td className="px-4 py-3 text-ash">{new Date(p.created_at).toLocaleDateString("es-BO")}</td>
                <td className="px-4 py-3">
                  <Select value={p.role ?? ""} disabled={p.user_id === me} onChange={(e) => setRole(p, e.target.value)} className="max-w-xs">
                    {ROLES.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}
                  </Select>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </div>
  );
}
