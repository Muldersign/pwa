import type { GroceryCategory } from '../domain/types';

export interface GroceryCategoryInfo {
  id: GroceryCategory;
  label: string;
  /** Order in which aisles are shown on the shopping list. */
  order: number;
}

export const GROCERY_CATEGORIES: GroceryCategoryInfo[] = [
  { id: 'produce', label: 'Groente & fruit', order: 1 },
  { id: 'meat', label: 'Vlees & vis', order: 2 },
  { id: 'dairy', label: 'Zuivel', order: 3 },
  { id: 'bakery', label: 'Brood & bakkerij', order: 4 },
  { id: 'spreads', label: 'Beleg', order: 5 },
  { id: 'pantry', label: 'Pasta, rijst & wereldkeuken', order: 6 },
  { id: 'sauces', label: 'Sauzen & kruiden', order: 7 },
  { id: 'frozen', label: 'Diepvries', order: 8 },
  { id: 'snacks', label: 'Snacks', order: 9 },
  { id: 'drinks', label: 'Drinken', order: 10 },
  { id: 'household', label: 'Huishouden', order: 11 },
  { id: 'care', label: 'Verzorging', order: 12 },
  { id: 'other', label: 'Overig', order: 13 },
];

export const GROCERY_CATEGORY_MAP = Object.fromEntries(GROCERY_CATEGORIES.map((c) => [c.id, c])) as Record<
  GroceryCategory,
  GroceryCategoryInfo
>;

/**
 * Keyword dictionary. Keys are matched against the product name: a full-word
 * match wins over a substring match, and longer keywords win over shorter ones
 * (so "pindakaas" is Beleg, not Zuivel because of "kaas").
 */
