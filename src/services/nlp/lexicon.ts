import type { ActivityCategory } from '../../domain/types';

export const WEEKDAYS: Record<string, number> = {
  maandag: 1,
  dinsdag: 2,
  woensdag: 3,
  donderdag: 4,
  vrijdag: 5,
  zaterdag: 6,
  zondag: 7,
  // Common abbreviations that are not also regular Dutch words.
  di: 2,
  wo: 3,
  do: 4,
  vr: 5,
  za: 6,
};

export const MONTHS: Record<string, number> = {
  januari: 1, jan: 1,
  februari: 2, feb: 2,
  maart: 3, mrt: 3,
  april: 4, apr: 4,
  mei: 5,
  juni: 6, jun: 6,
  juli: 7, jul: 7,
  augustus: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  oktober: 10, okt: 10,
  november: 11, nov: 11,
  december: 12, dec: 12,
};

export const NUMBER_WORDS: Record<string, number> = {
  een: 1, één: 1, twee: 2, drie: 3, vier: 4, vijf: 5, zes: 6, zeven: 7, acht: 8, negen: 9, tien: 10,
  elf: 11, twaalf: 12,
};

export type PartOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export const PART_OF_DAY: Record<string, PartOfDay> = {
  "'s_ochtends": 'morning',
  "'s_morgens": 'morning',
  ochtend: 'morning',
  "'s_middags": 'afternoon',
  middag: 'afternoon',
  "'s_avonds": 'evening',
  avond: 'evening',
  "'s_nachts": 'night',
};

/** Words meaning "today" + a part of the day. */
export const TODAY_PARTS: Record<string, PartOfDay | undefined> = {
  vandaag: undefined,
  vanochtend: 'morning',
  vanmorgen: 'morning',
  vanmiddag: 'afternoon',
  vanavond: 'evening',
  vannacht: 'night',
};

export const TOMORROW_PARTS: Record<string, PartOfDay | undefined> = {
  morgen: undefined,
  morgenochtend: 'morning',
  morgenvroeg: 'morning',
  morgenmiddag: 'afternoon',
  morgenavond: 'evening',
};

/** Words that make a clause about food. */
export const EAT_WORDS = new Set([
  'eten', 'eet', 'eten:', 'avondeten', 'avondmaal', 'diner', 'dineren', 'lunch', 'lunchen', 'ontbijt', 'ontbijten',
  'koken', 'kook', 'menu', 'maaltijd', 'bestellen', 'afhalen', 'snack', 'tussendoortje',
]);

/** Dishes that make a clause a meal even without "eten". */
export const DISHES = [
  'pizza', 'pasta', 'spaghetti', 'lasagne', 'nasi', 'bami', 'sushi', 'wraps', 'tacos', 'burrito', 'burritos', 'burgers',
  'hamburgers', 'friet', 'patat', 'frietjes', 'stamppot', 'boerenkool', 'hutspot', 'zuurkool', 'andijviestamppot',
  'soep', 'salade', 'curry', 'risotto', 'gnocchi', 'macaroni', 'pannenkoeken', 'poffertjes', 'shoarma', 'kapsalon',
  'chinees', 'thais', 'indiaas', 'mexicaans', 'italiaans', 'grieks', 'turks', 'japans', 'kip', 'zalm', 'vis',
  'stoofvlees', 'ovenschotel', 'quiche', 'tosti', 'tosti\'s', 'broodje', 'broodjes', 'saté', 'gourmetten', 'gourmet',
  'bbq', 'barbecue', 'fondue', 'chili', 'couscous', 'noedels', 'ramen', 'poke', 'pokebowl', 'kebab', 'döner',
  'falafel', 'schnitzel', 'biefstuk', 'gehaktballen', 'gehaktbal', 'frikandel', 'kroket', 'restjes', 'tapas',
];

export const GROCERY_ADD_VERBS = new Set(['haal', 'halen', 'koop', 'kopen', 'nodig', 'boodschappen', 'boodschappenlijst', 'lijst', 'lijstje']);

export const DELETE_WORDS = new Set([
  'verwijder', 'verwijderen', 'schrap', 'schrappen', 'annuleer', 'annuleren', 'wis', 'wissen', 'weg', 'afzeggen',
  'afgezegd', 'vervalt', 'geannuleerd',
]);

export const MOVE_WORDS = new Set(['verplaats', 'verplaatsen', 'verschuif', 'verschuiven', 'verzet', 'verzetten']);

export const UPDATE_WORDS = new Set(['verander', 'veranderen', 'wijzig', 'wijzigen', 'wordt', 'worden', 'ipv']);

/** Function words removed from titles. */
export const FILLER = new Set([
  'we', 'wij', 'ik', 'jij', 'je', 'gaan', 'ga', 'gaat', 'om', 'uur', 'u', 'moet', 'moeten', 'wil', 'willen', 'even',
  'graag', 'er', 'nog', 'ook', 'dan', 'toch', 'zet', 'zetten', 'plan', 'plannen', 'inplannen', 'in', 'op', 'de',
  'het', 'een', 'voor', 'van', 'hebben', 'heb', 'hebt', 'staat', 'staan', 'is', 'zijn', 'lekker', 'rond', 'vanaf',
  'agenda', 'planning', 'please', 'aub', 'svp', 'doen', 'daarna', 'later', 'eerst', 'en',
]);

