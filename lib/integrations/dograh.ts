/**
 * Trigger a Dograh AI voice agent to call a lead.
 *
 * Graceful by design: if the agent id / API key for the requested kind aren't set,
 * this is a no-op so the template runs fine with no configuration.
 *
 * Two "kinds" of call, each with its own agent + (optional) key:
 *   - "demo"  → DOGRAH_DEMO_AGENT_ID  (or DOGRAH_AGENT_ID), DOGRAH_DEMO_API_KEY  (or DOGRAH_API_KEY)
 *   - "setup" → DOGRAH_SETUP_AGENT_ID,                       DOGRAH_SETUP_API_KEY (or DOGRAH_API_KEY)
 *
 * Whatever you pass as `context` is handed to the agent as `initial_context` during
 * the call and echoed back to your post-call webhook (e.g. notion_page_id).
 */

export type CallKind = "demo" | "setup"

// Dograh can be cloud or self-hosted — override the base if needed.
const API_BASE = process.env.DOGRAH_API_BASE ?? "https://api.dograh.com"

function agentConfig(kind: CallKind): { agentId?: string; apiKey?: string } {
  if (kind === "setup") {
    return {
      agentId: process.env.DOGRAH_SETUP_AGENT_ID,
      apiKey: process.env.DOGRAH_SETUP_API_KEY || process.env.DOGRAH_API_KEY,
    }
  }
  return {
    agentId: process.env.DOGRAH_DEMO_AGENT_ID || process.env.DOGRAH_AGENT_ID,
    apiKey: process.env.DOGRAH_DEMO_API_KEY || process.env.DOGRAH_API_KEY,
  }
}

export async function triggerBookeeCall(kind: CallKind, phone: string, context: Record<string, unknown> = {}) {
  const { agentId, apiKey } = agentConfig(kind)
  if (!apiKey || !agentId) {
    console.log(`[dograh] skipped ${kind} call — set the ${kind} agent id and an API key to enable`)
    return { ok: false, skipped: true as const }
  }

  const phoneClean = phone.replace(/[\s\-()]/g, "")

  try {
    const res = await fetch(`${API_BASE}/api/v1/public/agent/${agentId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
      body: JSON.stringify({ phone_number: phoneClean, initial_context: context }),
    })
    if (!res.ok) {
      console.error(`[dograh] ${kind} trigger failed:`, res.status, await res.text().catch(() => ""))
      return { ok: false as const, status: res.status }
    }
    return { ok: true as const, data: await res.json().catch(() => null) }
  } catch (error) {
    console.error(`[dograh] failed to trigger ${kind} call:`, error instanceof Error ? error.message : error)
    return { ok: false as const, error }
  }
}
