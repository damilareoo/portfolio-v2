# The colophon pad: what to set, and how to take something down

The pad on `/colophon` is a 12×12 dot field anyone can draw on, with a register
of the last forty drawings and a flat list of the last thirty comments. It is
the only place on the site a stranger may write to.

It stores its two lists in the Redis that is already attached — the same
`upstash-kv-claret-village` the steps and the counters use, reached over its
REST API by `lib/pad.ts`. No new store, no new dependency, no new spend.

## The two variables

| Variable | Environments | What happens without it |
| --- | --- | --- |
| `PAD_CLIENT_SALT` | Production, Preview, Development | Every write is refused with `501`. The pad is read-only. |
| `PAD_MODERATION_SECRET` | Production (Preview if you want to test there) | Every moderation call is refused with `401`. Nothing can be taken down. |

Both are new. `KV_REST_API_URL` and `KV_REST_API_TOKEN` are already set on all
three environments and are not touched by this feature.

```bash
node -e 'console.log(require("node:crypto").randomBytes(32).toString("base64url"))'
vercel env add PAD_CLIENT_SALT production
node -e 'console.log(require("node:crypto").randomBytes(32).toString("base64url"))'
vercel env add PAD_MODERATION_SECRET production
vercel deploy --prod
```

Add `PAD_CLIENT_SALT` to preview and development too, or the pad is read-only
everywhere but production. For local work, put it in `.env.local`.

### Why the salt is required rather than defaulted

The rate limit has to tell one visitor from another, and the only thing that
tells them apart is an address. An address is never stored: it is hashed with
this salt and the first ninety-six bits of that hash become the key. An
*unsalted* hash of an IPv4 address is not an anonymisation — the whole space is
four billion values and a laptop walks it in seconds — and a default salt
written into a public repository is the same as no salt at all.

So there is no default, and no salt means no writes. That is deliberate: the
alternatives are keeping something that identifies a visitor, or running with
no rate limit, and the pad staying read-only is better than either.

**Rotating the salt** resets everyone's rate-limit window and nothing else. No
stored drawing or comment references it.

## What is kept

A drawing is 144 bits of field as 36 hex characters, an optional signature of
at most 24 characters, a random id, and a timestamp. A comment is a body of at
most 500 characters, an optional name of at most 24, an id, and a timestamp.

Nothing else. No address, no user agent, no referrer, no cookie. The only trace
of a visitor is the salted hash in a rate-limit key, which expires within
fifteen minutes.

Keys, all under `pad:` so they cannot collide with `steps:`:

- `pad:drawings` — a sorted set scored by timestamp, trimmed to 40 on write.
- `pad:comments` — the same, trimmed to 30.
- `pad:rate:draw:<hash>:<window>` and `pad:rate:say:<hash>:<window>` — counters
  that expire on their own.

## The rate limit

Fixed window, per client, per path. Five drawings and three comments per ten
minutes. Over that, the endpoint answers `429` and the page says so.

The store is the counter, via `INCR` plus `EXPIRE`, which is the shape
`lib/counters.ts` already uses. A store that will not answer refuses the write
rather than waving it through.

## Taking something down

`POST /api/pad/moderate` with a bearer token, in the shape `/api/steps` uses:

```bash
S='paste-PAD_MODERATION_SECRET-here'

curl -s -X POST https://www.damilareoo.xyz/api/pad/moderate \
  -H 'content-type: application/json' \
  -H "Authorization: Bearer $S" \
  -d '{"kind":"comment","id":"THE_ID"}'
```

`kind` is `drawing` or `comment`. The id is the entry's own id.

| Answer | Meaning |
| --- | --- |
| `200 {"ok":true,"removed":1}` | Gone. |
| `401 {"error":"unauthorized"}` | Bearer missing or wrong, or the secret is not set on that deployment. |
| `400 {"error":"unreadable"}` | The body named neither list, or carried no id. |
| `404 {"ok":false,"removed":0}` | No entry with that id — or the store would not answer. From here those are indistinguishable. |
| `501 {"error":"store not configured"}` | No Redis attached. |

### Finding an id

The ids are not printed on the page. Read them straight out of the store:

```bash
curl -s "$KV_REST_API_URL/zrange/pad:comments/0/-1" \
  -H "Authorization: Bearer $KV_REST_API_TOKEN"
```

Each member is the stored JSON, `id` included. `pad:drawings` is the same.

### Removing everything

There is no bulk route on purpose — a route that empties the wall is a route
that can empty the wall by accident. Do it from the store directly:

```bash
curl -s -X POST "$KV_REST_API_URL" \
  -H "Authorization: Bearer $KV_REST_API_TOKEN" \
  -d '["DEL","pad:comments"]'
```

## Turning the pad off

Remove `PAD_CLIENT_SALT` and redeploy. The wall and the comments stay readable;
nothing new can be added. That is the switch to reach for if the pad is ever
being used for something it should not be.
