import Dashboard from "@/components/admin/Dashboard";
import { getAdminSession } from "@/lib/admin-session";

export default async function AdminHome() {
  const s = await getAdminSession();
  return <Dashboard role={s!.role!} />;
}
