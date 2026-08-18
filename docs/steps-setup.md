# Sending steps from the phone

Health Connect is device-local. There is no server to ask, no OAuth flow, no
REST API — the step total only exists on the Android phone that recorded it.
So the direction is inverted: nothing pulls, the phone pushes. A macro reads
today's total from Health Connect every half hour and POSTs it to the site.

The endpoint is `POST https://damilareoo-xyz.vercel.app/api/steps`. It takes

```json
{ "steps": 6231 }
```

and an `Authorization: Bearer <secret>` header. An optional `"date"` field in
`YYYY-MM-DD` form backfills a specific day; omitted, the server uses today in
Africa/Lagos. It answers `{"ok":true}`, or `401` if the bearer is wrong or
missing, `422` if the number is implausible, `400` if the body is not JSON.

Implausible means: negative, not a number, above 200000, or lower than a total
already recorded for the same day. Steps only accumulate within a day, so a
smaller number is a second device reporting rather than a correction, and the
server keeps the larger one. Reposting the same value is fine; the macro can
fire as often as it likes.

## Before you start

You need the ingest secret. It is a Vercel production environment variable
named `STEPS_INGEST_SECRET`, and it exists nowhere in this repository. Get it
from the Vercel dashboard (Project → Settings → Environment Variables →
`STEPS_INGEST_SECRET` → Reveal), or `vercel env pull` into a scratch file you
delete afterwards. Type it into the phone by hand; do not mail it to yourself.

If it has never been set, create it first:

```bash
node -e 'console.log(require("node:crypto").randomBytes(32).toString("base64url"))'
vercel env add STEPS_INGEST_SECRET production
```

Until that variable exists, the route returns `401` to everyone — an
unconfigured secret closes the endpoint rather than opening it.

## Tasker

Tasker is the primary setup. It is paid, roughly a few dollars, and it is the
only Android automation app with a first-class Health Connect integration.

### 1. Install and grant permissions

1. Install **Tasker** from the Play Store.
2. Install **Health Connect** if the phone does not already have it. On Android
   14 and later it is part of the system, under Settings → Security & privacy →
   More privacy settings → Health Connect.
3. Open Health Connect → **App permissions** → **Tasker** → allow **Steps**
   (read). Tasker will not appear in that list until it has asked once, so if
   it is missing, create the action in step 3 below first and come back.
4. Confirm the phone's own step source is writing to Health Connect — Google
   Fit, Samsung Health, Fitbit, or the Pixel's built-in tracker. Health Connect
   is a hub, not a sensor; if nothing writes to it, it reads zero forever.
5. Tasker → ⋮ → **More** → **Android Settings** and disable battery
   optimisation for Tasker, so the profile survives Doze.

### 2. Create the task

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

**Action 2 — guard against an empty read.**
**+** → **Task** → **If** is not needed as a separate action; instead open
Action 3 and set its **If** condition (bottom of the action screen) to
`%steps` **Matches** `+[0-9]`. A missing permission or a Health Connect hiccup
leaves `%steps` unset, and posting an unset variable sends the literal string
`%steps`, which the server rejects with a 422. This condition skips the post
instead.

**Action 3 — post it.**
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
- *If* (bottom of the screen): `%steps` Matches `+[0-9]`

Replace `YOUR_SECRET_HERE` with the value of `STEPS_INGEST_SECRET`. There is no
space after the colon in `Authorization:Bearer …` in Tasker's header field —
Tasker splits on the first colon and keeps the rest verbatim, and a leading
space in the value will not match.

If `%steps` comes back as a decimal on your device (`6231.0`), add a **Variable
Set** action before the request: `%steps` to `%steps`, with **Do Maths** ticked
and *Max Rounding Digits* `0`. The server rounds too, so this is cosmetic.

Press the **▶** play button at the bottom of the task to run it once. The HTTP
Request action's result lands in `%http_data`; a successful post reads
`{"ok":true}`. Check `%http_response_code` if it does not.

### 3. Create the profile

Tasker → **Profiles** tab → **+** → **Time**.

- Tick **From** and set `00:00`
- Tick **To** and set `23:59`
- Tick **Repeat** and set `Every 30 minutes`
- Back out, and link the profile to the `Push Steps` task when prompted.

Make sure Tasker itself is enabled — the toggle at the top right of the main
screen, and the persistent notification if your Android version demands one.

### 4. Verify

From any machine:

```bash
curl -s https://damilareoo-xyz.vercel.app/api/steps
```

You should see today's date carrying a non-zero `today`, and an `updatedAt`
timestamp within the last half hour:

```json
{"today":6231,"days":[…],"average7":5140,"updatedAt":1787056291957,"goal":10000}
```

`{"configured":false}` means the site has no Redis store attached, which is a
separate problem from this guide — check `KV_REST_API_URL` and
`KV_REST_API_TOKEN` in Vercel.

Walk a few hundred steps, wait for the next half-hour tick or press ▶ on the
task again, and re-run the curl. The number should move. If it does not:

| Symptom | Cause |
| --- | --- |
| `401` in `%http_response_code` | Bearer wrong, or `STEPS_INGEST_SECRET` not set in Vercel production. Re-check for a stray space or a truncated paste. |
| `422` with `"implausible"` | `%steps` was unset (posted literally), or lower than a value already stored for today. The latter is the server working correctly. |
| `422` with `"bad date"` | A `date` field was sent in the wrong shape. It must be `YYYY-MM-DD`. |
| `400` | The body is not valid JSON — usually a missing brace or a smart quote. |
| `503` | The Redis store was unreachable. Transient; the next tick will land. |
| Post succeeds but `today` stays 0 | Health Connect is reading zero. Open Health Connect → Steps and confirm data is actually arriving from Fit / Samsung Health. |

## MacroDroid

MacroDroid is the free alternative. Its Health Connect support is thinner —
depending on version it may only expose a step count via the **Device
Sensors** category rather than a true Health Connect read — but the shape is
the same.

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
6. **Constraint** (optional but worth it): **MacroDroid Specific** → **Variable**
   → `steps` greater than `0`, so a failed read never posts.
7. Exempt MacroDroid from battery optimisation, then run the macro manually
   from the ⋮ menu and verify with the same `curl` as above.

## Backfilling a day

If the phone was off, or you want to seed history:

```bash
curl -X POST https://damilareoo-xyz.vercel.app/api/steps \
  -H 'content-type: application/json' \
  -H 'Authorization: Bearer YOUR_SECRET_HERE' \
  -d '{"steps": 8421, "date": "2026-08-16"}'
```

Day keys expire after sixty days, so there is no point backfilling further
back than that. The card reads the last seven.

## Rotating the secret

```bash
node -e 'console.log(require("node:crypto").randomBytes(32).toString("base64url"))'
vercel env rm STEPS_INGEST_SECRET production
vercel env add STEPS_INGEST_SECRET production
vercel deploy --prod
```

Then update the header in Tasker or MacroDroid. Posts fail with `401` in
between, which costs nothing but a gap in one half-hour tick — the next
successful post carries the day's running total anyway.
