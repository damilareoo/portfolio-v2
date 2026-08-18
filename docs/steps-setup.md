# Sending steps from the phone

Health Connect is device-local. There is no server to ask, no OAuth flow, no
REST API — the step total only exists on the Android phone that recorded it.
So the direction is inverted: nothing pulls, the phone pushes. A macro reads
today's total from Health Connect every half hour and POSTs it to the site.

Written for the Nothing Phone (2a) running Nothing OS. Step 1 below is specific
to it and is the most common reason this whole setup silently reports zero.

The endpoint is `POST https://damilareoo-xyz.vercel.app/api/steps`. It takes

```json
{ "steps": 6231 }
```

and an `Authorization: Bearer <secret>` header. An optional `"date"` field in
`YYYY-MM-DD` form backfills a specific day; omitted, the server uses today in
Africa/Lagos.

| Answer | Meaning |
| --- | --- |
| `200 {"ok":true}` | Stored. |
| `400 {"error":"malformed body"}` | The body was not valid JSON. |
| `401 {"error":"unauthorized"}` | Bearer missing or wrong, or the server has no secret set. |
| `422 {"error":"implausible"}` | `steps` was missing, not a number, negative, above 200000, or lower than a total already stored for that day. |
| `422 {"error":"bad date"}` | `date` was not `YYYY-MM-DD`. |
| `501 {"error":"store not configured"}` | The site has no Redis attached. Retrying will never help. |
| `503 {"error":"store unavailable"}` | Redis was unreachable. Transient; the next tick will land. |

Steps only accumulate within a day, so a smaller number for a day already
recorded is a second device reporting rather than a correction, and the server
keeps the larger one. Reposting the same value is fine; the macro can fire as
often as it likes.

## Step 1 — give Health Connect something to read (Phone 2a: do this first)

**Health Connect is a hub, not a sensor.** It stores what other apps write to
it. It has no step counter of its own.

The Nothing Phone (2a) ships with **no** app that writes steps to Health
Connect. There is no Google Fit, no Samsung Health, no Fitbit, and no
first-party Nothing health app on Nothing OS. Skip this step and everything
below will appear to work perfectly — permissions granted, macro firing, `200
{"ok":true}` coming back — while the site shows a flat zero forever, because
Health Connect genuinely has nothing to hand over.

So, before anything else:

1. Install **Google Fit** or **Fitbit** from the Play Store. Either works; Fit
   is lighter, Fitbit is better if a tracker is already in play.
2. **Open it once** and complete onboarding. Neither app begins counting until
   it has been through setup at least one time.
3. Grant it **Physical activity** permission when Android asks. This is the
   sensor permission; without it the app counts nothing.
4. Open **Health Connect** → **App permissions** → the app you just installed →
   grant it **Steps → Write**. Write, not read. This app is the *source*; it
   feeds Health Connect, and Tasker reads from the other side.
5. Walk a hundred steps or so, then open **Health Connect** → **Data and
   access** → **Activity** → **Steps** and confirm a number is actually there
   with today's date on it.

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

## Tasker

Tasker is the primary setup. It is paid, roughly a few dollars, and it is the
only Android automation app with a first-class Health Connect integration.

### Install and grant permissions

1. Install **Tasker** from the Play Store.
2. Open Health Connect → **App permissions** → **Tasker** → allow **Steps**
   (read). Tasker will not appear in that list until it has asked for access
   once, so if it is missing, build the task below first, run it once, and come
   back here.
3. Tasker → ⋮ → **More** → **Android Settings** and disable battery
   optimisation for Tasker, so the profile survives Doze. On Nothing OS this
   lives under Settings → Apps → Tasker → App battery usage → **Unrestricted**.

### Build the task

Tasker → **Tasks** tab → **+** → name it `Push Steps`.

**Action 1 — read the step total.**
**+** → **Health Connect** → **Get Health Data**.

- *Data Type*: `Steps`
- *Aggregation*: `Total`
- *Start*: `Today 00:00`  (in the time picker: today, midnight)
- *End*: `Now`
- *Variable*: `%steps`

