import { NextResponse } from "next/server"
import { Client } from "@notionhq/client"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Pre-call tool — Dograh calls this to look up a lead by phone number before the
 * call, so the agent can greet them by name and reference their business.
 * Returns empty strings (never errors) if Notion isn't configured or no match.
 */
export async function POST(request: Request) {
  const empty = { lead_name: "", lead_email: "", business_summary: "" }
  const auth = process.env.NOTION_SECRET
  const databaseId = (process.env.NOTION_DATABASE_ID || "").split("?")[0]
  if (!auth || !databaseId) return NextResponse.json(empty)

  try {
    const body = await request.json().catch(() => ({}))
    const raw: string =
      body.to_number || body.called_number || body.to || body.callee ||
      body.phone_number || body.call?.to_number || body.call?.to || ""
    if (!raw) return NextResponse.json(empty)

    const variations = [raw, raw.replace(/^\+/, ""), raw.replace(/^\+1/, ""), `+${raw}`, `+1${raw}`]
    const notion = new Client({ auth })

    for (const phone of variations) {
      try {
        const res = await notion.databases.query({
          database_id: databaseId,
          filter: { property: "Phone", phone_number: { equals: phone } },
          sorts: [{ timestamp: "created_time", direction: "descending" }],
          page_size: 1,
        })
        if (res.results.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const props = (res.results[0] as any).properties
          return NextResponse.json({
            lead_name: props.Name?.title?.[0]?.text?.content || "",
            lead_email: props.Email?.email || "",
            business_summary: props["Business Summary"]?.rich_text?.[0]?.text?.content || "",
          })
        }
      } catch {
        continue
      }
    }
    return NextResponse.json(empty)
  } catch {
    return NextResponse.json(empty)
  }
}
