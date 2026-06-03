# Bookee — Setup Guide

This walks you through every account and key needed to run Bookee end-to-end.
Work top to bottom; copy each value into `.env.local` (and later into Vercel) as
you go. The **free demo path** needs Notion + Google + Dograh. The **paid path**
adds Stripe (and a second Notion DB + a second Dograh agent). Twilio and Anthropic
are optional and skipped automatically if you leave their keys blank.

---

## 0. Prerequisites

- Node.js 20+ and Git
- A GitHub account (to deploy via Vercel)
- Accounts you'll create below: Notion, Google Cloud, Dograh, (optional) Stripe, Twilio, Anthropic

```bash
git clone https://github.com/SummerBreezeChang/bookee-form-template
cd bookee-form-template
npm install
cp .env.example .env.local
```

---

## 1. Notion — lead CRM

You'll create **one** database for the free demo. (If you want the paid path,
create a **second** one in step 5.)

### 1a. Create the Demo Leads database
Create a new **full-page database** called `Bookee Leads` with these properties —
names and types must match exactly:

| Property | Type |
|---|---|
| `Name` | Title |
| `Email` | Email |
| `Phone` | Phone |
| `Website URL` | URL |
| `Status` | **Status** (options: `New`, `Invalid Phone`, `Call Initiated`, `Meeting Scheduled`, `No Answer`, `Opted Out`, `Callback Requested`, `Voicemail Left`, `Called`) |
| `Consent` | Checkbox |
| `Consent Timestamp` | Date |
| `Consent Text` | Text |
| `Business Summary` | Text |
| `Call Duration` | Number |
| `Recording URL` | URL |
| `Meeting Time` | Text |

### 1b. Create an integration + connect it
1. Go to https://www.notion.so/my-integrations → **New integration** → name it `Bookee`.
2. Capabilities: Read, Update, Insert content. Submit.
3. Copy the **Internal Integration Secret** (`ntn_…`) → this is `NOTION_SECRET`.
4. Open your `Bookee Leads` database → ••• menu → **Connections → Connect to → Bookee**.

### 1c. Get the database id
Open the database; the URL looks like
`https://www.notion.so/workspace/DATABASE_ID?v=VIEW_ID`. The long id before the `?`
is `NOTION_DATABASE_ID`.

```
NOTION_SECRET=ntn_...
NOTION_DATABASE_ID=...
```

---

## 2. Google Calendar — availability + booking (OAuth2)

> Use OAuth, **not** a service account (service accounts write to an invisible calendar).

### 2a. Project + API
1. https://console.cloud.google.com → create a project `Bookee`.
2. **APIs & Services → Library → Google Calendar API → Enable**.

### 2b. OAuth consent screen
1. **APIs & Services → OAuth consent screen** → **External** → fill app name + your email.
2. Add scope `https://www.googleapis.com/auth/calendar`.
3. **Publish App** (removes the test-user restriction; fine for personal use).

### 2c. OAuth client
1. **APIs & Services → Credentials → Create Credentials → OAuth client ID → Web application**.
2. Under **Authorized redirect URIs** add: `http://localhost:53682/callback`
3. Create → copy **Client ID** and **Client Secret**.

```
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
```

### 2d. Refresh token (one-time script)
```bash
export GOOGLE_CLIENT_ID="...";  export GOOGLE_CLIENT_SECRET="..."   # PowerShell: $env:GOOGLE_CLIENT_ID="..."
node scripts/get-google-refresh-token.mjs
```
A browser opens → sign in → "Google hasn't verified this app" → **Advanced → Go to Bookee (unsafe)** → grant access. The script prints your refresh token.

```
GOOGLE_REFRESH_TOKEN=1//...
GOOGLE_CALENDAR_ID=primary
# Optional: a separate calendar for free demo bookings (so they never block real availability)
GOOGLE_DEMO_CALENDAR_ID=
```

To use a separate demo calendar: create a new Google Calendar, copy its
**Calendar ID** (Calendar settings → "Integrate calendar"), and put it in
`GOOGLE_DEMO_CALENDAR_ID`.

---

## 3. Dograh — the AI voice agent

### 3a. Create the DEMO agent
1. Sign up at https://www.dograh.com → create an **Agent** for the free demo.
2. **Settings → API** → generate an API key → `DOGRAH_API_KEY`.
3. Find the agent's **public Trigger Path** — a UUID like
   `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`. **This is `DOGRAH_DEMO_AGENT_ID`, NOT the
   internal agent id.** (Bookee calls `POST https://api.dograh.com/api/v1/public/agent/{this-uuid}`.)

```
DOGRAH_API_KEY=dgr_...
DOGRAH_DEMO_AGENT_ID=...
```

### 3b. Add the agent's tools
Point the agent at your deployed site's routes (use your real domain once deployed;
`http://localhost:3000` won't be reachable from Dograh):

| Tool | Method | URL |
|---|---|---|
| `get_lead_data` | POST | `https://YOUR-DOMAIN/api/tools/get-lead-data` |
| `get_slots` | POST | `https://YOUR-DOMAIN/api/tools/get-slots` |
| `book_meeting_demo` | POST | `https://YOUR-DOMAIN/api/tools/book-slot?meeting_type=demo` |

> The `?meeting_type=demo` on the booking tool sends demo bookings to the demo
> calendar with a `Demo` title. No need to thread it through the prompt.

`book_meeting_demo` body parameters: `slot` (ISO datetime the lead picked),
`lead_name`, `lead_email`.

