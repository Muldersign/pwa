// ⚠️  SPOILERS ⚠️
// Dit bestand bevat de volledige oplossing van de zaak. Niet openen als je
// het spel zelf nog wilt spelen. De interface toont deze inhoud pas na de
// definitieve beschuldiging.
import type { Solution } from '../../engine/types';

export const solution: Solution = {
  culprit: 'yvan',
  motives: [
    { id: 'm_blackbook', text: 'Voorkomen dat bekend werd dat het Black Book was vervalst.' },
    { id: 'm_afpersing', text: 'Niet langer afgeperst worden voor €1.500.' },
    { id: 'm_trofee', text: 'Voorkomen dat werd onthuld wie de Golden Cock had meegenomen, terwijl een vriend daar jarenlang voor boette.' },
    { id: 'm_wraak', text: 'Wraak: Milo had opnieuw geld afgetroggeld en beloftes gebroken.' },
    { id: 'm_bazooka', text: 'Voorkomen dat bekend werd wie met de Bullshit Bazooka de schade veroorzaakte.' },
    { id: 'm_heling', text: 'Verbergen dat de gestolen trofee was doorverkocht.' },
    { id: 'm_archief', text: 'Verbergen dat het originele rapport jarenlang was achtergehouden.' },
  ],
  motive: 'm_trofee',
  decisiveEvidence: ['e_manchetknoop', 'e_foto_2152', 'e_foto_2110', 'e_wapen', 'e_mapinhoud', 'e_telefoon', 'e_contacten', 'e_v_danielle_garderobe', 'e_v_stefan_voordeur', 'e_asbak', 'e_sleutelroute', 'e_alibi'],
  supportingEvidence: ['e_verkoop', 'e_v_alex_sporttas', 'e_foto_2052', 'e_bennie', 'e_sleutel_jas', 'e_cameralog', 'e_karaoke', 'e_klokgieter', 'e_plattegrond'],
  confession: [
    'Hij zou het om tien uur aan iedereen vertellen. Aan Glenn. Aan de Brotherhood. Hij zei: "Of je betaalt me tweeduizend, of ik lees die verklaring voor."',
    'Ik wilde alleen dat papier. Hij draaide zich om, en die trofee stond daar. Mijn trofee. Ik heb hem duizend keer gepoetst.',
    'Ik weet niet eens meer dat ik hem optilde. Ik weet alleen nog dat hij naar mijn mouw greep.',
  ],
  reconstruction: [
    {
      title: 'Wat er in 2024 gebeurde',
      paragraphs: [
        'Op 14 april 2024 organiseerde Rick van der Veen de Night of Absolute Bullshit. Om 22.50 uur vuurde hij zijn "Bullshit Bazooka" af, een confettikanon met een ingebouwde subwoofer. Het ding trok de geluidsinstallatie mee: €185 aan meubilair, €95 aan glas en schoonmaak, €220 aan geluid. Samen €500.',
        'Glenn Mulder stond op dat moment aan de bar, met een biertje. Jessica Postema filmde alles. Om 23.31 uur vertrok Glenn met de taxi. Om 23.35 maakte Sanne Roossien haar foto: de Golden Cock stond nog op de bar, Glenns jas hing al niet meer aan de kapstok.',
        'Om 00.15 uur schreven Maureen Nieuwold en caféhouder Bennie het eerlijke rapport: oorzaak de Bazooka, schade €500, trofee laatst gezien om 23.35, schuldige onbekend.',
      ],
    },
    {
      title: 'Wie de Golden Cock stal',
      paragraphs: [
        'Tijdens de Bazooka-reprise om 23.40 uur, met alle lichten uit, nam Yvan Hoving — nota bene de Ceremoniemeester — de trofee mee in zijn sporttas. Volgens hemzelf als grap: hij wilde hem later "terugvinden" in een grootse ceremonie. Om 23.45 zag Alex hem met de zware tas naar zijn auto lopen, maar zei niets.',
        'Toen het Black Book Glenn de schuld gaf, zweeg Yvan. Hij had nog een poolschuld van €400 bij Daniëlle Radtur en betaalde die in mei 2024 met de trofee.',
      ],
    },
    {
      title: 'Wie er financieel van profiteerden',
      paragraphs: [
        'Daniëlle verkocht de trofee op 2 juni 2024 voor €400 aan verzamelaar Klokgieter. Zij vermoedde dat het de gestolen Golden Cock was, maar vroeg niet door.',
        'Glenn betaalde €650 aan de Brotherhood-rekening. Daarvan ging €500 naar het café en €150 naar Jessica, officieel voor haar "jas", in werkelijkheid als zwijggeld voor haar Bazooka-video. €650 = €500 + €150.',
        'Milo verdiende er in 2026 aan: €200 van Glenn en €1.500 contant van Jessica. Zelf betaalde hij €900 aan Klokgieter voor de trofee en €100 aan Alex voor de kamer.',
      ],
    },
    {
      title: 'Wie het Black Book vervalste',
      paragraphs: [
        'Penningmeester Stefan Alting. De Brotherhood-kas was leeg: hij had in februari €480 "geleend" voor BullshitCoin. Als de Brotherhood de schade had moeten betalen, was dat uitgekomen.',
        'Hij herschreef Maureens rapport: Glenn als dader om 23.10, de trofee "verdwenen" om 23.20 (vóór Glenns vertrek), €150 extra "reiniging kleding", en een nagemaakte paraaf van Maureen. Rick en Sanne wisten later van de tijden en zwegen; Maureen bewaarde het origineel en zweeg ook.',
        'De twee fraudezaken stonden los van elkaar: Stefan wist niet wie de trofee had meegenomen, en Yvan had niets met de vervalsing te maken. Hij profiteerde er alleen van.',
      ],
    },
    {
      title: 'Waarom Milo werd vermoord',
      paragraphs: [
        'Milo kocht de trofee in augustus 2026 terug en liet Daniëlle in september een verklaring tekenen: zij had de trofee "van Yvan Hoving, als betaling van een poolweddenschap". Om 22.00 uur zou hij dat voorlezen.',
        'Voor Yvan betekende dat alles kwijt: zijn plek in de Brotherhood, zijn ceremonie, en vooral Glenn, zijn beste vriend en compagnon, die net €12.000 in hun brouwerij had gestoken en tweeënhalf jaar de Hanendief was geweest. Milo, die altijd dubbelspel speelde, bood hem om 20.47 een "oplossing" aan: kom om 21.30 naar de achterkamer.',
      ],
    },
    {
      title: 'Hoe de moord plaatsvond',
      paragraphs: [
        '21.25 — Yvan zegt aan tafel dat hij gaat roken en verlaat het café via de voordeur (Bennie ziet het). Hij loopt via het steegje en de tuin om het pand heen en komt via de achterdeur de gang in, buiten het zicht van de bar.',
        '21.31 — Hij klopt drie keer. Milo stuurt Maureen nog snel "Er wordt geklopt, straks meer" en doet open. Milo eist €2.000 of hij leest de verklaring voor.',
        '±21.35 — Als Milo zich omdraait, grijpt Yvan de Golden Cock van tafel en slaat. In zijn val grijpt Milo Yvans rechtermouw; de manchetknoop schiet los en belandt onder hem, met draadjes van Yvans donkerblauwe overhemd.',
        '21.36–21.39 — Yvan veegt de schacht af met zijn zakdoek, maar het blauwe biljartkrijt van zijn vingers blijft in de gravure zitten. Hij laat de envelop met €1.500 liggen, haalt alleen document 5 — de verkoopverklaring — uit de map, trekt de sleutel van Milo\'s koord en draait de deur van buiten op slot.',
        '21.41 — Bij de garderobe laat hij de sleutel in de jaszak van Stefan glijden, de vervalser die om 22.00 uur toch al ontmaskerd zou worden. Daniëlle ziet hem vanaf haar barkruk. Hij gaat via de achterdeur naar buiten (tocht) en loopt om naar het voorterras.',
        '±21.45 — In de asbak onder de luifel verbrandt hij de verkoopverklaring. Om 21.47 komt hij met nat haar door de voordeur binnen: "Wat is hier aan de hand?"',
      ],
    },
    {
      title: 'Waarom de anderen zich vreemd gedroegen',
      paragraphs: [
        'Jessica loog over het toilet omdat ze om 21.05 €1.500 zwijggeld betaalde. Rick loog over het podium omdat hij om 21.15 op de deur bonkte om zijn Bazooka-geheim te beschermen. Stefan zweette omdat hij het Black Book vervalste en de kas leegtrok; de sleutel in zijn jas was geplant.',
        'Alex verzweeg de €100 huur. Maureen verzweeg dat ze het origineel tweeënhalf jaar bewaarde. Sanne verzweeg dat ze haar foto al sinds 2025 begreep. Jolien hield een foto van haar vriendin Jessica achter. Daniëlle verzweeg dat ze de gestolen trofee doorverkocht. Glenn schaamde zich voor de €200 en zijn boze bericht.',
        'Iedereen had iets te verbergen. Maar maar één persoon had biljartkrijt aan zijn handen, geen alibi tussen 21.31 en 21.42, een lege manchet en een reden om alléén document 5 mee te nemen.',
      ],
    },
    {
      title: 'Welk bewijs de dader aanwijst',
      paragraphs: [
        'Toegang: Milo verwachtte om 21.30 bezoek van "🐓" — het nummer 06-1834 7726 is van Yvan (niet van Glenn: 06-1834 7762). Milo deed alleen open voor wie hij verwachtte.',
        'Alibi: van de tien verdachten hebben alleen Stefan en Yvan geen bevestigd alibi tussen 21.31 en 21.42. Stefan stond op het voorterras en zag niemand, wat Yvans rookalibi onderuit haalt.',
        'Fysiek: de B.o.B.-manchetknoop onder het lichaam met donkerblauwe draadjes. Om 21.10 droeg Yvan er twee, om 21.52 hing zijn rechtermanchet open. Rick miste zijn knoop al sinds 2024, Stefan had er beide nog, Alex draagt ze nooit.',
        'Wapen: blauw biljartkrijt in de gravure. Alleen Yvan en Daniëlle speelden pool; Daniëlle zat met gewassen handen aan de bar, met alibi.',
        'Motief en dekmantel: uit de map verdween alleen de verkoopverklaring die Yvan noemde; de restanten ervan lagen in de asbak waar hij beweerde te roken. De sleutel belandde in Stefans jas om 21.41 — het moment waarop Daniëlle Yvan bij de garderobe zag.',
      ],
    },
  ],
};
