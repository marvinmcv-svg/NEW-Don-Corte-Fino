import type { L10n } from "./catalog";

export type PrimalKey =
  | "chuck"
  | "rib"
  | "loin"
  | "tenderloin"
  | "rump"
  | "brisket"
  | "plate"
  | "flank";

export const PRIMALS: Record<PrimalKey, L10n> = {
  chuck: { es: "Aguja", en: "Chuck" },
  rib: { es: "Costillar", en: "Rib" },
  loin: { es: "Lomo alto", en: "Short loin" },
  tenderloin: { es: "Lomo fino", en: "Tenderloin" },
  rump: { es: "Cuadril", en: "Rump" },
  brisket: { es: "Pecho", en: "Brisket" },
  plate: { es: "Falda y costilla", en: "Plate & short rib" },
  flank: { es: "Vacío", en: "Flank" },
};

export type Method = "grill" | "pan" | "oven" | "sousvide" | "smoker";

export const METHODS: Record<Method, L10n> = {
  grill: { es: "Parrilla", en: "Grill" },
  pan: { es: "Sartén", en: "Pan" },
  oven: { es: "Horno", en: "Oven" },
  sousvide: { es: "Sous-vide", en: "Sous-vide" },
  smoker: { es: "Ahumador", en: "Smoker" },
};

/** Visual used by <CutArt>; picks the illustrated shape. */
export type ArtShape =
  | "steak"
  | "bone"
  | "tbone"
  | "roast"
  | "strip"
  | "ribs"
  | "sliced"
  | "ground"
  | "burger"
  | "jar";

export type CutInfo = {
  primal: PrimalKey | null;
  shape: ArtShape;
  story: L10n;
  /** Tenderness, marbling, flavour, juiciness, out of 5. */
  meters: [number, number, number, number];
  traits: L10n[];
  methods: Method[];
  thickness: L10n;
  rest: number;
  dishes: L10n[];
  wine: string;
  sides: L10n;
  sauces: L10n;
};

const W = (es: string, en: string): L10n => ({ es, en });

