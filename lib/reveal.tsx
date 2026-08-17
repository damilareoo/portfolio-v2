"use client";

import { useEffect, useRef } from "react";

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
 * The stagger is an index, not a timer: tiles arrive in document order so the
 * grid reads as a sequence instead of a single texture. Capped so a long feed
 * never leaves the last tile waiting seconds to exist.
 */
export function Reveal({
  index = 0,
  as: Tag = "div",
  className = "",
  children,
}: {
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
      ref={ref}
      style={{ "--arrive-delay": `${Math.min(index, 12) * 45}ms` } as React.CSSProperties}
      className={`arrive ${className}`}
    >
      {children}
    </Component>
  );
}