const DICTIONARY: Record<GroceryCategory, string[]> = {
  produce: [
    'appel', 'appels', 'peer', 'peren', 'banaan', 'bananen', 'sinaasappel', 'mandarijn', 'citroen', 'limoen',
    'druiven', 'aardbei', 'aardbeien', 'blauwe bes', 'blauwe bessen', 'framboos', 'frambozen', 'kiwi', 'mango', 'ananas',
    'meloen', 'avocado', 'tomaat', 'tomaten', 'cherrytomaat', 'cherrytomaatjes', 'komkommer', 'paprika', 'paprika\'s',
    'ui', 'uien', 'rode ui', 'knoflook', 'sla', 'ijsbergsla', 'rucola', 'spinazie', 'andijvie', 'broccoli',
    'bloemkool', 'courgette', 'aubergine', 'wortel', 'wortels', 'worteltjes', 'peen', 'aardappel', 'aardappelen',
    'aardappels', 'krieltjes', 'zoete aardappel', 'champignon', 'champignons', 'paddenstoelen', 'prei', 'selderij',
    'bleekselderij', 'boontjes', 'sperziebonen', 'snijbonen', 'erwten', 'doperwten', 'mais', 'maïs', 'gember', 'peterselie',
    'basilicum', 'koriander', 'bieslook', 'munt', 'lente-ui', 'bosui', 'radijs', 'groente', 'groenten', 'fruit',
    'salade', 'pompoen', 'zuurkool', 'boerenkool', 'rode kool', 'witlof', 'pastinaak', 'venkel', 'asperges', 'taugé',
    'peper', 'rode peper', 'pepers', 'jalapeño',
  ],
  meat: [
    'kip', 'kipfilet', 'kippendijen', 'kippendij', 'kippenpoten', 'gehakt', 'rundergehakt', 'half-om-half', 'biefstuk',
    'steak', 'varkenshaas', 'speklapjes', 'spek', 'spekjes', 'ontbijtspek', 'bacon', 'worst', 'worstjes', 'rookworst',
    'braadworst', 'hamburger', 'hamburgers', 'shoarma', 'gyros', 'schnitzel', 'karbonade', 'ribs', 'spareribs',
    'vlees', 'vis', 'zalm', 'zalmfilet', 'tonijn', 'kabeljauw', 'pangasius', 'garnalen', 'scampi', 'mosselen',
    'kibbeling', 'lekkerbekje', 'haring', 'makreel', 'gerookte zalm', 'shoarmavlees', 'kipgehakt', 'rosbief', 'lamsvlees',
    'kalkoen', 'saté', 'kipsaté', 'tofu', 'tempeh', 'vegaburger', 'vegetarische burger',
  ],
  dairy: [
    'melk', 'halfvolle melk', 'volle melk', 'karnemelk', 'chocolademelk', 'yoghurt', 'griekse yoghurt', 'kwark', 'vla',
    'room', 'slagroom', 'kookroom', 'crème fraîche', 'creme fraiche', 'zure room', 'boter', 'roomboter', 'margarine',
    'kaas', 'geraspte kaas', 'jonge kaas', 'belegen kaas', 'oude kaas', 'mozzarella', 'parmezaan', 'feta', 'brie',
    'camembert', 'geitenkaas', 'roomkaas', 'cottage cheese', 'mascarpone', 'ricotta', 'ei', 'eieren', 'eitjes',
    'havermelk', 'sojamelk', 'amandelmelk', 'skyr', 'toetje', 'pudding', 'zuivel',
  ],
  bakery: [
    'brood', 'volkorenbrood', 'bruin brood', 'wit brood', 'stokbrood', 'afbakbrood', 'afbakbroodjes', 'broodjes', 'bolletjes',
    'pistolets', 'croissant', 'croissants', 'krentenbollen', 'beschuit', 'crackers', 'knäckebröd', 'wraps', 'wrap',
    'tortilla', 'tortillas', 'pita', 'pitabroodjes', 'naan', 'bagels', 'bagel', 'ontbijtkoek', 'taart', 'gebak',
    'cake', 'muffins', 'tosti brood', 'focaccia', 'ciabatta', 'pizzabodem', 'pizzabodems', 'bladerdeeg', 'pannenkoeken',
  ],
  spreads: [
    'pindakaas', 'hagelslag', 'jam', 'nutella', 'chocopasta', 'appelstroop', 'honing', 'ham', 'kipfilet beleg',
    'salami', 'cervelaat', 'leverworst', 'smeerkaas', 'hummus', 'zalmsalade', 'eiersalade', 'filet americain',
    'vlokken', 'muisjes', 'speculoospasta', 'beleg', 'kaasplakken', 'plakken kaas', 'rookvlees', 'pastrami',
  ],
  pantry: [
    'pasta', 'spaghetti', 'penne', 'fusilli', 'macaroni', 'tagliatelle', 'lasagnebladen', 'lasagne', 'tortellini',
    'ravioli', 'gnocchi', 'noedels', 'mie', 'rijstnoedels', 'rijst', 'basmatirijst', 'zilvervliesrijst', 'risottorijst',
    'couscous', 'bulgur', 'quinoa', 'nasi', 'bami', 'nasi-kruiden', 'bamigroente', 'nasigroente', 'kokosmelk',
    'bonen', 'kidneybonen', 'kikkererwten', 'linzen', 'tomatenblokjes', 'gepelde tomaten', 'passata', 'tomatenpuree',
    'bouillon', 'bouillonblokjes', 'soep', 'meel', 'bloem', 'suiker', 'havermout', 'muesli', 'cornflakes', 'granola',
    'ontbijtgranen', 'taco', 'tacos', 'taco shells', 'kroepoek', 'wokgroente', 'conserven', 'blik', 'paneermeel',
    'pannenkoekenmix', 'bakpoeder', 'gist', 'olijven',
  ],
  sauces: [
    'pesto', 'ketchup', 'mayonaise', 'mayo', 'mosterd', 'sambal', 'ketjap', 'sojasaus', 'satésaus', 'pindasaus',
    'currysaus', 'curry', 'currypasta', 'tomatensaus', 'pastasaus', 'salsa', 'dressing', 'olijfolie', 'olie',
    'zonnebloemolie', 'azijn', 'balsamico', 'zout', 'peper en zout', 'kruiden', 'kruidenmix', 'paprikapoeder', 'kerrie',
    'kaneel', 'oregano', 'tijm', 'rozemarijn', 'taco kruiden', 'fajita kruiden', 'sriracha', 'barbecuesaus', 'bbq saus',
    'chilisaus', 'knoflooksaus', 'aioli', 'jus', 'saus', 'sauzen', 'wokkesaus', 'oestersaus', 'vissaus', 'tahin',
  ],
  frozen: [
    'diepvries', 'diepvriespizza', 'pizza', 'ijs', 'ijsjes', 'roomijs', 'patat', 'friet', 'frites', 'kroketten',
    'frikandellen', 'bitterballen', 'diepvriesgroente', 'spinazie diepvries', 'vissticks', 'loempia', 'loempia\'s',
    'ijsblokjes', 'bevroren fruit', 'diepvriesfruit',
  ],
  snacks: [
    'chips', 'nootjes', 'noten', 'pinda\'s', 'pinda', 'cashewnoten', 'borrelnootjes', 'popcorn', 'koek', 'koekjes',
    'chocola', 'chocolade', 'reep', 'snoep', 'drop', 'winegums', 'stroopwafels', 'biscuit', 'biscuitjes', 'mueslirepen',
    'repen', 'tortillachips', 'nachos', 'crackers snack', 'zoutjes', 'paprikachips', 'dipsaus', 'snack', 'snacks',
  ],
  drinks: [
    'cola', 'cola zero', 'pepsi', 'fanta', 'sprite', '7up', 'ice tea', 'icetea', 'sap', 'jus d\'orange', 'appelsap',
    'sinaasappelsap', 'limonade', 'siroop', 'ranja', 'water', 'spa', 'bruiswater', 'mineraalwater', 'koffie',
    'koffiebonen', 'koffiepads', 'cups', 'thee', 'bier', 'speciaalbier', 'wijn', 'rode wijn', 'witte wijn', 'rosé',
    'prosecco', 'champagne', 'tonic', 'energydrink', 'red bull', 'smoothie', 'frisdrank', 'drinken',
  ],
  household: [
    'afwasmiddel', 'vaatwastabletten', 'vaatwasblokjes', 'wasmiddel', 'wasverzachter', 'wc-papier', 'toiletpapier',
    'keukenpapier', 'keukenrol', 'vuilniszakken', 'afvalzakken', 'aluminiumfolie', 'folie', 'huishoudfolie',
    'bakpapier', 'boterhamzakjes', 'diepvrieszakjes', 'allesreiniger', 'schoonmaakmiddel', 'bleek', 'glasreiniger',
    'sponsjes', 'sponzen', 'theedoek', 'batterijen', 'lampje', 'kaarsen', 'servetten', 'zakdoekjes', 'tissues',
    'wasknijpers', 'ontkalker', 'luchtverfrisser', 'handzeep', 'vaatdoekjes',
  ],
  care: [
    'tandpasta', 'tandenborstel', 'shampoo', 'conditioner', 'douchegel', 'zeep', 'deodorant', 'deo', 'scheermesjes',
    'scheerschuim', 'bodylotion', 'zonnebrand', 'zonnebrandcrème', 'creme', 'crème', 'make-up', 'wattenschijfjes',
    'wattenstaafjes', 'maandverband', 'tampons', 'luiers', 'billendoekjes', 'pleisters', 'paracetamol', 'ibuprofen',
    'vitamines', 'flosdraad', 'mondwater', 'haargel', 'lippenbalsem', 'nagellak', 'contactlenzenvloeistof',
  ],
  other: [],
};