export const CUTS: Record<string, CutInfo> = {
  ribeye: {
    primal: "rib",
    shape: "steak",
    story: W(
      "El corte insignia. Viene del centro del costillar, un músculo que trabaja poco, con el 'spinalis' — la tapa — que es el bocado más codiciado de toda la res. Con Wagyu × Angus la grasa se funde y lo baña desde adentro.",
      "The flagship. It comes from the centre of the rib, a muscle that does little work, crowned by the spinalis cap — the most prized bite on the whole animal. With Wagyu × Angus the fat melts and bastes it from within.",
    ),
    meters: [4, 5, 5, 5],
    traits: [W("Tapa de spinalis", "Spinalis cap"), W("Marmoleo intenso", "Rich marbling"), W("Sabor profundo", "Deep flavour")],
    methods: ["grill", "pan", "sousvide"],
    thickness: W("3–4 cm", "3–4 cm"),
    rest: 6,
    dishes: [W("Bife a la parrilla con sal en escamas", "Grilled steak with flaky salt"), W("Steak frites", "Steak frites"), W("Tataki de ojo de bife", "Ribeye tataki")],
    wine: "Malbec · Tannat · Cabernet",
    sides: W("Papas rústicas, ensalada de rúcula", "Rustic potatoes, rocket salad"),
    sauces: W("Chimichurri, manteca de hierbas", "Chimichurri, herb butter"),
  },
  tomahawk: {
    primal: "rib",
    shape: "bone",
    story: W(
      "Un ojo de bife con el hueso de la costilla entero, limpio y a la vista. Es un corte para compartir y para impresionar: el hueso protege la carne y suma sabor durante una cocción larga.",
      "A ribeye with the whole rib bone left on, cleaned and exposed. A cut to share and to impress: the bone shields the meat and adds flavour during a longer cook.",
    ),
    meters: [4, 5, 5, 5],
    traits: [W("Para 2–3 personas", "Serves 2–3"), W("Hueso de 25 cm", "25 cm bone"), W("Presentación de impacto", "Show-stopper")],
    methods: ["grill", "oven", "smoker"],
    thickness: W("5–6 cm", "5–6 cm"),
    rest: 12,
    dishes: [W("Sellado inverso a la parrilla", "Reverse-seared on the grill"), W("Tomahawk al rescoldo", "Ember-roasted tomahawk")],
    wine: "Cabernet Sauvignon · Syrah",
    sides: W("Choclo asado, papas al rescoldo", "Grilled corn, ember potatoes"),
    sauces: W("Salsa criolla, chimichurri", "Salsa criolla, chimichurri"),
  },
  "bone-in-ribeye": {
    primal: "rib",
    shape: "bone",
    story: W(
      "El bife ancho con hueso: la misma riqueza del costillar con el hueso corto, que suma jugosidad y un sabor más intenso cerca del hueso.",
      "Bone-in ribeye: all the richness of the rib with a short bone that keeps it juicy and deepens the flavour close to the bone.",
    ),
    meters: [4, 5, 5, 5],
    traits: [W("Con hueso", "Bone-in"), W("Muy jugoso", "Very juicy"), W("Clásico parrillero", "Grill classic")],
    methods: ["grill", "pan", "oven"],
    thickness: W("3–4 cm", "3–4 cm"),
    rest: 8,
    dishes: [W("Bife ancho a la leña", "Wood-fired rib steak"), W("Costillar a la sartén con manteca", "Butter-basted pan steak")],
    wine: "Malbec · Tannat",
    sides: W("Puré rústico, verduras asadas", "Rustic mash, roast vegetables"),
    sauces: W("Chimichurri, pimienta verde", "Chimichurri, green peppercorn"),
  },
  striploin: {
    primal: "loin",
    shape: "steak",
    story: W(
      "El bife angosto (striploin / New York) tiene una textura más firme y una franja de grasa en el borde que se dora y cruje. Sabor a carne limpio y definido.",
      "Striploin (New York strip) has a firmer bite and a fat edge that browns and crisps. Clean, well-defined beef flavour.",
    ),
    meters: [4, 4, 4, 4],
    traits: [W("Borde de grasa crocante", "Crisp fat edge"), W("Textura firme", "Firm texture"), W("Fácil de porcionar", "Easy to portion")],
    methods: ["grill", "pan", "sousvide"],
    thickness: W("3 cm", "3 cm"),
    rest: 5,
    dishes: [W("New York a la sartén", "Pan-seared New York"), W("Steak con hongos", "Steak with mushrooms")],
    wine: "Malbec · Merlot",
    sides: W("Espárragos, papas fritas", "Asparagus, fries"),
    sauces: W("Salsa de pimienta, chimichurri", "Peppercorn sauce, chimichurri"),
  },
  "t-bone": {
    primal: "loin",
    shape: "tbone",
    story: W(
      "Dos cortes en uno, separados por el hueso en forma de T: de un lado el bife angosto, del otro un medallón de lomo. Lo mejor de los dos mundos.",
      "Two cuts in one, split by the T-shaped bone: striploin on one side and a piece of tenderloin on the other. The best of both worlds.",
    ),
    meters: [4, 4, 5, 4],
    traits: [W("Lomo + bife angosto", "Tenderloin + strip"), W("Hueso en T", "T-shaped bone"), W("Ideal para parrilla", "Made for the grill")],
    methods: ["grill", "pan"],
    thickness: W("3–4 cm", "3–4 cm"),
    rest: 7,
    dishes: [W("T-bone a la florentina", "Florentine T-bone"), W("T-bone a la parrilla", "Grilled T-bone")],
    wine: "Chianti · Malbec",
    sides: W("Porotos blancos, rúcula y parmesano", "White beans, rocket and parmesan"),
    sauces: W("Aceite de oliva y romero", "Olive oil and rosemary"),
  },
  tenderloin: {
    primal: "tenderloin",
    shape: "roast",
    story: W(
      "El lomo es el músculo que menos trabaja: el corte más tierno de la res. Con Wagyu gana un marmoleo fino que le da la jugosidad que normalmente le falta.",
      "The tenderloin barely works, which makes it the most tender cut on the animal. Wagyu adds fine marbling and the juiciness it usually lacks.",
    ),
    meters: [5, 3, 3, 4],
    traits: [W("El más tierno", "Most tender"), W("Medallones parejos", "Even medallions"), W("Sabor delicado", "Delicate flavour")],
    methods: ["pan", "oven", "sousvide", "grill"],
    thickness: W("4–5 cm (medallón)", "4–5 cm (medallion)"),
    rest: 5,
    dishes: [W("Filet mignon con manteca de trufa", "Filet mignon with truffle butter"), W("Carpaccio", "Carpaccio"), W("Lomo Wellington", "Beef Wellington")],
    wine: "Pinot Noir · Merlot",
    sides: W("Puré de papa, espárragos", "Mash, asparagus"),
    sauces: W("Reducción de vino tinto, bearnesa", "Red wine reduction, béarnaise"),
  },
  picanha: {
    primal: "rump",
    shape: "roast",
    story: W(
      "La reina de la parrilla cruceña. Una pieza triangular con una tapa de grasa gruesa que se derrite sobre la carne mientras se asa. Con Wagyu, la tapa es pura manteca.",
      "The queen of the Santa Cruz grill. A triangular cut with a thick fat cap that melts over the meat as it cooks. With Wagyu, that cap is pure butter.",
    ),
    meters: [4, 4, 5, 5],
    traits: [W("Tapa de grasa", "Fat cap"), W("Favorita en Santa Cruz", "A Santa Cruz favourite"), W("Entera o en bifes", "Whole or in steaks")],
    methods: ["grill", "oven", "smoker"],
    thickness: W("Entera, o bifes de 3 cm", "Whole, or 3 cm steaks"),
    rest: 10,
    dishes: [W("Picaña en espada (estilo brasileño)", "Skewered picanha (Brazilian style)"), W("Picaña entera a la parrilla", "Whole grilled picanha")],
    wine: "Tannat · Malbec",
    sides: W("Farofa, arroz, vinagreta", "Farofa, rice, vinaigrette"),
    sauces: W("Salsa criolla, chimichurri", "Salsa criolla, chimichurri"),
  },
  "tri-tip": {
    primal: "rump",
    shape: "roast",
    story: W(
      "La colita de cuadril es una pieza magra y sabrosa, con buen marmoleo en Wagyu. Se cocina entera y se corta contra la fibra en láminas finas.",
      "Tri-tip is lean and flavourful, with good marbling in Wagyu. Cook it whole and slice it thin against the grain.",
    ),
    meters: [3, 3, 4, 4],
    traits: [W("Gran relación precio/sabor", "Great value"), W("Pieza entera", "Whole roast"), W("Versátil", "Versatile")],
    methods: ["grill", "oven", "smoker", "sousvide"],
    thickness: W("Entera", "Whole"),
    rest: 10,
    dishes: [W("Colita ahumada", "Smoked tri-tip"), W("Sándwich de colita", "Tri-tip sandwich")],
    wine: "Zinfandel · Malbec",
    sides: W("Ensalada de papa, pan rústico", "Potato salad, rustic bread"),
    sauces: W("Barbacoa, chimichurri", "BBQ, chimichurri"),
  },
  denver: {
    primal: "chuck",
    shape: "steak",
    story: W(
      "Un corte escondido en la aguja, descubierto por los carniceros modernos. Muy marmoleado, tierno y con mucho sabor, a un precio amable.",
      "A hidden cut from the chuck, found by modern butchers. Heavily marbled, tender and full of flavour at a friendly price.",
    ),
    meters: [4, 4, 4, 4],
    traits: [W("Wagyu accesible", "Accessible Wagyu"), W("Muy marmoleado", "Well marbled"), W("Cocción rápida", "Cooks fast")],
    methods: ["grill", "pan"],
    thickness: W("2–3 cm", "2–3 cm"),
    rest: 4,
    dishes: [W("Denver a la plancha", "Griddled Denver steak"), W("Tacos de Denver", "Denver steak tacos")],
    wine: "Garnacha · Malbec",
    sides: W("Tortillas, pico de gallo", "Tortillas, pico de gallo"),
    sauces: W("Salsa verde, chimichurri", "Salsa verde, chimichurri"),
  },
  "flat-iron": {
    primal: "chuck",
    shape: "strip",
    story: W(
      "La marucha (flat iron) sale de la paleta. Una vez retirado el nervio central queda uno de los cortes más tiernos de la res, con mucho sabor.",
      "Flat iron comes from the shoulder blade. Once the centre sinew is removed it is one of the most tender cuts on the animal, and full of flavour.",
    ),
    meters: [4, 4, 4, 4],
    traits: [W("Muy tierno", "Very tender"), W("Sabor intenso", "Intense flavour"), W("Precio amable", "Friendly price")],
    methods: ["grill", "pan"],
    thickness: W("2–3 cm", "2–3 cm"),
    rest: 4,
    dishes: [W("Marucha a la parrilla", "Grilled flat iron"), W("Ensalada tibia de carne", "Warm steak salad")],
    wine: "Malbec · Bonarda",
    sides: W("Ensalada verde, yuca frita", "Green salad, fried cassava"),
    sauces: W("Chimichurri", "Chimichurri"),
  },
  skirt: {
    primal: "plate",
    shape: "strip",
    story: W(
      "La entraña es el diafragma: fibra larga, abierta y jugosa, con un sabor a carne muy marcado. Se cocina rápido a fuego fuerte.",
      "Skirt is the diaphragm: long, open grain, very juicy and with a bold beefy taste. Cook it fast over high heat.",
    ),
    meters: [3, 4, 5, 5],
    traits: [W("Sabor intenso", "Bold flavour"), W("Fuego fuerte", "High heat"), W("Para churrasco", "For churrasco")],
    methods: ["grill", "pan"],
    thickness: W("1.5–2 cm", "1.5–2 cm"),
    rest: 3,
    dishes: [W("Entraña al carbón", "Charcoal-grilled skirt"), W("Fajitas", "Fajitas")],
    wine: "Malbec · Carménère",
    sides: W("Yuca, ensalada criolla", "Cassava, criolla salad"),
    sauces: W("Chimichurri, llajua", "Chimichurri, llajua"),
  },
  flank: {
    primal: "flank",
    shape: "strip",
    story: W(
      "El vacío es una pieza plana con una capa de grasa que lo vuelve muy jugoso a la parrilla. Un clásico del churrasco del fin de semana.",
      "Flank is a flat cut with a fat layer that keeps it juicy on the grill. A weekend churrasco classic.",
    ),
    meters: [3, 3, 4, 4],
    traits: [W("Clásico de churrasco", "Churrasco classic"), W("Jugoso", "Juicy"), W("Rinde mucho", "Feeds a crowd")],
    methods: ["grill", "oven"],
    thickness: W("Pieza entera", "Whole piece"),
    rest: 8,
    dishes: [W("Vacío a la parrilla", "Grilled flank"), W("Vacío relleno", "Stuffed flank")],
    wine: "Malbec · Tannat",
    sides: W("Papas, ensalada mixta", "Potatoes, mixed salad"),
    sauces: W("Chimichurri, salsa criolla", "Chimichurri, salsa criolla"),
  },
  matambre: {
    primal: "plate",
    shape: "strip",
    story: W(
      "Una lámina fina entre el cuero y la costilla. A la parrilla queda tierno y crocante; enrollado y relleno es un plato de fiesta.",
      "A thin sheet between the hide and the ribs. Grilled it turns tender and crisp; rolled and stuffed it becomes a party dish.",
    ),
    meters: [3, 3, 4, 3],
    traits: [W("Muy versátil", "Very versatile"), W("Crocante", "Crispy"), W("Para enrollar", "For rolling")],
    methods: ["grill", "oven"],
    thickness: W("Lámina entera", "Whole sheet"),
    rest: 5,
    dishes: [W("Matambre a la pizza", "Pizza-style matambre"), W("Matambre arrollado", "Rolled matambre")],
    wine: "Bonarda · Malbec",
    sides: W("Ensalada rusa, pan", "Potato salad, bread"),
    sauces: W("Salsa de tomate y orégano", "Tomato and oregano sauce"),
  },
  "short-ribs": {
    primal: "plate",
    shape: "ribs",
    story: W(
      "La tira de asado: costilla con carne entreverada de grasa. En corte banderita va directo a la parrilla; en pieza, pide cocción lenta.",
      "Short ribs: bone-in meat laced with fat. Cross-cut it goes straight on the grill; as a slab it wants a long, slow cook.",
    ),
    meters: [3, 5, 5, 5],
    traits: [W("Con hueso", "Bone-in"), W("Grasa entreverada", "Fat-laced"), W("Parrilla o lento", "Grill or braise")],
    methods: ["grill", "oven", "smoker", "sousvide"],
    thickness: W("Banderita 1.5 cm / pieza", "Flanken 1.5 cm / slab"),
    rest: 10,
    dishes: [W("Tira de asado a la parrilla", "Grilled short ribs"), W("Galbi coreano", "Korean galbi"), W("Costilla braseada", "Braised short ribs")],
    wine: "Syrah · Tannat",
    sides: W("Arroz, kimchi, puré", "Rice, kimchi, mash"),
    sauces: W("Marinada de soya y ajo", "Soy and garlic marinade"),
  },
  brisket: {
    primal: "brisket",
    shape: "roast",
    story: W(
      "El pecho es el corte del ahumado lento. Tiene dos partes: el flat, más magro, y el point, más graso. Horas de humo lo vuelven tierno como manteca.",
      "Brisket is the slow-smoke cut. It has two parts: the leaner flat and the fattier point. Hours of smoke make it butter-tender.",
    ),
    meters: [2, 4, 5, 4],
    traits: [W("Ahumado lento", "Low & slow"), W("Flat y point", "Flat and point"), W("Para grupos", "For a crowd")],
    methods: ["smoker", "oven", "sousvide"],
    thickness: W("Pieza de 2 kg o más", "2 kg piece or more"),
    rest: 60,
    dishes: [W("Brisket texano", "Texas brisket"), W("Sándwich de brisket", "Brisket sandwich"), W("Pastrami casero", "Homemade pastrami")],
    wine: "Zinfandel · Syrah",
    sides: W("Coleslaw, pan brioche, pickles", "Coleslaw, brioche, pickles"),
    sauces: W("Barbacoa", "BBQ sauce"),
  },
  sliced: {
    primal: "chuck",
    shape: "sliced",
    story: W(
      "Láminas finas de Wagyu cortadas a máquina. Son ideales para yakiniku (a la plancha, unos segundos por lado) o shabu-shabu (en caldo caliente).",
      "Thin machine-cut Wagyu slices. Perfect for yakiniku (a few seconds per side on a hot plate) or shabu-shabu (swished in hot broth).",
    ),
    meters: [5, 4, 4, 4],
    traits: [W("Listo para cocinar", "Ready to cook"), W("Segundos de cocción", "Cooks in seconds"), W("Estilo japonés", "Japanese style")],
    methods: ["grill", "pan"],
    thickness: W("1.5 mm o 3 mm", "1.5 mm or 3 mm"),
    rest: 0,
    dishes: [W("Yakiniku", "Yakiniku"), W("Shabu-shabu", "Shabu-shabu"), W("Gyudon", "Gyudon")],
    wine: "Pinot Noir · sake",
    sides: W("Arroz japonés, verduras", "Japanese rice, vegetables"),
    sauces: W("Ponzu, salsa de sésamo", "Ponzu, sesame sauce"),
  },
  ground: {
    primal: "chuck",
    shape: "ground",
    story: W(
      "Carne molida de Wagyu × Angus con la proporción justa de grasa. Hamburguesas, albóndigas o salsas con otro nivel de jugosidad.",
      "Wagyu × Angus mince with just the right fat ratio. Burgers, meatballs and sauces on another level of juiciness.",
    ),
    meters: [3, 4, 4, 5],
    traits: [W("Grasa justa", "Right fat ratio"), W("Para hamburguesas", "For burgers"), W("Muy jugosa", "Very juicy")],
    methods: ["grill", "pan", "oven"],
    thickness: W("—", "—"),
    rest: 0,
    dishes: [W("Smash burger", "Smash burger"), W("Albóndigas", "Meatballs"), W("Ragú", "Ragù")],
    wine: "Merlot · Sangiovese",
    sides: W("Papas fritas, ensalada", "Fries, salad"),
    sauces: W("Cheddar, salsa de la casa", "Cheddar, house sauce"),
  },
  burger: {
    primal: "chuck",
    shape: "burger",
    story: W(
      "Medallones de 180 g formados a mano con Wagyu × Angus. Sellados fuerte por fuera, jugosos por dentro.",
      "Hand-formed 180 g Wagyu × Angus patties. Hard-seared outside, juicy inside.",
    ),
    meters: [4, 4, 4, 5],
    traits: [W("180 g cada uno", "180 g each"), W("Formadas a mano", "Hand-formed"), W("Listas para la plancha", "Ready to griddle")],
    methods: ["grill", "pan"],
    thickness: W("—", "—"),
    rest: 2,
    dishes: [W("Hamburguesa clásica", "Classic burger")],
    wine: "Merlot",
    sides: W("Papas fritas", "Fries"),
    sauces: W("Cheddar, cebolla caramelizada", "Cheddar, caramelised onion"),
  },
};

export const PRIMAL_ORDER: PrimalKey[] = ["chuck", "rib", "loin", "tenderloin", "rump", "brisket", "plate", "flank"];

export function shapeFor(p: { cut: string | null; sale_type: string }): ArtShape {
  if (p.sale_type === "addon") return "jar";
  return (p.cut && CUTS[p.cut]?.shape) || "steak";
}
