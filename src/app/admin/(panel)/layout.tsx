import { redirect } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import { ToastProvider } from "@/components/admin/ui";
import { getAdminSession, NAV } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  if (!session.role) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <div className="max-w-md rounded-2xl border border-champagne/10 bg-coal/70 p-8">
          <h1 className="font-display text-2xl text-bone">Esperando acceso</h1>
          <p className="mt-3 text-sm leading-relaxed text-steel">
            Tu cuenta <b className="text-bone">{session.email}</b> está creada, pero el dueño todavía no te asignó un rol. Pídele que te habilite en <i>Equipo</i>.
          </p>
          <form action="/admin/salir" method="post" className="mt-6">
            <button className="text-sm text-champagne hover:text-bone">Cerrar sesión</button>
          </form>
        </div>
      </div>
    );
  }

  const nav = NAV.filter((n) => n.roles.includes(session.role!));
  return (
    <ToastProvider>
      <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
        <Sidebar nav={nav} email={session.email} role={session.role} />
        <main className="min-w-0 px-4 pb-24 pt-20 md:px-8 lg:pt-10">{children}</main>
      </div>
    </ToastProvider>
  );
}
