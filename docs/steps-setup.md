# Sending steps from the phone

Health Connect is device-local. There is no server to ask, no OAuth flow, no
REST API — the step total only exists on the Android phone that recorded it.
So the direction is inverted: nothing pulls, the phone pushes. A macro reads
today's total from Health Connect every half hour and POSTs it to the site.

This is not for want of looking. Every cloud route is shut: the **Google Fit
REST API** is retired in favour of Health Connect; the **Fitbit Web API** turns
off in September 2026; its successor, the **Google Health API**, classes every
scope as Restricted — a privacy and security review to get in — and sources its
data from Fitbit devices and Pixel watches, which a Nothing phone is not.
**Strava** has a fine OAuth API but records activities, not daily step totals.
Device-local is the direction Google is moving in, and pushing is the answer
to it.

Written for the Nothing Phone (2a) running Nothing OS. Step 1 below is specific
to it and is the most common reason this whole setup silently reports zero.

The endpoint is `POST https://damilareoo-xyz.vercel.app/api/steps`, with an
`Authorization: Bearer <secret>` header. It takes either

```json
{ "steps": 6231 }
```

or just the number on its own:

```
6231
```

An optional `"date"` field in `YYYY-MM-DD` form backfills a specific day;
omitted, the server uses today in Africa/Lagos.

**The body is read leniently, and that is the point.** A body with no number in
it — an unset `%steps`, an empty `[lv=steps]`, a stray bit of text — is not an
error. It is a phone with nothing to report, and it answers `204`. Decimals are
fine; the server rounds. This is why the macro below is a single action with no
guard condition attached to it: there is nothing left for a guard to prevent.

| Answer | Meaning |
| --- | --- |
| `200 {"ok":true}` | Stored. |
| `204` (no body) | Heard, and there was no number in it. Nothing was written. The normal answer when the automation fired before its step variable was set. |
| `401 {"error":"unauthorized"}` | Bearer missing or wrong, or the server has no secret set. |
| `422 {"error":"implausible"}` | A number arrived and made an impossible claim: negative, above 200000, or lower than a total already stored for that day. |
| `422 {"error":"bad date"}` | `date` was present and was not `YYYY-MM-DD`. |
| `501 {"error":"store not configured"}` | The site has no Redis attached. Retrying will never help. |
| `503 {"error":"store unavailable"}` | Redis was unreachable. Transient; the next tick will land. |

Steps only accumulate within a day, so a smaller number for a day already
recorded is a second device reporting rather than a correction, and the server
keeps the larger one. Reposting the same value is fine; the macro can fire as
often as it likes.

## Step 1 — give Health Connect something to read (Phone 2a: do this first)

**On Android 14 and later, Health Connect counts steps itself, and this whole
step may be unnecessary.** From Android 14 (API 34, SDK extension 20+) Health
Connect does on-device step counting: the moment *any* app holds `READ_STEPS`
permission, it starts capturing steps from the phone's own sensors and filing
them under the device's name. No source app, no Fit, no Fitbit.

That is a change from how it used to work, and it inverts the advice below. So
check first: **Health Connect → Data and access → Activity → Steps**. If a number
with today's date is there, skip to Step 2.

On **Android 13 and earlier**, the original rule holds: Health Connect is a hub,
not a sensor. It stores what other apps write to it and has no counter of its
own. The Nothing Phone (2a) ships with no app that writes steps to it — no
Google Fit, no Samsung Health, no Fitbit, no first-party Nothing health app.
Skip this step on such a phone and everything below will appear to work
perfectly — permissions granted, macro firing, `200 {"ok":true}` coming back —
while the site shows a flat zero forever, because Health Connect genuinely has
nothing to hand over.

**The tell is the word "Not connected."** Open Health Connect and look at *Your
health apps*. If every app there — whatever is installed — reads `Not
connected`, then nothing has been granted access, nothing is writing, and the
vault is empty. That is the state a Phone (2a) arrives in.

So, before anything else:

1. If a health app is already installed, use it. Otherwise install **Fitbit**
   or **Google Fit** from the Play Store — either can act as the source.
2. **Open it once** and complete onboarding. No such app begins counting until
   it has been through setup at least one time.
