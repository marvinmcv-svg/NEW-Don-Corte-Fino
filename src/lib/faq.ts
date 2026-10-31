import type { L10n } from "./catalog";

/**
 * Shop FAQ. Vaca Lola answers from this list (plus the live catalogue and settings), and falls back
 * to keyword matching over it when no AI key is configured. Keep answers factual: anything not
 * covered here gets handed to a human on WhatsApp.
 */
export type Faq = { q: L10n; a: L10n; keys: string[] };

export const FAQ: Faq[] = [
  {
    q: { es: "¿Qué es Wangus?", en: "What is Wangus?" },
    a: {
      es: "Wangus es nuestro cruce Wagyu × Angus. El Wagyu aporta el marmoleo fino y la textura de manteca; el Angus, el sabor a carne intenso y cortes generosos. No vendemos Wagyu puro: vendemos lo mejor de las dos razas, con marmoleo BMS 4 a 7.",
      en: "Wangus is our Wagyu × Angus cross. Wagyu brings fine marbling and a buttery texture; Angus brings bold beef flavour and generous cuts. We don't sell full-blood Wagyu: we sell the best of both breeds, with BMS 4 to 7 marbling.",
    },
    keys: ["wangus", "wagyu", "angus", "raza", "breed", "cruce", "cross", "puro", "full-blood", "bms", "marmoleo", "marbling"],
  },
  {
    q: { es: "¿De dónde viene la carne?", en: "Where does the beef come from?" },
    a: {
      es: "Nuestro Wangus se termina a corral (engorde en confinamiento) en Santa Cruz, Bolivia, sobre la ruta que va hacia la frontera con Brasil, con dieta controlada todos los días.",
      en: "Our Wangus is feedlot-finished in Santa Cruz, Bolivia, along the route toward the Brazilian border, on a controlled diet every day.",
    },
    keys: ["origen", "origin", "donde", "where", "corral", "feedlot", "confinamiento", "brasil", "brazil", "criado", "raised"],
  },
  {
    q: { es: "¿Cómo hago un pedido?", en: "How do I order?" },
    a: {
      es: "Elige tus cortes en la tienda, agrégalos al carrito y presiona «Confirmar por WhatsApp». Se abre WhatsApp con tu pedido escrito; lo envías y te confirmamos el total final.",
      en: "Pick your cuts in the shop, add them to the basket and press “Confirm on WhatsApp”. WhatsApp opens with your order written out; send it and we confirm the final total.",
    },
    keys: ["pedido", "pedir", "order", "comprar", "buy", "carrito", "basket", "checkout"],
  },
  {
    q: { es: "¿Por qué el total es estimado?", en: "Why is the total an estimate?" },
    a: {
      es: "Los cortes por peso se pesan al prepararlos, así que el precio en la web es aproximado. Te confirmamos el total exacto por WhatsApp antes de cobrar.",
      en: "Cuts sold by weight are weighed when we prepare them, so the price on the site is approximate. We confirm the exact total on WhatsApp before you pay.",
    },
    keys: ["estimado", "estimate", "peso", "weight", "exacto", "exact", "total", "kilo"],
  },
  {
    q: { es: "¿Cuánto cuesta el envío?", en: "How much is delivery?" },
    a: {
      es: "Entregamos en todo Santa Cruz por Bs 3 por km desde nuestra tienda, redondeado al km siguiente (ej.: 7.3 km → 8 km → Bs 24). El retiro en tienda es gratis. Coordinamos día y horario por WhatsApp.",
      en: "We deliver across Santa Cruz at Bs 3 per km from our store, rounded up to the next km (e.g. 7.3 km → 8 km → Bs 24). Store pickup is free. We arrange day and time on WhatsApp.",
    },
    keys: ["envio", "envío", "delivery", "entrega", "deliver", "km", "costo", "cost", "retiro", "pickup", "zona", "area", "domicilio"],
  },
  {
    q: { es: "¿Cómo puedo pagar?", en: "How can I pay?" },
    a: {
      es: "En efectivo al recibir o por QR, una vez que confirmamos el total final por WhatsApp.",
      en: "Cash on delivery or by QR, once we've confirmed the final total on WhatsApp.",
    },
    keys: ["pago", "pagar", "pay", "payment", "qr", "efectivo", "cash", "tarjeta", "card", "transferencia", "transfer"],
  },
  {
    q: { es: "¿Cómo llega la carne?", en: "How does the meat arrive?" },
    a: {
      es: "Cada pieza se porciona a mano al grosor que pides (2, 3 o 4 cm) y se sella al vacío individualmente. Viaja con cadena de frío hasta tu puerta.",
      en: "Every piece is hand-portioned to the thickness you choose (2, 3 or 4 cm) and individually vacuum-sealed. It travels in a cold chain to your door.",
    },
    keys: ["vacio", "vacío", "vacuum", "sellado", "sealed", "frio", "frío", "cold", "grosor", "thickness", "llega", "arrive", "empaque"],
  },
  {
    q: { es: "¿Cómo la conservo?", en: "How should I store it?" },
    a: {
      es: "Guárdala en la heladera sin abrir el empaque al vacío, o congélala si no la vas a cocinar pronto. Descongela dentro de la heladera, nunca a temperatura ambiente. Para plazos exactos de cada lote, pregúntanos por WhatsApp.",
      en: "Keep it in the fridge in its unopened vacuum pack, or freeze it if you won't cook it soon. Thaw it in the fridge, never at room temperature. For exact timings on each batch, ask us on WhatsApp.",
    },
    keys: ["conservar", "conservo", "guardar", "guardo", "storage", "keep", "heladera", "fridge", "congelar", "freeze", "descongelar", "thaw", "dura", "last"],
  },
  {
    q: { es: "¿Cómo cocino un corte Wangus?", en: "How do I cook a Wangus cut?" },
    a: {
      es: "Fuego fuerte y poco tiempo: sal en escamas, sella bien y deja reposar unos minutos antes de cortar. Punto ideal: 50 °C jugoso, 55 °C medio jugoso, 60 °C a punto. Cada corte tiene su guía en la sección Cortes.",
      en: "High heat, short time: flaky salt, a hard sear and a few minutes' rest before slicing. Sweet spot: 50 °C rare, 55 °C medium rare, 60 °C medium. Every cut has its own guide in the Cuts section.",
    },
    keys: ["cocinar", "cook", "parrilla", "grill", "punto", "doneness", "temperatura", "temperature", "receta", "recipe", "reposo", "rest"],
  },
  {
    q: { es: "¿Qué horarios de entrega tienen?", en: "What delivery times do you offer?" },
    a: {
      es: "Elegimos contigo una franja horaria al confirmar el pedido; las franjas disponibles aparecen en el checkout.",
      en: "We agree a time slot with you when confirming the order; the available slots are shown at checkout.",
    },
    keys: ["horario", "hora", "hours", "time", "slot", "franja", "cuando", "when", "abren", "open"],
  },
];

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Best FAQ entry for a question by keyword overlap, or null when nothing matches. */
export function matchFaq(question: string): Faq | null {
  const q = norm(question);
  let best: { f: Faq; score: number } | null = null;
  for (const f of FAQ) {
    const score = f.keys.reduce((n, k) => n + (new RegExp(`(^|[^a-z0-9])${norm(k).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(q) ? 1 : 0), 0);
    if (score > 0 && (!best || score > best.score)) best = { f, score };
  }
  return best?.f ?? null;
}
