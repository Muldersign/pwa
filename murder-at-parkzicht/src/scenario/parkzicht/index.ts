import type { Scenario } from '../../engine/types';
import { chapters } from './chapters';
import { dialogues } from './dialogues';
import { evidence } from './evidence';
import { photos } from './photos';
import { puzzles } from './puzzles';
import { questions } from './questions';
import { solution } from './solution';
import { suspects } from './suspects';
import { timeline } from './timeline';

export const parkzicht: Scenario = {
  id: 'parkzicht',
  title: 'The Night of Absolute Bullshit 2.0',
  subtitle: 'Murder at Parkzicht',
  victim: {
    name: 'Milo Dubbelspel',
    age: 41,
    bio: 'Podcastmaker ("Dubbelspel Onthult") en buitenstaander. Ontdekte jarenlang verborgen geheimen van de vriendengroep en beloofde om 22.00 uur de waarheid te onthullen.',
  },
  suspects,
  dialogues,
  evidence,
  photos,
  puzzles,
  questions,
  chapters,
  timeline,
  solution,
};
