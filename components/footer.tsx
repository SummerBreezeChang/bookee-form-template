import Link from "next/link"

const columns = [
  {
    heading: "Product",
    links: [
      { href: "#features", label: "Features" },
      { href: "#integration", label: "Integration" },
      { href: "#demo", label: "Try Demo" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "#", label: "About" },
      { href: "mailto:contact@summerchang.co", label: "Contact" },
      { href: "mailto:contact@summerchang.co", label: "Support" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-line/15 bg-background py-12 md:py-16">
      <div className="px-6 md:px-12 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-5">
            <div className="md:col-span-2">
              <Link href="/" className="mb-4 flex items-center">
                <img src="/images/bookee-logo.png" alt="Bookee" className="h-7 w-auto" />
              </Link>
              <p className="max-w-md text-sm text-muted-foreground leading-relaxed">
                Bookee turns your contact form into a live call. Every new lead gets answered in under 60 seconds —
                qualified, booked, and on your calendar.
              </p>
            </div>

            {columns.map((col) => (
              <div key={col.heading}>
                <h3 className="mb-4 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
                  {col.heading}
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="transition-colors hover:text-foreground">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 space-y-3 border-t border-line/15 pt-8 text-center text-sm text-muted-foreground">
            <p className="mx-auto max-w-3xl text-xs leading-relaxed">
              By submitting the demo form you consent to receive an automated call from Bookee at +1 (510) 681-0766 at
              the number you provide. Consent is not a condition of purchase. Message and data rates may apply. See our{" "}
              <Link href="/privacy" className="underline hover:text-foreground">
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link href="/terms" className="underline hover:text-foreground">
                Terms
              </Link>
              .
            </p>
            <p className="font-mono text-xs">© {new Date().getFullYear()} Bookee. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