const ENTRIES: { keyword: string; category: GroceryCategory }[] = Object.entries(DICTIONARY)
  .flatMap(([category, words]) => words.map((keyword) => ({ keyword, category: category as GroceryCategory })))
  .sort((a, b) => b.keyword.length - a.keyword.length);

const EXACT = new Map(ENTRIES.map((e) => [e.keyword, e.category]));

export function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFC')
    .replace(/[.!?]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Very small Dutch singularizer, good enough for duplicate detection. */
export function productKey(name: string): string {
  const n = normalizeProductName(name);
  if (n.length > 4 && n.endsWith('eren')) return n.slice(0, -4); // eieren → ei
  if (n.length > 4 && n.endsWith("'s")) return n.slice(0, -2);
  if (n.length > 5 && n.endsWith('en')) return n.slice(0, -2);
  if (n.length > 3 && n.endsWith('s')) return n.slice(0, -1);
  return n;
}

/**
 * Categorize a product name. Pure function: an AI-backed categorizer can later
 * implement the same signature and replace this one.
 */
export function categorizeGrocery(name: string): GroceryCategory {
  const n = normalizeProductName(name);
  if (!n) return 'other';

  const exact = EXACT.get(n) ?? EXACT.get(productKey(n));
  if (exact) return exact;

  // Whole-word match ("halfvolle melk" → melk, "verse basilicum" → basilicum).
  const words = n.split(/[\s-]+/);
  for (const e of ENTRIES) {
    if (e.keyword.includes(' ')) {
      if (n.includes(e.keyword)) return e.category;
    } else if (words.includes(e.keyword)) {
      return e.category;
    }
  }
  // Compound words: Dutch glues nouns together ("kipfilet", "tomatensoep").
  // Prefer the keyword at the end of the word (the head noun), then the start.
  for (const e of ENTRIES) {
    if (e.keyword.length >= 3 && n.endsWith(e.keyword)) return e.category;
  }
  for (const e of ENTRIES) {
    if (e.keyword.length >= 4 && n.startsWith(e.keyword)) return e.category;
  }
  return 'other';
}
