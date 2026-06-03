/**
 * Optional phone validation via Twilio Lookup v2 (a single REST call — no SDK,
 * so the template doesn't need the `twilio` package). Outbound calling itself is
 * handled by Dograh, not here.
 *
 * Graceful by design: if TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN aren't set, this
 * returns `valid: true` (assume good) so it never blocks a submission.
 */

export async function isPhoneValid(phone: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !token) return true

  const auth = Buffer.from(`${sid}:${token}`).toString("base64")
  const phoneClean = phone.replace(/[\s\-()]/g, "")

  try {
    const res = await fetch(
      `https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(phoneClean)}?Fields=line_type_intelligence`,
      { headers: { Authorization: `Basic ${auth}` } },
    )
    if (!res.ok) return true // don't block on a lookup failure
    const data = await res.json()
    return data.valid !== false
  } catch (error) {
    console.error("[twilio] lookup failed, proceeding anyway:", error instanceof Error ? error.message : error)
    return true
  }
}
