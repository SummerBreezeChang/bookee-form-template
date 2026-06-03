import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2, PhoneCall } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Deposit received — Bookee",
}

export default function SetupSuccessPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="bg-background px-6 md:px-12 lg:px-20 py-24 md:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-pale">
            <CheckCircle2 className="h-8 w-8 text-pale-foreground" />
          </span>
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance md:text-5xl">
            Deposit received — you’re in
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base text-muted-foreground leading-relaxed md:text-lg">
            Thanks for committing. Your deposit is credited toward your setup.
          </p>

          <div className="mx-auto mt-8 flex max-w-md items-center gap-3 rounded-2xl border border-line/20 bg-card p-5 text-left">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <PhoneCall className="h-5 w-5" />
            </span>
            <p className="text-sm text-foreground">
              <span className="font-semibold">Bookee will call you shortly</span> from +1 (510) 681-0766 to lock in a
              time. Keep your phone close.
            </p>
          </div>

          <div className="mt-10">
            <Button asChild variant="outline" className="bg-transparent">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
