# Onze Week

Een rustige, installeerbare Progressive Web App voor de persoonlijke weekplanning, maaltijden en boodschappen, met één slimme invoer in gewoon Nederlands.

> "Dinsdag komende week pizza eten en om 19:45 uur trainen in Bareveld"
> → dinsdag 13 oktober: 🍴 Pizza (avondeten) + 19:45 Training, Bareveld

## Starten

```bash
npm install
npm run dev        # ontwikkelserver op http://localhost:5173
npm test           # parser-, executor- en categorie-tests
npm run build      # typecheck + productiebuild in dist/ (incl. service worker)
npm run preview    # productiebuild lokaal bekijken
```

Op een telefoon in hetzelfde netwerk: `npm run dev -- --host` en open het getoonde adres. Installeren werkt alleen via **https** (of localhost). Na deployen:

- **iPhone (Safari):** Deel → *Zet op beginscherm*
- **Android (Chrome):** menu → *App installeren*

De app opent dan fullscreen (standalone), houdt rekening met de notch/home-indicator en werkt offline.

## Wat het kan

- **Vandaag** – één tijdlijn met afspraken én maaltijden, een "nu"-markering, morgen in het kort en de boodschappenstatus.
- **Week** – weeknummer en datumbereik, swipe of pijltjes naar andere weken, dagchips met kleurstipjes; op desktop een echte 7-koloms planner.
- **Dag** – eten (met ingrediënten → boodschappen), activiteiten (veeg naar links voor wijzigen/verwijderen), notities met autosave, vorige/volgende dag.
- **Slimme invoer** – chat-achtige sheet; meerdere opdrachten per zin, bevestiging per dag, *Ongedaan maken*, en een keuzevraag bij echte twijfel ("Bedoel je dinsdag 6 oktober of dinsdag 13 oktober?").
- **Boodschappen** – automatisch per categorie, hele rij is één tik om af te vinken (met animatie), afgevinkt-sectie, wissen met undo, duplicaatcontrole ("Melk staat al op je lijst."), snel toevoegen onderaan (ook "2 liter melk" of "melk, brood en kaas").
- **Meer** – AI-instelling, voorbeeldzinnen, installatie-uitleg, back-up downloaden/terugzetten, demo-data herstellen, alles wissen.

### Begrepen opdrachten (lokale parser, werkt offline)

| Zin | Resultaat |
| --- | --- |
| morgen pizza eten | ADD_MEAL |
| dinsdag 19:45 trainen in Bareveld | ADD_ACTIVITY met locatie |
| vrijdag om 18:00 eten bij mijn ouders en daarna om 20:00 verjaardag bij Mark | 2 items |
| woensdag pasta pesto eten en haal pasta, pesto, kip en mozzarella | maaltijd + 4 boodschappen |
| zaterdag naar Groningen en 's avonds sushi eten | activiteit + avondeten |
| vrijdag geen training / training gaat dinsdag niet door | DELETE_ACTIVITY |
| verplaats training dinsdag naar woensdag 20:00 | MOVE_ACTIVITY |
| verwijder pizza van donderdag | DELETE_MEAL |
| we eten donderdag toch geen pasta maar wraps / wraps i.p.v. pasta | UPDATE_MEAL |
| zet maandag nasi op het menu | ADD_MEAL |
| volgende week vrijdag uit eten bij De Gulle Boergondiër | ADD_MEAL met locatie |
| haal melk, brood, kaas en eieren / melk, brood en kip halen | ADD_GROCERY × n |
| zet cola bij boodschappen / verwijder melk van boodschappen | ADD/DELETE_GROCERY |
| Jessica moet zaterdag werken van 9 tot 5 | activiteit 09:00–17:00, assignedTo jessica |

**Datumregels** (week begint op maandag):

- `dinsdag` → de eerstvolgende dinsdag vanaf vandaag (vandaag telt mee)
- `dinsdag komende week`, `volgende week dinsdag` → dinsdag van de volgende kalenderweek
- `komende/volgende dinsdag` → eerstvolgende dinsdag na vandaag; valt die nog in deze week, dan vraagt de app welke van de twee je bedoelt
- `aanstaande dinsdag` → eerstvolgende dinsdag na vandaag, zonder vraag
- ook: vandaag, vanavond, morgen(avond), overmorgen, dit weekend, over 2 weken, 13 oktober, 13-10, half 8, kwart over 7, van 9 tot 5

