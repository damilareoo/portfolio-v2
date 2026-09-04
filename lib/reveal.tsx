"use client";

import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "@/lib/use-media-query";
import { useMounted } from "@/lib/use-mounted";

/**
 * Law 4, amended: "nothing moves unless touched, or arriving."
 *
 * An element animates the first time it enters the viewport and never again —
 * the observer disconnects on the first intersection, so scrolling back up
 * finds the page exactly as it was left. A reveal that fires twice is a
 * performance rather than an arrival.
 *
 * Arrival is written straight to the DOM rather than held in state: it is a
 * one-way message to the browser's style engine, and routing it through React
 * would re-render every tile in a gallery to set one attribute.
 */
export function useEntranceOnce<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const arrive = () => node.setAttribute("data-arrived", "");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) {
      arrive();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        arrive();
        observer.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.01 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return ref;
}

/**
 * The same arrival, answered to React rather than written to the DOM.
 *
 * `useEntranceOnce` sets an attribute because CSS is the only thing that needs
 * to know. This is for the caller whose arrival is not a transition but a piece
 * of work — the pedometer's walk, which has to *start* when the instrument is
 * seen rather than when it mounts. Those were the same moment on a page whose
 * every element is above the fold, and are five thousand pixels apart on this
 * one: the wall sits at the bottom of a page a visitor lands at the top of, so
 * a walk keyed to mount finished a second and a half after load, unwatched.
 *
 * It reports once and then never changes, so a caller can put it in an effect's
 * dependencies without that effect being re-run by scrolling.
 *
 * Reduced motion is told immediately, exactly as the entrance is. Withholding
 * the *signal* would withhold the value that rides on it, and reduced motion
 * asks for the journey to be skipped, not for the destination to be hidden.
 */
export function useSeenOnce<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [crossed, setCrossed] = useState(false);

  /* The two ways of being seen without being watched, read as external state
     rather than written into state from an effect — the same reason
     `useMounted` and `useMediaQuery` exist at all. A visitor who asked for less
     motion, and a browser that cannot report an intersection, are both told at
     once; anything else would be withholding the value rather than the
     journey. */
  const mounted = useMounted();
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)", false);
  const unwatchable = mounted && !("IntersectionObserver" in window);

  useEffect(() => {
    const node = ref.current;
    if (!node || reduced || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setCrossed(true);
        observer.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.01 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reduced]);

  return { ref, seen: crossed || reduced || unwatchable };
}

/**
 * The stagger is an index, not a timer: tiles arrive in document order so the
 * grid reads as a sequence instead of a single texture. Capped so a long feed
 * never leaves the last tile waiting seconds to exist.
 */
export function Reveal({
  id,
  index = 0,
  as: Tag = "div",
  className = "",
  children,
}: {
  /** Anchor, when the revealed element is also a link target. A product is
      both: it arrives once, and a retired /work URL lands on it. */
  id?: string;
  index?: number;
  as?: "div" | "li" | "section" | "article";
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useEntranceOnce<HTMLElement>();
  // One component wraps several tags, so the element type is resolved at call
  // time rather than expressed as an intersection of every tag's ref.
  const Component = Tag as React.ElementType;

  return (
    <Component
      id={id}
      ref={ref}
      style={{ "--arrive-delay": `${Math.min(index, 12) * 45}ms` } as React.CSSProperties}
      className={`arrive ${className}`}
    >
      {children}
    </Component>
  );
}
