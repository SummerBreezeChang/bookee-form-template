import { Client } from "@notionhq/client"

/**
 * Save a form submission as a row in a Notion database.
 *
 * Graceful by design: if NOTION_SECRET / NOTION_DATABASE_ID aren't set, this is a
 * no-op (it just logs and returns) so the template runs fine with no configuration.
 *
 * It reads the database schema and only fills columns that actually exist, matching
 * them to the submitted fields by name (case/spacing-insensitive) and writing each
 * value using the column's real type. So whether your "Status" column is a Status or
 * a Select, or your link column is called "Website URL" or "Business URL", it just
 * works — the database only needs a title column to succeed.
 */

export type Lead = Record<string, string | boolean | number | null | undefined>

type SaveOptions = { databaseId?: string; secret?: string }

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "")

// Alternate column names -> the normalized lead field they map to.
const ALIASES: Record<string, string> = {
  fullname: "name",
  website: "businessurl",
  websiteurl: "businessurl",
  url: "businessurl",
  business: "businessurl",
  tier: "package",
  plan: "package",
  agreed: "consent",
}

function toPropertyValue(type: string, value: unknown): unknown {
  const str = value == null ? "" : String(value)
  switch (type) {
    case "title":
      return { title: [{ text: { content: str || "New submission" } }] }
    case "rich_text":
      return { rich_text: [{ text: { content: str } }] }
    case "email":
      return { email: str || null }
    case "phone_number":
      return { phone_number: str || null }
    case "url":
      return { url: str || null }
    case "number": {
      const n = Number(value)
      return { number: Number.isFinite(n) ? n : null }
    }
    case "checkbox":
      return { checkbox: Boolean(value) }
    case "date":
      return { date: str ? { start: str } : null }
    case "select":
      return str ? { select: { name: str } } : undefined
    case "status":
      return str ? { status: { name: str } } : undefined
    default:
      return undefined
  }
}

export async function saveLeadToNotion(lead: Lead, opts: SaveOptions = {}) {
  const secret = opts.secret ?? process.env.NOTION_SECRET
  const databaseId = (opts.databaseId ?? process.env.NOTION_DATABASE_ID ?? "").split("?")[0]
  if (!secret || !databaseId) {
    console.log("[notion] skipped — set NOTION_SECRET and NOTION_DATABASE_ID to enable")
    return { ok: false, skipped: true as const }
  }

  // Index the submitted fields by their normalized key for easy lookup.
  const byKey: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(lead)) byKey[norm(k)] = v

  try {
    const notion = new Client({ auth: secret })
    const db = await notion.databases.retrieve({ database_id: databaseId })

    const properties: Record<string, unknown> = {}
    for (const [propName, def] of Object.entries(db.properties as Record<string, { type: string }>)) {
      const key = norm(propName)
      let value = byKey[key] ?? byKey[ALIASES[key] ?? ""]

      if (def.type === "title") {
        properties[propName] = toPropertyValue("title", value ?? lead.name ?? lead.email)
        continue
      }
      // Stamp a fresh lead as "New" if there's a Status/Select column and no value.
      if ((def.type === "status" || def.type === "select") && value == null && key === "status") {
        value = "New"
      }
      // Auto-stamp obvious date columns when we weren't given a value.
      if (def.type === "date" && value == null && /(date|submitted|created|timestamp)/.test(key)) {
        value = new Date().toISOString()
      }
      if (value == null) continue // leave columns we have no data for untouched
      const pv = toPropertyValue(def.type, value)
      if (pv !== undefined) properties[propName] = pv
    }

    const page = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: properties as never,
    })
    return { ok: true as const, pageId: page.id }
  } catch (error) {
    console.error("[notion] failed:", error instanceof Error ? error.message : error)
    return { ok: false as const, error }
  }
}
