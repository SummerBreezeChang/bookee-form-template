import { NextResponse } from "next/server"
import Stripe from "stripe"
import { Client } from "@notionhq/client"
import { triggerBookeeCall } from "@/lib/integrations/dograh"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Stripe webhook — handles `checkout.session.completed` for the setup deposit.
 *
 * Point your Stripe webhook endpoint at https://<your-domain>/api/webhook/stripe
 * (use the exact host your site serves from — a redirect will break delivery) and
 * put its signing secret in STRIPE_WEBHOOK_SECRET.
 *
 * On a paid deposit it (1) marks the Notion lead paid and (2) triggers the Dograh
 * "setup" agent to call and schedule. All lead data comes from the Checkout
 * Session metadata set in create-setup-checkout.ts.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })
  }

  const stripe = new Stripe(secret)
  const body = await request.text()
  const signature = request.headers.get("stripe-signature") || ""

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error("[stripe webhook] signature verification failed:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const meta = session.metadata || {}

    // 1) Mark the lead paid in Notion (best-effort).
    const notionAuth = process.env.NOTION_SETUP_SECRET || process.env.NOTION_SECRET
    if (notionAuth && meta.notion_page_id) {
      try {
        const notion = new Client({ auth: notionAuth })
        await notion.pages.update({
          page_id: meta.notion_page_id,
          properties: {
            "Business Summary": {
              rich_text: [
                {
                  text: {
                    content: `Setup Call — ${meta.package_name} ($${meta.full_price}). DEPOSIT PAID $${meta.deposit}. Scheduling call triggered.`,
                  },
                },
              ],
            },
          },
        })
      } catch (error) {
        console.error("[stripe webhook] Notion update failed:", error instanceof Error ? error.message : error)
      }
    }

    // 2) Trigger the setup agent to call + schedule.
    if (meta.lead_phone) {
      await triggerBookeeCall("setup", meta.lead_phone, {
        lead_name: meta.lead_name || "",
        lead_email: meta.lead_email || session.customer_details?.email || "",
        package_name: meta.package_name || "",
        notion_page_id: meta.notion_page_id || "",
        meeting_type: "setup_call",
        is_demo: false,
        deposit_paid: true,
      })
    }
  }

  return NextResponse.json({ received: true })
}