/** Verbs normalized into a calm noun-ish title. */
export const TITLE_NORMALIZATION: Record<string, string> = {
  trainen: 'Training',
  training: 'Training',
  train: 'Training',
  werken: 'Werk',
  werk: 'Werk',
  sporten: 'Sporten',
  voetballen: 'Voetbal',
  voetbal: 'Voetbal',
  hockeyen: 'Hockey',
  tennissen: 'Tennis',
  padellen: 'Padel',
  zwemmen: 'Zwemmen',
  hardlopen: 'Hardlopen',
  rennen: 'Hardlopen',
  fietsen: 'Fietsen',
  wielrennen: 'Wielrennen',
  fitnessen: 'Fitness',
  gymmen: 'Gym',
  yogaen: 'Yoga',
  wandelen: 'Wandelen',
  vergaderen: 'Vergadering',
  stofzuigen: 'Stofzuigen',
  schoonmaken: 'Schoonmaken',
  poetsen: 'Poetsen',
  wassen: 'Was doen',
  koken: 'Koken',
};

const CATEGORY_KEYWORDS: [ActivityCategory, string[]][] = [
  ['sport', [
    'train', 'training', 'trainen', 'sport', 'sporten', 'gym', 'fitness', 'fitnessen', 'voetbal', 'voetballen',
    'hockey', 'tennis', 'padel', 'zwemmen', 'hardlopen', 'rennen', 'fietsen', 'wielrennen', 'yoga', 'pilates',
    'crossfit', 'boksen', 'squash', 'golf', 'wedstrijd', 'bootcamp', 'spinning', 'wandelen', 'klimmen', 'volleybal',
    'basketbal', 'korfbal', 'handbal', 'schaatsen', 'skiën', 'dansen', 'dansles', 'sportschool',
  ]],
  ['work', [
    'werk', 'werken', 'kantoor', 'meeting', 'vergadering', 'vergaderen', 'overleg', 'call', 'presentatie',
    'deadline', 'dienst', 'thuiswerken', 'klant', 'sollicitatie', 'cursus', 'studie', 'college', 'tentamen',
    'school', 'les',
  ]],
  ['social', [
    'verjaardag', 'jarig', 'feest', 'feestje', 'borrel', 'bbq', 'barbecue', 'visite', 'bezoek', 'etentje',
    'vrienden', 'date', 'bruiloft', 'housewarming', 'concert', 'festival', 'film', 'bioscoop', 'theater', 'kroeg',
    'stappen', 'uitje', 'spelletjesavond', 'koffie', 'logeren', 'oppassen', 'opa', 'oma', 'ouders', 'schoonouders',
  ]],
  ['appointment', [
    'tandarts', 'huisarts', 'dokter', 'arts', 'ziekenhuis', 'fysio', 'fysiotherapeut', 'kapper', 'afspraak',
    'apotheek', 'garage', 'apk', 'monteur', 'notaris', 'bank', 'dierenarts', 'opticien', 'massage', 'pedicure',
  ]],
  ['travel', [
    'naar', 'reis', 'reizen', 'vlucht', 'vliegen', 'trein', 'vakantie', 'weekendje', 'dagje', 'uitstapje', 'rijden',
    'ophalen', 'brengen', 'station', 'schiphol',
  ]],
  ['home', [
    'schoonmaken', 'poetsen', 'stofzuigen', 'wassen', 'was', 'strijken', 'tuin', 'tuinieren', 'klussen', 'opruimen',
    'boodschappen', 'pakket', 'bezorging', 'thuis', 'huis', 'verhuizen', 'koken',
  ]],
];

export function categorizeActivity(title: string): ActivityCategory {
  const words = title.toLowerCase().split(/[\s,-]+/);
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (words.some((w) => keywords.includes(w))) return category;
  }
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((k) => k.length >= 4 && title.toLowerCase().includes(k))) return category;
  }
  return 'other';
}

/** Titles that absorb the "bij X" part: "verjaardag bij Mark" → "Verjaardag Mark". */
export const ABSORB_LOCATION_TITLES = new Set(['verjaardag', 'afspraak', 'jarig']);

export const GROCERY_UNITS: Record<string, string> = {
  l: 'l', liter: 'l', liters: 'l',
  ml: 'ml',
  kg: 'kg', kilo: 'kg', kilogram: 'kg',
  g: 'g', gr: 'g', gram: 'g', ons: 'ons',
  pak: 'pak', pakken: 'pak', pakje: 'pak', pakjes: 'pak',
  fles: 'fles', flessen: 'fles', flesje: 'fles', flesjes: 'fles',
  blik: 'blik', blikken: 'blik', blikje: 'blik', blikjes: 'blik',
  zak: 'zak', zakken: 'zak', zakje: 'zak', zakjes: 'zak',
  doos: 'doos', dozen: 'doos', doosje: 'doos',
  pot: 'pot', potten: 'pot', potje: 'pot', potjes: 'pot',
  bos: 'bos', bossen: 'bos', bosje: 'bos',
  krat: 'krat', kratten: 'krat',
  stuk: 'st', stuks: 'st',
  rol: 'rol', rollen: 'rol',
  tros: 'tros',
  bak: 'bak', bakje: 'bak', bakjes: 'bak',
};
