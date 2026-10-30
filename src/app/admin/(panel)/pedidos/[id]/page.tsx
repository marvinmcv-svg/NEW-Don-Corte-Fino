import OrderDetail from "@/components/admin/OrderDetail";
import { getAdminSession } from "@/lib/admin-session";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await getAdminSession();
  return <OrderDetail id={id} isOwner={s?.role === "owner"} />;
}
