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
- **Lijstjes** – gastenlijsten met per persoon komt / misschien / komt niet / nog geen reactie (één tik), tellers en filter, aantal personen per gast, overzicht delen. Via de slimme invoer: "Jan komt niet", "Stefan komt naar bier". Database: `supabase/migrations/20261009120000_lijstjes.sql`.
- **Meer** (tandwiel rechtsboven op Vandaag) – AI-instelling, voorbeeldzinnen, installatie-uitleg, back-up downloaden/terugzetten, demo-data herstellen, alles wissen.

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

## Samen gebruiken via Supabase

De app blijft local-first: alles wordt eerst op het toestel opgeslagen (werkt offline) en op de achtergrond gesynchroniseerd. Wijzigingen van de ander komen live binnen via Supabase Realtime; offline wijzigingen worden verstuurd zodra je weer online bent. Bij een conflict wint de laatste wijziging.

### Eenmalig instellen

1. Maak op [supabase.com](https://supabase.com) een (gratis) project aan, regio bijv. *Frankfurt*.
2. **SQL Editor** → plak de inhoud van `supabase/migrations/20261005120000_onze_week.sql` → *Run*. Dit maakt de tabellen, beveiliging (RLS), uitnodigingscodes en Realtime aan.
3. **Authentication → URL Configuration**: zet *Site URL* op het adres van de app (bijv. `https://planning.jouwdomein.nl`), zodat de bevestigingsmail daarheen linkt.
   Optioneel: **Authentication → Sign In / Providers → Email** → *Confirm email* uit, dan kun je direct na aanmaken inloggen.
4. **Project Settings → API**: kopieer de *Project URL* en de *anon / publishable key* naar `.env.local` (zie `.env.example`).
5. `npm run build` en upload `dist/` opnieuw.

### In de app

1. Glenn: **Meer → Inloggen of account maken** → *Nieuw account*, daarna **Nieuw huishouden starten** (kies "Glenn"). Je krijgt een uitnodigingscode.
2. Jessica: account maken → **Deelnemen met een code** → code invullen, "Jessica" kiezen, *Vervangen* (aanbevolen).
3. Op een extra apparaat met hetzelfde account kies je **Gedeelde planning gebruiken**.

### Hoe het werkt

- `src/sync/syncEngine.ts` – outbox (wachtrij) → push, daarna pull vanaf een cursor; triggers: wijziging, Realtime, online komen, app openen, elke minuut.
- `src/sync/supabaseRemote.ts` – vertaling naar de Supabase-tabellen; `src/sync/SyncContext.tsx` – inloggen, huishouden, koppelen.
- Verwijderen gebeurt als *tombstone* (`deleted_at`), zodat het ook op het andere toestel verdwijnt; *last write wins* wordt in de database afgedwongen.
- Getest met een echte Postgres + PostgREST (RLS, codes, conflicten) en met `src/sync/syncEngine.test.ts` (twee toestellen, offline, undo).

### Pauzeren voorkomen (keep-alive)

Een gratis Supabase-project wordt gepauzeerd na 7 dagen zonder activiteit. Daarom:

- `supabase/migrations/20261005150000_keep_alive.sql` (eenmalig uitvoeren in de SQL Editor) maakt de functie `keep_alive()`, die één hartslag-rij bijwerkt. Die functie geeft geen planningsdata prijs.
- `.github/workflows/supabase-keep-alive.yml` roept die functie elke 3 dagen aan via GitHub Actions (en handmatig via *Actions → Supabase keep-alive → Run workflow*). Geplande workflows draaien alleen vanaf de standaardbranch (`main`).
- Alternatief/extra: een cronjob op Cloud86, bijv. elke dag:
  `curl -s -X POST "https://<project>.supabase.co/rest/v1/rpc/keep_alive" -H "apikey: <publishable key>" -H "Content-Type: application/json" -d '{}'`

Is het project toch gepauzeerd, dan werkt de app gewoon lokaal door; na *Restore* in het dashboard synchroniseert alles weer.

De productie-instellingen (URL + publishable key) staan in `.env.production`.

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
supabase/
  migrations/      database (tabellen, RLS, keep-alive)
  functions/parse/ Edge Function: AI-verwerking met Claude
```

De stroom is altijd: **tekst → `parseNaturalLanguageCommand()` → `PlannerAction[]` → `executeActions()` → repository**. Wie een andere parser wil (eigen backend, ander model) implementeert `CommandParser` in `services/nlp/index.ts`; de rest van de app blijft gelijk.

### AI-verwerking (Claude via Supabase Edge Function)

De slimme invoer gebruikt Claude zodra je bent ingelogd (Meer → Samen) en online bent; anders, of bij een storing, de lokale parser. Onder elk antwoord staat "Verwerkt met AI" of "Lokaal verwerkt".

- `supabase/functions/parse/index.ts` – Edge Function: stuurt de zin + een compacte lijst van jullie bestaande items naar Claude (`claude-opus-5-5`, structured output) en geeft acties terug. De app valideert ze nog eens (`sanitizeActions`).
- De API-sleutel staat als **secret** in Supabase (`ANTHROPIC_API_KEY`) en komt nooit in de browser. *Verify JWT* staat aan: alleen ingelogde gebruikers kunnen de functie aanroepen.

Instellen:
1. Maak een API-sleutel op [console.anthropic.com](https://console.anthropic.com) (Settings → API keys) en zet er wat tegoed op.
2. Supabase → **Edge Functions → Secrets** → `ANTHROPIC_API_KEY` = je sleutel.
3. Supabase → **Edge Functions → Deploy a new function → Via editor**, naam `parse`, plak `supabase/functions/parse/index.ts`, *Deploy*. (Of: `supabase functions deploy parse`.)

### Datamodel

- Alle entiteiten hebben `id` (UUID), `createdAt`, `updatedAt` en (activiteiten/maaltijden) `assignedTo: 'glenn' | 'jessica' | 'samen'`; de huishoudleden staan in `config/household.ts`.
- Maaltijden hebben `ingredients[]` en boodschappen een `sourceMealId`.

## PWA-details

- `vite-plugin-pwa` (generateSW): manifest met `display: standalone`, iconen (192/512/maskable + apple-touch-icon), theme/background color, shortcuts.
- Service worker precachet de hele app; navigatie valt offline terug op `index.html`. Data staat in IndexedDB.
- iOS: `viewport-fit=cover`, safe-area insets, `100dvh`, en de invoer blijft boven het toetsenbord via `visualViewport`.
- `prefers-reduced-motion` schakelt animaties uit.
