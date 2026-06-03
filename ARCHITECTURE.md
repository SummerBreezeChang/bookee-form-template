# Bookee — Architecture

## System overview

Bookee is a voice-first AI booking assistant. A lead fills out a web form, a voice agent calls them, and it books a meeting on the business owner's Google Calendar — all automated.

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  bookee.tech    │────▶│   Dograh     │────▶│   Twilio        │
│  (Next.js app)  │     │  (voice AI)  │     │  (phone call)   │
│                 │     │              │     │                 │
│  - Landing page │     │  - NLP       │     │  - Outbound     │
│  - Demo form    │     │  - Turn mgmt │     │    dial to lead │
│  - Tool APIs    │◀────│  - Tool use  │     │                 │
└─────────────────┘     └──────────────┘     └─────────────────┘
        │
        ▼
┌─────────────────┐
│  Google Calendar │
│  API (OAuth2)   │
│                 │
│  - freebusy     │
│  - events.insert│
│  - Meet link    │
└─────────────────┘
```

## Request flow

### 1. Lead submits form
- `components/hero.tsx` collects: name, email, phone, business URL.
- Form submission triggers the Dograh API (via `DOGRAH_API_ENDPOINT`).
- Lead data is passed as `initial_context` so the agent knows `{{lead_name}}`, `{{lead_email}}`, `{{business_summary}}`.

### 2. Voice agent calls the lead
- Dograh orchestrates the call via Twilio.
- The agent greets the lead by name, references their business, and offers to schedule.

### 3. Agent fetches availability
- Agent calls tool `get_available_slots` → hits `POST /api/tools/get-slots`.
- The endpoint authenticates as the owner via OAuth2 (`lib/google-calendar.ts`).
- Queries Google Calendar `freebusy` API for the next 2 weeks.
- Filters to allowed days/hours (Tue/Thu/Fri, 11a–2p PT).
- Returns structured slots: `{ iso: string, label: string }[]`.

### 4. Agent books the meeting
- Agent calls tool `book_meeting` with the chosen slot's `iso` value → hits `POST /api/tools/book-slot`.
- Re-checks the slot is still free (prevents double-booking).
- Creates the event with:
  - Owner as organizer
  - Lead as attendee
  - Google Meet link (`conferenceData`)
  - `sendUpdates: 'all'` → Google emails the invite from the owner
- Returns `{ success, eventId, slot, meetLink, message }`.

## Authentication

### Google Calendar (OAuth2)
- **Not a service account.** Uses OAuth2 with a refresh token for the business owner's personal Google account.
- Env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`.
- `GOOGLE_CALENDAR_ID` = `primary` (the owner's main calendar).
- Refresh token minted via `scripts/get-google-refresh-token.mjs` (one-time local script).

### Why not service account?
A service account writes to its *own* calendar (invisible to the owner) and can't send invites "from" a real person. OAuth2 writes to the owner's actual calendar and sends invites from their email.

## Availability rules (currently hardcoded)

| Setting | Value | File | Line |
|---------|-------|------|------|
| Allowed days | Tue, Thu, Fri | `get-slots/route.ts` | `ALLOWED_DAYS = [2, 4, 5]` |
| Start hour (PT) | 11:00 AM | `get-slots/route.ts` | `START_HOUR = 11` |
| End hour (PT) | 2:00 PM | `get-slots/route.ts` | `END_HOUR = 14` |
| Slot length | 30 min | `get-slots/route.ts` | `SLOT_MINUTES = 30` |
| Timezone | America/Los_Angeles | `lib/google-calendar.ts` | `TIMEZONE` |
| Look-ahead | 14 days | `get-slots/route.ts` | `14 * 24 * 60 * 60 * 1000` |

These must be parameterized before multi-tenant use.

## Dograh voice flow

```
API Trigger (#5)
    │
    ▼
Start Call (#1)
    │  tools: book_meeting, get_available_slots
    │
    ▼  ── "Move to Main Agenda" ──▶
                                    Main Agenda (#2)
                                    │  tools: book_meeting, get_available_slots
                                    │
                                    ▼  ── "End call" ──▶
                                                         End Call (#4)

Global Node (#0) — applies to all nodes
```

### Tool mapping (Dograh → API)
| Dograh tool name | API endpoint |
|-----------------|--------------|
| `get_available_slots` | `POST /api/tools/get-slots` |
| `book_meeting` | `POST /api/tools/book-slot` |

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router), React, Tailwind CSS, shadcn/ui |
| Backend | Next.js API routes (serverless on Vercel) |
| Voice AI | Dograh (NLP, turn management, tool calling) |
| Telephony | Twilio (outbound calls) |
| Calendar | Google Calendar API v3 (OAuth2) |
| Video | Google Meet (auto-attached) |
| Database | Notion (lead tracking) |
| Hosting | Vercel |
| Domain | bookee.tech |

## Key design decisions

1. **Tool endpoints are stateless** — no database, no session. Each call to get-slots or book-slot is independent. State lives in Google Calendar (source of truth) and Dograh (conversation state).

2. **Double-booking prevention is optimistic** — book-slot re-queries freebusy right before inserting. There's a small race window (ms), acceptable for the booking volume.

3. **freebusy error surfacing** — Google's freebusy API returns 200 even for unreadable calendars (with an `errors` array). get-slots now checks this and fails loudly instead of reporting "all free."

4. **Meet link via createRequest** — uses `conferenceData.createRequest` with `conferenceSolutionKey: hangoutsMeet`, which works for standard Gmail accounts.
