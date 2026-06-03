/**
 * One-shot helper to generate a Google Calendar OAuth2 refresh token.
 *
 * Run this LOCALLY (not on Vercel) once, sign in as hisummerchang@gmail.com,
 * and copy the printed refresh_token into Vercel as GOOGLE_REFRESH_TOKEN.
 *
 * Prerequisites (Google Cloud Console → APIs & Services → Credentials):
 *   1. Create an OAuth 2.0 Client ID of type "Web application".
 *   2. Add this Authorized redirect URI:  http://localhost:53682/oauth2callback
 *   3. Enable the "Google Calendar API" for the project.
 *   4. On the OAuth consent screen, add hisummerchang@gmail.com as a Test user
 *      (or publish the app) so consent succeeds.
 *
 * Usage:
 *   GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy node scripts/get-google-refresh-token.mjs
 *
 * Then it opens a URL — sign in as hisummerchang@gmail.com, approve, and the
 * refresh token is printed to the terminal.
 */

import http from "node:http"
import { URL } from "node:url"
import { google } from "googleapis"

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const PORT = 53682
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`
const SCOPES = ["https://www.googleapis.com/auth/calendar"]

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "\n  Missing env vars. Run with:\n" +
      "  GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy node scripts/get-google-refresh-token.mjs\n"
  )
  process.exit(1)
}

const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)

const authUrl = oauth2.generateAuthUrl({
  access_type: "offline",
  prompt: "consent", // force a refresh_token even on repeat runs
  scope: SCOPES,
})

const server = http.createServer(async (req, res) => {
  if (!req.url?.startsWith("/oauth2callback")) {
    res.writeHead(404).end()
    return
  }

  const code = new URL(req.url, REDIRECT_URI).searchParams.get("code")
  if (!code) {
    res.writeHead(400).end("Missing ?code in callback")
    return
  }

  try {
    const { tokens } = await oauth2.getToken(code)
    res.writeHead(200, { "Content-Type": "text/html" })
    res.end("<h2>Success! You can close this tab and return to the terminal.</h2>")

    console.log("\n========================================")
    if (tokens.refresh_token) {
      console.log("Add this to Vercel as GOOGLE_REFRESH_TOKEN:\n")
      console.log(tokens.refresh_token)
    } else {
      console.log(
        "No refresh_token returned. This usually means you've already granted\n" +
          "consent before. Revoke access at https://myaccount.google.com/permissions\n" +
          "then run this script again."
      )
    }
    console.log("========================================\n")
  } catch (err) {
    res.writeHead(500).end("Token exchange failed — see terminal.")
    console.error("Token exchange failed:", err)
  } finally {
    server.close()
  }
})

server.listen(PORT, () => {
  console.log("\n  1. Open this URL in your browser and sign in as hisummerchang@gmail.com:\n")
  console.log("  " + authUrl + "\n")
  console.log("  2. Approve the Calendar permission.")
  console.log("  3. The refresh token will print here.\n")
})
