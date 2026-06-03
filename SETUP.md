# Bookee — Setup Guide (two separate paths)

There are **two completely separate booking paths**. Each uses its own
Dograh agent, its own Notion database, and (for bookings) a different
Google Calendar. This doc lists exactly what **you** create and which
**Vercel environment variable** to paste the value into.

```
PATH 1 — FREE LIVE DEMO            PATH 2 — PAID SETUP CALL (/book-setup)
form on homepage                   choose tier → 25% Stripe deposit
   ↓                                  ↓
Demo Dograh agent                  Stripe webhook (payment verified)
   ↓                                  ↓
books DEMO calendar (TEST title)   Setup Dograh agent
saved to DEMO Notion DB            books PRIMARY calendar (real)
                                   saved to SETUP Notion DB
```

---

## 1) Stripe (paid path only)

1. Create/log in to a **Stripe** account → keep it in **Test mode** for now
   (toggle top-right).
2. **Developers → API keys** → copy the **Secret key** (`sk_test_…`).
   → Vercel env: `STRIPE_SECRET_KEY`
3. **Developers → Webhooks → Add endpoint**
   - Endpoint URL: `https://bookee.tech/api/webhook/stripe`
     (or your Vercel **preview** URL while testing)
   - Events to send: **`checkout.session.completed`**
   - After saving, click the endpoint → **Reveal signing secret** (`whsec_…`).
     → Vercel env: `STRIPE_WEBHOOK_SECRET`
4. Test checkout uses card `4242 4242 4242 4242`, any future expiry, any CVC.
5. When everything works, flip Stripe to **Live mode**, repeat steps 2–3 with
   the **live** keys, and update the two Vercel vars.

**Refund (after the call, if they don't proceed):** Stripe Dashboard →
**Payments** → open the payment → **Refund** → full amount. No code needed.

---

## 2) Dograh — you need a SECOND agent

- **Path 1 (demo):** your existing agent already works. (Optional: set
  `DOGRAH_DEMO_AGENT_ID` to pin it; otherwise it defaults to the current one.)
- **Path 2 (setup):** create a **new Dograh agent** with a *scheduling*
  script (it calls people who already paid, to book the real call).
  - Same Dograh account is fine — just a new agent. → `DOGRAH_SETUP_AGENT_ID`
    (the UUID in the agent URL).
  - If it's a different Dograh login, also set `DOGRAH_SETUP_API_KEY`.

**Important (both agents):** in the agent's **book-slot tool**, forward
`meeting_type` from `initial_context` into the request body. The demo agent
sends `meeting_type: "demo"`; the setup agent sends `meeting_type: "setup_call"`.
That's what routes demos to the demo calendar (TEST title) and paid calls to
your real calendar.

---

## 3) Google Calendar — primary + demo

- **Primary** (real bookings): you already have `GOOGLE_CALENDAR_ID`.
- **Demo** ("Bookee Demos"): in Google Calendar create/locate it →
  **Settings → Integrate calendar → Calendar ID** → copy it.
  Make sure the same service account/OAuth user can write to it.
  → Vercel env: `GOOGLE_DEMO_CALENDAR_ID`

> If `GOOGLE_DEMO_CALENDAR_ID` is unset, demos fall back to your primary
> calendar but still carry the `TEST LIVE DEMO` title.

---

## 4) Notion — two databases

- **Demo DB** (existing): `NOTION_SECRET` + `NOTION_DATABASE_ID`.
- **Setup DB** (new): duplicate the lead template into a new database for
  paid calls, share it with your Notion integration, copy its ID.
  → Vercel env: `NOTION_SETUP_DATABASE_ID`
  (Set `NOTION_SETUP_SECRET` only if it's a different integration.)

The setup DB needs these properties (same names the code writes):
`Name` (title), `Email` (email), `Phone` (phone), `Consent` (checkbox),
`Consent Timestamp` (date), `Consent Text` (rich text),
`Business Summary` (rich text).

---

## 5) Vercel — environment variables checklist

| Variable | Path | What it is |
|---|---|---|
| `STRIPE_SECRET_KEY` | paid | Stripe secret key (`sk_test_…` then `sk_live_…`) |
| `STRIPE_WEBHOOK_SECRET` | paid | Webhook signing secret (`whsec_…`) |
| `DOGRAH_SETUP_AGENT_ID` | paid | New scheduling agent's UUID |
| `DOGRAH_SETUP_API_KEY` | paid | Only if the setup agent is a different Dograh login |
| `NOTION_SETUP_DATABASE_ID` | paid | New Notion DB for paid calls |
| `NOTION_SETUP_SECRET` | paid | Only if a different Notion integration |
| `GOOGLE_DEMO_CALENDAR_ID` | demo | "Bookee Demos" calendar ID |
| `DOGRAH_DEMO_AGENT_ID` | demo | Optional — pin the demo agent |
| `NEXT_PUBLIC_SITE_URL` | both | e.g. `https://bookee.tech` (exact Stripe redirect URLs) |

Existing (already set): `NOTION_SECRET`, `NOTION_DATABASE_ID`, `DOGRAH_API_KEY`,
`GOOGLE_CLIENT_ID/SECRET/REFRESH_TOKEN`, `GOOGLE_CALENDAR_ID`, `ANTHROPIC_API_KEY`,
`TWILIO_*`.

---

## 6) Prices (live in code)

From the Notion "Three Tiers" doc — edit `lib/setup-packages.ts` to change:

- Self-Deploy — $297
- Guided Setup ⭐ — $1,497
- Done-For-You — $3,497

Deposit is **25%** of the chosen tier, fully refundable, credited toward the build.
