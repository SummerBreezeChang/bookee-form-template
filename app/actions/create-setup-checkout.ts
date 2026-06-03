"use server"

import { getPackage } from "@/lib/setup-packages"

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

    // TODO: take payment and/or save the lead here (Stripe, a database, a webhook…).
    // Return the URL to redirect the user to.
    console.log("[setup submission]", input)

    // For now, skip payment and go straight to the confirmation page.
    return { success: true as const, url: "/book-setup/success" }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Could not start checkout. Please try again.",
    }
  }
}
