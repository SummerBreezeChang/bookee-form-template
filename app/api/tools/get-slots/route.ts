import { NextResponse } from "next/server"
import { getCalendarClient, CALENDAR_ID, TIMEZONE, isCalendarConfigured } from "@/lib/integrations/google-calendar"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * In-call tool — returns available 30-minute slots for the agent to offer.
 *
 * Booking window (edit to taste): Tue/Thu/Fri, 11:00–14:00 in TIMEZONE, 30-min
 * slots, over the next 14 days, with busy times removed via the Calendar
 * free/busy API and the list capped at 12.
 */
const ALLOWED_DAYS = [2, 4, 5] // 0=Sun, 1=Mon, … 2=Tue, 4=Thu, 5=Fri
const START_HOUR = 11
const END_HOUR = 14
const SLOT_MINUTES = 30
const MAX_SLOTS = 12
const HORIZON_DAYS = 14

const SHORT_DAY: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

// The UTC instant for a given wall-clock time in a timezone (DST-aware).
function wallTimeToUtc(year: number, monthIndex: number, day: number, hour: number, minute: number, timeZone: string): Date {
  const guess = Date.UTC(year, monthIndex, day, hour, minute)
  const asTz = new Date(new Date(guess).toLocaleString("en-US", { timeZone }))
  const asUtc = new Date(new Date(guess).toLocaleString("en-US", { timeZone: "UTC" }))
  return new Date(guess - (asTz.getTime() - asUtc.getTime()))
}

function weekdayInTz(date: Date, timeZone: string): number {
  const short = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date)
  return SHORT_DAY[short] ?? -1
}

function labelInTz(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(date)
}

function dayKeyInTz(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone, weekday: "long", month: "short", day: "numeric" }).format(date)
}

export async function POST() {
  if (!isCalendarConfigured()) {
    return NextResponse.json({ slots: [], message: "Scheduling isn't configured yet." })
  }

  try {
    const calendar = getCalendarClient()
    const now = new Date()
    const horizon = new Date(now.getTime() + HORIZON_DAYS * 24 * 60 * 60 * 1000)

    const busyResponse = await calendar.freebusy.query({
      requestBody: {
        timeMin: now.toISOString(),
        timeMax: horizon.toISOString(),
        timeZone: TIMEZONE,
        items: [{ id: CALENDAR_ID }],
      },
    })

    const calendarData = busyResponse.data.calendars?.[CALENDAR_ID]
    if (calendarData?.errors?.length) {
      // Avoid a false "everything is free" when the calendar can't be read.
      return NextResponse.json({ error: "Could not read the calendar", slots: [] }, { status: 500 })
    }
    const busy = (calendarData?.busy || []).map((b) => ({
      start: new Date(b.start as string).getTime(),
      end: new Date(b.end as string).getTime(),
    }))

    // Base date parts (in TIMEZONE) for "today".
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now)
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
    const baseY = get("year")
    const baseM = get("month") - 1
    const baseD = get("day")

    const available: { iso: string; label: string; day: string }[] = []

    for (let d = 0; d < HORIZON_DAYS && available.length < MAX_SLOTS; d++) {
      const probe = wallTimeToUtc(baseY, baseM, baseD + d, 12, 0, TIMEZONE)
      if (!ALLOWED_DAYS.includes(weekdayInTz(probe, TIMEZONE))) continue

      for (let t = START_HOUR * 60; t <= END_HOUR * 60 - SLOT_MINUTES; t += SLOT_MINUTES) {
        const start = wallTimeToUtc(baseY, baseM, baseD + d, Math.floor(t / 60), t % 60, TIMEZONE)
        if (start.getTime() <= now.getTime()) continue
        const end = start.getTime() + SLOT_MINUTES * 60 * 1000
        const conflict = busy.some((b) => start.getTime() < b.end && end > b.start)
        if (conflict) continue
        available.push({ iso: start.toISOString(), label: labelInTz(start, TIMEZONE), day: dayKeyInTz(start, TIMEZONE) })
        if (available.length >= MAX_SLOTS) break
      }
    }

    // Group into a friendly per-day summary for the agent to read aloud.
    const byDay = new Map<string, string[]>()
    for (const s of available) {
      const time = new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(s.iso))
      byDay.set(s.day, [...(byDay.get(s.day) || []), time])
    }
    const message = available.length
      ? "Available: " + [...byDay.entries()].map(([day, times]) => `${day} — ${times.join(", ")}`).join("; ")
      : "No open slots in the next two weeks."

    return NextResponse.json({ slots: available.map(({ iso, label }) => ({ iso, label })), message })
  } catch (error) {
    console.error("[get-slots] error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Could not check calendar", slots: [] }, { status: 500 })
  }
}
