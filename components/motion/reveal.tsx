"use client"

import type { ReactNode } from "react"
import { motion, type Variants } from "framer-motion"

/** The project's motion DNA — soft deceleration, things slow into rest. */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const VIEWPORT = { once: true, margin: "-15%" } as const

/**
 * Scroll reveal (Pattern #2) — fade up, once only. Set trigger="mount"
 * for the hero cascade (Pattern #1). Vertical movement only.
 */
export function Reveal({
  children,
  className,
  y = 20,
  delay = 0,
  duration = 0.9,
  trigger = "inView",
}: {
  children: ReactNode
  className?: string
  y?: number
  delay?: number
  duration?: number
  trigger?: "inView" | "mount"
}) {
  const animateProps =
    trigger === "mount"
      ? { animate: { opacity: 1, y: 0 } }
      : { whileInView: { opacity: 1, y: 0 }, viewport: VIEWPORT }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      transition={{ duration, ease: EASE, delay }}
      {...animateProps}
    >
      {children}
    </motion.div>
  )
}

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
}

/** Staggered list container (Pattern #6) — children cascade 0.12s apart. */
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  )
}

/** Opacity-only reveal for metadata/labels — settles subdued (Pattern #7). */
export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.85,
  to = 1,
}: {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  to?: number
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: to }}
      viewport={VIEWPORT}
      transition={{ duration, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}
