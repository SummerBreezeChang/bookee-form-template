"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Phone } from "lucide-react"
import { useState } from "react"
import { submitDemoRequest } from "@/app/actions/submit-demo"
import { CropFrame, SectionLabel } from "@/components/spade-ui"
import { Reveal } from "@/components/motion/reveal"

const CONSENT_TEXT =
  "I agree to receive an automated demo call at the number I provided. Consent is not a condition of purchase, and message and data rates may apply."

export function DemoSection() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [consent, setConsent] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    businessUrl: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const result = await submitDemoRequest({ ...formData, consent, consentText: CONSENT_TEXT })

    if (result.success) {
      alert("Demo request submitted! We'll call you shortly.")
      setFormData({ name: "", email: "", phone: "", businessUrl: "" })
      setConsent(false)
    } else {
      setError(result.error || "Failed to submit. Please try again.")
    }

    setIsLoading(false)
  }

  return (
    <section id="demo" className="scroll-mt-24 bg-background">
      {/* Pin: the section holds (~50vh) when scrolled to, then releases (lg+). */}
      <div className="relative lg:h-[150vh]">
        <div className="flex items-center justify-center px-6 md:px-12 lg:px-20 py-20 md:py-28 lg:sticky lg:top-0 lg:min-h-screen lg:py-0">
          <div className="mx-auto w-full max-w-xl">
        <Reveal className="mb-8 flex justify-center">
          <SectionLabel icon={Phone} label="Live Demo" />
        </Reveal>
        <Reveal delay={0.1} className="text-center mb-8">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-balance">
            Hear it call you — live
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Enter your details and Bookee will call you in seconds, just like it would your next client.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
        <CropFrame>
          <div className="rounded-2xl bg-card p-8 shadow-sm border">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-mono text-xs uppercase tracking-wider">
                  Full Name
                </Label>
                <Input
                  id="name"
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="font-mono text-xs uppercase tracking-wider">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="font-mono text-xs uppercase tracking-wider">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessUrl" className="font-mono text-xs uppercase tracking-wider">
                  Business Website URL
                </Label>
                <Input
                  id="businessUrl"
                  type="url"
                  placeholder="https://yourbusiness.com"
                  value={formData.businessUrl}
                  onChange={(e) => setFormData({ ...formData, businessUrl: e.target.value })}
                  required
                />
              </div>

              <div className="flex items-start gap-3 pt-1">
                <input
                  id="consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  required
                  className="mt-1 h-4 w-4 shrink-0 rounded border-input accent-primary"
                />
                <Label htmlFor="consent" className="text-xs font-normal leading-relaxed text-muted-foreground">
                  {CONSENT_TEXT}
                </Label>
              </div>

              {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

              <Button type="submit" className="w-full" size="lg" disabled={isLoading || !consent}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Have Bookee Call You"
                )}
              </Button>
            </form>
          </div>
        </CropFrame>
        </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
