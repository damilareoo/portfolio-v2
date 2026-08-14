"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const LOCAL_KEY = "dialkit-turns";

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
  const [mine, setMine] = useState(0);
  const [live, setLive] = useState(false);
  const [justMoved, setJustMoved] = useState(false);

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

    try {
      const saved = Number(localStorage.getItem(LOCAL_KEY));
      if (Number.isFinite(saved) && saved > 0) setMine(saved);
    } catch {
      // Private browsing — this visit simply starts from zero.
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const record = useCallback(() => {
    setJustMoved(true);
    setMine((prev) => {
      const next = prev + 1;
      try {
        localStorage.setItem(LOCAL_KEY, String(next));
      } catch {
        // Not worth failing a dial turn over.
      }
      return next;
    });
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
