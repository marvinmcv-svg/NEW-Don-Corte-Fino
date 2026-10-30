/** Real photography from the owner's Drive folder, mapped to products and sections. */

type Photo = { src: string; w: number; h: number };
const P = (src: string, w: number, h: number): Photo => ({ src: `/media/${src}`, w, h });

/** Main product photo, plus an optional second shot shown on hover / in the gallery. */
export const PRODUCT_PHOTOS: Record<string, { main: Photo; alt?: Photo }> = {
  "ojo-de-bife": { main: P("cuts/ojo-de-bife.webp", 1100, 828), alt: P("cuts/ribeye-plate.webp", 1400, 1400) },
  tomahawk: { main: P("cuts/tomahawk.webp", 1000, 1108), alt: P("cuts/tomahawk-tall.webp", 1184, 1775) },
  "bife-ancho": { main: P("cuts/bife-ancho.webp", 1400, 986), alt: P("cuts/ribeye-plate.webp", 1400, 1400) },
  "bife-angosto": { main: P("cuts/bife-angosto.webp", 1400, 1400) },
  "t-bone": { main: P("cuts/t-bone.webp", 1400, 1400) },
  lomo: { main: P("cuts/lomo.webp", 1400, 933), alt: P("scenes/selection.webp", 384, 684) },
  picana: { main: P("cuts/picana.webp", 1400, 1400) },
  entrana: { main: P("cuts/entrana.webp", 1400, 1400) },
  vacio: { main: P("cuts/vacio.webp", 1000, 1000) },
  "tira-de-asado": { main: P("cuts/tira-de-asado.webp", 1400, 933) },
  denver: { main: P("ig/filete-de-aguja.webp", 376, 366) },
  "colita-de-cuadril": { main: P("scenes/slicing.webp", 640, 1136) },
  pecho: { main: P("scenes/grill.webp", 1600, 2133) },
  yakiniku: { main: P("scenes/marbling.webp", 640, 1136) },
  "shabu-shabu": { main: P("scenes/marbling.webp", 640, 1136) },
};

/** A photo uploaded in the admin portal wins over the bundled one. */
export const productPhoto = (p: { slug: string; image_url?: string | null }) =>
  p.image_url ? { main: { src: p.image_url, w: 1400, h: 1400 }, alt: PRODUCT_PHOTOS[p.slug]?.main } : PRODUCT_PHOTOS[p.slug];

export const SCENES = {
  hero: P("scenes/hero.webp", 2200, 1467),
  heroGL: "/media/scenes/hero-gl.webp",
  aging: P("scenes/aging.webp", 1600, 1600),
  butcher: P("scenes/butcher.webp", 1800, 982),
  selection: P("scenes/selection.webp", 384, 684),
  grill: P("scenes/grill.webp", 1600, 2133),
  seared: P("scenes/seared.webp", 1200, 900),
  marbling: P("scenes/marbling.webp", 640, 1136),
  slicing: P("scenes/slicing.webp", 640, 1136),
  tomahawkTall: P("cuts/tomahawk-tall.webp", 1184, 1775),
  ribeyePlate: P("cuts/ribeye-plate.webp", 1400, 1400),
};

/** Instagram posts, in the order shown on the social strip. */
export const IG_POSTS: Photo[] = [
  P("ig/amor-de-mama.webp", 900, 1125),
  P("ig/marmolado-perfecto.webp", 900, 1125),
  P("ig/suave-inolvidable.webp", 900, 1125),
  P("ig/no-todos-los-churrascos.webp", 900, 1125),
  P("ig/post-hero.webp", 828, 1032),
  P("ig/rebanando-jugoso.webp", 640, 1136),
  P("ig/filete-de-aguja.webp", 376, 366),
  P("ig/marmoleo-textura.webp", 640, 1136),
];

/** Photos used for the "suggested dishes" cards on cut pages. */
export const DISH_PHOTOS: Photo[] = [SCENES.seared, SCENES.slicing, SCENES.grill];

export const BOX_PHOTOS: Record<string, Photo> = {
  "caja-inaugural": P("ig/amor-de-mama.webp", 900, 1125),
  "experiencia-degustacion": P("scenes/hero.webp", 2200, 1467),
};
