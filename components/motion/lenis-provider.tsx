"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { ReactLenis } from "lenis/react"
import { MotionConfig } from "framer-motion"

/**
 * Global smooth scroll (Lenis) + Framer reduced-motion handling.
 * Config per the motion guide: duration 1.2, expo easing, smoothWheel.
 * Smooth scroll is disabled when the user prefers reduced motion, and
 * MotionConfig reducedMotion="user" makes all Framer transforms respect it.
 */
export function LenisProvider({ children }: { children: ReactNode }) {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  return (
    <ReactLenis
      root
      options={{
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: !reduced,
      }}
    >
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </ReactLenis>
  )
}
