import { createContext, useContext, useState, type ReactNode } from 'react';

export type Tab = 'onderzoek' | 'verdachten' | 'bewijs' | 'tijdlijn' | 'boek';

export type Overlay =
  | { type: 'suspect'; id: string }
  | { type: 'interview'; id: string }
  | { type: 'evidence'; id: string }
  | { type: 'puzzle'; id: string }
  | { type: 'chapter'; no: number }
  | { type: 'accuse' }
  | { type: 'finale' };

interface Nav {
  tab: Tab;
  setTab: (t: Tab) => void;
  stack: Overlay[];
  open: (o: Overlay) => void;
  close: () => void;
  closeAll: () => void;
}

const NavCtx = createContext<Nav | null>(null);

export function NavProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<Tab>('onderzoek');
  const [stack, setStack] = useState<Overlay[]>([]);
  return (
    <NavCtx.Provider
      value={{
        tab,
        setTab: (t) => {
          setStack([]);
          setTab(t);
        },
        stack,
        open: (o) => setStack((s) => [...s, o]),
        close: () => setStack((s) => s.slice(0, -1)),
        closeAll: () => setStack([]),
      }}
    >
      {children}
    </NavCtx.Provider>
  );
}

export function useNav() {
  const n = useContext(NavCtx);
  if (!n) throw new Error('useNav outside provider');
  return n;
}
