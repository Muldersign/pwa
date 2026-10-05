import { IndexedDbRepository } from './indexedDbRepository';

/** The one local store of the app. The UI talks to it through PlannerRepository; sync uses its extra methods. */
export const localRepository = new IndexedDbRepository();
