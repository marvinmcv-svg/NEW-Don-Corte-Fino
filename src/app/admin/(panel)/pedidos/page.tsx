import { Suspense } from "react";
import OrdersList from "@/components/admin/OrdersList";

export default function Page() {
  return (
    <Suspense>
      <OrdersList />
    </Suspense>
  );
}
