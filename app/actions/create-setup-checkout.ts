"use server"

import { headers } from "next/headers"
import { getPackage, depositCents, depositDisplay, DEPOSIT_PCT } from "@/lib/setup-packages"
import { saveLeadToNotion } from "@/lib/integrations/notion"
import { createDepositCheckout } from "@/lib/integrations/stripe"

type SetupCheckoutInput = {
  packageId: string
  name: string
  email: string
  phone: string
  consent: boolean
  consentText?: string
}

export async function createSetupCheckout(input: SetupCheckoutInput) {
  try {
    const pkg = getPackage(input.packageId)
    if (!pkg) return { success: false as const, error: "Please choose a setup package." }
    if (pkg.price <= 0)
      return { success: false as const, error: "That option is free — grab it on GitHub." }
    if (!input.consent)
      return { success: false as const, error: "Please agree before continuing." }
    if (!input.name || !input.email || !input.phone)
      return { success: false as const, error: "Please fill in your name, email, and phone." }

    const depositPct = Math.round(DEPOSIT_PCT * 100)
    const depositNote = `Setup Call — ${pkg.name} ($${pkg.price}). Deposit $${depositDisplay(pkg.price)} (${depositPct}%). Awaiting payment.`

    // Record the lead in the setup database (falls back to NOTION_SECRET/DB if the
    // setup-specific vars aren't set; no-op entirely if Notion isn't configured).
    const saved = await saveLeadToNotion(
      {
        name: input.name,
        email: input.email,
        phone: input.phone,
        package: pkg.name,
        consent: input.consent,
        consentText: input.consentText,
        businessSummary: depositNote,
      },
      { databaseId: process.env.NOTION_SETUP_DATABASE_ID, secret: process.env.NOTION_SETUP_SECRET },
    )
    const notionPageId = saved.ok ? saved.pageId : ""

    // Build the redirect origin from env or the incoming request.
    const h = await headers()
    const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000"
    const proto = h.get("x-forwarded-proto") || "http"
    const origin = process.env.NEXT_PUBLIC_SITE_URL || `${proto}://${host}`

    const url = await createDepositCheckout({
      productName: `${pkg.name} — Setup Deposit (${depositPct}%)`,
      amountCents: depositCents(pkg.price),
      email: input.email,
      successUrl: `${origin}/book-setup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/book-setup?canceled=1`,
      metadata: {
        package_id: pkg.id,
        package_name: pkg.name,
        full_price: String(pkg.price),
        deposit: depositDisplay(pkg.price),
        lead_name: input.name,
        lead_phone: input.phone,
        lead_email: input.email,
        notion_page_id: notionPageId ?? "",
      },
    })

    // If Stripe isn't configured, skip payment and go to the confirmation page.
    return { success: true as const, url: url ?? "/book-setup/success" }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Could not start checkout. Please try again.",
    }
  }
}
