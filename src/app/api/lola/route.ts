import Anthropic from "@anthropic-ai/sdk";
import { fromPrice, visibleProducts, type Catalog, type Locale } from "@/lib/catalog";
import { getCatalog } from "@/lib/catalog-server";
import { CUTS, PRIMALS } from "@/lib/cuts";
import { FAQ, matchFaq } from "@/lib/faq";
import { bs } from "@/lib/i18n";
import { displayPhone } from "@/lib/order";

/**
 * Vaca Lola, the shop's AI receptionist. Streams plain-text replies grounded in the live catalogue,
 * shop settings and FAQ. Without ANTHROPIC_API_KEY it answers from the FAQ by keyword instead.
 */

export const runtime = "nodejs";

const MAX_TURNS = 12;
const MAX_CHARS = 1200;

// Best-effort per-instance rate limit: 20 messages per IP per 10 minutes.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 20;
}

function systemPrompt(c: Catalog) {
  const s = c.settings;
  const products = visibleProducts(c)
    .map((p) => {
      const price = fromPrice(p);
      const grades = p.grades?.map((g) => `${g.label.es} ${bs(g.price_per_kg)}/kg`).join("; ");
      const portions = p.portions?.map((x) => `${x.label.es} ≈${x.est_kg} kg ≈${bs(x.est_price)}`).join("; ");
      const info = p.cut ? CUTS[p.cut] : undefined;
      return [
        `- ${p.name.es} / ${p.name.en} (link: /es/cortes/${p.slug})`,
        `  desde ${bs(price.amount)}${price.perKg ? "/kg" : ""}; venta: ${p.sale_type}${p.status === "sold_out" ? "; AGOTADO" : ""}`,
        grades && `  grados: ${grades}`,
        portions && `  porciones: ${portions}`,
        info?.primal && `  zona: ${PRIMALS[info.primal].es}`,
        info && `  ideal para: ${info.methods.join(", ")}; grosor ${info.thickness.es}; reposo ${info.rest} min; vino ${info.wine}`,
        info && `  historia: ${info.story.es}`,
        p.description?.es && `  descripción: ${p.description.es}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");
  const offers = c.offers
    .filter((o) => o.active)
    .map((o) => `- ${o.name.es}: ${o.pitch.es}${o.code ? ` (código ${o.code})` : ""}${o.launch_price ? ` — ${bs(o.launch_price)}` : ""}`)
    .join("\n");
  const faq = FAQ.map((f) => `P: ${f.q.es}\nR: ${f.a.es}`).join("\n\n");

  return `Eres Vaca Lola, la recepcionista virtual de Don Corte Fino, carnicería premium en Santa Cruz de la Sierra, Bolivia.

Personalidad: cálida, cruceña, con humor ligero de vaca ("¡muuuy buena elección!" de vez en cuando, sin abusar). Respuestas cortas: 1–4 frases o una lista breve. Responde en el idioma del cliente (español o inglés).

Qué haces: respondes sobre la tienda, los cortes, precios, cómo pedir, envíos, pagos, conservación y cocción; recomiendas cortes según la ocasión y el presupuesto. Cuando recomiendes un producto, incluye su link tal cual (por ejemplo /es/cortes/picana, o /en/cortes/picana si hablas en inglés).

Reglas:
- Usa SOLO la información de abajo. Si no sabes algo (stock exacto, horarios de un día puntual, reclamos, pedidos ya hechos, precios no listados), dilo y ofrece WhatsApp ${displayPhone(s.whatsapp)}.
- Somos Wangus (Wagyu × Angus), NO Wagyu puro. Nunca digas que vendemos Wagyu puro.
- Los precios son referenciales; el total final se confirma por WhatsApp tras pesar.
- No tomes pedidos ni pagos en el chat: guía al cliente a la tienda (/es/tienda) y al botón de WhatsApp.
- Sin markdown pesado: texto plano, puedes usar guiones para listas.

DATOS DE LA TIENDA
- Marca: Don Corte Fino · carne Wangus (Wagyu × Angus), terminada a corral en Santa Cruz camino a Brasil. Marmoleo BMS 4–7.
- WhatsApp de pedidos: ${displayPhone(s.whatsapp)}
- Envío: Bs ${s.delivery.fee_per_km} por km desde la tienda, redondeado al km siguiente${s.delivery.min_fee ? `, mínimo ${bs(s.delivery.min_fee)}` : ""}${s.delivery.max_km ? `, hasta ${s.delivery.max_km} km` : ""}. ${s.delivery.pickup ? "Retiro en tienda gratis." : ""}
- Franjas de entrega: ${s.slots.join(", ")}
- Pagos: ${s.payment_methods.map((m) => m.label.es).join(", ")}
${s.min_order ? `- Pedido mínimo: ${bs(s.min_order)}` : ""}

PRODUCTOS
${products}

OFERTAS ACTIVAS
${offers || "- Ninguna por ahora."}

PREGUNTAS FRECUENTES
${faq}`;
}

const text = (body: string, mode: "ai" | "faq") =>
  new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "x-lola-mode": mode } });

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  let body: { messages?: { role: string; content: string }[]; locale?: Locale };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  const locale: Locale = body.locale === "en" ? "en" : "es";
  const history: Anthropic.Beta.BetaMessageParam[] = (body.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content.slice(0, MAX_CHARS) }));
  while (history.length && history[0].role !== "user") history.shift();
  const last = history.at(-1);
  if (!last || last.role !== "user") return new Response("Bad request", { status: 400 });

  const catalog = await getCatalog();
  const wa = displayPhone(catalog.settings.whatsapp);
  const handoff =
    locale === "es"
      ? `Para eso te ayuda mejor una persona del equipo: escríbenos por WhatsApp al ${wa}. 🐄`
      : `A person from our team can help best with that: message us on WhatsApp at ${wa}. 🐄`;

  if (limited(ip)) return text(locale === "es" ? `¡Muuu, cuántas preguntas! Dame un respiro y vuelve en unos minutos, o escríbenos al WhatsApp ${wa}.` : `Moo, that's a lot of questions! Give me a few minutes, or message us on WhatsApp at ${wa}.`, "faq");

  if (!process.env.ANTHROPIC_API_KEY) {
    const f = matchFaq(last.content as string);
    return text(f ? f.a[locale] : handoff, "faq");
  }

  const client = new Anthropic();
  const stream = client.beta.messages.stream({
    model: "claude-opus-5-5",
    max_tokens: 1024,
    output_config: { effort: "low" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: [{ type: "text", text: systemPrompt(catalog), cache_control: { type: "ephemeral" } }],
    messages: history,
  });

  const encoder = new TextEncoder();
  const out = new ReadableStream<Uint8Array>({
    async start(controller) {
      let wrote = false;
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            wrote = true;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal" || !wrote) controller.enqueue(encoder.encode(handoff));
      } catch (e) {
        console.error("[lola]", e instanceof Anthropic.APIError ? `${e.status} ${e.message}` : e);
        const f = matchFaq(last.content as string);
        controller.enqueue(encoder.encode(wrote ? "" : f ? f.a[locale] : handoff));
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });
  return new Response(out, { headers: { "content-type": "text/plain; charset=utf-8", "x-lola-mode": "ai", "cache-control": "no-store" } });
}