3. Grant it **Physical activity** permission when Android asks. This is the
   sensor permission; without it the app counts nothing, whatever Health Connect
   says. Verify at Settings → Apps → [the app] → Permissions → Physical
   activity → Allowed.
4. In Health Connect, tap the **⊕** beside that app and grant it **Steps →
   Write**. Write, not read. This app is the *source*; it feeds Health Connect,
   and the automation reads from the other side.
5. Walk a hundred steps or so, then open **Health Connect** → **Data and
   access** → **Activity** → **Steps** and confirm a number is actually there
   with today's date on it.

**Strava does not count.** It records discrete activities, not a continuous
daily step total, so granting it changes nothing here.

Do not continue until step 5 shows real data. Everything after this point reads
from Health Connect, and if Health Connect is empty the rest of the guide
cannot tell you so.

On Android 14 and later Health Connect is part of the system, under Settings →
Security & privacy → More privacy settings → Health Connect. On older versions
it is a separate Play Store app.

## Step 2 — get the ingest secret

The secret is a Vercel production environment variable named
`STEPS_INGEST_SECRET`, and it exists nowhere in this repository. Get it from
the Vercel dashboard (Project → Settings → Environment Variables →
`STEPS_INGEST_SECRET` → Reveal), or `vercel env pull` into a scratch file you
delete afterwards. Type it into the phone by hand; do not mail it to yourself.

If it has never been set, create it first:

```bash
node -e 'console.log(require("node:crypto").randomBytes(32).toString("base64url"))'
vercel env add STEPS_INGEST_SECRET production
vercel deploy --prod
```

Until that variable exists and a deployment has picked it up, the route returns
`401` to everyone — an unconfigured secret closes the endpoint rather than
opening it.

## Step 3 — pre-flight the secret from a computer

Prove the secret works before wiring a phone to it, so that a later failure has
only one possible cause instead of two.

```bash
S='paste-the-secret-here'

# Wrong bearer — expect 401.
curl -s -o /dev/null -w '%{http_code}\n' -X POST \
  https://damilareoo-xyz.vercel.app/api/steps \
  -H 'content-type: application/json' \
  -H 'Authorization: Bearer definitely-wrong' \
  -d '{"steps":5000}'

# Correct bearer, deliberately impossible number — expect 422, not 401.
curl -s -w '\n' -X POST \
  https://damilareoo-xyz.vercel.app/api/steps \
  -H 'content-type: application/json' \
  -H "Authorization: Bearer $S" \
  -d '{"steps":-1}'
```

`401` then `422 {"error":"implausible"}` means the secret is right. The second
request is rejected on its contents, which can only happen after the bearer has
already been accepted — so this proves authentication without writing anything
to the store.

If the second call also returns `401`, the secret is wrong, or the deployment
predates it. Redeploy and try again.

## The easy way: a webhook app

