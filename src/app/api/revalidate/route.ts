import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { CATALOG_TAG } from "@/lib/catalog-server";
import { supabaseServer } from "@/lib/supabase/server";

/** Called by the admin portal after a save so the public site shows the change right away. */
export async function POST() {
  const db = await supabaseServer();
  const { data: user } = await db.auth.getUser();
  if (!user.user) return NextResponse.json({ ok: false }, { status: 401 });
  const { data: profile } = await db.from("profiles").select("role").eq("user_id", user.user.id).single();
  if (!profile?.role) return NextResponse.json({ ok: false }, { status: 403 });
  revalidateTag(CATALOG_TAG);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
