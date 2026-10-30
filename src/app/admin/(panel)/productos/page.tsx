import ProductsList from "@/components/admin/ProductsList";
import { getAdminSession } from "@/lib/admin-session";

export default async function Page() {
  const s = await getAdminSession();
  return <ProductsList canCreate={s?.role === "owner" || s?.role === "editor"} />;
}
