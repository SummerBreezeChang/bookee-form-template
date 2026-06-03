import Link from "next/link"

export const metadata = {
  title: "Privacy Policy — Bookee",
  description: "How Bookee collects, uses, and protects your information.",
}

const UPDATED = "May 31, 2026"

export default function PrivacyPage() {
  return (
    <main className="bg-background px-6 py-16 md:px-12 lg:px-20 md:py-24">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-primary hover:underline">
          ← Back to home
        </Link>
        <h1 className="mt-6 mb-2 text-4xl font-bold">Privacy Policy</h1>
        <p className="mb-10 text-sm text-muted-foreground">Last updated: {UPDATED}</p>

        <div className="space-y-8 leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-2 text-xl font-semibold text-foreground">Overview</h2>
            <p>
              Bookee ("we", "us") provides an AI-powered booking assistant that contacts leads on behalf of
              businesses to schedule meetings. This policy explains what information we collect when you submit our
              demo form or interact with our assistant, and how we use it.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-foreground">Information we collect</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Contact details you provide: name, email address, and phone number.</li>
              <li>Your business website URL and information we summarize from it.</li>
              <li>Your consent to be contacted, including the date, time, and exact consent language shown.</li>
              <li>Call-related data such as call status, timestamps, recordings, and transcripts.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-foreground">How we use your information</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>To place the automated demo call you requested and to schedule meetings.</li>
              <li>To send calendar invitations and meeting confirmations.</li>
              <li>To improve the quality and reliability of our assistant.</li>
              <li>To maintain records of consent and communications.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-foreground">Calls and consent</h2>
            <p>
              We only place automated calls to people who have submitted our form and explicitly agreed to be
              contacted. Calls come from <span className="font-medium text-foreground">+1 (510) 681-0766</span>. You
              may opt out at any time by telling our assistant you no longer wish to be contacted, or by emailing us
              at the address below. Consent is not a condition of any purchase.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-foreground">Service providers</h2>
            <p>
              We share data with the vendors that power our service, including Google (calendar and email
              invitations), Twilio (telephony), and our AI processing providers, solely to deliver the service you
              requested. We do not sell your personal information.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-foreground">Data retention</h2>
            <p>
              We retain your information for as long as needed to provide the service and to keep records of consent
              and communications, after which it is deleted or anonymized.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-foreground">Your choices</h2>
            <p>
              You may request access to, correction of, or deletion of your personal information, and you may opt out
              of further contact, by emailing us at{" "}
              <a href="mailto:contact@summerchang.co" className="text-primary hover:underline">
                contact@summerchang.co
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-foreground">Contact</h2>
            <p>
              Questions about this policy? Email{" "}
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
