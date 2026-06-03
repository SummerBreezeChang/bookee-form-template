# Bookee — Project Status (as of 2026-05-31)

## What Bookee does

A lead fills out a form on your website (name, email, phone, business URL) → your AI voice agent calls them in seconds → books a meeting on your Google Calendar with a Meet link → sends the invite from your email. 24/7, no staff, no phone tag.

## Architecture

```
Lead submits form → Dograh voice agent calls via Twilio
                       ↓                    ↓
                  get_available_slots   book_meeting
                  (GET real calendar)   (INSERT event + Meet link)
                       ↓                    ↓
                  lib/google-calendar.ts (OAuth2 as owner)
                       ↓
                  Google Calendar API
```

### Key files

| File | Purpose |
|------|---------|
| `lib/google-calendar.ts` | Shared OAuth2 client, `CALENDAR_ID`, `TIMEZONE` |
| `app/api/tools/get-slots/route.ts` | Returns free 30-min slots (Tue/Thu/Fri 11a–2p PT) |
| `app/api/tools/book-slot/route.ts` | Inserts event, adds attendee, attaches Meet link, prevents double-booking |
| `app/api/tools/get-lead-data/route.ts` | Fetches lead data (used by Dograh) |
| `scripts/get-google-refresh-token.mjs` | One-time helper to mint OAuth refresh token |
| `components/hero.tsx` | Landing page hero + demo request form |

### Environment variables (Vercel)

| Variable | Purpose | Status |
|----------|---------|--------|
| `GOOGLE_CLIENT_ID` | OAuth client ID | ✅ Set |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret | ✅ Set |
| `GOOGLE_REFRESH_TOKEN` | OAuth refresh token (hisummerchang@gmail.com) | ✅ Set |
| `GOOGLE_CALENDAR_ID` | Calendar to read/write (`primary`) | ✅ Set |
| `DOGRAH_API_ENDPOINT` | Dograh voice agent API | ✅ Set |
| `DOGRAH_API_KEY` | Dograh auth | ✅ Set |
| `DOGRAH_WORKFLOW_UUID` | Dograh workflow ID | ✅ Set |
| `TWILIO_ACCOUNT_SID` | Twilio account | ✅ Set |
| `TWILIO_AUTH_TOKEN` | Twilio auth | ✅ Set |
| `NOTION_SECRET` | Notion integration | ✅ Set |
| `NOTION_DATABASE_ID` | Notion database | ✅ Set |
| `ANTHROPIC_API_KEY` | Anthropic API | ✅ Set |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Old service account (DEPRECATED) | 🗑️ Safe to delete |

## What works (verified live 2026-05-31)

- [x] `get-slots` returns real free/busy from hisummerchang@gmail.com calendar
- [x] `book-slot` creates event on owner's calendar, adds lead as attendee
- [x] Double-booking prevention (re-checks slot before insert)
- [x] Google Meet link auto-attached to every booking
- [x] Invite email sent from owner → lead via `sendUpdates: 'all'`
- [x] `get-slots` fails loudly if calendar is unreadable (not silently "all free")
- [x] Landing page with demo form at bookee.tech

## What's left

### Immediate (Step 5 — Dograh hardening)
- [ ] Paste updated prompts into Dograh (Global Node, Main Agenda, End Call) — drafts written, see session notes
- [ ] Gate the End Call "booked" edge on `book_meeting success: true`
- [ ] Publish the Dograh workflow
- [ ] Live test call: form submit → agent calls → books → calendar + email confirmed

### Before productizing (templatization)
- [ ] Parameterize hardcoded values: availability days/hours, timezone, slot length, business name
- [ ] Move availability rules to env vars or a config file
- [ ] Multi-tenant: each customer gets their own OAuth credentials + calendar
- [ ] Onboarding flow: guided OAuth setup + config wizard (no-code)
- [ ] "Deploy to Vercel" one-click template
- [ ] Dashboard: view bookings, reschedule/cancel, analytics

### Nice-to-haves
- [ ] Branded confirmation email (Gmail API send vs. raw Calendar invite)
- [ ] Reschedule / cancel via voice or link
- [ ] Log bookings to Notion automatically
- [ ] Website scraping → auto-generate agent prompt from business URL
- [ ] Human handoff during call
- [ ] Call recording + analytics dashboard

## Bug history (for future debugging)

| Date | Symptom | Root cause | Fix |
|------|---------|-----------|-----|
| 2026-05-31 | Events never appeared on calendar | Service account auth → wrote to SA's own calendar | Switched to OAuth as owner |
| 2026-05-31 | OAuth code not taking effect | PR not merged; production still on old `main` | Merged PR #1 |
| 2026-05-31 | `book-slot` returned "Not Found" | `GOOGLE_CALENDAR_ID` pointed at old group calendar | Set to `primary` |
| 2026-05-31 | `get-slots` showed everything free (false) | `freebusy` returns 200 for unreadable calendars | Added per-calendar error check |
