"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, ArrowRight, Check, Loader2, ShieldCheck, Github, Plug } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CropFrame, SectionLabel } from "@/components/spade-ui"
import { SETUP_PACKAGES, depositDisplay, DEPOSIT_PCT, SELF_DEPLOY_GITHUB_URL } from "@/lib/setup-packages"
import { createSetupCheckout } from "@/app/actions/create-setup-checkout"
import { EASE } from "@/components/motion/reveal"

const CONSENT_TEXT =
  "I agree to receive an automated call from Bookee at the number I provide to schedule my setup call. Consent is not a condition of purchase, and message and data rates may apply."

// How long the Done-For-You card lingers at center before it zooms into the form.
const CENTER_HOLD_MS = 850

export function BookSetupFlow({ canceled }: { canceled?: boolean }) {
  const [selected, setSelected] = useState<string | null>(null)
  // For the paid tier: "center" = card has flown to the middle, "form" = morphed into the form.
  const [dfyPhase, setDfyPhase] = useState<"center" | "form">("center")
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ name: "", email: "", phone: "" })
  const phaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pkg = SETUP_PACKAGES.find((p) => p.id === selected)

  useEffect(() => () => {
    if (phaseTimer.current) clearTimeout(phaseTimer.current)
  }, [])

  const choose = (p: (typeof SETUP_PACKAGES)[number]) => {
    setError("")
    setSelected(p.id)
    if (p.price > 0) {
      // Done-For-You: land at center first, then zoom into the form.
      setDfyPhase("center")
      if (phaseTimer.current) clearTimeout(phaseTimer.current)
      phaseTimer.current = setTimeout(() => setDfyPhase("form"), CENTER_HOLD_MS)
    }
  }

  const reset = () => {
    if (phaseTimer.current) clearTimeout(phaseTimer.current)
    setSelected(null)
    setDfyPhase("center")
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pkg) return
    setLoading(true)
    setError("")
    const result = await createSetupCheckout({
      packageId: pkg.id,
      name: form.name,
      email: form.email,
      phone: form.phone,
      consent,
      consentText: CONSENT_TEXT,
    })
    if (result.success && result.url) {
      window.location.href = result.url
    } else {
      setError(result.success ? "Could not start checkout." : result.error)
      setLoading(false)
    }
  }

  // Which view is on stage right now.
  const view = !pkg ? "grid" : pkg.price === 0 ? "self" : dfyPhase === "center" ? "dfy-center" : "dfy-form"

  return (
    <section className="bg-background px-6 md:px-12 lg:px-20 py-16 md:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-3xl mb-10">
          <SectionLabel icon={Plug} label="Book a Setup Call" />
          <h1 className="mt-5 font-heading text-4xl font-semibold tracking-tight text-balance md:text-5xl">
            Let’s get Bookee live for you
          </h1>
          <p className="mt-4 text-base text-muted-foreground text-pretty md:text-lg leading-relaxed">
            Two ways to go: grab the <span className="font-semibold text-foreground">free, open-source</span> build on
            GitHub and run it yourself, or have us <span className="font-semibold text-foreground">build it for you</span>{" "}
            — put down a {Math.round(DEPOSIT_PCT * 100)}% deposit and Bookee calls you to lock in a time.
          </p>
        </div>

        {canceled && (
          <div className="mb-8 rounded-lg border border-line/20 bg-card px-4 py-3 text-sm text-muted-foreground">
            Checkout canceled — no charge was made. Pick a package whenever you’re ready.
          </div>
        )}

        <div className="relative">
          <AnimatePresence mode="wait">
            {/* ── Step 1: choose a package ───────────────────────────── */}
            {view === "grid" && (
              <motion.div
                key="grid"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="grid gap-6 md:grid-cols-2"
              >
                {SETUP_PACKAGES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => choose(p)}
                    className="flex flex-col rounded-2xl border-2 border-line/15 bg-card p-6 text-left transition-colors hover:border-primary/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {p.recommended ? "Most popular" : "Package"}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <h3 className="mt-3 font-heading text-2xl font-semibold">{p.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{p.tagline}</p>
                    {p.price === 0 ? (
                      <>
                        <div className="mt-5 font-heading text-3xl font-bold">Free</div>
                        <div className="mt-1 font-mono text-xs text-primary">Open source · MIT</div>
                      </>
                    ) : (
                      <>
                        <div className="mt-5 font-heading text-3xl font-bold">
                          ${p.price.toLocaleString()}
                          <span className="ml-1 font-sans text-sm font-medium text-muted-foreground">project</span>
                        </div>
                        <div className="mt-1 font-mono text-xs text-primary">${depositDisplay(p.price)} deposit today</div>
                      </>
                    )}
                    <ul className="mt-5 space-y-2">
                      {p.points.map((pt) => (
                        <li key={pt} className="flex items-start gap-2 text-sm text-foreground">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </motion.div>
            )}

            {/* ── Self-Deploy: grid fades out, this fades in ─────────── */}
            {view === "self" && (
              <motion.div
                key="self"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <CropFrame className="mx-auto max-w-2xl">
                  <div className="rounded-2xl border border-line/20 bg-card p-8 text-center">
                    <h3 className="font-heading text-2xl font-semibold">Self-Deploy — free &amp; open source</h3>
                    <p className="mt-3 text-muted-foreground leading-relaxed">
                      Grab the full template and build guide on GitHub, then run Bookee on your own stack. You own
                      everything — no fees.
                    </p>
                    <Button asChild size="lg" className="mt-6">
                      <a href={SELF_DEPLOY_GITHUB_URL} target="_blank" rel="noreferrer">
                        <Github className="mr-2 h-5 w-5" />
                        Get it on GitHub
                      </a>
                    </Button>
                  </div>
                </CropFrame>
                <BackLink onClick={reset} />
              </motion.div>
            )}

            {/* ── Done-For-You, beat 1: the card flies to center ─────── */}
            {view === "dfy-center" && pkg && (
              <motion.div
                key="dfy-center"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.45, ease: EASE }}
                className="mx-auto max-w-md"
              >
                <div className="rounded-2xl border-2 border-primary bg-card p-8 text-center shadow-lg">
                  <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Most popular
                  </span>
                  <h3 className="mt-3 font-heading text-3xl font-semibold">{pkg.name}</h3>
                  <div className="mt-4 font-heading text-4xl font-bold">${pkg.price.toLocaleString()}</div>
                  <div className="mt-1 font-mono text-xs text-primary">${depositDisplay(pkg.price)} deposit today</div>
                  <p className="mt-5 flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Preparing your details…
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── Done-For-You, beat 2: zoom in with the form ────────── */}
            {view === "dfy-form" && pkg && (
              <motion.div
                key="dfy-form"
                initial={{ opacity: 0, scale: 0.7, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 140, damping: 18 }}
              >
                <CropFrame className="mx-auto max-w-2xl">
                  <form onSubmit={handleSubmit} className="rounded-2xl border border-line/20 bg-card p-8">
                    <div className="mb-6 flex items-center justify-between border-b border-line/15 pb-5">
                      <div>
                        <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Your plan</div>
                        <div className="font-heading text-xl font-semibold">{pkg.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-heading text-2xl font-bold">${depositDisplay(pkg.price)}</div>
                        <div className="font-mono text-[11px] uppercase tracking-wider text-primary">deposit today</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="font-mono text-xs uppercase tracking-wider">
                          Full Name
                        </Label>
                        <Input
                          id="name"
                          placeholder="John Smith"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
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
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
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

                      <Button type="submit" size="lg" className="w-full" disabled={loading || !consent}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Redirecting to secure checkout…
                          </>
                        ) : (
                          <>
                            Pay ${depositDisplay(pkg.price)} deposit
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </Button>

                      <p className="flex items-center justify-center gap-2 text-center font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Secure payment via Stripe · credited toward your build
                      </p>
                      <p className="text-center text-xs leading-relaxed text-muted-foreground">
                        <span className="font-semibold text-foreground">Fully refundable.</span> The deposit just holds
                        your spot and shows you’re serious. On the call, if we’re a fit it’s credited toward your build —
                        if not, you get 100% back, no questions asked.
                      </p>
                    </div>
                  </form>
                </CropFrame>
                <BackLink onClick={reset} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <div className="mt-6 text-center">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Choose a different package
      </button>
    </div>
  )
}
