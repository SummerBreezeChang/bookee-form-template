// Single source of truth for the "Book a Setup Call" tiers.
// Two tiers only: open-source Self-Deploy, or Done-For-You.

export const DEPOSIT_PCT = 0.25 // 25% deposit, credited toward the build

// Public open-source repo for the free Self-Deploy tier.
// TODO: update to the real public repo URL once it's published.
export const SELF_DEPLOY_GITHUB_URL = "https://github.com/SummerBreezeChang/bookee"

export type SetupPackage = {
  id: string
  name: string
  tagline: string
  price: number // full project price in USD (0 = free / open source)
  points: string[]
  recommended?: boolean
}

export const SETUP_PACKAGES: SetupPackage[] = [
  {
    id: "self-deploy",
    name: "Self-Deploy",
    tagline: "Free & open source — grab it on GitHub and run it yourself.",
    price: 0,
    points: ["Full template repo + build guide", "Notion database template", "You build and own everything"],
  },
  {
    id: "done-for-you",
    name: "Done-For-You",
    tagline: "We build, test, and hand it over ready to go.",
    price: 3497,
    recommended: true,
    points: [
      "Full custom build: agent, voice, calendar, CRM",
      "Form integration on your site",
      "Testing + handoff (optional monthly retainer)",
    ],
  },
]

export function getPackage(id: string): SetupPackage | undefined {
  return SETUP_PACKAGES.find((p) => p.id === id)
}

/** Deposit in cents (for Stripe unit_amount). */
export function depositCents(price: number): number {
  return Math.round(price * DEPOSIT_PCT * 100)
}

/** Formatted deposit string, e.g. "374.25" — precise to what we charge. */
export function depositDisplay(price: number): string {
  return (depositCents(price) / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
