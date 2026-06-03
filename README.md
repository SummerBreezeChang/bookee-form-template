# Bookee — AI Voice Booking Form

Bookee turns a website form into a live phone call. The moment a lead submits,
an AI voice agent calls them, answers questions, and books a meeting straight to
your Google Calendar — with a Meet link and email invite. Leads are recorded in
Notion. An optional paid path takes a deposit via Stripe before scheduling.

- **Framework:** Next.js (App Router) · TypeScript
- **Voice agent:** Dograh
- **Calendar:** Google Calendar (OAuth2)
- **CRM:** Notion
- **Payments (optional):** Stripe deposits
- **Phone validation (optional):** Twilio Lookup v2
- **Lead research (optional):** Anthropic (Claude)

> No client SDKs and no keys in the browser — every integration runs server-side,
> and each one **no-ops gracefully until you set its keys**, so the app runs with
> zero configuration.

---

## Quick start

```bash
git clone https://github.com/SummerBreezeChang/bookee-form-template
cd bookee-form-template
npm install
cp .env.example .env.local
# fill in .env.local (see SETUP.md), then:
npm run dev            # http://localhost:3000
```

The forms work immediately — submissions just log to the server console until you
add keys. Full step-by-step setup (Notion, Google OAuth, Dograh agents, Stripe) is
in **[SETUP.md](./SETUP.md)**.

---

## Integrations

| Service | Required? | Used for | How |
|---|---|---|---|
| **Notion** | Yes | Lead CRM (demo + paid) | `@notionhq/client` |
| **Google Calendar** | Yes | Availability + booking | `googleapis`, OAuth2 refresh token |
| **Dograh** | Yes | AI voice agent (the call) | Direct REST |
| **Stripe** | Paid path only | 25% deposit checkout | `stripe` |
| **Twilio** | Optional | Phone validation | Direct REST (Lookup v2) — *not* the SDK |
| **Anthropic** | Optional | One-line business summary | Direct REST |

### Flow

**Free demo:** form → `submitDemoRequest` (server action) → create Notion lead →
(optional Twilio validate) → (optional Claude summary) → `triggerBookeeCall("demo")`
→ Dograh calls the lead → agent uses the tool routes below → books a **demo**
calendar event → `webhook/dograh` writes the outcome back to Notion.

**Paid setup:** `/book-setup` → `createSetupCheckout` → Notion row + Stripe Checkout
Session (with metadata) → user pays → `webhook/stripe` (`checkout.session.completed`)
→ mark Notion paid → `triggerBookeeCall("setup")` → Dograh calls and books the
**real** calendar.

### API routes

| Route | Method | Purpose | Caller |
|---|---|---|---|
| `/api/tools/get-lead-data` | POST | Look up a lead by phone before the call | Dograh (pre-call) |
| `/api/tools/get-slots` | POST | Return available time ranges | Dograh (in call) |
| `/api/tools/book-slot` | POST | Create the calendar event + Meet link | Dograh (in call) |
| `/api/webhook/dograh` | POST | Write call results back to Notion | Dograh (post-call) |
| `/api/webhook/stripe` | POST | Deposit paid → mark Notion + trigger call | Stripe |

Server actions: `submitDemoRequest` (demo form) · `createSetupCheckout` (`/book-setup`).

### Dograh

Place a call by POSTing to the agent's **public trigger path**:

```
POST https://api.dograh.com/api/v1/public/agent/{AGENT_TRIGGER_PATH_UUID}
Headers: Content-Type: application/json, X-API-Key: <DOGRAH_API_KEY>
Body:    { "phone_number": "<digits only>", "initial_context": { ... } }
```

`initial_context` is passed to the agent and echoed back to `webhook/dograh`.
Bookee passes `lead_name`, `lead_email`, `business_summary`, `notion_page_id`,
`meeting_type` (`"demo"` / `"setup_call"`), `is_demo`. Configure Dograh's tools to
call the three `/api/tools/*` routes; for booking you can hardwire the calendar
with a query param on the tool URL: `…/api/tools/book-slot?meeting_type=demo`
(demo calendar) or `?meeting_type=setup_call` (real calendar).

`webhook/dograh` expects: `call_id, lead_name, lead_email, meeting_booked,
meeting_time, call_outcome` (`booked` | `no_answer` | `opted_out` |
`callback_requested` | `voicemail`), `duration` (sec), `recording_url`,
`transcript_url`, plus the `notion_page_id` you passed in.

**Starter agent prompts:** ready-to-use demo + setup agent prompts and the full
tool/webhook config are in **[docs/dograh-agents.md](./docs/dograh-agents.md)**.

### Google Calendar

