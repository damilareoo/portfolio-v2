"use client";

import { useSyncExternalStore } from "react";

/* The server cannot know anything the browser stored — the theme, the dials —
   so the first client render must match the server's or hydration tears.
   Reading "am I in the browser yet" as an external store gives false on the
   server and true after hydration, without a state write in an effect. */
const noop = () => () => {};

export const useMounted = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
