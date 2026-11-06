import type { Locale } from "./catalog";

export type LegalDoc = {
  title: string;
  intro: string;
  sections: { h: string; p: string[] }[];
};

export const LEGAL_UPDATED = "2026-11-04";

const privacy: Record<Locale, LegalDoc> = {
  es: {
    title: "Política de privacidad",
    intro:
      "En Don Corte Fino (Santa Cruz de la Sierra, Bolivia) usamos tus datos solo para preparar, confirmar y entregar tus pedidos. Esta política explica qué datos recogemos, para qué y cómo puedes pedirnos que los corrijamos o eliminemos.",
    sections: [
      {
        h: "1. Qué datos recogemos",
        p: [
          "Datos que tú nos das al hacer un pedido o escribirnos: nombre, número de teléfono, dirección de entrega y referencias, fecha y horario preferidos, método de pago, notas y el detalle de los productos.",
          "Ubicación: solo si presionas «Compartir mi ubicación» en el checkout. Usamos esa ubicación únicamente para calcular el envío y encontrar tu dirección.",
          "Mensajes a Vaca Lola, nuestra asistente virtual: el texto que escribes se envía a nuestro proveedor de inteligencia artificial para generar la respuesta. No guardamos esas conversaciones en nuestra base de datos.",
          "Datos técnicos mínimos: tu carrito y tu idioma se guardan en tu propio navegador (almacenamiento local y una cookie de idioma). No usamos cookies publicitarias ni de seguimiento de terceros.",
        ],
      },
      {
        h: "2. Para qué los usamos",
        p: [
          "Preparar tu pedido, confirmar el peso y el total final, coordinar la entrega o el retiro y contactarte por WhatsApp sobre ese pedido.",
          "Responder tus consultas y reclamos, y cumplir obligaciones contables y legales.",
          "Solo te enviaremos promociones si nos lo pides o aceptas expresamente; puedes pedir que dejemos de hacerlo en cualquier momento.",
        ],
      },
      {
        h: "3. Con quién los compartimos",
        p: [
          "No vendemos ni alquilamos tus datos. Solo los compartimos con los servicios que necesitamos para operar: WhatsApp (Meta) para comunicarnos contigo, nuestro proveedor de base de datos y alojamiento web, nuestro proveedor de inteligencia artificial para Vaca Lola, y el repartidor que lleva tu pedido (nombre, teléfono y dirección).",
          "Algunos de estos proveedores procesan datos fuera de Bolivia. Les exigimos usarlos solo para prestarnos su servicio.",
          "También podemos entregar datos cuando una autoridad competente lo exija conforme a la ley boliviana.",
        ],
      },
      {
        h: "4. Cuánto tiempo los guardamos",
        p: [
          "Guardamos los datos de tus pedidos mientras seas cliente y durante el tiempo que exijan las normas contables y tributarias. Después los eliminamos o anonimizamos.",
        ],
      },
      {
        h: "5. Tus derechos",
        p: [
          "Conforme a la Constitución Política del Estado (art. 21 y 130), puedes pedirnos en cualquier momento acceder a tus datos, corregirlos, actualizarlos o eliminarlos, y oponerte a recibir mensajes promocionales.",
          "Escríbenos por WhatsApp al número que figura en el sitio y te responderemos en un plazo razonable.",
        ],
      },
      {
        h: "6. Seguridad",
        p: [
          "Usamos conexiones cifradas (HTTPS) y acceso restringido a nuestro panel de administración. Ningún sistema es infalible, pero cuidamos tus datos como cuidamos la cadena de frío.",
        ],
      },
      {
        h: "7. Menores de edad",
        p: ["Nuestros servicios están dirigidos a personas mayores de 18 años. Si eres menor, pide a un adulto que haga el pedido."],
      },
      {
        h: "8. Cambios",
        p: ["Podemos actualizar esta política. Publicaremos la versión vigente en esta página con su fecha de actualización."],
      },
    ],
  },
  en: {
    title: "Privacy policy",
    intro:
      "At Don Corte Fino (Santa Cruz de la Sierra, Bolivia) we use your data only to prepare, confirm and deliver your orders. This policy explains what we collect, why, and how you can ask us to correct or delete it.",
    sections: [
      {
        h: "1. What we collect",
        p: [
          "Data you give us when you order or message us: name, phone number, delivery address and landmarks, preferred date and time, payment method, notes and the products you choose.",
          "Location: only if you press “Share my location” at checkout. We use it solely to work out delivery and find your address.",
          "Messages to Vaca Lola, our virtual assistant: what you type is sent to our AI provider to generate the reply. We don't store those conversations in our database.",
          "Minimal technical data: your basket and language are saved in your own browser (local storage and a language cookie). We don't use advertising or third-party tracking cookies.",
        ],
      },
      {
        h: "2. How we use it",
        p: [
          "To prepare your order, confirm the final weight and total, arrange delivery or pickup and contact you on WhatsApp about that order.",
          "To answer questions and complaints and to meet accounting and legal obligations.",
          "We'll only send you promotions if you ask for them or expressly agree; you can tell us to stop at any time.",
        ],
      },
      {
        h: "3. Who we share it with",
        p: [
          "We never sell or rent your data. We only share it with the services we need to operate: WhatsApp (Meta) to talk to you, our database and web-hosting providers, our AI provider for Vaca Lola, and the courier delivering your order (name, phone and address).",
          "Some of these providers process data outside Bolivia. We require them to use it only to provide their service to us.",
          "We may also disclose data when a competent authority requires it under Bolivian law.",
        ],
      },
      {
        h: "4. How long we keep it",
        p: ["We keep order data while you're a customer and for as long as accounting and tax rules require. After that we delete or anonymise it."],
      },
      {
        h: "5. Your rights",
        p: [
          "Under the Bolivian Constitution (art. 21 and 130) you can ask us at any time to access, correct, update or delete your data, and to stop sending you promotional messages.",
          "Message us on WhatsApp at the number shown on this site and we'll reply within a reasonable time.",
        ],
      },
      {
        h: "6. Security",
        p: ["We use encrypted connections (HTTPS) and restricted access to our admin panel. No system is perfect, but we look after your data the way we look after the cold chain."],
      },
      {
        h: "7. Minors",
        p: ["Our services are meant for people aged 18 and over. If you're younger, please ask an adult to place the order."],
      },
      {
        h: "8. Changes",
        p: ["We may update this policy. The current version, with its update date, will always be on this page."],
      },
    ],
  },
};