## Live zetten op Cloud86 (of andere Apache-hosting)

1. `npm run build`
2. Upload de **inhoud** van `dist/` (inclusief het verborgen bestand `.htaccess`) naar de webmap van je (sub)domein, bijv. `public_html/` of `domains/<domein>/public_html/`.
3. Zet SSL (Let's Encrypt) aan voor het domein; `.htaccess` stuurt alles door naar https.
4. Open de site op je telefoon en kies *Zet op beginscherm*.

Bij een update: opnieuw bouwen en de bestanden overschrijven; de app ververst zichzelf. Je data blijft op het toestel staan.

## Architectuur

```
src/
  domain/          types (Activity, Meal, GroceryItem, DayNote) en PlannerAction
  services/
    nlp/           parseNaturalLanguageCommand(), lokale parser, validatie
    actionExecutor.ts   acties → opslag, met undo
    groceryCategorizer.ts  woordenboek → 13 categorieën
    recipes.ts     standaard-ingrediënten per gerecht
  storage/
    repository.ts  PlannerRepository-interface (de enige afhankelijkheid van de UI)
    indexedDbRepository.ts  Dexie/IndexedDB-implementatie (local-first)
    memoryRepository.ts     in-memory implementatie (tests / referentie)
    seed.ts        demo-data
  state/           data-context, hash-router, instellingen, UI-acties
  components/      AppShell, navigatie, Sheet, SmartInputSheet, SmartConfirmation,
                   DayTimeline, TimelineItem, SwipeRow, ItemEditorSheet, Toast, …
  views/           Today, Week, Day, Groceries, More
server/aiParse.ts  AI-verwerking (server-side, Claude API)
api/parse.ts       serverless route (Vercel-stijl) → server/aiParse.ts
```

De stroom is altijd: **tekst → `parseNaturalLanguageCommand()` → `PlannerAction[]` → `executeActions()` → repository**. Wie een andere parser wil (eigen backend, ander model) implementeert `CommandParser` in `services/nlp/index.ts`; de rest van de app blijft gelijk.

### AI-verwerking (optioneel)

Zonder configuratie gebruikt de app de lokale parser. Met AI:

1. Zet `ANTHROPIC_API_KEY` als **server**-omgevingsvariabele (nooit met `VITE_`-prefix).
2. Bouw de frontend met `VITE_AI_PARSE_ENDPOINT=/api/parse` (zie `.env.example`).

`npm run dev` serveert `/api/parse` lokaal met dezelfde handler; op Vercel draait `api/parse.ts`. De sleutel komt nooit in de browser. Het antwoord van het model wordt gevalideerd (`sanitizeActions`) en bij een fout, timeout of offline valt de app terug op de lokale parser. Server-side fallbacks bij een weigering staan aan (`fallbacks: "default"`).

### Later: Supabase / twee personen

- Schrijf een `SupabaseRepository implements PlannerRepository` en wissel die in `state/DataContext.tsx`. Roep de `subscribe`-listeners aan bij realtime-wijzigingen.
- Alle entiteiten hebben `id`, `createdAt`, `updatedAt` en (activiteiten/maaltijden) `assignedTo: 'glenn' | 'jessica' | 'samen'`; de huishoudleden staan in `config/household.ts`.
- Maaltijden hebben al `ingredients[]` en boodschappen een `sourceMealId`.

## PWA-details

- `vite-plugin-pwa` (generateSW): manifest met `display: standalone`, iconen (192/512/maskable + apple-touch-icon), theme/background color, shortcuts.
- Service worker precachet de hele app; navigatie valt offline terug op `index.html`. Data staat in IndexedDB.
- iOS: `viewport-fit=cover`, safe-area insets, `100dvh`, en de invoer blijft boven het toetsenbord via `visualViewport`.
- `prefers-reduced-motion` schakelt animaties uit.
