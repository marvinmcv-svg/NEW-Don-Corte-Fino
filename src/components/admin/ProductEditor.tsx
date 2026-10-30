"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PREP_LABELS, type Grade, type L10n, type Portion } from "@/lib/catalog";
import { CUTS } from "@/lib/cuts";
import { productPhoto } from "@/lib/media";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { Button, Field, Input, PageHeader, Panel, Select, Textarea, Toggle, refreshSite, useToast } from "./ui";

type Form = {
  slug: string;
  cut: string;
  name: L10n;
  description: L10n;
  sale_type: "portion" | "weight" | "pack" | "addon";
  price_per_kg: string;
  price: string;
  grades: Grade[];
  portions: Portion[];
  prep_options: string[];
  min_qty: string;
  step_qty: string;
  badge_es: string;
  badge_en: string;
  featured: boolean;
  status: "active" | "sold_out" | "hidden";
  sort: string;
  image_url: string | null;
  track_stock: boolean;
  low_stock_kg: string;
  low_stock_units: string;
};

const EMPTY: Form = {
  slug: "",
  cut: "",
  name: { es: "", en: "" },
  description: { es: "", en: "" },
  sale_type: "portion",
  price_per_kg: "",
  price: "",
  grades: [
    { key: "seleccion", label: { es: "Selección · BMS 4–5", en: "Select · BMS 4–5" }, price_per_kg: 0 },
    { key: "reserva", label: { es: "Reserva · BMS 6–7", en: "Reserve · BMS 6–7" }, price_per_kg: 0 },
  ],
  portions: [{ label: { es: "3 cm", en: "3 cm" }, thickness_cm: 3, est_kg: 0.4, est_price: 0 }],
  prep_options: [],
  min_qty: "0.5",
  step_qty: "0.25",
  badge_es: "",
  badge_en: "",
  featured: false,
  status: "active",
  sort: "100",
  image_url: null,
  track_stock: false,
  low_stock_kg: "2",
  low_stock_units: "3",
};

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function ProductEditor({ slug, role }: { slug: string; role: "owner" | "staff" | "editor" }) {
  const router = useRouter();
  const toast = useToast();
  const isNew = slug === "nuevo";
  const [f, setF] = useState<Form>(EMPTY);
  const [loaded, setLoaded] = useState(isNew);
  const [busy, setBusy] = useState(false);
  const canEdit = role === "owner" || role === "editor";
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    if (isNew) return;
    supabaseBrowser()
      .from("products")
      .select("*")
      .eq("slug", slug)
      .single()
      .then(({ data, error }) => {
        if (error || !data) return toast(error?.message ?? "No encontrado", "err");
        const [bes, ben] = (data.badge ?? "").split(" / ");
        setF({
          slug: data.slug,
          cut: data.cut ?? "",
          name: data.name,
          description: data.description ?? { es: "", en: "" },
          sale_type: data.sale_type,
          price_per_kg: data.price_per_kg?.toString() ?? "",
          price: data.price?.toString() ?? "",
          grades: data.grades ?? [],
          portions: data.portions ?? [],
          prep_options: data.prep_options ?? [],
          min_qty: data.min_qty?.toString() ?? "",
          step_qty: data.step_qty?.toString() ?? "",
          badge_es: bes ?? "",
          badge_en: ben ?? "",
          featured: data.featured,
          status: data.status,
          sort: String(data.sort),
          image_url: data.image_url,
          track_stock: data.track_stock,
          low_stock_kg: String(data.low_stock_kg),
          low_stock_units: String(data.low_stock_units),
        });
        setLoaded(true);
      });
  }, [isNew, slug, toast]);

  const byKg = f.sale_type === "portion" || f.sale_type === "weight";

  const upload = async (file: File) => {
    const key = slugify(f.slug || f.name.es || "producto");
    const path = `products/${key}-${Date.now()}.${file.name.split(".").pop()?.toLowerCase() ?? "jpg"}`;
    const db = supabaseBrowser();
    const { error } = await db.storage.from("media").upload(path, file, { cacheControl: "31536000", upsert: false });
    if (error) return toast(error.message, "err");
    set("image_url", db.storage.from("media").getPublicUrl(path).data.publicUrl);
    toast("Foto subida. Guarda para publicarla.");
  };

  const save = async () => {
    const slugFinal = isNew ? slugify(f.slug || f.name.es) : f.slug;
    if (!slugFinal || !f.name.es.trim()) return toast("Falta el nombre", "err");
    const grades = f.grades.filter((g) => g.key && Number(g.price_per_kg) > 0).map((g) => ({ ...g, price_per_kg: Number(g.price_per_kg) }));
    const basePerKg = Number(f.price_per_kg) || (grades.length ? Math.min(...grades.map((g) => g.price_per_kg)) : 0);
    if (byKg && !basePerKg) return toast("Indica el precio por kg", "err");
    if (!byKg && !(Number(f.price) > 0)) return toast("Indica el precio", "err");
    const portions =
      f.sale_type === "portion"
        ? f.portions.filter((p) => Number(p.est_kg) > 0).map((p) => ({ ...p, est_kg: Number(p.est_kg), thickness_cm: Number(p.thickness_cm) || undefined, est_price: Math.round(basePerKg * Number(p.est_kg)) }))
        : null;
    if (f.sale_type === "portion" && !portions?.length) return toast("Agrega al menos un grosor", "err");

    const row = {
      slug: slugFinal,
      cut: f.cut || null,
      name: { es: f.name.es.trim(), en: f.name.en.trim() || f.name.es.trim() },
      description: f.description.es || f.description.en ? f.description : null,
      sale_type: f.sale_type,
      price_unit: byKg ? "kg" : "unit",
      price_per_kg: byKg ? basePerKg : null,
      price: byKg ? null : Number(f.price),
      grades: byKg && grades.length ? grades : null,
      portions,
      prep_options: f.sale_type === "weight" && f.prep_options.length ? f.prep_options : null,
      min_qty: f.sale_type === "weight" ? Number(f.min_qty) || 0.5 : null,
      step_qty: f.sale_type === "weight" ? Number(f.step_qty) || 0.25 : null,
      badge: f.badge_es ? `${f.badge_es}${f.badge_en ? ` / ${f.badge_en}` : ""}` : null,
      featured: f.featured,
      status: f.status,
      sort: Number(f.sort) || 100,
      image_url: f.image_url,
      track_stock: f.track_stock,
      low_stock_kg: Number(f.low_stock_kg) || 0,
      low_stock_units: Number(f.low_stock_units) || 0,
    };
    setBusy(true);
    const db = supabaseBrowser();
    // Staff may only change availability; the database rejects other edits from them anyway.
    const { error } = isNew
      ? await db.from("products").insert(row)
      : await db.from("products").update(canEdit ? row : { status: row.status, track_stock: row.track_stock, low_stock_kg: row.low_stock_kg, low_stock_units: row.low_stock_units }).eq("slug", slug);
    setBusy(false);
    if (error) return toast(error.code === "23505" ? "Ya existe un producto con ese identificador" : error.message, "err");
    toast("Producto guardado");
    refreshSite();
    if (isNew) router.replace(`/admin/productos/${slugFinal}`);
  };

  const remove = async () => {
    if (!confirm("¿Eliminar este producto? Si ya tiene pedidos, mejor márcalo como Oculto.")) return;
    const { error } = await supabaseBrowser().from("products").delete().eq("slug", slug);
    if (error) return toast(error.message, "err");
    toast("Producto eliminado");
    refreshSite();
    router.replace("/admin/productos");
  };

  if (!loaded) return <p className="text-sm text-ash">Cargando…</p>;
  const ph = productPhoto({ slug: f.slug, image_url: f.image_url });

  return (
    <div>
      <Link href="/admin/productos" className="text-xs text-ash hover:text-bone">← Productos</Link>
      <PageHeader
        title={isNew ? "Nuevo producto" : f.name.es}
        sub={isNew ? undefined : `/${f.slug}`}
        actions={
          <>
            {!isNew && f.cut && (
              <a href={`/es/cortes/${f.slug}`} target="_blank" rel="noopener"><Button variant="ghost">Ver en el sitio ↗</Button></a>
            )}
            <Button onClick={save} disabled={busy}>{busy ? "Guardando…" : "Guardar"}</Button>
          </>
        }
      />
      {!canEdit && <p className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">Tu rol puede cambiar disponibilidad y stock. Precios y textos los edita el dueño o un editor.</p>}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <fieldset disabled={!canEdit} className="min-w-0 space-y-6">
          <Panel title="Nombre y descripción">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre (español)"><Input value={f.name.es} onChange={(e) => set("name", { ...f.name, es: e.target.value })} /></Field>
              <Field label="Nombre (inglés)"><Input value={f.name.en} onChange={(e) => set("name", { ...f.name, en: e.target.value })} /></Field>
              {isNew && (
                <Field label="Identificador en la web" hint={`Se verá como /cortes/${slugify(f.slug || f.name.es) || "…"}`}>
                  <Input value={f.slug} placeholder={slugify(f.name.es)} onChange={(e) => set("slug", e.target.value)} />
                </Field>
              )}
              <Field label="Guía del corte" hint="Qué ficha educativa (cocción, maridaje…) muestra este producto">
                <Select value={f.cut} onChange={(e) => set("cut", e.target.value)}>
                  <option value="">— Ninguna (pack o complemento)</option>
                  {Object.keys(CUTS).map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Descripción corta (español)"><Textarea value={f.description.es} onChange={(e) => set("description", { ...f.description, es: e.target.value })} /></Field>
              <Field label="Descripción corta (inglés)"><Textarea value={f.description.en} onChange={(e) => set("description", { ...f.description, en: e.target.value })} /></Field>
            </div>
          </Panel>

          <Panel title="Cómo se vende y precio">
            <div className="mb-5 flex flex-wrap gap-2">
              {(["portion", "weight", "pack", "addon"] as const).map((t) => (
                <button key={t} type="button" onClick={() => set("sale_type", t)} className={`rounded-lg border px-3.5 py-2 text-sm ${f.sale_type === t ? "border-wine bg-burgundy text-bone" : "border-champagne/15 text-steel"}`}>
                  {{ portion: "Por bife / grosor", weight: "Por kilo", pack: "Pack (precio fijo)", addon: "Complemento" }[t]}
                </button>
              ))}
            </div>

            {byKg ? (
              <>
                <p className="mb-2 text-xs font-semibold text-steel">Grados y precio por kg</p>
                <div className="space-y-2">
                  {f.grades.map((g, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_110px_auto] gap-2">
                      <Input value={g.label.es} placeholder="Etiqueta ES" onChange={(e) => set("grades", f.grades.map((x, j) => (j === i ? { ...x, label: { ...x.label, es: e.target.value } } : x)))} />
                      <Input value={g.label.en} placeholder="Label EN" onChange={(e) => set("grades", f.grades.map((x, j) => (j === i ? { ...x, label: { ...x.label, en: e.target.value } } : x)))} />
                      <Input type="number" min="0" step="1" value={g.price_per_kg || ""} placeholder="Bs/kg" onChange={(e) => set("grades", f.grades.map((x, j) => (j === i ? { ...x, price_per_kg: Number(e.target.value) } : x)))} />
                      <Button type="button" variant="subtle" size="sm" onClick={() => set("grades", f.grades.filter((_, j) => j !== i))}>✕</Button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => set("grades", [...f.grades, { key: `grado-${f.grades.length + 1}`, label: { es: "", en: "" }, price_per_kg: 0 }])}>+ Grado</Button>
                {f.grades.length === 0 && (
                  <Field label="Precio por kg (Bs)" className="mt-4 max-w-xs"><Input type="number" min="0" value={f.price_per_kg} onChange={(e) => set("price_per_kg", e.target.value)} /></Field>
                )}
              </>
            ) : (
              <Field label="Precio (Bs)" className="max-w-xs"><Input type="number" min="0" value={f.price} onChange={(e) => set("price", e.target.value)} /></Field>
            )}

            {f.sale_type === "portion" && (
              <div className="mt-6">
                <p className="mb-2 text-xs font-semibold text-steel">Grosores (el precio se calcula con el peso aproximado)</p>
                <div className="space-y-2">
                  {f.portions.map((p, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_90px_90px_auto] gap-2">
                      <Input value={p.label.es} placeholder="ej. 3 cm" onChange={(e) => set("portions", f.portions.map((x, j) => (j === i ? { ...x, label: { ...x.label, es: e.target.value } } : x)))} />
                      <Input value={p.label.en} placeholder="EN" onChange={(e) => set("portions", f.portions.map((x, j) => (j === i ? { ...x, label: { ...x.label, en: e.target.value } } : x)))} />
                      <Input type="number" step="0.5" value={p.thickness_cm ?? ""} placeholder="cm" onChange={(e) => set("portions", f.portions.map((x, j) => (j === i ? { ...x, thickness_cm: Number(e.target.value) } : x)))} />
                      <Input type="number" step="0.01" value={p.est_kg || ""} placeholder="kg aprox." onChange={(e) => set("portions", f.portions.map((x, j) => (j === i ? { ...x, est_kg: Number(e.target.value) } : x)))} />
                      <Button type="button" variant="subtle" size="sm" onClick={() => set("portions", f.portions.filter((_, j) => j !== i))}>✕</Button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => set("portions", [...f.portions, { label: { es: "", en: "" }, est_kg: 0, est_price: 0 }])}>+ Grosor</Button>
              </div>
            )}

            {f.sale_type === "weight" && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Pedido mínimo (kg)"><Input type="number" step="0.25" value={f.min_qty} onChange={(e) => set("min_qty", e.target.value)} /></Field>
                <Field label="Saltos de (kg)"><Input type="number" step="0.25" value={f.step_qty} onChange={(e) => set("step_qty", e.target.value)} /></Field>
                <div className="sm:col-span-2">
                  <p className="mb-2 text-xs font-semibold text-steel">Preparaciones que puede elegir el cliente</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(PREP_LABELS).map(([k, v]) => {
                      const on = f.prep_options.includes(k);
                      return (
                        <button key={k} type="button" onClick={() => set("prep_options", on ? f.prep_options.filter((x) => x !== k) : [...f.prep_options, k])} className={`rounded-full border px-3 py-1 text-xs ${on ? "border-wine bg-burgundy text-bone" : "border-champagne/15 text-steel"}`}>
                          {v.es}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </Panel>
        </fieldset>

        <div className="space-y-6">
          <Panel title="Foto">
            <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-burgundy/20">
              {ph ? <Image src={ph.main.src} alt="" fill sizes="400px" className="object-cover" /> : <p className="p-6 text-sm text-ash">Sin foto: el sitio muestra una ilustración.</p>}
            </div>
            <input type="file" disabled={!canEdit} accept="image/jpeg,image/png,image/webp,image/avif" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} className="block w-full text-xs text-steel file:mr-3 file:rounded-md file:border-0 file:bg-burgundy file:px-3 file:py-1.5 file:text-bone" />
            {f.image_url && (
              <button type="button" className="mt-2 text-xs text-ash hover:text-bone" onClick={() => set("image_url", null)}>Quitar foto subida (vuelve a la foto original)</button>
            )}
          </Panel>

          <Panel title="Visibilidad">
            <div className="space-y-4">
              <Field label="Estado">
                <Select value={f.status} onChange={(e) => set("status", e.target.value as Form["status"])}>
                  <option value="active">Activo (se puede comprar)</option>
                  <option value="sold_out">Agotado</option>
                  <option value="hidden">Oculto</option>
                </Select>
              </Field>
              <Toggle checked={f.featured} onChange={(v) => set("featured", v)} label="Destacado en la página de inicio" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Etiqueta (ES)" hint="ej. Más vendido"><Input value={f.badge_es} onChange={(e) => set("badge_es", e.target.value)} /></Field>
                <Field label="Etiqueta (EN)"><Input value={f.badge_en} onChange={(e) => set("badge_en", e.target.value)} /></Field>
              </div>
              <Field label="Orden" hint="Menor número = aparece antes"><Input type="number" value={f.sort} onChange={(e) => set("sort", e.target.value)} /></Field>
            </div>
          </Panel>

          <Panel title="Stock">
            <div className="space-y-4">
              <Toggle checked={f.track_stock} onChange={(v) => set("track_stock", v)} label="Controlar stock (se marca Agotado al llegar a 0)" />
              {f.track_stock && (
                <Field label={byKg ? "Avisar cuando queden (kg)" : "Avisar cuando queden (unidades)"}>
                  {byKg ? (
                    <Input type="number" step="0.5" value={f.low_stock_kg} onChange={(e) => set("low_stock_kg", e.target.value)} />
                  ) : (
                    <Input type="number" value={f.low_stock_units} onChange={(e) => set("low_stock_units", e.target.value)} />
                  )}
                </Field>
              )}
              <p className="text-xs text-ash">Las entradas de mercadería y ajustes se registran en Inventario.</p>
            </div>
          </Panel>

          {!isNew && role === "owner" && (
            <Button type="button" variant="danger" onClick={remove} className="w-full">Eliminar producto</Button>
          )}
        </div>
      </div>
    </div>
  );
}
