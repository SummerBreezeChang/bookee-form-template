import type { Metadata } from "next"
import { BookSetupFlow } from "@/components/book-setup-flow"

export const metadata: Metadata = {
  title: "Book a Setup Call — Bookee",
  description: "Choose how you’d like Bookee set up, put down a deposit, and we’ll call you to schedule.",
}

export default async function BookSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>
}) {
  const params = await searchParams
  return (
    <main className="min-h-screen bg-background">
      <BookSetupFlow canceled={params.canceled === "1"} />
    </main>
  )
}
