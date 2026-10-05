import { useToast } from '../components/Toast';
import { useData } from '../state/DataContext';
import { useUI } from '../state/UIContext';
import type { TimelineEntry } from './timeline';

/** Shared select / delete handlers for timeline rows. */
export function useTimelineActions() {
  const { repo } = useData();
  const ui = useUI();
  const toast = useToast();

  const select = (entry: TimelineEntry) => {
    if (entry.kind === 'meal') ui.openEditor({ mode: 'edit', kind: 'meal', item: entry.item });
    else ui.openEditor({ mode: 'edit', kind: 'activity', item: entry.item });
  };

  const remove = async (entry: TimelineEntry) => {
    if (entry.kind === 'meal') {
      const item = entry.item;
      await repo.deleteMeal(item.id);
      toast({ message: `${item.title} verwijderd`, action: { label: 'Ongedaan maken', onClick: () => repo.putMeal(item) } });
    } else {
      const item = entry.item;
      await repo.deleteActivity(item.id);
      toast({ message: `${item.title} verwijderd`, action: { label: 'Ongedaan maken', onClick: () => repo.putActivity(item) } });
    }
  };

  return { select, remove };
}
