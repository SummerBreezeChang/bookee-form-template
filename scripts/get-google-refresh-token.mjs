/**
 * One-time helper to mint a Google Calendar refresh token for the OAuth client.
 *
 * Usage:
 *   export GOOGLE_CLIENT_ID="..."        # PowerShell: $env:GOOGLE_CLIENT_ID="..."
 *   export GOOGLE_CLIENT_SECRET="..."
 *   node scripts/get-google-refresh-token.mjs
 *
 * Make sure your OAuth client lists this redirect URI:
 *   http://localhost:53682/callback
 *
 * Run it LOCALLY, approve the Calendar permission in the browser, and copy the
 * printed GOOGLE_REFRESH_TOKEN into .env.local (and your host's env vars).
 */
import http from "node:http"
import { URL } from "node:url"
import { google } from "googleapis"

const PORT = 53682
const REDIRECT_URI = `http://localhost:${PORT}/callback`
const SCOPES = ["https://www.googleapis.com/auth/calendar"]

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "\n  Missing env vars. Run with:\n" +
      "  GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy node scripts/get-google-refresh-token.mjs\n",
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
  if (!req.url?.startsWith("/callback")) {
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
      console.log("Add this to your .env.local (and host env vars):\n")
      console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`)
    } else {
      console.log(
        "No refresh_token returned. You've likely granted consent before —\n" +
          "revoke access at https://myaccount.google.com/permissions and re-run.",
      )
    }
    console.log("========================================\n")
  } catch (err) {
    res.writeHead(500).end("Token exchange failed — see terminal.")
    console.error("Token exchange failed:", err)
  } finally {
    server.close()
    process.exit(0)
  }
})

server.listen(PORT, () => {
  console.log("\n  1. Open this URL in your browser and approve Calendar access:\n")
  console.log("  " + authUrl + "\n")
  console.log("  2. The refresh token will print here.\n")
})
