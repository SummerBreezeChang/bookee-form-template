import type React from "react"
import type { LucideIcon } from "lucide-react"

/**
 * Shared "Spade-style" primitives: mono category labels, stat pills,
 * crop-mark frames, mono data fields, and chamfered dark sections.
 * Reused across every section to keep the blueprint aesthetic consistent.
 */

type Tone = "light" | "dark"

/** Icon badge + monospace ALL-CAPS category label that heads each section. */
export function SectionLabel({
  icon: Icon,
  label,
  tone = "light",
}: {
  icon: LucideIcon
  label: string
  tone?: Tone
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <span
        className={`font-mono text-xs font-semibold uppercase tracking-[0.18em] ${
          tone === "dark" ? "text-surface-dark-muted" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </div>
  )
}

/** Pale pill with an oversized number + mono caption (e.g. "<60s RESPONSE TIME"). */
export function StatPill({
  value,
  label,
  tone = "light",
}: {
  value: string
  label: string
  tone?: Tone
}) {
  return (
    <div
      className={`inline-flex items-center gap-3 rounded-xl px-5 py-3 ${
        tone === "dark" ? "border border-surface-dark-border bg-white/5" : "bg-pale"
      }`}
    >
      <span
        className={`font-heading text-2xl font-bold leading-none ${
          tone === "dark" ? "text-surface-dark-foreground" : "text-foreground"
        }`}
      >
        {value}
      </span>
      <span
        className={`font-mono text-[11px] font-semibold uppercase tracking-[0.14em] leading-tight ${
          tone === "dark" ? "text-surface-dark-muted" : "text-pale-foreground"
        }`}
      >
        {label}
      </span>
    </div>
  )
}

/**
 * Plain content wrapper. (Previously drew technical crop-mark brackets at
 * each corner — removed by request. Kept as a passthrough so call sites and
 * their max-width/centering classes stay intact.)
 */
export function CropFrame({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
  tone?: Tone
}) {
  return <div className={`relative ${className}`}>{children}</div>
}

/** A thin-bordered box with a "▸ LABEL" mono header and value content. */
export function MonoField({
  label,
  children,
  tone = "light",
}: {
  label: string
  children: React.ReactNode
  tone?: Tone
}) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 ${
        tone === "dark" ? "border-surface-dark-border bg-white/[0.03]" : "border-line/25 bg-card"
      }`}
    >
      <div
        className={`font-mono text-[10px] font-semibold uppercase tracking-[0.18em] ${
          tone === "dark" ? "text-surface-dark-muted" : "text-primary"
        }`}
      >
        {"▸"} {label}
      </div>
      <div
        className={`mt-1 font-mono text-sm leading-relaxed ${
          tone === "dark" ? "text-surface-dark-foreground" : "text-foreground"
        }`}
      >
        {children}
      </div>
    </div>
  )
}

/** Full-width deep-navy section with chamfered corners (the dark Spade band). */
export function DarkSection({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`chamfer bg-surface-dark text-surface-dark-foreground ${className}`}>{children}</div>
  )
}
