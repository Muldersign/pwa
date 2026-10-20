# The Night of Absolute Bullshit 2.0 — Murder at Parkzicht

Nederlandstalige singleplayer-detectivegame voor de telefoon. Ondervraag tien verdachten, onderzoek ruim vijftig bewijsstukken, los zes puzzels op en wijs de moordenaar van Milo Dubbelspel aan. Speelduur ongeveer 45 minuten.

> Alle personages en gebeurtenissen zijn verzonnen. Wat de personages in dit verhaal doen, zegt niets over echte personen met dezelfde naam.

## Starten

```bash
npm install
npm run dev            # http://localhost:5173 (op je telefoon: npm run dev -- --host)
npm test               # data-integriteit + automatische volledige playthrough
npm run build          # productiebuild in dist/
npm run build:single   # hele game als één bestand: dist-single/index.html
```

`dist-single/index.html` kun je zo op elke webhost zetten of direct in een browser openen. Er is geen backend, login of externe API nodig. De voortgang wordt automatisch in `localStorage` bewaard.

## Spoilervrij spelen

De oplossing staat **alleen** in `src/scenario/parkzicht/solution.ts`. Open dat bestand niet als je zelf wilt spelen. De interface toont de dader pas na de definitieve beschuldiging. (Omdat alles client-side draait, kan iemand die de broncode doorzoekt de oplossing vinden; voor echte geheimhouding is later een backend nodig.)

## Structuur

```
src/engine/           generieke game-engine (types, voorwaarden, voortgang, score) + tests
src/scenario/parkzicht/
  suspects.ts         tien verdachten: profiel, verklaringen, motieven, alibi's, geheimen
  dialogues.ts        gespreksbomen (8–17 onderwerpen per verdachte, inclusief confrontaties)
  evidence.ts         alle bewijsstukken
  photos.ts           de foto's als data (getekend als SVG, met zoom-hotspots)
  puzzles.ts          zes interactieve puzzels
  questions.ts        onderzoeksvragen 1–9 (10–12 zitten in de eindbeschuldiging)
  chapters.ts         vier hoofdstukken en hun doelen
  timeline.ts         twee gescheiden tijdlijnen: de oude zaak en de moordavond
  solution.ts         ⚠️ spoilers
src/ui/               React-schermen, navigatie en opslag
```

Een nieuwe zaak toevoegen = een nieuwe map onder `src/scenario/` met dezelfde opbouw en die in `src/ui/store.tsx` laden.

## Getest

`npm test` controleert onder meer: exact de tien gevraagde namen, minimaal acht onderwerpen per verdachte, dat elke verwijzing bestaat, dat elk bewijsstuk verkrijgbaar is, dat de geldbedragen optellen, dat de tijdlijnen gescheiden en in volgorde zijn, dat de sleutelroute en puzzelantwoorden kloppen, en een automatische volledige playthrough van start tot beschuldiging. Daarnaast is het spel in een telefoonviewport (Pixel 7) volledig doorgespeeld via de echte interface, inclusief herladen en hervatten.
