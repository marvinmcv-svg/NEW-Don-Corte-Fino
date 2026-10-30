"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { productPhoto } from "@/lib/media";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { Badge, Button, Empty, fmtBs, fmtKg, Input, PageHeader, Table, Toggle, refreshSite, useToast } from "./ui";

type Row = {
  slug: string; name: { es: string }; sale_type: string; price_per_kg: number | null; price: number | null; grades: { price_per_kg: number }[] | null;
  status: string; featured: boolean; sort: number; image_url: string | null; track_stock: boolean; stock_kg: number; stock_units: number;
};

const TYPE: Record<string, string> = { portion: "Por bife", weight: "Por kilo", pack: "Pack", addon: "Complemento" };

export default function ProductsList({ canCreate }: { canCreate: boolean }) {
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data, error } = await supabaseBrowser()
      .from("products")
      .select("slug, name, sale_type, price_per_kg, price, grades, status, featured, sort, image_url, track_stock, stock_kg, stock_units")
      .order("sort");
    if (error) toast(error.message, "err");
    setRows((data ?? []) as Row[]);
    setLoading(false);
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quick = async (slug: string, patch: Partial<Row>) => {
    setRows((r) => r.map((x) => (x.slug === slug ? { ...x, ...patch } : x)));
    const { error } = await supabaseBrowser().from("products").update(patch).eq("slug", slug);
    if (error) {
      toast(error.message, "err");
      load();
    } else {
      toast("Guardado");
      refreshSite();
    }
  };

  const list = useMemo(() => rows.filter((r) => !q || r.name.es.toLowerCase().includes(q.toLowerCase()) || r.slug.includes(q.toLowerCase())), [rows, q]);

  return (
    <div>
      <PageHeader
        title="Productos"
        sub="Precios, opciones, fotos y disponibilidad. Los cambios se ven en el sitio en segundos."
        actions={canCreate && <Link href="/admin/productos/nuevo"><Button>+ Nuevo producto</Button></Link>}
      />
      <Input placeholder="Buscar producto" value={q} onChange={(e) => setQ(e.target.value)} className="mb-5 max-w-sm" />
      {loading ? (
        <p className="text-sm text-ash">Cargando…</p>
      ) : list.length === 0 ? (
        <Empty>Sin productos.</Empty>
      ) : (
        <Table head={["Producto", "Tipo", "Precio", "Stock", "Destacado", "Estado"]}>
          {list.map((r) => {
            const ph = productPhoto(r);
            const minKg = r.grades?.length ? Math.min(...r.grades.map((g) => g.price_per_kg)) : r.price_per_kg;
            return (
              <tr key={r.slug} className="hover:bg-champagne/[0.03]">
                <td className="px-4 py-3">
                  <Link href={`/admin/productos/${r.slug}`} className="flex items-center gap-3">
                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-burgundy/30">
                      {ph && <Image src={ph.main.src} alt="" fill sizes="44px" className="object-cover" />}
                    </span>
                    <span>
                      <span className="font-semibold text-bone hover:text-champagne">{r.name.es}</span>
                      <span className="block text-xs text-ash">{r.slug}</span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-steel">{TYPE[r.sale_type]}</td>
                <td className="px-4 py-3 text-bone">{r.sale_type === "pack" || r.sale_type === "addon" ? fmtBs(r.price) : `${fmtBs(minKg)}/kg`}</td>
                <td className="px-4 py-3 text-steel">{r.track_stock ? (r.sale_type === "pack" || r.sale_type === "addon" ? `${r.stock_units} u.` : fmtKg(r.stock_kg)) : <span className="text-ash">—</span>}</td>
                <td className="px-4 py-3"><Toggle checked={r.featured} onChange={(v) => quick(r.slug, { featured: v })} /></td>
                <td className="px-4 py-3">
                  <select
                    value={r.status}
                    onChange={(e) => quick(r.slug, { status: e.target.value })}
                    className="rounded-md border border-champagne/15 bg-noir px-2 py-1 text-xs text-bone"
                    aria-label="Estado"
                  >
                    <option value="active">Activo</option>
                    <option value="sold_out">Agotado</option>
                    <option value="hidden">Oculto</option>
                  </select>
                  <span className="ml-2 hidden xl:inline"><Badge value={r.status} label={{ active: "Visible", sold_out: "Agotado", hidden: "Oculto" }[r.status]} /></span>
                </td>
              </tr>
            );
          })}
        </Table>
      )}
    </div>
  );
}
