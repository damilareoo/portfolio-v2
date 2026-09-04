"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GlyphCell } from "@/components/glyph-cell";
import { Reveal } from "@/lib/reveal";
import {
  COMMENT_MAX,
  NAME_MAX,
  PAD_GRID,
  type Comment,
  type Drawing,
  decodeCells,
  padFrame,
} from "@/lib/pad-field";

/** Canvas units for a wall tile. CSS decides how large it actually lands. */
const TILE = 96;

/**
 * When a thing landed, in the zone the rest of the site keeps.
 *
 * Lagos, and stated rather than relative. "3 hours ago" is a value that changes
 * while nobody touches it, which is the one thing this page does not do — and
 * rendering it on a server and again in a browser is two different answers to
 * one question, which is a hydration mismatch waiting for a slow connection.
 */
const stamp = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Lagos",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/**
 * The wall: everything drawn on the pad, newest first.
 *
 * Rendered from the register the page read on the server, so a visitor arrives
 * to the wall already standing rather than to a spinner that fills in. Each
 * tile is the same engine the pad is, holding a field it will never change —
 * the arrival is the only thing that happens to it, and `Reveal` fires that
 * once and disconnects.
 *
 * `drawings` is null when the register could not be read at all. That is a
 * different sentence from an empty wall and is printed as one.
 */
export function RegisterWall({ drawings }: { drawings: Drawing[] | null }) {
  if (drawings === null) {
    return <Quiet>The register is not reachable right now.</Quiet>;
  }
  if (drawings.length === 0) {
    return <Quiet>Nothing on the wall yet. Yours would be the first.</Quiet>;
  }

  return (
    <ul className="grid grid-cols-4 gap-x-3 gap-y-5 sm:grid-cols-6 lg:grid-cols-8">
      {drawings.map((drawing, index) => (
        <Reveal as="li" key={drawing.id} index={index}>
          <Tile drawing={drawing} />
        </Reveal>
      ))}
    </ul>
  );
}

function Tile({ drawing }: { drawing: Drawing }) {
  /* Decoded once per drawing rather than once per paint. The field never
     changes after this — the cell settles into it and then holds it. */
  const frame = useMemo(() => {
    const cells = decodeCells(drawing.cells);
    return cells ? padFrame(cells) : null;
  }, [drawing.cells]);

  if (!frame) return null;

  return (
    <figure>
      <GlyphCell
        grid={PAD_GRID}
        size={TILE}
        frame={frame}
        polarity="ink"
        label={
          drawing.signature
            ? `A drawing, signed ${drawing.signature}`
            : "A drawing, left unsigned"
        }
        className="w-full text-ink"
      />
      <figcaption className="mt-1.5 truncate font-mono text-2xs uppercase tracking-wider text-ink-3">
        {drawing.signature || "—"}
      </figcaption>
    </figure>
  );
}

type Sending = "idle" | "sending" | "sent" | "full" | "failed";

const SAID: Record<Sending, string> = {
  idle: "",
  sending: "Posting",
  sent: "Posted",
  full: "That is enough for now — try again in ten minutes",
  failed: "It did not post. Try again",
};

/**
 * What people said, and the box to say something in.
 *
 * Flat. No replies, no threads, no editing — a comment is a line in a register,
 * and everything a thread needs is a moderation queue nobody is going to staff.
 *
 * The body is rendered as text, which is React's default and the reason there
 * is no `dangerouslySetInnerHTML` anywhere in this feature. A comment that
 * arrives holding markup is shown holding markup.
 */
export function PadComments({ comments }: { comments: Comment[] | null }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState<Sending>("idle");

  const send = async () => {
    if (body.trim() === "" || sending === "sending") return;
    setSending("sending");
    try {
      const res = await fetch("/api/pad", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "comment", body, name }),
      });
      if (res.status === 429) {
        setSending("full");
        return;
      }
      if (!res.ok) {
        setSending("failed");
        return;
      }
      setBody("");
      setSending("sent");
      router.refresh();
    } catch {
      setSending("failed");
    }
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
        className="space-y-2"
      >
        <textarea
          value={body}
          onChange={(event) => {
            setBody(event.target.value);
            setSending((was) => (was === "sending" ? was : "idle"));
          }}
          // A courtesy. The cap that counts is the server's; this endpoint can
          // be reached without ever loading this page.
          maxLength={COMMENT_MAX}
          rows={3}
          placeholder="Say something"
          aria-label="Your comment"
          className="w-full resize-y rounded-[var(--radius-tile)] border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-ink-3"
        />
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-line px-4 py-2 transition-colors focus-within:border-ink-3">
            <span className="shrink-0 font-mono text-2xs uppercase tracking-wider text-ink-3">
              Name
            </span>
            <input
              type="text"
              value={name}
              maxLength={NAME_MAX}
              placeholder="optional"
              onChange={(event) => setName(event.target.value)}
              className="w-full min-w-0 bg-transparent font-mono text-xs text-ink outline-none placeholder:text-ink-3"
            />
          </label>
          <button
            type="submit"
            disabled={body.trim() === "" || sending === "sending"}
            className="rounded-full bg-strong px-4 py-2 font-mono text-2xs uppercase tracking-wider text-on-strong transition-opacity hover:opacity-85 disabled:opacity-40"
          >
            Post
          </button>
        </div>
        {SAID[sending] && (
          <p className="font-mono text-2xs uppercase tracking-wider text-ink-3">{SAID[sending]}</p>
        )}
      </form>

      {comments === null ? (
        <Quiet>The comments are not reachable right now.</Quiet>
      ) : comments.length === 0 ? (
        <Quiet>Nobody has said anything yet.</Quiet>
      ) : (
        <ul>
          {comments.map((comment) => (
            <li key={comment.id} className="rule-b py-3 last:bg-none">
              <p className="text-sm leading-[1.6] text-ink">{comment.body}</p>
              <p className="mt-1 font-mono text-2xs uppercase tracking-wider text-ink-3">
                {comment.name || "Anonymous"} &middot; {stamp.format(new Date(comment.at))}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Quiet({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-2xs uppercase tracking-wider text-ink-3">{children}</p>;
}