Some Tasker builds label this **Read Health Data** and expose the window as
*Relative Start* / *Relative End* instead; set relative start to `0:00:00` with
"today" ticked, and leave relative end empty for "now". The variable name is
the part that matters — the next action refers to `%steps`.

**Action 2 — post it.**
**+** → **Net** → **HTTP Request**.

- *Method*: `POST`
- *URL*: `https://damilareoo-xyz.vercel.app/api/steps`
- *Headers* (one per line):
  ```
  Content-Type:application/json
  Authorization:Bearer YOUR_SECRET_HERE
  ```
- *Body*:
  ```json
  {"steps": %steps}
  ```
- *Timeout*: `30`
- *Structure Output (JSON, etc)*: on

Replace `YOUR_SECRET_HERE` with the value of `STEPS_INGEST_SECRET`. The server
trims whitespace from both ends of the token and accepts the scheme in any
case, so a stray leading space or a trailing newline will not break it — but
the token itself is case- and character-exact.

**The guard on Action 2.** Open Action 2, scroll to the bottom, and set its
**If** condition to:

- left: `%steps`
- operator: **Matches Regex**
- right: `^\d+$`

This matters more than it looks. If Health Connect returns nothing — permission
revoked, no source app, a transient failure — `%steps` stays unset, and Tasker
substitutes the literal text `%steps` into the body. That sends

```
{"steps": %steps}
```

which is not valid JSON, so the server answers **400 `malformed body`**, not
422. The condition skips the post entirely instead, which is the correct
behaviour: there is nothing to report.

If you write the condition as **Matches** with `+[0-9]`, it will never match
anything. In Tasker's simple-match syntax `+` is a postfix quantifier and has
no meaning in front of a character class, so the pattern is malformed, the
action is skipped every single time, and the automation looks perfectly
configured while posting nothing at all. Use **Matches Regex** `^\d+$`. If you
must use simple **Matches**, the pattern is `[0-9]+`.

**Optional — round a decimal total.** If `%steps` comes back as `6231.0` on
your device, `^\d+$` will reject it. Either widen the regex to `^\d+(\.\d+)?$`,
or add a **Variable Set** action before the request: `%steps` to `%steps`, with
**Do Maths** ticked and *Max Rounding Digits* `0`. The server rounds too, so
the value is fine either way — this is only about the guard.

Press the **▶** play button at the bottom of the task to run it once. The HTTP
Request action's result lands in `%http_data`; a successful post reads
`{"ok":true}`. `%http_response_code` holds the status.

### Create the profile

Tasker → **Profiles** tab → **+** → **Time**.

- Tick **From** and set `00:00`
- Tick **To** and set `23:59`
- Tick **Repeat** and set `Every 30 minutes`
- Back out, and link the profile to the `Push Steps` task when prompted.

Make sure Tasker itself is enabled — the toggle at the top right of the main
screen, and the persistent notification if your Android version demands one.

### Verify

From any machine:

```bash
curl -s https://damilareoo-xyz.vercel.app/api/steps
```

On the **first day**, having posted once, expect something like this — six
nulls and one number:

```json
{"today":6231,
 "days":[{"date":"2026-08-12","steps":null},
         {"date":"2026-08-13","steps":null},
         {"date":"2026-08-14","steps":null},
         {"date":"2026-08-15","steps":null},
         {"date":"2026-08-16","steps":null},
         {"date":"2026-08-17","steps":null},
         {"date":"2026-08-18","steps":6231}],
 "average7":6231,"updatedAt":1787056291957,"goal":10000}
```

`null` means a day nobody reported, which is different from a day of no
walking. The average is taken over reported days only, so on day one it equals
today's total rather than a seventh of it. After a week of running it settles
into a real seven-day average.

`"today":null` before the first post of the morning is also correct and
expected — the site draws that as placeholder dots rather than as a zero.

`{"configured":false}` instead of a reading means the site has no Redis store
attached, which is a separate problem from this guide — check
`KV_REST_API_URL` and `KV_REST_API_TOKEN` in Vercel.

Now walk a few hundred steps, wait for the next half-hour tick or press ▶ on
the task again, and re-run the curl. The number should move.

### When it does not

