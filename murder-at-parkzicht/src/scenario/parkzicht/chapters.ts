import type { Chapter } from '../../engine/types';

const ids = ['glenn', 'jessica', 'sanne', 'alex', 'jolien', 'rick', 'yvan', 'maureen', 'danielle', 'stefan'];

export const chapters: Chapter[] = [
  {
    no: 1,
    title: 'De moord in Parkzicht',
    subtitle: 'Hoofdstuk 1',
    intro: [
      'Zaterdag 24 oktober 2026, 22.04 uur. De motregen tikt tegen de ramen van Grandcafé Parkzicht.',
      'Een uur geleden zou Milo Dubbelspel hier "de waarheid" onthullen over de beruchte Night of Absolute Bullshit van 2024. Om 21.45 uur werd hij dood gevonden in de achterkamer. Naast hem lag een gouden trofee die al tweeënhalf jaar vermist was.',
      'Tien mensen uit de vriendengroep zijn binnen. Iedereen heeft iets te verbergen. Jij bent de rechercheur van dienst.',
    ],
    onStart: { evidence: ['e_rapport', 'e_plattegrond', 'e_uitnodiging', 'e_gastenlijst', 'e_agenda'] },
    goals: [
      { id: 'g1_all', label: 'Maak kennis met alle tien verdachten', done: { topics: ids.map((i) => `${i}_c1_intro`) } },
      { id: 'g1_p', label: 'Puzzel: de laatste uren van Milo', done: { puzzles: ['p_avond'] } },
      { id: 'g1_q', label: 'Beantwoord onderzoeksvragen 1–3', done: { questions: ['q1', 'q2', 'q3'] } },
    ],
    outro: 'Iedereen liegt een beetje. Maar alles draait om één avond, tweeënhalf jaar geleden. Tijd om het Black Book te openen.',
  },
  {
    no: 2,
    title: 'The Brotherhood of Bullshit',
    subtitle: 'Hoofdstuk 2',
    intro: [
      'De map "DE WAARHEID — 22.00 UUR" is vrijgegeven. Er zitten documenten in die tweeënhalf jaar onder het stof lagen.',
      'Het Black Book van de Brotherhood zegt dat Glenn op 14 april 2024 de schade veroorzaakte en dat de Golden Cock om 23.20 uur verdween. Maar Milo had een origineel rapport. En een foto.',
    ],
    onStart: { evidence: ['e_blackbook', 'e_origineel', 'e_factuur', 'e_foto_2335', 'e_sleutellog'] },
    goals: [
      { id: 'g2_foto', label: 'Puzzel: de beschadigde foto', done: { puzzles: ['p_foto'] } },
      { id: 'g2_diff', label: 'Puzzel: zoek de verschillen in het Black Book', done: { puzzles: ['p_diff'] } },
      { id: 'g2_q', label: 'Beantwoord onderzoeksvragen 4–6', done: { questions: ['q4', 'q5', 'q6'] } },
    ],
    outro: 'Het Black Book is vervalst. Maar wie de schuld verschoof, is nog niet per se wie de trofee meenam. Volg het geld.',
  },
  {
    no: 3,
    title: 'The Golden Cock Heist',
    subtitle: 'Hoofdstuk 3',
    intro: [
      'Bankafschriften, een kwitantie, een aankoopregister van een verzamelaar en twee brieven uit Milo\'s map.',
      'Milo beloofde Glenn vrij te pleiten. Tegelijk stuurde hij iemand anders een rekening van €1.500. Dubbelspel, inderdaad.',
    ],
    onStart: { evidence: ['e_bank_glenn', 'e_bank_bob', 'e_kwitantie_500', 'e_klokgieter', 'e_afpersing', 'e_brief_glenn'] },
    goals: [
      { id: 'g3_p', label: 'Puzzel: volg het geld', done: { puzzles: ['p_geld'] } },
      { id: 'g3_q', label: 'Beantwoord onderzoeksvragen 7–9', done: { questions: ['q7', 'q8', 'q9'] } },
    ],
    outro: 'Je weet nu wie er in 2024 stal, vervalste, zweeg en verdiende. Maar geld is geen moordwapen. Terug naar 24 oktober, 21.31 uur.',
  },
  {
    no: 4,
    title: 'The Final Cover-up',
    subtitle: 'Hoofdstuk 4',
    intro: [
      'De Technische Recherche is klaar. Jolien heeft haar geheugenkaart overhandigd. Bennie heeft een verklaring afgelegd.',
      'Milo deed om 21.31 open voor iemand die drie keer klopte. Elf minuten later was hij stil. Vind wie er binnenkwam — en wie daarna de deur op slot draaide.',
    ],
    onStart: {
      evidence: [
        'e_wapen',
        'e_manchetknoop',
        'e_mapinhoud',
        'e_telefoon',
        'e_foto_2110',
        'e_foto_2123',
        'e_foto_2133',
        'e_foto_2138',
        'e_foto_2144',
        'e_foto_2152',
        'e_karaoke',
        'e_bennie',
        'e_sleutel_jas',
        'e_asbak',
        'e_cameralog',
      ],
    },
    goals: [
      { id: 'g4_alibi', label: 'Vraag alle tien verdachten naar hun alibi (21.31–21.42)', done: { topics: ids.map((i) => `${i}_c4_alibi`) } },
      { id: 'g4_key', label: 'Puzzel: de sleutelroute', done: { puzzles: ['p_sleutel'] } },
      { id: 'g4_mat', label: 'Puzzel: de alibi-matrix', done: { puzzles: ['p_alibi'] } },
    ],
    outro: 'Je hebt alles wat je nodig hebt. Nu moet je kiezen.',
  },
];
