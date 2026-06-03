import { NextResponse } from "next/server"
import {
  getCalendarClient,
  CALENDAR_ID,
  DEMO_CALENDAR_ID,
  TIMEZONE,
  isCalendarConfigured,
} from "@/lib/integrations/google-calendar"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SLOT_MINUTES = 30

/**
 * In-call tool — books the slot the lead chose and returns a Google Meet link.
 *
 * Body: { slot (ISO datetime), lead_email, lead_name, meeting_type? }
 * You can also hardwire the calendar from the tool URL:
 *   …/api/tools/book-slot?meeting_type=demo        → demo calendar
 *   …/api/tools/book-slot?meeting_type=setup_call  → real calendar
 */
export async function POST(request: Request) {
  try {
    if (!isCalendarConfigured()) {
      return NextResponse.json({ success: false, message: "Booking isn't configured yet." })
    }

    const url = new URL(request.url)
    const body = await request.json()
    const { slot, lead_email, lead_name } = body
    const meetingType = body.meeting_type || url.searchParams.get("meeting_type") || undefined
    const isDemo = meetingType === "demo" || body.is_demo === true || url.searchParams.get("is_demo") === "true"
    const targetCalendarId = isDemo ? DEMO_CALENDAR_ID : CALENDAR_ID

    if (!slot) return NextResponse.json({ success: false, message: "Which time would you like?" })
    const start = new Date(slot)
    if (isNaN(start.getTime())) {
      return NextResponse.json({ success: false, message: "That time didn't come through clearly." })
    }
    const end = new Date(start.getTime() + SLOT_MINUTES * 60 * 1000)

    const calendar = getCalendarClient()

    // Re-check the slot is still free before booking.
    const fb = await calendar.freebusy.query({
      requestBody: {
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
        timeZone: TIMEZONE,
        items: [{ id: targetCalendarId }],
      },
    })
    const busy = fb.data.calendars?.[targetCalendarId]?.busy || []
    if (busy.length > 0) {
      return NextResponse.json({ success: false, message: "That slot was just taken — pick another." })
    }

    const summary = isDemo
      ? `Demo — ${lead_name || "New Lead"}`
      : meetingType === "setup_call"
        ? `Setup Call — ${lead_name || "New Lead"}`
        : `Meeting — ${lead_name || "New Lead"}`

    const attendees = lead_email ? [{ email: lead_email }] : []

    const event = await calendar.events.insert({
      calendarId: targetCalendarId,
      sendUpdates: "all",
      conferenceDataVersion: 1,
      requestBody: {
        summary,
        transparency: isDemo ? "transparent" : "opaque",
        description: `Booked via AI agent${isDemo ? " (test demo — not a real booking)" : ""}\nLead: ${lead_name || "Unknown"}\nEmail: ${lead_email || "Not provided"}`,
        start: { dateTime: start.toISOString(), timeZone: TIMEZONE },
        end: { dateTime: end.toISOString(), timeZone: TIMEZONE },
        attendees,
        conferenceData: {
          createRequest: {
            requestId: `booking-${start.getTime()}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      },
    })

    const meetLink =
      event.data.hangoutLink ||
      event.data.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri ||
      null

    return NextResponse.json({
      success: true,
      eventId: event.data.id,
      slot: start.toISOString(),
      meetLink,
      message: `Your meeting is booked for ${slot}.`,
    })
  } catch (error) {
    console.error("[book-slot] error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ success: false, message: "Something went wrong booking the meeting." })
  }
}
