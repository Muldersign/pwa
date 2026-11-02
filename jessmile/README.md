# Jessmile – Jessica’s beugeltracker

Een installeerbare Progressive Web App waarmee Jessica met één tik bijhoudt hoe lang haar uitneembare aligner gedragen is. Het doel is minimaal 22 uur per dag, dus maximaal 2 uur per dag uit.

## Starten

```bash
cd jessmile
npm install
npm run dev          # ontwikkelserver op http://localhost:5173
npm test             # rekenregels: middernacht, zomer-/wintertijd, reeksen, correcties
npm run build        # typecheck + productiebuild in dist/ (incl. service worker)
npm run build:single # één zelfstandig HTML-bestand in dist-single/ (demo, zonder service worker)
```

Deploy `dist/` naar een https-host (de meegeleverde `.htaccess` werkt op Apache/shared hosting). De app gebruikt relatieve paden en hash-routing, dus hij werkt ook in een submap. Installeren:

- **iPhone (Safari):** Deel → *Zet op beginscherm*
- **Android (Chrome):** menu → *App installeren*

## Hoe het werkt

- **Tijdstempels, geen timer.** Elke tik slaat een moment op ("vanaf nu in" of "vanaf nu uit") in IndexedDB. Alle totalen worden steeds opnieuw berekend uit die momenten en de echte klok. De stopwatch loopt dus gewoon door als de browser dicht is of het scherm vergrendeld.
- **Kalenderdagen** lopen van 00:00 tot 24:00 in de lokale tijdzone. Perioden over middernacht worden automatisch verdeeld. Zomer-/wintertijd wordt meegenomen (dagen van 23 of 25 uur).
- **Nooit aannemen dat de beugel in zat.** Vóór de eerste registratie is de status onbekend. Een eerdere dag zonder enige registratie telt pas mee nadat Jessica die bevestigt ("Ja, dat klopt"). Bij onvolledige dagen verschijnt een neutrale melding, en zo'n dag telt nooit als "niet behaald".
- **Geen dubbele of ongeldige registraties.** De knop kiest zelf in/uit op basis van de huidige status, en tikken binnen 1,2 s worden genegeerd. Elke correctie wordt als geheel gecontroleerd: gesorteerd, minstens een minuut ertussen, afwisselend in/uit en niet in de toekomst.

## Onderdelen

- **Vandaag:** begroeting en datum, geanimeerde voortgangsring, de grote knop "Beugel in/uit" met live stopwatch, de kaartjes *Vandaag gedragen*, *Vandaag uit geweest* en *Resterend uit-budget*, een tijdlijn (paars = in, roze = uit) en de momenten van vandaag.
- **Kalender:** maandoverzicht met dagkleuren (groen = doel behaald, oranje = minder dan doel, paars = vandaag, grijs = geen gegevens) en een archieflijst van nieuw naar oud.
- **Dagoverzicht:** totalen, percentage, status, tijdlijn, alle momenten, tijden aanpassen, een vergeten periode of moment toevoegen, verwijderen met bevestiging, een notitie per moment en een opmerking per dag.
- **Statistieken:** gemiddelde per dag, aantal dagen doel behaald, huidige en langste reeks, totaal van de afgelopen 7 dagen, een grafiek over 7, 30 of 90 dagen en vriendelijke motivatieberichten.
- **Instellingen:** naam, dagdoel, herinneringen (na 30 en 60 min, bij een bijna leeg uit-budget, na het eten) met toestemmingsvraag, CSV-export, back-up exporteren en importeren, demo bekijken en alles wissen.

### Herinneringen

Browsermeldingen worden gepland vanuit de opgeslagen tijden zolang de app open is of op de achtergrond actief blijft. Zonder pushserver kan een browser geen melding sturen als de app helemaal is afgesloten. Op iPhone werken meldingen alleen als de app op het beginscherm staat (iOS 16.4+).

### Demo

*Instellingen → Demo met voorbeelddata bekijken* opent een **aparte** database met ongeveer vier weken realistische data. Het echte logboek blijft leeg en onaangetast. Via de banner of de instellingen sluit je de demo weer af.

## Structuur

```
src/
  domain/types.ts        datamodel (momenten, opmerkingen, instellingen, back-up)
  lib/tracking.ts        rekenkern: dagtotalen, segmenten, status, reeksen
  lib/edits.ts           pure correcties met validatie (toggle, periode, aanpassen, verwijderen)
  lib/reminders.ts       herinneringen plannen + useReminders.ts (scheduler)
  storage/               Dexie/IndexedDB, back-up, demo-data
  state/                 DataContext (live queries), toasts, hash-router
  components/ views/     UI
```