const terms: Record<Locale, LegalDoc> = {
  es: {
    title: "Términos y condiciones",
    intro:
      "Estos términos regulan las compras en el sitio de Don Corte Fino, carnicería ubicada en Santa Cruz de la Sierra, Bolivia. Al enviar un pedido aceptas estas condiciones.",
    sections: [
      {
        h: "1. Cómo funciona un pedido",
        p: [
          "Armas tu carrito en el sitio y lo envías por WhatsApp (o lo confirmas en el checkout). El pedido queda confirmado solo cuando te respondemos por WhatsApp con el total final y la fecha de entrega o retiro.",
          "Podemos rechazar o ajustar un pedido por falta de stock, errores evidentes de precio o zonas fuera de cobertura. Si pasa, te avisamos antes de cobrar.",
        ],
      },
      {
        h: "2. Precios y peso",
        p: [
          "Los precios están en bolivianos (Bs) y pueden cambiar sin aviso; aplica el precio vigente al momento de confirmar el pedido.",
          "La carne se vende por peso. Los totales del sitio son estimados: cada pieza se pesa al prepararla y el total final puede variar ligeramente hacia arriba o hacia abajo. Te lo confirmamos antes del pago.",
          "Las fotos e ilustraciones son referenciales; el marmoleo, la forma y el color varían naturalmente de una pieza a otra.",
        ],
      },
      {
        h: "3. Pago",
        p: [
          "Aceptamos los métodos indicados en el checkout (por ejemplo, QR o efectivo contra entrega). Los pagos por QR se realizan una vez confirmado el total final.",
          "Los códigos de descuento y promociones tienen condiciones propias (mínimo de compra, vigencia, unidades limitadas) y no son acumulables salvo que se indique.",
        ],
      },
      {
        h: "4. Entrega y retiro",
        p: [
          "Entregamos en Santa Cruz de la Sierra. El costo de envío se calcula por kilómetro desde nuestra tienda y se confirma por WhatsApp. El retiro en tienda no tiene costo.",
          "Coordinamos día y horario contigo. Si no hay nadie para recibir el pedido en el horario acordado, coordinaremos una nueva entrega, que puede tener costo adicional.",
          "Mantenemos la cadena de frío hasta la entrega. Desde que recibes el pedido, debes refrigerarlo (0–4 °C) o congelarlo de inmediato.",
        ],
      },
      {
        h: "5. Cambios, reclamos y devoluciones",
        p: [
          "Por ser un producto perecedero, no aceptamos devoluciones por cambio de opinión una vez entregado el pedido.",
          "Si un producto llega en mal estado, con un peso muy distinto al confirmado o no corresponde a lo pedido, escríbenos por WhatsApp dentro de las 24 horas siguientes a la entrega, con fotos y sin haberlo cocinado. Te ofreceremos reposición, nota de crédito o reembolso, según corresponda, conforme a la Ley N.º 453 de derechos de usuarios y consumidores.",
          "Puedes cancelar sin costo antes de que preparemos tu pedido. Los cortes a medida o pedidos especiales ya preparados no se pueden cancelar.",
        ],
      },
      {
        h: "6. Vaca Lola",
        p: [
          "Vaca Lola es una asistente virtual con inteligencia artificial. Sus respuestas son orientativas y pueden contener errores; los precios, el stock y las condiciones válidas son los que te confirmamos por WhatsApp.",
        ],
      },
      {
        h: "7. Uso del sitio",
        p: [
          "El contenido del sitio (textos, fotos, marca y diseño) pertenece a Don Corte Fino o se usa con autorización. No puedes copiarlo con fines comerciales sin permiso.",
        ],
      },
      {
        h: "8. Responsabilidad",
        p: [
          "Las recomendaciones de cocción y temperaturas son orientativas. La manipulación, conservación y cocción del producto después de la entrega son responsabilidad del cliente.",
        ],
      },
      {
        h: "9. Ley aplicable",
        p: [
          "Estos términos se rigen por las leyes del Estado Plurinacional de Bolivia. Cualquier controversia se someterá a los tribunales de Santa Cruz de la Sierra, sin perjuicio de tus derechos como consumidor.",
        ],
      },
    ],
  },
  en: {
    title: "Terms & conditions",
    intro:
      "These terms govern purchases on the website of Don Corte Fino, a butcher's shop in Santa Cruz de la Sierra, Bolivia. By sending an order you accept them.",
    sections: [
      {
        h: "1. How an order works",
        p: [
          "You build your basket on the site and send it to us on WhatsApp (or confirm it at checkout). An order is only confirmed once we reply on WhatsApp with the final total and the delivery or pickup date.",
          "We may decline or adjust an order because of stock, obvious pricing errors or addresses outside our area. If that happens, we'll tell you before you pay.",
        ],
      },
      {
        h: "2. Prices and weight",
        p: [
          "Prices are in bolivianos (Bs) and may change without notice; the price at the time we confirm your order applies.",
          "Meat is sold by weight. Totals on the site are estimates: every piece is weighed when we prepare it, so the final total may be slightly higher or lower. We confirm it before you pay.",
          "Photos and illustrations are for reference; marbling, shape and colour naturally vary from piece to piece.",
        ],
      },
      {
        h: "3. Payment",
        p: [
          "We accept the methods shown at checkout (for example QR or cash on delivery). QR payments are made once the final total is confirmed.",
          "Discount codes and promotions have their own conditions (minimum spend, validity, limited units) and can't be combined unless stated.",
        ],
      },
      {
        h: "4. Delivery and pickup",
        p: [
          "We deliver within Santa Cruz de la Sierra. Delivery is charged per kilometre from our store and confirmed on WhatsApp. Store pickup is free.",
          "We agree a day and time with you. If nobody is available to receive the order at that time, we'll arrange a new delivery, which may cost extra.",
          "We keep the cold chain until delivery. Once you receive your order, refrigerate (0–4 °C) or freeze it straight away.",
        ],
      },
      {
        h: "5. Changes, complaints and refunds",
        p: [
          "Because our products are perishable, we can't accept returns for change of mind once an order has been delivered.",
          "If something arrives spoiled, with a weight far from what we confirmed, or isn't what you ordered, message us on WhatsApp within 24 hours of delivery, with photos and before cooking it. We'll offer a replacement, credit or refund as appropriate, in line with Bolivia's consumer-rights law (Law No. 453).",
          "You can cancel free of charge before we start preparing your order. Custom cuts or special orders that have already been prepared can't be cancelled.",
        ],
      },
      {
        h: "6. Vaca Lola",
        p: ["Vaca Lola is an AI-powered virtual assistant. Her answers are for guidance and may contain mistakes; the prices, stock and conditions that apply are the ones we confirm on WhatsApp."],
      },
      {
        h: "7. Use of the site",
        p: ["The site's content (text, photos, brand and design) belongs to Don Corte Fino or is used with permission. Don't copy it for commercial purposes without our consent."],
      },
      {
        h: "8. Liability",
        p: ["Cooking advice and temperatures are guidance only. Handling, storing and cooking the product after delivery are the customer's responsibility."],
      },
      {
        h: "9. Governing law",
        p: ["These terms are governed by the laws of the Plurinational State of Bolivia. Any dispute will go to the courts of Santa Cruz de la Sierra, without prejudice to your rights as a consumer."],
      },
    ],
  },
};

export const LEGAL = { privacy, terms };
