import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

/**
 * One rule: this proxy fetches Apple's artwork and nothing else.
 *
 * A proxy that takes a target and does not check it is an SSRF — any caller can
 * point it at an address only the server can reach and read the answer back
 * through this origin. Every case below is that same rule stated against a
 * different way of getting past it.
 */

/** The route as Next calls it: a request nobody reads, and awaited params. */
const ask = (target: string) =>
  GET(new Request(`https://site.test/api/app-store/art/${target}`), {
    params: Promise.resolve({ src: target.split("/") }),
  });

const image = (type = "image/jpeg") => ({
  ok: true,
  status: 200,
  body: new ReadableStream(),
  headers: new Headers({ "content-type": type }),
});

afterEach(() => vi.unstubAllGlobals());

describe("GET /api/app-store/art/[...src]", () => {
  it("passes Apple's artwork through, with the upstream's own type", async () => {
    const fetcher = vi.fn(() => Promise.resolve(image("image/png")));
    vi.stubGlobal("fetch", fetcher);
    const res = await ask("is1-ssl.mzstatic.com/image/thumb/a/512x512bb.png");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("cache-control")).toContain("immutable");
    // Rebuilt as https from the segments, host first.
    expect(String((fetcher.mock.calls[0] as unknown as [URL])[0])).toBe(
      "https://is1-ssl.mzstatic.com/image/thumb/a/512x512bb.png",
    );
  });

  it("refuses every host that is not Apple's CDN", async () => {
    const fetcher = vi.fn(() => Promise.resolve(image()));
    vi.stubGlobal("fetch", fetcher);
    for (const target of [
      "169.254.169.254/latest/meta-data",
      "localhost/admin",
      "mzstatic.com.evil.test/a.jpg",
      "evil.test/mzstatic.com/a.jpg",
    ]) {
      expect((await ask(target)).status, target).toBe(403);
    }
    // The point of the check is that nothing is fetched at all.
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("cannot be talked into another scheme, because it never reads one", async () => {
    /* The path carries a hostname, not a URL, and the route writes the `https:`
       itself. A segment that looks like a scheme is just a bad hostname. */
    const fetcher = vi.fn(() => Promise.resolve(image()));
    vi.stubGlobal("fetch", fetcher);
    for (const target of ["file:/etc/passwd", "http:/is1-ssl.mzstatic.com/a.jpg"]) {
      expect((await ask(target)).status, target).toBe(403);
    }
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("refuses to serve something that is not an image", async () => {
    /* An allowlisted host serving HTML is still a way to turn this route into
       a general fetcher for that origin. */
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(image("text/html"))));
    expect((await ask("is1-ssl.mzstatic.com/a.jpg")).status).toBe(502);
  });

  it("answers rather than throwing when the upstream falls over", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("refused"))));
    expect((await ask("is1-ssl.mzstatic.com/a.jpg")).status).toBe(502);
  });
});