### 3c. Post-call webhook
Add a webhook node that POSTs to `https://YOUR-DOMAIN/api/webhook/dograh` after the
call, sending: `call_id`, `lead_name`, `lead_email`, `meeting_booked`,
`meeting_time`, `call_outcome`, `duration`, `recording_url`, `transcript_url`, and
`notion_page_id` (pass through from `initial_context`).

### 3d. Connect Twilio inside Dograh
In the agent settings, add your Twilio Account SID + Auth Token and select your
Twilio phone number. **This is how the call is actually placed** — your app never
calls Twilio for telephony.

---

## 4. Deploy to Vercel + add env vars

1. Push the repo to GitHub, import it at https://vercel.com → **Add New Project**.
2. **Settings → Environment Variables** → add every key from your `.env.local`
   (scope them to **Production**, **Preview**, **Development**).
3. Redeploy (Vercel only applies env changes on a redeploy).
4. Add your custom domain and use the **www** host going forward (important for the
   Stripe webhook in step 5).
5. Go back to Dograh and update the tool/webhook URLs (step 3b/3c) to your real domain.

**Smoke test the free demo:** open your site → submit the form with your real phone
+ a business URL + the consent box → you should get a call within seconds → pick a
time → check your (demo) calendar, your email invite, and the Notion row.

---

## 5. Stripe — paid deposit path (optional)

Skip this entire section if you only want the free demo.

### 5a. Second Notion database + (optional) second integration
Create a `Bookee Setup Calls` database with these properties:

| Property | Type |
|---|---|
| `Name` | Title |
| `Email` | Email |
| `Phone` | Phone |
| `Consent` | Checkbox |
| `Consent Timestamp` | Date |
| `Consent Text` | Text |
| `Business Summary` | Text |

Connect your `Bookee` integration to it. Set:
```
NOTION_SETUP_DATABASE_ID=...
# Optional: only if you use a different integration for the setup DB
NOTION_SETUP_SECRET=
```

### 5b. Second Dograh agent (setup)
Create a second agent for scheduling paid setup calls. Same tools as 3b, but the
booking tool URL is `…/api/tools/book-slot?meeting_type=setup_call` (books your
**real** calendar). Copy its Trigger Path UUID:
```
DOGRAH_SETUP_AGENT_ID=...
# Optional per-agent key; otherwise DOGRAH_API_KEY is used
DOGRAH_SETUP_API_KEY=
```

### 5c. Stripe keys
1. Activate your Stripe account (business + bank details) to accept live charges.
2. **Developers → API keys** → copy the **Secret key** (`sk_test_…` while testing,
   `sk_live_…` for production). The publishable key is not used.
```
STRIPE_SECRET_KEY=sk_test_...
```

### 5d. Stripe webhook
1. **Developers → Webhooks → Add endpoint**.
2. URL (must be **www**): `https://www.YOUR-DOMAIN/api/webhook/stripe`
3. Event: **`checkout.session.completed`** (only this one).
4. Save → reveal & copy the **Signing secret**:
```
STRIPE_WEBHOOK_SECRET=whsec_...
```
Add both Stripe vars to Vercel and redeploy.

**Test the paid path:** open `/book-setup` → pick the paid package → pay the deposit
(use Stripe **test mode** + test card `4242 4242 4242 4242` first) → confirm the
webhook delivery is **200**, the setup call fires, and the booking + Notion row
appear. Going live: switch to `sk_live_…`, create a **live** webhook, swap the live
`whsec_…`, redeploy, then do one real-card test and refund it.

---

## 6. Optional integrations

### Twilio — phone validation
If `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` are set, the demo action validates the
number via Lookup v2 before calling. Leave blank to skip. (Telephony for the call
itself is configured inside Dograh — see 3d — not here.)
```
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
```

### Anthropic — lead research
If `ANTHROPIC_API_KEY` is set, the demo action fetches the lead's website and asks
Claude for a one-sentence summary, stored in `Business Summary` and passed to the
agent. Leave blank to skip.
```
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 7. Common problems

| Symptom | Cause | Fix |
|---|---|---|
| Bookings never appear on the calendar | Service-account auth | Use OAuth + refresh token; set `GOOGLE_CALENDAR_ID=primary` |
| `get-slots` says everything is free | freebusy 200 + `errors` for an unreadable calendar | Use `primary` (not a `@group.calendar.google.com` id) |
| Stripe webhook 307 | Endpoint pointed at bare apex domain | Point it at the **www** host |
| Stripe webhook 401 | Host deployment protection blocking it | Disable protection for the webhook |
| Stripe signature error | Using a test `whsec_` against live (or vice-versa) | Use the secret from the matching mode |
| Phone doesn't ring | `DOGRAH_*_AGENT_ID` set to the internal id | Use the public **Trigger Path** UUID |
| Env change not taking effect | Vercel caches env until redeploy | Redeploy after any env change |

---

## Env var checklist

**Free demo (minimum):** `NOTION_SECRET`, `NOTION_DATABASE_ID`,
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`,
`GOOGLE_CALENDAR_ID`, `DOGRAH_API_KEY`, `DOGRAH_DEMO_AGENT_ID`.

**Paid path (adds):** `NOTION_SETUP_DATABASE_ID`, `DOGRAH_SETUP_AGENT_ID`,
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.

**Optional:** `GOOGLE_DEMO_CALENDAR_ID`, `NOTION_SETUP_SECRET`,
`DOGRAH_DEMO_API_KEY`, `DOGRAH_SETUP_API_KEY`, `TWILIO_ACCOUNT_SID`,
`TWILIO_AUTH_TOKEN`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SITE_URL`.
