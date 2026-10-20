import type { Line, Topic } from '../../engine/types';

const s = (text: string): Line => ({ who: 'suspect', text });
const d = (text: string): Line => ({ who: 'detective', text });
const n = (text: string): Line => ({ who: 'note', text });

export const dialogues: Record<string, Topic[]> = {
  // =====================================================================
  glenn: [
    {
      id: 'glenn_c1_intro',
      label: 'Stel jezelf even voor.',
      subject: 'Kennismaking',
      when: {},
      lines: [
        s('Glenn Mulder. Officieel de Hanendief van Parkzicht. Dat staat in een boek, het Black Book. Zwart op wit, dus het moet wel waar zijn.'),
        s('Ik ben hier omdat Milo beloofde dat vanavond alles recht zou worden gezet. Dat is… nou ja. Dat gaat niet meer gebeuren, hè?'),
      ],
    },
    {
      id: 'glenn_c1_milo',
      label: 'Hoe kende je Milo?',
      subject: 'Het slachtoffer',
      when: {},
      lines: [
        s('Milo maakte een podcast, "Dubbelspel Onthult". Vorig jaar begon hij over de Night of Absolute Bullshit.'),
        s('In september belde hij me: "Glenn, ik kan bewijzen dat jij het niet was." Ik heb drie minuten niets gezegd. Toen heb ik gehuild. Vertel dat aan niemand.'),
      ],
    },
    {
      id: 'glenn_c1_avond',
      label: 'Wat deed je vanavond, voor de ontdekking?',
      subject: 'De moordavond',
      when: {},
      lines: [
        s('Biertje, bitterballen, en om de minuut op de klok kijken.'),
        s('Om half negen heb ik Milo nog even gesproken in de gang. Hij was opgewekt. Te opgewekt, achteraf.'),
        d('Waarover?'),
        s('Over… de planning. Van vanavond.'),
        n('Glenn kijkt naar zijn schoenen.'),
      ],
    },
    {
      id: 'glenn_c1_2024',
      label: 'Wat gebeurde er in 2024?',
      subject: 'Het oude schandaal',
      when: {},
      lines: [
        s('Rick had een "show" gepland. Er ging van alles kapot. Ik was om half twaalf al weg met de taxi.'),
        s('Twee weken later lees ik in het Black Book dat ík op tafel heb gedanst en dat ík de Golden Cock heb laten verdwijnen. Ik heb €650 betaald om ervan af te zijn. Sindsdien ben ik de Hanendief.'),
      ],
    },
    {
      id: 'glenn_c2_taxi',
      label: 'Kun je bewijzen hoe laat je in 2024 vertrok?',
      subject: 'Het oude schandaal',
      when: { chapter: 2 },
      lines: [
        s('Sinds die avond bewaar ik álles. Kijk: de taxibon. Om 23.31 vertrokken bij Parkzicht.'),
        s('Ik heb hem destijds aan Stefan laten zien. Hij zei: "Een taxibon bewijst niks, Glenn. Je kunt ook later weer naar binnen zijn gegaan."'),
      ],
      effects: { evidence: ['e_taxibon'] },
    },
    {
      id: 'glenn_c2_geld',
      label: 'Waarover sprak je Milo echt om 20.30?',
      subject: 'De moordavond',
      when: { chapter: 2, topics: ['glenn_c1_avond'] },
      lines: [
        s('…Geld. Hij vroeg €200 "onderzoekskosten". Archiefonderzoek kost geld, zei hij.'),
        s('Ik heb het gewoon betaald. Contant, in de gang. Ja, ik weet hoe dat klinkt. Na tweeënhalf jaar wil je gewoon dat het klaar is.'),
      ],
    },
    {
      id: 'glenn_c2_blackbook',
      label: 'Confronteer met bewijs: het officiële Black Book',
      confront: true,
      subject: 'Het oude schandaal',
      when: { chapter: 2, evidence: ['e_blackbook'] },
      lines: [
        s('"Danste op tafel en trok de geluidsinstallatie om." Ik? Met mijn knie? Ik kan niet eens op een barkruk klimmen zonder te zuchten.'),
        s('En die €150 "reiniging kleding"? Wiens kleding? Niet de mijne.'),
      ],
    },
    {
      id: 'glenn_c3_brief',
      label: 'Confronteer met bewijs: Milo\'s brief aan jou',
      confront: true,
      subject: 'Het geld',
      when: { chapter: 3, evidence: ['e_brief_glenn'] },
      lines: [
        s('Ja. "Op 24 oktober praat ik je vrij." En dan, alsof het niks is: "Neem €200 mee."'),
        d('Wist je dat Milo op hetzelfde moment iemand anders afperste voor €1.500?'),
        s('…Nee. Dus hij speelde met iedereen een spelletje. Dubbelspel. De naam zei het al.'),
      ],
    },
    {
      id: 'glenn_c3_brouwerij',
      label: 'Je opent binnenkort een brouwerij?',
      subject: 'Persoonlijk',
      when: { chapter: 3 },
      lines: [
        s('Brouwerij De Vrije Haan. Ironisch, ik weet het. Ik heb er al mijn spaargeld in gestoken: €12.000.'),
        s('Mijn compagnon is Yvan. Hij was de enige van de Brotherhood die me na 2024 nog gewoon belde. Elke week. "Laat ze lullen, Glenn."'),
      ],
    },
    {
      id: 'glenn_c3_yvan',
      label: 'Confronteer met bewijs: de verkoopverklaring',
      confront: true,
      subject: 'Het geld',
      when: { chapter: 3, evidence: ['e_verkoop'] },
      lines: [
        n('Glenn leest de verklaring twee keer.'),
        s('Yvan? Mijn compagnon? Nee. Nee, dat…'),
        s('Hij heeft me twee jaar lang "Hanendief" horen noemen. En meegelachen. En me gebeld. Elke week.'),
        n('Hij legt het papier heel voorzichtig neer, alsof het kan ontploffen.'),
      ],
    },
    {
      id: 'glenn_c4_alibi',
      label: 'Waar was je tussen 21.31 en 21.42?',
      subject: 'Alibi',
      when: { chapter: 4 },
      lines: [
        s('Op het podium. Eerst met Sanne, "Total Eclipse of the Heart", daarna met Jessica, "Islands in the Stream". Daartussen heb ik geklapt voor Maureen.'),
        s('Vraag Rick maar. Hij heeft alles aangekondigd, met dat vlinderdasje.'),
      ],
    },
    {
      id: 'glenn_c4_dreig',
      label: 'Confronteer met bewijs: jouw dreigbericht van 30 september',
      confront: true,
      subject: 'Het slachtoffer',
      when: { chapter: 4, evidence: ['e_telefoon'] },
      lines: [
        s('"Als je me weer belazert, Milo, dan zweer ik je…" Ja. Dat heb ik gestuurd.'),
        s('Hij vroeg toen eerst €500 "advocaatkosten". Ik was woedend. We zijn op €200 uitgekomen. Ik heb betaald en mijn mond gehouden. Ik heb hem niets gedaan.'),
      ],
    },
    {
      id: 'glenn_c4_yvan',
      label: 'Wanneer zag je Yvan vanavond, rond de moord?',
      subject: 'De moordavond',
      when: { chapter: 4 },
      lines: [
        s('Om kwart over negen zat hij nog bij ons aan de Brotherhood-tafel. Tegen half tien zei hij: "Ik ga even een peuk roken."'),
        s('Toen hij terugkwam, na het gegil, had hij nat haar. Hij vroeg: "Wat is hier aan de hand?"'),
      ],
    },
  ],

  // =====================================================================
  jessica: [
    {
      id: 'jessica_c1_intro',
      label: 'Stel jezelf even voor.',
      subject: 'Kennismaking',
      when: {},
      lines: [
        s('Jessica Postema. Je kent me misschien van @jessicastyles. Nee? Oké.'),
        s('Ik ben hier voor de nostalgie. En voor de outfit. Deze blazer is vintage, voor het geval je het vroeg.'),
      ],
    },
    {
      id: 'jessica_c1_avond',
      label: 'Waar was je tussen 21.00 en 21.10?',
      subject: 'De moordavond',
      when: {},
      lines: [
        s('Toilet. Make-up bijwerken. Tussen negen uur en tien over negen.'),
        s('Dat duurt bij mij tien minuten, ja. Dit gezicht maakt zichzelf niet.'),
      ],
      effects: { evidence: ['e_v_jessica_toilet'] },
    },
    {
      id: 'jessica_c1_milo',
      label: 'Kende je Milo goed?',
      subject: 'Het slachtoffer',
      when: {},
      lines: [
        s('Nauwelijks. Een vage podcastman met een te grote sjaal. Hij stuurde iedereen berichtjes. Mij ook.'),
        s('Ik heb niet gereageerd. Ik reageer niet op mannen met podcasts.'),
      ],
    },
    {
      id: 'jessica_c1_2024',
      label: 'Wat herinner je je van 2024?',
      subject: 'Het oude schandaal',
      when: {},
      lines: [
        s('Mijn jas. Ganni, bier eroverheen, onherstelbaar. Verder: lawaai, confetti, Rick die schreeuwde.'),
        s('Ik heb er gelukkig €150 voor teruggekregen. Van de Brotherhood. Keurig geregeld.'),
        n('Ze zegt het net iets te snel.'),
      ],
    },
    {
      id: 'jessica_c2_sanne',
      label: 'Confronteer met bewijs: Sanne zag je om 21.09',
      confront: true,
      subject: 'De moordavond',
      when: { evidence: ['e_v_sanne_2109'] },
      lines: [
        s('Sanne ziet zóveel. Ze zou detective moeten worden. O, wacht.'),
        s('Misschien heb ik even naar binnen gekeken. Nieuwsgierig. Mag dat? Iedereen wilde weten wat Milo daar deed.'),
        n('Ze ontwijkt de vraag. Je hebt meer nodig om haar te laten praten.'),
      ],
    },
    {
      id: 'jessica_c2_jas',
      label: 'Op de caféfactuur staat geen €150 voor een jas.',
      subject: 'Het oude schandaal',
      when: { chapter: 2, evidence: ['e_factuur'] },
      lines: [
        s('Natuurlijk niet. De jas was van mij, niet van het café.'),
        s('Stefan zei dat de Brotherhood het zou regelen. Ik heb niet gevraagd waar het geld vandaan kwam. Dat is niet mijn afdeling.'),
      ],
    },
    {
      id: 'jessica_c3_afpersing',
      label: 'Confronteer met bewijs: de afpersingsbrief',
      confront: true,
      subject: 'Het geld',
      when: { chapter: 3, evidence: ['e_afpersing'] },
      lines: [
        n('Jessica\'s gezicht verliest even alle filters.'),
        s('Oké. Ja. Ik was om 21.05 in de achterkamer. Niet op het toilet.'),
        s('Ik heb die envelop op tafel gelegd. €1.500. Milo telde het niet eens. Hij zei: "Dank je, Jessica, je bent mijn favoriete klant."'),
        s('Ik ben weggegaan. Hij leefde nog. Hij grijnsde zelfs.'),
      ],
    },
    {
      id: 'jessica_c3_sleutel',
      label: 'Hoe ging de deur van de achterkamer open en dicht?',
      subject: 'De moordavond',
      when: { chapter: 3, topics: ['jessica_c3_afpersing'] },
      lines: [
        s('Ik klopte. Milo draaide de sleutel om; die zat aan de binnenkant in het slot.'),
        s('Toen ik wegging, deed hij de deur achter me op slot en hing hij de sleutel aan dat rode koord om zijn nek. "Niemand komt hier binnen zonder dat ik het wil," zei hij.'),
      ],
      effects: { evidence: ['e_v_jessica_sleutel'] },
    },
    {
      id: 'jessica_c3_150',
      label: 'Confronteer met bewijs: €150 van de Brotherhood-rekening',
      confront: true,
      subject: 'Het geld',
      when: { chapter: 3, evidence: ['e_bank_bob'] },
      lines: [
        s('Voor mijn jas… Oké. Niet voor mijn jas.'),
        s('Ik had de Bazooka gefilmd. Rick die dat ding afvuurt, de subwoofer die van zijn standaard vliegt, Glenn die aan de bar staat. Stefan zag me filmen.'),
        s('Hij zei: "€150 en die video bestaat niet." Ik dacht: het is maar een feestje. Twee weken later betaalde Glenn alles.'),
        s('Ik heb de video nooit gewist. Hier. Doe ermee wat je wilt.'),
      ],
      effects: { evidence: ['e_video'] },
    },
    {
      id: 'jessica_c4_alibi',
      label: 'Waar was je tussen 21.31 en 21.42?',
      subject: 'Alibi',
      when: { chapter: 4 },
      lines: [
        s('Karaoke. "Toxic" om half tien, daarna dansen voor het podium, daarna dat duet met Glenn.'),
        s('Ik ben geen moment van dat podium weg geweest. Jolien heeft het allemaal gefotografeerd. Helaas ook van mijn slechtste kant.'),
      ],
    },
    {
      id: 'jessica_c4_envelop',
      label: 'Jouw envelop met €1.500 lag nog in de kamer.',
      subject: 'De moordavond',
      when: { chapter: 4, topics: ['jessica_c3_afpersing'] },
      lines: [
        s('Dat zeg ik toch? Wie hem vermoordde, wilde geen geld.'),
        s('Die wilde iets anders. Iets wat Milo had. Iets wat niet in een envelop zat.'),
      ],
    },
  ],

  // =====================================================================
  sanne: [
    {
      id: 'sanne_c1_intro',
      label: 'Stel jezelf even voor.',
      subject: 'Kennismaking',
      when: {},
      lines: [
        s('Sanne! Plakboek-Sanne. Ik heb van elk feest een boek. Bierviltjes, polsbandjes, alles.'),
        s('Dit wordt het ergste plakboek ooit. Sorry. Ik praat veel als ik zenuwachtig ben.'),
      ],
    },
    {
      id: 'sanne_c1_milo',
      label: 'Wanneer zag je Milo voor het laatst?',
      subject: 'Het slachtoffer',
      when: {},
      lines: [
        s('Om 21.28. Ik stond net op het podium, laatste noot van "Dancing Queen". Hij liep met zijn whisky de gang in, naar de achterkamer.'),
        s('Hij knipoogde naar me. Echt waar. Dat stop ik níet in het plakboek.'),
      ],
    },
    {
      id: 'sanne_c1_jessica',
      label: 'Heb je vanavond iets vreemds gezien?',
      subject: 'De moordavond',
      when: {},
      lines: [
        s('Ja! Om 21.09 kwam ik van het toilet, en daar kwam Jessica uit de achterkamer. Niet uit het toilet. Uit de achterkamer.'),
        s('Met een gezicht alsof ze net haar creditcard had laten ontploffen.'),
      ],
      effects: { evidence: ['e_v_sanne_2109'] },
    },
    {
      id: 'sanne_c1_2024',
      label: 'Wat herinner je je van 2024?',
      subject: 'Het oude schandaal',
      when: {},
      lines: [
        s('Alles! Ik heb er drie bladzijden over. Confetti, de Bazooka van Rick, Yvan die de ceremonie deed in een cape, Stefan die het Black Book voorlas.'),
        s('Glenn ging vroeg weg, met de taxi. Hij miste de reprise. Gelukkig maar, eigenlijk.'),
      ],
    },
    {
      id: 'sanne_c2_foto',
      label: 'Confronteer met bewijs: de beschadigde foto',
      confront: true,
      subject: 'Het oude schandaal',
      when: { chapter: 2, evidence: ['e_foto_2335'] },
      lines: [
        s('Ja, die is van mij! 23.35, "de laatste ronde". Met een bierkring, sorry.'),
        s('Milo kwam in augustus langs en kocht hem voor €50. "Historisch materiaal," zei hij. Ik vond het wel spannend, eerlijk gezegd.'),
      ],
    },
    {
      id: 'sanne_c2_tijd',
      label: 'Jouw foto bewijst dat de trofee om 23.35 nog op de bar stond.',
      subject: 'Het oude schandaal',
      when: { chapter: 2, puzzles: ['p_foto'], topics: ['sanne_c2_foto'] },
      lines: [
        s('Ja… en Glenns jas hangt er niet meer. Dus Glenn was al weg.'),
        s('Ja. Dat… weet ik.'),
        n('Ze kijkt niet op. Er zit meer achter.'),
      ],
    },
    {
      id: 'sanne_c3_stil',
      label: 'Sinds wanneer weet je dat?',
      subject: 'Het oude schandaal',
      when: { chapter: 3, topics: ['sanne_c2_tijd'] },
      lines: [
        s('Sinds de zomer van 2025. Ik maakte een collage en zag de klok.'),
        s('Ik heb het Rick verteld; we gingen toen nog een beetje met elkaar om. Hij zei: "Laat het rusten, Sanne. Glenn heeft betaald, het is klaar."'),
        s('Dus ik liet het rusten. Ik schaam me dood.'),
      ],
    },
    {
      id: 'sanne_c3_yvan',
      label: 'Wat weet je over Yvan en de Golden Cock?',
      subject: 'Het geld',
      when: { chapter: 3 },
      lines: [
        s('Yvan was de Ceremoniemeester. Hij poetste die trofee elke maand, met een speciaal doekje.'),
        s('Toen hij verdween, was Yvan er het kapotst van. Zei hij. Hij heeft een week zijn cape niet gedragen.'),
      ],
    },
    {
      id: 'sanne_c4_alibi',
      label: 'Waar was je tussen 21.31 en 21.42?',
      subject: 'Alibi',
      when: { chapter: 4 },
      lines: [
        s('Eerst "Total Eclipse" met Glenn, daarna dansen. Om 21.41 heb ik een selfie gemaakt met Jolien, bij het podium.'),
        s('Daarna ben ik blijven dansen tot iemand gilde.'),
      ],
    },
    {
      id: 'sanne_c4_gang',
      label: 'Zag je iemand de gang in- of uitlopen tussen 21.30 en 21.45?',
      subject: 'De moordavond',
      when: { chapter: 4 },
      lines: [
        s('Vanaf het podium zie je de gang maar half. Rond 21.37 zag ik Stefan van de voordeur naar de bar lopen, met zijn telefoon aan zijn oor.'),
        s('Verder niemand. Ik had mijn ogen dicht bij Total Eclipse. Dat hoort zo.'),
      ],
    },
  ],

  // =====================================================================
  alex: [
    {
      id: 'alex_c1_intro',
      label: 'Stel jezelf even voor.',
      subject: 'Kennismaking',
      when: {},
      lines: [
        s('Alex. Sleutelmeester van de Brotherhood. Ja, dat is een officiële titel. Ik heb er een lanyard voor.'),
        s('Ik heb de deur geopend. Dat beeld krijg ik niet meer uit mijn hoofd.'),
      ],
    },
    {
      id: 'alex_c1_sleutel',
      label: 'Hoe zit het met de sleutel van de achterkamer?',
      subject: 'De sleutel',
      when: {},
      lines: [
        s('Er is één Brotherhood-sleutel, aan een rood koord. Om 20.10 heb ik hem aan Milo gegeven.'),
        s('Er is ook een reservesleutel, in het kantoor van Bennie. Die heb ik om 21.44 van hem gekregen.'),
      ],
    },
    {
      id: 'alex_c1_milo2122',
      label: 'Wanneer sprak je Milo voor het laatst?',
      subject: 'Het slachtoffer',
      when: {},
      lines: [
        s('Om 21.22, aan de bar. Hij haalde een whisky. Hij droeg de sleutel om zijn nek, als een medaille.'),
        s('Hij zei: "J. is al geweest. Nog één afspraak en dan wordt het showtime." Ik vroeg niet door. Ik vraag nooit door. Dat is mijn kracht.'),
      ],
      effects: { evidence: ['e_v_alex_2122'] },
    },
    {
      id: 'alex_c1_vondst',
      label: 'Vertel over de ontdekking.',
      subject: 'De moordavond',
      when: {},
      lines: [
        s('Maureen kwam om 21.41 naar me toe, ze maakte zich zorgen. Om 21.42 hebben we geklopt. Niets.'),
        s('Ik heb bij Bennie de reservesleutel gehaald. Om 21.45 deed ik open. Milo lag op de grond, de Golden Cock naast hem.'),
        s('Ik heb naar het koord gezocht. Uit gewoonte. Zijn sleutel was weg.'),
      ],
    },
    {
      id: 'alex_c2_huur',
      label: 'Confronteer met bewijs: "€100" in het sleutellogboek',
      confront: true,
      subject: 'De sleutel',
      when: { chapter: 2, evidence: ['e_sleutellog'] },
      lines: [
        s('Doorgestreept. Dat telt niet.'),
        d('Het telt wel.'),
        s('…Milo betaalde me €100 om de achterkamer te gebruiken. De Brotherhood mag dat niet weten. Het is ons heiligdom. Maar €100 is €100.'),
      ],
    },
    {
      id: 'alex_c2_2024',
      label: 'Wie had in 2024 toegang tot de trofee?',
      subject: 'Het oude schandaal',
      when: { chapter: 2 },
      lines: [
        s('Iedereen. Na de ceremonie van tien uur stond de Golden Cock op de bar, zoals altijd. De achterkamer stond die avond open.'),
        s('Om 23.55 sloot ik af. Toen was de trofee al weg. Ik heb het netjes genoteerd.'),
      ],
    },
    {
      id: 'alex_c3_sporttas',
      label: 'Zag je in 2024 iemand met iets zwaars vertrekken?',
      subject: 'Het geld',
      when: { chapter: 3, evidence: ['e_verkoop'] },
      lines: [
        s('…Nu je het zo vraagt. Om kwart voor twaalf, net na de reprise, zag ik Yvan met zijn sporttas naar zijn auto lopen.'),
        s('Hij droeg hem met twee handen. Ik dacht: poolkeu. Een poolkeu weegt geen drie kilo.'),
      ],
      effects: { evidence: ['e_v_alex_sporttas'] },
    },
    {
      id: 'alex_c3_brotherhood',
      label: 'Wie zijn de leden van de Brotherhood?',
      subject: 'Kennismaking',
      when: { chapter: 3 },
      lines: [
        s('Vier. Rick, Grootmeester. Stefan, Penningmeester. Yvan, Ceremoniemeester. En ik, Sleutelmeester.'),
        s('In 2023 kregen we allemaal gouden manchetknopen met ons logo. Ik draag ze nooit. Ik draag T-shirts.'),
      ],
    },
    {
      id: 'alex_c4_alibi',
      label: 'Waar was je tussen 21.31 en 21.42?',
      subject: 'Alibi',
      when: { chapter: 4 },
      lines: [
        s('Achter de bar, vanaf 21.25. Bennie moest een vat wisselen en dat ding is zwaarder dan hij denkt.'),
        s('Ik ben niet weggeweest tot Maureen kwam. Bennie kan het bevestigen.'),
      ],
    },
    {
      id: 'alex_c4_manchet',
      label: 'Confronteer met bewijs: de manchetknoop',
      confront: true,
      subject: 'Fysiek bewijs',
      when: { chapter: 4, evidence: ['e_manchetknoop'] },
      lines: [
        s('Dat is een Brotherhood-knoop. De mijne liggen thuis in het doosje, in de la. Ik kan het laten zien.'),
        s('Rick verloor er een in 2024, bij de Bazooka. Die draagt hij sindsdien als "statement".'),
      ],
    },
    {
      id: 'alex_c4_jas',
      label: 'Confronteer met bewijs: de sleutel in Stefans jas',
      confront: true,
      subject: 'De sleutel',
      when: { chapter: 4, evidence: ['e_sleutel_jas'] },
      lines: [
        s('In de jas van Stefan? Stefan hangt zijn jas altijd aan de eerste haak, vlak bij de gang.'),
        s('Iedereen weet welke jas van hem is. Kameelhaar, €400. Hij praat er de hele tijd over.'),
      ],
    },
  ],

  // =====================================================================
  jolien: [
    {
      id: 'jolien_c1_intro',
      label: 'Stel jezelf even voor.',
      subject: 'Kennismaking',
      when: {},
      lines: [s('Jolien. Fotografe. Ik ben hier om te werken.'), n('Ze zegt verder niets. De stilte duurt lang.')],
    },
    {
      id: 'jolien_c1_foto',
      label: 'Heb je vanavond veel gefotografeerd?',
      subject: 'De moordavond',
      when: {},
      lines: [
        s('Honderdzestig foto\'s. Elke foto met tijdstempel. De camera loopt gelijk met de atoomklok; ik controleer dat elke maand.'),
        s('Als je wilt weten wie waar stond: vraag het me. Of beter: vraag het de camera.'),
      ],
    },
    {
      id: 'jolien_c1_milo',
      label: 'Wat vond je van Milo?',
      subject: 'Het slachtoffer',
      when: {},
      lines: [s('Hij was een verhaal op zoek naar een slachtoffer.'), s('Sorry. Verkeerde woordkeuze.')],
    },
    {
      id: 'jolien_c2_ingehuurd',
      label: 'Waarom was jij de fotograaf vanavond?',
      subject: 'Het slachtoffer',
      when: { chapter: 2 },
      lines: [
        s('Milo huurde me in. €250. Hij wilde vooral foto\'s om 22.00 uur, van iedereen tegelijk.'),
        s('"Ik wil de gezichten zien als de waarheid binnenkomt." Dat zei hij letterlijk.'),
      ],
    },
    {
      id: 'jolien_c2_2024',
      label: 'Was jij er in 2024 ook?',
      subject: 'Het oude schandaal',
      when: { chapter: 2 },
      lines: [
        s('Als gast. Zonder camera, voor het eerst in jaren. Ironisch.'),
        s('Sanne fotografeerde met haar telefoon. Die foto van 23.35 is van haar. Jessica filmde. Iedereen filmt.'),
      ],
    },
    {
      id: 'jolien_c3_jessica',
      label: 'Heb je Jessica rond 21.05 gefotografeerd?',
      subject: 'De moordavond',
      when: { chapter: 3, anyEvidence: ['e_v_sanne_2109', 'e_afpersing'] },
      lines: [
        n('Jolien zucht. Ze scrolt door haar camera.'),
        s('Ja. Ze liep de gang in met een envelop. Ik heb hem niet in mijn selectie gezet. Ze is mijn vriendin.'),
        s('Hier. Hij is onscherp. Net als zij, vanavond.'),
      ],
      effects: { evidence: ['e_foto_2105'] },
    },
    {
      id: 'jolien_c3_rick',
      label: 'Is je rond 21.15 iets opgevallen?',
      subject: 'De moordavond',
      when: { chapter: 3 },
      lines: [
        s('Het podium was leeg van 21.14 tot 21.17. Geen presentator. De karaoke-machine speelde in zijn eentje een intro.'),
        s('Rick kwam terug met een rood hoofd. Hij heeft "The Final Countdown" gezongen alsof het een oorlogsverklaring was.'),
      ],
    },
    {
      id: 'jolien_c4_alibi',
      label: 'Waar was je tussen 21.31 en 21.42?',
      subject: 'Alibi',
      when: { chapter: 4 },
      lines: [
        s('Overal in de grote zaal. Nooit in de gang. Kijk naar mijn cameralog: om de paar minuten een foto, allemaal in de zaal.'),
        s('Die camera is mijn alibi. En om 21.41 sta ik zelf op Sannes selfie.'),
      ],
    },
    {
      id: 'jolien_c4_pool',
      label: 'Wie speelden er vanavond pool?',
      subject: 'Fysiek bewijs',
      when: { chapter: 4 },
      lines: [
        s('Yvan en Daniëlle, van 20.40 tot 21.05. Yvan won, natuurlijk. Hij krijt na elke stoot. Tic.'),
        s('Verder niemand. Die tafel is heilig voor die twee. Hier, 20.52.'),
      ],
      effects: { evidence: ['e_foto_2052'] },
    },
    {
      id: 'jolien_c4_2152',
      label: 'Confronteer met bewijs: je foto van 21.52',
      confront: true,
      subject: 'Fysiek bewijs',
      when: { chapter: 4, evidence: ['e_foto_2152'] },
      lines: [
        s('Chaos. Iedereen in de gang. Ik fotografeer altijd door; zo ben ik.'),
        s('Ik zie dingen pas als ik inzoom. Doe dat ook. Mouwen, handen, haar. De camera onthoudt wat mensen vergeten.'),
      ],
    },
  ],

  // =====================================================================
  rick: [
    {
      id: 'rick_c1_intro',
      label: 'Stel jezelf even voor.',
      subject: 'Kennismaking',
      when: {},
      lines: [
        s('RICK VAN DER VEEN! Grootmeester van de Brotherhood! Applaus mag.'),
        n('Niemand klapt.'),
        s('Sorry. Dat doe ik als ik zenuwachtig ben.'),
      ],
    },
    {
      id: 'rick_c1_avond',
      label: 'Wat deed je vanavond?',
      subject: 'De moordavond',
      when: {},
      lines: [
        s('Karaoke gepresenteerd. Vanaf negen uur. Ik heb het podium geen moment verlaten. Echt niet.'),
        s('Een presentator laat zijn publiek niet in de steek. Dat is regel één van Rick\'s Events.'),
      ],
    },
    {
      id: 'rick_c1_milo',
      label: 'Wat wist je van Milo\'s onthulling?',
      subject: 'Het slachtoffer',
      when: {},
      lines: [
        s('Niks. Hij deed er geheimzinnig over. "De waarheid over de Night of Absolute Bullshit."'),
        s('Er ís geen waarheid! Het was een feest! Feesten hebben geen waarheid, alleen kater.'),
      ],
    },
    {
      id: 'rick_c1_2024',
      label: 'Jij organiseerde de avond van 2024?',
      subject: 'Het oude schandaal',
      when: {},
      lines: [
        s('Ja. Beste avond ooit. Quiz, ceremonie, een spektakel om tien voor elf.'),
        s('Er ging wat kapot, dat hoort erbij. Glenn heeft het netjes betaald. Toch?'),
      ],
    },
    {
      id: 'rick_c2_bazooka',
      label: 'Confronteer met bewijs: het originele rapport noemt jouw Bazooka',
      confront: true,
      subject: 'Het oude schandaal',
      when: { chapter: 2, evidence: ['e_origineel'] },
      lines: [
        s('Oké. De Bazooka. Een confettikanon met een subwoofer erin, voor de dramatische BOEM.'),
        s('Hij trok de halve geluidsinstallatie mee. Een tafel, twee stoelen, een speaker. Maar ik heb niets vervalst! Ik heb gewoon… niet gezegd dat het anders was.'),
        s('Hier, mijn draaiboek. Kijk: 22.45 de Bazooka, 23.40 de reprise. Met de lichten uit. Dat was het beste moment van de avond.'),
      ],
      effects: { evidence: ['e_programma'] },
    },
    {
      id: 'rick_c2_deur',
      label: 'Iemand hoorde je om 21.15 bij de achterkamer.',
      subject: 'De moordavond',
      when: { chapter: 2, topics: ['maureen_c2_rick'] },
      lines: [
        s('…Maureen. Natuurlijk Maureen.'),
        s('Ja. Om 21.15 heb ik op die deur gebonkt. "Waag het niet, Milo!" Ik wilde niet dat hij de Bazooka zou noemen.'),
        s('Ik heb een eventbureau. "Rick\'s Events: veilig feesten sinds 2019." Snap je? Hij deed niet open. Ik ben teruggegaan en heb de Final Countdown gezongen.'),
      ],
    },
    {
      id: 'rick_c3_sanne',
      label: 'Sanne zegt dat jij haar vroeg te zwijgen over haar foto.',
      subject: 'Het oude schandaal',
      when: { chapter: 3, topics: ['sanne_c3_stil'] },
      lines: [
        s('Ja. Glenn had betaald, de Brotherhood was gered, iedereen was blij.'),
        s('Behalve Glenn. Oké, ik ben een slecht mens. Maar geen moordenaar. Er zit een verschil tussen zwijgen en slaan.'),
      ],
    },
    {
      id: 'rick_c3_golden',
      label: 'Wat betekende de Golden Cock voor de Brotherhood?',
      subject: 'Het geld',
      when: { chapter: 3 },
      lines: [
        s('Alles. Ons heiligste voorwerp. 3,4 kilo messing met een laag goud. Je kunt er een deur mee openslaan.'),
        s('Yvan leidde de ceremonie; hij was er het meest aan gehecht. Toen hij weg was, hebben we een week gerouwd. Met bier.'),
      ],
    },
    {
      id: 'rick_c4_alibi',
      label: 'Waar was je tussen 21.31 en 21.42?',
      subject: 'Alibi',
      when: { chapter: 4 },
      lines: [
        s('Podium. Microfoon. Elke aankondiging, van 21.20 tot het gegil.'),
        s('Kijk naar elke foto van Jolien: ik sta erop, met mijn vlinderdas. Deze keer echt.'),
      ],
    },
    {
      id: 'rick_c4_manchet',
      label: 'Confronteer met bewijs: de manchetknoop',
      confront: true,
      subject: 'Fysiek bewijs',
      when: { chapter: 4, evidence: ['e_manchetknoop'] },
      lines: [
        s('Ik heb er maar één, al sinds 2024. De andere schoot weg toen de Bazooka afging. Nooit meer teruggevonden.'),
        s('Ik draag hem links. Kijk maar naar elke foto van vanavond: links, altijd links.'),
      ],
    },
    {
      id: 'rick_c4_verlies',
      label: 'Wie had vanavond het meeste te verliezen?',
      subject: 'De moordavond',
      when: { chapter: 4 },
      lines: [
        s('Iedereen. Stefan zijn baan. Jessica haar volgers. Ik mijn bedrijf. Maureen haar reputatie als de eerlijkste van de groep.'),
        s('En Yvan zou eindelijk moeten uitleggen hoe zijn heilige trofee kwijt kon raken. Alleen Glenn had niets te verliezen. Die zou eindelijk gelijk krijgen.'),
      ],
    },
  ],

  // =====================================================================
  yvan: [
    {
      id: 'yvan_c1_intro',
      label: 'Stel jezelf even voor.',
      subject: 'Kennismaking',
      when: {},
      lines: [
        s('Yvan Hoving, Ceremoniemeester. Ik leidde vroeger de Ceremonie van de Golden Cock. Met cape. Die cape heb ik nog.'),
        s('Kan ik iets voor je halen? Koffie? Ik help graag.'),
      ],
    },
    {
      id: 'yvan_c1_avond',
      label: 'Wat deed je vanavond?',
      subject: 'De moordavond',
      when: {},
      lines: [
        s('Pool gespeeld met Daniëlle, tot een uur of vijf over negen. Gewonnen, uiteraard. Daarna aan de Brotherhood-tafel.'),
        s('Rond half tien ben ik buiten gaan roken. Toen ik binnenkwam, was het al chaos.'),
      ],
    },
    {
      id: 'yvan_c1_trofee',
      label: 'Naast het lichaam lag de Golden Cock.',
      subject: 'Het slachtoffer',
      when: {},
      lines: [
        s('Ik zag hem pas toen iedereen in de gang stond. Tweeënhalf jaar weg, en dan dít.'),
        s('Ik weet niet hoe Milo eraan kwam. Hij zal hem ergens op de kop hebben getikt. Dat was zijn ding: dingen opduiken.'),
      ],
    },
    {
      id: 'yvan_c1_glenn',
      label: 'Hoe sta je tegenover Glenn?',
      subject: 'Persoonlijk',
      when: {},
      lines: [
        s('Glenn is mijn beste vriend. We openen volgende maand samen een brouwerij: De Vrije Haan.'),
        s('Ik heb altijd gezegd dat hij het niet gedaan kon hebben. Altijd.'),
      ],
    },
    {
      id: 'yvan_c2_ceremonie',
      label: 'Wat gebeurde er in 2024 met de trofee?',
      subject: 'Het oude schandaal',
      when: { chapter: 2 },
      lines: [
        s('Om tien uur deed ik de ceremonie. Daarna ging de trofee op de bar, zoals altijd. Om tien voor twaalf was hij weg.'),
        s('Volgens het Black Book om 23.20. Ik heb nooit begrepen waarom die tijden niet klopten. Ik heb er niet over doorgevraagd.'),
      ],
    },
    {
      id: 'yvan_c2_blackbook',
      label: 'Confronteer met bewijs: het officiële Black Book',
      confront: true,
      subject: 'Het oude schandaal',
      when: { chapter: 2, evidence: ['e_blackbook'] },
      lines: [
        s('Het noemt Glenn. Ik heb toen tegen Stefan gezegd: "Weet je het zeker?" Hij zei ja.'),
        s('Wie ben ik om de penningmeester tegen te spreken? Hij is van de cijfers. Ik ben van de cape.'),
      ],
    },
    {
      id: 'yvan_c3_klokgieter',
      label: 'Confronteer met bewijs: de betaling van verzamelaar Klokgieter',
      confront: true,
      subject: 'Het geld',
      when: { chapter: 3, evidence: ['e_klokgieter'] },
      lines: [
        s('Klokgieter? Nooit van gehoord. Dat is Daniëlles wereld, al die verzamelaars.'),
        s('Als zij dat ding verkocht heeft, moet je haar vragen hoe ze eraan kwam. Niet mij.'),
        n('Hij glimlacht. Zijn duim wrijft over zijn manchet.'),
      ],
    },
    {
      id: 'yvan_c3_schuld',
      label: 'Confronteer met bewijs: de verkoopverklaring van Daniëlle',
      confront: true,
      subject: 'Het geld',
      when: { chapter: 3, evidence: ['e_verkoop'] },
      lines: [
        s('…Ja, ik verloor in maart 2024 €400 van Daniëlle. Een weddenschap op de zwarte bal. Ik had het geld niet.'),
        s('Maar dat ik haar iets gaf, betekent niet dat ik iets gestolen heb. Misschien vond ik hem. Misschien…'),
        n('Hij maakt de zin niet af.'),
      ],
    },
    {
      id: 'yvan_c3_bekentenis',
      label: 'Confronteer met bewijs: Alex zag je sporttas',
      confront: true,
      subject: 'Het geld',
      when: { chapter: 3, evidence: ['e_v_alex_sporttas'], topics: ['yvan_c3_schuld'] },
      lines: [
        n('Yvan is een tijd stil.'),
        s('Oké. Oké. Ik heb hem meegenomen. Tijdens de reprise, om 23.40, met de lichten uit.'),
        s('Het was een grap. Ik wilde hem de week erna "terugvinden" tijdens een speciale ceremonie. Een comeback. Met cape.'),
        s('Toen las ik het Black Book. Glenn de schuld. En ik… ik heb niets gezegd. Ik had nog die schuld bij Daniëlle, dus ik heb haar de trofee gegeven. Ik wist niet dat ze hem zou verkopen.'),
        s('Maar Milo vermoorden? Voor een grap van tweeënhalf jaar geleden? Kom op.'),
      ],
    },
    {
      id: 'yvan_c3_glenn',
      label: 'Weet Glenn dit?',
      subject: 'Persoonlijk',
      when: { chapter: 3, topics: ['yvan_c3_bekentenis'] },
      lines: [
        s('Nee. En hij mag het niet weten. Niet zo.'),
        s('Hij heeft zijn spaargeld in onze brouwerij gestoken. Ik wilde het hem zelf vertellen. Ooit. Na de opening. Of na de eerste winst.'),
      ],
    },
    {
      id: 'yvan_c4_alibi',
      label: 'Waar was je tussen 21.31 en 21.42?',
      subject: 'Alibi',
      when: { chapter: 4 },
      lines: [
        s('Buiten. Voorterras, onder de luifel. Van ongeveer 21.25 tot 21.47. Twee sigaretten, misschien drie. Het motregende.'),
        s('Toen ik binnenkwam, gilde iedereen.'),
      ],
    },
    {
      id: 'yvan_c4_bericht',
      label: 'Confronteer met bewijs: het bericht aan "🐓"',
      confront: true,
      subject: 'De moordavond',
      when: { chapter: 4, evidence: ['e_telefoon', 'e_contacten'] },
      lines: [
        s('Dat nummer… ja, dat is van mij. Ik heb dat bericht gelezen.'),
        s('Ik ben niet gegaan. Ik ben buiten gaan roken om na te denken. Ik dacht: om tien uur komt alles uit, laat maar komen.'),
      ],
    },
    {
      id: 'yvan_c4_manchet',
      label: 'Confronteer met bewijs: de manchetknoop',
      confront: true,
      subject: 'Fysiek bewijs',
      when: { chapter: 4, evidence: ['e_manchetknoop'] },
      lines: [
        s('Een Brotherhood-knoop? Die van mij ben ik al in 2024 kwijtgeraakt. Bij de Bazooka. Net als Rick.'),
        n('Hij trekt zijn mouwen over zijn polsen.'),
      ],
    },
    {
      id: 'yvan_c4_foto2110',
      label: 'Confronteer met bewijs: de foto van 21.10',
      confront: true,
      subject: 'Fysiek bewijs',
      when: { chapter: 4, evidence: ['e_foto_2110'], topics: ['yvan_c4_manchet'] },
      lines: [
        d('Op de foto van 21.10 draag je er twee.'),
        s('Dan… dan ben ik hem vanavond verloren. Bij de pooltafel. Of buiten. Hij kan overal liggen.'),
        s('Dit bewijst niks. Iedereen kan een knoop verliezen.'),
      ],
    },
    {
      id: 'yvan_c4_stefan',
      label: 'Confronteer met bewijs: Stefan stond op het voorterras',
      confront: true,
      subject: 'Alibi',
      when: { chapter: 4, evidence: ['e_v_stefan_voordeur'], topics: ['yvan_c4_alibi'] },
      lines: [
        d('Stefan stond van 21.29 tot 21.37 op het voorterras. Hij zag niemand.'),
        s('Dan stond ik om de hoek. Bij de fietsen. Daar is het droger.'),
        n('Op de plattegrond staan de fietsen óók onder de luifel van het voorterras.'),
      ],
    },
    {
      id: 'yvan_c4_garderobe',
      label: 'Confronteer met bewijs: Daniëlle zag je bij de garderobe',
      confront: true,
      subject: 'De sleutel',
      when: { chapter: 4, evidence: ['e_v_danielle_garderobe'] },
      lines: [
        s('Ik pakte sigaretten uit mijn jas. Mijn jas hangt naast die van Stefan. Mag ik geen sigaretten pakken?'),
        d('Je zei dat je van 21.25 tot 21.47 buiten stond.'),
        s('Even naar binnen, even naar buiten. Wie houdt dat nou bij?'),
      ],
    },
  ],

  // =====================================================================
  maureen: [
    {
      id: 'maureen_c1_intro',
      label: 'Stel jezelf even voor.',
      subject: 'Kennismaking',
      when: {},
      lines: [
        s('Maureen Nieuwold. Archivaris. Drie dingen over mij.'),
        s('Eén: ik bewaar alles. Twee: ik lieg niet. Drie: ik heb het lichaam gevonden, samen met Alex.'),
      ],
    },
    {
      id: 'maureen_c1_bericht',
      label: 'Je kreeg om 21.31 een bericht van Milo?',
      subject: 'Het slachtoffer',
      when: {},
      lines: [
        s('"Nog een half uur. Heb jij het origineel nog veilig? Er wordt geklopt, straks meer."'),
        s('Ik antwoordde om 21.33. Geen reactie. Milo reageerde altijd binnen een minuut. Om 21.41 ben ik naar Alex gegaan.'),
      ],
    },
    {
      id: 'maureen_c1_origineel',
      label: 'Wat bedoelde Milo met "het origineel"?',
      subject: 'Het oude schandaal',
      when: {},
      lines: [
        s('Daar kom ik op terug als het nodig is.'),
        s('Archiefstukken hebben een bewaartermijn. Mijn geheimen ook.'),
      ],
    },
    {
      id: 'maureen_c1_2024',
      label: 'Wat weet jij van 2024?',
      subject: 'Het oude schandaal',
      when: {},
      lines: [
        s('Ik heb die nacht samen met Bennie een incidentrapport opgesteld, om kwart over twaalf. Met de hand. In blokletters.'),
        s('Meer zeg ik er nu niet over. Punt.'),
      ],
    },
    {
      id: 'maureen_c2_origineel',
      label: 'Confronteer met bewijs: het originele rapport',
      confront: true,
      subject: 'Het oude schandaal',
      when: { chapter: 2, evidence: ['e_origineel'] },
      lines: [
        s('Mijn handschrift. Ja.'),
        s('Ik gaf Stefan een kopie voor het Black Book. Twee weken later stond er iets heel anders in. Met mijn paraaf erbij, die ik er nooit heb gezet.'),
        s('Ik heb het origineel bewaard. Tweeënhalf jaar. In map 2024-04, tussen de kerstkaarten.'),
      ],
    },
    {
      id: 'maureen_c2_rick',
      label: 'Hoorde je vanavond iets bij de achterkamer?',
      subject: 'De moordavond',
      when: { chapter: 2 },
      lines: [
        s('Om 21.15 ging ik naar het toilet. Rick stond bij de achterkamer op de deur te bonken. "Waag het niet, Milo!"'),
        s('Ik heb gedaan alsof ik niets hoorde. Daar ben ik goed in. Dat is, achteraf gezien, het probleem.'),
      ],
    },
    {
      id: 'maureen_c3_stilte',
      label: 'Waarom zei je al die tijd niets?',
      subject: 'Het oude schandaal',
      when: { chapter: 3, topics: ['maureen_c2_origineel'] },
      lines: [
        s('Toen ik het Black Book las, ben ik naar Stefan gegaan. Hij zei: "Als dit uitkomt, valt de Brotherhood uit elkaar. Glenn betaalt, ik los het intern op."'),
        s('Ik heb het origineel in mijn archief gelegd en gezwegen. Punt één: dat was laf. Punt twee: ik heb het in september aan Milo gegeven. Punt drie: dat maakt het niet goed.'),
      ],
      effects: { evidence: ['e_v_maureen_stilte'] },
    },
    {
      id: 'maureen_c3_milo',
      label: 'Hoe kwam Milo aan jouw origineel?',
      subject: 'Het slachtoffer',
      when: { chapter: 3 },
      lines: [
        s('Hij vond me via het streekarchief. Hij wist al veel: de factuur, de foto van Sanne. Hij zei: "Maureen, jij bent de enige die de waarheid heeft bewaard."'),
        s('Ik voelde me gevleid. Ik heb het hem in september gegeven. Zelf heb ik een kopie, natuurlijk. Die zat vanavond in mijn tas.'),
      ],
    },
    {
      id: 'maureen_c4_alibi',
      label: 'Waar was je tussen 21.31 en 21.42?',
      subject: 'Alibi',
      when: { chapter: 4 },
      lines: [
        s('Eén: 21.33 aan het zijtafeltje, telefoon in de hand. Twee: 21.38 "Bohemian Rhapsody", ingekort tot drie minuten op mijn verzoek.'),
        s('Drie: om 21.41 naar Alex aan de bar. Vanaf dan was ik bij hem, tot de deur openging.'),
      ],
    },
    {
      id: 'maureen_c4_contacten',
      label: 'Jij beheert de reünie-app?',
      subject: 'De moordavond',
      when: { chapter: 4 },
      lines: [
        s('Natuurlijk. Iemand moet het doen. Hier is de deelnemerslijst, met nummers.'),
        s('Ik archiveer alles. Ook dit.'),
      ],
      effects: { evidence: ['e_contacten'] },
    },
    {
      id: 'maureen_c4_klop',
      label: 'Milo schreef "Er wordt geklopt". Wat betekent dat?',
      subject: 'De moordavond',
      when: { chapter: 4, evidence: ['e_telefoon'] },
      lines: [
        s('Dat er om 21.31 iemand voor zijn deur stond. Iemand die hij verwachtte. Hij deed voor niemand anders open; dat zei hij de hele avond.'),
        s('Rick heeft om 21.15 gebonkt en kwam er niet in. Wie om 21.31 klopte, wel.'),
      ],
    },
  ],

  // =====================================================================
  danielle: [
    {
      id: 'danielle_c1_intro',
      label: 'Stel jezelf even voor.',
      subject: 'Kennismaking',
      when: {},
      lines: [
        s('Daniëlle Radtur, Radtur Retro: vintage met een verhaal. Visitekaartje?'),
        n('Ze heeft het al in je hand gedrukt.'),
      ],
    },
    {
      id: 'danielle_c1_avond',
      label: 'Wat deed je vanavond?',
      subject: 'De moordavond',
      when: {},
      lines: [
        s('Pool tegen Yvan, tot vijf over negen. Verloren. Hij heeft geluk, ik heb techniek.'),
        s('Daarna aan de bar. Bennie en ik hebben het over btw op tweedehands goederen gehad. Spannend, ik weet het.'),
      ],
    },
    {
      id: 'danielle_c1_milo',
      label: 'Kende je Milo?',
      subject: 'Het slachtoffer',
      when: {},
      lines: [s('Zakelijk. Hij kocht weleens iets. Hij vroeg veel.'), s('Te veel, als je het mij vraagt. Maar dat vraag je niet.')],
    },
    {
      id: 'danielle_c1_2024',
      label: 'En in 2024?',
      subject: 'Het oude schandaal',
      when: {},
      lines: [
        s('Ik was er. Ik ging om half één weg. Mooie avond, slechte confetti.'),
        s('Van een trofee weet ik niets.'),
        n('Ze kijkt je strak aan. Iets te strak.'),
      ],
    },
    {
      id: 'danielle_c2_yvan',
      label: 'Jij en Yvan spelen vaak pool?',
      subject: 'Persoonlijk',
      when: { chapter: 2 },
      lines: [
        s('Elke week. Hij is beter, maar hij gokt slechter. In maart 2024 verloor hij €400 van me op de zwarte bal.'),
        s('Hij heeft het betaald. Uiteindelijk. Op zijn manier.'),
      ],
    },
    {
      id: 'danielle_c3_400',
      label: 'Confronteer met bewijs: betaling van €400 door Klokgieter',
      confront: true,
      subject: 'Het geld',
      when: { chapter: 3, evidence: ['e_klokgieter'] },
      lines: [
        s('Oké, prima. Ik heb dat geld inderdaad ontvangen. €400 voor een gouden trofee. Dat is mijn vak.'),
        s('Maar dat betekent niet dat ik degene was die de trofee heeft gestolen. Ik had hem gekregen. Als betaling.'),
      ],
    },
    {
      id: 'danielle_c3_verkoop',
      label: 'Van wie kreeg je die trofee?',
      subject: 'Het geld',
      when: { chapter: 3, topics: ['danielle_c3_400'] },
      lines: [
        s('Milo kwam in september met precies die vraag. Hij liet me een verklaring tekenen. "Jij bent getuige, Daniëlle, geen dader," zei hij.'),
        s('Ik heb een kopie gehouden. Ik heb van alles een kopie. Hier. Ik zeg het je liever niet hardop.'),
      ],
      effects: { evidence: ['e_verkoop'] },
    },
    {
      id: 'danielle_c3_wist',
      label: 'Wist je dat het de gestolen Golden Cock was?',
      subject: 'Het geld',
      when: { chapter: 3, evidence: ['e_verkoop'] },
      lines: [
        s('Ik vermoedde het. Het ding woog drie kilo en had een logo met "B.o.B.". Het hele groepsapp stond er vol van.'),
        s('Ik heb niet doorgevraagd. Een schuld is een schuld.'),
      ],
    },
    {
      id: 'danielle_c4_alibi',
      label: 'Waar was je tussen 21.31 en 21.42?',
      subject: 'Alibi',
      when: { chapter: 4 },
      lines: [
        s('Aan de bar. Van vijf over negen tot het gegil.'),
        s('Bennie kan het zeggen; ik heb hem een half uur lang verveeld met btw-tarieven.'),
      ],
    },
    {
      id: 'danielle_c4_garderobe',
      label: 'Vanaf je barkruk zie je de garderobe. Zag je iemand?',
      subject: 'De sleutel',
      when: { chapter: 4 },
      lines: [
        s('Om 21.41 — Maureen begon net aan de bar over Milo — zag ik Yvan bij de garderobe in de gang. Hand in een jas, eerste rij.'),
        s('Ik dacht: sigaretten. Een minuut later was hij weg en voelde ik tocht. De achterdeur.'),
      ],
      effects: { evidence: ['e_v_danielle_garderobe'] },
    },
    {
      id: 'danielle_c4_krijt',
      label: 'Confronteer met bewijs: biljartkrijt op het wapen',
      confront: true,
      subject: 'Fysiek bewijs',
      when: { chapter: 4, evidence: ['e_wapen'] },
      lines: [
        s('Blauw krijt? Dan moet je bij de pooltafel zijn. Vanavond speelden alleen Yvan en ik.'),
        s('Ik heb daarna meteen mijn handen gewassen. Ik zit niet met blauwe vingers aan een wijnglas. Kijk maar op de foto\'s.'),
      ],
    },
  ],

  // =====================================================================
  stefan: [
    {
      id: 'stefan_c1_intro',
      label: 'Stel jezelf even voor.',
      subject: 'Kennismaking',
      when: {},
      lines: [
        s('Stefan Alting, penningmeester. Ik beheer de kas en het Black Book.'),
        s('Allebei kloppen ze. Voor de duidelijkheid. Mag ik even gaan zitten?'),
      ],
    },
    {
      id: 'stefan_c1_avond',
      label: 'Wat deed je vanavond?',
      subject: 'De moordavond',
      when: {},
      lines: [
        s('Ik zat aan de Brotherhood-tafel tot een uur of half tien. Toen moest ik bellen. Daarna aan de bar.'),
        s('Ik heb een bonnetje, als dat helpt. Ik heb altijd een bonnetje.'),
      ],
    },
    {
      id: 'stefan_c1_milo',
      label: 'Wat wist je van Milo\'s onthulling?',
      subject: 'Het slachtoffer',
      when: {},
      lines: [
        s('Milo had me gemaild: "Ik heb het origineel." Ik weet niet welk origineel.'),
        s('Er zijn veel originelen. Alles is ergens een origineel van.'),
        n('Er parelt zweet op zijn bovenlip.'),
      ],
    },
    {
      id: 'stefan_c1_blackbook',
      label: 'Wat is het Black Book?',
      subject: 'Het oude schandaal',
      when: {},
      lines: [
        s('Het officiële verslagboek van de Brotherhood, sinds 2015. Ik schrijf het, ik bewaar het. Het is heilig.'),
        s('Na 2024 staat erin dat Glenn de schade veroorzaakte. Dat is… wat erin staat.'),
      ],
    },
    {
      id: 'stefan_c2_vervalst',
      label: 'Confronteer met bewijs: jouw rapport wijkt op zeven punten af',
      confront: true,
      subject: 'Het oude schandaal',
      when: { chapter: 2, puzzles: ['p_diff'] },
      lines: [
        n('Stefan legt zijn handen plat op tafel om het trillen te stoppen.'),
        s('Goed. Het rapport is aangepast. Door mij.'),
        s('De kas was leeg. Ik had in februari €480 geleend, voor BullshitCoin. Tijdelijk! Als de Brotherhood de schade had moeten betalen, was dat uitgekomen.'),
        s('Glenn was geen lid. Ik dacht: hij betaalt, ik vul de kas aan, niemand merkt iets. Hier is het kasboek. Ik heb het nooit terug kunnen storten.'),
      ],
      effects: { evidence: ['e_kasboek'] },
    },
    {
      id: 'stefan_c2_tijd',
      label: 'Waarom schreef je dat de trofee om 23.20 verdween?',
      subject: 'Het oude schandaal',
      when: { chapter: 2, topics: ['stefan_c2_vervalst'] },
      lines: [
        s('Glenn ging om half twaalf weg. Als de trofee daarvoor verdween, was het logisch dat hij…'),
        s('Ik wist niet wie hem had gepakt. Echt niet. Ik heb een tijd gekozen die paste. Het rapport moest kloppen. Dat het niet wáár was, was een ander probleem.'),
      ],
    },
    {
      id: 'stefan_c3_150',
      label: 'Confronteer met bewijs: €150 aan Jessica',
      confront: true,
      subject: 'Het geld',
      when: { chapter: 3, evidence: ['e_bank_bob'] },
      lines: [
        s('Jessica had de Bazooka gefilmd. Als die video uitkwam, klopte mijn rapport niet meer.'),
        s('€150 en ze wiste hem. Dacht ik. Ik heb het "reiniging kleding" genoemd en bij Glenns rekening opgeteld. Zo kostte het de kas niets.'),
      ],
    },
    {
      id: 'stefan_c3_milo',
      label: 'Wist je dat Milo jou zou ontmaskeren?',
      subject: 'Het slachtoffer',
      when: { chapter: 3 },
      lines: [
        s('Hij mailde me in september. Ik heb hem niets betaald, als je dat wilt weten. Hij vroeg ook niets. Dat was nog enger.'),
        s('Ik heb hem gesmeekt mij eruit te laten. Hij zei: "Iedereen krijgt wat hij verdient, Stefan." Ik werk bij een accountantskantoor. Ik ben penningmeester van de voetbalclub. Begrijp je?'),
      ],
    },
    {
      id: 'stefan_c4_alibi',
      label: 'Waar was je tussen 21.31 en 21.42?',
      subject: 'Alibi',
      when: { chapter: 4 },
      lines: [
        s('Van 21.29 tot 21.37 stond ik op het voorterras te bellen met mijn broer Martin. Ik vroeg of hij me geld kon lenen om de kas terug te storten. Vóór tienen. Dom, ik weet het.'),
        s('Toen naar binnen. Bier en een jenever. Pinbon van 21.38. Daarna ben ik aan de bar gebleven.'),
      ],
      effects: { evidence: ['e_pinbon'] },
    },
    {
      id: 'stefan_c4_voordeur',
      label: 'Was er nog iemand op het voorterras?',
      subject: 'Alibi',
      when: { chapter: 4, topics: ['stefan_c4_alibi'] },
      lines: [
        s('Nee. Niemand. Niemand die rookte, niemand bij de fietsen.'),
        s('Ik zou het geroken hebben. Ik haat rook. Ik had er iets van gezegd.'),
      ],
      effects: { evidence: ['e_v_stefan_voordeur'] },
    },
    {
      id: 'stefan_c4_sleutel',
      label: 'Confronteer met bewijs: de sleutel in jouw jas',
      confront: true,
      subject: 'De sleutel',
      when: { chapter: 4, evidence: ['e_sleutel_jas'] },
      lines: [
        s('Ik heb die sleutel nooit aangeraakt! Mijn jas hing de hele avond in de gang. Iedereen kan erbij.'),
        s('Ik stond vanaf 21.38 aan de bar, vraag het Bennie! Iemand wil dat het op mij lijkt. En eerlijk: het lijkt ook op mij.'),
      ],
    },
    {
      id: 'stefan_c4_manchet',
      label: 'Confronteer met bewijs: de manchetknoop',
      confront: true,
      subject: 'Fysiek bewijs',
      when: { chapter: 4, evidence: ['e_manchetknoop'] },
      lines: [
        s('Ik heb ze allebei. Kijk. Links. Rechts.'),
        s('Ik heb ze vanavond geen moment afgedaan. Ik doe ze zelfs in bed bijna niet af.'),
      ],
    },
  ],
};
