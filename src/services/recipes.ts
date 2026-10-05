import type { Ingredient } from '../domain/types';

/**
 * Default ingredient lists for common dishes. Used to pre-fill a meal's
 * ingredients so they can be sent to the shopping list in one tap.
 * Later this can be replaced by user recipes or an AI suggestion service.
 */
const RECIPES: Record<string, string[]> = {
  'pasta pesto': ['Pasta', 'Pesto', 'Kipfilet', 'Mozzarella', 'Tomaten'],
  'pasta bolognese': ['Spaghetti', 'Rundergehakt', 'Passata', 'Ui', 'Knoflook', 'Geraspte kaas'],
  'spaghetti bolognese': ['Spaghetti', 'Rundergehakt', 'Passata', 'Ui', 'Knoflook', 'Geraspte kaas'],
  'spaghetti': ['Spaghetti', 'Rundergehakt', 'Passata', 'Ui', 'Geraspte kaas'],
  'pasta carbonara': ['Spaghetti', 'Spekjes', 'Eieren', 'Parmezaan'],
  'lasagne': ['Lasagnebladen', 'Rundergehakt', 'Passata', 'Bechamelsaus', 'Geraspte kaas'],
  'pizza': ['Pizzabodem', 'Tomatensaus', 'Mozzarella', 'Salami', 'Paprika'],
  'nasi': ['Rijst', 'Nasi-kruiden', 'Kipfilet', 'Nasigroente', 'Eieren', 'Kroepoek'],
  'bami': ['Mie', 'Bami-kruiden', 'Kipfilet', 'Bamigroente', 'Ketjap'],
  'wraps': ['Wraps', 'Kipfilet', 'Paprika', 'Ui', 'Sla', 'Salsa', 'Geraspte kaas'],
  'tacos': ['Taco shells', 'Rundergehakt', 'Taco kruiden', 'Sla', 'Tomaten', 'Geraspte kaas'],
  'burritos': ['Wraps', 'Rundergehakt', 'Kidneybonen', 'Rijst', 'Salsa', 'Geraspte kaas'],
  'hamburgers': ['Hamburgers', 'Hamburgerbroodjes', 'Sla', 'Tomaten', 'Ui', 'Kaasplakken'],
  'burgers': ['Hamburgers', 'Hamburgerbroodjes', 'Sla', 'Tomaten', 'Ui', 'Kaasplakken'],
  'stamppot': ['Aardappelen', 'Boerenkool', 'Rookworst', 'Jus'],
  'boerenkool': ['Aardappelen', 'Boerenkool', 'Rookworst', 'Spekjes'],
  'andijviestamppot': ['Aardappelen', 'Andijvie', 'Spekjes', 'Rookworst'],
  'pannenkoeken': ['Pannenkoekenmix', 'Melk', 'Eieren', 'Stroop'],
  'curry': ['Rijst', 'Kipfilet', 'Currypasta', 'Kokosmelk', 'Paprika', 'Ui'],
  'kip curry': ['Rijst', 'Kipfilet', 'Currypasta', 'Kokosmelk', 'Paprika', 'Ui'],
  'chili con carne': ['Rundergehakt', 'Kidneybonen', 'Tomatenblokjes', 'Ui', 'Paprika', 'Rijst'],
  'zalm': ['Zalmfilet', 'Krieltjes', 'Sperziebonen', 'Citroen'],
  'risotto': ['Risottorijst', 'Bouillon', 'Champignons', 'Parmezaan', 'Ui'],
  'salade': ['Sla', 'Tomaten', 'Komkommer', 'Feta', 'Dressing'],
  'soep': ['Bouillon', 'Groente', 'Brood'],
  'shoarma': ['Shoarmavlees', 'Pitabroodjes', 'Knoflooksaus', 'Sla', 'Tomaten'],
  'saté': ['Kipsaté', 'Satésaus', 'Rijst', 'Kroepoek'],
  'stoofvlees': ['Stoofvlees', 'Ui', 'Bier', 'Friet'],
  'gnocchi': ['Gnocchi', 'Pastasaus', 'Spinazie', 'Mozzarella'],
  'macaroni': ['Macaroni', 'Rundergehakt', 'Tomatensaus', 'Ham', 'Geraspte kaas'],
  'ovenschotel': ['Aardappelen', 'Rundergehakt', 'Groente', 'Geraspte kaas'],
  'broodje gezond': ['Broodjes', 'Ham', 'Kaasplakken', 'Sla', 'Tomaten', 'Komkommer'],
  'tosti': ['Brood', 'Ham', 'Kaasplakken'],
};

function key(title: string): string {
  return title.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function suggestIngredients(mealTitle: string): Ingredient[] {
  const k = key(mealTitle);
  let list = RECIPES[k];
  if (!list) {
    // Use the longest recipe name contained in the title ("verse pasta pesto" → pasta pesto).
    const match = Object.keys(RECIPES)
      .filter((r) => new RegExp(`(^|\\s)${r}(\\s|$)`).test(k))
      .sort((a, b) => b.length - a.length)[0];
    list = match ? RECIPES[match] : [];
  }
  return list.map((name) => ({ name }));
}

/** Parse "pasta, pesto en kip" into ingredients. */
export function parseIngredientList(text: string): Ingredient[] {
  return text
    .split(/,|\n|\s+en\s+/i)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => ({ name: name.charAt(0).toUpperCase() + name.slice(1) }));
}
