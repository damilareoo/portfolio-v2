import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

/**
 * One rule: this proxy fetches Apple's artwork and nothing else.
 *
 * A proxy with a URL parameter and no host check is an SSRF — any caller can
 * point `u` at an address only the server can reach and read the answer back
 * through this origin. Every case below is that same rule stated against a
 * different way of getting past it.
 */

const ask = (u: string) => GET(new Request(`https://site.test/api/app-store/art?u=${encodeURIComponent(u)}`));

const image = (type = "image/jpeg") => ({
  ok: true,
  status: 200,
  body: new ReadableStream(),
  headers: new Headers({ "content-type": type }),
});

afterEach(() => vi.unstubAllGlobals());

describe("GET /api/app-store/art", () => {
  it("passes Apple's artwork through, with the upstream's own type", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(image("image/png"))));
    const res = await ask("https://is1-ssl.mzstatic.com/image/thumb/a/512x512bb.png");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("cache-control")).toContain("immutable");
  });

  it("refuses every host that is not Apple's CDN", async () => {
    const fetcher = vi.fn(() => Promise.resolve(image()));
    vi.stubGlobal("fetch", fetcher);
    for (const url of [
      "https://169.254.169.254/latest/meta-data/",
      "https://localhost/admin",
      "https://mzstatic.com.evil.test/a.jpg",
      "https://evil.test/mzstatic.com/a.jpg",
    ]) {
      expect((await ask(url)).status, url).toBe(403);
    }
    // The point of the check is that nothing is fetched at all.
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("refuses anything that is not https, however friendly the host", async () => {
    const fetcher = vi.fn(() => Promise.resolve(image()));
    vi.stubGlobal("fetch", fetcher);
    for (const url of ["http://is1-ssl.mzstatic.com/a.jpg", "file:///etc/passwd"]) {
      expect((await ask(url)).status, url).toBe(403);
    }
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("wants a target, and wants it to be a URL", async () => {
    vi.stubGlobal("fetch", vi.fn());
    expect((await GET(new Request("https://site.test/api/app-store/art"))).status).toBe(400);
    expect((await ask("not a url")).status).toBe(400);
  });

  it("refuses to serve something that is not an image", async () => {
    /* An allowlisted host serving HTML is still a way to turn this route into
       a general fetcher for that origin. */
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(image("text/html"))));
    expect((await ask("https://is1-ssl.mzstatic.com/a.jpg")).status).toBe(502);
  });

  it("answers rather than throwing when the upstream falls over", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("refused"))));
    expect((await ask("https://is1-ssl.mzstatic.com/a.jpg")).status).toBe(502);
  });
});