Work down this table in order — the first two rows cover cases where
`%http_response_code` is never set at all, which is the easiest failure to
misread as "nothing is happening".

| Symptom | Cause |
| --- | --- |
| Task runs but `%http_response_code` is empty and nothing arrives | Action 2's **If** condition never matched, so the request was skipped. Almost always a malformed pattern — check it is **Matches Regex** `^\d+$` and not `+[0-9]`. Long-press Action 2 → **Disable** the condition temporarily and run again to confirm. |
| `%steps` is empty or shows the literal `%steps` | Health Connect returned nothing. Either Tasker's Steps **read** permission is missing, or — far more likely on a Phone (2a) — nothing is writing steps to Health Connect at all. Go back to Step 1. |
| `400` / `"malformed body"` | The body was not valid JSON. The usual cause is an unset `%steps` being posted literally, which the **If** condition exists to prevent. A missing brace or a smart quote from copy-paste will do it too. |
| `401` | Bearer wrong, or `STEPS_INGEST_SECRET` not set in Vercel production, or set but not yet deployed. Re-run the pre-flight in Step 3 from a computer to isolate which. |
| `422` / `"implausible"` | `steps` was not a number, was negative, was above 200000, or was lower than a value already stored for today. The last of these is the server working correctly. |
| `422` / `"bad date"` | A `date` field was sent in the wrong shape. It must be `YYYY-MM-DD`. |
| `501` | The site has no Redis store attached. Retrying will never help; fix `KV_REST_API_*` in Vercel. |
| `503` | Redis was unreachable. Transient — the next tick will land. |
| `200 {"ok":true}` but the site still shows zero | The post succeeded with a real zero in it. Health Connect is reading zero: go back to Step 1 and confirm data is actually arriving. |
| Works when the screen is on, stops overnight | Battery optimisation. Set Tasker to **Unrestricted** under Settings → Apps → Tasker → App battery usage. |

### A note on timezones

The server dates every post by **Africa/Lagos**, and Tasker reads "today 00:00"
by the *phone's* timezone. On a phone set to Lagos these agree. Travel with the
phone and they will not: between the two midnights, the phone's "today" window
and the server's day are different days, and the totals land on the wrong key
or trip the monotonic guard and return `422`.

If you travel, either leave the phone's timezone on Lagos, or send the date
explicitly by adding `"date"` to the body with a Tasker variable holding the
Lagos date. Neither is worth doing for a short trip — a few odd days will heal
themselves once you are back.

## MacroDroid

MacroDroid is the free alternative. Its Health Connect support is thinner —
depending on version it may only expose a step count via the **Device
Sensors** category rather than a true Health Connect read — but the shape is
the same. Step 1 above still applies: something must be writing steps to
Health Connect first.

1. Install **MacroDroid**, then grant it Health Connect read access for Steps
   the same way (Health Connect → App permissions → MacroDroid → Steps).
2. **Add Macro** → name it `Push Steps`.
3. **Trigger**: **Day/Time** → **Regular Interval** → every `30` minutes.
4. **Action 1**: **Applications** → **Health Connect** → **Read Steps**, window
   *Today*, store into a local variable named `steps` of type Integer. If your
   build has no Health Connect action, use **Device Sensors** → **Step
   Counter** instead and accept that it counts from boot rather than midnight —
   the server's monotonic guard will keep the day's peak, but the number will
   be wrong after a reboot.
5. **Action 2**: **Connectivity** → **HTTP Request**.
   - Method `POST`
   - URL `https://damilareoo-xyz.vercel.app/api/steps`
   - Content type `application/json`
   - Body `{"steps": [lv=steps]}`
   - Custom headers: `Authorization: Bearer YOUR_SECRET_HERE`
6. **Constraint** — not optional, for the same reason Tasker needs its `If`:
   **MacroDroid Specific** → **Variable** → `steps` **greater than** `0`. An
   unset variable interpolates to nothing, producing `{"steps": }`, which is
   invalid JSON and answers `400`.
7. Set MacroDroid to **Unrestricted** battery usage, then run the macro
   manually from the ⋮ menu and verify with the same `curl` as above.

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
