import "server-only";
import { cache } from "react";
import { supabaseServer } from "./supabase/server";

export type Role = "owner" | "staff" | "editor";
export type AdminSession = { userId: string; email: string; role: Role | null; name: string | null };

/** Signed-in admin and their role, or null. Cached per request. */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const db = await supabaseServer();
  const { data } = await db.auth.getUser();
  if (!data.user) return null;
  const { data: p } = await db.from("profiles").select("role, full_name").eq("user_id", data.user.id).maybeSingle();
  return { userId: data.user.id, email: data.user.email ?? "", role: (p?.role as Role) ?? null, name: p?.full_name ?? null };
});

/** Which sections each role sees. Database rules enforce the same split. */
export const NAV: { href: string; label: string; roles: Role[]; icon: string }[] = [
  { href: "/admin", label: "Resumen", roles: ["owner", "staff", "editor"], icon: "◆" },
  { href: "/admin/pedidos", label: "Pedidos", roles: ["owner", "staff"], icon: "▤" },
  { href: "/admin/productos", label: "Productos", roles: ["owner", "staff", "editor"], icon: "◐" },
  { href: "/admin/inventario", label: "Inventario", roles: ["owner", "staff"], icon: "▦" },
  { href: "/admin/clientes", label: "Clientes", roles: ["owner", "staff"], icon: "☺" },
  { href: "/admin/promociones", label: "Promociones", roles: ["owner", "editor"], icon: "✦" },
  { href: "/admin/ajustes", label: "Ajustes", roles: ["owner"], icon: "⚙" },
  { href: "/admin/equipo", label: "Equipo", roles: ["owner"], icon: "♟" },
  { href: "/admin/cuenta", label: "Mi cuenta", roles: ["owner", "staff", "editor"], icon: "○" },
];
