import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { DemoSection } from "@/components/demo-section"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <DemoSection />
      <Footer />
    </main>
  )
}
