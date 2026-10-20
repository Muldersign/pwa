import type { Suspect } from '../../engine/types';

// Alle personages zijn fictief. Wat zij in dit verhaal doen, zegt niets over
// echte personen met dezelfde naam.

export const suspects: Suspect[] = [
  {
    id: 'glenn',
    name: 'Glenn Mulder',
    epithet: 'Officieel "Hanendief" sinds 2024',
    age: 36,
    occupation: 'Brouwer in spe',
    bio: 'Volgens het Black Book was Glenn de schuldige van de Night of Absolute Bullshit. Hij betaalde €650 en kreeg een levenslange bijnaam. Binnenkort opent hij een eigen brouwerij.',
    personality: 'Droog, sarcastisch en een tikje verbitterd. Lacht om alles, behalve om 14 april 2024.',
    avatar: { skin: '#e8c4a0', hair: '#4a3222', hairStyle: 'short', accent: '#7a1f2b', accessory: 'beard' },
    statement: [
      { text: '"Milo zou mij vanavond eindelijk vrijpleiten. Waarom zou ik hem iets aandoen?"' },
      { when: { evidence: ['e_brief_glenn'] }, text: '"Milo beloofde me schriftelijk dat hij mijn naam zou zuiveren. En hij vroeg er ook nog geld voor."' },
      { when: { chapter: 4, topics: ['glenn_c4_alibi'] }, text: '"Van half tien tot kwart voor tien stond ik op dat podium te zingen. Dat kan de halve zaal bevestigen."' },
    ],
    motive: [
      { text: 'Nog onbekend.' },
      { when: { topics: ['glenn_c1_milo'] }, text: 'Wrok: Glenn draaide in 2024 op voor de schade. Milo hield hem nu aan het lijntje.' },
      { when: { topics: ['glenn_c2_geld'] }, text: 'Wrok en geld: Glenn betaalde €650 voor iets wat hij niet deed, en vanavond nog eens €200 aan Milo.' },
    ],
    alibi: [
      { text: 'Nog niet bevestigd.' },
      { when: { chapter: 4, topics: ['glenn_c4_alibi'] }, text: 'Volgens Glenn: karaoke op het podium (21.33–21.46).' },
      { when: { puzzles: ['p_alibi'] }, text: 'Bevestigd: karaokelog en foto\'s van 21.33 en 21.44.' },
    ],
    secrets: [
      { id: 'glenn_200', text: 'Betaalde Milo vanavond om 20.30 uur €200 contant aan "onderzoekskosten".', when: { topics: ['glenn_c2_geld'] } },
      { id: 'glenn_brouwerij', text: 'Investeerde €12.000 in een brouwerij, samen met een compagnon uit de vriendengroep.', when: { topics: ['glenn_c3_brouwerij'] } },
      { id: 'glenn_dreig', text: 'Stuurde Milo in september een boze, dreigende app.', when: { topics: ['glenn_c4_dreig'] } },
    ],
  },
  {
    id: 'jessica',
    name: 'Jessica Postema',
    epithet: 'Influencer (4.012 volgers)',
    age: 34,
    occupation: 'Contentcreator en stylist',
    bio: 'Jessica is altijd onberispelijk gekleed en filmt alles. In 2024 had ze het naar eigen zeggen vooral druk met haar "verpeste designerjas".',
    personality: 'Snel, gevat en defensief. Draait elk ongemakkelijk onderwerp om naar mode.',
    avatar: { skin: '#f1d3bc', hair: '#c9a24a', hairStyle: 'long', accent: '#b84a6a', accessory: 'earrings' },
    statement: [
      { text: '"Ik was de hele avond gewoon in de zaal. Op een toiletbezoek na."' },
      { when: { topics: ['jessica_c3_afpersing'] }, text: '"Ja, ik was om 21.05 in de achterkamer. Om te betalen. Niet om iemand dood te slaan."' },
    ],
    motive: [
      { text: 'Nog onbekend.' },
      { when: { evidence: ['e_afpersing'] }, text: 'Afpersing: Milo eiste €1.500 zwijggeld van haar.' },
      { when: { topics: ['jessica_c3_150'] }, text: 'Afpersing en schaamte: ze nam in 2024 €150 zwijggeld aan en wist dat Glenn onschuldig was.' },
    ],
    alibi: [
      { text: 'Nog niet bevestigd.' },
      { when: { chapter: 4, topics: ['jessica_c4_alibi'] }, text: 'Volgens Jessica: karaoke en dansen in de grote zaal.' },
      { when: { puzzles: ['p_alibi'] }, text: 'Bevestigd: karaokelog (21.29–21.33 en 21.41–21.46) en foto\'s.' },
    ],
    secrets: [
      { id: 'jessica_achterkamer', text: 'Was om 21.05 uur in de achterkamer bij Milo, niet op het toilet.', when: { anyEvidence: ['e_v_sanne_2109'] } },
      { id: 'jessica_150', text: 'Ontving in 2024 €150 van de Brotherhood-rekening, officieel voor haar jas.', when: { evidence: ['e_bank_bob'] } },
      { id: 'jessica_video', text: 'Bewaarde al die tijd een video van de Bullshit Bazooka.', when: { evidence: ['e_video'] } },
    ],
  },
  {
    id: 'sanne',
    name: 'Sanne Roossien',
    epithet: 'Plakboekkoningin',
    age: 35,
    occupation: 'Juf groep 5',
    bio: 'Sanne bewaart van elk feest een plakboek, inclusief bierviltjes, polsbandjes en foto\'s. Ze kent alle roddels van de groep en de helft ervan klopt.',
    personality: 'Nostalgisch, warm en een tikje roddelziek. Praat snel als ze zenuwachtig is.',
    avatar: { skin: '#f3d6c2', hair: '#8a3b22', hairStyle: 'curly', accent: '#2f6b5a', accessory: 'scarf' },
    statement: [
      { text: '"Ik zag Milo om 21.28 uur de gang in lopen. Dat was de laatste keer."' },
      { when: { topics: ['sanne_c2_foto'] }, text: '"Die foto van 23.35 is van mij. Ik heb hem aan Milo uitgeleend. Nou ja, verkocht."' },
    ],
    motive: [
      { text: 'Nog onbekend.' },
      { when: { topics: ['sanne_c3_stil'] }, text: 'Schaamte: ze wist al in 2025 dat haar foto Glenn vrijpleitte, maar zweeg.' },
    ],
    alibi: [
      { text: 'Nog niet bevestigd.' },
      { when: { chapter: 4, topics: ['sanne_c4_alibi'] }, text: 'Volgens Sanne: karaoke met Glenn, daarna een selfie met Jolien.' },
      { when: { puzzles: ['p_alibi'] }, text: 'Bevestigd: karaokelog (21.33–21.38), foto\'s en de selfie van 21.41.' },
    ],
    secrets: [
      { id: 'sanne_verkocht', text: 'Verkocht haar foto van 23.35 uur in augustus voor €50 aan Milo.', when: { topics: ['sanne_c2_foto'] } },
      { id: 'sanne_rick', text: 'Vertelde het tijdstip op de foto in 2025 aan Rick, die haar vroeg erover te zwijgen.', when: { topics: ['sanne_c3_stil'] } },
    ],
  },
  {
    id: 'alex',
    name: 'Alex Gorissen',
    epithet: 'Sleutelmeester van de Brotherhood',
    age: 37,
    occupation: 'Facilitair coördinator',
    bio: 'Alex beheert al jaren de sleutel van de achterkamer van Parkzicht, het heiligdom van de Brotherhood of Bullshit. Hij draagt de sleutel normaal aan een rood koord.',
    personality: 'Laconiek, betrouwbaar en dol op regels, lijstjes en lanyards.',
    avatar: { skin: '#d9a77f', hair: '#1f1a17', hairStyle: 'bald', accent: '#c58b2a', accessory: 'headphones' },
    statement: [
      { text: '"Ik heb Milo om 20.10 uur de sleutel gegeven. Om 21.45 heb ik met de reservesleutel de deur geopend."' },
    ],
    motive: [
      { text: 'Nog onbekend.' },
      { when: { topics: ['alex_c2_huur'] }, text: 'Geld en positie: hij verhuurde de achterkamer stiekem aan Milo, buiten de Brotherhood om.' },
    ],
    alibi: [
      { text: 'Nog niet bevestigd.' },
      { when: { chapter: 4, topics: ['alex_c4_alibi'] }, text: 'Volgens Alex: achter de bar bij Bennie, tot Maureen om 21.42 kwam.' },
      { when: { puzzles: ['p_alibi'] }, text: 'Bevestigd: verklaring Bennie en foto van 21.38.' },
    ],
    secrets: [
      { id: 'alex_huur', text: 'Liet zich door Milo €100 "huur" betalen voor de achterkamer, zonder de Brotherhood in te lichten.', when: { topics: ['alex_c2_huur'] } },
      { id: 'alex_tas', text: 'Zag in 2024 om 23.45 iemand met een zware sporttas naar buiten gaan, maar zei nooit iets.', when: { evidence: ['e_v_alex_sporttas'] } },
    ],
  },
  {
    id: 'jolien',
    name: 'Jolien Beemer',
    epithet: 'Fotografe van dienst',
    age: 33,
    occupation: 'Freelance fotograaf',
    bio: 'Jolien heeft altijd een camera om haar nek. Ze fotografeerde de reünie van begin tot eind. Haar camera zet een tijdstempel op elke foto.',
    personality: 'Scherp observerend, deadpan en zuinig met woorden. Ziet alles, zegt weinig.',
    avatar: { skin: '#c68e6a', hair: '#2a1b14', hairStyle: 'bun', accent: '#3d4f7a', accessory: 'camera' },
    statement: [
      { text: '"Ik heb de hele avond foto\'s gemaakt. De camera liegt niet. Mensen wel."' },
    ],
    motive: [
      { text: 'Nog onbekend.' },
      { when: { topics: ['jolien_c2_ingehuurd'] }, text: 'Onduidelijk: Milo huurde haar in om de gezichten om 22.00 uur vast te leggen.' },
    ],
    alibi: [
      { text: 'Nog niet bevestigd.' },
      { when: { chapter: 4, topics: ['jolien_c4_alibi'] }, text: 'Volgens Jolien: fotograferend in de grote zaal.' },
      { when: { puzzles: ['p_alibi'] }, text: 'Bevestigd: haar cameralog toont elke paar minuten een foto in de grote zaal.' },
    ],
    secrets: [
      { id: 'jolien_250', text: 'Kreeg €250 van Milo om de reacties om 22.00 uur te fotograferen.', when: { topics: ['jolien_c2_ingehuurd'] } },
      { id: 'jolien_foto', text: 'Hield een foto van Jessica bij de achterkamer achter om haar vriendin te beschermen.', when: { evidence: ['e_foto_2105'] } },
    ],
  },
  {
    id: 'rick',
    name: 'Rick van der Veen',
    epithet: 'Grootmeester van de Brotherhood',
    age: 38,
    occupation: 'Eventmanager',
    bio: 'Rick organiseerde de Night of Absolute Bullshit en bedenkt nog steeds elk jaar een nóg slechter idee. Vanavond presenteert hij de karaoke.',
    personality: 'Luid, charmant en een wandelende chaosmachine. Kan niet tegen stilte.',
    avatar: { skin: '#eac0a0', hair: '#b37a3c', hairStyle: 'spiky', accent: '#c4352d', accessory: 'bowtie' },
    statement: [
      { text: '"Ik heb de hele avond op het podium gestaan. Ik ben een entertainer, ik loop niet weg van mijn publiek."' },
      { when: { topics: ['rick_c2_deur'] }, text: '"Oké, om 21.15 stond ik even bij die deur. Ik heb geklopt en geroepen. Milo deed niet open."' },
    ],
    motive: [
      { text: 'Nog onbekend.' },
      { when: { topics: ['rick_c2_bazooka'] }, text: 'Reputatie: zijn Bullshit Bazooka veroorzaakte de schade van 2024, en Milo zou dat onthullen.' },
    ],
    alibi: [
      { text: 'Nog niet bevestigd.' },
      { when: { chapter: 4, topics: ['rick_c4_alibi'] }, text: 'Volgens Rick: presentator van de karaoke, op het podium.' },
      { when: { puzzles: ['p_alibi'] }, text: 'Bevestigd: op elke zaalfoto tussen 21.33 en 21.44 staat hij met de microfoon.' },
    ],
    secrets: [
      { id: 'rick_bazooka', text: 'Zijn "Bullshit Bazooka" (confettikanon met subwoofer) veroorzaakte de €500 schade.', when: { anyEvidence: ['e_origineel'], topics: ['rick_c2_bazooka'] } },
      { id: 'rick_deur', text: 'Bonkte om 21.15 op de deur van de achterkamer en riep "Waag het niet, Milo!"', when: { topics: ['rick_c2_deur'] } },
      { id: 'rick_sanne', text: 'Vroeg Sanne in 2025 om te zwijgen over het tijdstip op haar foto.', when: { topics: ['rick_c3_sanne'] } },
    ],
  },
  {
    id: 'yvan',
    name: 'Yvan Hoving',
    epithet: 'Ceremoniemeester van de Brotherhood',
    age: 36,
    occupation: 'Poolkampioen van Parkzicht',
    bio: 'Yvan leidde jarenlang de "Ceremonie van de Golden Cock". Hij is de beste poolspeler van de groep en wint graag weddenschappen. Hij gaat binnenkort een brouwerij openen.',
    personality: 'Vriendelijk, grappig, competitief en altijd net iets te behulpzaam.',
    avatar: { skin: '#e2b896', hair: '#2b2b2b', hairStyle: 'wavy', accent: '#2e5d8a', accessory: 'cap' },
    statement: [
      { text: '"Ik stond vanaf half tien buiten te roken. Toen ik binnenkwam was het al chaos."' },
    ],
    motive: [
      { text: 'Nog onbekend.' },
      { when: { evidence: ['e_verkoop'] }, text: 'Reputatie: volgens de verkoopverklaring kwam de gestolen Golden Cock via hem bij Daniëlle terecht.' },
      { when: { topics: ['yvan_c3_bekentenis'] }, text: 'Reputatie en vriendschap: hij stal de Golden Cock en liet Glenn jarenlang de schuld dragen.' },
    ],
    alibi: [
      { text: 'Nog niet bevestigd.' },
      { when: { chapter: 4, topics: ['yvan_c4_alibi'] }, text: 'Volgens Yvan: buiten roken op het voorterras (21.25–21.47).' },
      { when: { puzzles: ['p_alibi'] }, text: 'Niet bevestigd: niemand zag hem tussen 21.31 en 21.42.' },
    ],
    secrets: [
      { id: 'yvan_schuld', text: 'Verloor in maart 2024 een poolweddenschap van €400 van Daniëlle.', when: { topics: ['yvan_c3_schuld'] } },
      { id: 'yvan_diefstal', text: 'Nam de Golden Cock in 2024 mee in zijn sporttas.', when: { topics: ['yvan_c3_bekentenis'] } },
      { id: 'yvan_brouwerij', text: 'Is de compagnon van Glenn in de nieuwe brouwerij.', when: { topics: ['yvan_c1_glenn'] } },
    ],
  },
  {
    id: 'maureen',
    name: 'Maureen Nieuwold',
    epithet: 'Archivaris van de vriendengroep',
    age: 39,
    occupation: 'Documentalist bij het streekarchief',
    bio: 'Maureen archiveert alles: groepsapps, bonnetjes, toespraken. Ze schreef in 2024 samen met de caféhouder het eerste incidentrapport. Ze beheert ook de reünie-app.',
    personality: 'Precies, ironisch en onverstoorbaar. Spreekt in genummerde lijstjes.',
    avatar: { skin: '#f0cdb0', hair: '#5b5b66', hairStyle: 'bob', accent: '#4b3a6b', accessory: 'glasses' },
    statement: [
      { text: '"Milo stuurde me om 21.31 een bericht. Toen hij niet meer antwoordde, ben ik gaan kijken."' },
    ],
    motive: [
      { text: 'Nog onbekend.' },
      { when: { topics: ['maureen_c2_origineel'] }, text: 'Schuldgevoel: ze bewaarde het originele rapport en wist dat het officiële rapport niet klopte.' },
    ],
    alibi: [
      { text: 'Nog niet bevestigd.' },
      { when: { chapter: 4, topics: ['maureen_c4_alibi'] }, text: 'Volgens Maureen: aan het zijtafeltje, aan de bar en karaoke, daarna naar de deur met Alex.' },
      { when: { puzzles: ['p_alibi'] }, text: 'Bevestigd: foto\'s 21.33 en 21.38, karaokelog 21.38–21.41, daarna met Alex.' },
    ],
    secrets: [
      { id: 'maureen_origineel', text: 'Bewaarde het originele incidentrapport tweeënhalf jaar in haar archief.', when: { topics: ['maureen_c2_origineel'] } },
      { id: 'maureen_stilte', text: 'Stefan vroeg haar in 2024 te zwijgen "voor de vrede binnen de Brotherhood". Ze deed het.', when: { evidence: ['e_v_maureen_stilte'] } },
    ],
  },
  {
    id: 'danielle',
    name: 'Daniëlle Radtur',
    epithet: 'Eigenaar van Radtur Retro',
    age: 35,
    occupation: 'Vintagehandelaar',
    bio: 'Daniëlle runt een webwinkel in "vintage met een verhaal". Ze speelt pool, wint vaak en vergeet nooit wie haar nog geld schuldig is.',
    personality: 'Zakelijk, direct en ondernemend. Heeft voor alles een bonnetje.',
    avatar: { skin: '#b9825e', hair: '#1c1412', hairStyle: 'ponytail', accent: '#8a6a2a', accessory: 'pen' },
    statement: [
      { text: '"Ik zat de hele avond aan de bar. Vanaf mijn kruk zie je de hele zaal én de garderobe."' },
    ],
    motive: [
      { text: 'Nog onbekend.' },
      { when: { evidence: ['e_klokgieter'] }, text: 'Geld en reputatie: zij verkocht in 2024 een gouden trofee voor €400.' },
    ],
    alibi: [
      { text: 'Nog niet bevestigd.' },
      { when: { chapter: 4, topics: ['danielle_c4_alibi'] }, text: 'Volgens Daniëlle: aan de bar, in gesprek met Bennie.' },
      { when: { puzzles: ['p_alibi'] }, text: 'Bevestigd: verklaring Bennie en foto\'s van 21.38 en 21.44.' },
    ],
    secrets: [
      { id: 'danielle_verkoop', text: 'Verkocht de Golden Cock op 2 juni 2024 voor €400 aan verzamelaar Klokgieter.', when: { topics: ['danielle_c3_400'] } },
      { id: 'danielle_milo', text: 'Tekende in september op verzoek van Milo een verklaring over de herkomst van de trofee.', when: { evidence: ['e_verkoop'] } },
    ],
  },
  {
    id: 'stefan',
    name: 'Stefan Alting',
    epithet: 'Penningmeester van de Brotherhood',
    age: 37,
    occupation: 'Boekhouder',
    bio: 'Stefan beheert de kas van de Brotherhood en het Black Book, het officiële verslagboek van het genootschap. Netjes, nerveus en dol op spreadsheets.',
    personality: 'Precies, zenuwachtig, legt alles drie keer uit. Zweet als het over geld gaat.',
    avatar: { skin: '#f2cfb4', hair: '#6b4a2b', hairStyle: 'short', accent: '#5a6b2f', accessory: 'moustache' },
    statement: [
      { text: '"Het Black Book is het officiële verslag. Daar staat in wat er gebeurd is."' },
      { when: { topics: ['stefan_c2_vervalst'] }, text: '"Goed, het rapport is aangepast. Maar dat is tweeënhalf jaar geleden en dat is iets heel anders dan moord."' },
    ],
    motive: [
      { text: 'Nog onbekend.' },
      { when: { puzzles: ['p_diff'] }, text: 'Reputatie: het officiële rapport dat hij ondertekende, blijkt vervalst.' },
      { when: { topics: ['stefan_c2_vervalst'] }, text: 'Reputatie en baan: hij vervalste het Black Book om een lege kas te verbergen.' },
    ],
    alibi: [
      { text: 'Nog niet bevestigd.' },
      { when: { chapter: 4, topics: ['stefan_c4_alibi'] }, text: 'Volgens Stefan: buiten aan de telefoon (21.29–21.37), daarna aan de bar.' },
      { when: { puzzles: ['p_alibi'] }, text: 'Niet bevestigd: tussen 21.31 en 21.37 zag niemand hem.' },
    ],
    secrets: [
      { id: 'stefan_kas', text: 'De Brotherhood-kas was in april 2024 leeg: hij had €480 "geleend" voor BullshitCoin.', when: { evidence: ['e_kasboek'] } },
      { id: 'stefan_vervalst', text: 'Paste het rapport aan zodat Glenn de schade betaalde, plus €150 extra.', when: { topics: ['stefan_c2_vervalst'] } },
      { id: 'stefan_150', text: 'Betaalde Jessica €150 om haar video van de Bazooka niet te delen.', when: { topics: ['stefan_c3_150'] } },
    ],
  },
];
