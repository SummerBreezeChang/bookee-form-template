import Link from "next/link"

export const metadata = {
  title: "Terms of Service — Bookee",
  description: "The terms that govern your use of Bookee.",
}

const UPDATED = "May 31, 2026"

export default function TermsPage() {
  return (
    <main className="bg-background px-6 py-16 md:px-12 lg:px-20 md:py-24">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-primary hover:underline">
          ← Back to home
        </Link>
        <h1 className="mt-6 mb-2 text-4xl font-bold">Terms of Service</h1>
        <p className="mb-10 text-sm text-muted-foreground">Last updated: {UPDATED}</p>

        <div className="space-y-8 leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-2 text-xl font-semibold text-foreground">Acceptance of terms</h2>
            <p>
              By submitting our demo form or using Bookee ("the Service"), you agree to these Terms of Service. If you
              do not agree, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-foreground">The Service</h2>
            <p>
              Bookee is an AI-powered booking assistant that can place automated phone calls and schedule meetings on
              behalf of a business. When you submit our form and provide consent, you authorize us to place an
              automated call to the number you provided from{" "}
              <span className="font-medium text-foreground">+1 (510) 681-0766</span>.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-foreground">Acceptable use</h2>
            <p>
              You agree to provide accurate information and to use the Service only for lawful purposes. You may not
              use the Service to harass, defraud, or contact individuals without proper authorization or consent.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-foreground">No warranty</h2>
            <p>
              The Service is provided "as is" without warranties of any kind. We do not guarantee that the Service
              will be uninterrupted, error-free, or that any meeting or call will be completed.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-foreground">Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, Bookee shall not be liable for any indirect, incidental, or
              consequential damages arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-foreground">Changes to these terms</h2>
            <p>
              We may update these terms from time to time. Continued use of the Service after changes take effect
              constitutes acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-foreground">Contact</h2>
            <p>
              Questions about these terms? Email{" "}
              <a href="mailto:contact@summerchang.co" className="text-primary hover:underline">
                contact@summerchang.co
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
