/**
 * Optional: summarize a lead's business in one sentence (so the voice agent has
 * context). Plain fetch to the Anthropic Messages API — no SDK.
 *
 * Graceful by design: if ANTHROPIC_API_KEY isn't set (or anything fails), it
 * returns "" and the caller simply proceeds without a summary.
 */

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6"

export async function summarizeBusiness(businessUrl: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || !businessUrl) return ""

  try {
    // Fetch the site (5s budget) and strip tags to plain-ish text.
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const siteRes = await fetch(businessUrl, { signal: controller.signal }).catch(() => null)
    clearTimeout(timeout)
    const html = siteRes && siteRes.ok ? await siteRes.text() : ""
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4000)

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 150,
        messages: [
          {
            role: "user",
            content: `In one sentence, summarize what this business does. If there isn't enough information, reply with exactly "".\n\nWebsite: ${businessUrl}\n\n${text}`,
          },
        ],
      }),
    })
    if (!res.ok) return ""
    const data = await res.json()
    const summary = (data?.content?.[0]?.text ?? "").trim()
    // Drop hedging / "not enough info" style answers.
    if (!summary || /insufficient|not enough|unable|cannot determine/i.test(summary)) return ""
    return summary.slice(0, 2000)
  } catch (error) {
    console.error("[anthropic] summary failed:", error instanceof Error ? error.message : error)
    return ""
  }
}