Nothing to build, nothing to pay for, and no macro. **HC Webhook**
(<https://github.com/mcnaveen/health-connect-webhook>, on the Play Store) reads
Health Connect in the background and POSTs it to a URL of your choosing.

1. Install it, and grant it Health Connect **Steps (read)**.
2. Add a webhook: URL `https://damilareoo-xyz.vercel.app/api/steps`, with a
   custom header `Authorization: Bearer YOUR_SECRET_HERE`.
3. Enable **Steps** and nothing else. Sync interval 30 minutes.
4. Leave it alone.

Alternatives with the same shape: **Life Dashboard Companion**
(<https://github.com/owen282000/life-dashboard-companion-app>, APK from
Releases).

### What it posts, and why the server stores it differently

These apps do not send a daily total. They send Health Connect's own records:

```json
{ "timestamp": "2026-08-19T14:00:00.123Z",
  "app_version": "1.2.3",
  "steps": [ { "count": 842, "start_time": "2026-08-19T08:00:00Z",
               "end_time": "2026-08-19T09:00:00Z" } ] }
```

and they sync **incrementally** — each run carries only what is new since the
last one. A batch is therefore part of a day, not a claim about one.

So the endpoint files the records themselves, in a hash per day keyed by each
record's `start_time`, and the day's total is their sum. That is what makes
incremental delivery safe: batches accumulate, a record delivered twice
overwrites its own field rather than counting twice, and a corrected record can
revise a day **downwards** — which the plain `{"steps": n}` path, with its
keep-the-peak rule, can never do.

A record is filed under the day it began, in Lagos. One spanning midnight lands
wholly on the day it started.

**One limitation.** Every record in the batch is summed. With a phone alone that
is exact. Add a watch that also records steps and the overlapping periods would
be counted twice — Health Connect keeps sources separate and this endpoint does
not reconcile them. If that ever happens, sync from one source only.

## Doing it by hand instead: an automation app

The endpoint no longer cares which. Because a body with no number in it answers
`204` rather than erroring, neither setup needs a guard condition — the macro is
a read followed by a post, and that is all.

**Tasker is the one that works.** It is the only Android automation app found
with a Health Connect read action. MacroDroid, checked on Nothing OS in August
2026, has none — searching its action picker for "health" returns nothing —
and LlamaLab Automate's nearest block detects activity *types* rather than step
totals. If MacroDroid gains the action later it is the better free choice, so
it is worth thirty seconds in the action picker before paying for anything.

Whatever you use, do **not** settle for a **Device Sensors → Step Counter**
action as a substitute. That sensor is cumulative since last boot, so a phone up
for a week reports the week's total as today's.

Whichever you pick, do this first, or it will work all day and die overnight in
Doze: **Settings → Apps → [the app] → App battery usage → Unrestricted**.

## MacroDroid — only if it has gained a Health Connect action

As of August 2026 it has not, and these steps cannot be completed; they are kept
because the moment it does, this is the free path. Check by searching `health` in
the action picker. If nothing comes back, use Tasker below.

1. Install **MacroDroid** from the Play Store.
2. **Add Macro**, name it `Push Steps`.
3. **Trigger**: **Day/Time** → **Regular Interval** → every `30` minutes.
4. **Action 1**: **Applications** → **Health Connect** → **Read Steps**, window
   *Today*, into a local variable named `steps` (Integer).
5. **Action 2**: **Connectivity** → **HTTP Request**
   - Method `POST`
   - URL `https://damilareoo-xyz.vercel.app/api/steps`
   - Content type `text/plain`
   - Body `[lv=steps]`
   - Custom header `Authorization: Bearer YOUR_SECRET_HERE`
6. Grant Health Connect read access: **Health Connect → App permissions →
   MacroDroid → Steps**. It will not appear in that list until it has asked
   once, so run the macro from the ⋮ menu first, then come back.

No constraint, no variable check. If `steps` is unset the body arrives empty or
as the literal `[lv=steps]`, and the server answers `204` and writes nothing.

## Tasker

The working path. Same shape, with Tasker's names.

**Action 1** — **Health Connect** → **Get Health Data**

| Field | Value |
| --- | --- |
| Data Type | `Steps` |
| Aggregation | `Total` |
| Start | `Today 00:00` |
| End | `Now` |
| Variable | `%steps` |

Some builds label this **Read Health Data** with *Relative Start* / *Relative
End*: set relative start `0:00:00` with "today" ticked, leave relative end empty.
The variable name is what the next action refers to.

**Action 2** — **Net** → **HTTP Request**

- Method `POST`
- URL `https://damilareoo-xyz.vercel.app/api/steps`
- Headers, one per line:
  ```
  Content-Type:text/plain
  Authorization:Bearer YOUR_SECRET_HERE
  ```
- Body: `%steps`
- Timeout `30`, Structure Output on

**No If condition.** An unset `%steps` posts the literal text `%steps`, which
has no number in it, so the server answers `204` and does nothing. This used to
require a `Matches Regex` `^\d+$` guard, and a guard written slightly wrong
skipped every post while looking perfectly configured. The server absorbs it now.

Decimals need no handling either: `6231.0` is read as `6231`.

**Profile**: Tasker → **Profiles** → **+** → **Time** → **From** `00:00`,
**To** `23:59`, **Repeat** `Every 30 minutes`, linked to `Push Steps`.

Grant Health Connect read access at **Health Connect → App permissions →
Tasker → Steps**, running the task once first if Tasker is not yet listed.

## Verify

Run the macro by hand, then from any machine:

```bash
curl -s https://damilareoo-xyz.vercel.app/api/steps
```

On the **first day**, having posted once, expect six nulls and one number:

```json
{"today":6231,
 "days":[{"date":"2026-08-13","steps":null},
         {"date":"2026-08-14","steps":null},
         {"date":"2026-08-15","steps":null},
         {"date":"2026-08-16","steps":null},
         {"date":"2026-08-17","steps":null},
         {"date":"2026-08-18","steps":null},
         {"date":"2026-08-19","steps":6231}],
 "average7":6231,"updatedAt":1787056291957,"goal":10000}
```

`null` means a day nobody reported, which is different from a day of no walking.
The average is taken over reported days only, so on day one it equals today's
total rather than a seventh of it.

`"today":null` before the first post of the morning is also correct — the site
draws that as placeholder dots rather than as a zero.

`{"configured":false}` instead of a reading means the site has no Redis store
attached, which is a separate problem — check `KV_REST_API_URL` and
`KV_REST_API_TOKEN` in Vercel.

## When it does not

| Symptom | Cause |
| --- | --- |
| Total is roughly double what you walked | Two sources are writing steps to Health Connect — typically a phone and a watch — and every record is summed. Sync from one source only. |
| A day is stuck too high | Only possible via the plain `{"steps": n}` path, which keeps the peak. The webhook path can revise downwards on its own; this one needs the day's key deleting by hand. |
| `204`, repeatedly | The read action returned nothing, so there was no number to post. Either the automation app lacks Health Connect **Steps (read)**, or — far more likely — Health Connect itself is empty. Go back to Step 1. This is the answer the endpoint gives instead of an error, so it is a symptom, not a fault. |
| `200 {"ok":true}` but the site still shows zero | The post carried a real zero. Health Connect is reading zero: back to Step 1. |
| `401` | Bearer wrong, or `STEPS_INGEST_SECRET` not set in Vercel production, or set but not yet deployed. Re-run the pre-flight in Step 3 from a computer to isolate which. Note the secret must exist on **both** Vercel projects — the phone posts to the `damilareoo` one. |
| `422` / `"implausible"` | The number was negative, above 200000, or lower than a value already stored for today. The last of these is the server working correctly. |
| `422` / `"bad date"` | A `date` field was sent in the wrong shape. It must be `YYYY-MM-DD`. |
| `501` | The site has no Redis store attached. Retrying will never help; fix `KV_REST_API_*` in Vercel. |
| `503` | Redis was unreachable. Transient — the next tick will land. |
| Works when the screen is on, stops overnight | Battery optimisation. Set the app to **Unrestricted**. |

## A note on timezones

The server dates every post by **Africa/Lagos**, and the automation reads
"today" by the *phone's* timezone. On a phone set to Lagos these agree. Travel
with the phone and they will not: between the two midnights the phone's "today"
window and the server's day are different days, and totals land on the wrong key
or trip the monotonic guard and return `422`.

If you travel, either leave the phone's timezone on Lagos, or send the date
explicitly with a `{"steps": N, "date": "YYYY-MM-DD"}` body holding the Lagos
date. Neither is worth doing for a short trip — a few odd days heal themselves
once you are back.

## Backfilling a day

If the phone was off, or you want to seed history:

```bash
curl -X POST https://damilareoo-xyz.vercel.app/api/steps \
  -H 'content-type: application/json' \
  -H 'Authorization: Bearer YOUR_SECRET_HERE' \
  -d '{"steps": 8421, "date": "2026-08-16"}'
```

A backfill deliberately does **not** move the `updatedAt` mark — that reports
when the site last heard about *today*, and a backfill is new history rather
than new news.

Day keys expire after sixty days, so there is no point backfilling further back
than that. The card reads the last seven.

## Rotating the secret

```bash
node -e 'console.log(require("node:crypto").randomBytes(32).toString("base64url"))'
vercel env rm STEPS_INGEST_SECRET production
vercel env add STEPS_INGEST_SECRET production
vercel deploy --prod
```

Then update the header in Tasker or MacroDroid. Posts fail with `401` in
between, which costs nothing but a gap in one half-hour tick — the next
successful post carries the day's running total anyway, and the days it missed
read as `null` rather than dragging the average down.
