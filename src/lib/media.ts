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
  "colita-de-cuadril": { main: P("ref/colita.webp", 1400, 927), alt: P("scenes/slicing.webp", 640, 1136) },
  marucha: { main: P("ref/marucha.webp", 1400, 927) },
  matambre: { main: P("ref/matambre.webp", 969, 1400) },
  pecho: { main: P("ref/pecho.webp", 1400, 888), alt: P("scenes/grill.webp", 1600, 2133) },
  yakiniku: { main: P("ref/laminado.webp", 1400, 927) },
  "shabu-shabu": { main: P("ref/laminado.webp", 1400, 927) },
  "carne-molida": { main: P("ref/molida.webp", 1400, 933) },
  "hamburguesas-x4": { main: P("ref/hamburguesas.webp", 933, 1400) },
  "hamburguesas-x6": { main: P("ref/hamburguesas.webp", 933, 1400) },
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
  vacuumCut: P("cuts/bife-angosto.webp", 1400, 1400),
  vacuum: P("scenes/vacuum-packs.webp", 1800, 1560),
  handCut: P("scenes/hero.webp", 2200, 1467),
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
  "parrillada-clasica": P("bundles/parrillada.webp", 1400, 1400),
  "noche-de-bifes": P("bundles/bifes.webp", 1400, 1400),
  "asado-de-amigos": P("bundles/asado.webp", 1600, 1280),
  "caja-inaugural": P("cuts/tomahawk.webp", 1000, 1108),
  "experiencia-degustacion": P("scenes/hero.webp", 2200, 1467),
};

/* ───────── Breeds: Wikimedia Commons photography, credited on screen as the licences require ───────── */

type Credited = Photo & { credit: string };
const C = (src: string, w: number, h: number, credit: string): Credited => ({ ...P(src, w, h), credit });

export const BREEDS = {
  wagyuTajima: C("breeds/wagyu-tajima.webp", 2400, 1600, "Japanexperterna.se · CC BY-SA 3.0"),
  wagyuFeedlot: C("breeds/wagyu-feedlot.webp", 2000, 1333, "Japanexperterna.se · CC BY-SA 3.0"),
  wagyuBulls: C("breeds/wagyu-bulls.webp", 2400, 1800, "Taekwondo18176 · CC BY-SA 3.0"),
  angusPortrait: C("breeds/angus-portrait.webp", 2400, 1800, "Harrison Keely · CC BY 4.0"),
  angusBull: C("breeds/angus-bull.webp", 2400, 1435, "Bill Kasman · CC BY-SA 2.0"),
  angusCowCalf: C("breeds/angus-cow-calf.webp", 2000, 1333, "Friedrich Böhringer · CC BY-SA 3.0 AT"),
  angusRedSoil: C("breeds/angus-red-soil.webp", 1800, 1350, "Quintin Soloviev · CC BY 4.0"),
};

/**
 * Hero carousel: Puerto Quijarro, on the Brazilian border of Santa Cruz (Wikimedia Commons, credited on
 * screen with a link to the file page as the licences require), then cattle living free on open pasture
 * (Pexels licence, free for commercial use).
 */
export const HERO_SLIDES: { src: string; breed: string; caption: { es: string; en: string }; credit?: string; href?: string }[] = [
  {
    src: "/media/quijarro/canal-tamengo.webp",
    breed: "Puerto Quijarro",
    caption: { es: "Canal Tamengo: agua, monte y la frontera con Brasil", en: "Tamengo Canal: water, forest and the border with Brazil" },
    credit: "Alceu Mauro Denes · CC BY 3.0",
    href: "https://commons.wikimedia.org/wiki/File:Canal_do_Tamego_-_panoramio.jpg",
  },
  {
    src: "/media/quijarro/carretera-chiquitana.webp",
    breed: "Camino a Brasil",
    caption: { es: "Monte chiquitano en la ruta Santa Cruz – Puerto Quijarro", en: "Chiquitano forest on the Santa Cruz – Puerto Quijarro road" },
    credit: "LidZeppelen · CC BY-SA 3.0",
    href: "https://commons.wikimedia.org/wiki/File:Carretera_Santa_Cruz-Puerto_Quijarro.JPG",
  },
  { src: "/media/pasture/pasture-2.webp", breed: "Ganado negro", caption: { es: "Sangre Angus en libertad, sobre la loma", en: "Angus blood roaming free over the hills" } },
  { src: "/media/pasture/pasture-1.webp", breed: "Pastura abierta", caption: { es: "Atardecer en el campo — crianza sin prisa", en: "Sunset in the field — raised without hurry" } },
  { src: "/media/pasture/pasture-3.webp", breed: "Amanecer", caption: { es: "Niebla, pasto y calma: así empieza el marmoleo", en: "Mist, grass and calm: where marbling begins" } },
  { src: "/media/pasture/pasture-4.webp", breed: "Campo abierto", caption: { es: "Espacio para moverse, agua y sombra", en: "Room to roam, water and shade" } },
  { src: "/media/pasture/pasture-5.webp", breed: "Cielo grande", caption: { es: "Bajo el cielo del oriente, rumbo a tu parrilla", en: "Under a big eastern sky, on the way to your grill" } },
];

/** Origin chapters: genetics, feedlot finishing, the land. */
export const ORIGIN_PHOTOS = {
  genetics: BREEDS.angusCowCalf,
  feedlot: BREEDS.wagyuFeedlot,
  land: BREEDS.angusRedSoil,
};
