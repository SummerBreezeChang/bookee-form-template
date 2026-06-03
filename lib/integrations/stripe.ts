import Stripe from "stripe"

/**
 * Create a Stripe Checkout Session for the setup deposit and return its URL.
 *
 * Graceful by design: if STRIPE_SECRET_KEY isn't set, this returns null and the
 * caller falls back to the local confirmation page — so the booking flow works
 * (minus real payment) with zero configuration.
 */

type CheckoutInput = {
  productName: string
  amountCents: number
  email?: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}

export async function createDepositCheckout(input: CheckoutInput): Promise<string | null> {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    console.log("[stripe] skipped — set STRIPE_SECRET_KEY to enable real payments")
    return null
  }

  try {
    const stripe = new Stripe(key)
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: input.email,
      metadata: input.metadata,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: input.amountCents,
            product_data: { name: input.productName },
          },
        },
      ],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    })
    return session.url
  } catch (error) {
    console.error("[stripe] failed:", error instanceof Error ? error.message : error)
    return null
  }
}
