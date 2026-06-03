import { google } from "googleapis"

/**
 * Google Calendar via OAuth2 + a long-lived refresh token.
 * (Use OAuth, not a service account — a service account writes events to its own
 * invisible calendar.) Generate the refresh token once with
 * `node scripts/get-google-refresh-token.mjs`.
 */

export const TIMEZONE = process.env.BOOKING_TIMEZONE || "America/Los_Angeles"
export const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary"
export const DEMO_CALENDAR_ID = process.env.GOOGLE_DEMO_CALENDAR_ID || CALENDAR_ID

export function isCalendarConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN,
  )
}

export function getCalendarClient() {
  const oauth2 = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET)
  oauth2.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })
  return google.calendar({ version: "v3", auth: oauth2 })
}
