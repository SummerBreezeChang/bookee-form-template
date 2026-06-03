import { NextResponse } from "next/server"
import { Client } from "@notionhq/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Dograh post-call webhook — writes the call outcome back to the Notion lead.
 *
 * Configure your Dograh agent to POST results here:
 *   https://<your-domain>/api/webhook/dograh
 * It must include the `notion_page_id` you passed in `initial_context`.
 *
 * Expected body: { call_outcome, duration, recording_url, meeting_time, notion_page_id, ... }
 * call_outcome ∈ booked | no_answer | opted_out | callback_requested | voicemail
 */

function statusFromOutcome(outcome: string): string {
  switch (outcome) {
    case "booked":
      return "Meeting Scheduled"
    case "no_answer":
      return "No Answer"
    case "opted_out":
      return "Opted Out"
    case "callback_requested":
      return "Callback Requested"
    case "voicemail":
      return "Voicemail Left"
    default:
      return "Called"
  }
}

export async function POST(request: Request) {
  try {
    const auth = process.env.NOTION_SECRET
    const body = await request.json()
    const { meeting_time, call_outcome, duration, recording_url, notion_page_id } = body

    if (auth && notion_page_id) {
      const notion = new Client({ auth })
      const properties: Record<string, unknown> = {
        // "Status" is a Status-type column (matches submit-demo.ts).
        Status: { status: { name: statusFromOutcome(call_outcome) } },
      }
      if (duration) properties["Call Duration"] = { number: parseInt(String(duration), 10) }
      if (recording_url) properties["Recording URL"] = { url: recording_url }
      if (meeting_time) properties["Meeting Time"] = { rich_text: [{ text: { content: String(meeting_time) } }] }

      await notion.pages.update({ page_id: notion_page_id, properties: properties as never })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[dograh webhook] error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ received: true, error: "Processing failed" })
  }
}
