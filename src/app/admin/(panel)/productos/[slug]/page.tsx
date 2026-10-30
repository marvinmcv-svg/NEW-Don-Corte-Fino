import ProductEditor from "@/components/admin/ProductEditor";
import { getAdminSession } from "@/lib/admin-session";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await getAdminSession();
  return <ProductEditor slug={slug} role={s!.role!} />;
}