OAuth2 with a long-lived **refresh token** (run `scripts/get-google-refresh-token.mjs`
once). Availability comes from `freebusy.query`; bookings use `events.insert` with
`conferenceDataVersion: 1` + `hangoutsMeet` (auto Google Meet link) and
`sendUpdates: "all"` (email invites). Default booking window is **Tue/Thu/Fri,
11am–2pm `America/Los_Angeles`, 30-min slots** over the next 14 days — change
`ALLOWED_DAYS` / `START_HOUR` / `END_HOUR` in `app/api/tools/get-slots/route.ts`
(or set `BOOKING_TIMEZONE`). Demo bookings go to `GOOGLE_DEMO_CALENDAR_ID` with a
`transparency: "transparent"` event so they never block your real availability.

> Use OAuth, not a service account — a service account writes events to its own
> invisible calendar.

### Stripe (paid path)

The webhook at `/api/webhook/stripe` verifies the signature with
`STRIPE_WEBHOOK_SECRET` and handles **only** `checkout.session.completed`. All lead
data comes from the Checkout Session **`metadata`** set in `createSetupCheckout`
(`lead_phone`, `lead_name`, `lead_email`, `package_name`, `full_price`, `deposit`,
`notion_page_id`). Point the Stripe webhook at your **www** host (a bare apex
domain that 307-redirects will break delivery), and make sure host-level
deployment protection doesn't block the endpoint.

### Notion schema

**Demo leads DB** (`NOTION_DATABASE_ID`):
`Name` (title) · `Email` (email) · `Phone` (phone) · `Website URL` (url) ·
`Status` (**Status**) · `Consent` (checkbox) · `Consent Timestamp` (date) ·
`Consent Text` (text) · `Business Summary` (text) · `Call Duration` (number) ·
`Recording URL` (url) · `Meeting Time` (text)
Status values: `New`, `Invalid Phone`, `Call Initiated`, `Meeting Scheduled`,
`No Answer`, `Opted Out`, `Callback Requested`, `Voicemail Left`, `Called`.

**Setup DB** (`NOTION_SETUP_DATABASE_ID`):
`Name` (title) · `Email` (email) · `Phone` (phone) · `Consent` (checkbox) ·
`Consent Timestamp` (date) · `Consent Text` (text) · `Business Summary` (text).

> The lead-saving code reads your database's schema and only writes columns that
> exist, matching them by name and using each column's real type — so it tolerates
> small differences (e.g. a `Select` instead of a `Status`). The two webhook routes
> assume the documented column names.

### Optional services

- **Twilio** — only a Lookup v2 GET
  (`https://lookups.twilio.com/v2/PhoneNumbers/{e164}?Fields=line_type_intelligence`,
  Basic auth). Skipped if the two vars are unset. Don't add the `twilio` package.
- **Anthropic** — direct POST to `https://api.anthropic.com/v1/messages` to
  summarize the lead's site. Skipped if `ANTHROPIC_API_KEY` is unset.

---

## Environment variables

See **[.env.example](./.env.example)** for the full annotated list. Required to run
the free demo path: Notion (`NOTION_SECRET`, `NOTION_DATABASE_ID`), Google
(`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`,
`GOOGLE_CALENDAR_ID`), and Dograh (`DOGRAH_API_KEY` + `DOGRAH_DEMO_AGENT_ID`). The
paid path adds Stripe + the setup Notion DB + `DOGRAH_SETUP_AGENT_ID`.

## Project structure

```
app/
  page.tsx                            landing page (demo form)
  book-setup/page.tsx                 paid deposit flow
  actions/
    submit-demo.ts                    demo: Notion + Twilio + Claude + Dograh
    create-setup-checkout.ts          paid: Notion + Stripe Checkout Session
  api/
    tools/get-lead-data/route.ts      Dograh pre-call lookup
    tools/get-slots/route.ts          availability
    tools/book-slot/route.ts          create booking
    webhook/dograh/route.ts           post-call → Notion
    webhook/stripe/route.ts           deposit paid → Notion + setup call
lib/
  integrations/
    notion.ts                         saveLeadToNotion()
    dograh.ts                         triggerBookeeCall() — places the call
    google-calendar.ts                OAuth client + calendar ids
    stripe.ts                         createDepositCheckout()
    twilio.ts                         optional phone validation
    anthropic.ts                      optional business summary
  setup-packages.ts                   pricing tiers + deposit math
scripts/
  get-google-refresh-token.mjs        one-time OAuth token generator
```

## Author

Built by **Summer Chang** — [LinkedIn](https://www.linkedin.com/in/summerchang/)

Questions, or want Bookee set up for you? Reach out on LinkedIn — happy to help.

<!-- Logo: drop your image into public/ and reference it here, e.g.
     ![Bookee](public/your-logo.png) -->

## License

MIT.
