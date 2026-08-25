"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const LOCAL_KEY = "dialkit-turns";

/* This visitor's own turns live in localStorage, which is external to React the
   same way the shared count is: the server has no way to know it. Reading it as
   a store gives the server zero and the client its saved trace after hydration,
   without writing state from inside an effect. */
let mineSnapshot: number | null = null;
const mineListeners = new Set<() => void>();

function getMine(): number {
  if (mineSnapshot === null) {
    try {
      const saved = Number(localStorage.getItem(LOCAL_KEY));
      mineSnapshot = Number.isFinite(saved) && saved > 0 ? saved : 0;
    } catch {
      // Private browsing — this visit simply starts from zero.
      mineSnapshot = 0;
    }
  }
  return mineSnapshot;
}

const getServerMine = () => 0;

function subscribeMine(listener: () => void) {
  mineListeners.add(listener);
  return () => {
    mineListeners.delete(listener);
  };
}

function bumpMine() {
  mineSnapshot = getMine() + 1;
  try {
    localStorage.setItem(LOCAL_KEY, String(mineSnapshot));
  } catch {
    // Not worth failing a dial turn over.
  }
  mineListeners.forEach((listener) => listener());
}

type DialTurnsValue = {
  /** Turns by everyone, ever. Null until read, or when no store is configured. */
  total: number | null;
  /** Turns by this visitor, from their own machine. */
  mine: number;
  /** Whether a shared store answered at all. */
  live: boolean;
  /** True only for a change this visitor just caused — the roll is theirs. */
  justMoved: boolean;
  record: () => void;
};

const DialTurnsContext = createContext<DialTurnsValue | null>(null);

export function DialTurnsProvider({ children }: { children: ReactNode }) {
  const [total, setTotal] = useState<number | null>(null);
  const [live, setLive] = useState(false);
  const [justMoved, setJustMoved] = useState(false);
  const mine = useSyncExternalStore(subscribeMine, getMine, getServerMine);

  // Read once on mount and never poll: a number that climbs on its own would be
  // motion the visitor did not cause. It moves when they move it.
  useEffect(() => {
    let cancelled = false;

    fetch("/api/dial-turns")
      .then((r) => r.json())
      .then((d: { count: number | null; live: boolean }) => {
        if (cancelled) return;
        setTotal(d.count);
        setLive(d.live);
      })
      .catch(() => {
        // No shared count. The local trace still works.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const record = useCallback(() => {
    setJustMoved(true);
    bumpMine();
    // Optimistic: the visitor sees their own turn land immediately.
    setTotal((prev) => (prev === null ? prev : prev + 1));

    fetch("/api/dial-turns", { method: "POST" })
      .then((r) => r.json())
      .then((d: { count: number | null; live: boolean }) => {
        setLive(d.live);
        // Reconcile against the shared truth, which includes everyone else.
        if (d.count !== null) setTotal(d.count);
      })
      .catch(() => {
        // The optimistic number stands for this visit.
      });
  }, []);

  const value = useMemo(
    () => ({ total, mine, live, justMoved, record }),
    [total, mine, live, justMoved, record],
  );

  return <DialTurnsContext.Provider value={value}>{children}</DialTurnsContext.Provider>;
}

export function useDialTurns() {
  const ctx = useContext(DialTurnsContext);
  if (!ctx) throw new Error("useDialTurns must be used inside DialTurnsProvider");
  return ctx;
}
